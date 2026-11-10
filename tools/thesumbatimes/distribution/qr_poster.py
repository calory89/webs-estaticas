# -*- coding: utf-8 -*-
"""A4 posters with a QR code to the trip-planning page, one PDF per language, written to distribution/posters/.
   python3 distribution/qr_poster.py            (needs reportlab; uses segno if installed, else reportlab's QR widget)
The QR points to https://thesumbatimes.com/LANG/plan/?utm_source=qr . Print at 100% on A4 (the code is 11 cm wide)."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "posters")
URL = "https://thesumbatimes.com/{l}/plan/?utm_source=qr"
INK = (0.114, 0.106, 0.094); PAPER = (0.969, 0.953, 0.925); MUTED = (0.37, 0.345, 0.306); ACCENT = (0.478, 0.353, 0.184)
T = {
 "en": {"tag": "News, culture and travel from the island of Sumba, Indonesia", "h": ["Sumba news,", "guides and maps"], "scan": "Scan",
        "sub": "Point your phone camera at the code to plan your days on the island.",
        "pts": ["Today's news from Sumba, every morning", "Guides to beaches, waterfalls and villages", "A map with every place worth the drive"],
        "foot": "Free to read. No app, no sign-up. English, Spanish and Indonesian."},
 "es": {"tag": "Noticias, cultura y viajes desde la isla de Sumba, Indonesia", "h": ["Noticias, guías", "y mapas de Sumba"], "scan": "Escanea",
        "sub": "Apunta al código con la cámara del móvil y organiza tus días en la isla.",
        "pts": ["Las noticias de Sumba, cada mañana", "Guías de playas, cascadas y aldeas", "Un mapa con todos los lugares que merecen el viaje"],
        "foot": "Lectura gratuita. Sin aplicación ni registro. En español, inglés e indonesio."},
 "id": {"tag": "Berita, budaya, dan perjalanan dari Pulau Sumba, Indonesia", "h": ["Berita, panduan,", "dan peta Sumba"], "scan": "Pindai",
        "sub": "Arahkan kamera ponsel ke kode ini untuk merencanakan perjalanan Anda di Sumba.",
        "pts": ["Berita Sumba setiap pagi", "Panduan pantai, air terjun, dan kampung adat", "Peta semua tempat yang layak dikunjungi"],
        "foot": "Gratis. Tanpa aplikasi, tanpa mendaftar. Bahasa Indonesia, Inggris, dan Spanyol."},
}

def fonts():
    d = "/usr/share/fonts/truetype/dejavu/"
    try:
        pdfmetrics.registerFont(TTFont("TS-B", d + "DejaVuSerif-Bold.ttf")); pdfmetrics.registerFont(TTFont("TS", d + "DejaVuSerif.ttf")); pdfmetrics.registerFont(TTFont("TS-S", d + "DejaVuSans.ttf"))
        return "TS-B", "TS", "TS-S"
    except Exception:
        return "Times-Bold", "Times-Roman", "Helvetica"   # built-in fonts cover en/es/id as well

def qr_matrix(url):
    try:
        import segno
        return [[bool(c) for c in row] for row in segno.make(url, error="q", micro=False).matrix]
    except ImportError:
        from reportlab.graphics.barcode.qr import QrCodeWidget
        w = QrCodeWidget(url, barLevel="Q"); w.qr.make()
        n = w.qr.getModuleCount()
        return [[bool(w.qr.isDark(r, c)) for c in range(n)] for r in range(n)]

def draw_qr(c, url, x, y, size):
    m = qr_matrix(url); n = len(m); quiet = 4; cell = size / (n + 2 * quiet)
    c.setFillColorRGB(1, 1, 1); c.rect(x, y, size, size, stroke=0, fill=1)
    c.setFillColorRGB(0, 0, 0)
    for r, row in enumerate(m):
        for k, dark in enumerate(row):
            if dark: c.rect(x + (k + quiet) * cell, y + size - (r + quiet + 1) * cell, cell + 0.05, cell + 0.05, stroke=0, fill=1)

def poster(l):
    t = T[l]; B, R, S = fonts(); W, H = A4; cx = W / 2
    fp = os.path.join(OUT, f"sumba-times-qr-{l}.pdf"); c = canvas.Canvas(fp, pagesize=A4)
    c.setTitle("The Sumba Times: " + " ".join(t["h"])); c.setAuthor("The Sumba Times"); c.setSubject(URL.format(l=l))
    c.setFillColorRGB(*PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setStrokeColorRGB(*INK); c.setLineWidth(2.2); c.line(18 * mm, H - 20 * mm, W - 18 * mm, H - 20 * mm)
    c.setFillColorRGB(*INK); c.setFont(B, 40); c.drawCentredString(cx, H - 37 * mm, "The Sumba Times")
    c.setFillColorRGB(*MUTED); c.setFont(R, 11.5); c.drawCentredString(cx, H - 45 * mm, t["tag"])
    c.setLineWidth(0.8); c.line(18 * mm, H - 50 * mm, W - 18 * mm, H - 50 * mm); c.line(18 * mm, H - 51.2 * mm, W - 18 * mm, H - 51.2 * mm)
    c.setFillColorRGB(*INK); y = H - 72 * mm
    for line in t["h"]:
        c.setFont(B, 36); c.drawCentredString(cx, y, line); y -= 15 * mm
    size = 110 * mm; qy = y - size + 4 * mm
    c.setStrokeColorRGB(*INK); c.setLineWidth(1.2); c.rect(cx - size / 2 - 3 * mm, qy - 3 * mm, size + 6 * mm, size + 6 * mm, stroke=1, fill=0)
    draw_qr(c, URL.format(l=l), cx - size / 2, qy, size)
    y = qy - 17 * mm
    c.setFillColorRGB(*ACCENT); c.setFont(B, 30); c.drawCentredString(cx, y, t["scan"]); y -= 9 * mm
    c.setFillColorRGB(*INK); c.setFont(R, 12.5); c.drawCentredString(cx, y, t["sub"]); y -= 12 * mm
    c.setFont(S, 12.5)
    for p in t["pts"]:
        c.drawCentredString(cx, y, "·  " + p + "  ·"); y -= 7.2 * mm
    c.setStrokeColorRGB(*INK); c.setLineWidth(0.8); c.line(18 * mm, 27 * mm, W - 18 * mm, 27 * mm)
    c.setFont(B, 15); c.drawCentredString(cx, 19 * mm, f"thesumbatimes.com/{l}/plan")
    c.setFillColorRGB(*MUTED); c.setFont(R, 10); c.drawCentredString(cx, 12.5 * mm, t["foot"])
    c.showPage(); c.save(); return fp

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for l in ("en", "es", "id"): print(poster(l))
