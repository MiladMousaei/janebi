from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import AdminUserViewSet, CartViewSet, CouponViewSet, InventoryViewSet, NotificationViewSet, OrderViewSet, PaymentViewSet, ShippingMethodViewSet, WishlistViewSet, admin_sales_forecast, admin_stats, mock_payment_page
router = DefaultRouter()
router.register("cart", CartViewSet, basename="cart")
router.register("wishlist", WishlistViewSet, basename="wishlist")
router.register("shipping-methods", ShippingMethodViewSet)
router.register("coupons", CouponViewSet)
router.register("orders", OrderViewSet, basename="order")
router.register("payments", PaymentViewSet, basename="payment")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("admin/users", AdminUserViewSet, basename="admin-user")
router.register("admin/inventory", InventoryViewSet, basename="admin-inventory")
urlpatterns = [path("payments/mock/<str:authority>/", mock_payment_page), path("admin/stats/", admin_stats), path("admin/sales-forecast/", admin_sales_forecast), path("", include(router.urls))]
