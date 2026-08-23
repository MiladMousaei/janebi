from rest_framework import serializers
from .models import Attribute, AttributeValue, Brand, Category, Product, ProductImage, ProductVariant, Review

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    cover_image = serializers.SerializerMethodField()
    class Meta: model = Category; fields = ["id", "name", "slug", "parent", "image", "cover_image", "description", "is_active", "product_count"]
    def get_cover_image(self, obj) -> str | None:
        product_image = ProductImage.objects.filter(product__category=obj, product__is_active=True, is_primary=True).first()
        if not product_image: return None
        if product_image.external_url: return product_image.external_url
        if product_image.image:
            request = self.context.get("request")
            return request.build_absolute_uri(product_image.image.url) if request else product_image.image.url
        return None

class BrandSerializer(serializers.ModelSerializer):
    class Meta: model = Brand; fields = "__all__"

class AttributeValueSerializer(serializers.ModelSerializer):
    attribute_name = serializers.CharField(source="attribute.name", read_only=True)
    attribute_slug = serializers.CharField(source="attribute.slug", read_only=True)
    class Meta: model = AttributeValue; fields = ["id", "attribute", "attribute_name", "attribute_slug", "value"]

class VariantSerializer(serializers.ModelSerializer):
    attributes = AttributeValueSerializer(many=True, read_only=True)
    effective_price = serializers.IntegerField(read_only=True)
    class Meta: model = ProductVariant; fields = ["id", "sku", "price", "effective_price", "stock", "low_stock_threshold", "is_active", "attributes"]

class ImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    class Meta: model = ProductImage; fields = ["id", "image", "external_url", "url", "alt_text", "is_primary", "sort_order"]
    def get_url(self, obj) -> str | None:
        if obj.external_url: return obj.external_url
        if not obj.image: return None
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    class Meta: model = Review; fields = ["id", "product", "user_name", "rating", "title", "comment", "is_approved", "created_at"]; read_only_fields = ["is_approved"]
    def get_user_name(self, obj) -> str: return obj.user.get_full_name() or "کاربر جانبی"
    def validate_product(self, product):
        request = self.context.get("request")
        if request and request.method == "POST" and not request.user.orders.filter(status="delivered", items__product=product).exists():
            raise serializers.ValidationError("فقط خریداران تحویل‌گرفته این محصول می‌توانند نظر ثبت کنند.")
        return product

class ProductListSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    total_stock = serializers.IntegerField(read_only=True)
    class Meta: model = Product; fields = ["id", "name", "slug", "sku", "short_description", "brand", "category", "base_price", "compare_at_price", "discount_percent", "primary_image", "average_rating", "total_stock", "is_active", "is_new", "is_featured", "sold_count", "view_count"]
    def get_primary_image(self, obj) -> str | None:
        image = next(iter(obj.images.all()), None)
        if not image: return None
        if image.external_url: return image.external_url
        if not image.image: return None
        return self.context["request"].build_absolute_uri(image.image.url) if "request" in self.context else image.image.url

class ProductDetailSerializer(ProductListSerializer):
    images = ImageSerializer(many=True, read_only=True)
    variants = VariantSerializer(many=True, read_only=True)
    reviews = serializers.SerializerMethodField()
    related = serializers.SerializerMethodField()
    class Meta(ProductListSerializer.Meta): fields = ProductListSerializer.Meta.fields + ["description", "specifications", "sku", "images", "variants", "reviews", "related", "seo_title", "seo_description"]
    def get_reviews(self, obj) -> list[dict[str, object]]: return list(ReviewSerializer(obj.reviews.filter(is_approved=True), many=True).data)
    def get_related(self, obj) -> list[dict[str, object]]:
        qs = Product.objects.filter(category=obj.category, is_active=True).exclude(pk=obj.pk).select_related("brand", "category").prefetch_related("images")[:4]
        return list(ProductListSerializer(qs, many=True, context=self.context).data)

class ProductWriteSerializer(serializers.ModelSerializer):
    primary_image_url = serializers.URLField(write_only=True, required=False, allow_blank=True, max_length=700)
    variant_sku = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=80)
    variant_stock = serializers.IntegerField(write_only=True, required=False, min_value=0)
    class Meta: model = Product; fields = "__all__"
    def _save_extras(self, product, data):
        image_url = data.get("primary_image_url")
        if image_url is not None:
            primary = product.images.filter(is_primary=True).first() or product.images.first()
            if primary:
                primary.external_url = image_url; primary.is_primary = True; primary.save(update_fields=["external_url", "is_primary", "updated_at"])
            elif image_url:
                ProductImage.objects.create(product=product, external_url=image_url, alt_text=product.name, is_primary=True)
        if "variant_stock" in data or data.get("variant_sku"):
            variant = product.variants.first()
            sku = data.get("variant_sku") or (variant.sku if variant else f"{product.sku}-DEFAULT")
            stock = data.get("variant_stock", variant.stock if variant else 0)
            if variant:
                variant.sku = sku; variant.stock = stock; variant.save(update_fields=["sku", "stock", "updated_at"])
            else:
                ProductVariant.objects.create(product=product, sku=sku, stock=stock)
    def create(self, validated_data):
        extras = {key: validated_data.pop(key) for key in ["primary_image_url", "variant_sku", "variant_stock"] if key in validated_data}
        product = super().create(validated_data); self._save_extras(product, extras); return product
    def update(self, instance, validated_data):
        extras = {key: validated_data.pop(key) for key in ["primary_image_url", "variant_sku", "variant_stock"] if key in validated_data}
        product = super().update(instance, validated_data); self._save_extras(product, extras); return product
