// kolaboro.com batch 9 (agent b9a, 6 Nov 2026): follow and find named projects. No paid AI anywhere in this file.
//   GET  /api/v1/search-index                  compact index of every named project and developer (instant search on /projects/ and
//                                              in the header search palette, 8 languages); ETag + CORS
//   GET  /api/v1/projects                      every named project: slug, id, name, URLs (public, no key)
//   GET  /api/v1/projects/<slug>               named facts of one project as JSON (public, no key): ETag/If-None-Match, CORS,
//                                              cache headers, rate limit 120/min per IP. Documented in /docs/api/openapi.json
//   GET  /api/v1/developers/<slug>             one developer and its named projects (same rules)
//   GET  /projects/<slug>/feed.atom|feed.json  "follow changes": dated changes on record for a project (Atom 1.0 / JSON Feed 1.1)
//   GET  /developers/<slug>/feed.atom|feed.json   the same for all projects of a developer
//   POST /api/v1/watch {project, email}        "Watch this project": stores an email watch through the existing double opt-in path
//                                              (RPC kolaboro_follow: kolaboro_watch row + confirmation email in kolaboro_outbox)
// Facts come from the same data as the named pages (kbx_named.js data()); Sumba projects are never named (conflict of interest),
// projects not yet reviewed carry no score, checks or claim counts. The UI parts (watch box, search box, feed links) are exported
// for kbx_named.js.

import { t26 } from './kbx_u26.js';
import { E as E27 } from './kbx_e27_i18n.js';   // n27e: free PDF report offered in the watch box
const ORIGIN = 'https://kolaboro.com';
const LANGS9 = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = lang => lang === 'en' ? '' : '/' + lang;

// ------------------------------------------------------------------------------------------------ UI strings (8 languages)
const S = {
  en: { w_h: 'Watch this project', w_txt: 'One email when what is published about {n} changes: handover date, prices, documents or register results.', w_btn: 'Watch this project', w_as: 'Email: {e}', w_change: 'Use another email', w_email: 'Your email', w_go: 'Watch',
    w_sent: 'Almost done: we sent a confirmation link to {e}. Open it to start watching.', w_ok: 'You are watching {n}. We email you when something changes.', w_bad: 'Add a valid email address.', w_err: 'Could not save right now. Try again in a minute.', w_busy: 'Too many requests from this connection. Try again later.',
    w_note: 'We send a link to confirm first. Every email has a link to stop.', f_lbl: 'Follow changes in a feed reader:', sx_lbl: 'Search projects and developers', sx_ph: 'Project, developer, market or id (BALI-014)…', sx_chk: 'Not tracked yet? Run the free X-ray on it', sx_none: 'Nothing matches “{q}”.', sx_dev: 'Developer', sx_k: '{k} projects', sx_k1: '1 project', sx_cnt: '{p} projects and {d} developers', sx_res: '{k} results' },
  es: { w_h: 'Seguir este proyecto', w_txt: 'Un email cuando cambie lo publicado sobre {n}: fecha de entrega, precios, documentos o resultados de registros.', w_btn: 'Seguir este proyecto', w_as: 'Email: {e}', w_change: 'Usar otro email', w_email: 'Tu email', w_go: 'Seguir',
    w_sent: 'Casi listo: hemos enviado un enlace de confirmación a {e}. Ábrelo para empezar a seguirlo.', w_ok: 'Sigues {n}. Te escribimos cuando algo cambie.', w_bad: 'Escribe un email válido.', w_err: 'No se pudo guardar ahora. Inténtalo en un minuto.', w_busy: 'Demasiadas solicitudes desde esta conexión. Inténtalo más tarde.',
    w_note: 'Primero enviamos un enlace para confirmar. Cada email incluye un enlace para darte de baja.', f_lbl: 'Sigue los cambios en un lector de feeds:', sx_lbl: 'Buscar proyectos y promotoras', sx_ph: 'Proyecto, promotora, mercado o id (BALI-014)…', sx_chk: '¿Aún no lo seguimos? Pásale la radiografía gratuita', sx_none: 'Nada coincide con «{q}».', sx_dev: 'Promotora', sx_k: '{k} proyectos', sx_k1: '1 proyecto', sx_cnt: '{p} proyectos y {d} promotoras', sx_res: '{k} resultados' },
  de: { w_h: 'Dieses Projekt beobachten', w_txt: 'Eine E-Mail, wenn sich ändert, was über {n} veröffentlicht ist: Übergabetermin, Preise, Dokumente oder Registerergebnisse.', w_btn: 'Dieses Projekt beobachten', w_as: 'E-Mail: {e}', w_change: 'Andere E-Mail verwenden', w_email: 'Ihre E-Mail', w_go: 'Beobachten',
    w_sent: 'Fast fertig: Wir haben einen Bestätigungslink an {e} gesendet. Öffnen Sie ihn, um die Beobachtung zu starten.', w_ok: 'Sie beobachten {n}. Wir schreiben Ihnen, wenn sich etwas ändert.', w_bad: 'Bitte eine gültige E-Mail-Adresse eingeben.', w_err: 'Speichern gerade nicht möglich. Bitte in einer Minute erneut versuchen.', w_busy: 'Zu viele Anfragen von dieser Verbindung. Bitte später erneut versuchen.',
    w_note: 'Wir senden zuerst einen Link zur Bestätigung. Jede E-Mail enthält einen Abmeldelink.', f_lbl: 'Änderungen im Feedreader verfolgen:', sx_lbl: 'Projekte und Bauträger suchen', sx_ph: 'Projekt, Bauträger, Markt oder ID (BALI-014)…', sx_chk: 'Noch nicht erfasst? Kostenlosen Schnellcheck starten', sx_none: 'Keine Treffer für „{q}“.', sx_dev: 'Bauträger', sx_k: '{k} Projekte', sx_k1: '1 Projekt', sx_cnt: '{p} Projekte und {d} Bauträger', sx_res: '{k} Treffer' },
  fr: { w_h: 'Suivre ce projet', w_txt: 'Un e-mail quand ce qui est publié sur {n} change : date de livraison, prix, documents ou résultats des registres.', w_btn: 'Suivre ce projet', w_as: 'E-mail : {e}', w_change: 'Utiliser un autre e-mail', w_email: 'Votre e-mail', w_go: 'Suivre',
    w_sent: 'Presque fini : nous avons envoyé un lien de confirmation à {e}. Ouvrez-le pour commencer le suivi.', w_ok: 'Vous suivez {n}. Nous vous écrivons quand quelque chose change.', w_bad: 'Saisissez une adresse e-mail valide.', w_err: 'Enregistrement impossible pour le moment. Réessayez dans une minute.', w_busy: 'Trop de demandes depuis cette connexion. Réessayez plus tard.',
    w_note: 'Nous envoyons d’abord un lien de confirmation. Chaque e-mail contient un lien de désinscription.', f_lbl: 'Suivre les changements dans un lecteur de flux :', sx_lbl: 'Rechercher des projets et des promoteurs', sx_ph: 'Projet, promoteur, marché ou identifiant (BALI-014)…', sx_chk: 'Pas encore suivi ? Lancez la radiographie gratuite', sx_none: 'Aucun résultat pour « {q} ».', sx_dev: 'Promoteur', sx_k: '{k} projets', sx_k1: '1 projet', sx_cnt: '{p} projets et {d} promoteurs', sx_res: '{k} résultats' },
  nl: { w_h: 'Dit project volgen', w_txt: 'Eén e-mail wanneer verandert wat over {n} is gepubliceerd: opleverdatum, prijzen, documenten of registerresultaten.', w_btn: 'Dit project volgen', w_as: 'E-mail: {e}', w_change: 'Ander e-mailadres gebruiken', w_email: 'Uw e-mail', w_go: 'Volgen',
    w_sent: 'Bijna klaar: we hebben een bevestigingslink naar {e} gestuurd. Open die om het volgen te starten.', w_ok: 'U volgt {n}. We mailen u wanneer er iets verandert.', w_bad: 'Vul een geldig e-mailadres in.', w_err: 'Opslaan lukt nu niet. Probeer het over een minuut opnieuw.', w_busy: 'Te veel verzoeken vanaf deze verbinding. Probeer het later opnieuw.',
    w_note: 'We sturen eerst een link om te bevestigen. Elke e-mail bevat een link om te stoppen.', f_lbl: 'Volg wijzigingen in een feedreader:', sx_lbl: 'Zoek projecten en ontwikkelaars', sx_ph: 'Project, ontwikkelaar, markt of id (BALI-014)…', sx_chk: 'Nog niet gevolgd? Doe de gratis scan', sx_none: 'Niets gevonden voor ‘{q}’.', sx_dev: 'Ontwikkelaar', sx_k: '{k} projecten', sx_k1: '1 project', sx_cnt: '{p} projecten en {d} ontwikkelaars', sx_res: '{k} resultaten' },
  ru: { w_h: 'Следить за проектом', w_txt: 'Одно письмо, когда меняется опубликованная информация о {n}: срок сдачи, цены, документы или данные реестров.', w_btn: 'Следить за проектом', w_as: 'Email: {e}', w_change: 'Другой email', w_email: 'Ваш email', w_go: 'Следить',
    w_sent: 'Почти готово: мы отправили ссылку для подтверждения на {e}. Откройте её, чтобы начать отслеживание.', w_ok: 'Вы следите за {n}. Мы напишем, когда что-то изменится.', w_bad: 'Укажите корректный email.', w_err: 'Сейчас не удалось сохранить. Попробуйте через минуту.', w_busy: 'Слишком много запросов с этого подключения. Попробуйте позже.',
    w_note: 'Сначала мы отправим ссылку для подтверждения. В каждом письме есть ссылка для отписки.', f_lbl: 'Следить за изменениями в RSS-ридере:', sx_lbl: 'Поиск проектов и застройщиков', sx_ph: 'Проект, застройщик, рынок или ID (BALI-014)…', sx_chk: 'Ещё не отслеживаем? Запустите бесплатную проверку', sx_none: 'Ничего не найдено по запросу «{q}».', sx_dev: 'Застройщик', sx_k: 'проектов: {k}', sx_k1: 'проектов: 1', sx_cnt: 'проектов: {p}, застройщиков: {d}', sx_res: 'результатов: {k}' },
  zh: { w_h: '关注此项目', w_txt: '当 {n} 的公开信息发生变化时（交付日期、价格、文件或登记结果），我们会给您发一封邮件。', w_btn: '关注此项目', w_as: '邮箱：{e}', w_change: '使用其他邮箱', w_email: '您的邮箱', w_go: '关注',
    w_sent: '快完成了：我们已向 {e} 发送确认链接。打开链接即可开始关注。', w_ok: '您已关注 {n}。有变化时我们会通知您。', w_bad: '请输入有效的邮箱地址。', w_err: '暂时无法保存，请一分钟后再试。', w_busy: '此连接的请求过多，请稍后再试。',
    w_note: '我们会先发送确认链接。每封邮件都有退订链接。', f_lbl: '在阅读器中订阅变化：', sx_lbl: '搜索项目和开发商', sx_ph: '项目、开发商、市场或编号（BALI-014）…', sx_chk: '还未收录？免费体检一下', sx_none: '没有与“{q}”匹配的结果。', sx_dev: '开发商', sx_k: '{k} 个项目', sx_k1: '1 个项目', sx_cnt: '{p} 个项目，{d} 家开发商', sx_res: '{k} 个结果' },
  ar: { w_h: 'تابِع هذا المشروع', w_txt: 'رسالة بريد واحدة عندما يتغير ما هو منشور عن {n}: موعد التسليم أو الأسعار أو المستندات أو نتائج السجلات.', w_btn: 'تابِع هذا المشروع', w_as: 'البريد: {e}', w_change: 'استخدم بريدًا آخر', w_email: 'بريدك الإلكتروني', w_go: 'متابعة',
    w_sent: 'اقتربنا: أرسلنا رابط تأكيد إلى {e}. افتحه لبدء المتابعة.', w_ok: 'أنت تتابع {n}. سنراسلك عند حدوث أي تغيير.', w_bad: 'أدخل عنوان بريد إلكتروني صالحًا.', w_err: 'تعذّر الحفظ الآن. حاول مرة أخرى بعد دقيقة.', w_busy: 'طلبات كثيرة من هذا الاتصال. حاول لاحقًا.',
    w_note: 'نرسل أولًا رابطًا للتأكيد. كل رسالة تتضمن رابطًا لإيقاف المتابعة.', f_lbl: 'تابِع التغييرات في قارئ الخلاصات:', sx_lbl: 'ابحث في المشاريع والمطورين', sx_ph: 'مشروع أو مطوّر أو سوق أو رقم (BALI-014)…', sx_chk: 'غير مُتابَع بعد؟ شغّل الفحص المجاني', sx_none: 'لا توجد نتائج لـ «{q}».', sx_dev: 'مطوّر', sx_k: '{k} مشاريع', sx_k1: 'مشروع واحد', sx_cnt: '{p} مشروعًا و{d} مطوّرًا', sx_res: '{k} نتيجة' }
};
const R1 = {"en": "1 result", "es": "1 resultado", "de": "1 Treffer", "fr": "1 résultat", "nl": "1 resultaat", "ru": "результатов: 1", "zh": "1 个结果", "ar": "نتيجة واحدة"};   // n19f: '1 results'
for (const [l, v] of Object.entries(R1)) if (S[l]) S[l].sx_res1 = v;
for (const l of Object.keys(S)) { S[l].w_h = t26(l, 'w_h'); S[l].w_btn = t26(l, 'w_btn'); }   // n26u (13 Nov 2026): the watch box says what it does: an alert when the handover date or the price changes
// n20f (9 Nov 2026): the star that saves a project to the visitor's list (and account when logged in) lived on /p/<ID>/, which now
// redirects to the named page; without it nothing could be saved for the portal's "Saved projects" and "Payments vs progress".
const SV = {"en": ["Save to my list", "Saved to my list", "Saved to your list and your account.", "Saved to your list in this browser.", "Removed from your list.", "Open your dashboard", "Open your list"], "es": ["Guardar en mi lista", "Guardado en mi lista", "Guardado en tu lista y en tu cuenta.", "Guardado en tu lista en este navegador.", "Quitado de tu lista.", "Abrir tu panel", "Abrir tu lista"], "de": ["In meiner Liste speichern", "In meiner Liste gespeichert", "In Ihrer Liste und Ihrem Konto gespeichert.", "In Ihrer Liste in diesem Browser gespeichert.", "Aus Ihrer Liste entfernt.", "Dashboard öffnen", "Liste öffnen"], "fr": ["Enregistrer dans ma liste", "Enregistré dans ma liste", "Enregistré dans votre liste et votre compte.", "Enregistré dans votre liste, dans ce navigateur.", "Retiré de votre liste.", "Ouvrir votre tableau de bord", "Ouvrir votre liste"], "nl": ["Bewaren in mijn lijst", "Bewaard in mijn lijst", "Bewaard in je lijst en je account.", "Bewaard in je lijst in deze browser.", "Verwijderd uit je lijst.", "Open je dashboard", "Open je lijst"], "ru": ["Сохранить в мой список", "Сохранено в моём списке", "Сохранено в вашем списке и аккаунте.", "Сохранено в вашем списке в этом браузере.", "Удалено из вашего списка.", "Открыть панель", "Открыть список"], "zh": ["保存到我的清单", "已保存到我的清单", "已保存到您的清单和账户。", "已保存到此浏览器中的清单。", "已从清单中移除。", "打开我的面板", "打开我的清单"], "ar": ["احفظ في قائمتي", "محفوظ في قائمتي", "حُفظ في قائمتك وفي حسابك.", "حُفظ في قائمتك على هذا المتصفح.", "أُزيل من قائمتك.", "افتح لوحتك", "افتح قائمتك"]};
for (const [l, v] of Object.entries(SV)) if (S[l]) ['s_btn', 's_on', 's_acct', 's_local', 's_off', 's_dash', 's_list'].forEach((k, i) => { S[l][k] = v[i]; });
const t9 = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };

export function feedLinks(lang, path, name) {
  return '<p class="kfeeds"><span>' + esc(t9(lang, 'f_lbl')) + '</span> <a href="' + esc(path) + 'feed.atom" type="application/atom+xml" title="' + esc(name) + ' (Atom)">Atom</a> <a href="' + esc(path) + 'feed.json" type="application/feed+json" title="' + esc(name) + ' (JSON Feed)">JSON Feed</a> <a href="/api/v1' + esc(path.replace(/\/$/, '')) + '" type="application/json">API</a></p>';
}
export function watchBox(lang, id, name, path, snap) {
  const m = { id, ok: t9(lang, 'w_ok', { n: name }), sent: t9(lang, 'w_sent', { e: '%E%' }), bad: t9(lang, 'w_bad'), err: t9(lang, 'w_err'), busy: t9(lang, 'w_busy'), as: t9(lang, 'w_as', { e: '%E%' }) };
  if (snap) Object.assign(m, { snap, s_btn: t9(lang, 's_btn'), s_on: t9(lang, 's_on'), s_acct: t9(lang, 's_acct'), s_local: t9(lang, 's_local'), s_off: t9(lang, 's_off'), s_dash: t9(lang, 's_dash'), s_list: t9(lang, 's_list') });
  return '<div class="kwatch" id="watch" data-kw="' + esc(JSON.stringify(m)) + '"><div class="kw-t"><b>' + esc(t9(lang, 'w_h')) + '</b><p>' + esc(t9(lang, 'w_txt', { n: name })) + '</p></div>' +
    '<div class="kw-a"><button type="button" class="k-btn k-btn--dark kbtn" data-kw-btn>' + esc(t9(lang, 'w_btn')) + '</button>' +
    '<p class="kw-as" data-kw-as hidden><span></span> <button type="button" class="kw-lnk" data-kw-change>' + esc(t9(lang, 'w_change')) + '</button></p>' +
    '<form class="kw-f" novalidate hidden><label for="kw-e">' + esc(t9(lang, 'w_email')) + '</label><div><input id="kw-e" type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@email.com" required>' +
    '<input type="text" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true" class="kw-hp"><button type="submit" class="k-btn k-btn--dark kbtn">' + esc(t9(lang, 'w_go')) + '</button></div></form>' +
    '<p class="kw-out" role="status" aria-live="polite"></p>' + (path.indexOf('/projects/') === 0 ? '<p class="kw-rp">' + esc((E27[lang] || E27.en).of_line.replace('{n}', name)) + ' <a href="' + pre(lang) + esc(path) + 'report/" data-kw-rp hidden>' + esc((E27[lang] || E27.en).of_dl) + '</a></p>' : '') + '<p class="kw-n">' + esc(t9(lang, 'w_note')) + '</p>' +
    (snap ? '<p class="kw-s"><button type="button" class="kw-sb" data-kw-save aria-pressed="false"><span aria-hidden="true">\u2606</span> <span>' + esc(t9(lang, 's_btn')) + '</span></button> <span class="kw-sv" role="status" aria-live="polite"></span></p>' : '') + '</div>' + feedLinks(lang, path, name) + '</div>';
}
export function searchBox(lang, np, nd) {
  const m = { pre: pre(lang), none: t9(lang, 'sx_none', { q: '%Q%' }), chk: t9(lang, 'sx_chk'), dev: t9(lang, 'sx_dev'), k: t9(lang, 'sx_k', { k: '%K%' }), k1: t9(lang, 'sx_k1'), res: t9(lang, 'sx_res', { k: '%K%' }), res1: t9(lang, 'sx_res1'), cnt: t9(lang, 'sx_cnt', { p: np, d: nd }) };
  return '<div class="kx" role="search" data-kx="' + esc(JSON.stringify(m)) + '"><label for="kx-q">' + esc(t9(lang, 'sx_lbl')) + '</label><input id="kx-q" type="search" autocomplete="off" spellcheck="false" placeholder="' + esc(t9(lang, 'sx_ph')) + '" aria-describedby="kx-st" aria-controls="kx-out">' +
    '<p class="kx-st" id="kx-st" aria-live="polite">' + esc(m.cnt) + '</p><ul class="kx-out" id="kx-out" hidden></ul></div>';
}
export const W9CSS = '<style id="kfollow-css">.kwatch{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:8px 24px;margin:18px 0 0;padding:16px 18px;border:2px solid var(--ink);border-radius:18px;background:var(--card,var(--paper))}' +
  '.kw-t p{margin:4px 0 0;color:var(--ink-2);font-size:.95rem}.kw-a .kbtn{margin-top:0!important}.kw-as{margin:8px 0 0;font-size:.88rem;color:var(--ink-2)}.kw-lnk{background:none;border:0;padding:0 2px;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;min-height:32px}' +
  '.kw-f label{display:block;font-size:.85rem;font-weight:700;margin:2px 0 4px}.kw-f div{display:flex;gap:8px;flex-wrap:wrap}.kw-f input[type=email]{flex:1 1 200px;min-width:0;min-height:46px;padding:0 12px;border:1.5px solid var(--line);border-radius:12px;font:inherit;background:var(--paper,#fff);color:var(--ink)}' +
  '.kw-rp{margin:8px 0 0;font-size:.88rem;color:var(--ink-2)}.kw-rp a{display:inline-block;font-weight:700;min-height:32px}' + '.kw-s{margin:10px 0 0;font-size:.88rem;color:var(--ink-2);display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center}.kw-sb{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border:1.5px solid var(--line);border-radius:12px;background:none;color:var(--ink);font:inherit;font-weight:700;cursor:pointer}.kw-sb:hover{border-color:var(--ink)}.kw-sb[aria-pressed=true] span:first-child{color:#B8860B}.kw-sv a{font-weight:700}' +
  '.kw-hp{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);opacity:0;pointer-events:none}.kw-out{margin:8px 0 0;font-weight:700;min-height:1.2em}.kw-out.err{color:#9A2A0A}[data-theme=dark] .kw-out.err{color:#FFC9B8}.kw-n{margin:4px 0 0;font-size:.8rem;color:var(--muted)}' +
  '.kfeeds{grid-column:1/-1;margin:2px 0 0;font-size:.85rem;color:var(--ink-2);display:flex;flex-wrap:wrap;gap:4px 12px;align-items:center}.kfeeds a{font-weight:700}' +
  '.kx{margin:22px 0 0;max-width:760px}.kx label{display:block;font-weight:700;margin:0 0 6px}.kx input{width:100%;box-sizing:border-box;min-height:52px;padding:0 16px;border:2px solid var(--ink);border-radius:14px;font-family:inherit;font-size:1.05rem;background:var(--paper,#fff);color:var(--ink)}' +
  '.kx-st{margin:6px 0 0;font-size:.85rem;color:var(--muted)}.kx-out{list-style:none;margin:8px 0 0;padding:0;border:1px solid var(--line);border-radius:14px;background:var(--card,var(--paper));max-height:60vh;overflow:auto}' +
  '.kx-out li{border-top:1px solid var(--line)}.kx-out li:first-child{border-top:0}.kx-out a{display:block;padding:10px 14px;text-decoration:none;color:var(--ink);min-height:44px;box-sizing:border-box}.kx-out a:hover,.kx-out a:focus{background:var(--line)}.kx-out b{display:block;overflow-wrap:anywhere}.kx-out small{color:var(--muted)}.kx-out .kx-e{padding:12px 14px;color:var(--ink-2)}' +
  '.kx-tag{display:inline-block;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:1px 7px;border-radius:999px;border:1px solid var(--line);margin-inline-end:6px}' +
  '@media(max-width:720px){.kwatch{grid-template-columns:1fr;padding:14px}.kw-a .kbtn{width:100%!important}}</style>';
// client: watch button (one click when the email is known on this device) and instant search on /projects/
export const W9JS = "(function(){function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}" +
  "document.querySelectorAll('[data-kw]').forEach(function(w){var M=JSON.parse(w.getAttribute('data-kw')),b=w.querySelector('[data-kw-btn]'),f=w.querySelector('form'),inp=f.querySelector('input[type=email]'),out=w.querySelector('.kw-out'),as=w.querySelector('[data-kw-as]'),known=ls('kb-follow-email')||ls('kb-desk-email')||'';" +
  "function say(t,bad){out.textContent=t;out.className='kw-out'+(bad?' err':'');}" +
  "var rp=w.querySelector('[data-kw-rp]');function rpo(){if(rp)rp.hidden=false;}if(ls('kb-watch-'+M.id)||ls('kb-follow-email')){rpo();}if(ls('kb-watch-'+M.id)){say(M.ok);b.hidden=true;}" +
  "function showAs(){if(!b.hidden&&known&&/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(known)){as.hidden=false;as.querySelector('span').textContent=M.as.replace('%E%',known);}}showAs();" +
  "function send(em,btn){btn.disabled=true;say('…');fetch('/api/v1/watch',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({project:M.id,email:em,hp:f.hp.value})}).then(function(r){return r.json().then(function(j){j._s=r.status;return j;});}).then(function(j){btn.disabled=false;" +
  "if(j&&j.ok){ls('kb-follow-email',em);known=em;rpo();f.hidden=true;as.hidden=true;b.hidden=true;if(j.confirmed){ls('kb-watch-'+M.id,'1');say(M.ok);}else say(M.sent.replace('%E%',em));try{if(window.kbEvent)kbEvent('named_watch',M.id);}catch(e){}return;}" +
  "say(j&&j.error==='email'?M.bad:j&&(j._s===429||j.error==='busy'||j.error==='rate')?M.busy:M.err,true);if(j&&j.error==='email'){f.hidden=false;b.hidden=true;inp.focus();}}).catch(function(){btn.disabled=false;say(M.err,true);});}" +
  "b.addEventListener('click',function(){if(known&&!as.hidden)send(known,b);else{f.hidden=false;b.hidden=true;inp.focus();}});" +
  "w.querySelector('[data-kw-change]').addEventListener('click',function(){as.hidden=true;f.hidden=false;b.hidden=true;inp.value='';inp.focus();});" +
  "f.addEventListener('submit',function(e){e.preventDefault();var em=inp.value.trim();if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(em)){inp.setAttribute('aria-invalid','true');say(M.bad,true);inp.focus();return;}inp.removeAttribute('aria-invalid');send(em,f.querySelector('button'));});" +
  "var sb=w.querySelector('[data-kw-save]');if(sb&&M.snap){var so=w.querySelector('.kw-sv'),ID=String(M.id).toUpperCase();" +
  "function has(){try{return(JSON.parse(ls('kb_watch')||'[]')||[]).some(function(x){return x&&String(x.id).toUpperCase()===ID;});}catch(e){return false;}}" +
  "function paint(on){sb.setAttribute('aria-pressed',on?'true':'false');sb.children[0].textContent=on?'\\u2605':'\\u2606';sb.children[1].textContent=on?M.s_on:M.s_btn;}paint(has());" +
  "function lib(){return window.KBWatch?Promise.resolve():new Promise(function(ok,no){var s=document.createElement('script');s.src='/watchlist/wl.js?v=bfac98fd';s.onload=function(){ok();};s.onerror=no;document.head.appendChild(s);});}" +
  "sb.addEventListener('click',function(){sb.disabled=true;lib().then(function(){var n=M.snap,on=KBWatch.toggle(ID,{score:n.score,vscore:n.vscore,stage:n.stage,overdue:n.overdue,claims:n.claims,flags:new Array(n.flags||0),history:new Array(n.history||0)});sb.disabled=false;paint(on);var acct=KBWatch.account();so.textContent=(on?(acct?M.s_acct:M.s_local):M.s_off)+' ';var a=document.createElement('a');a.href=acct?'/portal/#saved':'/watchlist/';a.textContent=acct?M.s_dash:M.s_list;so.appendChild(a);try{if(window.kbEvent)kbEvent(on?'named_save':'named_unsave',M.id);}catch(e){}}).catch(function(){sb.disabled=false;});});}" +
  "});" +
  "var X=document.querySelector('[data-kx]');if(!X)return;var M2=JSON.parse(X.getAttribute('data-kx')),q=X.querySelector('input'),st=X.querySelector('.kx-st'),ul=X.querySelector('.kx-out'),L=document.querySelector('[data-kx-lists]'),IX=null,P=null;" +
  "function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^0-9a-z\\u0400-\\u04ff\\u0600-\\u06ff\\u4e00-\\u9fff]+/g,' ').trim();}" +
  "function load(){if(P)return P;P=fetch('/api/v1/search-index').then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(d){IX=[];(d.p||[]).forEach(function(p){IX.push({u:M2.pre+'/projects/'+p[0]+'/',n:p[1],s:[p[2],p[3],[p[7],p[5],p[6]].filter(Boolean).join(', ')].filter(Boolean).join(' · '),h:' '+norm(p.join(' '))+' '+norm(p[2]).replace(/ /g,''),nn:' '+norm(p[1])});});" +
  "(d.d||[]).forEach(function(x){IX.push({u:M2.pre+'/developers/'+x[0]+'/',n:x[1],dev:1,s:(x[2]===1?M2.k1:M2.k.replace('%K%',x[2]))+(x[3]?' · '+x[3]:''),h:' '+norm(x[1]+' '+x[3]),nn:' '+norm(x[1])});});return IX;}).catch(function(){P=null;});return P;}" +
  "function run(){var v=q.value,ws=norm(v).split(' ').filter(Boolean);try{var uu=new URL(location.href);if(v)uu.searchParams.set('q',v);else uu.searchParams.delete('q');history.replaceState(null,'',uu);}catch(e){}" +
  "if(!ws.length){ul.hidden=true;ul.innerHTML='';if(L)L.hidden=false;st.textContent=M2.cnt;return;}load().then(function(){if(!IX||q.value!==v)return;var R=[];" +
  "IX.forEach(function(it){var s=0;for(var i=0;i<ws.length;i++){var w=ws[i],k=it.h.indexOf(w);if(k<0)return;s+=(it.nn.indexOf(' '+w)>=0?30:it.nn.indexOf(w)>=0?16:it.h.charAt(k-1)===' '?8:3);}if(it.dev)s+=2;R.push([s-it.n.length/100,it]);});" +
  "R.sort(function(a,b){return b[0]-a[0];});st.textContent=R.length===1&&M2.res1?M2.res1:M2.res.replace('%K%',R.length);if(L)L.hidden=true;ul.hidden=false;" +
  "ul.innerHTML='';if(!R.length){var e=document.createElement('li');e.className='kx-e';e.textContent=M2.none.replace('%Q%',v);if(M2.chk&&v.trim().length>2){var ca=document.createElement('a');ca.href=M2.pre+'/check/?q='+encodeURIComponent(v.trim());ca.textContent=M2.chk;ca.style.cssText='display:inline;padding:0;min-height:0;text-decoration:underline';e.appendChild(document.createTextNode(' '));e.appendChild(ca);}ul.appendChild(e);return;}" +
  "R.slice(0,40).forEach(function(r){var it=r[1],li=document.createElement('li'),a=document.createElement('a'),b=document.createElement('b'),sm=document.createElement('small');a.href=it.u;if(it.dev){var tg=document.createElement('span');tg.className='kx-tag';tg.textContent=M2.dev;b.appendChild(tg);}b.appendChild(document.createTextNode(it.n));sm.textContent=it.s;a.appendChild(b);a.appendChild(sm);li.appendChild(a);ul.appendChild(li);});});}" +
  "var tm;q.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(run,60);});q.addEventListener('focus',load,{once:true});" +
  "q.addEventListener('keydown',function(e){if(e.key==='Enter'){var a=ul.querySelector('a');if(a&&!ul.hidden){e.preventDefault();location.href=a.href;}}if(e.key==='ArrowDown'){var a2=ul.querySelector('a');if(a2){e.preventDefault();a2.focus();}}});" +
  "ul.addEventListener('keydown',function(e){var li=e.target.closest('li');if(!li)return;if(e.key==='ArrowDown'&&li.nextElementSibling){e.preventDefault();li.nextElementSibling.querySelector('a').focus();}if(e.key==='ArrowUp'){e.preventDefault();var p=li.previousElementSibling;if(p&&p.querySelector('a'))p.querySelector('a').focus();else q.focus();}});" +
  "try{var q0=new URL(location.href).searchParams.get('q');if(q0){q.value=q0;run();}}catch(e){}})();";

// ------------------------------------------------------------------------------------------------ endpoints
export const PATHS9 = /^\/api\/v1\/(?:projects|developers)(?:\/[a-z0-9-]{1,90})?\/?$|^\/api\/v1\/(?:search-index|watch)$|^\/(?:projects|developers)\/[a-z0-9-]{1,90}\/feed\.(?:atom|json)$/;
const RL = new Map();
async function rate(req, ctx, bucket, max) {   // per IP per minute: in-isolate count plus a shared count in the colo cache (same as kbx_e.js)
  const ip = req.headers.get('cf-connecting-ip') || 'unknown', min = Math.floor(Date.now() / 60000), k = bucket + '|' + ip + '|' + min;
  const local = (RL.get(k) || 0) + 1; RL.set(k, local);
  if (RL.size > 5000) for (const key of RL.keys()) if (!key.endsWith('|' + min)) RL.delete(key);
  let shared = 0; const ck = new Request(ORIGIN + '/__rl-b9/' + bucket + '/' + encodeURIComponent(ip) + '/' + min);
  try { const hit = await caches.default.match(ck); if (hit) shared = +(await hit.text()) || 0; } catch (e) {}
  const n = Math.max(local, shared + 1);
  try { const p = caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': 'max-age=120' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
  return { ok: n <= max, remaining: Math.max(0, max - n), retry: 60 - Math.floor(Date.now() / 1000) % 60 };
}
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': 'if-none-match, accept', 'access-control-expose-headers': 'etag, x-ratelimit-limit, x-ratelimit-remaining, retry-after, last-modified', 'access-control-max-age': '86400' };
async function sha16(s) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(d)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join(''); }
async function out(req, body, type, extra, maxAge) {   // body + strong ETag; 304 when If-None-Match matches
  const etag = '"' + await sha16(body) + '"';
  const h = Object.assign({ 'content-type': type, etag, 'cache-control': 'public, max-age=' + (maxAge || 300) + ', stale-while-revalidate=600', vary: 'accept-encoding', 'x-content-type-options': 'nosniff' }, CORS, extra || {});
  const inm = req.headers.get('if-none-match') || '';
  if (inm && inm.split(',').map(s => s.trim().replace(/^W\//, '')).includes(etag)) return new Response(null, { status: 304, headers: h });
  return new Response(req.method === 'HEAD' ? null : body, { status: 200, headers: h });
}
const jerr = (o, s, extra) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, CORS, extra || {}) });
const JT = 'application/json; charset=utf-8';

export async function handle(req, u, env, ctx) {
  const p = u.pathname;
  if (!PATHS9.test(p)) return null;
  if (p === '/api/v1/watch') return watch(req, u, env, ctx);
  if (/^\/api\/v1\/projects\/check\/?$/.test(p)) return null;                         // keyed desk review (kolaboro.js)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const N = await import('./kbx_named.js');
  let ix; try { ix = await N.data(env); } catch (e) { return jerr({ error: 'data_unavailable' }, 503); }
  const fm = p.match(/^\/(projects|developers)\/([a-z0-9-]{1,90})\/feed\.(atom|json)$/);
  if (fm) return feed(req, N, ix, fm[1], fm[2], fm[3]);
  // API: rate limit, then answer
  const rl = await rate(req, ctx, 'api9', 120), rh = { 'x-ratelimit-limit': '120;w=60', 'x-ratelimit-remaining': String(rl.remaining) };
  if (!rl.ok) return jerr({ error: 'rate_limited', limit_per_minute: 120, retry_after_s: rl.retry }, 429, Object.assign(rh, { 'retry-after': String(rl.retry) }));
  // n21e: ?f=ids is the small id -> slug list site.js uses to point /p/<ID>/ links straight at the named page
  if (p === '/api/v1/search-index' && u.searchParams.get('f') === 'ids') { const ids = {}; for (const [id, x] of ix.byId) if (x && x.s) ids[id] = x.s; return out(req, JSON.stringify({ version: 'named-ids-1', ids }), JT, rh, 3600); }
  if (p === '/api/v1/search-index') return out(req, JSON.stringify(searchIndex(N, ix)), JT, rh, 900);
  const m = p.match(/^\/api\/v1\/(projects|developers)(?:\/([a-z0-9-]{1,90}))?\/?$/);
  if (!m[2]) return out(req, JSON.stringify(m[1] === 'projects' ? listProjects(N, ix) : listDevelopers(N, ix)), JT, rh, 900);
  if (m[1] === 'projects') { const x = ix.bySlug.get(m[2]); if (!x) return jerr({ error: 'not_found', note: 'No named project at this slug. List: ' + ORIGIN + '/api/v1/projects' }, 404, rh); return out(req, JSON.stringify(projectJson(N, ix, x)), JT, rh); }
  const dv = ix.devs.get(m[2]); if (!dv) return jerr({ error: 'not_found', note: 'No developer at this slug. List: ' + ORIGIN + '/api/v1/developers' }, 404, rh);
  return out(req, JSON.stringify(developerJson(N, ix, dv)), JT, rh);
}

// ------------------------------------------------------------------------------------------------ search index
let SXI = null;
function searchIndex(N, ix) {
  if (SXI && SXI.ix === ix) return SXI.v;
  const p = ix.P.map(x => [x.s, x.n, x.id, x.dv || '', x.dvs && ix.devs.has(x.dvs) ? x.dvs : '', x.mk || '', x.co || '', x.ar && x.ar !== x.mk ? x.ar : '']);
  const d = [...ix.devs.values()].map(v => [v.s, v.n, v.ids.length, [...new Set(v.ids.map(i => (ix.byId.get(i) || {}).mk).filter(Boolean))].slice(0, 4).join(', ')]);
  const v = { version: 'named-search-1', updated: ix.updated, counts: { projects: p.length, developers: d.length }, fields: { p: ['slug', 'name', 'id', 'developer', 'developer_slug', 'market', 'country', 'area'], d: ['slug', 'name', 'projects', 'markets'] },
    urls: { project: ORIGIN + '/{lang}/projects/{slug}/ (English without /{lang})', developer: ORIGIN + '/{lang}/developers/{slug}/' }, p, d };
  SXI = { ix, v }; return v;
}

// ------------------------------------------------------------------------------------------------ JSON facts
const LANG_URL = (kind, s) => Object.fromEntries(LANGS9.map(l => [l, ORIGIN + pre(l) + '/' + kind + '/' + s + '/']));
const FX_KEYS = ['price_min', 'price_max', 'currency', 'size_min_m2', 'size_max_m2', 'unit_types', 'payment_plan', 'deposit_pct', 'foreign_ownership', 'service_charge', 'brand', 'permit_authority', 'construction_start', 'handover_promised', 'original_handover', 'developer_founded', 'developer_hq', 'developer_company', 'developer_projects_delivered', 'developer_units_delivered', 'listed_or_audited', 'lat', 'lng'];
function projectJson(N, ix, x) {
  const c = ix.caseBy.get(x.id) || {}, rvd = N.reviewed(c), page = N.okHttp(x.url) ? N.fixU(x.url) : null, ho = N.handoverOf(ix, x);
  const fx = {}; for (const k of FX_KEYS) { const v = (x.fx || {})[k]; if (v != null && v !== '' && (typeof v !== 'string' || N.cleanOk(v))) fx[k] = v; }
  const prom = (ix.prom[x.id] || []).map(q => ({ kind: q.k, date: q.d, status: q.st, times_moved: q.mv || 0, months_moved: q.mm || 0, source: q.src === 'page' ? 'developer page' : 'research', first_seen: (q.hist && q.hist[0] && q.hist[0].seen) || q.seen, last_seen: q.seen, page_sha256: q.sha || null,
    history: (q.hist || []).map(h => ({ date: h.d, seen: h.seen })) }));
  const reg = x.rw || c.register || null;
  const srcs = [...new Set([page, N.okHttp(x.du) ? N.fixU(x.du) : null, ...(x.src || []).filter(N.okHttp).map(N.fixU), ...(x.fl || []).map(f => f[1]).filter(N.okHttp)].filter(Boolean))];
  return {
    api: 'kolaboro-named-v1', license: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), attribute "Kolaboro"', rules: 'Facts only, each as published by its source. No opinions or verdicts. Projects not yet reviewed carry no score, checks or claim counts.',
    id: x.id, slug: x.s, name: x.n, developer: x.dv ? { name: x.dv, slug: x.dvs && ix.devs.has(x.dvs) ? x.dvs : null, url: x.dvs && ix.devs.has(x.dvs) ? ORIGIN + '/developers/' + x.dvs + '/' : null, api: x.dvs && ix.devs.has(x.dvs) ? ORIGIN + '/api/v1/developers/' + x.dvs : null } : null,
    location: { area: x.ar || null, market: x.mk, country: x.co }, stage: c.stage || x.st || null, site_status: x.sts || null,
    reviewed: rvd, added: x.ad || null, last_checked: N.lastmod(ix, x),
    published_page: page ? { url: page, host: N.host(page), is_listing_portal: N.isListing(page) } : null,
    permit: { number: x.pn || null, source: x.pn ? ((N.okHttp(x.du) ? N.fixU(x.du) : null) || page) : null, note: x.pn ? null : 'not published' },
    handover: ho ? { date: ho.d, source: page } : null, overdue_months: c.overdue || null,
    promises: prom, published_facts: fx, published_statements: (x.dl || []).filter(N.cleanOk), facts_source: page,
    change_history: (c.history || []).map(h => ({ date: h.d, field: h.f, from: h.from, to: h.to, source: page })),
    hourly_findings: (((ix.find[x.id] || {}).f) || []).slice(0, 20).filter(f => N.cleanOk(f.text)).map(f => ({ at: f.at, text: f.text, page_sha256_prefix: f.fp || null })),
    sealed_copy: x.sha || (c.fp || {}).sha256 ? { date: x.sealed || (c.fp || {}).date || null, sha256: x.sha || (c.fp || {}).sha256, verify: ORIGIN + '/verify' } : null,
    register: reg ? { register: reg.register, item: reg.item, status: reg.status, detail: reg.detail || null, checked: reg.checked, how: ORIGIN + '/registers/' } : null,
    public_reports: (x.fl || []).filter(f => N.okHttp(f[1])).map(f => ({ kind: f[0], url: f[1] })),
    review: rvd ? { score: c.score, max: c.max, verified_score: c.vscore || 0, checks: c.checks || null, verification: c.verified || null, claims: c.claims || null, method: ORIGIN + '/how-we-score' } : null,
    sources: srcs,
    urls: { page: ORIGIN + '/projects/' + x.s + '/', pages: LANG_URL('projects', x.s), feed_atom: ORIGIN + '/projects/' + x.s + '/feed.atom', feed_json: ORIGIN + '/projects/' + x.s + '/feed.json', record: ORIGIN + '/api/open/projects/' + encodeURIComponent(x.id),
      watch: ORIGIN + '/projects/' + x.s + '/#watch', reply: ORIGIN + '/developers/reply/?id=' + encodeURIComponent(x.id), corrections: ORIGIN + '/corrections?id=' + encodeURIComponent(x.id) }
  };
}
function developerJson(N, ix, dv) {
  const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), lm = L.map(x => N.lastmod(ix, x)).sort();
  return { api: 'kolaboro-named-v1', license: 'CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), attribute "Kolaboro"', rules: 'Facts only, each as published by its source. No opinions or verdicts.',
    slug: dv.s, name: dv.n, last_checked: lm[lm.length - 1] || null, markets: [...new Set(L.map(x => x.mk))],
    projects: L.map(x => { const c = ix.caseBy.get(x.id) || {}, ho = N.handoverOf(ix, x); return { id: x.id, slug: x.s, name: x.n, market: x.mk, country: x.co, stage: c.stage || x.st || null, handover: ho ? ho.d : null, permit_number_published: !!x.pn, reviewed: N.reviewed(c), api: ORIGIN + '/api/v1/projects/' + x.s, page: ORIGIN + '/projects/' + x.s + '/' }; }),
    urls: { page: ORIGIN + '/developers/' + dv.s + '/', pages: LANG_URL('developers', dv.s), feed_atom: ORIGIN + '/developers/' + dv.s + '/feed.atom', feed_json: ORIGIN + '/developers/' + dv.s + '/feed.json' } };
}
function listProjects(N, ix) { return { api: 'kolaboro-named-v1', updated: ix.updated, count: ix.P.length, projects: ix.P.map(x => ({ slug: x.s, id: x.id, name: x.n, market: x.mk, api: ORIGIN + '/api/v1/projects/' + x.s })) }; }
function listDevelopers(N, ix) { return { api: 'kolaboro-named-v1', updated: ix.updated, count: ix.devs.size, developers: [...ix.devs.values()].map(v => ({ slug: v.s, name: v.n, projects: v.ids.length, api: ORIGIN + '/api/v1/developers/' + v.s })) }; }

// ------------------------------------------------------------------------------------------------ feeds
function events(N, ix, x) {
  const c = ix.caseBy.get(x.id) || {}, page = N.okHttp(x.url) ? N.fixU(x.url) : null, E = [], base = ORIGIN + '/projects/' + x.s + '/';
  const add = (d, key, title, text, src, anchor) => { const i = N.iso(d); if (!i || !N.cleanOk(title) || (text && !N.cleanOk(text))) return; let dt = i + 'T00:00:00Z'; if (/T\d/.test(String(d))) { const z = new Date(d); if (!isNaN(z)) dt = z.toISOString().replace(/\.\d{3}Z$/, 'Z'); } E.push({ d: dt, key: x.id + '/' + key, title, text: text || title, src: src || page, url: base + (anchor ? '#' + anchor : '') }); };
  if (x.ad) add(x.ad, 'added', 'Added to the projects Kolaboro tracks', 'Kolaboro started tracking ' + x.n + ' (' + [x.ar, x.mk, x.co].filter(Boolean).join(', ') + ').', page, '');
  for (const h of c.history || []) add(h.d, 'change/' + h.d + '/' + String(h.f).replace(/\W+/g, '-'), 'Developer page changed: ' + h.f, 'On the developer page, "' + h.f + '" changed from ' + fv(h.from) + ' to ' + fv(h.to) + '.', page, 'history');
  for (const q of ix.prom[x.id] || []) {
    const kind = N.tr('en', 'pk_' + q.k), H = (q.hist || []).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
    H.forEach((h, i) => {
      if (i === 0) add(h.seen, 'promise/' + q.k + '/' + h.seen, kind + ' date on record: ' + N.fd(h.d, 'en'), kind + ' recorded as ' + N.fd(h.d, 'en') + ' (' + (h.src === 'page' ? 'developer page' : 'our research') + ', seen ' + N.fd(h.seen, 'en') + ').', page, 'delivery');
      else if (h.d !== H[i - 1].d) add(h.seen, 'promise/' + q.k + '/' + h.seen, kind + ' date changed: ' + N.fd(H[i - 1].d, 'en') + ' to ' + N.fd(h.d, 'en'), kind + ' date on record changed from ' + N.fd(H[i - 1].d, 'en') + ' to ' + N.fd(h.d, 'en') + ' (seen ' + N.fd(h.seen, 'en') + ').', page, 'delivery');
    });
  }
  if (c.overdue && N.iso(c.checked)) add(c.checked, 'overdue/' + N.iso(c.checked), 'Handover date on record has passed', N.tr('en', 'g_over', { m: c.overdue }), ORIGIN + '/promises/', 'delivery');
  for (const f of (((ix.find[x.id] || {}).f) || []).slice(0, 30)) { const t = String(f.text || '').replace(/^[A-Z]{2,5}-\d{3,4}\s*·\s*/, ''); add(f.at, 'finding/' + f.at + '/' + (f.fp || ''), 'Change seen on the developer page', t + (f.fp ? ' (page fingerprint SHA-256 ' + f.fp + '...)' : ''), page, 'history'); }
  const sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date;
  if (sha && sd) add(sd, 'sealed/' + sha.slice(0, 16), 'Copy of the developer page sealed', 'A copy of the developer page was sealed with SHA-256 ' + sha + '. Check it at ' + ORIGIN + '/verify.', ORIGIN + '/verify', 'history');
  const rw = x.rw || c.register;
  if (rw && rw.checked) add(rw.checked, 'register/' + N.iso(rw.checked), 'Official register checked: ' + rw.register, N.tr('en', 'rw_line', { reg: rw.register, item: rw.item, st: rw.status, det: rw.detail ? ', ' + rw.detail : '', d: N.fd(rw.checked, 'en') }), ORIGIN + '/registers/', 'permits');
  if (c.sat && c.sat.date) add(c.sat.date, 'sat/' + c.sat.date, 'Satellite image compared', N.tr('en', 'sat_line', { d: N.fd(c.sat.date, 'en'), st: N.tr('en', c.sat.status === 'visible change' ? 'sat_visible' : 'sat_none'), pct: c.sat.changed_pct }), ORIGIN + '/satellite/', 'history');
  return E;
}
const fv = v => v === true ? 'yes' : v === false ? 'no' : v == null ? 'not stated' : String(v);
const xe = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
async function feed(req, N, ix, kind, slug, fmt) {
  let E = [], name, home, about;
  if (kind === 'projects') {
    const x = ix.bySlug.get(slug); if (!x) return jerr({ error: 'not_found' }, 404);
    E = events(N, ix, x); name = x.n; home = ORIGIN + '/projects/' + slug + '/'; about = 'Dated changes on record for ' + x.n + ' (' + [x.mk, x.co].filter(Boolean).join(', ') + '): promises and their changes, changes seen on the developer page, sealed copies and official register checks. Facts only, each with its source.';
  } else {
    const dv = ix.devs.get(slug); if (!dv) return jerr({ error: 'not_found' }, 404);
    for (const id of dv.ids) { const x = ix.byId.get(id); if (x) E.push(...events(N, ix, x).map(e => Object.assign(e, { title: x.n + ': ' + e.title }))); }
    name = dv.n; home = ORIGIN + '/developers/' + slug + '/'; about = 'Dated changes on record for the projects of ' + dv.n + ' that Kolaboro tracks. Facts only, each with its source.';
  }
  const seen = new Set(); E = E.filter(e => !seen.has(e.key) && seen.add(e.key)).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 60);
  const upd = E.length ? E[0].d : (N.iso(ix.updated) || '2026-11-01') + 'T00:00:00Z', self = home + 'feed.' + fmt, title = name + ': changes on record | Kolaboro';
  const tag = e => 'tag:kolaboro.com,2026:' + e.key;
  const hh = { 'last-modified': new Date(upd).toUTCString() };
  if (fmt === 'json') {
    const o = { version: 'https://jsonfeed.org/version/1.1', title, home_page_url: home, feed_url: self, description: about, language: 'en', authors: [{ name: 'Kolaboro', url: ORIGIN + '/' }], icon: ORIGIN + '/icon-512.png', favicon: ORIGIN + '/k/favicon.svg',
      _kolaboro: { license: 'CC BY 4.0', api: ORIGIN + '/api/v1/' + kind + '/' + slug, watch_by_email: kind === 'projects' ? home + '#watch' : null },
      items: E.map(e => ({ id: tag(e), url: e.url, external_url: e.src || undefined, title: e.title, content_text: e.text + (e.src ? ' Source: ' + e.src : ''), content_html: '<p>' + esc(e.text) + '</p>' + (e.src ? '<p>Source: <a href="' + esc(e.src) + '">' + esc(e.src) + '</a></p>' : ''), date_published: e.d })) };
    return out(req, JSON.stringify(o), 'application/feed+json; charset=utf-8', hh, 1800);
  }
  const x = '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en"><title>' + xe(title) + '</title><subtitle>' + xe(about) + '</subtitle><id>' + xe(home) + '</id>' +
    '<link rel="self" type="application/atom+xml" href="' + xe(self) + '"/><link rel="alternate" type="text/html" href="' + xe(home) + '"/><updated>' + upd + '</updated><author><name>Kolaboro</name><uri>' + ORIGIN + '/</uri></author><rights>CC BY 4.0</rights><icon>' + ORIGIN + '/icon-512.png</icon>' +
    E.map(e => '<entry><title>' + xe(e.title) + '</title><id>' + xe(tag(e)) + '</id><link rel="alternate" type="text/html" href="' + xe(e.url) + '"/>' + (e.src ? '<link rel="related" href="' + xe(e.src) + '"/>' : '') + '<updated>' + e.d + '</updated><published>' + e.d + '</published>' +
      '<summary type="text">' + xe(e.text) + '</summary><content type="html">' + xe('<p>' + esc(e.text) + '</p>' + (e.src ? '<p>Source: <a href="' + esc(e.src) + '">' + esc(e.src) + '</a></p>' : '')) + '</content></entry>').join('') + '</feed>';
  return out(req, x, 'application/atom+xml; charset=utf-8', hh, 1800);
}

// ------------------------------------------------------------------------------------------------ watch (email, double opt-in)
async function watch(req, u, env, ctx) {
  const o = (b, s, extra) => new Response(JSON.stringify(b), { status: s || 200, headers: Object.assign({ 'content-type': JT, 'cache-control': 'no-store' }, extra || {}) });
  if (req.method !== 'POST') return o({ error: 'method', use: 'POST {"project":"<id or slug>","email":"you@example.com"}' }, 405);
  const orig = req.headers.get('origin'); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return o({ error: 'origin' }, 403);
  const rl = await rate(req, ctx, 'watch9', 6); if (!rl.ok) return o({ error: 'rate', retry_after_s: rl.retry }, 429, { 'retry-after': String(rl.retry) });
  let b; try { b = await req.json(); } catch (e) { return o({ error: 'body' }, 400); }
  if (b && b.hp) return o({ ok: true, confirmed: false });                       // honeypot: answer like success, store nothing
  const email = String((b && b.email) || '').trim().toLowerCase(), key = String((b && b.project) || '').trim();
  if (email.length > 200 || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email)) return o({ error: 'email' }, 400);
  const N = await import('./kbx_named.js');
  let ix; try { ix = await N.data(env); } catch (e) { return o({ error: 'data' }, 503); }
  const x = ix.byId.get(key.toUpperCase()) || ix.bySlug.get(key.toLowerCase()); if (!x) return o({ error: 'project' }, 404);
  const { rpc } = await import('./kolaboro.js');
  let r; try { r = await rpc('kolaboro_follow', { p_email: email, p_ref: x.id }); } catch (e) { return o({ error: 'db' }, 503); }
  if (!r || r.error) { const e = r && r.error; return o({ error: e === 'busy' ? 'busy' : e === 'input' ? 'email' : 'db' }, e === 'busy' ? 429 : e === 'input' ? 400 : 503); }
  return o({ ok: true, project: x.id, confirmed: !!r.confirmed, next: r.confirmed ? 'already confirmed' : 'confirmation link sent by email' });
}
