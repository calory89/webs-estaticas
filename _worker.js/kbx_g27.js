// kolaboro.com batch 27 (agent n27g, 13 Nov 2026): Google visibility. No model calls, nothing stored, nothing estimated.
//  - item 2: the 300 projects with the most search demand (list chosen by n27r1 and n27r2, method in their logs) get links from
//    the home page and the hubs (30 on the home page and /countries/, all 300 by place on /rankings/ and /rankings/transparency/),
//    and from their market page /m/<market>/ ("Most searched projects in <market>")
//  - item 9: /m/<market>/ of the 50 markets with the most projects carries one dated paragraph of figures computed from our open
//    data (projects, developers, permit and handover dates published, dates moved, dates passed, median transparency score)
// Blocks never wait for data: until the named data is loaded in this isolate the list embedded below is used (refreshed with the
// list by n27/g/swap.py), so every request carries the links.
import { data as namedData, handoverOf, overdueOf, OV_MIN, esc, pre, fd, okHttp, isListing } from './kbx_named.js';
import { trData } from './kbx_tr.js';
import { mkName, hyear } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';

export const TOP_IDS = 'PHK-011 BALI-044 BKK-001 BALI-034 BALI-049 BALI-033 PHK-001 PHK-008 BALI-001 BALI-026 BALI-078 BALI-040 BALI-014 PHK-006 BALI-037 BALI-025 PHK-013 BALI-035 BALI-067 BALI-076 BALI-023 PHK-009 BALI-055 BALI-022 PHL-001 BALI-036 BALI-021 BALI-030 BALI-006 BALI-048 BALI-056 BALI-047 PHK-018 BKK-006 RMY-012 PHK-012 PHK-028 PHK-019 PHK-031 PHK-030 PHK-032 MIA-006 MIA-004 MIA-010 PHK-020 MIA-003 BKK-007 MIA-001 KUA-010 MIA-002 MIA-011 BKK-009 MIA-005 MIA-012 KUA-013 KUA-008 KUA-009 KUA-011 PAT-001 MIA-013 RMY-005 PAT-004 NSK-003 KUA-012 PAT-003 MIA-009 RMY-006 RMY-011 PAT-010 RMY-004 MIA-008 RMY-001 RMY-023 PAT-007 RMY-009 BKK-004 MYS-028 MIA-036 RMY-024 MYS-027 SGN-002 MYS-026 MIA-007 MYS-024 BKK-008 KSM-003 BKK-005 PHL-012 MYS-029 MYS-001 LKA-009 SGN-001 PAT-002 PHL-010 SYD-004 MYS-025 PAT-018 MYS-018 VNM-008 KSM-001 KSM-002 MYS-004 VNM-010 MYS-013 VNM-004 SYD-001 HHQ-003 NSK-001 HNL-001 LOM-006 ORL-001 PER-001 PUN-003 SYD-002 PUN-004 LOM-005 CAB-005 LOM-008 TYO-004 LOM-007 LKA-002 BRA-002 KUA-004 CAB-009 LKA-014 LOM-023 SGN-007 HNL-002 LBJ-002 CAB-006 KSM-011 YVR-001 YVR-005 CAB-001 TYO-003 MID-003 CAB-007 DAD-001 YVR-007 NYC-003 PUN-008 OOL-006 PVR-006 NYC-002 KSM-004 OOL-005 TYO-001 LOM-001 OOL-008 PVR-005 DXB-012 DXB-011 DXB-002 DXB-160 DXB-004 DXB-143 DXB-145 DXB-068 DXB-027 DXB-005 DXB-003 DXB-063 DXB-032 DXB-062 DXB-071 DXB-006 DXB-149 DXB-073 DXB-029 DXB-075 DXB-010 DXB-074 DXB-129 DXB-123 DXB-008 DXB-144 DXB-094 DXB-077 DXB-017 DXB-037 DXB-009 DXB-021 DXB-099 DXB-110 DXB-016 DXB-125 DXB-087 DXB-124 DXB-121 DXB-146 DXB-091 DXB-096 DXB-098 DXB-051 DXB-065 DXB-142 DXB-020 DXB-095 DXB-103 DXB-116 DXB-083 DXB-130 DXB-069 DXB-100 DXB-079 DXB-117 DXB-035 DXB-045 RAK-013 CDS-005 CDS-003 NCE-005 KSA-002 CDS-002 CDS-004 QAT-001 CBL-001 CDS-001 PMI-005 RAK-004 ESP-007 ESP-001 CDS-010 CDS-008 CDS-009 CDS-033 CYP-008 CBL-006 CDS-034 CDS-032 AUH-014 OMN-001 CYP-009 GRC-001 OMN-011 CDS-006 CYP-004 CYP-015 NCY-006 GEO-001 CAN-002 GRC-004 NCY-004 OMN-015 GEO-002 KSA-008 RAK-026 OMN-016 GRC-013 CYP-013 AUH-004 AUH-006 RAK-025 IST-007 RAK-024 GEO-005 SHJ-010 ALG-001 AUH-013 AUH-003 ALG-003 IST-009 SHJ-008 SHJ-001 ZNZ-007 MLA-002 AUH-017 ALG-007 AUH-009 RAK-016 EGY-012 ALG-012 LON-005 AUH-018 AYT-007 MRK-001 LIS-010 AUH-015 LIS-009 RAK-001 IST-010 IST-001 RAK-005 LIS-008 EGY-014 EGY-015 EGY-018 LON-010 PRT-001 AYT-005 RAK-010 LIS-003 BAH-003 MRU-007 BJV-003 MNE-008 MRU-011 FNC-001 MNE-001 CBL-002'.split(' ');
export const TOP_EMB = TB.kbx_g27_TOP_EMB /* n40 k5: in /data/i18n/kbx_g27.json */;   // [id, slug, name, market] at the time of the list, used until the named data is loaded
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const T = {
  en: { h: 'Most searched projects', s: 'The off-plan projects people search for most, each page with its handover date, permit status and developer, every fact with its source.', all: 'All 300 by place', inm: 'Most searched projects in {p}' },
  es: { h: 'Proyectos más buscados', s: 'Los proyectos sobre plano que más se buscan, cada ficha con su fecha de entrega, su permiso y su promotor, cada dato con su fuente.', all: 'Los 300, por lugar', inm: 'Proyectos más buscados en {p}' },
  de: { h: 'Meistgesuchte Projekte', s: 'Die Off-Plan-Projekte, nach denen am häufigsten gesucht wird, jede Seite mit Übergabetermin, Genehmigungsstand und Bauträger, jede Angabe mit Quelle.', all: 'Alle 300 nach Ort', inm: 'Meistgesuchte Projekte in {p}' },
  fr: { h: 'Projets les plus recherchés', s: 'Les projets sur plan les plus recherchés, chaque fiche avec sa date de livraison, son permis et son promoteur, chaque fait avec sa source.', all: 'Les 300, par lieu', inm: 'Projets les plus recherchés à {p}' },
  nl: { h: 'Meest gezochte projecten', s: 'De projecten op plan waar het meest naar gezocht wordt, elke pagina met opleverdatum, vergunning en ontwikkelaar, elk feit met bron.', all: 'Alle 300 per plaats', inm: 'Meest gezochte projecten in {p}' },
  ru: { h: 'Самые искомые проекты', s: 'Строящиеся проекты, которые ищут чаще всего: на каждой странице срок сдачи, разрешение и застройщик, у каждого факта есть источник.', all: 'Все 300 по местам', inm: 'Самые искомые проекты: {p}' },
  zh: { h: '搜索最多的项目', s: '搜索量最高的期房项目，每个页面列出交付日期、许可证状态和开发商，每项事实均附来源。', all: '按地点查看全部 300 个', inm: '{p}搜索最多的项目' },
  ar: { h: 'المشاريع الأكثر بحثًا', s: 'المشاريع على المخطط الأكثر بحثًا، لكل صفحة موعد التسليم وحالة الترخيص والمطوّر، ولكل معلومة مصدرها.', all: 'كل المشاريع الـ300 حسب المكان', inm: 'المشاريع الأكثر بحثًا في {p}' }
};
const t = (lang, k, v) => { let s = (T[lang] || T.en)[k] || T.en[k]; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const slugA = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');   // same as kbx_facets.js
const CSS = '<style id="kg27-css">.kg27{padding:28px 0;border-top:1px solid var(--line)}.kg27 h2{font-size:1.25rem;margin:0 0 4px}.kg27-s{color:var(--muted);margin:0 0 12px;max-width:72ch}.kg27-l{columns:3 220px;padding-inline-start:18px;margin:0}.kg27-l li{margin:0 0 8px;break-inside:avoid}.kg27-l small{color:var(--muted)}.kg27 h3{font-size:1rem;margin:16px 0 6px}.kg27-p{max-width:78ch;line-height:1.6}.kg27-p a.src{font-size:.8rem}@media (max-width:600px),(pointer:coarse){.kg27-l li{margin:0}.kg27-l a{display:inline-block;padding:12px 0;min-height:44px;box-sizing:border-box}}</style>';

let IX = null, TOP = null, LOADING = null;
let EMB = null;
function build(ix) {
  if (!ix) return EMB || (EMB = group(null, TOP_EMB.map(([id, s, n, mk]) => ({ id, s, n, mk }))));   // before the named data is loaded
  if (TOP && TOP.ix === ix) return TOP;
  TOP = group(ix, TOP_IDS.map(i => ix.byId.get(i)).filter(Boolean));
  return TOP;
}
function group(ix, L) {
  const byMk = new Map();
  for (const x of L) { if (!byMk.has(x.mk)) byMk.set(x.mk, []); byMk.get(x.mk).push(x); }
  return { ix, L, byMk, html: new Map() };
}
function ready(env, ctx) {
  if (IX) return IX;
  if (!LOADING) { LOADING = namedData(env).then(ix => { IX = ix; return ix; }).catch(() => null).finally(() => { LOADING = null; }); if (ctx && ctx.waitUntil) ctx.waitUntil(LOADING); }
  return null;
}
const li = (x, lang) => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a> <small>' + bdi(mkName(x.mk, lang)) + '</small></li>';
// kind: 'home' (30 links), 'all' (all 300 grouped by place)
function topHtml(ix, lang, kind) {
  const P = build(ix), key = lang + '|' + kind; let h = P.html.get(key); if (h) return h;
  const head = '<section class="kg27" id="most-searched"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><h2>' + esc(t(lang, 'h')) + '</h2><p class="kg27-s">' + esc(t(lang, 's')) + '</p>';
  if (kind === 'home') h = head + '<ul class="kg27-l">' + P.L.slice(0, 30).map(x => li(x, lang)).join('') + '</ul><p><a href="' + pre(lang) + '/rankings/transparency/#most-searched">' + esc(t(lang, 'all')) + '</a></p></div></section>';
  else h = head + [...P.byMk.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([mk, L]) => '<h3>' + bdi(mkName(mk, lang)) + '</h3><ul class="kg27-l">' + L.map(x => '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a></li>').join('') + '</ul>').join('') + '</div></section>';
  h = CSS + h; P.html.set(key, h); return h;
}
// the home page, /countries/, /rankings/, /rankings/transparency/ (index.js, after the least-linked block)
export function topReady(env, ctx, lang, path) {
  const ix = ready(env, ctx);   // null while loading: the list as embedded above
  const kind = /rankings\/?$|rankings\/transparency\/?$/.test(path) ? 'all' : 'home';
  try { return topHtml(ix, LANGS.includes(lang) ? lang : 'en', kind); } catch (e) { return ''; }
}

// ------------------------------------------------------------------------------------------------ /m/<market>/ (English)
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const nf = n => Number(n).toLocaleString('en-GB');
const srcL = (u, l) => ' <a class="src" href="' + u + '">' + esc(l) + '</a>';
let MK = null;
async function marketFacts(env) {
  const [ix, tri] = await Promise.all([namedData(env), trData(env).catch(() => null)]);
  if (MK && MK.ix === ix && MK.tri === tri && MK.mo === new Date().toISOString().slice(0, 7)) return MK;
  const g = new Map();
  for (const x of ix.P) { if (!g.has(x.mk)) g.set(x.mk, []); g.get(x.mk).push(x); }
  const big = new Set([...g.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 50).map(e => e[0]));
  MK = { ix, tri, g, big, mo: new Date().toISOString().slice(0, 7), html: new Map() };
  return MK;
}
function paraHtml(M, mk) {
  const ix = M.ix, L = M.g.get(mk) || [], n = L.length; if (!n) return '';
  const devs = new Set(L.map(x => x.dvs || x.dv).filter(Boolean)).size, pn = L.filter(x => x.pn).length, H = L.map(x => handoverOf(ix, x)).filter(Boolean), hN = H.length;
  const ys = new Map(); for (const h of H) { const y = hyear(h.d); if (y) ys.set(y, (ys.get(y) || 0) + 1); }
  const yTop = [...ys.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const mv = L.filter(x => { const h = (ix.prom[x.id] || []).find(p => p.k === 'handover'); return h && h.mv > 0; }).length, ov = L.filter(x => overdueOf(ix, x)).length;
  const pr = L.filter(x => (x.fx || {}).price_min).length, own = L.filter(x => okHttp(x.url) && !isListing(x.url)).length;
  const sc = M.tri ? L.map(x => { const r = M.tri.rows.get(x.id); return r ? r.score : null; }).filter(v => v != null).sort((a, b) => a - b) : [];
  const med = sc.length ? (sc.length % 2 ? sc[(sc.length - 1) / 2] : Math.round((sc[sc.length / 2 - 1] + sc[sc.length / 2]) / 2)) : null;
  const d = fd(String(ix.updated || '').slice(0, 10), 'en'), s = n === 1 ? '' : 's';
  const parts = ['<b>' + esc(mk) + ' in numbers, as of ' + esc(d) + ':</b> we track ' + nf(n) + ' off-plan project' + s + ' from ' + nf(devs) + ' developer' + (devs === 1 ? '' : 's') + '.',
    nf(pn) + ' (' + pct(pn, n) + '%) publish a permit or licence number and ' + nf(hN) + ' (' + pct(hN, n) + '%) a handover date' + (yTop ? ', most often ' + yTop[0] + ' (' + nf(yTop[1]) + ')' : '') + '.',
    'Handover dates on record moved later at least once for ' + nf(mv) + ' and have passed without a recorded completion for ' + nf(ov) + (ov ? ' (<a href="/handover/overdue/' + (ov >= OV_MIN ? slugA(mk) + '/' : '') + '">overdue report</a>)' : '') + '.',
    nf(pr) + ' publish a price; for ' + nf(own) + ' the page we read is the developer\'s own site rather than a listing portal.' + (med != null ? ' Median transparency score: ' + med + '/100.' : '')];
  return '<p class="kg27-p">' + parts.join(' ') + srcL('/data/named.json', 'named.json') + srcL('/data/promises.json', 'promises.json') + srcL('/methods/transparency-score/', 'method') + '</p>';
}
export async function marketBlock(env, key) {
  let M; try { M = await marketFacts(env); } catch (e) { return ''; }
  const k = String(key || '').toLowerCase(), mk = [...M.g.keys()].find(m => m.toLowerCase().replace(/\s+/g, '-') === k || encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-')) === k);
  if (!mk) return '';
  let h = M.html.get(mk); if (h != null) return h;
  const P = build(M.ix), top = P.byMk.get(mk) || [];
  const para = M.big.has(mk) ? paraHtml(M, mk) : '';
  h = para || top.length ? CSS + '<section class="kg27" id="in-numbers"><div class="wrap">' + para + (top.length ? '<h2>' + esc(t('en', 'inm', { p: mk })) + '</h2><ul class="kg27-l">' + top.map(x => '<li><a href="/projects/' + x.s + '/">' + bdi(x.n) + '</a>' + (x.dv ? ' <small>' + bdi(x.dv) + '</small>' : '') + '</li>').join('') + '</ul>' : '') + '</div></section>' : '';
  M.html.set(mk, h); return h;
}
