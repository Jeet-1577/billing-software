from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0007_add_place_to_table'),
        ('billapp', '0007_tableorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='table',
            name='place',
            field=models.CharField(max_length=100, default='default_place'),
            preserve_default=False,
        ),
    ]
