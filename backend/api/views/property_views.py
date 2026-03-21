from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.core.cache import cache
from django.db.models import Q, F, FloatField, ExpressionWrapper
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank, TrigramSimilarity
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
def search_properties(request):
    """
    Full-text + fuzzy search with location boosting.
    Accepts ?q=query&lat=X&lon=Y.
    Searches ListedProperty table. Nearby properties are ranked higher.
    """
    query_str = request.query_params.get('q', '').strip()
    if not query_str:
        return Response({'results': []}, status=status.HTTP_200_OK)

    user_lat = request.query_params.get('lat')
    user_lon = request.query_params.get('lon')

    cache_key = f'search:{query_str.lower()}:{user_lat}:{user_lon}'
    cached = cache.get(cache_key)
    if cached:
        return Response(cached, status=status.HTTP_200_OK)

    vector = (
        SearchVector('name', weight='A') +
        SearchVector('builder', weight='B') +
        SearchVector('description', weight='C')
    )
    fts_query = SearchQuery(query_str, search_type='plain')

    results = ListedProperty.objects.annotate(
        rank=SearchRank(vector, fts_query),
        name_sim=TrigramSimilarity('name', query_str),
        builder_sim=TrigramSimilarity('builder', query_str),
        text_score=ExpressionWrapper(
            F('rank') + F('name_sim') * 0.5 + F('builder_sim') * 0.3,
            output_field=FloatField()
        )
    ).filter(
        Q(rank__gt=0) |
        Q(name_sim__gt=0.1) |
        Q(builder_sim__gt=0.1) |
        Q(name__icontains=query_str) |
        Q(builder__icontains=query_str) |
        Q(description__icontains=query_str)
    )

    # Calculate distance and boost nearby properties
    scored_results = []
    for prop in results:
        text_score = prop.text_score or 0.0
        distance_km = None
        if user_lat and user_lon and prop.latitude and prop.longitude:
            dist = calculate_haversine_distance(
                float(user_lat), float(user_lon), prop.latitude, prop.longitude
            )
            if dist is not None:
                distance_km = round(dist, 2)
                # Proximity boost: closer = higher boost (max 1.0 at 0km, 0 at 50km+)
                proximity_boost = max(0, 1.0 - (dist / 50.0))
                text_score += proximity_boost
        prop.final_score = text_score
        prop.distance_km = distance_km
        scored_results.append(prop)

    scored_results.sort(key=lambda x: x.final_score, reverse=True)
    scored_results = scored_results[:10]

    data = {
        'results': ListedPropertySerializer(scored_results, many=True, context={'request': request}).data,
    }
    cache.set(cache_key, data, timeout=300)
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
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
