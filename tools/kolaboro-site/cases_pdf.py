#!/usr/bin/env python3
"""Generate Kolaboro case reports (HTML) for PDF rendering. Run: python3 cases_pdf.py <outdir>"""
import os, sys, json, html as H

OUT = sys.argv[1] if len(sys.argv) > 1 else 'cases_html'
os.makedirs(OUT, exist_ok=True)

DIMS = ['Land title', 'Zoning and coastal rules', 'Building permits', 'Developer track record', 'Progress on site',
        'Where the money goes', 'Contract protections', 'Transparency', 'Realistic promises']

CSS = '''
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Archivo,Helvetica,Arial,sans-serif;color:#17212B;font-size:10.5pt;line-height:1.5;background:#fff}
.pg{width:210mm;min-height:297mm;padding:16mm 16mm 14mm;position:relative;page-break-after:always}
.pg:last-child{page-break-after:auto}
.top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #17212B;padding-bottom:8px}
.logo{font-weight:800;font-size:14pt;letter-spacing:-.02em;display:flex;align-items:center;gap:7px}
.logo i{width:12px;height:12px;border-radius:50%;background:#FF5B14;display:inline-block}
.top small{font-size:8.5pt;color:#59626B;text-align:right}
.badge{display:inline-block;font-size:8pt;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border-radius:999px;margin-top:14px}
.b-pub{background:#FFE3D4;color:#8A2D04}.b-live{background:#DDEFE7;color:#0B5A40}.b-ill{background:#E3E2DD;color:#17212B}
h1{font-size:23pt;line-height:1.08;letter-spacing:-.02em;margin-top:8px}
.sub{font-size:11pt;color:#2A3541;margin-top:6px}
.kv{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.kv div{background:#F2F1EC;border-radius:10px;padding:8px 10px}
.kv span{display:block;font-size:7.5pt;color:#59626B;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.kv b{font-size:10.5pt}
h2{font-size:12.5pt;margin-top:16px;padding-bottom:4px;border-bottom:1px solid #DCDAD3}
p{margin-top:6px}
ul,ol{margin:6px 0 0 16px}
li{margin-top:3px}
.tl{list-style:none;margin:8px 0 0;padding:0;border-left:2px solid #DCDAD3}
.tl li{position:relative;padding:0 0 6px 14px}
.tl li::before{content:"";position:absolute;left:-6px;top:5px;width:10px;height:10px;border-radius:50%;background:#17212B}
.tl li.bad::before{background:#D9480F}
.tl b{font-variant-numeric:tabular-nums}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:9.5pt}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E6E4DE;vertical-align:top}
th{font-size:8pt;text-transform:uppercase;letter-spacing:.05em;color:#59626B}
.st{display:inline-block;font-size:8pt;font-weight:800;padding:2px 8px;border-radius:999px;white-space:nowrap}
.s-red{background:#FDE2D6;color:#9A2E06}.s-amb{background:#FFF0C7;color:#7A5300}.s-grn{background:#DDEFE7;color:#0B5A40}.s-gry{background:#ECEBE6;color:#59626B}
.callout{background:#17212B;color:#F6F6F3;border-radius:14px;padding:12px 14px;margin-top:12px}
.callout b{color:#FFB48F}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.src{font-size:8.5pt;color:#2A3541;word-break:break-all}
.foot{position:absolute;left:16mm;right:16mm;bottom:9mm;font-size:7.5pt;color:#8A949E;display:flex;justify-content:space-between;border-top:1px solid #E6E4DE;padding-top:5px}
.score{display:flex;gap:14px;align-items:center;margin-top:10px}
.dial{width:78px;height:78px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:22pt}
.photo{height:120px;border-radius:12px;background:linear-gradient(180deg,#7FA6C4,#E9D9BE 60%,#9C8463 60.5%);position:relative;overflow:hidden}
.photo span{position:absolute;left:8px;bottom:6px;font-size:7.5pt;color:#fff;text-shadow:0 1px 2px #000}
'''

def page(inner, ref, note):
    return f'<section class="pg"><div class="top"><div class="logo"><i></i>kolaboro</div><small>{ref}<br>kolaboro.com</small></div>{inner}<div class="foot"><span>{note}</span><span>Kolaboro · operated by Equinox Investment Group LLC</span></div></section>'

def checks_table(rows):
    cls = {'Would flag': 's-red', 'Check': 's-amb', 'Pass': 's-grn', 'Unknown': 's-gry', 'Pending': 's-gry'}
    tr = ''.join(f'<tr><td><b>{H.escape(d)}</b></td><td><span class="st {cls.get(s, "s-gry")}">{s}</span></td><td>{H.escape(w)}</td></tr>' for d, s, w in rows)
    return f'<table><tr><th style="width:28%">Check</th><th style="width:15%">Result</th><th>Why</th></tr>{tr}</table>'

def public_case(c):
    head = f'''<span class="badge b-pub">Public-record case study</span>
<h1>{H.escape(c["title"])}</h1><p class="sub">{H.escape(c["sub"])}</p>
<div class="kv">{''.join(f'<div><span>{k}</span><b>{H.escape(v)}</b></div>' for k, v in c["kv"])}</div>
<h2>What happened</h2><p>{c["what"]}</p>
<h2>Timeline</h2><ul class="tl">{''.join(f'<li class="{"bad" if bad else ""}"><b>{d}</b> · {H.escape(t)}</li>' for d, t, bad in c["timeline"])}</ul>
<div class="callout"><b>The lesson.</b> {c["lesson"]}</div>'''
    p2 = f'''<h2 style="margin-top:14px">Which Kolaboro checks would have caught it</h2>
{checks_table(c["checks"])}
<h2>What a buyer could have done before paying</h2><ol>{''.join(f'<li>{H.escape(x)}</li>' for x in c["todo"])}</ol>
<div class="two" style="margin-top:12px"><div class="callout"><b>Cost of a Kolaboro check</b><br>€490 before signing, then €99 a month during construction.</div><div class="callout"><b>What was at stake</b><br>{c["stake"]}</div></div>
<h2>Sources</h2><ul class="src">{''.join(f'<li>{H.escape(t)}: {u}</li>' for t, u in c["sources"])}</ul>
<p style="font-size:8.5pt;color:#59626B;margin-top:10px">{c["disclaimer"]}</p>'''
    note = 'Public-record case study. Not a Kolaboro verification of this project.'
    return page(head, c['ref'], note) + page(p2, c['ref'], note)

DISC = ('This case study summarises what was published by the sources listed, on the dates shown. Statements by buyers are their allegations, '
        'not findings of fact; no court or authority had ruled on them at the time of the sources unless stated. Kolaboro has not inspected this project. '
        'The developer is entitled to reply, and we will add any reply we receive.')

CASES = [
 dict(slug='bingin-beach-bali-2025', ref='Case PR-01 · Bali, Indonesia',
  title='Bingin Beach, Bali: 48 buildings demolished on the cliff',
  sub='Restaurants, homestays and surf businesses built on state-owned coastal land without valid permits. Some were backed by foreign investors.',
  kv=[('Where','Bingin, Uluwatu'),('When','21 July 2025'),('Structures','48 demolished'),('Foreign-backed','At least 7')],
  what='On 21 July 2025 the Bali provincial government demolished 48 structures on Bingin Beach, a well-known surf spot on the Bukit peninsula. '
       'A May 2025 inspection by the provincial parliament found many of the businesses sat on <b>state-owned land</b>, in a <b>protected coastal and cliff area</b>, '
       '<b>without valid building permits</b>. Officials cited the coastal-management law (Law 27/2007) and Bali Governor Regulation 24/2020, which bans construction on coastal boundaries and cliffs. '
       'According to officials, foreign nationals backed at least seven of the 48 businesses as investors, with Indonesian citizens as the named operators. Some businesses had operated there since the 1980s.',
  timeline=[('May 2025','Provincial parliament inspection finds businesses on state land without permits',True),
            ('21 Jul 2025','48 structures demolished, overseen by the Governor and the Badung Regent',True),
            ('2025-2026','Debris stays on site for almost a year; hundreds of local staff lose their jobs',True),
            ('May 2026','Badung announces a public redevelopment of the area, phase one from 2026',False)],
  lesson='A business can run for decades and still sit on land that was never legally buildable. Age, reviews and a busy restaurant prove nothing about the title or the zoning.',
  checks=[('Land title','Would flag','Structures on state-owned land: no private title could be shown.'),
          ('Zoning and coastal rules','Would flag','Protected coastal and cliff area where construction is banned (Governor Reg. 24/2020).'),
          ('Building permits','Would flag','No valid building permits according to the authorities.'),
          ('Where the money goes','Check','Foreign money entered through local nominee operators: who legally owns what?'),
          ('Realistic promises','Check','Income from a business that could be closed by the state at any time.')],
  todo=['Ask for the land certificate and check it at the land office (BPN), not just a copy.',
        'Check the plot on the official spatial plan (RTRW) and the coastal setback rules.',
        'Ask for the building permit (PBG) number and confirm it in the official system.',
        'Never invest through a nominee arrangement without understanding who owns the asset.'],
  stake='Every investor who funded a building on that cliff lost the asset when it was demolished.',
  sources=[('Honeycombers Bali, "Bingin Beach demolition and rebuild", 24 Jun 2026','https://thehoneycombers.com/bali/bingin-beach-demolition-rebuild/'),
           ('Bukit Vista, "Bingin Cliff Demolitions", 10 Sep 2025','https://www.bukitvista.com/?p=109437')],
  disclaimer='This case study summarises reporting on government enforcement, as published by the sources listed. Kolaboro has not inspected any of the properties involved.'),
 dict(slug='ocean-tulum-mexico', ref='Case PR-02 · Tulum, Mexico',
  title='Ocean Tulum: buyers report waiting over three years for their condos',
  sub='Buyers say they made every payment, but the building is unfinished and there is no firm delivery date.',
  kv=[('Where','Tulum, Quintana Roo'),('Developer (per source)','Grupo VINSA'),('Purchases from','2022'),('Status (Jun 2026)','Not delivered')],
  what='According to Riviera Maya News (17 June 2026), buyers of Ocean Tulum condos say they have waited <b>more than three years</b> for delivery, after purchases dating back to 2022. '
       'They say they made all required payments but have received neither their units nor a firm delivery date; some areas are unfinished and others are still at the <b>raw concrete</b> stage. '
       'Buyers report updates about financing, bridge loans and possible restarts that did not lead to completed units, and they have asked urban-development, consumer-protection and law-enforcement authorities to investigate. '
       'At the time of publication the source reported no legal proceedings and no official response from the developer.',
  timeline=[('2022','Buyers sign and start paying the instalment plan',False),
            ('2023-2025','Updates on financing, bridge loans and restarts; units not completed',True),
            ('Jun 2026','Buyers go public and ask authorities to investigate',True)],
  lesson='Paying by the calendar instead of by the building is how buyers end up fully paid for a concrete shell. The moment to stop is payment 3 of 6, not year 3.',
  checks=[('Progress on site','Would flag','Monthly visits would have shown work slowing or stopping against the payment plan.'),
          ('Where the money goes','Would flag','Talk of bridge loans and new financing is a sign the project is underfunded.'),
          ('Contract protections','Check','Is there a delivery date with a penalty or a refund right?'),
          ('Developer track record','Check','Has this developer delivered previous projects on time?'),
          ('Transparency','Check','Buyers report posts removed and no firm date: a transparency red flag.')],
  todo=['Pay only against verified milestones, not dates. Ask your agent for "safe to pay" before every instalment.',
        'Get monthly GPS-stamped photos and video of your unit, not marketing updates.',
        'Ask for proof of construction financing before signing.',
        'Insist on a contract clause with a delivery deadline, a penalty and a refund right.'],
  stake='All instalments already paid, for a unit that still cannot be lived in or rented.',
  sources=[('Riviera Maya News, "Buyers Report Over Three-Year Delays in Delivery of Tulum Condos", 17 Jun 2026','https://www.rivieramayanews.mx/buyers-report-over-three-year-delays-in-delivery-of-tulum-condos/'),
           ('Tulum Times, "Ocean Tulum buyers accuse Grupo Vinsa of unfulfilled deliveries and refunds"','https://tulumtimes.com/ocean-tulum-buyers-accuse-grupo-vinsa-of-unfulfilled-deliveries-and-refunds')],
  disclaimer=DISC),
 dict(slug='menese-tulum-playa', ref='Case PR-03 · Tulum and Playa del Carmen, Mexico',
  title='Menese: buyers say apartments bought in 2023 have not been handed over',
  sub='One buyer is gathering others for a collective complaint; another dispute over a delayed unit is in the courts.',
  kv=[('Where','Tulum and Playa del Carmen'),('Developer (per source)','Menese'),('One unit paid','$97,000'),('Status (Aug 2026)','Disputed')],
  what='According to Riviera Maya News (20 August 2026), a buyer who bought one apartment at Menese Cobá (Tulum) and one at Menese Coco Beach 3 (Playa del Carmen) in June 2023 says <b>neither unit has been handed over</b>. '
       'She is collecting documents and testimony from other buyers to assess a collective complaint. A second buyer says he paid <b>$97,000</b> for an apartment in a Menese development in Tulum '
       'with delivery expected around 2020; the deadline was later changed, the parties disagreed about compensation, and the dispute is now in an <b>amparo</b> (a Mexican constitutional appeal). '
       'The source reports no response from the developer and notes that the company is entitled to present its position.',
  timeline=[('~2020','Original expected delivery for the second buyer\'s unit',True),
            ('Jun 2023','First buyer purchases two apartments',False),
            ('2023-2026','Deadlines moved; disputes over delay compensation',True),
            ('Aug 2026','Buyer seeks a collective action; second dispute in an amparo',True)],
  lesson='When a deadline can be moved without a penalty, it is not a deadline. The contract, read before signing, decides who carries the delay.',
  checks=[('Contract protections','Would flag','Delivery date that could be moved, and disputed compensation for the delay.'),
          ('Developer track record','Would flag','Earlier projects with delivery disputes are visible before you buy.'),
          ('Progress on site','Check','Is the unit you are paying for actually being built?'),
          ('Where the money goes','Check','Are payments held in a trust (fideicomiso) or paid straight to the developer?')],
  todo=['Have the contract read for delivery dates, penalties and refund rights before signing.',
        'Search for other buyers and earlier projects of the same developer.',
        'Prefer purchases through a bank trust (fideicomiso) with milestone releases.',
        'Keep every payment receipt and every written promise about dates.'],
  stake='$97,000 for a single unit, plus years of delay and legal costs.',
  sources=[('Riviera Maya News, "Buyer Seeks Collective Action Over Undelivered Menese Apartments", 20 Aug 2026','https://www.rivieramayanews.mx/buyer-seeks-collective-action-over-undelivered-menese-apartments/')],
  disclaimer=DISC),
 dict(slug='bali-villa-share-scam', ref='Case PR-04 · Badung, Bali',
  title='The Bali villa that didn\'t exist: over $126,000 lost by Australian investors',
  sub='Investors paid for half-shares in villas with promised monthly income. The contracts and locations were false.',
  kv=[('Where','Badung, Bali'),('Reported','Mar 2024 (ABC)'),('Half share price','$66,000'),('Reported losses','$126,000+')],
  what='According to Own Property Abroad, citing an ABC report of 23 March 2024, Australian investors were offered a share in a villa in Badung: <b>$66,000 for a half share</b>, with <b>$1,300 a month</b> in promised returns. '
       'The contracts and villa locations turned out to be false. After the transfers, the seller stopped answering calls and messages. Other people reported similar losses on properties and businesses that did not exist; '
       'some received partial repayments, but most of the money was not recovered. Victims say police and regulators gave them little support.',
  timeline=[('Before 2024','Investors meet the seller in Bali and are offered villa shares',False),
            ('Payment','Money transferred; the seller goes quiet',True),
            ('Mar 2024','ABC reports losses above $126,000 among victims who came forward',True)],
  lesson='The cheapest check of all is whether the property exists and the seller owns it. A visit with GPS, plus the land certificate checked at the land office, would have ended this before the first transfer.',
  checks=[('Land title','Would flag','No certificate in the seller\'s name for the villa offered.'),
          ('Progress on site','Would flag','A GPS-stamped visit would show the villa was not where, or what, the contract said.'),
          ('Realistic promises','Would flag','A fixed $1,300 a month on a $66,000 share is about 24% a year: far above what villas earn.'),
          ('Where the money goes','Would flag','Payment to a person, not to a company with a verifiable registration.')],
  todo=['Visit the exact plot, or send someone, and match it to the certificate and the contract.',
        'Check the certificate holder\'s name at the land office (BPN).',
        'Be suspicious of fixed monthly "returns" far above market.',
        'Pay companies with verifiable registration, never personal accounts.'],
  stake='The full amount transferred: there was no asset to recover.',
  sources=[('Own Property Abroad, "Australians lose $120,000 in a Bali villa scam", 9 Apr 2024 (citing ABC, 23 Mar 2024)','https://ownpropertyabroad.com/?p=11260')],
  disclaimer='This case study summarises reporting by the sources listed. We do not name the individual involved; no conviction was reported by the source. Kolaboro has not investigated this case.'),
]

def live_case():
    rows = [('Land title','Pending','Advertised as leasehold. Next: certificate checked at the land office (BPN).'),
            ('Zoning and coastal rules','Check','Advertised as zoned for short-term rentals. Next: confirm on the official spatial plan.'),
            ('Building permits','Check','A building permit is claimed. Next: confirm the number in the official system and match it to the plot.'),
            ('Developer track record','Pending','Developer invited to verification on 28 Oct 2026; awaiting reply.'),
            ('Progress on site','Pending','Site visit with GPS video not done yet.'),
            ('Where the money goes','Pending','Payment plan and account holder to be checked.'),
            ('Contract protections','Check','A lease extension is advertised. Next: is it a binding clause with a fixed price?'),
            ('Transparency','Pass','Price, title type, lease term and completion year are published on the developer\'s site.'),
            ('Realistic promises','Check','Projected annual return of 10 to 13%: compare with real occupancy and rates nearby.')]
    p1 = f'''<span class="badge b-live">Live case · stage 2 of 5</span>
<h1>BALI-014: off-plan villas, Bukit peninsula</h1><p class="sub">A real project in our pipeline. We name it only after the verification is complete and the developer has had 10 working days to reply.</p>
<div class="kv"><div><span>Area</span><b>Bukit peninsula</b></div><div><span>Price range</span><b>$200k to $400k</b></div><div><span>Title advertised</span><b>Leasehold</b></div><div><span>Completion advertised</span><b>2027</b></div></div>
<h2>Where this case stands</h2>
<ul class="tl"><li><b>28 Oct 2026</b> · Promises read by our AI agent from the developer's own pages</li><li><b>28 Oct 2026</b> · Developer invited to a free verification</li><li class="" style="opacity:.55"><b>Next</b> · Registry checks: land certificate, lease registration, building permit</li><li style="opacity:.55"><b>Next</b> · Site visit with GPS- and time-stamped video</li><li style="opacity:.55"><b>Then</b> · Trust Score published with evidence and the developer's reply</li></ul>
<h2>What the developer advertises</h2>
<ul><li>A 30-year lease with a 30-year extension.</li><li>Zoning that allows short-term rentals.</li><li>A building permit.</li><li>A projected annual return of 10 to 13%.</li><li>Completion in 2027.</li></ul>
<div class="callout"><b>How our agent reads this.</b> None of these claims is wrong by itself. Each one becomes a question with a document or a visit behind it. That is the difference between a promise and a verified fact.</div>'''
    p2 = f'''<h2 style="margin-top:14px">The nine checks, today</h2>{checks_table(rows)}
<h2>Questions our agent will answer on site</h2><ol>
<li>Is the lease registered, and is the base term the one advertised?</li>
<li>Is the extension a binding clause with a fixed price, or only a promise?</li>
<li>Does the building permit exist and match this plot?</li>
<li>Does real occupancy nearby support a 10 to 13% return?</li>
<li>Does progress on site match a 2027 completion?</li></ol>
<p style="font-size:8.5pt;color:#59626B;margin-top:12px">Data collected by the Kolaboro research agent (built on Claude) from the developer's public pages on 28 October 2026. These are advertised claims, not verified facts. This report will be updated as each step is completed.</p>'''
    note = 'Live case. Advertised claims only; no verdict until verification is complete.'
    return page(p1, 'Live case BALI-014', note) + page(p2, 'Live case BALI-014', note)

def _villa_svg():
    import re
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'r9.py')).read()
    m = re.search(r'<svg class="site2".*?</svg>', src, re.S)
    return m.group(0).replace('class="site2"', 'style="position:absolute;inset:0;width:100%;height:100%"') if m else ''

def _villa_svg_b():
    return _villa_svg().replace('url(#', 'url(#b').replace('id="', 'id="b')

def passing_example():
    rows = [('Land title','Pass','Leasehold certificate checked at the land office; lessor and plot match the contract.'),
            ('Zoning and coastal rules','Pass','Plot in a tourism zone on the spatial plan; outside the coastal setback.'),
            ('Building permits','Pass','Building permit number confirmed in the official system for this plot.'),
            ('Developer track record','Pass','Two earlier projects delivered within 4 months of the promised date.'),
            ('Progress on site','Pass','Milestone 3 of 6 verified on site with GPS video.'),
            ('Where the money goes','Check','Payments go to the developer\'s company account; no escrow.'),
            ('Contract protections','Pass','Delivery date with a penalty of 1% a month and a refund right after 6 months.'),
            ('Transparency','Pass','Replied to every question within 5 days and shared all permits.'),
            ('Realistic promises','Check','8% projected yield is reachable but assumes 70% occupancy.')]
    p1 = f'''<span class="badge b-ill">Illustrative example · fictional project</span>
<h1>What a project that passes looks like</h1><p class="sub">"Villa Kenanga" is invented to show a finished Kolaboro report. Real reports follow exactly this format.</p>
<div class="score"><div class="dial" style="background:conic-gradient(#2FB27E 0 84%,#E3E2DD 84% 100%)"><div style="background:#fff;width:60px;height:60px;border-radius:50%;display:grid;place-items:center">84</div></div>
<div><b style="font-size:13pt">Trust Score 84 / 100</b><br>Two items to watch: no escrow, and the yield assumes 70% occupancy.</div></div>
<div class="kv"><div><span>Area</span><b>Canggu coast</b></div><div><span>Price</span><b>$310,000</b></div><div><span>Title</span><b>Leasehold, 30 years</b></div><div><span>Payment</span><b>3 of 6: safe to pay</b></div></div>
<h2>Site visit, milestone 3</h2><div class="two"><div class="photo" style="height:170px">{_villa_svg()}<span>-8.64781, 115.13852 · GPS ±3 m · 14:11 WITA</span></div><div class="photo" style="height:170px">{_villa_svg_b()}<span>Roof structure complete · 14 photos, 2 videos</span></div></div>
<div class="callout"><b>Verdict for the buyer.</b> Milestone 3 (roof structure) is complete and matches the drawings. Safe to pay instalment 3 of 6 (€48,000).</div>'''
    p2 = f'''<h2 style="margin-top:14px">The nine checks</h2>{checks_table(rows)}
<h2>Developer's reply</h2><p>"We use the company account because our bank does not offer escrow for leaseholds yet; we share a monthly statement with every buyer on request."</p>
<p style="font-size:8.5pt;color:#59626B;margin-top:12px">Illustrative example with a fictional project, developer and figures, to show the format of a Kolaboro report.</p>'''
    note = 'Illustrative example. Fictional project and data.'
    return page(p1, 'Example report', note) + page(p2, 'Example report', note)

def doc(body):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><style>@font-face{{font-family:Archivo;src:url(file://{os.path.abspath(os.path.join(os.path.dirname(__file__), "out/k/fonts/archivo-latin.woff2"))}) format("woff2");font-weight:100 900;font-stretch:62% 125%}}{CSS}</style></head><body>{body}</body></html>'

files = []
for c in CASES:
    fn = f'kolaboro-case-{c["slug"]}.html'; open(os.path.join(OUT, fn), 'w').write(doc(public_case(c))); files.append(fn)
open(os.path.join(OUT, 'kolaboro-live-case-BALI-014.html'), 'w').write(doc(live_case())); files.append('kolaboro-live-case-BALI-014.html')
open(os.path.join(OUT, 'kolaboro-example-passing-project.html'), 'w').write(doc(passing_example())); files.append('kolaboro-example-passing-project.html')
json.dump([{'file': f, 'title': t} for f, t in zip(files, [c['title'] for c in CASES] + ['BALI-014: off-plan villas, Bukit peninsula', 'What a project that passes looks like'])], open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
print('\n'.join(files))
