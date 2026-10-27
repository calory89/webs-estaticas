# -*- coding: utf-8 -*-
"""supportnear.com/es/, /fr/, /ar/...: el enlace para compartir en cada idioma.

La portada se comparte en ingles: WhatsApp y Facebook leen el HTML sin ejecutar
nada, y el HTML sale en ingles aunque luego la app se ponga en tu idioma. Quien
manda el enlace a un grupo de Madrid queria «Comida, cama y ducha gratis»,
no «Free food, a bed».

Cada una de estas paginas lleva el titulo, la descripcion y la tarjeta con mapa
en su idioma.

Desde el QA del 27-oct (M4) ademas se indexan: son la unica URL en otro idioma
que Google puede guardar (/?lang=es devuelve el HTML ingles con canonical a /).
Canonical a si mismas, un unico grupo hreflang reciproco con la portada
(en + x-default = /) y titulo, descripcion y h1 en su idioma escritos en el HTML.
Por eso ya no redirigen a todo el mundo al instante (Google trata esa
redireccion como tal y no indexaria la pagina): van directas al mapa quien llega
con un enlace a un sitio (#p=...) y quien ya ha usado la app; quien llega por
primera vez ve una portada corta con el boton «Abrir el mapa» arriba del todo.
/en/ sigue siendo solo un enlace para compartir: noindex, canonical a / y
redireccion inmediata.
"""
import io, json, os, re, subprocess, tempfile, hashlib, html as H
from seo_common import finalize, hreflang_links, LANGS as ALL_LANGS, RTL as _RTL, SITE

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
LANGS = [x for x in ALL_LANGS if x[0] != 'en'] + [('en', 'en_US')]
RTL = _RTL


def img(lang):
    f = 'social-%s.jpg' % lang
    if not os.path.exists(f): f = 'social.jpg'
    return 'https://supportnear.com/%s?v=%s' % (f, hashlib.sha1(open(f, 'rb').read()).hexdigest()[:8])


alts = hreflang_links()
made = []
for code, loc in LANGS:
    t = en if code == 'en' else dict(en, **json.load(io.open('l/%s.json' % code, encoding='utf-8'))['t'])
    title = t['wel.h'] + ' · SupportNear'
    desc = t['pass.txt']
    tag = t['brand.tag']
    en_page = code == 'en'
    url = SITE + '/' if en_page else 'https://supportnear.com/%s/' % code
    go = '../?lang=%s' % code
    e = lambda k: H.escape(t.get(k) or en.get(k) or '')
    ld = json.dumps({"@context": "https://schema.org", "@type": "WebPage", "name": t['wel.h'], "description": desc,
                     "inLanguage": code, "url": url, "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": SITE + "/"}},
                    ensure_ascii=False).replace('</', '<\\/')
    js = ("(function(){var g=%s,h=location.hash,r=0;try{for(var i=0;i<localStorage.length;i++){"
          "if(String(localStorage.key(i)).indexOf('sn.')===0){r=1;break}}}catch(e){}"
          "if(h||r%s)location.replace(g+h)})();") % (json.dumps(go), '||1' if en_page else '')
    page = f'''<!DOCTYPE html>
<html lang="{code}"{' dir="rtl"' if code in RTL else ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{H.escape(title)}</title>
<meta name="description" content="{H.escape(desc)}">
<meta name="robots" content="{'noindex,follow' if en_page else 'index,follow'}">
<link rel="canonical" href="{url}">
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
<script>{js}</script>
<script type="application/ld+json">{ld}</script>
<style>body{{font:18px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0;background:#FBF8F3;color:#14110E}}
main{{max-width:34em;margin:0 auto;padding:40px 20px 56px;text-align:center}}
.b{{font-weight:800;color:#0B7A63;margin:0 0 18px}}
h1{{font-size:32px;line-height:1.15;margin:0 0 14px}}
.l{{color:#4A443C;margin:0 0 26px}}
.go{{display:inline-block;padding:16px 28px;border-radius:14px;background:#0B7A63;color:#fff;font-weight:700;font-size:20px;text-decoration:none}}
.t{{font-size:14px;color:#7A7168;margin:18px 0 26px}}
.s a{{color:#0B7A63;font-weight:600;margin:0 10px;display:inline-block;padding:8px 0}}
@media (prefers-color-scheme:dark){{body{{background:#0A0E14;color:#F2F5F7}}.l{{color:#B3BDC7}}.t{{color:#8592A0}}.b,.s a{{color:#3ECFA9}}.go{{background:#3ECFA9;color:#0A0E14}}}}</style>
</head>
<body><main>
<p class="b">SupportNear</p>
<h1>{e('wel.h')}</h1>
<p class="l">{e('wel.p')}</p>
<a class="go" href="{go}">{e('cta.open')}</a>
<p class="t">{e('wel.trust')}</p>
<p class="s"><a href="{go}&amp;sos=1">{e('cta.emergency')}</a><a href="../c/">{e('menu.cities')}</a></p>
</main></body>
</html>'''
    os.makedirs(code, exist_ok=True)
    io.open(os.path.join(code, 'index.html'), 'w', encoding='utf-8').write(finalize(page))
    made.append(code)
print('enlaces por idioma:', ' '.join('/%s/' % c for c in made))
