from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import User
from .models import SalesForecast


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
