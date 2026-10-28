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
FX = {'USD': 1.0, 'EUR': 1.08, 'IDR': 1 / 16000.0, 'AUD': 0.65}  # rough, for the public median only

FIELDS = ["price_from", "currency", "title_type", "lease_years_base", "extension_promised", "guaranteed_language",
          "advertised_yield_pct", "completion_year", "permit_claim", "quotes"]

PROMPT = """You are Kolaboro's research agent. Kolaboro protects people who buy property abroad.
Below is the text of a public web page about an off-plan property project in Bali.
Extract ONLY what the page itself advertises. Do not guess. Use null when the page doesn't say.

Reply with ONLY a single JSON object, no other text before or after it. If the page has little or no information, still return the object with null values.
The JSON object has exactly these keys:
- price_from: number (the lowest advertised price) or null
- currency: "USD" | "EUR" | "IDR" | "AUD" | null
- title_type: "leasehold" | "freehold" | "hgb" | "hak_pakai" | "pt_pma" | null
- lease_years_base: number of years of the base lease, or null
- extension_promised: true if an extension or renewal of the lease is promised, false if the page says none, null if not mentioned
- guaranteed_language: true if the page uses words like "guaranteed" about returns, rental income, extensions or buy-back
- advertised_yield_pct: the advertised yearly rental yield or ROI in percent (number), or null
- completion_year: year of completion or handover as a number, or null
- permit_claim: true if the page claims building permits or approvals (PBG, IMB, licence) are obtained
- quotes: up to 3 short verbatim quotes (max 20 words each) from the page that support the claims above

Project: {name} by {developer} in {area}
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

def from_seed(seed):
    return {"price_from": seed.get('price'), "currency": seed.get('currency'), "title_type": seed.get('title'),
            "lease_years_base": seed.get('lease_base'), "extension_promised": seed.get('extension'),
            "guaranteed_language": seed.get('guaranteed_language'), "advertised_yield_pct": None,
            "completion_year": int(seed['completion']) if seed.get('completion') else None,
            "permit_claim": seed.get('permit_claim'), "quotes": []}

def aggregates(latest, runs):
    rows = [r['claims'] for r in latest.values() if r.get('claims')]
    lease = [r['lease_years_base'] for r in rows if isinstance(r.get('lease_years_base'), (int, float))]
    usd = [r['price_from'] * FX[r['currency']] for r in rows if isinstance(r.get('price_from'), (int, float)) and r.get('currency') in FX]
    yields = [r['advertised_yield_pct'] for r in rows if isinstance(r.get('advertised_yield_pct'), (int, float))]
    comp = {}
    for r in rows:
        k = str(r.get('completion_year') or 'unknown'); comp[k] = comp.get(k, 0) + 1
    hist = {"under 30": 0, "30 to 34": 0, "35 to 39": 0, "40 or more": 0}
    for y in lease:
        hist["under 30" if y < 30 else "30 to 34" if y < 35 else "35 to 39" if y < 40 else "40 or more"] += 1
    ext_known = [r for r in rows if r.get('extension_promised') is not None]
    return {
        "updated": TODAY, "market": "Bali", "source": "What developers advertise on their own pages and on new-build portals. Advertised claims, not verified facts.",
        "projects": len(rows),
        "title": {"leasehold": sum(1 for r in rows if r.get('title_type') == 'leasehold'), "known": sum(1 for r in rows if r.get('title_type'))},
        "lease": {"known": len(lease), "median": statistics.median(lease) if lease else None, "min": min(lease) if lease else None, "max": max(lease) if lease else None, "hist": hist},
        "extension_promised": {"yes": sum(1 for r in ext_known if r['extension_promised']), "known": len(ext_known)},
        "guaranteed_language": sum(1 for r in rows if r.get('guaranteed_language')),
        "permit_claims": sum(1 for r in rows if r.get('permit_claim')),
        "price_usd": {"known": len(usd), "median": round(statistics.median(usd), -3) if usd else None, "min": round(min(usd), -3) if usd else None, "max": round(max(usd), -3) if usd else None},
        "yield": {"known": len(yields), "median": statistics.median(yields) if yields else None, "max": max(yields) if yields else None},
        "completion": dict(sorted(comp.items())),
        "runs": runs[-12:],
    }

def main():
    public_out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(DATA, 'public-bali-claims.json')
    os.makedirs(os.path.join(DATA, 'runs'), exist_ok=True)
    projects = load(os.path.join(HERE, 'projects.json'), {})['projects']
    latest = load(os.path.join(DATA, 'latest.json'), {})
    changes = load(os.path.join(DATA, 'changes.json'), [])
    runs = load(os.path.join(DATA, 'runs.json'), [])
    run = {"date": TODAY, "mode": "ai" if KEY else "seed", "pages_ok": 0, "pages_failed": 0, "changes": 0, "model": None}
    for p in projects:
        prev = latest.get(p['slug'], {})
        if not KEY:
            if not prev.get('claims'): latest[p['slug']] = {"name": p['name'], "url": p['url'], "claims": from_seed(p['seed']), "source": "seed", "checked": TODAY}
            continue
        try:
            text = fetch(p['url']); h = hashlib.sha256(text.encode()).hexdigest()[:16]
            if prev.get('hash') == h and prev.get('source') == 'ai':
                prev['checked'] = TODAY; run['pages_ok'] += 1; continue
            claims, model = claude(PROMPT.format(name=p['name'], developer=p['developer'], area=p['area'], text=text[:14000]))
            run['model'] = model
            if not claims: raise RuntimeError('no JSON in answer')
            claims = {k: claims.get(k) for k in FIELDS}
            old = prev.get('claims') or {}
            diff = {k: [old.get(k), claims.get(k)] for k in FIELDS if k != 'quotes' and prev.get('source') == 'ai' and old.get(k) != claims.get(k)}
            if diff:
                changes.append({"date": TODAY, "slug": p['slug'], "name": p['name'], "changed": diff}); run['changes'] += 1
            latest[p['slug']] = {"name": p['name'], "url": p['url'], "claims": claims, "source": "ai", "hash": h, "checked": TODAY}
            run['pages_ok'] += 1
        except Exception as e:
            run['pages_failed'] += 1
            latest.setdefault(p['slug'], {"name": p['name'], "url": p['url'], "claims": from_seed(p['seed']), "source": "seed"})['last_error'] = str(e)[:200]
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
    print(json.dumps(run))

if __name__ == '__main__':
    main()
