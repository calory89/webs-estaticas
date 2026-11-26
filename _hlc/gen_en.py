#!/usr/bin/env python3
"""English edition of Happy Low Cost: /en/, /en/deals/, /en/deals/<slug>/, /en/destinations/<slug>/.
Built from the same agent feed (English texts written by the Claude API in post.en and guide_html_en).
Run after gen_deals.py, from the root of branch pub/happylowcost.com: python3 _hlc/gen_en.py
"""
import os, re, json, sys, datetime, urllib.request
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, '_hlc'))
import gen_deals as G  # noqa: E402
T3 = G.T3

SITE, e, flag, slugify = G.SITE, G.e, G.flag, G.slugify
API = G.API

from en_names import NAMES  # noqa: E402
COUNTRIES = {'ES': 'Spain', 'PT': 'Portugal', 'GB': 'United Kingdom', 'IE': 'Ireland', 'FR': 'France', 'IT': 'Italy', 'DE': 'Germany', 'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland',
             'AT': 'Austria', 'DK': 'Denmark', 'SE': 'Sweden', 'NO': 'Norway', 'FI': 'Finland', 'PL': 'Poland', 'CZ': 'Czechia', 'HU': 'Hungary', 'GR': 'Greece', 'RO': 'Romania', 'BG': 'Bulgaria',
             'HR': 'Croatia', 'RS': 'Serbia', 'TR': 'Turkey', 'IS': 'Iceland', 'MT': 'Malta', 'CY': 'Cyprus', 'EE': 'Estonia', 'LV': 'Latvia', 'LT': 'Lithuania', 'US': 'United States',
             'CA': 'Canada', 'MX': 'Mexico', 'CU': 'Cuba', 'DO': 'Dominican Republic', 'PR': 'Puerto Rico', 'CO': 'Colombia', 'PE': 'Peru', 'BR': 'Brazil', 'AR': 'Argentina', 'CL': 'Chile',
             'EC': 'Ecuador', 'UY': 'Uruguay', 'CR': 'Costa Rica', 'PA': 'Panama', 'JM': 'Jamaica', 'AU': 'Australia', 'NZ': 'New Zealand', 'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China',
             'HK': 'Hong Kong', 'TW': 'Taiwan', 'TH': 'Thailand', 'VN': 'Vietnam', 'MY': 'Malaysia', 'SG': 'Singapore', 'ID': 'Indonesia', 'PH': 'Philippines', 'IN': 'India', 'LK': 'Sri Lanka',
             'MV': 'Maldives', 'NP': 'Nepal', 'AE': 'United Arab Emirates', 'QA': 'Qatar', 'SA': 'Saudi Arabia', 'OM': 'Oman', 'JO': 'Jordan', 'IL': 'Israel', 'EG': 'Egypt', 'MA': 'Morocco',
             'TN': 'Tunisia', 'DZ': 'Algeria', 'ZA': 'South Africa', 'KE': 'Kenya', 'TZ': 'Tanzania', 'MU': 'Mauritius', 'CV': 'Cape Verde', 'SN': 'Senegal', 'GM': 'Gambia', 'NG': 'Nigeria',
             'UZ': 'Uzbekistan', 'KZ': 'Kazakhstan', 'GE': 'Georgia', 'AM': 'Armenia', 'AZ': 'Azerbaijan', 'UA': 'Ukraine', 'ME': 'Montenegro', 'AL': 'Albania', 'BA': 'Bosnia', 'MK': 'North Macedonia',
             'SI': 'Slovenia', 'SK': 'Slovakia', 'LU': 'Luxembourg', 'FJ': 'Fiji', 'PF': 'French Polynesia'}
CONT = {'europa': ('Europe', '🇪🇺'), 'asia': ('Asia', '🌏'), 'oriente-medio': ('the Middle East', '🕌'), 'norteamerica': ('North America', '🗽'), 'caribe': ('the Caribbean & Central America', '🏝️'),
        'sudamerica': ('South America', '🌎'), 'africa': ('Africa', '🌍'), 'oceania': ('Oceania', '🦘')}
MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']


def date_en(iso):
    try:
        d = datetime.date.fromisoformat((iso or '')[:10])
        return f'{d.day} {MON[d.month - 1]} {d.year}'
    except Exception:
        return ''


def country(f, which):
    cc = (f.get(which + '_cc') or '').upper()
    return COUNTRIES.get(cc) or (f.get('origen_pais') if which == 'origen' else f.get('pais')) or ''


def names(x):
    f, en = x['facts'], x.get('en') or {}
    o = en.get('orig_en') or f.get('origen') or ''
    ls_ = G.lib_slug(f)
    d = en.get('dest_en') or NAMES.get(ls_ or '') or f.get('destino') or ''
    return o, d


def trip(f):
    return 'return' if f.get('vuelta') else 'one way'


def to_en_link(u):
    """Booking.com links in English (the affiliate link carries the target URL encoded)."""
    if not u:
        return '#'
    return (u.replace('locale%3Des', 'locale%3Den-gb').replace('locale=es', 'locale=en-gb').replace('searchresults.es.html', 'searchresults.en-gb.html')
             .replace('searchresults.es.html'.replace('.', '%2E'), 'searchresults.en-gb.html').replace('index.es.html', 'index.en-gb.html'))


def hotels(city):
    return f"https://www.kqzyfj.com/click-101900924-17288959?sid=happylowcost-en&url={quote('https://www.booking.com/searchresults.en-gb.html?ss=' + city, safe='')}"


HEADER = '''<header class="hx" id="hx"><div class="hx-in">
<a class="hx-logo" href="/en/" aria-label="Happy Low Cost, home"><b>happy</b><svg viewBox="0 0 250 46" aria-hidden="true"><path d="M8 8 Q120 58 214 14" fill="none" stroke="#FF5A36" stroke-width="11" stroke-linecap="round"/><g transform="translate(214 12) rotate(-24)"><path d="M-2 0 L22 -1 L26 0 L22 1 Z M8 -1 L2 -11 L6 -11 L15 -1 Z M8 1 L2 11 L6 11 L15 1 Z" fill="#FF5A36"/></g></svg><i>low cost</i></a>
<a class="hx-srch" href="/en/search/" aria-label="Search"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></a>
<button class="hx-burger" type="button" aria-label="Open menu" aria-expanded="false" onclick="var h=document.getElementById('hx');var o=h.classList.toggle('open');this.setAttribute('aria-expanded',o)"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<nav class="hx-nav" aria-label="Main">
<a href="/en/deals/">Today's deals</a>
<a href="/en/flights/">Flight routes</a>
<a href="/en/destinations/">Destination guides</a>
<a href="/en/videos/">Videos</a>
<a class="hx-cta" href="/en/alerts/">🔔 Free alert</a>
</nav></div></header>'''
FOOTER = '''<footer class="fx"><div class="fx-in">
<div><a class="fx-logo" href="/en/" style="display:inline-block;padding:0"><b>happy</b><svg width="104" height="19" viewBox="0 0 250 46" aria-hidden="true" style="display:block"><path d="M8 8 Q120 58 214 14" fill="none" stroke="#FFC531" stroke-width="11" stroke-linecap="round"/></svg><i>low cost</i></a>
<p>We hunt the cheapest flights in the world and check every price before we publish it. More than 420,000 travellers have followed us since 2012.</p></div>
<div><h2 class="fx-h">Deals</h2><a href="/en/deals/">Today's deals</a><a href="/en/deals/?orden=precio">Cheapest deals</a><a href="/en/flights/">Flight routes</a><a href="/en/alerts/">Free deal alerts</a><a href="/en/how-we-verify/">How we verify</a><a href="/en/videos/">Traveller videos</a><a href="/en/tools/">Tools</a><a href="/en/guides/error-fares/">Error fares</a><a href="/en/contact/">Contact</a></div>
<div><h2 class="fx-h">Explore</h2><a href="/en/destinations/">Destination guides</a><a href="/en/hotels/">Where to stay</a><a href="/en/deals/?cont=asia">Asia</a><a href="/en/deals/?cont=europa">Europe</a><a href="/en/deals/?cont=norteamerica">North America</a></div>
<div><h2 class="fx-h">Follow us</h2><a href="https://www.facebook.com/happylowcostofficialpage/" target="_blank" rel="noopener">Facebook</a><a href="https://x.com/happylowcost" target="_blank" rel="noopener">X / Twitter</a><a href="/">🇪🇸 Versión en español</a></div>
</div>
<div class="fx-legal">Some links are affiliate links: if you book through them we may earn a small commission at no extra cost to you. Prices were checked on the date shown on each deal and can change. Destination photos: Wikimedia Commons (credits on each page). <a href="/en/legal/" style="display:inline;color:#D6DCEA!important;text-decoration:underline">Legal notice, privacy &amp; cookies</a> · © 2012-2026 Happy Low Cost</div>
</footer><script src="/hlc/hlc.js?v=52" defer></script>'''


def head(title, desc, canonical, es_url=None, og_image=None, og_type='website', ld=None, robots=None, body_class='', extra_head='', og_alt=None):
    h = G.HEAD
    h = h.replace('<html lang="es">', '<html lang="en">').replace('content="es_ES"', 'content="en_GB"')
    h = re.sub(r'<!--hlc-header-->.*?<!--/hlc-header-->', '<!--hlc-header-->' + HEADER + '<!--/hlc-header-->', h, flags=re.S)
    h = h.replace('title="Chollos Happy Low Cost" href="/chollos/feed.xml"', 'title="Happy Low Cost deals" href="/en/deals/feed.xml"')
    alt = f'<link rel="alternate" hreflang="en" href="{canonical}">'
    if es_url:
        alt += f'<link rel="alternate" hreflang="es" href="{es_url}"><link rel="alternate" hreflang="x-default" href="{es_url}">'
    robots = robots or G.ROBOTS_IDX
    extra = '<link rel="stylesheet" href="/hlc/home.css?v=12">' + extra_head + alt + (G.ld_script(ld) if ld else '')
    for k, v in dict(title=e(title), desc=e(desc), canonical=canonical, robots=robots, og_type=og_type, og_title=e(title), og_alt=e(og_alt or title),
                     og_image=og_image or f'{SITE}/hlc/brand/og-default.jpg', extra_head=extra, body_class=body_class).items():
        h = h.replace('{' + k + '}', v)
    return h


def dates_en(f):
    a, b = date_en(f.get('ida', '')), date_en(f.get('vuelta') or '')
    if b and a and a.split()[-1] == b.split()[-1]:
        a = ' '.join(a.split()[:2])
    return f'{a} – {b}' if b else a


def level_en(p):
    return '' if not p else ('Exceptional' if p >= 50 else 'Very good')


def stops_en(f):
    n = f.get('escalas')
    return 'nonstop' if n == 0 else (f'{n} stop' + ('s' if n and n > 1 else '') if isinstance(n, int) else 'with stops')


def route_cal_en(f):
    import en_names
    es_slug = f"{slugify(f.get('origen') or '')}-{slugify(f.get('destino') or '')}"
    if not os.path.isdir(os.path.join('vuelos', es_slug)):
        return ''
    ls_ = G.lib_slug(f) or slugify(f.get('destino') or '')
    en_slug = slugify(en_names.city_en(f.get('origen') or '')) + '-' + G.en_dest_slug(ls_ if os.path.isdir(os.path.join('vuelos', f"{slugify(f.get('origen') or '')}-{ls_}")) else slugify(f.get('destino') or ''))
    return f'<a class="hlc-btn o" href="/en/flights/{en_slug}/">📅 This route month by month</a>' if os.path.isdir(os.path.join('en/flights', en_slug)) else ''


def card(x):
    f = x['facts']
    cs = G.cont_of(f)[0]
    o, d = names(x)
    img = G.photo_url(x)
    bg = 'background:linear-gradient(135deg,#FF5A36,#2E6BF0)'
    ph = f'<img class="dc-ph" src="{e(img)}" alt="{e(d)}{(", " + e(country(f, "destino"))) if country(f, "destino") else ""}" loading="lazy" decoding="async" width="800" height="533">' if img else ''
    cn, ce = CONT.get(cs, ('', ''))
    oc = slugify(country(f, 'origen'))
    q = slugify(' '.join([o, d, f.get('origen', ''), f.get('destino', ''), country(f, 'origen'), country(f, 'destino')]))
    return (f'<a class="dc" href="/en/deals/{e(G.en_deal_slug(x))}/" data-slug="{e(x["slug"])}" data-oc="{e(oc)}" data-occ="{e(f.get("origen_cc", ""))}" data-orig="{e(f.get("origen", ""))}" data-cont="{e(cs)}" '
            f'data-price="{e(x.get("price"))}" data-ida="{e(f.get("ida", ""))}" data-dir="{1 if f.get("escalas") == 0 else 0}" data-tipo="{"rt" if f.get("vuelta") else "ow"}" data-clase="{e(G.clase_of(f))}" data-n="{G.nights_of(f)}" data-ts="{e(G.ago_iso(G.checked(x)))}" aria-label="{e(o)} to {e(d)}, {e(x.get("price"))} euros{(", was " + e(f.get("precio_normal")) + " euros") if f.get("precio_normal") else ""}, {e(dates_en(f))}" data-q="{e(q)}">'
            f'<div class="dc-img" style="{bg}">{ph}{f"<span class=dc-save>−{f.get('ahorro_pct')} % · {level_en(f.get('ahorro_pct'))}</span>" if f.get("ahorro_pct") else ""}<span class="dc-ok" data-ok-ts>✓ Verified {e(date_en(G.checked(x)))}</span><span class="dc-fav" role="button" tabindex="0" aria-label="Save to favourites" data-fav="{e(x["slug"])}">♡</span>'
            f'<span class="dc-city">{e(d)}</span>{f"<span class=dc-cont>{ce} {e(cn.replace("the ", "").title() if cn.startswith("the ") else cn)}</span>" if cs else ""}</div>'
            f'<div class="dc-b"><div><div class="dc-r"><span class="dc-flag" title="{e(country(f, "origen"))}">{flag(f.get("origen_cc"))}</span> {e(o)} → {e(d)} <span class="dc-flag">{flag(f.get("destino_cc"))}</span></div>'
            f'<div class="dc-m">{trip(f)} · {e(stops_en(f))}{(" · " + e(f.get("aerolinea"))) if f.get("aerolinea") else ""} · {e(dates_en(f))}</div></div><div class="dc-p">{f'<s>€{e(f.get("precio_normal"))}</s>' if f.get('precio_normal') else ''}€{e(x.get("price"))}{f'<small class="dc-loc">{e(G.local(x.get("price"), f.get("origen_cc"), True))}</small>' if G.local(x.get("price"), f.get("origen_cc"), True) else ''}</div></div></a>')


def filters(deals):
    occ, conts = {}, {}
    for x in deals:
        f = x['facts']
        k = slugify(country(f, 'origen'))
        if k:
            occ.setdefault(k, [country(f, 'origen'), f.get('origen_cc'), 0])[2] += 1
        cs = G.cont_of(f)[0]
        if cs:
            conts[cs] = conts.get(cs, 0) + 1
    opts = ''.join(f'<option value="{k}">{flag(v[1])} {e(v[0])} ({v[2]})</option>' for k, v in sorted(occ.items(), key=lambda kv: -kv[1][2]))
    chips = ''.join(f'<button type="button" class="chip" data-cont="{k}" aria-pressed="false">{CONT[k][1]} {e(CONT[k][0].replace("the ", "").replace(" & Central America", ""))} <small>{n}</small></button>' for k, n in sorted(conts.items(), key=lambda kv: -kv[1]) if k in CONT)
    ac = {}
    for x in deals:
        o_ = x['facts'].get('origen')
        if o_:
            ac[o_] = ac.get(o_, 0) + 1
    import en_names
    aopts = ''.join(f'<option value="{slugify(k)}">{e(en_names.city_en(k))} ({v})</option>' for k, v in sorted(ac.items(), key=lambda kv: (-kv[1], kv[0])))
    months = sorted({(x['facts'].get('ida') or '')[:7] for x in deals if x['facts'].get('ida')})
    mopts = ''.join(f'<option value="{m}">{MONTHS[int(m[5:7]) - 1]} {m[:4]}</option>' for m in months)
    return f'''<div class="xf" data-explorer-filters>
<div class="xf-row">
<label class="xf-search"><span aria-hidden="true">🔎</span><input type="search" data-x="q" placeholder="Search a destination, city or country" aria-label="Search deals"></label>
<label class="xf-sel"><span>Flying from</span><select data-x="desde" aria-label="Departure country"><option value="">All countries</option>{opts}</select></label>
<label class="xf-sel"><span>Airport</span><select data-x="aero" aria-label="Departure airport"><option value="">All</option>{aopts}</select></label>
<label class="xf-sel"><span>Destination type</span><select data-x="clase" aria-label="Destination type"><option value="">All</option><option value="playa">Beach</option><option value="ciudad">City</option><option value="naturaleza">Nature</option></select></label>
<label class="xf-sel"><span>Trip length</span><select data-x="dur" aria-label="Trip length"><option value="">Any</option><option value="finde">Short break (1-4 nights)</option><option value="semana">A week (5-9)</option><option value="largo">10+ nights</option></select></label>
<label class="xf-sel"><span>Month</span><select data-x="mes" aria-label="Departure month"><option value="">Any date</option>{mopts}</select></label>
<label class="xf-sel"><span>Sort by</span><select data-x="orden" aria-label="Sort"><option value="nuevo">Best for you</option><option value="precio">Cheapest</option><option value="fecha">Soonest departure</option></select></label>
</div>
<div class="xf-row chips" role="group" aria-label="Destination continent"><button type="button" class="chip" data-cont="" aria-pressed="true">🌐 Whole world</button>{chips}</div>
<div class="xf-row xf-more">
<label class="xf-range"><span>Max price: <b data-x-out="max">no limit</b></span><input type="range" min="20" max="1500" step="10" value="1500" data-x="max" aria-label="Maximum price"></label>
<label class="xf-tg"><input type="checkbox" data-x="dir"> Nonstop only</label>
<label class="xf-tg"><input type="checkbox" data-x="rt"> Return only</label>
<label class="xf-tg"><input type="checkbox" data-x="fav"> ♥ My favourites</label>
<button type="button" class="hlc-btn o xf-clear" data-x-clear>Clear filters</button><button type="button" class="hlc-btn o" data-x-random>🎲 Surprise me</button>
</div>
<div class="xf-count" aria-live="polite"><b data-x-count>{len(deals)}</b> deals <button type="button" class="xf-tog" data-x-toggle aria-expanded="false">⚙️ More filters</button></div>
</div>'''


def write(path, html_):
    os.makedirs(path, exist_ok=True)
    open(os.path.join(path, 'index.html'), 'w', encoding='utf-8').write(html_)


def crumbs(items):
    return G.crumbs(items)


def main():
    deals = json.loads(urllib.request.urlopen(urllib.request.Request(API + '&full=1', headers=G.UA), timeout=90).read())
    try:
        dests = json.loads(urllib.request.urlopen(urllib.request.Request(API.replace('action=feed', 'action=dests'), headers=G.UA), timeout=90).read())
    except Exception:
        dests = []
    today = datetime.date.today().isoformat()
    deals = [x for x in deals if x.get('slug') and x.get('price') and x.get('facts') and x.get('en') and (x['facts'].get('ida') or '9999') >= today and G.photo_url(x)]  # nunca sin foto
    deals = [G.norm_deal(x) for x in deals]
    for x in deals:
        x['cta_flight'] = G.BK.fix_flight(x.get('cta_flight'))
    deals = [x for x in deals if G.keep_deal(x)]
    if not G.FX:
        G.load_fx()
    deals.sort(key=lambda x: x.get('approved_at') or '', reverse=True)
    dmap = {g['slug']: g for g in dests if g.get('guide_html_en')}
    hechos = set()
    moved = {}
    origins = {slugify(country(x['facts'], 'origen')) for x in deals}
    nconts = len({G.REAL_CONT.get(x['facts'].get('continente') or '') for x in deals} - {None, ''})

    # ---------- deal pages ----------
    for x in deals:
        f, slug, en = x['facts'], x['slug'], x['en']
        o, d = names(x)
        eslug = G.en_deal_slug(x)
        url = f'{SITE}/en/deals/{eslug}/'
        es_url = f'{SITE}/chollos/{slug}/'
        title = G.clean_title(en.get('title') or f'{o} → {d} from €{x["price"]} {trip(f)}')
        qa = G.deal_faq(x, True)
        seo_t = en.get('seo_title') or f'Flights {o} → {d} for €{x["price"]} ({trip(f)}) · Verified deal'
        desc = en.get('meta_description') or en.get('excerpt') or title
        ls_ = G.lib_slug(f)
        hero = f'/hlc/img/cities/{ls_}.jpg' if ls_ else (f'/chollos/{slug}/foto.jpg' if os.path.exists(f'chollos/{slug}/foto.jpg') else (x.get('image_url') or ''))
        og = f'{SITE}/chollos/{slug}/og.jpg'
        verified = G.checked(x)[:16].replace('T', ' ')
        ck_ = slugify(G.en_names_city(f.get('origen') or '')) if hasattr(G, 'en_names_city') else slugify(__import__('en_names').city_en(f.get('origen') or ''))
        ch, cld = crumbs([('Home', '/en/'), ('Deals', '/en/deals/'), (f'From {o}', f'/en/deals/from/{ck_}/'), (f'{o} → {d}', None)])
        offer = {"@type": "Offer", "name": title, "url": url, "price": x.get('price'), "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "validThrough": f.get('ida'),
                 "category": "Flight", "itemOffered": {"@type": "Flight", "name": f"{o} → {d}", "departureAirport": {"@type": "Airport", "iataCode": f.get('origen_iata'), "name": o},
                                                       "arrivalAirport": {"@type": "Airport", "iataCode": f.get('destino_iata'), "name": d}, "departureTime": f.get('ida')}}
        art = {"@type": "Article", "headline": title[:110], "description": desc, "image": og, "datePublished": x.get('approved_at'), "dateModified": G.checked(x) or x.get('approved_at'), "inLanguage": "en",
               "author": {"@type": "Organization", "@id": SITE + '/#org', "name": "Happy Low Cost", "url": SITE + '/en/'}, "publisher": {"@type": "Organization", "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        rel = G.related(x, deals)
        guide = f'<a class="hlc-btn o" href="/en/destinations/{G.en_dest_slug(ls_)}/">📖 Full {e(NAMES.get(ls_, d))} travel guide</a>' if ls_ and ls_ in dmap else ''
        fl, ht = to_en_link(x.get('cta_flight')), G.BK.with_dates(hotels(d), f.get('ida'), f.get('vuelta'))
        share = quote(f'{title} {url}')
        page = head(seo_t, desc, url, es_url, og, 'article', [art, cld, offer, G.faq_ld(qa, 'en')], body_class='deal')
        page += f'''<main data-deal-slug="{e(slug)}" data-deal-ida="{e(f.get('ida', ''))}" data-deal-pub="{e((x.get('approved_at') or '')[:19])}Z">
<section class="deal-hero" style="{f'background-image:url({hero})' if hero else ''}"{G.photos_attr(ls_) if ls_ else ''}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">✓ Price {"re-checked" if (x.get("facts") or {}).get("checked_at") else "verified"} <span data-rel="{e(G.checked(x)[:19])}Z">on {e(date_en(verified))} at {e(verified[11:16])} (UTC)</span> <span class="k-n">· <a href="/en/how-we-verify/" style="color:#FFC531;text-decoration:underline">how we check</a></span></div>
<h1>{e(title)}</h1>
<div class="deal-cta"><a class="price-tag" href="{e(fl)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_precio_en">€{e(x.get('price'))} <small>{trip(f)}</small></a>{f'<span class="price-was">Usual price <s>€{e(f.get("precio_normal"))}</s> · you save {e(f.get("ahorro_pct"))}%</span>' if f.get('precio_normal') else ''}{f'<span class="price-was">{e(G.local(x.get("price"), f.get("origen_cc"), True))} at today’s rate</span>' if G.local(x.get("price"), f.get("origen_cc"), True) else ''}<a class="hlc-btn" href="{e(fl)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo_en" style="min-height:56px;font-size:17px">See flight & dates ✈️</a><span class="dc-fav big" role="button" tabindex="0" aria-label="Save to favourites" data-fav="{e(slug)}">♡</span></div>
<div class="deal-days" data-days></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt"><p class="deal-quick"><strong>In short:</strong> {e(o)} to {e(d)} for €{e(x.get('price'))} {trip(f)}{(' with ' + e(f.get('aerolinea'))) if f.get('aerolinea') else ''}{', nonstop' if f.get('escalas') == 0 else ''}, {e(dates_en(f))}.{(' The usual price is about €' + e(f.get('precio_normal')) + ' (you save ' + e(f.get('ahorro_pct')) + '%).') if f.get('precio_normal') else ''} Price checked on {e(date_en(verified))}.</p><div class="howbook"><b>How to book it in 3 steps</b><ol><li>Tap “See flight & dates”: the search opens with these dates.</li><li>If the price has changed, try a day earlier or later; similar dates are usually there.</li><li>Before paying, check which baggage the fare includes.</li></ol></div>{G.bag_box(f, True)}{en.get('body_html') or ''}
{f'<p>{guide}</p>' if guide else ''}
{G.faq_html(qa, True)}</article>
<aside class="deal-card">
<div class="facts">
<div><small>From</small><b>{flag(f.get('origen_cc'))} {e(o)}</b></div><div><small>To</small><b>{flag(f.get('destino_cc'))} {e(d)}</b></div>
<div><small>Depart</small><b>{e(G.dia_sem(f.get('ida', ''), True) + date_en(f.get('ida', '')))}</b></div><div><small>Return</small><b>{e((G.dia_sem(f.get('vuelta'), True) + date_en(f.get('vuelta'))) if f.get('vuelta') else '—')}{e(G.noches(f, True))}</b></div>
<div><small>Airline</small><b>{e(f.get('aerolinea') or 'Various')}</b></div><div><small>Stops</small><b>{'Nonstop' if f.get('escalas') == 0 else e(f.get('escalas'))}</b></div>
</div>
<a class="hlc-btn" href="{e(fl)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo_en" style="min-height:56px;font-size:17px">See flight from €{e(x.get('price'))}</a>
<a class="hlc-btn t" href="{e(ht)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_hotel_en" data-tvcity="{e(d)}">🏨 Hotels in {e(d)} for these dates</a>
<a class="hlc-btn g" href="{e(G.BK.gyg(d, 'en', f.get('ida'), f.get('vuelta'), 'happylowcost-en'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_gyg_en">🎟️ Things to do in {e(d)}: tours and tickets</a>
<a class="hlc-btn o" href="{e(G.BK.gyg_transfer(d, 'en', f.get('ida')))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_traslado_en">🚕 Airport transfer in {e(d)}</a>
<a class="hlc-btn o" href="{e(G.BK.dc('en', 'happylowcost-en'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_coche_en">🚗 Car hire in {e(d)}</a>
{guide}
{route_cal_en(f)}<a class="hlc-btn o" href="/en/tools/baggage/">🧳 Does your bag fly free?</a>
{G.alt_box(f, True)}
<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">Price re-checked every day. Cheap fares go fast: if it has changed, try nearby dates.</div>
<div class="rep"><button type="button" class="hlc-btn o" data-hlc-report="{e(slug)}">⚠️ Price gone? Tell us</button><small data-report-msg role="status" aria-live="polite"></small></div>
<div class="share"><button class="hlc-btn o" type="button" data-share data-title="{e(title)}" data-url="{url}">📤 Share</button><a class="hlc-btn o" href="https://wa.me/?text={share}" target="_blank" rel="noopener">WhatsApp</a><a class="hlc-btn o" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}" target="_blank" rel="noopener">Facebook</a><button class="hlc-btn o" type="button" data-copy="{url}">Copy link</button></div>
</aside>
</div>
{T3.block(d, *G.dest_ll(f), lang='en', checkin=f.get('ida'), checkout=f.get('vuelta'))}
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">You might also like</div><h2>Similar deals</h2></div><a class="hlc-btn o" href="/en/deals/">See all</a></div><div class="dc-grid">{''.join(card(y) for y in rel)}</div></section>
</div></main>{FOOTER}</body></html>'''
        write(f'en/deals/{eslug}', page)
        hechos.add(eslug)
        if eslug != slug:
            moved[f'/en/deals/{slug}/'] = f'/en/deals/{eslug}/'

    # ---------- explorer /en/deals/ and home /en/ ----------
    cheapest = min((x['price'] for x in deals), default=None)
    intro = (f"{len(deals)} flight deal{'s' if len(deals) != 1 else ''} live right now, departing from {len(origins)} countr{'ies' if len(origins) != 1 else 'y'} to {nconts} continent{'s' if nconts != 1 else ''}. "
             "We check every price on Kiwi.com before publishing it and again every day; if it rises more than 10%, we pull it.")
    grid = ''.join(card(x) for x in deals) or '<div class="dc-empty"><b>No deals right now.</b><span>Fares move fast: check back in a few hours.</span></div>'
    empty = '<div class="dc-empty" data-x-empty hidden><b>No deals match those filters.</b><span>Try removing a filter.</span></div>'
    items = [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/en/deals/{G.en_deal_slug(x)}/", "name": x['en'].get('title', '')} for i, x in enumerate(deals[:50])]
    ldl = [{"@type": "CollectionPage", "name": "Today's flight deals", "url": f"{SITE}/en/deals/", "inLanguage": "en", "description": intro, "mainEntity": {"@type": "ItemList", "numberOfItems": len(deals), "itemListElement": items}}]
    ch, cld = crumbs([('Home', '/en/'), ('Deals', None)])
    page = head(f"Today's flight deals ({datetime.date.today().strftime('%-d %B')}), verified · Happy Low Cost", G.smart_desc(intro), f'{SITE}/en/deals/', f'{SITE}/chollos/', ld=ldl + [cld], body_class='chollos')
    page += f'''<main class="sec" style="padding-top:26px"><div class="wrap">
{ch}
<div class="sec-h"><div><div class="kicker">Freshly hunted · verified</div><h1 class="x-h1">Today's flight deals</h1><p>{e(intro)}</p></div></div>
{filters(deals)}
<div class="dc-grid" data-explorer-grid>{grid}</div>{empty}
</div></main><script src="/hlc/explorer.js?v=6" defer></script>{FOOTER}</body></html>'''
    write('en/deals', page)

    # ---------- landings by departure city (EN) ----------
    import en_names
    bycity = {}
    for x in deals:
        c_ = x['facts'].get('origen') or ''
        if c_:
            bycity.setdefault(slugify(en_names.city_en(c_)), [en_names.city_en(c_), x['facts'].get('origen_cc'), []])[2].append(x)
    city_links = []
    for ck, (cn, cc, sub) in sorted(bycity.items()):
        cheapest = min((x['price'] for x in sub), default=None)
        tops = ', '.join(dict.fromkeys(names(x)[1] for x in sub))
        intro_ = f"{len(sub)} flight deals from {cn}" + (f", from €{cheapest}" if cheapest else "") + f": {tops[:150]}. Every price is checked before publishing and again every day."
        ch_, cld_ = crumbs([('Home', '/en/'), ('Deals', '/en/deals/'), (f'From {cn}', None)])
        pg = head(f'Cheap flights from {cn}: today’s deals · Happy Low Cost', G.smart_desc(intro_), f'{SITE}/en/deals/from/{ck}/', None, ld=[cld_], body_class='chollos')
        pg += f'''<main class="sec" style="padding-top:26px"><div class="wrap">
{ch_}
<div class="sec-h"><div><div class="kicker">{flag(cc)} Departures from {e(cn)}</div><h1 class="x-h1">Flight deals from {e(cn)}</h1><p>{e(intro_)}</p></div></div>
<div class="dc-grid">{''.join(card(x) for x in sub)}</div>
</div></main>{FOOTER}</body></html>'''
        write(f'en/deals/from/{ck}', pg)
        city_links.append((ck, cn, len(sub)))
    # Una pagina de ciudad que se borra el dia que no sale ningun chollo desde
    # alli es un 404 para Google: 42 de estas paginas sumaron 2.323 impresiones
    # en 28 dias y las 42 respondian 404. Ahora la pagina se queda, dice que hoy
    # no hay nada y ofrece la ruta, la lista completa y la alerta. Como en
    # espanol, que nunca borro estas paginas: solo las saca del indice.
    if os.path.isdir('en/deals/from'):
        kept_empty = 0
        for d_ in sorted(os.listdir('en/deals/from')):
            p_ = os.path.join('en/deals/from', d_, 'index.html')
            if d_ in bycity or not os.path.isfile(p_):
                continue
            old_ = open(p_, encoding='utf-8').read()
            if 'data-empty' in old_:
                continue
            m_ = re.search(r'<h1[^>]*>(.*?)</h1>', old_, re.S)
            cn_ = re.sub(r'<[^>]+>', '', m_.group(1)).strip() if m_ else d_.replace('-', ' ').title()
            cn_ = re.sub(r'^Flight deals from\s*', '', cn_) or d_.replace('-', ' ').title()
            fl_ = (f'<a class="hlc-btn" href="/en/flights/from/{d_}/">Cheapest routes from {e(cn_)}</a>'
                   if os.path.isdir(os.path.join('en/flights/from', d_)) else '')
            pg_ = head(f'Flight deals from {cn_}: nothing right now - Happy Low Cost',
                       f'No verified deal leaving from {cn_} today. See the cheapest routes from {cn_}, '
                       f"today's deals from everywhere, or let us tell you the moment one appears.",
                       f'{SITE}/en/deals/from/{d_}/', None, robots='noindex, follow', body_class='chollos')
            pg_ += (f'<main class="sec" data-empty style="padding-top:30px"><div class="wrap" style="max-width:760px">'
                    f'<div class="kicker">Departures from {e(cn_)}</div>'
                    f'<h1 class="x-h1">Nothing from {e(cn_)} today</h1>'
                    f'<p style="font-size:18px">We re-check every price each day and nothing leaving from '
                    f'{e(cn_)} clears our bar right now. New ones turn up most days.</p>'
                    f'<div style="display:flex;gap:10px;flex-wrap:wrap">{fl_}'
                    f'<a class="hlc-btn{" o" if fl_ else ""}" href="/en/deals/">Today\'s deals</a>'
                    f'<a class="hlc-btn o" href="/en/flights/">All flight routes</a>'
                    f'<a class="hlc-btn o" href="/en/alerts/">Tell me when there is one</a></div>'
                    f'</div></main>{FOOTER}</body></html>')
            open(p_, 'w', encoding='utf-8').write(pg_)
            for fn_ in ('og.jpg', 'foto.jpg'):
                q_ = os.path.join('en/deals/from', d_, fn_)
                if os.path.exists(q_):
                    os.remove(q_)
            kept_empty += 1
        print('en-from-empty', kept_empty)

    # ---------- chollos ingleses retirados: pagina de "caducado", no un 404 ----------
    # En espanol esto ya se hacia (gen_deals.py). En ingles la pagina
    # desaparecia y Google se quedaba con 131 URLs muertas.
    live_en = {G.en_deal_slug(x) for x in deals}
    gone_en = 0
    if os.path.isdir('en/deals'):
        for d_ in sorted(os.listdir('en/deals')):
            p_ = os.path.join('en/deals', d_, 'index.html')
            if d_ in ('from', 'ideas', 'to') or d_ in live_en or not os.path.isfile(p_):
                continue
            old_ = open(p_, encoding='utf-8').read()
            if 'data-expired' in old_ or 'data-empty' in old_:
                continue
            m_ = re.search(r'<h1[^>]*>(.*?)</h1>', old_, re.S)
            t_ = re.sub(r'<[^>]+>', '', m_.group(1)).strip() if m_ else 'This deal'
            mt_ = re.match(r'(.+?)-\d+-eur-', d_)
            rt_ = mt_.group(1) if mt_ else ''
            rl_ = (f'<a class="hlc-btn" href="/en/flights/{rt_}/">Today\'s price on this route</a>'
                   if rt_ and os.path.isdir(os.path.join('en/flights', rt_)) else '')
            pg_ = head(f'{t_} - expired - Happy Low Cost',
                       'This deal is gone. See the flight deals we verified today.',
                       f'{SITE}/en/deals/{d_}/', None, robots='noindex, follow', body_class='deal')
            pg_ += (f'<main class="sec" data-expired style="padding-top:30px"><div class="wrap" style="max-width:760px">'
                    f'<div class="kicker">Expired deal</div><h1 class="x-h1">{e(t_)}</h1>'
                    f'<p style="font-size:18px">This price is no longer there: either the date has passed or it '
                    f'went up when we checked it again. Deals fly, and new ones land every day.</p>'
                    f'<div style="display:flex;gap:10px;flex-wrap:wrap">{rl_}'
                    f'<a class="hlc-btn{" o" if rl_ else ""}" href="/en/deals/">Today\'s deals</a>'
                    f'<a class="hlc-btn o" href="/en/alerts/">Get an alert</a></div>'
                    f'</div></main>{FOOTER}</body></html>')
            open(p_, 'w', encoding='utf-8').write(pg_)
            for fn_ in ('og.jpg', 'foto.jpg', 'credito.txt'):
                q_ = os.path.join('en/deals', d_, fn_)
                if os.path.exists(q_):
                    os.remove(q_)
            gone_en += 1
    print('en-expired', gone_en)

    # ---------- ideas (EN) ----------
    def nights(f_):
        try:
            return (datetime.date.fromisoformat(f_['vuelta'][:10]) - datetime.date.fromisoformat(f_['ida'][:10])).days
        except Exception:
            return 99
    IDEAS_EN = [
        ('weekend-getaways', 'Weekend getaways', 'Trips of 2 to 4 nights leaving on a Thursday, Friday or Saturday.', lambda f_: f_.get('vuelta') and 2 <= nights(f_) <= 4 and datetime.date.fromisoformat(f_['ida'][:10]).weekday() in (3, 4, 5)),
        ('under-50', 'Flights under €50', 'Return deals for €50 or less.', lambda f_: (f_.get('precio') or 999) <= 50),
        ('under-100', 'Flights under €100', 'Return deals for €100 or less.', lambda f_: (f_.get('precio') or 999) <= 100),
        ('long-haul', 'Long-haul under €600', 'Deals to another continent for €600 or less, return.', lambda f_: (f_.get('precio') or 9999) <= 600 and f_.get('continente') and G.REAL_CONT.get(f_.get('continente')) != G.REAL_CONT.get(f_.get('origen_continente') or '', f_.get('origen_continente'))),
        ('nonstop', 'Nonstop flight deals', 'Only flights with no stops.', lambda f_: f_.get('escalas') == 0),
        ('christmas-2026', 'Christmas and New Year 2026', 'Deals departing between 18 December 2026 and 6 January 2027.', lambda f_: '2026-12-18' <= (f_.get('ida') or '')[:10] <= '2027-01-06'),
    ]
    ideas_en = []
    for k_, h1_, desc_, fn_ in IDEAS_EN:
        sub = [x for x in deals if fn_(x['facts'])]
        cheapest = min((x['price'] for x in sub), default=None)
        intro_ = (f"{desc_} {len(sub)} deals right now" + (f", from €{cheapest}." if cheapest else ".") + " Prices re-checked every day.") if sub else f"{desc_} None right now: new fares land every hour."
        ch_, cld_ = crumbs([('Home', '/en/'), ('Deals', '/en/deals/'), (h1_, None)])
        es_k = {v: k for k, v in G.IDEAS_EN.items()}.get(k_)
        pg = head(f'{h1_}: cheap flight deals · Happy Low Cost', G.smart_desc(intro_), f'{SITE}/en/deals/ideas/{k_}/', (f'{SITE}/chollos/ideas/{es_k}/' if es_k and os.path.isdir(f'chollos/ideas/{es_k}') else None), ld=[cld_], body_class='chollos',
                  robots=G.ROBOTS_IDX if sub else 'noindex, follow')
        pg += f'''<main class="sec" style="padding-top:26px"><div class="wrap">
{ch_}
<div class="sec-h"><div><div class="kicker">Ideas for cheap travel</div><h1 class="x-h1">{e(h1_)}</h1><p>{e(intro_)}</p></div></div>
<div class="dc-grid">{''.join(card(x) for x in sub) or '<div class="dc-empty"><b>No deals here right now.</b><span>Check all of today’s deals.</span><a class="hlc-btn" href="/en/deals/">Today’s deals</a></div>'}</div>
</div></main>{FOOTER}</body></html>'''
        write(f'en/deals/ideas/{k_}', pg)
        ideas_en.append((k_, h1_, len(sub)))
    json.dump(ideas_en, open('en/ideas.json', 'w'), ensure_ascii=False)

    hero_imgs = [p for p in ('bali', 'tokio', 'nueva-york', 'santorini', 'maldivas', 'lisboa')]
    guides_hub = ''.join(f'<a class="hub-l" href="/en/destinations/{G.en_dest_slug(s_)}/">{e(NAMES.get(s_, g["name"]))}</a>' for s_, g in dmap.items())
    org = {"@type": "Organization", "@id": f"{SITE}/#org", "name": "Happy Low Cost", "url": f"{SITE}/en/", "logo": f"{SITE}/hlc/brand/icon-512.png", "foundingDate": "2012",
           "sameAs": ["https://www.facebook.com/happylowcostofficialpage/", "https://www.instagram.com/happylowcost/", "https://x.com/happylowcost"],
           "contactPoint": {"@type": "ContactPoint", "contactType": "customer support", "url": "https://www.happylowcost.com/contacto/", "availableLanguage": ["es", "en"]}, "publishingPrinciples": f"{SITE}/en/how-we-verify/"}
    web = {"@type": "WebSite", "url": f"{SITE}/en/", "name": "Happy Low Cost", "inLanguage": "en", "publisher": {"@id": f"{SITE}/#org"},
           "potentialAction": {"@type": "SearchAction", "target": {"@type": "EntryPoint", "urlTemplate": f"{SITE}/en/search/?q={{search_term_string}}"}, "query-input": "required name=search_term_string"}}
    page = head('Happy Low Cost · We hunt the cheapest flights in the world', f"Verified cheap flight deals from every continent{f', from €{cheapest}' if cheapest else ''}. Error fares and flash sales, checked before we publish them.",
                f'{SITE}/en/', f'{SITE}/', ld=[org, web, ldl[0]], body_class='home home2')
    PAST_EN = [('nueva-york', 'Madrid → New York', '€97', 'return · published 2020 · flights May 2021', '/vuelos-a-nueva-york-por-solo-97e-ida-y-vuelta-desde-madrid-en-mayo-2021/'),
               ('maldivas', 'Spain → Maldives', '€307', 'return · 2022', '/mas-barato-que-nunca-vuelos-a-islas-maldivas-por-solo-307e-i-v/'),
               ('reikiavik', 'Spain → Iceland', '€136', 'return · nonstop · 2022', '/vuelos-directos-a-islandia-desde-solo-136e-i-v/'),
               ('tokio', 'Spain → Tokyo', '€387', 'return · 2020', '/ganga-vuelos-a-tokio-desde-solo-387e-i-v-en-septiembre/'),
               ('miami', 'Spain → Miami', '€167', 'return · 2020', '/vuelos-a-miami-por-solo-167e-ida-y-vuelta/'),
               ('santorini', 'Spain → Santorini', '€97', 'return · nonstop · 2023', '/vuelos-directos-a-santorini-en-julio-por-solo-97e-i-v/'),
               ('bali', 'Spain → Bali', '€420', 'return · 2020', '/chollo-vuelos-baratos-a-bali-desde-solo-420e-i-v/'),
               ('san-francisco', 'Spain → San Francisco', '€317', 'return · nonstop · 2021', '/chollo-vuelos-directos-a-san-francisco-por-317e-i-v/'),
               ('ciudad-del-cabo', 'Spain → South Africa', '€311', 'return · 2022', '/chollo-vuelos-a-sudafrica-por-solo-311e-i-v/'),
               ('punta-cana', 'Spain → Punta Cana', '€351', 'return · 2021', '/wow-viajamos-a-punta-cana-vuelos-por-350e-i-v/'),
               ('bangkok', 'Spain → Thailand', '€350', 'return · 2021', '/vuelos-a-tailandia-por-solo-350e-i-v/'),
               ('ciudad-de-mexico', 'Spain → Mexico', '€370', 'return · nonstop · 2020', '/viva-mexico-vuelos-directos-por-solo-370e-i-v-en-octubre/')]
    past_html = ''.join(f'<a class="pw" href="{u}"><span class="pw-ph" style="background-image:url(/hlc/img/cities/{sl}-800.jpg)"></span><span class="pw-b"><b>{r}</b><em>{pr}</em><small>{dd}</small></span></a>' for sl, r, pr, dd, u in PAST_EN)
    AIR = ('<optgroup label="Europe">' + ''.join(f'<option>{c}</option>' for c in ['London', 'Dublin', 'Paris', 'Amsterdam', 'Berlin', 'Rome', 'Lisbon', 'Copenhagen', 'Madrid', 'Barcelona', 'Málaga']) +
           '</optgroup><optgroup label="Americas">' + ''.join(f'<option>{c}</option>' for c in ['New York', 'Miami', 'Los Angeles', 'Toronto', 'Vancouver', 'Mexico City', 'Bogotá', 'Buenos Aires']) +
           '</optgroup><optgroup label="Asia &amp; Oceania">' + ''.join(f'<option>{c}</option>' for c in ['Singapore', 'Dubai', 'Hong Kong', 'Seoul', 'Tokyo', 'Bangkok', 'Sydney']) + '</optgroup>')
    def qform():
        return (f'<form class="qf" data-hlc-quick novalidate><div class="qf-row"><label class="qf-sel"><span>Flying from</span><select name="origin" aria-label="Your airport">{AIR}</select></label>'
                '<label class="qf-in"><span>Alert me at</span><input name="contact" type="email" inputmode="email" autocomplete="email" placeholder="your email" aria-label="Your email" required></label>'
                '<button type="submit" class="hlc-btn qf-go">Alert me free</button></div>'
                '<label class="qf-ok"><input type="checkbox" name="consent" required> I agree to receive deal alerts from Happy Low Cost (max one a day) and the <a href="/en/legal/">privacy policy</a>.</label>'
                '<div class="qf-msg" data-msg role="status" aria-live="polite"></div></form>')
    def phone_deal(x, cls='h2-deal'):
        if not x:
            return ''
        f = x['facts']; o, dn = names(x)
        was = f'<s>€{e(f.get("precio_normal"))}</s> ' if f.get('precio_normal') else ''
        sv = f' <i>−{e(f.get("ahorro_pct"))} %</i>' if f.get('ahorro_pct') else ''
        return (f'<div class="{cls}"><a href="/en/deals/{e(G.en_deal_slug(x))}/"><span class="h2-ph" style="background-image:url({e(G.photo_url(x))})"></span>'
                f'<span class="h2-t"><b>✈️ {e(o)} → {e(dn)}</b><span>{was}<em>€{e(x.get("price"))}</em>{sv}</span><small>{trip(f)}{" · nonstop" if f.get("escalas") == 0 else ""}</small></span></a></div>')
    pool = [x for x in deals if x['facts'].get('precio_normal')] or deals
    top6 = deals[:6]
    page += f'''<main>
<section class="h2-hero"><div class="wrap h2-grid">
<div>
<div class="h2-proof"><b>420,000+ travellers</b> have followed us since 2012</div>
<h1>Flights at <em>half price</em>, straight to your phone.</h1>
<p class="h2-lead">We watch airlines all over the world, check every price, and alert you when a deal leaves from your airport. Free.</p>
{qform()}
</div>
<div class="h2-phone" aria-hidden="true"><div class="h2-screen"><div class="h2-notif"><b>Happy Low Cost</b><span>now</span></div>{phone_deal(pool[0] if pool else None)}{phone_deal(pool[1] if len(pool) > 1 else None, 'h2-deal h2-deal2')}</div></div>
</div></section>

<section class="sec h2-sec" id="today"><div class="wrap">
<div class="h2-h"><h2>This is what today's deals look like</h2><p>The usual price of the route next to the price we hunted. Checked live.</p></div>
<div class="dc-grid h2-deals">{''.join(card(x) for x in top6) or '<div class="dc-empty"><b>No deals right now.</b><span>Fares move fast: check back in a few hours.</span></div>'}</div>
<div class="h2-more"><a class="hlc-btn o" href="/en/deals/">See all {len(deals)} deals and filter</a></div>
<div class="h2-h" style="margin-top:34px"><h2>Ideas for cheap travel</h2></div>
<div class="chips" style="flex-wrap:wrap">{''.join(f'<a class="chip" href="/en/deals/ideas/{k}/">{e(n)}</a>' for k, n, c in ideas_en if c)}<a class="chip" href="/en/tools/">🧰 Tools</a><a class="chip" href="{e(G.BK.dc('en', 'happylowcost-home-en'))}" target="_blank" rel="sponsored nofollow noopener" data-hlc="home_coche_en">🚗 Car hire</a></div>
</div></section>

<section class="sec h2-sec h2-how"><div class="wrap">
<div class="h2-h"><h2>How it works</h2></div>
<ol class="h2-steps">
<li><b>1</b><h3>Tell us your airport</h3><p>And whether you want the alert by email or on your phone.</p></li>
<li><b>2</b><h3>We hunt and verify</h3><p>Error fares and flash sales, checked before we publish them.</p></li>
<li><b>3</b><h3>We alert you, you book</h3><p>With the exact dates. You just pack your bag.</p></li>
</ol>
</div></section>

<section class="sec h2-sec h2-wall"><div class="wrap">
<div class="h2-big"><b>420,000+</b><span>travellers have followed us since 2012</span></div>
<div class="h2-h"><h2>Deals we've already hunted</h2><p>A sample of what we have published over the years. These have expired, but we find new deals every day.</p></div>
<div class="pw-grid">{past_html}</div>
<div class="h2-cta2"><h3>Don't miss the next one.</h3>{qform()}</div>
</div></section>
{f'<section class="sec" style="padding-top:0"><div class="wrap"><section class="hub"><h2>Destination guides</h2><div class="hub-g">{guides_hub}</div></section></div></section>' if guides_hub else ''}
</main>{FOOTER}</body></html>'''
    write('en', page)

    # ---------- destination guides ----------
    dl = []
    for p in G.DLIB:
        g = dmap.get(p['s'])
        if not g:
            continue
        n = NAMES.get(p['s'], p['n'])
        url = f"{SITE}/en/destinations/{G.en_dest_slug(p['s'])}/"
        gh = re.sub(r'<(?!/?(h2|h3|p|ul|li|strong)\b)[^>]*>', '', g['guide_html_en'])
        gh = re.sub(r'<(h2|h3|p|ul|li|strong)\b[^>]*>', r'<\1>', gh)
        sub = [x for x in deals if G.lib_slug(x['facts']) == p['s']]
        nd_ = G.guide_days(g.get('seo_title_en') or '', gh)
        xq = G.guide_extra_faq(gh, n, nd_, sub, 'en')
        if xq:
            add = ''.join(f'<h3>{e(q)}</h3><p>{e(a)}</p>' for q, a in xq)
            mfaq = re.search(r'(<h2>[^<]*(?:Preguntas frecuentes|FAQ)[^<]*</h2>.*?)(?=<h2|$)', gh, re.S | re.I)
            gh = (gh[:mfaq.end()] + add + gh[mfaq.end():]) if mfaq else gh + '<h2>FAQs</h2>' + add
        gh, faq_ld, _w = G.guide_extras(gh, 'en')
        upd_en = g.get('updated_en') or g.get('updated_at')
        summ = G.guide_summary(gh, n, nd_, sub, upd_en, 'en', deal_href=lambda x_: f'/en/deals/{G.en_deal_slug(x_)}/' if G.en_deal_slug(x_) in hechos else '/en/deals/')
        img_ld = G.guide_image_ld(p['s'], n, 'en')
        hub_en = f"/en/flights/to/{G.en_dest_slug(p['s'])}/" if os.path.isfile(f"en/flights/to/{G.en_dest_slug(p['s'])}/index.html") else ''
        ch, cld = crumbs([('Home', '/en/'), ('Destinations', '/en/destinations/'), (n, None)])
        dest_ld = {"@type": "TouristDestination", "@id": url + '#dest', "name": n, "url": url, "image": {"@id": img_ld["@id"]},
                   **({"geo": {"@type": "GeoCoordinates", "latitude": p['y'], "longitude": p['x']}} if p.get('y') is not None else {})}
        art = {"@type": "Article", "headline": (g.get('seo_title_en') or f'What to see in {n}')[:110], "description": g.get('meta_description_en') or '', "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg",
               "dateModified": upd_en, "datePublished": g.get('updated_at') or upd_en, "inLanguage": "en", "about": {"@id": url + '#dest'}, "author": {"@id": G.ORG_ID},
               "publisher": {"@id": G.ORG_ID}, "mainEntityOfPage": url, "isAccessibleForFree": True, "speakable": {"@type": "SpeakableSpecification", "cssSelector": [".g-sum", "h1"]}}
        art["image"] = {"@id": img_ld["@id"]}
        es = f"{SITE}/destinos/{p['s']}/" if os.path.exists(f"destinos/{p['s']}/index.html") else None
        # Estas paginas ya estan arriba y no reciben clics: 1.995 paginas del sitio
        # estan en el top 15 y entre todas suman 157 clics (0,84% de CTR). Las
        # consultas que las traen son "tallinn itinerary 3 days" (892 impresiones,
        # posicion 5,7, cero clics) o "zanzibar itinerary 7 days" (201, posicion 1,
        # cero clics), y el titulo decia "travel guide: what to see, eat and do in
        # three days": ni la palabra "itinerary" ni el numero en cifra. Si la guia
        # tiene un itinerario por dias, el titulo lo dice con la cifra.
        nd_ = 0
        for m_ in re.finditer(r'\bday\s*(\d{1,2})\b', gh, re.I):
            nd_ = max(nd_, int(m_.group(1)))
        ttl_ = g.get('seo_title_en') or f'What to see in {n}'
        dsc_ = g.get('meta_description_en') or f'{n} travel guide: what to see, where to stay, what to eat and cheap flights.'
        if 2 <= nd_ <= 21:
            ttl_ = f'{n} itinerary: what to see in {nd_} days ({datetime.date.today().year})'
            if 'itinerar' not in dsc_.lower() and 'day by day' not in dsc_.lower() and not re.search(r'\b\d+[ -]days?\b|\b(three|four|five|seven)[ -]days?\b', dsc_, re.I):
                dsc_ = f'{nd_} days in {n}, day by day: ' + dsc_[:1].lower() + dsc_[1:]
        art["headline"] = ttl_[:110]
        page = head(ttl_ + (' · Happy Low Cost' if len(ttl_) <= 46 else ''), dsc_[:300],
                    url, es, f"{SITE}/hlc/img/cities/{p['s']}.jpg", 'article', [G.ORG_LD, img_ld, dest_ld, art, cld] + ([faq_ld] if faq_ld else []), body_class='destino',
                    extra_head=G.guide_head_extra(p['s'], url + 'index.md', upd_en, 'en', bool(es)), og_alt=f'Photo of {n}')
        cr = G.CR.get(p['s']) or {}
        page += f'''<main>
<section class="deal-hero" style="background-image:url(/hlc/img/cities/{p['s']}.jpg)"{G.photos_attr(p['s'])}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">Travel guide</div>
<h1>{e(ttl_.rsplit(' (', 1)[0] if 2 <= nd_ <= 21 else (g.get('seo_title_en') or 'What to see in ' + n))}</h1>
<div class="deal-cta">{f'<a class="hlc-btn" href="#deals">🔥 {len(sub)} deal{"s" if len(sub) != 1 else ""} to {e(n)}</a>' if sub else ''}<a class="hlc-btn t" href="{hotels(n)}" target="_blank" rel="sponsored nofollow noopener">🏨 Hotels in {e(n)}</a>{f'<a class="hlc-btn o" href="{hub_en}" style="background:#fff">✈️ Cheap flights to {e(n)}</a>' if hub_en else ''}</div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt guide">{summ}{gh}
<p class="credit">Photo: {e(cr.get('author') or 'Wikimedia Commons')} · {e(cr.get('license', ''))} · Wikimedia Commons · Guide updated {e(date_en(g.get('updated_en') or g.get('updated_at') or ''))}</p></article>
<aside class="deal-card" id="deals">
<div class="kicker">Deals to {e(n)}</div>
{''.join(card(x) for x in sub[:3]) or f'<p style="margin:0;color:#4A5468">No deal to {e(n)} today. New fares land every hour.</p>'}
<a class="hlc-btn s" href="/en/alerts/?d={quote(n)}">🔔 Deal alert for {e(n)}</a>
<a class="hlc-btn t" href="{hotels(n)}" target="_blank" rel="sponsored nofollow noopener">🏨 Hotels in {e(n)}</a>
<a class="hlc-btn o" href="/en/deals/">See all deals</a>
</aside></div>
<div id="hotels">{T3.block(n, p.get('y'), p.get('x'), [p['s']] + list(p.get('a') or []), (), lang='en')}</div>
<section class="sec vw" data-hlc-videos data-dest="{p["s"]}" data-hide-empty hidden><div class="sec-h"><div><div class="kicker">Traveller videos</div><h2>{e(n)} on video</h2></div><a class="hlc-btn o" href="/en/videos/">Share yours</a></div><div class="vw-grid"></div></section>
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">More inspiration</div><h2>Other destinations</h2></div></div><div class="hub-g">{''.join(f'<a class="hub-l" href="/en/destinations/{G.en_dest_slug(q["s"])}/">{e(NAMES.get(q["s"], q["n"]))}</a>' for q in G.DLIB if q['s'] in dmap and q['s'] != p['s'] and q['r'] == p['r'])}</div></section>
</div></main>{FOOTER}</body></html>'''
        write(f"en/destinations/{G.en_dest_slug(p['s'])}", page)
        open(f"en/destinations/{G.en_dest_slug(p['s'])}/index.md", 'w', encoding='utf-8').write(G.guide_md(g.get('seo_title_en') or f'What to see in {n}', url, gh, n, nd_, upd_en, 'en',
             f"## Flights and deals\n\n- Flight deals to {n}: {url}#deals\n" + (f"- Flight prices to {n} from several cities: {SITE}{hub_en}\n" if hub_en else '') + f"- Free deal alert: {SITE}/en/alerts/\n"))
        if G.en_dest_slug(p['s']) != p['s']:
            moved[f"/en/destinations/{p['s']}/"] = f"/en/destinations/{G.en_dest_slug(p['s'])}/"
            if os.path.isdir(f"en/destinations/{p['s']}"):
                import shutil
                shutil.rmtree(f"en/destinations/{p['s']}")
        dl.append((p, g))
    # hotels hub
    hl = [(p, g) for p, g in dl if T3.find(p.get('y'), p.get('x'), [p['s']] + list(p.get('a') or []), ())]
    tiles_h = ''.join(f'<a class="dc" href="/en/destinations/{G.en_dest_slug(p["s"])}/#hotels"><div class="dc-img" style="background-image:url(/hlc/img/cities/{p["s"]}-800.jpg)"><span class="dc-city">{e(NAMES.get(p["s"], p["n"]))}</span></div><div class="dc-b"><div><div class="dc-r">3 hotels in {e(NAMES.get(p["s"], p["n"]))}</div><div class="dc-m">Budget · best value · luxury</div></div></div></a>' for p, g in hl)
    pg = head('Where to stay: the 3 best hotels in every destination · Happy Low Cost', f'A budget hotel, a best-value one and a luxury one in {len(hl)} destinations, picked by real guest scores.', f'{SITE}/en/hotels/', f'{SITE}/hoteles/', body_class='chollos')
    pg += f'<main class="sec" style="padding-top:26px"><div class="wrap"><div class="sec-h"><div><div class="kicker">Hotels</div><h1 class="x-h1">Where to stay in every destination</h1><p>For each destination, 3 hotels: budget, best value and luxury, picked by top3hotels.com from real guest scores. {len(hl)} destinations.</p></div></div><div class="dc-grid">{tiles_h}</div></div></main>{FOOTER}</body></html>'
    write('en/hotels', pg)
    # index of guides
    ch, cld = crumbs([('Home', '/en/'), ('Destinations', None)])
    tiles = ''.join(f'<a class="dc" href="/en/destinations/{G.en_dest_slug(p["s"])}/"><div class="dc-img" style="background-image:url(/hlc/img/cities/{p["s"]}-800.jpg)"><span class="dc-city">{e(NAMES.get(p["s"], p["n"]))}</span></div></a>' for p, g in dl)
    il = {"@type": "ItemList", "name": "Destination guides", "numberOfItems": len(dl), "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/en/destinations/{G.en_dest_slug(p['s'])}/", "name": NAMES.get(p['s'], p['n'])} for i, (p, g) in enumerate(dl)]}
    page = head(f'Travel itineraries and guides: {len(dl)} destinations ({datetime.date.today().year})', 'Day-by-day itineraries and honest travel guides: what to see, how many days, where to stay, what to eat and the cheapest flights to each place.',
                f'{SITE}/en/destinations/', f'{SITE}/destinos/', ld=[cld, il])
    page += f'''<main class="sec" style="padding-top:26px"><div class="wrap">{ch}
<div class="sec-h"><div><div class="kicker">Travel guides</div><h1 class="x-h1">Destination guides</h1><p>{len(dl)} guides and growing every day. Each one pairs with the live flight deals to that place.</p></div><a class="hlc-btn s" href="/en/deals/">✈️ Today's deals</a></div>
<div class="dc-grid">{tiles or '<div class="dc-empty"><b>Guides are on their way.</b><span>We are writing them right now.</span></div>'}</div>
</div></main>{FOOTER}</body></html>'''
    write('en/destinations', page)

    # ---------- RSS, sitemap, list of English pages ----------
    rss = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Happy Low Cost · Flight deals</title><link>' + SITE + '/en/deals/</link><description>Verified cheap flight deals worldwide</description><language>en</language>' +
           ''.join(f'<item><title>{e(x["en"].get("title"))}</title><link>{SITE}/en/deals/{G.en_deal_slug(x)}/</link><guid>{SITE}/en/deals/{G.en_deal_slug(x)}/</guid><description>{e(x["en"].get("excerpt") or "")}</description></item>' for x in deals[:50]) + '</channel></rss>\n')
    open('en/deals/feed.xml', 'w', encoding='utf-8').write(rss)
    urls = [f'{SITE}/en/', f'{SITE}/en/deals/', f'{SITE}/en/destinations/'] + [f'{SITE}/en/deals/ideas/{k}/' for k, n, c in ideas_en if c] + [f'{SITE}/en/deals/from/{k}/' for k, n, c in city_links] + [f'{SITE}/en/deals/{s}/' for s in sorted(hechos)] + [f"{SITE}/en/destinations/{G.en_dest_slug(p['s'])}/" for p, g in dl]
    # guías con su fecha real y su foto (sitemap de imágenes)
    gextra = {f"{SITE}/en/destinations/{G.en_dest_slug(p['s'])}/": (((g.get('updated_en') or g.get('updated_at') or '')[:10]), p['s']) for p, g in dl}
    def _u(u):
        if u in gextra:
            lm, sl = gextra[u]
            return f'<url><loc>{u}</loc>' + (f'<lastmod>{lm}</lastmod>' if lm else '') + f'<image:image><image:loc>{SITE}/hlc/img/cities/{sl}.jpg</image:loc></image:image></url>'
        return f'<url><loc>{u}</loc></url>'
    open('en-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + ''.join(_u(u) for u in urls) + '</urlset>\n')
    si = open('sitemap_index.xml', encoding='utf-8').read()
    if 'en-sitemap.xml' not in si:
        si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/en-sitemap.xml</loc>\n\t</sitemap>\n</sitemapindex>')
    si = re.sub(rf'(<loc>{re.escape(SITE)}/en-sitemap\.xml</loc>)(\s*<lastmod>[^<]*</lastmod>)?', rf'\1\n\t\t<lastmod>{datetime.date.today().isoformat()}</lastmod>', si)
    open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    # remove English pages of deals that have gone
    if os.path.isdir('en/deals'):
        import shutil
        for d_ in os.listdir('en/deals'):
            if os.path.isdir(os.path.join('en/deals', d_)) and d_ not in hechos and d_ not in ('ideas', 'from'):
                shutil.rmtree(os.path.join('en/deals', d_))
    json.dump({'deals': sorted(hechos), 'guides': [p['s'] for p, g in dl]}, open('en/pages.json', 'w'))
    json.dump(moved, open('en/_map-deals.json', 'w'), separators=(',', ':'))
    print('EN deals', len(hechos), 'guides', len(dl), 'moved', len(moved))


if __name__ == '__main__':
    main()
