# -*- coding: utf-8 -*-
"""supportnear.com/es/, /fr/, /ar/...: el enlace para compartir en cada idioma.

La portada se comparte en ingles: WhatsApp y Facebook leen el HTML sin ejecutar
nada, y el HTML sale en ingles aunque luego la app se ponga en tu idioma. Quien
manda el enlace a un grupo de Madrid queria «Comida, cama y ducha gratis»,
no «Free food, a bed».

Cada una de estas paginas lleva el titulo, la descripcion y la tarjeta con mapa
en su idioma, y a quien la abre le lleva al mapa en ese idioma al instante. No
se indexa (seria la portada repetida trece veces): solo existe para compartir.
"""
import io, json, os, re, subprocess, tempfile, hashlib, html as H

full = io.open('index.full.html', encoding='utf-8').read()


def js_eval(lit):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
        tf.write('process.stdout.write(JSON.stringify(' + lit + '));'); tmp = tf.name
    out = subprocess.run(['node', tmp], capture_output=True); os.unlink(tmp)
    return json.loads(out.stdout.decode())


m = re.search(r'^T\.en = \{$', full, re.M)
en = js_eval(full[m.end() - 1:full.index('\n};', m.end()) + 2])
for mm in re.finditer(r'^Object\.assign\(T\.en, (\{.*?\n\})\);', full, re.M | re.S):
    en.update(js_eval(mm.group(1)))
LANGS = [('es', 'es_ES'), ('fr', 'fr_FR'), ('ar', 'ar_AR'), ('uk', 'uk_UA'), ('ro', 'ro_RO'), ('pl', 'pl_PL'),
         ('ru', 'ru_RU'), ('pt', 'pt_PT'), ('ur', 'ur_PK'), ('fa', 'fa_IR'), ('wo', 'wo_SN'), ('bm', 'bm_ML'),
         ('ti', 'ti_ER'), ('ps', 'ps_AF'), ('so', 'so_SO'), ('am', 'am_ET'), ('tr', 'tr_TR'), ('bn', 'bn_BD'), ('zh', 'zh_CN'), ('en', 'en_US')]
RTL = {'ar', 'ur', 'fa', 'ps'}


def img(lang):
    f = 'social-%s.jpg' % lang
    if not os.path.exists(f): f = 'social.jpg'
    return 'https://supportnear.com/%s?v=%s' % (f, hashlib.sha1(open(f, 'rb').read()).hexdigest()[:8])


alts = ''.join('<link rel="alternate" hreflang="%s" href="https://supportnear.com/%s/">' % (c, c) for c, _ in LANGS)
made = []
for code, loc in LANGS:
    t = en if code == 'en' else dict(en, **json.load(io.open('l/%s.json' % code, encoding='utf-8'))['t'])
    title = t['wel.h'] + ' · SupportNear'
    desc = t['pass.txt']
    tag = t['brand.tag']
    url = 'https://supportnear.com/%s/' % code
    go = '../?lang=%s' % code
    page = f'''<!DOCTYPE html>
<html lang="{code}"{' dir="rtl"' if code in RTL else ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{H.escape(title)}</title>
<meta name="description" content="{H.escape(desc)}">
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="https://supportnear.com/">
{alts}
<meta property="og:type" content="website">
<meta property="og:site_name" content="SupportNear">
<meta property="og:locale" content="{loc}">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{H.escape(title)}">
<meta property="og:description" content="{H.escape(desc)}">
<meta property="og:image" content="{img(code)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{H.escape(tag)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="twitter:title" content="{H.escape(title)}"><meta name="twitter:description" content="{H.escape(desc)}">
<meta name="twitter:image" content="{img(code)}"><meta name="twitter:image:alt" content="{H.escape(tag)}">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<script>location.replace({json.dumps(go)} + location.hash);</script>
<style>body{{font:18px/1.5 system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#FBF8F3;color:#14110E;text-align:center;padding:24px}}
a{{display:inline-block;margin-top:14px;padding:14px 22px;border-radius:12px;background:#0B7A63;color:#fff;font-weight:700;text-decoration:none}}</style>
</head>
<body><div><h1 style="font-size:24px;margin:0 0 6px">SupportNear</h1><p style="margin:0">{H.escape(tag)}</p>
<a href="{go}">{H.escape(t.get('cta.open') or 'supportnear.com')}</a></div></body>
</html>'''
    os.makedirs(code, exist_ok=True)
    io.open(os.path.join(code, 'index.html'), 'w', encoding='utf-8').write(page)
    made.append(code)
print('enlaces por idioma:', ' '.join('/%s/' % c for c in made))
