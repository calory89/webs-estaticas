import urllib.parse, hashlib
import json, re, math, os, io
from collections import Counter, defaultdict

CATIDS = ['food','shelter','hygiene','clothes','social','legal','health','water','warm']
SKIP_SF = {'nursing_home','assisted_living','retirement_home','hospice','workshop','group_home'}
HINT = [
 (re.compile(r'comedor|menjador|banco de alimentos|banc dels aliments|food bank|reparto de alimento|economato|olla solidaria|nevera solidaria',re.I),'food'),
 (re.compile(r'albergue|acogida|acollida|pernocta|baja exigencia|centro de noche|refugio',re.I),'shelter'),
 (re.compile(r'ropero|roper[ií]a|guardarropa|vestuario solidario',re.I),'clothes'),
 (re.compile(r'ducha|dutxa|higiene|aseo',re.I),'hygiene'),
 (re.compile(r'orientaci[oó]n jur|asistencia jur[ií]dica|colegio de abogados|turno de oficio|saier',re.I),'legal'),
]
PUBHEALTH = re.compile(r'centro de salud|centre de salut|centro de sa[uú]de|ambulatori|consultorio|\bcap\b|'
 r'm[ée]dicos del mundo|cruz roja|centro sanitario|osasun|centro m[ée]dico municipal',re.I)
FREELEGAL = re.compile(r'colegio de abogados|gratuit|orientaci[oó]n jur|turno de oficio|saier|'
 r'servicio de atenci[oó]n a (inmigrantes|refugiad)|asistencia jur[ií]dica',re.I)
# Nombres que dicen por si solos que ahi no atienden a nadie que lo necesite.
# Agrupado por motivo para que se pueda discutir cada linea por separado.
NOTHELP = re.compile(u'|'.join([
    # colegios profesionales, gestorias y demas oficinas de pago
    u'colegio de notari', u'col[\u00b7.]?legi de notari', u'colegio oficial', u'colegio profesional',
    u'c[\u00e1a]mara de comercio', u'colegio de m[\u00e9e]dicos', u'colegio de arquitect',
    u'notar[\u00eda]a', u'gestor[\u00eda]a', u'academia', u'autoescuela', u'inmobiliaria',
    # ocio y clubes: local privado, no un sitio donde te atienden si no eres de la casa
    u'club deportivo', u'centro cultural', u'casino', u'c[\u00edi]rculo', u'ateneo',
    u'sociedad recreativa', u'sindicato', u'partido ', u'ej[\u00e9e]rcito', u'militar',
    u'club social', u'pe[\u00f1n]a ', u'cofrad', u'colegio mayor', u'residencia de estudiantes',
    u'american legion', u'royal canadian legion', u'amvets', u'vfw post',
    u'veterans of foreign wars', u'elks lodge', u'moose lodge', u'odd fellows',
    u'knights of columbus', u'masonic', u'freemason', u'rotary club', u'lions club',
    u'club de leones', u'kiwanis',
    u'hogar del (pensionista|jubilado)', u'llar del (pensionista|jubilat)', u'centro de mayores',
    u'casa de la cultura', u'casa de cultura', u'casa de la juventud',
    # animales: bancos de comida y refugios para mascotas
    u'veterinari', u'protectora de animales', u'refugio de fauna', u'tiertafel', u'tierheim',
    u'tierschutz', u'dierenasiel', u'schronisko dla zwierz', u'animal shelter', u'animal rescue',
    u'pet food', u'humane society', u'soci[e\u00e9]t[e\u00e9] protectrice des animaux',
    # refugios que no son de personas
    u'refugio de monta', u'refugio antia[\u00e9e]reo',
    # sitios cerrados: mandar a alguien sin techo a una puerta tapiada es peor que no decir nada
    u'^former ', u'^antiguo ', u'^antigua ', u'^ex-', u'desaparecid',
    u'\\(cerrado\\)', u'\\(closed\\)', u'\u5ec3\u696d', u'\u9589\u5e97', u'\\(\u8de1\\)',
]), re.I)
AIDORG = re.compile(r'social|ayuda|solidari|acogida|acollida|inmigra|immigra|refugiad|refugee|sin hogar|'
 r'sinhogar|exclusi|infancia|menores|mujer|dona |discapac|voluntari|asistencia|humanitari|alimento|'
 r'c[áa]ritas|caritas|cruz roja|creu roja|pobreza|vivienda|habitatge|adicc|drogodepend|salud mental|'
 r'integraci|inserci|acompa[ñn]amiento|emergencia|red cross|charity|aid|relief|ong|fundaci[oó]n|'
 r'asociaci[oó]n|associaci[oó]',re.I)
TOURIST = re.compile(r'juvenil|juventud|peregrin|camino de santiago|tur[ií]stic|scout|monta[ñn]|hostel|'
 r'casa rural|camping|alberg de|xarxa',re.I)
SENIORCARE = re.compile(r'senior|child|juvenile|disabled',re.I)

def txt(g): return (g.get('name') or '')+' '+(g.get('operator') or '')+' '+(g.get('description') or '')
def hint(g):
    t=txt(g)
    if not t.strip(): return None
    for r,c in HINT:
        if r.search(t): return c
    return None
def anchored(g):
    if g.get('social_facility') or g.get('social_facility:for'): return True
    if g.get('amenity') in ('social_facility','social_centre','community_centre'): return True
    if g.get('office') in ('ngo','association','charity','government'): return True
    if g.get('shop')=='charity': return True
    return bool(re.search(r'c[áa]ritas|caritas|cruz roja|creu roja|red cross|banco de alimentos|'
        r'banc dels aliments|ayuntamiento|ajuntament|cabildo|diputaci|generalitat|junta de|consell|'
        r'fundaci|asociaci|associaci|parroquia|obra social|san juan de dios|mensajeros de la paz|'
        r'arrels|provivienda|accem|cepaim|m[ée]dicos del mundo|save the children|unicef|acnur|'
        r'municipal|servicios sociales|serveis socials', txt(g), re.I))

REJECT_T = {'hostel','hotel','guest_house','motel','apartment','apartments','chalet','alpine_hut',
 'wilderness_hut','camp_site','caravan_site','museum','attraction','theme_park','zoo','gallery',
 'information','viewpoint','picnic_site','artwork'}
REJECT_A = {'animal_shelter','recycling','restaurant','bar','cafe','fast_food','pub','fuel','parking',
 'parking_space','bicycle_parking','school','kindergarten','college','university','place_of_worship',
 'bank','atm','pharmacy','police','fire_station','post_office','townhall','marketplace','theatre',
 'cinema','nightclub','car_wash','vending_machine','waste_disposal','bench','shelter','fountain',
 'grave_yard','driving_school','music_school','childcare','prison','courthouse','veterinary'}

# Nombres que delatan un bano de pago o una piscina, no una ducha gratis.
# El sufijo japones 湯 es un sento: se paga sobre 500 yenes, y en OSM la mitad
# estan puestos como 'shower'.
POOLNAME = re.compile(r'pool|piscin|schwimmbad|zwembad|nataci[óo]n|zona de bany|banys|プール|温泉|銭湯|サウナ|湯$|の湯|spa\b|thermal|termas|balneari|hammam|حمام', re.I)

PRIVATEOP = re.compile(r'private practice|private institution|private limited|pvt\.? ?ltd', re.I)

FREESOCIAL = re.compile(u'social|humanit|refug|migra|solidar|caritas|croix|cruz|crescent|red cross|secours|entraide|welfare|relief|orphan|women|femme|mujer|jeun|youth|handicap|disab|sida|hiv|ong\b|ngo\b|asbl|assoc', re.I)

def classify(g):
    sf=g.get('social_facility'); am=g.get('amenity'); sh=g.get('shop'); of=g.get('office')
    if sf in SKIP_SF: return None
    if not am and not sf and not sh and not of and any(k.startswith('disused:') or k.startswith('was:') for k in g):
        return None
    if NOTHELP.search(txt(g)): return None
    who=g.get('social_facility:for','')
    if 'animal' in who: return None            # bancos de comida para mascotas
    if sf=='day_care' and SENIORCARE.search(who) and 'homeless' not in who: return None
    if g.get('tourism') in REJECT_T and not sf: return None
    if am in REJECT_A: return None
    if am in ('drinking_water','water_point'): return 'water'
    # En el Sahel y el Cuerno de Africa el agua no es una fuente: es un pozo o un
    # grifo publico. Sin esto, las 39 ciudades sin ningun sitio seguian a cero.
    if g.get('man_made') in ('water_well','water_tap') and g.get('drinking_water')!='no' \
       and g.get('access') not in ('private','no'): return 'water'
    if am=='health_post' or g.get('healthcare') in ('health_post','dispensary'): return 'health'
    if of in ('charity','association') and (sf or FREESOCIAL.search(txt(g))): return 'social'
    if sf in ('soup_kitchen','food_bank') or am in ('food_sharing','give_box'): return 'food'
    if sf in ('shelter','night_shelter','emergency_shelter') or am=='refugee_site': return 'shelter'
    # La app promete ducha GRATIS. Un "public_bath" casi siempre se paga: sento
    # japones, hammam, piscina municipal. Solo entra si OSM dice que no se cobra
    # o si es un servicio social. Y una ducha con precio tampoco es gratis.
    fee = (g.get('fee') or '').strip().lower()
    paid = fee not in ('', 'no', 'yes') or fee == 'yes'
    if am == 'shower' or sf == 'hygiene':
        if sf == 'hygiene': return 'hygiene'
        if paid: return None
        if POOLNAME.search(g.get('name','')) and fee != 'no': return None
        if g.get('bath:type') in ('sento','onsen','foot_bath'): return None
        return 'hygiene'
    if am == 'public_bath':
        if POOLNAME.search(g.get('name','')): return None
        if g.get('bath:type') in ('foot_bath','onsen'): return None
        if fee == 'no' or sf or g.get('social_facility:for'): return 'hygiene'
        return None
    if sf=='clothing_bank': return 'clothes'
    if anchored(g):
        h=hint(g)
        if h=='shelter' and TOURIST.search(txt(g)): h=None
        if h:
            if h=='legal' and of=='lawyer' and not FREELEGAL.search(txt(g)): return None
            return h
    if am=='toilets': return 'hygiene'
    if sh=='charity': return 'clothes'
    if of=='lawyer': return 'legal' if FREELEGAL.search(txt(g)) else None
    if g.get('government')=='social_welfare': return 'legal'
    # Un hospital privado no es ayuda gratuita. OSM lo dice de dos maneras: con
    # operator:type, y poniendo 'private' en el operador. Se buscan formas
    # concretas, no la palabra suelta: 'Private Voluntary Organisation' es una ONG.
    if g.get('operator:type') in ('private','business') and not sf: return None
    _op = (g.get('operator') or '').strip().lower()
    if not sf and (_op == 'private' or PRIVATEOP.search(_op)): return None
    if am=='hospital': return 'health'
    if g.get('healthcare')=='centre' or am in ('clinic','doctors') or sf in ('healthcare','ambulatory_care'):
        if sf or g.get('healthcare')=='centre' or PUBHEALTH.search(txt(g)): return 'health'
        return None
    if of=='ngo' and not AIDORG.search(txt(g)): return None
    if sf in ('outreach','day_care') or of=='ngo' or am in ('social_centre','social_facility'): return 'social'
    if am in ('library','community_centre'): return 'warm'
    return None

def subkey(g,cat):
    k = g.get('social_facility') or ('charity' if g.get('shop')=='charity' else '') or g.get('office') \
        or ('centre' if g.get('healthcare')=='centre' and not g.get('amenity') else '') \
        or g.get('amenity') or 'social_facility'
    if g.get('healthcare')=='centre' and k in ('social_facility','clinic','doctors','centre'): k='health_centre'
    if cat in ('food','shelter','clothes') and k in ('social_facility','','ngo','community_centre','social_centre'):
        k = {'food':'soup_kitchen','shelter':'shelter','clothes':'clothing_bank'}[cat]
    return k

def r5(x): return round(float(x),5)
def coord(el):
    if el.get('lat') is not None: return el['lat'], el['lon']
    c=el.get('center')
    return (c['lat'],c['lon']) if c else (None,None)
def hav(a,b,c,d):
    R=6371000.0;p=math.pi/180
    x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*R*math.asin(math.sqrt(x))

WORLD = [
 ("London","United Kingdom",51.5074,-0.1278,"London"),
 ("Paris","France",48.8566,2.3522,"Paris"),
 ("New York","United States",40.7128,-74.0060,"NewYork"),
 ("Mexico City","México",19.4326,-99.1332,"MexicoCity"),
 ("Buenos Aires","Argentina",-34.6037,-58.3816,"BuenosAires"),
 ("Bogotá","Colombia",4.7110,-74.0721,"Bogota"),
 ("Cairo · القاهرة","Egypt",30.0444,31.2357,"Cairo"),
 ("Casablanca · الدار البيضاء","Maroc",33.5731,-7.5898,"Casablanca"),
 ("Kyiv · Київ","Ukraine",50.4501,30.5234,"Kyiv"),
 ("Lisboa","Portugal",38.7223,-9.1393,"Lisbon"),
 ("Berlin","Deutschland",52.5200,13.4050,"Berlin"),
 ("Roma","Italia",41.9028,12.4964,"Rome"),
 ("Αθήνα · Athens","Greece",37.9838,23.7275,"Athens"),
 ("Warszawa · Warsaw","Polska",52.2297,21.0122,"Warsaw"),
 ("İstanbul","Türkiye",41.0082,28.9784,"Istanbul"),
 ("Nairobi","Kenya",-1.2864,36.8172,"Nairobi"),
 ("Johannesburg","South Africa",-26.2041,28.0473,"Johannesburg"),
 ("São Paulo","Brasil",-23.5505,-46.6333,"SaoPaulo"),
 ("Lima","Perú",-12.0464,-77.0428,"Lima"),
 ("București","România",44.4268,26.1025,"Bucharest"),
 ("Москва · Moscow","Россия",55.7558,37.6173,"Moscow"),
 ("Rio de Janeiro","Brasil",-22.9068,-43.1729,"RioDeJaneiro"),
 ("کراچی · Karachi","پاکستان",24.8607,67.0011,"Karachi"),
 ("تهران · Tehran","ایران",35.6892,51.3890,"Tehran"),
 ("Dakar","Sénégal",14.7167,-17.4677,"Dakar"),
 ("Bamako","Mali",12.6392,-8.0029,"Bamako"),
 ("Delhi · दिल्ली","India",28.6139,77.2090,"Delhi"),
 ("Manila","Philippines",14.5995,120.9842,"Manila"),
 ("Lagos","Nigeria",6.5244,3.3792,"Lagos"),
 ("मुंबई · Mumbai","India",19.0760,72.8777,"Mumbai"),
 ("কলকাতা · Kolkata","India",22.5726,88.3639,"Kolkata"),
 ("ঢাকা · Dhaka","Bangladesh",23.8103,90.4125,"Dhaka"),
 ("Kinshasa","RD Congo",-4.4419,15.2663,"Kinshasa"),
 ("አዲስ አበባ · Addis Ababa","Ethiopia",9.0320,38.7469,"AddisAbaba"),
 ("Accra","Ghana",5.6037,-0.1870,"Accra"),
 ("Abidjan","Côte d’Ivoire",5.3600,-4.0083,"Abidjan"),
 ("Kampala","Uganda",0.3476,32.5825,"Kampala"),
 ("Dar es Salaam","Tanzania",-6.7924,39.2083,"DarEsSalaam"),
 ("عمّان · Amman","الأردن",31.9454,35.9284,"Amman"),
 ("بيروت · Beirut","لبنان",33.8938,35.5018,"Beirut"),
 ("بغداد · Baghdad","العراق",33.3152,44.3661,"Baghdad"),
 ("Caracas","Venezuela",10.4806,-66.9036,"Caracas"),
 ("Ciudad de Guatemala","Guatemala",14.6349,-90.5069,"GuatemalaCity"),
 ("Port-au-Prince","Haïti",18.5944,-72.3074,"PortAuPrince"),
 ("Santo Domingo","República Dominicana",18.4861,-69.9312,"SantoDomingo"),
 ("Quito","Ecuador",-0.1807,-78.4678,"Quito"),
 ("Napoli","Italia",40.8518,14.2681,"Naples"),
 ("Marseille","France",43.2965,5.3698,"Marseille"),
 ("Los Angeles","United States",34.0522,-118.2437,"LosAngeles"),
 ("Chicago","United States",41.8781,-87.6298,"Chicago"),
 ("San Francisco","United States",37.7749,-122.4194,"SanFrancisco"),
 ("Toronto","Canada",43.6532,-79.3832,"Toronto"),
 ("Bruxelles · Brussel","Belgique",50.8503,4.3517,"Brussels"),
 ("Amsterdam","Nederland",52.3676,4.9041,"Amsterdam"),
 ("Wien","Österreich",48.2082,16.3738,"Vienna"),
 ("Budapest","Magyarország",47.4979,19.0402,"Budapest"),
 ("Beograd · Belgrade","Srbija",44.7866,20.4489,"Belgrade"),
 ("София · Sofia","България",42.6977,23.3219,"Sofia"),
 ("تونس · Tunis","تونس",36.8065,10.1815,"Tunis"),
 ("الجزائر · Alger","الجزائر",36.7538,3.0588,"Algiers"),
 ("الخرطوم · Khartoum","السودان",15.5007,32.5599,"Khartoum"),
 ("دمشق · Damascus","سوريا",33.5138,36.2765,"Damascus"),
 ("کابل · Kabul","افغانستان",34.5553,69.2075,"Kabul"),
 ("لاہور · Lahore","پاکستان",31.5204,74.3587,"Lahore"),
 ("சென்னை · Chennai","India",13.0827,80.2707,"Chennai"),
 ("Jakarta","Indonesia",-6.2088,106.8456,"Jakarta"),
 ("กรุงเทพ · Bangkok","ประเทศไทย",13.7563,100.5018,"Bangkok"),
 ("Medellín","Colombia",6.2442,-75.5812,"Medellin"),
 ("Santiago","Chile",-33.4489,-70.6693,"Santiago"),
 ("Cape Town","South Africa",-33.9249,18.4241,"CapeTown"),
 ("Durban","South Africa",-29.8587,31.0218,"Durban"),
 ("الإسكندرية · Alexandria","مصر",31.2001,29.9187,"Alexandria"),
 ("Luanda","Angola",-8.8390,13.2894,"Luanda"),
 ("Maputo","Moçambique",-25.9692,32.5732,"Maputo"),
 ("Harare","Zimbabwe",-17.8252,31.0335,"Harare"),
 ("Lusaka","Zambia",-15.3875,28.3228,"Lusaka"),
 ("Kigali","Rwanda",-1.9441,30.0619,"Kigali"),
 ("Douala","Cameroun",4.0511,9.7679,"Douala"),
 ("Ouagadougou","Burkina Faso",12.3714,-1.5197,"Ouagadougou"),
 ("Conakry","Guinée",9.6412,-13.5784,"Conakry"),
 ("Antananarivo","Madagasikara",-18.8792,47.5079,"Antananarivo"),
 ("काठमाडौं · Kathmandu","Nepal",27.7172,85.3240,"Kathmandu"),
 ("කොළඹ · Colombo","Sri Lanka",6.9271,79.8612,"Colombo"),
 ("ရန်ကုန် · Yangon","Myanmar",16.8661,96.1951,"Yangon"),
 ("ភ្នំពេញ · Phnom Penh","Cambodia",11.5564,104.9282,"PhnomPenh"),
 ("Hà Nội","Việt Nam",21.0278,105.8342,"Hanoi"),
 ("Thành phố Hồ Chí Minh","Việt Nam",10.8231,106.6297,"HoChiMinh"),
 ("Kuala Lumpur","Malaysia",3.1390,101.6869,"KualaLumpur"),
 ("Улаанбаатар · Ulaanbaatar","Mongolia",47.8864,106.9057,"Ulaanbaatar"),
 ("Toshkent · Tashkent","Oʻzbekiston",41.2995,69.2401,"Tashkent"),
 ("Алматы · Almaty","Qazaqstan",43.2220,76.8512,"Almaty"),
 ("თბილისი · Tbilisi","Georgia",41.7151,44.8271,"Tbilisi"),
 ("أربيل · Erbil","العراق",36.1911,44.0092,"Erbil"),
 ("హైదరాబాద్ · Hyderabad","India",17.3850,78.4867,"Hyderabad"),
 ("ಬೆಂಗಳೂರು · Bangalore","India",12.9716,77.5946,"Bangalore"),
 ("Manchester","United Kingdom",53.4808,-2.2426,"Manchester"),
 ("Glasgow","United Kingdom",55.8642,-4.2518,"Glasgow"),
 ("Dublin · Baile Átha Cliath","Ireland",53.3498,-6.2603,"Dublin"),
 ("Hamburg","Deutschland",53.5511,9.9937,"Hamburg"),
 ("München","Deutschland",48.1351,11.5820,"Munich"),
 ("Milano","Italia",45.4642,9.1900,"Milan"),
 ("Praha · Prague","Česko",50.0755,14.4378,"Prague"),
 ("Θεσσαλονίκη · Thessaloniki","Ελλάδα",40.6401,22.9444,"Thessaloniki"),
 ("Houston","United States",29.7604,-95.3698,"Houston"),
 ("Miami","United States",25.7617,-80.1918,"Miami"),
 ("Montréal","Canada",45.5017,-73.5673,"Montreal"),
 ("Guadalajara","México",20.6597,-103.3496,"Guadalajara"),
 ("Recife","Brasil",-8.0476,-34.8770,"Recife"),
 ("La Paz","Bolivia",-16.4897,-68.1193,"LaPaz"),
 ("Sydney","Australia",-33.8688,151.2093,"Sydney"),
 ("Melbourne","Australia",-37.8136,144.9631,"Melbourne"),
]
CITY_LIST = [
 ("Madrid","Comunidad de Madrid",40.4168,-3.7038),("Barcelona","Catalunya",41.3874,2.1686),
 ("Valencia","Comunitat Valenciana",39.4699,-0.3763),("Sevilla","Andalucía",37.3891,-5.9845),
 ("Zaragoza","Aragón",41.6488,-0.8891),("Málaga","Andalucía",36.7213,-4.4213),
 ("Murcia","Región de Murcia",37.9922,-1.1307),("Palma de Mallorca","Illes Balears",39.5696,2.6502),
 ("Las Palmas de Gran Canaria","Canarias",28.1235,-15.4363),("Bilbao","Euskadi",43.2630,-2.9350),
 ("Alicante","Comunitat Valenciana",38.3452,-0.4810),("Córdoba","Andalucía",37.8882,-4.7794),
 ("Valladolid","Castilla y León",41.6523,-4.7245),("Vigo","Galicia",42.2406,-8.7207),
 ("Gijón","Asturias",43.5322,-5.6611),("Vitoria-Gasteiz","Euskadi",42.8467,-2.6716),
 ("A Coruña","Galicia",43.3623,-8.4115),("Granada","Andalucía",37.1773,-3.5986),
 ("Elche","Comunitat Valenciana",38.2699,-0.7126),("Oviedo","Asturias",43.3619,-5.8494),
 ("Badalona","Catalunya",41.4500,2.2474),("Cartagena","Región de Murcia",37.6257,-0.9966),
 ("Terrassa","Catalunya",41.5610,2.0089),("Jerez de la Frontera","Andalucía",36.6866,-6.1367),
 ("Sabadell","Catalunya",41.5433,2.1094),("Móstoles","Comunidad de Madrid",40.3223,-3.8649),
 ("Santa Cruz de Tenerife","Canarias",28.4636,-16.2518),("Pamplona","Navarra",42.8125,-1.6458),
 ("Almería","Andalucía",36.8340,-2.4637),("Donostia-San Sebastián","Euskadi",43.3183,-1.9812),
 ("Santander","Cantabria",43.4623,-3.8100),("Castellón de la Plana","Comunitat Valenciana",39.9864,-0.0513),
 ("Burgos","Castilla y León",42.3439,-3.6969),("Albacete","Castilla-La Mancha",38.9942,-1.8585),
 ("Salamanca","Castilla y León",40.9701,-5.6635),("Logroño","La Rioja",42.4627,-2.4450),
 ("Huelva","Andalucía",37.2614,-6.9447),("Lleida","Catalunya",41.6176,0.6200),
 ("Tarragona","Catalunya",41.1189,1.2445),("León","Castilla y León",42.5987,-5.5671),
 ("Toledo","Castilla-La Mancha",39.8628,-4.0273),("Cáceres","Extremadura",39.4753,-6.3724),
 ("Badajoz","Extremadura",38.8794,-6.9707),("Ourense","Galicia",42.3358,-7.8639),
 ("Santiago de Compostela","Galicia",42.8782,-8.5448),("Guadalajara","Castilla-La Mancha",40.6329,-3.1613),
 ("Ceuta","Ceuta",35.8894,-5.3213),("Melilla","Melilla",35.2923,-2.9381),
]
CITYKEY = {"Málaga":"Malaga","Palma de Mallorca":"Palma","Las Palmas de Gran Canaria":"LasPalmas",
 "Gijón":"Gijon","Vitoria-Gasteiz":"Vitoria","A Coruña":"Coruna","Córdoba":"Cordoba",
 "Jerez de la Frontera":"Jerez","Móstoles":"Mostoles","Santa Cruz de Tenerife":"SantaCruz",
 "Almería":"Almeria","Donostia-San Sebastián":"Donostia","Castellón de la Plana":"Castellon",
 "Logroño":"Logrono","León":"Leon"}

# Las 300 ciudades nuevas no se escriben a mano: salen de OpenStreetMap
# (nombre y coordenadas) y de Nominatim (pais), asi no hay ni un dato de memoria.
_new = []
for _f in ('cities_new300.json', 'cities_new200.json', 'cities_new500.json'):
    try: _new += json.load(open(_f))
    except Exception: pass
_have = {(round(la,2), round(lo,2)) for _,_,la,lo,_ in WORLD}
for _c in _new:
    if (round(_c['lat'],2), round(_c['lon'],2)) in _have: continue
    _en = _c['name']; _loc = (_c.get('local') or '').strip()
    _disp = _en if (not _loc or _loc == _en or _loc.isascii()) else _en + ' \u00b7 ' + _loc
    WORLD.append((_disp, _c.get('country') or _c['cc'], _c['lat'], _c['lon'], _en))

nat = json.load(open('raw_nat.json'))
world = {}
for _f in ('raw_world.json','raw_world2.json','raw_world3.json','raw_world4.json','raw_world5.json','raw_world6.json','raw_world7.json','raw_w300.json','raw_w200.json','raw_empty.json','raw_w500.json'):
    try:
        _w = json.load(open(_f))
        world.update(_w)
        # raw_empty.json va con el nombre tal cual se ensena («Cairo · القاهرة»);
        # WORLD busca por el nombre en ingles. Se guarda tambien por cada parte.
        for _k, _v in list(_w.items()):
            if '\u00b7' in _k:
                for _part in _k.split('\u00b7'):
                    world.setdefault(_part.strip(), _v)
    except Exception: pass
legacy = {}
for f in ('raw_es.json','raw_es2.json'):
    try: legacy[f]=json.load(open(f))
    except Exception: pass

NUMNAME = re.compile(r'^[\s\d.,\-/#ºª]+[a-zA-Z]?$')

def usable_name(g):
    """El nombre que se ensena, o vacio para que se use el de la categoria.

    En OpenStreetMap el numero de portal se cuela a veces en `name`: aqui eran
    trece sitios que se llamaban «643» o «12A». Pocos, pero alguien que busca
    donde comer no puede ver «643» como nombre de un comedor. Si el nombre es
    solo cifras (con letra final o sin ella), o es identico al numero de portal,
    no vale como nombre y se usa el de la categoria.
    """
    for k in ('name', 'operator', 'brand'):
        v = (g.get(k) or '').strip()
        if not v:
            continue
        if NUMNAME.match(v):
            continue
        if v == (g.get('addr:housenumber') or '').strip():
            continue
        # «COMEDOR SOCIAL SAN JUAN» es como lo teclean algunos ayuntamientos; en
        # una lista de tarjetas grita. Si esta todo en mayusculas y tiene mas de
        # cuatro letras, se capitaliza (las siglas cortas se quedan como estan).
        if len(v) > 4 and v.upper() == v and any(ch.isalpha() for ch in v):
            v = ' '.join(w if (len(w) <= 3 and w.isupper()) else w.capitalize() for w in v.split(' '))
        return v
    return ''


try:
    META_TS = json.load(open('meta.json'))
except Exception:
    META_TS = {}
print('fechas de edicion conocidas:', len(META_TS))

# ---- horarios sacados de la web del propio sitio (hours_crawl.py) ----
# El dato que mas falta no es la direccion, es la hora: un comedor con calle y
# sin horario obliga a andar hasta alli para saber que abre a las seis. Muchos
# lo dicen en su web y no en OpenStreetMap. Aqui se pegan, y solo donde OSM no
# dice nada: lo que este en OSM manda siempre.
HOURS_WEB = {}
try:
    import csv as _csvh
    for _r in _csvh.DictReader(io.open('extra_sources/hours.csv', encoding='utf-8')):
        if _r.get('id') and _r.get('opening_hours'):
            HOURS_WEB[_r['id'].strip()] = _r['opening_hours'].strip()
except Exception:
    pass
print('horarios sacados de webs:', len(HOURS_WEB))

places=[]; seen=set()
def add(el):
    g=el.get('tags') or {}
    cat=classify(g)
    if not cat: return False
    lat,lon=coord(el)
    if lat is None: return False
    name = usable_name(g)
    k=(name.lower(), round(lat,4), round(lon,4))
    if k in seen: return False
    seen.add(k)
    street=' '.join(x for x in [g.get('addr:street'),g.get('addr:housenumber')] if x)
    addr=', '.join(x for x in [street,g.get('addr:postcode'),g.get('addr:city') or g.get('addr:suburb')] if x)
    ty=el['type']; oid = el['id'] if ty=='node' else (-el['id'] if ty=='way' else 'relation/'+str(el['id']))
    hours = (g.get('opening_hours') or g.get('opening_hours:covid19') or g.get('service_times')
             or g.get('opening_hours:kitchen') or '')
    if hours in ('open','yes'): hours=''
    _webh = False
    if not hours and HOURS_WEB:
        _hk = ('way/%d' % el['id']) if ty=='way' else (('relation/%d' % el['id']) if ty=='relation' else ('node/%d' % el['id']))
        hours = HOURS_WEB.get(_hk, '')
        _webh = bool(hours)
    # what you need to get in: OSM says little, but what it does say matters a lot
    req=[]
    if g.get('fee') in ('yes','some'): req.append('fee')
    elif g.get('fee')=='no': req.append('free')
    if g.get('reservation') in ('required','yes') or g.get('appointment')in('required','yes') \
       or g.get('booking')=='required': req.append('appt')
    if g.get('access') in ('private','customers','permit','members','no'): req.append('private')
    elif g.get('access') in ('yes','public','permissive'): req.append('open')
    if g.get('membership'): req.append('members')
    if g.get('referral') or g.get('social_facility:referral'): req.append('ref')
    if _webh: req.append('webh')   # el horario sale de su web, no de OSM: la ficha lo dice
    # fecha de la ultima edicion en OSM, como AAAAMM (un entero corto). Es el
    # aviso mas honesto que se le puede dar a alguien: un comedor que nadie ha
    # tocado desde 2019 hay que llamarlo antes de andar hasta alli.
    _mk = ('way/%d' % el['id']) if ty=='way' else (('relation/%d' % el['id']) if ty=='relation' else ('node/%d' % el['id']))
    _ts = META_TS.get(_mk, '')
    _tsv = int(_ts[:4] + _ts[5:7]) if _ts and len(_ts) >= 7 else ''
    # foto: solo de Wikimedia Commons (licencia libre y servidor estable). Se
    # guarda el nombre del archivo; la app pide la miniatura solo al abrir la ficha.
    _ph = (g.get('wikimedia_commons') or '').strip()
    if _ph.startswith('File:'): _ph = _ph[5:]
    else:
        _img = (g.get('image') or '').strip()
        _m = re.search(r'upload\.wikimedia\.org/wikipedia/commons/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/([^/?#]+)', _img)
        if _m: _ph = urllib.parse.unquote(_m.group(1))
        elif 'commons.wikimedia.org/wiki/File:' in _img: _ph = urllib.parse.unquote(_img.split('File:', 1)[1])
        else: _ph = ''
    _ph = _ph.replace('_', ' ').strip()
    if ':' in _ph[:12] or len(_ph) > 120 or not re.search(r'\.(jpe?g|png|webp|gif)$', _ph, re.I): _ph = ''
    # lo que el propio mapa dice del sitio («comidas a las 13:00, traer documento»):
    # 160 caracteres, sin saltos. Y la capacidad de los albergues («camas: 120»).
    _desc = (g.get('description') or g.get('note') or '').replace('\n', ' ').strip()
    if len(_desc) > 160: _desc = _desc[:157].rsplit(' ', 1)[0] + '…'
    _cap = ''.join(ch for ch in (g.get('capacity') or '') if ch.isdigit())[:5]
    _cap = int(_cap) if _cap else ''
    _phone = g.get('phone') or g.get('contact:phone') or g.get('contact:mobile') or g.get('mobile') or ''
    _web = g.get('website') or g.get('contact:website') or ''
    if _web and not re.match(r'https?://', _web): _web = 'https://' + _web
    # idiomas en los que atienden (language:es=yes, language=ar;fr): para quien no
    # habla el del pais, saber que ahi le entienden cambia la decision de ir
    _langs = sorted({k.split(':',1)[1][:3] for k,v in g.items() if k.startswith('language:') and v in ('yes','main') and len(k.split(':',1)[1])<=3}
                    | {x.strip()[:3] for x in (g.get('language') or '').replace(',',';').split(';') if x.strip() and len(x.strip())<=3})
    _langs = ';'.join(_langs)[:40]
    row=[name, r5(lat), r5(lon), CATIDS.index(cat), subkey(g,cat), oid, addr,
        hours, _phone, _web, g.get('operator',''),
        g.get('social_facility:for',''), g.get('wheelchair',''), ';'.join(req), _tsv, _ph, _desc, _cap, _langs]
    while len(row)>6 and (row[-1]=='' or row[-1] is None): row.pop()
    places.append(row); return True

# nationwide layers, most important first
for key in ('named','social_facility','amenities','orgs','hospital','healthcentre'):
    for el in nat.get(key,[]): add(el)
# legacy city pulls (kept: they contain showers/toilets already merged above, harmless)
for f,v in legacy.items():
    if f=='raw_es.json':
        for city,d in v.items():
            for el in d.get('main',[]): add(el)
    else:
        for city,els in v.items():
            for el in els: add(el)

# 9 cities elsewhere in the world, capped so the file stays small
W_WATER=24; W_WARM=13; W_HEALTH=21
for wname,wcountry,wlat,wlon,wkey in WORLD:
    wrows=[]
    # Hay dos «Hyderabad» (India y Pakistan) y el diccionario va por nombre: la
    # de la India se quedaba con los sitios de la otra, a 1.500 km. Se miran las
    # dos claves (nombre en ingles y nombre tal cual se ensena) y solo entra lo
    # que esta a menos de 60 km de la ciudad.
    _seen_el=set()
    for _els in (world.get(wkey,[]), world.get(wname,[])):
        for el in _els:
            _id=(el.get('type'),el.get('id'))
            if _id in _seen_el: continue
            _seen_el.add(_id)
            lat,lon=coord(el)
            if lat is None: continue
            d=hav(wlat,wlon,lat,lon)
            if d>60000: continue
            wrows.append((d,el))
    wrows.sort(key=lambda x:x[0])
    nw=nl=nh=0
    for d,el in wrows:
        cat=classify(el.get('tags') or {})
        if not cat: continue
        if cat=='water':
            if nw>=W_WATER: continue
            if add(el): nw+=1
        elif cat=='warm':
            if nl>=W_WARM: continue
            if add(el): nl+=1
        elif cat=='health':
            if nh>=W_HEALTH: continue
            if add(el): nh+=1
        else: add(el)

# ---- el planeta entero, solo lo esencial ----
# Comedores, albergues, duchas, ropa, ONG y centros sociales de cualquier pueblo
# del mundo (fetch_planet.py), no solo de las ciudades de la lista. Sin agua,
# aseos ni salud: eso, que son millones de puntos, sigue solo alrededor de las
# ciudades para que los trozos del mapa no engorden.
PLANET_CATS = {'food','shelter','hygiene','clothes','social','legal'}
_np = 0
try:
    _planet = json.load(open('raw_planet.json'))
except Exception:
    _planet = {}
for _cell, _els in _planet.items():
    for el in _els:
        cat = classify(el.get('tags') or {})
        if cat in PLANET_CATS and add(el): _np += 1
print('planeta:', len(_planet), 'celdas |', _np, 'sitios nuevos')

# per-city capped extras: drinking water, free toilets, libraries
WATER_CAP=26; WARM_CAP=12
for name,region,clat,clon in CITY_LIST:
    key='city:'+CITYKEY.get(name,name.split()[0])
    els = nat.get(key)
    if not els:
        legacy_city = legacy.get('raw_es.json',{}).get(CITYKEY.get(name,name),{})
        els = legacy_city.get('water',[]) if legacy_city else []
    if not els: continue
    rows=[]
    for el in els:
        lat,lon=coord(el)
        if lat is None: continue
        rows.append((hav(clat,clon,lat,lon),(el.get('tags') or {}).get('amenity'),el))
    rows.sort(key=lambda x:x[0])
    nw=nl=0
    for d,am,el in rows:
        if am=='drinking_water':
            if nw>=WATER_CAP: continue
            if add(el): nw+=1
        elif am=='library':
            if nl>=WARM_CAP: continue
            if add(el): nl+=1
        else:
            add(el)

# ---- fuentes extra (CSV en extra_sources/, ver su README) ----
import glob as _glob, csv as _csv2
_ext_n = 0
for _f in sorted(_glob.glob('extra_sources/*.csv')):
    if _f.endswith('plantilla.csv'): continue
    _base = os.path.basename(_f)[:-4]
    for _i, _r in enumerate(_csv2.DictReader(open(_f, encoding='utf-8'))):
        try: _la, _lo = float(_r['lat']), float(_r['lon'])
        except Exception: continue
        _cat = (_r.get('cat') or 'social').strip()
        if _cat not in CATIDS or not (_r.get('name') or '').strip(): continue
        if not re.search(r'cc0|cc-by|odbl|public domain|dominio p', (_r.get('licence') or ''), re.I): continue
        _for = ';'.join(x.strip() for x in (_r.get('for') or '').split(';') if x.strip())
        _up = re.sub(r'[^0-9]', '', (_r.get('updated') or ''))[:6]
        row = [_r['name'].strip(), r5(_la), r5(_lo), CATIDS.index(_cat), (_r.get('sub') or '').strip(), 'ext/%s/%d' % (_base, _i),
               (_r.get('addr') or '').strip(), (_r.get('hours') or '').strip(), (_r.get('phone') or '').strip(), (_r.get('web') or '').strip(),
               (_r.get('operator') or _r.get('source') or '').strip(), _for, '', '', int(_up) if len(_up) == 6 else '', '',
               ('%s: %s' % (_r.get('source') or _base, _r.get('source_url') or ''))[:160], '']
        while len(row) > 6 and (row[-1] == '' or row[-1] is None): row.pop()
        places.append(row); _ext_n += 1
if _ext_n: print('fuentes extra:', _ext_n, 'sitios')

# ---- spatial thinning ----
# Beach showers, public toilets and fountains come in long redundant rows. Keeping
# a few per square kilometre loses nothing useful and saves a lot of payload.
THIN = {'shower':2, 'toilets':2, 'public_bath':2, 'drinking_water':2, 'library':2, 'community_centre':2}
cell = {}
kept = []
for r in places:
    sub = r[4]
    lim = THIN.get(sub)
    if lim is None:
        kept.append(r); continue
    k = (sub, round(r[1]*100), round(r[2]*100))
    n = cell.get(k, 0)
    if n >= lim: continue
    cell[k] = n + 1
    kept.append(r)
print('thinned:', len(places)-len(kept))
places = kept

# ---- duplicados ----
# McMillan Library salia dos veces en Nairobi: el edificio (way) y el punto (node),
# con el mismo nombre a 30 m. Pasa en todas partes: OSM tiene las dos cosas y
# las dos entran. Mismo nombre (sin mayusculas ni acentos), misma categoria y
# menos de 60 m = uno solo. Se queda el que mas datos trae.
import unicodedata
def _norm(x):
    x = unicodedata.normalize('NFD', str(x or '')).lower()
    return ''.join(ch for ch in x if not unicodedata.combining(ch) and (ch.isalnum() or ch == ' ')).strip()
def _score(r):
    return sum(1 for v in r[6:] if v)                # direccion, horario, telefono, web...
_byname = {}
for r in places:
    if not r[0]:
        continue
    _byname.setdefault((_norm(r[0]), r[3]), []).append(r)
_drop = set()
for k, rows in _byname.items():
    if len(rows) < 2: continue
    rows.sort(key=lambda r: -_score(r))
    keptr = []
    for r in rows:
        if any(hav(r[1], r[2], q[1], q[2]) < 60 for q in keptr):
            _drop.add(id(r)); continue
        keptr.append(r)
places = [r for r in places if id(r) not in _drop]
print('duplicados quitados:', len(_drop))

# ---- calle prestada ----
# 112.000 sitios no traen direccion. Si a menos de 120 m hay otro sitio del mapa
# que si la trae, se toma su calle (solo la calle, sin numero) como referencia
# aproximada: «cerca de Calle Mayor». Va en un campo aparte (19) y la app lo
# ensena como aproximado; no se hace pasar por la direccion del sitio.
_grid = {}
for r in places:
    if len(r) > 6 and isinstance(r[6], str) and r[6]:
        _grid.setdefault((int(r[1] * 500), int(r[2] * 500)), []).append(r)   # celdas de 0.002 grados (~220 m)
_near_n = 0
for r in places:
    if len(r) > 6 and r[6]: continue
    best, bd = None, 1e9
    ci, cj = int(r[1] * 500), int(r[2] * 500)
    for i in range(-1, 2):
        for j in range(-1, 2):
            for q in _grid.get((ci + i, cj + j), []):
                d = hav(r[1], r[2], q[1], q[2])
                if d < bd: bd, best = d, q
    if best is not None and bd <= 120:
        street = re.split(r',\s*', best[6])[0]
        street = re.sub(r'\s+\d+[A-Za-z]?(\s*[-/]\s*\d+[A-Za-z]?)?\s*$', '', street).strip()   # fuera el numero
        if len(street) >= 4:
            while len(r) < 19: r.append('')
            r.append(street); _near_n += 1
print('calle prestada a', _near_n, 'sitios sin direccion')

# ---- spatial sort ----
places.sort(key=lambda r:(round(r[1]*20), round(r[2]*20), r[1], r[2]))

# ---- string interning (tabla global, compartida por index.html y los trozos) ----
freq=Counter()
STR_FIELDS=[0,4,10,11,12]
for r in places:
    for i in STR_FIELDS:
        if len(r)>i and isinstance(r[i],str) and len(r[i])>=3: freq[r[i]]+=1
table=[x for x,n in freq.most_common() if n>=8][:2000]
idx={x:i for i,x in enumerate(table)}
for r in places:
    for i in STR_FIELDS:
        if len(r)>i and isinstance(r[i],str) and r[i] in idx: r[i]=idx[r[i]]

# ---- trozos de 5x5 grados ----
# La app ya no lleva los 40.000 sitios dentro: carga solo el trozo del mapa donde
# estas. Asi sigue abriendo en menos de un segundo por muchas ciudades que haya.
CHUNK=2.5
def ckey(la,lo): return '%d_%d'%(math.floor(la/CHUNK), math.floor(lo/CHUNK))
buckets=defaultdict(list)
for r in places: buckets[ckey(r[1],r[2])].append(r)
# Una celda de 2,5 grados en Alemania o Inglaterra pasa de 3.000 sitios y pesa
# mas de lo que un movil en 3G debe bajar de golpe. Esas se parten en cuatro
# subceldas de 1,25 grados (clave i_j_a_b); la app sabe cuales por SPLIT.
SPLIT_AT=2200
SPLIT=[]
for k in list(buckets):
    rows=buckets[k]
    if len(rows)<=SPLIT_AT: continue
    i,j=map(int,k.split('_'))
    la0,lo0=i*CHUNK, j*CHUNK
    for r in rows:
        a=1 if r[1]-la0>=CHUNK/2 else 0; b=1 if r[2]-lo0>=CHUNK/2 else 0
        buckets['%s_%d_%d'%(k,a,b)].append(r)
    del buckets[k]; SPLIT.append(k)
print('celdas partidas:', len(SPLIT))

def delta(rows):
    out=[]; pla=plo=0
    for r in rows:
        q=list(r)
        ila=int(round(q[1]*1e5)); ilo=int(round(q[2]*1e5))
        q[1]=ila-pla; q[2]=ilo-plo; pla,plo=ila,ilo
        out.append(q)
    return out

os.makedirs('d',exist_ok=True)
for f in os.listdir('d'):
    if f.endswith('.json'): os.remove(os.path.join('d',f))
chunk_bytes=0
for k,rows in buckets.items():
    j=json.dumps(delta(rows),ensure_ascii=False,separators=(',',':'))
    open(os.path.join('d',k+'.json'),'w',encoding='utf-8').write(j)
    chunk_bytes+=len(j.encode())

# ---- nucleo incrustado: lo mas cercano a cada ciudad, para que nunca salga vacio ----
# Antes eran 3 por ciudad: 69 KB comprimidos en el arranque. Con 1 el mapa sigue
# sin salir vacio nunca (cada ciudad tiene su punto) y el trozo de la zona llega
# en la misma peticion siguiente. Unos 45 KB menos para quien abre en 3G.
CORE_PER_CITY=1
CORE_CITIES=600      # con 1.221 ciudades el nucleo pesaba 100 KB; el trozo de la zona llega en un segundo
PRIO={'food':0,'shelter':1,'hygiene':2,'clothes':3,'social':4,'health':5,'legal':6,'warm':7,'water':8}
core=[]; seen_core=set()
allcities=[(n,la,lo) for n,c,la,lo,_ in WORLD]+[(n,la,lo) for n,reg,la,lo in CITY_LIST]
for cname,cla,clo in allcities[:CORE_CITIES]:
    near=[]
    for r in places:
        d=hav(cla,clo,r[1],r[2])
        if d<9000: near.append((PRIO.get(CATIDS[r[3]],9), d, id(r), r))
    near.sort(key=lambda x:(x[0],x[1]))
    for _,_,rid,r in near[:CORE_PER_CITY]:
        if rid in seen_core: continue
        seen_core.add(rid); core.append(r)
core.sort(key=lambda r:(round(r[1]*20), round(r[2]*20)))
core_rows=delta(core)

data=json.dumps(core_rows,ensure_ascii=False,separators=(',',':'))
sjson=json.dumps(table,ensure_ascii=False,separators=(',',':'))
chunks_json=json.dumps(sorted(buckets.keys()),separators=(',',':'))
try: _lcc = json.load(open('legacy_cc.json'))
except Exception: _lcc = {}
_cc_by_coord = dict(_lcc)
for _c in _new: _cc_by_coord['%.4f,%.4f'%(_c['lat'],_c['lon'])] = {'cc':_c['cc']}
_ccset = {'ES'}                                    # España va aparte, en CITY_LIST
_unknown = []
for _n,_co,_la,_lo,_ in WORLD:
    _e = _cc_by_coord.get('%.4f,%.4f'%(_la,_lo))
    if _e and _e.get('cc'): _ccset.add(_e['cc'])
    else: _unknown.append(_co)
_ccset |= {'?'+x for x in set(_unknown)}           # sin ISO: cuenta por nombre, sin inventar
countries = len(_ccset)
if _unknown: print('sin codigo ISO:', len(set(_unknown)), sorted(set(_unknown))[:6])
import csv as _csv
_ccname = {}
for _r in _csv.DictReader(open('emergency-numbers.csv', encoding='utf-8')):
    _ccname.setdefault(_r['country_code'], _r['country'])
def _country_en(n, co, la, lo):
    _e = _cc_by_coord.get('%.4f,%.4f'%(la,lo))
    return _ccname.get((_e or {}).get('cc',''), co)
def _cc_of(la,lo):
    _e = _cc_by_coord.get('%.4f,%.4f'%(la,lo)); return (_e or {}).get('cc','')
cities=[[n,la,lo,_country_en(n,c,la,lo),_cc_of(la,lo)] for n,c,la,lo,_ in WORLD] + [[n,la,lo,reg,'ES'] for n,reg,la,lo in CITY_LIST]
cjson=json.dumps(cities,ensure_ascii=False,separators=(',',':'))
# Poblaciones de 10.000 habitantes o mas (OSM, fetch_towns.py) para buscar el
# pueblo de uno sin conexion. Se quitan las que ya son ciudad del mapa, y el
# pais se toma de la ciudad del mapa mas cercana si esta a menos de 400 km.
try:
    import math as _m
    _tw=[r for v in json.load(open('raw_towns10k.json',encoding='utf-8')).values() for r in v]
    def _hv(a,b,c,d):
        p=_m.pi/180; x=_m.sin((c-a)*p/2)**2+_m.cos(a*p)*_m.cos(c*p)*_m.sin((d-b)*p/2)**2; return 12742*_m.asin(_m.sqrt(x))
    _grid={}
    for c in cities: _grid.setdefault((int(c[1]//2),int(c[2]//2)),[]).append(c)
    towns=[]; _seen=set()
    for nm,en,la,lo,pop,cc in _tw:
        key=(nm.lower(),round(la,1),round(lo,1))
        if key in _seen: continue
        _seen.add(key)
        near=None; nd=1e9
        for i in range(-1,2):
            for j in range(-1,2):
                for c in _grid.get((int(la//2)+i,int(lo//2)+j),[]):
                    d=_hv(la,lo,c[1],c[2])
                    if d<nd: nd=d; near=c
        if near and nd<15: continue            # ya es ciudad del mapa
        _cc = cc.upper()[:2] if cc else (near[4] if near and nd<400 else '')
        towns.append([nm, en if en and en!=nm else '', round(la,4), round(lo,4), _cc])
    towns.sort(key=lambda x:x[0])
    open('towns.json','w',encoding='utf-8').write(json.dumps(towns,ensure_ascii=False,separators=(',',':')))
    print('pueblos:', len(towns), '| towns.json', round(os.path.getsize('towns.json')/1024), 'KB')
except Exception as _ex: print('towns.json no generado:', _ex)
html=open('index.template.html',encoding='utf-8').read()
# Leaflet 1.9.4 vive en vendor/, dentro del proyecto. Antes se leia de /tmp:
# el 22 de septiembre el contenedor se reinicio, /tmp se vacio y el build dejo
# de funcionar. Nada de lo que hace falta para construir puede vivir fuera.
_lfdir = 'vendor' if os.path.exists('vendor/leaflet.js') else '/tmp'
lcss=open(_lfdir + '/leaflet.css',encoding='utf-8').read()
ljs=open(_lfdir + '/leaflet.js',encoding='utf-8').read().replace('</script','<\\/script')
html=html.replace('/*__LEAFLET_CSS__*/',lcss,1).replace('/*__LEAFLET_JS__*/',ljs,1)
ncities = len(WORLD) + len(CITY_LIST)
# Contar paises por nombre daba de mas: las ciudades viejas llevan el pais en su
# idioma ("Maroc", "Türkiye") y Nominatim lo devuelve en ingles. Se cuenta por
# codigo ISO, resuelto desde las coordenadas.
stats = {'places': len(places), 'cities': ncities, 'countries': countries}
meta_desc = ('Free food, shelter, showers, clothes and help on one live map. %s places in %s cities '
             'across %s countries, in 20 languages. No account, no tracking, no cost.'
             % (format(len(places), ',d'), format(ncities, ',d'), countries))
import datetime as _dt
html=html.replace("const BUILT = /*__BUILT__*/'';", "const BUILT = /*__BUILT__*/'%s';" % _dt.date.today().isoformat(), 1)
html=html.replace('const STATS = /*__STATS__*/{places:0,cities:0,countries:0};',
                  'const STATS = /*__STATS__*/'+json.dumps(stats)+';',1)
html=html.replace('__META_DESC__', meta_desc).replace('__CITYN__', format(ncities, ',d')).replace('__COUNTRYN__', str(countries))
html=html.replace('const CITIES = /*__CITIES__*/[];','const CITIES = /*__CITIES__*/'+cjson+';',1)
# Lineas sociales verificadas, una por una en su fuente (helplines/social.json)
try:
    _help = json.load(open('helplines/social.json', encoding='utf-8'))
    html = html.replace('const HELP = /*__HELP__*/{};', 'const HELP = /*__HELP__*/' + json.dumps(_help, ensure_ascii=False, separators=(',', ':')) + ';', 1)
    _hn = sum(len(v.get('national', [])) + sum(len(x) for x in v.get('cities', {}).values()) for v in _help.values())
    print('lineas sociales:', _hn, 'en', len(_help), 'paises')
except Exception as _ex: print('helplines no cargadas:', _ex)
# datos estructurados para buscadores: que es, quien lo hace, y las preguntas
# frecuentes que ya estan en la pagina (en ingles, que es el idioma del HTML)
import html as _html
def _tget(k):
    m = re.search(r"['\"]%s['\"]\s*:\s*(['\"])(.*?)\1\s*[,\n]" % re.escape(k), html[html.index('T.en = {'):html.index('T.es = {')])
    return _html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).replace('\\u2019', '’').replace("\\'", "'") if m else ''
_faq = [{'@type':'Question','name':_tget('faq.q%d'%i),'acceptedAnswer':{'@type':'Answer','text':_tget('faq.a%d'%i)}} for i in range(1,9) if _tget('faq.q%d'%i)]
_ld = [
  {'@context':'https://schema.org','@type':'WebSite','name':'SupportNear','url':'https://supportnear.com/','inLanguage':['en','es','fr','ar','uk','ro','pl','ru','pt','ur','fa','wo','bm'],
   'description': meta_desc, 'publisher': {'@type':'Organization','name':'SupportNear','url':'https://supportnear.com/','logo':'https://supportnear.com/icon-512.png','sameAs':['https://x.com/mrstartups']}},
  {'@context':'https://schema.org','@type':'WebApplication','name':'SupportNear','url':'https://supportnear.com/','applicationCategory':'UtilitiesApplication','operatingSystem':'Any',
   'offers':{'@type':'Offer','price':'0','priceCurrency':'EUR'},'isAccessibleForFree':True,'browserRequirements':'Any modern browser; works offline once opened',
   'featureList':'Free food, shelters, showers and toilets, clothes, social help, legal aid, health care, drinking water and warm places on one map; %s places in %s cities across %s countries; 20 languages; works with no signal' % (format(len(places), ',d'), ncities, countries)},
  {'@context':'https://schema.org','@type':'FAQPage','mainEntity':_faq},
]
html=html.replace('/*__LDJSON__*/', json.dumps(_ld, ensure_ascii=False).replace('</', '<\\/'), 1)
html=html.replace('const STR = /*__STR__*/[];','const STR = /*__STR__*/'+sjson+';',1)
# JSON.parse() is ~2x faster than letting the JS engine parse a huge array literal
data_js = json.dumps(data, ensure_ascii=False).replace('</','<\\/')
html=html.replace('const RAW = /*__DATA__*/[];','const RAW = /*__DATA__*/JSON.parse('+data_js+');',1)
html=html.replace('const CHUNKS = /*__CHUNKS__*/[];','const CHUNKS = /*__CHUNKS__*/new Set('+chunks_json+');',1)
html=html.replace('const SPLIT = /*__SPLIT__*/[];','const SPLIT = /*__SPLIT__*/new Set('+json.dumps(sorted(SPLIT),separators=(",",":"))+');',1)
# huella de los datos: si cambia un solo sitio, cambia la URL de los trozos
datav = hashlib.sha1((data + sjson + chunks_json).encode('utf-8')).hexdigest()[:8]
html=html.replace("const DATA_V = /*__DATAV__*/'';","const DATA_V = /*__DATAV__*/'"+datav+"';",1)
assert "/*__DATAV__*/''" not in html

# huella de las paginas sueltas: cambia si cambian los datos, los textos, las
# traducciones o el estilo. Va colgada de sus enlaces porque el servidor las
# manda con diez anos de caducidad y una correccion no llegaba nunca.
pagesrc = datav
for f in ('pages.py', 'i18n_pages.py', 'page.css.txt'):
    try:
        pagesrc += io.open(f, encoding='utf-8').read()
    except IOError:
        pass
pagesv = hashlib.sha1(pagesrc.encode('utf-8')).hexdigest()[:8]
html=html.replace("const PAGES_V = /*__PAGESV__*/'';","const PAGES_V = /*__PAGESV__*/'"+pagesv+"';",1)
try: _sv = hashlib.sha1(open('social.jpg','rb').read()).hexdigest()[:8]
except Exception: _sv = pagesv
html=html.replace('__SOCIALV__', _sv).replace('mapped in 166 countries', 'mapped in %d countries' % countries)
assert "/*__PAGESV__*/''" not in html
for ph in ('__LEAFLET_JS__','__LEAFLET_CSS__','const RAW = /*__DATA__*/[];','const STR = /*__STR__*/[];'):
    assert ph not in html, ph
# ---- los idiomas, cada uno en su fichero ----
# Las trece tablas juntas eran 85 KB comprimidos, el 30% de la primera carga, y
# quien abre el mapa lee una. Se queda el ingles dentro (es el que rellena los
# huecos y el que ya trae escrito el HTML) y los otros doce salen a l/<codigo>.json.
# Con ellos viajan tambien las etiquetas de tipo de sitio, de linea de emergencia
# y de «para quien», que son lo que se ve en cada tarjeta.
# Para no equivocarme leyendo literales de JavaScript a mano, los convierte Node.
import subprocess, tempfile

def js_eval(literal):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
        tf.write('process.stdout.write(JSON.stringify(' + literal + '));')
        tmp = tf.name
    out = subprocess.run(['node', tmp], capture_output=True)
    os.unlink(tmp)
    assert out.returncode == 0, out.stderr[:500]
    return json.loads(out.stdout.decode('utf-8'))

def obj_span(src, name):
    """Donde empieza y acaba el literal { ... } de `const <name> = {`."""
    m = re.search(r'const %s = \{' % name, src)
    if not m:
        return None
    i = m.end() - 1
    depth = 0
    for j in range(i, len(src)):
        if src[j] == '{':
            depth += 1
        elif src[j] == '}':
            depth -= 1
            if depth == 0:
                return i, j + 1
    return None

LANG_CODES = re.findall(r"code:'(\w+)'", re.search(r'const LANGS = \[(.*?)\n\];', html, re.S).group(1))
SIDE = {'sub': 'SUB', 'lbl': 'LBL', 'for': 'FOR_LBL'}
side_data = {}
for key, name in SIDE.items():
    a, b = obj_span(html, name)
    side_data[key] = js_eval(html[a:b])
    only_en = '{\n en:' + json.dumps(side_data[key]['en'], ensure_ascii=False) + '\n}'
    html = html[:a] + only_en + html[b:]

try: CITY_NAMES = json.load(open('i18n_src/city_names.json', encoding='utf-8'))
except Exception: CITY_NAMES = {}
os.makedirs('l', exist_ok=True)
for f in os.listdir('l'):
    if f.endswith('.json') and f != 'show.json':
        os.remove(os.path.join('l', f))
lang_bytes = 0
for code in LANG_CODES:
    if code == 'en':
        continue
    m = re.search(r'^T\.%s = \{$' % code, html, re.M)
    if not m:
        print('AVISO: sin tabla para', code); continue
    start = m.start(); open_i = m.end() - 1
    end = html.index('\n};', open_i) + 3
    pack = {'t': js_eval(html[open_i:end - 1])}
    assert len(pack['t']) > 40, (code, len(pack['t']))
    for key in SIDE:
        if code in side_data[key]:
            pack[key] = side_data[key][code]
    # nombres de las ciudades en este idioma (fetch_city_names2.py): «Londres»
    _cn = {k: v[code].split(';')[0].strip() for k, v in CITY_NAMES.items() if v.get(code)}
    if _cn: pack['cities'] = _cn
    j = json.dumps(pack, ensure_ascii=False, separators=(',', ':'))
    open(os.path.join('l', code + '.json'), 'w', encoding='utf-8').write(j)
    lang_bytes += len(j.encode())
    html = html[:start] + html[end:]
assert 'T.es = {' not in html and 'T.en = {' in html
# huella de las traducciones: cambia en cuanto cambia un solo texto de un idioma
_lh = hashlib.sha1()
for _f in sorted(os.listdir('l')):
    if _f.endswith('.json'): _lh.update(open(os.path.join('l', _f), 'rb').read())
html = html.replace("const LANG_V = /*__LANGV__*/'';", "const LANG_V = /*__LANGV__*/'%s';" % _lh.hexdigest()[:8], 1)

# Minificar el JS propio y el CSS del fichero final (terser / csso, si estan).
# Los comentarios y el espacio se quedan en la plantilla, que es lo que se lee;
# el navegador de un movil de 80 euros no tiene por que descargarlos ni parsearlos.
def _minify(html):
    import subprocess, shutil, re as _re
    if not (shutil.which('terser') and shutil.which('csso')) or os.environ.get('NO_MINIFY'): return html
    def js(m):
        code=m.group(2)
        if len(code)<20000 or 'Leaflet' in code[:400]: return m.group(0)
        r=subprocess.run(['terser','--compress','passes=2,pure_getters=false,unsafe=false','--mangle','--format','ascii_only=false,comments=false'],input=code.encode(),capture_output=True)
        if r.returncode or not r.stdout: print('terser fallo:', r.stderr.decode()[:200]); return m.group(0)
        out=r.stdout.decode().replace('</script','<\\/script')
        return m.group(1)+out+'</script>'
    html=_re.sub(r'(<script(?![^>]*type=)[^>]*>)(.*?)</script>', js, html, flags=_re.S)
    def css(m):
        r=subprocess.run(['csso'],input=m.group(2).encode(),capture_output=True)
        if r.returncode or not r.stdout: return m.group(0)
        return m.group(1)+r.stdout.decode()+'</style>'
    html=_re.sub(r'(<style[^>]*>)(.*?)</style>', css, html, flags=_re.S)
    return html
# Enlaces HTML de verdad a las 40 ciudades con mas sitios, en el pie de la
# bienvenida: para quien no usa el buscador y para que Google llegue a las fichas
# de ciudad desde la portada (hoy la portada es casi todo JavaScript).
def _slug(name):
    import unicodedata as _u
    x=_u.normalize('NFD', name.lower()); x=re.sub(r'[\u0300-\u036f]','',x); x=re.sub(r'[^a-z0-9]+','-',x).strip('-'); return x or 'city'
try:
    _cnt={}
    _gr={}
    for pl in places: _gr.setdefault((int(pl[1]//10000),int(pl[2]//10000)),[]).append(pl)   # lat/lon *1e5 -> celdas de 0.1
    for c in cities:
        la,lo=c[1],c[2]; n=0
        for i in range(-1,2):
            for j in range(-1,2):
                for pl in _gr.get((int(la*1e5//10000)+i,int(lo*1e5//10000)+j),[]):
                    if abs(pl[1]/1e5-la)<0.1 and abs(pl[2]/1e5-lo)<0.13: n+=1
        _cnt[c[0]]=n
    _top=sorted(cities,key=lambda c:-_cnt.get(c[0],0))[:40]
    _seen=set(); _links=[]
    for c in _top:
        # mismo criterio que city_pages.split_name: la parte latina de «Αθήνα · Athens»
        parts=[x.strip() for x in c[0].split('·')]
        lat_=[x for x in parts if re.search(r'[A-Za-z]',x) and not re.search(r'[\u0400-\u04FF\u0370-\u03FF\u0600-\u06FF\u0590-\u05FF\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF\u0900-\u097F]',x)]
        nm = parts[0] if len(parts)==1 else (lat_[0] if len(lat_)==1 else parts[-1])
        sl=_slug(nm)
        if sl in _seen: continue
        _seen.add(sl); _links.append('<a href="c/%s.html">%s</a>' % (sl, nm))
    html=html.replace('<!--__CITYLINKS__-->', ' '.join(_links), 1)
except Exception as _ex: print('citylinks:', _ex)
open('index.full.html','w',encoding='utf-8').write(html)   # sin minificar: lo leen pages.py, city_pages.py, social.py...
html=_minify(html)
# Politica de seguridad (CSP): solo se ejecutan los <script> de esta pagina
# (por su huella sha256) y qr.js; los datos solo se piden a los servicios que
# usa el mapa. Si alguien colara HTML en un nombre de OpenStreetMap, el
# navegador no ejecutaria nada. Se calcula despues de minificar.
def _csp(h):
    import base64 as _b64, hashlib as _hl, re as _re
    hs=[]
    for m in _re.finditer(r'<script(?![^>]*\bsrc=)(?![^>]*application/ld\+json)[^>]*>(.*?)</script>', h, flags=_re.S):
        hs.append("'sha256-%s'" % _b64.b64encode(_hl.sha256(m.group(1).encode('utf-8')).digest()).decode())
    tiles='https://server.arcgisonline.com https://tile.openstreetmap.org'
    pol=("default-src 'self'; script-src 'self' https://static.cloudflareinsights.com %s; style-src 'self' 'unsafe-inline'; "
         "img-src 'self' data: blob: %s https://commons.wikimedia.org https://upload.wikimedia.org; "
         "connect-src 'self' %s https://nominatim.openstreetmap.org https://photon.komoot.io https://overpass-api.de "
         "https://overpass.kumi.systems https://overpass.private.coffee https://api.openstreetmap.org https://api.open-meteo.com "
         "https://routing.openstreetmap.de https://cloudflareinsights.com; font-src 'self' data:; worker-src 'self'; manifest-src 'self'; media-src 'self' blob:; "
         "object-src 'none'; base-uri 'self'; form-action 'self'") % (' '.join(hs), tiles, tiles)
    tag='<meta http-equiv="Content-Security-Policy" content="%s">' % pol
    return h.replace('<meta charset="utf-8">', '<meta charset="utf-8">'+tag, 1) if '<meta charset="utf-8">' in h else _re.sub(r'(<head[^>]*>)', r'\1'+tag, h, count=1)
if not os.environ.get('NO_CSP'): html=_csp(html)
open('index.html','w',encoding='utf-8').write(html)

c=Counter(CATIDS[p[3]] for p in places)
print('places:',len(places)); print(dict(c))
print('ciudades:',ncities,'(',len(WORLD),'del mundo +',len(CITY_LIST),'de España ) | paises:',countries)
print('strings interned:',len(table))
print('nucleo incrustado:',len(core),'sitios |',round(len(data.encode())/1024,1),'KB')
print('trozos:',len(buckets),'ficheros |',round(chunk_bytes/1024,1),'KB en total')
print('index.html:',round(len(html.encode())/1024,1),'KB')
