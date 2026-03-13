from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Count
from .models import UserProfile, UserLike, Property, Booking, ListedProperty

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
    distance_km = serializers.SerializerMethodField(read_only=True)
    like_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Property
        fields = '__all__'

    def get_distance_km(self, obj):
        # Retrieve the dynamically attached distance_km from views.py (or None)
        return getattr(obj, 'distance_km', None)

    def get_like_count(self, obj):
        return UserLike.objects.filter(liked_item_id=f'sponsored_{obj.id}').count()

class ListedPropertySerializer(serializers.ModelSerializer):
    distance_km = serializers.SerializerMethodField(read_only=True)
    like_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ListedProperty
        fields = '__all__'

    def get_distance_km(self, obj):
        return getattr(obj, 'distance_km', None)

    def get_like_count(self, obj):
        return UserLike.objects.filter(liked_item_id=f'listed_{obj.id}').count()

class BookingSerializer(serializers.ModelSerializer):
    property_details = PropertySerializer(source='property', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'user', 'property', 'property_details', 'date', 'time', 'status', 'created_at']
        read_only_fields = ['user', 'status', 'created_at']
