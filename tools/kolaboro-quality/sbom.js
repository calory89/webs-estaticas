// CycloneDX 1.5 software bill of materials for kolaboro.com (block W6, 5 Nov 2026).
// Sources, all observed, nothing typed in by hand:
//   1. resources.json from run.js: every script, stylesheet and font the 20 key pages actually loaded in Chromium,
//      with the integrity attribute the browser saw on the tag;
//   2. the HTML of every page in sitemap.xml: <script src> and <link rel=stylesheet|preload> tags and their integrity attributes;
//   3. the worker source files (WORKER_DIR, copied from branch pub/_lovable): file hashes, import specifiers (npm packages),
//      and the external hosts the code calls with fetch().
// Each third-party file is downloaded once to compute its SHA-384 (the hash an SRI attribute would need) and SHA-256.
// Licences come from the package registry that serves the file (npm registry for jsDelivr/unpkg, cdnjs API for cdnjs);
// when the source declares none, the component has no licence field and says so in a property.
// Usage: node sbom.js <outdir>   env: BASE, WORKER_DIR, RESOURCES (default <outdir>/resources.json)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const BASE = process.env.BASE || 'https://kolaboro.com';
const OUT = process.argv[2] || 'out';
const RES = process.env.RESOURCES || path.join(OUT, 'resources.json');
const WORKER_DIR = process.env.WORKER_DIR || '';
const UA = { 'user-agent': 'kolaboro-sbom/1.0 (+https://kolaboro.com/security/)' };
const OWN = h => h === 'kolaboro.com' || h.endsWith('.kolaboro.com');

const VENDORS = [
  [/^www\.googletagmanager\.com$/, /^\/gtag\/js/, 'Google tag (gtag.js)', 'Google'],
  [/^www\.clarity\.ms$/, /^\/tag\//, 'Microsoft Clarity loader', 'Microsoft'],
  [/^scripts\.clarity\.ms$/, /clarity\.js$/, 'Microsoft Clarity', 'Microsoft'],
  [/^static\.cloudflareinsights\.com$/, /^\/beacon\.min\.js/, 'Cloudflare Web Analytics beacon', 'Cloudflare'],
  [/./, /^\/cdn-cgi\/zaraz\//, 'Cloudflare Zaraz (tag manager injected by Cloudflare)', 'Cloudflare'],
  [/./, /^\/cdn-cgi\/challenge-platform\//, 'Cloudflare challenge platform', 'Cloudflare'],
];

async function get(url, asJson) {
  for (let k = 0; k < 3; k++) {
    try {
      const r = await fetch(url, { headers: UA, redirect: 'follow' });
      if (!r.ok) { if (r.status < 500) return null; } else return asJson ? await r.json() : Buffer.from(await r.arrayBuffer());
    } catch (e) {}
    await new Promise(z => setTimeout(z, 1500 * (k + 1)));
  }
  return null;
}
const h = (alg, buf) => crypto.createHash(alg).update(buf).digest();
async function pool(items, n, fn) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const j = i++; out[j] = await fn(items[j]); } })); return out; }

function identify(u) {
  const x = new URL(u), host = x.hostname, p = x.pathname;
  let m;
  if ((m = p.match(/^\/ajax\/libs\/([^/]+)\/([^/]+)\//)) && host === 'cdnjs.cloudflare.com') return { key: 'cdnjs:' + m[1] + '@' + m[2] + ':' + p, name: m[1], version: m[2], file: p.split('/').slice(5).join('/'), registry: 'cdnjs', purl: 'pkg:cdnjs/' + m[1] + '@' + m[2], supplier: 'cdnjs (Cloudflare)', versioned: true };
  if ((m = p.match(/^\/npm\/((?:@[^/]+\/)?[^/@]+)@([^/]+)(\/.*)?$/)) && host === 'cdn.jsdelivr.net') return { key: 'npm:' + m[1] + '@' + m[2] + ':' + (m[3] || ''), name: m[1], version: m[2], file: (m[3] || '').slice(1), registry: 'npm', purl: 'pkg:npm/' + m[1].replace('@', '%40') + '@' + m[2], supplier: 'jsDelivr', versioned: true };
  if ((m = p.match(/^\/((?:@[^/]+\/)?[^/@]+)@([^/]+)(\/.*)?$/)) && host === 'unpkg.com') return { key: 'npm:' + m[1] + '@' + m[2] + ':' + (m[3] || ''), name: m[1], version: m[2], file: (m[3] || '').slice(1), registry: 'npm', purl: 'pkg:npm/' + m[1].replace('@', '%40') + '@' + m[2], supplier: 'unpkg', versioned: true };
  for (const [hr, pr, name, supplier] of VENDORS) if (hr.test(host) && pr.test(p)) {
    const v = (p.match(/\/(\d+\.\d+\.\d+(?:-[\w.]+)?)\//) || [])[1] || null;
    return { key: 'vendor:' + name + '@' + (v || ''), name, version: v, file: null, registry: null, purl: null, supplier, versioned: !!v, vendor: true };
  }
  return { key: 'url:' + host + p, name: host + p, version: (p.match(/(\d+\.\d+\.\d+)/) || [])[1] || null, file: null, registry: null, purl: null, supplier: host, versioned: /\d+\.\d+\.\d+/.test(p) };
}

async function licence(id) {
  try {
    if (id.registry === 'npm') { const j = await get('https://registry.npmjs.org/' + (id.npmName || id.name).replace('/', '%2F') + '/' + encodeURIComponent(id.version), true); const l = j && (typeof j.license === 'string' ? j.license : j.license && j.license.type); return l ? { value: l, source: 'registry.npmjs.org' } : null; }
    if (id.registry === 'cdnjs') { const j = await get('https://api.cdnjs.com/libraries/' + encodeURIComponent(id.name) + '?fields=license,repository', true); const l = j && (typeof j.license === 'string' ? j.license : j.license && j.license.name); return l ? { value: l, source: 'api.cdnjs.com' } : null; }
  } catch (e) {}
  return null;
}
// self-hosted vendor file name -> npm package name, where they differ (c2pa-web: tools/image-check/prov.js loads its wasm from @contentauth/c2pa-web)
const ALIAS = { 'c2pa-web': '@contentauth/c2pa-web', jsQR: 'jsqr', pdf: 'pdfjs-dist' };   // pdf-x.y.z.min.mjs is the pdf.js build published as pdfjs-dist
const SPDX = /^(MIT|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|MPL-2\.0|LGPL-[23]\.[01](-only|-or-later)?|GPL-[23]\.0(-only|-or-later)?|0BSD|Unlicense|CC0-1\.0|BlueOak-1\.0\.0|Hippocratic-2\.1)$/;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const seen = new Map();   // url -> { pages:Set, integrity, sources:Set, kind }
  const add = (url, page, integrity, src, kind) => {
    let u; try { u = new URL(url, BASE).href; } catch (e) { return; }
    if (!/^https:/.test(u)) return;
    const x = seen.get(u) || { pages: new Set(), integrity: null, sources: new Set(), kind };
    if (page) x.pages.add(page); if (integrity) x.integrity = integrity; x.sources.add(src); if (!x.kind) x.kind = kind;
    seen.set(u, x);
  };
  // 1. what the browser loaded
  let crawled = [];
  try { crawled = JSON.parse(fs.readFileSync(RES, 'utf8')); } catch (e) {}
  for (const r of crawled) {
    const kind = r.type === 'Stylesheet' || /css/.test(r.mime || '') || /\.css(\?|$)/.test(r.url) ? 'stylesheet' : r.type === 'Font' || /font|woff/.test(r.mime || '') ? 'font' : 'script';
    for (const p of r.pages) add(r.url, p, r.integrity, 'browser', kind);
  }
  // 2. tags in the HTML of every page in the sitemap
  const sm = (await get(BASE + '/sitemap.xml')) || Buffer.from('');
  const pages = [...new Set([...sm.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => u.startsWith(BASE)))];
  let htmlOk = 0; const texts = [];
  await pool(pages, 8, async (pu) => {
    const b = await get(pu); if (!b) return; htmlOk++;
    const html = b.toString('utf8'), page = pu.replace(BASE, '') || '/';
    texts.push({ page, text: html });
    for (const m of html.matchAll(/<script\b[^>]*>/gi)) { const t = m[0], s = (t.match(/\bsrc=["']([^"']+)["']/i) || [])[1]; if (s) add(s, page, (t.match(/\bintegrity=["']([^"']+)["']/i) || [])[1], 'html', 'script'); }
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const t = m[0], rel = ((t.match(/\brel=["']?([^"'\s>]+)/i) || [])[1] || '').toLowerCase(), s = (t.match(/\bhref=["']([^"']+)["']/i) || [])[1];
      if (!s || !/stylesheet|preload|modulepreload/.test(rel)) continue;
      const as = ((t.match(/\bas=["']?([^"'\s>]+)/i) || [])[1] || '').toLowerCase();
      if (rel === 'preload' && !/script|style|font/.test(as)) continue;
      add(s, page, (t.match(/\bintegrity=["']([^"']+)["']/i) || [])[1], 'html', as === 'font' ? 'font' : rel === 'stylesheet' || as === 'style' ? 'stylesheet' : 'script');
    }
  });
  // group into components; self-hosted copies of third-party libraries (vendor files named <name>-<x.y.z>.js) count as third party
  const comps = new Map();
  const group = (u, x) => {
    const url = new URL(u), own = OWN(url.hostname) && !url.pathname.startsWith('/cdn-cgi/');
    let id;
    let vm = own && url.pathname.match(/\/([A-Za-z][\w.]*?(?:-[A-Za-z][\w]*)*)-(\d+\.\d+\.\d+)(?:\.min)?\.(?:m?js|css)$/);
    if (vm && /^kolaboro/i.test(vm[1])) vm = null;   // our own versioned SDK (/sdk/kolaboro-x.y.z.mjs) is first party
    if (vm) { const npm = ALIAS[vm[1]] || vm[1].toLowerCase(); id = { key: 'self:' + vm[1] + '@' + vm[2] + ':' + url.pathname, name: vm[1], version: vm[2], registry: 'npm', npmName: npm, purl: 'pkg:npm/' + npm.replace('@', '%40') + '@' + vm[2], supplier: 'self-hosted copy on kolaboro.com', versioned: true, selfHosted: true }; }
    else id = own ? { key: 'own:' + url.pathname, name: url.pathname, version: url.searchParams.get('v'), supplier: 'Kolaboro', versioned: !!url.searchParams.get('v'), own: true } : identify(u);
    const c = comps.get(id.key) || Object.assign({ urls: new Map(), pages: new Set(), kinds: new Set(), sources: new Set() }, id);
    c.urls.set(u, x.integrity || c.urls.get(u) || null); x.pages.forEach(p => c.pages.add(p)); c.kinds.add(x.kind); x.sources.forEach(s => c.sources.add(s));
    comps.set(id.key, c);
    return c;
  };
  for (const [u, x] of seen) group(u, x);
  const hashOne = async (c) => {
    if (c.done) return; c.done = true;
    const u = [...c.urls.keys()][0];
    const body = await get(u);
    if (body) { c.sha384 = h('sha384', body); c.sha256 = h('sha256', body); c.bytes = body.length; if (c.own && body.length < 3e6) texts.push({ page: c.name, text: body.toString('utf8'), file: true }); }
    if (!c.own) c.lic = await licence(c);
    // does any tag carry an integrity attribute, and does it match the file we downloaded?
    const ints = [...c.urls.values()].filter(Boolean);
    c.sri_on_tag = ints.length > 0;
    c.sri_matches = null;
    if (ints.length && body) c.sri_matches = ints.every(s => s.split(/\s+/).some(t => { const [alg, b64] = t.split('-'); try { return ['sha256', 'sha384', 'sha512'].includes(alg) && h(alg, body).toString('base64') === b64; } catch (e) { return false; } }));
  };
  await pool([...comps.values()], 6, hashOne);
  // 2b. libraries that first-party code or inline scripts load at runtime (only on demand, so a crawl may not see them):
  //     CDN URLs and self-hosted vendor paths written in the page HTML or in our own scripts, e.g. DuckDB on /sql/
  const refs = new Map();
  for (const t of texts) {
    for (const m of t.text.matchAll(/https:\/\/(?:cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|esm\.sh|ga\.jspm\.io)\/[^\s'"`)<>]+/g)) {
      let u = m[0];
      if (u.endsWith('@')) {   // 'https://cdn.jsdelivr.net/npm/pkg@' + VERSION + '/...': read VERSION from the same file
        const after = t.text.slice(m.index + u.length + 1, m.index + u.length + 80), vn = (after.match(/^\s*\+\s*([A-Za-z_$][\w$]*)/) || [])[1];
        const vv = vn && (t.text.match(new RegExp('\\b' + vn.replace('$', '\\$') + '\\s*=\\s*[\'"](\\d+\\.\\d+\\.\\d+[^\'"]*)[\'"]')) || [])[1];
        if (!vv) continue; u += vv + '/+esm';
      }
      const r = refs.get(u) || { pages: new Set(), integrity: null, sources: new Set(['code-reference']), kind: /\.css(\?|$)/.test(u) ? 'stylesheet' : /\.wasm(\?|$)/.test(u) ? 'wasm' : 'script' };
      r.pages.add(t.page); refs.set(u, r);
    }
    for (const m of t.text.matchAll(/['"](\/[\w./-]*?\/[A-Za-z][\w.-]*-\d+\.\d+\.\d+(?:\.min)?\.(?:m?js|css))(?:\?[^'"]*)?['"]/g)) {
      const u = BASE + m[1]; const r = refs.get(u) || { pages: new Set(), integrity: null, sources: new Set(['code-reference']), kind: /\.css$/.test(u) ? 'stylesheet' : 'script' };
      r.pages.add(t.page); refs.set(u, r);
    }
  }
  const fresh = [];
  for (const [u, x] of refs) { if (seen.has(u)) continue; seen.set(u, x); fresh.push(group(u, x)); }
  await pool([...new Set(fresh)], 6, hashOne);
  const list = [...comps.values()].sort((a, b) => (!!a.own === !!b.own ? a.name.localeCompare(b.name) : a.own ? 1 : -1));
  const components = list.map((c, i) => {
    const ref = (c.own ? 'site-file-' : 'site-3p-') + i;
    const o = { 'bom-ref': ref, type: c.kinds.has('font') && c.kinds.size === 1 ? 'file' : c.own ? 'file' : 'library', name: c.name, group: c.own ? 'kolaboro.com' : undefined, version: c.version || undefined, supplier: { name: c.supplier }, purl: c.purl || undefined };
    if (c.lic) o.licenses = [SPDX.test(c.lic.value) ? { license: { id: c.lic.value } } : { license: { name: c.lic.value } }];
    if (c.sha384) o.hashes = [{ alg: 'SHA-384', content: c.sha384.toString('hex') }, { alg: 'SHA-256', content: c.sha256.toString('hex') }];
    o.externalReferences = [...new Set([...c.urls.keys()].map(u => /\/cdn-cgi\/zaraz\//.test(u) ? u.split('?')[0] : u))].slice(0, 5).map(u => ({ type: 'distribution', url: u }));
    const props = [
      ['kolaboro:scope', c.own ? 'first-party' : 'third-party'],
      ...(c.selfHosted ? [['kolaboro:hosting', 'self-hosted copy served from kolaboro.com']] : []),
      ['kolaboro:kind', [...c.kinds].join(',')],
      ['kolaboro:found_by', [...c.sources].sort().join(',')],
      ['kolaboro:seen_on_count', String(c.pages.size)],
      ['kolaboro:seen_on_sample', [...c.pages].sort().slice(0, 5).join(' ')],
      ['kolaboro:url_variants', String(c.urls.size)],
      ['kolaboro:sri_on_tag', String(c.sri_on_tag)],
      ['kolaboro:versioned_url', String(!!c.versioned)],
    ];
    if (c.sha384) props.push(['kolaboro:sri', 'sha384-' + c.sha384.toString('base64')], ['kolaboro:bytes', String(c.bytes)]);
    else props.push(['kolaboro:download', 'failed: no hash computed']);
    if (c.sri_matches != null) props.push(['kolaboro:sri_matches_download', String(c.sri_matches)]);
    if (!c.own && !c.lic) props.push(['kolaboro:licence', 'not declared by the source (vendor service script or registry gave none)']);
    if (c.licSource) props.push(['kolaboro:licence_source', c.licSource]);
    if (c.lic) props.push(['kolaboro:licence_source', c.lic.source]);
    if (!c.own && !c.versioned && !c.selfHosted) props.push(['kolaboro:sri_note', 'unversioned vendor URL: the vendor changes the file without notice, so a fixed SRI hash would break it']);
    o.properties = props.map(([name, value]) => ({ name, value }));
    return JSON.parse(JSON.stringify(o));
  });

  // 3. worker bundle
  const worker = { files: [], npm: [], hosts: new Set() };
  if (WORKER_DIR && fs.existsSync(WORKER_DIR)) {
    for (const f of fs.readdirSync(WORKER_DIR).filter(f => /^(index|kolaboro|kbx[\w-]*)\.js$/.test(f)).sort()) {
      const buf = fs.readFileSync(path.join(WORKER_DIR, f)), src = buf.toString('utf8');
      worker.files.push({ name: '_worker.js/' + f, sha256: h('sha256', buf).toString('hex'), bytes: buf.length });
      for (const m of src.matchAll(/(?:\bimport\s[^'"`;]*?from\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g)) {
        const s = m[1]; if (s.startsWith('.') || s.startsWith('/')) continue;
        if (s.startsWith('node:') || s.startsWith('cloudflare:')) { worker.npm.push({ name: s, builtin: true, file: f }); continue; }
        worker.npm.push({ name: s, builtin: false, file: f });
      }
      if (f !== 'index.js') for (const m of src.matchAll(/\bfetch\(\s*[`'"]https:\/\/([a-z0-9.-]+\.[a-z]{2,})[/`'"$?]/gi)) worker.hosts.add(m[1].toLowerCase());
    }
  }
  const wComps = worker.files.map((f, i) => ({ 'bom-ref': 'worker-file-' + i, type: 'file', name: f.name, group: 'kolaboro.com worker', hashes: [{ alg: 'SHA-256', content: f.sha256 }], properties: [{ name: 'kolaboro:scope', value: 'first-party' }, { name: 'kolaboro:bytes', value: String(f.bytes) }] }));
  const npmUniq = [...new Map(worker.npm.map(x => [x.name, x])).values()];
  const npmComps = npmUniq.filter(x => !x.builtin).map((x, i) => ({ 'bom-ref': 'worker-npm-' + i, type: 'library', name: x.name, purl: 'pkg:npm/' + x.name.replace('@', '%40'), properties: [{ name: 'kolaboro:imported_by', value: x.file }] }));
  const services = [...worker.hosts].filter(x => !OWN(x)).sort().map((host, i) => ({ 'bom-ref': 'svc-' + i, name: host, endpoints: ['https://' + host], properties: [{ name: 'kolaboro:called_from', value: 'worker (server side fetch)' }] }));

  const now = new Date().toISOString();
  const thirdParty = components.filter(c => c.properties.find(p => p.name === 'kolaboro:scope').value === 'third-party');
  const bom = {
    bomFormat: 'CycloneDX', specVersion: '1.5', serialNumber: 'urn:uuid:' + crypto.randomUUID(), version: 1,
    metadata: {
      timestamp: now,
      tools: { components: [{ type: 'application', name: 'kolaboro-quality sbom.js', supplier: { name: 'Kolaboro' } }] },
      component: { 'bom-ref': 'kolaboro.com', type: 'application', name: 'kolaboro.com', supplier: { name: 'Kolaboro' }, externalReferences: [{ type: 'website', url: BASE + '/' }] },
      properties: [
        { name: 'kolaboro:method', value: 'Observed, not declared: scripts, stylesheets and fonts loaded by Chromium on 20 key pages at 390 and 1440 px, plus every <script src> and <link rel=stylesheet|preload> tag in the HTML of the ' + pages.length + ' sitemap pages (' + htmlOk + ' fetched), plus the worker source files. Each file was downloaded once to compute its hashes.' },
        { name: 'kolaboro:sitemap_pages', value: String(pages.length) },
        { name: 'kolaboro:sitemap_pages_fetched', value: String(htmlOk) },
        { name: 'kolaboro:third_party_components', value: String(thirdParty.length) },
        { name: 'kolaboro:third_party_with_sri', value: String(thirdParty.filter(c => c.properties.some(p => p.name === 'kolaboro:sri_on_tag' && p.value === 'true')).length) },
        { name: 'kolaboro:worker_npm_packages', value: String(npmComps.length) },
        { name: 'kolaboro:worker_note', value: 'The kolaboro.com part of the Cloudflare worker (' + worker.files.length + ' files: the shared router index.js, kolaboro.js and the kbx feature modules) is plain ES modules with ' + (npmComps.length ? npmComps.length + ' npm imports' : 'no npm imports') + '. The same worker also serves other sites from separately built bundles that are loaded only for those hosts; they are outside this bill of materials, and hosts called only by the shared router are not listed as services.' },
      ],
    },
    components: components.concat(wComps, npmComps),
    services,
    dependencies: [{ ref: 'kolaboro.com', dependsOn: components.concat(wComps, npmComps).map(c => c['bom-ref']) }],
  };
  fs.writeFileSync(path.join(OUT, 'sbom.json'), JSON.stringify(bom, null, 1));
  console.log(JSON.stringify({ components: bom.components.length, third_party: thirdParty.length, worker_files: worker.files.length, npm: npmComps.length, services: services.length, pages: pages.length, fetched: htmlOk }));
})().catch(e => { console.error(e); process.exit(1); });
