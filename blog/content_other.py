# -*- coding: utf-8 -*-
"""Francais, portugais, allemand, ukrainien, russe, arabe, ourdou (73-77)."""
from articles import art

art('douches-gratuites', 'fr', 'Douches gratuites : où se laver gratuitement, ville par ville',
    'Bains-douches municipaux, accueils de jour et centres d’hébergement : où prendre une douche gratuite en France, Belgique et Suisse, avec le nombre de lieux par ville.',
    """
! Les douches gratuites se trouvent surtout dans les **bains-douches municipaux, les accueils de jour et les centres d’hébergement**. Paris compte plusieurs bains-douches municipaux gratuits. Ci-dessous, le nombre de douches et toilettes publiques que la carte ouverte connaît près du centre de chaque ville.

## Où chercher

- **Bains-douches municipaux** : gratuits dans plusieurs villes, dont Paris.
- **Accueils de jour** pour personnes sans abri : douche, serviette, souvent machine à laver.
- **Centres d’hébergement** : douche pour les personnes hébergées.
- **En urgence** : le **115** (Samu social), gratuit, 24 h/24, oriente vers un hébergement.

## Par ville

{{table:hygiene|cc=FR,BE,CH,LU|Ville|Douches et toilettes sur la carte|Liste|voir la liste}}

## Paris

{{top:paris|hygiene|8}}

Si votre ville n’affiche rien, l’aide existe peut-être mais n’est pas sur la carte. Vous pouvez [l’ajouter](add-your-organisation).
""",
    faq=[('Les bains-douches de Paris sont-ils gratuits ?', 'Oui, les bains-douches municipaux de Paris sont gratuits. Les horaires varient : vérifiez sur la carte ou auprès de la mairie.'),
         ('Quel numéro appeler pour un hébergement d’urgence ?', 'Le 115, gratuit et ouvert 24 h/24 en France.')],
    rel=['ou-manger-gratuitement'], cat='need', alts={'es': 'duchas-gratis', 'en': 'free-showers-near-me'}, cta=('../?need=hygiene', 'Voir les douches sur la carte'))

art('ou-manger-gratuitement', 'fr', 'Où manger gratuitement aujourd’hui : distributions et restos solidaires',
    'Distributions alimentaires, banques alimentaires, frigos solidaires : où manger gratuitement dans votre ville, avec le nombre de lieux sur la carte.',
    """
! Pour un **repas chaud aujourd’hui**, cherchez une distribution alimentaire ou un restaurant solidaire. Les **banques alimentaires** distribuent surtout via des associations, souvent sur orientation d’un travailleur social. Les **frigos solidaires** sont ouverts à tous.

## Par ville

{{table:food|cc=FR,BE,CH,LU|Ville|Lieux sur la carte|Liste|voir la liste}}

## Paris

{{top:paris|food|8}}

## En urgence

Le **115** (gratuit, 24 h/24) oriente vers un hébergement et parfois vers un repas. En cas de danger, appelez le **112**.
""",
    rel=['douches-gratuites'], cat='need', alts={'es': 'comedores-sociales-abiertos-hoy', 'en': 'food-banks-open-today'}, cta=('../?need=food', 'Voir sur la carte'))

art('onde-comer-e-tomar-banho-gratis', 'pt', 'Onde comer e tomar banho grátis em Portugal e no Brasil',
    'Cantinas sociais, bancos alimentares, balneários e casas de banho públicas: onde há ajuda grátis em cada cidade, com o número de sítios no mapa.',
    """
! Para comer hoje, procure uma **cantina social** ou um **refeitório social**; os **bancos alimentares** distribuem através de instituições. Para tomar banho, procure **balneários públicos** e **centros de acolhimento**. Em perigo, ligue **112** (Portugal) ou **192/190** (Brasil).

## Comida, por cidade

{{table:food|cc=PT,BR|Cidade|Sítios no mapa|Lista|ver a lista}}

## Banhos e casas de banho, por cidade

{{table:hygiene|cc=PT,BR|Cidade|Sítios no mapa|Lista|ver a lista}}

## Lisboa

{{top:lisboa|food|6}}
""",
    rel=[], cat='need', cta=('../', 'Abrir o mapa'))

art('notschlafstellen', 'de', 'Notschlafstellen und kostenlose Hilfe in Deutschland, Österreich und der Schweiz',
    'Notschlafstellen, Tafeln, Wärmestuben und Duschen: wie viele die offene Karte in jeder Stadt kennt, und wen man anruft.',
    """
! Für einen Schlafplatz heute Nacht: **Notschlafstelle** oder Notübernachtung der Stadt. Die Stadtverwaltung (Sozialamt) oder die **Wohnungslosenhilfe** vermittelt. Bei Lebensgefahr: **112**.

## Schlafplätze nach Stadt

{{table:shelter|cc=DE,AT,CH|Stadt|Notunterkünfte auf der Karte|Liste|zur Liste}}

## Essen nach Stadt

Tafeln geben Lebensmittel meist gegen Nachweis aus; Suppenküchen und Wärmestuben geben warmes Essen ohne Formalitäten.

{{table:food|cc=DE,AT,CH|Stadt|Orte auf der Karte|Liste|zur Liste}}

## Duschen und Toiletten

{{table:hygiene|cc=DE,AT,CH|Stadt|Orte auf der Karte|Liste|zur Liste}}

Fehlt ein Ort? Man kann ihn [in OpenStreetMap eintragen](add-your-organisation).
""",
    rel=[], cat='need', cta=('../?need=shelter', 'Karte öffnen'))

REF = """
! {a}

## {b}

1. {c}
2. {d}
3. {e}

## {f}

{{{{types:all|shelter|r[eé]fug|6|60}}}}

## {g}

[Español](refugiados-centros-de-acogida) · [English](refugee-reception-centres)
"""

art('dovidnyk-dlia-bizhentsiv', 'uk', 'Довідник для біженців: центри прийому на карті',
    'Центри прийому біженців, які є на відкритій карті, місто за містом, і перші кроки після прибуття.',
    REF.format(a='Якщо ви щойно прибули, якнайшвидше зверніться по захист (тимчасовий або міжнародний) і знайдіть організацію, що допомагає біженцям. Нижче центри прийому, які є на карті.',
               b='Перші кроки', c='Зверніться по захист у поліцію або до служби у справах притулку.', d='Попросіть місце в системі прийому через організації, що нею керують.',
               e='Невідкладна медична допомога доступна в лікарнях. У надзвичайній ситуації телефонуйте 112.', f='Центри прийому на карті', g='Іншими мовами'),
    rel=[], cat='city', alts={'es': 'refugiados-centros-de-acogida', 'en': 'refugee-reception-centres'})

art('spravochnik-dlya-bezhentsev', 'ru', 'Справочник для беженцев: центры приёма на карте',
    'Центры приёма беженцев на открытой карте, город за городом, и первые шаги после прибытия.',
    REF.format(a='Если вы только что прибыли, как можно скорее обратитесь за защитой (временной или международной) и найдите организацию, помогающую беженцам. Ниже центры приёма, которые есть на карте.',
               b='Первые шаги', c='Обратитесь за защитой в полицию или в службу по делам убежища.', d='Попросите место в системе приёма через организации, которые ею управляют.',
               e='Неотложную медицинскую помощь оказывают в больницах. В экстренной ситуации звоните 112.', f='Центры приёма на карте', g='На других языках'),
    rel=[], cat='city', alts={'es': 'refugiados-centros-de-acogida', 'en': 'refugee-reception-centres'})

art('dalil-lil-wafidin', 'ar', 'دليل للقادمين الجدد واللاجئين: مراكز الاستقبال على الخريطة',
    'مراكز استقبال اللاجئين الموجودة على الخريطة المفتوحة، مدينة بمدينة، والخطوات الأولى عند الوصول.',
    REF.format(a='إذا وصلت للتو، اطلب الحماية الدولية في أقرب وقت وابحث عن منظمة تساعد اللاجئين. في الأسفل مراكز الاستقبال الموجودة على الخريطة.',
               b='الخطوات الأولى', c='اطلب الحماية لدى الشرطة أو مكتب اللجوء.', d='اطلب مكانًا في نظام الاستقبال عبر المنظمات التي تديره.',
               e='المستشفيات تقدم الرعاية الطارئة. في حالة الخطر اتصل بـ 112.', f='مراكز الاستقبال على الخريطة', g='بلغات أخرى'),
    rel=[], cat='city', alts={'es': 'refugiados-centros-de-acogida', 'en': 'refugee-reception-centres'})

art('naye-aane-walon-ke-liye', 'ur', 'نئے آنے والوں اور پناہ گزینوں کے لیے رہنمائی: نقشے پر استقبالیہ مراکز',
    'کھلے نقشے پر موجود پناہ گزینوں کے استقبالیہ مراکز، شہر بہ شہر، اور پہنچنے کے بعد پہلے اقدامات۔',
    REF.format(a='اگر آپ ابھی پہنچے ہیں تو جلد از جلد بین الاقوامی تحفظ کی درخواست دیں اور پناہ گزینوں کی مدد کرنے والی تنظیم تلاش کریں۔ نیچے نقشے پر موجود استقبالیہ مراکز ہیں۔',
               b='پہلے اقدامات', c='پولیس یا پناہ کے دفتر میں تحفظ کی درخواست دیں۔', d='استقبال کے نظام میں جگہ کے لیے اسے چلانے والی تنظیموں سے رابطہ کریں۔',
               e='ہسپتال ہنگامی علاج فراہم کرتے ہیں۔ خطرے کی صورت میں 112 پر کال کریں۔', f='نقشے پر استقبالیہ مراکز', g='دوسری زبانوں میں'),
    rel=[], cat='city', alts={'es': 'refugiados-centros-de-acogida', 'en': 'refugee-reception-centres'})
