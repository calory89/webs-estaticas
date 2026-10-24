# Herramientas de carlosdeory.com (24-oct-2026)

Se ejecutan desde la raiz de esta rama (pub/carlosdeory.com) con un servidor local en :8811 cuando hace falta navegador
(`python3 -m http.server 8811`). Los scripts usan /home/claude/tools/ como carpeta de trabajo: copiarlos alli primero.

Orden para regenerar archivos tras cambiar posts:
1. `python3 collect.py` (desde la raiz) -> data.json con posts, tarjetas, categorias y etiquetas
2. `python3 gen_archives.py .` -> categorias y etiquetas con paginacion (12 por pagina) y recuentos reales
3. `python3 fix_site.py .` -> enlaces rotos, relacionados, alt, og:image, feeds del head (idempotente)
4. `python3 gen_feeds.py . AAAA-MM-DD` -> post-sitemap (con imagenes), category-sitemap, feed.xml
5. `python3 links.py` -> debe dar 0 enlaces internos rotos (salvo /wp-json/ dentro de un script)

Otros: optimg.py (fotos >400 KB, max 1600 px), mkpdf.py (Million Mile Playbook ES/EN), mkkit.py (dossier de ponente),
prerender.py (vuelca al HTML los textos data-k de /speaking/ y /growth/), titles.json (titulos corregidos).
Trampa: en _redirects las reglas estaticas van antes que las dinamicas (:placeholder o *), si no Pages ignora parte.
