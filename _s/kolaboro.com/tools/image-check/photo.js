/* Developer photo check (batch 10, b10a). For construction photos a buyer received from a developer or agent:
   - EXIF: when the photo says it was taken, the camera or phone, editing software, and the GPS position if recorded;
   - distance from the GPS position to the project's public market point (one point per market, /api/kb/lookup/points),
     or to coordinates the buyer types (for example the pin on the developer's own map);
   - kdh1 perceptual hash (/tools/image-check/kdh.js) compared with the hashes of images on tracked project pages
     (/data/image-hashes.json), to catch a photo reused from another project, and with the other photos in the same batch.
   Everything runs in the browser. The photos are never uploaded: the only requests are GETs of the public points list,
   the public hash index and kdh.js. KBPHOTO.box(el) renders the tool into el; [data-kbphoto] elements are filled on load. */
(function (G) {
  'use strict';
  if (G.KBPHOTO) return;
  var KDH_JS = '/tools/image-check/kdh.js?v=5f938f5db4', LIM = 10;
  var pts = null, idx = null, kdhP = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function css() {
    if (document.getElementById('kbph-css')) return;
    var s = document.createElement('style'); s.id = 'kbph-css';
    s.textContent = '.kph{display:grid;gap:12px}.kph label{font-weight:700;display:block;margin-bottom:6px}.kph input,.kph select{min-height:44px;font:inherit;max-width:100%;border:1.5px solid var(--line,#D8D6CE);border-radius:10px;padding:8px 10px;background:var(--card,#fff);color:var(--ink,#111)}' +
      '.kph input[type=file]{border-style:dashed;width:100%}.kph-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.kph-row input,.kph-row select{width:100%}.kph-m{font-size:.86rem;color:var(--muted,#666);margin:4px 0 0}' +
      '.kph-c{display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;border:1px solid var(--line,#D8D6CE);border-radius:12px;padding:12px;background:var(--card,#fff)}.kph-c img{width:96px;height:96px;object-fit:cover;border-radius:8px;background:var(--paper,#f4f2ec)}' +
      '.kph-c h3{font-size:.98rem;margin:0 0 4px;overflow-wrap:anywhere}.kph-c ul{list-style:none;margin:0;padding:0;display:grid;gap:4px;font-size:.92rem}.kph-c li{padding-left:18px;position:relative;overflow-wrap:anywhere}' +
      '.kph-c li::before{content:"";position:absolute;left:2px;top:.5em;width:9px;height:9px;border-radius:50%;background:var(--line,#ccc)}.kph-c li.look::before{background:#B42318}.kph-c li.note::before{background:#B7791F}.kph-c li.ok::before{background:#0B7A55}' +
      '.kph-sum{border:1.5px solid var(--ink,#111);border-radius:12px;padding:12px 14px}.kph-sum b{display:block}@media(max-width:640px){.kph-row{grid-template-columns:1fr}.kph-c{grid-template-columns:64px minmax(0,1fr)}.kph-c img{width:64px;height:64px}}';
    document.head.appendChild(s);
  }
  // ---------- EXIF (JPEG APP1, PNG eXIf, WebP EXIF) ----------
  function exifOf(u8) {
    var r = {}, v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), tiffAt = -1;
    if (u8[0] === 0xFF && u8[1] === 0xD8) {
      for (var p = 2; p + 4 < u8.length;) {
        if (u8[p] !== 0xFF) { p++; continue; }
        var mk = u8[p + 1]; if (mk === 0xD9 || mk === 0xDA) break;
        var len = v.getUint16(p + 2);
        if (mk === 0xE1 && u8[p + 4] === 0x45 && u8[p + 5] === 0x78 && u8[p + 6] === 0x69 && u8[p + 7] === 0x66) { tiffAt = p + 10; break; }
        p += 2 + len;
      }
    } else if (u8[0] === 0x89 && u8[1] === 0x50) {
      for (var q = 8; q + 8 < u8.length;) { var l = v.getUint32(q), t = String.fromCharCode(u8[q + 4], u8[q + 5], u8[q + 6], u8[q + 7]); if (t === 'eXIf') { tiffAt = q + 8; break; } if (t === 'IEND') break; q += 12 + l; }
    } else if (u8[0] === 0x52 && u8[1] === 0x49 && u8[8] === 0x57 && u8[9] === 0x45) {
      for (var w = 12; w + 8 < u8.length;) { var tw = String.fromCharCode(u8[w], u8[w + 1], u8[w + 2], u8[w + 3]), lw = v.getUint32(w + 4, true); if (tw === 'EXIF') { tiffAt = w + 8 + (u8[w + 8] === 0x45 && u8[w + 9] === 0x78 ? 6 : 0); break; } w += 8 + lw + (lw & 1); }
    }
    if (tiffAt < 0 || tiffAt + 8 > u8.length) return r;
    var le = u8[tiffAt] === 0x49;
    function u16(o) { return v.getUint16(tiffAt + o, le); } function u32(o) { return v.getUint32(tiffAt + o, le); }
    function val(type, cnt, off) {
      var sz = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }[type] || 1, at = sz * cnt > 4 ? u32(off) : off, i, o = [];
      if (tiffAt + at + sz * cnt > u8.length) return null;
      if (type === 2) { var s = ''; for (i = 0; i < cnt; i++) { var ch = u8[tiffAt + at + i]; if (!ch) break; s += String.fromCharCode(ch); } return s.trim(); }
      for (i = 0; i < cnt && i < 16; i++) {
        if (type === 3) o.push(u16(at + 2 * i)); else if (type === 4) o.push(u32(at + 4 * i)); else if (type === 9) o.push(v.getInt32(tiffAt + at + 4 * i, le));
        else if (type === 5 || type === 10) { var n = type === 5 ? u32(at + 8 * i) : v.getInt32(tiffAt + at + 8 * i, le), d = type === 5 ? u32(at + 8 * i + 4) : v.getInt32(tiffAt + at + 8 * i + 4, le); o.push(d ? n / d : 0); }
        else o.push(u8[tiffAt + at + i]);
      }
      return cnt === 1 ? o[0] : o;
    }
    function ifd(off, map, out, depth) {
      if (!off || off + 2 > u8.length - tiffAt || depth > 3) return;
      var n = u16(off); if (n > 500) return;
      for (var k = 0; k < n; k++) {
        var e = off + 2 + 12 * k; if (tiffAt + e + 12 > u8.length) return;
        var tag = u16(e), type = u16(e + 2), cnt = u32(e + 4), name = map[tag];
        if (tag === 0x8769) ifd(u32(e + 8), EXIF, out, depth + 1);
        else if (tag === 0x8825) ifd(u32(e + 8), GPS, out, depth + 1);
        else if (name) { try { out[name] = val(type, cnt, e + 8); } catch (x) {} }
      }
    }
    var IFD0 = { 0x010F: 'Make', 0x0110: 'Model', 0x0131: 'Software', 0x0132: 'DateTime' };
    var EXIF = { 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized', 0x9011: 'OffsetTimeOriginal', 0xA434: 'LensModel', 0xA002: 'PixelX', 0xA003: 'PixelY' };
    var GPS = { 0x0001: 'GPSLatitudeRef', 0x0002: 'GPSLatitude', 0x0003: 'GPSLongitudeRef', 0x0004: 'GPSLongitude', 0x0007: 'GPSTimeStamp', 0x001D: 'GPSDateStamp', 0x0010: 'GPSImgDirectionRef', 0x0011: 'GPSImgDirection' };
    try { ifd(u32(4), IFD0, r, 0); } catch (x) {}
    function deg(a, ref) { if (!a || a.length < 3) return null; var d = a[0] + a[1] / 60 + a[2] / 3600; return /[SW]/.test(ref || '') ? -d : d; }
    var la = deg(r.GPSLatitude, r.GPSLatitudeRef), lo = deg(r.GPSLongitude, r.GPSLongitudeRef);
    if (la != null && lo != null && isFinite(la) && isFinite(lo) && !(la === 0 && lo === 0) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) { r.lat = la; r.lng = lo; }
    return r;
  }
  function exifDate(s) { var m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s || ''); return m && +m[1] > 1990 ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0))) : null; }
  function km(a, b, c, d) { var R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2), h = x * x + Math.cos(a * r) * Math.cos(c * r) * y * y; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))); }
  var EDITORS = /photoshop|lightroom|snapseed|gimp|picsart|canva|facetune|vsco|meitu|pixlr|affinity|luminar|capture one|remini|midjourney|dall|stable diffusion|firefly|generative/i;
  // ---------- loaders ----------
  function getPts() { if (!pts) pts = fetch('/api/kb/lookup/points').then(function (r) { if (!r.ok) throw new Error('pts'); return r.json(); }).catch(function (e) { pts = null; throw e; }); return pts; }
  function getKdh() { if (G.KDH) return Promise.resolve(G.KDH); if (!kdhP) kdhP = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = KDH_JS; s.onload = function () { ok(G.KDH); }; s.onerror = function () { kdhP = null; no(new Error('kdh')); }; document.head.appendChild(s); }); return kdhP; }
  function getIdx() {
    if (!idx) idx = Promise.all([getKdh(), fetch('/data/image-hashes.json?d=' + new Date().toISOString().slice(0, 10)).then(function (r) { if (!r.ok) throw new Error('idx'); return r.json(); })])
      .then(function (x) { var K = x[0], j = x[1]; j.split = j.items.map(function (it) { return [K.split(it[2]), it[3] ? K.split(it[3]) : null]; }); return j; }).catch(function (e) { idx = null; throw e; });
    return idx;
  }
  function matches(K, j, q) {
    var Q = { h: K.split(q.h), c: K.split(q.c), f: K.split(q.f) }, best = {};
    for (var i = 0; i < j.items.length; i++) {
      var s = j.split[i], d = K.dist(Q.h, s[0]);
      if (s[1]) d = Math.min(d, K.dist(Q.h, s[1]) + 1); d = Math.min(d, K.dist(Q.c, s[0]) + 1, K.dist(Q.f, s[0]) + 1);
      if (d <= LIM) { var id = j.items[i][0]; if (best[id] == null || d < best[id]) best[id] = d; }
    }
    return Object.keys(best).map(function (k) { return { id: k, d: best[k] }; }).sort(function (a, b) { return a.d - b.d; });
  }
  // ---------- UI ----------
  function box(el) {
    css();
    var u = 'kph' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = '<div class="kph"><div><label for="' + u + 'f">Construction photos you received (JPG, PNG or WebP, several at once)</label><input type="file" id="' + u + 'f" accept="image/jpeg,image/png,image/webp" multiple>' +
      '<p class="kph-m">Use the original file (email attachment, AirDrop, Google Drive). WhatsApp, Telegram and most social apps strip the date and GPS, so photos from them show nothing here.</p></div>' +
      '<div class="kph-row"><div><label for="' + u + 'p">Project (for the distance check)</label><input id="' + u + 'p" list="' + u + 'l" placeholder="Type a project or market name" autocomplete="off"><datalist id="' + u + 'l"></datalist></div>' +
      '<div><label for="' + u + 'c">Or the project location (lat, lng)</label><input id="' + u + 'c" inputmode="decimal" placeholder="-8.6478, 115.1385" autocomplete="off"></div></div>' +
      '<div class="kph-row"><div><label for="' + u + 'd">Date the developer gave for these photos (optional)</label><input type="date" id="' + u + 'd"></div><div></div></div>' +
      '<p class="kph-m" id="' + u + 's" aria-live="polite">Nothing is uploaded: the photos are read on this device.</p><div class="kph" id="' + u + 'o"></div></div>';
    var F = el.querySelector('#' + u + 'f'), P = el.querySelector('#' + u + 'p'), DL = el.querySelector('#' + u + 'l'), C = el.querySelector('#' + u + 'c'), D = el.querySelector('#' + u + 'd'), S = el.querySelector('#' + u + 's'), O = el.querySelector('#' + u + 'o');
    var files = [], urls = [];
    getPts().then(function (j) {
      var h = '';
      Object.keys(j.markets).sort().forEach(function (m) { h += '<option value="' + esc(m) + ' (market)"></option>'; });
      j.projects.forEach(function (p) { h += '<option value="' + esc(p[1]) + ' · ' + esc(p[2]) + '"></option>'; });
      DL.innerHTML = h;
      try { var qp = new URLSearchParams(location.search).get('project'); if (qp) { var pr = j.projects.filter(function (p) { return p[0] === qp; })[0]; if (pr) P.value = pr[1] + ' · ' + pr[2]; } } catch (e) {}
    }).catch(function () {});
    function target() {
      var m = String(C.value).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
      if (m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180) return Promise.resolve({ lat: +m[1], lng: +m[2], label: 'the location you typed', exact: true });
      var v = String(P.value).trim(); if (!v) return Promise.resolve(null);
      return getPts().then(function (j) {
        var mk = null, nm = null, mm = /^(.*) \(market\)$/.exec(v), pm = /^(.*) · ([^·]+)$/.exec(v);
        if (mm && j.markets[mm[1]]) mk = mm[1];
        else if (pm) { var pr = j.projects.filter(function (p) { return p[1] === pm[1] && p[2] === pm[2]; })[0]; if (pr) { mk = pr[2]; nm = pr[1]; } }
        else { var lv = v.toLowerCase(), pr2 = j.projects.filter(function (p) { return p[1].toLowerCase() === lv; })[0]; if (pr2) { mk = pr2[2]; nm = pr2[1]; } else Object.keys(j.markets).forEach(function (k) { if (k.toLowerCase() === lv) mk = k; }); }
        if (!mk) return null;
        var p = j.markets[mk];
        return { lat: p.lat, lng: p.lng, label: 'the public point of the ' + mk + ' market (' + p.place + ')' + (nm ? ', where ' + nm + ' is listed' : ''), exact: false, src: p.src };
      }).catch(function () { return null; });
    }
    function run() {
      if (!files.length) return;
      urls.forEach(function (x) { URL.revokeObjectURL(x); }); urls = [];
      S.textContent = 'Reading ' + plural(files.length, 'photo') + ' on this device...';
      var claim = D.value ? new Date(D.value + 'T12:00:00Z') : null;
      Promise.all([target(), getIdx().catch(function () { return null; }), getKdh().catch(function () { return null; })]).then(function (x) {
        var tg = x[0], j = x[1], K = x[2];
        return Promise.all(files.map(function (f) {
          return f.arrayBuffer().then(function (b) {
            var u8 = new Uint8Array(b), ex = {}; try { ex = exifOf(u8); } catch (e) {}
            var hp = K ? K.fromBlob(f).catch(function () { return null; }) : Promise.resolve(null);
            return hp.then(function (q) { return { f: f, ex: ex, q: q }; });
          });
        })).then(function (rs) { render(rs, tg, j, K, claim); });
      }).catch(function () { S.textContent = 'The photos could not be read in this browser.'; });
    }
    function render(rs, tg, j, K, claim) {
      var h = '', flags = 0, now = Date.now();
      rs.forEach(function (r, i) {
        var ex = r.ex, L = [], dt = exifDate(ex.DateTimeOriginal || ex.DateTimeDigitized), mod = exifDate(ex.DateTime);
        if (dt) {
          var age = Math.round((now - dt.getTime()) / 864e5);
          L.push([age > 90 ? 'note' : 'ok', 'Taken ' + dt.toISOString().slice(0, 16).replace('T', ' ') + (ex.OffsetTimeOriginal ? ' (' + ex.OffsetTimeOriginal + ')' : ' (camera local time)') + ', ' + (age < 1 ? 'today' : plural(age, 'day') + ' ago') + '.']);
          if (claim) { var dd = Math.round((claim.getTime() - dt.getTime()) / 864e5); if (Math.abs(dd) > 14) { flags++; L.push(['look', 'The camera date is ' + plural(Math.abs(dd), 'day') + (dd > 0 ? ' before' : ' after') + ' the date you were given for these photos. Ask the developer to explain.']); } else L.push(['ok', 'Within two weeks of the date you were given.']); }
          else if (age > 90) L.push(['note', 'Older than three months: if it was sent as current progress, ask for a dated photo.']);
          if (mod && Math.abs(mod - dt) > 864e5) L.push(['note', 'The file was saved again on ' + mod.toISOString().slice(0, 10) + ', after it was taken (edited or exported).']);
        } else L.push(['note', 'No capture date in the file. It was stripped (messaging apps, screenshots, many editors) or never recorded.']);
        if (ex.Make || ex.Model) L.push(['info', 'Camera: ' + (ex.Make && ex.Model && String(ex.Model).toLowerCase().indexOf(String(ex.Make).toLowerCase()) === 0 ? ex.Model : [ex.Make, ex.Model].filter(Boolean).join(' ')) + (ex.LensModel ? ', ' + ex.LensModel : '') + '.']);
        if (ex.Software) { var ed = EDITORS.test(ex.Software); if (ed) flags++; L.push([ed ? 'look' : 'info', 'Software: ' + ex.Software + (ed ? ' (an editing or image-generation tool).' : '.')]); }
        if (ex.lat != null) {
          var gp = ex.lat.toFixed(5) + ', ' + ex.lng.toFixed(5), osm = 'https://www.openstreetmap.org/?mlat=' + ex.lat.toFixed(5) + '&mlon=' + ex.lng.toFixed(5) + '#map=17/' + ex.lat.toFixed(5) + '/' + ex.lng.toFixed(5);
          if (tg) {
            var dk = km(ex.lat, ex.lng, tg.lat, tg.lng), dtx = dk < 1 ? Math.round(dk * 1000) + ' m' : (dk < 10 ? dk.toFixed(1) : Math.round(dk)) + ' km';
            var lvl = tg.exact ? (dk <= 0.5 ? 'ok' : dk <= 3 ? 'note' : 'look') : (dk <= 30 ? 'ok' : dk <= 150 ? 'note' : 'look'); if (lvl === 'look') flags++;
            L.push([lvl, 'GPS ' + gp + ' (<a href="' + osm + '" target="_blank" rel="noopener">map</a>): ' + dtx + ' from ' + esc(tg.label) + '. ' +
              (tg.exact ? (lvl === 'ok' ? 'Taken at or next to that spot.' : lvl === 'note' ? 'Near, but not at, that spot.' : 'Taken somewhere else.') :
                (lvl === 'ok' ? 'Consistent with the market area (the point is a town, not the plot).' : lvl === 'note' ? 'Outside the market town; could still be in the wider region.' : 'Far from this market: the photo was probably taken somewhere else.')), true]);
          } else L.push(['info', 'GPS ' + gp + ' (<a href="' + osm + '" target="_blank" rel="noopener">map</a>). Choose the project above to measure the distance.', true]);
        } else L.push(['info', 'No GPS position in the file.']);
        if (r.q && j) {
          var mt = matches(K, j, r.q);
          if (mt.length) { flags++; L.push(['look', 'The same picture appears on ' + plural(mt.length, 'other tracked project') + ': ' + mt.slice(0, 5).map(function (m) { return '<a href="/p/' + encodeURIComponent(m.id) + '/">' + esc(m.id) + '</a> (' + m.d + ' of 64 bits differ)'; }).join(', ') + '. A real progress photo of one site should not show up elsewhere.', true]); }
          else L.push(['ok', 'Not found among ' + j.images.toLocaleString('en-US') + ' images of ' + j.cases + ' tracked projects.']);
          rs.forEach(function (o, k) { if (k < i && o.q && K.dist(K.split(o.q.h), K.split(r.q.h)) <= 4) { flags++; L.push(['look', 'Same picture as photo ' + (k + 1) + ' in this batch.']); } });
        } else if (!r.q) L.push(['info', 'This browser could not decode the image to compare it.']);
        var url = URL.createObjectURL(r.f); urls.push(url);
        h += '<article class="kph-c"><img src="' + url + '" alt="Photo ' + (i + 1) + ' (shown from your device)"><div><h3>' + (i + 1) + '. ' + esc(r.f.name) + '</h3><ul>' + L.map(function (l) { return '<li class="' + l[0] + '">' + (l[2] ? l[1] : esc(l[1])) + '</li>'; }).join('') + '</ul></div></article>';
      });
      var sum = '<div class="kph-sum"><b>' + (flags ? plural(flags, 'point') + ' to ask the developer about' : 'Nothing in these files contradicts what you were told') + '</b><p class="kph-m">' +
        'Metadata can be removed or rewritten, so a clean result is not proof the photos are recent or from the site, and a flag is not proof of deceit. For certainty, our local agent takes GPS-stamped photos on site.' +
        (tg && !tg.exact ? ' Market point source: ' + esc(tg.src || 'Natural Earth / GeoNames') + '.' : '') + '</p></div>';
      O.innerHTML = sum + h;
      S.textContent = 'Checked ' + plural(rs.length, 'photo') + ' on this device. Nothing was uploaded.';
    }
    F.addEventListener('change', function () { files = [].slice.call(F.files || [], 0, 20); run(); });
    [P, C, D].forEach(function (x) { x.addEventListener('change', run); });
  }
  G.KBPHOTO = { box: box, exif: exifOf };
  [].forEach.call(document.querySelectorAll('[data-kbphoto]'), box);
})(window);
