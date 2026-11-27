# -*- coding: utf-8 -*-
"""English guides (69-72 and English versions)."""
from articles import art

UKIE = 'cc=GB,IE'
NA = 'cc=US,CA'
ANZ = 'cc=AU,NZ,SG'

art('free-showers-near-me', 'en', 'Free showers near me: where to shower for free, city by city',
    'Where to find a free shower in UK, Irish, US, Canadian and Australian cities: day centres, shelters, leisure centres and public baths. With counts per city.',
    """
! Free showers are mostly at **day centres for people who are homeless, night shelters, some leisure centres and public baths**. Below is how many public showers and toilets the open map knows near the centre of each city, with a link to the list.

## Where to look

- **Day centres** for people who are homeless: shower, towel and often a washing machine. Some ask you to register first.
- **Night shelters**: you can shower if you stay; some allow showers at a set time for non-residents.
- **Public baths and leisure centres**: usually paid, but some councils and charities give free passes.
- **Beach showers**: free, cold, and usually summer only.
- **Truck stops and gyms**: paid, but often the only option late at night.

## UK and Ireland

{{table:hygiene|cc=GB,IE|City|Showers and toilets on the map|List|see the list}}

## US and Canada

{{table:hygiene|cc=US,CA|City|Showers and toilets on the map|List|see the list}}

## Australia, New Zealand and Singapore

{{table:hygiene|cc=AU,NZ,SG|City|Showers and toilets on the map|List|see the list}}

## What to bring

Flip-flops, a small towel, a bag for wet clothes and soap if you have it. If you need clean clothes, ask the same centre about a clothing bank.

## If your city shows nothing

The help often exists but nobody has put it on the open map. Ask at a day centre, a soup kitchen or the council's homelessness team. If you find one, [add it to the map](add-your-organisation).
""",
    faq=[('Where can I shower for free if I am homeless?', 'At day centres for people who are homeless and at night shelters. Some leisure centres and public baths offer free passes through charities or the council.'),
         ('Are there free public showers in London?', 'There are a few public baths and many day centres with showers. The open map lists 55 showers and public toilets within 10 km of central London; see [showers in London](../c/london-hygiene).')],
    rel=['free-medical-care', 'food-banks-open-today', 'homeless-help-london'], cat='need', alts={'es': 'duchas-gratis', 'fr': 'douches-gratuites'},
    cta=('../?need=hygiene', 'Show showers on the map'))

art('free-medical-care', 'en', 'Free medical care near me: hospitals, free clinics and who can use them',
    'Where to get free medical care in the UK, Ireland, the US, Canada, Australia and Singapore, and how many hospitals and clinics the map shows in each city.',
    """
! **Emergency departments treat anyone who needs urgent care.** For non-urgent care, look for free clinics, walk-in centres and charity health services; the map shows hospitals, public health centres and charity clinics near you.

## By country, in one line

- **UK**: A&E and GP registration are free for everyone; you do not need ID or proof of address to register with a GP. NHS 111 gives advice day and night.
- **Ireland**: emergency departments charge a fee unless you have a medical card or a GP referral; ask the HSE about a medical card.
- **US**: emergency rooms must screen and stabilise anyone; free and sliding-scale clinics serve people without insurance.
- **Canada and Australia**: public hospitals treat emergencies; free community clinics serve people without coverage.
- **Singapore**: free clinics run by charities serve low-income residents.

## UK and Ireland

{{table:health|cc=GB,IE|City|Hospitals and clinics on the map|List|see the list}}

## US and Canada

{{table:health|cc=US,CA|City|Hospitals and clinics on the map|List|see the list}}

## Australia, New Zealand and Singapore

{{table:health|cc=AU,NZ,SG|City|Hospitals and clinics on the map|List|see the list}}

## In Spain?

See the Spanish guide [médico gratis sin papeles](medico-gratis-sin-papeles): since Royal Decree 180/2026, people without legal residence can apply for public health care.
""",
    faq=[('Can I see a GP in England without an address?', 'Yes. The NHS says you do not need proof of address or ID to register with a GP.'),
         ('Do emergency rooms in the US treat people without insurance?', 'Yes. Hospitals with emergency departments must screen and stabilise anyone with an emergency, regardless of insurance.')],
    src=[('NHS: how to register with a GP surgery', 'https://www.nhs.uk/nhs-services/gp-surgeries/how-to-register-with-a-gp-surgery/'),
         ('CMS: Emergency Medical Treatment & Labor Act (EMTALA)', 'https://www.cms.gov/medicare/regulations-guidance/legislation/emergency-medical-treatment-labor-act')],
    rel=['free-showers-near-me', 'food-banks-open-today', 'emergency-numbers-by-country'], cat='need', alts={'es': 'medico-gratis-sin-papeles'},
    cta=('../?need=health', 'Show health care on the map'))

art('food-banks-open-today', 'en', 'Food banks and free meals open today',
    'How to get free food today: soup kitchens, food banks, community fridges and giveaway boxes, with how many the map shows in each city.',
    """
! For a **hot meal today**, go to a soup kitchen or community meal: most need no referral. **Food banks** usually give a parcel of groceries and, in the UK, often ask for a referral voucher from an agency such as Citizens Advice, a GP or the council. **Community fridges** and giveaway boxes are free to anyone.

## The four kinds of free food

- **Soup kitchens and community meals**: hot food at set times, usually no questions asked.
- **Food banks**: groceries for a few days. In the UK many use referral vouchers; ask your council or Citizens Advice.
- **Community fridges**: anyone can take food, no referral.
- **Giveaway boxes** and little free pantries: small, but open all day.

## UK and Ireland

{{table:food|cc=GB,IE|City|Free food on the map|List|see the list}}

## US and Canada

In the US and Canada, food banks are usually called **food pantries**.

{{table:food|cc=US,CA|City|Free food on the map|List|see the list}}

## Australia, New Zealand and Singapore

{{table:food|cc=AU,NZ,SG|City|Free food on the map|List|see the list}}

## Open at weekends (per their hours on the map)

{{weekend:cc=GB,IE,US,CA,AU,NZ|food}}

Hours on the map are added by volunteers and can change. Call first if you can.
""",
    faq=[('Do I need a referral for a food bank in the UK?', 'Many UK food banks work with referral vouchers from agencies such as Citizens Advice, GPs or the council. Soup kitchens and community fridges do not need one.'),
         ('What is a community fridge?', 'A fridge where anyone can leave or take food for free, usually run by a local group to cut food waste.')],
    rel=['free-showers-near-me', 'what-to-donate-food-bank', 'free-help-uk-ireland'], cat='need', alts={'es': 'comedores-sociales-abiertos-hoy', 'fr': 'ou-manger-gratuitement'},
    cta=('../?need=food', 'Show free food on the map'))

art('free-help-uk-ireland', 'en', 'Homeless charities and free help in UK and Irish cities',
    'Charities, day centres, shelters and social services the map shows in Leeds, Birmingham, Cork, Dublin, London and other UK and Irish cities.',
    """
! The quickest way in is the **council's homelessness team** (UK) or the **local authority homeless services** (Ireland). For someone sleeping rough in England and Wales, **StreetLink** (0300 500 0914) connects them with an outreach team. In Dublin, the homeless freephone is **1800 707 707**.

## Helplines

{{phones:GB|en}}
{{phones:IE|en}}

## Shelters by city

{{table:shelter|cc=GB,IE|City|Shelters on the map|List|see the list}}

## Charities and social services by city

{{table:social|cc=GB,IE|City|Charities and services on the map|List|see the list}}

## City guides

[Dublin](homeless-help-dublin) · [London](homeless-help-london) · [Cold weather shelters](cold-weather-shelters-uk-ireland)
""",
    rel=['homeless-help-dublin', 'homeless-help-london', 'cold-weather-shelters-uk-ireland'], cat='city')

art('homeless-help-dublin', 'en', 'Homeless help in Dublin: where to start',
    'Who to call in Dublin (homeless freephone 1800 707 707), the Cold Weather Strategy 2026/27, and where to eat, sleep and shower for free.',
    """
! In Dublin, call the **homeless freephone on 1800 707 707** for emergency accommodation. The Dublin Region Homeless Executive has activated its **Cold Weather Strategy 2026/27** to add emergency beds this winter.

## Who to call

{{phones:IE|en}}

- **Dublin City Council Homeless Services public office**: 01 222 6944, Parkgate Hall, Islandbridge, Dublin 8.
- **112 or 999** if someone's life is in danger.

## Food

{{top:dublin|food|8}}

## Shelters

{{top:dublin|shelter|8}}

## Showers and toilets

{{top:dublin|hygiene|5}}

[All free help in Dublin](../c/dublin) · [Print a poster for Dublin](../c/dublin.cartel)
""",
    src=[('Dublin Region Homeless Executive: Cold Weather Strategy 2026/27', 'https://www.homelessdublin.ie/cold-weather-strategy-2025-2026'),
         ('Dublin Region Homeless Executive: contact', 'https://www.homelessdublin.ie/contact')],
    rel=['free-help-uk-ireland', 'cold-weather-shelters-uk-ireland', 'food-banks-open-today'], cat='city', cta=('../?city=Dublin&cc=IE', 'Open the map of Dublin'))

art('homeless-help-london', 'en', 'Homeless help in London: where to start',
    'StreetLink, Shelter’s free helpline, SWEP cold-weather beds and where to eat, sleep and shower for free in London.',
    """
! If you see someone sleeping rough in London, **tell StreetLink** (thestreetlink.org.uk, 0300 500 0914) so an outreach team can find them. If you are homeless, contact your **local council's housing team**; **Shelter's free helpline is 0808 800 4444**. In freezing weather, **SWEP** opens extra emergency beds.

## Who to call

{{phones:GB|en}}

- **999** if someone's life is in danger.

## SWEP this winter

London's Severe Weather Emergency Protocol opens extra beds when the forecast falls to 0 °C or below. It was first activated this winter on 13 November 2026. Some boroughs are also trialling an "Enhanced SWEP" that opens beds when there is a Cold Health Alert, even above freezing. Last winter SWEP ran for 11 nights and boroughs housed 1,491 people.

## Food

{{top:london|food|8}}

## Shelters

{{top:london|shelter|8}}

## Showers and toilets

{{top:london|hygiene|6}}

[All free help in London](../c/london) · [Print a poster for London](../c/london.cartel)
""",
    src=[('Mayor of London: emergency severe weather plan activated for first time this winter (13 November 2026)', 'https://www.london.gov.uk/mayor-and-london-boroughs-activate-emergency-severe-weather-plan-first-time-winter'),
         ('Homeless Link: Severe Weather Emergency Protocol (SWEP)', 'https://homeless.org.uk/knowledge-hub/severe-weather/severe-weather-emergency-protocol-swep/'),
         ('Shelter: free housing advice helpline', 'https://england.shelter.org.uk/get_help/helpline')],
    rel=['cold-weather-shelters-uk-ireland', 'free-help-uk-ireland', 'free-showers-near-me'], cat='city', cta=('../?city=London&cc=GB', 'Open the map of London'))

art('cold-weather-shelters-uk-ireland', 'en', 'Cold weather shelters this winter: SWEP, Dublin, Madrid and Barcelona',
    'When extra emergency beds open in freezing weather (SWEP in England, Dublin’s Cold Weather Strategy, Madrid and Barcelona) and how to get one.',
    """
! In England, councils open extra beds under **SWEP** when temperatures are forecast at 0 °C or below; in London it was first activated this winter on 13 November 2026. **To help someone sleeping rough, tell StreetLink.** In Dublin, call **1800 707 707**. In Madrid the winter campaign runs from 2 November 2026 to 16 April 2027.

## England (SWEP)

- Each council decides and announces its own activation; check its website.
- The aim is that anyone sleeping rough who wants to come inside can do so, with no conditions attached to the bed.
- Members of the public: report a person sleeping rough to StreetLink so an outreach team can find them.

## Dublin

The Dublin Region Homeless Executive has activated its Cold Weather Strategy 2026/27 to expand emergency accommodation. Homeless freephone: 1800 707 707.

## Madrid and Barcelona

- **Madrid**: Campaña del Frío from the night of 2 November 2026 to the morning of 16 April 2027, with 150 beds at Pinar de San José, 142 for men at Villa de Vallecas and up to 150 hostel places. Access: SAMUR Social, 91 919 89 13 (8:00 to 21:00).
- **Barcelona**: Operació Fred adds places on days with cold alerts. CUESB: 900 703 030, free, 24 hours.

## Shelters on the map

{{table:shelter|cc=GB,IE|City|Shelters on the map|List|see the list}}
""",
    src=[('Mayor of London: SWEP activated (13 November 2026)', 'https://www.london.gov.uk/mayor-and-london-boroughs-activate-emergency-severe-weather-plan-first-time-winter'),
         ('Homeless Link: SWEP guidance', 'https://homeless.org.uk/knowledge-hub/severe-weather/severe-weather-emergency-protocol-swep/'),
         ('Dublin Region Homeless Executive: Cold Weather Strategy', 'https://www.homelessdublin.ie/cold-weather-strategy-2025-2026'),
         ('SAMUR Social: Campaña contra el Frío 2026/2027', 'https://www.madrid.es/UnidadesDescentralizadas/IntegracionyEmergenciaSocial/SAMUR%20Social/ficheros/DOCUMENTO%20DERIVACI%C3%93N%20CF%2026-27.pdf')],
    rel=['homeless-help-london', 'homeless-help-dublin', 'help-someone-homeless-winter'], cat='season', alts={'es': 'campana-de-frio-2026-2027'})

art('help-someone-homeless-winter', 'en', 'How to help someone who is homeless in winter',
    'What to do if you see someone sleeping rough in the cold: who to call, what to bring and how to talk to them.',
    """
! Ask if they are OK and whether they want you to contact the local outreach service: **StreetLink** in England and Wales, the **homeless freephone (1800 707 707)** in Dublin. **If they don't respond or seem unwell, call 999 or 112.**

## Step by step

1. **Say hello and ask their name.** They may not want to talk; respect that.
2. **Report it** with the exact location and a short description, so an outreach team can find them.
3. **Call 999 or 112** if someone is unresponsive, shivering badly, or wet and very cold.

## What helps most

- A hot drink and food that needs no cooking.
- Socks, gloves and a hat.
- The address of the nearest shelter and soup kitchen: SupportNear on their phone or a [printed poster for the city](carteles-imprimibles).

## Help that lasts

Volunteer at a soup kitchen, [donate to a food bank](what-to-donate-food-bank), or [add a missing service to the map](add-your-organisation).
""",
    rel=['cold-weather-shelters-uk-ireland', 'what-to-donate-food-bank', 'giving-tuesday-2026'], cat='help', alts={'es': 'ayudar-a-una-persona-sin-hogar-en-invierno'})

art('what-to-donate-food-bank', 'en', 'What to donate to a food bank (and what not to)',
    'The items food banks ask for most, what they cannot accept, and why money helps too.',
    """
! Food banks mostly need **long-life food that needs no fridge**: milk (UHT), oil, tinned fish, meat and vegetables, rice, pasta and pulses, plus toiletries and baby items if they ask. Don't give fresh or chilled food unless the collection point can store it.

## Yes

- UHT milk, cooking oil, tinned fish, meat, tomatoes and vegetables.
- Rice, pasta, lentils and beans; breakfast cereal.
- Baby food, nappies and period products if they ask for them.

## No

- Fresh, chilled or homemade food.
- Opened, damaged or out-of-date items.

## Money helps too

With cash a food bank can buy exactly what it is short of, including fresh food that rarely comes in as donations.

## Find a food bank

{{table:volunteer|cc=GB,IE|City|Food banks and soup kitchens|Page|donate or volunteer}}
""",
    rel=['giving-tuesday-2026', 'help-someone-homeless-winter', 'food-banks-open-today'], cat='help', alts={'es': 'que-donar-a-un-banco-de-alimentos'})

art('giving-tuesday-2026', 'en', 'Giving Tuesday, 1 December 2026: give to the places on the map',
    'Giving Tuesday falls on 1 December 2026. How to give locally: food banks, soup kitchens and shelters near you, with their volunteer and donation pages.',
    """
! **Giving Tuesday is on 1 December 2026.** The simplest gift that goes far is local: a food bank, a soup kitchen or a shelter in your own city. Every city on SupportNear with a food page has a **volunteer and donate** page listing them, with phone numbers.

## Three ways to give

1. **Money to a local food bank or shelter**: they buy exactly what they lack.
2. **Long-life food**: see [what to donate](what-to-donate-food-bank).
3. **Time**: winter and holidays are when soup kitchens are shortest of volunteers.

## Volunteer and donate pages

{{table:volunteer|cc=GB,IE,US,CA,AU,NZ|City|Food banks and soup kitchens|Page|donate or volunteer}}

## Give to the map itself

SupportNear is free and non-profit. The best way to help it is to [add a missing service](add-your-organisation) or share it with a library or day centre.
""",
    rel=['what-to-donate-food-bank', 'help-someone-homeless-winter'], cat='help')

art('emergency-numbers-by-country', 'en', 'Emergency numbers by country',
    'The emergency number in every country (112, 911, 999...) plus the social helplines we know, checked by hand.',
    """
! **112 works free from any mobile in the European Union**, even without credit. It is **911** in the US, Canada and much of the Americas, and **999** (or 112) in the UK and Ireland.

## Social helplines

{{phones:GB|en}}
{{phones:IE|en}}
{{phones:ES|en}}

## Every country

Checked by hand in September 2026 against official sources and Wikipedia. Spot a mistake? Email hello@supportnear.com.

{{emergency:en}}

Download as [CSV](../emergency-numbers.csv).
""",
    rel=['free-help-uk-ireland', 'free-medical-care'], cat='city', alts={'es': 'telefonos-de-emergencia-por-pais'})

art('refugee-reception-centres', 'en', 'Refugee reception centres on the map, city by city',
    'Refugee reception centres and asylum offices the open map shows in each city, and first steps on arrival.',
    """
! If you have just arrived fleeing your country, **apply for international protection as soon as you can** and look for a reception organisation. Below are the refugee reception centres the open map shows, city by city.

## Reception centres

{{types:all|shelter|r[eé]fug|6|60}}

## Other languages

[Español](refugiados-centros-de-acogida) · [Українською](dovidnyk-dlia-bizhentsiv) · [По-русски](spravochnik-dlya-bezhentsev) · [بالعربية](dalil-lil-wafidin) · [اردو میں](naye-aane-walon-ke-liye)
""",
    rel=['emergency-numbers-by-country', 'free-medical-care'], cat='city', alts={'es': 'refugiados-centros-de-acogida'})

art('add-your-organisation', 'en', 'How to add or correct your organisation on the map',
    'Put your soup kitchen, shelter, shower or service on OpenStreetMap with the right tags so it appears on SupportNear and other apps.',
    """
! SupportNear's places come from **OpenStreetMap**, the open map anyone can edit. Add or correct your organisation there and it appears on SupportNear at the next monthly update.

## Quick fixes

- **Closed**: mark it from its page on SupportNear.
- **Wrong hours or phone**: email hello@supportnear.com with the link and the right details, or fix it on OpenStreetMap.

## Add it yourself (10 minutes)

1. Create a free account at [openstreetmap.org](https://www.openstreetmap.org/).
2. Find the street and press **Edit**; the iD editor has a 5-minute tutorial.
3. Drop a point at the entrance and choose the type.
4. Fill in name, address, `opening_hours`, phone and website, then save.

## Tags SupportNear reads

- Soup kitchen: `amenity=social_facility` + `social_facility=soup_kitchen`
- Food bank: `amenity=social_facility` + `social_facility=food_bank`
- Shelter: `amenity=social_facility` + `social_facility=shelter`
- Free clothing: `amenity=social_facility` + `social_facility=clothing_bank`
- Shower: `amenity=shower` (+ `fee=no` if free); toilets: `amenity=toilets`
- Drinking water: `amenity=drinking_water`
- Who it serves: `social_facility:for=homeless`, `women`, `migrant`...

Opening hours look like `Mo-Fr 13:00-15:00; Sa 13:00-14:30`.
""",
    src=[('OpenStreetMap Wiki: social_facility', 'https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dsocial_facility')],
    rel=['free-help-map-report-2026', 'giving-tuesday-2026'], cat='pro', alts={'es': 'anadir-o-corregir-tu-entidad'})

art('free-help-map-report-2026', 'en', 'The free help map 2026: what the open map knows, and what it misses',
    'How many soup kitchens, shelters, showers, clinics and social services the open map shows across SupportNear cities, which countries are best covered and where the gaps are.',
    """
! Across SupportNear's 1,221 cities, the open map knows far more **hospitals and libraries** than **soup kitchens, shelters and free showers**, and very few of those have opening hours. The most basic help is the worst mapped.

## Places by country

All categories, within 10 km of SupportNear cities.

{{countries:en}}

## Showers and toilets in European cities

{{rbars:cc=ES,PT,FR,IT,DE,AT,CH,BE,NL,IE,GB,DK,SE,NO,FI,PL,CZ,HU,RO,GR,UA|hygiene|20}}

## Free food in UK and Irish cities

{{rbars:cc=GB,IE|food|15}}

## Opening hours are missing

{{hshare:cc=GB,IE|en}}

## Spain in detail

See the Spanish report: [Mapa de la ayuda gratuita en España 2026](informe-ayuda-gratuita-espana-2026).

Data: OpenStreetMap, downloaded 28 October 2026. Free to quote with a link to this page; raw data in [open data](datos-abiertos-y-widget).
""",
    rel=['add-your-organisation', 'emergency-numbers-by-country'], cat='data', alts={'es': 'informe-ayuda-gratuita-espana-2026'}, kind='Report')
