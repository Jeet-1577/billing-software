from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='item',
            name='quantity',
        ),
        migrations.AddField(
            model_name='item',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='items/'),
        ),
    ]
