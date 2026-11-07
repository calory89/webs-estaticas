#!/usr/bin/env python3
"""Prune unreferenced shared assets from a checkout of branch pub/_lovable.

Cloudflare Pages (project web-lovable) refuses deploys over 20,000 files.
Every SPA rebuild leaves its old hashed bundles in assets/, so the tree grows.

Usage (inside a clone of pub/_lovable):
  python3 tools/prune-pub-assets.py          # dry run: prints counts
  python3 tools/prune-pub-assets.py --apply  # git rm the unreferenced files

A file in assets/ is kept if its name appears (transitively) in any non-asset
text file (HTML/JS/CSS/JSON/..., including _worker.js). Subfolders of assets/
are always kept. Review, commit and push on top of the current head (no force).
"""
import os, re, subprocess, sys
files = [f for f in subprocess.run(['git', 'ls-tree', '-r', '--name-only', 'HEAD'], capture_output=True, text=True).stdout.split('\n') if f]
assets = [f for f in files if f.startswith('assets/')]
by = {}
for a in assets: by.setdefault(os.path.basename(a), []).append(a)
tok = re.compile(r'[A-Za-z0-9_\-\.@~]+\.(?:js|mjs|css|png|webp|jpe?g|svg|woff2?|ttf|gif|mp4|webm|json|ico|wasm|glb|gltf|hdr|bin|mp3|txt|pdf|avif)')
TEXT = ('.html', '.js', '.mjs', '.css', '.json', '.txt', '.xml', '.svg', '.webmanifest')
def refs(p):
    try: t = open(p, encoding='utf-8', errors='ignore').read()
    except OSError: return set()
    return {m for m in tok.findall(t) if m in by}
seen, stack = set(), []
for f in files:
    if not f.startswith('assets/') and (f.endswith(TEXT) or '.' not in os.path.basename(f)):
        for r in refs(f) - seen: seen.add(r); stack.append(r)
while stack:
    for p in by[stack.pop()]:
        if p.endswith(('.js', '.mjs', '.css', '.json', '.svg', '.html')):
            for r in refs(p) - seen: seen.add(r); stack.append(r)
unref = [a for a in assets if a.count('/') == 1 and os.path.basename(a) not in seen]
print(f'files {len(files)}  assets {len(assets)}  unreferenced {len(unref)}  after {len(files) - len(unref)}')
if len(files) - len(unref) > 19000: print('WARNING: still close to the 20,000-file Pages limit')
if '--apply' in sys.argv and unref:
    subprocess.run(['git', 'rm', '-q', '--sparse', '--'] + unref, check=True)
    print('git rm done; now commit and push (no force).')
