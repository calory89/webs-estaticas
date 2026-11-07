// Kolaboro X-ray: shared core for the in-page panel (content.js) and the toolbar popup (popup.js).
// Privacy model: the page address and text are hashed on this device (SHA-256). Only the first 4 hex characters of each hash go to
// kolaboro.com (/api/x/j/xr), which answers with every record in those buckets; the full comparison is made here. The page address
// itself is sent only when the person presses "Run the X-ray". No cookies, no identifiers, no analytics, nothing stored.
var KX = (function () {
  'use strict';
  var ORIGIN = 'https://kolaboro.com';
  var LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
  function pickLang(l) { l = String(l || 'en').toLowerCase().slice(0, 2); return LANGS.indexOf(l) >= 0 ? l : 'en'; }
  function uiLang() { try { return pickLang(chrome.i18n.getUILanguage()); } catch (e) { return pickLang(navigator.language); } }
  function t(lang, k, v) {
    var s = (KX_T[lang] && KX_T[lang][k]) || KX_T.en[k] || k;
    return v ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s;
  }
  var pre = function (lang) { return lang === 'en' ? '' : '/' + lang; };
  var projectUrl = function (lang, s) { return ORIGIN + pre(lang) + '/projects/' + encodeURIComponent(s) + '/'; };
  var devUrl = function (lang, s) { return ORIGIN + pre(lang) + '/developers/' + encodeURIComponent(s) + '/'; };
  var checkUrl = function (lang, u) { return ORIGIN + pre(lang) + '/check/?url=' + encodeURIComponent(u); };

  // ------------------------------------------------------------------ keys (must match _worker.js/kbx_j.js xrIndex)
  function norm(s) { return String(s || '').normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  var LOCALE = /^\/(en|ar|id|th|es|pt|tr|ru|zh|de|fr)(?=\/|$)/;
  function urlKey(u) {
    var x; try { x = new URL(u); } catch (e) { return null; }
    var host = x.hostname.toLowerCase().replace(/^www\./, '');
    var path = x.pathname.toLowerCase().replace(/\/+$/, '').replace(LOCALE, '');
    return path.length >= 8 ? host + path : null;
  }
  var SLD = ['co', 'com', 'net', 'org', 'or', 'ac', 'go', 'web', 'my', 'biz', 'gov', 'edu', 'ne', 'in', 'sch', 'ltd', 'plc', 'gen', 'firm'];
  function regDomain(h) {
    var p = String(h).toLowerCase().replace(/^www\./, '').split('.');
    if (p.length <= 2) return p.join('.');
    return (SLD.indexOf(p[p.length - 2]) >= 0 && p[p.length - 1].length === 2 ? p.slice(-3) : p.slice(-2)).join('.');
  }
  function keysFor(pageUrl, texts) {
    var out = [], seen = {};
    function add(k, s) { var kk = k + '|' + s; if (!seen[kk]) { seen[kk] = 1; out.push({ k: k, s: kk }); } }
    var uk = urlKey(pageUrl); if (uk) add('u', uk);
    try { var h = new URL(pageUrl).hostname; if (h.indexOf('.') > 0) add('d', regDomain(h)); } catch (e) {}
    texts.forEach(function (tx) {
      var w = norm(tx).split(' ').filter(Boolean).slice(0, 32);
      for (var i = 0; i < w.length; i++) for (var n = 1; n <= 8 && i + n <= w.length; n++) {
        var s = w.slice(i, i + n).join(' ');
        if (n >= 2 && s.length >= 8) add('n', s);
        if (n <= 5 && s.length >= 6) add('v', s);
      }
    });
    return out.slice(0, 700);
  }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function h16(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) { return hex(b).slice(0, 16); }); }
  function hashAll(keys) { return Promise.all(keys.map(function (x) { return h16(x.s).then(function (h) { x.h = h; return x; }); })); }
  function prefixes(ks) { var p = {}; ks.forEach(function (x) { p[x.h.slice(0, 4)] = 1; }); return Object.keys(p).sort().slice(0, 500); }

  // ------------------------------------------------------------------ resolve the answer on the device
  function resolve(res, ks, country) {
    if (!res || !res.hits) return null;
    var mine = {}; ks.forEach(function (x) { mine[x.h] = x.k; });
    var R = res.refs || {}, by = { u: [], d: [], n: [], v: [] };
    res.hits.forEach(function (x) { if (mine[x.h] === x.k && R[x.r] && by[x.k]) by[x.k].push(R[x.r]); });
    var okC = function (r) { return !country || !r.co || (Array.isArray(r.co) ? r.co.indexOf(country) >= 0 : r.co === country); };
    var uniq = function (a) { var s = {}, o = []; a.forEach(function (r) { var id = r.t + ':' + (r.s || r.np); if (!s[id]) { s[id] = 1; o.push(r); } }); return o; };
    var m = { project: null, list: null, total: 0, dev: null, how: null };
    var u = by.u.filter(function (r) { return r.t === 'p'; });
    if (u.length) { m.project = u[0]; m.how = 'how_u'; }
    var dP = uniq(by.d.filter(function (r) { return r.t === 'p'; })), dV = uniq(by.d.filter(function (r) { return r.t === 'v'; })), g = by.d.filter(function (r) { return r.t === 'g'; })[0];
    if (!m.project && dP.length === 1) { m.project = dP[0]; m.how = 'how_d1'; }
    if (!m.project) {
      var names = uniq(by.n.filter(function (r) { return r.t === 'p' && okC(r); }));
      if (g) { var inG = names.filter(function (r) { return g.ps.indexOf('p:' + r.s) >= 0; }); if (inG.length) names = inG; }
      // a longer name inside the page beats a shorter one it contains (e.g. "Creek Waters 2" over "Creek Waters")
      if (names.length > 1) { var L = names.map(function (r) { return norm(r.n).length; }), mx = Math.max.apply(null, L); var top = names.filter(function (r, i) { return L[i] === mx; }); if (top.length === 1) names = top; }
      if (names.length === 1) { m.project = names[0]; m.how = 'how_n'; }
      else if (names.length > 1) { m.list = names.slice(0, 4); m.total = names.length; m.how = 'how_nn'; }
    }
    if (!m.project && !m.list && g) { m.list = g.ps.map(function (r) { return R[r]; }).filter(Boolean); m.total = g.np; m.how = 'how_g'; }
    if (m.project && m.project.dvs) m.dev = R['v:' + m.project.dvs] || null;
    if (!m.dev && dV.length === 1) { m.dev = dV[0]; m.devHow = 'how_dv'; }
    if (!m.dev && g && g.dvs) m.dev = R['v:' + g.dvs] || null;
    if (!m.dev && !m.project) { var vs = uniq(by.v.filter(function (r) { return r.t === 'v' && okC(r); })); if (vs.length === 1) { m.dev = vs[0]; m.devHow = 'how_v'; } }
    return m.project || m.list || m.dev ? m : null;
  }
  // one request: the background worker fetches /api/x/j/xr (content scripts) or the popup fetches it itself
  function lookup(pageUrl, texts, country, fetcher) {
    return hashAll(keysFor(pageUrl, texts)).then(function (ks) {
      return fetcher(prefixes(ks)).then(function (res) { return { res: res, m: resolve(res, ks, country) }; });
    });
  }
  function fetchXr(p) {
    return fetch(ORIGIN + '/api/x/j/xr?p=' + p.join(','), { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'default' })
      .then(function (r) { return r.ok ? r.json() : null; });
  }
  // X-ray stream: Server-Sent Events from /api/kb/xray, parsed by hand (fetch, so no cookies and no referrer)
  function xray(pageUrl, lang, onEvent, signal) {
    return fetch(ORIGIN + '/api/kb/xray?u=' + encodeURIComponent(pageUrl) + '&lang=' + lang, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: signal, headers: { accept: 'text/event-stream' } })
      .then(function (r) {
        if (!r.ok || !r.body) throw new Error('http ' + r.status);
        var rd = r.body.getReader(), dec = new TextDecoder(), buf = '';
        function pump() {
          return rd.read().then(function (x) {
            if (x.done) return;
            buf += dec.decode(x.value, { stream: true });
            var i;
            while ((i = buf.indexOf('\n\n')) >= 0) {
              var block = buf.slice(0, i); buf = buf.slice(i + 2);
              var data = block.split('\n').filter(function (l) { return l.indexOf('data:') === 0; }).map(function (l) { return l.slice(5).trim(); }).join('\n');
              if (data) { try { onEvent(JSON.parse(data)); } catch (e) {} }
            }
            return pump();
          });
        }
        return pump();
      });
  }

  // ------------------------------------------------------------------ view
  function h(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'text') e.textContent = v; else if (k === 'on') { for (var ev in v) e.addEventListener(ev, v[ev]); } else e.setAttribute(k, v === true ? '' : v);
    }
    var put = function (x) { if (x == null || x === false) return; if (Array.isArray(x)) x.forEach(put); else e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); };
    for (var i = 2; i < arguments.length; i++) put(arguments[i]);
    return e;
  }
  var MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  function fdate(d, lang) {
    if (!d) return ''; var s = String(d), m, L = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-GB' : lang;
    try {
      if ((m = s.match(/^(\d{4})-Q([1-4])$/i))) return 'Q' + m[2] + ' ' + m[1];
      if ((m = s.match(/^(\d{4})-H([12])$/i))) return 'H' + m[2] + ' ' + m[1];
      if ((m = s.match(/^(\d{4})-(\d{2})$/))) return new Intl.DateTimeFormat(L, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)));
      if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])));
      if ((m = s.match(/^(\d{1,2}) ([A-Z][a-z]{2})[a-z]* (\d{4})$/)) && MON[m[2]] != null) return new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[3], MON[m[2]], +m[1])));
    } catch (e) {}
    return s;
  }
  function stage(s, lang) { return s === 'off-plan' ? t(lang, 'st_off') : s === 'under construction' ? t(lang, 'st_uc') : s === 'completed' ? t(lang, 'st_done') : s; }
  function place(r) { return [r.ar, r.mk].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(', '); }
  var LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true" width="18" height="18"><path d="M8 4v24M8 16 23 6.5M8 16l15 9.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="6" r="3.4" fill="currentColor"/><circle cx="24" cy="26" r="3.4" fill="currentColor"/><circle cx="8" cy="16" r="4.2" fill="#FF5B14"/></svg>';
  function logo() { var s = document.createElement('span'); s.className = 'lg'; s.innerHTML = LOGO; return s; }   // static markup, no page data

  var CSS =
    ':host{all:initial}' +
    '.kx{--paper:#F2F4F3;--surface:#FFFFFF;--sunken:#E8ECEA;--ink:#13222E;--ink2:#2F3E4B;--muted:#56636F;--line:rgba(19,34,46,.14);--line2:rgba(19,34,46,.26);' +
    '--brand:#FF5B14;--onbrand:#1A0A00;--sea:#155C75;--seasoft:rgba(21,92,117,.10);--ok:#0E6B47;--okbg:#E3F2EA;--warn:#7A4E00;--warnbg:#FBF0D9;--info:#1D4F7A;--infobg:#E4EEF7;' +
    'box-sizing:border-box;width:340px;max-width:calc(100vw - 24px);background:var(--surface);color:var(--ink2);border:1px solid var(--line2);border-radius:14px;' +
    'box-shadow:0 18px 48px -16px rgba(19,34,46,.45),0 2px 6px rgba(19,34,46,.12);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans","Noto Sans Arabic","PingFang SC","Microsoft YaHei",sans-serif;' +
    'font-variant-numeric:tabular-nums;overflow:hidden;text-align:start}' +
    '.kx.pop{width:100%;max-width:none;border:0;border-radius:0;box-shadow:none}' +
    '@media (prefers-color-scheme:dark){.kx{--paper:#0F1A23;--surface:#16232E;--sunken:#0F1A23;--ink:#EEF2F4;--ink2:#D3DBE0;--muted:#9AA8B3;--line:rgba(238,242,244,.12);--line2:rgba(238,242,244,.22);' +
    '--sea:#7CC4DD;--seasoft:rgba(124,196,221,.14);--ok:#7FD3AA;--okbg:rgba(127,211,170,.12);--warn:#F2C46B;--warnbg:rgba(242,196,107,.12);--info:#9CC3EA;--infobg:rgba(156,195,234,.12)}}' +
    '.kx *{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit}' +
    '.hd{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 14px;border-bottom:1px solid var(--line);background:var(--paper)}' +
    '.lg{display:inline-flex;color:var(--ink)}.bn{font-weight:750;color:var(--ink);letter-spacing:-.01em}.bx{color:var(--muted);font-size:13px}' +
    '.ib{margin-inline-start:auto;display:flex;gap:2px}.ib button{width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-size:20px;line-height:1;cursor:pointer;display:grid;place-items:center}' +
    '.ib button:hover{background:var(--seasoft);color:var(--ink)}' +
    '.bd{padding:14px;display:grid;gap:12px;max-height:min(70vh,560px);overflow:auto}.kx.pop .bd{max-height:none}' +
    '.lb{font-size:13px;color:var(--muted)}.nm{font-size:18px;font-weight:700;line-height:1.25;color:var(--ink)}' +
    'a{color:var(--sea);text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px}a:hover{text-decoration-thickness:2px}' +
    '.nm a{color:var(--ink);text-decoration-color:var(--line2)}.nm a:hover{color:var(--sea)}' +
    '.how{font-size:13px;color:var(--muted)}' +
    'dl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:14px;border-top:1px solid var(--line);padding-top:10px}dt{color:var(--muted)}dd{color:var(--ink);min-width:0;overflow-wrap:anywhere}' +
    '.nr{font-size:13px;color:var(--muted)}.sc{font-weight:650}' +
    'ul.ls{list-style:none;display:grid;gap:6px}ul.ls li{font-size:14px}ul.ls small{display:block;color:var(--muted);font-size:13px}' +
    '.lk{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:14px}' +
    '.xr{border-top:1px solid var(--line);padding-top:12px;display:grid;gap:10px}' +
    '.go{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;width:100%;border:0;border-radius:10px;background:var(--brand);color:var(--onbrand);font-weight:750;cursor:pointer;font-size:15px}' +
    '.go:hover{filter:brightness(1.06)}.go[disabled]{opacity:.55;cursor:default}' +
    '.sec2{display:flex;align-items:center;justify-content:center;min-height:40px;border:1px solid var(--line2);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:600;cursor:pointer;text-decoration:none;font-size:14px}' +
    '.note{font-size:12.5px;color:var(--muted);line-height:1.4}' +
    '.pg{height:6px;border-radius:99px;background:var(--sunken);overflow:hidden}.pg i{display:block;height:100%;background:var(--sea);border-radius:inherit;transition:width .2s}' +
    'ol.cd{list-style:none;display:grid;gap:4px;font-size:13.5px}ol.cd li{display:flex;justify-content:space-between;gap:10px;align-items:baseline;padding:3px 0;border-bottom:1px dashed var(--line)}' +
    '.bg{flex:none;font-size:12px;font-weight:650;border-radius:99px;padding:1px 8px;background:var(--sunken);color:var(--muted)}.bg.found{background:var(--okbg);color:var(--ok)}.bg.not_found,.bg.not_published{background:var(--sunken);color:var(--muted)}' +
    '.al{font-size:13.5px;background:var(--infobg);color:var(--info);border-radius:8px;padding:8px 10px}' +
    '.sk{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--sunken),var(--paper),var(--sunken));background-size:200% 100%;animation:sk 1.2s linear infinite}@keyframes sk{to{background-position:-200% 0}}' +
    '.ft{display:flex;gap:14px;padding:8px 14px;border-top:1px solid var(--line);background:var(--paper);font-size:12.5px}' +
    '.pill{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px 0 12px;border:1px solid var(--line2);border-radius:99px;background:var(--surface);color:var(--ink);font-weight:650;cursor:pointer;' +
    'box-shadow:0 10px 30px -12px rgba(19,34,46,.5);font:600 14px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    'button:focus-visible,a:focus-visible{outline:3px solid var(--sea);outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){.sk{animation:none}.pg i{transition:none}}';

  // state: { lang, url, mode:'loading'|'ready'|'notweb'|'offline', m, xr:{phase,cards,total,root,url} }
  function render(root, st, act) {
    var L = st.lang, T = function (k, v) { return t(L, k, v); };
    var box = h('div', { class: 'kx' + (st.popup ? ' pop' : ''), role: st.popup ? null : 'complementary', 'aria-label': 'Kolaboro X-ray', dir: L === 'ar' ? 'rtl' : 'ltr', lang: L });
    var hd = h('div', { class: 'hd' }, logo(), h('span', { class: 'bn', text: 'Kolaboro' }), h('span', { class: 'bx', text: 'X-ray' }));
    if (!st.popup) hd.appendChild(h('div', { class: 'ib' },
      h('button', { type: 'button', 'aria-label': T('min'), title: T('min'), text: '–', on: { click: act.minimise } }),
      h('button', { type: 'button', 'aria-label': T('hide'), title: T('hide'), text: '×', on: { click: act.close } })));
    box.appendChild(hd);
    var bd = h('div', { class: 'bd' });
    if (st.mode === 'notweb') { bd.appendChild(h('p', { class: 'al', text: T('notweb') })); box.appendChild(bd); return swap(root, box); }
    if (st.mode === 'loading') {
      bd.appendChild(h('div', { 'aria-busy': 'true', 'aria-label': T('reading') }, h('div', { class: 'sk', style: 'width:40%' }), h('div', { class: 'sk', style: 'width:85%;margin-top:10px;height:18px' }), h('div', { class: 'sk', style: 'width:70%;margin-top:10px' })));
    } else if (st.mode === 'offline') {
      bd.appendChild(h('p', { class: 'al', role: 'status', text: T('offline') }));
    } else {
      var m = st.m;
      if (m && m.project) {
        var p = m.project, rows = [];
        if (m.dev || p.dv) rows.push([T('dev'), m.dev ? h('a', { href: devUrl(L, m.dev.s), target: '_blank', rel: 'noopener', text: m.dev.n }) : p.dv]);
        if (place(p)) rows.push([T('place'), place(p)]);
        if (p.st) rows.push([T('stage'), stage(p.st, L)]);
        if (p.ho) rows.push([T('ho'), h('span', null, fdate(p.ho, L), p.ov ? h('span', { class: 'nr', style: 'display:block', text: T('ov', { m: p.ov }) }) : null)]);
        rows.push([T('checks'), p.rv && p.mx ? h('span', { class: 'sc', text: T('score', { s: p.sc, m: p.mx }) }) : h('span', { class: 'nr', text: T('nr') })]);
        if (p.ck) rows.push([T('checked'), fdate(p.ck, L)]);
        bd.appendChild(h('div', null, h('p', { class: 'lb', text: T('in') }),
          h('p', { class: 'nm' }, h('a', { href: projectUrl(L, p.s), target: '_blank', rel: 'noopener', text: p.n })),
          h('p', { class: 'how', text: T(m.how) })));
        bd.appendChild(h('dl', null, rows.map(function (r) { return [h('dt', { text: r[0] }), h('dd', null, r[1])]; })));
        bd.appendChild(h('div', { class: 'lk' }, h('a', { href: projectUrl(L, p.s), target: '_blank', rel: 'noopener', text: T('open') }),
          m.dev ? h('a', { href: devUrl(L, m.dev.s), target: '_blank', rel: 'noopener', text: T('devp') }) : null));
      } else if (m && m.list) {
        bd.appendChild(h('div', null, h('p', { class: 'lb', text: T('in') }), h('p', { class: 'how', text: T(m.how, { n: m.total }) })));
        bd.appendChild(h('ul', { class: 'ls' }, m.list.map(function (r) { return h('li', null, h('a', { href: projectUrl(L, r.s), target: '_blank', rel: 'noopener', text: r.n }), h('small', { text: [place(r), r.st ? stage(r.st, L) : ''].filter(Boolean).join('. ') })); })));
        if (m.dev) bd.appendChild(h('div', { class: 'lk' }, h('span', { class: 'how', text: T('dev') + ':' }), h('a', { href: devUrl(L, m.dev.s), target: '_blank', rel: 'noopener', text: m.dev.n })));
      } else if (m && m.dev) {
        bd.appendChild(h('div', null, h('p', { class: 'lb', text: T('in') }),
          h('p', { class: 'nm' }, h('a', { href: devUrl(L, m.dev.s), target: '_blank', rel: 'noopener', text: m.dev.n })),
          h('p', { class: 'how', text: T(m.devHow || 'how_v') + ' ' + (m.dev.np === 1 ? T('np1') : T('np', { n: m.dev.np })) })));
        bd.appendChild(h('div', { class: 'lk' }, h('a', { href: devUrl(L, m.dev.s), target: '_blank', rel: 'noopener', text: T('devp') })));
      } else {
        bd.appendChild(h('div', null, h('p', { class: 'nm', style: 'font-size:16px', text: T('none') }), h('p', { class: 'how', text: T('none_p') })));
      }
    }
    // the X-ray block
    var x = st.xr || { phase: 'idle' }, xr = h('div', { class: 'xr' });
    if (x.phase === 'idle') {
      xr.appendChild(h('button', { class: 'go', type: 'button', text: T('run'), disabled: st.mode === 'loading' ? true : null, on: { click: act.run } }));
      xr.appendChild(h('p', { class: 'note', text: T('run_p') }));
    } else {
      var done = (x.cards || []).length, tot = Math.max(x.total || 0, done);
      if (x.phase === 'run') {
        xr.appendChild(h('p', { class: 'lb', role: 'status', 'aria-live': 'polite', text: T('running', { d: done, t: tot || '…' }) }));
        var pct = tot ? Math.round(done / tot * 100) : 5;
        xr.appendChild(h('div', { class: 'pg', role: 'progressbar', 'aria-label': T('run'), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, h('i', { style: 'width:' + pct + '%' })));
      } else if (x.phase === 'done') {
        xr.appendChild(h('p', { class: 'lb', role: 'status', text: T('done', { n: done }) }));
        if (x.url) xr.appendChild(h('a', { class: 'sec2', href: x.url, target: '_blank', rel: 'noopener', text: T('openx') }));
      } else {
        xr.appendChild(h('p', { class: 'al', role: 'status', text: T('err') }));
        xr.appendChild(h('a', { class: 'sec2', href: checkUrl(L, st.url), target: '_blank', rel: 'noopener', text: T('err_l') }));
      }
      if (done) xr.appendChild(h('ol', { class: 'cd' }, x.cards.map(function (c) {
        var k = 's_' + (c.status || 'other'), lab = KX_T.en[k] ? T(k) : T('s_other');
        return h('li', null, h('span', { text: KX_T.en['c_' + c.id] ? T('c_' + c.id) : (c.title || c.id) }), h('span', { class: 'bg ' + (c.status || ''), text: lab }));
      })));
    }
    bd.appendChild(xr);
    box.appendChild(bd);
    box.appendChild(h('div', { class: 'ft' }, h('a', { href: ORIGIN + pre(L) + '/database/', target: '_blank', rel: 'noopener', text: T('db') }),
      h('a', { href: ORIGIN + '/extension/#privacy', target: '_blank', rel: 'noopener', text: T('priv') })));
    return swap(root, box);
  }
  function swap(root, el) { while (root.firstChild) root.removeChild(root.firstChild); root.appendChild(el); return el; }
  // run(st.url, st.lang, onEvent) must return a promise that settles when the stream ends: KX.xray here, a port to the worker in pages
  function runXray(st, redraw, run) {
    st.xr = { phase: 'run', cards: [], total: 0 }; redraw();
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, 90000);
    (run || xray)(st.url, st.lang, function (e) {
      if (e.type === 'plan') st.xr.total = (e.checks || []).length;
      else if (e.type === 'card' && e.card) { st.xr.cards.push({ id: e.card.id, title: e.card.title, status: e.card.status }); }
      else if (e.type === 'done') { st.xr.phase = 'done'; st.xr.url = e.url && /^https:\/\/kolaboro\.com\//.test(e.url) ? e.url : null; }
      else if (e.type === 'error') st.xr.phase = 'err';
      redraw();
    }, ctl && ctl.signal).then(function () { clearTimeout(timer); if (st.xr.phase === 'run') st.xr.phase = st.xr.cards.length ? 'done' : 'err'; redraw(); })
      .catch(function () { clearTimeout(timer); st.xr.phase = 'err'; redraw(); });
  }
  return { ORIGIN: ORIGIN, uiLang: uiLang, t: t, keysFor: keysFor, hashAll: hashAll, prefixes: prefixes, resolve: resolve, lookup: lookup, fetchXr: fetchXr,
    xray: xray, runXray: runXray, render: render, CSS: CSS, urlKey: urlKey, regDomain: regDomain, norm: norm, checkUrl: checkUrl };
})();
