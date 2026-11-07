// kolaboro.com, batch 11 (x11c, 7 Nov 2026): the honest conversion block of the Project X-ray. Routed from index.js (KXC regex).
// Facts only. Prices and promises are copied from /pricing and /book; nothing here changes a price or the PayPal checkout.
//   GET  /api/x/xc/ctx?url=|q=&lang=&b=&cta=   context for the block: named-project match (from our data), real counters (hidden below 3),
//                                              CTA copy variant (worker flag KB_XRAY_CTA = A | B | AB, default A), monitoring offer
//                                              (only for off-plan / under construction with a future handover), sample report, offer text
//   POST /api/x/xc/ev {step, domain, root, v, sid, src, cards, named}   anonymous funnel step into kolaboro_events (kinds xray_*)
//   POST /api/x/xc/email {email, root, domain}  "email me this X-ray": a confirmation email first (double opt-in)
//   GET|POST /api/x/xc/email/confirm?t=         confirmation page (GET shows a button, POST sends the X-ray link once)
//   POST /api/x/xc/seen {token, root, domain, url, optin}   logged-in buyer saw an X-ray; optin = one reminder after 24 h if unpaid
//   GET  /api/x/xc/stop?t=                      one-click stop of X-ray reminders (link in the reminder email)
//   GET  /api/x/xc/status                       what is live (DB functions, mail path, flag)
//   GET  /embed/xray.js | /embed/xray/          "X-ray this project" button for agencies and lenders, and its documentation page
//   GET  /__k/kxc-admin.js                      admin CRM tab "X-rays" (RPC kolaboro_xc_admin, admin key)
// DB: RPC kolaboro_xc (worker key) and kolaboro_xc_admin (admin key), cron kolaboro-xray-remind (see /home/claude/wtk/x11c/MIGRATION.sql).
import { rpcW, sha } from './kolaboro.js';

export const PATHS = /^\/k\/xray-cta\.js$|^\/api\/x\/xc(\/|$)|^\/embed\/xray(\.js|\/)?$|^\/__k\/kxc-admin\.js$/;
const SITE = 'https://kolaboro.com';
const PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';   // the existing PayPal checkout, unchanged
const te = new TextEncoder();
const STEPS = /^(run|pasted|first_card|full|gaps_viewed|questions_copied|questions_mailto|checkout_opened|checkout_paypal|monitor_opened|watch|email_req|email_sent|sample_open|embed_click|remind_optin)$/;
const ROOT_RX = /^[0-9a-f]{16,64}$/;
const DOM_RX = /^[a-z0-9][a-z0-9.-]{1,252}$/;
const EMAIL_RX = /^[^@\s<>"',;]+@[^@\s<>"',;]+\.[^@\s<>"',;]+$/;

// A/B-ready copy slots. No urgency, no scarcity, no promised outcome: both variants say the same facts differently.
const COPY = {
  A: { h: 'What the X-ray could not verify online', sub: 'Free sources stop at the website. The €490 check sends a local agent to the land office and the plot, and reads your contract.', cta: 'Order the €490 check for this project' },
  B: { h: 'The gaps a website cannot close', sub: 'Each gap below needs a person at the land office, on the site or with your contract. That is what the €490 check does.', cta: 'Have these gaps checked, €490' },
};
// What /pricing and /book promise today (copied, not paraphrased into new promises)
const OFFER = {
  price: '€490', per: 'one-off, per property', refund: 'Full refund if we cannot take your case.',
  items: ['Title and zoning checked at the land office', "Permits and the developer's track record", 'Contract read for risky clauses', 'Site visit with GPS-stamped photos and video', 'Written report, reviewed by a senior reviewer'],
  timeline: [['Same day', 'We confirm your case and email you a login to it.'], ['Within 2 days', 'Documents: land certificate, permit and contract are shared and read.'],
    ['Within 5 days', 'Land office and site visit: title checked, plot filmed with GPS- and time-stamped photos.'], ['Usually within 7 days', 'Written report: nine checks, every finding linked to its evidence.']],
  pay: PAY, book: '/book/', pricing: '/pricing',
};
const MONITOR = { price: '€99', per: 'per month, per property', items: ['Monthly GPS-stamped site visit', 'Milestone check before every payment', '"Go" or "hold" advice, based on the evidence', 'Delay alerts by email', 'Final handover inspection'] };
const SAMPLE = { url: '/report/sample', label: 'Sample client report', note: 'a fictional project in Bali, built like a real report' };

function out(o, s = 200, extra) { return new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, extra || {}) }); }
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hostOf = u => { try { return new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
const normU = u => String(u || '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
const ipOf = req => { const a = req.headers.get('cf-connecting-ip') || 'x'; return a.includes(':') ? a.split(':').slice(0, 4).join(':') + '::/64' : a; };
async function allow(ctx, key, limit, ttl) {   // soft fixed-window counter in the edge cache (per data centre)
  const k = new Request(SITE + '/__rlxc/' + encodeURIComponent(key));
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= limit) return false;
  const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=' + ttl } }));
  if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  return true;
}
async function body(req) { try { const t = await req.text(); if (t.length > 6000) return null; if (/^\s*\{/.test(t)) return JSON.parse(t); return Object.fromEntries(new URLSearchParams(t)); } catch (e) { return null; } }
async function xc(action, payload) { try { return await rpcW('kolaboro_xc', { p_action: action, p_payload: payload }); } catch (e) { return { error: 'db' }; } }
const dbMissing = r => !r || r.error === 'db' || r.code === 'PGRST202' || /Could not find the function/i.test(r.message || '');

// ------------------------------------------------------------------ named-project match (our public named index, Sumba excluded there)
let HM = null;
async function match(env, raw) {
  let N; try { N = await import('./kbx_named.js'); } catch (e) { return null; }
  let ix; try { ix = await N.data(env); } catch (e) { return null; }
  if (!HM || HM.ix !== ix) {
    const byU = new Map(), byH = new Map();
    for (const x of ix.P) for (const u of [x.url, x.du]) {
      if (!N.okHttp(u)) continue;
      byU.set(normU(u), x);
      if (!N.isListing(u)) { const h = hostOf(u); if (h) { const a = byH.get(h) || new Set(); a.add(x); byH.set(h, a); } }
    }
    HM = { ix, byU, byH };
  }
  const n = normU(raw), h = hostOf(raw);
  let x = HM.byU.get(n) || null, dev = null;
  const hs = h ? HM.byH.get(h) : null;
  if (!x && hs && hs.size === 1) x = [...hs][0];
  if (!x && hs && hs.size > 1) { const d = new Set([...hs].map(p => p.dvs).filter(Boolean)); if (d.size === 1) dev = ix.devs.get([...d][0]) || null; }
  if (x && x.dvs) dev = ix.devs.get(x.dvs) || null;
  if (!x && !dev) {   // a typed name: exact project name match only (no fuzzy guessing)
    const q = String(raw || '').trim().toLowerCase();
    if (q.length >= 4 && !/[./]/.test(q)) x = ix.P.find(p => String(p.n || '').toLowerCase() === q) || null;
    if (x && x.dvs) dev = ix.devs.get(x.dvs) || null;
  }
  if (!x && !dev) return null;
  let proj = null;
  if (x) {
    const ho = N.handoverOf(ix, x), c = ix.caseBy.get(x.id);
    proj = { id: x.id, slug: x.s, name: x.n, url: '/projects/' + x.s + '/', stage: x.st || (c && c.stage) || null, market: x.mk || null, country: x.co || null,
      handover: ho ? String(ho.d) : null, handover_future: ho ? future(String(ho.d)) : null, reviewed: N.reviewed(c) };
  }
  return { project: proj, developer: dev ? { slug: dev.s, name: dev.n, url: '/developers/' + dev.s + '/', projects: dev.ids.length } : null };
}
function future(d) {   // '2027-Q2' | '2027' | '2027-06' | '2027-06-30' -> is the end of that period after today?
  const m = String(d).match(/^(\d{4})(?:-(?:Q([1-4])|(\d{2})))?/i); if (!m) return null;
  const y = +m[1], end = m[2] ? new Date(Date.UTC(y, +m[2] * 3, 0)) : m[3] ? new Date(Date.UTC(y, +m[3], 0)) : new Date(Date.UTC(y, 11, 31));
  return end.getTime() > Date.now();
}
function variant(env, u) {
  const q = (u.searchParams.get('cta') || '').toUpperCase();
  if (q === 'A' || q === 'B') return q;   // preview override (QA, screenshots)
  const f = String(env.KB_XRAY_CTA || 'A').toUpperCase();
  if (f === 'B') return 'B';
  if (f === 'AB') { const b = +u.searchParams.get('b'); return Number.isFinite(b) && b >= 50 ? 'B' : 'A'; }
  return 'A';
}

async function ctxRoute(req, u, env, ctx) {
  const raw = (u.searchParams.get('url') || u.searchParams.get('q') || '').slice(0, 400);
  const domain = /[.]/.test(raw) && !/\s/.test(raw.trim()) ? hostOf(raw) : '';
  const v = variant(env, u);
  const m = raw ? await match(env, raw) : null;
  let counts = { runs: null, watchers: null, threshold: 3 }, db = null;
  if (domain || (m && m.project)) {
    const ck = new Request(SITE + '/__xcc/' + encodeURIComponent(domain + '|' + ((m && m.project && m.project.id) || '')));
    const hit = await caches.default.match(ck);
    let r = hit ? await hit.json() : null;
    if (!r) { r = await xc('counts', { domain, ref: (m && m.project && m.project.id) || '' }); if (r && r.ok) ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(r), { headers: { 'cache-control': 'max-age=60' } }))); }
    db = !dbMissing(r) && r && r.error !== 'unauthorized';
    if (r && r.ok) counts = { runs: r.runs || null, watchers: r.watchers || null, threshold: r.threshold || 3 };
  }
  const p = m && m.project;
  const stage = p && p.stage ? String(p.stage).toLowerCase() : '';
  const monitoring = p ? { offered: /off-plan|under construction|pre-?launch|launch/.test(stage) && p.handover_future === true, stage: p.stage, handover: p.handover, source: p.url } : { offered: null };
  return out({ ok: true, v, copy: COPY[v], domain: domain || null, named: m ? m.project : null, developer: m ? m.developer : null, counts, db,
    monitoring, monitor_offer: MONITOR, offer: OFFER, sample: SAMPLE, watch_api: '/api/v1/watch', mail: true }, 200, { 'cache-control': 'private, max-age=30' });
}

// ------------------------------------------------------------------ funnel events
async function evRoute(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
  const b = await body(req); if (!b) return out({ error: 'body' }, 400);
  const step = String(b.step || ''); if (!STEPS.test(step)) return out({ error: 'step' }, 400);
  const orig = req.headers.get('origin') || '', ours = /^https:\/\/(www\.)?kolaboro\.com$/.test(orig);
  const cors = { 'access-control-allow-origin': '*' };
  if (step === 'embed_click') {   // from a partner page: the partner host, nothing about the visitor
    const h = hostOf(orig || req.headers.get('referer') || b.h || '');
    if (!h || !DOM_RX.test(h) || !(await allow(ctx, 'xe|' + ipOf(req), 30, 600))) return out({ ok: false }, 200, cors);
    const r = await xc('ev', { step, domain: h, page: '/embed/xray.js', data: { src: 'embed' } });
    return out({ ok: !!(r && r.ok) }, 200, cors);
  }
  if (orig && !ours) return out({ error: 'origin' }, 403);
  if (!(await allow(ctx, 'xv|' + ipOf(req), 150, 600))) return out({ error: 'rate' }, 429);
  const domain = hostOf(String(b.domain || '')), root = ROOT_RX.test(String(b.root || '')) ? String(b.root) : null;
  const data = { root, v: /^[AB]$/.test(b.v) ? b.v : 'A', sid: /^[a-z0-9]{6,24}$/i.test(b.sid || '') ? b.sid : null, src: String(b.src || '').replace(/[^a-z0-9_.-]/gi, '').slice(0, 40) || null,
    cards: Number.isFinite(+b.cards) ? Math.min(99, Math.max(0, +b.cards | 0)) : null, named: /^[a-z0-9-]{1,90}$/.test(b.named || '') ? b.named : null, test: b.test ? '1' : undefined };
  if (step === 'run') data.ih = (await sha('kxc-ih|' + ipOf(req))).slice(0, 16);   // distinct-visitor counter, never the address itself
  const r = await xc('ev', { step, domain: DOM_RX.test(domain) ? domain : '', page: '/check/', data });
  if (dbMissing(r)) return out({ ok: false, stored: false, why: 'db functions not applied yet' }, 202);
  return out({ ok: !!(r && r.ok), error: r && r.error });
}

// ------------------------------------------------------------------ email me this X-ray (double opt-in), signed stateless token
function b64u(bytes) { let s = ''; bytes.forEach(x => s += String.fromCharCode(x)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unb64u(s) { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, c => c.charCodeAt(0)); }
async function hmac(env, msg) {
  const sec = env.KB_SIGN_KEY || env.KB_HOOK_KEY; if (!sec) return null;   // worker secrets only
  const k = await crypto.subtle.importKey('raw', te.encode('kolaboro-xc-mail-v1|' + sec), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, te.encode(msg))).slice(0, 16));
}
async function mkTok(env, o) { const p = b64u(te.encode(JSON.stringify(o))), s = await hmac(env, p); return s ? p + '.' + s : null; }
async function rdTok(env, t) {
  const m = String(t || '').match(/^([A-Za-z0-9_-]{20,400})\.([A-Za-z0-9_-]{22})$/); if (!m) return null;
  const s = await hmac(env, m[1]); if (!s || s !== m[2]) return null;
  let o; try { o = JSON.parse(new TextDecoder().decode(unb64u(m[1]))); } catch (e) { return null; }
  if (!o || !(o.x > Date.now()) || !EMAIL_RX.test(o.e || '') || !ROOT_RX.test(o.r || '') || !DOM_RX.test(o.d || '')) return null;
  return o;
}
async function emailRoute(req, u, env, ctx) {
  if (req.method !== 'POST') return out({ error: 'method' }, 405);
  const orig = req.headers.get('origin'); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return out({ error: 'origin' }, 403);
  const b = await body(req); if (!b) return out({ error: 'body' }, 400);
  if (b.hp) return out({ ok: true });   // honeypot: looks like success, nothing sent
  const e = String(b.email || '').trim().toLowerCase(), root = String(b.root || ''), d = hostOf(String(b.domain || '')), pu = String(b.url || '');
  if (e.length > 120 || !EMAIL_RX.test(e)) return out({ error: 'email' }, 400);
  if (!ROOT_RX.test(root) || !DOM_RX.test(d)) return out({ error: 'xray' }, 400);
  if (!(await allow(ctx, 'xm|' + ipOf(req), 5, 3600))) return out({ error: 'rate' }, 429);
  const t = await mkTok(env, Object.assign({ e, r: root, d, x: Date.now() + 7 * 86400000 }, /^https?:\/\/[^\s"<>]{3,240}$/.test(pu) && hostOf(pu) === d ? { u: pu } : {})); if (!t) return out({ error: 'not_configured' }, 503);
  const link = SITE + '/api/x/xc/email/confirm?t=' + t;
  const html = '<p>Someone, hopefully you, asked Kolaboro to email the Project X-ray of <b>' + esc(d) + '</b> to this address.</p>' +
    '<p>Confirm with the button below and we send the link to the X-ray once. If it was not you, ignore this email: nothing else will be sent.</p>';
  const r = await xc('mail', { kind: 'xray_confirm', to: e, subject: 'Confirm: email me the Project X-ray of ' + d, html, dedupe: 'xc:' + (await sha(e + '|' + root)).slice(0, 40), cta: 'Confirm and send', url: link });
  if (dbMissing(r)) return out({ error: 'not_ready', message: 'Email sending for X-rays is not switched on yet.' }, 503);
  if (!r || !r.ok) return out({ error: (r && r.error) || 'db' }, r && (r.error === 'limit' || r.error === 'daily_cap') ? 429 : 400);
  ctx.waitUntil(xc('ev', { step: 'email_req', domain: d, page: '/check/', data: { root } }));
  return out({ ok: true, next: r.duplicate ? 'already sent, check your inbox' : 'confirmation email sent' });
}
function page(title, inner, status) {
  const h = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    '<title>' + esc(title) + ' | Kolaboro</title><link rel="stylesheet" href="/k/site.css"><style>body{background:var(--paper,#F6F6F3);color:var(--ink,#17212B);margin:0}.xcw{max-width:620px;margin:0 auto;padding:40px 16px}' +
    '.xcc{background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:16px;padding:22px}.xcb{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:12px;border:0;background:var(--hivis,#FF5B14);color:#111;font:inherit;font-weight:800;cursor:pointer;text-decoration:none}' +
    '.xcb:focus-visible{outline:3px solid #2563EB;outline-offset:2px}.muted{color:var(--muted,#59626B)}</style></head><body><main class="xcw"><p><a href="/">kolaboro</a></p><div class="xcc">' + inner + '</div></main></body></html>';
  return new Response(h, { status: status || 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' } });
}
async function confirmRoute(req, u, env, ctx) {
  if (req.method === 'GET') {
    const t = u.searchParams.get('t') || '', o = await rdTok(env, t);
    if (!o) return page('Link not valid', '<h1>This link is not valid</h1><p class="muted">It may have expired after 7 days. Run the X-ray again and ask for the email from there.</p>', 400);
    return page('Confirm', '<h1>Send the Project X-ray of ' + esc(o.d) + '?</h1><p>We send one email with the link to the sealed X-ray to <b>' + esc(o.e) + '</b>. Nothing else.</p>' +
      '<form method="post" action="/api/x/xc/email/confirm"><input type="hidden" name="t" value="' + esc(t) + '"><button class="xcb" type="submit">Yes, send it</button></form>');
  }
  if (req.method !== 'POST') return out({ error: 'method' }, 405);
  const b = await body(req), o = await rdTok(env, b && b.t);
  if (!o) return page('Link not valid', '<h1>This link is not valid</h1><p class="muted">It may have expired after 7 days.</p>', 400);
  // The sealed copy lives in the edge cache until the durable X-ray store is applied, so the button re-runs the X-ray (always works)
  const xu = SITE + '/x/' + o.r + '/', ru = SITE + '/check/?url=' + encodeURIComponent(o.u || 'https://' + o.d) + '#xr';
  const html = '<p>Here is the Project X-ray of <b>' + esc(o.d) + '</b> you asked for. The button runs it again with today\'s sources. The sealed copy of the run you saw: <a href="' + xu + '">' + esc(xu.replace('https://', '')) + '</a> (kept while our storage allows; the button always works).</p>' +
    '<p>What the X-ray cannot show: the land title at the land office, the building permit file, what is really on the plot, and your contract terms. The €490 pre-purchase check covers those, with a full refund if we cannot take your case: <a href="' + SITE + '/pricing">pricing</a>.</p>';
  const r = await xc('mail', { kind: 'xray_send', to: o.e, subject: 'Your Project X-ray of ' + o.d, html, dedupe: 'xs:' + (await sha(b.t)).slice(0, 40), cta: 'Open the X-ray', url: ru });
  if (!r || !r.ok) return page('Not sent', '<h1>We could not send it</h1><p class="muted">' + esc(r && r.error === 'limit' ? 'This address got the most X-ray emails allowed today. Try tomorrow.' : 'Try again in a few minutes.') + '</p>', 503);
  ctx.waitUntil(xc('ev', { step: 'email_sent', domain: o.d, page: '/api/x/xc/email/confirm', data: { root: o.r } }));
  return page('Sent', '<h1>Sent</h1><p>' + (r.duplicate ? 'We already sent this X-ray to you; check your inbox and spam folder.' : 'Check your inbox in a minute.') + '</p><p><a class="xcb" href="' + esc(ru.replace(SITE, '')) + '">Open the X-ray now</a></p>');
}

// ------------------------------------------------------------------ seen (logged-in) and reminder stop
async function seenRoute(req, u, env, ctx) {
  if (req.method !== 'POST') return out({ error: 'method' }, 405);
  const orig = req.headers.get('origin'); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return out({ error: 'origin' }, 403);
  const b = await body(req); if (!b || !b.token) return out({ error: 'auth' }, 401);
  if (!(await allow(ctx, 'xs|' + ipOf(req), 60, 600))) return out({ error: 'rate' }, 429);
  const pl = { token: String(b.token).slice(0, 200), root: String(b.root || ''), domain: hostOf(String(b.domain || '')), url: String(b.url || '').slice(0, 300), lang: String(b.lang || 'en').slice(0, 5) };
  if (typeof b.optin === 'boolean') pl.optin = b.optin;
  const r = await xc('seen', pl);
  if (dbMissing(r)) return out({ ok: false, ready: false }, 202);
  if (r && r.ok && pl.optin) ctx.waitUntil(xc('ev', { step: 'remind_optin', domain: pl.domain, page: '/check/', data: { root: pl.root } }));
  return out(r && r.ok ? { ok: true, optin: !!r.optin, stopped: !!r.stopped } : { error: (r && r.error) || 'db' }, r && r.ok ? 200 : r && r.error === 'auth' ? 401 : 400);
}
async function stopRoute(req, u, env, ctx) {
  const t = u.searchParams.get('t') || '';
  const r = /^[0-9a-f]{32}$/.test(t) ? await xc('stop', { tok: t }) : { error: 'token' };
  if (!r || !r.ok) return page('Link not valid', '<h1>This link is not valid</h1><p class="muted">Write to hello@kolaboro.com and we stop every email by hand.</p>', 400);
  return page('Stopped', '<h1>Done: no more X-ray reminders</h1><p>We will not send you reminders about X-rays again. Emails about a case you open still arrive, because they are about your case.</p>');
}

// ------------------------------------------------------------------ embed for agencies and lenders
const EMBED_JS = `/* Kolaboro "X-ray this project" button v1. <script src="https://kolaboro.com/embed/xray.js" async></script>
   Options on the script tag: data-url (default: this page), data-label, data-theme="dark". Or put data-kolaboro-xray[="<url>"] on any
   element to get a button inside it. Privacy: no cookies, no storage, nothing is sent when the page loads; a click sends one beacon
   with this site's host name only (for the partner's click count), then opens the X-ray on kolaboro.com in a new tab. */
(function () {
  var O = 'https://kolaboro.com', s = document.currentScript;
  function btn(url, label, dark) {
    var a = document.createElement('a');
    a.href = O + '/check/?url=' + encodeURIComponent(url) + '&src=embed&utm_source=embed&utm_medium=partner&utm_campaign=' + encodeURIComponent(location.hostname) + '#xr';
    a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('data-kolaboro-btn', '1');
    a.setAttribute('style', 'display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border-radius:12px;font:600 15px/1.2 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-decoration:none;border:1px solid ' + (dark ? '#3a4652;background:#17212B;color:#F6F6F3' : '#D5D3CC;background:#fff;color:#17212B'));
    a.innerHTML = '<svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4v24M8 16 23 6.5M8 16l15 9.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="6" r="3.4" fill="currentColor"/><circle cx="24" cy="26" r="3.4" fill="currentColor"/><circle cx="8" cy="16" r="4.2" fill="#FF5B14"/></svg><span></span>';
    a.lastChild.textContent = label || 'X-ray this project';
    a.addEventListener('click', function () { try { var d = JSON.stringify({ step: 'embed_click', h: location.hostname }); if (navigator.sendBeacon) navigator.sendBeacon(O + '/api/x/xc/ev', new Blob([d], { type: 'text/plain' })); } catch (e) {} });
    return a;
  }
  var els = document.querySelectorAll('[data-kolaboro-xray]');
  for (var i = 0; i < els.length; i++) { var e = els[i]; if (e.querySelector('[data-kolaboro-btn]')) continue; e.appendChild(btn(e.getAttribute('data-kolaboro-xray') || location.href, e.getAttribute('data-label'), e.getAttribute('data-theme') === 'dark')); }
  if (s && !els.length && s.parentNode) s.parentNode.insertBefore(btn(s.getAttribute('data-url') || location.href, s.getAttribute('data-label'), s.getAttribute('data-theme') === 'dark'), s);
})();
`;
function embedDoc() {
  const snip = '<script src="https://kolaboro.com/embed/xray.js" async></script>';
  const inner = '<p class="muted" style="margin:0">For agencies, lenders and listing sites</p><h1 style="margin:.2em 0">"X-ray this project" button</h1>' +
    '<p>Add one line to a listing page. Your visitors get a button that opens a free Project X-ray of that listing on kolaboro.com: register checks, the Internet Archive history of the developer site, red flags with quotes, and the gaps only a site visit can close.</p>' +
    '<h2 style="font-size:1.1rem">Paste this where the button should appear</h2><pre style="white-space:pre-wrap;word-break:break-all;background:var(--paper,#F6F6F3);border:1px solid var(--line,#ddd);border-radius:10px;padding:12px;font-size:.85rem"><code>' + esc(snip) + '</code></pre>' +
    '<p><button class="xcb" type="button" id="cp">Copy the snippet</button></p>' +
    '<h2 style="font-size:1.1rem">Options</h2><ul><li><code>data-url="https://..."</code> the project page to X-ray (default: the page the button is on)</li><li><code>data-label="..."</code> your own button text</li><li><code>data-theme="dark"</code> for dark pages</li><li>Several listings on one page: put <code>data-kolaboro-xray="https://..."</code> on each element and load the script once.</li></ul>' +
    '<h2 style="font-size:1.1rem">Privacy</h2><p>No cookies, no local storage, no request when your page loads. A click sends one beacon with your site\'s host name only, so we can tell you how many clicks your site sent. We never learn who your visitors are from the button.</p>' +
    '<h2 style="font-size:1.1rem">Try it</h2><div data-kolaboro-xray="https://www.teus-group.com/amani-melasti"></div><p class="muted" style="font-size:.85rem">This demo button X-rays a public developer page. Clicks on this page are counted for kolaboro.com.</p>';
  const h = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>X-ray button for partners | Kolaboro</title>' +
    '<meta name="description" content="One script tag adds an X-ray this project button to any listing page. No cookies, no visitor tracking, only a click count."><link rel="canonical" href="https://kolaboro.com/embed/xray/">' +
    '<link rel="stylesheet" href="/k/site.css"><style>body{background:var(--paper,#F6F6F3);color:var(--ink,#17212B);margin:0}.xcw{max-width:760px;margin:0 auto;padding:32px 16px 60px}.xcc{background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:16px;padding:22px}' +
    '.xcb{display:inline-flex;align-items:center;min-height:44px;padding:0 18px;border-radius:12px;border:0;background:var(--hivis,#FF5B14);color:#111;font:inherit;font-weight:800;cursor:pointer}.xcb:focus-visible{outline:3px solid #2563EB;outline-offset:2px}.muted{color:var(--muted,#59626B)}code{overflow-wrap:anywhere}</style></head>' +
    '<body><main class="xcw"><p><a href="/">kolaboro</a> / <a href="/docs/api">API</a> / X-ray button</p><div class="xcc">' + inner + '</div></main>' +
    '<script>document.getElementById("cp").onclick=function(){var t=' + JSON.stringify(snip) + ',b=this;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copied";},function(){b.textContent="Select the text above";});};</script>' +
    '<script src="/embed/xray.js" async></script></body></html>';
  return new Response(h, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-content-type-options': 'nosniff' } });
}

// ------------------------------------------------------------------ admin CRM tab
const ADMIN_JS = `/* kolaboro.com/admin: "X-rays" tab (x11c, 7 Nov 2026). Recent Project X-rays (domain, time, cards, checkout, paid), the anonymous
   funnel per CTA variant, partner embed clicks and reminders. Data: RPC kolaboro_xc_admin (admin key). */
(function () {
  if (window.__kxcadm) return; window.__kxcadm = 1;
  var days = 30, busy = false, STEPS = ['pasted', 'first_card', 'full', 'run', 'gaps_viewed', 'questions_copied', 'questions_mailto', 'checkout_opened', 'checkout_paypal', 'monitor_opened', 'watch', 'email_req', 'email_sent', 'sample_open', 'remind_optin'];
  function $(i) { return document.getElementById(i); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function when(t) { var d = new Date(t), s = (Date.now() - d) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + d.toTimeString().slice(0, 5); }
  function table(head, rows) { if (!rows.length) return '<p class="muted" style="margin:6px 0">Nothing yet in this period.</p>'; return '<div class="tw"><table><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }
  function kpi(a, b, c) { return '<div class="kpi"><span>' + a + '</span><b>' + b + '</b><small>' + c + '</small></div>'; }
  function yes(b) { return b ? '<b style="color:#0A704E">yes</b>' : '<span class="muted">no</span>'; }
  function render(d) {
    var X = d.xrays || [], F = d.funnel || [], R = d.reminders || {}, vs = {};
    F.forEach(function (f) { (vs[f.v] = vs[f.v] || {})[f.step] = f.sessions; });
    var paid = X.filter(function (x) { return x.paid; }).length, co = X.filter(function (x) { return x.checkout; }).length;
    var h = '<div class="kpis">' + kpi('X-rays run', X.length, 'last ' + days + ' days (max 200 listed)') + kpi('Checkout opened', co, X.length ? Math.round(100 * co / X.length) + '% of X-rays' : '') +
      kpi('Paid cases from an X-ray', paid, 'case notes link the X-ray') + kpi('Reminder opt-ins', R.optins || 0, (R.sent || 0) + ' sent, ' + (R.stopped || 0) + ' stopped') + kpi('X-ray emails', d.emails || 0, 'confirmations and sends') + '</div>';
    h += '<h3>Funnel by CTA variant (sessions)</h3>' + table(['Step'].concat(Object.keys(vs).sort()), STEPS.filter(function (s) { return Object.keys(vs).some(function (v) { return vs[v][s]; }); }).map(function (s) { return [esc(s.replace(/_/g, ' '))].concat(Object.keys(vs).sort().map(function (v) { return vs[v][s] || 0; })); }));
    h += '<h3>Recent X-rays</h3>' + table(['When', 'Domain', 'Cards', 'Named', 'Variant', 'Source', 'Checkout', 'PayPal', 'Case', 'Paid', 'X-ray'], X.slice(0, 120).map(function (x) {
      return [esc(when(x.at)), esc(x.domain || ''), esc(x.cards || ''), x.named ? '<a href="/projects/' + esc(x.named) + '/" target="_blank" rel="noopener">' + esc(x.named) + '</a>' : '', esc(x.v || 'A'), esc(x.src || ''), yes(x.checkout), yes(x.paypal), yes(x.case_opened), yes(x.paid), x.root ? '<a href="/x/' + esc(x.root) + '/" target="_blank" rel="noopener">open</a>' : ''];
    }));
    h += '<h3>Partner buttons (embed clicks)</h3>' + table(['Partner site', 'Clicks', 'Last'], (d.embeds || []).map(function (e) { return [esc(e.host), e.n, esc(when(e.last))]; }));
    $('t-xrays-body').innerHTML = h;
  }
  function load() {
    if (busy || !window.KBADM) return; busy = true; $('t-xrays-body').innerHTML = '<p class="muted">Loading…</p>';
    window.KBADM.rpc('kolaboro_xc_admin', { p_key: window.KBADM.pw(), p_days: days }).then(function (d) {
      busy = false; if (!d || d.error || d.code) { $('t-xrays-body').innerHTML = '<p class="muted">Could not load (' + esc(d && (d.error || d.message)) + ').</p>'; return; } render(d);
    }).catch(function () { busy = false; $('t-xrays-body').innerHTML = '<p class="muted">Could not load.</p>'; });
  }
  function setup() {
    var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main || !window.KBADM) return false;
    if ($('t-xrays')) return true;
    var b = document.createElement('button'); b.setAttribute('data-t', 'xrays'); b.textContent = 'X-rays';
    var tr = nav.querySelector('[data-t="traffic"]') || nav.querySelector('[data-t="growth"]'); nav.insertBefore(b, tr || null);
    var sec = document.createElement('section'); sec.id = 't-xrays'; sec.className = 'hide';
    sec.innerHTML = '<div style="display:flex;gap:8px;align-items:center;margin:0 0 12px;flex-wrap:wrap"><b>Period</b>' + [7, 30, 90].map(function (n) { return '<button data-xdays="' + n + '" style="padding:6px 12px;border-radius:999px;border:1px solid #ddd;background:' + (n === days ? '#111;color:#fff' : '#fff') + ';cursor:pointer">' + n + ' days</button>'; }).join('') + '</div><div id="t-xrays-body"></div>';
    main.appendChild(sec);
    sec.querySelectorAll('[data-xdays]').forEach(function (x) { x.onclick = function () { days = +x.getAttribute('data-xdays'); sec.querySelectorAll('[data-xdays]').forEach(function (y) { var on = y === x; y.style.background = on ? '#111' : '#fff'; y.style.color = on ? '#fff' : ''; }); load(); }; });
    b.onclick = function () {
      nav.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      main.querySelectorAll(':scope > section').forEach(function (s) { s.classList.toggle('hide', s !== sec); });
      load();
    };
    nav.querySelectorAll('button').forEach(function (x) { if (x !== b) x.addEventListener('click', function () { b.classList.remove('on'); sec.classList.add('hide'); }); });
    if (location.hash === '#xrays') b.click();
    return true;
  }
  var n = 0, iv = setInterval(function () { if (setup() || ++n > 120) clearInterval(iv); }, 500);
})();
`;

async function status(env) {
  const r = await xc('counts', { domain: 'kolaboro.com' });
  return out({ ok: true, db_functions: !dbMissing(r) && !!(r && r.ok), mail_signing: !!(env.KB_SIGN_KEY || env.KB_HOOK_KEY), cta_flag: String(env.KB_XRAY_CTA || 'A'),
    reminder_cron: 'kolaboro-xray-remind, hourly at :37 (DB)', threshold: 3, prices: { check: OFFER.price, monitoring: MONITOR.price + ' ' + MONITOR.per }, pay: PAY });
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname;
  if (p === '/k/xray-cta.js') {   // served here with a short cache, so pages that load it with a fixed ?v= still get fixes within minutes
    const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com/k/xray-cta.js'));
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
  }
  if (p === '/embed/xray.js') return new Response(EMBED_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff', 'cross-origin-resource-policy': 'cross-origin' } });
  if (p === '/embed/xray' || p === '/embed/xray/') return p.endsWith('/') ? embedDoc() : new Response(null, { status: 301, headers: { location: '/embed/xray/' } });
  if (p === '/__k/kxc-admin.js') return new Response(ADMIN_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'no-store' } });
  try {
    if (p === '/api/x/xc/ctx' && req.method === 'GET') return await ctxRoute(req, u, env, ctx);
    if (p === '/api/x/xc/ev') return await evRoute(req, u, env, ctx);
    if (p === '/api/x/xc/email') return await emailRoute(req, u, env, ctx);
    if (p === '/api/x/xc/email/confirm') return await confirmRoute(req, u, env, ctx);
    if (p === '/api/x/xc/seen') return await seenRoute(req, u, env, ctx);
    if (p === '/api/x/xc/stop' && req.method === 'GET') return await stopRoute(req, u, env, ctx);
    if (p === '/api/x/xc/status' || p === '/api/x/xc') return await status(env);
  } catch (e) { return out({ error: 'server', message: String(e && e.message || e).slice(0, 200) }, 500); }
  return out({ error: 'not found' }, 404);
}
