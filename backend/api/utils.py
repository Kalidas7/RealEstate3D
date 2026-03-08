import math
import re
import requests

def extract_coords_from_maps_link(url, bias_text=None):
    """
    Extract coordinates from a Google Maps link using the Geocoding API.
    Removes legacy scraping logic and uses the official API for 100% reliability.
    """
    from django.conf import settings
    
    if not url:
        return None, None
        
    try:
        # 1. Resolve short links (maps.app.goo.gl) to get the true destination
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, allow_redirects=True, headers=headers, timeout=5)
        expanded_url = response.url
        history_urls = [r.headers.get('Location') for r in response.history if r.headers.get('Location')]
        all_urls = [expanded_url] + history_urls
        
        # 2. Check for DIRECT intent coordinates in the URL (Instant - saves API quota)
        for u in all_urls:
            # Match saddr=lat,lon (Directions origin), daddr=lat,lon (Directions destination)
            patterns = [
                r'saddr=(-?\d+\.\d+),(-?\d+\.\d+)',
                r'daddr=(-?\d+\.\d+),(-?\d+\.\d+)'
            ]
            for p in patterns:
                match = re.search(p, u)
                if match:
                    return float(match.group(1)), float(match.group(2))
        
        # 3. Use Geocoding API for place names/search queries
        # Extract query parameter 'q'
        q_match = re.search(r'q=([^&]+)', expanded_url)
        query = None
        if q_match:
            from urllib.parse import unquote
            query = unquote(q_match.group(1)).replace('+', ' ')
        else:
            # Fallback: Extract from the path (e.g., /place/Sowparnika+Atrium/)
            path_match = re.search(r'/place/([^/]+)', expanded_url)
            if path_match:
                from urllib.parse import unquote
                query = unquote(path_match.group(1)).replace('+', ' ')

        if query and settings.GOOGLE_MAPS_API_KEY:
            # Add bias text if provided (e.g., "Trivandrum") to help the geocoder
            full_query = f"{query}, {bias_text}" if bias_text else query
            api_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={full_query}&key={settings.GOOGLE_MAPS_API_KEY}"
            api_res = requests.get(api_url, timeout=5).json()
            if api_res.get('status') == 'OK':
                loc = api_res['results'][0]['geometry']['location']
                return loc['lat'], loc['lng']

    except Exception as e:
        print(f"Error in official extraction: {e}")
        
    return None, None

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
        
    try:
        # convert decimal degrees to radians 
        lon1, lat1, lon2, lat2 = map(math.radians, [float(lon1), float(lat1), float(lon2), float(lat2)])
        
        # haversine formula 
        dlon = lon2 - lon1 
        dlat = lat2 - lat1 
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a)) 
        
        r = 6371 # Radius of earth in kilometers
        return c * r
    except (ValueError, TypeError):
        return None
