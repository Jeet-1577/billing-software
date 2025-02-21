from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0005_update_hotel_and_tableorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='tableorder',
            name='saved_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
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
