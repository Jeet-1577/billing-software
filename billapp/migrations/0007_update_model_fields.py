from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0006_update_table_order_and_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hotel',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='owner',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
