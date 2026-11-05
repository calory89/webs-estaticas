#!/usr/bin/env python3
"""Kolaboro live findings: every hour, re-read the developer pages checked longest ago and publish what changed.

Usage: live_findings.py OUT_DIR
Writes OUT_DIR/live-findings.json (public: last 500 findings and the run log) and OUT_DIR/findings-by-project.json
(public: per project id, the last check and its findings), and keeps in this private repository:
  data/live-state.json          what we last read per project (values, exact quotes, page fingerprint), one project per line
  data/live-findings.json       same content as the public file (the next run appends to it)
  data/live-by-project.json     same content as the public per-project file
  data/archive/<sha[:2]>/<sha>.txt.gz   frozen copy of every page text the model read (agent.keep_copy, as the research agent does)

Round robin over every tracked project with a public id: the projects whose developer page was read longest ago come
first (our own last read, else the research agent's last read in data/latest.json). Pages are fetched politely
(robots.txt respected through agent.allowed, the agent's User-Agent, one request per host every few seconds).
claude-haiku-5-5 extracts concrete facts, each with an exact quote. Rules enforced in code, not left to the model:
  - the quote must be found word for word in the fetched page text (case, spacing and typographic quotes ignored,
    no "..." skipping) and must contain the value (the year, the percentage, the amount, the number); otherwise rejected
  - a finding is published only when the value is new or changed compared with what we stored for that project;
    a changed value is published only if the old value is no longer stated near the same words on the page
  - when the page text has the same SHA-256 as at our last read, the model is not called (no cost, counted as no change)
  - every call is priced from its real token usage at list prices; before each call the worst case of that call is reserved,
    so the run can never pass its budget (KB_LIVE_RUN_USD, default 0.25)
Findings are anonymous: project id and market only. Quotes are never published (they identify the project): each finding
carries the first 16 hex characters of the SHA-256 of its quote and of the page text.
Env: ANTHROPIC_API_KEY, KB_PUBLIC_CASES (path to the public bali-cases.json, required), KB_LIVE_RUN_USD (0.25),
     KB_LIVE_MAX_PAGES (150), KB_LIVE_MAX_SECONDS (420), KB_LIVE_HOST_GAP (4).
"""
import json, os, re, sys, time, hashlib, threading, urllib.request, urllib.error, urllib.parse, concurrent.futures as cf
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
sys.path.insert(0, HERE)
import agent      # noqa: E402  fetch rules (robots.txt, User-Agent, text extraction), keep_copy, PREFIX, FX, _band
import dev_intel  # noqa: E402  projects(), public_ids(): the exact public id numbering
from promises import norm, parse_date  # noqa: E402  same quote normalisation and date parsing as the promise tracker

NOW = datetime.now(timezone.utc)
STAMP = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')
KEY = os.environ.get('ANTHROPIC_API_KEY', '').strip()
HAIKU, SONNET = 'claude-haiku-5-5', 'claude-sonnet-5-5'
PRICE = {HAIKU: (0.10, 0.50), SONNET: (2.0, 10.0)}   # USD per million tokens in / out, list prices
BUDGET = float(os.environ.get('KB_LIVE_RUN_USD', '0.25'))
MAX_PAGES = int(os.environ.get('KB_LIVE_MAX_PAGES', '150'))
MAX_SECONDS = float(os.environ.get('KB_LIVE_MAX_SECONDS', '420'))
GAP = float(os.environ.get('KB_LIVE_HOST_GAP', '4'))
MAX_TOKENS = 1200
KEEP = 500
T0 = time.time()

lock = threading.Lock()
spend = {'usd': 0.0, 'reserved': 0.0, 'in': 0, 'out': 0, 'calls': 0, 'errors': 0, 'model': None}
stop = {'why': None}

FACTS = ('handover', 'price_from', 'deposit_pct', 'permit_number', 'permit_claim', 'escrow', 'construction_pct', 'stage', 'units_left', 'yield_pct', 'structure')
LABEL = {'handover': 'handover', 'price_from': 'price', 'deposit_pct': 'payment plan', 'permit_number': 'permit', 'permit_claim': 'permit',
         'escrow': 'deposit protection', 'construction_pct': 'construction', 'stage': 'construction', 'units_left': 'units left',
         'yield_pct': 'rental yield', 'structure': 'legal structure'}

PROMPT = """You read the text of one public web page about an off-plan property project in {market}, {country}, for Kolaboro,
which protects people who buy property abroad. Extract only concrete, checkable facts that the page itself states. Never guess.

Reply with ONLY one JSON object with exactly these keys. Each value is null (the page does not state it) or {{"v": value, "q": quote}}:
- handover: v = promised handover or completion date as "YYYY", "YYYY-Qn", "YYYY-Hn" or "YYYY-MM" (not a past launch or a company founding date)
- price_from: v = {{"amount": number, "currency": "ISO code"}}, the lowest advertised price of a unit
- deposit_pct: v = number, the percent of the price due on booking, reservation or signing (payment plan)
- permit_number: v = the building permit, licence, project registration or approval number exactly as written (RERA, DLD, PBG, IMB, licencia, alvara, project number)
- permit_claim: v = true if the page says permits, licences or approvals are obtained or the project is registered
- escrow: v = true if the page says buyer payments go to an escrow account, trust account, bank guarantee or fideicomiso
- construction_pct: v = number, the construction progress in percent
- stage: v = "off-plan" | "under construction" | "completed"
- units_left: v = number of units the page says are left, available or remaining
- yield_pct: v = number, the advertised yearly rental yield or return on investment in percent (the highest if several)
- structure: v = {{"title": "leasehold" | "freehold" | "hak_pakai" | "hgb" | "pt_pma" | "fideicomiso" | "strata" | "other", "lease_years": number or null}}

"q" must be the exact words of the page that state the fact, copied character for character, 4 to 25 words, and it must contain the
value (the year, the percent, the amount, the number). Our software checks every quote against the page and drops facts whose quote is
not found or does not contain the value.

Page text:
<<<
{text}
>>>"""


def load(p, d):
    try:
        return json.load(open(p))
    except Exception:
        return d


def h16(s):
    return hashlib.sha256(s.encode()).hexdigest()[:16]


def ddmon(iso):
    try:
        return datetime.strptime(iso[:10], '%Y-%m-%d').strftime('%-d %b')
    except Exception:
        return iso or 'an earlier read'


# ---------- code checks on values and quotes ----------

MULT = {'k': 1e3, 'm': 1e6, 'mn': 1e6, 'mio': 1e6, 'million': 1e6, 'millions': 1e6, 'bn': 1e9, 'billion': 1e9, 'b': 1e9,
        'juta': 1e6, 'jt': 1e6, 'miliar': 1e9, 'milyar': 1e9, 'lakh': 1e5, 'lakhs': 1e5, 'crore': 1e7, 'cr': 1e7}
NUM = re.compile(r'(\d{1,3}(?:[.,\s]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|mn|mio|millions?|bn|billion|juta|jt|miliar|milyar|lakhs?|crore|cr|m|b)?\b', re.I)


def amounts(s):
    out = []
    for m in NUM.finditer(s or ''):
        raw = m.group(1)
        if re.search(r'[.,\s]\d{3}(?!\d)', raw) and re.fullmatch(r'\d{1,3}(?:[.,\s]\d{3})+', raw):
            x = float(re.sub(r'[.,\s]', '', raw))
        else:
            x = float(raw.replace(',', '.'))
        out.append(x * MULT.get((m.group(2) or '').lower(), 1))
    return out


def has_amount(s, v):
    try:
        v = float(v)
    except Exception:
        return False
    return v > 0 and any(abs(x - v) / v < 0.005 for x in amounts(s))


def pcts(s):
    return [float(m.group(1).replace(',', '.')) for m in re.finditer(r'(\d{1,3}(?:[.,]\d+)?)\s*(?:%|percent|per cent|/\s*\d{1,3}\b)', s or '', re.I)]


def has_pct(s, v):
    try:
        v = float(v)
    except Exception:
        return False
    return any(abs(x - v) < 0.01 for x in pcts(s))


def alnum(s):
    return re.sub(r'[^0-9a-z]', '', str(s or '').lower())


KW = {'handover': r'handover|hand over|handed|completion|complete|delivery|deliver|ready|keys|finish|move in|move-in',
      'deposit_pct': r'booking|deposit|down ?payment|reservation|reserve|signing|sign|spa|contract|payment plan|upfront',
      'construction_pct': r'construction|progress|complete|built|structure|works',
      'yield_pct': r'yield|roi|return|rental|income|net|gross',
      'units_left': r'units?|villas?|apartments?|left|available|remaining|sold'}
TITLES = {'leasehold': r'leasehold|lease ?hold|lease', 'freehold': r'freehold|free ?hold|hak milik', 'hak_pakai': r'hak pakai', 'hgb': r'hgb|hak guna',
          'pt_pma': r'pt ?pma', 'fideicomiso': r'fideicomiso|bank trust', 'strata': r'strata', 'other': r'.'}
ESCROW = r'escrow|trust account|bank guarantee|fideicomiso|ring[- ]?fenced|protected account|garantia bancaria|garantía bancaria|aval bancario'
PERMIT = r'permit|licen[cs]e|licencia|alvar|approv|rera|dld|pbg|imb|registered|registration|kbli|nib|trakheesi|oqood'
STAGE = {'under construction': r'under construction|construction (?:has )?(?:started|begun|began|ongoing|in progress|underway)|now building|works? (?:started|ongoing)',
         'completed': r'completed|ready to move|handed over|move-in ready|ready now|finished project|key ready',
         'off-plan': r'off[- ]?plan|pre-?launch|pre-?sale|coming soon|new launch'}
PERMIT_NUM = re.compile(r'(?i)(?:permit|licen[cs]e|licencia|alvar[aá]|rera|dld|pbg|imb|registration|project|approval|trakheesi)\s*(?:no\.?|number|#|id|:)\s*[:#]?\s*[A-Z0-9][A-Z0-9/.\-]{3,}')


def near(text, needle_rx, kw_rx, pad=150):
    for m in re.finditer(needle_rx, text, re.I):
        w = text[max(0, m.start() - pad):m.end() + pad]
        if re.search(kw_rx, w, re.I):
            return True
    return False


def valid(fact, v, q):
    """Normalised value if the quote contains it, else None."""
    if v is None:
        return None
    if fact == 'handover':
        d = parse_date(v)
        return d[0] if d and d[0][:4] in q else None
    if fact == 'price_from':
        if not isinstance(v, dict) or not isinstance(v.get('amount'), (int, float)) or v['amount'] <= 0:
            return None
        cur = str(v.get('currency') or '').upper()[:3]
        return {'amount': float(v['amount']), 'currency': cur} if re.fullmatch(r'[A-Z]{3}', cur) and has_amount(q, v['amount']) else None
    if fact in ('deposit_pct', 'construction_pct', 'yield_pct'):
        ok = isinstance(v, (int, float)) and 0 < v <= 100 and has_pct(q, v) and re.search(KW[fact], q, re.I)
        return float(v) if ok else None
    if fact == 'units_left':
        ok = isinstance(v, (int, float)) and 0 <= v < 5000 and int(v) == v and re.search(r'\b%d\b' % int(v), q) and re.search(KW['units_left'], q, re.I)
        return int(v) if ok else None
    if fact == 'permit_number':
        a = alnum(v)
        return str(v).strip()[:60] if len(a) >= 4 and re.search(r'\d', a) and a in alnum(q) else None
    if fact == 'permit_claim':
        return True if v is True and re.search(PERMIT, q, re.I) else None
    if fact == 'escrow':
        return True if v is True and re.search(ESCROW, q, re.I) else None
    if fact == 'stage':
        return v if v in STAGE and re.search(STAGE[v], q, re.I) else None
    if fact == 'structure':
        if not isinstance(v, dict) or v.get('title') not in TITLES or not re.search(TITLES[v['title']], q, re.I):
            return None
        ly = v.get('lease_years')
        ly = int(ly) if isinstance(ly, (int, float)) and 0 < ly < 1000 and re.search(r'\b%d\b' % int(ly), q) else None
        return {'title': v['title'], 'lease_years': ly}
    return None


def same(fact, a, b, year_only=False):
    if fact == 'handover':
        return str(a)[:4] == str(b)[:4] if year_only else str(a) == str(b)
    if fact == 'price_from':
        return a.get('currency') == b.get('currency') and abs(a['amount'] - b['amount']) / max(a['amount'], 1) < 0.005
    if fact in ('deposit_pct', 'construction_pct', 'yield_pct'):
        return abs(float(a) - float(b)) < 0.01
    if fact == 'permit_number':
        return alnum(a) == alnum(b)
    if fact == 'structure':
        return a.get('title') == b.get('title') and (a.get('lease_years') == b.get('lease_years') or None in (a.get('lease_years'), b.get('lease_years')))
    return a == b


def still_stated(fact, old, text):
    """True when the old value is still stated near the same words on the page (two dates, two prices...): not published as a change."""
    if fact == 'handover':
        return near(text, r'\b%s\b' % str(old)[:4], KW['handover'])
    if fact == 'price_from':
        return has_amount(text, old['amount'])
    if fact in ('deposit_pct', 'construction_pct', 'yield_pct'):
        n = ('%g' % float(old)).replace('.', r'[.,]')
        return near(text, r'\b%s\s*(?:%%|percent|per cent|/\s*\d)' % n, KW[fact])
    if fact == 'units_left':
        return near(text, r'\b%d\b' % int(old), r'left|available|remaining', 60)
    if fact == 'permit_number':
        return alnum(old) in alnum(text)
    if fact == 'stage':
        return bool(re.search(STAGE.get(old, r'$^'), text, re.I))
    if fact == 'structure':
        return bool(re.search(TITLES.get(old.get('title'), r'$^'), text, re.I)) if old.get('title') != 'other' else True
    if fact in ('escrow', 'permit_claim'):
        return bool(re.search(ESCROW if fact == 'escrow' else PERMIT, text, re.I))
    return True


# ---------- wording (anonymous: never the quote, the name, the developer or the URL) ----------

def usd(p):
    fx = agent.FX.get(p.get('currency'))
    return p['amount'] * fx if fx else None


def band(p):
    b = agent._band({'price_from': p['amount'], 'currency': p['currency']})
    return None if b == 'Price not stated' else b


def show(fact, v):
    if fact == 'handover':
        return str(v)
    if fact == 'price_from':
        b = band(v)
        return ('the ' + b + ' band') if b else ('a price in ' + v['currency'])
    if fact in ('deposit_pct', 'construction_pct', 'yield_pct'):
        return '%g%%' % v
    if fact == 'structure':
        t = {'leasehold': 'leasehold', 'freehold': 'freehold', 'hak_pakai': 'Hak Pakai (right of use)', 'hgb': 'HGB (right to build)', 'pt_pma': 'through a foreign-owned company (PT PMA)',
             'fideicomiso': 'bank trust (fideicomiso)', 'strata': 'strata title', 'other': 'another structure'}[v['title']]
        return t + (', %d years' % v['lease_years'] if v.get('lease_years') else '')
    return str(v)


def wording(pid, kind, fact, new, old, old_seen, hm):
    was = ' (was %s when we last read it on %s)' % (show(fact, old), ddmon(old_seen)) if old is not None and kind == 'changed' else ''
    first = kind == 'first'
    if fact == 'handover':
        if kind == 'changed':
            return 'handover now promised for %s on the developer page%s' % (new, was)
        if kind == 'removed':
            return 'the developer page no longer states a handover date (it said %s on %s)' % (old, ddmon(old_seen))
        return 'developer page promises handover in %s (%s)' % (new, 'first reading by the hourly check' if first else 'no date when we read it on %s' % ddmon(old_seen))
    if fact == 'price_from':
        if kind == 'changed':
            a, b = usd(old), usd(new)
            if old['currency'] == new['currency'] and a and b:
                ch = (new['amount'] - old['amount']) / old['amount'] * 100
                return 'price from %s %.0f%% since we read it on %s (now in %s)' % ('up' if ch > 0 else 'down', abs(ch), ddmon(old_seen), show(fact, new))
            return 'price from now stated in %s (was %s on %s)' % (new['currency'], old['currency'], ddmon(old_seen))
        if kind == 'removed':
            return 'the developer page no longer shows a starting price (it did on %s)' % ddmon(old_seen)
        return 'starting price %s: %s' % ('stated' if first else 'now published', show(fact, new))
    if fact == 'deposit_pct':
        if kind == 'changed':
            return 'payment plan changed: %g%% on booking (was %g%%)' % (new, old)
        if kind == 'removed':
            return 'the payment plan with %g%% on booking is no longer on the developer page' % old
        return 'payment plan %s: %g%% due on booking' % ('stated' if first else 'now published', new)
    if fact == 'permit_number':
        if kind == 'changed':
            return 'permit or licence number on the developer page changed since %s (number not shown here, it would identify the project)' % ddmon(old_seen)
        if kind == 'removed':
            return 'permit or licence number no longer shown on the developer page (it was on %s)' % ddmon(old_seen)
        return 'permit or licence number %s on the developer page (number not shown here, it would identify the project)' % ('published' if first else 'now published')
    if fact == 'permit_claim':
        return 'developer page says permits are obtained but publishes no permit number (checked %s UTC)' % hm
    if fact == 'escrow':
        if kind == 'removed':
            return 'deposit protection (escrow or bank guarantee) no longer mentioned on the developer page (it was on %s)' % ddmon(old_seen)
        return 'deposit protection (escrow, trust or bank guarantee) %s on the developer page' % ('mentioned' if first else 'now mentioned')
    if fact == 'construction_pct':
        if kind == 'changed':
            return 'developer page now says construction is %g%% complete (was %g%% on %s)' % (new, old, ddmon(old_seen))
        if kind == 'removed':
            return 'the construction progress figure (%g%%) is no longer on the developer page (it was on %s)' % (old, ddmon(old_seen))
        return 'developer page states construction at %g%%, a claim to compare with photos or satellite' % new
    if fact == 'stage':
        if kind == 'changed':
            return 'developer page now describes the project as %s (was %s on %s)' % (new, old, ddmon(old_seen))
        return 'developer page describes the project as %s' % new
    if fact == 'units_left':
        if kind == 'changed':
            return 'developer page now claims %d units left (was %d on %s), a sales claim we cannot verify' % (new, old, ddmon(old_seen))
        if kind == 'removed':
            return 'the "units left" claim is no longer on the developer page (it said %d on %s)' % (old, ddmon(old_seen))
        return 'developer page claims %d units left, a sales claim we cannot verify' % new
    if fact == 'yield_pct':
        if kind == 'changed':
            return 'advertised rental yield now %g%% (was %g%% on %s), advertised, not verified' % (new, old, ddmon(old_seen))
        if kind == 'removed':
            return 'advertised rental yield of %g%% no longer on the developer page (it was on %s)' % (old, ddmon(old_seen))
        return 'advertised rental yield %s: %g%%, advertised, not verified' % ('stated' if first else 'now published', new)
    if fact == 'structure':
        if kind == 'changed':
            return 'legal structure stated on the developer page changed: %s%s' % (show(fact, new), was)
        if kind == 'removed':
            return 'the legal structure is no longer stated on the developer page (it was on %s)' % ddmon(old_seen)
        return 'legal structure stated: %s' % show(fact, new)
    return 'fact %s %s' % (fact, kind)


# ---------- fetching (polite) ----------

_hosts = {}
_hlock = threading.Lock()


def host_lock(host):
    with _hlock:
        if host not in _hosts:
            _hosts[host] = [threading.Lock(), 0.0]
        return _hosts[host]


def polite_fetch(url):
    """agent.fetch (robots.txt respected, the agent's User-Agent), with one request per host every GAP seconds."""
    u = urllib.parse.urlsplit(url); hl = host_lock(u.netloc)
    with hl[0]:
        base = u.scheme + '://' + u.netloc
        if base not in agent._ROBOTS:
            w = hl[1] - time.time()
            if w > 0:
                time.sleep(w)
            agent.allowed(url); hl[1] = time.time() + GAP
        if not agent.allowed(url):
            raise PermissionError('robots.txt disallows this page')
        w = hl[1] - time.time()
        if w > 0:
            time.sleep(w)
        try:
            return agent.fetch(url)
        finally:
            hl[1] = time.time() + GAP


# ---------- model ----------

class Budget(Exception):
    pass


def call(prompt):
    worst = (len(prompt) / 2.5) * PRICE[HAIKU][0] / 1e6 + MAX_TOKENS * PRICE[HAIKU][1] / 1e6
    with lock:
        if spend['usd'] + spend['reserved'] + worst > BUDGET:
            stop['why'] = stop['why'] or 'budget'
            raise Budget()
        spend['reserved'] += worst
    try:
        last = None
        for model in (HAIKU, SONNET):
            if model == SONNET:
                break   # Sonnet is priced but not used as a fallback: its worst case is 20 times higher than the reservation
            body = json.dumps({'model': model, 'max_tokens': MAX_TOKENS, 'messages': [{'role': 'user', 'content': prompt}]}).encode()
            for i in range(3):
                req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
                    'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
                try:
                    with urllib.request.urlopen(req, timeout=90) as r:
                        d = json.loads(r.read())
                    u = d.get('usage', {}); pi, po = PRICE[model]
                    with lock:
                        spend['in'] += u.get('input_tokens', 0); spend['out'] += u.get('output_tokens', 0); spend['calls'] += 1
                        spend['usd'] += u.get('input_tokens', 0) * pi / 1e6 + u.get('output_tokens', 0) * po / 1e6
                        spend['model'] = model
                    t = ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text')
                    m = re.search(r'\{.*\}', t, re.S)
                    if not m:
                        raise ValueError('no json')
                    return json.loads(m.group(0))
                except urllib.error.HTTPError as e:
                    last = 'HTTP %s' % e.code
                    if e.code in (429, 500, 502, 503, 529):
                        time.sleep(6 * (i + 1)); continue
                    break
                except Exception as e:
                    last = str(e)[:80]
                    break
        with lock:
            spend['errors'] += 1
        raise RuntimeError(last or 'model error')
    finally:
        with lock:
            spend['reserved'] -= worst


# ---------- per project ----------

def baseline_from_agent(rec):
    """What the research agent stored for this page (data/latest.json), mapped to our facts. No quotes: never used for removals."""
    c = rec.get('claims') or {}
    if rec.get('source') != 'ai' or not c:
        return None
    f = {}
    if isinstance(c.get('completion_year'), (int, float)):
        f['handover'] = {'v': str(int(c['completion_year'])), 'year_only': True}
    if isinstance(c.get('price_from'), (int, float)) and c['price_from'] > 0 and re.fullmatch(r'[A-Z]{3}', str(c.get('currency') or '')):
        f['price_from'] = {'v': {'amount': float(c['price_from']), 'currency': c['currency']}}
    if c.get('permit_number'):
        f['permit_number'] = {'v': str(c['permit_number'])[:60]}
    if c.get('escrow_or_guarantee'):
        f['escrow'] = {'v': True}
    if isinstance(c.get('advertised_yield_pct'), (int, float)) and 0 < c['advertised_yield_pct'] <= 100:
        f['yield_pct'] = {'v': float(c['advertised_yield_pct'])}
    if c.get('title_type') in TITLES:
        f['structure'] = {'v': {'title': c['title_type'], 'lease_years': int(c['lease_years_base']) if isinstance(c.get('lease_years_base'), (int, float)) else None}}
    known = {'handover', 'price_from', 'permit_number', 'escrow', 'yield_pct', 'structure'}   # facts the agent's schema can say "not stated" for
    return {'facts': f, 'known': known, 'seen': rec.get('checked') or '', 'src': 'agent', 'sha': rec.get('sha256')}


def work(p, pid, st, agent_rec):
    """Fetch, read and compare one project. Returns a result dict; never raises."""
    if time.time() - T0 > MAX_SECONDS:
        stop['why'] = stop['why'] or 'time'
        return {'slug': p['slug'], 'skipped': True}
    if stop['why'] == 'budget':
        return {'slug': p['slug'], 'skipped': True}
    r = {'slug': p['slug'], 'pid': pid, 'at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
    try:
        text = polite_fetch(p['url'])
    except PermissionError:
        r['robots'] = True; return r
    except Exception as e:
        r['fail'] = str(e)[:120]; return r
    r['fetched'] = True
    if len(text) < 200:
        r['thin'] = True; return r
    sha = hashlib.sha256(text.encode()).hexdigest(); r['sha'] = sha
    if st and st.get('sha') == sha:
        r['unchanged'] = True; return r
    try:
        o = call(PROMPT.format(market=p.get('market', 'Bali'), country=p.get('country', ''), text=text[:16000]))
    except Budget:
        r['budget'] = True; return r
    except Exception as e:
        r['model_fail'] = str(e)[:80]; return r
    r['read'] = True
    tn = norm(text)
    facts, rej = {}, {'quote_not_found': 0, 'value_not_in_quote': 0}
    for k in FACTS:
        it = o.get(k) if isinstance(o, dict) else None
        if not isinstance(it, dict) or it.get('v') in (None, False, '', [], {}):
            continue
        q = str(it.get('q') or '').strip()
        if len(q) < 8 or '...' in q or '…' in q or norm(q) not in tn:
            rej['quote_not_found'] += 1; continue
        v = valid(k, it.get('v'), q)
        if v is None:
            rej['value_not_in_quote'] += 1; continue
        facts[k] = {'v': v, 'q': q}
    r['facts'] = facts; r['rej'] = rej
    r['text_len'] = len(text)
    r['_text'] = text   # used once to check old values, dropped before saving
    return r


def compare(r, st, base, hm, prev_text=None):
    """New state and findings for one read page. prev_text: the stored copy of the page as we (or the research agent) last read it."""
    text = r['_text']; facts = r['facts']; out = []; nochange = 0; ambiguous = 0
    prev = (st or {}).get('facts') if st and st.get('checked') else None
    src_seen = (st or {}).get('checked', '')[:10] if prev is not None else (base or {}).get('seen', '')
    old_facts = prev if prev is not None else ((base or {}).get('facts') or {})
    known = set(FACTS) if prev is not None else set((base or {}).get('known') or ())
    # first hourly read of a page the research agent read with the very same text: a difference is a reading difference, not a change
    same_page = prev is None and bool(base) and bool(base.get('sha')) and base.get('sha') == r.get('sha')
    new_state = {}
    for k in FACTS:
        n = facts.get(k); o = old_facts.get(k)
        if k == 'permit_claim':
            if n:
                new_state[k] = dict(n, seen=r['at'][:10])
                last = (st or {}).get('missing_permit_at') or ''
                week_ago = (NOW - timedelta(days=7)).strftime('%Y-%m-%d')
                if 'permit_number' not in facts and not PERMIT_NUM.search(text) and not old_facts.get('permit_number') and last[:10] < week_ago:
                    out.append(('missing', k, True, None, None)); r['missing_permit_at'] = r['at']
            continue
        if n and o:
            if same(k, n['v'], o['v'], year_only=o.get('year_only')):
                nochange += 1
                new_state[k] = dict(n, seen=r['at'][:10])
            elif same_page:
                ambiguous += 1
                new_state[k] = dict(n, seen=r['at'][:10])   # same text as the research agent read: our quoted reading becomes the baseline
            elif still_stated(k, o['v'], text):
                ambiguous += 1
                new_state[k] = dict(o)   # keep what we had: the page states both
            else:
                if k == 'handover' and o.get('year_only') and str(n['v'])[:4] == str(o['v'])[:4]:
                    nochange += 1
                else:
                    out.append(('changed', k, n['v'], o['v'], o.get('seen') or src_seen))
                new_state[k] = dict(n, seen=r['at'][:10])
        elif n and not o:
            kind = 'new' if k in known and not same_page else 'first'
            if kind == 'new':
                if prev_text is None:
                    kind = 'first'   # we cannot show it was absent before
                elif norm(n['q']) in norm(prev_text):
                    ambiguous += 1; new_state[k] = dict(n, seen=r['at'][:10]); continue   # it was already there: a reading difference
            if not (k == 'stage' and kind == 'first'):   # a first stage word alone is weak: recorded, not published
                out.append((kind, k, n['v'], None, src_seen))
            new_state[k] = dict(n, seen=r['at'][:10])
        elif o and not n:
            # removals only against our own earlier read (we hold its exact quote) and only when the page clearly no longer says it
            if prev is not None and o.get('q') and norm(o['q']) not in norm(text) and not still_stated(k, o['v'], text) and r['text_len'] >= 800 and k != 'stage':
                out.append(('removed', k, None, o['v'], o.get('seen') or src_seen))
            else:
                new_state[k] = dict(o)
                if prev is not None:
                    nochange += 1
    return new_state, out, nochange, ambiguous


def page_text(sha):
    import gzip
    try:
        return gzip.open(os.path.join(DATA, 'archive', sha[:2], sha + '.txt.gz')).read().decode('utf-8', 'replace')
    except Exception:
        return None


def save_state(path, state):
    with open(path, 'w') as f:
        f.write('{\n')
        keys = sorted(state)
        for i, k in enumerate(keys):
            f.write(json.dumps(k) + ': ' + json.dumps(state[k], ensure_ascii=False, sort_keys=True, separators=(',', ':')) + (',\n' if i < len(keys) - 1 else '\n'))
        f.write('}\n')


def main():
    od = sys.argv[1]
    os.makedirs(od, exist_ok=True)
    P = dev_intel.projects()
    # the same guard as agent.main: two markets with one prefix would publish one id for two projects
    pre = {}
    for p in P:
        m = p.get('market') or 'Bali'; pre.setdefault(agent.PREFIX.get(m, m[:3].upper()), set()).add(m)
    clash = {k: sorted(v) for k, v in pre.items() if len(v) > 1}
    if clash:
        sys.exit('public id prefix used by more than one market, add a PREFIX entry: %s' % clash)
    ids = dev_intel.public_ids(P)
    pc = os.environ.get('KB_PUBLIC_CASES')
    pub = {c['id']: c.get('market') for c in load(pc, {}).get('cases', [])} if pc else {}
    if not pub:
        sys.exit('KB_PUBLIC_CASES missing: findings are only published for ids that exist in the public dataset')
    P = [p for p in P if p.get('url') and pub.get(ids[p['slug']]) == p.get('market', 'Bali')]
    spath = os.path.join(DATA, 'live-state.json'); fpath = os.path.join(DATA, 'live-findings.json'); bpath = os.path.join(DATA, 'live-by-project.json')
    state = load(spath, {}); feed = load(fpath, {}); byp = load(bpath, {})
    latest = load(os.path.join(DATA, 'latest.json'), {})

    def last_read(p):
        s = (state.get(p['slug']) or {}).get('tried') or (state.get(p['slug']) or {}).get('checked')
        a = (latest.get(p['slug']) or {}).get('checked')
        return max(s or '', a or '')
    order = sorted(P, key=lambda p: (last_read(p), h16(p['slug'] + STAMP[:13])))[:MAX_PAGES]
    run = {'at': STAMP, 'projects_read': 0, 'pages_fetched': 0, 'fetch_failed': 0, 'robots_blocked': 0, 'unchanged_pages': 0, 'pages_read_by_model': 0,
           'findings': 0, 'no_change': 0, 'ambiguous': 0, 'rejected_quote_not_found': 0, 'rejected_value_not_in_quote': 0, 'model_errors': 0,
           'skipped_budget_or_time': 0, 'tokens_in': 0, 'tokens_out': 0, 'usd': 0.0, 'budget_usd': BUDGET, 'model': HAIKU, 'stopped_by': None,
           'oldest_read_before': None}
    if order:
        run['oldest_read_before'] = last_read(order[0]) or 'never'
    if not KEY:
        sys.exit('ANTHROPIC_API_KEY missing')
    hm = NOW.strftime('%H:%M')
    new_findings = []; texts = {}
    with cf.ThreadPoolExecutor(10) as ex:
        res = list(ex.map(lambda p: work(p, ids[p['slug']], state.get(p['slug']), latest.get(p['slug']) or {}), order))
    by_slug = {p['slug']: p for p in P}
    for r in res:
        if r.get('skipped') or r.get('budget'):
            run['skipped_budget_or_time'] += 1; continue
        p = by_slug[r['slug']]; pid = r['pid']; st = state.get(r['slug']) or {}
        run['projects_read'] += 1
        if r.get('robots'):
            run['robots_blocked'] += 1; st['tried'] = r['at']; state[r['slug']] = st; continue
        if r.get('fail') or r.get('thin'):
            run['fetch_failed'] += 1; st['tried'] = r['at']; st['fails'] = st.get('fails', 0) + 1; state[r['slug']] = st; continue
        run['pages_fetched'] += 1
        if r.get('unchanged'):
            run['unchanged_pages'] += 1; run['no_change'] += len(st.get('facts') or {}); st['checked'] = r['at']; st['tried'] = r['at']; st['fails'] = 0
            state[r['slug']] = st; byp.setdefault(pid, {'f': []}).update({'checked': r['at'], 'fp': r['sha'][:16]}); continue
        if r.get('model_fail'):
            run['model_errors'] += 1; st['tried'] = r['at']; state[r['slug']] = st; continue
        run['pages_read_by_model'] += 1
        run['rejected_quote_not_found'] += r['rej']['quote_not_found']; run['rejected_value_not_in_quote'] += r['rej']['value_not_in_quote']
        base = baseline_from_agent(latest.get(r['slug']) or {})
        ps = st.get('sha') if st.get('checked') else (base or {}).get('sha')
        new_state, out, nc, amb = compare(r, st, base, hm, page_text(ps) if ps else None)
        run['no_change'] += nc; run['ambiguous'] += amb
        nst = {'checked': r['at'], 'tried': r['at'], 'sha': r['sha'], 'facts': new_state, 'fails': 0, 'market': p.get('market', 'Bali')}
        if r.get('missing_permit_at') or st.get('missing_permit_at'):
            nst['missing_permit_at'] = r.get('missing_permit_at') or st.get('missing_permit_at')
        vers = list(st.get('versions') or [])
        texts[r['sha']] = r['_text']   # frozen copy of every page text the model read, like the research agent keeps
        for kind, fact, nv, ov, seen in out:
            q = (r['facts'].get(fact) or {}).get('q') or (((st.get('facts') or {}).get(fact) or {}).get('q') if kind == 'removed' else '') or ''
            f = {'id': h16('%s|%s|%s|%s|%s' % (pid, fact, kind, r['at'], json.dumps(nv, sort_keys=True))), 'at': r['at'], 'project': pid, 'market': p.get('market', 'Bali'),
                 'kind': kind, 'fact': LABEL[fact], 'text': pid + ' · ' + wording(pid, kind, fact, nv, ov, seen, hm), 'fp': r['sha'][:16]}
            if q:
                f['q'] = h16(q)
            if seen and kind in ('changed', 'removed', 'new'):
                f['prev_read'] = seen[:10]
            new_findings.append(f)
        if not vers or vers[-1][1] != r['sha']:
            vers.append([r['at'][:10], r['sha']])
        nst['versions'] = vers[-20:]   # page copies for the promise tracker (promises.page_versions)
        state[r['slug']] = nst
        e = byp.setdefault(pid, {'f': []}); e['checked'] = r['at']; e['fp'] = r['sha'][:16]
        e['f'] = ([{k: f[k] for k in ('at', 'kind', 'fact', 'text', 'q', 'fp', 'prev_read') if k in f} for f in new_findings if f['project'] == pid][::-1] + e.get('f', []))[:40]
    run['findings'] = len(new_findings)
    run['tokens_in'] = spend['in']; run['tokens_out'] = spend['out']; run['usd'] = round(spend['usd'], 5); run['calls'] = spend['calls']
    run['stopped_by'] = stop['why'] or ('pages' if len(order) >= MAX_PAGES else None)
    run['seconds'] = round(time.time() - T0)
    return run, new_findings, state, feed, byp, od, spath, fpath, bpath, len(P), texts


def finish(run, new_findings, state, feed, byp, od, spath, fpath, bpath, tracked, texts):
    for sha, text in texts.items():
        agent.keep_copy(text, sha)
    allf = sorted(new_findings + (feed.get('findings') or []), key=lambda f: f['at'], reverse=True)
    seen, keep = set(), []
    for f in allf:
        if f['id'] not in seen:
            seen.add(f['id']); keep.append(f)
    runs = ((feed.get('runs') or []) + [run])[-240:]
    tot = feed.get('totals') or {}
    for k in ('projects_read', 'pages_fetched', 'pages_read_by_model', 'findings', 'no_change', 'rejected_quote_not_found', 'rejected_value_not_in_quote', 'tokens_in', 'tokens_out'):
        tot[k] = (tot.get(k) or 0) + (run.get(k) or 0)
    tot['usd'] = round((tot.get('usd') or 0) + run['usd'], 5); tot['runs'] = (tot.get('runs') or 0) + 1
    tot['since'] = tot.get('since') or run['at']
    covered = sum(1 for v in state.values() if v.get('checked'))
    pubd = {
        'updated': run['at'],
        'about': ('Every hour a GitHub Actions job re-reads the developer pages of the tracked projects that were checked longest ago '
                  '(round robin over all %d projects with a public id), asks claude-haiku-5-5 for concrete facts with an exact quote each, '
                  'and publishes a finding only when a fact is new or changed compared with what we stored for that project.' % tracked),
        'method': {
            'schedule': 'hourly, GitHub Actions, one run at a time',
            'model': HAIKU, 'prices_usd_per_million_tokens': {HAIKU: list(PRICE[HAIKU]), SONNET: list(PRICE[SONNET])},
            'budget_usd_per_run': BUDGET,
            'budget_rule': 'spend is computed from the real token usage of every call at list prices; before each call its worst case is reserved, so a run stops before it can pass the budget',
            'checked_in_code': ['the quote is found word for word in the fetched page text (case, spacing and typographic quotes ignored, no skipping)',
                                'the quote contains the value (year, percent, amount or number)',
                                'a changed value is published only if the old value is no longer stated near the same words on the page',
                                'a page with the same SHA-256 as at our last read is not sent to the model and counts as no change'],
            'politeness': 'robots.txt respected, one request per host every %g seconds, User-Agent %s' % (GAP, agent.UA),
            'anonymity': 'project id and market only: never the developer, the project name, the URL or the quote. q is the first 16 hex characters of the SHA-256 of the quote, fp of the page text; we keep a frozen copy of the page text so both can be checked later.',
            'kinds': {'changed': 'a value differs from our last read and the old value is no longer on the page', 'new': 'stated now, not stated at our last read',
                      'first': 'first time we recorded this fact for the project', 'removed': 'stated at our last read, gone now', 'missing': 'the page says permits are obtained but shows no permit number'},
        },
        'coverage': {'projects_tracked': tracked, 'projects_read_by_hourly_check': covered},
        'totals': tot,
        'runs': runs,
        'findings': keep[:KEEP],
    }
    feed_out = json.dumps(pubd, ensure_ascii=False, separators=(',', ':'))
    for pth in (fpath, os.path.join(od, 'live-findings.json')):
        open(pth, 'w').write(feed_out)
    bp = {'updated': run['at'], 'about': 'Per project id: when the hourly check last read the developer page (fp = first 16 hex of the SHA-256 of the page text) and its findings, newest first. Same rules as /data/live-findings.json.', 'projects': {k: byp[k] for k in sorted(byp)}}
    bpt = json.dumps(bp, ensure_ascii=False, separators=(',', ':'))
    for pth in (bpath, os.path.join(od, 'findings-by-project.json')):
        open(pth, 'w').write(bpt)
    save_state(spath, state)
    print(json.dumps(run))
    for f in new_findings[:30]:
        print(' ', f['text'])


if __name__ == '__main__':
    finish(*main())
