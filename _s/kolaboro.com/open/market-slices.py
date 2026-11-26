#!/usr/bin/env python3
# Kolaboro market slices (n40 k49, 27 Nov 2026, R11-25). /m/<market>/ pages used to download and parse the whole
# /data/bali-cases.json (6.8 MB, every project) to show one market. This script cuts that file into one small file per
# market, /data/m/<key>.json, holding only what /m/m.js draws: the market's projects (only the fields the page uses), the
# six check shares and project count of every market (the comparison bars), the other markets of the same country, and
# the market's transparency index row (same arithmetic as /transparency-index/ti-core.js compute()).
# m.js falls back to the full file when a slice is missing, does not match the market, or is older than the data the
# page was built from. Deterministic: the same bali-cases.json always gives byte-identical slices.
# Run: python3 open/market-slices.py [bali-cases.json] [output dir]   (defaults: data/bali-cases.json, data/m/ next to it)
#      --check   exit 1 when the slices on disk were not built from this bali-cases.json (nothing written)
# Called by the research agent workflow right after it writes bali-cases.json, and by open/catalog-refresh.py when the
# slices are behind the file (hand-made data commits).
import json, sys, os, re, math, hashlib, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
CK = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok']
LVC = {'registry': 'r', 'independent': 'i', 'developer': 'd', 'contradicted': 'c', 'none': 'n'}
MIN, W_D, W_V, W_F = 3, 0.6, 0.3, 0.1


def norm(s):
    # m.js norm(): lower case, trimmed, accents removed, - _ + as spaces, single spaces
    s = str(s or '').lower().strip()
    s = unicodedata.normalize('NFD', s)
    s = re.sub('[̀-ͯ]', '', s)
    return re.sub(r'\s+', ' ', re.sub(r'[-_+]+', ' ', s))


def key_of(m):
    k = norm(m).replace(' ', '-')
    return k if re.fullmatch(r'[a-z0-9-]{1,80}', k) else None


def ok(c, k):
    x = c.get('checks') or {}
    if k == 'permit': return x.get('permit') == 2
    if k == 'escrow': return x.get('escrow') is True
    if k == 'progress': return x.get('progress') is not None
    return bool(x.get(k))


def num(v):
    return int(v) if isinstance(v, float) and v.is_integer() else v


def ti_rows(C):
    # ti-core.js compute(): same order of float operations, so the same doubles
    M = {}
    for c in C:
        if not c or not c.get('market'): continue
        mx = c.get('max') or 6
        m = M.setdefault(c['market'], {'market': c['market'], 'n': 0, 'd': 0.0, 'v': 0.0, 'clean': 0})
        m['n'] += 1
        m['d'] += min(1, (c.get('score') or 0) / mx)
        m['v'] += min(1, (c.get('vscore') or 0) / mx)
        if not (c.get('flags') or []): m['clean'] += 1
    rows = []
    for m in M.values():
        if m['n'] < MIN: continue
        D, V, F = m['d'] / m['n'], m['v'] / m['n'], m['clean'] / m['n']
        rows.append({'market': m['market'], 'projects': m['n'], 'disclosure': D, 'confirmed': V, 'noflags': F,
                     'index': math.floor(1000 * (W_D * D + W_V * V + W_F * F) + 0.5 + 1e-9) / 10})
    rows.sort(key=lambda r: (-r['index'], -r['projects'], r['market']))
    for i, r in enumerate(rows):
        r['rank'] = rows[i - 1]['rank'] if i and rows[i - 1]['index'] == r['index'] else i + 1
    return rows


def case_row(c):
    bits = sum(1 << i for i, k in enumerate(CK) if ok(c, k))
    v = c.get('verified') or {}
    lv = ''.join(LVC.get(v.get(k) or 'none', '?') for k in CK)
    cl = c.get('claims') or {}
    # id, stage, band, done, score, max, vscore, check bits, verification letters, claims [v, u, c], overdue, delay, flags
    return [c.get('id'), c.get('stage'), c.get('band'), num(c.get('done')), num(c.get('score')), num(c.get('max')), num(c.get('vscore')),
            bits, lv, [num(cl.get('verified')), num(cl.get('unverified')), num(cl.get('contradicted'))],
            num(c.get('overdue')), num(c.get('delay')), len(c.get('flags') or [])]


def build(src):
    raw = open(src, 'rb').read()
    sha = hashlib.sha256(raw).hexdigest()
    d = json.loads(raw)
    C = d.get('cases') or []
    mk = {}
    for c in C:
        if c.get('market'): mk[norm(c['market'])] = c['market']   # last one wins, like m.js
    rows = ti_rows(C)
    RI = {r['market']: r for r in rows}
    allv = [len(C)] + [sum(1 for c in C if ok(c, k)) for k in CK]
    by = {}
    for c in C: by.setdefault(c.get('market'), []).append(c)
    out, skipped = {}, []
    for q, m in sorted(mk.items()):
        k = key_of(m)
        if not k or k.replace('-', ' ') != q:
            skipped.append(m); continue
        L = by[m]
        if any((x.get('verified') or {}).get(ck) not in (None, '', *LVC) for x in L for ck in CK):
            skipped.append(m); continue   # a verification level m.js does not know: leave this market on the full file
        co = L[0].get('country')
        sib = {}
        for c in C:
            if c.get('country') == co and c.get('market') != m: sib[c.get('market')] = sib.get(c.get('market'), 0) + 1
        r = RI.get(m)
        out[k] = {'v': 1, 'src': '/data/bali-cases.json', 'sha': sha[:16], 'updated': d.get('updated'), 'market': m, 'country': co,
                  'tiN': len(rows), 'ti': [r['index'], r['rank'], r['disclosure'], r['confirmed'], r['noflags']] if r else None,
                  'all': allv, 'sib': dict(sorted(sib.items())), 'c': [case_row(c) for c in L]}
    return sha, d.get('updated'), out, skipped


def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    src = a[0] if a else os.path.join(HERE, '..', 'data', 'bali-cases.json')
    dst = a[1] if len(a) > 1 else os.path.join(os.path.dirname(os.path.abspath(src)), 'm')
    if '--check' in sys.argv:
        sha = hashlib.sha256(open(src, 'rb').read()).hexdigest()[:16]
        try: cur = json.load(open(os.path.join(dst, 'index.json'))).get('sha')
        except Exception: cur = None
        print('market slices', 'current' if cur == sha else 'BEHIND bali-cases.json')
        sys.exit(0 if cur == sha else 1)
    sha, up, out, skipped = build(src)
    os.makedirs(dst, exist_ok=True)
    keep = set(k + '.json' for k in out) | {'index.json'}
    for f in os.listdir(dst):
        if f.endswith('.json') and f not in keep: os.remove(os.path.join(dst, f))   # markets that left the data
    total = 0
    for k, o in out.items():
        b = json.dumps(o, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        p = os.path.join(dst, k + '.json')
        if not os.path.exists(p) or open(p, 'rb').read() != b: open(p, 'wb').write(b)
        total += len(b)
    idx = json.dumps({'v': 1, 'src': '/data/bali-cases.json', 'sha': sha[:16], 'updated': up, 'markets': sorted(out),
                      'note': 'One file per market for /m/<market>/ pages, built by /open/market-slices.py from /data/bali-cases.json.'},
                     ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    ip = os.path.join(dst, 'index.json')
    if not os.path.exists(ip) or open(ip, 'rb').read() != idx: open(ip, 'wb').write(idx)
    print('market slices: %d files, %d bytes, %d markets left on the full file%s' % (len(out), total, len(skipped), (': ' + ', '.join(skipped)) if skipped else ''))


if __name__ == '__main__':
    main()
