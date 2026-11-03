// Cross-check: the browser hash (kdh.js in Chromium) and the index hash (kdhash.py) must agree on the same files.
// Usage: node kdhash_crosscheck.mjs path/to/kdh.js img1 img2 ...   (needs playwright + chromium, python3 with pillow/numpy)
import { createRequire } from 'node:module';
const { chromium } = createRequire(process.cwd() + '/')(process.env.PLAYWRIGHT_PATH || 'playwright');
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [kdhJs, ...files] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const py = JSON.parse(execFileSync('python3', [join(here, 'kdhash.py'), ...files]).toString());
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><title>x</title>');
await page.addScriptTag({ content: readFileSync(kdhJs, 'utf8') });
let bad = 0, n = 0;
const ham = (a, b) => [...(BigInt('0x' + a) ^ BigInt('0x' + b)).toString(2)].filter(x => x === '1').length;
for (const f of files) {
  const b64 = readFileSync(f).toString('base64');
  const js = await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const r = await KDH.fromBlob(new Blob([bin]));
    return r && [r.h, r.c];
  }, b64);
  const p = py[f];
  n++;
  const dh = js && p ? ham(js[0], p[0]) : 'n/a', dc = js && p ? ham(js[1], p[1]) : 'n/a';
  if (dh !== 0 || dc !== 0) bad++;
  console.log(`${dh === 0 && dc === 0 ? 'SAME' : 'DIFF'}  h ${p && p[0]} js ${js && js[0]} (d=${dh})  c d=${dc}  ${f}`);
}
await browser.close();
console.log(`${n - bad}/${n} identical`);
process.exit(bad ? 1 : 0);
