from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from api.models import UserLike, Property, ListedProperty
from api.serializers import UserLikeSerializer, PropertySerializer, ListedPropertySerializer

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_likes(request):
    """
    GET: List all likes for the authenticated user.
    POST: Add a like for the authenticated user.
    DELETE: Remove a like for the authenticated user.
    liked_item_id format: "sponsored_<id>" or "listed_<id>"
    """
    user = request.user

    if request.method == 'GET':
        likes = UserLike.objects.filter(user=user)
        serializer = UserLikeSerializer(likes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        liked_item_id = request.data.get('liked_item_id')
        if not liked_item_id:
            return Response({"error": "liked_item_id required"}, status=status.HTTP_400_BAD_REQUEST)

        like, created = UserLike.objects.get_or_create(user=user, liked_item_id=liked_item_id)
        if created:
            return Response({"message": "Like added"}, status=status.HTTP_201_CREATED)
        else:
            return Response({"message": "Already liked"}, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        liked_item_id = request.data.get('liked_item_id')
        if not liked_item_id:
            return Response({"error": "liked_item_id required"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count, _ = UserLike.objects.filter(user=user, liked_item_id=liked_item_id).delete()
        if deleted_count > 0:
            return Response({"message": "Like removed"}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Like not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_liked_properties(request):
    """
    Returns full property data for all liked items of the authenticated user.
    Returns list of properties with a 'source' field ('sponsored' or 'listed').
    """
    user = request.user
    likes = UserLike.objects.filter(user=user).order_by('-created_at')

    result = []
    for like in likes:
        item_id = like.liked_item_id
        if item_id.startswith('sponsored_'):
            prop_id = item_id.replace('sponsored_', '')
            try:
                prop = Property.objects.get(id=int(prop_id))
                data = PropertySerializer(prop, context={'request': request}).data
                data['source'] = 'sponsored'
                data['liked_item_id'] = item_id
                result.append(data)
            except Property.DoesNotExist:
                pass
        elif item_id.startswith('listed_'):
            prop_id = item_id.replace('listed_', '')
            try:
                prop = ListedProperty.objects.get(id=int(prop_id))
                data = ListedPropertySerializer(prop, context={'request': request}).data
                data['source'] = 'listed'
                data['liked_item_id'] = item_id
                result.append(data)
            except ListedProperty.DoesNotExist:
                pass

    return Response(result, status=status.HTTP_200_OK)
