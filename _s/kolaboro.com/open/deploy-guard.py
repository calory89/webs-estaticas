#!/usr/bin/env python3
"""Kolaboro post-deploy guard. Runs in GitHub Actions (workflow kolaboro-deploy-guard.yml) inside a blobless clone of pub/_lovable.

Cloudflare Pages sends every push to production at once and has no percentage canary, so this guard does the next best thing:
  1. wait until /api/open/build reports the pushed commit (or a later one),
  2. run the public smoke checks (open/deploy-smoke.mjs) against production, in a real browser too,
  3. if they fail twice, 90 seconds apart, restore every file changed by people since the last commit that passed and push that
     as a new commit (never a force-push); with a Cloudflare token configured it also asks Pages to roll back to that deployment at once,
  4. wait for the rollback to be live and check again,
  5. publish the record to kolaboro.com/data/deploys.json.
Mode "drill" (manual) proves the rollback path without touching production: an injected failing check must be caught, and the
rollback commit for the newest change is built and checked but NOT pushed.
No secret is printed. Exit code 1 when production failed (so GitHub notifies the owner), 0 otherwise.
"""
import json, os, subprocess, sys, time, urllib.request, datetime

BASE = 'https://kolaboro.com'
BRANCH = 'pub/_lovable'
DEPLOYS = '_s/kolaboro.com/data/deploys.json'
GUARDED = ('_worker.js/', '_s/kolaboro.com/')
UNGUARDED = ('_s/kolaboro.com/data/',)   # data refreshes by the research agents: not code
BOT_EMAILS = ('agent@kolaboro.com', 'github-actions', 'deploy-guard@kolaboro.com')
MODE = os.environ.get('GUARD_MODE', 'check')
EVENT = os.environ.get('GITHUB_EVENT_NAME', '')
PUSHED = os.environ.get('GITHUB_SHA', '') if EVENT == 'push' else ''
RUN = '%s/%s/actions/runs/%s' % (os.environ.get('GITHUB_SERVER_URL', 'https://github.com'), os.environ.get('GITHUB_REPOSITORY', ''), os.environ.get('GITHUB_RUN_ID', ''))
PW = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'guard-pw')
PW_VERSION = '1.48.2'
CF_TOKEN, CF_ACCOUNT, CF_PROJECT = os.environ.get('CF_PAGES_TOKEN', ''), os.environ.get('CF_ACCOUNT_ID', ''), os.environ.get('CF_PAGES_PROJECT', 'web-lovable')
now = lambda: datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0, tzinfo=None).isoformat() + 'Z'


def git(*a, check=True, inp=None, env=None):
    r = subprocess.run(['git'] + list(a), capture_output=True, text=True, input=inp, env=env)
    if check and r.returncode: raise RuntimeError('git %s: %s' % (a[0], r.stderr.strip()[:300]))
    return r.stdout.strip()


def fetch():
    git('fetch', '-q', '--depth=300', '--filter=blob:none', 'origin', '+refs/heads/%s:refs/remotes/origin/%s' % (BRANCH, BRANCH))
    return git('rev-parse', 'origin/' + BRANCH)


def live_commit():
    try:
        with urllib.request.urlopen(urllib.request.Request(BASE + '/api/open/build?guard=%d' % time.time(), headers={'user-agent': 'kolaboro-deploy-guard/1.0'}), timeout=20) as r:
            return json.load(r).get('commit') or ''
    except Exception:
        return ''


def known(c): return bool(c) and subprocess.run(['git', 'cat-file', '-e', c + '^{commit}'], capture_output=True).returncode == 0
def is_anc(a, b): return subprocess.run(['git', 'merge-base', '--is-ancestor', a, b], capture_output=True).returncode == 0


def obj(ref, path):   # blob id of path at ref, or '' when the file does not exist there
    return git('rev-parse', '--verify', '-q', '%s:%s' % (ref, path), check=False)


def files(c): return [f for f in git('diff-tree', '--no-commit-id', '--name-only', '-r', '--root', c).splitlines() if f]
def guarded_files(c): return [f for f in files(c) if f.startswith(GUARDED) and not f.startswith(UNGUARDED)]
def human(c): return not any(b in git('log', '-1', '--format=%ae', c) for b in BOT_EMAILS)


def human_changes(a, b):
    """People's commits between a (exclusive) and b (inclusive) that touch guarded code, oldest first."""
    rng = (a + '..' + b) if a else ('-1', b)
    lst = git('rev-list', '--reverse', rng) if a else b
    return [c for c in lst.split() if c and human(c) and guarded_files(c)]


def ensure_browser():
    if os.path.exists(os.path.join(PW, 'node_modules', 'playwright')): return
    os.makedirs(PW, exist_ok=True)
    subprocess.run(['npm', 'i', '-s', '--no-save', '--prefix', PW, 'playwright@' + PW_VERSION], check=True)
    # n22e (12 Nov 2026): the run of 11 Nov spent 10 minutes in "install --with-deps" (system packages) and failed without a word.
    # The runner image already carries the libraries Chromium needs, so the browser alone is tried first; system packages only
    # if that fails, with a time limit, and the output is printed.
    for args in (['chromium'], ['--with-deps', 'chromium']):
        try:
            r = subprocess.run(['npx', '--prefix', PW, 'playwright', 'install'] + args, cwd=PW, capture_output=True, text=True, timeout=240)
        except subprocess.TimeoutExpired:
            print('playwright install %s: no result after 240 s' % ' '.join(args), flush=True); continue
        if r.returncode == 0:
            # the browser must really start before the smoke checks rely on it (a missing system library shows here, not later)
            t = subprocess.run(['node', '-e', "require('playwright').chromium.launch().then(b=>b.close()).then(()=>process.exit(0),e=>{console.error(String(e).slice(0,300));process.exit(1)})"], cwd=PW, capture_output=True, text=True, timeout=120)
            if t.returncode == 0: return
            print('browser installed with %s does not start: %s' % (' '.join(args), (t.stderr or '')[-300:]), flush=True); continue
        print('playwright install %s failed (%s): %s' % (' '.join(args), r.returncode, ((r.stderr or '') + (r.stdout or ''))[-600:]), flush=True)
    raise RuntimeError('could not install the browser for the smoke checks')


def smoke(expect, inject=False):
    """Run the smoke checks published in the commit under test (so a change to the checks ships with the change)."""
    ensure_browser()
    src = git('show', '%s:_s/kolaboro.com/open/deploy-smoke.mjs' % (expect if known(expect) else 'origin/' + BRANCH), check=False) or git('show', 'origin/%s:_s/kolaboro.com/open/deploy-smoke.mjs' % BRANCH)
    script = os.path.join(PW, 'deploy-smoke.mjs'); open(script, 'w').write(src + '\n')
    # no --expect: on a busy branch the live commit can move during a run; the guard tracks which commit is live itself
    cmd = ['node', script, '--base', BASE, '--browser'] + (['--inject-fail'] if inject else [])
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
    try: d = json.loads(r.stdout)
    except Exception: d = {'ok': False, 'checks_passed': 0, 'checks_total': 1, 'failed': ['smoke script crashed: ' + (r.stderr or r.stdout)[-200:]], 'checks': []}
    print('smoke %s: %s/%s %s' % (expect[:12], d.get('checks_passed'), d.get('checks_total'), d.get('failed')), flush=True)
    return d


def wait_live(target, minutes=12):
    """Wait until production serves target or a later commit. Returns (live commit, seconds waited) or ('', s) on timeout."""
    t0 = time.time()
    while time.time() - t0 < minutes * 60:
        lc = live_commit()
        if lc == target: return lc, int(time.time() - t0)
        if lc and lc != target:
            if not known(lc): fetch()
            if known(lc) and is_anc(target, lc): return lc, int(time.time() - t0)
        time.sleep(20)
    return '', int(time.time() - t0)


def restore_tree(parent, good, changes):
    """New commit on top of parent: every guarded file changed by `changes` is set back to its version in `good`."""
    paths = sorted({f for c in changes for f in guarded_files(c)})
    idx = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'guard-index')
    env = dict(os.environ, GIT_INDEX_FILE=idx)
    if os.path.exists(idx): os.remove(idx)
    git('read-tree', parent, env=env)
    for p in paths:
        ent = git('ls-tree', good, '--', p)
        if ent:
            mode, _, rest = ent.partition(' '); typ, _, rest = rest.partition(' '); sha = rest.split('\t')[0]
            git('update-index', '--add', '--cacheinfo', '%s,%s,%s' % (mode, sha, p), env=env)
        else:
            git('update-index', '--force-remove', '--', p, env=env)
    tree = git('write-tree', '--missing-ok', env=env)
    return tree, paths


def commit(tree, parent, msg):
    env = dict(os.environ, GIT_AUTHOR_NAME='kolaboro deploy guard', GIT_AUTHOR_EMAIL='deploy-guard@kolaboro.com', GIT_COMMITTER_NAME='kolaboro deploy guard', GIT_COMMITTER_EMAIL='deploy-guard@kolaboro.com')
    r = subprocess.run(['git', 'commit-tree', tree, '-p', parent, '-m', msg], capture_output=True, text=True, env=env)
    if r.returncode: raise RuntimeError(r.stderr[:300])
    return r.stdout.strip()


def cf_rollback(good):
    """Instant rollback through the Cloudflare API, only when a Pages-scoped token is configured. Returns a short status string."""
    if not (CF_TOKEN and CF_ACCOUNT): return 'cloudflare api: no token configured'
    def call(method, path):
        req = urllib.request.Request('https://api.cloudflare.com/client/v4/accounts/%s/pages/projects/%s/%s' % (CF_ACCOUNT, CF_PROJECT, path), method=method, headers={'authorization': 'Bearer ' + CF_TOKEN, 'content-type': 'application/json'}, data=b'{}' if method == 'POST' else None)
        with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)
    try:
        deps = call('GET', 'deployments?env=production&per_page=25').get('result') or []
        d = next((x for x in deps if ((x.get('deployment_trigger') or {}).get('metadata') or {}).get('commit_hash') == good), None)
        if not d: return 'cloudflare api: no production deployment of the last good commit in the last 25'
        ok = call('POST', 'deployments/%s/rollback' % d['id']).get('success')
        return 'cloudflare api: rollback ' + ('accepted' if ok else 'refused')
    except Exception as e:
        return 'cloudflare api: error ' + type(e).__name__


MONITOR = '_s/kolaboro.com/data/monitoring.json'
MON = None
def monitor_sample():
    """Synthetic monitoring (n34c, 21 Nov 2026): load the 20 key pages once from this runner (outside Cloudflare) and keep status, time to
    the last byte and bytes on the wire in /data/monitoring.json (30 days). Shown on /engineering/monitoring/. Never fails the guard."""
    global MON
    try:
        try: d = json.loads(git('show', 'origin/%s:%s' % (BRANCH, MONITOR)))
        except Exception: d = {}
        with urllib.request.urlopen(urllib.request.Request(BASE + '/api/x/status/pages', headers={'user-agent': 'kolaboro-deploy-guard/1.0'}), timeout=30) as r: pages = [x['p'] for x in json.load(r)['pages']][:20]
        S = []
        for p in pages:
            t = time.time()
            try:
                with urllib.request.urlopen(urllib.request.Request(BASE + p, headers={'user-agent': 'kolaboro-deploy-guard/1.0 (monitor)', 'accept-encoding': 'br'}), timeout=20) as r: b = r.read(); S.append([p, r.status, round((time.time() - t) * 1000), len(b)])
            except urllib.error.HTTPError as e: S.append([p, e.code, None, 0])
            except Exception: S.append([p, 0, None, 0])
        cut = (datetime.datetime.utcnow() - datetime.timedelta(days=30)).isoformat()
        d['samples'] = [x for x in d.get('samples', []) if x['at'] >= cut] + [{'at': now(), 'vantage': 'GitHub Actions runner (deploy guard)', 'commit': live_commit()[:12], 'pages': S}]
        try: d['links'] = link_check(pages, len(d['samples']))
        except Exception as e: print('link check skipped: %s' % type(e).__name__)
        MON = json.dumps(d, separators=(',', ':')) + '\n'
        print('monitor: %d/%d up' % (sum(1 for x in S if 200 <= x[1] < 400), len(S)))
    except Exception as e: print('monitor skipped: %s' % type(e).__name__)

def link_check(pages, run, per=60):
    """Broken-link check (n39 t3, 25 Nov 2026), inside this existing job: read 6 of the key pages uncompressed, collect their internal
    links and check a rotating slice of 60 of them (HEAD, then GET when HEAD is refused) with 8 at a time, so every run takes a few
    seconds and successive runs cover all links. Result in /data/monitoring.json "links", shown on /engineering/monitoring/#links."""
    import re, concurrent.futures, hashlib
    H = {'user-agent': 'kolaboro-deploy-guard/1.0 (links)'}
    src = {}
    for p in pages[:6]:
        try:
            with urllib.request.urlopen(urllib.request.Request(BASE + p, headers=H), timeout=20) as r: html = r.read().decode('utf-8', 'replace')
        except Exception: continue
        for h in re.findall(r'<a\s[^>]*href="(/[^"#?]*)', html):
            if not h.startswith(('//', '/api/', '/cdn-cgi/', '/__')) and len(h) < 200: src.setdefault(h, p)
    L = sorted(src, key=lambda h: hashlib.sha1(h.encode()).hexdigest())
    if not L: return {'at': now(), 'pages': 0, 'links': 0, 'checked': 0, 'broken': []}
    o = (run * per) % len(L); pick = (L[o:] + L[:o])[:per]
    def chk(h):
        for m in ('HEAD', 'GET'):
            try:
                with urllib.request.urlopen(urllib.request.Request(BASE + h, headers=H, method=m), timeout=15) as r: return h, r.status
            except urllib.error.HTTPError as e:
                if m == 'HEAD' and e.code in (403, 405, 501): continue
                return h, e.code
            except Exception: return h, 0
        return h, 0
    def chk2(h):   # a 5xx or timeout is tried once more 3 s later (a cold page right after a deploy), so only lasting failures are listed
        h, st = chk(h)
        if st >= 500 or st == 0: time.sleep(3); h, st = chk(h)
        return h, st
    with concurrent.futures.ThreadPoolExecutor(8) as ex: R = list(ex.map(chk2, pick))
    bad = [[src[h], h, st] for h, st in R if not (200 <= st < 400)]
    print('links: %d checked of %d, %d broken' % (len(R), len(L), len(bad)))
    return {'at': now(), 'pages': min(6, len(pages)), 'links': len(L), 'checked': len(R), 'broken': bad[:50]}

def publish(state):
    body = json.dumps(state, indent=1) + '\n'
    for _ in range(5):
        tip = fetch()
        idx = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'pub-index'); env = dict(os.environ, GIT_INDEX_FILE=idx)
        if os.path.exists(idx): os.remove(idx)
        git('read-tree', tip, env=env)
        blob = git('hash-object', '-w', '--stdin', inp=body)
        git('update-index', '--add', '--cacheinfo', '100644,%s,%s' % (blob, DEPLOYS), env=env)
        if MON:   # n34c: the monitoring sample of this run goes in the same commit
            try: git('update-index', '--add', '--cacheinfo', '100644,%s,%s' % (git('hash-object', '-w', '--stdin', inp=MON), MONITOR), env=env)
            except Exception: pass
        c = commit(git('write-tree', '--missing-ok', env=env), tip, 'kolaboro.com: deploy guard record %s' % now()[:16])
        if subprocess.run(['git', 'push', '-q', 'origin', '%s:refs/heads/%s' % (c, BRANCH)]).returncode == 0: return c
        time.sleep(5)
    print('could not publish deploys.json'); return ''


def load_state():
    try: s = json.loads(git('show', 'origin/%s:%s' % (BRANCH, DEPLOYS)))
    except Exception: s = {}
    s.setdefault('deploys', []); s.setdefault('drills', [])
    s['about'] = 'Post-deploy guard for kolaboro.com. After each push GitHub Actions waits for the commit to be live, runs the public smoke checks (/open/deploy-smoke.mjs) and, if they fail twice, restores the files changed since the last passing commit. Code: /open/deploy-guard.py.'
    s['canary'] = 'Cloudflare Pages sends each push to all visitors at once and offers no percentage canary, so none is claimed. A bad push can be visible for a few minutes until the rollback is live.'
    s['rollback_mode'] = 'Rollback: ' + ('Cloudflare API rollback to the last good deployment (instant) plus a git commit restoring the files.' if CF_TOKEN else 'a git commit restoring the files changed since the last passing commit; Pages deploys it in about 1 to 2 minutes. An instant Cloudflare API rollback is built in but needs a Pages-scoped token, not configured yet.')
    return s


def keep_checks(state, d):
    """Keep the latest full check list (names, results, details) so the trust center can show outside measurements such as TLS."""
    if d.get('checks'): state['latest_checks'] = {'at': d.get('at') or now(), 'commit': d.get('commit'), 'checks': [{'name': c['name'], 'ok': c['ok'], 'detail': c.get('detail', '')[:160]} for c in d['checks']]}


def provenance(c):
    """Build provenance (n32x, 19 Nov 2026): git tree id of _worker.js at the commit (the exact worker source Pages bundles) and the SHA-256
    of /data/named.json as the live site serves it (from the signed /api/v1/snapshots). Shown on /engineering/provenance/."""
    o = {}
    try:
        t = subprocess.run(['git', 'rev-parse', c + ':_worker.js'], capture_output=True, text=True)
        if t.returncode == 0 and t.stdout.strip(): o['worker_tree'] = t.stdout.strip()
    except Exception: pass
    try:
        with urllib.request.urlopen(urllib.request.Request(BASE + '/api/v1/snapshots', headers={'user-agent': 'kolaboro-deploy-guard/1.0'}), timeout=20) as r:
            s = (json.load(r).get('live') or {}).get('sha256')
            if s: o['dataset_sha256'] = s
    except Exception: pass
    return o


def entry(d, **kw):
    e = {'at': now(), 'commit': d.get('commit') or kw.get('commit'), 'checks_passed': d.get('checks_passed'), 'checks_total': d.get('checks_total'), 'failed': d.get('failed') or [], 'run': RUN}
    e.update(kw)
    if e.get('commit'): e.update(provenance(e['commit']))
    return e


def drill(state, tip):
    live = live_commit(); fetch()
    a = smoke(live); keep_checks(state, a)
    b = smoke(live, inject=True)
    # the live commit can move between the two runs (other pushes), so only the injected check decides whether the failure was caught
    caught = (not b['ok']) and 'drill: injected failure (must fail)' in (b.get('failed') or [])
    cands = [c for c in git('rev-list', '-40', tip).split() if human(c) and guarded_files(c)]
    built = 'no recent change to roll back'
    ok_build = False
    if cands:
        x = cands[0]; good = x + '^'
        tree, paths = restore_tree(tip, git('rev-parse', good), [x])
        c = commit(tree, tip, 'deploy guard DRILL (not pushed): roll back %s' % x[:12])
        same = all(obj(c, p) == obj(good, p) for p in paths)
        later = [p for p in paths if obj(tip, p) != obj(x, p)]
        ok_build = same
        built = 'rollback commit for %s built and checked (%d file(s) restored to their previous version%s), not pushed' % (x[:12], len(paths), ', %d of them changed again later and would also be restored' % len(later) if later else '')
    res = 'passed' if a['ok'] and caught and ok_build else 'failed'
    summary = 'Drill %s. Live smoke on %s: %s/%s checks. Injected failure %s. %s.' % (res, (live or '?')[:12], a.get('checks_passed'), a.get('checks_total'), 'caught' if caught else 'NOT caught', built)
    state['drills'].insert(0, {'at': now(), 'result': res, 'summary': summary, 'live_checks_passed': a.get('checks_passed'), 'live_checks_total': a.get('checks_total'), 'injected_failure_caught': caught, 'rollback_built': ok_build, 'pushed': False, 'run': RUN})
    state['drills'] = state['drills'][:30]
    if a['ok'] and not state.get('last_good'): state['last_good'] = live
    print(summary); return res == 'passed'


def main():
    tip = fetch(); state = load_state()
    if MODE != 'drill': monitor_sample()
    if MODE == 'drill':
        ok = drill(state, tip); state['updated'] = now(); publish(state); return 0 if ok else 1
    target = PUSHED or live_commit()
    if not target: print('production did not answer /api/open/build'); return 1
    if not known(target): fetch()
    last = state.get('last_checked')
    if last and known(last) and (target == last or (is_anc(target, last))): print('already checked'); (publish(state) if MON else None); return 0
    live, waited = wait_live(target)
    if not live:
        state['deploys'].insert(0, {'at': now(), 'commit': target, 'result': 'not_deployed', 'checks_passed': 0, 'checks_total': 0, 'failed': ['commit not live after 12 minutes'], 'wait_s': waited, 'run': RUN})
        state['updated'] = now(); publish(state); return 1
    changes = human_changes(last if last and known(last) and is_anc(last, live) else None, live)
    if not changes and EVENT != 'push': print('only data refreshes since the last check'); state['last_checked'] = live; (publish(state) if MON else None); return 0
    d = smoke(live)
    if not d['ok']:
        time.sleep(90)
        lc = live_commit()
        if lc and lc != live and known(lc) and is_anc(live, lc): live = lc; changes = human_changes(state.get('last_checked') if known(state.get('last_checked') or '') else None, live)
        d = smoke(live)
    keep_checks(state, d)
    if d['ok']:
        state['deploys'].insert(0, entry(d, commit=live, result='pass', wait_s=waited, changes=[c[:12] for c in changes]))
        state['last_checked'] = state['last_good'] = live
        state['deploys'] = state['deploys'][:200]; state['updated'] = now(); publish(state); return 0
    good = state.get('last_good')
    if not good or not known(good) or not is_anc(good, live):
        state['deploys'].insert(0, entry(d, commit=live, result='failed', wait_s=waited, note='no earlier passing commit on record, so nothing was rolled back'))
        state['last_checked'] = live; state['updated'] = now(); publish(state); return 1
    bad = human_changes(good, live)
    cf = cf_rollback(good)
    pushed = ''
    for _ in range(4):
        tip = fetch()
        tree, paths = restore_tree(tip, good, bad)
        c = commit(tree, tip, 'kolaboro deploy guard: roll back %d change(s) since %s (smoke checks failed on %s)\n\nFailed: %s\nRun: %s' % (len(bad), good[:12], live[:12], ', '.join(d.get('failed') or [])[:500], RUN))
        if subprocess.run(['git', 'push', '-q', 'origin', '%s:refs/heads/%s' % (c, BRANCH)]).returncode == 0: pushed = c; break
        time.sleep(5)
    after = {}
    if pushed:
        lc, w2 = wait_live(pushed)
        after = smoke(lc or pushed) if lc else {'ok': False, 'failed': ['rollback not live after 12 minutes']}
    res = 'rolled_back' if after.get('ok') else 'rollback_failed'
    state['deploys'].insert(0, entry(d, commit=live, result=res, wait_s=waited, prev_good=good, rollback_commit=pushed, reverted=[c[:12] for c in bad], files_restored=len(paths) if pushed else 0, cloudflare=cf,
                                     after_rollback={'checks_passed': after.get('checks_passed'), 'checks_total': after.get('checks_total'), 'failed': after.get('failed')}))
    if after.get('ok'): state['last_checked'] = state['last_good'] = (lc or pushed)
    state['deploys'] = state['deploys'][:200]; state['updated'] = now(); publish(state)
    return 1


if __name__ == '__main__':
    sys.exit(main())
