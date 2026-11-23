/* kolaboro.com batch 29 (n29e, 14 Nov 2026): "Cite" button on every figure of the report pages (item 74).
   Figures: rows of .knum tables (/numbers/), .sx-kv tiles (/press/delivery-index/<month>/), [data-cite] elements; since n32s also the
   figure tiles of rankings, reports, handover and market pages and the row-header tables of the monthly figures (60 buttons at most).
   The citation: "<figure>: <value>". Kolaboro, <page title>, <address of the page>, <date>. CC BY 4.0. Nothing is sent anywhere. */
(function () {
  if (window.__k29c) return; window.__k29c = 1;   // n38 d5: some pages carried the script twice and got two buttons per figure (and a layout shift)
  var L = (document.documentElement.lang || 'en').slice(0, 2);
  var T = { en: ['Cite', 'Copied', 'Copy a citation for this figure', 'as of'], es: ['Citar', 'Copiado', 'Copiar una cita de esta cifra', 'a fecha de'], fr: ['Citer', 'Copié', 'Copier une citation de ce chiffre', 'au'],
    de: ['Zitieren', 'Kopiert', 'Zitat für diese Zahl kopieren', 'Stand'], nl: ['Citeren', 'Gekopieerd', 'Kopieer een bronvermelding voor dit cijfer', 'stand'], ru: ['Цитировать', 'Скопировано', 'Скопировать ссылку на эту цифру', 'на'],
    zh: ['引用', '已复制', '复制此数字的引用', '截至'], ar: ['اقتباس', 'نُسخ', 'انسخ اقتباساً لهذا الرقم', 'حتى'] }[L] || null;
  if (!T) T = ['Cite', 'Copied', 'Copy a citation for this figure', 'as of'];
  var h1 = document.querySelector('h1'), title = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : document.title;
  var css = document.createElement('style');
  css.textContent = '.k29c{margin-inline-start:8px;min-height:32px;padding:2px 10px;border:1px solid currentColor;border-radius:999px;background:none;color:inherit;font:inherit;font-size:12px;opacity:.75;cursor:pointer;vertical-align:middle}.k29c:hover,.k29c:focus-visible{opacity:1}.sx-kv .k29c{display:block;margin:6px 0 0}@media print{.k29c{display:none}}';
  document.head.appendChild(css);
  function txt(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function copy(s, b) {
    var done = function () { var o = b.textContent; b.textContent = T[1]; setTimeout(function () { b.textContent = o; }, 1600); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(s).then(done, function () { fallback(s); done(); }); return; } } catch (e) {}
    fallback(s); done();
  }
  function fallback(s) { try { var a = document.createElement('textarea'); a.value = s; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } catch (e) {} }
  function add(where, label, value, date, id) {
    if (!label || !value) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'k29c'; b.textContent = T[0]; b.setAttribute('aria-label', T[2] + ': ' + label);
    var url = location.origin + location.pathname + (id ? '#' + id : '');
    b.addEventListener('click', function () { copy('"' + label + ': ' + value + '". Kolaboro, ' + title + ', ' + url + (date ? ', ' + T[3] + ' ' + date : '') + '. CC BY 4.0.', b); });
    where.appendChild(b);
  }
  var R = document.querySelectorAll('table.knum tbody tr');
  for (var i = 0; i < R.length; i++) { var c = R[i].children; if (c.length >= 4) add(c[1], txt(c[0]), txt(c[1]), txt(c[3])); }
  var K = document.querySelectorAll('.sx-kv > div'), q = document.querySelector('.sx-q');
  var qd = q ? (/\(([^)]*\d{4}[^)]*)\)/.exec(q.textContent) || [])[1] : '';
  for (var j = 0; j < K.length; j++) add(K[j], txt(K[j].querySelector('span')), txt(K[j].querySelector('b')), qd || '');
  // n32s (batch 32, item 227): the figure tiles of rankings, reports, handover and market pages, and the summary tables of the monthly
  // figures (a row header and a number), dated from the page's answer line (data-asof), the column header "(19 Nov 2026)" or a <time>
  var pd = (document.querySelector('[data-asof]') || {}).getAttribute ? document.querySelector('[data-asof]').getAttribute('data-asof') : '';
  if (!pd) { var tm = document.querySelector('main time'); pd = tm ? txt(tm) : ''; }
  var n = 0, MAX = 60;
  var KV = document.querySelectorAll('.ktr-kv > div, .kfa-kv > div, .k29-kv > div, .n3-kv > div');
  for (var a = 0; a < KV.length && n < MAX; a++) { var bv = KV[a].querySelector('b'), sl = KV[a].querySelector('span'); if (bv && sl && !KV[a].querySelector('.k29c')) { add(KV[a], txt(sl), txt(bv), pd); n++; } }
  var TR = document.querySelectorAll('main table:not(.knum) tbody tr');
  for (var r = 0; r < TR.length && n < MAX; r++) { var th = TR[r].querySelector('th[scope="row"]'), td = TR[r].querySelector('td.k-n'); if (!th || !td || td.querySelector('.k29c')) continue;
    var tb = TR[r].closest('table'), hd = tb && tb.querySelectorAll('thead th'), ci = [].indexOf.call(TR[r].children, td), hc = hd && hd[ci] ? (/\(([^)]*\d{4}[^)]*)\)/.exec(txt(hd[ci])) || [])[1] : '';
    add(td, txt(th), txt(td), hc || pd); n++; }
  var D = document.querySelectorAll('[data-cite]');
  for (var k = 0; k < D.length; k++) add(D[k], D[k].getAttribute('data-cite'), D[k].getAttribute('data-cite-v') || txt(D[k]), D[k].getAttribute('data-cite-d') || '', D[k].id || '');
})();
