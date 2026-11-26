// comments: _notes/kolaboro-worker-comments.txt
import { data, isListing, okHttp, host } from './kbx_named.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/fraud\//;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'public, max-age=3600' }, H) });
const SLD = new Set(['co', 'com', 'net', 'org', 'or', 'ac', 'go', 'web', 'my', 'biz', 'gov', 'edu', 'ne', 'in', 'sch', 'ltd', 'plc', 'gen', 'firm', 'gr', 'me']);
export function regDomain(h) { const p = String(h).toLowerCase().replace(/^www\./, '').replace(/\.$/, '').split('.'); if (p.length <= 2) return p.join('.'); return (SLD.has(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3) : p.slice(-2)).join('.'); }
const HOST_RX = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/;
const STOP = new Set(['group', 'development', 'developments', 'developer', 'developers', 'properties', 'property', 'real', 'estate', 'holding', 'holdings', 'limited', 'company', 'residence', 'residences', 'villas', 'villa', 'resort', 'tower', 'towers', 'city', 'park', 'the', 'international', 'construction', 'homes', 'living', 'and', 'ltd', 'llc', 'plc', 'inc', 'bhd', 'sdn', 'tbk', 'pte']);
const toks = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(t => t.length >= 3 && !STOP.has(t));
const compact = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
const initials = s => String(s || '').split(/[^A-Za-z0-9]+/).filter(Boolean).map(w => w[0].toLowerCase()).join('');
function nameMatch(label, x) {
const l = label.replace(/[^a-z0-9]/g, '');
for (const n of [x.dv, x.n]) {
if (!n) continue;
const c = compact(n), ini = initials(n);
if (c.length >= 4 && (l.includes(c) || c.includes(l) && l.length >= 4)) return true;
if (ini.length >= 3 && (l === ini || l.startsWith(ini))) return true;
if (toks(n).some(t => l.includes(t))) return true;
}
return false;
}
let LIST = null;
async function domains(env) {
const ix = await data(env);
if (LIST && LIST.ix === ix) return LIST.v;
const M = new Map();
for (const x of ix.P) {
for (const u of [x.url, x.du]) {
if (!okHttp(u) || isListing(u)) continue;
const h = host(u); if (!h) continue;
const d = regDomain(h), label = d.split('.')[0];
let e = M.get(d); if (!e) M.set(d, e = { d, devs: new Map(), p: 0, m: false });
const key = x.dvs || ('p:' + x.id);
if (!e.devs.has(key)) e.devs.set(key, { dv: x.dv || null, ds: x.dvs || null, ps: x.s, pn: x.n || null, co: x.co || null });
e.p++; if (nameMatch(label, x)) e.m = true;
}
}
const list = [], shared = [];
for (const e of M.values()) {
if (e.devs.size > 1) { shared.push(e.d); continue; }
const v = [...e.devs.values()][0];
list.push({ d: e.d, dv: v.dv, url: v.ds ? '/developers/' + v.ds + '/' : '/projects/' + v.ps + '/', pn: v.ds ? null : v.pn, co: v.co, p: e.p, m: e.m ? 1 : 0 });
}
list.sort((a, b) => a.d < b.d ? -1 : 1); shared.sort();
const v = {
updated: ix.updated || null, n: list.length, named: list.filter(x => x.m).length,
note: TB.kbx_fraud__s.k0,
source: '/data/named.json', domains: list, shared,
};
LIST = { ix, v };
return v;
}
async function doh(name, type) {
const url = TB.kbx_fraud__t.k0 + encodeURIComponent(name) + '&type=' + type;
try {
const r = await fetch(url, { headers: { accept: 'application/dns-json' }, cf: { cacheTtl: 300, cacheEverything: true } });
if (!r.ok) return { ok: false, url };
const j = await r.json();
return { ok: true, url, status: j.Status, ans: (j.Answer || []).filter(a => a.type === { TXT: 16, MX: 15, A: 1 }[type]).map(a => String(a.data)) };
} catch (e) { return { ok: false, url }; }
}
const txt = s => s.replace(/^"|"$/g, '').replace(/"\s*"/g, '');
async function rdap(d) {
const url = 'https://rdap.org/domain/' + encodeURIComponent(d);
try {
const r = await fetch(url, { headers: { accept: TB.kbx_fraud__t.k1, 'user-agent': 'kolaboro.com payment-email-check' }, redirect: 'follow', cf: { cacheTtl: 86400, cacheEverything: true } });
if (r.status === 404) return { found: false, url, reason: 'not_published' };
if (!r.ok) return { found: false, url, reason: 'unavailable' };
const j = await r.json(), ev = a => ((j.events || []).find(e => e.eventAction === a) || {}).eventDate || null;
const reg = (j.entities || []).find(e => (e.roles || []).includes('registrar'));
const fn = reg && reg.vcardArray && reg.vcardArray[1] && reg.vcardArray[1].find(x => x[0] === 'fn');
const self = (j.links || []).find(l => l.rel === 'self');
const registered = ev('registration');
return { found: true, url, record: self ? self.href : r.url || url, registered, age_days: registered ? Math.floor((Date.now() - Date.parse(registered)) / 864e5) : null, expires: ev('expiration'), changed: ev('last changed'), registrar: fn ? fn[3] : null };
} catch (e) { return { found: false, url, reason: 'unavailable' }; }
}
async function domainFacts(h) {
const org = regDomain(h);
const [spfH, dmH, dmO, mx, rd] = await Promise.all([doh(h, 'TXT'), doh('_dmarc.' + h, 'TXT'), org !== h ? doh('_dmarc.' + org, 'TXT') : null, doh(h, 'MX'), rdap(org)]);
const spf = spfH.ok ? (spfH.ans.map(txt).find(t => /^v=spf1\b/i.test(t)) || null) : undefined;
let dmSrc = dmH, dm = dmH.ok ? (dmH.ans.map(txt).find(t => /^v=dmarc1\b/i.test(t)) || null) : undefined;
if (!dm && dmO && dmO.ok) { const d2 = dmO.ans.map(txt).find(t => /^v=dmarc1\b/i.test(t)) || null; if (d2) { dm = d2; dmSrc = dmO; } }
const tag = (r, k) => { const m = r && r.match(new RegExp('(?:^|;)\\s*' + k + '\\s*=\\s*([^;\\s]+)', 'i')); return m ? m[1].toLowerCase() : null; };
return {
domain: h, org,
spf: { record: spf === undefined ? null : spf, all: spf ? ((spf.match(/([-~?+])all\b/i) || [])[1] || null) : null, lookup: spfH.ok ? 'ok' : 'unavailable', src: spfH.url },
dmarc: { record: dm === undefined ? null : dm, p: tag(dm, 'p'), sp: tag(dm, 'sp'), lookup: dmH.ok ? 'ok' : 'unavailable', src: dmSrc.url },
mx: { hosts: mx.ok ? mx.ans.map(a => a.split(/\s+/).pop().replace(/\.$/, '').toLowerCase()).slice(0, 6) : [], lookup: mx.ok ? 'ok' : 'unavailable', nxdomain: mx.ok && mx.status === 3, src: mx.url },
rdap: rd,
checked: new Date().toISOString(),
sources: { dns: { name: 'DNS over HTTPS, Cloudflare 1.1.1.1', url: TB.kbx_fraud__t.k2 }, rdap: { name: TB.kbx_fraud__t.k3, url: 'https://about.rdap.org/' } },
};
}
async function bicName(b) {
const q = b.length === 8 ? b + 'XXX' : b;
const url = TB.kbx_fraud__t.k4 + q + '&page[size]=3';
const page = TB.kbx_fraud__t.k5 + q;
try {
let r = await fetch(url, { headers: { accept: 'application/vnd.api+json' }, cf: { cacheTtl: 86400, cacheEverything: true } });
let j = r.ok ? await r.json() : null;
if (j && !(j.data || []).length && q.slice(8) !== 'XXX') {
r = await fetch(url.replace(q, q.slice(0, 8) + 'XXX'), { headers: { accept: 'application/vnd.api+json' }, cf: { cacheTtl: 86400, cacheEverything: true } });
j = r.ok ? await r.json() : null; if (j) j.office = true;
}
if (!j) return { bic: b, found: null, reason: 'unavailable', src: url };
const x = (j.data || [])[0];
if (!x) return { bic: b, found: false, src: url, page };
const e = x.attributes.entity, tr = (e.transliteratedOtherNames || [])[0] || (e.otherNames || []).find(n => /^[\x20-\x7e]+$/.test(n.name || ''));
return {
bic: b, found: true, via_head_office: !!j.office, lei: x.id, name: e.legalName && e.legalName.name, name_latin: tr ? tr.name : null,
country: e.legalAddress && e.legalAddress.country, city: e.legalAddress && e.legalAddress.city, status: e.status, record: 'https://search.gleif.org/#/record/' + x.id, src: url,
source: { name: TB.kbx_fraud__t.k6, licence: 'CC0 1.0', url: TB.kbx_fraud__t.k7 },
};
} catch (e) { return { bic: b, found: null, reason: 'unavailable', src: url }; }
}
async function limited(req, ctx, max) {
try {
const ip0 = req.headers.get('cf-connecting-ip') || 'x', ip = ip0.includes(':') ? ip0.split(':').slice(0, 4).join(':') : ip0, hour = new Date().toISOString().slice(0, 13);
const k = new Request('https://kolaboro.com/__fraud_rl/' + encodeURIComponent(ip) + '/' + hour);
const hit = await caches.default.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
if (n >= max) return true;
const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } }));
if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
} catch (e) {}
return false;
}
export async function handle(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405, 'no-store');
const p = u.pathname.replace(/\/+$/, '');
if (p === '/api/x/fraud/domains') {
try { return out(await domains(env), 200, 'public, max-age=3600'); } catch (e) { return out({ error: 'unavailable' }, 503, 'no-store'); }
}
if (p === '/api/x/fraud/domain' || p === '/api/x/fraud/bic') {
const isB = p.endsWith('/bic');
const raw = String(u.searchParams.get(isB ? 'b' : 'd') || '').trim();
const v = isB ? raw.toUpperCase().replace(/\s+/g, '') : raw.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
if (isB ? !/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v) : !HOST_RX.test(v)) return out({ error: isB ? TB.kbx_fraud__t.k8 : 'one domain name, like example.com' }, 400, 'no-store');
const cache = caches.default, key = new Request('https://kolaboro.com/__c/fraud-v1/' + (isB ? 'b/' : 'd/') + v);
try { const hit = await cache.match(key); if (hit) return hit; } catch (e) {}
if (await limited(req, ctx, 120)) return out({ error: 'rate', note: TB.kbx_fraud__t.k9 }, 429, 'no-store');
const body = isB ? await bicName(v) : await domainFacts(v);
const ok = isB ? body.found !== null : (body.spf.lookup === 'ok' || body.rdap.found);
const res = out(body, 200, ok ? 'public, max-age=21600' : 'no-store');
if (ok && ctx && ctx.waitUntil) ctx.waitUntil(cache.put(key, res.clone()).catch(() => {}));
return res;
}
return out({ error: 'not found', endpoints: ['/api/x/fraud/domains', '/api/x/fraud/domain?d=example.com', '/api/x/fraud/bic?b=DEUTDEFF'] }, 404, 'public, max-age=60');
}
