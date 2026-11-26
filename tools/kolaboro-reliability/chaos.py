"""Weekly chaos drill against production kolaboro.com. Writes <out>/chaos.json (last 12 runs, newest first).

Two kinds of scenario:
  - AI faults inside the desk review, forced by the worker (POST /api/x/f/chaos), which accepts only a GitHub OIDC token minted
    for this workflow. The worker plants a random token in a test page and fails only the model calls that carry it.
  - Source faults on the public desk-review endpoint (/api/kb/analyze): a dead domain, a page that is gone (410),
    a host that never answers (TCP blackhole) and a page that answers very slowly.
Usage: python3 chaos.py <outdir>
"""
import re
import json, os, sys, time, random, string, datetime, urllib.request, urllib.error

BASE = os.environ.get('BASE', 'https://kolaboro.com')
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
UA = 'kolaboro-chaos/1.0 (github actions; weekly drill)'
KEEP = 12


def call(url, body=None, headers=None, timeout=150):
    h = {'user-agent': UA}
    h.update(headers or {})
    data = json.dumps(body).encode() if body is not None else None
    if data is not None:
        h['content-type'] = 'application/json'
    t = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, data, h), timeout=timeout)
        status, txt = r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        status, txt = e.code, e.read().decode('utf-8', 'replace')
    except Exception as e:
        status, txt = 0, str(e)
    ms = int((time.time() - t) * 1000)
    try:
        js = json.loads(txt)
    except Exception:
        js = None
    return status, js, txt[:300], ms


def oidc():
    u = os.environ.get('ACTIONS_ID_TOKEN_REQUEST_URL')
    if not u:
        return None
    r = urllib.request.urlopen(urllib.request.Request(u + '&audience=kolaboro.com', headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}), timeout=15)
    return json.load(r)['value']


# public wording (owner rule: public copy never mentions AI): the two models are "the primary reader" and "the second reader"
AI = [
    ('primary_model_down', 'Primary reader down', 'the primary reader answers HTTP 529 (overloaded)'),
    ('primary_model_down_injection', 'Primary reader down, page with hidden instructions', 'the primary reader answers HTTP 529'),
    ('second_model_down', 'Second reader down', 'the second reader answers HTTP 529'),
    ('primary_model_slow', 'Primary reader hangs (never answers)', 'the primary reader never answers; the 60 s deadline must cut it'),
    ('both_models_down', 'Both readers down', 'both readers answer HTTP 529'),
]
PUB = [(re.compile(r'claude-haiku[\w.-]*', re.I), 'primary reader'), (re.compile(r'claude-sonnet[\w.-]*', re.I), 'second reader'), (re.compile(r'claude-[\w.-]+', re.I), 'reader'),
       (re.compile(r'\bAI manipulation\b'), 'hidden instructions'), (re.compile(r'\bAI\b'), 'automated'), (re.compile(r'\b(anthropic|claude)\b', re.I), 'reader')]


def pub(t):
    """Observed and expected text as published: model and vendor names become reader roles."""
    t = '' if t is None else str(t)
    for rx, rep in PUB:
        t = rx.sub(rep, t)
    return t


def ai_scenarios(tok):
    out = []
    for sid, title, forced in AI:
        s = {'id': sid, 'title': title, 'kind': 'reader', 'forced': forced}
        if not tok:
            s.update(pass_=None, expected='', observed_text='skipped: no OIDC token (not running in GitHub Actions)', ms=None)
            out.append(s)
            continue
        st, js, txt, ms = call(BASE + '/api/x/f/chaos', {'scenario': sid}, {'authorization': 'Bearer ' + tok}, timeout=180)
        if st == 200 and js and 'pass' in js:
            o = js.get('observed') or {}
            if o.get('report'):
                obs = 'report returned' + (', with consensus block' if o.get('consensus_block') else ', single reader (no consensus block)') + ', title type ' + str(o.get('title_type')) + ', attention ' + str(o.get('attention')) + (', hidden instructions detected' if o.get('ai_manipulation') else '')
            else:
                obs = 'no report; error raised: ' + str(o.get('error'))
            obs += ' (' + str(js.get('forced_failures_served')) + ' forced failure(s) served)'
            s.update(pass_=bool(js['pass']), expected=pub(js.get('expected')), observed_text=pub(obs), ms=js.get('ms'), wall_ms=ms)
        elif st == 200 and js and js.get('skipped'):
            s.update(pass_=None, expected='', observed_text=pub('skipped: ' + js['skipped']), ms=ms)
        else:
            s.update(pass_=False, expected='The drill endpoint answers and the scenario runs.', observed_text=pub('drill endpoint answered HTTP %s: %s' % (st, txt[:160])), ms=ms)
        out.append(s)
    return out


def analyze(url):
    return call(BASE + '/api/kb/analyze', {'url': url}, {'origin': 'https://kolaboro.com'}, timeout=150)


def source_scenarios():
    out = []
    rnd = ''.join(random.choice(string.ascii_lowercase) for _ in range(8))
    # 1. dead domain
    st, js, txt, ms = analyze('https://kolaboro-drill-%s.invalid/' % rnd)
    ok = st == 422 and js and js.get('error') == 'fetch' and ms < 15000
    out.append({'id': 'dead_domain', 'title': 'Source website gone (domain does not resolve)', 'kind': 'source', 'forced': 'URL on a .invalid domain',
                'expected': 'Clean error {"error":"fetch"} with HTTP 422 in under 15 s, no automated reading, nothing invented.',
                'observed_text': 'HTTP %s %s' % (st, txt[:120]), 'ms': ms, 'pass_': bool(ok)})
    # 2. page removed
    pre, _, _, _ = call('https://httpbin.org/status/410', timeout=20)
    if pre != 410:
        out.append({'id': 'page_gone', 'title': 'Source page removed (HTTP 410)', 'kind': 'source', 'forced': 'httpbin.org/status/410', 'expected': '', 'observed_text': 'skipped: test server httpbin.org unavailable (%s)' % pre, 'ms': None, 'pass_': None})
    else:
        st, js, txt, ms = analyze('https://httpbin.org/status/410')
        ok = st == 422 and js and js.get('error') == 'fetch' and js.get('status') == 410 and ms < 15000
        out.append({'id': 'page_gone', 'title': 'Source page removed (HTTP 410)', 'kind': 'source', 'forced': 'httpbin.org/status/410',
                    'expected': 'Clean error {"error":"fetch","status":410} with HTTP 422 in under 15 s.', 'observed_text': 'HTTP %s %s' % (st, txt[:120]), 'ms': ms, 'pass_': bool(ok)})
    # 3. host that never answers (WebPageTest's public TCP blackhole)
    st, js, txt, ms = analyze('https://blackhole.webpagetest.org/')
    ok = st in (422, 504) and js and js.get('error') and ms < 35000
    out.append({'id': 'unreachable_host', 'title': 'Source server never answers (timeout path)', 'kind': 'source', 'forced': 'blackhole.webpagetest.org drops every packet',
                'expected': 'The request gives up and answers a clean error in under 35 s.', 'observed_text': 'HTTP %s %s' % (st, txt[:120]), 'ms': ms, 'pass_': bool(ok)})
    # 4. slow page: the server waits 10 s before the first byte
    pre, _, _, pms = call('https://postman-echo.com/delay/1', timeout=20)
    if pre != 200:
        out.append({'id': 'slow_page', 'title': 'Source page answers slowly (10 s before the first byte)', 'kind': 'source', 'forced': 'postman-echo.com/delay/10', 'expected': '', 'observed_text': 'skipped: test server postman-echo.com unavailable (%s)' % pre, 'ms': None, 'pass_': None})
    else:
        st, js, txt, ms = analyze('https://postman-echo.com/delay/10?r=' + rnd)
        ok = 9000 <= ms < 30000 and st in (200, 422) and js is not None
        out.append({'id': 'slow_page', 'title': 'Source page answers slowly (10 s before the first byte)', 'kind': 'source', 'forced': 'postman-echo.com/delay/10 waits 10 s, then sends a short non-property answer',
                    'expected': 'The desk review waits for the page, then gives a clean answer (here "empty": not enough text to review) in under 30 s, no 5xx.', 'observed_text': 'HTTP %s %s after %.1f s' % (st, txt[:120], ms / 1000), 'ms': ms, 'pass_': bool(ok)})
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    prev = {}
    try:
        st, prev, _, _ = call(BASE + '/data/chaos.json?t=%d' % time.time(), timeout=20)
        prev = prev if st == 200 and isinstance(prev, dict) else {}
    except Exception:
        prev = {}
    t0 = time.time()
    tok = None
    try:
        tok = oidc()
    except Exception as e:
        print('no oidc', e)
    sc = ai_scenarios(tok) + source_scenarios()
    for s in sc:
        s['pass'] = s.pop('pass_')
    ran = [s for s in sc if s['pass'] is not None]
    run = {'at': datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z', 'seconds': int(time.time() - t0), 'ran': len(ran), 'passed': sum(1 for s in ran if s['pass']), 'scenarios': sc}
    runs = [run] + [r for r in (prev.get('runs') or []) if isinstance(r, dict) and r.get('at')][:KEEP - 1]
    for r in runs[1:]:   # earlier runs keep their results; their text is published in today's wording
        for x in r.get('scenarios') or []:
            for k in ('title', 'forced', 'expected', 'observed_text'):
                if isinstance(x.get(k), str):
                    x[k] = pub(x[k])
            if x.get('kind') == 'ai':
                x['kind'] = 'reader'
    out = {'updated': run['at'], 'target': BASE, 'schedule': 'weekly, Wednesday 05:11 UTC',
           'not_covered': [
               'database (Supabase) down or slow: needs a fault switch inside rpc() in kolaboro.js',
               'daily spending breaker of the automated reading tripping: needs a test switch',
               'source page that trickles its body for minutes: fetchPage() now has a 15 s deadline covering the body, but no public test server that trickles to Cloudflare was found to drill it',
               'Cloudflare edge or static assets failing: outside our control, covered by the outside uptime probe',
               'OpenTimestamps calendars down during evidence stamping'],
           'runs': runs}
    json.dump(out, open(os.path.join(OUT, 'chaos.json'), 'w'), indent=1)
    print(json.dumps(run, indent=1))


main()
