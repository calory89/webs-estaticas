#!/usr/bin/env python3
"""Manual accuracy audit: picks N random projects (fixed seed per month, so the sample cannot be cherry-picked
afterwards) and writes a CSV with every tested claim and its source for a person to re-check by hand.
After the audit, count rows where the reviewer disagrees and publish: errors / claims checked.
usage: audit_sample.py [N=50] [YYYY-MM]"""
import csv, json, os, random, sys, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
n = int(sys.argv[1]) if len(sys.argv) > 1 else 50
month = sys.argv[2] if len(sys.argv) > 2 else datetime.date.today().strftime('%Y-%m')
P = json.load(open(os.path.join(HERE, 'projects.json')))['projects'] + json.load(open(os.path.join(HERE, 'projects-world.json')))['projects']
P = [p for p in P if p.get('claims')]
rng = random.Random('kolaboro-audit-' + month)
sample = rng.sample(sorted(P, key=lambda p: p['slug']), min(n, len(P)))
out = os.path.join(HERE, 'data', 'audit-%s.csv' % month)
with open(out, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['slug', 'market', 'name', 'claim', 'our_status', 'our_level', 'source', 'reviewer_status', 'reviewer_note'])
    for p in sample:
        for c in p['claims']:
            w.writerow([p['slug'], p.get('market'), p.get('name'), c.get('claim'), c.get('status'), c.get('by'), c.get('source'), '', ''])
print('sample', len(sample), 'projects; claims', sum(len(p['claims']) for p in sample), '->', out)
