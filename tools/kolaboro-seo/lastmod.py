#!/usr/bin/env python3
"""Pin the true lastmod of kolaboro.com named pages (batch 15, s15b).

The worker computes, per project, fingerprints of five parts of its data (named facts, case, promises, findings, satellite series)
without volatile dates, and the date each fingerprint was first seen (_worker.js/kbx_lastmod.js, GET /api/seo/lastmod).
This script fetches that state and writes it as <out_dir>/lastmod.json when any fingerprint or date differs from the published
https://kolaboro.com/data/lastmod.json, so a change keeps the date of the data build that published it.
Exit code 3 = nothing changed (nothing to publish). Never invents a date: everything comes from the worker's computation.
Usage: lastmod.py <out_dir>
"""
import json, os, sys, urllib.request

BASE = os.environ.get('KB_BASE', 'https://kolaboro.com')
UA = 'KolaboroSEO/1.0 (+https://kolaboro.com/engineering/seo/)'


def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'user-agent': UA, 'cache-control': 'no-cache'}), timeout=120) as r:
        return json.loads(r.read().decode('utf-8'))


def main(out):
    os.makedirs(out, exist_ok=True)
    cur = get(BASE + '/api/seo/lastmod')
    if cur.get('version') != 'lastmod-1' or not isinstance(cur.get('p'), dict) or len(cur['p']) < 100:
        raise SystemExit('unexpected /api/seo/lastmod answer')
    try: prev = get(BASE + '/data/lastmod.json?fresh=' + str(os.getpid()))
    except Exception: prev = {}
    changed = sum(1 for k, v in cur['p'].items() if (prev.get('p') or {}).get(k) != v) + sum(1 for k in (prev.get('p') or {}) if k not in cur['p'])
    print('projects', len(cur['p']), 'changed or new', changed)
    if not changed: sys.exit(3)
    cur.pop('previous_pin', None)
    json.dump(cur, open(os.path.join(out, 'lastmod.json'), 'w'), separators=(',', ':'))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
