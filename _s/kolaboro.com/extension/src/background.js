// Kolaboro extension service worker: one context menu item and the overlay lookup, no tracking.
var BASE = 'https://kolaboro.com/check';

function checkUrl(u) {
  var e = encodeURIComponent(u);
  return BASE + '?url=' + e + '&q=' + e + '&src=ext';
}
function isWeb(u) { return /^https?:\/\//i.test(u || ''); }

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({
      id: 'kolaboro-check',
      title: 'Check with Kolaboro',
      contexts: ['page', 'link'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId !== 'kolaboro-check') return;
  var u = info.linkUrl || info.pageUrl || (tab && tab.url);
  if (!isWeb(u)) return;
  chrome.tabs.create({ url: checkUrl(u), index: tab ? tab.index + 1 : undefined });
});

// Overlay lookup for the content script: only 4-hex-character hash prefixes are sent (see content.js).
chrome.runtime.onMessage.addListener(function (m, sender, send) {
  if (!m || m.t !== 'kb-match' || !Array.isArray(m.p)) return;
  var p = m.p.filter(function (x) { return /^[0-9a-f]{4}$/.test(x); }).slice(0, 200);
  if (!p.length) { send(null); return; }
  fetch('https://kolaboro.com/api/x/j/match?p=' + p.sort().join(','), { credentials: 'omit', referrerPolicy: 'no-referrer' })
    .then(function (r) { return r.ok ? r.json() : null; }).then(send).catch(function () { send(null); });
  return true;
});
