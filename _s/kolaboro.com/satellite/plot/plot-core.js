/* Kolaboro satellite on demand: core. Finds scenes through /api/x/g/scenes (Element84 Earth Search STAC) and reads the
   Sentinel-2 L2A COGs on AWS Open Data straight from the browser with geotiff.js (HTTP range requests, CORS allowed by the bucket).
   Per quarter: candidates least cloudy first; the scene classification layer (SCL, 20 m) is checked at the point and the first
   scene that is clear there is read in true colour (TCI, 10 m). No account and no key. Exposes window.KSatPoint. */
(function(){
  'use strict';
  var CLEAR = { 4: 1, 5: 1, 6: 1, 7: 1 };      // vegetation, not vegetated, water, unclassified
  var HALF_PX = 64;                           // 128 x 128 px at 10 m = 1.28 km box
  var MIN_CLEAR = 0.9;                        // share of the 300 m around the pin that must be cloud free

  /* WGS84 -> UTM (EPSG 326zz / 327zz), Snyder's series: better than 1 m inside a zone. */
  function utm(lat, lng, epsg){
    var zone = epsg % 100, south = Math.floor(epsg / 100) === 327;
    var a = 6378137, f = 1 / 298.257223563, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    var phi = lat * Math.PI / 180, lam = lng * Math.PI / 180, lam0 = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
    var s = Math.sin(phi), c = Math.cos(phi), t = Math.tan(phi);
    var N = a / Math.sqrt(1 - e2 * s * s), T = t * t, C = ep2 * c * c, A = c * (lam - lam0);
    var e4 = e2 * e2, e6 = e4 * e2;
    var M = a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi) - (35 * e6 / 3072) * Math.sin(6 * phi));
    var x = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * Math.pow(A, 5) / 120) + 500000;
    var y = k0 * (M + N * t * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * Math.pow(A, 6) / 720));
    if (south) y += 10000000;
    return [x, y];
  }

  var tifCache = {};
  function open(url){ if (!tifCache[url]) tifCache[url] = GeoTIFF.fromUrl(url, { allowFullFile: false, cacheSize: 64 }).then(function(t){ return t.getImage(0); }); return tifCache[url]; }
  function pix(img, xy){ var o = img.getOrigin(), r = img.getResolution(); return [Math.floor((xy[0] - o[0]) / r[0]), Math.floor((xy[1] - o[1]) / r[1])]; }

  /* SCL around the pin: share of pixels within 150 m that are clear, and whether the scene has data there. */
  function sclCheck(c, lat, lng, signal){
    var xy = utm(lat, lng, c.epsg);
    return open(c.scl).then(function(img){
      var p = pix(img, xy), h = 8, W = img.getWidth(), H = img.getHeight();
      if (p[0] - h < 0 || p[1] - h < 0 || p[0] + h > W || p[1] + h > H) return { clear: 0, nodata: 1 };
      return img.readRasters({ window: [p[0] - h, p[1] - h, p[0] + h, p[1] + h], interleave: true, signal: signal }).then(function(r){
        var n = 0, ok = 0, nd = 0, rr = (150 / 20) * (150 / 20);
        for (var j = 0; j < 2 * h; j++) for (var i = 0; i < 2 * h; i++) {
          var dx = i - h + .5, dy = j - h + .5; if (dx * dx + dy * dy > rr) continue;
          var v = r[j * 2 * h + i]; n++; if (v === 0) nd++; else if (CLEAR[v]) ok++;
        }
        return { clear: n ? ok / n : 0, nodata: n ? nd / n : 1 };
      });
    });
  }

  /* True colour 1.28 km box around the pin and simple numbers in a 50 m (5 x 5 px) square at the pin. */
  function readTci(c, lat, lng, signal){
    var xy = utm(lat, lng, c.epsg);
    return open(c.tci).then(function(img){
      var p = pix(img, xy), h = HALF_PX;
      return img.readRasters({ window: [p[0] - h, p[1] - h, p[0] + h, p[1] + h], interleave: true, signal: signal, fillValue: 0 }).then(function(r){
        var n = 2 * h, zero = 0, data = new Uint8ClampedArray(n * n * 4);
        for (var k = 0; k < n * n; k++) {
          var R = r[3 * k], G = r[3 * k + 1], B = r[3 * k + 2];
          if (!R && !G && !B) zero++;
          data[4 * k] = R * 1.12; data[4 * k + 1] = G * 1.12; data[4 * k + 2] = B * 1.12; data[4 * k + 3] = 255;
        }
        var lum = 0, exg = 0, m = 0;
        for (var j = h - 2; j <= h + 2; j++) for (var i = h - 2; i <= h + 2; i++) {
          var q = j * n + i, R2 = r[3 * q], G2 = r[3 * q + 1], B2 = r[3 * q + 2]; if (!R2 && !G2 && !B2) continue;
          lum += 0.299 * R2 + 0.587 * G2 + 0.114 * B2; exg += 2 * G2 - R2 - B2; m++;
        }
        return { size: n, rgba: data, nodata: zero / (n * n), brightness: m ? Math.round(lum / m * 10) / 10 : null, greenness: m ? Math.round(exg / m * 10) / 10 : null };
      });
    });
  }

  function pool(items, n, fn){
    var i = 0, out = new Array(items.length);
    function next(){ if (i >= items.length) return Promise.resolve(); var k = i++; return fn(items[k], k).then(function(v){ out[k] = v; return next(); }); }
    var ws = []; for (var w = 0; w < Math.min(n, items.length); w++) ws.push(next());
    return Promise.all(ws).then(function(){ return out; });
  }

  /* One quarter: walk the candidates until one is clear at the pin. */
  function quarter(q, lat, lng, signal, onTry){
    var tried = [];
    function attempt(k){
      if (signal && signal.aborted) return Promise.reject(new Error('aborted'));
      var c = q.candidates[k];
      if (!c || k >= 5) return Promise.resolve({ q: q.q, from: q.from, to: q.to, status: q.error ? 'search failed' : (q.candidates.length ? 'no clear image' : 'no image'), tried: tried, listed: q.listed || 0 });
      return sclCheck(c, lat, lng, signal).then(function(s){
        tried.push({ id: c.id, date: c.date, cloud: c.cloud, clear_at_pin: Math.round(s.clear * 100) });
        if (onTry) onTry(q, c, s);
        if (s.nodata > 0.05 || s.clear < MIN_CLEAR) return attempt(k + 1);
        return readTci(c, lat, lng, signal).then(function(t){
          if (t.nodata > 0.05) return attempt(k + 1);
          return { q: q.q, from: q.from, to: q.to, status: 'ok', scene: c, clear_at_pin: Math.round(s.clear * 100), image: t, tried: tried, listed: q.listed || 0 };
        });
      }, function(e){ if (signal && signal.aborted) throw e; tried.push({ id: c.id, date: c.date, error: true }); return attempt(k + 1); });
    }
    return attempt(0);
  }

  function run(lat, lng, years, opts){
    opts = opts || {};
    var t0 = Date.now();
    return fetch('/api/x/g/scenes?lat=' + lat.toFixed(5) + '&lng=' + lng.toFixed(5) + '&years=' + years, { signal: opts.signal }).then(function(r){
      return r.json().then(function(d){ if (!r.ok) { var e = new Error(d && d.note || d && d.error || ('HTTP ' + r.status)); e.status = r.status; throw e; } return d; });
    }).then(function(d){
      if (opts.onScenes) opts.onScenes(d, Date.now() - t0);
      var qs = d.quarters.slice().reverse();     // newest first, so the latest picture arrives first
      return pool(qs, 3, function(q){
        return quarter(q, lat, lng, opts.signal, opts.onTry).then(function(res){ if (opts.onQuarter) opts.onQuarter(res, Date.now() - t0); return res; });
      }).then(function(res){ return { scenes: d, quarters: res.reverse(), ms: Date.now() - t0 }; });
    });
  }

  /* Plain reading of a series at the pin: median of the first two clear quarters against the median of the last two.
     Never a verdict about construction stages. */
  function med(a){ a = a.slice().sort(function(x, y){ return x - y; }); var n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; }
  function change(series){
    var ok = series.quarters.filter(function(q){ return q.status === 'ok' && q.image.brightness != null; });
    if (ok.length < 3) return { enough: false, clear: ok.length };
    var k = ok.length >= 4 ? 2 : 1, A = ok.slice(0, k), B = ok.slice(-k);
    var bA = med(A.map(function(q){ return q.image.brightness; })), bB = med(B.map(function(q){ return q.image.brightness; }));
    var gA = med(A.map(function(q){ return q.image.greenness; })), gB = med(B.map(function(q){ return q.image.greenness; }));
    var db = Math.round((bB - bA) * 10) / 10, dg = Math.round((gB - gA) * 10) / 10;
    var visible = Math.abs(db) >= 25 || Math.abs(dg) >= 20, cleared = db >= 25 && dg <= 0 || dg <= -20;
    var reading = !visible ? 'No large change in brightness or greenness at the pin between the start and the end of the period.'
      : cleared ? 'The ground at the pin got brighter or less green: consistent with clearing, earthworks or new roofs. It does not show which stage a building has reached.'
      : dg >= 20 ? 'The pin got greener: vegetation grew, or the season changed. That is not a sign of construction.'
      : 'The ground at the pin looks different from the start of the period. Look at the pictures to see why.';
    return { enough: true, clear: ok.length, first: A[0], last: B[B.length - 1], quarters_compared: k, d_brightness: db, d_greenness: dg, visible: visible, cleared: cleared, reading: reading };
  }

  window.KSatPoint = { run: run, change: change, utm: utm };
})();
