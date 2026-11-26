// Kolaboro alerts service worker (scope /alerts/). Shows the push Kolaboro sends when a watched project's public record changes.
// It caches nothing and reads nothing else.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Kolaboro', body: e.data ? e.data.text() : '' }; }
  var url = /^https:\/\/kolaboro\.com\//.test(d.url || '') ? d.url : 'https://kolaboro.com/alerts/';
  e.waitUntil(self.registration.showNotification(String(d.title || 'Kolaboro').slice(0, 120), {
    body: String(d.body || '').slice(0, 300), tag: String(d.tag || 'kolaboro'), renotify: true,
    icon: '/extension/src/icons/icon128.png', data: { url: url }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || 'https://kolaboro.com/alerts/';
  e.waitUntil(self.clients.openWindow(url));
});
