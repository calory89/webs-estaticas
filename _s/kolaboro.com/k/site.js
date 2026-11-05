/* Kolaboro shared script: nav, events, sticky CTA, lead forms */
/* on-demand modules: kbLoad(name) loads a versioned script once; kbVerifyLoad() resolves to window.KBVerify (k/verify-badge.js) */
(function () {
  var V = { palette: '/k/palette.js?v=29f5606649', verify: '/k/verify-badge.js?v=d6fef3de86' }, P = {};
  window.kbLoad = function (n) {
    return P[n] || (P[n] = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = V[n]; s.async = true; s.onload = ok; s.onerror = function () { delete P[n]; no(new Error('load ' + n)); }; document.head.appendChild(s); }));
  };
  window.kbVerifyLoad = function () { return window.KBVerify ? Promise.resolve(window.KBVerify) : window.kbLoad('verify').then(function () { return window.KBVerify; }); };
  // run analytics-like side effects only once a prerendered page is really shown
  window.kbWhenActive = function (fn) { if (document.prerendering) document.addEventListener('prerenderingchange', fn, { once: true }); else fn(); };
})();
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ev(name, params) {
    try { if (window.gtag) gtag('event', name, params || {}); } catch (e) {}
    try { if (window.clarity) clarity('event', name); } catch (e) {}
  }
  window.kbEvent = ev;

  // nav shadow + mobile menu
  var nav = document.querySelector('.nav');
  if (nav) addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 8); }, { passive: true });
  var burger = document.querySelector('.burger'), links = document.querySelector('.links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && links.classList.contains('open')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); } });
    // a tap outside the open menu closes it
    document.addEventListener('click', function (e) { if (links.classList.contains('open') && !e.target.closest('.nav')) { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  }

  // language switcher: every page offers every language. Each entry leads to this page in that language when it exists
  // (the page's own <link rel=alternate hreflang> or its static switcher), otherwise to that language's home.
  (function () {
    var nl = document.querySelector('.nav .links'); if (!nl) return;
    var LG = [['en', 'English', '/', 'Language'], ['es', 'Español', '/es/', 'Idioma'], ['de', 'Deutsch', '/de/', 'Sprache'], ['fr', 'Français', '/fr/', 'Langue'], ['ru', 'Русский', '/ru/', 'Язык'], ['nl', 'Nederlands', '/nl/', 'Taal'], ['ar', 'العربية', '/ar/', 'اللغة'], ['zh', '简体中文', '/zh/', '语言']];
    var cur = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(), C = null;
    LG.forEach(function (l) { if (l[0] === cur) C = l; }); if (!C) { C = LG[0]; cur = 'en'; }
    var to = {};
    document.querySelectorAll('link[rel=alternate][hreflang]').forEach(function (l) { var k = l.getAttribute('hreflang').slice(0, 2).toLowerCase(); try { var u = new URL(l.href, location.href); if (u.origin === location.origin && !to[k]) to[k] = u.pathname + u.search; } catch (e) {} });
    var d = nl.querySelector('details.lsw');
    if (d) d.querySelectorAll('ul a[hreflang]').forEach(function (a) { var k = a.getAttribute('hreflang').slice(0, 2).toLowerCase(), h = a.getAttribute('href'); if (!to[k] && h) to[k] = h; });
    to[cur] = to[cur] || (location.pathname + location.search);
    var ico = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2 10h16M10 2c2.4 2.3 3.4 5 3.4 8s-1 5.7-3.4 8M10 2C7.6 4.3 6.6 7 6.6 10s1 5.7 3.4 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    if (!d) {
      d = document.createElement('details'); d.className = 'lsw';
      d.innerHTML = '<summary aria-label="' + C[3] + ': ' + cur.toUpperCase() + ' (' + C[1] + ')">' + ico + '<span class="lsw-w">' + C[3] + ':</span> ' + cur.toUpperCase() + '</summary><ul></ul>';
      var cta = nl.querySelector(':scope > a.btn'); nl.insertBefore(d, cta || null);
    }
    var ul = d.querySelector('ul'); if (!ul) return;
    ul.innerHTML = LG.map(function (l) {
      var h = to[l[0]] || l[2];
      return '<li><a href="' + h.replace(/"/g, '&quot;') + '" hreflang="' + l[0] + '" lang="' + l[0] + '"' + (l[0] === cur ? ' aria-current="page"' : '') + '>' + l[0].toUpperCase() + ' <span' + (l[0] === 'ar' ? ' dir="rtl"' : '') + '>' + l[1] + '</span></a></li>';
    }).join('');
    // close the list on Escape or a tap elsewhere
    document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); e.stopPropagation(); } });
  })();

  // footer on phones: each link group folds under its heading, so the footer stays short. Every link stays in the page.
  (function () {
    var g = document.querySelector('footer .fgrid'); if (!g || !window.matchMedia) return;
    var mq = window.matchMedia('(max-width:640px)'), cols = [];
    [].forEach.call(g.children, function (col, i) {
      var h = col.querySelector(':scope > .fh, :scope > h4'), ul = col.querySelector(':scope > ul'); if (!h || !ul) return;
      if (!ul.id) ul.id = 'kfg-' + i; cols.push({ col: col, h: h, ul: ul, txt: h.innerHTML });
    });
    if (!cols.length) return;
    function sync() {
      cols.forEach(function (c) {
        var b = c.h.querySelector('.fh-t');
        if (mq.matches && !b) {
          b = document.createElement('button'); b.type = 'button'; b.className = 'fh-t'; b.setAttribute('aria-controls', c.ul.id); b.setAttribute('aria-expanded', 'false'); b.innerHTML = c.txt;
          c.h.innerHTML = ''; c.h.appendChild(b); c.col.classList.add('fcol'); c.col.classList.remove('fopen');
          b.addEventListener('click', function () { var o = c.col.classList.toggle('fopen'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
        } else if (!mq.matches && b) { c.h.innerHTML = c.txt; c.col.classList.remove('fcol', 'fopen'); }
      });
    }
    sync(); if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync);
  })();


  // live counts: every [data-db] number follows the published database
  var dataP = null;
  var sumUrl = '/api/open/summary?t=' + Math.floor(Date.now() / 6e5), kvbSum = document.querySelector('[data-kvb="summary"]');
  function getData() {
    if (dataP) return dataP;
    // where the page shows a badge for these numbers, the signed answer is checked in the browser before the badge turns green
    if (kvbSum) dataP = window.kbVerifyLoad().then(function (KV) { return KV.fetchSigned(sumUrl).then(function (r) { KV.badge(kvbSum, r.check, { what: 'these database numbers (/api/open/summary)' }); return r.ok ? r.json : null; }); })
      .catch(function () { kvbSum.textContent = 'Signature not checked'; kvbSum.setAttribute('data-kvb-state', 'error'); return fetch(sumUrl).then(function (r) { return r.ok ? r.json() : null; }); }).catch(function () { return null; });
    else dataP = fetch(sumUrl).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return dataP;
  }
  if (document.querySelector('[data-db]')) {
    getData().then(function (d) {
      if (!d || !d.projects) return; var db = d.db || {}; var v = { projects: d.projects, markets: d.markets, countries: d.countries, claims_total: db.claims_total, contradicted: (db.claims || {}).contradicted, all_six_public: db.all_six_public, with_flags: db.with_flags, sources: db.sources, data_points: db.data_points };
      document.querySelectorAll('[data-db]').forEach(function (e) { var x = v[e.getAttribute('data-db')]; if (x) e.textContent = x.toLocaleString('en'); });
    });
  }
  // shipping log ticker: live database numbers plus the dated log of what shipped
  var shipT = document.getElementById('shipT');
  if (shipT) {
    var shipDur = function () { var g = shipT.firstElementChild; if (g) shipT.style.setProperty('--ship-dur', Math.max(30, Math.round(g.scrollWidth / 55)) + 's'); };
    shipDur();
    getData().then(function (d) {
      if (!d || !d.ships || !d.ships.length) return;
      var esc = function (t) { var x = document.createElement('i'); x.textContent = t; return x.innerHTML; };
      var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var day = function (iso) { var a = iso.split('-'); return M[+a[1] - 1] + ' ' + (+a[2]); };
      var T = { data: 'DATA', feature: 'SHIPPED', auto: 'AGENT', building: 'BUILDING' };
      var db = d.db || {}, cl = db.claims || {}, n = function (x) { return (x || 0).toLocaleString('en'); };
      var h = '<span class="si"><em class="k-live">LIVE</em><s>' + n(d.projects) + '</s> projects &middot; <s>' + n(d.countries) + '</s> countries &middot; <s>' + n(db.claims_total) + '</s> claims tested &middot; <s>' + n(cl.contradicted) + '</s> contradicted</span>';
      d.ships.slice(0, 16).forEach(function (x) { var inner = '<b>' + day(x.d) + '</b><em class="k-' + (T[x.k] ? x.k : 'feature') + '">' + (T[x.k] || 'SHIPPED') + '</em>' + esc(x.t); h += x.u && /^\/[^\/]/.test(x.u) ? '<a class="si" href="' + esc(x.u) + '">' + inner + '</a>' : '<span class="si">' + inner + '</span>'; });
      shipT.innerHTML = '<div class="ship-g">' + h + '</div><div class="ship-g" aria-hidden="true">' + h.replace(/<a /g, '<a tabindex="-1" ') + '</div>';
      shipDur();
    });
  }
  // live trust strip: daily self-test and public log, straight from the public endpoints
  var trust = document.getElementById('trust');
  if (trust) {
    var lg = document.documentElement.lang || 'en', hideT = function (id) { var e = document.getElementById(id); if (e) e.hidden = true; };
    fetch('https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_public_status', { method: 'POST', headers: { apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw', Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw', 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
        var t = s && s.selftests && s.selftests[0]; if (!t || !t.ok) return hideT('tr-st');
        var a = document.getElementById('tr-st'); a.querySelector('.tr-d').className = 'tr-d g';
        try { a.querySelector('span').textContent = '· ' + new Date(t.at).toLocaleDateString(lg, { day: 'numeric', month: 'short' }); } catch (e) {}
      }).catch(function () { hideT('tr-st'); });
    fetch('/api/open/log').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var n = d && d.heads ? d.heads.length : 0; if (!n) return hideT('tr-log');
      var a = document.getElementById('tr-log'); a.querySelector('.tr-d').className = 'tr-d g'; var first = d.heads[d.heads.length - 1].day; try { var ds = new Date(first + 'T12:00:00Z').toLocaleDateString(lg, { day: 'numeric', month: 'short' }), l2 = lg.slice(0, 2), SN = { de: 'seit ', fr: 'depuis le ', ru: 'с ', nl: 'sinds ', ar: 'منذ ', es: 'desde el ' }; a.querySelector('span').textContent = '· ' + (l2 === 'zh' ? ds + '起' : (SN[l2] || 'since ') + ds); } catch (e) {}
    }).catch(function () { hideT('tr-log'); });
  }
  // product video in a lightbox instead of leaving the page
  var VCL = { en: 'Close video', es: 'Cerrar vídeo', de: 'Video schließen', fr: 'Fermer la vidéo', ru: 'Закрыть видео', nl: 'Video sluiten', ar: 'إغلاق الفيديو', zh: '关闭视频' };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-ev="hero_demo"],a[data-video]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || typeof HTMLDialogElement !== 'function') return;
    e.preventDefault();
    var d = document.getElementById('kb-vd');
    if (!d) {
      var lg2 = (document.documentElement.lang || 'en').slice(0, 2);
      d = document.createElement('dialog'); d.id = 'kb-vd'; d.className = 'kb-vd';
      d.innerHTML = '<button type="button" class="kb-vd-x" aria-label="' + (VCL[lg2] || VCL.en) + '">×</button><video controls playsinline preload="metadata" poster="/k/v/demo-2026-poster.jpg" src="/k/kolaboro-demo-2026.mp4"></video>';
      document.body.appendChild(d);
      d.querySelector('.kb-vd-x').addEventListener('click', function () { d.close(); });
      d.addEventListener('click', function (x) { if (x.target === d) d.close(); });
      d.addEventListener('close', function () { d.querySelector('video').pause(); });
    }
    d.showModal(); var v = d.querySelector('video'); try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (x) {}
  });
  // keyboard: an element with data-kbd="/" gets focus when "/" is pressed outside a field
  var kbdEl = document.querySelector('[data-kbd="/"]');
  if (kbdEl) document.addEventListener('keydown', function (e) { var t = e.target; if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return; e.preventDefault(); kbdEl.focus(); kbdEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  // errors in this browser are reported (page path, message, script origin; nothing personal) so we see breakage before users tell us
  (function () {
    var q = [], sent = 0, t = null;
    function flush() { t = null; if (!q.length || sent > 10) return; var b = JSON.stringify({ kind: 'js', page: location.pathname, errors: q.splice(0, 5) }); sent++; try { if (!(navigator.sendBeacon && navigator.sendBeacon('/api/kb/err', new Blob([b], { type: 'application/json' })))) fetch('/api/kb/err', { method: 'POST', body: b, keepalive: true, headers: { 'content-type': 'application/json' } }); } catch (e) {} }
    function add(msg, src, line) {
      msg = String(msg || ''); src = String(src || '');
      if (!msg || /^Script error\.?$/.test(msg) || /^(chrome|moz|safari)(-web)?-extension:/.test(src) || /ResizeObserver loop/.test(msg)) return;
      if (q.some(function (x) { return x.msg === msg && x.src === src; })) return;
      q.push({ msg: msg.slice(0, 300), src: src.slice(0, 200), line: line || null }); if (!t) t = setTimeout(flush, 3000);
    }
    addEventListener('error', function (e) { if (e && e.message) add(e.message, e.filename, e.lineno); }, true);
    addEventListener('unhandledrejection', function (e) { var r = e && e.reason; add('Unhandled promise: ' + (r && (r.message || r)) , r && r.stack ? (String(r.stack).match(/https?:\/\/[^\s)]+/) || [''])[0].replace(/:\d+:\d+$/, '') : ''); });
    addEventListener('pagehide', flush);
  })();
  // tracked clicks
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-ev]');
    if (a) ev(a.getAttribute('data-ev'), { label: (a.textContent || '').trim().slice(0, 60) });
  });

  // sticky mobile CTA: shows after the hero, hides when a form is on screen
  var m = document.querySelector('.mcta');
  if (m) {
    var formVisible = false;
    var forms = document.querySelectorAll('form[data-lead]');
    if ('IntersectionObserver' in window && forms.length) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (x) { formVisible = x.isIntersecting; }); upd(); }, { threshold: 0.05 });
      forms.forEach(function (f) { io.observe(f); });
    }
    var hero = document.querySelector('.hero, .phero'), heroVisible = !!hero;
    if (hero && 'IntersectionObserver' in window) { new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; upd(); }, { threshold: 0 }).observe(hero); }
    var hc = document.querySelectorAll('form.hero-check, #az-f1'), heroForm = false;
    if (hc.length && 'IntersectionObserver' in window) { var hio = new IntersectionObserver(function (es) { es.forEach(function (x) { x.target._kbv = x.isIntersecting; }); heroForm = [].some.call(hc, function (f) { return f._kbv; }); upd(); }, { threshold: 0.05 }); hc.forEach(function (f) { hio.observe(f); }); }
    // and hides over the footer, so it never covers the last links or the legal line
    var foot = document.querySelector('footer'), footVisible = false;
    if (foot && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { footVisible = es[0].isIntersecting; upd(); }, { threshold: 0 }).observe(foot);
    function upd() { m.classList.toggle('show', scrollY > 520 && !heroVisible && !formVisible && !heroForm && !footVisible); }
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // quick "check a project" boxes -> /check?q=
  document.querySelectorAll('form[data-check]').forEach(function (f) {
    f.noValidate = true;   // our own message below replaces the browser bubble, which phones often do not show
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = (f.q.value || '').trim();
      if (!q) {
        // empty: say what to type instead of doing nothing
        var HM = { en: "Paste the project's website, or type its name or the developer's name.", es: 'Pega la web del proyecto, o escribe su nombre o el del promotor.', de: 'Fügen Sie die Website des Projekts ein oder geben Sie den Namen des Projekts oder des Bauträgers ein.', fr: 'Collez le site du projet, ou saisissez son nom ou celui du promoteur.', ru: 'Вставьте сайт проекта или введите название проекта или застройщика.', nl: 'Plak de website van het project, of typ de naam van het project of de ontwikkelaar.', ar: 'الصق موقع المشروع، أو اكتب اسمه أو اسم المطوّر.', zh: '请粘贴项目网站，或输入项目或开发商的名称。' };
        var fe = f._kbfe; if (!fe) { fe = f._kbfe = document.createElement('p'); fe.className = 'fe hc-fe'; fe.setAttribute('role', 'alert'); fe.id = 'hcfe-' + Math.random().toString(36).slice(2, 7); f.parentNode.insertBefore(fe, f.nextSibling); f.q.setAttribute('aria-describedby', fe.id); f.q.addEventListener('input', function () { fe.textContent = ''; f.q.removeAttribute('aria-invalid'); }); }
        fe.textContent = HM[(document.documentElement.lang || 'en').slice(0, 2)] || HM.en; f.q.setAttribute('aria-invalid', 'true'); f.q.focus(); return;
      }
      ev('check_project', { q: q.slice(0, 80) });
      var CK = window.KBL && KBL.lp ? KBL.lp + '/check/' : '/check';   // translated pages stay in their language
      if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(q)) { location.href = CK + '?url=' + encodeURIComponent(q) + '#analyze'; return; }
      location.href = CK + '?q=' + encodeURIComponent(q);
    });
  });

  // lead forms
  var URL_ = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var COPY = {
    buyer: ['Where are you buying?', 'City and country', 'Project name or link', 'e.g. the developer or project website', 'What stage are you at, and what worries you most?'],
    agent: ['Which city do you live in?', 'Your city and country', 'LinkedIn or website (optional)', 'Anything that shows your work', 'What do you do today, and why would you be a great agent?'],
    developer: ['Where is your project?', 'City and country of the project', 'Project name and website', 'So we can start the review', 'Tell us about the project you would like verified.'],
    investor: ['Where are you based?', 'e.g. San Francisco', 'Fund or company (optional)', 'Your fund, company or angel profile', 'What would you like to know?']
  };
  var ES = (document.documentElement.lang || '').indexOf('es') === 0;
  if (ES) COPY = {
    buyer: ['¿Dónde compras?', 'Ciudad y país', 'Nombre o enlace del proyecto', 'ej. la web del promotor o del proyecto', '¿En qué punto estás y qué te preocupa más?'],
    agent: ['¿En qué ciudad vives?', 'Tu ciudad y país', 'LinkedIn o web (opcional)', 'Algo que muestre tu trabajo', '¿A qué te dedicas y por qué serías un gran agente?'],
    developer: ['¿Dónde está tu proyecto?', 'Ciudad y país del proyecto', 'Nombre y web del proyecto', 'Para empezar la revisión', 'Cuéntanos el proyecto que quieres verificar.'],
    investor: COPY.investor };
  // Indonesian pages (/agents/id/): labels and messages in the page language
  var ID = (document.documentElement.lang || '').indexOf('id') === 0;
  if (ID) COPY = {
    buyer: ['Di mana Anda membeli?', 'Kota dan negara', 'Nama atau tautan proyek', 'mis. situs web pengembang atau proyek', 'Di tahap mana Anda sekarang, dan apa yang paling Anda khawatirkan?'],
    agent: ['Di kota mana Anda tinggal?', 'Kota dan negara Anda', 'LinkedIn atau situs web (opsional)', 'Apa saja yang menunjukkan pekerjaan Anda', 'Apa pekerjaan Anda saat ini, dan mengapa Anda akan menjadi agen yang hebat?'],
    developer: ['Di mana proyek Anda?', 'Kota dan negara proyek', 'Nama dan situs web proyek', 'Agar kami bisa memulai peninjauan', 'Ceritakan proyek yang ingin Anda verifikasi.'],
    investor: COPY.investor };
  var MSG = ID ? { name: 'Tambahkan nama Anda.', email: 'Tambahkan alamat email yang valid.', place: 'Tambahkan kota atau tempat.', msg: 'Tambahkan pesan singkat agar kami tahu cara membantu.', check: 'Periksa kolom yang ditandai.', consent: 'Centang kotak ini agar kami bisa membalas lewat email.', bot: 'Terjadi kesalahan. Coba lagi dalam beberapa detik.', dup: 'Kami sudah menerima permintaan dari email ini. Kami akan segera membalas.', fields: 'Periksa kolom lalu coba lagi.', net: 'Pesan Anda tidak terkirim. Periksa koneksi lalu coba lagi.', sending: 'Mengirim…', saved: 'Draf disimpan di perangkat ini.' }
    : ES ? { name: 'Añade tu nombre.', email: 'Añade un email válido.', place: 'Añade una ciudad o lugar.', msg: 'Añade un mensaje corto para saber cómo ayudarte.', check: 'Revisa los campos marcados.', consent: 'Marca la casilla para que podamos responderte por email.', bot: 'Algo ha fallado. Inténtalo en unos segundos.', dup: 'Ya tenemos una solicitud con este email. Te responderemos pronto.', fields: 'Revisa los campos e inténtalo de nuevo.', net: 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.', sending: 'Enviando…', saved: 'Borrador guardado en este dispositivo.' }
    : { name: 'Add your name.', email: 'Add a valid email address.', place: 'Add a city or place.', msg: 'Add a short message so we know how to help.', check: 'Check the highlighted fields.', consent: 'Tick the box so we can reply to you by email.', bot: 'Something went wrong. Try again in a few seconds.', dup: 'We already have a request from this email. We will reply soon.', fields: 'Check the fields and try again.', net: 'Your message could not be sent. Check your connection and try again.', sending: 'Sending…', saved: 'Draft saved on this device.' };
  function store() { try { return window.localStorage; } catch (e) { return null; } }

  document.querySelectorAll('form[data-lead]').forEach(function (form) {
    var started = Date.now();
    var err = form.querySelector('.err'), send = form.querySelector('[type=submit]');
    var ok = form.nextElementSibling && form.nextElementSibling.classList.contains('ok') ? form.nextElementSibling : null;
    var quiz = form.querySelector('.quiz');
    var draftKey = 'kb-draft-' + (form.id || 'f');
    var lbl = function (n) { return form.querySelector('[data-l="' + n + '"]'); };

    function role() { var r = form.querySelector('input[name=role]:checked'); return r ? r.value : (form.dataset.defaultRole || 'buyer'); }
    function setRole(r) {
      var c = COPY[r] || COPY.buyer;
      var el = form.querySelector('input[name=role][value="' + r + '"]'); if (el) el.checked = true;
      if (lbl('place')) lbl('place').textContent = c[0]; if (form.place) form.place.placeholder = c[1];
      if (lbl('project')) lbl('project').textContent = c[2]; if (form.project) form.project.placeholder = c[3];
      if (lbl('msg')) lbl('msg').textContent = c[4];
      if (quiz) quiz.classList.toggle('on', r === 'agent');
      form.setAttribute('data-r', r);
    }
    form.addEventListener('change', function (e) { if (e.target.name === 'role') setRole(e.target.value); });
    document.querySelectorAll('a[data-role],button[data-role]').forEach(function (a) { a.addEventListener('click', function () { setRole(a.dataset.role); }); });

    // prefill from URL (?role=&project=&place=) and from saved draft
    var qs = new URLSearchParams(location.search);
    var st = store(), draft = null;
    try { draft = st && JSON.parse(st.getItem(draftKey) || 'null'); } catch (e) {}
    ['name', 'email', 'place', 'phone', 'project', 'msg'].forEach(function (k) {
      if (!form[k]) return;
      if (qs.get(k)) form[k].value = qs.get(k);
      else if (draft && draft[k]) form[k].value = draft[k];
    });
    setRole(qs.get('role') || (draft && draft.role) || role());
    var saved = form.querySelector('.saved');
    form.addEventListener('input', function () {
      if (!st) return;
      var d = { role: role() }; ['name', 'email', 'place', 'phone', 'project', 'msg'].forEach(function (k) { if (form[k]) d[k] = form[k].value; });
      try { st.setItem(draftKey, JSON.stringify(d)); if (saved) saved.textContent = MSG.saved; } catch (e) {}
    });

    var step2 = form.querySelector('.step2'), next = form.querySelector('.step-next');
    function openStep2(focus) { if (!step2) return; step2.classList.add('on'); if (next) next.style.display = 'none'; if (focus && form.place) form.place.focus(); }
    if (qs.get('project') || (draft && (draft.place || draft.msg))) openStep2(false);
    if (next) next.addEventListener('click', function () {
      var ok1 = true; fieldErr('name', ''); fieldErr('email', '');
      if (!form.name.value.trim()) { fieldErr('name', MSG.name); ok1 = false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.value.trim())) { fieldErr('email', MSG.email); ok1 = false; }
      if (!ok1) { (form.name.getAttribute('aria-invalid') === 'true' ? form.name : form.email).focus(); return; } ev('form_step1', { role: role() }); openStep2(true);
    });
    function fieldErr(name, msg) {
      var el = form[name]; if (!el) return;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      var fe = el.parentNode.querySelector('.fe'); if (fe) fe.textContent = msg || '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = ''; openStep2(false);
      var f = new FormData(form), g = function (k) { return String(f.get(k) || '').trim(); };
      var r = role(), bad = null;
      ['name', 'email', 'place', 'msg'].forEach(function (k) { fieldErr(k, ''); });
      if (!g('name')) { fieldErr('name', MSG.name); bad = bad || 'name'; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g('email'))) { fieldErr('email', MSG.email); bad = bad || 'email'; }
      if (g('place').length < 2) { fieldErr('place', MSG.place); bad = bad || 'place'; }
      if (g('msg').length < 3) { fieldErr('msg', MSG.msg); bad = bad || 'msg'; }
      if (bad) { form[bad].focus(); err.textContent = MSG.check; return; }
      if (!f.get('consent')) { err.textContent = MSG.consent; return; }
      if (g('company') || Date.now() - started < 2500) { err.textContent = MSG.bot; return; }

      var extra = [];
      if (g('project')) extra.push('Project: ' + g('project'));
      if (r === 'agent' && quiz) ['q_live', 'q_bg', 'q_lang'].forEach(function (k) { if (g(k)) extra.push(k.replace('q_', '') + ': ' + g(k)); });
      var source = [form.dataset.source || 'yc-home', qs.get('utm_source'), qs.get('utm_campaign'), document.referrer && new URL(document.referrer).host].filter(Boolean).join(' | ').slice(0, 200);
      send.disabled = true; var label = send.textContent; send.textContent = MSG.sending;
      fetch(URL_, {
        method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_name: g('name'), p_email: g('email'), p_country: g('place'), p_phone: g('phone'),
          p_who: r + ' | ' + g('place'), p_bring: (g('msg') + (extra.length ? '\n\n' + extra.join('\n') : '')).slice(0, 4000),
          p_learn: g('project').slice(0, 300), p_week: '', p_lang: 'en', p_source: source, p_plan: ('yc-' + r).slice(0, 20) })
      }).then(function (res) { return res.json(); }).then(function (d) {
        if (d === 'ok') {
          form.classList.add('sent'); try { st && st.removeItem(draftKey); } catch (e) {}
          if (ok) { ok.style.display = 'block'; ok.focus(); }
          if (ok) { var pn = ok.querySelector('.paynow'); if (pn) pn.hidden = r !== 'buyer'; }
          ev('generate_lead', { role: r }); return;
        }
        if (d === 'too_many') throw new Error(MSG.dup);
        throw new Error(MSG.fields);
      }).catch(function (x) {
        err.textContent = (x && x.message && x.message.indexOf('fetch') < 0) ? x.message : MSG.net;
        send.disabled = false; send.textContent = label;
      });
    });
  });

  // dials that fill when visible: <svg data-dial="59"> with a circle.arc and a <b>
  document.querySelectorAll('[data-dial]').forEach(function (d) {
    var target = +d.getAttribute('data-dial'), arc = d.querySelector('.arc'), num = d.querySelector('b');
    var len = +arc.getAttribute('stroke-dasharray');
    function fill() {
      arc.style.transition = reduce ? 'none' : 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)';
      arc.style.strokeDashoffset = len * (1 - target / 100);
      if (reduce) { num.textContent = target; return; }
      var s = performance.now(); (function n(t) { var k = Math.min(1, (t - s) / 1200); num.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(n); })(s);
    }
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { fill(); io.disconnect(); } }, { threshold: .4 }); io.observe(d); } else fill();
  });
})();

/* newsletter + exit offer (round 3) */
(function () {
  var URL_ = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  document.querySelectorAll('form[data-news]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var m = f.querySelector('.nmsg'), em = (f.email.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { m.textContent = (document.documentElement.lang || '').indexOf('id') === 0 ? 'Tambahkan alamat email yang valid.' : 'Add a valid email address.'; m.style.color = 'var(--hivis-ink)'; return; }
      m.textContent = 'Subscribing…'; m.style.color = '';
      fetch(URL_, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_name: 'Newsletter subscriber', p_email: em, p_country: '', p_phone: '', p_who: 'newsletter | ' + location.pathname,
          p_bring: 'Subscribed to the monthly newsletter from ' + location.pathname, p_learn: '', p_week: '', p_lang: 'en', p_source: 'yc-newsletter', p_plan: 'yc-newsletter' }) })
        .then(function (r) { return r.json(); }).then(function (d) {
          if (d === 'ok' || d === 'too_many') { m.textContent = "You're subscribed."; f.email.value = ''; if (window.kbEvent) kbEvent('newsletter_signup'); return; }
          throw 0; }).catch(function () { m.textContent = 'Could not subscribe. Try again.'; m.style.color = 'var(--hivis-ink)'; });
    });
  });

  // exit offer: desktop only, once per browser, never on pages with forms already filled
  var st = null; try { st = localStorage; } catch (e) {}
  if (!window.matchMedia('(pointer:fine)').matches || (st && st.getItem('kb-exit'))) return;
  if (/^\/(checklist|survey|legal)/.test(location.pathname)) return;
  var shown = false, armed = false; setTimeout(function () { armed = true; }, 8000);
  document.addEventListener('mouseout', function (e) {
    if (shown || !armed || e.relatedTarget || e.clientY > 10) return;
    shown = true; try { st && st.setItem('kb-exit', '1'); } catch (x) {}
    var d = document.createElement('div'); d.className = 'exit on'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Free checklist');
    d.innerHTML = '<div class="box"><button class="x" aria-label="Close">×</button><h2>Before you go: the free 20-point checklist</h2><p>What to check on the land, permits, developer, contract and payments before you send a deposit.</p><p style="margin-top:20px"><a class="btn btn-hi" href="/checklist" data-ev="exit_checklist">Open the checklist</a></p></div>';
    document.body.appendChild(d); d.querySelector('.x').focus();
    function close() { d.remove(); }
    d.addEventListener('click', function (x) { if (x.target === d || x.target.classList.contains('x')) close(); });
    document.addEventListener('keydown', function k(x) { if (x.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
    if (window.kbEvent) kbEvent('exit_offer_shown');
  });
})();

/* round 5: table of contents, reading bar, share and helpful widgets on long pages */
(function () {
  var prose = document.querySelector('.prose');
  if (!prose || location.pathname === '/' ) return;
  var hs = prose.querySelectorAll('h2');
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  if (hs.length >= 3) {
    var toc = document.createElement('nav'); toc.className = 'toc'; toc.setAttribute('aria-label', 'On this page');
    var ol = '<b>On this page</b><ol>';
    hs.forEach(function (h) { if (!h.id) h.id = slug(h.textContent); ol += '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>'; });
    toc.innerHTML = ol + '</ol>'; prose.insertBefore(toc, prose.firstChild);
    var bar = document.createElement('div'); bar.className = 'readbar'; document.body.appendChild(bar);
    addEventListener('scroll', function () {
      var r = prose.getBoundingClientRect(), h = r.height - innerHeight; bar.style.width = (h > 0 ? Math.min(100, Math.max(0, -r.top / h * 100)) : 100) + '%';
    }, { passive: true });
  }
  if (!/^\/(guides|academy\/\d|how-we-score|dubai|phuket|tulum|algarve|lombok|bali|glossary)/.test(location.pathname)) return;
  var url = encodeURIComponent(location.href.split('#')[0]), title = encodeURIComponent(document.title);
  var sh = document.createElement('div'); sh.className = 'share';
  sh.innerHTML = 'Share: <a href="https://wa.me/?text=' + title + '%20' + url + '" target="_blank" rel="noopener" data-ev="share_whatsapp">WhatsApp</a>' +
    '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + url + '" target="_blank" rel="noopener" data-ev="share_linkedin">LinkedIn</a>' +
    '<a href="https://twitter.com/intent/tweet?url=' + url + '&text=' + title + '" target="_blank" rel="noopener" data-ev="share_x">X</a>' +
    '<button type="button" data-ev="share_copy">Copy link</button>';
  sh.querySelector('button').addEventListener('click', function (e) { try { navigator.clipboard.writeText(location.href.split('#')[0]); e.target.textContent = 'Copied'; } catch (x) {} });
  var hp = document.createElement('div'); hp.className = 'helpful';
  hp.innerHTML = 'Was this useful? <button type="button" data-v="yes">Yes</button><button type="button" data-v="no">No</button>';
  hp.addEventListener('click', function (e) { var v = e.target.dataset && e.target.dataset.v; if (!v) return; if (window.kbEvent) kbEvent('helpful_' + v, { page: location.pathname }); hp.textContent = 'Thanks for telling us.'; });
  prose.appendChild(sh); prose.appendChild(hp);
})();

/* round 7: share a tool result as an image */
(function () {
  var outs = document.querySelectorAll('.out');
  if (!outs.length || !document.createElement('canvas').getContext) return;
  function wrap(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); lines.slice(0, 3).forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); }); return lines.length;
  }
  outs.forEach(function (out) {
    var num = out.querySelector('.num'); if (!num) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'share-res'; b.textContent = 'Share this result';
    b.setAttribute('data-ev', 'share_result_image'); out.appendChild(b);
    b.addEventListener('click', function () {
      var c = document.createElement('canvas'); c.width = 1200; c.height = 630; var x = c.getContext('2d');
      x.fillStyle = '#17212B'; x.fillRect(0, 0, 1200, 630);
      x.fillStyle = '#FF5B14'; x.beginPath(); x.arc(84, 84, 14, 0, 7); x.fill();
      x.fillStyle = '#F6F6F3'; x.font = '800 34px Archivo, Arial, sans-serif'; x.fillText('kolaboro', 112, 96);
      var title = (document.querySelector('h1') || {}).textContent || 'Kolaboro';
      var label = (out.querySelector('p') || {}).textContent || '';
      x.fillStyle = '#AEB6BE'; x.font = '600 34px Archivo, Arial, sans-serif'; wrap(x, title, 72, 190, 1056, 44);
      x.fillStyle = '#F6F6F3'; x.font = '800 150px Archivo, Arial, sans-serif'; x.fillText((num.textContent || '').trim().slice(0, 14), 66, 420);
      x.fillStyle = '#AEB6BE'; x.font = '500 32px Archivo, Arial, sans-serif'; wrap(x, label, 72, 480, 1056, 40);
      x.fillStyle = '#FF5B14'; x.font = '700 28px Archivo, Arial, sans-serif'; x.fillText('Check yours free at kolaboro.com' + location.pathname.replace(/\/$/, ''), 72, 584);
      c.toBlob(function (blob) {
        var file = new File([blob], 'kolaboro-result.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Kolaboro', url: location.href }).catch(function () {}); }
        else { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kolaboro-result.png'; document.body.appendChild(a); a.click(); a.remove(); }
      }, 'image/png');
    });
  });
})();

;(function(){
  var SB='https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_event', K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  function log(kind, ref){ try { fetch(SB, { method:'POST', keepalive:true, headers:{ apikey:K, Authorization:'Bearer '+K, 'Content-Type':'application/json' }, body: JSON.stringify({ p_kind:kind, p_ref:ref||null, p_page:location.pathname }) }); } catch(e){} }
  window.kbLog = log;
  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href*="paypal.com"]'); if (a) log('pay_click', a.getAttribute('data-ev') || a.textContent.trim().slice(0,60)); }, true);
  if (/^\/thanks/.test(location.pathname)) { try { if (!sessionStorage.getItem('kb-pr')) { sessionStorage.setItem('kb-pr','1'); log('paypal_return', location.search.slice(0,200)); } } catch(e){ log('paypal_return'); } }
})();

/* r27: first-touch attribution, referral codes, one visit event per session */
(function(){
  try {
    var K = 'kb-attr', q = new URLSearchParams(location.search), a = null;
    try { a = JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) {}
    var rh = ''; try { if (document.referrer) { var ru = new URL(document.referrer); if (ru.hostname.replace(/^www\./, '') !== location.hostname.replace(/^www\./, '')) rh = ru.hostname.replace(/^www\./, ''); } } catch (e) {}
    var se = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu|brave|startpage)\./.test(rh), so = /(facebook|instagram|t\.co|twitter|x\.com|linkedin|reddit|tiktok|youtube|whatsapp|telegram)/.test(rh);
    function clean(x){ return String(x || '').replace(/[|\/]/g, '-').slice(0, 60); }
    if (!a || q.get('utm_source') || q.get('gclid') || q.get('fbclid')) {
      a = { src: clean(q.get('utm_source') || (q.get('gclid') ? 'google' : q.get('fbclid') ? 'facebook' : rh ? (se ? rh.split('.').slice(-2, -1)[0] : rh) : 'direct')),
            medium: clean(q.get('utm_medium') || (q.get('gclid') || q.get('fbclid') ? 'cpc' : se ? 'organic' : so ? 'social' : rh ? 'referral' : '')),
            campaign: clean(q.get('utm_campaign')), ref: clean(rh), land: location.pathname.replace(/[|\s]/g, '').slice(0, 80) || '/', at: Date.now(), code: a && a.code };
      try { localStorage.setItem(K, JSON.stringify(a)); } catch (e) {}
    }
    var code = (q.get('ref') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/', AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
    function rpc(fn, b){ return fetch(SB + fn, { method: 'POST', headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function(r){ return r.json(); }); }
    if (code) rpc('kolaboro_ref_check', { p_code: code }).then(function(ok){
      if (ok !== true) return; a.code = code; try { localStorage.setItem(K, JSON.stringify(a)); } catch (e) {}
      try { if (sessionStorage.getItem('kb-refbar')) return; sessionStorage.setItem('kb-refbar', '1'); } catch (e) {}
      var b = document.createElement('div'); b.className = 'ref-bar'; b.setAttribute('role', 'status');
      b.innerHTML = 'A Kolaboro client sent you here: <b>€50 off</b> your first check. Code <b>' + code + '</b> is saved and applied when you request a check. <button aria-label="Close">×</button>';
      b.querySelector('button').onclick = function(){ b.remove(); }; document.body.appendChild(b);
    }).catch(function(){});
    var of = window.fetch;
    window.fetch = function(u, o){
      try {
        if (typeof u === 'string' && u.indexOf('rpc/kolaboro_apply') > 0 && o && typeof o.body === 'string') {
          var x = JSON.parse(localStorage.getItem(K) || 'null') || a, b = JSON.parse(o.body);
          b.p_source = String(b.p_source || '').split(' | ')[0] + ' | src=' + [x.src, x.medium, x.campaign].join('/') + (x.ref ? ' | ref=' + x.ref : '') + ' | land=' + x.land + (x.code ? ' | code=' + x.code : '');
          o = Object.assign({}, o, { body: JSON.stringify(b) });
        }
      } catch (e) {}
      return of.call(this, u, o);
    };
    (window.kbWhenActive || function (f) { f(); })(function () {
    var seen = false; try { seen = !!sessionStorage.getItem('kb-visit'); sessionStorage.setItem('kb-visit', '1'); } catch (e) { seen = true; }
    if (!seen && !/^\/(admin|portal|agents\/me)/.test(location.pathname) && !/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) rpc('kolaboro_event', { p_kind: 'visit', p_page: location.pathname.slice(0, 200), p_data: { src: a.src, medium: a.medium, campaign: a.campaign, ref: a.ref } }).catch(function(){});
    });
  } catch (e) {}
})();

/* 3 Nov 2026: instant navigation (Speculation Rules) and the command palette (Cmd/Ctrl+K, search button in the header) */
(function () {
  var path = location.pathname, priv = /^\/(admin|portal|agents\/me|backup-admin)/.test(path);
  // Same-origin links are prefetched and prerendered when the pointer rests on them (or on touch start), so the click shows a ready page.
  // Left out: private areas, APIs, sign-in and sign-out, data files, links with a query string, new-tab, download and video links.
  try {
    if (!priv && window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules') && !document.querySelector('script[type=speculationrules]')) {
      var where = { and: [{ href_matches: '/*' },
        { not: { href_matches: ['/admin*', '/api/*', '/portal*', '/login*', '/logout*', '/agents/me*', '/confirm-email*', '/reset*', '/thanks*', '/backup-admin*', '/mcp*', '/data/*', '/feed*', '/*.pdf', '/*.mp4', '/*.zip', '/*.csv', '/*.json', '/*.xml', '/*.png', '/*.jpg', '/*.webp'] } },
        { not: { selector_matches: 'a[href*="?"], a[href*="logout"], a[href*="sign-out"], a[download], a[target=_blank], a[rel~=nofollow], a[data-video], a[data-no-prerender]' } }] };
      var sr = document.createElement('script'); sr.type = 'speculationrules';
      sr.textContent = JSON.stringify({ prefetch: [{ source: 'document', where: where, eagerness: 'moderate' }], prerender: [{ source: 'document', where: where, eagerness: 'moderate' }] });
      document.head.appendChild(sr);
    }
  } catch (e) {}

  if (/^\/(admin|backup-admin)/.test(path)) return;
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var st = document.createElement('style');
  st.textContent = '.kx-sb{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 8px 0 12px;border:1.5px solid rgba(23,33,43,.22);border-radius:10px;background:rgba(255,255,255,.55);color:#2A3541;font:600 .88rem Archivo,system-ui,sans-serif;cursor:pointer;flex:none;white-space:nowrap}' +
    '.kx-sb:hover{border-color:#17212B;color:#17212B}.kx-sb svg{width:16px;height:16px;flex:none}' +
    '.kx-sb kbd{font:600 .7rem ui-monospace,Menlo,monospace;border:1px solid rgba(23,33,43,.2);border-bottom-width:2px;border-radius:5px;padding:1px 5px;color:#59626B;background:#fff}' +
    '@media (min-width:901px){.nav-in>.nav-right{order:3}.nav-in>.links{margin-left:auto}}' +
    '.kx-sb .kx-t,.kx-sb kbd{display:none}.kx-sb{width:40px;padding:0;justify-content:center}@media (min-width:901px) and (max-width:1020px){.nav-in{gap:14px}.links{gap:14px}}' +
    '@media (max-width:900px){.kx-sb{width:44px;height:44px;border:2px solid #17212B;border-radius:12px;background:none;color:#17212B}}';
  document.head.appendChild(st);
  var nin = document.querySelector('.nav .nav-in'), btn = null;
  if (nin) {
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kx-sb'; btn.setAttribute('data-kx-search', '');
    btn.setAttribute('aria-haspopup', 'dialog'); btn.title = 'Search (' + (mac ? '⌘K' : 'Ctrl+K') + ')'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Search projects, markets and pages (' + (mac ? 'Command' : 'Control') + ' K)');
    btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="m13 13 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span class="kx-t">Search</span><kbd aria-hidden="true">' + (mac ? '⌘K' : 'Ctrl K') + '</kbd>';
    var nr = nin.querySelector('.nav-right'); if (nr) nr.insertBefore(btn, nr.firstChild); else nin.appendChild(btn);
  }
  function openP(q) { window.kbLoad('palette').then(function () { window.KBPalette.open(q); }).catch(function () {}); }
  window.kbOpenSearch = openP;
  function warm() { window.kbLoad('palette').then(function () { window.KBPalette.load(); }).catch(function () {}); }
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-kx-search]'); if (t) { e.preventDefault(); openP(); } });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (window.KBPalette && KBPalette.isOpen()) KBPalette.close(); else openP(); }
  });
  if (btn) { btn.addEventListener('pointerenter', warm, { once: true }); btn.addEventListener('focus', warm, { once: true }); }
  // keep a copy of the index in this browser so search also works offline: fetched once, in idle time, unless data saving is on
  var has = false; try { has = !!localStorage.getItem('kb-sx-v1'); } catch (e) { has = true; }
  var save = navigator.connection && navigator.connection.saveData;
  if (!has && !save && !priv) window.kbWhenActive(function () {
    var go = function () { (window.requestIdleCallback || function (f) { setTimeout(f, 200); })(function () { setTimeout(warm, 2500); }, { timeout: 4000 }); };
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  });
})();
// verify badges: open their explanation toward the side with room, so it never runs off the screen
document.addEventListener('toggle', function (e) { var d = e.target; if (!d || !d.classList || !d.classList.contains('kvb') || !d.open) return; var r = d.getBoundingClientRect(); d.classList.toggle('kvb-r', r.left + 340 > document.documentElement.clientWidth - 8 && r.left > 200); }, true);
// real-user web vitals (block F): half of page views, loaded after the load event, see /status#st-vit
(function(){if(Math.random()>=0.5)return;function v(){setTimeout(function(){var s=document.createElement('script');s.src='/k/vitals.js?v=604551822c';s.async=1;document.head.appendChild(s)},1)}if(document.readyState==='complete')v();else addEventListener('load',v,{once:true})})();
// inline-handler free (strict CSP): forms marked data-nosubmit never navigate, buttons marked data-print open the print dialog
// cookie notice: a region, not a dialog (it never takes focus)
(function(){function f(){var c=document.getElementById('cc');if(c&&c.getAttribute('role')==='dialog')c.setAttribute('role','region');}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f();})();
document.addEventListener('submit',function(e){if(e.target.matches&&e.target.matches('form[data-nosubmit]'))e.preventDefault()},true);
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-print]');if(b){e.preventDefault();window.print()}});

/* 5 Nov 2026: dark mode toggle, keyboard shortcuts, share sheet, save for offline reading, printable project scorecard */
(function () {
  var D = document, H = D.documentElement, path = location.pathname;
  if (/^\/(admin|backup-admin)/.test(path)) return;
  var lg = (H.lang || 'en').slice(0, 2).toLowerCase();
  function st() { try { return window.localStorage; } catch (e) { return null; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function typing(t) { return t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable); }
  var css = D.createElement('style');
  css.textContent =
    '.kx-th{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:10px;border:1.5px solid var(--line);background:none;color:var(--ink-2);cursor:pointer;flex:none;padding:0;font:inherit}' +
    '@media (min-width:901px) and (max-width:1340px){.nav .links{gap:13px}.nav .links .kx-th{width:32px}}' +
    '.kx-th:hover{color:var(--ink);border-color:var(--ink)}.kx-th svg{width:18px;height:18px}.kx-th .kx-tht{display:none}' +
    '.kx-th .kx-sun{display:none}:root[data-theme=dark] .kx-th .kx-sun{display:block}:root[data-theme=dark] .kx-th .kx-moon{display:none}' +
    '@media (max-width:900px){.links .kx-th{display:flex;width:auto;height:auto;min-height:48px;justify-content:flex-start;gap:10px;border:0;border-bottom:1px solid var(--line);border-radius:0;padding:12px 0;font-size:1.05rem;font-weight:600}.links .kx-th .kx-tht{display:inline}}' +
    '.kx-dlg{margin:auto;border:2px solid var(--ink);border-radius:20px;padding:22px;max-width:min(480px,calc(100vw - 32px));width:100%;background:var(--paper);color:var(--ink);box-shadow:0 30px 70px -20px rgba(0,0,0,.45)}' +
    '.kx-dlg::backdrop{background:rgba(10,15,20,.55)}.kx-dlg h2{font-size:1.35rem;letter-spacing:-.01em;margin:0 44px 12px 0}' +
    '.kx-x{position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;border:2px solid var(--ink);background:none;color:var(--ink);font-size:1.2rem;line-height:1;cursor:pointer}' +
    '[dir=rtl] .kx-x{right:auto;left:12px}[dir=rtl] .kx-dlg h2{margin:0 0 12px 44px}' +
    '.kx-keys{list-style:none;display:grid;gap:8px;margin:0;padding:0}.kx-keys li{display:flex;justify-content:space-between;gap:16px;align-items:center;font-size:.95rem;color:var(--ink-2)}' +
    '.kx-keys kbd,.kx-kbd{font:700 .8rem ui-monospace,Menlo,monospace;border:1px solid var(--line);border-bottom-width:2px;border-radius:6px;padding:2px 7px;background:var(--card);color:var(--ink);white-space:nowrap}' +
    '.kx-note{margin-top:14px;font-size:.85rem;color:var(--muted)}' +
    '.kx-pact{margin-top:10px}.kx-pact .btn{padding:.7rem 1.1rem;font-size:.92rem}' +
    '.kx-sh-l{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}.kx-sh-l a,.kx-sh-l button{display:flex;align-items:center;justify-content:center;min-height:44px;border-radius:999px;border:2px solid var(--ink);background:none;color:var(--ink);font:inherit;font-weight:700;font-size:.92rem;text-decoration:none;cursor:pointer;padding:0 12px}' +
    '.kx-sh-l a:hover,.kx-sh-l button:hover{background:var(--band);color:var(--band-ink);border-color:var(--band)}' +
    '.kx-sh-p{margin:0 0 6px;padding:10px 12px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-size:.88rem;color:var(--ink-2);word-break:break-word}' +
    '.kx-sh-s{min-height:1.3em;margin-top:8px;font-size:.88rem;color:var(--ok);font-weight:600}' +
    '.kx-off{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin-top:18px;font-size:.9rem;color:var(--muted)}.kx-off .btn{padding:.6rem 1.05rem;font-size:.9rem}' +
    '.kx-offbar{position:sticky;top:0;z-index:25;background:var(--t-amb-bg,#FFF0C7);color:var(--t-amb,#7A5300);font-size:.9rem;font-weight:600;text-align:center;padding:8px 16px}' +
    '.kx-share-link{margin-inline-start:8px}';
  D.head.appendChild(css);

  /* ---------- dark mode: the inline head snippet sets data-theme before the first paint; this adds the toggle ---------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var THL = { en: 'Dark mode', es: 'Modo oscuro', de: 'Dunkelmodus', fr: 'Mode sombre', ru: 'Тёмная тема', nl: 'Donkere modus', ar: 'الوضع الداكن', zh: '深色模式', id: 'Mode gelap' };
  function isDark() { return H.getAttribute('data-theme') === 'dark'; }
  function setTheme(dark) {
    if (dark) H.setAttribute('data-theme', 'dark'); else H.removeAttribute('data-theme');
    var m = D.querySelector('meta[name="theme-color"]'); if (m) { if (!m.dataset.kxl) m.dataset.kxl = m.getAttribute('content') || '#17212B'; m.setAttribute('content', dark ? '#11171D' : m.dataset.kxl); }
    D.querySelectorAll('.kx-th').forEach(function (b) { b.setAttribute('aria-pressed', dark ? 'true' : 'false'); });
  }
  if (H.hasAttribute('data-kdk')) {
    var nl = D.querySelector('.nav .links');
    if (nl) {
      var tb = D.createElement('button'); tb.type = 'button'; tb.className = 'kx-th'; tb.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
      tb.setAttribute('aria-label', THL[lg] || THL.en); tb.title = THL[lg] || THL.en;
      tb.innerHTML = '<svg class="kx-moon" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.6A7 7 0 0 1 7.4 3.5a7 7 0 1 0 9.1 9.1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><svg class="kx-sun" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10 1.8v2.4M10 15.8v2.4M1.8 10h2.4M15.8 10h2.4M4.2 4.2l1.7 1.7M14.1 14.1l1.7 1.7M4.2 15.8l1.7-1.7M14.1 5.9l1.7-1.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span class="kx-tht">' + esc(THL[lg] || THL.en) + '</span>';
      var before = nl.querySelector(':scope > details.lsw') || nl.querySelector(':scope > a.btn'); nl.insertBefore(tb, before || null);
      tb.addEventListener('click', function () {
        var dark = !isDark(), s = st(); setTheme(dark);
        // a choice equal to the system setting is not stored, so the page follows the system again
        try { if (s) { if (mq && mq.matches === dark) s.removeItem('kb-theme'); else s.setItem('kb-theme', dark ? 'dark' : 'light'); } } catch (e) {}
        if (window.kbEvent) kbEvent('theme_toggle', { label: dark ? 'dark' : 'light' });
      });
    }
    if (isDark()) setTheme(true);
    if (mq) { var onSys = function (e) { var s = st(), t = null; try { t = s && s.getItem('kb-theme'); } catch (x) {} if (!t) setTheme(e.matches); }; if (mq.addEventListener) mq.addEventListener('change', onSys); else if (mq.addListener) mq.addListener(onSys); }
  }

  /* ---------- small accessible dialog used by the shortcuts list and the share sheet ---------- */
  function dialog(id, title, body, opener) {
    var d = D.getElementById(id);
    if (!d) {
      d = D.createElement('dialog'); d.id = id; d.className = 'kx-dlg'; d.setAttribute('aria-labelledby', id + '-h');
      D.body.appendChild(d);
      d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
      d.addEventListener('close', function () { var o = d._op; if (o && o.focus && D.contains(o)) o.focus(); });
    }
    d.innerHTML = '<button type="button" class="kx-x" aria-label="' + esc(KL().close) + '">×</button><h2 id="' + id + '-h">' + esc(title) + '</h2>' + body;
    d.querySelector('.kx-x').addEventListener('click', function () { d.close(); });
    d._op = opener || D.activeElement;
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    return d;
  }

  /* ---------- keyboard shortcuts: ? list, g h home, g c cases, g k check, / search ---------- */
  var KS = {
    en: ['Keyboard shortcuts', 'Search projects, markets and pages', 'Go to search', 'Go to the home page', 'Go to live cases', 'Check a project', 'Show this list', 'Close', 'Shortcuts never fire while you type in a field.', 'then'],
    es: ['Atajos de teclado', 'Buscar proyectos, mercados y páginas', 'Ir a la búsqueda', 'Ir a la página de inicio', 'Ir a los casos en directo', 'Comprobar un proyecto', 'Mostrar esta lista', 'Cerrar', 'Los atajos no funcionan mientras escribes en un campo.', 'luego'],
    de: ['Tastenkürzel', 'Projekte, Märkte und Seiten durchsuchen', 'Zur Suche', 'Zur Startseite', 'Zu den Live-Fällen', 'Ein Projekt prüfen', 'Diese Liste anzeigen', 'Schließen', 'Kürzel greifen nie, während Sie in ein Feld tippen.', 'dann'],
    fr: ['Raccourcis clavier', 'Rechercher projets, marchés et pages', 'Aller à la recherche', "Aller à l'accueil", 'Aller aux dossiers en direct', 'Vérifier un projet', 'Afficher cette liste', 'Fermer', 'Les raccourcis ne se déclenchent jamais pendant la saisie dans un champ.', 'puis'],
    ru: ['Сочетания клавиш', 'Поиск проектов, рынков и страниц', 'Перейти к поиску', 'На главную', 'К текущим делам', 'Проверить проект', 'Показать этот список', 'Закрыть', 'Сочетания не срабатывают, пока вы печатаете в поле.', 'затем'],
    nl: ['Sneltoetsen', 'Zoek projecten, markten en pagina’s', 'Naar het zoekveld', 'Naar de startpagina', 'Naar lopende dossiers', 'Een project checken', 'Deze lijst tonen', 'Sluiten', 'Sneltoetsen werken nooit terwijl u in een veld typt.', 'dan'],
    ar: ['اختصارات لوحة المفاتيح', 'ابحث في المشاريع والأسواق والصفحات', 'الانتقال إلى البحث', 'الذهاب إلى الصفحة الرئيسية', 'الذهاب إلى الحالات الجارية', 'افحص مشروعًا', 'عرض هذه القائمة', 'إغلاق', 'لا تعمل الاختصارات أثناء الكتابة في حقل.', 'ثم'],
    zh: ['键盘快捷键', '搜索项目、市场和页面', '跳到搜索', '前往首页', '前往实时案例', '检查一个项目', '显示此列表', '关闭', '在输入框中打字时快捷键不会触发。', '然后'],
    id: ['Pintasan keyboard', 'Cari proyek, pasar, dan halaman', 'Ke pencarian', 'Ke beranda', 'Ke kasus berjalan', 'Periksa proyek', 'Tampilkan daftar ini', 'Tutup', 'Pintasan tidak aktif saat Anda mengetik di kolom.', 'lalu']
  };
  function KL() { var k = KS[lg] || KS.en; return { title: k[0], search: k[1], focus: k[2], home: k[3], cases: k[4], check: k[5], help: k[6], close: k[7], note: k[8], then: k[9] }; }
  function dest(w) {
    var L = window.KBL && KBL.lp ? KBL : null, lp = L ? L.lp : '', has = function (n) { return L && (L.lpages || []).indexOf(n) >= 0; };
    if (w === 'h') return lp ? lp + '/' : '/';
    if (w === 'c') return has('cases') ? lp + '/cases/' : '/cases';
    return has('check') ? lp + '/check/' : '/check';
  }
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  function showKeys(op) {
    var k = KL(), K = function (t) { return '<kbd>' + t + '</kbd>'; };
    var rows = [[K(mac ? '⌘' : 'Ctrl') + ' ' + K('K'), k.search], [K('/'), k.focus], [K('g') + ' ' + esc(k.then) + ' ' + K('h'), k.home], [K('g') + ' ' + esc(k.then) + ' ' + K('c'), k.cases], [K('g') + ' ' + esc(k.then) + ' ' + K('k'), k.check], [K('?'), k.help], [K('Esc'), k.close]];
    dialog('kx-keys', k.title, '<ul class="kx-keys">' + rows.map(function (r) { return '<li><span>' + esc(r[1]) + '</span><span>' + r[0] + '</span></li>'; }).join('') + '</ul><p class="kx-note">' + esc(k.note) + '</p>', op);
    if (window.kbEvent) kbEvent('shortcuts_open');
  }
  window.kbShowKeys = showKeys;
  var gAt = 0;
  D.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
    if (D.querySelector('dialog[open]:not(.kx-dlg)')) return;   // another dialog (search, video) has the keyboard
    var k = e.key;
    if (k === '?') { e.preventDefault(); var o = D.getElementById('kx-keys'); if (o && o.open) o.close(); else showKeys(); return; }
    if (D.querySelector('dialog.kx-dlg[open]')) return;
    if (k === '/' && !D.querySelector('[data-kbd="/"]')) { e.preventDefault(); if (window.kbOpenSearch) kbOpenSearch(); return; }
    if (k === 'g' && !e.shiftKey) { gAt = Date.now(); return; }
    if (gAt && Date.now() - gAt < 1200 && /^[hck]$/.test(k)) { gAt = 0; e.preventDefault(); location.href = dest(k === 'k' ? 'k' : k); return; }
    gAt = 0;
  });

  /* ---------- share sheet: Web Share API where available, else WhatsApp, Telegram, X, email and copy link ---------- */
  function copyText(t, done) {
    function legacy() { var a = D.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.top = '-1000px'; D.body.appendChild(a); a.select(); var ok = false; try { ok = D.execCommand('copy'); } catch (e) {} a.remove(); done(ok); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, legacy); else legacy();
  }
  // data: { title, text, url } built only from public project data or the page itself, never from what the visitor typed
  function share(data, op) {
    if (window.kbEvent) kbEvent('share_open', { label: data.kind || '' });
    if (navigator.share && (window.matchMedia && matchMedia('(pointer:coarse)').matches)) {
      navigator.share({ title: data.title, text: data.text, url: data.url }).catch(function (e) { if (!e || e.name !== 'AbortError') sheet(data, op); });
      return;
    }
    sheet(data, op);
  }
  function sheet(data, op) {
    var u = encodeURIComponent(data.url), t = encodeURIComponent(data.text), both = encodeURIComponent(data.text + ' ' + data.url);
    var body = '<p class="kx-sh-p">' + esc(data.text) + '<br>' + esc(data.url) + '</p><div class="kx-sh-l">' +
      (navigator.share ? '<button type="button" data-kx-native>More apps…</button>' : '') +
      '<a href="https://wa.me/?text=' + both + '" target="_blank" rel="noopener" data-ev="share_whatsapp">WhatsApp</a>' +
      '<a href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener" data-ev="share_telegram">Telegram</a>' +
      '<a href="https://twitter.com/intent/tweet?text=' + t + '&url=' + u + '" target="_blank" rel="noopener" data-ev="share_x">X</a>' +
      '<a href="mailto:?subject=' + encodeURIComponent(data.title) + '&body=' + encodeURIComponent(data.text + '\n\n' + data.url) + '" data-ev="share_email">Email</a>' +
      '<button type="button" data-kx-copy data-ev="share_copy">Copy link</button></div><p class="kx-sh-s" role="status" aria-live="polite"></p>' +
      '<p class="kx-note">Only public, anonymous project data and the link are shared. Nothing you typed on this site is included.</p>';
    var d = dialog('kx-share', data.heading || 'Share', body, op), s = d.querySelector('.kx-sh-s');
    d.querySelector('[data-kx-copy]').addEventListener('click', function () { copyText(data.url, function (ok) { s.textContent = ok ? 'Link copied.' : 'Could not copy. Select the link above and copy it.'; }); });
    var nb = d.querySelector('[data-kx-native]'); if (nb) nb.addEventListener('click', function () { navigator.share({ title: data.title, text: data.text, url: data.url }).catch(function () {}); });
  }
  window.kbShare = share;
  function btn(label, cls) { var b = D.createElement('button'); b.type = 'button'; b.className = cls || 'btn btn-line'; b.textContent = label; return b; }
  // tool results: next to "Share this result" (image), a link share with the tool name and its address only (no query string, no inputs)
  function toolShare() {
    D.querySelectorAll('.share-res').forEach(function (r) {
      if (r.nextElementSibling && r.nextElementSibling.classList.contains('kx-share-link')) return;
      var b = btn('Share link', 'share-res kx-share-link'); b.setAttribute('data-ev', 'share_tool_link'); r.parentNode.insertBefore(b, r.nextSibling);
      b.addEventListener('click', function () {
        var h1 = (D.querySelector('h1') || {}).textContent || D.title;
        share({ kind: 'tool', heading: 'Share this tool', title: 'Kolaboro: ' + h1.trim(), text: 'Kolaboro tool: ' + h1.trim() + '. Free, and the numbers you type stay in your browser.', url: location.origin + location.pathname }, b);
      });
    });
  }
  toolShare();

  /* ---------- save for offline reading (service worker /sw.js, cache kb-saved-v1, list on /saved/) ---------- */
  var SC = 'kb-saved-v1', IDX = '/__saved/index.json', canOff = 'serviceWorker' in navigator && 'caches' in window && location.protocol === 'https:';
  function norm(u) { try { var x = new URL(u, location.href); x.hash = ''; x.searchParams.delete('t'); return x.pathname + x.search; } catch (e) { return u; } }
  function idx(c) { return c.match(IDX).then(function (r) { return r ? r.json() : []; }).catch(function () { return []; }); }
  function putIdx(c, list) { return c.put(IDX, new Response(JSON.stringify(list), { headers: { 'content-type': 'application/json' } })); }
  window.kbSaved = { cache: SC, index: IDX, list: function () { return canOff ? caches.open(SC).then(idx) : Promise.resolve([]); },
    remove: function (u) { return caches.open(SC).then(function (c) { return idx(c).then(function (L) {
      var it = L.filter(function (x) { return x.u === u; })[0], rest = L.filter(function (x) { return x.u !== u; }); if (!it) return rest;
      var keep = {}; rest.forEach(function (x) { keep[x.u] = 1; (x.a || []).forEach(function (a) { keep[a] = 1; }); }); if (rest.length) keep['/saved/'] = 1;
      var drop = [it.u].concat(it.a || []).filter(function (a) { return !keep[a]; });
      return Promise.all(drop.map(function (a) { return c.delete(a); })).then(function () { return putIdx(c, rest); }).then(function () { return rest; });
    }); }); } };
  function register() { return navigator.serviceWorker.register('/sw.js', { scope: '/' }); }
  if (canOff) caches.has(SC).then(function (h) { if (h) register().catch(function () {}); }).catch(function () {});   // keep the worker for people who saved something
  function assets() {
    var A = {}, add = function (u) { try { var x = new URL(u, location.href); if (x.origin !== location.origin) return; if (/^\/(api\/kb|api\/geo|api\/open\/log|cdn-cgi|__k)\b/.test(x.pathname) || /\.(mp4|pdf|zip)$/i.test(x.pathname)) return; A[norm(x.href)] = 1; } catch (e) {} };
    D.querySelectorAll('link[rel=stylesheet][href],script[src],link[rel=preload][href],link[rel=icon][href]').forEach(function (e) { add(e.href || e.src); });
    D.querySelectorAll('img[src]').forEach(function (e) { if (!/^data:/.test(e.src)) add(e.currentSrc || e.src); });
    try { performance.getEntriesByType('resource').forEach(function (r) { if (/^(fetch|xmlhttprequest|script|link|css|img)$/.test(r.initiatorType)) add(r.name); }); } catch (e) {}
    return Object.keys(A);
  }
  function saveThis(meta, b) {
    var lab = b.textContent; b.disabled = true; b.textContent = 'Saving…';
    var page = norm(location.href), list = assets();
    register().then(function () { return caches.open(SC); }).then(function (c) {
      var get = function (u) { return fetch(u, { credentials: 'same-origin', cache: 'no-cache' }).then(function (r) { if (r.ok && r.type === 'basic') return c.put(norm(u), r); }).catch(function () {}); };
      return fetch(location.pathname + location.search, { credentials: 'same-origin', cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('page'); return c.put(page, r); })
        .then(function () { return Promise.all(list.concat(['/saved/']).map(get)); })
        .then(function () { return idx(c); }).then(function (L) {
          L = L.filter(function (x) { return x.u !== page; });
          L.unshift({ u: page, t: meta.title, k: meta.kind, s: meta.sub || '', at: new Date().toISOString(), a: list });
          return putIdx(c, L.slice(0, 60));
        });
    }).then(function () {
      b.disabled = false; b.textContent = 'Saved for offline ✓'; b.setAttribute('aria-pressed', 'true');
      var m = b.parentNode.querySelector('.kx-offm'); if (m) m.innerHTML = 'Saved on this device. <a href="/saved/">Your saved pages</a>';
      if (window.kbEvent) kbEvent('save_offline', { label: meta.kind });
    }).catch(function () {
      b.disabled = false; b.textContent = lab;
      var m = b.parentNode.querySelector('.kx-offm'); if (m) m.textContent = 'Could not save. Your browser may block offline storage (private window or storage full).';
    });
  }
  // the button appears only once /sw.js is published (it is held back while the Pages file limit is fixed)
  var swOk = null;
  function swReady() { return swOk || (swOk = fetch('/sw.js', { method: 'HEAD', cache: 'no-store' }).then(function (r) { return r.ok && /javascript/.test(r.headers.get('content-type') || ''); }).catch(function () { return false; })); }
  function offButton(meta, host) {
    if (!canOff || !host) return null;
    var b = btn('Save offline'); b.hidden = true; swReady().then(function (ok) { b.hidden = !ok; }); b.setAttribute('data-ev', 'save_offline_click'); b.setAttribute('aria-pressed', 'false');
    b.title = 'Keep a copy on this device to read without a connection';
    host.appendChild(b);
    var m = D.createElement('span'); m.className = 'kx-offm'; m.setAttribute('role', 'status'); host.appendChild(m);
    var page = norm(location.href);
    window.kbSaved.list().then(function (L) { var it = L.filter(function (x) { return x.u === page; })[0]; if (it) { b.textContent = 'Update offline copy'; m.innerHTML = 'Saved on ' + esc(new Date(it.at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })) + '. <a href="/saved/">Your saved pages</a>'; } });
    b.addEventListener('click', function () { saveThis(meta, b); });
    return b;
  }
  // offline copy shown: say so, with the date it was saved
  if (canOff && navigator.onLine === false && path !== '/saved/') window.kbSaved.list().then(function (L) {
    var it = L.filter(function (x) { return x.u === norm(location.href); })[0]; if (!it) return;
    var bar = D.createElement('div'); bar.className = 'kx-offbar'; bar.setAttribute('role', 'status');
    bar.textContent = 'You are offline. This is the copy saved on ' + new Date(it.at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) + '; numbers may have changed since.';
    D.body.insertBefore(bar, D.body.firstChild);
  });
  // guides: a save button under the introduction
  if (/^\/guides\/[^/]+\/?$/.test(path)) {
    var gl = D.querySelector('.phero .wrap');
    if (gl) { var row = D.createElement('div'); row.className = 'kx-off'; row.hidden = true; gl.appendChild(row); swReady().then(function (ok) { row.hidden = !ok; }); offButton({ title: ((D.querySelector('h1') || {}).textContent || D.title).trim(), kind: 'guide' }, row); if (!row.firstChild) row.remove(); }
  }

  /* ---------- project page: share, save offline, print scorecard ---------- */
  var pfRoot = D.getElementById('pf');
  if (pfRoot && /^\/p\//.test(path)) {
    var wire = function () {
      var pr = D.getElementById('pf-print'); if (!pr || D.querySelector('.kx-pact')) return;
      pr.textContent = 'Full dossier (PDF)';
      var id = ((D.querySelector('.pf-id') || {}).textContent || '').trim(); if (!id) return;
      var row = D.createElement('div'); row.className = 'pf-act kx-pact'; pr.parentNode.parentNode.insertBefore(row, pr.parentNode.nextSibling);
      var pb = btn('Print or save as PDF'); pb.setAttribute('data-ev', 'print_scorecard'); pb.title = 'A one or two page scorecard with the six checks, sources, dates and a QR code'; row.appendChild(pb);
      pb.addEventListener('click', function () { printCard(pb); });
      var sb = btn('Share'); sb.setAttribute('data-ev', 'share_project'); row.appendChild(sb);
      sb.addEventListener('click', function () {
        var f = facts(), sc = D.querySelectorAll('.pf-sc .n b');
        var txt = id + ' · ' + (f.Market || '') + (f.Country ? ', ' + f.Country : '') + ' · ' + (((D.querySelector('.pf-tier') || {}).textContent) || '').trim() + ' · ' + (sc[0] ? sc[0].textContent : '?') + ' of 6 buyer checks published, ' + (sc[1] ? sc[1].textContent : '?') + ' confirmed (Kolaboro, anonymous project file)';
        share({ kind: 'project', heading: 'Share ' + id, title: 'Kolaboro project file ' + id, text: txt, url: 'https://kolaboro.com/p/' + encodeURIComponent(id) + '/' }, sb);
      });
      offButton({ title: id + ': ' + ((D.querySelector('#pf h1') || {}).textContent || '').trim(), kind: 'project', sub: (facts().Market || '') }, row);
    };
    var facts = function () { var o = {}; D.querySelectorAll('.pf-facts > div').forEach(function (d) { var t = d.querySelector('dt'), v = d.querySelector('dd'); if (t && v) o[t.textContent.trim()] = v.textContent.trim(); }); return o; };
    new MutationObserver(wire).observe(pfRoot, { childList: true, subtree: false }); wire();
  }
  var QR = { src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', sri: 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU' };
  function qrLib() {
    if (window.QRCode) return Promise.resolve(window.QRCode);
    return new Promise(function (ok, no) { var s = D.createElement('script'); s.src = QR.src; s.integrity = QR.sri; s.crossOrigin = 'anonymous'; s.onload = function () { window.QRCode ? ok(window.QRCode) : no(); }; s.onerror = no; D.head.appendChild(s); setTimeout(no, 3500); });
  }
  function printCard(b) {
    var id = ((D.querySelector('.pf-id') || {}).textContent || '').trim(), url = 'https://kolaboro.com/p/' + encodeURIComponent(id) + '/';
    var f = {}; D.querySelectorAll('.pf-facts > div').forEach(function (d) { var t = d.querySelector('dt'), v = d.querySelector('dd'); if (t && v) f[t.textContent.trim()] = v.textContent.trim(); });
    var sc = D.querySelectorAll('.pf-sc .n b'), tier = ((D.querySelector('.pf-tier') || {}).textContent || '').trim();
    var rows = [].map.call(D.querySelectorAll('.pf-checks .pf-row:not(.h)'), function (r) {
      var nm = r.querySelector('.t b'), dt = r.querySelector('.t small'), pub = r.querySelector('.pf-pub'), lv = r.querySelector('.lv');
      var pubT = pub ? pub.textContent.replace(/^[✓~✗]\s*/, '').trim() : '';
      return '<tr><td><b>' + esc(nm && nm.textContent) + '</b><small>' + esc(dt && dt.textContent) + '</small></td><td>' + esc(pubT) + '</td><td><b>' + esc(lv && lv.textContent) + '</b><small>' + esc(lv && lv.getAttribute('title')) + '</small></td></tr>';
    }).join('');
    var calls = [].map.call(D.querySelectorAll('#pf .pf-call'), function (p) { return '<li>' + esc(p.textContent.replace(/\s*Check registers yourself\s*$/, '').trim()) + '</li>'; }).join('');
    var cl = D.querySelector('.pf-claims'), fresh = D.querySelector('.pf-fresh'), fp = D.querySelector('.pf-fp code'), hd = D.querySelectorAll('.pf-phead span');
    var updated = hd[1] ? ((hd[1].textContent.match(/(\d{4}-\d{2}-\d{2})\s*$/) || [])[1] || '') : '';
    var now = new Date(), today = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
    var h = '<div class="kx-sc-h"><div><b>Kolaboro project scorecard</b><h1>' + esc(id) + '</h1><p>' + esc([f.Region, f.Market, f.Country].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(', ')) + (f.Stage ? ' · ' + esc(f.Stage) : '') + (f['Price band'] ? ' · ' + esc(f['Price band']) : '') + '</p></div>' +
      '<div class="kx-sc-q"><img alt="QR code linking to ' + esc(url) + '" hidden><span>' + esc(url) + '</span></div></div>' +
      '<div class="kx-sc-s"><div><b>' + esc(sc[0] ? sc[0].textContent : '?') + '<i>/6</i></b><span>published by the developer</span></div><div><b>' + esc(sc[1] ? sc[1].textContent : '?') + '<i>/6</i></b><span>confirmed by a registry or independent source</span></div><div><b class="t">' + esc(tier) + '</b><span>score tier</span></div></div>' +
      '<table class="kx-sc-t"><thead><tr><th>Check</th><th>Developer publishes</th><th>Verification level and source</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (cl ? '<p class="kx-sc-p"><b>Developer claims tested:</b> ' + esc(cl.getAttribute('aria-label')) + '.</p>' : '') +
      (calls ? '<ul class="kx-sc-c">' + calls + '</ul>' : '') +
      (fp ? '<p class="kx-sc-p"><b>Evidence fingerprint (SHA-256 of the developer page as read):</b> <code>' + esc(fp.textContent) + '</code></p>' : '') +
      '<p class="kx-sc-d"><b>Dates:</b> ' + esc(fresh ? fresh.textContent.replace(/^⚠\s*/, '').replace(/\. Our agent.*$/, '.') : '') + ' Database updated ' + esc(updated || 'date not stated') + '. Printed ' + today + '.</p>' +
      '<p class="kx-sc-f">Sources: developer claims come from the developer\'s own pages and listings; verification levels come from official registers, regulators, courts, stock-exchange filings and major newspapers. The project stays anonymous until a verification is finished and the developer has had time to reply. A published document is not proof that it is genuine. This scorecard is information, not legal, tax or financial advice. Method: kolaboro.com/how-we-score. Live version: ' + esc(url) + '</p>';
    var box = D.getElementById('kb-sc'); if (!box) { box = D.createElement('section'); box.id = 'kb-sc'; box.setAttribute('aria-hidden', 'true'); (D.getElementById('main') || D.body).appendChild(box); }
    box.innerHTML = h;
    var go = function () { H.classList.add('kb-print-sc'); var off = function () { H.classList.remove('kb-print-sc'); removeEventListener('afterprint', off); }; addEventListener('afterprint', off); try { window.print(); } catch (e) {} };
    b.disabled = true;
    qrLib().then(function (Q) { var t = D.createElement('div'); new Q(t, { text: url, width: 220, height: 220, correctLevel: Q.CorrectLevel.M }); var cv = t.querySelector('canvas'), im = box.querySelector('.kx-sc-q img'); if (cv && im) { im.src = cv.toDataURL('image/png'); im.hidden = false; return new Promise(function (r) { if (im.complete) r(); else { im.onload = r; im.onerror = r; } }); } })
      .catch(function () {}).then(function () { b.disabled = false; go(); if (window.kbEvent) kbEvent('print_scorecard'); });
  }
})();
