// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_xray__q, $s = TB.kbx_xray__s, $t = TB.kbx_xray__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { fetchPage, okUrl, pageParts, scanInjection, rpc, sha, WKEY, api as kbApi, logApi } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/kb\/xray(?:\/stats)?\/?$|^\/api\/v1\/xray(?:\/openapi\.json)?\/?$|^\/x\/[0-9a-f]{64}(?:\/|\.json|\/vc)?$/;
const XV = 'n40k40a';
const ORIGIN = 'https://kolaboro.com', VERSION = 'kolaboro-xray-1', PER_IP_HOUR = 30, CARD_MS = 12000;
const te = new TextEncoder();
const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256Buf = async b => hexOf(await crypto.subtle.digest($q.a, b));
function jcs(v) {
if (v === null || typeof v !== $q.b) return JSON.stringify(v === undefined ? null : (typeof v === $q.c && !isFinite(v) ? null : v));
if (Array.isArray(v)) return '[' + v.map(jcs).join(',') + ']';
return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
}
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'x-api-key, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const out = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': $q.d, 'cache-control': $q.e, 'x-content-type-options': $q.f }, CORS, extra || {}) });
const RESKEY = r => new Request(ORIGIN + $q.g + r);
const INKEY = k => new Request(ORIGIN + $q.h + k);
const ent = t => String(t).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#(\d{1,6});/g, (m, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ' '; } }).replace(/&#x([0-9a-f]{1,6});/gi, (m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return ' '; } }).replace(/&(?:nbsp|#160);/g, ' ').replace(/&[a-z]{2,8};/gi, ' ');
const clip = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const isoDay = d => { try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return null; } };
const yearsSince = d => { const t = Date.parse(d); return isFinite(t) ? Math.floor((Date.now() - t) / (365.25 * 86400000) * 10) / 10 : null; };
const SLD = new Set(['co', 'com', 'net', 'org', 'or', 'ac', 'go', 'web', 'my', 'biz', 'gov', 'edu', 'ne', 'in', 'sch', 'ltd', 'plc', 'gen', 'firm']);
function regDomain(h) { const p = h.toLowerCase().replace(/^www\./, '').split('.'); if (p.length <= 2) return p.join('.'); return (SLD.has(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3) : p.slice(-2)).join('.'); }
function parseInput(raw) {
raw = String(raw || '').trim().slice(0, 500);
if (raw.length < 3) return null;
if (/^(https?:\/\/)?[^\s\/]+\.[a-z]{2,}(\/\S*)?$/i.test(raw)) { const u = okUrl(raw); if (!u) return { kind: 'bad' }; return { kind: 'url', url: u.toString(), host: u.hostname.toLowerCase().replace(/^www\./, ''), q: null }; }
return { kind: 'name', url: null, host: null, q: raw.replace(/\s+/g, ' ').slice(0, 120) };
}
function makeFetcher(sources) {
return async function xfetch(url, init, name, ms) {
const t = Date.now(), rec = { name: name || new URL(url).hostname, url: String(url), status: 0, bytes: 0, sha256: null, ms: 0 };
sources.push(rec);
try {
const r = await fetch(url, Object.assign({ headers: { 'user-agent': $t.UA, accept: $t.k0 }, signal: AbortSignal.timeout(ms || 8000), cf: { cacheTtl: 3600, cacheEverything: true } }, init || {}));
const buf = await r.arrayBuffer();
rec.status = r.status; rec.bytes = buf.byteLength; rec.sha256 = await sha256Buf(buf); rec.ms = Date.now() - t;
return { ok: r.ok, status: r.status, buf, headers: r.headers, text: () => new TextDecoder().decode(buf), json: () => JSON.parse(new TextDecoder().decode(buf)) };
} catch (e) { rec.ms = Date.now() - t; rec.error = e && e.name === $q.i ? $q.j : $q.k; return { ok: false, status: 0, error: rec.error, buf: new ArrayBuffer(0), text: () => '', json: () => null }; }
};
}
let NM = null;
async function named(env) { if (!NM) NM = await import('./kbx_named.js'); return NM.data(env); }
const normName = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\b(the|by|villas?|residences?|resort|project|bali|lombok|dubai|phuket)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const toks = s => new Set(normName(s).split(' ').filter(w => w.length > 1));
function sim(a, b) { const A = toks(a), B = toks(b); if (!A.size || !B.size) return 0; let n = 0; A.forEach(x => { if (B.has(x)) n++; }); const r = n / Math.max(A.size, B.size); return n === B.size && B.size >= 2 ? Math.max(r, 0.85) : r; }
const hostOf = u => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; } };
const pathOf = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).toLowerCase().replace(/\/+$/, ''); } catch (e) { return ''; } };
function coiHit(ix, inp) {
const raw = (ix.named && ix.named.projects) || [];
const sumba = raw.filter(x => String(x.mk || '').toLowerCase() === 'sumba');
if (inp.host && sumba.some(x => hostOf(x.url) === inp.host || hostOf(x.du) === inp.host)) return true;
if (inp.q && (/\bsumba\b/i.test(inp.q) || sumba.some(x => sim(x.n, inp.q) >= 0.8))) return true;
return false;
}
function findMatch(ix, inp) {
let project = null, developer = null, also = [], how = null;
if (inp.kind === 'url') {
const p = pathOf(inp.url), h = inp.host, rd = regDomain(h);
project = ix.P.find(x => x.url && pathOf(x.url) === p) || null; if (project) how = $q.l;
const sameHost = ix.P.filter(x => x.url && (hostOf(x.url) === h || regDomain(hostOf(x.url)) === rd));
const devHost = ix.P.filter(x => x.du && regDomain(hostOf(x.du)) === rd);
if (!project && sameHost.length === 1) { project = sameHost[0]; how = $q.m; }
const pool = sameHost.concat(devHost);
if (pool.length) { const dv = pool[0].dvs; if (dv && ix.devs.has(dv) && pool.every(x => x.dvs === dv)) developer = ix.devs.get(dv); }
if (!project && pool.length) also = pool.slice(0, 12);
if (!how && pool.length) how = $q.n;
} else {
let best = null, bs = 0;
for (const x of ix.P) { const s = normName(x.n) === normName(inp.q) ? 1.01 : sim(x.n, inp.q); if (s > bs) { bs = s; best = x; } }
if (best && bs >= 0.75) { project = best; how = bs > 1 ? $q.o : $q.p; }
let bd = null, bds = 0;
for (const d of ix.devs.values()) { const s = normName(d.n) === normName(inp.q) ? 1.01 : sim(d.n, inp.q); if (s > bds) { bds = s; bd = d; } }
if (bd && bds >= 0.8) developer = bd;
if (!project && !developer) also = ix.P.map(x => [sim(x.n, inp.q), x]).filter(a => a[0] >= 0.5).sort((a, b) => b[0] - a[0]).slice(0, 5).map(a => a[1]);
}
if (project && !developer && project.dvs && ix.devs.has(project.dvs)) developer = ix.devs.get(project.dvs);
return { project, developer, also, how };
}
const pLink = s => ORIGIN + $q.q + s + '/';
const dLink = s => ORIGIN + $q.r + s + '/';
function matchCard(ix, m, inp) {
const c = { id: 'match', title: $q.s, facts: [], links: [], gaps: [] };
if (!m.project && !m.developer && !m.also.length) {
c.status = $q.t; c.summary = 'This ' + (inp.kind === 'url' ? $q.u : 'name') + $q.v + ix.P.length.toLocaleString('en') + $q.w + ix.devs.size.toLocaleString('en') + $q.x;
c.sk = $q.y; c.sa = { n: ix.P.length, d: ix.devs.size, kind: inp.kind }; return c;
}
c.status = 'found';
if (m.project) {
const p = m.project, cs = ix.caseBy.get(p.id) || {};
c.project = { slug: p.s, name: p.n, url: pLink(p.s), market: p.mk, country: p.co, area: p.ar, stage: p.st, developer: p.dv || null, checked: cs.checked || null };
c.summary = p.n + (p.dv ? ' by ' + p.dv : '') + ' (' + [p.ar, p.mk].filter(Boolean).join(', ') + $t.k1;
c.sk = $q.z; c.sa = { name: p.n, dev: p.dv || '', place: [p.ar, p.mk].filter(Boolean).join(', ') };
c.facts.push({ k: $q.A, key: $q.B, v: p.n, src: pLink(p.s) });
if (p.st) c.facts.push({ k: $q.C, key: $q.D, v: p.st, src: pLink(p.s) });
if (p.fx && p.fx.handover_promised) c.facts.push({ k: $q.E, key: $q.F, v: String(p.fx.handover_promised), src: pLink(p.s) });
if (cs.checked) c.facts.push({ k: $q.G, key: $q.H, v: cs.checked, src: pLink(p.s) });
c.links.push({ label: $q.I, key: $q.J, url: pLink(p.s), primary: true });
}
if (m.developer) {
const d = m.developer; c.developer = { slug: d.s, name: d.n, url: dLink(d.s), projects: d.ids.length };
if (!m.project) { c.summary = d.n + $q.K + d.ids.length + $q.L + (d.ids.length === 1 ? '' : 's') + $q.M; c.sk = $q.N; c.sa = { dev: d.n, n: d.ids.length }; }
c.facts.push({ k: $q.O, key: $q.P, v: d.n + ' (' + d.ids.length + $q.L + (d.ids.length === 1 ? '' : 's') + $q.Q, src: dLink(d.s) });
c.links.push({ label: $q.R, key: 'l_dev', url: dLink(d.s), primary: !m.project });
}
if (m.also.length) {
if (!m.project && !m.developer) { c.summary = $q.S + m.also.length + $q.T + (m.also.length === 1 ? ' is' : 's are') + $q.U + (inp.kind === 'url' ? $q.u : 'name') + '.'; c.sk = $q.V; c.sa = { n: m.also.length }; c.status = 'ok'; }
c.close = m.also.map(x => ({ name: x.n, url: pLink(x.s), market: x.mk }));
}
c.how = m.how; c.sources = [{ name: $t.k2 + (ix.updated || '?') + ')', url: ORIGIN + $q.W, status: 200 }];
return c;
}
function sentenceAt(text, idx, len) {
let a = Math.max(text.lastIndexOf('. ', idx), text.lastIndexOf('! ', idx), text.lastIndexOf('? ', idx), text.lastIndexOf(' | ', idx));
if (a < 0 || idx - a > 220) { a = Math.max(0, idx - 110); if (a > 0) { const sp = text.indexOf(' ', a); if (sp > 0 && sp < idx) a = sp + 1; } } else a += 2;
let b = text.slice(idx + len).search(/[.!?](\s|$)|\s\|\s/); if (b < 0 || b > 220) { b = Math.min(text.length, idx + len + 110); const sp = text.lastIndexOf(' ', b); if (sp > idx + len) b = sp; } else b = idx + len + b + 1;
return clip(text.slice(a, b), 260);
}
function meta(html, re) { const m = html.match(re); return m ? clip(m[1].replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"'), 160) : null; }
function ldNodes(html) {
const out = []; const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi; let m;
while ((m = re.exec(html)) && out.length < 40) { try { const j = JSON.parse(m[1].trim()); const walk = v => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === $q.b) { out.push(v); if (v[$q.X]) walk(v[$q.X]); } }; walk(j); } catch (e) {} }
return out;
}
const CUR = '(?:US\\$|USD|\\$|€|EUR|£|GBP|AED|IDR|Rp\\.?|THB|฿|MYR|RM|AUD|A\\$|SGD|S\\$|VND|PHP|₱|MXN|CHF)';
const PRICE_RX = new RegExp('(?:' + CUR + '\\s?\\d[\\d.,\\s]{0,14}\\d(?:\\s?(?:k|K|m|M|mn|million|mln|juta|jt|miliar|billion|bn)\\b)?|\\b\\d[\\d.,]{2,14}\\s?(?:USD|EUR|AED|IDR|THB|GBP|MYR|AUD|SGD)\\b)', 'g');
const SIZE_RX = /\b\d{1,5}(?:[.,]\d{1,2})?\s?(?:m2|m²|sqm|sq\.?\s?m\b|square met(?:er|re)s?|sq\.?\s?ft|sqft|square feet|are\b|ares\b|ha\b|hectares?)/gi;
const HANDOVER_RX = /\b(completion|complete[sd]?|handover|hand-over|hand over|delivery|delivered|ready (?:by|in)|finish(?:ed)? (?:by|in)|construction (?:ends|will end)|move[- ]in|key handover|selesai|entrega|fertigstellung|livraison|oplevering)\b[^.!?|]{0,50}?\b((?:Q[1-4]|H[12])\s?[’']?\s?20[2-4]\d|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+20[2-4]\d|(?:end|mid|early|late|spring|summer|autumn|fall|winter) (?:of )?20[2-4]\d|20[2-4]\d)\b/gi;
const STAGE_RX = /\b(off[- ]plan|pre[- ]?launch|pre[- ]?sale|presale|under construction|construction (?:has )?(?:started|begun|in progress)|groundbreaking|ready to move(?: in)?|move[- ]in ready|completed project|fully completed|sold out|land acquired|coming soon|en construcci[oó]n|sobre plano|im bau)\b/gi;
function uniqBy(a, f) { const s = new Set(); return a.filter(x => { const k = f(x); if (s.has(k)) return false; s.add(k); return true; }); }
function identityFacts(pg, inp) {
const html = pg.html, text = pg.text, src = pg.url, facts = [], gaps = [];
const ld = ldNodes(html);
const title = meta(html, /<title[^>]*>([\s\S]*?)<\/title>/i), og = meta(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || meta(html, /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title/i);
const h1 = meta(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i); const h1t = h1 ? clip(h1.replace(/<[^>]+>/g, ' '), 140) : null;
const site = meta(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i);
const ldName = (ld.find(x => /Residence|Apartment|House|Product|Place|Accommodation|RealEstateListing|Offer/i.test(String(x['@type']))) || {}).name;
const name = og || h1t || title;
if (name) facts.push({ k: $q.Y, key: $q.Z, v: clip(name, 140), q: name, src, how: og ? $q.aa : h1t ? '<h1>' : $q.ab });
else gaps.push('name');
if (ldName && ldName !== name) facts.push({ k: $q.ac, key: $q.ad, v: clip(ldName, 140), q: ldName, src, how: $q.ae });
let dev = null, devQ = null, devHow = null;
const org = ld.find(x => /Organization|RealEstateAgent|LocalBusiness|Corporation/i.test(String(x['@type'])) && x.name);
if (org) { dev = clip(org.name, 100); devQ = org.name; devHow = $q.af + org['@type']; }
if (!dev) { const m = text.match(/\b(?:developed|built|brought to you|delivered) by\s+([A-Z][\w&.'’\- ]{2,50}?)(?=[.,;:!|]|\s(?:in|on|at|and|with|is|for|since)\b|$)/); if (m) { dev = clip(m[1], 80); devQ = sentenceAt(text, m.index, m[0].length); devHow = $q.ag; } }
if (!dev) { const m = text.match(/(?:©|\(c\)|copyright)\s*(?:20\d\d\s*[-–]?\s*(?:20\d\d)?\s*)?([A-Z][\w&.'’\- ]{2,50}?)(?=[.,|]|\s(?:all rights|todos|alle)|$)/i); if (m) { dev = clip(m[1], 80); devQ = clip(m[0], 140); devHow = $q.ah; } }
if (!dev && site) { dev = site; devQ = site; devHow = $q.ai; }
if (dev) facts.push({ k: $q.aj, key: 'f_dev', v: dev, q: devQ, src, how: devHow }); else gaps.push($q.ak);
let loc = null, locQ = null;
const addr = ld.map(x => x.address).find(Boolean);
if (addr) { loc = typeof addr === $q.al ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry && (addr.addressCountry.name || addr.addressCountry)].filter(Boolean).join(', '); locQ = loc; }
if (!loc) { const m = text.match(/\b(?:[Ll]ocated|[Ss]ituated|[Nn]estled|[Aa]ddress)\s*(?:in|at|on|:)?\s+([A-Z][^.!?|]{3,90})/); if (m) { loc = clip(m[1], 90); locQ = sentenceAt(text, m.index, m[0].length); } }
if (loc) facts.push({ k: $q.am, key: 'f_loc', v: clip(loc, 120), q: locQ, src }); else gaps.push($q.an);
STAGE_RX.lastIndex = 0; const st = STAGE_RX.exec(text);
if (st) facts.push({ k: $q.ao, key: $q.ap, v: st[1].toLowerCase(), q: sentenceAt(text, st.index, st[0].length), src });
HANDOVER_RX.lastIndex = 0; const hs = []; let hm; while ((hm = HANDOVER_RX.exec(text)) && hs.length < 3) hs.push({ v: hm[2], q: sentenceAt(text, hm.index, hm[0].length) });
uniqBy(hs, x => x.v.toLowerCase()).forEach((x, i) => facts.push({ k: i ? $q.aq : $q.ar, key: i ? $q.as : $q.F, v: x.v, q: x.q, src }));
if (!hs.length) gaps.push($q.at);
PRICE_RX.lastIndex = 0; const ps = []; let pm; while ((pm = PRICE_RX.exec(text)) && ps.length < 40) { const v = pm[0].trim(); if (/\d{3}/.test(v.replace(/[.,\s]/g, '')) && !/^20[0-4]\d$/.test(v)) ps.push({ v, q: sentenceAt(text, pm.index, pm[0].length) }); }
const pu = uniqBy(ps, x => x.v.replace(/\s/g, '')).slice(0, 6);
pu.forEach(x => facts.push({ k: $q.au, key: $q.av, v: x.v, q: x.q, src }));
if (!pu.length) gaps.push('price');
SIZE_RX.lastIndex = 0; const ss = []; let sm; while ((sm = SIZE_RX.exec(text)) && ss.length < 30) ss.push({ v: sm[0].trim(), q: sentenceAt(text, sm.index, sm[0].length) });
const su = uniqBy(ss, x => x.v.toLowerCase().replace(/\s/g, '')).slice(0, 6);
su.forEach(x => facts.push({ k: $q.aw, key: $q.ax, v: x.v, q: x.q, src }));
if (!su.length) gaps.push('size');
return { facts, gaps, name, dev, loc };
}
const FLAG_RULES = [
{ id: 'guaranteed', k: 'Guaranteed return or income', key: 'r_guaranteed', rx: /\b(guarantee[ds]?|guaranteeing)\b[^.!?|]{0,40}\b(returns?|income|yields?|roi|profits?|rental|rent)\b|\b(returns?|income|yields?|roi|rental)\b[^.!?|]{0,30}\bguaranteed\b|rentabilidad garantizada|garantierte (rendite|miete|mieteinnahmen)|rendement garanti|gegarandeerd rendement|гарантированн\S* доход|保证回报|عائد مضمون/i },
{ id: 'high_yield', k: 'Return of 10% a year or more advertised', key: 'r_yield', rx: /\b(1\d|[2-9]\d)(?:[.,]\d)?\s?%\s*(?:-\s?\d+\s?%\s*)?(?:p\.?\s?a\.?|per (?:annum|year)|a year|annual(?:ly)?|yearly|net|roi|yield|return|rental (?:yield|return|income))\b|\b(?:roi|yield|return)s?\s*(?:of|up to|:)?\s*(1\d|[2-9]\d)(?:[.,]\d)?\s?%/i },
{ id: 'no_permit', k: 'Says no permit or licence is needed', key: 'r_nopermit', rx: /\bno (?:building )?(?:permits?|licen[cs]es?|imb|pbg) (?:is |are )?(?:needed|required|necessary)\b|\bwithout (?:a |any )?(?:building )?(?:permits?|licen[cs]e)\b|\bpermit[- ]free\b/i },
{ id: 'pressure', k: 'Pressure or urgency language', key: 'r_pressure', rx: /\bonly \d{1,3} (?:units?|villas?|apartments?|plots?|homes?|residences?) (?:left|remaining|available)\b|\blast (?:few )?(?:units?|villas?|chance)\b|\blimited[- ]time (?:offer|price)\b|\boffer (?:ends|valid until)\b|\bprices? (?:will )?(?:rise|increase|go up)\b|\bhurry\b|\bact (?:now|fast)\b|\bdon[’']?t miss (?:out|this)\b|\bselling fast\b|\balmost sold out\b|\bbefore (?:it'?s|they'?re) gone\b/i },
{ id: 'crypto_cash', k: 'Payment in cash or crypto', key: 'r_crypto', rx: /\b(?:pay(?:ment)?s?|accept(?:s|ed|ing)?|purchase)\b[^.!?|]{0,30}\b(?:in )?(?:cash|crypto(?:currency|currencies)?|bitcoin|btc|usdt|tether|ethereum)\b/i },
{ id: 'nominee', k: 'Nominee ownership mentioned', key: 'r_nominee', rx: /\bnominee\b/i },
{ id: 'freehold_foreign', k: 'Freehold for foreign buyers claimed', key: 'r_freehold', rx: /\bfreehold\b[^.!?|]{0,40}\b(?:for )?foreign(?:ers| buyers| nationals| investors)?\b|\bforeign(?:ers| buyers)\b[^.!?|]{0,30}\b(?:can|may) (?:own|buy)\b[^.!?|]{0,20}\bfreehold\b/i },
{ id: 'ai_text', k: 'Text addressed to AI reviewers', key: 'r_ai', special: 'ai' }
];
const ABSENT = [
{ id: 'permit_no', k: 'No permit or licence number on the page', key: 'a_permit', gap: 'permit', rx: /\b(?:pbg|imb|slf|building permit|permit (?:no|number|nr)|licen[cs]e (?:no|number)|rera|dld|trakheesi|oqood|bpn|shm|shgb|hgb|licencia de obra|baugenehmigung|permis de construire|omgevingsvergunning)\b[^.!?|]{0,40}?[A-Z0-9][A-Z0-9\/.\-]{4,}\d/i },
{ id: 'deposit', k: 'No deposit protection mentioned', key: 'a_deposit', gap: 'escrow', rx: /\b(?:escrow|trust account|bank guarantee|deposit protection|protected deposit|notary account|notaris|cuenta (?:especial|escrow)|aval bancario|garant[ií]a bancaria|treuhand|bankbürgschaft|garantie bancaire|derdengeldenrekening|эскроу)\b/i },
{ id: 'title_type', k: 'No land title type stated', key: 'a_title', gap: 'land', rx: /\b(?:leasehold|freehold|hak (?:milik|pakai|guna bangunan)|shm|hgb|strata title|title deed|land title|chanote|nor sor|escritura|grundbuch|titre de propri[eé]t[eé])\b/i }
];
function flagFacts(pg) {
const text = pg.text, src = pg.url, facts = [], gaps = [];
for (const r of FLAG_RULES) {
if (r.special === 'ai') { const hits = scanInjection(text, pg.hidden || []); if (hits.length) facts.push({ k: r.k, key: r.key, v: clip(hits[0].text || '', 80), q: clip(hits[0].text || '', 240), src, rule: r.id, hit: true }); continue; }
const m = r.rx.exec(text); if (m) facts.push({ k: r.k, key: r.key, v: clip(m[0], 80), q: sentenceAt(text, m.index, m[0].length), src, rule: r.id, hit: true });
}
for (const r of ABSENT) { if (!r.rx.test(text)) { facts.push({ k: r.k, key: r.key, v: '', src, rule: r.id, absent: true }); gaps.push(r.gap); } }
return { facts, gaps };
}
async function cardIdentity(X) {
const pg = await X.page;
if (!pg) return { id: $q.ay, title: $q.az, status: $q.aA, summary: $t.k3, sk: $q.aB, gaps: [$q.ak] };
if (!pg.ok) return { id: $q.ay, title: $q.az, status: $q.aC, summary: pg.error === $q.aD ? $t.k4 + (pg.status ? $q.aE + pg.status + ')' : '') + $t.k5 : $q.aF + (pg.status ? $q.aE + pg.status + ')' : pg.detail === $q.j ? $q.aG : '') + '.', sk: pg.error === $q.aD ? $q.aH : $q.aI, sa: { status: pg.status || '' }, gaps: [$q.ak, $q.aJ] };
const f = identityFacts(pg, X.input);
X.found.identity = f;
const c = { id: $q.ay, title: $q.az, status: f.facts.length ? 'found' : $q.aK, facts: f.facts, gaps: f.gaps };
c.summary = 'Read ' + pg.text.length.toLocaleString('en') + $q.aL + pg.url.replace(/^https?:\/\//, '') + (pg.hidden_blocks ? ' (' + pg.hidden_blocks + $q.aM : '') + '. ' + f.facts.length + $t.k6;
c.sk = $q.aN; c.sa = { chars: pg.text.length, url: pg.url.replace(/^https?:\/\//, ''), n: f.facts.length, hidden: pg.hidden_blocks || 0 };
c.page = { url: pg.url, status: pg.status, bytes: pg.bytes, sha256: pg.sha256, redirects: pg.hops || 0 };
return c;
}
async function cardFlags(X) {
const pg = await X.page;
if (!pg || !pg.ok) return { id: 'flags', title: $q.aO, status: $q.aA, summary: $q.aP, sk: $q.aQ };
const f = flagFacts(pg), hits = f.facts.filter(x => !x.absent).length, abs = f.facts.filter(x => x.absent).length;
return { id: 'flags', title: $q.aO, status: hits || abs ? 'found' : 'ok', facts: f.facts, gaps: f.gaps,
summary: hits + $q.aR + (hits === 1 ? '' : 's') + $t.k7 + abs + $q.aS + (abs === 1 ? ' is' : 's are') + $t.k8, sk: $q.aT, sa: { hits, abs },
method: { rules: FLAG_RULES.length + ABSENT.length, url: ORIGIN + $q.aU } };
}
async function cardWayback(X) {
const h = X.input.host; const c = { id: $q.aV, title: $q.aW, facts: [], links: [], gaps: [] };
const m = await X.match;
const own = [];
if (m && m.project) { const p = m.project, cs = (X.ix && X.ix.caseBy.get(p.id)) || {};
if (p.ad) own.push({ k: $q.aX, key: $q.aY, v: p.ad, src: pLink(p.s) });
if (p.sealed && p.sha) own.push({ k: $q.aZ, key: $q.ba, v: p.sealed + $q.bb + p.sha.slice(0, 16) + '…', src: pLink(p.s) });
if (cs.fp && cs.fp.sha256) own.push({ k: $q.bc, key: $q.bd, v: cs.fp.date + $q.bb + cs.fp.sha256.slice(0, 16) + '…', src: pLink(p.s) });
if ((cs.history || []).length) own.push({ k: $q.be, key: $q.bf, v: String(cs.history.length), src: pLink(p.s) + $q.bg });
}
if (!h) { c.status = own.length ? 'found' : $q.aA; c.facts = own; c.summary = own.length ? $t.k9 : $t.k10; c.sk = own.length ? $q.bh : $q.bi; return c; }
const rd = regDomain(h);
const [first, spark] = await Promise.all([
X.fetch($t.k11 + encodeURIComponent(rd) + $t.k12, null, $q.bj, 10000),
X.fetch($t.k13 + encodeURIComponent(rd) + $q.bk, null, $q.bl, 10000)
]);
let rows = null; try { rows = first.ok ? first.json() : null; } catch (e) {}
let sp = null; try { sp = spark.ok ? spark.json() : null; } catch (e) {}
const years = {};
if (sp && sp.years) Object.keys(sp.years).forEach(y => { const n = (sp.years[y] || []).reduce((a, b) => a + (+b || 0), 0); if (n) years[y] = n; });
if (!first.ok && !spark.ok) { c.status = $q.aC; c.summary = $t.k14; c.sk = $q.bm; c.facts = own; return c; }
const fr = rows && rows.length > 1 ? rows[1] : null;
const ts = fr ? fr[0] : (sp && sp.first_ts) || null;
if (!ts) { c.status = $q.t; c.summary = $t.k15 + rd + $t.k16; c.sk = $q.bn; c.sa = { d: rd }; c.facts = own; c.links.push({ label: $q.bo, key: $q.bp, url: $q.bq + rd + '*' }); return c; }
const day = ts.slice(0, 4) + '-' + ts.slice(4, 6) + '-' + ts.slice(6, 8);
c.status = 'found';
c.facts.push({ k: $q.br + rd, key: $q.bs, v: day + ' (' + yearsSince(day) + $q.bt, src: $q.bu + ts + '/' + (fr ? fr[1] : rd) });
if (sp && sp.last_ts) { const l = String(sp.last_ts); c.facts.push({ k: $q.bv, key: $q.bw, v: l.slice(0, 4) + '-' + l.slice(4, 6) + '-' + l.slice(6, 8), src: $q.bu + l + '/' + rd }); }
const ys = Object.keys(years).sort();
if (ys.length) { c.years = ys.map(y => ({ y: +y, n: years[y], url: $q.bu + y + $q.bx + rd })); c.facts.push({ k: $t.k17, key: $q.by, v: ys.map(y => y + ': ' + years[y]).join(' · '), src: $q.bq + rd + '*' }); }
c.facts = c.facts.concat(own);
c.summary = $q.bz + rd + ' on ' + day + '.'; c.sk = $q.bA; c.sa = { d: rd, day };
c.links.push({ label: $q.bB, key: $q.bp, url: $q.bq + rd + '*' });
return c;
}
async function rdapJson(X, url, name) { const r = await X.fetch(url, { headers: { 'user-agent': $t.UA, accept: $t.k18 }, redirect: $q.bC }, name, 9000); let j = null; try { j = r.ok ? r.json() : null; } catch (e) {} return { r, j }; }
const ev = (j, a) => ((j && j.events) || []).find(e => e.eventAction === a);
function vname(ent) { const v = ent && ent.vcardArray && ent.vcardArray[1]; const fn = v && v.find(x => x[0] === 'fn'); return fn ? fn[3] : (ent && ent.handle) || null; }
async function cardDomain(X) {
const h = X.input.host; const c = { id: $q.bD, title: $q.bE, facts: [], links: [], gaps: [] };
if (!h) { c.status = $q.aA; c.summary = $q.bF; c.sk = $q.bG; return c; }
const rd = regDomain(h), { r, j } = await rdapJson(X, $q.bH + encodeURIComponent(rd), $t.k19);
const src = $q.bH + rd;
if (!j) { c.status = r.status === 404 ? $q.aK : $q.aC; c.summary = r.status === 404 ? $q.bI + rd + $t.k20 : $q.bJ; c.sk = r.status === 404 ? $q.bK : $q.bL; c.sa = { d: rd }; c.links.push({ label: $q.bM, key: $q.bN, url: $t.k21 + rd }); return c; }
const reg = ev(j, $q.bO), exp = ev(j, $q.bP), chg = ev(j, $q.bQ) || ev(j, $q.bR);
const registrar = (j.entities || []).find(e => (e.roles || []).includes($q.bS));
c.status = 'found';
if (reg) c.facts.push({ k: $q.bT, key: $q.bU, v: isoDay(reg.eventDate) + ' (' + yearsSince(reg.eventDate) + $q.bt, src });
else c.facts.push({ k: $q.bV, key: $q.bU, v: $q.bW, src });
if (exp) c.facts.push({ k: $q.bX, key: $q.bY, v: isoDay(exp.eventDate), src });
if (chg && chg.eventAction === $q.bQ) c.facts.push({ k: $q.bZ, key: $q.ca, v: isoDay(chg.eventDate), src });
if (registrar) c.facts.push({ k: $q.cb, key: $q.cc, v: vname(registrar), src });
if ((j.status || []).length) c.facts.push({ k: $q.cd, key: $q.ce, v: j.status.slice(0, 4).join(', '), src });
if ((j.nameservers || []).length) c.facts.push({ k: $q.cf, key: $q.cg, v: j.nameservers.slice(0, 3).map(n => String(n.ldhName || '').toLowerCase()).join(', '), src });
const self = (j.links || []).find(l => l.rel === 'self'); if (self) c.links.push({ label: $q.ch, key: $q.ci, url: self.href });
c.summary = reg ? rd + $q.cj + isoDay(reg.eventDate) + (registrar ? $q.ck + vname(registrar) : '') + '.' : $q.cl + rd + $q.cm;
c.sk = reg ? $q.cn : $q.co; c.sa = { d: rd, day: reg ? isoDay(reg.eventDate) : '', by: registrar ? vname(registrar) : '' };
c.reg_date = reg ? isoDay(reg.eventDate) : null;
return c;
}
async function cardTls(X) {
const h = X.input.host; const c = { id: 'tls', title: $q.cp, facts: [], links: [], gaps: [] };
if (!h) { c.status = $q.aA; c.summary = $q.bF; c.sk = $q.bG; return c; }
const rd = regDomain(h), crt = $q.cq + encodeURIComponent(rd);
const [r, r2] = await Promise.all([
X.fetch($t.k22 + encodeURIComponent(rd) + $t.k23, null, $t.k24, 9000),
X.fetch(crt + $q.cr, null, $t.k25, 10000)
]);
let a = null; try { a = r.ok ? r.json() : null; } catch (e) {}
let hist = null; try { hist = r2 && r2.ok ? r2.json() : null; } catch (e) {}
c.links.push({ label: $q.cs, key: 'l_crt', url: crt });
if (!Array.isArray(a) && !Array.isArray(hist)) { c.status = $q.aC; c.summary = r.status === 429 ? $t.k26 : $t.k27; c.sk = r.status === 429 ? $q.ct : $q.cu; return c; }
const cur = Array.isArray(a) ? a : [], all = Array.isArray(hist) ? hist : [];
if (!cur.length && !all.length) { c.status = $q.t; c.summary = $q.cv + rd + $t.k28; c.sk = $q.cw; c.sa = { d: rd }; return c; }
c.status = 'found';
const firstAll = all.length ? all.map(x => x.not_before).filter(Boolean).sort()[0] : null;
const byStart = cur.slice().sort((x, y) => Date.parse(x.not_before) - Date.parse(y.not_before)), last = byStart[byStart.length - 1];
if (firstAll) c.facts.push({ k: $q.cx, key: $q.cy, v: isoDay(firstAll) + ' (' + yearsSince(firstAll) + $q.bt, src: crt });
else if (byStart.length) c.facts.push({ k: $q.cz, key: $q.cA, v: isoDay(byStart[0].not_before) + $t.k29, src: crt });
if (last) {
c.facts.push({ k: $q.cB, key: $q.cC, v: (last.issuer && (last.issuer.friendly_name || last.issuer.name)) || $q.cD, src: $q.cE });
c.facts.push({ k: $q.cF, key: $q.cG, v: isoDay(last.not_before) + ' to ' + isoDay(last.not_after), src: $q.cE });
}
c.facts.push({ k: $q.cH, key: $q.cI, v: String(all.length || cur.length), src: crt });
const by = last && last.issuer && last.issuer.friendly_name || '';
if (firstAll) { c.summary = $q.cJ + rd + $q.cK + isoDay(firstAll) + (by ? $q.cL + by : '') + '.'; c.sk = $q.cM; c.sa = { d: rd, day: isoDay(firstAll), by }; }
else { c.summary = $q.cN + rd + (by ? $q.cO + by : '') + $t.k30; c.sk = $q.cP; c.sa = { d: rd, by }; }
return c;
}
const CDN = /cloudflare|amazon|aws|google|akamai|fastly|vercel|netlify|microsoft|azure|incapsula|imperva|sucuri|bunny|ovh|hetzner|digitalocean|wix|squarespace|shopify|automattic|wpengine|hostinger/i;
async function cardHosting(X) {
const h = X.input.host; const c = { id: $q.cQ, title: $q.cR, facts: [], links: [], gaps: [] };
if (!h) { c.status = $q.aA; c.summary = $q.bF; c.sk = $q.bG; return c; }
const host = (X.input.url && new URL(X.input.url).hostname) || h;
const d = await X.fetch($t.k31 + encodeURIComponent(host) + $q.cS, { headers: { accept: $q.cT } }, $q.cU, 6000);
let dj = null; try { dj = d.ok ? d.json() : null; } catch (e) {}
const ips = ((dj && dj.Answer) || []).filter(x => x.type === 1).map(x => x.data).slice(0, 3);
if (!ips.length) { c.status = dj ? $q.t : $q.aC; c.summary = dj ? $q.cV + host + '.' : $q.cW; c.sk = dj ? $q.cX : $q.cY; c.sa = { d: host }; return c; }
const { j } = await rdapJson(X, $q.cZ + ips[0], $t.k32);
c.status = 'found';
c.facts.push({ k: $q.da, key: $q.db, v: ips.join(', '), src: $t.k33 + host + $q.cS });
let net = null, ctry = null;
if (j) { net = j.name || null; ctry = j.country || null; const org = (j.entities || []).map(vname).filter(Boolean)[0];
if (net || org) c.facts.push({ k: $q.dc, key: $q.dd, v: [net, org].filter(Boolean).join(' · '), src: $q.cZ + ips[0] });
c.facts.push({ k: $q.de, key: $q.df, v: ctry || $q.dg, src: $q.cZ + ips[0] });
net = [net, org].filter(Boolean).join(' ');
}
const cdn = net && CDN.test(net);
if (cdn) c.facts.push({ k: 'Note', key: $q.dh, v: $s.k0 , vk: $q.di });
c.summary = host + $q.dj + ips[0] + (net ? ' on ' + clip(net, 60) : '') + (ctry ? $q.dk + ctry : '') + '.';
c.sk = 'hs_ip'; c.sa = { d: host, ip: ips[0], net: clip(net || '', 60), c: ctry || '' };
return c;
}
async function cardRegisters(X) {
const c = { id: $q.dl, title: $q.dm, facts: [], links: [], gaps: [] };
const m = await X.match, pg0 = await X.page, idf = pg0 && pg0.ok ? identityFacts(pg0, X.input) : null;
const company = (m && m.developer && m.developer.n) || (m && m.project && m.project.dv) || (idf && idf.dev) || null;
const body = { ai: '0' }; if (X.input.url) body.url = X.input.url; else body.q = X.input.q; if (company && company.length >= 3 && company.length <= 120) body.company = company;
const t = Date.now(); let d = null;
try {
const lk = await import('./kbx_lookup.js');
const r = await lk.handle(new Request(ORIGIN + $q.dn, { method: 'POST', headers: { 'content-type': $q.do, 'cf-connecting-ip': X.ip }, body: JSON.stringify(body) }), new URL(ORIGIN + $q.dn), X.env, X.ctx);
d = await r.json();
} catch (e) { d = { error: $q.dp }; }
c.sources = [{ name: $t.k34, url: ORIGIN + $q.dn, status: d && !d.error ? 200 : 0, ms: Date.now() - t }];
if (!d || d.error) { c.status = d && d.error === 'rate' ? $q.aC : $q.aC; c.summary = d && d.error === 'rate' ? $t.k35 : $q.dq; c.sk = d && d.error === 'rate' ? $q.dr : $q.ds; return c; }
const regs = (d.checks || []).filter(x => x.id !== $q.u && x.id !== 'rdap');
regs.forEach(x => {
const sn = x.snapshot || {};
c.facts.push({ k: x.label || x.name || x.id, v: x.status === 'found' ? (x.summary || x.note || 'found') : x.status.replace(/_/g, ' ') + (x.note ? ': ' + clip(x.note, 160) : ''), src: sn.url || x.url || x.source_url || null, status: x.status, sha256: sn.sha256 || null });
if (sn.sha256) c.sources.push({ name: x.label || x.id, url: sn.url || x.url, status: sn.status || 200, bytes: sn.bytes || null, sha256: sn.sha256 });
});
const found = regs.filter(x => x.status === 'found').length;
c.status = !regs.length ? $q.t : found ? 'found' : $q.t;
c.summary = !regs.length ? $t.k36 + (company ? '' : $q.dt) + '.' : found + ' of ' + regs.length + $t.k37 + (company ? $q.du + clip(company, 60) + ')' : '') + '.';
c.sk = !regs.length ? $q.dv : $q.dw; c.sa = { f: found, n: regs.length, co: company ? clip(company, 60) : '' };
if (!found) c.gaps.push($q.ak);
c.gaps.push('land', $q.aJ);
if (d.seal) { c.seal = { root: d.seal.root_sha256, url: d.seal.result_url }; c.links.push({ label: $q.dx, key: $q.dy, url: d.seal.result_url }); }
c.links.push({ label: $q.dz, key: 'l_cov', url: ORIGIN + $q.dA });
return c;
}
async function cardDesk(X) {
const t = Date.now();
const r = await kbApi(new Request(ORIGIN + $q.dB, { method: 'POST', headers: { 'content-type': $q.do, 'cf-connecting-ip': X.ip }, body: JSON.stringify({ url: X.input.url, lang: X.lang }) }), new URL(ORIGIN + $q.dB), X.env, X.ctx);
const d = await r.json().catch(() => ({}));
const c = { id: 'desk', title: $q.dC, sources: [{ name: $t.k38, url: ORIGIN + $q.dB, status: r.status, ms: Date.now() - t }] };
if (!d.report) { c.status = $q.aC; c.summary = $q.dD + (d.error || r.status) + ').'; return c; }
const rp = d.report; c.status = 'found'; c.summary = clip(rp.summary || '', 300); c.cached = !!d.cached;
c.facts = [$q.dE, $q.ak, $q.an, $q.dF, $q.dG, $q.dH, $q.dI, $q.dJ].filter(k => rp[k]).map(k => ({ k: k.replace(/_/g, ' '), v: String(rp[k]), src: X.input.url }));
return c;
}
const EV_GAPS = { location: ['site'], satellite: ['site'], law: ['contract'], developer: ['developer'], ppm: [], market: [], images: [], similar: [] };
const absU = x => typeof x === $q.al && x ? (x.startsWith('/') ? ORIGIN + x : x) : undefined;
function evCard(c) {
const k = { id: c.id, n: c.n, title: c.title || $t.o_EV_TITLES[c.id] || c.id, status: c.status === $q.dK ? $q.aA : (c.status || 'ok'), summary: c.summary || '',
facts: (c.items || []).slice(0, 30).map(i => ({ k: String(i.label || ''), v: i.value == null ? '' : String(i.value), q: i.quote || undefined, src: absU(i.url), kind: i.kind || undefined })),
limits: Array.isArray(c.limits) ? c.limits.slice(0, 6) : undefined, paid: c.paid || undefined, data: c.data || undefined,
gaps: (c.status === 'found' && c.id === $q.ak) ? [] : (EV_GAPS[c.id] || []),
sources: (c.sources || []).map(x => ({ name: x.name, url: absU(x.url), status: x.status || undefined, bytes: x.bytes || undefined, sha256: x.sha256 || undefined, licence: x.licence || undefined, cache: x.cache || undefined })), where: 'edge' };
if (c.img && c.img.src) k.img = { url: absU(c.img.src), alt: c.img.alt || k.title, credit: c.img.credit || '', w: c.img.w, h: c.img.h };
return k;
}
const CARDS = [
{ id: 'match', title: 'Already in our database', where: 'edge' },
{ id: 'identity', title: 'What the page says', run: cardIdentity, web: true },
{ id: 'flags', title: 'Statements to check', run: cardFlags, web: true },
{ id: 'wayback', title: 'Internet Archive timeline', run: cardWayback },
{ id: 'domain', title: 'Domain registration', run: cardDomain, web: true },
{ id: 'tls', title: 'Security certificate history', run: cardTls, web: true },
{ id: 'hosting', title: 'Where the website is hosted', run: cardHosting, web: true },
{ id: 'registers', title: 'Official registers', run: cardRegisters, where: 'edge+db' }
];
async function withBudget(p, ms) { let t; const to = new Promise(r => { t = setTimeout(() => r({ __timeout: true }), ms); }); try { return await Promise.race([p, to]); } finally { clearTimeout(t); } }
async function runXray(inp, opts, emit) {
const { env, ctx, req } = opts, t0 = Date.now(), started = new Date().toISOString();
const allSources = [], cards = [], waiters = {};
const X = { input: inp, lang: opts.lang || 'en', env, ctx, ip: req.headers.get($q.dL) || 'x', found: {}, ix: null };
const resolvers = {}; const wait = id => waiters[id] || (waiters[id] = new Promise(r => { resolvers[id] = r; }));
X.wait = wait;
let ix = null; try { ix = await named(env); } catch (e) {}
X.ix = ix; X.named = Promise.resolve(ix);
if (ix && coiHit(ix, inp)) {
const c = { id: 'coi', title: $q.dM, status: $q.aA, sk: 'coi', summary: $s.k1, links: [{ label: $q.dN, key: $q.dO, url: ORIGIN + $q.dP }], ms: 0, where: 'edge', sources: [] };
emit({ type: 'plan', checks: [{ id: 'coi', title: c.title }], input: inp }); emit({ type: 'card', card: c });
return finish([c], inp, started, t0, opts, emit, allSources);
}
let m = ix ? findMatch(ix, inp) : { project: null, developer: null, also: [] };
if (inp.kind === 'name' && m.project && m.project.url && okUrl(m.project.url)) { const u = okUrl(m.project.url); inp = Object.assign({}, inp, { url: u.toString(), host: u.hostname.toLowerCase().replace(/^www\./, ''), via: 'name' }); X.input = inp; }
X.match = Promise.resolve(m);
let ev = null; try { ev = await import('./kbx_xray_ev.js'); if (typeof ev.evRun !== $q.dQ) ev = null; } catch (e) { ev = null; }
const evIds = ev && (inp.url || m.project) ? (ev.EV_IDS || []) : [];
const list = CARDS.filter(c => !(c.web && !inp.host));
if (opts.desk && inp.url) list.push({ id: 'desk', title: $q.dC, run: cardDesk, where: $q.dR });
emit({ type: 'plan', checks: list.map(c => ({ id: c.id, title: c.title })).concat(evIds.map(id => ({ id, title: $t.o_EV_TITLES[id] || id }))), input: inp, at: started, colo: (req.cf && req.cf.colo) || null, version: VERSION });
X.page = inp.url ? (async () => {
const t = Date.now(), rec = { name: $q.dS, url: inp.url, status: 0, bytes: 0, sha256: null, ms: 0 }; allSources.push(rec);
const pg = await fetchPage(new URL(inp.url));
rec.ms = Date.now() - t; rec.status = pg.status || 0;
if (pg.error) { rec.error = pg.error; return { ok: false, error: pg.error, status: pg.status, detail: pg.detail }; }
const buf = te.encode(pg.html); rec.bytes = buf.byteLength; rec.sha256 = await sha256Buf(buf); if (pg.url !== inp.url) rec.final_url = pg.url;
const parts = pageParts(pg.html);
return { ok: true, url: pg.url, status: pg.status, html: pg.html, text: ent(parts.visible).slice(0, 300000), hidden: parts.hidden, hidden_blocks: parts.hidden.length, bytes: buf.byteLength, sha256: rec.sha256, hops: pg.hops };
})() : Promise.resolve(null);
const done = (c, def, t, srcs) => {
c = c || { status: $q.aA }; c.id = def.id; c.title = c.title || def.title; c.ms = Date.now() - t; c.where = c.where || def.where || 'edge';
c.sources = (c.sources || []).concat(srcs.filter(s => !(c.sources || []).some(x => x.url === s.url)));
c.sources.forEach(s => allSources.push(s));
cards.push(c); if (resolvers[def.id]) resolvers[def.id](c); else waiters[def.id] = Promise.resolve(c);
emit({ type: 'card', card: c }); return c;
};
const jobs = list.map(def => {
const t = Date.now();
if (def.id === 'match') return Promise.resolve(done(ix ? matchCard(ix, m, inp) : { status: $q.aC, summary: $t.k39, sk: $q.dT }, def, t, []));
const srcs = []; const XX = Object.assign({}, X, { fetch: makeFetcher(srcs) });
return withBudget(Promise.resolve().then(() => def.run(XX)), CARD_MS)
.then(c => c && c.__timeout ? { status: $q.aC, summary: $q.dU + CARD_MS / 1000 + $q.dV, sk: $q.j } : c)
.catch(e => ({ status: 'error', summary: $q.dW + clip(String(e && e.message || e), 120), sk: 'error' }))
.then(c => c === null ? (resolvers[def.id] && resolvers[def.id](null), null) : done(c, def, t, srcs));
});
if (evIds.length) jobs.push((async () => {
const t = Date.now(), pg = await X.page, p = m.project;
const idf = pg && pg.ok ? identityFacts(pg, inp) : null;
const hint = { project_id: p ? p.id : undefined, developer: (m.developer && m.developer.n) || (p && p.dv) || (idf && idf.dev) || undefined, name: (p && p.n) || (idf && idf.name) || undefined,
market: p ? p.mk : undefined, country: p ? p.co : undefined, stage: p ? p.st : undefined, location_text: (idf && idf.loc) || undefined };
const page = pg && pg.ok ? { url: inp.url, final_url: pg.url, html: pg.html, text: pg.text, sha256: pg.sha256, fetched: started } : { url: inp.url || '', final_url: inp.url || '', html: '' };
const seen = new Set();
try { await ev.evRun(page, hint, env, ctx, c => { if (!c || !c.id || seen.has(c.id)) return; seen.add(c.id); const k = evCard(c); done(k, { id: k.id, title: k.title, where: 'edge' }, t, []); }, {}); }
catch (e) {}
evIds.filter(id => !seen.has(id)).forEach(id => done({ status: 'error', summary: $q.dX, sk: 'error' }, { id, title: $t.o_EV_TITLES[id] || id }, t, []));
})());
await Promise.all(jobs);
return finish(cards, inp, started, t0, opts, emit, allSources);
}
async function finish(cards, inp, started, t0, opts, emit, allSources) {
const { env, ctx, req } = opts;
const order = ['coi', 'match', $q.ay, 'flags', $q.dl, $q.bD, $q.aV, $q.an, $q.dY, 'ppm', $q.dZ, $q.ak, 'law', $q.ea, $q.eb, 'tls', $q.cQ, 'desk'];
cards.sort((a, b) => { const x = order.indexOf(a.id), y = order.indexOf(b.id); return (x < 0 ? 50 : x) - (y < 0 ? 50 : y); });
const lines = [];
for (const c of cards) { c.sha256 = await sha(jcs(Object.assign({}, c, { sha256: undefined }))); lines.push(c.id + ' ' + c.sha256); }
const metaObj = { version: VERSION, input: { kind: inp.kind, url: inp.url, q: inp.q, via: inp.via || null }, started_at: started, lang: opts.lang || 'en' };
lines.push('meta ' + await sha(jcs(metaObj))); lines.sort();
const root = await sha(lines.join('\n'));
const seen = new Map(); allSources.forEach(s => { const k = s.url + ' ' + (s.sha256 || ''); if (!seen.has(k)) seen.set(k, s); });
const srcList = [...seen.values()];
const proof = { colo: (req.cf && req.cf.colo) || null, country: (req.cf && req.cf.country) || null, runtime: $t.k40, started_at: started, finished_at: new Date().toISOString(), total_ms: Date.now() - t0,
sources: srcList.length, hosts: [...new Set(srcList.map(s => { try { return new URL(s.url).hostname; } catch (e) { return ''; } }).filter(Boolean))], bytes_read: srcList.reduce((a, s) => a + (s.bytes || 0), 0),
cards: cards.map(c => ({ id: c.id, status: c.status, ms: c.ms, where: c.where, sources: (c.sources || []).length, sha256: c.sha256 })),
seal: { root_sha256: root, lines, method: $s.k2 },
ai: opts.desk ? $t.k41 : $t.k42 };
const res = { version: VERSION, root, url: ORIGIN + '/x/' + root + '/', meta: metaObj, cards, proof, lang: opts.lang || 'en',
disclaimer: $s.k3 };
try {
const r = await kbApi(new Request(ORIGIN + $q.ec, { method: 'POST', headers: { 'content-type': $q.do, 'cf-connecting-ip': req.headers.get($q.dL) || 'x' }, body: JSON.stringify({ hash: root, source: 'xray' }) }), new URL(ORIGIN + $q.ec), env, ctx);
const d = await r.json(); proof.seal.opentimestamps = d.stamp ? { status: $q.ed, created_at: d.stamp.created_at, calendars: d.stamp.calendars, verify: ORIGIN + $q.ee + root } : { status: d.error === 'rate' ? $q.ef : $q.eg };
} catch (e) { proof.seal.opentimestamps = { status: 'error' }; }
await store(res, inp, env, ctx);
emit({ type: 'done', root, url: res.url, total_ms: proof.total_ms, proof, stored: res.stored });
ctx.waitUntil(logApi('xray', true, false, proof.total_ms));
return res;
}
async function store(res, inp, env, ctx) {
const body = JSON.stringify(res);
ctx.waitUntil(caches.default.put(RESKEY(res.root), new Response(body, { headers: { 'content-type': $q.do, 'cache-control': $q.eh } })).catch(() => {}));
res.stored = 'edge';
try { const r = await withBudget(rpc($q.ei, { p_wkey: WKEY, p_root: res.root, p_domain: inp.host || null, p_q: inp.q || inp.url, p_data: res }), 4000); if (r === 'ok') res.stored = 'db'; } catch (e) {}
}
async function load(root, env) {
const h = await caches.default.match(RESKEY(root)); if (h) return h.json();
try { const d = await rpc($q.ej, { p_root: root }); if (d && d.root === root) return d; } catch (e) {}
return null;
}
async function rateOk(req, ctx) {
const ip0 = req.headers.get($q.dL) || 'x', ip = ip0.includes(':') ? ip0.split(':').slice(0, 4).join(':') + '::/64' : ip0, hour = new Date().toISOString().slice(0, 13);
const k = new Request(ORIGIN + $q.ek + encodeURIComponent(ip) + '/' + hour); const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
if (n >= PER_IP_HOUR) return false;
ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.el } }))); return true;
}
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
function sse(req, env, ctx, inp, lang) {
const { readable, writable } = new TransformStream(), w = writable.getWriter();
const send = o => w.write(te.encode($q.em + JSON.stringify(o) + '\n\n')).catch(() => {});
const job = (async () => {
try {
const ik = await sha(VERSION + XV + '|' + lang + '|' + (inp.url || '') + '|' + (inp.q || ''));
const hit = await caches.default.match(INKEY(ik));
if (hit) { const res = await hit.json(); send({ type: 'plan', checks: res.cards.map(c => ({ id: c.id, title: c.title })), input: res.meta.input, cached: true, at: res.meta.started_at }); for (const c of res.cards) send({ type: 'card', card: c, cached: true }); send({ type: 'done', root: res.root, url: res.url, total_ms: res.proof.total_ms, proof: res.proof, cached: true, stored: res.stored }); return; }
if (!(await rateOk(req, ctx))) { send({ type: 'error', error: 'rate', limit: PER_IP_HOUR + $q.en }); return; }
const res = await runXray(inp, { env, ctx, req, lang }, send);
const ttl = (res.cards || []).some(c => c && c.status === 'error') ? 60 : 600;
ctx.waitUntil(caches.default.put(INKEY(ik), new Response(JSON.stringify(res), { headers: { 'content-type': $q.do, 'cache-control': $q.eo + ttl } })).catch(() => {}));
} catch (e) { send({ type: 'error', error: $q.dp, detail: clip(String(e && e.message || e), 160) }); }
finally { try { await w.close(); } catch (e) {} }
})();
ctx.waitUntil(job);
return new Response(readable, { headers: Object.assign({ 'content-type': $q.ep, 'cache-control': $q.e, 'x-accel-buffering': 'no', 'x-content-type-options': $q.f }, CORS) });
}
async function v1(req, u, env, ctx) {
  let b = {}; if (req.method === 'POST') { try { b = await req.json(); } catch (e) { return out({ error: $q.eq, docs: ORIGIN + $q.er }, 400); } } else { b = { url: u.searchParams.get('url'), q: u.searchParams.get('q'), desk: u.searchParams.get('desk') }; }
  const inp = parseInput(b.url || b.q || '');
  if (!inp) return out({ error: 'empty', need: $q.es, docs: ORIGIN + $q.er }, 400);
  if (inp.kind === 'bad') return out({ error: 'url', note: $q.et }, 400);
  const key = req.headers.get($q.eu) || '', lang = LANGS.includes(b.lang) ? b.lang : 'en';
  let desk = false, partner = null;
  if (key) { let a; try { a = await rpc($q.ev, { p_key: key, p_endpoint: $q.ew }); } catch (e) { return out({ error: 'db' }, 503); }
    if (!a || a.error) return out({ error: (a && a.error) || $q.ex }, a && a.error === 'quota' ? 429 : 401);
    partner = a; desk = (b.desk === true || b.desk === '1' || b.desk === 'true') && !!inp.url && !String(key).startsWith($q.ey); }
  else if (b.desk) return out({ error: $q.ez, note: $q.eA, keys: ORIGIN + $q.eB }, 401);
  if (!partner && !(await rateOk(req, ctx))) return out({ error: 'rate', limit: PER_IP_HOUR + $q.eC }, 429);
  const res = await runXray(inp, { env, ctx, req, lang, desk }, () => {});
  return out(res, 200);
}
function openapi() {
const card = { type: $q.b, required: ['id', 'title', $q.eD], properties: { id: { type: $q.al }, title: { type: $q.al }, status: { enum: ['ok', 'found', $q.t, $q.aK, $q.aC, $q.eE, $q.aA, 'error'] }, summary: { type: $q.al }, facts: { type: 'array', items: { type: $q.b, properties: { k: { type: $q.al }, v: { type: $q.al }, q: { type: $q.al, description: $q.eF }, src: { type: $q.al, format: 'uri' } } } }, links: { type: 'array' }, gaps: { type: 'array', items: { type: $q.al } }, sources: { type: 'array', items: { type: $q.b, properties: { name: { type: $q.al }, url: { type: $q.al }, status: { type: $q.eG }, bytes: { type: $q.eG }, sha256: { type: $q.al }, ms: { type: $q.eG } } } }, ms: { type: $q.eG }, where: { type: $q.al }, sha256: { type: $q.al } } };
const result = { type: $q.b, properties: { version: { type: $q.al }, root: { type: $q.al, pattern: $q.eH }, url: { type: $q.al, format: 'uri' }, meta: { type: $q.b }, cards: { type: 'array', items: { $ref: $q.eI } }, proof: { type: $q.b }, disclaimer: { type: $q.al } } };
return { openapi: '3.1.0', info: { title: $q.eJ, version: $q.eK, description: $s.k4, license: { name: $q.eL, identifier: $q.eM } },
servers: [{ url: ORIGIN }], components: { securitySchemes: { apiKey: { type: $q.eN, in: $q.eO, name: $q.eu, description: $q.eP + ORIGIN + $t.k43 } }, schemas: { XrayCard: card, XrayResult: result } },
paths: {
'/api/v1/xray': { post: { summary: $q.eQ, security: [{}, { apiKey: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: $q.b, properties: { url: { type: $q.al, description: $q.eR }, q: { type: $q.al, description: $q.eS }, desk: { type: $q.eT, description: $t.k44 }, lang: { enum: LANGS } } }, examples: { url: { value: { url: $t.k45 } }, name: { value: { q: $q.eU } } } } } }, responses: { 200: { description: $q.eV, content: { 'application/json': { schema: { $ref: $q.eW } } } }, 400: { description: $q.eX }, 401: { description: $q.eY }, 429: { description: $q.eZ } } } },
'/api/kb/xray': { get: { summary: $t.k46, parameters: [{ name: 'u', in: 'query', required: true, schema: { type: $q.al } }, { name: 'lang', in: 'query', schema: { enum: LANGS } }], responses: { 200: { description: $s.k5, content: { 'text/event-stream': { schema: { type: $q.al } } } } } } },
'/x/{root}.json': { get: { summary: $q.fa, parameters: [{ name: 'root', in: 'path', required: true, schema: { type: $q.al, pattern: $q.eH } }], responses: { 200: { description: $q.fb, content: { 'application/json': { schema: { $ref: $q.eW } } } }, 404: { description: $q.fc } } } },
'/x/{root}/vc': { get: { summary: $s.k6, parameters: [{ name: 'root', in: 'path', required: true, schema: { type: $q.al } }], responses: { 200: { description: $q.fd } } } },
'/api/kb/xray/stats': { get: { summary: $t.k47, parameters: [{ name: 'd', in: 'query', required: true, schema: { type: $q.al } }], responses: { 200: { description: $q.fe } } } }
} };
}
async function vc(root, env) {
const d = await load(root, env); if (!d) return out({ error: $q.t }, 404);
const { issue } = await import('./kbx_acct.js');
const at = String(d.proof && d.proof.finished_at || d.meta.started_at).replace(/\.\d+Z$/, 'Z');
const doc = { '@context': [$q.ff], id: ORIGIN + '/x/' + root + '/vc', type: [$q.fg, $q.fh], name: $q.fi, description: $s.k7,
issuer: { id: $q.fj, name: $q.fk }, validFrom: at,
credentialSubject: { id: d.url, type: $q.fl, rootSha256: root, input: d.meta.input, cards: d.cards.map(c => ({ id: c.id, status: c.status, sha256: c.sha256, sources: (c.sources || []).map(s => ({ url: s.url, sha256: s.sha256 || null })) })), sealLines: d.proof.seal.lines, disclaimer: d.disclaimer } };
const v = await issue(env, doc, at); if (!v) return out({ error: $q.fm }, 503);
return out(v, 200, { 'content-type': $q.fn, 'cache-control': $q.fo, 'content-disposition': $q.fp + root.slice(0, 12) + $q.fq });
}
const escH = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.fr, "'": '&#39;' }[c]));
const XP = TB.kbx_xray_XP ;
async function page(root, env, ctx, shell, qlang) {
  const d = await load(root, env);
  const lang = LANGS.includes(qlang) ? qlang : d && LANGS.includes(d.lang || (d.meta || {}).lang) ? (d.lang || d.meta.lang) : 'en';
  const X = (k, v) => { const s = (XP[lang] && XP[lang][k]) || XP.en[k]; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; }, pl = lang === 'en' ? '' : '/' + lang;
  let base = await shell(pl + $q.fs);   // a plain page shell (header, footer, styles) in the page's language; /check/ has inline scripts that need its form
  if (pl && (!base || base.status !== 200)) base = await shell($q.fs);
  const name = d ? ((d.cards.find(c => c.id === 'match') || {}).project || {}).name || (d.meta.input.url ? d.meta.input.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : d.meta.input.q) : null;
  const title = (d ? X('title', { n: clip(name, 60) }) : X($q.ft)) + $q.fu;
  const noJs = d ? $q.fv + d.cards.map(c => $q.fw + escH(c.title) + $q.fx + escH(c.summary || c.status) + '<ul>' + (c.facts || []).map(f => '<li>' + escH(f.k) + ': ' + escH(f.v) + (f.q ? ' "' + escH(f.q) + '"' : '') + (f.src ? ' (' + escH(f.src) + ')' : '') + '</li>').join('') + $q.fy).join('') + $q.fz : '';
  const ltr = t => $q.fA + escH(t) + $q.fB;
  const main = $q.fC + pl + $q.fD + pl + $q.fE + escH(X('check')) + $q.fF + escH(X('xray')) + $q.fG + (d ? escH(X('h1', { n: $q.fH })).replace($q.fH, '<bdi>' + escH(clip(name, 80)) + $q.fB) : escH(X('h1_nf'))) + '</h1>' +
    (d ? $q.fI + escH(X('lead', { d: $q.fH, t: $q.fJ })).replace($q.fH, ltr(String(d.meta.started_at).slice(0, 10))).replace($q.fJ, ltr(String(d.meta.started_at).slice(11, 16))) + $q.fK + escH(X('fp')) + $q.fL + root + $q.fM + pl + $q.fN + (d.meta.input.url ? '?url=' + encodeURIComponent(d.meta.input.url) : '') + '">' + escH(X('again')) + $q.fO : $q.fI + escH(X($q.fP)) + $q.fQ + pl + $q.fE + escH(X('fresh')) + $q.fO) + $q.fR +
    $q.fS +
    $q.fT + root + $q.fU + noJs + $q.fR +
    $q.fV + XV + $q.fW + (d ? $q.fX + JSON.stringify(d).replace(/</g, $q.fY) + $q.fZ : '');
  const r = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on($q.ga, { element(e) { e.setAttribute($q.gb, X('desc')); } })
    .on($q.gc, { element(e) { e.setAttribute($q.gb, title); } })
    .on($q.gd, { element(e) { e.setAttribute($q.gb, X('desc')); } })
    .on($q.ge, { element(e) { e.setAttribute($q.gb, ORIGIN + '/x/' + root + '/'); } })
    .on($q.gf, { element(e) { e.setAttribute('href', ORIGIN + '/x/' + root + '/'); } })
    .on($q.gg, { element(e) { e.remove(); } })
    .on($q.gh, { element(e) { const l = e.getAttribute($q.gi); if (LANGS.includes(l)) { e.setAttribute('href', '/x/' + root + $q.gj + l); if (l === lang) e.setAttribute($q.gk, 'page'); else e.removeAttribute($q.gk); } } })
    .on('head', { element(e) { e.append($q.gl + LANGS.map(l => $q.gm + l + $q.gn + root + $q.gj + l + '">').join(''), { html: true }); } })   // the header's language menu (site.js) reads these
    .on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
    .on($q.go, { element(e) { e.remove(); } })
    .on($q.gp, { element(e) { e.remove(); } })
    .transform(base);
  const h = new Headers(r.headers); h.set($q.gq, $q.gr); h.set($q.gs, lang);
  return new Response(r.body, { status: d ? 200 : 404, headers: h });
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method === $q.gt) return new Response(null, { status: 204, headers: Object.assign({ 'access-control-max-age': '86400' }, CORS) });
if (p === $q.er) return out(openapi(), 200, { 'cache-control': $q.fo });
if (/^\/api\/v1\/xray\/?$/.test(p)) return (req.method === 'POST' || req.method === 'GET') ? v1(req, u, env, ctx) : out({ error: $q.gu }, 405);
if (/^\/api\/kb\/xray\/stats\/?$/.test(p)) {
const dm = String(u.searchParams.get('d') || '').toLowerCase().replace(/^www\./, '').slice(0, 200);
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dm)) return out({ error: $q.bD }, 400);
try { const s = await rpc($q.gv, { p_domain: dm }); return out({ domain: dm, xrays: s ? s.xrays : 0, last: s ? s.last : null, counting: true, source: $t.k48 }, 200, { 'cache-control': $q.gw }); }
catch (e) { return out({ domain: dm, xrays: null, counting: false, note: $t.k49 }, 200, { 'cache-control': $q.gw }); }
}
if (/^\/api\/kb\/xray\/?$/.test(p)) {
if (req.method !== 'GET' && req.method !== 'POST') return out({ error: $q.gu }, 405);
let raw = u.searchParams.get('u') || '', lang = u.searchParams.get('lang') || 'en';
if (req.method === 'POST') { try { const b = await req.json(); raw = b.u || b.url || b.q || raw; lang = b.lang || lang; } catch (e) {} }
const inp = parseInput(raw);
if (!inp) return out({ error: 'empty' }, 400);
if (inp.kind === 'bad') return out({ error: 'url' }, 400);
return sse(req, env, ctx, inp, LANGS.includes(lang) ? lang : 'en');
}
let m = p.match(/^\/x\/([0-9a-f]{64})(\/|\.json|\/vc)?$/);
if (m) {
if (m[2] === '.json') { const d = await load(m[1], env); return d ? out(d, 200, { 'cache-control': $q.gx }) : out({ error: $q.t }, 404); }
if (m[2] === '/vc') return vc(m[1], env);
if (!m[2]) return new Response(null, { status: 301, headers: { location: '/x/' + m[1] + '/' } });
return page(m[1], env, ctx, shell, u.searchParams.get('lang'));
}
return null;
}
export { parseInput, identityFacts, flagFacts, regDomain, findMatch, jcs };
