// Kolaboro unit tests (n31t, 18 Nov 2026): the plain-language search parser (/projects/, home search) and the in-browser contract
// reader (/tools/contract-reader/). Both run in the visitor's browser; their code is served by the edge worker (_worker.js/kbx_n30a.js),
// so these tests load that exact code in a small fake browser and check fixed inputs in the 8 site languages.
// Run from the repository root:  node --test _s/kolaboro.com/open/tests/parsers.test.mjs
// No network, no dependencies beyond Node 20+. Results of the latest run: https://kolaboro.com/engineering/checks/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const A = await import(path.join(ROOT, '_worker.js/kbx_n30a.js'));

// a minimal browser: enough for the two client scripts to start
function fakeBrowser(lang, crRoot) {
  const out = { innerHTML: '', querySelectorAll: () => [], scrollIntoView() {} };
  const el = id => id === 'n30cr' ? crRoot : id === 'n30cr-o' ? out : { textContent: '', addEventListener() {}, files: [], value: '' };
  globalThis.window = globalThis;
  globalThis.document = { documentElement: { lang }, querySelector: () => null, querySelectorAll: () => [], getElementById: el,
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, textContent: '' }), head: { appendChild() {} }, addEventListener() {} };
  globalThis.location = { pathname: '/', href: 'https://kolaboro.com/' };
  return out;
}

// ------------------------------------------------------------------ search parser
fakeBrowser('en');
(0, eval)(A.NL_JS);
const P = q => { const r = globalThis.N30.parse(q, null); return { ty: r.ty, pm: r.pm, y0: r.y0, y1: r.y1, pmax: r.pmax, pmin: r.pmin, cur: r.cur, so: r.so, sc: r.sc, left: r.left }; };
const strip = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
const CASES = [
  ['en', 'villas in Bali with a permit, handover 2027, under 400k', { ty: ['v'], pm: '1', y0: 2027, y1: 2027, pmax: 400000, cur: 'USD', left: ['bali'] }],
  ['en', 'apartments in Dubai under $500,000', { ty: ['a'], pmax: 500000, cur: 'USD', left: ['dubai'] }],
  ['en', 'cheapest villas in Phuket', { ty: ['v'], so: 'pr', left: ['phuket'] }],
  ['en', 'most transparent projects score above 70', { ty: [], so: 'tr', sc: 70, left: [] }],
  ['es', 'villas en Bali con licencia, entrega 2027, menos de 400k', { ty: ['v'], pm: '1', y0: 2027, y1: 2027, pmax: 400000, cur: 'USD', left: ['bali'] }],
  ['de', 'Wohnungen in Dubai unter 500.000 €', { ty: ['a'], pmax: 500000, cur: 'EUR', left: ['dubai'] }],
  ['fr', 'appartements à Dubaï livraison avant 2028', { ty: ['a'], y1: 2028, left: ['dubai'] }],
  ['nl', "villa's op Bali zonder vergunning", { ty: ['v'], pm: '0', left: ['bali'] }],
  ['ru', 'квартиры в Дубае до 500 000', { ty: ['a'], pmax: 500000, cur: 'USD', left: ['дубае'] }],
  ['zh', '巴厘岛 别墅 2027年交房', { ty: ['v'], y0: 2027, y1: 2027, left: ['巴厘岛'] }],
  ['ar', 'شقق في دبي أقل من 500 ألف', { ty: ['a'], pmax: 500000, cur: 'USD', left: ['دبي'] }]
];
for (const [lang, q, want] of CASES) test('search parser [' + lang + '] ' + q, () => assert.deepEqual(strip(P(q)), want));
test('search parser: empty and junk input do not throw', () => { for (const q of ['', '   ', '!!!', 'x'.repeat(500), '<script>alert(1)</script>']) assert.ok(globalThis.N30.parse(q, null)); });

// ------------------------------------------------------------------ contract reader
const M = { v: 'test', drop: '', rd: '{i}/{n}', done: '{a} subjects', scan: 'scan', err: 'err', big: 'big', k: '{k} passages', k1: '1 passage', none: 'none', page: 'p. {p}', vals: 'values', more: '{k} more', text: 'text',
  cat: [['ho', 'Handover date', ''], ['pen', 'Penalty for delay', ''], ['esc', 'Escrow or guarantee', ''], ['pay', 'Payment schedule', ''], ['law', 'Governing law', ''], ['can', 'Cancellation and refund', '']] };
const crOut = fakeBrowser('en', { getAttribute: () => JSON.stringify(M), querySelector: () => ({ addEventListener() {} }) });
globalThis.performance = globalThis.performance || { now: () => Date.now() };
(0, eval)(A.CR_JS);
const read = pages => { globalThis.N30CR_TEST(pages); return crOut.innerHTML; };
const found = html => (html.match(/class="n30k is-ok"/g) || []).length;
const EN = 'Clause 4. The Completion Date shall be 31 December 2027. Clause 9. If the Developer fails to deliver, the Developer shall pay a penalty of 0.05% per day of delay. ' +
  'Clause 5. All payments shall be made into the escrow account held with the Bank. Clause 6. Payment schedule: 20% down payment on signing, 30% upon completion of the structure. ' +
  'Clause 15. This Agreement is governed by the laws of the United Arab Emirates. Clause 12. The Purchaser may terminate this Agreement and receive a refund of the amounts paid.';
const ES = 'Cláusula 3. La fecha de entrega será el 30 de junio de 2028. Cláusula 7. En caso de retraso, el promotor abonará una penalización del 1% mensual. ' +
  'Cláusula 4. Las cantidades se ingresarán en una cuenta especial con aval bancario. Cláusula 5. Forma de pago: 10% a la firma y el resto a la entrega. ' +
  'Cláusula 10. Este contrato se rige por la legislación aplicable española y los juzgados de Málaga. Cláusula 8. El comprador podrá pedir la resolución del contrato.';
test('contract reader: English sample finds all 6 subjects', () => assert.equal(found(read([EN])), 6));
test('contract reader: Spanish sample finds all 6 subjects', () => assert.equal(found(read([ES])), 6));
test('contract reader: dates are picked up as values', () => { const h = read([EN]); assert.match(h, /31 December 2027/); });
test('contract reader: text is escaped, never injected', () => { const h = read(['The completion date <img src=x onerror=alert(1)> is 1 May 2027.']); assert.ok(!/<img/.test(h)); assert.match(h, /&lt;img/); });
test('contract reader: unrelated text finds nothing', () => assert.equal(found(read(['A short note about the weather in spring and the garden.'])), 0));
