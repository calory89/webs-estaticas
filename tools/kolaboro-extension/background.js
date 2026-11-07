// Kolaboro X-ray service worker. It only relays two kinds of request for the in-page panel, so portal pages never talk to
// kolaboro.com themselves: (1) the hash-prefix lookup, (2) the X-ray stream the person asked for. No tracking, no storage.
importScripts('i18n.js', 'kx.js');

chrome.runtime.onMessage.addListener(function (m, sender, send) {
  if (!m || m.t !== 'kx-xr' || !Array.isArray(m.p)) return;
  var p = m.p.filter(function (x) { return /^[0-9a-f]{4}$/.test(x); }).slice(0, 500);
  if (!p.length) { send(null); return; }
  KX.fetchXr(p).then(send).catch(function () { send({ offline: true }); });
  return true;   // answer asynchronously
});

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name !== 'kx-xray') return;
  var ctl = new AbortController(), open = true;
  port.onDisconnect.addListener(function () { open = false; ctl.abort(); });
  port.onMessage.addListener(function (m) {
    if (!m || typeof m.u !== 'string' || !/^https?:\/\//i.test(m.u)) { port.postMessage({ type: '_err' }); return; }
    KX.xray(m.u.slice(0, 2000), m.lang || 'en', function (e) { if (open) port.postMessage(e); }, ctl.signal)
      .then(function () { if (open) port.postMessage({ type: '_end' }); })
      .catch(function () { if (open) port.postMessage({ type: '_err' }); });
  });
});
