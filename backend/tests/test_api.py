import pytest
from django.utils import timezone
from apps.commerce.models import Coupon, Notification
from apps.users.models import User

@pytest.mark.django_db
def test_register_login_refresh(api):
    payload = {"first_name": "علی", "last_name": "رضایی", "phone": "09122222222", "email": "ali@test.com", "password": "StrongPass123!", "confirm_password": "StrongPass123!"}
    assert api.post("/api/v1/auth/register/", payload).status_code == 201
    response = api.post("/api/v1/auth/login/", {"identifier": payload["phone"], "password": payload["password"]})
    assert response.status_code == 200 and "access" in response.data
    assert api.post("/api/v1/auth/refresh/", {"refresh": response.data["refresh"]}).status_code == 200

@pytest.mark.django_db
def test_register_without_email_and_six_character_password(api):
    payload = {"first_name": "سارا", "last_name": "محمدی", "phone": "09124444444", "password": "abc123", "confirm_password": "abc123"}
    response = api.post("/api/v1/auth/register/", payload, format="json")
    assert response.status_code == 201
    user = User.objects.get(phone=payload["phone"])
    assert user.email is None
    login = api.post("/api/v1/auth/login/", {"identifier": payload["phone"], "password": payload["password"]}, format="json")
    assert login.status_code == 200 and "access" in login.data

@pytest.mark.django_db
def test_register_rejects_short_password_in_persian(api):
    payload = {"first_name": "سارا", "last_name": "محمدی", "phone": "09125555555", "password": "12345", "confirm_password": "12345"}
    response = api.post("/api/v1/auth/register/", payload, format="json")
    assert response.status_code == 400
    assert "حداقل ۶ کاراکتر" in str(response.data["errors"]["password"][0])

@pytest.mark.django_db
def test_products_search_and_filter(api, product):
    assert api.get("/api/v1/products/?search=شارژر&availability=true").status_code == 200

@pytest.mark.django_db
def test_cart_requires_auth(api, product):
    response = api.post("/api/v1/cart/add/", {"product": product.id, "variant": product.variants.first().id, "quantity": 1})
    assert response.status_code == 401

@pytest.mark.django_db
def test_checkout_decreases_inventory_and_order_is_private(api, user, checkout_data, product):
    api.force_authenticate(user)
    before = product.variants.first().stock
    response = api.post("/api/v1/orders/checkout/", checkout_data, format="json")
    assert response.status_code == 201
    product.variants.first().refresh_from_db()
    assert product.variants.first().stock == before - 2
    other = User.objects.create_user(email="other@test.com", phone="09123333333", password="StrongPass123!")
    api.force_authenticate(other)
    assert api.get(f"/api/v1/orders/{response.data['order_number']}/").status_code == 404

@pytest.mark.django_db
def test_checkout_notifies_active_admins(api, user, checkout_data):
    admin = User.objects.create_user(
        email="orders-admin@test.com", phone="09126666666", password="StrongPass123!", is_staff=True
    )
    api.force_authenticate(user)
    response = api.post("/api/v1/orders/checkout/", checkout_data, format="json")
    assert response.status_code == 201
    notification = Notification.objects.get(user=admin, kind="order_created")
    assert response.data["order_number"] in notification.message

@pytest.mark.django_db
def test_mock_payment(api, user, checkout_data):
    api.force_authenticate(user)
    order = api.post("/api/v1/orders/checkout/", checkout_data, format="json").data
    payment = api.post("/api/v1/payments/create_payment/", {"order_id": order["id"]}, format="json")
    assert payment.status_code == 201
    result = api.post(f"/api/v1/payments/mock/{payment.data['authority']}/", {"result": "success"}, format="json")
    assert result.data["status"] == "paid"

@pytest.mark.django_db
def test_coupon_is_calculated_on_server(api, user, checkout_data):
    Coupon.objects.create(code="TEST10", discount_type="percentage", discount_value=10, minimum_order_amount=100000, maximum_discount=500000, usage_limit=2, user_usage_limit=1, start_date=timezone.now()-timezone.timedelta(days=1), expiration_date=timezone.now()+timezone.timedelta(days=1))
    api.force_authenticate(user)
    response = api.post("/api/v1/orders/checkout/", {**checkout_data, "coupon_code": "TEST10"}, format="json")
    assert response.status_code == 201
    assert response.data["discount"] == 220000
