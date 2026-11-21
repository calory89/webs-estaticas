// kolaboro.com (n31a, batch 31, 18 Nov 2026): conversion. No paid AI, no database reads or writes in this file.
//   2   POST /api/open/fn?s=<step>             one funnel step, sent once per browser session by /k/site.js (no cookie, id or address kept)
//       GET  /[lang/]funnel/                   the funnel: project page -> check -> email -> booking -> payment, last 28 days
//       GET  /api/open/funnel                  the same as JSON
//   17  GET  /[lang/]request-project/          "Ask us to add a project" (the existing lead function, p_plan project-request)
//   24  GET  /[lang/]report/sample/<slug>/     a real desk report built only from a real project's public data (fixed list of slugs)
//   33, 34, 56  GET /[lang/]business/          agencies, lawyers and listing sites: what is free today, what a check costs, what is not offered
//   42  GET  /[lang/]money/                    what happens to what a buyer pays us
//   48  POST /api/open/sv?id=<ID>, GET /api/open/sv?id=<ID>   saves of a project counted at the edge, shown only from 3 ("at least")
//   50  the exit question at the end of project pages posts its answer as a funnel step (miss_<answer>)
//   51  GET  /[lang/]already-signed/           for buyers who already signed
//   21  ctaHtml(): the sticky "Check this project" button on project pages (used by kbx_named.js)
//   7, 23, 39, 40, 43, 44, 45, 46, 53, 58: offers that change money or promises, built behind env flags that are OFF (see OFFERS).
// Counters live in the Cloudflare colo cache like kbx_n27a.js usage counters: lower bounds, per location, up to 35 days.
// page text lives in /data/n31a-i18n.json (kept out of the worker bundle, which is near the 25 MiB Pages limit); loaded per isolate
let T = null;
async function loadT(env) {
  if (T) return T;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n31a-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
  if (!T) { try { const r = await fetch(ORIGIN + '/data/n31a-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
  return T;
}
const CTA = {"en":["Check this project","€490 · written report usually within 7 days"],"es":["Comprobar este proyecto","490 € · informe escrito, normalmente en 7 días"],"de":["Dieses Projekt prüfen","490 € · schriftlicher Bericht meist innerhalb von 7 Tagen"],"fr":["Vérifier ce projet","490 € · rapport écrit, en général sous 7 jours"],"nl":["Dit project controleren","€ 490 · schriftelijk rapport meestal binnen 7 dagen"],"ru":["Проверить этот проект","490 € · письменный отчёт обычно за 7 дней"],"zh":["核查这个项目","490 欧元 · 书面报告通常 7 天内完成"],"ar":["افحص هذا المشروع","490 يورو · تقرير مكتوب عادةً خلال 7 أيام"]};   // item 21 button text, needed synchronously by kbx_named.js

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const SR_SLUGS = new Set(['crown-penang']);   // item 24: real desk reports; one page per listed project only (no new page family)
const RX = {
  fn: new RegExp('^\\/' + LP + 'funnel\\/?$'), rq: new RegExp('^\\/' + LP + 'request-project\\/?$'), bz: new RegExp('^\\/' + LP + 'business\\/?$'),
  mo: new RegExp('^\\/' + LP + 'money\\/?$'), as: new RegExp('^\\/' + LP + 'already-signed\\/?$'), sr: new RegExp('^\\/' + LP + 'report\\/sample\\/([a-z0-9-]{1,90})\\/?$')
};
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:funnel|request-project|business|money|already-signed|report\/sample\/[a-z0-9-]{1,90})\/?$|^\/api\/open\/(?:fn|funnel|sv)$/;
const pre = l => l === 'en' ? '' : '/' + l;
const LOCAL_PATHS = new Set(['/projects/', '/tools/bulk-check/', '/tools/widget/', '/tools/contract-reader/', '/api/docs/', '/pricing/', '/buyer-protection-law/', '/check/']);
const lk = (l, p) => (LOCAL_PATHS.has(p) ? pre(l) : '') + p;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d; } };
const day = o => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
const dirA = l => l === 'ar' ? ' dir="rtl"' : '';
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;

// ------------------------------------------------------------------------------------------------ counters (edge cache)
export const STEPS = ['project_cta', 'check_start', 'check_done', 'lead', 'book', 'pay_click', 'pay_return', 'request'];
export const MISS = ['permit', 'date', 'price', 'dev', 'site', 'nothing'];
const OK_STEP = new Set(STEPS.concat(MISS.map(m => 'miss_' + m)));
const CK = (d, k) => ORIGIN + '/__n31/v1/' + d + '/' + k;               // funnel steps per day
const PV = (d, k) => ORIGIN + '/__usage/v1/' + d + '/' + k;             // page views per template (kbx_n27a.js count())
const SVK = id => ORIGIN + '/__n31/sv/' + id;                           // saves per project, total since 18 Nov 2026
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|fetch|curl|wget|python|httpclient|axios|GPT|Claude|anthropic|Perplexity|Bytespider|facebookexternalhit|meta-extern/i;
async function get(k) { try { const r = await caches.default.match(k); return r ? (+(await r.text()) || 0) : 0; } catch (e) { return 0; } }
async function inc(k) { try { const n = await get(k); await caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3024000', 'content-type': 'text/plain' } })); } catch (e) {} }
const RL = new Map();
function allow(req, max) {   // per address per minute, in this isolate only (the address is never stored or logged)
  const ip = req.headers.get('cf-connecting-ip') || 'x', m = Math.floor(Date.now() / 60000), k = ip + '|' + m, n = (RL.get(k) || 0) + 1;
  RL.set(k, n); if (RL.size > 4000) for (const key of RL.keys()) if (!key.endsWith('|' + m)) RL.delete(key);
  return n <= max;
}
const jout = (o, st, extra) => new Response(JSON.stringify(o, null, 1), { status: st || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, extra || {}) });
function ourOrigin(req) { const o = req.headers.get('origin') || req.headers.get('referer') || ''; return !o || /^https:\/\/(www\.)?kolaboro\.com(\/|$)/.test(o); }

async function funnel(days) {
  days = days || 28;
  const ds = Array.from({ length: days }, (_, i) => day(i));
  const sum = async (key, names) => { const o = {}; await Promise.all(names.map(async n => { const v = await Promise.all(ds.map(d => get(key(d, n)))); o[n] = v.reduce((a, b) => a + b, 0); })); return o; };
  const [pv, st] = await Promise.all([sum(PV, ['project', 'check', 'pricing']), sum(CK, [...OK_STEP])]);
  const order = [['project', pv.project], ['project_cta', st.project_cta], ['check', pv.check], ['check_start', st.check_start], ['check_done', st.check_done], ['lead', st.lead], ['book', st.book], ['pay_click', st.pay_click], ['pay_return', st.pay_return]];
  return { page: ORIGIN + '/funnel/', at: new Date().toISOString(), days, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    note: 'Counted at the edge in the Cloudflare location that answers this request, without cookies, ids or IP addresses: only "step + day -> count". Lower bounds for one location, kept up to 35 days. Page views (project, check, pricing) since 13 Nov 2026; the other steps once per browser session since 18 Nov 2026. "pay_return" is a visit to the thanks page, not a confirmed payment.',
    steps: order.map(([k, n]) => ({ step: k, count: n })), pricing_page_views: pv.pricing, project_requests: st.request,
    missing_answers: Object.fromEntries(MISS.map(m => [m, st['miss_' + m] || 0])) };
}

// ------------------------------------------------------------------------------------------------ pages
const CSS = '<style id="n31a-css">.n31{padding-bottom:40px}.n31 h2{margin-top:28px}.n31-tw{overflow-x:auto;margin:8px 0 16px}.n31-t{width:100%;border-collapse:collapse}.n31-t th,.n31-t td{text-align:start;padding:8px;border-bottom:1px solid var(--line,#DDE3E0);vertical-align:top;font-variant-numeric:tabular-nums}.n31-t td.n{text-align:end}' +
  '.n31-l{list-style:none;padding:0;margin:8px 0}.n31-l li{padding:10px 0;border-bottom:1px solid var(--line,#DDE3E0);overflow-wrap:anywhere}.n31-l li b{display:block}.n31-k{display:inline-block;font-size:.78rem;font-weight:700;padding:2px 8px;border-radius:999px;margin-inline-start:6px;vertical-align:middle;background:var(--k-sunken,#EEF1EF)}.n31-k.ok{color:var(--k-ok,#1F6B45)}.n31-k.no{color:var(--k-warn,#8A5A00)}.n31-k.bad{color:var(--k-bad,#A12A1C)}' +
  '.n31-f{display:grid;gap:12px;max-width:560px;margin:16px 0}.n31-f label{display:grid;gap:4px;font-weight:600}.n31-f input[type=text],.n31-f input[type=email]{min-height:48px;padding:10px 12px;font:inherit;border:1px solid var(--line-2,#C9D1CE);border-radius:10px;background:var(--bg,#fff);color:inherit;min-width:0}.n31-f .cons{display:flex;gap:10px;align-items:flex-start;font-weight:400}.n31-f .cons input{width:22px;height:22px;flex:none;margin-top:2px}.n31-f .hp{position:absolute;left:-9999px}.n31-e{color:var(--k-bad,#A12A1C);min-height:1.2em;margin:0}.n31-ok{padding:12px 14px;border:2px solid var(--k-ok,#1F6B45);border-radius:10px}' +
  '.n31-src{font-size:.86rem;color:var(--muted,#56635D);overflow-wrap:anywhere}.n31-ck{padding:12px 0;border-bottom:1px solid var(--line,#DDE3E0)}.n31-ck h3{margin:0 0 6px;font-size:1.05rem}.n31-ck ul{margin:4px 0;padding-inline-start:20px}.n31-ck li{margin:4px 0;overflow-wrap:anywhere}.n31-note{color:var(--muted,#56635D);font-size:.92rem}' +
  '@media print{header,footer,.mcta,.kx-tick,nav{display:none!important}}</style>';
const page = (html, lang, extra) => new Response(html, { headers: Object.assign({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'content-language': lang }, extra || {}) });
const hero = (lang, h1, lead, crumb) => '<section class="phero"' + dirA(lang) + '><div class="wrap"><p class="crumb"><a href="' + (pre(lang) || '') + '/">Kolaboro</a> / ' + esc(crumb || h1) + '</p><h1>' + esc(h1) + '</h1><p class="lead">' + esc(lead) + '</p></div></section>';
async function build(pg, lang, shell, shellPath) {
  const n = await import('./kbx_named.js');
  return n.assemble(pg, lang, await shell(pre(lang) + shellPath));
}
const ld = (name, url, desc) => ({ '@context': 'https://schema.org', '@type': 'WebPage', name, url, description: desc, inLanguage: LOC.en, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } });
function pgObj(lang, path, title, desc, body, lastmod) {
  const canon = ORIGIN + pre(lang) + path, o = ld(title, canon, desc); o.inLanguage = lang;
  return { title: title + ' | Kolaboro', desc: String(desc).slice(0, 155), canon, body: CSS + body, ld: o, lastmod: lastmod || '2026-11-18', alt: l => ORIGIN + pre(l) + path };
}

// 2 + 50: funnel page
async function fnPage(lang, shell) {
  const L = T[lang], f = await funnel(28);
  let prev = null;
  const rows = f.steps.map(s => { const pct = prev ? Math.round(s.count / prev * 1000) / 10 : null; const r = '<tr><td>' + esc(L.fn_steps[s.step]) + '</td><td class="n">' + nf(s.count, lang) + '</td><td class="n">' + (pct == null || !prev ? '' : nf(pct, lang) + ' %') + '</td></tr>'; prev = s.count || null; return r; }).join('');
  const sv = MISS.map(m => '<tr><td>' + esc(L.sv_o[m]) + '</td><td class="n">' + nf(f.missing_answers[m], lang) + '</td></tr>').join('');
  const body = hero(lang, L.fn_h1, L.fn_lead, L.fn_title) + '<div class="wrap n31"' + dirA(lang) + '>' +
    '<div class="n31-tw"><table class="n31-t"><thead><tr>' + L.fn_th.map((h, i) => '<th scope="col"' + (i ? ' style="text-align:end"' : '') + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="n31-note">' + esc(L.fn_note) + '</p>' +
    '<h2>' + esc(L.fn_sv_h) + '</h2><div class="n31-tw"><table class="n31-t"><thead><tr><th scope="col">' + esc(L.fn_sv_th[0]) + '</th><th scope="col" style="text-align:end">' + esc(L.fn_sv_th[1]) + '</th></tr></thead><tbody>' + sv + '</tbody></table></div>' +
    '<p>' + esc(fill(L.fn_rq, { n: nf(f.project_requests, lang) })) + ' <a href="' + pre(lang) + '/request-project/">' + esc(L.rq_title) + '</a></p>' +
    '<p><a href="/api/open/funnel" rel="nofollow">' + esc(L.fn_json) + '</a> · <a href="/metrics/">' + esc(L.more) + ': /metrics/</a></p></div>';
  return page(await build(pgObj(lang, '/funnel/', L.fn_title, L.fn_lead, body, day()), lang, shell, '/about/'), lang, { 'cache-control': 'public, max-age=120' });
}

// 17: ask us to add a project (posts to the existing lead function, as the other forms on the site do)
const SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
const AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
async function rqPage(lang, shell) {
  const L = T[lang];
  const msg = { q: L.rq_e_q, em: L.rq_e_em, ok: L.rq_e_ok, dup: L.rq_e_dup, net: L.rq_e_net, sending: L.rq_sending, alt: L.rq_alt, ck: lk(lang, '/check/') };
  const body = hero(lang, L.rq_h1, L.rq_lead, L.rq_title) + '<div class="wrap n31"' + dirA(lang) + '>' +
    '<form class="n31-f" id="rq" novalidate data-msg="' + esc(JSON.stringify(msg)) + '">' +
    '<label>' + esc(L.rq_q) + '<input type="text" name="q" maxlength="300" autocomplete="off" required></label>' +
    '<label>' + esc(L.rq_pl) + '<input type="text" name="place" maxlength="120" placeholder="' + esc(L.rq_pl_ph) + '"></label>' +
    '<label>' + esc(L.rq_em) + '<input type="email" name="email" maxlength="200" autocomplete="email" required></label>' +
    '<label class="hp" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>' +
    '<label class="cons"><input type="checkbox" name="consent" required><span>' + esc(L.rq_ok) + ' <a href="/legal/privacy/">' + esc(L.rq_priv) + '</a>.</span></label>' +
    '<p class="n31-e" role="alert"></p><p><button class="btn btn-hi" type="submit">' + esc(L.rq_send) + '</button></p></form>' +
    '<div class="n31-ok" id="rq-ok" role="status" tabindex="-1" hidden><p><b>' + esc(L.rq_done) + '</b></p><p id="rq-alt"></p></div></div>' +
    "<script>(function(){var f=document.getElementById('rq');if(!f)return;var M=JSON.parse(f.getAttribute('data-msg')),e=f.querySelector('.n31-e'),t0=Date.now(),qs=new URLSearchParams(location.search);if(qs.get('q'))f.q.value=qs.get('q').slice(0,300);" +
    "f.addEventListener('submit',function(ev){ev.preventDefault();e.textContent='';var q=f.q.value.trim(),em=f.email.value.trim(),pl=f.place.value.trim();" +
    "if(q.length<2){e.textContent=M.q;f.q.focus();return;}if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(em)){e.textContent=M.em;f.email.focus();return;}if(!f.consent.checked){e.textContent=M.ok;return;}if(f.company.value||Date.now()-t0<2000){e.textContent=M.net;return;}" +
    "var b=f.querySelector('button'),lb=b.textContent;b.disabled=true;b.textContent=M.sending;" +
    "fetch('" + SB + "',{method:'POST',headers:{apikey:'" + AK + "',Authorization:'Bearer " + AK + "','Content-Type':'application/json'},body:JSON.stringify({p_name:'Project request',p_email:em,p_country:pl,p_phone:'',p_who:'buyer | project request',p_bring:('Project: '+q+(pl?'\\nPlace: '+pl:'')).slice(0,4000),p_learn:q.slice(0,300),p_week:'',p_lang:document.documentElement.lang||'en',p_source:('project-request | '+(document.referrer?new URL(document.referrer).pathname:'direct')).slice(0,200),p_plan:'project-request'})})" +
    ".then(function(r){return r.json();}).then(function(d){if(d==='ok'){f.hidden=true;var ok=document.getElementById('rq-ok');ok.hidden=false;ok.focus();try{navigator.sendBeacon('/api/open/fn?s=request');}catch(x){}" +
    "if(/^(https?:\\/\\/)?[\\w-]+(\\.[\\w-]+)+(\\/\\S*)?$/i.test(q)){var a=document.createElement('a');a.href=M.ck+'?url='+encodeURIComponent(q)+'#analyze';a.textContent=M.alt;document.getElementById('rq-alt').appendChild(a);}return;}throw new Error(d==='too_many'?M.dup:M.net);})" +
    ".catch(function(x){e.textContent=x&&x.message&&x.message.indexOf('fetch')<0?x.message:M.net;b.disabled=false;b.textContent=lb;});});})();</script>";
  return page(await build(pgObj(lang, '/request-project/', L.rq_title, L.rq_lead, body), lang, shell, '/about/'), lang, { 'x-robots-tag': 'noindex, follow' });
}

// 33, 34, 56: agencies, lawyers and listing sites
function bzPage(lang, shell, env) {
  const L = T[lang], vol = offers(env).filter(o => o.k === 'volume' || o.k === 'datalicence');
  const body = hero(lang, L.bz_h1, L.bz_lead, L.bz_title) + '<div class="wrap n31"' + dirA(lang) + '>' +
    '<h2>' + esc(L.bz_free_h) + ' <span class="n31-k ok">' + esc(L.today) + '</span></h2><ul class="n31-l">' + L.bz_free.map(([p, t, d]) => '<li><b><a href="' + lk(lang, p) + '">' + esc(t) + '</a></b>' + esc(d) + '</li>').join('') + '</ul>' +
    '<h2>' + esc(L.bz_paid_h) + '</h2><p>' + esc(L.bz_paid) + '</p>' + (vol.length ? offerCards(vol, lang) : '') +
    '<p><a class="btn btn-hi" href="mailto:carlos@kolaboro.com?subject=' + encodeURIComponent('Several checks') + '">' + esc(L.bz_cta) + '</a> <a class="btn btn-line" href="' + lk(lang, '/pricing/') + '">' + esc(L.mo_links.split(':')[0]) + '</a></p>' +
    '<h2>' + esc(L.bz_how_h) + '</h2><ul>' + L.bz_how.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<p class="n31-note"><a href="/data/licence/">/data/licence/</a> · <a href="/independence/">/independence/</a> · <a href="/lawyers/">/lawyers/</a> · <a href="' + lk(lang, '/api/docs/') + '">API</a></p></div>';
  return build(pgObj(lang, '/business/', L.bz_title, L.bz_lead, body), lang, shell, '/pricing/').then(h => page(h, lang));
}

// 42: what happens to what you pay
function moPage(lang, shell) {
  const L = T[lang], lnk = L.mo_links.split(' · ');
  const a = (h, t) => '<a href="' + h + '">' + esc(t) + '</a>';
  const lines = lnk.map((s, i) => { const k = s.indexOf(':'); return esc(s.slice(0, k + 1)) + ' ' + a(i ? lk(lang, '/buyer-protection-law/') : lk(lang, '/pricing/'), s.slice(k + 1).trim()); }).join(' · ');
  const body = hero(lang, L.mo_h1, L.mo_lead, L.mo_title) + '<div class="wrap n31"' + dirA(lang) + '><ul class="n31-l">' + L.mo_items.map(([t, d]) => '<li><b>' + esc(t) + '</b>' + esc(d) + '</li>').join('') + '</ul><p>' + lines + '</p>' +
    '<p class="n31-note"><a href="/independence/">/independence/</a> · <a href="/legal/privacy/">' + esc(L.rq_priv) + '</a></p></div>';
  return build(pgObj(lang, '/money/', L.mo_title, L.mo_lead, body), lang, shell, '/pricing/').then(h => page(h, lang));
}

// 51: already signed
function asPage(lang, shell) {
  const L = T[lang];
  const body = hero(lang, L.as_h1, L.as_lead, L.as_title) + '<div class="wrap n31"' + dirA(lang) + '><ol class="n31-l">' + L.as_steps.map(([p, t, d]) => '<li><b><a href="' + lk(lang, p) + '">' + esc(t) + '</a></b>' + esc(d) + '</li>').join('') + '</ol>' +
    '<h2>' + esc(L.as_law_h) + '</h2><p>' + esc(L.as_law) + '</p><p class="n31-note">' + esc(L.as_mon) + ' <a href="' + lk(lang, '/pricing/') + '">' + esc(L.more) + '</a></p></div>';
  return build(pgObj(lang, '/already-signed/', L.as_title, L.as_lead, body), lang, shell, '/about/').then(h => page(h, lang));
}

// 24: a real desk report from a real project's public data. Facts are quoted in the language of their source.
const ST_CLS = { verified: 'ok', contradicted: 'bad', unverified: 'no' };
async function srPage(lang, shell, env, slug) {
  if (!SR_SLUGS.has(slug)) return null;
  const n = await import('./kbx_named.js'), ix = await n.data(env), x = ix.bySlug.get(slug);
  if (!x) return null;
  const L = T[lang], host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const src = u => /^https?:\/\//.test(u || '') ? '<a href="' + esc(u) + '" rel="noopener nofollow" target="_blank"><bdi>' + esc(host(u)) + '</bdi></a>' : '';
  const cl = Array.isArray(x.cl) ? x.cl : [], ev = x.ev || {}, rv = x.rvw || {}, rw = x.rw || {};
  // claims grouped under the check they belong to (by words in the claim; anything else under the developer record)
  // first match wins, in this order (a claim about short-term rentals mentions "permits", one about past projects mentions "delivered")
  const grp = [['returns_ok', /return|yield|rental|short-term|short-let/i], ['land', /freehold|leasehold|land title|land (is )?charged|title deed|\bland\b/i], ['record', /delivered|completed projects|track record|\bJV\b|joint venture|listed on|subsidiary/i],
    ['permit', /permit|licen|APDL|RERA|DLD|PBG|IMB/i], ['handover', /possession|completion|handover|extension/i], ['progress', /progress|built|construction/i], ['escrow', /escrow|account|HDA|deposit/i], ['plans', /unit|size|sq ft|m2|floor plan|floors/i]];
  const by = {}; for (const c of cl) { const g = grp.find(z => z[1].test(c[0])); const k = g ? g[0] : 'record'; (by[k] = by[k] || []).push(c); }
  const order = ['permit', 'record', 'handover', 'progress', 'escrow', 'plans', 'returns_ok'];
  const sec = k => {
    const items = (by[k] || []).map(c => '<li>' + bdi(lang, esc(c[0])) + ' <span class="n31-k ' + (ST_CLS[c[1]] || 'no') + '">' + esc(L.sr_st[c[1]] || c[1]) + '</span> <span class="n31-src">' + esc(L.src) + ': ' + src(c[3]) + '</span></li>').join('');
    const e = ev[k] ? '<p>' + bdi(lang, esc(ev[k])) + '</p>' : '';
    if (!items && !e) return '';
    return '<div class="n31-ck"><h3>' + esc(L.sr_checks[k]) + '</h3>' + e + (items ? '<ul>' + items + '</ul>' : '') + '</div>';
  };
  const not = (k, t) => { const items = (by[k] || []).map(c => '<li>' + bdi(lang, esc(c[0])) + ' <span class="n31-k ' + (ST_CLS[c[1]] || 'no') + '">' + esc(L.sr_st[c[1]] || c[1]) + '</span> <span class="n31-src">' + esc(L.src) + ': ' + src(c[3]) + '</span></li>').join('');
    return '<div class="n31-ck"><h3>' + esc(L.sr_checks[k]) + '</h3>' + (items ? '<ul>' + items + '</ul>' : '') + '<p><span class="n31-k no">' + esc(L.sr_st.unverified) + '</span> ' + esc(t) + '</p></div>'; };
  const lastRead = rv.d || rw.checked || x.ad;
  const body = hero(lang, fill(L.sr_h1, { n: x.n }), L.sr_lead, fill(L.sr_title, { n: x.n })) + '<div class="wrap n31"' + dirA(lang) + '>' +
    '<p class="n31-note">' + esc(fill(L.sr_meta, { id: x.id, dv: x.dv, ar: x.ar || x.mk, d: fdt(lastRead, lang) })) + '</p>' +
    (rw.register ? '<p>' + esc(fill(L.sr_rv, { d: fdt(rv.d || rw.checked, lang), r: rw.register })) + (rw.detail ? ' ' + bdi(lang, esc(rw.detail)) : '') + '</p>' : '') +
    order.map(sec).join('') + not('land', L.sr_land) + not('contract', L.sr_contract) + not('site', L.sr_site) +
    '<p style="margin-top:20px"><a class="btn btn-hi" href="' + (lang === 'en' ? '/book/' : lk(lang, '/pricing/')) + '" data-ev="sr_book">' + esc(L.sr_cta) + '</a> <a class="btn btn-line" href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(L.sr_pdf) + '</a></p>' +
    '<p class="n31-note"><a href="/report/sample/">' + esc(L.sr_fict) + '</a></p></div>';
  const pg = pgObj(lang, '/report/sample/' + x.s + '/', fill(L.sr_title, { n: x.n }), L.sr_lead, body, lastRead);
  pg.ld.about = { '@type': 'Place', name: x.n, url: ORIGIN + pre(lang) + '/projects/' + x.s + '/' };
  pg.ld.isBasedOn = (x.src || []).slice(0, 12);
  return page(await build(pg, lang, shell, '/about/'), lang);
}

// ------------------------------------------------------------------------------------------------ 21: sticky button on project pages
export function ctaHtml(lang, slug) {
  const L = CTA[lang] || CTA.en, href = (lang === 'en' ? '/book/' : pre(lang) + '/pricing/') + '?p=' + slug + '#kreq';   // n34r: request form first, payment after an agent is confirmed
  return '<div class="mcta kn31c"><a class="btn btn-hi" href="' + href + '" data-ev="n31_cta"><span>' + esc(L[0]) + '</span><small>' + esc(L[1]) + '</small></a></div>' +
    '<style>.kn31c .btn{display:flex;flex-direction:column;align-items:center;gap:0;line-height:1.2;padding-block:8px}.kn31c small{font-weight:500;font-size:.78rem;opacity:.92}@media (min-width:761px){.mcta.kn31c{display:block;left:auto;right:20px;bottom:20px;width:auto}.mcta.kn31c .btn{width:auto;padding-inline:20px}[dir=rtl] .mcta.kn31c{right:auto;left:20px}}@media print{.kn31c{display:none!important}}</style>' +
    '<script src="/k/n31.js?v=' + N31V + '" defer></script>';
}
export const N31V = 'a1';

// ------------------------------------------------------------------------------------------------ offers behind flags (all OFF)
// Each one changes money or a promise, so it is shown only when the owner sets env KB_N31_OFFERS to a comma list of keys
// (and, for anything paid, a payment link in KB_N31_PAY_<KEY>). Prices below are proposals for the owner, not published prices.
const OFFERS = [
  { k: 'report', item: 7, price: '€29', t: 'Paid PDF report of one project', d: 'Every fact we hold, its source and date, what is missing, and what to ask the developer. Desk research only.' },
  { k: 'guarantee', item: 23, price: null, t: 'Refund for what we cannot check', d: 'If one of the nine checks cannot be done, that part of the price is refunded.' },
  { k: 'ab', item: 39, price: '€290 / €490 / €690', t: 'Check price test', d: 'Three prices shown at random to new visitors; every visitor sees one price for 30 days.' },
  { k: 'ask', item: 40, price: '€49', t: 'Ask the developer through us', d: 'We send your questions to the developer and publish the dated reply, or the dated absence of one.' },
  { k: 'gift', item: 43, price: '€490', t: 'Gift a check', d: 'A check for a family member who is buying abroad.' },
  { k: 'compare3', item: 44, price: '€1,190', t: 'Check 3 projects', d: 'Three projects checked side by side before you choose.' },
  { k: 'overdue', item: 45, price: '€9 a month', t: 'Overdue handover alert for buyers', d: 'Dated notice when the handover date on record passes, with what the law and contract say.' },
  { k: 'mybuild', item: 46, price: '€19 a month', t: '"Is my build on track?"', d: 'Monthly satellite comparison of the plot for buyers who already signed.' },
  { k: 'volume', item: 34, price: '5 checks €2,200 · 10 checks €3,900', t: 'Volume checks for agencies and lawyers', d: 'Monthly invoice; the same nine checks.' },
  { k: 'datalicence', item: 53, price: 'from €4,900 a year', t: 'Commercial data licence', d: 'Full dataset with history and an update feed for funds and banks.' },
  { k: 'dubai', item: 58, price: '€590', t: 'Dubai pack', d: 'Check with the DLD project status, the Oqood registration and the escrow account.' }
];
function offers(env) {
  const on = new Set(String((env && env.KB_N31_OFFERS) || '').split(',').map(s => s.trim()).filter(Boolean));
  return OFFERS.filter(o => on.has(o.k)).map(o => Object.assign({}, o, { pay: env['KB_N31_PAY_' + o.k.toUpperCase()] || null }));
}
function offerCards(list, lang) {
  return '<ul class="n31-l">' + list.map(o => '<li><b>' + esc(o.t) + (o.price ? ' · ' + esc(o.price) : '') + '</b>' + esc(o.d) + (o.pay ? ' <a href="' + esc(o.pay) + '" rel="noopener">' + esc(T[lang].more) + '</a>' : '') + '</li>').join('') + '</ul>';
}
// /pricing/: the flagged offers are appended under the plans only when at least one is on (index.js routes /pricing/ here only then)
export async function pricingOffers(res, lang, env) {
  if (!(await loadT(env))) return res;
  const list = offers(env).filter(o => !['volume', 'datalicence'].includes(o.k));
  if (!list.length) return res;
  const add = '<section class="sec"><div class="wrap"' + dirA(lang) + '>' + CSS + '<h2>' + esc(T[lang].of_h) + '</h2>' + offerCards(list, lang) + '</div></section>';
  return new HTMLRewriter().on('main > section:first-of-type', { element(e) { e.after(add, { html: true }); } }).transform(res);
}

// ------------------------------------------------------------------------------------------------ router
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!PATHS.test(p)) return null;
  if (p.startsWith('/api/open/')) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': ORIGIN, 'access-control-allow-methods': 'GET, POST', 'access-control-max-age': '86400' } });
    if (p === '/api/open/funnel') return jout(await funnel(Math.min(35, Math.max(1, +u.searchParams.get('days') || 28))), 200, { 'cache-control': 'public, max-age=60' });
    const bot = BOT.test(req.headers.get('user-agent') || '');
    if (p === '/api/open/fn') {
      if (req.method !== 'POST') return jout({ error: 'method', use: 'POST /api/open/fn?s=<step>' }, 405);
      const s = String(u.searchParams.get('s') || '');
      if (!OK_STEP.has(s)) return jout({ error: 'step' }, 400);
      if (bot || !ourOrigin(req) || !allow(req, 40)) return jout({ ok: false }, 202);
      ctx.waitUntil(inc(CK(day(), s)));
      return jout({ ok: true }, 202);
    }
    if (p === '/api/open/sv') {
      const id = String(u.searchParams.get('id') || '').toUpperCase();
      if (!/^[A-Z0-9-]{3,20}$/.test(id)) return jout({ error: 'id' }, 400);
      if (req.method === 'POST') { if (bot || !ourOrigin(req) || !allow(req, 20)) return jout({ ok: false }, 202); ctx.waitUntil(inc(SVK(id))); return jout({ ok: true }, 202); }
      const n = await get(SVK(id));
      return jout({ id, saves_at_least: n, shown: n >= 3, since: '2026-11-18', note: 'Saves to a list counted once per browser at the edge in this Cloudflare location, without cookies or ids: a lower bound.' }, 200, { 'cache-control': 'public, max-age=300' });
    }
    return null;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  if (!(await loadT(env))) return null;
  let m;
  if ((m = RX.fn.exec(p))) return fnPage(m[1] || 'en', shell);
  if ((m = RX.rq.exec(p))) return rqPage(m[1] || 'en', shell);
  if ((m = RX.bz.exec(p))) return bzPage(m[1] || 'en', shell, env);
  if ((m = RX.mo.exec(p))) return moPage(m[1] || 'en', shell);
  if ((m = RX.as.exec(p))) return asPage(m[1] || 'en', shell);
  if ((m = RX.sr.exec(p))) return srPage(m[1] || 'en', shell, env, m[2]);
  return null;
}
export { funnel, offers, OFFERS };
