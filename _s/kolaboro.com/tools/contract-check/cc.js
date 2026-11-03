/* Kolaboro contract check. Runs in the browser only: the contract is read with pdf.js (self-hosted copy),
   clauses are found by keyword rules, and optionally read by a small open-weights model (WebLLM, self-hosted
   copy of @mlc-ai/web-llm 0.2.86) running on this device's GPU. Every quote shown is checked against the
   extracted text; anything not found word for word is dropped. No request carries the contract or results. */
(function () {
  'use strict';
  var BASE = '/tools/contract-check/';
  var PDFJS = BASE + 'vendor/pdf-4.10.38.min.mjs', PDFJS_WORKER = BASE + 'vendor/pdf-4.10.38.worker.min.mjs';
  var WEBLLM = BASE + 'vendor/web-llm-0.2.86.js', LLM_WORKER = BASE + 'llm-worker.js';
  var LAW = '/tools/law/law.json';
  // Download sizes measured on 3 Nov 2026 from each model's file list on Hugging Face (weights + tokenizer + GPU library).
  var MODELS = {
    std: { name: 'Qwen2.5 1.5B Instruct', f16: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', mb: 886, vram: { f16: 1630, f32: 1889 } },
    lite: { name: 'Qwen2.5 0.5B Instruct', f16: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', mb: 295, vram: { f16: 945, f32: 1060 } }
  };

  /* ---------- the clauses we look for ---------- */
  var MONEY = /(?:\b(?:IDR|Rp\.?|USD|US\$|AED|THB|EUR|GBP|MYR|PHP|MXN)\s?\d[\d.,\s]*\d(?:\s?(?:million|billion|juta|miliar|M|bn))?|[€$£฿]\s?\d[\d.,]*\d(?:\s?(?:million|billion|M|k))?|\b\d[\d.,]*\d\s?(?:IDR|USD|AED|THB|EUR|baht|rupiah|dirhams?|euros?|dollars?)\b)/gi;
  var DATE = /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Januari|Februari|Maret|Mei|Juni|Juli|Agustus|Oktober|Desember|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janeiro|fevereiro|março|maio|junho|julho|setembro|outubro|novembro|dezembro)(?:\s+(?:de\s+)?\d{4})?|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|Q[1-4]\s?\d{4}|\d{4}-\d{2}-\d{2})\b/gi;
  var PCT = /\b\d{1,3}(?:[.,]\d+)?\s?%/g;
  var DAYS = /\b\d{1,4}\s?(?:\(\w[\w\s-]*\)\s?)?(?:calendar |working |business )?(?:days?|months?|hari|bulan|días|meses|dias)\b/gi;
  var CLAUSES = [
    { k: 'parties', label: 'Parties', ask: 'Who are the seller (developer) and the buyer? Quote the sentence that names the parties.',
      re: [[/\b(?:by and )?between\b/i, 2], [/\b(?:the )?(?:buyer|purchaser|seller|vendor|developer|first party|second party)\b/i, 1], [/hereinafter|\(the "|\("the |\(hereinafter/i, 2], [/\bpara pihak|pihak pertama|pihak kedua|penjual|pembeli\b/i, 2], [/\bentre\b.{0,80}\b(?:comprador|vendedor|promitente)/i, 3]] },
    { k: 'price', label: 'Price', ask: 'What is the total purchase price? Quote the sentence that states it.',
      re: [[/\b(?:purchase|sale|sales|selling|total|contract)\s+price\b|\bconsideration\b/i, 3], [/\bharga\s+(?:jual|pengikatan|total|unit)\b/i, 3], [/\bprecio\b|\bpreço\b/i, 2]], money: 2 },
    { k: 'payment', label: 'Payment schedule', ask: 'How and when must the buyer pay (instalments, stages, percentages)? Quote the sentence with the schedule.',
      re: [[/\binstal(?:l)?ments?\b|\bpayment (?:schedule|plan|terms)\b|\bshall pay\b|\bto be paid\b/i, 3], [/\bupon (?:signing|completion|handover|reservation)\b|\bon signing\b/i, 2], [/\btahap(?:an)? pembayaran|cicilan|angsuran|cara pembayaran\b/i, 3], [/\bplazos?\b|\bpagos?\b|\bprestações\b|\bpagamento\b/i, 2]], pct: 1 },
    { k: 'completion', label: 'Completion date', ask: 'By what date must the property be completed or handed over? Quote the sentence with the date.',
      re: [[/\b(?:completion|handover|hand-over|delivery|possession)\s+date\b/i, 3], [/\bshall (?:be )?(?:complete|deliver|hand over)|\bno later than\b|\bcompleted by\b/i, 2], [/\bserah terima\b|\btanggal penyerahan\b/i, 3], [/\bfecha de entrega\b|\bdata de entrega\b|\bconclusão da obra/i, 3]], date: 2 },
    { k: 'delay', label: 'Delay penalty', ask: 'What does the developer owe if it delivers late (penalty, compensation per day or month)? Quote that sentence.',
      re: [[/\b(?:late|delay(?:ed)?) (?:delivery|handover|completion)\b|\bper day of delay\b|\bfor each (?:day|month) of delay\b/i, 4], [/\bpenalt(?:y|ies)\b|\bliquidated damages\b|\bcompensation\b/i, 2], [/\bdenda\b|\bketerlambatan\b/i, 3], [/\bpenalizaci[oó]n\b|\bretraso\b|\bmulta\b|\batraso\b/i, 3]], pct: 1 },
    { k: 'termination', label: 'Termination and refund', ask: 'When can the buyer cancel, and what money is refunded? Quote that sentence.',
      re: [[/\bterminat(?:e|ion)\b|\bcancel(?:l?ation)?\b|\brescind|\brescission\b/i, 2], [/\brefund(?:ed|s)?\b|\breimburse|\breturn (?:of )?(?:all )?(?:the )?(?:payments|monies|amounts)\b/i, 3], [/\bnon[- ]refundable\b/i, 2], [/\bpembatalan\b|\bpengembalian (?:dana|uang)\b/i, 3], [/\bresoluci[oó]n\b|\bdevoluci[oó]n\b|\bresolução\b|\bdevolução\b/i, 3]] },
    { k: 'escrow', label: 'Escrow or protected account', ask: 'Where are the buyer\'s payments held (escrow, trust or special account, bank guarantee)? Quote that sentence.',
      re: [[/\bescrow\b/i, 5], [/\btrust account\b|\bspecial account\b|\bnotary(?:\'s)? account\b|\bclient account\b|\bproject account\b/i, 4], [/\brekening (?:bersama|escrow|penampungan|notaris)\b/i, 4], [/\bcuenta especial\b|\baval\b|\bseguro de cauci[oó]n\b|\bgarant[ií]a bancaria\b|\bgarantia bancária\b/i, 4], [/\bbank (?:account|guarantee)\b/i, 1]] },
    { k: 'title', label: 'Title type', ask: 'What land or ownership title will the buyer get (freehold, leasehold, Hak Pakai, HGB, strata title)? Quote that sentence.',
      re: [[/\bhak (?:pakai|milik|guna bangunan|sewa)\b|\b(?:SHM|SHGB|HGB|HGU)\b/i, 4], [/\bfreehold\b|\bleasehold\b|\bstrata title\b|\btitle deed\b|\bland title\b|\bchanote\b/i, 4], [/\bcertificate\b|\bsertifikat\b|\bsertipikat\b/i, 1], [/\bnota simple\b|\bregisto predial\b|\bescritura\b/i, 3], [/\blease (?:term|period)\b|\b\d{2} years?\b/i, 1]] },
    { k: 'law', label: 'Governing law', ask: 'Which country\'s law governs the contract and which court or arbitration decides disputes? Quote that sentence.',
      re: [[/\bgoverning law\b|\bgoverned by\b|\bin accordance with the laws? of\b/i, 4], [/\bjurisdiction\b|\barbitration\b|\bcourts? of\b|\bdistrict court\b/i, 2], [/\bhukum yang berlaku\b|\bpengadilan negeri\b|\bdomisili hukum\b/i, 4], [/\bley aplicable\b|\btribunales\b|\blei aplicável\b|\bforo\b/i, 3]] },
    { k: 'permit', label: 'Permits', ask: 'Which building permit or approval does the contract mention (PBG, IMB, building permit, RERA registration)? Quote that sentence.',
      re: [[/\b(?:PBG|IMB|SLF)\b/i, 4], [/\bbuilding (?:permit|approval)\b|\bplanning (?:permit|approval|permission)\b|\bconstruction permit\b/i, 4], [/\bpersetujuan bangunan gedung\b|\bizin mendirikan\b/i, 4], [/\blicencia de obras?\b|\balvará\b|\bRERA\b|\bproject registration\b/i, 3], [/\bpermit\b|\blicen[cs]e\b/i, 1]] }
  ];

  /* ---------- small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtMB(mb) { return mb >= 1000 ? (mb / 1000).toFixed(2) + ' GB' : Math.round(mb) + ' MB'; }
  function norm(s) {
    return String(s).normalize('NFKC').replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"')
      .replace(/[‐-―−]/g, '-').replace(/­/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function uniq(a) { var o = []; a.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }
  function matches(re, s) { re.lastIndex = 0; return uniq((s.match(re) || []).map(function (x) { return x.replace(/\s+/g, ' ').trim(); })); }

  /* ---------- document model: pages, full text, sentences with offsets ---------- */
  var DOC = null, LAWDB = null, LAST = null, ENGINE = null, BUSY = false, STOP = false, T0 = 0;
  function buildDoc(pages, name, kind) {
    var full = '', starts = [];
    pages.forEach(function (p, i) { starts.push(full.length); full += p + (i < pages.length - 1 ? '\n\n' : ''); });
    var sents = splitSentences(full);
    sents = sents.filter(function (x) { return full.slice(x.s, x.e).replace(/\s+/g, ' ').trim().length >= 12; }).map(function (x) {
      var t = full.slice(x.s, x.e).replace(/\s+/g, ' ').trim(), pg = 1;
      for (var i = 0; i < starts.length; i++) if (starts[i] <= x.s) pg = i + 1;
      if (t.length > 900) t = t.slice(0, 900);
      return { s: x.s, e: x.e, t: t, page: pg };
    });
    return { name: name, kind: kind, pages: pages, full: full, nfull: norm(full), npages: pages.map(norm), sents: sents };
  }
  // Sentence boundaries: a full stop (or ! ?) followed by a space and a capital, unless it ends an abbreviation or a list
  // number; a blank line; or the end of a short line with no final punctuation (a heading). PDF line wraps are kept inside.
  var ABBR = /(?:\b(?:No|Nos|Mr|Mrs|Ms|Dr|Jl|Rp|Art|Arts|Sec|Ltd|Inc|Co|Tbk|Pasal|vs|etc|approx|St|Kab|Kec|Ds|Bpk|Ibu|Sdr|Tn|Ny|Nr|Nº|Artº|e\.g|i\.e|cf|incl|ref|tel|Kel)\.|\b[A-Z]\.|(?:^|\n)\s*\(?\d{1,3}(?:\.\d{1,3})*\.)$/;
  function splitSentences(full) {
    var out = [], st = 0, n = full.length;
    function cut(e) { if (full.slice(st, e).trim()) out.push({ s: st, e: e }); st = e; }
    for (var i = 0; i < n; i++) {
      var ch = full[i];
      if ((ch === '.' || ch === '!' || ch === '?') && /\s/.test(full[i + 1] || ' ')) {
        var j = i + 1; while (j < n && /\s/.test(full[j])) j++;
        var nx = full[j] || '';
        if (ch === '.' && ABBR.test(full.slice(Math.max(st, i - 12), i + 1))) continue;
        if (nx && /[a-zà-ÿ]/.test(nx) && ch === '.') continue;
        cut(i + 1); continue;
      }
      if (ch === '\n') {
        var k = i + 1; while (k < n && (full[k] === ' ' || full[k] === '\t')) k++;
        if (full[k] === '\n') { cut(i); continue; }
        var ls = full.lastIndexOf('\n', i - 1) + 1, line = full.slice(ls, i).trim();
        if (line && line.length <= 70 && !/[.,;:!?)\-]$/.test(line) && /[A-Z0-9À-Þ("“]/.test(full[k] || '')) cut(i);
      }
    }
    cut(n);
    return out;
  }
  function pageOf(nq) {
    for (var i = 0; i < DOC.npages.length; i++) if (DOC.npages[i].indexOf(nq) >= 0) return i + 1;
    return null; // spans a page break
  }

  /* ---------- text extraction ---------- */
  var pdfjsP = null;
  function pdfjs() {
    if (!pdfjsP) pdfjsP = import(PDFJS).then(function (m) { m.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; return m; });
    return pdfjsP;
  }
  function extractPdf(buf) {
    return pdfjs().then(function (lib) {
      return lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise.then(function (pdf) {
        var n = Math.min(pdf.numPages, 200), out = [], chain = Promise.resolve();
        for (var i = 1; i <= n; i++) (function (i) {
          chain = chain.then(function () { return pdf.getPage(i); }).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
            var s = '';
            tc.items.forEach(function (it) { if (it.str !== undefined) { s += it.str; s += it.hasEOL ? '\n' : (it.str && !/\s$/.test(it.str) ? ' ' : ''); } });
            out.push(s.replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' '));
            status('Reading page ' + i + ' of ' + n + '...');
          });
        })(i);
        return chain.then(function () { return { pages: out, total: pdf.numPages }; });
      });
    });
  }

  /* ---------- keyword finder (deterministic, always runs) ---------- */
  function scoreSent(c, t) {
    var sc = 0;
    c.re.forEach(function (r) { if (r[0].test(t)) sc += r[1]; });
    if (sc === 0) return 0;
    if (c.money) { MONEY.lastIndex = 0; if (MONEY.test(t)) sc += c.money; }
    if (c.pct) { PCT.lastIndex = 0; if (PCT.test(t)) sc += c.pct; }
    if (c.date) { DATE.lastIndex = 0; if (DATE.test(t)) sc += c.date; }
    if (t.length > 500) sc -= 1;
    if (t.length <= 60 && !/[.!?:;]$/.test(t)) sc -= 3; // a heading: prefer the sentence under it
    return sc;
  }
  function ranked(c) {
    var r = [];
    DOC.sents.forEach(function (x, i) { var sc = scoreSent(c, x.t); if (c.k === 'parties' && i < 12 && sc > 0) sc += 2; if (sc > 0) r.push({ i: i, sc: sc }); });
    r.sort(function (a, b) { return b.sc - a.sc || a.i - b.i; });
    return r;
  }
  function keywordFind() {
    var res = {};
    CLAUSES.forEach(function (c) {
      var r = ranked(c), best = r[0], min = c.k === 'title' || c.k === 'permit' ? 4 : 3;
      if (!best || best.sc < min) { res[c.k] = { found: false, how: 'kw' }; return; }
      var x = DOC.sents[best.i];
      res[c.k] = { found: true, how: 'kw', quote: x.t, page: x.page, verified: true, also: r.slice(1, 3).filter(function (y) { return y.sc >= min; }).map(function (y) { return DOC.sents[y.i]; }) };
    });
    return res;
  }

  /* ---------- market detection ---------- */
  var MKT = [
    ['ID', /\b(?:IDR|Rp\.?\s?\d|rupiah|Indonesia|Bali|Lombok|Jakarta|PPJB|PPAT|notaris|Hak Pakai|Hak Milik|Hak Guna Bangunan|SHM|HGB|PBG|IMB|Kabupaten|Desa)\b/gi],
    ['AE-DU', /\b(?:AED|dirhams?|Dubai|RERA|DLD|Oqood|Land Department|Emirate)\b/gi],
    ['TH', /\b(?:THB|baht|Thailand|Thai|Bangkok|Phuket|Pattaya|Samui|Chanote|Condominium Act|juristic person)\b/gi],
    ['ES', /\b(?:España|Spain|Spanish|Marbella|Málaga|Malaga|Alicante|Madrid|Barcelona|arras|escritura|notario|Ley 38\/1999|IBI)\b/gi],
    ['PT', /\b(?:Portugal|Portuguese|Lisboa|Lisbon|Algarve|Porto|CPCV|contrato-promessa|sinal|IMT|notário)\b/gi]
  ];
  function detectMarket(text) {
    var best = null, bs = 0;
    MKT.forEach(function (m) { m[1].lastIndex = 0; var n = (text.match(m[1]) || []).length; if (n > bs) { bs = n; best = m[0]; } });
    return bs >= 2 ? best : '';
  }

  /* ---------- on-device AI ---------- */
  var GPU = null; // {ok, f16, why}
  function probeGPU() {
    if (GPU) return Promise.resolve(GPU);
    if (!('gpu' in navigator)) return Promise.resolve(GPU = { ok: false, why: 'This browser has no WebGPU.' });
    return navigator.gpu.requestAdapter({ powerPreference: 'high-performance' }).then(function (a) {
      if (!a) return GPU = { ok: false, why: 'WebGPU is present but no graphics adapter is available.' };
      return GPU = { ok: true, f16: a.features.has('shader-f16'), maxBuf: a.limits && a.limits.maxBufferSize };
    }).catch(function (e) { return GPU = { ok: false, why: 'WebGPU failed to start: ' + (e && e.message || e) }; });
  }
  function modelId(key) { var m = MODELS[key]; return GPU && GPU.f16 ? m.f16 : m.f32; }
  function cached(id) {
    if (!('caches' in window)) return Promise.resolve(false);
    return caches.open('webllm/model').then(function (c) { return c.keys(); }).then(function (ks) {
      return ks.some(function (r) { return r.url.indexOf('/' + id + '/') >= 0 && /params_shard_0\.bin/.test(r.url); });
    }).catch(function () { return false; });
  }
  function engine(key, onProg) {
    var id = modelId(key);
    if (ENGINE && ENGINE.id === id) return Promise.resolve(ENGINE.e);
    var p = ENGINE ? ENGINE.e.unload().catch(function () {}) : Promise.resolve();
    return p.then(function () { return import(WEBLLM); }).then(function (w) {
      var worker = new Worker(LLM_WORKER, { type: 'module' });
      return w.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: onProg, logLevel: 'WARN' }).then(function (e) { ENGINE = { id: id, e: e, w: worker }; return e; });
    });
  }
  var SCHEMA = JSON.stringify({ type: 'object', properties: { found: { type: 'boolean' }, quote: { type: 'string' }, summary: { type: 'string' } }, required: ['found', 'quote', 'summary'] });
  var SYS = 'You read property sale contracts and extract one clause at a time. Reply only with JSON: {"found": true or false, "quote": "...", "summary": "..."}. ' +
    'The quote must be copied exactly, character for character, from the EXCERPTS: one or two full sentences, no changes, no translation, no ellipsis. ' +
    'If the excerpts do not contain the clause, reply {"found": false, "quote": "", "summary": ""}. The summary is plain English, at most 25 words, and uses only facts in the quote.';
  function excerptsFor(c) {
    var r = ranked(c).slice(0, 5), idx = [];
    r.forEach(function (x) { [x.i - 1, x.i, x.i + 1].forEach(function (j) { if (j >= 0 && j < DOC.sents.length && idx.indexOf(j) < 0) idx.push(j); }); });
    if (c.k === 'parties') for (var j = 0; j < 6 && j < DOC.sents.length; j++) if (idx.indexOf(j) < 0) idx.push(j);
    idx.sort(function (a, b) { return a - b; });
    var out = [], len = 0, last = -2, block = '';
    idx.forEach(function (j) {
      var t = DOC.sents[j].t;
      if (len + t.length > 2600) return;
      if (j === last + 1 && block) block += ' ' + t; else { if (block) out.push(block); block = t; }
      len += t.length; last = j;
    });
    if (block) out.push(block);
    return out;
  }
  function parseJSON(s) {
    try { return JSON.parse(s); } catch (e) {}
    var m = String(s).match(/\{[\s\S]*\}/); if (m) try { return JSON.parse(m[0]); } catch (e) {}
    return null;
  }
  function digits(s) { return (String(s).match(/\d[\d.,]*/g) || []).map(function (d) { return d.replace(/[.,]/g, ''); }).filter(function (d) { return d.length; }); }
  function aiClause(e, c) {
    var ex = excerptsFor(c);
    if (!ex.length) return Promise.resolve({ found: false, how: 'ai', note: 'No passage in the text looked related, so the model was not asked.' });
    var user = 'Clause to find: ' + c.label + '. ' + c.ask + '\n\nEXCERPTS:\n' + ex.map(function (t, i) { return '[' + (i + 1) + '] ' + t; }).join('\n');
    var req = { messages: [{ role: 'system', content: SYS }, { role: 'user', content: user }], temperature: 0, max_tokens: 260, response_format: { type: 'json_object', schema: SCHEMA } };
    return e.chat.completions.create(req).catch(function () { delete req.response_format; return e.chat.completions.create(req); }).then(function (r) {
      var txt = r && r.choices && r.choices[0] && r.choices[0].message && r.choices[0].message.content || '';
      var j = parseJSON(txt);
      if (!j) return { found: false, how: 'ai', dropped: true, note: 'The model reply was not valid JSON, so it was dropped.' };
      if (!j.found || !j.quote) return { found: false, how: 'ai' };
      var q = String(j.quote).trim(), nq = norm(q);
      if (nq.length < 12 || DOC.nfull.indexOf(nq) < 0) return { found: false, how: 'ai', dropped: true, bad: q.slice(0, 300), note: 'The model quoted text that is not in your document, so its answer was dropped.' };
      var sum = String(j.summary || '').trim(), qd = digits(q), sd = digits(sum);
      var sumOk = sum && sd.every(function (d) { return qd.some(function (x) { return x.indexOf(d) >= 0; }); });
      return { found: true, how: 'ai', quote: q, page: pageOf(nq), verified: true, summary: sumOk ? sum.slice(0, 220) : '', sumDropped: !!(sum && !sumOk) };
    });
  }

  /* ---------- law notes ---------- */
  function loadLaw() { if (LAWDB) return Promise.resolve(LAWDB); return fetch(LAW).then(function (r) { return r.json(); }).then(function (j) { return LAWDB = j; }).catch(function () { return null; }); }
  function notesFor(k, mk) { if (!LAWDB || !mk) return []; return LAWDB.rules.filter(function (r) { return r.market === mk && r.topics.indexOf(k) >= 0; }); }
  function noteHTML(r) {
    var src = LAWDB.sources[r.source] || {};
    return '<div class="cc-law"><p class="cc-law-t"><b>' + esc(r.title) + '</b></p><p>' + esc(r.plain) + '</p>' +
      '<blockquote lang="' + esc(src.language || 'en') + '">' + esc(r.quote) + '</blockquote>' +
      (r.translation ? '<p class="cc-tr"><span>Our translation:</span> ' + esc(r.translation) + '</p>' : '') +
      '<p class="cc-src"><a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(src.law) + ', ' + esc(r.cite) + '</a> <span>Official text, checked ' + esc(r.checked) + '. <a href="/tools/law/#' + esc(r.id) + '">All notes</a></span></p></div>';
  }

  /* ---------- rendering ---------- */
  function status(msg, err) { var s = $('ccStatus'); s.textContent = msg || ''; s.className = 'ft-status' + (err ? ' err' : ''); }
  function chipsFor(q) {
    var ch = [];
    matches(MONEY, q).forEach(function (x) { ch.push('<span class="ft-chip hot">' + esc(x) + '</span>'); });
    matches(PCT, q).slice(0, 6).forEach(function (x) { ch.push('<span class="ft-chip">' + esc(x) + '</span>'); });
    matches(DATE, q).slice(0, 4).forEach(function (x) { ch.push('<span class="ft-chip">' + esc(x) + '</span>'); });
    matches(DAYS, q).slice(0, 3).forEach(function (x) { ch.push('<span class="ft-chip">' + esc(x) + '</span>'); });
    return ch.length ? '<div class="ft-chips" aria-label="Figures copied from the quote">' + ch.join('') + '</div>' : '';
  }
  function render() {
    if (!LAST) return;
    var mk = $('ccMarket').value, res = LAST.res, ai = LAST.ai, found = 0, dropped = 0, verified = 0, html = '';
    CLAUSES.forEach(function (c) {
      var a = ai && ai[c.k], kw = res[c.k], r = a && a.found ? a : kw;
      if (a && a.dropped) dropped++;
      if (r.found) { found++; if (r.verified) verified++; }
      var cls = r.found ? 'good' : 'note', tag;
      if (r.found) tag = '<span class="ft-tag yes">Found</span>' + (r.how === 'ai' ? '<span class="ft-tag info">On-device AI</span>' : '<span class="ft-tag info">Keyword match</span>');
      else tag = '<span class="ft-tag note">Not found</span>';
      if (ai && !ai.done && !a) tag += '<span class="ft-tag info">AI not read yet</span>';
      html += '<article class="ft-f ' + cls + ' cc-c" id="cl-' + c.k + '"><h3>' + esc(c.label) + tag + '</h3>';
      if (r.found && a && !a.found && r.how === 'kw') html += '<p class="cc-meta">The on-device model did not confirm this clause; showing the keyword match.</p>';
      if (r.found) {
        html += '<blockquote class="cc-q">' + esc(r.quote) + '</blockquote><p class="cc-meta">' + (r.page ? 'Page ' + r.page + '. ' : 'Spans a page break. ') +
          'Quote checked word for word against the text of your file' + (r.how === 'ai' ? ' (ignoring line breaks and capitals)' : '') + '.</p>' + chipsFor(r.quote);
        if (r.summary) html += '<p class="cc-sum"><b>AI summary, not checked:</b> ' + esc(r.summary) + '</p>';
        if (r.how === 'kw' && r.also && r.also.length) html += '<details class="cc-also"><summary>' + r.also.length + ' other matching passage' + (r.also.length > 1 ? 's' : '') + '</summary>' + r.also.map(function (x) { return '<blockquote class="cc-q">' + esc(x.t) + '</blockquote><p class="cc-meta">Page ' + x.page + '</p>'; }).join('') + '</details>';
      } else {
        html += '<p>' + (a ? 'Neither the on-device model nor the keyword finder found this clause.' : 'No sentence matched our keywords for this clause.') + ' That does not prove it is missing: read the contract or ask your lawyer.</p>';
      }
      if (a && a.dropped) html += '<p class="cc-drop"><b>Dropped AI answer:</b> ' + esc(a.note) + (a.bad ? ' It wrote: <q>' + esc(a.bad) + '</q>' : '') + '</p>';
      if (a && a.sumDropped) html += '<p class="cc-drop">The AI summary mentioned a number that is not in the quote, so we hid it.</p>';
      var notes = notesFor(c.k, mk);
      if (notes.length) html += '<details class="cc-laws"' + (!r.found &&(c.k === 'escrow' || c.k === 'title') ? ' open' : '') + '><summary>What the law says (' + notes.length + ')</summary>' + notes.map(noteHTML).join('') + '</details>';
      html += '</article>';
    });
    var mode = ai ? (ai.done ? 'On-device AI (' + esc(ai.model) + '), keyword match where the AI found nothing' : 'On-device AI reading...') : 'Keyword match (no AI)';
    var strip = '<div class="ft-strip"><div class="ft-stat"><b>' + found + ' / ' + CLAUSES.length + '</b><span>clauses found</span></div>' +
      '<div class="ft-stat"><b>' + verified + '</b><span>quotes checked against your file</span></div>' +
      (ai ? '<div class="ft-stat' + (dropped ? ' look' : '') + '"><b>' + dropped + '</b><span>AI answers dropped (quote not in file)</span></div>' : '') +
      '<div class="ft-stat"><b>' + DOC.pages.length + '</b><span>' + (DOC.kind === 'pdf' ? 'pages read' : 'text block') + '</span></div></div>';
    var info = '<p class="ft-file">' + esc(DOC.name) + ' &middot; ' + DOC.full.length.toLocaleString('en-US') + ' characters &middot; Method: ' + mode + (LAST.secs ? ' &middot; ' + LAST.secs + ' s' : '') + '</p>';
    var net = '<p class="cc-net" id="ccNet"></p>';
    $('ccOut').innerHTML = strip + info + net + '<div class="cc-grid">' + html + '</div>';
    $('ccOut').hidden = false; netReport();
  }
  // Requests made by this page (main thread) after the file was chosen. The model download runs in a worker and only fetches model files.
  var MARK = 0;
  function netReport() {
    var el = $('ccNet'); if (!el || !window.performance || !performance.getEntriesByType) return;
    var after = performance.getEntriesByType('resource').filter(function (e) { return e.startTime >= MARK; }).map(function (e) { try { return new URL(e.name); } catch (x) { return null; } }).filter(Boolean);
    var own = uniq(after.filter(function (u) { return u.origin === location.origin; }).map(function (u) { return u.pathname; }));
    var other = uniq(after.filter(function (u) { return u.origin !== location.origin; }).map(function (u) { return u.host; }));
    el.innerHTML = '<b>Network since you chose the file:</b> ' + (own.length ? 'from kolaboro.com, downloads of ' + own.map(esc).join(', ') + '. ' : 'nothing from kolaboro.com. ') +
      (other.length ? 'Other hosts: ' + other.map(esc).join(', ') + ' (site analytics, with this tool masked). ' : '') + 'Your contract and the results are not in any request.' +
      (ENGINE ? ' The AI model files come from huggingface.co and raw.githubusercontent.com, read from your browser cache once stored.' : '');
  }

  /* ---------- flows ---------- */
  function start(pages, name, kind) {
    DOC = buildDoc(pages, name, kind);
    var chars = DOC.full.replace(/\s/g, '').length;
    if (chars < 200) { $('ccOut').hidden = true; $('ccAi').hidden = true; status(kind === 'pdf' ? 'We found almost no text in this PDF. It is probably a scan (a picture of pages). This check needs a PDF with selectable text, or paste the text below.' : 'Paste at least a few paragraphs of the contract.', true); return; }
    var mk = detectMarket(DOC.full); $('ccMarket').value = mk; $('ccMkNote').textContent = mk ? 'Detected from the words in your contract. Change it if wrong.' : 'Pick the country to see what the law says.';
    LAST = { res: keywordFind(), ai: null };
    loadLaw().then(function () { render(); });
    render(); status('Done: keyword pass finished. Your file stayed on this device.');
    offerAI();
    if (window.kbEvent) kbEvent('contract_check', { method: 'kw' });
  }
  function onFile(f) {
    if (!f) return; MARK = performance.now(); status('Reading ' + f.name + '...');
    if (/\.txt$/i.test(f.name) || f.type === 'text/plain') { f.text().then(function (t) { start([t], f.name, 'text'); }); return; }
    if (f.size > 60 * 1024 * 1024) { status('This file is over 60 MB. Try a smaller export of the contract.', true); return; }
    f.arrayBuffer().then(function (b) { return extractPdf(new Uint8Array(b)); }).then(function (r) {
      start(r.pages, f.name + (r.total > r.pages.length ? ' (first ' + r.pages.length + ' of ' + r.total + ' pages)' : ''), 'pdf');
    }).catch(function (e) { status('Could not read this PDF: ' + (e && e.message || e) + '. If it is password protected, export an unprotected copy, or paste the text below.', true); });
  }
  function offerAI() {
    var box = $('ccAi'); box.hidden = false;
    probeGPU().then(function (g) {
      if (!g.ok) { box.innerHTML = '<h3>On-device AI is not available here</h3><p>' + esc(g.why) + ' The results below come from the keyword finder only: no AI was used. WebGPU works in recent Chrome and Edge on most laptops, and in Safari 26 or later.</p>'; return; }
      var opts = Object.keys(MODELS).map(function (k) { var m = MODELS[k], vr = m.vram[g.f16 ? 'f16' : 'f32']; return '<label class="cc-opt"><input type="radio" name="ccModel" value="' + k + '"' + (k === 'std' ? ' checked' : '') + '><span><b>' + esc(m.name) + '</b> ' + (k === 'std' ? '(recommended)' : '(lighter, less accurate)') + '<br><small>Download about ' + fmtMB(m.mb) + ' once, then stored in this browser. Needs about ' + fmtMB(vr) + ' of graphics memory. <span data-cached="' + k + '"></span></small></span></label>'; }).join('');
      box.innerHTML = '<h3>Read it with an AI model that runs on this device</h3><p>A small open-weights model (Qwen2.5 by Alibaba, Apache 2.0 licence) runs on your graphics card through WebGPU. Your contract is not sent anywhere: the only network traffic is the one-time download of the model files from Hugging Face and GitHub. Each answer must quote your contract word for word; we check every quote and drop the ones we cannot find.</p>' +
        '<div class="cc-opts">' + opts + '</div><div class="cc-btns"><button class="btn btn-hi" type="button" id="ccGo">Download and read with AI</button><button class="btn btn-line" type="button" id="ccStop" hidden>Stop</button></div><div class="cc-prog" id="ccProg" hidden><div><i id="ccBar"></i></div><p id="ccProgT" aria-live="polite"></p></div>';
      Object.keys(MODELS).forEach(function (k) { cached(modelId(k)).then(function (yes) { var s = box.querySelector('[data-cached="' + k + '"]'); if (s && yes) s.textContent = 'Already on this device.'; }); });
      $('ccGo').addEventListener('click', runAI);
      $('ccStop').addEventListener('click', function () { STOP = true; if (ENGINE) ENGINE.e.interruptGenerate(); });
    });
  }
  function prog(p, t) { $('ccProg').hidden = false; $('ccBar').style.width = Math.max(2, Math.min(100, Math.round(p * 100))) + '%'; $('ccProgT').textContent = t; }
  function runAI() {
    if (BUSY || !DOC) return;
    var key = (document.querySelector('input[name="ccModel"]:checked') || {}).value || 'std', m = MODELS[key];
    BUSY = true; STOP = false; T0 = performance.now(); $('ccGo').disabled = true; $('ccStop').hidden = false;
    prog(0, 'Starting ' + m.name + '...');
    engine(key, function (r) { prog(r.progress || 0, r.text || 'Loading model...'); }).then(function (e) {
      LAST.ai = { model: m.name, done: false }; render();
      var i = 0;
      function next() {
        if (STOP || i >= CLAUSES.length) return Promise.resolve();
        var c = CLAUSES[i++]; prog(i / CLAUSES.length, 'Reading: ' + c.label + ' (' + i + ' of ' + CLAUSES.length + ')');
        return aiClause(e, c).catch(function (err) { return { found: false, how: 'ai', dropped: true, note: 'The model failed on this clause: ' + (err && err.message || err) }; }).then(function (r) { LAST.ai[c.k] = r; render(); return next(); });
      }
      return next();
    }).then(function () {
      LAST.ai = LAST.ai || { model: m.name }; LAST.ai.done = true; LAST.secs = Math.round((performance.now() - T0) / 1000); render();
      prog(1, STOP ? 'Stopped. Clauses not read by the AI show the keyword result.' : 'Done. Every quote shown was found in your file.');
      if (window.kbEvent) kbEvent('contract_check', { method: 'ai', model: key });
    }).catch(function (e) {
      prog(0, 'The model could not run on this device: ' + (e && e.message || e) + '. The keyword results below still stand.');
      if (LAST) { LAST.ai = null; render(); }
    }).then(function () { BUSY = false; $('ccGo').disabled = false; $('ccStop').hidden = true; });
  }

  /* ---------- wire up ---------- */
  function init() {
    var drop = $('ccDrop'), inp = $('ccFile');
    inp.addEventListener('change', function () { onFile(inp.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) onFile(f); });
    $('ccSample').addEventListener('click', function () {
      MARK = performance.now(); status('Loading the sample contract...');
      fetch(BASE + 'sample-contract.pdf').then(function (r) { return r.arrayBuffer(); }).then(function (b) { return extractPdf(new Uint8Array(b)); }).then(function (r) { start(r.pages, 'sample-contract.pdf (fictional, written by Kolaboro)', 'pdf'); }).catch(function (e) { status('Could not load the sample: ' + e.message, true); });
    });
    $('ccPasteGo').addEventListener('click', function () { MARK = performance.now(); start([$('ccText').value], 'Pasted text', 'text'); });
    $('ccMarket').addEventListener('change', function () { loadLaw().then(render); });
    probeGPU().then(function (g) { var el = $('ccGpu'); if (el) el.textContent = g.ok ? 'WebGPU is available in this browser: the optional AI reading can run here.' : 'WebGPU is not available in this browser, so this page will use the keyword finder only (no AI).'; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // test hook for our own checks (no data leaves the page)
  window.__kbcc = { norm: norm, detectMarket: detectMarket, state: function () { return { doc: DOC && { pages: DOC.pages.length, chars: DOC.full.length }, last: LAST }; } };
})();
