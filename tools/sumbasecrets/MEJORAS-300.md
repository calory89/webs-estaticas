# Sumba Secrets · 300 mejoras (12-nov-2026)

**Hechas: 179 de 300.** Las 121 restantes llevan ⏳ y, cuando depende de algo, el motivo. Lo que se pidió hoy: la portada llama la atención (fotos a pantalla completa que cambian, buscador, secreto del día, vídeos) y el mapa pasa a segundo plano (último del menú, botón flotante y mapa pequeño en cada ficha).

Código: calory89/webs-estaticas `tools/sumbasecrets/` (commit más reciente). Worker Cloudflare `sumbasecrets`.

## Portada (lo primero que se ve)
1. ✅ Portada a pantalla completa con fotos reales de Sumba
2. ✅ Pase de 5 fotos con efecto de zoom lento
3. ✅ Título grande con tipografía editorial
4. ✅ Frase que cambia sola: lagunas, cascadas, aldeas, sabanas, playas
5. ✅ Dos botones claros: Descubre los secretos y Planifica mi viaje
6. ✅ Buscador en la portada
7. ✅ Puntos para cambiar de foto a mano
8. ✅ Nombre del sitio de cada foto, con enlace a su ficha
9. ✅ Hora local de Sumba (WITA) en directo
10. ✅ Tiempo de Waingapu en directo
11. ✅ Amanecer y atardecer del día
12. ✅ Flecha para bajar
13. ✅ Cabecera transparente sobre la foto que se vuelve sólida al bajar
14. ✅ Sombra en los textos para leerse sobre cualquier foto
15. ✅ Primera foto con prioridad de carga y tamaños por pantalla
16. ✅ Bloque Experiencias: playas, cascadas, aldeas, miradores, cultura
17. ✅ Secreto del día, cambia cada día
18. ✅ Mosaico de 9 sitios secretos
19. ✅ Por qué Sumba, en tres ideas
20. ✅ Planifica en 3 pasos
21. ✅ Tarjetas de itinerarios de 3, 5 y 7 días con foto
22. ✅ Sección de vídeos de Sumba
23. ✅ Regiones con foto y número de sitios
24. ✅ Banda Explora el mapa interactivo
25. ✅ Cifras: 4 regencias, 2 aeropuertos, 27 sitios, 12 idiomas
26. ✅ El tiempo en las 4 ciudades
27. ✅ Guías y últimas noticias de The Sumba Times
28. ✅ Animación suave al aparecer cada bloque
29. ⏳ Vídeo de fondo en la portada: hace falta un vídeo propio con derechos
30. ⏳ Foto de portada por temporada (seca/lluvias): falta elegir fotos

## Mapa (secundario, en menú y lateral)
31. ✅ El mapa sale de la portada: va al final del menú
32. ✅ Botón flotante Mapa, oculto sobre la portada hasta bajar
33. ✅ Mapa pequeño en el lateral de cada ficha
34. ✅ Mapa a pantalla completa en /map
35. ✅ Satélite, mapa y relieve
36. ✅ 4 zonas dibujadas
37. ✅ Chinchetas por categoría y secretos en dorado
38. ✅ Filtros por categoría
39. ✅ Buscador dentro del mapa
40. ✅ Panel inferior en móvil
41. ✅ Ficha con galería, consejo, distancias y tiempo
42. ✅ Cómo llegar, Vídeos y Compartir
43. ✅ Ciudades con temperatura
44. ✅ Aeropuertos TMC y WGP
45. ✅ Dónde estoy
46. ✅ Sorpréndeme
47. ✅ Rutas de 3, 5 y 7 días dibujadas
48. ✅ Enlace directo a cada sitio (/map#sitio)
49. ✅ Mapa en los 12 idiomas
50. ✅ Funciona sin conexión con lo ya visitado
51. ⏳ Vídeos dentro de la ficha del mapa (hoy abre YouTube)
52. ⏳ Capa de carreteras en mal estado: no hay datos fiables
53. ✅ Chinchetas agrupadas (clusters) al alejar: ya no se tapan y todas se pueden tocar
54. ⏳ Descargar zona para usar sin red
55. ⏳ Capa de mareas para playas: falta una fuente fiable
56. ⏳ Rutas a pie a cascadas: falta trazado real
57. ⏳ Mbawana y Praijing en el mapa: faltan coordenadas fiables
58. ⏳ Filtro por tiempo de coche desde cada aeropuerto
59. ✅ Sitio abierto resaltado en el mapa y enlaces #sitio que abren la ficha
60. ⏳ Compartir ruta propia

## Ficha de cada sitio
61. ✅ Foto a pantalla completa con nombre grande
62. ✅ Etiquetas de categoría y de sitio secreto
63. ✅ Línea de datos bajo el nombre: región, km a la ciudad y al aeropuerto
64. ✅ Botón con el número de fotos
65. ✅ Autor y licencia de la foto
66. ✅ Texto principal y consejo destacado
67. ✅ Galería en cuadrícula
68. ✅ Visor de fotos a pantalla completa con flechas y teclado
69. ✅ Vídeos con carga al tocar (no ralentizan)
70. ✅ Preguntas frecuentes
71. ✅ Formulario para mandar foto o consejo, con moderación
72. ✅ Ficha rápida fija en el lateral
73. ✅ Mejor época
74. ✅ Ciudad y aeropuerto más cercanos con km
75. ✅ Copiar GPS
76. ✅ Botones Cómo llegar, Apple Maps, Guardar y Compartir
77. ✅ Tiempo en directo de la ciudad cercana
78. ✅ Sitios cercanos en carrusel con km
79. ✅ Anterior y siguiente
80. ✅ Fecha de actualización
81. ✅ Se quitó la frase repetida bajo el título
82. ⏳ Precio de entrada y horarios: hay que confirmarlos en el sitio
83. ⏳ Estado del camino por temporada: falta información local
84. ⏳ Valoraciones de visitantes: necesita moderación y volumen
85. ⏳ Fotos enviadas por usuarios publicadas tras revisión
86. ⏳ Audio-guía corta por sitio
87. ⏳ Nivel de dificultad del acceso
88. ⏳ Mejor hora del día para fotos
89. ⏳ Qué llevar (lista por sitio)
90. ⏳ Versión imprimible de cada ficha

## Contenido y guías
91. ✅ 27 sitios reales con texto propio en 6 idiomas
92. ✅ 12 sitios secretos
93. ✅ Todas las fichas con foto real de Sumba
94. ✅ Sin fotos de hoteles (Nihi, Cap Karoso, Sumbabari y cualquier resort quedan fuera; el build falla si entra una)
95. ✅ Guías de itinerario de 3, 5 y 7 días
96. ✅ Guía de surf
97. ✅ Guía de la Pasola
98. ✅ Guía del ikat
99. ✅ Guía de presupuesto
100. ✅ Salud y seguridad
101. ✅ Sumba o Bali
102. ✅ Cómo llegar a Sumba
103. ✅ Mejor época
104. ✅ Respeto en las aldeas
105. ✅ Páginas de Waingapu, Waikabubak, Tambolaka y Waibakul
106. ✅ Páginas por región
107. ✅ Páginas por categoría
108. ✅ Página de sitios secretos
109. ✅ Página del tiempo con previsión de 7 días
110. ✅ Guía PDF descargable
111. ✅ Vídeos de YouTube elegidos por sitio
112. ✅ 5 sitios nuevos: sabana de Mamboro, Pasunga, tumba de Gallubakul, cascada Harunda y cascada Weekacura
113. ⏳ Guía de festivales y calendario anual
114. ⏳ Guía de buceo y snorkel
115. ⏳ Guía para familias
116. ⏳ Guía de fotografía y drones (normas)
117. ⏳ Glosario de palabras en sumbanés
118. ⏳ Historias de gente local (entrevistas reales)
119. ⏳ Un sitio nuevo cada semana: el sistema no deja crear tareas programadas desde aquí
120. ⏳ Revisión humana de las traducciones automáticas a IT, ZH, JA, KO, RU y PT

## Diseño y marca
121. ✅ Paleta propia: verde teal, coral, arena
122. ✅ Tipografía Fraunces + Inter
123. ✅ Tarjetas con foto a sangre y degradado
124. ✅ Banners con foto en regiones, categorías y listas
125. ✅ Modo oscuro
126. ✅ Botón volver arriba
127. ✅ Bloques oscuros para vídeos y secreto del día
128. ✅ Iconos por categoría
129. ✅ Miniaturas de guías del mismo ancho
130. ✅ Mosaico sin huecos
131. ✅ Logo en texto e icono SVG
132. ✅ Imágenes propias para redes de 1200×630 por sitio
133. ✅ Hover con zoom en tarjetas
134. ✅ Respeta 'reducir movimiento'
135. ⏳ Logo diseñado (hoy es texto)
136. ⏳ Ilustraciones propias de Sumba
137. ⏳ Fotos propias de alta calidad (las de Wikimedia varían)
138. ✅ Autocompletar nombres de sitios en el buscador de portada
139. ⏳ Plantilla de historias para Instagram
140. ⏳ Tipografía de títulos alojada en el propio dominio
141. ✅ Cabecera de red Sumba (Times + Secrets)
142. ✅ Pie con enlaces y créditos
143. ✅ Carrusel horizontal de cercanos
144. ✅ Etiquetas de días en itinerarios
145. ✅ Botones grandes en móvil
146. ✅ Selector de idiomas con banderas (menú desplegable, también en el mapa)
147. ✅ Barra de navegación deslizable en móvil
148. ⏳ Página 404 ilustrada
149. ✅ Barra de navegación inferior en móvil: Sumba, Secretos, Guías, Mapa, Guardados
150. ⏳ Paleta revisada por un diseñador

## Funcionalidades
151. ✅ Buscador del sitio
152. ✅ Guardar sitios y página Guardados
153. ✅ Compartir nativo
154. ✅ Copiar coordenadas
155. ✅ Itinerarios imprimibles
156. ✅ Boletín por email (se guardan altas, no se envía nada)
157. ✅ PDF a cambio de email
158. ✅ Enlace a vuelos con happylowcost.com
159. ✅ Funciona sin conexión
160. ✅ Se instala como app (manifest)
161. ✅ Vídeos sin cookies (youtube-nocookie)
162. ✅ Visor de fotos
163. ✅ Hora y tiempo en directo
164. ⏳ Planificador de viaje: elegir sitios y que salga la ruta
165. ⏳ Calculadora de presupuesto
166. ⏳ Conversor de rupias
167. ⏳ Envío real del boletín: falta elegir herramienta y OK
168. ⏳ Cuentas de usuario
169. ⏳ Comentarios
170. ⏳ Alertas de tiempo (lluvia fuerte)
171. ⏳ Reserva de conductor: necesita socio local y OK
172. ⏳ Chat con IA sobre Sumba
173. ⏳ Exportar Guardados a Google Maps
174. ⏳ Modo viaje: lista del día con mapa
175. ⏳ Notificaciones push
176. ⏳ Comparar dos sitios
177. ⏳ Votar el sitio favorito
178. ⏳ Galería de fotos de visitantes
179. ⏳ Búsqueda por voz
180. ⏳ Widget de tiempo para otras webs

## SEO técnico
181. ✅ Search Console verificado
182. ✅ Sitemap de 721 URLs con hreflang e imágenes
183. ✅ IndexNow (Bing, Yandex) y reenviado hoy
184. ✅ Bing ya no bloqueado por la comprobación de navegador
185. ✅ Datos estructurados: TouristAttraction, FAQ, migas, WebSite con buscador, VideoObject
186. ✅ Títulos y descripciones por página e idioma
187. ✅ Canonical y hreflang
188. ✅ 410 en las URLs del hackeo
189. ✅ 404 con noindex
190. ✅ robots.txt y llms.txt
191. ✅ Cabeceras de seguridad
192. ✅ Caché en el borde
193. ✅ Imágenes servidas desde el dominio propio
194. ✅ Alt en todas las imágenes
195. ✅ Imágenes con tamaño para evitar saltos
196. ✅ Lighthouse: SEO 100, accesibilidad 100
197. ✅ Versión sin JavaScript legible
198. ✅ Enlazado interno entre sitios, regiones, categorías y guías
199. ✅ Preconexión a las imágenes de YouTube
200. ⏳ Alta en Bing Webmaster Tools: hace falta aprobar el acceso en el móvil de Carlos
201. ⏳ Pedir indexación a mano de las URLs clave en Search Console
202. ⏳ Informe semanal de Search Console: tareas programadas bloqueadas
203. ⏳ Páginas por mes (Sumba en julio, etc.)
204. ⏳ Páginas de comparación (Sumba o Flores, Sumba o Lombok)
205. ⏳ Enriquecer cada ficha a más de 600 palabras
206. ⏳ Revisar canibalización entre idiomas cuando haya datos
207. ⏳ Datos estructurados de Event para la Pasola: faltan fechas oficiales
208. ⏳ Sitemap de vídeos aparte
209. ⏳ Medir Core Web Vitals reales en GSC (faltan visitas)
210. ⏳ Mbawana y Praijing como fichas nuevas

## Idiomas
211. ✅ 12 idiomas: EN, ES, ID, DE, FR, NL, IT, ZH, JA, KO, RU, PT
212. ✅ Fichas escritas a mano en 6 idiomas
213. ✅ Traducción automática en caché para el resto
214. ✅ Correcciones de nombres en japonés y chino
215. ✅ URLs por idioma
216. ✅ Selector de idioma que mantiene la página
217. ⏳ Fechas en el formato de cada idioma
218. ✅ Mapa traducido
219. ✅ Textos nuevos de la portada traducidos a los 12
220. ✅ Noticias del Times en EN, ES o ID según idioma
221. ⏳ Revisión nativa de japonés, chino y coreano
222. ⏳ Revisión nativa de ruso
223. ✅ Detectar idioma del navegador y sugerirlo
224. ⏳ Árabe (escritura de derecha a izquierda)
225. ⏳ Hindi
226. ⏳ Polaco
227. ⏳ Sueco
228. ⏳ Versión en sumbanés de los saludos básicos
229. ⏳ Traducir los PDFs
230. ⏳ Imágenes para redes en cada idioma
231. ✅ hreflang x-default
232. ✅ Títulos de vídeo en su idioma original
233. ✅ Indonesio como idioma local prioritario
234. ⏳ Glosario por idioma
235. ⏳ Revisión de tono en alemán y neerlandés
236. ⏳ Fichas de pueblos en todos los idiomas a mano
237. ⏳ Subtítulos de vídeos
238. ⏳ Búsqueda que entienda acentos y sinónimos por idioma
239. ⏳ Páginas de aterrizaje por país de origen
240. ⏳ Nombres de lugares en alfabeto local (JA/ZH/KO) junto al latino

## Medición y captación
241. ✅ Microsoft Clarity
242. ✅ Google Analytics 4
243. ✅ Eventos: Cómo llegar, Apple Maps, Vídeos, Vuelos, Times, Guardar, boletín, PDF, consejos
244. ✅ Evento al abrir un sitio en el mapa
245. ✅ Analítica cargada en diferido (no frena la web)
246. ⏳ Proyecto de Clarity propio: hace falta el ordenador conectado
247. ⏳ Panel semanal de visitas
248. ⏳ Embudo boletín y PDF
249. ⏳ Pruebas A/B del título de portada
250. ⏳ Anuncios de Meta de prueba hacia la web: necesita OK y presupuesto
251. ⏳ Google Ads de búsqueda: necesita OK y presupuesto
252. ⏳ Pinterest con las fotos de cada sitio
253. ⏳ Instagram de Sumba Secrets
254. ⏳ TikTok con los vídeos
255. ⏳ Primer envío del boletín
256. ⏳ Medir búsquedas internas sin resultado
257. ⏳ Mapa de calor de la portada nueva (Clarity, tras visitas)
258. ⏳ Encuesta corta a visitantes
259. ⏳ Alta en directorios de viaje
260. ⏳ Artículos de invitado en blogs de viaje
261. ⏳ Enlaces desde ecobeachcity.com, happylowcost.com y carlosdeory.com: necesita OK
262. ⏳ Acuerdos con conductores y guías locales
263. ⏳ Acuerdos con escuelas de surf
264. ⏳ Prensa en Indonesia
265. ⏳ Afiliación de vuelos
266. ⏳ Afiliación de seguros de viaje
267. ⏳ Programa de embajadores (fotógrafos locales)
268. ⏳ Concurso de fotos
269. ⏳ Notas de prensa del relanzamiento
270. ⏳ Dominios Sumba apuntando a secciones: falta saber cuáles están registrados

## Red Sumba, velocidad y seguridad
271. ✅ Web hackeada limpiada; URLs del ataque devuelven 410
272. ✅ Dominio fuera del proyecto antiguo de Pages
273. ✅ Worker propio en Cloudflare
274. ✅ Barra común con The Sumba Times
275. ✅ Noticias del Times en la portada, sin códigos raros (&#x27;)
276. ⏳ Enlaces del Times a Sumba Secrets: hechos en código, salen con su próximo despliegue
277. ⏳ Tiempo de la cabecera del Times hacia /weather/: igual, pendiente de su despliegue
278. ✅ Proxy de fotos con caché de 30 días
279. ✅ Fuentes cargadas sin bloquear
280. ✅ Leaflet cargado solo donde hace falta
281. ✅ Service worker
282. ✅ Lighthouse móvil: portada 82, ficha 84
283. ✅ Claves temporales de Cloudflare que se borran al acabar
284. ✅ Código en GitHub (calory89/webs-estaticas)
285. ⏳ Subir Lighthouse de portada a 90+ (el pase de fotos pesa)
286. ✅ Proxy de fotos tolera comas y codificaciones distintas (fotos que fallaban en el mapa)
287. ⏳ Monitor de caída con aviso
288. ⏳ Copia diaria de suscriptores y consejos (KV)
289. ⏳ Panel para moderar consejos enviados
290. ⏳ Protección anti-spam en formularios (Turnstile)
291. ⏳ Registro de cambios público
292. ⏳ Política de privacidad propia de la web
293. ⏳ Aviso de cookies si se añaden anuncios
294. ⏳ Despliegue automático al hacer commit
295. ⏳ Pruebas automáticas de cada página antes de publicar
296. ⏳ Alertas si una foto de Wikimedia desaparece
297. ⏳ Revisar cada mes que no entra contenido ajeno (hackeo)
298. ⏳ DNSSEC en el dominio
299. ⏳ Correo propio @sumbasecrets.com
300. ⏳ Página Quiénes somos con la red Sumba
