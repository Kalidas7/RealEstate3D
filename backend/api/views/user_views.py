from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from api.models import UserLike, Property, ListedProperty
from api.serializers import UserLikeSerializer, PropertySerializer, ListedPropertySerializer

@api_view(['GET', 'POST', 'DELETE'])
def user_likes(request):
    """
    GET: List all likes for a user (query param email).
    POST: Add a like for a user.
    DELETE: Remove a like for a user.
    liked_item_id format: "sponsored_<id>" or "listed_<id>"
    """
    if request.method == 'GET':
        email = request.query_params.get('email')
        if not email:
             return Response({"error": "Email query param required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            likes = UserLike.objects.filter(user=user)
            serializer = UserLikeSerializer(likes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'POST':
        email = request.data.get('email')
        liked_item_id = request.data.get('liked_item_id')
        
        if not email or not liked_item_id:
             return Response({"error": "Email and liked_item_id required"}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            like, created = UserLike.objects.get_or_create(user=user, liked_item_id=liked_item_id)
            if created:
                return Response({"message": "Like added"}, status=status.HTTP_201_CREATED)
            else:
                return Response({"message": "Already liked"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        email = request.data.get('email')
        liked_item_id = request.data.get('liked_item_id')
        
        if not email or not liked_item_id:
             return Response({"error": "Email and liked_item_id required"}, status=status.HTTP_400_BAD_REQUEST)
             
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            deleted_count, _ = UserLike.objects.filter(user=user, liked_item_id=liked_item_id).delete()
            if deleted_count > 0:
                return Response({"message": "Like removed"}, status=status.HTTP_200_OK)
            else:
                return Response({"message": "Like not found"}, status=status.HTTP_404_NOT_FOUND)
        except User.DoesNotExist:
             return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_liked_properties(request):
    """
    Returns full property data for all liked items of a user.
    Query param: email
    Returns list of properties with a 'source' field ('sponsored' or 'listed').
    """
    email = request.query_params.get('email')
    if not email:
        return Response({"error": "Email query param required"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
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
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
