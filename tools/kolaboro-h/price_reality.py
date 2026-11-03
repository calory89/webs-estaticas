# Build data/price-reality.json: advertised prices (Kolaboro dataset) versus officially registered sales.
# Usage: python3 -I price_reality.py <dl dir> <site dir> <ecb xml file>
import json, sys, os, glob, csv, statistics, hashlib, re, datetime
DL, SITE, ECB = sys.argv[1], sys.argv[2], sys.argv[3]
cases = json.load(open(os.path.join(SITE, 'data/bali-cases.json')))
wc = json.load(open(os.path.join(SITE, 'data/world-claims.json')))['markets']
x = open(ECB).read()
ecb_date = re.search(r"time='([\d-]+)'", x).group(1)
rate = lambda c: float(re.search(r"currency='%s' rate='([\d.]+)'" % c, x).group(1))
USD_PER_EUR = rate('USD'); GBP_PER_EUR = rate('GBP')
FX = {
  'AED': {'usd_per_unit': round(1 / 3.6725, 8), 'basis': 'UAE dirham fixed peg of 3.6725 AED per USD (Central Bank of the UAE, in force since 1997)', 'source': 'https://www.centralbank.ae/en/'},
  'EUR': {'usd_per_unit': USD_PER_EUR, 'basis': 'ECB euro foreign exchange reference rate of ' + ecb_date, 'source': 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'},
  'GBP': {'usd_per_unit': round(USD_PER_EUR / GBP_PER_EUR, 6), 'basis': 'cross rate from ECB reference rates of %s (USD %s and GBP %s per EUR)' % (ecb_date, USD_PER_EUR, GBP_PER_EUR), 'source': 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'},
}
BANDS = [('Under $100k', 0, 1e5), ('$100k to $200k', 1e5, 2e5), ('$200k to $400k', 2e5, 4e5), ('$400k and up', 4e5, float('inf'))]

def q(v, p):
    v = sorted(v); k = (len(v) - 1) * p; f = int(k); c = min(f + 1, len(v) - 1); return v[f] + (v[c] - v[f]) * (k - f)
def pctile(v, x):  # share of values strictly below x, in percent
    import bisect; v = sorted(v); return 100.0 * bisect.bisect_left(v, x) / len(v)
def r0(x): return int(round(x))
def r1(x): return round(x, 1)

def market_block(name, usd, local_cur, meta, per_m2=None, monthly=None):
    fx = FX[local_cur]['usd_per_unit']
    n = len(usd); med = q(usd, .5)
    off = {**meta, 'n': n, 'currency': local_cur, 'median_local': r0(med / fx), 'p25_local': r0(q(usd, .25) / fx), 'p75_local': r0(q(usd, .75) / fx),
           'median_usd': r0(med), 'p25_usd': r0(q(usd, .25)), 'p75_usd': r0(q(usd, .75)),
           'band_share_pct': {b: r1(100.0 * sum(1 for u in usd if lo <= u < hi) / n) for b, lo, hi in BANDS}}
    if monthly: off['monthly'] = monthly
    adv = wc.get(name, {}).get('price_usd') or {}
    a = {'n_known': adv.get('known') or 0, 'projects': wc.get(name, {}).get('projects'), 'median_usd': adv.get('median'),
         'what': 'advertised starting price ("from" price) read from developer pages and new-build portals, as already published in our dataset in USD'}
    comp = None
    if a['n_known'] >= 5 and n >= 30 and a['median_usd']:
        pct = 100.0 * (a['median_usd'] / med - 1)
        comp = {'pct': r1(pct), 'advertised_percentile': r1(pctile(usd, a['median_usd'])),
                'text': 'The median advertised starting price (%d projects) is %s%% %s the median price of registered %s in %s (%s sales, %s).' % (
                    a['n_known'], abs(r0(pct)), 'above' if pct >= 0 else 'below', meta['what_short'], meta['area'], format(n, ','), meta.get('period_short', meta['period_text']))}
    else:
        comp = None
    projects = []
    for c in cases['cases']:
        if c['market'] != name: continue
        b = next((bb for bb in BANDS if bb[0] == c['band']), None)
        if not b:
            projects.append({'id': c['id'], 'band': c['band'], 'status': 'no advertised price', 'text': 'No price is advertised, so there is nothing to compare.'}); continue
        lo, hi = pctile(usd, b[1]), (100.0 if b[2] == float('inf') else pctile(usd, b[2]))
        projects.append({'id': c['id'], 'band': b[0], 'share_of_registered_in_band_pct': r1(hi - lo), 'percentile_from': r1(lo), 'percentile_to': r1(hi),
                         'text': 'Advertised band %s covers the %s to %s percentile of registered %s in %s: %s%% of %s sales fall in it.' % (
                             b[0], ordinal(r0(lo)), ordinal(r0(hi)), meta['what_short'], meta['area'], r1(hi - lo), format(n, ','))})
    out = {'market': name, 'official': off, 'advertised': a, 'comparison': comp, 'projects': projects}
    if comp is None:
        out['comparison_withheld'] = 'Only %d tracked project%s in %s advertise a price; we compare medians only from 5 projects up.' % (a['n_known'], '' if a['n_known'] == 1 else 's', name) if a['n_known'] < 5 else 'Too few registered sales.'
    if per_m2: out['per_m2'] = per_m2
    return out

def ordinal(n):
    n = max(0, min(100, n)); s = 'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th'); return '%d%s' % (n, s)

markets, inputs = [], []
# ---------- Dubai: DLD ----------
rows = []
for fn in sorted(glob.glob(os.path.join(DL, 'dld', '20??-??.jsonl'))):
    rows += [json.loads(l) for l in open(fn)]
for fn in glob.glob(os.path.join(DL, 'dld', 'manifest-*.json')):
    for m in json.load(open(fn)): inputs.append({'source': 'DLD open data, transactions', 'request': 'off-plan residential sales, ' + m['month'] + ', skip ' + str(m['skip']), 'fetched_at': m['at'], 'bytes': m['bytes'], 'sha256': m['sha256']})
rows = [r for r in rows if r['v'] and r['v'] >= 50000]
fxa = FX['AED']['usd_per_unit']
usd = [r['v'] * fxa for r in rows]
dates = sorted(r['d'] for r in rows)
MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
_m = lambda d: MN[int(d[5:7]) - 1]
DUBAI_PERIOD = ('%s to %s %s' % (_m(dates[0]), _m(dates[-1]), dates[-1][:4])) if dates[0][:4] == dates[-1][:4] else ('%s %s to %s %s' % (_m(dates[0]), dates[0][:4], _m(dates[-1]), dates[-1][:4]))
UKY = str(datetime.date.today().year - 1)
by_area = {}
for r in rows:
    if r['m2'] and 15 <= r['m2'] <= 5000: by_area.setdefault(r['a'].upper(), []).append(r['v'] / r['m2'])
areas = sorted(([a, v] for a, v in by_area.items() if len(v) >= 100), key=lambda t: -len(t[1]))
allm2 = [y for v in by_area.values() for y in v]
per_m2 = {'what': 'median registered price per m2 of off-plan residential sales, by DLD area (areas with 100 or more sales)', 'currency': 'AED',
          'all': {'n': len(allm2), 'median_local': r0(q(allm2, .5)), 'median_usd': r0(q(allm2, .5) * fxa)},
          'areas': [{'area': a.title().replace("'S", "'s").replace(' Ph ', ' Phase '), 'n': len(v), 'median_local': r0(q(v, .5)), 'p25_local': r0(q(v, .25)), 'p75_local': r0(q(v, .75)), 'median_usd': r0(q(v, .5) * fxa)} for a, v in areas],
          'advertised_side': 'Not compared. Our public dataset holds each project\'s price band and market, not its unit sizes or exact sub-area, so an advertised price per m2 cannot be computed yet. The table is the official reference a buyer can hold a quote against.'}
mon = {}
for r in rows: mon.setdefault(r['d'][:7], []).append(r['v'])
monthly = [{'month': k, 'n': len(v), 'median_local': r0(q(v, .5))} for k, v in sorted(mon.items())]
# advertised price per m2 (private agent data, never published) against the official per-m2 distribution of the project's DLD area
AG = os.path.join(DL, 'agent')
AREA_MAP = {'DXB-022': ['DUBAI MARITIME CITY', 'MADINAT DUBAI ALMELAHEYAH'], 'DXB-051': ['DUBAI MARITIME CITY', 'MADINAT DUBAI ALMELAHEYAH'], 'DXB-024': ['ZAABEEL SECOND'],
  'DXB-031': ['PALM DEIRA'], 'DXB-053': ['PALM DEIRA'], 'DXB-035': ['DUBAI CREEK HARBOUR', 'AL KHAIRAN FIRST'], 'DXB-036': ['NAD AL SHIBA FIRST'], 'DXB-037': ['SILICON OASIS'],
  'DXB-038': ['JUMEIRAH VILLAGE CIRCLE'], 'DXB-039': ['DUBAI LAND RESIDENCE COMPLEX', 'WADI AL SAFA 5'], 'DXB-041': ['HADAEQ SHEIKH MOHAMMED BIN RASHID'], 'DXB-043': ['DUBAI MARINA', 'MARSA DUBAI'],
  'DXB-045': ['AL HEBIAH FIFTH'], 'DXB-046': ['INTERNATIONAL CITY PH 2 & 3'], 'DXB-048': ['MADINAT AL MATAAR'], 'DXB-054': ['AL KIFAF'], 'DXB-055': ['PALM JUMEIRAH'], 'DXB-058': ['PALM JUMEIRAH'],
  'DXB-056': ['JUMEIRAH VILLAGE TRIANGLE'], 'DXB-057': ['WADI AL SAFA 3'], 'DXB-059': ['CITY OF ARABIA', 'WADI AL SAFA 4']}
UNMAPPED_WHY = 'its area has fewer than 30 registered off-plan sales in the period, or it does not map to one DLD area without guessing'
ppm2_adv = {}
if os.path.exists(os.path.join(AG, 'idmap.json')):
    idm = json.load(open(os.path.join(AG, 'idmap.json')))
    PJ = {p['slug']: p for p in json.load(open(os.path.join(AG, 'pb.json')))['projects'] + json.load(open(os.path.join(AG, 'pw.json')))['projects']}
    for pid, slug in idm.items():
        sd = PJ[slug].get('seed') or {}
        if PJ[slug].get('market') == 'Dubai' and sd.get('price_per_m2') and sd.get('currency') == 'AED': ppm2_adv[pid] = float(sd['price_per_m2'])
def nbucket(n): return '1,000 or more' if n >= 1000 else '500 to 999' if n >= 500 else '100 to 499' if n >= 100 else '30 to 99'
pp_rows = {}
for pid, v in ppm2_adv.items():
    areas = AREA_MAP.get(pid); vals = [y for a in (areas or []) for y in by_area.get(a, [])]
    if not areas or len(vals) < 30: pp_rows[pid] = {'status': 'not compared', 'why': UNMAPPED_WHY}; continue
    med = q(vals, .5); pct = 100.0 * (v / med - 1); pcl = pctile(vals, v)
    pp_rows[pid] = {'status': 'compared', 'pct_vs_area_median': r1(pct), 'percentile_in_area': r1(pcl), 'area_sales': nbucket(len(vals)),
      'text': ('Advertised price per m2 is in line with' if abs(pct) < 1 else 'Advertised price per m2 is %d%% %s' % (abs(r0(pct)), 'above' if pct >= 0 else 'below')) + ' the median registered off-plan price per m2 in its DLD area (%s sales, %s), at the %s percentile.' % (nbucket(len(vals)), DUBAI_PERIOD, ordinal(r0(pcl)))}
cmp_pp = [x for x in pp_rows.values() if x['status'] == 'compared']
per_m2['advertised_side'] = ('%d of the 71 tracked Dubai projects advertise a price per m2; %d of them map to one DLD area with 30 or more registered off-plan sales and are compared below, against the same currency (AED, no conversion). '
  'The area is not named on the project, to keep projects anonymous.' % (len(ppm2_adv), len(cmp_pp)))
if cmp_pp:
    per_m2['projects_compared'] = len(cmp_pp)
    per_m2['median_pct_vs_area'] = r1(statistics.median([x['pct_vs_area_median'] for x in cmp_pp]))
    per_m2['above_area_median'] = sum(1 for x in cmp_pp if x['pct_vs_area_median'] > 0)
markets.append(market_block('Dubai', usd, 'AED', {
    'source': 'Dubai Land Department (DLD), Open Data: Real Estate Data, transactions', 'url': 'https://dubailand.gov.ae/en/open-data/real-estate-data/',
    'access': 'public, no account: the same API the DLD open-data page uses (gateway.dubailand.gov.ae/open-data/transactions)',
    'licence': 'Published by DLD as open data; no licence text is shown on the page (checked 3 Nov 2026). We republish only counts, medians and quartiles, never single transactions.',
    'filter': 'Sales group, residential use, off-plan, value at least AED 50,000', 'area': 'Dubai', 'what_short': 'off-plan residential sales',
    'period': [dates[0], dates[-1]], 'period_text': DUBAI_PERIOD}, per_m2, monthly))
for pr in markets[-1]['projects']:
    if pr['id'] in pp_rows: pr['per_m2'] = pp_rows[pr['id']]
# ---------- UK: HM Land Registry Price Paid Data ----------
ppd = [json.loads(l) for l in open(os.path.join(DL, 'ppd', 'rows.jsonl'))]
for m in json.load(open(os.path.join(DL, 'ppd', 'rows.jsonl.manifest.json'))): inputs.append({'source': 'HM Land Registry Price Paid Data', 'request': m['file'].rsplit('/', 1)[1], 'fetched_at': m['at'], 'rows': m['rows'], 'sha256': m['sha256'], 'last_modified': m['last_modified']})
fxg = FX['GBP']['usd_per_unit']
AREA_TXT = {'London': 'Greater London', 'Manchester': 'Manchester (local authority)', 'Birmingham': 'Birmingham (local authority)', 'Leeds': 'Leeds (local authority)', 'Liverpool': 'Liverpool (local authority)'}
for mk in ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool']:
    rr = [r for r in ppd if r['mk'] == mk and r['d'].startswith(UKY)]
    if len(rr) < 30: continue
    markets.append(market_block(mk, [r['v'] * fxg for r in rr], 'GBP', {
        'source': 'HM Land Registry, Price Paid Data', 'url': 'https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads',
        'access': 'public bulk CSV, no account', 'licence': 'Open Government Licence v3.0. Contains HM Land Registry data (c) Crown copyright and database right 2026.',
        'filter': 'new-build flag Y, standard price paid (category A), houses and flats', 'area': AREA_TXT[mk], 'what_short': 'new-build sales',
        'period': [UKY + '-01-01', UKY + '-12-31'], 'period_short': UKY, 'period_text': 'completions registered for ' + UKY + '; new builds reach the register months late, so the current year is still thin'}))
# ---------- Ireland: Property Price Register ----------
fxe = FX['EUR']['usd_per_unit']; ppr = []
for fn in sorted(glob.glob(os.path.join(DL, 'ppr', 'ppr-*.csv'))):
    raw = open(fn, 'rb').read(); inputs.append({'source': 'Property Price Register (PSRA)', 'request': os.path.basename(fn).replace('ppr', 'PPR').replace('.csv', '-Dublin.csv'), 'fetched_at': datetime.datetime.fromtimestamp(os.path.getmtime(fn), datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
    for r in list(csv.reader(raw.decode('latin-1').splitlines()))[1:]:
        if len(r) < 8 or not r[7].startswith('New Dwelling') or r[5] != 'No': continue
        v = float(re.sub(r'[^\d.]', '', r[4]));
        if r[6] == 'Yes': v *= 1.135
        ppr.append((r[0][6:] + '-' + r[0][3:5] + '-' + r[0][:2], v))
last = max(d for d, _ in ppr); start = (datetime.date.fromisoformat(last) - datetime.timedelta(days=365)).isoformat()
pr = [v for d, v in ppr if d > start]
markets.append(market_block('Dublin', [v * fxe for v in pr], 'EUR', {
    'source': 'Property Services Regulatory Authority, Residential Property Price Register', 'url': 'https://www.propertypriceregister.ie/',
    'access': 'public CSV download, no account', 'licence': 'Published by the PSRA for public access; reuse under the Re-use of Public Sector Information Regulations. Prices of new dwellings are filed without VAT: we add 13.5% VAT (the Irish rate for new homes) so they compare with advertised prices.',
    'filter': 'new dwellings, full market price, VAT added back', 'area': 'County Dublin', 'what_short': 'new-dwelling sales',
    'period': [start, last], 'period_text': 'the 12 months to ' + last}))
# ---------- coverage of the other markets ----------
KNOWN = {
  'Abu Dhabi': 'Official sales data exists (ADREC / DARI) but we have not confirmed a no-account machine-readable download.',
  'Algarve': 'Portugal\'s INE publishes the official median price per m2 of dwellings sold, by municipality. Not connected yet, and our advertised side has no unit sizes.',
  'Lisbon': 'Portugal\'s INE publishes the official median price per m2 of dwellings sold, by municipality. Not connected yet.',
  'Portugal': 'INE official median price per m2 exists by municipality; tracked projects here are not tied to one municipality in our public data.',
  'Madeira': 'INE official median price per m2 exists by municipality. Not connected yet.',
  'French Riviera': 'France publishes every sale (DVF, Licence Ouverte). Not connected yet.',
  'French Alps': 'France publishes every sale (DVF, Licence Ouverte). Not connected yet.',
  'Sydney': 'NSW Valuer General publishes bulk sales data openly. Not connected yet.',
  'New York': 'NYC Department of Finance publishes rolling sales openly. Not connected yet.',
  'Edinburgh': 'Registers of Scotland sells price data; no free per-sale download, so no comparison.',
  'Glasgow': 'Registers of Scotland sells price data; no free per-sale download, so no comparison.',
  'Spain': 'Spain publishes notarial and registrar statistics as aggregates, not per sale; not connected.',
  'Costa del Sol': 'Spain publishes notarial and registrar statistics as aggregates, not per sale; not connected.',
}
done = {m['market'] for m in markets}
cnt = {}
for c in cases['cases']: cnt[c['market']] = cnt.get(c['market'], 0) + 1
not_cov = [{'market': k, 'projects': v, 'note': KNOWN.get(k, 'No official open transaction data that we have found and confirmed. No comparison is shown.')} for k, v in sorted(cnt.items(), key=lambda t: -t[1]) if k not in done]
compared = sum(len(m['projects']) for m in markets)
out = {
  'version': 'price-reality-1', 'updated': datetime.date.today().isoformat(),
  'summary': {'markets_with_official_data': len(markets), 'projects_positioned': compared, 'projects_total': len(cases['cases']), 'registered_sales_used': sum(m['official']['n'] for m in markets),
              'market_comparisons': sum(1 for m in markets if m['comparison'])},
  'method': ['Official side: every registered sale in the stated period and filter, converted to USD at the cited rate. We publish counts, quartiles and medians only.',
             'Advertised side: the starting price each project advertises, as already held in our dataset (USD, per project as a price band).',
             'Market comparison: median advertised starting price versus median registered sale, shown only when at least 5 tracked projects in the market advertise a price and at least 30 sales are registered. A starting price is the cheapest unit, so a figure below the registered median is expected and is not a sign of a bargain.',
             'Per project: each project is public only as a price band, so we show where that band sits in the registered distribution (which percentiles it covers), never a made-up point price.',
             'Price per m2: only Dubai publishes floor area with each sale. Where a Dubai project advertises a price per m2 and its location maps to one DLD area with 30 or more sales, we compare the two in AED. The area is not shown on the project page, so projects stay anonymous.'],
  'fx': FX, 'inputs': inputs, 'markets': markets, 'not_covered': not_cov,
}
s = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
out['inputs_sha256'] = hashlib.sha256(json.dumps(inputs, sort_keys=True).encode()).hexdigest()
json.dump(out, open(os.path.join(SITE, 'data/price-reality.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
for m in markets: print(m['market'], m['official']['n'], m['official']['median_usd'], m['comparison'] and m['comparison']['text'])
print(out['summary'])
