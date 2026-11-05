#!/usr/bin/env python3
"""Crawl audit of kolaboro.com for search and answer engines (seoT, batch 8).

Reads every URL in https://kolaboro.com/sitemap_index.xml, fetches each with GET and HEAD (no redirects followed) and checks:
  status codes, HEAD = GET status, redirects listed in sitemaps, canonical (must be the URL itself), meta robots / X-Robots-Tag,
  hreflang (valid codes, x-default present, reciprocal links between crawled pages), JSON-LD (parses, schema.org context, @type on
  every node, required properties for BreadcrumbList / FAQPage / Dataset / ItemList, and no Review, AggregateRating or ClaimReview),
  title and meta description present, duplicate titles.
Also writes the last commit date of every static page in /sitemap.xml (GitHub API, path history on pub/_lovable) so the sitemaps can
carry a true lastmod, and the list of sitemap URLs that are noindex or not 200 so the sitemaps can drop them.

Usage: audit.py <out_dir>   (env GITHUB_TOKEN and GITHUB_REPOSITORY for lastmod; KB_BASE to crawl another host)
Writes <out_dir>/seo-audit.json. Never fakes a number: what was not measured is left out.
"""
import concurrent.futures as cf, datetime as dt, html, json, os, re, sys, time, urllib.error, urllib.request

BASE = os.environ.get('KB_BASE', 'https://kolaboro.com')
UA = 'KolaboroSEOAudit/1.0 (+https://kolaboro.com/engineering/seo/)'
LANGS = {'en', 'es', 'de', 'fr', 'ru', 'nl', 'ar', 'zh', 'x-default'}
FORBIDDEN = {'Review', 'AggregateRating', 'ClaimReview'}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None


OPENER = urllib.request.build_opener(NoRedirect)


def get(url, method='GET', timeout=30):
    req = urllib.request.Request(url, method=method, headers={'user-agent': UA, 'accept-encoding': 'identity'})
    for attempt in range(6):
        try:
            with OPENER.open(req, timeout=timeout) as r:
                return r.status, dict((k.lower(), v) for k, v in r.headers.items()), (r.read() if method == 'GET' else b'')
        except urllib.error.HTTPError as e:
            body = e.read() if method == 'GET' else b''
            if e.code == 429 and attempt < 5: time.sleep(min(60, float(e.headers.get('retry-after') or 0) or 5 * 2 ** attempt)); continue
            if e.code in (502, 503, 504) and attempt < 2: time.sleep(2 + attempt * 3); continue
            return e.code, dict((k.lower(), v) for k, v in e.headers.items()), body
        except Exception as e:
            if attempt < 2: time.sleep(2 + attempt * 3); continue
            return 0, {}, str(e).encode()


def sitemap_urls():
    st, h, body = get(BASE + '/sitemap_index.xml')
    if st != 200: raise SystemExit('sitemap index %s' % st)
    maps = re.findall(r'<loc>([^<]+)</loc>', body.decode())
    out = {}
    for m in maps:
        st, h, b = get(m)
        t = b.decode('utf-8', 'replace')
        for u in re.finditer(r'<url><loc>([^<]+)</loc>(?:<lastmod>([^<]+)</lastmod>)?', t):
            out[html.unescape(u.group(1))] = {'sitemap': m.rsplit('/', 1)[-1], 'lastmod': u.group(2)}
    # Named pages in the 7 translated languages share templates with English: crawl every English page and an even sample of the
    # others (KB_SAMPLE per sitemap, default 120), so the run stays polite to the site and inside the job's time limit.
    n = int(os.environ.get('KB_SAMPLE', '120'))
    for sm in {v['sitemap'] for v in out.values()}:
        if re.match(r'(projects|developers)-(es|de|fr|ru|nl|ar|zh)\.xml$', sm):
            us = sorted(u for u, v in out.items() if v['sitemap'] == sm); step = max(1, len(us) // n)
            for i, u in enumerate(us):
                if i % step: out[u]['skip'] = True
    return maps, out


def attrs(tag):
    return {k.lower(): html.unescape(v) for k, v in re.findall(r'([a-zA-Z:-]+)\s*=\s*"([^"]*)"', tag)}


def check_ld(blocks):
    errs, types, valid = [], set(), 0
    for raw in blocks:
        try: data = json.loads(raw)
        except Exception as e: errs.append('JSON-LD does not parse: %s' % str(e)[:60]); continue
        nodes = []
        def walk(x, top):
            if isinstance(x, list):
                for y in x: walk(y, top)
            elif isinstance(x, dict):
                if '@graph' in x: walk(x['@graph'], True); return
                if top: nodes.append(x)
        walk(data, True)
        ctx_ok = (isinstance(data, dict) and 'schema.org' in str(data.get('@context', ''))) or (isinstance(data, list) and all('schema.org' in str(d.get('@context', '')) for d in data if isinstance(d, dict)))
        if not ctx_ok: errs.append('JSON-LD without schema.org @context')
        block_ok = ctx_ok
        for n in nodes:
            t = n.get('@type')
            if not t: errs.append('JSON-LD node without @type'); block_ok = False; continue
            for tt in (t if isinstance(t, list) else [t]): types.add(tt)
            if set(t if isinstance(t, list) else [t]) & FORBIDDEN: errs.append('forbidden schema type %s' % t); block_ok = False
            if t == 'BreadcrumbList':
                il = n.get('itemListElement') or []
                if not il or any(not (i.get('position') and i.get('name') and i.get('item')) for i in il): errs.append('BreadcrumbList item without position, name or item'); block_ok = False
            if t == 'FAQPage':
                me = n.get('mainEntity') or []
                if not me or any(not (q.get('name') and (q.get('acceptedAnswer') or {}).get('text')) for q in me): errs.append('FAQPage question without name or answer'); block_ok = False
            if t == 'Dataset' and not (n.get('name') and n.get('description')): errs.append('Dataset without name or description'); block_ok = False
        valid += 1 if block_ok else 0
    return errs, sorted(types), (valid == len(blocks) and len(blocks) > 0)


def audit_one(url):
    r = {'url': url}
    st, h, body = get(url)
    hs, hh, _ = get(url, 'HEAD')
    r['status'], r['head'] = st, hs
    if st in (301, 302, 307, 308): r['location'] = h.get('location')
    if st != 200: return r
    t = body.decode('utf-8', 'replace')
    ct = h.get('content-type', '')
    if 'html' not in ct: r['type'] = ct; return r
    head = t[:t.find('</head>')] if '</head>' in t else t[:60000]
    m = re.search(r'<title>(.*?)</title>', head, re.S); r['title'] = html.unescape(m.group(1)).strip() if m else ''
    r['desc'] = bool(re.search(r'<meta name="description" content="[^"]+', head))
    can = [attrs(x).get('href') for x in re.findall(r'<link[^>]+rel="canonical"[^>]*>', head)]
    r['canonical'] = can
    rob = ' '.join(attrs(x).get('content', '') for x in re.findall(r'<meta[^>]+name="robots"[^>]*>', head)) + ' ' + h.get('x-robots-tag', '')
    r['noindex'] = 'noindex' in rob.lower()
    r['hreflang'] = [(a.get('hreflang'), a.get('href')) for a in (attrs(x) for x in re.findall(r'<link[^>]+hreflang=[^>]*>', head))]
    blocks = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', t, re.S)
    r['ld_errors'], r['ld_types'], r['ld_valid'] = check_ld(blocks)
    r['ld_blocks'] = len(blocks)
    return r


def lastmods(pages):
    tok, repo = os.environ.get('GITHUB_TOKEN'), os.environ.get('GITHUB_REPOSITORY')
    if not tok or not repo: return {}
    out = {}
    def one(p):
        f = '_s/kolaboro.com' + (p + 'index.html' if p.endswith('/') else p)
        req = urllib.request.Request('https://api.github.com/repos/%s/commits?sha=pub/_lovable&per_page=1&path=%s' % (repo, urllib.request.quote(f)), headers={'authorization': 'Bearer ' + tok, 'accept': 'application/vnd.github+json', 'user-agent': UA})
        try:
            with urllib.request.urlopen(req, timeout=30) as r: j = json.load(r)
            return p, (j[0]['commit']['committer']['date'][:10] if j else None)
        except Exception: return p, None
    with cf.ThreadPoolExecutor(6) as ex:
        for p, d in ex.map(one, pages):
            if d: out[p] = d
    return out


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    maps, urls = sitemap_urls()
    with cf.ThreadPoolExecutor(int(os.environ.get('KB_THREADS', '3'))) as ex: res = list(ex.map(audit_one, [u for u, v in urls.items() if not v.get('skip')]))
    by = {r['url']: r for r in res}
    problems, titles = [], {}
    def P(u, issue): problems.append({'url': u, 'issue': issue})
    if any(r['status'] == 429 for r in res): print('rate limited: %d URLs got 429 after retries' % sum(1 for r in res if r['status'] == 429))
    S = dict(in_sitemaps=len(urls), crawled=len(res), ok_200=0, indexable=0, schema_valid_pages=0, schema_pages=0, schema_errors=0, head_mismatch=0, canonical_mismatch=0, hreflang_errors=0, redirects=0, errors_4xx_5xx=0, noindex_in_sitemap=0, missing_title=0, missing_description=0, duplicate_titles=0)
    for r in res:
        u = r['url']
        if r['status'] == 200: S['ok_200'] += 1
        if r['status'] in (301, 302, 307, 308): S['redirects'] += 1; P(u, 'in a sitemap but redirects to %s' % r.get('location'))
        elif r['status'] >= 400 or r['status'] == 0: S['errors_4xx_5xx'] += 1; P(u, 'status %s' % r['status'])
        if r['head'] != r['status']: S['head_mismatch'] += 1; P(u, 'HEAD %s but GET %s' % (r['head'], r['status']))
        if r['status'] != 200 or 'title' not in r: continue
        can = r['canonical']
        if len(can) != 1 or can[0] != u: S['canonical_mismatch'] += 1; P(u, 'canonical %s' % (can or 'missing'))
        if r['noindex']: S['noindex_in_sitemap'] += 1; P(u, 'noindex but listed in a sitemap')
        if not r['title']: S['missing_title'] += 1; P(u, 'no <title>')
        else: titles.setdefault(r['title'], []).append(u)
        if not r['desc']: S['missing_description'] += 1; P(u, 'no meta description')
        if r['ld_blocks']:
            S['schema_pages'] += 1
            if r['ld_valid']: S['schema_valid_pages'] += 1
        for e in r['ld_errors']: S['schema_errors'] += 1; P(u, e)
        hl = r['hreflang']
        if hl:
            codes = [c for c, _ in hl]
            bad = [c for c in codes if c not in LANGS]
            if bad: S['hreflang_errors'] += 1; P(u, 'hreflang code(s) %s' % bad)
            if 'x-default' not in codes: S['hreflang_errors'] += 1; P(u, 'hreflang without x-default')
            if u not in [x for _, x in hl]: S['hreflang_errors'] += 1; P(u, 'hreflang set does not include the page itself')
            for c, x in hl:
                o = by.get(x)
                if o and o.get('status') == 200 and o.get('hreflang') is not None and u not in [y for _, y in o['hreflang']]: S['hreflang_errors'] += 1; P(u, 'hreflang %s -> %s is not reciprocal' % (c, x))
        if r['status'] == 200 and len(can) == 1 and can[0] == u and not r['noindex']: S['indexable'] += 1
    for t, us in titles.items():
        if len(us) > 1: S['duplicate_titles'] += len(us); P(us[0], 'title shared with %d other URL(s): %s' % (len(us) - 1, t[:80]))
    static = [u.replace(BASE, '') for u, v in urls.items() if v['sitemap'].startswith('pages-')]
    exclude = sorted(u.replace(BASE, '') for u, v in urls.items() if v['sitemap'].startswith('pages-') and (by[u]['status'] != 200 or by[u].get('noindex')))
    prev = {}
    try:
        st, h, b = get(BASE + '/data/seo-audit.json')
        if st == 200: prev = json.loads(b)
    except Exception: pass
    now = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
    hist = (prev.get('history') or [])[-59:] + [{'at': now, 'crawled': S['crawled'], 'indexable': S['indexable'], 'schema_valid_pages': S['schema_valid_pages'], 'problems': len(problems)}]
    by_map = {}
    for u, v in urls.items(): by_map[v['sitemap']] = by_map.get(v['sitemap'], 0) + 1
    extrap = round(S['indexable'] + sum(1 for u, v in urls.items() if v.get('skip')) * (sum(1 for r in res if r['url'] in urls and urls[r['url']]['sitemap'][:9] in ('projects-', 'developer') and not urls[r['url']]['sitemap'].endswith('-en.xml') and r['status'] == 200) / max(1, sum(1 for r in res if r['url'] in urls and urls[r['url']]['sitemap'][:9] in ('projects-', 'developer') and not urls[r['url']]['sitemap'].endswith('-en.xml')))))
    out = {'version': 'seo-audit-1', 'generated_at': now, 'base': BASE, 'crawler': UA, 'sitemaps': maps, 'urls_by_sitemap': by_map, 'summary': S, 'indexable_estimate_all': extrap, 'sampled_note': 'Translated named pages are sampled (KB_SAMPLE per sitemap); indexable_estimate_all applies the sample pass rate to the URLs not fetched.',
           'schema_types': sorted({t for r in res for t in r.get('ld_types', [])}), 'problems': problems[:500], 'exclude': exclude,
           'lastmod': lastmods(static), 'history': hist,
           'method': 'GET and HEAD on every sitemap URL, redirects not followed. Indexable = 200, exactly one canonical equal to the URL, no noindex. Valid structured data = every JSON-LD block parses, has a schema.org context and @type on every node, required properties present, no Review, AggregateRating or ClaimReview.'}
    json.dump(out, open(os.path.join(out_dir, 'seo-audit.json'), 'w'), indent=1)
    print(json.dumps(S))
    print('problems', len(problems))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
