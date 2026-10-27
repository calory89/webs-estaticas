# Avisa a Bing, Yandex, Seznam y Naver (IndexNow) de las URLs que han cambiado en
# esta publicacion. Google no usa IndexNow: para Google vale el sitemap con lastmod
# y Search Console. La clave es un fichero de texto en la raiz con su propio nombre.
import json, os, sys, subprocess, hashlib
KEY_FILE = 'indexnow.key'
if not os.path.exists(KEY_FILE):
    open(KEY_FILE, 'w').write(hashlib.sha256(os.urandom(32)).hexdigest()[:32])
key = open(KEY_FILE).read().strip()
open(key + '.txt', 'w').write(key)                   # se sube a la raiz
urls = [u.strip() for u in open('urls_all.txt', encoding='utf-8') if u.strip()]
if len(sys.argv) > 1 and sys.argv[1] == '--send':
    sent = 0
    for i in range(0, len(urls), 10000):
        body = json.dumps({'host': 'supportnear.com', 'key': key, 'keyLocation': 'https://supportnear.com/%s.txt' % key, 'urlList': urls[i:i+10000]})
        # El cuerpo va por fichero, no en la linea de ordenes: con 6.000 URLs son
        # 400 KB de argumento y el sistema corta en «Argument list too long».
        tmp = '.indexnow_body.json'
        open(tmp, 'w', encoding='utf-8').write(body)
        r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', 'https://api.indexnow.org/IndexNow', '-H', 'Content-Type: application/json; charset=utf-8', '--data-binary', '@' + tmp], capture_output=True, text=True)
        try: os.remove(tmp)
        except Exception: pass
        print('IndexNow', r.stdout, len(urls[i:i+10000]), 'urls'); sent += len(urls[i:i+10000])
    print('enviadas', sent)
else:
    print('clave', key, '| fichero', key + '.txt', '| urls', len(urls), '| usa --send tras publicar')
