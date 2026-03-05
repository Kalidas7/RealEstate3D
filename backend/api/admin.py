from django.contrib import admin
from .models import Property, Booking, ListedProperty

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'price')
    search_fields = ('name', 'location')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'location', 'price', 'description', 'image')
        }),
        ('Property Details', {
            'fields': ('bedrooms', 'bathrooms', 'area')
        }),
        ('3D Models', {
            'fields': ('three_d_file', 'interior_file')
        }),
        ('3D Interaction Config', {
            'description': 'These fields control the interactive 3D elements.',
            'fields': ('interactive_mesh_names',)
        }),
    )

@admin.register(ListedProperty)
class ListedPropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'price')
    search_fields = ('name', 'location')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'location', 'price', 'description', 'image')
        }),
        ('Property Details', {
            'fields': ('bedrooms', 'bathrooms', 'area')
        }),
        ('3D Models', {
            'fields': ('three_d_file', 'interior_file')
        }),
        ('3D Interaction Config', {
            'description': 'These fields control the interactive 3D elements.',
            'fields': ('interactive_mesh_names',)
        }),
    )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'date', 'time', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__username', 'property__name')