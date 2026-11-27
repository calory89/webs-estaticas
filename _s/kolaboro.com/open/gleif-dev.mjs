// n40 k57: gleif-dev.json, the GLEIF name search (and, for a match, its level 2 relationships) for every tracked developer, run the same way the
// developer page runs it live, so a page rendered on a cold edge does not wait 0.8 to 1.2 s for api.gleif.org. The worker uses a row only when
// the developer's name is unchanged and the row is under 60 days old, and refreshes its edge copy from the live API in the background.
// usage: node gleif-dev.mjs <devs.json: [{s, n}]> <out gleif-dev.json> [max requests, default 3000]   resumes from <out> (rows under 21 days are kept)
import fs from 'node:fs';
const [devF, outF, maxQ = '3000'] = process.argv.slice(2);
const API = 'https://api.gleif.org/api/v1/lei-records', H = { accept: 'application/vnd.api+json', 'user-agent': 'RegisterCheck/1.0' };
const SUFFIX = new Set('llc l c ltd limited inc incorporated pjsc pjs psc p j s sa slu sl plc bhd berhad sdn co company corp corporation pt tbk jsc gmbh ag bv nv srl spa sas sarl doo as ab oy kft zrt fz fze fzco fzllc soc sole proprietorship pvt pte private public sae sab de cv sapi ooo sociedad anonima'.split(' '));
const normN = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9Ѐ-ӿ؀-ۿ一-鿿]+/g, ' ').trim();
const core = s => normN(s).split(' ').filter(w => w && !SUFFIX.has(w)).join(' ');
const today = new Date().toISOString().slice(0, 10), age = d => (Date.parse(today) - Date.parse(d)) / 864e5;
let last = 0, nq = 0;
async function get(u) {   // at most about 55 requests a minute (GLEIF allows 60); retries on 429 and 5xx
  for (let i = 0; i < 5; i++) {
    const at = last = Math.max(Date.now(), last + 1100); if (at > Date.now()) await new Promise(r => setTimeout(r, at - Date.now())); nq++;   // one slot every 1.1 s across workers
    try { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(20000) }); if (r.status === 404) return null; if (r.ok) return await r.json();
      if (r.status !== 429 && r.status < 500) throw new Error('gleif ' + r.status); } catch (e) { if (i === 4) throw e; }
    await new Promise(r => setTimeout(r, 5000 * (i + 1)));
  }
  throw new Error('gleif retries');
}
async function search(name) {   // same filter and fields as gleif() in _worker.js/kbx_named.js
  const d = await get(API + '?filter%5Bfulltext%5D=' + encodeURIComponent(name) + '&page%5Bsize%5D=20'), want = core(name);
  const m = ((d && d.data) || []).filter(e => { const ent = ((e.attributes || {}).entity) || {}; return want.length >= 3 && ent.legalName && core(ent.legalName.name) === want; }).slice(0, 3)
    .map(e => { const a = e.attributes, ent = a.entity; return { lei: e.id, legal: ent.legalName.name, jur: ent.jurisdiction, st: ent.status, ls: a.registration.status, reg: (a.registration.initialRegistrationDate || '').slice(0, 10), cr: (ent.creationDate || '').slice(0, 10), country: (ent.legalAddress || {}).country }; });
  return { ok: true, at: today, matches: m };
}
const ent = e => e && e.attributes && e.attributes.entity ? { lei: e.id, legal: e.attributes.entity.legalName.name, country: (e.attributes.entity.legalAddress || {}).country || '', st: e.attributes.entity.status } : null;
async function net(lei) {   // same calls and fields as gleifNet() in _worker.js/kbx_named_plus.js
  const g = p => get(API + '/' + lei + p);
  const dp = await g('/direct-parent'), up = await g('/ultimate-parent'), ch = await g('/direct-children?page%5Bsize%5D=10'), dx = await g('/direct-parent-reporting-exception').catch(() => null);
  return { ok: true, at: today, parent: ent(dp && dp.data), ultimate: ent(up && up.data), children: ((ch && ch.data) || []).map(ent).filter(Boolean), children_total: (ch && ch.meta && ch.meta.pagination && ch.meta.pagination.total) || 0,
    exception: dx && dx.data && dx.data.attributes ? dx.data.attributes.reason : null };
}
const devs = JSON.parse(fs.readFileSync(devF, 'utf8'));
let old = {}; try { old = JSON.parse(fs.readFileSync(outF, 'utf8')); } catch (e) {}
const D = {}, N = {}, oD = old.d || {}, oN = old.net || {};
const save = () => { const o = { version: 1, updated: today, source: 'GLEIF API, ' + API + ' (CC0 1.0)', rule: 'Exact legal name after normalising case, accents, punctuation and legal-form words; at most 3 matches; relationships for the first match.', d: {}, net: {} };
  for (const x of devs) if (D[x.s]) o.d[x.s] = D[x.s];
  for (const k of Object.keys(N).sort()) o.net[k] = N[k];
  fs.writeFileSync(outF + '.tmp', JSON.stringify(o)); fs.renameSync(outF + '.tmp', outF); };
for (const x of devs) { const o = oD[x.s]; if (o && o[0] === x.n && o[1] && o[1].ok && age(o[1].at) < 21) D[x.s] = o; }
for (const k of Object.keys(oN)) if (oN[k].ok && age(oN[k].at) < 21) N[k] = oN[k];
let i = 0, q = devs.slice();
async function worker() {   // three requests in flight at most, still one slot every 1.1 s
  for (let x; (x = q.shift()) && nq < +maxQ;) {
    try {
      if (!D[x.s]) D[x.s] = [x.n, await search(x.n)];
      const m0 = D[x.s][1].matches[0]; if (m0 && /^[A-Z0-9]{20}$/.test(m0.lei) && !N[m0.lei]) N[m0.lei] = await net(m0.lei);
    } catch (e) { console.error(x.s, String(e)); }
    if (++i % 50 === 0) { save(); console.log(i, nq); }
  }
}
await Promise.all([worker(), worker(), worker()]);
const want = new Set(Object.values(D).map(o => (o[1].matches[0] || {}).lei).filter(Boolean)); for (const k of Object.keys(N)) if (!want.has(k)) delete N[k];
save(); console.log('done', Object.keys(D).length, 'of', devs.length, 'net', Object.keys(N).length, 'requests', nq);
