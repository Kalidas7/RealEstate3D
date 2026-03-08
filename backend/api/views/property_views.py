from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
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

@api_view(['GET'])
def migrate_coords(request):
    """Temporary endpoint to force missing coordinates to update from location_link URLs"""
    count = 0
    for p in Property.objects.all():
        p.latitude = None
        p.longitude = None
        p.save()
        count += 1
        
    for p in ListedProperty.objects.all():
        p.latitude = None
        p.longitude = None
        p.save()
        count += 1
        
    return JsonResponse({"status": "success", "migrated_count": count})
@api_view(['GET'])
def test_extract(request):
    """Diagnose Google Maps blocking Render logic"""
    import requests, re
    url = request.query_params.get('url', 'https://maps.app.goo.gl/ZN38y9kdoD8ZvqED6?g_st=ic')
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        res = requests.get(url, allow_redirects=True, headers=headers, timeout=5)
        html = res.text
        
        # Look for coordinates in HTML
        meta_match = re.search(r'meta content=".*?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)', html)
        html_match = re.search(r'\[\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]', html)
        
        # Look for !3d...!4d coord patterns
        ll_match = re.search(r'!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)', html)
        
        return JsonResponse({
            "status_code": res.status_code,
            "expanded_url": res.url,
            "meta": meta_match.groups() if meta_match else None,
            "html_array": html_match.groups() if html_match else None,
            "ll_pattern": ll_match.groups() if ll_match else None,
            "html_snippet": html[:2000] # Increased snippet size
        })
    except Exception as e:
        return JsonResponse({"error": str(e)})
