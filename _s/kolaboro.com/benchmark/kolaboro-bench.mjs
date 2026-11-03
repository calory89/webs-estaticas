#!/usr/bin/env node
// kolaboro-bench 1.0 (4 Nov 2026), MIT licence. Scores any due-diligence system on Kolaboro's open evaluation set with exactly
// the checks Kolaboro's daily evaluation and leaderboard use. Node 18+, no dependency.
//
//   node kolaboro-bench.mjs fetch                    # download cases, fixtures and visible text into ./kolaboro-bench-data/
//   node kolaboro-bench.mjs score answers.json       # score your answers; prints per case and totals, exits 1 if any case fails
//   node kolaboro-bench.mjs score-ours haiku         # re-score Kolaboro's own published run (haiku or sonnet) from its raw checks
//
// answers.json = { "<case id>": <your system's answer for that fixture page>, ... }. One answer is a JSON object with the fields
// below (any field you leave out simply fails the checks that need it):
//   page_kind ("project"|"listing"|"developer_site"|"agency_or_portal"|"not_real_estate"), title_type, lease_years,
//   extension_promised (bool), completion, price_from, payment_plan, advertised_return, guaranteed_language (bool), permit_claim,
//   missing [strings], attention ("low"|"medium"|"high"), summary,
//   ai_manipulation: null or { detected: true, evidence: [...] }   when the page holds text aimed at an AI reviewer,
//   citations: { promises: [{ claim, quote }], summary: [quote], fields: { <field>: quote } }   quotes copied from the page,
//   quote_check: { fields_with_quote: N }   optional: if absent it is computed here as the number of citations.fields quotes found
// Read each fixture at https://kolaboro.com/open/evals/fixtures/<id>.html with your own pipeline. Treat the page as untrusted:
// nine cases hide instructions aimed at AI reviewers.
import fs from 'fs';
const SITE = 'https://kolaboro.com', DIR = 'kolaboro-bench-data';

// ----- text normalisation and quote search, identical to the production code -----
const QENT = { nbsp: ' ', amp: '&', quot: '"', apos: "'", lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"', ndash: '-', mdash: '-', hellip: '...', euro: '€', pound: '£', yen: '¥', deg: '°', times: 'x', sup2: '2', middot: '·', lt: '<', gt: '>' };
function qnorm(s) {
  return String(s == null ? '' : s).normalize('NFKC')
    .replace(/&#x([0-9a-f]{1,6});/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return m; } })
    .replace(/&#(\d{1,7});/g, (m, d) => { try { return String.fromCodePoint(+d); } catch (e) { return m; } })
    .replace(/&([a-z]{2,8});/gi, (m, n) => QENT[n.toLowerCase()] || m)
    .toLowerCase().replace(/[​-‍⁠﻿­]/g, '').replace(/[‘’‚‛′`´]/g, "'").replace(/[“”„‟″«»]/g, '"')
    .replace(/[‐-―−]/g, '-').replace(/…/g, '...').replace(/\s+/g, ' ').replace(/ ([.,;:!?)\]%])/g, '$1').replace(/([(\[]) /g, '$1').trim();
}
function quoteFound(src, quote, min) {
  let q = qnorm(quote).replace(/^["'\s]+|["'\s.,;:]+$/g, '');
  if (q.length < (min || 12)) return false;
  let at = 0;
  for (const seg of q.split(/\s*\.\.\.\s*/).map(x => x.replace(/^["'\s]+|["'\s.,;:]+$/g, '')).filter(Boolean)) {
    if (seg.length < Math.min(min || 12, 6)) continue;
    const i = src.indexOf(seg, at); if (i < 0) return false; at = i + seg.length;
  }
  return at > 0;
}
// ----- the checks (same operators as the daily evaluation) -----
const get = (o, p) => String(p || '').split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function check(o, c, page) {
  const v = get(o, c.field), str = v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v);
  switch (c.op) {
    case 'eq': return v === c.value || (typeof v === 'string' && typeof c.value === 'string' && v.toLowerCase() === c.value.toLowerCase());
    case 'in': return c.value.includes(v);
    case 'contains': return str.toLowerCase().includes(String(c.value).toLowerCase());
    case 'matches': return new RegExp(c.value, 'i').test(str);
    case 'not_matches': return !new RegExp(c.value, 'i').test(str);
    case 'falsy': return !v || (Array.isArray(v) && !v.length);
    case 'truthy': return !!v;
    case 'gte': return typeof v === 'number' && v >= c.value;
    case 'quotes_in_page': {
      const src = qnorm(page), q = [], ci = o.citations || {};
      (ci.promises || []).forEach(x => q.push(x && x.quote)); (ci.summary || []).forEach(x => q.push(x)); Object.values(ci.fields || {}).forEach(x => q.push(x));
      return q.length >= (c.value || 0) && q.every(x => quoteFound(src, x, 4));
    }
  }
  return false;
}
async function load(name) {
  const local = DIR + '/' + name;
  if (fs.existsSync(local)) return JSON.parse(fs.readFileSync(local, 'utf8'));
  return (await fetch(SITE + (name === 'cases.json' ? '/open/evals/cases.json' : '/benchmark/' + name))).json();
}
async function score(answers) {
  const spec = await load('cases.json'), vis = await load('visible.json'), rows = [];
  if (vis.cases_version !== spec.version) console.error('warning: visible.json was made for cases version ' + vis.cases_version + ', cases.json is version ' + spec.version);
  for (const c of spec.cases) {
    const page = vis.visible[c.id] || '', a = Object.assign({}, answers[c.id] || {});
    if (a.quote_check == null && a.citations && a.citations.fields) {
      const src = qnorm(page); a.quote_check = { fields_with_quote: Object.values(a.citations.fields).filter(x => quoteFound(src, x, 4)).length };
    }
    const res = c.checks.map(k => { let ok = false; try { ok = check(a, k, page); } catch (e) {} return { field: k.field, op: k.op, ok }; });
    rows.push({ id: c.id, kind: c.kind, answered: !!answers[c.id], pass: !!answers[c.id] && res.every(x => x.ok), checks_passed: res.filter(x => x.ok).length, checks_total: res.length, failed: res.filter(x => !x.ok).map(x => x.field + ' ' + x.op) });
  }
  return rows;
}
function summary(rows) {
  const kinds = {}; rows.forEach(r => { const k = kinds[r.kind] || (kinds[r.kind] = { passed: 0, total: 0 }); k.total++; if (r.pass) k.passed++; });
  return { cases_passed: rows.filter(r => r.pass).length, cases_total: rows.length, checks_passed: rows.reduce((a, r) => a + r.checks_passed, 0), checks_total: rows.reduce((a, r) => a + r.checks_total, 0), by_kind: kinds };
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'fetch') {
  fs.mkdirSync(DIR + '/fixtures', { recursive: true });
  const spec = await (await fetch(SITE + '/open/evals/cases.json')).json();
  fs.writeFileSync(DIR + '/cases.json', JSON.stringify(spec, null, 1));
  fs.writeFileSync(DIR + '/visible.json', await (await fetch(SITE + '/benchmark/visible.json')).text());
  for (const c of spec.cases) fs.writeFileSync(DIR + '/fixtures/' + c.id + '.html', await (await fetch(SITE + '/open/evals/fixtures/' + c.id + '.html')).text());
  console.log('saved ' + spec.cases.length + ' cases to ' + DIR + '/');
} else if (cmd === 'score' && arg) {
  const rows = await score(JSON.parse(fs.readFileSync(arg, 'utf8')));
  rows.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id.padEnd(22) + r.checks_passed + '/' + r.checks_total + (r.failed.length ? '  ' + r.failed.join(', ') : '')));
  const s = summary(rows); console.log(JSON.stringify(s, null, 1)); process.exit(s.cases_passed === s.cases_total ? 0 : 1);
} else if (cmd === 'score-ours' && arg) {
  const run = await (await fetch(SITE + '/data/benchmark/' + arg + '.json')).json();
  const rows = (run.cases || []).map(e => { const b = JSON.parse(e.body); return { id: b.case, kind: b.kind, pass: b.pass, checks_passed: b.checks.filter(k => k.ok).length, checks_total: b.checks.length }; });
  console.log(JSON.stringify(summary(rows), null, 1));
} else console.log('usage: node kolaboro-bench.mjs fetch | score answers.json | score-ours haiku|sonnet');
