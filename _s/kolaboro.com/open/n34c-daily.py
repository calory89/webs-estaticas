#!/usr/bin/env python3
"""kolaboro.com daily delta files and transparency log (n34c, 21 Nov 2026). Python 3.8+, standard library only. MIT licence.

Reads the daily snapshot chain (/data/snapshots/index.json and its gzip copies) and writes, for every snapshot day:
  /data/delta/<day>.json     what changed in the projects of /data/named.json since the previous snapshot day (kolaboro-delta-v1)
  /data/delta/index.json     list of delta files with their SHA-256 (the site signs each file with Ed25519 at /api/v1/delta/<day>)
  /data/delta/by-project.json  for each project slug, the days on which its record changed and which fields
  /data/tlog/<day>.json      the leaf hashes of that day's project records (RFC 6962 Merkle tree, one leaf per record)
  /data/tlog/index.json      the append-only log: one leaf per day = day root + record count + snapshot hash-chain head
Existing days are never rewritten (the log is append-only); a day whose files exist is only checked.

  n34c-daily.py --snapshots <dir with index.json and day folders | git:REF> --out <site root> [--git <git dir>] [--files <list>]

Runs inside the existing daily publishing job (kolaboro-shipping.yml) right after snapshots.py: no new workflow. Docs:
https://kolaboro.com/data/delta/ and https://kolaboro.com/verify/transparency-log/
"""
import gzip, hashlib, json, os, subprocess, sys
from decimal import Decimal

A = sys.argv[1:]
def opt(k, d=None):
    if k in A:
        i = A.index(k); v = A[i + 1]; del A[i:i + 2]; return v
    return d
SNAP, OUT, GITDIR, FILES = opt('--snapshots'), opt('--out', '.'), opt('--git'), opt('--files')
SITE = os.path.join(OUT, '_s/kolaboro.com')
written = []

def jsnum(x):
    """A number exactly as JavaScript's JSON.stringify writes it (so Node and Python get the same canonical bytes)."""
    if isinstance(x, bool): return 'true' if x else 'false'
    if isinstance(x, int): return str(x)
    if x != x or x in (float('inf'), float('-inf')): return 'null'
    if x == 0: return '0'
    sign = '-' if x < 0 else ''
    t = Decimal(repr(abs(x))).as_tuple(); dg = ''.join(map(str, t.digits)).rstrip('0') or '0'
    z = len(''.join(map(str, t.digits))) - len(dg); k = len(dg); n = t.exponent + z + k
    if k <= n <= 21: s = dg + '0' * (n - k)
    elif 0 < n <= 21: s = dg[:n] + '.' + dg[n:]
    elif -6 < n <= 0: s = '0.' + '0' * (-n) + dg
    else: s = dg[0] + ('.' + dg[1:] if k > 1 else '') + 'e' + ('+' if n - 1 >= 0 else '-') + str(abs(n - 1))
    return sign + s
def canon(v):
    """Canonical JSON: keys sorted by UTF-16 code units like JavaScript, no spaces, JSON.stringify escaping and numbers."""
    if v is None: return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return jsnum(v)
    if isinstance(v, str): return json.dumps(v, ensure_ascii=False)
    if isinstance(v, list): return '[' + ','.join(canon(x) for x in v) + ']'
    if isinstance(v, dict):
        ks = sorted(v.keys(), key=lambda s: s.encode('utf-16-be'))
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canon(v[k]) for k in ks) + '}'
    raise TypeError(type(v))
H = lambda b: hashlib.sha256(b).digest()
hx = lambda b: hashlib.sha256(b).hexdigest()

# ---------- RFC 6962 Merkle tree hash (leaf = SHA-256(0x00 || data), node = SHA-256(0x01 || left || right))
def mth(L):
    if not L: return H(b'')
    lv = list(L)
    while len(lv) > 1:
        nx = [H(b'\x01' + lv[i] + lv[i + 1]) for i in range(0, len(lv) - 1, 2)]
        if len(lv) % 2: nx.append(lv[-1])
        lv = nx
    return lv[0]
# note: the pairwise build above equals RFC 6962 MTH (split at the largest power of two smaller than n) for every n
def leaf_record(day, slug, rec): return H(b'\x00' + ('kolaboro-tlog-v1|%s|%s|%s' % (day, slug, canon(rec))).encode())
def leaf_day(day, root_hex, n, head): return H(b'\x00' + ('kolaboro-tlog-day-v1|%s|%s|%d|%s' % (day, root_hex, n, head)).encode())

def git(*a): return subprocess.run(['git', '--git-dir', GITDIR] + list(a), check=True, capture_output=True).stdout
def read_site(rel):   # a file of the site: from --out when written there, else from the published branch
    p = os.path.join(SITE, rel)
    if os.path.exists(p): return open(p, 'rb').read()
    if SNAP and SNAP.startswith('git:'):
        try: return git('show', SNAP[4:] + ':_s/kolaboro.com/' + rel)
        except Exception: return None
    return None
def write(rel, obj):
    p = os.path.join(SITE, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    b = (json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
    open(p, 'wb').write(b); written.append('_s/kolaboro.com/' + rel); return b

idx = json.loads(read_site('data/snapshots/index.json') if not (SNAP and not SNAP.startswith('git:')) else open(os.path.join(SNAP, 'index.json'), 'rb').read())
E = idx['entries']
def projects(e):
    rel = 'data' + e['copy'][len('/data'):]
    if SNAP and not SNAP.startswith('git:'): raw = open(os.path.join(SNAP, e['day'], 'named.json.gz'), 'rb').read()
    else: raw = read_site(rel)
    b = gzip.decompress(raw)
    if hx(b) != e['sha256']: sys.exit('snapshot copy %s does not match the chain' % e['day'])
    P = json.loads(b).get('projects') or []
    return {p['s']: p for p in P if p.get('s')}

old_tl = json.loads(read_site('data/tlog/index.json') or b'{"entries":[]}')
old_dl = json.loads(read_site('data/delta/index.json') or b'{"entries":[]}')
TL = {x['day']: x for x in old_tl.get('entries', [])}; DL = {x['to']: x for x in old_dl.get('entries', [])}
byp = json.loads(read_site('data/delta/by-project.json') or b'{"projects":{}}').get('projects', {})
prevP, prevE, tl_entries, dl_entries = None, None, [], []
for e in E:
    need_t, need_d = e['day'] not in TL, (prevE is not None and e['day'] not in DL)
    nxt = E[E.index(e) + 1]['day'] if E.index(e) + 1 < len(E) else None
    P = projects(e) if (need_t or need_d or (nxt and nxt not in DL)) else None
    if need_t:
        slugs = sorted(P); L = [leaf_record(e['day'], s, P[s]) for s in slugs]; root = mth(L).hex()
        b = write('data/tlog/%s.json' % e['day'], {'type': 'kolaboro-tlog-leaves-v1', 'day': e['day'], 'snapshot_sha256': e['sha256'], 'snapshot_head': e['head'], 'n': len(slugs), 'root': root,
                                                   'leaf_rule': 'SHA-256(0x00 || UTF-8 "kolaboro-tlog-v1|" + day + "|" + slug + "|" + canonical JSON of the record)', 'slugs': slugs, 'leaves': ''.join(x.hex() for x in L)})
        TL[e['day']] = {'day': e['day'], 'n': len(slugs), 'root': root, 'snapshot_sha256': e['sha256'], 'snapshot_head': e['head'], 'file': '/data/tlog/%s.json' % e['day'], 'file_sha256': hx(b), 'added': os.environ.get('KB_TODAY') or __import__('datetime').date.today().isoformat()}
    if need_d:
        add = sorted(k for k in P if k not in prevP); rem = sorted(k for k in prevP if k not in P); ch = {}
        for k in sorted(P):
            if k in prevP and canon(P[k]) != canon(prevP[k]):
                a, b2 = prevP[k], P[k]
                st = {f: b2[f] for f in sorted(b2) if f not in a or canon(a[f]) != canon(b2[f])}; un = sorted(f for f in a if f not in b2)
                ch[k] = {'set': st} if not un else {'set': st, 'unset': un}
        to_hash = hx(canon([P[k] for k in sorted(P)]).encode()); from_hash = hx(canon([prevP[k] for k in sorted(prevP)]).encode())
        d = {'type': 'kolaboro-delta-v1', 'from': {'day': prevE['day'], 'sha256': prevE['sha256'], 'head': prevE['head'], 'projects_sha256': from_hash},
             'to': {'day': e['day'], 'sha256': e['sha256'], 'head': e['head'], 'projects_sha256': to_hash},
             'counts': {'added': len(add), 'removed': len(rem), 'changed': len(ch), 'projects_after': len(P)},
             'apply': 'Start from the "projects" of the from-day file, keyed by "s" (slug). Delete every slug in "removed"; add every record in "added"; for each slug in "changed" set the fields in "set" and delete the fields in "unset". Sort by slug: the canonical JSON (keys sorted, no spaces, JavaScript number format) of the list has SHA-256 to.projects_sha256.',
             'added': [P[k] for k in add], 'removed': rem, 'changed': ch}
        b = write('data/delta/%s.json' % e['day'], d)
        DL[e['day']] = {'from': prevE['day'], 'to': e['day'], 'file': '/data/delta/%s.json' % e['day'], 'sha256': hx(b), 'bytes': len(b), 'counts': d['counts'], 'api': '/api/v1/delta/%s' % e['day']}
        for k in add: byp.setdefault(k, []).append([e['day'], 'added'])
        for k in rem: byp.setdefault(k, []).append([e['day'], 'removed'])
        for k, c in ch.items(): byp.setdefault(k, []).append([e['day'], sorted(list(c['set']) + c.get('unset', []))])
    if P is not None: prevP = P
    prevE = e
# log over days, in chain order; earlier entries must be unchanged (append-only)
days = [TL[e['day']] for e in E if e['day'] in TL]
for i, x in enumerate(old_tl.get('entries', [])):
    if i >= len(days) or days[i]['day'] != x['day'] or days[i]['root'] != x['root']: sys.exit('transparency log would not be append-only at ' + x['day'])
LL = [leaf_day(x['day'], x['root'], x['n'], x['snapshot_head']) for x in days]
roots = [mth(LL[:i + 1]).hex() for i in range(len(LL))]
tl = {'type': 'kolaboro-tlog-v1', 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
      'what': 'Append-only Merkle tree (RFC 6962 hashing) over the daily snapshots of /data/named.json. Each day has its own tree with one leaf per project record; the log has one leaf per day that binds that day root to the snapshot hash chain head.',
      'record_leaf': 'SHA-256(0x00 || UTF-8 "kolaboro-tlog-v1|" + day + "|" + slug + "|" + canonical JSON of the record)',
      'day_leaf': 'SHA-256(0x00 || UTF-8 "kolaboro-tlog-day-v1|" + day + "|" + day root hex + "|" + record count + "|" + snapshot head)',
      'node': 'SHA-256(0x01 || left || right); a tree of n leaves splits at the largest power of two smaller than n (RFC 6962 section 2.1)',
      'canonical_json': 'keys sorted, no spaces, strings escaped and numbers written as JavaScript JSON.stringify does',
      'size': len(LL), 'root': roots[-1] if roots else None, 'roots_by_size': roots, 'entries': days,
      'proofs': 'https://kolaboro.com/api/v1/tlog/proof?project=<slug>&day=<YYYY-MM-DD> (inclusion), https://kolaboro.com/api/v1/tlog/consistency?first=<m>&second=<n> (append-only), https://kolaboro.com/api/v1/tlog (signed tree head)'}
if any(x['day'] not in {y['day'] for y in old_tl.get('entries', [])} for x in days) or not old_tl.get('entries'): write('data/tlog/index.json', tl)
dl = {'type': 'kolaboro-delta-index-v1', 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', 'entries': [DL[e['day']] for e in E if e['day'] in DL],
      'signature': 'GET /api/v1/delta/<day> returns the exact bytes of /data/delta/<day>.json with x-kolaboro-signature = base64 Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of those bytes; /api/v1/delta/<day>.sig returns the same as JSON',
      'verify': 'python3 kolaboro_offline_verify.py delta <day>.json <day>.sig.json [from-day named.json.gz]   (https://kolaboro.com/verify/offline/)'}
if len(dl['entries']) != len(old_dl.get('entries', [])) or not old_dl.get('entries'):
    write('data/delta/index.json', dl); write('data/delta/by-project.json', {'type': 'kolaboro-delta-by-project-v1', 'days': [x['to'] for x in dl['entries']], 'projects': byp})
if FILES and written:
    with open(FILES, 'a') as fh: fh.write(''.join(w + '\n' for w in written))
print('tlog size %d root %s | deltas %d | new files %d' % (tl['size'], tl['root'], len(dl['entries']), len(written)))
