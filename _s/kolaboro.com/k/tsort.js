/* n40 d9: sortable columns for project tables (table[data-sort]). Each header becomes a button; the order follows data-v when a cell has it,
   otherwise numbers, otherwise text in the page language. aria-sort tells screen readers the current order. No strings: headers keep their own text. */
(function () {
  var T = document.querySelectorAll('table[data-sort],table.k40m'); if (!T.length) return;
  var lang = document.documentElement.lang || 'en', col; try { col = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' }); } catch (e) { col = { compare: function (a, b) { return a < b ? -1 : a > b ? 1 : 0; } }; }
  function key(td) { if (!td) return ''; var v = td.getAttribute('data-v'); if (v != null) return v; return (td.textContent || '').trim(); }
  function num(s) { if (s === '' || s === '-') return null; var n = Number(String(s).replace(/[\s  ,]/g, '')); return isFinite(n) ? n : null; }
  Array.prototype.forEach.call(T, function (t) {
    var ths = t.tHead && t.tHead.rows[0] ? t.tHead.rows[0].cells : []; var body = t.tBodies[0]; if (!body || body.rows.length < 3) return;
    var orig = Array.prototype.slice.call(body.rows);
    Array.prototype.forEach.call(ths, function (th, i) {
      if (th.hasAttribute('data-nosort')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tsort-b';
      while (th.firstChild) b.appendChild(th.firstChild);
      var ic = document.createElement('span'); ic.className = 'tsort-i'; ic.setAttribute('aria-hidden', 'true'); b.appendChild(ic);
      th.appendChild(b);
      b.addEventListener('click', function () {
        var cur = th.getAttribute('aria-sort'), dir = cur === 'descending' ? 'ascending' : cur === 'ascending' ? 'none' : (th.hasAttribute('data-desc') ? 'descending' : 'ascending');
        Array.prototype.forEach.call(ths, function (x) { x.removeAttribute('aria-sort'); });
        var rows = orig.slice();
        if (dir !== 'none') {
          th.setAttribute('aria-sort', dir);
          var k = rows.map(function (r) { var s = key(r.cells[i]); return { r: r, s: s, n: num(s) }; });
          k.sort(function (a, b) {
            if (a.s === '' || a.s === '-') return (b.s === '' || b.s === '-') ? 0 : 1; if (b.s === '' || b.s === '-') return -1;   // empty cells last either way
            var c = (a.n != null && b.n != null) ? a.n - b.n : col.compare(a.s, b.s); return dir === 'ascending' ? c : -c;
          });
          rows = k.map(function (x) { return x.r; });
        }
        var f = document.createDocumentFragment(); rows.forEach(function (r) { f.appendChild(r); }); body.appendChild(f);
      });
    });
    t.classList.add('tsort-on');
  });
})();
