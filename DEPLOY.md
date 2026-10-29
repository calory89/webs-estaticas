# Cómo se publica SupportNear (desde el 27-oct-2026)

Raiola ya no existe para SupportNear y el servidor Netcup tampoco la sirve.
La web vive en **Cloudflare Pages**, proyecto `web-nomagua`, repo
`calory89/webs-estaticas`, rama **`pub/_wp`**, carpeta **`_s/supportnear.com/`**.
El `_worker.js` de esa rama enruta por dominio (comparte rama con nomagua,
persohna, libro.carlosdeory, etc.): **solo se toca `_s/supportnear.com/`**.

El código fuente está en la rama **`src/supportnear`** del mismo repo.

## Cambiar la app (código, textos, estilo) sin tocar los datos

```bash
python3 build_snapshot.py      # index.template.html + snapshot_live.json + d/ -> index.html, l/*.json
python3 tests/smoke.py http://127.0.0.1:8951/       # con `python3 serve.py` (puerto 8899) o similar
AXE_DIR=<carpeta con node_modules/axe-core> python3 tests/features.py http://127.0.0.1:8951/
```

`snapshot_live.json` se saca de la web publicada (`tools/snap.js index.html snapshot_live.json`)
y `d/` se copia de la web: así el build sale idéntico byte a byte en los datos.
`build.py` mete una **CSP** (Content-Security-Policy) con la huella sha256 de cada
`<script>` en línea: no añadir `onclick="..."` ni scripts de otros dominios sin
añadirlos a `_csp()` en `build.py`.

## Subir

No hay contraseñas ni FTP. Se usa el workflow `patch-pub` de `webs-estaticas`
(rama `main`, `workflow_dispatch`):

1. Empaquetar los ficheros cambiados como `_s/supportnear.com/...` en un `.tgz`.
2. Ponerlo en una URL pública temporal (se usó un bucket temporal de Supabase
   `sn-deploy-<aleatorio>` en el proyecto `oykcsmextclpdnugixqz`, borrado después).
3. Lanzar `patch-pub` con `branch=pub/_wp`, `script=<url de un .py>` que baja el
   `.tgz`, **comprueba el sha256** y solo escribe dentro de `_s/supportnear.com/`.
   Primero `dry_run=true` (dice cuántos ficheros tendrá el despliegue: límite de
   Cloudflare Pages 20.000; el 27-oct eran ~11.400).
4. Comprobar en vivo, fichero a fichero, que lo publicado es idéntico al local.
   Ojo: JSON/JS/XML se cachean 1 h en el borde de Cloudflare (también los 404):
   para comprobar, añadir `?cb=<aleatorio>`.

Después: `python3 indexnow.py --send`.

## Cosas que cambiaron con la mudanza a Cloudflare

- URLs limpias: `/c/madrid.html` responde 308 a `/c/madrid`; `/index.html` 301 a `/`.
  Los canonical, hreflang y el sitemap ya van sin `.html`.
- El contador anónimo ya no es PHP (`stats/s.php` no existe): la app llama a
  `/__sb/public/rest/v1/rpc/sn_tally` (el worker lo pasa a Supabase
  `oykcsmextclpdnugixqz`, tabla `public.sn_stats`, solo se puede sumar uno; la
  tabla no es legible desde fuera). La página pública es `/impacto`
  (`impacto.html` + `impacto.js`, función `sn_impact()`, sin `nofind` ni `city`).
- El service worker (`sn-v16`) guarda `./` y no `./index.html` (una respuesta
  redirigida no sirve para abrir la página sin red).

**Reglas que no se saltan.** Nada de contraseñas en formularios. Cada subida se
comprueba byte a byte contra el fichero local. Nunca Lovable.

## Ronda 18 (27-oct-2026)

- Mapa: `.clus` es `position:absolute` (con `relative` los grupos se pintaban
  desplazados y «caian al mar» al alejar); el grupo se coloca en el sitio real
  mas cercano al centro (medoide); no se repinta a mitad de una animacion de zoom.
  Prueba: `python3 tools/seatest.py <url>` (ningun icono a mas de 30 px de su punto).
- `qa_r18/`: informes de QA (mapa, lista, UI, web publicada) y lo que se arreglo.
- `qa_r18/live_fix/patch_live.py` se paso sobre `pub/_wp` (idempotente). Mete en
  `_worker.js/index.js` tres bloques que solo actuan para supportnear.com:
  www -> 301 al dominio sin www, cabeceras de cache y el fichero de Google.
  Los generadores (`city_pages.py`, `lang_pages.py`, `pages.py`...) ya producen lo mismo.
- Privacidad: los textos ya no dicen que la ubicacion «no sale del movil» (va a
  Overpass, Open-Meteo y al servidor de rutas). Ver `qa_r18/privacy_i18n.json`.
- `falta.html` (nota interna) ya no se publica: esta en `docs/internal/`.
- R18b: sin `maps.mail.ru` entre los servidores Overpass; un `?city=` que no
  existe ya no abre otra ciudad (deja el nombre en el buscador). `indexnow.py`
  envia en tandas de 1.000 (con 7.000 de golpe IndexNow responde 403) y
  `urls_all.txt` sale del sitemap publicado (URLs sin `.html`).

## Ronda 19 (27-oct-2026)
- `faq.a8` dice la verdad (lo paga Carlos de Ory de su bolsillo; sin
  subvenciones ni patrocinadores), igual que `/about`, en los 20 idiomas.
- `/prensa`, `/incrustar` e `/instalar` en los 20 idiomas (`i18n_pages.py`,
  bloques «Ronda 19»); `pages.py` declara el idioma real (wo/bm ya no son fr) y
  el pastun va de derecha a izquierda.
- Tiendas solidarias: la etiqueta dice que venden barato y no son gratis. Quitarlas
  del mapa (17.835 sitios) es decision de Carlos (`build.py` ya las quita al rehacer los datos).
- `notHelp()` en la app quita lo que no es ayuda y sigue en los datos publicados
  (comedor historico, sindicatos, fraternidad, piscinas puestas como duchas).
- Teselas: si una tesela de Esri tarda mucho con la red bien, se pide a OSM.
- Movil apaisado: el sitio elegido se centra en la parte del mapa que se ve.
- Cloudflare: Email Address Obfuscation desactivado en la zona. HSTS
  includeSubDomains NO: ftp/imap/mail/pop/smtp siguen apuntando al servidor viejo
  sin HTTPS valido.

## Refresco de datos de OpenStreetMap (28-oct-2026)

Overpass no sirve para el mundo entero (el 27-oct fallaban 9 de cada 10 consultas).
Se hace con los extractos de Geofabrik y osmium, en GitHub Actions:

1. `refresh/regions.json`: 149 extractos (continentes pequeños enteros; Europa, Asia y
   Norteamérica país a país o estado a estado). Ninguno pasa de 7,5 GB: el disco de un
   runner tiene ~14 GB (por continentes, los jobs murieron sin disco).
2. 8 trabajadores en paralelo: `patch-pub` con `branch=src/supportnear` y un script que
   llama a `refresh/from_pbf_parts.py` con `JOB=k/8 NO_ASSEMBLE=1`. Cada extracto se
   guarda en `raw/parts/<region>.jsonl.gz` y se sube al acabarlo; el log de cada
   trabajador queda en `raw/parts/_log_kde8.txt`. ~45 min en total.
3. Juntar: `python3 refresh/from_pbf_parts.py .` (sin JOB) -> `raw/{nat,cities,planet}.jsonl.gz`.
4. **Capa keep** (imprescindible): `python3 refresh/keep_layer.py . <snapshot de lo publicado>
   [relaciones_overpass.json]` -> `raw/keep.jsonl.gz`. Sin ella se perdían ~25.000 sitios
   que siguen en OSM (los datos publicados vienen de varias descargas con radios más
   amplios). Las relaciones que osmium no sabe dibujar (multipolígonos rotos en el borde
   de un extracto, `type=site`) se bajan aparte de Overpass por id (`rel(id:...);out center tags meta;`).
5. `tools/rebuild_osm.sh` (to_build_inputs + build + páginas) y
   `tools/compare_data.py <publicado> <nuevo>`: no se publica si un país pierde >10 % o
   una ciudad >25 % sin explicación.
6. `qa/live_fix/patch_live.py` sobre el árbol generado: debe cambiar 0 ficheros en la
   segunda pasada.

`robots.txt` ya no lo escribe `city_pages.py` si existe (tiene la sección de
asistentes de IA). `llms.txt` lleva la cifra de sitios a mano.

### Publicar sin GitHub Actions
El 28-oct Actions dejó de arrancar jobs («recent account payments have failed or your
spending limit needs to be increased»). Se publicó con la API de Git (Composio):
`create tree` en tandas de 200 ficheros con `content` y `base_tree` encadenado (más de
~3 MB por llamada da 413), borrados con `sha: null`, comprobación de que cada blob tiene
el sha1 esperado y que no cambia nada fuera de `_s/supportnear.com/`, `create commit`
con el padre actual y `update ref` sin force. Cloudflare Pages despliega solo (~2 min).

## Ronda 20 (28-oct-2026)
- **Tiendas solidarias fuera** (`shop=charity` sin `social_facility`): en `build.py` y en el
  clasificador del cliente; ya no se piden a Overpass. 159.430 sitios. Las 147 páginas
  `c/<ciudad>-clothes` que solo tenían tiendas se cambiaron por una redirección (meta refresh,
  noindex, canonical) a la página de la ciudad.
- **GA4 (G-FJKJE77K4V) + Microsoft Clarity (z4eqcmaic7)**: `analytics_snip.py`, un `<script>`
  en línea en el `<head>` de cada página (lo meten `build.py`, `seo_common.set_csp` y
  `patch_live.set_csp`; 404/impacto/actualizar llevan copia). Lleva el id de GA y
  `clarity.ms/tag`, así el worker `analytics-all` de Cloudflare no mete el suyo.
  No carga con DNT/GPC, en `?embed=1`, con «ahorro de datos» o en 2G, y espera 1,5 s tras
  `load`. GA4 con su cookie `_ga` (sin ella no da datos), sin señales de Google ni anuncios
  y sin el `#fragmento` de la URL. Clarity sin cookies propias (consentv2) y todo el texto
  enmascarado (`data-clarity-mask`). La CSP permite googletagmanager, *.google-analytics,
  *.analytics.google, *.clarity.ms y c.bing.com.
- **Textos de privacidad veraces en 20 idiomas** (ya no dicen «sin rastreo» ni «sin
  cookies»): `wel.trust`, `hero.m2`, `foot.tag`, `share.text`, `priv.2`, `orgs.b3p`,
  `cat.clothes.d`; en las páginas de información `p.t50`, `p.t200`, `v4`; /about.
  `qa_r18/patch_r20_text.py` + `patch_r20b_cookies.py`.
- **Accesibilidad**: las etiquetas para lector de pantalla (cerrar, buscar, zoom, lista...)
  salen en el idioma elegido (claves `a11y.*`, `qa_r18/patch_r20_a11y.py`).
- En móvil la atribución del mapa ya no ocupa dos líneas (sin el prefijo de Leaflet).
- Imágenes sociales nuevas (cifra nueva, sin la pastilla de Ropa): `social/make_social.py`
  con `SN_BASE=http://127.0.0.1:8952/` para fotografiar el mapa desde el build local.

## Ronda 21 (29-oct-2026)
- **Aviso de cookies** (en `analytics_snip.py`, mismo `<script>` de medición): en Europa (zona
  horaria Europe/*, Canarias, Azores, Madeira, Islandia, Feroe o desconocida) GA4 no se carga
  hasta «Aceptar»; con «Rechazar» nunca, y se borran las cookies `_ga` si se retira el permiso.
  Fuera de Europa se carga sin preguntar. Elección en localStorage `sn.ck`. Clarity va siempre
  sin cookies propias y con el texto oculto. El aviso va por debajo de los cuadros de la app
  (z-index 1900) salvo cuando se abre desde «Configurar cookies» (2600). Textos en 20 idiomas.
  Botón «Configurar cookies»: cualquier elemento `data-sn-cookies` (en /about y en «Lo que
  sabemos de ti»).
- **Cabeceras de seguridad** en el worker de `pub/_wp` (`snFinish`, solo supportnear.com, HTML):
  `X-Frame-Options: SAMEORIGIN` y `Content-Security-Policy: frame-ancestors 'self'` salvo con
  `?embed=1` (el mapa incrustable), y `Permissions-Policy` (ubicación y micro solo la propia web).
  Copia del worker en `worker/pub_wp_worker_index.js`.
