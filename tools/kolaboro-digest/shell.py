"""Page shell for kolaboro.com pages built by jobs: takes an existing page (header, footer, scripts stay the live ones)
and swaps the title, meta tags and <main>. Block X6, 5 Nov 2026."""
import html
import re


def esc(s):
    return html.escape('' if s is None else str(s), quote=True)


def page(shell, title, desc, canon, main, extra_head=''):
    t = shell
    t = re.sub(r'<title>.*?</title>', '<title>%s</title>' % esc(title), t, count=1, flags=re.S)
    t = re.sub(r'<meta name="description" content="[^"]*"?\s*>?', '<meta name="description" content="%s">' % esc(desc), t, count=1)
    t = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s">' % esc(canon), t, count=1)
    t = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s">' % esc(title), t, count=1)
    t = re.sub(r'<meta property="og:description" content="[^"]*"?\s*>?', '<meta property="og:description" content="%s">' % esc(desc), t, count=1)
    t = re.sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s">' % esc(canon), t, count=1)
    # page-specific JSON-LD of the shell page would describe the wrong page: drop WebPage blocks, keep the Organization one
    t = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"(WebPage|Dataset|CollectionPage)".*?</script>\n?', '', t, flags=re.S)
    if extra_head:
        t = t.replace('</head>', extra_head + '\n</head>', 1)
    a, b = t.find('<main id="main">'), t.find('</main>')
    if a < 0 or b < 0:
        raise SystemExit('shell has no <main id="main">')
    return t[:a] + '<main id="main">\n' + main + '\n' + t[b:]
