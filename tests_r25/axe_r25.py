import sys, json
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8994'
AXE = open('/home/claude/sn/axe/node_modules/axe-core/axe.min.js').read()
pages = ['/s/apc-n7153139085', '/s/2theloo-w725920658', '/s/acopio-cooperativa-valle-verde-n7383537248', '/country/espana', '/country/ireland',
         '/c/madrid', '/c/madrid.en', '/c/dublin', '/c/baile-atha-cliath', '/c/cork-hygiene', '/t/madrid', '/c/', '/c/vilnius-clothes', '/datos/', '/c/new-york', '/c/pamplona-health']
fails = 0
with sync_playwright() as p:
    b = p.chromium.launch()
    for mobile in (False, True):
        ctx = b.new_context(bypass_csp=True, viewport={'width': 390, 'height': 844} if mobile else {'width': 1280, 'height': 900},
                            color_scheme='dark' if mobile else 'light')
        ctx.route('**/__sb/**', lambda r: r.abort()); ctx.route('**/stats/**', lambda r: r.abort())
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)[:100]))
        for u in pages:
            r = pg.goto(BASE + u, wait_until='load')
            st = r.status if r else 0
            if u.endswith('clothes') or 'baile' in u:
                pg.wait_for_timeout(600); ok = ('/c/vilnius' in pg.url) or ('/c/dublin' in pg.url)
                print(('OK ' if ok else 'FALLO ') + u + ' -> ' + pg.url); fails += (not ok); continue
            pg.add_script_tag(content=AXE)
            res = pg.evaluate("async () => { const r = await axe.run(document, {runOnly: ['wcag2a','wcag2aa','best-practice']}); return r.violations.map(v => v.id + ':' + v.nodes.length); }")
            sw = pg.evaluate('document.documentElement.scrollWidth > window.innerWidth + 1')
            bad = [x for x in res if not x.startswith('region')]
            ok = st == 200 and not bad and not sw and not errs
            fails += (not ok)
            print(('OK ' if ok else 'FALLO ') + ('movil ' if mobile else 'escr. ') + u, st, bad, 'scroll-h' if sw else '', errs[:2])
            errs.clear()
        if mobile: pg.goto(BASE + '/s/apc-n7153139085'); pg.screenshot(path='/home/claude/sn/qa_r24/place_ar_mobile.png', full_page=True)
        else: pg.goto(BASE + '/s/acopio-cooperativa-valle-verde-n7383537248'); pg.screenshot(path='/home/claude/sn/qa_r24/place_es.png', full_page=True); pg.goto(BASE + '/country/espana'); pg.screenshot(path='/home/claude/sn/qa_r24/country_es.png')
        ctx.close()
    b.close()
print('FALLOS', fails)
