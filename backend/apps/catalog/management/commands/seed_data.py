import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from apps.catalog.models import Attribute, AttributeValue, Brand, Category, Product, ProductImage, ProductVariant, ProductVariantAttribute, Review
from apps.commerce.models import Coupon, ShippingMethod
from apps.users.models import Address, User

class Command(BaseCommand):
    help = "ایجاد داده‌های توسعه فروشگاه"
    def handle(self, *args, **options):
        cats = ["قاب و کاور", "شارژر و کابل", "هدفون و هندزفری", "ساعت هوشمند", "گجت‌های کاربردی"]
        brands = ["Apple", "Samsung", "Xiaomi", "Baseus", "Anker", "JBL", "Sony"]
        category_objs = [Category.objects.get_or_create(name=x, slug=slugify(x, allow_unicode=True))[0] for x in cats]
        brand_objs = [Brand.objects.get_or_create(name=x, slug=x.lower())[0] for x in brands]
        color, _ = Attribute.objects.get_or_create(name="رنگ", slug="color")
        model, _ = Attribute.objects.get_or_create(name="مدل دستگاه", slug="model")
        colors = [AttributeValue.objects.get_or_create(attribute=color, value=x)[0] for x in ["مشکی", "سفید", "آبی"]]
        device_models = [AttributeValue.objects.get_or_create(attribute=model, value=x)[0] for x in ["استاندارد", "پرو", "پرو مکس"]]
        names = ["قاب مگ‌سیف شفاف", "گلس تمام صفحه", "کابل شارژ سریع", "آداپتور ۲۵ وات", "پاوربانک مگ‌سیف", "هندزفری بی‌سیم", "هدفون نویز کنسلینگ", "اسپیکر قابل حمل", "ساعت هوشمند", "هولدر موبایل خودرو", "شارژر وایرلس", "کابل سه‌کاره", "پاوربانک ۲۰۰۰۰", "میکروفون یقه‌ای", "فن خنک‌کننده موبایل"]
        photo_urls = [
            "https://images.unsplash.com/photo-1646602481827-0fc1d2344687?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1706290134049-c5c72d24146a?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1595402294828-ea0cf642f017?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1600577231598-31ea4cb50da3?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1566554738544-d962991c3fee?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1739764577422-20863c027cb6?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1654701381095-e56f8ea5117e?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1572183717150-0ca8073a2457?auto=format&fit=crop&w=900&q=85",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85",
        ]
        products = []
        for i in range(30):
            base = names[i % len(names)]; name = f"{base} {brand_objs[i % 7].name} مدل {i + 1}"
            product, _ = Product.objects.update_or_create(sku=f"JN-{i+1:04}", defaults={"name": name, "slug": f"product-{i+1}", "short_description": "محصول اصل با ضمانت جانبی و ارسال سریع", "description": "توضیحات کامل محصول، ویژگی‌ها و راهنمای استفاده.", "specifications": {"گارانتی": "۷ روز ضمانت اصالت", "کشور سازنده": "چین"}, "category": category_objs[i % 5], "brand": brand_objs[i % 7], "base_price": 390000 + i * 137000, "compare_at_price": 520000 + i * 157000 if i % 3 == 0 else None, "is_active": True, "is_featured": i < 8, "is_new": i > 22, "sold_count": random.randint(2, 120), "view_count": random.randint(30, 800)})
            for j in range(2):
                variant, _ = ProductVariant.objects.update_or_create(sku=f"JN-{i+1:04}-{j+1}", defaults={"product": product, "price": product.base_price + j * 70000, "stock": random.randint(2, 40), "low_stock_threshold": 5, "is_active": True})
                ProductVariantAttribute.objects.get_or_create(variant=variant, attribute_value=colors[(i + j) % 3])
                ProductVariantAttribute.objects.get_or_create(variant=variant, attribute_value=device_models[(i + j) % 3])
            ProductImage.objects.update_or_create(product=product, is_primary=True, defaults={"external_url": photo_urls[i % len(photo_urls)], "alt_text": name, "sort_order": 0})
            products.append(product)
        users = []
        for i in range(5):
            user, created = User.objects.get_or_create(email=f"customer{i+1}@example.com", defaults={"phone": f"0912000000{i+1}", "first_name": "کاربر", "last_name": f"نمونه {i+1}"})
            if created: user.set_password("TestPass123!"); user.save()
            Address.objects.get_or_create(user=user, defaults={"recipient_name": user.get_full_name(), "phone": user.phone, "province": "تهران", "city": "تهران", "address": "خیابان نمونه، کوچه تست", "postal_code": "1234567890", "plaque": "۱۲", "unit": "۳", "is_default": True})
            users.append(user)
        ShippingMethod.objects.get_or_create(name="پست پیشتاز", defaults={"description": "ارسال به سراسر ایران", "price": 75000, "estimated_days": 3})
        ShippingMethod.objects.get_or_create(name="ارسال سریع", defaults={"description": "ویژه تهران", "price": 145000, "estimated_days": 1})
        now = timezone.now(); Coupon.objects.get_or_create(code="WELCOME10", defaults={"discount_type": "percentage", "discount_value": 10, "minimum_order_amount": 500000, "maximum_discount": 300000, "usage_limit": 1000, "user_usage_limit": 1, "start_date": now - timezone.timedelta(days=1), "expiration_date": now + timezone.timedelta(days=365)})
        for i, product in enumerate(products[:10]):
            Review.objects.get_or_create(product=product, user=users[i % 5], defaults={"rating": 4 + i % 2, "title": "خرید رضایت‌بخش", "comment": "کیفیت خوب و ارسال سریع بود.", "is_approved": True})
        self.stdout.write(self.style.SUCCESS("Seed data created: 30 products, variants, users and commerce data."))
