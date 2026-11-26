// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_buy__q, $s = TB.kbx_buy__s, $t = TB.kbx_buy__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { BS, PL, BUY_PLACES, BUY_LANGS, buyPlaceOf } from './kbx_buy_i18n.js';
import { NT } from './kbx_buy_notes.js';
import { trData } from './kbx_tr.js';
import { hdisp, mkName } from './kbx_hdate.js';
import { data as namedData } from './kbx_named.js';
import { tcFor, TC_SOURCES, TC_SETS, costCalc } from './kbx_facets.js';
import { SRC29, PLAN29, COUNTRY29, GL29, GL_TERMS, GL_NAME, TC29, TCPL, TCPL_T, TCS } from './kbx_buy_c29.js';
import { ogImg } from './kbx_ogt.js';
import { guideNext, accLine } from './kbx_e29_lines.js';
import { e29t } from './kbx_e29_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = BUY_LANGS;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/buying-off-plan(?:\/([a-z-]{2,30}))?(\/?)$/;
export const SITEMAP = '/guides/buying-off-plan/sitemap.xml';
export const TC_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/total-cost\/(dubai|costa-del-sol|portugal|thailand|indonesia|england|turkey)(\/?)$/;
export const GL_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?glossary\/(escrow|leasehold|payment-plan)(\/?)$/;
const BASE = '/guides/buying-off-plan/';
const REVIEWED = '2026-11-13';
const REVIEWED29 = '2026-11-14';
const MOD = '2026-11-14';
const revOf = slug => slug && PLAN29[slug] ? REVIEWED29 : REVIEWED;
const TABLE_MAX = 30;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.b, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.c;
const t = (lang, k) => (BS[lang] && BS[lang][k] != null) ? BS[lang][k] : BS.en[k];
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const te = (lang, k, v) => fill(esc(t(lang, k)), v);
const tx = (lang, k, v) => fill(t(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.d, month: 'long', year: $q.d, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso; } };
const note = (k, lang) => (NT[k] && (NT[k][lang] || NT[k].en)) || '';
const pn = (P, lang) => PL[P.s].n[lang] || PL[P.s].n.en;
const pin = (P, lang) => PL[P.s].in[lang] || PL[P.s].in.en;
const SRC = {
oss: { n: 'OSS (Online Single Submission)', u: 'https://oss.go.id/id', d: REVIEWED },
simbg: { n: 'SIMBG (Ministry of Public Works)', u: 'https://simbg.pu.go.id/', d: REVIEWED },
bpn: { n: 'ATR/BPN (land agency)', u: 'https://www.atrbpn.go.id/', d: REVIEWED },
id_uupa: { n: 'Law No. 5 of 1960 (UUPA), Articles 21(1) and 26(2)', u: 'https://peraturan.go.id/files/UU0051960.pdf', d: '2026-11-03', law: 'id-hak-milik-citizens' },
id_uupa_sewa: { n: 'Law No. 5 of 1960 (UUPA), Articles 44(1) and 45', u: 'https://peraturan.go.id/files/UU0051960.pdf', d: '2026-11-03', law: 'id-hak-sewa' },
id_pp18: { n: 'Government Regulation No. 18 of 2021, Articles 52, 71 and 72', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03', law: 'id-foreigner-hak-pakai' },
id_pp18_imm: { n: 'Government Regulation No. 18 of 2021, Article 69(1)', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03', law: 'id-foreigner-immigration-doc' },
id_pp16: { n: 'Government Regulation No. 16 of 2021, Article 1', u: 'https://jdih.pkp.go.id/produk-hukum/file/pp-nomor-16-tahun-2021-tanpa-lampiran.pdf', d: '2026-11-03', law: 'id-pbg-definition' },
id_uu1: { n: 'Law No. 1 of 2011 on Housing, Article 42', u: 'https://peraturan.go.id/files/uu1-2011bt.pdf', d: '2026-11-03', law: 'id-ppjb-conditions' },
dld: { n: 'Dubai Land Department: Project Status Enquiry', u: 'https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/', d: REVIEWED },
dld_e: { n: 'Dubai Land Department e-services', u: 'https://dubailand.gov.ae/en/eservices/', d: REVIEWED },
ae_l8: { n: 'Dubai Law No. 8 of 2007 (escrow), Articles 5, 6, 7, 9, 14 and 15', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2007/Law%20No.%20(8)%20of%202007%20Concerning%20Escrow%20Accounts%20for%20Real%20Estate%20Development%20in%20the%20Emirate%20of%20Dubai.html', d: '2026-11-03', law: 'ae-du-escrow-required' },
ae_l13: { n: 'Dubai Law No. 13 of 2008 (Interim Property Register), Articles 3 and 4', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2008/Law%20No.%20(13)%20of%202008.html', d: '2026-11-03', law: 'ae-du-interim-register' },
dbd: { n: 'Department of Business Development (DBD)', u: 'https://www.dbd.go.th/', d: REVIEWED },
dol: { n: 'Department of Lands', u: 'https://www.dol.go.th/', d: REVIEWED },
onep: { n: 'ONEP Smart EIA Plus', u: 'https://eia.onep.go.th/', d: REVIEWED },
th_condo: { n: 'Condominium Act B.E. 2522, sections 19 bis and 19 ter', u: 'https://www.dol.go.th/media/716929789247754240/migration/2025/10/6Wp3Tk7hgK5HdDRuvYXGcNsi.pdf', d: '2026-11-03', law: 'th-49-quota' },
es_reg: { n: 'Registradores de España (Propiedad and Mercantil)', u: 'https://sede.registradores.org/', d: REVIEWED },
es_cat: { n: 'Sede Electrónica del Catastro', u: 'https://www.sedecatastro.gob.es/', d: REVIEWED },
es_loe: { n: 'Law 38/1999 (LOE), first additional provision', u: 'https://www.boe.es/buscar/act.php?id=BOE-A-1999-21567#daprimera', d: '2026-11-03', law: 'es-deposit-guarantee' },
es_loe_lh: { n: 'Law 38/1999 (LOE), first additional provision, Four', u: 'https://www.boe.es/buscar/act.php?id=BOE-A-1999-21567#daprimera', d: '2026-11-03', lh: 1 },
es_cc: { n: 'Spanish Civil Code, Article 1454', u: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763#art1454', d: '2026-11-03', law: 'es-arras' },
es_reglist: { n: 'Kolaboro register guide: Spain', u: '/registers/#spain', d: REVIEWED, own: 1 },
pt_com: { n: 'gov.pt: Consultar a certidão permanente de registo comercial', u: 'https://www.gov.pt/servicos/consultar-a-certidao-permanente-de-registo-comercial', d: REVIEWED },
pt_pred: { n: 'gov.pt: Pedir uma certidão permanente do registo predial', u: 'https://www.gov.pt/servicos/pedir-uma-certidao-permanente-do-registo-predial', d: REVIEWED },
pt_predol: { n: 'Predial Online', u: 'https://www.predialonline.pt/', d: REVIEWED },
pt_rnt: { n: 'Turismo de Portugal: RNT', u: 'https://rnt.turismodeportugal.pt/RNT/', d: REVIEWED },
pt_reglist: { n: 'Kolaboro register guide: Portugal', u: '/registers/#portugal', d: REVIEWED, own: 1 },
pt_cc: { n: 'Portuguese Civil Code, Article 442(2) and (3)', u: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?artigo_id=775A0442&nid=775&tabela=leis&pagina=1&ficha=1&so_miolo=&nversao=', d: '2026-11-03', law: 'pt-sinal' },
cy_roc: { n: 'Registrar of Companies (companies.gov.cy)', u: 'https://companies.gov.cy/en/company-lifecycle/search-for-company-information', d: REVIEWED },
cy_fines: { n: 'Department of Lands and Surveys: administrative fines under Law 81(I)/2011 (13 Feb 2026)', u: 'https://portal.dls.moi.gov.cy/en/energopoiisi-diadikasias-epivolis-dioikitikon-prostimon-vasei-tou-peri-polisis-akiniton-eidiki-ektelesi-nomou-ar-81i-2011/', d: REVIEWED },
cy_dep: { n: 'Department of Lands and Surveys: contract of sale (Law 81(I)/2011, Law 132(I)/2023)', u: 'https://portal.dls.moi.gov.cy/en/application_forms/symvasis-polisis-antiparochis-antallagis/', d: REVIEWED },
us_sunbiz: { n: 'Florida Division of Corporations (Sunbiz)', u: 'https://search.sunbiz.org/Inquiry/CorporationSearch/ByName', d: null },
us_md: { n: 'Miami-Dade County e-Permitting', u: 'https://www.miamidade.gov/Apps/RER/ePermittingMenu/Home/Permits', d: REVIEWED },
us_dbpr: { n: 'Florida DBPR condominium public records', u: 'https://www2.myfloridalicense.com/condos-timeshares-mobile-homes/public-records/', d: REVIEWED },
us_718202: { n: 'Florida Statutes 718.202 (2026)', u: 'https://www.flsenate.gov/Laws/Statutes/2026/718.202', d: REVIEWED },
us_718503: { n: 'Florida Statutes 718.503 (2026)', u: 'https://www.flsenate.gov/Laws/Statutes/2026/718.503', d: REVIEWED },
us_reglist: { n: 'Kolaboro register guide: United States', u: '/registers/#usa', d: REVIEWED, own: 1 },
mx_lie: { n: 'Ley de Inversión Extranjera, Articles 2 (VI), 11 and 13 (text in force, last amended DOF 27 May 2024)', u: 'https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo14.html', d: REVIEWED },
mx_nom: { n: 'Secretaría de Economía: NOM-247-SE-2021 (published DOF 22 Mar 2022)', u: 'https://www.gob.mx/cms/uploads/attachment/file/767571/NOM_247__Requisitos_de_la_informaci_n_comercial_y_la_publicidad_de_bienes_inmuebles_destinados_a_casa_habitaci_n_y_elementos_m_nimos_que_deben_contener_los_contratos.pdf', d: REVIEWED },
mx_rpca: { n: 'PROFECO contract register (RPCA)', u: 'https://rpca.profeco.gob.mx/', d: REVIEWED },
mx_reglist: { n: 'Kolaboro register guide: Mexico', u: '/registers/#mexico', d: REVIEWED, own: 1 }
};
Object.assign(SRC, SRC29);
const STEPS = ['company', 'land', 'permit', 'money', 'sale', 'date'];
const PLAN = {
bali: { company: [['n_id_nib', ['oss']]], land: [['n_id_milik', ['id_uupa']], ['n_id_pakai', ['id_pp18']], ['n_id_sewa', ['id_uupa_sewa', 'bpn']]], permit: [['n_id_pbg', ['id_pp16', 'simbg']]], money: [['n_id_ppjb', ['id_uu1']]], sale: [['n_id_immig', ['id_pp18_imm']]] },
dubai: { company: [['n_ae_land', ['ae_l13']]], permit: [['n_ae_dld', ['dld']], ['n_ae_ad', ['ae_l8']]], money: [['n_ae_escrow', ['ae_l8']], ['n_ae_ret', ['ae_l8']]], sale: [['n_ae_oqood', ['ae_l13', 'dld_e']]], date: [['n_ae_dld', ['dld']]] },
phuket: { company: [['n_th_dbd', ['dbd']]], land: [['n_th_land', ['dol']], ['n_th_quota', ['th_condo']], ['n_th_funds', ['th_condo']]], permit: [['n_th_eia', ['onep']]], sale: [['n_th_reg', ['dol']]] },
'costa-del-sol': { company: [['n_es_merc', ['es_reg']]], land: [['n_es_nota', ['es_reg', 'es_cat']]], permit: [['n_es_lic', ['es_reglist']]], money: [['n_es_guar', ['es_loe']]], sale: [['n_es_arras', ['es_cc']]], date: [['n_es_delay', ['es_loe_lh']]] },
lisbon: { company: [['n_pt_com', ['pt_com']]], land: [['n_pt_pred', ['pt_pred', 'pt_predol']]], permit: [['n_pt_cm', ['pt_reglist']], ['n_pt_rnt', ['pt_rnt']]], money: [['n_pt_sinal', ['pt_cc']]] },
cyprus: { company: [['n_cy_roc', ['cy_roc']]], land: [['n_cy_search', ['cy_fines']]], sale: [['n_cy_dep', ['cy_dep']], ['n_cy_2023', ['cy_dep']]] },
miami: { company: [['n_us_sunbiz', ['us_sunbiz', 'us_reglist']]], permit: [['n_us_permit', ['us_md', 'us_reglist']], ['n_us_dbpr', ['us_dbpr']]], money: [['n_us_escrow', ['us_718202']]], sale: [['n_us_15', ['us_718503']]] },
tulum: { land: [['n_mx_trust', ['mx_lie']], ['n_mx_rpp', ['mx_reglist']]], permit: [['n_mx_lic', ['mx_reglist']]], sale: [['n_mx_nom', ['mx_nom']], ['n_mx_rpca', ['mx_rpca']]] }
};
Object.assign(PLAN, PLAN29);
const COUNTRY = Object.assign({ ID: 'indonesia', AE: 'uae', TH: 'thailand', ES: 'spain', PT: 'portugal', CY: 'cyprus', US: 'usa', MX: 'mexico' }, COUNTRY29);
const LAWPAGE = { ID: 1, AE: 1, TH: 1, ES: 1, PT: 1 };
const DEST = { bali: '/bali/', dubai: '/dubai/', phuket: '/phuket/', tulum: '/tulum/' };
const TOP = new Set(String('PHK-011,BALI-044,BKK-001,BALI-034,BALI-049,BALI-033,PHK-001,PHK-008,BALI-001,BALI-026,BALI-078,BALI-040,BALI-014,PHK-006,BALI-037,BALI-025,PHK-013,BALI-035,BALI-067,BALI-076,BALI-023,PHK-009,BALI-055,BALI-022,PHL-001,BALI-036,BALI-021,BALI-030,BALI-006,BALI-048,BALI-056,BALI-047,PHK-018,BKK-006,RMY-012,PHK-012,PHK-028,PHK-019,PHK-031,PHK-030,PHK-032,MIA-006,MIA-004,MIA-010,PHK-020,MIA-003,BKK-007,MIA-001,KUA-010,MIA-002,MIA-011,BKK-009,MIA-005,MIA-012,KUA-013,KUA-008,KUA-009,KUA-011,PAT-001,MIA-013,RMY-005,PAT-004,NSK-003,KUA-012,PAT-003,MIA-009,RMY-006,RMY-011,PAT-010,RMY-004,MIA-008,RMY-001,RMY-023,PAT-007,RMY-009,BKK-004,MYS-028,MIA-036,RMY-024,MYS-027,SGN-002,MYS-026,MIA-007,MYS-024,BKK-008,KSM-003,BKK-005,PHL-012,MYS-029,MYS-001,LKA-009,SGN-001,PAT-002,PHL-010,SYD-004,MYS-025,PAT-018,MYS-018,VNM-008,KSM-001,KSM-002,MYS-004,VNM-010,MYS-013,VNM-004,SYD-001,HHQ-003,NSK-001,HNL-001,LOM-006,ORL-001,PER-001,PUN-003,SYD-002,PUN-004,LOM-005,CAB-005,LOM-008,TYO-004,LOM-007,LKA-002,BRA-002,KUA-004,CAB-009,LKA-014,LOM-023,SGN-007,HNL-002,LBJ-002,CAB-006,KSM-011,YVR-001,YVR-005,CAB-001,TYO-003,MID-003,CAB-007,DAD-001,YVR-007,NYC-003,PUN-008,OOL-006,PVR-006,NYC-002,KSM-004,OOL-005,TYO-001,LOM-001,OOL-008,PVR-005,DXB-012,DXB-011,DXB-002,DXB-160,DXB-004,DXB-143,DXB-145,DXB-068,DXB-027,DXB-005,DXB-003,DXB-063,DXB-032,DXB-062,DXB-071,DXB-006,DXB-149,DXB-073,DXB-029,DXB-075,DXB-010,DXB-074,DXB-129,DXB-123,DXB-008,DXB-144,DXB-094,DXB-077,DXB-017,DXB-037,DXB-009,DXB-021,DXB-099,DXB-110,DXB-016,DXB-125,DXB-087,DXB-124,DXB-121,DXB-146,DXB-091,DXB-096,DXB-098,DXB-051,DXB-065,DXB-142,DXB-020,DXB-095,DXB-103,DXB-116,DXB-083,DXB-130,DXB-069,DXB-100,DXB-079,DXB-117,DXB-035,DXB-045,RAK-013,CDS-005,CDS-003,NCE-005,KSA-002,CDS-002,CDS-004,QAT-001,CBL-001,CDS-001,PMI-005,RAK-004,ESP-007,ESP-001,CDS-010,CDS-008,CDS-009,CDS-033,CYP-008,CBL-006,CDS-034,CDS-032,AUH-014,OMN-001,CYP-009,GRC-001,OMN-011,CDS-006,CYP-004,CYP-015,NCY-006,GEO-001,CAN-002,GRC-004,NCY-004,OMN-015,GEO-002,KSA-008,RAK-026,OMN-016,GRC-013,CYP-013,AUH-004,AUH-006,RAK-025,IST-007,RAK-024,GEO-005,SHJ-010,ALG-001,AUH-013,AUH-003,ALG-003,IST-009,SHJ-008,SHJ-001,ZNZ-007,MLA-002,AUH-017,ALG-007,AUH-009,RAK-016,EGY-012,ALG-012,LON-005,AUH-018,AYT-007,MRK-001,LIS-010,AUH-015,LIS-009,RAK-001,IST-010,IST-001,RAK-005,LIS-008,EGY-014,EGY-015,EGY-018,LON-010,PRT-001,AYT-005,RAK-010,LIS-003,BAH-003,MRU-007,BJV-003,MNE-008,MRU-011,FNC-001,MNE-001,CBL-002').split(','));
let GD = null;
async function guideData(env) {
const ix = await trData(env);
if (GD && GD.v === ix.v) return GD;
const rows = [...ix.rows.values()];
const dev = new Map();
for (const r of rows) {
if (!r.dvs) continue;
const d = dev.get(r.dvs) || { n: 0, past: 0, moved: 0, done: 0 }; d.n++;
const q = r.comp.record.r; if (q === 'past') d.past++; else if (q === 'moved') d.moved++; else if (q === 'done' || q === 'late') d.done++;
dev.set(r.dvs, d);
}
const places = new Map();
for (const P of BUY_PLACES) {
const L = rows.filter(r => !r.sumba && buyPlaceOf(r.mk, r.ar, r.co) === P).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
const cnt = (k, st) => L.filter(r => r.comp[k].st === (st || 'yes')).length;
const past = L.filter(r => r.comp.record.r === 'past').length, moved = L.filter(r => r.comp.record.r === 'moved').length;
const sc = L.map(r => r.score).sort((a, b) => a - b), med = sc.length ? (sc.length % 2 ? sc[(sc.length - 1) / 2] : Math.round((sc[sc.length / 2 - 1] + sc[sc.length / 2]) / 2)) : null;
places.set(P.s, { P, L, n: L.length, legal: cnt('legal'), permit: cnt($q.e), deposit: cnt($q.f), loc: cnt($q.g), past, moved, med, ranked: P.tr && ix.places.get(P.tr) ? ix.places.get(P.tr).n : null });
}
GD = { v: ix.v, ix, dev, places, updated: ix.updated };
return GD;
}
let LH = null;
async function leaseCount(env, ids) {
try {
const S = globalThis.__kbJson && globalThis.__kbJson[$q.h];
const named = S && S.v; if (!named) return null;
if (!LH || LH.k !== named) LH = { k: named, m: new Map((named.projects || []).map(x => [x.id, /lease/i.test(String((x.fx || {}).foreign_ownership || ''))])) };
return ids.filter(i => LH.m.get(i)).length;
} catch (e) { return null; }
}
const crumb = (lang, list) => $q.i + pre(lang) + $q.j + list.map((x, i) => i < list.length - 1 ? $q.k + x[1] + '">' + esc(x[0]) + '</a>' : $q.l + esc(x[0]) + $q.m).join(' / ') + '</p>';
const crumbLd = (lang, list) => ({ '@type': $q.n, itemListElement: [[$q.o, pre(lang) + '/']].concat(list).map((x, i) => ({ '@type': $q.p, position: i + 1, name: x[0], item: ORIGIN + x[1] })) });
const stat = (lang, v, k) => $q.q + (v == null ? '-' : esc(nf(lang, v))) + $q.r + esc(t(lang, k)) + $q.s;
function srcLinks(lang, ids) {
return $q.t + ids.map(id => { const s = SRC[id]; if (!s) return '';
return $q.k + esc(s.u) + '"' + (s.own ? '' : $q.u) + $q.v + esc(s.n) + $q.w + (s.d ? ' (' + esc(tx(lang, s.own || s.op ? $q.x : 'read', { d: fdt(s.d, lang) })) + ')' : '') +
(s.law ? $q.y + esc(s.law) + '">' + esc(t(lang, $q.z)) + '</a>' : s.lh ? $q.A + esc(t(lang, $q.z)) + '</a>' : '');
}).filter(Boolean).join(' · ') + $q.m;
}
const legalName = v => String(v || '').replace(/\s*\([^)]*\)/g, '').split(/,\s*(?=Jl\.|Jalan|Calle|C\/|Avda|Av\.|Rua|Street|St\.|\d)/i)[0].trim();
const pLink = (lang, r) => $q.k + pre(lang) + $q.B + esc(r.s) + '/">' + bdi(r.n) + '</a>';
const exList = (lang, items) => items.length ? $q.C + esc(t(lang, 'ex')) + $q.D + items.join('') + '</ul>' : '';
const exLi = (lang, r, k, v) => '<li>' + pLink(lang, r) + ': ' + te(lang, k, v) + '</li>';
function recCell(lang, q) {
const r = q.r;
if (r === 'past') return te(lang, $q.E, { m: esc(nf(lang, q.m || 0)) });
if (r === 'moved') return q.m ? te(lang, $q.F, { m: esc(nf(lang, q.m)) }) : esc(t(lang, $q.G));
return esc(t(lang, { kept: $q.H, done: $q.I, late: $q.J, none: $q.K }[r] || $q.L));
}
function stepData(lang, G, D, k, lease) {
const P = D.P, v = { n: esc(nf(lang, D.n)), in: esc(pin(P, lang)) }, L = D.L;
if (!D.n) return '';
let p = '', ex = [];
if (k === $q.M) {
p = te(lang, $q.N, Object.assign({ a: esc(nf(lang, D.legal)) }, v));
ex = L.filter(r => r.comp.legal.st === 'yes' && r.comp.legal.v).slice(0, 3).map(r => exLi(lang, r, $q.O, { v: bdi(legalName(r.comp.legal.v)) }));
} else if (k === 'land') {
p = (lease ? te(lang, $q.P, Object.assign({ a: esc(nf(lang, lease)) }, v)) + ' ' : '') + te(lang, 'd_loc', Object.assign({ a: esc(nf(lang, D.loc)) }, v));
} else if (k === $q.e) {
p = te(lang, $q.Q, Object.assign({ a: esc(nf(lang, D.permit)) }, v));
ex = L.filter(r => r.comp.permit.st === 'yes' && r.comp.permit.v).slice(0, 3).map(r => exLi(lang, r, $q.R, { v: bdi(r.comp.permit.v) }));
} else if (k === 'money') {
p = te(lang, 'd_dep', Object.assign({ a: esc(nf(lang, D.deposit)) }, v));
ex = L.filter(r => r.comp.deposit.st === 'yes').slice(0, 3).map(r => exLi(lang, r, $q.S));
} else if (k === 'date') {
p = te(lang, $q.T, Object.assign({ a: esc(nf(lang, D.past)), b: esc(nf(lang, D.moved)) }, v));
const past = L.filter(r => r.comp.record.r === 'past').sort((a, b) => (b.comp.record.m || 0) - (a.comp.record.m || 0)).slice(0, 2);
const mv = L.filter(r => r.comp.record.r === 'moved').slice(0, 1), kept = L.filter(r => r.comp.record.r === 'kept' && r.comp.date.v).slice(0, 1);
ex = past.map(r => exLi(lang, r, $q.U, { m: esc(nf(lang, r.comp.record.m || 0)) })).concat(mv.map(r => exLi(lang, r, $q.V, { m: esc(nf(lang, r.comp.record.m || 1)) })), kept.map(r => exLi(lang, r, $q.W, { v: bdi(hdisp(String(r.comp.date.v), lang)) })));
} else return '';
return '<h3>' + esc(t(lang, $q.X)) + $q.Y + p + '</p>' + exList(lang, ex);
}
function table(lang, G, D) {
  const L = D.L.slice().sort((a, b) => (TOP.has(b.id) ? 1 : 0) - (TOP.has(a.id) ? 1 : 0) || b.score - a.score || a.n.localeCompare(b.n)).slice(0, TABLE_MAX);
  if (!L.length) return '';
  const rows = L.map(r => {
    const d = (r.dvs && G.dev.get(r.dvs)) || null, pm = r.comp.permit;
    return $q.Z + pLink(lang, r) + (r.ar ? $q.aa + bdi(r.ar) + $q.ab : '') + $q.ac + (r.dv ? (r.dvs ? $q.k + pre(lang) + $q.ad + esc(r.dvs) + '/">' + bdi(r.dv) + '</a>' : bdi(r.dv)) : '-') + $q.ac +
      (pm.st === 'yes' ? (pm.v ? bdi(pm.v) : esc(t(lang, 'pubd'))) : $q.ae + esc(t(lang, 'np')) + $q.m) + $q.ac + recCell(lang, r.comp.record) + $q.ac +
      (d ? te(lang, $q.af, { n: esc(nf(lang, d.n)), past: esc(nf(lang, d.past)), moved: esc(nf(lang, d.moved)), done: esc(nf(lang, d.done)) }) : '-') + $q.ag;
  }).join('');
  const P = D.P;
  const more = P.tr && D.ranked ? $q.ah + pre(lang) + $q.ai + P.tr + '/">' + te(lang, $q.aj, { n: esc(nf(lang, D.ranked)), p: esc(pn(P, lang)) }) + $q.ak : '';
  return $q.al + te(lang, 'tbl_h', { in: esc(pin(P, lang)) }) + $q.am + te(lang, 'tbl_p', { k: esc(nf(lang, L.length)) }) + '</p>' +
    $q.an + [$q.ao, $q.ap, $q.aq, $q.ar, $q.as].map(k => esc(t(lang, k))).join($q.at) + $q.au + rows + $q.av + more;
}
const GL_STEP = { land: [['leasehold', 'lease_h1']], money: [['escrow', 'escrow_h1'], ['payment-plan', 'pp_h1']] };
const glLinks = (lang, k) => GL_STEP[k] ? $q.aw + GL_STEP[k].map(([x, h]) => $q.k + pre(lang) + $q.ax + x + '/">' + esc(GL29[lang] && GL29[lang][h] || GL29.en[h]) + '</a>').join(' · ') + '</p>' : '';
function questions(lang, slug, P) {
const plan = PLAN[slug] || {};
const li = STEPS.map(k => { const ids = [...new Set((plan[k] || []).flatMap(x => x[1]))];
return $q.ay + esc(t(lang, 'qq_' + k)) + '</b>' + (ids.length ? $q.az + esc(t(lang, $q.aA)) + ' ' + ids.map(id => SRC[id] ? '<bdi>' + esc(SRC[id].n) + $q.c : '').filter(Boolean).join(' · ') + $q.m : '') + $q.aB + esc(t(lang, $q.aC)) + $q.aD; }).join('');
return $t.k0 + te(lang, 'qs_h', { in: esc(pin(P, lang)) }) + $q.am + esc(t(lang, 'qs_p')) + $q.aE + esc(t(lang, $q.aF)) + $q.aG + li + $q.aH;
}
function guidePage(G, slug, lang, lease) {
const D = G.places.get(slug); if (!D) return null;
const P = D.P, plan = PLAN[slug] || {}, inP = pin(P, lang), name = pn(P, lang), path = BASE + slug + '/';
const vIn = { in: esc(inP), p: esc(name), n: esc(nf(lang, D.n)) };
const title = tx(lang, 'title', { in: (PL[slug].tin && PL[slug].tin[lang]) || inP });
const steps = STEPS.map((k, i) => {
const notes = plan[k] || [];
return $q.aI + k + $q.aJ + esc(tx(lang, 'step', { n: i + 1 })) + (lang === 'zh' ? '：' : ': ') + esc(t(lang, 'st_' + k)) + $q.am + esc(t(lang, 'g_' + k)) + '</p>' +
(notes.length ? '<h3>' + te(lang, 'rules') + $q.aK + notes.map(([nk, ids]) => '<li>' + esc(note(nk, lang)) + srcLinks(lang, ids) + '</li>').join('') + '</ul>' : '') +
stepData(lang, G, D, k, k === 'land' ? lease : 0) + glLinks(lang, k) + $q.aL;
}).join('');
const sum = $q.aM + te(lang, 'sum_h', { p: esc(name) }) + $q.aN + stat(lang, D.n, 's_n') + stat(lang, D.permit, $q.aO) + stat(lang, D.deposit, 's_dep') + stat(lang, D.past, $q.aP) + stat(lang, D.moved, $q.aQ) + (D.med != null ? stat(lang, D.med, 's_med') : '') + $q.aR + esc(t(lang, $q.aS)) + '</p>';
const toc = $q.aT + esc(t(lang, 'toc')) + $q.aU + esc(t(lang, 'toc')) + $q.aV + STEPS.map(k => $q.aW + k + '">' + esc(t(lang, 'st_' + k)) + $q.aX).join('') + $q.aY + esc(tx(lang, 'tbl_h', { in: inP })) + $q.aZ + esc(tx(lang, 'qs_h', { in: inP })) + $q.ba + esc(t(lang, 'faq_h')) + $q.bb;
const txt = (k, v) => fill(t(lang, k), v);
const notesOf = k => (plan[k] || []).map(([nk]) => note(nk, lang)).filter(Boolean);
const vT = { in: inP, p: name, n: nf(lang, D.n) };
const faq = [[txt($q.bc, vT), txt($q.bd, { steps: STEPS.map(k => t(lang, 'st_' + k)).join('; ') })]];
if (D.n) faq.push([txt($q.be, vT), txt($q.bf, Object.assign({ a: nf(lang, D.permit), b: nf(lang, D.deposit), c: nf(lang, D.past) }, vT))]);
if (notesOf('land').length && P.own !== false) faq.push([txt('q_own', vT), notesOf('land').join(' ')]);
if (notesOf('money').length) faq.push([txt('q_dep', vT), notesOf('money').join(' ')]);
if (D.n) { faq.push([txt($q.bg, vT), txt($q.Q, Object.assign({ a: nf(lang, D.permit) }, vT))]); faq.push([txt($q.bh, vT), txt($q.T, Object.assign({ a: nf(lang, D.past), b: nf(lang, D.moved) }, vT))]); }
const faqHtml = $t.k1 + esc(t(lang, 'faq_h')) + '</h2>' + faq.map(([q, a]) => '<h3>' + esc(q) + $q.Y + esc(a) + '</p>').join('') + $q.aL;
const others = BUY_PLACES.filter(o => o.s !== slug).map(o => $q.bi + pre(lang) + BASE + o.s + '/">' + esc(tx(lang, $q.bj, { in: pin(o, lang) })) + $q.aX).join('');
const rel = [];
if (P.tr && D.ranked) rel.push([pre(lang) + $q.ai + P.tr + '/', tx(lang, $q.bk, { p: name })]);
if (COUNTRY[P.cc]) rel.push([$q.bl + COUNTRY[P.cc] + $q.bm, tx(lang, $q.bn, { c: P.c })]);
rel.push([pre(lang) + $q.bo + P.s, e29t(lang, 'l_bp')], [pre(lang) + $q.bp + P.s, e29t(lang, 'l_fb')]);
if (LAWPAGE[P.cc]) rel.push([$q.bq, t(lang, 'l_law')]);
if (DEST[slug]) rel.push([DEST[slug], tx(lang, $q.br, { in: inP })]);
{ const cs = GUIDE_TC[slug]; if (cs) rel.push([pre(lang) + $q.bs + cs + '/', cf(lang, 'c_t', { in: (TCPL_T[cs] && TCPL_T[cs][lang]) || cin(cs, lang) })]); }
rel.push([pre(lang) + $q.bt, t(lang, $q.bu)], [$q.bv, t(lang, $q.bw)], [$q.bx, t(lang, $q.by)]);
const note2 = $q.bz + esc(t(lang, 'legal')) + $q.bA + te(lang, 'reply', { in: esc(inP) }) + $t.k2 + esc(t(lang, $q.bB)) + $q.bC;
const body = $t.k3 + crumb(lang, [[t(lang, $q.bD), pre(lang) + BASE], [name, pre(lang) + path]]) + '<h1>' + esc(title) + $q.bE + te(lang, 'lead', vIn) + '</p>' +
$t.k4 + revOf(slug) + '">' + esc(tx(lang, 'upd', { d: fdt(revOf(slug), lang), d2: fdt(G.updated, lang) })) + $q.bF + guideNext(lang, revOf(slug)) + '</p>' + accLine(lang) + $q.bG +
$q.bH + sum + toc + steps + table(lang, G, D) + questions(lang, slug, P) + faqHtml + note2 +
$q.bI + esc(t(lang, 'rel_h')) + $q.bJ + rel.map(([h, l]) => $q.bi + esc(h) + '">' + esc(l) + $q.aX).join('') + $q.bK + esc(t(lang, $q.bL)) + $q.bM + others + $q.bN;
let desc = tx(lang, 'desc', vT); if ([...desc].length > 155) desc = tx(lang, 'desc2', vT);
if ([...desc].length > 155) { const c = [...desc].slice(0, 154).join(''); desc = c.replace(/[\s,;:]+\S*$/, '') + '.'; }
const url = ORIGIN + pre(lang) + path;
const ld = [{ '@type': $q.bO, '@id': url + $q.bP, url, headline: title, description: desc, inLanguage: lang, datePublished: PLAN29[slug] ? REVIEWED29 : $q.bQ, dateModified: G.updated > MOD ? G.updated : MOD, author: { '@type': $q.bR, name: $q.o, url: ORIGIN + '/' }, publisher: { '@type': $q.bR, name: $q.o, url: ORIGIN + '/' }, about: { '@type': 'Place', name: PL[slug].n.en }, mainEntityOfPage: url },
crumbLd(lang, [[t(lang, $q.bD), pre(lang) + BASE], [name, pre(lang) + path]]),
{ '@type': $q.bS, '@id': url + '#faq', mainEntity: faq.map(([q, a]) => ({ '@type': $q.bT, name: q, acceptedAnswer: { '@type': $q.bU, text: a } })) }];
return { path, title, desc, body, ld };
}
function hubPage(G, lang) {
const rows = BUY_PLACES.map(P => { const D = G.places.get(P.s); return $q.bV + pre(lang) + BASE + P.s + '/">' + esc(tx(lang, $q.bj, { in: pin(P, lang) })) + $q.bW + esc(nf(lang, D.n)) + $q.ac + esc(nf(lang, D.permit)) + $q.ac + esc(nf(lang, D.past)) + $q.ag; }).join('');
const title = t(lang, $q.bX), desc = t(lang, $q.bY), url = ORIGIN + pre(lang) + BASE;
const body = $t.k5 + crumb(lang, [[t(lang, $q.bD), pre(lang) + BASE]]) + '<h1>' + esc(title) + $q.bE + esc(t(lang, $q.bZ)) + '</p>' +
$t.k6 + REVIEWED + '">' + esc(tx(lang, 'upd', { d: fdt(REVIEWED, lang), d2: fdt(G.updated, lang) })) + $q.bF + guideNext(lang, REVIEWED) + '</p>' + accLine(lang) + $q.ca +
$t.k7 + [$q.cb, 'h_n', $q.cc, $q.cd].map(k => esc(t(lang, k))).join($q.at) + $q.au + rows + $q.av +
$q.ce + esc(t(lang, $q.aS)) + '</p>' +
$q.ah + pre(lang) + $q.cf + esc(e29t(lang, 'l_bp')) + $q.cg + pre(lang) + $q.ch + esc(e29t(lang, 'l_fb')) + $q.ci + esc(t(lang, 'legal')) + $t.k8;
const ld = [{ '@type': $q.cj, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: MOD, hasPart: BUY_PLACES.map(P => ({ '@type': $q.bO, headline: tx(lang, 'title', { in: pin(P, lang) }), url: ORIGIN + pre(lang) + BASE + P.s + '/' })) }, crumbLd(lang, [[t(lang, $q.bD), pre(lang) + BASE]])];
return { path: BASE, title, desc, body, ld };
}
const GL_MIN = 5;
const g = (lang, k) => (GL29[lang] && GL29[lang][k] != null) ? GL29[lang][k] : GL29.en[k];
const gf = (lang, k, v) => fill(g(lang, k), v);
const COI = /eco\s*beach\s*city|\bequinox\b/i;
const med = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; };
const OWN_NS = /^\s*(not (stated|published|disclosed)|unknown|n\/a|-)/i, OWN_L = /lease/i, OWN_F = /freehold|fee simple|pleno dominio|propriedade plena|direct ownership|full ownership|plena propiedad/i;
let GLD = null;
async function glData(env) {
const [G, ix] = await Promise.all([guideData(env), namedData(env)]);
if (GLD && GLD.v === G.v && GLD.ix === ix) return GLD;
const fx = new Map((ix.P || []).map(x => [x.id, x.fx || {}]));
const by = new Map();
for (const r of G.ix.rows.values()) {
if (r.sumba || COI.test(String(r.n || '')) || COI.test(String(r.dv || ''))) continue;
const f = fx.get(r.id); if (!f) continue;
const m = by.get(r.mk) || { mk: r.mk, n: 0, dep: 0, own: 0, fh: 0, lh: 0, oth: 0, yrs: [], pct: [], plan: 0 }; m.n++;
if (r.comp.deposit.st === 'yes') m.dep++;
const o = String(f.foreign_ownership || '').trim();
if (o && !OWN_NS.test(o)) { m.own++; if (OWN_L.test(o)) { m.lh++; const y = /(\d{2,3})\s*-?\s*(?:years?|yrs?|jahre|años|ans)/i.exec(o); if (y && +y[1] >= 10 && +y[1] <= 999) m.yrs.push(+y[1]); } else if (OWN_F.test(o)) m.fh++; else m.oth++; }
if (isFinite(+f.deposit_pct) && +f.deposit_pct > 0 && +f.deposit_pct <= 100) m.pct.push(+f.deposit_pct);
if (f.payment_plan) m.plan++;
by.set(r.mk, m);
}
GLD = { v: G.v, ix, G, by: [...by.values()], updated: G.updated };
return GLD;
}
const pctS = (lang, v) => nf(lang, Math.round(v * 10) / 10) + '%';
function glPage(D, term, lang) {
const path = $q.ax + term + '/', url = ORIGIN + pre(lang) + path, M = D.by;
let rows = [], head = [], q2 = '', a2 = '', step = 'money';
const mkC = (m) => '<td>' + bdi(mkName(m.mk, lang)) + '</td>';
if (term === $q.ck) {
const L = M.filter(m => m.n >= GL_MIN).sort((a, b) => b.dep / b.n - a.dep / a.n || b.n - a.n);
head = ['g_mk', 'g_n', $q.cl, $q.cm];
rows = L.map(m => '<tr>' + mkC(m) + '<td>' + nf(lang, m.n) + $q.ac + nf(lang, m.dep) + $q.ac + pctS(lang, 100 * m.dep / m.n) + $q.ag);
q2 = g(lang, $q.cn); a2 = gf(lang, $q.co, { list: L.filter(m => m.dep).slice(0, 3).map(m => mkName(m.mk, lang) + ' ' + nf(lang, m.dep) + '/' + nf(lang, m.n)).join('; ') });
} else if (term === $q.cp) {
step = 'land';
const L = M.filter(m => m.own >= GL_MIN).sort((a, b) => b.lh / b.own - a.lh / a.own || b.own - a.own);
head = ['g_mk', $q.cq, $q.cr, $q.cs, $q.ct, $q.cu];
rows = L.map(m => '<tr>' + mkC(m) + '<td>' + nf(lang, m.own) + $q.ac + nf(lang, m.fh) + $q.ac + nf(lang, m.lh) + $q.ac + nf(lang, m.oth) + $q.ac + (m.yrs.length ? nf(lang, Math.min(...m.yrs)) + '-' + nf(lang, Math.max(...m.yrs)) : '-') + $q.ag);
q2 = g(lang, $q.cv); a2 = gf(lang, $q.cw, { list: L.filter(m => m.lh).slice(0, 3).map(m => mkName(m.mk, lang) + ' ' + nf(lang, m.lh) + '/' + nf(lang, m.own)).join('; ') });
} else {
const L = M.filter(m => m.pct.length >= GL_MIN).sort((a, b) => med(a.pct) - med(b.pct) || b.pct.length - a.pct.length);
head = ['g_mk', 'g_n', 'pp_c', $q.cx, $q.cy, $q.cz];
rows = L.map(m => '<tr>' + mkC(m) + '<td>' + nf(lang, m.n) + $q.ac + nf(lang, m.pct.length) + $q.ac + pctS(lang, med(m.pct)) + $q.ac + pctS(lang, Math.min(...m.pct)) + ' - ' + pctS(lang, Math.max(...m.pct)) + $q.ac + nf(lang, m.plan) + $q.ag);
q2 = g(lang, 'pp_q2'); a2 = gf(lang, 'pp_a2', { list: L.slice().sort((a, b) => b.pct.length - a.pct.length).slice(0, 4).map(m => mkName(m.mk, lang) + ' ' + pctS(lang, med(m.pct))).join('; ') });
}
const k = term === $q.cA ? 'pp' : term === $q.cp ? 'lease' : $q.ck;
const title = g(lang, k + '_t'), h1 = g(lang, k + '_h1'), def = g(lang, k + '_def');
let desc = g(lang, k + '_d'); if ([...desc].length > 155) desc = [...desc].slice(0, 154).join('').replace(/[\s,;:]+\S*$/, '') + '.';
const guides = BUY_PLACES.filter(P => (PLAN[P.s] || {})[step]).map(P => $q.bi + pre(lang) + BASE + P.s + $q.cB + step + '">' + esc(gf(lang, step === 'land' ? $q.cC : $q.cD, { in: pin(P, lang) })) + $q.aX).join('');
const tbl = $t.k9 + head.map(x => esc(g(lang, x))).join($q.at) + $q.au + rows.join('') + $t.k10 + esc(g(lang, $q.cE)) + '</p>';
const faq = [[gf(lang, 'q1', { term: GL_NAME[term][lang] || GL_NAME[term].en }), def], [q2, a2]];
const crumbs = [[g(lang, $q.cF), $q.ax], [h1, pre(lang) + path]];
const body = $t.k11 + crumb(lang, crumbs) + '<h1>' + esc(h1) + $q.bE + esc(def) + '</p>' +
$t.k12 + MOD + '">' + esc(gf(lang, 'g_upd', { d: fdt(MOD, lang), d2: fdt(D.updated, lang) })) + $t.k13 + tbl +
(guides ? $q.cG + esc(g(lang, $q.cH)) + $q.bJ + guides + '</ul>' : '') +
$t.k14 + esc(g(lang, 'g_faq')) + '</h2>' + faq.map(([q, a]) => '<h3>' + esc(q) + $q.Y + esc(a) + '</p>').join('') + $q.aL +
$q.cI + esc(g(lang, 'g_all')) + $q.cg + pre(lang) + BASE + '">' + esc(t(lang, 'hub')) + $q.cJ;
const ld = [{ '@type': $q.cK, '@id': url + '#term', name: h1, description: def, inLanguage: lang, url, inDefinedTermSet: ORIGIN + $q.ax },
{ '@type': $q.cL, name: title, description: desc, url, inLanguage: lang, dateModified: D.updated > MOD ? D.updated : MOD, creator: { '@type': $q.bR, name: $q.o, url: ORIGIN + '/' }, license: $t.k15, isAccessibleForFree: true },
crumbLd(lang, crumbs), { '@type': $q.bS, '@id': url + '#faq', mainEntity: faq.map(([q, a]) => ({ '@type': $q.bT, name: q, acceptedAnswer: { '@type': $q.bU, text: a } })) }];
return { path, title, desc, body, ld, og: $q.cM };
}
const TC_MIN = 5;
const GUIDE_TC = { dubai: 'dubai', 'costa-del-sol': 'costa-del-sol', bali: 'indonesia', phuket: 'thailand', lisbon: 'portugal', 'united-kingdom': 'england' };
const c = (lang, k) => (TCS[lang] && TCS[lang][k] != null) ? TCS[lang][k] : TCS.en[k];
const cf = (lang, k, v) => fill(c(lang, k), v);
const cin = (s, lang) => (TCPL[s] && (TCPL[s][lang] || TCPL[s].en)) || (PL[s] ? pin({ s }, lang) : s);
const money = (lang, cur, v) => { try { return new Intl.NumberFormat(LOC[lang] || 'en-GB', { style: $q.cN, currency: cur, maximumFractionDigits: 0 }).format(v); } catch (e) { return cur + ' ' + nf(lang, Math.round(v)); } };
const qtl = (a, q) => { const b = a.slice().sort((x, y) => x - y), i = (b.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return b[lo] + (b[hi] - b[lo]) * (i - lo); };
let TCD = null;
async function tcData(env) {
const ix = await namedData(env);
if (TCD && TCD.ix === ix) return TCD;
const by = new Map();
for (const x of ix.P || []) {
if (String(x.mk || '').toLowerCase() === 'sumba' || COI.test(String(x.n || '')) || COI.test(String(x.dv || ''))) continue;
const T = tcFor(x); if (!T) continue;
const E = TC29.find(e => TC_SETS[e.k] === T); if (!E) continue;
const f = x.fx || {}, p = regSale(x) ? 0 : +f.price_min;
const d = by.get(E.s) || { E, T, n: 0, L: [] }; d.n++;
if (p > 0 && String(f.currency || '').toUpperCase() === T.cur) d.L.push({ x, p });
by.set(E.s, d);
}
for (const d of by.values()) if (d.L.length < TC_MIN) by.delete(d.E.s);
TCD = { ix, by, updated: (ix.updated || MOD) };
return TCD;
}
function tcPage(D, s, lang) {
const d = D.by.get(s); if (!d) return null;
const { E, T, L } = d, inP = cin(s, lang), path = $q.bs + s + '/', url = ORIGIN + pre(lang) + path;
const ps = L.map(o => o.p), k = nf(lang, L.length);
const tot = p => (costCalc(L[0].x, p, lang).rows || []).reduce((a, r) => a + (r.amount || 0), 0);
const C0 = costCalc(L[0].x, 1, lang);
const srcOf = i => T.rows[i] ? T.rows[i].s.map(q => TC_SOURCES[q]).filter(Boolean) : [];
const rowsH = C0.rows.map((r, i) => $q.Z + esc(r.label) + $q.ac + bdi(r.rate) + $q.ac + srcOf(i).map(([n, u]) => $q.k + esc(u) + $q.cO + esc(n) + $q.w).join(' · ') + $q.ag).join('');
const pts = [['c_q1', qtl(ps, 0.25)], ['c_q2', qtl(ps, 0.5)], ['c_q3', qtl(ps, 0.75)]].map(([kk, p]) => [kk, Math.round(p)]);
const exH = pts.map(([kk, p]) => $q.Z + esc(c(lang, kk)) + $q.ac + esc(money(lang, T.cur, p)) + $q.ac + esc(money(lang, T.cur, tot(p))) + $q.ag).join('');
const mp = pts[1][1];
const near = L.slice().sort((a, b) => Math.abs(a.p - mp) - Math.abs(b.p - mp) || String(a.x.n).localeCompare(String(b.x.n))).slice(0, 6)
.map(o => $q.bi + pre(lang) + $q.B + esc(o.x.s) + '/">' + bdi(o.x.n) + $q.cP + esc(money(lang, T.cur, o.p)) + ' + ' + esc(money(lang, T.cur, tot(o.p))) + '</li>').join('');
const title = cf(lang, 'c_t', { in: (TCPL_T[s] && TCPL_T[s][lang]) || inP });
const rowsTxt = C0.rows.map(r => r.label + ' ' + r.rate).join('; ') + (C0.part ? '; ' + C0.part : '');
const faq = [[cf(lang, 'c_q', { in: inP }), cf(lang, 'c_a', { rows: rowsTxt, p: money(lang, T.cur, mp), tot: money(lang, T.cur, tot(mp)) })]];
let desc = cf(lang, $q.cQ, { in: inP, k }); if ([...desc].length > 155) desc = [...desc].slice(0, 154).join('').replace(/[\s,;:]+\S*$/, '') + '.';
const crumbs = [[t(lang, $q.bD), pre(lang) + BASE], [title, pre(lang) + path]];
const body = $t.k16 + crumb(lang, crumbs) + '<h1>' + esc(title) + $q.bE + esc(cf(lang, $q.cQ, { in: inP, k })) + '</p>' +
$t.k17 + MOD + '">' + esc(cf(lang, 'c_upd', { d: fdt(D.updated > MOD ? D.updated : MOD, lang) })) + $t.k18 +
$q.cR + esc(c(lang, $q.cS)) + $t.k19 + ['c_tax', $q.cT, 'c_src'].map(z => esc(c(lang, z))).join($q.at) + $q.au + rowsH + $q.av +
(C0.part ? '<p>' + esc(C0.part) + '</p>' : '') + (C0.note ? '<p>' + esc(C0.note) + '</p>' : '') +
$q.cU + esc(c(lang, 'c_ex')) + $q.am + esc(cf(lang, 'c_exp', { k, in: inP, cur: T.cur })) + $t.k20 + ['c_pt', $q.cV, 'c_tot'].map(z => esc(c(lang, z))).join($q.at) + $q.au + exH + $q.av +
'<h3>' + esc(c(lang, $q.cW)) + $q.bM + near + '</ul>' +
$t.k21 + E.tool + '">' + esc(c(lang, $q.cX)) + '</a>' + (PL[s] ? $q.cY + pre(lang) + BASE + s + '/">' + esc(tx(lang, $q.bj, { in: pin({ s }, lang) })) + '</a>' : '') + '</p>' +
$t.k22 + esc(t(lang, 'faq_h')) + '</h2>' + faq.map(([q, a]) => '<h3>' + esc(q) + $q.Y + esc(a) + '</p>').join('') + $q.cZ + esc(c(lang, $q.da)) + $t.k23;
const ld = [{ '@type': $q.db, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: MOD }, crumbLd(lang, crumbs),
{ '@type': $q.bS, '@id': url + '#faq', mainEntity: faq.map(([q, a]) => ({ '@type': $q.bT, name: q, acceptedAnswer: { '@type': $q.bU, text: a } })) }];
return { path, title, desc, body, ld };
}
const BODY = new Map();
export async function page(req, u, env, ctx, shell) {
  if (u.pathname === SITEMAP) return new Response(await sitemapXml(env), { headers: { 'content-type': $q.dc, 'cache-control': $q.dd } });
  const cm = u.pathname.match(TC_RX), gm = cm || u.pathname.match(GL_RX);
  const m = gm || u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  const lang = m[1] || 'en', slug = gm ? null : (m[2] || null);
  if (slug && !PL[slug]) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.de } });
  let G; try { G = await guideData(env); } catch (e) { return null; }
  const k = lang + '|' + (cm ? 'c:' + cm[2] : gm ? 'g:' + gm[2] : (slug || '#')) + '|' + G.v;
  let pg = BODY.get(k);
  if (!pg && cm) { let D; try { D = await tcData(env); } catch (e) { return null; } pg = tcPage(D, cm[2], lang); if (!pg) return null; if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); }
  else if (!pg && gm) { let D; try { D = await glData(env); } catch (e) { return null; } pg = glPage(D, gm[2], lang); if (BODY.size > 300) BODY.clear(); BODY.set(k, pg); }
  if (!pg) {
    const lease = slug ? await leaseCount(env, G.places.get(slug).L.map(r => r.id)) : 0;
    pg = slug ? guidePage(G, slug, lang, lease) : hubPage(G, lang); if (!pg) return null;
    if (BODY.size > 300) BODY.clear(); BODY.set(k, pg);
  }
  const sh = await shell(pre(lang) + $q.df);
  const url = ORIGIN + pre(lang) + pg.path, alts = LANGS.map(l => $q.dg + l + $q.dh + ORIGIN + pre(l) + pg.path + '">').join('') + $q.di + ORIGIN + pg.path + '">';
  const tags = $q.dj + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? $q.dk : '') + $q.dl + esc(pg.desc) + $q.dm + url + '">' + alts + $q.dn +
    $q.do + esc(pg.title) + $q.dp + esc(pg.desc) + $q.dq + url + $q.dr + ogImg(url) + $q.ds +
    $q.dt + JSON.stringify({ '@context': $q.du, '@graph': pg.ld }).replace(/</g, $q.dv) + $q.dw + $q.a;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.dx, { element(e) { e.remove(); } })
    .on($q.dy, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on($q.dz, { element(e) { const l = e.getAttribute($q.dA); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.dB } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': $q.dB, 'cache-control': $q.dC } });
}
async function sitemapXml(env) {
let cs = []; try { cs = [...(await tcData(env)).by.keys()]; } catch (e) { cs = []; }
const paths = [BASE].concat(BUY_PLACES.map(P => BASE + P.s + '/'), GL_TERMS.map(x => $q.ax + x + '/'), cs.map(x => $q.bs + x + '/'));
const x = paths.flatMap(p => LANGS.map(l => $q.dD + ORIGIN + pre(l) + p + $q.dE + MOD + $q.dF + LANGS.map(a => $t.k24 + a + $q.dh + ORIGIN + pre(a) + p + '"/>').join('') + $t.k25 + ORIGIN + p + $q.dG));
return $s.k0 + x.join('\n') + $q.dH;
}
export { guidePage, hubPage, guideData, glData, glPage, tcData, tcPage, SRC, PLAN };
