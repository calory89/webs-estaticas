/* Kolaboro PDF tamper check, compact widget (batch 10, b10a) for /check/ and the portal permit upload.
   KBPDF.box(el)            renders a file picker plus findings into el
   KBPDF.check(file, el)    checks one File and writes the findings into el
   Runs /tools/pdf-check/pdfx.js in the browser. Nothing is uploaded: this file makes no request with the PDF or anything
   derived from it (the only request is loading pdfx.js itself). The full report is at /tools/pdf-check/. */
(function (G) {
  'use strict';
  if (G.KBPDF) return;
  var ENGINE = '/tools/pdf-check/pdfx.js?v=b10a1', ld = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function day(d) { return d && d.t != null ? new Date(d.t).toISOString().slice(0, 10) : d && d.raw ? d.raw : null; }
  function css() {
    if (document.getElementById('kbpdf-css')) return;
    var s = document.createElement('style'); s.id = 'kbpdf-css';
    s.textContent = '.kbp{display:grid;gap:8px;margin-top:10px}.kbp-f{border:1px solid var(--line,#D8D6CE);border-left-width:4px;border-radius:10px;padding:10px 12px;background:var(--card,#fff);font-size:.93rem}' +
      '.kbp-f.look{border-left-color:#B42318}.kbp-f.note{border-left-color:#B7791F}.kbp-f.ok{border-left-color:#0B7A55}.kbp-f.info{border-left-color:var(--line,#D8D6CE)}' +
      '.kbp-f b{display:block;margin-bottom:2px}.kbp-f p{margin:4px 0 0;color:var(--ink-2,#333)}.kbp-t{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;margin-right:6px}' +
      '.kbp-f.look .kbp-t{color:#B42318}.kbp-f.note .kbp-t{color:#8a5300}.kbp-f.ok .kbp-t{color:#0B7A55}.kbp-f.info .kbp-t{color:var(--muted,#666)}' +
      '.kbp-mx{border-radius:4px;padding:0 2px}.kbp-mx.hot{background:#FFE7DB;color:#7a1d00;outline:1px solid #F7B697}.kbp-m{font-size:.85rem;color:var(--muted,#666);margin:6px 0 0}' +
      '.kbp-box input[type=file]{min-height:44px;font:inherit;max-width:100%}.kbp-box label{font-weight:700;display:block;margin-bottom:6px}' +
      '.kbp-head{font-weight:800;margin:4px 0 0}.kbp ul{margin:4px 0 0 18px;padding:0}.kbp li{margin:2px 0;overflow-wrap:anywhere}';
    document.head.appendChild(s);
  }
  function engine() {
    if (G.PDFX) return Promise.resolve(G.PDFX);
    if (ld) return ld;
    ld = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = ENGINE; s.onload = function () { G.PDFX ? ok(G.PDFX) : no(new Error('engine')); }; s.onerror = function () { ld = null; no(new Error('engine')); }; document.head.appendChild(s); });
    return ld;
  }
  function f(level, title, body) {
    var tag = { look: 'Look closer', note: 'Worth knowing', ok: 'Looks normal', info: 'Info' }[level];
    return '<div class="kbp-f ' + level + '"><b><span class="kbp-t">' + tag + '</span>' + esc(title) + '</b>' + (body || '') + '</div>';
  }
  function findings(rep) {
    var F = [], revs = rep.revisions || [], later = revs.slice(1), sigs = rep.signatures || [];
    // signatures
    sigs.forEach(function (s, i) {
      var nm = s.name || (s.cmsNames && s.cmsNames[0]) || 'unnamed signer', when = day(s.when);
      var head = (s.type === 'DocTimeStamp' ? 'Timestamp ' : 'Signature ') + (i + 1) + (s.type === 'DocTimeStamp' ? '' : ' by "' + nm + '"') + (when ? ', ' + when : '');
      var after = later.filter(function (r) { return r.n > s.rev && (r.summary.kind === 'content' || r.summary.kind === 'annotation'); });
      if (s.digestMatch === false) F.push([0, f('look', head + ': the signed bytes do not match the signature', '<p>The signed part of the file was changed after signing, or the signature was built incorrectly.</p>')]);
      else if (!s.gapOk && s.inRange) F.push([0, f('look', head + ': unusual signature layout', '<p>The unsigned gap is not exactly the signature value, a known way to slip unsigned content into a signed file.</p>')]);
      else if (after.length) F.push([0, f('look', head + ': the document was changed after it was signed', '<p>' + after.map(function (r) { return 'Save ' + r.n + (r.summary.contentPages.length ? ' changed the text of page ' + r.summary.contentPages.join(', ') : ' added notes or stamps'); }).join('; ') + '. What the signer approved is the earlier version.</p>')]);
      else F.push([3, f(s.digestMatch ? 'ok' : 'info', head + (s.digestMatch ? ': signed part unchanged' : ''), '<p>' + (s.digestMatch ? 'The ' + esc(s.digestAlg) + ' hash of the signed bytes matches the hash inside the signature.' : 'The hash inside the signature could not be read, so it was not compared.') + ' This does not check whether the certificate is trusted; use an official validator for that.</p>')]);
    });
    if (!sigs.length) F.push([5, f('info', 'No digital signature', '<p>The file carries no embedded signature, so nothing inside it proves who issued it. A scanned stamp or signature image is not a digital signature.</p>')]);
    // saves (incremental updates)
    var edits = later.filter(function (r) { return r.summary.kind !== 'signing'; });
    if (!later.length) F.push([4, f('ok', 'Saved once: no later edits inside the file', '<p>' + (rep.linearized ? 'Web-optimised file (two end markers in one save), taken into account.' : 'One end-of-file marker: nobody saved changes on top of the original.') + '</p>')]);
    else if (edits.length) {
      var cp = []; edits.forEach(function (r) { r.summary.contentPages.forEach(function (p) { if (cp.indexOf(p) < 0) cp.push(p); }); });
      F.push([cp.length ? 1 : 2, f(cp.length ? 'look' : 'note', plural(edits.length, 'later save') + ' on top of the original' + (cp.length ? ', changing page ' + cp.sort(function (a, b) { return a - b; }).join(', ') : ''),
        '<p>Someone opened the file and saved changes after it was first made. The earlier version is still inside the file: open the full check to see it page by page.</p>')]);
    } else F.push([4, f('ok', 'Later saves only added signatures or timestamps', '<p>Normal for a document signed by several parties.</p>')]);
    // metadata
    var I = rep.info || {}, X = rep.xmp || null, prod = I.Producer || (X && X.Producer), crea = I.Creator || (X && X.CreatorTool);
    var c = I.CreationDate || (X && X.CreateDate), m = I.ModDate || (X && X.ModifyDate), md = [];
    if (prod || crea) md.push('Made with: ' + esc([crea, prod].filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' / ')) + '.');
    if (c) md.push('Created ' + esc(day(c)) + (m ? ', last modified ' + esc(day(m)) : '') + '.');
    var gap = c && m && c.t != null && m.t != null ? Math.round((m.t - c.t) / 864e5) : null;
    var odd = /photoshop|gimp|illustrator|inkscape|ilovepdf|smallpdf|sejda|pdf-xchange|foxit phantom|pdfescape|pdffiller|canva|word|libreoffice|nitro|pdfelement|acrobat pro/i.test((prod || '') + ' ' + (crea || ''));
    var mism = X && I.Producer && X.Producer && I.Producer.trim() !== X.Producer.trim();
    if (!prod && !crea && !c) F.push([5, f('info', 'No metadata', '<p>No producer or dates. Some tools strip them on purpose; missing metadata proves nothing either way.</p>')]);
    else F.push([gap != null && gap > 1 || mism ? 2 : 5, f(gap != null && gap > 1 || mism ? 'note' : 'info', 'Producer and dates', '<p>' + md.join(' ') + '</p>' +
      (gap != null && gap > 1 ? '<p>Modified ' + plural(gap, 'day') + ' after it was created. An official permit printed from a government system is usually created and saved once.</p>' : '') +
      (mism ? '<p>The two metadata blocks name different producers ("' + esc(I.Producer) + '" and "' + esc(X.Producer) + '"): a second program rewrote the file.</p>' : '') +
      (odd ? '<p>The program named is a general office or PDF editor, not an issuing system. That is normal for a contract, less so for a document said to come from an authority.</p>' : ''))]);
    // fonts mixed inside one line
    var ml = rep.mixedLines || [], mr = ml.filter(function (l) { return l.rare && l.rare.length; });
    if (mr.length) F.push([1, f('look', plural(mr.length, 'line') + ' mix in a font used almost nowhere else', '<ul>' + mr.slice(0, 5).map(function (l) {
      var t = l.parts && l.parts.every(function (x) { return x.text != null; }) ? l.parts.map(function (x) { return '<span class="kbp-mx' + (l.rare.indexOf(x.fam) >= 0 ? ' hot' : '') + '" title="' + esc(x.fam) + '">' + esc(x.text) + '</span>'; }).join('') : '<i>text not readable as plain characters</i>';
      return '<li>Page ' + l.page + ': ' + t + ' (' + l.fams.map(esc).join(' + ') + ')</li>'; }).join('') + '</ul><p>Typing over a price, date or name in a finished PDF usually leaves the new words in another font. Not proof on its own: compare with an earlier copy.</p>')]);
    else if (ml.length) F.push([5, f('info', plural(rep.mixedLinesTotal || ml.length, 'line') + ' use two font families', '<p>Each family is also used elsewhere in the file, which is common for labels and tables.</p>')]);
    else if (rep.lineScan && rep.lineScan.lines) F.push([5, f('ok', 'No line mixes font families', '<p>' + plural(rep.lineScan.lines, 'printed line') + ' checked.</p>')]);
    else if (rep.lineScan && !rep.lineScan.lines && rep.pages) F.push([5, f('info', 'No text layer', '<p>The pages hold no text, only images (a scan or a photo saved as PDF), so fonts cannot be compared. Ask for the digital original.</p>')]);
    var lf = (rep.fontOddities || []).filter(function (o) { return o.kind === 'later-font'; });
    if (lf.length) F.push([1, f('look', 'Fonts added in a later save are used on page ' + lf.map(function (o) { return o.page; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', '), '<p>Text on these pages uses fonts that did not exist in the original file.</p>')]);
    var A = rep.active || {};
    if (A.js || A.launch || A.submit) F.push([1, f('look', 'Active content (scripts or actions)', '<p>A permit or contract almost never needs this. Open it in a browser viewer, not a full PDF reader.</p>')]);
    if (rep.encrypted) F.push([3, f('note', 'Encrypted file', '<p>Metadata and fonts may be incomplete above; saves and signatures were checked from the raw structure.</p>')]);
    F.sort(function (a, b) { return a[0] - b[0]; });
    return F.map(function (x) { return x[1]; }).join('');
  }
  function check(file, el) {
    css();
    if (!file) { el.innerHTML = ''; return Promise.resolve(null); }
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name || '')) { el.innerHTML = ''; return Promise.resolve(null); }
    el.innerHTML = '<p class="kbp-m" aria-live="polite">Checking the PDF structure in your browser...</p>';
    return Promise.all([engine(), file.arrayBuffer()]).then(function (x) { return x[0].analyze(new Uint8Array(x[1])); }).then(function (rep) {
      if (rep.notPdf) { el.innerHTML = '<div class="kbp">' + f('look', 'This is not a valid PDF', '<p>The file has no PDF header.</p>') + '</div>'; return rep; }
      var n = (rep.revisions || []).length;
      el.innerHTML = '<p class="kbp-head">Tamper check: ' + esc(file.name || 'PDF') + ' (' + plural(rep.pages || 0, 'page') + ', ' + plural(n, 'save') + ')</p><div class="kbp">' + findings(rep) + '</div>' +
        '<p class="kbp-m">Checked on this device; the file was not uploaded for this check. Full report with every save and font: <a href="/tools/pdf-check/">PDF check</a>.</p>';
      return rep;
    }).catch(function () { el.innerHTML = '<p class="kbp-m">The PDF could not be checked in this browser. Try the <a href="/tools/pdf-check/">full PDF check</a>.</p>'; return null; });
  }
  function box(el) {
    css();
    var id = 'kbp' + Math.random().toString(36).slice(2, 8);
    el.classList.add('kbp-box');
    el.innerHTML = '<label for="' + id + '">Choose a permit, contract or payment receipt (PDF)</label><input type="file" id="' + id + '" accept="application/pdf,.pdf"><div class="kbp-o" aria-live="polite"></div>';
    var inp = el.querySelector('input'), o = el.querySelector('.kbp-o');
    inp.addEventListener('change', function () { check(inp.files[0], o); });
  }
  G.KBPDF = { check: check, box: box };
  [].forEach.call(document.querySelectorAll('[data-kbpdf]'), box);
})(window);
