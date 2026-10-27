# Lo que solo puedes hacer tú (con los pasos exactos)

## 1. Caché de 10 años en las páginas HTML (prioridad alta, 5 minutos)
Problema: nginx sirve prensa.html, cambios.html, c/*.html y t/*.html con `Cache-Control: max-age=315360000`. El .htaccess no se aplica porque nginx va delante de Apache.
En RaiolaCP: WEB → supportnear.com → editar → «Opciones avanzadas» → Plantilla de proxy (nginx): elige una plantilla que no cachee HTML (en Hestia se llama «hosting» o «default» según versión) o añade en «Directivas adicionales de nginx»:

    location ~* \.(html|xml|txt|webmanifest|json)$ {
        expires off;
        add_header Cache-Control "no-cache, must-revalidate";
    }
    location ~* \.(png|jpg|svg|ico|woff2)$ { expires 30d; }

Y añade, en el mismo sitio, las cabeceras de seguridad:

    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Permissions-Policy "camera=(), microphone=(self), geolocation=(self), payment=()";
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";

Si no encuentras la opción, un ticket a Raiola con este texto lo resuelve: «En supportnear.com nginx sirve los .html con expires de 10 años; necesito que .html/.json/.xml salgan con Cache-Control: no-cache, must-revalidate».
Comprobar: `curl -sI https://supportnear.com/prensa.html | grep -i cache-control` debe decir no-cache.

## 2. Usuario FTP fijo (prioridad alta, 3 minutos)
En RaiolaCP → WEB → supportnear.com → «Cuentas FTP adicionales» → crear `supportnear_deploy` con ruta `public_html`. Guárdame el usuario en un mensaje y la contraseña NO me la pases por aquí: métela tú en el panel del gestor de archivos cuando te la pida, o mejor, ponla en un fichero `~/.ftp_deploy` en tu ordenador y dime que está. Con eso puedo publicar y programar el refresco mensual sin que tengas que entrar en el panel cada hora.

## 3. Cloudflare delante (prioridad alta, 20 minutos, gratis)
Resuelve el punto 1, acelera el mundo entero (hoy 0,7–1 s hasta el primer byte fuera de Europa) y añade compresión y protección.
1. cloudflare.com → Add site → supportnear.com → plan Free.
2. Te da dos servidores DNS. En el registrador del dominio (donde compraste supportnear.com) cambia los NS por esos dos. Tarda de minutos a 24 h.
3. En Cloudflare: SSL/TLS → Full (strict). Caching → Configuration → Browser Cache TTL: «Respect existing headers». Speed → Optimization: Brotli on, Early Hints on. Rules → Cache Rules: «*.html → Edge TTL 1 hora, Browser TTL 0» y «/d/*, /l/*, /c/*.cartel.html → Edge 30 días».
4. Avísame y cambio el script de publicación para purgar la caché de Cloudflare en cada subida (necesita un API token con permiso «Cache Purge»; créalo en My Profile → API Tokens y pégalo solo en el panel, no en el chat).

## 4. Worker de avisos (confirmaciones + huecos + reclama tu ficha) (15 minutos)
Está escrito en `worker/reports.js`. Pasos en dash.cloudflare.com → Workers & Pages → Create → Worker → pegar el fichero → Deploy. Storage → KV → crear `supportnear_reports` → en el Worker, Settings → Bindings → KV namespace, variable `REPORTS`. Settings → Variables → `SALT_SECRET` = un texto largo al azar. Copia la URL (https://xxx.workers.dev) y pégamela: yo la pongo en `<meta name="sn-reports">` y desde ese momento salen «3 personas lo vieron abierto esta semana» y el mapa de huecos en cambios.html.

## 5. Número de WhatsApp atendido por una persona
Un número (puede ser WhatsApp Business gratuito en un móvil de la ONG aliada, o tuyo al principio). Me lo pasas con prefijo internacional y lo pongo en `<meta name="sn-whatsapp">`: aparece en el SOS y en el menú como «Escribir a una persona por WhatsApp».

## 6. Search Console y Bing Webmaster (10 minutos)
search.google.com/search-console → añadir propiedad «Dominio» supportnear.com → verificar por DNS (un TXT en el registrador) → Sitemaps → enviar `https://supportnear.com/sitemap.xml`. Lo mismo en bing.com/webmasters (puede importar desde Search Console). Yo ya mando IndexNow en cada publicación (`indexnow.py --send`).

## 7. Correo para el programa «reclama tu ficha»
Crea `hola@supportnear.com` en RaiolaCP (MAIL) y configura SPF/DKIM (el panel lo hace solo). Importa `outreach.csv` en Brevo y usa las plantillas de `outreach_email.md`. Tandas de 500/día. Empieza por `has_hours = no`.

## 8. Pruebas con usuarios
Guion en `docs/pruebas_usuarios.md`. Una tarde, cinco personas, un móvil barato.

---

## 7. Subir a GitHub (prioridad alta, 5 minutos)
El proyecto ya es un repositorio git aquí, con dos commits y un `DEPLOY.md` que
explica cómo reconstruirlo todo desde cero. Le faltan los datos crudos a
propósito: son 50 MB que se vuelven a bajar solos. Lo que hay que hacer es
sacarlo de esta máquina.

1. github.com → New repository → `supportnear` → **Private** (o público, es tu
   decisión: no hay ninguna clave dentro, lo he comprobado).
2. Aquí, cuando me des el nombre del repo y un token con permiso de escritura:

       git remote add origin https://github.com/<tu-usuario>/supportnear.git
       git push -u origin main

   El token **no me lo pegues en el chat**: mételo tú en GitHub como
   «deploy key» o haz el push desde tu ordenador después de clonar esto.
3. Con el repo arriba, cualquiera (tú, un voluntario, yo en otra sesión) puede
   clonar y reconstruir. Hoy, si se pierde este contenedor, se pierde el mapa.

## 8. Comprobaciones después de publicar
- `curl -sI https://supportnear.com/sw.js | grep -i cache` → el service worker
  no debe cachearse; la versión nueva es `sn-v12`.
- `https://supportnear.com/c/valencia.html` → tiene que ser la de **España**
  (hasta hoy era la de Venezuela).
- `https://supportnear.com/c/madrid-food.html` → «Comedores sociales en Madrid».
- `https://supportnear.com/t/madrid.html` → ya **no** lleva noindex.
- Search Console → Sitemaps → volver a enviar `sitemap.xml` (ha pasado de 1.902
  a 6.026 URLs).
