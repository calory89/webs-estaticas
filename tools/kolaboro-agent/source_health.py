#!/usr/bin/env python3
"""kolaboro.com source freshness monitor (n34a, batch 34, 21 Nov 2026).

Every source URL cited on a public project page (named.json: src, cl[i][3], url) is re-read on a rotation: each day one seventh of the
URLs (by a stable hash of the URL), so every source is read once a week. For each URL we keep: HTTP status of a GET (redirects
followed), final URL, SHA-256 of the visible text (scripts, styles and tags removed, whitespace collapsed), the date the text hash
last changed, and a link to an archived copy (our own archived developer page text where we hold one, an Internet Archive copy we
recorded in wayback.json, else the Internet Archive lookup for the URL). robots.txt is respected for our user agent; one request
per host at a time, at least 1 s apart. No model calls, no cookies, nothing personal.

Runs inside the existing daily developer-website job (kolaboro-devweb.yml), so no new workflow:
  source_health.py <out dir> [--all] [--prev <source-health.json>] [--named <named.json>] [--max N]
The previous public file is the state (downloaded from kolaboro.com when --prev is not given). Output: <out>/source-health.json.
"""
import hashlib, json, os, re, sys, threading, time, urllib.request, urllib.error, urllib.robotparser, gzip, zlib
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.parse import urlparse

ARGS = sys.argv[1:]
def opt(k, d=None):
    if k in ARGS:
        i = ARGS.index(k); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
ALL = '--all' in ARGS
if ALL: ARGS.remove('--all')
NEWONLY = '--new-only' in ARGS                 # read only URLs never read before (after new projects are added)
if NEWONLY: ARGS.remove('--new-only')
PREV, NAMED, MAXN = opt('--prev'), opt('--named'), int(opt('--max', '1600'))
OUT = ARGS[0] if ARGS else '.'
SITE = 'https://kolaboro.com'
UA = 'KolaboroSourceCheck/1.0 (+https://kolaboro.com/sources/health/)'
NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime('%Y-%m-%d')
DAYN = int(NOW.timestamp() // 86400)

def get_json(p, url):
    if p and os.path.exists(p): return json.load(open(p))
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA}), timeout=60) as r: return json.loads(r.read())
    except Exception: return None

named = get_json(NAMED, SITE + '/data/named.json')
if not named: sys.exit('named.json not readable')
prev = get_json(PREV, SITE + '/data/source-health.json') or {}
wb = get_json(None, SITE + '/data/wayback.json') or {}
hist_urls = set()
for i in range(3):
    h = get_json(None, SITE + '/data/page-history-%d.json' % i) or {}
    for pid, v in (h.get('projects') or {}).items():
        if v.get('url'): hist_urls.add((v['url'], pid))
OWN = {u: pid for u, pid in hist_urls}

# every cited URL and the projects citing it
cites = {}
for p in named['projects']:
    us = set(p.get('src') or [])
    for c in p.get('cl') or []:
        if len(c) > 3 and c[3]: us.add(c[3])
    if p.get('url'): us.add(p['url'])
    for u in us:
        if not isinstance(u, str) or not u.startswith('http'): continue
        cites.setdefault(u, []).append(p['s'])
U = sorted(cites)
old = {r[0]: r for r in (prev.get('u') or [])}   # [url, status, checked, text sha (16 hex), changed, first seen, archive kind, final host or '']
def slot(u): return int(hashlib.sha256(u.encode()).hexdigest()[:8], 16) % 7
todo = [u for u in U if (u not in old or (old[u][1] == 'n')) if NEWONLY] if NEWONLY else [u for u in U if ALL or slot(u) == DAYN % 7 or u not in old]
todo = todo[:MAXN]
# interleave hosts so the workers do not all wait on one host (one request per host at a time)
_g = {}
for u in todo: _g.setdefault(urlparse(u).netloc, []).append(u)
_q = sorted(_g.values(), key=len, reverse=True); todo = []
while any(_q):
    for g in _q:
        if g: todo.append(g.pop(0))

robots, rlock, hosts = {}, threading.Lock(), {}
def allowed(u):
    pu = urlparse(u); base = pu.scheme + '://' + pu.netloc
    with rlock:
        rp = robots.get(base)
    if rp is None:
        rp = urllib.robotparser.RobotFileParser()
        try:
            with urllib.request.urlopen(urllib.request.Request(base + '/robots.txt', headers={'user-agent': UA}), timeout=10) as r:
                rp.parse(r.read(200000).decode('utf-8', 'replace').splitlines())
        except urllib.error.HTTPError as e:
            rp.parse([] if e.code >= 400 else ['User-agent: *', 'Disallow: /'])
        except Exception:
            rp.parse([])
        with rlock: robots[base] = rp
    return rp.can_fetch(UA, u)

TAG = re.compile(r'<(script|style|noscript)\b.*?</\1>|<!--.*?-->', re.S | re.I)
import html as _html
def visible(b, ctype):
    if 'pdf' in ctype: return None
    s = b.decode('utf-8', 'replace')
    s = TAG.sub(' ', s); s = re.sub(r'<(?:br|p|div|li|h[1-6]|tr|td|th|section|article)\b[^>]*>', '. ', s, flags=re.I); s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', _html.unescape(s)).strip()
def text_hash(b, ctype):
    if 'pdf' in ctype: return hashlib.sha256(b).hexdigest()[:16], None
    v = visible(b, ctype)
    return hashlib.sha256(re.sub(r'(?:\. )+', ' ', v).encode()).hexdigest()[:16], v

def host_wait(h):
    while True:
        with rlock:
            t = hosts.get(h, 0)
            if time.time() >= t:
                hosts[h] = time.time() + 1e9; return
        time.sleep(0.2)
def host_done(h):
    with rlock: hosts[h] = time.time() + 1.0

def check(u):
    h = urlparse(u).netloc
    host_wait(h)
    try:
        if not allowed(u): return u, 'r', '', '', None
        req = urllib.request.Request(u, headers={'user-agent': UA, 'accept': 'text/html,application/pdf;q=0.9,*/*;q=0.5', 'accept-encoding': 'gzip, deflate'})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                b = r.read(3000000); enc = (r.headers.get('content-encoding') or '').lower()
                if enc == 'gzip': b = gzip.decompress(b)
                elif enc == 'deflate': b = zlib.decompress(b)
                hx, vt = text_hash(b, (r.headers.get('content-type') or '').lower())
                return u, r.status, hx, urlparse(r.geturl()).netloc, vt
        except urllib.error.HTTPError as e:
            return u, e.code, '', '', None
        except urllib.error.URLError as e:
            m = str(e.reason)
            if 'Tunnel connection failed' in m: return u, 'n', '', '', None   # refused by the network we ran from: not a fact about the source
            return u, 'e', '', '', None
        except Exception:
            return u, 'e', '', '', None
    finally:
        host_done(h)

# claim -> evidence passage: the shortest span (at most 14 words) of the page text that carries most of the claim's words and all of its
# numbers; kept only when it covers at least half of the claim's content words (numbers count double). A passage shows where the claim
# is printed, not that it is true.
STOP = set('the a an of and or to in on at for with by from is are was were be been as it its this that these those has have had will would can may per our your their into than then over under up out new all any each also only not no more most very'.split())
TOK = re.compile(r'[^\W_]+(?:[.,][0-9]+)*', re.U)
def toks(x): return [w for w in TOK.findall(x.lower())]
def ckey(w): return w.replace(',', '')
claims_by_url = {}
for p in named['projects']:
    for i, c in enumerate(p.get('cl') or []):
        if len(c) > 3 and c[3]: claims_by_url.setdefault(c[3], []).append((p['s'], i, c[0]))
def passage(claim, text):
    ct = [ckey(w) for w in toks(claim) if w not in STOP and (len(w) > 1 or w.isdigit())]
    if not ct: return None
    want = {}
    for w in ct: want[w] = 2 if any(ch.isdigit() for ch in w) else 1
    tot = sum(want.values())
    words = text.split(' ')
    if len(words) > 60000: words = words[:60000]
    norm = [ckey(TOK.findall(w.lower())[0]) if TOK.findall(w.lower()) else '' for w in words]
    best, bi = 0, -1
    W = 14
    hits = [want.get(w, 0) for w in norm]
    acc = sum(hits[:W])
    for i in range(0, max(1, len(norm) - W + 1)):
        if i: acc += (hits[i + W - 1] if i + W - 1 < len(hits) else 0) - hits[i - 1]
        if acc > best:
            seen = set(norm[i:i + W]); sc = sum(v for k, v in want.items() if k in seen)
            if sc > best: best, bi = sc, i
    if bi < 0: return None
    seen = set(norm[bi:bi + W]); sc = sum(v for k, v in want.items() if k in seen)
    nums = [k for k, v in want.items() if v == 2]
    if sc / tot < 0.5 or any(n not in seen for n in nums): return None
    hi = [j for j in range(bi, min(bi + W, len(norm))) if want.get(norm[j])]
    a, b = hi[0], hi[-1] + 1
    while b - a < 10 and (a > bi or b < bi + W):            # a little context on both sides, still at most 14 words
        if a > bi: a -= 1
        if b - a < 10 and b < min(bi + W, len(words)): b += 1
        if a <= bi and b >= min(bi + W, len(words)): break
    q = ' '.join(words[a:b]).strip(' .;,|')
    q = re.sub(r'(?:\s*\.\s*){2,}', '. ', q)
    q = re.sub(r'\s+([.,;:!?])', r'\1', q).strip(' .;,|')
    return q, round(sc / tot, 2)
EVID = '--evidence' in sys.argv
evid = {}
done_n = [0]
def note(u, vt):
    for slug, i, ctext in claims_by_url.get(u, []):
        pr = passage(ctext, vt) if vt else None
        evid.setdefault(slug, {})[i] = [i, pr[0], pr[1], TODAY] if pr else [i, '', 0, TODAY]
res = {}
with ThreadPoolExecutor(24) as ex:
    from concurrent.futures import as_completed
    for fu in as_completed([ex.submit(check, u) for u in todo]):
        u, st, hx, fh, vt = fu.result()
        res[u] = (st, hx, fh)
        if EVID and st != 'n' and st != 'r': note(u, vt if isinstance(st, int) and st < 400 else None)
        done_n[0] += 1
        if done_n[0] % 250 == 0: print('read', done_n[0], 'of', len(todo), flush=True)

def arch(u):
    if u in OWN: return 'k'
    w = (wb.get('pages') or {}).get(u)
    if w: return 'w'
    return 'l'
rows = []
for u in U:
    o = old.get(u)
    if u in res and res[u][0] != 'n':
        st, hx, fh = res[u]
        if o and o[3] and hx and o[3] != hx: ch = TODAY
        else: ch = o[4] if o else ''
        if o and not hx and o[3]: hx = o[3]                 # keep the last good hash when the page did not answer
        rows.append([u, st, TODAY, hx, ch, o[5] if o else TODAY, arch(u), fh if fh and fh != urlparse(u).netloc else ''])
    elif o:
        o = list(o); o[6] = arch(u); rows.append(o)
    else:
        rows.append([u, 'n', '', '', '', TODAY, arch(u), ''])
def cls(s):
    if isinstance(s, int): return '2' if s < 300 else '3' if s < 400 else '4' if s < 500 else '5'
    return s
cnt = {}
for r in rows: cnt[cls(r[1])] = cnt.get(cls(r[1]), 0) + 1
checked = sum(v for k, v in cnt.items() if k in '2345e')
live = cnt.get('2', 0) + cnt.get('3', 0)
wbp = wb.get('pages') or {}
out = {
    'v': 'source-health-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
    'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    'method': 'Every source URL cited on a project page is read with one GET (redirects followed, robots.txt respected) once a week, one seventh each day. '
              'Live = final HTTP status 200-399. Changed = the SHA-256 of the visible text differs from the last read. Status r = robots.txt asks us not to read it; '
              'e = no answer (timeout, DNS, TLS); n = not read yet. A changed or dead source is a reason to look again, not a finding about the project.',
    'fields': ['url', 'status', 'checked', 'text_sha256_16', 'changed', 'first_seen', 'archive', 'redirect_host'],
    'archive_kinds': {'k': 'our archived text of the page (/projects/<slug>/changes/)', 'w': 'Internet Archive copy recorded in /data/wayback.json', 'l': 'Internet Archive lookup'},
    'n': len(rows), 'checked': checked, 'live': live, 'counts': cnt, 'read_today': len([u for u in res if res[u][0] != 'n']),
    'cites': {u: cites[u][:5] for u in U},
    'wayback': {u: (wbp[u].get('l') or wbp[u].get('f') or '') if isinstance(wbp[u], dict) else '' for u in U if u in wbp},
    'own': {u: OWN[u] for u in U if u in OWN},
    'u': rows,
}
os.makedirs(OUT, exist_ok=True)
json.dump(out, open(os.path.join(OUT, 'source-health.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
if EVID:
    # previous passages are kept for URLs not read today
    pe = get_json(None, SITE + '/data/evidence.json') if not os.path.exists(os.path.join(OUT, 'evidence-prev.json')) else json.load(open(os.path.join(OUT, 'evidence-prev.json')))
    pe = (pe or {}).get('p') or {}
    readu = set(u for u in res if res[u][0] not in ('n', 'r'))
    P = {}
    for p in named['projects']:
        cl = p.get('cl') or []
        if not cl: continue
        row = []
        for i, c in enumerate(cl):
            u = c[3] if len(c) > 3 else ''
            if p['s'] in evid and i in evid[p['s']]: row.append(evid[p['s']][i])
            else:
                o = next((x for x in pe.get(p['s'], []) if x[0] == i), None)
                if o and u not in readu: row.append(o)
        if row: P[p['s']] = row
    nq = sum(1 for v in P.values() for x in v if x[1])
    json.dump({'v': 'evidence-1', 'updated': TODAY, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com); quotes are short extracts of the cited pages',
               'method': 'For each claim we read the page it cites and keep the shortest span of at most 14 words that carries at least half of the claim words and every number in the claim. '
                         'A passage shows where the claim is printed and when we read it; it does not make the claim true. Empty = the page was read and no such passage was found '
                         '(the page may render text with scripts, be a PDF, or have changed).',
               'fields': ['claim_index', 'quote', 'match_share', 'read'], 'n_claims': sum(len(v) for v in P.values()), 'n_quotes': nq, 'p': P},
              open(os.path.join(OUT, 'evidence.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('evidence claims', sum(len(v) for v in P.values()), 'quotes', nq)
print('sources', len(rows), 'read', out['read_today'], 'checked', checked, 'live', live, cnt)
