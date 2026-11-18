// kolaboro.com (n31c, batch 31, 18 Nov 2026): data part 2. No paid AI, no database reads or writes: everything comes from the
// published data files (named.json, bali-cases.json, stalled-sites.json, wayback.json).
//   12, 117  stable ids with aliases: a developer recorded under two spellings and a project recorded twice answer with a 301 to the
//            one stable page (/[lang/]projects|developers/<alias>/..., /api/v1/projects|developers/<alias>..., /answers/developer/<alias>.md)
//   121-123  Dubai Land Department register line on Dubai project pages: DLD project number and status, escrow bank, % built at the
//            latest DLD inspection and its date, units, completion date on the register (from named.json fx.dld, built by named.py)
//   116, 118 /engineering/data-quality/: what to fill next by place (gaps) and the automatic checks run on every build (named.json qa)
//   108      GET /[lang/]stalled/: projects where a public source reports stopped works, or the official completion date passed with the
//            register showing work unfinished, or the handover date passed with no visible change from space; facts and sources only
//   114      Wayback Machine line on project pages: earliest and latest archived copy of the tracked page (/data/wayback.json)
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d; } };
const bdi = t => '<bdi>' + esc(t) + '</bdi>';
// UI strings (8 languages) live in /data/n31c-i18n.json since the worker directory reached the Pages 25 MiB limit (18 Nov 2026).
let TP = null;
export function loadT(env) {
  if (DL) return Promise.resolve(true);
  if (!TP) TP = (async () => {
    let T = null;
    try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n31c-i18n.json')); if (r.ok) T = await r.json(); } } catch (e) {}
    if (!T) { try { const r = await fetch(ORIGIN + '/data/n31c-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
    if (T) ({ DL, WB, WB_ALL, G, RULE, S, FR } = T); else TP = null;
    return !!T;
  })();
  return TP;
}

// ------------------------------------------------------------------------------------------------ 12, 117: aliases
// Same map as tools/kolaboro-agent/aliases.json on main (named.py publishes it in named.json "aliases"; this copy answers before any
// data file is read). A new pair is added to both.
export const DEV_ALIAS = {
  'aldar-properties-pjsc': 'aldar-properties', 'arada-developments-l-l-c-s-o-c': 'arada', 'azizi-developments-l-l-c': 'azizi-developments', 'berjaya-land-bhd': 'berjaya-land-berhad',
  'breig-property-development': 'breig-property', 'danube-properties-development-l-l-c': 'danube-properties', 'dar-global-plc': 'dar-global', emaar: 'emaar-properties',
  'investland-bali-properties': 'investland-bali', 'lamda-development-s-a': 'lamda-development', 'magnum-estate-international': 'magnum-estate', 'metrovacesa-s-a': 'metrovacesa',
  'modon-properties-pjsc': 'modon', 'rak-properties-pjsc': 'rak-properties', 'range-developments-group': 'range-developments', 'sansiri-pcl': 'sansiri',
  'sansiri-public-company-limited': 'sansiri', 'sumitomo-realty-development-co-ltd': 'sumitomo-realty-development', 'taraf-development-l-l-c': 'taraf', cyrela: 'cyrela-brazil-realty',
  'the-related-group': 'related-group', 'abitarein-s-p-a': 'abitare-in-s-p-a', 'cps-africa': 'cps', 'banyan-group': 'banyan-group-residences',
  'origin-property-pcl': 'origin-property-public-company-limited', 'ornsirin-group': 'ornsirin-holding-pcl', 'sc-asset-corporation-pcl': 'sc-asset-corporation-plc', 'rhom-bho-property-pcl': 'rhom-bho-property-plc'
};
export const PROJ_ALIAS = { 'eaton-park-gamuda-land': 'eaton-park-thu-duc-hcmc', 'pavilion-damansara-heights-phase-2-imperial-residences-and-r': 'pavilion-damansara-heights-phase-2-jendela-mayang' };
const AL_RX = /^(\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)\/|\/api\/v1\/(?:projects|developers)\/|\/answers\/developer\/)([a-z0-9-]{1,90})(\/.*|\.md|\.csv)?$/;
let LIVE = null;   // the aliases of the last named.json this isolate read (a pair added on main before this file is updated)
export function setLive(a) { if (a && typeof a === 'object') LIVE = a; }
export function aliasOf(kind, slug) {
  const m = kind === 'developers' ? DEV_ALIAS : PROJ_ALIAS, l = LIVE && LIVE[kind];
  return m[slug] || (l && l[slug]) || null;
}
export function aliasRedirect(u) {   // 301 Response or null
  const m = AL_RX.exec(u.pathname); if (!m) return null;
  const kind = /developer/.test(m[1]) ? 'developers' : 'projects', to = aliasOf(kind, m[2]);
  if (!to) return null;
  return new Response(null, { status: 301, headers: { location: m[1] + to + (m[3] || '') + u.search, 'cache-control': 'public, max-age=86400', 'x-kb-alias': m[2] } });
}
export function aliasesFor(slug) { return [...new Set(Object.entries(DEV_ALIAS).concat(Object.entries((LIVE && LIVE.developers) || {})).filter(([, v]) => v === slug).map(([k]) => k))].sort(); }

// ------------------------------------------------------------------------------------------------ 121-123: DLD register line
let DL = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
export function dldKf(x, lang) {   // one key-facts tile, or ''
  const r = x && x.fx && x.fx.dld; if (!r || !r.src || !DL) return '';
  const L = DL[lang] || DL.en, parts = [];
  if (r.no) parts.push(esc(fill(L.no, { n: r.no })) + (r.st ? ' · <span lang="en" dir="ltr">' + esc(r.st) + '</span>' : ''));
  if (r.pct != null && r.pd) parts.push(esc(fill(L.built, { p: nf(r.pct, lang, 2), d: fdt(r.pd, lang) })));
  if (r.bank) parts.push(esc(fill(L.bank, { b: '' })) + '<span lang="en" dir="ltr">' + esc(r.bank) + '</span>');
  if (r.units) parts.push(esc(fill(L.units, { u: nf(r.units, lang) })));
  if (r.comp) parts.push(esc(fill(L.comp, { d: fdt(r.comp, lang) })));
  if (r.reg || r.start) parts.push([r.reg ? esc(fill(L.reg, { d: fdt(r.reg, lang) })) : '', r.start ? esc(fill(L.start, { d: fdt(r.start, lang) })) : ''].filter(Boolean).join(' · '));   // item 120
  if (!parts.length) return '';
  let h = ''; try { h = new URL(r.src).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  return '<div class="kf kdld"><dt>' + esc(L.k) + '</dt><dd>' + parts.join('<br>') + ' <a class="src" href="' + esc(r.src) + '" rel="nofollow noopener" target="_blank">' + esc(h) + '</a></dd></div>';
}

// ------------------------------------------------------------------------------------------------ 114: Wayback Machine line
let WB = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
let WB_ALL = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
const ts2d = t => /^\d{8}/.test(String(t || '')) ? t.slice(0, 4) + '-' + t.slice(4, 6) + '-' + t.slice(6, 8) : null;
export function wbLine(wb, x, lang) {   // '' or one <li>
  const r = wb && x && wb.pages && wb.pages[x.url]; if (!r || !r.f || !WB) return '';
  const a = ts2d(r.f), b = ts2d(r.l || r.f); if (!a) return '';
  const link = (t, label) => '<a href="https://web.archive.org/web/' + esc(t) + '/' + esc(x.url) + '" rel="nofollow noopener" target="_blank">' + esc(label) + '</a>';
  return '<li class="kfact kwb">' + fill(esc(WB[lang] || WB.en), { a: link(r.f, fdt(a, lang)), b: link(r.l || r.f, fdt(b, lang)) }) + ' <a class="src" href="https://web.archive.org/web/*/' + esc(x.url) + '" rel="nofollow noopener" target="_blank">' + esc(WB_ALL[lang] || WB_ALL.en) + '</a></li>';
}

// ------------------------------------------------------------------------------------------------ 116, 118: gaps and automatic checks
const GF = ['pin', 'pn', 'co', 'pay', 'prog', 'price', 'ho'];
const GW = { pin: 3, pn: 3, co: 2, pay: 2, prog: 2, price: 1, ho: 1 };   // what a buyer needs first counts more when choosing the next work
let G = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
let RULE = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.length);
function fieldOk(ix, x, k) {
  const fx = x.fx || {}, c = ix.caseBy.get(x.id) || {};
  switch (k) {
    case 'pin': return has(fx.lat) && has(fx.lng);
    case 'pn': return has(x.pn);
    case 'co': return has(fx.developer_company) || !!(c.verified && c.verified.record && c.verified.record !== 'none');
    case 'pay': return has(fx.payment_plan);
    case 'prog': return (c.checks || {}).progress != null || (fx.dld && fx.dld.pct != null);
    case 'price': return has(fx.price_min);
    case 'ho': return has(fx.handover_promised) || has(c.done);
  }
  return false;
}
const GAPS = new WeakMap();
export function gaps(ix) {   // [{ market, country, projects, missing: {field: n}, next: [field, n][] }]
  let g = GAPS.get(ix); if (g) return g;
  const M = new Map();
  for (const x of ix.P) {
    const m = M.get(x.mk) || { market: x.mk, country: x.co, projects: 0, missing: Object.fromEntries(GF.map(k => [k, 0])) };
    m.projects++; for (const k of GF) if (!fieldOk(ix, x, k)) m.missing[k]++; M.set(x.mk, m);
  }
  g = [...M.values()].filter(m => m.projects >= 10).map(m => Object.assign(m, { next: GF.map(k => [k, m.missing[k], m.missing[k] * GW[k]]).filter(a => a[1] > 0).sort((a, b) => b[2] - a[2] || b[1] - a[1]).slice(0, 3).map(a => [a[0], a[1]]) }))
    .sort((a, b) => b.next.reduce((s, n) => s + n[1] * GW[n[0]], 0) - a.next.reduce((s, n) => s + n[1] * GW[n[0]], 0));
  GAPS.set(ix, g); return g;
}
export function dqJson(ix) {
  const qa = (ix.named && ix.named.qa) || null, al = (ix.named && ix.named.aliases) || { developers: DEV_ALIAS, projects: PROJ_ALIAS };
  return {
    gaps: { method: 'Places with 10 or more projects. missing = projects without the fact on their published record. next = up to three facts ranked by missing count x weight (pin 3, permit number 3, registered company 2, payment plan 2, construction status 2, price 1, handover 1).', weights: GW, places: gaps(ix).map(m => ({ market: m.market, country: m.country, projects: m.projects, missing: m.missing, next: m.next.map(a => a[0]) })) },
    validation: qa ? { checked: qa.checked, records: qa.records, held: qa.held, counts: qa.counts || {}, rules: qa.rules, issues: (qa.issues || []).slice(0, 500).map(i => ({ id: i[0], rule: i[1], field: i[2], value: i[3] })) } : null,
    aliases: { developers: al.developers || {}, projects: al.projects || {}, rule: 'Old addresses answer with a 301 to the stable page in every language and in /api/v1.' }
  };
}
export function dqExtra(ix, lang) {
  if (!G) return '';
  const L = G[lang] || G.en, P = pre(lang), byId = ix.byId;
  const g = gaps(ix);
  const grow = g.map(m => '<tr><th scope="row">' + bdi(m.market) + '</th><td>' + nf(m.projects, lang) + '</td><td>' + m.next.map(a => esc(fill(L.miss, { f: L.f[a[0]], n: nf(a[1], lang) }))).join('<br>') + '</td></tr>').join('');
  let h = '<h2 id="gaps">' + esc(L.h) + '</h2><p class="k-xs">' + esc(L.lead) + '</p><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.th.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' + grow + '</tbody></table></div>';
  const qa = ix.named && ix.named.qa;
  if (qa && qa.rules) {
    const cnt = qa.counts || {};
    const vrow = Object.entries(qa.rules).map(([k, r]) => '<tr><th scope="row">' + esc((RULE[k] || {})[lang] || (RULE[k] || {}).en || r[1]) + '</th><td>' + esc(L.vk[r[0]] || r[0]) + '</td><td>' + nf(cnt[k] || 0, lang) + '</td></tr>').join('');
    const items = (qa.issues || []).filter(i => byId.has(i[0])).slice(0, 40).map(i => { const x = byId.get(i[0]); return '<li><a href="' + P + '/projects/' + esc(x.s) + '/">' + bdi(x.n) + '</a> <small>(' + bdi(x.mk) + ')</small>: ' + esc((RULE[i[1]] || {})[lang] || i[1]) + (i[3] != null ? ' <small lang="en" dir="ltr">[' + esc(String(i[3])) + ']</small>' : '') + '</li>'; }).join('');
    h += '<h2 id="checks">' + esc(L.vh) + '</h2><p class="k-xs">' + esc(fill(L.vlead, { d: fdt(qa.checked, lang), n: nf(qa.records, lang) })) + '</p><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.vth.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' + vrow + '</tbody></table></div>' +
      (items ? '<h3>' + esc(L.vlist) + '</h3><ul>' + items + '</ul>' : '');
  }
  const al = (ix.named && ix.named.aliases) || { developers: DEV_ALIAS, projects: PROJ_ALIAS };
  const arow = [...Object.entries(al.projects || {}).map(([a, b]) => [P + '/projects/' + a + '/', P + '/projects/' + b + '/']), ...Object.entries(al.developers || {}).filter(([, b]) => ix.devs.has(b)).map(([a, b]) => [P + '/developers/' + a + '/', P + '/developers/' + b + '/'])]
    .map(([a, b]) => '<tr><td><code>' + esc(a) + '</code></td><td><a href="' + esc(b) + '">' + esc(b) + '</a></td></tr>').join('');
  if (arow) h += '<h2 id="ids">' + esc(L.ah) + '</h2><p class="k-xs">' + esc(L.alead) + '</p><div class="n30-tw"><table class="n30-t n30-sm"><thead><tr>' + L.ath.map(t => '<th scope="col">' + esc(t) + '</th>').join('') + '</tr></thead><tbody>' + arow + '</tbody></table></div>';
  return h;
}

// ------------------------------------------------------------------------------------------------ 108: stalled works
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?stalled\/?$|^\/api\/v1\/stalled$/;
let S = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
async function loadPub(env, name) {
  const c = (globalThis.__kbN31 = globalThis.__kbN31 || {});
  if (c[name] && Date.now() - c[name].t < 600000) return c[name].v;
  let v = null;
  try {
    let r = null; try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
    if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (r.ok) v = await r.json();
  } catch (e) { v = null; }
  c[name] = { t: Date.now(), v }; return v;
}
export async function wayback(env) { await loadT(env); return loadPub(env, 'wayback.json'); }
let N = null;
async function named() { if (!N) N = await import('./kbx_named.js'); return N; }
export async function stalledList(env) {
  await loadT(env);
  const n = await named(), ix = await n.data(env), ss = await loadPub(env, 'stalled-sites.json'), today = new Date().toISOString().slice(0, 10);
  const A = [], B = [], C = [];
  for (const x of ix.P) {
    for (const f of x.fl || []) if (f[0] === 'stalled' && n.okHttp(f[1])) { A.push({ x, src: f[1] }); break; }
    const d = x.fx && x.fx.dld;
    if (d && d.comp && d.comp < today && d.pct != null && d.pct < 100 && d.pd && d.src) B.push({ x, d });
    const sp = ss && ss.projects && ss.projects[x.id], ov = n.overdueOf(ix, x), ho = n.handoverOf(ix, x);
    if (sp && sp.status === 'ok' && (sp.no_visible_change_months || 0) >= 6 && ov && ho) C.push({ x, sp, ov, ho });
  }
  B.sort((a, b) => a.d.pct - b.d.pct); C.sort((a, b) => b.sp.no_visible_change_months - a.sp.no_visible_change_months);
  return { ix, n, A, B, C, updated: ix.updated };
}
async function stalledPage(env, shell, lang) {
  await loadT(env);
  const L = S[lang] || S.en, P = pre(lang), R = await stalledList(env), { n } = R;
  const li = (x, inner, src) => { let h = ''; try { h = new URL(src).hostname.replace(/^www\./, ''); } catch (e) {} return '<li><a href="' + P + '/projects/' + esc(x.s) + '/">' + bdi(x.n) + '</a> <small>(' + bdi(x.mk) + ')</small><br>' + inner + (src ? ' <a class="src" href="' + esc(src) + '" rel="nofollow noopener" target="_blank">' + esc(h) + '</a>' : '') + '</li>'; };
  const grp = (id, h, rows) => '<h2 id="' + id + '">' + esc(h) + ' <small>(' + esc(fill(L.n, { n: nf(rows.length, lang) })) + ')</small></h2>' + (rows.length ? '<ul class="n31s">' + rows.join('') + '</ul>' : '<p>' + esc(L.none) + '</p>');
  const A = R.A.map(r => li(r.x, esc(L.la), r.src));
  const B = R.B.map(r => li(r.x, esc(fill(L.lb, { d: fdt(r.d.comp, lang), p: nf(r.d.pct, lang, 2), i: fdt(r.d.pd, lang) })), r.d.src));
  const C = R.C.map(r => li(r.x, esc(fill(L.lc, { h: n.fd(r.ho.d, lang), m: nf(r.ov.m, lang), n: nf(r.sp.no_visible_change_months, lang), d: fdt((r.sp.newest_clear_dates || []).slice(-1)[0], lang) })), null));
  const canonU = ORIGIN + P + '/stalled/', dir = lang === 'ar' ? ' dir="rtl"' : '';
  const body = '<section class="phero"' + dir + '><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / ' + esc(L.h1) + '</p><h1>' + esc(L.h1) + '</h1><p class="lead">' + esc(L.lead) + '</p></div></section>' +
    '<div class="wrap n31"' + dir + '><style>.n31{padding-bottom:40px}.n31 h2{margin-top:28px}.n31s{padding-inline-start:18px}.n31s li{margin:0 0 12px}.n31 .src{font-size:.85em}</style>' +
    '<p class="k-xs">' + esc(fill(L.upd, { d: fdt(R.updated, lang) })) + ' <a href="/api/v1/stalled">JSON</a></p>' +
    grp('reported', L.a, A) + grp('register', L.b, B) + grp('space', L.c, C) +
    '<h2>' + esc(L.m_h) + '</h2><p class="k-xs">' + esc(L.method) + '</p><p>' + esc(L.more) + ': <a href="' + P + '/handover/overdue/">' + esc(L.ov) + '</a> · <a href="/satellite/">' + esc(L.sat) + '</a> · <a href="' + P + '/engineering/data-quality/">' + esc(L.dq) + '</a></p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', url: canonU, name: L.h1, description: L.lead.slice(0, 300), inLanguage: lang, dateModified: R.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: L.h1, item: canonU }] }] };
  return n.assemble({ title: L.t + ' | Kolaboro', desc: L.lead.slice(0, 152).replace(/\s+\S*$/, '') + '...', canon: canonU, body, ld, lastmod: R.updated, alt: l => ORIGIN + pre(l) + '/stalled/' }, lang, await shell(P + '/handover/overdue/'));
}
async function stalledJson(env) {
  await loadT(env);
  const R = await stalledList(env);
  const one = x => ({ id: x.id, slug: x.s, name: x.n, market: x.mk, country: x.co, url: ORIGIN + '/projects/' + x.s + '/' });
  return { api: 'kolaboro-stalled-v1', updated: R.updated, method: S.en.method, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
    reported_in_source: R.A.map(r => Object.assign(one(r.x), { source: r.src })),
    register_date_passed: R.B.map(r => Object.assign(one(r.x), { register: 'Dubai Land Department', completion_on_register: r.d.comp, built_pct: r.d.pct, inspection: r.d.pd, source: r.d.src })),
    no_visible_change: R.C.map(r => Object.assign(one(r.x), { handover_on_record: r.ho.d, months_since: r.ov.m, no_visible_change_months: r.sp.no_visible_change_months, newest_clear_image: (r.sp.newest_clear_dates || []).slice(-1)[0] || null, source: ORIGIN + '/data/stalled-sites.json' })) };
}
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  if (p === '/api/v1/stalled') return new Response(JSON.stringify(await stalledJson(env), null, 1), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' } });
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const lang = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(p) || [])[1] || 'en';
  return new Response(await stalledPage(env, shell, lang), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'content-language': lang } });
}
const SL = { en: 'Stalled works and passed dates', es: 'Obras paradas y fechas vencidas', de: 'Stillstand und verstrichene Termine', fr: 'Chantiers à l’arrêt et dates dépassées', nl: 'Stilgevallen bouw en verstreken data', ru: 'Остановленные стройки и прошедшие сроки', zh: '停工与已过期限', ar: 'أعمال متوقفة ومواعيد فائتة' };
export const stalledLabel = lang => SL[lang] || SL.en;
export { LANGS };

// ------------------------------------------------------------------------------------------------ 129, 130: results and credit ratings
// Latest full-year results and credit ratings of a few large listed developers, as the company announced them (listed-developers.json fin, rt).
let FR = null;   // n31c: in /data/n31c-i18n.json (Pages 25 MiB limit), set by loadT
const fdym = (d, l) => /^\d{4}-\d{2}$/.test(String(d || '')) ? (() => { try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + '-15T12:00:00Z')); } catch (e) { return d; } })() : fdt(d, l);
const money = (cur, v, l) => '<span dir="ltr">' + esc(cur) + ' ' + nf(v / 1e9, l, 1) + ' bn</span>';
export function finRtHtml(d, lang) {   // '' or <li> items
  if (!d || !FR) return '';
  const L = FR[lang] || FR.en, src = (u, ) => { let h = ''; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } return ' <a class="k-src" href="' + esc(u) + '" rel="noopener nofollow" target="_blank">' + esc(h) + '</a>'; };
  const out = [];
  const f = d.fin;
  if (f && f.rev && f.src) out.push(fill(esc(L.res), { y: esc(f.y), d: esc(fdt(f.d, lang)), rev: money(f.cur, f.rev, lang), np: f.np ? fill(esc(L.np), { v: money(f.cur, f.np, lang) }) : '', pbt: f.pbt ? fill(esc(L.pbt), { v: money(f.cur, f.pbt, lang) }) : '' }) + src(f.src));
  for (const r of d.rt || []) if (r.src && r.r) out.push(fill(esc(L.rt), { d: esc(fdym(r.d, lang)), a: '<span lang="en" dir="ltr">' + esc(r.a) + '</span>', r: '<b dir="ltr">' + esc(r.r) + '</b>', o: esc(L.o[r.o] || r.o) }) + src(r.src));
  if (!out.length) return '';
  return out.map(s => '<li class="kfact">' + s + '</li>').join('') + '<li class="k-muted">' + esc(L.cav) + '</li>';
}
