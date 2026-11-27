// Kolaboro developer slices (n40 k61, 27 Nov 2026, R01-49). A developer page built on a cold edge used to parse the whole /data/named.json
// (16 MB) and /data/bali-cases.json (6.8 MB) and rank every project for the links box (kbx_h29.js), only to show one developer. This script
// cuts both files into 64 bucket files, /data/dv/<00..63>.json (bucket = FNV-1a of the developer slug, mod 64): for every developer its
// rows of named.json exactly as published (every row with that slug, in file order), its rows of bali-cases.json, and the developer
// ranking and comparison links that kbx_h29.js linksFor() shows on the page, computed by the worker's own code (bundled with esbuild).
// The worker uses a bucket only when the SHA-256 of every file the bucket was built from matches the deployed file, and the month
// matches; otherwise the page is built from the full files as before. Deterministic: the same files always give byte-identical buckets.
// Run: node open/dev-slices.mjs [kolaboro dir, default: the folder above open/]   (needs npx esbuild; writes data/dv/*.json)
//      --check   exit 1 when data/dv/index.json was not built from the current named.json and bali-cases.json (nothing written)
// Called by open/catalog-refresh.py when the buckets are behind the files.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto'; import { execSync } from 'node:child_process';
const args = process.argv.slice(2), check = args.includes('--check'), KB = path.resolve(args.find(a => !a.startsWith('--')) || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const DATA = path.join(KB, 'data'), OUT = path.join(DATA, 'dv'), WK = path.resolve(KB, '..', '..', '_worker.js'), NB = 64;
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(DATA, f))).digest('hex').slice(0, 16);
const srcSha = sha('named.json') + sha('bali-cases.json');
if (check) { let cur = ''; try { cur = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8')).sha; } catch (e) {} process.exit(cur === srcSha ? 0 : 1); }
export const bucket = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h % NB; };   // same as dvBucket() in kbx_named.js
// 1. the worker's own h29Data(), run in Node over the files on disk (string tables first, as in the worker)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kbdv-'));
fs.writeFileSync(path.join(tmp, 's.mjs'), `export { ready, isReady } from ${JSON.stringify(path.join(WK, 'kbx_strings.js'))};`);
fs.writeFileSync(path.join(tmp, 'h.mjs'), `export { h29Data } from ${JSON.stringify(path.join(WK, 'kbx_h29.js'))};`);
execSync(`npx -y esbuild s.mjs h.mjs --bundle --splitting --format=esm --platform=neutral --external:'node:*' --outdir=out --log-level=error`, { cwd: tmp, stdio: 'inherit' });
const used = new Map();
globalThis.caches = { default: { match: async () => undefined, put: async () => {}, delete: async () => false } };
const env = { ASSETS: { fetch: async q => { const u = new URL(q.url || q), f = path.join(KB, decodeURIComponent(u.pathname).replace(/^\/_s\/kolaboro\.com\//, '/'));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return new Response('Not found', { status: 404 });
  const b = fs.readFileSync(f); if (!/\/i18n\//.test(f) && /\.json$/.test(f)) used.set(path.relative(DATA, f), crypto.createHash('sha256').update(b).digest('hex').slice(0, 16)); return new Response(b, { headers: { 'content-type': 'application/json' } }); } } };
const S = await import(path.join(tmp, 'out', 's.js')); await S.ready(env); if (!S.isReady()) throw new Error('string tables not loaded');
const H = await import(path.join(tmp, 'out', 'h.js')), D = await H.h29Data(env);
fs.rmSync(tmp, { recursive: true, force: true });
// 2. rows as published, grouped by developer slug, in file order
const named = JSON.parse(fs.readFileSync(path.join(DATA, 'named.json'), 'utf8')), cases = JSON.parse(fs.readFileSync(path.join(DATA, 'bali-cases.json'), 'utf8'));
used.set('named.json', sha('named.json')); used.set('bali-cases.json', sha('bali-cases.json'));
const caseBy = new Map((cases.cases || []).map(c => [c.id, c])), dev = new Map();
for (const x of named.projects || []) { if (!x || !x.dvs) continue; if (!dev.has(x.dvs)) dev.set(x.dvs, { p: [], c: [] }); const d = dev.get(x.dvs); d.p.push(x); const c = caseBy.get(x.id); if (c && !d.c.includes(c)) d.c.push(c); }
const links = JSON.parse(fs.readFileSync(path.join(DATA, 'dev-links.json'), 'utf8')), dn = new Map(), byDev = new Map();   // kbx_web.js: developer names of the shared-link groups
used.set('dev-links.json', sha('dev-links.json'));
for (const x of named.projects || []) if (x && x.dvs && x.dv) dn.set(x.dvs, x.dv);
for (const g of links.groups || []) for (const s of g.dv || []) { if (!byDev.has(s)) byDev.set(s, new Set()); for (const o of g.dv || []) byDev.get(s).add(o); }
for (const [s, d] of dev) { d.wn = Object.fromEntries([...(byDev.get(s) || [])].filter(o => dn.has(o)).sort().map(o => [o, dn.get(o)])); }
for (const [s, d] of dev) { d.dr = (D.drOfDev.get(s) || []).map(k => [k, D.DR.get(k).mk]); d.vs = (D.vsOfDev.get(s) || []).map(pr => [pr.k, pr.a.dv, pr.b.dv, pr.mk]); }
// 3. the file hashes the worker checks, the top-level fields its index needs, then the buckets
const files = Object.fromEntries([...used].sort((a, b) => a[0] < b[0] ? -1 : 1));
const g = { version: named.version, updated: named.updated, count: named.count, aliases: named.aliases, cupdated: cases.updated, pn: D.ix.P.length, month: D.month, mk: Object.fromEntries([...D.ix.mk].sort((a, b) => a[0] < b[0] ? -1 : 1)) };   // mk: project counts per market (kbx_n33l.js picks the language prefix by it)
const B = Array.from({ length: NB }, () => ({}));
for (const s of [...dev.keys()].sort()) B[bucket(s)][s] = dev.get(s);
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (let i = 0; i < NB; i++) { const t = JSON.stringify({ v: 1, sha: srcSha, files, g, d: B[i] }); bytes += t.length; fs.writeFileSync(path.join(OUT, String(i).padStart(2, '0') + '.json'), t); }
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ v: 1, sha: srcSha, buckets: NB, developers: dev.size, month: D.month, files, note: 'Bucket files for /developers/<slug>/ pages, built by /open/dev-slices.mjs from /data/named.json and /data/bali-cases.json.' }, null, 1) + '\n');
console.log('developer slices', dev.size, 'developers in', NB, 'buckets,', (bytes / 1e6).toFixed(1), 'MB; checked files', Object.keys(files).length);
