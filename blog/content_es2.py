# -*- coding: utf-8 -*-
"""Ciudades y paises (17-34) y profesionales y entidades (35-46), en espanol."""
from articles import art

art('guia-ayuda-madrid', 'es', 'Ayuda gratis en Madrid: guía para empezar',
    'A quién llamar en Madrid (SAMUR Social), cómo funciona la Campaña del Frío 2026-2027 y dónde comer, dormir y ducharse gratis.',
    """
! En Madrid, la puerta de entrada para quien no tiene casa es el **SAMUR Social: 91 480 20 20, 24 horas**. Para dormir este invierno está la Campaña del Frío, abierta **desde la noche del 2 de noviembre de 2026 hasta la mañana del 16 de abril de 2027**.

## A quién llamar

{{phones:ES|es}}

- **112**: emergencias, gratis.
- **Servicios sociales municipales**: hay un centro por zona; te toca el de tu dirección o tu padrón. Mira [servicios sociales en Madrid](servicios-sociales-madrid).

## Campaña del Frío 2026-2027

- **Pinar de San José** (C/ Pinar de San José, 106): 150 plazas para dormir, hombres y mujeres, y 50 plazas de centro de día con atención 24 horas.
- **Villa de Vallecas** (Camino del Pozo del Tío Raimundo s/n): 142 plazas para hombres.
- **Plazas en hostales**: hasta 150 a la vez, del 23 de noviembre al 1 de abril.
- **Cómo entrar**: acude a la Central de SAMUR Social (Carrera de San Francisco, 10) o llama al Equipo de Coordinación de Accesos, **91 919 89 13**, de 8:00 a 21:00 todos los días. Las entidades pueden derivar por correo.
- **Autobuses**: línea EMT 730 desde Plaza Elíptica (19:00 y 20:00) al Pinar de San José, y 766 desde Glorieta del Emperador Carlos V (19:30 y 20:30) a Villa de Vallecas.
- **Requisitos**: ser mayor de edad, no tener alojamiento ni recursos suficientes, y estar empadronado o tener vinculación con Madrid.

## Comer

{{top:madrid|food|8}}

[Todos los comedores de Madrid](../c/madrid-food) · [Cómo pedir a un banco de alimentos](banco-de-alimentos-como-pedir-comida)

## Dormir

{{top:madrid|shelter|8}}

## Ducharse y asearse

{{top:madrid|hygiene|5}}

## Médico

Urgencias de cualquier hospital público. Sin papeles: [médico gratis sin papeles](medico-gratis-sin-papeles).

[Toda la ayuda gratis en Madrid](../c/madrid) · [Imprimir un cartel de Madrid](../c/madrid.cartel)
""",
    src=[('SAMUR Social: documento de derivación de la Campaña contra el Frío 2026/2027', 'https://www.madrid.es/UnidadesDescentralizadas/IntegracionyEmergenciaSocial/SAMUR%20Social/ficheros/DOCUMENTO%20DERIVACI%C3%93N%20CF%2026-27.pdf'),
         ('Madrid Informa: Madrid amplía la Campaña del Frío (10 de mayo de 2026)', 'https://madridinforma.es/madrid-amplia-la-campana-del-frio-mas-dias-mas-plazas-y-61-millones-para-atender-a-personas-sin-hogar/')],
    faq=[('¿Cuál es el teléfono del SAMUR Social?', '91 480 20 20, las 24 horas. Para pedir plaza en la Campaña del Frío está también el Equipo de Coordinación de Accesos, 91 919 89 13, de 8:00 a 21:00.'),
         ('¿Cuándo empieza la Campaña del Frío en Madrid?', 'La de 2026-2027 abre desde la noche del 2 de noviembre de 2026 hasta la mañana del 16 de abril de 2027. Las plazas en hostales, del 23 de noviembre al 1 de abril.')],
    rel=['servicios-sociales-madrid', 'campana-de-frio-2026-2027', 'donde-dormir-esta-noche-albergues'], cat='city', cta=('../?city=Madrid&cc=ES', 'Abrir el mapa de Madrid'))

art('guia-ayuda-barcelona', 'es', 'Ayuda gratis en Barcelona: guía para empezar',
    'Cómo funciona la atención a personas sin hogar en Barcelona: el CUESB (900 703 030), la Operació Fred de invierno y dónde comer, dormir y ducharse.',
    """
! En Barcelona, la urgencia social la atiende el **CUESB (Centre d'Urgències i Emergències Socials de Barcelona): 900 703 030, gratis, 24 horas**. En invierno el Ayuntamiento activa la **Operació Fred**, con plazas extra los días de frío intenso.

## A quién llamar

{{phones:ES|es}}

- **112**: emergencias, gratis.
- **Servicios sociales**: hay un centro por barrio. El CUESB atiende fuera de horario y en urgencias.

## Operació Fred

- Es el dispositivo de invierno del Ayuntamiento: una fase preventiva cada año de diciembre a marzo, y más plazas cuando hay alerta o prealerta por bajas temperaturas.
- Equipos del CUESB, del servicio de calle y de Cruz Roja salen a buscar a quien duerme en la calle y le ofrecen plaza en un centro municipal.
- En enero de 2026 el Ayuntamiento pasó de unas 100 a 178 plazas para los meses más fríos. Las cifras de 2026-2027 se anuncian al activar cada fase: pregunta en el CUESB.

## Comer

{{top:barcelona|food|8}}

## Dormir

{{top:barcelona|shelter|8}}

## Ducharse y asearse

{{top:barcelona|hygiene|5}}

[Toda la ayuda gratis en Barcelona](../c/barcelona) · [Imprimir un cartel de Barcelona](../c/barcelona.cartel)
""",
    src=[('Ajuntament de Barcelona: Cold weather operation activated (2023)', 'https://ajuntament.barcelona.cat/dretssocials/en/noticia/1259256'),
         ('Ara: Barcelona will add 78 more places on days of intense cold (14 de enero de 2026)', 'https://en.ara.cat/society/barcelona-will-add-78-more-places-to-care-for-homeless-people-days-of-intense-cold_1_5618150.html'),
         ('Ajuntament de Barcelona: urgencias y emergencias sociales', 'https://ajuntament.barcelona.cat/serveissocials/es/canal/urgencies-i-emergencies-socials')],
    rel=['ayuda-social-badalona', 'campana-de-frio-2026-2027', 'duchas-gratis'], cat='city', cta=('../?city=Barcelona&cc=ES', 'Abrir el mapa de Barcelona'))

art('ayuda-social-badalona', 'es', 'Ayuda social en Badalona: comida, servicios sociales y mayores',
    'Lo que hay en el mapa de Badalona: servicios sociales, centros para personas mayores, comida y dónde pedir ayuda.',
    """
! En Badalona la ayuda social empieza en los **servicios sociales municipales** de tu barrio. Para urgencias, el **112**. Abajo tienes los sitios de Badalona que salen en el mapa.

## Servicios sociales y entidades

{{top:badalona|social|10}}

## Sitios donde estar: bibliotecas y centros cívicos

{{top:badalona|warm|8}}

## Salud

{{top:badalona|health|6}}

## Personas mayores

Para ayuda a domicilio, teleasistencia o centro de día, pide cita en servicios sociales: valoran la dependencia y te dicen qué te corresponde. Mira [ayuda para mayores y discapacidad](ayuda-mayores-y-discapacidad).

## Comida

Si no sale ningún comedor en Badalona, mira los de [Barcelona](../c/barcelona-food), a pocos kilómetros, o pregunta en servicios sociales por los repartos de alimentos de tu barrio.

[Toda la ayuda gratis en Badalona](../c/badalona)
""",
    rel=['guia-ayuda-barcelona', 'ayuda-mayores-y-discapacidad', 'banco-de-alimentos-como-pedir-comida'], cat='city', cta=('../?city=Badalona&cc=ES', 'Abrir el mapa de Badalona'))

art('servicios-sociales-madrid', 'es', 'Servicios sociales en Madrid: centros y cómo pedir cita',
    'Los centros de servicios sociales de Madrid que salen en el mapa, cómo pedir cita y qué hacer en una urgencia (SAMUR Social).',
    """
! En Madrid te corresponde **el centro de servicios sociales de tu zona**, según tu dirección o tu padrón. Para una urgencia social, a cualquier hora, el **SAMUR Social: 91 480 20 20**.

## Cómo pedir cita

- Por teléfono en el **010** (línea Madrid) o en la web del Ayuntamiento.
- En persona en tu centro de servicios sociales.
- Si no tienes casa ni padrón, ve al centro más cercano o llama al SAMUR Social: te orientan y te ayudan a [empadronarte](empadronarse-sin-domicilio).

## Centros y entidades en el mapa

{{top:madrid|social|20}}

[Todos los servicios sociales de Madrid en el mapa](../c/madrid-social)
""",
    rel=['guia-ayuda-madrid', 'empadronarse-sin-domicilio', 'glosario-recursos-sociales'], cat='city', cta=('../?city=Madrid&cc=ES&need=social', 'Ver en el mapa'))

art('telefonos-de-emergencia-por-pais', 'es', 'Teléfonos de emergencia y de ayuda social por país',
    'El número de emergencias de cada país (112, 911, 999...) y las líneas de ayuda social que conocemos, revisados a mano.',
    """
! En toda la Unión Europea **el 112 funciona gratis desde cualquier móvil**, también sin saldo. En Estados Unidos, Canadá y gran parte de América es el **911**; en Reino Unido, el **999** (y el 112).

## Líneas de ayuda social

{{phones:ES|es}}
{{phones:GB|es}}
{{phones:IE|es}}

## Número de emergencias de cada país

Revisado a mano en septiembre de 2026 con fuentes oficiales y Wikipedia. Si ves un error, escríbenos.

{{emergency:es}}

Los datos se pueden descargar en [CSV](../emergency-numbers.csv).
""",
    faq=[('¿El 112 funciona sin saldo?', 'Sí. En la Unión Europea el 112 es gratuito y se puede llamar sin saldo y, en muchos casos, aunque tu compañía no tenga cobertura.'),
         ('¿Qué número es en Estados Unidos?', 'El 911.')],
    rel=['como-funciona-la-ayuda-social-en-espana', 'primeras-24-horas-en-la-calle'], cat='city', alts={'en': 'emergency-numbers-by-country'})

art('abierto-fin-de-semana', 'es', 'Qué abre en fin de semana y festivos',
    'Comedores, albergues y duchas que, según su horario en el mapa, abren sábado o domingo en ciudades españolas, y qué hacer cuando todo está cerrado.',
    """
! El fin de semana cierran muchos servicios sociales y comedores. **Lo que siempre funciona: urgencias de los hospitales, el 112 y los servicios de urgencia social** (SAMUR Social en Madrid, CUESB en Barcelona).

## Abren sábado o domingo (según su horario en el mapa)

{{weekend:cc=ES|food,shelter,hygiene}}

En España muy pocos sitios del mapa tienen el horario publicado. Si conoces el de uno, [añádelo](anadir-o-corregir-tu-entidad).

## En festivos

- Navidad y Año Nuevo: mira [comidas solidarias en Navidad](comidas-solidarias-navidad).
- Agosto: muchos comedores cierran. Mira [comedores en agosto](comedores-en-agosto).
""",
    rel=['comedores-sociales-abiertos-hoy', 'comidas-solidarias-navidad', 'comedores-en-agosto'], cat='city')

art('albergues-y-comedores-latinoamerica', 'es', 'Albergues y comedores en Latinoamérica, ciudad por ciudad',
    'Cuántos albergues, comedores y servicios sociales hay en el mapa en las ciudades de habla hispana de América, con enlace a cada lista.',
    """
! SupportNear cubre las principales ciudades de habla hispana de América. Abajo, cuántos **albergues** y **sitios de comida** hay en el mapa en cada una. Un 0 casi siempre significa que nadie los ha puesto aún en el mapa abierto.

## Albergues

{{table:shelter|cc=AR,BO,CL,CO,CR,CU,DO,EC,GT,HN,MX,NI,PA,PE,PR,PY,SV,UY,VE|Ciudad|Albergues en el mapa|Lista|ver la lista}}

## Comida

{{table:food|cc=AR,BO,CL,CO,CR,CU,DO,EC,GT,HN,MX,NI,PA,PE,PR,PY,SV,UY,VE|Ciudad|Comida gratis en el mapa|Lista|ver la lista}}

## Personas con discapacidad y fundaciones

Las fundaciones y entidades sociales salen en la categoría de servicios sociales de cada ciudad:

{{table:social|cc=AR,BO,CL,CO,CR,CU,DO,EC,GT,HN,MX,NI,PA,PE,PR,PY,SV,UY,VE|Ciudad|Servicios sociales en el mapa|Lista|ver la lista|5}}
""",
    rel=['telefonos-de-emergencia-por-pais', 'anadir-o-corregir-tu-entidad'], cat='city')

art('refugiados-centros-de-acogida', 'es', 'Centros de acogida para personas refugiadas',
    'Centros de acogida de refugiados y oficinas de asilo que salen en el mapa, ciudad por ciudad, y los primeros pasos al llegar.',
    """
! Si acabas de llegar huyendo de tu país, **pide protección internacional lo antes posible** (en España, en la policía o en una oficina de asilo) y busca una entidad de acogida: en España, entre otras, Cruz Roja, CEAR y Accem. Abajo tienes los centros de acogida que salen en el mapa.

## Primeros pasos en España

1. **Pide protección internacional**: el resguardo que te dan es un documento válido, también para [empadronarte](empadronarse-sin-domicilio).
2. **Pide plaza en el sistema de acogida** a través de las entidades que lo gestionan.
3. **Sanidad**: mira [médico gratis sin papeles](medico-gratis-sin-papeles).

## Centros de acogida en el mapa

{{types:all|shelter|r[eé]fug|6|60}}

## Otros idiomas

[Українською](dovidnyk-dlia-bizhentsiv) · [По-русски](spravochnik-dlya-bezhentsev) · [بالعربية](dalil-lil-wafidin) · [اردو میں](naye-aane-walon-ke-liye) · [English](refugee-reception-centres)
""",
    rel=['medico-gratis-sin-papeles', 'empadronarse-sin-domicilio'], cat='city', alts={'en': 'refugee-reception-centres'})

art('carteles-imprimibles', 'es', 'Carteles imprimibles con la ayuda de cada ciudad',
    'Una hoja por ciudad con un código QR al mapa y los teléfonos de ayuda, para colgar en un centro, una biblioteca o un comedor.',
    """
! Cada ciudad tiene un **cartel de una hoja** con un código QR que abre el mapa de esa ciudad y el teléfono de emergencias. Ábrelo, pulsa imprimir y cuélgalo.

## España

{{posters:cc=ES|España}}

## Otros países de habla hispana

{{posters:cc=AR,BO,CL,CO,CR,CU,DO,EC,GT,HN,MX,NI,PA,PE,PR,PY,SV,UY,VE|América}}

## Dónde colgarlo

- En bibliotecas, centros cívicos y centros de salud.
- En la puerta de comedores y parroquias.
- En la sala de espera de servicios sociales.

Si eres una biblioteca, mira también el [kit para bibliotecas](kit-bibliotecas).
""",
    rel=['kit-bibliotecas', 'supportnear-para-trabajadores-sociales'], cat='city')

art('como-funciona-la-ayuda-social-en-espana', 'es', 'Cómo funciona la ayuda social en España',
    'Servicios sociales municipales, urgencias sociales, padrón, sanidad e Ingreso Mínimo Vital: el mapa del sistema en una página.',
    """
! La ayuda social en España empieza en el **ayuntamiento**: los servicios sociales municipales valoran tu caso y te dan acceso a casi todo lo demás. Las ayudas económicas grandes las dan la Seguridad Social (Ingreso Mínimo Vital) y tu comunidad autónoma (rentas mínimas).

## Quién hace qué

- **Ayuntamiento – servicios sociales**: primera atención, ayudas de emergencia, derivación a comedores, albergues y bancos de alimentos. Cada barrio tiene su centro.
- **Urgencias sociales municipales**: atienden de noche y en fin de semana (SAMUR Social en Madrid, CUESB en Barcelona).
- **Padrón municipal**: te da acceso a servicios sociales y sanidad. Se puede tener [sin domicilio](empadronarse-sin-domicilio).
- **Comunidad autónoma**: sanidad, dependencia, discapacidad y rentas mínimas autonómicas.
- **Seguridad Social**: [Ingreso Mínimo Vital](ingreso-minimo-vital-como-pedirlo), pensiones no contributivas.
- **Entidades sociales** (Cáritas, Cruz Roja, parroquias, asociaciones): comedores, roperos, repartos de alimentos, acogida.

## Por dónde empezar

1. Pide cita en servicios sociales de tu ayuntamiento.
2. Empadrónate si no lo estás.
3. Con su ayuda, pide las prestaciones que te correspondan.

## Teléfonos

{{phones:ES|es}}

Mira también el [glosario de recursos sociales](glosario-recursos-sociales).
""",
    rel=['glosario-recursos-sociales', 'empadronarse-sin-domicilio', 'ingreso-minimo-vital-como-pedirlo'], cat='city')

# ---------- profesionales y entidades ----------
art('supportnear-para-trabajadores-sociales', 'es', 'SupportNear para trabajadores sociales: guía de 5 minutos',
    'Cómo usar el mapa en un servicio social: buscar por necesidad, compartir un sitio, imprimir un cartel y usarlo sin conexión.',
    """
! SupportNear es un mapa gratuito, sin cuenta y sin anuncios de sitios donde conseguir comida, cama, ducha, ropa, médico o ayuda social. Sirve para **derivar en un minuto**: buscas, compartes el enlace del sitio y la persona lo abre en su móvil, también sin datos.

## Lo básico

1. **Abre** [supportnear.com](../) y elige la ciudad, o deja que te localice.
2. **Filtra por necesidad**: comida, albergue, higiene, salud, servicios sociales, agua, sitios donde estar.
3. **Abre la ficha** de un sitio: dirección, horario y teléfono si se conocen, y cómo llegar andando.
4. **Comparte**: cada ficha tiene un enlace propio. Mándalo por WhatsApp o imprímelo.

## Trucos

- **Sin conexión**: descarga la ciudad una vez y funciona sin datos. Mira [instalar](../instalar).
- **20 idiomas**: la persona puede verlo en su idioma.
- **Carteles**: [un cartel por ciudad](carteles-imprimibles) con QR, para la sala de espera.
- **Derivación por escrito**: usa la [plantilla de derivación](plantilla-de-derivacion).
- **Si un sitio ha cerrado**: márcalo desde su ficha y lo ve todo el mundo.

## Lo que no es

No sustituye a vuestra guía de recursos: los datos vienen de OpenStreetMap y pueden estar incompletos. Si falta un recurso de vuestra zona, [añadidlo](anadir-o-corregir-tu-entidad) y aparecerá para todos.
""",
    rel=['plantilla-de-derivacion', 'kit-bibliotecas', 'anadir-o-corregir-tu-entidad'], cat='pro')

art('kit-bibliotecas', 'es', 'Kit para bibliotecas: cartel, texto y mapa para vuestra web',
    'Todo lo que una biblioteca pública necesita para ofrecer SupportNear: cartel con QR, un texto para la web y el mapa incrustado.',
    """
! Las bibliotecas son de los pocos sitios donde cualquiera puede entrar, cargar el móvil y conectarse. Con este kit podéis **orientar a quien busca comida, cama o ducha** sin trabajo extra.

## 1. Cuelga el cartel

Hay [un cartel por ciudad](carteles-imprimibles) con QR. Imprímelo en A4 y ponlo junto a los ordenadores o en el tablón.

## 2. Pon este texto en vuestra web

<pre><code>¿Necesitas comida, un sitio para dormir, una ducha o un médico gratis?
SupportNear es un mapa gratuito, sin registro, en 20 idiomas, con los sitios
de ayuda más cercanos: https://supportnear.com/</code></pre>

## 3. Incrusta el mapa

Copia el código de [incrustar](../incrustar) y pégalo en una página de vuestra web: el mapa se abre en la ciudad que elijáis.

## 4. Avísanos

Si lo usáis, escríbenos a hello@supportnear.com: os ponemos en la lista de bibliotecas que lo ofrecen.
""",
    rel=['carteles-imprimibles', 'distintivo-supportnear', 'cargar-el-movil-y-wifi-gratis'], cat='pro')

art('plantilla-de-derivacion', 'es', 'Plantilla de derivación imprimible',
    'Una hoja para escribir a dónde enviar a una persona: sitio, dirección, horario, teléfono y enlace al mapa. Se imprime desde el navegador.',
    """
! Rellena esta hoja a mano o en pantalla e imprímela (Ctrl+P). Lleva el enlace del mapa para que la persona pueda llegar andando.

<div class="print-sheet"><h3>Te recomendamos ir a</h3><p>Sitio: ______________________________________</p><p>Dirección: ___________________________________</p><p>Día y hora: __________________________________</p><p>Teléfono: ____________________________________</p><p>Qué llevar: __________________________________</p><p>Preguntar por: _______________________________</p><p><strong>Mapa con todos los sitios cercanos:</strong> supportnear.com</p><p><strong>Emergencias:</strong> 112 (gratis)</p></div>

## Consejos

- Copia el enlace de la ficha del sitio en SupportNear y escríbelo abreviado, o mándalo por WhatsApp.
- Llama tú antes si puedes: el horario del mapa puede haber cambiado.
""",
    rel=['supportnear-para-trabajadores-sociales', 'carteles-imprimibles'], cat='pro')

art('anadir-o-corregir-tu-entidad', 'es', 'Cómo añadir o corregir tu entidad en el mapa',
    'Paso a paso para poner un comedor, albergue, ducha o servicio social en OpenStreetMap, con las etiquetas exactas, para que salga en SupportNear.',
    """
! Los sitios de SupportNear salen de **OpenStreetMap**, el mapa abierto que cualquiera puede editar. Si añades o corriges tu entidad allí, aparece en SupportNear en la siguiente actualización, y también en otras apps que usan el mapa abierto.

## Si solo hay que corregir algo

- **Ha cerrado**: márcalo desde su ficha en SupportNear.
- **Horario o teléfono mal**: escríbenos a hello@supportnear.com con el enlace de la ficha y el dato correcto. O corrígelo tú en OpenStreetMap (abajo).

## Añadirlo tú en OpenStreetMap (10 minutos)

1. Crea una cuenta gratis en [openstreetmap.org](https://www.openstreetmap.org/).
2. Busca la calle y pulsa **Editar**. Se abre el editor iD, con un tutorial de 5 minutos.
3. Pon un **punto** en la entrada del edificio y elige el tipo.
4. Rellena nombre, dirección, horario (`opening_hours`), teléfono y web.
5. Guarda con un comentario corto, por ejemplo "Añadido comedor social".

## Las etiquetas que usa SupportNear

- Comedor social: `amenity=social_facility` + `social_facility=soup_kitchen`
- Banco de alimentos: `amenity=social_facility` + `social_facility=food_bank`
- Albergue: `amenity=social_facility` + `social_facility=shelter`
- Ropero gratuito: `amenity=social_facility` + `social_facility=clothing_bank`
- Centro de día o servicios sociales: `amenity=social_facility` (+ `social_facility=outreach` o `day_care` según el caso)
- Ducha pública: `amenity=shower` (con `fee=no` si es gratis)
- Aseos públicos: `amenity=toilets` (con `fee=no`)
- Fuente de agua potable: `amenity=drinking_water`
- A quién atiende: `social_facility:for=homeless`, `women`, `migrant`, `senior`...

Un horario se escribe así: `Mo-Fr 13:00-15:00; Sa 13:00-14:30`.

## ¿Cuándo aparece?

SupportNear actualiza los datos de OpenStreetMap cada mes. La fecha de la última actualización sale al pie de cada página.
""",
    faq=[('¿Cuesta algo salir en SupportNear?', 'No. Es gratis y no hay que registrarse en SupportNear: basta con que el sitio esté en OpenStreetMap.'),
         ('¿Por qué no sale mi entidad?', 'Porque no está en OpenStreetMap, o está con una etiqueta que SupportNear no usa. Añádela con las etiquetas de esta guía o escríbenos.')],
    src=[('OpenStreetMap Wiki: social_facility', 'https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dsocial_facility'),
         ('OpenStreetMap Wiki: opening_hours', 'https://wiki.openstreetmap.org/wiki/Key:opening_hours')],
    rel=['supportnear-para-trabajadores-sociales', 'distintivo-supportnear', 'metodologia'], cat='pro', alts={'en': 'add-your-organisation'})

art('voluntariado-en-un-comedor-social', 'es', 'Cómo empezar como voluntario en un comedor social',
    'Qué hace un voluntario en un comedor o banco de alimentos, cómo apuntarse y qué comedores hay en tu ciudad.',
    """
! Escribe o llama al comedor o al banco de alimentos más cercano y pregunta **qué turnos necesitan cubrir**. Casi todos buscan gente para servir, cocinar, clasificar alimentos o repartir, sobre todo los fines de semana y en verano.

## Qué se hace

- **Comedor**: preparar, servir, recoger y, sobre todo, hablar con la gente.
- **Banco de alimentos**: clasificar donaciones, preparar lotes, conducir furgonetas.
- **Recogidas de alimentos**: turnos de unas horas en supermercados.

## Cómo apuntarse

1. Mira los comedores y bancos de tu ciudad en el mapa: cada ciudad tiene una página de [voluntariado y donaciones](../c/madrid-volunteer).
2. Llama o escribe: muchos piden una entrevista corta y un compromiso mínimo (por ejemplo, un turno a la semana).
3. Si trabajas con menores o personas vulnerables, pueden pedirte el certificado de delitos de naturaleza sexual (se pide gratis online).

## Páginas de voluntariado por ciudad

{{table:volunteer|cc=ES|Ciudad|Comedores y bancos|Página|voluntariado}}
""",
    rel=['que-donar-a-un-banco-de-alimentos', 'ayudar-a-una-persona-sin-hogar-en-invierno', 'recogidas-de-alimentos'], cat='help')

art('que-donar-a-un-banco-de-alimentos', 'es', 'Qué donar a un banco de alimentos (y qué no)',
    'Los productos que más piden los bancos de alimentos (leche, aceite, conservas, arroz, legumbres), lo que no deben recibir y por qué donar dinero también ayuda.',
    """
! Lo que más piden los bancos de alimentos en España es **leche, aceite, conservas, arroz y legumbres**: productos que no caducan pronto y no necesitan frío. No dones comida fresca ni refrigerada salvo que el punto de recogida tenga cómo guardarla.

## Sí

- Leche (brik) y aceite de oliva o girasol.
- Conservas de pescado, carne y verdura; tomate frito o triturado.
- Arroz, pasta y legumbres, secas o cocidas en bote.
- Cereales y galletas.
- Alimentación infantil y, si la piden, pañales y productos de higiene.

## No

- Comida fresca, carne, pescado o lácteos refrigerados (salvo que el punto lo acepte).
- Productos abiertos, caducados o con el envase dañado.
- Comida casera.

## Dinero, también

Con un donativo económico el banco puede comprar lo que le falta, incluidos productos frescos que casi nunca llegan por donación. Los donativos a la mayoría de entidades sin ánimo de lucro desgravan en la declaración de la renta: guarda el justificante.

## La Gran Recogida

En 2026 la Gran Recogida de FESBAL fue el 13, 14 y 15 de noviembre en supermercados de toda España. Mira [recogidas de alimentos](recogidas-de-alimentos) para las siguientes.

## Bancos de alimentos y comedores de tu ciudad

{{table:volunteer|cc=ES|Ciudad|Comedores y bancos|Página|donar o ayudar}}
""",
    src=[('RFEF: la RFEF y FESBAL refuerzan su compromiso con la Gran Recogida 2026 (4 de noviembre de 2026)', 'https://rfef.es/es/noticias/la-rfef-y-fesbal-refuerzan-su-compromiso-con-la-gran-recogida-de-alimentos-2026'),
         ('Demócrata: Gran Recogida de alimentos, qué donar (14 de noviembre de 2026)', 'https://www.democrata.es/actualidad/gran-recogida-alimentos-donar-este-fin-semana-como-colaborar-en-tu-supermercado/'),
         ('Corresponsables: Gran Recogida 2026 (18 de noviembre de 2026)', 'https://www.corresponsables.com/destacado/gran-recogida-2026-fesbal-pobreza-alimentaria-donacion-alimentos/')],
    faq=[('¿Qué alimentos son los más necesarios?', 'Leche, aceite, conservas, arroz y legumbres, según los bancos de alimentos en la Gran Recogida de 2026.'),
         ('¿Puedo donar comida fresca?', 'Solo si el punto de recogida tiene forma de guardarla en frío. Si no, mejor un donativo: el banco compra con él los frescos.')],
    rel=['recogidas-de-alimentos', 'voluntariado-en-un-comedor-social', 'ayudar-a-una-persona-sin-hogar-en-invierno'], cat='help', alts={'en': 'what-to-donate-food-bank'})

art('ayudar-a-una-persona-sin-hogar-en-invierno', 'es', 'Cómo ayudar a una persona sin hogar en invierno',
    'Qué hacer si ves a alguien durmiendo en la calle con frío: a quién llamar, qué llevarle y cómo hablarle.',
    """
! Si ves a alguien durmiendo en la calle con frío, **pregúntale si está bien y si quiere que llames a servicios sociales de urgencia**: en Madrid el SAMUR Social (91 480 20 20), en Barcelona el CUESB (900 703 030). **Si no responde o parece enfermo, llama al 112.**

## Paso a paso

1. **Acércate con respeto**: preséntate, pregunta su nombre y si necesita algo. Puede que no quiera hablar; respétalo.
2. **Llama a urgencias sociales** con la dirección exacta y una descripción. En invierno muchas ciudades tienen plazas extra: mira [campaña de frío](campana-de-frio-2026-2027).
3. **Si hay riesgo**, llama al 112: alguien que no responde, que tiembla mucho o está mojado y con frío intenso.

## Qué llevarle

- Algo caliente para beber y comida que no haga falta cocinar.
- Calcetines, guantes y gorro: es lo que más se pierde y más se agradece.
- Una manta o saco si no tiene, mejor coordinado con el equipo de calle.
- La dirección del comedor y del albergue más cercanos: SupportNear en su móvil o un [cartel de la ciudad](carteles-imprimibles).

## Ayuda que dura más

- Haz [voluntariado en un comedor](voluntariado-en-un-comedor-social).
- [Dona a un banco de alimentos](que-donar-a-un-banco-de-alimentos) o a una entidad de tu ciudad.
- Si conoces un recurso que no sale en el mapa, [añádelo](anadir-o-corregir-tu-entidad).
""",
    rel=['campana-de-frio-2026-2027', 'voluntariado-en-un-comedor-social', 'que-donar-a-un-banco-de-alimentos'], cat='help', alts={'en': 'help-someone-homeless-winter'})

art('distintivo-supportnear', 'es', 'Distintivo «Estamos en SupportNear» para webs de entidades',
    'Un sello gratuito para la web de tu entidad que enlaza a tu ficha o a tu ciudad en el mapa. Código para copiar y pegar.',
    """
! Si tu entidad sale en SupportNear, puedes poner este sello en tu web. Enlaza a tu ciudad (o a tu ficha) para que quien lo vea encuentre también los demás recursos cercanos.

<p><a href="../"><img src="sello.svg" width="220" height="64" alt="Estamos en SupportNear: ayuda gratis cerca"></a></p>

## Código para copiar

Cambia `madrid` por el nombre de tu ciudad tal como aparece en la dirección de su página.

<pre><code>&lt;a href="https://supportnear.com/c/madrid"&gt;&lt;img src="https://supportnear.com/blog/sello.svg" width="220" height="64" alt="Estamos en SupportNear: ayuda gratis cerca"&gt;&lt;/a&gt;</code></pre>

## ¿Y si no salimos todavía?

[Añade tu entidad](anadir-o-corregir-tu-entidad) a OpenStreetMap: aparece en la siguiente actualización.
""",
    rel=['anadir-o-corregir-tu-entidad', 'kit-bibliotecas'], cat='pro')

art('glosario-recursos-sociales', 'es', 'Glosario de recursos sociales: CSS, CEAS, UTS, SIAD, IMV...',
    'Qué significan las siglas de los servicios sociales en España, explicado en una línea cada una.',
    """
! Cada comunidad llama de una forma distinta a lo mismo. Aquí tienes las siglas más comunes y qué hay detrás.

## Servicios sociales

- **CSS – Centro de Servicios Sociales**: el centro municipal de tu barrio. Primera puerta para casi todo (Madrid y otras ciudades).
- **CEAS – Centro de Acción Social**: el mismo servicio en Castilla y León.
- **UTS – Unidad de Trabajo Social**: la unidad básica de trabajo social en muchos municipios.
- **CUESB**: Centre d'Urgències i Emergències Socials de Barcelona, urgencia social 24 h (900 703 030).
- **SAMUR Social**: urgencia social municipal de Madrid, 24 h (91 480 20 20).
- **Centro de día**: espacio de día para personas sin hogar o mayores: comida, ducha, actividades.
- **Albergue / centro de acogida**: alojamiento temporal.

## Mujeres

- **SIAD – Servei d'Informació i Atenció a les Dones**: atención a mujeres en Cataluña, también ante violencia machista.
- **016**: atención a víctimas de violencia de género, gratis y no deja rastro en la factura.

## Ayudas

- **IMV – Ingreso Mínimo Vital**: ayuda mensual de la Seguridad Social. Mira [cómo pedirlo](ingreso-minimo-vital-como-pedirlo).
- **RMI / renta mínima / renta garantizada**: ayuda de tu comunidad autónoma; el nombre cambia según la comunidad.
- **PNC – Pensión no contributiva**: para mayores de 65 o personas con discapacidad sin cotizaciones suficientes.

## Trámites

- **Padrón / volante de empadronamiento**: prueba de que vives en un municipio. Se puede tener [sin domicilio](empadronarse-sin-domicilio).
- **Cl@ve**: identificación digital para trámites online.
- **CAISS**: oficina de atención de la Seguridad Social.
""",
    rel=['como-funciona-la-ayuda-social-en-espana', 'ingreso-minimo-vital-como-pedirlo', 'empadronarse-sin-domicilio'], cat='pro')
