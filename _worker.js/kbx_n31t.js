// kolaboro.com batch 31 (agent n31t, 18 Nov 2026): engineering pages, press pages in 8 languages, live alerts, maintenance mode.
// No paid AI, no database writes. Every number comes from a published data file, a live public endpoint or a dated test run
// (/data/engineering-checks.json, written by hand from the runs logged in the commit that ships it).
//   GET /[l/]engineering/architecture/     how the site is built: request path, data, database, deploys, model spend, maintenance (267)
//   GET /[l/]engineering/modules/          the worker's modules from /data/worker-modules.json (252)
//   GET /[l/]engineering/rollback/         rollback plan and its tests (256)
//   GET /[l/]engineering/licenses/         third-party code and licences from /security/sbom.json (268)
//   GET /[l/]engineering/checks/           live alerts, unit tests, TTFB, Lighthouse, axe, load test, bundle size, headers, browser errors
//   GET /[l/]engineering/maintenance/      preview of the maintenance notice (noindex); maintPage() is what every page shows when KB_MAINT=1 (273)
//   GET /[l/]shortcuts/                    keyboard shortcuts (291)
//   GET /[l/]security/disclosure/          vulnerability disclosure policy (275); /security.txt redirects to /.well-known/security.txt
//   GET /<l>/press/, /[l/]press/cases/, /[l/]press/data-journalism/, /<l>/press/monthly/   press pages in 8 languages (244, 249, 250)
//   GET /api/v1/alerts                     what is wrong right now: key pages, checkout page, model spend over 1 USD a day, last deploy check (251, 271)
//   countErrs()                            aggregate of the browser errors /api/kb/err already receives, counted in the edge cache (262)
import { T } from './kbx_n31t_i18n.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T[l] && T[l][k]; return a != null ? a : T.en[k]; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;
// links written as /path/ in the strings become real links (only site-relative paths, escaped first)
const lk = (s, l) => esc(s).replace(/(^|[\s(:])(\/(?:[a-z0-9._#-]+\/?)+)(?=[\s).,;:]|$)/gi, (m, a, p) => a + '<a href="' + (/^\/(data|api|open|security\/sbom|\.well-known|engineering|status|k)\b/.test(p) || l === 'en' ? p : pre(l) + p) + '"' + (l === 'ar' ? ' dir="ltr"' : '') + '>' + p + '</a>');
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const R = {
  arch: new RegExp('^\\/' + LP + 'engineering\\/architecture\\/?$'), mods: new RegExp('^\\/' + LP + 'engineering\\/modules\\/?$'), rb: new RegExp('^\\/' + LP + 'engineering\\/rollback\\/?$'),
  lic: new RegExp('^\\/' + LP + 'engineering\\/licenses\\/?$'), ck: new RegExp('^\\/' + LP + 'engineering\\/checks\\/?$'), mt: new RegExp('^\\/' + LP + 'engineering\\/maintenance\\/?$'),
  sc: new RegExp('^\\/' + LP + 'shortcuts\\/?$'), vd: new RegExp('^\\/' + LP + 'security\\/disclosure\\/?$'), pk: /^\/(es|de|fr|nl|ru|zh|ar)\/press\/?$/,
  cs: new RegExp('^\\/' + LP + 'press\\/cases\\/?$'), dj: new RegExp('^\\/' + LP + 'press\\/data-journalism\\/?$'), pm: /^\/(es|de|fr|nl|ru|zh|ar)\/press\/monthly\/?$/
};
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:engineering\/(?:architecture|modules|rollback|licenses|checks|maintenance)|shortcuts|security\/disclosure|press\/cases|press\/data-journalism)\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/press(?:\/monthly)?\/?$|^\/api\/v1\/alerts$|^\/security\.txt$/;

// ------------------------------------------------------------------------------------------------ data
const MEMO = {};
async function file(env, p, ttl) {
  const m = MEMO[p]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[p] = { t: Date.now(), v }; return v;
}
async function live(path, ms) {   // a public endpoint of this site, read as a visitor would (short timeout)
  try { const r = await fetch(ORIGIN + path, { headers: { accept: 'application/json', 'user-agent': 'kolaboro-checks/1.0' }, signal: AbortSignal.timeout(ms || 8000) }); return r.ok ? await r.json() : null; } catch (e) { return null; }
}
const N = () => import('./kbx_named.js');

// ------------------------------------------------------------------------------------------------ page shell
const CSS = '<style>.n31{max-width:1100px}.n31 h2{margin:28px 0 8px;font-size:1.3rem}.n31 p,.n31 li{max-width:75ch;line-height:1.6}.n31-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:10px 0 22px;-webkit-overflow-scrolling:touch}' +
  '.n31 table{width:100%;border-collapse:collapse;min-width:560px;font-size:.95rem}.n31 th,.n31 td{padding:9px 12px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top}.n31 th{font-size:.85rem;background:var(--card,#fff)}.n31 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.n31 .ok{color:#0B7A55;font-weight:700}.n31 .bad{color:#B42318;font-weight:700}.n31 .warn{color:#9A5B00;font-weight:700}.n31-al{border:2px solid #0B7A55;border-radius:12px;padding:12px 16px;margin:10px 0}.n31-al.is-bad{border-color:#B42318}' +
  '.n31-fig{margin:14px 0 24px;border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);padding:10px;overflow-x:auto}.n31-fig svg{display:block;width:100%;min-width:640px;height:auto}.n31-fig figcaption{font-size:.9rem;color:var(--muted,#59626B);margin-top:6px}' +
  '.n31 code{font-size:.9em;overflow-wrap:anywhere}.n31 kbd{display:inline-block;min-width:1.6em;padding:2px 7px;border:1px solid var(--line,#c9c6bd);border-bottom-width:2px;border-radius:6px;font:600 .9rem ui-monospace,monospace;background:var(--card,#fff);text-align:center}' +
  '.n31-rel{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none}.n31-rel a{display:inline-flex;min-height:44px;align-items:center}.n31 .k-xs{font-size:.9rem;color:var(--muted,#59626B)}' +
  ':root[data-theme=dark] .n31 .ok{color:#4BE3A4}:root[data-theme=dark] .n31 .bad{color:#FF8A80}:root[data-theme=dark] .n31 .warn{color:#FFC14D}:root[data-theme=dark] .n31-fig svg .bx{fill:#1E2A35;stroke:#5B6B7A}:root[data-theme=dark] .n31-fig svg text{fill:#E9E7E0}:root[data-theme=dark] .n31-fig svg .ln{stroke:#9AA4AE}' +
  '@media print{.n31-tw{overflow:visible;border:0}.n31 table{min-width:0}}</style>';
const REL = ['/engineering/architecture/', '/engineering/checks/', '/engineering/modules/', '/engineering/rollback/', '/engineering/licenses/', '/status/', '/shortcuts/', '/security/disclosure/'];
const relHtml = (l, skip) => '<h2>' + esc(t(l, 'rel')) + '</h2><ul class="n31-rel">' + REL.map((p, i) => p === skip ? '' : '<li><a href="' + (p === '/status/' ? p : pre(l) + p) + '">' + esc(t(l, 'rel_l')[i]) + '</a></li>').join('') + '</ul>';
async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || [[t(l, 'eng'), '/engineering/']]).concat([[o.h1, null]]);
  const body = '<section class="phero"' + (l === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n31"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + o.body + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || new Date().toISOString().slice(0, 10), isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const langs = o.langs || LANGS;
  const html = await n.assemble({ title: o.title || o.h1 + ' | Kolaboro', desc: o.lead.slice(0, 155), canon, body, ld, alt: x => ORIGIN + pre(langs.includes(x) ? x : 'en') + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (o.maxAge || 600), 'content-language': l };
  if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(o.noindex ? html.replace('<head>', '<head><meta name="robots" content="noindex, follow">') : html, { status: o.status || 200, headers: h });
}
const table = (th, rows, cls) => '<div class="n31-tw"><table' + (cls ? ' class="' + cls + '"' : '') + '><thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';

// ------------------------------------------------------------------------------------------------ 267 architecture
function archSvg(l, nMods) {
  const D = t(l, 'ar_d'), dir = l === 'ar' ? ' direction="rtl"' : '';
  const box = (x, y, w, h, label, sub) => '<rect class="bx" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#fff" stroke="#17212B" stroke-width="1.5"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2 + (sub ? -2 : 5)) + '" text-anchor="middle" font-size="14" font-weight="700" fill="#17212B"' + dir + '>' + esc(label) + '</text>' + (sub ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 16) + '" text-anchor="middle" font-size="12" fill="#59626B"' + dir + '>' + esc(sub) + '</text>' : '');
  const ar = (x1, y1, x2, y2, dash) => '<line class="ln" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#17212B" stroke-width="1.6"' + (dash ? ' stroke-dasharray="5 4"' : '') + ' marker-end="url(#n31a)"/>';
  return '<svg viewBox="0 0 960 430" role="img" aria-labelledby="n31f"><title id="n31f">' + esc(t(l, 'ar_fig')) + '</title><defs><marker id="n31a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#FF5B14"/></marker></defs>' +
    '<rect x="160" y="20" width="420" height="250" rx="16" fill="none" stroke="#FF5B14" stroke-width="1.5" stroke-dasharray="6 5"/><text x="370" y="42" text-anchor="middle" font-size="13" font-weight="700" fill="#FF5B14"' + dir + '>' + esc(D.e) + '</text>' +
    box(10, 120, 120, 50, D.v) + box(180, 60, 180, 56, D.s, '_s/kolaboro.com') + box(180, 140, 180, 56, D.w.replace('{n}', nMods), '_worker.js') + box(390, 140, 170, 56, D.c) + box(180, 212, 380, 46, D.f, '/data/*.json') +
    box(640, 90, 300, 56, D.db) + box(640, 180, 300, 56, D.o) +
    box(10, 330, 200, 56, D.g, 'main') + box(260, 330, 200, 56, D.p, 'pub/_lovable') + box(510, 330, 200, 56, D.d, 'Cloudflare Pages') + box(760, 330, 190, 56, D.gd, '32 smoke checks') +
    ar(130, 145, 178, 145) + ar(270, 140, 270, 118) + ar(360, 168, 388, 168) + ar(270, 196, 270, 210) + ar(360, 160, 638, 120) + ar(360, 176, 638, 206, 1) +
    ar(210, 358, 258, 358) + ar(460, 358, 508, 358) + ar(610, 330, 400, 260) + ar(710, 358, 758, 358) + ar(855, 330, 600, 270, 1) + '</svg>';
}
async function archPage(env, shell, l) {
  const m = await file(env, '/data/worker-modules.json'), n = m ? m.totals.modules : 0;
  const b = '<figure class="n31-fig">' + archSvg(l, n) + '<figcaption>' + esc(t(l, 'ar_fig')) + '</figcaption></figure>' +
    t(l, 'ar_s').map(([h, p]) => '<h2>' + esc(h) + '</h2><p>' + esc(p) + '</p>').join('') +
    '<p><a href="' + pre(l) + '/engineering/maintenance/">' + esc(t(l, 'ar_prev')) + '</a> · <a href="/api/open/ai-spend">/api/open/ai-spend</a> · <a href="' + pre(l) + '/data/snapshots/">/data/snapshots/</a></p>' + relHtml(l, '/engineering/architecture/');
  return page(shell, l, { path: '/engineering/architecture/', h1: t(l, 'ar_t'), lead: t(l, 'ar_l'), body: b, updated: '2026-11-18', type: 'TechArticle' });
}

// ------------------------------------------------------------------------------------------------ 252 modules
async function modsPage(env, shell, l) {
  const m = await file(env, '/data/worker-modules.json'); if (!m) return null;
  const F = t(l, 'mo_fam'), LD = t(l, 'mo_ld'), tot = m.totals;
  const rows = m.modules.slice().sort((a, b) => b.bytes - a.bytes).map(x => '<tr><th scope="row"><code>' + esc(x.file) + '</code></th><td>' + esc(F[x.family] || x.family) + '</td><td>' + esc(LD[x.loaded] || x.loaded) + '</td><td class="n">' + bdi(l, nf(x.bytes / 1024, l, 0) + ' KB') + '</td><td>' + x.imported_by.slice(0, 3).map(y => '<code>' + esc(y[0]) + '</code>').join(', ') + (x.imported_by.length > 3 ? ' +' + (x.imported_by.length - 3) : '') + '</td><td lang="en" dir="ltr"><small>' + esc(x.about.slice(0, 160)) + (x.about.length > 160 ? '…' : '') + '</small></td></tr>');
  const b = '<p><b>' + esc(fill(t(l, 'mo_sum'), { n: nf(tot.modules, l), mb: nf(tot.bytes / 1048576, l, 1), d: nf(tot.on_demand, l), u: tot.unreachable.length ? tot.unreachable.join(', ') : t(l, 'none'), x: nf(m.unused_exports.length, l) })) + '</b></p><p>' + esc(t(l, 'mo_rm')) + '</p>' +
    '<h2>' + esc(t(l, 'mo_rules_h')) + '</h2><ul>' + t(l, 'mo_rules').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + table(t(l, 'mo_th'), rows) +
    '<p class="k-xs">' + lk(fill(t(l, 'mo_gen'), { d: fd(m.generated, l) }), l) + '</p>' + relHtml(l, '/engineering/modules/');
  return page(shell, l, { path: '/engineering/modules/', h1: t(l, 'mo_t'), lead: t(l, 'mo_l'), body: b, updated: String(m.generated).slice(0, 10) });
}

// ------------------------------------------------------------------------------------------------ 256 rollback
async function rbPage(env, shell, l) {
  const [d, c] = await Promise.all([file(env, '/data/deploys.json', 300000), file(env, '/data/engineering-checks.json')]);
  const dep = (d && d.deploys) || [], last = dep[0] || {}, rbk = dep.find(x => x.result === 'rolled_back'), R0 = (c && c.rollback) || {};
  const tests = t(l, 'rb_tests'), ts = [];
  if (R0.drill) ts.push(fill(tests[0], { a: nf(R0.drill.real_passed, l), b: nf(R0.drill.real_total, l) }));
  if (R0.revert) ts.push(fill(tests[1], { f: nf(R0.revert.files, l), s: nf(R0.revert.seconds, l, 1) }));
  if (rbk) ts.push(fill(tests[2], { d: fd(rbk.at, l), r: nf(rbk.files_restored || 0, l), p: nf((rbk.after_rollback || {}).checks_total || 32, l) }));
  const b = '<ol>' + t(l, 'rb_s').map(([h, p], i) => '<li><b>' + esc(h) + '.</b> ' + esc(i === 0 ? fill(p, { n: nf(last.checks_total || 32, l) }) : p) + '</li>').join('') + '</ol>' +
    '<h2>' + esc(t(l, 'rb_test_h')) + '</h2><ul>' + ts.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    (last.at ? '<p>' + lk(fill(t(l, 'rb_last'), { r: last.result, d: fd(last.at, l), p: nf(last.checks_passed || 0, l), t: nf(last.checks_total || 0, l), n: nf(dep.length, l) }), l) + '</p>' : '') +
    '<p class="k-xs"><a href="/open/deploy-guard.py">/open/deploy-guard.py</a> · <a href="/open/deploy-smoke.mjs">/open/deploy-smoke.mjs</a> · <a href="/open/pre-push.sh">/open/pre-push.sh</a></p>' + relHtml(l, '/engineering/rollback/');
  return page(shell, l, { path: '/engineering/rollback/', h1: t(l, 'rb_t'), lead: t(l, 'rb_l'), body: b, updated: '2026-11-18', type: 'TechArticle' });
}

// ------------------------------------------------------------------------------------------------ 268 licences
async function licPage(env, shell, l) {
  const s = await file(env, '/security/sbom.json'); if (!s) return null;
  const libs = new Map();
  for (const c of s.components || []) {
    if (c.type !== 'library' || !c.version) continue;
    const lic = (c.licenses || []).map(x => (x.license && (x.license.id || x.license.name)) || x.expression).filter(Boolean).join(', ');
    if (!lic) continue;
    const k = c.name.replace(/^@contentauth\//, '') + '@' + c.version;
    const from = /^pkg:cdnjs/.test(c.purl || '') ? 'cdnjs' : 'npm';
    const e = libs.get(k) || { name: c.name, version: c.version, lic, from: new Set() }; e.from.add(from); libs.set(k, e);
  }
  const U = t(l, 'li_use'), L = [...libs.values()].sort((a, b) => a.name.localeCompare(b.name));
  const rows = L.map(x => '<tr><th scope="row" dir="ltr">' + esc(x.name) + '</th><td class="n">' + esc(x.version) + '</td><td>' + esc(x.lic) + '</td><td>' + esc(U[x.name] || U[x.name.replace(/^@[^/]+\//, '')] || '') + ' <small>(' + [...x.from].join(', ') + ')</small></td></tr>');
  const lv = (L.find(x => x.name === 'leaflet') || {}).version || '';
  const allPerm = L.every(x => /^(MIT|BSD-[23]-Clause|Apache-2\.0|ISC)$/.test(x.lic));
  const rev = t(l, 'li_rev').map((x, i) => i === 0 && !allPerm ? '' : '<li>' + esc(fill(x, { n: nf(L.length, l), lv })) + '</li>').join('');
  const b = table(t(l, 'li_th'), rows) + '<h2>' + esc(t(l, 'li_rev_h')) + '</h2><ul>' + rev + '</ul><p class="k-xs">' + lk(fill(t(l, 'li_src'), { d: fd(s.metadata && s.metadata.timestamp, l) }), l) + '</p>' + relHtml(l, '/engineering/licenses/');
  return page(shell, l, { path: '/engineering/licenses/', h1: t(l, 'li_t'), lead: t(l, 'li_l'), body: b, updated: String((s.metadata && s.metadata.timestamp) || '').slice(0, 10) });
}

// ------------------------------------------------------------------------------------------------ 251 + 271 alerts (also used by the checks page)
let AL = { t: 0, v: null };
export async function alerts(env) {
  if (AL.v && Date.now() - AL.t < 120000) return AL.v;
  const [pg, ai, dep] = await Promise.all([live('/api/x/status/pages', 15000), live('/api/open/ai-spend'), file(env, '/data/deploys.json', 300000)]);
  const day = new Date().toISOString().slice(0, 10), A = [];
  if (pg && pg.n && pg.up < pg.n) A.push({ kind: 'pages', level: 'error', up: pg.up, n: pg.n, down: (pg.pages || []).filter(x => !x.ok).map(x => x.p) });
  if (pg && pg.checkout && !pg.checkout.ok) A.push({ kind: 'checkout', level: 'error', status: pg.checkout.checkout || pg.checkout.status || 0, step: pg.checkout.step });
  const ad = ai && (ai.days || []).find(x => x.day === day), ay = ai && (ai.days || []).find(x => x.day === new Date(Date.now() - 864e5).toISOString().slice(0, 10));
  for (const x of [ad, ay]) if (x && x.usd_estimated > 1) A.push({ kind: 'ai', level: 'warning', day: x.day, usd: x.usd_estimated, line_usd: 1 });
  const g = dep && dep.deploys && dep.deploys[0];
  if (g && g.result !== 'pass' && Date.now() - Date.parse(g.at) < 864e5) A.push({ kind: 'guard', level: 'error', result: g.result, at: g.at });
  const v = { at: new Date().toISOString(), ok: !A.length, alerts: A,
    checked: { key_pages: pg ? { up: pg.up, n: pg.n, at: pg.at } : null, checkout: pg && pg.checkout ? { ok: pg.checkout.ok, status: pg.checkout.checkout || null } : null, ai_spend_today_usd: ad ? ad.usd_estimated : 0, ai_alert_line_usd: 1, ai_hard_cap_usd: ai ? ai.cap_usd_per_day : null, last_deploy_check: g ? { result: g.result, at: g.at } : null },
    about: 'What is wrong on kolaboro.com right now, from the public checks: the 20 key pages and the checkout page (/api/x/status/pages, every 5 minutes), model spend of the site features against a 1 USD a day alert line (/api/open/ai-spend; the features stop by themselves at the hard cap), and the last deploy guard result (/data/deploys.json). Shown on /engineering/checks/.' };
  AL = { t: Date.now(), v }; return v;
}
function alertText(l, a) {
  const M = t(l, 'ck_al');
  if (a.kind === 'pages') return fill(M.pages, { u: nf(a.up, l), n: nf(a.n, l) });
  if (a.kind === 'checkout') return fill(M.checkout, { s: a.status });
  if (a.kind === 'ai') return fill(M.ai, { d: fd(a.day, l), v: nf(a.usd, l, 2) });
  return fill(M.guard, { r: a.result });
}

// ------------------------------------------------------------------------------------------------ checks page
async function ckPage(env, shell, l, ctx) {
  const [c, al, bl, er] = await Promise.all([file(env, '/data/engineering-checks.json'), alerts(env), file(env, '/data/builds.json', 600000), errCounts(7)]);
  if (!c) return null;
  const k = al.checked || {};
  let b = '<h2>' + esc(t(l, 'ck_al_h')) + '</h2><div class="n31-al' + (al.ok ? '' : ' is-bad') + '" role="status">' + (al.ok ? '<p class="ok">' + esc(t(l, 'ck_al_none')) + '</p>' : '<ul>' + al.alerts.map(a => '<li class="bad">' + esc(alertText(l, a)) + '</li>').join('') + '</ul>') +
    '<p class="k-xs">' + lk(fill(t(l, 'ck_live'), { u: k.key_pages ? nf(k.key_pages.up, l) : '?', n: k.key_pages ? nf(k.key_pages.n, l) : '?', c: k.checkout ? t(l, k.checkout.ok ? 'yes' : 'no') : '?', v: nf(k.ai_spend_today_usd || 0, l, 2) }), l) + '</p></div>';
  if (c.unit) b += '<h2>' + esc(t(l, 'ck_ut_h')) + '</h2><p>' + esc(fill(t(l, 'ck_ut'), { p: nf(c.unit.pass, l), n: nf(c.unit.total, l), d: fd(c.unit.at, l) })).replace(/(node --test \S+)/, '<code>$1</code>') + ' <a href="/open/tests/parsers.test.mjs">/open/tests/parsers.test.mjs</a></p>';
  if (c.ttfb) b += '<h2>' + esc(t(l, 'ck_tt_h')) + '</h2><p>' + esc(fill(t(l, 'ck_tt'), { d: fd(c.ttfb.at, l) })) + '</p>' + table(t(l, 'ck_tt_th'), c.ttfb.rows.map(r => '<tr><th scope="row" dir="ltr"><code>' + esc(r.path) + '</code></th><td class="n">' + nf(r.ttfb_ms_median, l) + ' ms</td><td class="n ' + (r.after_tls_ms_median <= 200 ? 'ok' : 'warn') + '">' + nf(r.after_tls_ms_median, l) + ' ms</td><td dir="ltr"><small>' + esc(r.cache || '') + '</small></td></tr>'));
  const sc = v => '<td class="n ' + (v >= 95 ? 'ok' : v >= 90 ? 'warn' : 'bad') + '">' + (v == null ? '' : nf(v, l)) + '</td>';
  if (c.lighthouse) b += '<h2>' + esc(t(l, 'ck_lh_h')) + '</h2><p>' + esc(fill(t(l, 'ck_lh'), { v: c.lighthouse.version, d: fd(c.lighthouse.at, l) })) + '</p>' + table(t(l, 'ck_lh_th'), c.lighthouse.rows.map(r => '<tr><th scope="row" dir="ltr"><code>' + esc(r.path) + '</code></th>' + sc(r.performance) + sc(r.accessibility) + sc(r['best-practices']) + sc(r.seo) + '</tr>'));
  if (c.axe) b += '<h2>' + esc(t(l, 'ck_ax_h')) + '</h2><p>' + esc(fill(t(l, 'ck_ax'), { v: c.axe.version, d: fd(c.axe.at, l) })) + '</p>' + table(t(l, 'ck_ax_th'), c.axe.rows.map(r => '<tr><th scope="row" dir="ltr"><code>' + esc(r.path) + '</code></th>' + ['light', 'dark'].map(m => '<td class="n ' + (r[m] ? 'bad' : 'ok') + '">' + nf(r[m] || 0, l) + (r[m + '_rules'] && r[m + '_rules'].length ? ' <small dir="ltr">' + esc(r[m + '_rules'].join(', ')) + '</small>' : '') + '</td>').join('') + '</tr>'));
  if (c.load) b += '<h2>' + esc(t(l, 'ck_ld_h')) + '</h2><p>' + esc(fill(t(l, 'ck_ld'), { d: fd(c.load.at, l), rps: nf(c.load.rps, l), s: nf(c.load.seconds, l), n: nf(c.load.requests, l), ok: nf(c.load.ok, l), e: nf(c.load.errors, l), p50: nf(c.load.p50, l), p95: nf(c.load.p95, l) })) + '</p>';
  const B = ((bl && bl.builds) || []).slice().sort((a, b2) => String(a.built_at).localeCompare(String(b2.built_at)));
  if (B.length) b += '<h2>' + esc(t(l, 'ck_bs_h')) + '</h2><p>' + esc(t(l, 'ck_bs')) + '</p>' + table(t(l, 'ck_bs_th'), B.slice(-8).reverse().map(x => { const i = B.indexOf(x), p = i > 0 ? (x.bytes - B[i - 1].bytes) * 100 / B[i - 1].bytes : null; return '<tr><td>' + esc(fd(x.built_at, l)) + ' <small dir="ltr"><code>' + esc(String(x.first_commit || '').slice(0, 10)) + '</code></small></td><td class="n">' + nf(x.bytes / 1048576, l, 2) + ' MB</td><td class="n ' + (p == null ? '' : p > 5 ? 'bad' : 'ok') + '">' + (p == null ? '' : (p > 0 ? '+' : '') + nf(p, l, 1) + '%') + '</td></tr>'; }));
  if (c.headers) b += '<h2>' + esc(t(l, 'ck_hd_h')) + '</h2><p>' + esc(fill(t(l, 'ck_hd'), { d: fd(c.headers.at, l) })) + '</p>' + table(t(l, 'ck_hd_th'), c.headers.rows.map(r => '<tr><th scope="row" dir="ltr"><code>' + esc(r.h) + '</code></th><td lang="en" dir="ltr">' + esc(r.what) + '</td><td class="' + (r.st === 'set' ? 'ok' : 'warn') + '">' + esc(t(l, r.st === 'set' ? 'ck_hd_ok' : 'ck_hd_rep')) + '</td></tr>'));
  b += '<h2>' + esc(t(l, 'ck_er_h')) + '</h2><p>' + esc(t(l, 'ck_er')) + '</p>' + (er.length ? table(t(l, 'ck_er_th'), er.slice(0, 15).map(r => '<tr><td lang="en" dir="ltr"><code>' + esc(r.m) + '</code></td><td>' + esc(r.p) + '</td><td class="n">' + nf(r.n, l) + '</td></tr>')) : '<p>' + esc(t(l, 'ck_er_none')) + '</p>');
  b += relHtml(l, '/engineering/checks/');
  return page(shell, l, { path: '/engineering/checks/', h1: t(l, 'ck_t'), lead: t(l, 'ck_l'), body: b, updated: c.updated, maxAge: 120 });
}

// ------------------------------------------------------------------------------------------------ 262 browser errors: aggregate counts
const ERR_KEY = (d, h) => new Request(ORIGIN + '/__n31err/' + d + '/' + h);
const ERR_IDX = d => new Request(ORIGIN + '/__n31err/' + d + '/index');
const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
function cleanMsg(m) { return String(m || '').replace(/https?:\/\/\S+/g, '<url>').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<email>').replace(/\b\d{5,}\b/g, '<n>').replace(/\s+/g, ' ').trim().slice(0, 120); }
const pageType = pth => { const p = String(pth || '').replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/)/, ''); return p === '/' || p === '' ? 'home' : /^\/projects\/[^/]+/.test(p) ? 'project' : /^\/projects\/?$/.test(p) ? 'project list' : /^\/developers\//.test(p) ? 'developer' : /^\/(m|countries|rankings)\//.test(p) ? 'place or ranking' : /^\/(tools|check)\//.test(p) ? 'tool' : 'other'; };
// called by kolaboro.js for every browser error report it already receives (/api/kb/err, stored there as before): one more count per
// (page type, cleaned message) in this location's edge cache, so the engineering checks page can show an aggregate without a database read
export function countErrs(items, ctx) {
  const d = new Date().toISOString().slice(0, 10);
  const work = (async () => {
    for (const it of (items || []).filter(x => x && x.kind === 'js').slice(0, 5)) {
      const m = cleanMsg(it.msg), pt = pageType(it.page); if (!m || m.length < 4) continue;
      const h = hash(pt + '|' + m), k = ERR_KEY(d, h); let n = 0;
      try { const r = await caches.default.match(k); if (r) n = (await r.json()).n || 0; } catch (e) {}
      await caches.default.put(k, new Response(JSON.stringify({ m, p: pt, n: n + 1 }), { headers: { 'cache-control': 'max-age=864000' } }));
      if (!n) { let ix = []; try { const r = await caches.default.match(ERR_IDX(d)); if (r) ix = await r.json(); } catch (e) {} if (ix.length < 200 && !ix.includes(h)) { ix.push(h); await caches.default.put(ERR_IDX(d), new Response(JSON.stringify(ix), { headers: { 'cache-control': 'max-age=864000' } })); } }
    }
  })().catch(() => {});
  try { ctx.waitUntil(work); } catch (e) {}
}
async function errCounts(days) {
  const M = new Map();
  try {
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); let ix = [];
      try { const r = await caches.default.match(ERR_IDX(d)); if (r) ix = await r.json(); } catch (e) {}
      for (const h of ix.slice(0, 200)) { try { const r = await caches.default.match(ERR_KEY(d, h)); if (!r) continue; const o = await r.json(); const k = o.p + '|' + o.m; const e = M.get(k) || { m: o.m, p: o.p, n: 0 }; e.n += o.n || 0; M.set(k, e); } catch (e) {} }
    }
  } catch (e) {}
  return [...M.values()].sort((a, b) => b.n - a.n);
}

// ------------------------------------------------------------------------------------------------ 291 shortcuts, 275 disclosure, 273 maintenance
async function scPage(shell, l) {
  const b = table(t(l, 'sc_th'), t(l, 'sc_rows').map(([k, w]) => '<tr><th scope="row">' + k.split(/(\s(?:or|o|oder|ou|of|или|或|أو|then|y|und|et|en|затем|然后|ثم)\s|,\s)/).map(x => /^\s|,\s/.test(x) ? esc(x) : '<kbd dir="ltr">' + esc(x) + '</kbd>').join('') + '</th><td>' + esc(w) + '</td></tr>')) + '<p>' + esc(t(l, 'sc_note')) + '</p>' + relHtml(l, '/shortcuts/');
  return page(shell, l, { path: '/shortcuts/', h1: t(l, 'sc_t'), lead: t(l, 'sc_l'), body: b, updated: '2026-11-18', crumb: [] });
}
async function vdPage(shell, l) {
  const b = t(l, 'vd_s').map(([h, p]) => '<h2>' + esc(h) + '</h2><p>' + lk(p, l).replace(/hello@kolaboro\.com/, '<a href="mailto:hello@kolaboro.com?subject=security">hello@kolaboro.com</a>').replace(/\/security#thanks/, '<a href="/security#thanks">/security#thanks</a>') + '</p>').join('') + relHtml(l, '/security/disclosure/');
  return page(shell, l, { path: '/security/disclosure/', h1: t(l, 'vd_t'), lead: t(l, 'vd_l'), body: b, updated: '2026-11-18', crumb: [['Security', '/security/']] });
}
const MAINT_MIN = 15;
export function maintPage(u) {   // the whole response when KB_MAINT=1: no database, no data files, no other module
  const lm = /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(u.pathname), l = lm ? lm[1] : 'en';
  const h = '<!doctype html><html lang="' + l + '"' + (l === 'ar' ? ' dir="rtl"' : '') + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(t(l, 'mt_h')) + ' | Kolaboro</title>' +
    '<style>body{margin:0;font:17px/1.6 Archivo,system-ui,sans-serif;background:#F6F6F3;color:#17212B}main{max-width:620px;margin:12vh auto;padding:24px 16px}h1{font-size:1.7rem;line-height:1.25}a{color:#155C75}@media(prefers-color-scheme:dark){body{background:#11181F;color:#E9E7E0}a{color:#7CC4DD}}</style></head><body><main>' +
    '<p><b>kolaboro</b></p><h1>' + esc(t(l, 'mt_h')) + '</h1><p>' + esc(fill(t(l, 'mt_p'), { m: MAINT_MIN })) + '</p><p><a href="/status/">' + esc(t(l, 'mt_s')) + '</a> · <a href="/api/open/stats">API</a></p></main></body></html>';
  return new Response(h, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': String(MAINT_MIN * 60), 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'content-language': l } });
}
export const MAINT_SKIP = /^\/(?:api|data|k|open|\.well-known|status|engineering\/maintenance|_s)(?:\/|$)|\.[a-z0-9]{2,5}$/i;
async function mtPage(shell, l) {
  const b = '<div class="n31-al" style="max-width:620px"><h2 style="margin-top:0">' + esc(t(l, 'mt_h')) + '</h2><p>' + esc(fill(t(l, 'mt_p'), { m: MAINT_MIN })) + '</p><p><a href="/status/">' + esc(t(l, 'mt_s')) + '</a></p></div><p>' + esc(t(l, 'mt_how')) + '</p>' + relHtml(l, '');
  return page(shell, l, { path: '/engineering/maintenance/', h1: t(l, 'mt_t'), lead: t(l, 'mt_l'), body: b, updated: '2026-11-18', noindex: true });
}

// ------------------------------------------------------------------------------------------------ 249 press kit and monthly release in 8 languages
async function pkPage(env, shell, l) {
  const st = await live('/api/open/stats');
  const b = '<h2>' + esc(t(l, 'pr_one_h')) + '</h2><p>' + esc(t(l, 'pr_one')) + '</p><h2>' + esc(t(l, 'pr_more_h')) + '</h2><p>' + esc(fill(t(l, 'pr_more'), { p: st ? nf(st.projects, l) : '1,700+', c: st ? nf(st.countries, l) : '90+' })) + '</p>' +
    '<h2>' + esc(t(l, 'pr_fig_h')) + '</h2><ul>' + t(l, 'pr_fig').map(([n, p]) => '<li><a href="' + (/^\/press\/(monthly|cases|data-journalism)\//.test(p) ? pre(l) + p : p) + '">' + esc(n) + '</a></li>').join('') + '</ul>' +
    '<h2>' + esc(t(l, 'pr_c_h')) + '</h2><p>' + esc(t(l, 'pr_c')).replace('press@kolaboro.com', '<a href="mailto:press@kolaboro.com">press@kolaboro.com</a>') + '</p>' +
    '<h2>' + esc(t(l, 'pr_logo_h')) + '</h2><p>' + esc(t(l, 'pr_logo')) + '</p><p><a href="/k/logo.svg">logo.svg</a> · <a href="/k/logo.png">logo.png</a> · <a href="/favicon.svg">favicon.svg</a></p>';
  return page(shell, l, { path: '/press/', h1: t(l, 'pr_t'), lead: t(l, 'pr_l'), body: b, updated: st && st.updated ? String(st.updated).slice(0, 10) : '2026-11-18', crumb: [] });
}
function pmFacts(h) {   // the numbers inside each English headline, read back from the published text
  const x = h.text || '', n = s => (s || '').replace(/,/g, '');
  let m;
  if (h.key === 'share_past_first' && (m = /\(([\d,]+) of ([\d,]+)\)/.exec(x))) return { v: h.value, a: n(m[1]), b: n(m[2]) };
  if (h.key === 'median_late' && (m = /among those ([\d,]+) projects.*?90th percentile: ([\d.]+)/.exec(x))) return { v: h.value, a: n(m[1]), p: m[2] };
  if (h.key === 'share_past_current' && (m = /\(([\d,]+) of ([\d,]+)\)/.exec(x))) return { v: h.value, a: n(m[1]), b: n(m[2]) };
  if (h.key === 'transparency_median' && (m = /across ([\d,]+) markets/.exec(x))) return { v: h.value, a: n(m[1]) };
  if (h.key === 'price_index' && (m = /on (\d{4}-\d{2}-\d{2}) \(base 100 on (\d{4}-\d{2}-\d{2})/.exec(x))) return { v: h.value, d: m[1], b: m[2] };
  return null;
}
async function pmPage(env, shell, l) {
  const r = await file(env, '/press/monthly/release.json', 900000); if (!r) return null;
  const H = t(l, 'pm_h'), rows = [];
  for (const h of r.headlines || []) {
    const f = pmFacts(h), tpl = H[h.key]; if (!f || !tpl) continue;
    const v = { v: nf(f.v, l, 2), a: f.a != null ? nf(+f.a, l) : '', b: f.b != null && !/-/.test(f.b) ? nf(+f.b, l) : f.b ? fd(f.b, l) : '', p: f.p != null ? nf(+f.p, l, 1) : '', d: f.d ? fd(f.d, l) : '' };
    rows.push('<li><b>' + esc(h.key === 'median_late' ? nf(f.v, l, 1) : h.key === 'transparency_median' ? nf(f.v, l) : h.key === 'price_index' ? nf(f.v, l, 2) : nf(f.v, l, 1) + ' %') + '</b> ' + esc(fill(tpl, v)) + ' <small>' + esc(t(l, 'pm_src')) + ': ' + (h.source || []).map(s => '<a href="' + esc(s.replace(ORIGIN, '')) + '">' + esc(s.replace(ORIGIN, '')) + '</a>').join(', ') + '</small></li>');
  }
  const ch = ['chart-delays.svg', 'chart-months-late.svg', 'chart-transparency.svg'];
  const b = '<p class="k-xs">' + esc(fill(t(l, 'pm_gen'), { title: r.title, d: fd(r.generated, l) })) + '</p><ol>' + rows.join('') + '</ol><h2>' + esc(t(l, 'pm_charts')) + '</h2><ul>' + ch.map((c, i) => '<li><a href="/press/monthly/' + c + '" download>' + esc(t(l, 'pm_ch')[i]) + '</a> (SVG, CC BY 4.0)</li>').join('') + '</ul>' +
    '<p><a href="/press/monthly/">' + esc(t(l, 'pm_en')) + '</a> · <a href="/press/monthly/release.json">JSON</a> · <a href="/press/monthly/release.txt">TXT</a></p>';
  return page(shell, l, { path: '/press/monthly/', h1: t(l, 'pm_t'), lead: t(l, 'pm_l'), body: b, updated: r.generated, crumb: [[t(l, 'pr_t'), pre(l) + '/press/']], type: 'Article' });
}

// ------------------------------------------------------------------------------------------------ 244 case studies for journalists
async function csPage(env, shell, l) {
  const n = await N(); let ix; try { ix = await n.data(env); } catch (e) { return null; }
  const strong = e => e && e[1] === 'contradicted' && (e[2] === 'registry' || e[2] === 'independent') && n.okHttp(e[3]) && !n.isListing(e[3]);   // portal pages left out: only registers, press and other independent records
  const L = ix.P.filter(x => !COI_RX.test(String(x.n || '') + ' ' + String(x.dv || '')) && !/sumba/i.test(String(x.mk || '') + ' ' + String(x.ar || '')))
    .map(x => ({ x, c: (x.cl || []).filter(strong) })).filter(o => o.c.length >= 2).sort((a, b) => b.c.length - a.c.length || String(a.x.n).localeCompare(String(b.x.n))).slice(0, 25);
  let k = 0; for (const x of ix.P) for (const e of x.cl || []) if (e && e[1] === 'contradicted') k++;
  const kind = s => ({ registry: { en: 'register record', es: 'registro', de: 'Registereintrag', fr: 'registre', nl: 'registervermelding', ru: 'запись в реестре', zh: '登记记录', ar: 'سجل' }, independent: { en: 'independent source', es: 'fuente independiente', de: 'unabhängige Quelle', fr: 'source indépendante', nl: 'onafhankelijke bron', ru: 'независимый источник', zh: '独立来源', ar: 'مصدر مستقل' } })[s][l];
  const rows = L.map(({ x, c }) => '<tr><td><a href="' + pre(l) + '/projects/' + esc(x.s) + '/"><b>' + esc(x.n) + '</b></a><br><small>' + esc(x.mk) + (x.dv ? ' · ' + esc(x.dv) : '') + '</small></td><td><ul style="margin:0;padding-inline-start:18px">' +
    c.slice(0, 4).map(e => '<li><span lang="en" dir="ltr">' + esc(e[0]) + '</span><br><small>' + esc(kind(e[2])) + ': <a href="' + esc(n.fixU(e[3])) + '" rel="nofollow noopener" target="_blank" dir="ltr">' + esc(n.host(e[3]) || '') + '</a></small></li>').join('') + '</ul></td></tr>');
  const b = '<p>' + esc(fill(t(l, 'cs_n'), { n: nf(L.length, l), k: nf(k, l) })) + '</p>' + table(t(l, 'cs_th'), rows) + '<p>' + esc(t(l, 'cs_use')) + '</p><p><a href="' + pre(l) + '/press/">' + esc(t(l, 'pr_t')) + '</a> · <a href="' + pre(l) + '/press/data-journalism/">' + esc(t(l, 'dj_t')) + '</a></p>';
  return page(shell, l, { path: '/press/cases/', h1: t(l, 'cs_t'), lead: t(l, 'cs_l'), body: b, updated: ix.updated || new Date().toISOString().slice(0, 10), crumb: [[t(l, 'pr_t'), pre(l) + '/press/']] });
}
async function djPage(shell, l) {
  const b = '<h2>' + esc(t(l, 'dj_get_h')) + '</h2><ul>' + t(l, 'dj_get').map(([n, p]) => '<li><a href="' + (p === '/database/' ? pre(l) + p : p) + '">' + esc(n) + '</a> <small dir="ltr"><code>' + esc(p) + '</code></small></li>').join('') + '</ul>' +
    '<h2>' + esc(t(l, 'dj_ideas_h')) + '</h2><ul>' + t(l, 'dj_ideas').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><h2>' + esc(t(l, 'dj_rules_h')) + '</h2><p>' + esc(t(l, 'dj_rules')).replace('press@kolaboro.com', '<a href="mailto:press@kolaboro.com">press@kolaboro.com</a>') + '</p><p class="k-xs">' + esc(t(l, 'dj_contest')) + '</p>' +
    '<p><a href="' + pre(l) + '/press/cases/">' + esc(t(l, 'cs_t')) + '</a> · <a href="' + pre(l) + '/press/">' + esc(t(l, 'pr_t')) + '</a></p>';
  return page(shell, l, { path: '/press/data-journalism/', h1: t(l, 'dj_t'), lead: t(l, 'dj_l'), body: b, updated: '2026-11-18', crumb: [[t(l, 'pr_t'), pre(l) + '/press/']] });
}

// ------------------------------------------------------------------------------------------------ router
const json = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60' }, extra || {}) });
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname; let m;
  if (!PATHS.test(p)) return null;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (p === '/security.txt') return new Response(null, { status: 301, headers: { location: '/.well-known/security.txt', 'cache-control': 'public, max-age=86400' } });
  if (p === '/api/v1/alerts') { try { return json(await alerts(env)); } catch (e) { return json({ error: 'unavailable' }, 503); } }
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const L = x => x || 'en';
  if ((m = R.arch.exec(p))) return archPage(env, shell, L(m[1]));
  if ((m = R.mods.exec(p))) return modsPage(env, shell, L(m[1]));
  if ((m = R.rb.exec(p))) return rbPage(env, shell, L(m[1]));
  if ((m = R.lic.exec(p))) return licPage(env, shell, L(m[1]));
  if ((m = R.ck.exec(p))) return ckPage(env, shell, L(m[1]), ctx);
  if ((m = R.mt.exec(p))) return mtPage(shell, L(m[1]));
  if ((m = R.sc.exec(p))) return scPage(shell, L(m[1]));
  if ((m = R.vd.exec(p))) return vdPage(shell, L(m[1]));
  if ((m = R.pk.exec(p))) return pkPage(env, shell, m[1]);
  if ((m = R.pm.exec(p))) return pmPage(env, shell, m[1]);
  if ((m = R.cs.exec(p))) return csPage(env, shell, L(m[1]));
  if ((m = R.dj.exec(p))) return djPage(shell, L(m[1]));
  return null;
}
