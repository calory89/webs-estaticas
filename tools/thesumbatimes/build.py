# -*- coding: utf-8 -*-
import os, json, html, shutil, datetime
from content import LANGS, UI, ARTICLES, LETTER, stay_table

BASE = "https://thesumbatimes.com"
OUT = os.path.join(os.path.dirname(__file__), "out")
CLARITY = "z9xpaay63s"
SB_URL = "https://oykcsmextclpdnugixqz.supabase.co"
SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw"
SECTIONS = ["news","getting-here","things-to-do","culture","where-to-stay","projects","low-tide"]
OG_IMG = BASE + "/og.png"
MONTHS = {"en":["January","February","March","April","May","June","July","August","September","October","November","December"],
          "es":["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"],
          "id":["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]}
def fdate(d, l):
    y,m,dd = map(int, d.split("-"))
    if l=="en": return f"{dd} {MONTHS[l][m-1]} {y}"
    if l=="es": return f"{dd} de {MONTHS[l][m-1]} de {y}"
    return f"{dd} {MONTHS[l][m-1]} {y}"
HTML_LANG = {"en":"en","es":"es","id":"id"}
OG_LOC = {"en":"en_US","es":"es_ES","id":"id_ID"}

CSS = """:root{--bg:#f7f3ec;--ink:#1d1b18;--muted:#6b645a;--line:#ddd4c6;--accent:#8a6a3d;--card:#fffdf9}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--ink);font:18px/1.65 Georgia,'Iowan Old Style','Times New Roman',serif}
a{color:inherit}a:hover{color:var(--accent)}.w{max-width:1080px;margin:0 auto;padding:0 16px}.nar{max-width:700px;margin:0 auto}
header.m{border-bottom:3px double var(--ink);padding:18px 0 10px;text-align:center}
.mt{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:clamp(38px,9vw,74px);line-height:1;letter-spacing:.01em;text-decoration:none;display:inline-block}
.tg{font:13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);letter-spacing:.06em;text-transform:uppercase;margin-top:8px}
.bar{display:flex;justify-content:space-between;gap:10px;font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);padding:8px 0;border-bottom:1px solid var(--line);flex-wrap:wrap}
.bar a{text-decoration:none;margin-left:10px}.bar a.on{color:var(--ink);font-weight:600}
nav.s{display:flex;gap:18px;overflow-x:auto;white-space:nowrap;padding:10px 0;border-bottom:1px solid var(--line);font:14px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;scrollbar-width:none}
nav.s a{text-decoration:none}nav.s a.on{border-bottom:2px solid var(--ink)}
.k{font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:0 0 6px}
h1{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:clamp(32px,6vw,52px);line-height:1.08;margin:.2em 0 .3em}
h2{font-size:22px;line-height:1.3;margin:1.6em 0 .4em}h3{font-size:22px;line-height:1.25;margin:.2em 0 .3em}
.dek{font-size:21px;color:var(--muted);line-height:1.45;margin:0 0 .8em}
.meta{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:8px 0;margin:14px 0 22px}
article p,article li{font-size:19px}article ul,article ol{padding-left:22px}article li{margin:.35em 0}
ol.regrets{background:var(--card);border:1px solid var(--line);padding:18px 18px 18px 42px;border-radius:6px}
.note{font-size:16px!important;color:var(--muted)}
.src{font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);border-top:1px solid var(--line);margin-top:30px;padding-top:12px}.src ol{padding-left:18px}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}th{font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:26px;margin:24px 0}
.card{border-top:1px solid var(--ink);padding-top:12px}.card a{text-decoration:none}.card p{color:var(--muted);font-size:16px;margin:.3em 0}
.lead{display:grid;grid-template-columns:2fr 1fr;gap:32px;padding:26px 0;border-bottom:1px solid var(--line)}
.lead h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(30px,5vw,46px);line-height:1.08;margin:.1em 0 .3em}.lead h2 a{text-decoration:none}
@media(max-width:760px){.lead{grid-template-columns:1fr;gap:18px}}
.sub{background:var(--ink);color:#f3ede3;border-radius:6px;padding:22px}.sub h3{color:#f3ede3}.sub p{font-size:16px;color:#d9d0c2}
.sub form{display:flex;gap:8px;flex-wrap:wrap}.sub input{flex:1 1 180px;padding:12px;border-radius:4px;border:0;font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
.sub button{padding:12px 16px;border:0;border-radius:4px;background:#c9a46a;color:#1d1b18;font:600 15px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;cursor:pointer}
.sub small{display:block;margin-top:8px;color:#b9ae9e;font:12px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}.sub .msg{font:14px -apple-system,sans-serif;margin-top:8px}
footer{border-top:3px double var(--ink);margin-top:50px;padding:20px 0 40px;font:13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted)}footer b{color:var(--ink)}
.sec-h{border-bottom:1px solid var(--ink);padding:24px 0 8px}.sec-h p{color:var(--muted);margin:.2em 0 0}"""

def esc(s): return html.escape(s, quote=True)

def path_for(l, kind, sec=None, slug=None):
    if kind=="home": return f"/{l}/"
    if kind=="section": return f"/{l}/{sec}/"
    return f"/{l}/{sec}/{slug}/"

def head(l, title, desc, path_tpl, og_type="website", extra=""):
    alts = "".join(f'<link rel="alternate" hreflang="{x}" href="{BASE}{path_tpl.format(l=x)}">' for x in LANGS)
    alts += f'<link rel="alternate" hreflang="x-default" href="{BASE}{path_tpl.format(l="en")}">'
    url = BASE + path_tpl.format(l=l)
    return f"""<!doctype html><html lang="{HTML_LANG[l]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(desc)}"><link rel="canonical" href="{url}">{alts}
<meta property="og:site_name" content="The Sumba Times"><meta property="og:type" content="{og_type}"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{url}"><meta property="og:locale" content="{OG_LOC[l]}"><meta property="og:image" content="{OG_IMG}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="The Sumba Times" href="{BASE}/{l}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap" rel="stylesheet">
<style>{CSS}</style>
<script>(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","{CLARITY}");</script>
{extra}</head><body>"""

def masthead(l, path_tpl, active=None):
    u = UI[l]
    today = f'<span id="dt"></span><script>try{{document.getElementById("dt").textContent=new Intl.DateTimeFormat("{l}",{{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Makassar"}}).format(new Date())}}catch(e){{}}</script>'
    langs = "".join(f'<a href="{path_tpl.format(l=x)}" hreflang="{x}" class="{"on" if x==l else ""}">{x.upper()}</a>' for x in LANGS)
    nav = "".join(f'<a href="/{l}/{s}/" class="{"on" if s==active else ""}">{u["sections"][s]}</a>' for s in SECTIONS)
    return f"""<div class="w"><div class="bar"><span>{today} · Sumba, Indonesia</span><span>{langs}</span></div>
<header class="m"><a class="mt" href="/{l}/">The Sumba Times</a><div class="tg">{u["tagline"]}</div></header>
<nav class="s" aria-label="{ {"en":"Sections","es":"Secciones","id":"Rubrik"}[l] }">{nav}</nav></div>"""

def subscribe(l):
    u = UI[l]
    return f"""<div class="sub" id="subscribe"><h3>{u["sub_title"]}</h3><p>{u["sub_text"]}</p>
<form onsubmit="return stSub(event,this)"><input type="email" name="email" required placeholder="{esc(u["sub_ph"])}" aria-label="{esc(u["sub_ph"])}"><button type="submit">{u["sub_btn"]}</button></form>
<div class="msg" role="status"></div><small>{u["privacy"]}</small></div>
<script>function stSub(e,f){{e.preventDefault();var m=f.parentNode.querySelector('.msg');var em=f.email.value.trim().toLowerCase();
fetch('{SB_URL}/rest/v1/newsletter_subscribers',{{method:'POST',headers:{{'apikey':'{SB_ANON}','Authorization':'Bearer {SB_ANON}','Content-Type':'application/json','Prefer':'return=minimal'}},body:JSON.stringify({{email:em,name:'The Sumba Times ({l})'}})}})
.then(function(r){{if(r.ok||r.status===409){{m.textContent={json.dumps(u["sub_ok"])};f.reset();try{{clarity('event','subscribe')}}catch(_){{}}}}else{{m.textContent={json.dumps(u["sub_err"])}}}}})
.catch(function(){{m.textContent={json.dumps(u["sub_err"])}}});return false}}</script>"""

def footer(l):
    u = UI[l]
    return f"""<div class="w"><footer><b>The Sumba Times</b> · <a href="https://ecobeachcity.com/" rel="noopener">{u["published_by"]}</a><br>{u["disclosure"]}<br>© {datetime.date.today().year} The Sumba Times</footer></div></body></html>"""

def all_items():
    return ARTICLES + [LETTER]

def body_html(a, l):
    b = a[l]["body"]
    if a.get("table"): b = b.replace("{TABLE}", stay_table(l))
    return b

def write(p, s):
    fp = os.path.join(OUT, p.lstrip("/"))
    if fp.endswith("/"): fp += "index.html"
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, "w", encoding="utf-8").write(s)

def article_page(a, l):
    u = UI[l]; c = a[l]
    tpl = "/{l}/" + a["section"] + "/" + a["slug"] + "/"
    url = BASE + tpl.format(l=l)
    ld = {"@context":"https://schema.org","@type":"NewsArticle","headline":c["title"][:110],"description":c["dek"],"inLanguage":l,
          "datePublished":a["date"]+"T07:00:00+08:00","dateModified":a["date"]+"T07:00:00+08:00","mainEntityOfPage":url,"image":[OG_IMG],
          "author":{"@type":"Organization","name":"The Sumba Times","url":BASE},
          "publisher":{"@type":"Organization","name":"The Sumba Times","logo":{"@type":"ImageObject","url":BASE+"/og.png"},"parentOrganization":{"@type":"Organization","name":"Eco Beach City","url":"https://ecobeachcity.com"}}}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
    s = head(l, c["title"]+" · The Sumba Times", c["dek"], tpl, "article", extra) + masthead(l, tpl, a["section"])
    srcs = "".join(f'<li><a href="{esc(h)}" rel="nofollow noopener" target="_blank">{esc(t)}</a></li>' for t,h in a["sources"])
    kicker = c.get("kicker", u["sections"][a["section"]])
    s += f"""<main class="w"><article class="nar" style="padding-top:26px"><p class="k"><a href="/{l}/{a["section"]}/" style="text-decoration:none">{esc(kicker)}</a></p>
<h1>{esc(c["title"])}</h1><p class="dek">{esc(c["dek"])}</p><div class="meta">{u["updated"]} {fdate(a["date"], l)} · The Sumba Times</div>
{body_html(a,l)}<div class="src"><b>{u["sources"]}</b><ol>{srcs}</ol></div><div style="margin-top:30px">{subscribe(l)}</div></article>
{more(l, a)}</main>""" + footer(l)
    write(tpl.format(l=l), s)

def card(a, l):
    c = a[l]; u = UI[l]
    return f'<div class="card"><p class="k">{esc(c.get("kicker", u["sections"][a["section"]]))}</p><h3><a href="/{l}/{a["section"]}/{a["slug"]}/">{esc(c["title"])}</a></h3><p>{esc(c["dek"])}</p></div>'

def more(l, cur):
    others = [a for a in all_items() if a is not cur][:3]
    return f'<section style="margin-top:40px"><p class="k">{UI[l]["more"]}</p><div class="grid">{"".join(card(a,l) for a in others)}</div></section>'

def section_page(sec, l):
    u = UI[l]; tpl = "/{l}/" + sec + "/"
    items = [a for a in all_items() if a["section"]==sec]
    s = head(l, u["sections"][sec]+" · The Sumba Times", u["section_desc"][sec], tpl) + masthead(l, tpl, sec)
    grid = "".join(card(a,l) for a in items) or f'<p>{u["coming"]}</p>'
    s += f'<main class="w"><div class="sec-h"><h1>{u["sections"][sec]}</h1><p>{u["section_desc"][sec]}</p></div><div class="grid">{grid}</div>'
    if sec=="low-tide": s += f'<div class="nar">{subscribe(l)}</div>'
    s += '</main>' + footer(l)
    write(tpl.format(l=l), s)

def home(l):
    u = UI[l]; tpl = "/{l}/"
    top = next(a for a in ARTICLES if a.get("top"))
    rest = [a for a in all_items() if a is not top]
    ld = {"@context":"https://schema.org","@type":"WebSite","name":"The Sumba Times","url":BASE+f"/{l}/","inLanguage":l,
          "publisher":{"@type":"Organization","name":"Eco Beach City","url":"https://ecobeachcity.com"}}
    s = head(l, "The Sumba Times · "+u["tagline"], u["tagline"]+".", tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + masthead(l, tpl)
    s += f"""<main class="w"><section class="lead"><div><p class="k">{u["top"]}</p><h2><a href="/{l}/{top["section"]}/{top["slug"]}/">{esc(top[l]["title"])}</a></h2><p class="dek">{esc(top[l]["dek"])}</p>
<p><a href="/{l}/{top["section"]}/{top["slug"]}/">{u["read"]} →</a></p></div><aside>{subscribe(l)}</aside></section>
<section><p class="k" style="margin-top:24px">{u["latest"]}</p><div class="grid">{"".join(card(a,l) for a in rest)}</div></section></main>""" + footer(l)
    write(tpl.format(l=l), s)

def feed(l):
    items = "".join(f"<item><title>{esc(a[l]['title'])}</title><link>{BASE}/{l}/{a['section']}/{a['slug']}/</link><guid>{BASE}/{l}/{a['section']}/{a['slug']}/</guid><description>{esc(a[l]['dek'])}</description><pubDate>{datetime.datetime.strptime(a['date'],'%Y-%m-%d').strftime('%a, %d %b %Y 07:00:00 +0800')}</pubDate></item>" for a in all_items())
    write(f"/{l}/feed.xml", f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Sumba Times</title><link>{BASE}/{l}/</link><description>{esc(UI[l]["tagline"])}</description><language>{l}</language>{items}</channel></rss>')

def root():
    s = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Sumba Times · News, culture and travel from Sumba, Indonesia</title>
<meta name="description" content="News, culture and travel from the island of Sumba, Indonesia. In English, Spanish and Indonesian."><link rel="canonical" href="https://thesumbatimes.com/en/">
<link rel="alternate" hreflang="en" href="https://thesumbatimes.com/en/"><link rel="alternate" hreflang="es" href="https://thesumbatimes.com/es/"><link rel="alternate" hreflang="id" href="https://thesumbatimes.com/id/"><link rel="alternate" hreflang="x-default" href="https://thesumbatimes.com/">
<script>(function(){var l=(navigator.language||'en').slice(0,2).toLowerCase();var t=l==='es'?'/es/':(l==='id'||l==='ms')?'/id/':'/en/';location.replace(t)})();</script>
<style>body{font:18px Georgia,serif;background:#f7f3ec;color:#1d1b18;text-align:center;padding:15vh 16px}a{margin:0 10px}</style></head>
<body><h1>The Sumba Times</h1><p><a href="/en/">English</a><a href="/es/">Español</a><a href="/id/">Bahasa Indonesia</a></p></body></html>"""
    write("/", s)

def sitemap():
    urls = []
    def add(tpl):
        alts = "".join(f'<xhtml:link rel="alternate" hreflang="{x}" href="{BASE}{tpl.format(l=x)}"/>' for x in LANGS)
        for l in LANGS: urls.append(f"<url><loc>{BASE}{tpl.format(l=l)}</loc>{alts}<changefreq>daily</changefreq></url>")
    add("/{l}/")
    for s in SECTIONS: add("/{l}/"+s+"/")
    for a in all_items(): add("/{l}/"+a["section"]+"/"+a["slug"]+"/")
    write("/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+"".join(urls)+"</urlset>")
    write("/robots.txt", "User-agent: *\nAllow: /\nSitemap: https://thesumbatimes.com/sitemap.xml\n")

def assets():
    write("/favicon.svg", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#1d1b18"/><text x="32" y="45" font-family="Georgia,serif" font-size="38" text-anchor="middle" fill="#f7f3ec">S</text></svg>')
    nf = """<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found · The Sumba Times</title><meta name="robots" content="noindex"><style>body{font:18px Georgia,serif;background:#f7f3ec;color:#1d1b18;text-align:center;padding:15vh 16px}</style></head><body><h1>The Sumba Times</h1><p>Page not found. <a href="/en/">Home</a> · <a href="/es/">Portada</a> · <a href="/id/">Beranda</a></p></body></html>"""
    write("/404/", nf); write("/404.html", nf)

if __name__ == "__main__":
    shutil.rmtree(OUT, ignore_errors=True)
    for l in LANGS:
        home(l); feed(l)
        for s in SECTIONS: section_page(s, l)
        for a in all_items(): article_page(a, l)
    root(); sitemap(); assets()
    n = sum(len(f) for _,_,f in os.walk(OUT)); print("files", n)
