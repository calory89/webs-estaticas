// kolaboro.com (n30b, batch 30, 17 Nov 2026): engineering features 8 to 14. No paid AI, no database reads or writes in this file:
// everything is computed from the published data files (named.json, bali-cases.json, promises.json, web-health.json, ...).
//   8  GET /[lang/]data/snapshots/                 daily dataset snapshots: SHA-256 per day in a hash chain, copies, in-browser verifier
//      GET /api/v1/snapshots                       the chain as JSON (static file /data/snapshots/index.json + the live file as a
//                                                  provisional tip), signed with the Ed25519 key of the open API when it is configured
//   9  GET /[lang/]api/docs/                       API v1 page: endpoints, limits, a playground that shows status, headers and body
//      GET /api/v1/openapi.json                    OpenAPI 3.1 of v1 (the v1 part of /docs/api/openapi.json)
//   10 GET /api/v1/projects/<slug>/certificate     verification certificate: canonical JSON of the facts, their SHA-256, the SHA-256 of
//                                                  the dataset files, the snapshot chain head; signed (Ed25519, KB_SIGN_KEY) or hash only
//      GET /[lang/]projects/<slug>/certificate/    the same as a page with a QR code to itself and an in-browser check
//   11 GET /api/v1/developers/<slug>/website       a developer's websites: daily health (kbx_web.js) + domain registration (RDAP) and
//                                                  TLS issuer (certificate transparency) from /data/web-forensics.json
//   12 GET /[lang/]engineering/data-quality/       per-field coverage and freshness, by market; GET /api/v1/data-quality as JSON
//   13 GET /api/v1/changes?since=&cursor=&limit=   every dated change we hold, oldest first, for incremental sync (ETag, Last-Modified,
//                                                  304); GET /api/v1/changes/feed.json the newest 100 as JSON Feed 1.1
//   14 GET /manifest.webmanifest, /[lang/]offline/ installable app and the page the service worker (/sw.js) shows offline
// Every JSON answer: CORS, ETag + If-None-Match 304, RateLimit-Policy / RateLimit (IETF draft) and X-RateLimit-*, edge cache headers.
import { T } from './kbx_n30b_i18n.js';
import { dqExtra, dqJson } from './kbx_n31c.js';   // n31c (batch 31): gaps by place, automatic checks, stable ids

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const RX = {
  snap: new RegExp('^\\/' + LP + 'data\\/snapshots\\/?$'), docs: new RegExp('^\\/' + LP + 'api\\/docs\\/?$'),
  certP: new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/certificate\\/?$'), dq: new RegExp('^\\/' + LP + 'engineering\\/data-quality\\/?$'),
  off: new RegExp('^\\/' + LP + 'offline\\/?$')
};
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:data\/snapshots|api\/docs|engineering\/data-quality|offline|projects\/[a-z0-9-]{1,90}\/certificate)\/?$|^\/api\/v1\/(?:snapshots|openapi\.json|data-quality|changes(?:\/feed\.json)?|projects\/[a-z0-9-]{1,90}\/certificate|developers\/[a-z0-9-]{1,90}\/website)$|^\/manifest\.webmanifest$/;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d || 0, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d; } };
const te = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function sha(x) { return hex(await crypto.subtle.digest('SHA-256', typeof x === 'string' ? te.encode(x) : x)); }
// canonical JSON: object keys sorted at every level, no spaces (what the certificate fingerprint and signature are computed over)
function canon(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const ar = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;
const today = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------------------------------------------ data files
const RAW = {};
async function rawFile(env, p) {   // exact bytes of a published file, kept 10 minutes per isolate
  const m = RAW[p]; if (m && Date.now() - m.t < 600000) return m;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + p, { cf: { cacheTtl: 120 } });
  if (!r.ok) throw new Error(p + ' ' + r.status);
  const b = await r.arrayBuffer(), o = { t: Date.now(), bytes: b.byteLength, sha256: await sha(b), buf: b };
  RAW[p] = o; return o;
}
async function jsonFile(env, p) { const f = await rawFile(env, p); return JSON.parse(new TextDecoder().decode(f.buf)); }
const N = () => import('./kbx_named.js');

// ------------------------------------------------------------------------------------------------ HTTP helpers
const RL = new Map();
async function rate(req, ctx, bucket, max) {   // per IP per minute: in-isolate count plus a shared count in the colo cache (as kbx_follow.js)
  const ip = req.headers.get('cf-connecting-ip') || 'unknown', min = Math.floor(Date.now() / 60000), k = bucket + '|' + ip + '|' + min;
  const local = (RL.get(k) || 0) + 1; RL.set(k, local);
  if (RL.size > 5000) for (const key of RL.keys()) if (!key.endsWith('|' + min)) RL.delete(key);
  let shared = 0; const ck = new Request(ORIGIN + '/__rl-n30/' + bucket + '/' + encodeURIComponent(ip) + '/' + min);
  try { const hit = await caches.default.match(ck); if (hit) shared = +(await hit.text()) || 0; } catch (e) {}
  const n = Math.max(local, shared + 1);
  try { const p = caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': 'max-age=120' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
  return { ok: n <= max, remaining: Math.max(0, max - n), reset: 60 - Math.floor(Date.now() / 1000) % 60 };
}
const LIMIT = 120;
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'if-none-match, if-modified-since, accept', 'access-control-expose-headers': 'etag, last-modified, ratelimit, ratelimit-policy, x-ratelimit-limit, x-ratelimit-remaining, retry-after, x-kolaboro-signature, x-kolaboro-key-id, x-edge-cache', 'access-control-max-age': '86400' };
export const rlHeaders = rl => ({ 'ratelimit-policy': '"ip";q=' + LIMIT + ';w=60', ratelimit: '"ip";r=' + rl.remaining + ';t=' + rl.reset, 'x-ratelimit-limit': LIMIT + ';w=60', 'x-ratelimit-remaining': String(rl.remaining) });
async function out(req, body, o) {
  o = o || {};
  const etag = '"' + (await sha(body)).slice(0, 32) + '"';
  const h = Object.assign({ 'content-type': o.type || 'application/json; charset=utf-8', etag, 'cache-control': 'public, max-age=' + (o.maxAge || 300) + ', s-maxage=' + (o.maxAge || 300) + ', stale-while-revalidate=600', vary: 'accept-encoding', 'x-content-type-options': 'nosniff' }, CORS, o.extra || {});
  if (o.lastMod) h['last-modified'] = new Date(o.lastMod).toUTCString();
  const inm = req.headers.get('if-none-match') || '', ims = req.headers.get('if-modified-since');
  if ((inm && inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(etag)) || (!inm && ims && o.lastMod && Date.parse(ims) >= Math.floor(Date.parse(o.lastMod) / 1000) * 1000)) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === 'HEAD' ? null : body, { status: o.status || 200, headers: h });
}
const jerr = (o, s, extra) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS, extra || {}) });
async function signed(env, body) {   // the open API's Ed25519 signature (kolaboro.js signBody); null when the key is not configured
  try { const K = await import('./kolaboro.js'); const s = await K.signBody(env, body); return s ? { 'x-kolaboro-signature': s, 'x-kolaboro-key-id': (env && env.KB_SIGN_KID) || 'kb' } : null; } catch (e) { return null; }
}
const page = (html, lang, extra) => new Response(html, { headers: Object.assign({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300', 'content-language': lang }, extra || {}) });

// ------------------------------------------------------------------------------------------------ 8: snapshots
async function chain(env) {
  const idx = await jsonFile(env, '/data/snapshots/index.json'), live = await rawFile(env, '/data/named.json');
  const E = idx.entries || [], last = E[E.length - 1] || null, match = E.filter(e => e.sha256 === live.sha256).map(e => e.day).pop() || null;
  let tip = null;
  if (!last || last.sha256 !== live.sha256) {
    const day = today(), prev = last ? last.head : 'genesis';
    tip = { day, provisional: true, bytes: live.bytes, sha256: live.sha256, prev, head: await sha('kolaboro-snapshot-v1|' + day + '|/data/named.json|' + live.sha256 + '|' + live.bytes + '|' + prev), copy: '/data/named.json', note: 'The file served now; it becomes an entry with a copy when the snapshot script runs after the next publish.' };
  }
  return Object.assign({}, idx, { api: 'kolaboro-snapshots-v1', live: { file: '/data/named.json', bytes: live.bytes, sha256: live.sha256, matches_entry: match }, provisional_tip: tip, chain_tip: tip ? tip.head : (last ? last.head : null),
    verify: { page: ORIGIN + '/data/snapshots/', public_keys: ORIGIN + '/.well-known/kolaboro-keys.json', signature: 'x-kolaboro-signature = base64 Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of this exact body' } });
}
const short = s => String(s || '').slice(0, 12) + '…';
async function snapPage(req, u, env, ctx, shell, lang) {
  const L = T[lang], P = pre(lang), c = await chain(env), path = P + '/data/snapshots/', canonU = ORIGIN + path;
  const rows = (c.entries || []).slice().reverse().map(e => '<tr><td>' + esc(fdt(e.day, lang)) + '</td><td>' + ar(lang, nf(e.projects || 0, lang)) + '</td><td>' + ar(lang, nf(e.bytes / 1e6, lang, 2)) + ' MB</td><td><code title="' + e.sha256 + '">' + short(e.sha256) + '</code></td><td><code title="' + e.head + '">' + short(e.head) + '</code></td><td><a href="' + esc(e.copy) + '" download>.gz</a> <small>' + ar(lang, nf(e.copy_bytes / 1e6, lang, 2)) + ' MB</small></td></tr>').join('');
  const tipRow = c.provisional_tip ? '<tr class="sn-tip"><td>' + esc(fdt(c.provisional_tip.day, lang)) + ' <small>(' + esc(L.sn_tip) + ')</small></td><td></td><td>' + ar(lang, nf(c.provisional_tip.bytes / 1e6, lang, 2)) + ' MB</td><td><code title="' + c.provisional_tip.sha256 + '">' + short(c.provisional_tip.sha256) + '</code></td><td><code title="' + c.provisional_tip.head + '">' + short(c.provisional_tip.head) + '</code></td><td><a href="/data/named.json">named.json</a></td></tr>' : '';
  const msg = { wait: L.sn_verify_wait, ok_chain: L.sn_ok_chain, bad_chain: L.sn_bad_chain, ok_live: L.sn_ok_live, live_new: L.sn_live_new, sig_ok: L.sn_sig_ok, sig_no: L.sn_sig_no, sig_bad: L.sn_sig_bad, match: L.sn_match, nomatch: L.sn_nomatch, loc: LOC[lang] };
  const body = '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb"><a href="' + P + '/">' + esc(L.home) + '</a> / <a href="/data/">' + esc(L.data) + '</a> / ' + esc(L.sn_h1) + '</p><h1>' + esc(L.sn_h1) + '</h1><p class="lead">' + esc(L.sn_lead) + '</p></div></section>' +
    '<div class="wrap n30" ' + (lang === 'ar' ? 'dir="rtl" ' : '') + 'id="sn" data-msg="' + esc(JSON.stringify(msg)) + '">' + CSS +
    '<h2>' + esc(L.sn_verify_h) + '</h2><p><button type="button" class="btn" id="sn-go">' + esc(L.sn_verify_btn) + '</button></p><ul class="n30-out" id="sn-out" role="status" aria-live="polite"></ul>' +
    '<p><label for="sn-file">' + esc(L.sn_file_lbl) + '</label><br><input type="file" id="sn-file" accept=".json,.gz,application/json,application/gzip"> <small>' + esc(L.sn_nothing) + '</small></p><p id="sn-fout" role="status" aria-live="polite"></p>' +
    '<div class="n30-tw"><table class="n30-t"><thead><tr>' + L.sn_th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + tipRow + rows + '</tbody></table></div>' +
    '<p class="k-xs">' + esc(L.sn_note) + '</p>' +
    '<h2>' + esc(L.sn_cli_h) + '</h2><p>' + esc(L.sn_cli) + '</p><h3>' + esc(L.sn_rule_h) + '</h3><pre dir="ltr" class="n30-pre">' + esc(c.head_rule) + '\n\ncurl -sO https://kolaboro.com' + esc(((c.entries || []).slice(-1)[0] || {}).copy || '/data/named.json') + '\ngunzip -c named.json.gz | sha256sum\nprintf \'%s\' "kolaboro-snapshot-v1|DAY|/data/named.json|SHA256|BYTES|PREV" | sha256sum</pre>' +
    '<p>' + fill(esc(L.sn_more), { log: '<a href="/log/">/log/</a>', api: '<a href="/api/v1/snapshots">/api/v1/snapshots</a>' }) + ' <a href="' + P + '/api/docs/">API v1</a> · <a href="' + P + '/engineering/data-quality/">' + esc(T[lang].dq_h1) + '</a></p></div>' +
    '<script>' + SNAP_JS + '</script>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Dataset', name: L.sn_h1, description: L.sn_lead, url: canonU, license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, dateModified: c.updated, creator: { '@id': ORIGIN + '/#org' },
    distribution: (c.entries || []).map(e => ({ '@type': 'DataDownload', encodingFormat: 'application/gzip', contentUrl: ORIGIN + e.copy, sha256: e.sha256, uploadDate: e.day })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: L.data, item: ORIGIN + '/data/' }, { '@type': 'ListItem', position: 3, name: L.sn_h1, item: canonU }] }] };
  return assemble({ title: L.sn_title + ' | Kolaboro', desc: L.sn_lead.slice(0, 155), canon: canonU, body, ld, lastmod: c.updated, alt: l => ORIGIN + pre(l) + '/data/snapshots/' }, lang, shell, '/data/');
}
// in-browser verifier: recompute every head, compare the live file, check the Ed25519 signature of the API answer, hash a dropped file
const SNAP_JS = "(function(){var R=document.getElementById('sn');if(!R)return;var M=JSON.parse(R.getAttribute('data-msg')),O=document.getElementById('sn-out'),te=new TextEncoder();" +
  "function H(b){return crypto.subtle.digest('SHA-256',typeof b==='string'?te.encode(b):b).then(function(d){return Array.prototype.map.call(new Uint8Array(d),function(x){return('0'+x.toString(16)).slice(-2);}).join('');});}" +
  "function f(s,v){return s.replace(/\\{(\\w+)\\}/g,function(m,k){return v[k]!=null?v[k]:m;});}function li(t,ok){var e=document.createElement('li');e.textContent=(ok===false?'\\u2717 ':ok===null?'\\u2022 ':'\\u2713 ')+t;e.className=ok===false?'bad':'';O.appendChild(e);}" +
  "function day(d){try{return new Date(d+'T12:00:00Z').toLocaleDateString(M.loc,{day:'numeric',month:'short',year:'numeric'});}catch(e){return d;}}var C=null;" +
  "function verify(){var b=document.getElementById('sn-go');b.disabled=true;O.textContent='';li(M.wait,null);var txt,sig,kid;" +
  "fetch('/api/v1/snapshots',{cache:'no-store'}).then(function(r){sig=r.headers.get('x-kolaboro-signature');return r.text();}).then(function(t){txt=t;C=JSON.parse(t);O.textContent='';var E=C.entries.slice();if(C.provisional_tip)E.push(C.provisional_tip);var prev='genesis',i=0;" +
  "function step(){if(i>=E.length){li(f(M.ok_chain,{n:E.length}));return live();}var e=E[i];if(e.prev!==prev){li(f(M.bad_chain,{d:day(e.day)}),false);return;}H('kolaboro-snapshot-v1|'+e.day+'|/data/named.json|'+e.sha256+'|'+e.bytes+'|'+e.prev).then(function(h){if(h!==e.head){li(f(M.bad_chain,{d:day(e.day)}),false);return;}prev=h;i++;step();});}step();}).catch(function(){li('Error',false);}).then(function(){b.disabled=false;});" +
  "function live(){return fetch('/data/named.json',{cache:'no-store'}).then(function(r){return r.arrayBuffer();}).then(H).then(function(h){var last=C.entries[C.entries.length-1];if(last&&h===last.sha256)li(f(M.ok_live,{d:day(last.day)}));else if(C.provisional_tip&&h===C.provisional_tip.sha256)li(f(M.live_new,{s:h.slice(0,12)+'\\u2026'}),null);else li(f(M.nomatch,{s:h.slice(0,12)+'\\u2026'}),null);return sigchk();});}" +
  "function sigchk(){if(!sig)return;return fetch('/.well-known/kolaboro-keys.json').then(function(r){return r.json();}).then(function(k){var raw=Uint8Array.from(atob(k.keys[0].public_key_raw_b64),function(c){return c.charCodeAt(0);});return crypto.subtle.importKey('raw',raw,{name:'Ed25519'},false,['verify']).then(function(key){return H(txt).then(function(h){return crypto.subtle.verify({name:'Ed25519'},key,Uint8Array.from(atob(sig),function(c){return c.charCodeAt(0);}),te.encode('kolaboro-sig-v1\\n'+h));});}).then(function(ok){li(ok?M.sig_ok:M.sig_bad,ok?true:false);},function(){li(M.sig_no,null);});});}}" +
  "document.getElementById('sn-go').addEventListener('click',verify);" +
  "document.getElementById('sn-file').addEventListener('change',function(ev){var file=ev.target.files[0],o=document.getElementById('sn-fout');if(!file)return;o.textContent=M.wait;var p=/\\.gz$/i.test(file.name)&&window.DecompressionStream?new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():file.arrayBuffer();" +
  "Promise.all([p.then(H),C?Promise.resolve(C):fetch('/api/v1/snapshots').then(function(r){return r.json();}).then(function(j){C=j;return j;})]).then(function(a){var h=a[0],E=a[1].entries.concat(a[1].provisional_tip?[a[1].provisional_tip]:[]),m=E.filter(function(e){return e.sha256===h;})[0];o.textContent=m?'\\u2713 '+f(M.match,{d:day(m.day)}):'\\u2717 '+f(M.nomatch,{s:h.slice(0,16)+'\\u2026'});}).catch(function(){o.textContent='Error';});});})();";

// ------------------------------------------------------------------------------------------------ 13: changes
let CH = null;
async function allChanges(env) {
  const n = await N(), ix = await n.data(env);
  if (CH && CH.ix === ix) return CH;
  const F = await import('./kbx_follow.js'), E = [], seen = new Set();
  const fnv = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
  for (const x of ix.P) {
    let ev = []; try { ev = F.events(n, ix, x); } catch (e) { ev = []; }
    for (const e of ev) { let id = e.key; if (seen.has(id)) id += '~' + fnv(String(e.text || e.title)); seen.add(id); E.push({ id, at: e.d, kind: String(e.key).split('/')[1] || 'change', project: { id: x.id, slug: x.s, name: x.n, market: x.mk, country: x.co }, title: e.title, text: e.text, source: e.src || null, url: e.url }); }
  }
  E.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  CH = { ix, E, last: E.length ? E[E.length - 1].at : null }; return CH;
}
const b64u = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); } catch (e) { return null; } };
function normSince(s) {
  if (!s) return null; s = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s + 'T00:00:00Z';
  const d = new Date(s); return isNaN(d) ? undefined : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
async function changes(req, u, env, rh) {
  const C = await allChanges(env), q = u.searchParams;
  const since = normSince(q.get('since')); if (since === undefined) return jerr({ error: 'bad_since', expected: 'YYYY-MM-DD or an ISO 8601 date-time' }, 400, rh);
  let cur = null; if (q.get('cursor')) { const c = unb64u(q.get('cursor')); const m = c && c.split('\n'); if (!m || m.length !== 2) return jerr({ error: 'bad_cursor' }, 400, rh); cur = { at: m[0], id: m[1] }; }
  const limit = Math.max(1, Math.min(1000, +(q.get('limit') || 500) || 500)), proj = q.get('project'), mk = (q.get('market') || '').toLowerCase();
  let L = C.E;
  if (proj) L = L.filter(e => e.project.slug === proj || e.project.id === proj.toUpperCase());
  if (mk) L = L.filter(e => String(e.project.market).toLowerCase() === mk || String(e.project.country).toLowerCase() === mk);
  if (cur) L = L.filter(e => e.at > cur.at || (e.at === cur.at && e.id > cur.id)); else if (since) L = L.filter(e => e.at > since);
  const page = L.slice(0, limit), more = L.length > limit, lastE = page[page.length - 1];
  const nextCur = more && lastE ? b64u(lastE.at + '\n' + lastE.id) : null;
  const keep = new URLSearchParams(); if (proj) keep.set('project', proj); if (mk) keep.set('market', q.get('market')); if (q.get('limit')) keep.set('limit', String(limit));
  const o = { api: 'kolaboro-changes-v1', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    sync: 'Oldest first. Keep the "at" of the last change you stored and ask again with ?since=<that at>, or follow "next" while has_more is true. Change ids are stable. Send If-None-Match or If-Modified-Since to get 304 when nothing is new.',
    since: cur ? null : since, count: page.length, total_after_filter: L.length, has_more: more, next_cursor: nextCur, next: nextCur ? ORIGIN + '/api/v1/changes?' + (keep.toString() ? keep.toString() + '&' : '') + 'cursor=' + nextCur : null,
    last_change_at: C.last, resume: lastE ? ORIGIN + '/api/v1/changes?since=' + encodeURIComponent(lastE.at) : null, feed: ORIGIN + '/api/v1/changes/feed.json', changes: page };
  return out(req, JSON.stringify(o), { extra: rh, maxAge: 300, lastMod: C.last });
}
async function changesFeed(req, env, rh) {
  const C = await allChanges(env), L = C.E.slice(-100).reverse();
  const f = { version: 'https://jsonfeed.org/version/1.1', title: 'Kolaboro: dated changes to tracked projects', home_page_url: ORIGIN + '/changes/', feed_url: ORIGIN + '/api/v1/changes/feed.json', description: 'Every dated change Kolaboro holds about the projects it tracks: dates on record, developer page changes, register checks, sealed copies, satellite comparisons. Full history for sync: ' + ORIGIN + '/api/v1/changes', language: 'en', authors: [{ name: 'Kolaboro', url: ORIGIN + '/' }],
    items: L.map(e => ({ id: e.id, url: e.url, external_url: e.source || undefined, title: e.project.name + ': ' + e.title, content_text: e.text, date_published: e.at, tags: [e.project.market, e.kind].filter(Boolean) })) };
  return out(req, JSON.stringify(f), { type: 'application/feed+json; charset=utf-8', extra: rh, maxAge: 600, lastMod: C.last });
}

// ------------------------------------------------------------------------------------------------ 12: data quality
let DQ = null;
const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
async function quality(env) {
  const n = await N(), ix = await n.data(env);
  if (DQ && DQ.ix === ix) return DQ.v;
  const nf2 = await rawFile(env, '/data/named.json'), now = Date.parse(today() + 'T00:00:00Z');
  const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.length);
  const FX = (x, k) => has((x.fx || {})[k]);
  const FIELDS = {
    dv: x => has(x.dv), ar: x => has(x.ar) && x.ar !== x.mk, url: x => n.okHttp(x.url) && !n.isListing(x.url), ho: x => !!n.handoverOf(ix, x) || FX(x, 'handover_promised'), price: x => FX(x, 'price_min'), size: x => FX(x, 'size_min_m2'), types: x => FX(x, 'unit_types'),
    pay: x => FX(x, 'payment_plan'), pn: x => has(x.pn), auth: x => FX(x, 'permit_authority'), cs: x => FX(x, 'construction_start'), pin: x => FX(x, 'lat') && FX(x, 'lng'), co: x => FX(x, 'developer_company'),
    rw: x => !!(x.rw || (ix.caseBy.get(x.id) || {}).register), sha: x => has(x.sha) || !!((ix.caseBy.get(x.id) || {}).fp || {}).sha256, src2: x => srcN(x) >= 2 };
  function srcN(x) { return new Set([x.url, x.du, ...(x.src || [])].filter(v => n.okHttp(v))).size; }
  const P = ix.P, tot = P.length, cnt = {}, fr = { d7: 0, d30: 0, d90: 0, old: 0 }, ages = [], srcs = [], byMk = new Map();
  for (const k of Object.keys(FIELDS)) cnt[k] = 0;
  for (const x of P) {
    const r = {}; for (const [k, f] of Object.entries(FIELDS)) { let v = false; try { v = !!f(x); } catch (e) {} r[k] = v; if (v) cnt[k]++; }
    const lm = n.lastmod(ix, x), age = Math.max(0, Math.round((now - Date.parse(lm + 'T00:00:00Z')) / 864e5)); ages.push(age); srcs.push(srcN(x));
    fr[age <= 7 ? 'd7' : age <= 30 ? 'd30' : age <= 90 ? 'd90' : 'old']++;
    const m = byMk.get(x.mk) || { market: x.mk, country: x.co, projects: 0, ho: 0, price: 0, pn: 0, pin: 0, url: 0, ages: [] };
    m.projects++; for (const k of ['ho', 'price', 'pn', 'pin', 'url']) if (r[k]) m[k]++; m.ages.push(age); byMk.set(x.mk, m);
  }
  const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0;
  const markets = [...byMk.values()].filter(m => m.projects >= 10).sort((a, b) => b.projects - a.projects).map(m => ({ market: m.market, country: m.country, projects: m.projects, handover_pct: pct(m.ho, m.projects), price_pct: pct(m.price, m.projects), permit_number_pct: pct(m.pn, m.projects), pin_pct: pct(m.pin, m.projects), official_page_pct: pct(m.url, m.projects), median_days_since_check: median(m.ages) }));
  const v = { api: 'kolaboro-data-quality-v1', computed_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), data_updated: ix.updated, dataset: { file: '/data/named.json', sha256: nf2.sha256, bytes: nf2.bytes }, build: (env && env.CF_PAGES_COMMIT_SHA) ? String(env.CF_PAGES_COMMIT_SHA).slice(0, 12) : null,
    method: 'Counts every named project page (Sumba projects are excluded, conflict of interest). A field counts when the published record has a value with its source; nothing is estimated. Freshness = days from the last date we checked the project (developer page read, register check or sealed copy) to the day of computation.',
    projects: tot, fields: Object.fromEntries(Object.keys(FIELDS).map(k => [k, { projects: cnt[k], pct: pct(cnt[k], tot) }])), freshness: Object.fromEntries(Object.entries(fr).map(([k, c]) => [k, { projects: c, pct: pct(c, tot) }])),
    median_days_since_check: median(ages), median_sources_per_project: median(srcs), markets };
  try { Object.assign(v, dqJson(ix)); } catch (e) {}   // n31c: gaps, validation, aliases
  DQ = { ix, v }; return v;
}
async function dqPage(req, u, env, ctx, shell, lang) {
  const L = T[lang], P = pre(lang), q = await quality(env), path = P + '/engineering/data-quality/', canonU = ORIGIN + path;
  const bar = p => '<span class="n30-bar" aria-hidden="true"><i style="width:' + Math.min(100, p) + '%"></i></span>';
  const pc = p => ar(lang, nf(p, lang, 1) + '%');
  const frows = Object.entries(q.fields).sort((a, b) => b[1].pct - a[1].pct).map(([k, f]) => '<tr><th scope="row">' + esc(L.dq_fields[k] || k) + '</th><td>' + ar(lang, nf(f.projects, lang)) + '</td><td>' + bar(f.pct) + ' ' + pc(f.pct) + '</td></tr>').join('');
  const fr = '<ul class="n30-fr">' + Object.entries(q.freshness).map(([k, f]) => '<li><b>' + pc(f.pct) + '</b> ' + esc(L.dq_fr[k]) + ' <small>(' + ar(lang, nf(f.projects, lang)) + ')</small></li>').join('') + '</ul>';
  const mrows = q.markets.map(m => '<tr><th scope="row"><bdi>' + esc(m.market) + '</bdi></th><td>' + ar(lang, nf(m.projects, lang)) + '</td><td>' + pc(m.handover_pct) + '</td><td>' + pc(m.price_pct) + '</td><td>' + pc(m.permit_number_pct) + '</td><td>' + pc(m.pin_pct) + '</td><td>' + pc(m.official_page_pct) + '</td><td>' + ar(lang, nf(m.median_days_since_check, lang)) + '</td></tr>').join('');
  const body = '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb"><a href="' + P + '/">' + esc(L.home) + '</a> / <a href="/engineering/">' + esc(L.eng) + '</a> / ' + esc(L.dq_h1) + '</p><h1>' + esc(L.dq_h1) + '</h1><p class="lead">' + esc(L.dq_lead) + '</p></div></section>' +
    '<div class="wrap n30"' + (lang === 'ar' ? ' dir="rtl"' : '') + '>' + CSS +
    '<p class="k-xs">' + fill(esc(L.dq_src), { f: '<a href="/data/named.json">/data/named.json</a>', s: '<code>' + short(q.dataset.sha256) + '</code>', d: esc(fdt(q.data_updated, lang)), t: esc(fdt(q.computed_at, lang)) + (q.build ? ' (build <code>' + esc(q.build) + '</code>)' : '') }) + ' ' + esc(fill(L.dq_med_src, { n: nf(q.median_sources_per_project, lang, 1) })) + ' <a href="/api/v1/data-quality">' + esc(L.dq_api) + '</a></p>' +
    '<h2>' + esc(L.dq_f_h) + ' <small>(' + ar(lang, nf(q.projects, lang)) + ')</small></h2><div class="n30-tw"><table class="n30-t"><thead><tr>' + L.dq_th_f.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + frows + '</tbody></table></div>' +
    '<h2>' + esc(L.dq_fr_h) + '</h2>' + fr +
    '<h2>' + esc(L.dq_m_h) + '</h2><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.dq_th_m.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + mrows + '</tbody></table></div>' +
    (await (async () => { try { return dqExtra(await (await N()).data(env), lang); } catch (e) { return ''; } })()) +
    '<p class="k-xs" lang="en" dir="ltr">' + esc(q.method) + '</p><p><a href="' + P + '/data/snapshots/">' + esc(L.sn_h1) + '</a> · <a href="' + P + '/api/docs/">API v1</a> · <a href="/engineering/">' + esc(L.eng) + '</a></p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', url: canonU, name: L.dq_h1, description: L.dq_lead, inLanguage: lang, dateModified: q.data_updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: L.eng, item: ORIGIN + '/engineering/' }, { '@type': 'ListItem', position: 3, name: L.dq_h1, item: canonU }] }] };
  return assemble({ title: L.dq_title + ' | Kolaboro', desc: L.dq_lead.slice(0, 155), canon: canonU, body, ld, lastmod: q.data_updated, alt: l => ORIGIN + pre(l) + '/engineering/data-quality/' }, lang, shell, '/engineering/');
}

// ------------------------------------------------------------------------------------------------ 10: certificate
const STAGE = { 'off-plan': { es: 'sobre plano', de: 'in Planung', fr: 'sur plan', nl: 'op plan', ru: 'на этапе проекта', zh: '期房', ar: 'على المخطط' }, 'under construction': { es: 'en construcción', de: 'im Bau', fr: 'en construction', nl: 'in aanbouw', ru: 'строится', zh: '在建', ar: 'قيد الإنشاء' }, completed: { es: 'terminado', de: 'fertiggestellt', fr: 'achevé', nl: 'opgeleverd', ru: 'завершён', zh: '已完工', ar: 'مكتمل' } };
async function certificate(env, slug) {
  const n = await N(), ix = await n.data(env), x = ix.bySlug.get(slug); if (!x) return null;
  const c = ix.caseBy.get(x.id) || {}, rvd = n.reviewed(c), ho = n.handoverOf(ix, x), page = n.okHttp(x.url) ? n.fixU(x.url) : null, rw = x.rw || c.register || null;
  const [named, cases] = await Promise.all([rawFile(env, '/data/named.json'), rawFile(env, '/data/bali-cases.json')]);
  let snap = null; try { snap = await chain(env); } catch (e) {}
  const facts = { id: x.id, slug: x.s, name: x.n, developer: x.dv || null, area: x.ar && x.ar !== x.mk ? x.ar : null, market: x.mk, country: x.co, stage: c.stage || x.st || null,
    handover_on_record: ho ? ho.d : ((x.fx || {}).handover_promised || null), permit_number: x.pn || null, permit_source: x.pn ? ((n.okHttp(x.du) ? n.fixU(x.du) : null) || page) : null,
    register: rw ? { register: rw.register || null, item: rw.item || null, status: rw.status || null, checked: rw.checked || null } : null,
    reviewed: !!rvd, buyer_checks_public: rvd && c.score != null ? c.score : null, buyer_checks_of: rvd && c.max ? c.max : null, last_checked: n.lastmod(ix, x),
    developer_page: page, sources: [...new Set([page, n.okHttp(x.du) ? n.fixU(x.du) : null, ...(x.src || []).filter(n.okHttp).map(n.fixU)].filter(Boolean))].slice(0, 8) };
  const factsSha = await sha(canon(facts));
  const cert = { type: 'kolaboro-project-certificate-v1', issued: today(), issuer: { name: 'Kolaboro', url: ORIGIN + '/', public_keys: ORIGIN + '/.well-known/kolaboro-keys.json' },
    subject: { id: x.id, slug: x.s, name: x.n, page: ORIGIN + '/projects/' + x.s + '/' }, facts, facts_sha256: factsSha,
    dataset: { named_json_sha256: named.sha256, bali_cases_json_sha256: cases.sha256, snapshot_chain_tip: snap ? snap.chain_tip : null, snapshots: ORIGIN + '/data/snapshots/' },
    live_check: ORIGIN + '/projects/' + x.s + '/certificate/?h=' + factsSha.slice(0, 16),
    meaning: 'What Kolaboro published about this project on the issue date, as recorded in its data files. Not a verdict about the project or its developer, and not a guarantee.' };
  const body = canon(cert), digest = await sha(body);
  let signature = { alg: 'none', note: 'hash only: the signing key is not configured', certificate_sha256: digest };
  try { const K = await import('./kolaboro.js'); const s = await K.signBody(env, body); if (s) signature = { alg: 'Ed25519', kid: (env && env.KB_SIGN_KID) || 'kb', value: s, message: '"kolaboro-sig-v1\\n" + SHA-256 hex of the canonical JSON of "certificate" (keys sorted, no spaces)', certificate_sha256: digest }; } catch (e) {}
  return { x, cert, signature };
}
async function certPage(req, u, env, ctx, shell, lang, slug) {
  const L = T[lang], P = pre(lang), r = await certificate(env, slug); if (!r) return null;
  const { x, cert, signature } = r, F = cert.facts, K = L.ce_k, h = (u.searchParams.get('h') || '').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 64);
  const yn = v => v ? L.ce_yes : L.ce_no, stage = F.stage ? (lang === 'en' ? F.stage : ((STAGE[F.stage] || {})[lang] || F.stage)) : '';
  const row = (k, v) => v ? '<tr><th scope="row">' + esc(K[k]) + '</th><td>' + v + '</td></tr>' : '';
  const a = (href, t) => '<a href="' + esc(href) + '" rel="nofollow noopener" target="_blank"><bdi>' + esc(t) + '</bdi></a>';
  const host = s => { try { return new URL(s).hostname.replace(/^www\./, ''); } catch (e) { return s; } };
  const facts = row('developer', F.developer ? '<bdi>' + esc(F.developer) + '</bdi>' : '') + row('place', '<bdi>' + esc([F.area, F.market, F.country].filter(Boolean).join(', ')) + '</bdi>') + row('stage', esc(stage)) +
    row('handover', esc(F.handover_on_record || L.ce_none)) + row('permit', F.permit_number ? '<bdi>' + esc(F.permit_number) + '</bdi>' + (F.permit_source ? ' ' + a(F.permit_source, host(F.permit_source)) : '') : esc(L.ce_none)) +
    row('register', F.register ? '<bdi>' + esc([F.register.register, F.register.status, F.register.checked ? fdt(F.register.checked, lang) : ''].filter(Boolean).join(' · ')) + '</bdi>' : '') +
    row('reviewed', esc(yn(F.reviewed))) + row('checks', F.buyer_checks_public != null ? ar(lang, nf(F.buyer_checks_public, lang) + ' / ' + nf(F.buyer_checks_of || 6, lang)) : '') + row('checked', esc(fdt(F.last_checked, lang))) +
    row('sources', F.sources.map(s => a(s, host(s))).join(', '));
  const hrow = (k, v) => '<tr><th scope="row">' + esc(k) + '</th><td><code class="n30-h">' + esc(v || '') + '</code></td></tr>';
  const scan = h.length >= 8 ? '<p class="n30-note ' + (cert.facts_sha256.startsWith(h) ? 'ok' : 'chg') + '" role="status">' + esc(fill(cert.facts_sha256.startsWith(h) ? L.ce_same : L.ce_diff, { h: h.slice(0, 16) })) + '</p>' : '';
  const msg = { wait: L.ce_chk_wait, ok: L.ce_chk_ok, hash: L.ce_chk_hash, bad: L.ce_chk_bad, nosig: L.ce_chk_nosig, qr: L.ce_qr };
  const self = ORIGIN + P + '/projects/' + x.s + '/certificate/?h=' + cert.facts_sha256.slice(0, 16);
  const body = '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb"><a href="' + P + '/">' + esc(L.home) + '</a> / <a href="' + P + '/projects/' + x.s + '/"><bdi>' + esc(x.n) + '</bdi></a> / ' + esc(L.ce_h1) + '</p><h1>' + esc(L.ce_h1) + ': <bdi>' + esc(x.n) + '</bdi></h1><p class="lead">' + esc(fill(L.ce_lead, { n: x.n, d: fdt(cert.issued, lang) })) + '</p></div></section>' +
    '<div class="wrap n30 n30-cert"' + (lang === 'ar' ? ' dir="rtl"' : '') + ' id="ce" data-slug="' + esc(x.s) + '" data-qr="' + esc(self) + '" data-msg="' + esc(JSON.stringify(msg)) + '">' + CSS + scan +
    '<div class="n30-cg"><div><h2>' + esc(L.ce_facts) + '</h2><div class="n30-tw"><table class="n30-t"><tbody>' + facts + '</tbody></table></div></div><figure class="n30-qr"><div id="ce-qr" role="img" aria-label="' + esc(L.ce_qr) + '"></div><figcaption><small dir="ltr"><bdi>' + esc(x.id) + '</bdi> · ' + esc(fdt(cert.issued, lang)) + '</small></figcaption></figure></div>' +
    '<h2>' + esc(L.ce_hash) + '</h2><div class="n30-tw"><table class="n30-t"><tbody>' + hrow(L.ce_issued, cert.issued) + hrow(L.ce_facts_sha, cert.facts_sha256) + hrow(L.ce_named_sha, cert.dataset.named_json_sha256) + hrow(L.ce_cases_sha, cert.dataset.bali_cases_json_sha256) + hrow(L.ce_chain, cert.dataset.snapshot_chain_tip) + '</tbody></table></div>' +
    '<h2>' + esc(L.ce_sig) + '</h2><p>' + esc(signature.alg === 'Ed25519' ? fill(L.ce_signed, { k: signature.kid }) : L.ce_hashonly) + '</p>' + (signature.value ? '<p><code class="n30-h">' + esc(signature.value) + '</code></p>' : '') +
    '<p class="n30-act"><button type="button" class="btn" id="ce-go">' + esc(L.ce_chk) + '</button> <a class="btn btn-ghost" href="/api/v1/projects/' + x.s + '/certificate">' + esc(L.ce_json) + '</a> <a class="btn btn-ghost" href="' + P + '/projects/' + x.s + '/">' + esc(L.ce_live) + '</a> <button type="button" class="btn btn-ghost" id="ce-pr">' + esc(L.ce_print) + '</button></p><ul class="n30-out" id="ce-out" role="status" aria-live="polite"></ul>' +
    '<p class="k-xs">' + esc(L.ce_note) + ' <a href="' + P + '/data/snapshots/">' + esc(L.sn_h1) + '</a> · <a href="/verify/">/verify/</a></p></div><script>' + CERT_JS + '</script>';
  const canonU = ORIGIN + P + '/projects/' + x.s + '/certificate/';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', url: canonU, name: fill(L.ce_title, { n: x.n }), inLanguage: lang, dateModified: cert.issued, about: { '@type': 'Place', name: x.n, url: ORIGIN + P + '/projects/' + x.s + '/' } }] };
  const html = await assemble({ title: fill(L.ce_title, { n: x.n }) + ' | Kolaboro', desc: fill(L.ce_lead, { n: x.n, d: fdt(cert.issued, lang) }).slice(0, 155), canon: canonU, body, ld, lastmod: cert.issued, alt: l => ORIGIN + pre(l) + '/projects/' + x.s + '/certificate/' }, lang, shell, '/verify/');
  return page(html, lang, { 'x-robots-tag': 'noindex, follow' });
}
// QR: qrcodejs 1.0.0 from cdnjs with SRI (the same file and hash as k/site.js), loaded only on this page; check: canonical JSON + SHA-256 + Ed25519
const CERT_JS = "(function(){var R=document.getElementById('ce');if(!R)return;var M=JSON.parse(R.getAttribute('data-msg')),O=document.getElementById('ce-out'),te=new TextEncoder();" +
  "var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.integrity='sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU';s.crossOrigin='anonymous';s.onload=function(){try{new QRCode(document.getElementById('ce-qr'),{text:R.getAttribute('data-qr'),width:176,height:176,correctLevel:QRCode.CorrectLevel.M});}catch(e){}};document.head.appendChild(s);" +
  "function canon(v){if(v===null||typeof v!=='object')return JSON.stringify(v===undefined?null:v);if(Array.isArray(v))return'['+v.map(canon).join(',')+']';return'{'+Object.keys(v).filter(function(k){return v[k]!==undefined;}).sort().map(function(k){return JSON.stringify(k)+':'+canon(v[k]);}).join(',')+'}';}" +
  "function H(t){return crypto.subtle.digest('SHA-256',te.encode(t)).then(function(d){return Array.prototype.map.call(new Uint8Array(d),function(x){return('0'+x.toString(16)).slice(-2);}).join('');});}" +
  "function li(t,ok){var e=document.createElement('li');e.textContent=(ok===false?'\\u2717 ':ok===null?'\\u2022 ':'\\u2713 ')+t;O.appendChild(e);}" +
  "document.getElementById('ce-pr').addEventListener('click',function(){window.print();});" +
  "document.getElementById('ce-go').addEventListener('click',function(){var b=this;b.disabled=true;O.textContent='';li(M.wait,null);fetch('/api/v1/projects/'+R.getAttribute('data-slug')+'/certificate',{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){var c=j.certificate,g=j.signature;" +
  "return H(canon(c.facts)).then(function(fh){if(fh!==c.facts_sha256)throw 0;return H(canon(c));}).then(function(ch){if(g.certificate_sha256!==ch)throw 0;if(g.alg!=='Ed25519'){O.textContent='';li(M.hash);return;}" +
  "return fetch('/.well-known/kolaboro-keys.json').then(function(r){return r.json();}).then(function(k){var raw=Uint8Array.from(atob(k.keys[0].public_key_raw_b64),function(x){return x.charCodeAt(0);});return crypto.subtle.importKey('raw',raw,{name:'Ed25519'},false,['verify']).then(function(key){return crypto.subtle.verify({name:'Ed25519'},key,Uint8Array.from(atob(g.value),function(x){return x.charCodeAt(0);}),te.encode('kolaboro-sig-v1\\n'+ch));}).then(function(ok){O.textContent='';li(ok?M.ok:M.bad,ok?true:false);},function(){O.textContent='';li(M.nosig,null);});});});}).catch(function(){O.textContent='';li(M.bad,false);}).then(function(){b.disabled=false;});});})();";

// ------------------------------------------------------------------------------------------------ 11: developer websites
async function devWebsite(req, env, slug, rh) {
  const n = await N(), ix = await n.data(env), dv = ix.devs.get(slug); if (!dv) return jerr({ error: 'not_found' }, 404, rh);
  const W = await import('./kbx_web.js'), wd = await W.webData(env), H = (wd && wd.health && wd.health.d) || {}, FZ = (wd && wd.forensics && wd.forensics.d) || {};
  const doms = ((wd && wd.devDoms && wd.devDoms.get(slug)) || []).slice().sort();
  const o = { api: 'kolaboro-developer-website-v1', developer: { slug, name: dv.n, page: ORIGIN + '/developers/' + slug + '/' }, updated: wd && wd.health ? wd.health.updated : null,
    legend: { health: (wd && wd.health && wd.health.legend) || null, registered: 'domain registration date from the registry RDAP (rdap.org bootstrap)', tls_issuer: 'issuer of the newest unexpired certificate in the certificate transparency logs (Cert Spotter)' },
    domains: doms.map(d => ({ domain: d, health: H[d] || null, forensics: FZ[d] || null, rdap: 'https://client.rdap.org/?type=domain&object=' + encodeURIComponent(d), ct: 'https://crt.sh/?q=' + encodeURIComponent(d) })) };
  return out(req, JSON.stringify(o), { extra: rh, maxAge: 900 });
}

// ------------------------------------------------------------------------------------------------ 9: API docs and OpenAPI
let OA = null;
async function openapiV1(env) {
  if (OA && Date.now() - OA.t < 600000) return OA.v;
  const full = await jsonFile(env, '/docs/api/openapi.json');
  const paths = Object.fromEntries(Object.entries(full.paths || {}).filter(([p]) => p.startsWith('/api/v1/') && !/xray|watch/.test(p)));
  const v = { openapi: '3.1.0', info: { title: 'Kolaboro API v1', version: '2026-11-17', summary: 'Open, read-only JSON about tracked off-plan projects and their developers.', description: 'No key. CORS open. Rate limit 120 calls a minute per IP per endpoint group, announced in RateLimit-Policy and RateLimit (draft-ietf-httpapi-ratelimit-headers) and X-RateLimit-*. ETag on every answer: send If-None-Match to get 304. Ids (BALI-014) and slugs are stable. Playground: https://kolaboro.com/api/docs/. Full description of every public endpoint: https://kolaboro.com/docs/api/openapi.json', license: full.info && full.info.license, contact: full.info && full.info.contact },
    servers: [{ url: ORIGIN }], paths, components: full.components || {} };
  OA = { t: Date.now(), v }; return v;
}
const EPS = [['projects', '/api/v1/projects'], ['project', '/api/v1/projects/{slug}', 'coco-hills'], ['developers', '/api/v1/developers'], ['developer', '/api/v1/developers/{slug}', 'coco-development-group'], ['website', '/api/v1/developers/{slug}/website', 'coco-development-group'], ['changes', '/api/v1/changes?since={since}', '2026-11-15'], ['feed', '/api/v1/changes/feed.json'], ['certificate', '/api/v1/projects/{slug}/certificate', 'coco-hills'], ['snapshots', '/api/v1/snapshots'], ['quality', '/api/v1/data-quality'], ['search', '/api/v1/search-index']];
async function docsPage(req, u, env, ctx, shell, lang) {
  const L = T[lang], P = pre(lang), canonU = ORIGIN + P + '/api/docs/';
  const rows = EPS.map(([k, p, ex]) => { const v = ex ? p.replace(/\{[a-z]+\}/, ex) : p; return '<li class="n30-ep"><div><code dir="ltr">GET ' + esc(p) + '</code><p>' + esc(L.ad_d[k]) + '</p></div><button type="button" class="btn btn-ghost" data-try="' + esc(v) + '">' + esc(L.ad_try) + '</button></li>'; }).join('');
  const msg = { st: L.ad_status, tm: L.ad_time, hd: L.ad_hdr, bd: L.ad_body, again: L.ad_again };
  const body = '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb"><a href="' + P + '/">' + esc(L.home) + '</a> / <a href="/docs/api/">API</a> / v1</p><h1>' + esc(L.ad_h1) + '</h1><p class="lead">' + esc(L.ad_lead) + '</p></div></section>' +
    '<div class="wrap n30" id="ad"' + (lang === 'ar' ? ' dir="rtl"' : '') + ' data-msg="' + esc(JSON.stringify(msg)) + '">' + CSS +
    '<h2>' + esc(L.ad_ep) + '</h2><ul class="n30-eps">' + rows + '</ul>' +
    '<form id="ad-f" class="n30-try"><label for="ad-u">URL</label><div class="n30-row"><input id="ad-u" dir="ltr" value="/api/v1/projects/coco-hills" spellcheck="false" autocomplete="off"><button class="btn" type="submit">' + esc(L.ad_try) + '</button> <button class="btn btn-ghost" type="button" id="ad-again" hidden>' + esc(L.ad_again) + '</button></div></form>' +
    '<div id="ad-res" hidden><p id="ad-st" role="status" aria-live="polite"></p><details><summary>' + esc(L.ad_hdr) + '</summary><pre dir="ltr" class="n30-pre" id="ad-h"></pre></details><h3>' + esc(L.ad_body) + '</h3><pre dir="ltr" class="n30-pre n30-body" id="ad-b" tabindex="0"></pre><p class="k-xs" dir="ltr"><code id="ad-curl"></code></p></div>' +
    '<h2>' + esc(L.ad_lim_h) + '</h2><p>' + esc(L.ad_lim) + '</p><ul class="lk"><li><a href="/api/v1/openapi.json">' + esc(L.ad_spec) + '</a></li><li><a href="/docs/api/explorer/">' + esc(L.ad_full) + '</a></li><li><a href="' + P + '/data/snapshots/">' + esc(L.sn_h1) + '</a></li><li><a href="' + P + '/engineering/data-quality/">' + esc(L.dq_h1) + '</a></li></ul></div><script>' + DOCS_JS + '</script>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebAPI', name: 'Kolaboro API v1', url: canonU, documentation: ORIGIN + '/api/v1/openapi.json', provider: { '@id': ORIGIN + '/#org' }, termsOfService: ORIGIN + '/legal/terms/' }] };
  return assemble({ title: L.ad_title + ' | Kolaboro', desc: L.ad_lead.slice(0, 155), canon: canonU, body, ld, lastmod: '2026-11-17', alt: l => ORIGIN + pre(l) + '/api/docs/' }, lang, shell, '/docs/api/');
}
const DOCS_JS = "(function(){var R=document.getElementById('ad');if(!R)return;var M=JSON.parse(R.getAttribute('data-msg')),f=document.getElementById('ad-f'),inp=document.getElementById('ad-u'),ag=document.getElementById('ad-again'),last=null;" +
  "function go(etag){var u=inp.value.trim();if(!/^\\/api\\/v1\\//.test(u)){inp.setAttribute('aria-invalid','true');return;}inp.removeAttribute('aria-invalid');var t0=performance.now(),h={};if(etag)h['If-None-Match']=etag;" +
  "fetch(u,{headers:h,cache:'no-store'}).then(function(r){var ms=Math.round(performance.now()-t0),hs=[];r.headers.forEach(function(v,k){hs.push(k+': '+v);});last=r.headers.get('etag');ag.hidden=!last;" +
  "return r.text().then(function(t){document.getElementById('ad-res').hidden=false;document.getElementById('ad-st').textContent=M.st+': '+r.status+' \\u00b7 '+M.tm+': '+ms+' ms';document.getElementById('ad-h').textContent=hs.sort().join('\\n');var b=t;try{b=JSON.stringify(JSON.parse(t),null,2);}catch(e){}if(b.length>60000)b=b.slice(0,60000)+'\\n\\u2026';document.getElementById('ad-b').textContent=r.status===304?'(304 Not Modified)':b;document.getElementById('ad-curl').textContent='curl -s'+(etag?\" -H 'If-None-Match: \"+etag+\"'\":'')+\" 'https://kolaboro.com\"+u+\"'\";});}).catch(function(e){document.getElementById('ad-res').hidden=false;document.getElementById('ad-st').textContent=String(e);});}" +
  "f.addEventListener('submit',function(e){e.preventDefault();go();});ag.addEventListener('click',function(){go(last);});" +
  "R.querySelectorAll('[data-try]').forEach(function(b){b.addEventListener('click',function(){inp.value=b.getAttribute('data-try');go();inp.scrollIntoView({block:'center'});});});})();";

// ------------------------------------------------------------------------------------------------ 14: manifest and offline page
const MANIFEST = { name: 'Kolaboro: check off-plan property projects', short_name: 'Kolaboro', id: '/', start_url: '/', scope: '/', display: 'standalone', background_color: '#F6F6F3', theme_color: '#17212B', lang: 'en', dir: 'auto',
  description: 'Sourced facts, dates and official register checks for off-plan property projects. Projects you save and comparisons you open stay readable offline.',
  icons: [{ src: '/k/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/k/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/k/icon-512m.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }, { src: '/k/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  shortcuts: [{ name: 'Projects', url: '/projects/' }, { name: 'My projects', url: '/watchlist/' }, { name: 'Compare', url: '/compare/' }, { name: 'Find a listing', short_name: 'Find', url: '/tools/find-listing/' }, { name: 'Tools', url: '/tools/' }],   // n31e: two more shortcuts
  categories: ['business', 'finance', 'utilities'], launch_handler: { client_mode: 'navigate-existing' }, prefer_related_applications: false };   // n31e (batch 31, item 166)
async function offPage(req, u, env, ctx, shell, lang) {
  const L = T[lang], P = pre(lang), canonU = ORIGIN + P + '/offline/';
  const body = '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><h1>' + esc(L.of_h1) + '</h1><p class="lead">' + esc(L.of_lead) + '</p><p><button type="button" class="btn" id="of-retry">' + esc(L.of_retry) + '</button></p></div></section>' +
    '<div class="wrap n30" id="of"' + (lang === 'ar' ? ' dir="rtl"' : '') + ' data-none="' + esc(L.of_none) + '">' + CSS + '<h2>' + esc(L.of_list) + '</h2><ul class="lk" id="of-l"></ul></div>' +
    "<script>(function(){document.getElementById('of-retry').addEventListener('click',function(){location.reload();});var ul=document.getElementById('of-l'),R=document.getElementById('of');if(!('caches' in window)){ul.outerHTML='<p>'+R.getAttribute('data-none')+'</p>';return;}" +
    "Promise.all(['kb-my-v1','kb-saved-v1'].map(function(n){return caches.open(n).then(function(c){return c.keys();}).catch(function(){return [];});})).then(function(a){var seen={},n=0;a[0].concat(a[1]).forEach(function(r){var p=new URL(r.url).pathname;if(seen[p]||!/^\\/(?:[a-z]{2}\\/)?(?:projects|developers|compare|p|guides)\\//.test(p)||/\\.(json|js|css|png|svg)$/.test(p))return;seen[p]=1;n++;var li=document.createElement('li'),x=document.createElement('a');x.href=p+new URL(r.url).search;x.textContent=decodeURIComponent(p.replace(/^\\/(?:[a-z]{2}\\/)?/,'').replace(/\\/$/,'').replace(/[-/]/g,' '));li.appendChild(x);ul.appendChild(li);});if(!n)ul.outerHTML='<p>'+R.getAttribute('data-none')+'</p>';});})();</script>";
  const html = await assemble({ title: L.of_title + ' | Kolaboro', desc: L.of_lead, canon: canonU, body, ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: L.of_title, url: canonU }, lastmod: '2026-11-17', alt: l => ORIGIN + pre(l) + '/offline/' }, lang, shell, '/about/');
  return page(html, lang, { 'x-robots-tag': 'noindex, follow' });
}

// ------------------------------------------------------------------------------------------------ shared
const CSS = '<style id="n30b-css">.n30{padding-bottom:40px}.n30 h2{margin-top:28px}.n30-tw{overflow-x:auto;margin:8px 0 16px}.n30-t{width:100%;border-collapse:collapse}.n30-t th,.n30-t td{text-align:start;padding:8px;border-bottom:1px solid var(--line,#DDE3E0);vertical-align:top;font-variant-numeric:tabular-nums}' +
  '.n30-t td{overflow-wrap:anywhere}.n30-t thead th{font-size:.85rem;color:var(--muted,#56635D)}.n30-sm td,.n30-sm th{font-size:.9rem;padding:6px}.n30 code{font-size:.85em;overflow-wrap:anywhere}.n30-h{display:inline-block;max-width:100%;overflow-wrap:anywhere;word-break:break-all}.n30-pre{background:var(--k-sunken,#EEF1EF);padding:12px;border-radius:6px;overflow:auto;max-width:100%;white-space:pre-wrap;word-break:break-all;font-size:.82rem}' +
  '.n30-body{max-height:440px}.n30-out{list-style:none;padding:0;margin:8px 0}.n30-out li{padding:4px 0}.n30-out li.bad{color:var(--k-bad,#A12A1C);font-weight:700}.n30-bar{display:inline-block;width:110px;height:8px;background:var(--k-sunken,#E8ECEA);border-radius:4px;vertical-align:middle;overflow:hidden}.n30-bar i{display:block;height:100%;background:var(--k-ok,#1F6B45)}' +
  '.n30-fr{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:8px 24px}.n30-eps{list-style:none;padding:0;margin:0}.n30-ep{display:flex;gap:12px;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line,#DDE3E0)}.n30-ep p{margin:2px 0 0;color:var(--muted,#56635D);font-size:.92rem}.n30-ep code{overflow-wrap:anywhere}' +
  '.n30-try{margin:20px 0 8px}.n30-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.n30-row input{flex:1 1 260px;min-width:0;padding:10px;font:inherit;font-family:ui-monospace,monospace;border:1px solid var(--line-2,#C9D1CE);border-radius:6px;background:var(--bg,#fff);color:inherit}' +
  '.n30-cg{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px 28px;align-items:start}.n30-qr{margin:28px 0 0;text-align:center}.n30-qr #ce-qr{background:#fff;padding:10px;display:inline-block;min-width:176px;min-height:176px}.n30-note{padding:10px 14px;border-radius:6px;border:2px solid var(--k-ok,#1F6B45)}.n30-note.chg{border-color:var(--k-warn,#8A5A00)}.n30-act .btn{margin:4px 6px 4px 0}' +
  '.sn-tip td{font-style:italic}@media (max-width:640px){.n30-cg{grid-template-columns:minmax(0,1fr)}.n30-ep{flex-direction:column;align-items:flex-start}}@media print{header,footer,.n30-act,.kx-tick,nav{display:none!important}.n30-qr #ce-qr{border:0}}</style>';
async function assemble(pg, lang, shell, shellPath) {
  const n = await N();
  return n.assemble(pg, lang, await shell(pre(lang) + shellPath));
}

// ------------------------------------------------------------------------------------------------ router
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!PATHS.test(p)) return null;
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (p === '/manifest.webmanifest') return new Response(JSON.stringify(MANIFEST), { headers: { 'content-type': 'application/manifest+json; charset=utf-8', 'cache-control': 'public, max-age=86400', 'access-control-allow-origin': '*' } });
  if (p.startsWith('/api/v1/')) {
    const rl = await rate(req, ctx, 'n30', LIMIT), rh = rlHeaders(rl);
    if (!rl.ok) return jerr({ error: 'rate_limited', limit_per_minute: LIMIT, retry_after_s: rl.reset }, 429, Object.assign(rh, { 'retry-after': String(rl.reset) }));
    try {
      if (p === '/api/v1/snapshots') { const body = JSON.stringify(await chain(env), null, 1); return out(req, body, { extra: Object.assign({}, rh, (await signed(env, body)) || {}), maxAge: 120 }); }
      if (p === '/api/v1/openapi.json') return out(req, JSON.stringify(await openapiV1(env), null, 1), { extra: rh, maxAge: 3600 });
      if (p === '/api/v1/data-quality') return out(req, JSON.stringify(await quality(env), null, 1), { extra: rh, maxAge: 900 });
      if (p === '/api/v1/changes') return changes(req, u, env, rh);
      if (p === '/api/v1/changes/feed.json') return changesFeed(req, env, rh);
      let m = /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\/certificate$/.exec(p);
      if (m) { const r = await certificate(env, m[1]); if (!r) return jerr({ error: 'not_found', note: 'No named project at this slug. List: ' + ORIGIN + '/api/v1/projects' }, 404, rh); return out(req, JSON.stringify({ certificate: r.cert, signature: r.signature }, null, 1), { extra: rh, maxAge: 600 }); }
      m = /^\/api\/v1\/developers\/([a-z0-9-]{1,90})\/website$/.exec(p);
      if (m) return devWebsite(req, env, m[1], rh);
    } catch (e) { return jerr({ error: 'unavailable', detail: String(e && e.message || e).slice(0, 120) }, 503, rh); }
    return null;
  }
  let m;
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  if ((m = RX.snap.exec(p))) return page(await snapPage(req, u, env, ctx, shell, m[1] || 'en'), m[1] || 'en');
  if ((m = RX.docs.exec(p))) return page(await docsPage(req, u, env, ctx, shell, m[1] || 'en'), m[1] || 'en');
  if ((m = RX.dq.exec(p))) return page(await dqPage(req, u, env, ctx, shell, m[1] || 'en'), m[1] || 'en');
  if ((m = RX.off.exec(p))) return offPage(req, u, env, ctx, shell, m[1] || 'en');
  if ((m = RX.certP.exec(p))) return certPage(req, u, env, ctx, shell, m[1] || 'en', m[2]);
  return null;
}
export { canon, chain, quality, allChanges, certificate };   // certificate: n31e (batch 31) MCP tool get_certificate
