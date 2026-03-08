import math
import re
import requests

def extract_coords_from_maps_link(url):
    if not url:
        return None, None
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, allow_redirects=True, headers=headers, timeout=5)
        
        # We must check intermediate 302 redirects! Render's headless IP forces
        # Google to drop parameters on the final hop and serve a blank map of Texas.
        urls_to_parse = [response.url]
        for r in response.history:
            if 'Location' in r.headers:
                urls_to_parse.append(r.headers['Location'])
                
        for u in urls_to_parse:
            # Strategy 1: URL contains @lat,lon
            match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', u)
            if match:
                return float(match.group(1)), float(match.group(2))
                
            # Strategy 2: URL contains ll=lat,lon
            match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', u)
            if match:
                return float(match.group(1)), float(match.group(2))
                
            # Strategy 3: URL contains saddr=lat,lon (Directions origin)
            match = re.search(r'saddr=(-?\d+\.\d+),(-?\d+\.\d+)', u)
            if match:
                return float(match.group(1)), float(match.group(2))
                
            # Strategy 4: URL contains daddr=lat,lon (Directions destination)
            match = re.search(r'daddr=(-?\d+\.\d+),(-?\d+\.\d+)', u)
            if match:
                return float(match.group(1)), float(match.group(2))
            
        # Strategy 3: Check HTML Meta Tags
        html = response.text
        meta_match = re.search(r'meta content=".*?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)', html)
        if meta_match:
            return float(meta_match.group(1)), float(meta_match.group(2))
            
        # Strategy 4: Check JS Array in HTML
        html_match = re.search(r'\[\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]', html)
        if html_match:
            return float(html_match.group(1)), float(html_match.group(2))
            
    except Exception as e:
        print(f"Error extracting coordinates: {e}")
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
