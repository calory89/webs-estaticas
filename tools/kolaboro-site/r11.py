# Round 11: /cases, a live verification pipeline built from real agent data (anonymised until verified).

LIVE = os.path.join(HERE, '..', 'agent', 'latest-live.json')
INVITED = {'nara-villas': '28 Oct 2026', 'suku-residences': '28 Oct 2026', 'prive-pererenan': '28 Oct 2026',
           'core-villas': '28 Oct 2026', 'serenity-village': '28 Oct 2026', 'temple-heights': '28 Oct 2026'}
REGION_OF = [('Bukit peninsula', ['Ungasan','Uluwatu','Pecatu','Bingin','Jimbaran','Bukit Pandawa','Nusa Dua']),
             ('Canggu coast', ['Berawa','Pererenan','Padonan','Munggu','Seseh']), ('Ubud', ['Ubud']),
             ('Tabanan', ['Tabanan']), ('Sanur', ['Sanur'])]
FXU = {'USD': 1.0, 'EUR': 1.08, 'IDR': 1 / 16000.0, 'AUD': 0.65}

def _region(area):
    for r, keys in REGION_OF:
        if any(k.lower() in area.lower() for k in keys): return r
    return 'Bali'

def _band(c):
    p, cur = c.get('price_from'), c.get('currency')
    if not isinstance(p, (int, float)) or cur not in FXU: return 'Price not stated'
    v = p * FXU[cur]
    if v < 10000: return 'Price not stated'
    return 'Under $100k' if v < 100000 else '$100k to $200k' if v < 200000 else '$200k to $400k' if v < 400000 else '$400k and up'

def _d(iso):
    try:
        from datetime import date
        y, m, d = map(int, iso.split('-')); return date(y, m, d).strftime('%-d %b %Y')
    except Exception:
        return iso

def _questions(c):
    q = []
    t = c.get('title_type')
    if t == 'leasehold':
        q.append('Leasehold: is the lease registered, and is the base term the one advertised?')
    elif not t:
        q.append('Title type not stated: leasehold, freehold or a company structure?')
    if c.get('extension_promised'):
        q.append('An extension is promised: is it a binding clause with a fixed price, or only a promise?')
    y = c.get('advertised_yield_pct')
    if isinstance(y, (int, float)) and y >= 12:
        q.append('Advertised rental yield of 12% or more: does real occupancy nearby support it?')
    if c.get('guaranteed_language'):
        q.append('"Guaranteed" returns: who guarantees them, and what happens if they can\'t pay?')
    if c.get('permit_claim'):
        q.append('A building permit is claimed: does it exist in the official system and match this plot?')
    else:
        q.append('No building permit (PBG) mentioned: ask for the number before paying.')
    if c.get('completion_year'):
        q.append(f'Completion advertised for {c["completion_year"]}: does progress on site match?')
    return q[:5]

def build_cases():
    projs = {p['slug']: p for p in json.load(open(os.path.join(HERE, '..', 'agent', 'projects.json')))['projects']}
    live = json.load(open(LIVE)) if os.path.exists(LIVE) else {}
    cases = []
    for i, (slug, p) in enumerate(sorted(projs.items(), key=lambda kv: kv[0])):
        rec = live.get(slug) or {}
        c = rec.get('claims') or {}
        read = rec.get('source') == 'ai'
        cases.append({'id': f'BALI-{i+1:03d}', 'region': _region(p['area']), 'band': _band(c),
                      'done': c.get('completion_year'), 'read': read, 'checked': _d(rec.get('checked', '')),
                      'invited': INVITED.get(slug), 'q': _questions(c) if read else []})
    n_read = sum(1 for c in cases if c['read']); n_inv = sum(1 for c in cases if c['invited'])
    order = {True: 0, False: 1}
    cases.sort(key=lambda c: (order[bool(c['invited'])], c['region'], c['id']))
    data = json.dumps(cases, ensure_ascii=False)
    body = phero('Live cases', 'Live verification pipeline',
                 'Every off-plan project we track in Bali, and exactly where its verification stands. Our AI agent has already read what each developer promises; our local agents verify it on the ground.',
                 '<div class="hero-cta"><a class="btn btn-hi" href="/check" data-ev="cases_check">Check your project</a><a class="btn btn-line" href="/report/sample">What a finished case looks like</a></div>')
    body += f'''<section class="sec"><div class="wrap">
  <ol class="pipe" aria-label="Pipeline">
    <li class="done"><b>{n_read}</b><span>Promises read by our AI agent</span></li>
    <li class="done"><b>{n_inv}</b><span>Projects whose developer we invited to verify</span></li>
    <li><b>0</b><span>Registry checks done</span></li>
    <li><b>0</b><span>Site visits done</span></li>
    <li><b>0</b><span>Verified and published</span></li>
  </ol>
  <p class="note-box" style="margin-top:22px"><b>Why cases are anonymous.</b> We name a project only when its verification is complete and the developer has had 10 working days to reply. Until then you see the area, the price range and the questions our agent will answer, not a verdict.</p>
  <div class="cfilter" role="group" aria-label="Filter by area"><button type="button" class="on" data-r="">All areas</button></div>
  <div class="cgrid" id="cgrid" aria-live="polite"></div>
</div></section>
<section class="sec alt" id="files"><div class="wrap">
  <h2>Case files</h2>
  <p class="lead">Full reports you can download. Real projects from the public record, a live case from our pipeline, and an example of a project that passes.</p>
  <div class="files">
    <a class="file pr" href="/cases/files/kolaboro-case-bingin-beach-bali-2025.pdf" data-ev="case_pdf"><span>Public record · Bali</span><b>Bingin Beach: 48 buildings demolished on the cliff</b><small>State land, protected coast, no permits. 3 of our checks would have flagged it.</small></a>
    <a class="file pr" href="/cases/files/kolaboro-case-ocean-tulum-mexico.pdf" data-ev="case_pdf"><span>Public record · Tulum</span><b>Ocean Tulum: buyers report 3+ years waiting</b><small>Fully paid, still raw concrete. Milestone checks would have stopped the payments.</small></a>
    <a class="file pr" href="/cases/files/kolaboro-case-menese-tulum-playa.pdf" data-ev="case_pdf"><span>Public record · Tulum and Playa</span><b>Menese: apartments bought in 2023 not handed over</b><small>Deadlines moved, disputes in court. The contract decides who carries the delay.</small></a>
    <a class="file pr" href="/cases/files/kolaboro-case-bali-villa-share-scam.pdf" data-ev="case_pdf"><span>Public record · Bali</span><b>The villa that didn't exist: $126,000+ lost</b><small>False contracts and locations. One GPS visit would have ended it.</small></a>
    <a class="file live" href="/cases/files/kolaboro-live-case-BALI-014.pdf" data-ev="case_pdf"><span>Live case · stage 2 of 5</span><b>BALI-014: off-plan villas, Bukit peninsula</b><small>What the developer advertises, and the 5 questions our agent will answer on site.</small></a>
    <a class="file ex" href="/cases/files/kolaboro-example-passing-project.pdf" data-ev="case_pdf"><span>Example · fictional</span><b>What a project that passes looks like</b><small>Trust Score 84, milestone 3 verified, safe to pay.</small></a>
  </div>
  <p class="muted" style="font-size:.85rem;margin-top:14px">Public-record case studies summarise what the cited sources published. Buyers' statements are allegations, not findings; Kolaboro has not inspected those projects.</p>
</div></section>
<section class="sec"><div class="wrap grid2">
  <div><h2>Buying one of these?</h2><p class="lead">If you're about to sign or pay for a project in Bali, we'll move it to the front of the queue.</p></div>
  <div><a class="btn btn-hi" href="/#start" data-role="buyer" data-ev="cases_book">Book a €490 check</a> <a class="btn btn-line" href="/developers" data-ev="cases_dev">I'm the developer</a></div>
</div></section>'''
    js = '''<script>
(function(){
  var D = ''' + data + ''';
  var g = document.getElementById('cgrid'), f = document.querySelector('.cfilter');
  var regions = []; D.forEach(function(c){ if (regions.indexOf(c.region) < 0) regions.push(c.region); });
  regions.forEach(function(r){ f.insertAdjacentHTML('beforeend', '<button type="button" data-r="' + r + '">' + r + '</button>'); });
  function st(c){ return [
    ['Promises read by AI', c.read, c.read ? c.checked : 'Queued'],
    ['Developer invited', !!c.invited, c.invited || 'Next'],
    ['Registry check', false, 'Pending'],
    ['Site visit with GPS video', false, 'Pending'],
    ['Verified, Trust Score published', false, 'Pending'] ]; }
  function render(r){
    g.innerHTML = D.filter(function(c){ return !r || c.region === r; }).map(function(c){
      var s = st(c), done = s.filter(function(x){ return x[1]; }).length;
      return '<article class="case"><header><span class="cid">' + c.id + '</span><span class="cstat ' + (c.invited ? 'inv' : '') + '">' + (c.invited ? 'Developer invited' : (c.read ? 'Promises read' : 'Queued')) + '</span></header>' +
        '<h3>Off-plan project · ' + c.region + '</h3><p class="cmeta">' + c.band + (c.done ? ' · completion advertised ' + c.done : '') + '</p>' +
        '<div class="cbar" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="' + done + '" aria-label="' + done + ' of 5 steps done"><i style="width:' + (done/5*100) + '%"></i></div>' +
        '<details><summary>Steps and what our agent will check</summary><ol class="csteps">' + s.map(function(x){ return '<li class="' + (x[1] ? 'ok1' : '') + '"><span>' + x[0] + '</span><small>' + x[2] + '</small></li>'; }).join('') + '</ol>' +
        (c.q.length ? '<p class="cq-h">Questions for the site visit</p><ul class="cq">' + c.q.map(function(q){ return '<li>' + q + '</li>'; }).join('') + '</ul>' : '') + '</details></article>';
    }).join('');
  }
  f.addEventListener('click', function(e){ var b = e.target.closest('button'); if (!b) return;
    f.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); }); render(b.dataset.r); });
  render('');
})();
</script>'''
    return page('/cases', 'Live verification pipeline: Bali off-plan projects | Kolaboro',
                'Every off-plan project Kolaboro tracks in Bali and where its verification stands: promises read by our AI agent, developers invited, registry checks and site visits.', body, extra_js=js)

CASES_CSS = '''
.files{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:26px}
.file{display:block;text-decoration:none;background:var(--paper);border-radius:20px;padding:18px 18px 18px 64px;position:relative;border:1px solid var(--line);transition:transform .15s,box-shadow .15s}
.file:hover{transform:translateY(-2px);box-shadow:0 14px 30px -18px rgba(0,0,0,.4)}
.file::before{content:"PDF";position:absolute;left:16px;top:18px;width:36px;height:44px;border-radius:6px;background:var(--ink);color:#fff;font-size:.62rem;font-weight:800;display:grid;place-items:end center;padding-bottom:6px}
.file.pr::before{background:#B83A05}.file.live::before{background:#0B7A55}
.file span{font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.file b{display:block;font-size:1.02rem;line-height:1.25;margin-top:4px}
.file small{display:block;font-size:.86rem;color:var(--ink-2);margin-top:6px;line-height:1.35}

.pipe{list-style:none;padding:0;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;counter-reset:p}
.pipe li{background:var(--paper);border:2px solid var(--line);border-radius:18px;padding:16px;position:relative}
.pipe li b{display:block;font-size:2.2rem;font-stretch:120%;line-height:1;font-variant-numeric:tabular-nums}
.pipe li span{display:block;font-size:.88rem;color:var(--ink-2);margin-top:6px;line-height:1.3}
.pipe li.done{border-color:#2FB27E;background:#DDEFE7}
.cfilter{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 18px}
.cfilter button{font:inherit;font-size:.9rem;font-weight:700;border:2px solid var(--ink);background:transparent;border-radius:999px;padding:.5rem 1rem;cursor:pointer;min-height:44px}
.cfilter button.on{background:var(--ink);color:var(--paper)}
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;align-items:start}
.case{background:var(--paper);border-radius:20px;padding:18px;border:1px solid var(--line)}
.case header{display:flex;justify-content:space-between;align-items:center;gap:8px}
.cid{font-size:.78rem;font-weight:800;letter-spacing:.04em;color:var(--muted);font-variant-numeric:tabular-nums}
.cstat{font-size:.74rem;font-weight:800;padding:4px 9px;border-radius:999px;background:#E3E2DD;color:var(--ink)}
.cstat.inv{background:#FFE3D4;color:#8A2D04}
.case h3{font-size:1.08rem;margin-top:12px}
.cmeta{font-size:.88rem;color:var(--muted);margin-top:4px}
.cbar{height:6px;border-radius:6px;background:#E3E2DD;margin-top:14px;overflow:hidden}
.cbar i{display:block;height:100%;background:#2FB27E;border-radius:6px}
.case details{margin-top:12px}
.case summary{cursor:pointer;font-weight:700;font-size:.9rem;min-height:32px;display:flex;align-items:center}
.csteps{list-style:none;padding:0;margin-top:8px;display:grid;gap:6px}
.csteps li{display:flex;justify-content:space-between;gap:10px;font-size:.86rem;padding-left:22px;position:relative}
.csteps li::before{content:"";position:absolute;left:0;top:3px;width:14px;height:14px;border-radius:50%;border:2px solid #B8BEC4}
.csteps li.ok1::before{background:#2FB27E;border-color:#2FB27E}
.csteps small{color:var(--muted);white-space:nowrap}
.cq-h{font-size:.82rem;font-weight:800;margin-top:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.cq{margin:6px 0 0 1.1em;font-size:.88rem;display:grid;gap:4px}
@media (max-width:820px){.pipe{grid-template-columns:repeat(2,1fr)}.pipe li:last-child{grid-column:1/-1}}
'''

HOME_CASES = '''<section class="checkbar" aria-label="Live cases"><div class="wrap checkbar-in">
  <div><h2>Not a promise. A pipeline.</h2><p>Every off-plan project we track in Bali, and where its verification stands today: promises read by our AI, developers invited, registry and site checks next.</p></div>
  <div class="stats mini"><div class="stat"><b>{n}</b><span>projects in the pipeline</span></div><div class="stat"><b>{inv}</b><span>developers invited</span></div><div class="stat"><a class="btn btn-hi" href="/cases" data-ev="home_cases">See live cases</a></div></div>
</div></section>
'''

def r11_inject():
    src = os.path.join(HERE, 'cases_pdf'); dst = os.path.join(OUT, 'cases', 'files')
    if os.path.isdir(src):
        os.makedirs(dst, exist_ok=True)
        for f in os.listdir(src):
            if f.endswith('.pdf'): shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(CASES_CSS)
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    if 'aria-label="Live cases"' not in s:
        n = len(json.load(open(os.path.join(HERE, '..', 'agent', 'projects.json')))['projects'])
        s = s.replace('<section class="score" id="score">', HOME_CASES.format(n=n, inv=len(set(['balitecture','urban','core','gbh','investland']))) + '\n<section class="score" id="score">', 1)
        open(fp, 'w').write(s)
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            s = s.replace('<li><a href="/research">Research agent</a></li>', '<li><a href="/cases">Live cases</a></li>\n        <li><a href="/research">Research agent</a></li>', 1)
            if s != o: open(p, 'w').write(s)
