// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_p29__q, $t = TB.kbx_p29__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { regSale } from './kbx_n31d_rs.js';
import { NT } from './kbx_buy_notes.js';
import { rulesFor } from './kbx_rules.js';
import { words } from './kbx_named_qa.js';
import { TB } from './kbx_strings.js';
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const okU = u => typeof u === $q.b && /^https?:\/\/[^\s"<>]+$/.test(u);
const pre = l => l === 'en' ? '' : '/' + l;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (lang, v, o) => { try { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + LOC[lang] + JSON.stringify(o || 0); return (c[k] || (c[k] = new Intl.NumberFormat(LOC[lang] || 'en-GB', o))).format(v); } catch (e) { return String(v); } };
const src = (u, label) => okU(u) ? $q.c + esc(u) + $q.d + esc(label || host(u)) + '</a>' : '';
const own = (u, label) => $q.c + esc(u) + '">' + esc(label) + '</a>';
const li = (h, s) => $q.e + h + (s || '') + '</li>';
const enq = (t, lang) => lang === 'en' ? esc(t) : $q.f + esc(t) + $q.g;
const S = TB.kbx_p29_S ;
export const t29 = (lang, k, v) => { if (v && (v.k === 1 || v.n === 1) && S[lang] && S[lang][k + '_1']) k += '_1'; const s = (S[lang] && S[lang][k]) || S.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(?<!\.)\.\.(?=\s|$)/g, '.') : s; };
const LAW = {
id_uupa: { n: 'UUPA (Law 5/1960), Art. 21, 26', u: 'https://peraturan.go.id/files/UU0051960.pdf', d: '2026-11-03' },
id_pp18: { n: 'PP 18/2021, Art. 52, 71, 72', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03' },
th_condo: { n: 'Condominium Act B.E. 2522, s. 19 bis, 19 ter', u: 'https://www.dol.go.th/media/716929789247754240/migration/2025/10/6Wp3Tk7hgK5HdDRuvYXGcNsi.pdf', d: '2026-11-03' },
th_dol: { n: 'Department of Lands', u: 'https://www.dol.go.th/', d: '2026-11-13' },
mx_lie: { n: 'Ley de Inversión Extranjera, Art. 2, 11, 13', u: 'https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo14.html', d: '2026-11-13' },
ae_l7: { n: 'Dubai Law No. 7 of 2006, Art. 4', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2006/Law%20No.%20(7)%20of%202006.html', d: '2026-11-14' }
};
const AE_L7 = {
en: 'Dubai Law No. 7 of 2006, Article 4: ownership is for UAE and GCC nationals and their companies; other foreigners may, with the Ruler’s approval and only in areas he designates, hold freehold without time limit, or usufruct or leasehold for up to 99 years.',
es: 'Ley de Dubái 7/2006, artículo 4: la propiedad es para nacionales de EAU y del CCG y sus sociedades; los demás extranjeros pueden, con aprobación del Gobernante y solo en las zonas que él designe, tener pleno dominio sin límite de tiempo, o usufructo o arrendamiento de hasta 99 años.',
fr: 'Loi de Dubaï n° 7 de 2006, article 4 : la propriété est réservée aux ressortissants des EAU et du CCG et à leurs sociétés ; les autres étrangers peuvent, avec l’accord du Souverain et seulement dans les zones qu’il désigne, détenir la pleine propriété sans limite de durée, ou un usufruit ou un bail de 99 ans au plus.',
de: 'Dubai-Gesetz Nr. 7/2006, Artikel 4: Eigentum ist Staatsangehörigen der VAE und der GCC-Staaten und ihren Gesellschaften vorbehalten; andere Ausländer können mit Zustimmung des Herrschers und nur in von ihm bestimmten Gebieten unbefristetes Volleigentum oder Nießbrauch oder Pacht bis 99 Jahre erhalten.',
nl: 'Wet van Dubai nr. 7/2006, artikel 4: eigendom is voor staatsburgers van de VAE en de GCC en hun bedrijven; andere buitenlanders kunnen, met goedkeuring van de heerser en alleen in door hem aangewezen gebieden, volle eigendom zonder tijdslimiet krijgen, of vruchtgebruik of erfpacht tot 99 jaar.',
ru: 'Закон Дубая № 7/2006, статья 4: собственность доступна гражданам ОАЭ и стран ССАГПЗ и их компаниям; другие иностранцы с одобрения Правителя и только в определённых им зонах могут получить бессрочную собственность (freehold) либо узуфрукт или аренду до 99 лет.',
zh: '迪拜 2006 年第 7 号法律第 4 条：产权限于阿联酋和海合会国家公民及其公司；其他外国人经统治者批准，仅可在其指定区域取得无期限永久产权，或最长 99 年的用益权或租赁权。',
ar: 'قانون دبي رقم 7 لسنة 2006، المادة 4: التملّك لمواطني الدولة ودول مجلس التعاون وشركاتهم؛ ويجوز لغيرهم من الأجانب، بموافقة الحاكم وفي مناطق يحددها فقط، التملّك الحر دون قيد زمني، أو حق الانتفاع أو الإجارة حتى 99 سنة.'
};
const MX_COAST = new Set(['Riviera Maya', 'Los Cabos', 'Puerto Vallarta', 'Riviera Nayarit']);
const landed = x => /villa|house|home|townhouse|bungalow|land|plot|landed/i.test(((x.fx || {}).unit_types || []).join(' ') + ' ' + x.n) && !/apartment|condo|suite|studio|tower/i.test(((x.fx || {}).unit_types || []).join(' '));
function lawFor(x, lang) {
const n = k => (NT[k] && (NT[k][lang] || NT[k].en)) || '';
if (x.co === $q.h) return [[n($q.i), LAW.id_uupa]].concat(landed(x) ? [[n($q.j), LAW.id_pp18]] : []);
if (x.co === $q.k) return landed(x) ? [[n($q.l), LAW.th_dol]] : [[n($q.m), LAW.th_condo]];
if (x.co === $q.n && MX_COAST.has(x.mk)) return [[$t.o_MX_RZ[lang] || $t.o_MX_RZ.en, LAW.mx_lie]];
if (x.co === 'UAE' && x.mk === 'Dubai') return [[AE_L7[lang] || AE_L7.en, LAW.ae_l7]];
return [];
}
const LOCAL = {
'PHK-011': ['ดิ โอลีฟ', 'https://eia.onep.go.th/eia/detail?id=15578'],
'BKK-004': ['สติลล์ สุขุมวิท 20', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=138'],
'PAT-010': ['อควารัส จอมเทียน พัทยา', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=139'],
'HHQ-003': ['เดอะ สแตนดาร์ด หัวหิน', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=28'],
'BKK-009': ['เอ็กซ์ที เทน เอกมัย', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=5'],
'PAT-018': ['พีทีวาย 1', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=7'],
'PHK-028': ['เดอะ ไทเทิล โมเดวา บางเทา', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=6']
};
export const localName = x => LOCAL[x.id] || null;
const MED = new WeakMap();
export const ppmOf = x => { if (regSale(x)) return null; const fx = x.fx || {}, p = +fx.price_min, s = +fx.size_min_m2; return p > 0 && s >= 15 && s <= 5000 && fx.currency ? p / s : null; };
export function medians(ix) {
let M = MED.get(ix); if (M) return M;
const G = new Map();
for (const x of ix.P) { const v = ppmOf(x); if (v == null) continue; const k = x.mk + '|' + String(x.fx.currency).toUpperCase(); if (!G.has(k)) G.set(k, []); G.get(k).push(v); }
M = new Map();
for (const [k, a] of G) if (a.length >= 5) { a.sort((p, q) => p - q); const h = a.length >> 1; M.set(k, { n: a.length, m: a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2 }); }
MED.set(ix, M); return M;
}
export function ppmMedian(ix, x, lang, mkL) {
const v = ppmOf(x); if (v == null) return '';
const cur = String(x.fx.currency).toUpperCase(), m = medians(ix).get(x.mk + '|' + cur); if (!m) return '';
const d = Math.round((v / m.m - 1) * 100), p = Math.abs(d) < 5 ? t29(lang, 'p_eq') : t29(lang, d > 0 ? 'p_up' : 'p_dn', { x: nf(lang, Math.abs(d)) });
return li(esc(t29(lang, $q.o, { mk: mkL, k: nf(lang, m.n), c: cur, v: cur + ' ' + nf(lang, Math.round(m.m)), p })), own($q.p, $q.q));
}
const CO_REG = { USA: 'United States', UK: 'United Kingdom', 'Türkiye': 'Turkey' };
export function companyRegs(REG, x) {
if (!REG || !REG.length) return [];
const has = r => (r.checks || []).includes($q.r) && okU(r.url);
const byM = REG.filter(r => r.market === x.mk && has(r)); if (byM.length) return byM;
const co = CO_REG[x.co] || x.co; return REG.filter(r => r.market === co && has(r));
}
const regLi = (lang, r, p) => li('<b>' + esc(t29(lang, 'dreg', { p })) + $q.s + esc(r.register) + $q.t, src(r.url));
export function p29Project(ix, x, lang, c, h, ex) {
const fx = x.fx || {}, name = x.n, page = h.page, rd = h.read, by = page ? t29(lang, $q.u, { d: rd }) : '';
const out = { faq: [], toc: [], secs: {} };
const plan = fx.payment_plan && h.cleanOk(String(fx.payment_plan)) ? String(fx.payment_plan) : '';
out.secs.plan = $q.v + (plan ? li('<b>' + esc(h.tr(lang, $q.w)) + $q.x + enq(plan, lang), src(page)) : '<li>' + esc(t29(lang, $q.y, { d: rd })) + '</li>') +
(fx.deposit_pct ? li('<b>' + esc(h.tr(lang, $q.z)) + $q.x + esc(nf(lang, fx.deposit_pct)) + '%', src(page)) : '') + (plan && by ? $q.A + esc(by) + $q.B : '') + '</ul>';
const T = [], A = [];
if ((fx.unit_types || []).length) { T.push(li('<b>' + esc(h.tr(lang, $q.C)) + $q.x + enq(fx.unit_types.join(', '), lang), src(page))); A.push(fx.unit_types.join(', ')); }
if (fx.size_min_m2) { const s = nf(lang, fx.size_min_m2) + (fx.size_max_m2 && fx.size_max_m2 !== fx.size_min_m2 ? ' - ' + nf(lang, fx.size_max_m2) : '') + ' m²'; T.push(li('<b>' + esc(h.tr(lang, $q.D)) + $q.x + esc(s), src(page))); A.push(s); }
if (c && c.units) { T.push(li('<b>' + esc(h.tr(lang, $q.E)) + $q.x + esc(nf(lang, c.units)), src(page))); A.push(h.tr(lang, $q.E) + ': ' + nf(lang, c.units)); }
if (!h.rvd && x.ev && x.ev.plans && h.cleanOk(x.ev.plans)) T.push(li('<b>' + esc(t29(lang, 'ty_pl')) + $q.x + enq(x.ev.plans, lang), src(x.du || page)));
out.secs.types = $q.v + (T.length ? T.join('') + (by && !plan ? $q.A + esc(by) + $q.B : '') : '<li>' + esc(t29(lang, $q.F, { d: rd })) + '</li>') + '</ul>';
const R = [], fo = fx.foreign_ownership && h.cleanOk(String(fx.foreign_ownership)) ? String(fx.foreign_ownership) : '', L = lawFor(x, lang), co = h.coName(x.co, lang) || x.co;
if (fo) R.push(li('<b>' + esc(t29(lang, $q.G)) + '</b> ' + enq(fo, lang), src(page)));
const LL = L.filter(l => l[0]);
if (LL.length) R.push(li('<b>' + esc(t29(lang, $q.H, { co })) + '</b> ' + LL.map(([txt, s]) => esc(txt) + src(s.u, s.n) + $q.I + esc(h.fd(s.d, lang)) + $q.J).join(' ')));
if (fo) out.faq.push([t29(lang, 'q_own', { n: name }), (t29(lang, $q.G) + ' ' + fo + '.' + (L.length ? ' ' + t29(lang, $q.H, { co }) + ' ' + L.map(l => l[1].n).join('; ') + '.' : '')).replace(/\.\.$/, '.'), [fo], 1]);
const rdat = ex && ex.ru, ds = ex && ex.sl && ex.sl.projects && ex.sl.projects[x.id] && !ex.sl.projects[x.id].outside ? ex.sl.projects[x.id].ds : null;
const rid = rdat ? rulesFor(rdat, x, ds) : [];
for (const id of rid.slice(0, 1)) {
const j = rdat.rules[id], cell = ['reg', 'stay', 'cap'].map(k => j[k]).find(cc => cc && cc.s === 'rule' && cc.t);
if (!cell) continue;
const txt = cell.t[lang] || cell.t.en, s0 = (cell.src || []).map(k => rdat.sources[k]).find(Boolean);
R.push(li('<b>' + esc(t29(lang, 'str_l', { p: $q.K })).replace($q.K, $q.L + pre(lang) + $q.M + esc(id) + '">' + esc(j.name) + '</a>') + '</b> ' + esc(txt), s0 ? src(s0.u, String(s0.n).split(',')[0]) : ''));
}
out.secs.rules = R.length ? $q.v + R.join('') + '</ul>' : '';
return out;
}
export function distLine(lang, name, pairs) {
if (!pairs.length) return { li: '', faq: null };
const sep = lang === 'zh' ? '；' : lang === 'ar' ? '؛ ' : '; ', cl = lang === 'zh' ? '：' : lang === 'fr' ? ' : ' : ': ';
const txt = pairs.map(([a, b]) => a + cl + b).join(sep);
return { li: li('<b>' + esc(t29(lang, 'wd_l')) + $q.s + esc(txt) + $q.t, $t.k0), faq: null };
}
export const satHtml29 = (lang, s) => s ? $q.N + esc(t29(lang, 'sat_l')) + ' ' + esc(s) + $q.O + esc(t29(lang, $q.P)) + $q.Q : '';
export function devAnswer(lang, P, en) {
const out = new Set(); const W = () => words(P.filter(p => !out.has(p[0])).map(p => p[2]).join(' '));
for (const k of en) { if (W() <= 60) break; out.add(k); }
return P.filter(p => !out.has(p[0])).map(p => p[1]).join(' ');
}
// n40 k25: projects by stage and handover year on developer pages: stacked bars plus the same counts as a table (rows: { st, stL, y })
const SY_C = { st_offplan: '#B07A12', st_construction: '#155C75', st_completed: '#2E7D4F', st_unknown: '#7A848C' };
export function devStageYear(lang, rows, dev) {
if (rows.length < 2) return '';
const ND = '~', yrs = new Map(), sts = [$q.R, $q.S, $q.T, $q.U].filter(k => rows.some(r => r.st === k)), stL = {};
for (const r of rows) { const y = r.y || ND; const o = yrs.get(y) || {}; o[r.st] = (o[r.st] || 0) + 1; yrs.set(y, o); stL[r.st] = r.stL; }
const Y = [...yrs.keys()].sort((a, b) => a === ND ? 1 : b === ND ? -1 : a.localeCompare(b)), tot = y => sts.reduce((n, k) => n + (yrs.get(y)[k] || 0), 0), mx = Math.max(...Y.map(tot));
const yl = y => y === ND ? t29(lang, 'sy_nd') : y, cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const W = 640, LW = 92, BW = 470, RH = 26, H = Y.length * RH + 34;
let g = '';
Y.forEach((y, i) => { let x = LW; const ty = 8 + i * RH; g += $q.V + (LW - 8) + '" y="' + (ty + 15) + $q.W + esc(yl(y)) + $q.X;
for (const k of sts) { const n = yrs.get(y)[k] || 0; if (!n) continue; const w = Math.max(2, Math.round(n / mx * BW)); g += $q.Y + x + '" y="' + ty + $q.Z + w + $q.aa + (RH - 8) + $q.ab + SY_C[k] + $q.ac + esc(yl(y) + ': ' + cap(stL[k]) + ' ' + nf(lang, n)) + $q.ad; x += w; }
g += $q.V + (x + 6) + '" y="' + (ty + 15) + $q.ae + esc(nf(lang, tot(y))) + $q.X; });
let lx = LW; const ly = Y.length * RH + 14; for (const k of sts) { const t = cap(stL[k]); g += $q.Y + lx + '" y="' + ly + $q.af + SY_C[k] + $q.ag + (lx + 17) + '" y="' + (ly + 11) + $q.ah + esc(t) + $q.X; lx += 30 + [...t].length * 7; }
const svg = $q.ai + W + ' ' + H + $q.aj + W + $q.ak + esc(t29(lang, 'sy_al', { n: nf(lang, rows.length), dev })) + '">' + g + $q.al;
const th = $q.am + esc(t29(lang, 'sy_y')) + '</th>' + sts.map(k => $q.an + esc(cap(stL[k])) + '</th>').join('') + $q.an + esc(t29(lang, 'sy_t')) + $q.ao;
const tb = Y.map(y => $q.ap + esc(yl(y)) + '</th>' + sts.map(k => '<td>' + esc(nf(lang, yrs.get(y)[k] || 0)) + '</td>').join('') + $q.aq + esc(nf(lang, tot(y))) + $q.ar).join('') + $q.ap + esc(t29(lang, 'sy_t')) + '</th>' + sts.map(k => '<td>' + esc(nf(lang, rows.filter(r => r.st === k).length)) + '</td>').join('') + $q.aq + esc(nf(lang, rows.length)) + $q.ar;
return $q.as + esc(t29(lang, 'sy_h')) + $q.at + svg + $q.au + esc(t29(lang, $q.av)) + $q.aw + th + $q.ax + tb + $q.ay;
}
export function devFilter(lang, rows) {
if (rows.length < 6) return '';
const grp = (k, kl) => { const m = new Map(); for (const r of rows) { const e = m.get(r[k]) || { l: r[kl], n: 0 }; e.n++; m.set(r[k], e); } return m; };
const M = grp('mk', 'mkL'), St = grp('st', 'stL');
if (M.size < 2 && St.size < 2) return '';
const b = (f, l, n, on) => '<button type="button" class="k29b" data-f="' + esc(f) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(String(l).charAt(0).toUpperCase() + String(l).slice(1)) + ' <small>' + esc(nf(lang, n)) + '</small></button>';
const chips = [b('', t29(lang, $q.az, { k: '' }).replace(/\s*[(（]\s*[)）]/, ''), rows.length, true)];
if (M.size > 1) for (const [k, e] of [...M].sort((a, c) => c[1].n - a[1].n)) chips.push(b('m:' + k, e.l, e.n));
if (St.size > 1) for (const [k, e] of St) chips.push(b('s:' + k, e.l, e.n));
return $t.k1 + esc(t29(lang, $q.aA)) + '">' + chips.join('') + $q.aB;
}
export const DEV_CSS = '<style id="k29-css">.k29f{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.k29b{min-height:44px;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card,#fff);color:inherit;font:inherit;cursor:pointer}.k29b[aria-pressed=true]{border-color:var(--k-sea,#155C75);box-shadow:inset 0 0 0 1px var(--k-sea,#155C75)}.k29b small{color:var(--muted)}</style>';
export const DEV_JS = "(function(){var g=document.querySelector('.k29f');if(!g)return;var R=document.querySelectorAll('#projects tbody tr[data-f]');g.addEventListener('click',function(e){var b=e.target.closest('.k29b');if(!b)return;var f=b.getAttribute('data-f');g.querySelectorAll('.k29b').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});R.forEach(function(r){r.hidden=!!f&&r.getAttribute('data-f').split(' ').indexOf(f)<0})})})();";
export { regLi, lawFor, LAW, AE_L7 };
