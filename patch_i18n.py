# -*- coding: utf-8 -*-
# Cambia valores de T.<lang> en index.template.html sin tocar nada mas.
import io, json, re, sys

BYP = {
'en': "I started this project, under other names, back in 2007, the year I turned 18. For years I added the places one by one, by hand. With the help of other tools I have finally been able to grow it to the whole world. It makes no money and it never will. If a newsroom wants to cover it, I am glad to help — write to me on X.",
'es': "Empecé este proyecto, con otros nombres, en 2007, el año que cumplí 18. Durante años fui añadiendo los sitios a mano, uno a uno. Con la ayuda de otras herramientas por fin he podido ampliarlo a todo el mundo. No gana dinero y no lo va a ganar. Si algún medio quiere hacerse eco, encantado de ayudar: escríbeme por X.",
'fr': "J’ai commencé ce projet, sous d’autres noms, en 2007, l’année de mes 18 ans. Pendant des années j’ai ajouté les lieux un par un, à la main. Avec l’aide d’autres outils, j’ai enfin pu l’étendre au monde entier. Ça ne rapporte rien et ça ne rapportera jamais. Si un média veut en parler, je l’aiderai volontiers : écrivez-moi sur X.",
'ar': "بدأت هذا المشروع، بأسماء أخرى، عام 2007، العام الذي بلغت فيه الثامنة عشرة. ظللت سنوات أضيف الأماكن واحدًا تلو الآخر بيدي. وبمساعدة أدوات أخرى تمكّنت أخيرًا من توسيعه ليشمل العالم كله. لا يدرّ مالًا ولن يدرّ. وإذا أرادت أي وسيلة إعلام أن تتحدّث عنه، يسعدني أن أساعد: راسلني على X.",
'uk': "Я почав цей проєкт, під іншими назвами, ще у 2007 році, коли мені виповнилося 18. Роками я додавав місця вручну, одне за одним. За допомогою інших інструментів я нарешті зміг розширити його на весь світ. Він не приносить грошей і не буде. Якщо якесь видання захоче про це написати, залюбки допоможу: напишіть мені в X.",
'ro': "Am început acest proiect, sub alte nume, în 2007, anul în care am împlinit 18 ani. Ani la rând am adăugat locurile unul câte unul, de mână. Cu ajutorul altor unelte am reușit în sfârșit să îl extind în toată lumea. Nu aduce bani și nici nu va aduce. Dacă vreo redacție vrea să scrie despre el, ajut cu plăcere: scrie-mi pe X.",
'pl': "Zacząłem ten projekt, pod innymi nazwami, w 2007 roku, w roku, w którym skończyłem 18 lat. Przez lata dodawałem miejsca ręcznie, jedno po drugim. Z pomocą innych narzędzi udało mi się wreszcie rozszerzyć go na cały świat. Nie zarabia i nie będzie zarabiał. Jeśli jakaś redakcja chce o tym napisać, chętnie pomogę: napisz do mnie na X.",
'ru': "Я начал этот проект, под другими названиями, ещё в 2007 году, когда мне исполнилось 18. Годами я добавлял места вручную, одно за другим. С помощью других инструментов мне наконец удалось расширить его на весь мир. Он не приносит денег и не будет. Если какое-то издание захочет о нём написать, с радостью помогу: напишите мне в X.",
'pt': "Comecei este projeto, com outros nomes, em 2007, o ano em que fiz 18 anos. Durante anos fui acrescentando os sítios à mão, um a um. Com a ajuda de outras ferramentas consegui finalmente alargá-lo ao mundo inteiro. Não dá dinheiro e nunca vai dar. Se algum meio quiser falar disto, ajudo com muito gosto: escreve-me no X.",
'ur': "میں نے یہ منصوبہ، دوسرے ناموں سے، 2007 میں شروع کیا تھا، جس سال میں اٹھارہ برس کا ہوا۔ برسوں تک میں ایک ایک جگہ اپنے ہاتھ سے شامل کرتا رہا۔ دوسرے آلات کی مدد سے آخرکار میں اسے پوری دنیا تک پھیلا سکا۔ اس سے کوئی کمائی نہیں ہوتی اور نہ ہو گی۔ اگر کوئی ادارہ اس پر لکھنا چاہے تو مجھے خوشی ہوگی: مجھے X پر لکھیں۔",
'fa': "من این پروژه را، با نام‌های دیگر، در سال 2007 آغاز کردم؛ همان سالی که هجده ساله شدم. سال‌ها جاها را یکی‌یکی و با دست اضافه کردم. با کمک ابزارهای دیگر سرانجام توانستم آن را به همه‌ی جهان گسترش دهم. هیچ درآمدی ندارد و نخواهد داشت. اگر رسانه‌ای بخواهد درباره‌اش بنویسد، با کمال میل کمک می‌کنم: در X برایم بنویسید.",
}

BYX = {
'en':"Write to me on X",'es':"Escríbeme por X",'fr':"Écrivez-moi sur X",
'ar':"راسلني على X",'uk':"Напишіть мені в X",
'ro':"Scrie-mi pe X",'pl':"Napisz do mnie na X",'ru':"Напишите мне в X",
'pt':"Escreve-me no X",'ur':"مجھے X پر لکھیں",
'fa':"در X برایم بنویسید",
'wo':"Bind ma ci X",'bm':"Aw ka sɛbɛn n ma X kan",
}

BYXP = {
'en':"All contact goes through X — press, working together or anything else. It is where I answer fastest.",
'es':"Todo el contacto va por X: prensa, colaboraciones o lo que sea. Es donde antes respondo.",
'fr':"Tout passe par X : presse, partenariats ou autre. C’est là que je réponds le plus vite.",
'ar':"كل التواصل يتم عبر X: الصحافة أو التعاون أو أي شيء آخر. هناك أردّ أسرع.",
'uk':"Увесь контакт — через X: преса, співпраця чи будь-що інше. Там я відповідаю найшвидше.",
'ro':"Tot contactul trece prin X: presă, colaborări sau orice altceva. Acolo răspund cel mai repede.",
'pl':"Cały kontakt idzie przez X: prasa, współpraca albo cokolwiek innego. Tam odpowiadam najszybciej.",
'ru':"Весь контакт — через X: пресса, сотрудничество или что угодно ещё. Там я отвечаю быстрее всего.",
'pt':"Todo o contacto passa pelo X: imprensa, colaborações ou o que for. É onde respondo mais depressa.",
'ur':"ہر رابطہ X کے ذریعے ہوتا ہے: پریس، اشتراک یا کچھ اور۔ وہیں میں سب سے جلدی جواب دیتا ہوں۔",
'fa':"همه‌ی ارتباط‌ها از راه X است: رسانه، همکاری یا هر چیز دیگر. آنجا زودتر از همه‌جا پاسخ می‌دهم.",
}

MOPEN = {'en':"Menu",'es':"Menú",'fr':"Menu",'ar':"القائمة",
'uk':"Меню",'ro':"Meniu",'pl':"Menu",'ru':"Меню",'pt':"Menu",
'ur':"مینیو",'fa':"منو",'wo':"Menu",'bm':"Menu"}

MHOME = {'en':"SupportNear — back to the start",'es':"SupportNear — volver al inicio",
'fr':"SupportNear — revenir au début",'ar':"SupportNear — العودة إلى البداية",
'uk':"SupportNear — на початок",'ro':"SupportNear — înapoi la început",
'pl':"SupportNear — wróć na początek",'ru':"SupportNear — в начало",
'pt':"SupportNear — voltar ao início",'ur':"SupportNear — شروع پر واپس",
'fa':"SupportNear — بازگشت به آغاز",'wo':"SupportNear",'bm':"SupportNear"}

SET = {}
for lang in ['en','es','fr','ar','uk','ro','pl','ru','pt','ur','fa','wo','bm']:
    d = {}
    if lang in BYP:  d['by.p'] = BYP[lang]
    if lang in BYX:  d['by.x'] = BYX[lang]
    if lang in BYXP: d['by.xp'] = BYXP[lang]
    d['menu.open'] = MOPEN[lang]
    d['menu.home'] = MHOME[lang]
    SET[lang] = d

DROP = ['menu.write','by.copy','ct.h','ct.p','ct.subj','ct.s1','ct.s2','ct.s3','ct.s4',
        'ct.msg','ct.ph','ct.send','ct.nomail']

p = 'index.template.html'
s = io.open(p, encoding='utf-8').read()

def block(lang):
    m = re.search(r'^T\.%s = \{$' % lang, s, re.M)
    if not m: return None
    i = m.end()
    j = s.index('\n};', i)
    return i, j

changed = added = dropped = 0
for lang, kv in SET.items():
    b = block(lang)
    if not b:
        print('SIN BLOQUE', lang); continue
    i, j = b
    body = s[i:j]
    for k, v in kv.items():
        pat = re.compile(r'([\'"]%s[\'"]\s*:\s*)([\'"])(?:\\.|(?!\2).)*\2' % re.escape(k))
        if pat.search(body):
            body = pat.sub(lambda m: m.group(1) + json.dumps(v, ensure_ascii=False), body, count=1)
            changed += 1
        else:
            body = "\n  " + json.dumps(k) + ":" + json.dumps(v, ensure_ascii=False) + "," + body
            added += 1
    for k in DROP:
        pat = re.compile(r'[\'"]%s[\'"]\s*:\s*([\'"])(?:\\.|(?!\1).)*\1\s*,?' % re.escape(k))
        body, n = pat.subn('', body)
        dropped += n
    s = s[:i] + body + s[j:]

io.open(p, 'w', encoding='utf-8').write(s)
print('cambiadas', changed, '| anadidas', added, '| quitadas', dropped)
