from rest_framework import serializers
from apps.catalog.models import Product, ProductVariant
from apps.catalog.serializers import ProductListSerializer, VariantSerializer
from apps.users.models import Address
from apps.users.serializers import UserSerializer
from .models import Cart, CartItem, Coupon, Notification, Order, OrderItem, Payment, ShippingMethod, WishlistItem
from .services import create_order, unit_price

class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)
    variant_detail = VariantSerializer(source="variant", read_only=True)
    unit_price = serializers.SerializerMethodField(); total_price = serializers.SerializerMethodField()
    class Meta: model = CartItem; fields = ["id", "product", "variant", "quantity", "product_detail", "variant_detail", "unit_price", "total_price"]
    def get_unit_price(self, obj): return unit_price(obj)
    def get_total_price(self, obj): return unit_price(obj) * obj.quantity
    def validate(self, attrs):
        variant = attrs.get("variant", getattr(self.instance, "variant", None)); product = attrs.get("product", getattr(self.instance, "product", None))
        if variant and variant.product_id != product.id: raise serializers.ValidationError("تنوع انتخابی متعلق به این محصول نیست.")
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", 1))
        if variant and quantity > variant.stock: raise serializers.ValidationError("موجودی کافی نیست.")
        return attrs

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True); subtotal = serializers.SerializerMethodField(); item_count = serializers.SerializerMethodField()
    class Meta: model = Cart; fields = ["id", "items", "subtotal", "item_count", "updated_at"]
    def get_subtotal(self, obj): return sum(unit_price(i) * i.quantity for i in obj.items.all())
    def get_item_count(self, obj): return sum(i.quantity for i in obj.items.all())

class WishlistItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)
    class Meta: model = WishlistItem; fields = ["id", "product", "product_detail", "created_at"]

class ShippingMethodSerializer(serializers.ModelSerializer):
    class Meta: model = ShippingMethod; fields = "__all__"

class CouponSerializer(serializers.ModelSerializer):
    class Meta: model = Coupon; fields = "__all__"

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta: model = OrderItem; fields = "__all__"

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True); shipping_method_name = serializers.CharField(source="shipping_method.name", read_only=True)
    class Meta: model = Order; fields = ["id", "order_number", "shipping_address_snapshot", "shipping_method", "shipping_method_name", "subtotal", "discount", "shipping_cost", "final_amount", "status", "payment_status", "items", "created_at"]

class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(); shipping_method_id = serializers.IntegerField(); coupon_code = serializers.CharField(required=False, allow_blank=True)
    def validate_address_id(self, value):
        if not Address.objects.filter(pk=value, user=self.context["request"].user).exists(): raise serializers.ValidationError("آدرس معتبر نیست.")
        return value
    def create(self, validated_data):
        user = self.context["request"].user
        return create_order(user=user, address=Address.objects.get(pk=validated_data["address_id"], user=user), shipping_method=ShippingMethod.objects.get(pk=validated_data["shipping_method_id"], is_active=True), coupon_code=validated_data.get("coupon_code", ""))

class PaymentSerializer(serializers.ModelSerializer):
    class Meta: model = Payment; fields = ["id", "order", "amount", "provider", "authority", "transaction_id", "status", "created_at", "paid_at"]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta: model = Notification; fields = "__all__"; read_only_fields = ["user"]

class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    attributes = serializers.SerializerMethodField()
    class Meta: model = ProductVariant; fields = ["id", "product", "product_name", "sku", "price", "stock", "low_stock_threshold", "is_active", "attributes"]
    def get_attributes(self, obj) -> list[str]: return [str(value) for value in obj.attributes.all()]

class AdminUserSerializer(UserSerializer):
    order_count = serializers.IntegerField(read_only=True)
    class Meta(UserSerializer.Meta): fields = UserSerializer.Meta.fields + ["is_active", "order_count"]
