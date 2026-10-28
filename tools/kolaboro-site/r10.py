# Round 10: money-at-risk simulator on home, Bali map on /research, freshness, price hints in
# the visitor's currency, back-to-top, print-ready sample report, meta fixes, logo in build.

JOURNEY = '''<section class="sec risk" id="risk" aria-labelledby="risk-h">
  <div class="wrap">
    <div class="risk-head">
      <h2 id="risk-h">How much of your money is at risk?</h2>
      <p class="lead">Off-plan, you pay by the calendar while the building moves at its own pace. Move the slider and compare.</p>
    </div>
    <div class="risk-box">
      <div class="risk-ctl">
        <label for="rk-price">Property price <b id="rk-pv">€300,000</b></label>
        <input type="range" id="rk-price" min="100000" max="1000000" step="10000" value="300000">
        <div class="risk-tog" role="group" aria-label="Compare">
          <button type="button" class="on" data-mode="cal" aria-pressed="true">Paying by the calendar</button>
          <button type="button" data-mode="kb" aria-pressed="false">With a Kolaboro agent</button>
        </div>
      </div>
      <div class="risk-chart" id="rk-chart" aria-hidden="true"></div>
      <div class="risk-sum" aria-live="polite">
        <div><span>Paid before the work exists</span><strong id="rk-max">€0</strong></div>
        <p id="rk-msg"></p>
      </div>
      <p class="risk-note">Illustrative example: six payments of a typical off-plan plan (20/20/20/20/10/10%) where construction runs about six months behind the payment calendar.</p>
    </div>
  </div>
</section>
'''

JOURNEY_CSS = '''
.risk{background:var(--paper)}
.risk-head{max-width:760px}
.risk-box{margin-top:36px;background:var(--ink);color:var(--paper);border-radius:28px;padding:clamp(18px,3vw,32px)}
.risk-ctl{display:grid;grid-template-columns:1fr auto;gap:18px 28px;align-items:center}
.risk-ctl label{font-weight:700;display:flex;justify-content:space-between;gap:12px;grid-column:1}
.risk-ctl label b{font-variant-numeric:tabular-nums;color:#FFB48F}
.risk-ctl input[type=range]{grid-column:1;width:100%;accent-color:var(--hivis);height:28px}
.risk-tog{grid-column:2;grid-row:1/3;display:flex;background:#222E3A;border-radius:999px;padding:4px;gap:4px}
.risk-tog button{font:inherit;font-size:.9rem;font-weight:700;border:0;border-radius:999px;padding:.7rem 1rem;background:transparent;color:#C9D0D6;cursor:pointer;min-height:44px}
.risk-tog button.on{background:var(--paper);color:var(--ink)}
.risk-chart{margin-top:26px;display:grid;grid-template-columns:repeat(6,1fr);gap:10px;align-items:end;height:220px}
.rk-col{display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:6px;text-align:center}
.rk-bars{position:relative;flex:1;display:flex;align-items:flex-end;justify-content:center;gap:4px}
.rk-paid,.rk-built{width:42%;border-radius:8px 8px 3px 3px;transition:height .5s cubic-bezier(.3,.9,.3,1)}
.rk-paid{background:var(--hivis)}
.rk-built{background:#2FB27E}
.rk-col small{font-size:.75rem;color:#AEB6BE;line-height:1.2}
.rk-col small b{display:block;color:var(--paper);font-size:.8rem}
.rk-gap{position:absolute;left:4px;right:4px;font-size:.68rem;font-weight:800;color:#FFB48F;transition:bottom .5s}
.risk-sum{display:flex;gap:24px;align-items:center;margin-top:22px;padding-top:18px;border-top:1px solid #2E3A46;flex-wrap:wrap}
.risk-sum span{display:block;font-size:.85rem;color:#AEB6BE}
.risk-sum strong{font-size:clamp(1.8rem,4vw,2.6rem);font-stretch:118%;font-variant-numeric:tabular-nums;color:#FFB48F;transition:color .3s}
.risk-sum strong.good{color:#7FE0B6}
.risk-sum p{flex:1;min-width:240px;color:#C9D0D6}
.risk-note{font-size:.8rem;color:#8A949E;margin-top:14px;max-width:none}
.rk-legend{display:flex;gap:16px;font-size:.8rem;color:#AEB6BE;margin-top:14px}
.rk-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
@media (max-width:720px){.risk-ctl{grid-template-columns:1fr}.risk-tog{grid-column:1;grid-row:auto}.risk-tog button{flex:1;font-size:.82rem;padding:.6rem .5rem}.risk-chart{height:180px;gap:5px}.rk-col small{font-size:.66rem}}
'''

JOURNEY_JS = '''<script>
(function(){
  var r = document.getElementById('rk-price'); if (!r) return;
  var chart = document.getElementById('rk-chart'), pv = document.getElementById('rk-pv'), mx = document.getElementById('rk-max'), msg = document.getElementById('rk-msg');
  var plan = [.2,.2,.2,.2,.1,.1], built = [0,.05,.25,.45,.65,.85];
  var labels = ['Signing','Month 4','Month 8','Month 12','Month 16','Month 20'], mode = 'cal';
  var fmt = new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
  chart.innerHTML = labels.map(function(l, i){ return '<div class="rk-col"><div class="rk-bars"><span class="rk-gap"></span><i class="rk-paid"></i><i class="rk-built"></i></div><small><b>' + (i+1) + '</b>' + l + '</small></div>'; }).join('');
  chart.insertAdjacentHTML('afterend', '<div class="rk-legend"><span><i style="background:#FF5B14"></i>Paid so far</span><span><i style="background:#2FB27E"></i>Value actually built</span></div>');
  var cols = chart.querySelectorAll('.rk-col');
  function draw(){
    var P = +r.value; pv.textContent = fmt.format(P);
    var paid = 0, worst = 0;
    cols.forEach(function(c, i){
      paid += plan[i];
      var b = built[i];
      var shown = mode === 'cal' ? paid : Math.min(paid, built[i] + plan[0]);
      var gap = Math.max(0, shown - b); worst = Math.max(worst, gap);
      c.querySelector('.rk-paid').style.height = (shown * 100) + '%';
      c.querySelector('.rk-built').style.height = (b * 100) + '%';
      var g = c.querySelector('.rk-gap'); g.style.bottom = (shown * 100 + 2) + '%'; g.textContent = gap > .001 ? '+' + Math.round(gap * 100) + '%' : '';
    });
    mx.textContent = fmt.format(Math.round(worst * P / 1000) * 1000);
    mx.classList.toggle('good', mode === 'kb');
    msg.textContent = mode === 'cal'
      ? 'Paying by the calendar, up to ' + fmt.format(Math.round(worst * P / 1000) * 1000) + ' is in the developer\\'s hands for work that doesn\\'t exist yet. If the project stalls, that is what you stand to lose.'
      : 'With an agent checking each milestone before you pay, your exposure stays close to one instalment: you only pay for what is already built.';
  }
  r.addEventListener('input', draw);
  document.querySelectorAll('.risk-tog button').forEach(function(b){ b.addEventListener('click', function(){
    mode = b.dataset.mode; document.querySelectorAll('.risk-tog button').forEach(function(x){ x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    draw(); if (window.kbEvent) kbEvent('risk_toggle', { mode: mode }); }); });
  draw();
})();
</script>'''

# --- Bali map on /research: regional counts (no project names) ---
REGIONS = {'Bukit peninsula': ['Ungasan','Uluwatu','Pecatu','Bingin','Jimbaran','Bukit Pandawa','Nusa Dua'],
           'Canggu coast': ['Berawa','Pererenan','Padonan','Munggu','Seseh'],
           'Ubud': ['Ubud'], 'Tabanan': ['Tabanan'], 'Sanur': ['Sanur']}
REG_POS = {'Bukit peninsula': (115.155, -8.815), 'Canggu coast': (115.14, -8.645), 'Ubud': (115.26, -8.51), 'Tabanan': (115.06, -8.585), 'Sanur': (115.255, -8.685)}
OUTLINE = [(114.43,-8.10),(114.55,-8.13),(114.75,-8.16),(114.92,-8.18),(115.05,-8.12),(115.12,-8.10),(115.25,-8.12),(115.38,-8.15),(115.50,-8.22),(115.60,-8.30),(115.70,-8.37),(115.71,-8.42),(115.62,-8.48),(115.55,-8.51),(115.48,-8.54),(115.40,-8.56),(115.34,-8.60),(115.28,-8.66),(115.26,-8.70),(115.24,-8.74),(115.22,-8.76),(115.23,-8.79),(115.22,-8.83),(115.18,-8.85),(115.12,-8.85),(115.09,-8.83),(115.09,-8.80),(115.13,-8.78),(115.16,-8.76),(115.17,-8.73),(115.15,-8.70),(115.13,-8.66),(115.10,-8.64),(115.05,-8.62),(114.95,-8.57),(114.80,-8.48),(114.65,-8.41),(114.52,-8.34),(114.45,-8.25),(114.43,-8.15)]

def _xy(lon, lat):
    return round((lon - 114.38) / 1.4 * 400, 1), round((-lat - 8.05) / 0.85 * 250, 1)

def bali_map():
    projs = json.load(open(os.path.join(HERE, '..', 'agent', 'projects.json')))['projects']
    cnt = {k: 0 for k in REGIONS}
    for p in projs:
        for k, areas in REGIONS.items():
            if any(a.lower() in p['area'].lower() for a in areas): cnt[k] += 1; break
    pts = ' '.join('%s,%s' % _xy(*c) for c in OUTLINE)
    dots, labels = '', ''
    for k, n in cnt.items():
        if not n: continue
        x, y = _xy(*REG_POS[k]); r = 5 + n * 1.1
        dots += f'<circle cx="{x}" cy="{y}" r="{r:.1f}" fill="#FF5B14" fill-opacity=".85" stroke="#fff" stroke-width="2"><title>{k}: {n} projects</title></circle>'
        lx = x + r + 6 if k not in ('Canggu coast', 'Tabanan') else x - r - 6
        anchor = 'start' if k not in ('Canggu coast', 'Tabanan') else 'end'
        ly = y + 4 if k != 'Tabanan' else y - 6
        labels += f'<text x="{lx}" y="{ly}" text-anchor="{anchor}" font-size="11" font-weight="700" fill="#17212B">{k} · {n}</text>'
    return f'''<section class="sec"><div class="wrap grid2">
  <div><h2>Where the projects are</h2><p class="lead">The off-plan projects our agent tracks, by area. Most new supply is on the Bukit peninsula and the Canggu coast, where foreign demand is strongest.</p></div>
  <figure class="balimap"><svg viewBox="0 0 400 250" role="img" aria-label="Map of Bali with the number of tracked projects by area">
    <rect width="400" height="250" rx="18" fill="#DCE8EE"/>
    <polygon points="{pts}" fill="#EFE9DC" stroke="#B9AE97" stroke-width="1.5" stroke-linejoin="round"/>
    {dots}{labels}
  </svg><figcaption>Number of tracked projects per area. Areas, not project names: we name projects only after we verify them.</figcaption></figure>
</div></section>'''

MAP_CSS = '''
.balimap{margin:0}
.balimap svg{width:100%;height:auto;border-radius:18px}
.balimap figcaption{font-size:.82rem;color:var(--muted);margin-top:10px}
.fresh{display:inline-flex;align-items:center;gap:8px;font-size:.85rem;font-weight:700;background:#DDEFE7;color:#0B5A40;padding:6px 12px;border-radius:999px;margin-top:18px}
.fresh i{width:8px;height:8px;border-radius:50%;background:#2FB27E;box-shadow:0 0 0 4px rgba(47,178,126,.25)}
.fx{display:block;font-size:.8rem;font-weight:600;color:var(--muted);margin-top:2px;font-stretch:100%;letter-spacing:0;word-spacing:normal;line-height:1.3}
.tile.hot .fx{color:#AEB6BE}
.totop{position:fixed;right:16px;bottom:88px;width:44px;height:44px;border-radius:50%;border:0;background:var(--ink);color:var(--paper);font-size:1.1rem;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .25s;z-index:40;box-shadow:0 8px 20px -8px rgba(0,0,0,.5)}
@media (max-width:720px){.totop{display:none}}
.totop.on{opacity:1;pointer-events:auto}
@media print{header,footer,.mcta,.totop,.cookie,.exit,.share,nav{display:none!important}body{background:#fff}.sec,.phero{padding:16px 0!important}a{text-decoration:none}}
'''

FRESH_JS = '''<script>
(function(){
  var h = document.querySelector('.phero .wrap'); if (!h || !window.fetch) return;
  fetch('/data/bali-claims.json', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(d){
    var run = (d.runs || []).slice(-1)[0]; if (!run) return;
    var t = run.mode === 'ai' ? 'Last run ' + run.date + ': Claude read ' + run.pages_ok + ' of ' + (run.pages_ok + run.pages_failed) + ' developer pages' : 'Dataset compiled ' + run.date;
    h.insertAdjacentHTML('beforeend', '<p class="fresh"><i aria-hidden="true"></i>' + t + '</p>');
  }).catch(function(){});
})();
</script>'''

FX_JS = '''<script>
(function(){
  var els = document.querySelectorAll('.price'); if (!els.length || !window.fetch) return;
  var C = { US:['USD','US$',1.08], CA:['CAD','C$',1.5], AU:['AUD','A$',1.65], NZ:['NZD','NZ$',1.8], GB:['GBP','£',.86], SG:['SGD','S$',1.45], AE:['AED','AED ',3.97], CH:['CHF','CHF ',.95] };
  fetch('/api/geo').then(function(r){ return r.json(); }).then(function(g){
    var c = C[g && g.country]; if (!c) return;
    els.forEach(function(el){
      var m = el.textContent.replace(/[,\\s]/g,'').match(/€(\\d+)/); if (!m || el.querySelector('.fx')) return;
      var v = +m[1] * c[2], step = v > 1000 ? 50 : 5, n = Math.round(v / step) * step;
      el.insertAdjacentHTML('beforeend', '<small class="fx">≈ ' + c[1] + n.toLocaleString('en-US') + ' · charged in €</small>');
    });
  }).catch(function(){});
})();
</script>'''

TOTOP_JS = '''<script>
(function(){
  if (document.body.scrollHeight < window.innerHeight * 3) return;
  var b = document.createElement('button'); b.className = 'totop'; b.type = 'button'; b.setAttribute('aria-label', 'Back to top'); b.textContent = '↑';
  document.body.appendChild(b);
  b.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); });
  window.addEventListener('scroll', function(){ b.classList.toggle('on', window.scrollY > window.innerHeight * 1.5); }, { passive: true });
})();
</script>'''

META_FIX = {
  'thanks/index.html': ('Your Kolaboro pre-purchase check is booked.', 'Your Kolaboro pre-purchase check is booked. Here is what happens next and when you will get your report.'),
  'legal/privacy/index.html': None, '404.html': None, 'index.html': None,
  'guides/questions-to-ask-a-developer/index.html': None,
}

def r10_meta():
    def sub(rel, fn):
        fp = os.path.join(OUT, rel)
        if os.path.exists(fp): s = open(fp).read(); s2 = fn(s); open(fp, 'w').write(s2)
    def desc(new):
        return lambda s: re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + new + m.group(2), s, count=1)
    sub('thanks/index.html', desc('Your Kolaboro pre-purchase check is booked. Here is what happens next and when you will get your report.'))
    sub('legal/privacy/index.html', desc('How Kolaboro collects, uses and protects your data, who we share it with and how to exercise your rights.'))
    sub('404.html', desc('This page does not exist. Check a project, read our guides or go back to the Kolaboro home page.'))
    sub('index.html', desc('Local agents who work for the buyer, never the seller. They verify the deal, film every milestone on site and tell you when each payment is safe.'))
    sub('thanks/index.html', lambda s: s.replace('/k/og/thanks.png', '/k/og.png'))
    sub('guides/questions-to-ask-a-developer/index.html', lambda s: re.sub(r'<title>[^<]*</title>', '<title>21 questions to ask an off-plan developer | Kolaboro</title>', s, count=1))

def r10_inject():
    # home: risk simulator after "how"
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    if 'id="risk"' not in s:
        s = s.replace('<section class="checkbar" aria-label="Research agent"', JOURNEY + '\n<section class="checkbar" aria-label="Research agent"', 1)
        s = s.replace('</body>', JOURNEY_JS + '\n</body>', 1)
        open(fp, 'w').write(s)
    # research: map + freshness
    fp = os.path.join(OUT, 'research', 'index.html')
    if os.path.exists(fp):
        s = open(fp).read()
        if 'class="balimap"' not in s:
            s = s.replace('<section class="sec"><div class="wrap grid2">\n  <div><h2>Agent log</h2>', bali_map() + '\n<section class="sec"><div class="wrap grid2">\n  <div><h2>Agent log</h2>', 1)
            s = s.replace('</body>', FRESH_JS + '\n</body>', 1)
            open(fp, 'w').write(s)
    # every page: currency hint where prices are shown, back-to-top on long pages
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            if 'class="price"' in s and 'class="fx"' not in s and FX_JS not in s: s = s.replace('</body>', FX_JS + '\n</body>', 1)
            if TOTOP_JS not in s: s = s.replace('</body>', TOTOP_JS + '\n</body>', 1)
            if s != o: open(p, 'w').write(s)
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(JOURNEY_CSS + MAP_CSS)
    lg = os.path.join(HERE, 'k', 'logo.png')
    if os.path.exists(lg): shutil.copy(lg, os.path.join(OUT, 'k', 'logo.png'))
