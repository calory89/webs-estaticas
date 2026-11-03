// /log/witnesses/: live list of witnesses, checked in your browser. Every number here comes from /api/x/o/witnesses and
// /api/open/checkpoint at page load; cosignatures are re-verified with WebCrypto (Ed25519) against the checkpoint they sign.
(function () {
  var te = new TextEncoder(), LOGKEY = 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function b64(s) { var r = atob(s), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a; }
  function put(id, h) { var e = document.getElementById(id); if (e) e.innerHTML = h; }
  function ago(t) { if (!t) return ''; var s = (Date.now() - new Date(t)) / 1000; if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' d ago'; }
  function sha(b) { return crypto.subtle.digest('SHA-256', b).then(function (d) { return new Uint8Array(d); }); }
  function cat(a, b) { var o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }
  // C2SP tlog-cosignature (Ed25519): key hash = SHA-256(name || 0x0A || 0x04 || key)[:4]; signed: "cosignature/v1\ntime T\n" + checkpoint body
  function verifyCosig(line, body, pubB64) {
    try {
      var m = line.match(/^— (\S+) (\S+)$/); if (!m) return Promise.resolve(false);
      var blob = b64(m[2]), pub = b64(pubB64); if (blob.length !== 76) return Promise.resolve(false);
      var ts = 0; for (var i = 4; i < 12; i++) ts = ts * 256 + blob[i];
      return sha(cat(te.encode(m[1] + '\n'), cat(new Uint8Array([4]), pub))).then(function (kh) {
        for (var j = 0; j < 4; j++) if (kh[j] !== blob[j]) return false;
        return crypto.subtle.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']).then(function (k) {
          return crypto.subtle.verify({ name: 'Ed25519' }, k, blob.slice(12), te.encode('cosignature/v1\ntime ' + ts + '\n' + body));
        });
      });
    } catch (e) { return Promise.resolve(false); }
  }
  var cpP = fetch('/api/open/checkpoint', { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; });
  var wP = fetch('/api/x/o/witnesses', { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return null; });
  Promise.all([cpP, wP]).then(function (a) {
    var note = a[0], d = a[1], body = note ? note.slice(0, note.indexOf('\n\n') + 1) : '', L = body.split('\n'), size = +L[1], root = L[2];
    var cpOk = note && window.KV ? KV.verifyCheckpoint(note, LOGKEY) : Promise.resolve({ ok: false });
    cpOk.then(function (c) {
      put('wt-cp', note ? '<p style="margin:0 0 8px"><span class="lg-ok' + (c.ok ? '' : ' lg-bad') + '">' + (c.ok ? 'Signature valid' : 'Signature not checked') + '</span> Current checkpoint: <b>' + size + '</b> daily lines, root <span class="lg-h">' + esc(root) + '</span></p><pre>' + esc(note) + '</pre>' : '<p style="margin:0">The checkpoint could not be loaded just now.</p>');
    });
    if (!d) { put('wt-sum', '<p style="margin:0">The witness list could not be loaded just now.</p>'); return; }
    var W = d.witnesses || [], ext = W.filter(function (w) { return !w.ours; }), ours = W.filter(function (w) { return w.ours; });
    var cur = W.filter(function (w) { return w.last_size === size && w.last_root === root; }).length;
    put('wt-sum', '<div class="wt-n"><div><b>' + ext.length + '</b><span>external witness' + (ext.length === 1 ? '' : 'es') + (ext.length ? '' : ' yet') + '</span></div><div><b>' + (ours.length ? 'Signing' : 'Not yet') + '</b><span>Kolaboro\'s own witness</span></div><div><b>' + cur + '</b><span>cosignature' + (cur === 1 ? '' : 's') + ' of the current checkpoint</span></div></div>' +
      (d.state === 'setup' ? '<p class="wt-note"><b>Registration opens soon.</b> The verification endpoint is live: a submitted cosignature is checked (key hash, signature, time, and that it signs exactly our tree) and the answer says whether it would be accepted, but nothing is stored until the witness table is created. Then the first witnesses appear here.</p>' : '') +
      (!ours.length ? '<p class="wt-note">Kolaboro\'s own witness (a daily GitHub Actions job, outside Cloudflare and our database) is written and scheduled, but has not signed anything yet: it starts once its private key is added as a repository secret. Until then it signs nothing rather than pretending.</p>' : ''));
    if (!W.length) { put('wt-list', '<p style="margin:0">No witnesses yet. Be the first: the kit below takes about five minutes.</p>'); return; }
    put('wt-list', '<table class="lg-t"><thead><tr><th>Witness</th><th>Since</th><th>Last cosigned</th><th>Cosignatures</th><th>Check</th></tr></thead><tbody>' + W.map(function (w, i) {
      return '<tr><td><b>' + esc(w.name) + '</b>' + (w.ours ? ' <span class="lg-ok">Kolaboro</span>' : '') + (w.contact ? '<br><a href="' + esc(w.contact) + '" rel="nofollow noopener" target="_blank">' + esc(w.contact.replace(/^https:\/\//, '').slice(0, 60)) + '</a>' : '') + '<br><span class="lg-h">key ' + esc(w.public_key) + '</span></td><td>' + esc(String(w.first_seen || '').slice(0, 10)) + '</td><td>tree size ' + esc(w.last_size) + '<br>' + esc(ago(w.last_at)) + '</td><td>' + esc(w.cosignatures) + '</td><td id="wt-v' + i + '">…</td></tr>';
    }).join('') + '</tbody></table>');
    W.forEach(function (w, i) {
      if (w.last_size !== size || w.last_root !== root) { put('wt-v' + i, '<span class="muted">signed an earlier size</span>'); return; }
      verifyCosig(w.last_line || '', body, w.public_key).then(function (ok) { put('wt-v' + i, '<span class="lg-ok' + (ok ? '' : ' lg-bad') + '">' + (ok ? 'Valid on the current checkpoint' : 'Does not verify') + '</span>'); });
    });
  });
})();
