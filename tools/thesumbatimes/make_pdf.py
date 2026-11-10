# -*- coding: utf-8 -*-
"""Renders the free guide (/LANG/guide/sumba-7-days/) to PDF with Playwright. Run after build.py:
python3 make_pdf.py  -> pdf/sumba-7-days-<lang>.pdf  (copy to claude-ops data/thesumbatimes/pdf/ and run jobs/tst_pdf.py to upload to KV)."""
import os, http.server, socketserver, threading, functools
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out"); PDF = os.path.join(HERE, "pdf"); os.makedirs(PDF, exist_ok=True)
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=OUT)
class Q(socketserver.TCPServer): allow_reuse_address = True
srv = Q(("127.0.0.1", 8799), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for l in ("en", "es", "id"):
        pg.goto(f"http://127.0.0.1:8799/{l}/guide/sumba-7-days/", wait_until="load"); pg.emulate_media(media="print")
        pg.pdf(path=os.path.join(PDF, f"sumba-7-days-{l}.pdf"), format="A4", margin={"top": "16mm", "bottom": "16mm", "left": "15mm", "right": "15mm"}, print_background=False)
        print(l, os.path.getsize(os.path.join(PDF, f"sumba-7-days-{l}.pdf")))
    b.close()
srv.shutdown()
