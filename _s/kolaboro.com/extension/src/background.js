// Kolaboro extension service worker: one context menu item, no tracking.
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
