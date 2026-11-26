// comments: _notes/kolaboro-worker-comments.txt
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json, rpc } = KB;
export const PATHS = /^\/api\/x\/qa(\/|$)/;
const MIN_SAMPLES = 20;
const THRESHOLDS = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], TTFB: [800, 1800] };
const PAGES = ['all', 'home', 'project', 'database', 'cases', 'check', 'tools', 'verify', 'status', 'docs', 'content', 'other'];
const HDR = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*' };
export async function handle(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'method not allowed' }, 405);
const p = u.pathname.replace(/\/+$/, '');
if (p === '/api/x/qa') return json(index());
if (p === '/api/x/qa/speed') return speed(ctx);
return json({ error: 'not found', module: 'qa', see: '/api/x/qa' }, 404);
}
function index() {
return {
module: 'qa', about: TB.kbx_qa__t.k0,
endpoints: { speed: '/api/x/qa/speed' },
pages: { visual_tests: '/engineering/visual-tests/', page_weight: '/engineering/page-weight/', speed: '/engineering/speed/', accessibility: '/accessibility/' },
files: { visual_tests_and_page_weight: '/data/quality.json', sbom: '/security/sbom.json', accessibility: '/data/a11y.json', lighthouse: '/data/lighthouse.json' },
};
}
function cell(r) {
const n = +r.n || 0, ok = n >= MIN_SAMPLES, v = r.p75 == null ? null : +r.p75;
const t = THRESHOLDS[r.metric];
return { page: r.page, device: r.device, metric: r.metric, n, p75: ok ? v : null, rating: ok && t && v != null ? (v <= t[0] ? 'good' : v <= t[1] ? 'needs-improvement' : 'poor') : null, enough: ok };
}
async function speed(ctx) {
const ck = new Request(TB.kbx_qa__t.k1);
const hit = await caches.default.match(ck);
if (hit) return new Response(hit.body, { headers: HDR });
const out = {
updated: new Date().toISOString(), state: 'ok', note: null, min_samples: MIN_SAMPLES, thresholds: THRESHOLDS, pages: PAGES,
method: TB.kbx_qa__s.k0 + MIN_SAMPLES + ' samples exist.',
windows: {},
};
let fallback = false;
for (const days of [7, 28]) {
try {
const d = await rpc('kolaboro_qa_vitals', { p_days: days });
if (!d || !Array.isArray(d.rows)) throw new Error('shape');
out.first_day = d.first_day || out.first_day || null;
out.windows[days + 'd'] = { days, samples: +d.samples || 0, device_split: true, rows: d.rows.map(cell) };
} catch (e) { fallback = true; break; }
}
if (fallback) {
out.windows = {};
try {
const d = await rpc('kolaboro_vitals_public', {});
out.first_day = d && d.first_day || null;
out.windows['28d'] = { days: 28, samples: +(d && d.samples_28d) || 0, device_split: false, rows: ((d && d.overall_28d) || []).map(r => cell(Object.assign({}, r, { device: 'all' }))) };
out.windows['7d'] = null;
out.state = 'partial';
out.note = TB.kbx_qa__s.k1;
} catch (e) {
out.state = 'unavailable'; out.note = TB.kbx_qa__t.k2;
}
}
const body = JSON.stringify(out);
if (out.state !== 'unavailable') ctx.waitUntil(caches.default.put(ck, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=600' } })));
return new Response(body, { headers: HDR });
}
