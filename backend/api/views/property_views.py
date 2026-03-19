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
    Full-text + fuzzy search endpoint. Accepts ?q=query.
    Uses PostgreSQL tsvector (name=A, builder=B, description=C) for full-text rank
    and pg_trgm TrigramSimilarity for fuzzy matching.
    Combined score = rank + name_sim*0.5 + builder_sim*0.3.
    Results cached per query (lowercased) for 5 minutes.
    Requires: CREATE EXTENSION IF NOT EXISTS pg_trgm; on the database.
    """
    query_str = request.query_params.get('q', '').strip()
    if not query_str:
        return Response({'sponsored': [], 'listed': []}, status=status.HTTP_200_OK)

    cache_key = f'search:{query_str.lower()}'
    cached = cache.get(cache_key)
    if cached:
        return Response(cached, status=status.HTTP_200_OK)

    def scored(queryset):
        vector = (
            SearchVector('name', weight='A') +
            SearchVector('builder', weight='B') +
            SearchVector('description', weight='C')
        )
        fts_query = SearchQuery(query_str, search_type='plain')
        return queryset.annotate(
            rank=SearchRank(vector, fts_query),
            name_sim=TrigramSimilarity('name', query_str),
            builder_sim=TrigramSimilarity('builder', query_str),
            combined_score=ExpressionWrapper(
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
        ).order_by('-combined_score')

    sponsored = scored(Property.objects.all())
    listed = scored(ListedProperty.objects.all())

    data = {
        'sponsored': PropertySerializer(sponsored, many=True, context={'request': request}).data,
        'listed': ListedPropertySerializer(listed, many=True, context={'request': request}).data,
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
