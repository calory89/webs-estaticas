#!/usr/bin/env python3
"""Builds ask/index.json: the passages Ask Kolaboro may answer from. Only kolaboro.com's own English pages.
Each passage is a heading-sized piece of one page's main content, with a stable id, the page URL and the nearest anchor.
Run from _s/kolaboro.com:  python3 ask/build_index.py   (project data passages are added live by the worker from the open dataset)."""
import hashlib, html, json, os, re, sys
from html.parser import HTMLParser

PAGES = ['about', 'how-we-score', 'glossary', 'guides/bali-land-titles', 'guides/contract-clauses', 'guides/off-plan-payments',
         'guides/questions-to-ask-a-developer', 'data-policy', 'independence', 'pricing', 'legal/privacy', 'legal/terms', 'corrections',
         'engineering', 'engineering/ai-safety', 'engineering/evals', 'engineering/reliability', 'engineering/signed-photos',
         'engineering/transparency-log', 'docs/api', 'verify', 'log', 'standard', 'transparency-index', 'checklist', 'developers',
         'developers/reply', 'developers/self-check', 'security', 'satellite', 'research', 'press/data', 'data/licence', 'api-pilot',
         'bali', 'dubai', 'lombok', 'phuket', 'algarve', 'tulum', 'lawyers', 'technology', 'report/state-of-off-plan-2026', 'database',
         'agents/how-we-choose', 'tools/deposit-protection', 'tools/delay-compensation', 'tools/payment-plan', 'tools/total-cost',
         'tools/resale-exit', 'tools/currency-risk'] + ['academy/%d' % i for i in (1, 3, 5, 6, 7, 8, 9, 10)]
BLOCK = {'p', 'li', 'h1', 'h2', 'h3', 'h4', 'td', 'th', 'dt', 'dd', 'figcaption', 'blockquote', 'summary', 'tr', 'pre', 'div', 'section', 'br'}
SKIP = {'script', 'style', 'noscript', 'svg', 'form', 'button', 'select', 'textarea', 'nav', 'header', 'footer', 'template'}
MAX = 700


class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.inmain = 0; self.skip = 0; self.cur = []; self.blocks = []; self.anchor = ''; self.h = ''; self.hlevel = None
    def handle_starttag(self, t, a):
        a = dict(a)
        if t == 'main': self.inmain += 1
        if not self.inmain: return
        if t in SKIP: self.skip += 1; return
        if a.get('id') and not self.skip and t in ('section', 'h1', 'h2', 'h3', 'div', 'article', 'details'): self.anchor = a['id']
        if t in BLOCK: self.flush()
        if t in ('h1', 'h2', 'h3'): self.hlevel = t
    def handle_endtag(self, t):
        if not self.inmain: return
        if t in SKIP and self.skip: self.skip -= 1; return
        if t in BLOCK: self.flush(heading=t == self.hlevel)
        if t == 'main': self.inmain -= 1
    def handle_data(self, d):
        if self.inmain and not self.skip: self.cur.append(d)
    def flush(self, heading=False):
        s = re.sub(r'\s+', ' ', ''.join(self.cur)).strip(); self.cur = []
        if heading and s: self.h = s; self.hlevel = None; self.blocks.append(('h', s, self.anchor)); return
        if s: self.blocks.append(('t', s, self.anchor))


def page_title(src):
    m = re.search(r'<title>(.*?)</title>', src, re.S)
    return html.unescape(m.group(1)).replace(' | Kolaboro', '').strip() if m else ''


def passages(path):
    src = open(os.path.join(path, 'index.html'), encoding='utf-8').read()
    p = P(); p.feed(src); p.flush()
    title = page_title(src); out = []; head = title; anchor = ''; buf = []
    def emit():
        t = ' '.join(buf).strip()
        if len(t) >= 60 and t.count('…') < 3 and not re.search(r'\bloading\b', t, re.I):
            out.append({'heading': head, 'anchor': anchor, 'text': t})
    for kind, s, a in p.blocks:
        if kind == 'h':
            emit(); buf = []; head = s; anchor = a or anchor; continue
        if s in buf: continue
        if sum(len(x) + 1 for x in buf) + len(s) > MAX and buf:
            emit(); buf = []
        buf.append(s if len(s) <= MAX * 2 else s[:MAX * 2])
    emit()
    return title, out


def main():
    root = os.getcwd(); idx = []; pages = []
    for pg in PAGES:
        if not os.path.exists(os.path.join(root, pg, 'index.html')): continue
        title, ps = passages(os.path.join(root, pg))
        ps = ps[:40]
        pages.append({'path': '/' + pg + '/', 'title': title, 'passages': len(ps)})
        for i, x in enumerate(ps):
            pid = re.sub(r'[^a-z0-9]+', '-', pg) + '.' + str(i + 1)
            idx.append({'id': pid, 'title': title + (' / ' + x['heading'] if x['heading'] and x['heading'] != title else ''),
                        'url': '/' + pg + '/' + ('#' + x['anchor'] if x['anchor'] else ''), 'text': x['text']})
    body = {'version': 1, 'built': os.environ.get('BUILT') or __import__('datetime').date.today().isoformat(), 'pages': pages, 'passages': idx}
    s = json.dumps(body, ensure_ascii=False, separators=(',', ':'))
    body['sha256'] = hashlib.sha256(s.encode()).hexdigest()
    json.dump(body, open(os.path.join(root, 'ask', 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(len(pages), 'pages', len(idx), 'passages', len(s), 'bytes', file=sys.stderr)


main()
