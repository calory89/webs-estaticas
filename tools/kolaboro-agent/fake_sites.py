#!/usr/bin/env python3
"""Kolaboro fake-site watch (batch 19, n19a). No model calls, no cost beyond the runner.

Usage: fake_sites.py OUT_DIR [--state STATE.json] [--only dom1,dom2] [--ct-labels N] [--sweep-all]

Looks every day for websites that imitate the developer and project websites in Kolaboro's named project data
(https://kolaboro.com/api/x/fraud/domains: registrable domains we link for exactly one developer or project):
  1. Certificate Transparency: new TLS certificates whose names contain one of those website names. The public crt.sh
     PostgreSQL interface (one batched full-text query per 20 names, certificates issued in the last 3 days) when it answers,
     else the crt.sh JSON prefix search (name%) for a rotating share of the names (one request every 4 s).
  2. Registered lookalike names: the same name with another ending, one or two letters changed, letters that look alike
     (0 for o, rn for m, Cyrillic a), and added words such as -sales, -invest or -official. Checked in public DNS (DNS over
     HTTPS, Cloudflare and Google) for a fourteenth of the websites each day, so every website is swept every two weeks.
For each lookalike that exists: registration date (registry RDAP via the IANA bootstrap), first certificate date (crt.sh,
whether the name resolves to an address today, and its name servers.
Published (kolaboro.com/data/lookalikes.json): lookalikes registered, or first given a certificate, in the last 365 days.
Left out: names whose own custom name servers are the official website's (most likely the same owner), and names we link
for any developer. Facts only: a lookalike name is not proof of anything; many belong to agents, fans or the developer.
We never open the lookalike websites: only DNS, RDAP and Certificate Transparency records are read.
Private state (negative DNS results, enrichment cache) lives in the Actions cache only.
"""
import json, os, re, sys, time, hashlib, shutil, subprocess, unicodedata, urllib.request, urllib.parse, concurrent.futures as cf
from datetime import datetime, timezone, timedelta

UA = 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/data-policy)'
NOW = datetime.now(timezone.utc)
T0 = time.time()
BUDGET_S = 6 * 60   # the whole run stays under the workflow's 20 minutes


def past(f):
    return time.time() - T0 > BUDGET_S * f
TODAY = NOW.strftime('%Y-%m-%d')
WINDOW = 365          # published: registered or first certificate within this many days
ARGS = sys.argv[1:]
OUT = ARGS[0] if ARGS and not ARGS[0].startswith('--') else 'out'


def arg(name, d=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS and ARGS.index(name) + 1 < len(ARGS) else d


def get(url, timeout=20, cap=20_000_000, accept='application/json'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
    try:
        r = urllib.request.urlopen(req, timeout=timeout)
        return r.status, r.read(cap)
    except urllib.error.HTTPError as e:
        return e.code, b''


def get_json(url, timeout=20, accept='application/json, application/rdap+json'):
    try:
        s, b = get(url, timeout=timeout, accept=accept)
        return json.loads(b.decode('utf-8', 'replace')) if s == 200 else None
    except Exception:
        return None


# ------------------------------------------------------------------------------------------------ names
SLD = {'co', 'com', 'net', 'org', 'or', 'ac', 'go', 'web', 'my', 'biz', 'gov', 'edu', 'ne', 'in', 'sch', 'ltd', 'plc', 'gen', 'firm', 'gr', 'me'}


def reg_domain(h):
    p = (h or '').lower().strip().lstrip('*.').rstrip('.').split('.')
    p = p[1:] if p and p[0] == 'www' else p
    if len(p) <= 2:
        return '.'.join(p)
    return '.'.join(p[-3:] if p[-2] in SLD and len(p[-1]) == 2 else p[-2:])


def label_of(d):
    return d.split('.')[0]


def suffix_of(d):
    return d[len(label_of(d)) + 1:]


CF = {'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ɡ': 'g', 'һ': 'h',
      'ӏ': 'l', 'ո': 'n', 'ս': 'u', 'α': 'a', 'ο': 'o', 'ν': 'v', 'ρ': 'p', 'τ': 't', 'κ': 'k', 'ι': 'i', 'ε': 'e', 'ı': 'i', 'ł': 'l'}


def skel(s):
    """The same 'letters that look alike' skeleton as the payment email check (/tools/payment-email-check/pec.js)."""
    s = ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c))
    s = ''.join(CF.get(c, c) for c in s)
    s = s.replace('rn', 'm').replace('vv', 'w').replace('cl', 'd').replace('0', 'o')
    s = re.sub(r'[1|!i]', 'l', s)
    return s.replace('5', 's').replace('3', 'e').replace('@', 'a').replace('-', '')


def osa(a, b):
    m, n = len(a), len(b)
    if abs(m - n) > 2:
        return 9
    d = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        d[i][0] = i
    for j in range(n + 1):
        d[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            c = 0 if a[i - 1] == b[j - 1] else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c)
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[m][n]


def puny_to_uni(d):
    try:
        return '.'.join(x.encode('ascii').decode('idna') if x.startswith('xn--') else x for x in d.split('.'))
    except Exception:
        return d


# words fraudsters add to a real name (and that legitimate agents and resellers use too: a match is a resemblance, not a finding)
WORDS = ['sales', 'invest', 'investment', 'investments', 'official', 'group', 'properties', 'realty', 'payment', 'payments', 'pay',
         'booking', 'residences', 'offplan', 'developments', 'homes', 'ltd', 'llc', 'uk', 'global', 'intl', 'online', 'office', 'buy']
PREFIX = ['official', 'my', 'buy', 'invest', 'www', 'the', 'get']
TLDS = ['com', 'net', 'org', 'co', 'io', 'info', 'biz', 'online', 'site', 'store', 'xyz', 'top', 'live', 'group', 'homes', 'properties',
        'property', 'estate', 'realestate', 'ae', 'es', 'pt', 'co.uk', 'uk', 'eu', 'de', 'fr', 'it', 'me', 'us', 'id', 'co.id', 'com.my',
        'co.th', 'com.mx', 'com.tr', 'ph', 'vn', 'cy', 'gr', 'asia', 'global', 'world', 'cc', 'ws', 'ltd', 'llc', 'agency', 'sale',
        'house', 'villas', 'luxury', 'capital', 'finance', 'invest', 'investments', 'pro', 'app', 'one', 'today', 'icu', 'shop', 'vip']
# names too generic to watch: a lookalike of 'living.com' or 'emerge.com' says nothing
GENERIC = set('living homes house villas villa resort tower towers group realty estate property properties capital invest residence '
              'residences city park garden gardens marina beach ocean island bay view vista luxury prime royal grand golden green urban '
              'emerge pillar native modern nova vida casa terra alpha omega horizon summit legacy elite select premier global'.split())

GLYPH = {'o': ['0'], 'l': ['1', 'i'], 'i': ['1', 'l'], 'e': ['3'], 's': ['5'], 'm': ['rn'], 'w': ['vv'], 'd': ['cl'], 'a': ['а'], 'c': ['с'], 'p': ['р']}


def permutations(d):
    L, S = label_of(d), suffix_of(d)
    out = set()
    for t in TLDS:
        if t != S:
            out.add(L + '.' + t)
    for s in {S, 'com'}:
        for w in WORDS:
            out.add(L + '-' + w + '.' + s)
            out.add(L + w + '.' + s)
        for w in PREFIX:
            out.add(w + L + '.' + s)
            out.add(w + '-' + L + '.' + s)
    for i in range(len(L)):           # one letter dropped, doubled, swapped with the next; lookalike letters
        if L[i] != '-':
            out.add(L[:i] + L[i + 1:] + '.' + S)
            out.add(L[:i] + L[i] + L[i:] + '.' + S)
        if i + 1 < len(L) and L[i] != L[i + 1]:
            out.add(L[:i] + L[i + 1] + L[i] + L[i + 2:] + '.' + S)
        for g in GLYPH.get(L[i], []):
            x = L[:i] + g + L[i + 1:]
            try:
                x = x.encode('idna').decode('ascii') if any(ord(c) > 127 for c in x) else x
            except Exception:
                continue
            out.add(x + '.' + S)
    if '-' in L:
        out.add(L.replace('-', '') + '.' + S)
    out.discard(d)
    return {x for x in out if re.match(r'^[a-z0-9-]{3,63}(\.[a-z]{2,24}){1,2}$', x) and not x.startswith('-') and '--' not in x.split('.')[0][2:4]}


def why(cand, off):
    """How cand (a registrable domain) resembles off, or None. Same rules as the payment email check."""
    if cand == off:
        return None
    sl, ol = label_of(puny_to_uni(cand)), label_of(off)
    if len(ol.replace('-', '')) < 5:
        return None
    if sl == ol and suffix_of(cand) != suffix_of(off):
        return 'tld'
    if sl.replace('-', '') == ol.replace('-', ''):
        return 'hyphen'
    if skel(ol) == skel(sl):
        return 'glyph'
    if len(ol) >= 5 and osa(sl, ol) <= (2 if len(ol) >= 9 else 1):
        return 'typo'
    if len(ol) >= 5 and re.search(r'(^|-)' + re.escape(ol) + r'(-|$)', sl):
        return 'word'
    if len(ol) >= 7 and ol in sl:
        return 'contains'
    return None


# ------------------------------------------------------------------------------------------------ DNS / RDAP / CT
def doh(name, typ, i=0):
    urls = ['https://cloudflare-dns.com/dns-query?name=%s&type=%s', 'https://dns.google/resolve?name=%s&type=%s']
    for k in (i % 2, 1 - i % 2):
        j = get_json(urls[k] % (urllib.parse.quote(name), typ), timeout=10, accept='application/dns-json')
        if j and j.get('Status') in (0, 3):
            code = {'A': 1, 'NS': 2, 'AAAA': 28, 'CNAME': 5}[typ]
            return j['Status'], sorted({a['data'].rstrip('.').lower() for a in j.get('Answer') or [] if a.get('type') == code})
    return None, None


def exists(name, i=0):
    """True: delegated (NS records), False: NXDOMAIN or no NS, None: lookup failed."""
    st, ns = doh(name, 'NS', i)
    if st is None:
        return None
    return bool(ns)


_BOOT = {}
_RDAP_LAST = {}


def rdap(d):
    """(registration date YYYY-MM-DD or None, status) from the registry's RDAP server; at most one request per second per server."""
    if not _BOOT:
        for tlds, urls in (get_json('https://data.iana.org/rdap/dns.json') or {}).get('services', []):
            u = next((x for x in urls if x.startswith('https')), urls[0] if urls else None)
            for t in tlds:
                _BOOT[t.lower()] = u
    base = _BOOT.get(d.rsplit('.', 1)[-1])
    if not base:
        return None, 'no_rdap'
    with _RDAP_LOCK:
        nxt = max(time.time(), _RDAP_LAST.get(base, 0) + 1.0)
        _RDAP_LAST[base] = nxt
    if nxt > time.time():
        time.sleep(nxt - time.time())
    j = get_json(base.rstrip('/') + '/domain/' + d)
    if not j:
        return None, 'not_found'
    for ev in j.get('events') or []:
        if (ev.get('eventAction') or '').lower() == 'registration' and ev.get('eventDate'):
            return ev['eventDate'][:10], 'ok'
    return None, 'no_date'


_CRT_LAST = [0.0]
import threading
_CRT_LOCK = threading.Lock()
_RDAP_LOCK = threading.Lock()


def crt_json(q, timeout=60, tries=2, live_only=True):
    if live_only and past(0.4):   # label scans stop early; the per-site lookups below keep their own limit
        return None
    with _CRT_LOCK:
        wait = 4.0 - (time.time() - _CRT_LAST[0])
        if wait > 0:
            time.sleep(wait)
        _CRT_LAST[0] = time.time()
    for _ in range(tries):
        try:
            s, b = get('https://crt.sh/?q=' + urllib.parse.quote(q) + '&output=json' + ('&exclude=expired' if live_only else ''), timeout=timeout)
            if s == 200:
                return json.loads(b.decode('utf-8', 'replace') or '[]')
        except Exception:
            pass
        time.sleep(6)
    return None


def crt_json_all(d):
    """Every certificate crt.sh holds for d and its subdomains, expired ones included (None if crt.sh did not answer)."""
    return crt_json(d, timeout=40, tries=2, live_only=False)


def certspotter(d):
    """Start date of the newest current certificate for d (Cert Spotter, public CT monitor), or None."""
    j = get_json('https://api.certspotter.com/v1/issuances?domain=' + urllib.parse.quote(d) + '&include_subdomains=true', timeout=20)
    ds = sorted((x.get('not_before') or '')[:10] for x in j if x.get('not_before')) if isinstance(j, list) else []
    return ds[-1] if ds else None


def ct_db(labels, budget_s=60):
    """[(name, not_before)] from the crt.sh PostgreSQL interface, certificates issued in the last 3 days; None if unreachable.
    The guest interface is shared and slow: at most budget_s seconds in total, 45 s per query, batches rotate by day."""
    if not shutil.which('psql') or os.environ.get('CT_DB', '1') == '0':
        return None, 'no psql'
    out, done, t0 = [], 0, time.time()
    B = [labels[i:i + 25] for i in range(0, len(labels), 25)]
    k = NOW.toordinal() % max(1, len(B))
    B = B[k:] + B[:k]
    for b in B:
        left = budget_s - (time.time() - t0)
        if left < 20:
            break
        q = ' | '.join(re.sub(r'[^a-z0-9]', '', x) for x in b if re.sub(r'[^a-z0-9]', '', x))
        sql = ("SELECT DISTINCT lower(cai.name_value), to_char(x509_notBefore(cai.certificate), 'YYYY-MM-DD') FROM certificate_and_identities cai "
               "WHERE to_tsquery('certwatch', '" + q + "') @@ identities(cai.certificate) AND x509_notBefore(cai.certificate) >= now() - interval '3 days' "
               "AND cai.name_type IN ('2.5.4.3', 'san:dNSName') LIMIT 5000;")
        try:
            r = subprocess.run(['psql', '-h', 'crt.sh', '-p', '5432', '-U', 'guest', '-d', 'certwatch', '-At', '-F', '\t', '-v', 'ON_ERROR_STOP=1', '-c', 'SET statement_timeout = 45000;', '-c', sql],
                               capture_output=True, text=True, timeout=min(60, left), env=dict(os.environ, PGCONNECT_TIMEOUT='10'))
        except Exception:
            if not done:
                break                    # the first query did not come back: do not wait on the others
            continue
        if r.returncode != 0:
            if not done:
                print('crt.sh db:', (r.stderr or '')[:160])
                break
            continue
        done += 1
        for line in r.stdout.splitlines():
            p = line.split('\t')
            if len(p) == 2 and p[1]:
                out.append((p[0], p[1]))
    return (out if done else None), '%d of %d batches' % (done, len(B))


# ------------------------------------------------------------------------------------------------ main
def main():
    os.makedirs(OUT, exist_ok=True)
    state_path = arg('--state')
    state = {}
    if state_path and os.path.exists(state_path):
        try:
            state = json.load(open(state_path))
        except Exception:
            state = {}
    neg = state.get('neg', {})          # name -> date last seen not registered
    enr = state.get('enr', {})          # domain -> enrichment cache
    prev = get_json('https://kolaboro.com/data/lookalikes.json?v=' + TODAY) or {}
    old = {x['d']: x for x in prev.get('items', [])}

    lst = get_json('https://kolaboro.com/api/x/fraud/domains?v=' + TODAY, timeout=60)
    if not lst or not lst.get('domains'):
        sys.exit('domain list unavailable')
    official = {x['d']: x for x in lst['domains']}
    shared = set(lst.get('shared') or [])
    only = set((arg('--only') or '').split(',')) - {''}
    watch = [d for d in official if (not only or d in only) and len(label_of(d).replace('-', '')) >= 5 and label_of(d).replace('-', '') not in GENERIC]
    print('official', len(official), 'watched', len(watch))

    found = {}   # candidate domain -> {o, why, src, cert}

    def add(cand, off, src, cert=None):
        if cand in official or cand in shared:
            return
        w = why(cand, off)
        if not w:
            return
        e = found.get(cand)
        if not e:
            found[cand] = e = {'o': off, 'why': w, 'src': src, 'cert': cert}
        elif cert and (not e.get('cert') or cert < e['cert']):
            e['cert'] = cert

    by_label = {}
    for d in watch:
        by_label.setdefault(re.sub(r'[^a-z0-9]', '', label_of(d)), []).append(d)

    def match_host(h, cert=None, src='ct'):
        rd = reg_domain(h)
        if not rd or rd in official or rd in shared:
            return
        lab = re.sub(r'[^a-z0-9]', '', label_of(puny_to_uni(rd)))
        for L, ds in by_label.items():
            if L in lab or (abs(len(L) - len(lab)) <= 2 and skel(L) == skel(lab)):
                for o in ds:
                    add(rd, o, src, cert)

    # 1. Certificate Transparency
    ct = {'db': 'not tried', 'json_queries': 0, 'json_failed': 0, 'names': 0}
    rows, ct['db_batches'] = ct_db(sorted(by_label)) if not only else (None, 'skipped')
    if rows is not None:
        ct['db'] = 'ok'
        ct['names'] = len(rows)
        for name, nb in rows:
            match_host(name, nb)
    else:
        ct['db'] = 'unavailable' if not only else 'skipped'
    n_json = int(arg('--ct-labels', '5' if rows is not None else '15'))
    labels = sorted(by_label, key=lambda L: hashlib.sha256((L + TODAY).encode()).hexdigest())[:n_json]
    for L in labels:
        a = crt_json(L + '%', timeout=45, tries=1)   # names that start with the website's name (crt.sh answers prefix searches)
        ct['json_queries'] += 1
        if a is None:
            ct['json_failed'] += 1
            continue
        for x in a:
            for h in (x.get('name_value') or '').split('\n'):
                ct['names'] += 1
                match_host(h, (x.get('not_before') or '')[:10] or None)

    # 2. Registered lookalike names (a fourteenth of the websites per day, or all with --sweep-all / --only)
    day = NOW.toordinal() % 14
    sweep = [d for d in watch if only or '--sweep-all' in ARGS or int(hashlib.sha256(d.encode()).hexdigest(), 16) % 14 == day]
    cands = []
    for d in sweep:
        for p in sorted(permutations(d)):
            if p in official or p in shared:
                continue
            ng = neg.get(p)
            if ng and (NOW - datetime.fromisoformat(ng + 'T00:00:00+00:00')).days < 6:
                continue
            cands.append((p, d))
    print('t', round(time.time() - T0), 'ct names', ct['names'], 'from ct', len(found), 'dns candidates', len(cands), 'from', len(sweep), 'websites')
    dns_fail = 0
    with cf.ThreadPoolExecutor(24) as ex:
        res = list(ex.map(lambda t: (t[1][0], t[1][1], exists(t[1][0], t[0])), enumerate(cands)))
    for p, d, ok in res:
        if ok is None:
            dns_fail += 1
        elif ok:
            add(p, d, 'dns')
        else:
            neg[p] = TODAY
    # previously published lookalikes are re-checked every day
    for dname, x in old.items():
        if dname not in found and x.get('o') in official:
            found[dname] = {'o': x['o'], 'why': x.get('why') or why(dname, x['o']) or 'word', 'src': x.get('src', 'dns'), 'cert': x.get('cert')}

    # 3. Facts about each lookalike: registration (RDAP), certificates, resolves today, name servers (6 at a time, RDAP 1/s per registry)
    def ns_of(d):
        st, ns = doh(d, 'NS')
        return ns or []

    budget = int(arg('--enrich', '600'))
    todo = []
    for cand, e in sorted(found.items(), key=lambda kv: (kv[0] not in old, kv[1]['src'] != 'ct', kv[0])):
        c = enr.get(cand)
        age = (NOW - datetime.fromisoformat(c['at'] + 'T00:00:00+00:00')).days if c else 99
        recent_reg = bool(c and c.get('reg')) and (NOW.date() - datetime.strptime(c['reg'], '%Y-%m-%d').date()).days <= WINDOW
        if age >= 7 or (recent_reg and not c.get('cert') and age >= 1 and not c.get('crt_ok')):
            todo.append(cand)
    todo = todo[:budget]

    def enrich(cand):
        if past(0.85):
            return
        e = found[cand]
        reg, rst = rdap(cand)
        if e.get('cert'):
            cert, first = e['cert'], False
        elif reg and (NOW.date() - datetime.strptime(reg, '%Y-%m-%d').date()).days > WINDOW:
            cert, first = None, False        # registered long ago: not published, no certificate lookup needed
        else:
            a = crt_json_all(cand)           # full certificate history: the earliest one stands in for the registration date
            ds = sorted(d for d in ((x.get('not_before') or '')[:10] for x in (a or [])) if d and (not reg or d >= reg))   # since this registration
            cert, first = (ds[0], True) if ds else (None, a is not None)
            if a is None:                    # crt.sh did not answer: the current certificate from Cert Spotter (not the first one)
                cert = certspotter(cand)
        enr[cand] = {'at': TODAY, 'reg': reg, 'rst': rst, 'cert': cert, 'first': first, 'ns': ns_of(cand), 'crt_ok': first}
    rdap('example.com')   # loads the IANA bootstrap once before the threads start
    with cf.ThreadPoolExecutor(6) as ex:
        list(ex.map(enrich, todo))
    print('t', round(time.time() - T0), 'enriched', len(todo), 'of', len(found))

    off_ns = {o: ns_of(o) for o in {e['o'] for e in found.values()}}

    def facts(cand):
        c = enr.get(cand)
        if not c:
            return None
        st, a = doh(cand, 'A')
        if not a:
            st, a = doh('www.' + cand, 'A')
        return c, bool(a), exists(cand) is not False
    with cf.ThreadPoolExecutor(16) as ex:
        F = dict(zip(list(found), ex.map(facts, list(found))))
    items = []
    for cand, e in sorted(found.items()):
        if not F.get(cand):
            continue
        c, live, alive = F[cand]
        o = e['o']
        same_ns = bool(c.get('ns')) and set(c['ns']) == set(off_ns.get(o) or []) and not PLATFORM_NS.search(' '.join(c['ns']))
        cert = e.get('cert') or c.get('cert')
        new_ct = e.get('src') == 'ct' and e.get('cert') and not c.get('reg')
        when = c.get('reg') or (cert if (c.get('first') or new_ct) else None)
        recent = bool(when) and (NOW.date() - datetime.strptime(when, '%Y-%m-%d').date()).days <= WINDOW
        if same_ns or not recent:
            continue
        oi = official[o]
        it = {'d': cand, 'u': puny_to_uni(cand) if puny_to_uni(cand) != cand else None, 'o': o, 'dv': oi.get('dv'), 'url': oi.get('url'), 'why': e['why'],
              'reg': c.get('reg'), 'cert': cert, 'cert_first': bool(c.get('first')) and not e.get('cert'), 'res': live, 'reg_src': c.get('rst'),
              'seen': (old.get(cand) or {}).get('seen') or TODAY, 'src': e.get('src'), 'chk': TODAY}
        if not alive:
            it['gone'] = (old.get(cand) or {}).get('gone') or TODAY
        items.append(it)
    items.sort(key=lambda x: (x.get('reg') or x.get('cert') or '', x['d']), reverse=True)

    ws = {}
    for d in watch:
        ws.setdefault(official[d].get('url') or '', []).append(d)
    ws.pop('', None)
    outj = {
        'version': 'lookalikes-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'), 'n': len(items),
        'watched': len(watch), 'official': len(official), 'window_days': WINDOW,
        'note': 'Websites whose names resemble a developer or project website in Kolaboro\'s named project data, registered or first given a TLS certificate in the last 365 days. A resemblance is a fact about the name only: many such sites belong to agents, resellers, fans or the developer itself. We never open them; we read DNS, registry RDAP and Certificate Transparency records.',
        'why': {'tld': 'same name, different ending', 'hyphen': 'same name with or without a hyphen', 'glyph': 'letters that look alike', 'typo': 'one or two letters different', 'word': 'the name plus another word', 'contains': 'contains the name'},
        'method': {'ct': ct, 'dns': {'websites_swept_today': len(sweep), 'names_checked': len(cands), 'lookup_failed': dns_fail}, 'rdap': 'IANA bootstrap, registry RDAP servers'},
        'sources': [
            {'name': 'crt.sh (Certificate Transparency logs search, Sectigo)', 'url': 'https://crt.sh/', 'licence': 'Certificate Transparency log data, public (RFC 6962)'},
            {'name': 'Cert Spotter API (SSLMate), when crt.sh does not answer', 'url': 'https://sslmate.com/certspotter/api/', 'licence': 'public Certificate Transparency data'},
            {'name': 'Registry RDAP (IANA bootstrap)', 'url': 'https://data.iana.org/rdap/dns.json', 'licence': 'public registration data'},
            {'name': 'Public DNS over HTTPS (Cloudflare 1.1.1.1, Google 8.8.8.8)', 'url': 'https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/', 'licence': 'public DNS'}],
        'w': ws,
        'items': items,
    }
    strip = lambda L: [{k: v for k, v in x.items() if k != 'chk'} for x in L]
    if prev.get('updated') and strip(items) == strip(prev.get('items', [])) and (NOW.date() - datetime.strptime(prev['updated'], '%Y-%m-%d').date()).days < 3:
        outj['unchanged'] = True
    json.dump(outj, open(os.path.join(OUT, 'lookalikes.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    if state_path:
        cut = (NOW - timedelta(days=30)).strftime('%Y-%m-%d')
        json.dump({'neg': {k: v for k, v in neg.items() if v >= cut}, 'enr': {k: v for k, v in enr.items() if v.get('at', '') >= cut}}, open(state_path, 'w'))
    print('published', len(items), 'lookalikes; ct', ct, 'dns failed', dns_fail)


PLATFORM_NS = re.compile(r'(cloudflare\.com|domaincontrol\.com|awsdns|googledomains|google\.com|wixdns|registrar-servers\.com|nsone\.net|'
                         r'azure-dns|hostinger|ultradns|name\.com|bluehost|hostgator|siteground|ionos|ui-dns|squarespacedns|shopify|webflow|'
                         r'vercel-dns|netlify|digitalocean|linode|ovh\.net|gandi\.net|hetzner|cloudns|dnsmadeeasy|akam|parkingcrew|sedoparking|'
                         r'bodis|afternic|dan\.com|porkbun|dreamhost|godaddy|secureserver|hichina|dnspod|alidns|webnic|one\.com|strato|aruba|'
                         r'tucows|enom|networksolutions|worldnic|markmonitor|csc|dynect|dns\.com|namebright|above\.com|uniregistry|park)', re.I)



if __name__ == '__main__':
    main()
