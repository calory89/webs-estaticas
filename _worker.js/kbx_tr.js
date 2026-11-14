// kolaboro.com batch 23 (agent n23, 12 Nov 2026): transparency rankings of off-plan projects for 30 islands and 30 cities.
// No model calls, nothing estimated. The transparency score (0 to 100) counts what is published and checkable about a project,
// computed at the edge from the published data files, so it changes when the data changes (a developer reply that adds a document
// updates the data after moderation, and the score follows):
//   /data/named.json (names, developer, legal name, permit number, pin, price, handover), /data/bali-cases.json (checks, verification),
//   /data/promises.json (dated handover promise), /data/on-time.json (handover record), /data/web-health.json, /data/lookalikes.json,
//   /data/sanctions.json (sanctions and regulator warning lists: only the public "no match" list), /data/gleif-family.json (GLEIF LEI).
// Routes (8 languages, prefix /es /de /fr /nl /ru /zh /ar):
//   GET /rankings/transparency/                 hub: islands and cities with project counts, medians and shares
//   GET /rankings/transparency/<place>/         one place: ranked table (5+ projects) or list, components per row, FAQ, email box
//   GET /methods/transparency-score/            method and weights
//   GET /rankings/transparency/sitemap.xml      every URL above with hreflang alternates (listed in /sitemap_index.xml by kbx_seo.js)
//   GET /api/x/transparency[/<place>]           the same figures as JSON (CC BY 4.0)
//   POST /api/x/transparency/lead               "get the full analysis by email": stored through the existing lead path
//                                               (RPC kolaboro_apply, the admin CRM "Leads" tab), source transparency:<place>
// Conflict of interest: projects of companies linked to Kolaboro's founder (Eco Beach City, any developer or project named Eco Beach
// City or Equinox) are excluded from every ranking. Sumba is ranked by decision of the owner (12 Nov 2026) with a disclosure at the top;
// Sumba rows link to nothing but the right of reply, and the rest of the site's Sumba handling is unchanged (no project pages).
// Possible matches on official lists are never published and count exactly like "not checked" (left out of the total).
import { TRS } from './kbx_tr_i18n.js';
import { hdisp } from './kbx_hdate.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { E as E27 } from './kbx_e27_i18n.js';
import { t27 } from './kbx_t27_i18n.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/transparency(?:\/([a-z0-9-]{2,40}))?|methods\/(transparency-score))(\/?)$/;
export const SITEMAP = '/rankings/transparency/sitemap.xml';
export const PATHS = /^\/api\/x\/transparency(?:\/[a-z0-9-]{2,40})?\/?$/;
const MIN_RANK = 5;
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;   // Kolaboro founder's companies (Equinox Investment Group, PT Eco Beach City); "Equinoxe" (Mauritius) is another word
const MAX = { legal: 10, register: 5, permit: 15, permitreg: 5, date: 10, record: 10, deposit: 15, location: 10, web: 10, notices: 5, price: 5 };
const KEYS = Object.keys(MAX);
const TICKS = ['legal', 'permit', 'date', 'record', 'deposit', 'location'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const t = (lang, k, v) => { let s = (TRS[lang] && TRS[lang][k] != null) ? TRS[lang][k] : TRS.en[k]; if (typeof s !== 'string') return s; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
// like t() but the values are HTML already (names wrapped in <bdi>); the template text is escaped
const th = (lang, k, v) => { const s = esc((TRS[lang] && TRS[lang][k]) || TRS.en[k]); return v ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
const okHttp = u => typeof u === 'string' && /^https?:\/\/[^\s"<>]+$/.test(u.trim());
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const PUB = (lang, path) => ORIGIN + pre(lang) + path;
function cleanName(n) {   // same rule as kbx_named.js: drop research notes left inside parentheses
  return String(n || '').replace(/\s*\(([^)]*)\)/g, (m, inner) => { const keep = inner.split(/\s*[;,]\s*/).filter(x => x && !/^not the\b/i.test(x) && !/^listing \d+$/i.test(x)); return keep.length ? ' (' + keep.join(', ') + ')' : ''; }).trim();
}
// a company name with its legal form (case-sensitive short forms, case-insensitive long ones)
const LF_CS = /(^|[\s,(])(PT|CV|SA|S\.A\.|SL|S\.L\.|SLU|S\.L\.U\.|SAS|S\.A\.S\.?|SARL|AG|BV|B\.V\.|NV|N\.V\.|JSC|PCL|PJSC|P\.J\.S\.C\.?|QPSC|Q\.P\.S\.C\.?|LLC|L\.L\.C\.?|LLP|PLC|FZE|FZCO|FZ-LLC|SpA|S\.p\.A\.?|Srl|S\.r\.l\.?|GmbH|Kft\.?|d\.o\.o\.?|Ltda\.?|K\.K\.|A\.Ş\.?|AŞ)(?=$|[\s,.)])/;
const LF_CI = /\b(limited|ltd\.?|inc\.?|incorporated|corp\.?|corporation|sdn\.?\s*bhd\.?|berhad|bhd\.?|pty\.?\s*ltd|co\.,?\s*ltd|public company|sociedad|société|gesellschaft)\b/i;
const legalForm = s => !!s && (LF_CS.test(s) || LF_CI.test(s));

// ------------------------------------------------------------------------------------------------ data (shared parse with kbx_named.js)
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), LOADING = {};
async function load(env, name) {
  const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  if (LOADING[name]) return LOADING[name];
  const p = (async () => {
    let r = null, a = false;
    try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
    if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!r.ok) throw new Error(name + ' ' + r.status);
    const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
  })();
  LOADING[name] = p; const done = () => { if (LOADING[name] === p) delete LOADING[name]; }; p.then(done, done);
  return p;
}
let IDX = null;
export async function trData(env) {
  const opt = n => load(env, n).catch(() => null);
  const [named, cases, prom, ontime, web, look, sanc, gleif] = await Promise.all([load(env, 'named.json'), load(env, 'bali-cases.json'), opt('promises.json'), opt('on-time.json'), opt('web-health.json'), opt('lookalikes.json'), opt('sanctions.json'), opt('gleif-family.json')]);
  const key = [named, cases, prom, ontime, web, look, sanc, gleif];
  if (IDX && IDX.key.every((v, i) => v === key[i])) return IDX;
  const caseBy = new Map((cases.cases || []).map(c => [c.id, c]));
  const today = new Date().toISOString().slice(0, 10), in60 = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
  const OT = (ontime && ontime.projects) || {}, asOf = ymIdx(((ontime && ontime.as_of_month) || today.slice(0, 7)) + '-01');
  const WH = (web && web.d) || {}, sanNo = new Set((sanc && sanc.no_match) || []), warnNo = new Set((sanc && sanc.warnings && sanc.warnings.no_match) || []);
  const lookOf = new Set(((look && look.items) || []).map(i => String(i.o || '').replace(/^www\./, '').toLowerCase()).filter(Boolean));
  const lookWatched = new Set(Object.values((look && look.w) || {}).flat().map(d => String(d).replace(/^www\./, '').toLowerCase()));
  const GL = (gleif && gleif.devs) || {}, glChecked = (gleif && gleif.checked) || {};
  const PROM = (prom && prom.projects) || {};
  const rows = new Map(), excluded = [];
  for (const x of (named.projects || [])) {
    const c = caseBy.get(x.id); if (!c) continue;
    if (COI_RX.test(String(x.n || '')) || COI_RX.test(String(x.dv || ''))) { excluded.push(x.id); continue; }
    const fx = x.fx || {}, ck = c.checks || {}, vf = c.verified || {}, page = okHttp(x.url) ? x.url.trim() : null;
    const comp = {};
    // 1. legal name, 2. official company register (GLEIF, exact legal name, same country)
    const legal = fx.developer_company && legalForm(fx.developer_company) ? fx.developer_company : (legalForm(x.dv) ? x.dv : (fx.developer_company || null));
    comp.legal = legal && legalForm(legal) ? { st: 'yes', v: legal, src: page } : { st: 'no', src: page };
    const g = x.dvs && GL[x.dvs];
    comp.register = g && g.lei ? { st: 'yes', v: g.lei, src: 'https://search.gleif.org/#/record/' + g.lei } : (x.dvs && glChecked[x.dvs] ? { st: 'no', src: 'https://search.gleif.org/' } : { st: 'nc' });
    // 3. permit number published, 4. confirmed by a register or an independent source
    const pn = x.pn || null, permitPub = ck.permit === 2 || !!pn;
    comp.permit = permitPub ? { st: 'yes', v: pn, src: (okHttp(x.du) ? x.du : page) } : { st: 'no', src: page };
    comp.permitreg = ['registry', 'independent'].includes(vf.permit) ? { st: 'yes', v: vf.permit, src: '/registers/' } : { st: 'no', src: '/registers/' };
    // 5. handover date published (same order as the named pages: dated promise, research record, year on the case)
    const hp = (PROM[x.id] || []).find(p => p.k === 'handover'), hd = hp ? hp.d : (fx.handover_promised || (c.done ? String(c.done) : null));
    comp.date = hd ? { st: 'yes', v: hd, src: page } : { st: 'no', src: page };
    // 6. handover date record (on-time.json, as of its month)
    const o = OT[x.id]; let rec;
    if (!o) rec = hd ? { st: 'nc', r: 'nc' } : { st: 'no', r: 'none' };
    else if (o.s === 'open') rec = o.overdue > 0 ? { st: 'no', r: 'past', m: o.overdue } : o.moved > 0 ? { st: 'part', r: 'moved', m: o.moved, v: hd || o.cur } : { st: 'yes', r: 'kept', v: hd || o.cur || o.first };
    else if (o.s === 'moved') rec = { st: 'part', r: 'moved', m: o.moved, v: hd || o.cur };
    else if (o.s === 'missed') { const f = ymIdx((o.first || '') + '-01'); rec = { st: 'no', r: 'past', m: f != null && asOf != null ? Math.max(1, asOf - f) : (o.overdue || 0) }; }
    else if (o.s === 'done_on_time' || o.s === 'completed_no_date') rec = { st: 'yes', r: 'done' };
    else if (o.s === 'done_late') rec = { st: 'part', r: 'late' };
    else if (o.s === 'no_date') rec = hd ? { st: 'nc', r: 'nc' } : { st: 'no', r: 'none' };
    else rec = { st: 'nc', r: 'nc' };
    rec.src = '/data/on-time.json'; comp.record = rec;
    // 7. deposit protection stated, 8. location precise enough for a pin, 11. price
    comp.deposit = ck.escrow === true ? { st: 'yes', src: page } : { st: 'no', src: page };
    comp.location = (isFinite(fx.lat) && isFinite(fx.lng) && fx.lat !== null && fx.lng !== null) ? { st: 'yes', src: page } : { st: 'no', src: page };
    comp.price = fx.price_min > 0 ? { st: 'yes', src: page } : { st: 'no', src: page };
    // 9. website health (only websites we monitor; others are "not checked")
    const h = host(x.url), w = h && WH[h];
    if (w) {
      const last = String(w.h || '').slice(-1), ans = last === 'u' || last === 'b', tls = !!w.ce && w.ce >= today, dom = !!w.de && w.de > in60, lk = lookOf.has(h);
      const p = (ans ? 4 : 0) + (tls ? 3 : 0) + (dom ? 1 : 0) + (lk ? 0 : 2);
      comp.web = { st: p >= 10 ? 'yes' : p > 0 ? 'part' : 'no', p, ans, tls, dom, lk, watched: lookWatched.has(h), src: '/api/x/fraud/domain?d=' + encodeURIComponent(h) };
    } else comp.web = { st: 'nc' };
    // 10. official lists: public "no match" only; anything else (not screened, possible match under review) is "not checked"
    const sn = x.dvs && sanNo.has(x.dvs), wn = x.dvs && warnNo.has(x.dvs);
    comp.notices = sn || wn ? { st: sn && wn ? 'yes' : 'part', sn, wn, p: (sn ? 3 : 0) + (wn ? 2 : 0), avail: (sn ? 3 : 0) + (wn ? 2 : 0), src: '/data/sanctions.json' } : { st: 'nc' };
    // points
    let got = 0, avail = 0;
    for (const k of KEYS) {
      const q = comp[k];
      if (k === 'notices') { if (q.st === 'nc') { q.pts = 0; continue; } q.pts = q.p; q.max = q.avail; got += q.p; avail += q.avail; continue; }   // a list not screened is left out, like "not checked"
      if (q.st === 'nc') { q.pts = 0; q.max = MAX[k]; continue; }
      q.max = MAX[k]; q.pts = k === 'web' ? q.p : q.st === 'yes' ? MAX[k] : q.st === 'part' ? Math.round(MAX[k] / 2) : 0;
      got += q.pts; avail += MAX[k];
    }
    const score = avail ? Math.round(got / avail * 100) : 0;
    rows.set(x.id, { id: x.id, s: x.s, n: cleanName(x.n) || x.id, dv: x.dv || null, dvs: x.dvs || null, mk: x.mk, ar: x.ar, url: page, rv: !!(c.verified && Object.values(c.verified).some(v => v && v !== 'none')), comp, got, avail, score, sumba: String(x.mk || '').toLowerCase() === 'sumba' });
  }
  const places = new Map();
  for (const P of TR_PLACES) {
    const L = [...rows.values()].filter(r => inPlace(P, r.mk, r.ar)).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
    const ranked = L.length >= MIN_RANK;
    let prev = null, rank = 0; L.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r['rk_' + P.s] = ranked ? rank : null; });
    const sc = L.map(r => r.score).sort((a, b) => a - b), med = sc.length ? (sc.length % 2 ? sc[(sc.length - 1) / 2] : Math.round((sc[sc.length / 2 - 1] + sc[sc.length / 2]) / 2)) : null;
    const cnt = k => L.filter(r => r.comp[k].st === 'yes').length;
    places.set(P.s, { P, L, ranked, med, n: L.length, permit: cnt('permit'), date: cnt('date'), deposit: cnt('deposit') });
  }
  const updated = String(cases.updated || named.updated || today).slice(0, 10);
  const dates = { named: named.updated, cases: cases.updated, ontime: ontime && ontime.generated, web: web && web.updated, look: look && look.updated, sanctions: sanc && sanc.updated, gleif: gleif && String(gleif.updated || '').slice(0, 10) };
  IDX = { key, rows, places, updated, dates, excluded, v: String(updated) + '|' + rows.size + '|' + [...rows.values()].reduce((a, r) => a + r.score, 0) };
  return IDX;
}

// line for a named project page: "Ranked #N of M for transparency in <place>" (or the score where the place is too small to rank)
const BADGE = {
  en: ['Ranked #{r} of {m} for transparency in {p}', 'Transparency score {s} of 100 in {p}'], es: ['Puesto {r} de {m} en transparencia en {p}', 'Puntuación de transparencia {s} sobre 100 en {p}'],
  fr: ['Classé {r}e sur {m} pour la transparence à {p}', 'Score de transparence {s} sur 100 à {p}'], de: ['Platz {r} von {m} bei der Transparenz in {p}', 'Transparenzwert {s} von 100 in {p}'],
  nl: ['Plaats {r} van {m} voor transparantie in {p}', 'Transparantiescore {s} van 100 in {p}'], ru: ['Место {r} из {m} по прозрачности: {p}', 'Оценка прозрачности {s} из 100: {p}'],
  zh: ['在{p}透明度排名第 {r}（共 {m} 个）', '在{p}的透明度评分为 {s}/100'], ar: ['المرتبة {r} من {m} في الشفافية في {p}', 'درجة الشفافية {s} من 100 في {p}'] };
export async function trBadge(env, id, lang) {
  let ix; try { ix = await trData(env); } catch (e) { return ''; }
  const r = ix.rows.get(id); if (!r || r.sumba) return '';
  const out = [];
  for (const [s, pl] of ix.places) {
    if (pl.P.coi || !pl.L.includes(r)) continue;
    const B = BADGE[lang] || BADGE.en, link = pre(lang) + '/rankings/transparency/' + s + '/';
    const txt = pl.ranked ? B[0].replace('{r}', nf(lang, r['rk_' + s])).replace('{m}', nf(lang, pl.n)) : B[1].replace('{s}', nf(lang, r.score));
    out.push('<a href="' + link + '">' + esc(txt).replace('{p}', bdi(pl.P.n)) + '</a>');
  }
  return out.length ? '<p class="k-small ktr-badge" id="transparency-rank">' + out.join(' · ') + '</p>' : '';
}

// n24s: everything a named project page needs from the ranking in one read: the badge line above, the score, the ranks in each place,
// the eleven components as a published / not published checklist (same wording and sources as the ranking's detail rows) and a plain
// text summary for the FAQ answer. Sumba rows and excluded projects return null (they have no named page).
export async function trProject(env, id, lang) {
  let ix; try { ix = await trData(env); } catch (e) { return null; }
  const r = ix.rows.get(id); if (!r || r.sumba) return null;
  const ranks = [];
  for (const [s, pl] of ix.places) if (!pl.P.coi && pl.L.includes(r)) ranks.push({ s, p: pl.P.n, r: pl.ranked ? r['rk_' + s] : null, m: pl.n, ranked: pl.ranked });
  const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const items = KEYS.map(k => ({ k, st: r.comp[k].st, label: t(lang, 'c_' + k), text: plain(compText(lang, k, r.comp[k])) }));
  return { score: r.score, rv: r.rv, ranks, items, badge: await trBadge(env, id, lang), ledger: ledger(lang, r), method: pre(lang) + '/methods/transparency-score/', updated: ix.updated };
}

// ------------------------------------------------------------------------------------------------ HTML parts
const CSS ='<style id="ktr-css">.ktr-thin{columns:2 300px;padding-inline-start:18px;margin:var(--k-3,12px) 0 var(--k-5,24px)}.ktr-thin li{margin:0 0 8px;break-inside:avoid}.ktr-thin small{display:block;color:var(--k-muted,#56636F)}.ktr>.k-sec:first-child{padding-top:clamp(20px,3vw,36px)}.ktr .k-phead{margin-bottom:var(--k-5,24px)}.ktr h2{margin-top:var(--k-7,48px)}.ktr-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--k-surface);margin:var(--k-4,16px) 0}.ktr-kv div{padding:14px 16px;box-shadow:inset -1px -1px 0 var(--k-line)}.ktr-kv b{display:block;font-size:clamp(1.5rem,3vw,2rem);line-height:1.1;font-variant-numeric:tabular-nums}.ktr-kv span{display:block;font-size:var(--k-fs-sm,15px);color:var(--k-muted)}' +
  '.ktr-tw{overflow-x:auto;margin:var(--k-3,12px) 0 var(--k-5,24px);border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);background:var(--k-surface)}.ktr-tw table{min-width:860px;width:100%}.ktr-tw th{font-size:var(--k-fs-xs,13px);font-weight:600;white-space:normal;vertical-align:bottom}.ktr-tw td{vertical-align:top}.ktr-tw tbody tr{content-visibility:auto;contain-intrinsic-size:auto 64px}' +
  '.ktr-sc{font-weight:700;font-variant-numeric:tabular-nums;font-size:var(--k-fs-lg,20px);white-space:nowrap}.ktr-bar{display:block;height:6px;border-radius:3px;background:var(--k-sunken);margin-top:4px;min-width:56px}.ktr-bar i{display:block;height:100%;border-radius:3px;background:var(--k-sea);width:var(--v)}' +
  '.ktr-t{display:inline-flex;align-items:flex-start;gap:4px;font-size:var(--k-fs-xs,13px);line-height:1.3}.ktr-t b{font-size:15px;line-height:1}.ktr-yes{color:var(--k-ok)}.ktr-part{color:var(--k-warn)}.ktr-no,.ktr-nc{color:var(--k-muted)}' +
  '.ktr-pn{font-weight:600}.ktr-dev{color:var(--k-ink-2)}.ktr-nr{display:inline-block;margin-top:4px}.ktr-db{display:inline-block;text-align:start;min-height:36px;margin:4px 0 0;padding:0;border:0;background:none;color:var(--k-sea);font:inherit;font-size:var(--k-fs-sm,15px);text-decoration:underline;text-underline-offset:3px;cursor:pointer}.ktr-db::after{content:" +";text-decoration:none}.ktr-db[aria-expanded=true]::after{content:" \\2212"}.ktr-db:focus-visible{outline:3px solid var(--k-sea);outline-offset:2px}.ktr-pc{min-width:150px}.ktr-sv{display:inline-block;min-width:64px}.ktr-pc .ktr-rr{display:block;margin-top:2px}.ktr-dr[hidden]{display:none!important}.ktr-dr td{background:var(--k-sunken);padding:12px 16px}.ktr-dr .ktr-led{columns:2 340px;column-gap:32px}.ktr-dr .ktr-led li{break-inside:avoid}.ktr-led{margin:6px 0 0;padding:0;list-style:none;font-size:var(--k-fs-sm,15px)}.ktr-led li{padding:6px 0;border-top:1px solid var(--k-line)}.ktr-led li:first-child{border-top:0}.ktr-led .k-src{margin-inline-start:6px}.ktr-led small{color:var(--k-muted)}.ktr-rr{font-size:var(--k-fs-xs,13px)}' +
  '.ktr-box{border:1px solid var(--k-line-2);border-radius:var(--k-r-lg,14px);background:var(--k-surface);padding:18px 20px;margin:var(--k-6,32px) 0;max-width:760px}.ktr-box h2{margin:0 0 8px;font-size:var(--k-fs-xl,24px)}.ktr-box p{margin:0 0 10px}.ktr-em .k-input{width:100%;max-width:440px;min-height:48px}.ktr-em .k-btn{min-height:48px}.ktr-cons{display:flex;gap:10px;align-items:flex-start;margin:12px 0;font-size:var(--k-fs-sm,15px)}.ktr-cons input{width:22px;height:22px;flex:0 0 22px;margin-top:2px}.ktr-msg{min-height:1.4em;margin:6px 0 0;font-weight:600}.ktr-hp{position:absolute;inset-inline-start:-9999px;width:1px;height:1px;overflow:hidden}' +
  '.ktr-coi{margin:0 0 var(--k-5,24px);max-width:820px}.ktr-links{display:flex;flex-wrap:wrap;gap:8px 16px;margin:var(--k-5,24px) 0}.ktr-assign{color:var(--k-muted);font-size:var(--k-fs-sm,15px)}.ktr-hub td:first-child a{font-weight:600}.ktr-hub table{min-width:640px}.ktr-badge{margin:8px 0 0}' +
  '.ktr-tw table.ktr-mt{min-width:0}@media (max-width:640px){.ktr-tw{border:0;background:none;overflow:visible}.ktr-tw table{min-width:0;display:block;width:100%}.ktr-tw tbody{display:block}.ktr-tw td{flex-wrap:wrap;min-width:0;overflow-wrap:anywhere}.ktr-tw td.ktr-pc,.ktr-tw .ktr-dr td{display:block}.ktr-tw td.ktr-pc::before{display:none}.ktr-tw td.ktr-pc .ktr-pn{font-size:var(--k-fs-lg,20px)}.ktr-sv{min-width:90px;text-align:end}.ktr-tw .ktr-dr{border:0;padding:0;margin-top:-8px}.ktr-tw .ktr-dr[hidden]{display:none}.ktr-dr .ktr-led{columns:1}.ktr-tw.k-table-wrap .k-table--stack td{text-align:start}.ktr-kv{grid-template-columns:1fr 1fr}.ktr-box{padding:14px}.ktr-tw tbody tr{contain-intrinsic-size:auto 320px}.ktr-tw td.ktr-pc .ktr-db{display:flex;align-items:center;min-height:44px;margin:2px 0 0}.ktr-tw td.ktr-pc .ktr-rr{display:flex;align-items:center;min-height:44px;margin:0}}</style>';
function tick(lang, st) { const sym = { yes: '✓', part: '◐', no: '○', nc: '?' }[st] || '?'; return '<span class="ktr-t ktr-' + st + '"><b aria-hidden="true">' + sym + '</b>' + esc(t(lang, 'st_' + st)) + '</span>'; }
function srcA(lang, u, isSumba) {
  if (!u || isSumba && /^https?:/.test(u)) return '';
  // n24s: the website-health source is our domain check API; its path ("/api/x/fraud/...") is shown as kolaboro.com, so no verdict word appears as text
  const lbl = /^https?:/.test(u) && !/gleif\.org/.test(u) ? t(lang, 'src_dev') : /gleif\.org/.test(u) ? 'GLEIF' : /^\//.test(u) ? 'kolaboro.com' : u.replace(/\?.*$/, '');   // n25t: every page or file of ours reads kolaboro.com (no English path words as link text)
  return '<a class="k-src" href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' rel="noopener nofollow" target="_blank"' : '') + '>' + (/^\//.test(lbl) ? '<bdi>' + esc(lbl) + '</bdi>' : esc(lbl)) + '</a>';
}
function compText(lang, k, q) {
  const v = q.v != null ? bdi(k === 'date' || k === 'record' ? hdisp(q.v, lang) : q.v) : '';   // n25t: handover dates localized
  switch (k) {
    case 'legal': return q.st === 'yes' ? th(lang, 'v_legal_y', { v }) : esc(t(lang, 'v_legal_n'));
    case 'register': return q.st === 'yes' ? th(lang, 'v_reg_y', { v }) : q.st === 'nc' ? esc(t(lang, 'st_nc')) : esc(t(lang, 'v_reg_n'));
    case 'permit': return q.st === 'yes' ? esc(t(lang, 'v_permit_y')) + (q.v ? ': ' + v : '') : esc(t(lang, 'v_permit_n'));
    case 'permitreg': return q.st === 'yes' ? th(lang, 'v_preg_y', { v: esc(q.v) }) : esc(t(lang, 'v_preg_n'));
    case 'date': return q.st === 'yes' ? th(lang, 'v_date_y', { v }) : esc(t(lang, 'v_date_n'));
    case 'record': return th(lang, 'r_' + q.r, { v, m: esc(nf(lang, q.m || 0)) });
    case 'deposit': return esc(t(lang, q.st === 'yes' ? 'v_dep_y' : 'v_dep_n'));
    case 'location': return esc(t(lang, q.st === 'yes' ? 'v_loc_y' : 'v_loc_n'));
    case 'price': return esc(t(lang, q.st === 'yes' ? 'v_price_y' : 'v_price_n'));
    case 'web': return q.st === 'nc' ? esc(t(lang, 'w_nc')) : [q.ans ? 'w_ans' : 'w_noans', q.tls ? 'w_tls' : 'w_notls', q.dom ? 'w_dom' : 'w_nodom', q.lk ? 'w_look' : 'w_nolook'].map(x => esc(t(lang, x))).join('; ');
    case 'notices': return q.st === 'nc' ? esc(t(lang, 'n_nc')) : [q.sn ? t(lang, 'n_san') : null, q.wn ? t(lang, 'n_warn') : null].filter(Boolean).concat(q.sn && q.wn ? [] : [t(lang, 'n_nc')]).map(esc).join('; ');
  }
  return '';
}
// the developer page is the source of most components: linked once at the end, other sources (registers, data files) on their line
function ledger(lang, r) {
  return '<ul class="ktr-led">' + KEYS.map(k => { const q = r.comp[k];
    const pts = q.st === 'nc' ? '<small>' + esc(t(lang, 'nc_note')) + '</small>' : '<small>' + esc(t(lang, 'pts', { a: nf(lang, q.pts), b: nf(lang, q.max) })) + '</small>';
    return '<li><b>' + esc(t(lang, 'c_' + k)) + '</b>: ' + compText(lang, k, q) + ' ' + pts + (q.src && q.src !== r.url ? srcA(lang, q.src, r.sumba) : '') + '</li>'; }).join('') +
    (r.url && !r.sumba ? '<li>' + esc(t(lang, 'src_dev')) + ': <a class="k-src" href="' + esc(r.url) + '" rel="noopener nofollow" target="_blank"><bdi>' + esc(host(r.url)) + '</bdi></a> <a class="k-src" href="' + pre(lang) + '/projects/' + esc(r.s) + '/#sources">Kolaboro</a></li>' : '') + '</ul>';
}
const replyHref = id => '/developers/reply/?id=' + encodeURIComponent(id);
function rowHtml(lang, r, rank, ranked) {
  const cols = [t(lang, 'col_rank'), t(lang, 'col_proj'), t(lang, 'col_dev'), t(lang, 'col_score')].concat(TICKS.map(k => t(lang, 'k_' + k)));
  const name = r.sumba ? '<span class="ktr-pn">' + bdi(r.n) + '</span>' : '<a class="ktr-pn" href="' + pre(lang) + '/projects/' + esc(r.s) + '/">' + bdi(r.n) + '</a>';
  const cells = [
    ranked ? '<td class="k-n" data-label="' + esc(cols[0]) + '">' + nf(lang, rank) + '</td>' : null,
    '<td class="ktr-pc" data-label="' + esc(cols[1]) + '">' + name + (r.rv ? '' : '<br><span class="k-badge k-badge--plain ktr-nr">' + esc(t(lang, 'not_rev')) + '</span>') +
      '<button type="button" class="ktr-db" aria-expanded="false" aria-controls="d-' + esc(r.id) + '">' + esc(t(lang, 'details')) + '</button><a class="ktr-rr" href="' + replyHref(r.id) + '">' + esc(t(lang, 'reply_row')) + '</a></td>',
    '<td class="ktr-dev" data-label="' + esc(cols[2]) + '">' + (r.dv ? bdi(r.dv) : '<span class="k-muted">' + esc(t(lang, 'st_no')) + '</span>') + '</td>',
    '<td data-label="' + esc(cols[3]) + '"><span class="ktr-sv"><span class="ktr-sc">' + nf(lang, r.score) + '</span><span class="ktr-bar" aria-hidden="true"><i style="--v:' + r.score + '%"></i></span></span></td>'
  ].concat(TICKS.map((k, i) => '<td data-label="' + esc(cols[4 + i]) + '">' + tick(lang, r.comp[k].st) + '</td>')).filter(Boolean);
  return '<tr id="p-' + esc(r.id.toLowerCase()) + '">' + cells.join('') + '</tr><tr class="ktr-dr" id="d-' + esc(r.id) + '" hidden><td colspan="' + cells.length + '"><template>' + ledger(lang, r) + '</template></td></tr>';
}
function tableHtml(lang, pl) {
  const head = (pl.ranked ? [t(lang, 'col_rank')] : []).concat([t(lang, 'col_proj'), t(lang, 'col_dev'), t(lang, 'col_score')], TICKS.map(k => t(lang, 'k_' + k)));
  return '<div class="k-table-wrap ktr-tw"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + head.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    pl.L.map(r => rowHtml(lang, r, r['rk_' + pl.P.s], pl.ranked)).join('') + '</tbody></table></div>';
}
function kvHtml(lang, pl, ix) {
  const it = [[nf(lang, pl.n), t(lang, 'kv_n')], [pl.med == null ? '-' : nf(lang, pl.med), t(lang, 'kv_med')], [nf(lang, pct(pl.permit, pl.n)) + '%', t(lang, 'kv_permit')], [nf(lang, pct(pl.date, pl.n)) + '%', t(lang, 'kv_date')], [nf(lang, pct(pl.deposit, pl.n)) + '%', t(lang, 'kv_dep')]];
  return '<div class="ktr-kv">' + it.map(([b, s]) => '<div><b>' + esc(b) + '</b><span>' + esc(s) + '</span></div>').join('') + '</div><p class="k-small k-muted">' + esc(t(lang, 'read_on', { d: fdt(ix.updated, lang) })) + ' <a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'm_link')) + '</a></p>';
}
function assignHtml(lang, P) {
  if (!P.a) return '<p class="ktr-assign">' + th(lang, 'assign_m', { m: P.m.map(bdi).join(', ') }) + '</p>';
  const ruled = P.am || P.m, whole = P.m.filter(m => !ruled.includes(m));
  return '<p class="ktr-assign">' + th(lang, 'assign_a', { m: ruled.map(bdi).join(', '), a: bdi(P.an || String(P.a.source)) }) + (whole.length ? ' ' + th(lang, 'assign_m', { m: whole.map(bdi).join(', ') }) : '') + '</p>';
}
function replyBox(lang, id) {
  return '<div class="ktr-box" id="reply"><h2>' + esc(t(lang, 'rr_h')) + '</h2><p>' + esc(t(lang, 'rr_t')) + '</p><a class="k-btn" href="' + (id ? replyHref(id) : '/developers/reply/') + '">' + esc(t(lang, 'rr_btn')) + '</a> <a class="k-btn k-btn--ghost" href="/corrections/">' + esc({ en: 'Corrections', es: 'Correcciones', fr: 'Corrections', de: 'Korrekturen', nl: 'Correcties', ru: 'Исправления', zh: '更正', ar: 'التصحيحات' }[lang]) + '</a></div>';
}
function emailBox(lang, P) {
  const p = bdi(P.n);
  return '<div class="ktr-box ktr-em" id="get-analysis"><h2>' + th(lang, 'em_h', { p }) + '</h2><p>' + esc(t(lang, 'em_t')) + '</p>' +
    '<form id="ktr-form" novalidate data-place="' + esc(P.s) + '" data-lang="' + lang + '" data-m=\'' + esc(JSON.stringify({ ok: t(lang, 'em_ok', { p: P.n }), bad: t(lang, 'em_bad'), need: t(lang, 'em_need'), err: t(lang, 'em_err'), busy: t(lang, 'em_busy') })) + '\'>' +
    '<div class="k-field"><label class="k-label" for="ktr-email">' + esc(t(lang, 'em_lbl')) + '</label><input class="k-input" id="ktr-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="200" dir="ltr"></div>' +
    '<label class="ktr-cons"><input type="checkbox" name="consent" id="ktr-cons" required><span>' + th(lang, 'em_cons', { p }) + ' <a href="/legal/privacy/">' + esc(t(lang, 'em_priv')) + '</a></span></label>' +
    '<button class="k-btn k-btn--primary" type="submit">' + esc(t(lang, 'em_btn')) + '</button>' +
    '<div class="ktr-hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></div>' +
    '<p class="ktr-msg" id="ktr-msg" role="status" aria-live="polite"></p></form><p class="k-small k-muted">' + esc(t(lang, 'em_note')) + '</p></div>';
}
// "How this score is made": the row's ledger sits in a <template> in a hidden full-width row, filled and shown on the first click
const LED_JS = '<script>document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".ktr-db");if(!b)return;var r=document.getElementById(b.getAttribute("aria-controls"));if(!r)return;var td=r.firstElementChild,tp=td&&td.querySelector("template");if(tp){td.appendChild(tp.content.cloneNode(true));tp.remove();}var o=b.getAttribute("aria-expanded")!=="true";b.setAttribute("aria-expanded",o?"true":"false");r.hidden=!o;});</script>';
const FORM_JS = '<script>(function(){var f=document.getElementById("ktr-form");if(!f)return;var M=JSON.parse(f.getAttribute("data-m")),m=document.getElementById("ktr-msg"),e=f.email,c=f.consent,busy=false;' +
  'function say(s,bad){m.textContent=s;m.style.color=bad?"var(--k-brand-ink)":"";}' +
  'f.addEventListener("submit",function(ev){ev.preventDefault();if(busy)return;var em=(e.value||"").trim();if(!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$/.test(em)){e.setAttribute("aria-invalid","true");say(M.bad,1);e.focus();return;}e.removeAttribute("aria-invalid");' +
  'if(!c.checked){c.setAttribute("aria-invalid","true");say(M.need,1);c.focus();return;}c.removeAttribute("aria-invalid");busy=true;var b=f.querySelector("[type=submit]");b.disabled=true;say(M.busy);' +
  'fetch("/api/x/transparency/lead",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:em,consent:true,place:f.getAttribute("data-place"),lang:f.getAttribute("data-lang"),website:f.website.value,ref:document.referrer.slice(0,200)})}).then(function(r){return r.json();}).then(function(j){busy=false;b.disabled=false;' +
  'if(j&&j.ok){say(M.ok);f.reset();try{if(window.kbEvent)kbEvent("transparency_lead",f.getAttribute("data-place"));}catch(x){}return;}say(j&&j.error==="email"?M.bad:M.err,1);}).catch(function(){busy=false;b.disabled=false;say(M.err,1);});});})();</script>';
function faqList(lang, pl, ix) {
  const P = pl.P, p = P.n, n = pl.n, nn = nf(lang, n), top = pl.ranked ? pl.L[0] : null;
  const f = [[t(lang, 'q1', { p }), t(lang, 'a1', { n: nn, d: fdt(ix.updated, lang) })]];
  if (pl.med != null) f.push([t(lang, 'q2', { p }), t(lang, 'a2', { m: nf(lang, pl.med) })]);
  f.push([t(lang, 'q3', { p }), t(lang, 'a3', { a: nf(lang, pl.permit), n: nn, pc: nf(lang, pct(pl.permit, n)) })]);
  f.push([t(lang, 'q4', { p }), t(lang, 'a4', { a: nf(lang, pl.deposit), n: nn, pc: nf(lang, pct(pl.deposit, n)), b: nf(lang, pl.date) })]);
  if (top) { const ties = pl.L.filter(r => r.score === top.score).map(r => r.n); f.push([t(lang, 'q5', { p }), t(lang, 'a5', { x: ties.slice(0, 4).join(', ') + (ties.length > 4 ? ' (+' + (ties.length - 4) + ')' : ''), s: nf(lang, top.score) })]); }
  return f;
}
function crumbHtml(lang, list) { return '<p class="k-crumb">' + list.map((x, i) => i < list.length - 1 ? '<a href="' + x[1] + '">' + esc(x[0]) + '</a>' : '<span>' + x[2] + '</span>').join(' / ') + '</p>'; }
const crumbLd = (lang, list) => ({ '@type': 'BreadcrumbList', itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: ORIGIN + x[1] })) });
const year = () => new Date().getUTCFullYear();
function linksHtml(lang, slug) {
  return '<p class="ktr-links"><a href="' + pre(lang) + '/rankings/transparency/">' + esc(t(lang, 'all_places')) + '</a><a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'm_link')) + '</a><a href="/api/x/transparency' + (slug ? '/' + slug : '') + '">' + esc(t(lang, 'json')) + '</a><a href="/rankings/">' + esc(t(lang, 'crumb_r')) + '</a>' + (slug && TR_PLACES.some(q => q.s === slug && !q.coi) ? '<a href="' + pre(lang) + '/weekly/' + slug + '/">' + esc((E27[lang] || E27.en).wk_t.replace('{p}', TR_PLACES.find(q => q.s === slug).n)) + '</a>' : '') +
    // n27t (batch 27): the same figures as CSV (CC BY 4.0) and the badge for projects scoring 70 or more (kbx_t27.js)
    (slug ? '<a href="/rankings/transparency/' + slug + '.csv" download>' + esc(t27(lang, 'csv_place')) + '</a>' : '') + '<a href="/rankings/transparency.csv" download>' + esc(t27(lang, 'csv_all')) + '</a><a href="' + pre(lang) + '/transparency-badge/">' + esc(t27(lang, 'csv_badge')) + '</a></p>';   // n27e: weekly changes of the place
}

// n26i (batch 26): projects with almost nothing published yet stay on their own pages and are grouped here too, in short rows with a
// strong link, so the place page carries them until data arrives. "Little published": at most one of the six basic facts (legal name,
// permit number, handover date, deposit protection, location, price) is published. They also stay in the table above.
const THIN_K = ['legal', 'permit', 'date', 'deposit', 'location', 'price'];
const isThin = r => THIN_K.filter(k => r.comp[k] && r.comp[k].st === 'yes').length <= 1;
const THIN_T = {
  en: ['Little published so far ({n})', 'These projects publish at most one of the basic facts we look for. Their pages stay up and gain detail as the developer publishes more.', 'Published', 'nothing yet'],
  es: ['Poco publicado por ahora ({n})', 'Estos proyectos publican como mucho uno de los datos básicos que buscamos. Sus fichas siguen activas y ganan detalle a medida que el promotor publica más.', 'Publicado', 'nada todavía'],
  de: ['Bisher wenig veröffentlicht ({n})', 'Diese Projekte veröffentlichen höchstens eine der grundlegenden Angaben, nach denen wir suchen. Ihre Seiten bleiben online und werden ausführlicher, sobald der Bauträger mehr veröffentlicht.', 'Veröffentlicht', 'noch nichts'],
  fr: ['Peu publié pour l\'instant ({n})', 'Ces projets publient au plus une des informations de base que nous cherchons. Leurs fiches restent en ligne et s\'enrichissent quand le promoteur en publie davantage.', 'Publié', 'rien pour l\'instant'],
  nl: ['Tot nu toe weinig gepubliceerd ({n})', 'Deze projecten publiceren hooguit één van de basisgegevens die we zoeken. Hun pagina\'s blijven online en worden uitgebreider zodra de ontwikkelaar meer publiceert.', 'Gepubliceerd', 'nog niets'],
  ru: ['Пока опубликовано мало (проектов: {n})', 'Эти проекты публикуют не больше одного из основных сведений, которые мы ищем. Их страницы остаются на сайте и пополняются, когда застройщик публикует больше.', 'Опубликовано', 'пока ничего'],
  zh: ['目前公开信息很少（{n} 个）', '这些项目在我们查找的基本信息中最多只公开了一项。它们的页面会保留，并在开发商公开更多信息后补充。', '已公开', '暂无'],
  ar: ['القليل منشور حتى الآن ({n})', 'تنشر هذه المشاريع معلومة واحدة على الأكثر من المعلومات الأساسية التي نبحث عنها. تبقى صفحاتها متاحة وتزداد تفاصيلها كلما نشر المطوّر المزيد.', 'المنشور', 'لا شيء بعد'] };
const PRICE_L = { en: 'Price', es: 'Precio', de: 'Preis', fr: 'Prix', nl: 'Prijs', ru: 'Цена', zh: '价格', ar: 'السعر' };
function thinHtml(lang, pl) {
  const L = pl.L.filter(r => !r.sumba && isThin(r)); if (!L.length) return '';
  const T = THIN_T[lang] || THIN_T.en, f = (i, v) => esc(T[i]).replace('{n}', v == null ? '' : nf(lang, v));
  return '<h2 id="little-data">' + f(0, L.length) + '</h2><p class="k-small">' + f(1) + '</p><ul class="ktr-thin">' + L.map(r => {
    const got = THIN_K.filter(k => r.comp[k] && r.comp[k].st === 'yes').map(k => k === 'price' ? (PRICE_L[lang] || PRICE_L.en) : t(lang, 'k_' + k));
    return '<li><a href="' + pre(lang) + '/projects/' + esc(r.s) + '/">' + bdi(r.n) + '</a>' + (r.dv ? ' <span class="k-muted">' + bdi(r.dv) + '</span>' : '') + ' <small>' + f(2) + ': ' + (got.length ? got.map(esc).join(', ') : f(3)) + '</small></li>';
  }).join('') + '</ul>';
}
// ------------------------------------------------------------------------------------------------ pages
function placePage(ix, slug, lang) {
  const pl = ix.places.get(slug); if (!pl) return null;
  const P = pl.P, p = bdi(P.n), path = '/rankings/transparency/' + slug + '/';
  const title = t(lang, pl.ranked ? 't_ranked' : 't_list', { p: P.n, y: year() }), h1 = th(lang, pl.ranked ? 'h1_ranked' : 'h1_list', { p });
  const desc = t(lang, 'desc', { n: nf(lang, pl.n), p: P.n, m: pl.med == null ? '-' : nf(lang, pl.med), d: fdt(ix.updated, lang) });
  const cr = [['Kolaboro', pre(lang) + '/', 'Kolaboro'], [t(lang, 'crumb_r'), '/rankings/', esc(t(lang, 'crumb_r'))], [t(lang, 'crumb_t'), pre(lang) + '/rankings/transparency/', esc(t(lang, 'crumb_t'))], [P.n, pre(lang) + path, p]];
  const faq = faqList(lang, pl, ix);
  let body = '<div class="ktr"><section class="k-sec"><div class="k-wrap"><div class="k-phead">' + crumbHtml(lang, cr) + '<h1>' + h1 + '</h1><p class="lead">' + esc(t(lang, 'lead')) + '</p></div>';
  if (P.coi) body += '<div class="k-alert k-alert--warn ktr-coi" role="note" id="disclosure"><b>' + esc(t(lang, 'coi')) + '</b> <span><a href="/independence/">' + esc(t(lang, 'coi_link')) + '</a>. ' + esc(t(lang, 'coi_rows')) + '</span></div>';
  body += kvHtml(lang, pl, ix) + assignHtml(lang, P) + (pl.ranked ? '' : '<p class="k-small">' + esc(t(lang, 'small')) + '</p>');
  body += '<h2 id="ranking">' + esc(t(lang, pl.ranked ? 'tbl_h' : 'list_h')) + '</h2>' + tableHtml(lang, pl);
  body += thinHtml(lang, pl);
  body += emailBox(lang, P) + replyBox(lang, null);
  body += '<h2 id="faq">' + esc(t(lang, 'faq_h')) + '</h2><div class="k-disc">' + faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div>';
  body += linksHtml(lang, slug) + '</div></section></div>' + LED_JS + FORM_JS;
  const url = PUB(lang, path);
  const items = pl.L.slice(0, 200).map((r, i) => Object.assign({ '@type': 'ListItem', position: pl.ranked ? r['rk_' + slug] : i + 1, name: r.n }, r.sumba ? {} : { url: PUB(lang, '/projects/' + r.s + '/') }));
  const ld = [
    { '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, about: { '@type': 'Place', name: P.n, address: { '@type': 'PostalAddress', addressCountry: P.cc } } },
    { '@type': 'ItemList', name: title, numberOfItems: pl.n, itemListOrder: pl.ranked ? 'https://schema.org/ItemListOrderDescending' : 'https://schema.org/ItemListUnordered', itemListElement: items },
    { '@type': 'Dataset', name: title, description: desc, url, isAccessibleForFree: true, dateModified: ix.updated, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, spatialCoverage: { '@type': 'Place', name: P.n }, variableMeasured: t('en', 'name') + ' (0-100)', measurementTechnique: ORIGIN + '/methods/transparency-score/', distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/transparency/' + slug }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/rankings/transparency/' + slug + '.csv' }] },
    crumbLd(lang, cr)];
  return { title, desc, body, ld, path };
}
function hubTable(lang, ix, kind) {
  const L = [...ix.places.values()].filter(pl => pl.P.k === kind).sort((a, b) => b.n - a.n || a.P.n.localeCompare(b.P.n));
  const cols = [t(lang, 'c_place'), t(lang, 'c_n'), t(lang, 'c_med'), t(lang, 'h_permit'), t(lang, 'h_date'), t(lang, 'c_dep')];
  return '<div class="k-table-wrap ktr-tw ktr-hub"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
    L.map(pl => '<tr><td data-label="' + esc(cols[0]) + '"><a href="' + pre(lang) + '/rankings/transparency/' + pl.P.s + '/">' + bdi(pl.P.n) + '</a>' + (pl.ranked ? '' : '<br><small class="k-muted">' + esc(t(lang, 'unranked')) + '</small>') + '</td><td class="k-n" data-label="' + esc(cols[1]) + '">' + nf(lang, pl.n) + '</td><td class="k-n" data-label="' + esc(cols[2]) + '">' + (pl.med == null ? '-' : nf(lang, pl.med)) + '</td><td class="k-n" data-label="' + esc(cols[3]) + '">' + nf(lang, pct(pl.permit, pl.n)) + '%</td><td class="k-n" data-label="' + esc(cols[4]) + '">' + nf(lang, pct(pl.date, pl.n)) + '%</td><td class="k-n" data-label="' + esc(cols[5]) + '">' + nf(lang, pct(pl.deposit, pl.n)) + '%</td></tr>').join('') + '</tbody></table></div>';
}
function hubPage(ix, lang) {
  const path = '/rankings/transparency/', title = t(lang, 'hub_title'), desc = t(lang, 'hub_desc');
  const cr = [['Kolaboro', pre(lang) + '/', 'Kolaboro'], [t(lang, 'crumb_r'), '/rankings/', esc(t(lang, 'crumb_r'))], [t(lang, 'crumb_t'), pre(lang) + path, esc(t(lang, 'crumb_t'))]];
  const body = '<div class="ktr"><section class="k-sec"><div class="k-wrap"><div class="k-phead">' + crumbHtml(lang, cr) + '<h1>' + esc(t(lang, 'hub_h1')) + '</h1><p class="lead">' + esc(t(lang, 'hub_lead')) + '</p><p class="k-small k-muted">' + esc(t(lang, 'read_on', { d: fdt(ix.updated, lang) })) + ' <a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'm_link')) + '</a></p></div>' +
    '<h2 id="islands">' + esc(t(lang, 'islands')) + '</h2>' + hubTable(lang, ix, 'i') + '<h2 id="cities">' + esc(t(lang, 'cities')) + '</h2>' + hubTable(lang, ix, 'c') +
    '<p class="k-small">' + esc(t(lang, 'hub_excl')) + ' <a href="/independence/">' + esc(t(lang, 'coi_link')) + '</a></p>' + replyBox(lang, null) + linksHtml(lang, null) + '</div></section></div>';
  const url = PUB(lang, path), all = [...ix.places.values()];
  const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'ItemList', name: title, numberOfItems: all.length, itemListElement: all.map((pl, i) => ({ '@type': 'ListItem', position: i + 1, name: pl.P.n, url: PUB(lang, '/rankings/transparency/' + pl.P.s + '/') })) },
    { '@type': 'Dataset', name: title, description: desc, url, isAccessibleForFree: true, dateModified: ix.updated, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, measurementTechnique: ORIGIN + '/methods/transparency-score/', distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/transparency' }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/rankings/transparency.csv' }] },
    crumbLd(lang, cr)];
  return { title, desc, body, ld, path };
}
function methodPage(ix, lang) {
  const path = '/methods/transparency-score/', title = t(lang, 'mt_title'), desc = t(lang, 'mt_desc');
  const cr = [['Kolaboro', pre(lang) + '/', 'Kolaboro'], [t(lang, 'crumb_t'), pre(lang) + '/rankings/transparency/', esc(t(lang, 'crumb_t'))], [title, pre(lang) + path, esc(title)]];
  const cols = t(lang, 'mt_cols'), W = t(lang, 'mt_when'), S = t(lang, 'mt_src');
  const rows = KEYS.map(k => '<tr><th scope="row" data-label="' + esc(cols[0]) + '">' + esc(t(lang, 'c_' + k)) + '</th><td class="k-n" data-label="' + esc(cols[1]) + '">' + nf(lang, MAX[k]) + '</td><td data-label="' + esc(cols[2]) + '">' + esc(W[k]) + '</td><td data-label="' + esc(cols[3]) + '"><bdi>' + esc(S[k]) + '</bdi></td></tr>').join('');
  const places = TR_PLACES.map(P => '<li><a href="' + pre(lang) + '/rankings/transparency/' + P.s + '/">' + bdi(P.n) + '</a> <span class="k-muted">(' + bdi(P.cc) + '): ' + th(lang, 'mt_rule_m', { m: P.m.map(bdi).join(', ') }) + (P.a ? '; ' + th(lang, 'mt_rule_a', { a: bdi(P.an || P.a.source) }) + ((P.am || []).length ? ' (' + P.am.map(bdi).join(', ') + ')' : '') : '') + '</span></li>').join('');
  const D = ix.dates, dl = [['/data/named.json', D.named], ['/data/bali-cases.json', D.cases], ['/data/on-time.json', D.ontime], ['/data/web-health.json', D.web], ['/data/lookalikes.json', D.look], ['/data/sanctions.json', D.sanctions], ['/data/gleif-family.json', D.gleif]].map(([f, d]) => '<li><a href="' + f + '"><bdi>' + f + '</bdi></a>' + (d ? ' <span class="k-muted">' + esc(fdt(String(d).slice(0, 10), lang)) + '</span>' : '') + '</li>').join('');
  const body = '<div class="ktr"><section class="k-sec"><div class="k-wrap k-prose"><div class="k-phead">' + crumbHtml(lang, cr) + '<h1>' + esc(title) + '</h1><p class="lead">' + esc(t(lang, 'mt_lead')) + '</p></div>' +
    '<h2 id="weights">' + esc(t(lang, 'mt_w_h')) + '</h2><div class="k-table-wrap ktr-tw"><table class="k-table k-table--dense k-table--stack ktr-mt"><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows + '<tr><th scope="row">' + esc(t(lang, 'name')) + '</th><td class="k-n"><b>100</b></td><td></td><td></td></tr></tbody></table></div>' +
    '<h2 id="rules">' + esc(t(lang, 'mt_rules_h')) + '</h2><ul>' + t(lang, 'mt_rules').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<h2 id="not">' + esc(t(lang, 'mt_not_h')) + '</h2><p>' + esc(t(lang, 'mt_not')) + '</p>' +
    '<h2 id="coi">' + esc(t(lang, 'coi_link')) + '</h2><p>' + esc(t(lang, 'hub_excl')) + ' ' + esc(t(lang, 'coi')) + ' <a href="/independence/">' + esc(t(lang, 'coi_link')) + '</a></p>' +
    '<h2 id="places">' + esc(t(lang, 'mt_places_h')) + '</h2><p>' + esc(t(lang, 'mt_places_t')) + '</p><ul class="ktr-places">' + places + '</ul>' +
    '<h2 id="data">' + esc(t(lang, 'src_data')) + '</h2><ul>' + dl + '</ul>' + replyBox(lang, null) + linksHtml(lang, null) + '</div></section></div>';
  const url = PUB(lang, path);
  const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }, crumbLd(lang, cr)];
  return { title, desc, body, ld, path };
}

// ------------------------------------------------------------------------------------------------ routing
const BODY = new Map();
export async function page(req, u, env, ctx, shell) {
  if (u.pathname === SITEMAP) return sitemap(env);
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[4]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', slug = m[2] || null, method = !!m[3];
  let ix; try { ix = await trData(env); } catch (e) { return null; }
  const key = lang + '|' + (method ? '#m' : slug || '#h') + '|' + ix.v;
  let pg = BODY.get(key);
  if (!pg) { pg = method ? methodPage(ix, lang) : slug ? placePage(ix, slug, lang) : hubPage(ix, lang); if (!pg) return null; if (BODY.size > 600) BODY.clear(); BODY.set(key, pg); }
  const sh = await shell(pre(lang) + '/how-we-score/');
  const url = PUB(lang, pg.path), alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + PUB(l, pg.path) + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + pg.path + '">';
  const tags = '<title>' + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + url + '">' + alts + '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/og.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': pg.ld }).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-kb-tr': ix.v } });
}
async function sitemap(env) {
  let ix; try { ix = await trData(env); } catch (e) { return new Response('Not ready', { status: 503 }); }
  const paths = ['/rankings/transparency/', '/methods/transparency-score/'].concat([...ix.places.keys()].map(s => '/rankings/transparency/' + s + '/'));
  const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const urls = paths.flatMap(p => LANGS.map(l => '<url><loc>' + xe(PUB(l, p)) + '</loc><lastmod>' + ix.updated + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + xe(PUB(a, p)) + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + xe(ORIGIN + p) + '"/></url>'));
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls.join('\n') + '\n</urlset>\n', { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
function rowJson(r, slug) {
  const comp = {}; for (const k of KEYS) { const q = r.comp[k]; comp[k] = { status: q.st === 'yes' ? 'yes' : q.st === 'part' ? 'partly' : q.st === 'no' ? 'not published' : 'not checked', points: q.st === 'nc' ? null : q.pts, max: q.st === 'nc' ? null : q.max }; if (k === 'record') comp[k].record = q.r; }
  return { id: r.id, name: r.n, developer: r.dv, rank: slug ? r['rk_' + slug] : undefined, transparency_score: r.score, points: r.got, points_available: r.avail, reviewed: r.rv, page: r.sumba ? null : ORIGIN + '/projects/' + r.s + '/', components: comp };
}
// 5 requests per IP per 10 minutes: in-isolate count plus a shared count in the colo cache (the DB also refuses a 4th per address per hour)
const RL = new Map();
async function allow(req, ctx) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', w = Math.floor(Date.now() / 600000), k = ip + '|' + w;
  const local = (RL.get(k) || 0) + 1; RL.set(k, local); if (RL.size > 3000) RL.clear();
  let shared = 0; const ck = new Request(ORIGIN + '/__rl-tr23/' + encodeURIComponent(ip) + '/' + w);
  try { const hit = await caches.default.match(ck); if (hit) shared = +(await hit.text()) || 0; } catch (e) {}
  const n = Math.max(local, shared + 1);
  try { const pr = caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': 'max-age=700' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(pr.catch(() => {})); } catch (e) {}
  return n <= 5;
}
async function lead(req, u, env, ctx) {
  const o = (b, s) => new Response(JSON.stringify(b), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
  if (req.method !== 'POST') return o({ error: 'method', use: 'POST {"email","consent":true,"place"}' }, 405);
  const orig = req.headers.get('origin'); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return o({ error: 'origin' }, 403);
  let b; try { const tx = await req.text(); if (tx.length > 2000) return o({ error: 'body' }, 400); b = JSON.parse(tx); } catch (e) { return o({ error: 'body' }, 400); }
  if (b && b.website) return o({ ok: true });   // honeypot: answer like success, store nothing
  const email = String((b && b.email) || '').trim().toLowerCase(), P = TR_PLACES.find(x => x.s === String((b && b.place) || '')), lang = LANGS.includes(b && b.lang) ? b.lang : 'en';
  if (email.length > 200 || !/^[^@\s<>"',;]+@[^@\s<>"',;]+\.[a-z]{2,}$/.test(email)) return o({ error: 'email' }, 400);
  if (!P) return o({ error: 'place' }, 400);
  if (!b || b.consent !== true) return o({ error: 'consent' }, 400);
  if (!(await allow(req, ctx))) return o({ error: 'rate' }, 429);
  const { rpc } = await import('./kolaboro.js');
  const today = new Date().toISOString().slice(0, 10), path = pre(lang) + '/rankings/transparency/' + P.s + '/';
  let r; try {
    r = await rpc('kolaboro_apply', { p_name: 'Transparency ranking request', p_email: email, p_country: P.co, p_phone: '', p_who: 'transparency | ' + P.n + ' | ' + path,
      p_bring: 'Asked for the full transparency analysis of ' + P.n + ' by email (every project\'s details, the documents checked, score-change notes). Consent box ticked on ' + today + ' on ' + path + '.',
      p_learn: '', p_week: '', p_lang: lang, p_source: 'transparency:' + P.s + ' | land=' + path + (b.ref && /^https?:\/\//.test(b.ref) ? ' | ref=' + host(b.ref) : ''), p_plan: 'transparency' });
  } catch (e) { return o({ error: 'db' }, 503); }
  if (r === 'ok' || r === 'too_many') return o({ ok: true, place: P.s });   // too_many: this address already asked 3 times this hour; nothing more is stored
  return o({ error: r === 'invalid' ? 'email' : 'db' }, r === 'invalid' ? 400 : 503);
}
export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '/api/x/transparency/lead') return lead(req, u, env, ctx);
  const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: H });
  let ix; try { ix = await trData(env); } catch (e) { return new Response(JSON.stringify({ error: 'not_ready' }), { status: 503, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) }); }
  const meta = { name: 'Kolaboro transparency score (0-100)', method: ORIGIN + '/methods/transparency-score/', weights: MAX, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', data_read: ix.updated, min_projects_to_rank: MIN_RANK, note: 'Measures what is published and checkable, not quality, safety or value. Not checked components are left out of a project\'s total. Projects of companies linked to Kolaboro\'s founder are excluded.' };
  const slug = p.split('/')[4];
  if (slug) {
    const pl = ix.places.get(slug); if (!pl) return new Response(JSON.stringify({ error: 'place', places: [...ix.places.keys()] }), { status: 404, headers: H });
    return new Response(JSON.stringify(Object.assign(meta, { place: pl.P.n, slug, kind: pl.P.k === 'i' ? 'island' : 'city', country_iso: pl.P.cc, page: ORIGIN + '/rankings/transparency/' + slug + '/', ranked: pl.ranked, projects: pl.n, median: pl.med, permit_published: pl.permit, handover_date_published: pl.date, deposit_protection_stated: pl.deposit, disclosure: pl.P.coi ? t('en', 'coi') : undefined, rows: pl.L.map(r => rowJson(r, pl.ranked ? slug : null)) }), null, 1), { headers: H });
  }
  return new Response(JSON.stringify(Object.assign(meta, { page: ORIGIN + '/rankings/transparency/', places: [...ix.places.values()].map(pl => ({ slug: pl.P.s, place: pl.P.n, kind: pl.P.k === 'i' ? 'island' : 'city', country_iso: pl.P.cc, projects: pl.n, ranked: pl.ranked, median: pl.med, permit_published: pl.permit, handover_date_published: pl.date, deposit_protection_stated: pl.deposit, api: ORIGIN + '/api/x/transparency/' + pl.P.s })) }), null, 1), { headers: H });
}
export { placePage, hubPage, methodPage };   // for the local test
