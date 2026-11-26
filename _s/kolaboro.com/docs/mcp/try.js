/* kolaboro.com/docs/mcp: a live call to the MCP server from this page (protocol 2026-07-28), with the signature checked in the browser. */
(function () {
  'use strict';
  var el = document.getElementById('mcp-live'); if (!el) return;
  var V = '2026-07-28', META = { 'io.modelcontextprotocol/protocolVersion': V, 'io.modelcontextprotocol/clientInfo': { name: 'kolaboro-docs-page', version: '1.0.0' }, 'io.modelcontextprotocol/clientCapabilities': {} };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function call(id, method, params, name) {
    var h = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': V, 'mcp-method': method };
    if (name) h['mcp-name'] = name;
    return fetch('/mcp', { method: 'POST', headers: h, body: JSON.stringify({ jsonrpc: '2.0', id: id, method: method, params: Object.assign({ _meta: META }, params || {}) }) })
      .then(function (r) { return r.json(); }).then(function (j) { if (j.error) throw new Error(j.error.message); return j.result; });
  }
  var t0 = performance.now(), disc;
  call(1, 'server/discover').then(function (d) {
    disc = d;
    return call(2, 'tools/call', { name: 'database_stats', arguments: {} }, 'database_stats');
  }).then(function (r) {
    var ms = Math.round(performance.now() - t0), body = r.content[0].text, sig = JSON.parse(r.content[1].text).kolaboro_signature, d = JSON.parse(body);
    return fetch('/.well-known/kolaboro-keys.json').then(function (x) { return x.json(); }).then(function (keys) {
      var k = (keys.keys || []).filter(function (x) { return x.kid === sig.key_id; })[0];
      return k && sig.signature ? KV.verifySignature(body, sig.signature, k.public_key_raw_b64) : false;
    }).then(function (ok) {
      el.className = '';
      el.innerHTML = '<b>Live, from your browser just now:</b> the server speaks ' + disc.supportedVersions.map(function (v) { return '<code>' + esc(v) + '</code>'; }).join(', ') +
        '; <code>database_stats</code> answered in ' + ms + ' ms with ' + Number(d.projects).toLocaleString('en-US') + ' projects in ' + esc(d.markets) + ' markets; signature ' +
        (ok ? '<b style="color:#086146">verified</b> with key <code>' + esc(sig.key_id) + '</code>.' : '<b style="color:#9A2412">not verified</b>.');
    });
  }).catch(function (e) { el.textContent = 'Live check failed from this browser: ' + (e && e.message ? e.message : e); });
})();
