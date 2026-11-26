/* kolaboro.com transparency log, in-browser check (n34c, 21 Nov 2026). Fetches /api/v1/tlog/proof and recomputes, with WebCrypto:
   the record leaf, the RFC 9162 inclusion path to the day root and to the log root, and the Ed25519 signature on the tree head. */
(function () {
  var f = document.getElementById('tl-f'), out = document.getElementById('tl-out'), T = {};
  try { T = JSON.parse(document.getElementById('tl-t').textContent); } catch (e) {}
  if (!f || !out || !window.crypto || !crypto.subtle) return;
  var te = new TextEncoder();
  function canon(v) { return v === null || typeof v !== 'object' ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).filter(function (k) { return v[k] !== undefined; }).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}'; }
  function cat(a, b, c) { var o = new Uint8Array(a.length + b.length + (c ? c.length : 0)); o.set(a, 0); o.set(b, a.length); if (c) o.set(c, a.length + b.length); return o; }
  function H(b) { return crypto.subtle.digest('SHA-256', b).then(function (x) { return new Uint8Array(x); }); }
  function hex(a) { return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function unhex(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  var ONE = new Uint8Array([1]), ZERO = new Uint8Array([0]);
  async function incl(leaf, index, size, path) {
    if (index >= size) return null; var fn = index, sn = size - 1, r = leaf;
    for (var i = 0; i < path.length; i++) { var p = unhex(path[i]); if (sn === 0) return null;
      if ((fn & 1) || fn === sn) { r = await H(cat(ONE, p, r)); if (!(fn & 1)) while (!(fn & 1) && fn) { fn >>= 1; sn >>= 1; } } else r = await H(cat(ONE, r, p));
      fn >>= 1; sn >>= 1; }
    return sn === 0 ? hex(r) : null;
  }
  function li(ok, txt) { var e = document.createElement('li'); e.textContent = (ok ? '✓ ' : '✗ ') + txt; e.className = ok ? 'ok' : 'bad'; return e; }
  async function run(slug) {
    out.textContent = T.load || '...';
    var r = await fetch('/api/v1/tlog/proof?project=' + encodeURIComponent(slug)), d = await r.json();
    out.textContent = '';
    if (!r.ok || d.error) { var p0 = document.createElement('p'); p0.className = 'bad'; p0.textContent = (T.err || 'No proof') + (d.error ? ': ' + d.error : ''); out.appendChild(p0); return; }
    var ul = document.createElement('ul'), all = true;
    var leaf = await H(cat(ZERO, te.encode('kolaboro-tlog-v1|' + d.day + '|' + d.project + '|' + canon(d.record))));
    var a = hex(leaf) === d.leaf; all = all && a; ul.appendChild(li(a, T.leaf || 'leaf'));
    var b = (await incl(leaf, d.leaf_index, d.day_size, d.day_path)) === d.day_root; all = all && b; ul.appendChild(li(b, (T.day || 'day root') + ' (' + d.day_path.length + ')'));
    var dl = await H(cat(ZERO, te.encode('kolaboro-tlog-day-v1|' + d.day + '|' + d.day_root + '|' + d.day_size + '|' + d.snapshot.head)));
    var c = (await incl(dl, d.day_index, d.tree_head.size, d.log_path)) === d.tree_head.root; all = all && c; ul.appendChild(li(c, T.log || 'log root'));
    var sOk = null;
    try {
      var keys = (await (await fetch('/.well-known/kolaboro-keys.json')).json()).keys || [], k = keys.filter(function (x) { return d.signature && x.kid === d.signature.kid; })[0] || keys[0];
      var raw = Uint8Array.from(atob(k.public_key_raw_b64), function (ch) { return ch.charCodeAt(0); });
      var key = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
      var h = hex(await H(te.encode(canon(d.tree_head))));
      sOk = await crypto.subtle.verify({ name: 'Ed25519' }, key, Uint8Array.from(atob(d.signature.value), function (ch) { return ch.charCodeAt(0); }), te.encode('kolaboro-sig-v1\n' + h));
    } catch (e) { sOk = null; }
    if (sOk === null) { var n = document.createElement('li'); n.textContent = T.nosig || 'no Ed25519 in this browser'; ul.appendChild(n); } else { all = all && sOk; ul.appendChild(li(sOk, T.sig || 'signature')); }
    var hd = document.createElement('p'); hd.className = all ? 'ok' : 'bad'; hd.textContent = (all ? T.ok : T.bad) + ': ' + (T.rec || '{d} {i} {n}').replace('{d}', d.day).replace('{i}', d.leaf_index + 1).replace('{n}', d.day_size);
    out.appendChild(hd); out.appendChild(ul);
    var a2 = document.createElement('a'); a2.href = '/api/v1/tlog/proof?project=' + encodeURIComponent(slug); a2.textContent = 'proof.json'; a2.setAttribute('download', 'proof.json'); out.appendChild(a2);
  }
  f.addEventListener('submit', function (e) { var v = (f.querySelector('input').value || '').trim().toLowerCase(); if (!/^[a-z0-9-]{1,90}$/.test(v)) return; e.preventDefault(); run(v).catch(function () { out.textContent = T.err || 'error'; }); });
  if (out.getAttribute('data-auto')) run(f.querySelector('input').value.trim().toLowerCase()).catch(function () {});
})();
