#!/usr/bin/env python3
"""Kolaboro: what developer websites reveal (batch 18, n18a). No model calls, no cost beyond the runner.

Usage: dev_web.py OUT_DIR [--only dom1,dom2] [--state STATE.json]
Reads the developer and project websites of the named project data (https://kolaboro.com/api/x/fraud/domains, built from
/data/named.json: registrable domains we link for exactly one developer; portals, agents and news sites are excluded there).

Once per run and per domain (polite: robots.txt respected for our user agent, one homepage request, 10 s timeout, 1.5 MB cap):
  web-health.json  daily: HTTP status of the homepage, response time, reachable or not (last 30 daily checks as a string), uptime
                   streak, TLS certificate expiry (from the TLS handshake), domain registration expiry (registry RDAP via the IANA
                   bootstrap, weekly), Last-Modified header, newest <lastmod> in the sitemap (weekly).
  dev-links.json   public identifiers printed in each homepage's source and in DNS / TLS: Google Analytics, Tag Manager and Ads
                   ids, Meta pixel ids, Hotjar, Microsoft Clarity, HubSpot, Tawk.to and Intercom ids, the WordPress theme folder, a
                   hash of the page's HTML skeleton (tag names and class names, no text), other tracked domains named in the TLS
                   certificate, custom name servers and the server IP. Only identifiers shared by two or more DIFFERENT developers
                   are published, with the domains that carry them. No personal data is read or kept: no emails, phone numbers or
                   names, and no page text.
Shared ids usually mean the same marketing agency, web studio or hosting account, not the same owner.
Private state (robots, RDAP and sitemap results with their dates) lives in the Actions cache only.
"""
import json, os, re, sys, ssl, socket, time, hashlib, urllib.request, urllib.parse, urllib.robotparser, concurrent.futures as cf
from datetime import datetime, timezone, timedelta
from html.parser import HTMLParser

UA = 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/data-policy)'
UA_TOKEN = 'KolaboroResearchAgent'
NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime('%Y-%m-%d')
DAYS = 30
HUB = 4            # an identifier carried by more than this many developers is a platform, template or shared host: not a link
HUB_TRACK = 8      # analytics/pixel ids: an agency can run many accounts' tags from one container, allow a bit more
ARGS = sys.argv[1:]
# --local: run outside GitHub Actions behind an egress proxy that may refuse hosts and re-signs TLS. Then a failed connection is
# recorded as 'not checked' (we cannot tell a refused host from a down one) and certificate dates are not read.
LOCAL = '--local' in ARGS
OUT = ARGS[0] if ARGS and not ARGS[0].startswith('--') else 'out'


def arg(name, d=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS and ARGS.index(name) + 1 < len(ARGS) else d


def get(url, timeout=10, cap=1_500_000, accept='text/html,application/xhtml+xml,*/*;q=0.8'):
    """(status, final_url, headers, body bytes, seconds) or raises."""
    t = time.time()
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept, 'Accept-Language': 'en'})
    try:
        r = urllib.request.urlopen(req, timeout=timeout)
        b = r.read(cap)
        return r.status, r.geturl(), dict(r.headers), b, time.time() - t
    except urllib.error.HTTPError as e:
        b = b''
        try:
            b = e.read(200_000)
        except Exception:
            pass
        return e.code, e.geturl() if hasattr(e, 'geturl') else url, dict(e.headers or {}), b, time.time() - t


def get_json(url, timeout=20, accept='application/json, application/rdap+json'):
    try:
        s, _, _, b, _ = get(url, timeout=timeout, cap=8_000_000, accept=accept)
        return json.loads(b.decode('utf-8', 'replace')) if s == 200 else None
    except Exception:
        return None


# ---------------------------------------------------------------------------------------------------------- RDAP / DNS / TLS
_BOOT = {}


def rdap_expiry(d):
    if not _BOOT:
        for tlds, urls in (get_json('https://data.iana.org/rdap/dns.json') or {}).get('services', []):
            u = next((x for x in urls if x.startswith('https')), urls[0] if urls else None)
            for t in tlds:
                _BOOT[t.lower()] = u
    base = _BOOT.get(d.rsplit('.', 1)[-1])
    if not base:
        return None, 'no_rdap'
    j = get_json(base.rstrip('/') + '/domain/' + d)
    if not j:
        return None, 'not_found'
    for ev in j.get('events') or []:
        if (ev.get('eventAction') or '').lower() == 'expiration' and ev.get('eventDate'):
            return ev['eventDate'][:10], 'ok'
    return None, 'no_date'


def doh(name, typ):
    j = get_json('https://cloudflare-dns.com/dns-query?name=' + urllib.parse.quote(name) + '&type=' + typ, timeout=10, accept='application/dns-json')
    if not j:
        j = get_json('https://dns.google/resolve?name=' + urllib.parse.quote(name) + '&type=' + typ, timeout=10)
    if not j or j.get('Status') not in (0, 3):   # 0 answer, 3 NXDOMAIN; anything else is a failed lookup
        return None
    code = {'A': 1, 'NS': 2, 'CNAME': 5, 'PTR': 12}[typ]
    return sorted({a['data'].rstrip('.').lower() for a in j.get('Answer') or [] if a.get('type') == code})


def tls_cert(host):
    """(notAfter YYYY-MM-DD, [SAN dns names]) from the TLS handshake, or (None, [])."""
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((host, 443), timeout=8) as s:
            with ctx.wrap_socket(s, server_hostname=host) as t:
                c = t.getpeercert()
        na = datetime.strptime(c['notAfter'], '%b %d %H:%M:%S %Y %Z').strftime('%Y-%m-%d')
        return na, sorted({v.lower() for k, v in c.get('subjectAltName', ()) if k == 'DNS'})
    except ssl.SSLCertVerificationError as e:
        return 'invalid', []
    except Exception:
        return None, []


SLD2 = re.compile(r'\.(co|com|net|org|gov|ac|or|ne|go|in|edu)\.[a-z]{2}$')


def reg_domain(h):
    h = (h or '').lower().lstrip('*.').rstrip('.')
    h = h[4:] if h.startswith('www.') else h
    p = h.split('.')
    return '.'.join(p[-3:]) if SLD2.search(h) else '.'.join(p[-2:])


# big DNS and hosting providers: their name servers and addresses are shared by millions of unrelated sites
NS_PLATFORM = re.compile(r'(cloudflare\.com|domaincontrol\.com|awsdns|googledomains\.com|google\.com|wixdns\.net|registrar-servers\.com|'
                         r'nsone\.net|dnsimple|azure-dns|hostinger|dns\.jp|ultradns|dynect|name\.com|namecheaphosting|bluehost|hostgator|'
                         r'siteground|ionos|1and1|ui-dns|websitewelcome|squarespacedns|shopify|webflow|vercel-dns|netlify|digitalocean\.com|'
                         r'linode\.com|ovh\.net|anycast\.me|gandi\.net|hetzner|cloudns|he\.net|dnsmadeeasy|akam|edgekey|nic\.|registro\.br|'
                         r'parkingcrew|sedoparking|bodis|afternic|dan\.com|hover\.com|porkbun|dreamhost|inmotionhosting|a2hosting|godaddy|'
                         r'secureserver\.net|hichina|dnspod|alidns|aliyun|myhostadmin|rumahweb|niagahoster|idwebhost|jagoanhosting|'
                         r'exabytes|dewaweb|qwords|domainesia|biznet|hostmonster|justhost|ipage|fatcow|webhostbox|cpanel|plesk|'
                         r'wpengine|kinsta|pantheon|automattic|wordpress\.com|zoho|yandex|nsdns|dns-parking|above\.com|ns\.ua|webnic|'
                         r'exonhost|domainnameshop|one\.com|strato|hostpoint|infomaniak|aruba|register\.it|nominalia|dinahosting|'
                         r'arsys|cdmon|raiola|webempresa|loading\.es|hostalia|piensa|tucows|enom|networksolutions|worldnic|register\.com|'
                         r'markmonitor|csc|safenames|101domain|dyn\.com|constellix|rackspace|mediatemple|liquidweb|hostpapa|greengeeks)', re.I)


HOSTING_WORDS = re.compile(r'(host|server|srv|cloud|vps|static|cpanel|plesk|dedi|ip-\d|\d+-\d+-\d+|amazonaws|googleusercontent|linode|'
                           r'vultr|contabo|hetzner|ovh|digitalocean|azure|akamai|fastly|edgecast|framer|wix|squarespace|webflow|shopify|'
                           r'netlify|vercel|github|pantheon|kinsta|wpengine|siteground|hostinger|godaddy|secureserver|bluehost|ionos|'
                           r'cdn|lb\.|proxy|cache|web\d|node\d|vm\d|mail|1e100|awsglobalaccelerator|compute|ec2|gcp|edge|anycast|wpx|dns|park)', re.I)


def dedicated(ip):
    """True when the address has a reverse name that does not look like shared hosting or a platform (PTR via DNS over HTTPS)."""
    try:
        rev = '.'.join(reversed(ip.split('.'))) + '.in-addr.arpa'
        ptr = doh(rev, 'PTR') or []
    except Exception:
        return False
    return bool(ptr) and not any(HOSTING_WORDS.search(x) or NS_PLATFORM.search(x) for x in ptr)


_THEMES = {}


def public_theme(slug):
    """True when the theme (or its parent, for a -child folder) is in the WordPress.org theme directory: a public theme."""
    base = re.sub(r'[-_]?child(-theme)?$', '', slug)
    if base not in _THEMES:
        j = get_json('https://api.wordpress.org/themes/info/1.2/?action=theme_information&request[slug]=' + urllib.parse.quote(base), timeout=15)
        _THEMES[base] = bool(j and j.get('slug'))
    return _THEMES[base]


def cf_ranges():
    out = []
    try:
        _, _, _, b, _ = get('https://www.cloudflare.com/ips-v4', timeout=15, accept='text/plain')
        import ipaddress
        out = [ipaddress.ip_network(x.strip()) for x in b.decode().split() if x.strip()]
    except Exception:
        pass
    return out


# ---------------------------------------------------------------------------------------------------------- page fingerprints
ID_RX = [
    ('ga4', re.compile(r'\b(G-[A-Z0-9]{8,12})\b')),
    ('ua', re.compile(r'\b(UA-\d{4,10}-\d{1,4})\b')),
    ('gtm', re.compile(r'\b(GTM-[A-Z0-9]{4,9})\b')),
    ('gads', re.compile(r'\b(AW-\d{9,11})\b')),
    ('fbpx', re.compile(r'fbq\(\s*[\'"]init[\'"]\s*,\s*[\'"]?(\d{12,17})')),
    ('fbpx', re.compile(r'facebook\.com/tr\?id=(\d{12,17})')),
    ('hotjar', re.compile(r'(?:hjid\s*[:=]\s*|hotjar-)(\d{5,9})')),
    ('clarity', re.compile(r'clarity\.ms/tag/([a-z0-9]{8,12})\b')),
    ('clarity', re.compile(r'\(\s*window\s*,\s*document\s*,\s*["\']clarity["\']\s*,\s*["\']script["\']\s*,\s*["\']([a-z0-9]{8,12})["\']')),
    ('hubspot', re.compile(r'js(?:-eu1)?\.hs-scripts\.com/(\d{5,10})\.js')),
    ('hubspot', re.compile(r'portalId["\']?\s*[:=]\s*["\']?(\d{5,10})')),
    ('tawk', re.compile(r'embed\.tawk\.to/([0-9a-f]{24})')),
    ('intercom', re.compile(r'widget\.intercom\.io/widget/([a-z0-9]{8})\b')),
    ('intercom', re.compile(r'intercomSettings[^<]{0,200}app_id["\']?\s*:\s*["\']([a-z0-9]{8})["\']')),
    ('wptheme', re.compile(r'/wp-content/themes/([A-Za-z0-9_.-]{2,60})/')),
]
SKIP_TAGS = {'script', 'style', 'noscript', 'svg', 'path', 'template', 'br', 'source', 'meta', 'link'}


class Skel(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.body, self.gen = [], False, None

    def handle_starttag(self, tag, attrs):
        if tag == 'meta':
            a = dict(attrs)
            if (a.get('name') or '').lower() == 'generator' and a.get('content'):
                self.gen = a['content'][:80]
        if tag == 'body':
            self.body = True
        if not self.body or tag in SKIP_TAGS or len(self.parts) >= 600:
            return
        cls = ' '.join(sorted(c for c in (dict(attrs).get('class') or '').split() if not re.search(r'\d{3,}', c)))[:120]
        self.parts.append(tag + '.' + cls)


def fingerprint(html):
    ids = {}
    for t, rx in ID_RX:
        for m in rx.findall(html):
            v = m if t in ('wptheme',) else m.upper() if t in ('ga4', 'ua', 'gtm', 'gads') else m
            if t == 'wptheme':
                v = v.lower()
                if re.fullmatch(r'(twenty\w+|astra|hello-elementor|divi|avada|oceanwp|generatepress|kadence|neve|flatsome|enfold|bridge|'
                                r'betheme|the7|salient|jupiter|x|pro|blocksy|storefront|sydney|hestia|uncode|impreza|woodmart|porto|'
                                r'houzez|realhomes|wpresidence|homey|residence|zoner|bricks|oxygen|elementor|gutenberg)(-child)?', v):
                    continue   # off-the-shelf themes: shared by thousands of sites
                if re.match(r'(divi|genesis|kava|hendon|retrospect|avada|enfold|astra|bridge|salient|jupiter|the7|betheme|uncode|impreza)\b', v):
                    continue
            if re.search(r'X{4,}|0{6,}|123456', v, re.I):
                continue   # template placeholders such as GTM-XXXXXXX
            ids.setdefault(t, set()).add(v)
    sk = Skel()
    try:
        sk.feed(html[:1_500_000])
    except Exception:
        pass
    if len(sk.parts) >= 60:
        ids['skeleton'] = {hashlib.sha256('\n'.join(sk.parts).encode()).hexdigest()[:16]}
    return {k: sorted(v) for k, v in ids.items()}, sk.gen


def sitemap_newest(base, sitemaps):
    """newest <lastmod> (YYYY-MM-DD) in the first sitemap we can read (robots Sitemap: lines, else /sitemap.xml)."""
    for sm in (sitemaps or [])[:2] + [base + '/sitemap.xml', base + '/sitemap_index.xml']:
        try:
            s, _, _, b, _ = get(sm, timeout=10, cap=3_000_000, accept='application/xml,text/xml,*/*')
        except Exception:
            continue
        if s != 200:
            continue
        lm = re.findall(r'<lastmod>\s*(\d{4}-\d{2}-\d{2})', b.decode('utf-8', 'replace'))
        lm = [x for x in lm if x <= TODAY]
        if lm:
            return max(lm), sm
        return None, sm
    return None, None


# ---------------------------------------------------------------------------------------------------------- one domain
def check(d, st):
    """st: private state for this domain (robots, rdap, sitemap with dates). Returns (public health, identifiers, new state)."""
    st = dict(st or {})
    h = {'ck': TODAY}
    ids = {}
    week_old = lambda k: not st.get(k + '_at') or st[k + '_at'] < (NOW - timedelta(days=7)).strftime('%Y-%m-%d')
    # DNS (Cloudflare DNS over HTTPS: no request to the site itself)
    a = doh(d, 'A')
    if a == []:   # no address on the bare domain: the site may live on www only
        a = doh('www.' + d, 'A')
    ns = doh(d, 'NS') or []
    if a is None:   # the DNS lookup itself failed: today is not checked
        h['s'] = None
        return h, ids, st
    h['dns'] = 1 if a else 0
    # robots.txt (weekly)
    base = None
    for cand in ('https://' + d, 'https://www.' + d):
        if base:
            break
        if not week_old('rb') and st.get('base'):
            base = st['base']
            break
        try:
            s, fu, _, b, _ = get(cand + '/robots.txt', timeout=10, cap=500_000, accept='text/plain,*/*')
            base = cand
            rp = urllib.robotparser.RobotFileParser()
            rp.parse(b.decode('utf-8', 'replace').splitlines() if s == 200 else [])
            st['rb'] = 0 if rp.can_fetch(UA_TOKEN, cand + '/') else 1
            st['sms'] = (rp.site_maps() or [])[:2] if s == 200 else []
            st['rb_at'] = TODAY
            st['base'] = base
        except Exception:
            continue
    if not base:
        base = 'https://' + d
    blocked = st.get('rb') == 1
    h['rb'] = 1 if blocked else 0
    # homepage: one request
    if not blocked and a:
        try:
            s, fu, hd, b, sec = get(base + '/')
            h['s'] = s
            h['ms'] = int(sec * 1000)
            fh = urllib.parse.urlparse(fu).hostname or ''
            if reg_domain(fh) != d:
                h['to'] = reg_domain(fh)   # the homepage now redirects to another domain
            lm = hd.get('Last-Modified') or hd.get('last-modified')
            if lm:
                try:
                    h['lm'] = datetime.strptime(lm, '%a, %d %b %Y %H:%M:%S GMT').strftime('%Y-%m-%d')
                except Exception:
                    pass
            if s < 400 and b:
                ctype = (hd.get('Content-Type') or hd.get('content-type') or '')
                if 'html' in ctype or b[:200].lstrip().lower().startswith((b'<!doctype', b'<html')):
                    ids, gen = fingerprint(b.decode('utf-8', 'replace'))
                    if gen:
                        h['gen'] = re.sub(r'[^\w .:/()-]', '', gen)[:60]
        except Exception as e:
            if LOCAL:
                h['s'] = None
                h['err'] = 'local'
                return h, ids, st
            h['s'] = 0
            h['err'] = 'timeout' if 'timed out' in str(e).lower() else 'tls' if 'ssl' in str(e).lower() or 'certificate' in str(e).lower() else 'connect'
    elif not a:
        h['s'] = 0
        h['err'] = 'dns'
    # TLS certificate of the host that serves the homepage
    host = urllib.parse.urlparse(base).hostname or d
    if a and not LOCAL:
        na, san = tls_cert(host)
        if na:
            h['ce'] = na
        others = sorted({reg_domain(x) for x in san} - {d})
        if others:
            ids['cert'] = others   # other domains on the same certificate: compared with our tracked domains in main()
    # name servers and address (compared across domains in main(); platforms dropped)
    nsc = [x for x in ns if not NS_PLATFORM.search(x)]
    if nsc and len(nsc) == len(ns):
        ids['ns'] = ['+'.join(sorted({reg_domain(x) for x in nsc}))]
    if a:
        ids['ip'] = a[:4]
    # RDAP expiry (weekly, or daily in the last 45 days before the stored date)
    if week_old('rd') or (st.get('de') and st['de'] <= (NOW + timedelta(days=45)).strftime('%Y-%m-%d')):
        de, why = rdap_expiry(d)
        st['de'], st['rd_why'], st['rd_at'] = de, why, TODAY
    if st.get('de'):
        h['de'] = st['de']
    # sitemap freshness (weekly)
    if not blocked and a and week_old('sm'):
        sm, smu = sitemap_newest(base, st.get('sms'))
        st['sm'], st['sm_at'] = sm, TODAY
    if st.get('sm'):
        h['sm'] = st['sm']
    return h, ids, st


# ---------------------------------------------------------------------------------------------------------- main
def day_code(h):
    """u: answered (status < 400), b: answered with 4xx (often a bot wall), x: server error 5xx, 0: no answer, -: not checked"""
    if h.get('rb'):
        return '-'
    s = h.get('s')
    if s is None:
        return '-'
    if s == 0:
        return '0'
    return 'u' if s < 400 else 'x' if s >= 500 else 'b'


def main():
    os.makedirs(OUT, exist_ok=True)
    src = get_json('https://kolaboro.com/api/x/fraud/domains?t=' + str(int(time.time())), timeout=40)
    if not src or not src.get('domains'):
        sys.exit('no domain list')
    # own websites only (m=1: the domain carries the developer's or the project's name); news sites, portals and studios we link are skipped
    D = {x['d']: x for x in src['domains'] if x.get('d') and x.get('url') and x.get('m') == 1}
    only = arg('--only')
    if only:
        D = {k: v for k, v in D.items() if k in set(only.split(','))}
    sp = arg('--state', os.path.join(OUT, 'dev-web-private.json'))
    try:
        state = json.load(open(sp))
    except Exception:
        state = {}
    prev = get_json('https://kolaboro.com/data/web-health.json?t=' + str(int(time.time()))) or {}
    prevD = prev.get('d') or {}
    prevDays = prev.get('days') or []
    res = {}
    t0 = time.time()
    with cf.ThreadPoolExecutor(32) as ex:
        fut = {ex.submit(check, d, state.get(d)): d for d in sorted(D)}
        for f in cf.as_completed(fut):
            d = fut[f]
            try:
                res[d] = f.result()
            except Exception as e:
                res[d] = ({'ck': TODAY, 's': None}, {}, state.get(d) or {})
    print('checked', len(res), 'domains in', int(time.time() - t0), 's')
    for d, (_, _, st) in res.items():
        state[d] = st
    json.dump(state, open(sp, 'w'))

    # ---- health with history
    answered = [h for h, _, _ in res.values() if h.get('s') not in (None,) and not h.get('rb')]
    down = sum(1 for h in answered if h.get('s') == 0)
    runner_ok = not answered or down / len(answered) < 0.5   # half the web unreachable means our runner had a network problem
    days = [x for x in prevDays if x != TODAY][-(DAYS - 1):] + [TODAY]
    H = {}
    for d in sorted(D):
        h = dict(res[d][0]) if d in res else {'ck': TODAY}
        p = prevD.get(d) or {}
        ph = p.get('h') or ''
        hist = {day: ph[i] for i, day in enumerate(prevDays) if i < len(ph)}
        hist[TODAY] = day_code(h) if runner_ok else '-'
        h['h'] = ''.join(hist.get(day, '-') for day in days)
        # streak: consecutive answered daily checks up to today, continued from the previous file
        c = hist[TODAY]
        if c in ('u', 'b'):
            h['st'] = (p.get('st') or 0) + 1 if prevDays and prevDays[-1] != TODAY else (p.get('st') or 1)
        elif c == '-':
            h['st'] = p.get('st') or 0
        else:
            h['st'] = 0
        if not runner_ok:
            for k in ('s', 'ms', 'err'):
                if k in p:
                    h[k] = p[k]
                else:
                    h.pop(k, None)
        if 'ce' not in h and p.get('ce') and (LOCAL or h.get('s') is None):
            h['ce'] = p['ce']   # certificate not read today: keep the last date we read
        h['dv'] = D[d]['url'].strip('/').split('/')[-1]
        H[d] = h
    health = {
        'version': 'web-health-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'), 'days': days,
        'runner_ok': runner_ok, 'n': len(H),
        'legend': {'h': 'one character per daily check, oldest first, matching days: u answered (HTTP status below 400), b answered with a 4xx status (often a bot wall), x server error (5xx), 0 no answer (DNS, connection, TLS or timeout), - not checked (robots.txt asks robots not to fetch the homepage, or our runner had a network problem that day)',
                   's': 'HTTP status of the homepage today (0 no answer)', 'ms': 'response time in milliseconds', 'st': 'consecutive daily checks with an answer',
                   'ce': 'TLS certificate expiry date (from the TLS handshake)', 'de': 'domain registration expiry date (registry RDAP, through the IANA bootstrap)',
                   'lm': 'Last-Modified header of the homepage', 'sm': 'newest <lastmod> in the site\'s sitemap', 'to': 'the homepage redirects to this other domain',
                   'rb': '1 when robots.txt asks robots not to fetch the homepage: we then only read DNS, the TLS certificate and RDAP', 'dns': '1 when the domain resolves', 'gen': 'generator meta tag',
                   'dv': 'developer page slug (/developers/<dv>/)'},
        'method': ('One request to the homepage per domain per day, user agent KolaboroResearchAgent, after reading robots.txt (weekly). '
                   'TLS expiry from the certificate the server presents; domain expiry from the registry RDAP record (weekly); sitemap weekly. No page text is kept.')
                  + (' This run was made outside the daily job, behind a network proxy: sites we could not reach are marked not checked, and certificate dates were not read.' if LOCAL else ''),
        'local_run': LOCAL,
        'source': 'https://kolaboro.com/api/x/fraud/domains (developer and project websites in /data/named.json)', 'licence': 'CC BY 4.0, Kolaboro',
        'd': H,
    }
    json.dump(health, open(os.path.join(OUT, 'web-health.json'), 'w'), separators=(',', ':'), ensure_ascii=False)

    # ---- shared identifiers between DIFFERENT developers
    import ipaddress
    CF = cf_ranges()
    idx = {}
    for d, (_, ids, _) in res.items():
        dev = D[d]['url'].strip('/').split('/')[-1]
        for t, vals in ids.items():
            for v in vals:
                if t == 'cert':
                    if v not in D:
                        continue   # only other domains we track count
                    k = (t, '+'.join(sorted([d, v])))
                    for dd in (d, v):
                        idx.setdefault(k, {})[dd] = D[dd]['url'].strip('/').split('/')[-1]
                    continue
                if t == 'ip':
                    try:
                        ip = ipaddress.ip_address(v)
                        if ip.is_private or any(ip in n for n in CF):
                            continue
                    except Exception:
                        continue
                idx.setdefault((t, v), {})[d] = dev
    groups, hubs = [], {}
    for (t, v), m in sorted(idx.items()):
        devs = sorted(set(m.values()))
        if len(devs) < 2:
            continue
        lim = HUB_TRACK if t in ('ga4', 'ua', 'gtm', 'gads', 'fbpx', 'hotjar', 'clarity', 'hubspot', 'tawk', 'intercom') else HUB
        if len(devs) > lim:
            hubs[t] = hubs.get(t, 0) + 1
            continue
        if t == 'ns' and not any(part in D for part in v.split('+')):
            hubs['ns_provider'] = hubs.get('ns_provider', 0) + 1
            continue
        if t == 'wptheme' and public_theme(v):
            hubs['wptheme_public'] = hubs.get('wptheme_public', 0) + 1
            continue
        if t == 'ip' and not dedicated(v):
            hubs['ip_shared_host'] = hubs.get('ip_shared_host', 0) + 1
            continue
        if t == 'cert':
            v = 'TLS certificate'
        groups.append({'t': t, 'v': v, 'd': sorted(m), 'dv': devs})
    merged = {}
    for g in groups:
        k = (g['t'], tuple(g['d']))
        if k in merged:
            merged[k]['v'] += ', ' + g['v']
        else:
            merged[k] = g
    groups = list(merged.values())
    by_t = {}
    for g in groups:
        by_t[g['t']] = by_t.get(g['t'], 0) + 1
    links = {
        'version': 'dev-links-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'domains_checked': len(res), 'domains_read': sum(1 for h, ids, _ in res.values() if ids), 'groups_by_type': by_t, 'hub_identifiers_dropped': hubs,
        'types': {'ga4': 'Google Analytics 4 measurement id', 'ua': 'Google Universal Analytics property id', 'gtm': 'Google Tag Manager container id',
                  'gads': 'Google Ads conversion id', 'fbpx': 'Meta (Facebook) pixel id', 'hotjar': 'Hotjar site id', 'clarity': 'Microsoft Clarity project id',
                  'hubspot': 'HubSpot portal id', 'tawk': 'Tawk.to chat property id', 'intercom': 'Intercom app id', 'wptheme': 'custom WordPress theme folder (themes in the WordPress.org directory and known commercial themes excluded)',
                  'skeleton': 'identical HTML skeleton of the homepage (tag and class names, no text; SHA-256, first 16 hex)', 'cert': 'one TLS certificate names both domains',
                  'ns': 'name servers run on another tracked developer domain', 'ip': 'the same server IP address with a reverse name that is not a hosting platform (Cloudflare, cloud, CDN and shared hosting excluded)'},
        'rule': 'Only identifiers carried by two or more different developers. Analytics and chat ids shared by more than %d developers, and templates, certificates, name servers or IPs shared by more than %d, are dropped as platforms or shared hosting.' % (HUB_TRACK, HUB),
        'caveat': 'A shared id usually means the same marketing agency, web studio or hosting account, not the same owner. It is a public fact to ask about, not a finding.',
        'method': 'Read once per day per domain from the public homepage source (robots.txt respected), its DNS records (Cloudflare DNS over HTTPS) and the TLS certificate it presents. No personal data, no page text.',
        'source': 'https://kolaboro.com/api/x/fraud/domains', 'licence': 'CC BY 4.0, Kolaboro',
        'groups': groups,
    }
    json.dump(links, open(os.path.join(OUT, 'dev-links.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    print('groups', len(groups), by_t, 'hubs', hubs, 'runner_ok', runner_ok)


if __name__ == '__main__':
    main()
