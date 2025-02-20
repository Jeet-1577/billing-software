from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0001_initial'),  # This should match your last migration
    ]

    operations = [
        migrations.AlterField(  # Using AlterField instead of AddField since field exists
            model_name='orderitem',
            name='item',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='billapp.item'),
        ),
        migrations.AlterField(  # Using AlterField instead of AddField since field exists
            model_name='table',
            name='booking_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
