#!/usr/bin/env python3
"""Kolaboro developer intelligence: website age and promise drift, published per anonymous project id.

Usage: dev_intel.py OUT_DIR [--no-net]
Writes OUT_DIR/domain-age.json and OUT_DIR/promise-drift.json.

Projects stay anonymous on kolaboro.com, so nothing here publishes a domain, URL, developer name, permit number,
exact price or page text. Lookups are done here (privately) and only derived facts are published:
  domain-age.json     month the website domain was registered (RDAP, via the IANA bootstrap) and month of the first
                      TLS certificate logged in Certificate Transparency (crt.sh). Only for projects whose tracked page
                      is on the developer's or the project's own site; listing portals and agents are skipped, because
                      their domain age says nothing about the developer.
  promise-drift.json  what the developer page advertised on each day the research agent read it (data/runs/<day>.json,
                      the same daily copies whose SHA-256 fingerprints are sealed in Bitcoin), and every change of value.
"""
import json, os, re, sys, glob, time, urllib.request, urllib.parse, concurrent.futures as cf
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import agent  # noqa: E402  (PREFIX, FX: the same ids and currency table the public dataset uses)

TODAY = datetime.now(timezone.utc).strftime('%Y-%m-%d')
UA = {'User-Agent': 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/data-policy)', 'Accept': 'application/json, application/rdap+json'}
NET = '--no-net' not in sys.argv
T0 = time.time()

STOP = {'the', 'by', 'and', 'of', 'at', 'in', 'residences', 'residence', 'villas', 'villa', 'apartments', 'apartment', 'tower',
        'towers', 'group', 'developments', 'development', 'developers', 'developer', 'properties', 'property', 'real', 'estate',
        'pt', 'llc', 'ltd', 'inc', 'sa', 'de', 'cv', 'la', 'el', 'los', 'las', 'co', 'company', 'holding', 'holdings',
        'bali', 'dubai', 'phase', 'project', 'resort', 'homes', 'home', 'living', 'collection', 'investment', 'investments',
        'pcl', 'plc', 'tbk', 'jsc', 'gmbh', 'sl', 'sas', 'srl', 'spa', 'bv', 'ag', 'pty', 'sdn', 'bhd', 'kk', 'lp', 'llp', 'corp',
        'corporation', 'limited', 'realty', 'set', 'owner', 'operator', 'with', 'for', 'asset', 'management', 'construction'}


def toks(s):
    return {t for t in re.findall(r'[a-z0-9]+', (s or '').lower()) if t not in STOP and len(t) > 1}


def dom(u):
    """Registrable domain (example.com, example.co.uk)."""
    h = (urllib.parse.urlparse(u or '').hostname or '').lower()
    h = h[4:] if h.startswith('www.') else h
    p = h.split('.')
    n = 3 if len(p) >= 3 and len(p[-1]) == 2 and p[-2] in ('com', 'co', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go') else 2
    return '.'.join(p[-n:])


def load(p, d):
    try:
        return json.load(open(p))
    except Exception:
        return d


def projects():
    return load(os.path.join(HERE, 'projects.json'), {})['projects'] + load(os.path.join(HERE, 'projects-world.json'), {}).get('projects', [])


def public_ids(P):
    """slug -> public id, exactly as agent.public_cases numbers them (file order, Bali first, a counter per market)."""
    out, n = {}, {}
    for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):
        mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
        out[p['slug']] = '%s-%03d' % (agent.PREFIX.get(mk, mk[:3].upper()), n[mk])
    return out


# ---------- website age ----------

def same_dev(p, q):
    a, b = toks(p.get('developer')), toks(q.get('developer'))
    return bool(a and b and (a & b))


def same_proj(p, q):
    a, b = toks(p.get('name')), toks(q.get('name'))
    return bool(a and b) and len(a & b) / min(len(a), len(b)) >= 0.6


GENERIC = ('realestate', 'properties', 'property', 'development', 'developments', 'developer', 'developers', 'residences', 'residence',
           'villas', 'villa', 'homes', 'home', 'group', 'living', 'official', 'project', 'resorts', 'resort', 'hotels', 'the', 'estate',
           'real', 'land', 'invest', 'bali', 'dubai', 'world', 'global', 'grupo', 'inmobiliaria', 'desarrollos', 'construction', 'build')


def own_site(p, portals):
    """The tracked page is on the developer's or the project's own website: the domain is not shared with other developers'
    projects, and its first label is made of words (4+ letters) of the developer, project name or slug, plus generic words
    (homes, residences, group...), with at most 4 letters left over. A news site or agent whose name merely contains a
    project word (e.g. <place>business.com) is not counted."""
    d = dom(p.get('url'))
    if not d or d in portals:
        return False
    label = re.sub(r'[^a-z0-9]', '', d.split('.')[0])
    dev = (p.get('developer') or '').split('(')[0]
    if dev.lower().startswith('not named'):
        dev = ''
    own = toks(dev) | toks((p.get('name') or '').split('(')[0]) | toks((p.get('slug') or '').replace('-', ' '))
    hit = [t for t in own if len(t) >= 4 and t in label]
    if not hit:
        return False
    rest = label
    for t in sorted(hit + list(GENERIC), key=len, reverse=True):
        rest = rest.replace(t, '')
    return len(rest) <= 4


def get_json(url, timeout=40, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return json.loads(r.read(8_000_000).decode('utf-8', 'replace'))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            last = e
        except Exception as e:
            last = e
        time.sleep(3 * (i + 1))
    raise RuntimeError(str(last)[:120])


_BOOT = {}


def rdap_base(tld):
    if not _BOOT:
        for tlds, urls in (get_json('https://data.iana.org/rdap/dns.json') or {}).get('services', []):
            u = next((x for x in urls if x.startswith('https')), urls[0] if urls else None)
            for t in tlds:
                _BOOT[t.lower()] = u
    return _BOOT.get(tld)


def rdap_registered(d):
    """(YYYY-MM-DD or None, status) from the registry's RDAP service."""
    base = rdap_base(d.rsplit('.', 1)[-1])
    if not base:
        return None, 'no RDAP service for this domain ending'
    try:
        j = get_json(base.rstrip('/') + '/domain/' + d)
    except Exception as e:
        return None, 'RDAP lookup failed'
    if not j:
        return None, 'not found in RDAP'
    for ev in j.get('events') or []:
        if (ev.get('eventAction') or '').lower() == 'registration' and ev.get('eventDate'):
            return ev['eventDate'][:10], 'ok'
    return None, 'RDAP gives no registration date'


def ct_first(d):
    """Earliest not_before of any certificate for the domain or its subdomains logged in Certificate Transparency."""
    j = None
    for i in range(3):   # crt.sh sometimes answers an empty list or 404 under load: only "none" after three tries
        try:
            j = get_json('https://crt.sh/?q=' + urllib.parse.quote(d) + '&output=json', timeout=45, tries=2)
        except Exception:
            j = 'failed'
        if j and j != 'failed':
            break
        time.sleep(6 * (i + 1))
    if j == 'failed':
        return None, 'crt.sh lookup failed'
    if not j:
        return None, 'no certificate logged'
    nb = sorted(x['not_before'][:10] for x in j if x.get('not_before'))
    return (nb[0], 'ok') if nb else (None, 'no certificate logged')


def domain_age(P, ids, prev):
    devs = {}
    for p in P:
        devs.setdefault(dom(p.get('url')), []).append(p)
    portals = {d for d, ps in devs.items() if any(not same_dev(x, y) and not same_proj(x, y) for x in ps for y in ps if x is not y)}
    own = {}
    for p in P:
        if own_site(p, portals):
            own.setdefault(dom(p['url']), []).append(p)
    cache = (prev or {}).get('_cache') or {}   # never published: stripped before writing (see main)
    res = {}

    deadline = T0 + float(os.environ.get('KB_LOOKUP_SECONDS', '1200'))   # lookups stop here; the next run continues from the cache

    def look(d):
        c = cache.get(d)
        if time.time() > deadline:
            return d, c or {}
        if c and c.get('checked', '') >= time.strftime('%Y-%m-%d', time.gmtime(time.time() - 7 * 86400)) and 'failed' not in (c.get('reg_status') or 'failed') + (c.get('ct_status') or 'failed'):
            return d, c
        if not NET:
            return d, c or {}
        r, rs = rdap_registered(d)
        time.sleep(0.5)
        t, ts = ct_first(d)
        return d, {'reg': r, 'reg_status': rs, 'ct': t, 'ct_status': ts, 'checked': TODAY}

    with cf.ThreadPoolExecutor(2) as ex:
        for d, c in ex.map(look, sorted(own)):
            res[d] = c
    out = {}
    for p in P:
        i = ids[p['slug']]
        f = (p.get('facts') or {}).get('developer_founded')
        f = int(f) if isinstance(f, (int, float)) and 1900 < f <= 2100 else None
        d = dom(p.get('url'))
        if d not in own:
            out[i] = {'site': 'third-party'}
            if f: out[i]['founded_claim'] = f
            continue
        c = res.get(d) or {}
        e = {'site': 'own'}
        if c.get('reg'): e['reg'] = c['reg'][:7]
        else: e['reg_note'] = c.get('reg_status') or 'not looked up yet'
        if c.get('ct'): e['ct'] = c['ct'][:7]
        else: e['ct_note'] = c.get('ct_status') or 'not looked up yet'
        if c.get('checked'): e['checked'] = c['checked']
        if f: e['founded_claim'] = f
        out[i] = e
    o = [v for v in out.values() if v['site'] == 'own']
    return {
        'updated': TODAY,
        'method': 'For each tracked project whose page is on the developer\'s or the project\'s own website, the domain registration '
                  'date from the registry\'s RDAP service (found through the IANA RDAP bootstrap) and the earliest TLS certificate for the '
                  'domain or any subdomain in Certificate Transparency logs (crt.sh). Dates are published to the month and the domain itself is '
                  'not published, because projects stay anonymous until verification is complete. Pages on listing portals, agents or news '
                  'sites are marked third-party: their domain age says nothing about the developer. A domain can be re-registered or bought '
                  'second-hand, so an old domain is not proof of an old company; a young one next to a long claimed history is a question to ask. '
                  'Certificate Transparency logging became mandatory in 2018, so certificates before then may be missing.',
        'source': 'RDAP / Certificate Transparency',
        'counts': {'projects': len(out), 'own_site': len(o), 'third_party': len(out) - len(o), 'domains': len(own),
                   'with_registration': sum(1 for v in o if v.get('reg')), 'with_certificate': sum(1 for v in o if v.get('ct')),
                   'with_founded_claim': sum(1 for v in out.values() if v.get('founded_claim'))},
        'projects': out,
        '_cache': res,
    }


# ---------- promise drift ----------

FIELDS = [('completion_year', 'Handover year'), ('price_from', 'Price from'), ('permit_claim', 'Permit or approval claimed'),
          ('permit_number', 'Permit number published'), ('escrow_or_guarantee', 'Deposit protection stated'),
          ('guaranteed_language', '"Guaranteed" return language'), ('advertised_yield_pct', 'Advertised yield %'),
          ('title_type', 'Title type'), ('lease_years_base', 'Lease years'), ('extension_promised', 'Lease extension promised'),
          ('plans_published', 'Site or floor plans shown')]
BOOLISH = {'permit_number', 'escrow_or_guarantee'}   # published as stated / not stated: the text itself could identify the project


def norm(k, v, cur):
    if v in ('', [], {}):
        v = None
    if k in BOOLISH:
        return None if v is None else True
    if k == 'price_from':
        if not isinstance(v, (int, float)) or v <= 0:
            return None
        fx = agent.FX.get((cur or '').upper())
        return round(v * fx) if fx else None   # USD, internal only: published as a percentage change
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    if isinstance(v, str):
        v = v.strip().lower()[:30] or None
    return v


def promise_drift(P, ids):
    files = sorted(glob.glob(os.path.join(HERE, 'data', 'runs', '*.json')))
    days = []
    obs = {}   # slug -> [(day, sha, {field: value})]
    for f in files:
        day = os.path.basename(f)[:10]
        try:
            L = json.load(open(f)).get('latest') or {}
        except Exception:
            continue
        days.append(day)
        for slug, r in L.items():
            if r.get('source') != 'ai' or r.get('checked') != day or not r.get('claims'):
                continue   # the page was not read that day (fetch failed or not tracked yet): no copy for that day
            c = r['claims']
            obs.setdefault(slug, []).append((day, (r.get('sha256') or r.get('hash') or '')[:16], {k: norm(k, c.get(k), c.get('currency')) for k, _ in FIELDS}))
    out = {}
    for p in P:
        slug = p['slug']; i = ids[slug]; o = obs.get(slug) or []
        if not o:
            continue
        changes = []
        for k, label in FIELDS:
            seg = []   # [value, first, last, sha_first]
            for day, sha, vals in o:
                v = vals[k]
                if seg and seg[-1][0] == v:
                    seg[-1][2] = day; seg[-1][4] = sha
                else:
                    seg.append([v, day, day, sha, sha])   # value, first day, last day, fingerprint on first day, on last day
            for a, b in zip(seg, seg[1:]):
                if not a[4] or not b[3] or a[4] == b[3]:
                    continue   # no page fingerprint on one side, or the same page text: a change in how we read it, not in the page
                ch = {'f': k, 'label': label, 'first_seen': b[1], 'last_seen': b[2], 'was_first': a[1], 'was_last': a[2], 'sha_from': a[4][:16], 'sha_to': b[3][:16]}
                if k == 'price_from':
                    if a[0] is None or b[0] is None:
                        ch.update({'from': None if a[0] is None else 'stated', 'to': None if b[0] is None else 'stated'})
                    else:
                        pct = round((b[0] - a[0]) / a[0] * 100, 1)
                        if abs(pct) < 1:
                            continue   # under 1%: currency rounding or conversion, not a new price
                        ch.update({'from': 'previous price', 'to': ('up ' if pct > 0 else 'down ') + str(abs(pct)) + '%', 'pct': pct})
                else:
                    ch.update({'from': a[0], 'to': b[0]})
                ch['reverted'] = any(s[0] == a[0] for s in seg[seg.index(b) + 1:])
                changes.append(ch)
        changes.sort(key=lambda x: (x['first_seen'], x['f']), reverse=True)
        out[i] = {'copies': len(o), 'first': o[0][0], 'last': o[-1][0], 'versions': len({s for _, s, _ in o if s}), 'changes': changes}
    return {
        'updated': TODAY,
        'days': days,
        'first_day': days[0] if days else None,
        'fields': [l for _, l in FIELDS],
        'not_tracked_daily': ['payment plan', 'deposit percentage'],
        'method': 'Every day the research agent reads each tracked developer page, fingerprints the text (SHA-256, sealed in Bitcoin with '
                  'the daily seal) and, when the text changed, re-extracts what the page advertises. This file compares the values day by day '
                  'and lists every change: the field, the old and new value, and the first and last day each value was seen. Prices are '
                  'shown as a percentage change, converted to US dollars at a fixed rate, and moves under 1% are ignored as rounding. Permit '
                  'numbers and deposit protection text are shown only as stated or not stated, because the text would identify the project. '
                  'Values are read by an AI model from the page text, so a change can also be a reading difference: a value that flips back '
                  'is marked as such. sha_from and sha_to are the first 16 characters of the page fingerprints before and after.',
        'counts': {'projects': len(out), 'with_changes': sum(1 for v in out.values() if v['changes']), 'changes': sum(len(v['changes']) for v in out.values())},
        'projects': out,
    }


def main():
    od = sys.argv[1]
    os.makedirs(od, exist_ok=True)
    P = projects(); ids = public_ids(P)
    pa = os.path.join(HERE, 'data', 'domain-age-private.json')
    da = domain_age(P, ids, load(pa, {}))
    json.dump({'_cache': da['_cache'], 'updated': TODAY}, open(pa, 'w'), indent=0, sort_keys=True)   # private cache, stays in this repo
    da.pop('_cache')
    json.dump(da, open(os.path.join(od, 'domain-age.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    pd = promise_drift(P, ids)
    json.dump(pd, open(os.path.join(od, 'promise-drift.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    print(json.dumps(da['counts']), json.dumps(pd['counts']), 'days', pd['days'])


if __name__ == '__main__':
    main()
