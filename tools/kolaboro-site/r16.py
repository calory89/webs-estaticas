# Round 16: YC positioning. "AI lets local people do reliable property verification."
# /copilot (live agent copilot + how a local becomes a verifier + unit economics + pilot), /independence,
# developers never pay, softer verdict wording, home bands replaced.

COPILOT_SAMPLE = [
  ('Land certificate (photo transcribed by the agent)', 'Sertifikat Hak Milik No. 04512. Desa Pecatu, Kecamatan Kuta Selatan, Kabupaten Badung. Luas: 400 m2. Pemegang hak: I Made Sudarsana. Diterbitkan: 12-03-2019. Surat Ukur No. 00871/2018.'),
  ('Developer brochure', 'Nara Cliff Villas, Pecatu. Private 3-bedroom villa on a 500 m2 plot. Own it outright: freehold ownership through our trusted local nominee. Completion Q3 2026. Guaranteed 12% net rental yield for 5 years, managed by us. Developer: PT Nara Bali Development.'),
  ('Contract and permit (excerpt)', 'Lease agreement for 25 years between I Made Sudarsana (owner) and PT Nara Bali Development. Building permit PBG No. 0123/2024 issued for: rumah tinggal (private residential house). Buyer pays 30% on signing, 30% at foundations, 30% at roof, 10% at handover.'),
]

def build_copilot():
    docs = ''.join(f'''<div class="cp-doc"><label><span>{H.escape(l)}</span><textarea rows="5" data-label="{H.escape(l)}">{H.escape(t)}</textarea></label></div>''' for l, t in COPILOT_SAMPLE)
    body = f'''<section class="phero cp-hero"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / Agent copilot</p>
<h1>A local, an AI copilot and a senior reviewer. That's how we make reliable property verifiers.</h1>
<p class="lead">Verifying an off-plan villa abroad used to need a lawyer, a surveyor and a friend on the ground. Kolaboro trains people who already live there, and our copilot tells them on every case what to ask for, what to check on site and when to call a notary.</p>
<div class="hero-cta"><a class="btn btn-hi" href="#try">Try the copilot</a><a class="btn btn-line" href="/agents">Become an agent</a></div></div></section>

<section class="sec" id="try"><div class="wrap">
  <div class="cp-head"><p class="eyebrow">Live demo · runs our real copilot</p><h2>Paste what the agent has. See what the copilot tells them.</h2>
  <p class="lead">The documents below are a fictional sample. Edit them, or paste your own. The copilot compares them, lists the inconsistencies, and decides: go, hold, or stop and escalate.</p></div>
  <div class="cp-grid">
    <form id="cpf" class="cp-in">{docs}
      <label class="hp" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>
      <div class="row"><select id="cpstage" aria-label="Stage"><option>Pre-purchase</option><option>Before instalment 2 (foundations)</option><option>Before instalment 3 (roof)</option><option>Handover</option></select><button class="btn btn-hi" type="submit">Run the copilot</button></div>
      <p class="cp-err" id="cperr" role="alert"></p></form>
    <div class="cp-out" id="cpout" aria-live="polite"><div class="cp-empty"><b>What the agent gets back</b><ul><li>Inconsistencies between documents, quoted word for word</li><li>What to ask for, and from whom</li><li>What to measure on site</li><li>When to stop and call a notary or lawyer</li></ul></div></div>
  </div>
</div></section>

<section class="sec alt"><div class="wrap">
  <h2>How someone new becomes a verifier you can trust</h2>
  <ol class="cp-steps">
    <li><b>1 · Learn</b><span>Ten short lessons and an exam in the <a href="/academy">Kolaboro Academy</a>: land titles, permits, payment plans, red flags. Free, no degree needed.</span></li>
    <li><b>2 · Work with the copilot</b><span>On every case: a desk review of the developer's website, document cross-checks like the one above, and a milestone checklist in our <a href="/agents/visit">field app</a> that stamps every photo with GPS, time and a SHA-256 fingerprint.</span></li>
    <li><b>3 · Get reviewed</b><span>Until an agent has delivered 10 reports with no material corrections, a senior reviewer checks every report before the buyer sees it. When the copilot escalates, a notary or lawyer signs off.</span></li>
    <li><b>4 · Earn trust</b><span>Each agent has a quality record: reviewer corrections, issues found, time to report. Better records mean fewer reviews and more cases. <a href="/agents/how-we-choose">How we choose agents</a>.</span></li>
  </ol>
</div></section>

<section class="sec"><div class="wrap grid2">
  <div><h2>The numbers we're building to</h2><p class="lead">Target unit economics of one pre-purchase check in our pilot. We publish the real figures as the pilot runs.</p></div>
  <div><table class="cp-table"><tbody>
    <tr><td>Price paid by the buyer</td><td>€490</td></tr>
    <tr><td>Local agent (desk work + site visit)</td><td>−€150</td></tr>
    <tr><td>Senior review</td><td>−€40</td></tr>
    <tr><td>Registry fees, transport</td><td>−€30</td></tr>
    <tr><td>AI and data</td><td>−€1</td></tr>
    <tr class="tot"><td>Contribution per check</td><td>€269 · 55%</td></tr>
  </tbody></table>
  <p class="muted" style="font-size:.88rem">A lawyer-led due diligence on the same villa typically costs buyers in the low thousands of euros and doesn't include a site visit before each payment.</p></div>
</div></section>

<section class="sec alt"><div class="wrap grid2">
  <div><h2>The pilot we're running now</h2><p class="lead">Two new local agents in Bali. Five paid pre-purchase checks. Every report reviewed blind by an independent professional who doesn't know who wrote it.</p></div>
  <div><ul class="cp-ul"><li><b>Hours per report</b> for a new agent with the copilot</li><li><b>Reviewer corrections</b> per report, and how fast they fall</li><li><b>Issues found</b> that the buyer didn't know about</li><li><b>Margin per check</b> after paying the agent and the reviewer</li></ul>
  <div class="hero-cta" style="margin-top:18px"><a class="btn btn-hi" href="/check#analyze">Get a check</a><a class="btn btn-line" href="/independence">Our independence rules</a></div></div>
</div></section>'''
    js = r'''<script>
(function(){
  var f = document.getElementById('cpf'), out = document.getElementById('cpout'), err = document.getElementById('cperr');
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  var ST = { go:['Go','go'], hold:['Hold','hold'], stop_and_escalate:['Stop and escalate','stop'] };
  f.addEventListener('submit', function(e){
    e.preventDefault(); err.textContent = '';
    var docs = [].map.call(f.querySelectorAll('textarea'), function(t){ return { label: t.dataset.label, text: t.value }; });
    var b = f.querySelector('button'); b.disabled = true; b.textContent = 'Reading the documents…';
    out.innerHTML = '<div class="cp-load"><i></i><i></i><i></i><p>Comparing ' + docs.length + ' documents…</p></div>';
    if (window.kbEvent) kbEvent('copilot_run');
    fetch('/api/kb/copilot', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ docs: docs, stage: document.getElementById('cpstage').value, company: f.company.value }) })
      .then(function(r){ return r.json(); }).then(function(d){
        b.disabled = false; b.textContent = 'Run the copilot';
        if (!d.copilot) { out.innerHTML = ''; err.textContent = d.error === 'rate' ? 'You have run the copilot several times this hour. Try again later.' : 'The copilot could not run right now. Try again in a minute.'; return; }
        var c = d.copilot, s = ST[c.status] || ST.hold, esc2 = c.escalate || {};
        out.innerHTML = '<div class="cp-status ' + s[1] + '"><span>Copilot decision</span><b>' + s[0] + '</b><p>' + esc(c.summary) + '</p></div>' +
          ((c.inconsistencies || []).length ? '<h3>Inconsistencies</h3>' + c.inconsistencies.map(function(x){ return '<div class="cp-inc ' + esc(x.severity) + '"><b>' + esc(x.topic) + '</b><div class="cp-ab"><span>“' + esc(x.a) + '”</span><span>“' + esc(x.b) + '”</span></div><small>' + esc(x.why) + '</small></div>'; }).join('') : '') +
          '<h3>Ask for</h3><ol>' + (c.ask_for || []).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
          '<h3>Check on site</h3><ol>' + (c.check_on_site || []).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
          (esc2.needed ? '<div class="cp-esc"><b>Escalate to a ' + esc(esc2.to) + '</b><p>' + esc(esc2.why) + '</p></div>' : '') +
          '<p class="muted" style="font-size:.8rem;margin-top:12px">The copilot flags and routes. It doesn\'t give legal advice: a notary or lawyer signs off whenever it escalates.</p>';
      }).catch(function(){ b.disabled = false; b.textContent = 'Run the copilot'; err.textContent = 'Network error. Try again.'; });
  });
})();
</script>'''
    return page('/copilot', 'Agent copilot: how local people verify property with AI | Kolaboro',
                'Kolaboro trains local people to verify off-plan property for overseas buyers. Our AI copilot tells them what to ask, what to check on site and when to escalate. Try it live.', body, extra_js=js)

def build_independence():
    body = phero('Independence', 'Developers never pay us. That is the whole point.',
                 'Kolaboro works for the buyer. These are the rules that keep it that way, and we publish them so you can hold us to them.')
    body += '''<section class="sec"><div class="wrap grid2">
  <div><h2>Our rules</h2></div>
  <div class="prose"><ol>
    <li><b>The buyer pays. Only the buyer.</b> Every check is paid by the person buying. Developers never pay Kolaboro for a check, a score, a badge or a listing.</li>
    <li><b>Developers can share documents, for free.</b> Permits, land certificates and progress photos help buyers. Sharing them never buys a better result: our agent verifies them like any other evidence.</li>
    <li><b>Agents are paid the same whatever they find.</b> A "hold" pays exactly what a "go" pays. A red flag that saves a buyer is the best work an agent can do.</li>
    <li><b>No conflicts.</b> We never review a project in which a Kolaboro founder, employee, agent or investor has an interest. If a conflict appears, we disclose it and hand the case to someone else.</li>
    <li><b>Evidence, not guarantees.</b> We tell you what we verified, what we couldn't, and whether the evidence supports paying the next instalment. A check lowers your risk. It can't remove it.</li>
    <li><b>We correct in public.</b> If we get something wrong, we fix it and log it on our <a href="/corrections">corrections page</a>.</li>
  </ol></div>
</div></section>'''
    return page('/independence', 'Independence | Kolaboro', 'Developers never pay Kolaboro. The rules that keep our checks independent.', body)

def build_round16():
    return [build_copilot(), build_independence()]

R16_CSS = '''
.cp-hero h1{max-width:20ch}.eyebrow{font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem;color:var(--hivis-ink)}
.cp-head{max-width:820px}.cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:26px;align-items:start}
.cp-doc label{display:block;margin-bottom:12px}.cp-doc span{display:block;font-weight:800;font-size:.85rem;margin-bottom:6px}
.cp-doc textarea{width:100%;font:inherit;font-size:.92rem;border:2px solid var(--line);border-radius:14px;padding:12px;background:#fff;resize:vertical}
.cp-in .row{display:flex;gap:10px;flex-wrap:wrap}.cp-in select{font:inherit;border:2px solid var(--line);border-radius:14px;padding:10px;background:#fff}
.cp-err{color:#B42318;font-weight:700;min-height:1.2em}
.cp-out{background:var(--ink);color:#fff;border-radius:22px;padding:22px;min-height:420px;position:sticky;top:90px}
.cp-out h3{color:#fff;font-size:1rem;margin:18px 0 6px}.cp-out ol{margin:0 0 0 1.1em;padding:0;display:grid;gap:6px;color:#D7DDE2}.cp-out .muted{color:#8D9BA7}
.cp-empty b{display:block;font-size:1.2rem;margin-bottom:8px}.cp-empty ul{color:#C9D0D6;display:grid;gap:8px}
.cp-status{border-radius:16px;padding:14px 16px;background:#2B3743}.cp-status span{font-size:.75rem;text-transform:uppercase;letter-spacing:.07em;font-weight:800;opacity:.8}.cp-status b{display:block;font-size:1.6rem}.cp-status p{margin:4px 0 0;color:#E6EAED}
.cp-status.go{background:#0B7A55}.cp-status.hold{background:#9A6400}.cp-status.stop{background:#B42318}
.cp-inc{background:#22303C;border-radius:14px;padding:10px 12px;margin-top:8px;border-left:4px solid #B7791F}.cp-inc.high{border-color:#FF5B14}.cp-inc.low{border-color:#2FB27E}
.cp-ab{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0;font-size:.88rem;color:#E6EAED}.cp-ab span{background:#17212B;border-radius:10px;padding:6px 8px}
.cp-inc small{color:#AEB9C2}
.cp-esc{background:#FF5B14;color:#111;border-radius:14px;padding:12px 14px;margin-top:14px}.cp-esc p{margin:4px 0 0}
.cp-load{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cp-load i{width:10px;height:10px;border-radius:50%;background:#FF5B14;animation:cpb 1s infinite}.cp-load i:nth-child(2){animation-delay:.15s}.cp-load i:nth-child(3){animation-delay:.3s}.cp-load p{width:100%;color:#C9D0D6}
@keyframes cpb{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}
.cp-steps{list-style:none;padding:0;margin:26px 0 0;display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.cp-steps li{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px}.cp-steps b{display:block;font-size:1.1rem;margin-bottom:6px}.cp-steps span{color:var(--muted)}
.cp-table{width:100%;border-collapse:collapse;background:#fff;border-radius:18px;overflow:hidden;border:1px solid var(--line)}.cp-table td{padding:12px 16px;border-bottom:1px solid var(--line)}.cp-table td:last-child{text-align:right;font-weight:700}.cp-table .tot td{background:var(--ink);color:#fff;font-size:1.1rem}
.cp-ul{display:grid;gap:10px}
.cobanner{background:var(--ink);color:#fff}.cobanner .wrap{display:grid;grid-template-columns:1.1fr 1.4fr;gap:28px;align-items:center;padding-top:48px;padding-bottom:48px}
.cobanner h2{color:#fff;font-size:clamp(1.7rem,3.2vw,2.6rem);line-height:1.05;margin:0 0 10px}.cobanner p{color:#C9D0D6}
.cobanner ol{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.cobanner li{background:#22303C;border-radius:16px;padding:14px}.cobanner li b{display:block;color:#fff}.cobanner li span{color:#AEB9C2;font-size:.88rem}
.indep{display:inline-flex;gap:6px;align-items:center;font-weight:700;font-size:.85rem;margin-left:10px}
@media (max-width:900px){.cp-grid,.cobanner .wrap{grid-template-columns:1fr}.cp-out{position:static}.cp-steps,.cobanner ol{grid-template-columns:1fr 1fr}.cp-ab{grid-template-columns:1fr}}
'''

CO_BAND = '''<section class="cobanner" aria-label="Agent copilot"><div class="wrap">
  <div><h2>Local people. AI copilot. Senior review.</h2><p>Kolaboro turns people who live where you're buying into reliable verifiers. The copilot tells them what to ask, what to check and when to call a notary.</p><a class="btn btn-hi" href="/copilot" data-ev="home_copilot">Try the copilot live</a></div>
  <ol><li><b>Learn</b><span>10 lessons and an exam</span></li><li><b>Copilot</b><span>Cross-checks every document</span></li><li><b>Review</b><span>A senior checks each report</span></li><li><b>Prove it</b><span>GPS-stamped evidence</span></li></ol>
</div></section>'''

R16_TEXT = [
  # verdict wording: evidence, not guarantees
  ('Advice: safe to pay · example', 'Advice: no red flags · example'),
  ('"Safe to pay" or "hold" advice', '"Go" or "hold" advice, based on the evidence'),
  ('"Safe to pay" advice is a recommendation', '"Go" advice is a recommendation'),
  ('Agents are paid the same whether the verdict is "safe to pay" or "hold".', 'Agents are paid the same whether the verdict is "go" or "hold".'),
  ("tells you whether it's safe to pay", 'tells you whether the evidence supports paying'),
  ('Milestone 3 report · safe to pay', 'Milestone 3 report · no red flags'),
  ('Milestone 2 verified, safe to pay', 'Milestone 2 verified, no red flags'),
  ('is safe to pay.', 'is supported by the evidence.'),
  ('Safe to pay instalment', 'The evidence supports paying instalment'),
  ('and a clear "safe to pay" or "hold"', 'and a clear "go" or "hold"'),
  ("Who tells you it's safe to pay", 'Who tells you whether to pay'),
  ("tells you if it's safe to pay", 'tells you if the evidence supports paying'),
  ('Is it safe to pay instalment', 'Can I pay instalment'),
  ('whether it is safe to pay', 'whether the evidence supports paying'),
  ('a verdict: safe to pay, safe with a condition, or hold', 'a verdict: go, go with a condition, or hold'),
  ('Safe to pay milestone', 'Go for milestone'),
  (': safe to pay', ': no red flags'),
  ("when it's safe to pay", 'whether the evidence supports paying'),
  ('"safe to pay"', '"go"'), ('Safe to pay', 'No red flags'), ('safe to pay', 'OK to pay, based on the evidence'),
  ('the buyer is told the next payment is safe', 'the buyer is told whether the evidence supports the next payment'),
  ('Advice: stop paying', 'Advice: pause payments'),
  # developers never pay
  ('€1,500 per project, then €200 a month for the live badge. Paying never changes your Score.', 'Free: developers never pay Kolaboro. Buyers fund every check.'),
  ('1.500 € por proyecto y 200 € al mes por el sello. Pagar nunca cambia tu nota.', 'Gratis: los promotores nunca pagan a Kolaboro.'),
  ('Paying for verification never changes your Score. That\'s exactly why buyers believe it.', 'Developers never pay us, so nobody can buy a Score. That\'s exactly why buyers believe it.'),
  ('Developers can pay to be verified, but paying never changes a Score: the evidence does', 'Developers never pay Kolaboro: the evidence sets every Score'),
  ('Developers can pay for verification, but payment never changes a Score: the evidence does', 'Developers never pay Kolaboro: the evidence sets every Score'),
  ('Developers: verification and a live Trust Score badge. Payment never changes the Score.', 'Developers: nothing. Developers never pay us; they can share documents for free.'),
  ('Paying never changes your Score: that\'s exactly why buyers believe it.', 'Developers never pay us: that\'s exactly why buyers believe it.'),
  ('Paying never changes your Score', 'Developers never pay us'),
  ('Safe-to-pay check before each payment', 'Go / hold check before each payment'),
  ("The buyer's side for people who buy property abroad. Watch the demo", "AI that turns local people into reliable property verifiers, starting with overseas buyers in Bali. Watch the demo"),
  ('<h2>The product, piece by piece</h2>', '<div class="cobanner" style="border-radius:22px;margin:0 0 28px"><div class="wrap" style="padding:28px"><div><h2>The core: the agent copilot</h2><p>A local without credentials pastes the case documents. The copilot lists every inconsistency word for word, what to ask for, what to measure on site and when to stop and call a notary. A senior reviews every report until the agent has 10 clean ones.</p><a class="btn btn-hi" href="/copilot">Run it live</a></div><ol><li><b>Learn</b><span>Academy + exam</span></li><li><b>Copilot</b><span>Cross-check + escalation</span></li><li><b>Review</b><span>Senior sign-off</span></li><li><b>Prove it</b><span>GPS + SHA-256</span></li></ol></div></div><h2>The product, piece by piece</h2>'),
  # nav
  ('<a href="/research">AI agent</a>', '<a href="/copilot">Copilot</a>'),
  ('<div><b>24</b><span>Bali projects our agent re-reads every week</span></div>', '<div><b>100%</b><span>of reports checked by a senior reviewer</span></div>'),
  ('<div><b>100%</b><span>refund if we can\'t take your case</span></div>', '<div><b>€0</b><span>paid by developers, ever</span></div>'),
  ('<li><a href="/research">Research agent</a></li>', '<li><a href="/copilot">Agent copilot</a></li>\n        <li><a href="/research">Research agent</a></li>\n        <li><a href="/independence">Independence</a></li>'),
]

DEV_FREE = '''<section class="sec alt" id="fees"><div class="wrap grid2">
  <div><h2>What it costs: nothing. Ever.</h2><p class="lead">Developers never pay Kolaboro. Buyers fund every check. That's why a good result from us means something.</p></div>
  <div class="grid2" style="gap:16px">
    <div class="tile hot"><h3>Share your documents</h3><p class="price">€0</p><p class="per">for every project</p><ul><li>Land certificate, permits, company documents</li><li>Our agent verifies them like any other evidence</li><li>You see the findings first and can reply</li><li>Listed as a recommended project when the evidence holds up</li></ul></div>
    <div class="tile"><h3>Why free?</h3><p>If developers paid us, buyers couldn't trust us. Read our <a href="/independence">independence rules</a>.</p></div>
  </div>
</div></section>'''

def r16_inject():
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(R16_CSS)
    import re as _re
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            if '/admin/' in p or '/portal/index' in p: pass
            for a, b in R16_TEXT: s = s.replace(a, b)
            if s != o: open(p, 'w').write(s)
    fp = os.path.join(OUT, 'developers', 'index.html'); s = open(fp).read()
    s = _re.sub(r'<section class="sec alt" id="fees">.*?</section>', DEV_FREE, s, count=1, flags=_re.S)
    open(fp, 'w').write(s)
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    s = s.replace('<p class="lead">A network of local agents who work for the buyer, never the seller. Trained by AI, proven on the ground, and backed by every buyer who came before you.</p>',
                  '<p class="lead">Local people who live where you\'re buying, turned into reliable property verifiers by our AI copilot. They work for the buyer, never the seller.</p>', 1)
    s = s.replace('<p class="launch"><i aria-hidden="true"></i>Bali now. Mexico next.', '<p class="launch"><i aria-hidden="true"></i>Bali now. <a href="/independence" class="indep">Developers never pay us</a> ·', 1)
    for k in ('Our own AI research agent', 'Not a promise. A pipeline'):
        if k in s:
            i = s.index(k); a = s.rfind('<section', 0, i); b = s.index('</section>', i) + 10
            s = s[:a] + (CO_BAND if k.startswith('Our own') else '') + s[b:]
    open(fp, 'w').write(s)
