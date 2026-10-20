#!/usr/bin/env python3
"""Logo de Happy Low Cost (versión A): «happy» + sonrisa que vuela + «LOW COST» debajo.
draw_logo() se usa en las imágenes para compartir; `python3 _hlc/brand.py` regenera iconos, favicon y og-default."""
import os, math
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CORAL, SOL, TINTA, CREMA = (255, 90, 54), (255, 197, 49), (20, 33, 61), (255, 248, 238)


def F(n, s):
    return ImageFont.truetype(os.path.join(HERE, 'fonts', n), int(s))


def _spaced(d, xy, txt, font, fill, track):
    x, y = xy
    for ch in txt:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + track
    return x - track


def spaced_w(d, txt, font, track):
    return sum(d.textlength(c, font=font) for c in txt) + track * (len(txt) - 1)


def _smile(d, x, y, w, color, plane=True):
    # misma curva que el SVG: M8 8 Q120 58 214 14 en una caja de 250x46
    k = w / 250.0
    P0, P1, P2 = (8, 8), (120, 58), (214, 14)
    pts = []
    for i in range(41):
        t = i / 40
        px = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0]
        py = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]
        pts.append((x + px * k, y + py * k))
    lw = max(2, round(11 * k))
    d.line(pts, fill=color, width=lw, joint='curve')
    for p in (pts[0], pts[-1]):
        d.ellipse((p[0] - lw / 2, p[1] - lw / 2, p[0] + lw / 2, p[1] + lw / 2), fill=color)
    if plane:
        a = math.radians(-24)
        ca, sa = math.cos(a), math.sin(a)
        def tr(px, py):
            return (x + (214 + px * ca - py * sa) * k, y + (12 + px * sa + py * ca) * k)
        for poly in ([(-2, 0), (22, -1.5), (27, 0), (22, 1.5)], [(8, -1), (2, -12), (6, -12), (15, -1)], [(8, 1), (2, 12), (6, 12), (15, 1)]):
            d.polygon([tr(*p) for p in poly], fill=color)


def logo_size(S):
    """Ancho y alto aproximados del bloque para una «happy» de tamaño S."""
    im = Image.new('RGB', (10, 10)); d = ImageDraw.Draw(im)
    w = d.textlength('happy', font=F('B800.woff', S))
    return w, S * 1.7


def draw_logo(d, x, y, S, word=TINTA, smile=CORAL, low=None, plane=True):
    """Dibuja el logo con la «happy» de tamaño S en (x, y). Devuelve (ancho, alto)."""
    low = low or word
    fb = F('B800.woff', S)
    d.text((x, y - S * 0.2), 'happy', font=fb, fill=word)
    w = d.textlength('happy', font=fb)
    _smile(d, x + w * 0.02, y + S * 0.82, w * 0.98, smile, plane)
    fl = F('B800.woff', S * 0.40)
    base = spaced_w(d, 'LOW COST', fl, 0)
    track = max(0, (w * 0.94 - base) / 7)
    lw = spaced_w(d, 'LOW COST', fl, track)
    lx = x + (w - lw) / 2
    _spaced(d, (lx, y + S * 1.2), 'LOW COST', fl, low, track)
    return w, S * 1.7


def icon(size, bg=CORAL):
    big = size * 4
    im = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, big - 1, big - 1), radius=int(big * 0.22), fill=bg)
    w, h = logo_size(S := big * 0.25)
    if size >= 48:
        draw_logo(d, (big - w) / 2 - S * 0.04, (big - h) / 2 + S * 0.06, S, word=(255, 255, 255), smile=SOL, low=SOL)
    else:  # a 16-32 px no se puede leer el texto: «h» + sonrisa
        fh = F('B800.woff', big * 0.62)
        hw = d.textlength('h', font=fh)
        d.text(((big - hw) / 2, big * 0.02), 'h', font=fh, fill=(255, 255, 255))
        _smile(d, big * 0.16, big * 0.66, big * 0.72, SOL, plane=False)
    return im.resize((size, size), Image.LANCZOS)


def build():
    B = os.path.join(ROOT, 'hlc', 'brand')
    for s in (512, 192, 180, 32):
        icon(s).save(os.path.join(B, f'icon-{s}.png'))
    icon(32).save(os.path.join(B, 'favicon.ico'), sizes=[(16, 16), (32, 32)])
    # og por defecto
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), CREMA)
    d = ImageDraw.Draw(im)
    d.ellipse((760, -160, 1420, 500), fill=(255, 226, 214))
    draw_logo(d, 80, 70, 120, low=CORAL)
    ft = F('B800.woff', 64)
    lines = ['Cazamos los vuelos', 'más baratos del mundo.']
    for i, t in enumerate(lines):
        d.text((80, 300 + i * 74), t, font=ft, fill=TINTA if i == 0 else CORAL)
    d.text((82, 470), 'Chollos verificados desde España · alertas gratis', font=F('I600.woff', 32), fill=(74, 84, 104))
    d.text((82, 530), 'happylowcost.com', font=F('I700.woff', 30), fill=TINTA)
    im.save(os.path.join(B, 'og-default.jpg'), 'JPEG', quality=88, optimize=True, progressive=True)


if __name__ == '__main__':
    build()
    print('ok')
