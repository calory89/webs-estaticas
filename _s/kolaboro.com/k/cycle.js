/* Kolaboro buyer cycle: one-box check (website, name or permit number) with the official-register lookup, the log-in gate,
   checks saved to the buyer's account (kolaboro_saved rows with ref CHK-xxxxxxxxxx), watch alerts, permit upload in the
   dashboard, the private report page, and the path to the existing PayPal check and case. Used by /check/, /portal/ and
   /portal/report/. Every fact shown comes from the register response or the desk review, with its link and hash. */
(function(){
  if (window.KBC7) return;
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/', AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';
  var C7 = window.KBC7 = { v: 1 };
  function $(i){ return document.getElementById(i); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function hu(u){ u = String(u == null ? '' : u).trim(); return esc(/^(https?:\/\/|mailto:)/i.test(u) || /^(\/(?!\/)|#|\?)/.test(u) ? u : '#'); }   // href values: http(s), mailto or same-site only (sec13)
  function ls(k, v){ try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function token(){ var t = null; try { t = sessionStorage.getItem('kb-token-as') || localStorage.getItem('kb-token'); } catch (e) {} return ls('kb-role') === 'agent' ? null : t; }
  function rpc(fn, body){ return fetch(SB + fn, { method: 'POST', headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function(r){ return r.json(); }); }
  function portal(action, payload){ var t = token(); if (!t) return Promise.resolve({ error: 'auth' }); return rpc('kolaboro_portal', { p_token: t, p_action: action, p_payload: payload || {} }).catch(function(){ return { error: 'network' }; }); }
  function ev(n, p){ try { if (window.gtag) gtag('event', n, p || {}); } catch (e) {} try { if (window.clarity) clarity('event', n); } catch (e) {} }
  function fmt(t){ if (!t) return ''; var d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function short(h){ h = String(h || ''); return h.length > 20 ? h.slice(0, 12) + '…' + h.slice(-6) : h; }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(t){ return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(hex); }
  function ttl(s){ return (s && (s.proj || (s.u ? String(s.u).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') : s.q))) || ''; }
  function normQ(q){ return String(q || '').trim().replace(/\s+/g, ' ').slice(0, 300); }
  function isUrl(q){ return /^(https?:\/\/)?[^\s\/]+\.[a-z]{2,}(\/\S*)?$/i.test(String(q || '').trim()); }
  C7.refFor = function(q){ var k = normQ(q).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, ''); return sha(k).then(function(h){ return 'CHK-' + h.slice(0, 10).toUpperCase(); }); };
  C7.isChk = function(ref){ return /^CHK-/i.test(String(ref || '')); };
  C7.token = token; C7.esc = esc;

  // ---------- styles (both the public site and the portal; colours fall back when a variable is missing) ----------
  var css = '.c7{--c7-hi:var(--hi,var(--hivis,#FF5B14));--c7-card:var(--card,#fff);--c7-line:var(--line,#E3E2DD);--c7-mut:var(--muted,#5E6872);--c7-ok:#0B7A55;--c7-okb:#DDEFE7;--c7-bad:#B42318;--c7-badb:#FDE2D6;--c7-warn:#865600;--c7-warnb:#FFF0C7}' +
    '.c7-box{background:var(--c7-card);border:1px solid var(--c7-line);border-radius:16px;padding:18px;margin:16px 0;color:inherit}' +
    '.c7-box h3{margin:0 0 6px;font-size:1.08rem}.c7-k{font-size:.74rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--c7-mut);margin:0 0 6px}' +
    '.c7-reg{border-top:1px solid var(--c7-line);padding:12px 0 2px}.c7-reg:first-of-type{border-top:0}.c7-reg h4{margin:0;font-size:1rem;display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '.c7-pill{display:inline-block;border-radius:999px;padding:2px 10px;font-weight:800;font-size:.78rem;background:#ECEAE3;color:#2A3541}.c7-pill.ok{background:var(--c7-okb);color:var(--c7-ok)}.c7-pill.bad{background:var(--c7-badb);color:var(--c7-bad)}.c7-pill.warn{background:var(--c7-warnb);color:var(--c7-warn)}' +
    '.c7 a,[class^=c7] a{overflow-wrap:anywhere;word-break:break-word}.c7-mut{color:var(--c7-mut);font-size:.88rem}.c7-hash{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.8rem;word-break:break-all}' +
    '.c7-fl{display:grid;grid-template-columns:minmax(110px,32%) 1fr;gap:4px 12px;margin:8px 0;font-size:.92rem}.c7-fl dt{color:var(--c7-mut)}.c7-fl dd{margin:0;overflow-wrap:anywhere}' +
    '.c7-lock{position:relative;border:1px dashed var(--c7-line);border-radius:14px;padding:14px 16px;margin-top:12px}.c7-lock ul{margin:6px 0 12px;padding-left:20px}.c7-lock li{margin:2px 0}' +
    '.c7-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.c7-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:12px;border:0;background:var(--c7-hi);color:#111;font:inherit;font-weight:800;text-decoration:none;cursor:pointer}' +
    '.c7-btn.l{background:transparent;border:1px solid currentColor;color:inherit}.c7-btn.s{min-height:36px;padding:0 12px;font-size:.88rem;border-radius:10px}.c7-btn[disabled]{opacity:.55;cursor:default}' +
    '.c7-btn:focus-visible,.c7 a:focus-visible,.c7 input:focus-visible,.c7 select:focus-visible{outline:3px solid #2563EB;outline-offset:2px}' +
    '.c7-diff{list-style:none;padding:0;margin:8px 0}.c7-diff li{padding:8px 10px;border-radius:10px;margin:6px 0;background:#F6F6F3;color:#17212B}.c7-diff li.bad{background:var(--c7-badb)}.c7-diff li.warn{background:var(--c7-warnb)}.c7-diff li.ok{background:var(--c7-okb)}' +
    '.c7-sk{height:12px;border-radius:6px;background:linear-gradient(90deg,#ECEAE3,#F6F6F3,#ECEAE3);background-size:200% 100%;animation:c7s 1.2s infinite;margin:8px 0}@keyframes c7s{to{background-position:-200% 0}}@media (prefers-reduced-motion:reduce){.c7-sk{animation:none}}' +
    '.c7-list{list-style:none;padding:0;margin:0}.c7-list>li{border-top:1px solid var(--c7-line);padding:12px 0;display:grid;gap:6px}.c7-list>li:first-child{border-top:0}.c7-list b{overflow-wrap:anywhere}' +
    '.c7-up{display:grid;gap:10px;margin-top:8px}.c7-up input[type=file],.c7-up select,.c7-up input[type=text]{min-height:44px;font:inherit;border:1px solid #D8D6CE;border-radius:12px;padding:8px 10px;background:#fff;color:#17212B;max-width:100%}' +
    '.c7-al{background:var(--c7-warnb);color:#5a3a00;border-radius:12px;padding:10px 14px;margin:8px 0;font-weight:600}.c7-err{color:var(--c7-bad);font-weight:600}' +
    '.c7-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.c7 details summary{cursor:pointer;font-weight:700}' +
    '@media (max-width:560px){.c7-fl{grid-template-columns:1fr}.c7-fl dt{margin-top:6px}.c7-row .c7-btn{flex:1 1 auto}}' +
    '#az-4 h2,.c7 h2,.c7 h3{overflow-wrap:anywhere}#az,#c7,#c7-panel{scroll-margin-top:84px}' +
    '[data-theme=dark] .c7-diff li{background:#26313c;color:#E8EDF1}[data-theme=dark] .c7-diff li.bad{background:#4a2320}[data-theme=dark] .c7-diff li.warn{background:#4a3b12}[data-theme=dark] .c7-diff li.ok{background:#173d2f}[data-theme=dark] .c7-pill{background:#2B3743;color:#E8EDF1}[data-theme=dark] .c7-al{background:#4a3b12;color:#FFE7A8}';
  function addCss(){ if ($('c7css')) return; var s = document.createElement('style'); s.id = 'c7css'; s.textContent = css; (document.head || document.documentElement).appendChild(s); }
  addCss();

  // ---------- official-register lookup ----------
  // Primary: POST /api/kb/lookup (the register-lookup service). Until it answers, inputs that one of the live registers in
  // /api/x/h/lookup understands (UK company number, Australian ABN) are looked up there; anything else says plainly that
  // automatic lookup for that input is not live yet.
  function pick(o, keys){ for (var i = 0; i < keys.length; i++) { var v = o && o[keys[i]]; if (v != null && v !== '') return v; } return null; }
  var SKIP = { found: 1, blocked: 1, parse_error: 1, register_error: 1, raw: 1, html: 1 };
  function flat(o, pre, out, depth){
    if (o == null || depth > 2) return out;
    if (Array.isArray(o)) { if (o.length && typeof o[0] !== 'object') out.push([pre, o.join(', ')]); else o.slice(0, 6).forEach(function(x, i){ flat(x, pre + ' ' + (i + 1), out, depth + 1); }); return out; }
    if (typeof o === 'object') { if (o.label != null && o.value != null && Object.keys(o).length <= 3) { out.push([String(o.label), String(o.value)]); return out; } Object.keys(o).forEach(function(k){ if (SKIP[k]) return; flat(o[k], (pre ? pre + ' · ' : '') + k.replace(/_/g, ' '), out, depth + 1); }); return out; }
    out.push([pre, String(o)]); return out;
  }
  var STATUS = { found: true, not_found: false };
  var SLABEL = { not_published: 'Not published online', unavailable: 'Register did not answer', needs_key: 'Not connected yet', error: 'Register did not answer' };
  function normItem(x){
    var res = x.result || x.record || x.data || x.entity || (x.fields && !Array.isArray(x.fields) ? x.fields : null) || {};
    var found = pick(x, ['found', 'match', 'matched']); if (found == null && typeof x.status === 'string' && x.status in STATUS) found = STATUS[x.status]; if (found == null) found = pick(res, ['found']); if (res.blocked || x.blocked) found = null;
    var qv = x.query && typeof x.query === 'object' ? x.query : null, sn = x.snapshot && typeof x.snapshot === 'object' ? x.snapshot : null;
    // name searches (GLEIF) return candidates: only treat one as the record when its name shares a real word with the search
    var m0 = null, nameSearch = res && Array.isArray(res.matches) && res.matches.length;
    if (nameSearch) { var want = words(qv && qv.value || x.query || ''), best = 0; res.matches.forEach(function(m){ if (!m || typeof m !== 'object') return; var hit = words(m.legal_name).filter(function(w){ return want.indexOf(w) >= 0; }).length; if (hit > best) { best = hit; m0 = m; } }); }
    var fields = Array.isArray(x.fields) && !res.found ? x.fields.map(function(f){ return Array.isArray(f) ? [String(f[0]), String(f[1])] : [String(f.label || f.name || f.key || ''), String(f.value == null ? '' : f.value)]; }) : flat(res, '', [], 0);
    fields = fields.filter(function(f){ return f[0] && f[1] && f[1] !== 'null' && f[1].length < 400; }).slice(0, 24);
    var arc = x.archive && (x.archive.url || x.archive) || x.archive_url || x.snapshot_url || (sn && (sn.raw_url || sn.url)) || null;
    var h = pick(x, ['sha256', 'snapshot_sha256', 'hash']) || (sn && sn.sha256) || (x.seal && x.seal.sha256) || null;
    if (!arc && /^[0-9a-f]{64}$/.test(h || '')) arc = '/api/x/h/archive/' + h;
    if (nameSearch && !m0 && found === true) { found = null; x = Object.assign({}, x, { note: 'The register returned ' + res.matches.length + ' entit' + (res.matches.length > 1 ? 'ies' : 'y') + ' for this name search, none with the same name. That proves nothing either way: many developers have no entry here.' }); }
    return { r: pick(x, ['register_name', 'register_label', 'source_name', 'source', 'register']) || 'Official register', id: pick(x, ['id', 'register', 'register_id']) || '',
      u: x.official_page || (m0 && m0.page) || (qv && qv.url) || pick(x, ['url', 'record_url', 'source_url', 'link', 'manual_check']), f: found === true || found === 'true' ? true : found === false || found === 'false' ? false : null,
      sl: nameSearch && !m0 ? 'No matching name' : typeof x.status === 'string' && SLABEL[x.status] ? SLABEL[x.status] : '', man: x.manual_check || '',
      h: h, a: typeof arc === 'string' ? arc : null, at: pick(x, ['fetched_at', 'at', 'checked_at', 'time']) || (sn && sn.fetched_at), q: qv ? (qv.value != null ? String(qv.value) : null) : pick(x, ['query', 'q', 'number']),
      nm: (m0 && m0.legal_name) || pick(res, ['name', 'legal_name', 'entity_name', 'company_name', 'holder', 'owner', 'project_name']) || pick(x, ['name', 'entity_name']), st: pick(res, ['status', 'company_status', 'entity_status', 'abn_status', 'licence_status', 'permit_status', 'registration_status']) || (m0 && m0.status) || (x.status && !(x.status in STATUS) && !SLABEL[x.status] ? x.status : null),
      fl: fields, note: (function(n){ return n && /^sha256 is the SHA-256/.test(n) ? null : n; })(pick(x, ['error', 'note', 'message', 'reason'])), http: pick(x, ['http_status', 'status_code']) };
  }
  C7.normLookup = function(d){
    if (!d || typeof d !== 'object') return { items: [] };
    var arr = pick(d, ['checks', 'results', 'registers', 'lookups', 'records', 'matches', 'sources', 'items']);
    if (!Array.isArray(arr)) arr = (d.register || d.sha256 || d.url) ? [d] : [];
    var items = arr.filter(function(x){ return x && typeof x === 'object' && x.id !== 'website'; }).map(normItem);
    var seal = pick(d, ['seal_sha256', 'snapshot_sha256', 'bundle_sha256']) || (d.seal && (d.seal.root_sha256 || d.seal.sha256 || d.seal.hash)) || (d.snapshot && d.snapshot.sha256) || (arr === d ? null : d.sha256) || null;
    var cmp = (Array.isArray(d.comparison) ? d.comparison : []).filter(function(c){ return c && typeof c === 'object'; }).slice(0, 12).map(function(c){ var b = c.brochure || c.website || {}, r = c.register || {}; return { field: String(c.field || ''), agree: c.agree, w: b.value != null ? String(b.value) : '', r: r.value != null ? String(r.value) : '', src: r.source || '', note: c.note || '' }; });
    return { items: items, seal: seal, sealUrl: (d.seal && (d.seal.result_url || d.seal.url)) || (d.snapshot && d.snapshot.url) || null, verify: d.seal && d.seal.verify || null, stamp: d.seal && d.seal.stamp_status || null, cmp: cmp, disclaimer: d.disclaimer || null, kind: pick(d, ['kind', 'input_kind', 'detected']), q: pick(d, ['query', 'q', 'input']), notes: pick(d, ['note', 'notes', 'message']), at: pick(d, ['fetched_at', 'at', 'checked_at']), error: d.error || null };
  };
  function legacyRegisters(q){
    var s = String(q || '').toUpperCase().replace(/\s+/g, ''), digits = s.replace(/\D/g, '');
    var L = [];
    if (/^([A-Z]{2}\d{6}|\d{8})$/.test(s)) L.push('uk-companies-house');
    if (/^\d{11}$/.test(digits) && digits.length === s.replace(/[^0-9A-Z]/g, '').length) L.push('au-abn');
    return L;
  }
  C7.lookup = function(q, extra){
    q = normQ(q); if (!q) return Promise.resolve({ available: false, items: [] });
    var body = Object.assign(isUrl(q) ? { url: /^https?:\/\//i.test(q) ? q : 'https://' + q, ai: '0' } : { q: q }, extra || {});
    var legacy = function(){ var regs = legacyRegisters(q); if (!regs.length) return Promise.resolve([]);
      return Promise.all(regs.map(function(id){ return fetch('/api/x/h/lookup?register=' + id + '&q=' + encodeURIComponent(q)).then(function(r){ return r.json().then(function(d){ return r.ok ? d : null; }); }).catch(function(){ return null; }); })).then(function(L){ return L.filter(Boolean).map(normItem); }); };
    return fetch('/api/kb/lookup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function(r){
      if (r.status === 404 || r.status === 405 || r.status === 501) throw new Error('nolookup');
      return r.json().catch(function(){ return {}; }).then(function(d){
        if (r.status === 429) return { available: true, rate: true, items: [], error: 'rate' };
        if (!r.ok && !(d && (d.results || d.registers || d.items))) { if (r.status >= 500 && d && d.error === 'not found') throw new Error('nolookup'); return Object.assign({ available: true, items: [], error: (d && d.error) || ('HTTP ' + r.status) }); }
        var n = C7.normLookup(d); n.available = true;
        if (n.items.some(function(i){ return i.f === true; })) return n;
        return legacy().then(function(L){ if (L.length) n.items = L.concat(n.items); return n; });
      });
    }).catch(function(e){
      if (!(e && e.message === 'nolookup')) return { available: true, items: [], error: 'network' };
      if (!legacyRegisters(q).length) return { available: false, items: [] };
      return legacy().then(function(items){ return { available: true, items: items, legacy: true }; });
    });
  };
  C7.fp = function(lk){ return sha(JSON.stringify((lk.items || []).map(function(i){ return [i.r, i.f, i.nm, i.st, (i.fl || []).map(function(f){ return f.join('='); }).sort()]; }))); };

  // ---------- rendering ----------
  function pill(i){ return i.f === true ? '<span class="c7-pill ok">Record found</span>' : i.f === false ? '<span class="c7-pill bad">Not found</span>' : '<span class="c7-pill warn">' + esc(i.sl || (i.note ? 'No answer' : 'Unclear')) + '</span>'; }
  function regHtml(i, full){
    var h = '<div class="c7-reg"><h4>' + esc(i.r) + ' ' + pill(i) + '</h4>';
    if (i.q) h += '<div class="c7-mut">Searched for: ' + esc(i.q) + '</div>';
    var head = [['Name on the register', i.nm], ['Status', i.st]].filter(function(x){ return x[1]; });
    var rows = full ? head.concat((i.fl || []).filter(function(f){ return !/^(name|status)$/i.test(f[0]); })) : head;
    if (rows.length) h += '<dl class="c7-fl">' + rows.map(function(f){ return '<dt>' + esc(f[0].charAt(0).toUpperCase() + f[0].slice(1)) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl>';
    if (i.f === false) h += '<p class="c7-mut" style="margin:6px 0">The register returned no record for this search. That can mean a typo, a different legal name, or that the project or company is not registered there.</p>';
    if (i.note && (i.f !== true || full)) h += '<p class="c7-mut" style="margin:6px 0">' + esc(i.note) + '</p>';
    if (i.man) h += '<p class="c7-mut" style="margin:6px 0">Check it by hand: <a href="' + hu(i.man) + '" target="_blank" rel="noopener nofollow">' + esc(String(i.man).replace(/^https?:\/\//, '').slice(0, 60)) + '</a></p>';
    h += '<p class="c7-mut" style="margin:6px 0">Source: ' + (i.u ? '<a href="' + hu(i.u) + '" target="_blank" rel="noopener nofollow">' + esc(String(i.u).replace(/^https?:\/\//, '').slice(0, 80)) + '</a>' : 'official register') + (i.at ? ' · read ' + esc(fmt(i.at)) : '') + '</p>';
    if (i.h) h += '<p class="c7-mut" style="margin:4px 0">Sealed snapshot SHA-256: <span class="c7-hash" title="' + esc(i.h) + '">' + esc(full ? i.h : short(i.h)) + '</span>' + (full && i.a ? (/\/api\/x\/h\/archive\//.test(i.a) ? ' · <a href="' + hu(i.a) + '" target="_blank" rel="noopener">record</a> · <a href="' + hu(i.a) + '?raw=1" target="_blank" rel="noopener">exact bytes</a>' : ' · <a href="' + hu(i.a) + '" target="_blank" rel="noopener">exact bytes the register sent</a>') : '') + '</p>';
    return h + '</div>';
  }
  C7.registersHtml = function(lk, full){
    if (!lk) return '<p class="c7-mut" role="status" style="margin:0">Asking the official registers live. This usually takes a few seconds…</p><div class="c7-sk" style="width:60%"></div><div class="c7-sk"></div><div class="c7-sk" style="width:75%"></div>';
    if (!lk.available) return '<p style="margin:0">Automatic register lookup for this kind of input is not live yet, so nothing was looked up. You can search the official registers yourself: <a href="/registers/">official registers by country</a>.</p>';
    if (lk.rate) return '<p style="margin:0">You have run many register lookups in the last hour. Try again later.</p>';
    if (lk.error === 'network' && !(lk.items || []).length) return '<p style="margin:0">We could not reach the register lookup: check your connection. Nothing is shown rather than a guess.</p><p class="c7-row" style="margin:8px 0 0"><button type="button" class="c7-btn s l" data-kb-reload>Try again</button></p>';
    if (lk.error && !(lk.items || []).length) return '<p style="margin:0">The register lookup did not answer (' + esc(lk.error) + '). Nothing is shown rather than a guess. Try again in a few minutes.</p>';
    if (!(lk.items || []).length) return '<p style="margin:0">No official register we can query automatically covers this input. ' + (lk.notes ? esc(lk.notes) + ' ' : '') + '<a href="/registers/">Official registers by country</a>.</p>';
    return lk.items.map(function(i){ return regHtml(i, full); }).join('') + (lk.seal ? '<p class="c7-mut" style="margin:8px 0 0">Sealed snapshot of this lookup, SHA-256: <span class="c7-hash">' + esc(full ? lk.seal : short(lk.seal)) + '</span>' + (full && lk.sealUrl ? ' · <a href="' + hu(lk.sealUrl) + '" target="_blank" rel="noopener">sealed result</a>' : '') + (full && lk.verify ? ' · <a href="' + hu(lk.verify) + '" target="_blank" rel="noopener">timestamp</a>' : '') + (full && /^[0-9a-f]{64}$/.test(lk.seal) && /\/lookup\/r\/[0-9a-f]{64}$/.test(lk.sealUrl || '') ? ' · <a href="/verify/?vc=' + encodeURIComponent('/api/x/acct/vc/lookup/' + lk.seal) + '#vc" target="_blank" rel="noopener">signed credential (W3C VC)</a>' : '') + '</p>' : '') + (full && lk.disclaimer ? '<p class="c7-mut" style="margin:8px 0 0">' + esc(lk.disclaimer) + '</p>' : '');
  };
  function words(s){ return String(s || '').toLowerCase().replace(/\b(pt|ltd|limited|llc|inc|co|company|corp|sa|sl|gmbh|bv|tbk|the|and|group|holdings?|properties|property|development|developments|developer|real estate)\b/g, ' ').split(/[^a-z0-9]+/).filter(function(w){ return w.length > 2; }); }
  C7.diffs = function(desk, lk, prev){
    var L = [], r = (desk && desk.report) || desk || {}, items = (lk && lk.items) || [];
    ((lk && lk.cmp) || []).forEach(function(c){ L.push([c.agree === true ? 'ok' : c.agree === false ? 'bad' : 'warn', (c.field ? c.field.charAt(0).toUpperCase() + c.field.slice(1) + ': ' : '') + (c.w ? 'website says "' + c.w + '"' : '') + (c.w && c.r ? ', ' : '') + (c.r ? (c.src || 'the register') + ' says "' + c.r + '"' : '') + (c.note ? '. ' + c.note : '')]); });
    items.forEach(function(i){
      if (i.f === false) L.push(['bad', i.r + ': no record for "' + (i.q || '') + '".']);
      if (i.st && /dissolv|struck|cancel|revok|liquidat|insolv|inactive|suspend|expired|closed|bankrupt/i.test(i.st)) L.push(['bad', i.r + ' shows status "' + i.st + '".']);
      else if (i.st && /active|registered|valid|current/i.test(i.st)) L.push(['ok', i.r + ' shows status "' + i.st + '".']);
      if (r.developer && i.nm) { var a = words(r.developer), b = words(i.nm), hit = a.filter(function(w){ return b.indexOf(w) >= 0; }).length;
        L.push(hit ? ['ok', 'The website names the developer "' + r.developer + '"; the register record is "' + i.nm + '". The names overlap.'] : ['warn', 'The website names the developer "' + r.developer + '", but the register record is "' + i.nm + '". Ask the developer which legal entity signs your contract.']); }
    });
    if (r.permit_claim) { var nums = String(r.permit_claim).match(/[A-Z0-9][A-Z0-9\/.-]{4,}/gi) || [], searched = items.map(function(i){ return String(i.q || '').toUpperCase(); });
      if (!nums.length) L.push(['warn', 'The website mentions a permit ("' + r.permit_claim + '") without a number we could look up.']);
      else if (items.length && !nums.some(function(n){ return searched.some(function(s){ return s && (s.indexOf(n.toUpperCase()) >= 0 || n.toUpperCase().indexOf(s) >= 0); }); })) L.push(['warn', 'The website states permit "' + nums[0] + '". Paste that number in the check box to look it up too.']); }
    else if (desk) L.push(['warn', 'The website states no permit or registration number.']);
    if (prev && prev.reg && lk && lk.items) {
      var old = {}; prev.reg.forEach(function(i){ old[i.r] = i; });
      lk.items.forEach(function(i){ var o = old[i.r]; if (!o) return;
        if (o.f !== i.f) L.push(['warn', i.r + ': record ' + (o.f ? 'found' : 'not found') + ' when you saved, ' + (i.f ? 'found' : 'not found') + ' now.']);
        if (o.st && i.st && o.st !== i.st) L.push(['warn', i.r + ': status changed from "' + o.st + '" to "' + i.st + '".']);
        if (o.nm && i.nm && o.nm !== i.nm) L.push(['warn', i.r + ': name changed from "' + o.nm + '" to "' + i.nm + '".']); });
    }
    return L;
  };
  function diffHtml(L){ return L.length ? '<ul class="c7-diff">' + L.map(function(x){ return '<li class="' + x[0] + '">' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<p class="c7-mut">Nothing to compare yet: the website and the register give no fields we can line up.</p>'; }

  // ---------- compact record saved in the account (kolaboro_saved.snap, under 4,000 characters) ----------
  function compact(q, url, desk, lk, extra){
    var r = (desk && desk.report) || {}, now = new Date().toISOString();
    var s = { k: 'chk', v: 1, q: q, u: url || '', at: now, t: now, proj: r.project || '', dev: r.developer || '', loc: r.location || '', att: r.attention || '', sum: String(r.summary || '').slice(0, 420),
      facts: [['Price from', r.price_from], ['Title', r.title_type], ['Lease', r.lease_years], ['Completion', r.completion], ['Return advertised', r.advertised_return], ['Permit claim', r.permit_claim]].filter(function(f){ return f[1]; }).map(function(f){ return [f[0], String(f[1]).slice(0, 90)]; }),
      qs: (r.questions || []).slice(0, 4).map(function(x){ return String(x).slice(0, 160); }), dsig: (desk && desk.signature && desk.signature.sha256) || '', dat: (desk && desk.analysed) || '',
      reg: lk && lk.available ? (lk.items || []).slice(0, 4).map(function(i){ return { r: String(i.r).slice(0, 100), u: String(i.u || '').slice(0, 220), f: i.f, h: i.h || '', a: String(i.a || '').slice(0, 220), nm: String(i.nm || '').slice(0, 120), st: String(i.st || '').slice(0, 60), sl: i.sl || '', man: String(i.man || '').slice(0, 120), q: String(i.q || '').slice(0, 60), at: i.at || '', fl: (i.fl || []).slice(0, 10).map(function(f){ return [f[0].slice(0, 40), f[1].slice(0, 160)]; }), note: String(i.note || '').slice(0, 200) }; }) : null,
      seal: lk && lk.seal || '', sealUrl: String(lk && lk.sealUrl || '').slice(0, 160), cmp: lk && lk.cmp ? lk.cmp.slice(0, 4).map(function(c){ return { field: c.field.slice(0, 30), agree: c.agree, w: c.w.slice(0, 80), r: c.r.slice(0, 80), src: String(c.src).slice(0, 60), note: String(c.note).slice(0, 160) }; }) : [], w: false, ch: [] };
    Object.assign(s, extra || {});
    var j = JSON.stringify(s);
    var trims = [function(){ s.qs = s.qs.slice(0, 2); s.cmp = s.cmp.slice(0, 2); }, function(){ (s.reg || []).forEach(function(i){ i.fl = i.fl.slice(0, 5); }); }, function(){ s.sum = s.sum.slice(0, 200); s.facts = s.facts.slice(0, 4); }, function(){ (s.reg || []).forEach(function(i){ i.fl = []; i.a = ''; }); }, function(){ s.qs = []; s.cmp = []; s.reg = (s.reg || []).slice(0, 2); }];
    for (var k = 0; j.length > 3900 && k < trims.length; k++) { trims[k](); j = JSON.stringify(s); }
    return s;
  }
  C7.save = function(q, url, desk, lk, extra){
    q = normQ(q || url);
    return C7.refFor(url || q).then(function(ref){
      return (lk && lk.available ? C7.fp(lk) : Promise.resolve('')).then(function(fp){
        var s = compact(q, url, desk, lk, Object.assign({ fp: fp }, extra || {}));
        return portal('me').then(function(d){
          var old = d && d.saved && d.saved.filter(function(x){ return x.ref === ref; })[0];
          if (old && old.snap) { s.at = old.snap.at || s.at; s.w = !!old.snap.w; if (old.snap.cs) s.cs = old.snap.cs; if (!s.reg && old.snap.reg) s.reg = old.snap.reg; if (!s.sum && old.snap.sum) { ['sum','proj','dev','loc','att','facts','qs','dsig','dat'].forEach(function(k){ s[k] = old.snap[k]; }); } if (!s.doc && old.snap.doc) s.doc = old.snap.doc; }
          return portal('save_project', { ref: ref, snap: s, note: q.slice(0, 500) }).then(function(r){ if (r && !r.error) ev('check_saved', { kind: url ? 'url' : 'text' }); return { ref: ref, res: r, snap: s }; });
        });
      });
    });
  };

  // ---------- /check/ page ----------
  var CUR = null;   // { q, url, lk: Promise, desk }
  C7.start = function(raw, url){ var me = CUR = { q: normQ(raw), url: url || '', desk: null, lkv: null };
    if (url) { var go; me.lk = new Promise(function(r){ go = r; }); me.go = function(extra){ if (me.started) return; me.started = 1; C7.lookup(url, extra).then(function(v){ me.lkv = v; go(v); }); }; }
    else me.lk = C7.lookup(raw).then(function(v){ me.lkv = v; return v; });
    return me.lk; };
  function step(n){ ['az-1','az-2','az-3','az-4'].forEach(function(id, i){ var e = $(id); if (e) e.classList.toggle('on', i === n - 1); }); var a = $('az'); if (a && a.scrollIntoView) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function backTo(){ var u = location.pathname + location.search; return u + (location.hash || '#analyze'); }
  function nextLink(signup){ var q = CUR || {}; var p = '/check/?' + (q.url ? 'url=' + encodeURIComponent(q.url) : 'q=' + encodeURIComponent(q.q || '')) + '#analyze'; return '/login/?next=' + encodeURIComponent(p) + (signup ? '#signup' : ''); }
  function gateHtml(lk){
    var any = lk && (lk.items || []).some(function(i){ return i.f === true; });
    return '<div class="c7-lock" id="c7-gate"><b>' + (any ? 'See the full check, free' : 'Save this check, free') + '</b><ul>' + (any ? '<li>Every field the register returned, and the website compared with it</li><li>The sealed snapshots: full hashes and the exact bytes the register sent</li>' : '<li>Keep this check in your private dashboard, with its sources</li>') + '<li>Upload the permit PDF: we read the number and look it up</li><li>Watch this project: we re-check it and show you what changed</li><li>Pay for the full check or order a site visit from your dashboard</li></ul>' +
      '<div class="c7-row"><a class="c7-btn" href="' + nextLink(true) + '" data-c7-gate="signup">Create a free account</a><a class="c7-btn l" href="' + nextLink(false) + '" data-c7-gate="login">Log in</a></div><p class="c7-mut" style="margin:8px 0 0">No card. After you log in you come back to this result and it is saved to your account.</p></div>';
  }
  function savedHtml(ref, snap){
    return '<div class="c7-al" style="background:var(--c7-okb);color:var(--c7-ok)" id="c7-saved">✓ Saved to your account. <a href="/portal/#c7" style="color:inherit">Open your dashboard</a> · <a href="/portal/report/#' + esc(ref) + '" style="color:inherit">private report</a>' +
      ' · <button type="button" class="c7-btn s l" id="c7-watch" aria-pressed="' + (snap && snap.w ? 'true' : 'false') + '">' + (snap && snap.w ? 'Watching ✓' : 'Watch this project') + '</button></div>';
  }
  function panel(desk){
    var box = $('az-4'); if (!box) return null; var p = $('c7-panel');
    if (!p) { p = document.createElement('section'); p.id = 'c7-panel'; p.className = 'c7 c7-box'; p.setAttribute('aria-live', 'polite'); var rq = $('azreq'); box.insertBefore(p, rq || null); }
    return p;
  }
  function paint(desk){
    var p = panel(desk); if (!p || !CUR) return; var lk = CUR.lkv, full = !!token();
    var h = '<p class="c7-k">Official registers · live lookup</p><h3>What the official registers say</h3>' + C7.registersHtml(lk, full);
    if (full && lk) { h += '<h3 style="margin-top:14px">Website compared with the registers</h3>' + diffHtml(C7.diffs(desk, lk)); if (desk && desk.signature && desk.signature.sha256) h += '<p class="c7-mut">Desk review signature SHA-256: <span class="c7-hash">' + esc(desk.signature.sha256) + '</span> · <a href="/verify">verify</a></p>'; h += '<p class="c7-row" style="margin:10px 0 0"><a class="c7-btn s l" href="/portal/#c7-upf">Upload the permit PDF</a></p><div id="c7-sv"></div>'; }
    else if (lk) h += gateHtml(lk);
    p.innerHTML = h;
    p.querySelectorAll('[data-c7-gate]').forEach(function(a){ a.onclick = function(){ ls('kb-c7-pending', JSON.stringify({ q: CUR.q, url: CUR.url, at: Date.now() })); ev('check_gate', { to: a.getAttribute('data-c7-gate') }); }; });
    if (full && lk && CUR.final) { if (CUR.saved) showSaved(CUR.saved); else autoSave(desk); }
  }
  function autoSave(desk){
    var sv = $('c7-sv'); if (!sv || !CUR) return; if (CUR.saving) return; CUR.saving = true;
    sv.innerHTML = '<p class="c7-mut">Saving to your account…</p>';
    C7.save(CUR.q, CUR.url, desk, CUR.lkv).then(function(x){
      if (!x || !x.res || x.res.error) { sv.innerHTML = x && x.res && x.res.error === 'auth' ? '<p class="c7-mut">Your session ended. <a href="' + nextLink(false) + '">Log in again</a> to save this check.</p>' : '<p class="c7-err">Could not save this check' + (x && x.res && x.res.error === 'limit' ? ': your account has 200 saved items, remove some in the dashboard.' : '. Try again in a minute.') + '</p>'; CUR.saving = false; return; }
      ls('kb-c7-pending', null); CUR.saved = x; showSaved(x);
    }).catch(function(){ CUR.saving = false; sv.innerHTML = '<p class="c7-err">Could not save this check. Check your connection and try again.</p>'; });
  }
  function showSaved(x){
      var sv = $('c7-sv'); if (!sv) return; sv.innerHTML = savedHtml(x.ref, x.snap);
      var b = $('c7-watch'); if (b) b.onclick = function(){ b.disabled = true; x.snap.w = !x.snap.w; portal('save_project', { ref: x.ref, snap: x.snap }).then(function(r){ b.disabled = false; if (r && !r.error) { b.textContent = x.snap.w ? 'Watching ✓' : 'Watch this project'; b.setAttribute('aria-pressed', x.snap.w ? 'true' : 'false'); ev('check_watch', { on: x.snap.w }); } }); };
  }
  // called by /check/ after the desk review rendered (d) or failed (d = null)
  C7.after = function(url, d){
    if (!CUR || (url && CUR.url && CUR.url !== url)) C7.start(url, url);
    CUR.desk = d && d.report ? d : null;
    var pn = null; if (d && d.report && d.report.permit_claim) { var m = String(d.report.permit_claim).match(/[A-Z0-9][A-Z0-9\/.-]{5,}/i); if (m && /\d{3,}/.test(m[0])) pn = m[0]; }
    if (CUR.go) CUR.go(Object.assign({}, d && d.report && d.report.developer ? { company: String(d.report.developer).slice(0, 120) } : {}, pn ? { permit: pn } : {}));
    var me = CUR; paint(CUR.desk);
    CUR.lk.then(function(lk){
      if (me !== CUR) return;
      if (CUR.extra && lk && lk.available && !lk.rate && !CUR.extraDone) { CUR.extraDone = true; return C7.lookup(CUR.extra).then(function(l2){ if (me !== CUR) return; if (l2 && l2.available && (l2.items || []).length) { lk.items = (lk.items || []).concat(l2.items); if (!lk.seal && l2.seal) lk.seal = l2.seal; } CUR.final = true; paint(CUR.desk); }); }
      CUR.final = true; paint(CUR.desk);
    });
  };
  // called by /check/ when the input is not a website: a project name or a permit or registration number
  C7.only = function(raw){
    raw = normQ(raw); if (raw.length < 3) return false;
    var box = $('az-4'); if (!box) return false;
    C7.start(raw, '');
    box.innerHTML = '<p class="az-k">Free check · official registers</p><h2>' + esc(raw) + '</h2><p class="lead">We look this up live on the official registers we can query, and keep a sealed copy of what each register returned. A name or number alone does not tell us what the developer promises: for the desk review, paste the project\'s website.</p>' +
      '<p><button class="btn btn-line btn-sm" type="button" id="c7-again">Check something else</button></p>';
    step(4); ev('check_text');
    var ag = $('c7-again'); if (ag) ag.onclick = function(){ var i = $('az-url'); if (i) i.value = ''; step(1); setTimeout(function(){ if (i) i.focus(); }, 300); };
    var me = CUR; paint(null);
    CUR.lk.then(function(){ if (me !== CUR) return; CUR.final = true; paint(null); });
    try { history.replaceState(null, '', '/check/?q=' + encodeURIComponent(raw) + '#analyze'); } catch (e) {}
    return true;
  };

  // ---------- dashboard (/portal/) ----------
  var P = { node: null, D: null, opt: null, busy: {}, rechecked: {} };
  function chks(D){ return ((D && D.saved) || []).filter(function(x){ if (!(C7.isChk(x.ref) && x.snap && (x.snap.k === 'chk' || x.snap.u || x.snap.q))) return false; if (!x.snap.at) x.snap.at = x.at || x.snap.t || null; return true; }); }   // X-rays saved before 9 Nov 2026 have no k/at: list them too
  function caseFor(D, s, ref){ return (D.cases || []).filter(function(c){ return (s.cs && c.code === s.cs) || (s.u && c.project_url === s.u) || (c.user_notes && c.user_notes.indexOf(ref) >= 0); })[0]; }
  var STG = ['Case opened','Documents','Land & title','Building permit','Site visit','Report'];
  function listHtml(D){
    var L = chks(D), C = D.cases || [], alerts = L.filter(function(x){ return x.snap.w && (x.snap.ch || []).length; });
    var h = '<p class="c7-k">Your dashboard</p><h2 style="margin:0 0 4px">Your projects and checks</h2><p class="c7-mut" style="margin:0 0 10px">Every check you save on <a href="/check/">/check</a> while logged in is kept here, with its sources and sealed hashes. Only you can see it.</p>';
    if (alerts.length) h += alerts.map(function(x){ return '<div class="c7-al" role="status">Changed since you saved <b>' + esc(ttl(x.snap)) + '</b> (checked ' + esc(fmt(x.snap.t)) + '): ' + esc(x.snap.ch.join(' ')) + '</div>'; }).join('');
    if (C.length) h += '<h3 style="margin:12px 0 4px;font-size:1rem">Cases</h3><ul class="c7-list">' + C.map(function(c){ return '<li><div class="c7-row" style="justify-content:space-between"><b>' + esc(c.project_name || (c.project_url || '').replace(/^https?:\/\/(www\.)?/, '') || c.code) + '</b><span class="c7-pill ' + (c.paid ? 'ok' : 'warn') + '">' + (c.paid ? esc(STG[c.stage] || 'In progress') : 'Not paid yet') + '</span></div><div class="c7-mut">' + esc(c.code) + ' · opened ' + esc(fmt(c.created_at)) + (c.messages && c.messages.length ? ' · ' + c.messages.length + ' message' + (c.messages.length > 1 ? 's' : '') : '') + '</div><div class="c7-row"><button type="button" class="c7-btn s l" data-c7-open="' + esc(c.id) + '">Open case, stages and chat</button>' + (!c.paid ? '<a class="c7-btn s" href="' + PAY + '" rel="noopener" data-c7-pay="' + esc(c.code) + '" data-c7-pid="' + esc(c.id) + '">Pay €490 with PayPal' + (c.pay_next && C.filter(function(z){ return !z.paid; }).length > 1 ? ' (next payment)' : '') + '</a>' : '') + '</div></li>'; }).join('') + '</ul>';
    h += '<h3 style="margin:14px 0 4px;font-size:1rem">Checks' + (L.length ? ' <span class="c7-mut">' + L.length + '</span>' : '') + '</h3>';
    if (!L.length) h += '<div class="c7-mut" style="padding:8px 0">No checks yet. <a href="/check/">Paste a project website, name or permit number</a>, press Save this X-ray to my account under the result and it is kept here, or upload a permit below.</div>';
    else h += '<ul class="c7-list">' + L.map(function(x){ var s = x.snap, c = caseFor(D, s, x.ref), regs = s.reg || [], fnd = regs.filter(function(i){ return i.f === true; }).length;
      return '<li data-ref="' + esc(x.ref) + '"><div class="c7-row" style="justify-content:space-between"><b>' + esc(ttl(s)) + '</b><span class="c7-row" style="gap:6px">' + (s.att ? '<span class="c7-pill ' + (s.att === 'high' ? 'bad' : s.att === 'low' ? 'ok' : 'warn') + '">' + esc(s.att) + ' attention</span>' : '') + (s.w ? '<span class="c7-pill">Watching</span>' : '') + (c ? '<span class="c7-pill ' + (c.paid ? 'ok' : 'warn') + '">' + esc(c.code) + (c.paid ? ' · paid' : ' · not paid') + '</span>' : '') + '</span></div>' +
        '<div class="c7-mut">' + esc(s.u ? s.u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 70) : s.q) + ' · saved ' + esc(fmt(s.at)) + (s.t && s.t !== s.at ? ' · checked ' + esc(fmt(s.t)) : '') + ' · ' + (regs.length ? fnd + ' of ' + regs.length + ' register' + (regs.length > 1 ? 's' : '') + ' found a record' : s.reg ? 'no register record' : 'register lookup not run') + (s.doc ? ' · permit read' : '') + '</div>' +
        '<div class="c7-row"><a class="c7-btn s l" href="/portal/report/#' + esc(x.ref) + '">Private report</a>' + (c && c.paid ? '' : '<button type="button" class="c7-btn s" data-c7-buy="' + esc(x.ref) + '">Pay for a full check</button>') +
        '<details class="c7-more"><summary class="c7-btn s l" aria-label="More actions">More</summary><div><a href="/check/?' + (s.u ? 'url=' + encodeURIComponent(s.u) : 'q=' + encodeURIComponent(s.q)) + '#analyze">Full result</a><button type="button" class="c7-btn s l" data-c7-w="' + esc(x.ref) + '" aria-pressed="' + (s.w ? 'true' : 'false') + '">' + (s.w ? 'Stop watching' : 'Watch') + '</button><button type="button" class="c7-btn s l" data-c7-re="' + esc(x.ref) + '">Re-check now</button>' +
        (c && c.paid ? '' : '<button type="button" class="c7-btn s l" data-c7-visit="' + esc(x.ref) + '">Order a site visit</button>') + '<button type="button" class="c7-btn s l" data-c7-rm="' + esc(x.ref) + '" aria-label="Remove this check">Remove</button></div></details></div><div class="c7-mut" data-c7-st="' + esc(x.ref) + '" role="status"></div></li>'; }).join('') + '</ul>';
    var unpaid = C.filter(function(c){ return !c.paid; });
    h += '<p class="c7-mut" style="margin:12px 0 0">The full check is €490 per property: land title at the land office, building permit in the official system, a site visit by a local agent with GPS-stamped photos, and a written report. Payment is by PayPal or card and matches your account by email.' + (unpaid.length > 1 ? ' You have ' + unpaid.length + ' unpaid cases: your payment starts the case whose Pay button you use.' : '') + ' Watch alerts show here when you open the dashboard, and we email you the changes found that day.</p>';
    return h;
  }
  function upHtml(D){
    return '<h3 style="margin:0 0 4px;font-size:1rem" id="c7-uph">Upload a permit</h3><p class="c7-mut" style="margin:0">A building permit (PBG, IMB, SLF or the local equivalent), as a PDF or a photo, up to 2.8 MB. Our document reader transcribes it, then we look the permit number up on the official registers we can query. The file is read once and not stored, unless you add it to a case.</p>' +
      '<form class="c7-up" id="c7-upf" novalidate><label>Permit file<br><input type="file" name="f" accept="application/pdf,image/jpeg,image/png,image/webp" required></label>' +
      '<div id="c7-pdfx" aria-live="polite"></div>' +
      '<label>Add the original to a case (optional)<br><select name="cs"><option value="">Do not store the file</option>' + (D.cases || []).map(function(c){ return '<option value="' + esc(c.id) + '">' + esc(c.code + ' · ' + (c.project_name || c.project_url || 'case')) + '</option>'; }).join('') + '</select></label>' +
      '<div class="c7-row"><button class="c7-btn" type="submit">Read the permit and check the register</button></div><p class="c7-err" id="c7-upe" role="alert"></p></form><div id="c7-upo" aria-live="polite"></div>';
  }
  function fileUrl(f){ return new Promise(function(ok, no){ var r = new FileReader(); r.onload = function(){ ok(r.result); }; r.onerror = no; r.readAsDataURL(f); }); }
  function permitNo(doc){
    var F = (doc.fields || []).concat(doc.dates || []), best = null;
    F.forEach(function(f){ var l = String(f.label || ''), v = String(f.value || ''); if (best || !/\d{3,}/.test(v)) return; if (/(permit|pbg|imb|slf|kkpr|licen[cs]e|registration|register|nomor|no\b|number|reference|ref\b|nib)/i.test(l) && !/(date|tanggal|area|luas|floor|lantai|m2|m²)/i.test(l)) best = v.trim(); });
    return best;
  }
  function bindUp(){
    var f = $('c7-upf'); if (!f || f.dataset.b) return; f.dataset.b = '1';
    // batch 10 (b10a): in-browser tamper check of a PDF permit as soon as it is chosen (nothing uploaded by this check)
    f.f.addEventListener('change', function(){ var file = f.f.files[0], o = $('c7-pdfx'); if (!o) return; if (!file || !/pdf$/i.test(file.type)) { o.innerHTML = ''; return; }
      var go = function(){ window.KBPDF.check(file, o); };
      if (window.KBPDF) go(); else { var sc = document.createElement('script'); sc.src = '/tools/pdf-check/inline.js?v=kpdf1'; sc.onload = go; document.head.appendChild(sc); } });
    f.onsubmit = function(e){ e.preventDefault(); var file = f.f.files[0], er = $('c7-upe'), out = $('c7-upo'); er.textContent = '';
      if (!file) { er.textContent = 'Choose the permit file first.'; f.f.focus(); return; }
      if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(file.type)) { er.textContent = 'Use a PDF, JPG, PNG or WebP file.'; return; }
      if (file.size > 2.8 * 1024 * 1024) { er.textContent = 'The file is over 2.8 MB. Send a photo of the page with the permit number instead.'; return; }
      var b = f.querySelector('button'); b.disabled = true; b.textContent = 'Reading the permit… (up to a minute)'; out.innerHTML = '<div class="c7-sk" style="width:50%"></div><div class="c7-sk"></div>';
      var csId = f.cs.value, dataUrl;
      fileUrl(file).then(function(u){ dataUrl = u; return fetch('/api/kb/document', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ files: [u], type: 'permit' }) }); })
      .then(function(r){ return r.json().catch(function(){ return {}; }); }).then(function(d){
        b.disabled = false; b.textContent = 'Read the permit and check the register';
        if (!d || !d.document) { out.innerHTML = '<p class="c7-err">' + (d && d.error === 'rate' ? 'Too many documents read from your connection in the last hour. Try again later.' : d && d.error === 'too_big' ? 'The file is too big.' : 'We could not read this file. Try a clearer photo of the page with the permit number.') + '</p>'; return; }
        var doc = d.document, num = permitNo(doc); ev('permit_read', { num: !!num });
        out.innerHTML = '<div class="c7-box" style="margin:10px 0"><p class="c7-k">Document reader</p><b>' + esc(doc.document_kind || 'Document') + '</b>' + (doc.legibility && doc.legibility !== 'good' ? ' <span class="c7-pill warn">legibility ' + esc(doc.legibility) + '</span>' : '') + '<p style="margin:6px 0">' + esc(doc.summary || '') + '</p>' +
          ((doc.fields || []).length ? '<dl class="c7-fl">' + doc.fields.slice(0, 12).map(function(x){ return '<dt>' + esc(x.label) + '</dt><dd>' + esc(x.value) + '</dd>'; }).join('') + '</dl>' : '') +
          '<form class="c7-row" id="c7-pnf" style="margin-top:8px"><label style="flex:1 1 220px">Permit number to look up<br><input type="text" name="n" value="' + esc(num || '') + '" required maxlength="80" style="width:100%"></label><button class="c7-btn s" type="submit" style="align-self:flex-end">Look it up</button></form>' + (num ? '' : '<p class="c7-mut">We could not find a permit number on the document. Type it from the page if you can read it.</p>') + '<div id="c7-pnr"></div></div>';
        if (csId) portal('me').then(function(){ return rpcCase(csId, dataUrl, doc); });
        var pf = $('c7-pnf'); pf.onsubmit = function(e2){ e2.preventDefault(); var n = pf.n.value.trim(); if (n.length < 3) return; var o = $('c7-pnr'), bb = pf.querySelector('button'); bb.disabled = true; o.innerHTML = C7.registersHtml(null, true);
          C7.lookup(n).then(function(lk){ bb.disabled = false; o.innerHTML = C7.registersHtml(lk, true) + '<p class="c7-mut" id="c7-pns">Saving to your checks…</p>';
            return C7.save(n, '', null, lk, { proj: doc.fields && (doc.fields.filter(function(x){ return /project|building|address|alamat|lokasi|location/i.test(x.label); })[0] || {}).value || '', doc: { k: String(doc.document_kind || 'Permit').slice(0, 80), num: n.slice(0, 80), sum: String(doc.summary || '').slice(0, 300), at: d.analysed || '' } })
              .then(function(x){ var s = $('c7-pns'); if (s) s.innerHTML = x.res && !x.res.error ? '✓ Saved to your checks. <a href="/portal/report/#' + esc(x.ref) + '">Open the private report</a>.' : 'Could not save this check.'; if (P.opt && P.opt.reload) P.opt.reload(); });
          }); };
        if (num) pf.requestSubmit ? pf.requestSubmit() : pf.onsubmit({ preventDefault: function(){} });
      }).catch(function(){ b.disabled = false; b.textContent = 'Read the permit and check the register'; out.innerHTML = '<p class="c7-err">Network error. Check your connection and try again.</p>'; });
    };
  }
  function rpcCase(caseId, dataUrl, doc){
    var t = token(); if (!t) return Promise.resolve();
    return rpc('kolaboro_case', { p_token: t, p_action: 'add_doc', p_payload: { case_id: caseId, title: doc.document_kind || 'Building permit', file: dataUrl, meta: { type: 'permit', result: doc } } }).then(function(r){ var o = $('c7-upo'); if (o) { var p = document.createElement('p'); p.className = r && r.case ? 'c7-mut' : 'c7-err'; p.textContent = r && r.case ? '✓ The original file was added to your case, with its SHA-256 fingerprint.' : 'The file could not be added to the case (' + ((r && r.error) || 'error') + ').'; o.appendChild(p); } if (window.KBXrefresh) KBXrefresh(); }).catch(function(){});
  }
  function status(ref, t){ P.msg = P.msg || {}; P.msg[ref] = t; var e = document.querySelector('[data-c7-st="' + ref + '"]'); if (e) e.textContent = t; }
  function recheck(x, quiet){
    var s = x.snap; if (P.busy[x.ref]) return Promise.resolve(); P.busy[x.ref] = 1; if (!quiet) status(x.ref, 'Checking the registers again…');
    return C7.lookup(s.doc ? s.doc.num : s.u || s.q, s.u && s.dev ? { company: s.dev } : null).then(function(lk){
      if (!lk.available || lk.rate || (lk.error && !(lk.items || []).length)) { P.busy[x.ref] = 0; if (!quiet) status(x.ref, lk.rate ? 'Too many lookups in the last hour. Try later.' : 'The register lookup is not available right now. Nothing changed.'); return; }
      return C7.fp(lk).then(function(fp){
        var ch = fp === s.fp ? [] : C7.diffs(null, lk, s).filter(function(d){ return /when you saved|changed from/.test(d[1]); }).map(function(d){ return d[1]; });
        if (fp !== s.fp && !ch.length && s.fp) ch = ['The register record changed. Open the private report to compare.'];
        var n = Object.assign({}, s, { t: new Date().toISOString(), ch: ch, fp: fp, reg: compact('', '', null, lk).reg, seal: lk.seal || s.seal, sealUrl: lk.sealUrl || s.sealUrl || '' });
        return portal('save_project', { ref: x.ref, snap: n }).then(function(){ P.busy[x.ref] = 0; x.snap = n; if (!quiet) status(x.ref, ch.length ? 'Changed: ' + ch.join(' ') : 'No change on the registers since ' + fmt(s.t) + '.'); ev('check_recheck', { changed: !!ch.length }); if (P.opt && P.opt.reload && (ch.length || !quiet)) P.opt.reload(); });
      });
    }).catch(function(){ P.busy[x.ref] = 0; if (!quiet) status(x.ref, 'Network error.'); });
  }
  function order(x, visit){
    var D = P.D, s = x.snap, c = caseFor(D, s, x.ref), o = P.opt;
    var go = function(id){ if (o && o.pick) o.pick(id); setTimeout(function(){ var t = $(visit ? 'msgs' : 'paycta') || $('app'); if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300); };
    if (c) { ev(visit ? 'visit_order' : 'check_buy', { existing: true }); if (visit && !c.paid) portal('message', { case_id: c.id, body: 'Please include a site visit by a local agent for this project (from my check ' + x.ref + ').' }).then(function(){ if (o.reload) o.reload().then(function(){ go(c.id); }); }); else go(c.id); return; }
    if ((D.cases || []).length >= 20) { status(x.ref, 'You already have 20 cases, the maximum. Write to us in an existing case chat.'); return; }
    status(x.ref, 'Opening a case for this project…');
    portal('new_case', { project_url: s.u || '' }).then(function(d){
      if (!d || d.error || !d.cases || !d.cases[0]) { status(x.ref, d && d.error === 'network' ? 'Could not reach the server. Check your connection and try again.' : 'Could not open a case (' + ((d && d.error) || 'error') + '). Try again.'); document.querySelectorAll('[data-c7-buy="' + x.ref + '"],[data-c7-visit="' + x.ref + '"]').forEach(function(b){ b.disabled = false; }); return; }
      var nc = d.cases[0];
      return portal('update_case', { case_id: nc.id, project_name: ttl(s).slice(0, 200), developer: s.dev || '', location: s.loc || '', price_text: '', next_payment_date: '', next_payment_amount: '', project_url: s.u || '', contract_url: '', user_notes: 'Opened from my Kolaboro check ' + x.ref + ': ' + (s.q || '') + (s.doc ? '. Permit ' + s.doc.num + ' read from my upload.' : '') })
        .then(function(){ return visit ? portal('message', { case_id: nc.id, body: 'Please include a site visit by a local agent for this project (from my check ' + x.ref + ').' }) : null; })
        .then(function(){ var n = Object.assign({}, s, { cs: nc.code }); return portal('save_project', { ref: x.ref, snap: n }); })
        .then(function(){ ev(visit ? 'visit_order' : 'check_buy', { existing: false }); status(x.ref, visit ? 'Case ' + nc.code + ' opened with your site visit request.' : 'Case ' + nc.code + ' opened. Pay below to start it.'); return o && o.reload ? o.reload() : null; }).then(function(){ go(nc.id); });
    });
  }
  function bindList(){
    var root = P.node; if (!root) return;
    root.querySelectorAll('[data-c7-open]').forEach(function(b){ b.onclick = function(){ if (P.opt && P.opt.pick) P.opt.pick(b.getAttribute('data-c7-open')); var a = $('app'); setTimeout(function(){ var h = document.querySelector('#app .ap-hero'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200); }; });
    root.querySelectorAll('[data-c7-pay]').forEach(function(a){ a.addEventListener('click', function(e){
      ev('begin_checkout', { value: 490, currency: 'EUR', source: 'dashboard' });
      // more than one unpaid case: first mark this one as the case the next payment starts (kolaboro_portal pay_next)
      var id = a.getAttribute('data-c7-pid'), many = ((P.D && P.D.cases) || []).filter(function(c){ return !c.paid; }).length > 1;
      if (!id || !many) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) { portal('pay_next', { case_id: id }); return; }
      e.preventDefault(); a.setAttribute('aria-busy', 'true');
      var go = function(){ location.href = a.href; };
      portal('pay_next', { case_id: id }).then(go, go); setTimeout(go, 4000);
    }); });
    function find(ref){ return chks(P.D).filter(function(x){ return x.ref === ref; })[0]; }
    root.querySelectorAll('[data-c7-w]').forEach(function(b){ b.onclick = function(){ var x = find(b.getAttribute('data-c7-w')); if (!x) return; b.disabled = true; var n = Object.assign({}, x.snap, { w: !x.snap.w, ch: [] }); portal('save_project', { ref: x.ref, snap: n }).then(function(r){ b.disabled = false; if (r && !r.error) { ev('check_watch', { on: n.w }); if (P.opt.reload) P.opt.reload(); } else status(x.ref, 'Could not save.'); }); }; });
    root.querySelectorAll('[data-c7-re]').forEach(function(b){ b.onclick = function(){ var x = find(b.getAttribute('data-c7-re')); if (x) recheck(x, false); }; });
    root.querySelectorAll('[data-c7-buy]').forEach(function(b){ b.onclick = function(){ var x = find(b.getAttribute('data-c7-buy')); if (x) { b.disabled = true; order(x, false); } }; });
    root.querySelectorAll('[data-c7-visit]').forEach(function(b){ b.onclick = function(){ var x = find(b.getAttribute('data-c7-visit')); if (x) { b.disabled = true; order(x, true); } }; });
    root.querySelectorAll('[data-c7-rm]').forEach(function(b){ b.onclick = function(){ var ref = b.getAttribute('data-c7-rm'); if (!confirm('Remove this check from your account? Cases are not affected.')) return; portal('unsave_project', { ref: ref }).then(function(){ if (P.opt.reload) P.opt.reload(); }); }; });
  }
  // called by /portal/ after every render: D is the portal data, opt = { pick(caseId), reload() -> Promise }
  C7.portal = function(D, opt){
    if (!D || !D.user || !D.saved) return; P.D = D; P.opt = opt || {};
    var app = $('app'); if (!app) return;
    if (!P.node) { P.node = document.createElement('section'); P.node.id = 'c7'; P.node.className = 'c7 ap-card'; P.node.setAttribute('aria-label', 'Your projects and checks'); P.node.innerHTML = '<div id="c7-list"></div><details class="c7-upd" style="border-top:1px solid var(--c7-line);margin-top:16px;padding-top:14px"><summary>Upload a permit and check it</summary><div id="c7-upw" style="margin-top:12px"></div></details>'; }
    var key = JSON.stringify([chks(D).map(function(x){ return [x.ref, x.snap]; }), (D.cases || []).map(function(c){ return [c.id, c.paid, c.stage, c.code, c.project_name, (c.messages || []).length]; })]);
    if (P.key !== key) { P.key = key; P.node.querySelector('#c7-list').innerHTML = listHtml(D); Object.keys(P.msg || {}).forEach(function(r){ var e = P.node.querySelector('[data-c7-st="' + r + '"]'); if (e) e.textContent = P.msg[r]; }); }
    var upw = P.node.querySelector('#c7-upw'); if (!upw.firstChild || upw.dataset.n !== String((D.cases || []).length)) { if (!upw.querySelector('#c7-upo') || !upw.querySelector('#c7-upo').innerHTML) { upw.innerHTML = upHtml(D); upw.dataset.n = String((D.cases || []).length); } }
    var anchor = app.querySelector('.ap-grid'); if (P.node.parentNode !== app || P.node.nextSibling !== anchor) app.insertBefore(P.node, anchor || app.firstChild);
    bindList(); bindUp();
    if (D.user.demo) return;
    if (/#c7/.test(location.hash) && !P.scrolled) { P.scrolled = 1; setTimeout(function(){ var ud = P.node.querySelector('details.c7-upd'); if (ud && /#c7-up/.test(location.hash)) ud.open = true; var t = $(location.hash.slice(1)) || P.node; t.scrollIntoView({ block: 'start' }); if (location.hash === '#c7-upf') { var i = document.querySelector('#c7-upf input[type=file]'); if (i) i.focus(); } }, 400); }
    // watched checks: re-check at most two a visit, once a day each, and show what changed here
    var day = 864e5, due = chks(D).filter(function(x){ return x.snap.w && !P.rechecked[x.ref] && (!x.snap.t || Date.now() - new Date(x.snap.t) > day); }).slice(0, 2);
    due.forEach(function(x){ P.rechecked[x.ref] = 1; recheck(x, true); });
  };

  // ---------- private report (/portal/report/#CHK-...) ----------
  C7.report = function(){
    var out = $('c7r'), ref = decodeURIComponent((location.hash || '').slice(1)).toUpperCase();
    if (!token()) { location.href = '/login/?next=' + encodeURIComponent('/portal/report/' + (ref ? '#' + ref : '')); return; }
    if (!C7.isChk(ref)) { out.innerHTML = '<div class="ap-card"><h1 style="margin-top:0">No report selected</h1><p>Open a report from <a href="/portal/#c7">your dashboard</a>.</p></div>'; return; }
    portal('me').then(function(D){
      if (!D || D.error) { if (D && D.error === 'auth') { location.href = '/login/?next=' + encodeURIComponent('/portal/report/#' + ref); return; } out.innerHTML = '<div class="ap-card"><h1 style="margin-top:0">Could not open the report</h1><p>' + (D && D.error === 'network' ? 'We could not reach the server. Check your connection.' : 'Something went wrong. Try again in a minute.') + '</p><button class="ap-btn" type="button" data-kb-reload>Try again</button></div>'; return; }
      var x = (D.saved || []).filter(function(v){ return v.ref === ref; })[0];
      if (!x || !x.snap) { out.innerHTML = '<div class="ap-card"><h1 style="margin-top:0">Report not found</h1><p>This report is not in your account. Reports are private: only the account that saved the check can open them. <a href="/portal/#c7">Back to your dashboard</a>.</p></div>'; return; }
      var s = x.snap, c = caseFor(D, s, ref), lk = { available: !!s.reg, items: (s.reg || []).map(function(i){ return Object.assign({}, i); }), seal: s.seal, sealUrl: s.sealUrl || null, cmp: s.cmp || [] };
      var desk = s.sum ? { report: { summary: s.sum, developer: s.dev, project: s.proj, permit_claim: (s.facts.filter(function(f){ return f[0] === 'Permit claim'; })[0] || [])[1] } } : null;
      var link = location.origin + '/portal/report/#' + ref;
      var h = '<div class="ap-card c7"><p class="ap-k" style="color:var(--muted)">Private report · ' + esc(ref) + ' · only visible to ' + esc(D.user.email) + '</p><h1 style="margin:4px 0 6px">' + esc(ttl(s)) + '</h1>' +
        '<p class="c7-mut" style="margin:0">Input: ' + esc(s.q) + (s.u ? ' · <a href="' + hu(s.u) + '" target="_blank" rel="noopener nofollow">website</a>' : '') + ' · saved ' + esc(fmt(s.at)) + (s.t ? ' · last checked ' + esc(fmt(s.t)) : '') + (s.w ? ' · watching' : '') + '</p>' +
        ((s.ch || []).length ? '<div class="c7-al">Changed at the last check: ' + esc(s.ch.join(' ')) + '</div>' : '') +
        (c ? '<p style="margin:10px 0 0"><span class="c7-pill ' + (c.paid ? 'ok' : 'warn') + '">Case ' + esc(c.code) + ' · ' + (c.paid ? esc(STG[c.stage] || 'In progress') : 'not paid yet') + '</span> <a href="/portal/">open the case</a></p>' : '') + '</div>';
      if (s.sum) h += '<div class="ap-card c7"><h2 style="margin-top:0">Desk review of the website</h2>' + (s.att ? '<p><span class="c7-pill ' + (s.att === 'high' ? 'bad' : s.att === 'low' ? 'ok' : 'warn') + '">' + esc(s.att) + ' attention</span></p>' : '') + '<p>' + esc(s.sum) + '</p>' +
        ((s.facts || []).length ? '<dl class="c7-fl">' + s.facts.map(function(f){ return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl>' : '') +
        ((s.qs || []).length ? '<h3>Ask before you pay</h3><ol>' + s.qs.map(function(q){ return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' : '') +
        '<p class="c7-mut">Advertised claims from the website' + (s.dat ? ', read ' + esc(fmt(s.dat)) : '') + ', not verified facts.' + (s.dsig ? ' Signature SHA-256: <span class="c7-hash">' + esc(s.dsig) + '</span> · <a href="/verify">verify</a>.' : '') + '</p></div>';
      if (s.doc) h += '<div class="ap-card c7"><h2 style="margin-top:0">Permit you uploaded</h2><p><b>' + esc(s.doc.k) + '</b> · number <b>' + esc(s.doc.num) + '</b>' + (s.doc.at ? ' · read ' + esc(fmt(s.doc.at)) : '') + '</p><p>' + esc(s.doc.sum) + (s.doc.sum.length >= 300 ? '…' : '') + '</p><p class="c7-mut">Transcribed by our document reader. The file itself was not stored unless you added it to a case.</p></div>';
      h += '<div class="ap-card c7"><h2 style="margin-top:0">Official registers</h2>' + (s.reg ? C7.registersHtml(lk, true) : '<p>The register lookup was not available when this check was saved. Use Re-check in your dashboard.</p>') + '</div>';
      if (s.reg) h += '<div class="ap-card c7"><h2 style="margin-top:0">Website compared with the registers</h2>' + diffHtml(C7.diffs(desk, lk)) + '</div>';
      h += '<div class="ap-card c7" style="display:flex;gap:18px;flex-wrap:wrap;align-items:center"><div id="c7qr" aria-label="QR code that opens this private report" role="img" style="background:#fff;padding:10px;border-radius:12px;width:180px;height:180px"></div><div style="flex:1 1 240px"><h2 style="margin-top:0">Open this report on your phone</h2><p class="c7-mut">The QR code opens this page. It only shows the report after you log in to this account, so a lost printout reveals nothing.</p><p class="c7-hash">' + esc(link) + '</p><div class="c7-row"><button type="button" class="c7-btn s" id="c7print">Print or save as PDF</button>' + (c && c.paid ? '' : '<a class="c7-btn s l" href="/portal/#c7">Pay for a full check or order a site visit</a>') + '</div></div></div>';
      out.innerHTML = h; document.title = ttl(s).slice(0, 60) + ' · Private report | Kolaboro';
      $('c7print').onclick = function(){ window.print(); };
      var sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.integrity = 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU'; sc.crossOrigin = 'anonymous';
      sc.onload = function(){ try { new QRCode($('c7qr'), { text: link, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.M }); } catch (e) {} };
      sc.onerror = function(){ $('c7qr').innerHTML = '<p class="c7-mut" style="color:#5E6872">QR code could not load. Use the link instead.</p>'; };
      document.head.appendChild(sc);
      ev('check_report_open');
    });
  };
  addEventListener('hashchange', function(){ if ($('c7r')) C7.report(); });
})();
