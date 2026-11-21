# patch-pub: aplica la R26 de supportnear.com sobre la raiz de pub/_wp (argumento: la raiz).
# Solo escribe en _s/supportnear.com/. Comprueba sha256 de cada paquete y el blob git de cada fichero.
import sys, os, json, hashlib, tarfile, io, urllib.request
BASE = 'https://oykcsmextclpdnugixqz.supabase.co/storage/v1/object/public/sn-deploy-530bed35a65b9f45/r26/'
MSHA = '5e63314bfa62eb1c7e1888785fe55f408336f7bce6ff58c8f8061e61330add69'
root = os.path.abspath(sys.argv[1]); D = os.path.join(root, '_s', 'supportnear.com')
def get(name):
    with urllib.request.urlopen(BASE + name, timeout=120) as r: return r.read()
mb = get('manifest.json'); assert hashlib.sha256(mb).hexdigest() == MSHA, 'manifest sha256'
m = json.loads(mb)
def blob(b): return hashlib.sha1(b'blob %d\0' % len(b) + b).hexdigest()
done = 0
for ch in m['chunks']:
    tb = get(ch['name']); assert hashlib.sha256(tb).hexdigest() == ch['sha256'], ch['name']
    with tarfile.open(fileobj=io.BytesIO(tb), mode='r:gz') as t:
        for mem in t.getmembers():
            if not mem.isfile(): continue
            rel = os.path.normpath(mem.name)
            assert not rel.startswith('..') and not os.path.isabs(rel), rel
            assert rel in m['changed'], 'no esta en el manifiesto: ' + rel
            b = t.extractfile(mem).read(); assert blob(b) == m['changed'][rel], 'blob ' + rel
            p = os.path.join(D, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'wb').write(b); done += 1
assert done == len(m['changed']), (done, len(m['changed']))
bad = [r for r, s in m['changed'].items() if blob(open(os.path.join(D, r), 'rb').read()) != s]
assert not bad, bad[:5]
print('R26 aplicada: %d ficheros, todos verificados' % done)
