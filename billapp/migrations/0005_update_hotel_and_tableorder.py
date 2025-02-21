from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0004_hotel_and_tableorder_updates'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hotel',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
