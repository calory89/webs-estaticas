/* Image check page: hashes the visitor's image in the browser (kdh.js) and compares it with /data/image-hashes.json.
   The image is never uploaded: the only request is a GET of the public hash index. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var drop = $('icDrop'), inp = $('icFile'), st = $('icStatus'), out = $('icOut'), idx = null, idxP = null, thumbUrl = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function loadIndex() {
    if (!idxP) idxP = fetch('/data/image-hashes.json?d=' + new Date().toISOString().slice(0, 10), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('index ' + r.status); return r.json(); })
      .then(function (j) {
        j.split = j.items.map(function (it) { return [KDH.split(it[2]), KDH.split(it[3])]; });
        idx = j; return j;
      }).catch(function (e) { idxP = null; throw e; });
    return idxP;
  }
  // chance level measured on the index itself: how often two images of DIFFERENT cases fall within d bits
  function chance(j, d) {
    var n = j.items.length, hits = 0, tries = 0, seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; }
    for (var k = 0; k < 200000 && n > 1; k++) {
      var a = rnd(), b = rnd(); if (j.items[a][0] === j.items[b][0]) continue;
      tries++; if (KDH.dist(j.split[a][0], j.split[b][0]) <= d) hits++;
    }
    return { hits: hits, tries: tries };
  }
  var LIM = 10, MAYBE = 14;
  function render(q, name, j, ms) {
    var Q = { h: KDH.split(q.h), c: KDH.split(q.c), f: KDH.split(q.f) }, res = [];
    for (var i = 0; i < j.items.length; i++) {
      var s = j.split[i], best = 65, how = '';
      var d1 = KDH.dist(Q.h, s[0]); if (d1 < best) { best = d1; how = 'whole image'; }
      var d2 = KDH.dist(Q.h, s[1]); if (d2 < best - 1) { best = d2; how = 'your image is a crop of the centre of theirs'; }
      var d3 = KDH.dist(Q.c, s[0]); if (d3 < best - 1) { best = d3; how = 'their image is a crop of the centre of yours'; }
      var d4 = KDH.dist(Q.f, s[0]); if (d4 < best - 1) { best = d4; how = 'mirrored left to right'; }
      if (best <= MAYBE && (best <= LIM || how === 'whole image')) res.push({ i: i, d: best, how: how });
    }
    res.sort(function (a, b) { return a.d - b.d; });
    var byCase = {}, cases = [];
    res.forEach(function (r) { var id = j.items[r.i][0]; if (!byCase[id]) { byCase[id] = []; cases.push(id); } byCase[id].push(r); });
    var strong = cases.filter(function (c) { return byCase[c][0].d <= LIM; });
    var ch = chance(j, LIM);
    var h = '<div class="ft-grid2"><div>';
    h += '<p class="ft-file">' + esc(name) + ' &middot; ' + q.w + ' &times; ' + q.hgt + ' px &middot; hashed in your browser in ' + ms + ' ms</p>';
    h += '<p class="ft-file" style="margin-top:4px">Your hash (kdh1): <code>' + q.h + '</code> &middot; centre: <code>' + q.c + '</code></p>';
    h += '<div class="ft-strip" style="margin-top:14px"><div class="ft-stat' + (strong.length ? ' look' : '') + '"><b>' + strong.length + '</b><span>' + (strong.length === 1 ? 'tracked project shows' : 'tracked projects show') + ' this picture (distance 10 or less)</span></div>' +
      '<div class="ft-stat"><b>' + j.images.toLocaleString('en-US') + '</b><span>images compared, from ' + j.cases + ' projects</span></div></div>';
    h += '</div><div>' + (thumbUrl ? '<img class="ft-thumb" alt="Your image (shown from your device)" src="' + thumbUrl + '">' : '') + '</div></div>';
    if (!cases.length) {
      h += '<article class="ft-f ok"><h3><span class="ft-tag ok">No match</span>Not found among the images we index</h3><p>No indexed image is within ' + MAYBE + ' bits of yours.</p>' +
        '<div class="ft-mean"><div><b>What it means</b>This picture is not one of the ' + j.images.toLocaleString('en-US') + ' images on the project pages we track, at least not in a near-identical form.</div><div><b>What it does not prove</b>That the render is original. It may come from a site we do not track, a stock library, or be cropped, rotated or edited enough to change the hash. Run a reverse image search as well.</div></div></article>';
    } else {
      h += '<h2 class="ft-h">' + (strong.length ? 'Projects that show this picture' : 'Close, but probably not the same picture') + '</h2><div class="ft-out" style="margin-top:12px">';
      cases.slice(0, 25).forEach(function (c) {
        var r = byCase[c][0], it = j.items[r.i];
        h += '<div class="ft-m"><div><a href="/p/?id=' + encodeURIComponent(c) + '">Project ' + esc(c) + '</a>' +
          '<p>' + (r.d === 0 ? 'Identical hash' : r.d <= 5 ? 'Near-identical' : r.d <= LIM ? 'Very similar: likely the same picture, resized, recompressed or lightly edited' : 'Similar layout of light and dark; check by eye') + ' (' + esc(r.how) + ')' +
          (byCase[c].length > 1 ? '. ' + byCase[c].length + ' of its images are close.' : '.') + '</p>' +
          (it[1] ? '<p><a href="' + esc(it[1]) + '" target="_blank" rel="noopener noreferrer nofollow">Open the indexed image</a></p>' : '') + '</div>' +
          '<div class="d">' + r.d + '<small>of 64 bits differ</small></div></div>';
      });
      h += '</div>';
      h += '<article class="ft-f note"><h3><span class="ft-tag note">Read this</span>What a match means</h3><div class="ft-mean"><div><b>What it means</b>The same picture, or one almost identical, appears on the page of the project listed. If it is a different project from the one you are being sold, ask the developer where the render comes from.</div>' +
        '<div><b>What it does not prove</b>Wrongdoing. Agents, portals and sister brands share renders legitimately, and a project can be listed twice. Images with large plain areas (sky, sea, white walls) can collide by chance.</div></div></article>';
    }
    h += '<p class="ft-file">Chance check on this index: among ' + ch.tries.toLocaleString('en-US') + ' random pairs of images from different projects, ' + ch.hits.toLocaleString('en-US') + ' (' + (ch.tries ? (100 * ch.hits / ch.tries).toFixed(2) : '0') + '%) are within ' + LIM + ' bits of each other. Index built ' + esc((j.generated || '').slice(0, 10)) + '.</p>';
    out.innerHTML = h; out.hidden = false;
    st.className = 'ft-status'; st.textContent = 'Done. ' + (strong.length ? strong.length + (strong.length === 1 ? ' project shows' : ' projects show') + ' this picture.' : 'No tracked project shows this picture.');
  }
  async function handle(file) {
    if (!file) return;
    if (!/^image\//.test(file.type || 'image/')) { st.className = 'ft-status err'; st.textContent = 'Please choose an image file (JPEG, PNG or WebP).'; return; }
    st.className = 'ft-status'; st.textContent = 'Hashing ' + file.name + ' in your browser...';
    try {
      if (thumbUrl) URL.revokeObjectURL(thumbUrl);
      thumbUrl = URL.createObjectURL(file);
      var t0 = performance.now(), q = await KDH.fromBlob(file), ms = Math.round(performance.now() - t0);
      if (!q) throw new Error('too small');
      st.textContent = 'Comparing with the index...';
      var j;
      try { j = await loadIndex(); } catch (e) {
        st.className = 'ft-status err'; st.textContent = 'Your image was hashed (' + q.h + '), but the hash index is not available yet. It is rebuilt every week; please try again later.'; return;
      }
      render(q, file.name || 'image', j, ms);
    } catch (e) {
      st.className = 'ft-status err'; st.textContent = 'This image could not be read by your browser. Try a JPEG, PNG or WebP under 50 megapixels.';
      out.hidden = true;
    }
  }
  inp.addEventListener('change', function () { handle(inp.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handle(f); });
  // show index size up front (public data, no user input involved)
  loadIndex().then(function (j) { var el = $('icIdx'); if (el) el.textContent = j.images.toLocaleString('en-US') + ' images from ' + j.cases + ' tracked projects, indexed ' + (j.generated || '').slice(0, 10); })
    .catch(function () { var el = $('icIdx'); if (el) el.textContent = 'the index is being built (it is refreshed every week)'; });
})();
