// kolaboro.com batch 29 (agent n29h2, 14 Nov 2026): country buying guides for kbx_buy.js (item 26), in 8 languages.
// Only countries where we track 10+ projects and where we could read an official source for at least one rule from this container on
// 14 Nov 2026 (curl, 1 request per second per host). Every note restates in plain words the official source listed with it in PLAN29;
// registers marked "opened" were opened (HTTP 200) on that day. No advice, no verdicts, nothing estimated.
// Not covered, and why (14 Nov 2026): Brazil (planalto.gov.br timed out), Philippines (DHSUD and the judiciary e-library answer 403 to
// automated clients), Saudi Arabia (the REGA page of the off-plan law returned "page not found"), Greece, Georgia, Vietnam, Oman, Egypt,
// Sri Lanka (no official page found by search that we could read). They keep the country pages under /countries/<c>/how-to-check/.
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
// official sources: d = date read (laws, government pages) or opened (registers)
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

export const NT29 = {
  // ---------------------------------------------------------------- France
  n_fr_ae: {
    en: 'Look up the company that signs the sale in the state’s Annuaire des Entreprises, by name or SIREN number: it shows whether the company is active, its registered address and its managers.',
    es: 'Busca la empresa que firma la venta en el Annuaire des Entreprises del Estado, por nombre o número SIREN: muestra si la empresa está activa, su domicilio social y sus directivos.',
    fr: 'Recherchez la société qui signe la vente dans l’Annuaire des Entreprises de l’État, par son nom ou son numéro SIREN : il indique si la société est active, son siège et ses dirigeants.',
    de: 'Suchen Sie die Gesellschaft, die den Kaufvertrag unterschreibt, im staatlichen Annuaire des Entreprises nach Name oder SIREN-Nummer: Dort steht, ob sie aktiv ist, ihr Sitz und ihre Geschäftsführung.',
    nl: 'Zoek het bedrijf dat de koop tekent op in het Annuaire des Entreprises van de Franse staat, op naam of SIREN-nummer: daar staat of het bedrijf actief is, het statutaire adres en de bestuurders.',
    ru: 'Найдите компанию, которая подписывает договор, в государственном справочнике Annuaire des Entreprises по названию или номеру SIREN: там видно, действует ли компания, её юридический адрес и руководители.',
    zh: '在法国政府的 Annuaire des Entreprises 中按名称或 SIREN 号查询签署买卖合同的公司：可看到公司是否仍在经营、注册地址和管理人员。',
    ar: 'ابحث عن الشركة التي توقّع عقد البيع في دليل الشركات الحكومي Annuaire des Entreprises بالاسم أو برقم SIREN: يبيّن إن كانت الشركة قائمة وعنوانها المسجّل ومديريها.'
  },
  n_fr_risk: {
    en: 'The seller must tell you anything it knows that could affect your decision, for example that the land is in a flood zone or that a large infrastructure project is planned nearby. You can also look up the natural and industrial risks of the address on Géorisques.',
    es: 'El vendedor debe informarte de todo lo que sepa y pueda influir en tu decisión, por ejemplo que el terreno está en zona inundable o que se prevé una gran infraestructura cerca. También puedes consultar los riesgos naturales e industriales de la dirección en Géorisques.',
    fr: 'Le vendeur doit vous informer de tout ce qu’il sait et qui pourrait influencer votre décision, par exemple un terrain en zone inondable ou un projet d’infrastructure prévu à proximité. Vous pouvez aussi consulter les risques naturels et technologiques de l’adresse sur Géorisques.',
    de: 'Der Verkäufer muss Ihnen alles mitteilen, was er weiß und Ihre Entscheidung beeinflussen könnte, etwa dass das Grundstück in einem Überschwemmungsgebiet liegt oder ein großes Infrastrukturprojekt in der Nähe geplant ist. Natur- und Industrierisiken der Adresse finden Sie auch auf Géorisques.',
    nl: 'De verkoper moet je alles vertellen wat hij weet en wat je beslissing kan beïnvloeden, bijvoorbeeld dat de grond in een overstromingsgebied ligt of dat er een groot infrastructuurproject in de buurt gepland is. De natuurlijke en industriële risico’s van het adres staan ook op Géorisques.',
    ru: 'Продавец обязан сообщить вам всё, что ему известно и может повлиять на ваше решение, например что участок в зоне подтопления или рядом планируется крупный инфраструктурный объект. Природные и техногенные риски по адресу можно также посмотреть на Géorisques.',
    zh: '卖方必须告知其所知、可能影响您决定的一切情况，例如土地位于洪水区，或附近规划有大型基础设施项目。您也可以在 Géorisques 上查询该地址的自然和工业风险。',
    ar: 'يجب على البائع أن يخبرك بكل ما يعرفه مما قد يؤثر في قرارك، مثل وقوع الأرض في منطقة فيضانات أو التخطيط لمشروع بنية تحتية كبير قريب منها. ويمكنك أيضاً الاطلاع على المخاطر الطبيعية والصناعية للعنوان على Géorisques.'
  },
  n_fr_pay: {
    en: 'In a sale off-plan (VEFA) you pay as the works progress, at most 35% of the price when the foundations are finished, 70% when the building is weathertight and 95% at completion. The last 5% is paid at handover, and you may hold it back if you record defects then.',
    es: 'En una venta sobre plano (VEFA) pagas según avanza la obra: como máximo el 35 % del precio al terminar los cimientos, el 70 % cuando el edificio está cerrado y cubierto y el 95 % al terminar. El 5 % restante se paga en la entrega, y puedes retenerlo si anotas defectos en ese momento.',
    fr: 'En Vefa, vous payez selon l’avancement des travaux, au plus 35 % du prix à l’achèvement des fondations, 70 % à la mise hors d’eau et 95 % à l’achèvement. Les 5 % restants sont versés à la livraison, et peuvent être consignés si vous émettez des réserves.',
    de: 'Beim Kauf vom Plan (VEFA) zahlen Sie nach Baufortschritt, höchstens 35 % des Preises nach Fertigstellung des Fundaments, 70 % wenn das Gebäude wetterdicht ist und 95 % bei Fertigstellung. Die letzten 5 % werden bei der Übergabe fällig und können zurückgehalten werden, wenn Sie dann Mängel festhalten.',
    nl: 'Bij koop op plan (VEFA) betaal je naargelang de bouw vordert, hoogstens 35 % van de prijs als de fundering klaar is, 70 % als het gebouw wind- en waterdicht is en 95 % bij voltooiing. De laatste 5 % betaal je bij de oplevering, en je mag die inhouden als je dan gebreken noteert.',
    ru: 'При покупке на этапе строительства (VEFA) вы платите по мере работ: не более 35 % цены после фундамента, 70 % когда здание закрыто от непогоды и 95 % по завершении. Последние 5 % платятся при передаче, и их можно удержать, если вы фиксируете недостатки.',
    zh: '在期房买卖（VEFA）中按工程进度付款：地基完工时最多付价款的 35%，建筑封顶防水时最多 70%，竣工时最多 95%。其余 5% 在交房时支付，若交房时记录了缺陷可暂扣。',
    ar: 'في البيع على الخارطة (VEFA) تدفع بحسب تقدّم الأعمال: 35% من السعر كحد أقصى عند انتهاء الأساسات، و70% عند إغلاق المبنى في وجه الماء، و95% عند الإنجاز. وتُدفع الـ5% الأخيرة عند التسليم، ويمكنك حجزها إذا سجّلت عيوباً حينها.'
  },
  n_fr_gfa: {
    en: 'The seller must give you a guarantee: either a completion guarantee that pays to finish the works if the developer cannot, or a refund guarantee for the sums you paid if the sale is cancelled because the building is not finished. It comes from a bank, a financial institution or an insurer.',
    es: 'El vendedor debe darte una garantía: o una garantía de terminación que paga el final de la obra si el promotor no puede, o una garantía de reembolso de lo que pagaste si la venta se anula porque el edificio no se termina. La da un banco, una entidad financiera o una aseguradora.',
    fr: 'Le vendeur doit vous fournir une garantie : soit une garantie d’achèvement qui finance la fin des travaux si le promoteur ne peut pas les terminer, soit une garantie de remboursement des sommes versées si la vente est annulée faute d’achèvement. Elle est fournie par une banque, un établissement financier ou une entreprise d’assurance.',
    de: 'Der Verkäufer muss Ihnen eine Garantie stellen: entweder eine Fertigstellungsgarantie, die den Rest der Arbeiten bezahlt, wenn der Bauträger es nicht kann, oder eine Rückzahlungsgarantie für Ihre Zahlungen, wenn der Kauf wegen fehlender Fertigstellung aufgehoben wird. Sie kommt von einer Bank, einem Finanzinstitut oder einem Versicherer.',
    nl: 'De verkoper moet je een garantie geven: een voltooiingsgarantie die de rest van de bouw betaalt als de ontwikkelaar dat niet kan, of een terugbetalingsgarantie voor wat je betaald hebt als de koop vervalt omdat het gebouw niet af komt. Die komt van een bank, een financiële instelling of een verzekeraar.',
    ru: 'Продавец обязан предоставить гарантию: либо гарантию завершения, которая оплатит окончание работ, если застройщик не сможет, либо гарантию возврата уплаченных сумм, если сделка расторгнута из-за незавершённого строительства. Её выдаёт банк, финансовая организация или страховщик.',
    zh: '卖方必须提供担保：要么是竣工担保，在开发商无法完工时出资完成工程；要么是退款担保，在因未竣工而解除买卖时退还您已付款项。担保由银行、金融机构或保险公司出具。',
    ar: 'يجب على البائع أن يقدّم لك ضماناً: إما ضمان إنجاز يموّل إكمال الأعمال إذا عجز المطوّر، وإما ضمان استرداد للمبالغ المدفوعة إذا أُلغي البيع لعدم إنجاز المبنى. ويصدر عن بنك أو مؤسسة مالية أو شركة تأمين.'
  },
  n_fr_draft: {
    en: 'The draft final deed must be sent to you at least one month before the signing appointment. If the sale is signed directly before the notary without a prior reservation contract, you have 10 days to change your mind, and the deed cannot be signed before they end.',
    es: 'El borrador de la escritura definitiva debe enviársete al menos un mes antes de la cita de firma. Si la venta se firma directamente ante notario sin contrato de reserva previo, tienes 10 días para pensarlo, y la escritura no puede firmarse antes de que terminen.',
    fr: 'Le projet d’acte définitif doit vous être notifié au moins 1 mois avant le rendez-vous de signature. Si la vente est conclue directement par acte authentique sans contrat de réservation, vous disposez d’un délai de réflexion de 10 jours, pendant lequel l’acte ne peut pas être signé.',
    de: 'Der Entwurf der endgültigen Urkunde muss Ihnen mindestens einen Monat vor dem Unterzeichnungstermin zugestellt werden. Wird der Kauf ohne vorherigen Reservierungsvertrag direkt beim Notar geschlossen, haben Sie 10 Tage Bedenkzeit, vor deren Ende nicht unterschrieben werden darf.',
    nl: 'Het ontwerp van de definitieve akte moet je minstens een maand voor de ondertekening ontvangen. Wordt de koop zonder voorafgaand reserveringscontract meteen bij de notaris gesloten, dan heb je 10 dagen bedenktijd en mag de akte niet eerder getekend worden.',
    ru: 'Проект окончательного акта должен быть направлен вам не позднее чем за месяц до подписания. Если сделка заключается сразу у нотариуса без предварительного договора бронирования, у вас есть 10 дней на размышление, и до их окончания акт подписать нельзя.',
    zh: '最终契据草案必须至少在签约日前一个月送达您。若未先签预订合同而直接在公证人处签署买卖，您有 10 天冷静期，期满前不得签署契据。',
    ar: 'يجب إرسال مسودة العقد النهائي إليك قبل موعد التوقيع بشهر على الأقل. وإذا وُقّع البيع مباشرة أمام الموثّق من دون عقد حجز مسبق، فلديك مهلة تفكير مدتها 10 أيام لا يجوز توقيع العقد قبل انقضائها.'
  },
  // ---------------------------------------------------------------- Malaysia
  n_my_teduh: {
    en: 'Search the project or developer on KPKT’s TEDUH portal: it shows the developer’s licence and the project’s Advertising Permit and Developer’s Licence (APDL) and their status. Ask for both numbers and match them with what the sales gallery shows.',
    es: 'Busca el proyecto o el promotor en el portal TEDUH del KPKT: muestra la licencia del promotor y el permiso de publicidad y licencia del proyecto (APDL) y su estado. Pide ambos números y compáralos con lo que muestra la sala de ventas.',
    fr: 'Cherchez le projet ou le promoteur sur le portail TEDUH du KPKT : il indique la licence du promoteur, le permis de publicité et licence du projet (APDL) et leur statut. Demandez les deux numéros et comparez-les à ce qu’affiche l’espace de vente.',
    de: 'Suchen Sie Projekt oder Bauträger im TEDUH-Portal des KPKT: Dort stehen die Lizenz des Bauträgers sowie Werbegenehmigung und Lizenz des Projekts (APDL) mit ihrem Status. Verlangen Sie beide Nummern und vergleichen Sie sie mit dem, was die Verkaufsgalerie zeigt.',
    nl: 'Zoek het project of de ontwikkelaar op in het TEDUH-portaal van het KPKT: daar staan de vergunning van de ontwikkelaar en de reclamevergunning en licentie van het project (APDL) met hun status. Vraag beide nummers en vergelijk ze met wat de verkoopgalerie toont.',
    ru: 'Найдите проект или застройщика на портале TEDUH министерства KPKT: там указаны лицензия застройщика, разрешение на рекламу и лицензия проекта (APDL) и их статус. Попросите оба номера и сверьте их с тем, что показывают в офисе продаж.',
    zh: '在 KPKT 的 TEDUH 平台上搜索项目或开发商：可查看开发商执照、项目的广告许可证和开发商执照（APDL）及其状态。索取这两个编号，并与售楼处展示的内容核对。',
    ar: 'ابحث عن المشروع أو المطوّر في بوابة TEDUH التابعة لوزارة KPKT: تعرض رخصة المطوّر وتصريح الإعلان ورخصة المشروع (APDL) وحالتهما. اطلب الرقمين وطابقهما مع ما يعرضه مكتب المبيعات.'
  },
  n_my_teduh_d: {
    en: 'TEDUH also reports the project’s progress as declared, whether an extension of time was granted and whether the project is listed as delayed (sick) or abandoned. Check it before each progress payment.',
    es: 'TEDUH también indica el avance declarado del proyecto, si se concedió una prórroga y si figura como retrasado («sick») o abandonado. Consúltalo antes de cada pago por avance de obra.',
    fr: 'TEDUH indique aussi l’avancement déclaré du projet, si une prolongation de délai a été accordée et si le projet est classé en retard (« sick ») ou abandonné. Consultez-le avant chaque paiement d’étape.',
    de: 'TEDUH zeigt auch den gemeldeten Baufortschritt, ob eine Fristverlängerung gewährt wurde und ob das Projekt als verzögert („sick“) oder aufgegeben geführt wird. Prüfen Sie es vor jeder Ratenzahlung.',
    nl: 'TEDUH toont ook de opgegeven voortgang, of er uitstel is verleend en of het project als vertraagd (“sick”) of verlaten te boek staat. Kijk ernaar voor elke termijnbetaling.',
    ru: 'TEDUH также показывает заявленный ход строительства, продлевался ли срок и числится ли проект как задержанный («sick») или заброшенный. Проверяйте перед каждым платежом по этапам.',
    zh: 'TEDUH 还显示项目申报的进度、是否获准延期，以及是否被列为延误（sick）或烂尾项目。每次按进度付款前都请查看。',
    ar: 'تعرض TEDUH أيضاً تقدّم المشروع كما أُعلن، وما إذا مُنح تمديد للمدة، وما إذا كان مدرجاً كمتعثّر («sick») أو مهجور. راجعها قبل كل دفعة مرتبطة بالتقدّم.'
  },
  // ---------------------------------------------------------------- Turkey
  n_tr_kap: {
    en: 'If the developer or its parent company is listed on Borsa Istanbul, its projects, sales and material events are disclosed on KAP. Most developers are not listed, so a missing entry proves nothing.',
    es: 'Si el promotor o su matriz cotiza en Borsa Istanbul, sus proyectos, ventas y hechos relevantes se publican en KAP. La mayoría de promotores no cotiza, así que no aparecer no prueba nada.',
    fr: 'Si le promoteur ou sa maison mère est coté à Borsa Istanbul, ses projets, ses ventes et ses événements importants sont publiés sur KAP. La plupart des promoteurs ne sont pas cotés : une absence ne prouve rien.',
    de: 'Ist der Bauträger oder seine Muttergesellschaft an der Borsa Istanbul notiert, werden Projekte, Verkäufe und wesentliche Ereignisse auf KAP veröffentlicht. Die meisten Bauträger sind nicht notiert, ein fehlender Eintrag beweist also nichts.',
    nl: 'Als de ontwikkelaar of zijn moedermaatschappij op Borsa Istanbul genoteerd is, staan projecten, verkopen en belangrijke gebeurtenissen op KAP. De meeste ontwikkelaars zijn niet genoteerd, dus geen vermelding bewijst niets.',
    ru: 'Если застройщик или его материнская компания торгуются на Borsa Istanbul, их проекты, продажи и существенные события раскрываются на KAP. Большинство застройщиков не на бирже, так что отсутствие записи ничего не доказывает.',
    zh: '如果开发商或其母公司在伊斯坦布尔证券交易所上市，其项目、销售和重大事项会在 KAP 上披露。多数开发商并未上市，因此查不到并不说明任何问题。',
    ar: 'إذا كان المطوّر أو شركته الأم مدرجاً في بورصة إسطنبول، تُنشر مشاريعه ومبيعاته وأحداثه الجوهرية على KAP. معظم المطوّرين غير مدرجين، لذا فغياب السجل لا يثبت شيئاً.'
  },
  n_tr_tapu: {
    en: 'Ownership passes only when the sale is registered at the land registry directorate. A preliminary sale contract, even one made before a notary, is only a promise to transfer. Check mortgages and other burdens on the parcel first; parcels can be looked up on TKGM’s Parsel Sorgu.',
    es: 'La propiedad solo se transmite cuando la venta se inscribe en la dirección del registro de la propiedad. Un contrato preliminar de venta, aunque sea ante notario, es solo una promesa de transmitir. Comprueba antes las hipotecas y otras cargas de la parcela; las parcelas se consultan en Parsel Sorgu de TKGM.',
    fr: 'La propriété n’est transférée qu’à l’enregistrement de la vente auprès de la direction du registre foncier. Une promesse de vente, même notariée, n’est qu’un engagement de transférer. Vérifiez d’abord les hypothèques et autres charges de la parcelle ; les parcelles se consultent sur Parsel Sorgu de la TKGM.',
    de: 'Das Eigentum geht erst mit der Eintragung des Verkaufs beim Grundbuchamt über. Ein Vorvertrag, auch ein notarieller, ist nur ein Versprechen der Übertragung. Prüfen Sie vorher Hypotheken und andere Lasten auf dem Flurstück; Flurstücke lassen sich auf Parsel Sorgu der TKGM abfragen.',
    nl: 'Het eigendom gaat pas over als de verkoop is ingeschreven bij het kadaster (tapu). Een voorlopig koopcontract, ook bij de notaris, is alleen een belofte tot overdracht. Controleer eerst hypotheken en andere lasten op het perceel; percelen zoek je op in Parsel Sorgu van TKGM.',
    ru: 'Право собственности переходит только после регистрации сделки в управлении земельного реестра. Предварительный договор, даже нотариальный, лишь обещание передать право. Сначала проверьте ипотеку и другие обременения участка; участки можно найти в Parsel Sorgu ведомства TKGM.',
    zh: '只有在土地登记局完成买卖登记后，所有权才转移。预售合同即使经公证，也只是转让承诺。请先核查地块上的抵押和其他负担；可在 TKGM 的 Parsel Sorgu 查询地块。',
    ar: 'لا تنتقل الملكية إلا عند تسجيل البيع في مديرية السجل العقاري. وعقد البيع الابتدائي، حتى لو كان أمام كاتب العدل، ليس سوى وعد بالنقل. تحقّق أولاً من الرهون والأعباء الأخرى على القطعة؛ ويمكن البحث عن القطع في Parsel Sorgu التابع لـ TKGM.'
  },
  n_tr_30: {
    en: 'A foreign individual may acquire real estate anywhere in Turkey up to 30 hectares in total, but not in prohibited military zones or military security zones.',
    es: 'Una persona física extranjera puede adquirir inmuebles en cualquier lugar de Turquía hasta 30 hectáreas en total, pero no en zonas militares prohibidas ni en zonas de seguridad militar.',
    fr: 'Une personne physique étrangère peut acquérir des biens immobiliers partout en Turquie dans la limite de 30 hectares au total, mais pas dans les zones militaires interdites ni les zones de sécurité militaire.',
    de: 'Eine ausländische Privatperson darf überall in der Türkei Immobilien bis insgesamt 30 Hektar erwerben, nicht aber in militärischen Sperr- oder Sicherheitszonen.',
    nl: 'Een buitenlandse particulier mag overal in Turkije onroerend goed verwerven tot 30 hectare in totaal, maar niet in verboden militaire zones of militaire veiligheidszones.',
    ru: 'Иностранное физическое лицо может приобретать недвижимость в любой части Турции в пределах 30 гектаров в общей сложности, но не в запретных военных зонах и зонах военной безопасности.',
    zh: '外国个人可在土耳其各地购置不动产，总面积最多 30 公顷，但不得位于军事禁区或军事安全区内。',
    ar: 'يجوز للفرد الأجنبي تملّك عقارات في أي مكان في تركيا حتى 30 هكتاراً إجمالاً، ولكن ليس في المناطق العسكرية المحظورة أو مناطق الأمن العسكري.'
  },
  n_tr_cit: {
    en: 'Citizenship through property needs real estate worth at least USD 400,000, the purpose stated in the application and in the title deed, and a declaration that you will not sell it for three years.',
    es: 'La ciudadanía por compra de inmueble exige un inmueble de al menos 400.000 USD, indicar esa finalidad en la solicitud y en la escritura (tapu) y declarar que no lo venderás en tres años.',
    fr: 'La citoyenneté par l’achat immobilier exige un bien d’au moins 400 000 USD, la mention de cet objectif dans la demande et sur le titre de propriété, et l’engagement de ne pas le vendre pendant trois ans.',
    de: 'Für die Staatsbürgerschaft über Immobilien braucht es eine Immobilie im Wert von mindestens 400.000 USD, die Angabe dieses Zwecks im Antrag und im Grundbuchtitel und die Erklärung, sie drei Jahre nicht zu verkaufen.',
    nl: 'Staatsburgerschap via vastgoed vraagt een woning van minstens 400.000 USD, het doel vermeld in de aanvraag en in de eigendomsakte, en een verklaring dat je ze drie jaar niet verkoopt.',
    ru: 'Для гражданства через недвижимость нужен объект стоимостью не менее 400 000 USD, указание этой цели в заявлении и в титуле (тапу) и обязательство не продавать его три года.',
    zh: '通过购房获得国籍需购买价值至少 40 万美元的不动产，在申请和地契中注明该目的，并声明三年内不出售。',
    ar: 'تتطلب الجنسية عبر العقار عقاراً لا تقل قيمته عن 400,000 دولار أمريكي، وذكر هذا الغرض في الطلب وفي سند الملكية، والتعهد بعدم بيعه لمدة ثلاث سنوات.'
  },
  // ---------------------------------------------------------------- Australia
  n_au_asic: {
    en: 'Search the developer company on the ASIC registers: they show whether it is registered or deregistered, its ACN and its registered details. A project brand is often not the company that signs the contract.',
    es: 'Busca la empresa promotora en los registros de ASIC: muestran si está registrada o dada de baja, su ACN y sus datos registrados. La marca del proyecto a menudo no es la empresa que firma el contrato.',
    fr: 'Recherchez la société du promoteur dans les registres de l’ASIC : ils indiquent si elle est enregistrée ou radiée, son ACN et ses informations enregistrées. La marque du projet n’est souvent pas la société qui signe le contrat.',
    de: 'Suchen Sie die Bauträgergesellschaft in den ASIC-Registern: Dort steht, ob sie eingetragen oder gelöscht ist, ihre ACN und ihre registrierten Angaben. Die Projektmarke ist oft nicht die Gesellschaft, die den Vertrag unterschreibt.',
    nl: 'Zoek het bedrijf van de ontwikkelaar op in de registers van ASIC: daar staat of het geregistreerd of uitgeschreven is, het ACN en de geregistreerde gegevens. De projectnaam is vaak niet het bedrijf dat het contract tekent.',
    ru: 'Найдите компанию застройщика в реестрах ASIC: там видно, зарегистрирована она или исключена, её номер ACN и регистрационные данные. Бренд проекта часто не та компания, что подписывает договор.',
    zh: '在 ASIC 登记册中搜索开发公司：可看到其是否已注册或已注销、ACN 编号及登记信息。项目品牌往往不是签署合同的公司。',
    ar: 'ابحث عن شركة المطوّر في سجلات ASIC: تبيّن إن كانت مسجّلة أو مشطوبة ورقم ACN وبياناتها المسجّلة. وكثيراً ما لا تكون العلامة التجارية للمشروع هي الشركة التي توقّع العقد.'
  },
  n_au_firb: {
    en: 'Foreign persons generally need foreign investment approval before buying any residential land in Australia, whatever its value. From 1 April 2025 to 30 June 2029 they are generally banned from buying established dwellings; the policy channels them to new dwellings.',
    es: 'Las personas extranjeras necesitan en general autorización de inversión extranjera antes de comprar cualquier suelo residencial en Australia, sea cual sea su valor. Del 1 de abril de 2025 al 30 de junio de 2029 tienen en general prohibido comprar viviendas ya existentes; la política las orienta a vivienda nueva.',
    fr: 'Les personnes étrangères doivent en général obtenir une autorisation d’investissement étranger avant d’acheter tout terrain résidentiel en Australie, quelle que soit sa valeur. Du 1er avril 2025 au 30 juin 2029, l’achat de logements existants leur est en général interdit ; la politique les oriente vers le neuf.',
    de: 'Ausländische Personen brauchen in Australien grundsätzlich eine Genehmigung für Auslandsinvestitionen, bevor sie Wohnbauland kaufen, unabhängig vom Wert. Vom 1. April 2025 bis 30. Juni 2029 dürfen sie grundsätzlich keine Bestandswohnungen kaufen; die Politik lenkt sie zu Neubauten.',
    nl: 'Buitenlanders hebben in Australië in het algemeen toestemming voor buitenlandse investeringen nodig voordat ze woongrond kopen, ongeacht de waarde. Van 1 april 2025 tot 30 juni 2029 mogen ze in het algemeen geen bestaande woningen kopen; het beleid stuurt hen naar nieuwbouw.',
    ru: 'Иностранцам, как правило, нужно разрешение на иностранные инвестиции перед покупкой любой жилой земли в Австралии, независимо от стоимости. С 1 апреля 2025 по 30 июня 2029 года им в целом запрещено покупать готовое (вторичное) жильё; политика направляет их в новостройки.',
    zh: '外国人在澳大利亚购买任何住宅用地前，通常都需获得外国投资批准，无论价值多少。2025 年 4 月 1 日至 2029 年 6 月 30 日期间，外国人通常被禁止购买现房（二手住宅）；政策引导其购买新房。',
    ar: 'يحتاج الأجانب عموماً إلى موافقة على الاستثمار الأجنبي قبل شراء أي أرض سكنية في أستراليا مهما كانت قيمتها. ومن 1 أبريل 2025 حتى 30 يونيو 2029 يُحظر عليهم عموماً شراء المساكن القائمة؛ وتوجّههم السياسة نحو المساكن الجديدة.'
  },
  n_au_da: {
    en: 'Development applications, approvals and their conditions are published by each state on its planning portal (the link is New South Wales). Ask for the approval number and read the conditions.',
    es: 'Cada estado publica las solicitudes de desarrollo, las aprobaciones y sus condiciones en su portal de urbanismo (el enlace es el de Nueva Gales del Sur). Pide el número de aprobación y lee las condiciones.',
    fr: 'Chaque État publie les demandes d’aménagement, les autorisations et leurs conditions sur son portail d’urbanisme (le lien est celui de la Nouvelle-Galles du Sud). Demandez le numéro d’autorisation et lisez les conditions.',
    de: 'Bauanträge, Genehmigungen und Auflagen veröffentlicht jeder Bundesstaat auf seinem Planungsportal (der Link führt nach New South Wales). Verlangen Sie die Genehmigungsnummer und lesen Sie die Auflagen.',
    nl: 'Elke staat publiceert bouwaanvragen, goedkeuringen en voorwaarden op zijn planningsportaal (de link is New South Wales). Vraag het goedkeuringsnummer en lees de voorwaarden.',
    ru: 'Заявки на застройку, разрешения и их условия каждый штат публикует на своём портале планирования (ссылка ведёт на Новый Южный Уэльс). Попросите номер разрешения и прочитайте условия.',
    zh: '各州在其规划门户上公布开发申请、批准及其条件（链接为新南威尔士州）。索取批准编号并阅读附加条件。',
    ar: 'تنشر كل ولاية طلبات التطوير والموافقات وشروطها على بوابة التخطيط الخاصة بها (الرابط لولاية نيو ساوث ويلز). اطلب رقم الموافقة واقرأ الشروط.'
  },
  n_au_ndec: {
    en: 'If the developer holds a New (or Near-New) Dwelling Exemption Certificate and gives you a copy, you generally do not need your own approval to buy a new dwelling off the plan in that development, up to AUD 3 million in total. Above that you must apply yourself and pay the fee.',
    es: 'Si el promotor tiene un New (or Near-New) Dwelling Exemption Certificate y te da una copia, en general no necesitas autorización propia para comprar sobre plano una vivienda nueva en esa promoción, hasta 3 millones de AUD en total. Por encima debes solicitarla tú y pagar la tasa.',
    fr: 'Si le promoteur détient un New (or Near-New) Dwelling Exemption Certificate et vous en remet une copie, vous n’avez en général pas besoin de votre propre autorisation pour acheter sur plan un logement neuf dans ce programme, jusqu’à 3 millions d’AUD au total. Au-delà, vous devez la demander et payer les frais.',
    de: 'Hat der Bauträger ein New (or Near-New) Dwelling Exemption Certificate und gibt Ihnen eine Kopie, brauchen Sie in der Regel keine eigene Genehmigung für den Kauf einer neuen Wohnung vom Plan in diesem Projekt, bis insgesamt 3 Mio. AUD. Darüber müssen Sie selbst beantragen und die Gebühr zahlen.',
    nl: 'Heeft de ontwikkelaar een New (or Near-New) Dwelling Exemption Certificate en krijg je een kopie, dan heb je meestal geen eigen toestemming nodig om in dat project een nieuwe woning op plan te kopen, tot 3 miljoen AUD in totaal. Daarboven vraag je zelf aan en betaal je de vergoeding.',
    ru: 'Если у застройщика есть New (or Near-New) Dwelling Exemption Certificate и он даёт вам копию, собственное разрешение на покупку нового жилья на этапе строительства в этом проекте обычно не нужно, до 3 млн AUD в сумме. Сверх этого нужно подать заявку самому и заплатить сбор.',
    zh: '如果开发商持有“新房（或准新房）豁免证书”（New or Near-New Dwelling Exemption Certificate）并向您提供副本，您在该项目购买期房新住宅通常无需自行申请批准，累计上限为 300 万澳元。超出部分须自行申请并缴费。',
    ar: 'إذا كان لدى المطوّر شهادة إعفاء المساكن الجديدة (New or Near-New Dwelling Exemption Certificate) وأعطاك نسخة منها، فلا تحتاج عموماً إلى موافقة خاصة بك لشراء مسكن جديد على الخارطة في ذلك المشروع، حتى 3 ملايين دولار أسترالي إجمالاً. وما فوق ذلك يجب أن تتقدّم بطلبك وتدفع الرسوم.'
  },
  // ---------------------------------------------------------------- Japan
  n_jp_lic: {
    en: 'Selling building lots or buildings as a business needs a real estate brokerage licence from the Minister (MLIT) or the prefecture (Article 3). Ask for the licence number and look it up in MLIT’s search of licensed brokers.',
    es: 'Vender solares o edificios como actividad exige una licencia de intermediación inmobiliaria del Ministerio (MLIT) o de la prefectura (artículo 3). Pide el número de licencia y búscalo en el buscador de agentes con licencia del MLIT.',
    fr: 'Vendre des terrains à bâtir ou des immeubles à titre professionnel exige une licence d’agent immobilier délivrée par le ministre (MLIT) ou la préfecture (article 3). Demandez le numéro de licence et vérifiez-le dans la recherche du MLIT.',
    de: 'Wer gewerblich Baugrundstücke oder Gebäude verkauft, braucht eine Immobilienmaklerlizenz des Ministeriums (MLIT) oder der Präfektur (Artikel 3). Verlangen Sie die Lizenznummer und prüfen Sie sie in der MLIT-Suche lizenzierter Makler.',
    nl: 'Wie beroepsmatig bouwgrond of gebouwen verkoopt, heeft een vastgoedlicentie van de minister (MLIT) of de prefectuur nodig (artikel 3). Vraag het licentienummer en zoek het op in de zoekfunctie van het MLIT.',
    ru: 'Продажа участков или зданий как бизнес требует лицензии на риелторскую деятельность от министра (MLIT) или префектуры (статья 3). Попросите номер лицензии и проверьте его в поиске лицензированных компаний MLIT.',
    zh: '以经营方式出售建筑用地或建筑物，须持有国土交通大臣（MLIT）或都道府县颁发的宅地建物交易业执照（第 3 条）。索取执照编号，并在 MLIT 的持牌业者检索中查询。',
    ar: 'بيع أراضي البناء أو المباني كنشاط تجاري يتطلب ترخيص وساطة عقارية من الوزير (MLIT) أو من المحافظة (المادة 3). اطلب رقم الترخيص وابحث عنه في بحث MLIT عن الوسطاء المرخّصين.'
  },
  n_jp_touki: {
    en: 'The real estate register (touki) shows who owns the land and the mortgages on it. You can read the registered information online through the registry information service.',
    es: 'El registro inmobiliario (touki) muestra quién es propietario del suelo y las hipotecas que lo gravan. Puedes consultar la información registrada en línea con el servicio de información registral.',
    fr: 'Le registre foncier (touki) indique qui est propriétaire du terrain et les hypothèques qui le grèvent. Vous pouvez consulter les informations enregistrées en ligne via le service d’information du registre.',
    de: 'Das Immobilienregister (touki) zeigt, wem das Grundstück gehört und welche Hypotheken darauf lasten. Die eingetragenen Angaben können Sie online über den Registerinformationsdienst abrufen.',
    nl: 'Het vastgoedregister (touki) toont wie eigenaar is van de grond en welke hypotheken erop rusten. Je kunt de ingeschreven gegevens online raadplegen via de registerinformatiedienst.',
    ru: 'Реестр недвижимости (токи) показывает, кому принадлежит земля и какие на ней ипотеки. Зарегистрированные сведения можно посмотреть онлайн через службу информации реестра.',
    zh: '不动产登记（登记簿）显示土地所有人及其上的抵押权。您可通过登记信息提供服务在线查看登记内容。',
    ar: 'يبيّن السجل العقاري (توكي) مالك الأرض والرهون المقيّدة عليها. ويمكنك الاطلاع على البيانات المسجّلة عبر الإنترنت من خلال خدمة معلومات السجل.'
  },
  n_jp_36: {
    en: 'Before construction is finished, a licensed seller may not sign a sale for the building until the required approval has been granted, such as the building confirmation under Article 6 of the Building Standards Act (Article 36). Ask for its number and date.',
    es: 'Antes de terminar la obra, un vendedor con licencia no puede firmar la venta del edificio hasta tener la aprobación exigida, como la confirmación de edificación del artículo 6 de la Ley de Normas de Edificación (artículo 36). Pide su número y fecha.',
    fr: 'Avant la fin des travaux, un vendeur titulaire d’une licence ne peut pas conclure la vente de l’immeuble tant que l’autorisation requise n’est pas accordée, comme la confirmation de construction de l’article 6 de la loi sur les normes de construction (article 36). Demandez son numéro et sa date.',
    de: 'Vor Fertigstellung darf ein lizenzierter Verkäufer keinen Kaufvertrag für das Gebäude schließen, bevor die nötige Genehmigung erteilt ist, etwa die Baubestätigung nach Artikel 6 des Baustandardgesetzes (Artikel 36). Verlangen Sie Nummer und Datum.',
    nl: 'Zolang de bouw niet klaar is, mag een verkoper met licentie geen koop sluiten voor het gebouw voordat de vereiste goedkeuring er is, zoals de bouwbevestiging uit artikel 6 van de Bouwnormenwet (artikel 36). Vraag het nummer en de datum.',
    ru: 'До окончания строительства лицензированный продавец не вправе заключать договор продажи здания, пока не получено требуемое разрешение, например подтверждение строительства по статье 6 Закона о строительных нормах (статья 36). Попросите его номер и дату.',
    zh: '在工程完工前，持牌卖方在取得所需许可（例如《建筑基准法》第 6 条规定的建筑确认）之前，不得签订该建筑物的买卖合同（第 36 条）。请索取其编号和日期。',
    ar: 'قبل انتهاء البناء لا يجوز للبائع المرخّص إبرام بيع المبنى قبل منح الموافقة المطلوبة، مثل تأكيد البناء بموجب المادة 6 من قانون معايير البناء (المادة 36). اطلب رقمها وتاريخها.'
  },
  n_jp_39: {
    en: 'A licensed seller may not take earnest money of more than 20% of the price (Article 39).',
    es: 'Un vendedor con licencia no puede cobrar una señal superior al 20 % del precio (artículo 39).',
    fr: 'Un vendeur titulaire d’une licence ne peut pas recevoir d’arrhes supérieures à 20 % du prix (article 39).',
    de: 'Ein lizenzierter Verkäufer darf kein Handgeld von mehr als 20 % des Preises verlangen (Artikel 39).',
    nl: 'Een verkoper met licentie mag geen aanbetaling (handgeld) van meer dan 20 % van de prijs vragen (artikel 39).',
    ru: 'Лицензированный продавец не вправе брать задаток больше 20 % цены (статья 39).',
    zh: '持牌卖方收取的定金不得超过价款的 20%（第 39 条）。',
    ar: 'لا يجوز للبائع المرخّص أن يأخذ عربوناً يزيد على 20% من السعر (المادة 39).'
  },
  n_jp_41: {
    en: 'For a building not yet finished, a licensed seller may not take payments before handover unless they are secured, for example by a bank guarantee or an insurance contract (Article 41). Small amounts, up to 5% of the price and a ceiling set by Cabinet Order, are exempt.',
    es: 'Para un edificio aún no terminado, un vendedor con licencia no puede cobrar pagos antes de la entrega salvo que estén garantizados, por ejemplo con un aval bancario o un seguro (artículo 41). Quedan exentas las cantidades pequeñas, hasta el 5 % del precio y un tope fijado por orden del Gabinete.',
    fr: 'Pour un immeuble pas encore achevé, un vendeur titulaire d’une licence ne peut pas recevoir de paiements avant la livraison sans les garantir, par exemple par une garantie bancaire ou une assurance (article 41). Les petits montants, jusqu’à 5 % du prix et un plafond fixé par ordonnance, en sont exemptés.',
    de: 'Bei einem noch nicht fertigen Gebäude darf ein lizenzierter Verkäufer vor der Übergabe nur abgesicherte Zahlungen annehmen, etwa per Bankgarantie oder Versicherung (Artikel 41). Kleine Beträge bis 5 % des Preises und einer per Kabinettsverordnung festgelegten Obergrenze sind ausgenommen.',
    nl: 'Voor een gebouw dat nog niet af is, mag een verkoper met licentie voor de oplevering alleen gedekte betalingen aannemen, bijvoorbeeld met een bankgarantie of een verzekering (artikel 41). Kleine bedragen, tot 5 % van de prijs en een plafond uit een kabinetsbesluit, zijn vrijgesteld.',
    ru: 'За ещё не достроенное здание лицензированный продавец не вправе брать платежи до передачи без обеспечения, например банковской гарантии или страхового договора (статья 41). Небольшие суммы, до 5 % цены и в пределах лимита, установленного указом кабинета, освобождены.',
    zh: '对于尚未竣工的建筑物，持牌卖方在交房前收取款项必须采取保全措施，例如银行担保或保险合同（第 41 条）。不超过价款 5% 且不超过内阁令所定上限的小额款项除外。',
    ar: 'بالنسبة لمبنى لم يكتمل بعد، لا يجوز للبائع المرخّص أن يقبض دفعات قبل التسليم ما لم تكن مضمونة، مثلاً بضمان بنكي أو عقد تأمين (المادة 41). وتُستثنى المبالغ الصغيرة حتى 5% من السعر وضمن سقف يحدّده مرسوم مجلس الوزراء.'
  },
  // ---------------------------------------------------------------- United Kingdom
  n_uk_ch: {
    en: 'Look up the developer company on Companies House: its officers, filed accounts, charges (secured lenders) and whether it is active. Many schemes are built by a company set up for that one site.',
    es: 'Busca la empresa promotora en Companies House: sus administradores, cuentas depositadas, cargas (prestamistas con garantía) y si está activa. Muchas promociones las construye una sociedad creada para ese solar.',
    fr: 'Recherchez la société du promoteur sur Companies House : ses dirigeants, ses comptes déposés, ses sûretés (prêteurs garantis) et si elle est active. Beaucoup de programmes sont réalisés par une société créée pour ce seul site.',
    de: 'Suchen Sie die Bauträgergesellschaft bei Companies House: Geschäftsführung, hinterlegte Abschlüsse, Sicherheiten (besicherte Kreditgeber) und ob sie aktiv ist. Viele Projekte baut eine eigens für das Grundstück gegründete Gesellschaft.',
    nl: 'Zoek het bedrijf van de ontwikkelaar op bij Companies House: bestuurders, gedeponeerde jaarrekeningen, zekerheden (geldverstrekkers met onderpand) en of het actief is. Veel projecten worden gebouwd door een bedrijf dat alleen voor die locatie is opgericht.',
    ru: 'Найдите компанию застройщика в Companies House: директора, поданная отчётность, обременения (залоговые кредиторы) и действует ли она. Многие проекты строит компания, созданная под один участок.',
    zh: '在 Companies House 查询开发公司：其高管、已提交的账目、押记（有担保的贷款人）以及是否仍在经营。许多项目由专为该地块设立的公司建造。',
    ar: 'ابحث عن شركة المطوّر في Companies House: مسؤولوها وحساباتها المودَعة والرهون (المقرضون المضمونون) وما إذا كانت قائمة. كثير من المشاريع تبنيها شركة أُسّست لهذا الموقع وحده.'
  },
  n_uk_hmlr: {
    en: 'HM Land Registry holds the title register of the land: who owns it, whether it is freehold or leasehold, and mortgages or restrictions on it. A copy costs a small fee and can be ordered online.',
    es: 'HM Land Registry tiene el registro de la titularidad del suelo: quién es el propietario, si es pleno dominio (freehold) o arrendamiento (leasehold) y las hipotecas o restricciones que tiene. Una copia cuesta una tasa pequeña y se pide en línea.',
    fr: 'HM Land Registry tient le registre des titres du terrain : son propriétaire, s’il s’agit de pleine propriété (freehold) ou de bail (leasehold), et les hypothèques ou restrictions. Une copie coûte un petit montant et se commande en ligne.',
    de: 'HM Land Registry führt das Grundbuch: wem das Land gehört, ob Freehold oder Leasehold, und welche Hypotheken oder Beschränkungen eingetragen sind. Ein Auszug kostet eine kleine Gebühr und lässt sich online bestellen.',
    nl: 'HM Land Registry houdt het eigendomsregister van de grond bij: wie de eigenaar is, of het om freehold of leasehold gaat, en welke hypotheken of beperkingen erop rusten. Een kopie kost een kleine vergoeding en bestel je online.',
    ru: 'HM Land Registry ведёт реестр прав на землю: кто собственник, freehold это или leasehold, какие ипотеки и ограничения. Выписка стоит небольшую плату и заказывается онлайн.',
    zh: '英国土地登记局（HM Land Registry）保存土地的产权登记：所有人、属于永久产权（freehold）还是租赁产权（leasehold），以及抵押或限制。可在线付少量费用获取副本。',
    ar: 'يحتفظ HM Land Registry بسجل ملكية الأرض: من يملكها، وهل هي ملكية حرة (freehold) أم إيجار طويل (leasehold)، والرهون أو القيود عليها. ويمكن طلب نسخة عبر الإنترنت مقابل رسم بسيط.'
  },
  n_uk_plan: {
    en: 'Planning applications, decisions and conditions are on the local council’s planning register; GOV.UK finds the right council from the postcode. Ask for the application number.',
    es: 'Las solicitudes de urbanismo, las decisiones y sus condiciones están en el registro de planeamiento del ayuntamiento (council); GOV.UK encuentra el ayuntamiento por el código postal. Pide el número de solicitud.',
    fr: 'Les demandes d’urbanisme, décisions et conditions figurent au registre d’urbanisme du conseil local ; GOV.UK trouve le bon conseil à partir du code postal. Demandez le numéro de la demande.',
    de: 'Bauanträge, Entscheidungen und Auflagen stehen im Planungsregister der örtlichen Behörde (Council); GOV.UK findet sie über die Postleitzahl. Verlangen Sie die Antragsnummer.',
    nl: 'Bouwaanvragen, besluiten en voorwaarden staan in het planningsregister van de gemeente (council); GOV.UK vindt de juiste gemeente via de postcode. Vraag het aanvraagnummer.',
    ru: 'Заявки на планирование, решения и условия публикуются в реестре местного совета (council); GOV.UK находит нужный совет по почтовому индексу. Попросите номер заявки.',
    zh: '规划申请、决定和条件公布在地方议会的规划登记簿中；GOV.UK 可按邮编找到对应议会。请索取申请编号。',
    ar: 'تُنشر طلبات التخطيط وقراراتها وشروطها في سجل التخطيط لدى المجلس المحلي؛ ويحدّد GOV.UK المجلس الصحيح من الرمز البريدي. اطلب رقم الطلب.'
  },
  n_uk_roe: {
    en: 'An overseas company or other overseas entity that wants to buy, sell or transfer property or land in the UK must first register with Companies House and declare its registrable beneficial owners (Register of Overseas Entities, in force since 1 August 2022).',
    es: 'Una sociedad u otra entidad extranjera que quiera comprar, vender o transmitir inmuebles o suelo en el Reino Unido debe registrarse antes en Companies House y declarar sus titulares reales (Register of Overseas Entities, en vigor desde el 1 de agosto de 2022).',
    fr: 'Une société ou autre entité étrangère qui veut acheter, vendre ou céder un bien ou un terrain au Royaume-Uni doit d’abord s’enregistrer auprès de Companies House et déclarer ses bénéficiaires effectifs (Register of Overseas Entities, en vigueur depuis le 1er août 2022).',
    de: 'Eine ausländische Gesellschaft oder andere ausländische Einheit, die im Vereinigten Königreich Immobilien oder Land kaufen, verkaufen oder übertragen will, muss sich zuerst bei Companies House registrieren und ihre wirtschaftlichen Eigentümer angeben (Register of Overseas Entities, seit 1. August 2022 in Kraft).',
    nl: 'Een buitenlandse vennootschap of andere buitenlandse entiteit die in het Verenigd Koninkrijk vastgoed of grond wil kopen, verkopen of overdragen, moet zich eerst registreren bij Companies House en haar uiteindelijk begunstigden opgeven (Register of Overseas Entities, van kracht sinds 1 augustus 2022).',
    ru: 'Иностранная компания или иная иностранная структура, желающая купить, продать или передать недвижимость или землю в Великобритании, должна сначала зарегистрироваться в Companies House и раскрыть бенефициаров (Register of Overseas Entities, действует с 1 августа 2022 года).',
    zh: '境外公司或其他境外实体如要在英国购买、出售或转让房产或土地，须先在 Companies House 登记并申报其须登记的实益所有人（境外实体登记册，自 2022 年 8 月 1 日起施行）。',
    ar: 'يجب على الشركة الأجنبية أو أي كيان أجنبي آخر يرغب في شراء عقار أو أرض في المملكة المتحدة أو بيعهما أو نقلهما أن يسجّل أولاً لدى Companies House ويصرّح بمالكيه المستفيدين (سجل الكيانات الأجنبية، النافذ منذ 1 أغسطس 2022).'
  },
  n_uk_sdlt: {
    en: 'In England and Northern Ireland, buyers who are not UK resident pay a 2% Stamp Duty Land Tax surcharge on residential property (since 1 April 2021). An individual who meets the residence test within 12 months after the purchase may claim it back.',
    es: 'En Inglaterra e Irlanda del Norte, los compradores no residentes en el Reino Unido pagan un recargo del 2 % del Stamp Duty Land Tax en vivienda (desde el 1 de abril de 2021). Una persona física que cumpla la prueba de residencia en los 12 meses siguientes a la compra puede pedir su devolución.',
    fr: 'En Angleterre et en Irlande du Nord, les acheteurs non résidents au Royaume-Uni paient une surtaxe de 2 % de Stamp Duty Land Tax sur les logements (depuis le 1er avril 2021). Un particulier qui remplit le critère de résidence dans les 12 mois suivant l’achat peut en demander le remboursement.',
    de: 'In England und Nordirland zahlen Käufer ohne Wohnsitz im Vereinigten Königreich bei Wohnimmobilien einen Zuschlag von 2 % Stamp Duty Land Tax (seit 1. April 2021). Wer als Privatperson innerhalb von 12 Monaten nach dem Kauf den Ansässigkeitstest erfüllt, kann ihn zurückfordern.',
    nl: 'In Engeland en Noord-Ierland betalen kopers die niet in het VK wonen een toeslag van 2 % Stamp Duty Land Tax op woningen (sinds 1 april 2021). Een particulier die binnen 12 maanden na de koop aan de verblijfstoets voldoet, kan die terugvragen.',
    ru: 'В Англии и Северной Ирландии покупатели, не являющиеся резидентами Великобритании, платят надбавку 2 % к Stamp Duty Land Tax на жильё (с 1 апреля 2021 года). Физическое лицо, которое станет резидентом по тесту в течение 12 месяцев после покупки, может её вернуть.',
    zh: '在英格兰和北爱尔兰，非英国居民购买住宅需额外缴纳 2% 的印花税（Stamp Duty Land Tax）附加费（自 2021 年 4 月 1 日起）。个人如在购房后 12 个月内满足居住测试，可申请退还。',
    ar: 'في إنجلترا وأيرلندا الشمالية يدفع المشترون غير المقيمين في المملكة المتحدة رسماً إضافياً بنسبة 2% من ضريبة الدمغة على الأراضي (Stamp Duty Land Tax) على العقار السكني (منذ 1 أبريل 2021). ويمكن للفرد الذي يستوفي اختبار الإقامة خلال 12 شهراً من الشراء استرداده.'
  },
  // ---------------------------------------------------------------- Poland
  n_pl_kw: {
    en: 'The land and, later, each unit have a land and mortgage register (księga wieczysta). Ask for its number and read it online in the Ministry of Justice EKW service: owner, mortgages and claims entered for buyers.',
    es: 'El suelo y, después, cada vivienda tienen un registro de la propiedad e hipotecas (księga wieczysta). Pide su número y consúltalo en línea en el servicio EKW del Ministerio de Justicia: propietario, hipotecas y derechos anotados a favor de compradores.',
    fr: 'Le terrain puis chaque logement ont un registre foncier et hypothécaire (księga wieczysta). Demandez son numéro et consultez-le en ligne sur le service EKW du ministère de la Justice : propriétaire, hypothèques et créances inscrites au profit des acheteurs.',
    de: 'Das Grundstück und später jede Einheit haben ein Grund- und Hypothekenbuch (księga wieczysta). Verlangen Sie die Nummer und lesen Sie es online im EKW-Dienst des Justizministeriums: Eigentümer, Hypotheken und eingetragene Ansprüche von Käufern.',
    nl: 'De grond en later elke woning hebben een kadaster- en hypotheekregister (księga wieczysta). Vraag het nummer en lees het online in de EKW-dienst van het ministerie van Justitie: eigenaar, hypotheken en ingeschreven aanspraken van kopers.',
    ru: 'У земли, а затем у каждой квартиры есть поземельная и ипотечная книга (księga wieczysta). Попросите её номер и прочитайте онлайн в сервисе EKW Министерства юстиции: собственник, ипотеки и внесённые требования покупателей.',
    zh: '土地以及之后的每个单元都有土地与抵押登记簿（księga wieczysta）。索取其编号，并在司法部 EKW 服务中在线查阅：所有人、抵押以及为买方登记的请求权。',
    ar: 'للأرض، ثم لكل وحدة لاحقاً، سجل عقاري ورهني (księga wieczysta). اطلب رقمه واقرأه عبر الإنترنت في خدمة EKW التابعة لوزارة العدل: المالك والرهون والمطالبات المقيّدة لصالح المشترين.'
  },
  n_pl_escrow: {
    en: 'A developer must give you one of two protections for your payments: an open or a closed housing escrow account (mieszkaniowy rachunek powierniczy) for the project, and must pay contributions to the Developer Guarantee Fund (Article 6). It must sign the escrow account agreement before it starts selling (Article 7).',
    es: 'El promotor debe darte una de dos protecciones para tus pagos: una cuenta fiduciaria de vivienda abierta o cerrada (mieszkaniowy rachunek powierniczy) para el proyecto, y debe aportar al Fondo de Garantía de Promotores (artículo 6). Debe firmar el contrato de esa cuenta antes de empezar a vender (artículo 7).',
    fr: 'Le promoteur doit vous fournir l’une de deux protections pour vos paiements : un compte fiduciaire de logement ouvert ou fermé (mieszkaniowy rachunek powierniczy) pour le projet, et doit cotiser au Fonds de garantie des promoteurs (article 6). Il doit signer le contrat de ce compte avant de commencer à vendre (article 7).',
    de: 'Der Bauträger muss Ihre Zahlungen auf eine von zwei Arten schützen: über ein offenes oder geschlossenes Wohnungs-Treuhandkonto (mieszkaniowy rachunek powierniczy) für das Projekt, und er muss Beiträge an den Bauträger-Garantiefonds zahlen (Artikel 6). Den Vertrag über das Treuhandkonto muss er vor Verkaufsbeginn schließen (Artikel 7).',
    nl: 'De ontwikkelaar moet je betalingen op een van twee manieren beschermen: met een open of gesloten woningderdenrekening (mieszkaniowy rachunek powierniczy) voor het project, en hij moet bijdragen aan het Garantiefonds voor ontwikkelaars (artikel 6). Het contract voor die rekening moet hij sluiten voordat hij begint te verkopen (artikel 7).',
    ru: 'Застройщик обязан защитить ваши платежи одним из двух способов: открытым или закрытым жилищным эскроу-счётом (mieszkaniowy rachunek powierniczy) по проекту, и платить взносы в Гарантийный фонд застройщиков (статья 6). Договор такого счёта он должен заключить до начала продаж (статья 7).',
    zh: '开发商必须为您的付款提供两种保护之一：为项目开立的开放式或封闭式住房托管账户（mieszkaniowy rachunek powierniczy），并须向开发商担保基金缴费（第 6 条）。开发商须在开始销售前签订该托管账户合同（第 7 条）。',
    ar: 'يجب على المطوّر حماية دفعاتك بإحدى وسيلتين: حساب ضمان سكني مفتوح أو مغلق (mieszkaniowy rachunek powierniczy) للمشروع، وعليه دفع اشتراكات في صندوق ضمان المطوّرين (المادة 6). ويجب أن يوقّع عقد هذا الحساب قبل بدء البيع (المادة 7).'
  },
  n_pl_res: {
    en: 'A reservation agreement may come before the developer agreement. The reservation fee may not exceed 1% of the price stated in the information prospectus, and it counts towards the price (Article 32).',
    es: 'Antes del contrato con el promotor puede firmarse un contrato de reserva. La tasa de reserva no puede superar el 1 % del precio indicado en el folleto informativo, y se descuenta del precio (artículo 32).',
    fr: 'Un contrat de réservation peut précéder le contrat de promotion. Les frais de réservation ne peuvent pas dépasser 1 % du prix indiqué dans le prospectus d’information, et ils s’imputent sur le prix (article 32).',
    de: 'Vor dem Bauträgervertrag kann ein Reservierungsvertrag stehen. Die Reservierungsgebühr darf 1 % des im Informationsprospekt genannten Preises nicht übersteigen und wird auf den Preis angerechnet (Artikel 32).',
    nl: 'Voor de ontwikkelaarsovereenkomst kan een reserveringsovereenkomst komen. De reserveringsvergoeding mag niet hoger zijn dan 1 % van de prijs in het informatieprospectus en wordt verrekend met de prijs (artikel 32).',
    ru: 'До договора с застройщиком может быть заключён договор бронирования. Плата за бронирование не может превышать 1 % цены, указанной в информационном проспекте, и засчитывается в цену (статья 32).',
    zh: '在签订开发商合同前可先签预订合同。预订费不得超过信息说明书所列价格的 1%，并计入房价（第 32 条）。',
    ar: 'يجوز أن يسبق عقدَ المطوّر عقدُ حجز. ولا يجوز أن تتجاوز رسوم الحجز 1% من السعر المذكور في نشرة المعلومات، وتُحتسب من السعر (المادة 32).'
  },
  // ---------------------------------------------------------------- Canada
  n_ca_cc: {
    en: 'Look up the developer company in the corporate register: Corporations Canada for federal corporations, or the register of the province where it was incorporated. Check that it is active and that its name matches the contract.',
    es: 'Busca la empresa promotora en el registro mercantil: Corporations Canada para sociedades federales, o el registro de la provincia donde se constituyó. Comprueba que esté activa y que su nombre coincida con el contrato.',
    fr: 'Recherchez la société du promoteur au registre des sociétés : Corporations Canada pour les sociétés fédérales, ou le registre de la province où elle a été constituée. Vérifiez qu’elle est active et que son nom correspond au contrat.',
    de: 'Suchen Sie die Bauträgergesellschaft im Handelsregister: Corporations Canada für Bundesgesellschaften oder das Register der Provinz, in der sie gegründet wurde. Prüfen Sie, ob sie aktiv ist und der Name zum Vertrag passt.',
    nl: 'Zoek het bedrijf van de ontwikkelaar op in het bedrijvenregister: Corporations Canada voor federale vennootschappen, of het register van de provincie waar het is opgericht. Controleer of het actief is en de naam overeenkomt met het contract.',
    ru: 'Найдите компанию застройщика в реестре: Corporations Canada для федеральных корпораций или реестр провинции, где она зарегистрирована. Проверьте, что она действует и что название совпадает с договором.',
    zh: '在公司登记中查询开发公司：联邦公司查 Corporations Canada，省级公司查其注册省份的登记处。核实其是否仍在经营，名称是否与合同一致。',
    ar: 'ابحث عن شركة المطوّر في سجل الشركات: Corporations Canada للشركات الاتحادية، أو سجل المقاطعة التي أُسّست فيها. تحقّق من أنها قائمة وأن اسمها يطابق العقد.'
  },
  n_ca_ban: {
    en: 'Since 1 January 2023 a non-Canadian may not buy residential property in Canada, directly or indirectly, unless an exception applies, for example certain temporary residents and protected persons (section 4 of the Act).',
    es: 'Desde el 1 de enero de 2023, una persona no canadiense no puede comprar vivienda en Canadá, directa ni indirectamente, salvo que se aplique una excepción, por ejemplo ciertos residentes temporales y personas protegidas (artículo 4 de la ley).',
    fr: 'Depuis le 1er janvier 2023, un non-Canadien ne peut pas acheter d’immeuble résidentiel au Canada, directement ou indirectement, sauf exception, par exemple certains résidents temporaires et personnes protégées (article 4 de la loi).',
    de: 'Seit dem 1. Januar 2023 dürfen Nicht-Kanadier in Kanada weder direkt noch indirekt Wohnimmobilien kaufen, außer es greift eine Ausnahme, etwa für bestimmte befristet Aufenthaltsberechtigte und Schutzberechtigte (Abschnitt 4 des Gesetzes).',
    nl: 'Sinds 1 januari 2023 mag een niet-Canadees in Canada geen woonvastgoed kopen, direct of indirect, tenzij een uitzondering geldt, bijvoorbeeld voor bepaalde tijdelijke inwoners en beschermde personen (artikel 4 van de wet).',
    ru: 'С 1 января 2023 года лицам, не являющимся канадцами, запрещено покупать жилую недвижимость в Канаде прямо или косвенно, если не действует исключение, например для некоторых временных резидентов и лиц под защитой (статья 4 закона).',
    zh: '自 2023 年 1 月 1 日起，非加拿大人不得直接或间接购买加拿大住宅物业，除非适用例外情形，例如部分临时居民和受保护人士（该法第 4 条）。',
    ar: 'منذ 1 يناير 2023 لا يجوز لغير الكندي شراء عقار سكني في كندا بشكل مباشر أو غير مباشر، ما لم ينطبق استثناء، مثل بعض المقيمين المؤقتين والأشخاص المحميين (المادة 4 من القانون).'
  },
  n_ca_cma: {
    en: 'The prohibition covers property in census metropolitan areas and census agglomerations; property outside them is excluded by the Regulations (section 3). Both texts were current to 19 October 2026 when we read them.',
    es: 'La prohibición cubre los inmuebles situados en áreas metropolitanas y aglomeraciones censales; los que están fuera quedan excluidos por el reglamento (artículo 3). Ambos textos estaban actualizados al 19 de octubre de 2026 cuando los leímos.',
    fr: 'L’interdiction vise les immeubles situés dans les régions métropolitaines et agglomérations de recensement ; ceux situés ailleurs sont exclus par le règlement (article 3). Les deux textes étaient à jour au 19 octobre 2026 lors de notre lecture.',
    de: 'Das Verbot gilt für Immobilien in Ballungsräumen und Agglomerationen im Sinne der Volkszählung; Immobilien außerhalb sind durch die Verordnung ausgenommen (Abschnitt 3). Beide Texte waren beim Lesen auf dem Stand vom 19. Oktober 2026.',
    nl: 'Het verbod geldt voor vastgoed in grootstedelijke gebieden en agglomeraties volgens de volkstelling; vastgoed daarbuiten is uitgezonderd door het besluit (artikel 3). Beide teksten waren bij lezing bijgewerkt tot 19 oktober 2026.',
    ru: 'Запрет распространяется на недвижимость в переписных метрополитенских районах и агломерациях; объекты за их пределами исключены регламентом (статья 3). Оба текста были актуальны на 19 октября 2026 года, когда мы их читали.',
    zh: '该禁令适用于人口普查都市区和人口普查聚居区内的物业；其范围以外的物业由条例排除（第 3 条）。我们阅读时，两份文本均更新至 2026 年 10 月 19 日。',
    ar: 'يشمل الحظر العقارات الواقعة في المناطق الحضرية الكبرى والتجمعات الإحصائية؛ أما العقارات خارجها فتستثنيها اللائحة (المادة 3). وكان النصّان محدّثين حتى 19 أكتوبر 2026 عند قراءتنا لهما.'
  }
};

// item 28 (n29h2): printable questions for the developer, one per step, on every guide (8 languages)
export const BS29 = {
  en: { desc2: 'Off-plan {in}: what to check on the company, land, permit, deposit and handover date, with official sources and {n} projects we track.', qs_h: 'Questions to ask the developer {in}', qs_p: 'Print this list and take it to the sales office or send it by email. Write the answer and the document number next to each question, then check it with the source listed.', qs_print: 'Print only these questions', qs_ans: 'Answer and document number:', qs_src: 'Check with:',
    qq_company: 'What is the full legal name and registration number of the company that will sign my contract, and does it own the land or hold the approvals?', qq_land: 'What exactly will I own (freehold, leasehold or a right of use), and can you give me the official registry extract for the land?', qq_permit: 'What is the permit or approval number, its date and the authority that issued it?', qq_money: 'Into which account do my payments go, and what protects them (escrow, bank guarantee or insurance) if the project stops?', qq_sale: 'How is my purchase recorded before completion, and what does the contract say about delays, changes and refunds?', qq_date: 'What is the handover date in the contract, has it changed before, and how did your earlier projects keep their dates?' },
  es: { desc2: 'Sobre plano {in}: qué comprobar de la empresa, el suelo, la licencia, los pagos y la entrega, con fuentes oficiales y {n} proyectos.', qs_h: 'Preguntas para el promotor {in}', qs_p: 'Imprime esta lista y llévala a la oficina de ventas o envíala por correo. Anota la respuesta y el número de documento junto a cada pregunta y compruébalo con la fuente indicada.', qs_print: 'Imprimir solo estas preguntas', qs_ans: 'Respuesta y número de documento:', qs_src: 'Comprobar en:',
    qq_company: '¿Cuál es el nombre legal completo y el número de registro de la empresa que firmará mi contrato, y es la dueña del suelo o la titular de las licencias?', qq_land: '¿Qué tendré exactamente (pleno dominio, arrendamiento o derecho de uso) y pueden darme la nota oficial del registro del suelo?', qq_permit: '¿Cuál es el número de la licencia o aprobación, su fecha y la autoridad que la emitió?', qq_money: '¿A qué cuenta van mis pagos y qué los protege (cuenta de garantía, aval bancario o seguro) si el proyecto se para?', qq_sale: '¿Cómo queda registrada mi compra antes de terminar la obra y qué dice el contrato sobre retrasos, cambios y devoluciones?', qq_date: '¿Cuál es la fecha de entrega del contrato, ha cambiado antes y cómo cumplieron sus fechas sus proyectos anteriores?' },
  fr: { desc2: 'Sur plan {in} : que vérifier sur la société, le terrain, le permis, les paiements et la livraison, avec sources officielles et {n} projets.', qs_h: 'Questions à poser au promoteur {in}', qs_p: 'Imprimez cette liste et apportez-la au bureau de vente ou envoyez-la par e-mail. Notez la réponse et le numéro du document à côté de chaque question, puis vérifiez-le auprès de la source indiquée.', qs_print: 'Imprimer seulement ces questions', qs_ans: 'Réponse et numéro du document :', qs_src: 'À vérifier sur :',
    qq_company: 'Quel est le nom légal complet et le numéro d’immatriculation de la société qui signera mon contrat, et est-elle propriétaire du terrain ou titulaire des autorisations ?', qq_land: 'Que posséderai-je exactement (pleine propriété, bail ou droit d’usage), et pouvez-vous me fournir l’extrait officiel du registre foncier ?', qq_permit: 'Quel est le numéro du permis ou de l’autorisation, sa date et l’autorité qui l’a délivré ?', qq_money: 'Sur quel compte vont mes paiements et qu’est-ce qui les protège (séquestre, garantie bancaire ou assurance) si le projet s’arrête ?', qq_sale: 'Comment mon achat est-il enregistré avant l’achèvement, et que prévoit le contrat en cas de retard, de modification ou de remboursement ?', qq_date: 'Quelle est la date de livraison du contrat, a-t-elle déjà changé, et vos projets précédents ont-ils tenu leurs dates ?' },
  de: { desc2: 'Off-Plan kaufen {in}: Firma, Grundstück, Genehmigung, Zahlungen und Übergabe prüfen, mit amtlichen Quellen und {n} verfolgten Projekten.', qs_h: 'Fragen an den Bauträger {in}', qs_p: 'Drucken Sie diese Liste aus und nehmen Sie sie ins Verkaufsbüro mit oder senden Sie sie per E-Mail. Notieren Sie die Antwort und die Dokumentnummer neben jeder Frage und prüfen Sie sie bei der angegebenen Quelle.', qs_print: 'Nur diese Fragen drucken', qs_ans: 'Antwort und Dokumentnummer:', qs_src: 'Prüfen bei:',
    qq_company: 'Wie lauten der vollständige Firmenname und die Registernummer der Gesellschaft, die meinen Vertrag unterschreibt, und gehört ihr das Grundstück oder hält sie die Genehmigungen?', qq_land: 'Was genau werde ich besitzen (Eigentum, Pacht oder Nutzungsrecht), und können Sie mir den amtlichen Registerauszug des Grundstücks geben?', qq_permit: 'Wie lauten Nummer und Datum der Genehmigung, und welche Behörde hat sie erteilt?', qq_money: 'Auf welches Konto gehen meine Zahlungen, und was schützt sie (Treuhandkonto, Bankgarantie oder Versicherung), wenn das Projekt stoppt?', qq_sale: 'Wie wird mein Kauf vor der Fertigstellung erfasst, und was sagt der Vertrag zu Verzögerungen, Änderungen und Rückzahlungen?', qq_date: 'Welcher Übergabetermin steht im Vertrag, hat er sich schon geändert, und haben Ihre früheren Projekte ihre Termine gehalten?' },
  nl: { desc2: 'Off-plan {in}: wat u controleert over bedrijf, grond, vergunning, betalingen en oplevering, met officiële bronnen en {n} projecten.', qs_h: 'Vragen aan de ontwikkelaar {in}', qs_p: 'Print deze lijst en neem hem mee naar het verkoopkantoor of stuur hem per e-mail. Noteer bij elke vraag het antwoord en het documentnummer en controleer het bij de genoemde bron.', qs_print: 'Alleen deze vragen printen', qs_ans: 'Antwoord en documentnummer:', qs_src: 'Controleren bij:',
    qq_company: 'Wat is de volledige juridische naam en het registratienummer van het bedrijf dat mijn contract tekent, en is het eigenaar van de grond of houder van de vergunningen?', qq_land: 'Wat krijg ik precies in eigendom (volle eigendom, erfpacht of gebruiksrecht), en kunt u mij het officiële kadasteruittreksel van de grond geven?', qq_permit: 'Wat is het nummer van de vergunning of goedkeuring, de datum en de instantie die haar heeft afgegeven?', qq_money: 'Op welke rekening komen mijn betalingen en wat beschermt ze (derdenrekening, bankgarantie of verzekering) als het project stopt?', qq_sale: 'Hoe wordt mijn koop vastgelegd voor de oplevering, en wat zegt het contract over vertraging, wijzigingen en terugbetaling?', qq_date: 'Welke opleverdatum staat in het contract, is die al eens veranderd, en hebben uw eerdere projecten hun data gehaald?' },
  ru: { desc2: 'Новостройка {in}: что проверить о компании, земле, разрешении, платежах и сроке сдачи, с официальными источниками и {n} проектами.', qs_h: 'Вопросы застройщику {in}', qs_p: 'Распечатайте этот список и возьмите в офис продаж или отправьте по почте. Запишите ответ и номер документа рядом с каждым вопросом и проверьте по указанному источнику.', qs_print: 'Печатать только эти вопросы', qs_ans: 'Ответ и номер документа:', qs_src: 'Проверить:',
    qq_company: 'Каково полное юридическое название и регистрационный номер компании, которая подпишет мой договор, и владеет ли она землёй или разрешениями?', qq_land: 'Что именно я получу (собственность, аренду или право пользования) и можете ли вы дать официальную выписку из реестра на землю?', qq_permit: 'Каков номер разрешения или согласования, его дата и какой орган его выдал?', qq_money: 'На какой счёт идут мои платежи и что их защищает (эскроу, банковская гарантия или страховка), если проект остановится?', qq_sale: 'Как фиксируется моя покупка до завершения строительства и что договор говорит о задержках, изменениях и возвратах?', qq_date: 'Какая дата передачи указана в договоре, менялась ли она раньше и соблюдали ли сроки ваши прежние проекты?' },
  zh: { desc2: '{in}购买期房：核实公司、土地、许可、付款和交房日期，附官方来源和我们跟踪的 {n} 个项目。', qs_h: '向开发商提出的问题（{in}）', qs_p: '打印此清单带到售楼处，或通过电子邮件发送。在每个问题旁写下答复和文件编号，再到所列来源核实。', qs_print: '只打印这些问题', qs_ans: '答复和文件编号：', qs_src: '核实来源：',
    qq_company: '将与我签约的公司的完整法定名称和注册号是什么？该公司是否拥有土地或持有许可？', qq_land: '我究竟将拥有什么（永久产权、租赁权还是使用权）？能否提供土地的官方登记摘录？', qq_permit: '许可或批准的编号、日期和签发机关是什么？', qq_money: '我的付款进入哪个账户？如果项目停工，用什么保护（托管、银行担保或保险）？', qq_sale: '竣工前我的购买如何登记？合同对延期、变更和退款有何规定？', qq_date: '合同中的交房日期是什么？以前改过吗？贵公司以往项目是否按期交房？' },
  ar: { desc2: 'الشراء على الخارطة {in}: ما الذي تتحقق منه في الشركة والأرض والترخيص والدفعات والتسليم، مع مصادر رسمية و{n} مشروعاً.', qs_h: 'أسئلة للمطوّر {in}', qs_p: 'اطبع هذه القائمة وخذها إلى مكتب المبيعات أو أرسلها بالبريد الإلكتروني. اكتب الجواب ورقم المستند بجانب كل سؤال، ثم تحقّق منه لدى المصدر المذكور.', qs_print: 'اطبع هذه الأسئلة فقط', qs_ans: 'الجواب ورقم المستند:', qs_src: 'تحقّق لدى:',
    qq_company: 'ما الاسم القانوني الكامل ورقم تسجيل الشركة التي ستوقّع عقدي، وهل تملك الأرض أو تحمل الموافقات؟', qq_land: 'ما الذي سأملكه بالضبط (ملكية حرة أو إيجار طويل أو حق انتفاع)، وهل يمكنكم إعطائي المستخرج الرسمي من سجل الأرض؟', qq_permit: 'ما رقم الترخيص أو الموافقة وتاريخه والجهة التي أصدرته؟', qq_money: 'إلى أي حساب تذهب دفعاتي، وما الذي يحميها (حساب ضمان أو ضمان بنكي أو تأمين) إذا توقّف المشروع؟', qq_sale: 'كيف يُسجَّل شرائي قبل الإنجاز، وماذا يقول العقد عن التأخير والتغييرات والاسترداد؟', qq_date: 'ما موعد التسليم في العقد، وهل تغيّر من قبل، وهل التزمت مشاريعكم السابقة بمواعيدها؟' }
};
