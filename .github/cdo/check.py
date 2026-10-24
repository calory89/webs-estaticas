"""Comprueba que las paginas clave de carlosdeory.com responden 200 y que las redirecciones clave funcionan. Falla el job si no."""
import urllib.request, sys
SITE = 'https://www.carlosdeory.com'
OK = ['/', '/blog/', '/speaking/', '/growth/', '/charlas/', '/agencia/', '/europa/', '/destinos/', '/archive/', '/feed.xml', '/sitemap_index.xml', '/post-sitemap.xml',
      '/llms.txt', '/assets/cdo/cdo-boost.js', '/assets/cdo/million-mile-playbook-es.pdf', '/assets/cdo/carlos-de-ory-speaker-kit-en.pdf', '/million-mile-playbook-revolut-ultra/']
REDIR = {'/feed/': '/feed.xml', '/contacto/': '/#contact', '/suiza/': '/europa/'}
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
op = urllib.request.build_opener(NoRedirect)
bad = []
for p in OK:
    try:
        r = urllib.request.urlopen(urllib.request.Request(SITE + p + '?cb=' + str(__import__('time').time_ns()), headers={'User-Agent': 'cdo-check'}), timeout=30)
        if r.status != 200: bad.append(f'{p} {r.status}')
    except Exception as e: bad.append(f'{p} {e}')
for src, dst in REDIR.items():
    try:
        op.open(urllib.request.Request(SITE + src, headers={'User-Agent': 'cdo-check'}), timeout=30); bad.append(f'{src} no redirige')
    except urllib.error.HTTPError as e:
        loc = e.headers.get('Location', '')
        if e.code not in (301, 302, 308) or not loc.endswith(dst): bad.append(f'{src} -> {e.code} {loc}')
print('\n'.join(bad) or 'todo bien')
sys.exit(1 if bad else 0)
