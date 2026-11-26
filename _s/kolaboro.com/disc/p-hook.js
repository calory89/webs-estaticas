/* Project page add-on (block U6, batch 6), loaded by /p/: adds "Most similar projects" (nightly embeddings, /data/similar.json via
   /api/x/disc/similar) with the shared public features that explain each match, a link to the project timeline, and the display
   currency selector (/k/currency.js). Runs after p.js renders and again if p.js re-renders. */
(function () {
  if (window.KDISC_P) return; window.KDISC_P = 1;
  var id = ''; try { id = (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase(); } catch (e) {}
  if (!/^[A-Z]{2,5}-\d{3,4}$/.test(id)) return;
  var root = document.getElementById('pf'); if (!root) return;
  var TIER = { clear: 'Strong public disclosure', mixed: 'Some gaps', caution: 'Check carefully' };
  var data = null, asked = false;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('kdisc-css')) return;
    var l = document.createElement('style'); l.id = 'kdisc-css'; l.textContent = '.tier{display:inline-block;font-size:.72rem;font-weight:800;padding:1px 7px;border-radius:999px;border:1.5px solid currentColor;margin-left:6px;vertical-align:1px;white-space:nowrap}.tier.clear{color:#0B7A55}.tier.mixed{color:#8A5A0F}.tier.caution{color:#B42318}.sim{margin-top:28px}.sim h2{font-size:1.4rem;letter-spacing:-.02em;font-weight:800}.sim-list{list-style:none;margin:12px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}.sim-list>li{border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px 14px;font-size:.9rem;line-height:1.45}.sim-list a.id{font-weight:800;color:var(--ink)}.sim-list .sc{float:right;font-weight:800;font-size:.86rem}.sim-list ul{margin:6px 0 0;padding-left:18px;color:var(--ink-2);font-size:.85rem}.sim-list small{color:var(--muted)}.sim-tl{margin-top:14px}.sim-list ul li{border:0;padding:0;margin:0;background:none;border-radius:0;box-shadow:none;min-height:0;display:list-item}'; document.head.appendChild(l);
  }
  function cur() {
    if (window.KCUR || document.getElementById('kcur-js')) return;
    var s = document.createElement('script'); s.id = 'kcur-js'; s.src = '/k/currency.js?v=5e69664222'; s.defer = true; document.head.appendChild(s);
  }
  function section() {
    if (!data) return '<p class="sub">Loading the most similar projects.</p>';
    if (data.status !== 'ready') return '<p class="sub">The nightly similarity job has not published its first results yet.</p>';
    if (!data.items.length) return '<p class="sub">No similar project found for this id.</p>';
    return '<p class="sub">Found by comparing the public text of every project with an open sentence-embedding model (' + esc(data.model && data.model.name) + ', run nightly on our build server) plus market, stage, price band and which checks are published. Score from 0 to 1. Updated ' + esc(data.generated) + '.</p>' +
      '<ul class="sim-list">' + data.items.map(function (x) {
        return '<li data-kid="' + esc(x.id) + '"><span class="sc" title="Text ' + x.text + ', features ' + x.struct + '">' + x.score.toFixed(2) + '</span><a class="id" href="/p/?id=' + encodeURIComponent(x.id) + '">' + esc(x.id) + '</a> <span class="tier ' + esc(x.tier) + '">' + esc(TIER[x.tier] || 'Some gaps') + '</span>' +
          '<br><small>' + esc((x.area ? x.area + ', ' : '') + x.market + ', ' + x.country) + ' · ' + esc(x.band || 'Price not stated') + ' · ' + x.pub + ' of ' + x.max + ' checks</small>' +
          '<ul>' + x.shared.slice(0, 4).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '<li>text similarity ' + x.text.toFixed(2) + '</li></ul></li>';
      }).join('') + '</ul><p class="pf-fine"><a href="/compare/?ids=' + [id].concat(data.items.slice(0, 3).map(function (x) { return x.id; })).map(encodeURIComponent).join(',') + '">Compare the top 3 side by side</a> · <a href="/data/similar.json">similar.json</a> · <a href="/map/">World map</a></p>';
  }
  function inject() {
    var more = document.getElementById('pf-more');
    if (!more) return;
    if (!more.querySelector('a[data-kdisc]')) more.insertAdjacentHTML('beforeend', ' &middot; <a data-kdisc href="/timeline/?id=' + encodeURIComponent(id) + '">Timeline of every event</a>');
    var box = document.getElementById('pf-simx');
    if (!box) {
      var after = root.querySelector('.pf-sim'); after = after ? after.closest('section') : more.closest('section');
      if (!after) return;
      after.insertAdjacentHTML('afterend', '<section class="pf-sec pf-noprint" id="pf-simx-s"><div class="wrap sim"><h2>Most similar projects</h2><div id="pf-simx"></div><p class="sim-tl"><a class="btn btn-line" href="/timeline/?id=' + encodeURIComponent(id) + '">See the full timeline of ' + esc(id) + '</a></p></div></section>');
      box = document.getElementById('pf-simx');
    }
    if (box.getAttribute('data-state') !== (data ? 'done' : 'wait')) { box.innerHTML = section(); box.setAttribute('data-state', data ? 'done' : 'wait'); }
    if (!asked) {
      asked = true;
      fetch('/api/x/disc/similar?id=' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : { status: 'error', items: [] }; }).catch(function () { return { status: 'error', items: [] }; }).then(function (j) { data = j; inject(); });
    }
  }
  css(); cur();
  inject();
  if (window.MutationObserver) new MutationObserver(function () { if (!document.getElementById('pf-simx') || (data && document.getElementById('pf-simx').getAttribute('data-state') !== 'done') || !document.querySelector('#pf-more a[data-kdisc]')) inject(); }).observe(root, { childList: true, subtree: true });
})();
