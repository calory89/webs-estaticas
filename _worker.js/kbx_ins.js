// Feature module 'ins' for kolaboro.com (see kbx.js): insight: weekly market digest, market page figures, score explainer, project-scoped questions, change heatmap.
// Batch 6 (5 Nov 2026), block X6. Endpoints live under /api/x/ins/.
//   GET  /api/x/ins/status                  what is live and which data files answer
//   GET  /api/x/ins/explain?id=BALI-014     plain-English explanation of one project's score, built by code from its checks (no AI)
//   GET  /api/x/ins/evidence?id=BALI-014    the public evidence lines the question box may cite (E1, E2, ...)
//   POST /api/x/ins/ask {id, q}             a question about ONE project, answered by claude() from that project's evidence only;
//                                           every citation must name an evidence line and quote text found in it, and every number
//                                           in the answer must appear in the cited lines, else the answer is refused. Cached, per-IP limit.
//   GET  /api/x/ins/indices?market=Bali     the market page "Indices" block: delay, promises, hazards, company graph, insolvency, prices
//   GET  /api/x/ins/digest.json | /feed.xml   the weekly digest data (carried inside /digest/index.html) and its RSS feed
// The weekly digest and change heatmap page (/digest/, heatmap at /digest/#changes) is built by .github/workflows/kolaboro-digest.yml on main.
import * as KB from './kolaboro.js';
const { json, claude, openData, rateLimited, qnorm } = KB;
export const PATHS = /^\/api\/x\/ins(\/|$)/;

const SITE = 'https://kolaboro.com';
const ID_RE = /^[A-Z]{2,5}-[0-9]{3,4}$/;
const CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const CONFIRMED = ['registry', 'independent'];
const NAME = { permit: 'Permit or licence number', escrow: 'Deposit protection', progress: 'Construction progress', plans: 'Site or floor plans', record: 'Developer track record', returns_ok: 'No guaranteed returns' };
const WHAT = {
  permit: 'an official permit or sales licence number a buyer can look up',
  escrow: 'escrow, a bank guarantee or a trust account for buyer payments',
  progress: 'a percentage built or dated progress updates',
  plans: 'site or floor plans a buyer can compare with the contract',
  record: 'past projects delivered, stated in public',
  returns_ok: 'no "guaranteed" rental return language in the marketing'
};
const LVL = { registry: 'confirmed on an official register', independent: 'confirmed by an independent source (regulator notice, court record, filing or major newspaper)', developer: 'stated only by the developer, its agents or listing portals', contradicted: 'contradicted: sources disagree with the developer', none: 'no source found' };
const TIER = { clear: 'Strong public disclosure', mixed: 'Some gaps', caution: 'Check carefully' };
const METHOD = { scoring: SITE + '/open/scoring.py', how: SITE + '/how-we-score', levels: SITE + '/database', whatif: SITE + '/p/whatif.js' };

function out(o, s = 200, maxAge) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store' } });
}

// ---------- public data files, read from the deployed assets (memo per isolate, 5 minutes) ----------
const MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 300000) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) {}
  if (!v) { try { const r = await fetch(SITE + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) {} }
  MEMO[name] = { t: Date.now(), v }; return v;
}
// The weekly digest data rides inside /digest/index.html (one file, Pages file budget); served here as JSON and RSS.
let DG = { t: 0, v: null };
async function digestData(env) {
  if (DG.v && Date.now() - DG.t < 300000) return DG.v;
  let h = null;
  try { const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com/digest/index.html')); if (r.ok) h = await r.text(); } catch (e) {}
  if (!h) { try { const r = await fetch(SITE + '/digest/', { cf: { cacheTtl: 300 } }); if (r.ok) h = await r.text(); } catch (e) {} }
  const m = h && h.match(/<script[^>]*id="digest-data"[^>]*>([\s\S]*?)<\/script>/);
  let v = null; try { v = m ? JSON.parse(m[1].replace(/<\\\//g, '</')) : null; } catch (e) {}
  DG = { t: Date.now(), v }; return v;
}
const xesc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
function feed(D) {
  const items = (D.weeks || []).slice().sort((a, b) => a.id < b.id ? 1 : -1).filter(w => w.intro).map(w => {
    const link = SITE + '/digest/' + (w.id === D.latest ? '' : '#w-' + w.id);
    return '<item><title>' + xesc('Kolaboro weekly digest, week ' + (+w.id.slice(5)) + ' ' + w.id.slice(0, 4) + (w.partial ? ' (to date)' : '')) + '</title><link>' + xesc(link) + '</link><guid isPermaLink="false">kolaboro-digest-' + w.id + (w.partial ? '-' + w.to : '') + '</guid><pubDate>' + new Date(w.generated).toUTCString() + '</pubDate><description>' + xesc(w.intro.text) + '</description></item>';
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Kolaboro weekly market digest</title><link>' + SITE + '/digest/</link><atom:link href="' + SITE + '/api/x/ins/feed.xml" rel="self" type="application/rss+xml"/><description>New off-plan projects, slipped dates, moved promises, page, register and satellite changes, by market. Counted by code from the public data.</description><language>en</language>' + items + '</channel></rss>\n';
}
async function cases(env) { const d = (await file(env, 'bali-cases.json')) || (await openData()); return d; }

// ---------- the open scoring rules (open/scoring.py, ported as in p/whatif.js) ----------
const met = (ck, k) => k === 'permit' ? ck.permit === 2 : k === 'escrow' ? ck.escrow === true : k === 'progress' ? ck.progress !== null && ck.progress !== undefined : !!ck[k];
const level = t => { t = String(t == null ? 'none' : t).toLowerCase(); for (const l of ['registry', 'independent', 'developer', 'contradicted', 'none']) if (t.includes(l)) return l; return 'none'; };
const scoreOf = ck => CHECKS.reduce((a, k) => a + (met(ck || {}, k) ? 1 : 0), 0);
const vscoreOf = v => Object.keys(v || {}).filter(k => CONFIRMED.includes(level(v[k]))).length;
const tierOf = (s, flags, researched) => ((flags && flags.length) || s <= 1) ? 'caution' : s >= (researched === 3 ? 3 : 4) ? 'clear' : 'mixed';

export function explain(c) {
  const ck = c.checks || {}, V = c.verified || {}, flags = c.flags || [], researched = (ck.researched && ck.researched.length) ? ck.researched : CHECKS;
  const s = scoreOf(ck), vs = vscoreOf(V), tier = tierOf(s, flags, researched.length), mx = c.max || 6;
  const rows = CHECKS.map(k => {
    const pub = met(ck, k), lv = level(V[k]), res = researched.includes(k);
    let state, text;
    if (!res) { state = 'not_researched'; text = NAME[k] + ': not researched yet for this project, so it cannot count.'; }
    else if (pub) { state = CONFIRMED.includes(lv) ? 'published_confirmed' : lv === 'contradicted' ? 'published_contradicted' : 'published'; text = NAME[k] + ': published (' + WHAT[k] + '). Source level: ' + LVL[lv] + '.'; }
    else if (k === 'permit' && ck.permit === 1) { state = 'claimed'; text = NAME[k] + ': a permit is claimed but no number is published, so a buyer cannot look it up and it does not count.'; }
    else if (k === 'returns_ok') { state = 'missing'; text = NAME[k] + ': the marketing uses "guaranteed" return language, so this check is not met.'; }
    else { state = 'missing'; text = NAME[k] + ': not published (we look for ' + WHAT[k] + ').'; }
    return { check: k, name: NAME[k], published: pub, level: lv, researched: res, state, text };
  });
  const pubRows = rows.filter(r => r.published), miss = rows.filter(r => !r.published && r.researched);
  const unconf = pubRows.filter(r => !CONFIRMED.includes(r.level)), contra = rows.filter(r => r.level === 'contradicted');
  const raise = [];
  miss.forEach(r => {
    const s2 = s + 1, t2 = tierOf(s2, flags, researched.length);
    raise.push({ check: r.check, kind: 'publish', text: (r.check === 'returns_ok' ? 'If the "guaranteed" return language were removed' : 'If the developer published ' + WHAT[r.check]) + ': published ' + s + ' to ' + s2 + ' of ' + mx + (t2 !== tier ? ', tier "' + TIER[tier] + '" to "' + TIER[t2] + '"' : '') + '.', score: [s, s2], tier: [tier, t2] });
  });
  unconf.forEach(r => raise.push({ check: r.check, kind: 'confirm', text: 'If an official register or an independent source confirmed the ' + r.name.toLowerCase() + ': confirmed ' + vs + ' to ' + (vs + 1) + ' of 6.', vscore: [vs, vs + 1] }));
  if (flags.length) raise.push({ kind: 'flags', text: 'While ' + (flags.length === 1 ? 'a problem appears' : flags.length + ' problems appear') + ' in public reports (news, courts or regulators), the tier stays "' + TIER.caution + '" however much is published. That is the rule, by design.' });
  const summary = c.id + ' publishes ' + s + ' of the ' + mx + ' things a careful buyer needs' + (s ? ' (' + pubRows.map(r => r.name.toLowerCase()).join(', ') + ')' : '') + '. ' +
    (vs ? vs + ' of them ' + (vs === 1 ? 'is' : 'are') + ' confirmed by an official register or an independent source.' : 'None is confirmed by an official register or an independent source yet: everything published rests on the developer\'s word.') + ' ' +
    'Tier: "' + TIER[tier] + '"' + (flags.length ? ', because public reports show ' + (flags.length === 1 ? 'a problem' : flags.length + ' problems') + '.' : s <= 1 ? ', because 1 or fewer checks are published.' : s >= (researched.length === 3 ? 3 : 4) ? ', because ' + s + ' checks are published and no problem appears in public reports.' : ', because ' + s + ' checks are published (' + (researched.length === 3 ? 3 : 4) + ' are needed for "' + TIER.clear + '").');
  const cl = c.claims || {};
  return {
    id: c.id, market: c.market, country: c.country, stage: c.stage || null, checked: c.checked || null,
    score: s, vscore: vs, max: mx, tier, tier_name: TIER[tier],
    matches_published: s === (c.score || 0) && vs === (c.vscore || 0) && tier === c.tier,
    summary, checks: rows,
    published: pubRows.map(r => r.check), missing: miss.map(r => r.check), not_researched: rows.filter(r => !r.researched).map(r => r.check),
    unconfirmed: unconf.map(r => r.check), contradicted: contra.map(r => r.check),
    claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0, text: (cl.verified || cl.unverified || cl.contradicted) ? 'Developer claims tested against registers, courts and press: ' + (cl.verified || 0) + ' verified, ' + (cl.unverified || 0) + ' unverified, ' + (cl.contradicted || 0) + ' contradicted. Claims do not change the score.' : null },
    flags, raise,
    caveat: 'A high score means documents are public, not that they are genuine. Not financial or legal advice.',
    rules: 'One point per check the developer publishes (a permit counts only with a number a buyer can look up), one confirmed point per check backed by an official register or independent source. Tier "' + TIER.caution + '" with a public problem or 0 to 1 checks published, "' + TIER.clear + '" with 4 or more (3 when only 3 checks could be researched), otherwise "' + TIER.mixed + '".',
    method: METHOD, language: 'en', language_note: 'English only: the 8 language versions of the site have no translated wording for these explanation templates yet.',
    links: { project: SITE + '/p/' + encodeURIComponent(c.id) + '/', explain: SITE + '/explain/?id=' + encodeURIComponent(c.id) }
  };
}

// ---------- the evidence a project-scoped question may use ----------
function flat(prefix, v, outArr, depth) {
  if (v === null || v === undefined || v === '') return;
  if (Array.isArray(v)) { if (!v.length) return; if (v.every(x => typeof x !== 'object')) { outArr.push([prefix, v.join('; ')]); return; } v.slice(0, 12).forEach((x, i) => flat(prefix + '[' + i + ']', x, outArr, depth + 1)); return; }
  if (typeof v === 'object') { if (depth > 3) return; Object.keys(v).forEach(k => flat(prefix + '.' + k, v[k], outArr, depth + 1)); return; }
  outArr.push([prefix, String(v)]);
}
export async function evidence(env, id) {
  const d = await cases(env); const c = ((d && d.cases) || []).find(x => x.id === id);
  if (!c) return null;
  const [pr, ot, hz, rc, st, dr] = await Promise.all(['promises.json', 'on-time.json', 'hazards.json', 'register-checks.json', 'stalled-sites.json', 'promise-drift.json'].map(n => file(env, n)));
  const L = [];
  const REN = { id: 'id', market: 'market', country: 'country', region: 'region', stage: 'stage', band: 'price_band', done: 'advertised_completion_year', title: 'title_type', lease: 'lease_years', units: 'units', yield: 'advertised_yield_pct', score: 'checks_published', max: 'checks_total', vscore: 'checks_confirmed', tier: 'tier', delay: 'months_handover_date_moved', overdue: 'months_past_handover', checked: 'last_checked', flags: 'problems_in_public_reports' };
  const rec = {}; Object.keys(REN).forEach(k => { rec[REN[k]] = k === 'tier' && c.tier ? TIER[c.tier] || c.tier : c[k]; });
  flat('record', rec, L, 0);
  (c.q || []).slice(0, 8).forEach((x, i) => L.push(['record.question_to_ask[' + i + ']', String(x)]));
  const ck = c.checks || {}, rs = ck.researched && ck.researched.length ? ck.researched : CHECKS;
  const read = {}; CHECKS.forEach(k => { read[NAME[k]] = !rs.includes(k) ? 'not researched' : met(ck, k) ? (k === 'progress' && typeof ck.progress === 'number' ? 'published (' + ck.progress + '% built stated)' : 'published') : k === 'permit' && ck.permit === 1 ? 'permit claimed, no number published' : k === 'returns_ok' ? 'not met: guaranteed return language used' : 'not published'; });
  flat('record.checks', read, L, 1);
  flat('record.verified', c.verified, L, 1); flat('record.claims', c.claims, L, 1);
  flat('record.page_changes', (c.history || []).map(h => ({ date: h.d, change: h.f, from: h.from, to: h.to })), L, 1);
  if (c.sat) flat('record.satellite', c.sat, L, 1);
  if (c.register) flat('record.register', c.register, L, 1);
  const P = pr && pr.projects && pr.projects[id];
  if (P) flat('promises', P.map(p => ({ kind: (pr.kinds || {})[p.k] || p.k, promised_date: p.d, status: p.st, status_meaning: (pr.statuses || {})[p.st], times_moved: p.mv, months_moved: p.mm, last_seen: p.seen, earlier_dates: (p.hist || []).map(h => h.d).filter(x => x !== p.d) })), L, 1);
  const T = ot && ot.projects && ot.projects[id];
  if (T) flat('timeline', { status: T.s, advertised_handover: T.cur, first_handover_on_record: T.first, months_moved: T.moved, months_overdue: T.overdue, months_to_first_handover: T.to_first }, L, 1);
  const D = dr && dr.projects && dr.projects[id];
  if (D && (D.changes || []).length) flat('timeline.page_value_changes', D.changes.slice(0, 10).map(x => ({ field: x.label, from: x.from, to: x.to, first_seen: x.first_seen, reverted: x.reverted })), L, 1);
  const H = hz && hz.projects && hz.projects[id];
  if (H) flat('hazards', H, L, 1);
  const R = rc && rc.projects && rc.projects[id];
  if (R) flat('checks.register', { register: R.register, item: R.item, status: R.status, checked: R.checked }, L, 1);
  const S = st && st.projects && st.projects[id];
  if (S) flat('checks.satellite_site', { status: S.status, clear_quarters: (S.clear_quarters || []).length, change_pct_last_quarter: S.change_pct_last, no_visible_change_months: S.no_visible_change_months }, L, 1);
  const lines = L.slice(0, 160).map((x, i) => ({ e: 'E' + (i + 1), field: x[0], value: x[1].slice(0, 300) }));
  return { id, updated: d.updated, case: c, lines, sources: { record: '/data/bali-cases.json', promises: P ? '/data/promises.json' : null, timeline: T ? '/data/on-time.json' : null, hazards: H ? '/data/hazards.json' : null, register: R ? '/data/register-checks.json' : null, satellite: S ? '/data/stalled-sites.json' : null } };
}

// ---------- project-scoped question (the /ask code path: rateLimited + claude() + edge cache, narrowed to one project) ----------
const ASK1_PROMPT = `You answer a buyer's question about ONE anonymous off-plan property project, using ONLY the evidence lines below (E1, E2, ...). They are Kolaboro's public record for this project: its checks, promises, timeline, hazards and register or satellite checks.
Rules:
- If the evidence lines cannot answer the question, or it asks about anything else (other projects, the developer's name, prices you do not see, legal or financial advice, predictions), set "answerable": false and say in one sentence what the evidence does cover.
- Never guess. Never name a developer or a project. Copy numbers and dates exactly as they appear in the lines.
- Cite every fact: each citation names one evidence line and quotes the exact text of its value (or part of it).
- No dashes as punctuation. Plain English, 1 to 4 short sentences. Not financial or legal advice.
Reply with ONLY one JSON object: {"answerable": true or false, "answer": "...", "citations": [{"e": "E3", "quote": "exact text from that line's value"}]}`;
const numsIn = t => (String(t).match(/\d+(?:[.,]\d+)?/g) || []).map(n => n.replace(',', '.'));

async function ask(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return out({ error: 'not_configured' }, 503);
  let b; try { const t = await req.text(); if (t.length > 4000) return out({ error: 'bad_request' }, 400); b = JSON.parse(t); } catch (e) { return out({ error: 'bad_request' }, 400); }
  const id = String(b.id || '').trim().toUpperCase(), q = String(b.q || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!ID_RE.test(id)) return out({ error: 'id' }, 400);
  if (q.length < 6) return out({ error: 'question' }, 400);
  const ev = await evidence(env, id); if (!ev) return out({ error: 'unknown_project' }, 404);
  const ck = new Request(SITE + '/__kb_ins_ask/' + encodeURIComponent(id + '|' + ev.updated + '|' + q.toLowerCase().replace(/[?!.]+$/, '')));
  const hit = await caches.default.match(ck); if (hit) return out({ ...(await hit.json()), cached: true });
  if (await rateLimited(req, ctx)) return out({ error: 'rate', message: 'Too many questions from your network this hour. Try again later.' }, 429);
  const ctxt = ev.lines.map(l => l.e + ' ' + l.field + ': ' + l.value).join('\n');
  let o; try { o = await claude(env, ASK1_PROMPT + '\n\nPROJECT ' + id + ' (data updated ' + ev.updated + ')\n' + ctxt + '\n\nQUESTION: ' + q, null, null, 1200); }
  catch (e) { return out({ error: e && e.budget ? 'budget' : 'model', message: e && e.budget ? 'The daily AI budget is used up. Try again tomorrow.' : 'The model did not answer. Try again in a minute.' }, 503); }
  const byE = {}; ev.lines.forEach(l => { byE[l.e] = l; });
  const cites = []; const seen = new Set();
  for (const c of (Array.isArray(o.citations) ? o.citations : []).slice(0, 8)) {
    const l = byE[String(c && c.e || '').toUpperCase()]; if (!l || seen.has(l.e)) continue;
    const qt = qnorm(c.quote || ''), src = qnorm(l.value), whole = qnorm(l.field + ': ' + l.value);
    const ok = qt.length >= 1 && (src.includes(qt) || whole.includes(qt));
    cites.push({ e: l.e, field: l.field, value: l.value, quote: String(c.quote || '').slice(0, 200), quote_found: ok }); seen.add(l.e);
  }
  const good = cites.filter(c => c.quote_found);
  let answer = String(o.answer || '').replace(/[—–]/g, ', ').slice(0, 900), answerable = o.answerable !== false, refused = null;
  const pool = good.map(c => c.field + ' ' + c.value).join(' ') + ' ' + id;
  const backed = new Set(numsIn(pool)); const loose = numsIn(answer).filter(n => !backed.has(n));
  if (answerable && !good.length) { answerable = false; refused = 'no_valid_citation'; }
  else if (answerable && loose.length) { answerable = false; refused = 'number_not_in_cited_evidence'; }
  const res = { id, q, updated: ev.updated, answerable, refused,
    answer: answerable ? answer : (refused ? 'We could not back an answer with this project\'s evidence, so we do not show one. Try asking about its checks, promises, timeline, hazards or register checks.' : answer || 'The evidence for this project does not answer that.'),
    citations: answerable ? good : [], rejected_citations: cites.filter(c => !c.quote_found).map(c => c.e), unbacked_numbers: loose.slice(0, 6),
    model: claude.lastModel || null, evidence_lines: ev.lines.length,
    note: 'Answered by an AI model from this project\'s public evidence only. Code checked that every citation names a real evidence line and quotes text found in it, and that every number in the answer appears in the cited lines.' };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=86400' } })));
  return out(res);
}

// ---------- market indices ----------
export async function indices(env, market) {
  const [d, di, pr, hz, gg, cg, iw, pi] = await Promise.all([cases(env), file(env, 'delay-index.json'), file(env, 'promises.json'), file(env, 'hazards.json'), file(env, 'company-graph-global.json'), file(env, 'company-graph.json'), file(env, 'insolvency-watch.json'), file(env, 'price-index.json')]);
  const C = ((d && d.cases) || []).filter(c => c.market === market);
  if (!C.length) return null;
  const ids = new Set(C.map(c => c.id)), I = [];
  const thin = (key, label, href, why) => I.push({ key, label, status: 'thin', href, text: 'Not enough data: ' + why });
  // delay index
  const dm = di && (di.markets || []).find(m => m.market === market), minS = (di && di.rules && di.rules.min_sample) || 5;
  if (dm && dm.share_past_first !== null && dm.share_past_first !== undefined) I.push({ key: 'delay', label: 'Delay index', status: 'ok', href: '/index/delays/', value: dm.share_past_first + '%', text: dm.past_first + ' of ' + dm.with_date + ' dated projects not yet completed are past the first handover date on record' + (dm.median_late !== null && dm.median_late !== undefined ? ', median ' + dm.median_late + ' months late' : '') + '. ' + dm.moved + ' had their date moved.', n: dm.with_date, as_of: di.generated });
  else thin('delay', 'Delay index', '/index/delays/', (dm ? dm.with_date : 0) + ' dated projects, the index needs ' + minS + '.');
  // promises
  const pm = pr && (pr.markets || []).find(m => m.market === market);
  if (pm && pm.promises >= 5) I.push({ key: 'promises', label: 'Promises kept, broken, moved', status: 'ok', href: '/promises/', value: pm.kept + ' / ' + pm.broken + ' / ' + pm.moved, text: 'Of ' + pm.promises + ' dated promises on ' + pm.projects + ' projects: ' + pm.kept + ' kept, ' + pm.broken + ' broken, ' + pm.moved + ' moved and still ahead, ' + pm.pending + ' pending, ' + pm.unknown + ' unknown.', n: pm.promises, as_of: pr.updated });
  else thin('promises', 'Promises kept, broken, moved', '/promises/', (pm ? pm.promises : 0) + ' dated promises found, we show a market from 5.');
  // hazards
  const H = hz && hz.projects ? Object.keys(hz.projects).filter(k => ids.has(k)).map(k => hz.projects[k]) : [];
  if (H.length) {
    const fl = H.filter(h => (h.flood_river_m || 0) > 0 || (h.flood_coast_m || 0) > 0).length, q6 = H.filter(h => ((h.quakes || {}).m6 || 0) > 0).length, vo = H.filter(h => h.volcano && h.volcano.name).length, ts = H.filter(h => ((h.tsunami || {}).runups || 0) > 0).length;
    I.push({ key: 'hazards', label: 'Natural hazards', status: H.length >= 3 ? 'ok' : 'thin', href: '/hazards/', value: H.length + ' located', text: 'Of ' + H.length + ' project' + (H.length === 1 ? '' : 's') + ' with a public location: ' + fl + ' in a modelled 100-year flood depth above 0 m, ' + q6 + ' with an M6+ earthquake within 100 km since 1900, ' + ts + ' with tsunami run-ups within 50 km, ' + vo + ' within 100 km of a Holocene volcano.' + (H.length < 3 ? ' Fewer than 3 located projects: read as single cases, not as a market picture.' : ''), n: H.length, as_of: hz.updated });
  } else thin('hazards', 'Natural hazards', '/hazards/', 'no project here has public coordinates yet.');
  // company graph (GLEIF, all markets) and Companies House (UK)
  const gm = gg && gg.markets && gg.markets[market];
  const uk = cg && cg.projects ? Object.keys(cg.projects).filter(k => ids.has(k) && (cg.projects[k].resolved || 0) > 0).length : 0;
  if (gm && gm.checked >= 3) I.push({ key: 'graph', label: 'Company graph share', status: 'ok', href: '/graph/global/', value: Math.round((gm.projects_with_lei / gm.checked) * 100) + '%', text: gm.projects_with_lei + ' of ' + gm.checked + ' checked projects have a developer company matched to a Legal Entity Identifier in GLEIF' + (gm.projects_lei_not_issued ? ' (' + gm.projects_lei_not_issued + ' with a lapsed or retired LEI)' : '') + '.' + (uk ? ' ' + uk + ' matched on Companies House (UK), see /graph/.' : ''), n: gm.checked, as_of: String(gg.updated || '').slice(0, 10) });
  else thin('graph', 'Company graph share', '/graph/global/', (gm ? gm.checked : 0) + ' projects checked against GLEIF, we show a share from 3.');
  // insolvency watch
  const im = iw && iw.markets && iw.markets[market];
  if (im && im.names_checked > 0) I.push({ key: 'insolvency', label: 'Insolvency watch', status: 'ok', href: '/tools/insolvency-check/', value: String(im.projects_with_notice), text: im.projects_with_notice + ' of ' + im.projects_with_names + ' projects with a named company have an insolvency notice on ' + im.source + ' (' + im.names_checked + ' company names checked daily, ' + im.projects + ' projects in the market).', n: im.names_checked, as_of: String(iw.updated || '').slice(0, 10) });
  else if (im) thin('insolvency', 'Insolvency watch', '/tools/insolvency-check/', 'covered by ' + im.source + ', but no project here names a company with its legal form yet.');
  else thin('insolvency', 'Insolvency watch', '/tools/insolvency-check/', 'no open insolvency register we can read daily for ' + C[0].country + ' (only the UK and Spain are covered). Check by hand with the official register.');
  // price index
  const pmk = pi && (pi.markets || []).find(m => m.market === market), last = pmk && pmk.index && pmk.index[pmk.index.length - 1], first = pmk && pmk.index && pmk.index[0];
  const minP = (pi && pi.rules && pi.rules.min_pairs_per_link) || 5;
  if (last && last.pairs >= minP) I.push({ key: 'prices', label: 'Asking-price index', status: 'ok', href: '/index/prices/', value: (+last.index).toFixed(1), text: 'Advertised "from" prices, chained index: ' + (+last.index).toFixed(1) + ' on ' + last.date + ' against 100 on ' + first.date + ', from ' + last.pairs + ' same-project price pairs on the last link (' + pmk.changes_total + ' price changes seen in total). Asking prices, not sale prices.', n: last.pairs, as_of: pi.generated });
  else thin('prices', 'Asking-price index', '/index/prices/', (last ? last.pairs : 0) + ' same-project price pairs on the last link, the index needs ' + minP + '.');
  return { market, country: C[0].country, projects: C.length, updated: d.updated, indices: I, note: 'Each figure comes from the public file behind the linked page. "Not enough data" means the sample is below that page\'s own minimum.' };
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
    if (p === '/api/x/ins' || p === '/api/x/ins/status') {
      const [d, dg] = await Promise.all([cases(env), digestData(env)]);
      return out({ module: 'ins', projects: ((d && d.cases) || []).length, updated: d && d.updated, ask: !!env.ANTHROPIC_API_KEY, digest: dg ? { latest: dg.latest, weeks: (dg.weeks || []).length, generated: dg.generated, changes_generated: (dg.changes || {}).generated } : null,
        endpoints: ['/api/x/ins/explain?id=', '/api/x/ins/evidence?id=', 'POST /api/x/ins/ask {id,q}', '/api/x/ins/indices?market=', '/api/x/ins/digest.json', '/api/x/ins/feed.xml'], pages: ['/digest/', '/digest/#changes', '/explain/?id='] }, 200, 60);
    }
    if (p === '/api/x/ins/digest.json' || p === '/api/x/ins/feed.xml') {
      const D = await digestData(env);
      if (!D) return out({ error: 'not_built_yet', message: 'The weekly digest has not been published yet.' }, 503);
      if (p.endsWith('.json')) return out(D, 200, 300);
      return new Response(feed(D), { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*' } });
    }
    if (p === '/api/x/ins/explain' || p === '/api/x/ins/evidence') {
      const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
      if (!ID_RE.test(id)) return out({ error: 'id', message: 'Give a project id such as BALI-014.' }, 400);
      if (p.endsWith('/evidence')) { const ev = await evidence(env, id); if (!ev) return out({ error: 'unknown_project' }, 404); const { case: _c, ...rest } = ev; return out(rest, 200, 300); }
      const d = await cases(env); const c = ((d && d.cases) || []).find(x => x.id === id);
      if (!c) return out({ error: 'unknown_project', message: 'No tracked project has the id ' + id + '.' }, 404);
      return out(Object.assign({ updated: d.updated }, explain(c)), 200, 300);
    }
    if (p === '/api/x/ins/ask') { if (req.method !== 'POST') return out({ error: 'method' }, 405); return await ask(req, env, ctx); }
    if (p === '/api/x/ins/indices') {
      const m = String(u.searchParams.get('market') || '').trim().slice(0, 60);
      if (!m) return out({ error: 'market' }, 400);
      const d = await cases(env); const all = [...new Set(((d && d.cases) || []).map(c => c.market))];
      const norm = s => s.toLowerCase().replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
      const name = all.find(x => norm(x) === norm(m));
      if (!name) return out({ error: 'unknown_market' }, 404);
      return out(await indices(env, name), 200, 600);
    }
    return out({ error: 'not found', module: 'ins' }, 404);
  } catch (e) {
    return out({ error: 'server', message: String(e && e.message || e).slice(0, 160) }, 500);
  }
}
