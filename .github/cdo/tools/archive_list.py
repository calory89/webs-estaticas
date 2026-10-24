#!/usr/bin/env python3
"""Regenera la lista por años de /archive/ desde data.json. Uso: python3 archive_list.py <raiz>"""
import os, re, sys, json, html, collections
ROOT = sys.argv[1]
P = json.load(open('/home/claude/tools/data.json'))['posts']
fp = os.path.join(ROOT, 'archive/index.html'); s = open(fp).read()
a = s.find('<section class="sec" style="padding:24px 0"><h2 style="font-size:28px">'); b = s.rfind('</section>', 0, s.find('</main>')) + len('</section>')
by = collections.defaultdict(list)
for u, p in P.items(): by[(p.get('date') or '0000')[:4]].append(p)
LI = 'style="break-inside:avoid;padding:6px 0;border-bottom:1px solid var(--line)"'
out = ''
for y in sorted(by, reverse=True):
    ps = sorted(by[y], key=lambda p: p.get('date') or '', reverse=True)
    out += (f'<section class="sec" style="padding:24px 0"><h2 style="font-size:28px">{y} <small style="font:700 14px var(--mono);color:var(--ink-2)">{len(ps)}</small></h2>'
            '<ul style="list-style:none;padding:0;margin:12px 0 0;columns:2 340px;column-gap:32px">' +
            ''.join(f'<li data-l="{p["lang"]}" {LI}><a href="{p["url"]}" style="text-decoration:none"{" lang=\"en\"" if p["lang"] == "en" else ""}>{html.escape(p["h1"], quote=False)}</a></li>' for p in ps) + '</ul></section>\n')
s = s[:a] + out.rstrip('\n') + s[b:]
open(fp, 'w').write(s)
print(sum(len(v) for v in by.values()), 'articulos en', len(by), 'años')
