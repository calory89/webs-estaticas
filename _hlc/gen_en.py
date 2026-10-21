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

SITE, e, flag, slugify = G.SITE, G.e, G.flag, G.slugify
API = G.API

NAMES = {'lisboa': 'Lisbon', 'oporto': 'Porto', 'londres': 'London', 'edimburgo': 'Edinburgh', 'dublin': 'Dublin', 'paris': 'Paris', 'niza': 'Nice', 'roma': 'Rome', 'milan': 'Milan',
         'venecia': 'Venice', 'florencia': 'Florence', 'bolonia': 'Bologna', 'napoles': 'Naples', 'palermo': 'Palermo', 'cerdena': 'Sardinia', 'malta': 'Malta', 'atenas': 'Athens',
         'santorini': 'Santorini', 'mykonos': 'Mykonos', 'creta': 'Crete', 'chipre': 'Cyprus', 'dubrovnik': 'Dubrovnik', 'amsterdam': 'Amsterdam', 'bruselas': 'Brussels', 'brujas': 'Bruges',
         'berlin': 'Berlin', 'hamburgo': 'Hamburg', 'munich': 'Munich', 'zurich': 'Zurich', 'viena': 'Vienna', 'salzburgo': 'Salzburg', 'praga': 'Prague', 'budapest': 'Budapest',
         'cracovia': 'Krakow', 'varsovia': 'Warsaw', 'belgrado': 'Belgrade', 'bucarest': 'Bucharest', 'sofia': 'Sofia', 'estambul': 'Istanbul', 'copenhague': 'Copenhagen', 'oslo': 'Oslo',
         'estocolmo': 'Stockholm', 'helsinki': 'Helsinki', 'tallin': 'Tallinn', 'riga': 'Riga', 'vilna': 'Vilnius', 'reikiavik': 'Iceland', 'madeira': 'Madeira', 'azores': 'The Azores',
         'tenerife': 'Tenerife', 'marrakech': 'Marrakesh', 'fez': 'Fez', 'el-cairo': 'Cairo', 'zanzibar': 'Zanzibar', 'mauricio': 'Mauritius', 'sal': 'Sal Island', 'ciudad-del-cabo': 'Cape Town',
         'hong-kong': 'Hong Kong', 'kuala-lumpur': 'Kuala Lumpur', 'manila': 'Manila', 'dubai': 'Dubai', 'maldivas': 'The Maldives', 'sri-lanka': 'Sri Lanka', 'bangkok': 'Bangkok',
         'phuket': 'Phuket', 'hanoi': 'Vietnam', 'singapur': 'Singapore', 'bali': 'Bali', 'seul': 'Seoul', 'tokio': 'Tokyo', 'kioto': 'Kyoto', 'nueva-york': 'New York', 'miami': 'Miami',
         'los-angeles': 'Los Angeles', 'san-francisco': 'San Francisco', 'portland': 'Portland', 'las-vegas': 'Las Vegas', 'cancun': 'Cancun', 'ciudad-de-mexico': 'Mexico City',
         'la-habana': 'Havana', 'punta-cana': 'Punta Cana', 'bogota': 'Bogota', 'lima': 'Peru', 'rio-de-janeiro': 'Rio de Janeiro', 'buenos-aires': 'Buenos Aires'}
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
<button class="hx-burger" type="button" aria-label="Open menu" aria-expanded="false" onclick="var h=document.getElementById('hx');var o=h.classList.toggle('open');this.setAttribute('aria-expanded',o)"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
<nav class="hx-nav" aria-label="Main">
<a href="/en/deals/">Today's deals</a>
<a href="/en/destinations/">Destination guides</a>
<a href="/en/deals/?orden=precio">Cheapest first</a>
<a class="hx-cta" href="/en/deals/">✈️ Find a deal</a>
</nav></div></header>'''
FOOTER = '''<footer class="fx"><div class="fx-in">
<div><a class="fx-logo" href="/en/" style="display:inline-block;padding:0"><b>happy</b><svg width="104" height="19" viewBox="0 0 250 46" aria-hidden="true" style="display:block"><path d="M8 8 Q120 58 214 14" fill="none" stroke="#FFC531" stroke-width="11" stroke-linecap="round"/></svg><i>low cost</i></a>
<p>We hunt the cheapest flights in the world and check every price before we publish it. More than 420,000 travellers have followed us since 2012.</p></div>
<div><h4>Deals</h4><a href="/en/deals/">Today's deals</a><a href="/en/deals/?orden=precio">Cheapest deals</a><a href="/en/deals/?rt=1">Return flights</a></div>
<div><h4>Explore</h4><a href="/en/destinations/">Destination guides</a><a href="/en/deals/?cont=asia">Asia</a><a href="/en/deals/?cont=europa">Europe</a><a href="/en/deals/?cont=norteamerica">North America</a></div>
<div><h4>Follow us</h4><a href="https://www.facebook.com/happylowcostofficialpage/" target="_blank" rel="noopener">Facebook</a><a href="https://www.instagram.com/happylowcost/" target="_blank" rel="noopener">Instagram</a><a href="/">🇪🇸 Versión en español</a></div>
</div>
<div class="fx-legal">Some links are affiliate links: if you book through them we may earn a small commission at no extra cost to you. Prices were checked on the date shown on each deal and can change. Destination photos: Wikimedia Commons (credits on each page). <a href="/aviso-legal-datos-cookies/" style="display:inline;color:#D6DCEA!important;text-decoration:underline">Legal notice, privacy & cookies</a> · © Happy Low Cost</div>
</footer><script src="/hlc/hlc.js?v=9" defer></script>'''


def head(title, desc, canonical, es_url=None, og_image=None, og_type='website', ld=None, robots='index, follow, max-image-preview:large', body_class=''):
    h = G.HEAD
    h = h.replace('<html lang="es">', '<html lang="en">').replace('content="es_ES"', 'content="en_GB"')
    h = re.sub(r'<!--hlc-header-->.*?<!--/hlc-header-->', '<!--hlc-header-->' + HEADER + '<!--/hlc-header-->', h, flags=re.S)
    h = h.replace('title="Chollos Happy Low Cost" href="/chollos/feed.xml"', 'title="Happy Low Cost deals" href="/en/deals/feed.xml"')
    alt = f'<link rel="alternate" hreflang="en" href="{canonical}">'
    if es_url:
        alt += f'<link rel="alternate" hreflang="es" href="{es_url}"><link rel="alternate" hreflang="x-default" href="{es_url}">'
    extra = '<link rel="stylesheet" href="/hlc/home.css?v=7">' + alt + (G.ld_script(ld) if ld else '')
    for k, v in dict(title=e(title), desc=e(desc), canonical=canonical, robots=robots, og_type=og_type, og_title=e(title), og_alt=e(title),
                     og_image=og_image or f'{SITE}/hlc/brand/og-default.jpg', extra_head=extra, body_class=body_class).items():
        h = h.replace('{' + k + '}', v)
    return h


def card(x):
    f = x['facts']
    cs = G.cont_of(f)[0]
    o, d = names(x)
    img = G.photo_url(x)
    bg = f"background-image:url('{img}'),linear-gradient(135deg,#FF5A36,#2E6BF0)" if img else 'background:linear-gradient(135deg,#FF5A36,#2E6BF0)'
    cn, ce = CONT.get(cs, ('', ''))
    oc = slugify(country(f, 'origen'))
    q = slugify(' '.join([o, d, f.get('origen', ''), f.get('destino', ''), country(f, 'origen'), country(f, 'destino')]))
    return (f'<a class="dc" href="/en/deals/{e(x["slug"])}/" data-slug="{e(x["slug"])}" data-oc="{e(oc)}" data-occ="{e(f.get("origen_cc", ""))}" data-orig="{e(f.get("origen", ""))}" data-cont="{e(cs)}" '
            f'data-price="{e(x.get("price"))}" data-ida="{e(f.get("ida", ""))}" data-dir="{1 if f.get("escalas") == 0 else 0}" data-tipo="{"rt" if f.get("vuelta") else "ow"}" data-ts="{e(G.ago_iso(x.get("approved_at")))}" data-q="{e(q)}">'
            f'<div class="dc-img" style="{bg}">{f"<span class=dc-save>−{f.get(chr(97)+chr(104)+chr(111)+chr(114)+chr(114)+chr(111)+chr(95)+chr(112)+chr(99)+chr(116))} %</span>" if f.get("ahorro_pct") else ""}<span class="dc-ok">✓ Verified</span><span class="dc-fav" role="button" tabindex="0" aria-label="Save to favourites" data-fav="{e(x["slug"])}">♡</span>'
            f'<span class="dc-city">{e(d)}</span>{f"<span class=dc-cont>{ce} {e(cn.replace("the ", "").title() if cn.startswith("the ") else cn)}</span>" if cs else ""}</div>'
            f'<div class="dc-b"><div><div class="dc-r"><span class="dc-flag" title="{e(country(f, "origen"))}">{flag(f.get("origen_cc"))}</span> {e(o)} → {e(d)}</div>'
            f'<div class="dc-m">{trip(f)}{" · nonstop" if f.get("escalas") == 0 else ""} · {e(date_en(f.get("ida", "")))}</div></div><div class="dc-p">{f'<s>€{e(f.get("precio_normal"))}</s>' if f.get('precio_normal') else ''}€{e(x.get("price"))}</div></div></a>')


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
    months = sorted({(x['facts'].get('ida') or '')[:7] for x in deals if x['facts'].get('ida')})
    mopts = ''.join(f'<option value="{m}">{MONTHS[int(m[5:7]) - 1]} {m[:4]}</option>' for m in months)
    return f'''<div class="xf" data-explorer-filters>
<div class="xf-row">
<label class="xf-search"><span aria-hidden="true">🔎</span><input type="search" data-x="q" placeholder="Search a destination, city or country" aria-label="Search deals"></label>
<label class="xf-sel"><span>Flying from</span><select data-x="desde" aria-label="Departure country"><option value="">All countries</option>{opts}</select></label>
<label class="xf-sel"><span>Month</span><select data-x="mes" aria-label="Departure month"><option value="">Any date</option>{mopts}</select></label>
<label class="xf-sel"><span>Sort by</span><select data-x="orden" aria-label="Sort"><option value="nuevo">Best for you</option><option value="precio">Cheapest</option><option value="fecha">Soonest departure</option></select></label>
</div>
<div class="xf-row chips" role="group" aria-label="Destination continent"><button type="button" class="chip" data-cont="" aria-pressed="true">🌐 Whole world</button>{chips}</div>
<div class="xf-row xf-more">
<label class="xf-range"><span>Max price: <b data-x-out="max">no limit</b></span><input type="range" min="20" max="1500" step="10" value="1500" data-x="max" aria-label="Maximum price"></label>
<label class="xf-tg"><input type="checkbox" data-x="dir"> Nonstop only</label>
<label class="xf-tg"><input type="checkbox" data-x="rt"> Return only</label>
<label class="xf-tg"><input type="checkbox" data-x="fav"> ♥ My favourites</label>
<button type="button" class="hlc-btn o xf-clear" data-x-clear>Clear filters</button>
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
    deals.sort(key=lambda x: x.get('approved_at') or '', reverse=True)
    dmap = {g['slug']: g for g in dests if g.get('guide_html_en')}
    hechos = set()
    origins = {slugify(country(x['facts'], 'origen')) for x in deals}
    nconts = len({G.cont_of(x['facts'])[0] for x in deals})

    # ---------- deal pages ----------
    for x in deals:
        f, slug, en = x['facts'], x['slug'], x['en']
        o, d = names(x)
        url = f'{SITE}/en/deals/{slug}/'
        es_url = f'{SITE}/chollos/{slug}/'
        title = en.get('title') or f'{o} → {d} from €{x["price"]} {trip(f)}'
        seo_t = en.get('seo_title') or f'Flights {o} → {d} for €{x["price"]} ({trip(f)}) · Verified deal'
        desc = en.get('meta_description') or en.get('excerpt') or title
        ls_ = G.lib_slug(f)
        hero = f'/hlc/img/cities/{ls_}.jpg' if ls_ else (f'/chollos/{slug}/foto.jpg' if os.path.exists(f'chollos/{slug}/foto.jpg') else (x.get('image_url') or ''))
        og = f'{SITE}/chollos/{slug}/og.jpg'
        verified = (x.get('approved_at') or '')[:16].replace('T', ' ')
        ch, cld = crumbs([('Home', '/en/'), ('Deals', '/en/deals/'), (f'{o} → {d}', None)])
        offer = {"@type": "Offer", "name": title, "url": url, "price": x.get('price'), "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "validThrough": f.get('ida'),
                 "category": "Flight", "itemOffered": {"@type": "Flight", "name": f"{o} → {d}", "departureAirport": {"@type": "Airport", "iataCode": f.get('origen_iata'), "name": o},
                                                       "arrivalAirport": {"@type": "Airport", "iataCode": f.get('destino_iata'), "name": d}, "departureTime": f.get('ida')}}
        art = {"@type": "Article", "headline": title[:110], "description": desc, "image": og, "datePublished": x.get('approved_at'), "dateModified": x.get('approved_at'), "inLanguage": "en",
               "author": {"@type": "Organization", "name": "Happy Low Cost", "url": SITE + '/en/'}, "publisher": {"@type": "Organization", "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        rel = G.related(x, deals)
        guide = f'<a class="hlc-btn o" href="/en/destinations/{ls_}/">📖 Full {e(NAMES.get(ls_, d))} travel guide</a>' if ls_ and ls_ in dmap else ''
        fl, ht = to_en_link(x.get('cta_flight')), hotels(d)
        share = quote(f'{title} {url}')
        page = head(seo_t, desc, url, es_url, og, 'article', [art, cld, offer], body_class='deal')
        page += f'''<main data-deal-slug="{e(slug)}" data-deal-ida="{e(f.get('ida', ''))}">
<section class="deal-hero" style="{f'background-image:url({hero})' if hero else ''}"{G.photos_attr(ls_) if ls_ else ''}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">✓ Deal verified on {e(date_en(verified))} at {e(verified[11:16])} (UTC)</div>
<h1>{e(title)}</h1>
<div class="deal-cta"><span class="price-tag">€{e(x.get('price'))} <small>{trip(f)}</small></span>{f'<span class="price-was">Usual price <s>€{e(f.get("precio_normal"))}</s> · you save {e(f.get("ahorro_pct"))}%</span>' if f.get('precio_normal') else ''}<a class="hlc-btn" href="{e(fl)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo_en" style="min-height:56px;font-size:17px">See flight & dates ✈️</a><span class="dc-fav big" role="button" tabindex="0" aria-label="Save to favourites" data-fav="{e(slug)}">♡</span></div>
<div class="deal-days" data-days></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt">{en.get('body_html') or ''}
{f'<p>{guide}</p>' if guide else ''}</article>
<aside class="deal-card">
<div class="facts">
<div><small>From</small><b>{flag(f.get('origen_cc'))} {e(o)}</b></div><div><small>To</small><b>{flag(f.get('destino_cc'))} {e(d)}</b></div>
<div><small>Depart</small><b>{e(date_en(f.get('ida', '')))}</b></div><div><small>Return</small><b>{e(date_en(f.get('vuelta') or '') or '—')}</b></div>
<div><small>Airline</small><b>{e(f.get('aerolinea') or 'Various')}</b></div><div><small>Stops</small><b>{'Nonstop' if f.get('escalas') == 0 else e(f.get('escalas'))}</b></div>
</div>
<a class="hlc-btn" href="{e(fl)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_vuelo_en" style="min-height:56px;font-size:17px">See flight from €{e(x.get('price'))}</a>
<a class="hlc-btn t" href="{e(ht)}" target="_blank" rel="sponsored nofollow noopener" data-hlc="deal_hotel_en">🏨 Hotels in {e(d)}</a>
{guide}
<div style="font:13px/1.5 Inter,sans-serif;color:#4A5468">Price checked when published. Cheap fares go fast: if it has changed, try nearby dates.</div>
<div class="share"><button class="hlc-btn o" type="button" data-share data-title="{e(title)}" data-url="{url}">📤 Share</button><a class="hlc-btn o" href="https://wa.me/?text={share}" target="_blank" rel="noopener">WhatsApp</a><a class="hlc-btn o" href="https://www.facebook.com/sharer/sharer.php?u={quote(url)}" target="_blank" rel="noopener">Facebook</a><button class="hlc-btn o" type="button" data-copy="{url}">Copy link</button></div>
</aside>
</div>
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">You might also like</div><h2>Similar deals</h2></div><a class="hlc-btn o" href="/en/deals/">See all</a></div><div class="dc-grid">{''.join(card(y) for y in rel)}</div></section>
</div></main>{FOOTER}</body></html>'''
        write(f'en/deals/{slug}', page)
        hechos.add(slug)

    # ---------- explorer /en/deals/ and home /en/ ----------
    cheapest = min((x['price'] for x in deals), default=None)
    intro = (f"{len(deals)} flight deals live right now, departing from {len(origins)} countries to {nconts} continents. "
             "We check every price before publishing it, and pull deals as soon as they expire.")
    grid = ''.join(card(x) for x in deals) or '<div class="dc-empty"><b>No deals right now.</b><span>Fares move fast: check back in a few hours.</span></div>'
    empty = '<div class="dc-empty" data-x-empty hidden><b>No deals match those filters.</b><span>Try removing a filter.</span></div>'
    items = [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/en/deals/{x['slug']}/", "name": x['en'].get('title', '')} for i, x in enumerate(deals[:50])]
    ldl = [{"@type": "CollectionPage", "name": "Today's flight deals", "url": f"{SITE}/en/deals/", "inLanguage": "en", "description": intro, "mainEntity": {"@type": "ItemList", "numberOfItems": len(deals), "itemListElement": items}}]
    ch, cld = crumbs([('Home', '/en/'), ('Deals', None)])
    page = head("Today's cheap flight deals worldwide, verified · Happy Low Cost", intro[:155], f'{SITE}/en/deals/', f'{SITE}/chollos/', ld=ldl + [cld], body_class='chollos')
    page += f'''<main class="sec" style="padding-top:26px"><div class="wrap">
{ch}
<div class="sec-h"><div><div class="kicker">Freshly hunted · verified</div><h1 class="x-h1">Today's flight deals</h1><p>{e(intro)}</p></div></div>
{filters(deals)}
<div class="dc-grid" data-explorer-grid>{grid}</div>{empty}
</div></main><script src="/hlc/explorer.js?v=2" defer></script>{FOOTER}</body></html>'''
    write('en/deals', page)

    hero_imgs = [p for p in ('bali', 'tokio', 'nueva-york', 'santorini', 'maldivas', 'lisboa')]
    guides_hub = ''.join(f'<a class="hub-l" href="/en/destinations/{s_}/">{e(NAMES.get(s_, g["name"]))}</a>' for s_, g in dmap.items())
    org = {"@type": "Organization", "@id": f"{SITE}/#org", "name": "Happy Low Cost", "url": f"{SITE}/en/", "logo": f"{SITE}/hlc/brand/icon-512.png", "foundingDate": "2012",
           "sameAs": ["https://www.facebook.com/happylowcostofficialpage/", "https://www.instagram.com/happylowcost/"]}
    web = {"@type": "WebSite", "url": f"{SITE}/en/", "name": "Happy Low Cost", "inLanguage": "en", "publisher": {"@id": f"{SITE}/#org"}}
    page = head('Happy Low Cost · We hunt the cheapest flights in the world', f"Verified cheap flight deals from every continent{f', from €{cheapest}' if cheapest else ''}. Error fares and flash sales, checked before we publish them.",
                f'{SITE}/en/', f'{SITE}/', ld=[org, web, ldl[0]], body_class='home')
    page += f'''<main>
<section class="deal-hero" style="background-image:url(/hlc/img/cities/{hero_imgs[0]}.jpg);min-height:min(78vh,680px)" data-photos="{'|'.join('/hlc/img/cities/' + s + '.jpg' for s in hero_imgs)}"><div class="wrap">
<div class="kicker" style="color:#FFC531">★★★★★ 420,000+ travellers since 2012</div>
<h1>We hunt the cheapest flights in the world</h1>
<p style="font:500 clamp(17px,2.2vw,21px)/1.5 Inter,sans-serif;max-width:640px;margin:8px 0 18px">Error fares and flash sales from every continent. We check every price before publishing it, so you only see deals that are really there.</p>
<form class="qf" data-hlc-quick novalidate style="color:#14213D"><div class="qf-row"><label class="qf-sel"><span>Flying from</span><select name="origin" aria-label="Your airport"><optgroup label="Europe"><option>London</option><option>Dublin</option><option>Paris</option><option>Amsterdam</option><option>Berlin</option><option>Rome</option><option>Lisbon</option><option>Copenhagen</option><option>Madrid</option><option>Barcelona</option></optgroup><optgroup label="Americas"><option>New York</option><option>Miami</option><option>Los Angeles</option><option>Toronto</option><option>Vancouver</option><option>Mexico City</option></optgroup><optgroup label="Asia & Oceania"><option>Singapore</option><option>Dubai</option><option>Hong Kong</option><option>Seoul</option><option>Tokyo</option><option>Sydney</option></optgroup></select></label><label class="qf-in"><span>Alert me at</span><input name="contact" type="text" inputmode="email" autocomplete="email" placeholder="your email or WhatsApp" aria-label="Email or WhatsApp" required></label><button type="submit" class="hlc-btn qf-go">Alert me free</button></div><label class="qf-ok"><input type="checkbox" name="consent" required> I agree to receive deal alerts from Happy Low Cost (max one a day) and the <a href="/aviso-legal-datos-cookies/">privacy policy</a>.</label><div class="qf-msg" data-msg role="status" aria-live="polite"></div></form>
<p style="margin:14px 0 0"><a href="#deals" style="color:#fff;font-weight:700;text-decoration:underline">Or see today's {len(deals)} deals ↓</a></p>
</div></section>
<section class="sec" id="deals"><div class="wrap">
<div class="sec-h"><div><div class="kicker">Live now · sorted for you</div><h2>Today's flight deals</h2><p>{e(intro)}</p></div><a class="hlc-btn o" href="/en/deals/">Open the deal finder</a></div>
{filters(deals)}
<div class="dc-grid" data-explorer-grid>{grid}</div>{empty}
</div></section>
<section class="sec" style="padding-top:0"><div class="wrap">
<div class="sec-h"><div><div class="kicker">How it works</div><h2>Three things we never skip</h2></div></div>
<div class="dc-grid">
<div class="dc-empty" style="text-align:left"><b>1 · We hunt</b><span>We watch airlines and deal sites around the world, 24/7. When a fare collapses, we jump on it.</span></div>
<div class="dc-empty" style="text-align:left"><b>2 · We verify</b><span>Every price is checked live with real dates before it goes up. If it's gone tomorrow, we take it down.</span></div>
<div class="dc-empty" style="text-align:left"><b>3 · You book</b><span>One click takes you to the exact dates we found, plus well-rated hotels at your destination.</span></div>
</div></div></section>
{f'<section class="sec" style="padding-top:0"><div class="wrap"><section class="hub"><h2>Destination guides</h2><div class="hub-g">{guides_hub}</div></section></div></section>' if guides_hub else ''}
</main><script src="/hlc/explorer.js?v=2" defer></script>{FOOTER}</body></html>'''
    write('en', page)

    # ---------- destination guides ----------
    dl = []
    for p in G.DLIB:
        g = dmap.get(p['s'])
        if not g:
            continue
        n = NAMES.get(p['s'], p['n'])
        url = f"{SITE}/en/destinations/{p['s']}/"
        gh = re.sub(r'<(?!/?(h2|h3|p|ul|li|strong)\b)[^>]*>', '', g['guide_html_en'])
        sub = [x for x in deals if G.lib_slug(x['facts']) == p['s']]
        ch, cld = crumbs([('Home', '/en/'), ('Destinations', '/en/destinations/'), (n, None)])
        dest_ld = {"@type": "TouristDestination", "@id": url + '#dest', "name": n, "url": url, "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg",
                   **({"geo": {"@type": "GeoCoordinates", "latitude": p['y'], "longitude": p['x']}} if p.get('y') is not None else {})}
        art = {"@type": "Article", "headline": (g.get('seo_title_en') or f'What to see in {n}')[:110], "description": g.get('meta_description_en') or '', "image": f"{SITE}/hlc/img/cities/{p['s']}.jpg",
               "dateModified": g.get('updated_at'), "inLanguage": "en", "about": {"@id": url + '#dest'}, "author": {"@type": "Organization", "name": "Happy Low Cost"},
               "publisher": {"@type": "Organization", "name": "Happy Low Cost", "logo": {"@type": "ImageObject", "url": f"{SITE}/hlc/brand/icon-512.png"}}, "mainEntityOfPage": url}
        es = f"{SITE}/destinos/{p['s']}/" if os.path.exists(f"destinos/{p['s']}/index.html") else None
        page = head((g.get('seo_title_en') or f'What to see in {n}') + ' · Happy Low Cost', g.get('meta_description_en') or f'{n} travel guide: what to see, where to stay, what to eat and cheap flights.',
                    url, es, f"{SITE}/hlc/img/cities/{p['s']}.jpg", 'article', [dest_ld, art, cld], body_class='destino')
        cr = G.CR.get(p['s']) or {}
        page += f'''<main>
<section class="deal-hero" style="background-image:url(/hlc/img/cities/{p['s']}.jpg)"{G.photos_attr(p['s'])}><div class="wrap">
{ch.replace('class="crumbs"', 'class="crumbs crumbs-l"')}
<div class="kicker" style="color:#FFC531">Travel guide</div>
<h1>{e(g.get('seo_title_en') or 'What to see in ' + n)}</h1>
<div class="deal-cta">{f'<a class="hlc-btn" href="#deals">🔥 {len(sub)} deal{"s" if len(sub) != 1 else ""} to {e(n)}</a>' if sub else ''}<a class="hlc-btn t" href="{hotels(n)}" target="_blank" rel="sponsored nofollow noopener">🏨 Hotels in {e(n)}</a></div>
</div></section>
<div class="wrap"><div class="deal-body">
<article class="txt guide">{gh}
<p class="credit">Photo: {e(cr.get('author') or 'Wikimedia Commons')} · {e(cr.get('license', ''))} · Wikimedia Commons · Guide updated {e(date_en(g.get('updated_en') or g.get('updated_at') or ''))}</p></article>
<aside class="deal-card" id="deals">
<div class="kicker">Deals to {e(n)}</div>
{''.join(card(x) for x in sub[:3]) or f'<p style="margin:0;color:#4A5468">No deal to {e(n)} today. New fares land every hour.</p>'}
<a class="hlc-btn t" href="{hotels(n)}" target="_blank" rel="sponsored nofollow noopener">🏨 Hotels in {e(n)}</a>
<a class="hlc-btn o" href="/en/deals/">See all deals</a>
</aside></div>
<section class="sec" style="padding-top:10px"><div class="sec-h"><div><div class="kicker">More inspiration</div><h2>Other destinations</h2></div></div><div class="hub-g">{''.join(f'<a class="hub-l" href="/en/destinations/{q["s"]}/">{e(NAMES.get(q["s"], q["n"]))}</a>' for q in G.DLIB if q['s'] in dmap and q['s'] != p['s'] and q['r'] == p['r'])}</div></section>
</div></main>{FOOTER}</body></html>'''
        write(f"en/destinations/{p['s']}", page)
        dl.append((p, g))
    # index of guides
    ch, cld = crumbs([('Home', '/en/'), ('Destinations', None)])
    tiles = ''.join(f'<a class="dc" href="/en/destinations/{p["s"]}/"><div class="dc-img" style="background-image:url(/hlc/img/cities/{p["s"]}-800.jpg)"><span class="dc-city">{e(NAMES.get(p["s"], p["n"]))}</span></div></a>' for p, g in dl)
    page = head('Travel guides: what to see, where to stay and what to eat · Happy Low Cost', 'Honest travel guides written by people who know each place: what to see, how many days, where to stay, what to eat and the cheapest flights.',
                f'{SITE}/en/destinations/', f'{SITE}/destinos/', ld=[cld])
    page += f'''<main class="sec" style="padding-top:26px"><div class="wrap">{ch}
<div class="sec-h"><div><div class="kicker">Travel guides</div><h1 class="x-h1">Destination guides</h1><p>{len(dl)} guides and growing every day. Each one pairs with the live flight deals to that place.</p></div><a class="hlc-btn s" href="/en/deals/">✈️ Today's deals</a></div>
<div class="dc-grid">{tiles or '<div class="dc-empty"><b>Guides are on their way.</b><span>We are writing them right now.</span></div>'}</div>
</div></main>{FOOTER}</body></html>'''
    write('en/destinations', page)

    # ---------- RSS, sitemap, list of English pages ----------
    rss = ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Happy Low Cost · Flight deals</title><link>' + SITE + '/en/deals/</link><description>Verified cheap flight deals worldwide</description><language>en</language>' +
           ''.join(f'<item><title>{e(x["en"].get("title"))}</title><link>{SITE}/en/deals/{x["slug"]}/</link><guid>{SITE}/en/deals/{x["slug"]}/</guid><description>{e(x["en"].get("excerpt") or "")}</description></item>' for x in deals[:50]) + '</channel></rss>\n')
    open('en/deals/feed.xml', 'w', encoding='utf-8').write(rss)
    urls = [f'{SITE}/en/', f'{SITE}/en/deals/', f'{SITE}/en/destinations/'] + [f'{SITE}/en/deals/{s}/' for s in sorted(hechos)] + [f"{SITE}/en/destinations/{p['s']}/" for p, g in dl]
    open('en-sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(f'<url><loc>{u}</loc></url>' for u in urls) + '</urlset>\n')
    si = open('sitemap_index.xml', encoding='utf-8').read()
    if 'en-sitemap.xml' not in si:
        si = si.replace('</sitemapindex>', f'\t<sitemap>\n\t\t<loc>{SITE}/en-sitemap.xml</loc>\n\t</sitemap>\n</sitemapindex>')
        open('sitemap_index.xml', 'w', encoding='utf-8').write(si)
    # remove English pages of deals that have gone
    if os.path.isdir('en/deals'):
        import shutil
        for d_ in os.listdir('en/deals'):
            if os.path.isdir(os.path.join('en/deals', d_)) and d_ not in hechos:
                shutil.rmtree(os.path.join('en/deals', d_))
    json.dump({'deals': sorted(hechos), 'guides': [p['s'] for p, g in dl]}, open('en/pages.json', 'w'))
    print('EN deals', len(hechos), 'guides', len(dl))


if __name__ == '__main__':
    main()
