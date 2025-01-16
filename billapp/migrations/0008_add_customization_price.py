# ...existing code...

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0006_employee_order_deleted_by'),  # Updated dependency
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='customization_price',
            field=models.DecimalField(default=0, max_digits=10, decimal_places=2),
        ),
    ]

# ...existing code...