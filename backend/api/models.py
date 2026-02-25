from django.db import models
from django.contrib.auth.models import User

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