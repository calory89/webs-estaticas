// n40 d14: one fetch and one parse per data file for the whole worker. Every loader that shares globalThis.__kbJson calls jget, so
// concurrent cold requests from different modules wait for the same parse instead of each holding its own copy of the same file.
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), FLY = (globalThis.__kbJsonFly = globalThis.__kbJsonFly || {});
export const RAWN = (globalThis.__kbRawN = globalThis.__kbRawN || new WeakMap());   // project object -> its name before kbx_named cleaned it
export const rawOf = x => RAWN.has(x) ? Object.assign({}, x, { n: RAWN.get(x) }) : x;
// key: the __kbJson key; au: assets URL; fu: fallback URL; ttl: edge cache seconds for the fallback. Resolves { t, v, a }, or throws.
export function jget(env, key, au, fu, ttl) {
  const o = SHARED[key];
  if (o && o.a && o.v != null) { o.t = Date.now(); return Promise.resolve(o); }   // a deployment's assets never change: no second parse
  if (FLY[key]) return FLY[key];
  const p = (async () => {
    let r = null, a = false;
    for (let i = 0; i < 2 && !a; i++) try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(au)); a = !!(r && r.ok); } catch (e) { r = null; }   // n40 d15: one retry before the network copy
    if (!r || !r.ok) r = await fetch(fu, { cf: { cacheTtl: ttl || 300, cacheEverything: true } });
    if (!r.ok) throw new Error(key + ' ' + r.status);
    const et = r.headers.get('etag'), c = SHARED[key];
    if (et && c && c.v != null && c.et === et) { try { r.body && r.body.cancel(); } catch (e) {} c.t = Date.now(); c.a = a; return c; }   // same file: keep the copy we have
    const v = await r.json(); if (DUPS.test(key)) intern(v, new Map()); return (SHARED[key] = { t: Date.now(), v, a, et });
  })();
  FLY[key] = p; const d = () => { if (FLY[key] === p) delete FLY[key]; }; p.then(d, d);
  return p;
}
// n40 k65: in these files the same source URLs, dates and labels repeat thousands of times, and every copy was its own string after the
// parse; one shared copy of each value keeps about 7 MB less of named.json, 4 MB of bali-cases.json and 2 MB of price-history.json
const DUPS = /^(?:named|bali-cases|price-history)\.json$/;
function intern(v, M) {
  if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) { const x = v[i]; if (typeof x === 'string') { const c = M.get(x); if (c === undefined) M.set(x, x); else v[i] = c; } else if (x && typeof x === 'object') intern(x, M); } }
  else for (const k in v) { const x = v[k]; if (typeof x === 'string') { const c = M.get(x); if (c === undefined) M.set(x, x); else v[k] = c; } else if (x && typeof x === 'object') intern(x, M); }
  return v;
}
const IF = (globalThis.__kbIF = globalThis.__kbIF || {});   // same in-flight table as the d12 helpers: one load per key at a time
export function sf(k, f) { if (IF[k]) return IF[k]; const p = f(); IF[k] = p; const d = () => { if (IF[k] === p) delete IF[k]; }; p.then(d, d); return p; }
