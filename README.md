# SupportNear.com — EN LÍNEA en https://supportnear.com

App de mapa: al abrir, se localiza y muestra dónde hay comida, alojamiento,
duchas, ropa, atención social, salud, agua potable y sitios donde estar,
gratis y cerca de ti.

Un solo archivo: `index.html`. **Cero dependencias externas.** Sin backend, sin
build, sin base de datos, sin CDN. Funciona abriéndolo con doble clic, sin internet.

---

## Qué cambia respecto a la versión anterior

- **No hay página de presentación.** Abres y ya estás en el mapa.
- **Los datos van dentro del archivo.** 12.638 puntos reales de toda España,
  incrustados. Primer resultado en pantalla en **menos de 600 ms incluso con la
  API en vivo caída** (probado bloqueando toda la red externa).
- Overpass en vivo sigue funcionando **por encima**, en segundo plano: enriquece
  lo que ya se ve y cubre el resto del mundo. Si falla, no se nota.
- **La librería del mapa (Leaflet) va dentro del archivo**, no desde un CDN. Ese
  era el fallo de la versión anterior: si el CDN estaba bloqueado, no arrancaba.
  Probado abriendo el archivo con `file://` y **toda la red externa bloqueada**:
  40 fichas y 120 marcadores en pantalla. Lo único que no se ve sin internet son
  las calles del fondo, y sale un aviso que lo explica.

## Qué hay dentro (por categoría)

| Categoría | Puntos | Qué es |
|---|---:|---|
| Comida | 111 | Comedores sociales, bancos de alimentos, neveras solidarias |
| Alojamiento | 126 | Albergues, centros de acogida, plazas de emergencia |
| Duchas | 3.845 | Duchas públicas, baños, aseos gratuitos |
| Ropa | 93 | Roperos solidarios, Cáritas, tiendas benéficas |
| Atención social | 1.809 | Cáritas, Cruz Roja, centros de día, ONGs de ayuda |
| Salud | 3.023 | Centros de salud, ambulatorios, hospitales, urgencias |
| Agua potable | 1.886 | Fuentes públicas (desactivado por defecto) |
| Sitio donde estar | 1.745 | Bibliotecas y centros cívicos (desactivado por defecto) |

**Más 111 ciudades del mundo (159 en el buscador, 84 países):** Londres, París, Nueva York, Ciudad de México,
Buenos Aires, Bogotá, El Cairo, Casablanca, Kiev, Lisboa, Berlín, Roma, Atenas,
Varsovia, Estambul, Nairobi, Johannesburgo, São Paulo, Lima, Bucarest, Moscú,
Río de Janeiro, Karachi, Teherán, Dakar, Bamako, Delhi, Manila y Lagos.

**Total: 16.987 puntos.** Cobertura nacional para servicios sociales,
Cáritas, Cruz Roja, bancos de alimentos, comedores, albergues, hospitales y centros
de salud; agua potable y bibliotecas limitados a las 40 ciudades más grandes.

## Filtrado: lo que se ha dejado FUERA a propósito

La calidad importa más que la cantidad. Un punto equivocado son 40 minutos
andando para nada. Se excluyen:

- Albergues del Camino de Santiago, albergues juveniles, hostales y campings
  (1.447 falsos positivos que salían al buscar "albergue").
- Abogados de extranjería privados: cobran. Solo entra asistencia jurídica
  gratuita explícita.
- Residencias de mayores, pisos tutelados y centros de día de mayores o
  infancia: no son sitios a los que entras a pedir ayuda.
- Clínicas privadas: solo centros de salud, ambulatorios y hospitales.
- Colegios profesionales, centros culturales, ONGs que no son de ayuda social
  (transparencia, cultura, deporte).

## Ya está publicado

Subido el 19-ago-2026 a `/web/supportnear.com/public_html/index.html` en el servidor
(panel RaiolaCP → File Manager → net2ftp). El archivo servido es byte a byte idéntico
al de aquí. SSL de Let's Encrypt activo. El servidor comprime con Brotli: el visitante
descarga ~440 KB, no 1,27 MB.

Para volver a publicar tras un cambio: `python3 build.py` y sube el `index.html`
por el File Manager del panel a esa misma ruta (sobrescribe).

## Cómo publicarlo en otro sitio

**GitHub Pages:** sube `index.html` a un repo → Settings → Pages → main / root.
**Netlify / Vercel / Cloudflare Pages:** arrastra la carpeta.

La geolocalización **solo funciona en HTTPS**. Las tres opciones lo dan gratis.

## Cómo actualizar los datos

```
python3 build.py     # reconstruye index.html desde index.template.html + raw_es*.json
```

- `index.template.html` — la app, con `/*__DATA__*/` como hueco.
- `raw_es.json`, `raw_es2.json` — respuestas crudas de Overpass.
- `build.py` — clasifica, filtra el ruido e inyecta los datos.
- `fetch2.py` / `fetch3.py` — vuelven a descargar de Overpass (tardan ~15 min).

Para añadir más ciudades o países: mete sus coordenadas en `fetch2.py`,
ejecútalo, y luego `build.py`.

## Lo que se añadió el 19-ago (tarde)

**Modo "Ahora mismo".** Un botón en la barra superior. Ignora las categorías y
responde a una sola pregunta: *son las 21:40, ¿dónde duermo hoy?* Ordena albergue →
comida → duchas → atención social, quita lo que sabemos cerrado, y encabeza con la
hora real y el aviso de llamar antes.

**"Qué necesitas para entrar".** Una fila nueva en cada ficha. Muestra lo que dicen
las etiquetas de OSM (gratis / cobran / con cita / no se entra de la calle / solo
socios / hace falta derivación) y, cuando no hay dato, una guía honesta por categoría:
*"Muchos albergues piden reservar plaza el mismo día, o que te derive un trabajador
social. Llama antes de ir andando."* Ningún otro mapa lo tiene.

**Verificación por la comunidad, sin cuenta ni servidor.** Botones "Estaba abierto" /
"Estaba cerrado". Se guarda en el propio móvil (se ve como etiqueta en la ficha) y se
ofrece publicarlo como **nota pública de OpenStreetMap**, que se puede crear sin
registrarse. Ahí es donde ayuda a los demás.

**Horarios.** Se leen ahora de cuatro etiquetas de OSM, no de una: 2.139 puntos con
horario (antes 371). Donde falta, la ficha dice "sin confirmar" con un enlace directo
para añadirlo en OSM en 30 segundos.

**Funciona sin datos de verdad.** `sw.js` cachea la app y **los tiles del mapa que vas
viendo** (hasta 900). Instalas la app con el wifi de una biblioteca y funciona toda la
semana sin saldo, con las calles incluidas. `manifest.webmanifest` la hace instalable.

**Transporte público.** Cuando el sitio está a más de 8 km, la ficha ofrece el botón
"En transporte público" con el itinerario, no solo el tiempo andando.

**Capa de mujeres y familias.** Cuatro filtros nuevos: Mujeres, Familias y niños,
Migrantes y refugiados, Sin hogar. Salen de `social_facility:for`. Cuando no hay
resultados lo dice claro: muy pocos sitios declaran a quién atienden, y quitar el
filtro puede ser mejor idea que quedarse sin nada.

## Idioma

**13 idiomas:** inglés, español, francés, árabe (RTL), ucraniano, rumano, polaco,
ruso, portugués, urdu (RTL), persa (RTL), wolof y bambara. Wolof y bambara son
parciales a propósito: lo que falta cae a francés, no a inglés, porque es la segunda
lengua real en Senegal y Malí.

**Siempre arranca en inglés.** En cuanto la geolocalización resuelve el país, la app
cambia sola al idioma local (`LANG_BY_CC`): España y Latinoamérica → español,
Francia y África francófona → francés, países árabes → árabe con RTL, Ucrania →
ucraniano, el resto → inglés. Si la persona elige idioma a mano, se respeta para
siempre y ya no se cambia solo.

## Velocidad

Tres cosas, por orden de impacto:

1. Los datos se emiten como `JSON.parse('…')` en vez de un array literal de
   JavaScript: el motor los lee al doble de velocidad.
2. **Coordenadas delta**: los puntos se ordenan espacialmente y cada coordenada se
   guarda como la diferencia entera respecto a la anterior (en 1e-5 grados). El
   bloque de datos bajó de 1.528 KB a 1.382 KB y comprime mucho mejor.
3. **Depuración espacial**: duchas de playa, aseos y fuentes venían en hileras
   redundantes; se conservan 2-3 por kilómetro cuadrado. 2.657 puntos menos sin
   perder cobertura útil.

**Primera ficha en pantalla: ~800 ms** con 20.253 puntos y 159 ciudades. El archivo
pesa 2,32 MB pero el servidor lo comprime con Brotli: el visitante descarga **780 KB**.

## Para prensa

- `social.png` (1200×630) es la tarjeta que aparece al pegar el enlace en WhatsApp,
  X o LinkedIn. Se regenera con el bloque de Pillow del final de esta sección del
  historial; las cifras salen de `STATS`, así que nunca mienten.
- Las meta de Open Graph y Twitter se generan en `build.py` a partir de los datos
  reales: no hay ninguna cifra escrita a mano.
- **Enlaces profundos**: `supportnear.com/?city=Nairobi` abre esa ciudad y
  `supportnear.com/#p=node/123` abre ese sitio concreto. Sirve para que un medio
  enlace exactamente lo que menciona en el artículo.
- Barra de cifras dentro del modal de información: ciudades / sitios / idiomas / 0 €.
- Botón **Compartir SupportNear** que usa el compartir nativo del móvil.

## UX

- **Agrupación de marcadores** propia (sin librerías): con 12.638 puntos el mapa sigue
  fluido. El tamaño de celda se adapta al zoom; a partir de zoom 17 se ven uno a uno.
- **Buscador que funciona sin internet**: busca por nombre entre los 12.638 puntos
  (sin acentos, "caritas" encuentra "Cáritas") y entre 48 ciudades. Nominatim se
  añade por encima si hay conexión.
- Pasar el ratón por una ficha resalta su marcador en el mapa.
- Botón **Llamar** directo en la ficha cuando hay teléfono.
- Los cuatro filtros de público se agrupan en un solo chip **"Para quién"** que abre
  una hoja: la barra de filtros pasó de 15 chips a 11 y se navega mucho mejor en móvil.
- **Flechas arriba/abajo** recorren la lista y van abriendo cada ficha.
- Botón **Copiar la dirección** en la ficha, para pegarla en un SMS o enseñarla.
- En móvil el botón "Ahora mismo" se acorta a **"Ahora"** para que el buscador
  siga siendo usable en pantallas de 390 px.
- **En móvil la ficha ocupa la mitad de la pantalla**, no toda: el mapa se sigue
  viendo y el marcador se desplaza hacia arriba para que quede a la vista.
  Un toque en la cabecera la expande al 86%; arrastrar hacia abajo la cierra.

## Errores corregidos (19-ago, tarde)

- **Clic en un marcador te llevaba a otro sitio y no hacía zoom.** La causa: se
  llamaba a `panTo()` y a `setZoom()` seguidos, y las dos animaciones de Leaflet
  peleaban entre sí; el mapa acababa en un punto intermedio. Ahora hay **un solo
  `setView`** por movimiento. Regla del proyecto: nunca dos movimientos de mapa
  encadenados. Lo mismo pasaba al geolocalizar (`renderMe` movía el mapa y luego
  lo movía el llamador) — `renderMe` ya solo pinta el punto azul.
- El marcador seleccionado ya no se esconde dentro de un grupo al alejar el zoom.
- Un clic sobre un marcador ya no cuenta también como clic en el mapa (cerraba
  la ficha que se acababa de abrir).
- Ids duplicados imposibles: un punto en vivo con el mismo id que uno incrustado
  hacía que el mapa volara a las coordenadas equivocadas.
- **Si estás lejos de España** (los datos incrustados son españoles), antes salía
  un mapa en blanco y fichas de "1.688 km · 21.642 min andando". Ahora el mapa se
  centra en ti, se explica la situación y se ofrecen 8 ciudades de acceso directo.
  El tiempo andando solo aparece si está por debajo de 8 km.

Verificado con Playwright: 10/10 clics en marcador centran exactamente en el sitio
correcto a zoom 16; los grupos hacen zoom sin abrir ficha; caso "lejos de España"
y caso normal, ambos correctos; consola sin errores.

## Lo que queda por tocar

1. Correos `partners@supportnear.com` y `hello@supportnear.com` (placeholders).
2. Cifras de impacto del modal de información: son estimaciones sin fuente.
   Cámbialas antes de meterlas en una solicitud de subvención.
3. Números de emergencia por país (`EMG` en el archivo): verifícalos para los
   países donde vayas a hacer difusión.
4. **Comida (80) y alojamiento (92) son pocos** para toda España: es el estado
   real de OpenStreetMap, no un fallo del código. Una tarde de mapeo con una
   entidad local en una ciudad piloto multiplica esa cifra, y el arreglo se
   queda en OSM para todo el mundo.

Datos © colaboradores de OpenStreetMap (ODbL). Mapa base © CARTO.

## 25-ago — 300 ciudades nuevas y la carga por trozos

**458 ciudades · 128 paises · 34.752 sitios.** Antes eran 159 ciudades y 84 paises.

### De donde salen las ciudades (y por que no me las he inventado)

1. `cities_osm.py` pide a OpenStreetMap todo `place=city` con poblacion > 600.000.
   Nombre y coordenadas salen de ahi, no de mi memoria.
2. `cities_country.py` le pregunta el pais a Nominatim por coordenadas, a 1 peticion
   por segundo (su limite). 680 candidatas.
3. `select300.py` reparte por rondas: primero la ciudad mas grande de cada pais,
   luego la segunda de cada pais, y asi. Ordenar solo por poblacion daba una lista
   80% china, que para un mapa de ayuda es mala cobertura. Tope de 10 por pais.
   Resultado: 299 ciudades en 91 paises.
4. `fetch300.py` baja los datos de Overpass y escribe cada ciudad segun llega, con
   reintentos en cuatro espejos. Cuatro ciudades fallaron y se reintentaron solas.

### La carga por trozos

Meter 34.752 sitios dentro del HTML habria dado un fichero de 3,5 MB. Ahora:

- El mundo esta partido en celdas de **2,5 grados** -> `d/<lat>_<lon>.json` (378 ficheros, 1,3 MB en zip).
- `index.html` lleva solo un **nucleo de 1.360 sitios** (los 3 mas cercanos a cada
  ciudad) para que la app nunca este vacia, ni sin red ni antes de que llegue nada.
- Al abrir y al mover el mapa se piden solo las celdas que toca **lo que se ve**:
  `viewRadiusKm()` mide el propio viewport, asi que en un movil se bajan 3 celdas,
  no 9. El service worker las guarda (stale-while-revalidate).
- `index.html`: 2.317 KB -> **549 KB** (192 KB comprimido).

### El fallo que estaba costando 12 segundos

Perfilando la carga: `DOMContentLoaded` a los **12.582 ms**. No eran los datos.
Era la hoja de Google Fonts (`fonts.googleapis.com`), que **bloquea el pintado**
hasta que responde. En una red lenta, o en un pais donde Google esta bloqueado,
el usuario se quedaba 12 segundos mirando una pantalla en blanco. Justo la persona
para la que esta hecha esta web es la que tiene la peor conexion.

Fuera las tres etiquetas de fuentes. Ahora usa la tipografia del propio telefono.

    DOMContentLoaded  12.582 ms -> 232 ms
    primer icono en el mapa      -> 404 ms

Esto confirma la regla de siempre: **cero dependencias externas**. Ya habia mordido
dos veces (Overpass en vivo, Leaflet desde CDN); las fuentes eran la tercera.

### Limpieza de datos (lo que se ha quitado y por que)

Al pasar de 84 a 128 paises, los filtros escritos pensando en España dejaban pasar
cosas que en otros idiomas son basura:

- **Baños de pago vendidos como duchas gratis.** `amenity=public_bath` casi siempre
  se paga: sento japones (~500 yenes), hammam, piscina municipal. De 1.389, solo 60
  dicen `fee=no`. Y 213 sento estaban puestos en OSM como `amenity=shower`; se
  detectan por el sufijo 湯. **-1.522 sitios.** La app promete ducha gratis.
- **Clubes privados de socios**: American Legion, AMVETS, Royal Canadian Legion,
  Elks Lodge, Rotary, Lions, Kiwanis, Hogar del Pensionista. Son locales cerrados,
  no sitios donde te atienden si no eres de la casa.
- **Comida y refugios para animales**: Berliner Tiertafel es un banco de comida para
  mascotas. Ahora se rechaza `social_facility:for=animal` por etiqueta, y Tiertafel,
  Tierheim, dierenasiel, animal shelter, humane society por nombre.
- **Sitios cerrados en japones**: 廃業 (cerrado el negocio), 閉店, (跡) "lo que queda de".
  Mandar a alguien sin techo a una puerta tapiada es peor que no decirle nada.
- **Bug de escapado que llevaba ahi desde el principio**: `\\(cerrado\\)` dentro de una
  cadena `r'...'` es una barra literal seguida de un grupo, no el texto `(cerrado)`.
  Nunca habia filtrado nada. Arreglado; `NOTHELP` esta ahora escrito como una lista
  agrupada por motivo, para poder discutir cada linea por separado.

**-1.731 sitios en total.** Menos sitios y mejor mapa.

### El titular: que se puede decir sin mentir

- **128 paises**, contados por codigo ISO. Antes se contaban por nombre y "Maroc" y
  "Morocco" salian como dos paises distintos; ahora cada ciudad lleva su ISO
  resuelto por coordenadas (`legacy_cc.py`).
- El mapa internacional mas grande que he encontrado es **RefAid: 41 paises**
  (https://refaid.com). **Ask Izzy** (Australia) tiene ~370.000 servicios, muchos
  mas que nosotros, pero **en un solo pais**.
- Por eso el titular es "**mapped in 128 countries**" y no "el mapa mas grande".
  Lo primero se puede comprobar y aguanta; lo segundo, no.

### Ficheros que hay que subir

`index.html` · `d.zip` (net2ftp lo descomprime solo) · `sw.js` (v3) · `social.png`

### El fallo que habria congelado los datos durante 10 anos

Publicado y comprobado sitio por sitio, Nairobi seguia enseñando "Central hospital
- Private Practice", que yo acababa de quitar. El fichero del servidor SI estaba
corregido (comprobado bajandolo con curl y buscando el id `way/314452231`: no esta).
Lo que pasaba estaba en las cabeceras:

    Cache-Control: max-age=315360000     # 10 anos
    Expires: Thu, 31 Dec 2037

El servidor manda los `.json` con diez anos de cache. Una vez que un navegador se
baja `d/16_-2.json`, **no lo vuelve a pedir jamas**. Es decir: si manana cierra un
albergue y lo quito del mapa, la gente que ya ha usado la app lo seguiria viendo
abierto durante una decada. En una web de ayuda eso no es un detalle de rendimiento,
es mandar a alguien sin techo a una puerta cerrada.

Arreglado sin tocar el servidor: `build.py` calcula una huella SHA-1 de los datos
(`DATA_V`) y la app pide `d/<celda>.json?v=<huella>`. Si cambia un solo sitio,
cambia la URL y la cache se rompe sola. Si no cambia nada, se sigue aprovechando
la cache de 10 anos, que para esto es perfecta.

    const DATA_V = '5d1233ce';
    fetch('d/'+k+'.json'+(DATA_V?'?v='+DATA_V:''))

Solo se detecto porque comprobe el resultado en el navegador de verdad en vez de
fiarme de que el fichero estuviera subido.

### Hospitales privados fuera

Nairobi abria con cuatro hospitales privados como "ayuda". Ahora se rechaza
`operator:type=private|business` y los operadores que se llaman `private`,
`private practice`, `private institution`, `private limited`, `pvt ltd`. Se buscan
formas concretas y no la palabra suelta, porque "Private Voluntary Organisation"
es una ONG y esa tiene que quedarse.

El total apenas baja (34.582 -> 34.580) porque hay un tope de sitios de salud por
ciudad: al quitar un hospital privado entra el siguiente de la lista. Lo que mejora
no es la cifra, es lo que ve el usuario.

**Queda pendiente**: los hospitales privados que en OSM no estan etiquetados como
privados siguen entrando (p. ej. "Frontline Medical Consultants limited"). Filtrar
por nombre a ciegas se llevaria por delante clinicas de ONG, asi que de momento no.

## 25-ago (noche) — autoria, bucle de correccion, kit de prensa, incrustar

Siete cosas de la lista de prioridades, hechas y publicadas.

### 1. Nombre y cara (era el 98)

**Carlos de Ory · @mrstartups**, dentro del modal de informacion, y en `prensa.html`.
El correo de prensa se escribe **con espacios** (`carlos @ equinoxinvestmentgroup . com`)
porque los robots que recogen direcciones buscan texto con arroba pegada. En el codigo
va partido en tres trozos y solo se junta al pulsar «Copiar la direccion»:

    const PRESS = ['carlos','equinoxinvestmentgroup','com'];
    function pressMail(){ return PRESS[0]+String.fromCharCode(64)+PRESS[1]+'.'+PRESS[2]; }

Se quito tambien el `mailto:partners@supportnear.com`, que era una direccion inventada.

### 2. Fuera «Horario sin confirmar»

Estaba en casi las 35.000 fichas. Una etiqueta que dice «no lo sabemos» repetida 35.000
veces no informa: solo hace que el mapa parezca vacio. Ahora, sin horario, la tarjeta no
pone nada y la ficha ensena directamente «anade el horario», que si sirve para algo.

### 3. Los dos botones del bucle (era el 86)

- **«Esto ya no existe»**, en rojo y bien visible en cada ficha. Un sitio cerrado es lo
  peor que puede tener este mapa: alguien anda media hora hasta una puerta tapiada.
- **«Aqui falta un sitio»**, al final de la lista, con las coordenadas del centro del mapa.

Los dos van a una nota de OpenStreetMap. No hace falta backend y el arreglo lo ve todo el
mundo, no solo nosotros.

### 4. Numeros de emergencia de 227 paises (era el 68)

Habia **34 paises escritos a mano**. Ahora hay **227 sacados de Wikidata** (propiedad
P2852) con `emg_wikidata.py`, y la tabla entera se puede descargar desde el propio boton
rojo: **emergency-numbers.csv**, 656 filas con pais, numero, servicio y fuente.

Dos decisiones que costaron trabajo y que importan:

- **Cual es «el numero»**. En Reino Unido es el 999 y en Australia el 000, aunque el 112
  tambien funcione: hay que ensenar el que la gente de ese pais conoce. Pero en India el
  numero nacional **es** el 112 y el 108 es solo la ambulancia. La regla que sale bien en
  los tres casos: manda el statement de Wikidata sin ningun matiz, y solo despues los
  marcados como 'emergency'. Cuando gen no es 112 pero el pais tiene 112, se anade aparte
  como «funciona desde cualquier movil».
- **Las lineas de ayuda no estan en Wikidata** y son las mas utiles de todas: 016, 115,
  988, 116 123. Esas siguen escritas a mano y van primero.

`emergency-numbers.csv` entra en la cache del service worker a proposito: es lo unico que
hay que poder abrir con el movil sin saldo en mitad de la noche.

### 5. La imagen que si se comparte (era el 70)

Nadie comparte una herramienta; se comparte un dato que sorprende. Boton **«Compartir lo
que hay cerca»** que dibuja en un canvas una imagen de 1080x1080 con la frase real:
«**21 sitios gratis a menos de 990 m de aqui**» y el nombre de la ciudad. Se manda con el
compartir nativo del movil y, si no lo hay, se descarga. Todo en el navegador, sin pedirle
nada a ningun servidor.

### 6. Incrustar el mapa (era el 80)

`?embed=1` quita la cabecera y deja solo el mapa, con un enlace de vuelta:

    <iframe src="https://supportnear.com/?embed=1&city=Sevilla" width="100%" height="600"></iframe>

`incrustar.html` lo explica con un ejemplo funcionando dentro de la propia pagina.

### 7. Kit de prensa y sin conexion (eran el 82 y el 58)

- **prensa.html**: cifras, parrafo de 50 palabras, parrafo de 200, capturas reales,
  enlaces profundos, y una seccion **«lo que no decimos»** que reconoce que los datos no
  estan verificados uno a uno. Un periodista que lo lea sabe a que atenerse.
- **instalar.html**: como dejarlo en la pantalla de inicio en Android y iPhone, y una tabla
  de que funciona sin conexion y que no.
- En la app, un aviso que aparece **una sola vez** diciendo que ya esta guardado en el
  telefono. Solo se ensena cuando el service worker ya controla la pagina de verdad:
  prometer que funciona sin cobertura antes de que sea cierto seria mentirle a alguien que
  igual se queda sin datos esa misma noche.

### Nota sobre las capturas

Chromium no llega al CDN de teselas desde este contenedor, pero curl si. `shots.py`
intercepta las peticiones de tesela y las sirve por curl, asi que las capturas del kit de
prensa son del sitio real y no montajes.

### Subido

`index.html` (583 KB) · `sw.js` (v4) · `social.png` · `d.zip` (378 trozos) ·
`extras.zip` (prensa, incrustar, instalar, CSV y las tres capturas).

## 25-ago (noche, 2) — menu al pulsar el nombre, y contacto

Pulsar **SupportNear** abria directamente la pantalla de privacidad y no habia forma de
llegar al kit de prensa, a como instalarlo, ni de escribir a nadie. Ahora abre un menu:

    EL MAPA
      Volver al mapa
      Que sabemos de ti: casi nada
      Funciona sin cobertura            -> instalar.html
    ORGANIZACIONES Y PRENSA
      Kit de prensa                     -> prensa.html
      Pon este mapa en tu web           -> incrustar.html
      Corregir los datos                -> OpenStreetMap
    CONTACTO
      Escribir a Carlos                 -> ventana de contacto

### La ventana de contacto

Asunto (Prensa / Colaborar / Algo del mapa esta mal / Otra cosa) y un cuadro de texto.
Al pulsar **«Abrir mi correo»** se abre el correo del propio movil con el asunto y el
mensaje ya escritos, y se anade automaticamente la ciudad que estaba viendo, que es el
dato que siempre falta cuando alguien avisa de que un sitio esta mal.

No hay servidor, asi que no se puede recibir un formulario aqui, y la ventana lo dice:
*«Esto abre tu propio correo. Aqui no se guarda nada y ningun mensaje pasa por esta web.»*
Encaja con lo de no rastrear a nadie: no hay ni donde guardarlo.

### La direccion sigue sin poder rastrearse

En pantalla se ve `carlos @ equinoxinvestmentgroup . com`. En el HTML **no existe** la
direccion pegada: va partida en tres trozos y solo se junta al pulsar, tanto en la app
como en `prensa.html`. Comprobado sobre lo publicado:

    curl -s https://supportnear.com/ | grep -c "carlos@equinoxinvestmentgroup.com"   -> 0
    curl -s https://supportnear.com/prensa.html | grep -c "..."                      -> 0

Y el mailto que se genera al pulsar si es correcto:

    mailto:carlos@equinoxinvestmentgroup.com?subject=SupportNear%20%C2%B7%20Prensa&body=...

En el kit de prensa hay ademas boton **«Escribirme»** y **«Copiar la direccion»**. Si el
navegador no deja copiar (permisos, http), en vez de no hacer nada selecciona el texto
para poder copiarlo a mano.

## 25-ago (noche, 3) — logo a la home, por que falla el GPS, mapa descargable

### 1. El logo vuelve a la home

Pulsar **SupportNear** abria el menu, que no es lo que espera nadie de un logo. Ahora:

- En el mapa, el nombre deshace lo que hubiera abierto o filtrado y lo deja como recien
  abierto, sin recargar (`goHome()`).
- En prensa / incrustar / instalar, el logo y el nombre llevan a la home.
- El menu se ha movido a su propio boton de tres rayas, al lado del nombre.

### 2. Por que no funciona la ubicacion

Antes, si fallaba, salia un aviso que decia «La ubicacion esta desactivada» y ya. Ni por
que, ni como se enciende, ni si el mapa sirve igual. Ahora se distingue el motivo real
—que el navegador da en `err.code`— y cada uno tiene su explicacion:

| Motivo | Que se dice |
|---|---|
| Permiso denegado (1) | Dijiste que no, o ya lo habias dicho antes. Toca el candado de la barra de direcciones → Ubicacion → Permitir. |
| Sin posicion (2) | La ubicacion del movil esta apagada, o estas dentro sin cobertura. Enciendela y acercate a una ventana. |
| Ha tardado demasiado (3) | Pasa dentro de un edificio. Prueba junto a una ventana. |
| No es conexion segura | Los navegadores solo dan la posicion en https. Abre https://supportnear.com |
| El navegador no la tiene | Busca tu ciudad arriba; todo lo demas funciona igual. |

Y siempre, debajo, «Mientras tanto: el mapa funciona igual sin eso» con seis ciudades
para elegir y un boton de reintentar. Nadie se queda mirando un error sin salida.

De paso: el service worker se registraba solo con `location.protocol==='https:'`, asi que
no arrancaba en `localhost`, que **si** es un contexto seguro. Ahora usa `isSecureContext`.

### 3. Descargar el mapa, como en Google Maps

Menu → **Guardar esta zona para usarla sin internet**. Tres tamanos, con los megas de
cada uno calculados sobre las teselas que hacen falta de verdad:

    Solo por aqui       4 km    zooms 13-16    ~3 MB
    La ciudad entera   12 km    zooms 12-16   ~20 MB
    Ciudad y alrededores 25 km  zooms 11-15   ~21 MB

Cuanto mas grande es la zona, menos detalle se guarda: nadie se baja 25 km a nivel de
portal, y asi la opcion grande sigue cabiendo en un movil.

Se baja el mapa **y** los sitios de ayuda, con barra de progreso, boton de parar, lista de
zonas guardadas con su tamano real y su fecha, y borrado individual. Va en su propia cache
(`sn-v5-saved`) que el service worker **nunca borra para hacer sitio**: si alguien se baja
su ciudad con el wifi de una biblioteca antes de quedarse sin datos, tiene que seguir ahi.

Tres cosas que costaron encontrar y que habrian dejado esto inservible en silencio:

1. **Las URL de las teselas tenian que ser exactas.** La capa usa **4** subdominios
   (`abcd`) y yo calculaba `(x+y) % 3`. Se descargaban 500 teselas y el mapa salia en
   blanco igual, que es el peor resultado posible. Ahora se construyen con la misma
   plantilla (`layer._url`) y la misma cuenta que usa Leaflet, y el tema oscuro tiene otra
   ruta entera (`dark_all`), asi que se guarda la del tema en uso.
2. **`mode:'no-cors'` reventaba el espacio.** Con respuesta opaca el navegador la cuenta
   en la cuota inflada varios megas por tesela: bajarse una ciudad se quedaba sin espacio
   antes de la mitad. El CDN de CARTO manda `access-control-allow-origin: *`, comprobado,
   asi que se pide en modo normal y se guarda lo que pesa de verdad.
3. **Se guardaba dos veces.** El service worker interceptaba la descarga y la metia
   tambien en la cache normal, que ademas se recorta a 900. Ahora la app marca la peticion
   con `?dl=1`, el service worker la deja pasar sin tocar, y la app la guarda bajo la URL
   limpia. Una sola copia.

Comprobado con la red **cortada del todo** en Playwright: 15 de 15 teselas pintadas,
2.803 sitios y 40 fichas, con la zona «ciudad entera» guardada.

### 4. Prensa, incrustar e instalar en ingles y espanol

Las tres paginas salen **en ingles por defecto**, y en espanol si sabemos que la persona
lo habla: primero el idioma que eligio en la app (`sn.lang`), y si no, el del navegador.
Los dos idiomas van en el mismo fichero y se ensena uno u otro con CSS, asi que no hay
peticion extra ni parpadeo. Hay tambien un EN / ES manual que se recuerda.

Comprobado: `en-US` → ingles, `es-ES` → espanol, `fr-FR` y `sw-KE` → ingles.

### 5. Quien esta detras

    Carlos empezo este proyecto, con otros nombres, en 2007, el ano que cumplio 18.
    Durante anos fue anadiendo sitios a mano, uno a uno. Con la ayuda de otras
    herramientas por fin hemos podido ampliarlo a todo el mundo: 34.580 sitios en
    128 paises. No tiene animo de lucro y no lo va a tener.
    Si algun medio quiere hacerse eco, lo agradeceremos.

En la app y en el kit de prensa, en los dos idiomas.

### Nota de publicacion

La sesion del gestor de archivos caduca. La subida decia «ENVIADO» y no habia subido nada:
lo que llegaba era una pagina de error de FTP. Se detecto comparando los bytes publicados
con los locales. Para renovarla hay que entrar al panel, cambiar a `admin -> supportnear`
y volver a pasar por `/generate/net2ftp/`, que emite una URL nueva. **Comprobar siempre
el tamano de lo publicado, no fiarse del mensaje de la subida.**

## 27-ago — repaso de UX, sobre todo en movil

Cinco cosas rotas en un movil de 375 px, encontradas probando en un iPhone SE simulado.

### 1. Las hojas de abajo se metian debajo de la barra del navegador

`height:70vh` en un movil es el 70% de la pantalla **con la barra del navegador
escondida**. Como casi nunca esta escondida, el panel de resultados y la ficha se metian
por debajo. Arreglado con `dvh`, que es la altura que de verdad se ve, dejando `vh` como
respaldo para navegadores viejos:

    #app     height:100vh; height:100dvh
    .panel   height:min(70vh,560px); height:min(70dvh,560px)
    .detail  height:52vh; height:52dvh   (y 86dvh abierta del todo)

### 2. El cuadro de «no hemos podido saber donde estas» no cabia

El titulo se metia debajo de la X, el boton de reintentar quedaba fuera de la pantalla y
no se podia hacer scroll. Ahora, por debajo de 640 px, **todos** los cuadros se comportan
como una hoja que sube desde abajo: tope de `88dvh`, titulo pegado arriba con hueco para
la X, cuerpo con scroll propio y respeto del area segura del movil.

Ademas el boton **«Probar otra vez»** se ha subido justo debajo de «como encenderla»:
quien acaba de leer «ponlo en Permitir» quiere probar ahi mismo, no seguir bajando.

### 3. «Sin conexion» se quedaba puesto para siempre

Salia un cartel, no se podia quitar, no volvia a desaparecer aunque volviera la cobertura,
y no habia nada que pulsar. Explicar a todo el mundo como se enciende la conexion es
imposible —cada movil lo pone en un sitio distinto— asi que lo que hay ahora es:

- Un boton **Reintentar** que vuelve a pedir las teselas y los datos.
- Una X para quitarlo.
- Y se va **solo** en cuanto entra una tesela o el navegador avisa de que hay red
  (`window.addEventListener('online', ...)`).
- El texto es la mitad de largo: «Sin conexion. No se ven las calles, pero los sitios y
  las distancias son correctos.»

### 4. Seis controles en 375 px y el buscador decia «Searc»

Arriba habia logo, menu, buscador, «Ahora mismo», emergencias, idioma y tema. En el movil
quedan solo los cuatro que hacen falta en la calle: **logo, buscador, emergencias y menu**.

- **«Ahora mismo»** pasa a ser la primera pastilla de la fila de filtros, que es donde se
  mira.
- **Idioma** y **claro/oscuro** se van al menu.
- En escritorio no cambia nada.

Y de paso se resuelve lo del «boton que no hace nada»: el logo ahora lleva a la home y el
menu tiene su propio boton de tres rayas, en vez de dos cosas parecidas juntas.

### 5. Los avisos se tapaban entre ellos

La barra de «esto funciona sin cobertura» salia encima de la lista y encima de la ficha
que la persona estaba leyendo, y podia salir a la vez que el cartel de «sin conexion»,
que dice lo contrario. Ahora:

- Sube por encima del panel en el movil.
- No sale si hay una ficha o un cuadro abierto.
- No sale si en ese momento no hay conexion.
- Si se abre una ficha mientras esta puesta, se quita sola.
- Y el texto cabe en dos lineas: «Ya esta guardado en tu movil. Abrelo aunque no tengas
  datos.»

### 6. El idioma, desde el primer segundo

La app arrancaba siempre en ingles y solo cambiaba al idioma del pais **despues** de que
la persona aceptara la ubicacion. Si decia que no, se quedaba en ingles para siempre.
Ahora tambien se mira `navigator.languages` al arrancar: si el navegador ya dice que la
persona habla espanol, arabe o ucraniano y lo tenemos, la app sale en ese idioma sin
pedir nada. Sigue siendo ingles por defecto cuando no lo sabemos.

## 27-ago (2) — probado en el navegador de Instagram

Carlos lo probo desde un enlace de Instagram en un iPhone. Cuatro cosas.

### 1. «0 sitios» con el mapa lleno de puntos

Estando en Aalborg (Dinamarca), la lista decia **«Nearby help · 0 places»** mientras el
mapa ensenaba grupos de 37, 3 y 3 puntos ahi al lado. No es que estuviera mal el dato:
es que la lista solo miraba dentro de 30 km y, si no habia nada, se rendia.

Alguien que ve 37 puntos en la pantalla y lee «0 sitios» piensa que la web esta rota, y
tiene razon en pensarlo. Ahora, cuando no hay nada cerca, se ensenan **los 25 mas
cercanos que haya**, ordenados por distancia, con una tarjeta encima que lo dice claro:

    Lo mas cercano esta lejos
    Lo mas cercano que conocemos esta a 143 km. Te lo ensenamos igual,
    o salta a una ciudad:  [Londres] [Paris] [Nueva York] ...

El subtitulo tambien deja de mentir: «25 sitios · el mas cercano a 143 km».

### 2. El idioma ya no cambia solo

Movio el mapa a Paris y la app se puso **en frances sola**, y ya no volvia. El idioma es
de la persona, no del sitio que esta mirando. Quitado el cambio automatico por pais.

En su lugar sale una barra discreta con el idioma escrito en su propio idioma
(«Français») y un boton **Cambiar**. Si la cierras, ese idioma no se vuelve a ofrecer
nunca (se recuerda en `sn.langAsked`). Si la aceptas, queda como eleccion manual y ya no
cambia nada mas. Comprobado: en Paris sigue en ingles; tras aceptar espanol, en Berlin
sigue en espanol.

El idioma de arranque sigue siendo el del navegador, que **si** es el de la persona.

### 3. Tres barras una encima de otra

Llegaron a salir a la vez el aviso de sin conexion, la oferta de idioma y «funciona sin
cobertura», pisandose entre ellas y tapando la lista. Ahora:

- Todas van a la misma pila (`#bars`), apiladas y separadas, nunca superpuestas.
- «Funciona sin cobertura», que es la menos urgente, no sale si ya hay otra.
- La pila **se esconde entera** cuando se abre la lista o una ficha: son avisos de paso y
  quien esta leyendo no necesita que le tapen media pantalla.
- Vigilado con un `MutationObserver` sobre las clases del panel y de la ficha, en vez de
  acordarse de llamar a la funcion en los seis sitios que las cambian.

### 4. Botones cortados por el borde

En 375 px el boton de emergencias se salia por la derecha: el buscador no cedia sitio.
Arreglado con `flex:none` en los botones y `flex:1 1 auto; min-width:0` en el buscador,
botones de 40 px en movil, y la fila de filtros con su `scroll-padding` y un tope al
final para que no quede media pastilla cortada. Ademas la fila vuelve al principio cuando
se reconstruye, que era por lo que aparecia empezada por la mitad.

### Y una que no estaba pedida

El cuadro de «no hemos podido saber donde estas» salia **nada mas abrir la web** a
cualquiera que dijera que no a la ubicacion. Es lo primero que veia mucha gente. Ahora
solo sale si la persona **pulsa la diana**; al abrir por primera vez se cae al mapa y a
elegir ciudad, sin plantarle un cuadro encima.

## 27-ago (3) — iPhone 17 Pro con Chrome

### El texto se salia de la pastilla «Ahora mismo»

La fila de filtros es `display:flex` con `overflow-x:auto`. En una fila asi, **los hijos
se encogen por defecto** (`flex-shrink:1`), y como las pastillas llevan
`white-space:nowrap`, el texto se sale de su propio borde en vez de que la pastilla crezca.

Aqui no se veia porque la tipografia del contenedor es mas estrecha que la San Francisco
del iPhone: con letras un poco mas anchas, la caja se queda corta y el texto asoma.
Arreglado con `flex:0 0 auto` en todas las pastillas. Comprobado en 360, 375 y 393 px:
`flex-shrink` = 0 en todas, ninguna desborda.

### La barra de abajo, tapada por las herramientas de Chrome

En Chrome de iPhone la barra inferior (atras, adelante, pestanas) se pone **encima** de la
pagina, y ni `100dvh` ni `env(safe-area-inset-bottom)` lo cuentan bien. El unico dato
fiable es `visualViewport`, que dice lo que de verdad se ve:

    function fitViewport(){
      const vv = window.visualViewport;
      const h = Math.round(vv.height + vv.offsetTop);
      if (h > 240) document.documentElement.style.setProperty('--vh', h + 'px');
      if (map) map.invalidateSize();
    }

    #app { height:100vh; height:100dvh; height:var(--vh,100dvh) }

Se recalcula al cambiar el viewport, al hacer scroll y al girar el movil, con un pequeno
retardo. El `h > 240` es para que el teclado, que hunde la altura, no rompa el layout.

Ademas: la pastilla del panel arranca contando el area segura
(`translateY(calc(100% - 132px - var(--safe-b)))`), y la lista y la ficha llevan colchon
abajo, para que la ultima tarjeta nunca quede pegada al borde.

Comprobado encogiendo la ventana a mano: `--vh` pasa de 852 a 760 px y `#app` mide
exactamente lo que se ve.

### Los botones de zoom, detras del aviso

Con una barra puesta, el `+` y el `-` quedaban medio tapados. Ahora `barsSync()` cuenta
cuantas barras hay y sube los controles del mapa 96 px con una, 190 px con dos, con
transicion. Cuando la barra se va, bajan solos.

## 27-ago (4) — la altura, por fin bien, y un solo boton arriba

### Estaba usando la unidad equivocada

`dvh` es la altura **en este momento**: cuando el navegador esconde su barra de abajo,
vale lo mismo que la pantalla entera. Y justo entonces la barra vuelve a aparecer en
cuanto se toca la pantalla, y se come el panel. Perseguir esa altura con
`visualViewport` era perseguir un blanco movil.

`svh` es la altura **minima garantizada**: la que hay cuando el navegador tiene todas sus
barras puestas. Se pierde un poco de mapa cuando la barra no esta, pero el panel no se
come nunca, que es lo unico que importa cuando alguien busca donde dormir.

    #app     height:100vh; height:100svh; height:min(var(--vh,100svh),100svh)
    .panel   height:min(70vh,520px); height:min(70svh,520px)
    .detail  height:56vh; height:56svh   (86svh abierta del todo)

`--vh` (de `visualViewport`) se conserva pero **solo puede bajar**, nunca subir: si el
navegador dice que de pronto hay mas sitio, no nos lo creemos. Se reinicia al girar el
movil o al cambiar el ancho, que ahi si es otra medida.

**Y lo que de verdad lo arregla: margen.** El trozo que asoma pasa de 132 a **196 px**, asi
que se ve la cabecera *y una ficha entera*. Medido en cinco tamanos, de un Android de 360
a un iPhone Max: la cabecera queda siempre a **103 px del borde**. Aunque un navegador se
coma 60 u 80 px sin avisar, se sigue viendo de que va. Antes, con 132 px justos, cualquier
barra inesperada se llevaba por delante lo unico que habia.

### Dos botones iguales pegados, uno «que no hacia nada»

Arriba a la izquierda habia dos cuadrados casi identicos: el verde (el logo, que llevaba a
la home) y el de las tres rayas (el menu). Estando ya en la home, el verde no hacia nada
visible. No estaba roto: es que **un boton que no da respuesta esta mal diseñado**, y da
igual que por dentro funcione.

Ahora hay **uno solo**: el logo, con una flechita que se gira al abrirse, y dentro el menu
con **«Volver al inicio»** como primera opcion. Se pierde el atajo de un toque a la home y
se gana que no haya ningun boton misterioso — y en el movil, unos 45 px mas de buscador,
que ahora ya cabe entero.

Esto cambia lo que se pidio el otro dia («el logo vuelve a la home»). Si prefieres el
atajo de vuelta, se cambia en un minuto; pero entonces vuelven los dos botones pegados.

---

## El idioma no llegaba a las paginas sueltas (y por que)

Se pidio: «si cambio de idioma y voy a kit de prensa, no aparece en ingles; todo me debe
aparecer en ese idioma». Habia **dos fallos distintos**, y el segundo era el gordo.

### 1. El mapa incrustado pisaba el idioma de la persona

`incrustar.html` lleva dentro un `<iframe>` con el propio mapa (`index.html?embed=1`) para
que se vea como queda. Ese mapa es la app entera, y la app **guarda** el idioma que decide
en `localStorage` (`sn.lang`). Como dentro del iframe nadie habia elegido nada, se ponia en
ingles y **escribia `sn.lang = "en"`** en el navegador de quien estaba mirando.

Resultado: entrabas en «incrustar» en español, y la siguiente pagina que abrieras salia en
ingles. No era la traduccion: era la demostracion borrandote la preferencia.

    const RO = new URLSearchParams(location.search).get('embed') === '1';
    store.set = (k,v) => { if (RO) { mem[k] = v; return; } ... }

Un mapa incrustado en la web de otro es una **demostracion, no la app de nadie**: ahora
escribe en memoria y no toca el navegador de quien pasa por ahi.

### 2. Diez anos de cache en las paginas .html

El servidor manda `Cache-Control: max-age=315360000` (diez anos) para los ficheros con
extension. `index.html` se libra porque se pide como directorio (`/`), pero `prensa.html`,
`incrustar.html` e `instalar.html` no: una vez que el navegador se las guardaba, **una
correccion no llegaba nunca**. Por eso el kit de prensa seguia diciendo 34.580 sitios / 458
ciudades / 128 paises cuando el servidor ya tenia 37.307 / 722 / 147.

Se probo lo evidente — un `.htaccess` que sobreescriba las cabeceras — y **no sirve**: aqui
delante hay nginx y es el quien sirve los `.html` directamente con su propia caducidad;
Apache solo ve lo que nginx no encuentra. El `.htaccess` esta subido y es inofensivo, pero
que quede escrito que **no hace nada en este servidor**.

Lo que si funciona es la misma solucion que ya se uso con los trozos de datos: **colgar la
huella del build de la URL**. `PAGES_V` es un sha1 de los datos + `pages.py` +
`i18n_pages.py` + `page.css.txt`, y todos los enlaces salen como
`prensa.html?v=d1c018aa`. Si cambia una coma, cambia la URL y el navegador se la baja.

    function pg(u){ return PAGES_V ? u + '?v=' + PAGES_V : u; }

Y en el service worker (v6), la copia guardada tiene que valer aunque la URL lleve huella,
o sin cobertura te quedas sin pagina:

    .catch(() => caches.match(req, { ignoreSearch: true })
      .then(r => r || caches.match('./index.html')))

### Comprobado, no supuesto

13 idiomas x 3 paginas = 39 combinaciones, cada una abierta de verdad y leido el `<h1>` y
el `lang` del documento. Las 39 correctas, y `sn.lang` intacto despues de pasar por el
mapa incrustado. Ademas: `instalar.html?v=...` abierta **con la red cortada** sale en
español desde la cache.

Detalle pequeno: en wolof y bambara los textos son los franceses (no hay traduccion
propia). Antes la pagina se declaraba `lang="wo"` con texto en frances; ahora declara
`lang="fr"`, que es lo que un lector de pantalla necesita para no leerlo mal.

### Las 200 ciudades

Ya estaban dentro desde la subida anterior: **37.307 sitios, 722 ciudades, 147 paises**.
El orden de paises salio del PIB por habitante (PPA) y de la pobreza extrema del Banco
Mundial, no de mi criterio; dentro de cada pais mandan las ciudades mas grandes que aun
no estaban. Se quedaron las 264 que se llegaron a consultar en vez de recortar a 200,
porque entre las 64 de mas estaban los 160 campos de desplazados de Baidoa.

---

## El menu, el nombre y quien escribe

Tres cosas que se pidieron juntas y que en realidad son la misma: que la app se
comporte como espera cualquiera que la abra.

### El logo vuelve a llevar a la home

Hace unos dias junte el logo y el menu en un solo boton, porque habia dos cuadrados
casi identicos pegados y el verde «no hacia nada». Era verdad el diagnostico y era
mala la solucion: **un logo que abre un menu tampoco es lo que nadie espera**. Ahora
hay dos botones otra vez, pero ya no se parecen: tres rayas (menu) y un cuadrado
verde con una chincheta (SupportNear, vuelve al inicio). Nadie confunde una
hamburguesa con un logotipo.

El logo es un `<a href="./">` de verdad — se puede abrir en otra pestana, el navegador
lo enseña abajo al pasar por encima — pero al pulsarlo no recarga nada: llama a
`goHome()` y ya.

### El menu es un panel lateral, no un pop up

Un cuadro flotante en mitad de la pantalla para un menu no se entiende: no se sabe de
donde ha salido ni por donde se cierra. Ahora entra deslizandose desde el mismo lado
en el que esta su boton, ocupa toda la altura y se cierra con Esc, con la X o tocando
fuera. Igual en movil, en tablet y en ordenador.

    .modal--side .modal-box{width:min(340px,86vw);height:100%;
      transform:translateX(-100%);transition:transform .28s cubic-bezier(.32,.72,0,1)}
    html[dir="rtl"] .modal--side .modal-box{transform:translateX(100%)}

En arabe, farsi y urdu la pagina va de derecha a izquierda: **el boton de menu queda
arriba a la derecha y el panel entra por la derecha**. Comprobado con una captura, no
supuesto. Y las instrucciones de descarga de `instalar.html` decian «arriba a la
izquierda» en esos tres idiomas: mandaban a mirar al lado contrario. Corregido.

Un detalle de CSS que costo encontrar: `html[dir="rtl"] .modal--side .modal-box` pesa
mas (0,3,1) que `.modal--side.on .modal-box` (0,3,0), asi que en arabe el panel se
quedaba fuera de la pantalla aunque estuviera abierto. La regla de «abierto» tiene que
repetirse con el mismo prefijo `html[dir="rtl"]`.

### Primera persona

El texto decia «Carlos empezo este proyecto… lo agradeceremos». Hablar de uno mismo en
tercera persona suena a nota de prensa de otro. Ahora es **«Empece este proyecto, con
otros nombres, en 2007, el ano que cumpli 18… encantado de ayudar»**, en la app y en el
kit de prensa, en todos los idiomas.

### Todo el contacto por X

Habia tres caminos para lo mismo: un correo escrito con espacios para esquivar a los
robots de spam, un formulario que abria la app de correo del movil, y un boton de
copiar la direccion. Fuera los tres. Queda **un enlace a x.com/mrstartups**, en el
menu y en el kit de prensa. Menos codigo, menos que explicar y una respuesta mas
rapida. Ya no queda ni un `mailto:` ni una arroba en todo el sitio (comprobado).

### Lo que aparecio por el camino: solo ingles y español estaban completos

Al ir a traducir el menu descubri que **de 256 textos, solo el ingles y el español los
tenian todos**. Frances, arabe y ucraniano llevaban 222; rumano, polaco, ruso,
portugues, urdu y farsi solo **98**. Todo lo demas — el menu entero, la descarga sin
conexion, «quien esta detras», la ayuda del GPS, la portada — salia en ingles aunque la
persona hubiera elegido su idioma.

Es justo lo que se pedia («que se vea bien en todos los idiomas») y no era una frase:
eran **1.596 textos**. Ya estan los trece idiomas completos, con las reglas de siempre:

- los huecos (`{n}`, `{d}`, `{s}`…) sobreviven tal cual, comprobado uno a uno;
- las etiquetas HTML de dentro (`<br>`, `<b>`, `<em>`) tambien;
- SupportNear, OpenStreetMap, Wikidata, X, 112, wifi y los numeros no se traducen;
- en arabe, urdu y farsi los digitos van en cifras occidentales, porque los numeros los
  mete el codigo y no se pueden mezclar dos alfabetos en la misma linea;
- se tutea igual en todo el menu: no puede pedirte una cosa de tu y la de al lado de
  usted (esto hubo que corregirlo despues, en frances, ucraniano, ruso y farsi).

El fichero pasa de 673 a 799 KB (281 KB comprimido). No se nota al abrir: **176 ms
hasta DOMContentLoaded y entre 270 y 430 ms hasta el primer sitio en el mapa**, medido
en ingles, ruso y arabe. Aun asi, ahi hay una mejora pendiente y grande: la app se
descarga los trece idiomas para usar uno. Partirlos como se partieron los datos
ahorraria mas de un tercio del peso.

---

## La ronda de las cuarenta cosas

Se pidio: «que 20 cosas mejorarias de la web, y que 20 cosas ya hechas puedes
mejorar; es un 5 de 10, subelo a 10 en todos los dispositivos». Antes de opinar
mejor medir, asi que primero fueron capturas en seis tamanos, claro y oscuro, y
un rato leyendo los datos. De ahi salieron cosas que no me esperaba.

### Lo que la web tenia mal y no se veia

**Seis retretes antes que una cama.** En Londres las seis primeras tarjetas eran
«Aseos publicos gratuitos», identicas. El 23% de los sitios de OpenStreetMap no
lleva nombre y se ensena con el de su categoria, asi que la lista se llenaba de
filas iguales y lo que alguien necesitaba de verdad quedaba enterrado. Ahora los
repetidos van en **una sola fila que se abre** («41 sitios · el mas cerca a 170
m») y lo primero que se lee son Centrepoint, Oxfam, el centro de salud.

**El boton de llamar media 81 x 23 px.** El minimo que se toca bien con el pulgar
son 44. Es el boton mas urgente de la app.

**«Emergencia» se quedaba sin palabra en el movil.** A 360 px solo quedaba un
triangulo rojo. Justo ese es el unico que no puede ser un icono a secas. Se
recupero el texto quitando la cruz de «usar mi posicion» del buscador, que
estaba dos veces en la misma pantalla (la otra es el boton verde del mapa).

**El tabulador se salia del menu.** Con el panel abierto, seguir tabulando
llevaba el foco a la pagina de detras, que en ese momento no se puede ni ver.
Ahora da la vuelta dentro del menu y al cerrar vuelve a su boton.

**El horario le pedia trabajo a quien busca ayuda.** 31.475 sitios de 37.307 no
llevan horario. En ese hueco solo habia un enlace: «anade el horario». Ahora
dice primero lo util — llama antes si puedes, o ve pronto — y el enlace para
arreglarlo queda debajo.

**Sin calle.** 24.424 sitios no traen direccion. La coordenada si, y una calle se
puede leer en voz alta o ensenar a un conductor; unas coordenadas no. Ahora se
pregunta a Nominatim **solo al abrir esa ficha**, una vez, y se guarda.

### El fallo gordo: la descarga sin conexion estaba rota

La app guardaba las teselas de la ciudad descargada en una cache llamada
`sn-v5-saved`. El service worker las buscaba en `sn-v6-saved`. **Nadie las
leia.** Quien se bajaba su ciudad y luego se quedaba sin datos veia el mapa en
blanco: exactamente la noche en la que esto tiene que funcionar. Colaba porque
la cache normal de teselas todavia guardaba lo que hubieras mirado antes.

El nombre ya no lleva version (`sn-saved`), y el service worker mira tambien en
los nombres viejos para no borrarle la ciudad a quien ya la tuviera bajada.

Esto pasa por poner un numero de version en el nombre de algo que precisamente
no debe cambiar nunca.

### Solo ingles y español estaban completos (otra vez, y peor)

Las tablas `SUB`, `LBL` y `FOR_LBL` — el tipo de sitio, las lineas de
emergencia y «para quien es» — **solo existian en cinco idiomas**. En ruso,
polaco, rumano, portugues, urdu, farsi, wolof y bambara, cada tarjeta ponia
«Night shelter · beds» en ingles dentro de una app traducida. Y son la parte mas
visible: para el 23% de sitios sin nombre, esa etiqueta **es** el nombre.

Ademas el nombre automatico se fijaba al decodificar los datos, antes de que
llegara el idioma, y se quedaba en ingles para siempre. Ahora se calcula al
pintar (`pname()`), asi que cambia solo al cambiar de idioma.

### Velocidad, medida donde importa

No en fibra: en **3G lento (400 kbit/s) con el movil a un cuarto de velocidad**,
que es el movil de quien mas necesita esto.

    antes   6.5 s hasta la primera tarjeta   282 KB comprimidos
    ahora   4.6 s                            200 KB

Lo que sobraba: la app se descargaba **los trece idiomas para leer uno**. 85 KB
comprimidos, el 30% de todo. Ahora viaja el ingles (que es el que rellena huecos
y el que ya trae escrito el HTML) y el idioma de cada uno se pide aparte, como
ya se hacian los trozos de datos, y se guarda en el movil: la segunda vez no se
pide. En el mismo fichero van los textos y las tres tablas de etiquetas.

En 4G flojo: de 2.2 s a 1.5 s.

La siguiente palanca, si algun dia hace falta: el nucleo incrustado son otros
69 KB comprimidos. Sacarlo dejaria la carga en unos 130 KB, pero el mapa podria
salir vacio medio segundo la primera vez, y ese medio segundo es la promesa de
que nunca sale vacio. No lo he tocado.

---

## Segunda ronda: lo que faltaba

### «¿Que necesitas ahora?»

Antes se caia en un mapa lleno de puntos y una lista de cuarenta cosas. Quien
llega con frio o con hambre no quiere elegir entre nueve filtros: quiere decir
una cosa. Cuatro botones grandes — comer, dormir, ducharme, emergencia — arriba
de la lista, y solo mientras no haya elegido nada. No tapan el mapa ni piden un
toque de mas a quien ya sabe lo que busca. En movil van en una fila de cuatro
con el icono encima, porque el cajon asoma 196 px y con dos filas solo se veian
dos.

### Buscar por lo que necesitas

El buscador solo entendia ciudades y nombres de sitios. Quien escribe «ducha» o
«abogado» no busca un sitio que se llame asi. Ahora esas palabras salen las
primeras como «Ver: Duchas» y ponen el filtro. Se mira en tres sitios: unas
pocas palabras de la calle por idioma (`SYN`, trece idiomas), el nombre de cada
categoria y las etiquetas de tipo de sitio ya traducidas. Y si la palabra era de
un subtipo («ducha» dentro de higiene), esos van delante: antes de este ajuste
«Ver: Duchas» ensenaba primero los aseos.

### La linea hasta el sitio

«Como llegar» abre Google Maps, que necesita datos. Una linea recta desde donde
estas, con los metros y la flecha del rumbo, no es una ruta, pero funciona sin
conexion y basta para echar a andar en la direccion buena y preguntar. Solo sale
cuando la posicion es la de la persona de verdad (`S.gps`), no el centro de una
ciudad buscada, y no a mas de 25 km, donde una recta ya no dice nada.

### Compartir en texto plano

Nombre, tipo, calle, telefono y horario, que es lo que le sirve a quien lo
recibe por WhatsApp aunque no abra ningun enlace. El enlace es al propio mapa y
lleva la posicion (`#p=node/123@lat,lon`): asi se abre aunque el sitio no venga
en el nucleo — antes un `#p=` de un sitio no cargado no hacia nada.

### El telefono del pais cuando no hay nada cerca

A 180 km un mapa no arregla la noche de nadie. Lo que si puede es la linea
social o de sin hogar del pais, que ya teniamos para las emergencias. Va en la
misma tarjeta de «lo mas cercano esta lejos», con su boton de llamar.

### Letra grande

Casi todo el CSS va en px, asi que subir la base no bastaba: se sube pieza a
pieza lo que se lee un 15-20%. Se recuerda entre visitas.

### 722 paginas por ciudad

`c/<ciudad>.html`, en ingles, con lo que hay de verdad a 10 km del centro
(cuantos de cada tipo y los treinta con nombre mas cercanos), el numero de
emergencias del pais y el boton al mapa. Si en una ciudad hay poco, la pagina lo
dice; no se rellena. Mas `c/index.html` por paises, `sitemap.xml` con 727 URLs
y `robots.txt`, que no existian. Los nombres tipo «Αθήνα · Athens» se parten:
el latino para la URL y el titulo, el otro al lado para quien vive alli.

39 de las 722 no tienen ni un sitio a 10 km. Son las ciudades que hay que
llenar, y ahora se sabe cuales.

---

## Tercera ronda: las veinte, y el mapa que se rompio por el camino

### CARTO empezo a pedir clave (y el mapa salio con «API KEY REQUIRED»)

En mitad de la ronda, Carlos: «dice API required, antes no lo decia». Cierto: CARTO
cambio las condiciones en septiembre de 2026 y estampa «API KEY REQUIRED» en cada
tesela de sus mapas gratuitos. **El mapa de fondo estaba roto en produccion.**

Cambiado a **Esri World Street Map**: gratis, sin clave, con `Access-Control-Allow-
Origin: *` (comprobado con curl, que hace falta para la descarga sin conexion), hasta
zoom 19, y solo pide atribucion. No tiene version oscura sin clave: el modo oscuro se
hace con un filtro CSS sobre la misma capa (`invert + hue-rotate`), que deja el agua
azul y los parques verdes; los pines van en otra capa y no se tocan.

Lo que cambia por dentro: la plantilla ya no lleva `{s}` ni `{r}` (la descarga lo
soporta), el service worker acepta `arcgisonline.com` y sigue aceptando `cartocdn`
para quien tenga una ciudad guardada con el mapa viejo. Las teselas son JPEG, algo
mas pesadas: una ciudad guardada pasa de 3,2 a 4,7 MB.

Las capturas del kit de prensa (`shot-*.png`) siguen siendo del mapa antiguo. Hay que
rehacerlas.

### Las veinte

1. **Avisar a OpenStreetMap sin salir de la app.** La API de notas acepta notas
   anonimas. «Esto ya no existe», «el horario esta mal», «aqui falta un sitio»: un
   cuadro, un boton, y la nota queda donde la ven los voluntarios de todo el mundo.
   Sin conexion se guarda y se manda sola cuando vuelve la red.
2. **Avisos compartidos entre todos** (`worker/reports.js`): un Worker de Cloudflare
   con KV, sin cuentas ni IPs (hash con sal diaria). El cliente esta hecho y dormido:
   `REPORTS_URL = ''`. Al poner la URL, las tarjetas dicen «3 lo vieron abierto esta
   semana». Instrucciones de despliegue en la cabecera del fichero, cinco minutos.
3. **Leer la ficha en voz alta.** `speechSynthesis`, 13 idiomas, sin conexion en la
   mayoria de moviles. Nombre, tipo, distancia, calle, horario, telefono.
4. **Prefijos de telefono.** «91 234 56 78» no marca desde una SIM extranjera. Si
   falta el «+», se pone el del pais del sitio (tabla `DIAL`, 200 paises). Los cortos
   (112, 016) no se tocan; Italia conserva su 0.
5. **Modo noche solo.** De 20:00 a 7:00 arranca en «ahora mismo» (cama y comida
   primero, lo cerrado fuera), una vez por noche, con el boton pulsado para quitarlo.
6. **Urgencias mas cercanas en Emergencia**, con distancia y un toque para ir.
7. **Horarios oficiales por ciudad: no hecho.** Es cruzar portales de datos abiertos
   ciudad a ciudad y verificar el emparejamiento; son dias de trabajo, no horas. Lo
   digo en vez de hacerlo a medias.
8. **La ficha segun la hora.** De noche «Llamar» en verde y el horario primero; de
   dia «Como llegar» y la calle primero.
9. **Fecha de la ultima edicion en OSM.** `fetch_meta.py` pide `out meta` por lotes
   de 400 ids (95 consultas, 37.237 fechas de 37.304). Va en la fila como AAAAMM. La
   ficha dice «ultima edicion: agosto de 2026» y, si hace mas de tres anos, «llama
   antes» en rojo.
10. **Duplicados.** Mismo nombre normalizado, misma categoria, menos de 60 m: uno
    solo, el que mas datos trae. 265 fuera. (McMillan Library ya sale una vez.)
11. **Parser de horarios reescrito.** 26 casos de prueba en Node. Antes
    «sunrise-sunset» salia como cerrado, «24/7; PH off» como desconocido,
    «09.00-17.00» como desconocido y «Nov-Mar 18:00-08:00» se aplicaba en agosto.
    Regla: lo que no se entiende es «no sabemos», nunca se adivina. Y «Sa-Su» un
    miercoles es cerrado, no desconocido.
12. **Las 39 ciudades a cero.** Segundo barrido a 25 km con mas etiquetas (pozos,
    grifos, puestos de salud, asociaciones). Por el camino salio que **hay dos
    Hyderabad** y la de la India se quedaba con los sitios de la de Pakistan, a 1.500
    km; ahora solo entra lo que esta a 60 km. 17 arregladas (Hyderabad 53, Tripoli
    49, Leon 38, Thies 13…). Las otras 24 no tienen nada en OSM a 25 km: atolones,
    pueblos del Sahel. Se dice en su pagina.
13. **Nucleo mas ligero.** De 3 sitios por ciudad a 1: el mapa sigue sin salir vacio
    nunca. 3G lento: de 4,7 a 4,2 s; 176 KB comprimidos.
14. **Los grupos del mapa dicen que son.** Debajo del numero, hasta tres iconos de lo
    que hay (cama, comida, ducha), los mas utiles primero.
15. **Tarjetas compactas en movil.** 84 px en vez de 110: se ven tres donde se veia una.
16. **Lista perezosa.** 14 filas en movil (24 en escritorio) y el resto al bajar, con
    IntersectionObserver.
17. **Portada: revisada y no existe.** El HTML de la landing se quito hace tiempo;
    quedan ~60 claves huerfanas (hero, how, what, orgs, faq) en las tablas. Estan en
    los ficheros de idioma, no en el arranque; se pueden borrar sin riesgo un dia.
18. **Carteles A4 con QR por ciudad** (`c/<ciudad>.cartel.html`), en el idioma del
    pais, listos para imprimir desde el navegador. QR generado en la build (SVG,
    sin dependencia en el navegador). Con el numero de emergencias del pais.
19. **Paginas de ciudad en el idioma del pais.** 722 en local (es, fr, ar, uk, ro,
    pl, ru, pt, ur, fa segun el pais) + la version inglesa `.en.html` cuando el local
    no es ingles + `hreflang`. En arabe, ucraniano, ruso, farsi y urdu la ciudad se
    llama por su nombre local. 1.140 paginas, sitemap con 1.146 URL.
20. **`cambios.html`.** Compara con la foto de la publicacion anterior: +398 sitios
    nuevos, -348 (los duplicados y lo que dejo de contar), Thies +72, Hyderabad +56,
    Tripoli +50. Cada sitio nuevo enlaza a su ficha. Sale solo en cada build.

Y una que no estaba en la lista y aparecio: **«que necesitas para entrar» nunca
enseño los datos reales.** La build escribia gratis/con cita/solo socios en la
posicion 13 de cada fila y el decodificador no la leia. Ahora se ve «Gratis» donde
OSM lo dice.

### Publicado (5 de septiembre, tarde)

Todo lo de arriba esta en supportnear.com, comprobado byte a byte: index.html,
las tres paginas, sw.js, 498 trozos de datos, 12 ficheros de idioma, 1.140
paginas de ciudad + 722 carteles, sitemap, robots, cambios.html y las tres
capturas del kit de prensa rehechas con el mapa nuevo. En el navegador de Carlos:
20 de 20 teselas pintadas desde `server.arcgisonline.com`, sin rastro de CARTO.

Para quien ya tenia la app abierta: el service worker es network-first con
`no-cache`, asi que la siguiente vez que la abran con conexion bajan el index
nuevo y piden las teselas nuevas. Las teselas viejas de CARTO con la marca de
agua se quedan en su cache hasta que la rotacion las eche (900 como maximo), pero
la app ya no las pide.

## Cuarta ronda: veinte cosas mas, sin datos de uso todavia

Carlos pidio otra lista de veinte (funcionalidad y diseno) y despues «añade
todos». Ninguna necesita servidor ni cuenta; todo sigue en un fichero.

### Lo que se ve

- **Tres columnas en pantalla grande** (>= 1280 px): mapa | lista | ficha. La
  ficha dejaba de ser un panel que tapaba la lista; ahora es una columna mas y
  el mapa se estrecha (con `invalidateSize`) en vez de quedarse con la mitad
  tapada. Los botones de zoom y «centrar» se mueven con el (`html.dopen` ajusta
  `--panel-w`). En movil no cambia nada.
- **«Cierra en 40 min» / «abre el lunes a las 9:00»**: `ohNext()` calcula el
  siguiente cambio de estado solo con horarios limpios (dias y horas). En cuanto
  hay festivos, meses o «sunset» no dice nada: mejor callar que equivocarse. Sale
  en el chip de la tarjeta (en lugar de la cadena cruda) y en la ficha junto a
  «Abierto/Cerrado». 13 casos de prueba con la hora fija (`/tmp/ohn_test.js`).
- **El plan de esta noche**: con «Ahora mismo» puesto, la tarjeta negra ya no es
  un texto: son tres pasos (comer, lavarse, dormir), cada uno con el sitio mas
  cercano, con un criterio simple: abierto seguro vale 800 m de rodeo; cerrado
  seguro, casi nunca. Cada paso abre su ficha y «Compartir el plan» manda los tres
  con calle, horario y enlace por WhatsApp.
- **Mis sitios**: corazon en la ficha. Se guarda el sitio *entero* en el movil
  (no solo el id) para que abra sin conexion aunque el trozo del mapa no este
  descargado. Salen arriba de la lista (los 3 mas cercanos) y todos en el menu.
  Maximo 60.
- **Ruta por la calle**: la recta orientaba; ahora, con conexion, se pide la ruta
  a pie al servidor de rutas de FOSSGIS (`routing.openstreetmap.de/routed-foot`,
  el mismo que usa osm.org, sin clave) y se pinta encima, con metros y minutos
  reales. Se cachea por origen+sitio. Sin conexion queda la recta. El servidor
  publico de OSRM (`router.project-osrm.org`) solo tiene perfil de coche y daba
  2,1 km donde a pie son 1,0: por eso no se usa.
- **Seguirme**: `watchPosition` mientras se anda hacia el sitio; el punto azul se
  mueve, la distancia de la ficha baja, la ruta se redibuja y una flecha en el
  punto marca el rumbo (`coords.heading`). Se para al cerrar la ficha.
- **Erratas en el buscador**: «Madird», «Lodnon», «Barcelnoa», «comedro» ya
  encuentran. Distancia de edicion con transposicion (una letra cambiada de
  sitio cuenta como un error), tolerancia 1 (2 si la palabra tiene 7+ letras),
  comparando con el principio de cada palabra. Solo entra si lo exacto da menos
  de 2 ciudades o 3 sitios.
- **Fotos**: 104 sitios traen `wikimedia_commons` o una `image` de Commons en
  OSM. Se guarda el nombre del archivo (campo 15 de la fila) y la ficha pide la
  miniatura (`Special:FilePath/...?width=640`) solo al abrirse, nunca en modo
  ahorro, y desaparece sola si falla. Solo Commons: licencia libre y servidor
  que no cambia.
- **Dibujos en los estados vacios** (sin resultados, lejos de todo, error):
  cuatro SVG de linea de 96x96 para que se vea que la app funciona y es la
  situacion la que esta vacia.
- **Teclado**: `/` va al buscador, flecha abajo desde el buscador entra en las
  sugerencias y luego en la lista, las flechas mueven el foco (no solo la
  seleccion), Intro abre, Esc cierra. Una linea al final de la lista lo dice,
  solo en PC con raton.
- **Y lo que ya estaba a medias**: boton «atras» del movil que cierra la capa
  de arriba (pushState por capa), aviso «hay una version nueva» cuando el service
  worker encuentra otra, «Añadir a la pantalla de inicio» desde el menu (con
  instrucciones para iPhone), el pais que sigue al mapa si te mueves mas de 50
  km, modo ahorro (bateria <= 15 % o `saveData`: fondo negro, sin teselas ni
  animaciones), contadores en los chips de categoria y el icono de X en el menu.
  Faltaban sus 9 textos en 13 idiomas: ahora estan (31 claves nuevas x 13 = 403
  cadenas; wolof y bambara por un traductor aparte, con `fr` de respaldo).

### Verificado

`final.py` (8 pantallas, sin scroll horizontal, sin errores), `v4.py` (13 idiomas
+ sin red), `v5.py` (3G lento 4,7 s hasta la primera fila, 186 KB), `oh_test.js`
(26 casos), `ohn_test.js` (13), `test_dl_offline.py` (2.151 sitios y 9/12
teselas sin red), y capturas del PC a tres columnas con ruta real, del plan, de
los favoritos y de una ficha con foto en movil. `sw.js` pasa a `sn-v8` para que
a quien ya la tiene le salga el aviso de version nueva.

## Quinta ronda: veinte mas, pensando en quien esta en la calle en un pais ajeno

Carlos: «implementa todo lo anterior y otros 20, piensa, mas y mejor, mejor web
que ayuda en el mundo». Estas veinte no vienen de una lista de funcionalidades
de app: vienen de preguntarse que le pasa a alguien a las diez de la noche en
una ciudad cuya lengua no habla.

1. **«Enséñaselo a alguien»** (menu y ficha). Se ensena la pantalla a un
   tendero o un policia: *«Hallo. Ich spreche Ihre Sprache nicht. Ich suche:
   einen Schlafplatz für heute Nacht. Könnten Sie mir den Weg zu dieser Adresse
   zeigen?»*, en grande en el idioma del pais donde esta el mapa (por el codigo
   de pais que ya detecta Nominatim, tabla `SHOW_CC`), y debajo en pequeno en el
   del usuario. Cinco necesidades con pictograma (comer, dormir, ducha, medico,
   papeles) y, si se abre desde una ficha, el nombre y la calle del sitio. 52
   idiomas en `l/show.json` (20 KB), que se baja una vez y se guarda; boton
   «leer en voz alta» con la voz del idioma local.
2. **El camino paso a paso**: la ruta a pie de FOSSGIS ya venia con maniobras
   (`steps=true`); ahora se ensenan como lista («Gira a la izquierda · Calle del
   Arenal · 50 m»), traducidas a 13 idiomas con una tabla de 10 frases, y se
   pueden escuchar. Las cinco ultimas rutas se guardan en el movil: si se va la
   cobertura a mitad de camino, los pasos siguen ahi.
3. **Un consejo por tipo de ayuda**, escrito por quien ya ha pasado por ello:
   que la cola del comedor empieza antes, que el albergue cierra la puerta y hay
   que llamar, que pidas zapatos y abrigo primero, que un hospital tiene que
   atenderte con o sin papeles. Sale al filtrar por una categoria y se quita con
   una X (se recuerda). 8 textos x 13 idiomas.
4. **Horario legible**: «Mo-Fr 09:00-17:00; PH off» se ensena como «lun–vie
   09:00–17:00; PH cerrado» con los dias y meses del idioma de la app
   (`toLocaleDateString`), y arriba en negrita **Hoy: 09:00–12:00, 16:00–20:00**,
   que es lo unico que hace falta leer antes de salir.
5. **«Abre pronto»**: un sitio cerrado que abre en menos de una hora ya no sale
   como «cerrado» ni desaparece del filtro «Abierto ahora»: lleva una etiqueta
   ambar «abre pronto» y se queda en la lista.
6. **Frio y calor**: Open-Meteo (sin clave) da la sensacion termica de la zona;
   a 5° o menos por la tarde-noche sale «−1° esta noche. Primero, un sitio
   caliente» con un boton al filtro de sitios donde estar; a 32° o mas de dia,
   agua y sombra. Solo si hay sitios de ese tipo cerca; una consulta por zona y
   hora; nunca en modo ahorro.
7. **«¿Dónde estoy?»** dentro de Emergencia: calle y numero por Nominatim mas las
   coordenadas, en grande, para leerselo a quien se llama, con «Enviar mi
   ubicacion» (WhatsApp) y copiar. Sin conexion, salen las coordenadas.
8. **Buscar hablando**: microfono en el buscador (Web Speech API, en Chrome de
   Android y Safari) con el idioma de la app. Para quien no escribe en este
   alfabeto o no ve el teclado. Solo aparece si el navegador lo tiene.
9. **Tooltips en PC**: nombre y distancia al pasar el raton por un marcador
   (solo con `hover:hover` y `pointer:fine`; en movil no hay nada que pasar).
10. **Brujula al seguirme**: `deviceorientation` (con permiso en iPhone, que se
    pide al tocar «Seguirme») gira la flecha del punto azul hacia donde mira el
    movil, ademas del rumbo del GPS al andar.
11. **Millas y yardas** en US, GB, LR y MM (`km()` mira el pais); los minutos
    andando no cambian.
12. **Imprimir la ficha**: hoja de estilo `@media print` que deja solo la ficha
    (sin botones ni bloques de verificar) y boton «Imprimir» en PC. Para el
    trabajador social que da la ficha en papel.
13. **«Pásalo»** en el menu: comparte la app con un texto en el idioma del
    usuario («Mapa gratis de ayuda gratuita cerca de ti… sin cuenta, funciona
    sin cobertura, en 13 idiomas»).
14. **Fecha de los datos** en el pie de la lista: «Datos: OpenStreetMap,
    actualizados el 5 de septiembre de 2026» (`BUILT` lo pone `build.py`). Y de
    paso se corrigio el pie que aun decia «Mapa base © CARTO» en 13 idiomas.
15. **El plan de esta noche** dice ahora en cada paso «cierra en 40 min» o «abre
    a las 20:00».
16. **Foco**: al cerrar la ficha con Esc o la X, el foco vuelve a la tarjeta de
    la lista de la que se vino (antes se perdia arriba del todo).
17. **«Volver arriba»** en listas largas (aparece tras 1.400 px de scroll).
18. **Aviso 30 minutos antes de que cierre** el sitio abierto en la ficha: toast,
    vibracion y, solo si la persona ya habia aceptado notificaciones, una
    notificacion. No se pide ningun permiso nuevo.
19. **Ciudades recientes** (las tres ultimas) arriba del desplegable del buscador.
20. **Sin red, con nombres**: el aviso de sin conexion dice que zonas tienes
    guardadas («Sin cobertura. Tienes guardado: Madrid») en vez del texto
    generico.

Textos nuevos: 45 claves x 13 idiomas (585 cadenas; wolof y bambara por
traductor aparte) mas las 52 x 8 de la tarjeta para ensenar. `index.html` sube
de 549 a 577 KB sin comprimir; 195 KB en gzip (eran 186); 4,7 s hasta la
primera fila en 3G lento, igual que antes.

### Verificado

`final.py`, `v4.py` (13 idiomas, sin red), `v5.py`, `oh_test.js` (26),
`ohn_test.js` (13), `test_dl_offline.py`; y a mano en Playwright: la tarjeta en
aleman/frances/ingles con arabe y urdu de usuario, pasos de ruta reales en
Madrid, «donde estoy» con Nominatim, millas en US, «abre pronto» con un horario
que empieza dentro de 30 minutos, el aviso de frio con Open-Meteo simulado a −1°.

### Publicado (5 de septiembre, noche)

Las cuarenta cosas estan en supportnear.com, comprobadas byte a byte contra el
servidor: index.html, sw.js (v8), las tres paginas, cambios.html, sitemap,
robots, 13 ficheros de idioma (con show.json), 504 trozos de datos y 1.862
paginas de ciudad y carteles (101 ficheros verificados al azar, ninguno
distinto). En el Chrome de Carlos la web nueva carga con `BUILT=2026-09-05`, los
horarios ya salen como «lun–vie 09:30–20:00» y 15 teselas de Esri pintadas.

Un tropiezo util de anotar: net2ftp decia «File could not be transferred to the
FTP server» para cualquier fichero, incluso uno de 5 bytes nuevo. No era cuota
(el paquete es «Disk: unlimited») ni permisos: era el **modo FTP activo**
(`passivemode=no`, que es lo que trae la URL que genera RaiolaCP). Con
`passivemode=yes` y `ftpmode=binary` en el login y en cada POST, todo subio a la
primera. Queda un `zz_test_up.txt` de prueba (5 bytes) en la raiz que el
borrado de net2ftp no quiso quitar; se puede borrar desde el administrador de
archivos sin mas.

## Sexta ronda: el planeta entero (lo esencial) y 500 ciudades mas

Carlos: «añade 500 ciudades mas, o cuantas hay que anadir para que sea lo mejor
del mundo? todo?». La respuesta buena no era un numero de ciudades. Se miro que
hay en OpenStreetMap en el mundo entero (Taginfo): lo esencial (social_facility
157.000, duchas y banos 50.000, centros sociales 15.000, tiendas solidarias
18.000, ONG 27.000, sitios de refugiados 1.900, comida compartida 2.200) cabe;
lo masivo (agua 734.000 contando pozos, aseos 520.000, salud 1,3 millones,
bibliotecas 113.000) no cabe sin romper los 4 segundos en 3G. Asi que:

- **Lo esencial, del planeta entero.** `fetch_planet.py` recorre el mundo en
  celdas de 5 grados (solo las 586 que tienen alguna ciudad de 40.000
  habitantes o mas, segun OSM: las otras 2.000 son oceano, desierto, hielo o
  selva y cada peticion vacia costaba 30 s). Si una celda falla o trae mas de
  25.000 elementos se parte en cuatro, hasta 0,3 grados. Solo valores exactos
  en la consulta (no regex: Overpass usa el indice y tarda la mitad) y
  `[timeout:50]`, porque el nginx de kumi corta a los 60 s digas lo que digas.
  Cada celda se guarda al llegar. 706 celdas, 318.389 elementos en bruto.
- **500 ciudades mas** (499, en 102 paises). La lista sale de OSM (3.145
  ciudades de mas de 200.000 habitantes; 1.590 candidatas fuera de las 722 de
  antes), el pais de Nominatim a 1 peticion por segundo, y la eleccion con el
  mismo criterio de necesidad que las 200 anteriores (PIB por habitante y
  pobreza extrema del Banco Mundial, maximo 10 por pais para que ninguno
  acapare): Tanzania, Nigeria, Pakistan, Bangladesh, India, Filipinas,
  Venezuela, Colombia, Peru, Indonesia, Irak, Vietnam, Iran, Egipto, Brasil,
  Ucrania... y tambien Mexico, China, Japon, Polonia, Rusia. Para estas si se
  baja todo (agua, aseos, salud, bibliotecas, 25 km) y tienen pagina y cartel.
- **Trozos densos partidos.** Una celda de 2,5 grados en Alemania o Inglaterra
  pasaba de 2.200 sitios. `build.py` las parte en cuatro subceldas de 1,25
  (clave `i_j_a_b`, lista `SPLIT` en el index) y la app pide solo las subceldas
  que tocan lo que ves. 7 celdas partidas hoy: Londres, el Ruhr, Baviera,
  Paises Bajos, Copenhague...
- **La tabla de textos repetidos** (`STR`) se limita a los que salen 8 veces o
  mas, 2.000 como maximo: pasaba de 92 KB a 22 KB en el index a cambio de 200
  KB repartidos entre 1.700 trozos.

### Lo que hace falta saber de las fuentes

`overpass-api.de` y `overpass.private.coffee` no contestaban esta noche;
`kumi.systems` es rapido pero con datos de junio de 2026 (tres meses) y corta
a los 60 s; `maps.mail.ru` esta al dia y aguanta mas pero encola. Los procesos
en segundo plano mueren si la sesion se queda quieta: por eso se hicieron en
tandas de 10 minutos, reanudando desde lo guardado, y por eso todos los scripts
de descarga escriben cada celda o ciudad al llegar.

### Resultado

170.816 sitios (eran 37.357), 1.221 ciudades, 166 paises. Por categoria:
atencion social 64.728, duchas y aseos 36.075, salud 20.070, ropa 18.105,
albergues 9.268, sitios donde estar 9.294, comida 7.739, agua 5.515. Fechas de
ultima edicion para 167.826 (fetch_meta.py, 331 lotes de 400 ids). 1.697
trozos (17,7 MB en total; el mayor 238 KB), 7 celdas partidas, index de 669 KB
(228 KB gzip; eran 195): 5,4 s hasta la primera fila en 3G lento (eran 4,7).
1.896 paginas de ciudad + 1.221 carteles + sitemap con 1.902 URLs.

Montpellier y Bruselas, que no estan en la lista de ciudades, dan ahora 245 y
266 sitios a menos de 15 km: es la cobertura planetaria funcionando. Pasan
`final.py`, `v4.py`, `v5.py`, `oh_test.js`, `ohn_test.js` y
`test_dl_offline.py` (2.818 sitios sin red en Madrid).

### Publicado (6 de septiembre)

Todo en supportnear.com, comprobado byte a byte (127 ficheros, incluidas las
subceldas partidas, ninguno distinto): index con `STATS {170816, 1221, 166}`,
sw.js, las paginas, 13 idiomas, 1.697 trozos de datos y 3.118 paginas de ciudad
y carteles. En el Chrome de Carlos la web carga la version nueva con el mapa
pintado. La subida por net2ftp: 8 ficheros sueltos + tres zips (0,1 / 6,4 /
13,6 MB) que el servidor descomprime en su sitio, con la sesion generada desde
el panel y siempre en modo FTP pasivo.

## Septima ronda: cien cambios para ser 100 de 100

Carlos pregunto por que en algunos paises no salia nada, si la web estaba
optimizada para buscadores, si cargaba rapido y si la gente sabia de que iba al
entrar. Se miro con datos: 91 ciudades con menos de 3 sitios (OSM vacio), sin
h1 ni datos estructurados, 232 KB, y un visitante nuevo caia en un mapa de
Londres de noche sin una sola frase que dijera que es esto. Luego: «haz 100
cambios mas». Estos son, agrupados.

**Primera visita (1-17).** 1 pantalla de bienvenida de una vista (que es, para
quien, «¿donde estas?»), en HTML estatico con h1 para que Google la lea; 2 la
ubicacion se pide con un motivo delante y un boton grande; 3 «prefiero escribir
mi ciudad»; 4 chips de idioma con el del navegador primero; 5 tres pasos (donde
estas, que necesitas, ve o llama); 6 linea de confianza (sin cuenta, gratis, sin
rastreo, sin internet); 7 pictogramas de las cinco necesidades; 8 foco en el
boton principal y Esc cierra; 9 `?welcome=1` la fuerza; 10 «¿Que es esto?» en
el menu la vuelve a abrir; 11 se acabo Londres por defecto: sin ubicacion se
arranca en la ciudad mas probable por el pais del navegador (es-MX -> Mexico);
12 el telefono de emergencia sale por ese pais antes de tener posicion; 13
estado «¿Donde estas?» con boton de ubicacion y ciudades; 14 la ciudad del pais
adivinado va primera en el desplegable; 15 lema bajo el logo en PC; 16 «13
idiomas» donde aun decia 5 (13 idiomas); 17 el texto de «aqui no hay nada
mapeado» reescrito, ya no habla de «{c} grandes ciudades» (13 idiomas).

**Buscar y «no hay datos» (18-25).** 18 buscar por pais lista sus ciudades; 19
cabecera «Ciudades de Nigeria»; 20 el estado lejos ensena las ciudades mas
cercanas con su distancia; 21 boton «Añadir un sitio que conozco»; 22 boton de
emergencia ahi mismo; 23 «Buscar mas lejos» amplia el radio a 120 km; 24 aviso
del radio ampliado; 25 nombres de pais unificados en ingles por codigo ISO (se
acabo Cameroon/Cameroun, Moçambique, Deutschland).

**Lista (26-33).** 26 separadores «a menos de 10 min andando / 10-30 / mas
lejos»; 27 chips atenuados cuando no hay nada cerca; 28 chips de 40 px; 29
teclas 1-9 cambian de categoria; 30 la pista de teclado lo dice; 31 doce
tarjetas iniciales en movil en vez de catorce; 32 `content-visibility` en las
tarjetas; 33 `aria-label` de cada chip con su numero.

**Ficha (34-47).** 34 telefono legible (+34 915 318 748); 35 etiqueta «llamada
gratis» (900, 0800, 800...); 36 la web se ensena como dominio; 37 plazas de los
albergues (`capacity`, 1.834 sitios); 38 «N mas de este tipo a menos de 500 m»;
39 silla de ruedas «en parte»; 40 descripcion del sitio desde OSM (10.389
sitios: «comidas a las 13:00, traer documento»); 41 Apple Maps en iPhone; 42
compartir en PC abre WhatsApp web ademas de copiar; 43 barra fija abajo en movil
con «Como llegar» y «Llamar»; 44 se esconde cuando los botones ya se ven; 45
«Gracias, eso ayuda al siguiente» al verificar; 46 nombres en MAYUSCULAS
capitalizados; 47 telefono tambien de `contact:mobile` y webs sin `https://`
arregladas.

**Mapa y posicion (48-54).** 48 circulo de precision cuando el GPS es malo; 49
aviso «tu posicion es aproximada (±300 m), junto a una ventana mejora»; 50 la
diana gira mientras busca; 51 «Estas aqui» en el punto azul; 52 atribucion
recortada en movil; 53 millas solo por el pais del mapa, nunca por el del
navegador (salian yardas en Madrid); 54 unidades y emergencias separadas.

**SEO (55-75).** 55 JSON-LD WebSite + Organization; 56 WebApplication (gratis,
sin registro); 57 FAQPage con las 8 preguntas de la propia pagina; 58 hreflang
de los 13 idiomas + x-default; 59 URLs `?lang=xx` que arrancan en ese idioma; 60
titulo y descripcion del documento en el idioma elegido; 61 h1 y texto real en
el HTML; 62 enlaces estaticos a prensa, ciudades, novedades y X; 63 preconnect
al servidor de teselas; 64 dns-prefetch a Nominatim; 65 apple-touch-icon; 66
iconos PNG 192/512 y maskable (Chrome no ofrecia instalar con solo SVG); 67
manifest con id, descripcion, accesos directos (Emergencia, Ahora mismo) y
capturas; 68 `?sos=1` y `?now=1` desde el icono instalado; 69 `max-image-preview`;
70 paginas de ciudad con BreadcrumbList; 71 e ItemList de los 10 sitios con
coordenadas; 72 `dateModified`; 73 indice de ciudades agrupado por pais con
cuentas; 74 y con buscador; 75 enlace «pon el mapa de esta ciudad en tu web» en
cada pagina de ciudad (11 idiomas).

**Prensa e instalar (76-79).** 76 tabla de sitios por pais en el kit de prensa
(40 paises, con una nota honesta: pocos sitios = poco mapeado, no poca ayuda);
77 instalar detecta Android/iPhone y pone sus pasos primero; 78 «Novedades» y
«Todas las ciudades» en el menu; 79 «Novedades» en el pie de la lista.

**Accesibilidad (80-90).** 80 gris de texto secundario con contraste 4,5:1; 81
«Estado:» solo para lectores de pantalla en las etiquetas; 82 nombres arabes o
hebreos bien alineados en interfaz latina (`unicode-bidi:plaintext`) en
tarjetas, titulo y ficha; 83 `prefers-contrast: more`; 84 letra grande tambien
agranda botones y chips; 85 enlaces del pie de la bienvenida de 36 px; 86 los
avisos duran mas si el texto es largo; 87 `aria-busy` en la lista mientras
llegan trozos; 88 `enterkeyhint=search` en el buscador del movil; 89 el numero
de emergencia a 38 px y todo el bloque tocable; 90 Escape cierra la bienvenida
y pasa al estado «¿donde estas?».

**Rendimiento y datos (91-100).** 91 nucleo incrustado solo para las 600
ciudades mayores (100 KB -> 62 KB); 92 index de 232 a 216 KB gzip aun con dos
campos nuevos; 93 tabla de textos repetidos recortada; 94 `sw.js` v9 (aviso de
version nueva); 95 codigo ISO por ciudad en `CITIES`; 96 ciudad del pais en la
bienvenida y el desplegable sin ninguna peticion externa; 97 filtros de
categoria por teclado; 98 Escape en cada capa; 99 pruebas ajustadas a la
bienvenida; 100 este README.

Pasan `final.py` (8 pantallas, sin objetivos tactiles pequenos), `v4.py` (13
idiomas + sin red), `v5.py` (5,3 s en 3G lento, 216 KB), `test_dl_offline.py`,
`oh_test.js`, `ohn_test.js`, y a mano: bienvenida en es-MX arranca en Mexico
City, «Nigeria» lista Lagos, Ibadan, Kano...; separadores; telefono formateado;
barra fija; `?lang=fr` en PC; menu con 19 entradas.


## Publicado (10 sep 2026)

Subido y comprobado byte a byte (17 ficheros raiz + 133 al azar de l/, d/ y c/): los cien cambios de la septima ronda,
sw v9, manifest con iconos nuevos, `social.png` regenerado (170.816 / 1.221 / 166) y la marca definitiva.

## Octava ronda: logo y tarjeta al compartir

- Carpeta `logo/`: marca (verde #0B7A63, pin blanco con cruz) en SVG y PNG (256-2048), versiones blanca, negra y verde,
  wordmark sobre claro y oscuro, `favicon.ico` multitamano, `icon-48.png`, tarjeta social y `LEEME.txt` con las reglas.
- Iconos de la app (192, 512, maskable, apple-touch-icon) regenerados desde la marca real; `favicon.svg`/`favicon.ico`/`icon-48.png` en la raiz.
- `social.py` pega la marca real y separa miles; `build.py` versiona `social.png` por hash (`?v=520f1610`) para que
  WhatsApp/X/Facebook no ensenen la tarjeta vieja.
- Etiquetas al compartir completas en index, prensa, instalar, incrustar, cambios, `c/` y las 3.118 fichas de ciudad:
  og:image (+ secure_url, type, 1200x630, alt), og:locale y alternos, og:url/site_name, twitter:card/site/creator/image:alt,
  favicon.ico + svg + apple-touch-icon + theme-color. Titulos con separador de miles ("1,221 cities").


## Novena ronda: revision movil y PC (10 de UX + 10 funcionalidades)

UX
1. Bienvenida en movil: la caja aplastaba los bloques (pictogramas cortados, pasos 1-2-3 sin texto). Ahora hace scroll y el boton «Usar mi ubicacion» queda pegado abajo.
2. Buscador en movil: al tocarlo ocupa toda la barra (menu, marca y emergencias se apartan), flecha para volver, sugerencias a todo el ancho; el microfono aparece al tocar en pantallas de 390 px.
3. El cajon asoma 292 px (antes 196): cabecera en una linea y bloque «que necesitas» mas bajo; se ve la primera tarjeta sin arrastrar.
4. Ficha: el tirador ya no tapa el titulo.
5. Fuentes, aseos, buzones de comida: sin «que necesitas para entrar», sin «plazas», sin pedir la calle a Nominatim (se ensena la coordenada).
6. Horarios: PH → festivos, SH → vacaciones escolares, sunrise/sunset, open/unknown traducidos.
7. Textos: «Cities» traducido en la bienvenida; SOS con el nombre del pais (Intl.DisplayNames) y el 112 como boton «Toca para llamar».
8. PC: la tarjeta elegida se resalta y se lleva a la vista (abre su grupo si estaba plegado); el pin activo lleva halo que late; lo elegido se dibuja aunque su filtro este apagado.
9. PC: con mas de 220 pines a la vista las celdas de agrupacion crecen (menos ruido).
10. Sedes de ONG sin horario, telefono ni servicio (`officeLike`) bajan 900 m en el orden y llevan la etiqueta «oficina, quiza no atiende sin cita».

Funcionalidades
11. «Cierra en X min» en rojo y «abre en X min» en verde en la lista; aviso arriba de la ficha si cierra en menos de 30 min.
12. Plan del dia (7-18 h): comer, lavarse, ropa, alguien que ayude, dormir; de noche el plan de la noche. Boton «El plan de hoy» bajo «que necesitas» y «Ruta a pie con todas las paradas» (Google Maps con waypoints).
13. Hoja de recursos (menu → «Hoja para dar a alguien»): seis sitios, uno por necesidad, con calle, horario, telefono, emergencias y QR; se imprime (solo la hoja) o se manda por WhatsApp.
14. «Enviar mi ubicacion a alguien de confianza»: boton en SOS y en el menu; navigator.share → portapapeles + SMS/WhatsApp.
15. Modo sencillo (`?simple=1` o menu): pantalla negra con cuatro botones enormes (comer, dormir, ducha, emergencia) y letra grande.
16. Confirmaciones pesan en el orden: visto abierto esta semana −300 m, visto cerrado +1 km (tuyo o compartido). `REPORTS_URL` se lee de `<meta name="sn-reports">`.
17. Clima: frio ≤0° o calor ≥38° → banner rojo «temperatura peligrosa» con «sitios calientes/agua abiertos ahora mismo» (filtro + abierto ahora) y la linea social del pais.
18. Cartel A4 por ciudad (`c/<ciudad>.cartel.html`) con cinco sitios con nombre, calle y telefono bajo el QR.
19. Version de texto `t/<ciudad>.html` (~2 KB, sin script) y `t/index.html`; enlazada desde cada ficha de ciudad y desde el menu.
20. «Aqui no hay nada»: en el estado vacio (radio ampliado) y en el lejano; guarda zona (1 km), ciudad y necesidad; con worker va a `/gap` y sale en cambios.html («Where people found nothing»); `worker/reports.js` tiene `/gap` y `/gaps`.

26 claves nuevas en 13 idiomas (wo/bm por subagente). sw v10. Publicado el 10 sep 2026 (admin → «login as» supportnear con token → net2ftp): 8 ficheros raiz, c/ (3.118, cuatro resubidos tras comparar tamanos), t/ (1.222, carpeta creada con state=newdir). Comprobado byte a byte 127 ficheros y por tamano los 4.340 de c/ y t/.
