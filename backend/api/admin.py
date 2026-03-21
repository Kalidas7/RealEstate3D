from django.contrib import admin
from .models import Property, Booking, ListedProperty

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'builder', 'location', 'price', 'latitude', 'longitude')
    readonly_fields = ('latitude', 'longitude')
    search_fields = ('name', 'location', 'builder')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'builder', 'location', 'location_link', 'latitude', 'longitude', 'price', 'description', 'image')
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
        ('Audio Tour', {
            'description': 'Optional audio files for each interior camera node.',
            'fields': ('audio_node_1', 'audio_node_2', 'audio_node_3'),
        }),
    )

@admin.register(ListedProperty)
class ListedPropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'builder', 'location', 'price', 'latitude', 'longitude')
    readonly_fields = ('latitude', 'longitude')
    search_fields = ('name', 'location', 'builder')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'builder', 'location', 'location_link', 'latitude', 'longitude', 'price', 'description', 'image')
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
        ('Audio Tour', {
            'description': 'Optional audio files for each interior camera node.',
            'fields': ('audio_node_1', 'audio_node_2', 'audio_node_3'),
        }),
    )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('user', 'property', 'date', 'time', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__username', 'property__name')