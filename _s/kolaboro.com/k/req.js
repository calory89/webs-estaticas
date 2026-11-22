/* Kolaboro service request form (n34r, 21 Nov 2026).
   Renders into <div id="kreq"> on /book/ and /<lang>/pricing/. Strings: /data/req-i18n.json (8 languages, Arabic RTL from the page).
   Sends to the insert-only RPC kolaboro_request_submit (anon can insert, never read). Spam: honeypot, minimum fill time, rate limits in the RPC.
   Prefill: ?p=<project slug> ?project=<name> ?url=<link> ?s=check|visit|monitoring|handover|add ?c=<country>. Payment is never taken here.
   n36e (22 Nov 2026): ?s=add is the free "add and check this project" request for a project not in the database (linked from /check/). */
(function () {
  var box = document.getElementById('kreq'); if (!box || box.getAttribute('data-on')) return; box.setAttribute('data-on', '1');
  var RPC = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_request_submit';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var LANGS = ['en', 'es', 'fr', 'de', 'nl', 'ru', 'zh', 'ar'], SV = ['check', 'visit', 'monitoring', 'handover'], ADD = false;
  var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase(); if (LANGS.indexOf(lang) < 0) lang = 'en';
  var Q = new URLSearchParams(location.search), t0 = Date.now(), T = null, ALL = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pre() { return lang === 'en' ? '' : '/' + lang; }
  function nice(slug) { return String(slug || '').replace(/-/g, ' ').replace(/\b([a-z])/g, function (m) { return m.toUpperCase(); }); }
  var css = document.createElement('style');
  css.textContent = '.kq{border:1px solid var(--line,#E2E0D8);border-radius:18px;background:var(--card,#fff);padding:clamp(16px,3vw,28px);max-width:760px;scroll-margin-top:90px}' +
    '.kq h2{margin:0 0 6px;font-size:clamp(1.3rem,2.6vw,1.7rem)}.kq .kq-in{margin:0 0 14px;color:var(--muted,#5E6B76)}' +
    '.kq-g{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}.kq-f{display:flex;flex-direction:column;gap:4px;min-width:0}.kq-w{grid-column:1/-1}' +
    '.kq label,.kq legend{font-weight:700;font-size:.92rem}.kq label small,.kq legend small{font-weight:500;color:var(--muted,#5E6B76)}' +
    '.kq input[type=text],.kq input[type=email],.kq input[type=tel],.kq select,.kq textarea{font:inherit;width:100%;min-height:46px;padding:10px 12px;border:1px solid var(--field-line,#C9CDD2);border-radius:12px;background:var(--paper,#fff);color:var(--ink,#17212B)}' +
    '.kq textarea{min-height:96px;resize:vertical}.kq [aria-invalid=true]{border-color:#C9341A;box-shadow:0 0 0 1px #C9341A}' +
    '.kq .kq-h{font-size:.84rem;color:var(--muted,#5E6B76);margin:0}.kq .kq-e{font-size:.86rem;color:#C9341A;margin:0;min-height:0}.kq .kq-e:empty{display:none}' +
    '.kq fieldset{border:0;padding:0;margin:0;grid-column:1/-1}.kq-sv{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px}' +
    '.kq-sv label{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line,#E2E0D8);border-radius:14px;padding:10px 12px;cursor:pointer;font-weight:700;min-height:46px}' +
    '.kq-sv label span{display:block;font-weight:500;font-size:.82rem;color:var(--muted,#5E6B76);margin-top:2px}.kq-sv input{width:20px;height:20px;flex:none;margin-top:2px;accent-color:var(--hivis,#FF5B14)}' +
    '.kq-sv label:has(input:checked){border-color:var(--hivis,#FF5B14);box-shadow:0 0 0 1px var(--hivis,#FF5B14)}' +
    '.kq-c{display:flex;gap:10px;align-items:flex-start;font-weight:500!important;font-size:.92rem!important}.kq-c input{width:22px;height:22px;flex:none;margin-top:1px;accent-color:var(--hivis,#FF5B14)}' +
    '.kq-hp{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;margin:-1px!important;padding:0!important;border:0!important}.kq{position:relative}' +
    '.kq .kq-pay,.kq .kq-pv{font-size:.86rem;color:var(--muted,#5E6B76);margin:10px 0 0}.kq .kq-pv a{color:inherit}' +
    '.kq-b{margin-top:14px;min-height:48px;min-width:200px}.kq-b[disabled]{opacity:.65;cursor:progress}' +
    '.kq-sum{background:#FDE2D6;color:#7A1D0B;border-radius:12px;padding:10px 12px;margin:0 0 12px}.kq-sum:empty{display:none}' +
    '.kq-ok h2{display:flex;gap:10px;align-items:center}.kq-ok h2::before{content:"";width:14px;height:14px;border-radius:50%;background:var(--ok,#1E9E6A);flex:none}' +
    '.kq-ref{display:inline-block;font:700 1.25rem/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;background:var(--paper,#F6F5F0);border:1px dashed var(--line,#C9CDD2);border-radius:10px;padding:8px 12px;margin:6px 0 10px;user-select:all}' +
    '@media (max-width:640px){.kq-g,.kq-sv{grid-template-columns:1fr}.kq-b{width:100%}}';
  document.head.appendChild(css);
  function fallback() { box.innerHTML = '<div class="kq"><p>' + esc('Write to us at') + ' <a href="mailto:carlos@kolaboro.com">carlos@kolaboro.com</a></p></div>'; }
  // links like <a href="#kreq" data-kq-s="monitoring"> pick the service, scroll to the form and focus its first field
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href$="#kreq"]'); if (!a || (a.pathname && a.pathname !== location.pathname)) return;
    var s = a.getAttribute('data-kq-s'), r = s && box.querySelector('input[name=service][value="' + s + '"]'); if (r) r.checked = true;
    e.preventDefault(); box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var n = document.getElementById('kq-name'); if (n) setTimeout(function () { n.focus({ preventScroll: true }); }, 400);
  });
  fetch('/data/req-i18n.json?v=n36e-1').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { ALL = d; T = d[lang] || d.en; render(); }).catch(fallback);

  function field(id, label, type, extra, opt, help) {
    return '<div class="kq-f' + (extra && extra.wide ? ' kq-w' : '') + '"><label for="kq-' + id + '">' + esc(label) + (opt ? ' <small>(' + esc(T.opt) + ')</small>' : '') + '</label>' +
      (type === 'textarea' ? '<textarea id="kq-' + id + '" name="' + id + '"' + (extra.ph ? ' placeholder="' + esc(extra.ph) + '"' : '') + ' maxlength="3000" aria-describedby="kq-' + id + '-e"></textarea>'
        : '<input id="kq-' + id + '" name="' + id + '" type="' + type + '"' + (extra.ac ? ' autocomplete="' + extra.ac + '"' : '') + (extra.ph ? ' placeholder="' + esc(extra.ph) + '"' : '') + (extra.max ? ' maxlength="' + extra.max + '"' : '') + (opt ? '' : ' required aria-required="true"') + (extra.im ? ' inputmode="' + extra.im + '"' : '') + ' aria-describedby="' + (help ? 'kq-' + id + '-h ' : '') + 'kq-' + id + '-e" value="' + esc(extra.v || '') + '">') +
      (help ? '<p class="kq-h" id="kq-' + id + '-h">' + esc(help) + '</p>' : '') + '<p class="kq-e" id="kq-' + id + '-e" aria-live="polite"></p></div>';
  }
  function render() {
    var slug = (Q.get('p') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
    var proj = Q.get('project') || Q.get('url') || (slug ? nice(slug) : '');
    var sv = Q.get('s'); ADD = sv === 'add' && !!T.s_add; if (ADD && SV.indexOf('add') < 0) SV = SV.concat('add'); if (SV.indexOf(sv) < 0) sv = SV.indexOf((location.hash || '').slice(1)) >= 0 ? location.hash.slice(1) : 'check';
    var langOpts = LANGS.map(function (l) { return '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + esc(ALL.langs[l]) + '</option>'; }).join('');
    box.innerHTML = '<form class="kq" id="kq-form" novalidate data-slug="' + esc(slug) + '"><h2 id="kq-t">' + esc(ADD ? T.title_add : T.title) + '</h2><p class="kq-in">' + esc(ADD ? T.intro_add : T.intro) + '</p>' +
      '<div class="kq-sum" id="kq-sum" role="alert" tabindex="-1"></div>' +
      '<div class="kq-g">' +
      '<fieldset><legend>' + esc(T.service) + '</legend><div class="kq-sv">' + SV.map(function (s) { return '<label><input type="radio" name="service" value="' + s + '"' + (s === sv ? ' checked' : '') + '><div>' + esc(T['s_' + s]) + '<span>' + esc(T['s_' + s + '_p']) + '</span></div></label>'; }).join('') + '</div></fieldset>' +
      field('name', T.name, 'text', { ac: 'name', max: 120 }) +
      field('email', T.email, 'email', { ac: 'email', max: 200, im: 'email' }) +
      field('phone', T.phone, 'tel', { ac: 'tel', max: 40, im: 'tel' }, true, T.phone_h) +
      field('country', T.country, 'text', { ac: 'off', max: 80, ph: T.country_ph, v: Q.get('c') || '' }, true) +
      field('project', T.project, 'text', { ac: 'off', max: 200, ph: T.project_ph, v: proj, wide: true }) +
      '<div class="kq-f"><label for="kq-lang">' + esc(T.lang) + '</label><select id="kq-lang" name="lang">' + langOpts + '</select></div>' +
      field('message', T.message, 'textarea', { ph: T.message_ph, wide: true }, true) +
      '<div class="kq-hp" aria-hidden="true"><label for="kq-website">Website</label><input id="kq-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
      '<div class="kq-f kq-w"><label class="kq-c" for="kq-consent"><input id="kq-consent" name="consent" type="checkbox" required aria-required="true" aria-describedby="kq-consent-e"><span>' + esc(T.consent) + '</span></label><p class="kq-e" id="kq-consent-e" aria-live="polite"></p></div>' +
      '</div>' +
      '<p class="kq-pay" id="kq-pay">' + esc(sv === 'add' ? T.pay_add : T.pay) + '</p>' +
      '<button class="btn btn-hi kq-b" type="submit" id="kq-b">' + esc(T.submit) + '</button>' +
      '<p class="kq-pv">' + esc(T.privacy) + ' <a href="/legal/privacy/">' + esc(T.privacy_link) + '</a></p></form>';
    document.getElementById('kq-form').addEventListener('submit', submit);
    if (ADD) document.getElementById('kq-form').addEventListener('change', function (e) { if (e.target.name === 'service') document.getElementById('kq-pay').textContent = e.target.value === 'add' ? T.pay_add : T.pay; });
    if (location.hash === '#kreq' || location.hash === '#request') setTimeout(function () { box.scrollIntoView({ block: 'start' }); }, 50);
  }
  function setErr(id, msg) { var i = document.getElementById('kq-' + id), e = document.getElementById('kq-' + id + '-e'); if (i) { if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid'); } if (e) e.textContent = msg || ''; return !!msg; }
  function submit(ev) {
    ev.preventDefault();
    var f = ev.target, E = f.elements, v = function (n) { return (E[n] && E[n].value || '').trim(); }, bad = [];
    var svc = (f.querySelector('input[name=service]:checked') || {}).value || 'check';
    if (setErr('name', v('name') ? '' : T.e_name)) bad.push('name');
    if (setErr('email', /^[^@\s<>"]+@[^@\s<>"]+\.[a-z]{2,}$/i.test(v('email')) ? '' : T.e_email)) bad.push('email');
    if (setErr('phone', !v('phone') || /^\+?[0-9 ()./-]{6,40}$/.test(v('phone')) ? '' : T.e_phone)) bad.push('phone');
    if (setErr('project', v('project') || v('message') || f.getAttribute('data-slug') ? '' : T.e_project)) bad.push('project');
    if (setErr('consent', E['consent'].checked ? '' : T.e_consent)) bad.push('consent');
    var sum = document.getElementById('kq-sum');
    if (bad.length) { sum.textContent = T.e_sum; var first = document.getElementById('kq-' + bad[0]); if (first) first.focus(); return; }
    sum.textContent = '';
    var b = document.getElementById('kq-b'); b.disabled = true; b.textContent = T.sending;
    var p = { name: v('name'), email: v('email'), phone: v('phone'), country: v('country'), project: v('project'), project_slug: f.getAttribute('data-slug') || '', service: svc, lang: E['lang'].value, message: v('message'), consent: true, website: E['website'].value, t: Date.now() - t0, page: location.pathname + (location.search ? location.search.slice(0, 120) : '') };
    fetch(RPC, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p: p }) })
      .then(function (r) { return r.json().catch(function () { return { error: 'http' }; }).then(function (d) { if (!r.ok && !d.error) d = { error: 'http' }; return d; }); }, function () { return { error: 'net' }; })
      .then(function (d) {
        if (d && d.ok && d.ref) return done(d.ref, p);
        b.disabled = false; b.textContent = T.submit;
        var e = d && d.error, map = { name: 'name', email: 'email', phone: 'phone', project: 'project', consent: 'consent' };
        if (map[e]) { setErr(map[e], T['e_' + e]); sum.textContent = T.e_sum; document.getElementById('kq-' + map[e]).focus(); return; }
        sum.textContent = e === 'busy' ? T.e_busy : e === 'fast' ? T.e_fast : e === 'net' ? T.e_net : T.e_gen; sum.focus();
      });
  }
  function done(ref, p) {
    try { if (window.gtag) gtag('event', 'request_submit', { service: p.service, lang: p.lang }); } catch (e) {}
    box.innerHTML = '<div class="kq kq-ok" role="status"><h2 id="kq-done" tabindex="-1">' + esc(T.done_title) + '</h2><p>' + esc(p.service === 'add' ? T.done_add : T.done) + '</p><p style="margin:0">' + esc(T.ref) + ':</p><div class="kq-ref">' + esc(ref) + '</div><p class="kq-h">' + esc(T.done_mail) + '</p></div>';
    var h = document.getElementById('kq-done'); if (h) h.focus();
  }
})();
