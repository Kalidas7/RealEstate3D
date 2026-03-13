from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import UserLike, Property, ListedProperty
from api.serializers import UserLikeSerializer, PropertySerializer, ListedPropertySerializer


def _get_like_count(liked_item_id):
    """Return total like count for a given liked_item_id."""
    return UserLike.objects.filter(liked_item_id=liked_item_id).count()


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_likes(request):
    """
    POST: Add a like for the authenticated user. Returns updated like_count.
    DELETE: Remove a like for the authenticated user. Returns updated like_count.
    liked_item_id format: "sponsored_<id>" or "listed_<id>"
    """
    user = request.user

    if request.method == 'POST':
        liked_item_id = request.data.get('liked_item_id')
        if not liked_item_id:
            return Response({"error": "liked_item_id required"}, status=status.HTTP_400_BAD_REQUEST)

        like, created = UserLike.objects.get_or_create(user=user, liked_item_id=liked_item_id)
        like_count = _get_like_count(liked_item_id)
        if created:
            return Response({"message": "Like added", "like_count": like_count}, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "Already liked", "like_count": like_count}, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        liked_item_id = request.data.get('liked_item_id')
        if not liked_item_id:
            return Response({"error": "liked_item_id required"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = UserLike.objects.filter(user=user, liked_item_id=liked_item_id).delete()
        like_count = _get_like_count(liked_item_id)
        if deleted_count > 0:
            return Response({"message": "Like removed", "like_count": like_count}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Like not found", "like_count": like_count}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_liked_properties(request):
    """
    Returns full property data + liked_item_ids for the authenticated user.
    Single endpoint replacing both GET /likes/ and GET /liked-properties/.
    Response: { liked_ids: [...], properties: [...] }
    """
    user = request.user
    likes = UserLike.objects.filter(user=user).order_by('-created_at')

    liked_ids = [like.liked_item_id for like in likes]
    properties = []

    for like in likes:
        item_id = like.liked_item_id
        if item_id.startswith('sponsored_'):
            prop_id = item_id.replace('sponsored_', '')
            try:
                prop = Property.objects.get(id=int(prop_id))
                data = PropertySerializer(prop, context={'request': request}).data
                data['source'] = 'sponsored'
                data['liked_item_id'] = item_id
                properties.append(data)
            except Property.DoesNotExist:
                pass
        elif item_id.startswith('listed_'):
            prop_id = item_id.replace('listed_', '')
            try:
                prop = ListedProperty.objects.get(id=int(prop_id))
                data = ListedPropertySerializer(prop, context={'request': request}).data
                data['source'] = 'listed'
                data['liked_item_id'] = item_id
                properties.append(data)
            except ListedProperty.DoesNotExist:
                pass

    return Response({
        "liked_ids": liked_ids,
        "properties": properties,
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Changes the authenticated user's password.
    Requires current_password and new_password.
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({"error": "Current password and new password are required"}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({"error": "Current password is incorrect"}, status=status.HTTP_401_UNAUTHORIZED)

    if len(new_password) < 6:
        return Response({"error": "New password must be at least 6 characters"}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    # Issue new JWT tokens so the frontend can replace the old ones
    refresh = RefreshToken.for_user(user)

    return Response({
        "message": "Password changed successfully",
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }, status=status.HTTP_200_OK)
