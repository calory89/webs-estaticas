// Lighthouse on kolaboro.com's 20 most important pages, mobile and desktop. Writes lighthouse.json for kolaboro.com/data/.
// Usage: node run.mjs <out dir>   (needs LIGHTHOUSE_BIN and CHROME_PATH)
// Thresholds: thresholds.json next to this file (per page and form factor). Without it, this is a baseline run: nothing fails,
// and proposed thresholds (first-run score minus a margin) are written to <out>/thresholds.proposed.json to be committed.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname), out = process.argv[2] || 'out';
fs.mkdirSync(out, { recursive: true });
const PAGES = JSON.parse(fs.readFileSync(path.join(here, 'pages.json'), 'utf8'));
const TH = fs.existsSync(path.join(here, 'thresholds.json')) ? JSON.parse(fs.readFileSync(path.join(here, 'thresholds.json'), 'utf8')) : null;
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];
const MARGIN = { performance: 10, accessibility: 3, 'best-practices': 5, seo: 3 };   // run-to-run noise allowance below the baseline
const AUD = { lcp_ms: 'largest-contentful-paint', fcp_ms: 'first-contentful-paint', tbt_ms: 'total-blocking-time', cls: 'cumulative-layout-shift', si_ms: 'speed-index' };
const version = execFileSync(process.env.LIGHTHOUSE_BIN, ['--version'], { encoding: 'utf8' }).trim();
const runs = [], flags = [], proposed = {};
for (const ff of ['mobile', 'desktop']) for (const p of PAGES) {
  const url = 'https://kolaboro.com' + p + (p.includes('?') ? '&' : '?') + 'lh=1', file = path.join(out, 'r.json');
  const args = [url, '--output=json', '--output-path=' + file, '--quiet', '--only-categories=' + CATS.join(','), '--chrome-flags=--headless=new --no-sandbox --disable-gpu', '--max-wait-for-load=45000'];
  if (ff === 'desktop') args.push('--preset=desktop');
  let r = null, err = null;
  for (let i = 0; i < 2 && !r; i++) { try { execFileSync(process.env.LIGHTHOUSE_BIN, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: 180000 }); r = JSON.parse(fs.readFileSync(file, 'utf8')); if (r.runtimeError) { err = r.runtimeError.code; r = null; } } catch (e) { err = String(e.message || e).slice(0, 160); } }
  const row = { page: p, form_factor: ff };
  if (!r) { row.error = err; runs.push(row); flags.push({ page: p, form_factor: ff, category: 'run', why: 'Lighthouse could not run: ' + err }); console.log(ff, p, 'ERROR', err); continue; }
  row.scores = {}; for (const c of CATS) row.scores[c] = r.categories[c] && r.categories[c].score != null ? Math.round(r.categories[c].score * 100) : null;
  row.metrics = {}; for (const [k, a] of Object.entries(AUD)) { const v = r.audits[a] && r.audits[a].numericValue; row.metrics[k] = v == null ? null : k === 'cls' ? +v.toFixed(3) : Math.round(v); }
  row.failing_audits = Object.values(r.audits).filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary').map(a => a.id).slice(0, 12);
  const key = ff + ' ' + p; proposed[key] = {};
  for (const c of CATS) {
    const s = row.scores[c]; if (s == null) continue;
    proposed[key][c] = Math.max(0, s - MARGIN[c]);
    const min = TH && TH[key] && TH[key][c];
    if (min != null && s < min) flags.push({ page: p, form_factor: ff, category: c, score: s, threshold: min });
  }
  runs.push(row); console.log(ff, p, JSON.stringify(row.scores), JSON.stringify(row.metrics));
}
const avg = (ff, c) => { const L = runs.filter(r => r.form_factor === ff && r.scores && r.scores[c] != null).map(r => r.scores[c]); return L.length ? Math.round(L.reduce((a, b) => a + b, 0) / L.length) : null; };
const minOf = (ff, c) => { const L = runs.filter(r => r.form_factor === ff && r.scores && r.scores[c] != null).map(r => r.scores[c]); return L.length ? Math.min(...L) : null; };
const summary = {}; for (const ff of ['mobile', 'desktop']) { summary[ff] = {}; for (const c of CATS) summary[ff][c] = { average: avg(ff, c), lowest: minOf(ff, c), pages_at_100: runs.filter(r => r.form_factor === ff && r.scores && r.scores[c] === 100).length }; }
const res = { generated: new Date().toISOString(), tool: 'Lighthouse ' + version, run: process.env.GITHUB_RUN_ID ? 'https://github.com/' + process.env.GITHUB_REPOSITORY + '/actions/runs/' + process.env.GITHUB_RUN_ID : null,
  method: 'One Lighthouse run per page and form factor on a GitHub Actions runner (ubuntu-latest), mobile with Lighthouse\'s default throttling and desktop with --preset=desktop. Scores move a few points between runs, so each threshold is the first measured score minus a margin.',
  pages: PAGES.length, baseline: !TH, thresholds_margin: MARGIN, summary, flags, runs };
fs.writeFileSync(path.join(out, 'lighthouse.json'), JSON.stringify(res, null, 1));
if (!TH) fs.writeFileSync(path.join(out, 'thresholds.proposed.json'), JSON.stringify(proposed, null, 1));
console.log('flags', flags.length, JSON.stringify(summary));
fs.writeFileSync(path.join(out, 'flags.txt'), String(flags.length));
