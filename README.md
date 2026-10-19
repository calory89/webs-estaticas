# Webs estáticas

Copias en HTML estático de las webs que antes eran WordPress. Cada carpeta `sites/<dominio>` es un proyecto de Cloudflare Pages (sin build, salida = esa carpeta).

Se generan con `tools/crawl.sh <dominio>` (wget: enlaces + sitemaps, mismas URLs) y `tools/fix.py` (quita `?ver=` de nombres y enlaces). Comprobación visual contra el original antes de cambiar la DNS.
