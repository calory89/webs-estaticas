#!/usr/bin/env python3
"""Reduce el nº de ficheros (límite 20.000 de Cloudflare Pages): quita srcset/sizes de las páginas
y borra las miniaturas de WordPress (-WxH) que ya no referencia nada. Uso: python3 _hlc/slim.py [--dry]"""
import os, re, sys, subprocess
from urllib.parse import unquote
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
dry = '--dry' in sys.argv
files = [f for f in subprocess.run(['git', 'ls-files', '-co', '--exclude-standard', '-z'], capture_output=True).stdout.decode().split('\0') if f]
SRCSET = re.compile(r'\s(?:data-)?(?:srcset|sizes)="[^"]*"', re.I)
changed = 0
for f in files:
    if f.endswith('.html'):
        s = open(f, encoding='utf-8', errors='ignore').read()
        t = SRCSET.sub('', s)
        if t != s:
            changed += 1
            if not dry:
                open(f, 'w', encoding='utf-8').write(t)
refs = set()
REF = re.compile(r'wp-content/uploads/[^"\'\s)<>,?#]+')
for f in files:
    if f.endswith(('.html', '.css', '.js', '.xml', '.json', '.txt')) and os.path.exists(f):
        s = open(f, encoding='utf-8', errors='ignore').read()
        if dry and f.endswith('.html'):
            s = SRCSET.sub('', s)
        for m in REF.finditer(s.replace('\\/', '/')):
            refs.add(m.group(0)); refs.add(unquote(m.group(0)))
THUMB = re.compile(r'-\d+x\d+\.(?:jpe?g|png|webp|gif)$', re.I)
gone = [f for f in files if f.startswith('wp-content/uploads/') and THUMB.search(f) and f not in refs]
if not dry:
    for f in gone:
        os.remove(f)
print({'html_changed': changed, 'refs': len(refs), 'thumbs_removed': len(gone)})
