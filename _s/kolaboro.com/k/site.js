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
  }


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
    function upd() { m.classList.toggle('show', scrollY > 520 && !heroVisible && !formVisible && !heroForm); }
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  // quick "check a project" boxes -> /check?q=
  document.querySelectorAll('form[data-check]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = (f.q.value || '').trim();
      if (!q) { f.q.focus(); return; }
      ev('check_project', { q: q.slice(0, 80) });
      if (/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(q)) { location.href = '/check?url=' + encodeURIComponent(q) + '#analyze'; return; }
      location.href = '/check?q=' + encodeURIComponent(q);
    });
  });

  // lead forms
  var URL_ = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var COPY = {
    buyer: ['Where are you buying?', 'e.g. Canggu, Bali', 'Project name or link', 'e.g. the developer or project website', 'What stage are you at, and what worries you most?'],
    agent: ['Which city do you live in?', 'e.g. Ubud, Bali', 'LinkedIn or website (optional)', 'Anything that shows your work', 'What do you do today, and why would you be a great agent?'],
    developer: ['Where is your project?', 'e.g. Uluwatu, Bali', 'Project name and website', 'So we can start the review', 'Tell us about the project you would like verified.'],
    investor: ['Where are you based?', 'e.g. San Francisco', 'Fund or company (optional)', 'Your fund, company or angel profile', 'What would you like to know?']
  };
  var ES = (document.documentElement.lang || '').indexOf('es') === 0;
  if (ES) COPY = {
    buyer: ['¿Dónde compras?', 'ej. Canggu, Bali', 'Nombre o enlace del proyecto', 'ej. la web del promotor o del proyecto', '¿En qué punto estás y qué te preocupa más?'],
    agent: ['¿En qué ciudad vives?', 'ej. Ubud, Bali', 'LinkedIn o web (opcional)', 'Algo que muestre tu trabajo', '¿A qué te dedicas y por qué serías un gran agente?'],
    developer: ['¿Dónde está tu proyecto?', 'ej. Uluwatu, Bali', 'Nombre y web del proyecto', 'Para empezar la revisión', 'Cuéntanos el proyecto que quieres verificar.'],
    investor: COPY.investor };
  var MSG = ES ? { name: 'Añade tu nombre.', email: 'Añade un email válido.', place: 'Añade una ciudad o lugar.', msg: 'Añade un mensaje corto para saber cómo ayudarte.', check: 'Revisa los campos marcados.', consent: 'Marca la casilla para que podamos responderte por email.', bot: 'Algo ha fallado. Inténtalo en unos segundos.', dup: 'Ya tenemos una solicitud con este email. Te responderemos pronto.', fields: 'Revisa los campos e inténtalo de nuevo.', net: 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.', sending: 'Enviando…', saved: 'Borrador guardado en este dispositivo.' }
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
      if (!ok1) return; ev('form_step1', { role: role() }); openStep2(true);
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
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { m.textContent = MSG.email; m.style.color = 'var(--hivis-ink)'; return; }
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
// real-user web vitals (block F): half of page views, loaded after the load event, see /status#st-vit
(function(){if(Math.random()>=0.5)return;function v(){setTimeout(function(){var s=document.createElement('script');s.src='/k/vitals.js?v=604551822c';s.async=1;document.head.appendChild(s)},1)}if(document.readyState==='complete')v();else addEventListener('load',v,{once:true})})();
// inline-handler free (strict CSP): forms marked data-nosubmit never navigate, buttons marked data-print open the print dialog
document.addEventListener('submit',function(e){if(e.target.matches&&e.target.matches('form[data-nosubmit]'))e.preventDefault()},true);
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-print]');if(b){e.preventDefault();window.print()}});
