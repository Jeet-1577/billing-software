from django.core.management.base import BaseCommand
from django.db import connection
from billapp.models import TableOrder
from django.db.models import Max

class Command(BaseCommand):
    help = 'Reset the TableOrder ID sequence to avoid duplicate key errors.'

    def handle(self, *args, **kwargs):
        with connection.cursor() as cursor:
            max_id = TableOrder.objects.aggregate(max_id=Max('id'))['max_id'] or 0
            # Set the sequence to max_id + 1 to prevent duplication
            cursor.execute(f"SELECT setval('billapp_tableorder_id_seq', {max_id + 1}, false);")
            self.stdout.write(self.style.SUCCESS(f"TableOrder ID sequence set to {max_id + 1}"))
