# Generated by Django 5.1.4 on 2025-01-11 13:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0002_table_booking_time_table_is_booked_table_size'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='deletion_reason',
            field=models.TextField(blank=True, null=True),
        ),
    ]
