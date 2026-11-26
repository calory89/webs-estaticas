#!/usr/bin/env node
// Kolaboro search ranking regression test (n34c, 21 Nov 2026). MIT licence. Node 18+, no packages.
// Runs the fixed query set /open/search-tests.json (50 queries in each of en es fr de nl ru zh ar) through the site's own search
// function (findProjects in _worker.js/kbx_n31e.js, the code behind /api/v1/find and the MCP tool search_text), on the data files of
// the checkout, and scores it: pass rate and mean reciprocal rank (first 10 results) per language and per query kind.
//   node search-quality.mjs <checkout root> [--write <label>]     --write appends the run to /data/search-quality.json
// Exit code 1 when any language scores lower than the last recorded run (a ranking regression); the pre-push hook only reports it.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = path.resolve(process.argv[2] || '.'), W = path.join(root, '_worker.js'), S = path.join(root, '_s/kolaboro.com');
const wi = process.argv.indexOf('--write'), label = wi > 0 ? process.argv[wi + 1] : null;
globalThis.caches = globalThis.caches || { default: { match: async () => null, put: async () => {} } };
const env = { ASSETS: { fetch: async r => { const p = new URL(typeof r === 'string' ? r : r.url).pathname.replace(/^\/_s\/kolaboro\.com\//, S + '/'); try { return new Response(fs.readFileSync(p), { status: 200 }); } catch (e) { return new Response('', { status: 404 }); } } } };
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => { const s = String(u && u.url || u); if (/^https:\/\/kolaboro\.com\//.test(s)) return env.ASSETS.fetch(new Request(s.replace('https://kolaboro.com/', 'https://kolaboro.com/_s/kolaboro.com/'))); return realFetch(u, o); };
try { const KS = await import(pathToFileURL(path.join(W, 'kbx_strings.js')).href); if (KS.ready) await KS.ready(env); } catch (e) {}
const M = await import(pathToFileURL(path.join(W, 'kbx_n31e.js')).href);
const T = JSON.parse(fs.readFileSync(path.join(S, 'open/search-tests.json'), 'utf8'));
const res = { at: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), label, languages: {} };
for (const [L, Q] of Object.entries(T.languages)) {
  let pass = 0, rr = 0; const kinds = {}, fails = [];
  for (const q of Q) {
    const r = await M.findProjects(env, q.q, 10), got = r.hits.map(x => x.s), ex = new Set(q.expect);
    const i = got.findIndex(s => ex.has(s)), ok = i === 0;
    pass += ok ? 1 : 0; rr += i >= 0 ? 1 / (i + 1) : 0;
    const k = kinds[q.kind] = kinds[q.kind] || { n: 0, pass: 0 }; k.n++; k.pass += ok ? 1 : 0;
    if (!ok && fails.length < 8) fails.push({ q: q.q, first: got[0] || null, expected_rank: i >= 0 ? i + 1 : null });
  }
  res.languages[L] = { n: Q.length, pass, pass_pct: Math.round(pass / Q.length * 1000) / 10, mrr: Math.round(rr / Q.length * 1000) / 1000, kinds, fails };
  console.log(L.padEnd(3), String(pass).padStart(3) + '/' + Q.length, 'pass', res.languages[L].pass_pct + '%', 'MRR', res.languages[L].mrr, Object.entries(kinds).map(([k, v]) => k + ' ' + v.pass + '/' + v.n).join(', '));
}
const fp = path.join(S, 'data/search-quality.json');
let D = {}; try { D = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) {}
const last = (D.runs || []).slice(-1)[0];
let worse = []; if (last) for (const L in res.languages) if (last.languages[L] && res.languages[L].pass < last.languages[L].pass) worse.push(L);
console.log(worse.length ? 'REGRESSION in ' + worse.join(', ') + ' against the run of ' + last.at : 'no regression' + (last ? ' against the run of ' + last.at : ' (first run)'));
if (label) {
  D = Object.assign({ type: 'kolaboro-search-quality-v1', tests: '/open/search-tests.json', runner: '/open/search-quality.mjs', about: T.rule }, D);
  D.runs = (D.runs || []).concat([res]).slice(-60); fs.writeFileSync(fp, JSON.stringify(D, null, 1));
}
process.exit(worse.length ? 1 : 0);
