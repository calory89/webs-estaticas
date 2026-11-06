/* PDF check page: reads the file with FileReader, runs PDFX.analyze locally, renders plain-language findings.
   Nothing is uploaded: no fetch/XHR/beacon is made with the file or anything derived from it. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var drop = $('pcDrop'), inp = $('pcFile'), st = $('pcStatus'), out = $('pcOut'), urls = [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n >= 1024 ? Math.round(n / 1024) + ' KB' : n + ' bytes'; }
  function dt(d) { if (!d) return '<span class="ft-file">not set</span>'; if (d.t == null) return esc(d.raw); var x = new Date(d.t); return esc(x.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'); }
  function pages(list) { if (!list.length) return ''; var r = [], s = list[0], p = list[0]; for (var i = 1; i <= list.length; i++) { if (list[i] === p + 1) { p = list[i]; continue; } r.push(s === p ? s : s + ' to ' + p); s = p = list[i]; } return (list.length === 1 ? 'page ' : 'pages ') + r.join(', '); }
  function finding(level, title, body, means, notProve) {
    var tag = { look: 'Look closer', note: 'Worth knowing', ok: 'Looks normal', info: 'Info' }[level];
    return '<article class="ft-f ' + level + '"><h3><span class="ft-tag ' + level + '">' + tag + '</span>' + esc(title) + '</h3>' + (body || '') +
      (means || notProve ? '<div class="ft-mean">' + (means ? '<div><b>What it means</b>' + means + '</div>' : '') + (notProve ? '<div><b>What it does not prove</b>' + notProve + '</div>' : '') + '</div>' : '') + '</article>';
  }
  function revText(r) {
    var s = r.summary, bits = [];
    if (s.contentPages.length) bits.push('changed the text or drawing of ' + pages(s.contentPages));
    if (s.images && !s.contentPages.length) bits.push('added or replaced ' + plural(s.images, 'image'));
    if (s.annots.length) bits.push('added ' + s.annots.slice(0, 4).map(function (a) { return a.replace(/ annotation/, ' note'); }).join(', ') + (s.annots.length > 4 ? ' and ' + (s.annots.length - 4) + ' more' : ''));
    if (s.sigs) bits.push('added ' + plural(s.sigs, 'signature'));
    if (s.fields && !s.sigs) bits.push('changed ' + plural(s.fields, 'form element'));
    if (s.fonts) bits.push('added ' + plural(s.fonts, 'font'));
    if (s.pagesTouched.length && !s.contentPages.length) bits.push('updated the page settings of ' + pages(s.pagesTouched) + ' (not their text)');
    if (s.info || s.xmp) bits.push('rewrote the metadata');
    if (!bits.length) bits.push('rewrote ' + plural(r.added.length + r.changed.length, 'internal object') + ' without touching page content');
    return bits.join('; ');
  }

  function render(rep, name, u8) {
    urls.forEach(function (x) { URL.revokeObjectURL(x); }); urls = [];
    if (rep.notPdf) { st.className = 'ft-status err'; st.textContent = 'This file does not start like a PDF (no %PDF header in the first kilobyte).'; out.hidden = true; return; }
    var F = [], look = 0, sigs = rep.signatures || [], revs = rep.revisions, later = revs.slice(1);
    var contentAfter = function (n) { return later.filter(function (r) { return r.n > n && (r.summary.kind === 'content' || r.summary.kind === 'annotation'); }); };

    // signatures first: they change how updates should be read
    sigs.forEach(function (s, i) {
      var label = (s.subFilter === 'ETSI.RFC3161' || s.type === 'DocTimeStamp') ? 'Document timestamp' : 'Signature';
      var who = s.name || (s.cmsNames && s.cmsNames[0]) || 'unnamed signer';
      var when = s.when && s.when.t ? new Date(s.when.t).toISOString().slice(0, 10) : null;
      var head = label + ' ' + (i + 1) + (label === 'Signature' ? ' by "' + who + '"' : '') + (when ? ', ' + when : '');
      var bodyp = '<p>Added in save ' + s.rev + '. ' + (s.coversWhole ? 'It covers the whole file.' : 'It covers the file up to byte ' + s.signedEnd.toLocaleString('en-US') + '; ' + s.after.toLocaleString('en-US') + ' bytes were added after it.') + '</p>';
      if (s.cmsNames && s.cmsNames.length) bodyp += '<p>Names in the certificates: ' + s.cmsNames.map(esc).join(', ') + '</p>';
      var ca = contentAfter(s.rev);
      if (s.digestMatch === false) {
        look++; F.push([0, finding('look', head + ': signed bytes do not match the signature', bodyp,
          'The hash of the signed part of the file is not the hash stored inside the signature. Either the signed part was changed after signing, or the signature was built incorrectly.',
          'It does not tell you what was changed. Ask for the file again, straight from the signer, and check it with an official validator.')]);
      } else if (!s.gapOk && s.inRange) {
        look++; F.push([0, finding('look', head + ': unusual signature layout', bodyp,
          'The unsigned gap in the file is not exactly the signature value. Correct signing software never does this; it is a known trick to slip unsigned content into a signed file.',
          'Some broken but harmless tools also produce it. An official validator will give a definite answer.')]);
      } else if (ca.length) {
        look++; F.push([0, finding('look', head + ': the document was changed after it was signed', bodyp + '<p>' + ca.map(function (r) { return 'Save ' + r.n + ' ' + esc(revText(r)) + '.'; }).join(' ') + '</p>',
          'What the signer approved is the earlier version. The current pages include changes made later. You can open the signed version below, under "Every save in this file".',
          'Later changes can be legitimate (a second party filling in a field, a stamp). Compare the signed version with the current one and ask who made the change.')]);
      } else {
        var extra = s.digestMatch ? '<p>The ' + esc(s.digestAlg) + ' hash of the signed bytes matches the ' + esc(s.digestKind || 'hash') + ' stored in the signature.</p>' : s.digestNote ? '<p>' + esc(s.digestNote) + '</p>' : '<p>The hash inside the signature could not be read, so it was not compared.</p>';
        F.push([2, finding(s.digestMatch ? 'ok' : 'info', head + (s.digestMatch ? ': signed part unchanged' : ''), bodyp + extra + (s.laterRevisions.length ? '<p>Later saves only added signatures, timestamps or form data, which is normal in a signing workflow.</p>' : ''),
          'The bytes this signature covers are exactly the bytes that were signed.',
          'This page does not check who signed, whether the certificate is trusted, expired or revoked. Use Adobe Acrobat Reader or an official validator (in the EU, the Commission\'s DSS validation tool) for that.')]);
      }
    });
    if (rep.docmdp === 1 && later.some(function (r) { return r.summary.kind !== 'signing'; })) {
      look++; F.push([0, finding('look', 'Certified "no changes allowed", but changed afterwards', '<p>The certifying signature forbids any change, yet later saves exist.</p>', 'The file was modified against the certifier\'s own rule.', 'It does not show whether the change matters; compare the versions.')]);
    }

    // saves
    if (!later.length) {
      F.push([3, finding('ok', 'Saved once: no incremental updates', '<p>' + (rep.linearized ? 'The file is "web optimised" (linearized), which writes two end-of-file markers in one save; that was taken into account.' : 'The file has a single end-of-file marker and one cross-reference section.') + '</p>',
        'Everything was written in one go. Nobody opened this file and appended changes to it.',
        'A document can be edited and then fully re-exported, which leaves no update trail. This check cannot tell an untouched original from a clean re-export.')]);
    } else {
      var contentRevs = later.filter(function (r) { return r.summary.kind === 'content' || r.summary.kind === 'annotation'; });
      var signedRevs = sigs.map(function (s) { return s.rev; });
      var unexplained = contentRevs.filter(function (r) { return !sigs.some(function (s) { return s.rev > r.n; }); });
      var lvl = unexplained.length ? 'look' : 'note'; if (lvl === 'look') look++;
      var lis = later.slice(0, 6).map(function (r) { return '<li>Save ' + r.n + ': ' + esc(revText(r)) + '.</li>'; }).join('') + (later.length > 6 ? '<li>' + (later.length - 6) + ' more saves, listed below.</li>' : '');
      F.push([lvl === 'look' ? 1 : 3, finding(lvl, 'Edited after it was created: ' + plural(later.length, 'later save') + ' found', '<ul>' + lis + '</ul>',
        'Someone opened the file and saved changes on top of the original. The earlier versions are still inside the file: you can open each one below.' + (signedRevs.length ? ' Saves that happen before a signature were approved by that signature.' : ''),
        'Incremental saves are normal when a file is signed, filled in, stamped or annotated. This shows what changed in the file structure, not what the old text said; open the earlier version to compare.')]);
    }
    if (rep.trailingBytes) F.push([3, finding('note', kb(rep.trailingBytes) + ' of data after the last end-of-file marker', '', 'Something was appended to the file without a proper save. Some uploaders and email systems do this; it can also hide data.', 'Most PDF readers ignore it, so it does not change what you see.')]);

    // metadata
    var I = rep.info || {}, X = rep.xmp, mrows = [], md = [];
    function cmpDate(a, b) { return a && b && a.t != null && b.t != null && Math.abs(a.t - b.t) > 120000; }
    if (X) {
      if (I.Producer && X.Producer && I.Producer.trim() !== X.Producer.trim()) md.push('Producer says "' + esc(I.Producer) + '" in one place and "' + esc(X.Producer) + '" in the other.');
      if (I.Creator && X.CreatorTool && I.Creator.trim() !== X.CreatorTool.trim()) md.push('Creating program says "' + esc(I.Creator) + '" in one place and "' + esc(X.CreatorTool) + '" in the other.');
      if (cmpDate(I.CreationDate, X.CreateDate)) md.push('Creation date differs: ' + dt(I.CreationDate) + ' versus ' + dt(X.CreateDate) + '.');
      if (cmpDate(I.ModDate, X.ModifyDate)) md.push('Modification date differs: ' + dt(I.ModDate) + ' versus ' + dt(X.ModifyDate) + '.');
    }
    var cd = I.CreationDate || (X && X.CreateDate), mdd = I.ModDate || (X && X.ModifyDate);
    if (cd && mdd && cd.t != null && mdd.t != null && mdd.t < cd.t - 120000) md.push('The modification date is earlier than the creation date.');
    var now = Date.now(); [cd, mdd].forEach(function (d) { if (d && d.t != null && d.t > now + 86400000) md.push('A date is in the future: ' + dt(d) + '.'); });
    var prods = []; revs.forEach(function (r) { if (r.info && r.info.Producer && prods.indexOf(r.info.Producer) < 0) prods.push(r.info.Producer); });
    if (prods.length > 1) md.push('The producing program changed between saves: ' + prods.map(function (p) { return '"' + esc(p) + '"'; }).join(', then ') + '.');
    if (md.length) {
      F.push([2, finding('note', 'Metadata disagrees with itself', '<ul>' + md.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>',
        'More than one program wrote to this file, or someone edited the metadata. The two copies (the classic "Info" block and the newer XMP block) normally agree when one program makes the file.',
        'Metadata is easy to change and many honest tools update only one copy. A mismatch is a question to ask, not evidence of fraud.')]);
    } else if (!rep.info && !X) {
      F.push([3, finding('info', 'No metadata at all', '', 'The file carries no producer or dates. Some tools strip metadata on purpose, including privacy tools and some online converters.', 'Missing metadata says nothing about whether the content is genuine.')]);
    } else {
      F.push([4, finding('ok', 'Metadata is consistent', '<p>' + (X ? 'The Info block and the XMP block agree on producer and dates.' : 'Only the Info block is present; nothing in it contradicts itself.') + '</p>', 'One program, or programs that kept both copies in step, wrote the metadata.', 'Consistent metadata can still be written by hand.')]);
    }

    // fonts
    var odd = rep.fontOddities || [], lf = odd.filter(function (o) { return o.kind === 'later-font'; });
    if (lf.length) {
      var byPage = {}; lf.forEach(function (o) { (byPage[o.page] = byPage[o.page] || []).push(o.font + ' (save ' + o.rev + ')'); });
      var pl = Object.keys(byPage).map(Number).sort(function (a, b) { return a - b; });
      look++;
      F.push([1, finding('look', 'Fonts added in a later save are used on ' + pages(pl), '<ul>' + pl.slice(0, 8).map(function (p) { return '<li>Page ' + p + ': ' + byPage[p].map(esc).join(', ') + '</li>'; }).join('') + (pl.length > 8 ? '<li>and ' + (pl.length - 8) + ' more pages</li>' : '') + '</ul>',
        'Text on these pages was written with fonts that did not exist in the original file. This is what typing over or adding a line to a finished PDF typically leaves behind.',
        'Filling in a form field or adding a stamp also adds fonts. Look at the earlier version of these pages to see what was added.')]);
    }
    var two = odd.filter(function (o) { return o.kind === 'two-subsets'; }), ean = odd.filter(function (o) { return o.kind === 'embedded-and-not'; }), only = odd.filter(function (o) { return o.kind === 'only-here'; });
    if (two.length || ean.length || only.length) {
      var lines = [];
      if (only.length) lines.push('<li>Fonts that appear on one page only: ' + only.slice(0, 8).map(function (o) { return esc(o.font) + ' (page ' + o.page + ')'; }).join(', ') + (only.length > 8 ? ' and ' + (only.length - 8) + ' more' : '') + '.</li>');
      if (two.length) lines.push('<li>The same font is embedded as two or more separate copies on ' + pages(Array.from(new Set(two.map(function (o) { return o.page; })))) + '. Word, Acrobat and many converters do this routinely.</li>');
      if (ean.length) lines.push('<li>The same font is used both embedded and not embedded on ' + pages(Array.from(new Set(ean.map(function (o) { return o.page; })))) + '.</li>');
      F.push([4, finding('info', 'Font patterns', '<ul>' + lines.join('') + '</ul>', 'Pages that use a font no other page uses can be a cover page, a table or a pasted-in section. Compare them with the rest.', 'On their own these patterns are common in genuine files.')]);
    }

    // fonts mixed inside one line (batch 10)
    var ml = rep.mixedLines || [], mlr = ml.filter(function (l) { return l.rare && l.rare.length; });
    if (ml.length) {
      var mlRow = function (l) {
        var t = l.parts && l.parts.every(function (x) { return x.text != null; }) ? l.parts.map(function (x) { return '<span class="ft-mx' + (l.rare.indexOf(x.fam) >= 0 ? ' hot' : '') + '" title="' + esc(x.fam) + '">' + esc(x.text) + '</span>'; }).join('') : '<i>text not readable as plain characters</i>';
        return '<li>Page ' + l.page + ': ' + t + ' <span class="ft-file">(' + l.fams.map(esc).join(' + ') + ')</span></li>';
      };
      var show = (mlr.length ? mlr : ml).slice(0, 8);
      if (mlr.length) look++;
      F.push([mlr.length ? 1 : 4, finding(mlr.length ? 'look' : 'info', mlr.length ? plural(mlr.length, 'line') + ' mix in a font used almost nowhere else' : plural(rep.mixedLinesTotal || ml.length, 'line') + ' use two font families',
        '<ul>' + show.map(mlRow).join('') + ((mlr.length || ml.length) > 8 ? '<li>and ' + ((mlr.length || ml.length) - 8) + ' more</li>' : '') + '</ul><p class="ft-file">Highlighted: text in a font family that appears on 3 lines or fewer in the whole file. Bold and italic of the same family count as one family.</p>',
        mlr.length ? 'Part of a line was written in a different font from the words around it. When someone types over a price, a date or a name in a finished PDF, the editor usually cannot reuse the original font, so the new words come out in another one.' : 'Lines that switch font family part-way. In genuine files this is common for labels, numbers in tables or symbols.',
        'A different font alone is not proof of an edit: templates mix fonts on purpose. Compare the highlighted words with an earlier copy of the document.')]);
    } else if (rep.lineScan && rep.lineScan.lines) {
      F.push([4, finding('ok', 'No line mixes font families', '<p>' + plural(rep.lineScan.lines, 'printed line') + ' on ' + plural(rep.lineScan.pages, 'page') + ' checked' + (rep.lineScan.approx ? ' (some page content could not be decoded)' : '') + '.</p>', 'Each line is written in one font family (bold and italic count as the same family).', 'An edit made with the same font, or a page that was scanned or rebuilt, leaves no font trace.')]);
    }

    // active content
    var A = rep.active || {}, al = [];
    if (A.js || A.jsNames) al.push('JavaScript (' + (A.js || 1) + ' script' + ((A.js || 1) === 1 ? '' : 's') + (A.jsWhere && A.jsWhere.length ? ', ' + esc(A.jsWhere.join(', ')) : '') + ')');
    if (A.launch) al.push('an action that launches a program or file');
    if (A.submit) al.push('a form that submits data to an address');
    if (A.importData) al.push('an action that imports data');
    if (A.openAction && A.openAction !== 'go to a page' && A.openAction !== 'GoTo') al.push('an action that runs when the file opens (' + esc(A.openAction) + ')');
    if (A.richMedia) al.push('embedded media');
    if (al.length) { look++; F.push([1, finding('look', 'Active content: ' + al.join(', '), '', 'The file can do things when opened in a full PDF reader. Contracts and booking confirmations almost never need this.', 'Not every script is malicious; some forms use scripts to calculate totals. Open it in a viewer that does not run scripts, such as a browser.')]); }
    if (A.files && A.files.length) F.push([2, finding('note', plural(A.files.length, 'attached file') + ' inside the PDF', '<div class="ft-chips">' + A.files.slice(0, 20).map(function (f) { return '<span class="ft-chip">' + esc(f) + '</span>'; }).join('') + '</div>', 'Files are carried inside this PDF and are not visible on the pages. Check what they are before opening them.', 'Attachments are a normal PDF feature, for example invoices with XML data.')]);
    if (A.fields || A.xfa) F.push([3, finding('info', 'Fillable form: ' + plural(A.fields || 0, 'top-level field') + (A.xfa ? ', XFA form' : ''), '', 'Some values on the pages come from form fields, which anyone can change in a PDF reader without leaving a trace in the page text.', 'Form fields are normal in application forms and reservation forms.')]);
    var ann = A.annots || {}, annK = Object.keys(ann).filter(function (k) { return k !== 'Link' && k !== 'Widget' && k !== 'Popup'; });
    if (annK.length) F.push([3, finding('info', 'Annotations on the pages', '<div class="ft-chips">' + annK.map(function (k) { return '<span class="ft-chip' + (/FreeText|Stamp|Redact|Square/.test(k) ? ' hot' : '') + '">' + esc(k) + ' &times; ' + ann[k] + '</span>'; }).join('') + '</div>', 'Annotations sit on top of the page. A "FreeText" box or a white "Square" can cover printed text and show something else.', 'Comments, highlights and stamps are routine in reviewed documents.')]);
    if (A.uris && A.uris.length) {
      var doms = {}; A.uris.forEach(function (u) { var m = /^[a-z][a-z0-9+.-]*:\/\/([^\/?#:]+)/i.exec(u) || /^mailto:[^@]*@([^?]+)/i.exec(u); var d = m ? m[1].toLowerCase() : u.slice(0, 40); doms[d] = (doms[d] || 0) + 1; });
      F.push([5, finding('info', plural(A.uris.length, 'link') + ' to ' + plural(Object.keys(doms).length, 'address', 'addresses'), '<div class="ft-chips">' + Object.keys(doms).slice(0, 20).map(function (d) { return '<span class="ft-chip">' + esc(d) + '</span>'; }).join('') + '</div>', 'Check that payment or "verify here" links point to the developer\'s real domain.', 'Links are not followed or checked here.')]);
    }
    if (rep.encrypted) F.push([2, finding('note', 'The file is encrypted', '', 'Text inside the file is scrambled, so metadata, fonts and scripts may be incomplete above. Saves and signatures were still checked from the raw structure.', 'Encryption with an empty password is common for "no copying" restrictions and says nothing about authenticity.')]);
    if (rep.warnings.length) F.push([6, finding('info', 'Parts this tool could not read', '<ul>' + rep.warnings.slice(0, 6).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>', 'Findings above may be incomplete for these parts.', '')]);

    F.sort(function (a, b) { return a[0] - b[0]; });

    // stats strip
    var h = '<p class="ft-file">' + esc(name) + ' &middot; ' + kb(rep.size) + ' &middot; PDF ' + esc(rep.header) + ' &middot; ' + plural(rep.pages || 0, 'page') + ' &middot; ' + rep.objects.toLocaleString('en-US') + ' objects &middot; analysed in your browser</p>';
    h += '<div class="ft-strip">' +
      '<div class="ft-stat' + (later.length ? ' look' : '') + '"><b>' + revs.length + '</b><span>' + (revs.length === 1 ? 'save' : 'saves (original + ' + later.length + ')') + '</span></div>' +
      '<div class="ft-stat' + (sigs.some(function (s) { return s.digestMatch === false; }) ? ' look' : '') + '"><b>' + sigs.length + '</b><span>signatures and timestamps</span></div>' +
      '<div class="ft-stat"><b>' + (rep.fonts || []).length + '</b><span>fonts in use</span></div>' +
      '<div class="ft-stat' + (look ? ' look' : '') + '"><b>' + look + '</b><span>' + (look === 1 ? 'thing to look at' : 'things to look at') + '</span></div></div>';
    h += '<h2 class="ft-h">Findings</h2>' + F.map(function (f) { return f[1]; }).join('');

    // timeline of saves with "open this version"
    h += '<h2 class="ft-h">Every save in this file</h2><ol class="ft-tl">';
    revs.forEach(function (r, i) {
      var isLook = i > 0 && (r.summary.kind === 'content' || r.summary.kind === 'annotation');
      var sigHere = sigs.filter(function (s) { return s.rev === r.n; }).length;
      var blob = new Blob([u8.subarray(0, r.end)], { type: 'application/pdf' }), url = URL.createObjectURL(blob); urls.push(url);
      var meta = r.info ? [r.info.Producer ? 'producer "' + esc(r.info.Producer) + '"' : '', r.info.ModDate ? 'modified ' + dt(r.info.ModDate) : r.info.CreationDate ? 'created ' + dt(r.info.CreationDate) : ''].filter(Boolean).join(', ') : '';
      h += '<li class="' + (isLook ? 'look' : '') + '"><span class="n">' + r.n + '</span><div><b>' + (i === 0 ? 'Original' : 'Save ' + r.n) + '</b> &middot; bytes ' + r.start.toLocaleString('en-US') + ' to ' + r.end.toLocaleString('en-US') + (sigHere ? ' &middot; ' + plural(sigHere, 'signature') : '') +
        '<p>' + (i === 0 ? 'The first version of the file' + (rep.pages ? '' : '') : esc(revText(r))) + (meta ? '. Metadata in this save: ' + meta : '') + '.</p>' +
        (revs.length > 1 ? '<a href="' + url + '" download="' + esc(name.replace(/\.pdf$/i, '')) + '-save-' + r.n + '.pdf">Open this version (' + kb(r.end) + ')</a>' : '') + '</div></li>';
    });
    h += '</ol>';
    if (revs.length > 1) h += '<p class="ft-file">Each earlier version is cut from your own file in the browser: an incremental save only appends, so the bytes up to each end-of-file marker are that version.</p>';

    // metadata table
    function row(k, a, b, diff) { return '<tr><th scope="row">' + k + '</th><td' + (diff ? ' class="diff"' : '') + '>' + a + '</td><td' + (diff ? ' class="diff"' : '') + '>' + b + '</td></tr>'; }
    h += '<details class="ft-more"' + (md.length ? ' open' : '') + '><summary>Metadata: Info block and XMP block side by side</summary><div class="ft-tw"><table class="ft-t"><thead><tr><th>Field</th><th>Info block</th><th>XMP block</th></tr></thead><tbody>' +
      row('Producer', esc(I.Producer || '-'), esc(X ? X.Producer || '-' : 'no XMP'), X && I.Producer && X.Producer && I.Producer.trim() !== X.Producer.trim()) +
      row('Creating program', esc(I.Creator || '-'), esc(X ? X.CreatorTool || '-' : ''), X && I.Creator && X.CreatorTool && I.Creator.trim() !== X.CreatorTool.trim()) +
      row('Created', I.CreationDate ? dt(I.CreationDate) : '-', X && X.CreateDate ? dt(X.CreateDate) : '-', X && cmpDate(I.CreationDate, X.CreateDate)) +
      row('Modified', I.ModDate ? dt(I.ModDate) : '-', X && X.ModifyDate ? dt(X.ModifyDate) : '-', X && cmpDate(I.ModDate, X.ModifyDate)) +
      row('Author', esc(I.Author || '-'), '', false) + row('Title', esc(I.Title || '-'), '', false) +
      '</tbody></table></div>' +
      (X && X.history && X.history.length ? '<p class="ft-file" style="margin-top:10px">XMP edit history: ' + X.history.map(function (e) { return esc([e.action, e.agent, e.when].filter(Boolean).join(' ')); }).join('; ') + '</p>' : '') + '</details>';

    // fonts per page
    var pf = rep.pageFonts || [];
    h += '<details class="ft-more"><summary>Fonts on each page (' + pf.length + ' pages)</summary><div class="ft-tw"><table class="ft-t"><thead><tr><th>Page</th><th>Fonts used</th></tr></thead><tbody>' +
      pf.slice(0, 400).map(function (p) {
        return '<tr><td class="num">' + p.n + '</td><td><div class="ft-chips">' + (p.fonts.length ? p.fonts.map(function (f) {
          var hot = lf.some(function (o) { return o.page === p.n && o.font === f.name; });
          return '<span class="ft-chip' + (hot ? ' hot' : '') + '">' + esc(f.name) + (f.subset ? ' <small>' + esc(f.subset) + '</small>' : '') + (f.embedded ? '' : ' <small>not embedded</small>') + (f.rev ? ' <small>save ' + (f.rev + 1) + '</small>' : '') + '</span>';
        }).join('') : '<span class="ft-file">no text fonts (image or drawing only)</span>') + (p.approx ? ' <small class="ft-file">(listed from page resources: content not decoded)</small>' : '') + '</div></td></tr>';
      }).join('') + '</tbody></table></div></details>';

    // technical
    h += '<details class="ft-more"><summary>Technical details</summary><div class="ft-tw"><table class="ft-t"><tbody>' +
      [['PDF version in header', esc(rep.header)], ['File size', rep.size.toLocaleString('en-US') + ' bytes'], ['Objects found', rep.objects.toLocaleString('en-US')],
       ['End-of-file markers (%%EOF)', rep.eofCount], ['Cross-reference tables / streams', rep.xrefTables + ' / ' + rep.xrefStreams], ['Linearized (web optimised)', rep.linearized ? 'yes' + (rep.linearizedLength === rep.size ? ', length matches the file' : ', declared length ' + rep.linearizedLength + ' differs from the file size') : 'no'],
       ['Encrypted', rep.encrypted ? 'yes' : 'no'], ['Document ID (original / this version)', rep.ids ? esc(rep.ids[0]) + '<br>' + esc(rep.ids[1]) + (rep.ids[0] !== rep.ids[1] ? ' <span class="ft-file">(differ: the writer marked the file as changed since it was first made)</span>' : '') : '-']]
        .map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table></div></details>';

    out.innerHTML = h; out.hidden = false;
    st.className = 'ft-status'; st.textContent = 'Done. ' + (look ? plural(look, 'thing') + ' to look at.' : 'Nothing that needs a closer look.');
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handle(file) {
    if (!file) return;
    if (file.size > 150 * 1048576) { st.className = 'ft-status err'; st.textContent = 'This file is over 150 MB; the check runs in your browser memory, so please use a smaller file.'; return; }
    st.className = 'ft-status'; st.textContent = 'Reading ' + file.name + ' in your browser...';
    try {
      var buf = new Uint8Array(await file.arrayBuffer());
      var t0 = performance.now(), rep = await window.PDFX.analyze(buf);
      render(rep, file.name || 'file.pdf', buf);
      if (!rep.notPdf) st.textContent += ' (' + Math.round(performance.now() - t0) + ' ms)';
    } catch (e) {
      st.className = 'ft-status err'; st.textContent = 'This file could not be analysed. It may be damaged or use a structure this tool does not read yet.';
      out.hidden = true;
    }
  }
  inp.addEventListener('change', function () { handle(inp.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) handle(f); });
  document.querySelectorAll('[data-sample]').forEach(function (b) {
    b.addEventListener('click', function () {
      st.className = 'ft-status'; st.textContent = 'Loading the sample from this site...';
      fetch(b.getAttribute('data-sample')).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (bl) { handle(new File([bl], b.getAttribute('data-name'), { type: 'application/pdf' })); })
        .catch(function () { st.className = 'ft-status err'; st.textContent = 'The sample could not be loaded.'; });
    });
  });
})();
