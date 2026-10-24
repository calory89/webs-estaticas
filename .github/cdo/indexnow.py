"""Envia a IndexNow (Bing, Yandex, Seznam, Naver...) las URLs de las paginas HTML cambiadas entre dos commits."""
import os, sys, subprocess, json, urllib.request
SITE = 'https://www.carlosdeory.com'; KEY = os.environ['INDEXNOW_KEY']
before, after = sys.argv[1], sys.argv[2]
try:
    out = subprocess.check_output(['git', 'diff', '--name-only', '--diff-filter=AM', before, after], text=True)
except Exception:
    out = subprocess.check_output(['git', 'show', '--name-only', '--pretty=', after], text=True)
urls = []
for f in out.split():
    if not f.endswith('.html') or f.startswith('.') or '/page/' in f or f.startswith('tag/'): continue
    if f == '404.html': continue
    urls.append(SITE + '/' + (f[:-10] if f.endswith('index.html') else f))
urls = sorted(set(urls))[:10000]
print(len(urls), 'URLs')
if not urls: sys.exit(0)
body = json.dumps({'host': 'www.carlosdeory.com', 'key': KEY, 'keyLocation': f'{SITE}/{KEY}.txt', 'urlList': urls}).encode()
req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
try:
    r = urllib.request.urlopen(req, timeout=60); print('IndexNow', r.status)
except urllib.error.HTTPError as e:
    print('IndexNow', e.code, e.read()[:300]); sys.exit(0 if e.code in (200, 202) else 1)
