"""Nombres en inglés de destinos y ciudades de salida (los usan gen_deals, gen_en y gen_routes)."""
import re
import unicodedata

NAMES = {'lisboa': 'Lisbon', 'oporto': 'Porto', 'londres': 'London', 'edimburgo': 'Edinburgh', 'dublin': 'Dublin', 'paris': 'Paris', 'niza': 'Nice', 'roma': 'Rome', 'milan': 'Milan',
         'venecia': 'Venice', 'florencia': 'Florence', 'bolonia': 'Bologna', 'napoles': 'Naples', 'palermo': 'Palermo', 'cerdena': 'Sardinia', 'malta': 'Malta', 'atenas': 'Athens',
         'santorini': 'Santorini', 'mykonos': 'Mykonos', 'creta': 'Crete', 'chipre': 'Cyprus', 'dubrovnik': 'Dubrovnik', 'amsterdam': 'Amsterdam', 'bruselas': 'Brussels', 'brujas': 'Bruges',
         'berlin': 'Berlin', 'hamburgo': 'Hamburg', 'munich': 'Munich', 'zurich': 'Zurich', 'viena': 'Vienna', 'salzburgo': 'Salzburg', 'praga': 'Prague', 'budapest': 'Budapest',
         'cracovia': 'Krakow', 'varsovia': 'Warsaw', 'belgrado': 'Belgrade', 'bucarest': 'Bucharest', 'sofia': 'Sofia', 'estambul': 'Istanbul', 'copenhague': 'Copenhagen', 'oslo': 'Oslo',
         'estocolmo': 'Stockholm', 'helsinki': 'Helsinki', 'tallin': 'Tallinn', 'riga': 'Riga', 'vilna': 'Vilnius', 'reikiavik': 'Iceland', 'madeira': 'Madeira', 'azores': 'The Azores',
         'tenerife': 'Tenerife', 'marrakech': 'Marrakesh', 'fez': 'Fez', 'el-cairo': 'Cairo', 'zanzibar': 'Zanzibar', 'mauricio': 'Mauritius', 'sal': 'Sal Island', 'ciudad-del-cabo': 'Cape Town',
         'hong-kong': 'Hong Kong', 'kuala-lumpur': 'Kuala Lumpur', 'manila': 'Manila', 'dubai': 'Dubai', 'maldivas': 'The Maldives', 'sri-lanka': 'Sri Lanka', 'bangkok': 'Bangkok',
         'phuket': 'Phuket', 'hanoi': 'Vietnam', 'singapur': 'Singapore', 'bali': 'Bali', 'seul': 'Seoul', 'tokio': 'Tokyo', 'kioto': 'Kyoto', 'nueva-york': 'New York', 'miami': 'Miami',
         'los-angeles': 'Los Angeles', 'san-francisco': 'San Francisco', 'portland': 'Portland', 'las-vegas': 'Las Vegas', 'cancun': 'Cancun', 'ciudad-de-mexico': 'Mexico City',
         'la-habana': 'Havana', 'punta-cana': 'Punta Cana', 'bogota': 'Bogota', 'lima': 'Peru', 'rio-de-janeiro': 'Rio de Janeiro', 'buenos-aires': 'Buenos Aires'}

CITY_EN = {'Sevilla': 'Seville', 'Lisboa': 'Lisbon', 'Londres': 'London', 'París': 'Paris', 'Roma': 'Rome', 'Milán': 'Milan', 'Venecia': 'Venice', 'Florencia': 'Florence',
           'Nápoles': 'Naples', 'Atenas': 'Athens', 'Bruselas': 'Brussels', 'Múnich': 'Munich', 'Viena': 'Vienna', 'Praga': 'Prague', 'Varsovia': 'Warsaw', 'Cracovia': 'Krakow',
           'Copenhague': 'Copenhagen', 'Estocolmo': 'Stockholm', 'Estambul': 'Istanbul', 'Fráncfort': 'Frankfurt', 'Ginebra': 'Geneva', 'Nueva York': 'New York',
           'Ciudad de México': 'Mexico City', 'Filadelfia': 'Philadelphia', 'Sídney': 'Sydney', 'Pekín': 'Beijing', 'Seúl': 'Seoul', 'Tokio': 'Tokyo', 'Singapur': 'Singapore',
           'Dubái': 'Dubai', 'Abu Dabi': 'Abu Dhabi', 'El Cairo': 'Cairo', 'Johannesburgo': 'Johannesburg', 'Río de Janeiro': 'Rio de Janeiro', 'Santiago de Chile': 'Santiago',
           'Ámsterdam': 'Amsterdam', 'Berlín': 'Berlin', 'Dublín': 'Dublin', 'Edimburgo': 'Edinburgh', 'Oporto': 'Porto', 'Bogotá': 'Bogota', 'Samarcanda': 'Samarkand',
           'Ciudad Ho Chi Minh': 'Ho Chi Minh City', 'Taipéi': 'Taipei', 'Yakarta': 'Jakarta', 'La Habana': 'Havana', 'Marrakech': 'Marrakesh', 'Isla Mauricio': 'Mauritius', 'Los Ángeles': 'Los Angeles'}


def city_en(c):
    return CITY_EN.get(c, c)
