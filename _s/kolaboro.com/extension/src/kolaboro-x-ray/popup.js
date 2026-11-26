// Kolaboro X-ray popup: works on any website you are on (activeTab: the address and title of this tab, only when you click the icon).
(function () {
  var lang = KX.uiLang(), app = document.getElementById('app');
  var css = document.createElement('style'); css.textContent = KX.CSS; document.head.appendChild(css);
  document.documentElement.lang = lang; if (lang === 'ar') document.documentElement.dir = 'rtl';
  var st = { lang: lang, url: '', mode: 'loading', popup: true, m: null, xr: { phase: 'idle' } };
  function draw() {
    KX.render(app, st, { run: function () { KX.runXray(st, draw); } });
    // links open in a new tab and close the popup
    Array.prototype.forEach.call(app.querySelectorAll('a[href^="https://kolaboro.com"]'), function (a) {
      a.addEventListener('click', function (e) { if (typeof chrome !== 'undefined' && chrome.tabs) { e.preventDefault(); chrome.tabs.create({ url: a.href }); window.close(); } });
    });
  }
  function start(url, title) {
    st.url = url || '';
    if (!/^https?:\/\//i.test(st.url)) { st.mode = 'notweb'; draw(); return; }
    draw();
    KX.lookup(st.url, [title || ''], null, KX.fetchXr).then(function (r) {
      st.mode = r.res ? 'ready' : 'offline'; st.m = r.m; draw();
    }).catch(function () { st.mode = 'offline'; draw(); });
  }
  var q = new URLSearchParams(location.search);
  if (q.get('u')) start(q.get('u'), q.get('t') || '');   // popup.html?u=<address>&t=<title>: preview and tests
  else if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) { var t = tabs && tabs[0]; start(t ? (t.url || t.pendingUrl || '') : '', t ? t.title : ''); });
  } else start('', '');
})();
