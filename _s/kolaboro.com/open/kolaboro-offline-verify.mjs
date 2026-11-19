#!/usr/bin/env node
// kolaboro-offline-verify.mjs 1.0 (19 Nov 2026), MIT licence. Checks Kolaboro's published records OFFLINE, from files you saved.
// Node 18+, no packages (Ed25519 and SHA-256 from node:crypto). Same checks and answers as kolaboro_offline_verify.py.
// Exit code 0 = every check passed. Docs: https://kolaboro.com/verify/offline/
//   node kolaboro-offline-verify.mjs chain index.json [copy.json.gz ...]
//   node kolaboro-offline-verify.mjs cert cert.json
//   node kolaboro-offline-verify.mjs sig body.json <x-kolaboro-signature>
//   node kolaboro-offline-verify.mjs provenance prov.json
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
// a real signature made by the site key: header of GET /api/v1/snapshots on 19 Nov 2026 and the SHA-256 of that body
const VEC = ['03f5a5f80c7895ab9f14e43605056419e01cfea6d3cb1243517f7648e9bcbd62', 'PiEDZ4cOEzrHb/AjJ6iBwML3hkk4CcODOcHdhd9rmr59bckrMxOzn6prwEk54SfxyMCYT6/7FnqjIAZo/NPOCg=='];
function selftest() {
  say(hx('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256 test vector');
  say(sigOk(VEC[0], VEC[1]), 'Ed25519: real signature verifies');
  const bad = VEC[0].slice(0, -1) + (VEC[0].slice(-1) !== '0' ? '0' : '1'); say(!sigOk(bad, VEC[1]), 'Ed25519: one changed character is rejected');
  say(canon({ b: 1, a: [1, 'é', null] }) === '{"a":[1,"é",null],"b":1}', 'canonical JSON');
}
const [c, ...a] = process.argv.slice(2);
if (!['chain', 'cert', 'sig', 'provenance', 'selftest'].includes(c)) { console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 10).join('\n')); process.exit(2); }
if (c === 'chain') chain(a[0], a.slice(1)); else if (c === 'cert') cert(a[0]); else if (c === 'sig') sig(a[0], a[1]); else if (c === 'provenance') prov(a[0]); else selftest();
console.log(okAll ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'); process.exit(okAll ? 0 : 1);
