import os
from io import BytesIO
from unittest.mock import patch
from urllib import error as urllib_error

from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalog.models import Brand, Category, Product
from apps.users.models import User
from .models import SalesForecast, WishlistItem


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
