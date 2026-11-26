/* Kolaboro time-lapse maker (n19d, batch 19). Builds an animated GIF in the browser from the real satellite thumbnails already on the
   page (the named project time machine sprite, or the /satellite/plot/ quarters), with the date of each image and the Copernicus
   credit burned in, then shares it (Web Share with the file where the device supports it) or downloads it. Nothing is uploaded and
   nothing is stored on our servers. Own GIF89a encoder: median-cut palette (one for the whole animation) and LZW, no library.
   window.KTL.make(host, opts): host = a container element; opts = { frames:[{img, sx, sy, sw, sh, date, sub}], ring, credit, url,
   filename, title, L:{making, ready, share, dl, copy, copied, note, fail} } */
(function(){
  'use strict';
  if (window.KTL) return;
  var BAND = '#13222E', INK = '#FFFFFF', MUTED = '#B7C3CC', BRAND = '#FF5B14';
  function hex(h){ return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

  /* median cut over sampled pixels: returns up to k colours [[r,g,b],...] */
  function medianCut(px, k){
    var n = px.length / 3, idx = new Uint32Array(n); for (var i = 0; i < n; i++) idx[i] = i;
    var boxes = [{ a: 0, b: n }];
    function range(bx){
      var lo = [255, 255, 255], hi = [0, 0, 0];
      for (var i = bx.a; i < bx.b; i++) { var o = idx[i] * 3; for (var c = 0; c < 3; c++) { var v = px[o + c]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; } }
      var r = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], ch = r[0] >= r[1] && r[0] >= r[2] ? 0 : r[1] >= r[2] ? 1 : 2;
      bx.ch = ch; bx.r = r[ch]; return bx;
    }
    range(boxes[0]);
    while (boxes.length < k) {
      var best = -1, bs = 0;
      for (var j = 0; j < boxes.length; j++) { var s = boxes[j].r * Math.sqrt(boxes[j].b - boxes[j].a); if (boxes[j].b - boxes[j].a > 1 && s > bs) { bs = s; best = j; } }
      if (best < 0 || bs === 0) break;
      var bx = boxes[best], ch2 = bx.ch, sub = Array.prototype.slice.call(idx.subarray(bx.a, bx.b));
      sub.sort(function(x, y){ return px[x * 3 + ch2] - px[y * 3 + ch2]; });
      idx.set(sub, bx.a);
      var mid = bx.a + ((bx.b - bx.a) >> 1);
      boxes.splice(best, 1, range({ a: bx.a, b: mid }), range({ a: mid, b: bx.b }));
    }
    return boxes.map(function(bx){
      var s = [0, 0, 0], m = bx.b - bx.a;
      for (var i = bx.a; i < bx.b; i++) { var o = idx[i] * 3; s[0] += px[o]; s[1] += px[o + 1]; s[2] += px[o + 2]; }
      return [Math.round(s[0] / m), Math.round(s[1] / m), Math.round(s[2] / m)];
    });
  }

  /* GIF LZW (variable code size, 8 bit indices), returns the sub-blocked bytes */
  function lzw(ix){
    var out = [], cur = 0, shift = 0, min = 8, clear = 256, eoi = 257, size = 9, next = 258, table = new Map();
    function emit(code){ cur |= code << shift; shift += size; while (shift >= 8) { out.push(cur & 255); cur >>>= 8; shift -= 8; } }
    emit(clear);
    var code = ix[0];
    for (var i = 1; i < ix.length; i++) {
      var k = ix[i], key = code << 8 | k, c = table.get(key);
      if (c === undefined) {
        emit(code);
        if (next === 4096) { emit(clear); next = 258; size = 9; table = new Map(); }
        else { if (next >= (1 << size)) size++; table.set(key, next++); }
        code = k;
      } else code = c;
    }
    emit(code); emit(eoi);
    if (shift > 0) out.push(cur & 255);
    var blocks = [];
    for (var p = 0; p < out.length; p += 255) { var n = Math.min(255, out.length - p); blocks.push(n); for (var q = 0; q < n; q++) blocks.push(out[p + q]); }
    blocks.push(0);
    return new Uint8Array(blocks);
  }
  function u16(v){ return [v & 255, (v >> 8) & 255]; }
  function sub(bytes){ var b = []; for (var p = 0; p < bytes.length; p += 255) { var n = Math.min(255, bytes.length - p); b.push(n); for (var q = 0; q < n; q++) b.push(bytes[p + q]); } b.push(0); return b; }
  function ascii(s){ var o = []; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); o.push(c < 128 ? c : 63); } return o; }

  function wait(){ return new Promise(function(r){ setTimeout(r, 0); }); }

  /* draws every frame on a canvas (image, ring, band with date and credit), then encodes */
  function build(o, onp){
    var fr = o.frames.slice();
    if (fr.length > 72) { var keep = [], step = (fr.length - 1) / 71; for (var s = 0; s < 72; s++) keep.push(fr[Math.round(s * step)]); fr = keep; }
    var S = fr.length > 24 ? 256 : 320, BH = Math.round(S * 0.17), W = S, H = S + BH;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d', { willReadFrequently: true });
    var font = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
    var rtl = document.documentElement.dir === 'rtl';
    var frames = [];
    function paint(f){
      x.fillStyle = BAND; x.fillRect(0, 0, W, H);
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(f.img, f.sx || 0, f.sy || 0, f.sw || f.img.width, f.sh || f.img.height, 0, 0, S, S);
      if (o.ring) { x.strokeStyle = BRAND; x.lineWidth = Math.max(2, S / 128); x.beginPath(); x.arc(S / 2, S / 2, o.ring * S, 0, 2 * Math.PI); x.stroke(); }
      x.fillStyle = BAND; x.fillRect(0, S, W, BH);
      x.textBaseline = 'alphabetic'; x.direction = rtl ? 'rtl' : 'ltr';
      var pad = Math.round(S * 0.035), big = Math.round(BH * 0.36), small = Math.max(9, Math.round(BH * 0.2));
      x.fillStyle = INK; x.font = '700 ' + big + 'px ' + font; x.textAlign = rtl ? 'right' : 'left';
      x.fillText(f.date || '', rtl ? W - pad : pad, S + pad + big * 0.85, W * 0.62);
      x.fillStyle = BRAND; x.font = '700 ' + small + 'px ' + font; x.textAlign = rtl ? 'left' : 'right'; x.direction = 'ltr';
      x.fillText('kolaboro.com', rtl ? pad : W - pad, S + pad + big * 0.85, W * 0.34);
      x.fillStyle = MUTED; x.font = '400 ' + small + 'px ' + font; x.textAlign = 'left';
      x.fillText(o.credit || 'Contains modified Copernicus Sentinel data', pad, H - pad * 0.8, W - 2 * pad);
      return x.getImageData(0, 0, W, H).data;
    }
    var chain = Promise.resolve();
    fr.forEach(function(f, i){ chain = chain.then(function(){ frames.push(paint(f)); if (onp) onp(Math.round(i / fr.length * 30)); return wait(); }); });
    return chain.then(function(){
      // one palette for the whole animation: 4 reserved band colours + 252 from the images (sampled)
      var stepPx = Math.max(1, Math.floor(frames.length * S * S / 60000)), smp = [], c = 0;
      frames.forEach(function(d){ for (var y = 0; y < S; y++) for (var xx = 0; xx < S; xx++) { if ((c++ % stepPx) !== 0) continue; var p = (y * W + xx) * 4; smp.push(d[p], d[p + 1], d[p + 2]); } });
      var pal = [hex(BAND), hex('#FFFFFF'), hex(MUTED), hex(BRAND)].concat(medianCut(new Uint8Array(smp), 252));
      while (pal.length < 256) pal.push([0, 0, 0]);
      var look = new Int16Array(32768).fill(-1);
      function near(r, g, b){
        var key = (r >> 3) << 10 | (g >> 3) << 5 | (b >> 3), v = look[key]; if (v >= 0) return v;
        var bi = 0, bd = 1e9; for (var i = 0; i < 256; i++) { var p = pal[i], dr = p[0] - r, dg = p[1] - g, db = p[2] - b, dd = 2 * dr * dr + 4 * dg * dg + 3 * db * db; if (dd < bd) { bd = dd; bi = i; } }
        look[key] = bi; return bi;
      }
      var parts = [], head = ascii('GIF89a').concat(u16(W), u16(H), [0xF7, 0, 0]);
      pal.forEach(function(p){ head.push(p[0], p[1], p[2]); });
      head = head.concat([0x21, 0xFF, 0x0B], ascii('NETSCAPE2.0'), [3, 1, 0, 0, 0]);
      head = head.concat([0x21, 0xFE], sub(ascii((o.credit || 'Contains modified Copernicus Sentinel data') + '. Made in the browser at kolaboro.com from real Sentinel-2 images.')));
      parts.push(new Uint8Array(head));
      var k = 0, chain2 = Promise.resolve();
      frames.forEach(function(d, i){
        chain2 = chain2.then(function(){
          var ix = new Uint8Array(W * H);
          for (var p = 0, q = 0; p < ix.length; p++, q += 4) ix[p] = near(d[q], d[q + 1], d[q + 2]);
          var delay = i === frames.length - 1 ? (o.last || 180) : (o.delay || 60);
          parts.push(new Uint8Array([0x21, 0xF9, 4, 0x04].concat(u16(delay), [0, 0], [0x2C, 0, 0, 0, 0], u16(W), u16(H), [0, 8])));
          parts.push(lzw(ix));
          k++; if (onp) onp(30 + Math.round(k / frames.length * 70));
          return wait();
        });
      });
      return chain2.then(function(){ parts.push(new Uint8Array([0x3B])); return { blob: new Blob(parts, { type: 'image/gif' }), n: frames.length, w: W, h: H }; });
    });
  }

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fill(t, v){ return String(t || '').replace(/\{(\w+)\}/g, function(m, k){ return v[k] != null ? v[k] : m; }); }

  var CSS = '.ktl{margin:12px 0 0;display:grid;gap:10px;justify-items:start}.ktl-p{font-size:var(--k-fs-sm,.92rem);color:var(--k-muted,#56636F);margin:0}' +
    '.ktl-o{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}.ktl-o img{display:block;width:min(240px,100%);height:auto;border-radius:var(--k-r-sm,6px);border:1px solid var(--k-line,#D5DBD8)}' +
    '.ktl-a{display:flex;flex-wrap:wrap;gap:8px}.ktl-a .k-btn{min-height:44px}.ktl-bar{width:min(320px,100%)}';

  function make(host, o){
    var L = o.L || {};
    if (!document.getElementById('ktl-css')) { var st = document.createElement('style'); st.id = 'ktl-css'; st.textContent = CSS; document.head.appendChild(st); }
    host.hidden = false;
    host.innerHTML = '<div class="ktl" aria-live="polite"><p class="ktl-p">' + esc(fill(L.making, { p: 0 })) + '</p><div class="k-progress ktl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="--v:0%"></i></div></div>';
    var msg = host.querySelector('.ktl-p'), bar = host.querySelector('.k-progress');
    return build(o, function(p){ msg.textContent = fill(L.making, { p: p }); bar.setAttribute('aria-valuenow', p); bar.firstChild.style.setProperty('--v', p + '%'); }).then(function(r){
      var url = URL.createObjectURL(r.blob), file = null;
      try { file = new File([r.blob], o.filename, { type: 'image/gif' }); } catch (e) {}
      var canFile = !!(file && navigator.canShare && navigator.canShare({ files: [file] }));
      host.innerHTML = '<div class="ktl" aria-live="polite"><p class="ktl-p">' + esc(fill(L.ready, { n: r.n, kb: Math.round(r.blob.size / 1024) })) + '</p><div class="ktl-o"><img alt="' + esc(o.title || '') + '" src="' + url + '" width="' + r.w + '" height="' + r.h + '">' +
        '<div class="ktl-a">' + (canFile ? '<button type="button" class="k-btn k-btn--sm" data-a="share">' + esc(L.share) + '</button>' : '') +
        '<a class="k-btn k-btn--sm" data-a="dl" href="' + url + '" download="' + esc(o.filename) + '">' + esc(L.dl) + '</a>' +
        '<button type="button" class="k-btn k-btn--sm k-btn--ghost" data-a="copy">' + esc(L.copy) + '</button></div></div><p class="ktl-p">' + esc(L.note) + '</p></div>';
      host.querySelector('.ktl-a').addEventListener('click', function(e){
        var b = e.target.closest('[data-a]'); if (!b) return;
        var a = b.getAttribute('data-a');
        if (a === 'share') { e.preventDefault(); navigator.share({ files: [file], title: o.title, text: (o.text ? o.text + ' ' : '') + o.url }).catch(function(){}); }
        if (a === 'copy') {
          var done = function(){ b.textContent = L.copied; setTimeout(function(){ b.textContent = L.copy; }, 2400); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(o.url).then(done, function(){ window.prompt(L.copy, o.url); });
          else window.prompt(L.copy, o.url);
        }
      });
      return r;
    }).catch(function(e){ host.innerHTML = '<p class="ktl-p" role="alert">' + esc(L.fail) + '</p>'; if (window.console) console.warn('time-lapse', e && e.message); });
  }

  window.KTL = { make: make, build: build };
})();
