import { TB } from './kbx_strings.js';
// kolaboro.com batch 24 (agent n24s, 12 Nov 2026): what people search about one project, answered at the top of its named page.
// Templates only (8 languages); every fact comes from the data the page already holds (named.json, bali-cases.json, promises.json,
// the transparency ranking in kbx_tr.js) and keeps its source link on the page. No verdicts, no opinion words, no Review schema.
// Used by kbx_named.js for: the quick answer, the question headings (when, how much, who, is it legit, where), the related six,
// the search-intent title (under 60 characters) and description (under 155), and by kbx_cite.js for the answer files.
const S = TB.kbx_named_qa_S /* n40 k5: in /data/i18n/kbx_named_qa.json */;

// n27g (batch 27): search titles with the searched word and the year ("<project> reviews 2026: handover date, permit and developer"),
// an overdue handover in the title where it fits, descriptions that open with the fact few other pages give (handover date passed N
// months ago, date moved N times, no permit published), the dated overdue notice on project pages and developer titles with the year.


// "26 months" in the page language; cs: 'dat' for German "seit 26 Monaten", 'gen' for Arabic after "منذ"; f formats the number
const PR = {};
export function months(lang, m, cs, f) {
  const n = f ? f(m) : String(m);
  if (lang === 'es') return m === 1 ? n + ' mes' : n + ' meses';
  if (lang === 'fr') return n + ' mois';
  if (lang === 'de') return m === 1 ? n + ' Monat' : n + (cs === 'dat' ? ' Monaten' : ' Monate');
  if (lang === 'nl') return m === 1 ? n + ' maand' : n + ' maanden';
  if (lang === 'zh') return n + '个月';
  if (lang === 'ru' || lang === 'ar') {
    let k = 'other'; try { k = (PR[lang] = PR[lang] || new Intl.PluralRules(lang)).select(m); } catch (e) {}
    if (lang === 'ru') return n + (k === 'one' ? ' месяц' : k === 'few' ? ' месяца' : ' месяцев');
    return k === 'one' ? 'شهر واحد' : k === 'two' ? (cs === 'gen' ? 'شهرين' : 'شهران') : k === 'few' ? n + ' أشهر' : k === 'many' ? n + ' شهرًا' : n + ' شهر';
  }
  return m === 1 ? n + ' month' : n + ' months';
}
export function q(lang, k, v) {
  const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k];
  return v ? String(s).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(?<!\.)\.\.(?=\s|$)/g, '.') : s;   // n25t: no "г.." when a date ends the sentence
}
const len = s => [...String(s)].length;

// Title under 60 characters: the searched word for the language, then the most clicked fact (handover date, "permit published"),
// then the brand, dropping from the end until it fits. A very long project name keeps only "<name> reviews".
export function qaTitle(lang, f) {
  const base = q(lang, 'b', { n: f.n }), facts = [f.h ? q(lang, 't_h', { h: f.h }) : null, f.pn ? q(lang, 't_pn') : null].filter(Boolean);
  const C = [];
  // n27g: "<name> reviews <year>: <overdue handover | handover date, permit and developer>", longest form that fits first
  const by = f.y ? q(lang, 'b_y', { n: f.n, y: f.y }) : base;
  if (f.y) {
    const lab = f.ov ? [q(lang, 't_ov', { mm: months(lang, f.ov, lang === 'ar' ? 'gen' : 'nom', f.nf) }), q(lang, 't_ov2')] : f.dn && f.dn[0] ? f.dn : [q(lang, 't_lab'), q(lang, 't_lab2')];   // n32s: f.dn, completed projects
    for (const l of lab) C.push(by + q(lang, 's1') + l + ' | Kolaboro', by + q(lang, 's1') + l);
  }
  for (let k = facts.length; k >= 1; k--) { const t = by + q(lang, 's1') + facts.slice(0, k).join(q(lang, 's2')); C.push(t + ' | Kolaboro', t); }
  if (f.y) C.push(by + ' | Kolaboro', by);
  C.push(q(lang, 't_f', { n: f.n }) + ' | Kolaboro', base + ' | Kolaboro', base);
  const n2 = String(f.n).replace(/\s*\([^)]*\)/g, '').trim();   // a long name without its bracketed part ("Meriva Collection (Gardens / Signature)")
  if (n2 && n2 !== f.n) { const b2 = q(lang, 'b', { n: n2 }); if (facts.length) C.push(b2 + q(lang, 's1') + facts[0] + ' | Kolaboro', b2 + q(lang, 's1') + facts[0]); C.push(b2 + ' | Kolaboro', b2); }
  const n3 = (n2 || String(f.n)).split(/,\s|\s[-\u2013]\s|\s\//)[0].trim();   // still too long: the name up to its first comma, dash or slash
  if (n3 && n3 !== n2 && n3 !== f.n) C.push(q(lang, 'b', { n: n3 }) + ' | Kolaboro', q(lang, 'b', { n: n3 }));
  const hit = C.find(t => len(t) <= 60); if (hit) return hit;
  // n25t: names of 50+ characters: drop the developer's name inside the project name, then words that describe rather than name
  // ("Private", "Resort and", "under construction"), then cut at a word boundary (never ending on "at", "in", "near"...).
  // The searched word ("reviews", "opiniones", "Erfahrungen"...) always stays.
  const nm = n2 || String(f.n), V = [];
  const dv = String(f.dv || '').replace(/\s+(global|group|properties|property|developments?|holdings?|land|bhd|berhad|ltd|llc|inc|plc|sa|sl|pjsc|psc|real estate)\.?$/i, '').trim();
  const drop = (t, rx) => t.replace(rx, ' ').replace(/\s{2,}/g, ' ').replace(/\s+([,)])/g, '$1').trim();
  let v = nm; if (dv.length > 3 && v.toLowerCase().includes(dv.toLowerCase()) && v.toLowerCase() !== dv.toLowerCase()) { v = drop(v, new RegExp(dv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')); V.push(v); }
  for (const rx of [/\bunder construction\b/i, /\bresort and\b/i, /\bprivate\b/i]) { const w = drop(v, rx); if (w !== v && w.split(' ').length >= 2) { v = w; V.push(v); } }
  for (const w of V) C.push(q(lang, 'b', { n: w }) + ' | Kolaboro', q(lang, 'b', { n: w }));
  const hit2 = C.find(t => len(t) <= 60); if (hit2) return hit2;
  const room = 60 - (len(q(lang, 'b', { n: '' })));
  const W = v.split(' '), STOP = /^(at|in|near|by|on|of|the|and|with|from|for|under|to|de|del|la|el|y|-|–|,)$/i;
  for (let k = W.length - 1; k >= 2; k--) { const t = W.slice(0, k).join(' ').replace(/[,;:(]+$/, ''); if (STOP.test(W[k - 1]) || len(t) > room) continue; return q(lang, 'b', { n: t }); }
  return base;
}
// Description under 155 characters, most useful facts first; shorter place, then fewer facts until it fits.
export function qaDesc(lang, f) {
  const lead = (pl, by) => q(lang, 'd_lead', { n: f.n, by: by && f.by ? f.by : '', place: pl });
  // n27g: the description opens with the fact few other pages give: a handover date that passed, a date moved, no permit published
  const ov = f.ov && f.h ? q(lang, 'd_ov', { h: f.h, mm: months(lang, f.ov, lang === 'de' ? 'dat' : 'nom', f.nf) }) : null;
  const mv = !ov && f.mv ? q(lang, f.mv === 1 ? 'd_mv1' : 'd_mv', { k: f.nf ? f.nf(f.mv) : f.mv }) : null;
  const first = ov || mv || (f.pn ? null : q(lang, 'd_pn0'));
  const tail = [ov ? null : f.h ? q(lang, 'd_h', { h: f.h }) : q(lang, 'd_h0'), first && !ov && !mv ? null : q(lang, f.pn ? 'd_pn1' : 'd_pn0'), f.s != null ? q(lang, 'd_tr', { s: f.s }) : null, f.rv ? null : q(lang, 'd_nr'), q(lang, 'd_chk', { d: f.d })].filter(Boolean);
  const sp = lang === 'zh' ? '' : ' ', head = first ? [first] : [];
  const leads = [lead(f.place, true), lead(f.place, false), lead(f.place2, true), lead(f.place2, false), q(lang, 'b', { n: f.n }) + (lang === 'zh' ? '。' : '.')];
  for (const ld of leads) for (let k = tail.length; k >= 1; k--) {
    const t = head.concat([ld], tail.slice(0, k)).join(sp); if (len(t) <= 155) return t;
  }
  for (let k = tail.length; k >= 1; k--) { const t = head.concat(tail.slice(0, k)).join(sp); if (head.length && len(t) <= 155) return t; }
  const t = [lead(f.place2, false)].concat(tail.slice(0, 2)).join(sp);
  return len(t) <= 155 ? t : [...t].slice(0, 154).join('').replace(/\s+\S*$/, '') + '.';
}
// words in an English-style sentence (for the 40 to 60 word target of the quick answer; the same parts are used in every language)
export const words = s => String(s).split(/\s+/).filter(Boolean).length;
export const QA_CSS = '#legit .ktr-led{padding:0;list-style:none}#legit .ktr-led li{padding:6px 0;border-top:1px solid var(--k-line)}#legit small,.k6 small{color:var(--k-muted)}#legit .k-src{margin-inline-start:6px}.kqa-sum{font-weight:600}';
