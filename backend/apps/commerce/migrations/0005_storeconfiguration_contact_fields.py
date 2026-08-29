from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("commerce", "0004_storeconfiguration_ticket_smsmessage")]

    operations = [
        migrations.AddField(
            model_name="storeconfiguration",
            name="support_phone",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
        migrations.AddField(
            model_name="storeconfiguration",
            name="support_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="storeconfiguration",
            name="support_hours",
            field=models.CharField(default="شنبه تا پنج‌شنبه، ساعت ۹ تا ۱۸", max_length=160),
        ),
        migrations.AddField(
            model_name="storeconfiguration",
            name="return_days",
            field=models.PositiveSmallIntegerField(default=7),
        ),
    ]
