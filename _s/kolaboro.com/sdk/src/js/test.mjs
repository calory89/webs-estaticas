// Tests of the built ES module against production (node --test sdk/src/js/test.mjs). Node 20+.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Kolaboro, KolaboroError, KolaboroSignatureError, verify, VERSION } from '../../kolaboro.mjs';

const BASE = process.env.KOLABORO_BASE || 'https://kolaboro.com';
const k = new Kolaboro({ baseUrl: BASE });

test('version and bundled verifier', () => { assert.equal(VERSION, '0.1.0'); assert.ok(verify.version); });

test('stats: signed and signature checked', async () => {
  const s = await k.stats();
  assert.ok(s.projects > 0 && s.markets > 0);
  assert.equal(k.last.signature.checked, true); assert.equal(k.last.signature.ok, true);
  assert.match(k.last.datasetSha256, /^[0-9a-f]{64}$/);
});

test('one project has the documented shape', async () => {
  const d = await k.project('BALI-014');
  for (const f of ['id', 'market', 'country', 'score', 'max', 'checks', 'verification', 'claims', 'url']) assert.ok(f in d.project, f);
  assert.ok(d.project.score >= 0 && d.project.score <= d.project.max);
});

test('filters: market=Bali returns only Bali', async () => {
  const l = await k.projects({ market: 'Bali', limit: 50 });
  assert.ok(l.projects.length > 0); assert.ok(l.projects.every(p => p.market === 'Bali'));
});

test('allProjects pages through everything', async () => {
  const s = await k.stats(); let n = 0; for await (const p of k.allProjects()) { if (p.id) n++; }
  assert.equal(n, s.projects);
});

test('markets and freshness', async () => {
  const m = await k.markets(); assert.ok(m.markets.length > 0 && m.markets.every(x => x.transparency_index >= 0 && x.transparency_index <= 100));
  const f = await k.freshness(); assert.equal(typeof f.pct_7d, 'number');
});

test('unknown project: KolaboroError 404', async () => {
  await assert.rejects(k.project('NOPE-000'), e => e instanceof KolaboroError && e.status === 404);
});

test('a tampered answer is refused', async () => {
  const evil = async (url, init) => { const r = await fetch(url, init); const t = (await r.text()).replace(/"projects": (\d+)/, (a, n) => '"projects": ' + (+n + 1)); return new Response(t, { status: r.status, headers: r.headers }); };
  const bad = new Kolaboro({ baseUrl: BASE, fetch: evil });
  await assert.rejects(bad.stats(), e => e instanceof KolaboroSignatureError);
});

test('an unsigned answer is refused', async () => {
  const strip = async (url, init) => { const r = await fetch(url, init); const h = new Headers(r.headers); h.delete('x-kolaboro-signature'); return new Response(await r.text(), { status: r.status, headers: h }); };
  await assert.rejects(new Kolaboro({ baseUrl: BASE, fetch: strip }).stats(), e => e instanceof KolaboroSignatureError);
});

test('project fingerprint is in the daily Merkle root', async () => {
  const r = await k.verifyProject('BALI-014'); assert.equal(r.ok, true);
});

test('checkpoint note signature', async () => {
  const c = await k.checkpoint(); assert.equal(c.ok, true); assert.equal(c.origin, 'kolaboro.com/log'); assert.match(c.root, /^[0-9a-f]{64}$/);
});

test('full public log audit', async () => {
  const a = await k.auditLog(); assert.equal(a.ok, true, JSON.stringify(a));
});

test('published test vectors', async () => {
  const V = await (await fetch(BASE + '/open/test-vectors.json')).json();
  const s = V.signature; assert.equal(await verify.verifySignature(s.body, s.signature, s.public_key_raw_b64 || 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw='), true);
  assert.equal(await verify.verifySignature(s.body + ' ', s.signature, s.public_key_raw_b64 || 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw='), false);
  assert.equal((await verify.verifyLog(V.log_heads)).ok, true);
});
