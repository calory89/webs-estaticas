#!/usr/bin/env python3
"""Daily sample check of kolaboro.com (n26i, batch 26): structured data, internal 404s and redirects.

Every day a different, even sample of sitemap URLs (KB_DAILY_PAGES, default 48: at least one per sitemap, the rest spread over the
project and developer sitemaps in all 8 languages, rotating by date) is fetched and checked with the same rules as the weekly crawl
audit (audit.py): status, one self canonical, no noindex, every JSON-LD block valid, no Review / AggregateRating / ClaimReview, and the
types each page kind must carry (project pages: FAQPage, BreadcrumbList, Dataset; developer pages: BreadcrumbList).
Then every internal link found on those pages (href, plus JSON-LD url/item) is requested once without following redirects
(KB_DAILY_LINKS, default 300, at most 4 requests a second): 404 / 410 / 5xx and redirects are listed with the page that links them.

Usage: daily.py <out_dir>   Writes <out_dir>/seo-daily.json (with the last 30 runs as history, read from the live file).
Exit code 3 when something is broken (the workflow turns it into a warning annotation, the file is still published).
"""
import datetime as dt, html, json, os, random, re, sys, time, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audit import BASE, get, attrs, check_ld  # noqa: E402

REQ = {'project': {'FAQPage', 'BreadcrumbList', 'Dataset'}, 'developer': {'BreadcrumbList'}}
SKIP = re.compile(r'^/(api|mcp|cdn-cgi|admin|portal|login|__)(/|$)|^/(?:[a-z]{2}/)?(?:developers/reply|ask-developer|corrections|buyer-reports|check|compare|hazards|tools/site-visit)/\?')
last_t = [0.0]


def polite():
    w = 0.25 - (time.time() - last_t[0])
    if w > 0: time.sleep(w)
    last_t[0] = time.time()


def sitemaps():
    st, h, b = get(BASE + '/sitemap_index.xml')
    if st != 200: raise SystemExit('sitemap index %s' % st)
    out = {}
    for m in re.findall(r'<loc>([^<]+)</loc>', b.decode()):
        if m.endswith('/images.xml'): continue
        polite(); st, h, t = get(m)
        out[m.rsplit('/', 1)[-1]] = [html.unescape(x) for x in re.findall(r'<url><loc>([^<]+)</loc>', t.decode('utf-8', 'replace'))]
    return out


def sample(maps, n, seed):
    rnd = random.Random(seed)
    pick = []
    for k in sorted(maps):
        if maps[k]: pick.append(rnd.choice(maps[k]))
    big = [u for k in sorted(maps) if re.match(r'(projects|developers)-', k) for u in maps[k]]
    rnd.shuffle(big)
    for u in big:
        if len(pick) >= n: break
        if u not in pick: pick.append(u)
    return pick


def kind(u):
    p = u.replace(BASE, '')
    if re.match(r'^/(?:[a-z]{2}/)?projects/[^/]+/$', p): return 'project'
    if re.match(r'^/(?:[a-z]{2}/)?developers/[^/]+/$', p): return 'developer'
    return 'page'


def page_check(u):
    polite(); st, h, body = get(u)
    r = {'url': u, 'status': st, 'kind': kind(u), 'problems': []}
    if st != 200: r['problems'].append('status %s' % st); return r, []
    t = body.decode('utf-8', 'replace'); head = t[:t.find('</head>')] if '</head>' in t else t[:60000]
    can = [attrs(x).get('href') for x in re.findall(r'<link[^>]+rel="canonical"[^>]*>', head)]
    if can != [u]: r['problems'].append('canonical %s' % (can or 'missing'))
    rob = ' '.join(attrs(x).get('content', '') for x in re.findall(r'<meta[^>]+name="robots"[^>]*>', head)) + ' ' + h.get('x-robots-tag', '')
    if 'noindex' in rob.lower(): r['problems'].append('noindex but listed in a sitemap')
    blocks = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', t, re.S)
    errs, types, valid = check_ld(blocks)
    r.update(ld_blocks=len(blocks), ld_valid=valid, ld_types=types)
    r['problems'] += [e for e in errs if 'recommended' not in e]
    miss = REQ.get(r['kind'], set()) - set(types)
    if miss: r['problems'].append('missing JSON-LD type(s) %s' % ', '.join(sorted(miss)))
    links = set()
    vis = re.sub(r'<script\b(?![^>]*application/ld\+json)[^>]*>.*?</script>', ' ', t, flags=re.S)   # links inside scripts are code, not links
    for m in re.finditer(r'<a\s[^>]*href="([^"#]+)', vis):
        x = html.unescape(m.group(1))
        if x.startswith('/') and not x.startswith('//'): links.add(BASE + x)
        elif x.startswith(BASE + '/'): links.add(x)
    for raw in blocks:
        for x in re.findall(r'"(?:url|item|@id)"\s*:\s*"(https://kolaboro\.com/[^"#]*)', raw): links.add(x)
    return r, sorted(links)


def link_check(u):
    p = u.replace(BASE, '')
    if SKIP.search(p): return None
    polite(); st, h, _ = get(u, 'HEAD', 20)
    if st in (404, 405, 0) or st >= 500: polite(); st, h, _ = get(u, 'GET', 25)   # some routes answer HEAD differently; crawlers use GET
    return {'url': u, 'status': st, 'location': h.get('location')}


def main(out):
    os.makedirs(out, exist_ok=True)
    now = dt.datetime.now(dt.timezone.utc); seed = now.strftime('%Y-%m-%d')
    maps = sitemaps()
    pages = sample(maps, int(os.environ.get('KB_DAILY_PAGES', '48')), seed)
    res, found = [], {}
    for u in pages:
        r, L = page_check(u); res.append(r)
        for x in L: found.setdefault(x, u)
    cand = sorted(found); random.Random(seed).shuffle(cand)
    in_sm = {x for v in maps.values() for x in v}
    cand = [x for x in cand if x not in in_sm][: int(os.environ.get('KB_DAILY_LINKS', '300'))] + [x for x in cand if x in in_sm][:60]
    broken, redir, checked = [], [], 0
    for x in cand:
        c = link_check(x)
        if not c: continue
        checked += 1
        if c['status'] in (301, 302, 307, 308):
            loc = urllib.parse.urljoin(x, c['location'] or '')
            redir.append({'url': x.replace(BASE, ''), 'status': c['status'], 'to': loc.replace(BASE, ''), 'found_on': found[x].replace(BASE, '')})
        elif c['status'] >= 400 or c['status'] == 0:
            broken.append({'url': x.replace(BASE, ''), 'status': c['status'], 'found_on': found[x].replace(BASE, '')})
    prob = [{'url': r['url'].replace(BASE, ''), 'issue': p} for r in res for p in r['problems']]
    S = {'pages': len(res), 'pages_ok': sum(1 for r in res if not r['problems']), 'ld_pages': sum(1 for r in res if r.get('ld_blocks')), 'ld_valid': sum(1 for r in res if r.get('ld_valid')),
         'page_problems': len(prob), 'links_checked': checked, 'links_ok': checked - len(broken) - len(redir), 'redirects': len(redir), 'broken': len(broken)}
    prev = {}
    try:
        st, h, b = get(BASE + '/data/seo-daily.json')
        if st == 200: prev = json.loads(b)
    except Exception: pass
    at = now.strftime('%Y-%m-%dT%H:%MZ')
    hist = [x for x in (prev.get('history') or []) if x.get('at', '')[:10] != at[:10]][-29:] + [dict(at=at, **S)]
    data = {'version': 'seo-daily-1', 'generated_at': at, 'base': BASE, 'seed': seed, 'summary': S, 'problems': prob[:200], 'broken': broken[:200], 'redirects': redir[:200],
            'pages': [{'url': r['url'].replace(BASE, ''), 'kind': r['kind'], 'status': r['status'], 'ld_types': r.get('ld_types', []), 'ok': not r['problems']} for r in res], 'history': hist,
            'method': 'A different sample of sitemap URLs every day (at least one per sitemap; the rest from the project and developer sitemaps of all 8 languages). Each page: status 200, exactly one canonical equal to its URL, no noindex, every JSON-LD block parses with a schema.org context and @type on every node, required properties present, no Review / AggregateRating / ClaimReview, and the types its kind must carry. Then every internal link on those pages is requested once without following redirects (HEAD, then GET when HEAD is not answered), at most 4 requests a second. Form pages reached with a per-project query and API routes are left out.'}
    json.dump(data, open(os.path.join(out, 'seo-daily.json'), 'w'), indent=1)
    print(json.dumps(S))
    for p in prob[:20]: print('page problem:', p)
    for b in broken[:20]: print('broken link:', b)
    return 3 if (broken or prob) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '.'))
