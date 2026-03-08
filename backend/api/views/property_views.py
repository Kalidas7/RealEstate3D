from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from api.models import Property, ListedProperty
from api.serializers import PropertySerializer, ListedPropertySerializer
from api.utils import calculate_haversine_distance, extract_coords_from_maps_link


def _filter_by_distance(queryset, user_lat, user_lon, max_km=20.0):
    """Shared helper: filter a queryset by haversine distance and attach distance_km."""
    if not user_lat or not user_lon:
        return list(queryset)

    results = []
    for prop in queryset:
        if prop.latitude is not None and prop.longitude is not None:
            dist = calculate_haversine_distance(user_lat, user_lon, prop.latitude, prop.longitude)
            if dist is not None and dist <= max_km:
                prop.distance_km = round(dist, 2)
                results.append(prop)
    results.sort(key=lambda x: getattr(x, 'distance_km', float('inf')))
    return results


@api_view(['GET'])
def get_all_properties(request):
    """
    Combined endpoint: returns both sponsored and listed properties in one response.
    This halves the number of network round-trips the frontend needs to make.
    Accepts optional ?lat=X&lon=Y for distance filtering (max 20km).
    """
    user_lat = request.query_params.get('lat')
    user_lon = request.query_params.get('lon')

    sponsored = _filter_by_distance(Property.objects.all(), user_lat, user_lon)
    listed = _filter_by_distance(ListedProperty.objects.all(), user_lat, user_lon)

    return Response({
        'sponsored': PropertySerializer(sponsored, many=True, context={'request': request}).data,
        'listed': ListedPropertySerializer(listed, many=True, context={'request': request}).data,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_properties(request):
    """Legacy endpoint kept for backward compatibility."""
    user_lat = request.query_params.get('lat')
    user_lon = request.query_params.get('lon')
    props = _filter_by_distance(Property.objects.all(), user_lat, user_lon)
    serializer = PropertySerializer(props, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_listed_properties(request):
    """Legacy endpoint kept for backward compatibility."""
    user_lat = request.query_params.get('lat')
    user_lon = request.query_params.get('lon')
    props = _filter_by_distance(ListedProperty.objects.all(), user_lat, user_lon)
    serializer = ListedPropertySerializer(props, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def migrate_coords(request):
    """Re-extract coordinates for all properties using the Geocoding API."""
    try:
        count = 0
        for Model in [Property, ListedProperty]:
            for p in Model.objects.all():
                lat, lon = extract_coords_from_maps_link(p.location_link, bias_text=p.location)
                if lat and lon:
                    # Use update() to skip the save() hook and avoid redundant geocoding
                    Model.objects.filter(pk=p.pk).update(latitude=lat, longitude=lon)
                    count += 1
        return JsonResponse({"status": "success", "processed_count": count})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})
