# -*- coding: utf-8 -*-
"""Guias por necesidad (1-16), en espanol."""
from articles import art

T = 'table:{need}|cc=ES|Ciudad|Sitios en el mapa|Lista|ver la lista'

art('duchas-gratis', 'es', 'Dónde ducharse gratis: duchas y aseos públicos en España',
    'Dónde hay duchas públicas gratis o baratas en cada ciudad española, qué llevar y qué hacer si no hay ninguna cerca.',
    """
! Las duchas gratis suelen estar en **centros de día para personas sin hogar, albergues y algunos polideportivos y playas**. Casi ninguna de esas duchas está todavía en el mapa abierto: los 379 puntos que salen cerca del centro de las ciudades españolas son sobre todo aseos, y están en solo ocho ciudades. Para una ducha hoy, pregunta en servicios sociales o en un comedor social.

## Dónde suele haber una ducha gratis

- **Centros de día y centros de acogida.** Muchos ofrecen ducha, toalla y a veces lavadora a quien no tiene casa. Suele hacer falta pasar antes por servicios sociales o por el propio centro.
- **Albergues.** Si duermes en uno, puedes ducharte allí. Algunos dejan ducharse sin dormir, a una hora fija.
- **Duchas municipales.** Algunas ciudades mantienen baños o duchas públicas, a veces con una tarifa simbólica.
- **Playas.** Las duchas de playa son gratis, pero solo con agua fría y casi siempre solo en verano.
- **Polideportivos municipales.** Cobran la entrada, pero en algunas ciudades servicios sociales dan bonos gratis.
- **Comedores sociales.** Algunos tienen ducha para sus usuarios; pregúntalo al ir a comer.

## Cuántas hay en tu ciudad

La cifra cuenta duchas y aseos públicos gratuitos a menos de 10 km del centro, del mapa abierto (OpenStreetMap). La lista dice cuáles son duchas y cuáles solo aseos.

{{table:hygiene|cc=ES|Ciudad|Duchas y aseos en el mapa|Lista|ver la lista}}

## Las que tienen nombre en Madrid y Barcelona

{{top:madrid|hygiene|6}}
{{top:barcelona|hygiene|6}}

## Qué llevar

- Toalla pequeña o de microfibra, chanclas y una bolsa para la ropa mojada.
- Jabón y champú: en los centros de día suelen darlos, en una playa no.
- Ropa limpia: si no tienes, pregunta por un ropero en el mismo centro (mira la [guía de ropa](roperos-y-tiendas-solidarias)).

## Si en tu ciudad no sale ninguna

Muchas ciudades tienen duchas para personas sin hogar que nadie ha puesto en el mapa. Pregunta en servicios sociales municipales o en un comedor social: casi siempre saben dónde hay una. Si la encuentras, [añádela al mapa](anadir-o-corregir-tu-entidad) y la verá todo el mundo.
""",
    faq=[('¿Hay duchas públicas gratis en Madrid?', 'Sí, sobre todo en centros de día y de acogida para personas sin hogar. En el mapa salen 48 duchas y aseos públicos a menos de 10 km del centro; la lista con las que tienen nombre está en [duchas en Madrid](../c/madrid-hygiene).'),
         ('¿Me puedo duchar en un albergue sin dormir allí?', 'Depende del albergue. Algunos lo permiten a una hora fija, otros solo a quien duerme. Llama antes o pregunta en servicios sociales.'),
         ('¿Las duchas de la playa son gratis?', 'Sí, pero son de agua fría, al aire libre y casi siempre solo funcionan en temporada de baño.')],
    rel=['fuentes-de-agua-y-aseos-publicos', 'lavar-la-ropa-gratis', 'primeras-24-horas-en-la-calle'], cat='need',
    alts={'en': 'free-showers-near-me', 'fr': 'douches-gratuites'}, cta=('../?need=hygiene', 'Ver duchas en el mapa'))

art('banco-de-alimentos-como-pedir-comida', 'es', 'Cómo pedir comida a un banco de alimentos',
    'Los bancos de alimentos no reparten a particulares: se pide a través de una entidad o de servicios sociales. Qué papeles llevar y dónde están.',
    """
! Los bancos de alimentos de España **no suelen dar comida directamente a particulares**: la reparten a través de entidades (parroquias, Cáritas, Cruz Roja, asociaciones de barrio) y de servicios sociales. Para recibirla, pide cita en servicios sociales de tu ayuntamiento o pregunta en una de esas entidades.

## Los pasos

1. **Pide cita en servicios sociales** de tu ayuntamiento (el centro que te toca por tu dirección o por tu padrón). Si no tienes casa, ve al centro más cercano y explícalo; si no estás empadronado, mira [cómo empadronarte sin domicilio](empadronarse-sin-domicilio).
2. **La trabajadora social valora tu caso** y te deriva a una entidad que reparte alimentos cerca de ti, o te da una tarjeta o vale de compra si tu ayuntamiento los tiene.
3. **La entidad te da un lote** cada semana, cada quince días o cada mes, según el sitio.

Algunas entidades atienden sin derivación, sobre todo parroquias y despensas de barrio. Pregunta directamente en las de tu zona.

## Qué suelen pedir

- Documento de identidad (DNI, NIE o pasaporte; muchas entidades atienden aunque no tengas papeles en regla).
- Volante de empadronamiento.
- Algo que muestre tus ingresos o que no tienes: nómina, prestación, certificado del SEPE o una declaración.
- Libro de familia o documentos de las personas que viven contigo.

## Si necesitas comer hoy

Un banco de alimentos tarda días o semanas. Para comer hoy busca un **comedor social**: dan comida caliente sin trámites o con muy pocos. Mira [comedores sociales abiertos](comedores-sociales-abiertos-hoy).

## Bancos de alimentos y comedores en el mapa

{{table:food|cc=ES|Ciudad|Comedores y bancos en el mapa|Lista|ver la lista}}

Si en tu ciudad sale 0 no es que no haya: es que nadie los ha puesto en el mapa todavía. Servicios sociales tiene la lista completa.
""",
    faq=[('¿Puedo ir directamente al banco de alimentos de mi provincia?', 'Normalmente no: el banco reparte a entidades, no a personas. Te dirán qué entidad te corresponde o te mandarán a servicios sociales.'),
         ('¿Necesito estar empadronado?', 'Para servicios sociales casi siempre sí. Si no tienes domicilio, puedes empadronarte en la dirección que indiquen servicios sociales; lo explica [esta guía](empadronarse-sin-domicilio).'),
         ('¿Cada cuánto dan comida?', 'Depende de la entidad: lo habitual es un lote cada semana, cada quince días o cada mes.')],
    rel=['comedores-sociales-abiertos-hoy', 'que-donar-a-un-banco-de-alimentos', 'como-funciona-la-ayuda-social-en-espana'], cat='need',
    cta=('../?need=food', 'Ver comida gratis en el mapa'))

art('comedores-sociales-abiertos-hoy', 'es', 'Comedores sociales abiertos hoy: de noche y en fin de semana',
    'Dónde comer gratis hoy en tu ciudad, qué comedores abren en fin de semana según su horario, y por qué conviene llamar antes.',
    """
! En un comedor social se come gratis y casi nunca piden papeles. **Llama antes**: de los comedores del mapa en España, muy pocos tienen el horario publicado, y muchos cierran sábados, domingos o en agosto.

## Cómo funciona un comedor social

- Se come a una hora fija (desayuno, comida o cena). Si llegas tarde, puede que no quede.
- Algunos dan bocadillos o comida para llevar en vez de servir mesa.
- Unos piden ir derivado por servicios sociales y otros atienden a cualquiera que llegue. Si es tu primera vez, pregunta en la puerta.

## Comedores en el mapa, ciudad por ciudad

{{table:food|cc=ES|Ciudad|Comedores y bancos en el mapa|Lista|ver la lista}}

## Abren en fin de semana (según su horario)

Estos son los sitios de comida y albergues cuyo horario en el mapa incluye sábado o domingo. Comprueba antes: el horario lo ha puesto un voluntario y puede haber cambiado.

{{weekend:cc=ES|food,shelter}}

## Si hoy no encuentras ninguno

- Llama a servicios sociales de tu ayuntamiento o, en Madrid, al SAMUR Social (91 480 20 20, 24 horas). En Barcelona, el CUESB (900 703 030, gratis, 24 horas).
- Pregunta en una parroquia, en Cáritas o en Cruz Roja: si no tienen comida, saben quién la tiene.
- Mira la [guía de qué abre en fin de semana](abierto-fin-de-semana).
""",
    faq=[('¿Me piden papeles en un comedor social?', 'Casi nunca. Algunos piden ir derivado por servicios sociales, sobre todo los que dan cenas o comidas con plaza fija.'),
         ('¿Abren los domingos?', 'Algunos sí y muchos no. En la lista de arriba están los que, según su horario en el mapa, abren en fin de semana; llama antes para confirmarlo.')],
    rel=['banco-de-alimentos-como-pedir-comida', 'abierto-fin-de-semana', 'comidas-solidarias-navidad'], cat='need',
    alts={'en': 'food-banks-open-today', 'fr': 'ou-manger-gratuitement'}, cta=('../?need=food', 'Ver comida gratis en el mapa'))

art('donde-dormir-esta-noche-albergues', 'es', 'Dónde dormir esta noche: albergues y qué llevar',
    'Cómo conseguir una cama gratis hoy en España: albergues municipales, centros de acogida, campañas de frío y a quién llamar.',
    """
! Para dormir esta noche, **llama o ve a servicios sociales de urgencia de tu ciudad**: son quienes asignan las plazas de albergue. En Madrid es el SAMUR Social (91 480 20 20, 24 h); en Barcelona, el CUESB (900 703 030, gratis, 24 h). En el resto, el 112 te pasa con el servicio de tu municipio.

## Cómo se entra en un albergue

- La mayoría de los albergues municipales no aceptan a quien llega a la puerta: hay que ir **derivado** por servicios sociales o por un equipo de calle.
- Las plazas suelen darse para unos días, con posibilidad de prórroga. A veces hay que volver a pedir plaza cada noche.
- Hay albergues solo para hombres, solo para mujeres, para familias o para jóvenes. Dilo al pedir plaza.
- Muchos cierran por la mañana y hay que salir hasta la tarde: mira [sitios donde estar de día](cargar-el-movil-y-wifi-gratis).

## En invierno hay más plazas

De noviembre a abril muchas ciudades abren plazas extra por el frío. En Madrid, la Campaña del Frío 2026-2027 abre desde la noche del 2 de noviembre hasta la mañana del 16 de abril. Los detalles están en [campaña de frío](campana-de-frio-2026-2027).

## Albergues en el mapa

{{table:shelter|cc=ES|Ciudad|Albergues en el mapa|Lista|ver la lista}}

## Qué llevar

- Documento de identidad, si lo tienes (te atienden igual si no).
- Medicación y recetas.
- Una bolsa pequeña: muchos albergues no dejan entrar con mucho equipaje ni con animales. Pregunta antes si tienes perro.
- El móvil cargado: [dónde cargarlo gratis](cargar-el-movil-y-wifi-gratis).

## Si tienes hijos o estás embarazada

Dilo desde la primera llamada: servicios sociales da prioridad a familias con menores y a mujeres embarazadas, y suele buscar un recurso distinto del albergue general.
""",
    faq=[('¿Puedo presentarme en un albergue sin cita?', 'En la mayoría de los albergues municipales, no: te deriva servicios sociales o un equipo de calle. Algunos albergues de entidades sí atienden sin cita; llama antes.'),
         ('¿Cuántas noches puedo quedarme?', 'Depende del albergue. Es habitual una estancia corta, de unos días a dos semanas, prorrogable. En la Campaña del Frío de Madrid la estancia inicial es de hasta 15 días, prorrogable.'),
         ('¿Admiten perros?', 'Pocos albergues lo permiten. Pregunta al pedir plaza: algunas ciudades tienen plazas con espacio para animales.')],
    rel=['campana-de-frio-2026-2027', 'primeras-24-horas-en-la-calle', 'guia-ayuda-madrid'], cat='need',
    cta=('../?need=shelter', 'Ver albergues en el mapa'))

art('medico-gratis-sin-papeles', 'es', 'Médico gratis en España, también sin papeles',
    'Cómo ser atendido en la sanidad pública aunque no tengas residencia legal: requisitos del Real Decreto 180/2026, papeles y urgencias.',
    """
! **Las urgencias de un hospital público atienden a cualquiera.** Además, desde el Real Decreto 180/2026, de 11 de marzo, las personas extranjeras que viven en España sin residencia legal pueden pedir asistencia sanitaria pública en las mismas prestaciones que el resto, si cumplen tres condiciones.

## Las tres condiciones

Según el Ministerio de Sanidad, hay que cumplir las tres a la vez:

1. No tener obligación de acreditar cobertura sanitaria por otra vía (por ejemplo, por el derecho de la Unión Europea o un convenio).
2. No poder traer la cobertura sanitaria de tu país de origen.
3. Que no haya otra persona o entidad obligada a pagar la atención.

Si vienes de un país con convenio de Seguridad Social que incluye la sanidad (entre otros Argentina, Brasil, Chile, Colombia, Ecuador, Perú, México, Marruecos o Ucrania), te pedirán además un certificado de tu país que diga que no puedes exportar esa cobertura. Pregunta en tu consulado.

## Cómo se pide

1. Ve al **centro de salud** más cercano: el trámite lo lleva cada comunidad autónoma y allí te dicen dónde se hace.
2. Lleva tu **pasaporte** u otro documento oficial con foto.
3. Lleva algo que muestre que **vives en España**: el volante de empadronamiento sirve. Si no lo tienes, valen otros papeles, como la escolarización de tus hijos, un registro de visitas de servicios sociales, facturas a tu nombre o la inscripción consular.
4. Firma una **declaración responsable** (el modelo está en la web del Ministerio).

Desde que entregas la solicitud, la administración tiene que darte un **documento provisional** para que te atiendan mientras decide. Vale en cualquier comunidad. Si en tres meses no hay respuesta, se entiende que te lo han concedido.

## Si necesitas un médico hoy

- **Urgencias de un hospital público**: atienden siempre.
- **Centros de salud y consultorios sociales**: en el mapa salen también clínicas de entidades que atienden gratis.

{{table:health|cc=ES|Ciudad|Hospitales y centros en el mapa|Lista|ver la lista}}

## Empadronarte ayuda

El padrón es la forma más fácil de demostrar que vives aquí. Si no tienes casa, puedes empadronarte en la dirección que indiquen servicios sociales: lo explica [esta guía](empadronarse-sin-domicilio).
""",
    faq=[('¿Me atienden en urgencias sin papeles?', 'Sí. Las urgencias de los hospitales públicos atienden a cualquier persona.'),
         ('¿Necesito estar empadronado para tener médico?', 'El volante de empadronamiento es la prueba más sencilla de que vives en España, pero según el Ministerio de Sanidad se admiten otros documentos si no lo tienes.'),
         ('¿Cuánto tarda?', 'La administración tiene hasta tres meses para resolver, pero desde que entregas la solicitud tiene que darte un documento provisional para que te atiendan.')],
    src=[('Ministerio de Sanidad: acceso universal a la sanidad pública', 'https://www.sanidad.gob.es/ca/profesionales/prestacionesSanitarias/CarteraDeServicios/AccesoUsuariosCS/accesoUniversalSP.htm'),
         ('BOE: Real Decreto 180/2026, de 11 de marzo', 'https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-5714')],
    rel=['tarjeta-sanitaria-paso-a-paso', 'empadronarse-sin-domicilio', 'como-funciona-la-ayuda-social-en-espana'], cat='need',
    alts={'en': 'free-medical-care'}, cta=('../?need=health', 'Ver salud en el mapa'))

art('empadronarse-sin-domicilio', 'es', 'Cómo empadronarse sin domicilio fijo',
    'Sí se puede: las normas del INE obligan a empadronar a quien vive en la calle o en una infravivienda. Dirección, papeles y qué hacer si te lo niegan.',
    """
! **Puedes empadronarte aunque vivas en la calle.** Las instrucciones oficiales del INE dicen que la ausencia total de techo "puede y debe" figurar en el padrón, y que se puede usar como dirección la que indiquen servicios sociales.

## Por qué importa el padrón

El volante de empadronamiento es la llave de casi todo: servicios sociales, médico de cabecera, ayudas como el [Ingreso Mínimo Vital](ingreso-minimo-vital-como-pedirlo), plazas de albergue en algunas campañas y la escuela de tus hijos.

## Qué dicen las normas

Según la Resolución de 17 de febrero de 2020 del INE y de la Dirección General de Cooperación Autonómica y Local (BOE de 2 de mayo de 2020):

- Toda persona que vive en España está obligada a empadronarse en el municipio donde reside habitualmente.
- Las chabolas, caravanas, cuevas e incluso la falta total de techo son domicilios válidos si cabe esperar que una carta te llegue allí.
- Si vives en la calle y servicios sociales te conoce, se puede usar un **domicilio ficticio**: la dirección del propio servicio, de un albergue o del sitio donde sueles dormir.
- Para eso servicios sociales tiene que informar de que vives habitualmente en el municipio, dar la dirección y comprometerse a intentar hacerte llegar las cartas.
- **El ayuntamiento no controla si tu residencia es legal o no.** Su única tarea es comprobar que vives allí.

## Los pasos

1. Ve a **servicios sociales** de tu ayuntamiento y pide que te ayuden a empadronarte. Si duermes en un albergue, pregunta allí primero.
2. Lleva un **documento de identidad en vigor**: DNI, NIE, tarjeta de residencia o pasaporte. También valen otros, como el resguardo de solicitud de protección internacional o la cédula de inscripción.
3. Con el informe de servicios sociales, pide el alta en la **oficina del padrón**.

## Si te lo niegan

- El contrato de alquiler es una forma de demostrar el domicilio, **no un requisito obligatorio**: el ayuntamiento puede aceptar otros documentos o comprobarlo por otros medios.
- Si deniega, tiene que hacerlo por escrito y de forma motivada, y puedes recurrir.
- Si en **tres meses** no te contestan, quedas empadronado desde la fecha de la solicitud (silencio positivo).
- Una entidad de ayuda o el Defensor del Pueblo pueden ayudarte a reclamar.

Esto no es asesoramiento jurídico; tu ayuntamiento puede tener sus propios procedimientos.
""",
    faq=[('¿Puedo empadronarme en un albergue?', 'Sí, si servicios sociales indica esa dirección. Las normas del INE citan expresamente la dirección de un albergue municipal como domicilio posible.'),
         ('¿Me pueden pedir un contrato de alquiler?', 'Es una de las formas de demostrar el domicilio, pero no la única: el ayuntamiento puede aceptar otros documentos o hacer sus propias comprobaciones.'),
         ('¿Y si no tengo papeles en regla?', 'El ayuntamiento no controla la legalidad de tu residencia. Necesitas un documento de identidad en vigor, por ejemplo el pasaporte.')],
    src=[('BOE: Resolución de 17 de febrero de 2020 sobre la gestión del Padrón (texto consolidado)', 'https://boe.es/buscar/pdf/2020/BOE-A-2020-4784-consolidado.pdf'),
         ('Defensor del Pueblo: tramitación de una solicitud de empadronamiento', 'https://www.defensordelpueblo.es/resoluciones/tramitacion-de-una-solicitud-de-empadronamiento')],
    rel=['medico-gratis-sin-papeles', 'ingreso-minimo-vital-como-pedirlo', 'como-funciona-la-ayuda-social-en-espana'], cat='need')

art('ropa-y-panales-para-bebes-gratis', 'es', 'Ropa, pañales y leche para bebés gratis',
    'Dónde conseguir pañales, leche de fórmula y ropa de bebé sin pagar en España: servicios sociales, Cáritas, Cruz Roja, bancos de bebé y roperos.',
    """
! Los pañales, la leche de fórmula y la ropa de bebé se consiguen gratis sobre todo a través de **servicios sociales, Cáritas, Cruz Roja y asociaciones de apoyo a la maternidad**, que muchas veces tienen un "banco de bebé" o ropero infantil.

## Dónde preguntar

- **Servicios sociales de tu ayuntamiento.** Pueden darte una ayuda de emergencia o derivarte a una entidad. Es la vía más segura si necesitas leche de fórmula, que es cara.
- **Cáritas parroquial** y **Cruz Roja**. Muchas sedes reparten pañales y productos de higiene infantil.
- **Asociaciones de apoyo a la maternidad**. Suelen dar canastillas, carritos y ropa de segunda mano.
- **Roperos solidarios** de barrio y parroquias: ropa de bebé y de niño. Mira [roperos y tiendas solidarias](roperos-y-tiendas-solidarias).
- **Centro de salud.** La matrona o el pediatra conocen los recursos de tu zona y pueden orientarte con la lactancia.

## Qué llevar

- Documento de identidad y libro de familia o certificado de nacimiento del bebé.
- Volante de empadronamiento, si lo tienes.

## Servicios sociales y entidades en el mapa

{{table:social|cc=ES|Ciudad|Servicios sociales y entidades en el mapa|Lista|ver la lista}}

Si estás embarazada y no tienes casa, dilo en servicios sociales desde el primer momento: tienes prioridad para un recurso de acogida.
""",
    faq=[('¿Dan leche de fórmula gratis?', 'Algunas entidades sí, pero no siempre la hay. La vía más segura es pedir una ayuda de emergencia en servicios sociales.'),
         ('¿Necesito estar empadronada?', 'Para servicios sociales casi siempre. Las entidades como Cáritas o Cruz Roja suelen atender igualmente.')],
    rel=['roperos-y-tiendas-solidarias', 'banco-de-alimentos-como-pedir-comida', 'como-funciona-la-ayuda-social-en-espana'], cat='need')

art('fuentes-de-agua-y-aseos-publicos', 'es', 'Fuentes de agua potable y aseos públicos gratis',
    'Cuántas fuentes de agua potable hay cerca del centro de cada ciudad española y dónde encontrar un aseo gratis.',
    """
! El mapa abierto tiene **532 fuentes de agua potable** cerca de las 48 ciudades españolas de SupportNear. Abre el mapa, elige "agua" y te enseña las más cercanas a ti, también sin conexión si te has descargado la ciudad.

## Fuentes de agua a menos de 5 km del centro

Cálculo aproximado con los datos abiertos de OpenStreetMap: puntos marcados como agua potable a menos de 5 km del centro de cada ciudad.

{{csvtypes:drinking_water|Ciudad|Fuentes de agua potable}}

## Aseos gratis

- **Aseos públicos municipales**: en el mapa salen como "aseos públicos gratuitos".
- **Bibliotecas, centros cívicos y centros comerciales**: tienen aseos y se puede entrar sin comprar. Mira [sitios donde estar](cargar-el-movil-y-wifi-gratis).
- **Estaciones de tren y autobús**: algunas cobran.
- **Hospitales**: los aseos de la entrada y de urgencias están abiertos.

{{table:hygiene|cc=ES|Ciudad|Duchas y aseos en el mapa|Lista|ver la lista}}

## En verano

Con calor, bebe aunque no tengas sed y busca sombra. Algunas ciudades abren refugios climáticos: mira [la guía del calor](ola-de-calor-refugios-climaticos).
""",
    faq=[('¿Es potable el agua de las fuentes públicas?', 'Las que el mapa marca como agua potable, sí. Si una fuente tiene un cartel de "agua no potable", no bebas.')],
    rel=['duchas-gratis', 'ola-de-calor-refugios-climaticos', 'cargar-el-movil-y-wifi-gratis'], cat='need', cta=('../?need=water', 'Ver agua en el mapa'))

art('cargar-el-movil-y-wifi-gratis', 'es', 'Dónde cargar el móvil y conectarse a wifi gratis',
    'Bibliotecas públicas y centros cívicos: enchufes, wifi gratis, aseos y un sitio donde estar a cubierto. Cuántos hay en cada ciudad española.',
    """
! **Las bibliotecas públicas** son el mejor sitio para cargar el móvil y conectarte gratis: tienen wifi, enchufes, aseos y calefacción, y no hace falta comprar nada. El carné de biblioteca pública es gratuito.

## Dónde más

- **Centros cívicos y culturales** municipales: wifi, aseos y a veces enchufes en las salas comunes.
- **Centros de día** para personas sin hogar: suelen tener enchufes y a veces ordenadores.
- **Estaciones de tren y aeropuertos**: tienen puntos de carga, aunque a veces vigilan a quien se queda mucho rato.
- **Comedores sociales**: pregunta si puedes cargar el móvil mientras comes.

## Bibliotecas y centros cívicos en el mapa

{{table:warm|cc=ES|Ciudad|Sitios donde estar en el mapa|Lista|ver la lista}}

## Consejos

- Lleva el cargador y un cable largo: los enchufes libres suelen estar lejos de las mesas.
- Activa el ahorro de batería y descárgate el mapa de tu ciudad en SupportNear: así funciona sin datos. Mira [cómo usarlo sin cobertura](../instalar).
- Guarda en papel los teléfonos importantes por si te quedas sin batería.
""",
    faq=[('¿Me pueden echar de una biblioteca?', 'Las bibliotecas son públicas y cualquiera puede estar en ellas respetando sus normas de silencio y horario.'),
         ('¿Necesito el carné para usar el wifi?', 'En muchas bibliotecas sí, y el carné es gratuito. Pídelo en el mostrador con tu documento de identidad.')],
    rel=['donde-guardar-tus-cosas', 'primeras-24-horas-en-la-calle', 'kit-bibliotecas'], cat='need', cta=('../?need=warm', 'Ver sitios donde estar'))

art('donde-guardar-tus-cosas', 'es', 'Dónde guardar tus cosas si vives en la calle',
    'Consignas, taquillas y otras formas de no perder documentos y pertenencias cuando no tienes casa.',
    """
! Lo más importante que guardar son **los documentos**. Pregunta en servicios sociales, en tu albergue o en un centro de día: muchos guardan papeles y una bolsa pequeña a quien atienden. Haz fotos de todos tus documentos y mándatelas a tu correo.

## Opciones

- **Centros de día y albergues.** Algunos tienen taquillas o guardan una bolsa durante el día.
- **Servicios sociales.** Pueden guardar copias de tus documentos o ser tu dirección postal, lo que también sirve para [empadronarte](empadronarse-sin-domicilio).
- **Consignas de estaciones.** Son de pago y por horas o días.
- **Una persona de confianza.** Para lo que no necesitas a diario.

## Protege tus documentos

- Haz una foto de tu DNI, NIE o pasaporte, de tus recetas y de cualquier papel de servicios sociales, y guárdala en tu correo o en la nube.
- Lleva los originales en una bolsa estanca, pegados al cuerpo.
- Si pierdes el DNI o el pasaporte, denúncialo en la policía: el justificante de la denuncia te sirve mientras sacas otro.
""",
    rel=['primeras-24-horas-en-la-calle', 'cargar-el-movil-y-wifi-gratis', 'empadronarse-sin-domicilio'], cat='need')

art('tarjeta-sanitaria-paso-a-paso', 'es', 'Cómo conseguir la tarjeta sanitaria paso a paso',
    'Cómo tener médico de cabecera en España: empadronamiento, centro de salud y qué hacer si no tienes papeles o no tienes casa.',
    """
! Para tener médico de cabecera, **empadrónate y pide la tarjeta sanitaria en el centro de salud** que te corresponde por tu dirección. Si no tienes residencia legal, el trámite es otro y está explicado en [médico gratis sin papeles](medico-gratis-sin-papeles).

## Los pasos

1. **Empadrónate.** Si no tienes casa, mira [cómo empadronarte sin domicilio](empadronarse-sin-domicilio).
2. **Si trabajas o has trabajado**, la Seguridad Social reconoce tu derecho a la asistencia; si no, también puedes tenerlo como residente. En el centro de salud te dicen qué papel hace falta.
3. **Ve al centro de salud** con tu documento de identidad y el volante de empadronamiento y pide la tarjeta sanitaria y médico de cabecera.
4. Mientras llega la tarjeta, te dan un documento provisional para que te atiendan.

## Mientras tanto

- **Urgencias** de un hospital público atienden a cualquiera.
- Algunas entidades tienen consultas gratuitas; salen en el mapa como "atención sanitaria social" o "clínica".
""",
    rel=['medico-gratis-sin-papeles', 'empadronarse-sin-domicilio', 'como-funciona-la-ayuda-social-en-espana'], cat='need')

art('ingreso-minimo-vital-como-pedirlo', 'es', 'Ingreso Mínimo Vital: quién puede pedirlo y cómo',
    'Requisitos de edad, cuánto se cobra en 2026 (733,60 € al mes para una persona sola) y las tres formas de pedirlo, también sin Cl@ve.',
    """
! El Ingreso Mínimo Vital (IMV) es una ayuda mensual de la Seguridad Social para personas y familias sin ingresos suficientes. **En 2026, una persona sola tiene garantizados 733,60 € al mes**; se cobra la diferencia entre esa cantidad y lo que ya ingresas.

## Quién puede pedirlo

- **Una persona sola** de al menos 23 años que no viva en pareja ni con familiares.
- **De 18 a 22 años**, si vienes de un centro de protección de menores o eres huérfano absoluto.
- **Víctimas de violencia de género o de trata**, sin requisito de edad.
- **Una familia o unidad de convivencia**: la pide un titular de al menos 23 años (o mayor de edad con hijos a cargo) y la firman todos los adultos.

Además hay requisitos de residencia legal en España y, en algunos casos, de haber vivido de forma independiente un tiempo. Compruébalos en [imv.seg-social.es](https://imv.seg-social.es/) antes de pedirlo.

## Cuánto se cobra en 2026

- Persona sola: hasta 733,60 € al mes.
- Por cada persona más en casa, un 30 % más, hasta un máximo de 1.613,92 € al mes para cinco o más.
- Más complementos por hijos (de 57,50 € a 115 € al mes por menor, según la edad), por familia monoparental o por discapacidad.

## Cómo pedirlo

1. **Por internet con Cl@ve o certificado**, en la sede electrónica de la Seguridad Social.
2. **Por internet sin Cl@ve**, con el formulario de [imv.seg-social.es](https://imv.seg-social.es/): piden una foto y un correo electrónico.
3. **En persona**, en un CAISS (centro de atención de la Seguridad Social), con cita.

Información gratuita en el teléfono **020**. Servicios sociales y muchas entidades ayudan a rellenarlo.

## Si no tienes casa

Para pedirlo necesitas demostrar tu residencia: el volante de empadronamiento es lo habitual. Mira [cómo empadronarte sin domicilio](empadronarse-sin-domicilio).
""",
    faq=[('¿Cuánto es el Ingreso Mínimo Vital en 2026?', 'Para una persona sola, la renta garantizada es de 733,60 € al mes. Se cobra la diferencia entre esa cantidad y tus ingresos.'),
         ('¿Puedo pedirlo sin Cl@ve?', 'Sí, con el formulario de imv.seg-social.es o en persona en un CAISS.'),
         ('¿Desde qué edad?', 'En general desde los 23 años; de 18 a 22 si vienes de un centro de protección o eres huérfano absoluto, y sin edad mínima si eres víctima de violencia de género o de trata.')],
    src=[('La Moncloa: ¿Qué es el Ingreso Mínimo Vital y cómo puedo solicitarlo?', 'https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/inclusion/paginas/2023/030323-que-es-ingreso-minimo-vital-imv.aspx'),
         ('Seguridad Social: portal del IMV', 'https://imv.seg-social.es/')],
    rel=['empadronarse-sin-domicilio', 'que-ayuda-puedo-pedir', 'como-funciona-la-ayuda-social-en-espana'], cat='need')

art('primeras-24-horas-en-la-calle', 'es', 'Si te has quedado en la calle hoy: las primeras 24 horas',
    'Lista corta y práctica: a quién llamar, dónde dormir, comer y ducharte hoy, y qué hacer mañana para salir de la calle.',
    """
! **Hoy:** llama a servicios sociales de urgencia (en Madrid SAMUR Social 91 480 20 20; en Barcelona CUESB 900 703 030; en el resto, el 112 te pasa con tu municipio) y pide plaza para dormir. **Mañana:** pide cita en servicios sociales de tu ayuntamiento.

## Hoy

1. **Dónde dormir.** Llama a servicios sociales de urgencia y pide plaza en un albergue. Mira [albergues](donde-dormir-esta-noche-albergues).
2. **Dónde comer.** Busca el comedor social más cercano en el mapa. Mira [comedores](comedores-sociales-abiertos-hoy).
3. **Dónde estar de día.** Bibliotecas y centros cívicos: calefacción, aseos y enchufes. Mira [sitios donde estar](cargar-el-movil-y-wifi-gratis).
4. **Tus documentos.** Hazles una foto y mándatela al correo. Mira [dónde guardar tus cosas](donde-guardar-tus-cosas).
5. **El móvil.** Abre SupportNear y descarga tu ciudad: funciona sin datos.

## Mañana

1. Pide cita en **servicios sociales** de tu ayuntamiento.
2. Si no estás empadronado, pide ayuda para [empadronarte sin domicilio](empadronarse-sin-domicilio).
3. Pregunta por el [Ingreso Mínimo Vital](ingreso-minimo-vital-como-pedirlo) y por las ayudas de tu comunidad.
4. Si tienes un problema de salud, ve a tu centro de salud o mira [médico gratis](medico-gratis-sin-papeles).

## Si hay peligro

> Si alguien corre peligro, llama al 112. Es gratis y funciona sin saldo y sin cobertura de tu compañía.

## Imprime esta guía

Esta página se imprime en una hoja. También hay [carteles por ciudad](carteles-imprimibles) para dejar en un centro o una biblioteca.
""",
    rel=['donde-dormir-esta-noche-albergues', 'comedores-sociales-abiertos-hoy', 'como-funciona-la-ayuda-social-en-espana'], cat='need')

art('lavar-la-ropa-gratis', 'es', 'Dónde lavar la ropa gratis',
    'Lavanderías sociales, centros de día y albergues con lavadora: dónde preguntar para lavar la ropa sin pagar.',
    """
! Para lavar la ropa gratis pregunta en **centros de día para personas sin hogar, albergues y algunas entidades** (Cáritas, Cruz Roja, parroquias): muchos tienen lavadora o una lavandería social con turnos.

## Dónde preguntar

- **Centros de día**: suelen tener ducha y lavadora en el mismo sitio. Pide turno.
- **Albergues**: lavan la ropa de quien duerme allí.
- **Lavanderías sociales** de entidades: algunas ciudades tienen proyectos que lavan gratis o a precio simbólico.
- **Servicios sociales**: pueden darte un vale para una lavandería de autoservicio.

## Si no hay lavadora

- Lava a mano en una ducha con jabón y tiende en un sitio ventilado.
- Pide ropa limpia en un ropero: mira [roperos y tiendas solidarias](roperos-y-tiendas-solidarias).

Si conoces una lavandería social que no sale en el mapa, [añádela](anadir-o-corregir-tu-entidad).
""",
    rel=['duchas-gratis', 'roperos-y-tiendas-solidarias', 'primeras-24-horas-en-la-calle'], cat='need')

art('ayuda-mayores-y-discapacidad', 'es', 'Ayuda para personas mayores y con discapacidad',
    'Centros de día, servicios sociales y entidades para personas mayores o con discapacidad: a quién pedir ayuda y qué hay en tu ciudad.',
    """
! La puerta de entrada es **servicios sociales de tu ayuntamiento**: gestionan la ayuda a domicilio, la teleasistencia, los centros de día y la valoración de la dependencia y de la discapacidad.

## Qué se puede pedir

- **Valoración de dependencia**: da derecho a ayuda a domicilio, centro de día o una prestación económica.
- **Certificado de discapacidad**: lo da tu comunidad autónoma y abre descuentos y ayudas.
- **Teleasistencia**: un botón para pedir ayuda desde casa.
- **Centros de día** para mayores: comida, actividades y compañía.
- **Comida a domicilio** en algunos municipios.

## Centros de día y servicios sociales en el mapa

{{typecount:cc=ES|social|Centro de día|Ciudad|Centros de día en la lista|Lista|ver la lista}}

{{table:social|cc=ES|Ciudad|Servicios sociales y entidades|Lista|ver la lista}}

## En Badalona

Mira la [guía de Badalona](ayuda-social-badalona): comida, servicios sociales y atención a personas mayores.
""",
    rel=['ayuda-social-badalona', 'como-funciona-la-ayuda-social-en-espana', 'glosario-recursos-sociales'], cat='need')

art('roperos-y-tiendas-solidarias', 'es', 'Roperos y tiendas solidarias: ropa gratis o barata',
    'Diferencia entre un ropero (ropa gratis) y una tienda solidaria (barata, no gratis), y dónde pedir ropa sin pagar.',
    """
! **Un ropero da ropa gratis**, normalmente a quien va derivado por servicios sociales o por la propia entidad. **Una tienda solidaria la vende barata**, y lo que gana va a un proyecto social. SupportNear solo pone en el mapa los roperos gratuitos.

## Dónde pedir ropa gratis

- **Cáritas parroquial** y **Cruz Roja**: muchos tienen ropero, con cita.
- **Centros de día y albergues**: dan ropa de abrigo, sobre todo en invierno.
- **Servicios sociales**: te derivan al ropero de tu zona.
- **Roperos de barrio y redes de apoyo mutuo**.

## Qué hay en el mapa

En España casi ningún ropero está marcado todavía en el mapa abierto. Si conoces uno, [añádelo](anadir-o-corregir-tu-entidad): con dos minutos lo verá cualquiera que lo busque.

## Ropa de abrigo en invierno

Si duermes en la calle y no tienes abrigo, pide un saco o una manta al equipo de calle de tu ciudad o en el albergue. Mira [campaña de frío](campana-de-frio-2026-2027).
""",
    rel=['ropa-y-panales-para-bebes-gratis', 'lavar-la-ropa-gratis', 'anadir-o-corregir-tu-entidad'], cat='need')
