from django.contrib import admin
from .models import FurnitureCategory, FurnitureItem


@admin.register(FurnitureCategory)
class FurnitureCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)


@admin.register(FurnitureItem)
class FurnitureItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'default_scale', 'created_at')
    list_filter = ('category',)
    search_fields = ('name',)
    fieldsets = (
        (None, {
            'fields': ('name', 'category')
        }),
        ('Files', {
            'fields': ('glb_file', 'thumbnail')
        }),
        ('Settings', {
            'fields': ('default_scale',)
        }),
    )
