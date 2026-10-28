# Round 12: agent field app (/agents/visit), how we choose and pay agents, cases from live agent data.

MILESTONES = {
  'foundations': ['Slab matches the plan dimensions', 'Rebar visible and spaced as drawn', 'Plot boundaries match the certificate map', 'No standing water or erosion at the edges'],
  'structure': ['Columns and beams complete on every floor', 'Wall openings match the drawings', 'No visible cracks in columns', 'Workers and materials on site today'],
  'roof': ['Roof frame complete', 'Covering installed or delivered', 'Gutters and drainage planned', 'Height matches the permit drawings'],
  'finishes': ['Electrical and plumbing first fix done', 'Windows and doors installed', 'Bathrooms tiled', 'Pool shell built (if sold with a pool)'],
  'handover': ['Occupancy certificate (SLF) shown', 'Everything in the contract is delivered', 'Snag list agreed with dates', 'Keys and documents handed to the buyer'],
}

def build_visit():
    ms = json.dumps(MILESTONES)
    body = phero('Agents', 'Kolaboro site visit',
                 'The tool our agents use on site. Every photo is stamped with GPS, time and a fingerprint, so nobody can swap it later. Try it on your phone: in demo mode nothing leaves your device.')
    body += '''<section class="sec"><div class="wrap">
  <div class="visit" id="visit">
    <div class="v-row">
      <label class="f">Case<input id="v-case" value="BALI-014" maxlength="20"></label>
      <label class="f">Milestone<select id="v-ms"><option value="foundations">1 · Foundations</option><option value="structure">2 · Structure and walls</option><option value="roof" selected>3 · Roof structure</option><option value="finishes">4 · Finishes</option><option value="handover">5 · Handover</option></select></label>
    </div>
    <div class="v-gps" id="v-gps"><span class="v-dot"></span><span id="v-gps-t">Location not captured yet</span><button type="button" class="btn btn-sm btn-line" id="v-gps-b">Capture location</button></div>
    <h2 class="v-h">Checklist</h2>
    <ul class="v-list" id="v-list"></ul>
    <h2 class="v-h">Photos and video</h2>
    <label class="btn btn-hi v-cam"><input type="file" id="v-file" accept="image/*" capture="environment" multiple hidden>Take or add photos</label>
    <div class="v-photos" id="v-photos"></div>
    <label class="f" style="margin-top:18px">Agent notes<textarea id="v-notes" maxlength="2000" placeholder="What you saw, who you spoke to, anything that doesn't match the plans"></textarea></label>
    <div class="v-verdict" role="group" aria-label="Verdict">
      <button type="button" data-v="safe">Safe to pay</button><button type="button" data-v="hold">Hold payment</button><button type="button" data-v="flag">Red flag</button>
    </div>
    <div class="v-out"><button type="button" class="btn btn-hi" id="v-rep">Create visit report</button><span class="muted" id="v-status" aria-live="polite"></span></div>
  </div>
  <div class="v-report" id="v-report" hidden></div>
  <p class="muted" style="font-size:.85rem;margin-top:18px">Demo mode: photos and data stay on this device. Real visits are uploaded to the buyer's case with the same fingerprints.</p>
</div></section>'''
    js = '''<script>
(function(){
  var M = ''' + ms + ''';
  var $ = function(i){ return document.getElementById(i); }, pos = null, photos = [], verdict = '';
  function list(){ var k = $('v-ms').value; $('v-list').innerHTML = M[k].map(function(t, i){ return '<li><label><input type="checkbox" id="c' + i + '"><span>' + t + '</span></label></li>'; }).join(''); }
  $('v-ms').addEventListener('change', list); list();
  function stamp(){ return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'; }
  $('v-gps-b').addEventListener('click', function(){
    if (!navigator.geolocation) { $('v-gps-t').textContent = 'This device cannot share its location'; return; }
    $('v-gps-t').textContent = 'Locating…';
    navigator.geolocation.getCurrentPosition(function(p){ pos = p.coords; $('v-gps').classList.add('on');
      $('v-gps-t').textContent = pos.latitude.toFixed(5) + ', ' + pos.longitude.toFixed(5) + ' · ±' + Math.round(pos.accuracy) + ' m · ' + stamp(); },
      function(){ $('v-gps-t').textContent = 'Location blocked. Allow it in your browser to stamp photos.'; }, { enableHighAccuracy: true, timeout: 15000 });
  });
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0' + b.toString(16)).slice(-2); }).join(''); }
  $('v-file').addEventListener('change', function(e){
    Array.prototype.forEach.call(e.target.files, function(f){
      var fr = new FileReader();
      fr.onload = function(){
        var buf = fr.result, when = stamp(), where = pos ? pos.latitude.toFixed(5) + ', ' + pos.longitude.toFixed(5) + ' ±' + Math.round(pos.accuracy) + ' m' : 'no GPS';
        var done = function(h){
          var img = new Image(); img.onload = function(){
            var c = document.createElement('canvas'), w = Math.min(1600, img.width), r = w / img.width; c.width = w; c.height = Math.round(img.height * r);
            var x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
            var bh = Math.max(44, c.height * .09); x.fillStyle = 'rgba(10,16,22,.72)'; x.fillRect(0, c.height - bh, c.width, bh);
            x.fillStyle = '#fff'; x.font = '600 ' + Math.round(bh * .32) + 'px Archivo, sans-serif';
            x.fillText($('v-case').value + ' · ' + where + ' · ' + when, 12, c.height - bh * .55);
            x.fillStyle = '#FFB48F'; x.font = '600 ' + Math.round(bh * .24) + 'px monospace'; x.fillText('sha256 ' + h.slice(0, 32) + '…', 12, c.height - bh * .18);
            var url = c.toDataURL('image/jpeg', .82); photos.push({ url: url, hash: h, when: when, where: where, name: f.name });
            $('v-photos').insertAdjacentHTML('beforeend', '<figure><img src="' + url + '" alt="Stamped site photo ' + photos.length + '"><figcaption>' + when + '</figcaption></figure>');
            $('v-status').textContent = photos.length + (photos.length === 1 ? ' photo' : ' photos') + ' stamped';
          }; img.src = URL.createObjectURL(f);
        };
        if (window.crypto && crypto.subtle) crypto.subtle.digest('SHA-256', buf).then(function(d){ done(hex(d)); }); else done('unavailable');
      };
      fr.readAsArrayBuffer(f);
    });
  });
  document.querySelectorAll('.v-verdict button').forEach(function(b){ b.addEventListener('click', function(){ verdict = b.dataset.v;
    document.querySelectorAll('.v-verdict button').forEach(function(x){ x.classList.toggle('on', x === b); }); }); });
  $('v-rep').addEventListener('click', function(){
    var k = $('v-ms').value, items = M[k].map(function(t, i){ return [t, $('c' + i).checked]; }), ok = items.filter(function(i){ return i[1]; }).length;
    var V = { safe: ['Safe to pay', 'safe'], hold: ['Hold payment', 'hold'], flag: ['Red flag', 'flag'] }[verdict] || ['No verdict yet', ''];
    var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };
    $('v-report').innerHTML = '<div class="rep-h"><div><span class="muted">Kolaboro visit report</span><h2>' + esc($('v-case').value) + ' · ' + esc($('v-ms').selectedOptions[0].text) + '</h2></div><span class="pill ' + (V[1] === 'safe' ? 'safe' : '') + '">' + V[0] + '</span></div>' +
      '<p><b>Location:</b> ' + (pos ? pos.latitude.toFixed(5) + ', ' + pos.longitude.toFixed(5) + ' (±' + Math.round(pos.accuracy) + ' m)' : 'not captured') + ' · <b>Created:</b> ' + stamp() + '</p>' +
      '<p><b>Checklist:</b> ' + ok + ' of ' + items.length + ' confirmed</p><ul>' + items.map(function(i){ return '<li>' + (i[1] ? '✓ ' : '✗ ') + esc(i[0]) + '</li>'; }).join('') + '</ul>' +
      (esc($('v-notes').value) ? '<p><b>Notes:</b> ' + esc($('v-notes').value) + '</p>' : '') +
      '<div class="v-photos">' + photos.map(function(p){ return '<figure><img src="' + p.url + '" alt=""><figcaption>' + p.when + '<br><code>' + p.hash.slice(0, 16) + '…</code></figcaption></figure>'; }).join('') + '</div>' +
      '<div class="v-out"><button type="button" class="btn btn-line" onclick="window.print()">Save as PDF</button></div>';
    $('v-report').hidden = false; $('v-report').scrollIntoView({ behavior: 'smooth' });
    if (window.kbEvent) kbEvent('visit_report', { photos: photos.length, verdict: verdict });
  });
})();
</script>'''
    out = page('/agents/visit', 'Kolaboro site visit: the agent field tool', 'The tool Kolaboro agents use on site: GPS- and time-stamped photos with a fingerprint, a milestone checklist and a visit report. Try it in demo mode.', body, extra_js=js, mcta=False)
    return out

VISIT_CSS = '''
.visit{background:var(--paper);border-radius:24px;padding:clamp(16px,3vw,28px);border:1px solid var(--line);max-width:760px}
.v-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.visit select,.visit input:not([type=checkbox]):not([type=file]),.visit textarea{width:100%;font:inherit;padding:.75rem .9rem;border-radius:12px;border:2px solid var(--line);background:#fff;min-height:48px}
.visit textarea{min-height:110px}
.v-gps{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding:12px 14px;border-radius:14px;background:#EFEDE7;font-variant-numeric:tabular-nums;font-size:.92rem}
.v-gps span#v-gps-t{flex:1;min-width:180px}
.v-dot{width:10px;height:10px;border-radius:50%;background:#B8BEC4}
.v-gps.on .v-dot{background:#2FB27E;box-shadow:0 0 0 4px rgba(47,178,126,.25)}
.v-h{font-size:1.2rem;margin-top:24px}
.v-list{list-style:none;padding:0;margin-top:10px;display:grid;gap:8px}
.v-list label{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:12px;background:#fff;border:1px solid var(--line);cursor:pointer;min-height:48px}
.v-list input{width:22px;height:22px;accent-color:#2FB27E}
.v-cam{margin-top:12px;cursor:pointer}
.v-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px}
.v-photos figure{margin:0}
.v-photos img{width:100%;border-radius:10px;display:block}
.v-photos figcaption{font-size:.72rem;color:var(--muted);margin-top:4px;word-break:break-all}
.v-verdict{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}
.v-verdict button{font:inherit;font-weight:700;border:2px solid var(--ink);background:transparent;border-radius:999px;padding:.7rem 1.1rem;cursor:pointer;min-height:48px}
.v-verdict button.on[data-v=safe]{background:#2FB27E;border-color:#2FB27E;color:#06261A}
.v-verdict button.on[data-v=hold]{background:#FFD54A;border-color:#FFD54A}
.v-verdict button.on[data-v=flag]{background:#D9480F;border-color:#D9480F;color:#fff}
.v-out{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:20px}
.v-report{margin-top:28px;background:#fff;border-radius:24px;padding:clamp(16px,3vw,28px);border:2px solid var(--ink);max-width:760px}
.rep-h{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.v-report ul{margin:8px 0 0 1.1em}
.v-report p{margin-top:10px}
.v-report .pill{background:#E3E2DD;color:var(--ink)}
.v-report .pill.safe{background:#2FB27E;color:#06261A}
@media (max-width:560px){.v-row{grid-template-columns:1fr}}
@media print{.visit,.phero,.sec>.wrap>p.muted{display:none!important}.v-report{border:0}}
'''

def build_choose():
    body = phero('Agents', 'How we choose and pay our agents',
                 'An agent is only as good as their independence. Here is exactly who we hire, how we check their work and how they are paid, so you can judge it yourself.')
    body += '''<section class="sec"><div class="wrap grid2">
  <div><h2>Who can become a Kolaboro agent</h2></div>
  <div class="prose"><ul>
    <li><b>Local and on the ground.</b> They live where you're buying and can be on site within 48 hours.</li>
    <li><b>Technical background preferred.</b> Architects, engineers, surveyors and site supervisors first; sharp generalists only after training.</li>
    <li><b>No conflicts.</b> They can't work for a developer, a sales agency or a notary involved in a project they check. They sign a conflict declaration for every case.</li>
    <li><b>Background check.</b> ID, references and a short trial visit before the first paid case.</li>
  </ul></div>
</div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>How we train and check them</h2></div>
  <div class="prose"><ol>
    <li><b>Kolaboro Academy.</b> Ten lessons and an exam on titles, permits, contracts and construction milestones. <a href="/academy">See the academy</a>.</li>
    <li><b>The same tool for every visit.</b> GPS- and time-stamped photos with a fingerprint, and a fixed checklist per milestone. <a href="/agents/visit">Try the tool</a>.</li>
    <li><b>Second review.</b> Every report is checked by a second person and by our AI before the buyer sees it.</li>
    <li><b>Spot checks.</b> We revisit a sample of sites unannounced. An agent who fakes a visit is out for good.</li>
  </ol></div>
</div></section>
<section class="sec"><div class="wrap grid2">
  <div><h2>How they are paid</h2><p class="lead">Always by Kolaboro, never by the seller, and never by results that favour a sale.</p></div>
  <div><table class="ptable"><tr><th>Work</th><th>Agent earns</th><th>Buyer pays</th></tr>
    <tr><td>Pre-purchase check</td><td><b>€150</b></td><td>€490</td></tr>
    <tr><td>Monthly site visit</td><td><b>€40</b> per visit</td><td>€99 a month</td></tr>
    <tr><td>Buyer's agent purchase</td><td><b>40%</b> of our fee</td><td>1% of the price, min. €2,000</td></tr>
    <tr><td>City lead</td><td><b>+10%</b> of the team's earnings</td><td>Nothing extra</td></tr></table>
  <p class="muted" style="margin-top:12px;font-size:.9rem">Agents are paid the same whether the verdict is "safe to pay" or "hold". A red flag that saves a buyer's money earns the same as a green light.</p></div>
</div></section>
<section class="sec alt"><div class="wrap grid2">
  <div><h2>Want to be one?</h2><p class="lead">We're recruiting our first agents in Bali, then Mexico.</p></div>
  <div><a class="btn btn-hi" href="/agents" data-ev="choose_apply">Apply as an agent</a></div>
</div></section>'''
    return page('/agents/how-we-choose', 'How Kolaboro chooses and pays its agents', 'Who can become a Kolaboro agent, how we train and check them, and how they are paid: always by Kolaboro, never by the seller.', body)

CHOOSE_CSS = '''
.ptable{width:100%;border-collapse:collapse;background:var(--paper);border-radius:16px;overflow:hidden}
.ptable th,.ptable td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);font-size:.95rem}
.ptable th{font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
'''

def build_round12():
    return [build_visit(), build_choose()]

def r12_inject():
    pc = os.path.join(HERE, '..', 'agent', 'data', 'public-bali-cases.json')
    if os.path.exists(pc): os.makedirs(os.path.join(OUT, 'data'), exist_ok=True); shutil.copy(pc, os.path.join(OUT, 'data', 'bali-cases.json'))
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(VISIT_CSS + CHOOSE_CSS)
    fp = os.path.join(OUT, 'agents', 'index.html')
    if os.path.exists(fp):
        s = open(fp).read()
        if '/agents/visit' not in s:
            band = '<section class="sec"><div class="wrap grid2"><div><h2>Your tool on site</h2><p class="lead">Every photo you take is stamped with GPS, time and a fingerprint. Try it now on your phone.</p></div><div><a class="btn btn-hi" href="/agents/visit" data-ev="agents_visit_tool">Open the site visit tool</a> <a class="btn btn-line" href="/agents/how-we-choose">How we choose and pay agents</a></div></div></section>\n'
            s = s.replace('</main>', band + '</main>', 1); open(fp, 'w').write(s)
    # /cases reads the agent's weekly file when available
    fp = os.path.join(OUT, 'cases', 'index.html')
    if os.path.exists(fp):
        s = open(fp).read()
        s = s.replace("  render('');\n})();", "  render('');\n  if (window.fetch) fetch('/data/bali-cases.json', { cache: 'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d && d.cases && d.cases.length) { D = d.cases; render(''); } }).catch(function(){});\n})();", 1)
        open(fp, 'w').write(s)
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); s = open(p).read(); o = s
            s = s.replace('<li><a href="/cases">Live cases</a></li>', '<li><a href="/cases">Live cases</a></li>\n        <li><a href="/agents/how-we-choose">How we choose agents</a></li>', 1)
            if s != o: open(p, 'w').write(s)
