#!/usr/bin/env python3
"""kolaboro.com CTR watch (n33c, 20 Nov 2026; items 41 and 42 of the 20 Nov SEO list). Python 3 standard library only.

Weekly, by hand (no scheduled job, no CI minutes):
  1. In Search Console > Performance > Pages, last 28 days, export the table as CSV (Pages.csv: Top pages, Clicks, Impressions, CTR, Position).
  2. python3 seo-ctr-watch.py --gsc Pages.csv --out ctr-YYYY-MM-DD.tsv [--prev ctr-<last week>.tsv]
It lists the pages with impressions and 0 clicks (default: 20+ impressions), reads each page as it is served now (title and meta
description, the same HTML Googlebot gets) and flags: title over 60 characters, description over 160, title without a number or a
date, title equal to last week's (with --prev). Pages whose title changed since --prev are marked so the CTR can be compared 14 days
after the change (item 42).

Without a Search Console file: --urls file.txt (one URL per line) reads titles and descriptions only (before/after lists).
Output columns: url, clicks, impressions, ctr, position, title_len, title, desc_len, description, flags, changed_since_prev.
"""
import argparse, csv, html, re, sys, urllib.request, concurrent.futures as cf

UA = 'KolaboroCTRWatch/1.0 (+https://kolaboro.com/engineering/)'

def read(url):
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA}), timeout=30)
        s = r.read().decode('utf-8', 'replace')
    except Exception as e:
        return url, getattr(e, 'code', 0), '', ''
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    return url, r.status, html.unescape(t.group(1).strip()) if t else '', html.unescape(d.group(1)) if d else ''

def num(v):
    try: return float(str(v).replace('%', '').replace(',', ''))
    except ValueError: return 0.0

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--gsc', help='Search Console Pages.csv export')
    ap.add_argument('--urls', help='plain list of URLs instead of a Search Console file')
    ap.add_argument('--min-impr', type=float, default=20)
    ap.add_argument('--all', action='store_true', help='keep pages with clicks too')
    ap.add_argument('--prev', help='last run (TSV) to mark changed titles')
    ap.add_argument('--out', default='-')
    a = ap.parse_args()
    rows = []
    if a.gsc:
        with open(a.gsc, newline='', encoding='utf-8-sig') as f:
            for r in csv.DictReader(f):
                k = {x.lower(): x for x in r}
                u = r.get(k.get('top pages') or k.get('page') or k.get('url') or '', '')
                c, i = num(r.get(k.get('clicks', ''), 0)), num(r.get(k.get('impressions', ''), 0))
                if not u.startswith('http') or i < a.min_impr or (c > 0 and not a.all): continue
                rows.append({'url': u, 'clicks': int(c), 'impressions': int(i), 'ctr': r.get(k.get('ctr', ''), ''), 'position': r.get(k.get('position', ''), '')})
        rows.sort(key=lambda r: -r['impressions'])
    elif a.urls:
        rows = [{'url': l.strip(), 'clicks': '', 'impressions': '', 'ctr': '', 'position': ''} for l in open(a.urls, encoding='utf-8') if l.strip().startswith('http')]
    else:
        ap.error('give --gsc or --urls')
    prev = {}
    if a.prev:
        with open(a.prev, encoding='utf-8') as f:
            for r in csv.DictReader(f, delimiter='\t'): prev[r['url']] = r.get('title', '')
    with cf.ThreadPoolExecutor(8) as ex:
        got = {u: (st, t, d) for u, st, t, d in ex.map(read, [r['url'] for r in rows])}
    out = sys.stdout if a.out == '-' else open(a.out, 'w', encoding='utf-8', newline='')
    w = csv.writer(out, delimiter='\t', lineterminator='\n')
    w.writerow(['url', 'clicks', 'impressions', 'ctr', 'position', 'title_len', 'title', 'desc_len', 'description', 'flags', 'changed_since_prev'])
    for r in rows:
        st, t, d = got[r['url']]
        fl = []
        if st != 200: fl.append('status_%s' % st)
        if len(t) > 60: fl.append('title_over_60')
        if len(d) > 160: fl.append('desc_over_160')
        if not re.search(r'\d', t): fl.append('title_no_number')
        ch = '' if r['url'] not in prev else ('yes' if prev[r['url']] != t else 'no')
        if ch == 'no' and r['clicks'] == 0: fl.append('same_title_still_0_clicks')
        w.writerow([r['url'], r['clicks'], r['impressions'], r['ctr'], r['position'], len(t), t, len(d), d, ' '.join(fl), ch])
    if out is not sys.stdout: out.close()

if __name__ == '__main__':
    main()
