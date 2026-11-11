// kolaboro.com Project X-ray (batch 11, agent x11a). Paste a project link or name on /check/ and every free check runs in parallel
// at the edge; each card is streamed to the page as soon as it is done, with its sources, bytes, SHA-256 and timing.
//   GET  /api/kb/xray?u=<url or name>&lang=xx   text/event-stream: plan, one 'card' event per check, done {root, url, proof}
//   POST /api/v1/xray {url|q, desk?}             the same, as one JSON answer. Register and free checks by default; the existing AI
//                                                desk review only with a partner key (x-api-key, existing /api/v1 metering)
//   GET  /api/v1/xray/openapi.json               OpenAPI 3.1 description of these endpoints
//   GET  /api/kb/xray/stats?d=<domain>           real count of sealed X-rays for a domain (null until the durable store exists)
//   GET  /x/<root>/  /x/<root>.json  /x/<root>/vc  a sealed X-ray again: page, JSON, W3C verifiable credential (eddsa-jcs-2022)
// Cards from x11a: match (our named projects and developers), identity (from the page, literal quotes), wayback (Internet Archive
// CDX + our dated copies), domain (RDAP), tls (Certificate Transparency via SSLMate Cert Spotter), hosting (DNS over HTTPS + RDAP of
// the IP network), registers (existing official-register lookup, without AI), flags (deterministic rules with the literal sentence).
// Evidence cards from x11b (kbx_xray_ev.js, optional: the X-ray works without it). Contract: /home/claude/wtk/x11a/XRAY_CONTRACT.md.
// Seal: root = SHA-256 of the sorted lines "card_id sha256(JCS(card))" plus "meta sha256(JCS(meta))", timestamped through the
// existing OpenTimestamps path. Rules: facts only, every item sourced, honest not found / not published, no scores, Sumba never named.
import { fetchPage, okUrl, pageParts, scanInjection, rpc, sha, WKEY, api as kbApi, logApi } from './kolaboro.js';

export const PATHS = /^\/api\/kb\/xray(?:\/stats)?\/?$|^\/api\/v1\/xray(?:\/openapi\.json)?\/?$|^\/x\/[0-9a-f]{64}(?:\/|\.json|\/vc)?$/;
const XV = 'qa13c';   // keep equal to KXR_V in index.js (cache-busting of /k/xray.js)
const ORIGIN = 'https://kolaboro.com', VERSION = 'kolaboro-xray-1', PER_IP_HOUR = 30, CARD_MS = 12000;
const UA = 'Mozilla/5.0 (compatible; KolaboroXray/1.0; +https://kolaboro.com/data-policy)';
const te = new TextEncoder();
const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256Buf = async b => hexOf(await crypto.subtle.digest('SHA-256', b));
function jcs(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : (typeof v === 'number' && !isFinite(v) ? null : v));
  if (Array.isArray(v)) return '[' + v.map(jcs).join(',') + ']';
  return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
}
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'x-api-key, content-type', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const out = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }, CORS, extra || {}) });
const RESKEY = r => new Request(ORIGIN + '/__xray_r/' + r);
const INKEY = k => new Request(ORIGIN + '/__xray_in/' + k);
const ent = t => String(t).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&#(\d{1,6});/g, (m, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ' '; } }).replace(/&#x([0-9a-f]{1,6});/gi, (m, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (e) { return ' '; } }).replace(/&(?:nbsp|#160);/g, ' ').replace(/&[a-z]{2,8};/gi, ' ');
const clip = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const isoDay = d => { try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return null; } };
const yearsSince = d => { const t = Date.parse(d); return isFinite(t) ? Math.floor((Date.now() - t) / (365.25 * 86400000) * 10) / 10 : null; };

// ------------------------------------------------------------------------------------------------ input
const SLD = new Set(['co', 'com', 'net', 'org', 'or', 'ac', 'go', 'web', 'my', 'biz', 'gov', 'edu', 'ne', 'in', 'sch', 'ltd', 'plc', 'gen', 'firm']);
function regDomain(h) { const p = h.toLowerCase().replace(/^www\./, '').split('.'); if (p.length <= 2) return p.join('.'); return (SLD.has(p[p.length - 2]) && p[p.length - 1].length === 2 ? p.slice(-3) : p.slice(-2)).join('.'); }
function parseInput(raw) {
  raw = String(raw || '').trim().slice(0, 500);
  if (raw.length < 3) return null;
  if (/^(https?:\/\/)?[^\s\/]+\.[a-z]{2,}(\/\S*)?$/i.test(raw)) { const u = okUrl(raw); if (!u) return { kind: 'bad' }; return { kind: 'url', url: u.toString(), host: u.hostname.toLowerCase().replace(/^www\./, ''), q: null }; }
  return { kind: 'name', url: null, host: null, q: raw.replace(/\s+/g, ' ').slice(0, 120) };
}

// ------------------------------------------------------------------------------------------------ instrumented fetch (proof panel)
function makeFetcher(sources) {
  return async function xfetch(url, init, name, ms) {
    const t = Date.now(), rec = { name: name || new URL(url).hostname, url: String(url), status: 0, bytes: 0, sha256: null, ms: 0 };
    sources.push(rec);
    try {
      const r = await fetch(url, Object.assign({ headers: { 'user-agent': UA, accept: 'application/json, text/html;q=0.8, */*;q=0.5' }, signal: AbortSignal.timeout(ms || 8000), cf: { cacheTtl: 3600, cacheEverything: true } }, init || {}));
      const buf = await r.arrayBuffer();
      rec.status = r.status; rec.bytes = buf.byteLength; rec.sha256 = await sha256Buf(buf); rec.ms = Date.now() - t;
      return { ok: r.ok, status: r.status, buf, headers: r.headers, text: () => new TextDecoder().decode(buf), json: () => JSON.parse(new TextDecoder().decode(buf)) };
    } catch (e) { rec.ms = Date.now() - t; rec.error = e && e.name === 'TimeoutError' ? 'timeout' : 'network'; return { ok: false, status: 0, error: rec.error, buf: new ArrayBuffer(0), text: () => '', json: () => null }; }
  };
}

// ------------------------------------------------------------------------------------------------ named data (instant recognition)
let NM = null;
async function named(env) { if (!NM) NM = await import('./kbx_named.js'); return NM.data(env); }
const normName = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\b(the|by|villas?|residences?|resort|project|bali|lombok|dubai|phuket)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const toks = s => new Set(normName(s).split(' ').filter(w => w.length > 1));
function sim(a, b) { const A = toks(a), B = toks(b); if (!A.size || !B.size) return 0; let n = 0; A.forEach(x => { if (B.has(x)) n++; }); const r = n / Math.max(A.size, B.size); return n === B.size && B.size >= 2 ? Math.max(r, 0.85) : r; }   // every typed word in the name: strong match
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
    project = ix.P.find(x => x.url && pathOf(x.url) === p) || null; if (project) how = 'exact project URL';
    const sameHost = ix.P.filter(x => x.url && (hostOf(x.url) === h || regDomain(hostOf(x.url)) === rd));
    const devHost = ix.P.filter(x => x.du && regDomain(hostOf(x.du)) === rd);
    if (!project && sameHost.length === 1) { project = sameHost[0]; how = 'only project we track on this website'; }
    const pool = sameHost.concat(devHost);
    if (pool.length) { const dv = pool[0].dvs; if (dv && ix.devs.has(dv) && pool.every(x => x.dvs === dv)) developer = ix.devs.get(dv); }
    if (!project && pool.length) also = pool.slice(0, 12);
    if (!how && pool.length) how = 'same website';
  } else {
    let best = null, bs = 0;
    for (const x of ix.P) { const s = normName(x.n) === normName(inp.q) ? 1.01 : sim(x.n, inp.q); if (s > bs) { bs = s; best = x; } }
    if (best && bs >= 0.75) { project = best; how = bs > 1 ? 'exact name' : 'similar name'; }
    let bd = null, bds = 0;
    for (const d of ix.devs.values()) { const s = normName(d.n) === normName(inp.q) ? 1.01 : sim(d.n, inp.q); if (s > bds) { bds = s; bd = d; } }
    if (bd && bds >= 0.8) developer = bd;
    if (!project && !developer) also = ix.P.map(x => [sim(x.n, inp.q), x]).filter(a => a[0] >= 0.5).sort((a, b) => b[0] - a[0]).slice(0, 5).map(a => a[1]);
  }
  if (project && !developer && project.dvs && ix.devs.has(project.dvs)) developer = ix.devs.get(project.dvs);
  return { project, developer, also, how };
}
const pLink = s => ORIGIN + '/projects/' + s + '/';
const dLink = s => ORIGIN + '/developers/' + s + '/';
function matchCard(ix, m, inp) {
  const c = { id: 'match', title: 'Already in our database', facts: [], links: [], gaps: [] };
  if (!m.project && !m.developer && !m.also.length) {
    c.status = 'not_found'; c.summary = 'This ' + (inp.kind === 'url' ? 'website' : 'name') + ' does not match any of the ' + ix.P.length.toLocaleString('en') + ' projects or ' + ix.devs.size.toLocaleString('en') + ' developers we track.';
    c.sk = 'match_none'; c.sa = { n: ix.P.length, d: ix.devs.size, kind: inp.kind }; return c;
  }
  c.status = 'found';
  if (m.project) {
    const p = m.project, cs = ix.caseBy.get(p.id) || {};
    c.project = { slug: p.s, name: p.n, url: pLink(p.s), market: p.mk, country: p.co, area: p.ar, stage: p.st, developer: p.dv || null, checked: cs.checked || null };
    c.summary = p.n + (p.dv ? ' by ' + p.dv : '') + ' (' + [p.ar, p.mk].filter(Boolean).join(', ') + ') is a project we track. Its full dossier is ready.';
    c.sk = 'match_project'; c.sa = { name: p.n, dev: p.dv || '', place: [p.ar, p.mk].filter(Boolean).join(', ') };
    c.facts.push({ k: 'Project', key: 'f_project', v: p.n, src: pLink(p.s) });
    if (p.st) c.facts.push({ k: 'Stage (our last check)', key: 'f_stage_ours', v: p.st, src: pLink(p.s) });
    if (p.fx && p.fx.handover_promised) c.facts.push({ k: 'Handover promised', key: 'f_handover', v: String(p.fx.handover_promised), src: pLink(p.s) });
    if (cs.checked) c.facts.push({ k: 'Last checked by us', key: 'f_checked', v: cs.checked, src: pLink(p.s) });
    c.links.push({ label: 'Open the full dossier', key: 'l_dossier', url: pLink(p.s), primary: true });
  }
  if (m.developer) {
    const d = m.developer; c.developer = { slug: d.s, name: d.n, url: dLink(d.s), projects: d.ids.length };
    if (!m.project) { c.summary = d.n + ' is a developer we track, with ' + d.ids.length + ' project' + (d.ids.length === 1 ? '' : 's') + ' in our database.'; c.sk = 'match_dev'; c.sa = { dev: d.n, n: d.ids.length }; }
    c.facts.push({ k: 'Developer', key: 'f_developer', v: d.n + ' (' + d.ids.length + ' project' + (d.ids.length === 1 ? '' : 's') + ' tracked)', src: dLink(d.s) });
    c.links.push({ label: 'Developer page', key: 'l_dev', url: dLink(d.s), primary: !m.project });
  }
  if (m.also.length) {
    if (!m.project && !m.developer) { c.summary = 'Not an exact match, but ' + m.also.length + ' tracked project' + (m.also.length === 1 ? ' is' : 's are') + ' close to this ' + (inp.kind === 'url' ? 'website' : 'name') + '.'; c.sk = 'match_close'; c.sa = { n: m.also.length }; c.status = 'ok'; }
    c.close = m.also.map(x => ({ name: x.n, url: pLink(x.s), market: x.mk }));
  }
  c.how = m.how; c.sources = [{ name: 'Kolaboro named index (/data/named.json, updated ' + (ix.updated || '?') + ')', url: ORIGIN + '/data/named.json', status: 200 }];
  return c;
}

// ------------------------------------------------------------------------------------------------ page facts (deterministic, literal quotes)
function sentences(text) { return text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])|\s{2,}|\s[|•·]\s/); }
function sentenceAt(text, idx, len) {
  let a = Math.max(text.lastIndexOf('. ', idx), text.lastIndexOf('! ', idx), text.lastIndexOf('? ', idx), text.lastIndexOf(' | ', idx));
  if (a < 0 || idx - a > 220) { a = Math.max(0, idx - 110); if (a > 0) { const sp = text.indexOf(' ', a); if (sp > 0 && sp < idx) a = sp + 1; } } else a += 2;
  let b = text.slice(idx + len).search(/[.!?](\s|$)|\s\|\s/); if (b < 0 || b > 220) { b = Math.min(text.length, idx + len + 110); const sp = text.lastIndexOf(' ', b); if (sp > idx + len) b = sp; } else b = idx + len + b + 1;
  return clip(text.slice(a, b), 260);
}
function meta(html, re) { const m = html.match(re); return m ? clip(m[1].replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"'), 160) : null; }
function ldNodes(html) {
  const out = []; const re = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html)) && out.length < 40) { try { const j = JSON.parse(m[1].trim()); const walk = v => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { out.push(v); if (v['@graph']) walk(v['@graph']); } }; walk(j); } catch (e) {} }
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
  if (name) facts.push({ k: 'Name on the page', key: 'f_name', v: clip(name, 140), q: name, src, how: og ? 'og:title' : h1t ? '<h1>' : '<title>' });
  else gaps.push('name');
  if (ldName && ldName !== name) facts.push({ k: 'Name in structured data', key: 'f_ldname', v: clip(ldName, 140), q: ldName, src, how: 'JSON-LD' });
  // developer: structured data, "developed by", copyright line, og:site_name
  let dev = null, devQ = null, devHow = null;
  const org = ld.find(x => /Organization|RealEstateAgent|LocalBusiness|Corporation/i.test(String(x['@type'])) && x.name);
  if (org) { dev = clip(org.name, 100); devQ = org.name; devHow = 'JSON-LD ' + org['@type']; }
  if (!dev) { const m = text.match(/\b(?:developed|built|brought to you|delivered) by\s+([A-Z][\w&.'’\- ]{2,50}?)(?=[.,;:!|]|\s(?:in|on|at|and|with|is|for|since)\b|$)/); if (m) { dev = clip(m[1], 80); devQ = sentenceAt(text, m.index, m[0].length); devHow = '"by" sentence'; } }
  if (!dev) { const m = text.match(/(?:©|\(c\)|copyright)\s*(?:20\d\d\s*[-–]?\s*(?:20\d\d)?\s*)?([A-Z][\w&.'’\- ]{2,50}?)(?=[.,|]|\s(?:all rights|todos|alle)|$)/i); if (m) { dev = clip(m[1], 80); devQ = clip(m[0], 140); devHow = 'copyright line'; } }
  if (!dev && site) { dev = site; devQ = site; devHow = 'og:site_name'; }
  if (dev) facts.push({ k: 'Developer or seller named', key: 'f_dev', v: dev, q: devQ, src, how: devHow }); else gaps.push('developer');
  // location text
  let loc = null, locQ = null;
  const addr = ld.map(x => x.address).find(Boolean);
  if (addr) { loc = typeof addr === 'string' ? addr : [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry && (addr.addressCountry.name || addr.addressCountry)].filter(Boolean).join(', '); locQ = loc; }
  if (!loc) { const m = text.match(/\b(?:[Ll]ocated|[Ss]ituated|[Nn]estled|[Aa]ddress)\s*(?:in|at|on|:)?\s+([A-Z][^.!?|]{3,90})/); if (m) { loc = clip(m[1], 90); locQ = sentenceAt(text, m.index, m[0].length); } }
  if (loc) facts.push({ k: 'Location stated', key: 'f_loc', v: clip(loc, 120), q: locQ, src }); else gaps.push('location');
  // stage
  STAGE_RX.lastIndex = 0; const st = STAGE_RX.exec(text);
  if (st) facts.push({ k: 'Stage stated', key: 'f_stage', v: st[1].toLowerCase(), q: sentenceAt(text, st.index, st[0].length), src });
  // handover
  HANDOVER_RX.lastIndex = 0; const hs = []; let hm; while ((hm = HANDOVER_RX.exec(text)) && hs.length < 3) hs.push({ v: hm[2], q: sentenceAt(text, hm.index, hm[0].length) });
  uniqBy(hs, x => x.v.toLowerCase()).forEach((x, i) => facts.push({ k: i ? 'Other date stated' : 'Promised handover', key: i ? 'f_date2' : 'f_handover', v: x.v, q: x.q, src }));
  if (!hs.length) gaps.push('handover');
  // prices and sizes
  PRICE_RX.lastIndex = 0; const ps = []; let pm; while ((pm = PRICE_RX.exec(text)) && ps.length < 40) { const v = pm[0].trim(); if (/\d{3}/.test(v.replace(/[.,\s]/g, '')) && !/^20[0-4]\d$/.test(v)) ps.push({ v, q: sentenceAt(text, pm.index, pm[0].length) }); }
  const pu = uniqBy(ps, x => x.v.replace(/\s/g, '')).slice(0, 6);
  pu.forEach(x => facts.push({ k: 'Price found', key: 'f_price', v: x.v, q: x.q, src }));
  if (!pu.length) gaps.push('price');
  SIZE_RX.lastIndex = 0; const ss = []; let sm; while ((sm = SIZE_RX.exec(text)) && ss.length < 30) ss.push({ v: sm[0].trim(), q: sentenceAt(text, sm.index, sm[0].length) });
  const su = uniqBy(ss, x => x.v.toLowerCase().replace(/\s/g, '')).slice(0, 6);
  su.forEach(x => facts.push({ k: 'Size found', key: 'f_size', v: x.v, q: x.q, src }));
  if (!su.length) gaps.push('size');
  return { facts, gaps, name, dev, loc };
}

// red flags: fixed rules over the visible text; each hit carries the literal sentence. Absence rules say what was not found.
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

// ------------------------------------------------------------------------------------------------ x11a cards
async function cardIdentity(X) {
  const pg = await X.page;
  if (!pg) return { id: 'identity', title: 'What the page says', status: 'skipped', summary: 'No website was given, so there is no page to read.', sk: 'id_noweb', gaps: ['developer'] };
  if (!pg.ok) return { id: 'identity', title: 'What the page says', status: 'unavailable', summary: pg.error === 'blocked' ? 'The website refused our automated reader' + (pg.status ? ' (HTTP ' + pg.status + ')' : '') + '. This says nothing about the project.' : 'The website could not be read' + (pg.status ? ' (HTTP ' + pg.status + ')' : pg.detail === 'timeout' ? ' (no answer in 15 s)' : '') + '.', sk: pg.error === 'blocked' ? 'id_blocked' : 'id_fail', sa: { status: pg.status || '' }, gaps: ['developer', 'permit'] };
  const f = identityFacts(pg, X.input);
  X.found.identity = f;
  const c = { id: 'identity', title: 'What the page says', status: f.facts.length ? 'found' : 'not_published', facts: f.facts, gaps: f.gaps };
  c.summary = 'Read ' + pg.text.length.toLocaleString('en') + ' visible characters of ' + pg.url.replace(/^https?:\/\//, '') + (pg.hidden_blocks ? ' (' + pg.hidden_blocks + ' hidden blocks removed)' : '') + '. ' + f.facts.length + ' facts found with their literal sentence.';
  c.sk = 'id_read'; c.sa = { chars: pg.text.length, url: pg.url.replace(/^https?:\/\//, ''), n: f.facts.length, hidden: pg.hidden_blocks || 0 };
  c.page = { url: pg.url, status: pg.status, bytes: pg.bytes, sha256: pg.sha256, redirects: pg.hops || 0 };
  return c;
}
async function cardFlags(X) {
  const pg = await X.page;
  if (!pg || !pg.ok) return { id: 'flags', title: 'Statements to check', status: 'skipped', summary: 'No page text to check.', sk: 'fl_none' };
  const f = flagFacts(pg), hits = f.facts.filter(x => !x.absent).length, abs = f.facts.filter(x => x.absent).length;
  return { id: 'flags', title: 'Statements to check', status: hits || abs ? 'found' : 'ok', facts: f.facts, gaps: f.gaps,
    summary: hits + ' statement' + (hits === 1 ? '' : 's') + ' on the page match our fixed rules, and ' + abs + ' usual disclosure' + (abs === 1 ? ' is' : 's are') + ' missing. These are what the page says, not a verdict.', sk: 'fl_sum', sa: { hits, abs },
    method: { rules: FLAG_RULES.length + ABSENT.length, url: ORIGIN + '/how-we-score' } };
}
async function cardWayback(X) {
  const h = X.input.host; const c = { id: 'wayback', title: 'Internet Archive timeline', facts: [], links: [], gaps: [] };
  const m = await X.match;
  const own = [];
  if (m && m.project) { const p = m.project, cs = (X.ix && X.ix.caseBy.get(p.id)) || {};
    if (p.ad) own.push({ k: 'Our first record of this project', key: 'f_own_first', v: p.ad, src: pLink(p.s) });
    if (p.sealed && p.sha) own.push({ k: 'Our sealed copy of its facts', key: 'f_own_sealed', v: p.sealed + ' · SHA-256 ' + p.sha.slice(0, 16) + '…', src: pLink(p.s) });
    if (cs.fp && cs.fp.sha256) own.push({ k: 'Our fingerprint of the developer page', key: 'f_own_fp', v: cs.fp.date + ' · SHA-256 ' + cs.fp.sha256.slice(0, 16) + '…', src: pLink(p.s) });
    if ((cs.history || []).length) own.push({ k: 'Dated changes we recorded', key: 'f_own_hist', v: String(cs.history.length), src: pLink(p.s) + '#history' });
  }
  if (!h) { c.status = own.length ? 'found' : 'skipped'; c.facts = own; c.summary = own.length ? 'Our own dated copies of this project are listed below.' : 'No website given, so there is nothing to look up in the Internet Archive.'; c.sk = own.length ? 'wb_own' : 'wb_noweb'; return c; }
  const rd = regDomain(h);
  const [first, spark] = await Promise.all([
    X.fetch('https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(rd) + '&output=json&limit=1&fl=timestamp,original,statuscode', null, 'Internet Archive CDX API', 10000),
    X.fetch('https://web.archive.org/__wb/sparkline?output=json&url=' + encodeURIComponent(rd) + '&collapse=timestamp:6', null, 'Internet Archive sparkline', 10000)
  ]);
  let rows = null; try { rows = first.ok ? first.json() : null; } catch (e) {}
  let sp = null; try { sp = spark.ok ? spark.json() : null; } catch (e) {}
  const years = {};
  if (sp && sp.years) Object.keys(sp.years).forEach(y => { const n = (sp.years[y] || []).reduce((a, b) => a + (+b || 0), 0); if (n) years[y] = n; });
  if (!first.ok && !spark.ok) { c.status = 'unavailable'; c.summary = 'The Internet Archive did not answer in time. Try again later.'; c.sk = 'wb_down'; c.facts = own; return c; }
  const fr = rows && rows.length > 1 ? rows[1] : null;
  const ts = fr ? fr[0] : (sp && sp.first_ts) || null;
  if (!ts) { c.status = 'not_found'; c.summary = 'The Internet Archive has no snapshot of ' + rd + '. A site with no archived history is usually new.'; c.sk = 'wb_none'; c.sa = { d: rd }; c.facts = own; c.links.push({ label: 'Search the Internet Archive', key: 'l_wb_all', url: 'https://web.archive.org/web/*/' + rd + '*' }); return c; }
  const day = ts.slice(0, 4) + '-' + ts.slice(4, 6) + '-' + ts.slice(6, 8);
  c.status = 'found';
  c.facts.push({ k: 'First snapshot of ' + rd, key: 'f_wb_first', v: day + ' (' + yearsSince(day) + ' years ago)', src: 'https://web.archive.org/web/' + ts + '/' + (fr ? fr[1] : rd) });
  if (sp && sp.last_ts) { const l = String(sp.last_ts); c.facts.push({ k: 'Latest snapshot', key: 'f_wb_last', v: l.slice(0, 4) + '-' + l.slice(4, 6) + '-' + l.slice(6, 8), src: 'https://web.archive.org/web/' + l + '/' + rd }); }
  const ys = Object.keys(years).sort();
  if (ys.length) { c.years = ys.map(y => ({ y: +y, n: years[y], url: 'https://web.archive.org/web/' + y + '0101000000*/' + rd })); c.facts.push({ k: 'Snapshots counted (months with captures, by year)', key: 'f_wb_years', v: ys.map(y => y + ': ' + years[y]).join(' · '), src: 'https://web.archive.org/web/*/' + rd + '*' }); }
  c.facts = c.facts.concat(own);
  c.summary = 'The Internet Archive first saw ' + rd + ' on ' + day + '.'; c.sk = 'wb_first'; c.sa = { d: rd, day };
  c.links.push({ label: 'All snapshots', key: 'l_wb_all', url: 'https://web.archive.org/web/*/' + rd + '*' });
  return c;
}
async function rdapJson(X, url, name) { const r = await X.fetch(url, { headers: { 'user-agent': UA, accept: 'application/rdap+json, application/json' }, redirect: 'follow' }, name, 9000); let j = null; try { j = r.ok ? r.json() : null; } catch (e) {} return { r, j }; }
const ev = (j, a) => ((j && j.events) || []).find(e => e.eventAction === a);
function vname(ent) { const v = ent && ent.vcardArray && ent.vcardArray[1]; const fn = v && v.find(x => x[0] === 'fn'); return fn ? fn[3] : (ent && ent.handle) || null; }
async function cardDomain(X) {
  const h = X.input.host; const c = { id: 'domain', title: 'Domain registration', facts: [], links: [], gaps: [] };
  if (!h) { c.status = 'skipped'; c.summary = 'No website given.'; c.sk = 'dm_noweb'; return c; }
  const rd = regDomain(h), { r, j } = await rdapJson(X, 'https://rdap.org/domain/' + encodeURIComponent(rd), 'RDAP (rdap.org bootstrap, then the registry)');
  const src = 'https://rdap.org/domain/' + rd;
  if (!j) { c.status = r.status === 404 ? 'not_published' : 'unavailable'; c.summary = r.status === 404 ? 'No public RDAP record for ' + rd + ' (some country registries do not run RDAP).' : 'The RDAP service did not answer.'; c.sk = r.status === 404 ? 'dm_none' : 'dm_down'; c.sa = { d: rd }; c.links.push({ label: 'Look it up on lookup.icann.org', key: 'l_icann', url: 'https://lookup.icann.org/en/lookup?name=' + rd }); return c; }
  const reg = ev(j, 'registration'), exp = ev(j, 'expiration'), chg = ev(j, 'last changed') || ev(j, 'last update of RDAP database');
  const registrar = (j.entities || []).find(e => (e.roles || []).includes('registrar'));
  c.status = 'found';
  if (reg) c.facts.push({ k: 'Registered', key: 'f_dm_reg', v: isoDay(reg.eventDate) + ' (' + yearsSince(reg.eventDate) + ' years ago)', src });
  else c.facts.push({ k: 'Registration date', key: 'f_dm_reg', v: 'not published by the registry', src });
  if (exp) c.facts.push({ k: 'Paid until', key: 'f_dm_exp', v: isoDay(exp.eventDate), src });
  if (chg && chg.eventAction === 'last changed') c.facts.push({ k: 'Last changed', key: 'f_dm_chg', v: isoDay(chg.eventDate), src });
  if (registrar) c.facts.push({ k: 'Registrar', key: 'f_dm_registrar', v: vname(registrar), src });
  if ((j.status || []).length) c.facts.push({ k: 'Status codes', key: 'f_dm_status', v: j.status.slice(0, 4).join(', '), src });
  if ((j.nameservers || []).length) c.facts.push({ k: 'Name servers', key: 'f_dm_ns', v: j.nameservers.slice(0, 3).map(n => String(n.ldhName || '').toLowerCase()).join(', '), src });
  const self = (j.links || []).find(l => l.rel === 'self'); if (self) c.links.push({ label: 'Registry RDAP record', key: 'l_rdap', url: self.href });
  c.summary = reg ? rd + ' was registered on ' + isoDay(reg.eventDate) + (registrar ? ' through ' + vname(registrar) : '') + '.' : 'The registry does not publish when ' + rd + ' was registered.';
  c.sk = reg ? 'dm_reg' : 'dm_noreg'; c.sa = { d: rd, day: reg ? isoDay(reg.eventDate) : '', by: registrar ? vname(registrar) : '' };
  c.reg_date = reg ? isoDay(reg.eventDate) : null;
  return c;
}
async function cardTls(X) {
  const h = X.input.host; const c = { id: 'tls', title: 'Security certificate history', facts: [], links: [], gaps: [] };
  if (!h) { c.status = 'skipped'; c.summary = 'No website given.'; c.sk = 'dm_noweb'; return c; }
  const rd = regDomain(h), crt = 'https://crt.sh/?q=' + encodeURIComponent(rd);
  // Cert Spotter (fast, current certificates) and crt.sh (full history, often slow): both Certificate Transparency log searches
  const [r, r2] = await Promise.all([
    X.fetch('https://api.certspotter.com/v1/issuances?domain=' + encodeURIComponent(rd) + '&include_subdomains=true&expand=issuer', null, 'Certificate Transparency (SSLMate Cert Spotter API)', 9000),
    X.fetch(crt + '&output=json', null, 'Certificate Transparency history (crt.sh)', 10000)
  ]);
  let a = null; try { a = r.ok ? r.json() : null; } catch (e) {}
  let hist = null; try { hist = r2 && r2.ok ? r2.json() : null; } catch (e) {}
  c.links.push({ label: 'Search crt.sh', key: 'l_crt', url: crt });
  if (!Array.isArray(a) && !Array.isArray(hist)) { c.status = 'unavailable'; c.summary = r.status === 429 ? 'The Certificate Transparency search is at its free hourly limit. Try again later or use crt.sh.' : 'The Certificate Transparency search did not answer.'; c.sk = r.status === 429 ? 'tl_rate' : 'tl_down'; return c; }
  const cur = Array.isArray(a) ? a : [], all = Array.isArray(hist) ? hist : [];
  if (!cur.length && !all.length) { c.status = 'not_found'; c.summary = 'No certificate for ' + rd + ' is listed in the public Certificate Transparency logs.'; c.sk = 'tl_none'; c.sa = { d: rd }; return c; }
  c.status = 'found';
  const firstAll = all.length ? all.map(x => x.not_before).filter(Boolean).sort()[0] : null;
  const byStart = cur.slice().sort((x, y) => Date.parse(x.not_before) - Date.parse(y.not_before)), last = byStart[byStart.length - 1];
  if (firstAll) c.facts.push({ k: 'First certificate in the public logs', key: 'f_tl_first', v: isoDay(firstAll) + ' (' + yearsSince(firstAll) + ' years ago)', src: crt });
  else if (byStart.length) c.facts.push({ k: 'Oldest certificate still valid today', key: 'f_tl_oldcur', v: isoDay(byStart[0].not_before) + ' (full history: crt.sh did not answer in time)', src: crt });
  if (last) {
    c.facts.push({ k: 'Current certificate issuer', key: 'f_tl_issuer', v: (last.issuer && (last.issuer.friendly_name || last.issuer.name)) || 'unknown', src: 'https://sslmate.com/certspotter/' });
    c.facts.push({ k: 'Current certificate valid', key: 'f_tl_valid', v: isoDay(last.not_before) + ' to ' + isoDay(last.not_after), src: 'https://sslmate.com/certspotter/' });
  }
  c.facts.push({ k: 'Certificates listed', key: 'f_tl_n', v: String(all.length || cur.length), src: crt });
  const by = last && last.issuer && last.issuer.friendly_name || '';
  if (firstAll) { c.summary = 'The first certificate for ' + rd + ' in the public logs dates from ' + isoDay(firstAll) + (by ? '; the current one is from ' + by : '') + '.'; c.sk = 'tl_first'; c.sa = { d: rd, day: isoDay(firstAll), by }; }
  else { c.summary = 'Current certificates for ' + rd + (by ? ' are from ' + by : '') + '; the full history did not load in time.'; c.sk = 'tl_cur'; c.sa = { d: rd, by }; }
  return c;
}
const CDN = /cloudflare|amazon|aws|google|akamai|fastly|vercel|netlify|microsoft|azure|incapsula|imperva|sucuri|bunny|ovh|hetzner|digitalocean|wix|squarespace|shopify|automattic|wpengine|hostinger/i;
async function cardHosting(X) {
  const h = X.input.host; const c = { id: 'hosting', title: 'Where the website is hosted', facts: [], links: [], gaps: [] };
  if (!h) { c.status = 'skipped'; c.summary = 'No website given.'; c.sk = 'dm_noweb'; return c; }
  const host = (X.input.url && new URL(X.input.url).hostname) || h;
  const d = await X.fetch('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(host) + '&type=A', { headers: { accept: 'application/dns-json' } }, 'DNS over HTTPS (Cloudflare 1.1.1.1)', 6000);
  let dj = null; try { dj = d.ok ? d.json() : null; } catch (e) {}
  const ips = ((dj && dj.Answer) || []).filter(x => x.type === 1).map(x => x.data).slice(0, 3);
  if (!ips.length) { c.status = dj ? 'not_found' : 'unavailable'; c.summary = dj ? 'No IPv4 address published for ' + host + '.' : 'DNS lookup did not answer.'; c.sk = dj ? 'hs_noip' : 'hs_down'; c.sa = { d: host }; return c; }
  const { j } = await rdapJson(X, 'https://rdap.org/ip/' + ips[0], 'RDAP of the IP network (regional internet registry)');
  c.status = 'found';
  c.facts.push({ k: 'IP address', key: 'f_hs_ip', v: ips.join(', '), src: 'https://cloudflare-dns.com/dns-query?name=' + host + '&type=A' });
  let net = null, ctry = null;
  if (j) { net = j.name || null; ctry = j.country || null; const org = (j.entities || []).map(vname).filter(Boolean)[0];
    if (net || org) c.facts.push({ k: 'Network', key: 'f_hs_net', v: [net, org].filter(Boolean).join(' · '), src: 'https://rdap.org/ip/' + ips[0] });
    c.facts.push({ k: 'Network registered in', key: 'f_hs_ctry', v: ctry || 'not published', src: 'https://rdap.org/ip/' + ips[0] });
    net = [net, org].filter(Boolean).join(' ');
  }
  const cdn = net && CDN.test(net);
  if (cdn) c.facts.push({ k: 'Note', key: 'f_hs_note', v: 'This is a large hosting or CDN network: its country says where the network is registered, not where the developer is.' , vk: 'v_hs_cdn' });
  c.summary = host + ' resolves to ' + ips[0] + (net ? ' on ' + clip(net, 60) : '') + (ctry ? ', a network registered in ' + ctry : '') + '.';
  c.sk = 'hs_ip'; c.sa = { d: host, ip: ips[0], net: clip(net || '', 60), c: ctry || '' };
  return c;
}
async function cardRegisters(X) {
  const c = { id: 'registers', title: 'Official registers', facts: [], links: [], gaps: [] };
  const m = await X.match, pg0 = await X.page, idf = pg0 && pg0.ok ? identityFacts(pg0, X.input) : null;
  const company = (m && m.developer && m.developer.n) || (m && m.project && m.project.dv) || (idf && idf.dev) || null;
  const body = { ai: '0' }; if (X.input.url) body.url = X.input.url; else body.q = X.input.q; if (company && company.length >= 3 && company.length <= 120) body.company = company;
  const t = Date.now(); let d = null;
  try {
    const lk = await import('./kbx_lookup.js');
    const r = await lk.handle(new Request(ORIGIN + '/api/kb/lookup', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': X.ip }, body: JSON.stringify(body) }), new URL(ORIGIN + '/api/kb/lookup'), X.env, X.ctx);
    d = await r.json();
  } catch (e) { d = { error: 'server' }; }
  c.sources = [{ name: 'Kolaboro official-register lookup (/api/kb/lookup, no AI)', url: ORIGIN + '/api/kb/lookup', status: d && !d.error ? 200 : 0, ms: Date.now() - t }];
  if (!d || d.error) { c.status = d && d.error === 'rate' ? 'unavailable' : 'unavailable'; c.summary = d && d.error === 'rate' ? 'You ran many register lookups this hour; they run again next hour.' : 'The register lookup did not complete.'; c.sk = d && d.error === 'rate' ? 'rg_rate' : 'rg_down'; return c; }
  const regs = (d.checks || []).filter(x => x.id !== 'website' && x.id !== 'rdap');
  regs.forEach(x => {
    const sn = x.snapshot || {};
    c.facts.push({ k: x.label || x.name || x.id, v: x.status === 'found' ? (x.summary || x.note || 'found') : x.status.replace(/_/g, ' ') + (x.note ? ': ' + clip(x.note, 160) : ''), src: sn.url || x.url || x.source_url || null, status: x.status, sha256: sn.sha256 || null });
    if (sn.sha256) c.sources.push({ name: x.label || x.id, url: sn.url || x.url, status: sn.status || 200, bytes: sn.bytes || null, sha256: sn.sha256 });
  });
  const found = regs.filter(x => x.status === 'found').length;
  c.status = !regs.length ? 'not_found' : found ? 'found' : 'not_found';
  c.summary = !regs.length ? 'No official register we can query covers this input' + (company ? '' : ' (no company name found to search)') + '.' : found + ' of ' + regs.length + ' official register checks returned a record' + (company ? ' (company searched: ' + clip(company, 60) + ')' : '') + '.';
  c.sk = !regs.length ? 'rg_none' : 'rg_sum'; c.sa = { f: found, n: regs.length, co: company ? clip(company, 60) : '' };
  if (!found) c.gaps.push('developer');
  c.gaps.push('land', 'permit');
  if (d.seal) { c.seal = { root: d.seal.root_sha256, url: d.seal.result_url }; c.links.push({ label: 'Sealed register result', key: 'l_seal', url: d.seal.result_url }); }
  c.links.push({ label: 'Which registers exist per country', key: 'l_cov', url: ORIGIN + '/registers/' });
  return c;
}
async function cardDesk(X) {   // API only, with a partner key: the existing desk review (its own caps and cache apply)
  const t = Date.now();
  const r = await kbApi(new Request(ORIGIN + '/api/kb/analyze', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': X.ip }, body: JSON.stringify({ url: X.input.url, lang: X.lang }) }), new URL(ORIGIN + '/api/kb/analyze'), X.env, X.ctx);
  const d = await r.json().catch(() => ({}));
  const c = { id: 'desk', title: 'Desk review (AI)', sources: [{ name: 'Kolaboro desk review (/api/kb/analyze)', url: ORIGIN + '/api/kb/analyze', status: r.status, ms: Date.now() - t }] };
  if (!d.report) { c.status = 'unavailable'; c.summary = 'The desk review did not complete (' + (d.error || r.status) + ').'; return c; }
  const rp = d.report; c.status = 'found'; c.summary = clip(rp.summary || '', 300); c.cached = !!d.cached;
  c.facts = ['project', 'developer', 'location', 'completion', 'price_from', 'title_type', 'permit_claim', 'advertised_return'].filter(k => rp[k]).map(k => ({ k: k.replace(/_/g, ' '), v: String(rp[k]), src: X.input.url }));
  return c;
}
// x11b evidence cards (items 11-18) in our card shape: items -> facts, relative links made absolute, not_applicable -> skipped
const EV_TITLES = { location: 'Location', satellite: 'Satellite image now', images: 'Images on the page', ppm: 'Price per m² vs official data', market: 'Market base rates', developer: 'Developer track record', law: 'Buyer protection law', similar: 'Similar projects nearby' };
const EV_GAPS = { location: ['site'], satellite: ['site'], law: ['contract'], developer: ['developer'], ppm: [], market: [], images: [], similar: [] };
const absU = x => typeof x === 'string' && x ? (x.startsWith('/') ? ORIGIN + x : x) : undefined;
function evCard(c) {
  const k = { id: c.id, n: c.n, title: c.title || EV_TITLES[c.id] || c.id, status: c.status === 'not_applicable' ? 'skipped' : (c.status || 'ok'), summary: c.summary || '',
    facts: (c.items || []).slice(0, 30).map(i => ({ k: String(i.label || ''), v: i.value == null ? '' : String(i.value), q: i.quote || undefined, src: absU(i.url), kind: i.kind || undefined })),
    limits: Array.isArray(c.limits) ? c.limits.slice(0, 6) : undefined, paid: c.paid || undefined, data: c.data || undefined,
    gaps: (c.status === 'found' && c.id === 'developer') ? [] : (EV_GAPS[c.id] || []),
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

// ------------------------------------------------------------------------------------------------ runner
async function withBudget(p, ms) { let t; const to = new Promise(r => { t = setTimeout(() => r({ __timeout: true }), ms); }); try { return await Promise.race([p, to]); } finally { clearTimeout(t); } }
async function runXray(inp, opts, emit) {
  const { env, ctx, req } = opts, t0 = Date.now(), started = new Date().toISOString();
  const allSources = [], cards = [], waiters = {};
  const X = { input: inp, lang: opts.lang || 'en', env, ctx, ip: req.headers.get('cf-connecting-ip') || 'x', found: {}, ix: null };
  const resolvers = {}; const wait = id => waiters[id] || (waiters[id] = new Promise(r => { resolvers[id] = r; }));
  X.wait = wait;
  let ix = null; try { ix = await named(env); } catch (e) {}
  X.ix = ix; X.named = Promise.resolve(ix);
  // conflict of interest: no X-ray of projects in the founder's market
  if (ix && coiHit(ix, inp)) {
    const c = { id: 'coi', title: 'Not reviewed: conflict of interest', status: 'skipped', sk: 'coi', summary: 'We do not review or name projects in this market, because a Kolaboro founder develops a project there. See our independence policy.', links: [{ label: 'Independence policy', key: 'l_indep', url: ORIGIN + '/independence' }], ms: 0, where: 'edge', sources: [] };
    emit({ type: 'plan', checks: [{ id: 'coi', title: c.title }], input: inp }); emit({ type: 'card', card: c });
    return finish([c], inp, started, t0, opts, emit, allSources);
  }
  let m = ix ? findMatch(ix, inp) : { project: null, developer: null, also: [] };
  // a typed name that matches a tracked project: X-ray its website
  if (inp.kind === 'name' && m.project && m.project.url && okUrl(m.project.url)) { const u = okUrl(m.project.url); inp = Object.assign({}, inp, { url: u.toString(), host: u.hostname.toLowerCase().replace(/^www\./, ''), via: 'name' }); X.input = inp; }
  X.match = Promise.resolve(m);
  // evidence cards 11-18 (x11b, kbx_xray_ev.js evRun): optional, the X-ray works without the module
  let ev = null; try { ev = await import('./kbx_xray_ev.js'); if (typeof ev.evRun !== 'function') ev = null; } catch (e) { ev = null; }
  const evIds = ev && (inp.url || m.project) ? (ev.EV_IDS || []) : [];
  const list = CARDS.filter(c => !(c.web && !inp.host));
  if (opts.desk && inp.url) list.push({ id: 'desk', title: 'Desk review (AI)', run: cardDesk, where: 'edge+ai' });
  emit({ type: 'plan', checks: list.map(c => ({ id: c.id, title: c.title })).concat(evIds.map(id => ({ id, title: EV_TITLES[id] || id }))), input: inp, at: started, colo: (req.cf && req.cf.colo) || null, version: VERSION });
  // the page, fetched once and shared by every card that reads it
  X.page = inp.url ? (async () => {
    const t = Date.now(), rec = { name: 'The project website', url: inp.url, status: 0, bytes: 0, sha256: null, ms: 0 }; allSources.push(rec);
    const pg = await fetchPage(new URL(inp.url));
    rec.ms = Date.now() - t; rec.status = pg.status || 0;
    if (pg.error) { rec.error = pg.error; return { ok: false, error: pg.error, status: pg.status, detail: pg.detail }; }
    const buf = te.encode(pg.html); rec.bytes = buf.byteLength; rec.sha256 = await sha256Buf(buf); if (pg.url !== inp.url) rec.final_url = pg.url;
    const parts = pageParts(pg.html);
    return { ok: true, url: pg.url, status: pg.status, html: pg.html, text: ent(parts.visible).slice(0, 300000), hidden: parts.hidden, hidden_blocks: parts.hidden.length, bytes: buf.byteLength, sha256: rec.sha256, hops: pg.hops };
  })() : Promise.resolve(null);
  const done = (c, def, t, srcs) => {
    c = c || { status: 'skipped' }; c.id = def.id; c.title = c.title || def.title; c.ms = Date.now() - t; c.where = c.where || def.where || 'edge';
    c.sources = (c.sources || []).concat(srcs.filter(s => !(c.sources || []).some(x => x.url === s.url)));
    c.sources.forEach(s => allSources.push(s));
    cards.push(c); if (resolvers[def.id]) resolvers[def.id](c); else waiters[def.id] = Promise.resolve(c);
    emit({ type: 'card', card: c }); return c;
  };
  const jobs = list.map(def => {
    const t = Date.now();
    if (def.id === 'match') return Promise.resolve(done(ix ? matchCard(ix, m, inp) : { status: 'unavailable', summary: 'Our project index could not be loaded.', sk: 'match_down' }, def, t, []));
    const srcs = []; const XX = Object.assign({}, X, { fetch: makeFetcher(srcs) });
    return withBudget(Promise.resolve().then(() => def.run(XX)), CARD_MS)
      .then(c => c && c.__timeout ? { status: 'unavailable', summary: 'This check took longer than ' + CARD_MS / 1000 + ' s and was stopped.', sk: 'timeout' } : c)
      .catch(e => ({ status: 'error', summary: 'This check failed: ' + clip(String(e && e.message || e), 120), sk: 'error' }))
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
    evIds.filter(id => !seen.has(id)).forEach(id => done({ status: 'error', summary: 'This check did not answer.', sk: 'error' }, { id, title: EV_TITLES[id] || id }, t, []));
  })());
  await Promise.all(jobs);
  // the page fetch itself belongs to identity (shown once in the proof list)
  return finish(cards, inp, started, t0, opts, emit, allSources);
}
async function finish(cards, inp, started, t0, opts, emit, allSources) {
  const { env, ctx, req } = opts;
  const order = ['coi', 'match', 'identity', 'flags', 'registers', 'domain', 'wayback', 'location', 'satellite', 'ppm', 'market', 'developer', 'law', 'similar', 'images', 'tls', 'hosting', 'desk'];
  cards.sort((a, b) => { const x = order.indexOf(a.id), y = order.indexOf(b.id); return (x < 0 ? 50 : x) - (y < 0 ? 50 : y); });
  const lines = [];
  for (const c of cards) { c.sha256 = await sha(jcs(Object.assign({}, c, { sha256: undefined }))); lines.push(c.id + ' ' + c.sha256); }
  const metaObj = { version: VERSION, input: { kind: inp.kind, url: inp.url, q: inp.q, via: inp.via || null }, started_at: started, lang: opts.lang || 'en' };
  lines.push('meta ' + await sha(jcs(metaObj))); lines.sort();
  const root = await sha(lines.join('\n'));
  const seen = new Map(); allSources.forEach(s => { const k = s.url + ' ' + (s.sha256 || ''); if (!seen.has(k)) seen.set(k, s); });
  const srcList = [...seen.values()];
  const proof = { colo: (req.cf && req.cf.colo) || null, country: (req.cf && req.cf.country) || null, runtime: 'Cloudflare Workers (V8 isolate at the edge)', started_at: started, finished_at: new Date().toISOString(), total_ms: Date.now() - t0,
    sources: srcList.length, hosts: [...new Set(srcList.map(s => { try { return new URL(s.url).hostname; } catch (e) { return ''; } }).filter(Boolean))], bytes_read: srcList.reduce((a, s) => a + (s.bytes || 0), 0),
    cards: cards.map(c => ({ id: c.id, status: c.status, ms: c.ms, where: c.where, sources: (c.sources || []).length, sha256: c.sha256 })),
    seal: { root_sha256: root, lines, method: 'root_sha256 = SHA-256 of the sorted lines joined by a newline; a card line is "card_id SHA-256(JCS(card without its sha256 field))", the meta line hashes JCS(meta). JCS = RFC 8785 canonical JSON.' },
    ai: opts.desk ? 'The existing desk review ran (partner key).' : 'No AI model was called by the X-ray. Every card is a fixed rule, a public source or our own data.' };
  const res = { version: VERSION, root, url: ORIGIN + '/x/' + root + '/', meta: metaObj, cards, proof, lang: opts.lang || 'en',
    disclaimer: 'Every item is what the named source returned or what the page says, with its link. "Not found" or "not published" is not proof of a problem, and "found" is not proof the project is sound. A Kolaboro agent at the land office and on site checks what no website can.' };
  // OpenTimestamps through the existing stamp path (Bitcoin calendars), best effort
  try {
    const r = await kbApi(new Request(ORIGIN + '/api/kb/stamp', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': req.headers.get('cf-connecting-ip') || 'x' }, body: JSON.stringify({ hash: root, source: 'xray' }) }), new URL(ORIGIN + '/api/kb/stamp'), env, ctx);
    const d = await r.json(); proof.seal.opentimestamps = d.stamp ? { status: 'submitted', created_at: d.stamp.created_at, calendars: d.stamp.calendars, verify: ORIGIN + '/api/kb/stamp?hash=' + root } : { status: d.error === 'rate' ? 'rate_limited' : 'not_stamped' };
  } catch (e) { proof.seal.opentimestamps = { status: 'error' }; }
  await store(res, inp, env, ctx);
  emit({ type: 'done', root, url: res.url, total_ms: proof.total_ms, proof, stored: res.stored });
  ctx.waitUntil(logApi('xray', true, false, proof.total_ms));
  return res;
}
async function store(res, inp, env, ctx) {
  const body = JSON.stringify(res);
  ctx.waitUntil(caches.default.put(RESKEY(res.root), new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=2592000' } })).catch(() => {}));
  res.stored = 'edge';
  try { const r = await withBudget(rpc('kolaboro_xray_put', { p_wkey: WKEY, p_root: res.root, p_domain: inp.host || null, p_q: inp.q || inp.url, p_data: res }), 4000); if (r === 'ok') res.stored = 'db'; } catch (e) {}
}
async function load(root, env) {
  const h = await caches.default.match(RESKEY(root)); if (h) return h.json();
  try { const d = await rpc('kolaboro_xray_get', { p_root: root }); if (d && d.root === root) return d; } catch (e) {}
  return null;
}

// ------------------------------------------------------------------------------------------------ HTTP
async function rateOk(req, ctx) {
  const ip0 = req.headers.get('cf-connecting-ip') || 'x', ip = ip0.includes(':') ? ip0.split(':').slice(0, 4).join(':') + '::/64' : ip0, hour = new Date().toISOString().slice(0, 13);
  const k = new Request(ORIGIN + '/__xray_rl/' + encodeURIComponent(ip) + '/' + hour); const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
  if (n >= PER_IP_HOUR) return false;
  ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } }))); return true;
}
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
function sse(req, env, ctx, inp, lang) {
  const { readable, writable } = new TransformStream(), w = writable.getWriter();
  const send = o => w.write(te.encode('data: ' + JSON.stringify(o) + '\n\n')).catch(() => {});
  const job = (async () => {
    try {
      const ik = await sha(VERSION + XV + '|' + lang + '|' + (inp.url || '') + '|' + (inp.q || ''));
      const hit = await caches.default.match(INKEY(ik));
      if (hit) { const res = await hit.json(); send({ type: 'plan', checks: res.cards.map(c => ({ id: c.id, title: c.title })), input: res.meta.input, cached: true, at: res.meta.started_at }); for (const c of res.cards) send({ type: 'card', card: c, cached: true }); send({ type: 'done', root: res.root, url: res.url, total_ms: res.proof.total_ms, proof: res.proof, cached: true, stored: res.stored }); return; }
      if (!(await rateOk(req, ctx))) { send({ type: 'error', error: 'rate', limit: PER_IP_HOUR + ' X-rays an hour per visitor' }); return; }
      const res = await runXray(inp, { env, ctx, req, lang }, send);
      // a run where a check timed out tells the visitor to run it again in a few minutes: keep that answer for 1 minute only, not 10
      const ttl = (res.cards || []).some(c => c && c.status === 'error') ? 60 : 600;
      ctx.waitUntil(caches.default.put(INKEY(ik), new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + ttl } })).catch(() => {}));
    } catch (e) { send({ type: 'error', error: 'server', detail: clip(String(e && e.message || e), 160) }); }
    finally { try { await w.close(); } catch (e) {} }
  })();
  ctx.waitUntil(job);
  return new Response(readable, { headers: Object.assign({ 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no', 'x-content-type-options': 'nosniff' }, CORS) });
}
async function v1(req, u, env, ctx) {
  let b = {}; if (req.method === 'POST') { try { b = await req.json(); } catch (e) { return out({ error: 'bad_request', docs: ORIGIN + '/api/v1/xray/openapi.json' }, 400); } } else { b = { url: u.searchParams.get('url'), q: u.searchParams.get('q'), desk: u.searchParams.get('desk') }; }
  const inp = parseInput(b.url || b.q || '');
  if (!inp) return out({ error: 'empty', need: 'url or q (a project website, or a project or developer name, 3 to 500 characters)', docs: ORIGIN + '/api/v1/xray/openapi.json' }, 400);
  if (inp.kind === 'bad') return out({ error: 'url', note: 'Only public http(s) websites can be read.' }, 400);
  const key = req.headers.get('x-api-key') || '', lang = LANGS.includes(b.lang) ? b.lang : 'en';
  let desk = false, partner = null;
  if (key) { let a; try { a = await rpc('kolaboro_api_use', { p_key: key, p_endpoint: 'POST /api/v1/xray' }); } catch (e) { return out({ error: 'db' }, 503); }
    if (!a || a.error) return out({ error: (a && a.error) || 'invalid_key' }, a && a.error === 'quota' ? 429 : 401);
    partner = a; desk = (b.desk === true || b.desk === '1' || b.desk === 'true') && !!inp.url && !String(key).startsWith('kb_sandbox'); }
  else if (b.desk) return out({ error: 'key_required', note: 'The AI desk review is only available with a partner key (x-api-key). Without a key the X-ray runs the register and free checks.', keys: ORIGIN + '/api-keys/' }, 401);
  if (!partner && !(await rateOk(req, ctx))) return out({ error: 'rate', limit: PER_IP_HOUR + ' X-rays an hour per visitor; partner keys have their own quota' }, 429);
  const res = await runXray(inp, { env, ctx, req, lang, desk }, () => {});
  return out(res, 200);
}
function openapi() {
  const card = { type: 'object', required: ['id', 'title', 'status'], properties: { id: { type: 'string' }, title: { type: 'string' }, status: { enum: ['ok', 'found', 'not_found', 'not_published', 'unavailable', 'needs_key', 'skipped', 'error'] }, summary: { type: 'string' }, facts: { type: 'array', items: { type: 'object', properties: { k: { type: 'string' }, v: { type: 'string' }, q: { type: 'string', description: 'literal sentence from the page' }, src: { type: 'string', format: 'uri' } } } }, links: { type: 'array' }, gaps: { type: 'array', items: { type: 'string' } }, sources: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, url: { type: 'string' }, status: { type: 'integer' }, bytes: { type: 'integer' }, sha256: { type: 'string' }, ms: { type: 'integer' } } } }, ms: { type: 'integer' }, where: { type: 'string' }, sha256: { type: 'string' } } };
  const result = { type: 'object', properties: { version: { type: 'string' }, root: { type: 'string', pattern: '^[0-9a-f]{64}$' }, url: { type: 'string', format: 'uri' }, meta: { type: 'object' }, cards: { type: 'array', items: { $ref: '#/components/schemas/XrayCard' } }, proof: { type: 'object' }, disclaimer: { type: 'string' } } };
  return { openapi: '3.1.0', info: { title: 'Kolaboro Project X-ray API', version: '2026-11-07', description: 'Everything that can be known for free about an off-plan property project from its website or name: our database match, what the page says (literal quotes), Internet Archive history, domain RDAP, certificate transparency, hosting network, official registers and fixed-rule statements to check. No AI is called unless a partner key asks for the desk review. Every result is sealed by a SHA-256 root and can be fetched again at /x/{root}.json or as a W3C verifiable credential at /x/{root}/vc.', license: { name: 'CC BY 4.0', identifier: 'CC-BY-4.0' } },
    servers: [{ url: ORIGIN }], components: { securitySchemes: { apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key', description: 'Optional. Free key from ' + ORIGIN + '/api-keys/. Needed only for desk: true.' } }, schemas: { XrayCard: card, XrayResult: result } },
    paths: {
      '/api/v1/xray': { post: { summary: 'Run a Project X-ray', security: [{}, { apiKey: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string', description: 'project or developer website' }, q: { type: 'string', description: 'project or developer name' }, desk: { type: 'boolean', description: 'also run the AI desk review (partner key required)' }, lang: { enum: LANGS } } }, examples: { url: { value: { url: 'https://www.teus-group.com/amani-melasti' } }, name: { value: { q: 'Amani Melasti' } } } } } }, responses: { 200: { description: 'X-ray result', content: { 'application/json': { schema: { $ref: '#/components/schemas/XrayResult' } } } }, 400: { description: 'empty or invalid input' }, 401: { description: 'desk requested without a valid key' }, 429: { description: 'hourly limit' } } } },
      '/api/kb/xray': { get: { summary: 'Run a Project X-ray as a Server-Sent Events stream (used by /check/)', parameters: [{ name: 'u', in: 'query', required: true, schema: { type: 'string' } }, { name: 'lang', in: 'query', schema: { enum: LANGS } }], responses: { 200: { description: 'text/event-stream: {type:"plan"}, one {type:"card", card} per check as it finishes, then {type:"done", root, url, proof}', content: { 'text/event-stream': { schema: { type: 'string' } } } } } } },
      '/x/{root}.json': { get: { summary: 'A sealed X-ray again', parameters: [{ name: 'root', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-f]{64}$' } }], responses: { 200: { description: 'the stored result', content: { 'application/json': { schema: { $ref: '#/components/schemas/XrayResult' } } } }, 404: { description: 'not stored here' } } } },
      '/x/{root}/vc': { get: { summary: 'The sealed X-ray as a W3C Verifiable Credential (Data Integrity, eddsa-jcs-2022, issuer did:web:kolaboro.com)', parameters: [{ name: 'root', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'application/vc+ld+json' } } } },
      '/api/kb/xray/stats': { get: { summary: 'Real number of sealed X-rays for a domain', parameters: [{ name: 'd', in: 'query', required: true, schema: { type: 'string' } }], responses: { 200: { description: '{domain, xrays}' } } } }
    } };
}
async function vc(root, env) {
  const d = await load(root, env); if (!d) return out({ error: 'not_found' }, 404);
  const { issue } = await import('./kbx_acct.js');
  const at = String(d.proof && d.proof.finished_at || d.meta.started_at).replace(/\.\d+Z$/, 'Z');
  const doc = { '@context': ['https://www.w3.org/ns/credentials/v2'], id: ORIGIN + '/x/' + root + '/vc', type: ['VerifiableCredential', 'KolaboroProjectXray'], name: 'Kolaboro Project X-ray', description: 'What free public sources and the project page said at the time of the X-ray, sealed by a SHA-256 root. Not a verdict on any project or company.',
    issuer: { id: 'did:web:kolaboro.com', name: 'Kolaboro' }, validFrom: at,
    credentialSubject: { id: d.url, type: 'ProjectXray', rootSha256: root, input: d.meta.input, cards: d.cards.map(c => ({ id: c.id, status: c.status, sha256: c.sha256, sources: (c.sources || []).map(s => ({ url: s.url, sha256: s.sha256 || null })) })), sealLines: d.proof.seal.lines, disclaimer: d.disclaimer } };
  const v = await issue(env, doc, at); if (!v) return out({ error: 'signing_unavailable' }, 503);
  return out(v, 200, { 'content-type': 'application/vc+ld+json; charset=utf-8', 'cache-control': 'public, max-age=3600', 'content-disposition': 'inline; filename="kolaboro-xray-' + root.slice(0, 12) + '.vc.json"' });
}
const escH = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// n21d (batch 21): the sealed page's own words in 8 languages. The sealed data (cards, hashes, root) is embedded unchanged, so the
// seal and the in-browser verification are the same in every language. Language: ?lang=xx, else the language the X-ray was run in.
const XP = {
  en: { check: 'Check a project', xray: 'X-ray', title: 'Project X-ray: {n}', title_nf: 'Project X-ray not found', h1: 'X-ray of {n}', h1_nf: 'This X-ray is not stored here', lead: 'What free public sources said about this project on {d} at {t} UTC. Every fact links to its source. The copy is sealed, so any change would show.', fp: 'Fingerprint (SHA-256)', again: 'Run it again today', lead_nf: 'Sealed X-rays are kept in our edge cache and database. This one is not there, or the link is incomplete.', fresh: 'Run a new X-ray', desc: 'A sealed Kolaboro Project X-ray: what free public sources and the project page said, each item with its source and SHA-256.' },
  es: { check: 'Comprueba un proyecto', xray: 'Radiografía', title: 'Radiografía del proyecto: {n}', title_nf: 'Radiografía no encontrada', h1: 'Radiografía de {n}', h1_nf: 'Esta radiografía no está guardada aquí', lead: 'Lo que decían las fuentes públicas gratuitas sobre este proyecto el {d} a las {t} UTC. Cada dato enlaza a su fuente. La copia está sellada, así que cualquier cambio se notaría.', fp: 'Huella (SHA-256)', again: 'Repetirla hoy', lead_nf: 'Las radiografías selladas se guardan en nuestra caché y en nuestra base de datos. Esta no está, o el enlace está incompleto.', fresh: 'Hacer una radiografía nueva', desc: 'Una radiografía de proyecto de Kolaboro sellada: lo que decían las fuentes públicas gratuitas y la página del proyecto, cada dato con su fuente y su SHA-256.' },
  de: { check: 'Projekt prüfen', xray: 'Röntgen', title: 'Projekt-Röntgen: {n}', title_nf: 'Projekt-Röntgen nicht gefunden', h1: 'Röntgen von {n}', h1_nf: 'Dieses Röntgen ist hier nicht gespeichert', lead: 'Was kostenlose öffentliche Quellen am {d} um {t} UTC über dieses Projekt sagten. Jede Angabe verweist auf ihre Quelle. Die Kopie ist versiegelt, jede Änderung würde auffallen.', fp: 'Fingerabdruck (SHA-256)', again: 'Heute erneut ausführen', lead_nf: 'Versiegelte Röntgen liegen in unserem Cache und in unserer Datenbank. Dieses ist nicht dabei, oder der Link ist unvollständig.', fresh: 'Neues Röntgen starten', desc: 'Ein versiegeltes Kolaboro-Projekt-Röntgen: was kostenlose öffentliche Quellen und die Projektseite sagten, jede Angabe mit Quelle und SHA-256.' },
  fr: { check: 'Vérifier un projet', xray: 'Radiographie', title: 'Radiographie du projet : {n}', title_nf: 'Radiographie introuvable', h1: 'Radiographie de {n}', h1_nf: 'Cette radiographie n’est pas conservée ici', lead: 'Ce que disaient les sources publiques gratuites sur ce projet le {d} à {t} UTC. Chaque fait renvoie à sa source. La copie est scellée : tout changement se verrait.', fp: 'Empreinte (SHA-256)', again: 'La relancer aujourd’hui', lead_nf: 'Les radiographies scellées sont conservées dans notre cache et notre base de données. Celle-ci n’y est pas, ou le lien est incomplet.', fresh: 'Lancer une nouvelle radiographie', desc: 'Une radiographie de projet Kolaboro scellée : ce que disaient les sources publiques gratuites et la page du projet, chaque élément avec sa source et son SHA-256.' },
  nl: { check: 'Check een project', xray: 'Röntgen', title: 'Projectröntgen: {n}', title_nf: 'Projectröntgen niet gevonden', h1: 'Röntgen van {n}', h1_nf: 'Deze röntgen is hier niet opgeslagen', lead: 'Wat gratis openbare bronnen over dit project zeiden op {d} om {t} UTC. Elk feit verwijst naar zijn bron. De kopie is verzegeld, dus elke wijziging zou opvallen.', fp: 'Vingerafdruk (SHA-256)', again: 'Vandaag opnieuw uitvoeren', lead_nf: 'Verzegelde röntgens staan in onze cache en database. Deze staat er niet, of de link is onvolledig.', fresh: 'Nieuwe röntgen starten', desc: 'Een verzegelde Kolaboro-projectröntgen: wat gratis openbare bronnen en de projectpagina zeiden, elk onderdeel met bron en SHA-256.' },
  ru: { check: 'Проверить проект', xray: 'Рентген', title: 'Рентген проекта: {n}', title_nf: 'Рентген проекта не найден', h1: 'Рентген: {n}', h1_nf: 'Этот рентген здесь не хранится', lead: 'Что говорили бесплатные открытые источники об этом проекте {d} в {t} UTC. Каждый факт ведёт к своему источнику. Копия запечатана, поэтому любое изменение будет заметно.', fp: 'Отпечаток (SHA-256)', again: 'Запустить снова сегодня', lead_nf: 'Запечатанные рентгены хранятся в нашем кэше и базе данных. Этого там нет, или ссылка неполная.', fresh: 'Запустить новый рентген', desc: 'Запечатанный рентген проекта Kolaboro: что говорили бесплатные открытые источники и страница проекта, каждый пункт с источником и SHA-256.' },
  zh: { check: '核查项目', xray: 'X 光', title: '项目 X 光：{n}', title_nf: '未找到该项目 X 光', h1: '{n} 的 X 光', h1_nf: '这份 X 光未保存在这里', lead: '免费公开来源在 {d} {t} UTC 对该项目的说法。每条事实都链接到来源。副本已封存，任何改动都会显现。', fp: '指纹（SHA-256）', again: '今天重新运行', lead_nf: '封存的 X 光保存在我们的缓存和数据库中。这一份不在其中，或链接不完整。', fresh: '运行新的 X 光', desc: '一份封存的 Kolaboro 项目 X 光：免费公开来源和项目页面的说法，每一项都附来源和 SHA-256。' },
  ar: { check: 'افحص مشروعًا', xray: 'أشعة', title: 'أشعة المشروع: {n}', title_nf: 'لم يُعثر على أشعة المشروع', h1: 'أشعة {n}', h1_nf: 'هذه الأشعة غير محفوظة هنا', lead: 'ما قالته المصادر العامة المجانية عن هذا المشروع في {d} الساعة {t} UTC. كل معلومة مرتبطة بمصدرها. النسخة مختومة، فأي تغيير سيظهر.', fp: 'البصمة (SHA-256)', again: 'شغّلها مجددًا اليوم', lead_nf: 'تُحفظ الأشعة المختومة في ذاكرتنا المؤقتة وقاعدة بياناتنا. هذه غير موجودة، أو الرابط ناقص.', fresh: 'شغّل أشعة جديدة', desc: 'أشعة مشروع مختومة من Kolaboro: ما قالته المصادر العامة المجانية وصفحة المشروع، كل بند مع مصدره وبصمة SHA-256.' },
};
async function page(root, env, ctx, shell, qlang) {
  const d = await load(root, env);
  const lang = LANGS.includes(qlang) ? qlang : d && LANGS.includes(d.lang || (d.meta || {}).lang) ? (d.lang || d.meta.lang) : 'en';
  const X = (k, v) => { const s = (XP[lang] && XP[lang][k]) || XP.en[k]; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; }, pl = lang === 'en' ? '' : '/' + lang;
  let base = await shell(pl + '/about/');   // a plain page shell (header, footer, styles) in the page's language; /check/ has inline scripts that need its form
  if (pl && (!base || base.status !== 200)) base = await shell('/about/');
  const name = d ? ((d.cards.find(c => c.id === 'match') || {}).project || {}).name || (d.meta.input.url ? d.meta.input.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : d.meta.input.q) : null;
  const title = (d ? X('title', { n: clip(name, 60) }) : X('title_nf')) + ' | Kolaboro';
  const noJs = d ? '<noscript><ol>' + d.cards.map(c => '<li><b>' + escH(c.title) + '</b>: ' + escH(c.summary || c.status) + '<ul>' + (c.facts || []).map(f => '<li>' + escH(f.k) + ': ' + escH(f.v) + (f.q ? ' "' + escH(f.q) + '"' : '') + (f.src ? ' (' + escH(f.src) + ')' : '') + '</li>').join('') + '</ul></li>').join('') + '</ol></noscript>' : '';
  const ltr = t => '<bdi dir="ltr">' + escH(t) + '</bdi>';
  const main = '<section class="phero tight"><div class="wrap"><p class="crumb"><a href="' + pl + '/">Kolaboro</a> / <a href="' + pl + '/check/">' + escH(X('check')) + '</a> / ' + escH(X('xray')) + '</p><h1 class="xr-h1">' + (d ? escH(X('h1', { n: '\u0001' })).replace('\u0001', '<bdi>' + escH(clip(name, 80)) + '</bdi>') : escH(X('h1_nf'))) + '</h1>' +
    (d ? '<p class="lead">' + escH(X('lead', { d: '\u0001', t: '\u0002' })).replace('\u0001', ltr(String(d.meta.started_at).slice(0, 10))).replace('\u0002', ltr(String(d.meta.started_at).slice(11, 16))) + '</p><p class="xr-fp">' + escH(X('fp')) + '<code dir="ltr">' + root + '</code></p><p class="xr-hcta"><a class="btn btn-line btn-sm" href="' + pl + '/check/' + (d.meta.input.url ? '?url=' + encodeURIComponent(d.meta.input.url) : '') + '">' + escH(X('again')) + '</a></p>' : '<p class="lead">' + escH(X('lead_nf')) + '</p><p><a class="btn btn-hi" href="' + pl + '/check/">' + escH(X('fresh')) + '</a></p>') + '</div></section>' +
    '<style>.xr-h1{font-size:clamp(1.9rem,5vw,3.2rem);line-height:1.05;overflow-wrap:anywhere;max-width:22ch}.xr-fp{font-size:.82rem;color:var(--muted);margin:10px 0 0;overflow-wrap:anywhere}.xr-fp code{font:600 .8rem ui-monospace,Menlo,monospace;color:var(--ink-2);margin-inline-start:6px}.xr-hcta{margin:14px 0 0}#analyze.sec{padding-top:8px}</style>' +
    '<section class="sec" id="analyze"><div class="wrap"><div id="xr-sealed" data-root="' + root + '"></div>' + noJs + '</div></section>' +
    '<script src="/k/xray.js?v=' + XV + '" defer></script><script src="/k/xray-cta.js?v=n20f1" defer></script>' + (d ? '<script type="application/json" id="xr-data">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script>' : '');
  const r = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', X('desc')); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', title); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', X('desc')); } })
    .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', ORIGIN + '/x/' + root + '/'); } })
    .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', ORIGIN + '/x/' + root + '/'); } })
    .on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) { e.setAttribute('href', '/x/' + root + '/?lang=' + l); if (l === lang) e.setAttribute('aria-current', 'page'); else e.removeAttribute('aria-current'); } } })
    .on('head', { element(e) { e.append('<meta name="robots" content="noindex, follow">', { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
    .on('script[src^="/k/cycle.js"]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .transform(base);
  const h = new Headers(r.headers); h.set('x-robots-tag', 'noindex, follow'); h.set('content-language', lang);
  return new Response(r.body, { status: d ? 200 : 404, headers: h });
}
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: Object.assign({ 'access-control-max-age': '86400' }, CORS) });
  if (p === '/api/v1/xray/openapi.json') return out(openapi(), 200, { 'cache-control': 'public, max-age=3600' });
  if (/^\/api\/v1\/xray\/?$/.test(p)) return (req.method === 'POST' || req.method === 'GET') ? v1(req, u, env, ctx) : out({ error: 'method' }, 405);
  if (/^\/api\/kb\/xray\/stats\/?$/.test(p)) {
    const dm = String(u.searchParams.get('d') || '').toLowerCase().replace(/^www\./, '').slice(0, 200);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(dm)) return out({ error: 'domain' }, 400);
    try { const s = await rpc('kolaboro_xray_stats', { p_domain: dm }); return out({ domain: dm, xrays: s ? s.xrays : 0, last: s ? s.last : null, counting: true, source: 'kolaboro_xrays, one row per sealed X-ray' }, 200, { 'cache-control': 'public, max-age=60' }); }
    catch (e) { return out({ domain: dm, xrays: null, counting: false, note: 'The durable X-ray store is not set up yet, so no count is published.' }, 200, { 'cache-control': 'public, max-age=60' }); }
  }
  if (/^\/api\/kb\/xray\/?$/.test(p)) {
    if (req.method !== 'GET' && req.method !== 'POST') return out({ error: 'method' }, 405);
    let raw = u.searchParams.get('u') || '', lang = u.searchParams.get('lang') || 'en';
    if (req.method === 'POST') { try { const b = await req.json(); raw = b.u || b.url || b.q || raw; lang = b.lang || lang; } catch (e) {} }
    const inp = parseInput(raw);
    if (!inp) return out({ error: 'empty' }, 400);
    if (inp.kind === 'bad') return out({ error: 'url' }, 400);
    return sse(req, env, ctx, inp, LANGS.includes(lang) ? lang : 'en');
  }
  let m = p.match(/^\/x\/([0-9a-f]{64})(\/|\.json|\/vc)?$/);
  if (m) {
    if (m[2] === '.json') { const d = await load(m[1], env); return d ? out(d, 200, { 'cache-control': 'public, max-age=300' }) : out({ error: 'not_found' }, 404); }
    if (m[2] === '/vc') return vc(m[1], env);
    if (!m[2]) return new Response(null, { status: 301, headers: { location: '/x/' + m[1] + '/' } });
    return page(m[1], env, ctx, shell, u.searchParams.get('lang'));
  }
  return null;
}
// exported for the local tests
export { parseInput, identityFacts, flagFacts, regDomain, findMatch, jcs };
