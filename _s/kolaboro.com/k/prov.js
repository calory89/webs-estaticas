/*! Kolaboro number provenance: click (or Enter on) any number marked data-prov="id" to see where it comes from.
 *  The registry /k/prov.json maps each id to its source (an open endpoint or a published file), the expression that picks
 *  the number out of it, an optional independent recomputation and a signed twin. The panel re-reads the source now, in this
 *  browser, shows the data time, checks the Ed25519 signature when the source is signed (KBVerify, /k/verify-badge.js) and
 *  the SHA-256 of the bytes otherwise. Pages need only data-prov="id"; the registry can also attach ids by CSS selector.
 *  Also adds "Verify this page" to the footer (loads /k/pagecheck.js on demand).
 *  Expressions: a.b.c | arr[key=value].field | count(path) | sum(path, path) | cond ? path : path. Nothing is eval'd.
 */
(function () {
  if (window.KBProv) return;
  var REG = '/k/prov.json', VB = '/k/verify-badge.js?v=d6fef3de86', PC = '/k/pagecheck.js?v=ed48ea5b6f';
  var me = document.currentScript && document.currentScript.src;
  if (me) { var q = me.split('?')[1] || ''; REG += '?' + q; }
  var reg = null, regP = null, cache = {}, panel = null, opener = null;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function load(src, url) { return new Promise(function (ok, no) { if (document.querySelector('script[data-kbp="' + src + '"]')) return ok(); var s = document.createElement('script'); s.src = url; s.defer = true; s.setAttribute('data-kbp', src); s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function verifier() { return window.KBVerify ? Promise.resolve(window.KBVerify) : load('vb', VB).then(function () { return window.KBVerify; }); }
  function registry() {
    if (!regP) regP = fetch(REG, { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('registry ' + r.status); return r.json(); }).then(function (j) { reg = j; return j; });
    return regP;
  }
  // ---------- tiny expression reader (no eval)
  function seg(path) { var out = [], re = /([^.\[\]]+)|\[([^=\]]+)=([^\]]*)\]/g, m; while ((m = re.exec(path))) out.push(m[1] ? { k: m[1] } : { f: m[2], v: m[3] }); return out; }
  function get(o, path) {
    var cur = o;
    seg(path.trim()).forEach(function (s) {
      if (cur == null) return;
      if (s.f) { cur = Array.isArray(cur) ? cur.filter(function (x) { return x && String(x[s.f]) === s.v; }) : undefined; return; }
      if (Array.isArray(cur) && !/^\d+$/.test(s.k)) cur = cur[0];
      cur = cur == null ? undefined : cur[s.k];
    });
    return cur;
  }
  function evalx(o, ex) {
    ex = String(ex).trim();
    var t = ex.match(/^(.+?)\s*\?\s*(.+?)\s*:\s*(.+)$/);
    if (t) return evalx(o, get(o, t[1]) ? t[2] : t[3]);
    var f = ex.match(/^(count|sum)\((.*)\)$/);
    if (f) {
      if (f[1] === 'count') { var a = get(o, f[2]); return Array.isArray(a) ? a.length : null; }
      var s = 0, ok = true; f[2].split(',').forEach(function (p) { var v = get(o, p); if (typeof v !== 'number') ok = false; else s += v; }); return ok ? s : null;
    }
    var v = get(o, ex);
    return Array.isArray(v) ? (v.length === 1 ? v[0] : v) : v;
  }
  function sub(x, args) { return typeof x === 'string' ? x.replace(/\$(\d)/g, function (_, i) { return args[+i] || ''; }) : x; }
  function entry(id) {
    if (!reg) return null;
    var e = reg.entries[id], args = [id];
    if (!e) Object.keys(reg.patterns || {}).some(function (p) { var m = id.match(new RegExp('^' + p.replace(/\./g, '\\.').replace('*', '([A-Za-z0-9_-]+)') + '$')); if (m) { e = reg.patterns[p]; args = m; return true; } });
    if (!e) return null;
    var c = {}; Object.keys(e).forEach(function (k) { var v = e[k]; c[k] = Array.isArray(v) ? v.map(function (x) { return sub(x, args); }) : (v && typeof v === 'object') ? JSON.parse(sub(JSON.stringify(v), args)) : sub(v, args); });
    c.id = id; return c;
  }
  // ---------- source reading, once per page view per URL
  function read(url) {
    if (cache[url]) return cache[url];
    cache[url] = verifier().catch(function () { return null; }).then(function (V) {
      var go = V ? V.fetchSigned(url, { credentials: 'omit' }) : fetch(url, { credentials: 'omit' }).then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { ok: r.ok, status: r.status, text: t, json: j, headers: r.headers, check: Promise.resolve({ state: 'unsupported', why: 'The signature checker did not load.' }) }; }); });
      return go.then(function (r) {
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(r.text)).then(function (d) { r.sha256 = hex(d); return r; }, function () { return r; });
      });
    });
    return cache[url];
  }
  // ---------- comparing what the page shows with what the source says
  function nums(t) { return (String(t).match(/-?\d[\d,]*(?:\.\d+)?/g) || []).map(function (x) { return parseFloat(x.replace(/,/g, '')); }); }
  function same(pageText, vals) {
    var p = nums(pageText); if (!p.length) return null;
    var ok = vals.every(function (v) { if (typeof v !== 'number') return false; return p.some(function (n) { var d = (String(n).split('.')[1] || '').length; return n === v || Math.abs(n - +v.toFixed(d)) < 1e-9; }); });
    return ok;
  }
  function fmt(v) { return v == null ? 'missing' : typeof v === 'number' ? v.toLocaleString('en-US', { maximumFractionDigits: 4 }) : typeof v === 'object' ? JSON.stringify(v).slice(0, 120) : String(v); }
  function when(t) { if (!t) return null; var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(t) ? t + 'T00:00:00Z' : t); if (isNaN(d)) return String(t); var s = d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC', h = (Date.now() - d) / 36e5; return s + (h >= 0 ? ' (' + (h < 1 ? Math.max(1, Math.round(h * 60)) + ' min' : h < 48 ? Math.round(h) + ' h' : Math.round(h / 24) + ' days') + ' ago)' : ''); }
  // ---------- styles (inserted once; the panel floats, nothing on the page moves)
  var CSS = '[data-prov]{cursor:help;text-decoration:underline dotted rgba(23,33,43,.45);text-decoration-thickness:1.5px;text-underline-offset:.18em;border-radius:4px}' +
    '[data-prov]:hover{text-decoration-color:#FF5B14}[data-prov]:focus-visible{outline:3px solid #FF5B14;outline-offset:2px}' +
    '.kbp{position:absolute;z-index:60;width:min(420px,calc(100vw - 24px));max-height:min(70vh,560px);overflow:auto;padding:16px 18px 14px;border-radius:14px;background:#fff;color:#17212B;border:1px solid rgba(23,33,43,.16);box-shadow:0 18px 40px rgba(23,33,43,.22);font:500 .84rem/1.5 Archivo,system-ui,sans-serif;text-align:left;letter-spacing:0;text-transform:none;white-space:normal}' +
    '.kbp:focus{outline:none}.kbp h2{font:800 1.02rem/1.25 Archivo,system-ui,sans-serif;margin:0 28px 10px 0;color:#17212B}.kbp .kbp-k{font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#B83A05;margin:0 0 4px}' +
    '.kbp dl{display:grid;grid-template-columns:96px 1fr;gap:7px 10px;margin:0}.kbp dt{font-weight:700;color:#4A5661;font-size:.76rem;padding-top:1px}.kbp dd{margin:0;min-width:0;overflow-wrap:anywhere}' +
    '.kbp code{font:500 .74rem/1.45 ui-monospace,Menlo,monospace;background:#F2F3F1;padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}.kbp a{color:#B83A05;font-weight:700}' +
    '.kbp .kbp-x{position:absolute;top:8px;right:8px;width:32px;height:32px;border:0;border-radius:8px;background:transparent;font:700 1.2rem/1 system-ui;color:#4A5661;cursor:pointer}.kbp .kbp-x:hover{background:#F2F3F1}.kbp .kbp-x:focus-visible{outline:3px solid #FF5B14}' +
    '.kbp .kbp-ok{color:#075E41;font-weight:700}.kbp .kbp-no{color:#8F2D04;font-weight:700}.kbp .kbp-mu{color:#4A5661}.kbp .kbp-f{margin:12px 0 0;padding-top:10px;border-top:1px solid rgba(23,33,43,.12);font-size:.76rem;color:#4A5661}' +
    '@media (max-width:520px){.kbp dl{grid-template-columns:1fr}.kbp dt{padding-top:4px}}' +
    '.kbp-pv{background:none;border:0;padding:0;font:inherit;color:inherit;cursor:pointer;text-decoration:none;text-align:left}.kbp-pv:hover{text-decoration:underline;text-decoration-color:#FF5B14;text-decoration-thickness:2px}.kbp-pv:focus-visible{outline:3px solid #FF5B14;outline-offset:2px}' +
    '.kbp-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
  function css() { if (document.getElementById('kbp-css')) return; var s = document.createElement('style'); s.id = 'kbp-css'; s.textContent = CSS; document.head.appendChild(s); var h = document.createElement('span'); h.id = 'kbp-hint'; h.className = 'kbp-sr'; h.textContent = 'Opens where this number comes from.'; document.body.appendChild(h); }
  // ---------- marking elements
  function mark(el) {
    if (el.getAttribute('data-prov-on')) return;
    el.setAttribute('data-prov-on', '1');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.getAttribute('role')) el.setAttribute('role', 'button');
    el.setAttribute('aria-haspopup', 'dialog');
    el.setAttribute('aria-describedby', 'kbp-hint');
    if (!el.title) el.title = 'Where does this number come from?';
  }
  function attach() {
    if (reg && reg.attach) reg.attach.forEach(function (a) {
      if (!new RegExp(a.page).test(location.pathname)) return;
      document.querySelectorAll(a.sel).forEach(function (el) { if (!el.getAttribute('data-prov') && !(el.closest && el.closest('a,button,label'))) el.setAttribute('data-prov', a.id); });
    });
    document.querySelectorAll('[data-prov]').forEach(mark);
  }
  var tmr = 0;
  function soon() { if (tmr) return; tmr = setTimeout(function () { tmr = 0; attach(); }, 250); }
  // ---------- the panel
  function close(back) {
    if (!panel) return; panel.remove(); panel = null;
    if (back !== false && opener && document.contains(opener)) opener.focus();
    if (opener) opener.setAttribute('aria-expanded', 'false');
    opener = null;
  }
  function place(el) {
    var r = el.getBoundingClientRect(), w = panel.offsetWidth, x = Math.max(12, Math.min(r.left + scrollX, scrollX + document.documentElement.clientWidth - w - 12));
    var y = r.bottom + scrollY + 8, below = innerHeight - r.bottom, hgt = panel.offsetHeight;
    if (below < Math.min(hgt, 320) + 16 && r.top > below) y = Math.max(scrollY + 8, r.top + scrollY - hgt - 8);
    panel.style.left = x + 'px'; panel.style.top = y + 'px';
  }
  function row(k, v) { return '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>'; }
  function open(el) {
    var id = el.getAttribute('data-prov'); if (!id) return;
    if (panel && opener === el) { close(); return; }
    close(false); css();
    opener = el; el.setAttribute('aria-expanded', 'true');
    panel = document.createElement('div'); panel.className = 'kbp'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'kbp-h'); panel.tabIndex = -1;
    var shown = (el.textContent || '').replace(/\s+/g, ' ').trim();
    panel.innerHTML = '<button type="button" class="kbp-x" aria-label="Close">×</button><p class="kbp-k">Where this number comes from</p><h2 id="kbp-h">Reading the registry…</h2><dl id="kbp-dl">' + row('On this page', '<b>' + esc(shown.slice(0, 120)) + '</b>') + '</dl>';
    document.body.appendChild(panel); place(el); panel.focus();
    panel.querySelector('.kbp-x').addEventListener('click', function () { close(); });
    var mine = panel;
    registry().then(function () {
      if (panel !== mine) return;
      var e = entry(id);
      if (!e) { panel.querySelector('h2').textContent = 'No source registered'; panel.querySelector('dl').insertAdjacentHTML('beforeend', row('Status', '<span class="kbp-no">The id "' + esc(id) + '" is not in the registry.</span> That is a bug on our side: <a href="/corrections">tell us</a>.')); place(el); return; }
      fill(mine, el, e, shown);
    }).catch(function (x) { if (panel === mine) { panel.querySelector('h2').textContent = 'Registry not available'; panel.querySelector('dl').insertAdjacentHTML('beforeend', row('Status', '<span class="kbp-no">' + esc((x && x.message) || 'could not load /k/prov.json') + '</span>')); } });
  }
  function fill(mine, el, e, shown) {
    var dl = mine.querySelector('dl');
    mine.querySelector('h2').textContent = e.label || e.id;
    var src = e.src, code = 'GET ' + src + '\n→ ' + (Array.isArray(e.expr) ? e.expr.join(e.join || ' · ') : e.expr);
    dl.insertAdjacentHTML('beforeend',
      row('Source', '<a href="' + esc(src) + '">' + esc(src) + '</a>' + (e.made_by ? '<br><span class="kbp-mu">' + esc(e.made_by) + '</span>' : '')) +
      row('Computation', '<code style="white-space:pre-wrap">' + esc(code) + '</code>' + (e.formula ? '<br>' + esc(e.formula) : '')) +
      '<dt>Re-read now</dt><dd id="kbp-now" aria-live="polite"><span class="kbp-mu">Fetching ' + esc(src) + '…</span></dd>' +
      '<dt>Data time</dt><dd id="kbp-t"><span class="kbp-mu">…</span></dd>' +
      '<dt>Integrity</dt><dd id="kbp-i"><span class="kbp-mu">…</span></dd>' +
      (e.recompute ? '<dt>Recomputed</dt><dd id="kbp-r"><span class="kbp-mu">…</span></dd>' : '') +
      (e.twin ? '<dt>Signed twin</dt><dd id="kbp-w"><span class="kbp-mu">…</span></dd>' : '') +
      (e.dataset ? '<dt>Dataset hash</dt><dd id="kbp-d"><span class="kbp-mu">…</span></dd>' : '') +
      (e.extra ? Object.keys(e.extra).map(function (k, i) { return '<dt>' + esc(k) + '</dt><dd id="kbp-x' + i + '"><span class="kbp-mu">…</span></dd>'; }).join('') : '') +
      (e.note ? row('Limits', esc(e.note)) : ''));
    mine.insertAdjacentHTML('beforeend', '<p class="kbp-f">Registry entry <code>' + esc(e.id) + '</code> in <a href="/k/prov.json">/k/prov.json</a> · <a href="/verify#numbers">How this works</a></p>');
    place(el);
    var $ = function (i) { return mine.querySelector('#' + i); };
    read(src).then(function (r) {
      if (panel !== mine) return;
      if (!r.ok || !r.json) { $('kbp-now').innerHTML = '<span class="kbp-no">The source answered ' + esc(r.status) + '.</span> Nothing is shown in its place.'; $('kbp-t').textContent = 'unknown'; $('kbp-i').textContent = 'not checked'; return; }
      var d = r.json, ex = Array.isArray(e.expr) ? e.expr : [e.expr], vals = ex.map(function (x) { return evalx(d, x); });
      if (e.label_expr) { var lb = evalx(d, e.label_expr); if (lb) mine.querySelector('h2').textContent = lb; }
      var m = same(shown, vals), txt = vals.map(fmt).join(e.join || ' · ');
      $('kbp-now').innerHTML = '<b>' + esc(txt) + '</b>' + (m === true ? ' <span class="kbp-ok">· matches the page</span>' : m === false ? ' <span class="kbp-no">· differs from the page</span><br><span class="kbp-mu">The page was filled when it loaded; the source may have been republished since. Reload to see the current value.</span>' : '');
      var t = e.time ? evalx(d, e.time) : null; if (!t && e.time_header) t = r.headers.get(e.time_header);
      $('kbp-t').innerHTML = t ? esc(when(t)) + (e.time_label ? '<br><span class="kbp-mu">' + esc(e.time_label) + '</span>' : '') : '<span class="kbp-mu">The source carries no timestamp.</span>';
      var sh = r.sha256 ? 'SHA-256 of the ' + (r.text.length > 99999 ? Math.round(r.text.length / 1024) + ' KB' : r.text.length + ' bytes') + ' you received: <code>' + r.sha256 + '</code>' : '';
      var ib = $('kbp-i'); ib.innerHTML = '<span></span><br>' + sh;
      r.check.then(function (c) {
        if (panel !== mine) return;
        if (c.state === 'unsigned') { ib.firstChild.outerHTML = '<span class="kbp-mu">This file is not signed. It is a static file published by a GitHub Actions job; ' + (e.dataset ? 'its hash is compared with the signed public log entry below.' : 'compare the hash above with a copy you saved, or with a later download.') + '</span>'; return; }
        verifier().then(function (V) { var s = document.createElement('span'); ib.replaceChild(s, ib.firstChild); V.badge(s, c, { what: src }); });
      });
      if (e.recompute) { var rv = evalx(d, e.recompute), ok = vals.length === 1 && rv === vals[0]; $('kbp-r').innerHTML = '<code>' + esc(e.recompute) + '</code> = <b>' + esc(fmt(rv)) + '</b> ' + (ok ? '<span class="kbp-ok">· agrees</span>' : '<span class="kbp-no">· does not agree with ' + esc(fmt(vals[0])) + '</span>') + '<br><span class="kbp-mu">Counted again from the raw records in your browser, not read from the summary field.</span>'; }
      if (e.extra) Object.keys(e.extra).forEach(function (k, i) { var v = evalx(d, e.extra[k]); $('kbp-x' + i).innerHTML = v == null ? '<span class="kbp-mu">none</span>' : /^\//.test(String(v)) ? String(v).split(' + ').map(function (p) { return '<a href="' + esc(p) + '">' + esc(p) + '</a>'; }).join(' + ') : esc(fmt(v)); });
      if (e.twin) read(e.twin.src).then(function (w) {
        if (panel !== mine) return;
        var wv = w.json ? evalx(w.json, e.twin.expr) : null, agree = wv != null && vals.length === 1 && wv === vals[0];
        var box = $('kbp-w'); box.innerHTML = '<a href="' + esc(e.twin.src) + '">' + esc(e.twin.src) + '</a> <code>' + esc(e.twin.expr) + '</code> = <b>' + esc(fmt(wv)) + '</b> ' + (agree ? '<span class="kbp-ok">· agrees</span>' : '<span class="kbp-no">· differs</span> <span class="kbp-mu">(the API reads a copy of the file cached for up to 10 minutes)</span>') + '<br><span></span>';
        w.check.then(function (c) { verifier().then(function (V) { if (panel === mine) V.badge(box.lastChild, c, { what: e.twin.src }); }); });
      });
      if (e.dataset) read('/api/open/log-input').then(function (L) {
        if (panel !== mine) return;
        var ds = L.json && L.json.dataset_sha256, agree = ds && ds === r.sha256, box = $('kbp-d');
        box.innerHTML = (ds ? 'The signed answer of <a href="/api/open/log-input">/api/open/log-input</a> says the dataset is <code>' + esc(ds) + '</code> ' + (agree ? '<span class="kbp-ok">· same bytes as yours</span>' : '<span class="kbp-no">· not the bytes you received</span> <span class="kbp-mu">(the API may still hold the previous publish for up to 10 minutes)</span>') : '<span class="kbp-no">No dataset hash in the signed answer.</span>') + '<br><span></span>';
        L.check.then(function (c) { verifier().then(function (V) { if (panel === mine) V.badge(box.lastChild, c, { what: '/api/open/log-input' }); }); });
      });
      place(el);
    }).catch(function (x) { if (panel === mine) $('kbp-now').innerHTML = '<span class="kbp-no">Could not read the source: ' + esc((x && x.message) || 'network error') + '.</span>'; });
  }
  // ---------- "Verify this page" in the footer
  function footer() {
    var a = document.querySelector('footer a[href="/log/"], footer a[href="/log"]'); if (!a || document.getElementById('kbp-vp')) return;
    var li = a.closest('li'); if (!li) return;
    var n = document.createElement('li'); n.innerHTML = '<button type="button" class="kbp-pv" id="kbp-vp" aria-haspopup="dialog">Verify this page</button>';
    li.parentNode.insertBefore(n, li.nextSibling);
    n.firstChild.addEventListener('click', function () { var b = this; css(); b.setAttribute('aria-busy', 'true'); load('pc', PC).then(function () { b.removeAttribute('aria-busy'); window.KBPageCheck.dialog(b); }, function () { b.removeAttribute('aria-busy'); location.href = '/verify?page=' + encodeURIComponent(location.pathname) + '#page'; }); });
  }
  // ---------- wiring
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-prov]');
    if (el && !(ev.target.closest('a,button,input,select,textarea') && !ev.target.closest('a,button,input,select,textarea').hasAttribute('data-prov'))) { ev.preventDefault(); open(el); return; }
    if (panel && !panel.contains(ev.target)) close(false);
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && panel) { close(); return; }
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.getAttribute && ev.target.getAttribute('data-prov-on')) { ev.preventDefault(); open(ev.target); }
  });
  addEventListener('resize', function () { if (panel && opener) place(opener); });
  function start() {
    css(); footer();
    var need = document.querySelector('[data-prov]');
    registry().then(function () {
      attach();
      var watch = (reg.attach || []).some(function (a) { return new RegExp(a.page).test(location.pathname); });
      if (watch && window.MutationObserver) new MutationObserver(soon).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
    }).catch(function () { if (need) attach(); });
  }
  window.KBProv = { version: '1.0.0', open: open, registry: registry, evaluate: evalx, read: read };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
