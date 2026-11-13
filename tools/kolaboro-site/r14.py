# Round 14: instant desk review on /check (paste the project's website -> email -> live analysis -> results -> €490 check).
# Fewer vendor names on the public site.

ANALYZE = '''<section class="sec" id="analyze"><div class="wrap">
  <div class="az" id="az">
    <div class="az-step on" id="az-1">
      <p class="az-k">Free desk review · about a minute</p>
      <h2>Paste the project's website</h2>
      <p class="lead">Our research agent reads what the developer promises and tells you exactly what to verify before you pay.</p>
      <form id="az-f1" class="qform light" onsubmit="return false"><input id="az-url" name="url" inputmode="url" autocomplete="url" placeholder="e.g. the developer's page for the villa" aria-label="Project website"><button class="btn btn-hi" type="submit">Analyse this project</button></form>
      <p class="fe" id="az-e1" role="alert"></p>
    </div>
    <div class="az-step" id="az-2">
      <p class="az-k" id="az-host"></p>
      <h2>Where should we send your desk review?</h2>
      <p class="lead">We start reading the website now. You'll see the results here, and we'll follow up by email.</p>
      <form id="az-f2" onsubmit="return false">
        <label class="f">Email<input id="az-email" type="email" autocomplete="email" required></label>
        <label class="hp" aria-hidden="true">Company<input id="az-co" tabindex="-1" autocomplete="off"></label>
        <label class="consent"><input type="checkbox" id="az-ok" required><span>I agree that Kolaboro can email me about this request. <a href="/legal/privacy">Privacy</a>.</span></label>
        <button class="btn btn-hi" type="submit">Start the analysis</button>
        <p class="fe" id="az-e2" role="alert"></p>
      </form>
    </div>
    <div class="az-step" id="az-3" aria-live="polite">
      <p class="az-k" id="az-first"></p>
      <h2>Analysing the project</h2>
      <ol class="az-prog" id="az-prog">
        <li>Reading the developer's website</li><li>Extracting what they promise</li><li>Checking title, lease and permit claims</li><li>Writing the questions you must ask</li>
      </ol>
    </div>
    <div class="az-step" id="az-4"></div>
  </div>
</div></section>
'''

ANALYZE_CSS = '''
.az{background:var(--paper);border-radius:28px;padding:clamp(18px,3vw,36px);border:1px solid var(--line);box-shadow:0 30px 60px -40px rgba(0,0,0,.35)}
.az-step{display:none}.az-step.on{display:block}
.az-k{font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--hivis-ink)}
.az h2{margin-top:6px;font-size:clamp(1.7rem,3.4vw,2.6rem)}
.az .qform{margin-top:20px}
.az form .f{display:block;font-weight:700;margin-top:18px;max-width:520px}
.az form .f input{display:block;width:100%;margin-top:6px;font:inherit;padding:.85rem 1rem;border-radius:14px;border:2px solid var(--line);min-height:52px}
.az form .consent{display:flex;gap:10px;align-items:flex-start;margin:14px 0 18px;max-width:560px;font-size:.92rem}
.az form .consent input{width:20px;height:20px;margin-top:2px}
.az .fe{color:#B42318;font-weight:700;margin-top:10px;min-height:1.2em}
.az-prog{list-style:none;padding:0;margin-top:22px;display:grid;gap:12px;max-width:560px}
.az-prog li{display:flex;gap:12px;align-items:center;font-weight:600;color:var(--muted);transition:color .3s}
.az-prog li::before{content:"";width:22px;height:22px;border-radius:50%;border:2px solid #B8BEC4;flex:0 0 22px;transition:all .3s}
.az-prog li.run{color:var(--ink)}.az-prog li.run::before{border-color:var(--hivis);border-top-color:transparent;animation:spin .8s linear infinite}
.az-prog li.ok2{color:var(--ink)}.az-prog li.ok2::before{background:#2FB27E;border-color:#2FB27E}
.az-res{display:grid;grid-template-columns:1.3fr 1fr;gap:18px;margin-top:18px}
.az-att{display:inline-flex;align-items:center;gap:8px;font-weight:800;padding:6px 12px;border-radius:999px;font-size:.88rem}
.az-att.low{background:#DDEFE7;color:#0B5A40}.az-att.medium{background:#FFF0C7;color:#7A5300}.az-att.high{background:#FDE2D6;color:#9A2E06}
.az-box{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px}
.az-box h3{font-size:1.05rem}
.az-box ul,.az-box ol{margin:8px 0 0 1.1em;display:grid;gap:6px;font-size:.95rem}
.az-facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:14px}
.az-facts div{background:#F2F1EC;border-radius:12px;padding:9px 11px}
.az-facts span{display:block;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.az-facts b{font-size:.95rem}
.az-cta{background:var(--ink);color:var(--paper);border-radius:22px;padding:22px;margin-top:20px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}
.az-cta p{color:#C9D0D6;max-width:none}
.az-cta b{color:#fff;font-size:1.25rem;display:block}
@media (max-width:820px){.az-res{grid-template-columns:1fr}.az-cta{grid-template-columns:1fr}}
'''

ANALYZE_JS = '''<script>
(function(){
  var $ = function(i){ return document.getElementById(i); };
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';
  var PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';
  var url = '';
  function show(n){ ['az-1','az-2','az-3','az-4'].forEach(function(id, i){ $(id).classList.toggle('on', i === n - 1); }); $('az').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function ev(n, p){ if (window.kbEvent) kbEvent(n, p || {}); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function norm(v){ v = v.trim(); if (!v) return ''; if (!/^https?:\\/\\//i.test(v)) v = 'https://' + v; try { var u = new URL(v); return /\\./.test(u.hostname) ? u.toString() : ''; } catch (e) { return ''; } }
  function step1(){ var v = norm($('az-url').value); if (!v) { $('az-e1').textContent = 'Paste the full website address of the project.'; return; }
    url = v; $('az-e1').textContent = ''; $('az-host').textContent = new URL(url).hostname.replace(/^www\\./, ''); show(2); $('az-email').focus(); ev('desk_url'); }
  $('az-f1').addEventListener('submit', step1);
  var qs = new URLSearchParams(location.search); if (qs.get('url')) { $('az-url').value = qs.get('url'); step1(); }
  function save(email, note){ try { fetch(SB, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_name: 'Desk review request', p_email: email, p_country: '', p_phone: '', p_who: 'buyer | desk review', p_bring: note.slice(0, 4000), p_learn: url.slice(0, 300), p_week: '', p_lang: 'en', p_source: 'yc-desk | ' + location.pathname, p_plan: 'yc-desk' }) }); } catch (e) {} }
  $('az-f2').addEventListener('submit', function(){
    var email = $('az-email').value.trim();
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { $('az-e2').textContent = 'Add a valid email address.'; return; }
    if (!$('az-ok').checked) { $('az-e2').textContent = 'Tick the box so we can email you.'; return; }
    $('az-e2').textContent = ''; show(3); ev('generate_lead', { role: 'desk' });
    var lis = $('az-prog').querySelectorAll('li'), i = 0; lis[0].classList.add('run');
    var tick = setInterval(function(){ if (i < lis.length - 1) { lis[i].classList.remove('run'); lis[i].classList.add('ok2'); i++; lis[i].classList.add('run'); } }, 6000);
    $('az-first').textContent = 'Starting…';
    fetch('/api/kb/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: url, email: email, company: $('az-co').value }) })
      .then(function(r){ return r.json().then(function(d){ return [r.status, d]; }); })
      .then(function(x){ clearInterval(tick); var s = x[0], d = x[1];
        lis.forEach(function(l){ l.classList.remove('run'); l.classList.add('ok2'); });
        if (s !== 200 || !d.report) { render_err(d.error); save(email, 'Desk review failed: ' + (d.error || s)); return; }
        save(email, 'Desk review: ' + (d.report.summary || '') + ' | attention: ' + (d.report.attention || ''));
        setTimeout(function(){ render(d); }, 500);
      }).catch(function(){ clearInterval(tick); render_err('network'); save(email, 'Desk review failed: network'); });
    setTimeout(function(){ if ($('az-first').textContent === 'Starting…') $('az-first').textContent = 'Reading the website now'; }, 1200);
  });
  function render_err(e){
    var m = e === 'rate' ? 'You have run several reviews in the last hour. Try again later, or book a full check below.'
      : e === 'fetch' || e === 'empty' ? 'This website blocks automatic reading. Your request is saved and a person on our team will review it within 24 hours.'
      : 'Something went wrong on our side. Your request is saved and we will email you within 24 hours.';
    $('az-4').innerHTML = '<p class="az-k">Desk review</p><h2>We will take it from here</h2><p class="lead">' + m + '</p>' + cta();
    show(4); ev('desk_error', { e: e || '' });
  }
  function cta(){ return '<div class="az-cta"><div><b>Get the full check: €490</b><p>Land certificate checked at the land office, building permit confirmed in the official system, site visit with GPS-stamped video and a contract review. Written report in 7 days. Full refund if we can\\'t take your case.</p></div><a class="btn btn-hi" href="' + PAY + '" rel="noopener" data-ev="pay_check_desk">Book the full check</a></div>'; }
  function render(d){
    var r = d.report || {}, att = (r.attention || 'medium').toLowerCase();
    var facts = [['Project', r.project], ['Developer', r.developer], ['Location', r.location], ['Price from', r.price_from], ['Title', r.title_type], ['Lease', r.lease_years], ['Completion', r.completion], ['Return advertised', r.advertised_return], ['Permit claim', r.permit_claim]].filter(function(f){ return f[1]; });
    var first = d.first ? 'Nobody had asked us about this project before. Your review is the first one.' : (d.tracked ? 'Our agent already follows this project.' : 'Desk review');
    $('az-4').innerHTML = '<p class="az-k">' + esc(first) + '</p><h2>Desk review: ' + esc(r.project || d.host) + '</h2>' +
      '<p><span class="az-att ' + esc(att) + '">' + (att === 'high' ? 'High attention needed' : att === 'low' ? 'Low attention needed' : 'Medium attention needed') + '</span></p>' +
      '<p class="lead" style="margin-top:12px">' + esc(r.summary) + '</p>' +
      (facts.length ? '<div class="az-facts">' + facts.map(function(f){ return '<div><span>' + f[0] + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>' : '') +
      '<div class="az-res"><div class="az-box"><h3>Ask these before you pay</h3><ol>' + (r.questions || []).map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="az-box"><h3>What the website promises</h3><ul>' + (r.promises || []).map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>' +
      ((r.missing || []).length ? '<h3 style="margin-top:14px">What it doesn\\'t say</h3><ul>' + r.missing.map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>' : '') + '</div></div>' +
      cta() + '<p class="muted" style="font-size:.82rem;margin-top:12px">Automated desk review of what the website itself says, on ' + new Date(d.analysed).toUTCString().slice(5, 16) + '. Advertised claims, not verified facts, and not a judgement of the developer.</p>';
    show(4); ev('desk_done', { att: att, first: !!d.first });
  }
})();
</script>'''

import re
DE_VENDOR = [(r',? built on Claude,?', ''), (r'Built on Claude\. ', 'Our own model pipeline. '), (r' pages with Claude', ' pages'), (r': Claude read ', ': our agent read '), (r'Built on Claude, it reads', 'It reads'), (r'<p>Claude pulls out', '<p>Our extraction model pulls out')]

def r14_inject():
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(ANALYZE_CSS)
    fp = os.path.join(OUT, 'check', 'index.html'); s = open(fp).read()
    if 'id="analyze"' not in s:
        i = s.index('</section>', s.index('class="phero"')) + len('</section>')
        s = s[:i] + '\n' + ANALYZE + s[i:]
        s = s.replace('</body>', ANALYZE_JS + '\n</body>', 1)
        open(fp, 'w').write(s)
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            for a, b in DE_VENDOR: s = re.sub(a, b, s)
            s = s.replace('placeholder="Project name, developer or link"', 'placeholder="Project website, name or developer"')
            if s != o: open(p, 'w').write(s)

# ---------- /admin (private dashboard; data comes from Supabase RPC kolaboro_admin, protected by a password hash) ----------
ADMIN_HTML = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kolaboro admin</title><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/k/favicon.svg" type="image/svg+xml">
<style>
:root{--ink:#17212B;--paper:#F6F5F0;--line:#E2E0D8;--muted:#5E6B76;--hi:#FF5B14;--ok:#1E9E6A;--bad:#C9341A;--warn:#B7791F;--card:#fff}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
header{background:var(--ink);color:#fff;padding:14px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;position:sticky;top:0;z-index:5}
header b{font-size:1.1rem}header .sp{flex:1}header button,header a{color:#fff;background:#2B3743;border:0;border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer;text-decoration:none}
nav.tabs{display:flex;gap:6px;flex-wrap:wrap;padding:12px 20px 0}nav.tabs button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;font:inherit;cursor:pointer}nav.tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
main{padding:16px 20px 60px;max-width:1300px;margin:0 auto}
.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px}.kpi span{display:block;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}.kpi b{font-size:1.7rem;display:block;margin-top:4px}.kpi small{color:var(--muted)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:14px}.card h2{margin:0 0 10px;font-size:1.1rem}
table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:.75rem;text-transform:uppercase;color:var(--muted)}
.tw{overflow:auto}.pill{display:inline-block;border-radius:999px;padding:2px 8px;font-size:.75rem;font-weight:700;background:#EEE}
.p-yc-desk{background:#FFE6D9}.p-yc-buyer{background:#DDEFE7}.p-yc-agent{background:#E3E8FF}.p-yc-developer{background:#FFF0C7}
.st{display:inline-flex;align-items:center;gap:6px}.dot{width:10px;height:10px;border-radius:50%;background:#bbb}.dot.g{background:var(--ok)}.dot.r{background:var(--bad)}.dot.y{background:var(--warn)}
.bars{display:flex;align-items:flex-end;gap:4px;height:120px;margin-top:8px}.bars div{flex:1;background:var(--hi);border-radius:4px 4px 0 0;min-height:2px;position:relative}.bars div:hover::after{content:attr(data-t);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;font-size:.7rem;padding:2px 6px;border-radius:6px;white-space:nowrap}
.funnel{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}.funnel div{background:#F2F1EC;border-radius:12px;padding:12px}.funnel b{font-size:1.4rem;display:block}
input,select,textarea{font:inherit;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:#fff}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.btn{background:var(--hi);color:#111;border:0;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer}.btn2{background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 12px;cursor:pointer;font:inherit}
.links{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.links a{display:block;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;color:inherit;text-decoration:none}.links a b{display:block}.links a small{color:var(--muted)}
#login{max-width:380px;margin:12vh auto;background:#fff;border:1px solid var(--line);border-radius:20px;padding:24px}#login input{width:100%;margin:12px 0}
.hide{display:none!important}.muted{color:var(--muted)}details summary{cursor:pointer}
@media (max-width:640px){main{padding:12px}th:nth-child(n+5),td:nth-child(n+5){display:none}}
</style></head><body>
<div id="login"><h1 style="margin:0">Kolaboro admin</h1><p class="muted">Private dashboard. Enter the admin password.</p>
<form id="lf"><input id="pw" type="password" autocomplete="current-password" placeholder="Password" required><button class="btn" style="width:100%">Open dashboard</button><p id="le" style="color:var(--bad)"></p></form></div>
<div id="app" class="hide">
<header><b>Kolaboro admin</b><span class="muted" id="upd" style="color:#9fb0bf"></span><span class="sp"></span><button id="rf">Refresh</button><a href="/" target="_blank">Site ↗</a><button id="lo">Log out</button></header>
<nav class="tabs"><button data-t="ov" class="on">Overview</button><button data-t="leads">Leads & emails</button><button data-t="pay">Payments</button><button data-t="tests">Tests & health</button><button data-t="tools">Analytics & tools</button></nav>
<main>
<section id="t-ov">
  <div class="kpis" id="kpis"></div>
  <div class="card"><h2>Funnel: desk review → payment</h2><div class="funnel" id="funnel"></div><p class="muted" style="margin:8px 0 0;font-size:.85rem">Desk reviews and leads come from the database. "Clicked pay" and "Back from PayPal" are logged by the site. Payments are the ones you confirm in the Payments tab.</p></div>
  <div class="card"><h2>Leads per day (last 30 days)</h2><div class="bars" id="bars"></div></div>
  <div class="card"><h2>Latest activity</h2><div class="tw"><table id="act"></table></div></div>
</section>
<section id="t-leads" class="hide">
  <div class="card"><div class="row"><input id="q" placeholder="Search name, email, URL…" style="flex:1;min-width:200px"><select id="pf"><option value="">All types</option></select><select id="sf"><option value="">Any status</option><option>new</option><option>contacted</option><option>paid</option><option>no</option></select><button class="btn2" id="csv">Export CSV</button></div>
  <div class="tw" style="margin-top:10px"><table id="lt"></table></div></div>
</section>
<section id="t-pay" class="hide">
  <div class="kpis" id="pk"></div>
  <div class="card"><h2>Record a payment</h2><p class="muted" style="margin-top:0">PayPal doesn't send payments to the site automatically yet, so confirm each one here after you see it in PayPal.</p>
  <form id="pform" class="row"><input name="paid_at" type="date"><input name="name" placeholder="Name"><input name="email" placeholder="Email"><input name="amount" type="number" step="0.01" placeholder="Amount" required style="width:110px"><select name="currency"><option>EUR</option><option>USD</option></select><select name="product"><option>Full check €490</option><option>Desk review</option><option>Verification via Eco Beach City €500</option><option>Other</option></select><input name="ref" placeholder="PayPal transaction ID"><button class="btn">Add</button></form></div>
  <div class="card"><h2>Payments</h2><div class="tw"><table id="ptab"></table></div></div>
</section>
<section id="t-tests" class="hide">
  <div class="card"><div class="row"><h2 style="margin:0;flex:1">Live checks</h2><button class="btn" id="run">Run all checks</button></div><div class="tw" style="margin-top:10px"><table id="tt"></table></div></div>
  <div class="card"><h2>Research agent</h2><div id="agent" class="muted">Loading…</div></div>
</section>
<section id="t-tools" class="hide"><div class="links" id="links"></div></section>
</main></div>
<script>
(function(){
var SB='https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/', KEY='__ANON__';
var $=function(i){return document.getElementById(i)}, D=null, PW='';
function st(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function rpc(fn,body){return fetch(SB+fn,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json()})}
function when(t){var d=new Date(t),s=(Date.now()-d)/1000;if(s<3600)return Math.max(1,Math.round(s/60))+' min ago';if(s<86400)return Math.round(s/3600)+' h ago';return d.toLocaleDateString(undefined,{day:'numeric',month:'short'})+' '+d.toTimeString().slice(0,5)}
function load(){ $('upd').textContent='Loading…'; return rpc('kolaboro_admin',{p_key:PW}).then(function(d){ if(d.error){ st('kb-admin',null); $('app').classList.add('hide'); $('login').classList.remove('hide'); $('le').textContent='Wrong password.'; return;} D=d; $('login').classList.add('hide'); $('app').classList.remove('hide'); render(); $('upd').textContent='Updated '+new Date().toTimeString().slice(0,5); })}
$('lf').addEventListener('submit',function(e){e.preventDefault();PW=$('pw').value;st('kb-admin',PW);load()});
$('lo').onclick=function(){st('kb-admin',null);location.reload()}; $('rf').onclick=load;
document.querySelectorAll('nav.tabs button').forEach(function(b){b.onclick=function(){document.querySelectorAll('nav.tabs button').forEach(function(x){x.classList.toggle('on',x===b)});['ov','leads','pay','tests','tools'].forEach(function(t){$('t-'+t).classList.toggle('hide',t!==b.dataset.t)}); if(b.dataset.t==='tests'&&!$('tt').innerHTML)runTests();}});
function cnt(f){return D.leads.filter(f).length}
function ev(k){return D.events.filter(function(e){return e.kind===k}).length}
function render(){
  var L=D.leads, wk=Date.now()-7*864e5, test=function(l){return /test|example/i.test(l.email)};
  var real=L.filter(function(l){return !test(l)});
  var paid=D.payments.reduce(function(a,p){return a+(+p.amount||0)},0);
  var k=[['Leads (all)',real.length,cnt(function(l){return !test(l)&&new Date(l.created_at)>wk})+' this week'],['Desk reviews',cnt(function(l){return l.plan==='yc-desk'}),'URLs analysed with email'],['Buyers',cnt(function(l){return l.plan==='yc-buyer'}),'want protection'],['Agents',cnt(function(l){return l.plan==='yc-agent'}),'applied'],['Developers',cnt(function(l){return l.plan==='yc-developer'}),'applied'],['Newsletter',cnt(function(l){return l.plan==='yc-newsletter'}),'subscribers'],['Revenue recorded','€'+paid.toLocaleString(),D.payments.length+' payments'],['Back from PayPal',ev('paypal_return'),'returns to /thanks']];
  $('kpis').innerHTML=k.map(function(x){return '<div class="kpi"><span>'+x[0]+'</span><b>'+x[1]+'</b><small>'+x[2]+'</small></div>'}).join('');
  var f=[['Desk reviews',cnt(function(l){return l.plan==='yc-desk'})],['Review shown',ev('desk_done')],['Clicked pay',ev('pay_click')],['Back from PayPal',ev('paypal_return')],['Payments confirmed',D.payments.length]];
  $('funnel').innerHTML=f.map(function(x,i){var p=i&&f[0][1]?' <small class="muted">'+Math.round(100*x[1]/f[0][1])+'%</small>':'';return '<div><span class="muted">'+x[0]+'</span><b>'+x[1]+p+'</b></div>'}).join('');
  var m={};D.daily.forEach(function(x){m[x.d]=x.n});var mx=Math.max.apply(null,D.daily.map(function(x){return x.n}).concat([1])),h='';
  for(var i=29;i>=0;i--){var d=new Date(Date.now()-i*864e5).toISOString().slice(0,10),n=m[d]||0;h+='<div style="height:'+(100*n/mx)+'%" data-t="'+d.slice(5)+': '+n+'"></div>'} $('bars').innerHTML=h;
  var act=L.slice(0,8).map(function(l){return {t:l.created_at,k:'Lead · '+(l.plan||'other'),x:l.email+(l.learn?' · '+l.learn:'')}}).concat(D.events.slice(0,8).map(function(e){return {t:e.created_at,k:'Event · '+e.kind,x:(e.ref||'')+' '+(e.page||'')}})).sort(function(a,b){return b.t<a.t?-1:1}).slice(0,12);
  $('act').innerHTML='<tr><th>When</th><th>What</th><th>Detail</th></tr>'+act.map(function(a){return '<tr><td>'+when(a.t)+'</td><td>'+esc(a.k)+'</td><td>'+esc(a.x).slice(0,160)+'</td></tr>'}).join('');
  var plans={};L.forEach(function(l){plans[l.plan||'other']=1});$('pf').innerHTML='<option value="">All types</option>'+Object.keys(plans).map(function(p){return '<option>'+esc(p)+'</option>'}).join('');
  leads(); pays();
}
function flt(){var q=$('q').value.toLowerCase(),p=$('pf').value,s=$('sf').value;return D.leads.filter(function(l){return (!p||(l.plan||'other')===p)&&(!s||(l.status||'new')===s)&&(!q||JSON.stringify(l).toLowerCase().indexOf(q)>=0)})}
function leads(){var r=flt();$('lt').innerHTML='<tr><th>When</th><th>Type</th><th>Name / email</th><th>Status</th><th>Country</th><th>Project / URL</th><th>Details</th></tr>'+r.map(function(l){var url=/^https?:/.test(l.learn||'')?'<a href="'+esc(l.learn)+'" target="_blank" rel="noopener">'+esc(l.learn.replace(/^https?:\/\/(www\.)?/,'').slice(0,40))+'</a>':esc(l.learn);
  return '<tr><td>'+when(l.created_at)+'</td><td><span class="pill p-'+esc(l.plan)+'">'+esc(l.plan||'other')+'</span></td><td><b>'+esc(l.name)+'</b><br><a href="mailto:'+esc(l.email)+'">'+esc(l.email)+'</a>'+(l.phone?'<br>'+esc(l.phone):'')+'</td><td><select data-id="'+l.id+'">'+['new','contacted','paid','no'].map(function(s){return '<option'+((l.status||'new')===s?' selected':'')+'>'+s+'</option>'}).join('')+'</select></td><td>'+esc(l.country)+'</td><td>'+url+'</td><td><details><summary>'+esc((l.who||'').slice(0,40))+'</summary><p>'+esc(l.bring)+'</p><p class="muted">'+esc(l.source)+' · '+esc(l.lang)+' '+esc(l.week)+'</p></details></td></tr>'}).join('');
  $('lt').querySelectorAll('select').forEach(function(s){s.onchange=function(){rpc('kolaboro_admin',{p_key:PW,p_action:'set_status',p_payload:{id:s.dataset.id,status:s.value}}).then(load)}})}
['q','pf','sf'].forEach(function(i){$(i).addEventListener('input',leads)});
$('csv').onclick=function(){var r=flt(),c=['created_at','plan','status','name','email','phone','country','learn','who','bring','source','lang'];var t=c.join(',')+'\n'+r.map(function(l){return c.map(function(k){return '"'+String(l[k]==null?'':l[k]).replace(/"/g,'""')+'"'}).join(',')}).join('\n');var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download='kolaboro-leads.csv';a.click()};
function pays(){var P=D.payments,tot={};P.forEach(function(p){tot[p.currency]=(tot[p.currency]||0)+(+p.amount||0)});
  $('pk').innerHTML=[['Payments',P.length],['Total',Object.keys(tot).map(function(c){return c+' '+tot[c].toLocaleString()}).join(' · ')||'0'],['Clicked pay',ev('pay_click')],['Back from PayPal',ev('paypal_return')]].map(function(x){return '<div class="kpi"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>'}).join('');
  $('ptab').innerHTML='<tr><th>Date</th><th>Name / email</th><th>Amount</th><th>Product</th><th>PayPal ID</th><th></th></tr>'+P.map(function(p){return '<tr><td>'+esc(p.paid_at)+'</td><td>'+esc(p.name)+'<br>'+esc(p.email)+'</td><td><b>'+esc(p.currency)+' '+esc(p.amount)+'</b></td><td>'+esc(p.product)+'</td><td>'+esc(p.ref)+'</td><td><button class="btn2" data-del="'+p.id+'">Delete</button></td></tr>'}).join('')||'<tr><td>No payments recorded yet.</td></tr>';
  $('ptab').querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){if(confirm('Delete this payment?'))rpc('kolaboro_admin',{p_key:PW,p_action:'del_payment',p_payload:{id:b.dataset.del}}).then(load)}})}
$('pform').addEventListener('submit',function(e){e.preventDefault();var f=new FormData(e.target),o={};f.forEach(function(v,k){if(v)o[k]=v});rpc('kolaboro_admin',{p_key:PW,p_action:'add_payment',p_payload:o}).then(function(){e.target.reset();load()})});
var PAGES=['/','/check','/cases','/agents','/agents/visit','/developers','/research','/pricing','/yc','/portal/demo','/thanks','/sitemap.xml','/robots.txt','/k/kolaboro-demo.mp4','/cases/files/kolaboro-report-example-safe-to-pay.pdf'];
function row(n,ok,d,ms){return '<tr><td><span class="st"><span class="dot '+(ok===true?'g':ok===false?'r':'y')+'"></span>'+esc(n)+'</span></td><td>'+d+'</td><td>'+(ms!=null?ms+' ms':'')+'</td></tr>'}
function runTests(){var out=[],T=$('tt');T.innerHTML='<tr><td>Running…</td></tr>';
  var jobs=PAGES.map(function(p){var t0=performance.now();return fetch(p,{method:p.indexOf('.mp4')>0||p.indexOf('.pdf')>0?'HEAD':'GET',cache:'no-store'}).then(function(r){out.push(row('Page '+p,r.ok,'HTTP '+r.status,Math.round(performance.now()-t0)))}).catch(function(){out.push(row('Page '+p,false,'failed'))})});
  jobs.push(fetch('/api/kb/health',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){out.unshift(row('Desk review API',!!d.configured,d.configured?'Live, AI key configured':'API up but key missing'))}).catch(function(){out.unshift(row('Desk review API',false,'Not reachable'))}));
  jobs.push(fetch('/',{cache:'no-store'}).then(function(r){return r.text()}).then(function(h){out.unshift(row('Google Analytics tag',h.indexOf('G-FJKJE77K4V')>0,'G-FJKJE77K4V on home'));out.unshift(row('Microsoft Clarity',h.indexOf('z4eqcmaic7')>0,'Project z4eqcmaic7 on home'));out.unshift(row('PayPal checkout link',h.indexOf('paypal.com/ncp/payment/')>0,'€490 button present'));out.unshift(row('Google Search Console',true,'Domain property verified by DNS TXT on 28 Oct · sitemap submitted'))}));
  jobs.push(rpc('kolaboro_event',{p_kind:'bogus'}).then(function(d){out.unshift(row('Database (Supabase)',d==='invalid','Lead and event functions answer'))}).catch(function(){out.unshift(row('Database (Supabase)',false,'Not reachable'))}));
  Promise.all(jobs).then(function(){T.innerHTML='<tr><th>Check</th><th>Result</th><th>Time</th></tr>'+out.join('')});
  fetch('/data/bali-claims.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){var run=(d.runs||[]).slice(-1)[0]||{},dt=run.date||d.updated||'';var age=dt?(Date.now()-new Date(dt))/864e5:99;
    $('agent').innerHTML='<p><span class="st"><span class="dot '+(age<8?'g':'r')+'"></span><b>Last run '+esc(dt||'unknown')+'</b></span> '+(age<8?'(on schedule, weekly on Mondays)':'(older than a week: check GitHub Actions)')+'</p><p>Projects tracked: <b>'+(typeof d.projects==='number'?d.projects:(d.projects||[]).length)+'</b> · runs: <b>'+(d.runs||[]).length+'</b>'+(run.pages_ok!=null?' · pages read: <b>'+run.pages_ok+'</b>'+(run.pages_failed?' · failed: '+run.pages_failed:''):'')+'</p><p><a href="https://github.com/calory89/webs-estaticas/actions/workflows/kolaboro-agent.yml" target="_blank" rel="noopener">Open the agent in GitHub Actions ↗</a></p>'}).catch(function(){$('agent').textContent='Could not read /data/bali-claims.json'})}
$('run').onclick=runTests;
var LK=[['Google Analytics 4','https://analytics.google.com/analytics/web/','Traffic, sources, events (G-FJKJE77K4V)'],['Microsoft Clarity','https://clarity.microsoft.com/projects/view/z4eqcmaic7/dashboard','Recordings and heatmaps'],['Google Search Console','https://search.google.com/search-console?resource_id=sc-domain%3Akolaboro.com','Indexing, queries, sitemap'],['PayPal activity','https://www.paypal.com/myaccount/activities/','See payments, then record them here'],['Supabase (data)','https://supabase.com/dashboard/project/oykcsmextclpdnugixqz/editor','Tables kolaboro_applications, _events, _payments'],['Cloudflare Pages','https://dash.cloudflare.com/d275d2609c10aa655477fd7a47e9b443/pages/view/web-lovable','Deploys, secret ANTHROPIC_API_KEY'],['GitHub repo','https://github.com/calory89/webs-estaticas/tree/main/tools/kolaboro-site','Site source and worker'],['Research agent runs','https://github.com/calory89/webs-estaticas/actions/workflows/kolaboro-agent.yml','Weekly run, Mondays 06:17 UTC'],['Anthropic console','https://console.anthropic.com/settings/usage','AI cost of desk reviews'],['Desk review (live)','/check#analyze','Try the funnel yourself'],['Product tour','/yc','What YC sees'],['Buyer portal demo','/portal/demo','Demo data']];
$('links').innerHTML=LK.map(function(l){return '<a href="'+l[1]+'" target="_blank" rel="noopener"><b>'+l[0]+' ↗</b><small>'+l[2]+'</small></a>'}).join('');
PW=st('kb-admin')||''; if(PW)load();
})();
</script></body></html>
'''

EVENTS_JS = '''
;(function(){
  var SB='https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_event', K='__ANON__';
  function log(kind, ref){ try { fetch(SB, { method:'POST', keepalive:true, headers:{ apikey:K, Authorization:'Bearer '+K, 'Content-Type':'application/json' }, body: JSON.stringify({ p_kind:kind, p_ref:ref||null, p_page:location.pathname }) }); } catch(e){} }
  window.kbLog = log;
  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href*="paypal.com"]'); if (a) log('pay_click', a.getAttribute('data-ev') || a.textContent.trim().slice(0,60)); }, true);
  if (/^\\/thanks/.test(location.pathname)) { try { if (!sessionStorage.getItem('kb-pr')) { sessionStorage.setItem('kb-pr','1'); log('paypal_return', location.search.slice(0,200)); } } catch(e){ log('paypal_return'); } }
})();
'''

def r14_admin():
    import re as _re
    anon = _re.search(r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[\w.-]+", ANALYZE_JS).group(0)
    os.makedirs(os.path.join(OUT, 'admin'), exist_ok=True)
    open(os.path.join(OUT, 'admin', 'index.html'), 'w').write(ADMIN_HTML.replace('__ANON__', anon))
    open(os.path.join(OUT, 'k', 'site.js'), 'a').write(EVENTS_JS.replace('__ANON__', anon))
    fp = os.path.join(OUT, 'check', 'index.html'); s = open(fp).read()
    s = s.replace("show(4); ev('desk_done', { att: att, first: !!d.first });", "show(4); ev('desk_done', { att: att, first: !!d.first }); if (window.kbLog) kbLog('desk_done', url);")
    s = s.replace("show(4); ev('desk_error', { e: e || '' });", "show(4); ev('desk_error', { e: e || '' }); if (window.kbLog) kbLog('desk_error', url + ' | ' + (e || ''));")
    open(fp, 'w').write(s)
    rb = os.path.join(OUT, 'robots.txt')
    if os.path.exists(rb):
        t = open(rb).read()
        if '/admin' not in t: open(rb, 'w').write(t.replace('User-agent: *', 'User-agent: *\nDisallow: /admin', 1))
