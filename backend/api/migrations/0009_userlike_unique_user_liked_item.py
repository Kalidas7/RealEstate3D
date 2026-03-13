from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_listedproperty_latitude_listedproperty_longitude_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='userlike',
            unique_together={('user', 'liked_item_id')},
        ),
    ]
