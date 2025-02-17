from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0003_auto_20250217_2221'),
    ]

    operations = [
        migrations.CreateModel(
            name='TargetSetting',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timeframe', models.CharField(choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')], max_length=10)),
                ('revenue_target', models.DecimalField(decimal_places=2, max_digits=12)),
                ('order_target', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'unique_together': {('timeframe',)},
            },
        ),
    ]
