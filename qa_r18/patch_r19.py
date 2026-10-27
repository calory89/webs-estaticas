# SupportNear Ronda 19: app (index.html, l/*.json, towns.json) desde un .tgz
# verificado (sha256) y despues patch_live.py (paginas estaticas, worker solo
# para supportnear.com, 404, borra falta.html). Solo toca _s/supportnear.com/
# y los bloques marcados de supportnear en _worker.js.
import sys, os, io, tarfile, hashlib, urllib.request, subprocess
BASE = "https://oykcsmextclpdnugixqz.supabase.co/storage/v1/object/public/sn-deploy-530bed35a65b9f45/"
SHA = "add6b943461bb402f3b64f4f49f7ce1076256a19d225a02f584787de71e4dab0"; PSHA = "f73c04c7a8c02c8bd385d53ccc558b8167f1a4e7124cc9c75de1d439ff19cb43"
root = sys.argv[1]
b = urllib.request.urlopen(BASE + "r19.tgz", timeout=120).read()
assert hashlib.sha256(b).hexdigest() == SHA, "sha mismatch tgz"
t = tarfile.open(fileobj=io.BytesIO(b), mode="r:gz"); n = 0
for m in t.getmembers():
    p = os.path.normpath(m.name)
    if not m.isfile() or not p.startswith("_s/supportnear.com/") or ".." in p.split("/"): continue
    d = os.path.join(root, p); os.makedirs(os.path.dirname(d), exist_ok=True)
    data = t.extractfile(m).read()
    if os.path.exists(d) and open(d, "rb").read() == data: continue
    open(d, "wb").write(data); n += 1
print("ficheros nuevos/cambiados:", n)
pl = urllib.request.urlopen(BASE + "patch_live.py", timeout=120).read()
assert hashlib.sha256(pl).hexdigest() == PSHA, "sha mismatch patch_live"
open("/tmp/patch_live.py", "wb").write(pl)
r = subprocess.run([sys.executable, "/tmp/patch_live.py", root], capture_output=True, text=True)
print(r.stdout[-6000:]); print(r.stderr[-3000:])
assert r.returncode == 0, "patch_live failed"
r2 = subprocess.run([sys.executable, "/tmp/patch_live.py", root], capture_output=True, text=True)
print("segunda pasada:", r2.stdout[-800:])
