from django.db import migrations


PHOTO_URLS = [
    "https://images.unsplash.com/photo-1727033497241-a79cf600ec56?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1567428486597-8c5328fd3816?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1555449368-099e5eb46842?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1618911138919-dcabd0bd6108?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1753802865229-07b76c26cf7e?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1738920424218-3d28b951740a?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1505751104546-4b63c93054b1?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1549400854-b4300f444934?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1722153105551-cfea928e80de?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1679110454518-de036af8adff?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1784024130733-980c3998b864?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1555449368-099e5eb46842?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1753802865229-07b76c26cf7e?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1543512214-e643cea604c8?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1756576170693-b84e8ffa8ae0?auto=format&fit=crop&w=1200&q=82",
]


def update_seed_product_images(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    ProductImage = apps.get_model("catalog", "ProductImage")
    for product_number in range(1, 31):
        try:
            product = Product.objects.get(sku=f"JN-{product_number:04d}")
        except Product.DoesNotExist:
            continue
        ProductImage.objects.update_or_create(
            product=product,
            is_primary=True,
            defaults={
                "external_url": PHOTO_URLS[(product_number - 1) % len(PHOTO_URLS)],
                "alt_text": product.name,
                "sort_order": 0,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0004_productimage_external_url_alter_productimage_image")]
    operations = [migrations.RunPython(update_seed_product_images, migrations.RunPython.noop)]
