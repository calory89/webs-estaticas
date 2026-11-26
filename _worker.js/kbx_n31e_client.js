// comments: _notes/kolaboro-worker-comments.txt
function n31() {
  'use strict';
  var LG = (document.documentElement.lang || 'en').slice(0, 2), LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[LG] || 'en-GB';
  var PRE = LG === 'en' ? '' : '/' + LG;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function upUrl(o) { try { var q = new URLSearchParams(location.search), u = new URLSearchParams(); if (q.get('project')) u.set('project', q.get('project')); for (var k in o) if (o[k]) u.set(k, o[k]); history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : '') + location.hash); } catch (e) {} }   // n40 k25: the address keeps the inputs
  function f(s, v) { s = String(s); for (var k in v) s = s.split('{' + k + '}').join(v[k]); return s; }
  function nf(n, o) { try { return Number(n).toLocaleString(LOC, o || { maximumFractionDigits: 1 }); } catch (e) { return String(n); } }
  function ymLabel(k, long) { try { return new Intl.DateTimeFormat(LOC, { month: long ? 'long' : 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(k + '-15T12:00:00Z')); } catch (e) { return k; } }
  function mi(k) { var m = /^(\d{4})-(\d{2})$/.exec(String(k || '')); return m ? +m[1] * 12 + (+m[2] - 1) : null; }
  function ik(i) { return Math.floor(i / 12) + '-' + ('0' + (i % 12 + 1)).slice(-2); }
  var PDFJS = '/tools/contract-check/vendor/pdf-4.10.38.min.mjs', WK = '/tools/contract-check/vendor/pdf-4.10.38.worker.min.mjs', lib = null;
  function pdfPages(buf, onPage) {
    return (lib ? Promise.resolve(lib) : import(PDFJS).then(function (m) { m.GlobalWorkerOptions.workerSrc = WK; lib = m; return m; })).then(function (L) {
      return L.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise;
    }).then(function (pdf) {
      var pages = [], n = Math.min(pdf.numPages, 300), chain = Promise.resolve();
      for (var i = 1; i <= n; i++) (function (i) { chain = chain.then(function () { if (onPage) onPage(i, n); return pdf.getPage(i); }).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
        var s = '', lastY = null; tc.items.forEach(function (it) { var y = it.transform ? Math.round(it.transform[5]) : null; if (lastY != null && y != null && Math.abs(y - lastY) > 2) s += it.hasEOL ? '\n' : (Math.abs(y - lastY) > 14 ? '\n\n' : '\n'); s += it.str; if (it.hasEOL) s += '\n'; lastY = y; }); pages.push(s); }); })(i);
      return chain.then(function () { return pages; });
    });
  }
  function readFile(file, onPage) {
    return new Promise(function (ok, bad) {
      if (!file) return ok(null);
      if (file.size > 40 * 1024 * 1024) return bad(new Error('big'));
      var rd = new FileReader(), txt = /\.txt$/i.test(file.name) || /^text\//.test(file.type);
      rd.onerror = function () { bad(new Error('read')); };
      rd.onload = function () { if (txt) ok([String(rd.result)]); else pdfPages(new Uint8Array(rd.result), onPage).then(ok, bad); };
      if (txt) rd.readAsText(file); else rd.readAsArrayBuffer(file);
    });
  }

  // ------------------------------------------------------------------ 159: contract reader, what is missing by country
  var CB = $('n31crc');
  if (CB) (function () {
    var D = JSON.parse(CB.getAttribute('data-m')), sel = $('n31crc-c'), out = $('n31crc-o'), text = null;
    function run() {
      var cc = sel.value; if (!cc) { out.innerHTML = ''; return; }
      if (text == null) { out.innerHTML = '<p class="n31s">' + esc(D.msg.wait) + '</p>'; return; }
      var L = D.C[cc] || [], h = '';
      L.forEach(function (it) {
        var re = new RegExp('(?:' + it.rx.join('|') + ')', 'iu'), m = re.exec(text);
        h += '<section class="n31c ' + (m ? 'is-ok' : 'is-no') + '"><h3>' + esc(it.l) + '</h3><p><b>' + esc(m ? D.msg.found : D.msg.miss) + '</b>' + (m ? ': <mark dir="auto">' + esc(m[0]) + '</mark>' : '') + '</p>' + (it.n ? '<p>' + esc(it.n) + '</p>' : '') +
          '<p class="n31m">' + esc(D.msg.src) + ': ' + it.s.map(function (s) { return '<a href="' + esc(s.u) + '" rel="noopener" target="_blank">' + esc(s.n) + '</a>'; }).join(' · ') + '</p></section>';
      });
      out.innerHTML = h;
    }
    document.addEventListener('n30cr:text', function (e) { text = (e.detail || []).join('\n'); run(); });
    sel.addEventListener('change', run);
  })();

  var R = $('n31'); if (!R) return;
  var K = R.getAttribute('data-k'), M = {}; try { M = JSON.parse(R.getAttribute('data-m') || '{}'); } catch (e) {}
  var st = $('n31-s'), out = $('n31-o');
  function say(t) { if (st) st.textContent = t || ''; }

  // ------------------------------------------------------------------ 156 / 172: find a listing, handover history
  if (K === 'find-listing' || K === 'handover-history') (function () {
    var form = $('n31-fl'), inp = $('n31-q');
    function norm(s) { return String(s || '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
    var LOCALE = /^\/(en|ar|id|th|es|pt|tr|ru|zh|de|fr)(?=\/|$)/;
    function urlKey(u) { var x; try { x = new URL(u); } catch (e) { return null; } var host = x.hostname.toLowerCase().replace(/^www\./, ''), path = x.pathname.toLowerCase().replace(/\/+$/, '').replace(LOCALE, ''); return path.length >= 8 ? host + path : null; }
    var SLD = ['co', 'com', 'net', 'org', 'or', 'ac', 'go', 'web', 'my', 'biz', 'gov', 'edu', 'ne', 'in', 'sch', 'ltd', 'plc', 'gen', 'firm'];
    function regDomain(h) { var p = String(h).toLowerCase().replace(/^www\./, '').split('.'); if (p.length <= 2) return p.join('.'); return (SLD.indexOf(p[p.length - 2]) >= 0 && p[p.length - 1].length === 2 ? p.slice(-3) : p.slice(-2)).join('.'); }
    function keysFor(pageUrl, texts) {
      var o = [], seen = {}; function add(k, s) { var kk = k + '|' + s; if (!seen[kk]) { seen[kk] = 1; o.push({ k: k, s: kk }); } }
      var uk = urlKey(pageUrl); if (uk) add('u', uk);
      try { var h = new URL(pageUrl).hostname; if (h.indexOf('.') > 0) add('d', regDomain(h)); } catch (e) {}
      texts.forEach(function (tx) { var w = norm(tx).split(' ').filter(Boolean).slice(0, 32); for (var i = 0; i < w.length; i++) for (var n = 1; n <= 8 && i + n <= w.length; n++) { var s = w.slice(i, i + n).join(' '); if (n >= 2 && s.length >= 8) add('n', s); if (n <= 5 && s.length >= 6) add('v', s); } });
      return o.slice(0, 700);
    }
    function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
    function h16(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return hex(b).slice(0, 16); }); }
    function resolve(res, ks) {
      if (!res || !res.hits) return null;
      var mine = {}; ks.forEach(function (x) { mine[x.h] = x.k; });
      var Rf = res.refs || {}, by = { u: [], d: [], n: [], v: [] };
      res.hits.forEach(function (x) { if (mine[x.h] === x.k && Rf[x.r] && by[x.k]) by[x.k].push(Rf[x.r]); });
      var uniq = function (a) { var s = {}, r = []; a.forEach(function (z) { var id = z.t + ':' + (z.s || z.np); if (!s[id]) { s[id] = 1; r.push(z); } }); return r; };
      var m = { project: null, list: null, dev: null, how: null };
      var u = by.u.filter(function (z) { return z.t === 'p'; }); if (u.length) { m.project = u[0]; m.how = 'u'; }
      var dP = uniq(by.d.filter(function (z) { return z.t === 'p'; })), g = by.d.filter(function (z) { return z.t === 'g'; })[0], dV = uniq(by.d.filter(function (z) { return z.t === 'v'; }));
      if (!m.project && dP.length === 1) { m.project = dP[0]; m.how = 'd'; }
      if (!m.project) {
        var names = uniq(by.n.filter(function (z) { return z.t === 'p'; }));
        if (g) { var inG = names.filter(function (z) { return g.ps.indexOf('p:' + z.s) >= 0; }); if (inG.length) names = inG; }
        if (names.length > 1) { var Ln = names.map(function (z) { return norm(z.n).length; }), mx = Math.max.apply(null, Ln), top = names.filter(function (z, i) { return Ln[i] === mx; }); if (top.length === 1) names = top; }
        if (names.length === 1) { m.project = names[0]; m.how = 'n'; } else if (names.length > 1) { m.list = names.slice(0, 8); m.how = 'nn'; }
      }
      if (!m.project && !m.list && g) { m.list = g.ps.map(function (r) { return Rf[r]; }).filter(Boolean); m.how = 'g'; }
      if (!m.project && !m.list) { var vs = uniq(by.v.filter(function (z) { return z.t === 'v'; })); if (dV.length === 1) m.dev = dV[0]; else if (vs.length === 1) m.dev = vs[0]; if (m.dev) m.how = 'v'; }
      return m.project || m.list || m.dev ? m : null;
    }
    function fmtD(d) { if (!d) return ''; var s = String(d); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { try { return new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(s + 'T12:00:00Z')); } catch (e) {} } if (/^\d{4}-\d{2}$/.test(s)) return ymLabel(s, true); return s; }
    function card(h, how) {
      var rows = (h.events || []).map(function (e) { return '<tr><td data-l="' + esc(M.th[0]) + '"><b dir="ltr">' + esc(fmtD(e.date)) + '</b></td><td data-l="' + esc(M.th[1]) + '">' + esc(M.kinds[e.kind] || M.kinds[e.source] || e.kind || '') + '</td><td data-l="' + esc(M.th[2]) + '">' + esc(fmtD(e.seen) || '') + '</td><td data-l="' + esc(M.th[3]) + '">' + esc(fmtD(e.last_seen) || '') + '</td></tr>'; }).join('');
      return '<section class="n31c is-ok"><h3><a href="' + PRE + '/projects/' + esc(h.slug) + '/"><bdi>' + esc(h.name) + '</bdi></a></h3>' + (how ? '<p class="n31m">' + esc(M.how[how] || '') + '</p>' : '') +
        '<p>' + (h.developer ? esc(M.dev) + ': <bdi>' + esc(h.developer) + '</bdi> · ' : '') + (h.stage ? esc(M.st) + ': ' + esc(h.stage) + ' · ' : '') + (h.current ? '<b>' + esc(f(M.cur, { d: fmtD(h.current) })) + '</b>' : '') + '</p>' +
        (h.moves ? '<p>' + esc(f(M.moves, { k: h.moves })) + '</p>' : '') + (rows ? '<h4>' + esc(M.hist) + '</h4><div class="n31t n31stack"><table><thead><tr>' + M.th.map(function (t) { return '<th scope="col">' + esc(t) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '') +
        '<p class="n31row"><a class="k-btn" href="' + PRE + '/projects/' + esc(h.slug) + '/">' + esc(M.open) + '</a><a class="n31b" style="display:inline-flex;align-items:center;text-decoration:none" href="' + PRE + '/projects/' + esc(h.slug) + '/timeline/">' + esc(M.tl) + '</a></p></section>';
    }
    function show(slug, how) {
      say(M.wait);
      return fetch('/api/v1/handover-history/' + encodeURIComponent(slug), { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (h) { say(''); if (!h) { out.innerHTML = '<p>' + esc(M.none) + '</p>'; return; } out.innerHTML = card(h, how); var a = out.querySelector('h3 a'); if (a) a.focus(); });
    }
    function pick(list, how) {
      out.innerHTML = '<p class="n31m">' + esc(M.how[how] || M.more) + '</p><ul class="n31rel" style="display:block">' + list.map(function (p) { return '<li><button type="button" class="n31b" data-s="' + esc(p.s || p.slug) + '"><bdi>' + esc(p.n || p.name) + '</bdi>' + ((p.mk || p.market) ? ' · ' + esc(p.mk || p.market) : '') + '</button></li>'; }).join('') + '</ul>';
      out.querySelectorAll('[data-s]').forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-s'), how === 'q' ? 'q' : 'n'); }); });
    }
    function byUrl(q) {
      var url = /^https?:\/\//i.test(q) ? q : 'https://' + q, words = [];
      try { var x = new URL(url); decodeURIComponent(x.pathname).split('/').forEach(function (seg) { if (seg) words.push(seg.replace(/[-_+.]+/g, ' ')); }); words.push(words.join(' ')); } catch (e) { say(M.none); return; }
      var ks = keysFor(url, words);
      return Promise.all(ks.map(function (k) { return h16(k.s).then(function (h) { k.h = h; return k; }); })).then(function (ks2) {
        var p = {}; ks2.forEach(function (k) { p[k.h.slice(0, 4)] = 1; });
        return fetch('/api/x/j/xr?p=' + Object.keys(p).sort().slice(0, 500).join(','), { credentials: 'omit', referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
          var m = resolve(res, ks2); say('');
          if (!m) { out.innerHTML = '<p>' + esc(M.none) + '</p>'; return; }
          if (m.project) return show(m.project.s, m.how);
          if (m.list) return pick(m.list, m.how);
          out.innerHTML = '<section class="n31c"><h3><a href="' + PRE + '/developers/' + esc(m.dev.s) + '/"><bdi>' + esc(m.dev.n) + '</bdi></a></h3><p class="n31m">' + esc(M.how.v) + '</p></section>';
        });
      });
    }
    function byName(q) {
      return fetch('/api/v1/find?lang=' + LG + '&q=' + encodeURIComponent(q), { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : { results: [] }; }).then(function (d) {
        say(''); var L = d.results || []; if (!L.length) { out.innerHTML = '<p>' + esc(M.none) + '</p>'; return; }
        if (L.length === 1) return show(L[0].slug, 'q'); pick(L, 'q');
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var q = inp.value.trim(); if (q.length < 2) return; out.innerHTML = ''; say(M.wait);
      var isUrl = /^https?:\/\//i.test(q) || /^[\w-]+(\.[\w-]+)+\/\S+/.test(q);
      Promise.resolve(isUrl ? byUrl(q) : byName(q)).catch(function () { say(M.err); });
    });
    var qs = new URLSearchParams(location.search).get('q'); if (qs) { inp.value = qs; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit')); }
  })();

  // ------------------------------------------------------------------ 162: budget against open programmes
  if (K === 'visa-by-investment') (function () {
    var form = $('n31-vb'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var a = +$('n31-b').value, c = $('n31-bc').value, fx = M.fx || {};
      if (!(a > 0) || !fx[c]) { say(''); return; }
      var usd = a / fx[c], ok = [];
      document.querySelectorAll('[data-min-usd]').forEach(function (s) { var m = +s.getAttribute('data-min-usd'); s.style.outline = ''; if (m && usd >= m) { ok.push(s.querySelector('h3').textContent.split(':')[0]); s.style.outline = '3px solid var(--k-sea,#155C75)'; } });
      say(ok.length ? f(M.msg.ok, { k: ok.join(', ') }) : M.msg.no);
    });
    form.addEventListener('submit', function () { upUrl({ b: $('n31-b').value, c: $('n31-bc').value }); });
    if (+$('n31-b').value > 0) form.dispatchEvent(new Event('submit', { cancelable: true }));
  })();

  // ------------------------------------------------------------------ 163: at most four countries
  if (K === 'compare-countries') (function () {
    var form = $('n31-cc'); if (!form) return; var B = form.querySelectorAll('input[name=cc]');
    function lim() { var n = 0; B.forEach(function (b) { if (b.checked) n++; }); B.forEach(function (b) { b.disabled = !b.checked && n >= 4; }); }
    B.forEach(function (b) { b.addEventListener('change', lim); }); lim();
    form.addEventListener('submit', function () { var h = form.querySelector('input[name=c]'); if (h) h.remove(); });
  })();

  // ------------------------------------------------------------------ 164: on time?
  if (K === 'on-time') (function () {
    var form = $('n31-ot');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var mk = $('n31-mk').value, sel = $('n31-mk'), name = sel.options[sel.selectedIndex].text.replace(/\s*\([^)]*\)\s*$/, ''), r = mk ? M.rows[mk] : M.all;
      out.innerHTML = '';
      if (!r) { say(M.msg.pick); return; }
      if (!r.n) { say(''); out.innerHTML = '<p>' + esc(M.msg.none) + '</p>'; return; }
      if (r.n < 5) { say(''); out.innerHTML = '<p>' + esc(f(M.msg.few, { m: name, n: nf(r.n) })) + '</p>'; return; }
      var h = '<section class="n31c is-mid"><p>' + esc(f(M.msg.res, { m: name, n: nf(r.n), med: nf(r.med), p25: nf(r.p25), p75: nf(r.p75), d: nf(r.done || 0), u: nf(r.notdue || 0) })) + '</p>';
      var dv = $('n31-d').value;
      if (dv) { var i = mi(dv); if (i == null) h += '<p>' + esc(M.msg.bad) + '</p>'; else h += '<p><b>' + esc(f(M.msg.est, { med: nf(r.med), date: ymLabel(dv, true), to: ymLabel(ik(i + Math.round(r.med)), true) })) + '</b></p>'; }
      out.innerHTML = h + '</section>'; say('');
    });
    form.addEventListener('submit', function () { upUrl({ mk: $('n31-mk').value, d: $('n31-d').value }); });
    if ($('n31-mk').value || $('n31-d').value) form.dispatchEvent(new Event('submit', { cancelable: true }));
  })();

  // ------------------------------------------------------------------ 169: request documents
  if (K === 'request-documents') (function () {
    var form = $('n31-rd'), su = $('n31-su'), bo = $('n31-bo'), mt = $('n31-mt');
    function build() {
      var l = $('n31-l').value, T = M.tpl[l] || M.tpl.en, p = $('n31-p').value.trim(), dv = $('n31-dv').value.trim(), un = $('n31-un').value.trim(), me = $('n31-me').value.trim();
      var docs = []; form.querySelectorAll('fieldset input[type=checkbox]').forEach(function (b) { if (b.checked) docs.push(T.docs[b.value]); });
      var s = f(T.sub, { p: p || '…' }), b = f(T.hi, { dv: dv || p || '…' }) + '\n\n' + f(T.intro, { p: p || '…', u: un ? f(T.unit, { u: un }) : '' }) + '\n\n' + docs.map(function (d, i) { return (i + 1) + '. ' + d; }).join('\n') + '\n\n' + T.close + '\n\n' + T.sig + (me ? '\n' + me : '');
      su.value = s; bo.value = b; bo.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr'); bo.setAttribute('lang', l);
      mt.href = 'mailto:?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(b);
    }
    form.addEventListener('input', build); form.addEventListener('change', build); build();
    $('n31-cp').addEventListener('click', function () { var t = su.value + '\n\n' + bo.value; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { say(M.copied); }, function () { bo.select(); try { document.execCommand('copy'); say(M.copied); } catch (e) {} }); });
  })();

  // ------------------------------------------------------------------ 175: area report (name and logo stay on the device)
  if (K === 'area-report') (function () {
    var an = $('n31-an'), al = $('n31-al'), ag = $('n31-ag'), lg = $('n31-lg'), pr = $('n31-pr');
    if (an && ag) an.addEventListener('input', function () { ag.textContent = an.value; });
    if (al && lg) al.addEventListener('change', function () { var fl = al.files[0]; if (!fl || !/^image\//.test(fl.type) || fl.size > 3e6) return; lg.src = URL.createObjectURL(fl); lg.hidden = false; lg.alt = an.value || ''; });
    if (pr) pr.addEventListener('click', function () { window.print(); });
  })();

  // ------------------------------------------------------------------ 177: translate in the browser
  if (K === 'translate') (function () {
    var form = $('n31-tr'), fi = $('n31-tf'), ta = $('n31-tt'), m = M.msg;
    function paras(pages) { var o = []; pages.forEach(function (p) { String(p).split(/\n{2,}/).forEach(function (z) { z = z.replace(/\s+/g, ' ').trim(); if (z.length > 1) { while (z.length > 1800) { var cut = z.lastIndexOf('. ', 1800); cut = cut > 400 ? cut + 1 : 1800; o.push(z.slice(0, cut)); z = z.slice(cut).trim(); } o.push(z); } }); }); return o.slice(0, 600); }
    function render(P, T) { out.innerHTML = P.map(function (p, i) { return '<div class="n31c"><p dir="auto"' + (T ? '' : '') + '>' + esc(T ? (T[i] == null ? '…' : T[i]) : p) + '</p>' + (T ? '<p class="n31m" dir="auto">' + esc(p) + '</p>' : '') + '</div>'; }).join(''); }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var t0 = performance.now();
      var get = fi.files[0] ? readFile(fi.files[0], function (i, n) { say(f(m.rd, { i: i, n: n })); }) : Promise.resolve(ta.value.trim() ? [ta.value] : null);
      get.then(function (pages) {
        if (!pages) return;
        var P = paras(pages); if (!P.length) { say(m.scan); return; }
        var to = $('n31-tl').value, from = $('n31-ts').value;
        if (!('Translator' in self)) { say(m.no); render(P, null); return; }
        var det = from ? Promise.resolve(from) : ('LanguageDetector' in self ? self.LanguageDetector.create().then(function (d) { return d.detect(P.slice(0, 8).join(' ').slice(0, 2000)); }).then(function (r) { var l = r && r[0] && r[0].detectedLanguage; return l && l !== 'und' ? l : 'en'; }) : Promise.resolve('en'));
        return det.then(function (src) {
          src = String(src).slice(0, 2); say(f(m.det, { l: src }));
          if (src === to) { render(P, P); say(f(m.done, { n: P.length, s: ((performance.now() - t0) / 1000).toFixed(1) })); return; }
          return self.Translator.availability({ sourceLanguage: src, targetLanguage: to }).then(function (a) {
            if (a === 'unavailable') { say(m.err); render(P, null); return; }
            return self.Translator.create({ sourceLanguage: src, targetLanguage: to, monitor: function (mo) { mo.addEventListener('downloadprogress', function (ev) { say(f(m.dl, { p: Math.round((ev.loaded || 0) * 100) })); }); } }).then(function (tr) {
              var T = new Array(P.length); render(P, T); var i = 0;
              function next() { if (i >= P.length) { say(f(m.done, { n: P.length, s: ((performance.now() - t0) / 1000).toFixed(1) })); return; } var k = i++; return tr.translate(P[k]).then(function (x) { T[k] = x; var c = out.children[k]; if (c) c.firstChild.textContent = x; return next(); }); }
              return next();
            });
          });
        });
      }).catch(function (er) { say(er && er.message === 'big' ? m.big : m.err); });
    });
  })();

  // ------------------------------------------------------------------ 160: receipt check
  if (K === 'receipt-check') (function () {
    var form = $('n31-rc'), fi = $('n31-rf'), ta = $('n31-rt'), m = M.msg;
    var LEN = { AE: 23, GB: 22, ES: 24, PT: 25, DE: 22, FR: 27, NL: 18, TR: 26, CY: 28, GR: 27, IT: 27, CH: 21, SA: 24, QA: 29, BH: 22, PL: 28, BE: 16, IE: 22, AT: 20, LU: 20, MT: 31, HR: 21, BG: 22, RO: 24, KW: 30, JO: 30, EG: 29, IL: 23, LB: 28, ME: 22, AL: 28, GE: 22, MU: 30, SE: 24, NO: 15, DK: 18, FI: 18, CZ: 24, HU: 28, SK: 24, SI: 19, EE: 20, LV: 21, LT: 20, UA: 29, BR: 29, PK: 24, KZ: 20 };
    function mod97(s) { var r = s.slice(4) + s.slice(0, 4), n = ''; for (var i = 0; i < r.length; i++) { var c = r.charCodeAt(i); n += c >= 65 && c <= 90 ? String(c - 55) : r[i]; } var rem = 0; for (var j = 0; j < n.length; j += 7) rem = parseInt(String(rem) + n.slice(j, j + 7), 10) % 97; return rem === 1; }
    function ibans(t) { var o = [], seen = {}, re = /\b([A-Z]{2}\d{2}(?:[ \-]?[A-Z0-9]){10,32})/g, x; var U = t.toUpperCase(); while ((x = re.exec(U))) { var raw = x[1].replace(/[ \-]/g, ''), cc = raw.slice(0, 2), L = LEN[cc], v = L ? raw.slice(0, L) : raw.slice(0, 34); if (L && raw.length < L) continue; if (!seen[v]) { seen[v] = 1; o.push(v); } } return o; }
    function grab(t, re) { var x = re.exec(t); return x ? x[2].replace(/\s{2,}.*$/, '').trim() : null; }
    var BEN = /(beneficiary(?: name)?|account name|account holder|payee|in favou?r of|beneficiario|titular|b[ée]n[ée]ficiaire|titulaire|empf[äa]nger|kontoinhaber|begunstigde|получатель|收款人|المستفيد)\s*[:：\-]?\s*([^\n]{2,90})/i;
    var REF = /(payment reference|reference|ref\.|referencia|concepto|r[ée]f[ée]rence|libell[ée]|verwendungszweck|kenmerk|omschrijving|назначение(?: платежа)?|附言|备注|المرجع)\s*[:：\-#]?\s*([^\n]{2,90})/i;
    var SW = /(swift|bic)(?:\s*code)?\s*[:：\-]?\s*([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/i;
    var CO = /\b(L\.?L\.?C|LTD|LIMITED|FZE|FZCO|FZ-?LLC|PJSC|P\.?J\.?S\.?C|DEVELOP\w*|PROPERT\w*|REAL ESTATE|ESCROW|TRUST|PROJECT|BANK|S\.?L\.?U?|S\.?A\.?U?|GMBH|B\.?V\.?|INC|CORP\w*|PT|SDN|BHD|CO\.|COMPANY|HOLDING\w*|GROUP|DMCC|LDA|LLP|PLC|ACCOUNT)\b/i;
    function li(ok, t) { return '<li class="n31c ' + (ok === true ? 'is-ok' : ok === false ? 'is-no' : 'is-mid') + '" style="list-style:none">' + esc(t) + '</li>'; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var get = fi.files[0] ? readFile(fi.files[0], function (i, n) { say(f(m.rd, { i: i, n: n })); }) : Promise.resolve(ta.value.trim() ? [ta.value] : null);
      get.then(function (pages) {
        if (!pages) return; var t = pages.join('\n'); say('');
        var L = [], dubai = $('n31-rd').checked, proj = $('n31-rp').value.trim(), I = ibans(t), ben = grab(t, BEN), ref = grab(t, REF), sw = grab(t, SW);
        if (!I.length) L.push(li(false, m.none));
        I.slice(0, 3).forEach(function (v) { var ok = mod97(v); L.push(li(ok, f(m.iban, { i: v.replace(/(.{4})/g, '$1 ').trim() }) + ': ' + (ok ? m.ok : m.bad))); var cc = v.slice(0, 2); var cn = cc; try { cn = new Intl.DisplayNames([LOC], { type: 'region' }).of(cc); } catch (er) {} L.push(li(null, f(m.cc, { c: cn }))); if ((dubai) && cc !== 'AE') L.push(li(false, m.ae)); });
        if (sw) L.push(li(null, f(m.sw, { s: sw.toUpperCase() })));
        if (ben) { L.push(li(null, f(m.ben, { b: ben }))); if (!CO.test(ben) && ben.split(/\s+/).length <= 4) L.push(li(false, m.pers)); } else L.push(li(null, m.noben));
        if (dubai || I.some(function (v) { return v.slice(0, 2) === 'AE'; })) { var pw = proj ? proj.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; }) : []; var b = (ben || '').toLowerCase(); var hit = /escrow|trust account|project account|حساب الضمان/.test(b) || pw.some(function (w) { return b.indexOf(w) >= 0; }); L.push(li(hit, hit ? m.esc : m.noesc)); }
        L.push(li(ref ? null : false, ref ? f(m.ref, { r: ref }) : m.noref));
        L.push(li(null, m.call));
        out.innerHTML = '<ul style="padding:0">' + L.join('') + '</ul>';
      }).catch(function () { say(m.scan); });
    });
  })();

  // ------------------------------------------------------------------ 171: payment plan against construction progress
  if (K === 'payment-vs-progress') (function () {
    var form = $('n31-pv'), rowsEl = $('n31-rows'), m = M.msg, pj = M.pj;
    function toMonth(s) { s = String(s || ''); var x; if ((x = /^(\d{4})-(\d{2})/.exec(s))) return x[1] + '-' + x[2]; if ((x = /(\d{4})-?Q([1-4])|Q([1-4])\s*(\d{4})/i.exec(s))) { var y = x[1] || x[4], q = +(x[2] || x[3]); return y + '-' + ('0' + q * 3).slice(-2); } if ((x = /(\d{4})-?H([12])|H([12])\s*(\d{4})/i.exec(s))) { var y2 = x[1] || x[4], h = +(x[2] || x[3]); return y2 + '-' + (h === 1 ? '06' : '12'); } if ((x = /^(\d{4})$/.exec(s.trim()))) return x[1] + '-12'; return ''; }
    if (pj) {
      var s0 = toMonth(pj.start), h0 = toMonth(pj.ho); if (s0) $('n31-ps').value = s0; if (h0) $('n31-ph').value = h0;
      if (pj.med != null) $('n31-pdm').textContent = f(m.med, { m: pj.mk, k: nf(pj.med), n: nf(pj.mn) });
      // a plain list of percentages that adds up to 100 (e.g. "10/20/20/20/15/15" or "25% / 70% / 5%"): first at signing, last at handover, the rest spread over construction
      var nums = String(pj.plan || '').match(/\d+(?:\.\d+)?(?=\s*%|\s*\/|\s*$)/g);
      if (nums) { nums = nums.map(Number).filter(function (v) { return v > 0 && v <= 100; }); var sum = nums.reduce(function (a, b) { return a + b; }, 0); if (nums.length >= 2 && nums.length <= 12 && Math.abs(sum - 100) < 0.6) { var tpl = rowsEl.firstElementChild.cloneNode(true); rowsEl.innerHTML = ''; nums.forEach(function (v, i) { var r = tpl.cloneNode(true), I = r.querySelectorAll('input,select'); I[0].value = v; I[1].value = i === 0 ? 's' : i === nums.length - 1 ? 'h' : 'b'; I[2].value = i === 0 || i === nums.length - 1 ? 0 : Math.round(i / (nums.length - 1) * 100); rowsEl.appendChild(r); }); } }
    }
    $('n31-add').addEventListener('click', function () { var r = rowsEl.lastElementChild.cloneNode(true); r.querySelectorAll('input').forEach(function (i) { i.value = 0; }); rowsEl.appendChild(r); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); out.innerHTML = '';
      var S = mi($('n31-ps').value), H = mi($('n31-ph').value), dl = Math.max(0, +$('n31-pd').value || 0);
      var P = []; rowsEl.querySelectorAll('.n31pr').forEach(function (r) { var I = r.querySelectorAll('input,select'); var p = +I[0].value; if (p > 0) P.push({ p: p, t: I[1].value, v: +I[2].value || 0 }); });
      var sum = P.reduce(function (a, b) { return a + b.p; }, 0);
      if (S == null || H == null || H <= S || Math.abs(sum - 100) > 0.6) { say(m.bad + ' ' + f(m.sum, { s: nf(sum) })); return; }
      var H2 = H + dl, N = H2 - S;
      P.forEach(function (x) { x.due = x.t === 's' ? S : x.t === 'h' ? H2 : x.t === 'm' ? S + x.v : S + Math.round(Math.min(100, x.v) / 100 * N); });
      var pts = [], gap = { g: 0, i: S, p: 0, b: 0 };
      for (var i = S - 1; i <= H2 + 1; i++) { var paid = P.filter(function (x) { return x.due <= i; }).reduce(function (a, b) { return a + b.p; }, 0), built = Math.max(0, Math.min(100, (i - S) / N * 100)); pts.push([i, paid, built]); if (paid - built > gap.g) gap = { g: paid - built, i: i, p: paid, b: built }; }
      var W = 640, Hh = 260, L0 = 44, B0 = 30, X = function (i) { return L0 + (i - (S - 1)) / (H2 + 2 - S) * (W - L0 - 10); }, Y = function (v) { return 10 + (100 - v) / 100 * (Hh - 10 - B0); };
      var step = pts.map(function (p, k) { return (k ? 'H' + X(p[0]).toFixed(1) + 'V' + Y(p[1]).toFixed(1) : 'M' + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)); }).join(''), line = 'M' + X(S).toFixed(1) + ',' + Y(0).toFixed(1) + 'L' + X(H2).toFixed(1) + ',' + Y(100).toFixed(1) + 'H' + X(H2 + 1).toFixed(1);
      var yrs = ''; for (var y = Math.ceil((S - 1) / 12) * 12; y <= H2 + 1; y += 12) yrs += '<line x1="' + X(y).toFixed(1) + '" x2="' + X(y).toFixed(1) + '" y1="10" y2="' + (Hh - B0) + '" stroke="currentColor" stroke-opacity=".15"/><text x="' + X(y).toFixed(1) + '" y="' + (Hh - 10) + '" font-size="12" text-anchor="middle" fill="currentColor">' + (y / 12) + '</text>';
      var grid = [0, 25, 50, 75, 100].map(function (v) { return '<line x1="' + L0 + '" x2="' + (W - 10) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (L0 - 6) + '" y="' + (Y(v) + 4) + '" font-size="12" text-anchor="end" fill="currentColor">' + v + '%</text>'; }).join('');
      var svg = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(m.aria) + '" style="width:100%;height:auto;display:block;color:var(--ink,#17212B)">' + grid + yrs + '<path d="' + line + '" fill="none" stroke="#155C75" stroke-width="3" stroke-dasharray="6 4"/><path d="' + step + '" fill="none" stroke="#FF5B14" stroke-width="3"/>' + (gap.g > 0 ? '<line x1="' + X(gap.i) + '" x2="' + X(gap.i) + '" y1="' + Y(gap.p) + '" y2="' + Y(gap.b) + '" stroke="#C9A227" stroke-width="4"/>' : '') + '</svg>';
      out.innerHTML = '<figure class="n31c">' + svg + '<figcaption class="n31row" style="gap:18px"><span><b style="color:#FF5B14">━</b> ' + esc(m.paid) + '</span><span><b style="color:#155C75">┅</b> ' + esc(m.built) + '</span></figcaption></figure>';
      say(gap.g > 0 ? f(m.gap, { p: nf(gap.p), b: nf(Math.round(gap.b)), m: ymLabel(ik(gap.i), true) }) : m.gap0);
    });
  })();

  // ------------------------------------------------------------------ 166: install
  if (K === 'app') (function () {
    var b = $('n31-in'), ev = null;
    if (window.matchMedia && matchMedia('(display-mode: standalone)').matches) { say(M.done); return; }
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); ev = e; b.hidden = false; });
    b.addEventListener('click', function () { if (!ev) return; ev.prompt(); ev.userChoice.then(function () { ev = null; b.hidden = true; }); });
    window.addEventListener('appinstalled', function () { say(M.done); b.hidden = true; });
  })();

  // ------------------------------------------------------------------ 178: monthly satellite tiles in a loop
  if (K === 'sm') (function () {
    var T = [].slice.call(document.querySelectorAll('.n31tile')), vis = new Set(), playing = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), fps = 6, timer = null;
    var pp = $('n31-pp'), sp = $('n31-sp'), lab = { p: pp ? pp.textContent : '' };
    T.forEach(function (t) { t._fr = []; t._mo = []; t.getAttribute('data-r').split(' ').forEach(function (r) { var p = r.split('.'), t0 = +p[0], y = +p[1].slice(0, 4), mo = +p[1].slice(4) - 1, n = +p[2]; for (var j = 0; j < n; j++) { t._fr.push(t0 + j); t._mo.push(ik(y * 12 + mo + j)); } }); t._n = +t.getAttribute('data-n'); t._k = t._fr.length - 1; t._lab = t.querySelector('.n31mo'); });
    function draw(t) { var i = t._fr[t._k], n = t._n; t.style.backgroundPosition = (n > 1 ? (i / (n - 1) * 100) : 0) + '% 0'; if (t._lab) t._lab.textContent = ymLabel(t._mo[t._k]); }
    function load(t) { if (t._on) return; t._on = 1; t.style.backgroundImage = 'url("' + t.getAttribute('data-src') + '")'; t.style.backgroundSize = (t._n * 100) + '% 100%'; draw(t); }
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { load(e.target); vis.add(e.target); } else vis.delete(e.target); }); }, { rootMargin: '200px' }) : null;
    T.forEach(function (t) { if (io) io.observe(t); else { load(t); vis.add(t); } });
    function tick() { vis.forEach(function (t) { t._k = (t._k + 1) % t._fr.length; draw(t); }); }
    function go() { clearInterval(timer); if (playing) timer = setInterval(tick, 1000 / fps); if (pp) { pp.setAttribute('aria-pressed', playing ? 'false' : 'true'); pp.textContent = playing ? lab.p : (pp.getAttribute('data-play') || '▶'); } }
    if (pp) { pp.setAttribute('data-play', M.play || pp.getAttribute('data-play') || '▶'); pp.addEventListener('click', function () { playing = !playing; go(); }); }
    if (sp) sp.addEventListener('input', function () { fps = +sp.value || 6; go(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else go(); });
    go();
  })();
}
export const JS = '(' + n31.toString() + ')();';
