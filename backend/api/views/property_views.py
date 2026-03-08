from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from api.models import Property, ListedProperty
from api.serializers import PropertySerializer, ListedPropertySerializer
from api.utils import calculate_haversine_distance

@api_view(['GET'])
def get_properties(request):
    """
    Returns a list of all properties. Allows optional lat/lon filtering (max 20km).
    """
    user_lat = request.query_params.get('lat')
    user_lon = request.query_params.get('lon')
    
    properties = Property.objects.all()
    filtered_properties = []

    if user_lat and user_lon:
        for prop in properties:
            if prop.latitude is not None and prop.longitude is not None:
                dist = calculate_haversine_distance(user_lat, user_lon, prop.latitude, prop.longitude)
                if dist is not None and dist <= 20.0:
                    # Dynamically append distance for the serializer
                    prop.distance_km = round(dist, 2)
                    filtered_properties.append(prop)
        
        # Sort by ascending distance (closest first)
        filtered_properties.sort(key=lambda x: getattr(x, 'distance_km', float('inf')))
        properties = filtered_properties

    # Pass request context for absolute URLs
    serializer = PropertySerializer(properties, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_listed_properties(request):
    """
    Returns a list of all listed properties, filtering out those >20km away if coordinates provided.
    """
    user_lat = request.query_params.get('lat')
    user_lon = request.query_params.get('lon')
    
    properties = ListedProperty.objects.all()
    filtered_properties = []

    if user_lat and user_lon:
        for prop in properties:
            if prop.latitude is not None and prop.longitude is not None:
                dist = calculate_haversine_distance(user_lat, user_lon, prop.latitude, prop.longitude)
                if dist is not None and dist <= 20.0:
                    prop.distance_km = round(dist, 2)
                    filtered_properties.append(prop)
        
        filtered_properties.sort(key=lambda x: getattr(x, 'distance_km', float('inf')))
        properties = filtered_properties

    serializer = ListedPropertySerializer(properties, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)
