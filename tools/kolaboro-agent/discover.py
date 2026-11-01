"""Kolaboro discovery agent: finds NEW off-plan and under-construction projects every day with the
Claude API (web search + web fetch), validates them and appends them to projects-world.json.

Budget: keeps calling until it has spent at least KB_DISCOVER_MIN_USD (default 2) and never more
than KB_DISCOVER_MAX_USD (default 3). Without ANTHROPIC_API_KEY it does nothing.
Output log: data/discover-log.json (one entry per run). Projects stay anonymous on the public site.
"""
import json, os, re, sys, time, datetime, urllib.request, urllib.error, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
KEY = os.environ.get('ANTHROPIC_API_KEY', '')
MIN_USD = float(os.environ.get('KB_DISCOVER_MIN_USD', '2'))
MAX_USD = float(os.environ.get('KB_DISCOVER_MAX_USD', '3'))
MAX_CALLS = int(os.environ.get('KB_DISCOVER_MAX_CALLS', '40'))
PER_CALL = int(os.environ.get('KB_DISCOVER_PER_CALL', '4'))
MODELS = [m for m in [os.environ.get('KB_DISCOVER_MODEL'), 'claude-sonnet-5-5', 'claude-haiku-5-5'] if m]
PRICE = {'claude-sonnet-5-5': (3e-6, 15e-6), 'claude-haiku-5-5': (1e-6, 5e-6)}
SEARCH_USD = 0.01
TODAY = datetime.date.today().isoformat()
DASH = re.compile('[–—]')
ACCT = re.compile(r'(?i)(account|acct\.?|a/c|iban)\s*(no\.?|number)?\s*[:#]?\s*[A-Z0-9-]{6,}')
LV = ('registry', 'independent', 'developer', 'contradicted', 'none')

# Markets in rotation (market name, country, registry hint). Every day starts at a different point.
MARKETS = [
    ('Dubai', 'UAE', 'Dubai Land Department / Dubai REST project and escrow data'), ('Abu Dhabi', 'UAE', 'ADREC / DARI'),
    ('Ras Al Khaimah', 'UAE', 'RAK RERA off-plan list'), ('Sharjah', 'UAE', 'Sharjah RERA'), ('Oman', 'Oman', 'Ministry of Housing ITC projects'),
    ('Saudi Arabia', 'Saudi Arabia', 'Wafi off-plan licence (REGA)'), ('Bahrain', 'Bahrain', 'RERA Bahrain'), ('Qatar', 'Qatar', 'Ministry of Justice'),
    ('Egypt', 'Egypt', 'NUCA'), ('Mauritius', 'Mauritius', 'EDB IRS/RES/PDS schemes'), ('Zanzibar', 'Tanzania', 'ZIPA'), ('Cape Town', 'South Africa', 'City of Cape Town plans, CIPC'),
    ('Costa del Sol', 'Spain', 'town hall licencia de obra, Catastro'), ('Costa Blanca', 'Spain', 'licencia de obra, bank guarantee Ley 38/1999'),
    ('Balearics', 'Spain', 'licencia de obra'), ('Canary Islands', 'Spain', 'licencia de obra'), ('Algarve', 'Portugal', 'municipal alvara'),
    ('Lisbon', 'Portugal', 'Camara Municipal licence'), ('Madeira', 'Portugal', 'municipal licence'), ('Greece', 'Greece', 'building permit e-Adeies'),
    ('Cyprus', 'Cyprus', 'planning and building permits'), ('Northern Cyprus', 'Northern Cyprus', 'building permit'), ('Istanbul', 'Turkey', 'TKGM, building licence'),
    ('Antalya', 'Turkey', 'building licence'), ('Bodrum', 'Turkey', 'building licence'), ('Montenegro', 'Montenegro', 'building permit'),
    ('Croatia', 'Croatia', 'building permit'), ('Albania', 'Albania', 'building permit'), ('Bulgaria', 'Bulgaria', 'Act 14/15/16'), ('Georgia', 'Georgia', 'public registry'),
    ('Italy', 'Italy', 'permesso di costruire'), ('French Riviera', 'France', 'permis de construire, GFA guarantee'), ('Malta', 'Malta', 'Planning Authority PA number'),
    ('London', 'UK', 'planning portal, Companies House'), ('Manchester', 'UK', 'planning portal'), ('Dublin', 'Ireland', 'planning register'),
    ('Bali', 'Indonesia', 'PBG building permit number (a NIB is not a permit); foreigners cannot hold freehold, strata only above Rp 2B in Bali (Kepmen ATR/BPN 1241/2022)'), ('Lombok', 'Indonesia', 'PBG'), ('Phuket', 'Thailand', 'EIA approval on the ONEP register (eia.onep.go.th, filed is not approved), building permit, SET filings'),
    ('Koh Samui', 'Thailand', 'building permit'), ('Pattaya', 'Thailand', 'EIA approval'), ('Bangkok', 'Thailand', 'EIA approval, SET filings'),
    ('Hua Hin', 'Thailand', 'building permit'), ('Vietnam', 'Vietnam', 'provincial approval'), ('Philippines', 'Philippines', 'DHSUD License to Sell'),
    ('Malaysia', 'Malaysia', 'KPKT developer licence and advertising permit'), ('Cambodia', 'Cambodia', 'construction permit'), ('Sri Lanka', 'Sri Lanka', 'UDA approval'),
    ('Maldives', 'Maldives', 'tourism ministry'), ('Niseko', 'Japan', 'building confirmation'), ('Okinawa', 'Japan', 'building confirmation'),
    ('Gold Coast', 'Australia', 'Queensland development approval, ASIC'), ('Sydney', 'Australia', 'NSW planning portal'), ('Melbourne', 'Australia', 'Victoria planning'),
    ('New Zealand', 'New Zealand', 'council resource consent'), ('Fiji', 'Fiji', 'approval'),
    ('Riviera Maya', 'Mexico', 'licencia de construccion, fideicomiso, PROFECO contract register (rpca.profeco.gob.mx/busqueda?t=a&a=s, check the number belongs to the seller)'), ('Los Cabos', 'Mexico', 'licencia de construccion, PROFECO contract register rpca.profeco.gob.mx'),
    ('Puerto Vallarta', 'Mexico', 'licencia de construccion, PROFECO contract register rpca.profeco.gob.mx'), ('Mérida', 'Mexico', 'licencia de construccion, PROFECO contract register rpca.profeco.gob.mx'), ('Costa Rica', 'Costa Rica', 'SETENA, CFIA permit'),
    ('Panama', 'Panama', 'MIVIOT approval'), ('Dominican Republic', 'Dominican Republic', 'CONFOTUR, MOPC permit'), ('Colombia', 'Colombia', 'licencia de construccion, fiducia'),
    ('Brazil', 'Brazil', 'registro de incorporacao'), ('Uruguay', 'Uruguay', 'permiso de construccion'), ('Miami', 'USA', 'Florida DBPR condo filing, escrow under statute 718'),
    ('Orlando', 'USA', 'county permits, DBPR'), ('Austin', 'USA', 'city permits'), ('Puerto Rico', 'USA', 'OGPe permits'), ('Turks and Caicos', 'Turks and Caicos', 'planning approval'),
    ('Grenada', 'Grenada', 'CBI approved project'), ('St Kitts and Nevis', 'St Kitts and Nevis', 'CBI approved project'), ('Antigua', 'Antigua', 'CBI approved project'),
    ('St Lucia', 'St Lucia', 'CBI approved project'), ('Belize', 'Belize', 'approval'), ('Seychelles', 'Seychelles', 'approval'), ('Cape Verde', 'Cape Verde', 'approval'),
]

PROMPT = """You research off-plan property for Kolaboro, an independent database for foreign buyers. Use web search and fetch to find {n} REAL projects in {market} ({country}) that are currently sold to foreign buyers and are {stage}. Skip anything in this list of projects we already track in this market: {known}.

For each project open the developer's own page and at least one other source. Record only what you saw; null when not found. Never invent permit numbers, prices or percentages. Official sources for this market: {hint}.

Six disclosure checks: permit (a permit/licence/registration NUMBER published), escrow (deposit protection stated: escrow account, bank guarantee, trust), progress (a published % or dated construction updates), plans (floor plans published), record (developer's delivered projects verifiable), returns (true if "guaranteed" returns/buy-back are advertised).
For each check give a verification level: "registry" (confirmed on an official/government source you opened), "independent" (regulator, court, stock-exchange filing or major newspaper), "developer" (only developer, agents or portals), "contradicted" (sources disagree), "none" (not published).

Reply with ONLY a JSON array, no prose, each object:
{{"name":"","developer":"","area":"","country":"{country}","market":"{market}","stage":"off-plan|under construction","url":"https://...","docs_url":"https://...","permit_number":null,
"seed":{{"price":null,"currency":null,"title":null,"lease_base":null,"guaranteed_language":false,"yield_pct":null,"completion":null,"permit_claim":false,"permit_number":null,"plans_published":false,"escrow":null,"progress_pct":null,"progress_updates":false,"developer_delivered":null,"units":null,"payment_plan":null}},
"verification":{{"permit":"none","escrow":"none","progress":"none","plans":"none","record":"none","returns":"none"}},
"claims":[{{"claim":"","status":"verified|unverified|contradicted","by":"registry|independent|none","source":"https://..."}}],
"facts":{{"developer_founded":null,"developer_hq":null,"construction_start":null,"handover_promised":null,"original_handover":null,"delay_months":null,"unit_types":[],"size_min_m2":null,"size_max_m2":null,"price_min":null,"price_max":null,"deposit_pct":null,"foreign_ownership":null,"rental_programme":null,"lat":null,"lng":null,"permit_authority":null}},
"note":"one or two sentences of key facts","positives":[],"flags":[{{"text":"only from news, courts or regulators","source":"https://..."}}],"sources":["every URL you used"]}}
Plain English, no em dashes. Progress: progress_pct only if a % is published; if only dated updates, progress_updates true. Flags only from news, courts or regulators; none otherwise."""


def load(p, d):
    try:
        return json.load(open(p))
    except Exception:
        return d


def clean(v):
    if isinstance(v, str):
        v = DASH.sub(', ', v).replace(' ,', ',').strip()
        return v or None
    if isinstance(v, list):
        return [clean(x) for x in v if clean(x) not in (None, '')]
    if isinstance(v, dict):
        return {k: clean(x) for k, x in v.items()}
    return v


def num(v):
    if v in (None, ''):
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return v
    m = re.search(r'-?\d[\d,.]*', str(v))
    try:
        return float(m.group(0).replace(',', '')) if m else None
    except ValueError:
        return None


def level(v):
    v = str(v or 'none').lower()
    return next((l for l in LV if l in v), 'none')


def url_ok(u):
    if not isinstance(u, str) or not u.startswith('http'):
        return False
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; KolaboroBot/1.0; +https://kolaboro.com)'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status < 400
    except urllib.error.HTTPError as e:
        return e.code in (401, 403, 429)   # site exists but blocks bots
    except Exception:
        return False


def prep(p):
    p = clean(p) or {}
    s = p.get('seed') or {}
    for k in ('price', 'yield_pct', 'progress_pct', 'units', 'lease_base'):
        s[k] = num(s.get(k))
    if s.get('progress_pct') is not None:
        s['progress_pct'] = max(0, min(100, s['progress_pct']))
    for k in ('guaranteed_language', 'permit_claim', 'plans_published', 'progress_updates'):
        s[k] = s.get(k) is True or str(s.get(k)).lower() == 'true'
    if s.get('permit_number') and not re.search(r'\d', str(s['permit_number'])):
        s['permit_number'] = None
    if s.get('escrow'):
        s['escrow'] = ACCT.sub(r'\1', str(s['escrow']))
    if s.get('completion') is not None:
        s['completion'] = str(s['completion'])
    p['seed'] = s
    p['permit_number'] = p.get('permit_number') or s.get('permit_number')
    if p['permit_number'] and not re.search(r'\d', str(p['permit_number'])):
        p['permit_number'] = None
    v = p.get('verification') or {}
    p['verification'] = {k: level(v.get(k)) for k in ('permit', 'escrow', 'progress', 'plans', 'record', 'returns')}
    p['claims'] = [c for c in (p.get('claims') or []) if isinstance(c, dict) and c.get('claim') and str(c.get('status', '')).lower() in ('verified', 'unverified', 'contradicted')]
    for c in p['claims']:
        c['status'] = str(c['status']).lower(); c['claim'] = ACCT.sub(r'\1', c['claim'])
    fx = p.get('facts') or {}
    for k in ('lat', 'lng', 'size_min_m2', 'size_max_m2', 'price_min', 'price_max', 'deposit_pct', 'delay_months', 'developer_founded'):
        fx[k] = num(fx.get(k))
    if fx.get('lat') is not None and not -90 <= fx['lat'] <= 90: fx['lat'] = None
    if fx.get('lng') is not None and not -180 <= fx['lng'] <= 180: fx['lng'] = None
    p['facts'] = fx
    p['flags'] = [f for f in (p.get('flags') or []) if isinstance(f, dict) and f.get('text') and str(f.get('source', '')).startswith('http')]
    p['sources'] = sorted({u for u in (p.get('sources') or []) if isinstance(u, str) and u.startswith('http')})
    for k in ('positives', 'docs_listed'):
        p[k] = p.get(k) or []
    d = {'permit': bool(p['permit_number']), 'escrow': bool(s.get('escrow')), 'progress': s.get('progress_pct') is not None or s.get('progress_updates'),
         'plans': bool(s.get('plans_published')), 'record': bool(s.get('developer_delivered')), 'no_guaranteed_returns': s.get('guaranteed_language') is False}
    d['score'] = sum(1 for x in d.values() if x); d['all_six'] = d['score'] == 6 and not p['flags']
    p['disclosure'] = d
    p['verified_score'] = sum(1 for l in p['verification'].values() if l in ('registry', 'independent'))
    p['added'] = TODAY; p['found_by'] = 'discover-agent'
    p['area'] = p.get('area') or p.get('market')
    p['docs_url'] = p.get('docs_url') or p.get('url')
    return p


def key_of(p):
    return re.sub(r'\W+', '', ((p.get('name') or '') + (p.get('developer') or '')).lower())


def slug_of(p):
    return re.sub(r'[^a-z0-9]+', '-', ((p.get('name') or '') + ' ' + (p.get('market') or '')).lower()).strip('-')[:60].strip('-')


STOP = {'the', 'by', 'at', 'residences', 'residence', 'phase', 'tower', 'towers', 'project', 'villas', 'apartments', 'and', 'de', 'la', 'el', 'of', 'in', 'resort', 'one', 'two', 'i', 'ii', 'iii'}


def words(p):
    return {w for w in re.findall(r'[a-z0-9]+', (p.get('name') or '').lower()) if w not in STOP and len(w) > 2}


def similar(p, others):
    a = words(p)
    if not a:
        return False
    for o in others:
        if o.get('market') != p.get('market'):
            continue
        b = words(o)
        if b and len(a & b) / len(a | b) >= 0.5:
            return True
    return False


class Budget:
    def __init__(self):
        self.usd = 0.0; self.calls = 0; self.searches = 0


def call(prompt, B):
    tools_full = [{'type': 'web_search_20250305', 'name': 'web_search', 'max_uses': 6},
                  {'type': 'web_fetch_20250910', 'name': 'web_fetch', 'max_uses': 6, 'max_content_tokens': 5000}]
    for model in MODELS:
        for tools, beta in ((tools_full, 'web-fetch-2025-09-10'), (tools_full[:1], None)):
            msgs = [{'role': 'user', 'content': prompt}]; text = ''
            try:
                for _ in range(5):   # continue on pause_turn
                    body = json.dumps({'model': model, 'max_tokens': 16000, 'tools': tools, 'messages': msgs}).encode()
                    h = {'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'}
                    if beta: h['anthropic-beta'] = beta
                    req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers=h)
                    with urllib.request.urlopen(req, timeout=600) as r:
                        d = json.loads(r.read())
                    B.calls += 1
                    u = d.get('usage', {}); pi, po = PRICE.get(model, (3e-6, 15e-6))
                    srch = (u.get('server_tool_use') or {}).get('web_search_requests', 0)
                    B.searches += srch
                    B.usd += (u.get('input_tokens', 0) + u.get('cache_creation_input_tokens', 0)) * pi + u.get('cache_read_input_tokens', 0) * pi * 0.1 + u.get('output_tokens', 0) * po + srch * SEARCH_USD
                    text += ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text')
                    if d.get('stop_reason') != 'pause_turn':
                        break
                    msgs = msgs + [{'role': 'assistant', 'content': d['content']}]
                m = re.search(r'\[\s*\{.*\}\s*\]', text, re.S)
                return (json.loads(m.group(0)) if m else []), model
            except urllib.error.HTTPError as e:
                err = e.read()[:300]
                print('HTTP', e.code, model, beta, err, file=sys.stderr)
                if e.code in (400, 404):
                    continue
                if e.code == 429:
                    time.sleep(30); continue
                raise
            except json.JSONDecodeError:
                return [], model
    return [], None


def main():
    global MIN_USD, MAX_USD
    os.makedirs(DATA, exist_ok=True)
    logp = os.path.join(DATA, 'discover-log.json'); log = load(logp, [])
    wp = os.path.join(HERE, 'projects-world.json'); W = load(wp, {'projects': []})
    P = load(os.path.join(HERE, 'projects.json'), {'projects': []})
    allp = P['projects'] + W['projects']
    keys = {key_of(p) for p in allp}; slugs = {p.get('slug') for p in allp}
    run = {'date': TODAY, 'calls': 0, 'usd': 0.0, 'searches': 0, 'added': 0, 'rejected': {}, 'markets': [], 'model': None}
    if not KEY:
        print('no ANTHROPIC_API_KEY: nothing to do'); return
    done_today = sum(r.get('usd', 0) for r in log if r.get('date') == TODAY)
    if done_today >= MIN_USD and not os.environ.get('KB_DISCOVER_FORCE'):
        print(f'already spent ${done_today:.2f} today: nothing to do'); return
    B = Budget(); B.usd = 0.0
    if not os.environ.get('KB_DISCOVER_FORCE'):
        MIN_USD = max(0.0, MIN_USD - done_today); MAX_USD = max(0.0, MAX_USD - done_today)
    start = int(hashlib.md5(TODAY.encode()).hexdigest(), 16) % len(MARKETS)
    i = 0; added = []
    def rej(r): run['rejected'][r] = run['rejected'].get(r, 0) + 1
    while B.calls < MAX_CALLS and B.usd < MIN_USD and i < len(MARKETS):
        market, country, hint = MARKETS[(start + i) % len(MARKETS)]
        stage = 'already under construction (not finished)' if (start + i) % 2 else 'off-plan (launched or selling, construction not started or just started)'
        i += 1
        avg = B.usd / max(1, len(run['markets'])) if run['markets'] else 1.2
        if B.usd + max(0.8, avg) > MAX_USD:
            break
        known = ', '.join(sorted({p.get('name') for p in allp + added if p.get('market') == market and p.get('name')})[:80]) or 'none yet'
        try:
            arr, model = call(PROMPT.format(n=PER_CALL, market=market, country=country, stage=stage, known=known, hint=hint), B)
        except Exception as e:
            print('call failed', market, e, file=sys.stderr); rej('api_error'); continue
        run['model'] = model or run['model']; run['markets'].append(market)
        for raw in arr if isinstance(arr, list) else []:
            if not isinstance(raw, dict) or not raw.get('name') or not raw.get('url'):
                rej('incomplete'); continue
            p = prep(raw)
            p['market'] = market; p['country'] = p.get('country') or country
            if len(p['sources']) < 2:
                rej('fewer_than_2_sources'); continue
            k = key_of(p); sl = slug_of(p)
            if k in keys or sl in slugs or similar(p, allp + added):
                rej('duplicate'); continue
            if not url_ok(p['url']) and not url_ok(p['docs_url']):
                rej('dead_url'); continue
            p['slug'] = sl
            added.append(p); keys.add(k); slugs.add(sl)
        print(f'{market}: total added {len(added)}, spent ${B.usd:.2f}, calls {B.calls}')
    W['projects'].extend(added)
    json.dump(W, open(wp, 'w'), ensure_ascii=False, indent=1)
    run.update({'calls': B.calls, 'usd': round(B.usd, 3), 'searches': B.searches, 'added': len(added),
                'added_slugs': [p['slug'] for p in added], 'all_six': sum(1 for p in added if p['disclosure']['all_six']),
                'verified_4plus': sum(1 for p in added if p['verified_score'] >= 4)})
    log.append(run); json.dump(log[-400:], open(logp, 'w'), ensure_ascii=False, indent=1)
    print(json.dumps(run))


if __name__ == '__main__':
    main()
