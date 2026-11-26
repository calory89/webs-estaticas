// comments: _notes/kolaboro-worker-comments.txt
const R = '2026-11-14';
export const PLACES29 = [
{ s: 'france', tr: null, cc: 'FR', c: 'France', co: ['France'], own: false },
{ s: 'malaysia', tr: null, cc: 'MY', c: 'Malaysia', co: ['Malaysia'], own: false },
{ s: 'turkey', tr: null, cc: 'TR', c: 'Turkey', co: ['Turkey'] },
{ s: 'australia', tr: null, cc: 'AU', c: 'Australia', co: ['Australia'] },
{ s: 'japan', tr: null, cc: 'JP', c: 'Japan', co: ['Japan'], own: false },
{ s: 'united-kingdom', tr: null, cc: 'GB', c: 'United Kingdom', co: ['United Kingdom'], own: false },
{ s: 'poland', tr: null, cc: 'PL', c: 'Poland', co: ['Poland'], own: false },
{ s: 'canada', tr: null, cc: 'CA', c: 'Canada', co: ['Canada'] }
];
export const PL29 = {
france: { n: { en: 'France', es: 'Francia', fr: 'France', de: 'Frankreich', nl: 'Frankrijk', ru: 'Франция', zh: '法国', ar: 'فرنسا' }, in: { en: 'in France', es: 'en Francia', fr: 'en France', de: 'in Frankreich', nl: 'in Frankrijk', ru: 'во Франции', zh: '在法国', ar: 'في فرنسا' } },
malaysia: { n: { en: 'Malaysia', es: 'Malasia', fr: 'Malaisie', de: 'Malaysia', nl: 'Maleisië', ru: 'Малайзия', zh: '马来西亚', ar: 'ماليزيا' }, in: { en: 'in Malaysia', es: 'en Malasia', fr: 'en Malaisie', de: 'in Malaysia', nl: 'in Maleisië', ru: 'в Малайзии', zh: '在马来西亚', ar: 'في ماليزيا' } },
turkey: { n: { en: 'Turkey', es: 'Turquía', fr: 'Turquie', de: 'Türkei', nl: 'Turkije', ru: 'Турция', zh: '土耳其', ar: 'تركيا' }, in: { en: 'in Turkey', es: 'en Turquía', fr: 'en Turquie', de: 'in der Türkei', nl: 'in Turkije', ru: 'в Турции', zh: '在土耳其', ar: 'في تركيا' } },
australia: { n: { en: 'Australia', es: 'Australia', fr: 'Australie', de: 'Australien', nl: 'Australië', ru: 'Австралия', zh: '澳大利亚', ar: 'أستراليا' }, in: { en: 'in Australia', es: 'en Australia', fr: 'en Australie', de: 'in Australien', nl: 'in Australië', ru: 'в Австралии', zh: '在澳大利亚', ar: 'في أستراليا' } },
japan: { n: { en: 'Japan', es: 'Japón', fr: 'Japon', de: 'Japan', nl: 'Japan', ru: 'Япония', zh: '日本', ar: 'اليابان' }, in: { en: 'in Japan', es: 'en Japón', fr: 'au Japon', de: 'in Japan', nl: 'in Japan', ru: 'в Японии', zh: '在日本', ar: 'في اليابان' } },
'united-kingdom': { n: { en: 'United Kingdom', es: 'Reino Unido', fr: 'Royaume-Uni', de: 'Vereinigtes Königreich', nl: 'Verenigd Koninkrijk', ru: 'Великобритания', zh: '英国', ar: 'المملكة المتحدة' }, in: { en: 'in the United Kingdom', es: 'en el Reino Unido', fr: 'au Royaume-Uni', de: 'im Vereinigten Königreich', nl: 'in het Verenigd Koninkrijk', ru: 'в Великобритании', zh: '在英国', ar: 'في المملكة المتحدة' }, tin: { de: 'in Großbritannien', nl: 'in het VK', ar: 'في بريطانيا' } },
poland: { n: { en: 'Poland', es: 'Polonia', fr: 'Pologne', de: 'Polen', nl: 'Polen', ru: 'Польша', zh: '波兰', ar: 'بولندا' }, in: { en: 'in Poland', es: 'en Polonia', fr: 'en Pologne', de: 'in Polen', nl: 'in Polen', ru: 'в Польше', zh: '在波兰', ar: 'في بولندا' } },
canada: { n: { en: 'Canada', es: 'Canadá', fr: 'Canada', de: 'Kanada', nl: 'Canada', ru: 'Канада', zh: '加拿大', ar: 'كندا' }, in: { en: 'in Canada', es: 'en Canadá', fr: 'au Canada', de: 'in Kanada', nl: 'in Canada', ru: 'в Канаде', zh: '在加拿大', ar: 'في كندا' } }
};
export const SRC29 = {
fr_vefa: { n: 'Service-Public.fr: Vente en l’état futur d’achèvement (Vefa), checked by Service Public on 18 Sep 2026', u: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F39743', d: R },
fr_acte: { n: 'Service-Public.fr: Acte de vente d’un logement en Vefa, checked by Service Public on 18 Sep 2026', u: 'https://www.service-public.gouv.fr/particuliers/vosdroits/F2961', d: R },
fr_ae: { n: 'Annuaire des Entreprises (French state company directory)', u: 'https://annuaire-entreprises.data.gouv.fr/', d: R, op: 1 },
fr_geo: { n: 'Géorisques (French state risk map)', u: 'https://www.georisques.gouv.fr/', d: R, op: 1 },
my_teduh: { n: 'KPKT TEDUH (Ministry of Local Government Development)', u: 'https://teduh.kpkt.gov.my/', d: R, op: 1 },
my_reglist: { n: 'Kolaboro register guide: Malaysia', u: '/registers/#malaysia', d: R, own: 1 },
tr_inv: { n: 'Investment Office of the Presidency of Türkiye: Acquiring Property and Citizenship', u: 'https://invest.gov.tr/en/InvestmentGuide/Pages/acquiring-property-and-citizenship.aspx', d: R },
tr_parsel: { n: 'TKGM Parsel Sorgu (land registry and cadastre)', u: 'https://parselsorgu.tkgm.gov.tr/', d: R, op: 1 },
tr_kap: { n: 'KAP (Public Disclosure Platform)', u: 'https://www.kap.org.tr/en', d: R, op: 1 },
au_gn6: { n: 'Australian Government, Foreign Investment: Guidance Note 6, Residential Land, version 5 (1 July 2026)', u: 'https://foreigninvestment.gov.au/sites/foreigninvestment.gov.au/files/2026-06/guidance-note-6-residential-land-v5.pdf', d: R },
au_asic: { n: 'ASIC registers', u: 'https://asic.gov.au/online-services/search-asic-registers/', d: R, op: 1 },
au_nsw: { n: 'NSW Department of Planning (state planning portal)', u: 'https://www.planning.nsw.gov.au/', d: R, op: 1 },
jp_reba: { n: 'Real Estate Brokerage Act (Act No. 176 of 1952), English translation, Japanese Law Translation (Ministry of Justice)', u: 'https://www.japaneselawtranslation.go.jp/en/laws/view/2653/en', d: R },
jp_mlit: { n: 'MLIT search of licensed real estate brokers', u: 'https://etsuran2.mlit.go.jp/TAKKEN/', d: R, op: 1 },
jp_touki: { n: 'Registry information service (touki)', u: 'https://www.touki.or.jp/', d: R, op: 1 },
uk_roe: { n: 'GOV.UK (Companies House): Register an overseas entity, last updated 1 Feb 2026', u: 'https://www.gov.uk/guidance/register-an-overseas-entity', d: R },
uk_sdlt: { n: 'GOV.UK (HMRC): Rates of Stamp Duty Land Tax for non-UK residents, last updated 1 Apr 2025', u: 'https://www.gov.uk/guidance/rates-of-stamp-duty-land-tax-for-non-uk-residents', d: R },
uk_ch: { n: 'Companies House', u: 'https://find-and-update.company-information.service.gov.uk/', d: R, op: 1 },
uk_hmlr: { n: 'HM Land Registry: search property information', u: 'https://www.gov.uk/search-property-information-land-registry', d: R, op: 1 },
uk_plan: { n: 'GOV.UK: search a council’s register of planning decisions', u: 'https://www.gov.uk/search-register-planning-decisions', d: R, op: 1 },
pl_act: { n: 'Act of 20 May 2021 on the protection of the rights of buyers of a dwelling or a single-family house and the Developer Guarantee Fund, consolidated text Dz.U. 2026 item 880 (12 June 2026), Articles 6, 7 and 32', u: 'https://api.sejm.gov.pl/eli/acts/DU/2026/880/text.pdf', d: R },
pl_ekw: { n: 'Elektroniczne Księgi Wieczyste (Ministry of Justice land and mortgage registers)', u: 'https://ekw.ms.gov.pl/', d: R, op: 1 },
ca_act: { n: 'Prohibition on the Purchase of Residential Property by Non-Canadians Act, section 4 (Justice Laws, current to 19 Oct 2026)', u: 'https://laws-lois.justice.gc.ca/eng/acts/p-25.2/FullText.html', d: R },
ca_reg: { n: 'Prohibition on the Purchase of Residential Property by Non-Canadians Regulations (SOR/2022-250), section 3 (current to 19 Oct 2026)', u: 'https://laws-lois.justice.gc.ca/eng/regulations/SOR-2022-250/FullText.html', d: R },
ca_cc: { n: 'Corporations Canada: search for a federal corporation', u: 'https://ised-isde.canada.ca/cc/lgcy/fdrlCrpSrch.html', d: R, op: 1 }
};
export const PLAN29 = {
france: { company: [['n_fr_ae', ['fr_ae']]], land: [['n_fr_risk', ['fr_vefa', 'fr_geo']]], money: [['n_fr_pay', ['fr_vefa']], ['n_fr_gfa', ['fr_vefa']]], sale: [['n_fr_draft', ['fr_vefa', 'fr_acte']]] },
malaysia: { permit: [['n_my_teduh', ['my_teduh', 'my_reglist']]], date: [['n_my_teduh_d', ['my_teduh']]] },
turkey: { company: [['n_tr_kap', ['tr_kap']]], land: [['n_tr_tapu', ['tr_inv', 'tr_parsel']], ['n_tr_30', ['tr_inv']]], sale: [['n_tr_cit', ['tr_inv']]] },
australia: { company: [['n_au_asic', ['au_asic']]], land: [['n_au_firb', ['au_gn6']]], permit: [['n_au_da', ['au_nsw']]], sale: [['n_au_ndec', ['au_gn6']]] },
japan: { company: [['n_jp_lic', ['jp_reba', 'jp_mlit']]], land: [['n_jp_touki', ['jp_touki']]], permit: [['n_jp_36', ['jp_reba']]], money: [['n_jp_39', ['jp_reba']], ['n_jp_41', ['jp_reba']]] },
'united-kingdom': { company: [['n_uk_ch', ['uk_ch']]], land: [['n_uk_hmlr', ['uk_hmlr']]], permit: [['n_uk_plan', ['uk_plan']]], sale: [['n_uk_roe', ['uk_roe']], ['n_uk_sdlt', ['uk_sdlt']]] },
poland: { land: [['n_pl_kw', ['pl_ekw']]], money: [['n_pl_escrow', ['pl_act']]], sale: [['n_pl_res', ['pl_act']]] },
canada: { company: [['n_ca_cc', ['ca_cc']]], land: [['n_ca_ban', ['ca_act']], ['n_ca_cma', ['ca_reg']]] }
};
export const COUNTRY29 = { FR: 'france', MY: 'malaysia', TR: 'turkey', AU: 'australia', JP: 'japan', GB: 'united-kingdom', PL: 'poland', CA: 'canada' };
export const NT29 = {} ;
export const BS29 = {} ;
export const GL_TERMS = ['escrow', 'leasehold', 'payment-plan'];
export const GL29 = {} ;
export const GL_NAME = {
escrow: { en: 'escrow', es: 'una cuenta de garantía (escrow)', fr: 'un compte séquestre (escrow)', de: 'ein Treuhandkonto (Escrow)', nl: 'een derdenrekening (escrow)', ru: 'эскроу', zh: '托管账户（Escrow）', ar: 'حساب الضمان (Escrow)' },
leasehold: { en: 'leasehold', es: 'el arrendamiento (leasehold)', fr: 'le bail (leasehold)', de: 'Leasehold', nl: 'erfpacht (leasehold)', ru: 'leasehold', zh: '租赁产权（leasehold）', ar: 'الإيجار الطويل (leasehold)' },
'payment-plan': { en: 'an off-plan payment plan', es: 'un plan de pagos sobre plano', fr: 'un échéancier sur plan', de: 'ein Off-Plan-Zahlungsplan', nl: 'een off-plan betalingsschema', ru: 'план платежей в новостройке', zh: '期房付款计划', ar: 'خطة السداد على الخارطة' }
};
export const TC29 = [
{ s: 'dubai', k: 'ae', tool: 'ae' }, { s: 'costa-del-sol', k: 'esA', tool: 'es' }, { s: 'portugal', k: 'pt', tool: 'pt' }, { s: 'thailand', k: 'th', tool: 'th' },
{ s: 'indonesia', k: 'id', tool: 'id' }, { s: 'england', k: 'uk', tool: 'uk' }, { s: 'turkey', k: 'tr', tool: 'tr' }
];
export const TCPL = {
portugal: { en: 'in mainland Portugal', es: 'en Portugal continental', fr: 'au Portugal continental', de: 'auf dem portugiesischen Festland', nl: 'op het Portugese vasteland', ru: 'в континентальной Португалии', zh: '在葡萄牙本土', ar: 'في البر البرتغالي' },
thailand: { en: 'in Thailand', es: 'en Tailandia', fr: 'en Thaïlande', de: 'in Thailand', nl: 'in Thailand', ru: 'в Таиланде', zh: '在泰国', ar: 'في تايلاند' },
indonesia: { en: 'in Indonesia', es: 'en Indonesia', fr: 'en Indonésie', de: 'in Indonesien', nl: 'in Indonesië', ru: 'в Индонезии', zh: '在印度尼西亚', ar: 'في إندونيسيا' },
england: { en: 'in England', es: 'en Inglaterra', fr: 'en Angleterre', de: 'in England', nl: 'in Engeland', ru: 'в Англии', zh: '在英格兰', ar: 'في إنجلترا' }
};
export const TCPL_T = { portugal: { en: 'in Portugal', es: 'en Portugal', fr: 'au Portugal', de: 'in Portugal', nl: 'in Portugal', ru: 'в Португалии', zh: '在葡萄牙', ar: 'في البرتغال' } };
export const TCS = {} ;
