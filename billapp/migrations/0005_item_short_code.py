# Generated by Django 5.1.4 on 2025-01-02 12:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0004_order_order_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='item',
            name='short_code',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
