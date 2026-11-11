# -*- coding: utf-8 -*-
"""Medicion de SupportNear: GA4 + Microsoft Clarity, con aviso de cookies.

R22 (11-nov-2026), tres cambios sobre R21:
- Microsoft Clarity YA NO se carga sin permiso en Europa. Aunque se le pida que no
  use cookies propias, sus servidores ponen cookies de terceros (MUID en bing.com,
  CLID en clarity.ms): se comprobo en un navegador limpio. Ahora Clarity y GA4 van
  juntos: en Europa solo tras «Aceptar»; fuera de Europa sin preguntar; nunca tras
  «Rechazar». El aviso nombra las dos herramientas.
- Se cargan con el primer toque (o a los 5 s), no 1,5 s despues de la pagina: son
  200 KB de JavaScript ajeno que competian con el mapa en moviles lentos.
- El aviso es mas bajo (tapaba media lista en un movil) y las paginas sueltas solo
  llevan su idioma y el ingles (antes los 20: 8 KB por pagina).

Lo demas sigue igual:
- Un solo <script> en linea en el <head>. Lleva el id de GA4 y «clarity.ms/tag»,
  asi el worker «analytics-all» de Cloudflare ve que la pagina ya mide y no mete su
  propio codigo (que la CSP bloquearia).
- Nada si el navegador pide no ser rastreado (DNT / Global Privacy Control), ni en
  el mapa incrustado en otras webs (?embed=1), ni con «ahorro de datos» o en 2G.
- Europa = zona horaria Europe/*, Canarias, Azores, Madeira, Islandia, Feroe, o
  desconocida. La eleccion se guarda en localStorage «sn.ck».
- El aviso va por debajo de los cuadros de la app (z-index 1900 < 2000).
- Cualquier elemento con el atributo data-sn-cookies se convierte en el boton
  «Configurar cookies»; window.snBind() lo vuelve a enlazar si se pinta despues.
- GA4 sin señales de Google ni anuncios, y la URL sin el #fragmento. Clarity con
  todo el texto enmascarado.
"""
GA_ID = 'G-FJKJE77K4V'
CLARITY_ID = 'z4eqcmaic7'

# [mensaje, aceptar, rechazar, privacidad, configurar cookies]
TX = {
 'en': ["Cookies to count visits and see how the site is used? (Google Analytics, Microsoft Clarity)", "Accept", "Reject", "Privacy", "Cookie settings"],
 'es': ["¿Cookies para contar visitas y ver cómo se usa la web? (Google Analytics, Microsoft Clarity)", "Aceptar", "Rechazar", "Privacidad", "Configurar cookies"],
 'fr': ["Des cookies pour compter les visites et voir comment le site est utilisé ? (Google Analytics, Microsoft Clarity)", "Accepter", "Refuser", "Confidentialité", "Réglages des cookies"],
 'ar': ["هل نستخدم ملفات كوكيز لعدّ الزيارات ومعرفة كيف يُستخدم الموقع؟ (Google Analytics، Microsoft Clarity)", "قبول", "رفض", "الخصوصية", "إعدادات الكوكيز"],
 'uk': ["Cookie, щоб рахувати відвідування й бачити, як користуються сайтом? (Google Analytics, Microsoft Clarity)", "Прийняти", "Відхилити", "Приватність", "Налаштування cookie"],
 'ro': ["Cookie-uri ca să numărăm vizitele și să vedem cum e folosit site-ul? (Google Analytics, Microsoft Clarity)", "Accept", "Refuz", "Confidențialitate", "Setări cookie-uri"],
 'pl': ["Ciasteczka do liczenia odwiedzin i sprawdzania, jak używana jest strona? (Google Analytics, Microsoft Clarity)", "Akceptuję", "Odrzucam", "Prywatność", "Ustawienia ciasteczek"],
 'ru': ["Cookie, чтобы считать посещения и видеть, как пользуются сайтом? (Google Analytics, Microsoft Clarity)", "Принять", "Отклонить", "Конфиденциальность", "Настройки cookie"],
 'pt': ["Cookies para contar as visitas e ver como o site é usado? (Google Analytics, Microsoft Clarity)", "Aceitar", "Recusar", "Privacidade", "Definições de cookies"],
 'ur': ["وزٹ گننے اور یہ دیکھنے کے لیے کہ سائٹ کیسے استعمال ہوتی ہے، کوکیز استعمال کریں؟ (Google Analytics، Microsoft Clarity)", "قبول", "رد", "رازداری", "کوکی کی ترتیبات"],
 'fa': ["کوکی برای شمردن بازدیدها و دیدن اینکه سایت چطور استفاده می‌شود؟ (Google Analytics، Microsoft Clarity)", "قبول", "رد", "حریم خصوصی", "تنظیمات کوکی"],
 'wo': ["Ndax mën nañu jëfandikoo ay cookies ngir waññ ñi ñëw te xam ni ñuy jëfandikoo site bi? (Google Analytics, Microsoft Clarity)", "Nangu", "Bañ", "Sutura", "Tànn cookies yi"],
 'bm': ["An bɛ se ka cookies kɛ ka taamaw jate ani k’a lajɛ site bɛ baara cogo min na wa? (Google Analytics, Microsoft Clarity)", "Sɔn", "Ban", "Gundo", "Cookies labɛncogo"],
 'ti': ["ምብጻሓት ንምቑጻርን እቲ መርበብ ከመይ ከም ዝጥቀም ንምርኣይን cookies ክንጥቀም ንኽእልዶ? (Google Analytics፣ Microsoft Clarity)", "ተቐበል", "ኣይፋል", "ብሕትውና", "ምድላው cookies"],
 'ps': ["د لیدنو د شمېرلو او دا چې سایټ څنګه کارول کېږي د لیدلو لپاره کوکیز وکاروو؟ (Google Analytics، Microsoft Clarity)", "منل", "ردول", "محرمیت", "د کوکیز تنظیمات"],
 'so': ["Cookies si aan u tirinno booqashooyinka oo aan u aragno sida bogga loo isticmaalo? (Google Analytics, Microsoft Clarity)", "Aqbal", "Diid", "Qarsoodinimo", "Dejinta cookies"],
 'am': ["ጉብኝቶችን ለመቁጠር እና ድረ-ገጹ እንዴት እንደሚጠቀሙበት ለማየት ኩኪዎችን እንጠቀም? (Google Analytics፣ Microsoft Clarity)", "ተቀበል", "አትቀበል", "ግላዊነት", "የኩኪ ቅንብሮች"],
 'tr': ["Ziyaretleri saymak ve sitenin nasıl kullanıldığını görmek için çerez kullanalım mı? (Google Analytics, Microsoft Clarity)", "Kabul et", "Reddet", "Gizlilik", "Çerez ayarları"],
 'bn': ["ভিজিট গুনতে আর সাইট কীভাবে ব্যবহার হয় তা দেখতে কুকি ব্যবহার করব? (Google Analytics, Microsoft Clarity)", "মেনে নাও", "না", "গোপনীয়তা", "কুকি সেটিংস"],
 'zh': ["可以用 Cookie 统计访问并了解网站的使用情况吗？（Google Analytics、Microsoft Clarity）", "接受", "拒绝", "隐私", "Cookie 设置"],
}

_JS = r"""
(function(w,d,n){
var T=__TX__;
function tx(i,el){var x=el&&el.closest&&el.closest('[lang]'),l=((x||d.documentElement).getAttribute('lang')||'en').slice(0,2).toLowerCase();return (T[l]||T.en)[i]}
var off=n.doNotTrack=='1'||w.doNotTrack=='1'||n.globalPrivacyControl||/[?&]embed=1/.test(location.search)||location.protocol=='file:'||(n.connection&&(n.connection.saveData||/2g/.test(n.connection.effectiveType||'')));
function bind(){[].forEach.call(d.querySelectorAll('[data-sn-cookies]'),function(e){if(off){e.hidden=true;return}e.textContent=tx(4,e);if(e.getAttribute('data-snb'))return;e.setAttribute('data-snb','1');e.addEventListener('click',function(){w.snCookies()})})}
w.snBind=bind;
if(d.readyState=='loading')d.addEventListener('DOMContentLoaded',bind);else bind();
if(off)return;
var K='sn.ck',ch=null,tz='';try{ch=localStorage.getItem(K)}catch(e){}
try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
var eu=!tz||/^(Europe\/|Arctic\/|Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe))/.test(tz);
var ok=ch=='1'||(!eu&&ch!='0'),gl=0,ready=0;
w.dataLayer=w.dataLayer||[];function g(){dataLayer.push(arguments)}w.gtag=g;
g('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:ok?'granted':'denied'});
g('js',new Date());g('config','__GA__',{allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname+location.search});
w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};
function cv(){w.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:ok?'granted':'denied'})}
cv();w.clarity('set','site','supportnear');
d.documentElement.setAttribute('data-clarity-mask','True');
function a(s){var e=d.createElement('script');e.async=1;e.src=s;d.head.appendChild(e)}
function load(){if(gl||!ready||!ok)return;gl=1;a('https://www.googletagmanager.com/gtag/js?id=__GA__');a('https://www.clarity.ms/tag/__CL__')}
function set(v){try{localStorage.setItem(K,v?'1':'0')}catch(e){}ch=v?'1':'0';ok=!!v;g('consent','update',{analytics_storage:v?'granted':'denied'});cv();if(v){ready=1;load()}else d.cookie.split(';').forEach(function(c){var k=c.split('=')[0].trim();if(/^_(ga|clck|clsk)/.test(k)){var h=location.hostname;[h,'.'+h,'.'+h.split('.').slice(-2).join('.')].forEach(function(dm){d.cookie=k+'=;Max-Age=0;path=/;domain='+dm});d.cookie=k+'=;Max-Age=0;path=/'}});var b=d.getElementById('sn-ck');if(b)b.parentNode.removeChild(b)}
function btn(t,y){var b=d.createElement('button');b.type='button';b.textContent=t;b.style.cssText='flex:1;min-height:40px;border-radius:10px;font-weight:600;font-size:14px;line-height:1.2;font-family:inherit;cursor:pointer;padding:6px 10px;'+(y?'background:#0B7A63;color:#fff;border:1.5px solid #0B7A63':'background:transparent;color:inherit;border:1.5px solid currentColor');b.addEventListener('click',function(){set(y)});return b}
function bar(hi){if(d.getElementById('sn-ck')||!d.body)return;var dk=d.documentElement.getAttribute('data-theme')=='dark'||(!d.documentElement.getAttribute('data-theme')&&w.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
var b=d.createElement('div');b.id='sn-ck';b.setAttribute('role','region');b.setAttribute('aria-label',tx(4));
b.style.cssText='position:fixed;z-index:'+(hi?2600:1900)+';left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));max-width:470px;margin:0 auto;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.22);padding:10px 12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;font:13.5px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;'+(dk?'background:#1d2228;color:#eef0f2;border:1px solid #3a424c':'background:#fff;color:#1c1916;border:1px solid #d9d2c5');
var p=d.createElement('p');p.style.cssText='margin:0;flex:1 1 210px;min-width:0';p.textContent=tx(0)+' ';var m=d.createElement('a');m.href='/about';m.textContent=tx(3);m.style.cssText='color:inherit;text-decoration:underline;white-space:nowrap';p.appendChild(m);
var r=d.createElement('div');r.style.cssText='display:flex;gap:8px;flex:1 1 170px';r.appendChild(btn(tx(1),1));r.appendChild(btn(tx(2),0));b.appendChild(p);b.appendChild(r);d.body.appendChild(b)}
w.snCookies=function(){var b=d.getElementById('sn-ck');if(b)b.parentNode.removeChild(b);bar(1)};
function go(){if(ready)return;ready=1;load()}
function arm(){['pointerdown','keydown','touchstart','scroll'].forEach(function(v){w.addEventListener(v,go,{once:true,passive:true,capture:true})});setTimeout(go,5000);if(eu&&ch==null)setTimeout(bar,1500)}
if(d.readyState=='complete')arm();else w.addEventListener('load',arm)
})(window,document,navigator);
"""


def snip(lang=None):
    """El <script>. Sin `lang`, con los 20 idiomas (la app, que cambia de idioma sin recargar);
    con `lang`, solo ese y el ingles (las paginas sueltas)."""
    import json
    tx = TX if not lang else {k: TX[k] for k in dict.fromkeys(['en', lang if lang in TX else 'en'])}
    js = _JS.replace('__TX__', json.dumps(tx, ensure_ascii=False, separators=(',', ':'))).replace('__GA__', GA_ID).replace('__CL__', CLARITY_ID)
    js = '\n'.join(l.strip() for l in js.strip().splitlines())
    js = js.replace('\n', '')
    assert '</' not in js.replace('<\\/', '')
    # R22h: el worker «analytics-all» de Cloudflare mira el texto de los <script> por trozos; si «clarity.ms/tag»
    # cae justo en el corte de un trozo (pasa hacia el byte 3010 de la pagina) no lo ve y mete su propio Clarity,
    # que la CSP bloquea. La marca va tambien al principio y al final: un corte no puede partir las tres.
    return '<script>/*clarity.ms/tag %s*/' % GA_ID + js + '/*clarity.ms/tag*/</script>'


SNIP = snip()
SNIP_RX = r'<script>(?:/\*clarity\.ms/tag [\w-]+\*/)?\(function\(w,d,n\)\{var T=\{"en":\[.*?\}\)\(window,document,navigator\);(?:/\*clarity\.ms/tag\*/)?</script>'
CSP_SCRIPT = 'https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms'
CSP_CONNECT = ('https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com '
               'https://*.clarity.ms https://c.bing.com')
CSP_IMG = 'https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com'


def page_snip(html):
    """El que le toca a esta pagina: completo en la app, su idioma + ingles en las demas."""
    import re
    if 'id="mWel"' in html or 'var RTL' in html or 'documentElement.lang' in html:
        return SNIP          # la app y las paginas que cambian de idioma sin recargar
    m = re.search(r'<html[^>]*\blang="([A-Za-z]{2})', html)
    return snip(m.group(1).lower() if m else 'en')


def _hash(tag):
    import base64, hashlib
    return base64.b64encode(hashlib.sha256(tag[len('<script>'):-len('</script>')].encode('utf-8')).digest()).decode()


def add(html):
    """Mete el script en el <head> (tras <meta charset>) si la pagina aun no mide. Si lleva uno
    de una ronda anterior, lo cambia por el de ahora (y su huella en la CSP, si la pagina la
    lleva escrita a mano)."""
    import re
    if '<head' not in html:
        return html
    new = page_snip(html)
    if GA_ID in html:
        m = re.search(SNIP_RX, html, re.S)
        if not m or m.group(0) == new:
            return html
        old = m.group(0)
        return html.replace(old, new).replace('sha256-' + _hash(old), 'sha256-' + _hash(new))
    m = re.search(r'<meta charset="utf-8">', html, re.I)
    if m:
        return html[:m.end()] + new + html[m.end():]
    return re.sub(r'(<head[^>]*>)', lambda x: x.group(1) + new, html, count=1)
