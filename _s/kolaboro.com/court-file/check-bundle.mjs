#!/usr/bin/env node
// check-bundle.mjs 1.0 (4 Nov 2026), MIT licence. Offline check of a Kolaboro evidence bundle manifest (format kolaboro-bundle-v1).
// No network call. Needs Node.js 18+ and kolaboro-verify.js from https://github.com/calory89/kolaboro-open (open/kolaboro-verify.js)
// in the same folder as this file.
//
//   node check-bundle.mjs kolaboro-bundle-BALI-048.json
//   node check-bundle.mjs kolaboro-bundle-KB-1234.json --files ./originals --ots ./ots
//
// --files DIR  hashes every file in DIR and names the exhibit it matches (originals of a buyer's case)
// --ots DIR    writes one OpenTimestamps proof (.ots) per timestamp in the manifest, for "ots verify" against your own Bitcoin node
// Exit code 0 when every check passes, 1 otherwise.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const require = createRequire(import.meta.url);
const KV = require(path.join(path.dirname(new URL(import.meta.url).pathname), 'kolaboro-verify.js'));

const args = process.argv.slice(2), file = args.find(a => !a.startsWith('--') && !/^(--files|--ots)$/.test(args[args.indexOf(a) - 1] || ''));
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!file) { console.log('usage: node check-bundle.mjs <manifest.json> [--files DIR] [--ots DIR]'); process.exit(2); }
const raw = fs.readFileSync(file);
const M = JSON.parse(raw.toString('utf8'));
let fails = 0;
const ok = (good, what) => { console.log((good ? 'PASS ' : 'FAIL ') + what); if (!good) fails++; };
const info = t => console.log('     ' + t);
const sha = async b => [...new Uint8Array(await crypto.subtle.digest('SHA-256', typeof b === 'string' ? new TextEncoder().encode(b) : b))].map(x => x.toString(16).padStart(2, '0')).join('');

console.log('Kolaboro evidence bundle ' + M.subject.type + ' ' + M.subject.id + ', created ' + M.created_at);
console.log('manifest SHA-256 ' + await sha(raw) + ' (compare with the cover of the PDF)');
if (M.format !== 'kolaboro-bundle-v1') ok(false, 'unknown format ' + M.format);
const pub = M.public_key.raw_b64;
info('public key ' + M.public_key.kid + ' ' + pub + ' (compare with kolaboro.com/.well-known/kolaboro-keys.json and the kolaboro-open repository)');

// exhibits
const otsOut = [];
for (const x of M.exhibits) {
  const tag = 'exhibit ' + x.no + ' (' + x.ref + ')';
  if (x.body != null) {
    ok(await sha(x.body) === x.sha256, tag + ': SHA-256 of the copied answer');
    if (x.signature) ok(await KV.verifySignature(x.body, x.signature, pub), tag + ': Ed25519 signature');
    if (x.ref === 'proof') ok(await KV.verifyProof(JSON.parse(x.body)), tag + ': Merkle proof of the page fingerprint');
  } else if (x.item) {
    const it = x.item;
    if (x.receipt) {
      ok(await sha(x.receipt.body) === x.receipt.sha256, tag + ': SHA-256 of the signed receipt');
      if (x.receipt.signature) ok(await KV.verifySignature(x.receipt.body, x.receipt.signature, pub), tag + ': receipt signature');
      const r = JSON.parse(x.receipt.body);
      ok(r.sha256 === it.sha256 && r.chain === it.chain, tag + ': receipt names the same SHA-256 and chain value');
      if (r.passkey) { const v = await KV.verifyPhotoSignature(r); ok(v.ok, tag + ': passkey signature of the capture' + (v.ok ? '' : ' (' + v.why + ')')); }
    } else info(tag + ': no receipt in the bundle (SHA-256 ' + it.sha256 + ')');
  } else info(tag + ': not copied (large file); SHA-256 ' + x.sha256);
  if (x.timestamp && x.timestamp.ots_b64) otsOut.push([x.sha256, x.timestamp.ots_b64]);
}

// case fingerprint chain
if (M.chain) {
  const iso = t => t ? new Date(t).toISOString().slice(0, 19) + 'Z' : '';
  let prev = null, good = true;
  for (const e of M.chain.items) { const h = await sha((prev || 'genesis:' + M.chain.case_id) + '|' + e.sha256 + '|' + e.kind + '|' + iso(e.taken_at)); if (h !== e.chain || (e.prev || null) !== prev) { good = false; info('item ' + e.id + ' does not chain'); } prev = e.chain; }
  ok(good && prev === M.chain.head, 'case fingerprint chain recomputes (' + M.chain.items.length + ' items, head ' + M.chain.head + ')');
  if (M.chain.head_timestamp && M.chain.head_timestamp.ots_b64) otsOut.push([M.chain.head, M.chain.head_timestamp.ots_b64]);
}

// public log
const L = M.log, heads = JSON.parse(L.body).heads || [];
if (L.signature) ok(await KV.verifySignature(L.body, L.signature, pub), 'public log answer: Ed25519 signature');
const lv = await KV.verifyLog(heads); ok(lv.ok, 'public log: ' + lv.checked + ' heads recompute and link' + (lv.ok ? '' : ': ' + lv.errors.join('; ')));
const cp = await KV.verifyCheckpoint(L.checkpoint.text, pub); ok(cp.ok, 'signed checkpoint: size ' + cp.size + ', root ' + cp.root);
if (L.head) {
  ok(await KV.headHash(L.head) === L.head.head, 'log line ' + L.head.day + ' recomputes');
  ok(heads.some(h => h.day === L.head.day && h.head === L.head.head), 'log line ' + L.head.day + ' is in the signed log answer');
  if (L.inclusion) {
    if (L.inclusion.signature) ok(await KV.verifySignature(L.inclusion.body, L.inclusion.signature, pub), 'inclusion proof answer: Ed25519 signature');
    const p = JSON.parse(L.inclusion.body);
    ok(p.leaf === L.head.day + ' ' + L.head.head && await KV.verifyInclusion(p.leaf, p.leaf_index, p.tree_size, p.path, p.root_hash) && p.root_hash === cp.root && p.tree_size === cp.size, 'log line ' + L.head.day + ' is leaf ' + p.leaf_index + ' of the signed checkpoint tree');
  }
  for (const x of M.exhibits) {
    if (!x.in_log_day) continue;
    const named = (x.dataset_sha256 && x.dataset_sha256 === L.head.dataset_sha256) || (x.ref === 'proof' && JSON.parse(x.body).projects_root === L.head.projects_root);
    ok(named, 'exhibit ' + x.no + ' (' + x.ref + ') data is named in log line ' + L.head.day);
  }
  if (L.head_timestamp && L.head_timestamp.ots_b64) otsOut.push([L.head.head, L.head_timestamp.ots_b64]);
}
if (M.chain && M.chain.evidence_root_day) {
  const h = heads.find(x => x.day === M.chain.evidence_root_day);
  ok(!!h && await KV.verifyEvidenceLines(M.chain.evidence_lines, h.evidence_root), 'case evidence lines reproduce the evidence root of ' + M.chain.evidence_root_day);
}

// originals
const fd = opt('--files');
if (fd) {
  const want = new Map(M.exhibits.map(x => [x.sha256, x]));
  for (const n of fs.readdirSync(fd)) { const p = path.join(fd, n); if (!fs.statSync(p).isFile()) continue; const h = await sha(fs.readFileSync(p)); const x = want.get(h); ok(!!x, n + (x ? ' is exhibit ' + x.no + ' (' + x.title + ')' : ' matches no exhibit (' + h + ')')); }
}

// Bitcoin timestamps
for (const [h, b64] of otsOut) {
  const bytes = Buffer.from(b64, 'base64');
  let at = []; try { at = await KV.otsBitcoin(new Uint8Array(bytes), h); } catch (e) { info('timestamp of ' + h.slice(0, 16) + '...: ' + e.message); }
  info('timestamp of ' + h.slice(0, 16) + '...: ' + (at.length ? at.map(a => 'Bitcoin block ' + a.height + ' merkle root ' + a.merkle_root).join('; ') : 'no Bitcoin attestation inside this copy of the proof yet (pending, or upgrade it with "ots upgrade")'));
  const od = opt('--ots'); if (od) { fs.mkdirSync(od, { recursive: true }); fs.writeFileSync(path.join(od, h + '.ots'), bytes); }
}
if (opt('--ots')) info('wrote ' + otsOut.length + ' .ots file(s) to ' + opt('--ots') + ': run "ots verify -d <sha256> <file>.ots" against your own Bitcoin node');
console.log(fails ? '\n' + fails + ' check(s) FAILED' : '\nAll checks passed.');
process.exit(fails ? 1 : 0);
