import uuid
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from apps.catalog.models import Product, ProductVariant
from apps.core.models import TimeStampedModel

class Cart(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart")
    def __str__(self): return f"Cart {self.user_id}"

class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    class Meta: constraints = [models.UniqueConstraint(fields=["cart", "product", "variant"], name="unique_cart_product_variant")]

class Wishlist(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    products = models.ManyToManyField(Product, through="WishlistItem", related_name="wishlisted_by")

class WishlistItem(TimeStampedModel):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    class Meta: unique_together = ["wishlist", "product"]

class ShippingMethod(TimeStampedModel):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=250, blank=True)
    price = models.PositiveBigIntegerField(default=0)
    estimated_days = models.PositiveSmallIntegerField(default=3)
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.name

class Coupon(TimeStampedModel):
    PERCENTAGE = "percentage"; FIXED = "fixed"
    code = models.CharField(max_length=40, unique=True, db_index=True)
    discount_type = models.CharField(max_length=12, choices=[(PERCENTAGE, "درصدی"), (FIXED, "مبلغ ثابت")])
    discount_value = models.PositiveBigIntegerField()
    minimum_order_amount = models.PositiveBigIntegerField(default=0)
    maximum_discount = models.PositiveBigIntegerField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    user_usage_limit = models.PositiveIntegerField(default=1)
    start_date = models.DateTimeField(); expiration_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    used_count = models.PositiveIntegerField(default=0)
    def __str__(self): return self.code

class Order(TimeStampedModel):
    STATUSES = [(x, x) for x in ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "returned"]]
    PAYMENT_STATUSES = [(x, x) for x in ["pending", "paid", "failed", "refunded"]]
    order_number = models.CharField(max_length=28, unique=True, db_index=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    shipping_address_snapshot = models.JSONField()
    shipping_method = models.ForeignKey(ShippingMethod, on_delete=models.PROTECT)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.PositiveBigIntegerField(); discount = models.PositiveBigIntegerField(default=0)
    shipping_cost = models.PositiveBigIntegerField(default=0); final_amount = models.PositiveBigIntegerField()
    status = models.CharField(max_length=15, choices=STATUSES, default="pending", db_index=True)
    payment_status = models.CharField(max_length=15, choices=PAYMENT_STATUSES, default="pending", db_index=True)
    class Meta: ordering = ["-created_at"]; indexes = [models.Index(fields=["status", "created_at"])]
    def save(self, *args, **kwargs):
        if not self.order_number: self.order_number = f"JN-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="items")
    product_name = models.CharField(max_length=220)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
    sku = models.CharField(max_length=80)
    quantity = models.PositiveIntegerField(); unit_price = models.PositiveBigIntegerField(); total_price = models.PositiveBigIntegerField()

class CouponUsage(TimeStampedModel):
    coupon = models.ForeignKey(Coupon, on_delete=models.PROTECT, related_name="usages")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    order = models.ForeignKey(Order, on_delete=models.PROTECT)

class Payment(TimeStampedModel):
    STATUSES = [(x, x) for x in ["pending", "paid", "failed", "refunded"]]
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="payments")
    amount = models.PositiveBigIntegerField(); provider = models.CharField(max_length=30, default="mock")
    authority = models.CharField(max_length=80, unique=True, db_index=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=15, choices=STATUSES, default="pending", db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=40); title = models.CharField(max_length=150); message = models.TextField()
    is_read = models.BooleanField(default=False)
