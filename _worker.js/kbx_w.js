// Feature module w for kolaboro.com (see kbx.js): registers: global company graph (GLEIF), insolvency watch, agent licence check.
// Owned by block W (batch 4, 4 Nov 2026). Endpoints live under /api/x/w/.
//   GET /api/x/w/                          index
//   GET /api/x/w/graph-global              GLEIF company graph: coverage, method, per-market shares (from /data/company-graph-global.json)
//   GET /api/x/w/graph-global/{ID}         one project's anonymised LEI summary
//   GET /api/x/w/insolvency/watch          daily insolvency watch: anonymised counts per market and project (from /data/insolvency-watch.json)
//   GET /api/x/w/insolvency/watch/{ID}     one project's watch result
//   GET /api/x/w/insolvency?name=X         live lookup of one company name, typed by a buyer: The Gazette (UK, live) and the
//                                          BORME insolvency index (Spain, hashed, refreshed daily). Legal form required, so names
//                                          of people are never searched. 20 lookups an hour per IP, results cached for a day.
//   GET /api/x/w/agent/sources             which official agent and broker registers work from our servers right now
//   GET /api/x/w/agent?market=dubai&brn=N  or &office=NAME: Dubai Land Department broker or office lookup, when a source is reachable
// The data files are written by batch jobs on main (tools/kolaboro-w/) from the private research records; this module only reads them.
import * as KB from './kolaboro.js';
const { sha } = KB;
export const PATHS = /^\/api\/x\/w(\/|$)/;

const UA = 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/tools/insolvency-check/)';
const GZ = 'https://www.thegazette.co.uk';
const MEMO = {};
async function load(env, name, ttl = 120000) {
  const m = MEMO[name];
  if (m && Date.now() - m.t < ttl) return m.v;
  let v = null;
  try {
    let r = null;
    if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/data/' + name));
    if (!r || !r.ok) r = await fetch('https://kolaboro.com/data/' + name, { cf: { cacheTtl: 600, cacheEverything: true } });
    if (r.ok) v = await r.json();
  } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v };
  return v;
}
function out(o, s = 200, maxAge = 300) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store', 'access-control-allow-origin': '*' } });
}
const STARTING = name => ({ status: 'starting', note: 'The batch job has not published ' + name + ' yet. This page fills in after its first run.' });
const unx = s => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');

async function rateOk(req, ctx, bucket, limit) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const k = new Request('https://kolaboro.com/__w_rl/' + bucket + '/' + encodeURIComponent(ip) + '/' + hour);
  const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
  if (n >= limit) return false;
  ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  return true;
}
async function cached(key, fn, ttl, ctx) {
  const ck = new Request('https://kolaboro.com/__w_cache/' + key);
  const hit = await caches.default.match(ck);
  if (hit) { const d = await hit.json(); d.cached = true; return d; }
  const d = await fn();
  if (d && !d.error) ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=' + ttl } })));
  return d;
}

// ---- company names: same normalisation as tools/kolaboro-w/wcommon.py (kept in step by hand; tested in the batch job's README)
const FORMS = ['LIMITED', 'LTD', 'LLC', 'L L C', 'LLP', 'PLC', 'PJSC', 'P J S C', 'PSC', 'JSC', 'SAOG', 'SAOC', 'QPSC', 'QSC', 'INC', 'INCORPORATED', 'CORP', 'CORPORATION',
  'CO', 'COMPANY', 'SA', 'S A', 'SL', 'S L', 'SLU', 'S L U', 'SAU', 'SAS', 'SARL', 'SRL', 'SPA', 'S P A', 'GMBH', 'AG', 'BV', 'NV', 'AS', 'AB', 'OY', 'KFT',
  'DOO', 'D O O', 'EOOD', 'OOD', 'AD', 'EAD', 'AE', 'IKE', 'EPE', 'LDA', 'UNIPESSOAL', 'UNIPERSONAL', 'SLP', 'SLL', 'SOCIEDAD LIMITADA', 'SOCIEDAD ANONIMA', 'SA DE CV', 'S A DE C V',
  'S DE RL DE CV', 'S DE R L DE C V', 'SAPI DE CV', 'S A P I DE C V', 'SDN BHD', 'SDN', 'BHD', 'BERHAD', 'PTE', 'PTY', 'PTE LTD', 'PTY LTD', 'TBK', 'PCL',
  'PUBLIC COMPANY', 'JOINT STOCK COMPANY', 'ANONIM SIRKETI', 'A S', 'LTD STI', 'LIMITED SIRKETI', 'FZE', 'FZCO', 'FZ LLC', 'FZ', 'DMCC',
  'HOLDING COMPANY', 'KK', 'KABUSHIKI KAISHA', 'CO LTD', 'COMPANY LIMITED', 'PRIVATE', 'PVT', 'SE', 'SPRL', 'CV', 'DE CV', 'L P', 'LP', 'PC', 'P C'];
const FORM_RE = new RegExp('(?:\\s(?:' + [...new Set(FORMS)].sort((a, b) => b.length - a.length).map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + '))+$');
export function norm(s) {
  let t = String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/&/g, ' AND ').replace(/'/g, '');
  t = ' ' + t.replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/^ (?:PT|THE|CV) /, ' ');
  let prev = null;
  while (prev !== t) { prev = t; t = t.replace(FORM_RE, ''); }
  return t.trim();
}
// a legal form must be part of the typed name, so the lookup can never run on a private person's name
const FORM_TYPED = /(\b(limited|ltd\.?|plc|llp|llc|l\.l\.c\.|inc\.?|corp\.?|corporation|gmbh|s\.?a\.?u?|s\.?l\.?u?|sociedad limitada( unipersonal)?|sociedad an[oó]nima( unipersonal)?|b\.?v\.?|pty\.? ltd\.?|sdn\.? bhd\.?|co\.?,? ltd\.?|company limited|pcl|pjsc|fze|fzco|fz-llc|dmcc|lda)\.?\s*$)|^pt\.?\s+\S/i;
export function validName(raw) {
  const s = String(raw || '').replace(/\s+/g, ' ').trim();
  if (s.length < 5 || s.length > 140) return null;
  if (!FORM_TYPED.test(s)) return null;
  if (!norm(s)) return null;
  return s;
}

// ---- insolvency lookup
async function gazetteLookup(name) {
  const want = norm(name);
  const url = GZ + '/insolvency/notice/data.feed?text=' + encodeURIComponent('"' + name.replace(/"/g, '') + '"') + '&results-page-size=100';
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/atom+xml' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error('The Gazette answered HTTP ' + r.status);
  const x = await r.text(), notices = [];
  let personal = 0, other = 0;
  for (const m of x.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const code = (e.match(/<f:notice-code>(\d+)<\/f:notice-code>/) || [])[1] || '';
    if (!code.startsWith('24')) { if (code.startsWith('25')) personal++; continue; }   // corporate insolvency only
    const title = unx((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
    const body = unx(((e.match(/<content[^>]*>([\s\S]*?)<\/content>/) || [])[1] || '').replace(/<[^>]+>/g, ''));
    const cat = unx((e.match(/<category term="([^"]+)"/) || [])[1] || '');
    const nm = body.match(/Name of Company:\s*([^.…]+?(?:LIMITED|LTD|PLC|LLP))/i);
    const exact = norm(title) === want || (nm && norm(nm[1]) === want) || norm(body.split('…')[0]) === want;
    if (!exact) { other++; continue; }
    const link = (e.match(/<link href="(https:\/\/www\.thegazette\.co\.uk\/notice\/[^"/]+)"\/>/) || [])[1] || null;
    notices.push({ date: ((e.match(/<published>([^<]{10})/) || [])[1] || ''), type: cat || title, notice_code: code, url: link });
  }
  return {
    source: 'The Gazette (UK), corporate insolvency notices', searched: url.replace(/&results-page-size=100$/, ''),
    notices: notices.slice(0, 50), exact_notices: notices.length, other_corporate_notices_mentioning_the_words: other,
    more_results: /rel="next"/.test(x), licence: 'Contains public sector information licensed under the Open Government Licence v3.0.',
    search_page: GZ + '/insolvency/notice?text=' + encodeURIComponent('"' + name + '"')
  };
}
async function hkey(base) { return (await sha('kolaboro-w|' + base)).slice(0, 16); }
async function bormeLookup(env, name) {
  const idx = await load(env, 'insolvency-es-index.json', 600000);
  if (!idx || !idx.h) return { source: 'BORME (Spain)', status: 'starting', note: 'The daily BORME index has not been published yet.' };
  const k = await hkey(norm(name)), rows = idx.h[k] || [];
  return {
    source: 'BORME (Spain), "Situacion concursal" acts in Section A', index_from: idx.from, index_to: idx.to, days_indexed: (idx.days || []).length,
    acts: rows.map(r => ({ borme_date: r[0], borme_id: r[1], procedure: r[2], resolution_date: r[3], act: r[4], final: r[5], legal_form: r[6] || null,
      url: /^BORME-A-\d{4}-\d+-\d+$/.test(r[1]) ? 'https://www.boe.es/diario_borme/txt.php?id=' + r[1] : null })),
    licence: 'Source: Agencia Estatal Boletin Oficial del Estado (boe.es). Free reuse with attribution.',
    by_hand: 'https://www.publicidadconcursal.es/consulta-publicidad-concursal-new'
  };
}
async function insolvency(req, u, env, ctx) {
  const name = validName(u.searchParams.get('name'));
  if (!name) return out({ error: 'enter the full legal name of a company, including its legal form (for example Limited, Ltd, PLC, LLP, S.L., S.A., Sociedad Limitada). Names of people are not searched.' }, 400, 0);
  const base = norm(name);
  const ck = 'ins/v1/' + encodeURIComponent(base);
  const hit = await caches.default.match(new Request('https://kolaboro.com/__w_cache/' + ck));
  if (!hit && !(await rateOk(req, ctx, 'ins', 20))) return out({ error: 'rate limit: 20 lookups an hour from one address' }, 429, 0);
  const d = await cached(ck, async () => {
    const [uk, es] = await Promise.all([
      gazetteLookup(name).catch(e => ({ source: 'The Gazette (UK)', error: 'did not answer', detail: String(e && e.message || e).slice(0, 120) })),
      bormeLookup(env, name).catch(e => ({ source: 'BORME (Spain)', error: 'index not readable' }))]);
    return { query: name, normalised: base, fetched_at: new Date().toISOString(), uk, es,
      rule: 'Only notices for exactly this company name are listed, apart from capitals, accents, punctuation and the legal form. Check it is the same company (registration number, address): a name can be reused after a company is dissolved.',
      not_covered: 'Other countries are not searched. See the list of official registers on kolaboro.com/tools/insolvency-check/.' };
  }, 86400, ctx);
  if (d.uk && d.uk.error) d.partial = true;
  return out(d, 200, 0);
}

// ---- agent and broker registers
const AGENT_SOURCES = [
  { id: 'ae-dubai-pulse', market: 'Dubai (UAE)', name: 'Dubai Pulse open data: DLD real estate brokers and offices', url: 'https://www.dubaipulse.gov.ae/organisation/dld/service/dld-registration',
    probe: 'https://www.dubaipulse.gov.ae/data/dld-registration/dld_brokers-open', terms: 'Dubai Data open licence. Official machine-readable source.' },
  { id: 'ae-dld-site', market: 'Dubai (UAE)', name: 'Dubai Land Department open data page, Brokers tab', url: 'https://dubailand.gov.ae/en/open-data/real-estate-data/#broker',
    probe: 'https://dubailand.gov.ae/en/open-data/real-estate-data/', terms: 'Searchable by a person in a browser. The search is protected by a reCAPTCHA, so we do not query it automatically.' },
  { id: 'ph-prc', market: 'Philippines', name: 'PRC online verification of licence (real estate brokers are PRC licensees)', url: 'https://verification.prc.gov.ph/',
    probe: 'https://verification.prc.gov.ph/', terms: 'Needs the licence number and birth date, behind a reCAPTCHA. Check by hand.' },
  { id: 'in-maharera', market: 'India (Maharashtra)', name: 'MahaRERA registered agents search', url: 'https://maharera.maharashtra.gov.in/',
    probe: 'https://maharera.maharashtra.gov.in/', terms: 'Public search for a person in a browser. Did not answer our cloud servers in tests.' },
  { id: 'in-karnataka', market: 'India (Karnataka)', name: 'RERA Karnataka registered agents', url: 'https://rera.karnataka.gov.in/',
    probe: 'https://rera.karnataka.gov.in/', terms: 'Public search for a person in a browser. Did not answer our cloud servers in tests.' }
];
async function probe(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; KolaboroProbe/1.0; +https://kolaboro.com/tools/agent-check/)' }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
    const t = (await r.text()).slice(0, 200000);
    const links = [...new Set([...t.matchAll(/href="([^"]*(?:\.csv|download|resource)[^"]*)"/gi)].map(m => m[1]))].slice(0, 20);
    return { http: r.status, status: r.ok && !/access denied|just a moment|captcha required/i.test(t.slice(0, 4000)) ? 'reachable' : 'blocked from our servers', links };
  } catch (e) { return { status: 'did not answer', detail: String(e && e.message || e).slice(0, 80) }; }
}
async function agentSources(env, ctx, fresh) {
  const ck = new Request('https://kolaboro.com/__w_agent_sources/v1');
  if (!fresh) { const c = await caches.default.match(ck); if (c) return out(await c.json(), 200, 600); }
  const res = await Promise.all(AGENT_SOURCES.map(async s => {
    const p = await probe(s.probe);
    const o = { id: s.id, market: s.market, name: s.name, url: s.url, terms: s.terms, status: p.status, http: p.http || null, probed_at: new Date().toISOString() };
    if (s.id === 'ae-dubai-pulse') o.download_links = p.links;
    return o;
  }));
  const d = { sources: res, note: 'Probed from Cloudflare (where this API runs). A source that is blocked or captcha-protected is listed for a check by hand, never estimated.' };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=21600' } })));
  return out(d, 200, 600);
}
async function agent(req, u, env, ctx) {
  const brn = (u.searchParams.get('brn') || '').replace(/\D/g, '').slice(0, 10);
  const office = (u.searchParams.get('office') || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!brn && office.length < 3) return out({ error: 'enter a broker registration number (BRN, digits) or at least 3 letters of an office name' }, 400, 0);
  const reg = await load(env, 'agent-registers.json', 600000);
  const ds = reg && reg.dubai && reg.dubai.status === 'live' ? reg.dubai : null;
  if (!ds) return out({ query: brn ? { brn } : { office }, status: 'not connected',
    note: 'No official Dubai broker dataset is reachable from our servers without getting past a captcha. Check by hand on the Dubai Land Department page linked below; it shows the same register.',
    by_hand: [{ name: 'Dubai Land Department open data, Brokers tab', url: 'https://dubailand.gov.ae/en/open-data/real-estate-data/#broker' },
      { name: 'Dubai REST app (DLD), broker check by BRN or QR code on the broker card', url: 'https://dubailand.gov.ae/en/eservices/dubai-rest/' }] }, 200, 0);
  return out({ status: 'not connected' }, 200, 0);
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 0);
  const p = u.pathname.replace(/\/+$/, '');
  try {
    if (p === '/api/x/w') return out({ module: 'registers: global company graph, insolvency watch, agent licence check',
      endpoints: ['/api/x/w/graph-global', '/api/x/w/graph-global/{ID}', '/api/x/w/insolvency/watch', '/api/x/w/insolvency/watch/{ID}', '/api/x/w/insolvency?name={exact company name with legal form}', '/api/x/w/agent/sources', '/api/x/w/agent?brn={BRN}'],
      pages: ['/graph/global/', '/tools/insolvency-check/', '/tools/agent-check/'] }, 200, 3600);
    if (p === '/api/x/w/graph-global') {
      const d = await load(env, 'company-graph-global.json'); if (!d) return out(STARTING('company-graph-global.json'), 200, 60);
      const { projects, ...rest } = d;
      return out({ ...rest, project_ids: Object.keys(projects || {}).length });
    }
    let m = p.match(/^\/api\/x\/w\/graph-global\/([A-Za-z]{2,5}-\d{3,4})$/);
    if (m) {
      const d = await load(env, 'company-graph-global.json'); if (!d) return out(STARTING('company-graph-global.json'), 200, 60);
      const id = m[1].toUpperCase(), x = (d.projects || {})[id];
      if (!x) return out({ id, error: 'unknown project id' }, 404, 300);
      return out({ id, updated: d.updated, source: d.source.name, licence: d.source.licence, ...x });
    }
    if (p === '/api/x/w/insolvency/watch') {
      const d = await load(env, 'insolvency-watch.json'); if (!d) return out(STARTING('insolvency-watch.json'), 200, 60);
      return out(d);
    }
    m = p.match(/^\/api\/x\/w\/insolvency\/watch\/([A-Za-z]{2,5}-\d{3,4})$/);
    if (m) {
      const d = await load(env, 'insolvency-watch.json'); if (!d) return out(STARTING('insolvency-watch.json'), 200, 60);
      const id = m[1].toUpperCase(), x = (d.projects || {})[id];
      if (!x) return out({ id, covered: false, note: 'The insolvency watch covers tracked projects in the United Kingdom and Spain only.' }, 404, 300);
      return out({ id, updated: d.updated, ...x });
    }
    if (p === '/api/x/w/insolvency') return insolvency(req, u, env, ctx);
    if (p === '/api/x/w/agent/sources') return agentSources(env, ctx, u.searchParams.get('fresh') === '1' && await rateOk(req, ctx, 'src', 5));
    if (p === '/api/x/w/agent') {
      if (!(await rateOk(req, ctx, 'agent', 30))) return out({ error: 'rate limit: 30 lookups an hour from one address' }, 429, 0);
      return agent(req, u, env, ctx);
    }
  } catch (e) { return out({ error: 'internal error' }, 500, 0); }
  return out({ error: 'not found', see: '/api/x/w/' }, 404, 60);
}
