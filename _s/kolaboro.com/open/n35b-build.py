#!/usr/bin/env python3
"""kolaboro.com batch 35 (n35b, 22 Nov 2026): static data behind the price per m2 checker and the incident history.
Reads only published files under _s/kolaboro.com/data/ (no network, no model calls). Usage: n35b-build.py <site-dir>
Writes:
  data/n35b-ppm.json    per market (5+ listings in its main currency): every price per m2 (developer starting price / smallest unit
                        size, same rules as n34b-markets.json), quartiles, median with a 95% bootstrap interval (2,000 resamples,
                        seed 35); used by /tools/price-per-m2/
  data/incidents.json   dated incident list for /engineering/status/: rolled-back deploys and deploys that never went live (deploys.json),
                        non-200 answers in the synthetic monitoring samples (monitoring.json), plus the incidents written up in our
                        engineering notes (NOTES below, each with its commits). Times UTC.
Projects in Sumba and anything named Eco Beach City or Equinox are left out (conflict of interest)."""
import json, sys, os, re, random, statistics, collections, hashlib, datetime

SITE = sys.argv[1]
D = os.path.join(SITE, 'data')
def J(p): return json.load(open(os.path.join(D, p)))
def W(p, o):
    s = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    open(os.path.join(D, p), 'w').write(s); return len(s.encode())
def sha(p): return hashlib.sha256(open(os.path.join(D, p), 'rb').read()).hexdigest()

COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
named = J('named.json')
P = [p for p in named['projects'] if not COI.search(' '.join(str(p.get(k) or '') for k in ('n', 'dv', 'mk', 'ar')))]
RS = re.compile(r'^Latest registered home sales listed on the page \((\d+), ([^)]*?) to ([^)]*?)\): (AED) ([\d,]+) to AED ([\d,]+)')
def reg_sale(x):
    fx = x.get('fx') or {}
    try: pm = float(fx.get('price_min') or 0); px = None if fx.get('price_max') is None else float(fx['price_max'])
    except (TypeError, ValueError): return False
    if pm <= 0: return False
    for t in [c[0] for c in (x.get('cl') or [])] + list(x.get('dl') or []):
        m = RS.match(str(t or ''))
        if not m: continue
        a = float(m.group(5).replace(',', '')); b = float(m.group(6).replace(',', ''))
        if a == pm and (b <= pm if px is None else px == b): return True
    return False
def ppm(x):
    fx = x.get('fx') or {}
    try: p = float(fx.get('price_min') or 0); s = float(fx.get('size_min_m2') or 0)
    except (TypeError, ValueError): return None
    if reg_sale(x): return None
    return p / s if p > 0 and 15 <= s <= 5000 and fx.get('currency') else None

rnd = random.Random(35)
def boot(v, k=2000):
    v = sorted(v); n = len(v); meds = []
    for _ in range(k):
        s = sorted(v[rnd.randrange(n)] for _ in range(n)); meds.append(s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2)
    meds.sort(); return [meds[int(0.025 * k)], meds[int(0.975 * k) - 1]]
def q(v, f):   # linear interpolation quantile
    v = sorted(v); i = (len(v) - 1) * f; lo = int(i); hi = min(lo + 1, len(v) - 1); return v[lo] + (v[hi] - v[lo]) * (i - lo)

by = collections.defaultdict(list)
for x in P: by[x['mk']].append(x)
M = []
for mk, L in by.items():
    cur = collections.Counter(str((x.get('fx') or {}).get('currency') or '').upper() for x in L if ppm(x) is not None)
    if not cur: continue
    c0 = cur.most_common(1)[0][0]
    v = sorted(round(ppm(x)) for x in L if ppm(x) is not None and str(x['fx']['currency']).upper() == c0)
    if len(v) < 5: continue
    co = collections.Counter(x['co'] for x in L).most_common(1)[0][0]
    ci = boot(v)
    M.append({'market': mk, 'slug': mk.lower().replace(' ', '-'), 'country': co, 'currency': c0, 'n': len(v), 'left_out_other_currency': sum(cur.values()) - len(v),
              'median': round(statistics.median(v)), 'ci95': [round(ci[0]), round(ci[1])], 'q1': round(q(v, .25)), 'q3': round(q(v, .75)), 'p10': round(q(v, .1)), 'p90': round(q(v, .9)), 'v': v})
M.sort(key=lambda m: -m['n'])
src = {'file': '/data/named.json', 'sha256': sha('named.json'), 'updated': named['updated'], 'version': named['version']}
n1 = W('n35b-ppm.json', {'version': 'n35b-ppm-1', 'built': named['updated'], 'source': src,
       'what': 'Asking price per m2 by market: the starting price a developer publishes divided by the smallest unit size in m2 (15 to 5,000 m2), one value per project, in the market\'s most common currency. Not registered sale prices. DLD registered sale ranges stored as a price are left out.',
       'method': 'median with a 95% percentile bootstrap interval (2,000 resamples, seed 35); quartiles by linear interpolation; markets with 5 or more values only',
       'markets': M})
print('n35b-ppm.json', len(M), 'markets', sum(m['n'] for m in M), 'values', n1, 'bytes')

# ---------------------------------------------------------------------------------------------- incidents
NOTES = [
 {'id': '2026-11-21-brotli-json', 'start': '2026-11-21T08:47Z', 'end': '2026-11-21T08:58Z', 'kind': 'outage',
  'what': 'After Brotli copies of /data/*.json were switched on, the worker\'s own reads of /data/bali-cases.json got the compressed copy: every /api/open/* endpoint answered data_unavailable (08:47 to 08:53). For about 5 minutes after that fix, browsers got some JSON files compressed twice.',
  'impact': 'Open data API down for 6 minutes; some JSON downloads unreadable for about 5 more minutes. HTML pages stayed up.',
  'fix': 'Worker reads take the plain copy (9d9c5759c3), then Brotli copies switched off (35a21e3f9e). They stay off; a test header keeps the path testable.', 'commits': ['9d9c5759c3', '35a21e3f9e'], 'source': 'engineering notes, batch 34'},
 {'id': '2026-11-20-sitemaps-500', 'start': '2026-11-20T13:07Z', 'end': '2026-11-20T13:14Z', 'kind': 'outage',
  'what': 'A trailing comment swallowed the rest of a line in the sitemap builder ("T is not defined"): /sitemap_index.xml, every /sitemaps/*.xml and /engineering/seo/ answered 500.',
  'impact': 'Sitemaps unavailable to search engines for about 7 minutes. Pages stayed up.', 'fix': 'Line restored (13098cd3d2); all sitemaps 200 again with the same URL counts.', 'commits': ['cdd3434416', '13098cd3d2'], 'source': 'engineering notes, batch 33'},
 {'id': '2026-11-18-pages-size', 'start': '2026-11-18T13:18Z', 'end': '2026-11-18T14:10Z', 'kind': 'deploy',
  'what': 'The edge worker directory passed the 25 MiB limit of Cloudflare Pages, so every build of the publishing branch failed (about 60 sites on that branch).',
  'impact': 'No new version could go live for about 50 minutes; visitors kept getting the previous version.', 'fix': 'Large string tables moved out of the worker into static JSON (019b1a96b1, then batch 32 lowered the worker from 24.50 to 22.40 MiB); a size guard now stops a push above the limit.', 'commits': ['329e7afcf7', '019b1a96b1'], 'source': 'engineering notes, batches 31 and 32'},
 {'id': '2026-11-17-snapshot-chain', 'start': '2026-11-18T00:00Z', 'end': None, 'kind': 'data',
  'what': 'The daily dataset snapshot job stopped adding entries after 17 Nov ("chain broken at 2026-11-07"): a full-history clone saw days before the chain start.',
  'impact': 'No signed daily snapshot for 18, 19 and 20 Nov until they were added by hand on 21 Nov; the published chain stayed verifiable.', 'fix': 'Entries 18 to 20 Nov added from the fixed script on 21 Nov; the script fix for the scheduled job is waiting to be merged, so this stays open.', 'commits': [], 'source': 'engineering notes, batch 34'},
]
dep = J('deploys.json')['deploys']
inc = list(NOTES)
nd = collections.defaultdict(list)
for d in dep:
    at = d.get('at') or ''
    if d.get('result') == 'rolled_back':
        inc.append({'id': at[:10] + '-rollback-' + (d.get('commit') or '')[:7], 'start': at[:16] + 'Z', 'end': at[:16] + 'Z', 'kind': 'deploy',
                    'what': 'Deploy %s failed %d of %d live checks (%s).' % ((d.get('commit') or '')[:10], (d.get('checks_total') or 0) - (d.get('checks_passed') or 0), d.get('checks_total') or 0, ', '.join(d.get('failed') or [])),
                    'impact': 'Broken page live for about %d minutes before the automatic rollback.' % max(1, round((d.get('wait_s') or 0) / 60)),
                    'fix': 'Deploy guard reverted %s and restored %s files; %s.' % (', '.join(d.get('reverted') or []), d.get('files_restored', '?'), 'all checks passed after the rollback' if (d.get('after_rollback') or {}).get('failed') == [] else 'checks after rollback recorded in deploys.json'),
                    'commits': [(d.get('commit') or '')[:10], (d.get('rollback_commit') or '')[:10]], 'source': '/data/deploys.json'})
    elif d.get('result') == 'not_deployed':
        nd[at[:10]].append(d)
for day, L in nd.items():
    inc.append({'id': day + '-not-live', 'start': min(x['at'] for x in L)[:16] + 'Z', 'end': max(x['at'] for x in L)[:16] + 'Z', 'kind': 'deploy',
                'what': '%d pushed commit%s not live within 12 minutes (deploy guard).' % (len(L), 's' if len(L) > 1 else ''),
                'impact': 'None for visitors: the previous version stayed live; most were replaced by a newer push before their build finished.', 'fix': 'No action needed; the newer commits went live and passed the checks.',
                'commits': [(x.get('commit') or '')[:10] for x in L], 'source': '/data/deploys.json'})
try:
    for s in J('monitoring.json').get('samples') or []:
        bad = [p for p in s.get('pages') or [] if p[1] != 200]
        if bad: inc.append({'id': s['at'][:16] + '-monitor', 'start': s['at'][:16] + 'Z', 'end': None, 'kind': 'degraded', 'what': 'Synthetic monitoring: ' + ', '.join('%s answered %s' % (p[0], p[1]) for p in bad[:5]),
                            'impact': 'Pages listed answered an error in that sample.', 'fix': 'See the next samples on /engineering/monitoring/.', 'commits': [], 'source': '/data/monitoring.json'})
except Exception as e: print('monitoring skipped', e)
inc.sort(key=lambda x: x['start'], reverse=True)
now = datetime.datetime(2026, 11, 22, tzinfo=datetime.timezone.utc)
def ts(s): return datetime.datetime.strptime(s, '%Y-%m-%dT%H:%MZ').replace(tzinfo=datetime.timezone.utc)
last30 = [x for x in inc if (now - ts(x['start'])).days < 30]
n2 = W('incidents.json', {'version': 'incidents-1', 'built': '2026-11-22', 'about': 'Outages, failed deploys and data faults of kolaboro.com, newest first. Deploy guard results from /data/deploys.json, synthetic monitoring from /data/monitoring.json, and incidents written up in our engineering notes. Times UTC; end null = still open.',
       'summary': {'last_30_days': len(last30), 'outages_30d': sum(1 for x in last30 if x['kind'] == 'outage'), 'rollbacks_30d': sum(1 for x in last30 if '-rollback-' in x['id']), 'open': sum(1 for x in inc if x['end'] is None)},
       'incidents': inc})
print('incidents.json', len(inc), 'incidents', n2, 'bytes')
