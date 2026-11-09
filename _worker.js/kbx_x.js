// Feature module x for kolaboro.com (see kbx.js): money tools: price below build cost, currency risk, late-handover compensation.
// Owned by block X (batch 4, 4 Nov 2026). Endpoints live under /api/x/x/.
//
// GET /api/x/x/fx?c=IDR,USD[&from=2010-01-01]
//   European Central Bank euro foreign exchange reference rates, daily, for the requested currencies,
//   fetched from the ECB Data Portal (data-api.ecb.europa.eu, dataset EXR) and cached at the edge for 12 hours.
//   Values are units of each currency per 1 EUR, exactly as the ECB publishes them. AED is not an ECB currency:
//   when asked for, it is derived from USD with the fixed peg of 3.6725 AED per USD and flagged as derived.
//   The browser does all simulation; this endpoint only relays and trims open data.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/x(\/|$)/;

const ECB = ['USD', 'JPY', 'BGN', 'CZK', 'DKK', 'GBP', 'HUF', 'PLN', 'RON', 'SEK', 'CHF', 'ISK', 'NOK', 'TRY', 'AUD', 'BRL', 'CAD', 'CNY', 'HKD', 'IDR', 'ILS', 'INR', 'KRW', 'MXN', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'ZAR'];
const PEGS = { AED: { base: 'USD', rate: 3.6725, basis: 'UAE dirham fixed peg of 3.6725 AED per USD (Central Bank of the UAE, in force since 1997)' } };
const TTL = 12 * 3600;

function hdr(extra) {
  return Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600' }, extra || {});
}

async function fx(u, ctx) {
  const asked = String(u.searchParams.get('c') || '').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
  const want = [...new Set(asked)].filter(c => c !== 'EUR').slice(0, 6);
  const bad = want.filter(c => !ECB.includes(c) && !PEGS[c]);
  if (bad.length) return json({ error: 'unsupported currency', unsupported: bad, supported: ['EUR'].concat(ECB, Object.keys(PEGS)) }, 400);
  let from = String(u.searchParams.get('from') || '2010-01-01');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || from < '1999-01-04') from = '2010-01-01';
  const series = [...new Set(want.map(c => PEGS[c] ? PEGS[c].base : c))].sort();
  const key = series.join('+') || 'none';
  const query = 'https://data-api.ecb.europa.eu/service/data/EXR/D.' + (series.length ? series.join('+') : 'USD') + '.EUR.SP00.A?startPeriod=' + from + '&detail=dataonly&format=csvdata';
  // n20f (9 Nov 2026): one edge location answered Cloudflare's own 502 page for one currency pair and date on every call (a stored
  // copy that could not be streamed, left by a slow ECB answer). The stored copy is now read and checked before it is used, a bad
  // one is dropped, the key is new (v2), the ECB call gives up after 12 s and is no longer kept by the edge on its own.
  const ck = new Request('https://kolaboro.com/__kbx_x/fx-v2/' + key + '/' + from + '/' + want.slice().sort().join('+'));
  const cache = caches.default;
  try {
    const hit = await cache.match(ck);
    if (hit) {
      const t = await hit.text(); let ok = false;
      try { const j = JSON.parse(t); ok = !!(j && j.rates && Array.isArray(j.dates)); } catch (e) {}
      if (ok) return new Response(t, { headers: hdr({ 'cache-control': hit.headers.get('cache-control') || 'public, max-age=3600', 'x-kb-cache': 'hit' }) });
      await cache.delete(ck).catch(() => {});
    }
  } catch (e) { try { await cache.delete(ck); } catch (x) {} }

  let txt = '';
  try {
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 12000);
    const r = await fetch(query, { headers: { accept: 'text/csv', 'user-agent': 'kolaboro.com currency-risk tool (+https://kolaboro.com/tools/currency-risk/)' }, signal: ac.signal });
    if (!r.ok) { clearTimeout(tm); return json({ error: 'ECB data portal answered ' + r.status, query }, 502); }
    txt = await r.text(); clearTimeout(tm);
  } catch (e) {
    return json({ error: 'ECB data portal not reachable', query }, 502);
  }
  // CSV columns: KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE
  const by = {};
  const lines = txt.replace(/^\uFEFF/, '').split(/\r?\n/);
  const head = (lines[0] || '').split(',');
  const iC = head.indexOf('CURRENCY'), iT = head.indexOf('TIME_PERIOD'), iV = head.indexOf('OBS_VALUE');
  if (iC < 0 || iT < 0 || iV < 0) return json({ error: 'unexpected ECB response', query }, 502);
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(',');
    if (f.length <= iV) continue;
    const v = parseFloat(f[iV]);
    if (!(v > 0)) continue;
    (by[f[iC]] || (by[f[iC]] = new Map())).set(f[iT], v);
  }
  if (series.some(s => !by[s])) return json({ error: 'series missing in ECB response', query }, 502);
  // Keep only dates where every requested series has a value.
  let dates = series.length ? [...by[series[0]].keys()] : [];
  dates = dates.filter(d => series.every(s => by[s].has(d))).sort();
  const out = {};
  for (const c of want) {
    const p = PEGS[c];
    out[c] = dates.map(d => p ? +(by[p.base].get(d) * p.rate).toPrecision(8) : by[c].get(d));
  }
  const body = {
    source: 'European Central Bank, euro foreign exchange reference rates (dataset EXR, daily, spot)',
    licence: 'ECB statistics may be reused free of charge provided the source is acknowledged (ECB copyright and reuse notice).',
    query,
    unit: 'units of currency per 1 EUR',
    fetched: new Date().toISOString(),
    first: dates[0] || null,
    last: dates[dates.length - 1] || null,
    n: dates.length,
    derived: Object.fromEntries(want.filter(c => PEGS[c]).map(c => [c, PEGS[c].basis])),
    dates,
    rates: out
  };
  const text = JSON.stringify(body), put = cache.put(ck, new Response(text, { headers: hdr({ 'cache-control': 'public, max-age=' + TTL }) })).catch(() => {});
  if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
  return new Response(text, { headers: hdr({ 'cache-control': 'public, max-age=' + TTL, 'x-kb-cache': 'miss' }) });
}

export async function handle(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'method not allowed' }, 405);
  const p = u.pathname.replace(/\/+$/, '');
  if (p === '/api/x/x' || p === '/api/x/x/') return json({ module: 'x', endpoints: { '/api/x/x/fx?c=IDR,USD': 'ECB daily reference rates per EUR for up to 6 currencies (AED derived from the USD peg), cached 12 h' } });
  if (p === '/api/x/x/fx') return fx(u, ctx);
  return json({ error: 'not found', module: 'x' }, 404);
}
