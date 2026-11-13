# Round 3 pages. Executed inside build.py (shares its helpers).

DESTS = [
  dict(slug='dubai', name='Dubai', country='United Arab Emirates', status='waitlist',
    h1='Buying off-plan in Dubai, with someone on your side',
    lead="Dubai has some of the strongest buyer protections for off-plan property, but only if the project actually uses them. Here is what to check.",
    risks=[("Escrow", "Off-plan payments should go into the project's registered escrow account, not to the developer's normal account. Ask for the escrow account number and check it."),
           ("Registration", "The project and the developer should be registered with the Dubai Land Department and RERA, and your purchase registered on Oqood."),
           ("Delivery", "Handover dates slip. Check the developer's past projects and the real progress on site before each payment.")],
    checks=["Project registered with the Dubai Land Department and RERA", "Escrow account number in your contract, and payments made only to it",
            "Your purchase registered on Oqood", "Payment plan linked to construction progress", "Developer's past projects visited and handed over",
            "Service charges and resale rules understood"]),
  dict(slug='phuket', name='Phuket', country='Thailand', status='waitlist',
    h1='Buying property in Phuket as a foreigner',
    lead="Thailand lets foreigners own condos, not land. Most problems come from villa deals that try to get around that, and from off-plan delays.",
    risks=[("Land", "Foreigners can't own land in Thailand. Villas are usually sold as leaseholds; only the registered lease term is protected by law, not promised renewals."),
           ("Condo quota", "Foreigners can own condo units freehold within the building's foreign quota (up to 49% of the floor area). Check the quota is still open."),
           ("Money transfer", "Funds for a freehold condo must come from abroad in foreign currency, with the paperwork to prove it.")],
    checks=["Title deed type confirmed at the Land Office", "Foreign quota available in the building (condos)", "Lease registered at the Land Office for its full term (villas)",
            "Renewal promises in writing, knowing they may not be enforceable", "Building permit and environmental approval for the project", "Foreign transfer paperwork prepared"]),
  dict(slug='tulum', name='Tulum', country='Mexico', status='waitlist',
    h1='Buying property in Tulum without the usual surprises',
    lead="Tulum grew fast, and paperwork didn't always keep up. Before you buy, check how you'll hold the title and what the land really is.",
    risks=[("Restricted zone", "Near the coast, foreigners hold residential property through a bank trust (fideicomiso) or a Mexican company. Know which one you're getting."),
           ("Ejido land", "Communal ejido land can't simply be sold. It must be fully converted to private property first. Check the history of the title."),
           ("Permits", "Construction and environmental permits matter, especially near the jungle and the coast.")],
    checks=["Title checked by an independent notario público", "Land is private property, not ejido", "Fideicomiso or company structure explained in writing",
            "Construction licence and environmental approval for the project", "Water, power and road access confirmed", "Developer's finished projects visited"]),
  dict(slug='algarve', name='the Algarve', country='Portugal', status='waitlist',
    h1='Buying property in the Algarve from abroad',
    lead="Portugal lets foreigners buy property freely, which makes it simple to start and easy to skip the checks that matter.",
    risks=[("Registration", "Check the land registry certificate (certidão permanente) and the tax record (caderneta predial) match the property and the seller."),
           ("Licences", "A home needs a valid usage licence (licença de utilização). Extensions built without permission are common."),
           ("Off-plan", "Tie payments to construction stages and know what happens to your money if the developer stops.")],
    checks=["Portuguese tax number (NIF) in place", "Land registry certificate matches seller and property", "Usage licence for the home, or building licence for off-plan",
            "No debts or charges registered on the property", "Payments tied to construction stages", "Independent lawyer reviewed the promissory contract"]),
  dict(slug='lombok', name='Lombok', country='Indonesia', status='waitlist',
    h1='Buying land or a villa in Lombok',
    lead="Lombok follows the same rules as Bali, with more land that has never been properly registered. Title checks matter even more here.",
    risks=[("Unregistered land", "Some plots are sold on traditional ownership papers (girik) rather than a registered certificate. These carry much higher risk."),
           ("Foreign ownership", "Foreigners usually buy leasehold or through a foreign-owned company holding a right to build. See our guide to land titles."),
           ("Access and zoning", "Check road access, zoning and permits before paying for a plot, not after.")],
    checks=["Registered certificate, not only traditional papers", "Certificate checked at the land office by your notary", "Seller matches the certificate",
            "Zoning allows the use you plan", "Road access confirmed on the ground", "Lease length and extension terms in writing"]),
]

def dest_page(d):
    tiles = ''.join(f'<div class="tile"><h3>{t}</h3><p>{x}</p></div>' for t, x in d['risks'])
    cl = ''.join(f'<li><label><input type="checkbox"><span><b>{c}</b></span></label></li>' for c in d['checks'])
    body = phero(f'<a href="/destinations">Destinations</a> / {d["name"].replace("the ", "").capitalize() if d["name"].startswith("the ") else d["name"]}', d['h1'], d['lead'],
                 f'<div class="hero-cta"><a class="btn btn-hi" href="#start" data-ev="dest_waitlist_{d["slug"]}">Join the {d["name"].replace("the ", "")} waitlist</a><a class="btn btn-line" href="/checklist">Use the free checklist</a></div>')
    body += f'''<section class="sec"><div class="wrap"><h2>The three things that go wrong most</h2><div class="grid3" style="margin-top:32px">{tiles}</div></div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>Check these before you pay</h2><p class="lead">Tick them off as you go. This is general information, not legal advice: use an independent local lawyer or notary.</p></div>
  <ul class="cl">{cl}</ul>
</div></section>
<section class="start" id="start"><div class="wrap start-grid">
  <div><h2>Kolaboro in {d["name"]}</h2><p class="lead">We check off-plan projects here, as in any other country: the desk review and the official-register lookups run online, and the on-site visit is done by a local agent, confirmed for your location before your agent starts. Tell us about your purchase.</p></div>
  <div>{lead_form("destform", role="buyer", roles=("buyer", "agent"), source="yc-dest-" + d["slug"], button="Join the waitlist")}</div>
</div></section>'''
    js = f'<script>(function(){{var p=document.querySelector("#destform input[name=place]");if(p&&!p.value)p.value="{d["name"].replace("the ", "").capitalize() if d["name"].startswith("the ") else d["name"]}, {d["country"]}";}})();</script>'
    return page(f'/{d["slug"]}', f'Buying property in {d["name"].replace("the ", "the ")}: what to check | Kolaboro', d['lead'], body, extra_js=js, mcta=False)

def build_destinations():
    out = [dest_page(d) for d in DESTS]
    cards = '<a class="tile" href="/bali" style="text-decoration:none"><span class="tag">Live now</span><h3>Bali, Indonesia</h3><p>Local agents, checks and construction monitoring.</p></a>'
    cards += ''.join(f'<a class="tile" href="/{d["slug"]}" style="text-decoration:none"><span class="tag" style="background:#DCDAD3">Waitlist</span><h3>{d["name"].replace("the ", "The ")}, {d["country"]}</h3><p>{d["risks"][0][0]}, {d["risks"][1][0].lower()} and {d["risks"][2][0].lower()}: what to check.</p></a>' for d in DESTS)
    body = phero('Destinations', 'Where Kolaboro works', 'Off-plan checks in any country. Every destination page covers what goes wrong most and what to check.')
    body += f'<section class="sec"><div class="wrap grid3">{cards}</div></section>'
    out.append(page('/destinations', 'Destinations | Kolaboro', 'Kolaboro checks off-plan projects in any country. Buyer guides for Bali, Dubai, Phuket, Tulum, the Algarve and Lombok.', body))
    return out

def build_risk():
    body = phero('Tools', 'How much are you risking?', 'Off-plan buyers rarely add it up. Put in your payment plan and see how much money is exposed before the keys, and what a delay costs you.')
    body += '''<section class="sec"><div class="wrap calc">
  <form id="rk" onsubmit="return false" style="display:grid;gap:16px">
    <label class="f">Purchase price (€)<input name="price" inputmode="decimal" value="250000"></label>
    <label class="f">Already paid (€)<input name="paid" inputmode="decimal" value="75000"></label>
    <label class="f">Payments still due before handover (€)<input name="due" inputmode="decimal" value="150000"></label>
    <label class="f">Rental income you expect per month (€)<input name="rent" inputmode="decimal" value="1800"></label>
    <label class="f">Possible delay (months)<input name="delay" inputmode="decimal" value="9"><small class="ev">Delays of several months are common on off-plan projects. Use the developer's own track record if you know it.</small></label>
  </form>
  <div class="out" aria-live="polite">
    <p>Money exposed before you get the keys</p><div class="num" id="ex">–</div>
    <div class="row2"><span>Share of the price</span><b id="sh">–</b></div>
    <div class="row2"><span>Income lost if it's late</span><b id="lost">–</b></div>
    <div class="row2"><span>A Kolaboro check costs</span><b>€490</b></div>
    <div class="verd mid" id="rv">–</div>
    <a class="btn btn-hi" style="margin-top:16px" href="/#start" data-role="buyer" data-ev="risk_cta">Protect this money</a>
  </div>
</div></section>'''
    js = '''<script>
(function(){
  var f = document.getElementById('rk'), $ = function(i){ return document.getElementById(i); };
  var eur = new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
  function n(k){ var v = parseFloat(String(f[k].value).replace(',', '.')); return isNaN(v) ? 0 : v; }
  function calc(){
    var ex = n('paid') + n('due'), price = n('price'), lost = n('rent') * n('delay');
    $('ex').textContent = eur.format(ex); $('sh').textContent = price ? Math.round(ex / price * 100) + '%' : '–'; $('lost').textContent = eur.format(lost);
    var ratio = ex ? Math.round(ex / 490) : 0;
    $('rv').textContent = ex ? 'The money at stake is ' + ratio.toLocaleString('en') + ' times the cost of a check.' : 'Add your numbers.';
  }
  f.addEventListener('input', calc); calc();
})();
</script>'''
    return page('/tools/risk', 'Off-plan risk calculator | Kolaboro', 'See how much money is exposed before handover on an off-plan purchase and what a construction delay would cost you.', body, extra_js=js)

def build_survey():
    q = lambda name, label, opts: f'<fieldset class="f" style="border:0"><legend style="font-weight:700;margin-bottom:8px">{label}</legend><div class="opts">' + ''.join(
        f'<label class="opt"><input type="radio" name="{name}" value="{o}"><span>{o}</span></label>' for o in opts) + '</div></fieldset>'
    body = phero('Survey', 'What scares you about buying abroad?', 'Five quick questions. We publish the anonymous results so every buyer can see they are not alone.')
    body += f'''<section class="sec"><div class="wrap" style="max-width:820px">
<form id="sv" novalidate style="display:grid;gap:26px">
  {q('where', 'Where are you buying, or thinking of buying?', ['Bali or Lombok', 'Dubai', 'Thailand', 'Mexico', 'Portugal or Spain', 'Somewhere else'])}
  {q('before', 'Have you bought property abroad before?', ['Yes', 'No, this would be my first time'])}
  {q('fear', 'What worries you most?', ['The land or title is not what they say', 'Permits', 'Construction delays', 'Losing my money', 'The contract', 'Rental income below the promise'])}
  {q('pay', 'Would you pay for an independent check before buying?', ['Yes', 'Maybe', 'No'])}
  {q('price', 'How much would that check be worth to you?', ['Under €250', '€250 to €500', '€500 to €1,000', 'Over €1,000'])}
  <label class="f">Email (optional, to get the results)<input name="email" type="email" autocomplete="email" maxlength="200"></label>
  <label class="hp" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>
  <p class="err" id="sverr" role="alert"></p>
  <button class="btn btn-hi" type="submit" style="justify-self:start">Send answers</button>
</form>
<div class="ok" id="svok" role="status" tabindex="-1"><h3>Thank you.</h3><p>Your answers help us decide where to go next. <a href="/checklist">Try the 20-point checklist</a>.</p></div>
</div></section>'''
    js = '''<script>
(function(){
  var f = document.getElementById('sv'), err = document.getElementById('sverr'), t0 = Date.now();
  var URL_ = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X';
  f.addEventListener('submit', function(e){
    e.preventDefault(); err.textContent = '';
    var d = new FormData(f), g = function(k){ return String(d.get(k) || '').trim(); };
    if (!g('where') || !g('fear') || !g('pay')) { err.textContent = 'Answer at least where, what worries you and whether you would pay.'; return; }
    if (g('company') || Date.now() - t0 < 2500) { err.textContent = 'Something went wrong. Try again in a few seconds.'; return; }
    var em = g('email'); if (em && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(em)) { err.textContent = 'Check the email address, or leave it empty.'; return; }
    var anon = !em; if (anon) em = 'anon-survey-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) + '@kolaboro.com';
    var ans = ['where: ' + g('where'), 'before: ' + g('before'), 'fear: ' + g('fear'), 'pay: ' + g('pay'), 'price: ' + g('price')].join('\\n');
    fetch(URL_, { method:'POST', headers:{ apikey:KEY, Authorization:'Bearer '+KEY, 'Content-Type':'application/json' },
      body: JSON.stringify({ p_name: anon ? 'Survey (anonymous)' : 'Survey respondent', p_email: em, p_country: g('where'), p_phone:'', p_who: 'survey | ' + g('where'),
        p_bring: ans, p_learn: '', p_week: '', p_lang: 'en', p_source: 'yc-survey', p_plan: 'yc-survey' }) })
    .then(function(r){ return r.json(); }).then(function(x){
      if (x === 'ok' || x === 'too_many') { f.style.display = 'none'; var ok = document.getElementById('svok'); ok.style.display = 'block'; ok.focus(); if (window.kbEvent) kbEvent('survey_sent', { fear: g('fear') }); return; }
      throw new Error('x'); })
    .catch(function(){ err.textContent = 'Your answers could not be sent. Check your connection and try again.'; });
  });
})();
</script>'''
    return page('/survey', 'Buyer survey: what scares you about buying abroad? | Kolaboro', 'Five quick questions about buying property abroad. Anonymous results are published for every buyer to see.', body, extra_js=js, mcta=False)

ACADEMY = [
  ("How property is sold abroad", "Who's who: developer, agent, notary, lawyer, buyer. Where the incentives point."),
  ("Land titles and ownership", "Freehold, leasehold and company structures, and how to check a certificate.", "/guides/bali-land-titles"),
  ("Zoning and permits", "Reading a spatial plan, building approvals and rental licences."),
  ("Safe payment structures", "Milestones, deposits, escrow and the receipts that matter.", "/guides/off-plan-payments"),
  ("The site visit", "What to film, in what order, and how to prove where and when."),
  ("Reading construction progress", "Telling a finished milestone from a staged one."),
  ("Contracts for non-lawyers", "The clauses that protect buyers and the ones that don't."),
  ("Writing the report", "Clear findings, evidence for every claim and a verdict a buyer can act on."),
  ("Ethics and independence", "Why we never take money from sellers, and how to handle pressure."),
  ("Working with buyers", "Explaining risk calmly to someone thousands of kilometres away."),
]

def build_academy():
    items = ''
    for i, l in enumerate(ACADEMY, 1):
        link = f' <a href="{l[2]}">Read the free lesson</a>' if len(l) > 2 else ' <span class="ev">For trainees</span>'
        items += f'<li><span class="node" style="width:44px;height:44px;font-size:1rem">{i}</span><div><h3>{l[0]}</h3><p>{l[1]}{link}</p></div></li>'
    body = phero('Academy', 'The Kolaboro agent academy', 'Ten lessons that turn a sharp local into someone buyers abroad can trust. Each lesson ends with a real-case exercise reviewed by a senior agent.',
                 '<div class="hero-cta"><a class="btn btn-hi" href="/agents#start" data-ev="academy_apply">Apply as an agent</a></div>')
    body += f'<section class="sec"><div class="wrap" style="max-width:900px"><ol class="lessons">{items}</ol></div></section>'
    return page('/academy', 'Agent academy | Kolaboro', 'The ten lessons every Kolaboro agent completes: land titles, permits, safe payments, site visits, contracts, reporting and ethics.', body)

def build_corrections():
    body = phero('Corrections', 'Corrections and replies', 'When we get something wrong, we fix it and record it here. Developers can also reply on any project page.')
    body += '''<section class="sec"><div class="wrap prose">
<p><b>No corrections yet.</b> Every change to a published Trust Score will be listed here with the date, what changed and why.</p>
<h2>How to request a correction</h2>
<ol><li>Write to us with the project page link and what you think is wrong.</li><li>Attach the evidence: a document, a registry extract or a dated photo.</li><li>We reply within 10 working days. If the evidence holds, we update the page and log the change here.</li></ol>
<h2>Removal requests</h2>
<p>We remove personal data on request and correct factual errors. We don't remove accurate, evidenced findings because a project or developer would prefer them hidden; you can always add a public reply.</p>
</div></section>'''
    return page('/corrections', 'Corrections | Kolaboro', 'How Kolaboro corrects Trust Scores and handles developer replies and removal requests.', body)

def build_projects_data():
    # Public data file + embeddable badge. Only verified, non-fictional projects belong here; the sample is flagged.
    proj = [{"slug": "sample", "name": "Sample Residences", "place": "Canggu, Bali", "developer": "Sample Developer Ltd.",
             "score": SAMPLE_SCORE, "verified": "2026-10-21", "fictional": True, "url": SITE + "/score/sample/",
             "checks": [{"name": n, "weight": w, "score": v, "reason": why, "evidence": evd, "verified": d} for n, w, v, why, evd, d in DIMS]}]
    os.makedirs(os.path.join(OUT, 'data'), exist_ok=True)
    open(os.path.join(OUT, 'data', 'projects.json'), 'w').write(json.dumps({"updated": TODAY, "projects": proj}, ensure_ascii=False, indent=1))
    open(os.path.join(OUT, 'badge.js'), 'w').write('''/* Kolaboro Trust Score badge. Usage: <script src="https://kolaboro.com/badge.js" data-project="your-slug" async></script> */
(function(){
  var s = document.currentScript; if (!s) return; var slug = s.getAttribute('data-project');
  var box = document.createElement('a'); box.target = '_blank'; box.rel = 'noopener';
  box.style.cssText = 'display:inline-flex;align-items:center;gap:10px;font:600 13px/1.2 system-ui,sans-serif;color:#17212B;background:#fff;border:2px solid #17212B;border-radius:12px;padding:8px 12px;text-decoration:none';
  s.parentNode.insertBefore(box, s);
  fetch('https://kolaboro.com/data/projects.json').then(function(r){ return r.json(); }).then(function(d){
    var p = (d.projects || []).filter(function(x){ return x.slug === slug; })[0];
    if (!p) { box.textContent = 'Not yet verified by Kolaboro'; box.href = 'https://kolaboro.com/check'; return; }
    box.href = p.url;
    box.innerHTML = '<b style="font-size:22px">' + p.score + '</b><span>Kolaboro Trust Score<br><span style="font-weight:400;color:#59626B">verified ' + p.verified + '</span></span>';
  }).catch(function(){ box.textContent = 'Kolaboro Trust Score'; box.href = 'https://kolaboro.com/how-we-score'; });
})();
''')

def home_extras():
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    rows = [("Who checks the land title", "You, from abroad, or the seller's notary", "A local agent, at the registry"),
            ("How you know the work is done", "Photos the developer chooses", "GPS-stamped video, every milestone"),
            ("Who tells you it's safe to pay", "The developer's payment schedule", "Your agent, after checking on site"),
            ("What you know about the developer", "Their brochure", "Their Trust Score and past projects"),
            ("Who works for you", "No one", "Your Kolaboro agent, never paid by sellers")]
    t = ''.join(f'<tr><td>{a}</td><td>{b}</td><td><b>{c}</b></td></tr>' for a, b, c in rows)
    sec = f'''<section class="sec" id="compare"><div class="wrap">
  <h2 style="max-width:20ch">Buying alone vs. buying with Kolaboro</h2>
  <div class="prose" style="max-width:none;margin-top:28px"><table class="cmp"><thead><tr><th></th><th>Buying alone</th><th>With Kolaboro</th></tr></thead><tbody>{t}</tbody></table></div>
  <p style="margin-top:20px"><a href="/tools/risk" data-ev="home_risk">See how much money you have at risk</a></p>
</div></section>

'''
    s = s.replace('<section class="sec alt" id="pricing">', sec + '<section class="sec alt" id="pricing">', 1)
    open(fp, 'w').write(s)

def write_llms(paths):
    lines = ["# Kolaboro", "", "> Kolaboro is a network of local buyer's agents for overseas property. Agents are trained by AI, work only for the buyer, verify land titles, permits and developers, film every construction milestone with GPS-stamped video and tell buyers when each payment is safe. Kolaboro also publishes a 0-100 Trust Score for projects and developers. Checks off-plan projects in any country.", "",
             "## Key pages"]
    for p in paths:
        if p in ('/score/sample',) or p.endswith('.html'): continue
        lines.append(f"- [{OG_TITLES.get(ogname(p), p)}]({SITE}{p if p == '/' else p + '/'})")
    lines += ["", "## Facts", "- Prices: Kolaboro pre-purchase check EUR 490; construction monitoring EUR 99 per month; buyer's agent 1% of price, minimum EUR 2,000.",
              "- Agents are never paid by developers. Paying for verification never changes a Trust Score.",
              "- Kolaboro does not currently hold client money and does not give legal or financial advice."]
    open(os.path.join(OUT, 'llms.txt'), 'w').write('\n'.join(lines) + '\n')

def build_round3():
    out = build_destinations() + [build_risk(), build_survey(), build_academy(), build_corrections()]
    build_projects_data()
    home_extras()
    return out

def finish_round3(paths):
    write_llms(paths)
    open(os.path.join(HERE, 'og_titles.json'), 'w').write(json.dumps(OG_TITLES, ensure_ascii=False))
