/* SupportNear service worker.
   Goal: someone installs the app on a library wifi and it still works all week
   with no data. The page itself is cached; map tiles are cached as they are seen. */
const V = 'sn-v16';
const APP = V + '-app';
const TILES = V + '-tiles';
// Lo que el usuario ha guardado a proposito para usarlo sin internet.
// Va en su propia cache y NUNCA se borra por hacer sitio: si alguien se
// baja su ciudad antes de quedarse sin datos, tiene que seguir ahi.
//
// El nombre NO lleva la version, y es importante. Lo llevaba, y la app
// guardaba en 'sn-v5-saved' mientras este fichero leia de 'sn-v6-saved': quien
// se bajaba su ciudad guardaba las teselas en un sitio donde nadie las iba a
// buscar. Al quedarse sin cobertura el mapa salia en blanco, que es justo la
// noche en la que esto tiene que funcionar. Con un nombre fijo, subir de
// version no le borra a nadie lo que se bajo.
const SAVED = 'sn-saved';

// Y por si alguien ya tenia su ciudad guardada con el nombre viejo, se mira
// tambien ahi antes de darla por perdida.
async function savedMatch(req, opts) {
  const direct = await caches.open(SAVED).then(c => c.match(req, opts));
  if (direct) return direct;
  const keys = await caches.keys();
  for (const k of keys) {
    if (k === SAVED || !/-saved$/.test(k)) continue;
    const hit = await caches.open(k).then(c => c.match(req, opts));
    if (hit) return hit;
  }
  return undefined;
}
const TILE_MAX = 900;

self.addEventListener('install', e => {
  // La tabla de emergencias entra en la cache a proposito: es lo unico que hay
  // que poder abrir con el movil sin saldo en mitad de la noche.
  e.waitUntil(caches.open(APP)
    .then(c => c.addAll(['./', './instalar', './emergency-numbers.csv']))
    .catch(() => caches.open(APP).then(c => c.addAll(['./'])))
    .then(() => self.skipWaiting()));
});

// Quien uso la app entre septiembre y hoy puede tener teselas de CARTO
// guardadas con «API KEY REQUIRED» encima — incluso dentro de la ciudad que se
// bajo a proposito, que es la cache que nunca se borra. Se limpian una por una,
// solo esas: lo demas que guardo sigue donde estaba.
async function purgeCarto() {
  const ks = await caches.keys();
  for (const k of ks) {
    const c = await caches.open(k);
    const reqs = await c.keys();
    await Promise.all(reqs.filter(r => r.url.indexOf('cartocdn.com') > -1).map(r => c.delete(r)));
  }
}

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => !k.startsWith(V) && !/-saved$/.test(k)).map(k => caches.delete(k))))
      .then(purgeCarto)
      .catch(() => {})
      .then(() => self.clients.claim())
  );
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  if (keys.length > TILE_MAX) {
    await Promise.all(keys.slice(0, keys.length - TILE_MAX).map(k => c.delete(k)));
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // map tiles: cache first, they never change.
  // Esri (principal) y OpenStreetMap (segundo proveedor). CARTO ya no esta:
  // desde septiembre de 2026 devuelve las teselas con «API KEY REQUIRED»
  // estampada encima y con HTTP 200, asi que una tesela suya guardada en la
  // cache es basura que se seguiria sirviendo para siempre, incluso sin
  // internet. Se bloquea aqui y se borra en el activate.
  if (/basemaps\.cartocdn\.com$/.test(url.hostname)) return;
  if (/arcgisonline\.com$|^tile\.openstreetmap\.org$/.test(url.hostname)) {
    // Cuando la app se esta bajando una zona a proposito, marca la peticion con
    // ?dl=1: aqui se deja pasar sin tocar, y es la app la que la guarda bajo la
    // URL limpia. Asi no se guarda dos veces ni se llena la cache normal.
    if (url.searchParams.get('dl') === '1') return;
    e.respondWith((async () => {
      const keep = await savedMatch(req);
      if (keep) return keep;                       // zona guardada: siempre gana
      return caches.open(TILES).then(async c => {
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && res.status === 200) { c.put(req, res.clone()); trimTiles(); }
          return res;
        } catch (err) {
          return hit || Response.error();
        }
      });
    })());
    return;
  }

  // map data chunks: serve from cache at once, refresh in the background
  if (url.origin === location.origin && /\/d\/[-\d_]+\.json$/.test(url.pathname)) {
    e.respondWith((async () => {
      const keep = await savedMatch(req, { ignoreSearch: true });
      if (keep) return keep;
      return caches.open(APP).then(async c => {
        const hit = await c.match(req);
        const net = fetch(req).then(res => {
          if (res && res.status === 200) c.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      });
    })());
    return;
  }

  // the app itself: network first so updates arrive, cache as the safety net
  if (url.origin === location.origin) {
    // no-cache: se pide al servidor y se acepta su 304, pero nunca se sirve una
    // copia vieja del cache HTTP sin preguntar. El servidor manda el HTML con
    // diez anos de caducidad y sin esto una correccion no llegaba nunca.
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(APP).then(c => c.put(req, copy));
          }
          return res;
        })
        // Sin red: la copia guardada vale aunque la URL lleve la huella del build
        // (instalar.html?v=abc123 y instalar.html son la misma pagina).
        .catch(() => caches.match(req, { ignoreSearch: true })
          .then(r => r || caches.match('./')).then(r => (r && r.redirected) ? new Response(r.body, {status: r.status, statusText: r.statusText, headers: r.headers}) : r))
    );
  }
  // everything else (Overpass, Nominatim) goes straight to the network
});
