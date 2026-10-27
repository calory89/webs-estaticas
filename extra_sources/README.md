# Fuentes que no son OpenStreetMap

Para los paises y ciudades donde OSM esta vacio (Kiribati, Salomon, Guinea-Bisau,
Samoa, Eritrea...), o donde una entidad publica su propio listado abierto
(ayuntamientos, redes de bancos de alimentos, ACNUR/OIM, Cruz Roja).

Cada fichero es un CSV UTF-8 con estas columnas (las tres primeras obligatorias):

    name,lat,lon,cat,sub,addr,hours,phone,web,operator,for,source,source_url,licence,updated

- cat: food | shelter | hygiene | clothes | social | health | legal | water | warm
- sub: la subcategoria de la app (soup_kitchen, food_bank, shelter, shower, toilets, clothing_bank, ngo, clinic, hospital, legal_aid, drinking_water, warm_place...)
- hours: en formato OpenStreetMap si se puede («Mo-Fr 09:00-13:00»); si no, texto libre
- for: separados por ; (homeless;women;families;migrants;youth)
- licence: debe permitir la reutilizacion (CC0, CC-BY, ODbL, dominio publico). Si no, no se importa.

Se cargan en build.py (bloque «fuentes extra»): se descartan las que ya estan en OSM
a menos de 60 m con el mismo tipo, se les da un id «ext/<fichero>/<fila>» y salen en
la app como cualquier otro sitio, con la fuente en la ficha.

Ficheros:
- plantilla.csv — vacio, con la cabecera.
