from dataclasses import dataclass
from uuid import uuid4
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.catalog.models import ProductVariant
from .models import Cart, Coupon, CouponUsage, Notification, Order, OrderItem, Payment
from apps.core.services.email import send_order_created_email

def unit_price(item):
    return item.variant.effective_price if item.variant else item.product.base_price

def calculate_coupon(coupon, subtotal, user):
    now = timezone.now()
    if not coupon or not coupon.is_active or not (coupon.start_date <= now <= coupon.expiration_date): raise ValidationError("کوپن معتبر نیست یا منقضی شده است.")
    if subtotal < coupon.minimum_order_amount: raise ValidationError("حداقل مبلغ سفارش برای این کوپن رعایت نشده است.")
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit: raise ValidationError("ظرفیت استفاده از کوپن تکمیل شده است.")
    if coupon.usages.filter(user=user).count() >= coupon.user_usage_limit: raise ValidationError("سقف استفاده شما از این کوپن تکمیل شده است.")
    discount = subtotal * coupon.discount_value // 100 if coupon.discount_type == Coupon.PERCENTAGE else coupon.discount_value
    if coupon.maximum_discount: discount = min(discount, coupon.maximum_discount)
    return min(discount, subtotal)

@transaction.atomic
def create_order(*, user, address, shipping_method, coupon_code=""):
    cart = Cart.objects.select_for_update().filter(user=user).first()
    if not cart: raise ValidationError("سبد خرید خالی است.")
    items = list(cart.items.select_related("product", "variant"))
    if not items: raise ValidationError("سبد خرید خالی است.")
    rows = []; subtotal = 0
    for item in items:
        if not item.variant_id: raise ValidationError(f"برای {item.product.name} تنوع انتخاب نشده است.")
        variant = ProductVariant.objects.select_for_update().select_related("product").get(pk=item.variant_id)
        if not variant.is_active or not variant.product.is_active: raise ValidationError(f"{variant.product.name} در دسترس نیست.")
        if variant.stock < item.quantity: raise ValidationError(f"موجودی {variant.product.name} کافی نیست.")
        price = variant.effective_price; subtotal += price * item.quantity; rows.append((item, variant, price))
    coupon = Coupon.objects.select_for_update().filter(code__iexact=coupon_code.strip()).first() if coupon_code else None
    discount = calculate_coupon(coupon, subtotal, user) if coupon else 0
    shipping_cost = shipping_method.price
    snapshot = {"recipient_name": address.recipient_name, "phone": address.phone, "province": address.province, "city": address.city, "address": address.address, "postal_code": address.postal_code, "plaque": address.plaque, "unit": address.unit}
    order = Order.objects.create(user=user, shipping_address_snapshot=snapshot, shipping_method=shipping_method, coupon=coupon, subtotal=subtotal, discount=discount, shipping_cost=shipping_cost, final_amount=subtotal - discount + shipping_cost)
    for item, variant, price in rows:
        ProductVariant.objects.filter(pk=variant.pk, stock__gte=item.quantity).update(stock=F("stock") - item.quantity)
        OrderItem.objects.create(order=order, product=item.product, variant=variant, product_name=item.product.name, sku=variant.sku, quantity=item.quantity, unit_price=price, total_price=price * item.quantity)
    if coupon:
        Coupon.objects.filter(pk=coupon.pk).update(used_count=F("used_count") + 1)
        CouponUsage.objects.create(coupon=coupon, user=user, order=order)
    cart.items.all().delete()
    Notification.objects.create(user=user, kind="order_created", title="سفارش ثبت شد", message=f"سفارش {order.order_number} با موفقیت ثبت شد.")
    transaction.on_commit(lambda: send_order_created_email(order))
    return order

@transaction.atomic
def cancel_order(order):
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.status not in ["pending", "paid", "processing"]: raise ValidationError("این سفارش قابل لغو نیست.")
    for item in order.items.select_related("variant"):
        if item.variant_id: ProductVariant.objects.filter(pk=item.variant_id).update(stock=F("stock") + item.quantity)
    if order.coupon_id:
        Coupon.objects.filter(pk=order.coupon_id, used_count__gt=0).update(used_count=F("used_count") - 1)
        CouponUsage.objects.filter(order=order).delete()
    order.status = "cancelled"; order.save(update_fields=["status", "updated_at"])
    return order

class MockPaymentGateway:
    provider = "mock"
    @staticmethod
    def create(order):
        return Payment.objects.create(order=order, amount=order.final_amount, provider="mock", authority=uuid4().hex)
    @staticmethod
    @transaction.atomic
    def callback(authority, success):
        payment = Payment.objects.select_for_update().select_related("order").get(authority=authority)
        if payment.status != "pending": return payment
        if success:
            payment.status = "paid"; payment.transaction_id = f"MOCK-{uuid4().hex[:12].upper()}"; payment.paid_at = timezone.now()
            payment.order.status = "paid"; payment.order.payment_status = "paid"; payment.order.save(update_fields=["status", "payment_status", "updated_at"])
            Notification.objects.create(user=payment.order.user, kind="payment_success", title="پرداخت موفق", message=f"پرداخت سفارش {payment.order.order_number} تایید شد.")
        else:
            payment.status = "failed"; payment.order.payment_status = "failed"; payment.order.save(update_fields=["payment_status", "updated_at"])
        payment.save(update_fields=["status", "transaction_id", "paid_at", "updated_at"])
        return payment
