// node n35a-ask-test.mjs [site dir]: runs the 30 question patterns x 8 languages of n35a-ask-tests.json through the /data/ask/ parser
import fs from 'fs'; import path from 'path'; import url from 'url'; import vm from 'vm';
const here = path.dirname(url.fileURLToPath(import.meta.url)), site = process.argv[2] || path.join(here, '..');
const ctx = {}; ctx.globalThis = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(site, 'k/n35a/ask.js'), 'utf8'), ctx);
const V = JSON.parse(fs.readFileSync(path.join(site, 'data/n35a/ask-vocab.json'), 'utf8'));
const T = JSON.parse(fs.readFileSync(path.join(here, 'n35a-ask-tests.json'), 'utf8'));
const norm = f => JSON.stringify(f.map(x => x.map(String)).sort());
let ok = 0, bad = 0;
for (const p of T.patterns) for (const [l, q] of Object.entries(p.q)) {
  const c = ctx.KBASK.parse(q, l, V);
  const got = c ? { f: norm(c.f), g: c.g || null, m: c.m } : null, exp = { f: norm(p.f), g: p.g, m: p.m };
  if (got && got.f === exp.f && got.g === exp.g && got.m === exp.m) ok++;
  else { bad++; console.log('FAIL', p.n, l, q, '\n  got ', JSON.stringify(got), '\n  want', JSON.stringify(exp)); }
}
console.log('ask tests: ' + ok + ' passed, ' + bad + ' failed of ' + (ok + bad));
process.exit(bad ? 1 : 0);
