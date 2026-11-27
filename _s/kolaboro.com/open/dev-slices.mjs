// Kolaboro developer slices (n40 k61, 27 Nov 2026, R01-49). A developer page built on a cold edge used to parse the whole /data/named.json
// (16 MB) and /data/bali-cases.json (6.8 MB) and rank every project for the links box (kbx_h29.js), only to show one developer. This script
// cuts both files into 64 bucket files, /data/dv/<00..63>.json (bucket = FNV-1a of the developer slug, mod 64): for every developer its
// rows of named.json exactly as published (every row with that slug, in file order), its rows of bali-cases.json, and the developer
// ranking and comparison links that kbx_h29.js linksFor() shows on the page, computed by the worker's own code (bundled with esbuild).
// The worker uses a bucket only when every file the bucket was built from is unchanged in the deployment; otherwise
// the page is built from the full files as before. k64 (R01-49): each bucket also carries "et", the tag Cloudflare Pages gives each of
// those files (its ETag: BLAKE3 over the base64 text of the file plus its extension, first 32 hex), so the worker compares the deployed
// files' tags (HEAD requests, no bodies) instead of hashing 27 MB; a file without a tag, or another tag format, falls back to SHA-256. Deterministic: the same files always give byte-identical buckets.
// k66 (27 Nov 2026): no month stamp. Nothing in a bucket depends on the date (the ranking and comparison links depend only on project
// counts per developer and market; overdue counts, handover status and every date are computed by the worker per request), so a bucket
// stays valid across month changes; checked by building the buckets with the clock at 1 Dec 2026 and 15 Jan 2027 (identical files).
// Run: node open/dev-slices.mjs [kolaboro dir, default: the folder above open/]   (needs npx esbuild; writes data/dv/*.json)
//      --check   exit 1 when data/dv/index.json was not built from the current files (nothing written)
// Called by open/catalog-refresh.py when the buckets are behind the files.
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import crypto from 'node:crypto'; import { execSync } from 'node:child_process';
// BLAKE3 (unkeyed, 32-byte output) in plain JS, for the Pages asset tag (no package needed)
const B3IV = new Uint32Array([0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19]);
const B3P = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];
const B3S = (() => { const s = []; let p = [...Array(16).keys()]; for (let r = 0; r < 7; r++) { s.push(p); p = B3P.map(i => p[i]); } return s; })();
const b3st = new Uint32Array(16), b3m = new Uint32Array(16);
function b3c(cv, blk, off, len, ctr, flags, out) {   // blk: Uint8Array, len bytes from off (rest zero)
  for (let i = 0; i < 16; i++) b3m[i] = 0;
  for (let i = 0; i < len; i++) b3m[i >> 2] |= blk[off + i] << ((i & 3) * 8);
  for (let i = 0; i < 8; i++) b3st[i] = cv[i];
  b3st[8] = B3IV[0]; b3st[9] = B3IV[1]; b3st[10] = B3IV[2]; b3st[11] = B3IV[3]; b3st[12] = ctr >>> 0; b3st[13] = Math.floor(ctr / 4294967296) >>> 0; b3st[14] = len; b3st[15] = flags;
  for (let r = 0; r < 7; r++) { const s = B3S[r];
    b3g(0, 4, 8, 12, b3m[s[0]], b3m[s[1]]); b3g(1, 5, 9, 13, b3m[s[2]], b3m[s[3]]); b3g(2, 6, 10, 14, b3m[s[4]], b3m[s[5]]); b3g(3, 7, 11, 15, b3m[s[6]], b3m[s[7]]);
    b3g(0, 5, 10, 15, b3m[s[8]], b3m[s[9]]); b3g(1, 6, 11, 12, b3m[s[10]], b3m[s[11]]); b3g(2, 7, 8, 13, b3m[s[12]], b3m[s[13]]); b3g(3, 4, 9, 14, b3m[s[14]], b3m[s[15]]); }
  for (let i = 0; i < 8; i++) out[i] = b3st[i] ^ b3st[i + 8];
}
function b3g(a, b, c, d, x, y) {
  let A = b3st[a], B = b3st[b], C = b3st[c], D = b3st[d];
  A = (A + B + x) | 0; D ^= A; D = (D >>> 16) | (D << 16); C = (C + D) | 0; B ^= C; B = (B >>> 12) | (B << 20);
  A = (A + B + y) | 0; D ^= A; D = (D >>> 8) | (D << 24); C = (C + D) | 0; B ^= C; B = (B >>> 7) | (B << 25);
  b3st[a] = A; b3st[b] = B; b3st[c] = C; b3st[d] = D;
}
function blake3hex(buf) {   // buf: Uint8Array
  const n = buf.length, nch = Math.max(1, Math.ceil(n / 1024)), stack = [], pb = new Uint8Array(64);
  const parent = (l, r, flags) => { for (let i = 0; i < 8; i++) { pb[i * 4] = l[i]; pb[i * 4 + 1] = l[i] >>> 8; pb[i * 4 + 2] = l[i] >>> 16; pb[i * 4 + 3] = l[i] >>> 24; pb[32 + i * 4] = r[i]; pb[33 + i * 4] = r[i] >>> 8; pb[34 + i * 4] = r[i] >>> 16; pb[35 + i * 4] = r[i] >>> 24; } const o = new Uint32Array(8); b3c(B3IV, pb, 0, 64, 0, 4 | flags, o); return o; };
  let root = null;
  for (let c = 0; c < nch; c++) {
    const s = c * 1024, e = Math.min(n, s + 1024), nb = Math.max(1, Math.ceil((e - s) / 64)); let cv = new Uint32Array(B3IV); const last = c === nch - 1;
    for (let b = 0; b < nb; b++) { const o = s + b * 64, len = Math.min(64, e - o); let f = (b === 0 ? 1 : 0) | (b === nb - 1 ? 2 : 0); if (last && b === nb - 1 && nch === 1) f |= 8; const out = new Uint32Array(8); b3c(cv, buf, o, Math.max(0, len), c, f, out); cv = out; }
    if (!last) { let t = c + 1; while ((t & 1) === 0) { cv = parent(stack.pop(), cv, 0); t >>= 1; } stack.push(cv); }
    else root = cv;
  }
  if (nch > 1) { for (let i = stack.length - 1; i >= 0; i--) root = parent(stack[i], root, i === 0 ? 8 : 0); }
  return [...root].map(w => [w & 255, (w >>> 8) & 255, (w >>> 16) & 255, w >>> 24].map(v => v.toString(16).padStart(2, '0')).join('')).join('');
}
// the tag Cloudflare Pages gives a static asset (its ETag): blake3 over the base64 text of the file plus its extension, first 32 hex
const pagesTag = (bytes, ext) => blake3hex(Buffer.from(Buffer.from(bytes).toString('base64') + ext, 'latin1')).slice(0, 32);
const args = process.argv.slice(2), check = args.includes('--check'), KB = path.resolve(args.find(a => !a.startsWith('--')) || path.join(path.dirname(new URL(import.meta.url).pathname), '..'));
const DATA = path.join(KB, 'data'), OUT = path.join(DATA, 'dv'), WK = path.resolve(KB, '..', '..', '_worker.js'), NB = 64;
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(DATA, f))).digest('hex').slice(0, 16);
const srcSha = sha('named.json') + sha('bali-cases.json');
if (check) { let ok = false; try { const ix = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8')); ok = ix.sha === srcSha && !!ix.et && Object.keys(ix.files || {}).every(f => fs.existsSync(path.join(DATA, f)) && sha(f) === ix.files[f]); } catch (e) {} process.exit(ok ? 0 : 1); }
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
const files = Object.fromEntries([...used].sort((a, b) => a[0] < b[0] ? -1 : 1)), et = Object.fromEntries(Object.keys(files).map(f => [f, pagesTag(fs.readFileSync(path.join(DATA, f)), path.extname(f).slice(1))]));
const g = { version: named.version, updated: named.updated, count: named.count, aliases: named.aliases, cupdated: cases.updated, pn: D.ix.P.length, mk: Object.fromEntries([...D.ix.mk].sort((a, b) => a[0] < b[0] ? -1 : 1)) };   // mk: project counts per market (kbx_n33l.js picks the language prefix by it)
const B = Array.from({ length: NB }, () => ({}));
for (const s of [...dev.keys()].sort()) B[bucket(s)][s] = dev.get(s);
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (let i = 0; i < NB; i++) { const t = JSON.stringify({ v: 1, sha: srcSha, files, et, g, d: B[i] }); bytes += t.length; fs.writeFileSync(path.join(OUT, String(i).padStart(2, '0') + '.json'), t); }
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ v: 1, sha: srcSha, buckets: NB, developers: dev.size, files, et, note: 'Bucket files for /developers/<slug>/ pages, built by /open/dev-slices.mjs from /data/named.json and /data/bali-cases.json.' }, null, 1) + '\n');
console.log('developer slices', dev.size, 'developers in', NB, 'buckets,', (bytes / 1e6).toFixed(1), 'MB; checked files', Object.keys(files).length);
