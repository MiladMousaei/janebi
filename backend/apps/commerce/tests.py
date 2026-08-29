import os
from io import BytesIO
from unittest.mock import patch
from urllib import error as urllib_error

from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Category, Product
from apps.users.models import User
from .models import Notification, SMSMessage, SalesForecast, StoreConfiguration, Ticket, WishlistItem


class AdminSalesForecastTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="forecast-admin@example.com",
            phone="09120000001",
            password="strong-password",
            is_staff=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)
        self.url = "/api/v1/admin/sales-forecast/"

    @patch("apps.commerce.views._openai_forecast", return_value=("تحلیل آزمایشی", "gpt-test"))
    def test_daily_limit_is_two_successful_forecasts(self, mocked_forecast):
        first = self.client.post(self.url)
        second = self.client.post(self.url)
        third = self.client.post(self.url)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(second.data["remaining_today"], 0)
        self.assertEqual(third.status_code, 429)
        self.assertEqual(SalesForecast.objects.filter(user=self.admin).count(), 2)
        self.assertEqual(mocked_forecast.call_count, 2)

    def test_non_admin_cannot_access_forecast(self):
        customer = User.objects.create_user(
            email="customer@example.com", phone="09120000002", password="strong-password"
        )
        self.client.force_authenticate(customer)
        self.assertEqual(self.client.get(self.url).status_code, 403)

    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"})
    @patch("apps.commerce.views.urllib_request.urlopen")
    def test_credit_error_is_sanitized_and_actionable(self, mocked_urlopen):
        mocked_urlopen.side_effect = urllib_error.HTTPError(
            url="https://api.openai.com/v1/responses",
            code=429,
            msg="Too Many Requests",
            hdrs={},
            fp=BytesIO(b'{"error":{"message":"You have no credits remaining.","code":"credit_balance_exhausted"}}'),
        )

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "openai_quota_exhausted")
        self.assertNotIn("You have no credits", response.data["detail"])
        self.assertEqual(SalesForecast.objects.filter(user=self.admin).count(), 0)


class WishlistFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="wishlist@example.com", phone="09120000003", password="strong-password"
        )
        category = Category.objects.create(name="هدفون", slug="headphones")
        brand = Brand.objects.create(name="Anker", slug="anker")
        self.product = Product.objects.create(
            name="هدفون آزمایشی", slug="test-headphone", sku="WISH-001",
            description="توضیحات", category=category, brand=brand, base_price=1000000,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_add_list_and_remove_wishlist_item(self):
        added = self.client.post("/api/v1/wishlist/add/", {"product": self.product.id}, format="json")
        self.assertEqual(added.status_code, 201)
        self.assertEqual(added.data["product"], self.product.id)

        listed = self.client.get("/api/v1/wishlist/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)
        self.assertEqual(listed.data[0]["product_detail"]["slug"], self.product.slug)

        removed = self.client.delete(f"/api/v1/wishlist/{added.data['id']}/remove/")
        self.assertEqual(removed.status_code, 204)
        self.assertFalse(WishlistItem.objects.filter(wishlist__user=self.user, product=self.product).exists())

    def test_adding_same_product_is_idempotent(self):
        first = self.client.post("/api/v1/wishlist/add/", {"product": self.product.id}, format="json")
        second = self.client.post("/api/v1/wishlist/add/", {"product": self.product.id}, format="json")
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(WishlistItem.objects.filter(wishlist__user=self.user).count(), 1)


class SupportAndStoreManagementTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="support-user@example.com", phone="09120000010", password="strong-password"
        )
        self.admin = User.objects.create_user(
            email="support-admin@example.com", phone="09120000011", password="strong-password", is_staff=True
        )
        self.client = APIClient()

    def test_ticket_conversation_is_shared_with_owner_and_admin(self):
        self.client.force_authenticate(self.user)
        created = self.client.post(
            "/api/v1/tickets/",
            {"subject": "پیگیری سفارش", "category": "order", "message": "سفارش من چه زمانی ارسال می‌شود؟"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["status"], "open")
        self.assertEqual(len(created.data["messages"]), 1)
        self.assertTrue(Notification.objects.filter(user=self.admin, kind="ticket_created").exists())

        self.client.force_authenticate(self.admin)
        replied = self.client.post(
            f"/api/v1/tickets/{created.data['id']}/reply/", {"message": "امروز تحویل پست می‌شود."}, format="json"
        )
        self.assertEqual(replied.status_code, 200)
        self.assertEqual(replied.data["status"], "answered")
        self.assertEqual(len(replied.data["messages"]), 2)
        self.assertTrue(Notification.objects.filter(user=self.user, kind="ticket_reply").exists())

    def test_opening_notifications_can_mark_all_as_read(self):
        Notification.objects.create(user=self.user, kind="test", title="تست", message="پیام خوانده‌نشده")
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/notifications/mark_all_read/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["updated"], 1)
        self.assertFalse(Notification.objects.filter(user=self.user, is_read=False).exists())

    def test_store_configuration_is_public_but_only_admin_can_edit(self):
        public = self.client.get("/api/v1/store-settings/")
        self.assertEqual(public.status_code, 200)
        self.assertTrue(public.data["flash_sale_ends_at"])

        self.client.force_authenticate(self.user)
        self.assertEqual(
            self.client.patch("/api/v1/store-settings/", {"flash_sale_title": "فروش ویژه"}, format="json").status_code,
            403,
        )
        self.client.force_authenticate(self.admin)
        updated = self.client.patch(
            "/api/v1/store-settings/", {"flash_sale_title": "فروش ویژه آخر هفته"}, format="json"
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(StoreConfiguration.load().flash_sale_title, "فروش ویژه آخر هفته")

    @patch.dict(os.environ, {}, clear=False)
    def test_admin_sms_is_queued_without_provider_key_and_creates_notification(self):
        os.environ.pop("KAVENEGAR_API_KEY", None)
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/admin/sms/",
            {"audience": "selected", "user_ids": [self.user.id], "message": "کد تخفیف جدید شما آماده است."},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data[0]["status"], "queued")
        self.assertTrue(SMSMessage.objects.filter(recipient=self.user).exists())
        self.assertTrue(Notification.objects.filter(user=self.user, kind="admin_message").exists())

    def test_admin_can_delete_sms_history(self):
        sms = SMSMessage.objects.create(
            recipient=self.user, phone=self.user.phone, message="پیام آزمایشی", sent_by=self.admin
        )
        self.client.force_authenticate(self.admin)
        response = self.client.delete("/api/v1/admin/sms/", {"id": sms.id}, format="json")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(SMSMessage.objects.filter(pk=sms.id).exists())
