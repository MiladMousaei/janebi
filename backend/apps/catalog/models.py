from django.conf import settings
from django.core.validators import FileExtensionValidator, MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg, Sum
from apps.core.models import TimeStampedModel

def validate_image_size(image):
    if image.size > 5 * 1024 * 1024:
        from django.core.exceptions import ValidationError
        raise ValidationError("حداکثر حجم تصویر ۵ مگابایت است.")

class Category(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True, db_index=True)
    parent = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children")
    image = models.ImageField(upload_to="categories/", blank=True, validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"]), validate_image_size])
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    class Meta: verbose_name_plural = "Categories"; ordering = ["name"]
    def __str__(self): return self.name

class Brand(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True, db_index=True)
    logo = models.ImageField(upload_to="brands/", blank=True, validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"]), validate_image_size])
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.name

class Attribute(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=110, unique=True)
    def __str__(self): return self.name

class AttributeValue(TimeStampedModel):
    attribute = models.ForeignKey(Attribute, on_delete=models.CASCADE, related_name="values")
    value = models.CharField(max_length=120)
    class Meta: unique_together = ["attribute", "value"]
    def __str__(self): return f"{self.attribute}: {self.value}"

class Product(TimeStampedModel):
    name = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True, allow_unicode=True, db_index=True)
    short_description = models.CharField(max_length=320, blank=True)
    description = models.TextField()
    specifications = models.JSONField(default=dict, blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    base_price = models.PositiveBigIntegerField()
    compare_at_price = models.PositiveBigIntegerField(null=True, blank=True)
    sku = models.CharField(max_length=80, unique=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    seo_title = models.CharField(max_length=70, blank=True)
    seo_description = models.CharField(max_length=170, blank=True)
    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_active", "created_at"]), models.Index(fields=["category", "brand"])]
    def __str__(self): return self.name
    @property
    def discount_percent(self):
        if self.compare_at_price and self.compare_at_price > self.base_price:
            return round((self.compare_at_price - self.base_price) * 100 / self.compare_at_price)
        return 0
    @property
    def average_rating(self): return round(self.reviews.filter(is_approved=True).aggregate(v=Avg("rating"))["v"] or 0, 1)
    @property
    def total_stock(self): return self.variants.filter(is_active=True).aggregate(v=Sum("stock"))["v"] or 0

class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/%Y/%m/", blank=True, validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"]), validate_image_size])
    image_blob = models.BinaryField(blank=True, default=bytes, editable=False)
    image_content_type = models.CharField(max_length=50, blank=True)
    external_url = models.URLField(max_length=700, blank=True)
    alt_text = models.CharField(max_length=220, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)
    class Meta: ordering = ["sort_order", "id"]

class ProductVariant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=80, unique=True, db_index=True)
    price = models.PositiveBigIntegerField(null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    attributes = models.ManyToManyField(AttributeValue, through="ProductVariantAttribute", related_name="variants")
    class Meta: indexes = [models.Index(fields=["is_active", "stock"])]
    def __str__(self): return self.sku
    @property
    def effective_price(self): return self.price if self.price is not None else self.product.base_price

class ProductVariantAttribute(models.Model):
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    attribute_value = models.ForeignKey(AttributeValue, on_delete=models.CASCADE)
    class Meta: unique_together = ["variant", "attribute_value"]

class Review(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=160)
    comment = models.TextField()
    is_approved = models.BooleanField(default=False, db_index=True)
    class Meta: unique_together = ["product", "user"]; ordering = ["-created_at"]
