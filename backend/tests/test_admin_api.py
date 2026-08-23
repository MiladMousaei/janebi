import pytest
from apps.catalog.models import Review
from apps.users.models import User

@pytest.fixture
def admin(db):
    return User.objects.create_superuser(email="admin@test.com", phone="09120009999", password="StrongPass123!")

@pytest.mark.django_db
def test_admin_dashboard_and_product_extras(api, admin, product):
    api.force_authenticate(admin)
    stats = api.get("/api/v1/admin/stats/")
    assert stats.status_code == 200
    assert {"revenue_today", "pending_orders", "recent_orders", "top_products"} <= set(stats.data)
    response = api.patch(f"/api/v1/products/{product.slug}/", {"primary_image_url": "https://images.example.com/product.jpg", "variant_sku": "V-UPDATED", "variant_stock": 17, "is_featured": True}, format="json")
    assert response.status_code == 200
    product.refresh_from_db(); variant = product.variants.first()
    assert product.is_featured and product.images.filter(external_url="https://images.example.com/product.jpg", is_primary=True).exists()
    assert variant.sku == "V-UPDATED" and variant.stock == 17

@pytest.mark.django_db
def test_admin_can_moderate_review_and_block_user(api, admin, user, product):
    review = Review.objects.create(product=product, user=user, rating=5, title="عالی", comment="کیفیت خوب")
    api.force_authenticate(admin)
    response = api.patch(f"/api/v1/reviews/{review.id}/moderate/", {"is_approved": True}, format="json")
    assert response.status_code == 200
    review.refresh_from_db(); assert review.is_approved
    response = api.patch(f"/api/v1/admin/users/{user.id}/set_active/", {"is_active": False}, format="json")
    assert response.status_code == 200
    user.refresh_from_db(); assert not user.is_active
