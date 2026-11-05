// Feature module 'qa' for kolaboro.com (see kbx.js): quality engineering. Batch 6, block W6 (5 Nov 2026).
//   GET /api/x/qa         index of the quality endpoints and the files the daily job publishes
//   GET /api/x/qa/speed   real-user speed: p75 LCP, INP, CLS, TTFB per page type and device class, last 7 and 28 days,
//                         with sample sizes and a minimum-sample rule. Aggregates only (no IP, cookie or user id exists in the data).
// Data: the kolaboro_vitals table filled by /k/vitals.js through /api/x/f/vitals (collecting since 4 Nov 2026).
// Device split needs the read-only function in scratchpad m12/w6.sql (kolaboro_qa_vitals); until it is applied the endpoint
// answers from kolaboro_vitals_public (28 days, devices combined) and says so in "state" and "note".
import * as KB from './kolaboro.js';
const { json, rpc } = KB;
export const PATHS = /^\/api\/x\/qa(\/|$)/;

const MIN_SAMPLES = 20;   // a p75 from fewer samples than this is not shown
const THRESHOLDS = { LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25], TTFB: [800, 1800] };   // web.dev "good" / "poor" boundaries
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
    module: 'qa', about: 'Quality engineering for kolaboro.com, published so anyone can check it.',
    endpoints: { speed: '/api/x/qa/speed' },
    pages: { visual_tests: '/engineering/visual-tests/', page_weight: '/engineering/page-weight/', speed: '/engineering/speed/', accessibility: '/accessibility/' },
    files: { visual_tests: '/data/visual-tests.json', page_weight: '/data/page-weight.json', sbom: '/security/sbom.json', accessibility: '/data/a11y.json', lighthouse: '/data/lighthouse.json' },
  };
}

function cell(r) {
  const n = +r.n || 0, ok = n >= MIN_SAMPLES, v = r.p75 == null ? null : +r.p75;
  const t = THRESHOLDS[r.metric];
  return { page: r.page, device: r.device, metric: r.metric, n, p75: ok ? v : null, rating: ok && t && v != null ? (v <= t[0] ? 'good' : v <= t[1] ? 'needs-improvement' : 'poor') : null, enough: ok };
}

async function speed(ctx) {
  const ck = new Request('https://kolaboro.com/__kbx_qa_speed_v1');
  const hit = await caches.default.match(ck);
  if (hit) return new Response(hit.body, { headers: HDR });
  const out = {
    updated: new Date().toISOString(), state: 'ok', note: null, min_samples: MIN_SAMPLES, thresholds: THRESHOLDS, pages: PAGES,
    method: 'Field data from real visitors\' browsers: /k/vitals.js reads Largest Contentful Paint, Interaction to Next Paint, Cumulative Layout Shift and Time to First Byte with PerformanceObserver (no third-party library) and sends one beacon per page view to /api/x/f/vitals. Bots, Lighthouse and our own test browsers are dropped. Stored per sample: page type, device class (mobile when the browser reports a mobile device or the viewport is 760 px wide or less, otherwise desktop), metric and value. No IP, cookie, URL or user id. Shown here: the 75th percentile (percentile_cont) per page type and device class over the last 7 and 28 UTC days, only where at least ' + MIN_SAMPLES + ' samples exist.',
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
      out.note = 'The per-device and 7-day breakdown starts when the read-only database function kolaboro_qa_vitals is installed. Until then this shows 28 days with phones and desktops combined.';
    } catch (e) {
      out.state = 'unavailable'; out.note = 'The real-user speed data could not be read just now. Nothing is estimated in its place.';
    }
  }
  const body = JSON.stringify(out);
  if (out.state !== 'unavailable') ctx.waitUntil(caches.default.put(ck, new Response(body, { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=600' } })));
  return new Response(body, { headers: HDR });
}
