from django.contrib import admin
from .models import Attribute, AttributeValue, Brand, Category, Product, ProductImage, ProductVariant, ProductVariantAttribute, Review

class ProductImageInline(admin.TabularInline): model = ProductImage; extra = 0
class VariantInline(admin.TabularInline): model = ProductVariant; extra = 0
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "sku", "category", "brand", "base_price", "is_active", "created_at"]
    list_filter = ["category", "brand", "is_active", "is_featured", "is_new"]
    search_fields = ["name", "sku", "description"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, VariantInline]
@admin.register(ProductVariant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ["sku", "product", "stock", "low_stock_threshold", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["sku", "product__name"]
admin.site.register([Category, Brand, Attribute, AttributeValue, ProductVariantAttribute, Review])
