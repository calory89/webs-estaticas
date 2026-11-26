// kolaboro.com batch 21 (n21a): official warnings and notices on developer pages. No model calls. Facts only, never a verdict.
// Data (built on main, published to pub/_lovable):
//   /data/sanctions.json "warnings"  tools/kolaboro-agent/sanctions_screen.py (workflow kolaboro-sanctions.yml, lists read weekly):
//                          official regulator warning lists of unauthorised firms that were read (FCA, AMF, MAS, SFC, FINMA,
//                          Central Bank of Ireland, SEC) and the developer pages whose company name had NO possible match.
//                          Possible matches are never published: admin CRM "Screening" tab, same private list as sanctions.
//   /data/gazette.json     tools/kolaboro-agent/gazette_notices.py (workflow kolaboro-gazette.yml, monthly): notices in BORME (Spain),
//                          BODACC (France) and The Gazette (UK) about developer companies matched by exact legal name (BODACC:
//                          by SIREN). Type, date and link only: no officer names, no notice text.
// Routes:  GET /api/x/gazette (?dev=<slug>)   the notices as JSON
// Developer pages: kbx_watch.js calls warnDevHtml() inside the section #watch; kbx_named.js calls gazDevHtml() for the section #gazette.
import { LOCALE } from './kbx_named_i18n.js';
import { TB } from './kbx_strings.js';

export const PATHS = /^\/api\/x\/gazette$/;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': 'public, max-age=900' }, H) });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
function fdt(d, lang) { try { return dtf(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch (e) { return d; } }
const http = u => /^https:\/\//.test(u || '') ? u : '#';

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = TB.kbx_gaz_S /* n40 k5: in /data/i18n/kbx_gaz.json */;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null ? S[lang][k] : S.en[k]); return typeof s === 'string' && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const gazHeading = lang => t(lang, 'g_h');

const CSS = '<style id="kgaz-css">.kgz-w{margin-top:var(--k-5,24px)}.kgz-w h3{margin:0 0 var(--k-2,8px);font-size:var(--k-fs-lg,20px)}.kgz-co{margin:var(--k-4,16px) 0 var(--k-2,8px)}.kgz-co b{font-weight:650}.kgz-s{list-style:none;padding:0;margin:0 0 var(--k-3,12px);color:var(--k-muted,#56636F);font-size:var(--k-fs-sm,15px)}.kgz-s li{margin:2px 0}' +
  '.kgz td,.kgz th{text-align:start;vertical-align:top}.kgz td:first-child{white-space:nowrap;font-variant-numeric:tabular-nums}.kgz td{overflow-wrap:anywhere}.kgz details{margin-top:var(--k-2,8px)}.kgz summary{cursor:pointer;min-height:44px;display:inline-flex;align-items:center;color:var(--k-sea,#155C75);font-weight:600}.kgz-x{color:var(--k-muted,#56636F)}</style>';

// ------------------------------------------------------------------------------------------------ warning lists line (inside #watch)
export function warnDevHtml(sa, slug, lang) {
  const w = sa && sa.warnings; if (!w || !Array.isArray(w.no_match) || !w.updated) return '';
  const set = w.__set || (w.__set = new Set(w.no_match)); if (!set.has(slug)) return '';
  const ok = (w.lists || []).filter(l => l.ok); if (!ok.length) return '';
  const links = ok.map(l => '<a class="src" href="' + esc(http(l.page)) + '" rel="noopener" target="_blank"><bdi>' + esc(l.short || l.id) + '</bdi>' + (l.list_date ? ' (' + esc(fdt(l.list_date, lang)) + ')' : '') + '</a>').join(' ');
  const hand = (w.not_read || []).map(l => '<a href="' + esc(http(l.page)) + '" rel="noopener" target="_blank"><bdi>' + esc(l.name) + '</bdi></a>').join(', ');
  return '<div class="kgz-w"><h3>' + esc(t(lang, 'w_h')) + '</h3><ul class="fl"><li class="kfact">' + esc(t(lang, 'w_ok', { d: fdt(w.updated, lang), lists: '\u0001' })).replace(/\s*[(（]\u0001[)）]/, '') + '<span class="kgz-ls">' + links + '</span></li></ul><p class="k-xs">' + esc(t(lang, 'w_note')) +
    (hand ? ' ' + esc(t(lang, 'w_hand')) + ' ' + hand + '.' : '') + ' <a href="/data/sanctions.json">sanctions.json</a></p></div><style id="kgazw-css">.kgz-w{margin-top:var(--k-5,24px)}.kgz-w h3{margin:0 0 var(--k-2,8px);font-size:var(--k-fs-lg,20px)}.kgz-ls{display:flex;flex-wrap:wrap;gap:var(--k-1,4px) var(--k-3,12px);margin-top:var(--k-2,8px)}</style>';
}

// ------------------------------------------------------------------------------------------------ gazette notices section (#gazette)
const SRC = { borme: 'BORME', bodacc: 'BODACC', gazette: 'The Gazette' }, SLANG = { borme: 'es', bodacc: 'fr', gazette: 'en' };
function row(r, lang) {
  const th = t(lang, 'th'), k = t(lang, 'k');
  return '<tr><td data-label="' + esc(th[0]) + '">' + esc(fdt(r[0], lang)) + '</td><td data-label="' + esc(th[1]) + '">' + esc(k[r[3]] || k.other) + '</td><td data-label="' + esc(th[2]) + '"><bdi lang="' + (SLANG[r[1]] || 'en') + '" class="kgz-x">' + esc(r[2]) + '</bdi></td><td data-label="' + esc(th[3]) + '"><a class="src" href="' + esc(http(r[4])) + '" rel="noopener" target="_blank"><bdi>' + esc(SRC[r[1]] || r[1]) + '</bdi></a></td></tr>';
}
export function gazDevHtml(gz, slug, lang) {
  const d = gz && gz.devs && gz.devs[slug]; if (!d || !d.searched) return '';
  const names = (d.names || []).map(n => '<p class="kgz-co">' + esc(t(lang, 'g_co')) + ': <b><bdi>' + esc(n.n) + '</bdi></b> <span class="k-muted">(' + esc((t(lang, 'via') || {})[n.via] || '') + ')</span></p>').join('');
  const fr = (d.names || []).find(n => n.siren), se = d.searched, sl = [];
  if (se.borme) sl.push(t(lang, 's_borme', { a: fdt(se.borme.from, lang), b: fdt(se.borme.to, lang) }));
  if (se.bodacc) sl.push(t(lang, 's_bodacc', { n: fr ? fr.siren : '', d: fdt(se.bodacc.to, lang) }));
  if (se.gazette) sl.push(t(lang, 's_gazette', { d: fdt(se.gazette.to, lang) }));
  if (!sl.length) return '';
  const srcs = (gz.sources || []).filter(s => se[s.id]).map(s => '<a class="src" href="' + esc(http(s.url)) + '" rel="noopener" target="_blank"><bdi>' + esc(SRC[s.id] || s.id) + '</bdi></a> <span class="k-muted">(' + esc(s.licence) + ')</span>').join(' ');
  const all = (d.notices_all || []).slice(0, 30), th = t(lang, 'th'), head = '<thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead>';
  const tbl = rows => '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack">' + head + '<tbody>' + rows.map(r => row(r, lang)).join('') + '</tbody></table></div>';
  let body;
  if (!all.length) body = '<ul class="fl"><li class="kfact">' + esc(t(lang, 'g_none')) + ' ' + srcs + '</li></ul>';
  else body = '<p><b>' + esc(t(lang, 'g_n', { n: d.total })) + '</b>' + (d.total > all.length ? ' ' + esc(t(lang, 'g_cap', { n: all.length })) : '') + ' ' + srcs + '</p>' + tbl(all.slice(0, 5)) +
    (all.length > 5 ? '<details><summary>' + esc(t(lang, 'g_more', { n: all.length })) + '</summary>' + tbl(all.slice(5)) + '</details>' : '');
  return CSS + '<div class="kgz"><p class="ki">' + esc(t(lang, 'g_intro')) + '</p>' + names + '<ul class="kgz-s">' + sl.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + body + '<p class="k-xs"><a href="/api/x/gazette?dev=' + esc(slug) + '"><bdi dir="ltr">/api/x/gazette</bdi></a> · <a href="/data/gazette.json"><bdi dir="ltr">gazette.json</bdi></a></p></div>';
}

// ------------------------------------------------------------------------------------------------ JSON API
let MEMO = null;
async function load(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/gazette.json')); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch('https://kolaboro.com/data/gazette.json?v=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  if (v) MEMO = { t: Date.now(), v };
  return v;
}
export async function handle(req, u, env) {
  const gz = await load(env); if (!gz) return out({ error: 'not_built_yet' }, 503);
  const s = u.searchParams.get('dev'), base = { version: gz.version, updated: gz.updated, note: gz.note, method: gz.method, sources: gz.sources, row: gz.row };
  if (s) { const d = gz.devs && gz.devs[s]; return out(Object.assign(base, { dev: s, searched: !!d, names: d ? d.names : [], searched_in: d ? d.searched : {}, total: d ? d.total : 0, notices: d ? d.notices_all : [], note_dev: d ? undefined : 'This developer was not searched: its pages give a brand name, or its country has no open gazette we read. Not a finding.' })); }
  return out(Object.assign(base, { developers: Object.keys(gz.devs || {}).length, devs: gz.devs }));
}
