/* Kolaboro display currency (block U6, batch 6). Standalone: include it on any page that shows price bands.
   Price bands in the open data are stored in US dollars ("$200k to $400k"). This script converts every band it finds on the
   page into USD, EUR, GBP or the project's local currency, with European Central Bank reference rates from /api/x/x/fx
   (AED derived from the fixed USD peg). The original band always stays visible in brackets and on hover, with the rate date.
   Choice is kept in this browser (localStorage "kb-cur") and can be forced with ?cur=EUR in the URL. Nothing is sent anywhere. */
(function () {
  if (window.KCUR) return;
  var LS = 'kb-cur', OPTS = [['USD', 'US dollar (original)'], ['EUR', 'Euro'], ['GBP', 'Pound sterling'], ['LOCAL', 'Local currency of each project']];
  var SYM = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  // Currency of each country in the dataset, only where the ECB publishes a reference rate (or the AED peg). Others: no local rate.
  var LOCAL = { 'USA': 'USD', 'Puerto Rico': 'USD', 'Puerto Rico (USA)': 'USD', 'Ecuador': 'USD', 'El Salvador': 'USD', 'Panama': 'USD', 'Turks and Caicos Islands': 'USD',
    'Croatia': 'EUR', 'Cyprus': 'EUR', 'Estonia': 'EUR', 'France': 'EUR', 'Germany': 'EUR', 'Greece': 'EUR', 'Ireland': 'EUR', 'Italy': 'EUR', 'Latvia': 'EUR', 'Malta': 'EUR',
    'Montenegro': 'EUR', 'Portugal': 'EUR', 'Spain': 'EUR', 'Bulgaria': 'EUR',
    'Australia': 'AUD', 'Brazil': 'BRL', 'Canada': 'CAD', 'Czechia': 'CZK', 'Hungary': 'HUF', 'India': 'INR', 'Indonesia': 'IDR', 'Japan': 'JPY', 'Malaysia': 'MYR',
    'Mexico': 'MXN', 'New Zealand': 'NZD', 'Northern Cyprus': 'TRY', 'Turkey': 'TRY', 'Philippines': 'PHP', 'Poland': 'PLN', 'Romania': 'RON', 'Singapore': 'SGD',
    'South Africa': 'ZAR', 'South Korea': 'KRW', 'Thailand': 'THB', 'UAE': 'AED', 'United Kingdom': 'GBP' };
  var RE = /(?:[Uu]nder )?\$\d+(?:\.\d+)?[kM](?: to \$\d+(?:\.\d+)?[kM]| and up)?/g;
  var cur = 'USD', RATES = { EUR: 1 }, DATE = '', COUNTRY = null, busy = false, again = false, bar = null, obs = null;
  var store = null; try { store = window.localStorage; } catch (e) {}
  try { var q = new URLSearchParams(location.search).get('cur'); if (q && /^(USD|EUR|GBP|LOCAL)$/i.test(q)) cur = q.toUpperCase(); else if (store && store.getItem(LS)) cur = store.getItem(LS); } catch (e) {}
  if (!/^(USD|EUR|GBP|LOCAL)$/.test(cur)) cur = 'USD';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return s || ''; return +m[3] + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1] + ' ' + m[1]; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function amt(s) { var m = /\$(\d+(?:\.\d+)?)([kM])/.exec(s); return m ? +m[1] * (m[2] === 'M' ? 1e6 : 1e3) : null; }
  function money(v, c) {
    var sym = SYM[c], a = Math.abs(v), unit = '', n = v;
    if (a >= 1e9) { n = v / 1e9; unit = 'bn'; } else if (a >= 1e6) { n = v / 1e6; unit = 'M'; } else if (a >= 1e3) { n = v / 1e3; unit = 'k'; }
    var d = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 0 : 1, t = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toString();
    return sym ? sym + t + unit : c + ' ' + t + unit;
  }
  function conv(usd, c) { if (c === 'USD') return usd; if (!RATES.USD || !RATES[c]) return null; return usd / RATES.USD * RATES[c]; }
  function band(orig, c) {
    var parts = orig.split(' to '), lo = amt(parts[0]), hi = parts[1] ? amt(parts[1]) : null;
    if (lo == null || conv(lo, c) == null) return null;
    if (/^[Uu]nder/.test(orig)) return (orig.charAt(0) === 'U' ? 'Under ' : 'under ') + money(conv(lo, c), c);
    if (/and up$/.test(orig)) return money(conv(lo, c), c) + ' and up';
    return money(conv(lo, c), c) + ' to ' + money(conv(hi, c), c);
  }
  function rateNote(c) {
    if (c === 'USD' || !RATES[c]) return '';
    var one = conv(1, c);
    return '1 USD = ' + (one >= 100 ? Math.round(one).toLocaleString('en-US') : one.toPrecision(4)) + ' ' + c + ', ECB reference rate of ' + fmtDate(DATE);
  }

  // Which project a band belongs to (for the local currency): ?id= on /p/, else the nearest card or row with exactly one project link.
  function idFor(node) {
    var el = node.nodeType === 1 ? node : node.parentNode;
    var own = el && el.closest && el.closest('[data-kid]'); if (own) return own.getAttribute('data-kid');
    var td = el && el.closest && el.closest('td');
    if (td && td.parentNode) {
      var tab = td.closest('table'), idx = Array.prototype.indexOf.call(td.parentNode.children, td), th = tab && tab.querySelector('thead tr');
      var h = th && th.children[idx], a = h && h.querySelector('a[href*="id="]');
      if (a) { var m0 = /[?&]id=([A-Z]{2,5}-\d{3,4})/i.exec(a.getAttribute('href')); if (m0) return m0[1].toUpperCase(); }
    }
    for (var p = el, i = 0; p && p !== document.body && i < 8; p = p.parentNode, i++) {
      if (!p.querySelectorAll) continue;
      var L = p.querySelectorAll('a[href*="/p/?id="]'), ids = {};
      Array.prototype.forEach.call(L, function (a) { var m = /[?&]id=([A-Z]{2,5}-\d{3,4})/i.exec(a.getAttribute('href')); if (m) ids[m[1].toUpperCase()] = 1; });
      var k = Object.keys(ids);
      if (k.length === 1) return k[0];
      if (k.length > 1) break;
    }
    if (/^\/p\/?$/.test(location.pathname)) { try { var q = new URLSearchParams(location.search).get('id'); if (q) return q.toUpperCase(); } catch (e) {} }
    return null;
  }
  function localOf(node) { var id = idFor(node), c = id && COUNTRY && COUNTRY[id]; return c ? { id: id, country: c, code: LOCAL[c] || null } : { id: id, country: c || null, code: null }; }

  function wrapText(tn) {
    var t = tn.nodeValue; RE.lastIndex = 0; if (!RE.test(t)) return;
    RE.lastIndex = 0;
    var frag = document.createDocumentFragment(), last = 0, m;
    while ((m = RE.exec(t))) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      var s = document.createElement('span'); s.className = 'kcur'; s.setAttribute('data-kcur', m[0]); s.textContent = m[0];
      frag.appendChild(s); last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    tn.parentNode.replaceChild(frag, tn);
  }
  function scan(root) {
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentNode; if (!p || !n.nodeValue || n.nodeValue.indexOf('$') < 0) return NodeFilter.FILTER_REJECT;
      if (p.closest && p.closest('.kcur,.kcur-o,.kcur-bar,script,style,textarea,input,select,option,code,pre,[data-kcur-skip]')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT; } });
    var L = []; while (w.nextNode()) L.push(w.currentNode);
    L.forEach(wrapText);
  }
  function paint() {
    var spans = document.querySelectorAll('span.kcur');
    Array.prototype.forEach.call(spans, function (s) {
      var orig = s.getAttribute('data-kcur'), next = s.nextSibling, o = next && next.nodeType === 1 && next.classList.contains('kcur-o') ? next : null;
      var c = cur, extra = '';
      if (cur === 'LOCAL') { var L = localOf(s); c = L.code || 'USD'; if (!L.code) extra = L.country ? ' No ECB reference rate for the currency of ' + L.country + ', shown in US dollars.' : ' Project not identified, shown in US dollars.'; }
      var txt = c === 'USD' ? orig : band(orig, c);
      if (txt == null) { txt = orig; c = 'USD'; }
      s.textContent = txt;
      s.title = c === 'USD' ? 'Original price band in US dollars, as published in the open data.' + extra : 'Original: ' + orig + ' (US dollars). Converted: ' + rateNote(c) + '.';
      if (c !== 'USD') { if (!o) { o = document.createElement('span'); o.className = 'kcur-o'; s.parentNode.insertBefore(o, s.nextSibling); } o.textContent = ' (' + orig + ')'; }
      else if (o) o.parentNode.removeChild(o);
    });
    if (bar) {
      var n = bar.querySelector('.kcur-n');
      n.textContent = cur === 'USD' ? 'Bands are published in US dollars.' : (!RATES.USD || (cur !== 'LOCAL' && !RATES[cur])) ? 'ECB rates could not load just now, so prices stay in US dollars. Try again in a moment.' : (DATE ? (cur === 'LOCAL' ? 'ECB reference rates of ' + fmtDate(DATE) + '. Countries without an ECB rate stay in US dollars.' : rateNote(cur) + '.') + ' Original US dollar band in brackets.' : 'Loading ECB rates.');
    }
  }
  function need() {
    var codes = {};
    if (cur === 'EUR' || cur === 'GBP') codes[cur] = 1;
    if (cur === 'LOCAL') Array.prototype.forEach.call(document.querySelectorAll('span.kcur'), function (s) { var L = localOf(s); if (L.code) codes[L.code] = 1; });
    var L = Object.keys(codes).filter(function (c) { return c !== 'USD' && !RATES[c]; }); if (cur !== 'USD' && !RATES.USD) L.push('USD'); return L;
  }
  function fetchRates(codes) {
    if (!codes.length) return Promise.resolve();
    var d0 = new Date(), from = iso(new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() - 1, 1))), batches = [];
    for (var i = 0; i < codes.length; i += 5) batches.push(['USD'].concat(codes.slice(i, i + 5).filter(function (c) { return c !== 'EUR' && c !== 'USD'; })));
    return Promise.all(batches.map(function (b) {
      var url = '/api/x/x/fx?c=' + b.join(',') + '&from=' + from, get = function () { return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
      return get().then(function (j) { return j || new Promise(function (ok) { setTimeout(ok, 1500); }).then(get); }).then(function (j) {
        if (!j || !j.rates || !j.n) return;
        var k = j.n - 1;
        Object.keys(j.rates).forEach(function (c) { var v = j.rates[c][k]; if (v > 0) RATES[c] = v; });
        if (!DATE || j.last < DATE) DATE = j.last;
      }).catch(function () {});
    }));
  }
  function countries() {
    if (COUNTRY || cur !== 'LOCAL') return Promise.resolve();
    return fetch('/api/x/disc/points').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      COUNTRY = {}; (j && j.rows || []).forEach(function (r) { COUNTRY[r[0]] = r[2]; });
    }).catch(function () { COUNTRY = {}; });
  }
  function update() {
    if (busy) { again = true; return; } busy = true; again = false;
    if (obs) obs.disconnect();
    scan(document.body);
    countries().then(function () { return fetchRates(need()); }).then(function () {
      paint();
    }).then(function () { busy = false; watch(); if (again) update(); }, function () { busy = false; watch(); if (again) update(); });
  }
  var tmr = null;
  function watch() {
    if (!window.MutationObserver) return;
    if (!obs) obs = new MutationObserver(function (ms) {
      var hit = ms.some(function (m) { return Array.prototype.some.call(m.addedNodes, function (n) { return n.nodeType === 3 ? n.nodeValue.indexOf('$') >= 0 : n.nodeType === 1 && !(n.classList && (n.classList.contains('kcur') || n.classList.contains('kcur-o'))) && (n.textContent || '').indexOf('$') >= 0; }); });
      if (!bar) placeBar();
      if (hit) { clearTimeout(tmr); tmr = setTimeout(update, 120); }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: false });
  }
  function placeBar() {
    if (bar) return;
    var host = document.querySelector('[data-kcur-bar]'), h1 = document.querySelector('main h1');
    if (!host && !h1) return;
    bar = document.createElement('div'); bar.className = 'kcur-bar'; bar.setAttribute('data-kcur-skip', '');
    bar.innerHTML = '<label for="kcur-s">Show prices in</label><select id="kcur-s">' + OPTS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === cur ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select><span class="kcur-n" aria-live="polite"></span>';
    if (host) host.appendChild(bar);
    else { var after = h1.nextElementSibling && /lead/.test(h1.nextElementSibling.className) ? h1.nextElementSibling : h1; after.parentNode.insertBefore(bar, after.nextSibling); }
    bar.querySelector('select').addEventListener('change', function () { cur = this.value; try { store && store.setItem(LS, cur); } catch (e) {} update(); });
  }
  function css() {
    var s = document.createElement('style');
    s.textContent = '.kcur-bar{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;font-size:.84rem;color:#2A3541;margin:10px 0}.kcur-bar label{font-weight:700}.kcur-bar select{font:inherit;font-size:.88rem;min-height:40px;padding:4px 8px;border:1.5px solid #17212B;border-radius:8px;background:#fff;color:#17212B;max-width:100%}.kcur-bar select:focus-visible{outline:3px solid #FF5B14;outline-offset:2px}.kcur-n{flex:1 1 220px;min-width:0}.kcur-o{color:#59626B;font-size:.86em;white-space:nowrap}.kcur[title]{text-decoration:underline dotted rgba(23,33,43,.35);text-underline-offset:3px}';
    document.head.appendChild(s);
  }
  function start() { css(); placeBar(); update(); }
  window.KCUR = { set: function (c) { if (/^(USD|EUR|GBP|LOCAL)$/.test(c)) { cur = c; if (bar) bar.querySelector('select').value = c; update(); } }, get: function () { return cur; }, refresh: update };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
