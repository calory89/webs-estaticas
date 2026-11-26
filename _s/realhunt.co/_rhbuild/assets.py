# Build step for the realhunt-media Pages project (root _s/realhunt.co), run from that folder:
# copy into ./assets/ every shared /assets/ file the realhunt.co pages need (fixpoint over JS/CSS imports).
import os, re, shutil, sys
SRC = '../../assets'; OUT = 'assets'
have = set(os.listdir(SRC))
NAME = re.compile(r'[A-Za-z0-9_.~-]+\.(?:js|mjs|css|woff2?|ttf|otf|svg|png|jpe?g|webp|avif|gif|ico|json|wasm|mp4|webm)')
REF = re.compile(r'assets/([A-Za-z0-9_.~-]+)')
need = set(); missing = set()
for root, dirs, files in os.walk('.'):
    if root.startswith('./' + OUT) or root.startswith('./_rhbuild'): continue
    for f in files:
        if not f.endswith(('.html', '.js', '.json', '.webmanifest', '.css', '.xml')): continue
        t = open(os.path.join(root, f), encoding='utf-8', errors='ignore').read()
        for n in REF.findall(t):
            (need if n in have else missing).add(n)
queue = list(need)
while queue:
    n = queue.pop()
    if not n.endswith(('.js', '.mjs', '.css')): continue
    t = open(os.path.join(SRC, n), encoding='utf-8', errors='ignore').read()
    for m in set(NAME.findall(t)):
        if m in have and m not in need: need.add(m); queue.append(m)
if not any(n.startswith('index-') and n.endswith('.js') for n in need):
    print('rh-assets: no index bundle found, stopping'); sys.exit(1)
os.makedirs(OUT, exist_ok=True)
for n in need: shutil.copy2(os.path.join(SRC, n), os.path.join(OUT, n))
print('rh-assets: copied', len(need), 'files; referenced but not in assets/:', len(missing), sorted(missing)[:10])
