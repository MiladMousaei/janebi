import pytest
from rest_framework.test import APIClient
from apps.catalog.models import Brand, Category, Product, ProductVariant
from apps.commerce.models import Cart, CartItem, ShippingMethod
from apps.users.models import Address, User

@pytest.fixture
def api():
    return APIClient()

@pytest.fixture
def user(db):
    return User.objects.create_user(email="user@test.com", phone="09121111111", password="StrongPass123!")

@pytest.fixture
def product(db):
    category = Category.objects.create(name="شارژر", slug="charger")
    brand = Brand.objects.create(name="Anker", slug="anker")
    product = Product.objects.create(name="شارژر سریع", slug="fast-charger", description="test", category=category, brand=brand, base_price=1000000, sku="P-1")
    ProductVariant.objects.create(product=product, sku="V-1", price=1100000, stock=10)
    return product

@pytest.fixture
def checkout_data(user, product):
    address = Address.objects.create(user=user, recipient_name="تست", phone=user.phone, province="تهران", city="تهران", address="نشانی", postal_code="1234567890")
    shipping = ShippingMethod.objects.create(name="پست", price=50000)
    cart = Cart.objects.create(user=user)
    CartItem.objects.create(cart=cart, product=product, variant=product.variants.first(), quantity=2)
    return {"address_id": address.id, "shipping_method_id": shipping.id}
