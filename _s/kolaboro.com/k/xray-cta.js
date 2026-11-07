/* Kolaboro Project X-ray: the conversion block (x11c, batch 11, 7 Nov 2026). Mounted by the X-ray UI (x11a) into <div id="xr-conv">.
   Honest by construction: the gaps come from what the X-ray cards could not verify; the offer text is what /pricing and /book promise;
   counters are real and hidden below 3; no urgency, no scarcity, no invented numbers. Funnel steps are anonymous (kolaboro_events).
   API: listens to window.KBX.on(fn) and the 'kb:xray' CustomEvent { phase:'start'|'card'|'done', input, cards, root, url, lang };
   or call KXC.render(el, state, { mode: 'view' }) yourself (sealed /x/<root>/ page: mode 'view' records no run). */
(function () {
  if (window.KXC) return;
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/', AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';
  var K = window.KXC = { v: 1 };
  var S = { st: null, ctx: null, ctxFor: '', sid: '', sent: {}, el: null, mode: 'run', open: false, busy: false, seen: null };
  function $(i) { return document.getElementById(i); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function token() { var t = null; try { t = sessionStorage.getItem('kb-token-as') || localStorage.getItem('kb-token'); } catch (e) {} return ls('kb-role') === 'agent' ? null : t; }
  function rpc(fn, b) { return fetch(SB + fn, { method: 'POST', headers: { apikey: AK, Authorization: 'Bearer ' + AK, 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json(); }); }
  function portal(a, p) { var t = token(); if (!t) return Promise.resolve({ error: 'auth' }); return rpc('kolaboro_portal', { p_token: t, p_action: a, p_payload: p || {} }).catch(function () { return { error: 'network' }; }); }
  function post(u, b) { return fetch(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(function (r) { return r.json().catch(function () { return { error: 'http ' + r.status }; }); }).catch(function () { return { error: 'network' }; }); }
  function host(u) { try { return new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } }
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function bucket() { var b = ls('kb-xc-b'); if (!/^\d{1,2}$/.test(b || '')) { b = String(Math.floor(Math.random() * 100)); try { localStorage.setItem('kb-xc-b', b); } catch (e) {} } return b; }
  function ga(n, p) { try { if (window.gtag) gtag('event', n, p || {}); } catch (e) {} }

  // ---------------------------------------------------------------- input helpers
  function inp() { var st = S.st || {}, i = st.input || {}; var url = i.url || (i.kind === 'url' ? i.q : '') || ''; return { url: url, q: i.q || url, domain: i.host || host(url), root: st.root || null, xurl: st.url || (st.root ? 'https://kolaboro.com/x/' + st.root + '/' : '') }; }
  function cards() { return ((S.st && S.st.cards) || []).filter(Boolean); }
  function facts(c) { var f = c && (c.facts || c.items) || []; return f.map(function (x) { return { k: String(x.k || x.label || ''), v: String(x.v != null ? x.v : x.value != null ? x.value : ''), q: x.q || x.quote || '', src: x.src || x.url || '' }; }); }
  function find(rx) { return cards().filter(function (c) { return rx.test(String(c.id || '')); })[0] || null; }
  function fact(rxK, rxV) { var all = cards(); for (var i = 0; i < all.length; i++) { var F = facts(all[i]); for (var j = 0; j < F.length; j++) if (rxK.test(F[j].k) && (!rxV || rxV.test(F[j].v)) && F[j].v) return F[j]; } return null; }
  function okSt(c) { return c && /^(ok|found)$/.test(c.status || ''); }
  function gapSet() { var g = {}; cards().forEach(function (c) { (c.gaps || []).forEach(function (k) { g[String(k)] = 1; }); }); return g; }
  function ctxNamed() { return (S.ctx && S.ctx.named) || null; }
  function ident() {
    var n = ctxNamed() || {}, id = find(/^(identity|id|page|project)$/);
    var name = (fact(/^(project|project name|name)$/i) || {}).v || n.name || '';
    var dev = (fact(/^developer$/i) || {}).v || (S.ctx && S.ctx.developer && S.ctx.developer.name) || '';
    var ho = fact(/handover|completion|delivery/i), stg = fact(/^stage$|construction stage|status/i);
    var em = null; cards().some(function (c) { return facts(c).some(function (f) { var m = (f.v + ' ' + f.q).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i); if (m && /email|contact|e-mail/i.test(f.k)) { em = m[0]; return true; } return false; }); });
    return { name: name, dev: dev, handover: (ho && ho.v) || n.handover || '', handoverQ: ho && ho.q, stage: (stg && stg.v) || n.stage || '', email: em, card: id };
  }

  // ---------------------------------------------------------------- (19) gaps: what the X-ray could not verify, mapped to the 490 check
  function gaps() {
    var G = gapSet(), I = ident(), out = [];
    var permit = fact(/permit|licen[cs]e|PBG|IMB|RERA|registration|DHSUD|TEDUH|LTS/i, /[A-Z0-9]{3,}/i);
    var dep = fact(/escrow|deposit|guarantee|trust account/i);
    var sat = find(/^satellite$/), loc = find(/^location$/), dev = find(/^developer$/), comp = find(/company|register|lookup|domain/);
    var satD = sat && sat.data && sat.data.scene && sat.data.scene.date;
    out.push({ k: 'land', t: 'Land title and zoning', on: 'Land certificates are not public online in most markets. The X-ray only reads what the developer publishes about the land' + (fact(/title|certificate|tenure|leasehold|freehold|SHM|HGB|chanote/i) ? ': "' + fact(/title|certificate|tenure|leasehold|freehold|SHM|HGB|chanote/i).v + '".' : '.'),
      ck: 'Title and zoning checked at the land office: who owns the land, what it may be used for, and whether it is mortgaged.' });
    out.push({ k: 'permit', t: 'Building permit file', on: permit ? 'The page quotes "' + permit.v + '". A number on a website is not the permit itself, and the X-ray cannot open the permit file.' : (G.permit ? 'No permit or licence number found on the page.' : 'The X-ray cannot open the permit file in the official system.'),
      ck: "Permits checked, with the developer's track record: is there a permit, for this design, held by the seller." });
    out.push({ k: 'site', t: 'What is on the plot today', on: okSt(sat) ? 'Satellite image' + (satD ? ' of ' + satD : '') + ' at 10 m per pixel: it shows land cover from above, not walls, floors or quality.' : okSt(loc) ? 'A location was found, but no recent cloud-free satellite image.' : 'No exact location found on the page.',
      ck: 'Site visit by a local agent with GPS- and time-stamped photos and video of the plot.' });
    out.push({ k: 'contract', t: 'Your contract and payment terms', on: 'Sale contracts are not published online; the X-ray only reads public pages.', ck: 'Contract read for risky clauses: payment schedule, late-handover terms, what happens to your deposit.' });
    if (G.escrow || !dep || /no |not /i.test((dep && dep.v) || '')) out.push({ k: 'escrow', t: 'Deposit protection', on: dep ? 'The page says: "' + dep.v + '". Not checked against a bank or a contract.' : 'The page does not say how buyer deposits are protected (escrow, bank guarantee or insurance).',
      ck: 'Checked in your contract and documents as part of the contract review.' });
    var dn = dev && dev.data && dev.data.projects;
    if (G.developer || !okSt(dev) || (comp && /not_found|not_published/.test(comp.status || ''))) out.push({ k: 'developer', t: 'Who you would be paying', on: okSt(dev) ? 'The developer is in our data' + (dn ? ' with ' + dn + ' tracked project' + (dn === 1 ? '' : 's') : '') + ', but the seller named in your contract can be a different company.' : 'The developer is not in our data, or no matching company was found in the free registers queried.',
      ck: "Permits and the developer's track record: which company holds the land and the permit, and what it delivered before." });
    if (I.handover) out.push({ k: 'handover', t: 'The promised handover', on: 'The X-ray found the promise "' + I.handover + '". A date on a website does not bind the developer.', ck: 'Contract read for the handover date and what you get if it is late; site visit to see where construction really is.' });
    return out;
  }

  // ---------------------------------------------------------------- (20) questions to send the developer (deterministic templates)
  function questions() {
    var I = ident(), Q = [], ks = {}; gaps().forEach(function (g) { ks[g.k] = g; });
    var permit = fact(/permit|licen[cs]e|PBG|IMB|RERA|registration|DHSUD|TEDUH|LTS/i, /[A-Z0-9]{3,}/i);
    if (ks.permit) Q.push(permit ? 'Your page quotes "' + permit.v + '". Please send a copy of that permit and confirm it covers this project in its current design.' : 'What is the building permit number for this project, which authority issued it, and on what date? Please send a copy.');
    if (ks.land) Q.push('Who holds the land title (certificate type and number), and is the land zoned for this use? Please send a copy of the certificate.');
    if (ks.escrow) Q.push('How are buyer deposits protected: escrow account, bank guarantee or insurance? Please name the bank or insurer and send the document.');
    if (ks.handover) Q.push('Your page promises handover "' + I.handover + '". Is that date written in the sale contract, and what compensation applies if it is late?');
    if (ks.site) Q.push('What is the current construction stage? Please send dated photos of the site and the date of the next milestone.');
    if (ks.contract) Q.push('Please send the draft sale contract with the payment schedule and the clauses for late handover and cancellation.');
    if (ks.developer) Q.push('Which company will sign the contract and receive my payments (registered name and number)? Which projects has it delivered, with addresses and handover dates?');
    return Q;
  }
  function qText() { var I = ident(), x = inp(), Q = questions(); return 'Hello,\n\nI am considering buying in ' + (I.name || x.domain || 'your project') + (x.url ? ' (' + x.url + ')' : '') + ' and would like these answers in writing before I decide:\n\n' + Q.map(function (q, i) { return (i + 1) + '. ' + q; }).join('\n') + '\n\nThank you.\n'; }

  // ---------------------------------------------------------------- funnel (anonymous: domain, root, variant, random id per X-ray)
  function track(step, extra) {
    if (S.mode === 'view' && /^(run|pasted|first_card|full)$/.test(step)) return;
    var key = step + '|' + (inp().root || inp().domain); if (S.sent[key] && !/copied|mailto/.test(step)) return; S.sent[key] = 1;
    var x = inp(), b = { step: step, domain: x.domain, root: x.root, v: (S.ctx && S.ctx.v) || 'A', sid: S.sid, src: /[?&]src=embed/.test(location.search) ? 'embed' : (new URLSearchParams(location.search).get('utm_source') || '') };
    if (extra) for (var k in extra) b[k] = extra[k];
    if (/[?&]kxctest=1/.test(location.search)) b.test = 1;
    try { fetch('/api/x/xc/ev', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).catch(function () {}); } catch (e) {}
    ga('xray_' + step, { v: b.v });
  }

  // ---------------------------------------------------------------- styles (site variables, dark theme follows them)
  var CSS = '.kxc{--kx-hi:var(--hivis,#FF5B14);--kx-card:var(--card,#fff);--kx-line:var(--line,rgba(23,33,43,.16));--kx-mut:var(--muted,#59626B);--kx-ok:var(--ok,#0A704E);--kx-okb:var(--ok-bg,#DDEFE7);margin:20px 0;display:grid;gap:14px;color:inherit}' +
    '.kxc-box{background:var(--kx-card);border:1px solid var(--kx-line);border-radius:16px;padding:18px;min-width:0}.kxc h3{margin:0 0 6px;font-size:1.15rem;overflow-wrap:anywhere}.kxc h4{margin:0;font-size:1rem}' +
    '.kxc-k{font-size:.74rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--kx-mut);margin:0 0 6px}.kxc-m{color:var(--kx-mut);font-size:.9rem}.kxc p{margin:6px 0}' +
    '.kxc-gl{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:10px}.kxc-gl li{border:1px solid var(--kx-line);border-radius:12px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:6px 16px}' +
    '.kxc-gl h4{grid-column:1/-1}.kxc-gl .on b,.kxc-gl .ck b{display:block;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--kx-mut);margin-bottom:2px}.kxc-gl .ck{border-left:3px solid var(--kx-hi);padding-left:10px}' +
    '.kxc-ql{margin:8px 0;padding-left:22px}.kxc-ql li{margin:4px 0}.kxc-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
    '.kxc-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:12px;border:0;background:var(--kx-hi);color:#111;font:inherit;font-weight:800;text-decoration:none;cursor:pointer;text-align:center}' +
    '.kxc-btn.l{background:transparent;border:1px solid currentColor;color:inherit}.kxc-btn[disabled]{opacity:.55;cursor:default}.kxc-btn:focus-visible,.kxc a:focus-visible,.kxc input:focus-visible,.kxc summary:focus-visible{outline:3px solid #2563EB;outline-offset:2px}' +
    '.kxc-price{font-size:2rem;font-weight:800;letter-spacing:-.02em;margin:0}.kxc-inc{margin:8px 0;padding-left:20px}.kxc-inc li{margin:2px 0}' +
    '.kxc-tl{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.kxc-tl li{border-top:3px solid var(--kx-hi);padding-top:8px;font-size:.9rem}.kxc-tl b{display:block}' +
    '.kxc-proof{background:var(--kx-okb);color:var(--kx-ok);border-radius:12px;padding:10px 14px;font-weight:600}.kxc-form{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.kxc-form input[type=email]{flex:1 1 220px;min-height:44px;font:inherit;border:1px solid var(--field-line,#B9B7AF);border-radius:12px;padding:8px 12px;background:var(--kx-card);color:inherit;min-width:0}' +
    '.kxc-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}.kxc-msg{font-weight:600;margin:6px 0 0}.kxc-msg.bad{color:#B42318}.kxc-cols{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}.kxc a{overflow-wrap:anywhere}' +
    '.kxc-panel{border:1px dashed var(--kx-line);border-radius:12px;padding:12px 14px;margin-top:10px}.kxc-chk{display:flex;gap:8px;align-items:flex-start;margin:8px 0}.kxc-chk input{width:20px;height:20px;margin-top:2px;flex:none}' +
    '@media (max-width:760px){.kxc-cols{grid-template-columns:1fr}.kxc-tl{grid-template-columns:1fr 1fr}}@media (max-width:560px){.kxc-gl li{grid-template-columns:1fr}.kxc-row .kxc-btn{flex:1 1 auto}.kxc-tl{grid-template-columns:1fr}}';
  function addCss() { if ($('kxc-css')) return; var s = document.createElement('style'); s.id = 'kxc-css'; s.textContent = CSS; (document.head || document.documentElement).appendChild(s); }

  // ---------------------------------------------------------------- render
  function sec(id, h) { return '<section class="kxc-box" id="' + id + '">' + h + '</section>'; }
  function html() {
    var C = S.ctx || {}, copy = C.copy || { h: 'What the X-ray could not verify online', sub: '', cta: 'Order the €490 check for this project' }, O = C.offer || {}, x = inp(), I = ident(), done = S.st && S.st.phase === 'done';
    var G = gaps(), Q = questions(), cnt = C.counts || {}, n = C.named, logged = !!token();
    var h = '';
    // (19)
    h += sec('kxc-gaps', '<p class="kxc-k">' + (done ? 'After the X-ray' : 'While the X-ray runs') + '</p><h3>' + esc(copy.h) + '</h3><p class="kxc-m">' + esc(copy.sub) + '</p><ul class="kxc-gl">' +
      G.map(function (g) { return '<li><h4>' + esc(g.t) + '</h4><div class="on"><b>Online, for free</b>' + esc(g.on) + '</div><div class="ck"><b>The €490 check</b>' + esc(g.ck) + '</div></li>'; }).join('') + '</ul>');
    // (24) real counters only, hidden below the threshold
    var pr = [];
    if (cnt.runs) pr.push(cnt.runs + ' different visitors have run an X-ray of ' + esc(x.domain));
    if (cnt.watchers) pr.push(cnt.watchers + ' people watch this project by email');
    // (22) inline checkout + (21) what you get
    h += '<div class="kxc-cols">' + sec('kxc-buy', '<p class="kxc-k">Pre-purchase check</p><p class="kxc-price">' + esc(O.price || '€490') + '</p><p class="kxc-m">' + esc(O.per || 'one-off, per property') + '. ' + esc(O.refund || 'Full refund if we cannot take your case.') + '</p>' +
      '<ul class="kxc-inc">' + (O.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>' +
      (pr.length ? '<p class="kxc-proof">' + pr.join('. ') + '.</p>' : '') +
      '<div class="kxc-row"><button class="kxc-btn" type="button" id="kxc-open" aria-expanded="' + (S.open ? 'true' : 'false') + '" aria-controls="kxc-pan">' + esc(copy.cta) + '</button></div>' +
      '<div class="kxc-panel" id="kxc-pan"' + (S.open ? '' : ' hidden') + '>' + panel(logged, I, x) + '</div>') +
      sec('kxc-get', '<p class="kxc-k">What you get, in 30 seconds</p><ol class="kxc-tl">' + (O.timeline || []).map(function (t) { return '<li><b>' + esc(t[0]) + '</b>' + esc(t[1]) + '</li>'; }).join('') + '</ol>' +
        '<p style="margin-top:12px"><a class="kxc-btn l" id="kxc-sample" href="' + esc((C.sample && C.sample.url) || '/report/sample') + '">See a sample report</a></p><p class="kxc-m">' + esc((C.sample && C.sample.note) ? 'The sample is ' + C.sample.note + '.' : '') + ' <a href="/pricing">Pricing</a> · <a href="/book/">How booking works</a></p>') + '</div>';
    // (23) monitoring, only when the project is off-plan with a future handover
    if (C.monitoring && C.monitoring.offered) {
      var M = C.monitor_offer || {};
      h += sec('kxc-mon', '<p class="kxc-k">Already paying in instalments?</p><h3>Construction monitoring, ' + esc(M.price) + ' ' + esc(M.per) + '</h3><p class="kxc-m">Shown because our data lists this project as <b>' + esc(C.monitoring.stage) + '</b> with handover promised for <b>' + esc(C.monitoring.handover) + '</b> (<a href="' + esc(C.monitoring.source) + '">project page</a>).</p>' +
        '<ul class="kxc-inc">' + (M.items || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul><div class="kxc-row"><button class="kxc-btn l" type="button" id="kxc-mon-b">Ask for monitoring of this project</button></div><p class="kxc-msg" id="kxc-mon-m" aria-live="polite"></p>');
    }
    // (20) questions
    if (Q.length) h += sec('kxc-q', '<p class="kxc-k">Free, do it now</p><h3>Questions to send the developer</h3><p class="kxc-m">Built from the gaps above. A serious developer answers these in writing; ask for documents, not promises.</p><ol class="kxc-ql">' + Q.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' +
      '<div class="kxc-row"><button class="kxc-btn l" type="button" id="kxc-copy">Copy the questions</button><a class="kxc-btn l" id="kxc-mail" href="mailto:' + esc(I.email || '') + '?subject=' + encodeURIComponent('Questions about ' + (I.name || x.domain || 'your project')) + '&body=' + encodeURIComponent(qText()) + '">Open in my email' + (I.email ? ' (to ' + esc(I.email) + ')' : '') + '</a></div><p class="kxc-msg" id="kxc-q-m" aria-live="polite"></p>');
    // (25) save, watch, email me
    var w = '';
    if (n && n.slug) w += '<form class="kxc-form" id="kxc-watch" novalidate><label class="kxc-m" for="kxc-we" style="flex-basis:100%">Get an email when ' + esc(n.name) + ' changes its handover date, price band or published documents (confirm by email first):</label><input id="kxc-we" type="email" autocomplete="email" placeholder="you@example.com" required><input class="kxc-hp" tabindex="-1" aria-hidden="true" name="hp"><button class="kxc-btn l" type="submit">Watch this project</button></form>';
    if (logged) w += '<div class="kxc-row" style="margin-top:10px"><button class="kxc-btn l" type="button" id="kxc-save">Save this X-ray to my account</button></div>' +
      (x.root ? '<label class="kxc-chk"><input type="checkbox" id="kxc-rem"' + (S.seen && S.seen.optin ? ' checked' : '') + '><span>Email me once tomorrow with a link to this X-ray if I have not ordered a check. One email, then nothing.</span></label>' : '');
    if (x.root) w += '<form class="kxc-form" id="kxc-em" novalidate><label class="kxc-m" for="kxc-ee" style="flex-basis:100%">Email me this X-ray (we send a confirmation link first):</label><input id="kxc-ee" type="email" autocomplete="email" placeholder="you@example.com" required><input class="kxc-hp" tabindex="-1" aria-hidden="true" name="hp"><button class="kxc-btn l" type="submit">Email me</button></form>';
    if (w) h += sec('kxc-keep', '<p class="kxc-k">Keep it</p><h3>Save and watch</h3>' + (n && n.url ? '<p class="kxc-m">Full dossier: <a href="' + esc(n.url) + '">' + esc(n.name) + '</a>.</p>' : '') + w + '<p class="kxc-msg" id="kxc-keep-m" aria-live="polite"></p>');
    return h;
  }
  function panel(logged, I, x) {
    var name = I.name || x.domain || x.q;
    var sum = '<p><b>' + esc(name) + '</b>' + (x.url ? '<br><span class="kxc-m">' + esc(x.url) + '</span>' : '') + (x.xurl ? '<br><span class="kxc-m">X-ray: <a href="' + esc(x.xurl) + '">' + esc(x.xurl.replace('https://', '')) + '</a></span>' : '') + '</p>';
    if (logged) return sum + '<p class="kxc-m">We open a case for this project in your account with the X-ray linked, then take you to the existing secure PayPal page (card or PayPal, no account needed).</p><div class="kxc-row"><button class="kxc-btn" type="button" id="kxc-go">Open my case and pay €490</button></div><p class="kxc-msg" id="kxc-pan-m" aria-live="polite"></p>';
    var next = location.pathname + location.search + '#kxc-buy';
    return sum + '<p class="kxc-m">Create a free account (or log in) so the case, the X-ray and the report are saved to you. Or pay first: we then confirm your case and email you a login the same day.</p>' +
      '<div class="kxc-row"><a class="kxc-btn" id="kxc-login" href="/login/?next=' + encodeURIComponent(next) + '#signup">Create account and open my case</a><a class="kxc-btn l" id="kxc-pp" href="' + PAY + '" rel="noopener" data-ev="pay_check_xray">Pay €490 now by card or PayPal</a></div>';
  }
  function msg(id, t, bad) { var m = $(id); if (m) { m.textContent = t; m.className = 'kxc-msg' + (bad ? ' bad' : ''); } }
  function bind() {
    var el = S.el; if (!el) return;
    var ob = $('kxc-open'); if (ob) ob.onclick = function () { S.open = !S.open; ob.setAttribute('aria-expanded', S.open ? 'true' : 'false'); var p = $('kxc-pan'); if (p) p.hidden = !S.open; if (S.open) track('checkout_opened'); };
    var go = $('kxc-go'); if (go) go.onclick = function () { checkout(go); };
    var pp = $('kxc-pp'); if (pp) pp.addEventListener('click', function () { track('checkout_paypal'); ga('begin_checkout', { value: 490, currency: 'EUR', source: 'xray' }); });
    var lg = $('kxc-login'); if (lg) lg.addEventListener('click', function () { track('checkout_opened', { via: 'login' }); });
    var sm = $('kxc-sample'); if (sm) sm.addEventListener('click', function () { track('sample_open'); });
    var cp = $('kxc-copy'); if (cp) cp.onclick = function () { var t = qText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { msg('kxc-q-m', 'Copied. Paste them into an email or chat with the developer.'); }, function () { msg('kxc-q-m', 'Could not copy automatically: select the questions above.', 1); }); track('questions_copied'); };
    var ml = $('kxc-mail'); if (ml) ml.addEventListener('click', function () { track('questions_mailto'); });
    var mb = $('kxc-mon-b'); if (mb) mb.onclick = function () { monitor(mb); };
    var wf = $('kxc-watch'); if (wf) wf.onsubmit = function (e) { e.preventDefault(); var em = $('kxc-we').value.trim(); if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(em)) { msg('kxc-keep-m', 'Please enter a valid email address.', 1); return; }
      post('/api/v1/watch', { project: S.ctx.named.slug, email: em, hp: wf.querySelector('[name=hp]').value }).then(function (r) { if (r && r.ok) { msg('kxc-keep-m', r.confirmed ? 'You already watch this project.' : 'Check your inbox and confirm: then we email you when it changes.'); track('watch'); } else msg('kxc-keep-m', r && r.error === 'rate' ? 'Too many requests. Try again in a few minutes.' : 'Could not start the watch (' + ((r && r.error) || 'error') + ').', 1); }); };
    var ef = $('kxc-em'); if (ef) ef.onsubmit = function (e) { e.preventDefault(); var em = $('kxc-ee').value.trim(); if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(em)) { msg('kxc-keep-m', 'Please enter a valid email address.', 1); return; }
      var x = inp(); post('/api/x/xc/email', { email: em, root: x.root, domain: x.domain, hp: ef.querySelector('[name=hp]').value }).then(function (r) { if (r && r.ok) msg('kxc-keep-m', 'We sent a confirmation link to ' + em + '. Click it and the X-ray link follows.'); else msg('kxc-keep-m', r && r.error === 'rate' ? 'Too many requests. Try again later.' : r && r.error === 'limit' ? 'This address got the most X-ray emails allowed today.' : 'Could not send (' + ((r && r.error) || 'error') + ').', 1); }); };
    var sv = $('kxc-save'); if (sv) sv.onclick = function () { save(sv); };
    var rm = $('kxc-rem'); if (rm) rm.onchange = function () { var x = inp(); post('/api/x/xc/seen', { token: token(), root: x.root, domain: x.domain, url: x.url, optin: rm.checked, lang: (S.st && S.st.lang) || 'en' }).then(function (r) { if (r && r.ok) { S.seen = r; msg('kxc-keep-m', r.optin ? (r.stopped ? 'Saved, but you stopped X-ray reminders earlier, so none will be sent.' : 'Done: one reminder tomorrow if you have not ordered.') : 'No reminder will be sent.'); } else msg('kxc-keep-m', 'Could not save the reminder choice.', 1); }); };
    var g = $('kxc-gaps'); if (g && window.IntersectionObserver && S.st && S.st.phase === 'done') { var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { track('gaps_viewed'); io.disconnect(); } }); }, { threshold: 0.4 }); io.observe(g); }
  }
  function refFor(q) { var k = String(q || '').trim().replace(/\s+/g, ' ').slice(0, 300).toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, ''); return crypto.subtle.digest('SHA-256', new TextEncoder().encode(k)).then(function (b) { return 'CHK-' + hex(b).slice(0, 10).toUpperCase(); }); }
  function save(b) {
    var x = inp(), I = ident(); b.disabled = true;
    refFor(x.url || x.q).then(function (ref) { return portal('save_project', { ref: ref, snap: { u: x.url || '', q: x.q || '', t: Date.now(), w: true, proj: I.name || '', dev: I.dev || '', x: x.root || '' }, note: ('Project X-ray ' + (x.xurl || '')).slice(0, 500) }); })
      .then(function (r) { b.disabled = false; if (r && !r.error) { b.textContent = 'Saved and watched ✓'; msg('kxc-keep-m', 'Saved to your account: it appears under your checks, watched for changes.'); track('watch', { via: 'account' }); } else msg('kxc-keep-m', r && r.error === 'auth' ? 'Your session expired: log in again.' : 'Could not save (' + ((r && r.error) || 'error') + ').', 1); });
  }
  function openCase(note) {
    var x = inp(), I = ident();
    return portal('new_case', { project_url: x.url || '' }).then(function (d) {
      if (!d || d.error || !d.cases || !d.cases[0]) return { error: (d && d.error) || 'case' };
      var nc = d.cases[0];
      return portal('update_case', { case_id: nc.id, project_name: (I.name || x.domain || x.q || '').slice(0, 200), developer: (I.dev || '').slice(0, 200), location: '', price_text: '', next_payment_date: '', next_payment_amount: '', project_url: x.url || '', contract_url: '',
        user_notes: ('Opened from Project X-ray ' + (x.xurl || '(not sealed)') + ' of ' + (x.url || x.q || '') + (note ? '. ' + note : '')).slice(0, 2000) }).then(function () { return { nc: nc, D: d }; });
    });
  }
  function checkout(b) {
    b.disabled = true; msg('kxc-pan-m', 'Opening a case for this project…');
    openCase().then(function (r) {
      if (r.error) { b.disabled = false; msg('kxc-pan-m', r.error === 'network' ? 'Could not reach the server. Check your connection and try again.' : r.error === 'auth' ? 'Your session expired: log in again.' : 'Could not open a case (' + r.error + '). Try again.', 1); return; }
      track('checkout_paypal'); ga('begin_checkout', { value: 490, currency: 'EUR', source: 'xray' });
      var unpaid = ((r.D && r.D.cases) || []).filter(function (c) { return !c.paid; }).length;
      msg('kxc-pan-m', 'Case ' + r.nc.code + ' opened with this X-ray. Taking you to PayPal…');
      var go = function () { location.href = PAY; };
      if (unpaid > 1) { portal('pay_next', { case_id: r.nc.id }).then(go, go); setTimeout(go, 4000); } else setTimeout(go, 600);
    });
  }
  function monitor(b) {
    track('monitor_opened');
    if (!token()) { location.href = '/login/?next=' + encodeURIComponent(location.pathname + location.search + '#kxc-mon') + '#signup'; return; }
    b.disabled = true; msg('kxc-mon-m', 'Opening a case with your monitoring request…');
    openCase('Monitoring requested').then(function (r) {
      if (r.error) { b.disabled = false; msg('kxc-mon-m', 'Could not open a case (' + r.error + ').', 1); return; }
      portal('message', { case_id: r.nc.id, body: 'Please add construction monitoring (€99 per month, per property) for this project, from my Project X-ray ' + (inp().xurl || '') + '.' }).then(function () {
        msg('kxc-mon-m', 'Case ' + r.nc.code + ' opened with your monitoring request. We reply in your portal; nothing is charged until you agree.'); });
    });
  }

  // ---------------------------------------------------------------- lifecycle
  function loadCtx() {
    var x = inp(), key = (x.url || x.q || '') + '|' + (location.search.match(/[?&]cta=[AB]/) || [''])[0]; if (!x.url && !x.q) return Promise.resolve();
    if (S.ctxFor === key && S.ctx) return Promise.resolve();
    S.ctxFor = key;
    var cta = (location.search.match(/[?&]cta=([AB])/) || [])[1];
    return fetch('/api/x/xc/ctx?' + (x.url ? 'url=' + encodeURIComponent(x.url) : 'q=' + encodeURIComponent(x.q)) + '&b=' + bucket() + (cta ? '&cta=' + cta : '')).then(function (r) { return r.json(); }).then(function (c) { if (c && c.ok) S.ctx = c; }).catch(function () {});
  }
  function draw() { if (!S.el) return; addCss(); var f = document.activeElement && document.activeElement.id, keep = {}; S.el.querySelectorAll('input[id]').forEach(function (i) { keep[i.id] = i.type === 'checkbox' ? i.checked : i.value; });
    S.el.className = 'kxc'; S.el.innerHTML = html(); bind();
    Object.keys(keep).forEach(function (k) { var i = $(k); if (i) { if (i.type === 'checkbox') i.checked = keep[k]; else i.value = keep[k]; } });
    if (f && $(f) && /^kxc-/.test(f)) try { $(f).focus(); } catch (e) {} }
  function onState(st) {
    if (!st) return;
    var prev = S.st, newRun = !prev || ((prev.input || {}).q !== (st.input || {}).q) || (prev.root && st.root && prev.root !== st.root);
    if (newRun) { S.sid = Math.random().toString(36).slice(2, 12); S.sent = {}; S.open = /#kxc-buy$/.test(location.hash); S.seen = null; }
    S.st = st;
    var el = S.el || $('xr-conv'); if (!el) return; S.el = el;
    var x = inp();
    if (st.phase === 'start' || newRun) track('pasted');
    if ((st.cards || []).length) track('first_card');
    loadCtx().then(function () {
      draw();
      if (st.phase === 'done') {
        track('full'); track('run', { cards: (st.cards || []).length, named: (S.ctx && S.ctx.named && S.ctx.named.slug) || null });
        if (token() && x.root && !S.seen) post('/api/x/xc/seen', { token: token(), root: x.root, domain: x.domain, url: x.url, lang: st.lang || 'en' }).then(function (r) { if (r && r.ok) { S.seen = r; var c = $('kxc-rem'); if (c) c.checked = !!r.optin; } });
        if (S.open && location.hash === '#kxc-buy') { var b = $('kxc-buy'); if (b && b.scrollIntoView) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }
    });
  }
  K.render = function (el, st, opt) { S.el = el; S.mode = (opt && opt.mode) || 'run'; onState(st); };
  K.gaps = gaps; K.questions = questions; K.track = track;
  document.addEventListener('kb:xray', function (e) { if (e && e.detail && S.mode === 'run') onState(Object.assign({}, e.detail, { cards: e.detail.cards || (S.st && S.st.cards) || [] })); });
  function hook() { if (window.KBX && typeof window.KBX.on === 'function' && !K._on) { K._on = 1; window.KBX.on(function (st) { if (S.mode === 'run') onState(st); }); return true; } return false; }
  if (!hook()) { var n = 0, iv = setInterval(function () { if (hook() || ++n > 40) clearInterval(iv); }, 250); }
})();
