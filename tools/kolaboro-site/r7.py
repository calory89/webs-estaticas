# Round 7: Kolaboro Research Agent page with live data, Bali now / Mexico next, share-as-image.

AGENT_DATA = os.path.join(HERE, '..', 'agent', 'data', 'public-bali-claims.json')

def build_research():
    body = phero('Research', 'Kolaboro Research Agent',
                 "Our own AI agent, built on Claude, reads what developers promise and tracks it week after week. It's how the Trust Score starts: before an agent visits, we already know what was promised.",
                 '<div class="hero-cta"><a class="btn btn-hi" href="#data" data-ev="research_data">See this week\'s data</a><a class="btn btn-line" href="/how-we-score">How the Trust Score uses it</a></div>')
    body += '''<section class="sec"><div class="wrap">
  <h2>How the agent works</h2>
  <ol class="track" style="margin-top:44px">
    <li><div class="node">1</div><h3>Reads</h3><p>Every week it opens the public pages of the projects we track: developers' own sites and new-build portals.</p></li>
    <li><div class="node">2</div><h3>Extracts</h3><p>Claude pulls out what is promised: price, title, lease years, extensions, completion date, yields, guarantees and permit claims, with the exact quotes.</p></li>
    <li><div class="node">3</div><h3>Compares</h3><p>It compares with last week and logs every change: a delivery date that moves, a yield that grows, a "guarantee" that appears.</p></li>
    <li><div class="node">4</div><h3>Hands over</h3><p>Our agents on the ground get the list of promises to verify. What they find becomes the Trust Score.</p></li>
  </ol>
</div></section>
<section class="sec alt" id="data"><div class="wrap">
  <h2>What Bali developers advertise</h2>
  <p class="lead">Aggregate data from the projects we track. These are advertised claims, not verified facts, and we don't name projects until they are verified. <span id="rdate"></span></p>
  <div class="stats" id="rstats" aria-live="polite"><p>Loading the latest data…</p></div>
  <div class="grid2" style="margin-top:28px">
    <div class="tile"><h3>Base lease length advertised</h3><div id="rlease" class="hbars"></div><p class="ev" id="rlease-n"></p></div>
    <div class="tile"><h3>Advertised completion year</h3><div id="rcomp" class="hbars"></div><p class="ev">Projects that state a year.</p></div>
  </div>
  <div class="note-box" style="margin-top:28px"><b>Why it matters.</b> Most projects are sold as leaseholds of around 30 years, and most promise an extension. Whether that extension is binding is one of the first things a Kolaboro agent checks.</div>
</div></section>
<section class="sec"><div class="wrap grid2">
  <div><h2>Agent log</h2><p class="lead">Every run, newest first. The agent runs weekly with a strict spending limit.</p></div>
  <ol class="clog" id="rlog"></ol>
</div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>What's next for the agent</h2></div>
  <div class="prose"><ul>
    <li>Alerts to buyers when a project they follow changes a promise.</li>
    <li>First pass on contracts and certificates, always checked by a person.</li>
    <li>More markets: Mexico next.</li>
  </ul><p><a href="/roadmap">See the full roadmap</a></p></div>
</div></section>'''
    js = '''<script>
(function(){
  function el(id){ return document.getElementById(id); }
  function bars(box, obj){ var max = 0, k; for (k in obj) max = Math.max(max, obj[k]);
    box.innerHTML = Object.keys(obj).map(function(k){ var v = obj[k]; return '<div class="hb"><span>' + k + '</span><i style="width:' + (max ? v / max * 100 : 0) + '%"></i><b>' + v + '</b></div>'; }).join(''); }
  fetch('/data/bali-claims.json', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(d){
    el('rdate').textContent = 'Last update: ' + d.updated + '.';
    var usd = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 });
    var s = [
      [d.projects, 'projects tracked'],
      [d.title.leasehold + ' of ' + d.title.known, 'sold as leasehold, where stated'],
      [d.lease.median ? d.lease.median + ' yrs' : '–', 'median base lease (' + d.lease.known + ' stated)'],
      [d.extension_promised.yes + ' of ' + d.extension_promised.known, 'promise an extension, where stated'],
      [d.price_usd.median ? usd.format(d.price_usd.median) : '–', 'median starting price (' + d.price_usd.known + ' stated)'],
      [d.guaranteed_language, 'use the word "guaranteed"']
    ];
    if (d.yield && d.yield.known) s.push([d.yield.median + '%', 'median advertised yield (' + d.yield.known + ' stated)']);
    el('rstats').innerHTML = s.map(function(x){ return '<div class="stat"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('');
    bars(el('rlease'), d.lease.hist); el('rlease-n').textContent = d.lease.known + ' projects state a base lease length.';
    var c = {}; Object.keys(d.completion).forEach(function(k){ if (k !== 'unknown') c[k] = d.completion[k]; }); bars(el('rcomp'), c);
    el('rlog').innerHTML = (d.runs || []).slice().reverse().map(function(r){
      return '<li><span class="dot d-ok"></span><div><b>' + r.date + '</b><ul><li>' + (r.mode === 'ai' ? 'Read ' + r.pages_ok + ' pages with Claude' + (r.pages_failed ? ', ' + r.pages_failed + ' could not be read' : '') + '. ' + r.changes + ' changes in what developers advertise.' : 'First dataset compiled from developers\\' pages and new-build portals.') + '</li></ul></div></li>'; }).join('');
  }).catch(function(){ el('rstats').innerHTML = '<p>The data could not be loaded. Try again later.</p>'; });
})();
</script>'''
    out = page('/research', 'Kolaboro Research Agent: what Bali developers advertise', 'Kolaboro\'s own AI agent, built on Claude, tracks what off-plan developers in Bali promise every week: lease terms, completion dates, yields and guarantees.', body, extra_js=js)
    os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
    if os.path.exists(AGENT_DATA): shutil.copy(AGENT_DATA, os.path.join(OUT, 'data', 'bali-claims.json'))
    return out

R7_COPY = [
  ('<p class="launch"><i aria-hidden="true"></i>Off-plan checks in any country. <a href="/demo" data-ev="hero_demo">See a 30-second demo</a></p>',
   '<p class="launch"><i aria-hidden="true"></i>Off-plan checks in any country. <a href="/demo" data-ev="hero_demo">See a 30-second demo</a></p>'),
  ('<p class="launch"><i aria-hidden="true"></i>Comprobaciones en cualquier país.</p>', '<p class="launch"><i aria-hidden="true"></i>Comprobaciones en cualquier país.</p>'),
  ('Independent property checks for people buying abroad. Recruiting our first local agents.', 'Independent property checks for people buying abroad. Recruiting our first local agents.'),
  ('Comprobaciones independientes para quien compra vivienda en otro país. Buscamos a nuestros primeros agentes locales.', 'Comprobaciones independientes para quien compra vivienda en otro país. Buscamos a nuestros primeros agentes locales.'),
  ('<p class="lead">Off-plan checks in any country. Every destination page covers what goes wrong most and what to check.</p>',
   '<p class="lead">Off-plan checks in any country. Every destination page covers what goes wrong most and what to check.</p>'),
  ('<a class="tile" href="/tulum" style="text-decoration:none"><span class="tag" style="background:#DCDAD3">Waitlist</span>',
   '<a class="tile" href="/tulum" style="text-decoration:none"><span class="tag">Next</span>'),
  ('Join the Tulum waitlist', 'Join the Mexico waitlist'),
  ('We check off-plan projects in any country.',
   'Our customers are Americans, Australians and Europeans buying abroad. We sell the check in every country: desk reviews and official-register lookups run online anywhere, and on-site visits are arranged per country with local agents. We are recruiting the first agents in Bali, the high-risk market we know best, and Mexico, where US buyers face the same problem.'),
  ('<h2>Kolaboro in Tulum</h2>', '<h2>Kolaboro in Mexico</h2>'),
]

def research_band():
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    band = '''<section class="checkbar" aria-label="Research agent" style="background:#222E3A"><div class="wrap checkbar-in">
  <div><h2>Our own AI research agent</h2><p>Built on Claude, it reads what developers promise every week and logs every change, so our agents know exactly what to verify.</p></div>
  <div class="stats mini" id="hband"><div class="stat"><b>24</b><span>Bali projects tracked</span></div><div class="stat"><b>30 yrs</b><span>median lease advertised</span></div><div class="stat"><a class="btn btn-hi" href="/research" data-ev="home_research">See the data</a></div></div>
</div></section>
'''
    s = s.replace('<section class="score" id="score">', band + '\n<section class="score" id="score">', 1)
    open(fp, 'w').write(s)

def r7_fixes():
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            for a, b in R7_COPY: s = s.replace(a, b)
            s = s.replace('<li><a href="/glossary">Glossary</a></li>', '<li><a href="/research">Research agent</a></li>\n        <li><a href="/glossary">Glossary</a></li>', 1)
            if s != o: open(p, 'w').write(s)

def build_round7():
    out = [build_research()]
    research_band()
    return out
