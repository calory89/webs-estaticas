"""Round 2: replace the 100 round-1 entries with enriched profiles and add new projects.
usage: python3 merge2.py <projects.json> <projects-world.json>"""
import json, re, sys, glob, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from merge import clean, norm_seed, disclosure, fix_progress, ACCT
sys.path.insert(0, '/home/claude/ws-main/tools/kolaboro-agent')
from discover import similar

R2 = os.environ.get('KB_ROUND_DIR') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'round2')
LV = ('registry', 'independent', 'developer', 'contradicted', 'none')


def level(v):
    v = str(v or 'none').lower()
    return next((l for l in LV if l in v), 'none')


def prep(p):
    p = clean(p)
    p['seed'] = norm_seed(p.get('seed'))
    p['permit_number'] = p.get('permit_number') or p['seed'].get('permit_number')
    p['area'] = p.get('area') or p.get('market')
    for k in ('docs_listed', 'positives', 'flags', 'sources', 'claims'):
        p[k] = p.get(k) or []
    p['flags'] = [f for f in p['flags'] if isinstance(f, dict) and f.get('text') and f.get('source')]
    p['claims'] = [c for c in p['claims'] if isinstance(c, dict) and c.get('claim') and str(c.get('status', '')).lower() in ('verified', 'unverified', 'contradicted')]
    for c in p['claims']:
        c['status'] = str(c['status']).lower()
        c['claim'] = ACCT.sub(r'\1', c['claim'])
    v = p.get('verification') or {}
    p['verification'] = {k: level(v.get(k)) for k in ('permit', 'escrow', 'progress', 'plans', 'record', 'returns')} if v else None
    fx = p.get('facts') or {}
    for k in ('lat', 'lng', 'size_min_m2', 'size_max_m2', 'price_min', 'price_max', 'deposit_pct', 'delay_months', 'developer_founded', 'developer_projects_delivered', 'developer_units_delivered'):
        if fx.get(k) not in (None, ''):
            m = re.search(r'-?\d[\d,.]*', str(fx[k]))
            try:
                fx[k] = float(m.group(0).replace(',', '')) if m else None
            except ValueError:
                fx[k] = None
    if fx.get('lat') is not None and not (-90 <= fx['lat'] <= 90): fx['lat'] = None
    if fx.get('lng') is not None and not (-180 <= fx['lng'] <= 180): fx['lng'] = None
    p['facts'] = fx
    fix_progress(p)
    p['disclosure'] = disclosure(p)
    p['verified_score'] = sum(1 for l in (p['verification'] or {}).values() if l in ('registry', 'independent'))
    return p


def main(pfile, wfile):
    P = json.load(open(pfile)); W = json.load(open(wfile))
    allp = P['projects'] + W['projects']; by_slug = {p['slug']: p for p in allp}
    names = {re.sub(r'\W+', '', ((p.get('name') or '') + (p.get('developer') or '')).lower()) for p in allp}
    rep = collections.Counter(); problems = []
    for f in sorted(glob.glob(os.path.join(R2, 'out-*.json'))):
        try: arr = json.load(open(f))
        except Exception as e: problems.append('%s invalid (%s)' % (f, e)); continue
        for u in arr:
            old = by_slug.get(u.get('slug'))
            if not old: problems.append('unknown slug ' + str(u.get('slug'))); continue
            if not u.get('sources'): problems.append('no sources ' + u['slug']); continue
            u = prep(u)
            for k in ('slug', 'added', 'invited'):
                if old.get(k): u[k] = old[k]
            u['sources'] = sorted(set((old.get('sources') or []) + u['sources']))
            old.clear(); old.update(u); rep['enriched'] += 1
    for f in sorted(glob.glob(os.path.join(R2, 'new-*.json'))):
        try: arr = json.load(open(f))
        except Exception as e: problems.append('%s invalid (%s)' % (f, e)); continue
        for p in arr:
            if not p.get('name') or not p.get('url') or not p.get('market') or not p.get('sources'):
                problems.append('incomplete %s' % p.get('name')); continue
            key = re.sub(r'\W+', '', ((p.get('name') or '') + (p.get('developer') or '')).lower())
            slug = re.sub(r'[^a-z0-9]+', '-', (p.get('slug') or p['name']).lower()).strip('-')[:70]
            same = by_slug.get(slug)
            if same is None:
                same = next((x for x in W['projects'] if re.sub(r'\W+', '', ((x.get('name') or '') + (x.get('developer') or '')).lower()) == key), None)
            if same is not None and same.get('added') == '2026-10-31' and not same.get('found_by'):
                # same project from a research file merged earlier: refresh it with the latest version
                q = prep(p); q['slug'] = same['slug']; q['added'] = same['added']
                q.setdefault('docs_url', q['url'])
                q['sources'] = sorted(set((same.get('sources') or []) + q['sources']))
                if q != same:
                    same.clear(); same.update(q); rep['refreshed'] += 1
                continue
            if key in names or slug in by_slug or similar(dict(p), [x for x in (P['projects'] + W['projects'])]): rep['duplicate'] += 1; continue
            p = prep(p); p['slug'] = slug; p['added'] = '2026-10-31'
            p.setdefault('docs_url', p['url'])
            W['projects'].append(p); by_slug[slug] = p; names.add(key); rep['added'] += 1
    json.dump(P, open(pfile, 'w'), ensure_ascii=False, indent=1)
    json.dump(W, open(wfile, 'w'), ensure_ascii=False, indent=1)
    allp = P['projects'] + W['projects']; rich = [p for p in allp if p.get('verification')]
    print('report', dict(rep), 'total', len(allp), 'rich', len(rich))
    print('disclosure', dict(sorted(collections.Counter(p['disclosure']['score'] for p in rich).items())))
    print('verified_score', dict(sorted(collections.Counter(p['verified_score'] for p in rich).items())))
    cl = collections.Counter(c['status'] for p in rich for c in p['claims']); print('claims', dict(cl))
    lv = collections.Counter(l for p in rich for l in p['verification'].values()); print('levels', dict(lv))
    print('markets', len({p.get('market') for p in allp}), 'new markets', sorted({p['market'] for p in W['projects'] if p.get('added') == '2026-10-31'} - {p.get('market', 'Bali') for p in allp if p.get('added') != '2026-10-31'})[:60])
    for x in problems: print('PROBLEM', x)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
