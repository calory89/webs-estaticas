"""Comprueba un <lang>.fix.json contra su <lang>.pack.json: JSON valido, claves que existen,
mismos {marcadores} y etiquetas HTML que el ingles, categorias de plural validas.
    python3 i18n_check.py /home/claude/sn/i18n/xx.fix.json"""
import json, re, sys
fx = json.load(open(sys.argv[1], encoding='utf-8'))
pk = json.load(open(sys.argv[1].replace('.fix.json', '.pack.json'), encoding='utf-8'))
ph = lambda s: sorted(set(re.findall(r'\{[a-z0-9_]+\}', s or '')))
tags = lambda s: sorted(re.findall(r'</?[a-z][a-z0-9]*', s or ''))
err = []
for k, v in (fx.get('strings') or {}).items():
    if k not in pk['strings']: err.append('clave desconocida: ' + k); continue
    en = pk['strings'][k]['en']
    if not isinstance(v, str) or not v.strip(): err.append('vacia: ' + k); continue
    if ph(v) != ph(en): err.append('marcadores %s: %s vs en %s' % (k, ph(v), ph(en)))
    if tags(v) != tags(en): err.append('html %s: %s vs en %s' % (k, tags(v), tags(en)))
cats = set(pk['pluralCategories'])
for k, v in (fx.get('plural') or {}).items():
    base, _, c = k.partition('#')
    if base not in pk['plural']: err.append('plural desconocido: ' + k); continue
    if c and c not in cats: err.append('categoria %s no existe en %s: %s' % (c, pk['lang'], k))
    need=ph(pk['plural'][base]['en_base'])
    if c in ('zero','one','two'): need=[x for x in need if x!='{n}']; got=[x for x in ph(v) if x!='{n}']
    else: got=ph(v)
    if got != need: err.append('marcadores plural %s: %s' % (k, ph(v)))
for sec in ('sub', 'lbl', 'for'):
    for k, v in (fx.get(sec) or {}).items():
        if k not in (pk.get(sec) or {}): err.append('%s desconocida: %s' % (sec, k))
print('OK' if not err else '\n'.join(err[:80]))
print('cambios: strings=%d plural=%d sub=%d lbl=%d for=%d' % tuple(len(fx.get(s) or {}) for s in ('strings','plural','sub','lbl','for')))
