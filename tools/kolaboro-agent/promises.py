#!/usr/bin/env python3
"""Kolaboro promise tracker: every dated promise a developer made, and whether it was kept, broken, moved or is still pending.

Usage: promises.py OUT_DIR [--no-ai]
Writes OUT_DIR/promises.json (public, anonymous project ids only) and updates, in this private repository,
data/promises-cache.json (model answers keyed by the SHA-256 of the text they read, so a text is never paid for twice)
and data/promises-spend.json (every run's model spend, cumulative).

Sources, both already kept by the research agent:
  research records  projects.json / projects-world.json: the researcher's note, documents listed, evidence, claims and flags
                    (free text, read by the model) and the structured facts handover_promised, original_handover and
                    delay_months (read in code).
  page copies       the developer page text on every day the agent read it (data/runs/<day>.json gives the SHA-256,
                    data/archive/<sha[:2]>/<sha>.txt.gz holds the text). Only the passages around a year (2024 to 2035)
                    are sent to the model.

Rules enforced in code, not left to the model:
  - every item must carry a quote that is found word for word (case, spacing and typographic quotes ignored) in the
    stored text it says it came from, and the quote must contain the year of the date; anything else is rejected and counted
  - "broken" only when the promised date has passed and a dated observation made after that date shows it did not happen
    (the project is still not completed, or a research statement says so); with no such evidence a past promise is "unknown"
  - "moved" only when the same source shows a later date than before: an earlier copy of the same page, or a research record
    that states the original date
  - when one page copy states two different dates for the same promise, claude-sonnet-5-5 decides which one is current
    (or says they are separate phases); if it cannot tell, that copy is not used for the promise
Env: ANTHROPIC_API_KEY, KB_PROMISE_MAX_USD (cumulative cap across all runs, default 9.5), KB_PROMISE_RUN_USD (per run, default 3).
"""
import json, os, re, sys, glob, gzip, time, hashlib, statistics, threading, urllib.request, urllib.error, concurrent.futures as cf
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
sys.path.insert(0, HERE)
sys.argv = [a for a in sys.argv]   # dev_intel reads --no-net from argv; harmless here
import dev_intel  # noqa: E402  (projects(), public_ids(): the exact public id numbering)

NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime('%Y-%m-%d')
TODAY_M = NOW.year * 12 + NOW.month          # month index
KEY = os.environ.get('ANTHROPIC_API_KEY', '').strip()
AI = bool(KEY) and '--no-ai' not in sys.argv
HAIKU, SONNET = 'claude-haiku-5-5', 'claude-sonnet-5-5'
PRICE = {HAIKU: (0.10, 0.50), SONNET: (2.0, 10.0)}   # USD per million tokens in / out, list prices (platform.claude.com/docs/en/about-claude/pricing, Nov 2026)
MAX_TOTAL = float(os.environ.get('KB_PROMISE_MAX_USD', '9.5'))
MAX_RUN = float(os.environ.get('KB_PROMISE_RUN_USD', '3'))
MAX_SECONDS = float(os.environ.get('KB_PROMISE_MAX_SECONDS', '2400'))   # stop starting new readings after this, so the run always saves its cache
T0 = time.time()
PV = 'promises-v2'
KINDS = ('handover', 'construction_start', 'structure', 'milestone', 'permit', 'rental')
KIND_LABEL = {'handover': 'Handover or completion', 'construction_start': 'Construction start', 'structure': 'Structure finished (topping out)',
              'milestone': 'Other construction milestone', 'permit': 'Permit or approval obtained', 'rental': 'Rental programme or operations start'}
YR = re.compile(r'\b20(2[4-9]|3[0-5])\b')
WEAK = re.compile(r'\b(no|not|nor|without)\b[^.;]{0,80}\b(published|disclosed|available|posted|shown|stated)\b', re.I)

lock = threading.Lock()
spend = {'usd': 0.0, 'haiku_calls': 0, 'sonnet_calls': 0, 'in': 0, 'out': 0, 'errors': 0}
rejected = {'no_quote': 0, 'quote_not_found': 0, 'year_not_in_quote': 0, 'bad_date': 0, 'bad_kind': 0, 'unknown_source': 0}


def load(p, d):
    try:
        return json.load(open(p))
    except Exception:
        return d


def norm(s):
    s = str(s or '').lower()
    s = re.sub(r'[‘’‚‛′`]', "'", s)
    s = re.sub(r'[“”„″]', '"', s)
    s = re.sub(r'[‐-―−]', '-', s)
    s = s.replace(' ', ' ').replace('&amp;', '&')
    return re.sub(r'\s+', ' ', s).strip()


def quote_ok(q, src_norm):
    """The quote must appear in the stored text. "..." may skip text, but every part (8+ chars) must appear, in order."""
    parts = [x.strip(' .,;:') for x in re.split(r'\.\.\.|…', norm(q))]
    parts = [x for x in parts if x]
    if not parts or sum(len(x) for x in parts) < 8:
        return False
    at = 0
    for x in parts:
        if len(x) < 4:
            continue
        i = src_norm.find(x, at)
        if i < 0:
            return False
        at = i + len(x)
    return True


# ---------- dates ----------

MON = {m: i + 1 for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}


def parse_date(v):
    """'2027', '2027-Q2', '2027-H1', '2027-06' -> (canonical string, end month index). None if not a date."""
    s = str(v or '').strip().upper().replace(' ', '')
    m = re.match(r'^(20[2-4]\d)(?:-?(Q[1-4]|H[12]|\d{1,2}))?$', s)
    if not m:
        m2 = re.search(r'(20[2-4]\d)\s*-?\s*(Q[1-4])', s)
        if not m2:
            return None
        m = m2
    y = int(m.group(1)); p = m.group(2)
    if not p:
        return str(y), y * 12 + 12
    if p.startswith('Q'):
        q = int(p[1]); return '%d-Q%d' % (y, q), y * 12 + q * 3
    if p.startswith('H'):
        h = int(p[1]); return '%d-H%d' % (y, h), y * 12 + h * 6
    mo = int(p)
    if not 1 <= mo <= 12:
        return None
    return '%d-%02d' % (y, mo), y * 12 + mo


def month_idx(day):
    try:
        y, m = int(day[:4]), int(day[5:7]); return y * 12 + m
    except Exception:
        return None


def checked_day(p):
    m = re.search(r'checked (\d{1,2}) ([A-Za-z]{3})[a-z]* (20\d\d)', p.get('note') or '')
    if m and m.group(2).lower() in MON:
        return '%s-%02d-%02d' % (m.group(3), MON[m.group(2).lower()], int(m.group(1)))
    return (p.get('added') or '')[:10] or None


# ---------- sources ----------

def research_text(p):
    L = [p.get('note') or '']
    L += [str(x) for x in p.get('docs_listed') or []]
    L += ['%s: %s' % (k, v) for k, v in (p.get('evidence') or {}).items() if v]
    L += [str(c.get('claim')) for c in p.get('claims') or [] if isinstance(c, dict) and c.get('claim')]
    L += [str(f.get('text') if isinstance(f, dict) else f) for f in p.get('flags') or []]
    L += [str(x) for x in p.get('positives') or []] if isinstance(p.get('positives'), list) else []
    return '\n'.join(x for x in L if x)


def snippets(text, cap=3200, pad=220):
    """Passages around each year mention, merged, capped. Each passage is a verbatim slice of the text."""
    spans = []
    for m in YR.finditer(text):
        a, b = max(0, m.start() - pad), min(len(text), m.end() + pad)
        if spans and a <= spans[-1][1]:
            spans[-1][1] = b
        else:
            spans.append([a, b])
    out, n = [], 0
    for a, b in spans:
        s = text[a:b]
        if n + len(s) > cap:
            s = s[:max(0, cap - n)]
        if s:
            out.append(s); n += len(s)
        if n >= cap:
            break
    return '\n[...]\n'.join(out)


def page_versions():
    """slug -> [(day, sha256)] for each day the page was read, in day order (only days the text was fingerprinted)."""
    out = {}
    for f in sorted(glob.glob(os.path.join(DATA, 'runs', '*.json'))):
        day = os.path.basename(f)[:10]
        try:
            L = json.load(open(f)).get('latest') or {}
        except Exception:
            continue
        for slug, r in L.items():
            s = r.get('sha256')
            if r.get('source') == 'ai' and r.get('checked') == day and s and re.match(r'^[0-9a-f]{64}$', s):
                out.setdefault(slug, []).append((day, s))
    return out


_TXT = {}


def page_text(sha):
    if sha not in _TXT:
        p = os.path.join(DATA, 'archive', sha[:2], sha + '.txt.gz')
        try:
            _TXT[sha] = gzip.open(p).read().decode('utf-8', 'replace')
        except Exception:
            _TXT[sha] = None
    return _TXT[sha]


# ---------- model ----------

PROMPT = """You read text about one off-plan property project for Kolaboro, which protects people who buy property abroad.
Find every DATED promise about a future event and every dated statement that such an event happened or did not happen.
Events (use exactly these kinds):
- handover: completion, delivery, handover, keys, ready to move in, project finished
- construction_start: groundbreaking, construction starts, works begin
- structure: structure complete, topping out, frame finished
- milestone: another named construction stage (foundation done, phase 1 complete, show unit ready)
- permit: a permit, licence or approval to be obtained, or obtained
- rental: a rental programme, hotel operation or rental income starting

Reply with ONLY one JSON object: {"items": [ ... ]} with at most 8 items, each:
{"type": "promise" | "happened" | "not_happened",
 "kind": one of the kinds above,
 "date": the date of the event as "YYYY", "YYYY-Qn", "YYYY-Hn" or "YYYY-MM" (for not_happened: the date when the text says it had still not happened, or null),
 "superseded": true only if the text says this was the ORIGINAL or an EARLIER date that has since changed, else false,
 "quote": the exact words of the text that state it, copied character for character, 5 to 30 words, containing the year}
Rules: only events with an explicit year in the text (no "within 18 months"). Do not include dates that are about something else
(company founding, a price list date, a news date, a lease term, a payment instalment). If there is nothing, reply {"items": []}.
Our software checks every quote against the text and deletes items whose quote is not found or does not contain the year.

TEXT ({label}):
<<<
{text}
>>>"""

RESOLVE = """Two dated statements about the same kind of event ({kind}) for one off-plan property project were read from the same source
on the same day. Decide what the developer's current promise is.
A: date {da}, quote: "{qa}"
B: date {db}, quote: "{qb}"
Reply with ONLY one JSON object: {{"answer": "A" | "B" | "separate" | "unclear", "reason": "under 20 words"}}
"separate" means they are about different phases, buildings or units, so both stand. Never guess: "unclear" if the quotes do not say."""


def budget_left():
    return min(MAX_RUN - spend['usd'], MAX_TOTAL - (spend['prior'] + spend['usd']))


def call(model, prompt, max_tokens=4000):
    with lock:
        if budget_left() <= 0.02:
            raise RuntimeError('budget')
    body = json.dumps({'model': model, 'max_tokens': max_tokens, 'messages': [{'role': 'user', 'content': prompt}]}).encode()
    last = None
    for i in range(3):
        req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
            'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                d = json.loads(r.read())
            u = d.get('usage', {}); pi, po = PRICE[model]
            with lock:
                spend['in'] += u.get('input_tokens', 0); spend['out'] += u.get('output_tokens', 0)
                spend['usd'] += u.get('input_tokens', 0) * pi / 1e6 + u.get('output_tokens', 0) * po / 1e6
                spend['haiku_calls' if model == HAIKU else 'sonnet_calls'] += 1
            t = ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text')
            m = re.search(r'\{.*\}', t, re.S)
            if d.get('stop_reason') == 'max_tokens' or not m:
                raise RuntimeError('no complete answer')   # never cached: read again next run
            try:
                return json.loads(m.group(0))
            except Exception:
                raise RuntimeError('invalid json')
        except urllib.error.HTTPError as e:
            last = 'HTTP %s' % e.code
            if e.code in (429, 500, 502, 503, 529):
                time.sleep(8 * (i + 1)); continue
            break
        except Exception as e:
            last = str(e)[:80]; time.sleep(4 * (i + 1))
    with lock:
        spend['errors'] += 1
    raise RuntimeError(last or 'model error')


def extract(cache, label, text):
    """Model items for one text (cached by the SHA-256 of what the model reads). Returns None when not read (no budget)."""
    snip = snippets(text)
    if not snip:
        return []
    k = hashlib.sha256((PV + '\n' + snip).encode()).hexdigest()
    if k in cache:
        return cache[k]
    if not AI or time.time() - T0 > MAX_SECONDS:
        return None
    try:
        o = call(HAIKU, PROMPT.replace('{label}', label).replace('{text}', snip))
    except RuntimeError:
        return None
    if not isinstance(o, dict) or not isinstance(o.get('items'), list):
        return None
    items = (o or {}).get('items') if isinstance(o, dict) else None
    items = items if isinstance(items, list) else []
    with lock:
        cache[k] = items[:8]
    return cache[k]


def clean_items(items, src_text):
    """Keep only items whose quote is found in the stored text and contains the year of the date."""
    out = []
    sn = norm(src_text)
    for it in items or []:
        if not isinstance(it, dict):
            continue
        kind = it.get('kind'); ty = it.get('type')
        if kind not in KINDS or ty not in ('promise', 'happened', 'not_happened'):
            rejected['bad_kind'] += 1; continue
        q = str(it.get('quote') or '').strip()
        if not q:
            rejected['no_quote'] += 1; continue
        if not quote_ok(q, sn):
            rejected['quote_not_found'] += 1; continue
        d = parse_date(it.get('date')) if it.get('date') else None
        if ty != 'not_happened' and not d:
            rejected['bad_date'] += 1; continue
        if d and d[0][:4] not in q:
            rejected['year_not_in_quote'] += 1; continue
        out.append({'type': ty, 'kind': kind, 'date': d[0] if d else None, 'end': d[1] if d else None, 'superseded': it.get('superseded') is True, 'quote': q})
    return out


def qhash(q):
    return hashlib.sha256(q.encode()).hexdigest()[:16]


# ---------- status ----------

def resolve_conflict(cache, kind, a, b):
    k = hashlib.sha256(('resolve-v1\n%s\n%s\n%s\n%s\n%s' % (kind, a['date'], a['quote'], b['date'], b['quote'])).encode()).hexdigest()
    if k in cache:
        return cache[k]
    if not AI:
        return None
    try:
        o = call(SONNET, RESOLVE.format(kind=KIND_LABEL[kind], da=a['date'], qa=a['quote'], db=b['date'], qb=b['quote']), 3000)
    except RuntimeError:
        return None
    ans = (o or {}).get('answer') if isinstance(o, dict) else None
    ans = ans if ans in ('A', 'B', 'separate', 'unclear') else 'unclear'
    with lock:
        cache[k] = ans
    return ans


def thread_status(p, kind, obs, cache, stats):
    """obs: [{day, src ('page'|'research'), sha, items(kind-filtered)}] in day order. Returns the published promise or None."""
    promises = [(o, it) for o in obs for it in o['items'] if it['type'] == 'promise']
    if not promises:
        return None
    hist, moves, months, earlier = [], 0, 0, 0
    # moves stated inside one research record: an original (superseded) date, then the current one
    for o in obs:
        if o['src'] != 'research':
            continue
        sup = [it for it in o['items'] if it['type'] == 'promise' and it['superseded']]
        cur = [it for it in o['items'] if it['type'] == 'promise' and not it['superseded']]
        if sup and cur:
            a = min(sup, key=lambda x: x['end']); b = max(cur, key=lambda x: x['end'])
            if b['end'] > a['end']:
                moves += 1; months += b['end'] - a['end']
                hist.append({'d': a['date'], 'src': 'research', 'seen': o['day'], 'note': 'original date stated in the research record', 'q': qhash(a['quote'])})
    # moves across copies of the same page
    prev, picks = None, {}
    for o in obs:
        cur = [it for it in o['items'] if it['type'] == 'promise' and not it['superseded']]
        if not cur:
            continue
        if o['src'] == 'research':
            picks[id(o)] = max(cur, key=lambda x: x['end'])
            continue
        ends = sorted({it['end'] for it in cur})
        pick = cur[0]
        if len(ends) > 1:
            a = min(cur, key=lambda x: x['end']); b = max(cur, key=lambda x: x['end'])
            ans = resolve_conflict(cache, kind, a, b); stats['date_conflicts'] += 1
            pick = a if ans in ('A', 'separate') else b if ans == 'B' else None   # separate phases: track the first; unclear: the day is not used
        if pick is None:
            continue
        picks[id(o)] = pick
        if prev and prev['end'] != pick['end'] and prev['sha'] != o['sha']:
            if pick['end'] > prev['end']:
                moves += 1; months += pick['end'] - prev['end']
            else:
                earlier += 1
        hist.append({'d': pick['date'], 'src': 'page', 'seen': o['day'], 'q': qhash(pick['quote']), 'sha': o['sha'][:16]})
        prev = {'end': pick['end'], 'sha': o['sha']}
    # the current promise: the newest observation (research record or page copy) that states one
    latest = None
    for o in obs:
        if id(o) in picks:
            latest = (o, picks[id(o)])
    if not latest:
        return None
    lo, cur = latest
    for o in obs:
        if o['src'] == 'research' and id(o) in picks:
            it = picks[id(o)]
            if not any(h.get('q') == qhash(it['quote']) for h in hist):
                hist.append({'d': it['date'], 'src': 'research', 'seen': o['day'], 'q': qhash(it['quote'])})
    # evidence of what happened
    done, not_done = [], []
    for o in obs:
        for it in o['items']:
            if it['type'] == 'happened':
                done.append((o, it))
            elif it['type'] == 'not_happened':
                not_done.append((o, it))
    stage = str(p.get('stage') or '').lower(); rday = checked_day(p)
    ver = (p.get('verification') or {}).get('permit')
    if kind == 'handover' and rday:
        if 'complet' in stage or 'handed' in stage:
            done.append(({'day': rday, 'src': 'research'}, {'date': None, 'end': None, 'quote': 'stage: ' + stage}))
        elif stage in ('under construction', 'off-plan'):
            not_done.append(({'day': rday, 'src': 'research'}, {'date': None, 'end': None, 'quote': 'stage: ' + stage}))
    if kind == 'construction_start' and rday and stage in ('under construction', 'completed'):
        done.append(({'day': rday, 'src': 'research'}, {'date': None, 'end': None, 'quote': 'stage: ' + stage}))
        # "off-plan" is a sales stage, not proof that works have not started: never used as evidence of a broken start
    if kind == 'permit' and rday and ver in ('registry', 'independent'):
        done.append(({'day': rday, 'src': 'research'}, {'date': None, 'end': None, 'quote': 'permit ' + ver}))
    end = cur['end']; past = end < TODAY_M
    # a dated "it happened" statement supports this promise only if it falls in the promised period (up to 6 months before its end):
    # an event long before the date is usually a first phase or a first unit, not the promised event
    done = [x for x in done if not x[1].get('end') or end - 6 < x[1]['end'] <= end + 0]  + [x for x in done if x[1].get('end') and x[1]['end'] > end]
    st, ev = None, None
    on_time = [x for x in done if (x[1].get('end') and x[1]['end'] <= end) or (month_idx(x[0]['day']) or 10 ** 9) <= end]
    if on_time:
        st, ev = 'kept', on_time[0]
    elif done:
        st, ev = 'unknown', done[0]   # happened, but we cannot show it was on time
    elif past:
        # the observation must be dated after the promised date: the statement's own date when it has one, else the day we read it.
        # "nothing is published" is not evidence that it did not happen, so such statements are not used.
        after = [x for x in not_done if ((x[1].get('end') or month_idx(x[0]['day']) or 0) > end)
                 and not WEAK.search(x[1].get('quote') or '')]
        if after:
            st, ev = 'broken', after[-1]
        else:
            st = 'unknown'
    else:
        st = 'moved' if moves else 'pending'
    out = {'k': kind, 'd': cur['date'], 'st': st, 'mv': moves, 'mm': months, 'src': lo['src'], 'seen': lo['day'], 'q': qhash(cur['quote'])}
    if lo['src'] == 'page':
        out['sha'] = lo['sha'][:16]
    if earlier:
        out['earlier'] = earlier
    rp = [picks[id(o)] for o in obs if o['src'] == 'research' and id(o) in picks]
    if rp and rp[-1]['date'] != cur['date']:
        out['rd'] = rp[-1]['date']   # the research record gives a different current date than the newest page copy
    if ev:
        out['ev'] = {'src': ev[0]['src'], 'seen': ev[0]['day'], 'what': 'done' if ev in done else 'not done'}
    hist = sorted((json.loads(h) for h in {json.dumps(h, sort_keys=True) for h in hist}), key=lambda h: (h['seen'], h['src'], h['d'] or ''))
    comp = []   # consecutive identical readings of the same source become one entry with a first and last day
    for h in hist:
        last = next((c for c in reversed(comp) if c['src'] == h['src']), None)
        if last and h['src'] == 'page' and last['d'] == h['d'] and last.get('q') == h.get('q'):
            last['last'] = h['seen']; continue
        comp.append(dict(h))
    out['hist'] = comp[:12]
    return out


def facts_thread(p):
    """Handover moves stated in the structured research facts (original_handover -> handover_promised, delay_months)."""
    f = p.get('facts') or {}
    cur = parse_date(f.get('handover_promised')); orig = parse_date(f.get('original_handover'))
    dm = f.get('delay_months')
    try:
        dm = int(float(dm)) if dm not in (None, '') else None
    except Exception:
        dm = None
    if cur and orig and cur[1] > orig[1]:
        return {'cur': cur, 'orig': orig, 'months': cur[1] - orig[1]}
    if cur and dm and dm > 0:
        return {'cur': cur, 'orig': None, 'months': dm}
    return {'cur': cur, 'orig': None, 'months': 0} if cur else None


def main():
    od = sys.argv[1]
    os.makedirs(od, exist_ok=True)
    cpath = os.path.join(DATA, 'promises-cache.json'); spath = os.path.join(DATA, 'promises-spend.json')
    cache = load(cpath, {}); slog = load(spath, {'runs': [], 'total_usd': 0.0})
    spend['prior'] = float(slog.get('total_usd') or 0)
    P = dev_intel.projects(); ids = dev_intel.public_ids(P)
    pv = page_versions()
    stats = {'date_conflicts': 0, 'texts_read': 0, 'texts_skipped_budget': 0, 'page_copies': 0, 'page_copies_missing': 0, 'research_records': 0}
    # 1. collect texts to read (research record + each distinct page copy)
    jobs = []
    for p in P:
        rt = research_text(p)
        jobs.append((p['slug'], 'research', checked_day(p), None, rt))
        stats['research_records'] += 1
        seen = set()
        for day, sha in pv.get(p['slug'], []):
            t = page_text(sha)
            if t is None:
                stats['page_copies_missing'] += 1; continue
            stats['page_copies'] += 1
            jobs.append((p['slug'], 'page', day, sha, t if sha not in seen else None))
            seen.add(sha)
    # 2. read them (cached texts cost nothing); research records first, then newest page copies first
    order = sorted(range(len(jobs)), key=lambda i: (jobs[i][1] != 'research', '' if jobs[i][1] == 'research' else ''.join(chr(255 - ord(c)) for c in jobs[i][2])))
    res = {}

    def work(i):
        slug, src, day, sha, t = jobs[i]
        if t is None:
            return i, 'dup'
        label = 'research record written by Kolaboro' if src == 'research' else 'copy of the developer or listing page read on ' + day
        return i, extract(cache, label, t)
    with cf.ThreadPoolExecutor(12) as ex:
        for i, items in ex.map(work, order):
            res[i] = items
    # duplicates of a page text reuse the first reading
    first = {}
    for i, (slug, src, day, sha, t) in enumerate(jobs):
        if src == 'page' and t is not None:
            first[(slug, sha)] = i
    for i, (slug, src, day, sha, t) in enumerate(jobs):
        if res.get(i) == 'dup':
            j = first.get((slug, sha)); res[i] = res.get(j)
    # 3. clean and group
    by = {}
    for i, (slug, src, day, sha, t) in enumerate(jobs):
        items = res.get(i)
        if items is None:
            stats['texts_skipped_budget'] += 1; continue
        stats['texts_read'] += 1
        txt = t if t is not None else page_text(sha)
        by.setdefault(slug, []).append({'day': day or '', 'src': src, 'sha': sha or '', 'items': clean_items(items, txt or '')})
    out, market = {}, {}
    mkt = {p['slug']: p.get('market', 'Bali') for p in P}
    for p in P:
        slug = p['slug']; obs = sorted(by.get(slug, []), key=lambda o: (o['day'], o['src'] == 'page'))
        L = []
        for kind in KINDS:
            ko = [{**o, 'items': [it for it in o['items'] if it['kind'] == kind]} for o in obs]
            r = thread_status(p, kind, ko, cache, stats)
            if kind == 'handover':
                ft = facts_thread(p)
                # only on top of a quoted promise for the same year: a structured field alone is not a quote
                if ft and ft['months'] > 0 and r and r['d'][:4] == ft['cur'][0][:4]:
                    if r['mv'] == 0:   # the structured research facts record a move the texts did not show
                        r['mv'] = 1; r['mm'] = ft['months']
                        r['hist'] = [{'d': ft['orig'][0] if ft['orig'] else None, 'src': 'research', 'seen': checked_day(p), 'note': 'original handover date in the research record' if ft['orig'] else 'research record: handover delayed %d months' % ft['months']}] + r['hist']
                    if r['st'] in (None, 'pending'):
                        end = parse_date(r['d'])[1] if parse_date(r['d']) else None
                        st = str(p.get('stage') or '').lower()
                        if 'complet' in st or 'handed' in st:
                            r['st'] = 'unknown'
                        elif end and end < TODAY_M:
                            r['st'] = 'broken' if st in ('under construction', 'off-plan') else 'unknown'
                            if r['st'] == 'broken':
                                r['ev'] = {'src': 'research', 'seen': checked_day(p), 'what': 'not done'}
                        else:
                            r['st'] = 'moved'
            if r and r.get('q'):
                L.append(r)
        if L:
            out[ids[slug]] = L
    # only ids already in the public dataset (projects found today get their public id with the next research agent publish)
    pub_ids = None
    pc = os.environ.get('KB_PUBLIC_CASES')
    if pc and os.path.exists(pc):
        pub_ids = {c['id']: c.get('market') for c in load(pc, {}).get('cases', [])} or None
    if pub_ids:   # the id must exist publicly AND belong to the same market (two new markets can share an id prefix)
        keep = {ids[p['slug']] for p in P if pub_ids.get(ids[p['slug']]) == p.get('market', 'Bali')}
        out = {k: v for k, v in out.items() if k in keep}
        P = [p for p in P if ids[p['slug']] in keep and pub_ids.get(ids[p['slug']]) == p.get('market', 'Bali')]
    # 4. totals
    allp = [x for v in out.values() for x in v]
    def tally(lst):
        c = {s: sum(1 for x in lst if x['st'] == s) for s in ('kept', 'broken', 'moved', 'pending', 'unknown')}
        mvd = [x for x in lst if x['mv'] > 0]
        c.update({'promises': len(lst), 'moved_ever': len(mvd), 'moves': sum(x['mv'] for x in mvd),
                  'months_moved_median': statistics.median([x['mm'] for x in mvd]) if mvd else None,
                  'months_moved_total': sum(x['mm'] for x in mvd)})
        return c
    for slug in [p['slug'] for p in P]:
        i = ids[slug]
        if i in out:
            market.setdefault(mkt[slug], []).extend(out[i])
    mk = []
    for m, lst in sorted(market.items(), key=lambda kv: -len(kv[1])):
        t = tally(lst); t['market'] = m; t['projects'] = sum(1 for p in P if p.get('market', 'Bali') == m and ids[p['slug']] in out); mk.append(t)
    kinds = {k: tally([x for x in allp if x['k'] == k]) for k in KINDS}
    spend['usd'] = round(spend['usd'], 4)
    run = {'day': TODAY, 'usd': spend['usd'], 'haiku_calls': spend['haiku_calls'], 'sonnet_calls': spend['sonnet_calls'], 'tokens_in': spend['in'], 'tokens_out': spend['out'], 'errors': spend['errors']}
    slog['runs'] = (slog.get('runs') or [])[-200:] + [run]
    slog['total_usd'] = round(spend['prior'] + spend['usd'], 4)
    json.dump(slog, open(spath, 'w'), indent=1)
    json.dump(cache, open(cpath, 'w'), separators=(',', ':'), ensure_ascii=False, sort_keys=True)
    pub = {
        'updated': TODAY,
        'version': PV,
        'method': ('Every dated promise a developer made about a project (handover, construction start, structure, other milestones, permits, '
                   'rental programme) is read by claude-haiku-5-5 from two stores the research agent already keeps: the research record of '
                   'each project and the copy of the developer or listing page on every day the agent read it. Each item must carry an exact '
                   'quote: software checks the quote word for word against the stored text and checks that it contains the year, and rejects '
                   'it otherwise. A promise is kept when the event is shown done no later than the promised date; broken only when the date has '
                   'passed and an observation made after that date shows it had not happened (for handover: the project is still not completed '
                   'in our research record); moved when the same source later shows a later date (an earlier copy of the same page, or a research '
                   'record that states the original date), with how many times and by how many months; pending when the date is still ahead; '
                   'unknown when the date has passed and we hold no dated evidence either way, or the event happened but we cannot show it was on '
                   'time. When the newest copy states two dates for the same promise, claude-sonnet-5-5 decides which is current. Projects are '
                   'anonymous: quotes are not published (they would identify the project); each promise carries the first 16 hex characters of '
                   'the SHA-256 of its quote and, for page copies, of the page text, which is the fingerprint already sealed in the daily log.'),
        'statuses': {'kept': 'done no later than the promised date', 'broken': 'date passed, and a later observation shows it had not happened',
                     'moved': 'date pushed later at least once, new date still ahead', 'pending': 'date still ahead, never moved',
                     'unknown': 'date passed with no dated evidence either way, or done but timing not shown'},
        'kinds': KIND_LABEL,
        'sources': {'research_records': stats['research_records'], 'page_copies': stats['page_copies'], 'page_copies_without_text': stats['page_copies_missing'],
                    'texts_read': stats['texts_read'], 'texts_not_read_yet': stats['texts_skipped_budget'],
                    'days': sorted({d for v in pv.values() for d, _ in v})},
        'checks': {'rejected': dict(rejected), 'date_conflicts': stats['date_conflicts']},
        'spend': {'this_run_usd': spend['usd'], 'total_usd': slog['total_usd'], 'cap_usd': MAX_TOTAL, 'runs': len(slog['runs']),
                  'models': [HAIKU, SONNET], 'note': 'Computed from token usage at list prices: 0.10 / 0.50 USD (haiku) and 2 / 10 USD (sonnet) per million tokens in / out. The first run (4 Nov 2026 08:38 UTC, logged as 0.26 USD) used a 10 times higher estimate.'},
        'counts': dict(tally(allp), projects=len(out), projects_tracked=len(P)),
        'kinds_totals': kinds,
        'markets': mk,
        'projects': out,
    }
    json.dump(pub, open(os.path.join(od, 'promises.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    print(json.dumps(pub['counts']), json.dumps(pub['sources']['texts_read']), json.dumps(pub['checks']), json.dumps(run))


if __name__ == '__main__':
    main()
