import json
import os
from urllib import error as urllib_error
from urllib import request as urllib_request

from django.db.models import Count, Sum
from django.db.models.functions import TruncDay
from django.utils import timezone
from django.shortcuts import get_object_or_404, render
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from apps.catalog.models import Product, ProductVariant
from apps.users.models import User
from .models import Cart, CartItem, Coupon, Notification, Order, Payment, SalesForecast, ShippingMethod, Wishlist, WishlistItem
from .serializers import AdminUserSerializer, CartItemSerializer, CartSerializer, CheckoutSerializer, CouponSerializer, InventorySerializer, NotificationSerializer, OrderSerializer, PaymentSerializer, ShippingMethodSerializer, WishlistItemSerializer
from .services import MockPaymentGateway, cancel_order

class CartViewSet(viewsets.ViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    def cart(self): return Cart.objects.get_or_create(user=self.request.user)[0]
    def list(self, request): return Response(CartSerializer(self.cart(), context={"request": request}).data)
    @action(detail=False, methods=["post"])
    def add(self, request):
        cart = self.cart(); serializer = CartItemSerializer(data=request.data, context={"request": request}); serializer.is_valid(raise_exception=True)
        data = serializer.validated_data; item, created = CartItem.objects.get_or_create(cart=cart, product=data["product"], variant=data.get("variant"), defaults={"quantity": data["quantity"]})
        if not created:
            new_quantity = item.quantity + data["quantity"]
            if item.variant and new_quantity > item.variant.stock:
                return Response({"quantity": ["موجودی کافی نیست."]}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = new_quantity; item.save(update_fields=["quantity", "updated_at"])
        return Response(CartSerializer(cart, context={"request": request}).data, status=status.HTTP_201_CREATED)
    @action(detail=True, methods=["patch", "delete"])
    def item(self, request, pk=None):
        item = get_object_or_404(CartItem, pk=pk, cart=self.cart())
        if request.method == "DELETE": item.delete(); return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = CartItemSerializer(item, data=request.data, partial=True); serializer.is_valid(raise_exception=True); serializer.save()
        return Response(CartSerializer(self.cart(), context={"request": request}).data)

class WishlistViewSet(viewsets.ViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    def wishlist(self): return Wishlist.objects.get_or_create(user=self.request.user)[0]
    def list(self, request): return Response(WishlistItemSerializer(self.wishlist().items.select_related("product", "product__brand", "product__category").prefetch_related("product__images", "product__variants", "product__reviews"), many=True, context={"request": request}).data)
    @action(detail=False, methods=["post"])
    def add(self, request):
        product = get_object_or_404(Product, pk=request.data.get("product"), is_active=True); item, _ = WishlistItem.objects.get_or_create(wishlist=self.wishlist(), product=product)
        return Response(WishlistItemSerializer(item, context={"request": request}).data, status=status.HTTP_201_CREATED)
    @action(detail=True, methods=["delete"])
    def remove(self, request, pk=None): get_object_or_404(WishlistItem, pk=pk, wishlist=self.wishlist()).delete(); return Response(status=status.HTTP_204_NO_CONTENT)

class ShippingMethodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ShippingMethod.objects.filter(is_active=True); serializer_class = ShippingMethodSerializer

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all(); serializer_class = CouponSerializer; permission_classes = [permissions.IsAdminUser]

class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer; permission_classes = [permissions.IsAuthenticated]; lookup_field = "order_number"
    def get_queryset(self):
        qs = Order.objects.select_related("shipping_method", "user").prefetch_related("items")
        if getattr(self, "swagger_fake_view", False): return qs.none()
        return qs if self.request.user.is_staff else qs.filter(user=self.request.user)
    @action(detail=False, methods=["post"])
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data, context={"request": request}); serializer.is_valid(raise_exception=True); order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
    @action(detail=True, methods=["post"])
    def cancel(self, request, order_number=None): return Response(OrderSerializer(cancel_order(self.get_object())).data)
    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAdminUser])
    def set_status(self, request, order_number=None):
        order = self.get_object(); new_status = request.data.get("status")
        allowed = {value for value, _ in Order.STATUSES}
        if new_status not in allowed: return Response({"status": ["وضعیت نامعتبر است."]}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status; order.save(update_fields=["status", "updated_at"])
        return Response(OrderSerializer(order).data)

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return Payment.objects.none()
        return Payment.objects.filter(order__user=self.request.user) if not self.request.user.is_staff else Payment.objects.all()
    @action(detail=False, methods=["post"])
    def create_payment(self, request):
        order = get_object_or_404(Order, pk=request.data.get("order_id"), user=request.user, payment_status="pending")
        payment = MockPaymentGateway.create(order)
        return Response({**PaymentSerializer(payment).data, "payment_url": request.build_absolute_uri(f"/api/v1/payments/mock/{payment.authority}/")}, status=status.HTTP_201_CREATED)

@extend_schema(request=OpenApiTypes.OBJECT, responses=PaymentSerializer)
@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def mock_payment_page(request, authority):
    payment = get_object_or_404(Payment, authority=authority)
    if request.method == "POST":
        payment = MockPaymentGateway.callback(authority, request.data.get("result") == "success")
        return Response(PaymentSerializer(payment).data)
    return Response({"authority": authority, "amount": payment.amount, "actions": {"success": "POST result=success", "failure": "POST result=failed"}})

@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def admin_stats(request):
    paid = Order.objects.filter(payment_status="paid")
    chart = paid.annotate(day=TruncDay("created_at")).values("day").annotate(revenue=Sum("final_amount"), orders=Count("id")).order_by("day")[:30]
    recent_orders = Order.objects.select_related("user").order_by("-created_at")[:6]
    top_products = Product.objects.order_by("-sold_count")[:5]
    return Response({"revenue": paid.aggregate(total=Sum("final_amount"))["total"] or 0, "revenue_today": paid.filter(created_at__date=timezone.localdate()).aggregate(total=Sum("final_amount"))["total"] or 0, "orders": Order.objects.count(), "pending_orders": Order.objects.filter(status__in=["pending", "paid", "processing"]).count(), "users": User.objects.count(), "products": Product.objects.count(), "low_stock": ProductVariant.objects.filter(stock__gt=0, stock__lte=5).count(), "out_of_stock": ProductVariant.objects.filter(stock=0).count(), "chart": list(chart), "recent_orders": [{"order_number": order.order_number, "customer": order.user.get_full_name() or order.user.email, "amount": order.final_amount, "status": order.status} for order in recent_orders], "top_products": [{"id": product.id, "name": product.name, "sold_count": product.sold_count} for product in top_products]})

def _forecast_payload():
    since = timezone.now() - timezone.timedelta(days=30)
    paid = Order.objects.filter(payment_status="paid", created_at__gte=since)
    daily = paid.annotate(day=TruncDay("created_at")).values("day").annotate(
        revenue=Sum("final_amount"), orders=Count("id")
    ).order_by("day")
    return {
        "period_days": 30,
        "revenue": paid.aggregate(total=Sum("final_amount"))["total"] or 0,
        "orders": paid.count(),
        "daily_sales": [
            {"day": item["day"].date().isoformat(), "revenue": item["revenue"], "orders": item["orders"]}
            for item in daily
        ],
        "top_products": list(Product.objects.order_by("-sold_count").values("name", "sold_count")[:8]),
        "low_stock_variants": ProductVariant.objects.filter(stock__lte=5).count(),
    }

def _openai_forecast(snapshot):
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("کلید OpenAI در تنظیمات سرور ثبت نشده است.")
    model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
    prompt = (
        "شما تحلیلگر ارشد فروشگاه آنلاین لوازم جانبی دیجیتال هستید. بر اساس داده‌های JSON زیر، "
        "یک پیش‌بینی کاربردی و محتاطانه به فارسی ارائه کنید. شامل: جمع‌بندی روند ۳۰ روز، پیش‌بینی ۷ و ۳۰ روز آینده "
        "با بازه تقریبی، سه عامل ریسک، و چهار اقدام اولویت‌دار برای مدیر. اگر داده کم است صریح بگویید و عددسازی نکنید. "
        "مبالغ تومان هستند. پاسخ حداکثر ۴۵۰ کلمه و با تیترهای کوتاه باشد.\n\n"
        f"داده‌ها: {json.dumps(snapshot, ensure_ascii=False)}"
    )
    body = json.dumps({
        "model": model,
        "input": prompt,
        "max_output_tokens": 700,
        "store": False,
    }).encode("utf-8")
    req = urllib_request.Request(
        "https://api.openai.com/v1/responses",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib_request.urlopen(req, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")[:500]
        raise RuntimeError(f"سرویس هوش مصنوعی پاسخ نامعتبر داد ({exc.code}): {detail}") from exc
    except urllib_error.URLError as exc:
        raise RuntimeError("ارتباط با سرویس هوش مصنوعی برقرار نشد.") from exc
    text = data.get("output_text", "").strip()
    if not text:
        text = "\n".join(
            part.get("text", "")
            for output in data.get("output", [])
            for part in output.get("content", [])
            if part.get("type") == "output_text"
        ).strip()
    if not text:
        raise RuntimeError("سرویس هوش مصنوعی پاسخ متنی برنگرداند.")
    return text, model

@extend_schema(request=None, responses=OpenApiTypes.OBJECT)
@api_view(["GET", "POST"])
@permission_classes([permissions.IsAdminUser])
def admin_sales_forecast(request):
    today = timezone.localdate()
    used_today = SalesForecast.objects.filter(user=request.user, created_at__date=today).count()
    latest = SalesForecast.objects.filter(user=request.user).first()
    base = {
        "used_today": used_today,
        "remaining_today": max(0, 2 - used_today),
        "latest": None if not latest else {
            "content": latest.content,
            "model": latest.model_name,
            "created_at": latest.created_at,
        },
    }
    if request.method == "GET":
        return Response(base)
    if used_today >= 2:
        return Response({**base, "detail": "سهمیه دو پیش‌بینی امروز استفاده شده است."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
    snapshot = _forecast_payload()
    try:
        content, model = _openai_forecast(snapshot)
    except RuntimeError as exc:
        return Response({**base, "detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    forecast = SalesForecast.objects.create(
        user=request.user, content=content, input_snapshot=snapshot, model_name=model
    )
    return Response({
        "used_today": used_today + 1,
        "remaining_today": max(0, 1 - used_today),
        "latest": {"content": forecast.content, "model": forecast.model_name, "created_at": forecast.created_at},
    }, status=status.HTTP_201_CREATED)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer; permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False): return Notification.objects.none()
        return Notification.objects.filter(user=self.request.user)

class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AdminUserSerializer; permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.annotate(order_count=Count("orders")).order_by("-date_joined")
    search_fields = ["email", "phone", "first_name", "last_name"]
    @action(detail=True, methods=["patch"])
    def set_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user: return Response({"detail": "نمی‌توانید حساب مدیر فعلی را غیرفعال کنید."}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = bool(request.data.get("is_active")); user.save(update_fields=["is_active"])
        return Response(self.get_serializer(user).data)

class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventorySerializer; permission_classes = [permissions.IsAdminUser]
    http_method_names = ["get", "patch", "head", "options"]
    queryset = ProductVariant.objects.select_related("product").prefetch_related("attributes__attribute").order_by("stock")
    filterset_fields = ["is_active", "product"]
    search_fields = ["sku", "product__name"]
