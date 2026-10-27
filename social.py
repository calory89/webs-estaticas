# Tarjeta que sale al pegar el enlace en WhatsApp, X o LinkedIn.
# Las cifras se leen de index.html, no se escriben aqui: asi la tarjeta no puede
# mentir aunque me olvide de actualizarla.
import json, re, subprocess
from PIL import Image, ImageDraw, ImageFont

html = open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html', encoding='utf-8').read()
STATS = json.loads(re.search(r'const STATS = /\*__STATS__\*/(\{.*?\});', html).group(1))
block = re.search(r'const LANGS = \[(.*?)\n\];', html, re.S).group(1)
LANGS = len(re.findall(r"code:'", block))

W, H = 1200, 630
PAPER, INK, GREEN, MUTED = '#faf7f2', '#14110e', '#0d6b57', '#6d675f'


def font(names, size):
    for n in names:
        for path in subprocess.run(['fc-match', '-f', '%{file}', n],
                                   capture_output=True, text=True).stdout.splitlines():
            if path:
                try: return ImageFont.truetype(path, size)
                except Exception: pass
    return ImageFont.load_default()


serif = lambda s: font(['DejaVu Serif:bold', 'Georgia:bold', 'serif:bold'], s)
sans = lambda s: font(['DejaVu Sans:bold', 'sans-serif:bold'], s)
sansr = lambda s: font(['DejaVu Sans', 'sans-serif'], s)

img = Image.new('RGB', (W, H), PAPER)
d = ImageDraw.Draw(img)

# marca
mark = Image.open('logo/supportnear-mark-256.png').convert('RGBA').resize((64, 64), Image.LANCZOS)
img.paste(mark, (72, 64), mark)
d.text((150, 78), 'SupportNear', font=sans(34), fill=INK)
d.text((W - 72, 96), 'supportnear.com', font=sansr(24), fill=GREEN, anchor='ra')

# titular: la cifra que manda es la de paises, que es donde de verdad no hay nadie mas
d.text((72, 186), 'Free help, mapped in', font=serif(66), fill=INK)
d.text((72, 268), '%d countries.' % STATS['countries'], font=serif(66), fill=GREEN)

d.text((72, 372), 'Food · a bed · a shower · clothes · a doctor', font=sansr(28), fill=MUTED)
d.text((72, 412), 'No account. No tracking. No cost.', font=sansr(28), fill=MUTED)

d.line([72, 500, W - 72, 500], fill='#ded7cc', width=2)
cells = [(format(STATS['places'], ',d'), 'places'), (format(STATS['cities'], ',d'), 'cities'),
         (str(STATS['countries']), 'countries'), (str(LANGS), 'languages')]
x = 72
for big, small in cells:
    fb, fs = sans(46), sansr(22)
    d.text((x, 534), big, font=fb, fill=INK)
    w = d.textlength(big, font=fb)
    d.text((x + w + 10, 556), small, font=fs, fill=MUTED)
    x += w + 14 + d.textlength(small, font=fs) + 48

img.save('social.png')
print('social.png', STATS, LANGS, 'idiomas')
