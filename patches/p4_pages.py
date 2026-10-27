import io
p='/home/claude/supportnear/city_pages.py'; s=io.open(p,encoding='utf-8').read()
def R(a,b,cnt=1):
    global s
    n=s.count(a); assert n==cnt,(n,a[:90]); s=s.replace(a,b)

# ---- ayudantes: JSON-LD sin nulos, horario solo si schema.org lo entiende, pais en su idioma ----
R('''# ---- QR para el cartel ----''','''# JSON-LD: sin campos vacios (los validadores de Google marcan los null) y el
# horario solo cuando es sencillo, que es lo que schema.org entiende.
def ld_clean(x):
    if isinstance(x, dict): return {k: ld_clean(v) for k, v in x.items() if v not in (None, '', [], {})}
    if isinstance(x, list): return [ld_clean(v) for v in x]
    return x
_OH_OK = re.compile(r'^(?:(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:,(?:Mo|Tu|We|Th|Fr|Sa|Su)(?:-(?:Mo|Tu|We|Th|Fr|Sa|Su))?)* \\d\\d:\\d\\d-\\d\\d:\\d\\d(?:,\\d\\d:\\d\\d-\\d\\d:\\d\\d)*(?:; ?)?)+$')
def ld_oh(oh):
    oh = (oh or '').strip()
    if oh == '24/7': return 'Mo-Su 00:00-23:59'
    return oh if _OH_OK.match(oh) else None
# El pais en el idioma de la pagina: «Moçambique» en la portuguesa, no «Mozambique».
try:
    from babel import Locale as _Loc
except Exception:
    _Loc = None
_LOCS = {}
def country_in(cc, lang, fallback):
    if not _Loc or not cc or lang == 'en': return fallback
    try:
        if lang not in _LOCS: _LOCS[lang] = _Loc.parse(lang)
        return _LOCS[lang].territories.get(cc) or fallback
    except Exception:
        return fallback

# ---- QR para el cartel ----''')

# ---- ItemList de la pagina de ciudad: direccion, telefono, horario ----
R('''    "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": p['name'],
       "geo": {"@type": "GeoCoordinates", "latitude": round(p['lat'], 5), "longitude": round(p['lon'], 5)},
       "url": "https://supportnear.com/#p=%s@%.5f,%.5f" % (p['id'], p['lat'], p['lon'])}} for i, (_, p) in enumerate(named[:10])]
  }], ensure_ascii=False).replace('</', LDESC)}</script>''','''    "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": p['name'],
       "address": p.get('addr') or None, "telephone": p.get('phone') or None, "openingHours": ld_oh(p.get('oh')),
       "geo": {"@type": "GeoCoordinates", "latitude": round(p['lat'], 5), "longitude": round(p['lon'], 5)},
       "url": "https://supportnear.com/#p=%s@%.5f,%.5f" % (p['id'], p['lat'], p['lon'])}} for i, (_, p) in enumerate(named[:10])]
  }]), ensure_ascii=False).replace('</', LDESC)}</script>''')
R('''<script type="application/ld+json">{json.dumps([{
    "@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "inLanguage": lang,
    "url": "https://supportnear.com/c/%s.html" % sl,''','''<script type="application/ld+json">{json.dumps(ld_clean([{
    "@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "inLanguage": lang,
    "url": self_url,''')

# ---- paginas de necesidad: version inglesa propia para las ciudades grandes ----
R('''def need_page(city, country, cc, lang, sl, cat, near, local='', total=0):''','''def need_page(city, country, cc, lang, sl, cat, near, local='', total=0, main_lang=None):''')
R('''    url = 'https://supportnear.com/c/%s-%s.html' % (sl, cat)
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else \'\'''','''    url = 'https://supportnear.com/c/%s-%s%s.html' % (sl, cat, '.en' if main_lang else '')
    home = main_lang or lang
    alts_n = ('<link rel="alternate" hreflang="%s" href="https://supportnear.com/c/%s-%s.html">' % (home, sl, cat)
              + (('<link rel="alternate" hreflang="en" href="https://supportnear.com/c/%s-%s.en.html">' % (sl, cat)) if (main_lang or NEED_EN.get((sl, cat))) and home != 'en' else '')
              + '<link rel="alternate" hreflang="x-default" href="https://supportnear.com/c/%s-%s.html">' % (sl, cat))
    emg = EMG_N.get(cc); emgnum = emg[0] if emg else \'\'''')
R('''            "address": q['addr'] or None, "telephone": q.get('phone') or None,
            "openingHours": q.get('oh') or None,''','''            "address": q['addr'] or None, "telephone": q.get('phone') or None,
            "openingHours": ld_oh(q.get('oh')),''')
R('''    ld = json.dumps([{
        "@context": "https://schema.org", "@type": "WebPage", "name": h1, "description": desc,''','''    ld = json.dumps(ld_clean([{
        "@context": "https://schema.org", "@type": "WebPage", "name": h1, "description": desc,''')
R('''            for i, (_, q) in enumerate(items[:10])]
    }], ensure_ascii=False).replace('</', LDESC)''','''            for i, (_, q) in enumerate(items[:10])]
    }]), ensure_ascii=False).replace('</', LDESC)''')
R('''<link rel="canonical" href="{url}">
<meta property="og:title" content="{H.escape(h1)}">''','''<link rel="canonical" href="{url}">
{alts_n}
<meta property="og:title" content="{H.escape(h1)}">''')
R('''{header(sl + '.html', TT(lang, 'cn.all', city=city))}''','''{header(sl + ('.en' if main_lang else '') + '.html', TT(lang, 'cn.all', city=city))}''')

# ---- en el bucle: pais en su idioma + versiones inglesas de las necesidades ----
R('''urls = []; empty = 0; needs_made = 0''','''urls = []; empty = 0; needs_made = 0
# Las ciudades no inglesas con bastante de una necesidad tienen tambien la pagina
# en ingles («food banks in Madrid»): quien llega de fuera busca en ingles.
NEED_EN = {}
for _ci in CINFO:
    _lang = LANG_BY_CC.get(_ci['cc'], 'en')
    if _lang == 'en': continue
    _nc = Counter(q['cat'] for _, q in _ci['near'] if q['name'])
    for _c in NEED_ORDER:
        if _nc[_c] >= 8: NEED_EN[(_ci['sl'], _c)] = 1
needs_en = 0''')
R('''    lang = LANG_BY_CC.get(cc, 'en')
    ncnt = Counter(q['cat'] for _, q in near if q['name'])''','''    lang = LANG_BY_CC.get(cc, 'en')
    country_en = country
    country = country_in(cc, lang, country)
    ncnt = Counter(q['cat'] for _, q in near if q['name'])''')
R('''        body_en, _ = page(name, country, lat, lon, cc, local, ci['raw'], 'en', near, sl, needs, main_lang=lang)''','''        body_en, _ = page(name, country_en, lat, lon, cc, local, ci['raw'], 'en', near, sl, needs, main_lang=lang)''')
R('''        urls.append(('https://supportnear.com/c/%s-%s.html' % (sl, cat), 0.7 if k >= 8 else 0.5))
        needs_made += 1''','''        urls.append(('https://supportnear.com/c/%s-%s.html' % (sl, cat), 0.7 if k >= 8 else 0.5))
        needs_made += 1
        if NEED_EN.get((sl, cat)):
            io.open(os.path.join('c', '%s-%s.en.html' % (sl, cat)), 'w', encoding='utf-8').write(
                need_page(name, country_en, cc, 'en', sl, cat, near, name, total, main_lang=lang))
            urls.append(('https://supportnear.com/c/%s-%s.en.html' % (sl, cat), 0.4))
            needs_en += 1''')
R('''print('paginas ciudad x necesidad:', needs_made)''','''print('paginas ciudad x necesidad:', needs_made, '| en ingles:', needs_en)

# ---- donde falta ayuda: las ciudades del mapa sin comedor, albergue o ducha a 10 km ----
# Para voluntarios de OpenStreetMap y entidades: lo que no esta en el mapa no
# lo encuentra nadie. Cada fila abre el editor en esa ciudad.
_GAP = ['food', 'shelter', 'hygiene', 'health']
_gap_rows = []
for ci in CINFO:
    _c = Counter(q['cat'] for _, q in ci['near'])
    miss = [g for g in _GAP if not _c[g]]
    if miss: _gap_rows.append((len(miss), ci['country'], ci['name'], ci['sl'], miss, ci['lat'], ci['lon']))
_gap_rows.sort(key=lambda r: (-r[0], r[1], r[2]))
_GN = {'food': 'free food', 'shelter': 'shelter', 'hygiene': 'showers / toilets', 'health': 'free clinic'}
_gtab = ''.join('<tr><td><a href="%s.html">%s</a></td><td>%s</td><td>%s</td><td><a href="https://www.openstreetmap.org/edit#map=14/%.4f/%.4f" target="_blank" rel="noopener">edit map</a></td></tr>'
                % (sl, H.escape(n), H.escape(co), H.escape(', '.join(_GN[g] for g in m)), la, lo) for _, co, n, sl, m, la, lo in _gap_rows)
io.open('huecos.html', 'w', encoding='utf-8').write(f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Where free help is missing on the map · SupportNear</title>
<meta name="description" content="{len(_gap_rows)} cities with no free food, shelter, showers or clinic mapped within 10 km. Help fix the open map.">
<link rel="canonical" href="https://supportnear.com/huecos.html">
<meta property="og:title" content="Where free help is missing on the map"><meta property="og:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="favicon.ico" sizes="32x32"><meta name="theme-color" content="#0B7A63">
<style>{CSS}{EXTRA_CSS}
table{{width:100%;border-collapse:collapse;font-size:14.5px}} td,th{{border-bottom:1px solid var(--line);padding:8px 6px;text-align:start;vertical-align:top}} th{{font-size:13px;color:var(--ink-3)}}
.tw{{overflow-x:auto}}</style></head>
<body><div class="wrap">{header('./', 'Open the map').replace('../', './')}
<h1>Where free help is missing on the map</h1>
<p class="lede">These {len(_gap_rows)} cities have <b>nothing</b> mapped within 10 km for at least one basic need. Often the help exists but nobody has put it on OpenStreetMap. If you know a soup kitchen, a shelter, public showers or a free clinic in one of them, add it — it will show up here, and in every other app that uses the open map.</p>
<p><a class="btn btn--p" href="https://www.openstreetmap.org/" target="_blank" rel="noopener">How to add a place on OpenStreetMap</a></p>
<div class="tw"><table><tr><th>City</th><th>Country</th><th>Missing within 10 km</th><th></th></tr>{_gtab}</table></div>
<footer>SupportNear &middot; a non-profit project &middot; data from OpenStreetMap (ODbL) &middot; updated {date.today().isoformat()}</footer>
</div></body></html>""")
urls.append(('https://supportnear.com/huecos.html', 0.5))
print('huecos:', len(_gap_rows), 'ciudades')''')
io.open(p,'w',encoding='utf-8').write(s); print('p4 ok')
