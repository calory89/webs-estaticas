# -*- coding: utf-8 -*-
# about.html: quien esta detras, con nombre y contacto. Para una persona
# vulnerable, saber quien hace esto es parte de decidir si se fia.
import io, hashlib, re
from seo_common import finalize
CSS = io.open('page.css.txt', encoding='utf-8').read()
h = io.open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
STATS = __import__('json').loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', h).group(1))
SV = '?v=' + hashlib.sha1(open('social.jpg', 'rb').read()).hexdigest()[:8]
# Correo: Cloudflare cambia los mailto: por /cdn-cgi/l/email-protection, que sin
# JavaScript da 404 (QA m13). <!--email_off--> le dice que no lo toque.
MAIL = '<!--email_off--><a href="mailto:rrppspain@gmail.com">rrppspain@gmail.com</a><!--/email_off-->'


def sec(lang):
    es = lang == 'es'
    # Un solo h1 por pagina (QA p3): el ingles va primero, que es el idioma del
    # HTML y de la app que enlaza aqui; el espanol lleva el mismo titulo como h2.
    return f'''<section lang="{lang}">
{'<h2 class="h1">Quién está detrás de SupportNear</h2>' if es else '<h1>Who is behind SupportNear</h1>'}
<p class="lede">{'SupportNear es un proyecto sin ánimo de lucro: un mapa de ayuda gratuita (comida, cama, ducha, ropa, médico, papeles) para quien lo necesita hoy. Sin cuenta, sin coste, sin publicidad.' if es else 'SupportNear is a non-profit project: a map of free help (food, a bed, a shower, clothes, a doctor, paperwork) for whoever needs it today. No account, no cost, no ads.'}</p>
<h2>{'La persona' if es else 'The person'}</h2>
<p>{'Lo hace <strong>Carlos de Ory</strong>, emprendedor español, en su tiempo libre y con su propio dinero. No hay empresa detrás, ni inversores, ni subvención, ni patrocinadores. Si un día los hubiera, se dirá aquí.' if es else 'It is made by <strong>Carlos de Ory</strong>, a Spanish entrepreneur, in his own time and with his own money. There is no company behind it, no investors, no grant, no sponsors. If one day there are, it will be said here.'}</p>
<p>{'Contacto' if es else 'Contact'}: {MAIL} · <a href="https://x.com/mrstartups" rel="noopener">@mrstartups</a>{' · Respondemos en español, inglés y francés.' if es else ' · We answer in Spanish, English and French.'}</p>
<h2>{'De dónde salen los datos' if es else 'Where the data comes from'}</h2>
<p>{'De <a href="https://www.openstreetmap.org" rel="noopener">OpenStreetMap</a>, el mapa libre que mantienen voluntarios de todo el mundo (licencia ODbL), más los teléfonos de emergencia de Wikidata revisados a mano. Hoy: ' if es else 'From <a href="https://www.openstreetmap.org" rel="noopener">OpenStreetMap</a>, the free map maintained by volunteers worldwide (ODbL licence), plus emergency numbers from Wikidata reviewed by hand. Today: '}<strong>{STATS['places']:,}</strong> {'sitios en' if es else 'places in'} <strong>{STATS['cities']:,}</strong> {'ciudades de' if es else 'cities across'} <strong>{STATS['countries']}</strong> {'países' if es else 'countries'}. {'Cuando un dato está mal, se corrige en OpenStreetMap y así lo aprovecha todo el mundo, no solo esta web.' if es else 'When something is wrong, it gets fixed in OpenStreetMap, so everyone benefits, not only this site.'}</p>
<h2>{'Qué medimos' if es else 'What we measure'}</h2>
<p>{'Medimos para mejorar la web: nuestro contador anónimo (visitas, idioma, ciudad y qué se buscó sin encontrarlo), Google Analytics (páginas vistas, país, tipo de aparato; usa una cookie para distinguir una visita de otra) y Microsoft Clarity (toques y desplazamientos, con todo el texto de la pantalla oculto). Ninguno recibe tu nombre, una cuenta ni tu posición. En Europa, Google Analytics y Clarity (que usan cookies) solo se cargan si aceptas. Si tu navegador pide no ser rastreado, no se carga nada de esto.' if es else 'We measure to improve the site: our own anonymous counter (visits, language, city and what was searched without success), Google Analytics (pages visited, country, type of device; it uses a cookie to tell one visit from another) and Microsoft Clarity (taps and scrolling, with all the text on screen hidden). None of them gets your name, an account or your position. In Europe, Google Analytics and Clarity (which use cookies) only load if you accept. If your browser asks not to be tracked, none of this loads.'}</p>
<p><button type="button" data-sn-cookies style="min-height:44px;padding:8px 16px;border-radius:12px;border:1.5px solid currentColor;background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer">{'Configurar cookies' if es else 'Cookie settings'}</button></p>
<h2 id="{'seguridad' if es else 'security'}">{'Seguridad' if es else 'Security'}</h2>
<p>{'Si encuentras un fallo de seguridad, escribe a' if es else 'If you find a security issue, write to'} {MAIL}. {'No hay cuentas ni datos personales que robar, pero un fallo que enseñe información equivocada a alguien en la calle también es grave para nosotros.' if es else 'There are no accounts or personal data to steal, but a bug that shows wrong information to someone on the street is just as serious to us.'} (<a href="/.well-known/security.txt">security.txt</a>)</p>
<h2>{'Cómo ayudar' if es else 'How to help'}</h2>
<p>{'Comprueba un sitio que conozcas y corrige el horario o el teléfono en OpenStreetMap; imprime el cartel de tu ciudad y pégalo donde haga falta; enséñale la web a alguien que la necesite. Si eres una entidad, puedes <a href="incrustar.html">incrustar el mapa</a> en tu web gratis.' if es else 'Check a place you know and fix its hours or phone on OpenStreetMap; print your city poster and put it up where it is needed; show the site to someone who needs it. If you are an organisation, you can <a href="incrustar.html">embed the map</a> on your website for free.'}</p>
</section>'''
page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Who is behind SupportNear · Quién está detrás</title>
<meta name="description" content="SupportNear es un mapa de ayuda gratuita sin ánimo de lucro, hecho por Carlos de Ory con datos de OpenStreetMap. Sin cuenta, sin coste, sin publicidad.">
<link rel="canonical" href="https://supportnear.com/about">
<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear"><meta property="og:url" content="https://supportnear.com/about">
<meta property="og:title" content="Quién está detrás · SupportNear"><meta property="og:description" content="Un mapa de ayuda gratuita sin ánimo de lucro. Quién lo hace, de dónde salen los datos y qué medimos.">
<meta property="og:image" content="https://supportnear.com/social.jpg{SV}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups"><meta name="twitter:image" content="https://supportnear.com/social.jpg{SV}">
<link rel="icon" href="favicon.ico" sizes="32x32"><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="apple-touch-icon.png"><meta name="theme-color" content="#0B7A63">
<style>{CSS}
section+section{{margin-top:34px;padding-top:26px;border-top:1px solid var(--line)}} h2{{font-size:17px;margin:20px 0 6px}} p{{line-height:1.7}}
h2.h1{{font-size:28px;margin:0 0 10px;border:0;padding:0}}</style></head>
<body><div class="wrap"><a class="backlink" href="./">&larr; Open the map · Abrir el mapa</a>
{sec('en')}
{sec('es')}
<footer>SupportNear &middot; OpenStreetMap (ODbL)</footer>
</div></body></html>'''
io.open('about.html', 'w', encoding='utf-8').write(finalize(page))
print('about.html', len(page))
