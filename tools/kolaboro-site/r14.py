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
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
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
