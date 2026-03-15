from rest_framework import serializers
from .models import FurnitureCategory, FurnitureItem


class FurnitureCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FurnitureCategory
        fields = ['id', 'name', 'slug']


class FurnitureItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FurnitureItem
        fields = ['id', 'name', 'category', 'category_name', 'glb_file', 'thumbnail', 'default_scale']
