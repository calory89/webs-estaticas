/* Kolaboro: the satellite section of a project page is loaded when it is opened (first open, #space, links into it) */
(function () {
  var w = document.querySelector('.ksat-lz'); if (!w) return;
  var d = w.closest('details'), sec = w.closest('section'), u = w.getAttribute('data-lz'), a = w.querySelector('a'), N = (document.currentScript && document.currentScript.nonce) || '', st = 0, want = null;
  if (!d || !u) return;
  function put(h) {
    var t = document.createElement('template'); t.innerHTML = h;
    while (w.nextSibling) w.parentNode.removeChild(w.nextSibling);
    w.parentNode.replaceChild(t.content, w);
    [].forEach.call(d.querySelectorAll('script'), function (o) {
      if (o.type && o.type !== 'text/javascript' && o.type !== 'module') return;
      var s = document.createElement('script'); for (var i = 0; i < o.attributes.length; i++) s.setAttribute(o.attributes[i].name, o.attributes[i].value);
      s.nonce = N; s.textContent = o.textContent; o.parentNode.replaceChild(s, o);
    });
    if (want) { var x = document.getElementById(want); want = null; if (x) { var p = x.closest('details'); while (p) { p.open = true; p = p.parentElement && p.parentElement.closest('details'); } x.scrollIntoView(); } }
  }
  function go() {
    if (st) return; st = 1; if (a) a.textContent = w.getAttribute('data-ld');
    fetch(u, { headers: { 'x-kb-part': '1' }, credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw r.status; return r.text(); }).then(put, function () { st = 0; if (a) a.textContent = w.getAttribute('data-er'); });
  }
  function hash() { var id = location.hash.slice(1); if (!id) return; try { id = decodeURIComponent(id); } catch (e) {} var x = document.getElementById(id); if (x ? !sec.contains(x) : (' ' + (w.getAttribute('data-ids') || '') + ' ').indexOf(' ' + id + ' ') < 0) return; if (!x) want = id; if (!d.open) d.open = true; go(); }
  d.addEventListener('toggle', function () { if (d.open) go(); });
  var sm = d.querySelector('summary'); if (sm) sm.addEventListener('pointerenter', go, { once: true });
  if (a) a.addEventListener('click', function (e) { if (a.textContent !== w.getAttribute('data-er')) { e.preventDefault(); go(); } });
  addEventListener('hashchange', hash); hash(); if (d.open) go();
})();
