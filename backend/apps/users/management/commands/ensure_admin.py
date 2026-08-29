import os
from django.core.management.base import BaseCommand
from apps.users.models import User

class Command(BaseCommand):
    help = "Create or update the production admin from environment variables."
    def handle(self, *args, **options):
        email = os.getenv("ADMIN_EMAIL", "").strip().lower(); password = os.getenv("ADMIN_PASSWORD", "")
        if not email or not password:
            self.stdout.write("ADMIN_EMAIL/ADMIN_PASSWORD are not set; admin bootstrap skipped."); return
        user, created = User.objects.get_or_create(email=email, defaults={"first_name": "مدیر", "last_name": "فروشگاه"})
        user.is_staff = True; user.is_superuser = True; user.is_active = True
        update_fields = ["is_staff", "is_superuser", "is_active"]
        if created or not user.has_usable_password():
            user.set_password(password)
            update_fields.append("password")
        user.save(update_fields=update_fields)
        self.stdout.write(self.style.SUCCESS(f"Admin account is ready: {email}"))
