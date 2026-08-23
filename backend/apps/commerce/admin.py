from django.contrib import admin
from .models import Cart, CartItem, Coupon, CouponUsage, Notification, Order, OrderItem, Payment, ShippingMethod, Wishlist, WishlistItem
class OrderItemInline(admin.TabularInline): model = OrderItem; extra = 0; can_delete = False
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "user", "final_amount", "status", "payment_status", "created_at"]
    list_filter = ["status", "payment_status", "created_at"]
    search_fields = ["order_number", "user__email", "user__phone"]
    readonly_fields = ["order_number", "subtotal", "discount", "shipping_cost", "final_amount", "shipping_address_snapshot"]
    inlines = [OrderItemInline]
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["authority", "order", "amount", "status", "paid_at"]
    list_filter = ["status", "provider"]
    readonly_fields = ["authority", "transaction_id", "amount"]
admin.site.register([Cart, CartItem, Wishlist, WishlistItem, ShippingMethod, Coupon, CouponUsage, Notification])
