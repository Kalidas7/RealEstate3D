from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import time
import os
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import UserProfile
from api.serializers import UserSerializer

@api_view(['POST'])
def check_email(request):
    """
    Checks if an email exists in the database.
    """
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    exists = User.objects.filter(email=email).exists()
    return Response({"exists": exists, "email": email}, status=status.HTTP_200_OK)

@api_view(['POST'])
def login_user(request):
    """
    Logs in a user with email and password. Returns JWT tokens.
    """
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    # Django's authenticate takes username, so we fetch the user by email first
    try:
        # Use filter().first() to handle potential duplicates gracefully
        user_obj = User.objects.filter(email=email).first()
        
        if not user_obj:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user = authenticate(username=user_obj.username, password=password)
        
        if user:
            # Ensure user has a profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Return simple user data without serializer to avoid errors
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile': {
                    'contact_number': profile.contact_number if profile.contact_number else '',
                    'profile_pic': request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None
                }
            }
            return Response({
                "message": "Login successful",
                "user": user_data,
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Catch any other errors and return them as JSON
        return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def signup_user(request):
    """
    Creates a new user with profile details.
    """
    email = request.data.get('email')
    password = request.data.get('password')
    contact_number = request.data.get('contact_number')
    profile_pic = request.FILES.get('profile_pic')

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"error": "User with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create User
        user = User.objects.create_user(username=email, email=email, password=password)
        
        # Create UserProfile
        UserProfile.objects.create(
            user=user,
            contact_number=contact_number,
            profile_pic=profile_pic
        )
        
        profile_obj = UserProfile.objects.get(user=user)
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile': {
                'contact_number': profile_obj.contact_number if profile_obj.contact_number else '',
                'profile_pic': request.build_absolute_uri(profile_obj.profile_pic.url) if profile_obj.profile_pic else None
            }
        }
        return Response({"message": "User created successfully", "user": user_data}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Updates the authenticated user's username, contact number, and profile picture.
    """
    user = request.user

    try:
        profile, created = UserProfile.objects.get_or_create(user=user)

        # Update username if provided
        username = request.data.get('username')
        if username:
            user.username = username
            user.save()

        # Update contact number if provided
        contact_number = request.data.get('contact_number')
        if contact_number is not None:
            profile.contact_number = contact_number

        # Update profile picture if provided
        profile_pic = request.FILES.get('profile_pic')
        if profile_pic:
            # Generate a unique filename: user_ID_timestamp.ext
            ext = profile_pic.name.split('.')[-1] if '.' in profile_pic.name else 'jpg'
            new_filename = f"user_{user.id}_{int(time.time())}.{ext}"
            profile_pic.name = new_filename
            
            # Delete old profile pic from storage if it exists to save space
            if profile.profile_pic:
                # Need to be careful not to delete default images if they are shared,
                # but since we are moving to unique per-user, we can delete the old one.
                try:
                    if os.path.isfile(profile.profile_pic.path):
                        os.remove(profile.profile_pic.path)
                except Exception:
                    pass

            profile.profile_pic = profile_pic

        profile.save()

        # Return updated user data (matching the login response format)
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile': {
                'contact_number': profile.contact_number if profile.contact_number else '',
                'profile_pic': request.build_absolute_uri(profile.profile_pic.url) if profile.profile_pic else None
            }
        }
        return Response({"message": "Profile updated successfully", "user": user_data}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
