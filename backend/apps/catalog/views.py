from django.db.models import Case, Count, F, IntegerField, Q, When
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .filters import ProductFilter
from .models import Brand, Category, Product, Review
from .serializers import BrandSerializer, CategorySerializer, ProductDetailSerializer, ProductListSerializer, ProductWriteSerializer, ReviewSerializer

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view): return request.method in permissions.SAFE_METHODS or bool(request.user and request.user.is_staff)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer; permission_classes = [IsAdminOrReadOnly]; lookup_field = "slug"
    def get_queryset(self): return Category.objects.filter(is_active=True).annotate(product_count=Count("products")) if not self.request.user.is_staff else Category.objects.annotate(product_count=Count("products"))

class BrandViewSet(viewsets.ModelViewSet):
    serializer_class = BrandSerializer; permission_classes = [IsAdminOrReadOnly]; lookup_field = "slug"
    def get_queryset(self): return Brand.objects.filter(is_active=True) if not self.request.user.is_staff else Brand.objects.all()

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]; lookup_field = "slug"; filterset_class = ProductFilter
    search_fields = ["name", "short_description", "description", "brand__name", "category__name", "sku", "variants__sku"]
    ordering_fields = ["created_at", "base_price", "sold_count", "view_count", "discount_percent_sort"]
    ordering = ["-created_at"]
    def get_queryset(self):
        qs = Product.objects.select_related("brand", "category").prefetch_related("images", "variants__attributes__attribute", "reviews").annotate(discount_percent_sort=Case(When(compare_at_price__gt=F("base_price"), then=(F("compare_at_price") - F("base_price")) * 100 / F("compare_at_price")), default=0, output_field=IntegerField()))
        return qs if self.request.user.is_staff else qs.filter(is_active=True)
    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]: return ProductWriteSerializer
        return ProductDetailSerializer if self.action == "retrieve" else ProductListSerializer
    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object(); Product.objects.filter(pk=obj.pk).update(view_count=F("view_count") + 1)
        return Response(self.get_serializer(obj).data)
    @action(detail=False)
    def home(self, request):
        qs = self.get_queryset()
        return Response({"featured": ProductListSerializer(qs.filter(is_featured=True)[:8], many=True, context={"request": request}).data, "new": ProductListSerializer(qs.filter(is_new=True)[:8], many=True, context={"request": request}).data, "best_sellers": ProductListSerializer(qs.order_by("-sold_count")[:8], many=True, context={"request": request}).data, "offers": ProductListSerializer(qs.filter(compare_at_price__gt=F("base_price"))[:8], many=True, context={"request": request}).data})

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer; permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    def get_queryset(self):
        qs = Review.objects.select_related("user", "product")
        if self.request.user.is_staff: return qs
        return qs.filter(Q(is_approved=True) | Q(user=self.request.user)) if self.request.user.is_authenticated else qs.filter(is_approved=True)
    def perform_create(self, serializer): serializer.save(user=self.request.user)
    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAdminUser])
    def moderate(self, request, pk=None):
        review = self.get_object(); review.is_approved = bool(request.data.get("is_approved")); review.save(update_fields=["is_approved", "updated_at"])
        return Response(self.get_serializer(review).data)
