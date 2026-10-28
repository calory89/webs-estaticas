#!/usr/bin/env python3
"""Builds kolaboro.com static pages into ./out (served from _s/kolaboro.com/)."""
import os, json, re, shutil, html as H

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
SITE = 'https://kolaboro.com'
TODAY = '2026-10-27'
ENTITY = 'Equinox Investment Group LLC, 30 N Gould St Ste N, Sheridan, WY 82801, USA'
CONTACT = 'carlos@equinoxinvestmentgroup.com'

LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4v24M8 16 23 6.5M8 16l15 9.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="6" r="3.4" fill="currentColor"/><circle cx="24" cy="26" r="3.4" fill="currentColor"/><circle cx="8" cy="16" r="4.2" fill="#FF5B14"/></svg>'

GA = ('<script async src="https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V"></script>'
      '<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};gtag(\'js\',new Date());gtag(\'config\',\'G-FJKJE77K4V\');</script>')
CLARITY = ('<script>if(!window.clarity)(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};'
           't=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})'
           '(window,document,"clarity","script","z4eqcmaic7");</script>')

OG_TITLES = {}
def ogname(path):
    return (path.strip('/').replace('/', '-').replace('.html', '') or 'home')

def head(title, desc, path, extra_ld=None, noindex=False):
    OG_TITLES[ogname(path)] = title.split(' | ')[0]
    url = SITE + (path if (path == '/' or path.endswith('.html')) else path.rstrip('/') + '/')
    ld = [{"@context": "https://schema.org", "@type": "Organization", "name": "Kolaboro", "url": SITE + "/",
           "logo": SITE + "/k/favicon.svg", "description": "A network of local buyer's agents for overseas property, trained by AI and proven on the ground."}]
    if extra_ld: ld += extra_ld
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{H.escape(title)}</title>
<meta name="description" content="{H.escape(desc)}">
{'<meta name="robots" content="noindex">' if noindex else ''}
<link rel="canonical" href="{url}">
<link rel="icon" href="/k/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#17212B">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kolaboro">
<meta property="og:title" content="{H.escape(title)}">
<meta property="og:description" content="{H.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/k/og/{ogname(path)}.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}/k/og/{ogname(path)}.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/k/site.css?v=6">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
{GA}
</head>'''

NAV = [('/#how', 'How it works'), ('/how-we-score', 'Trust Score'), ('/check', 'Check a project'),
       ('/agents', 'Become an agent'), ('/developers', 'Developers')]

def header(cta_href='/#start'):
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in NAV)
    return f'''<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav" id="top">
  <div class="wrap nav-in">
    <a class="brand" href="/" aria-label="Kolaboro home">{LOGO}kolaboro</a>
    <div class="nav-right">
      <a class="btn btn-hi btn-sm nav-cta-m" href="{cta_href}" data-role="buyer" data-ev="cta_nav_mobile">Protect my purchase</a>
      <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="menu"><svg viewBox="0 0 20 20"><path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>
    </div>
    <nav class="links" id="menu" aria-label="Main">
      {links}
      <a class="btn btn-hi btn-sm" href="{cta_href}" data-role="buyer" data-ev="cta_nav">Protect my purchase</a>
    </nav>
  </div>
</header>'''

def footer(mcta=True, mcta_href='/#start'):
    m = f'<div class="mcta"><a class="btn btn-hi" href="{mcta_href}" data-role="buyer" data-ev="cta_sticky">Protect my purchase</a></div>' if mcta else ''
    return f'''{m}
<footer>
  <div class="wrap">
    <div class="fgrid">
      <div>
        <a class="brand" href="/" aria-label="Kolaboro home" style="font-size:1.15rem">{LOGO}kolaboro</a>
        <p style="margin-top:12px;max-width:34ch">Local agents who work for the buyer, never the seller. Launching city by city, Bali first.</p>
        <form class="news" data-news novalidate><label for="nl-email">Monthly: projects that slipped, projects that delivered.</label>
          <div class="qform light" style="margin-top:10px"><input id="nl-email" name="email" type="email" placeholder="Your email" autocomplete="email"><button class="btn btn-hi btn-sm" type="submit">Subscribe</button></div>
          <p class="nmsg" aria-live="polite"></p></form>
      </div>
      <div><h4>Buyers</h4><ul>
        <li><a href="/check">Check a project</a></li>
        <li><a href="/demo">30-second demo</a></li>
        <li><a href="/pricing">Pricing</a></li>
        <li><a href="/report/sample">Sample inspection report</a></li>
        <li><a href="/checklist">Before-you-sign checklist</a></li>
        <li><a href="/tools/yield-check">Rental yield check</a></li>
        <li><a href="/tools/risk">How much are you risking?</a></li>
        <li><a href="/tools/payment-plan">Payment plan checker</a></li>
        <li><a href="/tools/contract-scan">Contract first pass</a></li>
        <li><a href="/destinations">Destinations</a></li></ul></div>
      <div><h4>Trust Score</h4><ul>
        <li><a href="/how-we-score">How we score</a></li>
        <li><a href="/score/sample">Sample project page</a></li>
        <li><a href="/developers">For developers</a></li>
        <li><a href="/guides/bali-land-titles">Guide: land titles</a></li>
        <li><a href="/guides/off-plan-payments">Guide: safe payments</a></li>
        <li><a href="/guides/questions-to-ask-a-developer">20 questions for developers</a></li>
        <li><a href="/guides/contract-clauses">Contract clauses to ask for</a></li>
        <li><a href="/corrections">Corrections</a></li>
        <li><a href="/glossary">Glossary</a></li>
        <li><a href="/developers/self-check">Developer self-check</a></li></ul></div>
      <div><h4>Kolaboro</h4><ul>
        <li><a href="/agents">Become an agent</a></li>
        <li><a href="/academy">Agent academy</a></li>
        <li><a href="/survey">Buyer survey</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/roadmap">Roadmap</a></li>
        <li><a href="/changelog">Changelog</a></li>
        <li><a href="/press">Press</a></li>
        <li><a href="/investors">Investors</a></li>
        <li><a href="/legal/privacy">Privacy</a></li>
        <li><a href="/legal/terms">Terms</a></li>
        <li><a href="#top">Back to top</a></li></ul></div>
    </div>
    <p class="fine">© 2026 Kolaboro, operated by {ENTITY}. Kolaboro agents provide independent verification and information, not legal, tax or financial advice. Trust Scores are opinions based on the evidence listed on each page.</p>
  </div>
</footer>
<script src="/k/site.js?v=5" defer></script>
{CLARITY}'''

def page(path, title, desc, body, extra_ld=None, noindex=False, mcta=True, extra_js=''):
    doc = head(title, desc, path, extra_ld, noindex) + '\n' + header() + f'\n<main id="main">\n{body}\n</main>\n' + footer(mcta) + extra_js + '\n</body>\n</html>\n'
    rel = path.strip('/')
    fp = os.path.join(OUT, rel, 'index.html') if rel else os.path.join(OUT, 'index.html')
    if path.endswith('.html'): fp = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w').write(doc)
    return path

def lead_form(fid, role='buyer', roles=('buyer', 'agent', 'developer'), source='yc-home', button='Send'):
    names = {'buyer': "I'm buying", 'agent': 'I want to be an agent', 'developer': "I'm a developer", 'investor': "I'm an investor"}
    seg = ''
    if len(roles) > 1:
        seg = '<div class="seg" role="radiogroup" aria-label="I am">' + ''.join(
            f'<label><input type="radio" name="role" value="{r}"{" checked" if r == role else ""}><span>{names[r]}</span></label>' for r in roles) + '</div>'
    else:
        seg = f'<input type="hidden" name="role" value="{roles[0]}">'
    return f'''<form id="{fid}" data-lead data-default-role="{role}" data-source="{source}" novalidate>
  {seg}
  <div class="perk perk-buyer"><b>What you get:</b> the land title, permits and developer checked by a local agent, GPS-stamped video before every payment, and a clear "safe to pay" or "hold". From €490.</div>
  <div class="perk perk-agent"><b>What you earn:</b> a fee for every inspection and report you deliver, plus a share of the buyer's agent fee on every purchase you work on. Paid by Kolaboro, never by developers. Free AI training, no degree needed. <a href="/agents">How agents work</a></div>
  <div class="perk perk-developer"><b>What you get:</b> an independent Trust Score page, a live "Verified by Kolaboro" badge for your website and listings, and visibility to international buyers who check projects on Kolaboro. Paying never changes your Score. <a href="/developers">How verification works</a></div>
  <div class="perk perk-investor"><b>We reply personally</b> with our deck and latest numbers.</div>
  <div class="two">
    <label class="f">Name<input name="name" autocomplete="name" maxlength="120" required><small class="fe"></small></label>
    <label class="f">Email<input name="email" type="email" autocomplete="email" maxlength="200" required><small class="fe"></small></label>
  </div>
  <button class="btn btn-hi step-next" type="button">Continue</button>
  <div class="step2">
  <div class="two">
    <label class="f"><span data-l="place">Where are you buying?</span><input name="place" maxlength="120" required><small class="fe"></small></label>
    <label class="f"><span data-l="project">Project name or link</span><input name="project" maxlength="300"><small class="fe"></small></label>
  </div>
  <fieldset class="quiz"><legend>Three quick questions for agents</legend>
    <label class="f">Do you live in this city full-time?<select name="q_live"><option value="">Choose</option><option>Yes</option><option>Part of the year</option><option>No</option></select></label>
    <label class="f">Your background<select name="q_bg"><option value="">Choose</option><option>Real estate</option><option>Construction or engineering</option><option>Law or notary office</option><option>Hospitality or tourism</option><option>Something else</option></select></label>
    <label class="f">Languages you speak<input name="q_lang" maxlength="120" placeholder="e.g. English, Indonesian, Russian"></label>
  </fieldset>
  <label class="f">Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="40"></label>
  <label class="f"><span data-l="msg">What stage are you at, and what worries you most?</span><textarea name="msg" maxlength="2000" required></textarea><small class="fe"></small></label>
  <label class="hp" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>
  <label class="consent"><input type="checkbox" name="consent" required><span>I agree that Kolaboro can contact me by email about this request. See our <a href="/legal/privacy">privacy policy</a>.</span></label>
  <p class="err" role="alert"></p>
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><button class="btn btn-hi" type="submit">{button}</button><span class="saved" aria-live="polite"></span></div>
  </div>
</form>
<div class="ok" role="status" tabindex="-1">
  <h3>Sent. We'll be in touch.</h3>
  <p>We reply by email within two working days. While you wait:</p>
  <ul>
    <li><a href="/report/sample">See what a Kolaboro inspection report looks like</a></li>
    <li><a href="/checklist">Go through the 20-point before-you-sign checklist</a></li>
    <li><a href="/tools/yield-check">Check if a promised rental yield is realistic</a></li>
  </ul>
</div>'''

def check_bar():
    return '''<section class="checkbar" aria-label="Check a project">
  <div class="wrap checkbar-in">
    <div><h2>Check any project before you pay.</h2><p>Type a project or developer. If we've verified it, you'll see its Trust Score. If not, we'll check it for you.</p></div>
    <form class="qform" data-check role="search"><label class="hp" for="q1">Project</label><input id="q1" name="q" placeholder="Project name, developer or link" aria-label="Project name, developer or link"><button class="btn btn-hi" type="submit">Check project</button></form>
  </div>
</section>'''

def dial(n, size=96, r=40, sw=9, cls='dial'):
    c = round(2 * 3.14159 * r, 1)
    return (f'<div class="{cls}" data-dial="{n}"><svg viewBox="0 0 {size} {size}"><circle cx="{size/2}" cy="{size/2}" r="{r}" fill="none" stroke="#DCDAD3" stroke-width="{sw}"/>'
            f'<circle class="arc" cx="{size/2}" cy="{size/2}" r="{r}" fill="none" stroke="#FF5B14" stroke-width="{sw}" stroke-linecap="round" stroke-dasharray="{c}" stroke-dashoffset="{c}"/></svg><b>0</b></div>')

DIMS = [
    ("Title and land", 15, 92, "Certificate checked at the land registry; seller matches the title", "Registry extract, notary letter", "2026-10-02"),
    ("Permits", 12, 70, "Building permit issued; licence for rentals still pending", "Building approval (PBG) copy", "2026-10-02"),
    ("Delivery record", 15, 38, "2 of 6 past projects handed over on time", "Site visits to 6 past projects, buyer records", "2026-09-18"),
    ("Progress vs. plan", 12, 45, "Milestone 3 verified on site, 5 months behind schedule", "GPS-stamped site video, 14 photos", "2026-10-21"),
    ("Money safety", 14, 55, "Payments go to the contracting company, but no escrow", "Payment receipts from 4 buyers", "2026-10-10"),
    ("Contract fairness", 10, 60, "Refund clause included; no penalty for late delivery", "Contract review by Kolaboro AI + agent", "2026-09-30"),
    ("Transparency", 8, 72, "Named directors and registered company; accounts not public", "Company registry extract", "2026-09-30"),
    ("Buyer voice", 8, 48, "Mixed verified reviews from 31 buyers; 2 open complaints", "Verified buyer survey", "2026-10-15"),
    ("Realistic promises", 6, 35, "Advertised rental yield is double the local average", "Yield check vs. local rental data", "2026-10-12"),
]
SAMPLE_SCORE = round(sum(w * v for _, w, v, *_ in DIMS) / 100)

def score_rows(full=False):
    out = '<div class="rows">'
    for n, w, v, why, evd, d in DIMS:
        warn = ' class="warn"' if v < 50 else ''
        extra = f'<p class="ev"><b>Evidence:</b> {evd} · verified {d} · weight {w}%</p>' if full else ''
        out += f'<div class="row"><span>{n}</span><b>{v}</b><div class="bar"><i{warn} style="width:{v}%"></i></div><small>{why}</small>{extra}</div>'
    return out + '</div>'

FAQ = [
    ("Who pays Kolaboro?", "Buyers pay for checks and monitoring. Developers can pay to be verified, but paying never changes a Score: the evidence does. Agents never take money from developers."),
    ("Is Kolaboro a lawyer or a notary?", "No. Kolaboro agents verify facts on the ground and in documents and tell you what they found. For legal advice and to sign, use an independent lawyer or notary; we can tell you what to ask them."),
    ("Do you hold my money?", "Not yet. Today your agent confirms each milestone on site and tells you whether it's safe to pay. Milestone escrow with licensed partners is on our roadmap."),
    ("Where do you work?", "We are launching in Bali first and adding cities as we train local agents. If you are buying somewhere else, tell us where: demand decides the next city."),
    ("How is the Trust Score calculated?", "Nine checks, from land title to realistic promises, each scored 0 to 100 and weighted. Red flags cap the total, and every point links to its evidence. The full method is public."),
    ("Can a developer change their Score?", "Only with evidence. Developers can add documents and reply publicly. Where data is missing, the page says so instead of guessing."),
    ("What if I already bought?", "That's when monitoring matters most. We can verify where construction really is before your next payment."),
]

def faq_html():
    return '<div class="faq">' + ''.join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQ) + '</div>'

FAQ_LD = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}

PRICING = '''<div class="grid3">
  <div class="tile"><h3>Pre-purchase check</h3><p>Before you sign or send a deposit.</p><p class="price">€490</p><p class="per">one-off, per property</p>
    <ul><li>Title and zoning verified</li><li>Permits and developer track record</li><li>Contract read for red flags</li><li>Site visit with GPS video</li><li>Written report in 7 days</li></ul>
    <a class="btn btn-line" href="/#start" data-role="buyer" data-ev="pricing_check">Book a check</a></div>
  <div class="tile hot"><span class="tag">Most chosen</span><h3>Construction monitoring</h3><p>From first payment to keys.</p><p class="price">€99</p><p class="per">per month, per property</p>
    <ul><li>Monthly GPS-stamped site visit</li><li>Milestone check before every payment</li><li>"Safe to pay" or "hold" advice</li><li>Delay alerts by email</li><li>Final handover inspection</li></ul>
    <a class="btn btn-hi" href="/#start" data-role="buyer" data-ev="pricing_monitor">Start monitoring</a></div>
  <div class="tile"><h3>Buyer's agent</h3><p>Someone on your side for the whole purchase.</p><p class="price">1%</p><p class="per">of the price, minimum €2,000</p>
    <ul><li>Everything in the check and monitoring</li><li>Shortlist of verified projects</li><li>Negotiation support</li><li>Coordinates your notary and lawyer</li><li>Never paid by the developer</li></ul>
    <a class="btn btn-line" href="/#start" data-role="buyer" data-ev="pricing_agent">Talk to us</a></div>
</div>'''

def build_home():
    src = open(os.path.join(HERE, 'home_main.html')).read()
    m = src
    # inspection card links to sample report
    m = m.replace('<p class="example">Illustrative example</p>', '<p class="example"><a href="/report/sample" data-ev="hero_sample_report">Illustrative example · open the sample report</a></p>')
    # hero CTA events
    m = m.replace('<a class="btn btn-hi" href="#start" data-role="buyer">Protect my purchase</a>\n        <a class="btn btn-line" href="#start" data-role="agent">Become an agent</a>',
                  '<a class="btn btn-hi" href="#start" data-role="buyer" data-ev="cta_hero">Protect my purchase</a>\n        <a class="btn btn-line" href="/agents" data-ev="cta_hero_agent">Become an agent</a>')
    # check bar right after hero
    m = m.replace('<section class="problem">', check_bar() + '\n\n<section class="problem">', 1)
    # score card: dial -> generic + links
    m = re.sub(r'<div class="dial"><svg viewBox="0 0 96 96">.*?</svg><b id="dialNum">0</b></div>', dial(SAMPLE_SCORE), m, flags=re.S)
    m = re.sub(r'      <div class="rows">.*?      </div>\n(?=      <p class="note">)', score_rows() + '\n', m, flags=re.S)
    m = m.replace('<p class="note">Illustrative example with a fictional developer and made-up data.</p>',
                  '<p class="note">Illustrative example with a fictional developer and made-up data. <a href="/score/sample" data-ev="score_sample">Open the full project page</a> · <a href="/how-we-score">How we score</a></p>')
    # agents/devs buttons to their pages
    m = m.replace('<a class="btn btn-line" href="#start" data-role="agent">Apply as an agent</a>', '<a class="btn btn-line" href="/agents" data-ev="home_agents">See how agents work</a>')
    m = m.replace('<a class="btn btn-line act" href="#start" data-role="developer">Get verified</a>', '<a class="btn btn-line act" href="/developers" data-ev="home_devs">Get verified</a>')
    # pricing + faq before founder
    m = m.replace('<section class="founder" id="why">', f'''<section class="sec alt" id="pricing">
  <div class="wrap">
    <h2>Simple prices. Paid by you, never by the developer.</h2>
    <p class="lead">Launch prices for Bali. A €490 check is a small cost next to a deposit you can't get back.</p>
    <div style="margin-top:44px">{PRICING}</div>
  </div>
</section>

<section class="sec" id="faq">
  <div class="wrap grid2">
    <div><h2>Questions buyers ask us</h2><p class="lead">Straight answers, including what we don't do.</p></div>
    {faq_html()}
  </div>
</section>

<section class="founder" id="why">''', 1)
    m = m.replace('<a class="btn" href="#start" data-role="buyer">Protect my purchase</a>', '<a class="btn" href="#start" data-role="buyer" data-ev="cta_finale">Protect my purchase</a>')
    # form -> shared lead form
    a = m.index('<form id="form"'); b = m.index('</div>\n  </div>\n</section>', a)
    m = m[:a] + lead_form('form') + '\n    ' + m[b:]
    m = m.replace('<main>', '').replace('</main>', '')
    script = '''<script>
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clock = document.getElementById('clock');
  function tick(){ var d = new Date(Date.now() + 8*3600e3); clock.textContent = d.toISOString().slice(11,19) + ' WITA'; }
  tick(); setInterval(tick, 1000);
  var lis = document.querySelectorAll('#steps li'), pill = document.getElementById('pill'),
      stamp = document.getElementById('stamp'), lat = document.getElementById('lat'),
      scan = document.getElementById('scan'), m3 = document.getElementById('m3');
  var fLat = -8.64781, fLon = 115.13852;
  function done(){ lis.forEach(function(l){ l.classList.remove('busy'); l.classList.add('done'); });
    m3.textContent = 'Roof structure'; pill.textContent = 'Safe to pay'; pill.classList.add('safe'); stamp.classList.add('on');
    document.querySelector('svg.site').classList.add('built');
    lat.textContent = fLat.toFixed(5) + ', ' + fLon.toFixed(5); }
  if (reduce) { done(); return; }
  var t0 = performance.now();
  (function jitter(now){ var k = Math.min(1,(now-t0)/1100), j = (1-k)*0.02;
    lat.textContent = (fLat + (Math.random()-.5)*j).toFixed(5) + ', ' + (fLon + (Math.random()-.5)*j).toFixed(5);
    if (k < 1) requestAnimationFrame(jitter); })(t0);
  setTimeout(function(){ lis[0].classList.add('done'); }, 500);
  setTimeout(function(){ lis[1].classList.add('done'); }, 900);
  setTimeout(function(){ lis[2].classList.add('busy'); m3.textContent = 'Roof structure, checking on site';
    if (scan.animate) scan.animate([{top:'8%',opacity:0},{top:'12%',opacity:1},{top:'88%',opacity:1},{top:'92%',opacity:0}],{duration:1500,easing:'ease-in-out'}); }, 1300);
  setTimeout(done, 2900);
})();
</script>'''
    return page('/', "Kolaboro: never buy property abroad alone",
                "Kolaboro is a network of local agents who work for the buyer, never the seller. They verify the deal, film every construction milestone on site and tell you when each payment is safe.",
                m, extra_ld=[FAQ_LD], extra_js=script)

def phero(crumb, h1, lead, cta=''):
    c = f'<p class="crumb"><a href="/">Kolaboro</a> / {crumb}</p>' if crumb else ''
    return f'<section class="phero"><div class="wrap">{c}<h1>{h1}</h1><p class="lead">{lead}</p>{cta}</div></section>'

def build_check():
    body = phero('Check a project', 'Check a project before you pay a cent.',
                 "Tell us the project or developer. If we've verified it, you'll see its Trust Score. If we haven't yet, a local agent will check it for you.")
    body += '''<section class="sec"><div class="wrap grid2">
  <div>
    <form class="qform light" id="cq" role="search" onsubmit="return false"><input id="cqi" name="q" placeholder="Project name, developer or link" aria-label="Project name, developer or link"><button class="btn btn-hi" type="submit" id="cqb">Check project</button></form>
    <div id="cres" style="margin-top:28px" aria-live="polite"></div>
  </div>
  <div class="note-box"><b>What a check covers.</b> Title and land, permits, the developer's delivery record, progress on site, where your money goes, the contract, transparency, what other buyers say and whether the promised returns are realistic. <a href="/how-we-score">See the method</a>.</div>
</div></section>
<section class="sec alt" id="start" hidden><div class="wrap grid2">
  <div><h2>Request a verification</h2><p class="lead">We'll look for it in our records and reply within two working days with what we know and what a full check would cost.</p></div>
  <div>''' + lead_form('checkform', role='buyer', roles=('buyer',), source='yc-check', button='Request verification') + '''</div>
</div></section>'''
    js = '''<script>
(function(){
  var KNOWN = { 'sample residences': '/score/sample', 'sample developer': '/score/sample' };
  var f = document.getElementById('cq'), i = document.getElementById('cqi'), out = document.getElementById('cres'), sec = document.getElementById('start');
  function esc(s){ return s.replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function run(q){
    q = (q||'').trim(); if (!q) { i.focus(); return; }
    var hit = KNOWN[q.toLowerCase()];
    if (hit) { out.innerHTML = '<div class="tile"><h3>We have a page for this project</h3><p>Open its Trust Score and the evidence behind every point.</p><p style="margin-top:14px"><a class="btn btn-hi" href="'+hit+'">Open Trust Score</a></p></div>'; return; }
    out.innerHTML = '<div class="tile"><h3>We haven\\u2019t scored \\u201c'+esc(q)+'\\u201d yet.</h3><p>That doesn\\u2019t mean it\\u2019s good or bad: it means nobody independent has checked it. Request a verification and a local agent will look at it.</p><p style="margin-top:14px"><a class="btn btn-hi" href="#start" id="goreq">Request a verification</a></p></div>';
    sec.hidden = false;
    var pf = document.querySelector('#checkform input[name=project]'); if (pf && !pf.value) pf.value = q;
    var mf = document.querySelector('#checkform textarea[name=msg]'); if (mf && !mf.value) mf.value = 'Please verify this project before I pay: ' + q;
    if (window.kbEvent) kbEvent('check_result_unscored', { q: q.slice(0,80) });
  }
  f.addEventListener('submit', function(){ run(i.value); history.replaceState(null, '', '/check?q=' + encodeURIComponent(i.value.trim())); });
  var q = new URLSearchParams(location.search).get('q'); if (q) { i.value = q; run(q); }
})();
</script>'''
    return page('/check', 'Check a property project | Kolaboro', 'Check any off-plan project or developer before you pay. See its Trust Score or ask a local Kolaboro agent to verify it.', body, extra_js=js, mcta=False)

def site_svg():
    return ('<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"><g fill="none" stroke="#17212B" stroke-width="3" stroke-linejoin="round">'
            '<path d="M70 230 L200 262 L330 222 L200 196 Z" fill="#B3A68E" stroke="#5c5244" stroke-width="2"/><path d="M95 228 V128 M200 254 V146 M305 224 V126 M200 200 V112"/>'
            '<path d="M95 128 L200 146 L305 126 L200 112 Z" fill="rgba(23,33,43,.10)"/><path d="M95 178 L200 200 L305 176"/><path d="M95 128 L200 70 L305 126 M200 70 V112"/></g></svg>')

def build_report():
    rows = [("Foundations", "Complete", "ok", "Matches plan dimensions"), ("Structure and walls", "Complete", "ok", "Columns and beams as drawn"),
            ("Roof structure", "Complete", "ok", "Timber frame installed, covering pending"), ("Electrical first fix", "Not started", "warn", "Scheduled for milestone 4"),
            ("Pool shell", "Not started", "warn", "Excavation only")]
    t = ''.join(f'<tr><td>{a}</td><td><span class="st s-{c}">{b}</span></td><td>{d}</td></tr>' for a, b, c, d in rows)
    ph = ''.join(f'<figure>{site_svg()}<figcaption>Photo {i} (illustration) · -8.64781, 115.13852 · 21 Oct 2026 10:{14+i*3} WITA</figcaption></figure>' for i in range(1, 7))
    body = '<div class="banner">This is a <b>fictional sample report</b> to show what buyers receive. Names, places and data are made up.</div>'
    body += phero('Sample report', 'Site inspection report', 'This is what you get before every payment: what was promised, what our agent found on site, and whether it is safe to pay.',
                  '<div class="hero-cta no-print"><button class="btn btn-line" onclick="window.print()">Print or save as PDF</button><a class="btn btn-hi" href="/#start" data-role="buyer" data-ev="report_cta">Get this for my property</a></div>')
    body += f'''<section class="sec"><div class="wrap"><article class="report">
  <h2 style="font-size:clamp(1.6rem,3vw,2.2rem)">Villa 7, Sample Residences, Canggu</h2>
  <div class="rmeta">
    <div><span>Report</span>KB-BAL-0001 (sample)</div><div><span>Inspection date</span>21 Oct 2026</div>
    <div><span>Agent</span>Verified agent, Bali (sample)</div><div><span>Milestone checked</span>3 of 6, roof structure</div>
  </div>
  <h3>Findings on site</h3>
  <div class="prose" style="max-width:none"><table><thead><tr><th>Item</th><th>Status</th><th>Notes</th></tr></thead><tbody>{t}</tbody></table></div>
  <h3 style="margin-top:22px">GPS-stamped photos</h3>
  <div class="photos">{ph}</div>
  <h3>Against the contract</h3>
  <div class="prose" style="max-width:none"><ul>
    <li>Contract says milestone 3 is due by 31 May 2026. Verified complete on 21 Oct 2026: <b>about 5 months late</b>.</li>
    <li>The contract has no penalty for late delivery. Ask the developer for a written revised schedule before paying.</li>
    <li>Payment 3 (€48,000) is due to the contracting company's account. The account holder matches the contract.</li>
  </ul></div>
  <div class="verdict"><h3>Safe to pay milestone 3, with one condition</h3><p>The work for this milestone exists and matches the plans. Pay once the developer sends the revised schedule in writing. We will check milestone 4 on site before your next payment.</p></div>
  <p class="ev" style="margin-top:18px">Kolaboro gives independent verification and information, not legal or financial advice.</p>
</article></div></section>'''
    return page('/report/sample', 'Sample site inspection report | Kolaboro', 'See a sample Kolaboro inspection report: milestone status, GPS-stamped photos, contract check and a clear safe-to-pay verdict.', body)

def build_score():
    dims = ''.join(f'''<div class="tile" style="padding:20px 22px"><div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><h3 style="font-size:1.1rem">{n}</h3><b style="font-stretch:125%;font-size:1.4rem">{v}</b></div>
<div class="bar" style="height:10px;border-radius:6px;background:#DCDAD3;overflow:hidden;margin:10px 0"><i style="display:block;height:100%;width:{v}%;background:{'var(--hivis)' if v < 50 else 'var(--ink)'}"></i></div>
<p>{why}</p><p class="ev"><b>Evidence:</b> {evd}. Verified {d}. Weight {w}%.</p></div>''' for n, w, v, why, evd, d in DIMS)
    ms = [("Contract signed", "Jan 2025", "ok", "On time"), ("Foundations", "Sep 2025", "ok", "On time"), ("Structure and walls", "Feb 2026", "late", "2 months late"),
          ("Roof structure", "Oct 2026", "late", "5 months late"), ("Finishes", "Planned Mar 2027", "", "Not started"), ("Handover", "Planned Jun 2027", "", "Not started")]
    tl = ''.join(f'<li><span class="dot {('d-'+c) if c else ''}"></span><span>{a}</span><small>{b} · {d}</small></li>' for a, b, c, d in ms)
    body = '<div class="banner">This is a <b>fictional sample page</b>. Real project pages look like this once a project has been verified.</div>'
    body += f'''<section class="phero"><div class="wrap">
  <p class="crumb"><a href="/">Kolaboro</a> / <a href="/how-we-score">Trust Score</a> / Sample Residences</p>
  <div class="scorehead">{dial(SAMPLE_SCORE, 150, 62, 14, 'bigdial')}
    <div><h1 style="font-size:clamp(2.2rem,4.6vw,3.8rem)">Sample Residences, Canggu</h1>
      <p class="lead" style="margin-top:12px">By Sample Developer Ltd. · 12 villas, off-plan · last verified 21 Oct 2026</p>
      <p style="margin-top:12px"><span class="band">Caution: verify before each payment</span></p></div>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <h2>The nine checks</h2><p class="lead">Every number links to the evidence our agents collected. Bars in orange are below 50.</p>
  <div class="grid3" style="margin-top:36px">{dims}</div>
</div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>Construction timeline</h2><p class="lead">Promised dates against what our agents verified on site.</p><ol class="timeline">{tl}</ol></div>
  <div><h2>Developer's reply</h2><p class="lead">Developers can answer every check publicly and add documents.</p>
    <div class="reply">"The roof milestone was delayed by the rainy season and a supplier issue. We have sent buyers a revised schedule and expect handover in Q2 2027." <br><small class="ev">Sample Developer Ltd., 23 Oct 2026 (fictional)</small></div>
    <div class="note-box" style="margin-top:28px"><b>Buying here?</b> Get every milestone checked before you pay. <a href="/#start" data-role="buyer">Start monitoring</a></div>
  </div>
</div></section>'''
    return page('/score/sample', 'Sample Trust Score page | Kolaboro', 'A sample Kolaboro project page: nine trust checks with evidence, the construction timeline and the developer\'s reply.', body, noindex=True)

def build_method():
    w = ''.join(f'<tr><td>{n}</td><td>{wt}%</td><td>{evd}</td></tr>' for n, wt, v, why, evd, d in DIMS)
    body = phero('Trust Score', 'How the Trust Score works', 'One number from 0 to 100 for every project and developer, built on proof instead of marketing. Here is exactly how we calculate it.')
    body += f'''<section class="sec"><div class="wrap prose">
<h2>Nine checks, weighted</h2>
<p>Each check is scored 0 to 100 by a trained local agent, using the evidence listed. The total is the weighted average.</p>
<table><thead><tr><th>Check</th><th>Weight</th><th>Typical evidence</th></tr></thead><tbody>{w}</tbody></table>
<h2>Red flags cap the Score</h2>
<p>Some problems matter more than everything else. When we find one, the total can't go above a ceiling, however good the rest looks.</p>
<table><thead><tr><th>Red flag</th><th>Maximum Score</th></tr></thead><tbody>
<tr><td>Land title can't be verified, or the seller isn't the title holder</td><td>40</td></tr>
<tr><td>Payments requested to a personal account or a company that isn't in the contract</td><td>45</td></tr>
<tr><td>No building permit for work already under way</td><td>50</td></tr>
<tr><td>Land zoning doesn't allow the use being sold (for example, villas on agricultural land)</td><td>50</td></tr>
<tr><td>Open court case against the developer about the project</td><td>60</td></tr>
</tbody></table>
<h2>What the number means</h2>
<table><thead><tr><th>Score</th><th>Band</th><th>What we suggest</th></tr></thead><tbody>
<tr><td>80 to 100</td><td>Strong</td><td>Normal care. Keep checking milestones.</td></tr>
<tr><td>60 to 79</td><td>Good, with gaps</td><td>Fix the gaps in the contract before paying.</td></tr>
<tr><td>40 to 59</td><td>Caution</td><td>Verify on site before every payment.</td></tr>
<tr><td>0 to 39</td><td>High risk</td><td>Don't pay until the red flags are resolved.</td></tr>
</tbody></table>
<h2>Our rules</h2>
<ul>
<li><b>Evidence or nothing.</b> Every point links to a registry document, a GPS-stamped site video, a contract review or a verified buyer record.</li>
<li><b>Not enough data, no Score.</b> If we can't verify enough, the page says "insufficient data" instead of guessing.</li>
<li><b>Fresh data.</b> Every check shows the date it was verified. Projects under construction are re-checked at least every 90 days.</li>
<li><b>Right of reply.</b> Developers see findings before they are published, have 10 working days to respond, and can reply publicly at any time.</li>
<li><b>Corrections.</b> If we get something wrong, we fix it and note the change on the page.</li>
</ul>
<h2>Independence</h2>
<p>Developers can pay for verification, but payment never changes a Score: the evidence does. Kolaboro agents are never paid by developers, never earn commission on sales and must declare any personal link to a project.</p>
<h2>Conflicts of interest</h2>
<p>Projects connected to Kolaboro's founders or team are scored with the same method, reviewed by a second agent and labelled "founder-connected" on their page.</p>
<div class="note-box" style="margin-top:30px"><b>See it in practice.</b> <a href="/score/sample">Open a sample project page</a> or <a href="/check">check a project</a>.</div>
</div></section>'''
    return page('/how-we-score', 'How the Kolaboro Trust Score works', 'The Kolaboro Trust Score rates property projects from 0 to 100 across nine weighted checks, with red-flag caps, evidence for every point and a right of reply.', body)

def build_agents():
    body = phero('Agents', "Become a Kolaboro agent. No law degree needed.",
                 "You live where people are buying. Our AI trains you case by case to verify land, permits and construction for buyers abroad, and every case you complete builds a public track record.",
                 '<div class="hero-cta"><a class="btn btn-hi" href="#start" data-ev="agents_apply">Apply as an agent</a></div>')
    body += '''<section class="sec"><div class="wrap grid3">
  <div class="tile"><h3>What you do</h3><p>Visit sites, film milestones with GPS-stamped video, collect documents and write clear reports, with the AI guiding every step.</p></div>
  <div class="tile"><h3>How you earn</h3><p>A fee for every inspection and report, and a share of buyer's agent fees once you're verified. You are paid by Kolaboro, never by developers.</p></div>
  <div class="tile"><h3>How you grow</h3><p>Trainee, then verified agent, then city lead. Your record is public and it's yours: the cases you closed and what buyers said.</p></div>
</div></section>
<section class="agents" style="padding-top:clamp(56px,8vw,100px)"><div class="wrap">
  <h2 style="max-width:18ch">From trainee to city lead</h2>
  <ol class="ladder">
    <li class="rung"><span class="lvl">Start here</span><h3>Trainee</h3><p>Learn with your AI coach and shadow real inspections. Your first reports are reviewed line by line.</p></li>
    <li class="rung" style="padding-top:64px"><span class="lvl">After your first verified cases</span><h3>Verified agent</h3><p>Protect your own buyers, earn on every inspection and build your public record.</p></li>
    <li class="rung" style="padding-top:104px"><span class="lvl">For the best</span><h3>City lead</h3><p>Lead your city, train your team and build your own community of agents.</p></li>
  </ol>
</div></section>
<section class="sec"><div class="wrap grid2">
  <div><h2>Our code</h2><p class="lead">Buyers trust Kolaboro because every agent follows the same rules.</p></div>
  <div class="prose"><ol>
    <li>You work for the buyer. Never take money, gifts or commission from a developer or seller.</li>
    <li>Declare any personal link to a project before you take the case.</li>
    <li>Report what you see, not what anyone wants to hear.</li>
    <li>Every claim needs evidence: a document, a photo or a video with location and time.</li>
    <li>Say "I don't know" when you don't. We never guess.</li>
    <li>Keep buyers' data private.</li>
    <li>A senior agent reviews every report before it's sent.</li>
    <li>Breaking these rules ends your work with Kolaboro.</li>
  </ol></div>
</div></section>
<section class="start" id="start"><div class="wrap start-grid">
  <div><h2>Apply in two minutes</h2><p class="lead">We are recruiting our first agents in Bali. Tell us about you and we'll reply within two working days.</p></div>
  <div>''' + lead_form('agentform', role='agent', roles=('agent',), source='yc-agents', button='Apply as an agent') + '''</div>
</div></section>'''
    return page('/agents', 'Become a Kolaboro agent', 'Join Kolaboro as a local agent: verify land, permits and construction for international property buyers. AI training, public track record, no law degree needed.', body, mcta=False)

def build_devs():
    body = phero('Developers', 'Honest developers sell faster to buyers abroad.',
                 "Buyers abroad can't tell you apart from the developers who never build. A verified Kolaboro Trust Score lets them.",
                 '<div class="hero-cta"><a class="btn btn-hi" href="#start" data-ev="devs_apply">Get verified</a><a class="btn btn-line" href="/how-we-score">See the method</a></div>')
    body += '''<section class="sec"><div class="wrap grid2">
  <div class="prose">
    <h2 style="margin-top:0">How verification works</h2>
    <ol>
      <li>You share your land title, permits, contract template and company documents.</li>
      <li>A local agent checks them with the registry and visits your site.</li>
      <li>You see the findings and have 10 working days to respond or add evidence.</li>
      <li>Your project page goes live with its Trust Score and your reply.</li>
      <li>We re-check every 90 days while you build, so your Score keeps up with your progress.</li>
    </ol>
    <p><b>Paying for verification never changes your Score.</b> That's exactly why buyers believe it.</p>
  </div>
  <div>
    <div class="tile"><h3>Show your Score where buyers decide</h3><p>Put the live badge on your website, brochures and listings. It links to your public page with the evidence.</p>
      <div style="margin-top:18px" class="badge">''' + LOGO.replace('<svg', '<svg width="30" height="30"') + '''<b>82</b><span>Verified by Kolaboro<br>Trust Score · example</span></div>
      <p class="ev" style="margin-top:14px">Badge shown as an example. Real badges update automatically.</p></div>
  </div>
</div></section>
<section class="start" id="start"><div class="wrap start-grid">
  <div><h2>Request verification</h2><p class="lead">Tell us about your project. We'll reply with what we need and the timeline.</p></div>
  <div>''' + lead_form('devform', role='developer', roles=('developer',), source='yc-developers', button='Request verification') + '''</div>
</div></section>'''
    return page('/developers', 'Get your project verified | Kolaboro for developers', 'Get an independent Kolaboro Trust Score for your property project and show international buyers the evidence behind it.', body, mcta=False)

def build_investors():
    body = phero('Investors', 'The trust layer for buying property abroad.',
                 'Kolaboro turns local people into AI-trained buyer\'s agents and turns every inspection into a public trust record of projects and developers.')
    body += '''<section class="sec"><div class="wrap prose">
<h2 style="margin-top:0">The problem</h2>
<p>People buy homes in other countries without seeing the land, the permits or the construction. The developer has lawyers, salespeople and local knowledge. The buyer has a PDF. Fear of exactly this stops many more people from buying at all.</p>
<h2>Why now</h2>
<ul>
<li><b>Remote buying is normal.</b> Video calls, e-signatures and international transfers made buying property from another country routine.</li>
<li><b>AI makes expertise cheap to train.</b> A sharp local with an AI coach can do verification work that used to need a lawyer, a surveyor and an engineer.</li>
<li><b>Proof is cheap to capture.</b> Every phone records tamper-evident, location- and time-stamped video.</li>
</ul>
<h2>What we sell</h2>
<ul>
<li><b>Buyers:</b> pre-purchase checks, construction monitoring and a buyer's agent fee.</li>
<li><b>Developers:</b> verification and a live Trust Score badge. Payment never changes the Score.</li>
<li><b>Data:</b> developer and project trust data for banks, insurers and property portals.</li>
<li><b>Payments (roadmap):</b> milestone escrow with licensed partners, released when our agent verifies the work.</li>
</ul>
<h2>Why it compounds</h2>
<p>Every buyer we protect adds evidence to the Trust Score. A better Score attracts honest developers and more buyers, and every agent we train opens a new city without opening an office.</p>
<h2>Go-to-market</h2>
<p>Bali first, where foreign demand is strong and buyers' doubts are well known. Then the cities buyers ask for. Our founder has sold over €15M of real estate to international buyers and runs travel media with more than 400,000 followers, which gives us a direct line to the people who buy abroad.</p>
<h2>Talk to us</h2>
<p>If you invest in marketplaces, proptech, fintech or the future of work, we'd like to hear from you.</p>
</div></section>
<section class="start" id="start"><div class="wrap start-grid">
  <div><h2>Investor contact</h2><p class="lead">We reply to every message personally.</p></div>
  <div>''' + lead_form('invform', role='investor', roles=('investor',), source='yc-investors', button='Send') + '''</div>
</div></section>'''
    return page('/investors', 'Investors | Kolaboro', 'Kolaboro is building the trust layer for buying property abroad: AI-trained local buyer\'s agents and a public Trust Score for every project.', body, mcta=False)

def build_yield():
    body = phero('Tools', 'Is that rental yield realistic?',
                 "Developers often advertise yields that only work with full occupancy and no costs. Put in the numbers and see the yield after real costs.")
    body += '''<section class="sec"><div class="wrap calc">
  <form id="yc" onsubmit="return false" style="display:grid;gap:16px">
    <label class="f">Purchase price (€)<input name="price" inputmode="decimal" value="250000"></label>
    <label class="f">Nightly rate you expect (€)<input name="rate" inputmode="decimal" value="180"></label>
    <label class="f">Occupancy (% of nights booked)<input name="occ" inputmode="decimal" value="60"><small class="ev">Many established villa markets average well below 80%. Ask the developer for real booking data.</small></label>
    <label class="f">Management and booking fees (% of revenue)<input name="mgmt" inputmode="decimal" value="25"></label>
    <label class="f">Other yearly costs (€): maintenance, utilities, staff, tax<input name="costs" inputmode="decimal" value="9000"></label>
    <label class="f">Yield the developer advertises (%)<input name="adv" inputmode="decimal" value="15"></label>
  </form>
  <div class="out" aria-live="polite">
    <p>Net yield after costs</p><div class="num" id="ny">–</div>
    <div class="row2"><span>Revenue per year</span><b id="rev">–</b></div>
    <div class="row2"><span>Fees and costs</span><b id="cst">–</b></div>
    <div class="row2"><span>Net income</span><b id="net">–</b></div>
    <div class="verd" id="vd">–</div>
    <p class="ev" style="color:#8A949E;margin-top:14px">Simple estimate before taxes on income and financing. Not financial advice.</p>
    <a class="btn btn-hi" style="margin-top:16px" href="/#start" data-role="buyer" data-ev="yield_cta">Have an agent check the real numbers</a>
  </div>
</div></section>'''
    js = '''<script>
(function(){
  var f = document.getElementById('yc'), $ = function(id){ return document.getElementById(id); };
  var eur = new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
  function n(k){ var v = parseFloat(String(f[k].value).replace(',', '.')); return isNaN(v) ? 0 : v; }
  function calc(){
    var rev = n('rate') * 365 * Math.min(n('occ'),100) / 100, cost = rev * n('mgmt') / 100 + n('costs'), net = rev - cost, price = n('price');
    var y = price > 0 ? net / price * 100 : 0, adv = n('adv');
    $('ny').textContent = price > 0 ? y.toFixed(1) + '%' : '–';
    $('rev').textContent = eur.format(rev); $('cst').textContent = eur.format(cost); $('net').textContent = eur.format(net);
    var vd = $('vd');
    if (!adv || price <= 0) { vd.className = 'verd mid'; vd.textContent = 'Add the advertised yield to compare.'; return; }
    var gap = adv - y;
    if (gap <= 1) { vd.className = 'verd good'; vd.textContent = 'The advertised yield looks consistent with your numbers.'; }
    else if (gap <= 4) { vd.className = 'verd mid'; vd.textContent = 'Advertised yield is ' + gap.toFixed(1) + ' points above your estimate. Ask how they calculate it.'; }
    else { vd.className = 'verd bad'; vd.textContent = 'Advertised yield is ' + gap.toFixed(1) + ' points above your estimate. Treat it as marketing until proven.'; }
  }
  f.addEventListener('input', calc); calc();
})();
</script>'''
    return page('/tools/yield-check', 'Rental yield check for off-plan property | Kolaboro', 'Free calculator: compare the rental yield a developer advertises with the yield after occupancy, fees and real costs.', body, extra_js=js)

CHECK = [
 ("Land and title", [("The seller is the title holder", "Names on the certificate match the seller or the company selling."),
   ("The certificate is checked at the land office", "Through your notary, not a photocopy from the seller."),
   ("You know the title type and its length", "Freehold, right to build, right to use or lease, and how many years are left."),
   ("No mortgage or dispute on the land", "Ask the notary to check for registered charges and disputes."),
   ("Zoning allows what you are buying", "Villas and rentals need the right zone, not agricultural or protected land.")]),
 ("Permits", [("Building approval exists for this project", "Ask for the permit number and check it matches the plans."),
   ("Rental licence if you plan to rent", "A home that can't be legally rented can't earn the promised yield."),
   ("Permits are in the name of the selling company", "Not a different company or a person.")]),
 ("The developer", [("You've seen projects they finished", "Visit or ask a local agent to visit, not just look at renders."),
   ("You've spoken to past buyers", "Find them yourself, not only the ones the developer suggests."),
   ("The company is registered and you know the directors", "Check the company registry."),
   ("You've searched for complaints and court cases", "Search the company and directors' names with the words scam, complaint and court.")]),
 ("The contract", [("Payments are tied to construction milestones", "Not to calendar dates."),
   ("There is a penalty or refund if they deliver late", "With a clear date and amount."),
   ("You know which law and courts apply", "And whether you could realistically use them."),
   ("An independent lawyer has read it", "Paid by you, not recommended by the seller.")]),
 ("Your money", [("Every payment goes to the company named in the contract", "Never to a personal account."),
   ("The deposit is a small share of the price", "Large upfront payments carry most of the risk."),
   ("Each milestone is checked before you pay", "By someone who works for you."),
   ("You keep every receipt and transfer record", "Matching amounts, dates and account names.")]),
]

def build_checklist():
    items, i = '', 0
    for g, lst in CHECK:
        items += f'<h2 style="font-size:clamp(1.4rem,2.4vw,1.9rem);margin:34px 0 14px">{g}</h2><ul class="cl">'
        for t, d in lst:
            i += 1
            items += f'<li><label><input type="checkbox" data-k="c{i}"><span><b>{t}</b><small>{d}</small></span></label></li>'
        items += '</ul>'
    body = phero('Checklist', 'Before you sign: the 20-point checklist', 'Go through it before you send a deposit. Your ticks are saved on this device.',
                 '<div class="hero-cta no-print"><button class="btn btn-line" onclick="window.print()">Print checklist</button></div>')
    body += f'''<section class="sec"><div class="wrap" style="max-width:860px">
  <div class="no-print"><b id="pc">0 of {i} done</b><div class="progress"><i id="pb"></i></div></div>
  {items}
  <div class="note-box" style="margin-top:36px"><b>Too many to check from abroad?</b> A Kolaboro agent can verify these for you. <a href="/#start" data-role="buyer" data-ev="checklist_cta">Book a pre-purchase check</a></div>
</div></section>'''
    js = '''<script>
(function(){
  var boxes = document.querySelectorAll('.cl input'), st = null; try { st = localStorage; } catch(e){}
  function upd(){ var d = 0; boxes.forEach(function(b){ if (b.checked) d++; });
    document.getElementById('pc').textContent = d + ' of ' + boxes.length + ' done';
    document.getElementById('pb').style.width = (d / boxes.length * 100) + '%'; }
  boxes.forEach(function(b){ try { b.checked = st && st.getItem('kb-cl-' + b.dataset.k) === '1'; } catch(e){}
    b.addEventListener('change', function(){ try { st && st.setItem('kb-cl-' + b.dataset.k, b.checked ? '1' : '0'); } catch(e){} upd(); }); });
  upd();
})();
</script>'''
    return page('/checklist', 'Before-you-sign checklist for buying property abroad | Kolaboro', 'A free 20-point checklist to go through before paying a deposit on property abroad: land title, permits, developer, contract and payments.', body, extra_js=js)

def guide(path, crumb, h1, lead, html_, title, desc):
    body = phero(crumb, h1, lead) + f'<section class="sec"><div class="wrap prose">{html_}<div class="note-box" style="margin-top:36px"><b>This is general information, not legal advice.</b> Rules change and every case is different. Before you sign, have an independent notary and lawyer check your specific property. <a href="/#start" data-role="buyer">A Kolaboro agent can help you prepare.</a></div></div></section>'
    ld = [{"@context": "https://schema.org", "@type": "Article", "headline": h1, "datePublished": TODAY, "author": {"@type": "Organization", "name": "Kolaboro"}}]
    return page(path, title, desc, body, extra_ld=ld)

def build_guides():
    out = []
    out.append(guide('/guides/bali-land-titles', 'Guides', 'Land titles in Bali: what foreigners can actually own',
        'Most problems for foreign buyers in Bali start with the land. Here are the title types you will meet and the checks to do before paying.',
        '''<h2 style="margin-top:0">The title types you will see</h2>
<table><thead><tr><th>Title</th><th>What it is</th><th>Who can hold it</th></tr></thead><tbody>
<tr><td>Hak Milik (SHM)</td><td>Full freehold ownership</td><td>Indonesian citizens only</td></tr>
<tr><td>Hak Guna Bangunan (HGB)</td><td>Right to build and own buildings on the land for a set term, renewable</td><td>Indonesian companies, including foreign-owned companies (PT PMA)</td></tr>
<tr><td>Hak Pakai</td><td>Right to use the land for a set term, renewable</td><td>Can be held by foreigners who meet the residence rules</td></tr>
<tr><td>Leasehold (sewa)</td><td>A lease contract over land held by someone else</td><td>Anyone; the most common route for foreign buyers</td></tr>
</tbody></table>
<h2>Five checks before you pay</h2>
<ol>
<li><b>Match the names.</b> The name on the certificate must match the seller, or the company that holds the lease or right.</li>
<li><b>Check it at the land office.</b> Your notary (PPAT) can confirm the certificate with the land office (BPN). A photocopy from the seller proves nothing.</li>
<li><b>Know how many years are really left.</b> For leasehold, read the start date and the extension terms. "Up to 80 years" often means a shorter first term plus extensions that depend on the landowner.</li>
<li><b>Check the zoning.</b> Villas and rentals are not allowed in every zone. Ask for the zoning on the official spatial plan, not a map from the agent.</li>
<li><b>Look for charges and disputes.</b> Ask the notary to check for mortgages (Hak Tanggungan) and family or boundary disputes.</li>
</ol>
<h2>Red flags</h2>
<ul><li>The seller won't share the certificate number before you pay a deposit.</li><li>The land is in someone else's name "for now".</li><li>You are asked to pay into a personal account.</li><li>The lease length is only promised verbally.</li></ul>''',
        'Bali land titles explained for foreign buyers | Kolaboro', 'Hak Milik, HGB, Hak Pakai and leasehold explained, plus five checks to do before paying for land or a villa in Bali.'))
    out.append(guide('/guides/off-plan-payments', 'Guides', 'Off-plan payments: how to pay without losing your money',
        'Most off-plan losses happen because buyers pay ahead of construction. Structure your payments so your money follows the building.',
        '''<h2 style="margin-top:0">The safe structure</h2>
<ol>
<li><b>Small deposit.</b> Keep the reservation and first payment to a small share of the price.</li>
<li><b>Pay by milestone, not by date.</b> Foundations, structure, roof, finishes, handover. Each payment is due only when that stage exists.</li>
<li><b>Verify before every payment.</b> Someone who works for you checks the milestone on site, with dated, location-stamped evidence.</li>
<li><b>Hold back the last part.</b> Keep a final payment until handover and a snagging inspection.</li>
<li><b>Pay the right account.</b> Only to the company named in the contract. Never to a personal account or a "partner" company.</li>
</ol>
<h2>Clauses to ask for</h2>
<ul><li>A delivery date with a penalty or a refund if it's missed.</li><li>What happens to your money if the project stops.</li><li>Use of an escrow or notary account where it's available.</li><li>A written change process: no price increases without your signature.</li></ul>
<h2>Warning signs</h2>
<ul><li>"Pay 50% now to lock the price."</li><li>Payment dates with no link to construction.</li><li>Progress updates that are only renders or staged photos.</li><li>No penalty for late delivery in the contract.</li></ul>''',
        'How to structure off-plan property payments safely | Kolaboro', 'Milestone payments, small deposits, verification before each payment and the contract clauses that protect off-plan buyers.'))
    return out

def build_bali():
    body = phero('Bali', 'Buying property in Bali, with someone on your side',
                 'Bali is where we start: strong demand from foreign buyers, and the same doubts every time. Here is what to watch and how Kolaboro helps.',
                 '<div class="hero-cta"><a class="btn btn-hi" href="/#start" data-role="buyer" data-ev="bali_cta">Protect my purchase</a><a class="btn btn-line" href="/check">Check a project</a></div>')
    body += '''<section class="sec"><div class="wrap grid3">
  <div class="tile"><h3>Land and zoning</h3><p>Foreigners usually buy leasehold or through a company. The zoning has to allow villas and rentals. <a href="/guides/bali-land-titles">Read the guide</a>.</p></div>
  <div class="tile"><h3>Permits</h3><p>Ask for the building approval (PBG) and, once built, the certificate of fitness (SLF). Renting needs its own licence.</p></div>
  <div class="tile"><h3>Construction</h3><p>Delays are common. Tie payments to milestones and have each one checked on site. <a href="/guides/off-plan-payments">How to pay safely</a>.</p></div>
</div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>How Kolaboro helps in Bali</h2><p class="lead">A local agent who works only for you checks the title, zoning, permits and developer before you sign, then films every milestone before you pay.</p></div>
  <div>''' + PRICING.replace('class="grid3"', 'class="grid1" style="display:grid;gap:16px"') + '''</div>
</div></section>'''
    return page('/bali', 'Buying property in Bali as a foreigner | Kolaboro', 'What foreign buyers need to check in Bali, from leasehold and zoning to permits and construction, and how a Kolaboro agent protects your purchase.', body)

def build_legal():
    priv = f'''<h2 style="margin-top:0">Who we are</h2><p>kolaboro.com is operated by {ENTITY}. Contact: <a href="mailto:{CONTACT}">{CONTACT}</a>.</p>
<h2>What we collect</h2><ul><li>What you send us in a form: name, email, phone (optional), place, project and message.</li><li>Usage data through Google Analytics and Microsoft Clarity, which use cookies and similar technology to understand how the site is used.</li><li>Drafts and checklist ticks saved only in your own browser.</li></ul>
<h2>Why we use it</h2><ul><li>To reply to your request and provide the service you ask for (contract or steps before a contract).</li><li>To improve the website (legitimate interest).</li></ul>
<h2>Who we share it with</h2><p>Our hosting and database providers (Cloudflare, Supabase), analytics providers (Google, Microsoft) and, only with your agreement, the local Kolaboro agent handling your case. We don't sell your data.</p>
<h2>How long we keep it</h2><p>Enquiries for up to 24 months after our last contact, unless you become a client, in which case we keep records as the law requires.</p>
<h2>Your rights</h2><p>You can ask to see, correct, delete or export your data, or object to its use, by emailing us. If you are in the EU or UK you can also complain to your data protection authority.</p>
<p class="ev">Last updated {TODAY}.</p>'''
    terms = f'''<h2 style="margin-top:0">The service</h2><p>Kolaboro provides independent verification and information about property projects through local agents. We are not a law firm, notary, surveyor, bank or financial adviser, and nothing on this site is legal, tax or financial advice.</p>
<h2>Trust Scores</h2><p>Trust Scores and reports are opinions based on the evidence listed and the date it was collected. Projects change; always check the date. We correct errors when shown evidence, and developers can reply on every page.</p>
<h2>Your decisions</h2><p>You decide whether to buy and when to pay. Use an independent lawyer and notary for legal checks and signing.</p>
<h2>Payments and escrow</h2><p>Kolaboro does not currently hold client money. "Safe to pay" advice is a recommendation based on what our agent verified.</p>
<h2>Liability</h2><p>To the extent the law allows, our liability for any service is limited to the fees you paid us for it.</p>
<h2>Operator</h2><p>{ENTITY}. Contact: <a href="mailto:{CONTACT}">{CONTACT}</a>.</p>
<p class="ev">Last updated {TODAY}.</p>'''
    a = page('/legal/privacy', 'Privacy policy | Kolaboro', 'How Kolaboro collects and uses personal data.', phero('Privacy', 'Privacy policy', 'What we collect, why, and your rights.') + f'<section class="sec"><div class="wrap prose">{priv}</div></section>')
    b = page('/legal/terms', 'Terms | Kolaboro', 'Terms of use for kolaboro.com and Kolaboro services.', phero('Terms', 'Terms of use', 'The short version: we verify and inform, you decide.') + f'<section class="sec"><div class="wrap prose">{terms}</div></section>')
    return [a, b]

def build_404():
    body = phero('', 'This page doesn\'t exist.', 'The link may be old. Here is where most people want to go.',
                 '<div class="hero-cta"><a class="btn btn-hi" href="/">Go to the home page</a><a class="btn btn-line" href="/check">Check a project</a></div>')
    page('/404.html', 'Page not found | Kolaboro', 'Page not found.', body, noindex=True)

exec(open(os.path.join(HERE, 'r3.py')).read())
exec(open(os.path.join(HERE, 'r4.py')).read())
exec(open(os.path.join(HERE, 'r5.py')).read())
exec(open(os.path.join(HERE, 'r6.py')).read())

def main():
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'k'))
    css = open(os.path.join(HERE, 'base.css')).read() + open(os.path.join(HERE, 'extra.css')).read()
    open(os.path.join(OUT, 'k', 'site.css'), 'w').write(css)
    shutil.copy(os.path.join(HERE, 'site.js'), os.path.join(OUT, 'k', 'site.js'))
    for f in ('favicon.svg', 'og.png'): shutil.copy(os.path.join(HERE, 'k', f), os.path.join(OUT, 'k', f))
    shutil.copy(os.path.join(HERE, 'k', 'favicon.svg'), os.path.join(OUT, 'favicon.svg'))
    paths = [build_home(), build_check(), build_report(), build_score(), build_method(), build_agents(), build_devs(),
             build_investors(), build_yield(), build_checklist(), build_bali()] + build_guides() + build_legal()
    paths += build_round3()
    paths += build_round4()
    paths += build_round5()
    paths += build_round6()
    build_404()
    finish_round6()
    idx = [p for p in paths if p not in ('/score/sample',)]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join(
        f'<url><loc>{SITE}{p if p == "/" else p + "/"}</loc><lastmod>{TODAY}</lastmod></url>' for p in idx) + '</urlset>\n'
    open(os.path.join(OUT, 'sitemap.xml'), 'w').write(sm)
    finish_round3(paths)
    open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /old/\nSitemap: {SITE}/sitemap.xml\n')
    self_host_fonts()
    print('built', len(paths) + 1, 'pages; sample score', SAMPLE_SCORE)

if __name__ == '__main__':
    main()
