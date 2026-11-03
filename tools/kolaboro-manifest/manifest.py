#!/usr/bin/env python3
"""Kolaboro site manifest and worker build record.

Run by .github/workflows/kolaboro-manifest.yml (schedule, after each deploy). Steps:
 1. Ask the live site which commit it is serving (GET https://kolaboro.com/api/open/build).
 2. List every file under _s/kolaboro.com at that commit (git ls-tree), except /data/, and compute the SHA-256 of each
    file's bytes. A cache of git blob id -> SHA-256 means only files that changed are downloaded.
 3. Write data/site-manifest.json (path -> SHA-256). The worker serves it signed at /api/x/n/manifest.
 4. If the worker source tree (_worker.js) at that commit has no build record yet, bundle _worker.js/index.js twice in two
    separate folders with a pinned esbuild and fixed flags, check both outputs are identical, and add the SHA-256 to
    data/builds.json. The worker serves it signed at /api/x/n/builds.
Outputs go to OUT_DIR (default $RUNNER_TEMP/kbm); the workflow commits them to pub/_lovable only when they changed.
Nothing here is estimated: a step that cannot run says so in the output and the job fails rather than writing a guess.
"""
import datetime, hashlib, json, os, shutil, subprocess, sys, urllib.request

SITE = '_s/kolaboro.com'
EXCLUDE = ('data/',)
ESBUILD = '0.24.2'
FLAGS = ['--bundle', '--format=esm', '--platform=neutral', '--external:node:*', '--log-level=error', '--legal-comments=none', '--charset=utf8']
OUT = os.environ.get('OUT_DIR') or os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'kbm')
CACHE = os.environ.get('BLOB_CACHE') or os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'kbm-cache', 'blobs.json')
PREV_REF = os.environ.get('PREV_REF', 'origin/pub/_lovable')
NORMALIZE = [
    'nonce="..." attributes on <script> tags: the worker stamps a fresh CSP nonce on every script of every HTML response.',
    'Cloudflare email obfuscation: mailto links become /cdn-cgi/l/email-protection#<hex> with a <span class="__cf_email__"> and an injected email-decode.min.js script; the checker decodes the hex back to the address and removes that script.',
    'Scripts the worker appends on two private or campaign pages (src under /__k/), which are not part of the published file.',
    'Only if the hash still does not match: the Google Analytics snippet right before </head> and the Clarity snippet right before </body>, which the deploy adds to pages whose source has none.',
]


def git(*a, inp=None, binary=False):
    r = subprocess.run(['git', *a], input=inp, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError('git %s failed: %s' % (' '.join(a[:3]), r.stderr.decode(errors='replace')[:400]))
    return r.stdout if binary else r.stdout.decode()


def live_commit():
    c = os.environ.get('COMMIT')
    if c:
        return c, 'COMMIT environment variable'
    req = urllib.request.Request('https://kolaboro.com/api/open/build?m=%d' % int(datetime.datetime.now().timestamp()), headers={'user-agent': 'kolaboro-manifest-ci/1.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        j = json.load(r)
    if not j.get('commit') or len(j['commit']) != 40:
        raise SystemExit('live build endpoint did not return a commit: %r' % j)
    return j['commit'], 'https://kolaboro.com/api/open/build'


def ensure_commit(c):
    if os.environ.get('COMMIT_LOCAL') != '1':
        git('fetch', '-q', '--depth=1', '--filter=blob:none', '--no-tags', 'origin', c)


def ls(c, path):
    rows = []
    for line in git('ls-tree', '-r', '-z', c, '--', path).split('\0'):
        if not line:
            continue
        meta, p = line.split('\t', 1)
        mode, typ, oid = meta.split()
        if typ == 'blob':
            rows.append((mode, oid, p))
    return rows


def fetch_blobs(oids):
    """Download the given blobs in one request (the same request git makes for a partial clone's missing objects).
    No per-object existence check: in a partial clone that check itself would download each object one at a time."""
    oids = list(oids)
    if not oids:
        return 0
    for i in range(0, len(oids), 1000):
        part = oids[i:i + 1000]
        r = subprocess.run(['git', '-c', 'fetch.negotiationAlgorithm=noop', 'fetch', '-q', 'origin', '--no-tags', '--no-write-fetch-head',
                            '--recurse-submodules=no', '--filter=blob:none', '--stdin'], input='\n'.join(part).encode(), capture_output=True)
        if r.returncode != 0:
            print('batch blob fetch failed (objects will be fetched one by one):', r.stderr.decode(errors='replace')[:300])
    return len(oids)


def blob_bytes(oids):
    """Yield (oid, bytes) for each oid using one git cat-file --batch process."""
    p = subprocess.Popen(['git', 'cat-file', '--batch'], stdin=subprocess.PIPE, stdout=subprocess.PIPE)
    try:
        for o in oids:
            p.stdin.write((o + '\n').encode()); p.stdin.flush()
            head = p.stdout.readline().decode().split()
            if len(head) < 3 or head[1] != 'blob':
                raise RuntimeError('object %s unreadable: %r' % (o, head))
            n = int(head[2]); data = p.stdout.read(n); p.stdout.read(1)
            yield o, data
    finally:
        p.stdin.close(); p.wait()


def prev_file(name):
    try:
        return json.loads(git('show', '%s:%s/data/%s' % (PREV_REF, SITE, name)))
    except Exception:
        return None


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def manifest(c, how, cache):
    rows = [r for r in ls(c, SITE) if not r[2][len(SITE) + 1:].startswith(EXCLUDE)]
    need = sorted({oid for _, oid, _ in rows if oid not in cache})
    fetched = fetch_blobs(need)
    for oid, data in blob_bytes(need):
        cache[oid] = [hashlib.sha256(data).hexdigest(), len(data)]
    files, total = {}, 0
    for mode, oid, p in sorted(rows, key=lambda r: r[2]):
        h, n = cache[oid]
        files['/' + p[len(SITE) + 1:]] = h
        total += n
    lines = ''.join('%s  %s\n' % (files[k], k) for k in sorted(files))
    m = {
        'version': 'kolaboro-site-manifest-1',
        'about': 'SHA-256 of every file published on kolaboro.com outside /data/, computed by a GitHub Actions job from the git commit the live site was serving. Check a page against it in your browser at https://kolaboro.com/verify#page. It proves the bytes you received match what we published; it does not prove that what we published is correct or safe.',
        'commit': c,
        'commit_time': git('show', '-s', '--format=%cI', c).strip(),
        'commit_from': how,
        'generated_at': now(),
        'run_id': os.environ.get('GITHUB_RUN_ID'),
        'root': SITE,
        'url_rule': 'A page address maps to a file: / -> /index.html, /x/ -> /x/index.html, /x -> /x.html if listed, else /x/index.html. Query strings (?v=...) are ignored.',
        'excluded': ['/data/: published data files change every few minutes; they are fingerprinted by the public log (/log) and the signed open API instead.'],
        'html_normalization': NORMALIZE,
        'count': len(files),
        'bytes': total,
        'list_sha256': hashlib.sha256(lines.encode()).hexdigest(),
        'list_format': 'sha256sum format: one line per file, "<sha256>  <path>\\n", sorted by path',
        'files': files,
    }
    return m, fetched


def builds(c, cache):
    tree = git('rev-parse', c + ':_worker.js').strip()
    prev = prev_file('builds.json') or {}
    entries = prev.get('builds') or []
    if any(e.get('worker_tree') == tree for e in entries):
        return None, tree
    rows = ls(c, '_worker.js')
    fetch_blobs(sorted({oid for _, oid, _ in rows}))
    tool = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'kbm-esbuild')
    if not os.path.exists(os.path.join(tool, 'node_modules', '.bin', 'esbuild')):
        os.makedirs(tool, exist_ok=True)
        subprocess.run(['npm', 'install', '--silent', '--no-audit', '--no-fund', '--prefix', tool, 'esbuild@' + ESBUILD], check=True)
    esb = os.path.join(tool, 'node_modules', '.bin', 'esbuild')
    ver = subprocess.run([esb, '--version'], capture_output=True, text=True, check=True).stdout.strip()
    if ver != ESBUILD:
        raise SystemExit('esbuild version %s, expected %s' % (ver, ESBUILD))
    data = dict(blob_bytes([oid for _, oid, _ in rows]))
    outs = []
    for k in ('a', 'b'):   # two clean folders: the same input must give the same bytes
        d = os.path.join(os.environ.get('RUNNER_TEMP', '/tmp'), 'kbm-build-' + k)
        shutil.rmtree(d, ignore_errors=True)
        for mode, oid, p in rows:
            f = os.path.join(d, p); os.makedirs(os.path.dirname(f), exist_ok=True)
            with open(f, 'wb') as fh: fh.write(data[oid])
        subprocess.run([esb, '_worker.js/index.js', *FLAGS, '--outfile=out/worker.js'], cwd=d, check=True)
        with open(os.path.join(d, 'out', 'worker.js'), 'rb') as fh:
            b = fh.read()
        outs.append((hashlib.sha256(b).hexdigest(), len(b)))
        shutil.rmtree(d, ignore_errors=True)
    e = {
        'worker_tree': tree,
        'first_commit': c,
        'commit_time': git('show', '-s', '--format=%cI', c).strip(),
        'built_at': now(),
        'sha256': outs[0][0],
        'bytes': outs[0][1],
        'reproduced': outs[0] == outs[1],
        'node': subprocess.run(['node', '--version'], capture_output=True, text=True).stdout.strip(),
        'run_id': os.environ.get('GITHUB_RUN_ID'),
    }
    entries = [e] + entries
    out = {
        'version': 'kolaboro-builds-1',
        'about': 'Deterministic bundle of the kolaboro.com worker (_worker.js/index.js and everything it imports) for each worker source tree that went live. Built twice in two clean folders; "reproduced" says whether both builds gave identical bytes.',
        'how': {'esbuild': ESBUILD, 'command': 'esbuild _worker.js/index.js ' + ' '.join(FLAGS) + ' --outfile=out/worker.js', 'cwd': 'repository root at first_commit',
                'lookup': 'For any commit X: git rev-parse X:_worker.js gives the worker_tree to look up here.'},
        'limits': [
            'The source repository is private, so today only people with access can rebuild and compare. Public reproducibility will live in the open verifiers repository (kolaboro-open), which is not public yet.',
            'Cloudflare Pages bundles the worker itself when it deploys, with its own tool versions. This hash is of our pinned bundle of the same source, not of the bytes running at the edge, which Cloudflare does not let anyone download.',
        ],
        'updated': now(),
        'builds': entries[:300],
    }
    return out, tree


def main():
    os.makedirs(OUT, exist_ok=True)
    c, how = live_commit()
    ensure_commit(c)
    cache = {}
    try:
        with open(CACHE) as f: cache = json.load(f)
    except Exception:
        pass
    m, fetched = manifest(c, how, cache)
    prev = prev_file('site-manifest.json')
    if prev and prev.get('files') == m['files']:
        print('manifest: files unchanged since commit %s (%d files)' % (prev.get('commit', '?')[:12], m['count']))
    else:
        with open(os.path.join(OUT, 'site-manifest.json'), 'w') as f:
            json.dump(m, f, indent=0, sort_keys=False); f.write('\n')
        print('manifest: %d files, %d bytes, %d blobs downloaded, commit %s' % (m['count'], m['bytes'], fetched, c[:12]))
    b, tree = builds(c, cache)
    if b:
        with open(os.path.join(OUT, 'builds.json'), 'w') as f:
            json.dump(b, f, indent=1); f.write('\n')
        e = b['builds'][0]
        print('builds: worker tree %s -> %s (%d bytes), reproduced=%s' % (tree[:12], e['sha256'][:16], e['bytes'], e['reproduced']))
        if not e['reproduced']:
            print('::warning::two builds of the same worker source gave different bytes')
    else:
        print('builds: worker tree %s already recorded' % tree[:12])
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    live = {oid for oid in cache}  # keep the cache bounded
    if len(live) > 20000:
        cache = dict(list(cache.items())[-20000:])
    with open(CACHE, 'w') as f: json.dump(cache, f)


if __name__ == '__main__':
    main()
