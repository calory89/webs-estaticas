/* Kolaboro data desk page */
(function(){
  var K = window.KDD, $ = function(i){ return document.getElementById(i); }, esc = K.esc, fmt = K.fmt;
  var host = 'https://kolaboro.com', R = null;
  var wrapEl = $('dd-charts'); if (!K || !wrapEl) return;

  function cell(v, h){ return typeof v === 'number' ? (/\(%\)/.test(h) ? v.toFixed(1) : fmt(v)) : esc(v); }
  function csvCell(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function source(){ return 'Source: Kolaboro off-plan database (kolaboro.com/press/data/), data as of ' + R.dateLong + '. ' + R.license + '.'; }
  function embedH(c){ return Math.round(c.render(640).h + 190); }
  function embedCode(c){ return '<iframe src="' + host + '/press/data/embed/?c=' + c.id + '" title="' + esc(c.title + ' (Kolaboro)') + '" width="100%" height="' + embedH(c) + '" style="border:0;max-width:720px" loading="lazy"></iframe>'; }
  function mEmbed(m){ return '<iframe src="' + host + '/embed/?m=' + encodeURIComponent(m) + '" title="' + esc(m + ' transparency index (Kolaboro)') + '" width="100%" height="320" style="border:0;max-width:520px" loading="lazy"></iframe>'; }

  function card(c){
    var t = '<table class="dd-t"><caption class="sr-only">' + esc(c.title) + ': exact numbers</caption><thead><tr>' + c.cols.map(function(h){ return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      c.rows.map(function(r){ return '<tr' + (/^(Total|Average)/.test(r[0]) ? ' class="tot"' : '') + '>' + r.map(function(v, i){ return i === 0 ? '<th scope="row">' + esc(v) + '</th>' : '<td' + (typeof v === 'string' ? ' class="s"' : '') + '>' + cell(v, c.cols[i]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    var mopt = c.markets ? '<div class="dd-msel"><label for="ms-' + c.id + '">Market card for one market</label><select id="ms-' + c.id + '" data-m="' + c.id + '">' + c.markets.map(function(m){ return '<option>' + esc(m) + '</option>'; }).join('') + '</select>' +
      '<label class="sr-only" for="me-' + c.id + '">Market card embed code</label><textarea id="me-' + c.id + '" readonly rows="3">' + esc(mEmbed(c.markets[0])) + '</textarea><button type="button" class="btn btn-line btn-sm" data-act="copyembed" data-t="me-' + c.id + '" aria-describedby="h-' + c.id + '">Copy market embed</button> <a class="dd-prev" id="mp-' + c.id + '" href="/embed/?m=' + encodeURIComponent(c.markets[0]) + '" target="_blank" rel="noopener" aria-label="Preview the market card (opens in a new tab)">Preview</a></div>' : '';
    return '<article class="dd-card" id="c-' + c.id + '" aria-labelledby="h-' + c.id + '">' +
      '<p class="eyebrow">Chart ' + c.n + '</p><h2 id="h-' + c.id + '">' + esc(c.title) + '</h2>' +
      '<p class="dd-head">' + esc(c.headline) + '</p><p class="dd-sub">' + esc(c.sub) + '</p>' +
      '<div class="dd-body"><figure class="dd-fig" data-c="' + c.id + '"></figure><div class="dd-nums" tabindex="0" role="region" aria-label="' + esc(c.title) + ': exact numbers">' + t + '</div></div>' +
      '<p class="dd-meta">Data as of <time datetime="' + esc(R.date) + '">' + esc(R.dateLong) + '</time>. Updates automatically when the database changes.</p>' +
      '<div class="dd-acts"><button type="button" class="btn btn-line btn-sm" data-act="copy" data-c="' + c.id + '" aria-describedby="h-' + c.id + '">Copy numbers</button><button type="button" class="btn btn-line btn-sm" data-act="png" data-c="' + c.id + '" aria-describedby="h-' + c.id + '">Download PNG</button><button type="button" class="btn btn-line btn-sm" data-act="csv" data-c="' + c.id + '" aria-describedby="h-' + c.id + '">Download CSV</button><span class="dd-ok" aria-live="polite"></span></div>' +
      '<details class="dd-emb"><summary aria-describedby="h-' + c.id + '">Embed this chart</summary><label class="sr-only" for="e-' + c.id + '">Embed code</label><textarea id="e-' + c.id + '" readonly rows="3">' + esc(embedCode(c)) + '</textarea><button type="button" class="btn btn-line btn-sm" data-act="copyembed" data-t="e-' + c.id + '" aria-describedby="h-' + c.id + '">Copy embed code</button> <a class="dd-prev" href="/press/data/embed/?c=' + c.id + '" target="_blank" rel="noopener" aria-label="' + esc('Preview chart: ' + c.title + ' (opens in a new tab)') + '">Preview</a>' + mopt + '</details>' +
      '</article>';
  }
  function draw(){
    [].forEach.call(document.querySelectorAll('.dd-fig'), function(f){
      var c = byId(f.getAttribute('data-c')), W = Math.max(260, Math.floor(f.clientWidth));
      f.innerHTML = K.svg(c.render(W), W, c.title, c.headline, 'g-' + c.id);
    });
  }
  function byId(id){ return R.charts.filter(function(c){ return c.id === id; })[0]; }
  function copyText(txt, btn){
    var done = function(){ flash(btn, 'Copied'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, function(){ fallback(); });
    else fallback();
    function fallback(){ var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { flash(btn, 'Select and copy manually'); } document.body.removeChild(ta); }
  }
  function flash(btn, msg){ var s = btn.parentNode.querySelector('.dd-ok'); if (!s){ s = document.createElement('span'); s.className = 'dd-ok'; s.setAttribute('aria-live', 'polite'); btn.parentNode.appendChild(s); } s.textContent = msg; clearTimeout(s._t); s._t = setTimeout(function(){ s.textContent = ''; }, 2500); }
  function numbersText(c){
    return c.title + '\n' + c.headline + '\n\n' + c.cols.join(' | ') + '\n' + c.rows.map(function(r){ return r.map(function(v, i){ return typeof v === 'number' ? cell(v, c.cols[i]) : v; }).join(' | '); }).join('\n') + '\n\n' + source();
  }
  function download(name, blob){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
  function fname(c, ext){ return 'kolaboro-' + c.id + '-' + R.date + '.' + ext; }
  function csv(c){
    var lines = [c.cols.map(csvCell).join(',')].concat(c.rows.map(function(r){ return r.map(csvCell).join(','); }));
    lines.push(''); lines.push(csvCell(source()));
    download(fname(c, 'csv'), new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  }
  function wrapLines(s, max){ var w = s.split(' '), out = [], cur = ''; w.forEach(function(x){ if ((cur + ' ' + x).trim().length > max){ out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) out.push(cur); return out; }
  function png(c, btn){
    var W = 1000, P = 48, CW = W - 2 * P, r = c.render(CW), y = P;
    var head = wrapLines(c.headline, 72), parts = [];
    parts.push('<rect width="' + W + '" height="100%" fill="#F6F6F3"/>');
    parts.push('<text x="' + P + '" y="' + (y + 12) + '" font-size="13" font-weight="800" letter-spacing="1.2" fill="#B83A05">KOLABORO DATA DESK</text>'); y += 46;
    parts.push('<text x="' + P + '" y="' + y + '" font-size="30" font-weight="800" fill="#17212B">' + esc(c.title) + '</text>'); y += 18;
    head.forEach(function(l){ y += 28; parts.push('<text x="' + P + '" y="' + y + '" font-size="20" fill="#2A3541">' + esc(l) + '</text>'); }); y += 30;
    parts.push('<g transform="translate(' + P + ',' + y + ')">' + r.body + '</g>'); y += r.h + 20;
    parts.push('<line x1="' + P + '" x2="' + (W - P) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(23,33,43,.2)"/>'); y += 26;
    wrapLines(source(), 110).forEach(function(l){ parts.push('<text x="' + P + '" y="' + y + '" font-size="13" fill="#59626B">' + esc(l) + '</text>'); y += 19; });
    var H = y + P - 19;
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" font-family="' + esc(K.FONT) + '">' + parts.join('') + '</svg>';
    var img = new Image(), sc = 2;
    img.onload = function(){
      var cv = document.createElement('canvas'); cv.width = W * sc; cv.height = H * sc; var x = cv.getContext('2d'); x.scale(sc, sc); x.fillStyle = '#F6F6F3'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H);
      cv.toBlob(function(b){ if (b){ download(fname(c, 'png'), b); flash(btn, 'PNG ready'); } else flash(btn, 'Could not create the PNG'); }, 'image/png');
    };
    img.onerror = function(){ flash(btn, 'Could not create the PNG'); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  // tooltip
  var tip = document.createElement('div'); tip.className = 'dd-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; document.body.appendChild(tip);
  function showTip(e){
    var g = e.target.closest && e.target.closest('[data-tip]'); if (!g || !wrapEl.contains(g)){ tip.hidden = true; return; }
    tip.textContent = g.getAttribute('data-tip'); tip.hidden = false;
    var x = e.clientX + 14, y = e.clientY + 14, w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > window.innerWidth - 8) x = Math.max(8, e.clientX - w - 14); if (y + h > window.innerHeight - 8) y = e.clientY - h - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  wrapEl.addEventListener('pointermove', showTip); wrapEl.addEventListener('pointerdown', showTip);
  wrapEl.addEventListener('pointerleave', function(){ tip.hidden = true; }); window.addEventListener('scroll', function(){ tip.hidden = true; }, { passive: true });

  wrapEl.addEventListener('click', function(e){
    var b = e.target.closest('button[data-act]'); if (!b) return; var a = b.getAttribute('data-act'), c = b.getAttribute('data-c') && byId(b.getAttribute('data-c'));
    if (a === 'copy') copyText(numbersText(c), b);
    else if (a === 'csv'){ csv(c); flash(b, 'CSV ready'); }
    else if (a === 'png') png(c, b);
    else if (a === 'copyembed') copyText($(b.getAttribute('data-t')).value, b);
  });
  wrapEl.addEventListener('change', function(e){
    var s = e.target.closest('select[data-m]'); if (!s) return; var id = s.getAttribute('data-m');
    $('me-' + id).value = mEmbed(s.value); $('mp-' + id).href = '/embed/?m=' + encodeURIComponent(s.value);
  });

  K.load().then(function(res){
    R = res;
    $('dd-nav').innerHTML = R.charts.map(function(c){ return '<a href="#c-' + c.id + '"><b>' + c.n + '</b> ' + esc(c.title) + '</a>'; }).join('');
    wrapEl.innerHTML = R.charts.map(card).join('');
    draw();
    $('dd-facts').innerHTML = R.facts.map(function(f, i){ return '<li><p>' + esc(f) + '</p><button type="button" class="btn btn-line btn-sm" data-fact aria-label="Copy fact ' + (i + 1) + '">Copy</button><span class="dd-ok" aria-live="polite"></span></li>'; }).join('');
    $('dd-facts-src').textContent = source();
    [].forEach.call(document.querySelectorAll('[data-dd=date]'), function(el){ el.textContent = R.dateLong; });
    [].forEach.call(document.querySelectorAll('[data-dd=n]'), function(el){ el.textContent = fmt(R.N); });
    [].forEach.call(document.querySelectorAll('[data-dd=countries]'), function(el){ el.textContent = fmt(R.nCountries); });
    [].forEach.call(document.querySelectorAll('[data-dd=markets]'), function(el){ el.textContent = fmt(R.nMarkets); });
    [].forEach.call(document.querySelectorAll('[data-dd=claims]'), function(el){ el.textContent = fmt(R.claims); });
    $('dd-cite').textContent = 'Kolaboro off-plan database, kolaboro.com/press/data/, data as of ' + R.dateLong + '. ' + R.license + '.';
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(draw, 150); });
  }).catch(function(){
    wrapEl.innerHTML = '<p class="dd-err">The live data could not load right now. Try again in a minute, or use the <a href="/data/bali-cases.json">raw JSON</a> and the <a href="/docs/api#open">open API</a>.</p>';
  });
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-fact],[data-cite]'); if (!b) return;
    var txt = b.hasAttribute('data-cite') ? $('dd-cite').textContent : b.parentNode.querySelector('p').textContent + ' Source: Kolaboro, kolaboro.com/press/data/, data as of ' + (R ? R.dateLong : '') + '.';
    copyText(txt, b);
  });
})();
