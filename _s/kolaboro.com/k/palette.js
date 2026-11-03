/*! Kolaboro command palette: Cmd/Ctrl+K or the search button. Fuzzy search over every tracked project, market and key page,
 *  entirely in the browser. The index (/api/x/a/index, Ed25519-signed, about 15 KB compressed) is kept in localStorage, so
 *  search keeps working offline once it has loaded one time.
 */
(function () {
  if (window.KBPalette) return;
  var LS = 'kb-sx-v1', RK = 'kb-sx-recent';
  var PAGES = [
    ['Check a project website', '/check', 'desk review ai analyze url link scan free', 'Tool'],
    ['Database of off-plan projects', '/database', 'all projects table filter download data', 'Page'],
    ['Live cases', '/cases', 'projects tracked list', 'Page'],
    ['Pricing', '/pricing', 'price cost fee 490 99 monitoring check', 'Page'],
    ['Book a check', '/book/', 'buy order pay paypal pre-purchase', 'Page'],
    ['How the Trust Score works', '/how-we-score', 'scoring method score six checks methodology', 'Page'],
    ['Verify evidence and signatures', '/verify', 'signature ed25519 receipt hash proof check', 'Trust'],
    ['Public log', '/log/', 'transparency log merkle rekor bitcoin opentimestamps head', 'Trust'],
    ['Status and uptime', '/status', 'uptime self-test incidents health probes', 'Trust'],
    ['Independence', '/independence', 'developers never pay conflict of interest', 'Trust'],
    ['Engineering', '/engineering', 'architecture tech stack how it is built', 'Trust'],
    ['AI evaluations', '/engineering/evals/', 'evals tests desk review accuracy injection', 'Trust'],
    ['Technology: the verification engine', '/technology', 'ai contract certificate price images progress', 'Page'],
    ['Open data and API', '/docs/api', 'api json csv developers endpoints openapi', 'Developers'],
    ['Open metrics', '/metrics', 'numbers metrics traffic revenue', 'Trust'],
    ['Security and your data', '/security', 'privacy encryption security scan', 'Trust'],
    ['Corrections', '/corrections', 'errors fixed mistakes', 'Trust'],
    ['How we collect data', '/data-policy', 'sources crawl research', 'Trust'],
    ['Off-Plan Disclosure Standard', '/standard', 'standard disclosure six things', 'Page'],
    ['Transparency Index by market', '/transparency-index', 'markets ranking countries index', 'Page'],
    ['Official registers', '/registers', 'registry permits licence check yourself', 'Page'],
    ['Before-you-sign checklist', '/checklist', '20 points checklist deposit contract', 'Guide'],
    ['Glossary', '/glossary', 'terms leasehold freehold escrow pbg imb', 'Guide'],
    ['Off-plan risk calculator', '/tools/risk', 'risk money at risk calculator', 'Tool'],
    ['Rental yield check', '/tools/yield-check', 'yield roi rental return calculator', 'Tool'],
    ['Contract first pass', '/tools/contract-scan', 'contract clauses scan pdf', 'Tool'],
    ['Payment plan checker', '/tools/payment-plan', 'payment schedule milestones instalments', 'Tool'],
    ['Compare projects side by side', '/compare', 'compare versus', 'Tool'],
    ['Your watchlist', '/watchlist', 'saved projects follow changes alerts', 'Tool'],
    ['Satellite watch', '/satellite', 'satellite imagery construction progress space', 'Page'],
    ['Live from the site', '/live', 'video site visit agent', 'Page'],
    ['Sample client report', '/report/sample', 'example report villa', 'Page'],
    ['Buyer portal demo', '/portal/demo', 'portal login demo client', 'Page'],
    ['Destinations', '/destinations', 'countries markets where', 'Guide'],
    ['Buying property in Bali', '/bali', 'indonesia bali foreigner leasehold', 'Guide'],
    ['Buying property in Dubai', '/dubai', 'uae dubai rera escrow', 'Guide'],
    ['Buying property in Phuket', '/phuket', 'thailand phuket condo', 'Guide'],
    ['Buying property in Tulum', '/tulum', 'mexico tulum fideicomiso', 'Guide'],
    ['Buying property in the Algarve', '/algarve', 'portugal algarve', 'Guide'],
    ['Buying property in Lombok', '/lombok', 'indonesia lombok', 'Guide'],
    ['Agent academy', '/academy', 'training course agents', 'Page'],
    ['Become a Kolaboro agent', '/agents', 'work earn agent join', 'Page'],
    ['For developers', '/developers', 'developer verified badge reply', 'Page'],
    ['For lawyers and notaries', '/lawyers', 'lawyer notary case file', 'Page'],
    ['For regulators', '/regulators', 'government regulator data', 'Page'],
    ['Investors', '/investors', 'investors deck fundraising', 'Page'],
    ['About Kolaboro', '/about', 'founder team company', 'Page'],
    ['Changelog', '/changelog', 'what shipped updates new', 'Page'],
    ['Roadmap', '/roadmap', 'features planned', 'Page'],
    ['Press kit', '/press', 'media logo press', 'Page'],
    ['Research agent', '/research', 'research agent bali developers advertise', 'Page'],
    ['Browser extension', '/extension', 'chrome extension one click', 'Tool'],
    ['Log in', '/login', 'sign in account', 'Account'],
    ['Privacy policy', '/legal/privacy', 'gdpr privacy', 'Legal'],
    ['Terms', '/legal/terms', 'terms conditions', 'Legal']
  ];
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  var items = [], ready = false, meta = { n: 0, markets: 0, updated: '', offline: false, verified: null };
  PAGES.forEach(function (p) { items.push({ t: 'page', title: p[0], sub: p[3] + ' · kolaboro.com' + p[1], href: p[1], h: norm(p[0] + ' ' + p[2] + ' ' + p[1].replace(/[\/-]/g, ' ')), w: 3 }); });
  var pageCount = items.length;
  function build(ix) {
    items.length = pageCount;
    (ix.m || []).forEach(function (m) { items.push({ t: 'market', title: m[0], sub: 'Market · ' + m[2] + ' project' + (m[2] === 1 ? '' : 's') + (m[3] && m[3] !== m[0] ? ' · ' + m[3] : ''), href: '/m/' + m[1] + '/', h: norm(m[0] + ' ' + m[3] + ' market'), w: 2 }); });
    (ix.p || []).forEach(function (p) {
      var id = p[0], idn = norm(id), sub = [p[1] + (p[2] && p[2] !== p[1] ? ', ' + p[2] : ''), p[3], p[4], p[5] != null ? p[5] + ' of 6 checks public' : '', p[7] ? p[7] + ' public problem' + (p[7] > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
      items.push({ t: 'project', title: id, sub: sub, href: '/p/' + encodeURIComponent(id) + '/', flags: p[7], h: norm(id + ' ' + idn.replace(/-/g, '') + ' ' + idn.replace(/-0*/g, ' ') + ' ' + p[1] + ' ' + p[2] + ' ' + p[3] + ' ' + p[4] + ' ' + p[8] + ' ' + p[9] + (p[7] ? ' flags problems' : '')), w: 1 });
    });
    meta.n = (ix.p || []).length; meta.markets = (ix.m || []).length; meta.updated = ix.updated || ''; ready = true;
  }
  function store() { try { return window.localStorage; } catch (e) { return null; } }
  var loading = null;
  function load() {
    if (loading) return loading;
    var st = store(), cached = null;
    try { cached = st && JSON.parse(st.getItem(LS) || 'null'); } catch (e) {}
    if (cached && cached.ix) { build(cached.ix); meta.offline = true; }
    var fresh = cached && Date.now() - cached.at < 6 * 3600e3;
    var net = fresh && navigator.onLine !== false ? Promise.resolve() : (window.KBVerify ? KBVerify.fetchSigned('/api/x/a/index') : fetch('/api/x/a/index').then(function (r) { return r.text().then(function (t) { return { ok: r.ok, text: t, json: JSON.parse(t), check: null }; }); }))
      .then(function (r) {
        if (!r || !r.ok || !r.json || !r.json.p) return;
        if (!cached || cached.ix.v !== r.json.v) build(r.json);
        try { st && st.setItem(LS, JSON.stringify({ at: Date.now(), ix: r.json })); meta.offline = true; } catch (e) { meta.offline = false; }
        if (r.check) r.check.then(function (c) { meta.verified = c.state; foot(); });
      }).catch(function () {});
    loading = cached && cached.ix ? Promise.resolve() : net;
    return loading;
  }
  // scoring: every query word must appear, as a substring (word start scores more) or as an ordered subsequence within a short span
  function score(it, qs) {
    var s = 0, h = it.h;
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i], k = h.indexOf(q);
      if (k >= 0) { s += (k === 0 ? 14 : /[\s\-\/]/.test(h[k - 1]) ? 10 : 5) + Math.min(q.length, 6); if (it.t === 'project' && norm(it.title) === q) s += 40; continue; }
      if (q.length < 3) return -1;
      var j = 0, first = -1, last = -1;
      for (var x = 0; x < h.length && j < q.length; x++) if (h[x] === q[j]) { if (first < 0) first = x; last = x; j++; }
      if (j < q.length || last - first > q.length * 3) return -1;
      s += 2;
    }
    return s * 10 + it.w * (qs.join('').length < 4 ? 6 : 2) - h.length / 400;
  }
  function search(q) {
    var t0 = performance.now(), qs = norm(q).split(' ').filter(Boolean), out = [];
    if (!qs.length) out = items.filter(function (x) { return x.t === 'page'; }).slice(0, 10).map(function (x) { return { it: x, s: 0 }; });
    else { for (var i = 0; i < items.length; i++) { var s = score(items[i], qs); if (s > 0) out.push({ it: items[i], s: s }); } out.sort(function (a, b) { return b.s - a.s; }); out = out.slice(0, 40); }
    var url = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(q.trim()) && !/^[a-z]{2,6}-\d+$/i.test(q.trim());
    if (url) out.unshift({ it: { t: 'action', title: 'Run a desk review of ' + q.trim(), sub: 'Tool · reads the page and lists what it promises and leaves out', href: '/check?url=' + encodeURIComponent(q.trim()) + '#analyze' }, s: 1e9 });
    return { list: out, ms: performance.now() - t0, total: items.length };
  }
  var root, input, list, footEl, last = { list: [] }, active = 0, prevFocus = null;
  var CSS = '.kxp{position:fixed;inset:0;z-index:1000;display:none;align-items:flex-start;justify-content:center;padding:12vh 16px 16px;background:rgba(23,33,43,.42)}' +
    '.kxp.on{display:flex}.kxp-b{width:min(640px,100%);max-height:72vh;display:flex;flex-direction:column;background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(23,33,43,.35);overflow:hidden;font-family:Archivo,system-ui,sans-serif;color:#17212B}' +
    '.kxp-h{display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid rgba(23,33,43,.12)}.kxp-h svg{width:18px;height:18px;flex:none;color:#59626B}' +
    '.kxp-h input{flex:1;min-width:0;height:56px;border:0;outline:0;font:500 1.05rem Archivo,system-ui,sans-serif;color:#17212B;background:none}.kxp-h input::placeholder{color:#7A838C}' +
    '.kxp-x{border:1px solid rgba(23,33,43,.18);background:#F6F6F3;border-radius:7px;font:700 .72rem Archivo,system-ui,sans-serif;color:#59626B;padding:5px 8px;cursor:pointer;min-height:30px}' +
    '.kxp-l{list-style:none;margin:0;padding:6px;overflow-y:auto;overscroll-behavior:contain;flex:1}' +
    '.kxp-l li{display:flex;align-items:center;gap:12px;padding:9px 10px;border-radius:10px;cursor:pointer;min-height:48px}.kxp-l li[aria-selected=true]{background:#F1EFE9;box-shadow:inset 3px 0 0 #FF5B14}' +
    '.kxp-l .ic{flex:none;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font:800 .62rem Archivo,system-ui,sans-serif;letter-spacing:.04em;background:#E3E2DD;color:#2A3541}.kxp-l .ic.project{background:#17212B;color:#fff}.kxp-l .ic.market{background:#DDEFE7;color:#075E41}.kxp-l .ic.action{background:#FF5B14;color:#170800}' +
    '.kxp-l .tx{min-width:0;flex:1}.kxp-l b{display:block;font-weight:700;font-size:.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kxp-l small{display:block;color:#59626B;font-size:.8rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kxp-l mark{background:none;color:#B83A05;font-weight:800}' +
    '.kxp-l .fl{flex:none;font:700 .7rem Archivo,system-ui,sans-serif;color:#8F2D04;background:#FDE6DC;border-radius:99px;padding:2px 8px}' +
    '.kxp-e{padding:22px 16px;color:#59626B;font-size:.92rem}' +
    '.kxp-f{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:space-between;padding:9px 14px;border-top:1px solid rgba(23,33,43,.12);font-size:.74rem;color:#59626B;background:#FAFAF8}.kxp-f kbd{font:600 .7rem ui-monospace,Menlo,monospace;border:1px solid rgba(23,33,43,.2);border-bottom-width:2px;border-radius:4px;padding:0 4px;background:#fff}' +
    '@media (max-width:600px){.kxp{padding:0;align-items:stretch}.kxp-b{max-height:none;height:100%;border-radius:0}.kxp-f .kb{display:none}}';
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(text, q) {
    var e = esc(text), qs = norm(q).split(' ').filter(function (x) { return x.length > 1; });
    qs.forEach(function (w) { var k = norm(text).indexOf(w); if (k >= 0 && norm(text).length === text.length) { var raw = text.substr(k, w.length); e = e.replace(esc(raw), '<mark>' + esc(raw) + '</mark>'); } });
    return e;
  }
  var IC = { page: 'PG', project: 'ID', market: 'MK', action: 'GO' };
  function render() {
    var q = input.value, r = search(q); last = r; active = 0;
    if (!r.list.length) { list.innerHTML = '<li class="kxp-e" role="presentation">' + (ready || !q ? 'Nothing matches "' + esc(q) + '". Try a market (Bali, Dubai), a project id (BALI-014) or a page (pricing).' : 'Loading the project index…') + '</li>'; input.setAttribute('aria-activedescendant', ''); }
    else list.innerHTML = r.list.map(function (x, i) { var it = x.it; return '<li role="option" id="kxp-o' + i + '" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span class="ic ' + it.t + '" aria-hidden="true">' + IC[it.t] + '</span><span class="tx"><b>' + hl(it.title, q) + '</b><small>' + esc(it.sub) + '</small></span>' + (it.flags ? '<span class="fl">' + it.flags + ' flag' + (it.flags > 1 ? 's' : '') + '</span>' : '') + '</li>'; }).join('');
    if (r.list.length) input.setAttribute('aria-activedescendant', 'kxp-o0');
    input.setAttribute('aria-expanded', r.list.length ? 'true' : 'false');
    foot();
  }
  function foot() {
    if (!footEl) return;
    var v = meta.verified === 'ok' ? ' · index signature verified' : meta.verified && meta.verified !== 'ok' ? ' · index signature: ' + meta.verified : '';
    footEl.innerHTML = '<span>' + (ready ? meta.n.toLocaleString('en') + ' projects, ' + meta.markets + ' markets, ' + PAGES.length + ' pages' : PAGES.length + ' pages (projects loading)') + ' · searched in ' + (last.ms != null ? last.ms.toFixed(1) : '0') + ' ms in your browser' + (meta.offline ? ' · saved for offline use' : '') + v + '</span><span class="kb"><kbd>↑</kbd> <kbd>↓</kbd> move · <kbd>Enter</kbd> open · <kbd>Esc</kbd> close</span>';
  }
  function setActive(i) {
    var n = last.list.length; if (!n) return; active = (i + n) % n;
    list.querySelectorAll('[role=option]').forEach(function (li, k) { li.setAttribute('aria-selected', k === active ? 'true' : 'false'); });
    var el = document.getElementById('kxp-o' + active); if (el) { el.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', el.id); }
  }
  function go(i, newTab) {
    var x = last.list[i]; if (!x) return;
    try { var st = store(), rc = JSON.parse((st && st.getItem(RK)) || '[]').filter(function (h) { return h !== x.it.href; }); rc.unshift(x.it.href); st && st.setItem(RK, JSON.stringify(rc.slice(0, 8))); } catch (e) {}
    try { if (window.kbEvent) kbEvent('palette_open_result', { type: x.it.t }); } catch (e) {}
    if (newTab) window.open(x.it.href, '_blank', 'noopener'); else { close(true); location.href = x.it.href; }
  }
  function mount() {
    if (root) return;
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    root = document.createElement('div'); root.className = 'kxp'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Search Kolaboro');
    root.innerHTML = '<div class="kxp-b"><div class="kxp-h"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<input type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="kxp-l" aria-label="Search projects, markets and pages" placeholder="Search projects, markets, pages…" autocomplete="off" spellcheck="false" enterkeyhint="go">' +
      '<button type="button" class="kxp-x" aria-label="Close search">Esc</button></div><ul class="kxp-l" id="kxp-l" role="listbox" aria-label="Results"></ul><div class="kxp-f" aria-live="polite"></div></div>';
    document.body.appendChild(root);
    input = root.querySelector('input'); list = root.querySelector('.kxp-l'); footEl = root.querySelector('.kxp-f');
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0); }
      else if (e.key === 'Enter') { e.preventDefault(); go(active, e.metaKey || e.ctrlKey); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('mousemove', function (e) { var li = e.target.closest('[role=option]'); if (li && +li.dataset.i !== active) setActive(+li.dataset.i); });
    list.addEventListener('click', function (e) { var li = e.target.closest('[role=option]'); if (li) go(+li.dataset.i, e.metaKey || e.ctrlKey); });
    root.querySelector('.kxp-x').addEventListener('click', function () { close(); });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); return; } if (e.key !== 'Tab') return; var b = root.querySelector('.kxp-x'); e.preventDefault(); (document.activeElement === input ? b : input).focus(); });
    root.addEventListener('mousedown', function (e) { if (e.target === root) close(); });
  }
  var bodyOverflow = '';
  function open(q) {
    mount(); if (root.classList.contains('on')) { input.select(); return; }
    prevFocus = document.activeElement; root.classList.add('on'); bodyOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    if (typeof q === 'string') input.value = q;
    render(); input.focus(); input.select();
    load().then(function () { if (root.classList.contains('on')) render(); });
    try { if (window.kbEvent) kbEvent('palette_open'); } catch (e) {}
    document.querySelectorAll('[data-kx-search]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
  }
  function close(navigating) {
    if (!root || !root.classList.contains('on')) return;
    root.classList.remove('on'); document.body.style.overflow = bodyOverflow;
    document.querySelectorAll('[data-kx-search]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (!navigating && prevFocus && prevFocus.focus) prevFocus.focus();
  }
  window.KBPalette = { open: open, close: close, load: load, search: search, isOpen: function () { return !!(root && root.classList.contains('on')); }, meta: meta };
  try { document.dispatchEvent(new CustomEvent('kbpalette:ready')); } catch (e) {}
})();
