import requests
import re

url = 'https://maps.app.goo.gl/E5ma1prCVdmWFj15A?g_st=ic'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

try:
    r = requests.get(url, allow_redirects=True, headers=headers, timeout=5)
    print('STATUS:', r.status_code)
    print('EXPANDED URL:', r.url)

    match1 = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', r.url)
    print('Match 1 (@):', match1.groups() if match1 else None)

    match2 = re.search(r'll=(-?\d+\.\d+),(-?\d+\.\d+)', r.url)
    print('Match 2 (ll=):', match2.groups() if match2 else None)

    html = r.text
    meta_match = re.search(r'meta content=\".*?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)', html)
    print('Match 3 (meta):', meta_match.groups() if meta_match else None)

    html_match = re.search(r'\[\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]', html)
    print('Match 4 (JS array):', html_match.groups() if html_match else None)
    
    # Let's save the HTML to inspect it later if matches fail
    with open('test_html.html', 'w', encoding='utf-8') as f:
        f.write(html)
except Exception as e:
    print('Error:', e)
