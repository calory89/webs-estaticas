#!/usr/bin/env python3
"""Daily Parquet export of the Kolaboro open dataset, for SQL in the browser (kolaboro.com/sql).

Input: the public file kolaboro.com/data/bali-cases.json (exact bytes, as published).
Output (into OUT_DIR):
  kolaboro.parquet          one row per tracked project (fields already public in bali-cases.json)
  kolaboro-markets.parquet  one row per market, computed exactly like GET /api/open/markets
  kolaboro.parquet.json     manifest: sha256, bytes and rows of each file, source dataset sha256, generated time

Nothing private goes in: only fields of the public JSON. The manifest is signed by the site worker
(GET /api/x/e/parquet-manifest), which re-hashes the published files before it signs.

Usage: parquet_export.py bali-cases.json OUT_DIR
"""
import datetime
import hashlib
import json
import math
import os
import sys

import pyarrow as pa
import pyarrow.parquet as pq

SRC_URL = 'https://kolaboro.com/data/bali-cases.json'
LICENSE = 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)'
CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok']


def js_round(x, nd=0):
    """Math.round / toFixed semantics (half up), so numbers match the open API."""
    m = 10 ** nd
    return math.floor(x * m + 0.5) / m


def tri(v):
    return None if v is None else bool(v)


def project_row(c):
    ck = c.get('checks') or {}
    vf = c.get('verified') or {}
    cl = c.get('claims') or {}
    fp = c.get('fp')
    fps = (fp.get('sha256') if isinstance(fp, dict) else fp) or None
    sat = c.get('sat') or {}
    reg = c.get('register') or {}
    permit = ck.get('permit')
    flags = c.get('flags') or []
    num = lambda v: None if v is None else float(v)
    intn = lambda v: None if v is None else int(v)
    return {
        'id': c['id'], 'market': c.get('market'), 'country': c.get('country'), 'region': c.get('region'),
        'stage': c.get('stage'), 'price_band': c.get('band'), 'completion_year': intn(c.get('done')),
        'title': c.get('title'), 'lease_years': intn(c.get('lease')), 'units': intn(c.get('units')),
        'advertised_yield_pct': num(c.get('yield')),
        'checks_public': intn(c.get('score')), 'checks_max': intn(c.get('max')), 'checks_confirmed': intn(c.get('vscore')),
        'tier': c.get('tier'),
        'permit_public': permit == 2, 'permit_claimed': (permit or 0) >= 1,
        'deposit_protection': tri(ck.get('escrow')), 'progress_public': ck.get('progress') is not None,  # a published 0% counts as public, as in the score
        'plans_public': bool(ck.get('plans')), 'track_record_public': bool(ck.get('record')),
        'no_guaranteed_returns': bool(ck.get('returns_ok')),
        **{'level_' + k: vf.get(k) for k in CHECKS},
        'claims_verified': intn(cl.get('verified')), 'claims_unverified': intn(cl.get('unverified')),
        'claims_contradicted': intn(cl.get('contradicted')),
        'flags': len(flags), 'all_six_public': c.get('score') == 6 and not flags,
        'delay_months': num(c.get('delay')), 'overdue_months': intn(c.get('overdue')),
        'changes_recorded': len(c.get('history') or []),
        'satellite_status': sat.get('status'), 'satellite_changed_pct': num(sat.get('changed_pct')),
        'register_watched': bool(reg),
        'page_sha256': fps, 'checked': c.get('checked'),
        'url': 'https://kolaboro.com/p/?id=' + c['id'],
    }


PROJECT_SCHEMA = pa.schema([
    ('id', pa.string()), ('market', pa.string()), ('country', pa.string()), ('region', pa.string()),
    ('stage', pa.string()), ('price_band', pa.string()), ('completion_year', pa.int32()),
    ('title', pa.string()), ('lease_years', pa.int32()), ('units', pa.int32()), ('advertised_yield_pct', pa.float64()),
    ('checks_public', pa.int8()), ('checks_max', pa.int8()), ('checks_confirmed', pa.int8()), ('tier', pa.string()),
    ('permit_public', pa.bool_()), ('permit_claimed', pa.bool_()), ('deposit_protection', pa.bool_()),
    ('progress_public', pa.bool_()), ('plans_public', pa.bool_()), ('track_record_public', pa.bool_()),
    ('no_guaranteed_returns', pa.bool_()),
] + [('level_' + k, pa.string()) for k in CHECKS] + [
    ('claims_verified', pa.int32()), ('claims_unverified', pa.int32()), ('claims_contradicted', pa.int32()),
    ('flags', pa.int32()), ('all_six_public', pa.bool_()), ('delay_months', pa.float64()), ('overdue_months', pa.int32()),
    ('changes_recorded', pa.int32()), ('satellite_status', pa.string()), ('satellite_changed_pct', pa.float64()),
    ('register_watched', pa.bool_()), ('page_sha256', pa.string()), ('checked', pa.string()), ('url', pa.string()),
])


def market_rows(cases):
    """Port of marketStats() in _worker.js/kolaboro.js (GET /api/open/markets)."""
    by = {}
    for c in cases:
        by.setdefault(c.get('market'), []).append(c)
    out = []
    for m, a in by.items():
        n = len(a)
        avg = lambda f: sum((f(c) or 0) for c in a) / n
        disc = avg(lambda c: (c.get('score') or 0) / 6)
        conf = avg(lambda c: (c.get('vscore') or 0) / 6)
        clean = avg(lambda c: 0 if (c.get('flags') or []) else 1)
        out.append({
            'market': m, 'country': a[0].get('country'), 'projects': n,
            'avg_checks_public': js_round(avg(lambda c: c.get('score')), 2),
            'avg_checks_confirmed': js_round(avg(lambda c: c.get('vscore')), 2),
            'permit_public_pct': int(js_round(avg(lambda c: 1 if (c.get('checks') or {}).get('permit') == 2 else 0) * 100)),
            'deposit_protection_pct': int(js_round(avg(lambda c: 1 if (c.get('checks') or {}).get('escrow') is True else 0) * 100)),
            'all_six_public': sum(1 for c in a if c.get('score') == 6 and not (c.get('flags') or [])),
            'with_flags': sum(1 for c in a if (c.get('flags') or [])),
            'transparency_index': int(js_round((0.6 * disc + 0.3 * conf + 0.1 * clean) * 100)) if n >= 3 else None,
        })
    out.sort(key=lambda r: (-(r['transparency_index'] if r['transparency_index'] is not None else -1), -r['projects']))
    return out


MARKET_SCHEMA = pa.schema([
    ('market', pa.string()), ('country', pa.string()), ('projects', pa.int32()),
    ('avg_checks_public', pa.float64()), ('avg_checks_confirmed', pa.float64()),
    ('permit_public_pct', pa.int32()), ('deposit_protection_pct', pa.int32()),
    ('all_six_public', pa.int32()), ('with_flags', pa.int32()), ('transparency_index', pa.int32()),
])


def sha_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()


def write(rows, schema, path, meta):
    t = pa.Table.from_pylist(rows, schema=schema).replace_schema_metadata({k: str(v) for k, v in meta.items()})
    pq.write_table(t, path, compression='zstd', version='2.6', write_statistics=True)
    return t.num_rows


def main(src, out_dir):
    raw = open(src, 'rb').read()
    src_sha = hashlib.sha256(raw).hexdigest()
    d = json.loads(raw)
    orig = d.get('cases') or []
    cases = sorted(orig, key=lambda c: c['id'])
    if len(cases) < 50:
        sys.exit('refusing to publish: only %d projects in the source file' % len(cases))
    meta = {'source': SRC_URL, 'source_sha256': src_sha, 'source_updated': d.get('updated'), 'license': LICENSE}
    os.makedirs(out_dir, exist_ok=True)
    files = []
    for name, table, rows, schema, desc in [
        ('kolaboro.parquet', 'projects', [project_row(c) for c in cases], PROJECT_SCHEMA, 'one row per tracked project'),
        ('kolaboro-markets.parquet', 'markets', market_rows(orig), MARKET_SCHEMA, 'one row per market, same method as /api/open/markets'),
    ]:
        p = os.path.join(out_dir, name)
        n = write(rows, schema, p, dict(meta, table=table))
        files.append({'path': '/data/' + name, 'table': table, 'description': desc, 'rows': n,
                      'bytes': os.path.getsize(p), 'sha256': sha_file(p),
                      'columns': [{'name': f.name, 'type': str(f.type)} for f in schema]})
    man = {
        'name': 'Kolaboro open dataset, Parquet',
        'version': 1,
        'generated': datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z'),
        'license': LICENSE,
        'source': {'url': SRC_URL, 'sha256': src_sha, 'updated': d.get('updated'), 'projects': len(cases)},
        'files': files,
        'signed_manifest': 'https://kolaboro.com/api/x/e/parquet-manifest',
        'note': 'Advertised claims and what is public, not verified facts. Each project has a named page with sourced facts, except projects in Sumba. '
                'Built daily by a GitHub Actions workflow from the public JSON; the signed manifest is produced by the site worker after it re-hashes these files.',
    }
    with open(os.path.join(out_dir, 'kolaboro.parquet.json'), 'w') as f:
        json.dump(man, f, indent=1)
        f.write('\n')
    print(json.dumps({x['path']: [x['rows'], x['bytes'], x['sha256'][:16]] for x in files}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
