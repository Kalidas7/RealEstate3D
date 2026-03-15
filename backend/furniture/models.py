from django.db import models


class FurnitureCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Furniture categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class FurnitureItem(models.Model):
    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        FurnitureCategory,
        on_delete=models.CASCADE,
        related_name='items',
    )
    glb_file = models.FileField(upload_to='3d_models/furniture/')
    thumbnail = models.ImageField(upload_to='furniture_thumbnails/')
    default_scale = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category.name})"
