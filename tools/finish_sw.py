# -*- coding: utf-8 -*-
"""R22: deja sw.js a juego con la portada que se va a publicar.

    python3 tools/finish_sw.py <carpeta con index.html y sw.js>

sw.js guarda la portada y su codigo (a/app-<huella>.js, a/leaflet-<huella>.js) y los
sirve desde el movil. Para que una publicacion llegue a quien ya tiene la app, sw.js
tiene que cambiar cuando cambia la portada: lleva BUILD (huella de index.html) y
SHELL (los ficheros que pide). build.py ya los pone, pero patch_live.py retoca
despues el <head> de index.html: este script se pasa AL FINAL, sobre lo que se sube.
Comprueba ademas que cada fichero de SHELL existe.
"""
import sys, os, re, io, json, hashlib
D = sys.argv[1]
html = io.open(os.path.join(D, 'index.html'), encoding='utf-8', newline='').read()
shell = re.findall(r'<script defer src="(a/[\w.-]+\.js)"></script>', html)
assert len(shell) == 2, shell
for f in shell:
    assert os.path.isfile(os.path.join(D, f)), 'falta ' + f
    assert '<link rel="preload" as="script" href="%s">' % f in html, 'sin preload: ' + f
p = os.path.join(D, 'sw.js')
sw = io.open(p, encoding='utf-8', newline='').read()
build = hashlib.sha1(html.encode('utf-8')).hexdigest()[:10]
sw2, n1 = re.subn(r"const BUILD = /\*__BUILD__\*/'[^']*';", "const BUILD = /*__BUILD__*/'%s';" % build, sw)
sw2, n2 = re.subn(r"const SHELL = /\*__SHELL__\*/\[[^\]]*\];", "const SHELL = /*__SHELL__*/%s;" % json.dumps(['./' + f for f in shell]), sw2)
assert n1 == 1 and n2 == 1, (n1, n2)
if sw2 != sw:
    io.open(p, 'w', encoding='utf-8', newline='').write(sw2)
print('sw.js: BUILD', build, '| SHELL', shell, '| cambiado' if sw2 != sw else '| sin cambios')
