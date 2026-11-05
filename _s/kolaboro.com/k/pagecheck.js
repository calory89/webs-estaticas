/*! Kolaboro "Verify this page": checks, in this browser, that the HTML of a page and every same-origin script and stylesheet
 *  it loads are byte for byte the files we published, using the signed site manifest at /api/x/n/manifest.
 *  The manifest (path -> SHA-256) is made by a GitHub Actions job from the git commit the live site serves, and signed with
 *  the same Ed25519 key as the open API (checked here with KBVerify from /k/verify-badge.js).
 *  HTML normalization, exactly (the only changes made between our files and your browser, all reversed before hashing):
 *   1. nonce="..." removed from <script> tags (the worker stamps a fresh CSP nonce on each response);
 *   2. Cloudflare email obfuscation reversed: /cdn-cgi/l/email-protection#<hex> back to mailto:<address>, the
 *      <span class="__cf_email__"> placeholder back to the address, and the injected email-decode.min.js script removed;
 *   3. scripts appended by the worker with src under /__k/ removed (only on /admin and one campaign landing);
 *   4. only if the hash does not match yet: the Google Analytics snippet right before </head> and the Microsoft Clarity
 *      snippet right before </body> are removed, because the deploy adds them to the few pages whose source has none.
 *  What it proves: the bytes you received match what we published. It does not prove our code is correct or safe.
 *  KBPageCheck.run(path, el)  KBPageCheck.dialog(openerEl)  KBPageCheck.normalize(html) -> { html, steps }
 */
(function () {
  if (window.KBPageCheck) return;
  var te = new TextEncoder(), VB = '/k/verify-badge.js?v=6b61413c9f', MAN = '/api/x/n/manifest';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(bytes) { return crypto.subtle.digest('SHA-256', bytes).then(hex); }
  function verifier() {
    if (window.KBVerify) return Promise.resolve(window.KBVerify);
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = VB; s.onload = function () { ok(window.KBVerify); }; s.onerror = no; document.head.appendChild(s); });
  }
  function cfDecode(h) { var k = parseInt(h.substr(0, 2), 16), b = []; for (var i = 2; i < h.length; i += 2) b.push(parseInt(h.substr(i, 2), 16) ^ k); return new TextDecoder().decode(new Uint8Array(b)); }
  function normalize(html) {
    var steps = [], n;
    n = 0; html = html.replace(/(<script\b[^>]*?) nonce="[A-Za-z0-9+\/=]*"/g, function (_, a) { n++; return a; }); if (n) steps.push(n + ' script nonce attribute' + (n === 1 ? '' : 's') + ' removed');
    n = 0; html = html.replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g, function (_, h) { n++; return cfDecode(h); });
    html = html.replace(/href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/g, function (_, h) { n++; return 'href="mailto:' + cfDecode(h) + '"'; });
    html = html.replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/span>/g, function (_, h) { n++; return cfDecode(h); });
    if (n) steps.push(n + ' Cloudflare email obfuscation' + (n === 1 ? '' : 's') + ' reversed');
    n = 0; html = html.replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[0-9a-f]+\/cloudflare-static\/email-decode\.min\.js"><\/script>/g, function () { n++; return ''; }); if (n) steps.push('Cloudflare email-decode script removed');
    n = 0; html = html.replace(/<script\b[^>]*\ssrc="\/__k\/[^"]*"[^>]*><\/script>/g, function () { n++; return ''; }); if (n) steps.push(n + ' worker-appended /__k/ script' + (n === 1 ? '' : 's') + ' removed');
    return { html: html, steps: steps };
  }
  var GA = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V"></script><script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};gtag(\'js\',new Date());gtag(\'config\',\'G-FJKJE77K4V\');</script>';
  var CL = '<script>if(!window.clarity)(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","z4eqcmaic7");</script>';
  // step 4: the variants without the analytics snippets the deploy adds to pages that have none, tried only after a mismatch
  function variants(html) {
    var out = [], g = html.indexOf(GA + '</head>') >= 0, c = html.lastIndexOf(CL + '</body>') >= 0;
    function noG(h) { return h.replace(GA + '</head>', '</head>'); }
    function noC(h) { var i = h.lastIndexOf(CL + '</body>'); return h.slice(0, i) + h.slice(i + CL.length); }
    if (g) out.push({ html: noG(html), step: 'Google Analytics snippet added at deploy removed' });
    if (c) out.push({ html: noC(html), step: 'Clarity snippet added at deploy removed' });
    if (g && c) out.push({ html: noC(noG(html)), step: 'Google Analytics and Clarity snippets added at deploy removed' });
    return out;
  }
  function fileFor(path, files) {
    var p = path.split('?')[0].split('#')[0]; try { p = decodeURIComponent(p); } catch (e) {}
    if (!p || p === '/') return '/index.html';
    if (/\/$/.test(p)) return p + 'index.html';
    if (files[p]) return p;
    if (files[p + '.html']) return p + '.html';
    return p + '/index.html';
  }
  var SSR = /^\/(p\/[A-Za-z0-9-]{3,20}|m\/[^/.]{2,60})\/?$/;
  function assets(html, base, here) {
    var doc = new DOMParser().parseFromString(html, 'text/html'), out = {}, skipped = {};
    function add(u, kind) {
      var x; try { x = new URL(u, base); } catch (e) { return; }
      if (x.origin !== location.origin) return;
      if (/^\/(cdn-cgi|__k|api)\//.test(x.pathname)) { skipped[x.pathname] = /^\/cdn-cgi\//.test(x.pathname) ? 'added by Cloudflare, not part of our files' : 'added by the worker on this response'; return; }
      if (!out[x.pathname]) out[x.pathname] = { url: x.pathname + x.search, kind: kind };
    }
    doc.querySelectorAll('script[src]').forEach(function (s) { add(s.getAttribute('src'), 'script'); });
    doc.querySelectorAll('link[href]').forEach(function (l) { var r = (l.getAttribute('rel') || '').toLowerCase(), as = (l.getAttribute('as') || '').toLowerCase(); if (/\bstylesheet\b/.test(r) || (/\bpreload\b/.test(r) && /^(style|script)$/.test(as)) || /\bmodulepreload\b/.test(r)) add(l.getAttribute('href'), /style/.test(r + as) ? 'style' : 'script'); });
    if (here && window.performance && performance.getEntriesByType) performance.getEntriesByType('resource').forEach(function (r) {
      if (/\.(m?js|css)(\?|$)/.test(r.name) || r.initiatorType === 'script' || r.initiatorType === 'css') { var x; try { x = new URL(r.name); } catch (e) { return; } if (/\.(m?js|css)$/.test(x.pathname)) add(r.name, /\.css$/.test(x.pathname) ? 'style' : 'script (loaded later)'); }
    });
    return { list: out, skipped: skipped };
  }
  function run(path, el, opts) {
    opts = opts || {};
    var here = path === location.pathname, t0 = performance.now();
    el.innerHTML = '<p class="kpc-s" aria-live="polite">Fetching the signed manifest…</p>';
    var st = el.querySelector('.kpc-s');
    return verifier().catch(function () { return null; }).then(function (V) {
      if (!V) throw new Error('The signature checker (/k/verify-badge.js) did not load.');
      return Promise.all([V.fetchSigned(MAN, { cache: 'no-store', credentials: 'omit' }), fetch('/api/open/build', { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return {}; }), V]);
    }).then(function (a) {
      var M = a[0], live = a[1], V = a[2];
      if (!M.ok || !M.json || !M.json.files) {
        el.innerHTML = '<p class="kpc-bad"><b>The signed manifest is not published yet</b> (' + esc(M.status) + '). The job that writes it runs after each deploy. Nothing was checked, so nothing is shown as verified.</p>';
        return null;
      }
      var man = M.json, files = man.files;
      st.textContent = 'Fetching this page and its files again, without cache…';
      var url = path + (opts.search || ''), file = fileFor(path, files), ssr = SSR.test(path);
      return fetch(url, { cache: 'no-store', credentials: 'same-origin', redirect: 'follow' }).then(function (r) {
        return r.arrayBuffer().then(function (buf) { return { r: r, buf: buf }; });
      }).then(function (x) {
        var raw = new TextDecoder('utf-8', { ignoreBOM: true }).decode(x.buf), ct = x.r.headers.get('content-type') || '';
        if (!/html/.test(ct)) throw new Error(path + ' did not answer with an HTML page (' + (x.r.status) + ').');
        var N = normalize(raw), A = assets(raw, x.r.url, here), rows = [];
        rows.push({ path: file, kind: ssr ? 'page (server-rendered)' : 'page', bytes: te.encode(N.html), alt: ssr ? [] : variants(N.html), steps: N.steps, want: ssr ? null : files[file], note: ssr ? 'This page is assembled per request from ' + file + ' and live data, so its HTML cannot match a published file. Its scripts and styles are checked below.' : N.steps.length ? 'Normalized before hashing: ' + N.steps.join('; ') + '.' : 'No normalization needed.' });
        var keys = Object.keys(A.list);
        return Promise.all(keys.map(function (k) {
          return fetch(A.list[k].url, { cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.arrayBuffer().then(function (b) { return { path: k, kind: A.list[k].kind, bytes: b, want: files[k], status: r.status }; }); }, function () { return { path: k, kind: A.list[k].kind, bytes: null, want: files[k], err: 'could not be fetched' }; });
        })).then(function (more) {
          rows = rows.concat(more);
          return Promise.all(rows.map(function (rw) {
            if (!rw.bytes) return rw;
            return sha(rw.bytes).then(function (h) {
              rw.got = h;
              if (h === rw.want || !rw.alt || !rw.alt.length) return rw;
              return Promise.all(rw.alt.map(function (v) { return sha(te.encode(v.html)); })).then(function (hs) {
                var i = hs.indexOf(rw.want); if (i < 0) return rw;
                rw.got = hs[i]; rw.note = 'Normalized before hashing: ' + rw.steps.concat([rw.alt[i].step]).join('; ') + '.'; return rw;
              });
            });
          }));
        }).then(function (rows) {
          var ok = 0, bad = 0, none = 0;
          rows.forEach(function (rw) { rw.state = rw.err ? 'err' : rw.want == null ? 'none' : rw.got === rw.want ? 'ok' : 'bad'; if (rw.state === 'ok') ok++; else if (rw.state === 'bad') bad++; else none++; });
          var ms = Math.round(performance.now() - t0), stale = live.commit && man.commit && live.commit !== man.commit;
          el.innerHTML =
            '<div class="kpc-sum ' + (bad ? 'kpc-bad' : ok ? 'kpc-ok' : '') + '"><b>' + (bad ? bad + ' of ' + (ok + bad) + ' files do not match' : ok ? 'All ' + ok + ' checked files match' : 'Nothing could be matched') + '</b> the manifest' + (none ? ', ' + none + ' not covered' : '') + '. Checked in ' + ms + ' ms in this browser.</div>' +
            '<p class="kpc-m">Manifest: ' + man.count + ' files at commit <code>' + esc(String(man.commit).slice(0, 12)) + '</code>, made ' + esc(String(man.generated_at).replace('T', ' ').replace('Z', ' UTC')) + '. Live site: commit <code>' + esc(String(live.commit || 'unknown').slice(0, 12)) + '</code>. <span class="kpc-sig"></span></p>' +
            (stale ? '<p class="kpc-m">The live commit is newer than the manifest. That is normal: data publishes create commits too, and the manifest only changes when a published file outside /data/ changes. ' + (bad ? 'A file changed in a deploy after the manifest was made shows as a mismatch until the next manifest run (about every 30 minutes).' : '') + '</p>' : '') +
            '<div class="kpc-tw"><table class="kpc-t"><thead><tr><th>File</th><th>Result</th><th>SHA-256 you received</th></tr></thead><tbody>' + rows.map(function (rw) {
              var lab = rw.state === 'ok' ? '<span class="kpc-y">Match</span>' : rw.state === 'bad' ? '<span class="kpc-n">Mismatch</span>' : rw.state === 'err' ? '<span class="kpc-n">Not fetched</span>' : '<span class="kpc-u">Not in manifest</span>';
              return '<tr><td><code>' + esc(rw.path) + '</code><br><small>' + esc(rw.kind) + (rw.note ? ': ' + esc(rw.note) : '') + '</small></td><td>' + lab + (rw.state === 'bad' ? '<br><small>expected <code>' + esc(String(rw.want).slice(0, 16)) + '…</code></small>' : '') + '</td><td><code>' + esc(rw.got ? rw.got.slice(0, 16) + '…' : '') + '</code></td></tr>';
            }).join('') + Object.keys(A.skipped).map(function (k) { return '<tr><td><code>' + esc(k) + '</code></td><td><span class="kpc-u">Not ours</span></td><td><small>' + esc(A.skipped[k]) + '</small></td></tr>'; }).join('') + '</tbody></table></div>' +
            '<p class="kpc-m"><b>What this proves:</b> the bytes your browser received are the bytes we published at that commit. <b>What it does not prove:</b> that our code is correct or safe, or anything about third-party scripts (analytics) and data loaded later from /data/ or the API, which are signed and logged separately. Signed manifest: <a href="' + MAN + '">' + MAN + '</a>.</p>';
          V.badge(el.querySelector('.kpc-sig'), M.check, { what: 'the site manifest' });
          return { ok: ok, bad: bad, none: none, rows: rows, manifest: man.commit, live: live.commit };
        });
      });
    }).catch(function (e) { el.innerHTML = '<p class="kpc-bad"><b>The check could not run.</b> ' + esc((e && e.message) || 'network error') + ' Nothing is shown as verified.</p>'; return null; });
  }
  var CSS = '.kpc-sum{padding:10px 12px;border-radius:10px;background:#EEF0F2;margin:0 0 8px}.kpc-sum.kpc-ok{background:#DDEFE7;color:#075E41}.kpc-sum.kpc-bad,p.kpc-bad{background:#FDE6DC;color:#8F2D04;padding:10px 12px;border-radius:10px}' +
    '.kpc-m{font-size:.82rem;color:#4A5661;margin:8px 0}.kpc-m code,.kpc-t code{font:500 .74rem/1.4 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}.kpc-tw{overflow-x:auto;max-width:100%}' +
    '.kpc-t{width:100%;border-collapse:collapse;font-size:.8rem}.kpc-t th,.kpc-t td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid rgba(23,33,43,.1)}.kpc-t small{color:#4A5661}' +
    '.kpc-y{color:#075E41;font-weight:700}.kpc-n{color:#8F2D04;font-weight:700}.kpc-u{color:#4A5661;font-weight:700}' +
    '.kpc-dlg{position:fixed;inset:0;z-index:70;background:rgba(23,33,43,.45);display:flex;align-items:flex-start;justify-content:center;padding:6vh 12px}' +
    '.kpc-box{position:relative;width:min(760px,100%);max-height:88vh;overflow:auto;background:#fff;color:#17212B;border-radius:16px;padding:20px 20px 16px;box-shadow:0 24px 60px rgba(23,33,43,.3);font:500 .9rem/1.5 Archivo,system-ui,sans-serif}' +
    '.kpc-box h2{font:800 1.15rem/1.25 Archivo,system-ui,sans-serif;margin:0 36px 10px 0}.kpc-box:focus{outline:none}.kpc-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;font:700 1.3rem/1 system-ui;cursor:pointer;color:#4A5661}.kpc-x:hover{background:#F2F3F1}.kpc-x:focus-visible{outline:3px solid #FF5B14}' +
    '@media (max-width:520px){.kpc-t th:nth-child(3),.kpc-t td:nth-child(3){display:none}}';
  function css() { if (document.getElementById('kpc-css')) return; var s = document.createElement('style'); s.id = 'kpc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function dialog(opener) {
    css();
    var d = document.createElement('div'); d.className = 'kpc-dlg';
    d.innerHTML = '<div class="kpc-box" role="dialog" aria-modal="true" aria-labelledby="kpc-h" tabindex="-1"><button type="button" class="kpc-x" aria-label="Close">×</button><h2 id="kpc-h">Verify this page</h2><div class="kpc-out"></div><p class="kpc-m"><a href="/verify?page=' + encodeURIComponent(location.pathname) + '#page">Open on the verify page</a>, which explains each step.</p></div>';
    document.body.appendChild(d);
    var box = d.firstChild, prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    function close() { d.remove(); document.documentElement.style.overflow = prevOverflow; document.removeEventListener('keydown', key, true); if (opener) opener.focus(); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'Tab') { var f = box.querySelectorAll('a,button,[tabindex="0"],summary'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } }
    document.addEventListener('keydown', key, true);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    box.querySelector('.kpc-x').addEventListener('click', close);
    box.focus();
    return run(location.pathname, box.querySelector('.kpc-out'), { search: location.search });
  }
  window.KBPageCheck = { version: '1.0.0', run: run, dialog: dialog, normalize: normalize, variants: variants, fileFor: fileFor, css: css };
})();
