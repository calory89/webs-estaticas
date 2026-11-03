/* Kolaboro client portal: evidence locker, documents, plot map, satellite watch, case report PDF, email preferences */
(function(){
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/';
  var CACHE = {}, BUSY = {}, MAP = null;
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function rpc(token, action, payload){ return KB.rpc('kolaboro_case', { p_token: token, p_action: action, p_payload: payload }); }
  function fmt(t){ if (!t) return ''; var d = new Date(t); return d.toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' }) + ' · ' + d.toTimeString().slice(0,5); }
  function short(h){ return h ? h.slice(0, 10) + '…' + h.slice(-6) : ''; }
  var SRI = { 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js': 'sha384-NElt3Op+9NBMCYaef5HxeJmU4Xeard/Lku8ek6hoPTvYkQPh3zLIrJP7KiRocsxO', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css': 'sha384-c6Rcwz4e4CITMbu/NBmnNS8yN2sC3cUElMEMfP3vqqKFp7GOYaaBBCqmaWBjmkjb', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js': 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js': 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU' };
  function load(s){ return new Promise(function(res, rej){ if (document.querySelector('script[src="' + s + '"]')) { var t = setInterval(function(){ if (window.__kbl && window.__kbl[s]) { clearInterval(t); res(); } }, 50); return; } var e = document.createElement('script'); e.src = s; if (SRI[s]) { e.integrity = SRI[s]; e.crossOrigin = 'anonymous'; } e.onload = function(){ (window.__kbl = window.__kbl || {})[s] = 1; res(); }; e.onerror = rej; document.head.appendChild(e); }); }
  function css(h){ if (document.querySelector('link[href="' + h + '"]')) return; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; if (SRI[h]) { l.integrity = SRI[h]; l.crossOrigin = 'anonymous'; } document.head.appendChild(l); }
  function fileUrl(f){ return new Promise(function(res){ var r = new FileReader(); r.onload = function(){ res(r.result); }; r.readAsDataURL(f); }); }
  function shrink(src, max, q){ return new Promise(function(res, rej){ var im = new Image(); im.onload = function(){ var s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q || .85)); }; im.onerror = rej; im.src = src; }); }
  var KIND = { photo: ['📷','Site photo'], document: ['📄','Document'], note: ['📝','Agent note'], satellite: ['🛰','Satellite'], plot: ['📍','Plot map'], report: ['📘','Report'] };
  var DOCT = [['auto','Let Kolaboro work it out'],['certificate','Land certificate (SHM, SHGB, Hak Pakai)'],['contract','Sale or reservation contract (PPJB, SPA)'],['permit','Building permit (PBG, IMB, SLF)'],['company','Company deed or registration (Akta, NIB)'],['invoice','Invoice or payment request']];
  var LANGS = [['en','English'],['es','Español'],['de','Deutsch'],['fr','Français'],['nl','Nederlands'],['ru','Русский'],['zh','中文'],['id','Bahasa Indonesia']];

  // ---------- chain: the same formula the database uses, so anyone can recompute it ----------
  function sha256hex(t){ return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function(b){ return [].map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }); }
  function iso(t){ return t ? new Date(t).toISOString().slice(0, 19) + 'Z' : ''; }
  window.KBChain = function(caseId, ev){
    var prev = null, i = 0, bad = [];
    function step(){
      if (i >= ev.length) return Promise.resolve({ ok: !bad.length, bad: bad, head: prev });
      var e = ev[i];
      return sha256hex((prev || 'genesis:' + caseId) + '|' + e.sha256 + '|' + e.kind + '|' + iso(e.taken_at)).then(function(h){ if (h !== e.chain || (e.prev || null) !== prev) bad.push(e.id); prev = e.chain; i++; return step(); });
    }
    return step();
  };

  function evHtml(c, x){
    var ev = x.evidence || [], acc = ev.filter(function(e){ return e.status === 'accepted'; });
    var head = acc.length ? ev[ev.length - 1].chain : null;
    var h = '<section class="ap-card" id="evidence"><div class="x-head"><h2>Evidence locker</h2><button class="ap-btn x-sm" id="xadd">+ Add a document</button></div>' +
      '<p class="ap-small ap-muted" style="margin-top:0">Every document, photo and satellite image in your case is fingerprinted and chained to the previous one, so nothing can be changed or removed later without it showing. The latest fingerprint is timestamped in Bitcoin when you download your case report.</p>';
    if (!ev.length) h += '<div class="ap-empty">Nothing here yet. Add your contract, the land certificate or a payment request and we read it for you in about a minute. Your agent\'s photos appear here as they are taken on site.</div>';
    else {
      h += '<div class="x-chain"><span><b>' + acc.length + '</b> items · chain <code title="' + esc(head) + '">' + short(head) + '</code></span><span id="xchk" class="ap-small ap-muted">checking…</span></div><ul class="x-ev">';
      ev.slice().reverse().forEach(function(e){
        var k = KIND[e.kind] || ['•', e.kind], m = e.meta || {}, sub = [];
        if (e.by) sub.push(e.by === 'agent' ? 'your agent' : e.by === 'buyer' ? 'you' : e.by);
        if (e.lat) sub.push('GPS ' + (+e.lat).toFixed(5) + ', ' + (+e.lng).toFixed(5) + (e.acc ? ' ±' + Math.round(e.acc) + ' m' : ''));
        var extra = '';
        if (e.kind === 'document' && m.result) { var r = m.result, fl = (r.flags || []).length, mm = (r.mismatches || []).length; extra = '<div class="x-doc">' + esc(r.summary || '') + (fl || mm ? '<br><b>' + (mm ? mm + ' mismatch' + (mm > 1 ? 'es' : '') : '') + (mm && fl ? ' · ' : '') + (fl ? fl + ' point' + (fl > 1 ? 's' : '') + ' to check' : '') + '</b>' : '') + '</div>'; }
        if (e.kind === 'note' && m.text) extra = '<div class="x-doc">“' + esc(m.text) + '”</div>';
        if (e.kind === 'satellite') extra = '<div class="x-doc">' + esc(m.summary || '') + '</div>';
        if (e.status === 'rejected') extra += '<div class="x-doc" style="color:#B54708">Rejected automatically: ' + esc(e.reason) + '</div>';
        h += '<li class="' + esc(e.status) + '"><i>' + k[0] + '</i><div><b>' + esc(e.title || k[1]) + '</b><small>' + k[1] + ' · ' + fmt(e.taken_at || e.at) + (sub.length ? ' · ' + esc(sub.join(' · ')) : '') + '</small>' + extra +
          '<small class="x-hash" title="SHA-256 of the file">fingerprint ' + short(e.sha256) + '</small></div>' + (e.file ? '<button class="x-view" data-v="' + e.id + '">View</button>' : '') + '</li>';
      });
      h += '</ul>';
    }
    return h + '</section>';
  }

  function plotHtml(c, x){
    var s = x.sat_last, certArea = x.cert_area_m2 || lastCertArea(x);
    return '<section class="ap-card" id="plot"><h2>Your plot</h2><p class="ap-small ap-muted" style="margin-top:0">Put a pin on your plot (or trace its outline). Your agent\'s photos are checked against this point, and our satellite watch compares it with Sentinel-2 images every time a new cloud-free one is taken.</p>' +
      '<div id="xmap" class="x-map"></div><div class="x-tools"><button class="ap-btn x-sm x-line" id="xpin">📍 Place pin</button><button class="ap-btn x-sm x-line" id="xdraw">✏️ Trace outline</button><button class="ap-btn x-sm x-line" id="xclr">Clear</button><input id="xsearch" placeholder="Search a place (e.g. Pecatu, Bali)"></div>' +
      '<div class="x-area"><div><span>Traced on the map</span><b id="xarea">' + (x.plot_area_m2 ? Math.round(x.plot_area_m2) + ' m²' : '-') + '</b></div><div><span>On the certificate</span><b><input id="xcert" type="number" min="0" value="' + (certArea || '') + '" placeholder="m²"></b></div><div><span>Difference</span><b id="xdiff">—</b></div></div>' +
      '<button class="ap-btn" id="xsave" style="margin-top:10px">Save the plot</button>' +
      '<div class="x-sat">' + (x.lat ? (s ? '<b>🛰 Satellite watch on.</b> Last comparison ' + fmt(s.at) + ': ' + esc(s.summary || '') : '<b>🛰 Satellite watch on.</b> First comparison within 24 hours of saving the plot (Sentinel-2, 10 m per pixel).') : 'Satellite watch starts when you save the plot.') + '</div></section>';
  }
  function lastCertArea(x){ var a = null; (x.evidence || []).forEach(function(e){ var r = e.meta && e.meta.result; if (r && r.area_m2) a = r.area_m2; }); return a; }

  function sideHtml(c, x){
    return '<section class="ap-card" id="xreport"><h2>Case file</h2><p class="ap-small ap-muted" style="margin-top:0">A PDF of everything in your case today: status, documents read, photos with GPS and time, satellite results and the fingerprint chain, with a QR code anyone can scan to check it wasn\'t changed.</p>' +
      '<button class="ap-btn" id="xpdf">Download case file (PDF)</button> <button class="ap-btn x-line" id="xjson">Evidence data (JSON)</button></section>' +
      '<section class="ap-card" id="xshare"><h2>Share your case</h2><p class="ap-small ap-muted" style="margin-top:0">A read-only page for your lawyer, bank or partner: stage, verdict, how many documents and photos are sealed, and the fingerprint chain. No documents, no personal details.</p><label class="ap-small" style="display:flex;gap:8px;align-items:center;margin:0 0 10px"><input type="checkbox" id="xshp" style="width:auto"> Show the project name and our note</label><button class="ap-btn x-sm" id="xshb">Create a share link</button><div id="xsho"></div></section>' +
      '<section class="ap-card"><h2>Emails</h2><form class="ap-form" id="xpref"><label>Language of your emails and reports<select name="lang">' + LANGS.map(function(l){ return '<option value="' + l[0] + '"' + (x.lang === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="full" style="flex-direction:row;gap:8px;align-items:center;display:flex"><input type="checkbox" name="watch"' + (x.watch ? ' checked' : '') + ' style="width:auto"> Email me when the satellite sees changes on my plot</label><div class="full"><button class="ap-btn x-sm" type="submit">Save</button></div></form></section>';
  }

  function inject(c, x, token, demo){
    var cols = document.querySelectorAll('#app .ap-col'); if (cols.length < 2) return;
    ['evidence','plot','xreport'].forEach(function(id){ var n = $(id); if (n) n.parentNode.removeChild(n); });
    document.querySelectorAll('.x-inj').forEach(function(n){ n.parentNode.removeChild(n); });
    var a = document.createElement('div'); a.className = 'x-inj'; a.innerHTML = evHtml(c, x);
    var rep = [].filter.call(cols[0].children, function(s){ return /Your report/.test(s.textContent); })[0];
    cols[0].insertBefore(a, rep ? rep.nextSibling : cols[0].children[1]);
    var b = document.createElement('div'); b.className = 'x-inj'; b.innerHTML = plotHtml(c, x) + sideHtml(c, x);
    cols[1].insertBefore(b, cols[1].children[1] || null);
    bind(c, x, token, demo);
    if (location.hash === '#evidence' && !window.__kbScrolled) { window.__kbScrolled = 1; $('evidence').scrollIntoView(); }
  }

  function bind(c, x, token, demo){
    var ev = x.evidence || [];
    if ($('xchk')) KBChain(c.id, ev).then(function(r){ $('xchk').innerHTML = r.ok ? '✓ chain verified in your browser' : '⚠ ' + r.bad.length + ' item(s) do not match'; $('xchk').style.color = r.ok ? '#1F8A5B' : '#B42318'; });
    document.querySelectorAll('[data-v]').forEach(function(btn){ btn.onclick = function(){ view(token, c.id, +btn.dataset.v); }; });
    $('xadd').onclick = function(){ addDoc(c, token, demo); };
    $('xjson').onclick = function(){ var blob = new Blob([JSON.stringify({ case: c.code, case_id: c.id, exported: new Date().toISOString(), formula: "chain = sha256((prev or 'genesis:' + case_id) + '|' + sha256 + '|' + kind + '|' + taken_at as YYYY-MM-DDTHH:MM:SSZ)", evidence: ev.map(function(e){ return { id: e.id, kind: e.kind, title: e.title, sha256: e.sha256, prev: e.prev, chain: e.chain, taken_at: e.taken_at, lat: e.lat, lng: e.lng, by: e.by, status: e.status }; }) }, null, 2)], { type: 'application/json' }); var u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'kolaboro-' + c.code + '-evidence.json'; l.click(); };
    $('xpdf').onclick = function(){ pdf(c, x, token); };
    $('xpref').onsubmit = function(e){ e.preventDefault(); if (demo) return KB.toast('This is the demo account: nothing is saved.'); rpc(token, 'prefs', { case_id: c.id, lang: this.lang.value, watch: this.watch.checked }).then(function(d){ if (d.case) { CACHE[c.id] = d.case; KB.toast('Saved'); } }); };
    mapInit(c, x, token, demo);
    $('xshb').onclick = function(){
      var b = this; b.disabled = true;
      KB.rpc('kolaboro_case_share', { p_token: token, p_case_id: c.id, p_show_project: $('xshp').checked }).then(function(d){
        b.disabled = false; if (!d || d.error) return KB.toast('Could not create the link');
        var link = 'https://kolaboro.com/r/?t=' + d.token, ref = 'https://kolaboro.com/?ref=' + d.ref_code;
        $('xsho').innerHTML = '<div class="x-share"><label>Read-only link</label><div class="x-copy"><input readonly value="' + esc(link) + '"><button class="ap-btn x-sm" data-cp="' + esc(link) + '">Copy</button><a class="ap-btn x-sm x-line" href="' + esc(link) + '" target="_blank" rel="noopener">Open</a></div>' +
          '<label style="margin-top:12px">Recommend Kolaboro</label><p class="ap-small" style="margin:0 0 6px">Friends who use your link get <b>€50 off</b> their first check, and we refund you <b>€50</b> when they pay.</p><div class="x-copy"><input readonly value="' + esc(ref) + '"><button class="ap-btn x-sm" data-cp="' + esc(ref) + '">Copy</button></div><p class="ap-small ap-muted" style="margin:6px 0 0">' + d.referred + ' friend' + (d.referred === 1 ? '' : 's') + ' came with your link · ' + d.referred_paid + ' paid</p></div>';
        $('xsho').querySelectorAll('[data-cp]').forEach(function(x){ x.onclick = function(){ (navigator.clipboard ? navigator.clipboard.writeText(x.dataset.cp) : Promise.reject()).then(function(){ KB.toast('Copied'); }).catch(function(){ x.previousSibling.select(); document.execCommand('copy'); KB.toast('Copied'); }); }; });
      });
    };
    liveCheck(c, token);
  }
  var LIVE = null, LIVEC = null;
  function liveCheck(c, token){
    if (LIVEC === c.id) return; LIVEC = c.id;
    KB.rpc('kolaboro_case_live', { p_token: token, p_action: 'get', p_payload: { case_id: c.id } }).then(function(d){
      if (!d || !d.live) return;
      var box = document.createElement('section'); box.className = 'ap-card lv-card'; box.id = 'live';
      box.innerHTML = '<h2><span class="lv-dot"></span> Your agent is live from the site</h2><p class="ap-small ap-muted" style="margin-top:0">GPS and time are burned into the picture. The video is recorded on the agent\'s phone and sealed into your evidence when they stop.</p><div class="lv-stage lv-view" id="lvv"></div><p class="lv-st" id="lvvst">Connecting…</p>';
      var col = document.querySelector('#app .ap-col'); if (!col) return; col.insertBefore(box, col.firstChild);
      if (location.hash === '#live') box.scrollIntoView();
      var s = document.createElement('script'); s.src = '/k/live.js?v=27'; s.onload = function(){
        LIVE = KBLive.viewer({ stage: $('lvv'), status: function(t){ var e = $('lvvst'); if (e) e.textContent = t; },
          get: function(p){ p.case_id = c.id; return KB.rpc('kolaboro_case_live', { p_token: token, p_action: 'get', p_payload: p }); },
          answer: function(sdp){ return KB.rpc('kolaboro_case_live', { p_token: token, p_action: 'answer', p_payload: { case_id: c.id, sdp: sdp } }); } });
      }; document.head.appendChild(s);
    });
  }

  function view(token, cid, id){
    var m = modal('<div class="cp-load"><i></i><i></i><i></i></div>');
    rpc(token, 'file', { case_id: cid, id: id }).then(function(d){
      if (!d.url) { m.body.innerHTML = '<p>Could not open this file.</p>'; return; }
      m.body.innerHTML = (/^data:application\/pdf/.test(d.url) ? '<iframe src="' + d.url + '" style="width:100%;height:70vh;border:0"></iframe>' : '<img src="' + d.url + '" style="max-width:100%;max-height:72vh;display:block;margin:0 auto;border-radius:8px">') +
        '<p class="ap-small ap-muted" style="word-break:break-all">SHA-256 ' + esc(d.sha256) + ' · <a href="/verify/?hash=' + esc(d.sha256) + '" target="_blank">check on /verify</a></p>';
    });
  }
  function modal(html){
    var w = document.createElement('div'); w.className = 'x-modal'; w.innerHTML = '<div class="x-box"><button class="x-close" aria-label="Close">×</button><div class="x-body">' + html + '</div></div>';
    document.body.appendChild(w); var close = function(){ w.remove(); }; w.querySelector('.x-close').onclick = close; w.onclick = function(e){ if (e.target === w) close(); };
    return { el: w, body: w.querySelector('.x-body'), close: close };
  }

  function addDoc(c, token, demo){
    var m = modal('<h2 style="margin-top:0">Add a document</h2><p class="ap-small ap-muted">A photo of each page, or the PDF. We read it, compare it with what you were told, and keep the original in your case.</p>' +
      '<form id="xdf" class="ap-form"><label class="full">What is it?<select name="type">' + DOCT.map(function(t){ return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="full">Pages (photos or one PDF, up to 6)<input type="file" name="f" accept="image/*,application/pdf" multiple required></label>' +
      '<label class="full">What were you told about it? (optional)<textarea name="claim" rows="3" placeholder="e.g. Freehold, 300 m², permit approved, no debts">' + esc(c.user_notes || '') + '</textarea></label>' +
      (demo ? '<p class="full ap-banner ok" style="margin:0">Demo account: try the reader with any document (or <a href="/k/cases/cert-sample.jpg" download>download our sample certificate</a>). The result is shown here but not saved.</p>' : '') + '<div class="full"><button class="ap-btn" type="submit">' + (demo ? 'Read it' : 'Read and add to my case') + '</button></div><p class="full cp-err" id="xerr"></p></form><div id="xres"></div>');
    var f = m.body.querySelector('#xdf');
    f.onsubmit = function(e){
      e.preventDefault(); var files = [].slice.call(f.f.files, 0, 6); if (!files.length) return;
      var btn = f.querySelector('button'); btn.disabled = true; btn.textContent = 'Reading… (about a minute)'; $('xerr').textContent = '';
      Promise.all(files.map(function(fl){ return fileUrl(fl).then(function(u){ return /^data:image/.test(u) ? shrink(u, 1800, .85) : u; }); })).then(function(urls){
        var big = urls.filter(function(u){ return u.length > 4300000; }).length; if (big) throw new Error('A file is too big (max 3 MB). Send photos of the pages instead.');
        var type = f.type.value, lang = (CACHE[c.id] || {}).lang || 'en';
        var call = type === 'certificate' && urls.length === 1 && /^data:image/.test(urls[0])
          ? fetch('/api/kb/certificate', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ image: urls[0], claim: f.claim.value, lang: lang }) }).then(function(r){ return r.json(); }).then(function(d){ return d.certificate ? { result: d.certificate } : { error: d.error }; })
          : fetch('/api/kb/document', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ files: urls, type: type, claim: f.claim.value, lang: lang }) }).then(function(r){ return r.json(); }).then(function(d){ return d.document ? { result: d.document } : { error: d.error }; });
        return call.then(function(r){
          var res = r.result || null, title = res ? (res.document_kind || (res.document_type ? 'Land certificate (' + res.document_type + ')' : 'Document')) : files[0].name;
          // keep each page as its own item, the reading result on the first page
          var chain = Promise.resolve();
          if (demo) return chain.then(function(){ return res; });
          urls.forEach(function(u, i){ chain = chain.then(function(){ return rpc(token, 'add_doc', { case_id: c.id, title: title + (urls.length > 1 ? ' · page ' + (i + 1) : ''), file: u, meta: i === 0 ? { type: type, claim: f.claim.value, result: res, read_error: r.error || null } : { type: type, page: i + 1 } }).then(function(d){ if (d.error) throw new Error(d.error === 'too_big' ? 'File too big' : 'Could not save: ' + d.error); if (d.case) CACHE[c.id] = d.case; }); }); });
          return chain.then(function(){ return res; });
        });
      }).then(function(res){
        m.body.querySelector('#xres').innerHTML = res ? resultHtml(res) : demo ? '<div class="ap-banner warn">We couldn\'t read it automatically. Try a clearer photo.</div>' : '<div class="ap-banner warn">Saved to your case. We couldn\'t read it automatically, so the team will review it by hand.</div>';
        f.remove(); if (!demo) { KB.toast('Added to your case'); if (window.KBXrefresh) KBXrefresh(); }
      }).catch(function(err){ btn.disabled = false; btn.textContent = demo ? 'Read it' : 'Read and add to my case'; $('xerr').textContent = err.message || 'Something went wrong'; });
    };
  }
  function resultHtml(r){
    var f = r.fields || [['Right', r.document_type], ['Number', r.certificate_number], ['NIB', r.nib], ['Area', r.area_m2 && r.area_m2 + ' m²'], ['Holder', r.holder], ['Village', r.village]].filter(function(x){ return x[1]; }).map(function(x){ return { label: x[0], value: x[1] }; });
    var mm = r.mismatches || [], fl = r.flags || [], nc = r.next_checks || [], cl = (r.clauses || []).filter(function(x){ return x.risk !== 'low'; });
    return '<div class="ap-banner ' + (mm.some(function(x){ return x.severity === 'high'; }) || cl.some(function(x){ return x.risk === 'high'; }) ? 'warn' : 'ok') + '">' + esc(r.summary) + '</div>' +
      (f.length ? '<div class="ap-facts">' + f.slice(0, 12).map(function(x){ return '<div><span>' + esc(x.label) + '</span><b>' + esc(x.value) + '</b></div>'; }).join('') + '</div>' : '') +
      (mm.length ? '<h3>Doesn\'t match what you were told</h3><ul>' + mm.map(function(x){ return '<li><b>' + esc(({area_m2:'Plot area',holder:'Registered holder',holder_type:'Holder type',encumbrances:'Charges on the title',document_type:'Type of title',certificate_number:'Certificate number',expires:'Expiry date',issued:'Issue date',village:'Village',district:'District',regency:'Regency',province:'Province',price:'Price',seller:'Seller',buyer:'Buyer',completion:'Completion date',amount:'Amount',payee:'Paid to',permit_number:'Permit number',use:'Permitted use'})[x.field] || String(x.field || '').replace(/_/g, ' ')) + ':</b> ' + esc(x.document || x.certificate) + ' vs ' + esc(x.claim) + '</li>'; }).join('') + '</ul>' : '') +
      (cl.length ? '<h3>Clauses to look at</h3><ul>' + cl.map(function(x){ return '<li><b>' + esc(x.clause) + '</b>: ' + esc(x.why) + '</li>'; }).join('') + '</ul>' : '') +
      (fl.length ? '<h3>Points to check</h3><ul>' + fl.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      (nc.length ? '<h3>Your agent will verify</h3><ul>' + nc.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '');
  }

  // ---------- map ----------
  function ringArea(pts){ if (pts.length < 3) return 0; var R = 6378137, a = 0; for (var i = 0; i < pts.length; i++){ var p1 = pts[i], p2 = pts[(i + 1) % pts.length]; a += (p2[1] - p1[1]) * Math.PI / 180 * (2 + Math.sin(p1[0] * Math.PI / 180) + Math.sin(p2[0] * Math.PI / 180)); } return Math.abs(a * R * R / 2); }
  function mapInit(c, x, token, demo){
    css('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
    load('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js').then(function(){
      var el = $('xmap'); if (!el || el._leaflet_id) return;
      var center = x.lat ? [x.lat, x.lng] : [-8.65, 115.17], mode = null, pin = null, poly = null, pts = (x.plot && x.plot.coordinates) ? x.plot.coordinates.map(function(p){ return [p[1], p[0]]; }) : [];
      var map = L.map(el, { scrollWheelZoom: false }).setView(center, x.lat ? 18 : 10);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' }).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(map);
      if (x.lat) pin = L.marker(center).addTo(map);
      function redraw(){ if (poly) map.removeLayer(poly); poly = pts.length ? L.polygon(pts, { color: '#FF5B14', weight: 2 }).addTo(map) : null; var a = ringArea(pts); $('xarea').textContent = a ? Math.round(a) + ' m²' : '—'; diff(); }
      function diff(){ var a = ringArea(pts), ce = +$('xcert').value; if (a && ce) { var d = (a - ce) / ce * 100; $('xdiff').textContent = (d > 0 ? '+' : '') + Math.round(d) + '%'; $('xdiff').style.color = Math.abs(d) > 15 ? '#B42318' : '#1F8A5B'; $('xdiff').title = Math.abs(d) > 15 ? 'More than 15% apart: ask your agent to measure the boundary pegs' : 'Within 15%: tracing from satellite is approximate'; } else $('xdiff').textContent = '—'; }
      redraw(); $('xcert').oninput = diff;
      map.on('click', function(e){ if (mode === 'pin') { if (pin) map.removeLayer(pin); pin = L.marker(e.latlng).addTo(map); } else if (mode === 'draw') { pts.push([e.latlng.lat, e.latlng.lng]); redraw(); if (!pin) pin = L.marker(e.latlng).addTo(map); } });
      function setMode(m){ mode = m; $('xpin').classList.toggle('on', m === 'pin'); $('xdraw').classList.toggle('on', m === 'draw'); el.style.cursor = m ? 'crosshair' : ''; }
      $('xpin').onclick = function(){ setMode(mode === 'pin' ? null : 'pin'); }; $('xdraw').onclick = function(){ if (mode !== 'draw') pts = []; setMode(mode === 'draw' ? null : 'draw'); redraw(); };
      $('xclr').onclick = function(){ pts = []; if (pin) map.removeLayer(pin); pin = null; redraw(); };
      $('xsearch').onkeydown = function(e){ if (e.key !== 'Enter') return; e.preventDefault(); fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(this.value)).then(function(r){ return r.json(); }).then(function(d){ if (d[0]) map.setView([+d[0].lat, +d[0].lon], 16); else KB.toast('Place not found'); }); };
      $('xsave').onclick = function(){
        if (demo) return KB.toast('This is the demo account: nothing is saved.');
        var ll = pin ? pin.getLatLng() : (pts.length ? { lat: pts.reduce(function(s, p){ return s + p[0]; }, 0) / pts.length, lng: pts.reduce(function(s, p){ return s + p[1]; }, 0) / pts.length } : null);
        if (!ll) return KB.toast('Place a pin first');
        rpc(token, 'plot', { case_id: c.id, lat: +ll.lat.toFixed(6), lng: +ll.lng.toFixed(6), plot: pts.length >= 3 ? { type: 'Polygon', coordinates: pts.map(function(p){ return [+p[1].toFixed(7), +p[0].toFixed(7)]; }) } : null, plot_area_m2: pts.length >= 3 ? Math.round(ringArea(pts)) : '', cert_area_m2: $('xcert').value }).then(function(d){ if (d.error) return KB.toast('Could not save: ' + d.error); CACHE[c.id] = d.case; KB.toast('Plot saved. Satellite watch is on.'); setMode(null); if (window.KBXrefresh) KBXrefresh(); });
      };
    });
  }

  // ---------- case file PDF ----------
  function pdf(c, x, token){
    var btn = $('xpdf'); btn.disabled = true; btn.textContent = 'Preparing…';
    var ev = (x.evidence || []).filter(function(e){ return e.status === 'accepted'; }), head = ev.length ? ev[ev.length - 1].chain : null;
    Promise.all([load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'), load('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js')])
      .then(function(){ return head ? fetch('/api/kb/stamp', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ hash: head, source: 'case-file' }) }).then(function(r){ return r.json(); }).catch(function(){ return {}; }) : {}; })
      .then(function(st){
        var photos = ev.filter(function(e){ return e.kind === 'photo' || e.kind === 'satellite'; }).slice(-6);
        return Promise.all(photos.map(function(e){ return rpc(token, 'file', { case_id: c.id, id: e.id }).then(function(d){ return d.url ? shrink(d.url, 900, .7).then(function(u){ return { e: e, u: u }; }) : null; }).catch(function(){ return null; }); })).then(function(imgs){ return { st: st, imgs: imgs.filter(Boolean) }; });
      }).then(function(r){
        var J = window.jspdf.jsPDF, d = new J({ unit: 'mm', format: 'a4' }), y = 18, W = 180, L = 15;
        function line(t, size, bold, color){ d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size || 10); d.setTextColor(color || '#17212B'); var ls = d.splitTextToSize(String(t || ''), W); ls.forEach(function(s){ if (y > 280) { d.addPage(); y = 18; } d.text(s, L, y); y += (size || 10) * .45 + 1.2; }); }
        d.setFillColor('#FF5B14'); d.circle(L + 2, y - 1.5, 2, 'F'); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.text('kolaboro', L + 6, y); y += 10;
        line('Case file ' + c.code, 18, true); line((c.project_name || c.project_url || 'Your project') + (c.location ? ' · ' + c.location : ''), 11);
        line('Generated ' + new Date().toUTCString(), 9, false, '#6B7A86'); y += 3;
        var STG = ['Case opened','Documents','Land & title','Building permit','Site visit','Report'], V = { pending:'In progress', safe:'No red flags', hold:'Hold payments', stop:"Don't pay yet" };
        line('Status: ' + STG[c.stage || 0] + ' · Verdict: ' + (V[c.verdict] || 'In progress'), 11, true);
        if (c.stage_note) line(c.stage_note, 10);
        if (x.lat) line('Plot: ' + (+x.lat).toFixed(6) + ', ' + (+x.lng).toFixed(6) + (x.plot_area_m2 ? ' · traced ' + Math.round(x.plot_area_m2) + ' m²' : '') + (x.cert_area_m2 ? ' · certificate ' + x.cert_area_m2 + ' m²' : ''), 10);
        y += 3; line('Evidence (' + ev.length + ' items, oldest first)', 13, true);
        ev.forEach(function(e, i){
          line((i + 1) + '. ' + (KIND[e.kind] ? KIND[e.kind][1] : e.kind) + ': ' + (e.title || '') , 10, true);
          var m = e.meta || {}, bits = ['taken ' + (e.taken_at ? new Date(e.taken_at).toUTCString() : '-')];
          if (e.lat) bits.push('GPS ' + (+e.lat).toFixed(5) + ', ' + (+e.lng).toFixed(5) + (e.acc ? ' ±' + Math.round(e.acc) + ' m' : ''));
          bits.push('by ' + (e.by || '-')); line(bits.join(' · '), 8.5, false, '#41505C');
          if (m.result && m.result.summary) line(m.result.summary, 9);
          if (m.text) line('"' + m.text + '"', 9);
          if (e.kind === 'satellite' && m.summary) line(m.summary, 9);
          line('file sha256 ' + e.sha256 + '   chain ' + e.chain, 7, false, '#6B7A86'); y += 1;
        });
        if (r.imgs.length) { d.addPage(); y = 18; line('Photos and satellite images', 13, true); var col = 0;
          r.imgs.forEach(function(im){ var p = d.getImageProperties(im.u), w = 85, h = w * p.height / p.width; if (h > 70) { h = 70; w = h * p.width / p.height; } if (y + h > 280) { d.addPage(); y = 18; col = 0; } d.addImage(im.u, 'JPEG', L + col * 92, y, w, h); d.setFontSize(7); d.setTextColor('#41505C'); d.text(d.splitTextToSize((im.e.title || '') + ' · ' + (im.e.taken_at ? new Date(im.e.taken_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : ''), 85), L + col * 92, y + h + 3); if (col) { y += h + 10; col = 0; } else col = 1; });
          if (col) y += 80; }
        if (y > 220) { d.addPage(); y = 18; }
        y += 4; line('How to check this file wasn\'t changed', 13, true);
        line('Each item\'s fingerprint is chained to the previous one: chain = sha256(previous chain | file sha256 | kind | time). The last chain value below is the fingerprint of the whole case today' + (r.st && r.st.stamp ? ', timestamped with OpenTimestamps (anchored in Bitcoin) on ' + new Date(r.st.stamp.created_at).toUTCString() + '.' : '.'), 9);
        line('Case fingerprint: ' + (head || '-'), 9, true);
        line('Scan the QR code or open kolaboro.com/verify/?hash=' + (head || '') + ' to see its timestamp. To recompute the chain, download the evidence data from the portal and drop it on kolaboro.com/verify.', 8.5, false, '#41505C');
        if (head) { var q = document.createElement('div'); new QRCode(q, { text: 'https://kolaboro.com/verify/?hash=' + head, width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M }); var cv = q.querySelector('canvas'); if (cv) d.addImage(cv.toDataURL('image/png'), 'PNG', L, y + 2, 38, 38); y += 44; }
        line('Kolaboro checks property for people buying abroad. This file records evidence; it is not legal advice. kolaboro.com · hello@kolaboro.com', 7.5, false, '#6B7A86');
        line('This exact file is registered with Kolaboro when it is created. To check it was not edited, drop it on kolaboro.com/verify: your browser computes its SHA-256 and looks it up.', 7.5, false, '#6B7A86');
        var bytes = d.output('arraybuffer');
        return crypto.subtle.digest('SHA-256', bytes).then(function(hb){
          var hx = [].map.call(new Uint8Array(hb), function(b){ return ('0' + b.toString(16)).slice(-2); }).join('');
          return KB.rpc('kolaboro_pdf_register', { p_token: token, p_case_id: c.id, p_sha256: hx, p_head: head || '' }).catch(function(){ return null; });
        }).then(function(){
          var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); a.download = 'kolaboro-case-' + c.code + '.pdf'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
          btn.disabled = false; btn.textContent = 'Download case file (PDF)'; if (window.kbEvent) kbEvent('case_pdf');
        });
      }).catch(function(e){ btn.disabled = false; btn.textContent = 'Download case file (PDF)'; KB.toast('Could not build the PDF: ' + (e.message || e)); });
  }

  window.KBX = function(c, D, token){
    if (!c) return;
    window.KBXrefresh = function(){ delete CACHE[c.id]; window.KBX(c, D, token); };
    var demo = !!(D.user && D.user.demo);
    if (CACHE[c.id]) return inject(c, CACHE[c.id], token, demo);
    if (BUSY[c.id]) return; BUSY[c.id] = 1;
    rpc(token, 'get', { case_id: c.id }).then(function(d){ BUSY[c.id] = 0; if (d.case) { CACHE[c.id] = d.case; inject(c, d.case, token, demo); } });
  };
})();
