#!/usr/bin/env python3
"""Caja 'En resumen' al inicio y 'Preguntas frecuentes' (+ FAQPage) al final de cada guia (idempotente).
Fuente: /home/claude/tools/tldr_faq.json {url: {a, faq}}. Uso: python3 tldr_faq.py <raiz>"""
import os, re, sys, json, html
ROOT = sys.argv[1]
T = json.load(open('/home/claude/tools/tldr_faq.json'))
e = lambda s: html.escape(s, quote=False)
ST = ('<style>.cdo-tldr{border-left:4px solid #0E4F49;background:#F1F6F4;border-radius:0 14px 14px 0;padding:14px 18px;margin:0 0 26px;font-size:17px;line-height:1.6}'
      '.cdo-tldr b{display:block;font:800 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#0E4F49;margin-bottom:8px}'
      '.cdo-tldr p{margin:0!important}.cdo-faq{margin-top:40px}.cdo-faq h2{font-size:26px;margin:0 0 10px}.cdo-faq details{border-top:1px solid #E6E1D8;padding:14px 0}'
      '.cdo-faq summary{cursor:pointer;font-weight:700;font-size:17px}.cdo-faq details p{margin:8px 0 0;color:#3A3A44}</style>')
n = nf = 0
for u, r in T.items():
    fp = os.path.join(ROOT, u.strip('/'), 'index.html')
    if not os.path.exists(fp): continue
    s = open(fp).read()
    s = re.sub(r'<style>\.cdo-tldr\{.*?</style>', '', s, flags=re.S)
    s = re.sub(r'<aside class="cdo-tldr".*?</aside>\s?', '', s, flags=re.S)
    s = re.sub(r'<div class="read cdo-faq".*?</div><!--/cdo-faq-->\s?', '', s, flags=re.S)
    s = re.sub(r'<script type="application/ld\+json" class="cdo-faq-ld">.*?</script>\s?', '', s, flags=re.S)
    a = (r.get('a') or '').strip(); faq = [q for q in (r.get('faq') or []) if len(q) == 2 and q[0].strip() and q[1].strip()]
    i = s.find('<div class="entry">')
    if i < 0: continue
    j = i + len('<div class="entry">')
    m = re.match(r'\s*<nav class="cdo-series".*?</nav>\s?', s[j:], re.S)
    if m: j += m.end()
    if a:
        s = s[:j] + f' {ST}<aside class="cdo-tldr" aria-label="En resumen"><b>En resumen</b><p>{e(a)}</p></aside> ' + s[j:]; n += 1
    else:
        s = s[:j] + f' {ST}' + s[j:]
    if faq:
        blk = ('<div class="read cdo-faq"><h2>Preguntas frecuentes</h2>' + ''.join(f'<details><summary>{e(q)}</summary><p>{e(an)}</p></details>' for q, an in faq) + '</div><!--/cdo-faq--> ')
        k = s.find('<div class="read" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:34px">', i)
        if k < 0: k = s.find('<div class="share">', i)
        if k > 0:
            s = s[:k] + blk + s[k:]
            ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': an}} for q, an in faq]}
            s = s.replace('</head>', f'<script type="application/ld+json" class="cdo-faq-ld">{json.dumps(ld, ensure_ascii=False)}</script>\n</head>', 1); nf += 1
    open(fp, 'w').write(s)
print(n, 'resumenes', nf, 'bloques FAQ')
