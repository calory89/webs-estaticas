"""Equipaje de mano por aerolínea (lo usan la herramienta /herramientas/equipaje/ y las fichas de chollo)."""
BAGS = [  # (aerolínea, artículo gratis cm, peso gratis, maleta de cabina cm, precio maleta de cabina) · fuente: Ulysse News 11-feb-2026 y Público 11-ene-2026
    ('Ryanair', (40, 30, 20), '', (55, 40, 20), '6-20 € (Priority)'),
    ('Vueling', (40, 30, 20), '', (55, 40, 20), '10-59 €'),
    ('easyJet', (45, 36, 20), '15 kg', (56, 45, 25), '23-35 €'),
    ('Wizz Air', (40, 30, 20), '10 kg', (55, 40, 23), '10-35 € (Priority)'),
    ('Volotea', (40, 30, 20), '10 kg', (55, 40, 20), '9-30 €'),
    ('Transavia', (40, 30, 20), '10 kg', (55, 40, 25), '23-65 €'),
    ('Norwegian', (40, 30, 20), '10 kg', None, ''),
    ('Eurowings', (40, 30, 25), '', (55, 40, 23), 'incluida en tarifa SMART'),
    ('Iberia Express', (40, 30, 15), '', (56, 40, 25), ''),
    ('Air Europa', (40, 30, 15), '10 kg', (55, 35, 25), 'incluida'),
    ('Air France', (40, 30, 15), '12 kg (total)', (55, 35, 25), 'incluida'),
]
BAG_SRC = [('Ulysse News, 11 feb 2026', 'https://ulysse.com/news/bagages-cabine-europe-norme-40x30x15-2026'), ('Público, 11 ene 2026', 'https://www.publico.es/en-ruta/medidas-equipaje-mano-2026-gratis.html')]


def bag_of(airline):
    """'Wizz Air Malta' -> fila de Wizz Air; None si no la tenemos."""
    a = (airline or '').lower()
    for row in BAGS:
        if row[0].lower() in a or a.startswith(row[0].lower().split()[0]) and len(a) > 3 and row[0].lower().split()[0] in ('ryanair', 'vueling', 'easyjet', 'volotea', 'transavia', 'norwegian', 'eurowings'):
            return row
    return None


def cm(t):
    return '×'.join(str(x) for x in t) + ' cm' if t else ''
