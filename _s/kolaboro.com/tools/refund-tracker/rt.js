/* Kolaboro refund and claim tracker. Everything is stored in this browser only (localStorage). Nothing is sent anywhere. */
(function () {
  var KEY = 'kb-refund-tracker-v1';
  var ST = [['requested', 'Requested'], ['acknowledged', 'Acknowledged'], ['partly', 'Partly paid'], ['paid', 'Paid'], ['refused', 'Refused'], ['legal', 'Legal action']];
  var SL = {}; ST.forEach(function (s) { SL[s[0]] = s[1]; });
  var $ = function (i) { return document.getElementById(i); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var data = { v: 1, claims: [] }, okStore = true;

  /* storage, always wrapped */
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var d = JSON.parse(raw); if (d && Array.isArray(d.claims)) data = { v: 1, claims: d.claims.map(clean).filter(Boolean) }; } }
    catch (e) { okStore = false; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); okStore = true; } catch (e) { okStore = false; }
    var w = $('rtStore'); w.hidden = okStore; if (!okStore) w.textContent = 'Your browser is not letting this page save. Your claims will be lost when you close the tab, so export a JSON copy before you leave.';
  }

  /* helpers */
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function isDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s); }
  function dnum(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; }
  function days(a, b) { return Math.round(dnum(b) - dnum(a)); }
  function nice(s) { if (!isDate(s)) return ''; var p = s.split('-'); return +p[2] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+p[1] - 1] + ' ' + p[0]; }
  function num(s) { var n = parseFloat(String(s == null ? '' : s).replace(/[^\d.\-]/g, '')); return isFinite(n) && n >= 0 ? n : 0; }
  function money(n, c) { return (c ? c + ' ' : '') + n.toLocaleString('en', { maximumFractionDigits: 2 }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function str(s, n) { return String(s == null ? '' : s).slice(0, n); }
  function safeUrl(u) { u = str(u, 500).trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } }
  function clean(c) {
    if (!c || typeof c !== 'object') return null;
    var o = { id: str(c.id || uid(), 40), dev: str(c.dev, 120), proj: str(c.proj, 120), amount: num(c.amount), paid: num(c.paid), cur: str(c.cur || '', 5).toUpperCase(),
      req: isDate(c.req) ? c.req : today(), deadline: isDate(c.deadline) ? c.deadline : '', promised: str(c.promised, 2000), status: SL[c.status] ? c.status : 'requested',
      closed: isDate(c.closed) ? c.closed : '', log: [] };
    (Array.isArray(c.log) ? c.log : []).forEach(function (e) { if (e && isDate(e.d)) o.log.push({ id: str(e.id || uid(), 40), d: e.d, k: ['note', 'status', 'payment'].indexOf(e.k) >= 0 ? e.k : 'note', t: str(e.t, 2000), u: safeUrl(e.u) }); });
    if (!o.dev) return null;
    return o;
  }
  function owed(c) { return c.status === 'paid' ? 0 : Math.max(0, c.amount - c.paid); }
  function isOpen(c) { return c.status !== 'paid'; }
  function openDays(c) { return Math.max(0, days(c.req, c.status === 'paid' && c.closed ? c.closed : today())); }
  function find(id) { for (var i = 0; i < data.claims.length; i++) if (data.claims[i].id === id) return data.claims[i]; return null; }
  function sorted(log) { return log.slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }); }
  function msg(t, bad) { var m = $('rtMsg'); m.textContent = t; m.className = 'bz-msg' + (t ? (bad ? ' bz-err' : ' bz-good') : ''); }

  /* render */
  function render() {
    var open = data.claims.filter(isOpen), tot = {};
    open.forEach(function (c) { var o = owed(c); if (o) tot[c.cur || ''] = (tot[c.cur || ''] || 0) + o; });
    $('rtOpen').textContent = open.length;
    var keys = Object.keys(tot);
    $('rtOwed').textContent = keys.length ? keys.map(function (k) { return money(tot[k], k); }).join(' + ') : '0';
    $('rtDays').textContent = open.length ? Math.max.apply(null, open.map(openDays)) : 0;
    var L = $('rtList');
    if (!data.claims.length) { L.innerHTML = '<div class="bz-empty"><p><b>No claims yet.</b></p><p>Add your first claim below. It is saved in this browser only.</p></div>'; return; }
    var list = data.claims.slice().sort(function (a, b) { return (isOpen(b) - isOpen(a)) || (a.req < b.req ? -1 : 1); });
    L.innerHTML = list.map(card).join('');
  }
  function card(c) {
    var t = today(), od = openDays(c), late = c.deadline && isOpen(c) && c.deadline < t ? days(c.deadline, t) : 0, o = owed(c), id = esc(c.id);
    var opts = ST.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === c.status ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('');
    var log = sorted(c.log).map(function (e) {
      return '<li><time datetime="' + e.d + '">' + nice(e.d) + '</time><span>' + (e.k === 'status' ? '<b>Status:</b> ' : e.k === 'payment' ? '<b>Payment:</b> ' : '') + esc(e.t) + (e.u ? (e.t ? ' ' : '') + '<a href="' + esc(e.u) + '" target="_blank" rel="noopener noreferrer">' + esc(e.u.replace(/^https?:\/\//, '')) + '</a>' : '') + '</span>' +
        '<button class="bz-x" type="button" data-a="dellog" data-id="' + id + '" data-e="' + esc(e.id) + '" aria-label="Delete entry from ' + nice(e.d) + '">&times;</button></li>';
    }).join('');
    return '<article class="bz-claim" aria-labelledby="h-' + id + '"><div class="bz-ch"><div><h3 id="h-' + id + '">' + esc(c.dev) + '</h3>' + (c.proj ? '<p class="bz-sub">' + esc(c.proj) + '</p>' : '') + '<p style="margin-top:8px"><span class="bz-tag" data-s="' + c.status + '">' + SL[c.status] + '</span></p></div>' +
      '<p class="bz-amt">' + money(o, c.cur) + '<small>outstanding of ' + money(c.amount, c.cur) + '</small></p></div>' +
      '<p class="bz-meta"><span>Requested ' + nice(c.req) + '</span><span>' + (isOpen(c) ? 'Open ' + od + ' day' + (od === 1 ? '' : 's') : 'Closed after ' + od + ' day' + (od === 1 ? '' : 's')) + '</span>' +
      (c.deadline ? '<span' + (late ? ' class="bz-late"' : '') + '>Deadline ' + nice(c.deadline) + (late ? ', ' + late + ' day' + (late === 1 ? '' : 's') + ' past' : '') + '</span>' : '') + (c.paid ? '<span>Received ' + money(c.paid, c.cur) + '</span>' : '') + '</p>' +
      (c.promised ? '<p class="bz-prom"><b>Promised:</b> ' + esc(c.promised) + '</p>' : '') +
      '<details' + (c.log.length ? '' : ' open') + '><summary>Contact log and links (' + c.log.length + ')</summary>' + (log ? '<ol class="bz-log">' + log + '</ol>' : '') +
      '<form class="bz-addrow" novalidate data-a="addlog" data-id="' + id + '"><label class="bz-lbl">Date<input type="date" name="d" value="' + t + '" required></label><label class="bz-lbl bz-wn">Note<input name="t" maxlength="2000" placeholder="Called sales office, promised transfer by Friday"></label>' +
      '<label class="bz-lbl bz-wl">Link (optional)<input name="u" type="url" inputmode="url" maxlength="500" placeholder="https://"></label><button class="btn btn-line bz-btn-s" type="submit">Add to log</button></form></details>' +
      '<div class="bz-acts"><label class="bz-lbl">Status<select data-a="status" data-id="' + id + '">' + opts + '</select></label><label class="bz-lbl">Received so far<input data-a="paid" data-id="' + id + '" inputmode="decimal" value="' + (c.paid || '') + '" placeholder="0"></label>' +
      '<button class="bz-link" type="button" data-a="print" data-id="' + id + '">Print timeline</button><button class="bz-link" type="button" data-a="del" data-id="' + id + '">Delete claim</button></div></article>';
  }

  /* timeline for print and export */
  function timeline(list) {
    var t = today();
    var h = '<h1>Refund and claim timeline</h1><p class="bz-pm">Prepared ' + nice(t) + ' with the Kolaboro refund tracker. Entries are as recorded by the buyer.</p>';
    list.forEach(function (c) {
      var ev = [{ d: c.req, t: 'Claim requested: ' + money(c.amount, c.cur) + (c.promised ? '. Promised: ' + c.promised : '') }];
      sorted(c.log).forEach(function (e) { ev.push({ d: e.d, t: (e.k === 'status' ? 'Status: ' : e.k === 'payment' ? 'Payment: ' : '') + e.t, u: e.u }); });
      if (c.deadline) ev.push({ d: c.deadline, t: 'Deadline' + (isOpen(c) && c.deadline < t ? ' (passed without full payment)' : '') });
      ev.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
      h += '<section><h2>' + esc(c.dev) + (c.proj ? ': ' + esc(c.proj) : '') + '</h2><p class="bz-pm">Status: ' + SL[c.status] + '. Claimed ' + money(c.amount, c.cur) + ', received ' + money(c.paid, c.cur) + ', outstanding ' + money(owed(c), c.cur) + '. ' + (isOpen(c) ? 'Open ' : 'Closed after ') + openDays(c) + ' days.</p>' +
        '<table><thead><tr><th>Date</th><th>What happened</th></tr></thead><tbody>' + ev.map(function (e) { return '<tr><td>' + nice(e.d) + '</td><td>' + esc(e.t) + (e.u ? '<br><a href="' + esc(e.u) + '">' + esc(e.u) + '</a>' : '') + '</td></tr>'; }).join('') + '</tbody></table></section>';
    });
    return h;
  }
  function printList(list) {
    if (!list.length) { msg('Add a claim first.', true); return; }
    var p = document.querySelector('body>.bz-print'); if (!p) { p = document.createElement('div'); p.className = 'bz-print'; document.body.appendChild(p); }
    p.innerHTML = timeline(list); document.body.classList.add('bz-printing');
    var done = function () { document.body.classList.remove('bz-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) {}
    setTimeout(done, 1500);
  }

  /* events */
  var F = $('rtF'), stSel = $('rtSt');
  stSel.innerHTML = ST.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('');
  $('rtReq').value = today();
  F.addEventListener('submit', function (e) {
    e.preventDefault(); var fm = $('rtFM'), el = F.elements;
    var dev = el.dev.value.trim(), amt = num(el.amount.value);
    if (!dev) { fm.textContent = 'Add the developer name.'; fm.className = 'bz-msg bz-err'; el.dev.focus(); return; }
    if (!amt) { fm.textContent = 'Add the amount you are claiming.'; fm.className = 'bz-msg bz-err'; el.amount.focus(); return; }
    if (!isDate(el.req.value)) { fm.textContent = 'Add the date you asked for it.'; fm.className = 'bz-msg bz-err'; el.req.focus(); return; }
    var c = clean({ id: uid(), dev: dev, proj: el.proj.value.trim(), amount: amt, paid: num(el.paid.value), cur: el.cur.value.trim(), req: el.req.value, deadline: el.deadline.value, promised: el.promised.value.trim(), status: el.status.value, log: [] });
    if (c.status === 'paid') c.closed = today();
    data.claims.push(c); save(); render();
    F.reset(); $('rtReq').value = today(); el.cur.value = c.cur || 'USD';
    fm.textContent = 'Saved in this browser.'; fm.className = 'bz-msg bz-good';
    var h = document.getElementById('h-' + c.id); if (h) h.scrollIntoView({ block: 'center' });
  });
  var L = $('rtList');
  L.addEventListener('submit', function (e) {
    var f = e.target; if (f.getAttribute('data-a') !== 'addlog') return; e.preventDefault();
    var c = find(f.getAttribute('data-id')); if (!c) return;
    var d = f.elements.d.value, t = f.elements.t.value.trim(), u = safeUrl(f.elements.u.value);
    if (!isDate(d)) { f.elements.d.focus(); return; }
    if (!t && !u) { f.elements.t.focus(); msg('Write a note or add a link first.', true); return; }
    if (f.elements.u.value.trim() && !u) { f.elements.u.focus(); msg('That link does not look valid.', true); return; }
    c.log.push({ id: uid(), d: d, k: 'note', t: str(t, 2000), u: u }); save(); render(); msg('Added to the log.');
  });
  L.addEventListener('change', function (e) {
    var el = e.target, a = el.getAttribute('data-a'), c = find(el.getAttribute('data-id')); if (!c) return;
    if (a === 'status' && SL[el.value] && el.value !== c.status) {
      c.log.push({ id: uid(), d: today(), k: 'status', t: SL[c.status] + ' to ' + SL[el.value], u: '' });
      c.status = el.value; c.closed = el.value === 'paid' ? today() : '';
      if (el.value === 'paid' && c.paid < c.amount) c.paid = c.amount;
      save(); render(); msg('Status updated and logged.');
    } else if (a === 'paid') {
      var p = num(el.value); if (p === c.paid) return;
      c.log.push({ id: uid(), d: today(), k: 'payment', t: 'received so far changed from ' + money(c.paid, c.cur) + ' to ' + money(p, c.cur), u: '' });
      c.paid = p; if (p > 0 && p < c.amount && (c.status === 'requested' || c.status === 'acknowledged')) { c.log.push({ id: uid(), d: today(), k: 'status', t: SL[c.status] + ' to ' + SL.partly, u: '' }); c.status = 'partly'; }
      save(); render(); msg('Payment logged.');
    }
  });
  L.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var a = b.getAttribute('data-a'), c = find(b.getAttribute('data-id')); if (!c) return;
    if (a === 'del') { if (!window.confirm('Delete the claim against ' + c.dev + ' and its whole log? This cannot be undone.')) return; data.claims = data.claims.filter(function (x) { return x !== c; }); save(); render(); msg('Claim deleted.'); }
    else if (a === 'dellog') { var eid = b.getAttribute('data-e'); c.log = c.log.filter(function (x) { return x.id !== eid; }); save(); render(); msg('Entry deleted.'); }
    else if (a === 'print') printList([c]);
  });
  $('rtPrintAll').addEventListener('click', function () { printList(data.claims.slice().sort(function (a, b) { return a.req < b.req ? -1 : 1; })); });
  $('rtExport').addEventListener('click', function () {
    if (!data.claims.length) { msg('Nothing to export yet.', true); return; }
    var blob = new Blob([JSON.stringify({ app: 'kolaboro-refund-tracker', v: 1, exported: new Date().toISOString(), claims: data.claims }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'refund-claims-' + today() + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    msg('Exported. Keep the file somewhere safe.');
  });
  $('rtImport').addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > 5e6) { msg('That file is too large.', true); e.target.value = ''; return; }
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result), arr = Array.isArray(d) ? d : d && d.claims; if (!Array.isArray(arr)) throw 0;
        var n = 0; arr.map(clean).filter(Boolean).forEach(function (c) { var old = find(c.id); if (old) data.claims[data.claims.indexOf(old)] = c; else data.claims.push(c); n++; });
        save(); render(); msg(n ? 'Imported ' + n + ' claim' + (n === 1 ? '' : 's') + '.' : 'No claims found in that file.', !n);
      } catch (x) { msg('That file is not a refund tracker export.', true); }
      e.target.value = '';
    };
    r.readAsText(file);
  });

  /* n40 k25: ?project=<slug> fills the developer, project and currency from the public record. The unsaved form is kept
     after # in the address (that part is never sent to a server), so a saved or shared link restores it. */
  (function () {
    var q, h; try { q = new URLSearchParams(location.search); h = new URLSearchParams(location.hash.slice(1)); } catch (e) { return; }
    var slug = String(q.get('project') || ''); if (!/^[a-z0-9-]{1,120}$/.test(slug)) slug = '';
    var K = ['dev', 'proj', 'amount', 'cur', 'req', 'deadline', 'status', 'paid'], el = F.elements, had = 0, tm;
    K.forEach(function (k) { if (h.has(k) && el[k]) { var v = str(h.get(k), 200); if (k === 'status') { if (SL[v]) el[k].value = v; } else el[k].value = v; had++; } });
    function write() { clearTimeout(tm); tm = setTimeout(function () { try { var u = new URLSearchParams(); K.forEach(function (k) { if (el[k] && el[k].value !== '') u.set(k, el[k].value); }); history.replaceState(null, '', location.pathname + location.search + '#' + u.toString()); } catch (e) {} }, 250); }
    F.addEventListener('input', write); F.addEventListener('change', write);
    F.addEventListener('submit', function () { setTimeout(function () { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }, 400); });
    var LG = (document.documentElement.lang || 'en').slice(0, 2), PRE = LG === 'en' ? '' : '/' + LG, W = {
      en: ['Form restored from this link. It is not saved until you press the button.', 'Filled from the public record of', 'developer', 'project', 'currency', 'Add the amount you are claiming and the date you asked for it.', 'The record of this project did not load, so nothing was filled in.'],
      es: ['Formulario recuperado de este enlace. No se guarda hasta que pulse el botón.', 'Rellenado con el registro público de', 'promotor', 'proyecto', 'moneda', 'Añada el importe que reclama y la fecha en que lo pidió.', 'El registro de este proyecto no se cargó, así que no se rellenó nada.'],
      fr: ['Formulaire repris de ce lien. Il n’est enregistré que lorsque vous appuyez sur le bouton.', 'Rempli à partir de la fiche publique de', 'promoteur', 'projet', 'devise', 'Ajoutez le montant réclamé et la date de votre demande.', 'La fiche de ce projet ne s’est pas chargée, rien n’a été rempli.'],
      de: ['Formular aus diesem Link wiederhergestellt. Gespeichert wird erst, wenn Sie auf die Schaltfläche drücken.', 'Ausgefüllt aus dem öffentlichen Datensatz von', 'Bauträger', 'Projekt', 'Währung', 'Tragen Sie den geforderten Betrag und das Datum Ihrer Anfrage ein.', 'Der Datensatz dieses Projekts wurde nicht geladen, daher wurde nichts ausgefüllt.'],
      nl: ['Formulier hersteld uit deze link. Het wordt pas bewaard als u op de knop drukt.', 'Ingevuld vanuit het openbare dossier van', 'ontwikkelaar', 'project', 'valuta', 'Vul het bedrag in dat u terugvraagt en de datum van uw verzoek.', 'Het dossier van dit project is niet geladen, dus er is niets ingevuld.'],
      ru: ['Форма восстановлена из этой ссылки. Она сохранится, только когда вы нажмёте кнопку.', 'Заполнено по открытой записи проекта', 'застройщик', 'проект', 'валюта', 'Укажите сумму требования и дату, когда вы его отправили.', 'Запись этого проекта не загрузилась, поэтому ничего не заполнено.'],
      zh: ['已从此链接恢复表单。按下按钮后才会保存。', '已根据以下项目的公开记录填写：', '开发商', '项目', '币种', '请填写您索回的金额和提出要求的日期。', '该项目的记录未能加载，因此没有填写任何内容。'],
      ar: ['تمت استعادة النموذج من هذا الرابط. لا يُحفظ حتى تضغط الزر.', 'تمت التعبئة من السجل العام لمشروع', 'المطوّر', 'المشروع', 'العملة', 'أضف المبلغ الذي تطالب به وتاريخ طلبك.', 'لم يُحمَّل سجل هذا المشروع، لذلك لم تتم تعبئة أي شيء.']
    }[LG];
    W = W || ['Form restored from this link. It is not saved until you press the button.', 'Filled from the public record of', 'developer', 'project', 'currency', 'Add the amount you are claiming and the date you asked for it.', 'The record of this project did not load, so nothing was filled in.'];
    function note(t, bad) { var p = document.createElement('p'); p.className = 'kup-note'; p.setAttribute('role', 'status'); p.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:10px;border:1px solid ' + (bad ? '#B3261E' : 'var(--line,#D8DEDB)'); p.innerHTML = t; F.parentNode.insertBefore(p, F); }
    if (had) { note(esc(W[0])); }
    if (!slug || (had && el.dev.value)) return;
    fetch('/projects/' + slug + '/record.json').then(function (x) { if (!x.ok) throw 0; return x.json(); }).then(function (r) {
      var pr = ''; (r.facts || []).forEach(function (f) { if (f.field === 'pr') pr = String(f.value || ''); });
      var m = /^([A-Z]{3})\s/.exec(pr), bits = [];
      if (r.developer) { el.dev.value = str(r.developer, 120); bits.push(W[2]); }
      if (r.name) { el.proj.value = str(r.name, 120); bits.push(W[3]); }
      if (m) { el.cur.value = m[1]; bits.push(W[4] + ' ' + m[1]); }
      note(esc(W[1]) + ' <a href="' + PRE + '/projects/' + esc(slug) + '/">' + esc(r.name || slug) + '</a>' + (bits.length ? ': ' + esc(bits.join(', ')) : '') + '. ' + esc(W[5]));
      write();
    }).catch(function () { note(esc(W[6]), true); });
  })();
  load(); if (!okStore) save(); render();
})();
