// kolaboro.com (n34a, batch 34): "Show evidence" on project pages. Loads /api/v1/projects/<slug>/evidence once and adds, under each
// claim in the claims table, the passage of the cited page that carries it (at most 14 words) and the date it was read.
(function () {
  var b = document.querySelector('[data-n34ev]'); if (!b) return;
  var box = b.closest('details') || document;
  var loaded = null, shown = false, lbl = b.textContent;
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function fd(d) { try { return new Intl.DateTimeFormat(b.getAttribute('data-l') === 'en' ? 'en-GB' : b.getAttribute('data-l'), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function render(d) {
    var by = {}; (d.claims || []).forEach(function (c) { by[norm(c.claim)] = c; });
    var rows = box.querySelectorAll('tr.kfact'), n = 0;
    rows.forEach(function (tr) {
      var td = tr.querySelector('td'); if (!td) return;
      var sp = td.querySelector('span[lang]'); var c = by[norm(sp ? sp.textContent : td.textContent)]; if (!c) return;
      var el = tr.querySelector('.n34-evp'); if (el) { el.hidden = false; n++; return; }
      el = document.createElement('div'); el.className = 'n34-evp';
      el.style.cssText = 'margin-top:6px;font-size:.9rem';
      if (c.passage) {
        var q = document.createElement('q'); q.textContent = c.passage; q.setAttribute('dir', 'auto');
        q.style.cssText = 'display:block;border-inline-start:3px solid var(--line,#d5d3cc);padding-inline-start:8px';
        var s = document.createElement('span'); s.className = 'k-xs'; s.textContent = fill(b.getAttribute('data-q'), { h: host(c.source), d: fd(c.read) });
        el.appendChild(q); el.appendChild(s);
      } else if (c.read) {
        var s2 = document.createElement('span'); s2.className = 'k-xs'; s2.textContent = fill(b.getAttribute('data-nq'), { d: fd(c.read) }); el.appendChild(s2);
      } else return;
      td.appendChild(el); n++;
    });
    return n;
  }
  b.addEventListener('click', function () {
    if (shown) { box.querySelectorAll('.n34-evp').forEach(function (e) { e.hidden = true; }); shown = false; b.textContent = lbl; b.setAttribute('aria-expanded', 'false'); return; }
    b.disabled = true;
    (loaded || (loaded = fetch('/api/v1/projects/' + encodeURIComponent(b.getAttribute('data-n34ev')) + '/evidence').then(function (r) { return r.json(); })))
      .then(function (d) { render(d); shown = true; b.textContent = b.getAttribute('data-hide'); b.setAttribute('aria-expanded', 'true'); })
      .catch(function () { loaded = null; })
      .then(function () { b.disabled = false; });
  });
})();
