# Round 13: /yc product tour for investors, buyer portal demo (/portal/demo), demo video on the site.

def build_yc():
    body = phero('Product tour', 'Kolaboro in three minutes',
                 'The buyer\'s side for people who buy property abroad. Watch the demo, then open every part of the product yourself: nothing here is a mock-up except where it says so.')
    body += '''<section class="sec"><div class="wrap">
  <div class="yc-video"><video controls preload="metadata" playsinline poster="/k/og.png" src="/k/kolaboro-demo.mp4"></video></div>
  <div class="yc-live stats" id="yc-live" aria-live="polite">
    <div class="stat"><b id="yl-p">24</b><span>off-plan projects tracked in Bali</span></div>
    <div class="stat"><b id="yl-r">24/24</b><span>developer pages read by our AI agent last run</span></div>
    <div class="stat"><b>6</b><span>projects whose developer we invited to verify</span></div>
    <div class="stat"><b>€490</b><span>pre-purchase check, payments live</span></div>
  </div>
</div></section>
<section class="sec alt"><div class="wrap">
  <h2>The product, piece by piece</h2>
  <div class="yc-grid">
    <a class="yc-card" href="/research" data-ev="yc_research"><span class="yc-n">1</span><b>AI research agent</b><small>Built on Claude. Reads what every developer promises each week: lease terms, completion dates, yields, "guaranteed" claims. Live data.</small><em>Live</em></a>
    <a class="yc-card" href="/cases" data-ev="yc_cases"><span class="yc-n">2</span><b>Verification pipeline</b><small>Every tracked project and where its check stands, with the questions our agent will answer on site. Updated by the agent.</small><em>Live</em></a>
    <a class="yc-card" href="/agents/visit" data-ev="yc_visit"><span class="yc-n">3</span><b>Agent field tool</b><small>GPS, time and a SHA-256 fingerprint on every photo, a checklist per milestone and a verdict. Open it on your phone.</small><em>Live</em></a>
    <a class="yc-card" href="/portal/demo" data-ev="yc_portal"><span class="yc-n">4</span><b>Buyer portal</b><small>What a buyer sees: payments gated by verified milestones, visits, reports and their agent.</small><em>Demo data</em></a>
    <a class="yc-card" href="/cases#files" data-ev="yc_reports"><span class="yc-n">5</span><b>Client reports</b><small>The deliverable a buyer pays for: our advice in one line, nine checks, what to do now and the evidence.</small><em>Samples</em></a>
    <a class="yc-card" href="/#risk" data-ev="yc_risk"><span class="yc-n">6</span><b>Money-at-risk simulator</b><small>Why it matters: paying by the calendar versus paying by verified milestones.</small><em>Live</em></a>
    <a class="yc-card" href="/pricing" data-ev="yc_pricing"><span class="yc-n">7</span><b>Pricing and payments</b><small>€490 check, €99 a month monitoring, 1% buyer's agent. Checkout works today.</small><em>Live</em></a>
    <a class="yc-card" href="/agents/how-we-choose" data-ev="yc_agents"><span class="yc-n">8</span><b>Agent network</b><small>Who we hire, how AI trains and checks them, and how they're paid: never by the seller.</small><em>Recruiting</em></a>
  </div>
</div></section>
<section class="sec"><div class="wrap grid2">
  <div><h2>Why now</h2></div>
  <div class="prose"><ul>
    <li><b>Buyers buy remotely.</b> Video calls and renders replaced the visit; trust didn't follow.</li>
    <li><b>AI makes the expert cheap.</b> A trained local with AI does work that used to need a lawyer, a surveyor and an engineer.</li>
    <li><b>Proof is cheap to capture.</b> Every phone records GPS- and time-stamped evidence we can fingerprint.</li>
  </ul>
  <p>Founders: Carlos de Ory (CEO; product, AI and growth) and Lisa Mikolajewicz (co-founder; agents and partnerships). <a href="/about">About us</a> · <a href="/investors">Investors</a></p></div>
</div></section>'''
    js = '''<script>
(function(){ if (!window.fetch) return;
  fetch('/data/bali-claims.json', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(d){
    document.getElementById('yl-p').textContent = d.projects;
    var run = (d.runs || []).slice(-1)[0]; if (run && run.mode === 'ai') document.getElementById('yl-r').textContent = run.pages_ok + '/' + (run.pages_ok + run.pages_failed);
  }).catch(function(){});
})();
</script>'''
    return page('/yc', 'Kolaboro product tour', 'Kolaboro in three minutes: the AI research agent, the verification pipeline, the agent field tool, the buyer portal and client reports.', body, extra_js=js)

PORTAL_DATA = {
  'buyer': 'Sample buyer, Austin, Texas', 'project': 'Villa Kenanga (fictional)', 'area': 'Canggu coast, Bali', 'price': 240000,
  'score': 84, 'agent': 'Your Kolaboro agent, Canggu',
  'payments': [
    {'n': 1, 'label': 'Signing', 'pct': 20, 'status': 'paid', 'date': '12 Mar 2026', 'note': 'Pre-purchase check passed (score 81)'},
    {'n': 2, 'label': 'Structure and walls', 'pct': 20, 'status': 'paid', 'date': '18 Jun 2026', 'note': 'Milestone verified on site'},
    {'n': 3, 'label': 'Roof structure', 'pct': 20, 'status': 'safe', 'date': 'Due now', 'note': 'Verified 27 Oct: safe to pay'},
    {'n': 4, 'label': 'Finishes', 'pct': 20, 'status': 'locked', 'date': '~Feb 2027', 'note': 'Locked until verified'},
    {'n': 5, 'label': 'Pool and landscaping', 'pct': 10, 'status': 'locked', 'date': '~Apr 2027', 'note': 'Locked until verified'},
    {'n': 6, 'label': 'Handover', 'pct': 10, 'status': 'locked', 'date': '~Jun 2027', 'note': 'Final inspection first'}],
  'visits': [
    {'date': '27 Oct 2026', 'title': 'Milestone 3: roof structure', 'verdict': 'Safe to pay', 'photos': 14, 'videos': 2, 'img': 'idconstr'},
    {'date': '18 Jun 2026', 'title': 'Milestone 2: structure and walls', 'verdict': 'Safe to pay', 'photos': 11, 'videos': 1, 'img': 'mxconstr'},
    {'date': '9 Mar 2026', 'title': 'Pre-purchase site visit', 'verdict': 'Proceed', 'photos': 9, 'videos': 1, 'img': 'obranegra'}],
  'messages': [
    ['agent', '27 Oct, 14:20', 'Roof frame is complete on all three blocks and matches the drawings. Covering is delivered, installation starts next week. 14 photos and 2 videos are in your visit report.'],
    ['you', '27 Oct, 16:05', 'Great, thanks. Is it safe to pay instalment 3?'],
    ['agent', '27 Oct, 16:12', 'Yes. Milestone 3 is verified, so instalment 3 (€48,000) is safe to pay. Use the company account in your contract and send me the receipt for your file.']],
}

def build_portal():
    d = json.dumps(PORTAL_DATA)
    body = '''<section class="phero portal-h"><div class="wrap">
  <p class="crumb"><a href="/">Kolaboro</a> / Buyer portal</p>
  <p class="demo-flag">Demo account · fictional project and sample data</p>
  <h1>Your purchase, verified</h1>
  <p class="lead">Villa Kenanga (fictional) · Canggu coast, Bali</p>
</div></section>
<section class="sec"><div class="wrap">
  <div class="ptabs" role="tablist">
    <button type="button" role="tab" aria-selected="true" data-t="ov">Overview</button><button type="button" role="tab" aria-selected="false" data-t="pay">Payments</button><button type="button" role="tab" aria-selected="false" data-t="vis">Site visits</button><button type="button" role="tab" aria-selected="false" data-t="rep">Reports</button><button type="button" role="tab" aria-selected="false" data-t="msg">Your agent</button>
  </div>
  <div class="ppanel" id="p-ov"></div><div class="ppanel" id="p-pay" hidden></div><div class="ppanel" id="p-vis" hidden></div><div class="ppanel" id="p-rep" hidden></div><div class="ppanel" id="p-msg" hidden></div>
</div></section>'''
    js = '''<script>
(function(){
  var D = ''' + d + ''';
  var fmt = new Intl.NumberFormat('en-IE', { style:'currency', currency:'EUR', maximumFractionDigits:0 });
  var paid = 0, ready = 0; D.payments.forEach(function(p){ if (p.status === 'paid') paid += p.pct; if (p.status === 'safe') ready = p; });
  var built = 60, amt = function(p){ return fmt.format(D.price * p.pct / 100); };
  var st = { paid: ['Paid', 'pp-paid'], safe: ['Safe to pay', 'pp-safe'], locked: ['Locked', 'pp-lock'] };
  document.getElementById('p-ov').innerHTML =
    '<div class="pgrid"><div class="pcard big"><span>Next payment</span><b>Instalment ' + ready.n + ': ' + amt(ready) + '</b><p class="pp-safe pill">Safe to pay</p><small>' + ready.note + '</small></div>' +
    '<div class="pcard"><span>Trust Score</span><b>' + D.score + ' / 100</b><small>Two items to watch: no escrow, yield assumes 70% occupancy.</small></div>' +
    '<div class="pcard"><span>Paid so far</span><b>' + paid + '%</b><small>' + fmt.format(D.price * paid / 100) + ' of ' + fmt.format(D.price) + '</small></div>' +
    '<div class="pcard"><span>Built so far</span><b>~' + built + '%</b><small>Your money follows the concrete.</small></div></div>' +
    '<div class="pbars" role="img" aria-label="Paid ' + paid + '% versus built about ' + built + '%"><div><span>Paid</span><i><b class="b1" style="width:' + paid + '%"></b></i><em>' + paid + '%</em></div><div><span>Built (verified)</span><i><b class="b2" style="width:' + built + '%"></b></i><em>~' + built + '%</em></div></div>';
  document.getElementById('p-pay').innerHTML = '<ol class="plist">' + D.payments.map(function(p){ var s = st[p.status];
    return '<li class="' + s[1] + '"><span class="pn">' + p.n + '</span><div><b>' + p.label + '</b><small>' + p.note + '</small></div><div class="pr"><b>' + amt(p) + '</b><small>' + p.date + '</small></div><span class="pill ' + s[1] + '">' + s[0] + '</span></li>'; }).join('') + '</ol>' +
    '<p class="note-box" style="margin-top:16px"><b>How the lock works.</b> Each instalment unlocks only after your agent verifies the milestone on site. If the work isn\\'t there, we tell you to hold.</p>';
  document.getElementById('p-vis').innerHTML = '<div class="pvis">' + D.visits.map(function(v){
    return '<article><div class="pimg" style="background-image:url(/k/cases/' + v.img + '.jpg)"><span>Illustrative photo</span></div><div class="pvb"><small>' + v.date + '</small><b>' + v.title + '</b><p>' + v.photos + ' photos · ' + v.videos + ' video' + (v.videos > 1 ? 's' : '') + ' · GPS ±3 m · fingerprinted</p><span class="pill pp-safe">' + v.verdict + '</span></div></article>'; }).join('') + '</div>';
  document.getElementById('p-rep').innerHTML = '<ul class="prep">' +
    '<li><a href="/cases/files/kolaboro-report-example-safe-to-pay.pdf">Milestone 3 report · safe to pay</a><small>27 Oct 2026 · PDF</small></li>' +
    '<li><a href="/report/sample">Pre-purchase report · Trust Score 81</a><small>12 Mar 2026</small></li>' +
    '<li><a href="/guides/contract-clauses">Contract review notes</a><small>10 Mar 2026</small></li></ul>';
  document.getElementById('p-msg').innerHTML = '<div class="pchat">' + D.messages.map(function(m){ return '<div class="msg ' + m[0] + '"><small>' + (m[0] === 'agent' ? D.agent : 'You') + ' · ' + m[1] + '</small><p>' + m[2] + '</p></div>'; }).join('') + '</div>';
  var tabs = document.querySelectorAll('.ptabs button');
  tabs.forEach(function(b){ b.addEventListener('click', function(){ tabs.forEach(function(x){ x.setAttribute('aria-selected', x === b); });
    document.querySelectorAll('.ppanel').forEach(function(p){ p.hidden = p.id !== 'p-' + b.dataset.t; }); if (window.kbEvent) kbEvent('portal_tab', { tab: b.dataset.t }); }); });
})();
</script>'''
    return page('/portal/demo', 'Buyer portal demo | Kolaboro', 'A demo of the Kolaboro buyer portal: payments unlocked only by verified milestones, site visits, reports and your agent.', body, extra_js=js)

R13_CSS = '''
.yc-video{border-radius:24px;overflow:hidden;background:#000;box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
.yc-video video{display:block;width:100%;height:auto}
.yc-live{margin-top:22px}
.yc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-top:26px}
.yc-card{display:block;text-decoration:none;background:var(--paper);border:1px solid var(--line);border-radius:20px;padding:18px;position:relative;transition:transform .15s,box-shadow .15s}
.yc-card:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px rgba(0,0,0,.4)}
.yc-n{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--ink);color:var(--paper);font-weight:800;font-size:.85rem}
.yc-card b{display:block;font-size:1.1rem;margin-top:10px}
.yc-card small{display:block;font-size:.9rem;color:var(--ink-2);margin-top:6px;line-height:1.4}
.yc-card em{position:absolute;top:18px;right:18px;font-style:normal;font-size:.72rem;font-weight:800;padding:3px 9px;border-radius:999px;background:#DDEFE7;color:#0B5A40}
.demo-flag{display:inline-block;font-size:.8rem;font-weight:800;background:#FFF0C7;color:#7A5300;padding:5px 11px;border-radius:999px;margin-bottom:10px}
.ptabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:2px solid var(--line);padding-bottom:10px}
.ptabs button{font:inherit;font-weight:700;border:0;background:transparent;padding:.65rem 1rem;border-radius:999px;cursor:pointer;min-height:44px;color:var(--ink-2)}
.ptabs button[aria-selected=true]{background:var(--ink);color:var(--paper)}
.ppanel{margin-top:22px}
.pgrid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px}
.pcard{background:var(--paper);border-radius:18px;padding:16px;border:1px solid var(--line)}
.pcard span{display:block;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.pcard b{display:block;font-size:1.5rem;font-stretch:115%;margin-top:6px;font-variant-numeric:tabular-nums}
.pcard.big{background:var(--ink);color:var(--paper);border:0}
.pcard.big span{color:#AEB6BE}
.pcard small{display:block;font-size:.86rem;margin-top:6px;color:inherit;opacity:.85}
.pcard .pill{display:inline-block;margin-top:10px}
.pbars{display:grid;gap:10px;margin-top:22px;max-width:760px}
.pbars div{display:grid;grid-template-columns:130px 1fr 52px;gap:12px;align-items:center;font-weight:700;font-size:.9rem}
.pbars i{height:14px;border-radius:8px;background:#E3E2DD;overflow:hidden;display:block}
.pbars b{display:block;height:100%;border-radius:8px}
.pbars .b1{background:var(--hivis)}.pbars .b2{background:#2FB27E}
.pbars em{font-style:normal;font-variant-numeric:tabular-nums}
.plist{list-style:none;padding:0;display:grid;gap:10px}
.plist li{display:grid;grid-template-columns:36px 1fr auto auto;gap:14px;align-items:center;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:12px 16px}
.plist .pn{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:#E3E2DD}
.plist small{display:block;color:var(--muted);font-size:.84rem}
.plist .pr{text-align:right;font-variant-numeric:tabular-nums}
.plist li.pp-lock{opacity:.7}
.pill.pp-paid{background:#E3E2DD;color:var(--ink)}.pill.pp-safe{background:#2FB27E;color:#06261A}.pill.pp-lock{background:#3A4652;color:#E3E6EA}
.pvis{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.pvis article{background:var(--paper);border-radius:18px;overflow:hidden;border:1px solid var(--line)}
.pimg{height:170px;background-size:cover;background-position:center;position:relative}
.pimg span{position:absolute;left:8px;bottom:8px;font-size:.7rem;color:#fff;background:rgba(0,0,0,.5);padding:2px 7px;border-radius:6px}
.pvb{padding:14px}.pvb small{color:var(--muted)}.pvb b{display:block;margin-top:2px}.pvb p{font-size:.86rem;color:var(--ink-2);margin:6px 0 8px}
.prep{list-style:none;padding:0;display:grid;gap:10px}
.prep li{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.prep a{font-weight:700}
.prep small{color:var(--muted)}
.pchat{display:grid;gap:12px;max-width:720px}
.msg{padding:12px 14px;border-radius:16px;max-width:85%}
.msg small{display:block;font-size:.75rem;color:var(--muted);margin-bottom:4px}
.msg.agent{background:var(--paper);border:1px solid var(--line)}
.msg.you{background:#17212B;color:var(--paper);justify-self:end}
.msg.you small{color:#AEB6BE}
@media (max-width:820px){.pgrid{grid-template-columns:1fr 1fr}.pcard.big{grid-column:1/-1}.plist li{grid-template-columns:32px 1fr;}.plist .pr,.plist .pill{grid-column:2;justify-self:start}.plist .pr{text-align:left}}
'''

def build_round13():
    return [build_yc(), build_portal()]

def r13_inject():
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(R13_CSS)
    vid = os.path.join(HERE, '..', 'kolaboro-demo.mp4')
    if os.path.exists(vid): shutil.copy(vid, os.path.join(OUT, 'k', 'kolaboro-demo.mp4'))
    os.makedirs(os.path.join(OUT, 'k', 'cases'), exist_ok=True)
    for k in ('idconstr', 'mxconstr', 'obranegra'):
        src = os.path.join(HERE, '..', 'photos', k + '.jpg')
        if os.path.exists(src):
            try:
                from PIL import Image
                im = Image.open(src); im.thumbnail((900, 900)); im.convert('RGB').save(os.path.join(OUT, 'k', 'cases', k + '.jpg'), quality=78, optimize=True)
            except Exception:
                shutil.copy(src, os.path.join(OUT, 'k', 'cases', k + '.jpg'))
    # demo page: link to the full tour
    fp = os.path.join(OUT, 'demo', 'index.html')
    if os.path.exists(fp):
        s = open(fp).read()
        if '/yc' not in s:
            s = s.replace('</main>', '<section class="sec alt"><div class="wrap grid2"><div><h2>Want the full product tour?</h2><p class="lead">The AI agent, the live pipeline, the agent field tool and the buyer portal, in three minutes.</p></div><div><a class="btn btn-hi" href="/yc" data-ev="demo_tour">Open the product tour</a> <a class="btn btn-line" href="/portal/demo">Open the buyer portal demo</a></div></div></section>\n</main>', 1)
            open(fp, 'w').write(s)
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            s = s.replace('<li><a href="/cases">Live cases</a></li>', '<li><a href="/yc">Product tour</a></li>\n        <li><a href="/portal/demo">Buyer portal demo</a></li>\n        <li><a href="/cases">Live cases</a></li>', 1)
            if s != o: open(p, 'w').write(s)
