#!/usr/bin/env python3
"""Kolaboro Research Agent.

Reads the public pages of tracked off-plan projects, asks Claude to extract what each
developer advertises (price, title, lease, completion, yield, guarantees, permit claims),
compares with the last run and writes:
  data/latest.json            internal, per project (private repo only)
  data/runs/<date>.json       internal snapshot
  data/changes.json           internal log of what developers changed
  <public_out>                public aggregates only, no project names

Usage: python3 agent.py [public_out_path]
Env: ANTHROPIC_API_KEY (optional: without it, aggregates are rebuilt from the seed data),
     KB_MODEL (default claude-haiku-5-5), KB_MAX_CALLS (default 30), KB_MAX_USD (default 3).
"""
import json, os, re, sys, time, hashlib, statistics, urllib.request, html as H
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
TODAY = datetime.now(timezone.utc).strftime('%Y-%m-%d')
KEY = os.environ.get('ANTHROPIC_API_KEY', '').strip()
MODELS = [m for m in [os.environ.get('KB_MODEL'), 'claude-haiku-5-5', 'claude-sonnet-5-5'] if m]
MAX_CALLS = int(os.environ.get('KB_MAX_CALLS', '30'))
MAX_USD = float(os.environ.get('KB_MAX_USD', '3'))
PRICE_IN, PRICE_OUT = 1.0 / 1e6, 5.0 / 1e6   # conservative USD per token estimate used only as a spending guard
spent = {'in': 0, 'out': 0, 'calls': 0}
FX = {'USD': 1.0, 'EUR': 1.08, 'IDR': 1 / 16000.0, 'AUD': 0.65, 'AED': 0.2723, 'THB': 1 / 34.0, 'MXN': 1 / 18.5, 'GBP': 1.27,
      'OMR': 2.6, 'TRY': 1 / 41.0, 'EGP': 1 / 48.0, 'GEL': 0.37, 'COP': 1 / 4000.0, 'BRL': 0.18, 'DOP': 1 / 62.0, 'VND': 1 / 26000.0, 'PHP': 1 / 58.0,
      'MYR': 0.23, 'LKR': 1 / 300.0, 'JPY': 1 / 150.0, 'CRC': 1 / 510.0, 'KHR': 1 / 4050.0, 'SAR': 0.2667, 'QAR': 0.2747}  # rough, for the public median only

FIELDS = ["price_from", "currency", "title_type", "lease_years_base", "extension_promised", "guaranteed_language",
          "advertised_yield_pct", "completion_year", "permit_claim", "permit_number", "plans_published", "escrow_or_guarantee", "quotes"]

PROMPT = """You are Kolaboro's research agent. Kolaboro protects people who buy property abroad.
Below is the text of a public web page about an off-plan property project in {market}, {country}.
Extract ONLY what the page itself advertises. Do not guess. Use null when the page doesn't say.

Reply with ONLY a single JSON object, no other text before or after it. If the page has little or no information, still return the object with null values.
The JSON object has exactly these keys:
- price_from: number (the lowest advertised price) or null
- currency: the ISO currency code of the price as written (e.g. "USD", "EUR", "AED", "THB", "TRY", "EGP", "VND", "PHP", "MYR") or null
- title_type: "leasehold" | "freehold" | "hgb" | "hak_pakai" | "pt_pma" | "fideicomiso" | null
- lease_years_base: number of years of the base lease, or null
- extension_promised: true if an extension or renewal of the lease is promised, false if the page says none, null if not mentioned
- guaranteed_language: true if the page uses words like "guaranteed" about returns, rental income, extensions or buy-back
- advertised_yield_pct: the advertised yearly rental yield or ROI in percent (number), or null
- completion_year: year of completion or handover as a number, or null
- permit_claim: true if the page claims building permits or approvals (PBG, IMB, RERA/DLD, EIA, licencia, alvara, licence) are obtained
- permit_number: the permit / registration number exactly as written on the page (e.g. PBG no., RERA project no., licence no.), or null
- plans_published: true if the page shows or links site plans or floor plans
- escrow_or_guarantee: escrow account, bank guarantee or trust (fideicomiso) details as written, or null
- quotes: up to 3 short verbatim quotes (max 20 words each) from the page that support the claims above

Project: {name} by {developer} in {area}, {market}
Page text:
<<<
{text}
>>>"""

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/research)'})
    with urllib.request.urlopen(req, timeout=40) as r:
        raw = r.read(2_000_000).decode('utf-8', 'replace')
    raw = re.sub(r'(?is)<(script|style|noscript|svg)[^>]*>.*?</\1>', ' ', raw)
    txt = H.unescape(re.sub(r'(?s)<[^>]+>', ' ', raw))
    return re.sub(r'\s+', ' ', txt).strip()

def claude(prompt):
    if spent['calls'] >= MAX_CALLS: raise RuntimeError('call budget reached')
    if spent['in'] * PRICE_IN + spent['out'] * PRICE_OUT > MAX_USD: raise RuntimeError('spend budget reached')
    last = None
    for model in MODELS:
        body = json.dumps({"model": model, "max_tokens": 1500, "messages": [{"role": "user", "content": prompt}]}).encode()
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
            'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                d = json.loads(r.read())
            spent['calls'] += 1
            u = d.get('usage', {}); spent['in'] += u.get('input_tokens', 0); spent['out'] += u.get('output_tokens', 0)
            text = ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text')
            m = re.search(r'\{.*\}', text, re.S)
            return json.loads(m.group(0)) if m else None, model
        except urllib.error.HTTPError as e:
            last = f'{model}: HTTP {e.code} {e.read()[:200]!r}'
            if e.code in (400, 404): continue   # model not available: try the next one
            raise RuntimeError(last)
    raise RuntimeError(last or 'no model available')

def load(path, default):
    try: return json.load(open(path))
    except Exception: return default

def _year(v):
    m = re.search(r'(20[2-4]\d)', str(v or ''))
    return int(m.group(1)) if m else None

def from_seed(seed):
    return {"price_from": seed.get('price'), "currency": seed.get('currency'), "title_type": seed.get('title'),
            "lease_years_base": seed.get('lease_base'), "extension_promised": seed.get('extension'),
            "guaranteed_language": seed.get('guaranteed_language'), "advertised_yield_pct": None,
            "completion_year": _year(seed.get('completion')),
            "permit_claim": seed.get('permit_claim'), "permit_number": seed.get('permit_number'), "plans_published": seed.get('plans_published'),
            "escrow_or_guarantee": seed.get('escrow'), "quotes": []}

def aggregates(latest, runs, market='Bali'):
    rows = [r['claims'] for r in latest.values() if r.get('claims') and r.get('market', 'Bali') == market]
    lease = [r['lease_years_base'] for r in rows if isinstance(r.get('lease_years_base'), (int, float))]
    usd = [v for v in (r['price_from'] * FX[r['currency']] for r in rows if isinstance(r.get('price_from'), (int, float)) and r.get('currency') in FX) if v >= 10000]
    yields = [r['advertised_yield_pct'] for r in rows if isinstance(r.get('advertised_yield_pct'), (int, float))]
    comp = {}
    for r in rows:
        k = str(r.get('completion_year') or 'unknown'); comp[k] = comp.get(k, 0) + 1
    hist = {"under 30": 0, "30 to 34": 0, "35 to 39": 0, "40 or more": 0}
    for y in lease:
        hist["under 30" if y < 30 else "30 to 34" if y < 35 else "35 to 39" if y < 40 else "40 or more"] += 1
    ext_known = [r for r in rows if r.get('extension_promised') is not None]
    return {
        "updated": TODAY, "market": market, "source": "What developers advertise on their own pages and on new-build portals. Advertised claims, not verified facts.",
        "projects": len(rows),
        "title": {"leasehold": sum(1 for r in rows if r.get('title_type') == 'leasehold'), "known": sum(1 for r in rows if r.get('title_type'))},
        "lease": {"known": len(lease), "median": statistics.median(lease) if lease else None, "min": min(lease) if lease else None, "max": max(lease) if lease else None, "hist": hist},
        "extension_promised": {"yes": sum(1 for r in ext_known if r['extension_promised']), "known": len(ext_known)},
        "guaranteed_language": sum(1 for r in rows if r.get('guaranteed_language')),
        "permit_claims": sum(1 for r in rows if r.get('permit_claim')),
        "permit_numbers_published": sum(1 for r in rows if r.get('permit_number')),
        "plans_published": sum(1 for r in rows if r.get('plans_published')),
        "price_usd": {"known": len(usd), "median": round(statistics.median(usd), -3) if usd else None, "min": round(min(usd), -3) if usd else None, "max": round(max(usd), -3) if usd else None},
        "yield": {"known": len(yields), "median": statistics.median(yields) if yields else None, "max": max(yields) if yields else None},
        "completion": dict(sorted(comp.items())),
        "runs": runs[-12:],
    }


REGIONS = [('Bukit peninsula', ['Ungasan','Uluwatu','Pecatu','Bingin','Jimbaran','Bukit Pandawa','Nusa Dua']),
           ('Canggu coast', ['Berawa','Pererenan','Padonan','Munggu','Seseh']), ('Ubud', ['Ubud']), ('Tabanan', ['Tabanan']), ('Sanur', ['Sanur'])]

def _region(area):
    for r, keys in REGIONS:
        if any(k.lower() in area.lower() for k in keys): return r
    return 'Bali'

def _band(c):
    p, cur = c.get('price_from'), c.get('currency')
    if not isinstance(p, (int, float)) or cur not in FX: return 'Price not stated'
    v = p * FX[cur]
    if v < 10000: return 'Price not stated'
    return 'Under $100k' if v < 100000 else '$100k to $200k' if v < 200000 else '$200k to $400k' if v < 400000 else '$400k and up'

def _date(iso):
    try:
        return datetime.strptime(iso, '%Y-%m-%d').strftime('%-d %b %Y')
    except Exception:
        return iso or ''

def _questions(c):
    q = []
    t = c.get('title_type')
    if t == 'leasehold': q.append('Leasehold: is the lease registered, and is the base term the one advertised?')
    elif not t: q.append('Title type not stated: leasehold, freehold or a company structure?')
    if c.get('extension_promised'): q.append('An extension is promised: is it a binding clause with a fixed price, or only a promise?')
    y = c.get('advertised_yield_pct')
    if isinstance(y, (int, float)) and y >= 12: q.append('Advertised rental yield of 12% or more: does real occupancy nearby support it?')
    if c.get('guaranteed_language'): q.append('"Guaranteed" returns: who guarantees them, and what happens if they can\'t pay?')
    if c.get('permit_claim'): q.append('A building permit is claimed: does it exist in the official system and match this plot?')
    else: q.append('No building permit mentioned: ask for the number before paying.')
    if c.get('permit_number'): q.insert(0, 'Permit %s is published: does it exist in the official register and match this plot?' % str(c['permit_number'])[:60])
    if c.get('completion_year'): q.append('Completion advertised for %s: does progress on site match?' % c['completion_year'])
    return q[:5]

PREFIX = {'Bali': 'BALI', 'Lombok': 'LOM', 'Phuket': 'PHK', 'Koh Samui': 'KSM', 'Pattaya': 'PAT', 'Dubai': 'DXB', 'Riviera Maya': 'RMY', 'Algarve': 'ALG', 'Costa del Sol': 'CDS',
          'Abu Dhabi': 'AUH', 'Ras Al Khaimah': 'RAK', 'Oman': 'OMN', 'Istanbul': 'IST', 'Antalya': 'AYT', 'Egypt': 'EGY', 'Cyprus': 'CYP', 'Northern Cyprus': 'NCY', 'Greece': 'GRC',
          'Montenegro': 'MNE', 'Croatia': 'HRV', 'Georgia': 'GEO', 'Spain': 'ESP', 'Portugal': 'PRT', 'Los Cabos': 'CAB', 'Puerto Vallarta': 'PVR', 'Mérida': 'MID', 'Costa Rica': 'CRI',
          'Panama': 'PAN', 'Dominican Republic': 'DOM', 'Colombia': 'COL', 'Brazil': 'BRA', 'Miami': 'MIA', 'Vietnam': 'VNM', 'Philippines': 'PHL', 'Malaysia': 'MYS', 'Cambodia': 'KHM',
          'Sri Lanka': 'LKA', 'Bangkok': 'BKK', 'Hua Hin': 'HHQ', 'Krabi': 'KBV', 'Chiang Mai': 'CNX', 'Niseko': 'NSK', 'Labuan Bajo': 'LBJ', 'Albania': 'ALB', 'Antigua': 'ANU', 'Austin': 'AUS', 'Bahrain': 'BAH', 'Belize': 'BZE', 'Bodrum': 'BJV', 'Buenos Aires': 'BUE', 'Bulgaria': 'BGR', 'Cape Town': 'CPT', 'Fiji': 'FJI', 'Goa': 'GOA', 'Gold Coast': 'OOL', 'Grenada': 'GND', 'London': 'LON', 'Manchester': 'MAN', 'Marrakech': 'MRK', 'Mauritius': 'MRU', 'Nairobi': 'NBO', 'New Zealand': 'NZL', 'Okinawa': 'OKA', 'Orlando': 'ORL', 'Puerto Rico': 'PRI', 'Qatar': 'QAT', 'Saudi Arabia': 'KSA', 'Seychelles': 'SEZ', 'St Kitts and Nevis': 'SKB', 'Sydney': 'SYD', 'Turks and Caicos': 'TCA', 'Uruguay': 'URY', 'Zanzibar': 'ZNZ'}

FLAG_CATS = [('Fraud complaints reported', r'fraud|prosecutor|criminal|sentenced|charges'), ('Legal dispute reported', r'sued|court|judgment|lawsuit|litigation|legal action|arbitration'),
             ('Developer in financial trouble', r'bankrupt|insolven|missed .{0,40}(?:interest|bond|payment)|accumulated losses|debt obligations|stop paying'),
             ('Construction stalled', r'halt|stall|abandon|suspended|work stopped|no visible construction progress|only about .{0,20} built'),
             ('Regulator action reported', r'regulator|superintendencia|ruled against|probe|government said|lien'),
             ('Reported delays', r'significant delays|missed completion|overdue|has passed|years? late|delay(?:s|ed) in')]
NOTE_CATS = [('Inconsistent figures on the listing', r'inconsistent|conflicting|do not reconcile|differ|incompatible|without explaining|unlabelled|two different|three different'),
             ('Return projections without a stated basis', r'projected|projects a|appreciation|growth after completion|return on your investment|yield figure')]

def _flag_cats(flags, cats=None):
    out = []
    for f in flags or []:
        t = (f.get('text') if isinstance(f, dict) else str(f)).lower()
        cat = next((c for c, rx in (cats or FLAG_CATS) if re.search(rx, t)), None)
        if cat and cat not in out: out.append(cat)
    return out

def _checks(p, c, s):
    pn = c.get('permit_number') or p.get('permit_number') or s.get('permit_number')
    permit = 2 if pn else (1 if (c.get('permit_claim') or s.get('permit_claim')) else 0)
    esc = c.get('escrow_or_guarantee') if c.get('escrow_or_guarantee') not in (None, '') else s.get('escrow')
    gl = c.get('guaranteed_language') if c.get('guaranteed_language') is not None else s.get('guaranteed_language')
    return {'permit': permit, 'escrow': None if esc is None else bool(esc), 'progress': s.get('progress_pct') if s.get('progress_pct') is not None else ('updates' if s.get('progress_updates') else None),
            'plans': bool(c.get('plans_published') or s.get('plans_published')), 'record': bool(s.get('developer_delivered')), "returns_ok": gl is False}

def public_cases(projects, latest):
    out = []; n = {}
    for p in sorted(projects, key=lambda x: x.get('market', 'Bali') != 'Bali'):  # stable: file order keeps IDs fixed
        mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1; i = n[mk] - 1
        rec = latest.get(p['slug'], {}); c = rec.get('claims') or {}; read = rec.get('source') == 'ai'
        s = p.get('seed') or {}; sc = from_seed(s); m = dict(sc); m.update({k: v for k, v in c.items() if v not in (None, '', [])})
        ck = _checks(p, m, s); gl = m.get('guaranteed_language')
        ck['returns_ok'] = gl is False
        if any(re.search(r'guarantee', (f.get('text') or '').lower()) and re.search(r'return|rental|yield|income', (f.get('text') or '').lower()) for f in (p.get('flags') or []) if isinstance(f, dict)): ck['returns_ok'] = False
        deep = bool(p.get('sources'))   # researched in depth: escrow, progress and track record were looked for too
        ck['researched'] = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'] if deep else ['permit', 'plans', 'returns_ok']
        if not deep: ck['escrow'] = None; ck['progress'] = None; ck['record'] = None
        score = (ck['permit'] == 2) + (ck['escrow'] is True) + (ck['progress'] is not None) + bool(ck['plans']) + bool(ck['record']) + bool(ck['returns_ok'])
        mx = len(ck['researched']); r = score / mx
        fl = _flag_cats(p.get('flags')); notes = [n for n in _flag_cats(p.get('flags'), NOTE_CATS) if not fl]
        tier = 'caution' if fl or score <= 1 else 'clear' if score >= (3 if mx == 3 else 4) else 'mixed'
        q = _questions(m)
        if ck['escrow'] is not True: q.append('No deposit protection published: will your payments go into an escrow or trust account in your name?')
        for f in fl[:2]: q.insert(0, f + ' in public sources: ask the developer for the current status, in writing.')
        for f in notes[:1]: q.insert(0, f + ': ask for the correct figures in writing before paying.')
        out.append({'id': '%s-%03d' % (PREFIX.get(mk, mk[:3].upper()), i + 1), 'market': mk, 'country': p.get('country', 'Indonesia'), 'region': _region(p['area']) if mk == 'Bali' else mk,
                    'docs': ck['permit'] == 2, 'plans': ck['plans'], 'band': _band(m), 'done': m.get('completion_year'),
                    'title': m.get('title_type'), 'lease': m.get('lease_years_base'), 'yield': m.get('advertised_yield_pct') or s.get('yield_pct'), 'units': s.get('units'),
                    'checks': ck, 'score': int(score), 'max': mx, 'flags': fl, 'notes': notes, 'tier': tier,
                    'read': read or bool(p.get('sources')), 'checked': _date(rec.get('checked', '') or p.get('added', '')), 'invited': _date(p['invited']) if p.get('invited') else None,
                    'q': q[:6]})
    out.sort(key=lambda c: (0 if c['invited'] else 1, 0 if c['market'] == 'Bali' else 1, c['market'], c['region'], c['id']))
    return {'updated': TODAY, 'markets': len({c['market'] for c in out}), 'countries': len({c['country'] for c in out}), 'note': 'Anonymised until verification is complete. Advertised claims, not verified facts.', 'cases': out}

def main():
    public_out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(DATA, 'public-bali-claims.json')
    os.makedirs(os.path.join(DATA, 'runs'), exist_ok=True)
    projects = load(os.path.join(HERE, 'projects.json'), {})['projects'] + load(os.path.join(HERE, 'projects-world.json'), {}).get('projects', [])
    latest = load(os.path.join(DATA, 'latest.json'), {})
    changes = load(os.path.join(DATA, 'changes.json'), [])
    runs = load(os.path.join(DATA, 'runs.json'), [])
    run = {"date": TODAY, "mode": "ai" if KEY else "seed", "pages_ok": 0, "pages_failed": 0, "changes": 0, "model": None}
    for p in projects:
        prev = latest.get(p['slug'], {})
        if not KEY:
            if not prev.get('claims'): latest[p['slug']] = {"name": p['name'], "url": p['url'], "market": p.get('market', 'Bali'), "claims": from_seed(p['seed']), "source": "seed", "checked": TODAY}
            continue
        try:
            text = fetch(p['url']); h = hashlib.sha256(text.encode()).hexdigest()[:16]
            if prev.get('hash') == h and prev.get('source') == 'ai':
                prev['checked'] = TODAY; run['pages_ok'] += 1; continue
            claims, model = claude(PROMPT.format(name=p['name'], developer=p.get('developer') or 'unknown developer', area=p['area'], market=p.get('market', 'Bali'), country=p.get('country', 'Indonesia'), text=text[:14000]))
            run['model'] = model
            if not claims: raise RuntimeError('no JSON in answer')
            claims = {k: claims.get(k) for k in FIELDS}
            old = prev.get('claims') or {}
            diff = {k: [old.get(k), claims.get(k)] for k in FIELDS if k != 'quotes' and prev.get('source') == 'ai' and old.get(k) != claims.get(k)}
            if diff:
                changes.append({"date": TODAY, "slug": p['slug'], "name": p['name'], "changed": diff}); run['changes'] += 1
            latest[p['slug']] = {"name": p['name'], "url": p['url'], "market": p.get('market', 'Bali'), "claims": claims, "source": "ai", "hash": h, "checked": TODAY}
            run['pages_ok'] += 1
        except Exception as e:
            run['pages_failed'] += 1
            latest.setdefault(p['slug'], {"name": p['name'], "url": p['url'], "market": p.get('market', 'Bali'), "claims": from_seed(p['seed']), "source": "seed"})['last_error'] = str(e)[:200]
            print('!', p['slug'], e, file=sys.stderr)
            if 'budget' in str(e): break
        time.sleep(1)
    run['usd_estimate'] = round(spent['in'] * PRICE_IN + spent['out'] * PRICE_OUT, 3)
    runs.append(run)
    json.dump(latest, open(os.path.join(DATA, 'latest.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(changes, open(os.path.join(DATA, 'changes.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(runs, open(os.path.join(DATA, 'runs.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump({"run": run, "latest": latest}, open(os.path.join(DATA, 'runs', TODAY + '.json'), 'w'), ensure_ascii=False, indent=1)
    agg = aggregates(latest, [{k: r[k] for k in ('date', 'mode', 'pages_ok', 'pages_failed', 'changes')} for r in runs])
    os.makedirs(os.path.dirname(os.path.abspath(public_out)), exist_ok=True)
    json.dump(agg, open(public_out, 'w'), ensure_ascii=False, indent=1)
    for slug, rec in latest.items(): rec.setdefault('market', next((p.get('market', 'Bali') for p in projects if p['slug'] == slug), 'Bali'))
    markets = sorted({p.get('market', 'Bali') for p in projects})
    runs_pub = [{k: r[k] for k in ('date', 'mode', 'pages_ok', 'pages_failed', 'changes')} for r in runs]
    json.dump({"updated": TODAY, "projects": len(projects), "markets": {m: aggregates(latest, runs_pub, m) for m in markets}}, open(os.path.join(os.path.dirname(os.path.abspath(public_out)), 'world-claims.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(public_cases(projects, latest), open(os.path.join(os.path.dirname(os.path.abspath(public_out)), 'bali-cases.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(run))

if __name__ == '__main__':
    main()
