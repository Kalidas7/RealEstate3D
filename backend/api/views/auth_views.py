from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
from rest_framework.decorators import api_view, parser_classes, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.throttling import AnonRateThrottle
import time
import os
import string
import secrets
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import UserProfile
from api.serializers import UserSerializer


class LoginThrottle(AnonRateThrottle):
    scope = 'login'


class CheckEmailThrottle(AnonRateThrottle):
    scope = 'check_email'


class ForgotPasswordThrottle(AnonRateThrottle):
    scope = 'forgot_password'


class SignupThrottle(AnonRateThrottle):
    scope = 'signup'

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/gif', 'image/webp'}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

def _validate_image(file):
    """Returns an error string if invalid, or None if OK."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        return f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, GIF, WebP."
    if file.size > MAX_IMAGE_SIZE:
        return f"File too large ({file.size // 1024 // 1024}MB). Max 5MB."
    return None

@api_view(['POST'])
@throttle_classes([CheckEmailThrottle])
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
@throttle_classes([LoginThrottle])
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
    except Exception:
        return Response({"error": "An unexpected error occurred. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@throttle_classes([SignupThrottle])
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

    if len(password) < 6:
        return Response({"error": "Password must be at least 6 characters"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    if profile_pic:
        err = _validate_image(profile_pic)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # Create User and UserProfile together — if either fails, both are rolled back
            user = User.objects.create_user(username=email, email=email, password=password)

            profile_obj = UserProfile.objects.create(
                user=user,
                contact_number=contact_number,
                profile_pic=profile_pic
            )

        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)

        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile': {
                'contact_number': profile_obj.contact_number if profile_obj.contact_number else '',
                'profile_pic': request.build_absolute_uri(profile_obj.profile_pic.url) if profile_obj.profile_pic else None
            }
        }
        return Response({
            "message": "User created successfully",
            "user": user_data,
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        }, status=status.HTTP_201_CREATED)
    except Exception:
        return Response({"error": "Failed to create account. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            err = _validate_image(profile_pic)
            if err:
                return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
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
    except Exception:
        return Response({"error": "An unexpected error occurred. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@throttle_classes([ForgotPasswordThrottle])
def forgot_password(request):
    """
    Generates a random temporary password, updates the user's password,
    and emails it to them. Returns the same message whether the email
    exists or not to prevent email enumeration.
    """
    email = request.data.get('email')
    if not email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Always return success to prevent email enumeration
    success_message = "If an account exists with this email, a temporary password has been sent."

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"message": success_message}, status=status.HTTP_200_OK)

    # Generate cryptographically secure 12-character password
    chars = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(chars) for _ in range(12))

    # Send email FIRST — only change password if email was delivered successfully.
    # Otherwise the user gets locked out with no way to know the new password.
    try:
        send_mail(
            subject='Veedu - Your Temporary Password',
            message=(
                f'Hi,\n\n'
                f'You requested a password reset for your Veedu account.\n\n'
                f'Your temporary password is: {temp_password}\n\n'
                f'Please log in with this password and change it from your profile settings.\n\n'
                f'— Veedu Team'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        # Email failed — do NOT change the password, user keeps their current one
        return Response({"message": success_message}, status=status.HTTP_200_OK)

    # Email sent successfully — now update the password
    user.set_password(temp_password)
    user.save()

    return Response({"message": success_message}, status=status.HTTP_200_OK)
