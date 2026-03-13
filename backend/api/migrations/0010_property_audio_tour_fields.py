from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_userlike_unique_user_liked_item'),
    ]

    operations = [
        migrations.AddField(
            model_name='property',
            name='audio_node_1',
            field=models.FileField(blank=True, null=True, upload_to='audio_tours/'),
        ),
        migrations.AddField(
            model_name='property',
            name='audio_node_2',
            field=models.FileField(blank=True, null=True, upload_to='audio_tours/'),
        ),
        migrations.AddField(
            model_name='property',
            name='audio_node_3',
            field=models.FileField(blank=True, null=True, upload_to='audio_tours/'),
        ),
        migrations.AddField(
            model_name='listedproperty',
            name='audio_node_1',
            field=models.FileField(blank=True, null=True, upload_to='audio_tours/'),
        ),
        migrations.AddField(
            model_name='listedproperty',
            name='audio_node_2',
            field=models.FileField(blank=True, null=True, upload_to='audio_tours/'),
        ),
        migrations.AddField(
            model_name='listedproperty',
            name='audio_node_3',
            field=models.FileField(blank=True, null=True, upload_to='audio_tours/'),
        ),
    ]
