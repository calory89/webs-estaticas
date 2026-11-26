// Ask the database: plain-language questions answered from the published data only.
(function () {
  var f = document.getElementById('askf'); if (!f) return;
  var q = document.getElementById('askq'), out = document.getElementById('asko'), btn = f.querySelector('button');
  function esc(t) { var x = document.createElement('i'); x.textContent = t == null ? '' : String(t); return x.innerHTML; }
  function run(text) {
    q.value = text; btn.disabled = true; out.hidden = false;
    var np = document.querySelector('[data-db="projects"]'), nt = np && /^[\d,]+$/.test(np.textContent.trim()) ? np.textContent.trim() + ' projects' : 'the database';
    out.innerHTML = '<p class="ask-wait"><span></span>Reading ' + nt + '…</p>';
    fetch('/api/kb/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: text }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        btn.disabled = false;
        if (d.error) { out.innerHTML = '<p>' + (d.error === 'rate' ? 'Too many questions from here this hour. Try again later.' : d.error === 'question' ? 'Ask a longer question, for example one of the examples above.' : d.error === 'model' ? 'We could not get a clear answer to this one. Try asking it another way, or pick one of the examples.' : 'The answer service is busy. Try again in a minute.') + '</p>'; return; }
        var h = '<p class="ask-a">' + esc(d.answer) + '</p>';
        if ((d.numbers || []).length) h += '<div class="ask-n">' + d.numbers.map(function (n) { return '<div><b>' + esc(n.value) + '</b><span>' + esc(n.label) + '</span></div>'; }).join('') + '</div>';
        if ((d.projects || []).length) h += '<p class="ask-p">Open: ' + d.projects.map(function (id) { return '<a href="/p/?id=' + encodeURIComponent(id) + '">' + esc(id) + '</a>'; }).join(' ') + (d.projects.length > 1 ? ' · <a href="/compare/?ids=' + encodeURIComponent(d.projects.slice(0, 4).join(',')) + '">compare</a>' : '') + '</p>';
        if ((d.follow_up || []).length) h += '<p class="ask-f">' + d.follow_up.map(function (x) { return '<button type="button" class="ask-chip">' + esc(x) + '</button>'; }).join('') + '</p>';
        h += '<p class="ask-src">Answered from the published database (updated ' + esc(d.updated) + '). Check the numbers on the project files; not financial or legal advice.</p>';
        out.innerHTML = h;
        try { window.gtag && gtag('event', 'ask_db', { q: text.slice(0, 80) }); } catch (e) {}
      }).catch(function () { btn.disabled = false; out.innerHTML = '<p>Could not reach the service. Try again.</p>'; });
  }
  f.addEventListener('submit', function (e) { e.preventDefault(); var t = q.value.trim(); if (t.length > 3) return run(t);
    out.hidden = false; out.innerHTML = '<p>Type a question first, or tap one of the examples.</p>'; q.focus(); });
  document.addEventListener('click', function (e) { var c = e.target.closest('.ask-chip'); if (c) run(c.textContent); });
})();
