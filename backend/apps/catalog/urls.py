from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BrandViewSet, CategoryViewSet, ProductViewSet, ReviewViewSet, product_image_content
router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("brands", BrandViewSet, basename="brand")
router.register("products", ProductViewSet, basename="product")
router.register("reviews", ReviewViewSet, basename="review")
urlpatterns = [
    path("product-images/<int:pk>/content/", product_image_content, name="product-image-content"),
    path("", include(router.urls)),
]
