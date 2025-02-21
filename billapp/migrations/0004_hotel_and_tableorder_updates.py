from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('billapp', '0003_owner'),
    ]

    operations = [
        migrations.CreateModel(
            name='Hotel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('address', models.TextField()),
                ('email', models.EmailField(max_length=254)),
                ('phone', models.CharField(max_length=20)),
                ('gstin', models.CharField(max_length=15)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='hotel/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('has_2fa', models.BooleanField(default=False)),
            ],
            options={
                'verbose_name': 'Hotel Profile',
                'verbose_name_plural': 'Hotel Profile',
            },
        ),
        migrations.AlterField(
            model_name='owner',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
