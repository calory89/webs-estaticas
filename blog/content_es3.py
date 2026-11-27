# -*- coding: utf-8 -*-
"""Datos e informes (47-58) y temporada (59-68), en espanol."""
from articles import art
from core import DATA, cities_where, count_of, esc
import data_fns

EU = 'ES,PT,FR,IT,DE,AT,CH,BE,NL,LU,IE,GB,DK,SE,NO,FI,IS,PL,CZ,SK,HU,RO,BG,GR,HR,SI,RS,BA,ME,MK,AL,EE,LV,LT,UA,MD,BY,CY,MT'

art('informe-ayuda-gratuita-espana-2026', 'es', 'Mapa de la ayuda gratuita en España 2026',
    'Cuántos comedores, albergues, duchas, centros de salud y servicios sociales hay en el mapa abierto en 48 ciudades españolas, qué falta y qué abre en fin de semana.',
    """
! En las 48 ciudades españolas de SupportNear, el mapa abierto conoce **41 sitios de comida gratis y 43 albergues**, frente a más de 1.000 centros de salud y 1.200 servicios sociales. La ayuda más básica es la que peor está en el mapa: casi nadie la ha puesto.

## En cifras

Sitios a menos de 10 km del centro de cada ciudad, sumando las 48 ciudades. Fuente: OpenStreetMap, datos del 28 de octubre de 2026.

{{rsum:cc=ES|es}}

## Comida gratis: las ciudades con más sitios en el mapa

{{rbars:cc=ES|food|15}}

## Albergues

{{rbars:cc=ES|shelter|15}}

## Duchas y aseos públicos

{{rbars:cc=ES|hygiene|15}}

## Horarios: casi nadie los publica

De los sitios de comida, albergues y duchas que listamos en las páginas de cada ciudad, estos son los que tienen horario en el mapa y los que abren en fin de semana según ese horario.

{{hshare:cc=ES|es}}

Sin horario, quien busca comida un domingo no sabe si encontrará la puerta abierta. Es lo primero que cualquier entidad puede arreglar: [así se hace](anadir-o-corregir-tu-entidad).

## Ciudades sin nada en el mapa para alguna necesidad básica

{{gaps:cc=ES|es}}

Que salga vacío no significa que no haya: significa que nadie lo ha puesto en el mapa abierto. La lista mundial está en [huecos del mapa](../huecos).

## España frente a otros países

Sitios en el mapa por país (todas las categorías, a menos de 10 km de las ciudades de SupportNear).

{{countries:es}}

## Duchas y aseos en ciudades europeas

{{rbars:cc=__EU__|hygiene|20}}

## Úsalo

Puedes citar estas cifras con un enlace a esta página. La infografía se puede insertar en cualquier web:

<p><img src="informe-espana-2026.svg" width="760" height="420" alt="Infografía: ayuda gratuita en el mapa en 48 ciudades españolas, 2026" style="max-width:100%;height:auto"></p>

<pre><code>&lt;a href="https://supportnear.com/blog/informe-ayuda-gratuita-espana-2026"&gt;&lt;img src="https://supportnear.com/blog/informe-espana-2026.svg" width="760" height="420" alt="Ayuda gratuita en el mapa en 48 ciudades españolas, 2026 (SupportNear)"&gt;&lt;/a&gt;</code></pre>

Los datos completos están en [datos abiertos](datos-abiertos-y-widget) y la forma de contar, en [metodología](metodologia).
""".replace('__EU__', EU),
    faq=[('¿De dónde salen los datos?', 'De OpenStreetMap, el mapa abierto que mantienen voluntarios, descargado el 28 de octubre de 2026. Contamos los sitios a menos de 10 km del centro de cada ciudad.'),
         ('¿Por qué hay tan pocos comedores?', 'Porque la mayoría no están en el mapa abierto, no porque no existan. Cada entidad que se añade mejora los datos para todos.')],
    rel=['metodologia', 'datos-abiertos-y-widget', 'anadir-o-corregir-tu-entidad'], cat='data', alts={'en': 'free-help-map-report-2026'}, kind='Report')

art('metodologia', 'es', 'Metodología: de dónde salen los datos de SupportNear',
    'Cómo se eligen, se cuentan y se actualizan los sitios del mapa: OpenStreetMap, radio de 10 km, categorías y limitaciones.',
    """
! Todos los sitios salen de **OpenStreetMap (OSM)**, el mapa abierto que mantienen voluntarios, con licencia ODbL. SupportNear no inventa ni compra datos: los descarga, los clasifica por necesidad y los enseña.

## Qué entra

- Sitios marcados en OSM como comedor, banco de alimentos, albergue, ducha, aseo público, agua potable, centro de salud, hospital, servicios sociales, centro de día, biblioteca y centro cívico, entre otros.
- **Tiendas solidarias no**: venden barato, pero no son gratis.
- Se quitan sitios que no son ayuda aunque estén etiquetados así (por ejemplo, piscinas marcadas como duchas).

## Cómo se cuenta

- Cada ciudad cuenta lo que hay **a menos de 10 km de su centro**.
- Las páginas listan primero los sitios con nombre y los más cercanos.
- El horario, el teléfono y la dirección son los de OSM; si faltan, faltan en el mapa abierto.

## Cada cuánto se actualiza

Los datos se descargan de OSM cada mes; la fecha está al pie de cada página. Las guías se revisan cada tres meses.

## Limitaciones

- La cobertura depende de los voluntarios de cada zona: hay ciudades muy completas y otras casi vacías.
- Un sitio puede haber cerrado o cambiado de horario. Por eso cada guía pide llamar antes.

## Cómo corregir

[Añade o corrige tu entidad](anadir-o-corregir-tu-entidad), o escribe a hello@supportnear.com.
""",
    rel=['datos-abiertos-y-widget', 'informe-ayuda-gratuita-espana-2026', 'anadir-o-corregir-tu-entidad'], cat='data')

art('datos-abiertos-y-widget', 'es', 'Datos abiertos, mapa incrustable y descarga',
    'Descarga en CSV los sitios de cada país, los teléfonos de emergencia y el mapa para incrustar en tu web. Gratis, con licencia ODbL.',
    """
! Todo lo que enseña SupportNear se puede descargar o incrustar gratis: **un CSV por país**, los **teléfonos de emergencia** y el **mapa para tu web**.

## Descargas

- [Sitios por país en CSV](../datos/): nombre, categoría, tipo, coordenadas, dirección, horario, teléfono y enlace a OSM. 136 países.
- [Teléfonos de emergencia por país](../emergency-numbers.csv), revisados a mano.

Licencia: Open Database License (ODbL), igual que OpenStreetMap. Cita "© colaboradores de OpenStreetMap, vía SupportNear".

## Incrustar el mapa

Copia el código de [incrustar](../incrustar): el mapa se abre en la ciudad y la necesidad que elijas, con un enlace a la versión completa.

## Para desarrolladores

Los CSV tienen una fila por sitio y un enlace estable a su elemento de OSM. Si vas a usarlos en una app o una investigación, escríbenos: te avisamos cuando cambien.

## Infografías

La del [informe de España](informe-ayuda-gratuita-espana-2026) se puede insertar con su código.
""",
    rel=['metodologia', 'informe-ayuda-gratuita-espana-2026', 'kit-bibliotecas'], cat='data')

art('lo-mas-buscado', 'es', 'Lo que más se busca: cómo llega la gente a SupportNear',
    'Las búsquedas de Google con las que más se ha mostrado SupportNear en noviembre de 2026, agrupadas y sin datos personales.',
    """
! Del 30 de octubre al 25 de noviembre de 2026, Google mostró SupportNear sobre todo en búsquedas de **atención médica gratis, duchas y comida**. Así sabemos qué guías escribir primero.

## Las búsquedas que más nos muestran

Datos agregados de Google Search Console: solo búsquedas genéricas, sin direcciones ni nombres de personas.

| Búsqueda | Qué necesita quien busca | Guía |
|---|---|---|
| free medical hospital · hospital near me · clinic near me | Médico gratis | [Médico gratis](medico-gratis-sin-papeles) · [Free medical care](free-medical-care) |
| showers open now · showers near me · public showers · free showers near me | Ducharse | [Duchas gratis](duchas-gratis) · [Free showers](free-showers-near-me) |
| free food near me open today · food bank near me | Comer hoy | [Comedores abiertos](comedores-sociales-abiertos-hoy) · [Food banks](food-banks-open-today) |
| free baby clothes and diapers near me | Cosas para bebés | [Bebés](ropa-y-panales-para-bebes-gratis) |
| ayuda badalona · ayuda gente mayor badalona | Ayuda local | [Badalona](ayuda-social-badalona) |
| servicios higiénicos en madrid · duchas públicas madrid | Aseos en Madrid | [Guía de Madrid](guia-ayuda-madrid) |
| fuente de agua potable | Agua | [Fuentes de agua](fuentes-de-agua-y-aseos-publicos) |
| emergency relief shelter · notschlafstelle zürich | Dormir | [Albergues](donde-dormir-esta-noche-albergues) · [Notschlafstellen](notschlafstellen) |
| cork charities · birmingham homeless charity | Entidades | [UK and Ireland](free-help-uk-ireland) |

Cada mes actualizamos esta página con lo que más se busca.
""",
    rel=['informe-ayuda-gratuita-espana-2026', 'metodologia'], cat='data')

art('que-ayuda-puedo-pedir', 'es', '¿Qué ayuda puedo pedir? Orientador en 5 preguntas',
    'Marca tu situación y te decimos por dónde empezar: comer, dormir, médico, padrón, Ingreso Mínimo Vital. Orientativo, sin datos personales.',
    """
! Marca lo que te pasa y te enseñamos **por dónde empezar**. No guardamos nada de lo que marques: todo pasa en tu móvil. Es una orientación, no una decisión oficial.

<form class="tool" id="orient" action="#"><fieldset><legend>¿Qué necesitas hoy?</legend><label><input type="checkbox" name="q" value="comer"> Comer</label><label><input type="checkbox" name="q" value="dormir"> Un sitio para dormir esta noche</label><label><input type="checkbox" name="q" value="medico"> Un médico</label><label><input type="checkbox" name="q" value="ducha"> Ducharme o lavar la ropa</label></fieldset><fieldset><legend>Tu situación</legend><label><input type="checkbox" name="q" value="nopadron"> No estoy empadronado</label><label><input type="checkbox" name="q" value="nopapeles"> No tengo residencia legal</label><label><input type="checkbox" name="q" value="sinrenta"> No tengo ingresos</label><label><input type="checkbox" name="q" value="hijos"> Tengo hijos o estoy embarazada</label><label><input type="checkbox" name="q" value="mayor"> Soy mayor o tengo una discapacidad</label></fieldset><p><button class="btn btn--p" type="button" id="orient-go">Ver por dónde empezar</button></p><div id="orient-out" aria-live="polite"></div></form>
<script src="orientador.js" defer></script>

## Si no se carga

- Comer: [comedores sociales](comedores-sociales-abiertos-hoy) · Dormir: [albergues](donde-dormir-esta-noche-albergues)
- Médico: [médico gratis](medico-gratis-sin-papeles) · Ducha: [duchas gratis](duchas-gratis)
- Padrón: [empadronarse sin domicilio](empadronarse-sin-domicilio) · Ingresos: [Ingreso Mínimo Vital](ingreso-minimo-vital-como-pedirlo)
""",
    rel=['como-funciona-la-ayuda-social-en-espana', 'primeras-24-horas-en-la-calle'], cat='data')

# ---------- temporada ----------
art('campana-de-frio-2026-2027', 'es', 'Campaña de frío 2026-2027: plazas extra de invierno en cada ciudad',
    'Fechas, plazas y cómo pedir sitio en la Campaña del Frío de Madrid, la Operació Fred de Barcelona y en el resto de ciudades, más Londres y Dublín.',
    """
! **Madrid**: Campaña del Frío del 2 de noviembre de 2026 al 16 de abril de 2027; plaza a través del SAMUR Social (91 919 89 13, de 8 a 21 h). **Barcelona**: Operació Fred, con plazas extra los días de alerta por frío; CUESB 900 703 030. **En cualquier ciudad**: llama al 112 si alguien corre peligro por el frío.

## Madrid

- Fechas: desde la noche del 2 de noviembre hasta la mañana del 16 de abril. Hostales, del 23 de noviembre al 1 de abril.
- Plazas: 150 en Pinar de San José (más 50 de centro de día 24 h), 142 para hombres en Villa de Vallecas y hasta 150 en hostales a la vez.
- Cómo entrar: Central de SAMUR Social (Carrera de San Francisco, 10) o el teléfono 91 919 89 13. Autobuses EMT 730 (Plaza Elíptica) y 766 (Glorieta de Carlos V) por la tarde.
- Más detalle en la [guía de Madrid](guia-ayuda-madrid).

## Barcelona

- Operació Fred: fase preventiva cada invierno de diciembre a marzo; en enero de 2026 se pasó de unas 100 a 178 plazas para los meses más fríos.
- Los equipos del CUESB, del servicio de calle y de Cruz Roja ofrecen plaza a quien duerme en la calle.
- Teléfono: CUESB, 900 703 030, gratis y 24 horas. Más en la [guía de Barcelona](guia-ayuda-barcelona).

## El resto de ciudades

Muchas ciudades abren plazas extra o amplían horarios cuando baja la temperatura, pero lo anuncian solo en su web o en prensa local. Pregunta en servicios sociales o en el 112, y mira los albergues que hay en el mapa:

{{table:shelter|cc=ES|Ciudad|Albergues en el mapa|Lista|ver la lista}}

## Londres y Dublín

- **Londres**: el protocolo SWEP abre camas de emergencia cuando la previsión baja a 0 °C. Se activó por primera vez este invierno el 13 de noviembre de 2026. Mira [la guía en inglés](cold-weather-shelters-uk-ireland).
- **Dublín**: la Cold Weather Strategy 2026/27 está activa; el teléfono gratuito de alojamiento de emergencia es el 1800 707 707.

## Si ves a alguien con frío

Mira [cómo ayudar a una persona sin hogar en invierno](ayudar-a-una-persona-sin-hogar-en-invierno).
""",
    src=[('SAMUR Social: documento de derivación de la Campaña contra el Frío 2026/2027', 'https://www.madrid.es/UnidadesDescentralizadas/IntegracionyEmergenciaSocial/SAMUR%20Social/ficheros/DOCUMENTO%20DERIVACI%C3%93N%20CF%2026-27.pdf'),
         ('Ara: Barcelona añade plazas los días de frío intenso (14 de enero de 2026)', 'https://en.ara.cat/society/barcelona-will-add-78-more-places-to-care-for-homeless-people-days-of-intense-cold_1_5618150.html'),
         ('Mayor of London: emergency severe weather plan activated (13 de noviembre de 2026)', 'https://www.london.gov.uk/mayor-and-london-boroughs-activate-emergency-severe-weather-plan-first-time-winter'),
         ('Dublin Region Homeless Executive: Cold Weather Strategy', 'https://www.homelessdublin.ie/cold-weather-strategy-2025-2026')],
    faq=[('¿Cuándo empieza la Campaña del Frío en Madrid?', 'La noche del 2 de noviembre de 2026, y dura hasta la mañana del 16 de abril de 2027.'),
         ('¿Cómo se pide plaza en Madrid?', 'En la Central de SAMUR Social (Carrera de San Francisco, 10) o en el 91 919 89 13, de 8:00 a 21:00 todos los días.')],
    rel=['guia-ayuda-madrid', 'ayudar-a-una-persona-sin-hogar-en-invierno', 'donde-dormir-esta-noche-albergues'], cat='season',
    alts={'en': 'cold-weather-shelters-uk-ireland'})

art('comidas-solidarias-navidad', 'es', 'Comidas solidarias en Navidad y Nochevieja',
    'Dónde comer gratis el 24, 25 y 31 de diciembre: comedores sociales, parroquias y entidades que organizan comidas especiales, y por qué hay que llamar antes.',
    """
! En Navidad muchos comedores sociales **cambian el horario o cierran**, y a la vez parroquias y entidades organizan **comidas y cenas especiales** el 24, el 25 y el 31 de diciembre. Llama antes y pregunta en servicios sociales: suelen tener la lista de tu ciudad.

## Cómo encontrarlas

1. **Llama a tu comedor habitual**: pregunta qué días abre y si hacen comida especial.
2. **Servicios sociales y urgencias sociales** (SAMUR Social en Madrid, CUESB en Barcelona) conocen las comidas de Navidad de la ciudad.
3. **Parroquias, Cáritas, Cruz Roja y la Comunidad de Sant'Egidio** organizan comidas de Navidad en muchas ciudades; algunas piden apuntarse antes.

## Comedores de tu ciudad, con teléfono

{{table:food|cc=ES|Ciudad|Comedores y bancos en el mapa|Lista|ver la lista}}

## Si quieres ayudar en Navidad

Los comedores necesitan voluntarios justo esos días, y también en enero, cuando baja la ayuda. Mira [voluntariado en un comedor](voluntariado-en-un-comedor-social).
""",
    rel=['comedores-sociales-abiertos-hoy', 'voluntariado-en-un-comedor-social', 'juguetes-solidarios-reyes'], cat='season')

art('recogidas-de-alimentos', 'es', 'Recogidas de alimentos: dónde y cómo donar',
    'La Gran Recogida de FESBAL (13 a 15 de noviembre de 2026), las recogidas de barrio y cómo donar durante todo el año.',
    """
! La mayor recogida del año, la **Gran Recogida de FESBAL**, fue en 2026 el **13, 14 y 15 de noviembre** en supermercados de toda España. Pero los bancos de alimentos reciben donaciones todo el año, y muchos barrios hacen sus propias recogidas.

## Cómo donar todo el año

- **En el banco de alimentos de tu provincia**: aceptan alimentos y donativos.
- **En comedores y parroquias de tu barrio**: pregunta qué les falta.
- **Con dinero**: el banco compra lo que le falta, también productos frescos.

## Qué donar

Leche, aceite, conservas, arroz y legumbres. Mira [qué donar y qué no](que-donar-a-un-banco-de-alimentos).

## Ser voluntario en una recogida

En la Gran Recogida hacen falta miles de voluntarios en turnos de unas horas en los supermercados. Apúntate en el banco de alimentos de tu provincia con antelación.
""",
    src=[('RFEF: la RFEF y FESBAL refuerzan su compromiso con la Gran Recogida 2026', 'https://rfef.es/es/noticias/la-rfef-y-fesbal-refuerzan-su-compromiso-con-la-gran-recogida-de-alimentos-2026')],
    rel=['que-donar-a-un-banco-de-alimentos', 'voluntariado-en-un-comedor-social'], cat='season')

art('ola-de-calor-refugios-climaticos', 'es', 'Ola de calor: refugios climáticos, agua y sombra',
    'Dónde refrescarse gratis en una ola de calor: refugios climáticos, bibliotecas, fuentes de agua potable, y señales de golpe de calor.',
    """
! En una ola de calor, busca un sitio fresco y bebe agua aunque no tengas sed. **Bibliotecas, centros cívicos y centros comerciales tienen aire acondicionado y se puede entrar gratis**, y algunas ciudades (Barcelona entre ellas) tienen una red de **refugios climáticos** municipales.

## Dónde refrescarse

- **Refugios climáticos**: espacios municipales con fresco y agua, sobre todo bibliotecas, escuelas y parques. Pregunta en tu ayuntamiento si tu ciudad los tiene.
- **Bibliotecas y centros cívicos**: mira [sitios donde estar](cargar-el-movil-y-wifi-gratis).
- **Fuentes de agua potable**: mira [fuentes y aseos](fuentes-de-agua-y-aseos-publicos).

## Señales de golpe de calor

Piel muy caliente y seca, confusión, mareo fuerte o pérdida de conciencia. **Llama al 112**, lleva a la persona a la sombra y refréscala con agua.

## Si duermes en la calle

En algunas ciudades los servicios sociales también activan dispositivos de calor en verano. Pregunta en servicios sociales o en el 112.
""",
    rel=['fuentes-de-agua-y-aseos-publicos', 'cargar-el-movil-y-wifi-gratis', 'comedores-en-agosto'], cat='season')

art('material-escolar-gratis', 'es', 'Material escolar gratis y bancos de libros',
    'Becas de libros, bancos de libros de los colegios y entidades que reparten material escolar: dónde pedirlo antes de septiembre.',
    """
! Para el material escolar, pregunta primero **en el colegio de tus hijos**: muchos tienen un **banco de libros** o un programa de préstamo gratuito, y las comunidades autónomas dan **becas o ayudas para libros y comedor**, que se piden en primavera o verano.

## Dónde preguntar

- **El colegio o el AMPA**: bancos de libros, préstamo de libros de texto y material reutilizado.
- **Tu comunidad autónoma**: ayudas para libros de texto y para el comedor escolar. Los plazos cambian cada año.
- **Servicios sociales**: ayudas de emergencia para material y ropa.
- **Entidades** (Cáritas, Cruz Roja, asociaciones de barrio): campañas de vuelta al cole con mochilas y material.

## Comedor escolar

Si no puedes pagarlo, pide la beca de comedor en el colegio o en servicios sociales: en muchos sitios es gratis para familias con pocos ingresos.
""",
    rel=['ropa-y-panales-para-bebes-gratis', 'como-funciona-la-ayuda-social-en-espana'], cat='season')

art('juguetes-solidarios-reyes', 'es', 'Juguetes solidarios para Reyes',
    'Dónde pedir juguetes gratis para los niños en Reyes y cómo donar juguetes nuevos a una campaña.',
    """
! Muchas entidades reparten **juguetes nuevos para Reyes** a familias derivadas por servicios sociales o inscritas antes de diciembre. Pide información **en servicios sociales, Cruz Roja, Cáritas o tu parroquia** en la primera quincena de diciembre.

## Para recibir

- Pregunta cuanto antes: muchas campañas cierran la inscripción a mediados de diciembre.
- Lleva el libro de familia y, si te lo piden, el volante de empadronamiento.

## Para donar

- Juguetes **nuevos y sin envolver** (así pueden elegir el adecuado para cada edad).
- Piensa en todas las edades, también en adolescentes: juegos, libros y material de dibujo.
- Pregunta en la entidad qué necesita: algunas prefieren tarjetas regalo.
""",
    rel=['comidas-solidarias-navidad', 'voluntariado-en-un-comedor-social'], cat='season')

art('dia-de-las-personas-sin-hogar', 'es', 'Día de las personas sin hogar: datos y cómo ayudar',
    'El 10 de octubre es el Día Mundial de las Personas sin Hogar. Qué dicen los datos del mapa y qué puede hacer cualquiera.',
    """
! El **10 de octubre** es el Día Mundial de las Personas sin Hogar. En España, además, Cáritas y otras entidades hacen su campaña de personas sin hogar a finales de octubre. Es buen momento para mirar qué ayuda hay en tu ciudad y qué falta.

## Lo que dicen los datos del mapa

En 48 ciudades españolas, el mapa abierto conoce 41 sitios de comida gratis y 43 albergues. Casi ninguno tiene el horario publicado. Mira el [informe completo](informe-ayuda-gratuita-espana-2026).

## Qué puedes hacer

- [Ayudar a alguien que duerme en la calle](ayudar-a-una-persona-sin-hogar-en-invierno).
- [Hacer voluntariado](voluntariado-en-un-comedor-social).
- [Poner en el mapa](anadir-o-corregir-tu-entidad) el comedor, la ducha o el albergue de tu barrio.
- Colgar un [cartel de tu ciudad](carteles-imprimibles) en tu biblioteca o tu trabajo.
""",
    rel=['informe-ayuda-gratuita-espana-2026', 'ayudar-a-una-persona-sin-hogar-en-invierno'], cat='season')

art('ramadan-iftar-solidario', 'es', 'Ramadán: iftar solidario y comedores',
    'Dónde romper el ayuno gratis durante el Ramadán (en 2027, a partir de principios de febrero) y qué tener en cuenta en los comedores sociales.',
    """
! Durante el Ramadán muchas **mezquitas y asociaciones organizan iftar** (la comida de la puesta de sol) abiertos y gratuitos. En 2027 el Ramadán empieza a principios de febrero; la fecha exacta depende de la luna. Pregunta en la mezquita o el centro islámico de tu barrio.

## En los comedores sociales

- Muchos comedores sirven a mediodía, cuando quien ayuna no puede comer. Pregunta si te pueden dar la comida para llevar.
- Si no comes cerdo, dilo: la mayoría de los comedores tienen una alternativa.

## Comedores de tu ciudad

{{table:food|cc=ES|Ciudad|Comedores y bancos en el mapa|Lista|ver la lista}}
""",
    rel=['comedores-sociales-abiertos-hoy', 'banco-de-alimentos-como-pedir-comida'], cat='season')

art('comedores-en-agosto', 'es', 'Comedores que cierran en agosto y qué alternativas hay',
    'En verano muchos comedores sociales cierran o reducen horario. Cómo encontrar dónde comer en agosto y por qué faltan voluntarios.',
    """
! En agosto **muchos comedores sociales cierran o reducen días** porque faltan voluntarios. Antes de ir, llama, y pregunta en servicios sociales qué comedores siguen abiertos en tu ciudad.

## Qué hacer

1. **Llama a tu comedor** en julio y pregunta si cierra en agosto y cuál lo sustituye.
2. **Servicios sociales** y las urgencias sociales conocen los comedores de verano.
3. **Bancos de alimentos y despensas** suelen seguir repartiendo lotes.

## Comedores abiertos en fin de semana según su horario

{{weekend:cc=ES|food}}

## Si quieres ayudar

Agosto es cuando más falta hace un voluntario. Mira [voluntariado en un comedor](voluntariado-en-un-comedor-social).
""",
    rel=['comedores-sociales-abiertos-hoy', 'ola-de-calor-refugios-climaticos', 'voluntariado-en-un-comedor-social'], cat='season')
