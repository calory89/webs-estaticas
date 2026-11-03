/* Milestone payments: each step of the buyer's plan against the evidence that can support it.
   The plan lives only in localStorage. Evidence comes from: signed receipts (/api/open/receipt/{id}), the tracked project record
   (/api/x/g/project), the satellite at the buyer's pin (KSatPoint, Sentinel-2 read in the browser) and, as context only,
   the weekly watched-area data (/data/satellite.json, /data/satellite-optical.json). Nothing here ever marks a step as reached. */
(function(){
  'use strict';
  var $ = function(id){ return document.getElementById(id); };
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var KEY = 'kb-ms-v1', DAY = 864e5;
  var KINDS = [
    ['deposit', 'Booking or deposit'], ['permit', 'Permit or approval'], ['clearing', 'Land clearing and groundworks'], ['foundation', 'Foundations'],
    ['structure', 'Structure: frame and floors'], ['roof', 'Roof or topping out'], ['finishing', 'Finishing, services, pool'], ['handover', 'Completion and handover'], ['other', 'Other']
  ];
  var KL = {}; KINDS.forEach(function(k){ KL[k[0]] = k[1]; });
  var BUILD = { clearing: 1, foundation: 1, structure: 1, roof: 1, finishing: 1, handover: 1 };
  var S = { key: '_', rows: [], pin: null, proj: null, projErr: '', series: null, seriesErr: '', seriesBusy: false, rc: {}, sites: [], opt: {} };

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function fdate(s){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? (+m[3]) + ' ' + MON[+m[2] - 1] + ' ' + m[1] : String(s || ''); }
  function pdate(s){ if (!s) return null; var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]); var t = Date.parse(s); return isNaN(t) ? null : t; }
  function age(s){ var t = pdate(s); if (t == null) return ''; var d = Math.floor((Date.now() - t) / DAY); return d <= 0 ? 'today' : d === 1 ? '1 day old' : d < 60 ? d + ' days old' : d < 730 ? Math.round(d / 30.4) + ' months old' : (d / 365).toFixed(1) + ' years old'; }
  function iso(t){ return new Date(t).toISOString().slice(0, 10); }

  /* ---------- storage (this browser only) ---------- */
  function load(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  var saveT;
  function save(){
    clearTimeout(saveT);
    saveT = setTimeout(function(){
      try { var all = load(); all.plans = all.plans || {}; all.plans[S.key] = { rows: S.rows, pin: S.pin, t: Date.now() }; all.last = S.key; localStorage.setItem(KEY, JSON.stringify(all)); $('mssaved').textContent = 'Saved in this browser only.'; }
      catch (e) { $('mssaved').textContent = 'This browser does not allow saving, so the plan is lost when you close the page. Use Download plan to keep it.'; }
    }, 250);
  }
  function usePlan(key){
    S.key = key; var all = load(), p = (all.plans || {})[key];
    S.rows = p && Array.isArray(p.rows) ? p.rows.slice(0, 40).map(clean) : [];
    if (p && p.pin && !S.pin) S.pin = p.pin;
  }
  function clean(r){ r = r || {}; return { name: String(r.name || '').slice(0, 80), kind: KL[r.kind] ? r.kind : 'other', due: /^\d{4}-\d{2}-\d{2}$/.test(r.due || '') ? r.due : '', amount: String(r.amount || '').slice(0, 30), receipts: String(r.receipts || '').replace(/[^\d,\s]/g, '').slice(0, 120) }; }

  /* ---------- plan editor ---------- */
  function editor(){
    if (!S.rows.length) { $('msplan').innerHTML = '<p class="ms-empty">No steps yet. Start from the typical construction steps, or add the steps of your contract one by one.</p>'; return; }
    $('msplan').innerHTML = S.rows.map(function(r, i){
      var opts = KINDS.map(function(k){ return '<option value="' + k[0] + '"' + (k[0] === r.kind ? ' selected' : '') + '>' + esc(k[1]) + '</option>'; }).join('');
      return '<fieldset class="ms-step" data-i="' + i + '"><legend>Step ' + (i + 1) + '</legend>' +
        '<label class="c-name">What the contract calls it<input data-f="name" type="text" maxlength="80" value="' + esc(r.name) + '" placeholder="e.g. Second instalment: foundations"></label>' +
        '<label class="c-kind">Kind of step<select data-f="kind">' + opts + '</select></label>' +
        '<label class="c-due">Due<input data-f="due" type="date" value="' + esc(r.due) + '"></label>' +
        '<label class="c-amt">Amount<input data-f="amount" type="text" maxlength="30" value="' + esc(r.amount) + '" placeholder="e.g. 20% or 30,000"></label>' +
        '<label class="c-rc">Receipt numbers from your agent<input data-f="receipts" type="text" inputmode="numeric" maxlength="120" value="' + esc(r.receipts) + '" placeholder="e.g. 29, 30"></label>' +
        '<div class="ms-sb"><button type="button" data-a="up" aria-label="Move step ' + (i + 1) + ' up"' + (i ? '' : ' disabled') + '>↑</button><button type="button" data-a="down" aria-label="Move step ' + (i + 1) + ' down"' + (i < S.rows.length - 1 ? '' : ' disabled') + '>↓</button><button type="button" data-a="del" aria-label="Remove step ' + (i + 1) + '">Remove</button></div></fieldset>';
    }).join('');
  }
  var evT;
  $('msplan').addEventListener('input', function(e){
    var f = e.target.getAttribute('data-f'), fs = e.target.closest('.ms-step'); if (!f || !fs) return;
    S.rows[+fs.dataset.i][f] = f === 'receipts' ? e.target.value.replace(/[^\d,\s]/g, '') : e.target.value;
    save(); clearTimeout(evT); evT = setTimeout(evidence, f === 'receipts' ? 600 : 150);
  });
  $('msplan').addEventListener('change', function(e){ if (e.target.getAttribute('data-f')) { save(); evidence(); } });
  $('msplan').addEventListener('click', function(e){
    var b = e.target.closest('button[data-a]'); if (!b) return; var i = +b.closest('.ms-step').dataset.i, a = b.dataset.a;
    if (a === 'del') S.rows.splice(i, 1);
    if (a === 'up' && i) S.rows.splice(i - 1, 0, S.rows.splice(i, 1)[0]);
    if (a === 'down' && i < S.rows.length - 1) S.rows.splice(i + 1, 0, S.rows.splice(i, 1)[0]);
    editor(); save(); evidence();
  });
  $('mstpl').addEventListener('click', function(){
    if (S.rows.length && !confirm('Replace your current steps with the typical construction steps?')) return;
    S.rows = [['Booking deposit', 'deposit'], ['Permit issued', 'permit'], ['Land clearing and groundworks', 'clearing'], ['Foundations', 'foundation'], ['Structure', 'structure'], ['Roof', 'roof'], ['Finishing', 'finishing'], ['Handover', 'handover']]
      .map(function(x){ return { name: x[0], kind: x[1], due: '', amount: '', receipts: '' }; });
    editor(); save(); evidence();
  });
  $('msadd').addEventListener('click', function(){ S.rows.push({ name: '', kind: 'other', due: '', amount: '', receipts: '' }); editor(); save(); evidence(); var l = $('msplan').querySelectorAll('.ms-step input[data-f=name]'); if (l.length) l[l.length - 1].focus(); });
  $('msclr').addEventListener('click', function(){ if (!S.rows.length || confirm('Remove every step of this plan from this browser?')) { S.rows = []; editor(); save(); evidence(); } });
  $('msexp').addEventListener('click', function(){
    var blob = new Blob([JSON.stringify({ kolaboro_milestone_plan: 1, project: S.proj ? S.proj.id : null, pin: S.pin, rows: S.rows }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'payment-plan' + (S.proj ? '-' + S.proj.id : '') + '.json'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });
  $('msimp').addEventListener('change', function(){
    var f = this.files && this.files[0]; if (!f) return; var rd = new FileReader();
    rd.onload = function(){ try { var d = JSON.parse(rd.result); if (!Array.isArray(d.rows)) throw 0; S.rows = d.rows.slice(0, 40).map(clean); if (Array.isArray(d.pin) && d.pin.length === 2) setPin(+d.pin[0], +d.pin[1], false); editor(); save(); evidence(); $('mssaved').textContent = 'Imported ' + S.rows.length + ' steps.'; } catch (e) { $('mssaved').textContent = 'That file is not a plan downloaded from this page.'; } };
    rd.readAsText(f); this.value = '';
  });

  /* ---------- project ---------- */
  function loadProject(id){
    id = String(id || '').trim().toUpperCase(); if (!id) return;
    $('msprojout').textContent = 'Loading ' + id + '…';
    fetch('/api/x/g/project?id=' + encodeURIComponent(id)).then(function(r){ return r.json().then(function(d){ return [r.status, d]; }); }).then(function(x){
      if (x[0] !== 200) { S.proj = null; $('msprojout').textContent = x[0] === 404 ? 'No tracked project with id ' + id + '.' : 'Use an id like BALI-014.'; evidence(); return; }
      var p = x[1].project; S.proj = p; S.projMeta = x[1];
      var keep = S.rows; usePlan(p.id); if (!S.rows.length && keep.length && S.key !== '_') S.rows = keep;
      editor();
      try { history.replaceState(null, '', '?p=' + encodeURIComponent(p.id) + (S.pin ? '&lat=' + S.pin[0] + '&lng=' + S.pin[1] : '')); } catch (e) {}
      var bits = [p.market + (p.region ? ', ' + p.region : ''), p.stage || 'stage not recorded', p.done ? 'completion advertised ' + p.done : null, p.delay ? 'delay recorded' : null, p.overdue ? 'overdue' : null].filter(Boolean);
      $('msprojout').innerHTML = '<b>' + esc(p.id) + '</b>: ' + esc(bits.join(' · ')) + '. Record checked ' + esc(p.checked || 'n/a') + '. <a href="' + esc(x[1].page) + '">Project page</a>';
      evidence();
    }).catch(function(){ $('msprojout').textContent = 'The project record could not be loaded. Try again.'; });
  }
  $('msproj').addEventListener('submit', function(e){ e.preventDefault(); loadProject($('msid').value); });

  /* ---------- pin and satellite ---------- */
  function parsePin(t){ var m = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(t || '') || /@(-?\d+\.\d+),\s*(-?\d+\.\d+)/.exec(t || ''); if (!m) return null; var a = +m[1], b = +m[2]; return a >= -80 && a <= 84 && b >= -180 && b <= 180 ? [Math.round(a * 1e5) / 1e5, Math.round(b * 1e5) / 1e5] : null; }
  function setPin(lat, lng, run){
    S.pin = [lat, lng]; $('msll').value = lat.toFixed(5) + ', ' + lng.toFixed(5); $('mspinlink').href = '/satellite/plot/?lat=' + lat + '&lng=' + lng;
    save(); area();
    if (run) runSat();
  }
  function runSat(){
    if (!S.pin || S.seriesBusy) return;
    if (!window.KSatPoint || !window.GeoTIFF) { $('mspinout').textContent = 'The satellite reader could not start in this browser.'; return; }
    S.seriesBusy = true; S.series = null; S.seriesErr = ''; $('msstrip').innerHTML = '';
    $('mspinout').textContent = 'Reading Sentinel-2 at your pin, newest quarter first (about 1 to 3 MB per quarter)…';
    KSatPoint.run(S.pin[0], S.pin[1], 3, {
      onQuarter: function(r, ms){ if (r.status === 'ok') strip(r); $('mspinout').textContent = 'Reading Sentinel-2 at your pin… ' + $('msstrip').children.length + ' clear quarters so far, ' + Math.round(ms / 1000) + ' s.'; }
    }).then(function(res){
      S.seriesBusy = false; S.series = res;
      var ok = res.quarters.filter(function(q){ return q.status === 'ok'; }), c = KSatPoint.change(res);
      $('msstrip').innerHTML = ''; ok.forEach(strip);
      $('mspinout').innerHTML = esc(ok.length + ' of ' + res.quarters.length + ' quarters clear at your pin, in ' + (res.ms / 1000).toFixed(1) + ' s. ') + esc(c.enough ? c.reading : 'Not enough clear quarters to compare.') + ' <a href="/satellite/plot/?lat=' + S.pin[0] + '&lng=' + S.pin[1] + '">Open the full viewer</a>';
      evidence();
    }).catch(function(e){ S.seriesBusy = false; S.seriesErr = (e && e.status === 429) ? 'Too many new points from your connection; try again in a few minutes.' : 'The satellite images could not be read right now.'; $('mspinout').textContent = S.seriesErr; evidence(); });
  }
  function strip(r){
    var c = document.createElement('canvas'); c.width = r.image.size; c.height = r.image.size; c.getContext('2d').putImageData(new ImageData(r.image.rgba, r.image.size, r.image.size), 0, 0);
    var f = document.createElement('figure'); f.appendChild(c); var cap = document.createElement('figcaption'); cap.textContent = r.scene.date; f.appendChild(cap);
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Sentinel-2 at your pin, ' + fdate(r.scene.date));
    var kids = [].slice.call($('msstrip').children), at = kids.filter(function(k){ return k.dataset.d < r.scene.date; }).length; f.dataset.d = r.scene.date;
    $('msstrip').insertBefore(f, kids[at] || null);
  }
  $('mspin').addEventListener('submit', function(e){ e.preventDefault(); var p = parsePin($('msll').value); if (!p) { $('mspinout').textContent = 'Use coordinates like -8.6380, 115.1150.'; return; } setPin(p[0], p[1], true); });

  /* ---------- receipts ---------- */
  function ids(r){ return (r.receipts || '').split(/[,\s]+/).filter(function(x){ return /^\d{1,12}$/.test(x); }).slice(0, 20); }
  function fetchReceipts(){
    var need = {}; S.rows.forEach(function(r){ ids(r).forEach(function(i){ if (!S.rc[i]) need[i] = 1; }); });
    var list = Object.keys(need); if (!list.length) return Promise.resolve();
    list.forEach(function(i){ S.rc[i] = { loading: true }; });
    return Promise.all(list.map(function(i){
      return fetch('/api/open/receipt/' + i).then(function(r){ return r.status === 404 ? { missing: true } : r.ok ? r.json() : { error: true }; }).catch(function(){ return { error: true }; }).then(function(d){ S.rc[i] = d; });
    }));
  }

  /* ---------- the rules ---------- */
  function strong(v){ return v === 'registry' || v === 'independent'; }
  function by(v){ return v === 'registry' ? 'an official register' : 'an independent source'; }
  function receiptSources(r){
    return ids(r).map(function(i){
      var d = S.rc[i] || {}, link = [['receipt', '/api/open/receipt/' + i], ['verify it yourself', '/verify']];
      if (d.loading) return { src: 'Signed receipt #' + i, st: 'unknown', text: 'Loading…', links: link };
      if (d.missing) return { src: 'Signed receipt #' + i, st: 'notfound', text: 'There is no receipt with this number. Check it with your agent.', links: [] };
      if (d.error || !d.receipt) return { src: 'Signed receipt #' + i, st: 'unknown', text: 'The receipt could not be loaded right now.', links: link };
      var kind = d.kind || 'item', when = d.taken_at || d.recorded_at;
      var sig = d.passkey ? (d.passkey_check && d.passkey_check.ok ? 'signed by the agent\'s phone, signature verified' : 'phone signature does not verify (' + (d.passkey_check && d.passkey_check.why || 'unknown') + ')') : 'not phone-signed (fingerprint and time only)';
      var plot = d.in_plot === true ? 'taken inside the plot boundary' : d.in_plot === false ? 'taken outside the plot boundary' : 'plot boundary not recorded';
      var text = cap(kind) + ' taken ' + fdate(when) + ': ' + sig + ', ' + plot + (d.bitcoin_stamp ? ', timestamped in Bitcoin' : '') + '. The receipt proves when, where and by which phone; what the ' + kind + ' shows is the agent\'s report.';
      var applies = (kind === 'photo' || kind === 'video') ? (BUILD[r.kind] || r.kind === 'other') : kind === 'document' ? (r.kind === 'deposit' || r.kind === 'permit' || r.kind === 'other') : false;
      var bad = (d.passkey && !(d.passkey_check && d.passkey_check.ok)) || d.in_plot === false;
      if (!applies) return { src: 'Signed receipt #' + i, st: 'context', text: 'A ' + kind + ' receipt does not count as evidence for this kind of step. ' + text, date: when, links: link };
      return { src: 'Signed receipt #' + i, st: bad ? 'notfound' : 'found', text: text, date: when, links: link };
    });
  }
  function cap(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function projectSource(r){
    var p = S.proj; if (!p) return null;
    var v = p.verified || {}, src = 'Project record ' + p.id, links = [['project page', '/p/?id=' + encodeURIComponent(p.id)], ['record', '/api/x/g/project?id=' + encodeURIComponent(p.id)]], when = p.checked ? iso(Date.parse(p.checked + ' UTC')) : null;
    var done = p.stage === 'completed' && strong(v.progress), contra = v.progress === 'contradicted';
    if (r.kind === 'deposit') return { src: src, st: 'context', text: 'A payment step: the project record cannot show it. Deposit protection: ' + (strong(v.escrow) ? 'confirmed by ' + by(v.escrow) : v.escrow === 'developer' ? 'claimed by the developer only' : 'not confirmed') + '.', date: when, links: links };
    if (r.kind === 'permit') {
      var reg = p.register && /permit|approv|licen/i.test((p.register.item || '') + ' ' + (p.register.register || '')) && /approved|valid|issued|active/i.test(p.register.status || '') ? p.register : null;
      if (reg) return { src: src, st: 'found', text: cap(reg.item) + ' ' + reg.status + ' in the ' + reg.register + '.', date: reg.checked, links: links };
      if (strong(v.permit)) return { src: src, st: 'found', text: 'Building permit confirmed by ' + by(v.permit) + '.', date: when, links: links };
      if (v.permit === 'contradicted') return { src: src, st: 'notfound', text: 'The permit claim is contradicted by what we found.', date: when, links: links };
      return { src: src, st: 'notfound', text: v.permit === 'developer' ? 'Only the developer says there is a permit; no register or independent source confirms it yet.' : 'No permit evidence in the record.', date: when, links: links };
    }
    if (!BUILD[r.kind]) return { src: src, st: 'context', text: 'Stage recorded: ' + (p.stage || 'not recorded') + '.', date: when, links: links };
    if (contra) return { src: src, st: 'notfound', text: 'The progress the developer claims is contradicted by what we found.', date: when, links: links };
    if (done) return { src: src, st: 'found', text: 'Project recorded as completed, confirmed by ' + by(v.progress) + '. ' + (r.kind === 'handover' ? 'Your own handover still needs the keys and the certificate in your name.' : 'A completed building supports this stage.'), date: when, links: links };
    if (r.kind === 'clearing') {
      if (p.sat && p.sat.status === 'visible change') return { src: src + ' (satellite)', st: 'found', text: 'Visible change on ' + p.sat.changed_pct + '% of the ~400 m box around the project site, last 120 days against the same window a year earlier.', date: p.sat.date, links: links };
      if ((p.stage === 'under construction' || p.stage === 'completed') && strong(v.progress)) return { src: src, st: 'found', text: 'Construction recorded as under way, confirmed by ' + by(v.progress) + '.', date: when, links: links };
      return { src: src, st: 'notfound', text: (p.sat ? 'No visible change on the project site against a year earlier (' + fdate(p.sat.date) + '). Ground cleared longer ago would not show. ' : '') + 'Progress ' + (v.progress === 'developer' ? 'is claimed by the developer only.' : 'is not confirmed in the record.'), date: p.sat ? p.sat.date : when, links: links };
    }
    return { src: src, st: 'context', text: 'The record shows the stage (' + (p.stage || 'not recorded') + (strong(v.progress) ? ', confirmed by ' + by(v.progress) : v.progress === 'developer' ? ', claimed by the developer' : '') + ') but not this step of the build.', date: when, links: links };
  }
  function satSource(r){
    if (!S.pin) return null;
    var src = 'Satellite at your pin', links = [['viewer', '/satellite/plot/?lat=' + S.pin[0] + '&lng=' + S.pin[1]]];
    if (!(r.kind === 'clearing' || r.kind === 'foundation' || r.kind === 'structure' || r.kind === 'roof')) return null;
    if (S.seriesBusy) return { src: src, st: 'unknown', text: 'Reading the images…', links: links };
    if (!S.series) return { src: src, st: 'unknown', text: S.seriesErr || 'Press Check satellite above to read the images of your pin.', links: links };
    var c = KSatPoint.change(S.series), last = c.last && c.last.scene;
    if (last) links.push(['latest image', last.tci]);
    if (r.kind !== 'clearing') return { src: src, st: 'context', text: 'A satellite pixel is 10 m wide, so it cannot tell foundations, floors or a villa roof apart from bare ground. At your pin: ' + (c.enough ? c.reading : 'not enough clear quarters to compare.'), date: last && last.date, links: links };
    if (!c.enough) return { src: src, st: 'unknown', text: 'Only ' + c.clear + ' clear quarter' + (c.clear === 1 ? '' : 's') + ' at your pin: not enough to compare.', links: links };
    if (c.cleared) {
      var first = null, base = c.first.image;
      S.series.quarters.forEach(function(q){ if (!first && q.status === 'ok' && q.q > c.first.q && (q.image.brightness - base.brightness >= 25 || q.image.greenness - base.greenness <= -20)) first = q; });
      return { src: src, st: 'found', text: c.reading + (first ? ' First seen in the picture of ' + fdate(first.scene.date) + '.' : '') + ' Latest clear picture ' + fdate(last.date) + '.', date: last.date, links: links };
    }
    return { src: src, st: 'notfound', text: c.reading + ' If the plot was already bare at the start of the period, clearing would not show here.', date: last.date, links: links };
  }

  function evidence(){
    var rows = S.rows;
    if (!rows.length) { $('msev').innerHTML = ''; $('mssum').innerHTML = ''; $('msstatus').textContent = 'Add at least one step to see its evidence.'; return; }
    fetchReceipts().then(function(){ if (S.rows === rows) render(); });
    render();
  }
  function render(){
    var today = Date.now(), cnt = { found: 0, notfound: 0, unknown: 0 };
    var html = S.rows.map(function(r, i){
      var src = receiptSources(r), ps = projectSource(r), ss = satSource(r);
      if (ps) src.push(ps); if (ss) src.push(ss);
      var live = src.filter(function(s){ return s.st !== 'context'; });
      var st = live.some(function(s){ return s.st === 'found'; }) ? 'found' : live.some(function(s){ return s.st === 'notfound'; }) ? 'notfound' : 'unknown';
      cnt[st]++;
      var due = pdate(r.due), overdue = due != null && due < today && st !== 'found';
      var label = { found: 'Evidence found', notfound: 'Evidence not found', unknown: 'Unknown' }[st];
      var why = !src.length ? (r.kind === 'deposit' ? 'A payment step: only a document receipt or your contract can support it.' : 'No source that can see this kind of step is connected yet. Add the receipt numbers of your agent\'s photos, a tracked project or a pin.') : '';
      return '<li class="ms-it ' + st + '"><div class="ms-h"><span class="ms-n">' + (i + 1) + '</span><div><b>' + esc(r.name || KL[r.kind]) + '</b><span>' + esc(KL[r.kind]) + (r.due ? ' · due ' + esc(fdate(r.due)) : '') + (r.amount ? ' · ' + esc(r.amount) : '') + '</span></div><em class="ms-pill">' + label + '</em></div>' +
        (overdue ? '<p class="ms-warn">Due ' + Math.floor((today - due) / DAY) + ' days ago and no evidence supports it yet. Ask your agent for a signed photo before you pay.</p>' : '') +
        (why ? '<p class="ms-why">' + esc(why) + '</p>' : '') +
        (src.length ? '<ul class="ms-srcs">' + src.map(function(s){
          var tag = { found: 'supports', notfound: 'does not support', unknown: 'unknown', context: 'context only' }[s.st];
          return '<li class="' + s.st + '"><b>' + esc(s.src) + '</b> <i>' + tag + '</i>' + (s.date ? ' <span class="ms-age">' + esc(age(s.date)) + '</span>' : '') + '<p>' + esc(s.text) + '</p>' +
            (s.links && s.links.length ? '<p class="ms-l">' + s.links.map(function(l){ return '<a href="' + esc(l[1]) + '"' + (/^https:/.test(l[1]) ? ' rel="noopener"' : '') + '>' + esc(l[0]) + '</a>'; }).join(' · ') + '</p>' : '') + '</li>';
        }).join('') + '</ul>' : '') + '</li>';
    }).join('');
    $('msev').innerHTML = html;
    $('mssum').innerHTML = '<div><b>' + cnt.found + '</b><span>evidence found</span></div><div><b>' + cnt.notfound + '</b><span>evidence not found</span></div><div><b>' + cnt.unknown + '</b><span>unknown</span></div>';
    $('msstatus').textContent = S.rows.length + ' step' + (S.rows.length > 1 ? 's' : '') + ' checked against ' + [S.proj ? 'project ' + S.proj.id : null, S.pin ? 'your pin' : null, S.rows.some(function(r){ return ids(r).length; }) ? 'signed receipts' : null].filter(Boolean).join(', ').replace(/^$/, 'nothing yet') + '.';
  }

  /* ---------- area context (never changes a status) ---------- */
  function area(){
    var el = $('msarea');
    if (!S.pin) { el.innerHTML = '<p class="muted">Add your plot coordinates to see whether it lies in a watched area.</p>'; return; }
    if (!S.sites.length) { el.innerHTML = '<p class="muted">Loading the watched areas…</p>'; return; }
    var lat = S.pin[0], lng = S.pin[1], best = null;
    S.sites.forEach(function(s){
      var dy = (s.lat - lat) * 111.32, dx = (s.lng - lng) * 111.32 * Math.cos(lat * Math.PI / 180), d = Math.sqrt(dx * dx + dy * dy);
      var inside = Math.abs(s.lat - lat) <= 0.005 && Math.abs(s.lng - lng) <= 0.005 / Math.cos(s.lat * Math.PI / 180);
      if (!best || d < best.d) best = { s: s, d: d, inside: inside };
    });
    if (!best || best.d > 25) { el.innerHTML = '<p class="muted">Your plot is not near any of the ' + S.sites.length + ' watched development areas. The satellite record of your own pin above is what counts.</p>'; return; }
    var s = best.s, r = s.radar || {}, o = S.opt[s.id], bits = [];
    if (r.radar_change_db != null) bits.push('<div><b>' + (r.radar_change_db > 0 ? '+' : '') + r.radar_change_db.toFixed(1) + ' dB</b><span>radar backscatter change, ' + esc((r.change_from || '').replace('dry', '') + ' to ' + (r.change_to || '').replace('dry', '').replace('latest', 'last 120 days')) + ' (Sentinel-1)</span></div>');
    if (o && o.summary && o.summary.new_built_since_baseline_pct != null) bits.push('<div><b>' + o.summary.new_built_since_baseline_pct + '%</b><span>of the area turned built-up or bare, ' + esc(o.summary.from + ' to ' + o.summary.to) + ' (Sentinel-2, ' + o.summary.months_clear + ' clear months)</span></div>');
    var lc = null; (s.periods || []).forEach(function(p){ if (typeof p.cleared_since_first_pct === 'number') lc = p; });
    if (lc) bits.push('<div><b>' + lc.cleared_since_first_pct + '%</b><span>land cleared since ' + esc(s.periods[0].label) + ', ' + esc(lc.label) + '</span></div>');
    el.innerHTML = '<p>' + (best.inside ? 'Your pin is inside the watched area <b>' + esc(s.label) + '</b>.' : 'Nearest watched area: <b>' + esc(s.label) + '</b>, ' + best.d.toFixed(1) + ' km from your pin, so it says little about your plot.') + ' Updated ' + esc(fdate(S.satUpdated)) + '. <a href="/satellite/#viewer">Open it in the viewer</a></p>' + (bits.length ? '<div class="ms-an">' + bits.join('') + '</div>' : '') +
      '<p class="muted ms-sm">Area figures describe the whole ' + (s.box_km || 1.1) + ' km box: many plots, many developers. They are context and never change the status of a step.</p>';
  }

  /* ---------- boot ---------- */
  function boot(){
    var sp = new URLSearchParams(location.search), pid = sp.get('p') || sp.get('id'), lat = +sp.get('lat'), lng = +sp.get('lng');
    var all = load();
    usePlan(pid ? String(pid).toUpperCase() : (all.last && all.last !== '_' && !sp.get('lat') ? all.last : '_'));
    if (sp.get('lat') && lat >= -80 && lat <= 84 && lng >= -180 && lng <= 180) setPin(Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5, false);
    else if (S.pin) setPin(S.pin[0], S.pin[1], false);
    editor(); evidence(); area();
    if (pid || (S.key !== '_')) { $('msid').value = pid || S.key; loadProject(pid || S.key); }
    if (S.pin) $('mspinout').textContent = 'Press Check satellite to read the images of this pin (about 10 to 30 MB, 10 to 30 seconds).';
    fetch('/data/satellite.json').then(function(r){ return r.json(); }).then(function(d){ S.sites = d.sites || []; S.satUpdated = d.updated; area(); }).catch(function(){ $('msarea').innerHTML = '<p class="muted">The watched-area data did not load.</p>'; });
    fetch('/data/satellite-optical.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d) { (d.sites || []).forEach(function(s){ S.opt[s.id] = s; }); area(); } }).catch(function(){});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
