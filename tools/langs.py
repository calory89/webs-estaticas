import sys, re, json
from playwright.sync_api import sync_playwright
B=sys.argv[1]; LANGS='en es fr ar uk ro pl ru pt ur fa wo bm ti ps so am tr bn zh'.split()
keys=set(json.load(open('/home/claude/sn/i18n_cov.json'))['langs']['es']['missList'])
with sync_playwright() as p:
    b=p.chromium.launch(); bad=[]
    c=b.new_context(viewport={'width':360,'height':760},is_mobile=True,has_touch=True,service_workers='block')
    pg=c.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)[:150])); pg.route('**/__sb/**',lambda r:r.abort())
    pg.goto(B+'index.html'); pg.wait_for_timeout(2000); pg.evaluate("closeWelcome()")
    pg.evaluate("goCity(CITIES.find(c=>c[0]==='Madrid'))"); pg.wait_for_timeout(1500)
    for l in LANGS:
        pg.evaluate("setLang('%s',true)"%l); pg.wait_for_timeout(900)
        pg.evaluate("S.now=false;S.plan=false;buildFilters();render()"); pg.wait_for_timeout(300)
        r=pg.evaluate("""()=>{const txt=document.body.innerText;const raw=(txt.match(/\\b(ui|cat|need|plan|menu|wel|grp|ver|req|tip|now|sheet|hol|cmp|share|geo|faq|priv)\\.[a-z0-9.]+\\b/g)||[]);
          const ov=document.documentElement.scrollWidth>innerWidth+1;
          const pills=[...document.querySelectorAll('#list .need-b')].map(x=>x.getBoundingClientRect()); const g=document.querySelector('#list .need-g');
          const pillOver = g ? g.scrollWidth>g.clientWidth+1 : false;
          return {raw:[...new Set(raw)].slice(0,8),ov,pillOver,ph:document.querySelector('#q').placeholder,first:(document.querySelector('#list .card-t')||{}).textContent}}""")
        print(l, r)
        if r['raw'] or r['ov']: bad.append(l)
        pg.evaluate("select(S.places.filter(p=>p.d<3000&&!p.auto&&p.oh).sort((a,b)=>a.d-b.d)[0],false)"); pg.wait_for_timeout(400)
        d=pg.evaluate("(document.querySelector('#dBody')||{innerText:''}).innerText.match(/\\b(ui|cat|req|ver|oh|hol|cmp|kv)\\.[a-z0-9.]+\\b/g)")
        if d: print('  ficha claves crudas', d[:6]); bad.append(l+'-ficha')
        pg.evaluate("closeDetail()")
        if l in ('am','ti','wo','bm','ar','ru'): pg.screenshot(path='/home/claude/sn/lang_%s.png'%l)
    print('MAL:', bad, 'errores JS:', errs)
