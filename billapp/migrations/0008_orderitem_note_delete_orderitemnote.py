# Generated by Django 5.1.4 on 2025-01-12 11:21

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0007_orderitemnote'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderitem',
            name='note',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.DeleteModel(
            name='OrderItemNote',
        ),
    ]
