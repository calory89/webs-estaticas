#!/usr/bin/env python3
"""kolaboro.com canonical and hreflang build check (n40 k16, 26 Nov 2026, R03-30). Python 3 standard library only.

Reads every static page of the site in the checkout (_s/kolaboro.com/**/index.html) and, with --live, a sample of
pages the edge worker builds (one per worker template in 8 languages). For every page it fails when:
  - two different hreflang codes point to the same URL (a page given as its own alternate in another language;
    x-default may equal one language, as the rules allow)
  - the canonical or an hreflang alternate points to a kolaboro.com path that does not exist: no static file in the
    checkout and, with --live, a 404 or 410 from https://kolaboro.com
  - the canonical of a static page is on another host
Usage: alternates-check.py [ROOT] [--live] [--json out.json]     ROOT is the branch root (default .)
Exit code 0 when clean, 1 when an error was found. Run by open/pre-push.sh (step 6); documented on /engineering/seo/.
"""
import concurrent.futures as cf, glob, json, os, re, sys, urllib.error, urllib.request

UA = 'KolaboroAlternatesCheck/1.0 (+https://kolaboro.com/engineering/seo/)'
ORIGIN = 'https://kolaboro.com'
LANGS = ['en', 'es', 'fr', 'de', 'nl', 'ru', 'zh', 'ar']
# one page per worker template; the translated versions are added for each language
LIVE = ['/m/dubai/', '/m/bali/', '/countries/uae/', '/rankings/', '/rankings/most-delayed/dubai/', '/developers/binghatti/',
        '/projects/binghatti-skyrise/', '/map/', '/compare/', '/tools/payment-plan/', '/guides/buying-off-plan/dubai/', '/glossary/escrow/']
LINK = re.compile(r'<link\b[^>]*>', re.I)
ATTR = lambda tag, a: (re.search(r'\b' + a + r'\s*=\s*"([^"]*)"', tag) or [None, None])[1]


def links(html):
    canon, alt = None, []
    for tag in LINK.findall(html.split('</head>', 1)[0]):
        rel = (ATTR(tag, 'rel') or '').lower()
        if rel == 'canonical': canon = ATTR(tag, 'href')
        elif rel == 'alternate' and ATTR(tag, 'hreflang'): alt.append((ATTR(tag, 'hreflang'), ATTR(tag, 'href')))
    return canon, alt


def static_exists(root, path):
    p = path.split('?')[0].split('#')[0]
    if not p.endswith('/'):
        return os.path.isfile(os.path.join(root, '_s/kolaboro.com', p.lstrip('/')))
    return os.path.isfile(os.path.join(root, '_s/kolaboro.com', p.lstrip('/'), 'index.html'))


STAT = {}
def live_status(path):
    if path in STAT: return STAT[path]
    try:
        with urllib.request.urlopen(urllib.request.Request(ORIGIN + path, headers={'user-agent': UA}), timeout=45) as r: s = r.status
    except urllib.error.HTTPError as e: s = e.code
    except Exception: s = 0
    STAT[path] = s; return s


def check(page, html, root, live, errs, todo):
    canon, alt = links(html)
    seen = {}
    for code, href in alt:
        if not href: continue
        if code != 'x-default':
            if href in seen and seen[href] != code: errs.append([page, 'own alternate', href + ' is given for ' + seen[href] + ' and ' + code])
            seen.setdefault(href, code)
    for kind, href in [('canonical', canon)] + [('hreflang ' + c, h) for c, h in alt]:
        if not href: continue
        if not href.startswith(ORIGIN + '/'):
            if kind == 'canonical' and href.startswith('http'): errs.append([page, 'canonical off site', href])
            continue
        path = href[len(ORIGIN):]
        if not static_exists(root, path): todo.append((page, kind, path))


def main():
    av = sys.argv[1:]; a = [x for i, x in enumerate(av) if not x.startswith('--') and not (i and av[i - 1] == '--json')]
    root = a[0] if a else '.'
    live = '--live' in sys.argv
    errs, todo, n = [], [], 0
    for f in glob.glob(os.path.join(root, '_s/kolaboro.com/**/index.html'), recursive=True):
        try: html = open(f, encoding='utf-8', errors='replace').read(200000)
        except Exception: continue
        if 'hreflang' not in html and 'canonical' not in html: continue
        n += 1
        check('/' + os.path.relpath(os.path.dirname(f), os.path.join(root, '_s/kolaboro.com')).replace('.', '').strip('/') + '/', html, root, live, errs, todo)
    if live:
        pages = [p if l == 'en' else '/' + l + p for p in LIVE for l in LANGS]
        def fetch(p):
            try:
                with urllib.request.urlopen(urllib.request.Request(ORIGIN + p, headers={'user-agent': UA}), timeout=60) as r: return p, r.status, r.read().decode('utf-8', 'replace')
            except urllib.error.HTTPError as e: return p, e.code, ''
            except Exception: return p, 0, ''
        with cf.ThreadPoolExecutor(6) as ex:
            for p, s, html in ex.map(fetch, pages):
                if s == 200: n += 1; check(p.replace('//', '/'), html, root, live, errs, todo)
        with cf.ThreadPoolExecutor(6) as ex:
            res = list(ex.map(lambda t: (t, live_status(t[2])), {t[2]: t for t in todo}.values()))
        bad = {t[2] for t, s in res if s in (404, 410)}
        for page, kind, path in todo:
            if path in bad: errs.append([page, kind + ' points to a 404', path])
    print('alternates check: %d pages, %d errors, %d targets not static%s' % (n, len(errs), len({t[2] for t in todo}), '' if live else ' (not fetched: run with --live)'))
    for e in errs[:40]: print('  ERROR', ' | '.join(e))
    if '--json' in sys.argv:
        json.dump({'pages': n, 'errors': errs}, open(sys.argv[sys.argv.index('--json') + 1], 'w'), indent=1)
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
