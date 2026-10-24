/* Happy Low Cost — explorador de chollos: filtros, orden, URL compartible y favoritos */
(function () {
  'use strict';
  var d = document, w = window, EN = (d.documentElement.lang || '').slice(0, 2) === 'en';
  var box = d.querySelector('[data-explorer-filters]'), grid = d.querySelector('[data-explorer-grid]');
  if (!box || !grid) return;
  var cards = [].slice.call(grid.querySelectorAll('.dc'));
  var empty = d.querySelector('[data-x-empty]'), count = d.querySelector('[data-x-count]');
  var $ = function (k) { return box.querySelector('[data-x="' + k + '"]'); };
  var favs = function () { try { return JSON.parse(localStorage.getItem('hlc_favs') || '[]'); } catch (e) { return []; } };
  var st = { q: '', desde: '', aero: '', dur: '', mes: '', orden: 'nuevo', cont: '', max: 1500, dir: false, rt: false, fav: false };
  var slug = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };

  // estado inicial desde la URL
  var u = new URLSearchParams(location.search);
  ['q', 'desde', 'aero', 'dur', 'mes', 'orden', 'cont'].forEach(function (k) { if (u.get(k)) st[k] = u.get(k); });
  if (u.get('max')) st.max = +u.get('max') || 1500;
  ['dir', 'rt', 'fav'].forEach(function (k) { st[k] = u.get(k) === '1'; });
  // precio máximo según los chollos
  var maxP = Math.max.apply(null, cards.map(function (c) { return +c.dataset.price || 0; }).concat([100]));
  var rng = $('max'); if (rng) { rng.max = Math.ceil(maxP / 10) * 10; if (st.max > +rng.max) st.max = +rng.max; }

  function durOk(n, d) { if (!n && n !== 0) return false; return d === 'finde' ? n >= 1 && n <= 4 : d === 'semana' ? n >= 5 && n <= 9 : d === 'largo' ? n >= 10 && n < 90 : true; }
  function paint() {
    if ($('q')) $('q').value = st.q; if ($('desde')) $('desde').value = st.desde; if ($('aero')) $('aero').value = st.aero; if ($('dur')) $('dur').value = st.dur; if ($('mes')) $('mes').value = st.mes; if ($('orden')) $('orden').value = st.orden;
    if (rng) rng.value = st.max; var out = box.querySelector('[data-x-out="max"]'); if (out) out.textContent = (rng && st.max >= +rng.max) ? (EN ? 'no limit' : 'sin límite') : (EN ? '€' + st.max : st.max + ' €');
    ['dir', 'rt', 'fav'].forEach(function (k) { if ($(k)) $(k).checked = st[k]; });
    box.querySelectorAll('[data-cont]').forEach(function (b) { b.setAttribute('aria-pressed', (b.getAttribute('data-cont') || '') === st.cont); });
  }
  function apply(push) {
    var f = favs(), q = slug(st.q), lim = rng && st.max >= +rng.max ? Infinity : st.max, n = 0;
    cards.forEach(function (c) {
      var ok = (!q || (c.dataset.q || '').indexOf(q) >= 0) && (!st.desde || c.dataset.oc === st.desde) && (!st.aero || slug(c.dataset.orig) === st.aero) && (!st.dur || durOk(+c.dataset.n, st.dur)) && (!st.mes || (c.dataset.ida || '').slice(0, 7) === st.mes) &&
        (!st.cont || c.dataset.cont === st.cont) && (+c.dataset.price <= lim) && (!st.dir || c.dataset.dir === '1') && (!st.rt || c.dataset.tipo === 'rt') && (!st.fav || f.indexOf(c.dataset.slug) >= 0);
      c.hidden = !ok; if (ok) n++;
    });
    var G = w.HLC_GEO, o = null; try { o = localStorage.getItem('hlc_origin'); } catch (e) {}
    var rank = function (c) { if (!G) return 0; if (o && c.dataset.orig === o) return 0; return G.reg.cc.indexOf((c.dataset.occ || '').toUpperCase()) >= 0 ? 1 : 2; };
    var key = { nuevo: function (c) { var t = Date.parse(c.dataset.ts) || 0, h = (Date.now() - t) / 36e5; return (h < 12 ? 0 : h < 36 ? 1 : 2) * 1e14 + rank(c) * 1e13 - t; }, precio: function (c) { return +c.dataset.price; }, fecha: function (c) { return Date.parse(c.dataset.ida) || 9e15; } }[st.orden] || function () { return 0; };
    cards.slice().sort(function (a, b) { return key(a) - key(b); }).forEach(function (c) { grid.appendChild(c); });
    if (count) count.textContent = n;
    if (empty) empty.hidden = n > 0;
    if (push) {
      var p = new URLSearchParams();
      ['q', 'desde', 'aero', 'dur', 'mes', 'cont'].forEach(function (k) { if (st[k]) p.set(k, st[k]); });
      if (st.orden !== 'nuevo') p.set('orden', st.orden);
      if (rng && st.max < +rng.max) p.set('max', st.max);
      ['dir', 'rt', 'fav'].forEach(function (k) { if (st[k]) p.set(k, '1'); });
      var qs = p.toString(); history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
      try { (w.dataLayer = w.dataLayer || []).push({ event: 'hlc_filtro', filtros: qs }); } catch (e) {}
    }
  }
  var t;
  box.addEventListener('input', function (e) {
    var k = e.target.getAttribute('data-x'); if (!k) return;
    st[k] = e.target.type === 'checkbox' ? e.target.checked : (k === 'max' ? +e.target.value : e.target.value);
    paint(); clearTimeout(t); t = setTimeout(function () { apply(true); }, k === 'q' ? 180 : 0);
  });
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cont]'); if (b) { st.cont = b.getAttribute('data-cont') || ''; paint(); apply(true); return; }
    var tg = e.target.closest('[data-x-toggle]'); if (tg) { var o = box.classList.toggle('open'); tg.setAttribute('aria-expanded', o); tg.textContent = o ? (EN ? '✕ Fewer filters' : '✕ Menos filtros') : (EN ? '⚙️ More filters' : '⚙️ Más filtros'); return; }
    if (e.target.closest('[data-x-clear]')) { st = { q: '', desde: '', mes: '', orden: 'nuevo', cont: '', max: rng ? +rng.max : 1500, dir: false, rt: false, fav: false }; paint(); apply(true); }
  });
  w.addEventListener('hlc:favs', function () { if (st.fav) apply(false); });
  paint(); apply(false);
  d.addEventListener('DOMContentLoaded', function () { apply(false); });
})();
