#!/usr/bin/env python3
"""Write schemas.json (the data contracts) from the files as they are published now. Run by hand when a contract must be
renewed on purpose (a producer changed its format); the daily job never rewrites contracts.
Usage: make_schemas.py <dir holding the data/ files, e.g. a checkout of _s/kolaboro.com/data> [only-id ...]"""
import glob, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kd_infer import infer, merge, finish

HERE = os.path.dirname(os.path.abspath(__file__))


def main(src, only):
    reg = json.load(open(os.path.join(HERE, 'registry.json')))
    out_p = os.path.join(HERE, 'schemas.json')
    old = json.load(open(out_p)) if os.path.exists(out_p) else {'$defs': {}}
    defs = dict(old.get('$defs', {}))
    for d in reg['datasets']:
        if only and d['id'] not in only: continue
        if d.get('path', '').endswith('.json'):
            doc = json.load(open(os.path.join(src, d['path'])))
            s = finish(infer(doc), 0)
            s = {'title': d['title'], 'description': 'Contract of https://kolaboro.com/data/' + d['path'] + '. ' + d['description'], **s}
            defs[d['id']] = s
        elif d.get('prefix'):
            fs = sorted(glob.glob(os.path.join(src, d['prefix'], '*.json')))
            if not fs: continue
            acc = None
            for f in fs: acc = merge(acc, infer(json.load(open(f))))
            defs[d['id'] + '-file'] = {'title': d['title'] + ', one file', 'description': 'Contract of each JSON file under https://kolaboro.com/data/' + d['prefix'] + '. ' + d['description'], **finish(acc, 0)}
    schema = {'$schema': 'https://json-schema.org/draft/2020-12/schema', '$id': 'https://kolaboro.com/data/schemas/kolaboro-data.schema.json',
              'title': 'Kolaboro data contracts',
              'description': 'One JSON Schema (2020-12) per public dataset under https://kolaboro.com/data/, in $defs keyed by dataset id (see /data/catalog.json). Validate a file with {"$ref": "https://kolaboro.com/data/schemas/kolaboro-data.schema.json#/$defs/<id>"}, or fetch one schema alone from /api/x/data/schema/<id>.json. Written from the files as published on 5 Nov 2026 and checked against the live files every day (results: /data/contracts.json).',
              '$defs': dict(sorted(defs.items()))}
    with open(out_p, 'w') as f: json.dump(schema, f, indent=1, ensure_ascii=False); f.write('\n')
    print(f'{len(defs)} contracts in {out_p}')


if __name__ == '__main__':
    main(sys.argv[1], set(sys.argv[2:]))
