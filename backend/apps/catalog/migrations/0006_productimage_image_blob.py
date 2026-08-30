from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0005_match_seed_product_images")]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="image_blob",
            field=models.BinaryField(blank=True, default=bytes, editable=False),
        ),
        migrations.AddField(
            model_name="productimage",
            name="image_content_type",
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
