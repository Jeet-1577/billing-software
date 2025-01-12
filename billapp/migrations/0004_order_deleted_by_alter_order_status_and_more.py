# Generated by Django 5.1.4 on 2025-01-11 15:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0003_order_deletion_reason'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='deleted_by',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name='order',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('deleted', 'Deleted')], default='pending', max_length=20),
        ),
        migrations.AlterField(
            model_name='tableorder',
            name='updated_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
    ]