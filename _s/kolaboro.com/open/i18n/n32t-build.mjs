// kolaboro.com n32t (19 Nov 2026): builds the page dictionaries of the translation layer (worker kbx_n32t.js, browser /k/n32t.js).
// Run from the repository root:  node _s/kolaboro.com/open/i18n/n32t-build.mjs [--live]
// Sources: _s/kolaboro.com/open/i18n/src/<page>.tsv, one line per English fragment:
//   english <TAB> es <TAB> fr <TAB> de <TAB> ru <TAB> zh <TAB> ar <TAB> nl
//   "#t" / "#d" / "#h" in the first column: page title, meta description (<= 160 characters, checked), heading.
//   "=" as the only translation: the fragment stays as written in every language (names, codes, quotes in the original language).
//   "{name}" in the English text: a pattern; the matching part is put back (translated when it is itself a known fragment or a date).
// Output: _s/kolaboro.com/data/n32t/<lang>/<page>.json and data/n32t/manifest.json. A language is listed for a page in the manifest
// only when the dictionary covers every fragment of the English <main> (static file; /new/ and /vs/ read live with --live, where
// project names are data and stay as written). Exit code 1 when a description is too long or a TSV line is malformed.
import fs from 'fs';
import path from 'path';
const ROOT = process.cwd(), SRC = path.join(ROOT, '_s/kolaboro.com/open/i18n/src'), OUT = path.join(ROOT, '_s/kolaboro.com/data/n32t');
const COLS = ['es', 'fr', 'de', 'ru', 'zh', 'ar', 'nl'];
const M = await import(path.join(ROOT, '_worker.js/kbx_n32t.js'));
let bad = 0;
function parse(f) {
  const o = { s: {}, p: {}, t: {}, d: {}, h: {}, keep: new Set(), n: 0 };
  fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (!line.trim() || line.startsWith('//')) return;
    const c = line.split('\t'); const en = c[0];
    if (c.length === 2 && c[1] === '=') { o.keep.add(en); o.n++; return; }
    if (c.length !== 8) { console.error(path.basename(f) + ':' + (i + 1) + ' has ' + c.length + ' columns: ' + line.slice(0, 80)); bad++; return; }
    COLS.forEach((l, j) => { const v = c[j + 1] === '=' ? (en[0] === '#' ? null : en) : c[j + 1]; if (v == null) return;
      if (en === '#t' || en === '#d' || en === '#h') o[en[1]][l] = v; else if (/\{\w+\}/.test(en)) (o.p[l] = o.p[l] || []).push([en, v]); else (o.s[l] = o.s[l] || {})[en] = v; });
    o.n++;
  });
  return o;
}
const files = fs.readdirSync(SRC).filter(f => f.endsWith('.tsv')), common = files.includes('_common.tsv') ? parse(path.join(SRC, '_common.tsv')) : parse('/dev/null');
const LANGS = ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const manifest = { v: 0, built: new Date().toISOString().slice(0, 10), pages: {} };
const live = process.argv.includes('--live');
let names = new Set();
try { const nj = JSON.parse(fs.readFileSync(path.join(ROOT, '_s/kolaboro.com/data/named.json'), 'utf8')); for (const x of (nj.projects || nj.P || nj)) { if (x && (x.n || x.name)) names.add(String(x.n || x.name).replace(/\s+/g, ' ').trim()); if (x && (x.dv || x.developer)) names.add(String(x.dv || x.developer).replace(/\s+/g, ' ').trim()); } } catch (e) {}
const report = [];
for (const l of LANGS) fs.mkdirSync(path.join(OUT, l), { recursive: true });
for (const l of LANGS) {
  const keep = Object.fromEntries([...common.keep].map(k => [k, k]));
  fs.writeFileSync(path.join(OUT, l, '_common.json'), JSON.stringify({ s: Object.assign(keep, common.s[l] || {}), p: common.p[l] || [] }));
}
for (const f of files.filter(f => f !== '_common.tsv')) {
  const key = f.replace(/\.tsv$/, ''), page = parse(path.join(SRC, f)), route = key.replace(/^tools-/, 'tools/');
  let en = null;
  if (route === 'new' || route === 'vs') { if (live) { try { en = await (await fetch('https://kolaboro.com/' + route + '/')).text(); } catch (e) { en = null; } } }
  else if (route !== 'm') en = fs.readFileSync(path.join(ROOT, '_s/kolaboro.com', route, 'index.html'), 'utf8');
  const main = en ? ((/<main[^>]*>([\s\S]*)<\/main>/.exec(en) || [])[1] || '') : '';
  const ok = [];
  for (const l of LANGS) {
    const keep = Object.fromEntries([...common.keep, ...page.keep].map(k => [k, k]));
    const j = { t: page.t[l], d: page.d[l], h: page.h[l], s: Object.assign(keep, page.s[l] || {}), p: page.p[l] || [] };
    if (!j.t || !j.d) { report.push(key + ' ' + l + ': no title or description'); continue; }
    if (j.d.length > 160) { console.error(key + ' ' + l + ': description ' + j.d.length + ' characters'); bad++; }
    fs.writeFileSync(path.join(OUT, l, key + '.json'), JSON.stringify(j));
    const D = M.mkDict(l, { s: Object.assign({}, keep, common.s[l] || {}, j.s), p: (common.p[l] || []).concat(j.p) });
    let miss = route === 'm' ? [] : (main ? M.missing(main, D) : null);
    if (miss) miss = miss.filter(s => !names.has(s) && !/^.+ vs .+$/.test(s));
    if (miss === null) { report.push(key + ' ' + l + ': English page not read (run with --live), kept as before'); try { const old = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8')); if ((old.pages[route] || []).includes(l)) ok.push(l); } catch (e) {} continue; }
    if (miss.length) report.push(key + ' ' + l + ': ' + miss.length + ' fragments missing: ' + miss.slice(0, 6).map(s => JSON.stringify(s.slice(0, 60))).join(', '));
    else ok.push(l);
  }
  if (ok.length) manifest.pages[route] = ok;
}
manifest.v = Object.entries(manifest.pages).map(([k, v]) => k + v.join('')).join('|').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36) + '-' + Date.now().toString(36).slice(-4);
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
// static sitemap (/sitemap.xml, read by kbx_seo.js staticPages: alternates follow from which language URLs are listed)
const SM = path.join(ROOT, '_s/kolaboro.com/sitemap.xml'); let sm = fs.readFileSync(SM, 'utf8'); const day = manifest.built; let added = 0;
for (const [route, L] of Object.entries(manifest.pages)) for (const l of ['en'].concat(L)) {
  const loc = 'https://kolaboro.com' + (l === 'en' ? '' : '/' + l) + '/' + route + '/';
  if (sm.includes('<loc>' + loc + '</loc>')) continue;
  sm = sm.replace('</urlset>', '<url><loc>' + loc + '</loc><lastmod>' + day + '</lastmod></url>\n</urlset>'); added++;
}
fs.writeFileSync(SM, sm); console.log('sitemap.xml: ' + added + ' URLs added');
console.log(report.join('\n'));
console.log('pages live: ' + Object.entries(manifest.pages).map(([k, v]) => k + ' ' + v.length).join(', '));
process.exit(bad ? 1 : 0);
