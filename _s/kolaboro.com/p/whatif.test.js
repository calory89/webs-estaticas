#!/usr/bin/env node
/* Test: the JavaScript scoring in /p/whatif.js must reproduce the published scores exactly.
   1. For every project in the published dataset: score, vscore and tier recomputed from checks/verified/flags = published values.
   2. 5,000 random inputs: JavaScript and the open Python rules (/open/scoring.py) give the same score, vscore and tier.
   3. Every counterfactual is internally consistent (one published check adds exactly one point, one confirmation one vscore point).
   Usage: node p/whatif.test.js [bali-cases.json]   (default: downloads https://kolaboro.com/data/bali-cases.json). Exit 1 on any mismatch. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
global.window = globalThis;
const S = require('./whatif.js');
require('../transparency-index/ti-core.js');
const KTI = globalThis.KTI;

async function main() {
  const src = process.argv[2];
  const d = src ? JSON.parse(fs.readFileSync(src, 'utf8')) : await (await fetch('https://kolaboro.com/data/bali-cases.json')).json();
  const C = d.cases; let bad = 0;
  for (const c of C) {
    const e = S.evaluate(c);
    if (e.score !== c.score || e.vscore !== (c.vscore || 0) || e.tier !== c.tier) { bad++; if (bad < 10) console.log('MISMATCH', c.id, e, { score: c.score, vscore: c.vscore, tier: c.tier }); }
  }
  console.log('1. published projects: ' + (C.length - bad) + ' of ' + C.length + ' match (score, vscore, tier)');

  // 2. random inputs against the Python rules
  let rnd = 7; const r = n => (rnd = (rnd * 1103515245 + 12345) % 2147483648) % n;
  const LV = ['registry', 'independent', 'developer', 'contradicted', 'none', 'Registry (land office)', 'independent press', null];
  const X = [];
  for (let i = 0; i < 5000; i++) {
    const ck = { permit: r(3), escrow: [null, true, false][r(3)], progress: [null, 40, 'updates', 0][r(4)], plans: !!r(2), record: !!r(2), returns_ok: !!r(2) };
    const v = {}; ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'].forEach(k => { if (r(5)) v[k] = LV[r(LV.length)]; });
    X.push({ ck, v, flags: r(4) ? [] : ['Legal dispute reported'], researched: r(5) ? 6 : 3 });
  }
  const py = cp.spawnSync('python3', ['-I', '-B', '-c', `
import sys, json
sys.path.insert(0, sys.argv[1])
import scoring
out = []
for x in json.load(sys.stdin):
    s = scoring.score(x['ck'])
    out.append([int(s), scoring.confirmed_score(x['v']), scoring.tier(s, x['flags'], x['researched'])])
print(json.dumps(out))`, path.join(__dirname, '..', 'open')], { input: JSON.stringify(X), encoding: 'utf8' });
  let bad2 = 0;
  if (py.status !== 0) { console.log('2. python not available, skipped', py.stderr.slice(0, 200)); }
  else {
    const P = JSON.parse(py.stdout);
    X.forEach((x, i) => {
      const s = S.score(x.ck), j = [s, S.vscore(x.v), S.tier(s, x.flags, x.researched)];
      if (JSON.stringify(j) !== JSON.stringify(P[i])) { bad2++; if (bad2 < 5) console.log('PY MISMATCH', JSON.stringify(x), j, P[i]); }
    });
    console.log('2. random inputs vs open/scoring.py: ' + (X.length - bad2) + ' of ' + X.length + ' match');
  }

  // 3. counterfactual consistency on every project
  let bad3 = 0, n3 = 0;
  for (const c of C) {
    const w = S.whatIf(c, C, KTI);
    for (const it of w.items) {
      n3++;
      const ok = it.kind === 'publish' ? it.score[1] === it.score[0] + 1 && it.vscore[1] === it.vscore[0]
        : it.kind === 'confirm' ? it.vscore[1] === it.vscore[0] + 1 && it.score[1] === it.score[0]
        : it.kind === 'flags' ? it.tier[1] !== 'caution' || it.score[0] <= 1
        : it.kind === 'all' ? it.score[1] === 6 : false;
      const mk = !it.market || (it.kind === 'flags' || it.market.to >= it.market.from);
      if (!ok || !mk) { bad3++; if (bad3 < 5) console.log('CF BAD', c.id, JSON.stringify(it)); }
    }
  }
  console.log('3. counterfactuals: ' + (n3 - bad3) + ' of ' + n3 + ' consistent');
  process.exit(bad || bad2 || bad3 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
