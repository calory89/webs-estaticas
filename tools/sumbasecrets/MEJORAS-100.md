# Sumba Secrets · 100 mejoras (actualizado 11-nov-2026, tarde)

**Hechas: 83 de 100.** Las 17 restantes llevan el motivo. Código: calory89/webs-estaticas `tools/sumbasecrets/` (commit 5b2be27). Worker Cloudflare `sumbasecrets` con KV `sumbasecrets-data` (suscriptores y consejos) y `sumbasecrets-og` (imágenes para redes y PDF).

## Mapa (sumbasecrets.com/map)
1-16. Hecho: pantalla completa; satélite/mapa/relieve; 4 zonas dibujadas; chinchetas por categoría y secretos dorados; filtros; buscador; lista y panel móvil; ficha con galería, consejo, distancias y tiempo; Cómo llegar, Vídeos, Compartir; ciudades con temperatura; aeropuertos; Dónde estoy; Sorpréndeme; pantalla completa y escala; enlace por sitio; idioma.
17. Pendiente: vídeos incrustados. La cuota diaria de búsquedas de la API de YouTube estaba agotada. Ahora hay un botón a los vídeos de cada sitio en YouTube.
18. Hecho: rutas de los itinerarios de 3, 5 y 7 días dibujadas en el mapa (capa "Rutas"; /map#route-itinerary-5-days).
19. Descartado: capa de alojamientos. Regla de Carlos: nunca anunciar hoteles.
20. Hecho: modo sin conexión (service worker: guarda páginas visitadas, mapas y fotos).

## Contenido
21. Hecho: 27 sitios reales (Napu Valley nuevo, con coordenadas OSM).
22. Hecho: 12 sitios secretos.
23. Hecho: 60 fotos reales de Wikimedia Commons con autor y licencia.
24-30. Hecho: preguntas frecuentes por sitio, mejor época, distancias, páginas por región y categoría, itinerario en portada, zonas con foto.
31. Hecho: todos los sitios tienen foto. 11 llevan una foto real de Sumba del mismo tipo de lugar, marcada "Foto de archivo". Sin hoteles: se excluyen Nihi, Cap Karoso, Sumbabari y cualquier hotel o resort (el build falla si entra una).
32. Pendiente: Mbawana y Praijing. Hay fotos, pero no coordenadas fiables.
33-39. Hecho: guías de surf, Pasola, ikat, presupuesto, salud y seguridad, itinerarios de 3/5/7 días (con botón de imprimir) y "Sumba o Bali".
40. Hecho: páginas de Waingapu, Waikabubak, Tambolaka y Waibakul, con tiempo, mapa y sitios cercanos.
41. Hecho: 12 idiomas (EN, ES, ID, DE, FR, NL + IT, ZH, JA, KO, RU, PT). Los 6 nuevos y las guías nuevas, por traducción automática (Workers AI, en caché).
42. Pendiente: un sitio nuevo cada semana como tarea programada. El sistema de permisos no deja crear tareas programadas desde esta sesión.

## SEO técnico
43-45. Hecho: Search Console verificado; sitemap de 721 URLs con hreflang e imágenes, reenviado; IndexNow.
46. Hecho: Bing. Se quitó la "comprobación de integridad del navegador" en la zona (OK de Carlos). IndexNow 200 en Bing y en indexnow.org.
47. Pendiente: alta en Bing Webmaster Tools. Hace falta tocar "Sí" y "30" en el móvil de Carlos para entrar con Google, y el ordenador conectado.
48-67. Hecho: datos estructurados, títulos y descripciones, canonical, migas, enlazado interno, 410 de URLs hackeadas, 404 noindex, redirecciones, robots, llms.txt, manifest, cabeceras de seguridad, caché, fechas, imágenes con tamaño, alt, versión sin JS.
68. Pendiente: pedir indexación a mano de las URLs clave en Search Console (hace falta el ordenador conectado).
69. Pendiente: alta en directorios y guías de viaje (trabajo manual con cuentas).
70. Hecho en código, pendiente de publicar: The Sumba Times enlaza cada sitio mencionado en sus noticias a su ficha.
71. Pendiente: enlaces desde ecobeachcity.com, happylowcost.com y carlosdeory.com. Necesita el OK de Carlos para tocar esas webs.
72. Pendiente: artículos de invitado y menciones en blogs de viaje (trabajo manual).
73. Hecho: 40 imágenes propias de 1200×630 con la marca, una por sitio y por guía, más la portada.
74. Hecho: todas las fotos se sirven desde sumbasecrets.com/ph/ (cuentan como nuestras para Google Imágenes, con caché de 30 días).
75. Hecho: Lighthouse móvil: ficha 84, portada 82 (antes 59), accesibilidad 100, SEO 100.
76. Hecho: hreflang en /map.

## Medición
77-79. Hecho: Clarity, GA4, evento al abrir sitio en el mapa.
80. Pendiente: proyecto de Clarity propio (hace falta el ordenador conectado).
81. Hecho: eventos de clic en Cómo llegar, Apple Maps, Vídeos, Vuelos, The Sumba Times, Guardar, boletín, PDF y consejos.
82. Pendiente: informe semanal de Search Console como tarea programada. Bloqueado por el sistema de permisos.

## Red de Sumba
83-84. Hecho: barra común y noticias de The Sumba Times en la portada.
85-87. Hecho en código, pendiente de publicar: menú y pie de The Sumba Times hacia Sumba Secrets, enlaces automáticos en noticias y el tiempo de la cabecera hacia /weather/. Publicar The Sumba Times desde aquí lo bloqueó el sistema de permisos; sale con su próximo despliegue diario.
88. Pendiente: dominios Sumba apuntando a secciones. Falta saber cuáles están registrados.

## Diseño y experiencia
89-92. Hecho: modo oscuro, móvil, Apple Maps, compartir nativo.
93. Hecho: buscador (/xx/search/) con icono en la cabecera.
94. Hecho: guardar sitios (☆) y página "Guardados".
95. Hecho: itinerarios imprimibles.
96. Hecho: formulario "Comparte foto o consejo" en cada sitio. Los envíos van a moderación (KV, clave tip:pending:...) y no se publica nada sin revisar.

## Captación
97. Hecho: alta al boletín en todas las páginas (KV, clave sub:email). No se envía ningún email.
98. Hecho: guía PDF de los 27 sitios (sumbasecrets.com/sumba-secrets-guide.pdf), a cambio del email.
99. Hecho: enlace "Buscar vuelos a Sumba" hacia happylowcost.com en todas las páginas.
100. Pendiente: anuncios de Meta de prueba hacia /map. Necesita el OK y el presupuesto de Carlos.
