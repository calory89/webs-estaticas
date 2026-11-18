// Kolaboro X-ray service worker. It only relays these requests for the in-page panels, so portal pages and Gmail never talk to
// kolaboro.com themselves: (1) the hash-prefix lookup, (2) the X-ray stream the person asked for, (3) for the Gmail panel, the public
// list of developer domains and (4) the public DNS and registration date of one sender domain. No tracking, no storage.
importScripts('i18n.js', 'kx.js');

chrome.runtime.onMessage.addListener(function (m, sender, send) {
  if (!m || m.t !== 'kx-xr' || !Array.isArray(m.p)) return;
  var p = m.p.filter(function (x) { return /^[0-9a-f]{4}$/.test(x); }).slice(0, 500);
  if (!p.length) { send(null); return; }
  KX.fetchXr(p).then(send).catch(function () { send({ offline: true }); });
  return true;   // answer asynchronously
});

var ML = null;
chrome.runtime.onMessage.addListener(function (m, sender, send) {
  if (!m || (m.t !== 'kx-ml' && m.t !== 'kx-md')) return;
  var opt = { credentials: 'omit', referrerPolicy: 'no-referrer' };
  if (m.t === 'kx-ml') {
    if (ML && Date.now() - ML.t < 3600000) { send(ML.v); return; }
    fetch(KX.ORIGIN + '/api/x/fraud/domains', opt).then(function (r) { return r.json(); }).then(function (j) { ML = { t: Date.now(), v: j }; send(j); }).catch(function () { send(null); });
    return true;
  }
  var d = String(m.d || '').toLowerCase();
  if (!/^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,63}$/.test(d)) { send(null); return; }
  fetch(KX.ORIGIN + '/api/x/fraud/domain?d=' + encodeURIComponent(d), opt).then(function (r) { return r.json(); }).then(send).catch(function () { send(null); });
  return true;
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
