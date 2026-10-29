#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SupportNear: fixes for the live QA of 27-oct-2026 (qa/live.md).

    python3 patch_live.py <branch_root>      # root of a checkout of pub/_wp

Edits files under <branch_root>/_s/supportnear.com/ and, with a small block that
only acts for supportnear.com, <branch_root>/_worker.js/index.js.

* Idempotent: a second run changes nothing (it prints 0 changed files).
* Standard library only (python 3.8+). No network.
* Deletes exactly one file: _s/supportnear.com/falta.html (internal memo, QA m6).
* Never touches <script> code in index.html (the app) and never edits inline
  scripts of pages that already carry a CSP (index.html, impacto.html).

What each step fixes is written next to it (C1, M1, ... refer to qa/live.md).
"""
import sys, os, re, io, json, hashlib, base64, zlib, unicodedata, math
import html as H
from datetime import date
from urllib.parse import quote, unquote

if len(sys.argv) != 2:
    sys.exit('usage: patch_live.py <branch_root>')
ROOT = os.path.abspath(sys.argv[1])
B = os.path.join(ROOT, '_s', 'supportnear.com')
WORKER = os.path.join(ROOT, '_worker.js', 'index.js')
if not os.path.isfile(os.path.join(B, 'index.html')):
    sys.exit('not a pub/_wp checkout: %s/index.html missing' % B)
TODAY = date.today().isoformat()
SITE = 'https://supportnear.com'
CATS = ['food', 'shelter', 'hygiene', 'clothes', 'social', 'legal', 'health', 'water', 'warm']
STATS = {}
COUNT = {}


def bump(k, n=1):
    COUNT[k] = COUNT.get(k, 0) + n


def rd(rel):
    return io.open(os.path.join(B, rel), encoding='utf-8', newline='').read()


def exists(rel):
    return os.path.isfile(os.path.join(B, rel))


# ======================================================================
# 0. data from the published app: CITIES and STATS (works on the minified
#    index.html and on the unminified build)
# ======================================================================
def js_array(src, start):
    """Text of the JS array literal that starts at src[start] == '['."""
    d = 0; i = start; ins = False
    while True:
        ch = src[i]
        if ins:
            if ch == '\\': i += 2; continue
            if ch == '"': ins = False
        else:
            if ch == '"': ins = True
            elif ch == '[': d += 1
            elif ch == ']':
                d -= 1
                if d == 0: return src[start:i + 1]
        i += 1


def load_cities():
    h = rd('index.html')
    m = re.search(r'CITIES\s*=\s*(?:/\*__CITIES__\*/)?\[\[', h)
    lit = js_array(h, m.end() - 2)
    lit = re.sub(r'(?<=[,\[])(-?)\.(\d)', r'\g<1>0.\2', lit)   # -.1278 -> -0.1278
    m2 = re.search(r'STATS=(?:/\*__STATS__\*/)?\{"?places"?:(\d+),"?cities"?:(\d+),"?countries"?:(\d+)\}', h.replace(' ', '').replace('const', ''))
    if m2:
        STATS.update(places=int(m2.group(1)), cities=int(m2.group(2)), countries=int(m2.group(3)))
    return json.loads(lit)


CITIES = load_cities()


def slug(name):
    s = name.lower()
    s = re.sub(r'[̀-ͯ]', '', unicodedata.normalize('NFD', s))
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'city'


NONLAT = r'[Ѐ-ӿͰ-Ͽ؀-ۿ֐-׿฀-๿぀-ヿ一-鿿가-힯ऀ-ॿ]'


def split_name(raw):            # same rule as city_pages.py
    parts = [x.strip() for x in raw.split('·')]
    if len(parts) == 1:
        return parts[0], ''
    lat = [x for x in parts if re.search(r'[A-Za-z]', x) and not re.search(NONLAT, x)]
    en = lat[0] if len(lat) == 1 else parts[-1]
    other = [x for x in parts if x != en]
    return en, (other[0] if other else '')


def hav(a, b, c, d):
    p = math.pi / 180
    x = math.sin((c - a) * p / 2) ** 2 + math.cos(a * p) * math.cos(c * p) * math.sin((d - b) * p / 2) ** 2
    return 12742.0 * math.asin(math.sqrt(x))


GROUPS = {}
for c in CITIES:
    nm, lo = split_name(c[0])
    GROUPS.setdefault(slug(nm), []).append({'raw': c[0], 'name': nm, 'local': lo, 'lat': c[1], 'lon': c[2],
                                            'country': c[3] or '', 'cc': (c[4] or '').upper() if len(c) > 4 else ''})
DUP = {k for k, v in GROUPS.items() if len(v) > 1}

# ---- which city each file under c/ and t/ belongs to ----
CFILES = sorted(f for f in os.listdir(os.path.join(B, 'c')) if f.endswith('.html')) if os.path.isdir(os.path.join(B, 'c')) else []
TFILES = sorted(f for f in os.listdir(os.path.join(B, 't')) if f.endswith('.html')) if os.path.isdir(os.path.join(B, 't')) else []
CATRX = re.compile(r'-(%s)$' % '|'.join(CATS))


def stem_of(f):
    s = f[:-5]
    s = s[:-7] if s.endswith('.cartel') else s
    s = s[:-3] if s.endswith('.en') else s
    return s


CITYSL = set(k for k in GROUPS if k not in DUP) | set(DUP)
for f in CFILES + TFILES:
    s = stem_of(f)
    for base in DUP:
        if s.startswith(base + '-') and not CATRX.search(s):
            CITYSL.add(s)


def sl_of(f):
    s = stem_of(f)
    if s in CITYSL:
        return s
    m = CATRX.search(s)
    if m and s[:m.start()] in CITYSL:
        return s[:m.start()]
    return None


def coords_in(txt):
    return [(float(a), float(b)) for a, b in re.findall(r'"latitude": (-?[\d.]+), "longitude": (-?[\d.]+)', txt)]


ENTRY = {}            # city slug -> CITIES entry
_pts = {}
for f in CFILES:
    sl = sl_of(f)
    if not sl or f.endswith('.cartel.html'):
        continue
    base = sl if sl in GROUPS else next((b for b in DUP if sl.startswith(b + '-')), None)
    if base in DUP:
        _pts.setdefault(sl, []).extend(coords_in(rd('c/' + f))[:10])
for sl in sorted(CITYSL):
    if sl in GROUPS and sl not in DUP:
        ENTRY[sl] = GROUPS[sl][0]
        continue
    base = sl if sl in DUP else next((b for b in DUP if sl.startswith(b + '-')), None)
    if not base:
        continue
    cands = GROUPS[base]; pts = _pts.get(sl)
    if pts:
        def score(e):
            return sorted(hav(e['lat'], e['lon'], a, b) for a, b in pts)[len(pts) // 2]
        best = min(cands, key=score)
        if score(best) < 80:
            ENTRY[sl] = best
            continue
    if sl != base:                       # by the suffix: london-canada
        suf = sl[len(base) + 1:]
        hit = [e for e in cands if slug(e['country']) == suf or (e['cc'] == 'ES' and suf in ('espana', 'spain'))]
        if len(hit) == 1:
            ENTRY[sl] = hit[0]
for base in DUP:                         # the base slug is the one nobody else took
    if base not in ENTRY:
        taken = [ENTRY[s]['raw'] + str(ENTRY[s]['lat']) for s in ENTRY if s.startswith(base + '-') and ENTRY.get(s)]
        left = [e for e in GROUPS[base] if e['raw'] + str(e['lat']) not in taken]
        if len(left) == 1:
            ENTRY[base] = left[0]
AMBIG_SL = {s for s in ENTRY if s in DUP or (s not in GROUPS and any(s.startswith(b + '-') for b in DUP))}
bump('cities known', len(ENTRY))

# ======================================================================
# helpers
# ======================================================================
SEG = re.compile(r'(<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->)', re.S | re.I)


def outside_code(s, fn):
    parts = SEG.split(s)
    return ''.join(p if i % 2 else fn(p) for i, p in enumerate(parts))


def clean_url(v):
    """M5: x.html -> x, a/index.html -> a/, and no ?v= on links to pages."""
    absu = v.startswith(SITE + '/')
    if not absu and re.match(r'^(?:[a-z][a-z0-9+.-]*:|//|#)', v, re.I):
        return v
    frag = ''
    if '#' in v:
        v, frag = v.split('#', 1); frag = '#' + frag
    q = ''
    if '?' in v:
        v, q = v.split('?', 1)
    if not v.endswith('.html'):
        return v + (('?' + q) if q else '') + frag
    p = v[:-5]
    if p == 'index' or p.endswith('/index'):
        p = p[:-5]
    if p == '':
        p = './'
    amp = '&amp;' if '&amp;' in q else '&'
    ps = [x for x in re.split(r'&amp;|&', q) if x and not x.startswith('v=')] if q else []
    return p + (('?' + amp.join(ps)) if ps else '') + frag


def clean_links(s):
    def attr(m):
        nv = clean_url(m.group(2))
        if nv != m.group(2):
            bump('M5 links made clean')
        return m.group(1) + nv + '"'
    return outside_code(s, lambda t: re.sub(r'(\b(?:href|src)=")([^"]*\.html[^"]*)"', attr, t))


def visible(s):
    t = re.sub(r'<script\b(?![^>]*ld\+json).*?</script>|<style\b.*?</style>', ' ', s, flags=re.S | re.I)
    t = re.sub(r'<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)" content="([^"]*)"[^>]*>', r' \1 ', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', H.unescape(t)).strip()


def page_lang(s):
    m = re.search(r'<html[^>]*\blang="([a-z]{2,3})', s)
    return m.group(1) if m else 'en'


def ld_blocks(s):
    return list(re.finditer(r'(<script type="application/ld\+json">)(.*?)(</script>)', s, re.S))


def ld_edit(s, fn):
    """Edit JSON-LD keeping the generator's exact formatting (json.dumps,
    ensure_ascii=False, '</' escaped). Skips blocks that would not round-trip."""
    def rep(m):
        raw = m.group(2)
        try:
            data = json.loads(raw)
        except Exception:
            return m.group(0)
        if json.dumps(data, ensure_ascii=False).replace('</', '<\\/') != raw:
            return m.group(0)
        new = fn(data)
        if new is None:
            return m.group(0)
        return m.group(1) + json.dumps(new, ensure_ascii=False).replace('</', '<\\/') + m.group(3)
    return re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', rep, s, flags=re.S)


def wsub(old, new, txt, count=0):
    """Whole-word replace."""
    if not old or old == new:
        return txt
    return re.sub(r'(?<!\w)%s(?!\w)' % re.escape(old), lambda m: new, txt, count=count)


def swap(txt, old, new):
    """Whole-word old -> new that never touches an «old» already inside «new»
    (Gonaïves -> Les Gonaïves twice would give «Les Les Gonaïves»)."""
    if not old or old == new:
        return txt
    ph = '\x00'
    t = txt.replace(new, ph) if old in new else txt
    t = re.sub(r'(?<!\w)%s(?!\w)' % re.escape(old), lambda m: new, t)
    return t.replace(ph, new)


NAME_SPANS = [
    re.compile(r'(<title>)(.*?)(</title>)', re.S),
    re.compile(r'(<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)" content=")([^"]*)(")'),
    re.compile(r'(<h1>)(.*?)(</h1>)', re.S),
    re.compile(r'(<h2>)([^<]*)(</h2>)'),
    re.compile(r'(<p class="lede">)(.*?)(</p>)', re.S),
    re.compile(r'(<a class="btn[^"]*" href="[^"]*">)([^<]*)(</a>)'),
    re.compile(r'(<b>SupportNear</b><a href="[^"]*">)([^<]*)(</a></header>)'),
    re.compile(r'(<div class="city">)([^<]*)(</div>)'),
]


def in_name_spans(s, fn, title_only=False):
    spans = NAME_SPANS[:2] if title_only else NAME_SPANS
    for rx in spans:
        s = rx.sub(lambda m: m.group(1) + fn(m.group(2)) + m.group(3), s)
    return s


# ======================================================================
# texts
# ======================================================================
# m1: hospitals are counted as health care, so "free clinics" was not true.
HEALTH_WORD = {   # lang: [(old plural, new plural), (old singular, new singular)]
    'en': [('free clinics', 'clinics and hospitals'), ('free clinic', 'clinic or hospital')],
    'es': [('centros de salud gratuitos', 'centros de salud y hospitales'), ('centro de salud gratuito', 'centro de salud u hospital')],
    'pt': [('centros de saúde gratuitos', 'centros de saúde e hospitais'), ('centro de saúde gratuito', 'centro de saúde ou hospital')],
    'fr': [('lieu de soins gratuits', 'lieu de soins'), ('soins gratuits', 'soins médicaux')],
    'ro': [('punct de îngrijiri medicale gratuite', 'punct de îngrijiri medicale'), ('îngrijiri medicale gratuite', 'îngrijiri medicale')],
    'ar': [('رعاية صحية مجانية', 'رعاية صحية')],
    'uk': [('безкоштовна медична допомога', 'медична допомога'), ('Безкоштовна медична допомога', 'Медична допомога')],
    'ru': [('бесплатная медицинская помощь', 'медицинская помощь'), ('Бесплатная медицинская помощь', 'Медицинская помощь')],
    'pl': [('darmowa opieka zdrowotna', 'opieka zdrowotna'), ('Darmowa opieka zdrowotna', 'Opieka zdrowotna')],
    'ur': [('مفت طبی مدد', 'طبی مدد')],
    'fa': [('درمان رایگان', 'درمان')],
}
CAPS = {'health': 21, 'warm': 13, 'water': 24}    # build.py W_HEALTH, W_WARM, W_WATER

# p5: English pages showed the local spelling (Wien, Napoli, München).
EXONYM = {'Wien': 'Vienna', 'München': 'Munich', 'Köln': 'Cologne', 'Nürnberg': 'Nuremberg', 'Napoli': 'Naples',
          'Roma': 'Rome', 'Milano': 'Milan', 'Lisboa': 'Lisbon', 'București': 'Bucharest', 'İstanbul': 'Istanbul',
          'Brussel': 'Brussels', 'København': 'Copenhagen', 'Göteborg': 'Gothenburg', 'Tiranë': 'Tirana', 'Rīga': 'Riga',
          'Sevilla': 'Seville', 'Ciudad de Guatemala': 'Guatemala City', 'Hà Nội': 'Hanoi',
          'Thành phố Hồ Chí Minh': 'Ho Chi Minh City', 'Québec': 'Quebec City'}
# p5: Russian-language pages of Belarus and Kazakhstan used the Belarusian/Kazakh spelling.
RU_NAME = {'Мінск': 'Минск', 'Віцебск': 'Витебск', 'Гродна': 'Гродно', 'Магілёў': 'Могилёв', 'Брэст': 'Брест',
           'Бабруйск': 'Бобруйск', 'Ақтөбе': 'Актобе', 'Қарағанды': 'Караганда', 'Өскемен': 'Усть-Каменогорск',
           'Қызылорда': 'Кызылорда', 'Ақтау': 'Актау'}
ARABIC = r'[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]'


def clean_local(local, lang, latin):
    """p5: «ⵟⴰⵕⴰⴱⵍⵓⵙ طرابلس Tripoli» -> «طرابلس» on an Arabic page; no Tifinagh in titles."""
    if not local:
        return local
    if lang == 'ru' and local in RU_NAME:
        return RU_NAME[local]
    toks = [t for t in re.split(r'[\s;]+', local) if t and not re.search(r'[\u2D30-\u2D7F]', t)]
    if lang in ('ar', 'fa', 'ur'):                      # escritura arabe
        toks = [t for t in toks if re.search(ARABIC, t)] or toks
    elif lang in ('uk', 'ru'):                          # cirilico
        toks = [t for t in toks if re.search(r'[\u0400-\u04FF]', t)] or toks
    elif lang == 'en':                                  # la etiqueta pequena junto al nombre ingles
        toks = [t for t in toks if t != latin] or toks
    else:                                               # es, fr, pt...: la forma latina
        toks = [t for t in toks if not re.search(r'[^\u0000-\u024F\u1E00-\u1EFF]', t)] or toks
    return ' '.join(toks).strip() or local


NONLATIN_LANGS = {'ar', 'fa', 'ur', 'uk', 'ru'}


def local_display(e, lang):
    """The name a non-English page should show (same rule as seo_common.display_name)."""
    loc = clean_local(e['local'], lang, e['name'])
    if lang not in NONLATIN_LANGS and not re.search(r'[^\u0000-\u024F\u1E00-\u1EFF]', loc):
        return e['name']
    return loc


COUNTRY_ES = {'en': 'Spain', 'es': 'España', 'fr': 'Espagne', 'pt': 'Espanha'}

# m11: the press kit and the info pages promised things that are not true.
CLAIMS = json.loads(zlib.decompress(base64.b64decode(
    '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')).decode('utf-8'))
# QR codes for the posters of the cities whose name exists in more than one country (C1)
QR = json.loads(zlib.decompress(base64.b64decode(
    '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')).decode('utf-8'))
# M7: places that are not free help, until the next data build drops them (build.py classify)
BLOCK_IDS = {'node/13536418801', 'node/10268572084', 'node/7893425464'}
BLOCK_NAMES = {'old jewish soup kitchen', 'London Fields Lido', 'Trades Union Congress Headquarters', 'Phi Gamma Delta'}

# ======================================================================
# CSP for the static pages (p1). Pages that already carry one are left alone.
# ======================================================================
# R20: GA4 + Clarity sin cookies (copia de analytics_snip.py de la rama src)
AN_GA = 'G-FJKJE77K4V'
AN_SNIP = '<script>(function(w,d,n){var T={"en":["May we use a Google Analytics cookie to count visits? It never learns who you are.","Accept","Reject","Privacy","Cookie settings"],"es":["¿Podemos usar una cookie de Google Analytics para contar las visitas? Nunca sabe quién eres.","Aceptar","Rechazar","Privacidad","Configurar cookies"],"fr":["Pouvons-nous utiliser un cookie de Google Analytics pour compter les visites ? Il ne sait jamais qui tu es.","Accepter","Refuser","Confidentialité","Réglages des cookies"],"ar":["هل يمكننا استخدام ملف كوكيز من Google Analytics لعدّ الزيارات؟ لا يعرف أبدًا من أنت.","قبول","رفض","الخصوصية","إعدادات الكوكيز"],"uk":["Чи можемо ми використовувати cookie Google Analytics, щоб рахувати відвідування? Він ніколи не знає, хто ти.","Прийняти","Відхилити","Приватність","Налаштування cookie"],"ro":["Putem folosi un cookie Google Analytics ca să numărăm vizitele? Nu află niciodată cine ești.","Accept","Refuz","Confidențialitate","Setări cookie-uri"],"pl":["Czy możemy użyć ciasteczka Google Analytics do liczenia odwiedzin? Nigdy nie wie, kim jesteś.","Akceptuję","Odrzucam","Prywatność","Ustawienia ciasteczek"],"ru":["Можно мы будем использовать cookie Google Analytics, чтобы считать посещения? Он никогда не узнаёт, кто ты.","Принять","Отклонить","Конфиденциальность","Настройки cookie"],"pt":["Podemos usar um cookie do Google Analytics para contar as visitas? Nunca sabe quem és.","Aceitar","Recusar","Privacidade","Definições de cookies"],"ur":["کیا ہم وزٹ گننے کے لیے Google Analytics کی ایک کوکی استعمال کر سکتے ہیں؟ اسے کبھی پتا نہیں چلتا کہ آپ کون ہیں۔","قبول","رد","رازداری","کوکی کی ترتیبات"],"fa":["آیا می\u200cتوانیم برای شمردن بازدیدها از یک کوکی Google Analytics استفاده کنیم؟ هرگز نمی\u200cفهمد تو کیستی.","قبول","رد","حریم خصوصی","تنظیمات کوکی"],"wo":["Ndax mën nañu jëfandikoo ab cookie bu Google Analytics ngir waññ ñi ñëw? Du xam mukk ki nga doon.","Nangu","Bañ","Sutura","Tànn cookies yi"],"bm":["An bɛ se ka Google Analytics ka cookie kelen kɛ ka taamaw jate wa? A tɛ i dɔn abada.","Sɔn","Ban","Gundo","Cookies labɛncogo"],"ti":["ምብጻሓት ንምቑጻር ናይ Google Analytics cookie ክንጥቀም ንኽእልዶ? መን ምዃንካ ፈጺሙ ኣይፈልጥን።","ተቐበል","ኣይፋል","ብሕትውና","ምድላው cookies"],"ps":["ایا موږ کولی شو د لیدنو د شمېرلو لپاره د Google Analytics یوه کوکي وکاروو؟ هېڅکله نه پوهېږي چې ته څوک یې.","منل","ردول","محرمیت","د کوکیز تنظیمات"],"so":["Ma isticmaali karnaa cookie Google Analytics si aan u tirinno booqashooyinka? Weligeed ma oga cidda aad tahay.","Aqbal","Diid","Qarsoodinimo","Dejinta cookies"],"am":["ጉብኝቶችን ለመቁጠር የGoogle Analytics ኩኪ መጠቀም እንችላለን? ማን እንደሆንክ በጭራሽ አያውቅም።","ተቀበል","አትቀበል","ግላዊነት","የኩኪ ቅንብሮች"],"tr":["Ziyaretleri saymak için bir Google Analytics çerezi kullanabilir miyiz? Kim olduğunu asla bilmez.","Kabul et","Reddet","Gizlilik","Çerez ayarları"],"bn":["ভিজিট গুনতে আমরা কি Google Analytics-এর একটা কুকি ব্যবহার করতে পারি? এটা কখনো জানে না তুমি কে।","মেনে নাও","না","গোপনীয়তা","কুকি সেটিংস"],"zh":["我们可以使用一个 Google Analytics 的 Cookie 来统计访问吗？它永远不会知道你是谁。","接受","拒绝","隐私","Cookie 设置"]};function tx(i,el){var x=el&&el.closest&&el.closest(\'[lang]\'),l=((x||d.documentElement).getAttribute(\'lang\')||\'en\').slice(0,2).toLowerCase();return (T[l]||T.en)[i]}var off=n.doNotTrack==\'1\'||w.doNotTrack==\'1\'||n.globalPrivacyControl||/[?&]embed=1/.test(location.search)||location.protocol==\'file:\'||(n.connection&&(n.connection.saveData||/2g/.test(n.connection.effectiveType||\'\')));function bind(){[].forEach.call(d.querySelectorAll(\'[data-sn-cookies]\'),function(e){if(off){e.hidden=true;return}e.textContent=tx(4,e);if(e.getAttribute(\'data-snb\'))return;e.setAttribute(\'data-snb\',\'1\');e.addEventListener(\'click\',function(){w.snCookies()})})}w.snBind=bind;if(d.readyState==\'loading\')d.addEventListener(\'DOMContentLoaded\',bind);else bind();if(off)return;var K=\'sn.ck\',ch=null,tz=\'\';try{ch=localStorage.getItem(K)}catch(e){}try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||\'\'}catch(e){}var eu=!tz||/^(Europe\\/|Arctic\\/|Atlantic\\/(Canary|Madeira|Azores|Reykjavik|Faroe))/.test(tz);var ok=ch==\'1\'||(!eu&&ch!=\'0\'),gl=0,ready=0;w.dataLayer=w.dataLayer||[];function g(){dataLayer.push(arguments)}w.gtag=g;g(\'consent\',\'default\',{ad_storage:\'denied\',ad_user_data:\'denied\',ad_personalization:\'denied\',analytics_storage:ok?\'granted\':\'denied\'});g(\'js\',new Date());g(\'config\',\'G-FJKJE77K4V\',{allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+location.pathname+location.search});w.clarity=w.clarity||function(){(w.clarity.q=w.clarity.q||[]).push(arguments)};w.clarity(\'consentv2\',{ad_Storage:\'denied\',analytics_Storage:\'denied\'});w.clarity(\'set\',\'site\',\'supportnear\');d.documentElement.setAttribute(\'data-clarity-mask\',\'True\');function a(s){var e=d.createElement(\'script\');e.async=1;e.src=s;d.head.appendChild(e)}function ga(){if(gl||!ready)return;gl=1;a(\'https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V\')}function set(v){try{localStorage.setItem(K,v?\'1\':\'0\')}catch(e){}ch=v?\'1\':\'0\';ok=!!v;g(\'consent\',\'update\',{analytics_storage:v?\'granted\':\'denied\'});if(v)ga();else d.cookie.split(\';\').forEach(function(c){var k=c.split(\'=\')[0].trim();if(/^_ga/.test(k)){var h=location.hostname;[h,\'.\'+h,\'.\'+h.split(\'.\').slice(-2).join(\'.\')].forEach(function(dm){d.cookie=k+\'=;Max-Age=0;path=/;domain=\'+dm});d.cookie=k+\'=;Max-Age=0;path=/\'}});var b=d.getElementById(\'sn-ck\');if(b)b.parentNode.removeChild(b)}function btn(t,y){var b=d.createElement(\'button\');b.type=\'button\';b.textContent=t;b.style.cssText=\'flex:1;min-height:44px;border-radius:12px;font-weight:600;font-size:15px;line-height:1.2;font-family:inherit;cursor:pointer;padding:8px 12px;\'+(y?\'background:#0B7A63;color:#fff;border:1.5px solid #0B7A63\':\'background:transparent;color:inherit;border:1.5px solid currentColor\');b.addEventListener(\'click\',function(){set(y)});return b}function bar(hi){if(d.getElementById(\'sn-ck\')||!d.body)return;var dk=d.documentElement.getAttribute(\'data-theme\')==\'dark\'||(!d.documentElement.getAttribute(\'data-theme\')&&w.matchMedia&&matchMedia(\'(prefers-color-scheme: dark)\').matches);var b=d.createElement(\'div\');b.id=\'sn-ck\';b.setAttribute(\'role\',\'region\');b.setAttribute(\'aria-label\',tx(4));b.style.cssText=\'position:fixed;z-index:\'+(hi?2600:1900)+\';left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:440px;margin:0 auto;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,.25);padding:14px 16px;font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;\'+(dk?\'background:#1d2228;color:#eef0f2;border:1px solid #3a424c\':\'background:#fff;color:#1c1916;border:1px solid #d9d2c5\');var p=d.createElement(\'p\');p.style.cssText=\'margin:0 0 12px\';p.textContent=tx(0)+\' \';var m=d.createElement(\'a\');m.href=\'/about\';m.textContent=tx(3);m.style.cssText=\'color:inherit;text-decoration:underline\';p.appendChild(m);var r=d.createElement(\'div\');r.style.cssText=\'display:flex;gap:8px\';r.appendChild(btn(tx(1),1));r.appendChild(btn(tx(2),0));b.appendChild(p);b.appendChild(r);d.body.appendChild(b)}w.snCookies=function(){var b=d.getElementById(\'sn-ck\');if(b)b.parentNode.removeChild(b);bar(1)};function go(){ready=1;a(\'https://www.clarity.ms/tag/z4eqcmaic7\');if(ok)ga();if(eu&&ch==null)bar()}if(d.readyState==\'complete\')setTimeout(go,1500);else w.addEventListener(\'load\',function(){setTimeout(go,1500)})})(window,document,navigator);</script>'
CSP_BASE = ("default-src 'self'; script-src 'self' https://static.cloudflareinsights.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms{H}; "
            "style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com; connect-src 'self' https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com; "
            "frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'")
CSP_MARK = 'data-sn="csp"'


def an_add(s):
    if AN_GA in s or '<head' not in s:
        return s
    m = re.search(r'<meta charset="utf-8">', s, re.I)
    if m:
        return s[:m.end()] + AN_SNIP + s[m.end():]
    return re.sub(r'(<head[^>]*>)', lambda x: x.group(1) + AN_SNIP, s, count=1)


def set_csp(s):
    if 'http-equiv="Content-Security-Policy"' in s and CSP_MARK not in s:
        return s                      # the page has its own CSP
    s = an_add(s)
    hashes = []
    for m in re.finditer(r'<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>(.*?)</script>', s, re.S):
        hashes.append("'sha256-%s'" % base64.b64encode(hashlib.sha256(m.group(1).encode('utf-8')).digest()).decode())
    tag = '<meta http-equiv="Content-Security-Policy" %s content="%s">' % (CSP_MARK, CSP_BASE.replace('{H}', ''.join(' ' + h for h in hashes)))
    s2 = re.sub(r'<meta http-equiv="Content-Security-Policy" %s content="[^"]*">' % CSP_MARK, lambda m: tag, s)
    if s2 == s and CSP_MARK not in s:
        s2 = re.sub(r'(<meta charset="utf-8">)', lambda m: m.group(1) + tag, s, count=1, flags=re.I)
    return s2


# ======================================================================
# 1. city pages, need pages, English versions, posters (c/)
# ======================================================================
def add_cc(s, cc):
    """C1: ../?city=London -> ../?city=London&cc=GB (also the incrustar link)."""
    if not cc:
        return s

    def rep(m):
        u = m.group(2)
        if re.search(r'[?&;]cc=', u):
            return m.group(0)
        bump('C1 city links with country')
        u2 = re.sub(r'(\?city=[^"&]*)', lambda x: x.group(1) + '&amp;cc=' + cc, u, count=1)
        return m.group(1) + u2 + '"'
    return re.sub(r'(href=")((?:\.\./|\./|https://supportnear\.com/)(?:incrustar)?\?city=[^"]*)"', rep, s)


def fix_counts(s, lang, f):
    """m1: wording for health, and «21+» where the build capped the count."""
    for old, new in HEALTH_WORD.get(lang, []):
        for o, n in ((old, new), (old[:1].upper() + old[1:], new[:1].upper() + new[1:])):
            if o in s:
                s = s.replace(o, n); bump('m1 health wording')
    # the counts: «21 clinics and hospitals», «медична допомога (21)», «<b>21</b> health care»
    hw = [n for o, n in HEALTH_WORD.get(lang, [])] or []
    for cat, capn in CAPS.items():
        words = []
        if cat == 'health':
            words = hw
        n = str(capn)
        for w in words:
            for ww in (w, w[:1].upper() + w[1:]):
                s2 = re.sub(r'(?<![\d+])%s (%s)' % (n, re.escape(ww)), n + r'+ \1', s)
                s2 = re.sub(r'(%s) \(%s\)' % (re.escape(ww), n), r'\1 (' + n + '+)', s2)
                if s2 != s:
                    bump('m1 capped counts'); s = s2
    # the count tiles (category names come from the app's own strings)
    for cat, capn in CAPS.items():
        lab = CATLABEL.get(lang, {}).get(cat)
        if not lab:
            continue
        for l2 in {lab, lab.lower()}:
            s2 = s.replace('<li><b>%d</b> %s</li>' % (capn, H.escape(l2)), '<li><b>%d+</b> %s</li>' % (capn, H.escape(l2)))
            if s2 != s:
                bump('m1 capped counts'); s = s2
    # need pages of a capped category: «21 places in ...»
    m = CATRX.search(stem_of(f))
    if m and m.group(1) in CAPS and not f.endswith('.cartel.html'):
        n = str(CAPS[m.group(1)])
        lede = re.search(r'<p class="lede">([^<]*)</p>', s)
        if lede and re.search(r'(?<![\d+])%s(?![\d+])' % n, lede.group(1)):
            def plus(t):
                return re.sub(r'(?<![\d.,+])%s(?![\d.,+])' % n, n + '+', t, count=1)
            s2 = re.sub(r'(<p class="lede">)([^<]*)(</p>)', lambda x: x.group(1) + plus(x.group(2)) + x.group(3), s)
            s2 = re.sub(r'(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")([^"]*)(")',
                        lambda x: x.group(1) + plus(x.group(2)) + x.group(3), s2)
            s2 = ld_edit(s2, lambda d: [dict(b, description=plus(b['description'])) if b.get('@type') == 'WebPage' and 'description' in b else b for b in d] if isinstance(d, list) else None)
            if s2 != s:
                bump('m1 capped counts'); s = s2
    return s


def fix_langs13(s, lang):
    """«in 13 languages» is 20 since September."""
    def p13(m):
        t = m.group(0).replace('بثلاث عشرة لغة', 'بـ20 لغة')
        return re.sub(r'(?<![\d])13(?![\d])', '20', t)
    s2 = re.sub(r'<p>(?:O )?SupportNear[^<]*</p>', p13, s)
    s2 = re.sub(r'<div class="free">[^<]*</div>', p13, s2)
    if s2 != s:
        bump('languages 13 -> 20')
    return s2


def drop_blocked(s):
    """M7 (until the data rebuild): drop the places that are not free help."""
    n0 = s
    for pid in BLOCK_IDS:
        s = re.sub(r'<li><div class="pl-h"><a href="\.\./#p=%s@[^"]*">.*?</li>' % re.escape(pid), '', s, flags=re.S)
    for nm in BLOCK_NAMES:
        s = re.sub(r'<li><b>%s</b>.*?</li>' % re.escape(H.escape(nm)), '', s, flags=re.S)

    def ld(d):
        if not isinstance(d, list):
            return None
        ch = False
        for b in d:
            if b.get('@type') == 'ItemList':
                els = b.get('itemListElement', [])
                keep = [e for e in els if not any(('#p=' + pid + '@') in (e.get('item', {}).get('url') or '') for pid in BLOCK_IDS)]
                if len(keep) != len(els):
                    for i, e in enumerate(keep):
                        e['position'] = i + 1
                    b['itemListElement'] = keep; ch = True
        return d if ch else None
    s = ld_edit(s, ld)
    if s != n0:
        bump('M7 non-help places removed')
    return s


def page_country(s):
    m = re.search(r'"containedInPlace": \{"@type": "Country", "name": "([^"]*)"\}', s)
    return json.loads('"%s"' % m.group(1)) if m else ''


def fix_city_file(f, s):
    s = clean_links(s)          # first, so that the incrustar link is already clean for add_cc
    sl = sl_of(f)
    e = ENTRY.get(sl) if sl else None
    lang = page_lang(s)
    poster = f.endswith('.cartel.html')
    if e:
        s = add_cc(s, e['cc'])
        # p5: the city name as people write it in the page language
        if lang != 'en' and e['local']:
            new = local_display(e, lang)
            if new != e['local']:
                s2 = in_name_spans(s, lambda t: swap(swap(t, H.escape(e['local']), H.escape(new)), e['local'], new))
                # «Córdoba <small>· Córdoba</small>»: the small label goes when it says the same
                s2 = s2.replace(' <small style="font-weight:400;color:var(--ink-3)">· %s</small>' % H.escape(new), '')

                def ldl(d):
                    if not isinstance(d, list):
                        return None
                    for b in d:
                        if b.get('@type') in ('WebPage', 'ItemList'):
                            for k in ('name', 'description'):
                                if isinstance(b.get(k), str):
                                    b[k] = swap(b[k], e['local'], new)
                        if isinstance(b.get('about'), dict) and b['about'].get('name') == e['local']:
                            b['about']['name'] = new
                        if b.get('@type') == 'BreadcrumbList':
                            for it in b.get('itemListElement', []):
                                it['name'] = swap(it.get('name', ''), e['local'], new)
                    return d
                s2 = ld_edit(s2, ldl)
                if s2 != s:
                    bump('p5 local names cleaned'); s = s2
        if lang == 'en':
            if e['name'] in EXONYM:
                ex = EXONYM[e['name']]
                s2 = in_name_spans(s, lambda t: wsub(e['name'], ex, t.split('<small')[0]) + (('<small' + t.split('<small', 1)[1]) if '<small' in t else ''))
                s2 = re.sub(r'(<h1>[^<]*?%s)(</h1>)' % re.escape(ex), lambda m: m.group(1) + ' <small style="font-weight:400;color:var(--ink-3)">· ' + H.escape(e['name']) + '</small>' + m.group(2), s2, count=1) \
                    if not re.search(r'<h1>[^<]*<small', s2) and stem_of(f) == sl and not poster else s2

                def ldx(d):
                    if not isinstance(d, list):
                        return None
                    for b in d:
                        for k in ('name', 'description'):
                            if isinstance(b.get(k), str):
                                b[k] = wsub(e['name'], ex, b[k])
                        if b.get('@type') == 'BreadcrumbList':
                            for it in b.get('itemListElement', []):
                                it['name'] = wsub(e['name'], ex, it.get('name', ''))
                        if isinstance(b.get('about'), dict) and b['about'].get('name') == e['name']:
                            b['about']['name'] = ex
                    return d
                s2 = ld_edit(s2, ldx)
                if s2 != s:
                    bump('p5 English names'); s = s2
            elif e['local'] and re.search(r'[ⴰ-⵿]', e['local']):
                new = clean_local(e['local'], 'en', e['name'])
                s2 = s.replace('<small style="font-weight:400;color:var(--ink-3)">· %s</small>' % H.escape(e['local']),
                               '<small style="font-weight:400;color:var(--ink-3)">· %s</small>' % H.escape(new))
                if s2 != s:
                    bump('p5 local names cleaned'); s = s2
        # m2: same name in two countries -> the country goes in the title
        if sl in AMBIG_SL and not poster:
            country = COUNTRY_ES.get(lang, 'España') if e['cc'] == 'ES' else page_country(s)
            disp = re.search(r'"about": \{"@type": "City", "name": "([^"]*)"', s)
            disp = json.loads('"%s"' % disp.group(1)) if disp else ''
            if country and disp:
                tag = '%s (%s)' % (disp, country)

                def addc(t):
                    if tag in t or H.escape(tag) in t:
                        return t
                    return wsub(H.escape(disp), H.escape(tag), t) if H.escape(disp) in t else wsub(disp, tag, t)
                s2 = re.sub(r'(<title>)(.*?)(</title>)', lambda m: m.group(1) + addc(m.group(2)) + m.group(3), s, count=1)
                s2 = re.sub(r'(<meta (?:property|name)="(?:og:title|twitter:title)" content=")([^"]*)(")', lambda m: m.group(1) + addc(m.group(2)) + m.group(3), s2)
                s2 = ld_edit(s2, lambda d: [dict(b, name=addc(b['name'])) if b.get('@type') == 'WebPage' else b for b in d] if isinstance(d, list) else None)
                if s2 != s:
                    bump('m2 titles with country'); s = s2
        # C1: the poster QR of an ambiguous name carries the country too
        if poster and sl in AMBIG_SL:
            url = SITE + '/?city=' + quote(e['name']) + '&cc=' + e['cc']
            svg = QR.get(url)
            if svg:
                s2 = re.sub(r'(<div class="qr">)(<svg.*?</svg>)(</div>)', lambda m: m.group(1) + svg + m.group(3), s, count=1, flags=re.S)
                if s2 != s:
                    bump('C1 poster QR with country'); s = s2
            else:
                bump('WARN poster QR missing')
    s = fix_counts(s, lang, f)
    s = fix_langs13(s, lang)
    s = drop_blocked(s)
    return s


# ======================================================================
# 2. text pages (t/): m10 metadata, names, separator
# ======================================================================
def fix_t_file(f, s):
    s = clean_links(s)
    if f == 'index.html':
        if 'og:image' not in s:
            s = s.replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="index,follow">'
                          '<meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">'
                          '<meta property="og:title" content="Free help by city, text only"><meta property="og:url" content="https://supportnear.com/t/">'
                          '<meta property="og:image" content="%s"><meta name="twitter:card" content="summary_large_image">' % SOCIAL_EN, 1)
            bump('m10 og:image added')
        return s
    sl = sl_of(f)
    e = ENTRY.get(sl) if sl else None
    lang = page_lang(s)
    s2 = re.sub(r'(<title>[^<]*?) - SupportNear</title>', r'\1 · SupportNear</title>', s)
    if s2 != s:
        bump('m10 t/ title separator'); s = s2
    if e:
        disp = e['name']
        if lang != 'en' and e['local']:
            disp = local_display(e, lang)
            s2 = in_name_spans(s, lambda t: wsub(e['name'], disp, t, 1))
            if s2 != s:
                bump('m10 t/ names in page language'); s = s2
        elif lang == 'en' and e['name'] in EXONYM:
            disp = EXONYM[e['name']]
            s2 = in_name_spans(s, lambda t: wsub(e['name'], disp, t))
            if s2 != s:
                bump('p5 English names'); s = s2
        if sl in AMBIG_SL:
            country = COUNTRY_ES.get(lang, 'España') if e['cc'] == 'ES' else (CC_COUNTRY.get((sl, lang)) or e['country'])
            s2 = re.sub(r'(<title>)([^<]*)(</title>)', lambda m: m.group(1) + (m.group(2) if '(' in m.group(2) else wsub(disp, '%s (%s)' % (disp, H.escape(country)), m.group(2))) + m.group(3), s, count=1)
            if s2 != s:
                bump('m2 titles with country'); s = s2
        if 'hreflang' not in s:
            url = SITE + '/t/' + sl
            title = H.unescape(re.search(r'<title>([^<]*)</title>', s).group(1))
            desc = H.unescape((re.search(r'<meta name="description" content="([^"]*)"', s) or re.search('()', '')).group(1))
            ld = [{"@context": "https://schema.org", "@type": "WebPage", "name": title.replace(' · SupportNear', ''), "description": desc,
                   "inLanguage": lang, "url": url, "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": SITE + "/"},
                   "about": {"@type": "City", "name": disp}},
                  {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                      {"@type": "ListItem", "position": 1, "name": "SupportNear", "item": SITE + "/"},
                      {"@type": "ListItem", "position": 2, "name": "Text version", "item": SITE + "/t/"},
                      {"@type": "ListItem", "position": 3, "name": disp, "item": url}]}]
            extra = ('<link rel="alternate" hreflang="%s" href="%s"><link rel="alternate" hreflang="x-default" href="%s">'
                     '<script type="application/ld+json">%s</script>') % (lang, url, url, json.dumps(ld, ensure_ascii=False).replace('</', '<\\/'))
            s = s.replace('<meta name="description"', extra + '<meta name="description"', 1)
            bump('m10 t/ hreflang + JSON-LD')
        s = add_cc(s, e['cc'])
    s = fix_counts(s, lang, f)
    s = drop_blocked(s)
    return s


# ======================================================================
# 3. language pages /xx/ (M4): indexable, self-canonical, one reciprocal cluster
# ======================================================================
LANGS = [('es', 'es_ES'), ('fr', 'fr_FR'), ('ar', 'ar_AR'), ('uk', 'uk_UA'), ('ro', 'ro_RO'), ('pl', 'pl_PL'),
         ('ru', 'ru_RU'), ('pt', 'pt_PT'), ('ur', 'ur_PK'), ('fa', 'fa_IR'), ('wo', 'wo_SN'), ('bm', 'bm_ML'),
         ('ti', 'ti_ER'), ('ps', 'ps_AF'), ('so', 'so_SO'), ('am', 'am_ET'), ('tr', 'tr_TR'), ('bn', 'bn_BD'), ('zh', 'zh_CN')]
RTL = {'ar', 'ur', 'fa', 'ps'}
EN = {'wel.h': 'Free help near you', 'brand.tag': 'Free food, a bed, a shower, a doctor — near you',
      'pass.txt': 'Free map of free help near you: food, a bed, showers, doctors, clothes. No account, works with no signal, in 20 languages.',
      'wel.p': 'Food, a bed for tonight, a shower, a doctor, clothes, legal help: on one map, from wherever you are standing. Free, no account, in 20 languages, and it keeps working with no signal.',
      'wel.trust': 'No account · No cost · No ads · Works offline', 'cta.open': 'Open the map',
      'cta.emergency': 'Emergency numbers', 'menu.cities': 'All cities'}
ALTS = ('<link rel="alternate" hreflang="x-default" href="https://supportnear.com/">'
        '<link rel="alternate" hreflang="en" href="https://supportnear.com/">'
        + ''.join('<link rel="alternate" hreflang="%s" href="https://supportnear.com/%s/">' % (c, c) for c, _ in LANGS))


def social(lang):
    for f in ('social-%s.jpg' % lang, 'social.jpg'):
        if exists(f):
            return SITE + '/%s?v=%s' % (f, hashlib.sha1(open(os.path.join(B, f), 'rb').read()).hexdigest()[:8])
    return SITE + '/social.jpg'


SOCIAL_EN = social('en')


def lang_page(code, loc, t):
    e = lambda k: H.escape(t.get(k) or EN[k])
    go = '../?lang=%s' % code
    url = SITE + '/%s/' % code
    en = code == 'en'
    ld = {"@context": "https://schema.org", "@type": "WebPage", "name": t.get('wel.h') or EN['wel.h'],
          "description": t.get('pass.txt') or EN['pass.txt'], "inLanguage": code, "url": SITE + '/' if en else url,
          "isPartOf": {"@type": "WebSite", "name": "SupportNear", "url": SITE + "/"}}
    # Shared links to a place (#p=...) and people who already use the map go
    # straight to it; a first visit sees this page, which is also what search
    # engines index (a redirect for everyone would make the page unindexable).
    js = ("(function(){var g=%s,h=location.hash,r=0;try{for(var i=0;i<localStorage.length;i++){"
          "if(String(localStorage.key(i)).indexOf('sn.')===0){r=1;break}}}catch(e){}"
          "if(h||r%s)location.replace(g+h)})();") % (json.dumps(go), '||1' if en else '')
    return f'''<!DOCTYPE html>
<html lang="{code}"{' dir="rtl"' if code in RTL else ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e('wel.h')} · SupportNear</title>
<meta name="description" content="{e('pass.txt')}">
<meta name="robots" content="{'noindex,follow' if en else 'index,follow'}">
<link rel="canonical" href="{SITE + '/' if en else url}">
{ALTS}
<meta property="og:type" content="website">
<meta property="og:site_name" content="SupportNear">
<meta property="og:locale" content="{loc}">
<meta property="og:url" content="{SITE + '/' if en else url}">
<meta property="og:title" content="{e('wel.h')} · SupportNear">
<meta property="og:description" content="{e('pass.txt')}">
<meta property="og:image" content="{social(code)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e('brand.tag')}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="twitter:title" content="{e('wel.h')} · SupportNear"><meta name="twitter:description" content="{e('pass.txt')}">
<meta name="twitter:image" content="{social(code)}"><meta name="twitter:image:alt" content="{e('brand.tag')}">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="../favicon.ico" sizes="32x32"><link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<script>{js}</script>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False).replace('</', '<\\/')}</script>
<style>body{{font:18px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0;background:#FBF8F3;color:#14110E}}
main{{max-width:34em;margin:0 auto;padding:40px 20px 56px;text-align:center}}
.b{{font-weight:800;color:#0B7A63;margin:0 0 18px}}
h1{{font-size:32px;line-height:1.15;margin:0 0 14px}}
.l{{color:#4A443C;margin:0 0 26px}}
.go{{display:inline-block;padding:16px 28px;border-radius:14px;background:#0B7A63;color:#fff;font-weight:700;font-size:20px;text-decoration:none}}
.t{{font-size:14px;color:#7A7168;margin:18px 0 26px}}
.s a{{color:#0B7A63;font-weight:600;margin:0 10px;display:inline-block;padding:8px 0}}
@media (prefers-color-scheme:dark){{body{{background:#0A0E14;color:#F2F5F7}}.l{{color:#B3BDC7}}.t{{color:#8592A0}}.b,.s a{{color:#3ECFA9}}.go{{background:#3ECFA9;color:#0A0E14}}}}</style>
</head>
<body><main>
<p class="b">SupportNear</p>
<h1>{e('wel.h')}</h1>
<p class="l">{e('wel.p')}</p>
<a class="go" href="{go}">{e('cta.open')}</a>
<p class="t">{e('wel.trust')}</p>
<p class="s"><a href="{go}&amp;sos=1">{e('cta.emergency')}</a><a href="../c/">{e('menu.cities')}</a></p>
</main></body>
</html>'''


def build_lang_pages(out):
    for code, loc in LANGS + [('en', 'en_US')]:
        rel = '%s/index.html' % code
        if code == 'en':
            t = EN
        else:
            try:
                t = json.load(io.open(os.path.join(B, 'l', code + '.json'), encoding='utf-8')).get('t', {})
            except Exception:
                bump('WARN no l/%s.json' % code); continue
        out[rel] = lang_page(code, loc, t)


# ======================================================================
# 4. the homepage (index.html): only <head> metadata and markup links (M4, M5)
# ======================================================================
def fix_home(s):
    head_end = s.index('</head>')
    head, rest = s[:head_end], s[head_end:]
    h2 = re.sub(r'(?:<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*)+',
                lambda m: '\n'.join(re.findall(r'<link [^>]*>', ALTS.replace('><', '>\n<'))) + '\n', head, count=1)
    h2 = re.sub(r'"inLanguage": \[[^\]]*\]', '"inLanguage": %s' % json.dumps(['en'] + [c for c, _ in LANGS]), h2, count=1)
    h2 = re.sub(r'(?:<meta property="og:locale:alternate" content="[^"]*">\s*)+',
                lambda m: '\n'.join('<meta property="og:locale:alternate" content="%s">' % l for _, l in LANGS) + '\n', h2, count=1)
    if h2 != head:
        bump('M4 homepage hreflang/inLanguage/og:locale')
    return clean_links(h2 + rest)


# ======================================================================
# 5. other pages
# ======================================================================
def fix_huecos(s):
    """M1: the table linked to /luena.html (404) instead of /c/luena."""
    def rep(m):
        bump('M1 huecos links')
        return '<td><a href="c/%s">' % m.group(1)
    return re.sub(r'<td><a href="([a-z0-9-]+)\.html">', rep, s)


def fix_info_page(s, name):
    """m11 claims, p2 payload, C1 embed snippet, p4 preview URL."""
    m = re.search(r'(<script>\s*/\*.*?\*/\s*var T = )(\{.*?\});(\s*var RTL)', s, re.S)
    if m:
        raw = m.group(2)
        T = json.loads(raw)
        if json.dumps(T, ensure_ascii=False, separators=(',', ':')) == raw:
            for L, tt in T.items():
                for k in list(tt):
                    for S, new in CLAIMS['full'].items():
                        if k in new and tt[k] == CLAIMS['old'][S].get(k):
                            tt[k] = new[k]; bump('m11 claims rewritten')
                    for S, pairs in CLAIMS['part'].items():
                        for kk, old, new in pairs:
                            if k == kk and old in tt[k]:
                                tt[k] = tt[k].replace(old, new); bump('m11 claims rewritten')
                if 'e.o5' not in tt:
                    tt['e.o5'] = CLAIMS['eo5'].get(L) or CLAIMS['eo5'].get({'wo': 'fr', 'bm': 'fr'}.get(L, 'en')) or CLAIMS['eo5']['en']
            # p2: languages without their own translation were full copies of the
            # English (or French) strings: ~20 KB each in every page.
            fb = {'wo': 'fr', 'bm': 'fr'}
            for L in [l for l in T if l not in CLAIMS['tr_langs']]:
                if T[L] == T.get(fb.get(L, 'en')):
                    del T[L]; bump('p2 duplicate language tables dropped')
            raw2 = json.dumps(T, ensure_ascii=False, separators=(',', ':'))
            s = s[:m.start(2)] + raw2 + s[m.end(2):]
            # with the copies gone, a Wolof or Bambara browser still gets French
            s = s.replace("    if(T[c]) return c;\n  }", "    if(T[c]) return c;\n    if(T[FB[c]]) return FB[c];\n  }", 1)
            s = s.replace("if(s && T[s]) return s; }catch(e){}", "if(s && T[s]) return s; if(s && T[FB[s]]) return FB[s]; }catch(e){}", 1)
        # the English text written in the HTML
        for k, v in CLAIMS['full']['en'].items():
            if k == 'v4':
                continue        # R20: lo escribe ya i18n_pages.py (GA4 + Clarity)
            s2 = re.sub(r'(<(\w+)[^>]*\bdata-t="%s"[^>]*>)(.*?)(</\2>)' % re.escape(k), lambda x: x.group(1) + v + x.group(4), s, flags=re.S)
            if s2 != s:
                s = s2
        for kk, old, new in CLAIMS['part']['en']:
            s = re.sub(r'(<(\w+)[^>]*\bdata-t="%s"[^>]*>)(.*?)(</\2>)' % re.escape(kk), lambda x: x.group(1) + x.group(3).replace(old, new) + x.group(4), s, flags=re.S)
    # «Direct links» of the press kit: the clean addresses (M5)
    for old, new in (('supportnear.com/prensa.html       ', 'supportnear.com/prensa            '),
                     ('supportnear.com/incrustar.html    ', 'supportnear.com/incrustar         '),
                     ('supportnear.com/cambios.html       ', 'supportnear.com/cambios            ')):
        if old in s:
            s = s.replace(old, new); bump('M5 press-kit addresses')
    if name == 'incrustar.html':
        if 'data-t="e.o5"' not in s:
            s = s.replace('<tr><td class="n">&amp;need=food</td>',
                          '<tr><td class="n">&amp;cc=GB</td><td data-t="e.o5">%s</td></tr><tr><td class="n">&amp;need=food</td>' % CLAIMS['eo5']['en'], 1)
            bump('C1 embed: cc option documented')
        if 'id="sn-city"' not in s:
            s = s.replace('</body>', '<script id="sn-city">' + EMBED_JS + '</script></body>', 1)
            bump('C1 embed snippet follows ?city=&cc=')
    return s


EMBED_JS = r"""(function(){var q=new URLSearchParams(location.search),c=(q.get('city')||'').trim().slice(0,80),cc=(q.get('cc')||'').trim().toUpperCase();if(!c)return;if(!/^[A-Z]{2}$/.test(cc))cc='';var p='?embed=1&city='+encodeURIComponent(c)+(cc?'&cc='+cc:'');function fix(){var k=document.querySelector('pre code');if(k)k.textContent='<iframe src="https://supportnear.com/'+p+'"\n        width="100%" height="600" style="border:0;border-radius:12px"\n        loading="lazy" title="SupportNear">\n</iframe>';var f=document.querySelector('figure iframe');if(f&&f.getAttribute('src')!=='./'+p)f.setAttribute('src','./'+p);var e=document.querySelector('[data-t="e.city"] code');if(e)e.textContent=c;}fix();if(typeof apply==='function'){var a=apply;apply=function(l){a(l);fix();};}})();"""


def fix_about(s):
    """p3: one h1, English first (the English UI links here), right lang; m13: no
    Cloudflare e-mail rewriting of the contact link."""
    if '<html lang="es">' in s:
        m = re.search(r'(<section lang="es">.*?</section>)\s*(<section lang="en">.*?</section>)', s, re.S)
        if m:
            es = m.group(1).replace('<h1>', '<h2 class="h1">').replace('</h1>', '</h2>', 1).replace('id="security"', 'id="seguridad"')
            s = s[:m.start()] + m.group(2) + '\n' + es + s[m.end():]
            s = s.replace('<html lang="es">', '<html lang="en">', 1)
            s = s.replace('<title>Quién está detrás · SupportNear</title>', '<title>Who is behind SupportNear · Quién está detrás</title>', 1)
            s = s.replace('</style>', '\nh2.h1{font-size:28px;margin:0 0 10px;border:0;padding:0}</style>', 1)
            s = s.replace('&larr; Abrir el mapa · Open the map', '&larr; Open the map · Abrir el mapa', 1)
            bump('p3 about: one h1, English first')
    s2 = re.sub(r'(?<!<!--email_off-->)(<a href="mailto:[^"]*">[^<]*</a>)', r'<!--email_off-->\1<!--/email_off-->', s)
    if s2 != s:
        bump('m13 e-mail links excluded from Cloudflare obfuscation'); s = s2
    return s


def fix_cambios(s):
    """m7: an empty diff was shown as news (0 new · 0 gone)."""
    m = re.search(r'<div class="statbar"><div><b>0</b><span>new places</span></div><div><b>0</b><span>gone</span></div>'
                  r'<div><b>\+0</b><span>net</span></div><div><b>([\d-]+)</b><span>since</span></div></div>.*?It does not always mean it closed\.</p>', s, re.S)
    if m:
        upd = re.search(r'Updated ([\d-]+)\.', s)
        upd = upd.group(1) if upd else ''
        s = s[:m.start()] + ('<div class="card"><p>The last comparison, between the data of %s and of %s, found no places added or removed, '
                             'so there is nothing new to list. The comparison is made again with each data update from OpenStreetMap, '
                             'and what changed will appear here.</p></div>' % (m.group(1), upd)) + s[m.end():]
        s = s.replace('Updated %s. This page is generated from the data itself each time it is published.' % upd,
                      'Last compared on %s. This page is generated from the data itself each time the data is updated.' % upd, 1)
        bump('m7 cambios: no empty diff shown as news')
    s2 = re.sub(r'<h2>Where people found nothing</h2><p>[^<]*<code>worker/reports\.js</code>\)\.</p>\s*', '', s)
    if s2 != s:
        bump('m7 cambios: internal note removed'); s = s2
    return s


def fix_sitemap(s, changed_urls, lang_urls):
    urls = re.findall(r'<loc>([^<]*)</loc>', s)
    have = set(urls)
    add = [u for u in [SITE + '/about', SITE + '/impacto'] + lang_urls if u not in have]
    for u in add:
        pr = '0.6' if '/about' in u or '/impacto' in u else '0.8'
        s = s.replace('</urlset>', '<url><loc>%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n</urlset>' % (u, TODAY, pr), 1)
        bump('m9/M4 sitemap URLs added')

    def lm(m):
        if m.group(1) in changed_urls and m.group(2) != TODAY:
            bump('m7 sitemap lastmod updated')
            return '<loc>%s</loc><lastmod>%s</lastmod>' % (m.group(1), TODAY)
        return m.group(0)
    return re.sub(r'<loc>([^<]*)</loc><lastmod>([^<]*)</lastmod>', lm, s)


PAGE_404 = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page not found · SupportNear</title><meta name="robots" content="noindex">
<link rel="icon" href="/favicon.ico" sizes="32x32"><meta name="theme-color" content="#0B7A63">
<style>body{font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;margin:0;background:#FBF8F3;color:#14110E}
main{max-width:34em;margin:0 auto;padding:40px 20px}h1{font-size:28px;margin:0 0 10px}p{color:#4A443C}
a.b{display:block;margin:10px 0;padding:14px 18px;border-radius:12px;background:#0B7A63;color:#fff;font-weight:700;text-decoration:none;text-align:center}
a.b.s{background:#C8351B}a.b.g{background:#fff;color:#0B7A63;border:1px solid #E6DFD3}
@media (prefers-color-scheme:dark){body{background:#0A0E14;color:#F2F5F7}p{color:#B3BDC7}a.b.g{background:#121821;color:#3ECFA9;border-color:#232C38}}</style></head>
<body><main><p><b>SupportNear</b></p>
<h1>This page does not exist</h1>
<p>The link may be old. The map and the city pages are still here. <span lang="es">Esta página no existe; el mapa sigue aquí.</span></p>
<a class="b" href="/">Open the map · Abrir el mapa</a>
<a class="b g" href="/c/">All cities · Todas las ciudades</a>
<a class="b s" href="/?sos=1">Emergency numbers · Números de emergencia</a>
</main></body></html>
"""

# ======================================================================
# 6. the worker: www -> apex (M6), cache headers (m5), Google file (p6)
# ======================================================================
W_MARK = '// supportnear-only (QA 27-oct-2026)'
W_FUNC = W_MARK + """: browser caching for supportnear.com assets (m5) and the Google
// verification file served at its .html URL instead of the clean-URL 308 (p6).
const SN_IMM = 'public, max-age=31536000, immutable';
async function snFinish(req, u, r, env) {
  const p = u.pathname, get = req.method === 'GET' || req.method === 'HEAD';
  if (get && r.status === 308 && /^\\/google[0-9a-f]{8,40}\\.html$/.test(p)) {
    const g = await env.ASSETS.fetch(new Request(new URL('/_s/supportnear.com' + p.slice(0, -5), u), req));
    return g.status === 200 ? g : r;
  }
  if (!get || r.status !== 200) return r;
  const v = u.searchParams.has('v');
  let cc = null;
  if (/^\\/[dl]\\/[^/]+\\.json$/.test(p)) cc = v ? SN_IMM : 'public, max-age=3600';
  else if (/^\\/social[\\w-]*\\.(?:jpg|png)$/.test(p)) cc = v ? SN_IMM : 'public, max-age=86400';
  else if (/\\.(?:png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(p)) cc = 'public, max-age=86400, stale-while-revalidate=604800';
  else if (/\\.(?:json|csv|js)$/i.test(p) && p !== '/sw.js') cc = v ? 'public, max-age=86400' : 'public, max-age=3600';
  if (!cc) return r;
  const h = new Headers(r.headers); h.set('cache-control', cc);
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}
"""
W_A1 = "    const u = new URL(req.url);\n    let host = u.hostname.replace(/^www\\./, '');\n"
W_A1N = ("    const u = new URL(req.url);\n"
         "    " + W_MARK + ", M6: one canonical host, one 301 hop, same path and query\n"
         "    if (u.hostname === 'www.supportnear.com') return Response.redirect('https://supportnear.com' + u.pathname + u.search, (req.method === 'GET' || req.method === 'HEAD') ? 301 : 308);\n"
         "    let host = u.hostname.replace(/^www\\./, '');\n")
W_A2 = "    if (u.pathname.startsWith('/__sb/')) return sbProxy(req, u);\n    return this.site(req, env, ctx, u, host);\n"
W_A2N = ("    if (u.pathname.startsWith('/__sb/')) return sbProxy(req, u);\n"
         "    if (host === 'supportnear.com') return snFinish(req, u, await this.site(req, env, ctx, u, host), env);  " + W_MARK + "\n"
         "    return this.site(req, env, ctx, u, host);\n")
W_A3 = "export default {\n"


def patch_worker():
    if not os.path.isfile(WORKER):
        print('worker: %s not found, skipped' % WORKER); return False
    s = io.open(WORKER, encoding='utf-8', newline='').read()
    if W_MARK in s:
        print('worker: already patched'); return False
    if s.count(W_A1) != 1 or s.count(W_A2) != 1 or s.count(W_A3) != 1:
        print('WORKER NOT PATCHED: anchors not found (the worker changed). Apply the block in notes.md by hand.')
        bump('WARN worker not patched'); return False
    s = s.replace(W_A1, W_A1N).replace(W_A2, W_A2N).replace(W_A3, W_FUNC + W_A3)
    io.open(WORKER, 'w', encoding='utf-8', newline='').write(s)
    print('worker: patched (www redirect, cache headers, Google file) for supportnear.com only')
    return True


# ======================================================================
# run
# ======================================================================
CATLABEL = {}
try:
    CATLABEL['en'] = {'health': 'Health care', 'warm': 'A warm place to be', 'water': 'Drinking water'}
    for f in os.listdir(os.path.join(B, 'l')):
        if f.endswith('.json') and len(f) <= 7:
            t = json.load(io.open(os.path.join(B, 'l', f), encoding='utf-8')).get('t', {})
            CATLABEL[f[:-5]] = {c: t.get('cat.%s.n' % c) for c in CAPS}
except Exception:
    pass
CC_COUNTRY = {}


def main():
    out = {}            # rel path -> new content
    changed_vis = set()
    # language pages first: their URLs go into the sitemap
    build_lang_pages(out)
    for f in CFILES:
        rel = 'c/' + f
        s = rd(rel)
        n = s if f == 'index.html' else fix_city_file(f, s)
        if f != 'index.html':
            sl = sl_of(f)
            if sl and not f.endswith('.cartel.html'):
                CC_COUNTRY.setdefault((sl, page_lang(s)), page_country(s))
        out[rel] = n
    for f in TFILES:
        rel = 't/' + f
        out[rel] = fix_t_file(f, rd(rel))
    for rel in ('huecos.html',):
        if exists(rel):
            out[rel] = fix_huecos(rd(rel))
    for rel in ('prensa.html', 'incrustar.html', 'instalar.html'):
        if exists(rel):
            out[rel] = fix_info_page(rd(rel), rel)
    if exists('about.html'):
        out['about.html'] = fix_about(rd('about.html'))
    if exists('cambios.html'):
        out['cambios.html'] = fix_cambios(rd('cambios.html'))
    if exists('impacto.html'):
        s = rd('impacto.html')
        if 'og:image' not in s:
            s = s.replace('</title>', '</title><meta property="og:type" content="website"><meta property="og:site_name" content="SupportNear">'
                          '<meta property="og:url" content="https://supportnear.com/impacto"><meta property="og:image" content="%s">'
                          '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
                          '<meta name="twitter:card" content="summary_large_image">' % SOCIAL_EN, 1)
            bump('m10 og:image added')
        out['impacto.html'] = s
    out['index.html'] = fix_home(rd('index.html'))
    if exists('.well-known/security.txt'):
        st = rd('.well-known/security.txt')
        out['.well-known/security.txt'] = st.replace('https://supportnear.com/about.html#security', 'https://supportnear.com/about#security')
    if not exists('404.html') or rd('404.html') != PAGE_404:
        out['404.html'] = PAGE_404

    # M5 on every page, then CSP (p1) on the static pages
    for rel in list(out):
        if not rel.endswith('.html'):
            continue
        s = out[rel]
        if rel != 'index.html':
            s = clean_links(s)
        if rel not in ('index.html', 'impacto.html', 'actualizar.html', 'google96c3e59d29b71a66.html'):
            s = set_csp(s)
        out[rel] = s

    nchanged = 0
    for rel, s in sorted(out.items()):
        p = os.path.join(B, rel)
        old = io.open(p, encoding='utf-8', newline='').read() if os.path.isfile(p) else None
        if old == s:
            continue
        if old is None or visible(old) != visible(s):
            u = rel[:-5] if rel.endswith('.html') else rel
            u = u[:-5] if u.endswith('index') else u
            changed_vis.add(SITE + '/' + u)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        io.open(p, 'w', encoding='utf-8', newline='').write(s)
        nchanged += 1
    # m6: the internal memo leaves the deploy (the source stays in src/supportnear)
    if exists('falta.html'):
        os.remove(os.path.join(B, 'falta.html')); bump('m6 falta.html removed'); nchanged += 1
    if exists('sitemap.xml'):
        sm = rd('sitemap.xml')
        sm2 = fix_sitemap(sm, changed_vis, [SITE + '/%s/' % c for c, _ in LANGS])
        if sm2 != sm:
            io.open(os.path.join(B, 'sitemap.xml'), 'w', encoding='utf-8', newline='').write(sm2); nchanged += 1
    wk = patch_worker()
    print('files changed under _s/supportnear.com: %d%s' % (nchanged, ' (+ _worker.js/index.js)' if wk else ''))
    for k in sorted(COUNT):
        print('  %-48s %d' % (k, COUNT[k]))
    unknown = [f for f in CFILES if f != 'index.html' and not ENTRY.get(sl_of(f) or '')]
    print('  %-48s %d%s' % ('c/ files with no city match (left as they were)', len(unknown), (' e.g. ' + ', '.join(unknown[:5])) if unknown else ''))


main()
