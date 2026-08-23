from django.core.management import call_command
from django.core.management.base import BaseCommand
from apps.catalog.models import Product

class Command(BaseCommand):
    help = "Seed the production catalog only when it is empty."

    def handle(self, *args, **options):
        if Product.objects.exists():
            self.stdout.write("Catalog already contains products; seed skipped.")
            return
        call_command("seed_data")
        self.stdout.write(self.style.SUCCESS("Initial production catalog created."))
