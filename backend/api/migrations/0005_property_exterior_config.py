# Generated manually — add interactive_mesh_names and interior_camera_nodes to Property

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_booking'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='interactive_mesh_names',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='property',
            name='interior_camera_nodes',
            field=models.TextField(blank=True, default=''),
        ),
    ]
