#!/usr/bin/env python3
"""Kolaboro client reports: the deliverable a buyer receives after paying for a check.
Run: python3 reports_pdf.py <outdir>  (then node pdf.js <outdir> <pdfdir>)"""
import os, sys, json, html as H

OUT = sys.argv[1] if len(sys.argv) > 1 else 'reports_html'
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
PHOTOS = os.path.join(HERE, '..', 'photos')
PMETA = json.load(open(os.path.join(PHOTOS, 'meta.json')))
FONT = os.path.join(HERE, 'out/k/fonts/archivo-latin.woff2')
E = H.escape

def purl(k): return 'file://' + os.path.abspath(os.path.join(PHOTOS, PMETA[k]['file']))
def credit(k): m = PMETA[k]; return f"{E(m['artist'])}, {E(m['license'])}, Wikimedia Commons"

CSS = '''
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Archivo,Helvetica,Arial,sans-serif;color:#17212B;font-size:10pt;line-height:1.45;background:#fff}
.pg{width:210mm;height:297mm;overflow:hidden;padding:13mm 15mm 14mm;position:relative;page-break-after:always}
.pg:last-child{page-break-after:auto}
.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #17212B;padding-bottom:7px}
.logo{font-weight:800;font-size:14pt;letter-spacing:-.02em;display:flex;align-items:center;gap:7px}
.logo i{width:12px;height:12px;border-radius:50%;background:#FF5B14;display:inline-block}
.top .meta{font-size:7.8pt;color:#59626B;text-align:right;line-height:1.35}
.kicker{font-size:8pt;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#59626B;margin-top:12px}
h1{font-size:21pt;line-height:1.08;letter-spacing:-.02em;margin-top:4px}
h2{font-size:12pt;margin-top:13px;padding-bottom:4px;border-bottom:1px solid #DCDAD3}
h3{font-size:10.5pt;margin-top:8px}
p{margin-top:5px}
ul,ol{margin:5px 0 0 15px} li{margin-top:2px}
.for{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
.for div{background:#F2F1EC;border-radius:9px;padding:7px 9px}
.for span{display:block;font-size:7pt;color:#59626B;text-transform:uppercase;letter-spacing:.05em;font-weight:700}
.for b{font-size:9.5pt}
.verdict{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;border-radius:16px;padding:14px 16px;margin-top:12px;color:#fff}
.v-red{background:#9A2E06}.v-amb{background:#8A5A00}.v-grn{background:#0B6E4C}
.verdict .big{font-size:20pt;font-weight:800;letter-spacing:-.02em;line-height:1;white-space:nowrap}
.verdict .big small{display:block;font-size:7.5pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.85;margin-bottom:4px}
.verdict p{margin:0;font-size:10pt;line-height:1.4}
.sum{display:grid;grid-template-columns:1.25fr 1fr;gap:12px;margin-top:10px}
.box{background:#F2F1EC;border-radius:12px;padding:10px 12px}
.box h3{margin-top:0}
.risk{display:flex;gap:6px;margin-top:6px}
.risk i{flex:1;height:8px;border-radius:4px;background:#E3E2DD}
.risk i.on{background:#D9480F}.risk.amb i.on{background:#D99A00}.risk.grn i.on{background:#2FB27E}
table{width:100%;border-collapse:collapse;margin-top:6px;font-size:8.6pt}
th,td{text-align:left;padding:4px 7px;border-bottom:1px solid #E6E4DE;vertical-align:top}
th{font-size:7.2pt;text-transform:uppercase;letter-spacing:.05em;color:#59626B}
.st{display:inline-block;font-size:7.3pt;font-weight:800;padding:2px 7px;border-radius:999px;white-space:nowrap}
.s-red{background:#FDE2D6;color:#9A2E06}.s-amb{background:#FFF0C7;color:#7A5300}.s-grn{background:#DDEFE7;color:#0B5A40}.s-gry{background:#ECEBE6;color:#59626B}
.acts{counter-reset:a;list-style:none;margin:6px 0 0;padding:0}
.acts li{counter-increment:a;position:relative;padding:5px 0 5px 30px;border-bottom:1px solid #EFEDE7}
.acts li::before{content:counter(a);position:absolute;left:0;top:5px;width:20px;height:20px;border-radius:50%;background:#17212B;color:#fff;font-size:8pt;font-weight:800;display:grid;place-items:center}
.acts li b{display:block}
.photo{border-radius:12px;background-size:cover;background-position:center;position:relative;overflow:hidden}
.photo .cap{position:absolute;left:0;right:0;bottom:0;padding:16px 10px 6px;font-size:7pt;color:#fff;background:linear-gradient(180deg,transparent,rgba(0,0,0,.7))}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.src{font-size:7.2pt;line-height:1.35;word-break:break-all;color:#2A3541}
.sign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;font-size:8pt;color:#59626B}
.sign b{display:block;color:#17212B;font-size:9.5pt}
.foot{position:absolute;left:15mm;right:15mm;bottom:8mm;font-size:7pt;color:#8A949E;display:flex;justify-content:space-between;border-top:1px solid #E6E4DE;padding-top:4px}
.dial{width:70px;height:70px;border-radius:50%;display:grid;place-items:center}
.dial span{width:54px;height:54px;border-radius:50%;background:#9A2E06;display:grid;place-items:center;font-size:17pt;font-weight:800}
'''

ST = {'Fail': 's-red', 'Red flag': 's-red', 'Concern': 's-amb', 'To confirm': 's-amb', 'Pass': 's-grn', 'Not checked': 's-gry', 'Pending': 's-gry'}

def header(r, n, total):
    return f'''<div class="top"><div class="logo"><i></i>kolaboro</div><div class="meta">Report {E(r["no"])} · {E(r["date"])}<br>Page {n} of {total} · Confidential to the client</div></div>'''

def footer(r):
    return f'<div class="foot"><span>{E(r["footnote"])}</span><span>Kolaboro · Equinox Investment Group LLC · kolaboro.com</span></div>'

def report(r):
    total = 3
    lvl = r['level']; vcls = {'red': 'v-red', 'amb': 'v-amb', 'grn': 'v-grn'}[lvl]
    bars = ''.join(f'<i class="{"on" if i < r["risk"] else ""}"></i>' for i in range(5))
    rcls = {'red': '', 'amb': 'amb', 'grn': 'grn'}[lvl]
    p1 = f'''{header(r, 1, total)}
<p class="kicker">{E(r["kind"])}</p>
<h1>{E(r["title"])}</h1>
<div class="for">{''.join(f'<div><span>{E(k)}</span><b>{E(v)}</b></div>' for k, v in r["facts"])}</div>
<div class="verdict {vcls}"><div class="big"><small>Our advice</small>{E(r["verdict"])}</div><p>{r["verdict_why"]}</p></div>
<div class="sum">
  <div class="box"><h3>What this means for you</h3><ul>{''.join(f'<li>{x}</li>' for x in r["means"])}</ul></div>
  <div class="box"><h3>Risk level</h3><div class="risk {rcls}">{bars}</div><p style="font-size:9pt">{E(r["risk_label"])}</p>
    <h3 style="margin-top:8px">Your money</h3><p style="font-size:9pt">{r["money"]}</p></div>
</div>
{f'<div class="photo" style="height:{r["p1h"]}mm;margin-top:10px;background-image:url({purl(r["photo1"][0])})"><div class="cap">{E(r["photo1"][1])} Photo: {credit(r["photo1"][0])}.</div></div>' if r.get("photo1") else ''}
{footer(r)}'''
    rows = ''.join(f'<tr><td><b>{E(a)}</b></td><td><span class="st {ST.get(b, "s-gry")}">{E(b)}</span></td><td>{c}</td></tr>' for a, b, c in r['checks'])
    acts = ''.join(f'<li><b>{E(a)}</b>{b}</li>' for a, b in r['actions'])
    p2 = f'''{header(r, 2, total)}
<h2 style="margin-top:8px">The nine checks</h2>
<table><tr><th style="width:24%">Check</th><th style="width:13%">Result</th><th>What we found</th></tr>{rows}</table>
<h2>What to do now</h2><ol class="acts">{acts}</ol>
{footer(r)}'''
    photos = ''.join(f'<div class="photo" style="height:58mm;background-image:url({purl(k)})"><div class="cap">{E(c)} Photo: {credit(k)}.</div></div>' for k, c in r.get('photos', []))
    src = ''.join(f'<li>{E(t)}: {u}</li>' for t, u in r['sources'])
    src += ''.join(f'<li>Photo: {E(PMETA[k]["title"].replace("File:", ""))}, {credit(k)}: {PMETA[k]["page"]}</li>' for k in ([r["photo1"][0]] if r.get("photo1") else []) + [k for k, _ in r.get('photos', [])])
    p3 = f'''{header(r, 3, total)}
<h2 style="margin-top:8px">Evidence</h2>
<p style="font-size:9pt">{r["evidence_intro"]}</p>
{f'<div class="two" style="margin-top:8px">{photos}</div>' if photos else ''}
<h2>Timeline</h2><ul>{''.join(f'<li><b>{E(d)}</b> · {E(t)}</li>' for d, t in r["timeline"])}</ul>
<h2>Scope of this report</h2><p style="font-size:8.6pt">{r["scope"]}</p>
<h2>Sources</h2><ul class="src">{src}</ul>
<div class="sign"><div><b>Kolaboro verification team</b>{E(r.get("signoff", "Sample report"))}</div><div style="text-align:right"><b>Questions about this report?</b>carlos@equinoxinvestmentgroup.com</div></div>
{footer(r)}'''
    return ''.join(f'<section class="pg">{p}</section>' for p in (p1, p2, p3))

PUB_SCOPE = ('<b>Desk review from public sources.</b> This sample report shows how Kolaboro would advise a buyer considering this project today, using only what the sources listed had published by the dates shown. '
             'Kolaboro has not visited the site or reviewed the developer\'s documents. Statements by buyers in the press are their allegations, not findings of fact. '
             'A full check adds registry searches, a site visit with GPS-stamped video and a contract review. The developer can reply and we will add their reply.')

REPORTS = [
 dict(slug='bingin-cliff-bali', no='KB-S-0001', date='28 Oct 2026', kind='Pre-purchase report · sample, desk review',
  title='Cliffside business or homestay at Bingin Beach, Bali',
  facts=[('Prepared for', 'Sample client'), ('Location', 'Bingin, Uluwatu'), ('Type of deal', 'Investment in a cliff business'), ('Stage', 'Before signing')],
  level='red', risk=5, verdict='Do not buy', risk_label='Very high: the land cannot be legally owned or built on.',
  verdict_why='The structures on the Bingin cliff stand on <b>state-owned land</b> in a <b>protected coastal and cliff zone</b>, without valid building permits. On 21 July 2025 the Bali government demolished 48 of them. Any money you put in can be lost overnight.',
  means=['There is no private title you could hold or register.', 'Construction there is banned by Bali Governor Regulation 24/2020.', 'Foreign investors who backed at least 7 of the businesses lost them when they were demolished.'],
  money='At risk: <b>100% of what you invest</b>. There is no asset left after a demolition order.',
  photo1=('bingin', 'Bingin Beach in 2011: buildings on the cliff behind the sand.'), p1h=88,
  checks=[('Land title', 'Fail', 'State-owned land. No private certificate can be issued to you or your local partner.'),
          ('Zoning and coast', 'Fail', 'Protected coastal and cliff area; construction banned (Gov. Reg. 24/2020, Law 27/2007).'),
          ('Building permits', 'Fail', 'No valid building permits according to the provincial authorities.'),
          ('Developer record', 'Not checked', 'Not relevant: the land itself rules the deal out.'),
          ('Progress on site', 'Red flag', '48 structures demolished on 21 Jul 2025; the site is now a public redevelopment.'),
          ('Where the money goes', 'Red flag', 'Foreign money went in through local nominee operators: you own nothing in your name.'),
          ('Contract', 'Not checked', 'No contract can protect a building the state can remove.'),
          ('Transparency', 'Concern', 'Operators did not disclose that the land was state-owned.'),
          ('Promised returns', 'Red flag', 'Income depends on a business that can be closed by the state at any time.')],
  actions=[('Walk away from this deal.', 'Do not sign, reserve or send a deposit.'),
           ('If you already paid, get the paper trail.', 'Collect every receipt, chat and contract; ask a local lawyer about recovery from the operator.'),
           ('For any other cliff or beach plot:', 'ask us to check the plot on the official spatial plan (RTRW) and the coastal setback before anything else.')],
  evidence_intro='Public enforcement records and reporting. No Kolaboro site visit was needed to reach this verdict: the zoning and the demolition are matters of public record.',
  photos=[('uluwatu', 'The protected cliff coastline of the Bukit peninsula (2022). Location photo.'), ('bingin2', 'Bingin Beach at sunset. Location photo.')],
  timeline=[('May 2025', 'Provincial parliament inspection finds businesses on state land without permits'), ('21 Jul 2025', '48 structures demolished'), ('May 2026', 'Badung announces a public redevelopment of the area')],
  scope=PUB_SCOPE, footnote='Sample desk review based on public sources. Not a site visit.',
  sources=[('Honeycombers Bali, 24 Jun 2026', 'https://thehoneycombers.com/bali/bingin-beach-demolition-rebuild/'), ('Bukit Vista, 10 Sep 2025', 'https://www.bukitvista.com/?p=109437')]),
 dict(slug='ocean-tulum', no='KB-S-0002', date='28 Oct 2026', kind='Construction monitoring report · sample, desk review',
  title='Condo at Ocean Tulum, Tulum (Grupo VINSA, per source)',
  facts=[('Prepared for', 'Sample client'), ('Location', 'Tulum, Quintana Roo'), ('Bought', '2022 (per buyers)'), ('Next payment', 'Hold')],
  level='red', risk=5, verdict='Stop paying', risk_label='Very high: buyers report 3+ years of delay and unfinished work.',
  verdict_why='Buyers who bought from 2022 report that they have <b>paid in full</b> and still have <b>no unit and no firm delivery date</b>. Parts of the building are reported at the <b>raw concrete stage</b>, and updates talk about new financing and bridge loans. Do not send another instalment until the work is verified on site.',
  means=['Your payments are ahead of the building.', 'Talk of bridge loans means the project may be short of money to finish.', 'Without a delivery penalty in your contract, the delay costs you, not the developer.'],
  money='Typical exposure: <b>everything paid so far</b>, for a unit that cannot be lived in or rented yet.',
  photo1=('tulum2', 'Tulum, Quintana Roo (June 2024). Location photo, not the project.'), p1h=88,
  checks=[('Land title', 'Not checked', 'Request the deed and the condominium regime registration.'),
          ('Zoning and coast', 'Not checked', 'Confirm land-use permit with the Tulum municipality.'),
          ('Building permits', 'To confirm', 'Ask for the construction licence and whether it is still valid after years of delay.'),
          ('Developer record', 'Concern', 'Public complaints about unfulfilled deliveries and refunds (Tulum Times).'),
          ('Progress on site', 'Red flag', 'Buyers report unfinished areas and raw concrete, 3+ years after purchase (Riviera Maya News, Jun 2026).'),
          ('Where the money goes', 'Red flag', 'Updates on financing and bridge loans suggest the project is underfunded.'),
          ('Contract', 'To confirm', 'Look for a delivery date, a penalty and a refund right.'),
          ('Transparency', 'Concern', 'No firm date; buyers say some posts about the issue were removed. No official response reported.'),
          ('Promised returns', 'Not checked', 'Irrelevant until the unit exists.')],
  actions=[('Hold every further payment.', 'Pay nothing more until a site visit confirms the milestone you are being billed for.'),
           ('Ask the developer in writing for three things:', 'a dated construction schedule, proof of financing to finish, and the status of the construction licence.'),
           ('Book a Kolaboro site visit.', 'GPS-stamped photos of your unit and the common areas, compared with the payment plan.'),
           ('Talk to other buyers and a local lawyer.', 'Group complaints to PROFECO (consumer protection) carry more weight than individual ones.')],
  evidence_intro='Public reporting by local media. Kolaboro has not visited the site. The photos show the location and an example of the raw-concrete stage, not the project.',
  photos=[('mxconstr', 'Raw concrete stage (obra negra): a frame without finishes, Mexico. Illustrative, not the project.'), ('obranegra', 'An unrendered block wall. Illustrative, not the project.')],
  timeline=[('2022', 'Buyers sign and start paying'), ('2023-2025', 'Updates on financing and restarts; units not completed'), ('Jun 2026', 'Buyers go public and ask authorities to investigate')],
  scope=PUB_SCOPE, footnote='Sample desk review based on public sources. Allegations, not findings.',
  sources=[('Riviera Maya News, 17 Jun 2026', 'https://www.rivieramayanews.mx/buyers-report-over-three-year-delays-in-delivery-of-tulum-condos/'), ('Tulum Times', 'https://tulumtimes.com/ocean-tulum-buyers-accuse-grupo-vinsa-of-unfulfilled-deliveries-and-refunds')]),
 dict(slug='menese-riviera-maya', no='KB-S-0003', date='28 Oct 2026', kind='Construction monitoring report · sample, desk review',
  title='Apartment at a Menese development, Tulum / Playa del Carmen',
  facts=[('Prepared for', 'Sample client'), ('Location', 'Tulum and Playa'), ('Price paid (one buyer)', '$97,000'), ('Next payment', 'Hold')],
  level='amb', risk=4, verdict='Hold', risk_label='High: delivery dates moved and disputes in court.',
  verdict_why='Buyers report units bought in <b>June 2023</b> still not handed over, and one buyer who paid <b>$97,000</b> for a unit due around <b>2020</b> is now in an <b>amparo</b> over delay compensation. Before paying anything else, get the delivery terms in writing and check the unit on site.',
  means=['Deadlines that can be moved without a penalty are not deadlines.', 'Disputes over compensation mean your contract terms decide who pays for the delay.', 'Other buyers may be organising a collective complaint: you are not alone.'],
  money='At risk: <b>your instalments paid so far</b> plus years of delay and possible legal costs.',
  photo1=('playa', 'Playa del Carmen, Quintana Roo (2021). Location photo, not the project.'), p1h=88,
  checks=[('Land title', 'Not checked', 'Request the deed and the condominium regime registration.'),
          ('Zoning and coast', 'Not checked', 'Confirm land-use permit.'),
          ('Building permits', 'To confirm', 'Construction licence and its validity after the delays.'),
          ('Developer record', 'Concern', 'Public reports of non-delivery in more than one development.'),
          ('Progress on site', 'Concern', 'Units bought in 2023 reported as not handed over (Aug 2026).'),
          ('Where the money goes', 'To confirm', 'Ask whether payments are held in a bank trust (fideicomiso).'),
          ('Contract', 'Red flag', 'Delivery date was changed; compensation for delay is disputed in court.'),
          ('Transparency', 'Concern', 'No developer response reported by the source.'),
          ('Promised returns', 'Not checked', 'Irrelevant until delivery.')],
  actions=[('Hold the next payment.', 'Until you have a new delivery date in writing with a penalty for missing it.'),
           ('Send us your contract.', 'We mark the delivery, penalty and refund clauses and tell you where you stand.'),
           ('Book a site visit.', 'Is your unit being built at all? We film it with GPS and time.'),
           ('Join forces.', 'Ask the buyer organising the collective complaint for the details; it costs less together.')],
  evidence_intro='Public reporting by local media. Kolaboro has not visited the sites. Photos show the location and an example stage, not the project.',
  photos=[('obranegra', 'Unfinished block wall. Illustrative, not the project.'), ('mxconstr', 'Building frame without finishes, Mexico. Illustrative, not the project.')],
  timeline=[('~2020', 'Original delivery date for one buyer'), ('Jun 2023', 'Another buyer purchases two apartments'), ('Aug 2026', 'Collective complaint being organised; one dispute in an amparo')],
  scope=PUB_SCOPE, footnote='Sample desk review based on public sources. Allegations, not findings.',
  sources=[('Riviera Maya News, 20 Aug 2026', 'https://www.rivieramayanews.mx/buyer-seeks-collective-action-over-undelivered-menese-apartments/')]),
 dict(slug='bali-villa-share', no='KB-S-0004', date='28 Oct 2026', kind='Pre-purchase report · sample, desk review',
  title='Half share in a villa in Badung, Bali, with $1,300 a month promised',
  facts=[('Prepared for', 'Sample client'), ('Location', 'Badung, Bali'), ('Price asked', '$66,000 for 50%'), ('Stage', 'Before paying')],
  level='red', risk=5, verdict='Do not pay', risk_label='Very high: the offer matches a reported fraud pattern.',
  verdict_why='The offer matches a case reported by ABC in March 2024: half shares in a Badung villa for <b>$66,000</b> with <b>$1,300 a month</b> promised. The <b>contracts and locations were false</b>, and victims lost more than $126,000. Before any transfer, the villa must exist, and the seller must own it.',
  means=['$1,300 a month on $66,000 is about 24% a year: far above what villas earn.', 'Paying a person, not a registered company, leaves you no one to pursue.', 'One site visit and one land office check would settle it in a week.'],
  money='At risk: <b>100% of the transfer</b>. In the reported case, there was no asset to recover.',
  photo1=('villa700', 'Villas in Bali\'s hills. Illustrative photo, not related to the case.'), p1h=88,
  checks=[('Land title', 'Red flag', 'No certificate shown in the seller\'s name for the villa offered.'),
          ('Zoning and coast', 'Not checked', 'Irrelevant until the villa is shown to exist.'),
          ('Building permits', 'Not checked', 'As above.'),
          ('Developer record', 'Red flag', 'Seller is an individual, not a registered developer.'),
          ('Progress on site', 'Red flag', 'The contract location did not match a real villa in the reported case.'),
          ('Where the money goes', 'Red flag', 'Transfer to a personal account.'),
          ('Contract', 'Red flag', 'Contracts reported as false.'),
          ('Transparency', 'Red flag', 'Seller unreachable after payment.'),
          ('Promised returns', 'Red flag', 'Fixed 24% a year "income" is a classic fraud signal.')],
  actions=[('Do not transfer anything.', 'Not a deposit, not a "reservation fee".'),
           ('Ask for the land certificate number.', 'We check it at the land office (BPN) and match the owner\'s name.'),
           ('We visit the address in the contract.', 'GPS-stamped video of what is actually there.'),
           ('If you already paid,', 'report to the police in Bali and in your country, and keep every message.')],
  evidence_intro='Public reporting. The photos are illustrative: the villas in the reported case did not exist as described.',
  photos=[('balivilla', 'A real, finished villa resort in Bali. Illustrative only.')],
  timeline=[('Before 2024', 'Investors offered villa shares in Badung'), ('After payment', 'Seller stops responding'), ('23 Mar 2024', 'ABC reports losses above $126,000')],
  scope=PUB_SCOPE.replace('developer', 'seller'), footnote='Sample desk review based on public reporting. No individual is named.',
  sources=[('Own Property Abroad, 9 Apr 2024, citing ABC, 23 Mar 2024', 'https://ownpropertyabroad.com/?p=11260')]),
 dict(slug='bali-014-desk', no='KB-2026-014', date='28 Oct 2026', kind='Pre-purchase report · stage 1, desk review of a live case',
  title='Off-plan villa, Bukit peninsula, Bali (case BALI-014)',
  facts=[('Prepared for', 'Sample client'), ('Price range', '$200k to $400k'), ('Title advertised', 'Leasehold 30 + 30'), ('Completion advertised', '2027')],
  level='amb', risk=3, verdict='Proceed only with 3 conditions', risk_label='Medium until the documents and the site are checked.',
  verdict_why='Nothing we have seen so far is a red flag. The developer publishes price, title type, lease term and completion year. But <b>three promises carry most of your risk</b>, and each needs a document before you sign: the lease extension, the building permit and the projected return.',
  means=['A "30 + 30" lease is only as good as the extension clause.', 'A permit claimed on a website must match this exact plot in the official system.', 'A 10 to 13% projected return assumes occupancy you should see evidence for.'],
  money='Before signing, keep your exposure to a <b>refundable reservation</b> only. Pay the first instalment after the 3 conditions are met.',
  photo1=('uluwatu', 'The Bukit peninsula, Bali. Location photo, not the project.'), p1h=88,
  checks=[('Land title', 'To confirm', 'Advertised as leasehold. Next: certificate and lease registration at the land office.'),
          ('Zoning and coast', 'To confirm', 'Advertised as zoned for short-term rentals. Next: the official spatial plan.'),
          ('Building permits', 'To confirm', 'A permit is claimed. Next: confirm the number and the plot in the official system.'),
          ('Developer record', 'Pending', 'Developer invited to verification on 28 Oct 2026.'),
          ('Progress on site', 'Pending', 'Site visit with GPS video after the documents arrive.'),
          ('Where the money goes', 'Pending', 'Payment plan and account holder to be checked.'),
          ('Contract', 'To confirm', 'Extension advertised: is it binding, with a fixed price?'),
          ('Transparency', 'Pass', 'Price, title type, lease term and completion year are published.'),
          ('Promised returns', 'Concern', '10 to 13% projected: compare with real occupancy and rates nearby.')],
  actions=[('Condition 1: the extension clause.', 'Binding, at a fixed or capped price, registered with the lease.'),
           ('Condition 2: the building permit.', 'PBG number that matches this plot in the official system.'),
           ('Condition 3: proof for the return.', 'Occupancy and nightly rates from comparable villas, not projections.'),
           ('Then: site visit and contract review.', 'We film the plot and read the payment plan before your first instalment.')],
  evidence_intro='What the developer advertises on its own pages, read by the Kolaboro research agent on 28 October 2026. Advertised claims, not verified facts.',
  photos=[('bingin2', 'The Bukit peninsula at sunset. Location photo.')],
  timeline=[('28 Oct 2026', 'Promises read by our AI agent'), ('28 Oct 2026', 'Developer invited to verification'), ('Next', 'Registry checks, then site visit with GPS video')],
  scope='<b>Stage 1 of a full check.</b> Based on the developer\'s public pages and our research agent. Registry searches, site visit and contract review follow. The project is anonymised until the verification is complete and the developer has had 10 working days to reply.',
  footnote='Live case, stage 1. Advertised claims, not verified facts.',
  sources=[('Kolaboro research agent, developer\'s public pages, 28 Oct 2026', 'kolaboro.com/research')]),
]


REPORTS.append(dict(slug='example-safe-to-pay', no='KB-EX-0084', date='28 Oct 2026', kind='Construction monitoring report · illustrative example, fictional project',
  title='Villa Kenanga (fictional), Canggu coast, Bali',
  facts=[('Prepared for', 'Sample client'), ('Price', '$310,000'), ('Milestone', '3 of 6: roof structure'), ('Next payment', '€48,000')],
  level='grn', risk=1, verdict='Safe to pay', risk_label='Low: milestone verified on site; two items to watch.',
  verdict_why='Our agent visited on 27 October with GPS-stamped photos and video. <b>The roof structure is complete and matches the drawings</b>, the permit matches the plot and the developer answered every question. You can pay instalment 3 of 6.',
  means=['What you are paying for exists and matches the plans.', 'The contract protects you: a 1% monthly delay penalty and a refund right after 6 months.', 'Two items to watch: payments are not in escrow, and the 8% yield assumes 70% occupancy.'],
  money='After this payment you will have paid <b>60%</b> for a villa that is about <b>60% built</b>: your money follows the concrete.',
  photo1=('balivilla', 'Illustrative photo for a fictional project.'), p1h=88,
  checks=[('Land title', 'Pass', 'Leasehold certificate checked at the land office; lessor and plot match the contract.'),
          ('Zoning and coast', 'Pass', 'Tourism zone on the spatial plan; outside the coastal setback.'),
          ('Building permits', 'Pass', 'PBG number confirmed for this plot in the official system.'),
          ('Developer record', 'Pass', 'Two earlier projects delivered within 4 months of the promised date.'),
          ('Progress on site', 'Pass', 'Milestone 3 verified on site: 14 photos and 2 videos, GPS ±3 m.'),
          ('Where the money goes', 'Concern', 'Payments go to the developer\'s company account; no escrow.'),
          ('Contract', 'Pass', 'Delivery date with a 1% monthly penalty and a refund right after 6 months.'),
          ('Transparency', 'Pass', 'Replied to every question within 5 days and shared all permits.'),
          ('Promised returns', 'Concern', '8% projected yield is reachable but assumes 70% occupancy.')],
  actions=[('Pay instalment 3 of 6 (€48,000).', 'Use the company account named in your contract and keep the receipt.'),
           ('Ask for a monthly account statement.', 'The developer has agreed to share it on request.'),
           ('Next visit: milestone 4, finishes.', 'Expected in about four months; we will tell you before the invoice arrives.')],
  evidence_intro='Illustrative example with a fictional project, developer and figures, to show what a finished Kolaboro report looks like.',
  photos=[('idconstr', 'Illustrative photo.')],
  timeline=[('Mar 2026', 'Pre-purchase check passed (score 81)'), ('Jun 2026', 'Milestone 2 verified, safe to pay'), ('27 Oct 2026', 'Milestone 3 verified, safe to pay')],
  scope='<b>Illustrative example.</b> Project, developer, people and figures are fictional.', footnote='Illustrative example. Fictional project and data.', sources=[]))

def doc(body):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><style>@font-face{{font-family:Archivo;src:url(file://{FONT}) format("woff2");font-weight:100 900;font-stretch:62% 125%}}{CSS}</style></head><body>{body}</body></html>'

for r in REPORTS:
    open(os.path.join(OUT, f'kolaboro-report-{r["slug"]}.html'), 'w').write(doc(report(r)))
    print(r['slug'])
