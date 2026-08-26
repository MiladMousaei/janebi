import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SalesForecast",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("content", models.TextField()),
                ("input_snapshot", models.JSONField(default=dict)),
                ("model_name", models.CharField(default="gpt-4.1-mini", max_length=80)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="sales_forecasts", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="salesforecast",
            index=models.Index(fields=["user", "created_at"], name="commerce_sa_user_id_55720b_idx"),
        ),
    ]
