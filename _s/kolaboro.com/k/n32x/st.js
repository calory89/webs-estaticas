/* kolaboro.com /changes/live/ (n32x, batch 32): live ticker on the Server-Sent Events stream /api/v1/stream.
   EventSource reconnects by itself after each "bye" and sends Last-Event-ID, so only new changes arrive. */
(function () {
  'use strict';
  var A = document.getElementById('n32-app'); if (!A || !window.EventSource) return;
  var M = JSON.parse(document.getElementById('n32-t').textContent), L = M._loc || 'en-GB', l = M._l || 'en', P = l === 'en' ? '' : '/' + l;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var fd = function (d) { try { return new Intl.DateTimeFormat(L, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d)); } catch (e) { return String(d).slice(0, 10); } };
  A.innerHTML = '<style>.st-l{list-style:none;padding:0;margin:8px 0}.st-l li{border-bottom:1px solid var(--line,#d5d3cc);padding:9px 0;animation:stin .5s ease}.st-l .k-xs a{margin-inline-start:6px}.st-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#9AA4AE;margin-inline-end:6px;vertical-align:middle}.st-dot.on{background:#0B7A55;box-shadow:0 0 0 4px rgba(11,122,85,.15)}@keyframes stin{from{background:rgba(255,91,20,.12)}to{background:transparent}}@media (prefers-reduced-motion:reduce){.st-l li{animation:none}}</style>' +
    '<p><span class="st-dot" id="st-dot"></span><span id="st-s" role="status" aria-live="polite">' + esc(M.conn) + '</span> <button type="button" class="kbtn" id="st-p">' + esc(M.pause) + '</button></p><ol class="st-l" id="st-l" reversed></ol>';
  var $ = function (id) { return document.getElementById(id); }, es = null, n = 0, paused = false;
  function item(c) {
    var li = document.createElement('li');
    li.innerHTML = '<b>' + esc(c.title) + '</b><br>' + esc(c.text) + '<div class="k-xs">' + esc(fd(c.at)) + ' · ' + (c.project ? '<a href="' + P + '/projects/' + esc(c.project.slug) + '/">' + esc(c.project.name) + '</a> · ' + esc(c.project.market) : '') + (c.source ? ' <a href="' + esc(c.source) + '" rel="nofollow noopener" target="_blank">' + esc(M.src) + '</a>' : '') + '</div>';
    var ol = $('st-l'); ol.insertBefore(li, ol.firstChild); while (ol.children.length > 200) ol.removeChild(ol.lastChild);
  }
  function open() {
    es = new EventSource('/api/v1/stream?n=30');
    es.addEventListener('hello', function () { $('st-dot').className = 'st-dot on'; });
    es.addEventListener('change', function (e) { try { item(JSON.parse(e.data)); n++; $('st-s').textContent = fill(M.live, { n: n }); } catch (x) {} });
    es.addEventListener('deploy', function (e) { try { $('st-s').textContent = fill(M.dep, { c: JSON.parse(e.data).commit.slice(0, 12) }); } catch (x) {} });
    es.addEventListener('bye', function () { $('st-dot').className = 'st-dot'; $('st-s').textContent = M.re; });
    es.onerror = function () { $('st-dot').className = 'st-dot'; if (es.readyState === 2) $('st-s').textContent = M.err; };
  }
  $('st-p').addEventListener('click', function () { paused = !paused; this.textContent = paused ? M.resume : M.pause; if (paused) { es && es.close(); $('st-dot').className = 'st-dot'; } else open(); });
  open();
})();
