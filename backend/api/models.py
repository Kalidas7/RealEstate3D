from django.db import models
from django.contrib.auth.models import User
import re
import requests

def extract_coords_from_maps_link(url):
    if not url:
        return None, None
    try:
        response = requests.get(url, allow_redirects=True, timeout=5)
        expanded_url = response.url
        match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', expanded_url)
        if match:
            return float(match.group(1)), float(match.group(2))
    except Exception as e:
        print(f"Error extracting coordinates: {e}")
    return None, None

# --- Your Existing Models (Do not touch) ---
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class UserLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    liked_item_id = models.CharField(max_length=255) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} liked {self.liked_item_id}"

# --- NEW: The Property Model for 3D Files ---
class Property(models.Model):
    name = models.CharField(max_length=255) # e.g., "Skyline Towers"
    location = models.CharField(max_length=255) # e.g., "Downtown, City Center"
    location_link = models.URLField(max_length=500, null=True, blank=True)
    price = models.CharField(max_length=100)  # e.g., "$430,000"
    
    # The Card Image for the Home Page
    image = models.ImageField(upload_to='property_images/')
    
    # The exterior 3D File (GLB format is best for Web/Mobile)
    three_d_file = models.FileField(upload_to='3d_models/', blank=True, null=True)
    
    # The interior 3D File
    interior_file = models.FileField(upload_to='3d_models/interiors/', blank=True, null=True)
    
    # Details for the "Scroll down" section
    description = models.TextField()
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.IntegerField(default=1)
    area = models.CharField(max_length=50, default="1200 sqft")

    # Comma-separated mesh names that should be highlighted green and trigger Enter Interior
    # Example: "Geom3D106, Geom3D022, Geom3D050, Geom3D101"
    interactive_mesh_names = models.TextField(
        blank=True, default='',
        help_text='Comma-separated mesh names. Example: Geom3D106, Geom3D022, Geom3D050'
    )

    # Location Coordinates (Extracted from location_link)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.location_link:
            update_coords = False
            if not self.pk:
                update_coords = True
            else:
                try:
                    old_instance = Property.objects.get(pk=self.pk)
                    if old_instance.location_link != self.location_link:
                        update_coords = True
                except Property.DoesNotExist:
                    update_coords = True
            
            if update_coords:
                lat, lon = extract_coords_from_maps_link(self.location_link)
                if lat is not None and lon is not None:
                    self.latitude = lat
                    self.longitude = lon

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

# --- Listed Properties (shown in the "All Properties" list on the home page) ---
class ListedProperty(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    location_link = models.URLField(max_length=500, null=True, blank=True)
    price = models.CharField(max_length=100)
    image = models.ImageField(upload_to='listed_property_images/')
    three_d_file = models.FileField(upload_to='3d_models/', blank=True, null=True)
    interior_file = models.FileField(upload_to='3d_models/interiors/', blank=True, null=True)
    description = models.TextField(blank=True, default='')
    bedrooms = models.IntegerField(default=1)
    bathrooms = models.IntegerField(default=1)
    area = models.CharField(max_length=50, default="1200 sqft")
    interactive_mesh_names = models.TextField(
        blank=True, default='',
        help_text='Comma-separated mesh names. Example: Geom3D106, Geom3D022'
    )

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.location_link:
            update_coords = False
            if not self.pk:
                update_coords = True
            else:
                try:
                    old_instance = ListedProperty.objects.get(pk=self.pk)
                    if old_instance.location_link != self.location_link:
                        update_coords = True
                except ListedProperty.DoesNotExist:
                    update_coords = True
            
            if update_coords:
                lat, lon = extract_coords_from_maps_link(self.location_link)
                if lat is not None and lon is not None:
                    self.latitude = lat
                    self.longitude = lon

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Booking(models.Model):
    STATUS_CHOICES = (
        ('upcoming', 'Upcoming'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='bookings')
    date = models.CharField(max_length=50) # Storing as string for simplicity with frontend UI ("28-02-2026")
    time = models.CharField(max_length=50) # e.g., "10:00 AM"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.property.name} - {self.date} {self.time}"