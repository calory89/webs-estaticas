// kolaboro.com calendar of promised dates (batch 21, n21d).
//   GET /projects/<slug>/calendar.ics[?lang=xx]   the dated promises on record for one named project as an iCalendar file
//                                                 (download, or subscribe with webcal:// so a moved date updates itself)
//   calHtml()                                     the "where it should be by now" line and the calendar buttons inside the
//                                                 "Delivery and delay record" section of a named project page
// Everything comes from /data/promises.json and the project's research record (the same dates the page already lists, each with
// its source). A period (2027, 2027-Q2, 2027-H1, 2027-08) is placed on its last day, and the entry says so. No AI, nothing stored.
import { hcode } from './kbx_hdate.js';   // n25t
export const PATHS = /^\/projects\/[a-z0-9-]{1,90}\/calendar\.ics$/;
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const T = {
  en: { h: 'Where it should be by now', by: 'By today ({d}), the developer\'s own schedule says:', past: '{k}: due by {p} ({ago}).', now: '{k}: promised for {p}, the period we are in now.', next: 'Next on the schedule: {k}, {p} ({in}).', nodue: 'No promised date has come due yet.',
    st_kept: 'Our record shows it done by that date.', st_broken: 'Our record shows it was not done by that date.', st_unknown: 'We hold no dated evidence either way.', st_open: 'Our record does not show it done yet.',
    btn: 'Add the promised dates to your calendar', sub: 'Subscribe, so a moved date updates itself', note: 'Dated promises on record: {n}, each with its source. A period such as a quarter is placed on its last day. These are the developer\'s dates, not a confirmation by Kolaboro.',
    cal: '{n}: promised dates (Kolaboro)', ev: '{n}: {k}, promised for {p}', d_pub: 'Date published by the developer: {p}.', d_st: 'Status in our record: {st}.', d_src: 'Source: {u} (read on {d}).', d_rec: 'Record with all sources: {u}', d_note: 'This is the developer\'s date, not a confirmation by Kolaboro. A period is placed on its last day.' },
  es: { h: 'Dónde debería estar a día de hoy', by: 'A día de hoy ({d}), el calendario del propio promotor dice:', past: '{k}: prevista como máximo para {p} ({ago}).', now: '{k}: prometida para {p}, el periodo en curso.', next: 'Siguiente en el calendario: {k}, {p} ({in}).', nodue: 'Todavía no ha vencido ninguna fecha prometida.',
    st_kept: 'Nuestro registro muestra que se hizo antes de esa fecha.', st_broken: 'Nuestro registro muestra que no se hizo antes de esa fecha.', st_unknown: 'No tenemos pruebas fechadas en ningún sentido.', st_open: 'Nuestro registro aún no la muestra como hecha.',
    btn: 'Añadir las fechas prometidas a tu calendario', sub: 'Suscribirte, para que una fecha aplazada se actualice sola', note: 'Promesas con fecha registradas: {n}, cada una con su fuente. Un periodo como un trimestre se coloca en su último día. Son las fechas del promotor, no una confirmación de Kolaboro.',
    cal: '{n}: fechas prometidas (Kolaboro)', ev: '{n}: {k}, prometida para {p}', d_pub: 'Fecha publicada por el promotor: {p}.', d_st: 'Estado en nuestro registro: {st}.', d_src: 'Fuente: {u} (leída el {d}).', d_rec: 'Registro con todas las fuentes: {u}', d_note: 'Es la fecha del promotor, no una confirmación de Kolaboro. Un periodo se coloca en su último día.' },
  de: { h: 'Wo es heute stehen sollte', by: 'Stand heute ({d}) sagt der eigene Zeitplan des Bauträgers:', past: '{k}: fällig bis {p} ({ago}).', now: '{k}: zugesagt für {p}, den laufenden Zeitraum.', next: 'Als Nächstes im Zeitplan: {k}, {p} ({in}).', nodue: 'Noch ist kein zugesagter Termin fällig geworden.',
    st_kept: 'Unser Eintrag zeigt, dass es bis zu diesem Termin erledigt war.', st_broken: 'Unser Eintrag zeigt, dass es bis zu diesem Termin nicht erledigt war.', st_unknown: 'Uns liegt kein datierter Nachweis in die eine oder andere Richtung vor.', st_open: 'Unser Eintrag zeigt es noch nicht als erledigt.',
    btn: 'Zugesagte Termine in Ihren Kalender übernehmen', sub: 'Abonnieren, damit sich ein verschobener Termin selbst aktualisiert', note: 'Erfasste Zusagen mit Datum: {n}, jede mit Quelle. Ein Zeitraum wie ein Quartal steht auf seinem letzten Tag. Es sind die Termine des Bauträgers, keine Bestätigung durch Kolaboro.',
    cal: '{n}: zugesagte Termine (Kolaboro)', ev: '{n}: {k}, zugesagt für {p}', d_pub: 'Vom Bauträger veröffentlichter Termin: {p}.', d_st: 'Status in unserem Eintrag: {st}.', d_src: 'Quelle: {u} (gelesen am {d}).', d_rec: 'Eintrag mit allen Quellen: {u}', d_note: 'Das ist der Termin des Bauträgers, keine Bestätigung durch Kolaboro. Ein Zeitraum steht auf seinem letzten Tag.' },
  fr: { h: 'Où le projet devrait en être aujourd’hui', by: 'À ce jour ({d}), le calendrier du promoteur lui-même indique :', past: '{k} : prévu au plus tard pour {p} ({ago}).', now: '{k} : promis pour {p}, la période en cours.', next: 'Prochaine étape du calendrier : {k}, {p} ({in}).', nodue: 'Aucune date promise n’est encore arrivée à échéance.',
    st_kept: 'Notre fiche montre que c’était fait à cette date.', st_broken: 'Notre fiche montre que ce n’était pas fait à cette date.', st_unknown: 'Nous n’avons aucune preuve datée dans un sens ou dans l’autre.', st_open: 'Notre fiche ne le montre pas encore comme fait.',
    btn: 'Ajouter les dates promises à votre agenda', sub: 'S’abonner, pour qu’une date repoussée se mette à jour seule', note: 'Promesses datées enregistrées : {n}, chacune avec sa source. Une période comme un trimestre est placée à son dernier jour. Ce sont les dates du promoteur, pas une confirmation de Kolaboro.',
    cal: '{n} : dates promises (Kolaboro)', ev: '{n} : {k}, promis pour {p}', d_pub: 'Date publiée par le promoteur : {p}.', d_st: 'Statut dans notre fiche : {st}.', d_src: 'Source : {u} (lue le {d}).', d_rec: 'Fiche avec toutes les sources : {u}', d_note: 'C’est la date du promoteur, pas une confirmation de Kolaboro. Une période est placée à son dernier jour.' },
  nl: { h: 'Waar het nu zou moeten staan', by: 'Vandaag ({d}) zegt de eigen planning van de ontwikkelaar:', past: '{k}: uiterlijk {p} ({ago}).', now: '{k}: beloofd voor {p}, de lopende periode.', next: 'Volgende in de planning: {k}, {p} ({in}).', nodue: 'Er is nog geen beloofde datum verstreken.',
    st_kept: 'Ons dossier laat zien dat het op die datum klaar was.', st_broken: 'Ons dossier laat zien dat het op die datum niet klaar was.', st_unknown: 'We hebben geen gedateerd bewijs voor het een of het ander.', st_open: 'Ons dossier toont het nog niet als afgerond.',
    btn: 'Zet de beloofde data in je agenda', sub: 'Abonneren, zodat een verschoven datum zichzelf bijwerkt', note: 'Vastgelegde beloften met datum: {n}, elk met bron. Een periode zoals een kwartaal staat op de laatste dag. Het zijn de data van de ontwikkelaar, geen bevestiging door Kolaboro.',
    cal: '{n}: beloofde data (Kolaboro)', ev: '{n}: {k}, beloofd voor {p}', d_pub: 'Datum gepubliceerd door de ontwikkelaar: {p}.', d_st: 'Status in ons dossier: {st}.', d_src: 'Bron: {u} (gelezen op {d}).', d_rec: 'Dossier met alle bronnen: {u}', d_note: 'Dit is de datum van de ontwikkelaar, geen bevestiging door Kolaboro. Een periode staat op de laatste dag.' },
  ru: { h: 'Где проект должен быть сегодня', by: 'На сегодня ({d}) собственный график застройщика говорит:', past: '{k}: срок не позднее {p} ({ago}).', now: '{k}: обещано на {p}, это текущий период.', next: 'Далее по графику: {k}, {p} ({in}).', nodue: 'Ни один обещанный срок ещё не наступил.',
    st_kept: 'По нашей записи это было сделано к этой дате.', st_broken: 'По нашей записи к этой дате это не было сделано.', st_unknown: 'У нас нет датированных подтверждений ни в ту, ни в другую сторону.', st_open: 'В нашей записи это пока не отмечено как сделанное.',
    btn: 'Добавить обещанные даты в календарь', sub: 'Подписаться, чтобы перенесённая дата обновлялась сама', note: 'Обещаний с датой в записи: {n}, у каждого указан источник. Период, например квартал, ставится на его последний день. Это даты застройщика, а не подтверждение Kolaboro.',
    cal: '{n}: обещанные даты (Kolaboro)', ev: '{n}: {k}, обещано на {p}', d_pub: 'Дата, опубликованная застройщиком: {p}.', d_st: 'Статус в нашей записи: {st}.', d_src: 'Источник: {u} (прочитано {d}).', d_rec: 'Запись со всеми источниками: {u}', d_note: 'Это дата застройщика, а не подтверждение Kolaboro. Период ставится на его последний день.' },
  zh: { h: '按计划现在应到哪一步', by: '截至今天（{d}），开发商自己的时间表显示：', past: '{k}：最迟应在 {p} 完成（{ago}）。', now: '{k}：承诺在 {p}，即当前这一时期。', next: '时间表上的下一项：{k}，{p}（{in}）。', nodue: '还没有任何承诺日期到期。',
    st_kept: '我们的记录显示在该日期前已完成。', st_broken: '我们的记录显示到该日期尚未完成。', st_unknown: '我们没有任何带日期的证据可以证明是否完成。', st_open: '我们的记录尚未显示已完成。',
    btn: '把承诺日期加入你的日历', sub: '订阅，日期推迟时自动更新', note: '记录在案的带日期承诺：{n} 项，每项都有来源。季度等时期放在其最后一天。这些是开发商的日期，不代表 Kolaboro 的确认。',
    cal: '{n}：承诺日期（Kolaboro）', ev: '{n}：{k}，承诺在 {p}', d_pub: '开发商公布的日期：{p}。', d_st: '我们记录中的状态：{st}。', d_src: '来源：{u}（读取于 {d}）。', d_rec: '含全部来源的记录：{u}', d_note: '这是开发商的日期，不代表 Kolaboro 的确认。时期放在其最后一天。' },
  ar: { h: 'أين يُفترض أن يكون المشروع اليوم', by: 'حتى اليوم ({d})، يقول الجدول الزمني للمطوّر نفسه:', past: '{k}: الموعد الأقصى {p} ({ago}).', now: '{k}: موعود به في {p}، وهي الفترة الحالية.', next: 'التالي في الجدول: {k}، {p} ({in}).', nodue: 'لم يحن بعد أي موعد موعود به.',
    st_kept: 'يُظهر سجلّنا أنه أُنجز قبل ذلك الموعد.', st_broken: 'يُظهر سجلّنا أنه لم يُنجز حتى ذلك الموعد.', st_unknown: 'ليس لدينا دليل مؤرَّخ في أي من الاتجاهين.', st_open: 'لا يُظهر سجلّنا أنه أُنجز بعد.',
    btn: 'أضف المواعيد الموعودة إلى تقويمك', sub: 'اشترك ليتحدّث الموعد المؤجَّل تلقائيًا', note: 'الوعود المؤرَّخة في السجل: {n}، ولكل منها مصدره. الفترة مثل ربع السنة توضع في يومها الأخير. هذه مواعيد المطوّر وليست تأكيدًا من Kolaboro.',
    cal: '{n}: المواعيد الموعودة (Kolaboro)', ev: '{n}: {k}، موعود به في {p}', d_pub: 'الموعد الذي نشره المطوّر: {p}.', d_st: 'الحالة في سجلّنا: {st}.', d_src: 'المصدر: {u} (قُرئ في {d}).', d_rec: 'السجل مع جميع المصادر: {u}', d_note: 'هذا موعد المطوّر وليس تأكيدًا من Kolaboro. الفترة توضع في يومها الأخير.' },
};
const t = (lang, k, v) => { const s = (T[lang] && T[lang][k]) || T.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const p2 = n => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();   // m 1..12
// a stored date or period -> { a: first day, b: last day, norm: the canonical spelling } or null when it cannot be placed
export function span(d) {
  const s = String(d == null ? '' : d).trim(); let m;
  const mk = (y, m1, d1, m2, d2, norm) => (y >= 2000 && y <= 2060 ? { a: y + '-' + p2(m1) + '-' + p2(d1), b: y + '-' + p2(m2) + '-' + p2(d2), norm } : null);
  if ((m = s.match(/^(\d{4})$/))) return mk(+m[1], 1, 1, 12, 31, m[1]);
  if ((m = s.match(/^(\d{4})-Q([1-4])$/i)) || (m = s.match(/^Q([1-4]) (\d{4})$/i)) && (m = [0, m[2], m[1]])) { const y = +m[1], q = +m[2]; return mk(y, q * 3 - 2, 1, q * 3, lastDay(y, q * 3), y + '-Q' + q); }
  if ((m = s.match(/^(\d{4})-H([12])$/i))) { const y = +m[1], h = +m[2]; return mk(y, h * 6 - 5, 1, h * 6, lastDay(y, h * 6), y + '-H' + h); }
  if ((m = s.match(/^(\d{4})-(\d{2})$/)) && +m[2] >= 1 && +m[2] <= 12) return mk(+m[1], +m[2], 1, +m[2], lastDay(+m[1], +m[2]), s);
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)) && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= lastDay(+m[1], +m[2])) return mk(+m[1], +m[2], +m[3], +m[2], +m[3], s);
  if ((m = s.match(/^([A-Za-z]+) (\d{4})$/)) && MONTHS[m[1].toLowerCase()]) { const mo = MONTHS[m[1].toLowerCase()]; return mk(+m[2], mo, 1, mo, lastDay(+m[2], mo), m[2] + '-' + p2(mo)); }
  const hc = hcode(s); if (hc && hc !== s) return span(hc);   // n25t: "Q1 2027", "1er semestre 2027", "2027-10 (portal)" and other wordings
  return null;
}
// the dated promises of one project: the promise tracker first, then the research record for kinds the tracker does not hold
export function calItems(x, prom) {
  const out = [], seen = new Set();
  for (const p of prom || []) {
    const sp = span(p.d); if (!sp || seen.has(p.k + sp.norm)) continue; seen.add(p.k + sp.norm);
    out.push({ k: p.k, d: sp.norm, a: sp.a, b: sp.b, st: p.st || null, mv: p.mv || 0, mm: p.mm || 0, seen: p.seen || null, sha: p.src === 'page' && p.sha ? p.sha : null,
      hist: (p.hist || []).filter(h => h.d && h.d !== p.d).map(h => ({ d: h.d, seen: h.seen || null })) });
  }
  const fx = x.fx || {};
  for (const [k, f] of [['handover', 'handover_promised'], ['construction_start', 'construction_start']]) {
    if (out.some(o => o.k === k)) continue;
    const sp = span(fx[f]); if (sp) out.push({ k, d: sp.norm, a: sp.a, b: sp.b, st: null, mv: 0, mm: 0, seen: x.ad || null, sha: null, hist: [] });
  }
  return out.sort((p, q) => (p.b < q.b ? -1 : p.b > q.b ? 1 : p.a < q.a ? -1 : p.a > q.a ? 1 : 0));
}
const mIdx = s => +s.slice(0, 4) * 12 + (+s.slice(5, 7) - 1);
function rel(lang, months) {   // "11 months ago", "in 7 months", "this month", in the page's language with its own plural rules
  try {
    const f = new Intl.RelativeTimeFormat(LOC[lang] || 'en-GB', { numeric: 'auto' });
    return Math.abs(months) >= 24 ? f.format(Math.trunc(months / 12), 'year') : f.format(months, 'month');
  } catch (e) { return ''; }
}
// where the developer's own dates put the project today: the latest date that has come due, the period we are in, the next one
export function calStatus(items, today) {
  const past = items.filter(i => i.b < today), now = items.filter(i => i.a <= today && i.b >= today), next = items.filter(i => i.a > today);
  // the handover date decides when it has come due; otherwise the latest date that passed
  const due = past.filter(i => i.k === 'handover').pop() || past[past.length - 1] || null;
  return { due, now: now[0] || null, next: next[0] || null };
}
// html for the named page (inside #delivery). kn: kind label, fdl: date or period for display
export function calHtml(x, prom, lang, kn, fdl, today) {
  const items = calItems(x, prom); if (!items.length) return '';
  today = today || new Date().toISOString().slice(0, 10);
  const S = calStatus(items, today), L = [], tm = mIdx(today);
  const strong = (k, p) => ({ k: '<b>' + esc(kn(k)) + '</b>', p: esc(fdl(p)) });
  if (S.due) {
    // a date taken from the research record alone carries no tracked status: the line then states the date and nothing more
    const st = S.due.st === 'kept' || S.due.st === 'broken' || S.due.st === 'unknown' ? S.due.st : S.due.st ? 'open' : '';
    L.push('<li' + (st === 'kept' ? ' class="kcal-ok"' : st === 'broken' || st === 'open' ? ' class="kcal-due"' : '') + '>' + t(lang, 'past', Object.assign(strong(S.due.k, S.due.d), { ago: esc(rel(lang, Math.min(0, mIdx(S.due.b) - tm))) })) + (st ? ' ' + esc(t(lang, 'st_' + st)) : '') + '</li>');
  } else L.push('<li>' + esc(t(lang, 'nodue')) + '</li>');
  if (S.now) L.push('<li>' + t(lang, 'now', strong(S.now.k, S.now.d)) + '</li>');
  if (S.next) L.push('<li>' + t(lang, 'next', Object.assign(strong(S.next.k, S.next.d), { in: esc(rel(lang, Math.max(1, mIdx(S.next.a) - tm))) })) + '</li>');
  const ics = '/projects/' + x.s + '/calendar.ics' + (lang === 'en' ? '' : '?lang=' + lang);
  return '<div class="kcal" id="calendar"><h3>' + esc(t(lang, 'h')) + '</h3><p class="ki">' + esc(t(lang, 'by', { d: fdl(today) })) + '</p><ul class="fl kcal-l">' + L.join('') + '</ul>' +
    '<p class="bts"><a class="btn btn-line kbtn" href="' + esc(ics) + '" download="kolaboro-' + esc(x.s) + '.ics" data-ev="cal_ics">' + esc(t(lang, 'btn')) + ' (.ics)</a> ' +
    '<a class="more" href="webcal://kolaboro.com' + esc(ics) + '" data-ev="cal_sub">' + esc(t(lang, 'sub')) + '</a></p><p class="ki">' + esc(t(lang, 'note', { n: items.length })) + '</p></div>';
}
export const CAL_CSS = '.kcal{margin:22px 0 0;padding:16px 0 0;border-top:1px solid var(--k-line,var(--line))}.kcal h3{margin:0 0 6px}.kcal .kcal-l{margin:6px 0 12px}.kcal .kcal-l li{padding-inline-start:14px;border-inline-start:3px solid var(--k-line-2,var(--line))}.kcal .kcal-l li.kcal-due{border-inline-start-color:var(--k-warn,#8a5a00)}.kcal .kcal-l li.kcal-ok{border-inline-start-color:var(--k-ok,#1c6b46)}.kcal .bts{align-items:center}';

// ------------------------------------------------------------------------------------------------ iCalendar
const icsEsc = s => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const te = new TextEncoder();
function fold(line) {   // RFC 5545: lines of at most 75 octets, continuation lines start with one space; never split a character
  const out = []; let cur = '', n = 0;
  for (const ch of line) { const b = te.encode(ch).length; if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; n = 0; } cur += ch; n += b; }
  out.push(cur); return out.join('\r\n ');
}
const dnum = s => s.replace(/-/g, '');
const nextDay = s => new Date(Date.parse(s + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10);
export function icsFor(x, items, lang, H) {   // H: { kn, fdl, ps, moved, histLabel, stamp }
  const page = ORIGIN + (lang === 'en' ? '' : '/' + lang) + '/projects/' + x.s + '/#delivery', src = x.url || x.du || page;
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kolaboro//Promised dates 1.0//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsEsc(t(lang, 'cal', { n: x.n })), 'X-WR-CALDESC:' + icsEsc(t(lang, 'd_note') + ' ' + page), 'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D'];
  const n = {};
  for (const i of items) {
    n[i.k] = (n[i.k] || 0) + 1;
    const p = H.fdl(i.d), desc = [t(lang, 'd_pub', { p })];
    if (i.st) desc.push(t(lang, 'd_st', { st: H.ps(i.st) }));
    if (i.mv) { const mv = H.moved(i.mv, i.mm); desc.push(mv.charAt(0).toUpperCase() + mv.slice(1) + '.'); }
    if (i.hist.length) desc.push(H.histLabel + ': ' + i.hist.map(h => H.fdl(h.d) + (h.seen ? ' (' + H.fdl(h.seen) + ')' : '')).join(', ') + '.');
    desc.push(t(lang, 'd_src', { u: src, d: H.fdl(i.seen || x.ad || H.stamp) }) + (i.sha ? ' SHA-256 ' + i.sha + '.' : ''));
    desc.push(t(lang, 'd_rec', { u: page })); desc.push(t(lang, 'd_note'));
    L.push('BEGIN:VEVENT', 'UID:' + x.id + '-' + i.k + '-' + n[i.k] + '@kolaboro.com', 'DTSTAMP:' + dnum(H.stamp) + 'T000000Z', 'DTSTART;VALUE=DATE:' + dnum(i.b), 'DTEND;VALUE=DATE:' + dnum(nextDay(i.b)),
      'SUMMARY:' + icsEsc(t(lang, 'ev', { n: x.n, k: H.kn(i.k), p })), 'DESCRIPTION:' + icsEsc(desc.join('\n')), 'URL:' + page, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}
let NM = null;
export async function handle(req, u, env, ctx) {
  const m = u.pathname.match(/^\/projects\/([a-z0-9-]{1,90})\/calendar\.ics$/); if (!m) return null;
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('method', { status: 405 });
  const q = u.searchParams.get('lang'), lang = LANGS.includes(q) ? q : 'en';
  const ck = new Request(ORIGIN + '/__cal/v1/' + m[1] + '/' + lang);
  const hit = await caches.default.match(ck); if (hit) return hit;
  let ix; try { if (!NM) NM = await import('./kbx_named.js'); ix = await NM.data(env); } catch (e) { return new Response('temporarily unavailable', { status: 503, headers: { 'retry-after': '60' } }); }
  const x = ix.bySlug.get(m[1]), items = x ? calItems(x, ix.prom[x.id]) : [];
  if (!x || !items.length) return new Response(x ? 'No dated promise on record for this project.' : 'Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' } });
  const stamp = NM.iso(ix.updated) || new Date().toISOString().slice(0, 10);
  const body = icsFor(x, items, lang, { kn: k => NM.tr(lang, 'pk_' + k), fdl: d => NM.fd(d, lang), ps: s => NM.tr(lang, 'ps_' + s), moved: (k, mm) => NM.tr(lang, 'pr_moved', { k, mm }), histLabel: NM.tr(lang, 'pr_hist'), stamp });
  const r = new Response(body, { status: 200, headers: { 'content-type': 'text/calendar; charset=utf-8', 'content-disposition': 'attachment; filename="kolaboro-' + m[1] + '.ics"', 'cache-control': 'public, max-age=3600', 'x-robots-tag': 'noindex', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
  if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(ck, r.clone()).catch(() => {}));
  return r;
}
