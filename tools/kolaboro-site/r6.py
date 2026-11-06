# Round 6: honest copy, agent/developer amounts, Indonesian agent page, consent, breadcrumbs, buyer guides.

HONEST = [
  ('<span class="tag">Most chosen</span>', '<span class="tag">Recommended</span>'),
  ('<span class="tag">El más elegido</span>', '<span class="tag">Recomendado</span>'),
  ('<span class="tag">Live now</span>', '<span class="tag">Launching</span>'),
  ('Local agents, checks and construction monitoring.', 'Our first city: checks and construction monitoring, opening now.'),
  ('Written report in 7 days', 'Written report, usually within 7 days'),
  ('Informe en 7 días', 'Informe, normalmente en 7 días'),
  ('AI checks every document; your agent checks every brick.', 'AI helps cross-check every document; your agent checks every brick.'),
  ('Our AI trains them case by case.', 'Our academy trains them case by case, with AI tools to help on every report.'),
  ('Our AI trains you case by case to verify land, permits and construction for buyers abroad, and every case you complete builds a public track record.',
   'Our academy trains you case by case to verify land, permits and construction for buyers abroad, with AI tools to help, and every case you complete builds a public track record.'),
  ('Learn with your AI coach and shadow real inspections.', 'Learn with the academy and shadow real inspections.'),
  ('Free AI training, no degree needed.', 'Free training, no degree needed.'),
  ('Formación con IA gratis, sin título.', 'Formación gratis, sin título.'),
  ('Visit sites, film milestones with GPS-stamped video, collect documents and write clear reports, with the AI guiding every step.',
   'Visit sites, film milestones with GPS-stamped video, collect documents and write clear reports, with checklists and AI tools to guide you.'),
]

def post_fixes():
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            for a, b in HONEST: s = s.replace(a, b)
            if s != o: open(p, 'w').write(s)

AGENT_PAY = [("Pre-purchase check", "€150", "per check delivered (the buyer pays €490)"),
             ("Monthly site visit", "€40", "per visit and report (the buyer pays €99 a month)"),
             ("Buyer's agent purchase", "40%", "of Kolaboro's fee: about €1,000 on a €250,000 villa"),
             ("City lead", "+10%", "of what the agents in your team earn")]

def agent_pay_section():
    rows = ''.join(f'<tr><td>{a}</td><td><b>{b}</b></td><td>{c}</td></tr>' for a, b, c in AGENT_PAY)
    return f'''<section class="sec alt" id="earnings"><div class="wrap grid2">
  <div><h2>What you earn</h2><p class="lead">Paid by Kolaboro in euros, never by developers or sellers. Launch rates for Bali.</p>
    <div class="prose" style="max-width:none;margin-top:20px"><table><thead><tr><th>Work</th><th>You earn</th><th></th></tr></thead><tbody>{rows}</tbody></table></div></div>
  <div class="out" aria-live="polite" style="position:static">
    <p>Estimate your month</p>
    <form id="ae" onsubmit="return false" style="display:grid;gap:12px;margin:12px 0">
      <label class="f" style="color:var(--paper)">Pre-purchase checks per month<input name="c" inputmode="numeric" value="8"></label>
      <label class="f" style="color:var(--paper)">Monthly site visits<input name="v" inputmode="numeric" value="4"></label>
      <label class="f" style="color:var(--paper)">Purchases as buyer's agent<input name="a" inputmode="numeric" value="0"></label>
    </form>
    <div class="num" id="aen">–</div><p>per month, before tax</p>
    <p class="ev" style="color:#8A949E;margin-top:10px">An estimate from launch rates. Real income depends on the cases in your city.</p>
  </div>
</div></section>'''

AGENT_PAY_JS = '''<script>
(function(){ var f = document.getElementById('ae'); if (!f) return;
  var eur = new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0});
  function n(k){ var v = parseFloat(f[k].value); return isNaN(v) || v < 0 ? 0 : v; }
  function calc(){ document.getElementById('aen').textContent = eur.format(n('c') * 150 + n('v') * 40 + n('a') * 1000); }
  f.addEventListener('input', calc); calc(); })();
</script>'''

def dev_fee_section():
    return '''<section class="sec alt" id="fees"><div class="wrap grid2">
  <div><h2>What it costs, and what you get</h2><p class="lead">One price for every developer. Paying never changes your Score: that's exactly why buyers believe it.</p></div>
  <div class="grid2" style="gap:16px">
    <div class="tile"><h3>Verification</h3><p class="price">€1,500</p><p class="per">one-off, per project</p><ul><li>Registry, permit and company checks</li><li>Site visit with GPS-stamped video</li><li>Private findings first, 10 working days to reply</li><li>Public project page with your reply</li></ul></div>
    <div class="tile hot"><h3>Live badge</h3><p class="price">€200</p><p class="per">per month, per project</p><ul><li>"Verified by Kolaboro" badge for your site and listings</li><li>Re-check at least every 90 days while you build</li><li>Your Score keeps up with your progress</li><li>Listed for buyers who check projects on Kolaboro</li></ul></div>
  </div>
</div></section>'''

def amounts_into_pages():
    fp = os.path.join(OUT, 'agents', 'index.html'); s = open(fp).read()
    s = s.replace('<section class="start" id="start">', agent_pay_section() + '\n<section class="start" id="start">', 1)
    s = s.replace('</body>', AGENT_PAY_JS + '\n</body>', 1)
    open(fp, 'w').write(s)
    fp = os.path.join(OUT, 'developers', 'index.html'); s = open(fp).read()
    s = s.replace('<section class="start" id="start">', dev_fee_section() + '\n<section class="start" id="start">', 1)
    open(fp, 'w').write(s)
    perk_en = [("plus a share of the buyer's agent fee on every purchase you work on.", "€150 per pre-purchase check, €40 per monthly site visit, and 40% of Kolaboro's buyer's agent fee on purchases you work on."),
               ("and visibility to international buyers who check projects on Kolaboro. Paying never changes your Score.", "and visibility to international buyers who check projects on Kolaboro. €1,500 per project, then €200 a month for the live badge. Paying never changes your Score."),
               ("más una parte de la comisión de agente del comprador en cada compra en la que trabajes.", "150 € por chequeo, 40 € por visita mensual y el 40% de la comisión de agente del comprador en las compras en que trabajes."),
               ("Pagar nunca cambia tu nota.", "1.500 € por proyecto y 200 € al mes por el sello. Pagar nunca cambia tu nota.")]
    for root, _, files in os.walk(OUT):
        for fn in files:
            if fn.endswith('.html'):
                p = os.path.join(root, fn); s = open(p).read(); o = s
                s = s.replace("<b>What you earn:</b> a fee for every inspection and report you deliver, plus a share of the buyer's agent fee on every purchase you work on.",
                              "<b>What you earn:</b> €150 per pre-purchase check, €40 per monthly site visit, and 40% of Kolaboro's buyer's agent fee on purchases you work on.")
                for a, b in perk_en[1:]: s = s.replace(a, b)
                if s != o: open(p, 'w').write(s)

def build_agents_id():
    body = phero('<a href="/agents">Agents</a> / Bahasa Indonesia', 'Jadi agen Kolaboro di Bali',
                 'Anda tinggal di Bali dan mengenal daerahnya. Kami melatih Anda untuk memeriksa tanah, izin dan pembangunan untuk pembeli dari luar negeri. Tidak perlu gelar hukum.',
                 '<div class="hero-cta"><a class="btn btn-hi" href="#start" data-ev="agents_id_apply">Daftar sekarang</a></div>')
    rows = ''.join(f'<tr><td>{a}</td><td><b>{b}</b></td></tr>' for a, b in [("Pemeriksaan sebelum pembelian", "€150 per pemeriksaan"), ("Kunjungan lokasi bulanan", "€40 per kunjungan"), ("Agen pembeli", "40% dari komisi Kolaboro"), ("Pemimpin kota", "+10% dari penghasilan tim")])
    body += f'''<section class="sec"><div class="wrap grid3">
  <div class="tile"><h3>Apa yang Anda kerjakan</h3><p>Mengunjungi lokasi proyek, merekam setiap tahap pembangunan dengan video ber-GPS, mengumpulkan dokumen (sertifikat, PBG) dan menulis laporan sederhana.</p></div>
  <div class="tile"><h3>Untuk siapa</h3><p>Insinyur sipil, pengawas proyek, surveyor, arsitek, staf kantor notaris/PPAT, property manager, atau siapa saja yang teliti, jujur dan bisa berbahasa Inggris.</p></div>
  <div class="tile"><h3>Aturan utama</h3><p>Anda bekerja untuk pembeli. Tidak pernah menerima uang, hadiah atau komisi dari developer atau penjual.</p></div>
</div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>Penghasilan</h2><p class="lead">Dibayar oleh Kolaboro dalam euro, tidak pernah oleh developer. Tarif awal untuk Bali.</p></div>
  <div class="prose" style="max-width:none"><table><tbody>{rows}</tbody></table></div>
</div></section>
<section class="start" id="start"><div class="wrap start-grid">
  <div><h2>Daftar dalam 2 menit</h2><p class="lead">Kami sedang merekrut agen pertama di Bali. Isi formulir (boleh dalam bahasa Inggris atau Indonesia) dan kami akan membalas lewat email.</p></div>
  <div>{lead_form("agentidform", role="agent", roles=("agent",), source="yc-agents-id", button="Kirim pendaftaran")}</div>
</div></section>'''
    path = page('/agents/id', 'Jadi agen Kolaboro di Bali', 'Lowongan agen Kolaboro di Bali: periksa tanah, izin dan pembangunan untuk pembeli dari luar negeri. €150 per pemeriksaan.', body, mcta=False)
    fp = os.path.join(OUT, 'agents', 'id', 'index.html'); s = open(fp).read()
    for a, b in [('<html lang="en">', '<html lang="id">'), ('>Name<', '>Nama<'), ('>Continue<', '>Lanjut<'), ('Phone (optional)', 'Telepon / WhatsApp (opsional)'),
                 ('Three quick questions for agents', 'Tiga pertanyaan singkat'), ('Do you live in this city full-time?', 'Apakah Anda tinggal di sini sepanjang tahun?'),
                 ('Your background', 'Latar belakang Anda'), ('Languages you speak', 'Bahasa yang Anda kuasai'), ('>Choose<', '>Pilih<'),
                 ("Sent. We'll be in touch.", 'Terkirim. Kami akan menghubungi Anda.')]:
        s = s.replace(a, b)
    open(fp, 'w').write(s)
    # link from the English agents page
    fp = os.path.join(OUT, 'agents', 'index.html'); s = open(fp).read()
    s = s.replace('<a class="btn btn-hi" href="#start" data-ev="agents_apply">Apply as an agent</a>', '<a class="btn btn-hi" href="#start" data-ev="agents_apply">Apply as an agent</a><a class="btn btn-line" href="/agents/id" hreflang="id">Bahasa Indonesia</a>', 1)
    open(fp, 'w').write(s)
    return path

def build_buyer_guides():
    out = []
    qs = ["Can I see the land certificate number and the name on it before paying a deposit?", "Which company sells to me, and is it the same one that holds the land rights?",
          "Do you have the building approval for this project? Can I see the permit number?", "If I want to rent the home, which licence do I need and who gets it?",
          "Which of your past projects can I visit, and when were they handed over?", "Can you put me in touch with three past buyers I find myself?",
          "Are my payments tied to construction milestones? Which ones?", "Which account do I pay into, and in whose name is it?",
          "Is there an escrow or notary account option?", "What is the delivery date in the contract, and what happens if you're late?",
          "What happens to my money if the project stops?", "Can the design, materials or price change after I sign?",
          "Which law and courts apply to the contract?", "How long is the lease, and what are the extension terms in writing?",
          "Where do the advertised rental figures come from? Can I see real booking data?", "Who manages the property after handover, and at what cost?",
          "What are the yearly costs: service charges, taxes, maintenance?", "Can my own lawyer and an independent inspector review everything before I pay?",
          "Can I resell before completion, and are there fees?", "Will you answer these questions in writing?"]
    li = ''.join(f'<li>{q}</li>' for q in qs)
    email = """Subject: Questions before I reserve [project name]

Hello [name],

Thank you for the information about [project name]. Before I reserve, I'd like to check a few things in writing:

1. The land certificate number and the name of the title holder.
2. The building approval (permit) number for the project.
3. The company I would sign with and pay, and its registration number.
4. How payments are tied to construction milestones, and the account they go to.
5. The delivery date in the contract and what happens if it's late.

I'd also like my own lawyer and an independent inspector to review the documents before I pay any deposit.

Thank you,
[your name]"""
    html_ = f'''<h2 style="margin-top:0">Twenty questions</h2><ol>{li}</ol>
<h2>Copy this email</h2><p>Send it before any deposit. A good developer answers in writing; a hesitant one tells you something too.</p>
<pre class="mail" id="mailtpl">{H.escape(email)}</pre><p><button class="btn btn-line btn-sm" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('mailtpl').textContent);this.textContent='Copied'">Copy email</button></p>'''
    out.append(guide('/guides/questions-to-ask-a-developer', 'Guides', '20 questions to ask a developer before you pay',
                     'Ask them in writing, before any deposit. The answers, and how quickly they come, tell you a lot.', html_,
                     '20 questions to ask a property developer before you pay | Kolaboro', 'The 20 questions to ask an overseas property developer before paying a deposit, plus an email template you can copy.'))
    cl = [("Milestone payments", "\"Each instalment becomes payable only when the corresponding construction stage has been completed and verified by the Buyer or the Buyer's appointed inspector.\""),
          ("Delivery date and penalty", "\"The Developer shall hand over the Property no later than [date]. For each month of delay, the Developer shall pay the Buyer [x]% of the amounts paid.\""),
          ("Refund if not delivered", "\"If the Property is not handed over within [x] months of the delivery date, the Buyer may terminate this Agreement and receive a full refund of all amounts paid within [30] days.\""),
          ("Payments to the contracting company only", "\"All payments shall be made exclusively to [company name]'s account no. [x], held in its own name.\""),
          ("No changes without consent", "\"No change to the design, specifications or price shall apply without the Buyer's written consent.\""),
          ("Retention until handover", "\"The final [5-10]% of the price is payable only after handover and the correction of defects listed at the final inspection.\""),
          ("Right to inspect", "\"The Buyer and the Buyer's appointed inspector may visit the site at reasonable notice at every construction stage.\"")]
    html2 = '<p>Ask your lawyer to include clauses like these. Wording varies by country; these show the idea, not legal text for your contract.</p>' + ''.join(f'<h2>{t}</h2><p>{x}</p>' for t, x in cl)
    out.append(guide('/guides/contract-clauses', 'Guides', 'Seven contract clauses that protect off-plan buyers',
                     'Bring this list to your lawyer. If the developer refuses all of them, that is your answer.', html2,
                     'Seven contract clauses that protect off-plan buyers | Kolaboro', 'Milestone payments, delay penalties, refunds and more: seven clauses to ask for in an off-plan purchase contract.'))
    return out

EU = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE","IS","LI","NO","GB","CH"]

def consent():
    pre = ("<script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};"
           "gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});"
           f"gtag('consent','default',{{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',region:{json.dumps(EU)}}});"
           "try{if(localStorage.getItem('kb-consent')==='yes')gtag('consent','update',{analytics_storage:'granted'});}catch(e){}</script>")
    banner = '''<div class="cc" id="cc" role="dialog" aria-label="Cookies" hidden><p>We use analytics cookies to improve Kolaboro. <a href="/legal/privacy">Privacy</a></p><div><button class="btn btn-line btn-sm" data-cc="no">Only necessary</button><button class="btn btn-hi btn-sm" data-cc="yes">Accept</button></div></div>
<script>(function(){var EU=''' + json.dumps(EU) + ''';var st=null;try{st=localStorage;}catch(e){}var c=st&&st.getItem('kb-consent');if(c)return;
fetch('/api/geo').then(function(r){return r.json();}).then(function(g){if(!g||EU.indexOf(g.country)<0)return;var b=document.getElementById('cc');if(!b)return;b.hidden=false;
b.addEventListener('click',function(e){var v=e.target.getAttribute('data-cc');if(!v)return;try{st&&st.setItem('kb-consent',v);}catch(x){}
if(v==='yes'){if(window.gtag)gtag('consent','update',{analytics_storage:'granted'});if(window.clarity)clarity('consent');}b.hidden=true;});}).catch(function(){});})();</script>'''
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read()
            if 'kb-consent' in s: continue
            # consent defaults go before the gtag loader: the late kbLate loader from build.py (6 Nov 2026) or the old async tag
            late = '<script>(window.kbLate||function(f){'
            if late in s: s = s.replace(late, pre + late, 1)
            else: s = s.replace('<script async src="https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V"></script>', pre + '<script async src="https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V"></script>', 1)
            s = s.replace('</body>', banner + '\n</body>', 1)
            open(p, 'w').write(s)

def breadcrumbs():
    for root, _, files in os.walk(OUT):
        for fn in files:
            if fn != 'index.html': continue
            p = os.path.join(root, fn); rel = os.path.relpath(root, OUT)
            if rel == '.' or rel.startswith('old'): continue
            s = open(p).read()
            m = re.search(r'<title>(.*?)</title>', s); t = H.unescape(m.group(1)).split(' | ')[0] if m else rel
            segs = rel.split(os.sep); items = [{"@type": "ListItem", "position": 1, "name": "Kolaboro", "item": SITE + "/"}]
            for i, sgm in enumerate(segs):
                url = SITE + '/' + '/'.join(segs[:i+1]) + '/'
                items.append({"@type": "ListItem", "position": i + 2, "name": t if i == len(segs) - 1 else sgm.replace('-', ' ').capitalize(), "item": url})
            ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}, ensure_ascii=False) + '</script>'
            s = s.replace('</head>', ld + '\n</head>', 1); open(p, 'w').write(s)

def build_round6():
    out = [build_agents_id()] + build_buyer_guides()
    amounts_into_pages()
    return out

def finish_round6():
    post_fixes(); consent(); breadcrumbs()
