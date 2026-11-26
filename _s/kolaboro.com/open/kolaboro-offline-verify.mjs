#!/usr/bin/env node
// kolaboro-offline-verify.mjs 1.1 (21 Nov 2026; 1.0 of 19 Nov plus delta, tlog and tlog-consistency), MIT licence. Checks Kolaboro's published records OFFLINE, from files you saved.
// Node 18+, no packages (Ed25519 and SHA-256 from node:crypto). Same checks and answers as kolaboro_offline_verify.py.
// Exit code 0 = every check passed. Docs: https://kolaboro.com/verify/offline/
//   node kolaboro-offline-verify.mjs chain index.json [copy.json.gz ...]
//   node kolaboro-offline-verify.mjs cert cert.json
//   node kolaboro-offline-verify.mjs sig body.json <x-kolaboro-signature>
//   node kolaboro-offline-verify.mjs provenance prov.json
//   node kolaboro-offline-verify.mjs delta <day>.json <day>.sig.json [from-day named.json.gz]
//   node kolaboro-offline-verify.mjs tlog proof.json [day named.json.gz]
//   node kolaboro-offline-verify.mjs tlog-consistency cons.json
//   node kolaboro-offline-verify.mjs selftest
import { createHash, createPublicKey, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { basename } from 'node:path';

const PUBLIC_KEY = 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=';   // kid kb-f2e04da5878f8c51; also at https://kolaboro.com/.well-known/kolaboro-keys.json
const hx = b => createHash('sha256').update(b).digest('hex');
const KEY = createPublicKey({ key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(PUBLIC_KEY, 'base64')]), format: 'der', type: 'spki' });
let okAll = true;
const say = (ok, t) => { okAll = okAll && !!ok; console.log((ok ? 'OK      ' : 'FAILED  ') + t); return ok; };
const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
const sigOk = (digestHex, sigB64) => { try { return verify(null, Buffer.from('kolaboro-sig-v1\n' + digestHex), KEY, Buffer.from(sigB64, 'base64')); } catch (e) { return false; } };
const readJson = p => JSON.parse(readFileSync(p, 'utf8'));

function chain(indexPath, copies) {
  const idx = readJson(indexPath), E = idx.entries || [], bySha = {}; let prev = 'genesis';
  say(E.length > 0, basename(indexPath) + ': ' + E.length + ' entries');
  for (const e of E) {
    const h = hx('kolaboro-snapshot-v1|' + e.day + '|' + (idx.file || '/data/named.json') + '|' + e.sha256 + '|' + e.bytes + '|' + prev);
    say(e.prev === prev && h === e.head, 'head ' + e.day + ' ' + h.slice(0, 16)); prev = e.head; bySha[e.sha256] = e;
  }
  if (idx.tip) say(idx.tip === prev, 'tip ' + prev.slice(0, 16) + ' matches the last head');
  for (const c of copies) {
    let raw = readFileSync(c); if (raw[0] === 0x1f && raw[1] === 0x8b) raw = gunzipSync(raw);
    const s = hx(raw), e = bySha[s];
    say(e && e.bytes === raw.length, basename(c) + ': SHA-256 ' + s.slice(0, 16) + ', ' + raw.length + ' bytes' + (e ? ', day ' + e.day : ', not in the chain'));
  }
}
function cert(p) {
  const d = readJson(p), c = d.certificate, g = d.signature || {};
  say(hx(canon(c.facts)) === c.facts_sha256, 'facts hash ' + c.facts_sha256.slice(0, 16));
  const ch = hx(canon(c)); say(g.certificate_sha256 == null || g.certificate_sha256 === ch, 'certificate hash ' + ch.slice(0, 16));
  if (g.alg === 'Ed25519') say(sigOk(ch, g.value), 'Ed25519 signature (key ' + g.kid + ') on ' + c.subject.slug); else say(false, 'no Ed25519 signature in the file (hash only)');
}
function sig(p, s) { const raw = readFileSync(p), h = hx(raw); say(sigOk(h, String(s || '').trim()), 'Ed25519 signature over SHA-256 ' + h.slice(0, 16) + ' of ' + basename(p) + ' (' + raw.length + ' bytes)'); }
function prov(p) {
  const d = readJson(p), a = d.attestation, g = d.signature || {}, h = hx(canon(a));
  say(g.attestation_sha256 == null || g.attestation_sha256 === h, 'attestation hash ' + h.slice(0, 16));
  console.log('        commit ' + a.commit + ', dataset ' + (a.dataset || {}).sha256 + ', worker tree ' + a.worker_tree);
  if (g.alg === 'Ed25519') say(sigOk(h, g.value), 'Ed25519 signature (key ' + g.kid + ')'); else say(false, 'no Ed25519 signature in the file');
}
// n34c (21 Nov 2026): signed daily deltas and the transparency log (RFC 6962 / RFC 9162 Merkle proofs)
const H = b => createHash('sha256').update(b).digest();
const node = (a, b) => H(Buffer.concat([Buffer.from([1]), a, b]));
const B = x => Buffer.from(x, 'hex');
function inclRoot(leaf, index, size, path) {
  if (index >= size) return null; let fn = index, sn = size - 1, r = leaf;
  for (const p of path) {
    if (sn === 0) return null;
    if ((fn & 1) || fn === sn) { r = node(p, r); if (!(fn & 1)) while (!(fn & 1) && fn) { fn >>= 1; sn >>= 1; } } else r = node(r, p);
    fn >>= 1; sn >>= 1;
  }
  return sn === 0 ? r : null;
}
function consOk(first, second, h1, h2, path) {
  if (first === second) return !path.length && h1.equals(h2);
  if (!first || first > second || !path.length) return false;
  const c = (first & (first - 1)) === 0 ? [h1].concat(path) : path.slice(); let fn = first - 1, sn = second - 1;
  while (fn & 1) { fn >>= 1; sn >>= 1; }
  let fr = c[0], sr = c[0];
  for (const x of c.slice(1)) {
    if (sn === 0) return false;
    if ((fn & 1) || fn === sn) { fr = node(x, fr); sr = node(x, sr); if (!(fn & 1)) while (!(fn & 1) && fn) { fn >>= 1; sn >>= 1; } } else sr = node(sr, x);
    fn >>= 1; sn >>= 1;
  }
  return fr.equals(h1) && sr.equals(h2) && sn === 0;
}
function headSig(th, g) {
  const h = hx(canon(th)); say(g.tree_head_sha256 == null || g.tree_head_sha256 === h, 'tree head hash ' + h.slice(0, 16) + ' (size ' + th.size + ', root ' + String(th.root).slice(0, 16) + ')');
  if (g.alg === 'Ed25519') say(sigOk(h, g.value), 'Ed25519 signature on the tree head (key ' + g.kid + ')'); else say(false, 'no Ed25519 signature on the tree head');
}
const gz = p => { let b = readFileSync(p); return b[0] === 0x1f && b[1] === 0x8b ? gunzipSync(b) : b; };
const projHash = P => hx(canon(Object.keys(P).sort().map(k => P[k])));
function delta(p, sp, base) {
  const raw = readFileSync(p), d = JSON.parse(raw.toString('utf8')), g = readJson(sp);
  say(g.sha256 === hx(raw), basename(p) + ': SHA-256 ' + hx(raw).slice(0, 16) + ', ' + raw.length + ' bytes');
  say(sigOk(hx(raw), g.signature || ''), 'Ed25519 signature (key ' + g.kid + ') on the delta ' + d.from.day + ' -> ' + d.to.day);
  if (!base) return;
  const b = gz(base); say(hx(b) === d.from.sha256, 'base file is the ' + d.from.day + ' snapshot (SHA-256 ' + hx(b).slice(0, 16) + ')');
  const P = {}; for (const x of JSON.parse(b.toString('utf8')).projects || []) if (x.s) P[x.s] = x;
  say(projHash(P) === d.from.projects_sha256, 'base projects hash ' + d.from.projects_sha256.slice(0, 16));
  for (const k of d.removed || []) delete P[k];
  for (const x of d.added || []) P[x.s] = x;
  for (const [k, c] of Object.entries(d.changed || {})) { const r = Object.assign({}, P[k] || {}, c.set || {}); for (const f of c.unset || []) delete r[f]; P[k] = r; }
  const h = projHash(P); say(h === d.to.projects_sha256, 'delta applied: ' + Object.keys(P).length + ' projects, hash ' + h.slice(0, 16) + ' equals the ' + d.to.day + ' snapshot');
}
function tlog(p, snap) {
  const d = readJson(p), leaf = H(Buffer.concat([Buffer.from([0]), Buffer.from('kolaboro-tlog-v1|' + d.day + '|' + d.project + '|' + canon(d.record))]));
  say(leaf.toString('hex') === d.leaf, 'record leaf ' + leaf.toString('hex').slice(0, 16) + ' (' + d.project + ', ' + d.day + ')');
  const r = inclRoot(leaf, d.leaf_index, d.day_size, d.day_path.map(B));
  say(r && r.toString('hex') === d.day_root, 'inclusion in the day tree: leaf ' + d.leaf_index + ' of ' + d.day_size + ', root ' + d.day_root.slice(0, 16));
  const dl = H(Buffer.concat([Buffer.from([0]), Buffer.from('kolaboro-tlog-day-v1|' + d.day + '|' + d.day_root + '|' + d.day_size + '|' + d.snapshot.head)]));
  const r2 = inclRoot(dl, d.day_index, d.tree_head.size, d.log_path.map(B));
  say(r2 && r2.toString('hex') === d.tree_head.root, 'day ' + d.day_index + ' of ' + d.tree_head.size + ' in the log, log root ' + d.tree_head.root.slice(0, 16));
  headSig(d.tree_head, d.signature || {});
  if (snap) { const b = gz(snap); say(hx(b) === d.snapshot.sha256, 'snapshot file of ' + d.day + ' (SHA-256 ' + hx(b).slice(0, 16) + ')'); const x = (JSON.parse(b.toString('utf8')).projects || []).find(y => y.s === d.project); say(x && canon(x) === canon(d.record), 'the record is the one in that snapshot'); }
}
function tcons(p) {
  const d = readJson(p); say(consOk(d.first, d.second, B(d.first_root), B(d.second_root), d.path.map(B)), 'consistency: the tree of size ' + d.first + ' (root ' + d.first_root.slice(0, 16) + ') is a prefix of the tree of size ' + d.second + ' (root ' + d.second_root.slice(0, 16) + ')');
  if (d.tree_head) headSig(d.tree_head, d.signature || {});
}
// a real signature made by the site key: header of GET /api/v1/snapshots on 19 Nov 2026 and the SHA-256 of that body
const VEC = ['03f5a5f80c7895ab9f14e43605056419e01cfea6d3cb1243517f7648e9bcbd62', 'PiEDZ4cOEzrHb/AjJ6iBwML3hkk4CcODOcHdhd9rmr59bckrMxOzn6prwEk54SfxyMCYT6/7FnqjIAZo/NPOCg=='];
function selftest() {
  say(hx('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256 test vector');
  say(sigOk(VEC[0], VEC[1]), 'Ed25519: real signature verifies');
  const bad = VEC[0].slice(0, -1) + (VEC[0].slice(-1) !== '0' ? '0' : '1'); say(!sigOk(bad, VEC[1]), 'Ed25519: one changed character is rejected');
  say(canon({ b: 1, a: [1, 'é', null] }) === '{"a":[1,"é",null],"b":1}', 'canonical JSON');
  say(canon({ b: 5.0, a: [1e21, 1.5e-7, 0.1, 123456789012345680000] }) === '{"a":[1e+21,1.5e-7,0.1,123456789012345680000],"b":5}', 'canonical JSON, JavaScript numbers');
  const L = [0, 1, 2, 3, 4, 5, 6].map(i => H(Buffer.from([0, i]))), mth = x => x.length === 1 ? x[0] : (k => node(mth(x.slice(0, k)), mth(x.slice(k))))(2 ** Math.floor(Math.log2(x.length - 1)));
  say(consOk(4, 7, mth(L.slice(0, 4)), mth(L), [mth(L.slice(4))]) && consOk(3, 7, mth(L.slice(0, 3)), mth(L), [L[2], L[3], mth(L.slice(0, 2)), mth(L.slice(4))]) && !consOk(3, 7, mth(L.slice(0, 3)), mth(L), [L[3], L[2], mth(L.slice(0, 2)), mth(L.slice(4))]), 'RFC 9162 consistency proofs 4 -> 7 and 3 -> 7 (a swapped one is rejected)');
  say(inclRoot(L[6], 6, 7, [mth(L.slice(4, 6)), mth(L.slice(0, 4))]).equals(mth(L)), 'RFC 9162 inclusion proof leaf 6 of 7');
}
const [c, ...a] = process.argv.slice(2);
if (!['chain', 'cert', 'sig', 'provenance', 'selftest', 'delta', 'tlog', 'tlog-consistency'].includes(c)) { console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 13).join('\n')); process.exit(2); }
if (c === 'chain') chain(a[0], a.slice(1)); else if (c === 'cert') cert(a[0]); else if (c === 'sig') sig(a[0], a[1]); else if (c === 'provenance') prov(a[0]); else if (c === 'delta') delta(a[0], a[1], a[2]); else if (c === 'tlog') tlog(a[0], a[1]); else if (c === 'tlog-consistency') tcons(a[0]); else selftest();
console.log(okAll ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'); process.exit(okAll ? 0 : 1);
