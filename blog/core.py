# -*- coding: utf-8 -*-
"""Nucleo del blog de SupportNear: plantilla, mini-markdown, datos de las paginas vivas.
Las paginas salen con el mismo CSS, cabecera de medicion y CSP que las paginas de ciudad."""
import re, json, html as H, io, os, csv, math, collections, datetime

LIVE = '/home/claude/sn/pub/_s/supportnear.com'
OUT = '/home/claude/sn/stage_blog/_s/supportnear.com'
TODAY = '2026-11-27'
SITE = 'https://supportnear.com'
CITIES = json.load(open('/home/claude/sn/blog/cities_live.json', encoding='utf-8'))
HELP = json.load(open('/home/claude/sn/src/helplines/social.json', encoding='utf-8'))

_ref = open(LIVE + '/c/madrid-food.html', encoding='utf-8').read()
HEAD_SNIP = re.search(r'(<meta http-equiv="Content-Security-Policy".*?</script>)', _ref, re.S).group(1)
CSS = re.search(r'<style>(.*?)</style>', _ref, re.S).group(1)
SOCIAL_V = re.search(r'social-es\.jpg\?v=([0-9a-f]+)', _ref).group(1)
EXTRA_CSS = """
.crumbs{font-size:13.5px;color:var(--ink-3);margin:-14px 0 14px}
.crumbs a{color:var(--ink-3)}
.meta{font-size:13.5px;color:var(--ink-3);margin:0 0 26px}
.ans{background:var(--brand-soft);border-radius:14px;padding:16px 20px;margin:0 0 26px;color:var(--ink)}
.ans p{color:var(--ink);margin:0}
.toc{font-size:15px;margin:0 0 26px}
.toc a{text-decoration:none}
details.faq{border-bottom:1px solid var(--line);padding:12px 0}
details.faq summary{cursor:pointer;font-weight:650;color:var(--ink)}
details.faq p{margin:10px 0 0}
.src{font-size:13.5px;color:var(--ink-3)}
.src li{max-width:none}
.post{list-style:none;padding:0;margin:0 0 20px}
.post li{padding:12px 0;border-bottom:1px solid var(--line)}
.post a{font-weight:650;text-decoration:none;font-size:17px}
.post span{display:block;color:var(--ink-3);font-size:14.5px}
.bar{display:flex;align-items:center;gap:10px;font-size:14px;margin:0 0 6px}
.bar i{display:block;height:12px;background:var(--brand);border-radius:3px;min-width:2px}
.bar span{min-width:9.5em;color:var(--ink-2)}
.bar b{font-variant-numeric:tabular-nums;color:var(--ink)}
.tool fieldset{border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin:0 0 12px}
.tool legend{font-weight:650;color:var(--ink)}
.tool label{display:block;margin:4px 0}
.print-sheet{border:1px dashed var(--line);border-radius:12px;padding:18px 20px;margin:0 0 18px}
@media print{.top,.btns,footer,.noprint{display:none}.print-sheet{border:0}}
"""

LOGO = ('<a class="logo" href="../" aria-label="SupportNear"><svg viewBox="0 0 24 24" aria-hidden="true">'
        '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/></svg></a><b>SupportNear</b>')

UI = {
 'es': {'blog': 'Guías', 'map': 'Abrir el mapa', 'upd': 'Actualizado el', 'by': 'por', 'faq': 'Preguntas frecuentes',
        'src': 'Fuentes', 'rel': 'Sigue leyendo', 'foot': 'Datos de OpenStreetMap', 'who': 'Quién está detrás',
        'all': 'Todas las guías', 'emg': 'Si hay peligro para la vida, llama al 112 (gratis, sin saldo).', 'in': 'Contenido'},
 'en': {'blog': 'Guides', 'map': 'Open the map', 'upd': 'Updated', 'by': 'by', 'faq': 'Questions people ask',
        'src': 'Sources', 'rel': 'Read next', 'foot': 'Data from OpenStreetMap', 'who': 'Who is behind it',
        'all': 'All guides', 'emg': 'If someone’s life is in danger, call the local emergency number now.', 'in': 'Contents'},
 'fr': {'blog': 'Guides', 'map': 'Ouvrir la carte', 'upd': 'Mis à jour le', 'by': 'par', 'faq': 'Questions fréquentes',
        'src': 'Sources', 'rel': 'À lire aussi', 'foot': 'Données OpenStreetMap', 'who': 'Qui est derrière',
        'all': 'Tous les guides', 'emg': 'En cas de danger, appelez le 112 ou le 115 (gratuits).', 'in': 'Sommaire'},
 'pt': {'blog': 'Guias', 'map': 'Abrir o mapa', 'upd': 'Atualizado a', 'by': 'por', 'faq': 'Perguntas frequentes',
        'src': 'Fontes', 'rel': 'Leia também', 'foot': 'Dados do OpenStreetMap', 'who': 'Quem está por trás',
        'all': 'Todos os guias', 'emg': 'Em caso de perigo, ligue 112 (grátis).', 'in': 'Conteúdo'},
 'de': {'blog': 'Ratgeber', 'map': 'Karte öffnen', 'upd': 'Aktualisiert am', 'by': 'von', 'faq': 'Häufige Fragen',
        'src': 'Quellen', 'rel': 'Weiterlesen', 'foot': 'Daten von OpenStreetMap', 'who': 'Wer dahinter steht',
        'all': 'Alle Ratgeber', 'emg': 'Bei Lebensgefahr: 112 anrufen (kostenlos).', 'in': 'Inhalt'},
 'uk': {'blog': 'Поради', 'map': 'Відкрити карту', 'upd': 'Оновлено', 'by': '', 'faq': 'Часті питання',
        'src': 'Джерела', 'rel': 'Читайте також', 'foot': 'Дані OpenStreetMap', 'who': 'Хто за цим стоїть',
        'all': 'Усі поради', 'emg': 'Якщо є загроза життю, дзвоніть 112 (безкоштовно).', 'in': 'Зміст'},
 'ru': {'blog': 'Советы', 'map': 'Открыть карту', 'upd': 'Обновлено', 'by': '', 'faq': 'Частые вопросы',
        'src': 'Источники', 'rel': 'Читайте также', 'foot': 'Данные OpenStreetMap', 'who': 'Кто за этим стоит',
        'all': 'Все советы', 'emg': 'Если есть угроза жизни, звоните 112 (бесплатно).', 'in': 'Содержание'},
 'ar': {'blog': 'أدلة', 'map': 'افتح الخريطة', 'upd': 'آخر تحديث', 'by': '', 'faq': 'أسئلة شائعة',
        'src': 'المصادر', 'rel': 'اقرأ أيضًا', 'foot': 'بيانات OpenStreetMap', 'who': 'من يقف وراءه',
        'all': 'كل الأدلة', 'emg': 'إذا كانت الحياة في خطر، اتصل بـ 112 (مجانًا).', 'in': 'المحتوى'},
 'ur': {'blog': 'رہنمائی', 'map': 'نقشہ کھولیں', 'upd': 'تازہ کاری', 'by': '', 'faq': 'عام سوالات',
        'src': 'ذرائع', 'rel': 'مزید پڑھیں', 'foot': 'OpenStreetMap کا ڈیٹا', 'who': 'اس کے پیچھے کون ہے',
        'all': 'تمام رہنمائی', 'emg': 'جان کو خطرہ ہو تو 112 پر کال کریں (مفت)۔', 'in': 'فہرست'},
}
RTL = {'ar', 'ur', 'fa'}
MONTHS = {'es': ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
          'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']}


def fdate(d, lang):
    y, m, dd = d.split('-')
    if lang == 'es': return '%d de %s de %s' % (int(dd), MONTHS['es'][int(m) - 1], y)
    if lang == 'en': return '%d %s %s' % (int(dd), MONTHS['en'][int(m) - 1], y)
    return d


def esc(s): return H.escape(s, quote=True)


def inline(s):
    """**negrita**, [texto](url), `codigo`; el resto se escapa."""
    out = []; i = 0
    pat = re.compile(r'\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`')
    for m in pat.finditer(s):
        out.append(esc(s[i:m.start()]))
        if m.group(1) is not None: out.append('<strong>%s</strong>' % inline(m.group(1)))
        elif m.group(2) is not None:
            u = m.group(3); ext = u.startswith('http') and not u.startswith(SITE)
            out.append('<a href="%s"%s>%s</a>' % (esc(u), ' rel="noopener"' if ext else '', inline(m.group(2))))
        else: out.append('<code>%s</code>' % esc(m.group(4)))
        i = m.end()
    out.append(esc(s[i:]))
    return ''.join(out)


DATA = {}  # nombre -> funcion(args) -> html


def md(text, ctx=None):
    """Mini-markdown: ## h2, ### h3, - lista, 1. lista, > aviso, ! respuesta, {{fn:args}} datos, linea en blanco = parrafo."""
    lines = text.strip('\n').split('\n'); out = []; buf = []; lst = None; toc = []
    def flush():
        nonlocal buf
        if buf: out.append('<p>%s</p>' % inline(' '.join(x.strip() for x in buf))); buf = []
    def close():
        nonlocal lst
        if lst: out.append('<%s>%s</%s>' % (lst[0], ''.join('<li>%s</li>' % inline(x) for x in lst[1]), lst[0])); lst = None
    for ln in lines + ['']:
        s = ln.rstrip()
        if not s.strip(): flush(); close(); continue
        if s.startswith('## ') or s.startswith('### '):
            flush(); close(); lvl = 2 if s.startswith('## ') else 3; t = s[lvl + 1:].strip()
            hid = re.sub(r'[^a-z0-9]+', '-', H.unescape(t).lower().translate(str.maketrans('áéíóúüñçàèòï', 'aeiouuncaeoi'))).strip('-')[:60]
            if lvl == 2: toc.append((hid, t))
            out.append('<h%d id="%s">%s</h%d>' % (lvl, hid, inline(t), lvl)); continue
        m = re.match(r'^\{\{(\w+)(?::(.*))?\}\}$', s.strip())
        if m:
            flush(); close(); fn = DATA[m.group(1)]; args = [a.strip() for a in (m.group(2) or '').split('|')] if m.group(2) else []
            out.append(fn(*args)); continue
        if s.startswith('- ') or re.match(r'^\d+\. ', s):
            flush(); kind = 'ul' if s.startswith('- ') else 'ol'; item = s[2:] if kind == 'ul' else s.split('. ', 1)[1]
            if lst and lst[0] == kind: lst[1].append(item)
            else: close(); lst = [kind, [item]]
            continue
        if s.startswith('  ') and lst: lst[1][-1] += ' ' + s.strip(); continue
        if s.startswith('> '):
            flush(); close(); out.append('<div class="emg">%s</div>' % inline(s[2:])); continue
        if s.startswith('! '):
            flush(); close(); out.append('<div class="ans"><p>%s</p></div>' % inline(s[2:])); continue
        if s.startswith('<'):
            flush(); close(); out.append(s); continue
        close(); buf.append(s)
    return '\n'.join(out), toc


# ---------- datos de las paginas vivas ----------
def count_of(c, need):
    v = c['needs'].get(need)
    if not v: return 0, False
    m = re.match(r'(\d+)(\+?)', v['lede'].replace('.', '').replace(',', ''))
    return (int(m.group(1)), bool(m.group(2))) if m else (len(v['places']), False)


def cities_where(cc=None, lang=None, ccs=None):
    out = []
    for c in CITIES.values():
        if 'needs' not in c or c.get('robots_noindex'): continue
        if cc and c.get('cc') != cc: continue
        if ccs and c.get('cc') not in ccs: continue
        if lang and c.get('lang') != lang: continue
        out.append(c)
    return out


def place_li(p, show_tel=True):
    ex = ''.join('<span class="ad">%s</span>' % esc(x) for x in p['extra'] if x)
    return '<li><div class="pl-h"><a href="%s">%s</a><span class="ct">%s</span></div>%s</li>' % (esc(p['href']), esc(p['name']), esc(p['ct']), ex)


def generic(p):
    n = p['name'].strip().lower()
    return len(n) < 4 or n in ('comedor', 'albergue', 'duchas', 'baños públicos', 'aseos', 'public toilets', 'toilets', 'wc', 'toilet')


def top_places(slug, need, n=6, ct=None):
    c = CITIES.get(slug)
    if not c or need not in c['needs']: return ''
    seen = set(); ps = []
    for p in c['needs'][need]['places']:
        k = p['name'].strip().lower()
        if generic(p) or k in seen or (ct and not re.search(ct, p['ct'], re.I)): continue
        seen.add(k); ps.append(p)
    ps = ps[:int(n)]
    if not ps: return ''
    return '<ul class="pl">%s</ul>' % ''.join(place_li(p) for p in ps)


def need_table(need, scope, lab_city, lab_n, lab_link, linktext, minn='1', sort='n'):
    """Tabla ciudad -> numero de sitios (de la pagina viva) -> enlace a /c/<ciudad>-<need>."""
    if scope.startswith('cc='): cs = cities_where(ccs=set(scope[3:].split(',')))
    elif scope.startswith('lang='): cs = cities_where(lang=scope[5:])
    else: cs = cities_where()
    rows = []
    for c in cs:
        k, plus = count_of(c, need)
        if k >= int(minn): rows.append((k, plus, c))
    rows.sort(key=lambda r: (-r[0], r[2]['name']) if sort == 'n' else (r[2]['name'],))
    tr = ''.join('<tr><td>%s</td><td class="n">%d%s</td><td><a href="../c/%s-%s">%s</a></td></tr>' % (
        esc(c['name']), k, '+' if plus else '', c['slug'], need, esc(linktext)) for k, plus, c in rows)
    return '<div class="tw"><table><thead><tr><th>%s</th><th>%s</th><th>%s</th></tr></thead><tbody>%s</tbody></table></div>' % (
        esc(lab_city), esc(lab_n), esc(lab_link), tr)


DATA['top'] = top_places
DATA['table'] = need_table


def page(lang, path, title, desc, body, h1=None, crumbs=None, ld=None, alts=None, canon=None, robots='', og_type='article', updated=TODAY):
    """path: ruta sin .html dentro del sitio, p.ej. 'blog/duchas-gratis'."""
    url = '%s/%s' % (SITE, path) if path != 'blog/index' else SITE + '/blog/'
    canon = canon or url
    depth = path.count('/')
    up = '../' * depth
    t = UI.get(lang, UI['en'])
    alt_html = ''
    if alts:
        alt_html = ''.join('<link rel="alternate" hreflang="%s" href="%s/%s">' % (l, SITE, p) for l, p in sorted(alts.items()))
        alt_html += '<link rel="alternate" hreflang="x-default" href="%s/%s">' % (SITE, alts.get('en', alts.get('es', path)))
    soc = 'social-%s.jpg' % lang if lang in ('es', 'fr', 'pt', 'ru', 'uk', 'ar', 'ur', 'pl', 'ro') else 'social.jpg'
    ldj = json.dumps(ld, ensure_ascii=False).replace('</', '<\\/') if ld else ''
    crumb = ''
    if crumbs:
        crumb = '<p class="crumbs">%s</p>' % ' › '.join('<a href="%s">%s</a>' % (esc(u), esc(x)) if u else esc(x) for x, u in crumbs)
    body = body.replace('href="../', 'href="' + up) if depth != 1 else body
    return f"""<!DOCTYPE html>
<html lang="{lang}"{' dir="rtl"' if lang in RTL else ''}>
<head>
{HEAD_SNIP}
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(title)} · SupportNear</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">{'<meta name="robots" content="%s">' % robots if robots else '<meta name="robots" content="max-image-preview:large">'}
{alt_html}
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE}/{soc}?v={SOCIAL_V}"><meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="SupportNear">
<meta property="og:url" content="{canon}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:site" content="@mrstartups">
<meta name="theme-color" content="#0B7A63">
<link rel="icon" href="{up}favicon.ico" sizes="32x32"><link rel="icon" href="{up}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{up}apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="SupportNear" href="{SITE}/blog/feed.xml">
<style>{CSS}{EXTRA_CSS}</style>
{'<script type="application/ld+json">%s</script>' % ldj if ldj else ''}
</head>
<body>
<div class="wrap">
<header class="top">{LOGO.replace('href="../"', 'href="%s"' % (up or './'))}<a href="{up}blog/">{esc(t['blog'])}</a></header><main>
{crumb}<h1>{esc(h1 or title)}</h1>
{body}
</main><footer>SupportNear &middot; {esc(t['foot'])} &middot; <a href="{up}blog/">{esc(t['all'])}</a> &middot; <a href="{up}about">{esc(t['who'])}</a></footer>
</div>
</body>
</html>
"""


def write(path, html_text):
    p = os.path.join(OUT, path + '.html')
    os.makedirs(os.path.dirname(p), exist_ok=True)
    io.open(p, 'w', encoding='utf-8').write(html_text)
    return p
