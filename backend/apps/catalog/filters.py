import django_filters
from django.db.models import Avg, F, Q
from .models import Product

class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method="filter_category")
    brand = django_filters.CharFilter(field_name="brand__slug")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    availability = django_filters.BooleanFilter(method="filter_availability")
    rating = django_filters.NumberFilter(method="filter_rating")
    discount = django_filters.BooleanFilter(method="filter_discount")
    color = django_filters.CharFilter(method="filter_attribute")
    model = django_filters.CharFilter(method="filter_attribute")
    class Meta: model = Product; fields = ["category", "brand", "min_price", "max_price", "availability", "rating", "discount"]
    def filter_category(self, queryset, name, value): return queryset.filter(Q(category__slug=value) | Q(category__parent__slug=value))
    def filter_availability(self, queryset, name, value): return queryset.filter(variants__stock__gt=0).distinct() if value else queryset
    def filter_rating(self, queryset, name, value): return queryset.annotate(avg=Avg("reviews__rating", filter=Q(reviews__is_approved=True))).filter(avg__gte=value)
    def filter_discount(self, queryset, name, value): return queryset.filter(compare_at_price__gt=F("base_price")) if value else queryset
    def filter_attribute(self, queryset, name, value): return queryset.filter(variants__attributes__attribute__slug=name, variants__attributes__value__iexact=value).distinct()
