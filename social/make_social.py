# -*- coding: utf-8 -*-
"""La imagen que sale al compartir SupportNear.

Antes era solo texto sobre fondo beige. En la vista grande de Facebook se leia;
en WhatsApp, que muchas veces la recorta a un cuadrado pequeno a la izquierda
del enlace, salia un recuadro claro con media frase: «sale feo y sin foto».

Ahora lleva una foto de verdad del producto — el mapa vivo de una ciudad con
sus pines de colores — y encima una tarjeta con lo que es, en letra grande:
«Comida, cama y ducha gratis, cerca de ti». Todo lo importante (logo y titular)
cabe en el cuadrado central de 630x630, que es lo que queda cuando WhatsApp
recorta. Se hace una por idioma, con el mapa de una ciudad de ese idioma, para
que la pagina de Varsovia se comparta en polaco y con Varsovia detras.

    python3 make_social.py            # todas
    python3 make_social.py es en      # solo esas
"""
import json, os, re, sys, subprocess, base64, io

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# las cifras se leen del build, no se escriben aqui: la tarjeta no puede mentir
# aunque alguien se olvide de actualizarla
_full = os.path.join(ROOT, 'index.full.html')
STATS = json.loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', open(_full, encoding='utf-8').read()).group(1))

ICON = {
 'food': '<path d="M4 3v6a3.5 3.5 0 0 0 7 0V3"/><path d="M7.5 12.5V21"/><path d="M18 3c-1.4 2-2 4.2-2 6.2s.7 3 2 3 2-1 2-3S19.4 5 18 3z"/><path d="M18 12.2V21"/>',
 'shelter': '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M9.5 20v-5.5h5V20"/>',
 'hygiene': '<path d="M4 3h5a6 6 0 0 1 6 6v1"/><path d="M11 10h10"/><path d="M13.5 14v.6M16 16.4v.6M18.5 14v.6M14.8 19.4v.6M17.8 19.4v.6"/>',
 'clothes': '<path d="M9 3l3 2 3-2 5.5 4-2.6 3.2L16 9.2V21H8V9.2l-1.9 1L3.5 7z"/>',
 'health': '<circle cx="12" cy="12" r="8.6"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
}
COLOR = {'food': '#D9531E', 'shelter': '#2C5FD1', 'hygiene': '#0A8FA0', 'clothes': '#7B4AE2', 'health': '#C61F4B'}

# ciudad del mapa de fondo para cada idioma
CITY = {
 'en': ('London', 51.5145, -0.1180, 15), 'es': ('Madrid', 40.4175, -3.7035, 15),
 'fr': ('Paris', 48.8606, 2.3470, 15),   'pt': ('Lisbon', 38.7200, -9.1420, 15),
 'ro': ('Bucharest', 44.4330, 26.1000, 15), 'pl': ('Warsaw', 52.2330, 21.0120, 15),
 'uk': ('Kyiv', 50.4480, 30.5200, 15),  'ru': ('Moscow', 55.7560, 37.6200, 15),
 'ar': ('Casablanca', 33.5890, -7.6100, 15), 'fa': ('Kabul', 34.5270, 69.1750, 15),
 'ur': ('Karachi', 24.8600, 67.0100, 15),
 'ti': ("Asmara", 15.3389, 38.9327, 15),
 'ps': ("Kabul", 34.527, 69.175, 15),
 'so': ("Mogadishu", 2.0469, 45.3182, 15),
 'am': ("Addis Ababa", 9.03, 38.74, 15),
 'tr': ("Istanbul", 41.013, 28.975, 15),
 'bn': ("Dhaka", 23.81, 90.4125, 15),
 'zh': ("London", 51.5145, -0.118, 15),
}

TX = {
 'ti': dict(l1="ነጻ መግቢ፣ ዓራት፣ ሻወር፣ ሓኪም", l2="ኣብ ጥቓኻ", foot="ኣካውንት የለን · ዋጋ የለን · ምክትታል የለን · ብዘይ ኢንተርነት ይሰርሕ",
            stat="{p} ቦታታት · {k} ሃገራት", cats=["መግቢ", "መሕደሪ", "ሻወር", "ክዳውንቲ", "ጥዕና"]),
 'ps': dict(l1="وړیا خواړه، بستر، شاور، ډاکټر،", l2="تاته نږدې", foot="حساب نشته · پیسې نشته · تعقیب نشته · بې انټرنیټه کار کوي",
            stat="{p} ځایونه · {k} هېوادونه", cats=["خواړه", "پناه ځای", "شاور", "کالي", "روغتیا"]),
 'so': dict(l1="Cunto bilaash ah, sariir, qubays, dhakhtar", l2="kuu dhow", foot="Akoon la'aan · Lacag la'aan · Raadraac la'aan · Wuu shaqeeyaa internet la'aan",
            stat="{p} meelo · {k} waddamo", cats=["Cunto", "Hoy", "Qubays", "Dhar", "Caafimaad"]),
 'am': dict(l1="ነፃ ምግብ፣ አልጋ፣ ሻወር፣ ሐኪም", l2="በአጠገብህ", foot="መለያ የለም · ክፍያ የለም · ክትትል የለም · ያለ ኢንተርኔት ይሰራል",
            stat="{p} ቦታዎች · {k} አገሮች", cats=["ምግብ", "መጠለያ", "ሻወር", "ልብስ", "ጤና"]),
 'tr': dict(l1="Ücretsiz yemek, yatak, duş, doktor", l2="yakınında", foot="Hesap yok · Ücret yok · Takip yok · İnternetsiz çalışır",
            stat="{p} yer · {k} ülke", cats=["Yemek", "Barınak", "Duş", "Kıyafet", "Sağlık"]),
 'bn': dict(l1="বিনা পয়সায় খাবার, বিছানা, গোসল, ডাক্তার", l2="তোমার কাছেই", foot="অ্যাকাউন্ট নেই · টাকা লাগে না · নজরদারি নেই · ইন্টারনেট ছাড়াও চলে",
            stat="{p} জায়গা · {k} দেশ", cats=["খাবার", "আশ্রয়", "গোসল", "কাপড়", "স্বাস্থ্য"]),
 'zh': dict(l1="免费的饭、床位、淋浴、医生", l2="就在你身边", foot="无需账号 · 免费 · 不追踪 · 离线可用",
            stat="{p} 个地点 · {k} 个国家", cats=["食物", "住宿", "淋浴", "衣服", "医疗"]),
 'en': dict(l1='Free food, a bed,', l2='a shower — near you.', foot='Free · No sign-up · Works offline · 20 languages',
            stat='{p} places · {k} countries', cats=['Food', 'Shelter', 'Showers', 'Clothes', 'Health']),
 'es': dict(l1='Comida, cama y ducha', l2='gratis, cerca de ti.', foot='Gratis · Sin registro · Funciona sin cobertura · 20 idiomas',
            stat='{p} sitios · {k} países', cats=['Comida', 'Alojamiento', 'Duchas', 'Ropa', 'Salud']),
 'fr': dict(l1='Repas, lit et douche', l2='gratuits, près de toi.', foot='Gratuit · Sans compte · Marche sans réseau · 20 langues',
            stat='{p} lieux · {k} pays', cats=['Nourriture', 'Hébergement', 'Douches', 'Vêtements', 'Santé']),
 'pt': dict(l1='Comida, cama e banho', l2='grátis, aqui perto.', foot='Grátis · Sem registo · Funciona sem rede · 20 línguas',
            stat='{p} sítios · {k} países', cats=['Comida', 'Alojamento', 'Duches', 'Roupa', 'Saúde']),
 'ro': dict(l1='Mâncare, pat și duș', l2='gratuit, aproape de tine.', foot='Gratuit · Fără cont · Merge fără semnal · 20 limbi',
            stat='{p} locuri · {k} țări', cats=['Mâncare', 'Adăpost', 'Dușuri', 'Haine', 'Sănătate']),
 'pl': dict(l1='Jedzenie, nocleg, prysznic', l2='za darmo, blisko ciebie.', foot='Za darmo · Bez konta · Działa bez zasięgu · 20 języków',
            stat='{p} miejsc · {k} kraje', cats=['Jedzenie', 'Nocleg', 'Prysznice', 'Ubrania', 'Zdrowie']),
 'uk': dict(l1='Їжа, ночівля і душ', l2='безкоштовно, поруч.', foot='Безкоштовно · Без реєстрації · Працює без зв’язку · 20 мов',
            stat='{p} місць · {k} країн', cats=['Їжа', 'Нічліг', 'Душ', 'Одяг', 'Здоров’я']),
 'ru': dict(l1='Еда, ночлег и душ', l2='бесплатно, рядом.', foot='Бесплатно · Без регистрации · Работает без связи · 20 языков',
            stat='{p} мест · {k} страны', cats=['Еда', 'Ночлег', 'Душ', 'Одежда', 'Здоровье']),
 'ar': dict(l1='طعام وسرير ودُش', l2='مجاناً، وقريباً منك.', foot='مجاني · بدون حساب · يعمل بدون شبكة · ٢٠ لغة',
            stat='{p} مكان · {k} دولة', cats=['طعام', 'مأوى', 'دشّات', 'ملابس', 'صحة']),
 'fa': dict(l1='غذا، جای خواب، حمام', l2='رایگان، نزدیک تو.', foot='رایگان · بدون ثبت‌نام · بدون اینترنت هم کار می‌کند · ۲۰ زبان',
            stat='{p} مکان · {k} کشور', cats=['غذا', 'سرپناه', 'دوش', 'لباس', 'سلامت']),
 'ur': dict(l1='کھانا، بستر، غسل', l2='مفت، آپ کے قریب۔', foot='مفت · اکاؤنٹ کے بغیر · سگنل کے بغیر بھی · ۲۰ زبانیں',
            stat='{p} جگہیں · {k} ممالک', cats=['کھانا', 'رہائش', 'غسل', 'کپڑے', 'صحت']),
}
RTL = {'ar', 'fa', 'ur', 'ps'}
FONT = {'ar': "'Noto Naskh Arabic'", 'fa': "'Vazirmatn'", 'ur': "'Noto Nastaliq Urdu'"}
SEP = {'en': ',', 'es': '.', 'fr': ' ', 'pt': '.', 'ro': '.', 'pl': ' ', 'uk': ' ', 'ru': ' ',
       'ar': ',', 'fa': ',', 'ur': ','}


def num(n, lang):
    return '{:,}'.format(n).replace(',', SEP.get(lang, ','))


def card_html(lang, map_png):
    t = TX[lang]
    rtl = lang in RTL
    ff = FONT.get(lang, "'Inter'")
    chips = ''.join(
        '<span class="chip"><i style="background:%s"><svg viewBox="0 0 24 24">%s</svg></i>%s</span>' % (COLOR[c], ICON[c], lab)
        for c, lab in zip(['food', 'shelter', 'hygiene', 'clothes', 'health'], t['cats']) if c != 'clothes')   # R20: sin tiendas solidarias, Ropa casi no tiene sitios
    bg = base64.b64encode(open(map_png, 'rb').read()).decode()
    stat = t['stat'].format(p=num(STATS['places'], lang), k=STATS['countries'])
    lh = '1.35' if lang == 'ur' else ('1.18' if rtl else '1.06')
    return f'''<!doctype html><html lang="{lang}" dir="{'rtl' if rtl else 'ltr'}"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Naskh+Arabic:wght@600;700&family=Vazirmatn:wght@600;800&family=Noto+Nastaliq+Urdu:wght@600;700&display=block" rel="stylesheet">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:1200px;height:630px;overflow:hidden}}
body{{font-family:{ff},'Inter',system-ui,sans-serif;color:#14110E;position:relative;-webkit-font-smoothing:antialiased}}
.map{{position:absolute;inset:0;background:url(data:image/png;base64,{bg}) center/cover;filter:saturate(.95)}}
.veil{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,14,.10),rgba(20,17,14,0) 30%,rgba(20,17,14,0) 70%,rgba(20,17,14,.14))}}
.card{{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:840px;padding:40px 48px 34px;
  background:rgba(255,255,255,.965);border-radius:34px;text-align:center;
  box-shadow:0 2px 6px rgba(20,17,14,.10),0 24px 60px rgba(20,17,14,.28)}}
.brand{{display:inline-flex;align-items:center;gap:12px;font-family:'Inter',sans-serif;font-weight:800;font-size:30px;letter-spacing:-.02em;direction:ltr}}
.logo{{width:46px;height:46px;border-radius:13px;background:#0B7A63;display:grid;place-items:center}}
.logo svg{{width:27px;height:27px;stroke:#fff;fill:none;stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}}
h1{{font-weight:800;font-size:{'60px' if rtl else '64px'};line-height:{lh};letter-spacing:{'0' if rtl else '-.035em'};margin:22px 0 22px}}
h1 span{{display:inline-block;white-space:nowrap}} h1 br{{display:block}}
h1 .g{{color:#0B7A63}}
.chips{{display:flex;justify-content:center;flex-wrap:wrap;gap:10px}}
.chip{{display:inline-flex;align-items:center;gap:8px;padding:7px 15px 7px 7px;border-radius:999px;background:#F3EEE6;font-weight:700;font-size:20px;color:#2a2520}}
[dir=rtl] .chip{{padding:7px 7px 7px 15px}}
.chip i{{width:32px;height:32px;border-radius:999px;display:grid;place-items:center}}
.chip svg{{width:19px;height:19px;stroke:#fff;fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}}
.foot{{margin-top:22px;font-size:19px;font-weight:600;color:#6E665B}}
.foot b{{color:#0B7A63;font-family:'Inter',sans-serif;direction:ltr;unicode-bidi:isolate}}
.stat{{position:absolute;top:24px;{'left' if rtl else 'right'}:26px;padding:9px 16px;border-radius:999px;background:rgba(20,17,14,.78);color:#fff;font-weight:700;font-size:18px}}
</style></head><body>
<div class="map"></div><div class="veil"></div>
<div class="stat">{stat}</div>
<div class="card">
  <div class="brand"><span class="logo"><svg viewBox="0 0 24 24"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/></svg></span>SupportNear</div>
  <h1><span>{t['l1']}</span><br><span class="g">{t['l2']}</span></h1>
  <div class="chips">{chips}</div>
  <div class="foot"><b>supportnear.com</b> · {t['foot']}</div>
</div></body></html>'''


def pick_map(lang):
    """Un mapa con pocos pines no ensena nada: parece un callejero. Se prueba la
    ciudad del idioma a zoom 15, 14 y 13; si en ninguno salen 45 pines, Madrid."""
    city, lat, lon, z = CITY[lang]
    for zz in (z, z - 1, z - 2):
        png = os.path.join(HERE, 'map_%s_%d.png' % (city.lower(), zz))
        if not os.path.exists(png):
            r = subprocess.run(['python3', os.path.join(HERE, 'mapshot.py'), city, str(lat), str(lon), str(zz), png],
                               capture_output=True, text=True, check=True)
            open(png + '.n', 'w').write(r.stdout.rsplit('pines:', 1)[-1].strip())
        n = int(open(png + '.n').read() or 0)
        if n >= 45:
            return png
    return os.path.join(HERE, 'map_madrid.png')


def render(lang, out_png):
    from playwright.sync_api import sync_playwright
    map_png = pick_map(lang)
    html_path = os.path.join(HERE, 'card_%s.html' % lang)
    open(html_path, 'w', encoding='utf-8').write(card_html(lang, map_png))
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
        pg.goto('file://' + html_path, wait_until='networkidle')
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(700)
        # que el titular no se salga de la tarjeta
        # WhatsApp, en la vista pequena, recorta el cuadrado central de 630 px.
        # El titular tiene que caber entero ahi: se encoge hasta 610 px de ancho.
        over = pg.evaluate("""()=>{ const h=document.querySelector('h1'); let fs=parseFloat(getComputedStyle(h).fontSize);
          const w=()=>Math.max(...[...h.querySelectorAll('span')].map(s=>s.getBoundingClientRect().width));
          while(w()>610 && fs>40){ fs-=1; h.style.fontSize=fs+'px'; }
          // las cinco etiquetas en una sola fila, y el pie en una sola linea:
          // una etiqueta sola en una segunda fila parece un error
          const ch=document.querySelector('.chips'), cs=[...ch.children];
          let cf=20; const rows=()=>new Set(cs.map(c=>Math.round(c.getBoundingClientRect().top))).size;
          while(rows()>1 && cf>14){ cf-=1; cs.forEach(c=>{c.style.fontSize=cf+'px';}); ch.style.gap=(cf>17?10:7)+'px'; }
          const ft=document.querySelector('.foot'); let ff=19;
          const lines=()=>Math.round(ft.getBoundingClientRect().height/parseFloat(getComputedStyle(ft).lineHeight||ff*1.3));
          ft.style.whiteSpace='nowrap';
          while(ft.scrollWidth>ft.clientWidth && ff>13){ ff-=1; ft.style.fontSize=ff+'px'; }
          return [Math.round(w()), fs, cf, ff]; }""")
        pg.wait_for_timeout(150)
        pg.screenshot(path=out_png, type='png')
        b.close()
    # JPEG ligero: WhatsApp ignora las imagenes de mas de ~300 KB
    from PIL import Image
    im = Image.open(out_png).convert('RGB')
    jpg = out_png[:-4] + '.jpg'
    im.save(jpg, 'JPEG', quality=86, optimize=True, progressive=True)
    return over, os.path.getsize(jpg)


if __name__ == '__main__':
    # social.jpg (ingles, la portada) y social-<idioma>.jpg (paginas de ciudad y
    # enlaces /es/, /fr/...). JPEG: con foto de mapa, un PNG pasa del mega y
    # WhatsApp deja de ensenar la imagen por encima de ~300 KB.
    langs = sys.argv[1:] or list(TX)
    from PIL import Image
    for L in langs:
        tmp = os.path.join(HERE, 'card-%s.png' % L)
        over, sz = render(L, tmp)
        name = 'social.jpg' if L == 'en' else 'social-%s.jpg' % L
        os.replace(tmp[:-4] + '.jpg', os.path.join(ROOT, name))
        if L == 'en':
            # social.png sigue existiendo para los enlaces viejos que ya lo tienen
            # en cache; en paleta de 256 colores para que no pese un mega
            Image.open(tmp).convert('RGB').quantize(96, method=Image.Quantize.MEDIANCUT).save(os.path.join(ROOT, 'social.png'), optimize=True)
        os.remove(tmp)
        print('%-16s %3d KB  titular %s  mapa %s' % (name, os.path.getsize(os.path.join(ROOT, name)) // 1024, over, os.path.basename(pick_map(L))))
