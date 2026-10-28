# -*- coding: utf-8 -*-
"""Medicion de SupportNear (R20, 28-oct-2026): GA4 (con cookie) y Microsoft Clarity (sin cookies propias).

- Un solo <script> en linea en el <head> de cada pagina. Lleva el id de GA4 y
  «clarity.ms/tag», asi el worker «analytics-all» de Cloudflare ve que la pagina
  ya mide y no mete su propio codigo (que la CSP bloquearia).
- Nada si el navegador pide no ser rastreado (DNT / Global Privacy Control), ni en
  el mapa incrustado en otras webs (?embed=1), ni con «ahorro de datos» o en 2G: la
  web es para el movil mas barato. Y se carga 1,5 s despues de la pagina, no antes.
- GA4 con su cookie _ga (sin ella no da datos: con analytics_storage denegado solo
  modeliza), sin señales de Google ni anuncios, y la URL sin el #fragmento.
- Clarity: modo sin cookies (consentv2 denegado) y todo el texto enmascarado.
"""
GA_ID = 'G-FJKJE77K4V'
CLARITY_ID = 'z4eqcmaic7'
SNIP = ("<script>(function(w,d,n){if(n.doNotTrack=='1'||w.doNotTrack=='1'||n.globalPrivacyControl||"
        "/[?&]embed=1/.test(location.search)||location.protocol=='file:'||(n.connection&&(n.connection.saveData||/2g/.test(n.connection.effectiveType||''))))return;"
        "w.dataLayer=w.dataLayer||[];function g(){dataLayer.push(arguments)}w.gtag=g;"
        "g('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});"
        "g('js',new Date());g('config','" + GA_ID + "',{allow_google_signals:false,"
        "allow_ad_personalization_signals:false,page_location:location.origin+location.pathname+location.search});"
        "w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};"
        "w.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});w.clarity('set','site','supportnear');"
        "d.documentElement.setAttribute('data-clarity-mask','True');"
        "function a(s){var e=d.createElement('script');e.async=1;e.src=s;d.head.appendChild(e)}"
        "function go(){a('https://www.googletagmanager.com/gtag/js?id=" + GA_ID + "');a('https://www.clarity.ms/tag/" + CLARITY_ID + "')}"
        "if(d.readyState=='complete')setTimeout(go,1500);else w.addEventListener('load',function(){setTimeout(go,1500)})"
        "})(window,document,navigator);</script>")
CSP_SCRIPT = 'https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms'
CSP_CONNECT = ('https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com '
               'https://*.clarity.ms https://c.bing.com')
CSP_IMG = 'https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com'


def add(html):
    """Mete SNIP en el <head> (tras <meta charset>) si la pagina aun no mide."""
    import re
    if GA_ID in html or '<head' not in html:
        return html
    m = re.search(r'<meta charset="utf-8">', html, re.I)
    if m:
        return html[:m.end()] + SNIP + html[m.end():]
    return re.sub(r'(<head[^>]*>)', lambda x: x.group(1) + SNIP, html, count=1)
