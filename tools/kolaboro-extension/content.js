// Kolaboro X-ray panel on property portals (only the sites listed in manifest.json). On a listing page it hashes the page address,
// heading and title here, asks kolaboro.com for the matching hash buckets (4-character prefixes only), and shows the panel when the
// page is a project or developer in our records. On other listing pages it shows a small button that opens the panel.
(function () {
  if (window.__kolaboroX) return; window.__kolaboroX = true;
  var host = location.hostname.replace(/^www\./, '');
  var PORTALS = [
    [/(^|\.)idealista\.com$/, 'Spain', /\/(inmueble|obra-nueva)\//], [/(^|\.)idealista\.pt$/, 'Portugal', /\/(imovel|empreendimentos|obra-nova)\//], [/(^|\.)idealista\.it$/, 'Italy', /\/(immobile|nuove-costruzioni)\//],
    [/(^|\.)fotocasa\.es$/, 'Spain', /\/d(\/|$)|\/obra-nueva\//],
    [/(^|\.)propertyfinder\.ae$/, 'UAE', /\/plp\/|\/new-projects\/[^/]+\/[^/]+/], [/(^|\.)propertyfinder\.bh$/, 'Bahrain', /\/plp\/|\/new-projects\/[^/]+\/[^/]+/],
    [/(^|\.)propertyfinder\.eg$/, 'Egypt', /\/plp\/|\/new-projects\/[^/]+\/[^/]+/], [/(^|\.)propertyfinder\.qa$/, 'Qatar', /\/plp\/|\/new-projects\/[^/]+\/[^/]+/],
    [/(^|\.)propertyfinder\.sa$/, 'Saudi Arabia', /\/plp\/|\/new-projects\/[^/]+\/[^/]+/],
    [/(^|\.)bayut\.com$/, 'UAE', /details-\d+|\/new-projects\/[^/]+/], [/(^|\.)bayut\.sa$/, 'Saudi Arabia', /details-\d+|\/new-projects\/[^/]+/], [/(^|\.)bayut\.eg$/, 'Egypt', /details-\d+|\/new-projects\/[^/]+/],
    [/(^|\.)rightmove\.co\.uk$/, null, /\/properties\/\d+|\/new-homes-details\//],
    [/(^|\.)zillow\.com$/, 'USA', /\/homedetails\/|\/community\/|\/b\/|\/apartments\//]
  ];
  var P = PORTALS.filter(function (x) { return x[0].test(host); })[0]; if (!P) return;
  var country = P[1], isListing = function () { return P[2].test(location.pathname); };
  var lang = KX.uiLang(), hostEl = null, shadow = null, slot = null, st = null, last = '', hidden = {}, mini = {};

  function texts() {
    var h1 = document.querySelector('h1'), og = document.querySelector('meta[property="og:title"]');
    return [h1 ? h1.textContent : '', og ? og.getAttribute('content') : '', document.title].filter(Boolean).map(function (s) { return s.slice(0, 300); });
  }
  function bg(p) { return new Promise(function (ok) { try { chrome.runtime.sendMessage({ t: 'kx-xr', p: p }, function (r) { ok(chrome.runtime.lastError ? null : r); }); } catch (e) { ok(null); } }); }
  function viaPort(u, l, onEvent) {
    return new Promise(function (ok, bad) {
      var port = chrome.runtime.connect({ name: 'kx-xray' });
      port.onMessage.addListener(function (e) { if (e.type === '_end') { ok(); port.disconnect(); } else if (e.type === '_err') { bad(new Error('x')); port.disconnect(); } else onEvent(e); });
      port.onDisconnect.addListener(function () { ok(); });
      port.postMessage({ u: u, lang: l });
    });
  }
  function mount() {
    if (hostEl && document.documentElement.contains(hostEl)) return;
    hostEl = document.createElement('div'); hostEl.id = 'kolaboro-x-ray';
    hostEl.style.cssText = 'all:initial;position:fixed;inset-inline-end:16px;bottom:16px;z-index:2147483646;';
    shadow = hostEl.attachShadow({ mode: 'closed' });
    var css = document.createElement('style'); css.textContent = KX.CSS; shadow.appendChild(css);
    slot = document.createElement('div'); shadow.appendChild(slot);
    document.documentElement.appendChild(hostEl);
  }
  function unmount() { if (hostEl) { hostEl.remove(); hostEl = null; } }
  function draw() {
    if (!st || hidden[st.url]) { unmount(); return; }
    mount();
    if (mini[st.url]) {
      while (slot.firstChild) slot.removeChild(slot.firstChild);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pill'; b.setAttribute('aria-expanded', 'false');
      b.appendChild(document.createTextNode(KX.t(lang, 'pill') + (st.m ? ' · ' + KX.t(lang, 'in') : '')));
      b.addEventListener('click', function () { mini[st.url] = false; draw(); var f = slot.querySelector('.go,a,button'); if (f) f.focus(); });
      var w = document.createElement('div'); w.className = 'kx'; w.style.cssText = 'all:unset'; w.appendChild(b); slot.appendChild(w);
      return;
    }
    KX.render(slot, st, {
      run: function () { KX.runXray(st, draw, viaPort); },
      close: function () { hidden[st.url] = true; unmount(); },
      minimise: function () { mini[st.url] = true; draw(); }
    });
  }
  function run(force) {
    var href = location.href.split('#')[0];
    if (href === last && !force) return; last = href;
    var mySt = { lang: lang, url: href, mode: 'loading', m: null, xr: { phase: 'idle' } };
    KX.lookup(href, texts(), country, bg).then(function (r) {
      if (href !== location.href.split('#')[0]) return;
      if (!r.res) { if (st && st.url === href && st.xr.phase !== 'idle') return; st = null; draw(); return; }   // stay quiet on errors
      mySt.mode = 'ready'; mySt.m = r.m;
      if (st && st.url === href && st.xr && st.xr.phase !== 'idle') mySt.xr = st.xr;
      if (!r.m && !isListing()) { st = null; draw(); return; }        // nothing to say on search and home pages
      if (!r.m && mini[href] == null) mini[href] = true;             // unknown listing: a small button, not a panel
      st = mySt; draw();
    }).catch(function () {});
  }
  run();
  setTimeout(function () { run(true); }, 2500);   // pages that render the heading late
  setInterval(function () { if (document.visibilityState === 'visible') run(); }, 1200);   // single-page portals change address without reloading
})();
