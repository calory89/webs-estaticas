#!/usr/bin/env python3
"""Kolaboro weekly market digest (/digest/) and change heatmap (/changes/). Block X6, 5 Nov 2026.

Built only from the public data files of kolaboro.com and their git history on branch pub/_lovable (read through the GitHub
API: one copy of each file per day, the last commit of that day). Nothing is estimated. Projects stay anonymous (ids only).

Outputs (in --out):
  data/digest.json            every week built so far (sections, counts, project ids, intro paragraph and its check)
  data/changes.json           market x kind counts with project ids, last 7 and 30 days
  digest/index.html           latest week;  digest/<yyyy-ww>/index.html  every week;  digest/feed.xml  RSS
  changes/index.html          the heatmap page
The intro paragraph may be drafted by claude-sonnet-5-5 from the counts; code checks that every number in it appears in the
counts (and no dashes, no number words, no loaded adjectives), else a template filled by code is used.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shell import esc, page  # noqa: E402

API = 'https://api.github.com'
K = '_s/kolaboro.com/data/'
SITE = 'https://kolaboro.com'
KINDS = [('new', 'New projects'), ('page', 'Page edits'), ('price', 'Price band moves'), ('date', 'Date moves'), ('register', 'Register status')]
KIND_HELP = {
    'new': 'project id first appears in the public file',
    'page': 'the SHA-256 fingerprint of the developer or listing page text changed',
    'price': 'the advertised price band changed',
    'date': 'the advertised completion year, the months the handover date moved, or the months overdue changed',
    'register': 'a register result appeared or changed, or the number of checks confirmed on an official register changed',
}
MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
SPEND = {'usd': 0.0}


# ---------------------------------------------------------------- GitHub history
class Hist:
    def __init__(self, repo, branch, token, cache):
        self.repo, self.branch, self.token, self.cache = repo, branch, token, cache
        os.makedirs(cache, exist_ok=True)
        self.calls = 0

    def _get(self, url, raw=False):
        h = {'User-Agent': 'kolaboro-digest', 'Accept': 'application/vnd.github.raw+json' if raw else 'application/vnd.github+json'}
        if self.token:
            h['Authorization'] = 'Bearer ' + self.token
        for i in range(4):
            try:
                self.calls += 1
                with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=120) as r:
                    return r.read()
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return None
                if i == 3:
                    raise
            except Exception:
                if i == 3:
                    raise
            time.sleep(3 * (i + 1))

    def commits(self, name, since):
        out, pg = [], 1
        while True:
            q = urllib.parse.urlencode({'sha': self.branch, 'path': K + name, 'since': since + 'T00:00:00Z', 'per_page': 100, 'page': pg})
            b = self._get('%s/repos/%s/commits?%s' % (API, self.repo, q))
            L = json.loads(b or b'[]')
            out += [(c['commit']['committer']['date'], c['sha']) for c in L]
            if len(L) < 100 or pg >= 10:
                break
            pg += 1
        return sorted(out)

    def content(self, name, sha):
        p = os.path.join(self.cache, name.replace('/', '_') + '.' + sha[:16] + '.json')
        if os.path.exists(p):
            return json.load(open(p))
        b = self._get('%s/repos/%s/contents/%s?ref=%s' % (API, self.repo, K + name, sha), raw=True)
        if b is None:
            return None
        open(p, 'wb').write(b)
        return json.loads(b)


def day_versions(commits, d0, d1):
    """{day: sha of the last commit at or before the end of that day} for every day d0..d1 (None before the first commit)."""
    out, i, cur = {}, 0, None
    d = d0
    while d <= d1:
        end = d.isoformat() + 'T23:59:59Z'
        while i < len(commits) and commits[i][0] <= end:
            cur = commits[i][1]
            i += 1
        out[d] = cur
        d += dt.timedelta(days=1)
    return out


# ---------------------------------------------------------------- diffs between two copies of bali-cases.json
def by_id(d):
    return {c['id']: c for c in (d or {}).get('cases', []) if c.get('id')}


def fp(c):
    f = c.get('fp')
    return (f.get('sha256') if isinstance(f, dict) else f) or None


def nreg(c):
    return sum(1 for v in (c.get('verified') or {}).values() if 'registry' in str(v).lower())


def regkey(c):
    r = c.get('register')
    return (r.get('register'), r.get('item'), r.get('status')) if isinstance(r, dict) else None


def diff_cases(A, B):
    """Changes from copy A to copy B, as {kind: {id: detail}} plus markets."""
    a, b = by_id(A), by_id(B)
    sch = {k for c in a.values() for k in c}   # a field only counts as changed once the older copy already carried it (no schema artefacts)
    ch = {k: {} for k, _ in KINDS}
    ch['slip'], ch['sat'] = {}, {}
    for i, c in b.items():
        if i not in a:
            ch['new'][i] = c.get('market')
            continue
        o = a[i]
        if fp(o) and fp(c) and fp(o) != fp(c):
            ch['page'][i] = 'page text changed'
        if (o.get('band') or None) != (c.get('band') or None) and (o.get('band') or c.get('band')):
            ch['price'][i] = '%s to %s' % (o.get('band') or 'not stated', c.get('band') or 'not stated')
        dd = []
        if o.get('done') != c.get('done') and (o.get('done') or c.get('done')):
            dd.append('completion year %s to %s' % (o.get('done') or 'not stated', c.get('done') or 'not stated'))
        if 'delay' in sch and (o.get('delay') or 0) != (c.get('delay') or 0):
            dd.append('handover date moved %s to %s months in total' % (o.get('delay') or 0, c.get('delay') or 0))
        if 'overdue' in sch and (o.get('overdue') or 0) != (c.get('overdue') or 0):
            dd.append('overdue %s to %s months' % (o.get('overdue') or 0, c.get('overdue') or 0))
        if dd:
            ch['date'][i] = '; '.join(dd)
        if 'overdue' in sch and not (o.get('overdue') or 0) and (c.get('overdue') or 0) > 0:
            ch['slip'][i] = 'now %s months past the advertised handover' % c.get('overdue')
        rr = []
        if 'register' in sch and regkey(o) != regkey(c) and regkey(c):
            r = c['register']
            rr.append('%s: %s %s' % (r.get('register'), r.get('item') or '', r.get('status') or ''))
        if 'verified' in sch and nreg(o) != nreg(c):
            rr.append('checks confirmed on an official register %d to %d' % (nreg(o), nreg(c)))
        if rr:
            ch['register'][i] = '; '.join(rr)
        so, sc = (o.get('sat') or {}).get('status'), (c.get('sat') or {}).get('status')
        if 'sat' in sch and sc and so != sc:
            ch['sat'][i] = '%s (%s%% changed)' % (sc, (c.get('sat') or {}).get('changed_pct')) if (c.get('sat') or {}).get('changed_pct') is not None else sc
    removed = [i for i in a if i not in b]
    mk = {i: c.get('market') for i, c in b.items()}
    mk.update({i: c.get('market') for i, c in a.items() if i not in mk})
    return ch, removed, mk


def group(ids, mk):
    g = {}
    for i in sorted(ids):
        g.setdefault(mk.get(i) or 'Unknown', []).append(i)
    return [{'market': m, 'n': len(v), 'ids': v} for m, v in sorted(g.items(), key=lambda x: (-len(x[1]), x[0]))]


def dm(s):
    """Promised date -> month index of its end (a year means December, a quarter its last month), None if unreadable."""
    m = re.match(r'^(\d{4})(?:-(Q[1-4]|\d{2}))?', str(s or ''))
    if not m:
        return None
    y, x = int(m.group(1)), m.group(2)
    mo = 12 if not x else int(x[1]) * 3 if x.startswith('Q') else int(x)
    return y * 12 + mo


def promise_key(p):
    h = p.get('hist') or []
    return (p.get('k'), (h[0].get('q') if h else p.get('q')))


# ---------------------------------------------------------------- AI paragraph, checked by code
NUMBER_WORDS = r'\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|dozen|half|double|triple|twice)\b'
BANNED = r'\b(record[- ](?:high|low|level)\w*|soar\w*|plummet\w*|surg\w*|alarming|shocking|massive|huge|dramatic\w*|significant\w*|crisis|boom\w*|crash\w*|best|worst|unprecedented|staggering|whopping|risky|safe|safest)\b'


def numbers_in(text):
    return [m.group(0).replace(',', '') for m in re.finditer(r'\d[\d,]*(?:\.\d+)?', text)]


def allowed_numbers(v, s=None):
    s = set() if s is None else s
    if v is None or isinstance(v, bool):
        return s
    if isinstance(v, (int, float)):
        s.update({'%g' % v, str(int(v)) if float(v).is_integer() else '%.1f' % v})
    elif isinstance(v, str):
        s.update(numbers_in(v))
    elif isinstance(v, dict):
        for x in v.values():
            allowed_numbers(x, s)
    elif isinstance(v, (list, tuple)):
        for x in v:
            allowed_numbers(x, s)
    return s


def check_text(text, allowed):
    probs = []
    if '—' in text or '–' in text:
        probs.append('dash')
    m = re.search(NUMBER_WORDS, text, re.I)
    if m:
        probs.append('number word: ' + m.group(0))
    m = re.search(BANNED, text, re.I)
    if m:
        probs.append('unbacked adjective: ' + m.group(0))
    if re.search(r'\b(?:%s)\b' % '|'.join(re.escape(x) for x in ('guarantee', 'scam', 'fraud')), text, re.I):
        probs.append('loaded word')
    if re.search(r'\b[A-Z]{2,5}-\d{3,4}\b', text):
        probs.append('project id in intro')
    nums = numbers_in(text)
    bad = [n for n in nums if n not in allowed]
    if bad:
        probs.append('numbers not in the data: ' + ', '.join(bad[:8]))
    return {'numbers_found': nums, 'all_backed': not probs, 'problems': probs}


def ask_claude(facts, key, model='claude-sonnet-5-5', max_usd=0.5):
    prompt = ('You write the intro paragraph of a weekly digest of off-plan property data. Use ONLY the numbers in the JSON below, copied exactly '
              '(digits, not words). Do not add any other number, date, cause, forecast, comparison or opinion. Do not name any developer, project or project id. '
              'No adjectives unless a number in the same sentence backs them. No dashes. Plain English, 60 to 120 words, third person ("Kolaboro data show"). '
              'Say that the figures come from the public data files and their daily history. Return only the paragraph.\n\nJSON:\n' + json.dumps(facts, ensure_ascii=False))
    body = json.dumps({'model': model, 'max_tokens': 800, 'messages': [{'role': 'user', 'content': prompt}]}).encode()
    req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
        'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r:
        d = json.loads(r.read())
    u = d.get('usage', {})
    usd = u.get('input_tokens', 0) * 3e-6 + u.get('output_tokens', 0) * 15e-6   # Sonnet list prices per token
    SPEND['usd'] += usd
    if usd > max_usd:
        raise RuntimeError('spend guard')
    text = ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text').strip()
    return text, {'model': d.get('model', model), 'input_tokens': u.get('input_tokens', 0), 'output_tokens': u.get('output_tokens', 0), 'usd': round(usd, 4)}


# ---------------------------------------------------------------- weeks
def iso_week(d):
    y, w, _ = d.isocalendar()
    return '%d-%02d' % (y, w)


def week_bounds(wid):
    y, w = map(int, wid.split('-'))
    mon = dt.date.fromisocalendar(y, w, 1)
    return mon, mon + dt.timedelta(days=6)


def fdate(d):
    return '%d %s %d' % (d.day, MON[d.month - 1], d.year)


def build_week(wid, today, H, cache_commits, hist_start):
    mon, sun = week_bounds(wid)
    end = min(sun, today)
    base_day = mon - dt.timedelta(days=1)
    W = {'id': wid, 'from': mon.isoformat(), 'to': end.isoformat(), 'week_end': sun.isoformat(), 'partial': end < sun, 'generated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
    copies = {}

    def at(name, day):
        cm = cache_commits[name]
        v = day_versions(cm, day, day)[day]
        return v

    # cases: baseline is the last copy before the week (or the first copy ever, when the week holds the start of our history)
    b_sha, e_sha = at('bali-cases.json', base_day), at('bali-cases.json', end)
    first_sha = cache_commits['bali-cases.json'][0][1] if cache_commits['bali-cases.json'] else None
    base_note = None
    if not b_sha and first_sha:
        b_sha, base_note = first_sha, 'Our stored history starts with the first copy of %s; changes are counted from that copy.' % cache_commits['bali-cases.json'][0][0][:10]
    A, B = H.content('bali-cases.json', b_sha) if b_sha else None, H.content('bali-cases.json', e_sha) if e_sha else None
    copies['bali-cases.json'] = {'baseline': b_sha, 'end': e_sha}
    if not B:
        W['empty'] = True
        return W
    ch, removed, mk = diff_cases(A, B) if A is not None else ({k: {} for k, _ in KINDS} | {'slip': {}, 'sat': {}}, [], {})
    if A is None:
        mk = {c['id']: c.get('market') for c in B.get('cases', [])}
    in_w = lambda s: s and W['from'] <= s[:10] <= W['to']   # noqa: E731
    cases = B.get('cases', [])
    S = {}
    S['new'] = {'total': len(ch['new']), 'by_market': group(ch['new'], mk), 'removed': len(removed), 'projects_end': len(cases), 'markets_end': len({c.get('market') for c in cases})}
    # promises
    pb, pe = at('promises.json', base_day), at('promises.json', end)
    copies['promises.json'] = {'baseline': pb, 'end': pe}
    PE = H.content('promises.json', pe) if pe else None
    PB = H.content('promises.json', pb) if pb else None
    moved, broken, kept = {}, {}, {}
    if PE:
        for i, L in (PE.get('projects') or {}).items():
            old = {promise_key(p): p for p in ((PB or {}).get('projects') or {}).get(i, [])}
            for p in L:
                kind = (PE.get('kinds') or {}).get(p.get('k'), p.get('k'))
                h = p.get('hist') or []
                for j in range(1, len(h)):
                    a0, a1 = dm(h[j - 1].get('d')), dm(h[j].get('d'))
                    if a0 and a1 and a1 > a0 and in_w(h[j].get('seen')):
                        moved.setdefault(i, []).append('%s: %s to %s (seen %s)' % (kind, h[j - 1].get('d'), h[j].get('d'), h[j].get('seen')))
                o = old.get(promise_key(p))
                if p.get('st') == 'broken' and (PB is not None and (o is None or o.get('st') != 'broken')):
                    broken.setdefault(i, []).append('%s promised for %s' % (kind, p.get('d')))
                if p.get('st') == 'kept' and (PB is not None and (o is None or o.get('st') != 'kept')):
                    kept.setdefault(i, []).append('%s promised for %s' % (kind, p.get('d')))
    pnote = None
    if PE and PB is None:
        first = cache_commits['promises.json'][0][0][:10] if cache_commits['promises.json'] else '?'
        pnote = 'The promise file was first published on %s, so broken and kept this week cannot be compared with an earlier copy; moves are counted from the dated history inside each promise.' % first
        bro_now = sum(1 for L in (PE.get('projects') or {}).values() for p in L if p.get('st') == 'broken')
        S['promises_first_copy'] = {'broken_now': bro_now}
    S['promises'] = {'moved': {'projects': len(moved), 'by_market': group(moved, mk), 'detail': moved},
                     'broken': {'projects': len(broken), 'by_market': group(broken, mk), 'detail': broken},
                     'kept': {'projects': len(kept), 'by_market': group(kept, mk), 'detail': kept}, 'note': pnote, 'available': bool(PE)}
    # slipped past the promised date
    slip = dict(ch['slip'])
    for i, v in broken.items():
        slip.setdefault(i, 'promise now broken: ' + '; '.join(v))
    S['slipped'] = {'projects': len(slip), 'by_market': group(slip, mk), 'detail': slip}
    # page changes: dated field changes recorded by the research agent, plus page text fingerprints that changed
    fields = {}
    for c in cases:
        for h in c.get('history') or []:
            if in_w(h.get('d')):
                fields.setdefault(h.get('f'), set()).add(c['id'])
    has_fp = A is not None and any(fp(c) for c in A.get('cases', []))
    S['pages'] = {'text_changed': {'projects': len(ch['page']) if has_fp else None, 'by_market': group(ch['page'], mk)},
                  'note': None if has_fp else 'Page fingerprints were not yet in the copy this week is compared from, so changed page text cannot be counted for this week.',
                  'fields': [{'change': f, 'projects': len(v), 'by_market': group(v, mk)} for f, v in sorted(fields.items(), key=lambda x: -len(x[1]))]}
    # register checks
    rb, re_ = at('register-checks.json', base_day), at('register-checks.json', end)
    RE = H.content('register-checks.json', re_) if re_ else None
    RB = H.content('register-checks.json', rb) if rb else None
    looked, changed = {}, {}
    for i, r in ((RE or {}).get('projects') or {}).items():
        if in_w(r.get('checked')):
            looked[i] = '%s: %s %s' % (r.get('register'), r.get('item') or '', r.get('status') or '')
        if RB is not None:
            o = (RB.get('projects') or {}).get(i)
            if o is None or (o.get('status'), o.get('item')) != (r.get('status'), r.get('item')):
                changed[i] = '%s to %s' % ((o or {}).get('status') or 'no result', r.get('status'))
    for i, v in ch['register'].items():
        changed.setdefault(i, v)
    S['register'] = {'available': RE is not None, 'looked_up': {'projects': len(looked), 'by_market': group(looked, mk), 'detail': looked},
                     'changed': {'projects': len(changed), 'by_market': group(changed, mk), 'detail': changed},
                     'note': None if RB is not None or not RE else 'The register file was first published on %s; status changes are counted from the project records only.' % (cache_commits['register-checks.json'][0][0][:10])}
    # satellite flags
    sb, se = at('stalled-sites.json', base_day), at('stalled-sites.json', end)
    SE = H.content('stalled-sites.json', se) if se else None
    SB = H.content('stalled-sites.json', sb) if sb else None
    flag = lambda s: s and s.get('status') == 'ok' and (s.get('no_visible_change_months') or 0) >= 6   # noqa: E731  same rule as the project page
    flagged_now = {i: 'no visible change on site for %s months (Sentinel-2)' % s.get('no_visible_change_months') for i, s in ((SE or {}).get('projects') or {}).items() if flag(s)}
    new_flags = {i: v for i, v in flagged_now.items() if SB is not None and not flag((SB.get('projects') or {}).get(i))}
    sat_seen = {c['id']: '%s, %s%% of the area changed' % (c['sat'].get('status'), c['sat'].get('changed_pct')) for c in cases if isinstance(c.get('sat'), dict) and in_w(c['sat'].get('date'))}
    S['satellite'] = {'available': SE is not None, 'flagged_now': {'projects': len(flagged_now), 'by_market': group(flagged_now, mk), 'detail': flagged_now},
                      'new_flags': {'projects': len(new_flags), 'by_market': group(new_flags, mk), 'detail': new_flags} if SB is not None else None,
                      'status_changed': {'projects': len(ch['sat']), 'by_market': group(ch['sat'], mk), 'detail': ch['sat']},
                      'compared_this_week': {'projects': len(sat_seen), 'by_market': group(sat_seen, mk)},
                      'note': None if SB is not None or not SE else 'The stalled-site file was first published on %s, so every flag in it is shown as standing, not as new this week.' % (cache_commits['stalled-sites.json'][0][0][:10])}
    W['sections'] = S
    W['baseline_note'] = base_note
    W['copies'] = copies
    W['data_updated'] = B.get('updated')
    return W


def facts_of(W):
    S = W['sections']
    f = {'week': W['id'].split('-')[1], 'projects_tracked': S['new']['projects_end'], 'markets_tracked': S['new']['markets_end'],
         'new_projects': S['new']['total'], 'markets_with_new_projects': len(S['new']['by_market']),
         'projects_past_promised_date_this_week': S['slipped']['projects']}
    if S['promises']['available']:
        f['projects_with_promise_moved_later'] = S['promises']['moved']['projects']
    if S['pages']['text_changed']['projects'] is not None:
        f['pages_with_text_changed'] = S['pages']['text_changed']['projects']
    if S['register']['available']:
        f['register_lookups_dated_this_week'] = S['register']['looked_up']['projects']
    if S['satellite']['available']:
        f['satellite_flags_standing'] = S['satellite']['flagged_now']['projects']
    return f


def template_intro(W, f):
    s = ['Kolaboro data for week %s (%s to %s) cover %d anonymous off-plan projects in %d markets.' % (
        f['week'], fdate(dt.date.fromisoformat(W['from'])), fdate(dt.date.fromisoformat(W['to'])), f['projects_tracked'], f['markets_tracked']),
         '%d new project ids appeared in %d markets.' % (f['new_projects'], f['markets_with_new_projects']),
         '%d projects became overdue or had a promise newly marked broken.' % f['projects_past_promised_date_this_week']]
    if 'projects_with_promise_moved_later' in f:
        s.append('%d projects had a promised date moved later.' % f['projects_with_promise_moved_later'])
    if 'pages_with_text_changed' in f:
        s.append('The text of %d tracked developer or listing pages changed.' % f['pages_with_text_changed'])
    if 'register_lookups_dated_this_week' in f:
        s.append('%d register lookups are dated this week.' % f['register_lookups_dated_this_week'])
    if 'satellite_flags_standing' in f:
        s.append('%d projects carry a standing satellite flag.' % f['satellite_flags_standing'])
    s.append('Every figure is counted by code from the public data files and their daily history.')
    return ' '.join(s)


def intro(W, use_ai):
    f = facts_of(W)
    allowed = allowed_numbers(f) | allowed_numbers([W['from'], W['to']]) | {W['id'].split('-')[0]}
    tpl = template_intro(W, f)
    allowed |= set(numbers_in(tpl))   # the template's own date words (day numbers, year) are data too
    tchk = check_text(tpl, allowed)
    if not tchk['all_backed']:
        raise SystemExit('template failed its own check: %s' % tchk)
    key = os.environ.get('ANTHROPIC_API_KEY')
    if use_ai and key:
        try:
            txt, spend = ask_claude(f, key)
            chk = check_text(txt, allowed)
            if chk['all_backed'] and 40 <= len(txt.split()) <= 160:
                return {'text': txt, 'by': spend['model'], 'check': chk, 'spend': spend, 'facts': f}
            chk.update({'rejected': True, 'draft': txt[:1500]})
            return {'text': tpl, 'by': 'template', 'check': chk, 'spend': spend, 'facts': f}
        except Exception as e:
            return {'text': tpl, 'by': 'template', 'check': {'error': str(e)[:200]}, 'facts': f}
    return {'text': tpl, 'by': 'template', 'check': tchk, 'facts': f}


# ---------------------------------------------------------------- heatmap
def heatmap(today, H, cache_commits, hist_start):
    d0 = max(hist_start, today - dt.timedelta(days=30))
    V = day_versions(cache_commits['bali-cases.json'], d0 - dt.timedelta(days=1), today)
    days = sorted(V)
    windows = {}
    ev = {}   # day -> (changes, mk)
    prev = None
    for d in days:
        sha = V[d]
        if prev is not None and sha and prev[1] and sha != prev[1]:
            A, B = H.content('bali-cases.json', prev[1]), H.content('bali-cases.json', sha)
            ch, _, mk = diff_cases(A, B)
            ev[d] = (ch, mk)
        prev = (d, sha) if sha else prev
    for w in (7, 30):
        start = today - dt.timedelta(days=w - 1)
        cell, mkall = {}, {}
        for d, (ch, mk) in ev.items():
            if d < start:
                continue
            mkall.update(mk)
            for k, _ in KINDS:
                for i in ch[k]:
                    cell.setdefault((mk.get(i) or 'Unknown', k), set()).add(i)
        markets = sorted({m for m, _ in cell}, key=lambda m: (-sum(len(cell.get((m, k), ())) for k, _ in KINDS), m))
        rows = [{'market': m, 'total': sum(len(cell.get((m, k), ())) for k, _ in KINDS), 'counts': {k: len(cell.get((m, k), ())) for k, _ in KINDS}, 'ids': {k: sorted(cell.get((m, k), ())) for k, _ in KINDS if cell.get((m, k))}} for m in markets]
        tot = {k: len({i for (m, kk), s in cell.items() if kk == k for i in s}) for k, _ in KINDS}
        real_start = max(start, hist_start)
        windows[str(w)] = {'days': w, 'from': real_start.isoformat(), 'to': today.isoformat(), 'covers_days': (today - real_start).days + 1,
                           'totals': tot, 'markets': rows, 'max_cell': max([r['counts'][k] for r in rows for k, _ in KINDS] or [0])}
    return {'generated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'history_starts': hist_start.isoformat(), 'kinds': [{'key': k, 'label': l, 'means': KIND_HELP[k]} for k, l in KINDS],
            'method': 'For each day we take the last published copy of /data/bali-cases.json on that day and compare it with the previous day\'s copy. A project counts once per kind and market in a window, however often it changed.',
            'days_compared': sorted(d.isoformat() for d in ev), 'windows': windows, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)'}


# ---------------------------------------------------------------- HTML
CSS = '''<style>
.dg-sec h2{margin-bottom:4px}.dg-mk{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:8px}
.dg-mk li{background:var(--card,#fff);border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:.92rem;line-height:1.6;min-width:0;overflow-wrap:anywhere}
.dg-mk li b{margin-right:6px}.dg-mk a{font-variant-numeric:tabular-nums;margin-right:4px}
.dg-empty{color:var(--muted)}.dg-arch{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:12px 0 0}
.dg-arch a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:1px solid var(--line);border-radius:999px;background:var(--card,#fff);text-decoration:none;color:var(--ink);font-weight:700}
.dg-arch a[aria-current]{background:var(--ink);color:var(--paper)}
.dg-intro{font-size:1.08rem;line-height:1.6;max-width:70ch;margin-top:18px}
.hm{border-collapse:separate;border-spacing:2px;margin-top:16px;font-size:.9rem;min-width:560px}
.hm th{font-size:.76rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);text-align:center;padding:6px 4px;font-weight:700}
.hm th.m{text-align:left;white-space:nowrap;padding-right:10px;text-transform:none;letter-spacing:0;font-size:.9rem}.hm th.m a{color:var(--ink);font-weight:700}.hm td.t{font-weight:700;color:var(--ink)}
.hm td.c{text-align:center;padding:0;border-radius:4px;min-width:64px}
.hm td.c a,.hm td.c span{display:flex;align-items:center;justify-content:center;min-height:40px;text-decoration:none;color:var(--ink);font-weight:700;font-variant-numeric:tabular-nums}
.hm td.c span{color:var(--muted);font-weight:400}.hm td.c a:hover{outline:2px solid var(--ink);border-radius:4px}
.hm td.b1 a,.hm td.b2 a,.hm td.b3 a{color:#17212B}.hm .b1{background:#cde2fb}.hm .b2{background:#9ec5f4}.hm .b3{background:#6da7ec}.hm .b4{background:#3987e5}.hm .b4 a,.hm .b5 a{color:#fff}.hm .b5{background:#1c5cab}
.hm-key{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center;margin-top:10px;font-size:.84rem;color:var(--ink-2)}
.hm-key i{display:inline-block;width:22px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:4px}
.hm-tabs{display:flex;gap:8px;margin-top:16px}.hm-tabs button{min-height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--line);background:var(--card,#fff);font:inherit;font-weight:700;cursor:pointer;color:var(--ink)}
.hm-tabs button[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.hm-list{margin-top:16px;background:var(--card,#fff);border:1px solid var(--line);border-radius:14px;padding:14px 16px;scroll-margin-top:96px}.hm-list h3{font-size:1.1rem;margin:0}.hm-list ul{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-wrap:wrap;gap:6px}
.hm-list li a{display:inline-flex;min-height:40px;align-items:center;padding:0 12px;border:1px solid var(--line);border-radius:999px;background:var(--card,#fff);text-decoration:none;color:var(--ink);font-variant-numeric:tabular-nums}
</style>'''


def plink(i):
    return '<a href="/p/%s/">%s</a>' % (esc(i), esc(i))


def mk_list(by_market, detail=None, cap=40):
    if not by_market:
        return '<p class="dg-empty">None this week.</p>'
    out = []
    for g in by_market:
        ids = g['ids']
        shown = ids[:cap]
        if detail:
            items = '; '.join('%s (%s)' % (plink(i), esc(detail.get(i) if isinstance(detail.get(i), str) else '; '.join(detail.get(i) or []))) for i in shown)
        else:
            items = ' '.join(plink(i) for i in shown)
        more = (' and %d more (see <a href="/api/x/ins/digest.json">the JSON</a>)' % (len(ids) - cap)) if len(ids) > cap else ''
        out.append('<li><b>%s</b> %d: %s%s</li>' % (esc(g['market']), g['n'], items, more))
    return '<ul class="dg-mk">' + ''.join(out) + '</ul>'


def nv(x):
    return '%d' % x if isinstance(x, int) else '<small style="font-size:.55em">not available</small>'


def week_main(W, weeks, latest):
    mon = dt.date.fromisoformat(W['from'])
    to = dt.date.fromisoformat(W['to'])
    S = W['sections']
    span = '%s to %s' % (fdate(mon), fdate(to))
    arch = '<ul class="dg-arch">' + ''.join('<li><a href="%s"%s>Week %s%s</a></li>' % ('#top' if w['id'] == W['id'] else '#w-' + w['id'], ' aria-current="page"' if w['id'] == W['id'] else '', w['id'].replace('-', ' week ').split(' week ')[1] + ', ' + w['id'][:4], ' (to date)' if w.get('partial') else '') for w in weeks) + '</ul>'
    I = W['intro']
    by = ('Intro drafted by %s from the counts below, then checked by code: every number in it appears in the data.' % esc(I['by'])) if I['by'] != 'template' else 'Intro filled in by code from the counts below (no AI).'
    sec = lambda h, idh, body, sub='': '<section class="y-sec dg-sec" aria-labelledby="%s"><div class="wrap"><h2 id="%s">%s</h2>%s%s</div></section>' % (idh, idh, h, ('<p class="lead">%s</p>' % sub) if sub else '', body)   # noqa: E731
    P = S['promises']
    body = []
    body.append(sec('New projects by market', 'h-new', mk_list(S['new']['by_market']), '%d new project ids appeared in the public data this week%s. %d tracked at the end of the week.' % (S['new']['total'], (' (%d left the file)' % S['new']['removed']) if S['new']['removed'] else '', S['new']['projects_end'])))
    body.append(sec('Slipped past their promised date', 'h-slip', mk_list(S['slipped']['by_market'], S['slipped']['detail']), '%d projects became overdue on their advertised handover, or had a dated promise marked broken, this week.' % S['slipped']['projects']))
    pb = '<h3>Moved later</h3>' + mk_list(P['moved']['by_market'], P['moved']['detail']) + '<h3 style="margin-top:20px">Broken</h3>' + (mk_list(P['broken']['by_market'], P['broken']['detail']) if P['note'] is None else '<p class="dg-empty">%s%s</p>' % (esc(P['note']), (' The first copy lists %d broken promises in total, see <a href="/promises/">the promise tracker</a>.' % S['promises_first_copy']['broken_now']) if S.get('promises_first_copy') else '')) + ('<h3 style="margin-top:20px">Kept</h3>' + mk_list(P['kept']['by_market'], P['kept']['detail']) if P['note'] is None else '')
    if not P['available']:
        body.append(sec('Promises broken or moved', 'h-pr', '<p class="dg-empty">The promise file was not published yet in this week.</p>'))
    else:
        body.append(sec('Promises broken or moved', 'h-pr', pb, '%d projects had a promised date moved later this week (a move counts on the day our copies first showed the later date); %s.' % (P['moved']['projects'], ('%d had a promise newly marked broken' % P['broken']['projects']) if P['note'] is None else 'broken promises need an earlier copy to compare with')))
    pg = ('<h3>Page text changed</h3>' + mk_list(S['pages']['text_changed']['by_market'], cap=30) if S['pages']['text_changed']['projects'] is not None else '') + ''.join('<h3 style="margin-top:20px">%s</h3>%s' % (esc(f['change'][0].upper() + f['change'][1:]), mk_list(f['by_market'])) for f in S['pages']['fields'])
    pgn = S['pages']['text_changed']['projects']
    body.append(sec('Page changes', 'h-pg', pg, ('Tracked developer and listing pages whose text fingerprint (SHA-256) changed between the last copy before the week and the last copy of the week: %d.' % pgn if pgn is not None else esc(S['pages']['note'])) + ' Below that, the fields our research agent recorded as changed on a date inside the week.'))
    R = S['register']
    if not R['available']:
        body.append(sec('Register check changes', 'h-reg', '<p class="dg-empty">The register check file was not published yet in this week.</p>'))
    else:
      body.append(sec('Register check changes', 'h-reg', '<h3>Looked up this week</h3>' + mk_list(R['looked_up']['by_market'], R['looked_up']['detail']) + '<h3 style="margin-top:20px">Result changed</h3>' + mk_list(R['changed']['by_market'], R['changed']['detail']) + ('<p class="y-small">%s</p>' % esc(R['note']) if R['note'] else ''), '%d project register lookups are dated inside the week; %d results appeared or changed. See <a href="/registers/checks/">register checks</a>.' % (R['looked_up']['projects'], R['changed']['projects'])))
    SA = S['satellite']
    if not SA['available']:
        body.append(sec('Satellite flags', 'h-sat', '<p class="dg-empty">The stalled-site file was not published yet in this week.</p>'))
    sb = '<h3>Flagged: no visible change for 6 months or more</h3>' + mk_list(SA['flagged_now']['by_market'], SA['flagged_now']['detail']) + (('<h3 style="margin-top:20px">New flags this week</h3>' + mk_list(SA['new_flags']['by_market'], SA['new_flags']['detail'])) if SA['new_flags'] is not None else '') + '<h3 style="margin-top:20px">Satellite status changed</h3>' + mk_list(SA['status_changed']['by_market'], SA['status_changed']['detail']) + ('<p class="y-small">%s</p>' % esc(SA['note']) if SA['note'] else '')
    if SA['available']:
      body.append(sec('Satellite flags', 'h-sat', sb, '%d projects stand flagged by the Sentinel-2 stalled-site check (same rule as the project page: 6 or more months with no visible change). A flag is a prompt to ask, not a verdict. See <a href="/satellite/night/">stalled sites</a>.' % SA['flagged_now']['projects']))
    method = ('<section class="y-sec" aria-labelledby="h-how"><div class="wrap"><h2 id="h-how">How this digest is built</h2><dl class="y-faq">'
              '<dt>Data</dt><dd>Only the public files under <a href="/data/bali-cases.json">/data/</a> (projects, promises, register checks, stalled sites) and their git history: for each day, the last published copy of that day. The week is compared from the last copy before Monday to the last copy of the week. %s</dd>'
              '<dt>Anonymous</dt><dd>Projects appear by id only, as everywhere on Kolaboro.</dd>'
              '<dt>Intro paragraph</dt><dd>%s</dd>'
              '<dt>Schedule</dt><dd>Rebuilt every Monday for the week just ended, and on demand; a week shown as "to date" is rebuilt until it is complete. Data: <a href="/api/x/ins/digest.json">/api/x/ins/digest.json</a>, RSS: <a href="/api/x/ins/feed.xml">/api/x/ins/feed.xml</a>, heatmap of the last 7 and 30 days: <a href="#changes">below</a>. Earlier weeks are summarised further down this page; their full project lists are in the JSON.</dd>'
              '</dl></div></section>') % (esc(W.get('baseline_note') or ''), by)
    hero = ('<section class="y-hero"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / <a href="/database">Database</a> / <a href="/digest/">Weekly digest</a></p>'
            '<p class="eyebrow">Weekly market digest%s</p><h1>Week %s, %s</h1><p class="lead">%s%s</p>'
            '<p class="dg-intro">%s</p><p class="y-small">%s</p>'
            '<div class="y-n"><div><b>%s</b><span>new projects</span></div><div><b>%s</b><span>slipped past a promised date</span></div><div><b>%s</b><span>projects with a promise moved later</span></div><div><b>%s</b><span>pages whose text changed</span></div></div>'
            '<h2 style="font-size:1.05rem;margin-top:26px">All weeks</h2>%s<p class="y-small" style="margin-top:10px"><a href="/api/x/ins/feed.xml">RSS feed</a> · <a href="#changes">Change heatmap</a></p></div></section>') % (
        ' (to date)' if W['partial'] else '', int(W['id'][5:]), W['id'][:4], span, ' This week is still running: it is rebuilt until it is complete.' if W['partial'] else '',
        esc(I['text']), by, nv(S['new']['total']), nv(S['slipped']['projects']), nv(P['moved']['projects'] if P['available'] else None), nv(S['pages']['text_changed']['projects']), arch)
    return hero + ''.join(body) + method


def archive(WL, latest):
    old = [w for w in sorted(WL, key=lambda x: x['id'], reverse=True) if w['id'] != latest]
    if not old:
        return ''
    out = []
    for W in old:
        S = W['sections']
        rows = [('New projects', S['new']['total'], S['new']['by_market']), ('Slipped past a promised date', S['slipped']['projects'], S['slipped']['by_market'])]
        if S['promises']['available']:
            rows.append(('Projects with a promise moved later', S['promises']['moved']['projects'], S['promises']['moved']['by_market']))
        if S['pages']['text_changed']['projects'] is not None:
            rows.append(('Pages whose text changed', S['pages']['text_changed']['projects'], S['pages']['text_changed']['by_market']))
        if S['register']['available']:
            rows.append(('Register lookups dated in the week', S['register']['looked_up']['projects'], S['register']['looked_up']['by_market']))
        if S['satellite']['available']:
            rows.append(('Standing satellite flags', S['satellite']['flagged_now']['projects'], S['satellite']['flagged_now']['by_market']))
        li = ''.join('<li><b>%s: %d</b>%s</li>' % (esc(l), n, (' (' + ', '.join('%s %d' % (esc(g['market']), g['n']) for g in bm[:12]) + (', and %d more markets' % (len(bm) - 12) if len(bm) > 12 else '') + ')') if bm else '') for l, n, bm in rows)
        out.append('<details class="y-box" id="w-%s"><summary><b>Week %d, %s</b>: %s to %s%s</summary><p class="dg-intro" style="font-size:1rem">%s</p><ul class="dg-mk">%s</ul>%s</details>' % (
            W['id'], int(W['id'][5:]), W['id'][:4], fdate(dt.date.fromisoformat(W['from'])), fdate(dt.date.fromisoformat(W['to'])), ' (to date)' if W.get('partial') else '',
            esc(W['intro']['text']), li, ('<p class="y-small">%s</p>' % esc(W['baseline_note'])) if W.get('baseline_note') else ''))
    js = "<script>(function(){var h=location.hash,e=h&&/^#w-\\d{4}-\\d{2}$/.test(h)&&document.getElementById(h.slice(1));if(e){e.open=true;e.scrollIntoView();}})();</script>"
    return ('<section class="y-sec" id="archive" aria-labelledby="h-arch"><div class="wrap"><h2 id="h-arch">Earlier weeks</h2><p class="lead">Counts by market for each earlier week. Every project id behind these counts is in <a href="/api/x/ins/digest.json">/api/x/ins/digest.json</a>.</p>%s</div></section>%s') % (''.join(out), js)


def rss(weeks):
    items = ''.join('<item><title>%s</title><link>%s/digest/#w-%s</link><guid isPermaLink="false">kolaboro-digest-%s-%s</guid><pubDate>%s</pubDate><description>%s</description></item>' % (
        esc('Kolaboro weekly digest, week %s %s%s' % (int(w['id'][5:]), w['id'][:4], ' (to date)' if w.get('partial') else '')), SITE, w['id'], SITE, w['id'],
        dt.datetime.strptime(w['generated'], '%Y-%m-%dT%H:%M:%SZ').strftime('%a, %d %b %Y %H:%M:%S +0000'), esc(w['intro']['text'])) for w in sorted(weeks, key=lambda x: x['id'], reverse=True) if not w.get('empty'))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Kolaboro weekly market digest</title>'
            '<link>%s/digest/</link><atom:link href="%s/api/x/ins/feed.xml" rel="self" type="application/rss+xml"/><description>New off-plan projects, slipped dates, moved promises, page, register and satellite changes, by market. Counted by code from the public data.</description><language>en</language>%s</channel></rss>\n') % (SITE, SITE, items)


def bucket(n, mx):
    if not n:
        return 0
    if mx <= 5:
        return min(5, n)
    r = n / mx
    return 1 if r <= .1 else 2 if r <= .25 else 3 if r <= .5 else 4 if r <= .8 else 5


def changes_main(HM):
    def table(w):
        X = HM['windows'][w]
        mx = X['max_cell']
        head = '<tr><th class="m" scope="col">Market</th>' + ''.join('<th scope="col" title="%s">%s</th>' % (esc(KIND_HELP[k]), esc(l)) for k, l in KINDS) + '<th scope="col">Total</th></tr>'
        rows = []
        for r in X['markets']:
            cells = []
            for k, l in KINDS:
                n = r['counts'][k]
                b = bucket(n, mx)
                if n:
                    cells.append('<td class="c b%d"><a href="#list" data-k="%s">%d</a></td>' % (b, k, n))
                else:
                    cells.append('<td class="c"><span>0</span></td>')
            rows.append('<tr data-m="%s"><th class="m" scope="row"><a href="/m/%s/">%s</a></th>%s<td class="c t">%d</td></tr>' % (esc(r['market']), esc(r['market'].lower().replace(' ', '-')), esc(r['market']), ''.join(cells), r['total']))
        tot = '<tr><th class="m" scope="row">All markets</th>' + ''.join('<td class="c t">%d</td>' % X['totals'][k] for k, _ in KINDS) + '<td></td></tr>'
        note = ('Window %s to %s: %d days with stored copies%s.' % (fdate(dt.date.fromisoformat(X['from'])), fdate(dt.date.fromisoformat(X['to'])), X['covers_days'], ' (our daily history starts on %s, so this window is shorter than %s days)' % (fdate(dt.date.fromisoformat(HM['history_starts'])), w) if X['covers_days'] < int(w) else ''))
        body = ('<div class="y-scroll"><table class="hm" data-w="%s"><caption class="sr-only">Changes by market and kind, last %s days</caption><thead>%s</thead><tbody>%s%s</tbody></table></div>' % (w, w, head, ''.join(rows), tot)) if X['markets'] else '<p class="dg-empty">No changes recorded in this window.</p>'
        return '<div class="hm-w" data-win="%s"><p class="y-small">%s</p>%s</div>' % (w, note, body)
    key = '<div class="hm-key" aria-hidden="true"><span>Fewer</span>' + ''.join('<span><i style="background:%s"></i></span>' % c for i, c in enumerate(['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#1c5cab'], 1)) + '<span>More changes (shade relative to the busiest cell in the window)</span></div>'
    defs = ''.join('<dt>%s</dt><dd>%s.</dd>' % (esc(l), esc(KIND_HELP[k][0].upper() + KIND_HELP[k][1:])) for k, l in KINDS)
    js = '''<script>(function(){var G=JSON.parse(document.getElementById('digest-data').textContent).changes.windows,D={},L=document.getElementById('list'),N=%s;
Object.keys(G).forEach(function(w){D[w]={};G[w].markets.forEach(function(r){D[w][r.market]=r.ids;});});
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function show(w,m,k){var a=((D[w]||{})[m]||{})[k]||[];L.innerHTML='<h3 id="h-list">'+esc(N[k])+' in '+esc(m)+', last '+w+' days: '+a.length+' project'+(a.length===1?'':'s')+'</h3><ul>'+a.map(function(i){return '<li><a href="/p/'+encodeURIComponent(i)+'/">'+esc(i)+'</a></li>';}).join('')+'</ul>';L.hidden=false;}
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('a[data-k]');if(!t)return;e.preventDefault();var w=t.closest('table').dataset.w,m=t.closest('tr').dataset.m;show(w,m,t.dataset.k);try{history.replaceState(null,'','?w='+w+'&m='+encodeURIComponent(m)+'&k='+t.dataset.k+'#list');}catch(x){}L.scrollIntoView({behavior:'smooth',block:'start'});var h=document.getElementById('h-list');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}});
function win(w){document.querySelectorAll('.hm-w').forEach(function(x){x.hidden=x.dataset.win!==w;});document.querySelectorAll('.hm-tabs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.win===w?'true':'false');});}
document.querySelectorAll('.hm-tabs button').forEach(function(b){b.addEventListener('click',function(){win(b.dataset.win);});});
var p;try{p=new URLSearchParams(location.search);}catch(x){p=null;}var w0=p&&p.get('w')==='30'?'30':'7';win(w0);if(p&&p.get('m')&&p.get('k'))show(w0,p.get('m'),p.get('k'));
})();</script>''' % json.dumps({k: l for k, l in KINDS})
    W7, W30 = HM['windows']['7'], HM['windows']['30']
    return ('<section class="y-sec" id="changes" aria-labelledby="h-chg"><div class="wrap">'
            '<p class="eyebrow">Change heatmap</p><h2 id="h-chg">Where off-plan markets changed most</h2>'
            '<p class="lead">Which markets moved, and how: new projects, page edits, price band moves, date moves and register results, counted by code from the daily copies of our public data. Each count links to the projects behind it.</p>'
            '<div class="y-n"><div><b>%d</b><span>page edits, last 7 days</span></div><div><b>%d</b><span>new projects, last 7 days</span></div><div><b>%d</b><span>date moves, last %d days</span></div><div><b>%d</b><span>markets with a change, last %d days</span></div></div>'
            '<h3 id="h-hm" style="margin-top:24px">Market by kind of change</h3>'
            '<div class="hm-tabs" role="group" aria-label="Window"><button type="button" data-win="7" aria-pressed="true">Last 7 days</button><button type="button" data-win="30" aria-pressed="false">Last 30 days</button></div>'
            '<div id="list" class="hm-list" hidden aria-live="polite"></div>%s%s%s</div></section>'
            '<section class="y-sec" aria-labelledby="h-def"><div class="wrap"><h2 id="h-def">What counts as a change in the heatmap</h2><dl class="y-faq">%s<dt>How</dt><dd>%s Days compared: %s. Data: the "changes" part of <a href="/api/x/ins/digest.json">/api/x/ins/digest.json</a> (CC BY 4.0).</dd>'
            '<dt>Limits</dt><dd>Our daily history starts on %s, so the 30-day window covers fewer days until December. A page edit can be a typo fix or a price change: open the project to see what changed. Built %s.</dd></dl></div></section>%s') % (
        W7['totals']['page'], W7['totals']['new'], W30['totals']['date'], W30['covers_days'], len(W30['markets']), W30['covers_days'],
        key, table('7'), table('30'), defs, esc(HM['method']), esc(', '.join(HM['days_compared']) or 'none yet'), fdate(dt.date.fromisoformat(HM['history_starts'])), esc(HM['generated']), js)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', default='calory89/webs-estaticas')
    ap.add_argument('--branch', default='pub/_lovable')
    ap.add_argument('--shell', required=True)
    ap.add_argument('--prev', help='existing data/digest.json')
    ap.add_argument('--out', required=True)
    ap.add_argument('--cache', default='/tmp/kdigest-cache')
    ap.add_argument('--today')
    ap.add_argument('--no-ai', action='store_true')
    a = ap.parse_args()
    today = dt.date.fromisoformat(a.today) if a.today else dt.datetime.now(dt.timezone.utc).date()
    H = Hist(a.repo, a.branch, os.environ.get('GITHUB_TOKEN') or os.environ.get('GH_TOKEN'), a.cache)
    since = (today - dt.timedelta(days=60)).isoformat()
    names = ['bali-cases.json', 'promises.json', 'register-checks.json', 'stalled-sites.json']
    CM = {n: H.commits(n, since) for n in names}
    if not CM['bali-cases.json']:
        raise SystemExit('no history for bali-cases.json')
    hist_start = dt.date.fromisoformat(CM['bali-cases.json'][0][0][:10])
    prev = {}
    if a.prev and os.path.exists(a.prev):
        try:
            raw = open(a.prev).read()
            m = re.search(r'<script type="application/json" id="digest-data">(.*?)</script>', raw, re.S)
            pd = json.loads(m.group(1).replace('<\\/', '</')) if m else json.loads(raw)
            prev = {w['id']: w for w in pd.get('weeks', [])}
        except Exception:
            prev = {}
    # weeks to (re)build: the week holding the start of history up to the current week; finished weeks already built are kept
    cur = iso_week(today)
    todo, d = [], hist_start
    while d <= today:
        w = iso_week(d)
        if w not in todo:
            todo.append(w)
        d += dt.timedelta(days=7 - d.weekday()) if d.weekday() else dt.timedelta(days=7)
    if cur not in todo:
        todo.append(cur)
    weeks = dict(prev)
    built = []
    for w in todo[-8:]:
        if w in prev and not prev[w].get('partial') and w != cur:
            continue
        W = build_week(w, today, H, CM, hist_start)
        if W.get('empty'):
            continue
        W['intro'] = intro(W, not a.no_ai)
        weeks[w] = W
        built.append(w)
    WL = sorted(weeks.values(), key=lambda x: x['id'])
    latest = WL[-1]['id']
    os.makedirs(os.path.join(a.out, 'digest'), exist_ok=True)
    HM = heatmap(today, H, CM, hist_start)
    D = {'version': 'digest-1', 'generated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'history_starts': hist_start.isoformat(), 'latest': latest,
         'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', 'sources': ['/data/' + n for n in names], 'weeks': WL, 'changes': HM,
         'ai': {'model': 'claude-sonnet-5-5', 'role': 'intro paragraph only, checked by code', 'this_run_usd': round(SPEND['usd'], 4)}}
    data = '<script type="application/json" id="digest-data">' + json.dumps(D, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>'
    # one page and no other file (file budget of the shared Pages project): the data rides inside the page and the worker serves it
    # as /api/x/ins/digest.json; latest week in full, earlier weeks summarised, heatmap of 7 and 30 days (file budget of the shared Pages project): latest week in full, earlier weeks summarised, heatmap of 7 and 30 days
    shell = open(a.shell).read()
    feed = '<link rel="alternate" type="application/rss+xml" title="Kolaboro weekly market digest" href="/api/x/ins/feed.xml">'
    L = [w for w in WL if w['id'] == latest][0]
    m = data + week_main(L, WL, latest) + archive(WL, latest) + changes_main(HM)
    open(os.path.join(a.out, 'digest', 'index.html'), 'w').write(page(shell, 'Weekly off-plan market digest and change heatmap | Kolaboro', L['intro']['text'][:300], SITE + '/digest/', m, CSS + feed))
    print(json.dumps({'today': today.isoformat(), 'built': built, 'weeks': [w['id'] for w in WL], 'latest': latest, 'intro_by': {w['id']: w['intro']['by'] for w in WL},
                      'api_calls': H.calls, 'ai_usd': round(SPEND['usd'], 4), 'heatmap_7': HM['windows']['7']['totals'], 'heatmap_30': HM['windows']['30']['totals']}, indent=1))


if __name__ == '__main__':
    main()
