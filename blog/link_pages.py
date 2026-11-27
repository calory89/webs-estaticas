# -*- coding: utf-8 -*-
"""#93: enlaza las paginas de ciudad (/c/) con las guias del blog. Escribe copias modificadas en el stage."""
import os, re, io, json, html as H, sys
sys.path.insert(0, os.path.dirname(__file__))
from core import LIVE, OUT, CITIES
import articles as A
import content_es1, content_es2, content_es3, content_en, content_other
TITLE = {a['slug']: a['title'] for a in A.ARTS}

ES = {'food': ['comedores-sociales-abiertos-hoy', 'banco-de-alimentos-como-pedir-comida'], 'shelter': ['donde-dormir-esta-noche-albergues', 'campana-de-frio-2026-2027'],
      'hygiene': ['duchas-gratis'], 'health': ['medico-gratis-sin-papeles'], 'social': ['como-funciona-la-ayuda-social-en-espana', 'ingreso-minimo-vital-como-pedirlo'],
      'warm': ['cargar-el-movil-y-wifi-gratis'], 'clothes': ['roperos-y-tiendas-solidarias'],
      'volunteer': ['que-donar-a-un-banco-de-alimentos', 'voluntariado-en-un-comedor-social'], '': ['primeras-24-horas-en-la-calle', 'como-funciona-la-ayuda-social-en-espana']}
EN = {'food': ['food-banks-open-today'], 'hygiene': ['free-showers-near-me'], 'health': ['free-medical-care'], 'volunteer': ['what-to-donate-food-bank', 'giving-tuesday-2026']}
EN_UKIE = {'shelter': ['cold-weather-shelters-uk-ireland'], 'social': ['free-help-uk-ireland'], '': ['free-help-uk-ireland']}
FR = {'food': ['ou-manger-gratuitement'], 'hygiene': ['douches-gratuites']}
HUB = {'madrid': 'guia-ayuda-madrid', 'barcelona': 'guia-ayuda-barcelona', 'badalona': 'ayuda-social-badalona', 'dublin': 'homeless-help-dublin', 'london': 'homeless-help-london'}
HUB_NEED = {('madrid', 'social'): 'servicios-sociales-madrid'}
ENC = {'GB', 'IE', 'US', 'CA', 'AU', 'NZ', 'SG'}
LAB = {'es': 'Guías', 'en': 'Guides', 'fr': 'Guides'}
ANCH = {'es': '<h2>Cómo funciona</h2>', 'en': '<h2>How this works</h2>', 'fr': '<h2>Comment ça marche</h2>'}

changed = 0; skipped = 0
for sl, c in CITIES.items():
    if 'needs' not in c: continue
    cc = c.get('cc', '')
    for need in [''] + list(c['needs'].keys()):
        for suffix in ('', '.en'):
            fn = '%s/c/%s%s%s.html' % (LIVE, sl, '-' + need if need else '', suffix)
            if not os.path.exists(fn): continue
            h = io.open(fn, encoding='utf-8').read()
            m = re.search(r'<html lang="([a-z]+)"', h)
            if not m or 'http-equiv="refresh"' in h[:4000] or '../blog/' in h: continue
            lang = m.group(1)
            slugs = []
            if lang == 'es' and cc == 'ES': slugs = list(ES.get(need, []))
            elif lang == 'en' and (cc in ENC or cc == 'ES'):
                slugs = list(EN.get(need, []))
                if cc in ('GB', 'IE'): slugs += EN_UKIE.get(need, [])
            elif lang == 'fr' and cc in ('FR', 'BE', 'CH', 'LU'): slugs = list(FR.get(need, []))
            if need == '' and sl in HUB and ((lang == 'es') == (cc == 'ES')): slugs = [HUB[sl]] + slugs
            if (sl, need) in HUB_NEED and lang == 'es': slugs = [HUB_NEED[(sl, need)]] + slugs
            slugs = [s for i, s in enumerate(slugs) if s in TITLE and s not in slugs[:i]]
            if not slugs: continue
            line = '<p class="note">%s: %s</p>\n' % (LAB[lang], ' · '.join('<a href="../blog/%s">%s</a>' % (s, H.escape(TITLE[s])) for s in slugs))
            anchor = ANCH.get(lang)
            if need == 'volunteer':
                i = h.rfind('<div class="btns">')
                if i < 0: skipped += 1; continue
                h2 = h[:i] + line + h[i:]
            elif anchor and anchor in h:
                h2 = h.replace(anchor, line + anchor, 1)
            else:
                skipped += 1; continue
            out = os.path.join(OUT, os.path.relpath(fn, LIVE))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            io.open(out, 'w', encoding='utf-8').write(h2); changed += 1

# indice de sitemaps y llms.txt
sm = io.open(LIVE + '/sitemap.xml', encoding='utf-8').read()
if 'sitemap-blog.xml' not in sm:
    sm = sm.replace('</sitemapindex>', '<sitemap><loc>https://supportnear.com/sitemap-blog.xml</loc><lastmod>2026-11-27</lastmod></sitemap>\n</sitemapindex>')
    io.open(OUT + '/sitemap.xml', 'w', encoding='utf-8').write(sm)
ll = io.open(LIVE + '/llms.txt', encoding='utf-8').read()
if '/blog/' not in ll:
    ll = ll.replace('- [Open data: places by country as CSV (ODbL)]',
                    '- [Guides: free food, shelter, showers, health care and how to help](https://supportnear.com/blog/), e.g. [free showers](https://supportnear.com/blog/free-showers-near-me) and [médico gratis sin papeles](https://supportnear.com/blog/medico-gratis-sin-papeles)\n- [Open data: places by country as CSV (ODbL)]')
    io.open(OUT + '/llms.txt', 'w', encoding='utf-8').write(ll)
print('paginas enlazadas', changed, 'sin ancla', skipped)
