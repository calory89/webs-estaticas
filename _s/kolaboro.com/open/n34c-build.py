#!/usr/bin/env python3
"""kolaboro.com build steps of batch 34 (n34c, 21 Nov 2026). Python 3.8+; brotli step needs the 'brotli' module or the brotli CLI.

  n34c-build.py perf [--write]      measure each page template live (HTML, scripts, styles: bytes over the wire with Brotli and raw)
                                    and compare with the budget in /open/perf-budget.json; --write updates /data/perf-budget.json
  n34c-build.py budget <git rev>    pre-push check: raw bytes of every static file a template loads, in the commit to be pushed,
                                    against the same budget (reports only, like the rest of the pre-push hook)
  n34c-build.py brotli              precompress the largest public JSON files at Brotli quality 11 into /data/br/ with a manifest;
                                    the worker serves a copy only while its source SHA-256 still matches the file it would serve
  n34c-build.py monitor <vantage>   load the 20 key pages once, append status and timing to /data/monitoring.json (30 days kept)
Run from the root of a checkout of pub/_lovable.
"""
import gzip, hashlib, json, os, re, subprocess, sys, time, urllib.request, datetime
BASE = 'https://kolaboro.com'
SITE = '_s/kolaboro.com'
UA = {'user-agent': 'kolaboro-build/1.0 (+https://kolaboro.com/engineering/performance/)'}
now = lambda: datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0, tzinfo=None).isoformat() + 'Z'
TEMPLATES = [('home', '/'), ('project', '/projects/amani-melasti/'), ('project_ar', '/ar/projects/amani-melasti/'), ('market', '/m/dubai/'),
             ('list', '/projects/'), ('developer', '/developers/emaar-properties/'), ('ranking', '/rankings/'), ('engineering', '/engineering/')]
BR_FILES = ['named.json', 'bali-cases.json', 'claims-index.json', 'price-history.json', 'site-3d.json', 'website-changes.json', 'entity-graph.json',
            'construction-index.json', 'catalog.json', 'world-claims.json', 'similar.json', 'delta/by-project.json', 'tlog/index.json']

def get(path, br=True, timeout=30):
    h = dict(UA); h['accept-encoding'] = 'br' if br else 'identity'
    t = time.time()
    with urllib.request.urlopen(urllib.request.Request(BASE + path, headers=h), timeout=timeout) as r:
        b = r.read(); return r.status, b, r.headers.get('content-encoding') or '', round((time.time() - t) * 1000)
def raw_len(b, enc):
    if enc == 'br':
        try: import brotli; return len(brotli.decompress(b))
        except Exception: return None
    if enc == 'gzip': return len(gzip.decompress(b))
    return len(b)
def assets(html):
    s = re.findall(r'<script[^>]+src="(/[^"/][^"]*)"', html); c = re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="(/[^"/][^"]*)"', html) + re.findall(r'<link[^>]+href="(/[^"/][^"]*)"[^>]+rel="stylesheet"', html)
    return sorted(set(s)), sorted(set(c))

def perf(write):
    bud = json.load(open(SITE + '/open/perf-budget.json'))
    out = {'type': 'kolaboro-perf-budget-v1', 'measured': now(), 'tool': 'open/n34c-build.py perf (urllib, Brotli accepted, one cold-ish fetch per file from a build machine)', 'budget_file': '/open/perf-budget.json', 'templates': []}
    for k, p in TEMPLATES:
        st, b, enc, ms = get(p); raw = raw_len(b, enc); html = (__import__('brotli').decompress(b) if enc == 'br' else b).decode('utf-8', 'replace')
        js, css = assets(html); A = []
        for a in js + css:
            try: s2, b2, e2, _ = get(a); A.append({'path': a, 'kind': 'js' if a in js else 'css', 'wire': len(b2), 'raw': raw_len(b2, e2)})
            except Exception as e: A.append({'path': a, 'kind': 'js' if a in js else 'css', 'error': str(e)[:80]})
        m = {'html_wire': len(b), 'html_raw': raw, 'js_wire': sum(x.get('wire', 0) for x in A if x['kind'] == 'js'), 'js_raw': sum(x.get('raw') or 0 for x in A if x['kind'] == 'js'),
             'css_wire': sum(x.get('wire', 0) for x in A if x['kind'] == 'css'), 'requests': 1 + len(A), 'ttfb_ms': ms}
        B = bud['templates'].get(k, {})
        over = [f for f in ('html_wire', 'js_wire', 'css_wire', 'requests') if f in B and m[f] > B[f]]
        out['templates'].append({'key': k, 'path': p, 'status': st, 'measured': m, 'budget': B, 'over': over, 'assets': A})
        print('%-12s %s html %6d/%6s js %6d/%6s css %5d/%5s req %2d/%s %s' % (k, st, m['html_wire'], B.get('html_wire'), m['js_wire'], B.get('js_wire'), m['css_wire'], B.get('css_wire'), m['requests'], B.get('requests'), 'OVER ' + ','.join(over) if over else 'ok'))
    out['passed'] = sum(1 for t in out['templates'] if not t['over']); out['total'] = len(out['templates'])
    if write: json.dump(out, open(SITE + '/data/perf-budget.json', 'w'), indent=1, ensure_ascii=False)
    return 0 if out['passed'] == out['total'] else 1

def budget(rev):
    """Raw bytes of the static files each template loaded at the last measurement, read from the commit to be pushed."""
    try: d = json.loads(subprocess.run(['git', 'show', rev + ':' + SITE + '/data/perf-budget.json'], capture_output=True, check=True).stdout)
    except Exception: print('kolaboro perf budget: no /data/perf-budget.json in %s, skipped' % rev[:12]); return 0
    bud = json.loads(subprocess.run(['git', 'show', rev + ':' + SITE + '/open/perf-budget.json'], capture_output=True, check=True).stdout)['templates']
    bad = 0
    for t in d['templates']:
        tot = 0; miss = []
        for a in t['assets']:
            if a.get('kind') != 'js': continue
            f = SITE + a['path'].split('?')[0]
            r = subprocess.run(['git', 'cat-file', '-s', rev + ':' + f], capture_output=True, text=True)
            if r.returncode == 0: tot += int(r.stdout.strip())
            else: miss.append(a['path'])
        lim = (bud.get(t['key']) or {}).get('js_raw')
        ok = lim is None or tot <= lim
        bad += 0 if ok else 1
        print('kolaboro perf budget: %-12s static JS %7d bytes raw (budget %s)%s' % (t['key'], tot, lim, '' if ok else '  WARNING over budget') + (' [served by the worker: %d]' % len(miss) if miss else ''))
    return 0 if not bad else 1

def brot():
    try:
        import brotli; comp = lambda b: brotli.compress(b, quality=11, lgwin=24)
    except Exception:
        comp = lambda b: subprocess.run(['brotli', '-q', '11', '-w', '24', '-c'], input=b, capture_output=True, check=True).stdout
    man_p = SITE + '/data/br/manifest.json'
    man = json.load(open(man_p)) if os.path.exists(man_p) else {'files': {}}
    os.makedirs(SITE + '/data/br', exist_ok=True)
    for f in BR_FILES:
        p = SITE + '/data/' + f
        if not os.path.exists(p): continue
        b = open(p, 'rb').read(); h = hashlib.sha256(b).hexdigest(); cur = man['files'].get(f)
        dst = SITE + '/data/br/' + f.replace('/', '--') + '.br'
        if cur and cur['source_sha256'] == h and os.path.exists(dst): continue
        t = time.time(); c = comp(b)
        open(dst, 'wb').write(c)
        man['files'][f] = {'source': '/data/' + f, 'source_sha256': h, 'source_bytes': len(b), 'br': '/data/br/' + f.replace('/', '--') + '.br', 'br_bytes': len(c), 'quality': 11, 'built': now(), 'seconds': round(time.time() - t, 1)}
        print('%-26s %9d -> %8d bytes (%.1f%%)' % (f, len(b), len(c), 100 * len(c) / len(b)))
    man.update({'type': 'kolaboro-brotli-manifest-v1', 'rule': 'The worker serves /data/<file> from its .br copy (Content-Encoding: br) only to clients that accept br, and only while the SHA-256 of the file it would serve equals source_sha256 (checked once per worker isolate per ETag). Otherwise the normal file is served and Cloudflare compresses it on the fly.', 'updated': now()})
    json.dump(man, open(man_p, 'w'), indent=1)
    return 0

def monitor(vantage):
    try: pages = [p['p'] for p in json.loads(get('/api/x/status/pages', br=False)[1])['pages']]
    except Exception: pages = [t[1] for t in TEMPLATES]
    try: commit = json.loads(get('/api/open/build', br=False)[1]).get('commit', '')[:12]
    except Exception: commit = ''
    S = []
    for p in pages[:20]:
        try: st, b, enc, ms = get(p, timeout=20); S.append([p, st, ms, len(b)])
        except urllib.error.HTTPError as e: S.append([p, e.code, None, 0])
        except Exception: S.append([p, 0, None, 0])
    fp = SITE + '/data/monitoring.json'
    d = json.load(open(fp)) if os.path.exists(fp) else {}
    d.update({'type': 'kolaboro-monitoring-v1', 'about': 'Synthetic monitoring: the 20 key pages of kolaboro.com loaded once per run, from outside Cloudflare, with status, time to the last byte and bytes on the wire. Runs inside the existing deploy guard job (after each code deploy and once a day); 30 days are kept. The edge also checks the same pages every 5 minutes: /api/x/status/pages.',
              'keep_days': 30, 'fields': ['path', 'http status', 'ms to last byte', 'bytes on the wire (Brotli)']})
    cut = (datetime.datetime.utcnow() - datetime.timedelta(days=30)).isoformat()
    d['samples'] = [x for x in d.get('samples', []) if x['at'] >= cut] + [{'at': now(), 'vantage': vantage, 'commit': commit, 'pages': S}]
    json.dump(d, open(fp, 'w'), indent=0, separators=(',', ':'))
    ok = sum(1 for x in S if 200 <= x[1] < 400); print('monitor: %d/%d up' % (ok, len(S))); return 0

if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    if a[0] == 'perf': sys.exit(perf('--write' in a))
    if a[0] == 'budget': sys.exit(budget(a[1] if len(a) > 1 else 'HEAD'))
    if a[0] == 'brotli': sys.exit(brot())
    if a[0] == 'monitor': sys.exit(monitor(a[1] if len(a) > 1 else 'manual'))
    print(__doc__); sys.exit(2)
