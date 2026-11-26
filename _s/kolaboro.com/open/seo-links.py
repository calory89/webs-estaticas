#!/usr/bin/env python3
# kolaboro.com n33b (20 Nov 2026): weekly log of external links to kolaboro.com, published at /engineering/seo/links/.
# Two kinds of entries in /data/seo-external-links.json:
#   gsc    the figures Search Console shows under Links > External links (read by the site owner's team in Search Console;
#          added with --gsc LINKS SITES DATE "site1,site2,..."). Never estimated.
#   check  a crawl of the known linking pages listed in "sources": each page is fetched and the links to kolaboro.com counted.
# Usage: python3 open/seo-links.py data/seo-external-links.json [--gsc 5 3 2026-11-20 github.com,realhunt.co,...]
# Standard library only. User agent "KolaboroSEOAudit/1.0". Writes the file in place and prints the new entry.
import json, re, sys, datetime, urllib.request
p = sys.argv[1]
D = json.load(open(p))
today = datetime.date.today().isoformat()
if '--gsc' in sys.argv:
    i = sys.argv.index('--gsc'); links, sites, day, names = int(sys.argv[i + 1]), int(sys.argv[i + 2]), sys.argv[i + 3], sys.argv[i + 4].split(',')
    D['gsc'] = [g for g in D.get('gsc', []) if g['date'] != day] + [{'date': day, 'external_links': links, 'linking_sites': sites, 'top_sites': names}]
    D['gsc'].sort(key=lambda g: g['date'])
res = []
for s in D['sources']:
    try:
        rq = urllib.request.Request(s['url'], headers={'user-agent': 'KolaboroSEOAudit/1.0', 'accept': 'text/html'})
        h = urllib.request.urlopen(rq, timeout=25).read().decode('utf-8', 'replace')
        L = sorted(set(re.findall(r'href="(https?://(?:www\.)?kolaboro\.com[^"#]*)"', h)))
        res.append({'url': s['url'], 'status': 200, 'links_to_kolaboro': len(L), 'targets': L[:20]})
    except Exception as e:
        res.append({'url': s['url'], 'status': getattr(e, 'code', None) or 'error', 'links_to_kolaboro': 0, 'targets': []})
entry = {'date': today, 'pages_checked': len(res), 'pages_linking': sum(1 for r in res if r['links_to_kolaboro']), 'links': sum(r['links_to_kolaboro'] for r in res), 'pages': res}
D['checks'] = [c for c in D.get('checks', []) if c['date'] != today] + [entry]
D['updated'] = today
json.dump(D, open(p, 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: v for k, v in entry.items() if k != 'pages'}))

# --page <index.html>: rewrite the tables between <!--LK:BEGIN--> and <!--LK:END--> of /engineering/seo/links/ from the file
if '--page' in sys.argv:
    import html as H
    pg = sys.argv[sys.argv.index('--page') + 1]; t = open(pg).read(); e = H.escape
    fd = lambda d: datetime.date.fromisoformat(d).strftime('%-d %b %Y')
    g = D.get('gsc', [])
    gs = ('<table><thead><tr><th scope="col">Week of</th><th scope="col">External links</th><th scope="col">Linking sites</th><th scope="col">Sites</th></tr></thead><tbody>' +
          ''.join('<tr><td>%s</td><td>%d</td><td>%d</td><td>%s</td></tr>' % (fd(x['date']), x['external_links'], x['linking_sites'], e(', '.join(x['top_sites']))) for x in reversed(g)) + '</tbody></table>') if g else '<p>No Search Console reading yet.</p>'
    c = D['checks'][-1]
    cs = ('<p>Last crawl of the known linking pages: %s. %d of %d pages link to kolaboro.com, %d distinct links in all.</p><table><thead><tr><th scope="col">Page</th><th scope="col">Page run by the same operator</th><th scope="col">Links to kolaboro.com</th></tr></thead><tbody>' % (fd(c['date']), c['pages_linking'], c['pages_checked'], c['links']) +
          ''.join('<tr><td><a href="%s" rel="noopener">%s</a></td><td>%s</td><td>%s</td></tr>' % (e(r['url']), e(r['url'].replace('https://', '')), 'yes' if next((s for s in D['sources'] if s['url'] == r['url']), {}).get('same_operator') else 'no', r['links_to_kolaboro'] if r['status'] == 200 else 'not reachable (%s)' % e(str(r['status']))) for r in c['pages']) + '</tbody></table>')
    t = re.sub(r'<!--LK:BEGIN-->.*?<!--LK:END-->', lambda m: '<!--LK:BEGIN--><h2>Search Console</h2>' + gs + '<h2>Known linking pages</h2>' + cs + '<!--LK:END-->', t, flags=re.S)
    open(pg, 'w').write(t)
