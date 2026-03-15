from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import FurnitureCategory, FurnitureItem
from .serializers import FurnitureCategorySerializer, FurnitureItemSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def list_categories(request):
    categories = FurnitureCategory.objects.all()
    serializer = FurnitureCategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def list_items(request):
    category_slug = request.query_params.get('category')
    items = FurnitureItem.objects.select_related('category')
    if category_slug:
        items = items.filter(category__slug=category_slug)
    serializer = FurnitureItemSerializer(items, many=True)
    return Response(serializer.data)
