import requests
import re

url = "https://maps.app.goo.gl/ZN38y9kdoD8ZvqED6?g_st=ic"
response = requests.get(url, allow_redirects=True, timeout=10)
print(f"Expanded URL: {response.url}")

match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', response.url)
if match:
    print(f"Latitude: {match.group(1)}, Longitude: {match.group(2)}")
else:
    print("No match found in response url.")
    
    # Sometimes Google Maps redirects wrap it in HTML or different parameters. 
    # Let's check the content for coordinates if url fails.
    content_match = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', response.url)
    if content_match:
        print(f"Found in ll param: {content_match.group(1)}, {content_match.group(2)}")
    
    html = response.text
    html_match = re.search(r'\[\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]', html)
    if html_match:
        print(f"Found in HTML: {html_match.group(1)}, {html_match.group(2)}")
        # Google maps html often has coords in JS arrays. Or meta tags.
        
    meta_match = re.search(r'meta content=".*?https://maps\.google\.com/maps/api/staticmap\?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)', html)
    if meta_match:
        print(f"Found in Meta map tag: {meta_match.group(1)}, {meta_match.group(2)}")
