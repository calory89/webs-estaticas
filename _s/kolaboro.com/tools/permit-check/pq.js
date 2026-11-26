/* Kolaboro permit QR check. Decodes QR codes from a photo, scan or PDF in the browser (jsQR 1.4.0, self-hosted,
   plus the browser's own BarcodeDetector when present), then checks where the link points. Nothing is uploaded,
   and we never open the link for you: you decide. */
(function () {
  'use strict';
  var PDFJS = '/tools/contract-check/vendor/pdf-4.10.38.min.mjs', PDFJS_WORKER = '/tools/contract-check/vendor/pdf-4.10.38.worker.min.mjs';
  // Official services we have checked ourselves. Each has the source we used.
  var KNOWN = [
    { host: 'simbg.pu.go.id', path: /^\/Main\/Verifikasi(?:PBG|Berkas)\//i, name: 'SIMBG verification page, Ministry of Public Works (Indonesia)',
      what: 'This is the public page SIMBG uses to verify a building approval (SK PBG) or a certificate of fitness (SLF). It asks for the certificate\'s unique code (kode unik, at least 8 characters, which the permit holder sees in their SIMBG account) and then shows the owner, the building and whether the SK PBG is valid ("Terverifikasi") or not ("SK PBG Tidak Berlaku"). Ask the seller for the unique code.',
      src: 'SIMBG\'s own web app code (route /Main/VerifikasiPBG/:uid and its check against /pbg/v1/certificate-scan), read on 3 Nov 2026', srcUrl: 'https://simbg.pu.go.id/' },
    { host: 'simbg.pu.go.id', name: 'SIMBG, Ministry of Public Works (Indonesia)', what: 'The government\'s building permit system (PBG and SLF). This link is on the official SIMBG site but not on its verification page.', src: 'Government Regulation 16/2021, Article 1 point 48, defines SIMBG; the site is run by the Ministry of Public Works (pu.go.id)', srcUrl: 'https://simbg.pu.go.id/' },
    { suffix: 'dubailand.gov.ae', name: 'Dubai Land Department', what: 'An official Dubai Land Department site. Property ads in Dubai must carry a QR code from the Madmoun service that opens the ad\'s permit on the DLD website, so you can see if the ad was approved and whether the unit is already sold or rented.', src: 'DLD news release, 18 April 2023', srcUrl: 'https://dubailand.gov.ae/en/news-media/dubai-land-department-provides-madmoun-service-to-verify-validity-of-real-estate-ads-via-qr-codes' },
    { suffix: 'dol.go.th', name: 'Department of Lands (Thailand)', what: 'The official site of Thailand\'s Department of Lands, which registers land and condominium titles.', src: 'dol.go.th publishes the Condominium Act we quote in our law notes', srcUrl: 'https://www.dol.go.th/' }
  ];
  var GOV = [{ suffix: 'go.id', name: 'Indonesian government domain', what: 'Names ending in .go.id are registered through domain.go.id, the government\'s registry for public institutions run by the Ministry of Communication and Digital Affairs. It is a government site, but we have not checked this particular service.', srcUrl: 'https://domain.go.id/' }];
  var SHORT = ['bit.ly', 's.id', 'tinyurl.com', 't.co', 'goo.gl', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'is.gd', 'ow.ly', 'linktr.ee', 'qrco.de', 'tiny.cc', 'rb.gy', 'bit.do', 'lnkd.in', 'shorturl.asia', 'u.to', 'v.gd'];
  var LOOK = /simbg|pu-?go|go-?id|atr-?bpn|bpn|dubailand|dubai-?land|\bdld\b|rera|trakheesi|oqood|madmoun|dol-?go|gov-?ae|ministry|kementerian/i;
  // second-level endings we treat as one unit when showing the registered name
  var SLD = /\.(?:co|go|ac|or|web|my|biz|net|sch|mil|desa|ponpes)\.id$|\.(?:gov|co|ac|net|org|sch|mil)\.ae$|\.(?:co|go|ac|or|in|mi|net)\.th$|\.(?:co|org|gov|ac|net|me|ltd|plc)\.uk$|\.com\.(?:au|my|sg|ph|br|mx|tr)$|\.gov\.(?:pt|my|ph|sg|au)$|\.gob\.(?:es|mx)$/i;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function status(m, err) { var s = $('pqStatus'); s.textContent = m || ''; s.className = 'ft-status' + (err ? ' err' : ''); }
  function regName(host) {
    var m = host.match(SLD), parts = host.split('.');
    var n = m ? m[0].split('.').length - 1 : 1; // labels in the public ending
    return parts.slice(-(n + 1)).join('.');
  }
  function endsWith(host, suf) { return host === suf || host.slice(-(suf.length + 1)) === '.' + suf; }

  /* ---------- classify one decoded payload ---------- */
  function classify(text) {
    var out = { text: text, checks: [], verdict: 'info', url: null };
    var t = String(text).trim(), u = null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t)) { try { u = new URL(t); } catch (e) {} }
    else if (/^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/|$)/i.test(t)) { try { u = new URL('https://' + t); out.checks.push(['', 'The code holds a web address without "https://"; we read it as a link.']); } catch (e) {} }
    if (!u || !/^https?:$/.test(u.protocol)) {
      out.verdict = 'info';
      out.title = u ? 'This QR code holds a ' + u.protocol.replace(':', '') + ' link, not a web page' : 'This QR code holds text, not a link';
      out.checks.push(['', 'Official verification codes on permits and title documents normally hold a web address. Text alone cannot be checked against a register here.']);
      return out;
    }
    out.url = u.href;
    var host = u.hostname.toLowerCase().replace(/\.$/, ''), reg = regName(host), bad = 0;
    out.host = host; out.reg = reg;
    if (u.protocol !== 'https:') { bad++; out.checks.push(['bad', 'Not encrypted (http, not https). Official verification pages use https.']); } else out.checks.push(['yes', 'Uses https.']);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.indexOf(':') >= 0) { bad++; out.checks.push(['bad', 'Points to a bare IP address instead of a name. Official services use their own domain name.']); }
    if (/(^|\.)xn--/.test(host)) { bad++; out.checks.push(['bad', 'The name uses special characters (punycode "xn--"), a common trick to imitate a real domain.']); }
    if (u.username || u.password) { bad++; out.checks.push(['bad', 'The link hides text before an "@" sign. Browsers ignore that part, so the real site is only what comes after it.']); }
    if (u.port && u.port !== '443' && u.port !== '80') { bad++; out.checks.push(['bad', 'Uses an unusual port (' + esc(u.port) + ').']); }
    var short = SHORT.filter(function (s) { return endsWith(host, s); })[0];
    var known = KNOWN.filter(function (k) { return (k.host ? host === k.host : endsWith(host, k.suffix)) && (!k.path || k.path.test(u.pathname)); })[0];
    var gov = !known && GOV.filter(function (g) { return endsWith(host, g.suffix); })[0];
    if (known) {
      out.verdict = bad ? 'bad' : 'ok'; out.known = known;
      out.title = bad ? 'Official domain, but something about this link is wrong' : 'Official domain: ' + known.name;
      out.checks.push(['yes', 'The registered name is ' + reg + ', which belongs to ' + known.name.replace(/^.*?, /, '') + '.']);
    } else if (gov) {
      out.verdict = bad ? 'bad' : 'gov'; out.known = gov;
      out.title = bad ? 'Government ending, but something about this link is wrong' : 'Government domain, service not on our list';
      out.checks.push(['yes', 'Ends in .' + gov.suffix + '.']);
    } else if (short) {
      out.verdict = 'bad'; out.title = 'Short link: we cannot see where it really goes';
      out.checks.push(['bad', host + ' is a link shortener. Government verification codes point straight to the agency\'s site. Ask the seller for the full official link, or look the permit up yourself on the official site.']);
    } else {
      out.verdict = 'bad';
      if (LOOK.test(host)) { out.title = 'Looks official, but is not an official domain'; out.checks.push(['bad', 'The name contains words of an official agency, but the registered name is ' + reg + '. Anyone can register a name like that. Do not enter codes or personal data there.']); }
      else { out.title = 'Not an official domain we know'; out.checks.push(['bad', 'The registered name is ' + reg + '. It is not on our list of official verification services. That does not prove it is fake, but do not rely on it: find the agency\'s site yourself and check there.']); }
    }
    if (host !== reg && !known && !gov) out.checks.push(['', 'Read the name from the right: the part that counts is ' + reg + '; everything before it can be chosen freely by its owner.']);
    return out;
  }

  /* ---------- decoding ---------- */
  var BD = null;
  try { if ('BarcodeDetector' in window) BD = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { BD = null; }
  function scanCanvas(cv) {
    var ctx = cv.getContext('2d', { willReadFrequently: true }), W = cv.width, H = cv.height, found = [];
    function add(data, loc, ox, oy) { if (!data) return; var f = found.filter(function (x) { return x.data === data; })[0]; if (!f) found.push({ data: data, loc: loc ? shift(loc, ox, oy) : null }); }
    function shift(l, ox, oy) { var o = {}; ['topLeftCorner', 'topRightCorner', 'bottomRightCorner', 'bottomLeftCorner'].forEach(function (k) { o[k] = { x: l[k].x + ox, y: l[k].y + oy }; }); return o; }
    function tryRegion(x, y, w, h) {
      if (w < 40 || h < 40) return;
      var id = ctx.getImageData(x, y, w, h), r = window.jsQR(id.data, w, h, { inversionAttempts: 'attemptBoth' });
      if (r && r.data) add(r.data, r.location, x, y);
    }
    tryRegion(0, 0, W, H);
    // a small code on a full page: also look at overlapping tiles
    [2, 3].forEach(function (n) {
      var tw = Math.ceil(W / n * 1.3), th = Math.ceil(H / n * 1.3);
      for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
        var x = Math.max(0, Math.min(W - tw, Math.round(i * W / n - tw * 0.12))), y = Math.max(0, Math.min(H - th, Math.round(j * H / n - th * 0.12)));
        tryRegion(x, y, Math.min(tw, W), Math.min(th, H));
      }
    });
    var p = Promise.resolve(found);
    if (BD) p = BD.detect(cv).then(function (rs) { rs.forEach(function (r) { var c = r.cornerPoints || []; add(r.rawValue, c.length === 4 ? { topLeftCorner: c[0], topRightCorner: c[1], bottomRightCorner: c[2], bottomLeftCorner: c[3] } : null, 0, 0); }); return found; }).catch(function () { return found; });
    return p;
  }
  function canvasFromImage(img, max) {
    var s = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    var cv = document.createElement('canvas'); cv.width = Math.round((img.naturalWidth || img.width) * s); cv.height = Math.round((img.naturalHeight || img.height) * s);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); return cv;
  }
  function decodeImage(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        var cv = canvasFromImage(img, 2200);
        scanCanvas(cv).then(function (f) {
          if (f.length) return f;
          var small = canvasFromImage(img, 1100); return scanCanvas(small).then(function (g) { if (g.length) { cv = small; } return g; });
        }).then(function (f) { URL.revokeObjectURL(url); res({ pages: [{ cv: cv, found: f }] }); }).catch(rej);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('This image format cannot be opened by your browser. Try a JPG or PNG.')); };
      img.src = url;
    });
  }
  function decodePdf(buf) {
    return import(PDFJS).then(function (lib) {
      lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return lib.getDocument({ data: buf, isEvalSupported: false }).promise.then(function (pdf) {
        var n = Math.min(pdf.numPages, 6), pages = [], chain = Promise.resolve();
        for (var i = 1; i <= n; i++) (function (i) {
          chain = chain.then(function () { status('Rendering page ' + i + ' of ' + n + '...'); return pdf.getPage(i); }).then(function (pg) {
            var vp1 = pg.getViewport({ scale: 1 }), sc = Math.min(3, 2200 / Math.max(vp1.width, vp1.height)), vp = pg.getViewport({ scale: sc });
            var cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
            var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
            return pg.render({ canvasContext: ctx, viewport: vp }).promise.then(function () { return scanCanvas(cv); }).then(function (f) { pages.push({ cv: cv, found: f, page: i }); });
          });
        })(i);
        return chain.then(function () { return { pages: pages, total: pdf.numPages }; });
      });
    });
  }

  /* ---------- output ---------- */
  function preview(pg) {
    var src = pg.cv, s = Math.min(1, 900 / Math.max(src.width, src.height));
    var cv = document.createElement('canvas'); cv.width = Math.round(src.width * s); cv.height = Math.round(src.height * s);
    var ctx = cv.getContext('2d'); ctx.drawImage(src, 0, 0, cv.width, cv.height);
    ctx.lineWidth = Math.max(3, cv.width / 150); ctx.strokeStyle = '#FF5B14';
    pg.found.forEach(function (f) { var l = f.loc; if (!l) return; ctx.beginPath(); ctx.moveTo(l.topLeftCorner.x * s, l.topLeftCorner.y * s); ctx.lineTo(l.topRightCorner.x * s, l.topRightCorner.y * s); ctx.lineTo(l.bottomRightCorner.x * s, l.bottomRightCorner.y * s); ctx.lineTo(l.bottomLeftCorner.x * s, l.bottomLeftCorner.y * s); ctx.closePath(); ctx.stroke(); });
    cv.className = 'pq-prev'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Your image with the QR code outlined');
    return cv;
  }
  function urlHTML(c) {
    if (!c.url) return '<p class="pq-url">' + esc(c.text) + '</p>';
    var u = new URL(c.url), host = c.host, i = host.lastIndexOf(c.reg);
    var hostH = i >= 0 ? esc(host.slice(0, i)) + '<b>' + esc(c.reg) + '</b>' : esc(host);
    return '<p class="pq-url' + (c.verdict === 'ok' ? ' yes' : '') + '">' + esc(u.protocol) + '//' + (u.username ? '<b>' + esc(u.username) + '@</b>' : '') + hostH + esc((u.port ? ':' + u.port : '') + u.pathname + u.search + u.hash) + '</p>';
  }
  function card(c, sample) {
    var cls = c.verdict === 'ok' ? 'good' : c.verdict === 'bad' ? 'look' : 'note';
    var tag = c.verdict === 'ok' ? '<span class="ft-tag yes">Official</span>' : c.verdict === 'gov' ? '<span class="ft-tag note">Government ending</span>' : c.verdict === 'bad' ? '<span class="ft-tag look">Check carefully</span>' : '<span class="ft-tag info">Not a link</span>';
    var h = '<article class="ft-f ' + cls + '"><h3>' + esc(c.title) + tag + '</h3>' + urlHTML(c) + '<ul class="pq-checks">' + c.checks.map(function (x) { return '<li class="' + x[0] + '">' + esc(x[1]) + '</li>'; }).join('') + '</ul>';
    if (c.known) h += '<p><b>What this is:</b> ' + esc(c.known.what) + '</p>' + (c.known.srcUrl ? '<p class="cc-src"><span>Source: ' + esc(c.known.src || 'registry site') + '.</span> <a href="' + esc(c.known.srcUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(new URL(c.known.srcUrl).host) + '</a></p>' : '');
    if (c.url && !sample) h += '<p style="margin-top:12px"><a class="btn ' + (c.verdict === 'ok' ? 'btn-hi' : 'btn-line') + ' btn-sm" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer nofollow">' + (c.verdict === 'ok' ? 'Open the official page' : 'Open anyway, at your own risk') + '</a></p><p class="cc-meta">The link opens in a new tab only when you click. We do not visit it for you.</p>';
    if (sample) h += '<p class="cc-meta">This is one of our samples, so there is no link to open.</p>';
    return h + '</article>';
  }
  function show(res, name, sample) {
    var all = [];
    res.pages.forEach(function (p) { p.found.forEach(function (f) { if (all.indexOf(f.data) < 0) all.push(f.data); }); });
    var out = $('pqOut'), html = '<p class="ft-file">' + esc(name) + (res.total > res.pages.length ? ' (first ' + res.pages.length + ' of ' + res.total + ' pages checked)' : '') + '</p>';
    if (!all.length) {
      html += '<article class="ft-f note"><h3>No QR code found<span class="ft-tag note">Try again</span></h3><p>We could not read a QR code in this file. Try a sharper photo taken straight on, in good light, with the code filling more of the picture. You can also type or paste the link printed under the code into the box below.</p></article>';
    } else {
      html += '<div class="pq-res">' + all.map(function (d) { return card(classify(d), sample); }).join('') + '</div>';
    }
    out.innerHTML = html; out.hidden = false;
    var pv = document.createElement('div'); pv.style.marginTop = '8px';
    res.pages.filter(function (p) { return p.found.length; }).slice(0, 2).forEach(function (p) { pv.appendChild(preview(p)); });
    if (!all.length && res.pages[0]) pv.appendChild(preview(res.pages[0]));
    out.appendChild(pv);
    status(all.length ? 'Found ' + all.length + ' QR code' + (all.length > 1 ? 's' : '') + '. Decoded on this device; nothing was uploaded.' : 'No QR code found.', !all.length);
    if (window.kbEvent) kbEvent('permit_qr', { n: all.length });
  }
  function onFile(f, sample) {
    if (!f) return;
    status('Looking for QR codes in ' + (f.name || 'your file') + '...');
    var p = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name || '') ? f.arrayBuffer().then(function (b) { return decodePdf(new Uint8Array(b)); }) : decodeImage(f);
    p.then(function (r) { show(r, f.name || 'Photo', sample); }).catch(function (e) { status('Could not read this file: ' + (e && e.message || e), true); });
  }
  function init() {
    if (!window.jsQR) { status('The QR reader did not load. Reload the page.', true); return; }
    var drop = $('pqDrop'), inp = $('pqFile'), cam = $('pqCam');
    inp.addEventListener('change', function () { onFile(inp.files[0]); });
    if (cam) cam.addEventListener('change', function () { onFile(cam.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) onFile(f); });
    document.querySelectorAll('[data-pq-sample]').forEach(function (b) {
      b.addEventListener('click', function () {
        fetch(b.getAttribute('data-pq-sample')).then(function (r) { return r.blob(); }).then(function (bl) { bl.name = b.textContent + ' (sample)'; return decodeImage(bl).then(function (r) { show(r, b.textContent + ' (sample image)', true); }); }).catch(function (e) { status('Could not load the sample: ' + e.message, true); });
      });
    });
    $('pqLinkGo').addEventListener('click', function () {
      var v = $('pqLink').value.trim(); if (!v) { status('Paste a link first.', true); return; }
      $('pqOut').innerHTML = '<div class="pq-res">' + card(classify(v), false) + '</div>'; $('pqOut').hidden = false; status('Checked the link you pasted. Nothing was sent anywhere.');
    });
    $('pqLink').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('pqLinkGo').click(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.__kbpq = { classify: classify, regName: regName };
})();
