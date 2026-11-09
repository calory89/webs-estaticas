// kolaboro.com batch 17 (agent n17c): data you can check. No AI anywhere in this module.
//   Delivery forecast (Kaplan-Meier) from our dated promise history, per market and per developer (10+ projects), with a 95% range:
//     on named project pages (#delivery), market pages (/m/<market>/), method page /methods/delivery-forecast/ (8 languages)
//     GET /api/x/fc/curves                    every group: counts, threshold status, Kaplan-Meier steps, chance by 0/6/12/18/24 months
//     GET /api/x/fc/project?id=BALI-014       one project: the group used, its first promised date and the chance by each date
//   Developer answer speed on developer pages: from /data/dev-response.json (claude-ops job jobs/n17c_aggr.py, read-only SQL over
//     kolaboro_y_asks and kolaboro_devreply, counts and day differences per project id only)
//     GET /api/x/fc/speed?dev=<slug>          one developer's counts and median days (median from 5 answered questions)
//   /open (8 languages): live traction, aggregates only. Paying customers and revenue are NOT shown (pending Carlos); the page keeps a
//     hidden, clearly marked slot for them.  GET /api/x/fc/open  the same figures as JSON, each with its source.
// Inputs are public files (/data/promises.json, /data/bali-cases.json, /data/named.json, /data/traction.json, /data/dev-response.json,
// /data/deploys.json, /data/shipping.json) and existing public aggregate DB functions (kolaboro_xray_live, kolaboro_metrics_public:
// only stamps, followers and weekly stamps are read from it, kolaboro_push_public, kolaboro_y_alerts_public, kolaboro_log_public).
// Sumba projects are left out everywhere (conflict of interest), the same rule as the named pages.
import { FT } from './kbx_fc_i18n.js';
import { LOCALE } from './kbx_named_i18n.js';
import { rpc } from './kolaboro.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:open|methods\/delivery-forecast)\/?$|^\/api\/x\/fc(?:\/|$)/;
const MIN_N = 20, MIN_K = 5, MIN_ND = 10, MIN_R = 10, RS_MIN = 5, Z = 1.959963984540054, KS = [0, 6, 12, 18, 24];
const COI = /^sumba$/i;
const VERSION = 'fc-km-1';

// n18e (batch 18) strings: live answer counts, partial weeks, paying-customer count (8 languages)
const FT2 = {
  en: { rs_few: 'No project of {dev} has {k} or more reported questions yet. We break a project out from {k}.', rs_live: 'Counted live, {d}', o_partial: '(to {d})', o_s_cust: 'Paying customers', c_cust: 'paid checks', c_cust_s: 'Payments recorded for a paid pre-purchase check, all time', c_cust_n: 'A count only, read live from our payment records. Revenue amounts are not published.', o_auto: 'Weeks after the weekly history are counted live from the public X-ray function.' },
  es: { rs_few: 'Ningún proyecto de {dev} tiene aún {k} o más preguntas informadas. Mostramos un proyecto a partir de {k}.', rs_live: 'Contado en directo, {d}', o_partial: '(hasta {d})', o_s_cust: 'Clientes que pagan', c_cust: 'revisiones pagadas', c_cust_s: 'Pagos registrados por una revisión previa a la compra, desde el inicio', c_cust_n: 'Solo un recuento, leído en directo de nuestros registros de pago. No publicamos importes.', o_auto: 'Las semanas posteriores al histórico semanal se cuentan en directo con la función pública de radiografías.' },
  fr: { rs_few: 'Aucun projet de {dev} n’a encore {k} questions signalées ou plus. Nous détaillons un projet à partir de {k}.', rs_live: 'Compté en direct, {d}', o_partial: '(jusqu’au {d})', o_s_cust: 'Clients payants', c_cust: 'vérifications payées', c_cust_s: 'Paiements enregistrés pour une vérification avant achat, depuis le début', c_cust_n: 'Un simple comptage, lu en direct dans nos enregistrements de paiement. Les montants ne sont pas publiés.', o_auto: 'Les semaines après l’historique hebdomadaire sont comptées en direct avec la fonction publique des radiographies.' },
  de: { rs_few: 'Noch kein Projekt von {dev} hat {k} oder mehr gemeldete Fragen. Wir zeigen ein Projekt ab {k} einzeln.', rs_live: 'Live gezählt, {d}', o_partial: '(bis {d})', o_s_cust: 'Zahlende Kunden', c_cust: 'bezahlte Prüfungen', c_cust_s: 'Erfasste Zahlungen für eine Prüfung vor dem Kauf, seit Beginn', c_cust_n: 'Nur eine Anzahl, live aus unseren Zahlungsdaten gelesen. Beträge veröffentlichen wir nicht.', o_auto: 'Wochen nach dem Wochenverlauf werden live über die öffentliche Röntgen-Funktion gezählt.' },
  nl: { rs_few: 'Nog geen project van {dev} heeft {k} of meer gemelde vragen. We tonen een project apart vanaf {k}.', rs_live: 'Live geteld, {d}', o_partial: '(tot {d})', o_s_cust: 'Betalende klanten', c_cust: 'betaalde checks', c_cust_s: 'Geregistreerde betalingen voor een check vóór aankoop, sinds het begin', c_cust_n: 'Alleen een aantal, live gelezen uit onze betaalgegevens. Bedragen publiceren we niet.', o_auto: 'Weken na de weekgeschiedenis worden live geteld met de openbare röntgenfunctie.' },
  ru: { rs_few: 'Ни у одного проекта {dev} пока нет {k} или больше сообщённых вопросов. Проект показывается отдельно от {k}.', rs_live: 'Подсчитано в реальном времени, {d}', o_partial: '(до {d})', o_s_cust: 'Платящие клиенты', c_cust: 'оплаченных проверок', c_cust_s: 'Зарегистрированные платежи за проверку перед покупкой, за всё время', c_cust_n: 'Только количество, в реальном времени из наших записей о платежах. Суммы не публикуются.', o_auto: 'Недели после недельной истории считаются в реальном времени через публичную функцию рентген-отчётов.' },
  zh: { rs_few: '{dev} 的项目目前都还没有 {k} 个或以上的已报告问题。项目达到 {k} 个后单独显示。', rs_live: '实时统计,{d}', o_partial: '(截至 {d})', o_s_cust: '付费客户', c_cust: '已付费核查', c_cust_s: '自开始以来记录的购房前核查付款笔数', c_cust_n: '仅为数量,实时读取自我们的付款记录。不公布金额。', o_auto: '每周历史之后的各周通过公开的透视报告函数实时统计。' },
  ar: { rs_few: 'لا يوجد بعد مشروع لـ {dev} لديه {k} أسئلة مُبلغ عنها أو أكثر. نعرض المشروع منفصلًا ابتداءً من {k}.', rs_live: 'محسوب مباشرة، {d}', o_partial: '(حتى {d})', o_s_cust: 'العملاء الدافعون', c_cust: 'فحوص مدفوعة', c_cust_s: 'مدفوعات مسجلة لفحص ما قبل الشراء، منذ البداية', c_cust_n: 'عدد فقط، يُقرأ مباشرة من سجلات الدفع لدينا. لا ننشر المبالغ.', o_auto: 'الأسابيع التي تلي السجل الأسبوعي تُحسب مباشرة من دالة الأشعة العامة.' }
};

// ------------------------------------------------------------------------------------------------ helpers
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
function t(lang, k, v) { const s = (FT2[lang] && FT2[lang][k]) || (FT[lang] && FT[lang][k]) || FT2.en[k] || FT.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; }
const nf = (n, lang) => { try { return new Intl.NumberFormat(LOCALE[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const pct = (x, lang) => x == null ? '' : nf(Math.round(x * 100), lang) + '%';
const ym = i => { const y = Math.floor((i - 1) / 12), m = (i - 1) % 12 + 1; return y + '-' + String(m).padStart(2, '0'); };
function monthName(i, lang) { const s = ym(i); try { return new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+s.slice(0, 4), +s.slice(5) - 1, 1))); } catch (e) { return s; } }
function dayName(d, lang) { if (!d) return ''; try { return new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T00:00:00Z')); } catch (e) { return String(d).slice(0, 10); } }
function mi(s) {   // a promised date to a month index (year*12+month); quarters, halves and years read as their last month
  s = String(s || ''); let m;
  if ((m = s.match(/^(\d{4})-Q([1-4])$/i))) return +m[1] * 12 + +m[2] * 3;
  if ((m = s.match(/^(\d{4})-H([12])$/i))) return +m[1] * 12 + +m[2] * 6;
  if ((m = s.match(/^(\d{4})-(\d{2})/))) return +m[1] * 12 + +m[2];
  if ((m = s.match(/^(\d{4})$/))) return +m[1] * 12 + 12;
  return null;
}
const nowMi = () => { const d = new Date(); return d.getUTCFullYear() * 12 + d.getUTCMonth() + 1; };
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=300' } }); }

let MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 300000)) return m.v;
  const sh = (globalThis.__kbJson || {})[name]; if (sh && sh.v && Date.now() - sh.t < (ttl || 300000)) { MEMO[name] = { t: sh.t, v: sh.v }; return sh.v; }   // n20p: reuse the copy kbx_named.js already parsed
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 120, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); MEMO[name] = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ Kaplan-Meier
function km(R) {   // R: [{t, e}] ; returns steps at event times with S and the Greenwood sum
  const ts = [...new Set(R.filter(r => r.e).map(r => r.t))].sort((a, b) => a - b), steps = [];
  let S = 1, v = 0;
  for (const tt of ts) {
    const n = R.filter(r => r.t >= tt).length, d = R.filter(r => r.t === tt && r.e).length;
    S *= 1 - d / n; if (n > d) v += d / (n * (n - d));
    steps.push({ t: tt, n, d, S: +S.toFixed(6), v: +v.toFixed(8) });
  }
  return steps;
}
function at(steps, x) { let S = 1, v = 0; for (const s of steps) { if (s.t <= x) { S = s.S; v = s.v; } else break; } return { S, v }; }
const risk = (R, x) => R.filter(r => r.t >= x).length;
function est(R, steps, t0, k) {   // chance of handover by month k, given not handed over at month t0 (t0 < 0: unconditional)
  if (risk(R, Math.max(k, 0)) < MIN_R) return null;
  const a = t0 < 0 ? { S: 1, v: 0 } : at(steps, t0), b = at(steps, k);
  if (!a.S) return null;
  const Sc = b.S / a.S, se = Math.sqrt(Math.max(0, b.v - a.v));
  const lo = Math.max(0, Sc * Math.exp(-Z * se)), hi = Math.min(1, Sc * Math.exp(Z * se));
  return { k, p: +(1 - Sc).toFixed(4), lo: +(1 - hi).toFixed(4), hi: +(1 - lo).toFixed(4), at_risk: risk(R, Math.max(k, 0)) };
}
function group(level, name, R) {
  const k = R.filter(r => r.e).length, need = level === 'developer' ? MIN_ND : MIN_N, steps = km(R);
  const enough = R.length >= need && k >= MIN_K;
  return { level, name, n: R.length, k, enough, need_n: need, need_k: MIN_K, steps, R,
    by: KS.map(x => est(R, steps, -1, x)) };
}
const pub = g => g && { level: g.level, name: g.name, projects_past_first_date: g.n, handovers: g.k, enough: g.enough, needs: { projects: g.need_n, handovers: g.need_k },
  chance_by_months_after_first_date: g.enough || g.level === 'all' ? g.by.filter(Boolean).map(b => ({ months: b.k, chance: b.p, low: b.lo, high: b.hi, at_risk: b.at_risk })) : null,
  steps: g.enough || g.level === 'all' ? g.steps.map(s => ({ month: s.t, at_risk: s.n, handovers: s.d, still_waiting: s.S })) : null };

let FC = null;
export async function fcData(env) {
  const [P, B] = await Promise.all([file(env, 'promises.json'), file(env, 'bali-cases.json')]);
  const NOW = nowMi();
  if (FC && FC.P === P && FC.B === B && FC.now === NOW) return FC;
  const prom = P.projects || {}, rows = [], proj = {}, cnt = { no_promise: 0, ahead: 0, excluded: 0, events: 0, censored: 0 };
  for (const c of B.cases || []) {
    if (COI.test(String(c.market || ''))) continue;
    const h = (prom[c.id] || []).find(p => p.k === 'handover'), comp = c.stage === 'completed';
    let first = null, cur = null, row = null, st;
    if (h) {
      const ds = [h.d, ...(h.hist || []).map(x => x.d)].map(mi).filter(x => x != null);
      first = ds.length ? Math.min(...ds) : null; cur = mi(h.d);
    }
    if (first == null) {
      if (comp && typeof c.done === 'number') { const d = Math.max(0, Math.round(+c.delay || 0)); row = { t: d, e: 1 }; first = c.done * 12 + 12 - d; cur = c.done * 12 + 12; st = 'done'; }
      else { cnt.no_promise++; proj[c.id] = { m: c.market, st: 'none' }; continue; }
    } else if (comp || (h.ev && h.ev.what === 'done')) {
      row = { t: h.st === 'kept' ? 0 : Math.max(0, cur - first), e: 1 }; st = 'done';
    } else if (h.st === 'unknown') { cnt.excluded++; st = 'excluded'; }
    else if (NOW - first < 0) { cnt.ahead++; st = 'open'; }
    else { row = { t: NOW - first, e: 0 }; st = 'open'; }
    if (row) { row.id = c.id; row.m = c.market; rows.push(row); row.e ? cnt.events++ : cnt.censored++; }
    proj[c.id] = { m: c.market, st, first, cur, t0: first != null ? NOW - first : null };
  }
  const byM = new Map(); for (const r of rows) { if (!byM.has(r.m)) byM.set(r.m, []); byM.get(r.m).push(r); }
  const markets = new Map([...byM.entries()].map(([m, R]) => [m, group('market', m, R)]));
  for (const id in proj) if (!markets.has(proj[id].m)) markets.set(proj[id].m, group('market', proj[id].m, []));
  FC = { P, B, now: NOW, rows, proj, cnt, all: group('all', 'all markets', rows), markets, devs: null, updated: P.updated || B.updated };
  return FC;
}
async function devGroups(env, fc) {   // developer groups need the named-page index (developer slugs); computed once per data version
  if (fc.devs) return fc.devs;
  const nm = await import('./kbx_named.js'), ix = await nm.data(env), byId = new Map(fc.rows.map(r => [r.id, r])), devs = new Map();
  for (const dv of ix.devs.values()) devs.set(dv.s, group('developer', dv.n, dv.ids.map(i => byId.get(i)).filter(Boolean)));
  fc.devs = devs; return devs;
}
// the forecast for one project: developer group if it has enough, else market if enough, else none (pooled shown as context)
export function projectFc(fc, id, devGroup) {
  const p = fc.proj[id]; if (!p) return null;
  const mk = fc.markets.get(p.m) || group('market', p.m, []);
  const g = devGroup && devGroup.enough ? devGroup : mk.enough ? mk : null;
  const o = { id, status: p.st, first: p.first != null ? ym(p.first) : null, current: p.cur != null ? ym(p.cur) : null, months_since_first: p.t0, market: mk, group: g, pooled: fc.all, rows: [], pooled_rows: [], beyond: null };
  if (p.st !== 'open' || p.first == null) return o;
  const ks = p.t0 < 0 ? KS : [1, 2, 3, 4].map(i => (Math.floor(p.t0 / 6) + i) * 6);
  const mk2 = G => ks.map(k => { const e = est(G.R, G.steps, p.t0 < 0 ? -1 : p.t0, k); return e && { ...e, date: ym(p.first + k) }; }).filter(Boolean);
  if (g) o.rows = mk2(g); o.pooled_rows = mk2(fc.all);
  const G = g || fc.all, cut = ks.find(k => risk(G.R, k) < MIN_R); if (cut != null) o.beyond = Math.max(0, cut - 6);
  return o;
}

// ------------------------------------------------------------------------------------------------ HTML: forecast
const FC_CSS = '<style id="kfc17">.kfc{margin:28px 0 0;padding:20px 22px;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-lg,14px);background:var(--k-surface,var(--card))}.kfc h3{margin:0 0 8px;font-size:var(--k-fs-lg,20px)}' +
  '.kfc p{margin:8px 0;line-height:1.55;max-width:72ch}.kfc .tw{margin:12px 0}.kfc td.n,.kfc th.n{text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}.kfc-bar{display:inline-block;vertical-align:middle;width:72px;height:8px;border-radius:4px;background:var(--k-sunken,#E8ECEA);margin-inline-start:8px;overflow:hidden}' +
  '.kfc-bar i{display:block;height:100%;width:var(--v);background:var(--k-sea,#155C75)}.kfc .k-alert{margin:12px 0}.kfc-fine{font-size:var(--k-fs-xs,13px);color:var(--k-muted,#56636F)}.kfc-links a{margin-inline-end:16px}.kfc-fig{margin:14px 0;direction:ltr}.kfc-fig svg{width:100%;height:auto;max-width:640px;display:block}' +
  '.kfc-fig figcaption{font-size:var(--k-fs-xs,13px);color:var(--k-muted)}.kfc-ln{fill:none;stroke:var(--k-sea,#155C75);stroke-width:2.5}.kfc-bd{fill:var(--k-sea-soft,#DCEBF0);stroke:none}.kfc-gr{stroke:var(--k-line,#D5DBD8);stroke-width:1}.kfc-tx{fill:var(--k-muted,#56636F);font-size:12px;font-family:inherit}' +
  '.kfc-m{max-width:860px}.kfc-m h2{font-size:var(--k-fs-2xl,28px);margin:0 0 8px}.kfc .k-table-wrap{margin:12px 0}.kfc .k-table td.n,.kfc .k-table th.n{text-align:end}' +
  '@media(max-width:640px){.kfc{padding:16px}.kfc-bar{width:48px}}</style>';
function rowsTable(rows, lang, rel, prj, kt) {
  if (!rows.length) return '';
  const lbl = r => rel ? (r.k === 0 ? t(lang, 'k0') : t(lang, 'kn', { m: r.k })) : esc(monthName(prj.first + r.k, lang)) + ' <small class="kfc-fine">(' + esc(r.k === 0 ? t(lang, 'k0') : t(lang, 'kn', { m: r.k })) + ')</small>';
  return (kt ? '<div class="k-table-wrap"><table class="k-table k-table--dense"><thead><tr><th scope="col">' : '<div class="tw"><table><thead><tr><th>') + esc(t(lang, 'th_by')) + '</th><th class="n">' + esc(t(lang, 'th_p')) + '</th><th class="n">' + esc(t(lang, 'th_ci')) + '</th></tr></thead><tbody>' +
    rows.map(r => '<tr><td>' + (rel ? esc(lbl(r)) : lbl(r)) + '</td><td class="n">' + pct(r.p, lang) + '<span class="kfc-bar" aria-hidden="true"><i style="--v:' + Math.round(r.p * 100) + '%"></i></span></td><td class="n">' + pct(r.lo, lang) + ' - ' + pct(r.hi, lang) + '</td></tr>').join('') + '</tbody></table></div>';
}
function gLine(g, lang) { return t(lang, g.level === 'developer' ? 'g_dev' : g.level === 'all' ? 'g_all' : 'g_mk', { n: nf(g.n, lang), k: nf(g.k, lang), g: g.name }); }
const srcMark = (fc, lang) => '<a class="k-src src" href="/data/promises.json">' + esc(t(lang, 'src')) + ', ' + esc(dayName(fc.updated, lang)) + '</a>';
export function fcProjectHtml(fc, x, lang, devGroup) {
  try {
    const o = projectFc(fc, x.id, devGroup); if (!o) return '';
    let b = '<div class="kfc" id="forecast"><h3>' + esc(t(lang, 'fc_h')) + '</h3><p class="ki">' + esc(t(lang, 'fc_intro')) + '</p>';
    if (o.status === 'none') return b + '<p class="k-muted">' + esc(t(lang, 'none')) + '</p></div>' + FC_CSS;
    if (o.status === 'done') return b + '<p class="k-muted">' + esc(t(lang, 'done')) + '</p></div>' + FC_CSS;
    b += '<p>' + esc(t(lang, 'fc_first', { d: monthName(mi(o.first), lang) })) + (o.current && o.current !== o.first ? ' ' + esc(t(lang, 'fc_cur', { d: monthName(mi(o.current), lang) })) : '') + ' ' + srcMark(fc, lang) + '</p>';
    if (o.status === 'excluded') return b + '<p class="k-muted">' + esc(t(lang, 'excl1')) + '</p>' + methodLink(lang) + '</div>' + FC_CSS;
    const cond = o.months_since_first >= 0 ? '<p>' + esc(t(lang, 'cond', { m: nf(o.months_since_first, lang) })) + '</p>' : '';
    if (o.group) b += '<p>' + esc(gLine(o.group, lang)) + '</p>' + cond + (rowsTable(o.rows, lang, false, { first: mi(o.first) }) || '');
    else {
      const m = o.market;
      b += '<div class="k-alert" role="status"><span>' + esc(t(lang, 'nd', { g: m.name, n: nf(m.n, lang), k: nf(m.k, lang), N: MIN_N, K: MIN_K })) + '</span></div>';
      return b + methodLink(lang) + '</div>' + FC_CSS;   // named pages show no pooled figure: the all-markets context lives on the method and market pages
    }
    if (o.beyond != null && o.rows.length) b += '<p class="kfc-fine">' + esc(t(lang, 'beyond', { m: o.beyond })) + '</p>';
    else if (!o.rows.length) b += '<p class="kfc-fine">' + esc(t(lang, 'beyond', { m: Math.max(0, o.months_since_first) })) + '</p>';
    return b + '<p class="kfc-fine">' + esc(t(lang, 'bias')) + '</p>' + methodLink(lang) + '</div>' + FC_CSS;
  } catch (e) { return ''; }
}
const methodLink = lang => '<p class="kfc-fine kfc-links"><a href="' + pre(lang) + '/methods/delivery-forecast/">' + esc(t(lang, 'method')) + '</a> <a href="/api/x/fc/curves">' + esc(t(lang, 'm_api')) + '</a></p>';

function curveSvg(g, lang) {   // step curve of the share handed over (1 - S) with its 95% band, 0 to 24 months
  const W = 640, H = 250, L = 46, Rr = 14, T = 14, Bt = 40, maxK = 24;
  const top = Math.max(.2, Math.ceil(Math.max(0, ...g.steps.filter(s => s.t <= maxK).map(s => 1 - s.S * Math.exp(-Z * Math.sqrt(s.v)))) * 10 + .5) / 10), yT = [0, .25, .5, .75, 1].map(f => f * Math.min(1, top));
  const X = m => L + (W - L - Rr) * m / maxK, Y = p => T + (H - T - Bt) * (1 - p / Math.min(1, top));
  const lim = KS.slice().reverse().find(k => risk(g.R, k) >= MIN_R); const end = lim == null ? 0 : Math.min(maxK, Math.max(lim, ...g.steps.filter(s => s.t <= maxK && s.n >= MIN_R).map(s => s.t)));
  const pts = [{ t: 0, S: 1, v: 0 }, ...g.steps.filter(s => s.t <= end)];
  let line = '', up = [], dn = [];
  pts.forEach((s, i) => {
    const nx = i + 1 < pts.length ? pts[i + 1].t : end, F = 1 - s.S, se = Math.sqrt(s.v);
    const lo = 1 - Math.min(1, s.S * Math.exp(Z * se)), hi = 1 - Math.max(0, s.S * Math.exp(-Z * se));
    line += (i ? 'L' : 'M') + X(s.t).toFixed(1) + ' ' + Y(F).toFixed(1) + 'L' + X(nx).toFixed(1) + ' ' + Y(F).toFixed(1);
    up.push(X(s.t).toFixed(1) + ' ' + Y(hi).toFixed(1), X(nx).toFixed(1) + ' ' + Y(hi).toFixed(1)); dn.unshift(X(nx).toFixed(1) + ' ' + Y(lo).toFixed(1), X(s.t).toFixed(1) + ' ' + Y(lo).toFixed(1));
  });
  const gy = yT.map(p => '<line class="kfc-gr" x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(p).toFixed(1) + '" y2="' + Y(p).toFixed(1) + '"/><text class="kfc-tx" x="' + (L - 6) + '" y="' + (Y(p) + 4).toFixed(1) + '" text-anchor="end">' + Math.round(p * 100) + '%</text>').join('');
  const gx = KS.map(k => '<text class="kfc-tx" x="' + X(k).toFixed(1) + '" y="' + (H - Bt + 18) + '" text-anchor="middle">' + k + '</text>').join('');
  return '<figure class="kfc-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t(lang, 'm_curve')) + '">' + gy + gx +
    '<polygon class="kfc-bd" points="' + up.concat(dn).join(' ') + '"/><path class="kfc-ln" d="' + line + '"/>' +
    '<text class="kfc-tx" x="' + ((L + W - Rr) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(t(lang, 'm_ax_x')) + '</text></svg><figcaption>' + esc(t(lang, 'm_curve')) + '</figcaption></figure>';
}
export async function fcMarketHtml(env, marketKey) {   // English: /m/<market>/ pages are English-only
  try {
    const fc = await fcData(env), lang = 'en';
    const key = String(marketKey || '').toLowerCase().replace(/-/g, ' ');
    const g = [...fc.markets.values()].find(m => String(m.name).toLowerCase() === key || encodeURIComponent(String(m.name).toLowerCase().replace(/\s+/g, '-')) === String(marketKey).toLowerCase());
    if (!g || COI.test(g.name)) return '';
    let b = '<section class="sec" id="forecast"><div class="wrap"><div class="kfc kfc-m"><h2>' + esc(t(lang, 'fc_h')) + ': ' + esc(g.name) + '</h2><p>' + esc(t(lang, 'fc_intro')) + '</p>';
    if (g.enough) b += '<p>' + esc(gLine(g, lang)) + ' ' + srcMark(fc, lang) + '</p>' + rowsTable(g.by.filter(Boolean), lang, true, null, 1) + curveSvg(g, lang);
    else b += '<div class="k-alert" role="status"><span>' + esc(t(lang, 'nd', { g: g.name, n: g.n, k: g.k, N: MIN_N, K: MIN_K })) + '</span></div><p><b>For context only, all markets pooled:</b> ' + fc.all.n + ' projects whose first promised handover has passed; ' + fc.all.k + ' recorded as handed over. This is not an estimate for ' + esc(g.name) + '. ' + srcMark(fc, lang) + '</p>' + rowsTable(fc.all.by.filter(Boolean), lang, true, null, 1);
    return b + '<p class="kfc-fine">' + esc(t(lang, 'bias')) + '</p>' + methodLink(lang) + '</div></div></section>' + FC_CSS;
  } catch (e) { return ''; }
}

// ------------------------------------------------------------------------------------------------ developer answer speed
// n18e (batch 18): read live at request time from the existing public aggregate functions (no new DB objects), 10 min memo;
// the 8 Nov snapshot file /data/dev-response.json is only the fallback when the database does not answer. /data/dev-response.json
// itself is served live by the worker (devResponseJson), so the public file refreshes on its own too.
let RS_LIVE = null;
export async function rsData(env) {
  if (RS_LIVE && Date.now() - RS_LIVE.t < 600000) return RS_LIVE.v;
  try {
    const [ya, dr] = await Promise.all([rpc('kolaboro_y_asks_public', {}), rpc('kolaboro_devreply_public', { p_id: '' })]);
    if (!ya || typeof ya !== 'object' || !Array.isArray(dr)) throw new Error('shape');
    const projects = {}, replies = {};
    for (const g of ya.groups || []) if (g.grp === 'project') projects[g.key] = { reported: g.n || 0, answered: g.answered || 0, median_days: g.median_days == null ? null : +g.median_days };
    for (const r of dr) { if (!r || !r.project_id) continue; const o = replies[r.project_id] || (replies[r.project_id] = { approved: 0 }); o.approved++; }
    const v = { version: 'dev-response-live-1', generated: new Date().toISOString(), live: true,
      job: 'computed live by the kolaboro.com worker from the public aggregate functions kolaboro_y_asks_public and kolaboro_devreply_public (10 minute cache)',
      sources: { asks: 'kolaboro_y_asks_public: questions a buyer sent from /ask-developer/ and later reported back (answered or not, and the day); a project is broken out from ' + (ya.min_sample || 5) + ' reported questions', replies: 'kolaboro_devreply_public: right-of-reply submissions approved by a moderator (newest 200)' },
      note: 'Counts and day medians per project id only. No messages, emails, names, tokens or IP hashes. Developer pages add these up over the developer’s projects.',
      licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', min_reported_per_project: ya.min_sample || 5,
      totals: { asks_opened: ya.opened || 0, asks_reported: ya.reported || 0, projects_below_min: ya.projects_below_min || 0, replies_approved: dr.length }, projects, replies };
    RS_LIVE = { t: Date.now(), v }; return v;
  } catch (e) {
    try { const v = await file(env, 'dev-response.json', 600000); RS_LIVE = { t: Date.now() - 480000, v }; return v; } catch (e2) { return null; }
  }
}
export async function devResponseJson(env) {   // GET /data/dev-response.json (live; same fields as the 8 Nov snapshot plus "live")
  const v = await rsData(env);
  if (!v) return out({ error: 'unavailable' }, 503, 'no-store');
  return new Response(JSON.stringify(v, null, 1), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=300', 'x-kb-live': '1' } });
}
function rsAgg(rs, ids) {
  const o = { opened: 0, reported: 0, answered: 0, days: [], replies: 0 };
  o.meds = [];
  for (const id of ids) { const a = (rs.projects || {})[id]; if (a) { o.opened += a.opened || 0; o.reported += a.reported || 0; o.answered += a.answered || 0; o.days.push(...(a.days || [])); if (a.median_days != null && !a.days) o.meds.push({ id, m: a.median_days, n: a.reported }); } const r = (rs.replies || {})[id]; if (r) o.replies += r.approved || 0; }
  o.days.sort((a, b) => a - b);
  if (o.meds.length === 1) o.median_days = o.meds[0].m;   // live data: one project broken out, its median is exact
  else if (!o.meds.length) o.median_days = o.days.length >= RS_MIN ? (o.days.length % 2 ? o.days[(o.days.length - 1) / 2] : (o.days[o.days.length / 2 - 1] + o.days[o.days.length / 2]) / 2) : null;
  else o.median_days = null;   // several projects broken out: their medians are listed, not merged
  return o;
}
export function rsDevHtml(rs, dv, lang, firstId) {
  try {
    if (!rs) return '';
    const a = rsAgg(rs, dv.ids), name = dv.n;
    const src = '<a class="k-src src" href="/data/dev-response.json">' + esc(t(lang, rs.live ? 'rs_live' : 'rs_at', { d: dayName(rs.generated, lang) })) + '</a>';
    let b = '<p class="ki">' + esc(t(lang, 'rs_intro')) + '</p>';
    if (!a.reported && !a.replies) b += '<div class="k-empty"><strong>' + esc(t(lang, rs.live && rs.totals && rs.totals.projects_below_min ? 'rs_few' : 'rs_none', { dev: name, k: rs.min_reported_per_project || RS_MIN })) + '</strong><p>' + src + '</p><a class="k-btn" href="/ask-developer/?id=' + encodeURIComponent(firstId) + '">' + esc(t(lang, 'rs_btn', { dev: name })) + '</a></div>';
    else b += '<dl class="k-ledger"><dt>' + esc(t(lang, 'rs_q')) + '</dt><dd>' + nf(a.reported, lang) + ' ' + src + '</dd><dt>' + esc(t(lang, 'rs_a')) + '</dt><dd>' + nf(a.answered, lang) + '</dd><dt>' + esc(t(lang, 'rs_med')) + '</dt><dd>' + (a.median_days != null ? nf(a.median_days, lang) : a.meds && a.meds.length > 1 ? a.meds.map(x => nf(x.m, lang) + ' <small class="k-muted">(' + esc(x.id) + ')</small>').join(', ') : '<span class="k-muted">' + esc(t(lang, 'rs_min', { k: RS_MIN })) + '</span>') + '</dd><dt>' + esc(t(lang, 'rs_rr')) + '</dt><dd>' + nf(a.replies, lang) + '</dd></dl>' +
      '<p><a class="k-btn" href="/ask-developer/?id=' + encodeURIComponent(firstId) + '">' + esc(t(lang, 'rs_btn', { dev: name })) + '</a></p>';
    return b + '<div class="k-disc"><details><summary>' + esc(t(lang, 'rs_method')) + '</summary><p>' + esc(t(lang, 'rs_meth_t', { k: RS_MIN })) + '</p></details></div>';
  } catch (e) { return ''; }
}
export const rsHeading = lang => t(lang, 'rs_h');
export async function fcDevGroup(env, slug) { try { const fc = await fcData(env), d = await devGroups(env, fc); return d.get(slug) || null; } catch (e) { return null; } }

// ------------------------------------------------------------------------------------------------ /open data
// n20p: /open made six database calls on every view (about 1 s before the first byte). The figures are now kept for 60 s per
// isolate and at the edge; a copy up to 10 minutes old is answered at once and refreshed in the background. The page prints the
// time the figures were read ("generated"), so a reader always sees how old they are.
let ON = null, ON_BUSY = null;
const ON_KEY = ORIGIN + '/__fc_open/v1', ON_FRESH = 60000, ON_STALE = 600000;
async function openNumbers(env, ctx) {
  const age = v => Date.now() - Date.parse(v.generated);
  const load = () => ON_BUSY || (ON_BUSY = openNumbers0(env).then(v => {
    ON = v; ON_BUSY = null;
    try { const p = caches.default.put(new Request(ON_KEY), new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + ON_STALE / 1000 } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); } catch (e) {}
    return v;
  }, e => { ON_BUSY = null; throw e; }));
  if (!ON || age(ON) > ON_FRESH) { try { const hit = await caches.default.match(new Request(ON_KEY)); if (hit) { const v = await hit.json(); if (v && v.generated && (!ON || Date.parse(v.generated) > Date.parse(ON.generated))) ON = v; } } catch (e) {} }
  if (ON && age(ON) <= ON_FRESH) return ON;
  if (ON && age(ON) <= ON_STALE && ctx && ctx.waitUntil) { ctx.waitUntil(load().catch(() => {})); return ON; }
  return load();
}
async function openNumbers0(env) {
  const S = p => p.then(v => ({ ok: true, v }), () => ({ ok: false, v: null }));
  const [xl, met, push, al, log, tr, dep, ship, nmod, xl7] = await Promise.all([S(rpc('kolaboro_xray_live', { p_hours: 24 })), S(rpc('kolaboro_metrics_public', {})), S(rpc('kolaboro_push_public', {})),
    S(rpc('kolaboro_y_alerts_public', {})), S(rpc('kolaboro_log_public', {})), S(file(env, 'traction.json', 120000)), S(file(env, 'deploys.json', 120000)), S(file(env, 'shipping.json', 120000)), S(import('./kbx_named.js')), S(rpc('kolaboro_xray_live', { p_hours: 168 }))]);
  let named = null; if (nmod.ok) try { const ix = await nmod.v.data(env); named = { projects: ix.P.length, developers: ix.devs.size, languages: LANGS.length }; } catch (e) { named = null; }
  let seal = null; try { const cs = await file(env, 'bali-cases.json'); seal = cs.seal ? { date: cs.seal.date, count: cs.seal.count } : null; } catch (e) {}
  const m = met.ok && met.v ? met.v : null;   // read from this function: stamps, followers and (n18e, authorised by Carlos 8 Nov 2026) the paid-check COUNT; revenue fields are never read
  const weeksSt = m && Array.isArray(m.weeks) ? new Map(m.weeks.map(w => [w.week, w.stamps])) : new Map();
  const T = tr.ok ? tr.v : null, X = xl.ok && xl.v ? xl.v.totals || null : null;
  const wk = new Date(); wk.setUTCHours(0, 0, 0, 0); wk.setUTCDate(wk.getUTCDate() - ((wk.getUTCDay() + 6) % 7)); const thisWeek = wk.toISOString().slice(0, 10);
  const ser = k => new Map(((T && T.series && T.series[k]) || []).map(([w, n]) => [w, n]));
  const xs = ser('xrays_sealed'), xr = ser('xray_runs'), stH = ser('bitcoin_stamps');
  // n18e (batch 18): the weekly history refreshes on its own. A history week counts as complete only when the history was computed
  // after that week ended (complete_until per series, else the file's "generated" time); the 8 Nov snapshot's last week was partial.
  // Weeks after the last complete one are counted live from the public function kolaboro_xray_live: this week from its 7-day list
  // (exact while the list is under its 120-row cap), one closed week in between as the all-time total minus every other week.
  // Two or more such weeks cannot be split exactly and read "Not measured yet" until the daily history job freezes them.
  const DAY = 864e5, wkT = w => Date.parse(w + 'T00:00:00Z'), wkS = d => new Date(d).toISOString().slice(0, 10), tW = wkT(thisWeek);
  const upto = k => { const c = T && T.complete_until && T.complete_until[k]; return (c ? wkT(c) : T ? Date.parse(T.generated) : 0) || 0; };
  const full = (k, w) => wkT(w) + 7 * DAY <= upto(k);
  const xsF = new Map([...xs].filter(([w]) => full('xrays_sealed', w)));
  const R7 = xl7 && xl7.ok && xl7.v && Array.isArray(xl7.v.recent) ? xl7.v.recent : null;
  const thisN = R7 && (R7.length < 120 || R7.some(r => Date.parse(r.t) < tW)) ? R7.filter(r => Date.parse(r.t) >= tW).length : null;
  const lastFull = [...xsF.keys()].sort().pop(), gap = [];
  if (lastFull) for (let d = wkT(lastFull) + 7 * DAY; d < tW; d += 7 * DAY) gap.push(wkS(d));
  const all = X && typeof X.all === 'number' ? X.all : null, sumF = [...xsF.values()].reduce((a, n) => a + n, 0), derived = new Map();
  if (all != null && lastFull) {
    if (!gap.length) derived.set(thisWeek, Math.max(0, all - sumF));
    else if (gap.length === 1 && thisN != null) { derived.set(gap[0], Math.max(0, all - sumF - thisN)); derived.set(thisWeek, thisN); }
    else if (thisN != null) derived.set(thisWeek, thisN);
  }
  const D = dep.ok ? (dep.v.deploys || []) : [];
  const depW = new Map(); for (const d of D) { if (!d.at || d.result === 'not_deployed') continue; const x = new Date(d.at.slice(0, 10) + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); const k = x.toISOString().slice(0, 10); depW.set(k, (depW.get(k) || 0) + 1); }
  let weeks = [...new Set([...xs.keys(), ...weeksSt.keys(), ...gap, thisWeek])].filter(w => w <= thisWeek).sort().slice(-12);
  const sealedOf = w => xsF.has(w) ? xsF.get(w) : derived.has(w) ? derived.get(w) : null;
  const busy = w => (sealedOf(w) || 0) + (weeksSt.get(w) || 0) + (depW.get(w) || 0) + (xr.get(w) || 0) > 0;
  const f0 = weeks.findIndex(busy); weeks = weeks.slice(f0 < 0 ? weeks.length - 1 : f0).slice(-8);   // from the first week with any activity
  const runsTo = T ? String(T.generated).slice(0, 10) : null;
  const rows = weeks.map(w => ({ week: w, current: w === thisWeek,
    xrays_sealed: sealedOf(w), xrays_sealed_from: xsF.has(w) ? 'weekly history' : derived.has(w) ? 'live (kolaboro_xray_live)' : undefined,
    xray_runs: xr.has(w) ? xr.get(w) : null, xray_runs_partial_until: xr.has(w) && !full('xray_runs', w) ? runsTo : undefined,
    bitcoin_stamps: weeksSt.has(w) ? weeksSt.get(w) : full('bitcoin_stamps', w) && stH.has(w) ? stH.get(w) : null, deploys_checked_live: depW.get(w) || 0 }));
  // what the daily history job (.github/workflows/kolaboro-open-history.yml on main) may freeze into /data/traction.json: closed weeks only
  const unknown = gap.filter(w => !derived.has(w)), cu = unknown.length ? unknown[0] : thisWeek;
  const freeze = { complete_until: { xrays_sealed: cu, bitcoin_stamps: thisWeek }, xrays_sealed: [...derived].filter(([w]) => w < cu), bitcoin_stamps: [...weeksSt].filter(([w]) => w < thisWeek) };
  const sh = ship.ok ? ship.v : null, ctl = sh && sh.metrics && sh.metrics.commit_to_live;
  const d7 = Date.now() - 7 * 864e5, dep7 = D.filter(d => d.at && Date.parse(d.at) >= d7 && d.result !== 'not_deployed');
  const heads = log.ok && log.v && Array.isArray(log.v.heads) ? log.v.heads : [];
  return {
    generated: new Date().toISOString(), version: 'open-1', note: 'Aggregates only. The paying-customer figure is a count; revenue amounts are not published.',
    xrays: { sealed_total: X ? X.all : null, last_24h: X ? X.h24 : null, markets_24h: X ? X.markets : null, source: '/live/xrays/ (public function kolaboro_xray_live)' },
    pages: Object.assign({ source: '/api/seo/urls' }, named || { projects: null, developers: null, languages: LANGS.length }),
    watching: { email: m && m.totals ? m.totals.followers : null, push_devices: push.ok && push.v ? push.v.devices : null, saved_alerts: al.ok && al.v ? al.v.live : null, source: 'public functions kolaboro_metrics_public (followers only), kolaboro_push_public, kolaboro_y_alerts_public' },
    sealed: { log_days: heads.length || (T && T.totals ? T.totals.log_days : null), log_first: heads.length ? heads.map(h => h.day).sort()[0] : (T && T.totals ? T.totals.log_first : null),
      projects_in_todays_root: seal ? seal.count : null, root_date: seal ? seal.date : null, bitcoin_stamps: m && m.totals ? m.totals.stamps : null, stamps_confirmed: m && m.totals ? m.totals.stamps_confirmed : null, source: '/log/ and /api/open/log' },
    shipping: { ships_last_7_days: sh && sh.totals ? sh.totals.ships_last_7_days : null, streak_days: sh && sh.streak ? sh.streak.current : null, as_of: sh ? sh.generated_at : null,
      deploys_last_7_days: dep7.length, rollbacks_last_7_days: dep7.filter(d => d.result === 'rolled_back').length,
      commit_to_live_median_s: ctl ? ctl.median_s : null, commit_to_live_p90_s: ctl ? ctl.p90_s : null, commit_to_live_samples: ctl ? ctl.samples : null, source: '/shipping/ (/data/shipping.json, /data/deploys.json)' },
    customers: { paid_checks: m && m.totals && typeof m.totals.paid_checks === 'number' ? m.totals.paid_checks : null, source: 'public function kolaboro_metrics_public (count of payments recorded for a paid check; authorised by Carlos on 8 Nov 2026)', note: 'A count only. Revenue amounts are not published.' },
    weeks: rows, weekly_history: T ? { generated: T.generated, complete_until: T.complete_until || null, file: '/data/traction.json' } : null, history_update: freeze,
    caveats: ['X-ray counts include runs by the Kolaboro team while testing; they are not separated yet.', 'Sealed X-rays for weeks after the weekly history are counted live from the public function kolaboro_xray_live (see history_update). X-ray runs come only from the weekly history job; a week it has not completed is marked partial.']
  };
}

// ------------------------------------------------------------------------------------------------ pages
const PG_CSS = '<style id="kfc17p">.kfc-pg .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kfc-pg h1{max-width:20ch}.kfc-pg .lead{max-width:62ch;color:var(--k-ink-2)}.kfc-pg h2{margin:0 0 var(--k-3,12px)}' +
  '.kfc-pg .k-sec{padding-block:var(--k-6,32px)}.kfc-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:0;border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);background:var(--k-surface);overflow:hidden}' +
  '.kfc-stats>div{padding:18px 20px;box-shadow:inset -1px -1px 0 var(--k-line)}.kfc-stats b{display:block;font-size:var(--k-fs-3xl,36px);line-height:1.05;font-weight:700;font-variant-numeric:tabular-nums;color:var(--k-ink)}.kfc-stats span{display:block;font-weight:600;margin-top:4px}.kfc-stats small{display:block;color:var(--k-muted);margin-top:2px;font-size:var(--k-fs-sm,15px)}' +
  '.kfc-stats .k-src{display:inline-flex;margin-top:8px}.kfc-pg td.k-n,.kfc-pg th.k-n{text-align:end}.kfc-wk{display:inline-block;vertical-align:middle;height:8px;border-radius:4px;background:var(--k-sea,#155C75);margin-inline-start:8px;min-width:2px}.kfc-pg tr.is-now td{background:var(--k-sea-soft)}' +
  '.kfc-pg .k-ledger dd{font-variant-numeric:tabular-nums}.kfc-pg .kfc-fine{font-size:var(--k-fs-xs,13px);color:var(--k-muted)}.kfc-meth p,.kfc-meth ul{max-width:68ch;line-height:1.6}.kfc-meth h2{font-size:var(--k-fs-xl,24px);margin:var(--k-6,32px) 0 var(--k-2,8px)}.kfc-meth h2:first-child{margin-top:0}.kfc-pg .kfc-links a{margin-inline-end:16px}.kfc-stats--one{max-width:420px}@media(max-width:640px){.kfc-stats b{font-size:var(--k-fs-2xl,28px)}}</style>';
const dur = (s, lang) => s == null ? t(lang, 'o_none') : s >= 90 ? nf(Math.round(s / 6) / 10, lang) + ' ' + t(lang, 'min') : nf(s, lang) + ' ' + t(lang, 's');
const N = (v, lang) => v == null ? '<span class="k-muted">' + esc(t(lang, 'o_none')) + '</span>' : nf(v, lang);
function openBody(d, lang) {
  const src = (h, l) => '<a class="k-src" href="' + esc(h) + '">' + esc(l) + '</a>';
  const stat = (v, label, sub, s) => '<div><b>' + (v == null ? '-' : nf(v, lang)) + '</b><span>' + esc(label) + '</span>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + s + '</div>';
  const w = d.watching, p = d.pages, sh = d.shipping, se = d.sealed;
  const watchN = [w.email, w.push_devices, w.saved_alerts].every(x => x == null) ? null : (w.email || 0) + (w.push_devices || 0) + (w.saved_alerts || 0);
  const ctlTxt = sh.commit_to_live_median_s == null ? null : dur(sh.commit_to_live_median_s, lang);
  const stats = '<div class="kfc-stats">' +
    stat(d.xrays.sealed_total, t(lang, 'c_xr'), d.xrays.last_24h != null ? t(lang, 'c_xr24', { n: nf(d.xrays.last_24h, lang) }) : '', src(pre(lang) + '/live/xrays/', 'kolaboro.com/live/xrays')) +
    stat(p.projects != null ? p.projects * p.languages : null, t(lang, 'c_pages'), p.projects != null ? t(lang, 'c_pages_s', { p: nf(p.projects, lang), d: nf(p.developers, lang), l: p.languages }) : '', src(pre(lang) + '/projects/', 'kolaboro.com/projects')) +
    stat(watchN, t(lang, 'c_watch'), t(lang, 'c_watch_s', { e: nf(w.email || 0, lang), p: nf(w.push_devices || 0, lang), a: nf(w.saved_alerts || 0, lang) }), src('/api/x/fc/open', 'kolaboro.com/api/x/fc/open')) +
    '<div><b>' + (ctlTxt ? esc(ctlTxt) : '-') + '</b><span>' + esc(t(lang, 'c_ctl')) + '</span><small>' + esc(t(lang, 'c_ctl_s', { p: dur(sh.commit_to_live_p90_s, lang), n: nf(sh.commit_to_live_samples || 0, lang) })) + '</small>' + src('/shipping/', 'kolaboro.com/shipping') + '</div></div>';
  const maxX = Math.max(1, ...d.weeks.map(r => r.xrays_sealed || 0));
  const wkRows = d.weeks.slice().reverse().map(r => '<tr' + (r.current ? ' class="is-now"' : '') + '><td data-label="' + esc(t(lang, 'th_week')) + '">' + esc(dayName(r.week, lang)) + (r.current ? ' <small class="k-muted">(' + esc(t(lang, 'o_this')) + ')</small>' : '') + '</td>' +
    '<td class="k-n" data-label="' + esc(t(lang, 'th_xr')) + '">' + N(r.xrays_sealed, lang) + (r.xrays_sealed ? '<span class="kfc-wk" aria-hidden="true" style="width:' + Math.round(64 * r.xrays_sealed / maxX) + 'px"></span>' : '') + '</td>' +
    '<td class="k-n" data-label="' + esc(t(lang, 'th_runs')) + '">' + N(r.xray_runs, lang) + (r.xray_runs != null && r.xray_runs_partial_until ? ' <small class="k-muted">' + esc(t(lang, 'o_partial', { d: dayName(r.xray_runs_partial_until, lang) })) + '</small>' : '') + '</td><td class="k-n" data-label="' + esc(t(lang, 'th_st')) + '">' + N(r.bitcoin_stamps, lang) + '</td><td class="k-n" data-label="' + esc(t(lang, 'th_dep')) + '">' + N(r.deploys_checked_live, lang) + '</td></tr>').join('');
  const week = '<div class="k-table-wrap"><table class="k-table k-table--stack"><thead><tr><th scope="col">' + esc(t(lang, 'th_week')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'th_xr')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'th_runs')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'th_st')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'th_dep')) + '</th></tr></thead><tbody>' + wkRows + '</tbody></table></div>' +
    '<p class="kfc-fine">' + esc(t(lang, 'o_note_test')) + ' ' + esc(t(lang, 'o_auto')) + ' ' + src('/data/traction.json', '/data/traction.json') + ' ' + src('/data/deploys.json', '/data/deploys.json') + '</p>';
  const kv = (key, vals, h, l, extra) => { const full = t(lang, key, vals), k = full.search(/[:：]/); return '<dt>' + esc(k < 0 ? full : full.slice(0, k).trim()) + '</dt><dd>' + esc(k < 0 ? '' : full.slice(k + 1).trim()) + (extra || '') + ' ' + src(h, l) + '</dd>'; };
  const nn = v => v == null ? t(lang, 'o_none') : nf(v, lang);
  const sealed = '<dl class="k-ledger">' + kv('s_log', { n: nn(se.log_days), d: dayName(se.log_first, lang) }, '/log/', 'kolaboro.com/log') +
    kv('s_seal', { n: nn(se.projects_in_todays_root) }, '/verify', 'kolaboro.com/verify', se.root_date ? ' <small class="k-muted">' + esc(dayName(se.root_date, lang)) + '</small>' : '') +
    kv('s_st', { n: nn(se.bitcoin_stamps), c: nn(se.stamps_confirmed) }, '/log/', 'kolaboro.com/log') + '</dl>';
  const ship = '<dl class="k-ledger">' + kv('sh_7', { n: nn(sh.ships_last_7_days) }, '/shipping/', 'kolaboro.com/shipping') + kv('sh_streak', { n: nn(sh.streak_days) }, '/shipping/', 'kolaboro.com/shipping') +
    kv('sh_dep', { n: nf(sh.deploys_last_7_days, lang), f: nf(sh.rollbacks_last_7_days, lang) }, '/data/deploys.json', '/data/deploys.json') + '</dl>' + (sh.as_of ? '<p class="kfc-fine">' + esc(t(lang, 'rs_at', { d: dayName(sh.as_of, lang) })) + '</p>' : '');
  // n18e (batch 18): paying customers as a COUNT (Carlos authorised it on 8 Nov 2026). Revenue amounts stay unpublished: never read them here.
  const cu = d.customers || {};
  const slot = '<section class="k-sec" id="customers" data-slot="customers"><div class="k-wrap"><h2>' + esc(t(lang, 'o_s_cust')) + '</h2><div class="kfc-stats kfc-stats--one">' +
    stat(cu.paid_checks, t(lang, 'c_cust'), t(lang, 'c_cust_s'), src('/api/x/fc/open', 'kolaboro.com/api/x/fc/open')) + '</div><p class="kfc-fine">' + esc(t(lang, 'c_cust_n')) + '</p></div></section>';
  const upd = t(lang, 'o_upd', { t: d.generated.slice(11, 16), d: d.weekly_history ? dayName(d.weekly_history.generated, lang) : t(lang, 'o_none') });
  return '<div class="kfc-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(t(lang, 'o_h1')) + '</h1><p class="lead">' + esc(t(lang, 'o_lead')) + '</p><p class="kfc-fine"><time datetime="' + esc(d.generated) + '">' + esc(upd) + '</time></p></div>' +
    '<h2>' + esc(t(lang, 'o_s_now')) + '</h2>' + stats + '</div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'o_s_week')) + '</h2>' + week + '</div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'o_s_seal')) + '</h2>' + sealed + '</div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'o_s_ship')) + '</h2>' + ship + '</div></section>' + slot +
    '<section class="k-sec"><div class="k-wrap kfc-meth"><h2>' + esc(t(lang, 'o_s_src')) + '</h2><p>' + esc(t(lang, 'o_src_t')) + '</p><p class="kfc-links"><a href="/api/x/fc/open">/api/x/fc/open</a> <a href="/data/traction.json">/data/traction.json</a> <span>CC BY 4.0</span></p></div></section></div>';
}
function methodBody(fc, lang) {
  const rows = [fc.all, ...[...fc.markets.values()].filter(g => g.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))];
  const tbl = rows => '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr><th scope="col">' + esc(t(lang, 'm_th_g')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'm_th_n')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'm_th_k')) + '</th><th scope="col">' + esc(t(lang, 'm_th_st')) + '</th></tr></thead><tbody>' +
    rows.map(g => '<tr><td data-label="' + esc(t(lang, 'm_th_g')) + '">' + (g.level === 'all' ? '<b>' + esc(t(lang, 'm_all')) + '</b>' : '<a href="/m/' + encodeURIComponent(String(g.name).toLowerCase().replace(/\s+/g, '-')) + '/#forecast"><span lang="en">' + esc(g.name) + '</span></a>') + '</td><td class="k-n" data-label="' + esc(t(lang, 'm_th_n')) + '">' + nf(g.n, lang) + '</td><td class="k-n" data-label="' + esc(t(lang, 'm_th_k')) + '">' + nf(g.k, lang) + '</td><td data-label="' + esc(t(lang, 'm_th_st')) + '">' +
      (g.level === 'all' ? '<span class="k-badge k-badge--info">' + esc(t(lang, 'm_all')) + '</span>' : g.enough ? '<span class="k-badge k-badge--ok">' + esc(t(lang, 'm_ok')) + '</span>' : '<span class="k-badge k-badge--plain">' + esc(t(lang, 'm_nd')) + '</span>') + '</td></tr>').join('') + '</tbody></table></div>';
  const tb = tbl(rows.slice(0, 13)) + (rows.length > 13 ? '<div class="k-disc"><details><summary>+' + nf(rows.length - 13, lang) + '</summary>' + tbl(rows.slice(13)) + '</details></div>' : '');
  const P = (h, p) => '<h2>' + esc(t(lang, h)) + '</h2><p>' + esc(p) + '</p>';
  return '<div class="kfc-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <a href="/index/delays/">' + esc(t(lang, 'm_crumb')) + '</a></p><h1>' + esc(t(lang, 'm_title')) + '</h1><p class="lead">' + esc(t(lang, 'm_lead')) + '</p></div>' +
    '<div class="kfc kfc-m">' + curveSvg(fc.all, lang) + '<p>' + esc(gLine(fc.all, lang)) + ' ' + srcMark(fc, lang) + '</p>' + rowsTable(fc.all.by.filter(Boolean), lang, true, null, 1) + '<p class="kfc-fine">' + esc(t(lang, 'bias')) + '</p></div></div></section>' +
    '<section class="k-sec"><div class="k-wrap kfc-meth">' + P('m_h_data', t(lang, 'm_data')) + P('m_h_time', t(lang, 'm_time')) + '<p class="kfc-fine">' + esc(t(lang, 'm_excl', { n: nf(fc.cnt.excluded, lang) })) + '</p>' + P('m_h_est', t(lang, 'm_est')) +
    P('m_h_rule', t(lang, 'm_rule', { N: MIN_N, K: MIN_K, ND: MIN_ND, R: MIN_R })) + '<h2>' + esc(t(lang, 'm_h_lim')) + '</h2><ul><li>' + esc(t(lang, 'bias')) + '</li><li>' + esc(t(lang, 'm_lim2')) + '</li><li>' + esc(t(lang, 'm_lim3')) + '</li></ul></div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'm_h_now')) + '</h2>' + tb + '<p class="kfc-fine kfc-links"><a href="/api/x/fc/curves">' + esc(t(lang, 'm_api')) + '</a> <a href="/data/promises.json">/data/promises.json</a> <a href="/data/bali-cases.json">/data/bali-cases.json</a> <span>CC BY 4.0</span></p></div></section></div>';
}
async function assemble(shellRes, o) {
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + o.path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + o.path + '">';
  const tags = '<title>' + esc(o.title) + ' | Kolaboro</title><meta name="description" content="' + esc(o.desc) + '"><link rel="canonical" href="' + ORIGIN + pre(o.lang) + o.path + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(o.title) + ' | Kolaboro"><meta property="og:description" content="' + esc(o.desc) + '"><meta property="og:url" content="' + ORIGIN + pre(o.lang) + o.path + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(o.ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS + FC_CSS;
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(o.body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + o.path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}

// ------------------------------------------------------------------------------------------------ routes
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 'no-store');
  if (p.startsWith('/api/x/fc')) {
    const q = p.replace(/\/+$/, '');
    try {
      if (q === '/api/x/fc') return out({ module: 'fc (batch 17, n17c)', endpoints: { '/api/x/fc/curves': 'delivery forecast for every group (all markets, each market, developers with 10+ projects)', '/api/x/fc/project?id=BALI-014': 'one project', '/api/x/fc/speed?dev=<slug>': 'developer answer speed', '/api/x/fc/open': 'the /open figures' }, method: ORIGIN + '/methods/delivery-forecast/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' });
      if (q === '/api/x/fc/curves') {
        const fc = await fcData(env), devs = await devGroups(env, fc).catch(() => new Map());
        return out({ version: VERSION, generated: new Date().toISOString(), data_updated: fc.updated, as_of_month: ym(fc.now), method: ORIGIN + '/methods/delivery-forecast/', thresholds: { market_projects: MIN_N, developer_projects: MIN_ND, handovers: MIN_K, at_risk_per_point: MIN_R },
          counts: fc.cnt, caveat: FT.en.bias, all: pub(fc.all), markets: [...fc.markets.values()].filter(g => g.n > 0).sort((a, b) => b.n - a.n).map(pub),
          developers: [...devs.entries()].filter(([, g]) => g.n >= MIN_ND).map(([s, g]) => Object.assign(pub(g), { slug: s })), developers_below_threshold: [...devs.values()].filter(g => g.n < MIN_ND).length,
          sources: ['/data/promises.json', '/data/bali-cases.json'], licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' }, 200, 'public, max-age=600');
      }
      if (q === '/api/x/fc/project') {
        const id = String(u.searchParams.get('id') || '').trim().toUpperCase().slice(0, 20);
        if (!/^[A-Z]{1,6}-\d{1,4}$/.test(id)) return out({ error: 'give ?id= like BALI-014' }, 400, 'public, max-age=60');
        const fc = await fcData(env); if (!fc.proj[id]) return out({ id, error: 'no tracked project has this id (or it is in a market we do not name)' }, 404);
        const nm = await import('./kbx_named.js'), ix = await nm.data(env), x = ix.byId.get(id), devs = await devGroups(env, fc);
        const o = projectFc(fc, id, x && x.dvs ? devs.get(x.dvs) : null), G = g => g && { level: g.level, name: g.name, projects_past_first_date: g.n, handovers: g.k, enough: g.enough };
        return out({ id, status: o.status, first_promised: o.first, current_promised: o.current, months_since_first: o.months_since_first, group: G(o.group), market: G(o.market), pooled_context: o.group ? null : G(o.pooled),
          chance: (o.group ? o.rows : []).map(r => ({ by: r.date, months_after_first: r.k, chance: r.p, low: r.lo, high: r.hi, at_risk: r.at_risk })),
          pooled_chance_context_only: o.group ? null : o.pooled_rows.map(r => ({ by: r.date, months_after_first: r.k, chance: r.p, low: r.lo, high: r.hi, at_risk: r.at_risk })),
          not_enough_beyond_months: o.beyond, caveat: FT.en.bias, method: ORIGIN + '/methods/delivery-forecast/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' }, 200, 'public, max-age=600');
      }
      if (q === '/api/x/fc/speed') {
        const slug = String(u.searchParams.get('dev') || '').toLowerCase().slice(0, 90);
        const rs = await rsData(env); if (!rs) return out({ error: 'dev-response.json unavailable' }, 503, 'no-store');
        const nm = await import('./kbx_named.js'), ix = await nm.data(env), dv = ix.devs.get(slug);
        if (!dv) return out({ error: 'give ?dev=<developer slug> of a named developer page', totals: rs.totals, generated: rs.generated }, 404);
        const a = rsAgg(rs, dv.ids);
        return out({ developer: dv.n, slug, projects: dv.ids.length, questions_reported: a.reported, questions_opened: a.opened, answered: a.answered, median_days_to_answer: a.median_days, medians_by_project: a.meds && a.meds.length > 1 ? a.meds : undefined, median_shown_from: RS_MIN, live: !!rs.live, replies_approved: a.replies, counted: rs.generated, source: '/data/dev-response.json', method: rs.sources, licence: rs.licence });
      }
      if (q === '/api/x/fc/open') return out(await openNumbers(env, ctx), 200, 'public, max-age=60');
    } catch (e) { return out({ error: 'unavailable', detail: String(e && e.message || e).slice(0, 120) }, 503, 'no-store'); }
    return out({ error: 'not found', module: 'fc' }, 404, 'public, max-age=60');
  }
  const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(open|methods\/delivery-forecast)(\/?)$/); if (!m || !shell) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', kind = m[2];
  const sh = await shell(pre(lang) + '/how-we-score/');
  let o;
  if (kind === 'open') {
    const d = await openNumbers(env, ctx);
    o = { lang, path: '/open/', title: t(lang, 'o_title'), desc: t(lang, 'o_desc'), body: openBody(d, lang),
      ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': ORIGIN + pre(lang) + '/open/#page', url: ORIGIN + pre(lang) + '/open/', name: t(lang, 'o_title'), description: t(lang, 'o_desc'), inLanguage: lang, dateModified: d.generated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
        { '@type': 'Dataset', name: 'Kolaboro open numbers', description: FT.en.o_desc, url: ORIGIN + '/open/', license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/fc/open' }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/traction.json' }] },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'o_h1'), item: ORIGIN + pre(lang) + '/open/' }] }] } };
    return new Response(await assemble(sh, o), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' } });
  }
  const fc = await fcData(env);
  o = { lang, path: '/methods/delivery-forecast/', title: t(lang, 'm_title'), desc: t(lang, 'm_desc'), body: methodBody(fc, lang),
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'TechArticle', '@id': ORIGIN + pre(lang) + '/methods/delivery-forecast/#article', headline: t(lang, 'm_title'), description: t(lang, 'm_desc'), url: ORIGIN + pre(lang) + '/methods/delivery-forecast/', inLanguage: lang, dateModified: fc.updated, author: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
      { '@type': 'Dataset', name: 'Kolaboro delivery forecast curves', description: FT.en.m_desc, url: ORIGIN + '/methods/delivery-forecast/', license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/fc/curves' }] },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: FT.en.m_crumb, item: ORIGIN + '/index/delays/' }, { '@type': 'ListItem', position: 3, name: t(lang, 'm_title'), item: ORIGIN + pre(lang) + '/methods/delivery-forecast/' }] }] } };
  return new Response(await assemble(sh, o), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
