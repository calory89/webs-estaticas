/* Kolaboro shared script: nav, events, sticky CTA, lead forms */
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
  }

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
    function upd() { m.classList.toggle('show', scrollY > 520 && !formVisible); }
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
