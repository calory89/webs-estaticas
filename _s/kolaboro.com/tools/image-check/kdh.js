/* kdh1 perceptual hash, browser side. Must give the same bits as tools/kolaboro-agent/kdhash.py (the weekly index).
   Full-resolution decode, no colour management, luma (299R+587G+114B)*A + 255000*(255-A) as exact integers, 9x8 grid with
   integer edges floor(i*W/9), floor(j*H/8), cell mean as float64, bit = left cell darker than right cell, MSB first.
   'h' = whole image, 'c' = central 70%, 'f' = 'h' of the mirrored image (approximate: computed from the same grid). */
(function (G) {
  'use strict';
  var MAX_PIXELS = 50000000;
  function edges(a, n, parts) { var e = []; for (var i = 0; i <= parts; i++) e.push(a + Math.floor(i * n / parts)); return e; }
  function hex(bits) { var s = ''; for (var i = 0; i < 64; i += 4) s += ((bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]).toString(16); return s; }
  function bitsOf(m, mirror) {
    var b = [];
    for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
      var L = mirror ? m[r][8 - c] : m[r][c], R = mirror ? m[r][7 - c] : m[r][c + 1];
      b.push(L < R ? 1 : 0);
    }
    return b;
  }
  // ctx: 2d context holding the decoded image at full size. Returns the 8x9 matrix of cell means for the region.
  function grid(ctx, x0, x1, y0, y1) {
    var xs = edges(x0, x1 - x0, 9), ys = edges(y0, y1 - y0, 8), w = x1 - x0, col = new Int8Array(w), m = [];
    for (var c = 0, x = 0; x < w; x++) { while (x0 + x >= xs[c + 1]) c++; col[x] = c; }
    for (var r = 0; r < 8; r++) {
      var h = ys[r + 1] - ys[r], sums = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (h > 0) {
        // a band of rows at a time; per-row integer sums stay far below 2^53
        var step = Math.max(1, Math.floor(4000000 / Math.max(1, w)));
        for (var yy = 0; yy < h; yy += step) {
          var hh = Math.min(step, h - yy), d = ctx.getImageData(x0, ys[r] + yy, w, hh).data, i = 0;
          for (var y = 0; y < hh; y++) for (var x2 = 0; x2 < w; x2++, i += 4) {
            var a = d[i + 3];
            sums[col[x2]] += (299 * d[i] + 587 * d[i + 1] + 114 * d[i + 2]) * a + 255000 * (255 - a);
          }
        }
      }
      var row = [];
      for (var k = 0; k < 9; k++) { var n = (xs[k + 1] - xs[k]) * h; row.push(n ? sums[k] / n : 0); }
      m.push(row);
    }
    return m;
  }
  function fromCanvas(ctx, W, H) {
    if (W < 9 || H < 8) return null;
    var mh = grid(ctx, 0, W, 0, H), cx = Math.floor(W * 15 / 100), cy = Math.floor(H * 15 / 100);
    var c = (W - 2 * cx >= 9 && H - 2 * cy >= 8) ? hex(bitsOf(grid(ctx, cx, W - cx, cy, H - cy))) : hex(bitsOf(mh));
    return { h: hex(bitsOf(mh)), c: c, f: hex(bitsOf(mh, true)), w: W, hgt: H };
  }
  async function fromBlob(blob) {
    var bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none', imageOrientation: 'from-image' });
    var W = bmp.width, H = bmp.height;
    if (W * H > MAX_PIXELS) { bmp.close && bmp.close(); throw new Error('Image larger than 50 megapixels'); }
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
    ctx.drawImage(bmp, 0, 0); bmp.close && bmp.close();
    var out = fromCanvas(ctx, W, H); cv.width = cv.height = 0;
    return out;
  }
  var POP = new Uint8Array(256); for (var i = 0; i < 256; i++) POP[i] = (i & 1) + POP[i >> 1];
  function pop32(x) { return POP[x & 255] + POP[(x >>> 8) & 255] + POP[(x >>> 16) & 255] + POP[x >>> 24]; }
  function split(h) { return [parseInt(h.slice(0, 8), 16) | 0, parseInt(h.slice(8), 16) | 0]; }
  function dist(a, b) { return pop32(a[0] ^ b[0]) + pop32(a[1] ^ b[1]); }
  G.KDH = { fromBlob: fromBlob, fromCanvas: fromCanvas, split: split, dist: dist };
})(window);
