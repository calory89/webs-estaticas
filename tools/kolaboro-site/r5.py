# Round 5: interactive demo, real tools, company pages.

def build_demo():
    steps = [("Agent assigned", "A verified Kolaboro agent in Canggu takes your case.", "2 min"),
             ("Land title checked", "Certificate confirmed at the land office. Seller matches the title.", "Day 1"),
             ("Zoning and permits", "Zone allows villas. Building approval found; rental licence still pending.", "Day 2"),
             ("Developer record", "6 past projects visited: 2 handed over on time.", "Day 3"),
             ("Site visit", "GPS-stamped video of milestone 3. Roof structure complete, 5 months late.", "Day 4"),
             ("Contract read", "Refund clause found. No penalty for late delivery.", "Day 5"),
             ("Report ready", "Trust Score 59. Safe to pay milestone 3 once you get the revised schedule in writing.", "Day 6")]
    lis = ''.join(f'<li class="dstep"><span class="dn">{i+1}</span><div><h3>{t}</h3><p>{d}</p></div><small>{w}</small></li>' for i, (t, d, w) in enumerate(steps))
    body = '<div class="banner">Interactive demo with <b>sample data</b>. No real project is checked here.</div>'
    body += phero('Demo', 'See a Kolaboro check in 30 seconds', "Type any project name and watch what happens between your request and your report.")
    body += f'''<section class="sec"><div class="wrap grid2">
  <div>
    <form class="qform light" id="dq" onsubmit="return false"><input id="dqi" placeholder="Type any project name" aria-label="Project name" value="Sample Residences, Canggu"><button class="btn btn-hi" type="submit">Run the demo</button></form>
    <p class="ev" style="margin-top:12px">Real checks take about 7 days. The demo runs them in seconds.</p>
    <div id="dfinal" class="verdict" style="display:none"><h3>Report ready for <span id="dname"></span></h3><p>Trust Score 59, caution band. Safe to pay milestone 3 with one condition.</p>
      <p style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-hi" href="/report/sample" data-ev="demo_report">Open the full report</a><a class="btn btn-line" href="/#start" data-role="buyer" data-ev="demo_cta">Get this for my property</a></p></div>
  </div>
  <ol class="dsteps" id="ds">{lis}</ol>
</div></section>'''
    js = '''<script>
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var f = document.getElementById('dq'), li = document.querySelectorAll('.dstep'), fin = document.getElementById('dfinal'), timers = [];
  f.addEventListener('submit', function(){
    timers.forEach(clearTimeout); timers = []; fin.style.display = 'none';
    li.forEach(function(l){ l.classList.remove('on', 'done'); });
    document.getElementById('dname').textContent = document.getElementById('dqi').value.trim() || 'your project';
    var gap = reduce ? 0 : 750;
    li.forEach(function(l, i){
      timers.push(setTimeout(function(){ if (i) li[i-1].classList.replace('on', 'done'); l.classList.add('on'); }, i * gap));
    });
    timers.push(setTimeout(function(){ li[li.length-1].classList.replace('on', 'done'); fin.style.display = 'block'; if (window.kbEvent) kbEvent('demo_completed'); }, li.length * gap));
    if (window.kbEvent) kbEvent('demo_started');
  });
})();
</script>'''
    return page('/demo', 'Demo: a Kolaboro check in 30 seconds', 'An interactive demo of a Kolaboro property check, from agent assignment to the final report and Trust Score.', body, extra_js=js)

def build_contract_scan():
    body = phero('Tools', 'Contract first pass', "Paste your purchase contract. In seconds you'll see which buyer protections are there and which are missing. It runs in your browser; nothing is uploaded.")
    body += '''<section class="sec"><div class="wrap calc">
  <div style="display:grid;gap:14px">
    <label class="f">Contract text<textarea id="ct" style="min-height:340px" placeholder="Paste the contract text here"></textarea></label>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-hi" id="cgo" type="button">Scan contract</button><button class="btn btn-line" id="csample" type="button">Try a sample</button></div>
    <p class="ev">A keyword-based first pass, not legal advice and not a full review. Always have an independent lawyer read your contract.</p>
  </div>
  <div class="out" aria-live="polite"><p>Buyer protections found</p><div class="num" id="cs">–</div><ul id="cl" style="list-style:none;display:grid;gap:10px;margin-top:14px"></ul>
    <a class="btn btn-hi" style="margin-top:18px" href="/#start" data-role="buyer" data-ev="contract_cta">Have an agent review it properly</a></div>
</div></section>'''
    js = r'''<script>
(function(){
  var RULES = [
    {k:'Payments tied to construction stages', good:/milestone|stage of construction|upon completion of|completion of the (foundation|structure|roof)/i},
    {k:'Delivery date stated', good:/delivery date|handover date|completion date|complet(ed|ion) (by|on|no later)/i},
    {k:'Penalty or compensation for late delivery', good:/penalt|liquidated damages|compensation for (the )?delay|late delivery/i},
    {k:'Refund if the project is not delivered', good:/\brefund(s|ed)?\b|reimburse|return (of )?(all )?(the )?(payments|monies|amounts)/i},
    {k:'Escrow or notary account for payments', good:/escrow|trust account|notary account|client account/i},
    {k:'Governing law and courts named', good:/governing law|jurisdiction|courts of|arbitration/i},
    {k:'Title or certificate identified', good:/certificate|title (no|number)|land title|hak |sertifikat|title deed/i},
    {k:'Permits or building approval mentioned', good:/permit|building approval|PBG|licen[cs]e|IMB/i}
  ];
  var FLAGS = [
    {k:'Seller can change the design, specs or price', re:/reserves? the right to (change|modify|amend|alter|vary)|may (change|modify|amend) the (design|specification|price)/i},
    {k:'Payments marked non-refundable', re:/non[- ]refundable/i},
    {k:'Price can increase', re:/price (adjustment|increase|escalation)|subject to (price )?increase/i},
    {k:'Broad force majeure (delays excused)', re:/force majeure[\s\S]{0,300}(any|all) (cause|reason|circumstance)/i},
    {k:'Payments to a person rather than a company', re:/pay(ment)?s? (shall be )?(made )?to mr\.?|personal (bank )?account/i}
  ];
  var SAMPLE = 'This Agreement is governed by the laws of Indonesia. The Buyer shall pay a non-refundable reservation fee. The Purchase Price shall be paid in instalments on the following dates. The Developer reserves the right to change the design and specifications. The Villa shall be completed by 30 June 2027. Land title: certificate HGB No. 1234.';
  function esc(s){ return s.replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
  function run(){
    var t = document.getElementById('ct').value, ul = document.getElementById('cl');
    if (t.trim().length < 40) { ul.innerHTML = '<li>Paste at least a few paragraphs of the contract.</li>'; document.getElementById('cs').textContent = '–'; return; }
    var found = 0, html = '';
    RULES.forEach(function(r){ var ok = r.good.test(t); if (ok) found++; html += '<li>' + (ok ? '<span class="st s-ok">Found</span> ' : '<span class="st s-warn">Missing</span> ') + esc(r.k) + '</li>'; });
    FLAGS.forEach(function(r){ if (r.re.test(t)) html += '<li><span class="st s-warn">Red flag</span> ' + esc(r.k) + '</li>'; });
    document.getElementById('cs').textContent = found + ' of ' + RULES.length; ul.innerHTML = html;
    if (window.kbEvent) kbEvent('contract_scan', { found: found });
  }
  document.getElementById('cgo').addEventListener('click', run);
  document.getElementById('csample').addEventListener('click', function(){ document.getElementById('ct').value = SAMPLE; run(); });
})();
</script>'''
    return page('/tools/contract-scan', 'Contract first pass for off-plan buyers | Kolaboro', 'Paste your property contract and see which buyer protections are present or missing. Runs in your browser; nothing is uploaded.', body, extra_js=js)

def build_payment_plan():
    body = phero('Tools', 'Is your payment plan safe?', 'Enter the payments in your contract. We flag the patterns that put most buyers at risk.')
    body += '''<section class="sec"><div class="wrap calc">
  <div>
    <div id="pp" style="display:grid;gap:10px"></div>
    <div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-line" id="ppadd" type="button">Add a payment</button></div>
  </div>
  <div class="out" aria-live="polite"><p>Your plan</p><div class="num" id="pps">–</div><ul id="ppl" style="list-style:none;display:grid;gap:10px;margin-top:14px"></ul>
    <a class="btn btn-hi" style="margin-top:18px" href="/#start" data-role="buyer" data-ev="payplan_cta">Get each milestone checked</a></div>
</div></section>'''
    js = r'''<script>
(function(){
  var box = document.getElementById('pp'), rows = [
    {l:'Reservation and deposit', p:30, t:'signing'}, {l:'Foundations', p:20, t:'milestone'}, {l:'Structure', p:20, t:'date'}, {l:'Roof', p:20, t:'date'}, {l:'Handover', p:10, t:'milestone'}];
  function draw(){
    box.innerHTML = '';
    rows.forEach(function(r, i){
      var d = document.createElement('div'); d.className = 'pprow';
      d.innerHTML = '<label class="f">Payment<input value="' + r.l.replace(/"/g,'&quot;') + '" data-i="'+i+'" data-k="l"></label>' +
        '<label class="f">% of price<input inputmode="decimal" value="' + r.p + '" data-i="'+i+'" data-k="p"></label>' +
        '<label class="f">Due on<select data-i="'+i+'" data-k="t"><option value="signing">Signing</option><option value="date">A calendar date</option><option value="milestone">A verified milestone</option></select></label>' +
        '<button class="btn btn-line btn-sm" type="button" data-del="'+i+'" aria-label="Remove payment">Remove</button>';
      box.appendChild(d); d.querySelector('select').value = r.t;
    });
    calc();
  }
  function calc(){
    var total = 0, dep = 0, dated = 0, last = rows.length ? rows[rows.length-1] : null, out = [];
    rows.forEach(function(r){ var p = parseFloat(r.p) || 0; total += p; if (r.t === 'signing') dep += p; if (r.t === 'date') dated++; });
    if (Math.abs(total - 100) > 0.5) out.push(['warn', 'Payments add up to ' + total + '%, not 100%.']);
    if (dep > 30) out.push(['warn', dep + '% is due at signing. Keep the deposit small: most of the risk is in what you pay before anything is built.']);
    else out.push(['ok', dep + '% at signing.']);
    if (dated) out.push(['warn', dated + (dated > 1 ? ' payments are' : ' payment is') + ' due on a date, not on progress. Ask to tie every payment to a verified milestone.']);
    else out.push(['ok', 'Every payment after signing is tied to progress.']);
    if (!last || last.t !== 'milestone' || (parseFloat(last.p) || 0) < 5) out.push(['warn', 'Keep at least 5% until handover and a final inspection.']);
    else out.push(['ok', (parseFloat(last.p) || 0) + '% kept until handover.']);
    var bad = out.filter(function(x){ return x[0] === 'warn'; }).length;
    document.getElementById('pps').textContent = bad ? bad + (bad > 1 ? ' risks' : ' risk') : 'Looks safe';
    document.getElementById('ppl').innerHTML = out.map(function(x){ return '<li><span class="st s-' + x[0] + '">' + (x[0] === 'ok' ? 'OK' : 'Risk') + '</span> ' + x[1] + '</li>'; }).join('');
  }
  box.addEventListener('input', function(e){ var i = e.target.dataset.i; if (i === undefined) return; rows[i][e.target.dataset.k] = e.target.value; calc(); });
  box.addEventListener('change', function(e){ var i = e.target.dataset.i; if (i === undefined) return; rows[i][e.target.dataset.k] = e.target.value; calc(); });
  box.addEventListener('click', function(e){ var d = e.target.dataset.del; if (d === undefined) return; rows.splice(+d, 1); draw(); });
  document.getElementById('ppadd').addEventListener('click', function(){ rows.push({l:'New payment', p:0, t:'milestone'}); draw(); });
  draw();
})();
</script>'''
    return page('/tools/payment-plan', 'Off-plan payment plan checker | Kolaboro', 'Enter your off-plan payment schedule and see the risks: large deposits, date-based payments and no retention until handover.', body, extra_js=js)

SELF_Q = [("Title and land", 15, "Is the land certificate in your company's name, and can a buyer verify it at the registry?"),
          ("Permits", 12, "Do you hold the building approval for this project, and the rental licence if buyers will rent?"),
          ("Delivery record", 15, "Did you hand over your past projects on the dates in the contracts?"),
          ("Progress vs. plan", 12, "Is this project on schedule today?"),
          ("Money safety", 14, "Do buyers pay only into your company account, ideally escrow, and only by milestone?"),
          ("Contract fairness", 10, "Does your contract include a delivery date with a penalty or refund?"),
          ("Transparency", 8, "Are your company, directors and registration easy to find?"),
          ("Buyer voice", 8, "Would your past buyers recommend you if we called them?"),
          ("Realistic promises", 6, "Are your advertised rental yields based on real booking data?")]

def build_self_check():
    qs = ''.join(f'<fieldset class="f exq" data-w="{w}" style="border:0"><legend style="font-weight:700;margin-bottom:8px">{i+1}. {q}</legend><div class="opts">'
                 + ''.join(f'<label class="opt"><input type="radio" name="s{i}" value="{v}"><span>{t}</span></label>' for t, v in (("Yes", 100), ("Partly", 50), ("No", 0)))
                 + '</div></fieldset>' for i, (n, w, q) in enumerate(SELF_Q))
    body = phero('<a href="/developers">Developers</a> / Self-check', 'Estimate your Trust Score in 2 minutes', 'Nine honest questions, the same weights we use. It shows where you stand before an agent ever visits.')
    body += f'''<section class="sec"><div class="wrap calc">
  <form id="sc" onsubmit="return false" style="display:grid;gap:22px">{qs}</form>
  <div class="out" aria-live="polite"><p>Estimated Trust Score</p><div class="num" id="scn">–</div><p id="scb" style="margin-top:6px">Answer the questions to see your estimate.</p>
    <p class="ev" style="color:#8A949E;margin-top:12px">A self-assessment, not a verified Score. Red flags found on site can cap the real Score.</p>
    <a class="btn btn-hi" style="margin-top:16px" id="scgo" href="/developers#start" data-ev="selfcheck_cta">Request verification</a></div>
</div></section>'''
    js = '''<script>
(function(){
  var f = document.getElementById('sc');
  f.addEventListener('change', function(){
    var qs = f.querySelectorAll('.exq'), sum = 0, wsum = 0, n = 0;
    qs.forEach(function(q, i){ var c = f.querySelector('input[name=s'+i+']:checked'); if (c) { n++; sum += +c.value * +q.dataset.w; wsum += +q.dataset.w; } });
    if (!n) return; var s = Math.round(sum / wsum);
    document.getElementById('scn').textContent = s;
    document.getElementById('scb').textContent = (s >= 80 ? 'Strong' : s >= 60 ? 'Good, with gaps' : s >= 40 ? 'Caution' : 'High risk') + (n < qs.length ? ' (' + n + ' of ' + qs.length + ' answered)' : '');
    document.getElementById('scgo').href = '/developers?project=' + encodeURIComponent('Self-check estimate ' + s) + '#start';
    if (n === qs.length && window.kbEvent) kbEvent('selfcheck_done', { score: s });
  });
})();
</script>'''
    return page('/developers/self-check', 'Developer self-check: estimate your Trust Score | Kolaboro', 'Developers: answer nine questions and estimate your Kolaboro Trust Score with the same weights our agents use.', body, extra_js=js, mcta=False)

def build_about():
    body = phero('About', 'Why Kolaboro exists', "Buying a home abroad should feel like buying one at home: you know what you're getting, and someone is on your side.")
    body += '''<section class="sec"><div class="wrap grid2">
  <div class="prose">
    <h2 style="margin-top:0">Our mission</h2>
    <p>Make it safe to buy property anywhere on Earth, by putting a trained local on the buyer's side of every deal and making every developer's track record public.</p>
    <h2>Why "Kolaboro"</h2>
    <p>It comes from collaborating. One buyer alone is easy to mislead. Thousands of buyers sharing what they found, through agents who work only for them, are not.</p>
    <h2>What we believe</h2>
    <ul><li><b>Evidence beats promises.</b> Every claim we make has a document, a video or a record behind it.</li>
      <li><b>Independence is the product.</b> Our agents are never paid by sellers.</li>
      <li><b>Expertise can be taught.</b> With AI, a sharp local can do work that used to need a room full of specialists.</li>
      <li><b>Honest developers deserve to win.</b> A public record rewards the ones who build what they sell.</li></ul>
  </div>
  <div>
    <div class="tile"><h3>Founders</h3><p style="font-weight:700;color:var(--ink);margin-top:6px">Carlos de Ory, CEO</p>
      <ul><li>Has sold over €15M of real estate to international buyers</li><li>11 years building online businesses in affiliate and performance marketing</li><li>Runs travel media with more than 400,000 followers</li><li>Started his career in talent acquisition at Robert Half and Kraft Heinz</li></ul>
      <p>Spanish, based in Denmark. Leads product, AI and growth.</p>
      <p style="font-weight:700;color:var(--ink);margin-top:18px">Lisa Mikolajewicz, co-founder</p>
      <ul><li>10 years in recruiting, hiring and managing teams</li><li>Leads how we find, vet and train local agents in every new city</li><li>Leads partnerships with developers</li></ul>
      <p>Danish, based in Denmark. Carlos and Lisa met at the hackathons for entrepreneurs he organizes.</p></div>
    <div class="note-box" style="margin-top:20px"><b>Want to help build this?</b> We're looking for local agents in Bali and Mexico, and for investors. <a href="/investors">Talk to us</a></div>
  </div>
</div></section>'''
    return page('/about', 'About Kolaboro', "Kolaboro's mission, beliefs and founders: making it safe to buy property anywhere on Earth.", body)

def build_roadmap():
    cols = [("Now", ["Bali launch: first verified projects", "Recruiting and training our first agents", "Pre-purchase checks and construction monitoring", "Public Trust Score method"]),
            ("Next", ["Online payment for checks and monitoring", "Buyer dashboard with every video and report", "AI contract review", "Agent app for GPS-stamped site visits", "Developer reply panel"]),
            ("Later", ["Milestone escrow with licensed partners", "New cities: Dubai, Phuket, Tulum, the Algarve, Lombok", "Trust Score API for portals and lenders", "Annual state of overseas property trust report"])]
    html_ = ''.join(f'<div class="tile"><span class="tag"{" style=\"background:#DCDAD3\"" if c != "Now" else ""}>{c}</span><ul>' + ''.join(f'<li>{x}</li>' for x in items) + '</ul></div>' for c, items in cols)
    body = phero('Roadmap', "What we're building", 'Our public roadmap. Buyers and agents shape it: tell us what you need most.',
                 '<div class="hero-cta"><a class="btn btn-line" href="/changelog">See what we shipped</a><a class="btn btn-hi" href="/survey">Tell us what you need</a></div>')
    body += f'<section class="sec"><div class="wrap grid3">{html_}</div></section>'
    return page('/roadmap', 'Roadmap | Kolaboro', "Kolaboro's public roadmap: what we're building now, next and later.", body)

CHANGELOG = [("28 Oct 2026", ["Kolaboro Research Agent: our own AI agent, built on Claude, tracks what Bali developers advertise", "Bali now, Mexico next", "Share any tool result as an image"]),
             ("28 Oct 2026", ["Agent pay and developer fees published, with an earnings estimator", "Agent recruitment page in Bahasa Indonesia", "Guides: 20 questions to ask a developer, and seven contract clauses that protect buyers", "Cookie choice for visitors in Europe"]),
             ("27 Oct 2026", ["Two-step form, role-specific benefits and a fix for the role buttons on mobile", "Spanish home page", "Full agent academy with ten lessons and an entry exam", "Interactive demo, contract first pass, payment plan checker and developer self-check", "About, roadmap, press kit and glossary"]),
             ("27 Oct 2026", ["Five destination guides: Dubai, Phuket, Tulum, the Algarve and Lombok", "Off-plan risk calculator and buyer survey", "Embeddable Trust Score badge and public projects data file"]),
             ("27 Oct 2026", ["Trust Score method with nine weighted checks and red-flag caps", "Sample project page and sample inspection report", "Pricing, FAQ and the 20-point checklist"]),
             ("27 Oct 2026", ["kolaboro.com launched"])]

def build_changelog():
    html_ = ''.join(f'<li><span class="dot d-ok"></span><div><b>{d}</b><ul>' + ''.join(f'<li>{x}</li>' for x in items) + '</ul></div></li>' for d, items in CHANGELOG)
    body = phero('Changelog', 'What we shipped', 'Every improvement to Kolaboro, newest first.')
    body += f'<section class="sec"><div class="wrap prose"><ol class="clog">{html_}</ol></div></section>'
    return page('/changelog', 'Changelog | Kolaboro', 'Every improvement shipped to Kolaboro, newest first.', body)

def build_press():
    body = phero('Press', 'Press kit', 'Logos, a short description and how to reach us.')
    body += f'''<section class="sec"><div class="wrap grid2">
  <div class="prose">
    <h2 style="margin-top:0">Kolaboro in one line</h2><p>Kolaboro is a network of AI-trained local agents who work only for property buyers abroad, verifying land, permits and construction, and publishing a Trust Score for every project and developer.</p>
    <h2>Longer description</h2><p>Buying property in another country usually means trusting photos and promises. Kolaboro puts a trained local agent on the buyer's side: they check the land title and permits, film every construction milestone with GPS- and time-stamped video, and tell the buyer when each payment is safe. Every check feeds a public Trust Score that rewards developers who deliver. Kolaboro is launching in Bali.</p>
    <h2>Contact</h2><p><a href="mailto:{CONTACT}">{CONTACT}</a></p>
  </div>
  <div>
    <div class="tile"><h3>Logo</h3><div style="display:flex;gap:16px;align-items:center;margin:16px 0"><span class="brand" style="font-size:1.6rem">{LOGO}kolaboro</span></div>
      <p><a href="/k/logo.svg" download>Logo (SVG)</a> · <a href="/k/logo.png" download>Logo (PNG)</a> · <a href="/k/favicon.svg" download>Icon (SVG)</a></p></div>
    <div class="tile" style="margin-top:20px"><h3>Colours</h3><p>Concrete #E3E2DD · Ink #17212B · Hi-vis orange #FF5B14 · Verified green #0B7A55</p><p style="margin-top:8px">Typeface: Archivo.</p></div>
  </div>
</div></section>'''
    os.makedirs(os.path.join(OUT, 'k'), exist_ok=True)
    open(os.path.join(OUT, 'k', 'logo.svg'), 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 40"><g transform="translate(2,4)"><path d="M8 4v24M8 16 23 6.5M8 16l15 9.5" fill="none" stroke="#17212B" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="6" r="3.4" fill="#17212B"/><circle cx="24" cy="26" r="3.4" fill="#17212B"/><circle cx="8" cy="16" r="4.2" fill="#FF5B14"/></g><text x="42" y="29" font-family="Archivo, Arial Black, sans-serif" font-weight="800" font-size="26" letter-spacing="-0.8" fill="#17212B">kolaboro</text></svg>')
    return page('/press', 'Press kit | Kolaboro', 'Kolaboro press kit: description, logos, colours and contact.', body)

GLOSSARY = [
 ("Buyer's agent", "An agent who represents the buyer, not the seller, and is never paid by the seller."),
 ("Off-plan", "Buying a property before it is built, usually paying in stages during construction."),
 ("Milestone payment", "A payment due when a stage of construction is finished, rather than on a calendar date."),
 ("Escrow", "An account held by a third party that releases money only when agreed conditions are met."),
 ("Retention", "Part of the price kept back until handover and a final inspection."),
 ("Snagging", "The inspection at handover that lists defects the developer must fix."),
 ("Trust Score", "Kolaboro's 0 to 100 rating of a project or developer, built from nine evidence-based checks."),
 ("Leasehold", "The right to use land or a property for a set number of years under a lease."),
 ("Freehold", "Full ownership of land or a property without a time limit."),
 ("Hak Milik (SHM)", "Indonesian freehold title, available only to Indonesian citizens."),
 ("Hak Guna Bangunan (HGB)", "Indonesian right to build and own buildings on land for a renewable term; can be held by Indonesian companies, including foreign-owned ones."),
 ("Hak Pakai", "Indonesian right to use land for a renewable term, which foreigners who meet the rules can hold."),
 ("PT PMA", "A foreign-owned limited company in Indonesia."),
 ("PPAT", "In Indonesia, the land deed official (often a notary) who registers land transactions."),
 ("PBG", "Persetujuan Bangunan Gedung: Indonesian building approval."),
 ("SLF", "Sertifikat Laik Fungsi: Indonesian certificate that a finished building is fit for use."),
 ("Zoning", "The official plan that says what land may be used for."),
 ("Oqood", "Dubai's system for registering off-plan property sales."),
 ("RERA", "Dubai's Real Estate Regulatory Agency."),
 ("Foreign quota (Thailand)", "The share of a condo building's floor area, up to 49%, that foreigners can own freehold."),
 ("Fideicomiso", "A Mexican bank trust that lets foreigners hold residential property near the coast or borders."),
 ("Ejido", "Communal land in Mexico that cannot be sold privately until it is converted to private property."),
 ("NIF", "Portuguese tax number, needed to buy property."),
 ("Certidão permanente", "Portuguese land registry certificate for a property."),
 ("Rental yield", "Yearly rental income as a percentage of the purchase price; net yield subtracts costs."),
]

def build_glossary():
    items = ''.join(f'<div class="gl" id="{re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")}"><dt>{t}</dt><dd>{d}</dd></div>' for t, d in sorted(GLOSSARY, key=lambda x: x[0].lower()))
    body = phero('Glossary', 'Glossary for buying property abroad', 'The words developers, notaries and agents use, explained in one line each.')
    body += f'<section class="sec"><div class="wrap"><dl class="glossary">{items}</dl></div></section>'
    ld = [{"@context": "https://schema.org", "@type": "DefinedTermSet", "name": "Kolaboro glossary", "hasDefinedTerm": [{"@type": "DefinedTerm", "name": t, "description": d} for t, d in GLOSSARY]}]
    return page('/glossary', 'Glossary for buying property abroad | Kolaboro', 'Leasehold, HGB, escrow, Oqood, fideicomiso and more: property-buying terms explained in one line each.', body, extra_ld=ld)

def build_pricing():
    rows = [("Title and zoning verified", "✓", "✓", "✓"), ("Permits and developer record", "✓", "✓", "✓"), ("Contract read for red flags", "✓", "✓", "✓"),
            ("Monthly GPS-stamped site visit", "", "✓", "✓"), ("Safe-to-pay check before each payment", "", "✓", "✓"), ("Handover inspection", "", "✓", "✓"),
            ("Shortlist of verified projects", "", "", "✓"), ("Negotiation support", "", "", "✓")]
    t = ''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>' for a, b, c, d in rows)
    body = phero('Pricing', 'Pricing', 'Paid by buyers, never by developers. Launch prices for Bali.')
    body += f'''<section class="sec"><div class="wrap">{PRICING}
  <div class="prose" style="max-width:none;margin-top:48px"><h2>What's included</h2><table><thead><tr><th></th><th>Check €490</th><th>Monitoring €99/mo</th><th>Buyer's agent 1%</th></tr></thead><tbody>{t}</tbody></table></div>
</div></section>
<section class="sec alt"><div class="wrap grid2"><div><h2>Pricing questions</h2></div>{faq_html()}</div></section>'''
    return page('/pricing', 'Pricing | Kolaboro', 'Kolaboro prices: pre-purchase check €490, construction monitoring €99 a month, buyer\'s agent 1% with a €2,000 minimum.', body, extra_ld=[FAQ_LD])

def round5_home():
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    s = s.replace('<p class="launch"><i aria-hidden="true"></i>Launching city by city. Bali first.</p>',
                  '<p class="launch"><i aria-hidden="true"></i>Launching city by city. Bali first. <a href="/demo" data-ev="hero_demo">See a 30-second demo</a></p>', 1)
    open(fp, 'w').write(s)

def build_round5():
    out = [build_demo(), build_contract_scan(), build_payment_plan(), build_self_check(), build_about(), build_roadmap(),
           build_changelog(), build_press(), build_glossary(), build_pricing()]
    round5_home()
    # link developers page to the self-check
    fp = os.path.join(OUT, 'developers', 'index.html'); s = open(fp).read()
    s = s.replace('<a class="btn btn-line" href="/how-we-score">See the method</a>', '<a class="btn btn-line" href="/developers/self-check" data-ev="devs_selfcheck">Estimate your Score</a>', 1)
    open(fp, 'w').write(s)
    return out
