from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, UserLike, Property, Booking

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['contact_number', 'profile_pic']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class UserLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLike
        fields = ['id', 'user', 'liked_item_id', 'created_at']
        read_only_fields = ['user', 'created_at']

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'user', 'property', 'property_details', 'date', 'time', 'status', 'created_at']
        read_only_fields = ['user', 'status', 'created_at']
