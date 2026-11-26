#!/usr/bin/env python3
"""kolaboro.com batch 34 (n34b, 21 Nov 2026): static data behind the product pages of this batch.
Reads only published files under _s/kolaboro.com/data/ (no network, no model calls). Usage: n34b-build.py <site-dir>
Writes:
  data/n34b-search.json   one row per public project for /search/ facets, the report builder picker and the command palette
  data/n34b-markets.json  per market: stage mix, handover dates past, dates moved, disclosure, price per m2 with a 95% bootstrap
                          interval, official registers we link; used by /markets/compare/
Intervals: percentile bootstrap of the median, 2,000 resamples, fixed seed 34, only when the sample has 5 or more values.
Projects in Sumba and anything named Eco Beach City or Equinox are left out (conflict of interest)."""
import json, sys, os, re, hashlib, random, statistics, collections
if len(sys.argv) > 2 and sys.argv[2] == 'n35b':   # batch 35 (n35b, 22 Nov 2026): price per m2 and incident data, one file (Pages file limit)
    exec(compile('"""kolaboro.com batch 35 (n35b, 22 Nov 2026): static data behind the price per m2 checker and the incident history.\nReads only published files under _s/kolaboro.com/data/ (no network, no model calls). Usage: n34b-build.py <site-dir> n35b\nWrites:\n  data/n35b.json "ppm"  per market (5+ listings in its main currency): every price per m2 (developer starting price / smallest unit\n                        size, same rules as n34b-markets.json), quartiles, median with a 95% bootstrap interval (2,000 resamples,\n                        seed 35); used by /tools/price-per-m2/\n  data/n35b.json "incidents" dated incident list for /engineering/status/: rolled-back deploys and deploys that never went live (deploys.json),\n                        non-200 answers in the synthetic monitoring samples (monitoring.json), plus the incidents written up in our\n                        engineering notes (NOTES below, each with its commits). Times UTC.\nProjects in Sumba and anything named Eco Beach City or Equinox are left out (conflict of interest)."""\nimport json, sys, os, re, random, statistics, collections, hashlib, datetime\n\nSITE = sys.argv[1]\nD = os.path.join(SITE, \'data\')\ndef J(p): return json.load(open(os.path.join(D, p)))\ndef W(p, o):\n    s = json.dumps(o, ensure_ascii=False, separators=(\',\', \':\'))\n    open(os.path.join(D, p), \'w\').write(s); return len(s.encode())\ndef sha(p): return hashlib.sha256(open(os.path.join(D, p), \'rb\').read()).hexdigest()\n\nCOI = re.compile(r\'eco\\s*beach|\\bequinox\\b|\\bsumba\\b\', re.I)\nnamed = J(\'named.json\')\nP = [p for p in named[\'projects\'] if not COI.search(\' \'.join(str(p.get(k) or \'\') for k in (\'n\', \'dv\', \'mk\', \'ar\')))]\nRS = re.compile(r\'^Latest registered home sales listed on the page \\((\\d+), ([^)]*?) to ([^)]*?)\\): (AED) ([\\d,]+) to AED ([\\d,]+)\')\ndef reg_sale(x):\n    fx = x.get(\'fx\') or {}\n    try: pm = float(fx.get(\'price_min\') or 0); px = None if fx.get(\'price_max\') is None else float(fx[\'price_max\'])\n    except (TypeError, ValueError): return False\n    if pm <= 0: return False\n    for t in [c[0] for c in (x.get(\'cl\') or [])] + list(x.get(\'dl\') or []):\n        m = RS.match(str(t or \'\'))\n        if not m: continue\n        a = float(m.group(5).replace(\',\', \'\')); b = float(m.group(6).replace(\',\', \'\'))\n        if a == pm and (b <= pm if px is None else px == b): return True\n    return False\ndef ppm(x):\n    fx = x.get(\'fx\') or {}\n    try: p = float(fx.get(\'price_min\') or 0); s = float(fx.get(\'size_min_m2\') or 0)\n    except (TypeError, ValueError): return None\n    if reg_sale(x): return None\n    return p / s if p > 0 and 15 <= s <= 5000 and fx.get(\'currency\') else None\n\nrnd = random.Random(35)\ndef boot(v, k=2000):\n    v = sorted(v); n = len(v); meds = []\n    for _ in range(k):\n        s = sorted(v[rnd.randrange(n)] for _ in range(n)); meds.append(s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2)\n    meds.sort(); return [meds[int(0.025 * k)], meds[int(0.975 * k) - 1]]\ndef q(v, f):   # linear interpolation quantile\n    v = sorted(v); i = (len(v) - 1) * f; lo = int(i); hi = min(lo + 1, len(v) - 1); return v[lo] + (v[hi] - v[lo]) * (i - lo)\n\nby = collections.defaultdict(list)\nfor x in P: by[x[\'mk\']].append(x)\nM = []\nfor mk, L in by.items():\n    cur = collections.Counter(str((x.get(\'fx\') or {}).get(\'currency\') or \'\').upper() for x in L if ppm(x) is not None)\n    if not cur: continue\n    c0 = cur.most_common(1)[0][0]\n    v = sorted(round(ppm(x)) for x in L if ppm(x) is not None and str(x[\'fx\'][\'currency\']).upper() == c0)\n    if len(v) < 5: continue\n    co = collections.Counter(x[\'co\'] for x in L).most_common(1)[0][0]\n    ci = boot(v)\n    M.append({\'market\': mk, \'slug\': mk.lower().replace(\' \', \'-\'), \'country\': co, \'currency\': c0, \'n\': len(v), \'left_out_other_currency\': sum(cur.values()) - len(v),\n              \'median\': round(statistics.median(v)), \'ci95\': [round(ci[0]), round(ci[1])], \'q1\': round(q(v, .25)), \'q3\': round(q(v, .75)), \'p10\': round(q(v, .1)), \'p90\': round(q(v, .9)), \'v\': v})\nM.sort(key=lambda m: -m[\'n\'])\nsrc = {\'file\': \'/data/named.json\', \'sha256\': sha(\'named.json\'), \'updated\': named[\'updated\'], \'version\': named[\'version\']}\nPPM = ({\'version\': \'n35b-ppm-1\', \'built\': named[\'updated\'], \'source\': src,\n       \'what\': \'Asking price per m2 by market: the starting price a developer publishes divided by the smallest unit size in m2 (15 to 5,000 m2), one value per project, in the market\\\'s most common currency. Not registered sale prices. DLD registered sale ranges stored as a price are left out.\',\n       \'method\': \'median with a 95% percentile bootstrap interval (2,000 resamples, seed 35); quartiles by linear interpolation; markets with 5 or more values only\',\n       \'markets\': M})\n\n# ---------------------------------------------------------------------------------------------- incidents\nNOTES = [\n {\'id\': \'2026-11-21-brotli-json\', \'start\': \'2026-11-21T08:47Z\', \'end\': \'2026-11-21T08:58Z\', \'kind\': \'outage\',\n  \'what\': \'After Brotli copies of /data/*.json were switched on, the worker\\\'s own reads of /data/bali-cases.json got the compressed copy: every /api/open/* endpoint answered data_unavailable (08:47 to 08:53). For about 5 minutes after that fix, browsers got some JSON files compressed twice.\',\n  \'impact\': \'Open data API down for 6 minutes; some JSON downloads unreadable for about 5 more minutes. HTML pages stayed up.\',\n  \'fix\': \'Worker reads take the plain copy (9d9c5759c3), then Brotli copies switched off (35a21e3f9e). They stay off; a test header keeps the path testable.\', \'commits\': [\'9d9c5759c3\', \'35a21e3f9e\'], \'source\': \'engineering notes, batch 34\'},\n {\'id\': \'2026-11-20-sitemaps-500\', \'start\': \'2026-11-20T13:07Z\', \'end\': \'2026-11-20T13:14Z\', \'kind\': \'outage\',\n  \'what\': \'A trailing comment swallowed the rest of a line in the sitemap builder ("T is not defined"): /sitemap_index.xml, every /sitemaps/*.xml and /engineering/seo/ answered 500.\',\n  \'impact\': \'Sitemaps unavailable to search engines for about 7 minutes. Pages stayed up.\', \'fix\': \'Line restored (13098cd3d2); all sitemaps 200 again with the same URL counts.\', \'commits\': [\'cdd3434416\', \'13098cd3d2\'], \'source\': \'engineering notes, batch 33\'},\n {\'id\': \'2026-11-18-pages-size\', \'start\': \'2026-11-18T13:18Z\', \'end\': \'2026-11-18T14:10Z\', \'kind\': \'deploy\',\n  \'what\': \'The edge worker directory passed the 25 MiB limit of Cloudflare Pages, so every build of the publishing branch failed (about 60 sites on that branch).\',\n  \'impact\': \'No new version could go live for about 50 minutes; visitors kept getting the previous version.\', \'fix\': \'Large string tables moved out of the worker into static JSON (019b1a96b1, then batch 32 lowered the worker from 24.50 to 22.40 MiB); a size guard now stops a push above the limit.\', \'commits\': [\'329e7afcf7\', \'019b1a96b1\'], \'source\': \'engineering notes, batches 31 and 32\'},\n {\'id\': \'2026-11-17-snapshot-chain\', \'start\': \'2026-11-18T00:00Z\', \'end\': None, \'kind\': \'data\',\n  \'what\': \'The daily dataset snapshot job stopped adding entries after 17 Nov ("chain broken at 2026-11-07"): a full-history clone saw days before the chain start.\',\n  \'impact\': \'No signed daily snapshot for 18, 19 and 20 Nov until they were added by hand on 21 Nov; the published chain stayed verifiable.\', \'fix\': \'Entries 18 to 20 Nov added from the fixed script on 21 Nov; the script fix for the scheduled job is waiting to be merged, so this stays open.\', \'commits\': [], \'source\': \'engineering notes, batch 34\'},\n]\ndep = J(\'deploys.json\')[\'deploys\']\ninc = list(NOTES)\nnd = collections.defaultdict(list)\nfor d in dep:\n    at = d.get(\'at\') or \'\'\n    if d.get(\'result\') == \'rolled_back\':\n        inc.append({\'id\': at[:10] + \'-rollback-\' + (d.get(\'commit\') or \'\')[:7], \'start\': at[:16] + \'Z\', \'end\': at[:16] + \'Z\', \'kind\': \'deploy\',\n                    \'what\': \'Deploy %s failed %d of %d live checks (%s).\' % ((d.get(\'commit\') or \'\')[:10], (d.get(\'checks_total\') or 0) - (d.get(\'checks_passed\') or 0), d.get(\'checks_total\') or 0, \', \'.join(d.get(\'failed\') or [])),\n                    \'impact\': \'Broken page live for about %d minutes before the automatic rollback.\' % max(1, round((d.get(\'wait_s\') or 0) / 60)),\n                    \'fix\': \'Deploy guard reverted %s and restored %s files; %s.\' % (\', \'.join(d.get(\'reverted\') or []), d.get(\'files_restored\', \'?\'), \'all checks passed after the rollback\' if (d.get(\'after_rollback\') or {}).get(\'failed\') == [] else \'checks after rollback recorded in deploys.json\'),\n                    \'commits\': [(d.get(\'commit\') or \'\')[:10], (d.get(\'rollback_commit\') or \'\')[:10]], \'source\': \'/data/deploys.json\'})\n    elif d.get(\'result\') == \'not_deployed\':\n        nd[at[:10]].append(d)\nfor day, L in nd.items():\n    inc.append({\'id\': day + \'-not-live\', \'start\': min(x[\'at\'] for x in L)[:16] + \'Z\', \'end\': max(x[\'at\'] for x in L)[:16] + \'Z\', \'kind\': \'deploy\',\n                \'what\': \'%d pushed commit%s not live within 12 minutes (deploy guard).\' % (len(L), \'s\' if len(L) > 1 else \'\'),\n                \'impact\': \'None for visitors: the previous version stayed live; most were replaced by a newer push before their build finished.\', \'fix\': \'No action needed; the newer commits went live and passed the checks.\',\n                \'commits\': [(x.get(\'commit\') or \'\')[:10] for x in L], \'source\': \'/data/deploys.json\'})\ntry:\n    for s in J(\'monitoring.json\').get(\'samples\') or []:\n        bad = [p for p in s.get(\'pages\') or [] if p[1] != 200]\n        if bad: inc.append({\'id\': s[\'at\'][:16] + \'-monitor\', \'start\': s[\'at\'][:16] + \'Z\', \'end\': None, \'kind\': \'degraded\', \'what\': \'Synthetic monitoring: \' + \', \'.join(\'%s answered %s\' % (p[0], p[1]) for p in bad[:5]),\n                            \'impact\': \'Pages listed answered an error in that sample.\', \'fix\': \'See the next samples on /engineering/monitoring/.\', \'commits\': [], \'source\': \'/data/monitoring.json\'})\nexcept Exception as e: print(\'monitoring skipped\', e)\ninc.sort(key=lambda x: x[\'start\'], reverse=True)\nnow = datetime.datetime(2026, 11, 22, tzinfo=datetime.timezone.utc)\ndef ts(s): return datetime.datetime.strptime(s, \'%Y-%m-%dT%H:%MZ\').replace(tzinfo=datetime.timezone.utc)\nlast30 = [x for x in inc if (now - ts(x[\'start\'])).days < 30]\nINC = ({\'version\': \'incidents-1\', \'built\': \'2026-11-22\', \'about\': \'Outages, failed deploys and data faults of kolaboro.com, newest first. Deploy guard results from /data/deploys.json, synthetic monitoring from /data/monitoring.json, and incidents written up in our engineering notes. Times UTC; end null = still open.\',\n       \'summary\': {\'last_30_days\': len(last30), \'outages_30d\': sum(1 for x in last30 if x[\'kind\'] == \'outage\'), \'rollbacks_30d\': sum(1 for x in last30 if \'-rollback-\' in x[\'id\']), \'open\': sum(1 for x in inc if x[\'end\'] is None)},\n       \'incidents\': inc})\nn = W(\'n35b.json\', {\'version\': \'n35b-1\', \'about\': \'Batch 35 (n35b) data: ppm = asking price per m2 by market for /tools/price-per-m2/; incidents = incident history for /engineering/status/. Built by /open/n34b-build.py <site> n35b.\', \'ppm\': PPM, \'incidents\': INC})\nprint(\'n35b.json\', len(M), \'markets\', len(inc), \'incidents\', n, \'bytes\')\n', 'n35b', 'exec'))
    sys.exit(0)

SITE = sys.argv[1]
D = os.path.join(SITE, 'data')
def J(p): return json.load(open(os.path.join(D, p)))
def W(p, o):
    s = json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    open(os.path.join(D, p), 'w').write(s); return len(s.encode())
def sha(p): return hashlib.sha256(open(os.path.join(D, p), 'rb').read()).hexdigest()

COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
named = J('named.json'); cases = {c['id']: c for c in J('bali-cases.json')['cases']}
PROM = J('promises.json')['projects']
def moved(i):
    """months the handover date moved later in our dated records (promises.json, kind handover), 0 when none"""
    for k in PROM.get(i) or []:
        if k.get('k') == 'handover' and (k.get('mm') or 0) > 0: return int(k['mm'])
    return 0
P = [p for p in named['projects'] if not COI.search(' '.join(str(p.get(k) or '') for k in ('n', 'dv', 'mk', 'ar')))]
slugM = lambda m: m.lower().replace(' ', '-')
STG = {'off-plan': 'o', 'under construction': 'u', 'completed': 'c'}

RS = re.compile(r'^Latest registered home sales listed on the page \((\d+), ([^)]*?) to ([^)]*?)\): (AED) ([\d,]+) to AED ([\d,]+)')
def reg_sale(x):
    """same rule as _worker.js/kbx_n31d_rs.js: a DLD registered sale range stored as the price is not an asking price"""
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

rows = []
for x in P:
    c = cases.get(x['id'], {})
    st = c.get('stage') or x.get('st') or ''
    hy = c.get('done') if isinstance(c.get('done'), int) else 0
    ov = c.get('overdue') or 0
    mv = moved(x['id'])
    rows.append([x['s'], x['n'], x['id'], x.get('dv') or '', x.get('dvs') or '', x['mk'], x['co'], x.get('ar') or '', STG.get(st, ''), 1 if x.get('pn') else 0, hy, int(ov), int(round(mv))])
rows.sort(key=lambda r: r[1].lower())
src = {'file': '/data/named.json', 'sha256': sha('named.json'), 'updated': named['updated'], 'version': named['version']}
built = named['updated']
n1 = W('n34b-search.json', {'version': 'n34b-search-1', 'built': built, 'source': src,
       'fields': ['slug', 'name', 'id', 'developer', 'developer_slug', 'market', 'country', 'area', 'stage (o off-plan, u under construction, c completed)', 'permit number published (1/0)', 'handover year on record (0 none)', 'months past the handover date on record', 'months the handover date moved'],
       'p': rows})
print('n34b-search.json', len(rows), 'rows', n1, 'bytes')

# ---------------------------------------------------------------------------------------------- markets
rnd = random.Random(34)
def boot(v, k=2000):
    if len(v) < 5: return None
    v = sorted(v); n = len(v); meds = []
    for _ in range(k):
        s = sorted(v[rnd.randrange(n)] for _ in range(n)); meds.append(s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2)
    meds.sort(); return [meds[int(0.025 * k)], meds[int(0.975 * k) - 1]]
def med(v): return statistics.median(v) if v else None

tm = {m['market']: m for m in J('transparency-monthly/2026-11.json')['markets']}
tm_meta = J('transparency-monthly/2026-11.json')
regs = J('register-checks.json')['registers']
by = collections.defaultdict(list)
for x in P: by[x['mk']].append(x)
M = []
for mk, L in by.items():
    if len(L) < 3: continue
    co = collections.Counter(x['co'] for x in L).most_common(1)[0][0]
    stc = collections.Counter(STG.get((cases.get(x['id'], {}).get('stage') or x.get('st') or ''), '') for x in L)
    yrs = [cases.get(x['id'], {}).get('done') for x in L]
    with_date = sum(1 for y in yrs if isinstance(y, int))
    ov = [cases[x['id']]['overdue'] for x in L if cases.get(x['id'], {}).get('overdue')]
    mv = [moved(x['id']) for x in L if moved(x['id'])]
    cur = collections.Counter(str((x.get('fx') or {}).get('currency') or '').upper() for x in L if ppm(x) is not None)
    pm = None
    if cur:
        c0 = cur.most_common(1)[0][0]; v = [ppm(x) for x in L if ppm(x) is not None and str(x['fx']['currency']).upper() == c0]
        ci = boot(v)
        pm = {'currency': c0, 'n': len(v), 'median': round(med(v)), 'ci95': [round(ci[0]), round(ci[1])] if ci else None}
    ovs = {'n': len(ov), 'median': med(ov), 'ci95': boot(ov)} if ov else {'n': 0}
    mvs = {'n': len(mv), 'median': med(mv), 'ci95': boot(mv)} if mv else {'n': 0}
    t = tm.get(mk) or {}
    rg = [{'name': r['register'], 'url': r['url'], 'checks': r.get('checks') or [], 'automation': r.get('automation'), 'probed': (r.get('probed_at') or '')[:10]} for r in regs if r['market'] in (mk, co)]
    M.append({'market': mk, 'slug': slugM(mk), 'country': co, 'projects': len(L),
              'stage': {'o': stc.get('o', 0), 'u': stc.get('u', 0), 'c': stc.get('c', 0)},
              'with_date': with_date, 'past_date': ovs, 'moved': mvs,
              'permit_published': sum(1 for x in L if x.get('pn')),
              'disclosure': {k: t.get(k) for k in ('transparency_index', 'avg_checks', 'avg_confirmed', 'permit_public_pct', 'deposit_protection_pct', 'all_six_public')} if t else None,
              'ppm': pm, 'registers': rg})
M.sort(key=lambda m: -m['projects'])
n2 = W('n34b-markets.json', {'version': 'n34b-markets-1', 'built': built, 'source': src,
       'disclosure_source': {'file': '/data/transparency-monthly/2026-11.json', 'edition': tm_meta['edition'], 'method': tm_meta['method']},
       'registers_source': '/data/register-checks.json',
       'method': 'Counts from the public dataset. Months past the handover date on record come from bali-cases.json (overdue); months the date moved later come from promises.json (handover promises, months moved). Price per m2 = advertised price from / smallest unit size, in the currency most projects of the market use, registered sale prices left out. Intervals: percentile bootstrap of the median, 2,000 resamples, seed 34, shown only for samples of 5 or more.',
       'markets': M})
print('n34b-markets.json', len(M), 'markets', n2, 'bytes')

# ---------------------------------------------------------------------------------------------- command palette (/k/palette.js)
# every buyer tool listed on /tools/ (English title from the hub, the translated title where /<lang>/tools/<x>/ exists), the pages of
# batch 34 and the palette's own labels, all in 8 languages
import html as H
LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar']
I18N = J('n34b-i18n.json')
hub = open(os.path.join(SITE, 'tools', 'index.html')).read()
man = J('n32t/manifest.json')['pages']
tools, seen = [], set()
for m in re.finditer(r'<a[^>]*href="(/tools/[a-z0-9-]+/)"[^>]*>(.*?)</a>', hub, re.S):
    path = m.group(1)
    if path in seen or path == '/tools/due-diligence/': continue   # batch 34 pages are listed below with their 8 titles
    seen.add(path)
    b = re.search(r'<b>(.*?)</b>', m.group(2), re.S)
    en = H.unescape(re.sub(r'<[^>]+>', '', b.group(1) if b else m.group(2))).strip()
    en = re.sub(r'\s+', ' ', en).split(':')[0].strip() if not b else re.sub(r'\s+', ' ', en)
    tr = {}
    key = path.strip('/')
    if key in man:
        for l in LANGS[1:]:
            f = os.path.join(D, 'n32t', l, key.replace('/', '-') + '.json')
            if os.path.exists(f):
                t = json.load(open(f)).get('t')
                if t: tr[l] = t
    tools.append([path, en, tr])
pages = [['/search/', {l: I18N[l]['se_t'] for l in LANGS}, 'search find filter projects country stage permit handover'],
         ['/tools/due-diligence/', {l: I18N[l]['dd_t'] for l in LANGS}, 'due diligence report pdf print checks questions'],
         ['/markets/compare/', {l: I18N[l]['mc_t'] for l in LANGS}, 'compare markets delays disclosure price per m2 registers'],
         ['/watchlist/', {l: I18N[l]['wl_t'] for l in LANGS}, 'watchlist saved alerts notifications changes my projects']]
n3 = W('n34b-palette.json', {'version': 'n34b-palette-1', 'built': built, 'translated_tools': sorted(k for k in man if k.startswith('tools/')),
       'tools': tools, 'pages': pages, 'labels': {l: I18N[l]['pal'] for l in LANGS}})
print('n34b-palette.json', len(tools), 'tools', n3, 'bytes')
