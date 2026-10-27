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
