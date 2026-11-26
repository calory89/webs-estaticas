#!/usr/bin/env python3
# kolaboro.com: rebuild the rule list of /tools/law/index.html from /tools/law/law.json.
# The page around the list (head, hero, footer) stays as it is; this script only rewrites the parts that
# come from the data: the count in the lead, the description, the country filter, the list of notes and
# the sitemap lastmod. Run after every change to law.json:  python3 _s/kolaboro.com/open/law-page-build.py
import html, json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LJ = os.path.join(ROOT, 'tools/law/law.json')
PG = os.path.join(ROOT, 'tools/law/index.html')
SM = os.path.join(ROOT, 'sitemap.xml')
e = lambda s: html.escape(str(s), quote=True)

d = json.load(open(LJ, encoding='utf-8'))
rules, mk, top, src = d['rules'], d['markets'], d['topics'], d['sources']
n = len(rules)
count = {}
for r in rules: count[r['market']] = count.get(r['market'], 0) + 1


def art(r):
    s = src[r['source']]
    lang = s.get('language', 'en')
    tops = ', '.join(top[t] for t in r.get('topics', []))
    out = ['<article class="ft-f good lw-r" id="%s" data-mk="%s">' % (e(r['id']), e(r['market'])),
           '<p class="lw-mk">%s &middot; %s</p>' % (e(mk[r['market']]), e(tops)),
           '<h3>%s</h3>' % e(r['title']), '<p>%s</p>' % e(r['plain']),
           '<blockquote lang="%s">%s</blockquote>' % (e(lang), e(r['quote']))]
    if r.get('translation'):
        out.append('<p class="cc-tr"><span>Our translation:</span> %s</p>' % e(r['translation']))
    note = (' ' + s['note']) if s.get('note') else ''
    read = r.get('checked') or s.get('read') or d.get('version')
    out.append('<p class="cc-src"><a href="%s" target="_blank" rel="noopener noreferrer">%s, %s</a> <span>%s. Official text read on %s.%s</span></p>'
               % (e(s['url']), e(s['law']), e(r['cite']), e(s['publisher'].rstrip('.')), e(read), e(note)))
    out.append('</article>')
    return ''.join(out)


lst = ''.join(art(r) for r in rules)
flt = '<button type="button" data-lw="" aria-pressed="true">All (%d)</button>' % n + ''.join(
    '<button type="button" data-lw="%s" aria-pressed="false">%s (%d)</button>' % (e(k), e(v), count.get(k, 0)) for k, v in mk.items() if count.get(k))
names = [v for k, v in mk.items() if count.get(k)]
desc = '%d law notes for off-plan buyers in %s and %s: deposits, escrow, delays, ownership. The article quoted, with the official link.' % (n, ', '.join(names[:-1]), names[-1])
if len(desc) > 160:
    desc = '%d law notes for off-plan buyers in %d markets: deposits, escrow, delays and foreign ownership. The article quoted, with the official link.' % (n, len(names))
assert len(desc) <= 160, len(desc)
latest = max([r.get('checked') or '' for r in rules] + [s.get('read', '') for s in src.values()])

p = open(PG, encoding='utf-8').read()
o = p


def sub(pat, rep, s, flags=re.S):
    s2, k = re.subn(pat, lambda m: rep(m), s, count=1, flags=flags)
    assert k == 1, pat
    return s2


p = sub(r'(<div class="lw-filter"[^>]*>).*?(</div>)', lambda m: m.group(1) + flt + m.group(2), p)
# the country pages that show the same rules in 8 languages (one link per market with notes)
CC = {'ID': 'indonesia', 'AE-DU': 'uae', 'TH': 'thailand', 'ES': 'spain', 'PT': 'portugal', 'US-FL': 'usa', 'AU-VIC': 'australia', 'MX': 'mexico', 'JP': 'japan', 'GB': 'united-kingdom', 'TR': 'turkey'}
cc = '<p class="tl-hint lw-cc">The same notes by country, in 8 languages: ' + ', '.join('<a href="/countries/%s/buyer-protection-law/">%s</a>' % (CC[k], e(v)) for k, v in mk.items() if count.get(k) and k in CC) + '.</p>'
if 'class="tl-hint lw-cc"' in p: p = sub(r'<p class="tl-hint lw-cc">.*?</p>', lambda m: cc, p)
else: p = sub(r'(<div class="lw-filter"[^>]*>.*?</div>)', lambda m: m.group(1) + '\n  ' + cc, p)
p = sub(r'(<div class="lw-list" id="lwList">).*?</article></div>', lambda m: m.group(1) + lst + '</div>', p)
p = sub(r'(<p class="lead">)\d+( short notes)', lambda m: m.group(1) + str(n) + m.group(2), p)
for pat in (r'(<meta name="description" content=")[^"]*(")', r'(<meta property="og:description" content=")[^"]*(")'):
    p = sub(pat, lambda m: m.group(1) + e(desc) + m.group(2), p)
assert '—' not in lst and '–' not in lst
if p != o:
    open(PG, 'w', encoding='utf-8').write(p)
    if os.path.exists(SM):
        sm = open(SM, encoding='utf-8').read()
        sm2 = re.sub(r'(<loc>https://kolaboro.com/tools/law/</loc><lastmod>)[^<]*', lambda m: m.group(1) + latest, sm)
        if sm2 != sm: open(SM, 'w', encoding='utf-8').write(sm2)
print('law page: %d notes, %d markets, desc %d chars, %s' % (n, len(names), len(desc), 'changed' if p != o else 'unchanged'))
