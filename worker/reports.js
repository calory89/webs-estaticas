/* SupportNear · avisos «estaba abierto / cerrado» compartidos.
 *
 * Un Worker de Cloudflare con un KV. Gratis hasta 100.000 peticiones al dia,
 * que es muchisimo mas de lo que hace falta. Sin cuentas, sin cookies, sin
 * guardar ninguna IP: solo el id del sitio, la semana, y cuantos dijeron
 * abierto y cuantos cerrado. Para no contar veinte veces al mismo movil se
 * guarda un hash de la IP con una sal que cambia cada dia: al dia siguiente
 * no hay forma de saber quien fue.
 *
 * Desplegar (5 minutos):
 *   1. dash.cloudflare.com -> Workers & Pages -> Create -> Worker -> pegar esto.
 *   2. Storage & Databases -> KV -> crear un namespace «supportnear_reports».
 *   3. En el Worker: Settings -> Bindings -> KV namespace, variable REPORTS.
 *   4. Settings -> Variables -> SALT_SECRET = cualquier texto largo al azar.
 *   5. Copiar la URL del worker (https://xxx.workers.dev) en REPORTS_URL en
 *      index.template.html y volver a construir.
 *
 * API:
 *   POST /r        {"id":"node/123","v":1}   v=1 abierto, v=0 cerrado
 *   GET  /r?ids=node/123,way/456             -> {"node/123":{"o":3,"c":0,"w":"2026-W36"}}
 *   POST /gap      {"lat":40.42,"lon":-3.7,"city":"Madrid","cc":"ES","cat":"food"}   «aqui no hay nada»
 *   GET  /gaps                               -> [{"lat":40.42,"lon":-3.7,"city":"Madrid","cc":"ES","cat":"food","n":3,"t":"2026-09-10"}]
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
};
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

function isoWeek(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, '0');
}
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].slice(0, 12).map(x => x.toString(16).padStart(2, '0')).join('');
}
const OK_ID = /^(node|way|relation)\/\d{1,12}$/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (url.pathname === '/gaps' && req.method === 'GET') {
      const all = (await env.REPORTS.get('gaps', 'json')) || {};
      return json(Object.values(all).sort((a, b) => b.n - a.n).slice(0, 500));
    }
    if (url.pathname === '/gap' && req.method === 'POST') {
      let body; try { body = await req.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      const lat = Math.round((+body.lat || 0) * 100) / 100, lon = Math.round((+body.lon || 0) * 100) / 100;
      if (!lat && !lon) return json({ error: 'bad pos' }, 400);
      const cat = /^[a-z]{0,10}$/.test(body.cat || '') ? (body.cat || '') : '';
      const city = String(body.city || '').slice(0, 60), cc = /^[A-Z]{2}$/.test(body.cc || '') ? body.cc : '';
      const ip = req.headers.get('CF-Connecting-IP') || '';
      const day = new Date().toISOString().slice(0, 10);
      const who = await sha(env.SALT_SECRET + '|' + day + '|' + ip);
      const dupKey = 'g:' + lat + ',' + lon + ':' + cat + ':' + who;
      if (await env.REPORTS.get(dupKey)) return json({ ok: true, dup: true });
      await env.REPORTS.put(dupKey, '1', { expirationTtl: 86400 });
      const all = (await env.REPORTS.get('gaps', 'json')) || {};
      const k = lat + ',' + lon + ':' + cat;
      const g = all[k] || { lat, lon, city, cc, cat, n: 0 };
      g.n++; g.t = day; all[k] = g;
      const keys = Object.keys(all); if (keys.length > 2000) keys.sort((a, b) => all[a].n - all[b].n).slice(0, keys.length - 2000).forEach(x => delete all[x]);
      await env.REPORTS.put('gaps', JSON.stringify(all));
      return json({ ok: true, n: g.n });
    }
    if (url.pathname !== '/r') return json({ error: 'not found' }, 404);

    if (req.method === 'GET') {
      const ids = (url.searchParams.get('ids') || '').split(',').filter(x => OK_ID.test(x)).slice(0, 60);
      const week = isoWeek();
      const out = {};
      await Promise.all(ids.map(async id => {
        const v = await env.REPORTS.get('p:' + id, 'json');
        if (v && v.w === week) out[id] = v;          // solo cuenta la semana en curso
        else if (v) out[id] = { o: 0, c: 0, w: v.w, last: v };
      }));
      return json(out);
    }

    if (req.method === 'POST') {
      let body; try { body = await req.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
      const id = String(body.id || ''); const v = body.v === 1 || body.v === true ? 1 : 0;
      if (!OK_ID.test(id)) return json({ error: 'bad id' }, 400);
      const ip = req.headers.get('CF-Connecting-IP') || '';
      const day = new Date().toISOString().slice(0, 10);
      const who = await sha(env.SALT_SECRET + '|' + day + '|' + ip);
      const dupKey = 'd:' + id + ':' + who;
      if (await env.REPORTS.get(dupKey)) return json({ ok: true, dup: true });
      await env.REPORTS.put(dupKey, '1', { expirationTtl: 86400 });
      const week = isoWeek();
      const cur = (await env.REPORTS.get('p:' + id, 'json')) || { o: 0, c: 0, w: week };
      if (cur.w !== week) { cur.o = 0; cur.c = 0; cur.w = week; }
      if (v) cur.o++; else cur.c++;
      cur.t = day;
      await env.REPORTS.put('p:' + id, JSON.stringify(cur), { expirationTtl: 60 * 86400 });
      return json({ ok: true, ...cur });
    }
    return json({ error: 'method' }, 405);
  }
};
