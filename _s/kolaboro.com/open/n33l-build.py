#!/usr/bin/env python3
# kolaboro.com batch 33 (n33l, 20 Nov 2026): builds /data/n33l.json, read once per isolate by _worker.js/kbx_n33l.js.
#   - the site footer (fewer sitewide links: Markets, Buyers, Data, About), the 12 biggest markets in each language (items 63, 74)
#   - the HTML site map /sitemap/ by country and market (item 76), with the pages that left the footer
#   - "Most searched this month" (item 64): pages behind the Google searches with the most impressions, from Search Console
#     (last 28 days, read on 20 Nov 2026; see docs-out kolaboro-seo-100-20nov.md "Where they come from")
# Inputs: data/named.json (projects), a list of existing URLs (one path per line: the live sitemaps plus a live check), a
# names file with market and country names in 8 languages (dumped from _worker.js/kbx_hdate.js mkName/coName), and the
# footer labels as the translated footers carry them today.
# Usage: python3 n33l-build.py <named.json> <urls.txt> <names.json> <footer-labels.json> <out.json> [lsw.css]
import json, re, sys, collections, unicodedata

L = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar']
COI = re.compile(r'sumba|eco\s*beach\s*city|\bequinox\b', re.I)
named, urls, names, ftl, out = sys.argv[1:6]
LSW_CSS = open(sys.argv[6]).read().strip() if len(sys.argv) > 6 else ''   # the language menu CSS of the home page (style#lsw-css), for pages that lack the menu
D = json.load(open(named)); U = set(x.strip() for x in open(urls) if x.strip()); N = json.load(open(names)); F = json.load(open(ftl))
pre = lambda l: '' if l == 'en' else '/' + l

def slug_c(c):   # same slug as /countries/<c>/ (kbx_seo.js, kolaboro.js cs8)
    c = {'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia'}.get(c, c)
    c = unicodedata.normalize('NFKD', c); c = ''.join(ch for ch in c if not unicodedata.combining(ch)).lower().replace('&', ' and ')
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', c))
def slug_m(m):   # same slug as /m/<market>/ (kolaboro.js slugM)
    from urllib.parse import quote
    return quote(re.sub(r'\s+', '-', m.lower()), safe="-_.!~*'()")
def loc(path, l):   # the page in language l when it exists, else the English page
    if l != 'en' and (pre(l) + path) in U: return pre(l) + path
    return path

P = [p for p in D['projects'] if p.get('mk') and not COI.search(str(p.get('mk')) + ' ' + str(p.get('n')) + ' ' + str(p.get('dv')))]
mkc = collections.Counter(p['mk'] for p in P)
co_of = {}
for p in P: co_of.setdefault(p['mk'], collections.Counter())[p['co']] += 1
nm = lambda kind, k, l: (N[kind].get(k) or {}).get(l) or k

# ---------------------------------------------------------------- labels (new strings; the others come from today's footers)
NEW = {
 'h_markets': ['Markets', 'Mercados', 'Märkte', 'Marchés', 'Markten', 'Рынки', '市场', 'الأسواق'],
 'h_about': ['About', 'Sobre Kolaboro', 'Über Kolaboro', 'À propos', 'Over Kolaboro', 'О Kolaboro', '关于 Kolaboro', 'عن Kolaboro'],
 'all_projects': ['All projects', 'Todos los proyectos', 'Alle Projekte', 'Tous les projets', 'Alle projecten', 'Все проекты', '全部项目', 'كل المشاريع'],
 'countries': ['Countries', 'Países', 'Länder', 'Pays', 'Landen', 'Страны', '国家', 'الدول'],
 'rankings': ['Rankings', 'Rankings', 'Rankings', 'Classements', 'Ranglijsten', 'Рейтинги', '排名', 'التصنيفات'],
 'open_data': ['Open data', 'Datos abiertos', 'Offene Daten', 'Données ouvertes', 'Open data', 'Открытые данные', '开放数据', 'البيانات المفتوحة'],
 'map': ['World map', 'Mapa mundial', 'Weltkarte', 'Carte du monde', 'Wereldkaart', 'Карта мира', '世界地图', 'خريطة العالم'],
 'yc': ['Kolaboro in one minute', 'Kolaboro en un minuto', 'Kolaboro in einer Minute', 'Kolaboro en une minute', 'Kolaboro in één minuut', 'Kolaboro за одну минуту', '一分钟了解 Kolaboro', 'Kolaboro في دقيقة'],
 'all_pages': ['All pages and markets', 'Todas las páginas y mercados', 'Alle Seiten und Märkte', 'Toutes les pages et marchés', "Alle pagina's en markten", 'Все страницы и рынки', '所有页面和市场', 'كل الصفحات والأسواق'],
 'all_markets': ['All markets', 'Todos los mercados', 'Alle Märkte', 'Tous les marchés', 'Alle markten', 'Все рынки', '全部市场', 'كل الأسواق'],
 'progress': ['Progress', 'Avances', 'Fortschritt', 'Avancement', 'Voortgang', 'Прогресс', '进展', 'التقدّم'],
 'accessibility': ['Accessibility', 'Accesibilidad', 'Barrierefreiheit', 'Accessibilité', 'Toegankelijkheid', 'Доступность', '无障碍', 'إمكانية الوصول'],
 'language': ['Language', 'Idioma', 'Sprache', 'Langue', 'Taal', 'Язык', '语言', 'اللغة'],
 'benchmark': ['Developer benchmark', 'Comparativa de promotores', 'Bauträger-Vergleich', 'Comparatif des promoteurs', 'Ontwikkelaarsbenchmark', 'Сравнение застройщиков', '开发商基准对比', 'مقارنة المطوّرين'],
 'ms_h': ['Most searched this month', 'Lo más buscado este mes', 'Diesen Monat am meisten gesucht', 'Les plus recherchés ce mois-ci', 'Deze maand het meest gezocht', 'Чаще всего ищут в этом месяце', '本月搜索最多', 'الأكثر بحثاً هذا الشهر'],
 'ms_src': ['Pages behind the Google searches with the most impressions, 28 days to 20 Nov 2026 (Search Console)',
            'Páginas de las búsquedas en Google con más impresiones, 28 días hasta el 20 nov 2026 (Search Console)',
            'Seiten zu den Google-Suchen mit den meisten Impressionen, 28 Tage bis 20. Nov. 2026 (Search Console)',
            'Pages des recherches Google les plus affichées, 28 jours au 20 nov. 2026 (Search Console)',
            "Pagina's achter de Google-zoekopdrachten met de meeste vertoningen, 28 dagen tot 20 nov 2026 (Search Console)",
            'Страницы по запросам Google с наибольшим числом показов, 28 дней по 20 нояб. 2026 (Search Console)',
            '谷歌搜索展示次数最多的页面，截至 2026 年 11 月 20 日的 28 天（Search Console）',
            'الصفحات وراء عمليات بحث Google الأكثر ظهوراً، 28 يوماً حتى 20 نوفمبر 2026 (Search Console)'],
 'sm_title': ['Site map: every country, market and page', 'Mapa del sitio: países, mercados y páginas', 'Sitemap: alle Länder, Märkte und Seiten', 'Plan du site : pays, marchés et pages', 'Sitemap: alle landen, markten en pagina\'s', 'Карта сайта: страны, рынки и страницы', '网站地图：所有国家、市场和页面', 'خريطة الموقع: كل الدول والأسواق والصفحات'],
 'sm_desc': ['Every country and market Kolaboro tracks, with the number of off-plan projects in each, and every page about how Kolaboro works.',
             'Todos los países y mercados que sigue Kolaboro, con el número de proyectos sobre plano de cada uno, y las páginas sobre cómo trabaja Kolaboro.',
             'Alle Länder und Märkte, die Kolaboro verfolgt, mit der Zahl der Off-Plan-Projekte je Markt, und alle Seiten darüber, wie Kolaboro arbeitet.',
             'Tous les pays et marchés suivis par Kolaboro, avec le nombre de projets sur plan de chacun, et les pages sur notre façon de travailler.',
             "Alle landen en markten die Kolaboro volgt, met het aantal off-planprojecten per markt, en alle pagina's over hoe Kolaboro werkt.",
             'Все страны и рынки, которые отслеживает Kolaboro, с числом строящихся проектов в каждом, и страницы о том, как работает Kolaboro.',
             'Kolaboro 跟踪的所有国家和市场及各自的期房项目数量，以及介绍 Kolaboro 工作方式的所有页面。',
             'كل الدول والأسواق التي يتابعها Kolaboro مع عدد المشاريع على المخطط في كل منها، وكل الصفحات عن طريقة عمل Kolaboro.'],
 'sm_h1': ['Site map', 'Mapa del sitio', 'Sitemap', 'Plan du site', 'Sitemap', 'Карта сайта', '网站地图', 'خريطة الموقع'],
 'sm_lead': ['Every country and market we track, by country, with the number of projects in each. Data of {d}.',
             'Todos los países y mercados que seguimos, por país, con el número de proyectos de cada uno. Datos del {d}.',
             'Alle Länder und Märkte, die wir verfolgen, nach Land, mit der Zahl der Projekte. Daten vom {d}.',
             'Tous les pays et marchés suivis, par pays, avec le nombre de projets de chacun. Données du {d}.',
             'Alle landen en markten die we volgen, per land, met het aantal projecten. Gegevens van {d}.',
             'Все страны и рынки, которые мы отслеживаем, по странам, с числом проектов. Данные на {d}.',
             '我们跟踪的所有国家和市场，按国家排列，并列出各自的项目数量。数据日期：{d}。',
             'كل الدول والأسواق التي نتابعها، حسب الدولة، مع عدد المشاريع في كل منها. بيانات {d}.'],
 'sm_main': ['Main pages', 'Páginas principales', 'Wichtige Seiten', 'Pages principales', "Belangrijkste pagina's", 'Основные страницы', '主要页面', 'الصفحات الرئيسية'],
 'sm_co': ['Countries and markets', 'Países y mercados', 'Länder und Märkte', 'Pays et marchés', 'Landen en markten', 'Страны и рынки', '国家和市场', 'الدول والأسواق'],
 'sm_more': ['More about Kolaboro', 'Más sobre Kolaboro', 'Mehr über Kolaboro', 'En savoir plus sur Kolaboro', 'Meer over Kolaboro', 'Подробнее о Kolaboro', '更多关于 Kolaboro', 'المزيد عن Kolaboro'],
 'sm_n': ['{n} projects', '{n} proyectos', '{n} Projekte', '{n} projets', '{n} projecten', 'проектов: {n}', '{n} 个项目', '{n} مشروع'],
 'sm_n1': ['1 project', '1 proyecto', '1 Projekt', '1 projet', '1 project', 'проектов: 1', '1 个项目', 'مشروع واحد'],
}
lab = {l: {k: v[i] for k, v in NEW.items()} for i, l in enumerate(L)}
def fl(path, l):   # a footer label as today's footer in language l has it, else English, else None
    for ll in (l, 'en'):
        x = F.get(ll, {}).get('L', {}).get(path)
        if x and x[1]: return x[1]
    return None
for i, l in enumerate(L):
    h = F[l]['h']; lab[l]['h_buyers'] = h[0]; lab[l]['h_data'] = h[1]

# ---------------------------------------------------------------- footer (item 63: fewer sitewide links; item 74: 12 markets)
top = [m for m, n in mkc.most_common() if not COI.search(m)][:12]
FT = {}
for l in L:
    t = lab[l]
    mk = [[loc('/m/' + slug_m(m) + '/', l), nm('mk', m, l)] for m in top] + [[loc('/m/', l), t['all_markets']]]
    buy = [[loc(p, l), fl(p, l)] for p in ['/check/', '/pricing/', '/compare/', '/tools/', '/checklist/', '/ask-developer/']]
    dat = [[loc('/projects/', l), t['all_projects']], [loc('/countries/', l), t['countries']], [loc('/rankings/', l), t['rankings']],
           [loc('/transparency-index/', l), fl('/transparency-index/', l)], [loc('/map/', l), t['map']], [loc('/database/', l), fl('/database/', l)], ['/data/', t['open_data']]]
    abt = [[loc('/about/', l), fl('/about/', l)], [loc('/trust/', l), fl('/trust/', l)], [loc('/how-we-score/', l), fl('/how-we-score/', l)],
           [loc('/contact/', l), fl('/contact/', l)], ['/changelog/', fl('/changelog/', l)], [loc('/progress/', l), t['progress']], ['/yc/', t['yc']],
           ['/engineering/', fl('/engineering/', l)], [loc('/developers/', l), fl('/developers/', l)], [loc('/sitemap/', l) if l == 'en' else pre(l) + '/sitemap/', t['all_pages']],
           [loc('/accessibility/', l), t['accessibility']], ['/login/', fl('/login/', l)], ['/legal/privacy/', fl('/legal/privacy/', l)], ['/legal/terms/', fl('/legal/terms/', l)]]
    FT[l] = [['h_markets', mk], ['h_buyers', buy], ['h_data', dat], ['h_about', abt]]
    for g in FT[l]:
        for x in g[1]: assert x[1], (l, x)
in_footer = {re.sub(r'^/(es|de|fr|nl|ru|zh|ar)(?=/)', '', x[0]) for g in FT['en'] for x in g[1]}

# ---------------------------------------------------------------- /sitemap/ (item 76): countries > markets, then the other pages
cos = collections.defaultdict(list)
for m, n in mkc.items():
    if COI.search(m): continue
    co = co_of[m].most_common(1)[0][0]; cos[co].append((m, n))
SM = []
for co in sorted(cos, key=lambda c: (-sum(n for m, n in cos[c]), c)):
    cs = slug_c(co); cp = '/countries/' + cs + '/'
    langs = [l for l in L if (pre(l) + cp) in U]
    mks = []
    for m, n in sorted(cos[co], key=lambda x: (-x[1], x[0])):
        mp = '/m/' + slug_m(m) + '/'
        ml = [l for l in L if (pre(l) + mp) in U]
        mks.append([m, n, ''.join(l[0] + l[1] for l in ml) if ml else '', {l: nm('mk', m, l) for l in L[1:] if nm('mk', m, l) != m}])
    SM.append([co, cs, ''.join(l for l in langs), {l: nm('co', co, l) for l in L[1:] if nm('co', co, l) != co}, mks])
REDIR = {'/sql/': '/data/sql/'}   # 301s found by checking every link of this file live (20 Nov 2026)
# pages that were in the footer and are not any more: listed on /sitemap/ (in the page language where today's footer links one)
more = {}
for l in L:
    seen = set(); A = []
    for path, (href, label) in F['en']['L'].items():
        if path in in_footer or path in seen or not path.startswith('/') or path.startswith('/m/') and path != '/m/': continue
        seen.add(path); x = F.get(l, {}).get('L', {}).get(path)
        h = x[0] if x else path; h = REDIR.get(h, h)   # item 72: no link to an address that redirects
        A.append([h, (x[1] if x else label) or label])
    more[l] = A

# ---------------------------------------------------------------- item 64: most searched this month (Search Console, 28 days to 20 Nov 2026)
# [path, label key or None, impressions in the 28 days (None: listed in the report without a number), country]
MS = [['/compare/', '/compare/', 285, None], ['/developers/benchmark/', 'benchmark', 136, None],
      ['/projects/the-landmark-mermaid-beach-aniko/', None, 107, 'Australia'], ['/developers/gj-properties/', None, 59, None],
      ['/developers/modon/', None, 54, None], ['/projects/palmera-residences-central-equity/', None, 51, 'Australia'],
      ['/developers/aqaar/', None, 34, None], ['/developers/irth-group/', None, 33, None], ['/developers/naftali-group/', None, 22, None]]
byS = {p['s']: p for p in P}; devN = {}; devCo = collections.defaultdict(collections.Counter)
for p in P:
    if p.get('dvs'): devN[p['dvs']] = p.get('dv'); devCo[p['dvs']][p['co']] += 1
MSO = []
for path, key, imp, co in MS:
    m = re.match(r'^/(projects|developers)/([a-z0-9-]+)/$', path)
    if key is None and m:
        if m.group(1) == 'projects': p = byS[m.group(2)]; name = p['n']; co = p['co']
        else: name = devN[m.group(2)]; co = devCo[m.group(2)].most_common(1)[0][0]
        lbl = {l: name for l in L}
    elif key == 'benchmark': lbl = {l: lab[l]['benchmark'] for l in L}
    else: lbl = {l: fl(key, l) for l in L}
    ls = ''.join(l for l in L[1:] if (pre(l) + path) in U) if not (m and m.group(1) in ('projects', 'developers') and path != '/developers/benchmark/') else 'esdefrnlruzhar'
    MSO.append([path, imp, co, ls, lbl['en'], {l: lbl[l] for l in L[1:] if lbl[l] != lbl['en']}])

json.dump({'v': '2026-11-20', 'data': D.get('updated'), 'lab': lab, 'ft': FT, 'sm': SM, 'more': more,
           'ms': MSO, 'lswcss': LSW_CSS}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print('top markets', top); print('countries', len(SM), 'markets', sum(len(c[4]) for c in SM), 'more', len(more['en']))
