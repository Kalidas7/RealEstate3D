import requests
import re
url = 'https://maps.app.goo.gl/ESma1prCVdmWFj15A?g_st=ic'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
try:
    response = requests.get(url, allow_redirects=True, headers=headers, timeout=5)
    expanded_url = response.url
    print('Expanded URL:', expanded_url)

    match1 = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', expanded_url)
    print('Match 1 (@):', match1.groups() if match1 else None)

    match2 = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', expanded_url)
    print('Match 2 (ll=):', match2.groups() if match2 else None)

    html = response.text
    meta_match = re.search(r'meta content=\".*?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)', html)
    print('Match 3 (meta):', meta_match.groups() if meta_match else None)

    html_match = re.search(r'\[\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]', html)
    print('Match 4 (JS array):', html_match.groups() if html_match else None)
except Exception as e:
    print('Error:', e)
