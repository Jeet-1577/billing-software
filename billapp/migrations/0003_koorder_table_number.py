# Generated by Django 5.1.4 on 2025-01-16 11:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0002_koorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='koorder',
            name='table_number',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
    ]
