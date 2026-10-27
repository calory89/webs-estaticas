# Genera prensa.html, incrustar.html e instalar.html en los idiomas de la app.
#
# El HTML sale escrito en ingles, que es lo que ven Google y quien tenga el
# JavaScript apagado. Al cargar, si sabemos el idioma de la persona, se cambian
# los textos marcados con data-t. El idioma se toma primero de lo que eligio en
# la app (localStorage sn.lang) y si no, del navegador: si cambia el idioma en
# el mapa, estas paginas salen en ese idioma.
import io, json, os, re
from i18n_pages import TR, FALLBACK

CSS = io.open('page.css.txt', encoding='utf-8').read()
h = io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
ST = json.loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', h).group(1))
C, K = ST['cities'], ST['countries']
# La misma huella que usa la app para enlazar aqui, para que un enlace entre
# paginas tampoco se quede pillado en la copia vieja del navegador.
PV = re.search(r"const PAGES_V = /\*__PAGESV__\*/'([^']*)'", h)
PV = ('?v=' + PV.group(1)) if (PV and PV.group(1)) else ''
import hashlib as _hl
try: SV = '?v=' + _hl.sha1(open('social.jpg','rb').read()).hexdigest()[:8]
except Exception: SV = PV


RTL = {'ar', 'fa', 'ur'}
LANGS = [l['code'] for l in
         [{'code': c} for c in re.findall(r"code:'(\w+)'",
          re.search(r'const LANGS = \[(.*?)\n\];', h, re.S).group(1))]]

# Los numeros se escriben como se escriben en cada idioma.
def places(lang):
    n = ST['places']
    if lang in ('es', 'pt', 'ro', 'ar', 'fa', 'ur', 'pl'):
        return format(n, ',d').replace(',', '.')
    if lang in ('fr', 'ru', 'uk'):
        return format(n, ',d').replace(',', ' ')
    return format(n, ',d')


def T(lang, key):
    """Frase a frase: si falta en ese idioma, se cae al de respaldo y luego al ingles."""
    for l in (lang, FALLBACK.get(lang), 'en'):
        if l and l in TR and key in TR[l]:
            return TR[l][key].replace('{P}', places(l)).replace('{C}', str(C)).replace('{K}', str(K))
    return ''


def build_strings():
    """Solo se incrustan los idiomas que existen de verdad; wo y bm van al frances."""
    out = {}
    for lang in LANGS:
        src = lang if lang in TR else FALLBACK.get(lang, 'en')
        out[lang] = {k: T(src, k) for k in TR['en']}
    return out


def el(tag, key, lang='en', cls='', extra=''):
    """Un trozo traducible. El texto ingles va escrito dentro; el JS lo cambia."""
    c = (' class="%s"' % cls) if cls else ''
    return '<%s%s data-t="%s"%s>%s</%s>' % (tag, c, key, (' ' + extra) if extra else '', T(lang, key), tag)


X_URL = 'https://x.com/mrstartups'
LOGO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="4"/><path d="M12 14v6"/></svg>'

EXTRA_CSS = """
.langsw{display:flex;gap:6px;margin-inline-start:auto;flex-wrap:wrap;justify-content:flex-end;max-width:200px}
.langsw button{font:inherit;font-size:12.5px;font-weight:600;border:1px solid var(--line);
  background:var(--paper-2);color:var(--ink-3);border-radius:8px;padding:4px 8px;cursor:pointer;min-height:30px}
/* En un movil, logo + volver + once idiomas no caben en una fila: la pagina se
   iba 10 px a la derecha y bailaba al leerla. Los idiomas bajan a su propia
   fila, con botones de 34 px que se pueden tocar con el dedo. */
.top{flex-wrap:wrap;row-gap:10px}
@media (max-width:560px){
  .langsw{order:3;flex-basis:100%;max-width:none;justify-content:flex-start;margin-inline-start:0}
  .langsw button{padding:7px 10px;min-height:34px}
}
.langsw button[aria-pressed="true"]{color:var(--brand);border-color:var(--brand)}
.top a.backlink{margin-inline-start:14px;font-size:14.5px;font-weight:600;text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;min-height:36px;padding:0 4px}
html[dir="rtl"] .card,html[dir="rtl"] ul,html[dir="rtl"] ol{text-align:start}
"""


def script(strings, langs):
    return """
<script>
/* Los textos de todos los idiomas van dentro de la propia pagina: ni una
   peticion mas, y funciona sin conexion igual que el mapa. */
var T = %s;
var RTL = %s;
function pick(){
  try{ var s = JSON.parse(localStorage.getItem('sn.lang')||'null');
       if(s && T[s]) return s; }catch(e){}
  var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language||'en'];
  for(var i=0;i<list.length;i++){
    var c = String(list[i]).toLowerCase().split('-')[0];
    if(T[c]) return c;
  }
  return 'en';
}
var FB = {wo:'fr', bm:'fr'};
function apply(l){
  if(!T[l]) l = 'en';
  var d = document.documentElement;
  /* En wolof y bambara los textos son los franceses: se declara frances para que
     un lector de pantalla no intente leerlos como si fueran otra lengua. */
  d.lang = FB[l] || l;
  d.dir = RTL.indexOf(l) > -1 ? 'rtl' : 'ltr';
  var t = T[l];
  document.querySelectorAll('[data-t]').forEach(function(e){
    var v = t[e.dataset.t];
    if(v !== undefined && v !== '') e.innerHTML = v;
  });
  document.querySelectorAll('[data-lang-btn]').forEach(function(b){
    b.setAttribute('aria-pressed', b.dataset.langBtn === l);
  });
}
apply(pick());
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('[data-lang-btn]').forEach(function(b){
    b.addEventListener('click', function(){
      var l = b.dataset.langBtn;
      try{ localStorage.setItem('sn.lang', JSON.stringify(l)); }catch(e){}
      apply(l);
    });
  });
});
</script>""" % (json.dumps(strings, ensure_ascii=False, separators=(',', ':')),
                json.dumps(sorted(RTL)))


def page(fname, title_key, desc, body, strings):
    langsw = ''.join('<button data-lang-btn="%s" title="%s">%s</button>' % (l, l, l.upper())
                     for l in LANGS if l in TR)
    html = ('<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>%s &middot; SupportNear</title><meta name="description" content="%s">'
            '<meta property="og:title" content="%s &middot; SupportNear">'
            '<meta property="og:description" content="%s">'
            '<meta property="og:image" content="https://supportnear.com/social.jpg%s">'
            '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
            '<meta property="og:image:alt" content="SupportNear: free help near you">'
            '<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">'
            '<meta property="og:url" content="https://supportnear.com/%s">'
            '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">'
            '<meta name="twitter:title" content="%s &middot; SupportNear"><meta name="twitter:description" content="%s">'
            '<meta name="twitter:image" content="https://supportnear.com/social.jpg%s">'
            '<link rel="icon" href="favicon.ico" sizes="32x32"><link rel="icon" href="favicon.svg" type="image/svg+xml">'
            '<link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="theme-color" content="#0B7A63">'
            '<link rel="canonical" href="https://supportnear.com/%s">'
            '<style>%s%s</style></head><body><div class="wrap">'
            '<div class="top"><span class="logo">%s</span><b>SupportNear</b>'
            '<a class="backlink" href="./" data-t="nav.back">%s</a>'
            '<span class="langsw">%s</span></div>'
            % (T('en', title_key), desc, T('en', title_key), desc, SV, fname, T('en', title_key), desc, SV, fname, CSS, EXTRA_CSS,
               LOGO, T('en', 'nav.back'), langsw)
            + body +
            '<footer><span data-t="foot.a">%s</span>'
            '<a href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a>'
            '<span data-t="foot.b">%s</span></footer></div>'
            % (T('en', 'foot.a'), T('en', 'foot.b'))
            + script(strings, LANGS) + '</body></html>')
    io.open(fname, 'w', encoding='utf-8').write(html)
    print(fname, os.path.getsize(fname), 'bytes')


S = build_strings()

# ---- sitios por pais: cada sitio se cuenta en el pais de la ciudad mas cercana (a menos de 40 km) ----
import math as _math, csv as _csv
_h = io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
_CITIES = json.loads(re.search(r'const CITIES = /\*__CITIES__\*/(\[.*?\]);', _h, re.S).group(1))
_ccname = {}
for _r in _csv.DictReader(open('emergency-numbers.csv', encoding='utf-8')): _ccname.setdefault(_r['country_code'], _r['country'])
_pts = []
for _f in os.listdir('d'):
    if not _f.endswith('.json'): continue
    _la = _lo = 0
    for _r in json.load(open(os.path.join('d', _f))):
        _la += _r[1]; _lo += _r[2]; _pts.append((_la / 1e5, _lo / 1e5))
try:
    import numpy as _np
    _P = _np.array(_pts)
    _bycc = {}
    _ncity = {}
    _assigned = _np.full(len(_P), -1); _best = _np.full(len(_P), 1e9)
    for _i, _c in enumerate(_CITIES):
        _d = _np.hypot((_P[:, 0] - _c[1]) * 111, (_P[:, 1] - _c[2]) * 111 * _math.cos(_math.radians(_c[1])))
        _m = (_d < 40) & (_d < _best); _assigned[_m] = _i; _best[_m] = _d[_m]
        _ncity[_c[4] or _c[3]] = _ncity.get(_c[4] or _c[3], 0) + 1
    for _i in _assigned:
        if _i < 0: continue
        _k = _CITIES[_i][4] or _CITIES[_i][3]; _bycc[_k] = _bycc.get(_k, 0) + 1
    _rows = sorted(_bycc.items(), key=lambda x: -x[1])[:40]
    COUNTRY_TABLE = ('<div class="tw"><table><tr>%s%s%s</tr>' % (el('th', 'p.thc'), el('th', 'p.thn'), el('th', 'p.thk'))
        + ''.join('<tr><td>%s</td><td>%s</td><td>%d</td></tr>' % (_ccname.get(k, k), format(n, ',d'), _ncity.get(k, 0)) for k, n in _rows)
        + '</table></div>')
except Exception as _e:
    COUNTRY_TABLE = ''
    print('sin tabla por pais:', _e)

# ============================== PRENSA ==============================
prensa = (
 el('h1', 'p.title') + el('p', 'p.lede', cls='lede')
 + '<div class="stats">'
 + '<div><b>%s</b>%s</div>' % (places('en'), el('span', 'st.places'))
 + '<div><b>%d</b>%s</div>' % (C, el('span', 'st.cities'))
 + '<div><b>%d</b>%s</div>' % (K, el('span', 'st.countries'))
 + '<div><b>20</b>%s</div>' % el('span', 'st.langs')
 + '<div><b>0 &euro;</b>%s</div>' % el('span', 'st.free')
 + '</div>'
 + el('h2', 'p.h50') + '<div class="card">%s</div>' % el('div', 'p.t50')
 + el('h2', 'p.h200') + '<div class="card">%s</div>' % el('div', 'p.t200')
 + el('h2', 'p.hcountries') + el('p', 'p.countries') + COUNTRY_TABLE
 + el('h2', 'p.hwho')
 + '<div class="card"><p><strong>Carlos de Ory</strong> &middot; '
   '<a href="https://x.com/mrstartups" target="_blank" rel="noopener">@mrstartups</a></p>'
 + el('div', 'p.who')
 + el('h3', 'p.hcontact')
 + el('p', 'p.xp')
 + '<div class="btns"><a class="btn btn--p" href="%s" target="_blank" rel="noopener" '
   'data-t="b.write">%s</a></div></div>' % (X_URL, T('en', 'b.write'))
 + el('h2', 'p.hhead') + '<div class="card">%s</div>' % el('div', 'p.head')
 + el('h2', 'p.hshots') + el('p', 'p.shots')
 + '<figure><a href="shot-madrid.png"><img src="shot-madrid.png" alt="SupportNear" loading="lazy"></a>'
   '%s</figure>' % el('figcaption', 'p.cap1')
 + '<figure><a href="shot-nairobi.png"><img src="shot-nairobi.png" alt="SupportNear" loading="lazy"></a>'
   '%s</figure>' % el('figcaption', 'p.cap2')
 + '<div class="two"><figure><a href="shot-movil.png"><img src="shot-movil.png" alt="SupportNear" loading="lazy"></a>'
   '%s</figure>' % el('figcaption', 'p.cap3')
 + '<figure><a href="social.jpg"><img src="social.jpg" alt="SupportNear" loading="lazy"></a>'
   '%s</figure></div>' % el('figcaption', 'p.cap4')
 + el('h2', 'p.hlinks') + el('p', 'p.links')
 + '<pre tabindex="0"><code>supportnear.com/?city=Nairobi     <span data-t="l.city">%s</span>\n'
   'supportnear.com/#p=node/123456    <span data-t="l.place">%s</span>\n'
   'supportnear.com/prensa.html       <span data-t="l.press">%s</span>\n'
   'supportnear.com/incrustar.html    <span data-t="l.embed">%s</span>\n'
   'supportnear.com/c/                 <span data-t="l.cities">%s</span>\n'
   'supportnear.com/cambios.html       <span data-t="l.changes">%s</span></code></pre>'
   % (T('en', 'l.city'), T('en', 'l.place'), T('en', 'l.press'), T('en', 'l.embed'), T('en', 'l.cities'), T('en', 'l.changes'))
 + el('h2', 'p.hverify')
 + '<ul>%s%s%s <a href="emergency-numbers.csv" download data-t="b.csv">%s</a></li>%s</ul>'
   % (el('li', 'v1'), el('li', 'v2'),
      '<li><span data-t="v3">%s</span>' % T('en', 'v3'), T('en', 'b.csv'), el('li', 'v4'))
 + el('h2', 'p.hnot') + '<div class="card">%s</div>' % el('div', 'p.not')
)

# ============================== INCRUSTAR ==============================
incrustar = (
 el('h1', 'e.title') + el('p', 'e.lede', cls='lede')
 + el('h2', 'e.hcopy')
 + '<pre tabindex="0"><code>&lt;iframe src="https://supportnear.com/?embed=1&amp;city=Sevilla"\n'
   '        width="100%" height="600" style="border:0;border-radius:12px"\n'
   '        loading="lazy" title="SupportNear"&gt;\n&lt;/iframe&gt;</code></pre>'
 + el('p', 'e.city')
 + el('h2', 'e.hlook')
 + '<figure><iframe src="index.html?embed=1&amp;city=Sevilla" width="100%%" height="520" '
   'style="border:1px solid var(--line);border-radius:12px" loading="lazy" title="SupportNear"></iframe>'
   '%s</figure>' % el('figcaption', 'e.cap')
 + el('h2', 'e.hopts')
 + '<div class="tw"><table><tr>%s%s</tr>'
   '<tr><td class="n">?embed=1</td>%s</tr>'
   '<tr><td class="n">&amp;city=Sevilla</td>%s</tr>'
   '<tr><td class="n">&amp;need=food</td>%s</tr>'
   '<tr><td class="n">&amp;color=0B7A63</td>%s</tr></table></div>'
   % (el('th', 'e.thp'), el('th', 'e.thw'), el('td', 'e.o1'), el('td', 'e.o2'), el('td', 'e.o3'), el('td', 'e.o4'))
 + el('h2', 'e.hdoes')
 + '<ul>%s%s%s%s</ul>' % (el('li', 'e.d1'), el('li', 'e.d2'), el('li', 'e.d3'), el('li', 'e.d4'))
 + el('h2', 'e.hadd') + el('p', 'e.add')
 + '<div class="btns"><a class="btn btn--p" href="https://www.openstreetmap.org/note/new" '
   'target="_blank" rel="noopener" data-t="e.bosm">%s</a>'
   '<a class="btn" href="prensa.html%s" data-t="p.title">%s</a></div>'
   % (T('en', 'e.bosm'), PV, T('en', 'p.title'))
 + '<p><span data-t="e.send">%s</span> '
   '<a class="btn" href="%s" target="_blank" rel="noopener" data-t="b.write" '
   'style="margin-inline-start:8px">%s</a></p>'
   % (T('en', 'e.send'), X_URL, T('en', 'b.write'))
)

# ============================== INSTALAR ==============================
instalar = (
 el('h1', 'i.title') + el('p', 'i.lede', cls='lede')
 + el('h2', 'i.hdl') + '<div class="card">%s</div>' % el('div', 'i.dl')
 + el('h2', 'i.hstore') + el('p', 'i.store')
 + el('h2', 'i.hhome')
 + '<div class="two" id="plat"><div class="card" data-p="android"><h3>Android (Chrome)</h3>%s</div>'
   '<div class="card" data-p="ios"><h3>iPhone (Safari)</h3>%s</div></div>'
   '<script>(function(){var u=navigator.userAgent||"";var p=/iPhone|iPad|iPod/.test(u)?"ios":/Android/.test(u)?"android":"";'
   'if(!p)return;var w=document.getElementById("plat");var c=w.querySelector("[data-p="+p+"]");if(c){w.insertBefore(c,w.firstChild);c.style.borderColor="var(--brand)";c.style.boxShadow="0 0 0 2px var(--brand-soft)";}})();</script>'
   % (el('div', 'i.android'), el('div', 'i.ios'))
 + el('h2', 'i.hoff')
 + '<div class="tw"><table><tr>%s%s</tr><tr>%s%s</tr><tr>%s%s</tr><tr>%s%s</tr></table></div>'
   % (el('th', 'i.works'), el('th', 'i.needs'),
      el('td', 'i.w1'), el('td', 'i.n1'),
      el('td', 'i.w2'), el('td', 'i.n2'),
      el('td', 'i.w3'), el('td', 'i.n3'))
 + el('h2', 'i.hwhy') + el('p', 'i.why')
 + '<div class="btns"><a class="btn btn--p" href="./" data-t="i.bopen">%s</a>'
   '<a class="btn" href="prensa.html%s" data-t="p.title">%s</a></div>'
   % (T('en', 'i.bopen'), PV, T('en', 'p.title'))
)

page('prensa.html', 'p.title',
     'Figures, screenshots, contact and checkable sources for SupportNear: free help in %d cities across %d countries.' % (C, K),
     prensa, S)
page('incrustar.html', 'e.title',
     'Code to embed the free help map of your city on any website. Free, no sign-up, no cookies.',
     incrustar, S)
page('instalar.html', 'i.title',
     'How to download a city for offline use and keep SupportNear on your home screen.',
     instalar, S)
