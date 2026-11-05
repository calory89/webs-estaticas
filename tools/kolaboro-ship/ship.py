#!/usr/bin/env python3
"""Kolaboro shipping log: builds kolaboro.com/data/shipping.json, /data/roadmap-sync.json, /shipping/feed.xml, /shipping/feed.json
and automatic day pages /changelog/<date>/ from the git history of branch pub/_lovable.

Source of truth: commits on pub/_lovable that change _s/kolaboro.com/ or the kolaboro worker modules (_worker.js/kolaboro.js,
_worker.js/kbx*). A commit by a person (or by Claude working for a person) is a "ship". Commits made by our own workflows
(authors with an @kolaboro.com address: research agent, deploy guard records, QA, ...) are counted as "data updates". Commits by
the deploy guard whose subject starts with "kolaboro deploy guard: roll back" are counted as automatic rollbacks.
Days are UTC calendar days of the commit (committer) time.

Commit subjects become public, so every subject passes privacy_filter() first: URLs, email addresses, @handles, any domain
other than kolaboro.com, names and developers of tracked projects (from the private project lists) and people's names are
removed. The AI summary is written only from filtered subjects and is then checked in code (see check_ai()).

Usage: ship.py --git <git dir with pub/_lovable history> --ref <ref> --main <main checkout> --out <dir>
Env: ANTHROPIC_API_KEY (optional; without it the deterministic summary is used), GITHUB_TOKEN + GITHUB_REPOSITORY (metrics).
Writes <out>/files.txt: one repo path per line, each file at <out>/<repo path>.
"""
import argparse, datetime as dt, hashlib, html, json, os, re, statistics, subprocess, sys, time, urllib.error, urllib.request

SITE = '_s/kolaboro.com'
PATHS = [SITE + '/', '_worker.js/kolaboro.js', '_worker.js/kbx*']
ORIGIN = 'https://kolaboro.com'
MODEL = os.environ.get('KB_SHIP_MODEL', 'claude-sonnet-5-5')
PRICE_IN, PRICE_OUT = 3.0 / 1e6, 15.0 / 1e6        # conservative USD per token, used as a spending guard and for the spend log
MAX_USD_RUN = 1.0                                   # per run
MAX_AI_DAYS_RUN = 25
AUTO_META = '<meta name="kb-changelog-auto" content="written automatically from the day\'s commits, checked by code">'
AUTO_MARK = 'name="kb-changelog-auto"'
# People named in a few early commit subjects (all are already public on /about). Removed anyway: subjects are not the place.
PEOPLE = ['Carlos de Ory', 'Lisa Mikolajewicz', 'Ignacio Hojas', 'calory89']
FILE_EXT = 'js|mjs|cjs|json|jsonl|html|htm|css|py|md|yml|yaml|svg|png|jpg|jpeg|webp|xml|txt|csv|parquet|sql|ts|go|wasm|woff2|woff|pdf|sh|toml|ics|gz|zip|map|ndjson'
NUM_WORDS = {'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6', 'seven': '7', 'eight': '8',
             'nine': '9', 'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13', 'fourteen': '14', 'fifteen': '15',
             'twenty': '20', 'thirty': '30', 'forty': '40', 'fifty': '50', 'hundred': '100', 'thousand': '1000', 'dozen': '12'}
CHECK_V = 2
# Pages deployment is at its 20,000-file limit (5 Nov 2026): no new files on pub/_lovable until the lead lifts this. Existing files may be updated.
ALLOW_NEW_FILES = os.environ.get('KB_SHIP_NEW_FILES') == '1'   # bump to re-try summaries rejected under an older check
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

GIT = None


def git(*a, check=True):
    r = subprocess.run(['git', '--git-dir', GIT] + list(a), capture_output=True, text=True)
    if check and r.returncode: raise RuntimeError('git %s: %s' % (a[0], r.stderr.strip()[:300]))
    return r.stdout


def show(ref, path):
    r = subprocess.run(['git', '--git-dir', GIT, 'show', '%s:%s' % (ref, path)], capture_output=True)
    return r.stdout.decode('utf-8', 'replace') if r.returncode == 0 else None


def now_utc(): return dt.datetime.now(dt.timezone.utc)
def iso(t): return t.strftime('%Y-%m-%dT%H:%M:%SZ')
def pdate(s): return dt.date.fromisoformat(s)
def human_date(d): d = pdate(d) if isinstance(d, str) else d; return '%d %s %d' % (d.day, MONTHS[d.month - 1], d.year)


# ---------------------------------------------------------------- privacy filter
def load_private_names(main):
    names = set()
    for f in ['tools/kolaboro-agent/projects.json', 'tools/kolaboro-agent/projects-world.json']:
        try: d = json.load(open(os.path.join(main, f)))
        except Exception as e: print('note: %s not read (%s)' % (f, e)); continue
        items = d.get('projects', d) if isinstance(d, dict) else d
        if isinstance(items, dict): items = list(items.values())
        for p in items:
            if not isinstance(p, dict): continue
            for k in ('name', 'developer', 'slug'):
                v = str(p.get(k) or '').strip()
                if k == 'slug': v = v.replace('-', ' ')
                if len(v) >= 4: names.add(v)
    common = {'the', 'villa', 'villas', 'residence', 'residences', 'tower', 'towers', 'project', 'projects', 'bali', 'dubai', 'phuket',
              'lombok', 'resort', 'homes', 'apartments', 'condo', 'estate', 'group', 'developer', 'development', 'properties'}
    out = sorted({n for n in names if n.lower() not in common and not n.isdigit()}, key=len, reverse=True)
    return out


class Privacy:
    def __init__(self, names):
        self.names = names
        # Multi-word names match in any case; one-word names (often ordinary words such as "Elements") only when capitalised as written.
        self.rx_names = [re.compile(r'(?<![A-Za-z0-9])' + re.escape(n) + r'(?![A-Za-z0-9])', re.I if (' ' in n.strip() or n in PEOPLE) else 0) for n in names + PEOPLE]

    def filter(self, s):
        """Returns (clean subject, number of removals)."""
        n0 = s
        k = 0
        def sub(rx, rep, x, flags=0):
            nonlocal k
            y, c = re.subn(rx, rep, x, flags=flags); k += c; return y
        s = s.replace('—', ', ').replace('–', '-')
        s = sub(r'https?://\S+', '[link]', s)
        s = sub(r'[\w.+-]+@[\w-]+(\.[\w-]+)+', '[email]', s)
        s = sub(r'(?<![\w/])@[\w.-]+', '[email]', s)
        def dom(m):
            nonlocal k
            d = m.group(0)
            if d.lower() in ('kolaboro.com', 'www.kolaboro.com'): return d
            if re.search(r'\.(%s)$' % FILE_EXT, d, re.I): return d
            k += 1; return '[site]'
        s = re.sub(r'(?<![\w/.-])(?:[a-z0-9][a-z0-9-]*\.)+[a-z]{2,}(?![\w-])', dom, s, flags=re.I)
        for rx in self.rx_names:
            s, c = rx.subn('[name]', s); k += c
        s = re.sub(r'(?i)\b(co-?founders?|founders?)\s*\(\s*\[name\](\s*,\s*\[name\])*\s*\)', r'\1', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s, k


def tidy(s):
    s = re.sub(r'^(kolaboro(\.com)?)( round \d+)?\s*:\s*', '', s, flags=re.I).strip()
    return s[:1].upper() + s[1:] if s else s


# ---------------------------------------------------------------- commits
def is_auto(name, email):
    e = (email or '').lower(); n = (name or '').lower()
    return e.endswith('@kolaboro.com') or 'github-actions' in e or '[bot]' in n or n.startswith('kolaboro')


def read_commits(ref):
    out = git('log', ref, '--format=%x1e%H%x1f%cI%x1f%an%x1f%ae%x1f%s', '--', *PATHS)
    cs = []
    for rec in out.split('\x1e'):
        rec = rec.strip()
        if not rec: continue
        h, ci, an, ae, subj = rec.split('\x1f', 4)
        t = dt.datetime.fromisoformat(ci).astimezone(dt.timezone.utc)
        kind = 'ship'
        if is_auto(an, ae): kind = 'rollback' if subj.lower().startswith('kolaboro deploy guard: roll back') else 'data'
        cs.append({'id': h, 't': t, 'kind': kind, 'subject': subj})
    cs.sort(key=lambda c: c['t'])
    return cs


def first_site_day(ref):
    out = git('log', ref, '--reverse', '--format=%cI', '--', SITE + '/').split()
    return dt.datetime.fromisoformat(out[0]).astimezone(dt.timezone.utc).date() if out else None


def all_commit_times(ref):
    m = {}
    for line in git('log', ref, '--format=%H %cI').split('\n'):
        if line.strip():
            h, ci = line.split(' ', 1); m[h] = dt.datetime.fromisoformat(ci).astimezone(dt.timezone.utc)
    return m


# ---------------------------------------------------------------- numbers and summary checks
def numbers(text):
    t = text.lower()
    found = set()
    for m in re.finditer(r'\d+(?:[.,]\d+)*', t):
        x = m.group(0)
        if re.fullmatch(r'\d{1,3}(,\d{3})+', x): x = x.replace(',', '')
        x = x.replace(',', '.')
        found.add(x.rstrip('0').rstrip('.') if '.' in x else x)
    for w, v in NUM_WORDS.items():
        if re.search(r'\b' + w + r's?\b', t): found.add(v)
    return found


def deterministic(day_commits, so_far=False):
    """3 to 6 lines from the day's own filtered subjects, longest (most descriptive) first, each mapped to its commit."""
    pool = sorted(day_commits, key=lambda c: (len(c['s']) > 170, -len(c['s']), c['t']))
    lines = []
    seen = set()
    for c in pool:
        txt = c['s']
        if not txt or txt.lower() in seen or txt.lower().startswith('merge'): continue
        seen.add(txt.lower())
        if len(txt) > 170: txt = txt[:170].rsplit(' ', 1)[0].rstrip(',;:') + ' (shortened)'
        lines.append({'text': txt, 'commits': [c['id'][:12]]})
        if len(lines) >= 6: break
    return {'lines': lines, 'method': 'so-far' if so_far else 'deterministic'}


def check_ai(lines, day_commits, privacy):
    """Every line must cite at least one commit of the day, every number in it must appear in the cited commits' subjects,
    and the privacy filter must find nothing to remove. Returns (ok, reasons, checked lines)."""
    by_id = {c['id'][:12]: c for c in day_commits}
    n = len(day_commits)
    lo = min(3, n)
    reasons = []
    if not isinstance(lines, list) or not (lo <= len(lines) <= 6): return False, ['expected %d to 6 lines, got %s' % (lo, len(lines) if isinstance(lines, list) else 'none')], []
    out = []
    for i, ln in enumerate(lines):
        if not isinstance(ln, dict): return False, ['line %d is not an object' % (i + 1)], []
        txt = str(ln.get('text') or '').strip()
        ids = [str(x)[:12] for x in (ln.get('commits') or []) if str(x)[:12] in by_id]
        if not ids: reasons.append('line %d cites no commit of the day' % (i + 1)); continue
        if not (12 <= len(txt) <= 240): reasons.append('line %d has length %d' % (i + 1, len(txt))); continue
        if '—' in txt or '–' in txt: reasons.append('line %d has a long dash' % (i + 1)); continue
        clean, k = privacy.filter(txt)
        if k or '[' in txt: reasons.append('line %d failed the privacy filter' % (i + 1)); continue
        allowed = set()
        for x in ids: allowed |= numbers(by_id[x]['s'])
        extra = sorted(numbers(txt) - allowed)
        if extra: reasons.append('line %d has numbers not in its commits: %s' % (i + 1, ', '.join(extra[:5]))); continue
        out.append({'text': txt, 'commits': ids})
    if reasons: return False, reasons, []
    return True, ['%d lines, each mapped to %s commit(s) of the day; numbers and privacy checked' % (len(out), '/'.join(str(len(l['commits'])) for l in out))], out


AI = {'calls': 0, 'in': 0, 'out': 0}


def ai_summary(date, day_commits, key):
    if AI['in'] * PRICE_IN + AI['out'] * PRICE_OUT > MAX_USD_RUN: raise RuntimeError('run spend cap reached')
    listing = '\n'.join('%s  %s' % (c['id'][:12], c['s']) for c in day_commits[:260])
    lo = min(3, len(day_commits))
    prompt = (
        'These are the commit subjects of one day (%s, UTC) of work on kolaboro.com, a website that helps people check off-plan '
        'property projects abroad before they pay. Write %d to 6 short lines that a property buyer with no technical background '
        'can understand, saying what changed for them that day. Rules:\n'
        '- plain English, at most 25 words per line, one idea per line, most useful for buyers first;\n'
        '- every line cites the ids of the commits it is based on (at least one, ids exactly as given);\n'
        '- use only numbers that appear in the subjects of the commits you cite, written as digits; if unsure, leave the number out;\n'
        '- no names of projects, developers, companies or people, no web addresses, no email addresses, no square brackets;\n'
        '- no long dashes; no marketing words; do not invent anything that is not in the subjects;\n'
        '- do not use double quotes inside a line (use single quotes), so the JSON stays valid.\n'
        'Answer with JSON only: {"lines":[{"text":"...","commits":["<id>"]}]}\n\nCommits:\n%s' % (date, lo, listing))
    body = json.dumps({'model': MODEL, 'max_tokens': 1200, 'messages': [{'role': 'user', 'content': prompt}]}).encode()
    req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
        'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r: d = json.loads(r.read())
    AI['calls'] += 1
    u = d.get('usage', {}); AI['in'] += u.get('input_tokens', 0); AI['out'] += u.get('output_tokens', 0)
    text = ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text')
    m = re.search(r'\{.*\}', text, re.S)
    if not m: raise ValueError('no JSON in the answer')
    return json.loads(m.group(0)).get('lines'), d.get('model', MODEL)


# ---------------------------------------------------------------- GitHub Actions metrics
def gh(path):
    tok = os.environ.get('GITHUB_TOKEN'); repo = os.environ.get('GITHUB_REPOSITORY', 'calory89/webs-estaticas')
    if not tok: return None
    req = urllib.request.Request('https://api.github.com/repos/%s/%s' % (repo, path), headers={
        'authorization': 'Bearer ' + tok, 'accept': 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', 'user-agent': 'kolaboro-ship'})
    for i in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r: return json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 502, 503) and i < 2: time.sleep(5 * (i + 1)); continue
            print('github api %s: HTTP %s' % (path[:80], e.code)); return None
        except Exception as e:
            print('github api %s: %s' % (path[:80], e)); return None


def parse_workflows(main):
    wf = []
    d = os.path.join(main, '.github', 'workflows')
    for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        if not f.startswith('kolaboro-') or not f.endswith(('.yml', '.yaml')): continue
        s = open(os.path.join(d, f), encoding='utf-8', errors='replace').read()
        m = re.search(r'^name:\s*(.+)$', s, re.M)
        wf.append({'file': f, 'name': (m.group(1).strip().strip('"\'') if m else f), 'crons': re.findall(r"cron:\s*['\"]([^'\"]+)['\"]", s),
                   'push': bool(re.search(r'^\s*push:', s, re.M)), 'manual': 'workflow_dispatch' in s})
    return wf


def runs_per_day(days):
    """Kolaboro workflow runs per UTC day (GitHub Actions API, one query per day)."""
    out = {}
    for d in days:
        tot = {'runs': 0, 'success': 0, 'failure': 0, 'cancelled': 0, 'other': 0, 'by_event': {}}
        page = 1; ok = True
        while page <= 12:
            r = gh('actions/runs?per_page=100&page=%d&created=%s' % (page, d))
            if r is None: ok = False; break
            runs = r.get('workflow_runs') or []
            for x in runs:
                if not str(x.get('name', '')).startswith('Kolaboro'): continue
                tot['runs'] += 1
                c = x.get('conclusion') or 'other'
                tot[c if c in ('success', 'failure', 'cancelled') else 'other'] += 1
                ev = x.get('event') or '?'; tot['by_event'][ev] = tot['by_event'].get(ev, 0) + 1
            if len(runs) < 100: break
            page += 1
        if ok: out[d] = tot
    return out


def job_status(wfs):
    res = []
    for w in wfs:
        r = gh('actions/workflows/%s/runs?per_page=1' % w['file'])
        x = ((r or {}).get('workflow_runs') or [None])[0]
        res.append({'name': w['name'], 'file': w['file'], 'schedule_utc': w['crons'], 'on_push': w['push'],
                    'last_run_at': x.get('created_at') if x else None, 'last_event': x.get('event') if x else None,
                    'last_status': x.get('status') if x else None, 'last_result': (x.get('conclusion') or x.get('status')) if x else None})
    return res


def http_get(url, timeout=25):
    req = urllib.request.Request(url, headers={'user-agent': 'kolaboro-ship (roadmap check)', 'cache-control': 'no-cache'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, r.read(3_000_000).decode('utf-8', 'replace'), r.geturl()
    except urllib.error.HTTPError as e: return e.code, '', url
    except Exception as e: return 0, str(e)[:120], url


# ---------------------------------------------------------------- roadmap sync
def roadmap_sync(ref):
    s = show(ref, SITE + '/roadmap/index.html') or ''
    items = []
    for m in re.finditer(r'<li class="rm-i st-(\w+)"([^>]*)><span class="rm-n">(\d+)</span><div><b>(.*?)</b>', s):
        attrs = m.group(2)
        live = re.search(r'data-live="([^"]+)"', attrs); mark = re.search(r'data-mark="([^"]+)"', attrs)
        if not live: continue
        path = html.unescape(live.group(1)); mk = html.unescape(mark.group(1)) if mark else ''
        if not path.startswith('/'): continue
        code, body, final = http_get(ORIGIN + path.split('#')[0])
        canon = 'rel="canonical"' in body and ('href="%s%s"' % (ORIGIN, path.split('#')[0]) in body or 'href="%s%s/"' % (ORIGIN, path.split('#')[0].rstrip('/')) in body)
        found = bool(mk) and mk.lower() in body.lower()
        items.append({'n': int(m.group(3)), 'title': html.unescape(m.group(4)), 'status_on_page': m.group(1), 'page': path, 'marker': mk,
                      'http': code, 'marker_found': found, 'canonical_matches': canon, 'shipped': code == 200 and found and canon,
                      'checked_at': iso(now_utc())})
        time.sleep(0.3)
    return {'about': 'Roadmap items that link to the live page delivering them (data-live and data-mark attributes on /roadmap/). '
                     'Each night GitHub Actions fetches the page: an item counts as shipped only when the page answers HTTP 200, its '
                     'canonical link is that page, and its HTML contains the marker text (case-insensitive). The roadmap page reads this file.',
            'marker_rule': 'HTTP 200 + canonical link equals the linked page + page HTML contains data-mark',
            'generated_at': iso(now_utc()), 'items': items,
            'linked': len(items), 'verified_live': sum(1 for i in items if i['shipped'])}


# ---------------------------------------------------------------- day pages
def esc(s): return html.escape(str(s), quote=True)


def day_page(template, day, prev_page, next_page):
    d = day['date']; hd = human_date(d)
    n = day['ships']
    title = 'What we shipped on %s | Kolaboro' % hd
    desc = '%d change%s shipped on %s, summarised from the day\'s commits and checked by code.' % (n, '' if n == 1 else 's', hd)
    h = template
    h = re.sub(r'<title>.*?</title>', '<title>%s</title>' % esc(title), h, count=1, flags=re.S)
    for prop in ('description', 'og:description'):
        h = re.sub(r'(<meta (?:name|property)="%s" content=")[^"]*(")' % re.escape(prop), lambda m: m.group(1) + esc(desc) + m.group(2), h, count=1)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*(")', lambda m: m.group(1) + esc(title) + m.group(2), h, count=1)
    url = '%s/changelog/%s/' % (ORIGIN, d)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), h, count=1)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*(")', lambda m: m.group(1) + url + m.group(2), h, count=1)
    h = re.sub(r'<meta name="kb-changelog-auto"[^>]*>\s*', '', h)
    h = h.replace('</title>', '</title>\n' + AUTO_META, 1)
    sm = day['summary']
    li = []
    for ln in sm['lines']:
        ids = ', '.join('<code>%s</code>' % esc(x) for x in ln['commits'])
        li.append('<li>%s <span class="muted" style="font-size:.82rem">(from commit %s)</span></li>' % (esc(ln['text']), ids))
    meth = ('Written by Claude (%s) from the day\'s commit subjects, then checked by code: every line maps to at least one commit of the day, '
            'and contains no number that is not in those commits.' % esc(sm.get('model') or MODEL)) if sm['method'] == 'ai-checked' else \
           ('Taken directly from the day\'s commit subjects (the most descriptive ones), shortened where needed.%s' % (
               ' An AI summary was tried and rejected by the code check: %s.' % esc(sm.get('fallback_reason')) if sm.get('fallback_reason') else ''))
    commits = ''.join('<li><code>%s</code> <span class="muted">%s UTC</span> %s</li>' % (esc(c['id']), esc(c['time']), esc(c['s'])) for c in day['commits'])
    du = day.get('data_updates', 0)
    nav = []
    if prev_page: nav.append('The day before: <a href="%s">%s</a>.' % (prev_page[1], esc(human_date(prev_page[0]))))
    if next_page: nav.append('The day after: <a href="%s">%s</a>.' % (next_page[1], esc(human_date(next_page[0]))))
    main = (
        '<main id="main">\n<section class="phero"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / <a href="/changelog">Changelog</a> / %s</p>'
        '<h1>What we shipped on %s</h1><p class="lead">%d change%s shipped on %s (UTC), counted from the commits that reached the live site. '
        '%s</p><p style="display:inline-block;margin-top:12px;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.03em;border-radius:6px;padding:3px 8px;background:#F2EFE6;color:#5A4A12">Written automatically from the day\'s commits, checked by code</p></div></section>\n'
        '<section class="sec"><div class="wrap d3">\n'
        '<div class="eg-k"><div><b>%d</b><span>changes shipped</span></div><div><b>%d</b><span>automatic data updates</span></div>'
        '<div><b>%d</b><span>automatic rollbacks</span></div><div><b>%d</b><span>summary lines</span></div></div>\n'
        '<h2 id="summary">In plain English</h2><p class="th">%s</p><ul class="it">%s</ul>\n'
        '<h2 id="commits">Every change of the day<small>%d</small></h2><p class="th">Commit subjects as written by the people who made the change, after a privacy filter '
        '(no project names, web addresses or emails). The full repository is private; the commit ids are shown so changes can be dated.</p><ul class="it">%s</ul>\n'
        '<p class="chk"><b>How this page is made:</b> a GitHub Actions job reads the git history of the live site every hour and writes this page once the day is over. '
        'It never replaces a day page written by a person. All days, streaks and engineering numbers: <a href="/shipping/#d-%s">the shipping log</a>. '
        'Feeds: <a href="/shipping/feed.xml">Atom</a>, <a href="/shipping/feed.json">JSON Feed</a>.</p>\n'
        '<p class="muted" style="font-size:.88rem;margin-top:16px">%s</p>\n</div></section>\n</main>') % (
        esc(hd), esc(hd), n, '' if n == 1 else 's', esc(hd),
        ('%d automatic data update%s ran too, counted separately.' % (du, '' if du == 1 else 's')) if du else '',
        n, du, day.get('rollbacks', 0), len(sm['lines']), meth, ''.join(li), n, commits, d, ' '.join(nav))
    a = h.find('<main'); b = h.find('</main>')
    if a < 0 or b < 0: raise RuntimeError('template has no <main>')
    return h[:a] + main + h[b + len('</main>'):]


# ---------------------------------------------------------------- feeds
def feeds(days):
    items = [d for d in reversed(days) if d['ships'] and d['summary']['lines']][:60]
    upd = iso(now_utc())
    def link(d): return ORIGIN + (d['page'] or '/shipping/#d-%s' % d['date'])
    def text(d):
        m = {'ai-checked': 'Summary written by AI from the day\'s commits and checked by code.', 'deterministic': 'Summary taken from the day\'s commit subjects.',
             'so-far': 'Day in progress: summary taken from the commit subjects so far.'}[d['summary']['method']]
        return '\n'.join('- ' + l['text'] for l in d['summary']['lines']) + '\n\n' + m
    def htm(d):
        return '<ul>%s</ul><p>%s</p>' % (''.join('<li>%s</li>' % esc(l['text']) for l in d['summary']['lines']), esc(text(d).split('\n\n')[-1]))
    jf = {'version': 'https://jsonfeed.org/version/1.1', 'title': 'Kolaboro: what we shipped each day', 'home_page_url': ORIGIN + '/shipping/',
          'feed_url': ORIGIN + '/shipping/feed.json', 'description': 'One item per UTC day with the changes shipped to kolaboro.com, from the git history of the live site.',
          'language': 'en', 'authors': [{'name': 'Kolaboro', 'url': ORIGIN}], 'items': []}
    at = ['<?xml version="1.0" encoding="utf-8"?>', '<feed xmlns="http://www.w3.org/2005/Atom">', '<title>Kolaboro: what we shipped each day</title>',
          '<link href="%s/shipping/feed.xml" rel="self"/>' % ORIGIN, '<link href="%s/shipping/"/>' % ORIGIN, '<id>%s/shipping/</id>' % ORIGIN,
          '<updated>%s</updated>' % upd, '<author><name>Kolaboro</name></author>']
    for d in items:
        title = '%s: %d change%s shipped%s' % (human_date(d['date']), d['ships'], '' if d['ships'] == 1 else 's', ' so far' if d['summary']['method'] == 'so-far' else '')
        t = d.get('last_commit') or (d['date'] + 'T23:59:59Z')
        jf['items'].append({'id': '%s/shipping/#d-%s' % (ORIGIN, d['date']), 'url': link(d), 'title': title, 'content_text': text(d), 'content_html': htm(d),
                            'date_published': d['date'] + 'T00:00:00Z', 'date_modified': t, '_kolaboro': {'ships': d['ships'], 'data_updates': d['data_updates'], 'method': d['summary']['method']}})
        at += ['<entry>', '<title>%s</title>' % esc(title), '<link href="%s"/>' % esc(link(d)), '<id>%s/shipping/#d-%s</id>' % (ORIGIN, d['date']),
               '<published>%sT00:00:00Z</published>' % d['date'], '<updated>%s</updated>' % t, '<content type="html">%s</content>' % esc(htm(d)), '</entry>']
    at.append('</feed>')
    return '\n'.join(at) + '\n', json.dumps(jf, ensure_ascii=False, indent=1) + '\n'


# ---------------------------------------------------------------- main
def main():
    global GIT
    ap = argparse.ArgumentParser()
    ap.add_argument('--git', required=True); ap.add_argument('--ref', default='pub/_lovable'); ap.add_argument('--main', required=True)
    ap.add_argument('--out', required=True); ap.add_argument('--today'); ap.add_argument('--no-ai', action='store_true'); ap.add_argument('--no-net', action='store_true')
    a = ap.parse_args()
    GIT = a.git; ref = a.ref
    today = pdate(a.today) if a.today else now_utc().date()
    privacy = Privacy(load_private_names(a.main))
    print('privacy filter: %d project and developer names loaded' % len(privacy.names))
    prev = {}
    try: prev = json.loads(show(ref, SITE + '/data/shipping.json') or '{}')
    except Exception: prev = {}
    prev_days = {d['date']: d for d in prev.get('days', [])}
    ai_log = prev.get('ai') or {'calls_total': 0, 'input_tokens_total': 0, 'output_tokens_total': 0, 'usd_estimate_total': 0.0}

    first = first_site_day(ref)
    commits = read_commits(ref)
    times = all_commit_times(ref)
    days = {}
    for c in commits:
        d = c['t'].date().isoformat()
        if pdate(d) < first or pdate(d) > today: continue
        x = days.setdefault(d, {'date': d, 'ships': 0, 'data_updates': 0, 'rollbacks': 0, 'commits': [], 'data_kinds': {}, 'redactions': 0})
        if c['kind'] == 'ship':
            s, k = privacy.filter(c['subject']); s = tidy(s)
            x['ships'] += 1; x['redactions'] += k
            x['commits'].append({'id': c['id'][:12], 'time': c['t'].strftime('%H:%M'), 's': s, 't': c['t']})
        elif c['kind'] == 'rollback':
            x['rollbacks'] += 1
        else:
            x['data_updates'] += 1
            kind = re.sub(r'\s*\d{4}-\d{2}-\d{2}.*$', '', re.sub(r'^kolaboro\.com:\s*', '', c['subject'])).strip()[:60] or 'data'
            kind, _ = privacy.filter(kind)
            x['data_kinds'][kind] = x['data_kinds'].get(kind, 0) + 1
        x['last_commit'] = iso(c['t'])

    key = None if a.no_ai else os.environ.get('ANTHROPIC_API_KEY')
    ai_days = 0
    pages_existing = set()
    for line in git('ls-tree', '--name-only', ref, SITE + '/changelog/').split('\n'):
        m = re.search(r'changelog/(\d{4}-\d{2}-\d{2})$', line.strip())
        if m: pages_existing.add(m.group(1))
    human_pages = set(); auto_pages = set()
    for d in pages_existing:
        h = show(ref, '%s/changelog/%s/index.html' % (SITE, d))
        if h is None: continue
        (auto_pages if AUTO_MARK in h else human_pages).add(d)

    for d in sorted(days):
        x = days[d]
        x['commits'].sort(key=lambda c: c['t'])
        if not x['ships']: x['summary'] = {'lines': [], 'method': 'none'}; continue
        digest = hashlib.sha256(' '.join(c['id'] + c['s'] for c in x['commits']).encode()).hexdigest()[:16]
        x['digest'] = digest
        complete = pdate(d) < today
        p = prev_days.get(d)
        if p and p.get('digest') == digest and p.get('summary', {}).get('method') in ('ai-checked',) and complete:
            x['summary'] = p['summary']; continue
        if p and p.get('digest') == digest and p.get('summary', {}).get('method') == 'deterministic' and p['summary'].get('fallback_reason') and p['summary'].get('v') == CHECK_V and complete:
            x['summary'] = p['summary']; continue      # AI already tried and rejected for exactly these commits: do not pay again
        if not complete:
            x['summary'] = deterministic(x['commits'], so_far=True); continue
        if key and ai_days < MAX_AI_DAYS_RUN:
            ai_days += 1
            try:
                try: lines, model = ai_summary(d, x['commits'], key)
                except (ValueError, json.JSONDecodeError): lines, model = ai_summary(d, x['commits'], key)   # one retry on an unreadable answer
                ok, reasons, checked = check_ai(lines, x['commits'], privacy)
                if ok:
                    x['summary'] = {'lines': checked, 'method': 'ai-checked', 'model': model, 'checks': reasons, 'written_at': iso(now_utc())}
                else:
                    x['summary'] = deterministic(x['commits']); x['summary']['fallback_reason'] = '; '.join(reasons)[:300]; x['summary']['v'] = CHECK_V
                    x['summary']['rejected_ai'] = lines if isinstance(lines, list) else None
                print('%s: %s %s' % (d, x['summary']['method'], '' if ok else reasons))
            except Exception as e:
                print('%s: AI not used (%s)' % (d, str(e)[:160]))
                x['summary'] = deterministic(x['commits'])
                if isinstance(e, (ValueError, json.JSONDecodeError)): x['summary'].update(fallback_reason='the AI answer could not be read twice', v=CHECK_V)
        else:
            x['summary'] = deterministic(x['commits'])

    # streaks over the full calendar
    cal = []
    t = first
    while t <= today: cal.append(t.isoformat()); t += dt.timedelta(days=1)
    ships_by = {d: days.get(d, {}).get('ships', 0) for d in cal}
    longest = (0, None, None); run = 0; run_from = None
    for d in cal:
        if ships_by[d]: run += 1; run_from = run_from or d
        else: run = 0; run_from = None
        if run > longest[0]: longest = (run, run_from, d)
    cur = 0; cur_from = None
    i = len(cal) - 1
    counts_today = bool(ships_by.get(today.isoformat()))
    if not counts_today: i -= 1          # today without ships yet does not break the streak
    while i >= 0 and ships_by[cal[i]]: cur += 1; cur_from = cal[i]; i -= 1

    # day pages (completed days only), never over a human page
    out_files = {}
    tpl_day = max(human_pages) if human_pages else None
    template = show(ref, '%s/changelog/%s/index.html' % (SITE, tpl_day)) if tpl_day else None
    for d in days.values():
        d['page'] = None; d['page_by'] = None
        if d['date'] in human_pages: d['page'] = '/changelog/%s/' % d['date']; d['page_by'] = 'human'
        elif d['ships'] and (pdate(d['date']) < today) and template and (ALLOW_NEW_FILES or d['date'] in auto_pages):
            d['page'] = '/changelog/%s/' % d['date']; d['page_by'] = 'auto'
    pages = sorted((d['date'], d['page']) for d in days.values() if d['page'])
    for i2, (dd, pg) in enumerate(pages):
        d = days[dd]
        if d['page_by'] != 'auto': continue
        prv = pages[i2 - 1] if i2 > 0 else None; nxt = pages[i2 + 1] if i2 + 1 < len(pages) else None
        h = day_page(template, d, prv, nxt)
        path = '%s/changelog/%s/index.html' % (SITE, dd)
        if show(ref, path) != h: out_files[path] = h

    # engineering metrics
    metrics = {}
    dep = {}
    try: dep = json.loads(show(ref, SITE + '/data/deploys.json') or '{}')
    except Exception: dep = {}
    per = {}; lat = []; rb = 0; rbf = 0
    for e in dep.get('deploys', []):
        dd = str(e.get('at', ''))[:10]
        if not dd: continue
        y = per.setdefault(dd, {'checked_live': 0, 'pass': 0, 'failed': 0, 'rolled_back': 0, 'rollback_failed': 0, 'not_deployed': 0, 'smoke_checks_run': 0})
        r = e.get('result')
        if r in y: y[r] += 1
        if r != 'not_deployed': y['checked_live'] += 1
        y['smoke_checks_run'] += int(e.get('checks_total') or 0) + int((e.get('after_rollback') or {}).get('checks_total') or 0)
        if r == 'rolled_back': rb += 1
        if r == 'rollback_failed': rbf += 1
        if r == 'pass' and e.get('commit') in times:
            try:
                at = dt.datetime.fromisoformat(e['at'].replace('Z', '+00:00'))
                s = (at - times[e['commit']]).total_seconds()
                if 0 <= s < 6 * 3600: lat.append({'s': s, 'date': dd})
            except Exception: pass
    lat_s = sorted(x['s'] for x in lat)
    metrics['deploys'] = {'per_day': per, 'source': '/data/deploys.json, written by the deploy guard (GitHub Actions) after each code push to the live branch',
                          'method': 'A deploy counts when the guard saw the pushed commit answer on kolaboro.com/api/open/build and ran its smoke checks. '
                                    '"Not deployed" means the commit was not live within 12 minutes. Pushes that only change data are not guarded and not counted.',
                          'records': len(dep.get('deploys', [])), 'record_since': (dep.get('deploys') or [{}])[-1].get('at')}
    metrics['commit_to_live'] = {'median_s': round(statistics.median(lat_s)) if lat_s else None,
                                 'p90_s': round(lat_s[int(0.9 * (len(lat_s) - 1))]) if lat_s else None, 'samples': len(lat_s),
                                 'last_7_days_median_s': (lambda v: round(statistics.median(v)) if v else None)(sorted(x['s'] for x in lat if pdate(x['date']) > today - dt.timedelta(days=7))),
                                 'source': 'git commit time of the deployed commit (branch pub/_lovable) and the time the deploy guard recorded it live (/data/deploys.json)',
                                 'method': 'For every passing guarded deploy: recorded time minus commit time. An upper bound: the recorded time is taken after the smoke checks, which take about a minute.'}
    rollback_commits = sum(d['rollbacks'] for d in days.values())
    metrics['rollbacks'] = {'automatic_rollbacks': rb, 'rollbacks_that_failed': rbf, 'rollback_commits_in_git': rollback_commits,
                            'drills': len(dep.get('drills', [])), 'source': '/data/deploys.json (result rolled_back or rollback_failed) and deploy-guard commits starting "roll back" on the live branch',
                            'method': 'The deploy guard rolls back the files changed since the last passing commit when the smoke checks fail twice.'}
    wfs = parse_workflows(a.main)
    if not a.no_net:
        lookback = [x for x in cal if pdate(x) > today - dt.timedelta(days=21)]
        rpd = runs_per_day(lookback)
        metrics['workflow_runs'] = {'per_day': rpd, 'source': 'GitHub Actions API (/repos/.../actions/runs?created=<day>), workflows whose name starts with "Kolaboro"',
                                    'method': 'Every run of a kolaboro workflow (checks, data jobs, deploy guard, probes) created that UTC day, by result. '
                                              'Today counts runs so far. Kept for the last 21 days.', 'available': bool(rpd)}
        metrics['jobs'] = {'items': job_status(wfs), 'source': 'workflow files on branch main (.github/workflows/kolaboro-*.yml) and the GitHub Actions API (latest run of each)',
                           'method': 'Schedule as written in the workflow file (cron, UTC). Last result is the conclusion of the latest run, whatever started it.'}
        code, body, _ = http_get(ORIGIN + '/api/open/uptime')
        try: up = json.loads(body) if code == 200 else None
        except Exception: up = None
        metrics['uptime_snapshot'] = {'at': iso(now_utc()), 'data': {k: up.get(k) for k in ('uptime_7d', 'uptime_30d', 'probes_30d', 'median_ms_7d', 'p95_ms_7d')} if up else None,
                                      'source': ORIGIN + '/api/open/uptime (the figure on /status)', 'method': 'Probes of the home page and the API from outside Cloudflare; the shipping page reads the live value and falls back to this snapshot.'}
        rm = roadmap_sync(ref)
    else:
        rm = {'items': [], 'linked': 0, 'verified_live': 0}

    day_list = []
    for d in sorted(days):
        x = days[d]
        day_list.append({'date': d, 'ships': x['ships'], 'data_updates': x['data_updates'], 'rollbacks': x['rollbacks'], 'data_kinds': x['data_kinds'],
                         'page': x['page'], 'page_by': x['page_by'], 'digest': x.get('digest'), 'last_commit': x.get('last_commit'),
                         'redactions': x['redactions'], 'summary': x['summary'],
                         'commits': [{'id': c['id'], 'time': c['time'], 's': c['s']} for c in x['commits']]})
    if AI['calls']:
        ai_log = {'calls_total': ai_log.get('calls_total', 0) + AI['calls'], 'input_tokens_total': ai_log.get('input_tokens_total', 0) + AI['in'],
                  'output_tokens_total': ai_log.get('output_tokens_total', 0) + AI['out'],
                  'usd_estimate_total': round(ai_log.get('usd_estimate_total', 0) + AI['in'] * PRICE_IN + AI['out'] * PRICE_OUT, 4),
                  'last_run': {'at': iso(now_utc()), 'calls': AI['calls'], 'input_tokens': AI['in'], 'output_tokens': AI['out'], 'usd_estimate': round(AI['in'] * PRICE_IN + AI['out'] * PRICE_OUT, 4)}}
    ai_log['model'] = MODEL; ai_log['price_used'] = 'USD 3 per million input tokens, 15 per million output tokens (estimate)'
    total_ships = sum(x['ships'] for x in days.values())
    data = {
        'about': 'Kolaboro shipping log. Every UTC day since the first commit of kolaboro.com, from the git history of the live branch (pub/_lovable), '
                 'paths _s/kolaboro.com/ and the kolaboro worker modules. A ship is a commit made by a person (or by Claude working for one); commits by our '
                 'own workflows are counted separately as data updates. Commit subjects pass a privacy filter (no project names, web addresses or emails). '
                 'The full repository is private; commit ids are shown so changes can be dated. Built by GitHub Actions every hour; AI summaries are written '
                 'once a day is over and checked by code.',
        'generated_at': iso(now_utc()), 'timezone': 'UTC', 'today': today.isoformat(), 'first_day': first.isoformat(),
        'totals': {'ships': total_ships, 'data_updates': sum(x['data_updates'] for x in days.values()), 'rollback_commits': rollback_commits,
                   'calendar_days': len(cal), 'days_with_ships': sum(1 for d in cal if ships_by[d]),
                   'ships_today': ships_by.get(today.isoformat(), 0), 'ships_last_7_days': sum(ships_by[d] for d in cal[-7:])},
        'streak': {'current': cur, 'current_from': cur_from, 'counts_today': counts_today, 'longest': longest[0], 'longest_from': longest[1], 'longest_to': longest[2],
                   'rule': 'Consecutive UTC days with at least one ship. A day with no ship yet today does not end the current streak until the day is over.'},
        'definitions': {'ship': 'A commit by a person (or Claude working for one) that changes files under _s/kolaboro.com/ or _worker.js/kolaboro.js / kbx*.js on the live branch.',
                        'data_update': 'A commit by one of our scheduled workflows (author address @kolaboro.com), for example research data or deploy-guard records.',
                        'rollback': 'A commit by the deploy guard restoring files after failed smoke checks.',
                        'summary_methods': {'ai-checked': 'written by Claude from the filtered subjects, every line mapped to commits and number-checked in code',
                                            'deterministic': 'the most descriptive commit subjects of the day', 'so-far': 'day in progress, commit subjects so far'}},
        'privacy_filter': 'URLs, email addresses, @handles, domains other than kolaboro.com, names and developers of tracked projects and people\'s names are replaced by [link], [email], [site] or [name].',
        'metrics': metrics, 'roadmap': {'linked': rm.get('linked', 0), 'verified_live': rm.get('verified_live', 0), 'file': '/data/roadmap-sync.json'},
        'ai': ai_log, 'days': day_list,
        'feeds': {'atom': '/shipping/feed.xml', 'json': '/shipping/feed.json', 'badge': '/api/x/ship/badge.svg'}}

    os.makedirs(a.out, exist_ok=True)
    # Publish only when something meaningful changed, or the last publish is more than 6 hours old (metrics refresh).
    def core(o):
        o = json.loads(json.dumps(o)); o.pop('generated_at', None); o.pop('metrics', None); o.pop('ai', None); return json.dumps(o, sort_keys=True)
    stale = True
    try: stale = (now_utc() - dt.datetime.fromisoformat(prev['generated_at'].replace('Z', '+00:00'))).total_seconds() > 6 * 3600
    except Exception: pass
    changed = core(data) != core(prev) if prev else True
    files = dict(out_files)
    if changed or stale or out_files:
        files[SITE + '/data/shipping.json'] = json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'
        fx, fj = feeds(day_list)
        files[SITE + '/shipping/feed.xml'] = fx; files[SITE + '/shipping/feed.json'] = fj
        if rm.get('items'): files[SITE + '/data/roadmap-sync.json'] = json.dumps(rm, ensure_ascii=False, indent=1) + '\n'
    if not ALLOW_NEW_FILES:
        for p in list(files):
            if subprocess.run(['git', '--git-dir', GIT, 'cat-file', '-e', '%s:%s' % (ref, p)], capture_output=True).returncode:
                print('new file not allowed (Pages file limit), kept out: %s' % p); files.pop(p)
    for p, body in files.items():
        f = os.path.join(a.out, p); os.makedirs(os.path.dirname(f), exist_ok=True)
        open(f, 'w', encoding='utf-8').write(body)
    open(os.path.join(a.out, 'files.txt'), 'w').write(''.join(p + '\n' for p in sorted(files)))
    print('ships %d over %d days, streak %d (longest %d), %d files to publish, AI calls %d (~%.3f USD), changed=%s stale=%s' % (
        total_ships, len(cal), cur, longest[0], len(files), AI['calls'], AI['in'] * PRICE_IN + AI['out'] * PRICE_OUT, changed, stale))
    for d in day_list[-3:]: print(d['date'], d['ships'], d['summary']['method'])
    return 0


if __name__ == '__main__':
    sys.exit(main())
