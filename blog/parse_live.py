# Lee las paginas vivas de ciudad (/c/) y saca: ciudades, pais, idioma, sitios por necesidad.
import re, glob, json, html, os, sys
ROOT = '/home/claude/sn/pub/_s/supportnear.com'
NEEDS = ['food', 'shelter', 'hygiene', 'health', 'social', 'warm', 'clothes', 'volunteer']
idx = open(ROOT + '/c/index.html', encoding='utf-8').read()
cities = {}
for sec in re.finditer(r'<section data-c="([^"]+)"><h2>(?:<a href="../country/([^"]+)">)?([^<]+)(?:</a>)? <small>\((\d+)\)</small></h2><p>(.*?)</p></section>', idx, re.S):
    ckey, cslug, cname, n, body = sec.groups()
    for a in re.finditer(r'<a href="([^"]+)">([^<]+)</a>', body):
        cities[a.group(1)] = {'slug': a.group(1), 'name': html.unescape(a.group(2)), 'country': html.unescape(cname), 'country_slug': cslug}
LI = re.compile(r'<li><div class="pl-h"><a href="([^"]+)">(.*?)</a><span class="ct">(.*?)</span><span class="d">(.*?)</span></div>(.*?)</li>', re.S)
def places(path):
    h = open(path, encoding='utf-8').read()
    out = []
    for m in LI.finditer(h):
        href, nm, ct, d, rest = m.groups()
        extra = [html.unescape(re.sub('<[^>]+>', '', x)) for x in re.findall(r'<span class="ad">(.*?)</span>', rest, re.S)]
        tel = re.findall(r'href="tel:([^"]+)"', rest)
        out.append({'href': html.unescape(href), 'name': html.unescape(re.sub('<[^>]+>', '', nm)), 'ct': html.unescape(ct), 'd': html.unescape(d), 'extra': extra, 'tel': tel})
    ml = re.search(r'<html lang="([^"]+)"', h)
    if not ml or not re.search(r'<h1>', h): return None
    lang = ml.group(1)
    title = html.unescape(re.search(r'<h1>(.*?)</h1>', h, re.S).group(1))
    mle = re.search(r'<p class="lede">(.*?)</p>', h, re.S)
    lede = html.unescape(re.sub('<[^>]+>', '', mle.group(1))) if mle else ''
    emg = re.search(r'<div class="emg"><strong>(.*?)</strong>', h)
    return {'lang': lang, 'h1': title, 'lede': lede, 'emg': html.unescape(emg.group(1)) if emg else '', 'places': out}
n = 0
for sl, c in cities.items():
    base = ROOT + '/c/%s.html' % sl
    if not os.path.exists(base): continue
    h = open(base, encoding='utf-8').read()
    c['lang'] = re.search(r'<html lang="([^"]+)"', h).group(1)
    c['robots_noindex'] = 'noindex' in h[:6000]
    m = re.search(r'href="\.\./\?city=([^"&]+)&amp;cc=([A-Z]{2})', h)
    c['cc'] = m.group(2) if m else ''
    c['qcity'] = html.unescape(m.group(1)) if m else c['name']
    c['h1'] = html.unescape(re.search(r'<h1>(.*?)</h1>', h, re.S).group(1))
    c['needs'] = {}
    for nd in NEEDS:
        p = ROOT + '/c/%s-%s.html' % (sl, nd)
        if os.path.exists(p):
            hh = open(p, encoding='utf-8').read(4000)
            if 'http-equiv="refresh"' in hh or "http-equiv='refresh'" in hh: continue
            r = places(p)
            if r: c['needs'][nd] = r; n += 1
json.dump(cities, open('cities_live.json', 'w', encoding='utf-8'), ensure_ascii=False)
print(len(cities), n)
