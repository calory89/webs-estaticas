"""Validate researcher output and merge it into the agent's project lists.
usage: python3 merge.py <projects.json> <projects-world.json>   (edits both in place, prints a report)"""
import json, re, sys, glob, os, collections

HERE = os.path.dirname(os.path.abspath(__file__))
NEW = os.path.join(HERE, 'new')
SEED_KEYS = ['price', 'currency', 'title', 'lease_base', 'extension', 'guaranteed_language', 'yield_pct', 'completion',
             'permit_claim', 'permit_number', 'plans_published', 'escrow', 'progress_pct', 'developer_delivered',
             'units', 'payment_plan', 'price_per_m2', 'progress_updates']
DASH = re.compile('[–—]')


def clean(v):
    if isinstance(v, str):
        v = DASH.sub(', ', v).replace(' ,', ',').strip()
        return v or None
    if isinstance(v, list):
        return [clean(x) for x in v if clean(x) not in (None, '')]
    if isinstance(v, dict):
        return {k: clean(x) for k, x in v.items()}
    return v


def num(v):
    if v in (None, ''):
        return None
    if isinstance(v, (int, float)):
        return v
    m = re.search(r'-?\d[\d,.]*', str(v))
    if not m:
        return None
    try:
        return float(m.group(0).replace(',', ''))
    except ValueError:
        return None


def norm_seed(s):
    s = dict(s or {})
    out = {k: s.get(k) for k in SEED_KEYS}
    for k in ('price', 'yield_pct', 'progress_pct', 'units', 'price_per_m2', 'lease_base'):
        out[k] = num(out[k])
    if out['progress_pct'] is not None:
        out['progress_pct'] = max(0, min(100, out['progress_pct']))
    for k in ('guaranteed_language', 'permit_claim', 'plans_published'):
        if out[k] not in (True, False, None):
            out[k] = str(out[k]).lower() in ('true', 'yes', '1')
    if out['guaranteed_language'] is None:
        out['guaranteed_language'] = False if s.get('guaranteed_language') is None else out['guaranteed_language']
    if out['permit_number'] and not re.search(r'\d', str(out['permit_number'])):
        out['permit_number'] = None
    if out.get('escrow'):
        out['escrow'] = re.sub(r'(?i)(account|acct\.?|a/c|iban)\s*(no\.?|number)?\s*[:#]?\s*[A-Z0-9-]{6,}', r'\1', str(out['escrow']))
    if out['completion'] is not None:
        out['completion'] = str(out['completion'])
    return clean(out)


ACCT = re.compile(r'(?i)(account|acct\.?|a/c|iban)\s*(no\.?|number)?\s*[:#]?\s*[A-Z0-9-]{6,}')


PLACEHOLDER = re.compile(r'(?i)no %|no overall %|placeholder|no percentage|no % published')


def fix_progress(p):
    s = p['seed']; ev = str((p.get('evidence') or {}).get('progress') or '')
    said = bool((p.get('disclosure') or {}).get('progress'))
    if s.get('progress_pct') == 0 and PLACEHOLDER.search(ev):
        s['progress_pct'] = None; s['progress_updates'] = True
    elif s.get('progress_pct') is None and said and ev:
        s['progress_updates'] = True


def disclosure(p):
    if isinstance(p.get('evidence'), dict) and p['evidence'].get('escrow'):
        p['evidence']['escrow'] = ACCT.sub(r'\1', str(p['evidence']['escrow']))
    s = p['seed']
    d = {'permit': bool(p.get('permit_number') or s.get('permit_number')), 'escrow': bool(s.get('escrow')),
         'progress': s.get('progress_pct') is not None or bool(s.get('progress_updates')), 'plans': bool(s.get('plans_published')),
         'record': bool(s.get('developer_delivered')), 'no_guaranteed_returns': s.get('guaranteed_language') is False}
    d['score'] = sum(d.values())
    d['all_six'] = d['score'] == 6 and not p.get('flags')
    return d


def main(pfile, wfile):
    P = json.load(open(pfile)); W = json.load(open(wfile))
    allp = P['projects'] + W['projects']
    by_slug = {p['slug']: p for p in allp}
    names = {re.sub(r'\W+', '', ((p.get('name') or '') + (p.get('developer') or '')).lower()) for p in allp}
    rep = collections.Counter(); added = []; problems = []

    # 1. new projects
    for f in sorted(glob.glob(os.path.join(NEW, '*.json'))):
        base = os.path.basename(f)
        if base.startswith(('todo-', 'update-')):
            continue
        try:
            arr = json.load(open(f))
        except Exception as e:
            problems.append('%s: invalid JSON (%s)' % (base, e)); continue
        for p in arr:
            p = clean(p)
            if not p.get('name') or not p.get('url') or not p.get('market') or not p.get('sources'):
                problems.append('%s: skipped incomplete %s' % (base, p.get('name'))); continue
            key = re.sub(r'\W+', '', ((p.get('name') or '') + (p.get('developer') or '')).lower())
            slug = re.sub(r'[^a-z0-9]+', '-', (p.get('slug') or p['name']).lower()).strip('-')[:70]
            if key in names or slug in by_slug:
                rep['duplicate'] += 1; continue
            p['slug'] = slug; p['added'] = '2026-10-31'
            p['seed'] = norm_seed(p.get('seed'))
            p['permit_number'] = p.get('permit_number') or p['seed'].get('permit_number')
            p['area'] = p.get('area') or p['market']
            p.setdefault('docs_url', p['url']); p.setdefault('docs_listed', []); p.setdefault('positives', []); p.setdefault('flags', [])
            p['flags'] = [f2 for f2 in p['flags'] if isinstance(f2, dict) and f2.get('text') and f2.get('source')]
            fix_progress(p); p['disclosure'] = disclosure(p)
            W['projects'].append(p); by_slug[slug] = p; names.add(key); added.append(p); rep['added'] += 1

    # 2. deep updates of existing projects
    upd = 0
    for f in sorted(glob.glob(os.path.join(NEW, 'update-*.json'))):
        try:
            arr = json.load(open(f))
        except Exception as e:
            problems.append('%s: invalid JSON (%s)' % (os.path.basename(f), e)); continue
        for u in arr:
            u = clean(u); p = by_slug.get(u.get('slug'))
            if not p:
                problems.append('update for unknown slug %s' % u.get('slug')); continue
            if not u.get('sources'):
                problems.append('update without sources %s' % u.get('slug')); continue
            seed = dict(p.get('seed') or {})
            for k, v in norm_seed(u.get('seed')).items():
                if v is not None or k in ('escrow', 'progress_pct', 'developer_delivered'):
                    if v is not None or k not in seed:
                        seed[k] = v
            p['seed'] = seed
            for k in ('docs_url', 'docs_listed', 'note', 'positives', 'evidence', 'status'):
                if u.get(k):
                    p[k] = u[k]
            if u.get('url') and str(u['url']).startswith('http'):
                p['url'] = u['url']
            if u.get('permit_number'):
                p['permit_number'] = u['permit_number']
            p['flags'] = (p.get('flags') or []) + [f2 for f2 in (u.get('flags') or []) if isinstance(f2, dict) and f2.get('text') and f2.get('source')]
            p['sources'] = sorted(set((p.get('sources') or []) + u['sources']))
            p['evidence'] = u.get('evidence') or p.get('evidence'); p['disclosure'] = u.get('disclosure') or {}
            fix_progress(p); p['disclosure'] = disclosure(p); upd += 1
    rep['updated'] = upd

    json.dump(P, open(pfile, 'w'), ensure_ascii=False, indent=1)
    json.dump(W, open(wfile, 'w'), ensure_ascii=False, indent=1)
    allp = P['projects'] + W['projects']
    deep = [p for p in allp if p.get('sources')]
    sc = collections.Counter(disclosure(p)['score'] for p in deep if p.get('seed') is not None)
    print('report', dict(rep), 'total', len(allp), 'deep', len(deep))
    print('scores among deep', dict(sorted(sc.items())), 'all six', sum(1 for p in deep if disclosure(p)['all_six']))
    print('new markets', sorted({p['market'] for p in added} - {p.get('market', 'Bali') for p in allp if p not in added}))
    for x in problems:
        print('PROBLEM', x)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
