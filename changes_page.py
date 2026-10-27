# -*- coding: utf-8 -*-
# «Que ha cambiado»: la pagina que un periodico si puede usar.
#
# Cada vez que se publica, se compara lo que hay con lo que habia la vez
# anterior: sitios nuevos, sitios que desaparecieron, ciudades que crecieron.
# Sale sola, sin escribir nada, y es el tipo de dato con el que alguien hace una
# pieza («la ciudad que perdio doce comedores este ano»). La primera vez solo
# guarda la foto; a partir de la segunda, compara.
import io, json, os, re, math, hashlib, html as H
from datetime import date
from collections import Counter
from seo_common import finalize

h = io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
STR = json.loads(re.search(r'const STR = /\*__STR__\*/(\[.*?\]);', h, re.S).group(1))
CITIES = json.loads(re.search(r'const CITIES = /\*__CITIES__\*/(\[.*?\]);', h, re.S).group(1))
STATS = json.loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', h, re.S).group(1))
CATIDS = ['food', 'shelter', 'hygiene', 'clothes', 'social', 'legal', 'health', 'water', 'warm']
CATNAME = {'food': 'food', 'shelter': 'shelter', 'hygiene': 'showers & toilets', 'clothes': 'clothes',
           'social': 'social help', 'legal': 'legal aid', 'health': 'health care', 'water': 'drinking water', 'warm': 'warm places'}
CSS = io.open('page.css.txt', encoding='utf-8').read()
S_ = lambda v: (STR[v] if isinstance(v, int) and 0 <= v < len(STR) else (v or ''))


def hav(a, b, c, d):
    R = 6371.0; p = math.pi / 180
    x = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))


# foto de ahora: id -> (nombre, cat, lat, lon)
now = {}
for f in sorted(os.listdir('d')):
    if not f.endswith('.json'):
        continue
    la = lo = 0
    for r in json.load(io.open(os.path.join('d', f), encoding='utf-8')):
        la += r[1]; lo += r[2]
        oid = r[5]
        oid = ('way/%d' % -oid if oid < 0 else 'node/%d' % oid) if isinstance(oid, int) else oid
        now[oid] = (S_(r[0]), CATIDS[r[3]], la / 1e5, lo / 1e5)

# Dos fotos: la de los datos de ahora (snapshot_now.json, con la fecha en que
# los datos cambiaron por ultima vez) y la de los datos anteriores DISTINTOS
# (snapshot.json). Antes se guardaba una foto en cada publicacion y se comparaba
# con la ultima: si se publicaba dos veces con los mismos datos, la pagina
# anunciaba «0 nuevos · 0 desaparecidos» como si fuera noticia (QA m7).
SNAP, NOW = 'snapshot.json', 'snapshot_now.json'
today = date.today().isoformat()
_h = hashlib.sha1(json.dumps(sorted((k, v[0], v[1]) for k, v in now.items()), ensure_ascii=False).encode('utf-8')).hexdigest()
cur = json.load(io.open(NOW, encoding='utf-8')) if os.path.exists(NOW) else None
prev = json.load(io.open(SNAP, encoding='utf-8')) if os.path.exists(SNAP) else None
if cur and cur.get('hash') != _h:
    prev = cur                                    # los datos cambiaron: lo de ahora pasa a ser lo anterior
    json.dump(prev, io.open(SNAP, 'w', encoding='utf-8'), ensure_ascii=False)
    cur = None
if not cur:
    cur = {'date': today, 'hash': _h, 'places': {k: [v[0], v[1], v[2], v[3]] for k, v in now.items()}}
    json.dump(cur, io.open(NOW, 'w', encoding='utf-8'), ensure_ascii=False)
data_date = cur['date']


def nearest_city(la, lo):
    best, bd = '', 1e9
    for c in CITIES:
        d = hav(la, lo, c[1], c[2])
        if d < bd:
            best, bd = c[0].split('·')[-1].strip() if not re.search(r'[A-Za-z]', c[0].split('·')[0]) else c[0].split('·')[0].strip(), d
    return best if bd < 40 else ''


body_rows = ''
if prev and not (set(prev['places']) ^ set(now)):
    body_rows = ('<div class="card"><p>The data of %s and of %s contain the same places, so there is nothing new to list. '
                 'The comparison is made again with each data update from OpenStreetMap.</p></div>' % (prev['date'], data_date))
elif prev:
    pids = set(prev['places']); nids = set(now)
    added = nids - pids; gone = pids - nids
    by_city_add = Counter(nearest_city(*now[i][2:]) for i in added)
    by_city_gone = Counter(nearest_city(*prev['places'][i][2:]) for i in gone)
    cat_add = Counter(now[i][1] for i in added); cat_gone = Counter(prev['places'][i][1] for i in gone)
    body_rows = (
        '<div class="statbar"><div><b>%d</b><span>new places</span></div><div><b>%d</b><span>gone</span></div>'
        '<div><b>%+d</b><span>net</span></div><div><b>%s</b><span>since</span></div></div>' % (len(added), len(gone), len(added) - len(gone), prev['date'])
        + '<h2>By kind of help</h2><ul>' + ''.join('<li><strong>%s</strong>: +%d / &minus;%d</li>' % (H.escape(CATNAME[c]), cat_add[c], cat_gone[c]) for c in CATIDS if cat_add[c] or cat_gone[c]) + '</ul>'
        + '<h2>Cities that grew most</h2><ul>' + ''.join('<li><strong>%s</strong>: +%d</li>' % (H.escape(c or 'elsewhere'), n) for c, n in by_city_add.most_common(15)) + '</ul>'
        + '<h2>Cities that lost places</h2><ul>' + ''.join('<li><strong>%s</strong>: &minus;%d</li>' % (H.escape(c or 'elsewhere'), n) for c, n in by_city_gone.most_common(15)) + '</ul>'
        + '<h2>Some of the new places</h2><ul>' + ''.join('<li><a href="./#p=%s@%.5f,%.5f">%s</a> <small>%s · %s</small></li>'
            % (H.escape(i), now[i][2], now[i][3], H.escape(now[i][0] or CATNAME[now[i][1]]), CATNAME[now[i][1]], H.escape(nearest_city(now[i][2], now[i][3]) or ''))
            for i in sorted(added, key=lambda k: (not now[k][0], now[k][0]))[:40]) + '</ul>'
        + '<p style="color:var(--ink-3);font-size:14px">A place «gone» usually means it was removed or re-tagged on OpenStreetMap, '
          'or that our filters stopped counting it (for example, it started charging). It does not always mean it closed.</p>'
    )
else:
    body_rows = ('<div class="card"><p>This is the first snapshot (%s). From the next data update on, this page shows what appeared, '
                 'what disappeared and which cities changed most.</p></div>' % data_date)

import hashlib
SV = '?v=' + hashlib.sha1(open('social.jpg','rb').read()).hexdigest()[:8]
_m = re.search(r'<meta name="sn-reports" content="([^"]*)"', io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read())
REPORTS_URL = (_m.group(1) if _m else '').rstrip('/')
GAPS = ('<h2>Where people found nothing</h2><p>When someone widens the search and still finds nothing, they can tell us what they were looking for. '
        'Only the area (about 1 km), the city and the need: no name, no account. This is the queue for where to look for data first.</p>'
        '<div id="gaps" class="card"><p>Loading…</p></div>'
        '<script>fetch("%s/gaps").then(r=>r.json()).then(l=>{const e=document.getElementById("gaps");if(!l.length){e.innerHTML="<p>Nothing reported yet.</p>";return;}'
        'e.innerHTML="<ul>"+l.slice(0,60).map(g=>"<li><b>"+(g.city||(g.lat+", "+g.lon))+"</b>"+(g.cc?" ("+g.cc+")":"")+(g.cat?" · "+g.cat:"")+" · "+g.n+"×"+(g.t?" · "+g.t:"")+"</li>").join("")+"</ul>";}).catch(()=>{document.getElementById("gaps").innerHTML="<p>Could not load.</p>";});</script>' % REPORTS_URL) if REPORTS_URL else \
       ''   # sin el worker de avisos no hay lista que ensenar (antes salia aqui una nota interna)
page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>What changed · SupportNear</title>
<meta name="description" content="What changed on the free-help map since the last update: new places, places gone, cities that grew.">
<link rel="canonical" href="https://supportnear.com/cambios">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="https://supportnear.com/cambios"><meta property="og:title" content="What changed &middot; SupportNear"><meta property="og:description" content="What changed on the free-help map since the last update: new places, places gone, cities that grew.">
<meta property="og:image" content="https://supportnear.com/social.jpg{SV}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="SupportNear: free help, mapped in 166 countries. Food, a bed, a shower, clothes, a doctor.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups"><meta name="twitter:title" content="What changed &middot; SupportNear"><meta name="twitter:description" content="What changed on the free-help map since the last update: new places, places gone, cities that grew."><meta name="twitter:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="favicon.ico" sizes="32x32"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="theme-color" content="#0B7A63">
<style>{CSS}
.statbar{{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:18px 0}}
.statbar div{{background:var(--paper-2);padding:14px 8px;text-align:center}} .statbar b{{display:block;font-size:24px}} .statbar span{{font-size:12.5px;color:var(--ink-3)}}
ul{{padding-inline-start:20px;line-height:1.7}}</style></head>
<body><div class="wrap"><a class="backlink" href="./">&larr; Open the map</a>
<h1>What changed</h1>
<p class="lede">The map has {STATS["places"]:,} places in {STATS["cities"]} cities across {STATS["countries"]} countries. Data from {data_date}. This page is generated from the data itself each time the data is updated.</p>
{body_rows}
<h2>How to use this</h2>
<p>Every number here is checkable: each new place links to its card, and each card links to the OpenStreetMap element it comes from. If you write about it, the <a href="prensa.html">press kit</a> has the figures and screenshots.</p>
{GAPS}
<footer>SupportNear &middot; OpenStreetMap (ODbL)</footer></div></body></html>'''
io.open('cambios.html', 'w', encoding='utf-8').write(finalize(page))
print('cambios.html', 'con comparacion desde ' + prev['date'] if prev else 'primera foto', '|', len(now), 'sitios')
