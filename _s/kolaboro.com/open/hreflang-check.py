#!/usr/bin/env python3
"""kolaboro.com hreflang and sitemap checker (n33i, 20 Nov 2026). Python 3 standard library only.

For a sample of URLs from every sitemap in /sitemap_index.xml (or the URLs given with --url), it fetches each page and checks:
  - status 200, no noindex (X-Robots-Tag header or robots meta), canonical points to itself  (sitemap hygiene, item 8)
  - the page lists itself in its hreflang set, has x-default, and <html lang> matches its own hreflang code
  - every hreflang alternate answers 200 and lists the original page back (return link)
  - the sitemap's xhtml:link alternates for that URL, when present, equal the page's own set
Usage: hreflang-check.py [--per N] [--base https://kolaboro.com] [--json out.json] [--url URL ...]
Exit code: 0 when no error was found, 1 otherwise. Network: GET only, 6 parallel requests, user agent KolaboroHreflangCheck/1.0.
"""
import argparse, concurrent.futures as cf, json, random, re, sys, urllib.error, urllib.request

UA = 'KolaboroHreflangCheck/1.0 (+https://kolaboro.com/engineering/seo/)'
CACHE = {}


def get(u):
    if u in CACHE: return CACHE[u]
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={'user-agent': UA, 'accept': 'text/html'}), timeout=45) as r:
            out = (r.status, dict((k.lower(), v) for k, v in r.headers.items()), r.read().decode('utf-8', 'replace'), r.geturl())
    except urllib.error.HTTPError as e:
        out = (e.code, dict((k.lower(), v) for k, v in e.headers.items()), '', u)
    except Exception as e:
        out = (0, {}, '', u)
    CACHE[u] = out
    return out


def attrs(tag):
    return dict((k.lower(), v.replace('&amp;', '&')) for k, v in re.findall(r'([a-zA-Z:-]+)="([^"]*)"', tag))


def page_info(u):
    st, h, body, final = get(u)
    head = body.split('</head>', 1)[0]
    alts, canon = {}, None
    for t in re.findall(r'<link\b[^>]*>', head, re.I):
        a = attrs(t)
        rel = a.get('rel', '').lower()
        if rel == 'alternate' and a.get('hreflang'): alts[a['hreflang'].lower()] = a.get('href')
        elif rel == 'canonical': canon = a.get('href')
    m = re.search(r'<html\b[^>]*\blang="([^"]+)"', body, re.I)
    noindex = 'noindex' in (h.get('x-robots-tag') or '').lower() or bool(re.search(r'<meta[^>]+name="robots"[^>]+content="[^"]*noindex', head, re.I))
    return {'status': st, 'final': final, 'alts': alts, 'canonical': canon, 'lang': (m.group(1).lower() if m else None), 'noindex': noindex}


def sitemap_urls(base):
    out = {}
    _, _, idx, _ = get(base + '/sitemap_index.xml')
    for sm in re.findall(r'<loc>([^<]+)</loc>', idx):
        name = sm.replace(base, '')
        if name.endswith('images.xml'): continue
        _, _, x, _ = get(sm)
        rows = []
        for blk in re.findall(r'<url>(.*?)</url>', x, re.S):
            loc = re.search(r'<loc>([^<]+)</loc>', blk)
            if not loc: continue
            alts = dict((hl.lower(), href.replace('&amp;', '&')) for hl, href in re.findall(r'hreflang="([^"]+)" href="([^"]+)"', blk))
            rows.append((loc.group(1).replace('&amp;', '&'), alts))
        out[name] = rows
    return out


def check(u, sm_alts):
    errs = []
    p = page_info(u)
    if p['status'] != 200: return [('not_200', u, p['status'])], p
    if p['noindex']: errs.append(('noindex_in_sitemap', u, ''))
    if p['canonical'] and p['canonical'] != u: errs.append(('canonical_elsewhere', u, p['canonical']))
    a = p['alts']
    if a:
        own = [k for k, v in a.items() if v == u and k != 'x-default']
        if not own: errs.append(('no_self_hreflang', u, ''))
        elif p['lang'] and p['lang'].split('-')[0] not in [k.split('-')[0] for k in own]: errs.append(('html_lang_mismatch', u, p['lang'] + ' vs ' + ','.join(own)))
        if 'x-default' not in a: errs.append(('no_x_default', u, ''))
        for k, v in a.items():
            if k == 'x-default' or v == u: continue
            q = page_info(v)
            if q['status'] != 200: errs.append(('alternate_not_200', u, k + ' ' + v + ' ' + str(q['status']))); continue
            if u not in q['alts'].values(): errs.append(('no_return_link', u, k + ' ' + v))
            if q['canonical'] and q['canonical'] != v: errs.append(('alternate_canonical_elsewhere', u, v + ' -> ' + q['canonical']))
    if sm_alts and a and sm_alts != a: errs.append(('sitemap_hreflang_differs', u, 'sitemap ' + str(len(sm_alts)) + ' vs page ' + str(len(a))))
    return errs, p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--per', type=int, default=4)
    ap.add_argument('--base', default='https://kolaboro.com')
    ap.add_argument('--json')
    ap.add_argument('--seed', type=int, default=20261120)
    ap.add_argument('--url', nargs='*')
    o = ap.parse_args()
    random.seed(o.seed)
    if o.url: jobs = [(u, {}, 'given') for u in o.url]
    else:
        jobs = []
        for name, rows in sitemap_urls(o.base).items():
            for loc, alts in random.sample(rows, min(o.per, len(rows))): jobs.append((loc, alts, name))
    res, counts = [], {}
    with cf.ThreadPoolExecutor(6) as ex:
        for (u, sa, name), (errs, p) in zip(jobs, ex.map(lambda j: check(j[0], j[1]), jobs)):
            for e in errs: counts[e[0]] = counts.get(e[0], 0) + 1
            res.append({'url': u, 'sitemap': name, 'hreflang': len(p['alts']), 'errors': [list(e) for e in errs]})
    summary = {'checked': len(res), 'with_hreflang': sum(1 for r in res if r['hreflang']), 'errors': counts}
    print(json.dumps(summary))
    for r in res:
        for e in r['errors']: print('\t'.join([e[0], r['sitemap'], e[1], str(e[2])]))
    if o.json: json.dump({'summary': summary, 'pages': res}, open(o.json, 'w'), indent=1)
    sys.exit(1 if counts else 0)


if __name__ == '__main__':
    main()
