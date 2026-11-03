// Kolaboro overlay for property portals (runs only on the portals listed in manifest.json).
// Privacy: the page address and title never leave your browser. They are hashed here (SHA-256) and only the first 4 hex
// characters of each hash are sent to kolaboro.com, which answers with every tracked key in those buckets. The full match is
// made on this device. No cookies, no identifiers, nothing stored. No match: nothing is shown.
(function () {
  if (window.__kolaboroOverlay) return; window.__kolaboroOverlay = true;
  var LOCALE = /^\/(en|ar|id|th|es|pt|tr|ru|zh|de|fr)(?=\/|$)/;
  // portal -> country of its listings (null: listings from many countries). A name match must be in the portal's country.
  var COUNTRY = [[/propertyfinder\.ae$|bayut\.com$/, 'UAE'], [/propertyfinder\.bh$/, 'Bahrain'], [/propertyfinder\.eg$/, 'Egypt'], [/propertyfinder\.qa$/, 'Qatar'],
    [/propertyfinder\.sa$/, 'Saudi Arabia'], [/rumah123\.com$|fazwaz\.id$|dotproperty\.id$/, 'Indonesia'], [/fazwaz\.co\.th$|dotproperty\.co\.th$|thailand-property\.com$/, 'Thailand'],
    [/fazwaz\.ph$|dotproperty\.com\.ph$/, 'Philippines'], [/fazwaz\.vn$/, 'Vietnam'], [/fazwaz\.my$|edgeprop\.my$|propertyguru\.com\.my$/, 'Malaysia'],
    [/emlakplatform\.com\.tr$/, 'Turkey'], [/pincali\.com$/, 'Mexico'], [/idealista\.com$/, 'Spain'], [/idealista\.pt$/, 'Portugal'], [/apartments\.com\.au$/, 'Australia']];
  function countryOf(h) { for (var i = 0; i < COUNTRY.length; i++) if (COUNTRY[i][0].test(h)) return COUNTRY[i][1]; return null; }
  function norm(t) { return String(t || '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function urlKey() {
    var host = location.hostname.toLowerCase().replace(/^www\./, '');
    var path = location.pathname.toLowerCase().replace(/\/+$/, '').replace(LOCALE, '');
    return path.length >= 8 ? host + path : null;
  }
  function windows(text) {   // every run of 2 to 8 consecutive words: a project name inside a longer listing title still matches
    var w = norm(text).split(' ').filter(Boolean).slice(0, 40), out = [];
    for (var i = 0; i < w.length; i++) for (var n = 2; n <= 8 && i + n <= w.length; n++) { var s = w.slice(i, i + n).join(' '); if (s.length >= 10) out.push(s); }
    return out;
  }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function h16(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return hex(b).slice(0, 16); }); }

  var last = '', shown = null, closed = {};
  function run() {
    var href = location.href.split('#')[0];
    if (href === last) return; last = href;
    remove();
    var uk = urlKey(); if (!uk) return;
    var h1 = document.querySelector('h1'), names = windows(h1 ? h1.textContent : '').concat(windows(document.title));
    var keys = [{ k: 'u', s: 'u|' + uk }]; var seen = {};
    names.forEach(function (n) { if (!seen[n]) { seen[n] = 1; keys.push({ k: 'n', s: 'n|' + n }); } });
    keys = keys.slice(0, 180);
    Promise.all(keys.map(function (x) { return h16(x.s).then(function (h) { x.h = h; return x; }); })).then(function (ks) {
      var pre = {}; ks.forEach(function (x) { pre[x.h.slice(0, 4)] = 1; });
      chrome.runtime.sendMessage({ t: 'kb-match', p: Object.keys(pre) }, function (res) {
        if (chrome.runtime.lastError || !res || !res.hits || href !== location.href.split('#')[0]) return;
        var mine = {}; ks.forEach(function (x) { mine[x.h] = x.k; });
        var best = null, c = countryOf(location.hostname.replace(/^www\./, ''));
        res.hits.forEach(function (hit) {
          if (mine[hit.h] !== hit.k) return;
          var p = res.projects[hit.id]; if (!p) return;
          if (hit.k === 'n' && c && p.country !== c) return;
          if (!best || (hit.k === 'u' && best.k !== 'u')) best = { k: hit.k, p: p };
        });
        if (best && !closed[href]) show(best, href);
      });
    });
  }

  var TIER = { clear: ['Most checks public', '#0B7A55'], mixed: ['Some checks public', '#8A5A00'], caution: ['Caution', '#B3261E'] };
  function el(tag, attrs, kids) { var e = document.createElement(tag); for (var k in attrs || {}) { if (k === 'text') e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } (kids || []).forEach(function (x) { e.appendChild(x); }); return e; }
  function remove() { if (shown) { shown.remove(); shown = null; } }
  function show(m, href) {
    remove();
    var p = m.p, host = el('div', { id: 'kolaboro-overlay' });
    host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483646;';
    var root = host.attachShadow({ mode: 'closed' });
    var css = el('style', { text:
      '*{box-sizing:border-box;margin:0;padding:0}' +
      '.k{width:300px;max-width:calc(100vw - 32px);background:#F6F6F3;color:#17212B;border:1px solid rgba(23,33,43,.2);border-radius:14px;box-shadow:0 18px 50px -18px rgba(23,33,43,.55);font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden}' +
      '.h{display:flex;align-items:center;gap:8px;background:#17212B;color:#F6F6F3;padding:9px 10px 9px 12px}' +
      '.b{font-weight:800;letter-spacing:-.01em}.id{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#C9CDD1}' +
      '.x{margin-left:auto;width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:#F6F6F3;font-size:20px;line-height:1;cursor:pointer}.x:hover{background:rgba(255,255,255,.12)}' +
      '.c{padding:12px}.s{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.n{font-size:22px;font-weight:800}.l{color:#2A3541}' +
      '.t{display:inline-block;margin-top:6px;font-size:12px;font-weight:700;color:#fff;border-radius:999px;padding:2px 9px}' +
      '.f{margin-top:8px;color:#B3261E;font-weight:700;font-size:13px}.m{margin-top:8px;font-size:12px;color:#59626B}' +
      '.a{display:block;margin-top:10px;text-align:center;background:#FF5B14;color:#170800;font-weight:800;text-decoration:none;border-radius:999px;padding:9px 12px}.a:hover{background:#ff7136}' +
      '.a:focus-visible,.x:focus-visible{outline:3px solid #FF5B14;outline-offset:2px}' });
    var tier = TIER[p.tier] || ['', '#59626B'];
    var c = el('div', { class: 'c' }, [
      el('div', { class: 's' }, [el('span', { class: 'n', text: p.score + ' of ' + p.max }), el('span', { class: 'l', text: 'buyer checks public' })]),
      tier[0] ? el('span', { class: 't', text: tier[0] }) : el('span'),
    ]);
    if (tier[0]) c.lastChild.style.background = tier[1];
    if (p.flags && p.flags.length) c.appendChild(el('p', { class: 'f', text: p.flags.join(' · ') }));
    c.appendChild(el('p', { class: 'm', text: (m.k === 'u' ? 'Matched by this listing\'s address.' : 'Matched by project name: make sure it is the same project.') + ' ' + p.market + (p.region && p.region !== p.market ? ', ' + p.region : '') + (p.checked ? '. Checked ' + p.checked + '.' : '.') }));
    c.appendChild(el('a', { class: 'a', href: p.url, target: '_blank', rel: 'noopener noreferrer', text: 'See the full public record' }));
    var x = el('button', { class: 'x', type: 'button', 'aria-label': 'Hide on this page', text: '×' });
    x.addEventListener('click', function () { closed[href] = 1; remove(); });
    root.appendChild(css);
    root.appendChild(el('div', { class: 'k', role: 'complementary', 'aria-label': 'Kolaboro record for this project' }, [el('div', { class: 'h' }, [el('span', { class: 'b', text: 'kolaboro' }), el('span', { class: 'id', text: p.id }), x]), c]));
    document.documentElement.appendChild(host); shown = host;
  }

  run();
  setTimeout(function () { last = ''; run(); }, 2500);   // pages that render the title late
  setInterval(function () { if (document.visibilityState === 'visible') run(); }, 1200);   // single-page portals change address without reloading
})();
