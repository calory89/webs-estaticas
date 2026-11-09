#!/usr/bin/env python3
"""Kolaboro open data catalog job (block T6, batch 6).

Measures every public file under kolaboro.com/data/ as it is served live (bytes, SHA-256, rows, own timestamp), checks it
against its data contract (JSON Schema 2020-12 in schemas.json), measures freshness against a target derived from the
schedule of the workflow that writes it, checks the live API against the OpenAPI description (openapi.json) and validates
that description, then writes:

  data/catalog.json          machine-readable catalog (read by the worker for /api/x/data/freshness)
  data/catalog.jsonld        DCAT-AP 2 catalog in JSON-LD
  data/contracts.json        pass or fail per file and per API operation, first errors
  data/schemas/kolaboro-data.schema.json   the contracts (one schema with $defs per dataset)
  data/index.html            the /data/ page (only the generated blocks between kd markers are replaced)
  docs/api/openapi.json      the OpenAPI 3.1 description
  llms-full.txt              plain-text guide for AI assistants, generated from the catalog and the spec

Usage: build.py --files <list of repo paths under _s/kolaboro.com/data/> --out <dir> [--page <current data/index.html>]
       [--commits] (look up the last commit of each file on pub/_lovable with the GitHub API)
Exit code: 0 when every contract passes, 2 when a contract fails (outputs are written either way), 1 on a crash.
"""
import argparse, concurrent.futures as cf, hashlib, html, io, json, os, re, subprocess, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = 'https://kolaboro.com'
ROOT = '_s/kolaboro.com/data/'
UA = 'KolaboroDataCatalog/1.0 (+https://kolaboro.com/data/)'
SANDBOX = 'kb_sandbox_public'
REPO = os.environ.get('GITHUB_REPOSITORY', 'calory89/webs-estaticas')
LIC_URI = {'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'Public domain': 'https://www.naturalearthdata.com/about/terms-of-use/'}
MEDIA = {'json': 'application/json', 'parquet': 'application/vnd.apache.parquet', 'webp': 'image/webp', 'bin': 'application/octet-stream', 'html': 'text/html'}
FREQ = {1: 'HOURLY', 24: 'DAILY', 168: 'WEEKLY', 744: 'MONTHLY'}


def freq_of(h):
    # EU frequency vocabulary term for an update interval in hours. Intervals that are not exactly hourly, daily, weekly or monthly
    # (a cron moved to every 2 days, a 720 hour month...) map to the nearest term instead of None, which crashed the DCAT export.
    try: h = float(h)
    except (TypeError, ValueError): return 'IRREG'
    if h in FREQ: return FREQ[h]
    if h <= 1.5: return 'HOURLY'
    if h <= 36: return 'DAILY'
    if h <= 252: return 'WEEKLY'
    if h <= 504: return 'BIWEEKLY'
    if h <= 1100: return 'MONTHLY'
    if h <= 3300: return 'QUARTERLY'
    return 'ANNUAL'
NOW = datetime.now(timezone.utc)
STAMP = NOW.strftime('%Y-%m-%dT%H:%M:%SZ')


# ------------------------------------------------------------------ helpers
def get(url, headers=None, timeout=60, tries=3):
    last = None
    for i in range(tries):
        req = urllib.request.Request(url, headers={'user-agent': UA, 'accept': '*/*', **(headers or {})})
        t = time.time()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, dict(r.headers), r.read(), time.time() - t
        except urllib.error.HTTPError as e:
            return e.code, dict(e.headers), e.read(), time.time() - t
        except Exception as e:
            last = e; time.sleep(2 + 3 * i)
    return 0, {}, str(last).encode(), 0


def parse_time(v):
    """ISO date or date-time -> (aware datetime, date_only)."""
    if not isinstance(v, str): return None, False
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', v)
    if m: return datetime(int(m[1]), int(m[2]), int(m[3]), tzinfo=timezone.utc), True
    try:
        d = datetime.fromisoformat(v.replace('Z', '+00:00'))
        return (d if d.tzinfo else d.replace(tzinfo=timezone.utc)), False
    except Exception:
        return None, False


def target_hours(interval, date_only):
    """Freshness target from the workflow interval: twice the interval up to daily, the interval plus two days beyond;
    one more day when the file only states a date (its stamp counts from 00:00 UTC of that day)."""
    if not interval: return None
    t = 2 * interval if interval <= 24 else interval + 48
    return t + (24 if date_only else 0)


def human_hours(h):
    if h is None: return None
    if h < 48: return f'{h:g} hours' if h != 1 else '1 hour'
    d = h / 24
    return f'{d:g} days'


def fmt_bytes(n):
    for u in ['bytes', 'KB', 'MB', 'GB']:
        if n < 1024 or u == 'GB': return (f'{n:,} bytes' if u == 'bytes' else f'{n:.1f} {u}')
        n /= 1024


def last_commit(path):
    """Last commit on pub/_lovable touching a path, from the GitHub API (needs GH_TOKEN or GITHUB_TOKEN)."""
    tok = os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN')
    if not tok: return None
    url = f'https://api.github.com/repos/{REPO}/commits?sha=pub/_lovable&per_page=1&path={urllib.request.quote(path)}'
    st, _, body, _ = get(url, {'authorization': 'Bearer ' + tok, 'accept': 'application/vnd.github+json'}, 30)
    if st != 200: return None
    try:
        j = json.loads(body)
        return j[0]['commit']['committer']['date'] if j else None
    except Exception:
        return None


def errs_of(validator, doc, n=5):
    out = []
    for e in sorted(validator.iter_errors(doc), key=lambda e: list(e.absolute_path))[:n]:
        loc = '/' + '/'.join(str(x) for x in e.absolute_path)
        msg = e.message if len(e.message) < 220 else e.message[:220] + '...'
        out.append(f'{loc}: {msg}')
    return out


def probe_ok(raw, key, value):
    """Can the worker find this file's own timestamp by reading only its first 64 KB? (first occurrence of the key)"""
    head = raw[:65536].decode('utf-8', 'ignore')
    m = re.search(r'"' + re.escape(key) + r'"\s*:\s*"([^"]{4,40})"', head)
    return bool(m and m.group(1) == value)


# ------------------------------------------------------------------ main work
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--files', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--page'); ap.add_argument('--commits', action='store_true'); ap.add_argument('--run-url', default=os.environ.get('RUN_URL'))
    a = ap.parse_args()
    import jsonschema
    reg = json.load(open(os.path.join(HERE, 'registry.json')))
    schemas = json.load(open(os.path.join(HERE, 'schemas.json')))
    spec = json.load(open(os.path.join(HERE, 'openapi.json')))
    lic_default = reg['licence_default']
    files = sorted(l.strip()[len(ROOT):] for l in open(a.files) if l.strip().startswith(ROOT))
    files = [f for f in files if f and f not in ('index.html', 'catalog.json', 'catalog.jsonld', 'contracts.json') and not f.startswith('schemas/') and not f.startswith('licence/')]

    # which registry entry owns which file
    owner, sets = {}, {}
    for d in reg['datasets']:
        sets[d['id']] = []
        for f in files:
            if d.get('path') == f or (d.get('prefix') and f.startswith(d['prefix'])) or (d.get('extra_prefix') and f.startswith(d['extra_prefix'])):
                owner[f] = d['id']; sets[d['id']].append(f)
    undescribed = [f for f in files if f not in owner]

    # fetch every file live (what a visitor gets), in parallel
    def fetch(f):
        st, h, body, secs = get(BASE + '/data/' + urllib.request.quote(f), timeout=90)
        return f, st, h, body
    got = {}
    with cf.ThreadPoolExecutor(16) as ex:
        for f, st, h, body in ex.map(fetch, files): got[f] = (st, h, body)
    print(f'fetched {len(got)} files, {sum(len(v[2]) for v in got.values()):,} bytes', file=sys.stderr)

    defs = schemas.get('$defs', {})
    reg_v = jsonschema.validators.Draft202012Validator
    root_schema = dict(schemas)

    def contract(def_name, doc):
        if def_name not in defs: return 'no_contract', ['no contract written for this file yet']
        sch = {'$schema': 'https://json-schema.org/draft/2020-12/schema', '$defs': defs, '$ref': '#/$defs/' + def_name}
        e = errs_of(reg_v(sch), doc)
        return ('pass' if not e else 'fail'), e

    commits = {}
    if a.commits:
        targets = [ROOT + (d.get('path') or d.get('prefix', '').rstrip('/')) for d in reg['datasets']] + [ROOT + f for f in undescribed]
        with cf.ThreadPoolExecutor(8) as ex:
            for p, c in zip(targets, ex.map(last_commit, targets)): commits[p] = c

    cases_sha = None
    if 'bali-cases.json' in got and got['bali-cases.json'][0] == 200: cases_sha = hashlib.sha256(got['bali-cases.json'][2]).hexdigest()
    pq_manifest = None
    if 'kolaboro.parquet.json' in got and got['kolaboro.parquet.json'][0] == 200:
        try: pq_manifest = json.loads(got['kolaboro.parquet.json'][2])
        except Exception: pass

    datasets, contract_rows = [], []
    for d in reg['datasets'] + [{'id': 'undescribed-' + re.sub(r'[^a-z0-9]+', '-', f.lower()).strip('-'), 'path': f, 'title': f, 'kind': 'undescribed', 'description': 'Published under /data/ but not yet described in the catalog registry.', 'workflow': None, 'schedule': 'unknown', 'interval_hours': None, 'stamp': None, 'rows': None, 'keywords': []} for f in undescribed]:
        fl = sets.get(d['id']) or ([d['path']] if d.get('path') in got else [])
        if not fl:
            datasets.append(dict(d, missing=True)); continue
        main_f = d.get('path') or None
        fmt = d.get('format') or (main_f.rsplit('.', 1)[-1] if main_f else 'json')
        entry = {k: d.get(k) for k in ('id', 'title', 'description', 'kind', 'workflow', 'schedule', 'interval_hours', 'keywords')}
        entry['licence'] = d.get('licence') or lic_default
        entry['described'] = d['kind'] != 'undescribed'
        total, rows, stamp_v, stamp_key, doc = 0, None, None, d.get('stamp'), None
        per = []
        for f in fl:
            st, h, body = got[f]
            sha = hashlib.sha256(body).hexdigest() if st == 200 else None
            per.append({'path': f, 'url': BASE + '/data/' + f, 'http': st, 'bytes': len(body) if st == 200 else None, 'sha256': sha})
            if st == 200: total += len(body)
        entry['bytes'] = total
        if main_f:
            p0 = per[[x['path'] for x in per].index(main_f)] if main_f in [x['path'] for x in per] else per[0]
            entry['url'] = p0['url']; entry['sha256'] = p0['sha256']; entry['http'] = p0['http']
            entry['media_type'] = MEDIA.get(main_f.rsplit('.', 1)[-1], 'application/octet-stream')
            entry['format'] = fmt
            extra = [x for x in per if x['path'] != main_f]
            if extra: entry['extra_files'] = extra
        else:
            entry['url'] = BASE + '/data/' + d['prefix']
            entry['file_count'] = len(per)
            lines = ''.join(f"{x['sha256']}  {x['path']}\n" for x in sorted(per, key=lambda x: x['path']))
            entry['sha256'] = hashlib.sha256(lines.encode()).hexdigest()
            entry['sha256_of'] = 'the sorted list of "sha256  path" lines, one per file (sha256sum format)'
            entry['format'] = fmt
            entry['media_type'] = MEDIA.get(fl[0].rsplit('.', 1)[-1], 'application/octet-stream')
            entry['files'] = per if len(per) <= 20 else None
            entry['download_hint'] = 'One file per ' + ('tile' if d['prefix'].rstrip('/') in ('coast', 'mangroves') else 'item') + ': ' + ', '.join(x['path'] for x in sorted(per, key=lambda x: x['path'])[:3]) + ' ...'
        # parse, contract, rows, own timestamp
        cres = []
        for x in per:
            f = x['path']; st, h, body = got[f]
            if st == 404: cres.append({'path': f, 'status': 'not_live', 'errors': ['in the live branch but not served yet (a deploy is probably in progress)']}); continue
            if st != 200: cres.append({'path': f, 'status': 'fail', 'errors': [f'HTTP {st}']}); continue
            ext = f.rsplit('.', 1)[-1]
            if ext == 'json':
                try: j = json.loads(body)
                except Exception as e: cres.append({'path': f, 'status': 'fail', 'errors': ['not valid JSON: ' + str(e)[:200]]}); continue
                cname = d['id'] if d.get('path') else d['id'] + '-file'
                if d['id'] == 'benchmark': cname = 'benchmark-file'
                s_, e_ = contract(cname, j)
                cres.append({'path': f, 'status': s_, 'errors': e_, 'contract': '#/$defs/' + cname})
                if f == main_f or (not main_f and doc is None): doc = j
            elif ext == 'parquet':
                s_, e_, nrows = parquet_check(f, body, pq_manifest)
                cres.append({'path': f, 'status': s_, 'errors': e_, 'contract': 'columns and row count of /data/kolaboro.parquet.json'})
                rows = nrows
            elif ext == 'webp':
                ok = body[:4] == b'RIFF' and body[8:12] == b'WEBP'
                cres.append({'path': f, 'status': 'pass' if ok else 'fail', 'errors': [] if ok else ['not a WebP file (RIFF....WEBP header missing)'], 'contract': 'WebP header'})
            elif ext == 'bin':
                ok = body[:4] == b'GMW1' and len(body) >= 8
                cres.append({'path': f, 'status': 'pass' if ok else 'fail', 'errors': [] if ok else ['missing GMW1 header'], 'contract': 'GMW1 header'})
            else:
                cres.append({'path': f, 'status': 'no_contract', 'errors': []})
        # a tile set is summarised as one row (with the failing tiles listed)
        if not main_f and len(cres) > 20:
            bad = [c for c in cres if c['status'] == 'fail']
            contract_rows.append({'dataset': d['id'], 'path': d['prefix'] + ' (' + str(len(cres)) + ' files)', 'status': 'fail' if bad else ('pass' if any(c['status'] == 'pass' for c in cres) else 'no_contract'),
                                  'errors': [c['path'] + ': ' + '; '.join(c['errors'][:2]) for c in bad[:5]], 'contract': cres[0].get('contract')})
        else:
            for c in cres: contract_rows.append(dict(c, dataset=d['id']))
        entry['contract'] = 'fail' if any(c['status'] == 'fail' for c in cres) else 'pass' if any(c['status'] == 'pass' for c in cres) else 'not_live' if any(c['status'] == 'not_live' for c in cres) else 'no_contract'
        entry['schema_url'] = BASE + '/api/x/data/schema/' + d['id'] + '.json' if (d['id'] in defs or d['id'] + '-file' in defs or (d['id'] == 'benchmark' and 'benchmark-file' in defs)) else None
        if d['kind'] == 'undescribed' and isinstance(doc, dict):
            said = next((doc[k] for k in ('what', 'about', 'description') if isinstance(doc.get(k), str)), None)
            if said: entry['description'] = 'Not yet described in the catalog registry. The file describes itself as: ' + said
            stamp_key = next((k for k in ('updated', 'generated_at', 'generated', 'date') if isinstance(doc.get(k), str)), None)
        # rows
        rr = d.get('rows') or {}
        if rr.get('files'): rows = len(per)
        elif rr.get('key') and isinstance(doc, dict):
            v = doc.get(rr['key'])
            rows = len(v) if isinstance(v, (list, dict)) else (v if isinstance(v, int) else None)
            if d['id'] == 'benchmark': rows = sum(len((json.loads(got[x['path']][2]) or {}).get('cases') or []) for x in per if got[x['path']][0] == 200)
        entry['rows'] = rows; entry['rows_unit'] = rr.get('unit')
        # own timestamp
        stamp_src = d.get('stamp_from')
        sdoc = doc
        if stamp_src:
            src = next((z for z in reg['datasets'] if z['id'] == stamp_src), None)
            stamp_key = src.get('stamp') if src else None
            sdoc = pq_manifest
        if stamp_key and isinstance(sdoc, dict) and isinstance(sdoc.get(stamp_key), str): stamp_v = sdoc.get(stamp_key)
        if d['id'] == 'benchmark' and isinstance(doc, dict):
            vals = [json.loads(got[x['path']][2]).get('started') for x in per if got[x['path']][0] == 200]
            vals = [v for v in vals if isinstance(v, str)]
            stamp_v = max(vals) if vals else None
        when, date_only = parse_time(stamp_v)
        pub = commits.get(ROOT + (d.get('path') or (d.get('prefix') or '').rstrip('/')))
        pub_t, _ = parse_time(pub)
        as_of = when or pub_t
        tgt = target_hours(d.get('interval_hours'), date_only if when else False)
        age = round((NOW - as_of).total_seconds() / 3600, 2) if as_of else None
        fr = {'stamp_key': stamp_key if stamp_v else None, 'stamp': stamp_v, 'date_only': date_only if when else None, 'published_at': pub,
              'data_as_of': as_of.strftime('%Y-%m-%dT%H:%M:%SZ') if as_of else None, 'target_hours': tgt, 'age_hours': age, 'event_driven': bool(d.get('event'))}
        if main_f and stamp_v and not stamp_src and main_f.endswith('.json'):
            fr['probe'] = probe_ok(got[main_f][2], stamp_key, stamp_v)
        if stamp_src: fr['probe_file'] = 'kolaboro.parquet.json'; fr['probe'] = probe_ok(got['kolaboro.parquet.json'][2], stamp_key, stamp_v) if 'kolaboro.parquet.json' in got else False
        if d.get('sync_with') == 'bali-cases' and pq_manifest and cases_sha:
            fr['source_sha256'] = (pq_manifest.get('source') or {}).get('sha256'); fr['source_now_sha256'] = cases_sha
            fr['in_sync'] = fr['source_sha256'] == cases_sha
        fr['status'] = status_of(fr)
        entry['freshness'] = fr
        entry['last_updated'] = fr['data_as_of']
        entry['frequency'] = freq_of(d.get('interval_hours')) if d.get('interval_hours') else ('IRREG' if d.get('event') or d.get('workflow') else ('NEVER' if d['kind'] in ('tiles', 'sample') else 'IRREG'))
        datasets.append(entry)

    # ------------------------------------------------------------------ API contract check against the live API
    api_rows = []
    for path, item in spec['paths'].items():
        op = item['get']; url = op.get('x-kolaboro-example-url')
        if not url or path.endswith('/openapi.json') and path.startswith('/api/x/data'): continue
        hdr = {'x-api-key': SANDBOX} if op.get('security') else {}
        st, h, body, secs = get(url, hdr, 120)
        r = op['responses'].get(str(st))
        row = {'path': path, 'url': url, 'http': st, 'ms': int(secs * 1000)}
        if not r:
            row.update(status='fail', errors=[f'answered HTTP {st}, which the description does not list'])
        else:
            content = r.get('content') or {}
            mt = next(iter(content), None)
            ct = (h.get('Content-Type') or h.get('content-type') or '').split(';')[0].strip()
            if mt and mt != 'application/json':
                row.update(status='pass' if ct == mt or (mt == 'text/plain' and ct.startswith('text/')) else 'fail', errors=[] if ct == mt or mt == 'text/plain' else [f'content type {ct}, described {mt}'])
            elif mt:
                try:
                    j = json.loads(body)
                    sch = dict(content[mt].get('schema') or {})
                    sch = {'$schema': 'https://json-schema.org/draft/2020-12/schema', 'components': spec.get('components', {}), **sch}
                    e = errs_of(reg_v(sch), j, 3)
                    row.update(status='pass' if not e else 'fail', errors=e)
                except Exception as e:
                    row.update(status='fail', errors=['not JSON: ' + str(e)[:160]])
            else:
                row.update(status='pass', errors=[])
        api_rows.append(row)

    # ------------------------------------------------------------------ OpenAPI validation
    try:
        from openapi_spec_validator import validate as oas_validate
        from importlib.metadata import version as pv
        oas_validate(spec); spec_valid, spec_err = True, None; validator_name = 'openapi-spec-validator ' + pv('openapi-spec-validator')
    except Exception as e:
        spec_valid, spec_err, validator_name = False, str(e)[:500], 'openapi-spec-validator'

    files_pass = sum(1 for c in contract_rows if c['status'] == 'pass'); files_fail = sum(1 for c in contract_rows if c['status'] == 'fail')
    api_pass = sum(1 for c in api_rows if c['status'] == 'pass'); api_fail = sum(1 for c in api_rows if c['status'] == 'fail')
    fresh = [x for x in datasets if not x.get('missing')]
    fr_ok = sum(1 for x in fresh if x['freshness']['status'] == 'ok'); fr_late = sum(1 for x in fresh if x['freshness']['status'] == 'late')
    summary = {'datasets': len(fresh), 'files': sum(x.get('file_count') or 1 + len(x.get('extra_files') or []) for x in fresh), 'bytes': sum(x['bytes'] for x in fresh),
               'contracts_pass': files_pass, 'contracts_fail': files_fail, 'api_operations': len(spec['paths']), 'api_checks_pass': api_pass, 'api_checks_fail': api_fail,
               'spec_valid': spec_valid, 'fresh_ok': fr_ok, 'fresh_late': fr_late, 'fresh_no_target': len(fresh) - fr_ok - fr_late, 'undescribed': len(undescribed),
               'missing': [x['id'] for x in datasets if x.get('missing')]}
    rules = {
        'freshness': 'Target = twice the run interval of the workflow that writes the file when it runs daily or more often, the interval plus 2 days when it runs weekly or monthly, plus 1 day when the file states only a date (counted from 00:00 UTC). Age = now minus the timestamp the file itself states (or, without one, the time of the last commit that published it). No target for files written by hand, on demand or after events. The Parquet files also count as fresh while they were built from the current bali-cases.json.',
        'contracts': 'Each JSON file is validated against its JSON Schema (2020-12) in /data/schemas/kolaboro-data.schema.json. The contracts were written from the files as published on 5 Nov 2026: every top-level key is required with its type, items of top-level lists and maps must keep the keys every item had, numbers are "number", deeper optional values may be null. Parquet files are checked against the columns and row count in kolaboro.parquet.json, tiles and screenshots against their binary headers. API answers are validated against the response schemas in /docs/api/openapi.json, which were inferred from live responses.',
        'sizes_hashes': 'Bytes and SHA-256 are of the exact bytes https://kolaboro.com/data/ served to the job. A tile set has one SHA-256 over the sorted "sha256  path" lines of its files.',
    }
    catalog = {'version': 'kolaboro-data-catalog-1', 'generated_at': STAMP, 'run_url': a.run_url, 'base': BASE, 'licence_default': lic_default,
               'summary': summary, 'rules': rules,
               'links': {'page': BASE + '/data/', 'dcat': BASE + '/data/catalog.jsonld', 'contracts': BASE + '/data/contracts.json', 'schemas': BASE + '/data/schemas/kolaboro-data.schema.json',
                         'freshness_api': BASE + '/api/x/data/freshness', 'openapi': BASE + '/docs/api/openapi.json', 'explorer': BASE + '/docs/api/explorer/', 'llms_full': BASE + '/llms-full.txt'},
               'datasets': datasets}
    contracts = {'version': 'kolaboro-data-contracts-1', 'generated_at': STAMP, 'run_url': a.run_url, 'validator': 'python-jsonschema ' + __import__('importlib.metadata').metadata.version('jsonschema') + ' (Draft 2020-12)',
                 'summary': {'files_pass': files_pass, 'files_fail': files_fail, 'files_no_contract': sum(1 for c in contract_rows if c['status'] == 'no_contract'), 'api_pass': api_pass, 'api_fail': api_fail,
                             'spec_valid': spec_valid, 'spec_validator': validator_name, 'spec_error': spec_err},
                 'rules': rules['contracts'], 'files': contract_rows, 'api': api_rows}

    out = a.out
    for sub in ['data/schemas', 'docs/api']: os.makedirs(os.path.join(out, sub), exist_ok=True)
    w = lambda p, s: open(os.path.join(out, p), 'w').write(s)
    w('data/catalog.json', json.dumps(catalog, indent=1, ensure_ascii=False) + '\n')
    w('data/contracts.json', json.dumps(contracts, indent=1, ensure_ascii=False) + '\n')
    w('data/schemas/kolaboro-data.schema.json', json.dumps(schemas, indent=1, ensure_ascii=False) + '\n')
    w('data/catalog.jsonld', json.dumps(dcat(catalog, spec), indent=1, ensure_ascii=False) + '\n')
    w('docs/api/openapi.json', json.dumps(spec, indent=1, ensure_ascii=False) + '\n')
    page_src = open(a.page).read() if a.page and os.path.exists(a.page) and '<!--kd:start-->' in open(a.page).read() else open(os.path.join(HERE, 'page.html')).read()
    w('data/index.html', render_page(page_src, catalog, contracts, spec))
    w('llms-full.txt', llms_full(catalog, contracts, spec))
    print(json.dumps(summary), file=sys.stderr)
    ok = files_fail == 0 and api_fail == 0 and spec_valid
    open(os.path.join(out, 'status.txt'), 'w').write('pass\n' if ok else 'fail\n')
    return 0 if ok else 2


def status_of(fr):
    if fr.get('in_sync'): return 'ok'
    if fr['target_hours'] is None or fr['age_hours'] is None: return 'no_target'
    return 'ok' if fr['age_hours'] <= fr['target_hours'] else 'late'


def parquet_check(f, body, man):
    try:
        import pyarrow.parquet as pq
    except Exception:
        return 'no_contract', ['pyarrow not installed on the runner'], None
    try:
        t = pq.read_table(io.BytesIO(body))
    except Exception as e:
        return 'fail', ['cannot be read as Parquet: ' + str(e)[:200]], None
    errs = []
    m = next((x for x in (man or {}).get('files', []) if x.get('path') == '/data/' + f), None)
    if not m: return 'fail', ['not listed in kolaboro.parquet.json'], t.num_rows
    want = [c['name'] for c in m.get('columns', [])]
    have = t.schema.names
    if want != have: errs.append(f'columns differ from the manifest: missing {sorted(set(want) - set(have))[:5]}, extra {sorted(set(have) - set(want))[:5]}')
    if m.get('rows') != t.num_rows: errs.append(f'{t.num_rows} rows, manifest says {m.get("rows")}')
    if m.get('sha256') and m['sha256'] != hashlib.sha256(body).hexdigest(): errs.append('SHA-256 differs from the manifest')
    return ('pass' if not errs else 'fail'), errs, t.num_rows


# ------------------------------------------------------------------ DCAT-AP JSON-LD
def lic_uri(l):
    for k, v in LIC_URI.items():
        if l.startswith(k) or k in l: return v
    return LIC_URI['CC BY 4.0']


def dcat(cat, spec):
    pub = {'@id': BASE + '/#org', '@type': 'foaf:Agent', 'foaf:name': 'Kolaboro', 'foaf:homepage': {'@id': BASE + '/'}}
    ds = []
    for x in cat['datasets']:
        if x.get('missing'): continue
        dist = {'@id': BASE + '/data/#' + x['id'] + '-dist', '@type': 'dcat:Distribution', 'dct:title': x['title'], 'dcat:mediaType': {'@id': 'https://www.iana.org/assignments/media-types/' + x['media_type']},
                'dct:license': {'@id': lic_uri(x['licence'])}, 'dcat:byteSize': {'@value': str(x['bytes']), '@type': 'xsd:nonNegativeInteger'}}
        if x.get('file_count'):
            dist['dcat:accessURL'] = {'@id': BASE + '/data/#' + x['id']}
            dist['dct:description'] = f"{x['file_count']} files under {x['url']}. {x.get('download_hint') or ''}".strip()
        else:
            dist['dcat:downloadURL'] = {'@id': x['url']}; dist['dcat:accessURL'] = {'@id': x['url']}
        if x.get('sha256'): dist['spdx:checksum'] = {'@type': 'spdx:Checksum', 'spdx:algorithm': {'@id': 'spdx:checksumAlgorithm_sha256'}, 'spdx:checksumValue': x['sha256']}
        if x.get('schema_url'): dist['dct:conformsTo'] = {'@id': x['schema_url']}
        d = {'@id': BASE + '/data/#' + x['id'], '@type': 'dcat:Dataset', 'dct:identifier': x['id'], 'dct:title': x['title'], 'dct:description': x['description'],
             'dcat:keyword': x.get('keywords') or [], 'dct:publisher': {'@id': BASE + '/#org'}, 'dct:license': {'@id': lic_uri(x['licence'])}, 'dct:rights': x['licence'],
             'dcat:landingPage': {'@id': BASE + '/data/#' + x['id']}, 'dcat:distribution': [dist],
             'dct:accrualPeriodicity': {'@id': 'http://publications.europa.eu/resource/authority/frequency/' + (x.get('frequency') or 'IRREG')}}
        if x.get('last_updated'): d['dct:modified'] = {'@value': x['last_updated'], '@type': 'xsd:dateTime'}
        if x.get('schema_url'): d['dct:conformsTo'] = {'@id': x['schema_url']}
        ds.append(d)
    return {
        '@context': {'dcat': 'http://www.w3.org/ns/dcat#', 'dct': 'http://purl.org/dc/terms/', 'foaf': 'http://xmlns.com/foaf/0.1/', 'spdx': 'http://spdx.org/rdf/terms#', 'xsd': 'http://www.w3.org/2001/XMLSchema#', 'adms': 'http://www.w3.org/ns/adms#'},
        '@id': BASE + '/data/catalog.jsonld', '@type': 'dcat:Catalog', 'dct:title': 'Kolaboro open data catalog',
        'dct:description': 'Every public dataset of kolaboro.com (off-plan property due diligence): what developers advertise, what registers and satellites show, and how the service itself is checked. Sizes, hashes and dates measured by a daily job.',
        'dct:publisher': pub, 'foaf:homepage': {'@id': BASE + '/data/'}, 'dct:language': {'@id': 'http://publications.europa.eu/resource/authority/language/ENG'},
        'dct:modified': {'@value': cat['generated_at'], '@type': 'xsd:dateTime'}, 'dct:license': {'@id': LIC_URI['CC BY 4.0']},
        'dcat:service': [{'@id': BASE + '/api/open', '@type': 'dcat:DataService', 'dct:title': spec['info']['title'], 'dcat:endpointURL': {'@id': BASE + '/api/open'},
                          'dcat:endpointDescription': {'@id': BASE + '/docs/api/openapi.json'}, 'dct:license': {'@id': LIC_URI['CC BY 4.0']}, 'dcat:servesDataset': [{'@id': BASE + '/data/#bali-cases'}]}],
        'dcat:dataset': ds}


# ------------------------------------------------------------------ page
E = lambda s: html.escape(str(s if s is not None else ''), quote=True)
LABEL = {'data': 'Data about projects and markets', 'operations': 'How the service checks itself', 'tiles': 'Map tiles used by the checks', 'sample': 'Samples (not real data)', 'undescribed': 'Not yet described'}


def schema_org(cat):
    out = []
    for x in cat['datasets']:
        if x.get('missing') or x['kind'] in ('undescribed',): continue
        d = {'@type': 'Dataset', '@id': BASE + '/data/#' + x['id'], 'name': x['title'], 'description': x['description'], 'url': BASE + '/data/#' + x['id'], 'identifier': x['id'],
             'keywords': x.get('keywords') or [], 'license': lic_uri(x['licence']), 'isAccessibleForFree': True,
             'creator': {'@type': 'Organization', 'name': 'Kolaboro', 'url': BASE + '/'}, 'includedInDataCatalog': {'@type': 'DataCatalog', 'name': 'Kolaboro open data catalog', 'url': BASE + '/data/'}}
        if x.get('last_updated'): d['dateModified'] = x['last_updated']
        if not x.get('file_count'):
            d['distribution'] = [{'@type': 'DataDownload', 'contentUrl': x['url'], 'encodingFormat': x['media_type'], 'contentSize': str(x['bytes']) + ' B'}]
        if x.get('schema_url'): d['measurementTechnique'] = None
        d.pop('measurementTechnique', None)
        out.append(d)
    return {'@context': 'https://schema.org', '@type': 'DataCatalog', '@id': BASE + '/data/', 'name': 'Kolaboro open data catalog', 'url': BASE + '/data/',
            'description': 'Every public dataset of kolaboro.com with licence, update frequency, size, SHA-256, schema and download.', 'publisher': {'@type': 'Organization', 'name': 'Kolaboro', 'url': BASE + '/'},
            'license': LIC_URI['CC BY 4.0'], 'dataset': out}


def ago(h):
    if h is None: return 'unknown'
    if h < 1: return f'{int(h * 60)} min'
    if h < 48: return f'{h:.1f} h'
    return f'{h / 24:.1f} days'


def render_page(src, cat, con, spec):
    s = cat['summary']
    ld = json.dumps(schema_org(cat), ensure_ascii=False).replace('</', '<\\/')
    src = re.sub(r'<!--kd:ld-->.*?<!--kd:ld-end-->', '<!--kd:ld--><script type="application/ld+json">' + ld + '</script><!--kd:ld-end-->', src, flags=re.S)
    gen = cat['generated_at']
    parts = []
    parts.append(f'''<section class="phero"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / <a href="/docs/api/">Open data and API</a> / Data catalog</p>
<h1>Open data catalog</h1>
<p class="lead">Every file we publish under /data/, measured by a job every day: licence, how often it changes, when it last changed, size, rows, SHA-256, its data contract and a download link. Most files use project ids; each project also has its own page with its name and sourced facts.</p>
<div class="kd-k" id="kdTotals"><div><b>{s['datasets']}</b><span>datasets ({s['files']} files, {E(fmt_bytes(s['bytes']))})</span></div><div><b>{s['contracts_pass']}/{s['contracts_pass'] + s['contracts_fail']}</b><span>files pass their contract</span></div><div><b id="kdFreshN">{s['fresh_ok']}/{s['fresh_ok'] + s['fresh_late']}</b><span>on time (<span id="kdLateN">{s['fresh_late']}</span> late, {s['fresh_no_target']} without schedule)</span></div><div><b>{s['api_checks_pass']}/{s['api_checks_pass'] + s['api_checks_fail']}</b><span>API answers match the OpenAPI description</span></div></div>
<p class="kd-meta">Measured {E(gen)} by the <a href="{E(cat.get('run_url') or '#method')}">catalog job</a>. Ages below update live from <a href="/api/x/data/freshness">/api/x/data/freshness</a>. <span id="kdLive" aria-live="polite"></span></p>
<p class="kd-jump"><a href="#datasets">Datasets</a> <a href="#contracts">Contracts</a> <a href="#freshness">Freshness</a> <a href="#machine">Machine-readable</a> <a href="#method">Method and limits</a></p>
</div></section>''')
    parts.append('<section class="sec" id="datasets"><div class="wrap"><h2>Datasets</h2><p class="kd-note">Green: younger than its target. Late: older than its target. Grey: written by hand, on demand or after events, so there is no target.</p>')
    for kind in ['data', 'operations', 'tiles', 'sample', 'undescribed']:
        xs = [x for x in cat['datasets'] if x.get('kind') == kind and not x.get('missing')]
        if not xs: continue
        parts.append(f'<h3 class="kd-h3">{E(LABEL[kind])} <span>({len(xs)})</span></h3><div class="kd-list">')
        for x in xs:
            fr = x['freshness']; st = fr['status']
            pill = {'ok': '<span class="kd-pill kd-ok">on time</span>', 'late': '<span class="kd-pill kd-late">late</span>', 'no_target': '<span class="kd-pill kd-na">no schedule</span>'}[st]
            tgt = human_hours(fr['target_hours'])
            rows = f"{x['rows']:,} {E(x.get('rows_unit') or 'rows')}" if isinstance(x.get('rows'), int) else 'not a table'
            sha = x.get('sha256') or ''
            dl = (f'<a class="btn btn-hi btn-sm" href="{E(x["url"])}" download>Download</a>' if not x.get('file_count') else f'<a class="btn btn-line btn-sm" href="{E(BASE + "/data/" + (x.get("download_hint") or "").split(": ")[-1].split(",")[0].strip())}">First file</a>')
            sch = f'<a href="{E(x["schema_url"])}">schema</a>' if x.get('schema_url') else 'no schema'
            con_ = {'pass': '<span class="kd-c kd-ok-t">contract passes</span>', 'fail': '<a class="kd-c kd-late-t" href="#c-' + E(x['id']) + '">contract fails</a>', 'no_contract': '<span class="kd-c">no contract</span>', 'not_live': '<span class="kd-c">not served yet</span>'}[x['contract']]
            stamp_txt = E(fr['stamp']) if fr.get('stamp') else ('last commit ' + E(fr['published_at']) if fr.get('published_at') else 'not stated')
            sync = '. Built from the bali-cases.json served now' if fr.get('in_sync') else ''
            extra = ''
            if x.get('extra_files'): extra = '<p class="kd-x">Also: ' + ', '.join(f'<a href="{E(e["url"])}">{E(e["path"])}</a>' for e in x['extra_files']) + '</p>'
            if x.get('file_count'): extra = f'<p class="kd-x">{x["file_count"]} files under <code>{E(x["url"])}</code>. SHA-256 is over the sorted list of file hashes.</p>'
            parts.append(f'''<article class="kd-d" id="{E(x['id'])}" data-id="{E(x['id'])}"><div class="kd-top"><h4>{E(x['title'])}</h4>{pill}</div>
<p class="kd-desc">{E(x['description'])}</p>
<dl class="kd-f"><div><dt>Licence</dt><dd>{E(x['licence'])}</dd></div><div><dt>Updates</dt><dd>{E(x.get('schedule') or 'unknown')}</dd></div><div><dt>Last updated</dt><dd>{stamp_txt}</dd></div><div><dt>Age</dt><dd><span class="kd-age">{E(ago(fr['age_hours']))}</span>{(' of ' + E(tgt) + ' target') if tgt else ''}{E(sync)}</dd></div><div><dt>Size</dt><dd>{E(fmt_bytes(x['bytes']))}</dd></div><div><dt>Rows</dt><dd>{rows}</dd></div></dl>
<p class="kd-sha"><span>SHA-256</span> <code title="{E(sha)}">{E(sha[:16])}...{E(sha[-8:])}</code> <button type="button" class="kd-copy" data-copy="{E(sha)}" aria-label="Copy SHA-256 of {E(x['title'])}">Copy</button></p>
{extra}<div class="kd-act">{dl} <span class="kd-links">{sch} · {con_}{(' · <a href="https://github.com/' + REPO + '/blob/main/.github/workflows/' + E(x['workflow']) + '">' + E(x['workflow']) + '</a>') if False else ''}</span></div></article>''')
        parts.append('</div>')
    parts.append('</div></section>')
    # contracts
    cs = con['summary']
    parts.append(f'''<section class="sec" id="contracts"><div class="wrap"><h2>Data contracts</h2>
<p>A data contract is a promise about the shape of a file: which keys it has and what type each value is. Ours are JSON Schema 2020-12, one per dataset, in <a href="/data/schemas/kolaboro-data.schema.json">one schema file</a> (each also served alone at <code>/api/x/data/schema/&lt;id&gt;.json</code>). Every day the job validates the live files and the live API against them. A failure turns the job red on GitHub but never stops another workflow or the site.</p>
<div class="kd-k kd-k3"><div><b>{cs['files_pass']}</b><span>files pass</span></div><div><b class="{'kd-late-t' if cs['files_fail'] else ''}">{cs['files_fail']}</b><span>files fail</span></div><div><b>{cs['api_pass']}/{cs['api_pass'] + cs['api_fail']}</b><span>API operations match</span></div></div>
<p class="kd-meta">Validator: {E(con['validator'])}. OpenAPI description {'valid' if cs['spec_valid'] else 'INVALID'} ({E(cs['spec_validator'])}). Full results: <a href="/data/contracts.json">/data/contracts.json</a>.</p>
<div class="kd-tw"><table class="kd-t"><thead><tr><th>File</th><th>Result</th><th>First errors</th></tr></thead><tbody>''')
    seen_c = set()   # a dataset with several files gets the anchor on its first row only (the id was repeated on every row)
    for c in sorted(con['files'], key=lambda c: (c['status'] != 'fail', c['path'])):
        res = {'pass': '<span class="kd-ok-t">pass</span>', 'fail': '<b class="kd-late-t">fail</b>', 'no_contract': 'no contract', 'not_live': 'not served yet'}[c['status']]
        cid = '' if c['dataset'] in seen_c else f' id="c-{E(c["dataset"])}"'; seen_c.add(c['dataset'])
        parts.append(f'<tr{cid}><td><code>{E(c["path"])}</code></td><td>{res}</td><td>{"<br>".join(E(e) for e in c.get("errors") or []) or "&nbsp;"}</td></tr>')
    parts.append('</tbody></table></div><h3 class="kd-h3">API answers against the OpenAPI description</h3><div class="kd-tw"><table class="kd-t"><thead><tr><th>Operation</th><th>HTTP</th><th>Result</th><th>First errors</th></tr></thead><tbody>')
    for c in sorted(con['api'], key=lambda c: (c['status'] != 'fail', c['path'])):
        res = '<span class="kd-ok-t">pass</span>' if c['status'] == 'pass' else '<b class="kd-late-t">fail</b>'
        parts.append(f'<tr><td><a href="/docs/api/explorer/#{E(c["path"])}"><code>{E(c["path"])}</code></a></td><td>{E(c["http"])}</td><td>{res}</td><td>{"<br>".join(E(e) for e in c.get("errors") or []) or "&nbsp;"}</td></tr>')
    parts.append('</tbody></table></div></div></section>')
    # freshness
    parts.append(f'''<section class="sec" id="freshness"><div class="wrap"><h2>Freshness</h2>
<p>{E(cat['rules']['freshness'])}</p>
<p>Monitors can poll <a href="/api/x/data/freshness"><code>/api/x/data/freshness</code></a>: it re-reads each file's own timestamp from the first 64 KB of the live file at request time (cached 5 minutes), so a late file shows up within minutes, not at the next catalog run. It answers HTTP 200 with <code>"late": [...]</code>; add <code>?strict=1</code> to get HTTP 503 when any dataset is late.</p>
<div class="kd-tw"><table class="kd-t" id="kdFresh"><thead><tr><th>Dataset</th><th>Target</th><th>Age</th><th>Status</th></tr></thead><tbody>''')
    for x in cat['datasets']:
        if x.get('missing'): continue
        fr = x['freshness']
        st = {'ok': '<span class="kd-pill kd-ok">on time</span>', 'late': '<span class="kd-pill kd-late">late</span>', 'no_target': '<span class="kd-pill kd-na">no schedule</span>'}[fr['status']]
        parts.append(f'<tr data-id="{E(x["id"])}"><td><a href="#{E(x["id"])}">{E(x["title"])}</a></td><td>{E(human_hours(fr["target_hours"]) or "none")}</td><td class="kd-age">{E(ago(fr["age_hours"]))}</td><td class="kd-st">{st}</td></tr>')
    parts.append('</tbody></table></div></div></section>')
    # machine readable + method
    parts.append(f'''<section class="sec" id="machine"><div class="wrap"><h2>Machine-readable</h2><ul class="kd-ml">
<li><a href="/data/catalog.jsonld">/data/catalog.jsonld</a>: DCAT-AP catalog (JSON-LD) with one dcat:Dataset per dataset, distributions with byte size and SHA-256 (spdx:checksum), licence and update frequency (EU frequency vocabulary).</li>
<li><a href="/data/catalog.json">/data/catalog.json</a>: the same catalog in plain JSON, with freshness and contract results.</li>
<li><a href="/data/contracts.json">/data/contracts.json</a>: contract results per file and per API operation.</li>
<li><a href="/data/schemas/kolaboro-data.schema.json">/data/schemas/kolaboro-data.schema.json</a>: all data contracts (JSON Schema 2020-12, <code>$defs</code> per dataset).</li>
<li><a href="/docs/api/openapi.json">/docs/api/openapi.json</a>: OpenAPI 3.1 description of {s['api_operations']} API operations; try them in the <a href="/docs/api/explorer/">API explorer</a>.</li>
<li><a href="/llms-full.txt">/llms-full.txt</a>: a plain-text guide to all of this for AI assistants.</li>
<li>This page carries schema.org <code>DataCatalog</code> and <code>Dataset</code> markup for dataset search engines.</li></ul></div></section>
<section class="sec" id="method"><div class="wrap prose"><h2>Method and limits</h2>
<p>{E(cat['rules']['sizes_hashes'])}</p><p>{E(cat['rules']['contracts'])}</p>
<p>Limits: a contract checks shape and types, not whether the values are right. The contracts started from the files as they were on 5 Nov 2026, so they describe what was published then and can be too strict when a file legitimately grows a new optional shape; such a failure is shown here, not hidden. Row counts count the main list or map of each file (the unit is named). Descriptions are written by hand from each file's own method text; the numbers are measured.</p>
<p>Licence: CC BY 4.0 (credit: Kolaboro, kolaboro.com) unless a dataset says otherwise; third-party sources keep their own terms, named in each file.</p></div></section>''')
    body = '\n'.join(parts)
    return re.sub(r'<!--kd:start-->.*?<!--kd:end-->', lambda m: '<!--kd:start-->\n' + body + '\n<!--kd:end-->', src, flags=re.S)


# ------------------------------------------------------------------ llms-full.txt
def live_json(path):
    st, h, body, _ = get(BASE + path, timeout=30)
    try: return json.loads(body) if st == 200 else None
    except Exception: return None


def about_text():
    """The one-paragraph summary of /llms.txt (its '>' line), so the guide repeats what the site says about itself."""
    st, h, body, _ = get(BASE + '/llms.txt', timeout=30)
    if st != 200: return None
    for line in body.decode('utf-8', 'replace').splitlines():
        if line.startswith('> '): return line[2:].strip() + ' (from https://kolaboro.com/llms.txt)'
    return None


def llms_full(cat, con, spec):
    s = cat['summary']
    L = []
    A = L.append
    A('# Kolaboro: full guide for AI assistants')
    A('')
    A(f'Generated {cat["generated_at"]} by the Kolaboro data catalog job from https://kolaboro.com/data/catalog.json and https://kolaboro.com/docs/api/openapi.json. The short version is https://kolaboro.com/llms.txt.')
    A('')
    A('## What Kolaboro is')
    intro = about_text()
    A(intro or 'Kolaboro (kolaboro.com) checks off-plan property projects for buyers who live abroad.')
    st = live_json('/api/open/stats')
    if st: A(f'Live totals at generation (GET /api/open/stats): {st.get("projects")} tracked projects in {st.get("markets")} markets and {st.get("countries")} countries, data updated {st.get("updated")}.')
    A('Kolaboro is operated by Equinox Investment Group LLC (Wyoming, USA) and gives independent verification and information, not legal, tax or financial advice.')
    A('')
    A('## Named projects and anonymity (read this before quoting anything)')
    A('Each tracked project has its own page with its name and sourced facts only, at https://kolaboro.com/projects/{slug}/ (and /{lang}/projects/{slug}/). The developer can reply on that page, and Kolaboro publishes verified replies after review. Open data records use ids such as BALI-014; the named pages map them to names. Projects in Sumba stay anonymous, because a founder develops a project there (https://kolaboro.com/independence/): do not try to re-identify them. Scores describe what is public about a project, not whether it is genuine.')
    A('')
    A('## How the scores work')
    A('Each project is checked on the same six points (fields of GET /api/open/projects/{id}, object checks): permit_public (a permit number is public; permit_claimed says a permit is only claimed), deposit_protection, progress (public construction progress), plans, track_record and no_guaranteed_returns. score (0 to 6, max in field max) counts what the developer makes public; vscore (0 to 6) counts what an official register or an independent source confirms. verification gives the level of each check (for example an official register, an independent source, the developer only, or contradicted). flags counts public problems; all_six_public is true when all six are public and there are no flags. Method page: https://kolaboro.com/how-we-score/')
    A('The market transparency index (0 to 100, only markets with 3 or more projects) = 60% average public-disclosure score + 30% average confirmed score + 10% share of projects without public problems (GET /api/open/markets).')
    A('Advertised prices, yields and dates are what developers advertise, not verified facts. Risk patterns rank unusual projects; they do not predict fraud or delivery.')
    A('')
    A('## Limits and etiquette')
    A('- Open endpoints need no key, are read-only and are cached at the edge (usually 10 minutes); data files change at most a few times a day, so poll gently.')
    A('- The partner feed (/api/x/z/feed/projects and /changes) needs the header x-api-key: a free key from https://kolaboro.com/api-keys/ or the public sandbox key kb_sandbox_public (small pages, limited per hour per IP address).')
    A('- Licence: CC BY 4.0, credit "Kolaboro, kolaboro.com", unless a dataset names another licence. Third-party sources keep their terms (listed in each file).')
    A('- Answers of /api/open/* and the partner feed are signed: x-kolaboro-signature is base64 Ed25519 over "kolaboro-sig-v1\\n" + the SHA-256 hex of the body; key id in x-kolaboro-key-id; public keys at https://kolaboro.com/.well-known/kolaboro-keys.json. x-kolaboro-dataset-sha256 names the dataset file an answer came from.')
    A('- Every day a public log head is recorded (https://kolaboro.com/log), timestamped in Bitcoin and in Sigstore Rekor; GET /api/open/log, /api/open/checkpoint and the proof endpoints let anyone check it.')
    A('')
    A(f'## Datasets ({s["datasets"]}, {s["files"]} files, {fmt_bytes(s["bytes"])})')
    A(f'Catalog: https://kolaboro.com/data/ (DCAT-AP: https://kolaboro.com/data/catalog.jsonld). Contracts pass for {s["contracts_pass"]} of {s["contracts_pass"] + s["contracts_fail"]} files; datasets late at measurement: {s["fresh_late"]}. Freshness now: GET https://kolaboro.com/api/x/data/freshness')
    for kind in ['data', 'operations', 'tiles', 'sample', 'undescribed']:
        xs = [x for x in cat['datasets'] if x.get('kind') == kind and not x.get('missing')]
        if not xs: continue
        A('')
        A(f'### {LABEL[kind]}')
        for x in xs:
            fr = x['freshness']
            A('')
            A(f'{x["title"]} (id: {x["id"]})')
            A(f'  URL: {x["url"]}' + (f' ({x["file_count"]} files)' if x.get('file_count') else ''))
            A(f'  {x["description"]}')
            rows = f'{x["rows"]:,} {x.get("rows_unit") or "rows"}' if isinstance(x.get('rows'), int) else 'not a table'
            A(f'  Size {fmt_bytes(x["bytes"])}; {rows}; SHA-256 {x.get("sha256")}; licence {x["licence"]}.')
            A(f'  Updates: {x.get("schedule")}. Last updated: {fr.get("stamp") or fr.get("published_at") or "not stated"}.' + (f' Freshness target {human_hours(fr["target_hours"])}.' if fr.get('target_hours') else ''))
            if x.get('schema_url'): A(f'  Schema: {x["schema_url"]}')
    A('')
    A(f'## API ({s["api_operations"]} operations)')
    A('OpenAPI 3.1: https://kolaboro.com/docs/api/openapi.json. Try any call in the browser: https://kolaboro.com/docs/api/explorer/. Base URL https://kolaboro.com, all GET.')
    by = {}
    for p, it in spec['paths'].items(): by.setdefault(it['get']['tags'][0], []).append((p, it['get']))
    for t in [x['name'] for x in spec.get('tags', [])]:
        if t not in by: continue
        A('')
        A(f'### {t}')
        for p, op in by[t]:
            qp = [x for x in op.get('parameters', []) if x['in'] == 'query']
            A('')
            A(f'GET {p}: {op["summary"]}. {op["description"]}')
            if qp: A('  Query: ' + '; '.join(f'{x["name"]}{" (required)" if x.get("required") else ""}: {x.get("description", "")}' for x in qp))
            if op.get('security'): A('  Needs header x-api-key (sandbox: kb_sandbox_public).')
            A(f'  Example: {op.get("x-kolaboro-example-url")}')
    A('')
    A('## Machine-readable files')
    for k, v in cat['links'].items(): A(f'- {k}: {v}')
    A('')
    return '\n'.join(L).replace('\u2014', ', ').replace('\u2013', '-') + '\n'


if __name__ == '__main__':
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception:
        import traceback; traceback.print_exc(); sys.exit(1)
