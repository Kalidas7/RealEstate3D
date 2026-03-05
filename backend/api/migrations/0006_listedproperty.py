# Generated — add ListedProperty model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_property_exterior_config'),
    ]

    operations = [
        migrations.CreateModel(
            name='ListedProperty',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('location', models.CharField(max_length=255)),
                ('price', models.CharField(max_length=100)),
                ('image', models.ImageField(upload_to='listed_property_images/')),
                ('three_d_file', models.FileField(blank=True, null=True, upload_to='3d_models/')),
                ('interior_file', models.FileField(blank=True, null=True, upload_to='3d_models/interiors/')),
                ('description', models.TextField(blank=True, default='')),
                ('bedrooms', models.IntegerField(default=1)),
                ('bathrooms', models.IntegerField(default=1)),
                ('area', models.CharField(default='1200 sqft', max_length=50)),
                ('interactive_mesh_names', models.TextField(blank=True, default='', help_text='Comma-separated mesh names. Example: Geom3D106, Geom3D022')),
            ],
        ),
    ]
