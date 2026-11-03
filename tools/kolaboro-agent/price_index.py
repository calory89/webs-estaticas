#!/usr/bin/env python3
"""Kolaboro off-plan asking-price index (block R, 3 Nov 2026).

Input: the daily research-agent snapshots in data/runs/<date>.json (what each tracked project advertises, re-read
every day) and, optionally, kolaboro.com/data/price-reality.json (official registered sales, block H).
Output: one JSON file with a per-market chained index of ADVERTISED asking prices ("from" prices), built only from
same-project changes between two consecutive snapshots. No project names, ids, slugs or amounts are published:
only percentage changes, counts and the index level.

Method (matched-model, repeat-listing, chained Jevons index):
  1. An observation is a project whose page was re-read on that snapshot's date (checked == date) and which advertised
     a positive "from" price with a currency. Values carried over from an earlier day are not observations.
  2. For two consecutive snapshots t-1, t, a pair is a project observed on both with the SAME currency.
  3. A pair whose price moved by more than +/-25 % in one step is excluded and counted: in our data such jumps are
     almost always a different unit type, a currency mix-up or an extraction change, not a price move.
  4. Link(t) = geometric mean of p_t / p_{t-1} over the kept pairs (unchanged prices count as 1.0).
     A link needs at least MIN_PAIRS kept pairs. The index chains the most recent unbroken run of valid links;
     it is never bridged across a link that is too thin (the base date then moves to after the gap).
  5. Index(t) = 100 x product of links since the market's base date (the first snapshot with a valid next link).
Nothing is interpolated, smoothed, seasonally adjusted or extrapolated beyond the last snapshot.
"""
import glob, json, math, os, statistics, sys, hashlib

A = os.path.dirname(os.path.abspath(__file__)) + '/'
MIN_PAIRS = 5
MAX_STEP = 0.25
OUT = sys.argv[1] if len(sys.argv) > 1 else 'price-index.json'
REALITY = os.environ.get('PRICE_REALITY_JSON', '')

projs = json.load(open(A + 'projects.json'))['projects'] + json.load(open(A + 'projects-world.json')).get('projects', [])
MARKET = {p['slug']: p.get('market', 'Bali') for p in projs}

snaps, inputs = [], []
for f in sorted(glob.glob(A + 'data/runs/*.json')):
    date = os.path.basename(f)[:10]
    raw = open(f, 'rb').read()
    inputs.append({'file': 'runs/' + os.path.basename(f), 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)})
    L = json.loads(raw).get('latest') or {}
    obs = {}
    for slug, v in L.items():
        if v.get('checked') != date:
            continue
        c = v.get('claims') or {}
        p, cur = c.get('price_from'), c.get('currency')
        if isinstance(p, (int, float)) and not isinstance(p, bool) and p > 0 and cur:
            obs[slug] = (float(p), str(cur).upper(), v.get('market') or MARKET.get(slug) or 'Unknown')
    snaps.append({'date': date, 'obs': obs, 'tracked': len(L)})


def links_for(select):
    out = []
    for a, b in zip(snaps, snaps[1:]):
        o0, o1 = a['obs'], b['obs']
        both = [s for s in o0 if s in o1 and select(o1[s][2])]
        cur_diff = [s for s in both if o0[s][1] != o1[s][1]]
        same = [s for s in both if o0[s][1] == o1[s][1]]
        ch, kept, excl = [], [], 0
        for s in same:
            r = o1[s][0] / o0[s][0]
            if abs(r - 1) > MAX_STEP:
                excl += 1
                continue
            kept.append(math.log(r))
            if abs(r - 1) > 1e-9:
                ch.append(round((r - 1) * 100, 3))
        out.append({
            'from': a['date'], 'to': b['date'],
            'pairs': len(kept), 'unchanged': len(kept) - len(ch),
            'up': sum(1 for x in ch if x > 0), 'down': sum(1 for x in ch if x < 0),
            'excluded_jump': excl, 'excluded_currency': len(cur_diff),
            'changes_pct': sorted(ch),
            'link': round(math.exp(sum(kept) / len(kept)), 6) if len(kept) >= MIN_PAIRS else None,
            'median_change_pct': round(statistics.median([x for x in ch]) , 3) if ch else 0.0,
        })
    return out


def chain(links):
    """Chain the most recent unbroken run of valid links. Earlier links before a gap are reported, not chained across it."""
    end = len(links)
    while end > 0 and links[end - 1]['link'] is None:
        end -= 1
    start = end
    while start > 0 and links[start - 1]['link'] is not None:
        start -= 1
    if start == end:
        return [], None
    series, level = [{'date': links[start]['from'], 'index': 100.0, 'pairs': None}], 100.0
    for l in links[start:end]:
        level *= l['link']
        series.append({'date': l['to'], 'index': round(level, 3), 'pairs': l['pairs']})
    gap = links[start - 1]['to'] if start > 0 else None
    return series, gap


markets = sorted({o[2] for s in snaps for o in s['obs'].values()})
res = []
for m in markets:
    L = links_for(lambda x, m=m: x == m)
    total_pairs = sum(l['pairs'] for l in L)
    if total_pairs == 0:
        continue
    series, broken = chain(L)
    res.append({'market': m, 'pairs_total': total_pairs, 'changes_total': sum(l['up'] + l['down'] for l in L),
                'excluded_total': sum(l['excluded_jump'] for l in L),
                'projects_last': sum(1 for o in snaps[-1]['obs'].values() if o[2] == m),
                'index': series, 'restarted_after_gap_at': broken, 'links': L})
res.sort(key=lambda r: -r['pairs_total'])
allL = links_for(lambda x: True)
allS, allB = chain(allL)

official = []
if REALITY and os.path.exists(REALITY):
    try:
        R = json.load(open(REALITY))
        for m in R.get('markets', []):
            o = m.get('official') or {}
            mo = [x for x in o.get('monthly') or [] if x.get('n') and x.get('median_local')]
            if len(mo) >= 2:
                official.append({'market': m['market'], 'source': o.get('source'), 'url': o.get('url'), 'what': o.get('what_short'),
                                 'filter': o.get('filter'), 'currency': o.get('currency'),
                                 'monthly': [{'month': x['month'], 'n': x['n'], 'median_local': x['median_local']} for x in mo]})
    except Exception as e:
        print('price-reality not read:', e)

doc = {
    'version': 'price-index-1',
    'generated': snaps[-1]['date'] if snaps else None,
    'history_starts': snaps[0]['date'] if snaps else None,
    'snapshots': [{'date': s['date'], 'projects_in_snapshot': s['tracked'], 'observed_with_price': len(s['obs'])} for s in snaps],
    'what': 'Advertised asking prices ("from" prices on developer and listing pages), not transaction prices.',
    'rules': {'min_pairs_per_link': MIN_PAIRS, 'max_step_change_pct': MAX_STEP * 100, 'formula': 'chained Jevons: link = geometric mean of p_t/p_(t-1) over same-project, same-currency pairs observed on both days'},
    'caveats': [
        'History starts on %s. It is a few days long and thin: most links rest on a few dozen pairs or fewer.' % (snaps[0]['date'] if snaps else 'n/a'),
        'An advertised "from" price is the cheapest unit on offer. It moves when that unit sells out, not only when prices change.',
        'Prices are read from pages by a model and can be misread. Steps over 25 % are excluded and counted, not corrected.',
        'Snapshots are not evenly spaced (no snapshot on some days). A link covers the time between two snapshots, whatever it is.',
        'Nothing here is a forecast. The index is not extended past the last snapshot and not filled in where a link is missing.',
    ],
    'all_markets': {'index': allS, 'restarted_after_gap_at': allB, 'pairs_total': sum(l['pairs'] for l in allL), 'links': allL},
    'markets': res,
    'official_reference': official,
    'official_note': 'Official registered sales are a different measure (all units sold, mix changes month to month). They are shown next to the index for context, never combined with it.',
    'inputs': inputs,
}
json.dump(doc, open(OUT, 'w'), indent=None, separators=(',', ':'))
print('markets', len(res), 'links', len(allL), 'all-market pairs', doc['all_markets']['pairs_total'], 'last', allS[-1] if allS else None)
