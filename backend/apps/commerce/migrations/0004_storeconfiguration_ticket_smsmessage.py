from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("commerce", "0003_salesforecast"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StoreConfiguration",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("flash_sale_title", models.CharField(default="پیشنهاد شگفت‌انگیز", max_length=120)),
                ("flash_sale_ends_at", models.DateTimeField(blank=True, null=True)),
                ("flash_sale_enabled", models.BooleanField(default=True)),
                ("shop_banner_title", models.CharField(default="همه‌چیز برای یک انتخاب هوشمندانه", max_length=160)),
                ("shop_banner_subtitle", models.CharField(default="جدیدترین گجت‌ها و لوازم جانبی اصل را با ارسال سریع و ضمانت واقعی پیدا کنید.", max_length=280)),
            ],
            options={"verbose_name": "تنظیمات فروشگاه", "verbose_name_plural": "تنظیمات فروشگاه"},
        ),
        migrations.CreateModel(
            name="Ticket",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("subject", models.CharField(max_length=180)),
                ("category", models.CharField(choices=[("general", "عمومی"), ("order", "سفارش"), ("payment", "پرداخت"), ("product", "محصول")], default="general", max_length=20)),
                ("status", models.CharField(choices=[("open", "باز"), ("pending", "در انتظار پاسخ"), ("answered", "پاسخ داده‌شده"), ("closed", "بسته")], db_index=True, default="open", max_length=20)),
                ("last_message_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tickets", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-last_message_at"]},
        ),
        migrations.CreateModel(
            name="TicketMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("body", models.TextField()),
                ("is_admin_reply", models.BooleanField(default=False)),
                ("sender", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ticket_messages", to=settings.AUTH_USER_MODEL)),
                ("ticket", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="messages", to="commerce.ticket")),
            ],
            options={"ordering": ["created_at"]},
        ),
        migrations.CreateModel(
            name="SMSMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("phone", models.CharField(db_index=True, max_length=15)),
                ("message", models.CharField(max_length=500)),
                ("status", models.CharField(choices=[("queued", "در صف"), ("sent", "ارسال‌شده"), ("failed", "ناموفق")], db_index=True, default="queued", max_length=12)),
                ("provider_reference", models.CharField(blank=True, max_length=120)),
                ("error_message", models.CharField(blank=True, max_length=300)),
                ("recipient", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sms_messages", to=settings.AUTH_USER_MODEL)),
                ("sent_by", models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="sent_sms_messages", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
