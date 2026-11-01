// Kolaboro popup. Reads the active tab URL (activeTab), sends nothing until you press the button.
(function () {
  var BASE = 'https://kolaboro.com/check';
  var hasChrome = typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query;
  var $ = function (id) { return document.getElementById(id); };
  var current = '';

  function checkUrl(u) {
    var e = encodeURIComponent(u);
    return BASE + '?url=' + e + '&q=' + e + '&src=ext';
  }
  function open(u) {
    if (hasChrome && chrome.tabs.create) chrome.tabs.create({ url: u });
    else window.open(u, '_blank', 'noopener');
    if (hasChrome) window.close();
  }
  function key(u) {
    try { var x = new URL(u); return 'kb-cl:' + x.hostname + x.pathname; } catch (e) { return ''; }
  }

  function show(u) {
    current = u || '';
    var web = /^https?:\/\//i.test(current);
    $('url').textContent = current || 'No page address available';
    $('go').disabled = !web;
    if (!web) {
      $('msg').textContent = /^(chrome|edge|about|chrome-extension|file|view-source|devtools):/i.test(current)
        ? 'This is a browser page, not a website. Open the developer\'s project page and try again.'
        : 'Open a project website (an address starting with http or https) to check it.';
    } else {
      $('msg').textContent = 'Opens kolaboro.com with this address. Free, no account needed.';
    }
    loadTicks();
  }

  // Checklist ticks are kept only in this browser, per page.
  var boxes = Array.prototype.slice.call(document.querySelectorAll('#cl input'));
  function loadTicks() {
    var k = key(current), saved = {};
    try { saved = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) {}
    boxes.forEach(function (b) { b.checked = !!saved[b.dataset.k]; });
    count();
  }
  function saveTicks() {
    var k = key(current); if (!k) return;
    var o = {}; boxes.forEach(function (b) { if (b.checked) o[b.dataset.k] = 1; });
    try { if (Object.keys(o).length) localStorage.setItem(k, JSON.stringify(o)); else localStorage.removeItem(k); } catch (e) {}
  }
  function count() {
    var n = boxes.filter(function (b) { return b.checked; }).length;
    $('count').textContent = n + ' of 6';
    var h = $('hint');
    if (n === 6) { h.textContent = 'All six visible. Now check they are real: ask for documents and look the permit up.'; h.className = 'hint ok'; }
    else { h.textContent = (6 - n) + ' missing. Each one is a question to ask before you pay anything.'; h.className = 'hint'; }
  }
  boxes.forEach(function (b) { b.addEventListener('change', function () { saveTicks(); count(); }); });

  $('go').addEventListener('click', function () {
    if (/^https?:\/\//i.test(current)) open(checkUrl(current));
  });
  Array.prototype.forEach.call(document.querySelectorAll('a[data-ext]'), function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); open(a.href); });
  });

  if (hasChrome) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      show(tabs && tabs[0] ? (tabs[0].url || tabs[0].pendingUrl || '') : '');
    });
  } else {
    // Preview mode outside Chrome (used for screenshots): popup.html?u=<url>
    show(new URLSearchParams(location.search).get('u') || '');
  }
})();
