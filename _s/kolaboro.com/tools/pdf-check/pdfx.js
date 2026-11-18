/* Kolaboro PDF forensics engine. Runs entirely in the browser (or Node 18+): no network, no third-party code.
   PDFX.analyze(Uint8Array) -> Promise<report>. It reads the raw file structure itself:
   - every "N G obj" in file order (stream bodies skipped), objects inside object streams, every %%EOF and trailer;
   - the bytes between two %%EOF markers are one save (revision), so later revisions are incremental updates;
   - the latest version of each object (later in the file wins, as in an incremental update) gives the page tree,
     fonts, metadata, forms, scripts, attachments and signatures;
   - signatures: ByteRange coverage, gap position, and the CMS messageDigest compared with a hash of the signed bytes. */
(function (G) {
  'use strict';
  var WS = '\0\t\n\f\r ', DELIM = '()<>[]{}/%';
  function isWS(c) { return WS.indexOf(c) >= 0; }
  function isReg(c) { return c !== undefined && c !== '' && WS.indexOf(c) < 0 && DELIM.indexOf(c) < 0; }
  function latin1(u8) { var s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return s; }
  function Ref(n, g) { this.r = n; this.g = g; }
  function Str(s, hex) { this.s = s; this.hex = hex; }

  /* ---------- object parser on a latin1 string ---------- */
  function Parser(S) { this.S = S; }
  Parser.prototype.skip = function (p) {
    var S = this.S, n = S.length;
    for (;;) {
      while (p < n && isWS(S[p])) p++;
      if (S[p] === '%') { while (p < n && S[p] !== '\n' && S[p] !== '\r') p++; continue; }
      return p;
    }
  };
  var REF_RE = /(\d+)[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+R(?![^\0\t\n\f\r ()<>\[\]{}\/%])/y;
  Parser.prototype.value = function (p, depth) {
    var S = this.S; depth = depth || 0;
    if (depth > 60) throw new Error('nesting');
    p = this.skip(p);
    var c = S[p];
    if (c === undefined) throw new Error('eof');
    if (c === '<' && S[p + 1] === '<') {
      var d = Object.create(null); p += 2;
      for (;;) {
        p = this.skip(p);
        if (S[p] === '>' && S[p + 1] === '>') return { v: d, p: p + 2 };
        if (S[p] !== '/') { if (p >= S.length) throw new Error('eof'); var junk = this.value(p, depth + 1); p = junk.p; continue; }
        var k = this.value(p, depth + 1); p = k.p;
        var vv = this.value(p, depth + 1); p = vv.p;
        d[k.v.slice(1)] = vv.v;
      }
    }
    if (c === '[') {
      var a = []; p++;
      for (;;) {
        p = this.skip(p);
        if (S[p] === ']') return { v: a, p: p + 1 };
        if (p >= S.length) throw new Error('eof');
        var e = this.value(p, depth + 1); a.push(e.v); p = e.p;
      }
    }
    if (c === '/') {
      var q = p + 1; while (q < S.length && isReg(S[q])) q++;
      var nm = S.slice(p + 1, q).replace(/#([0-9a-fA-F]{2})/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); });
      return { v: '/' + nm, p: q };
    }
    if (c === '(') {
      var out = '', lvl = 1; p++;
      while (p < S.length) {
        var ch = S[p++];
        if (ch === '\\') {
          var nx = S[p++];
          if (nx === 'n') out += '\n'; else if (nx === 'r') out += '\r'; else if (nx === 't') out += '\t'; else if (nx === 'b') out += '\b'; else if (nx === 'f') out += '\f';
          else if (nx === '\r') { if (S[p] === '\n') p++; } else if (nx === '\n') {}
          else if (nx >= '0' && nx <= '7') { var o = nx; while (o.length < 3 && S[p] >= '0' && S[p] <= '7') o += S[p++]; out += String.fromCharCode(parseInt(o, 8) & 255); }
          else out += nx;
        } else if (ch === '(') { lvl++; out += ch; } else if (ch === ')') { if (--lvl === 0) break; out += ch; } else out += ch;
      }
      return { v: new Str(out, false), p: p };
    }
    if (c === '<') {
      var end = S.indexOf('>', p); if (end < 0) throw new Error('eof');
      var hx = S.slice(p + 1, end).replace(/[^0-9a-fA-F]/g, ''); if (hx.length % 2) hx += '0';
      var bs = ''; for (var i = 0; i < hx.length; i += 2) bs += String.fromCharCode(parseInt(hx.substr(i, 2), 16));
      return { v: new Str(bs, true), p: end + 1 };
    }
    if ((c >= '0' && c <= '9') || c === '-' || c === '+' || c === '.') {
      REF_RE.lastIndex = p; var m = REF_RE.exec(S);
      if (m) return { v: new Ref(+m[1], +m[2]), p: REF_RE.lastIndex };
      var q2 = p + 1; while (q2 < S.length && /[0-9.\-+eE]/.test(S[q2])) q2++;
      return { v: parseFloat(S.slice(p, q2)) || 0, p: q2 };
    }
    var q3 = p; while (q3 < S.length && isReg(S[q3])) q3++;
    if (q3 === p) throw new Error('bad token');
    var w = S.slice(p, q3);
    return { v: w === 'true' ? true : w === 'false' ? false : w === 'null' ? null : { kw: w }, p: q3 };
  };

  /* ---------- helpers ---------- */
  function isDict(x) { return x && typeof x === 'object' && !Array.isArray(x) && !(x instanceof Ref) && !(x instanceof Str) && !x.kw; }
  function nm(x) { return typeof x === 'string' && x[0] === '/' ? x.slice(1) : null; }
  function textOf(x) {
    if (!(x instanceof Str)) return typeof x === 'string' ? x.replace(/^\//, '') : x == null ? null : String(x);
    var s = x.s;
    if (s.charCodeAt(0) === 0xFE && s.charCodeAt(1) === 0xFF) { var o = ''; for (var i = 2; i + 1 < s.length; i += 2) o += String.fromCharCode((s.charCodeAt(i) << 8) | s.charCodeAt(i + 1)); return o; }
    if (s.charCodeAt(0) === 0xEF && s.charCodeAt(1) === 0xBB && s.charCodeAt(2) === 0xBF) { try { return decodeURIComponent(escape(s.slice(3))); } catch (e) {} }
    return s;
  }
  function pdfDate(x) {
    var s = textOf(x); if (!s) return null;
    var m = /^\s*(?:D:)?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?\s*([Zz+\-])?\s*(\d{2})?'?(\d{2})?'?/.exec(s);
    if (!m) return { raw: s, t: null };
    var t = Date.UTC(+m[1], (+m[2] || 1) - 1, +m[3] || 1, +m[4] || 0, +m[5] || 0, +m[6] || 0);
    var tz = m[7] && m[7] !== 'Z' && m[7] !== 'z' ? (m[7] === '-' ? -1 : 1) * ((+m[8] || 0) * 60 + (+m[9] || 0)) : 0;
    return { raw: s, t: t - tz * 60000, tz: m[7] ? true : false };
  }
  function isoDate(s) { if (!s) return null; var t = Date.parse(s.trim()); return { raw: s.trim(), t: isNaN(t) ? null : t }; }
  async function inflate(u8) {
    if (typeof DecompressionStream === 'undefined') throw new Error('no DecompressionStream');
    var ds = new DecompressionStream('deflate'), w = ds.writable.getWriter(), r = ds.readable.getReader(), chunks = [], n = 0;
    w.write(u8).catch(function () {}); w.close().catch(function () {});
    try { for (;;) { var x = await r.read(); if (x.done) break; chunks.push(x.value); n += x.value.length; if (n > 64e6) break; } } catch (e) { if (!n) throw e; }
    var out = new Uint8Array(n), o = 0; chunks.forEach(function (c) { out.set(c, o); o += c.length; });
    return out;
  }
  function a85(u8) {
    var out = [], g = [], s = latin1(u8).replace(/^\s*<~/, '');
    var e = s.indexOf('~>'); if (e >= 0) s = s.slice(0, e);
    s = s.replace(/[\0\t\n\f\r ]/g, '');
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 122 && g.length === 0) { out.push(0, 0, 0, 0); continue; }
      if (c < 33 || c > 117) continue;
      g.push(c - 33);
      if (g.length === 5) { var v = (((g[0] * 85 + g[1]) * 85 + g[2]) * 85 + g[3]) * 85 + g[4]; out.push(v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255); g = []; }
    }
    if (g.length > 1) { var n = g.length; while (g.length < 5) g.push(84); var v2 = (((g[0] * 85 + g[1]) * 85 + g[2]) * 85 + g[3]) * 85 + g[4]; var bs = [v2 >>> 24 & 255, v2 >>> 16 & 255, v2 >>> 8 & 255, v2 & 255]; for (var k = 0; k < n - 1; k++) out.push(bs[k]); }
    return Uint8Array.from(out);
  }
  function ahx(u8) { var s = latin1(u8).replace(/>.*$/, '').replace(/[^0-9a-fA-F]/g, ''); if (s.length % 2) s += '0'; var o = new Uint8Array(s.length / 2); for (var i = 0; i < o.length; i++) o[i] = parseInt(s.substr(i * 2, 2), 16); return o; }
  function hex(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; }

  /* ---------- minimal DER walk for CMS signatures ---------- */
  function der(u8, p, end, depth, cb) {
    while (p < end && depth < 40) {
      var tag = u8[p++], len = u8[p++];
      if (len === undefined) return;
      if (len & 0x80) { var nb = len & 0x7f; if (nb === 0) return; len = 0; for (var i = 0; i < nb; i++) len = len * 256 + u8[p++]; }
      var s = p, e = p + len; if (e > end) return;
      var node = { tag: tag, s: s, e: e, kids: [] };
      cb(node, depth);
      // constructed, or an OCTET STRING that wraps DER (encapsulated content such as a timestamp's TSTInfo)
      if ((tag & 0x20) || (tag === 0x04 && u8[s] === 0x30 && len > 8)) { var kids = []; der(u8, s, e, depth + 1, function (k, d) { if (d === depth + 1) kids.push(k); cb(k, d); }); node.kids = kids; }
      p = e;
    }
  }
  function oid(u8, s, e) {
    var out = [], v = 0;
    for (var i = s; i < e; i++) { v = v * 128 + (u8[i] & 0x7f); if (!(u8[i] & 0x80)) { out.push(v); v = 0; } }
    if (!out.length) return '';
    var f = out[0] < 80 ? Math.floor(out[0] / 40) : 2; return [f, out[0] - f * 40].concat(out.slice(1)).join('.');
  }
  function cmsInfo(u8) {
    var nodes = [], info = { digests: [], signingTime: null, names: [] };
    var HASH = { '1.3.14.3.2.26': 1, '2.16.840.1.101.3.4.2.1': 1, '2.16.840.1.101.3.4.2.2': 1, '2.16.840.1.101.3.4.2.3': 1 };
    try { der(u8, 0, u8.length, 0, function (n) { nodes.push(n); }); } catch (e) { return info; }
    nodes.forEach(function (n) {
      // RFC 3161 timestamp: MessageImprint ::= SEQUENCE { AlgorithmIdentifier, OCTET STRING }
      if (n.tag === 0x30 && n.kids.length === 2 && n.kids[0].tag === 0x30 && n.kids[1].tag === 0x04 && n.kids[0].kids[0] && n.kids[0].kids[0].tag === 0x06 &&
          HASH[oid(u8, n.kids[0].kids[0].s, n.kids[0].kids[0].e)]) info.digests.push({ kind: 'timestamp imprint', v: u8.slice(n.kids[1].s, n.kids[1].e) });
      if (n.tag !== 0x30 || n.kids.length < 2 || n.kids[0].tag !== 0x06) return;
      var o = oid(u8, n.kids[0].s, n.kids[0].e), v = n.kids[1];
      if (o === '1.2.840.113549.1.9.4' && v.tag === 0x31 && v.kids[0] && v.kids[0].tag === 0x04) info.digests.push({ kind: 'messageDigest', v: u8.slice(v.kids[0].s, v.kids[0].e) });
      if (o === '1.2.840.113549.1.9.5' && v.tag === 0x31 && v.kids[0]) info.signingTime = latin1(u8.subarray(v.kids[0].s, v.kids[0].e));
      if (o === '2.5.4.3' && (v.tag === 0x0c || v.tag === 0x13 || v.tag === 0x14 || v.tag === 0x16 || v.tag === 0x1e)) {
        var raw = u8.subarray(v.s, v.e), t;
        try { t = v.tag === 0x0c ? new TextDecoder().decode(raw) : v.tag === 0x1e ? (function () { var o2 = ''; for (var i = 0; i + 1 < raw.length; i += 2) o2 += String.fromCharCode(raw[i] << 8 | raw[i + 1]); return o2; })() : latin1(raw); } catch (e) { t = latin1(raw); }
        if (info.names.indexOf(t) < 0) info.names.push(t);
      }
    });
    return info;
  }

  /* ---------- main ---------- */
  async function analyze(u8, opts) {
    opts = opts || {};
    var S = latin1(u8), P = new Parser(S), N = u8.length;
    var rep = { size: N, header: null, objects: 0, warnings: [], revisions: [], findings: [] };
    var hm = /%PDF-(\d\.\d)/.exec(S.slice(0, 1024));
    if (!hm) { rep.notPdf = true; return rep; }
    rep.header = hm[1]; rep.headerOffset = hm.index;

    // 1. scan objects in file order, skipping stream bodies
    var objs = [], streams = [], OBJ_RE = /(\d{1,10})[\0\t\n\f\r ]+(\d{1,5})[\0\t\n\f\r ]+obj(?![^\0\t\n\f\r ()<>\[\]{}\/%])/g, m;
    while ((m = OBJ_RE.exec(S))) {
      if (m.index > 0 && isReg(S[m.index - 1])) { OBJ_RE.lastIndex = m.index + 1; continue; }
      var o = { num: +m[1], gen: +m[2], off: m.index, val: null, ss: -1, se: -1, inStm: null };
      var after;
      try { var pv = P.value(m.index + m[0].length); o.val = pv.v; after = pv.p; } catch (e) { OBJ_RE.lastIndex = m.index + 1; continue; }
      var q = P.skip(after);
      if (S.substr(q, 6) === 'stream' && isDict(o.val)) {
        var ds = q + 6; if (S[ds] === '\r') ds++; if (S[ds] === '\n') ds++;
        var L = o.val.Length, de = -1;
        if (typeof L === 'number' && L >= 0 && ds + L <= N && /^[\0\t\n\f\r ]*endstream/.test(S.substr(ds + L, 40))) de = ds + L;
        if (de < 0) { var es = S.indexOf('endstream', ds); if (es < 0) es = N; de = es; if (S[de - 1] === '\n') de--; if (S[de - 1] === '\r') de--; }
        o.ss = ds; o.se = de; streams.push([ds, de]);
        var ee = S.indexOf('endstream', de); after = ee < 0 ? N : ee + 9;
      }
      var eo = S.indexOf('endobj', after);
      o.end = (eo >= 0 && eo - after < 64) ? eo + 6 : after;
      objs.push(o); OBJ_RE.lastIndex = o.end;
    }
    function inStream(pos) { for (var i = 0; i < streams.length; i++) if (pos >= streams[i][0] && pos < streams[i][1]) return true; return false; }
    function bytesOf(o) { return u8.subarray(o.ss, o.se); }
    async function streamData(o) {
      if (o.inStm || o.ss < 0) return null;
      var f = o.val.Filter, fl = Array.isArray(f) ? f.map(nm) : f ? [nm(f)] : [];
      var b = bytesOf(o);
      for (var i = 0; i < fl.length; i++) {
        if (fl[i] === 'FlateDecode' || fl[i] === 'Fl') { b = await inflate(b); var dp = Array.isArray(o.val.DecodeParms) ? o.val.DecodeParms[i] : o.val.DecodeParms; if (isDict(dp) && dp.Predictor > 1) return null; }
        else if (fl[i] === 'ASCII85Decode' || fl[i] === 'A85') b = a85(b);
        else if (fl[i] === 'ASCIIHexDecode' || fl[i] === 'AHx') b = ahx(b);
        else return null;
      }
      return b;
    }

    // 2. %%EOF markers and trailers outside streams
    var eofs = [], re2 = /%%EOF/g;
    while ((m = re2.exec(S))) if (!inStream(m.index)) eofs.push(m.index + 5);
    var trailers = [], re3 = /trailer[\0\t\n\f\r ]*<</g;
    while ((m = re3.exec(S))) if (!inStream(m.index)) { try { trailers.push({ off: m.index, d: P.value(m.index + 7).v }); } catch (e) {} }
    objs.forEach(function (o) { if (isDict(o.val) && nm(o.val.Type) === 'XRef') trailers.push({ off: o.off, d: o.val, xrefStream: true }); });
    trailers.sort(function (a, b) { return a.off - b.off; });
    var xrefTables = 0, re4 = /(^|[\r\n])xref[\0\t\n\f\r ]/g; while ((m = re4.exec(S))) if (!inStream(m.index)) xrefTables++;
    var startxrefs = 0, re5 = /startxref/g; while ((m = re5.exec(S))) if (!inStream(m.index)) startxrefs++;

    // 3. objects inside object streams (they belong to the save of the stream that holds them)
    var expanded = [];
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i]; expanded.push(o);
      if (o.ss >= 0 && nm(o.val.Type) === 'ObjStm') {
        try {
          var data = await streamData(o); if (!data) { rep.warnings.push('An object stream uses a compression this tool does not decode; objects inside it were not read.'); continue; }
          var T = latin1(data), PP = new Parser(T), first = o.val.First | 0, n = Math.min(o.val.N | 0, 100000), hdr = T.slice(0, first).trim().split(/[\0\t\n\f\r ]+/).map(Number);
          for (var k = 0; k + 1 < hdr.length && k / 2 < n; k += 2) {
            try { expanded.push({ num: hdr[k], gen: 0, off: o.off, val: PP.value(first + hdr[k + 1]).v, ss: -1, se: -1, inStm: o.num, end: o.end }); } catch (e) {}
          }
        } catch (e) { rep.warnings.push('An object stream could not be decompressed: ' + (e && e.message || 'error')); }
      }
    }
    rep.objects = expanded.length;

    // 4. revisions: bytes up to each %%EOF
    var bounds = eofs.slice();
    var lin = objs.length && isDict(objs[0].val) && objs[0].val.Linearized ? objs[0].val : null;
    rep.linearized = !!lin;
    var segs = [], prev = 0;
    bounds.forEach(function (b) { segs.push({ start: prev, end: b, objs: [] }); prev = b; });
    var tail = S.slice(prev).replace(/[\0\t\n\f\r ]/g, '');
    if (tail.length) rep.trailingBytes = N - prev;
    function segOf(off) { for (var i = 0; i < segs.length; i++) if (off < segs[i].end) return i; return -1; }
    expanded.forEach(function (o) { var s = segOf(o.off); o.seg = s; if (s >= 0) segs[s].objs.push(o); });
    // a linearized file writes a first-page section with its own %%EOF: that is part of the first save
    if (lin && segs.length >= 2 && segs[0].objs.every(function (o) { return o === objs[0] || nm(o.val && o.val.Type) === 'XRef'; })) {
      segs[1].start = 0; segs[1].objs = segs[0].objs.concat(segs[1].objs); segs.shift();
    }
    segs = segs.filter(function (s, idx) { return s.objs.length || idx === 0; });
    segs.forEach(function (s, idx) { s.objs.forEach(function (o) { o.seg = idx; }); });
    rep.linearizedLength = lin && typeof lin.L === 'number' ? lin.L : null;

    // 5. latest object table
    var latest = new Map(), seen = new Map();
    segs.forEach(function (s, si) {
      s.objs.sort(function (a, b) { return a.off - b.off; });
      s.added = []; s.changed = [];
      s.objs.forEach(function (o) {
        var t = isDict(o.val) ? nm(o.val.Type) : null;
        if (t !== 'XRef' && t !== 'ObjStm') { if (si > 0) (seen.has(o.num) ? s.changed : s.added).push(o); seen.set(o.num, si); }
        latest.set(o.num, o);
      });
    });
    if (!segs.length) segs.push({ start: 0, end: N, objs: [], added: [], changed: [] });
    function get(x, d) { d = d || 0; while (x instanceof Ref && d++ < 32) { var o = latest.get(x.r); x = o ? o.val : null; } return x; }
    function objOf(x) { return x instanceof Ref ? latest.get(x.r) : null; }

    // trailer: each key from the latest trailer that has it (some writers leave Info out of an update's trailer)
    var tr = null;
    trailers.forEach(function (t) { if (!isDict(t.d)) return; tr = tr || Object.create(null); Object.keys(t.d).forEach(function (k) { tr[k] = t.d[k]; }); });
    if (tr && !tr.Root) tr = null;
    var root = tr ? get(tr.Root) : null;
    if (!isDict(root)) { // repair: find a Catalog
      var cat = null; latest.forEach(function (o) { if (!cat && isDict(o.val) && nm(o.val.Type) === 'Catalog') cat = o.val; }); root = cat;
      if (root) rep.warnings.push('No usable trailer: the document catalog was found by scanning.');
    }
    rep.encrypted = !!(tr && tr.Encrypt);
    var infoDict = tr && tr.Info ? get(tr.Info) : null;
    if (tr && Array.isArray(tr.ID) && tr.ID.length === 2) rep.ids = [hex(Uint8Array.from(tr.ID[0].s || '', function (c) { return c.charCodeAt(0); })), hex(Uint8Array.from(tr.ID[1].s || '', function (c) { return c.charCodeAt(0); }))];

    // 6. pages
    var pages = [], pageOfObj = new Map(), contentPage = new Map(), visited = new Set();
    function walk(node, inh, depth) {
      if (depth > 50 || pages.length > 5000) return;
      var o = objOf(node), d = get(node);
      if (!isDict(d)) return;
      if (o) { if (visited.has(o.num)) return; visited.add(o.num); }
      var res = d.Resources !== undefined ? d.Resources : inh.res;
      if (nm(d.Type) === 'Pages' || (Array.isArray(get(d.Kids)) && nm(d.Type) !== 'Page')) { (get(d.Kids) || []).forEach(function (k) { walk(k, { res: res }, depth + 1); }); return; }
      var pg = { n: pages.length + 1, obj: o ? o.num : null, dict: d, res: res, contents: [] };
      var c = d.Contents, cl = Array.isArray(get(c)) ? get(c) : c ? [c] : [];
      if (c instanceof Ref && Array.isArray(get(c))) contentPage.set(c.r, pages.length + 1);
      cl.forEach(function (x) { if (x instanceof Ref) { pg.contents.push(x.r); if (!contentPage.has(x.r)) contentPage.set(x.r, pg.n); } });
      if (o) pageOfObj.set(o.num, pg.n);
      (get(d.Annots) || []).forEach(function (a) { if (a instanceof Ref) pageOfObj.set(a.r, pg.n); });
      pages.push(pg);
    }
    if (root) walk(root.Pages, { res: null }, 0);
    rep.pages = pages.length;

    // 7. fonts per page (page resources and form XObjects inside them)
    var fontUse = new Map(), textCache = new Map();
    // the operators of a content stream, as text; null when it cannot be decoded
    async function opsOf(refs) {
      var out = '';
      for (var i = 0; i < refs.length; i++) {
        var o = latest.get(refs[i]); if (!o || o.ss < 0) continue;
        if (!textCache.has(o.num)) { var b = null; try { b = await streamData(o); } catch (e) {} textCache.set(o.num, b ? latin1(b.length > 8e6 ? b.subarray(0, 8e6) : b) : null); }
        var t = textCache.get(o.num); if (t == null) return null; out += '\n' + t;
      }
      return out;
    }
    function usedNames(ops, op) {
      var re = op === 'Tf' ? /\/([^\0\t\n\f\r \/\[\]()<>{}%]+)[\0\t\n\f\r ]+[-+\d.]+[\0\t\n\f\r ]+Tf\b/g : /\/([^\0\t\n\f\r \/\[\]()<>{}%]+)[\0\t\n\f\r ]+Do\b/g, s = new Set(), m;
      while ((m = re.exec(ops))) s.add(m[1].replace(/#([0-9a-fA-F]{2})/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); }));
      return s;
    }
    async function fontsIn(res, refs, acc, depth, seenX, flags) {
      res = get(res); if (!isDict(res) || depth > 4) return;
      var ops = await opsOf(refs), usedF = ops == null ? null : usedNames(ops, 'Tf'), usedX = ops == null ? null : usedNames(ops, 'Do');
      if (ops == null) flags.approx = true;
      var F = get(res.Font);
      if (isDict(F)) Object.keys(F).forEach(function (k) {
        if (usedF && !usedF.has(k)) return;
        var fo = objOf(F[k]), fd = get(F[k]); if (!isDict(fd)) return;
        var base = nm(get(fd.BaseFont)) || nm(fd.Name) || ('(unnamed ' + (nm(fd.Subtype) || 'font') + ')');
        var desc = get(fd.FontDescriptor), sub = nm(fd.Subtype) || '';
        if (sub === 'Type0') { var df = get(fd.DescendantFonts); df = Array.isArray(df) ? get(df[0]) : null; if (isDict(df)) desc = get(df.FontDescriptor); }
        var embedded = isDict(desc) && !!(desc.FontFile || desc.FontFile2 || desc.FontFile3);
        var sm = /^([A-Z]{6})\+(.*)$/.exec(base);
        acc.push({ key: fo ? fo.num : base, name: sm ? sm[2] : base, subset: sm ? sm[1] : null, type: sub, embedded: sub === 'Type3' ? true : embedded, obj: fo ? fo.num : null, rev: fo ? fo.seg : null });
      });
      var X = get(res.XObject), xk = isDict(X) ? Object.keys(X) : [];
      for (var i = 0; i < xk.length; i++) {
        if (usedX && !usedX.has(xk[i])) continue;
        var xo = objOf(X[xk[i]]); if (!xo || seenX.has(xo.num)) continue; seenX.add(xo.num);
        var xd = xo.val; if (isDict(xd) && nm(xd.Subtype) === 'Form') await fontsIn(xd.Resources || res, [xo.num], acc, depth + 1, seenX, flags);
      }
    }
    for (var pi = 0; pi < pages.length; pi++) {
      var pg = pages[pi], acc = [], flags = {};
      await fontsIn(pg.res, pg.contents, acc, 0, new Set(), flags);
      pg.fontsApprox = !!flags.approx;
      var uniq = new Map(); acc.forEach(function (f) { if (!uniq.has(f.key)) uniq.set(f.key, f); });
      pg.fonts = Array.from(uniq.values());
      pg.fonts.forEach(function (f) { var u = fontUse.get(f.name) || { name: f.name, pages: new Set(), subsets: new Set(), embedded: new Set() }; u.pages.add(pg.n); if (f.subset) u.subsets.add(f.subset); u.embedded.add(f.embedded); fontUse.set(f.name, u); });
    }
    rep.fontsApprox = pages.some(function (pg) { return pg.fontsApprox; });
    rep.fonts = Array.from(fontUse.values()).map(function (u) { return { name: u.name, pages: Array.from(u.pages), subsets: Array.from(u.subsets), embedded: Array.from(u.embedded) }; }).sort(function (a, b) { return b.pages.length - a.pages.length || a.name.localeCompare(b.name); });
    var pageXObj = new Map();
    pages.forEach(function (pg) { var r = get(pg.res), X = r && isDict(r) ? get(r.XObject) : null; if (isDict(X)) Object.keys(X).forEach(function (k) { if (X[k] instanceof Ref && !pageXObj.has(X[k].r)) pageXObj.set(X[k].r, pg.n); }); });
    var fontLists = new Set();
    latest.forEach(function (o) { var d = o.val; if (isDict(d) && d.Font instanceof Ref) fontLists.add(d.Font.r); });
    rep.pageFonts = pages.map(function (pg) { return { n: pg.n, approx: pg.fontsApprox, fonts: pg.fonts.map(function (f) { return { name: f.name, subset: f.subset, embedded: f.embedded, type: f.type, rev: f.rev }; }) }; });
    // unusual pages: same family as two different subsets on one page, or a font found on no other page of a 3+ page file
    rep.fontOddities = [];
    pages.forEach(function (pg) {
      var byName = {}; pg.fonts.forEach(function (f) { (byName[f.name] = byName[f.name] || []).push(f); });
      Object.keys(byName).forEach(function (n) {
        var l = byName[n], subs = l.map(function (f) { return f.subset; }).filter(Boolean);
        if (l.length > 1 && (new Set(subs)).size > 1) rep.fontOddities.push({ page: pg.n, kind: 'two-subsets', font: n, subsets: subs });
        if (l.length > 1 && l.some(function (f) { return f.embedded; }) && l.some(function (f) { return !f.embedded; })) rep.fontOddities.push({ page: pg.n, kind: 'embedded-and-not', font: n });
      });
      if (pages.length >= 3) pg.fonts.forEach(function (f) { var u = fontUse.get(f.name); if (u && u.pages.size === 1) rep.fontOddities.push({ page: pg.n, kind: 'only-here', font: f.name }); });
      // a font object first written in a later save, used on a page that also uses fonts from an earlier save
      var revs = pg.fonts.map(function (f) { return f.rev; }).filter(function (r) { return r != null; });
      if (revs.length) { var lo = Math.min.apply(null, revs); pg.fonts.forEach(function (f) { if (f.rev != null && f.rev > lo && f.obj != null && segs[f.rev] && segs[f.rev].added.some(function (o) { return o.num === f.obj; })) rep.fontOddities.push({ page: pg.n, kind: 'later-font', font: f.name, rev: f.rev + 1 }); }); }
    });

    // 7b. fonts mixed inside one printed line (batch 10): replay the text operators of each page's own content streams, place
    // every text run at its position on the page (text matrix x CTM) and group runs on the same baseline. A line that switches
    // font family part-way is what a "type over" edit usually leaves (the editor cannot reuse the original subset font).
    var SYM = /symbol|dingbat|wingding|webding|marlett|zapf/i;
    function family(n) {
      n = String(n || '').replace(/^[A-Z]{6}\+/, '').replace(/(PS)?MT$/, '').replace(/,.*$/, '');
      n = n.replace(/[-_ ]?(Bold|Italic|Oblique|Regular|Roman|Book|Light|Medium|Semibold|SemiBold|Demi|Black|Heavy|Thin|Condensed|Cond|Narrow|It|Bd|BdIt)+$/i, '').replace(/[-_ ](Bold|Italic|Regular|Light|Medium)\w*$/i, '').replace(/(PS)?MT$/, '');
      return n || '(unnamed)';
    }
    function lineScan(ops, fmap) {
      var S = ops, n = S.length, i = 0, st = [], runs = [], ctm = [1, 0, 0, 1, 0, 0], gs = [], tm = [1, 0, 0, 1, 0, 0], tlm = [1, 0, 0, 1, 0, 0], lead = 0, font = null, guard = 0;
      function mul(m, k) { return [m[0] * k[0] + m[1] * k[2], m[0] * k[1] + m[1] * k[3], m[2] * k[0] + m[3] * k[2], m[2] * k[1] + m[3] * k[3], m[4] * k[0] + m[5] * k[2] + k[4], m[4] * k[1] + m[5] * k[3] + k[5]]; }
      function td(tx, ty) { tlm = [tlm[0], tlm[1], tlm[2], tlm[3], tx * tlm[0] + ty * tlm[2] + tlm[4], tx * tlm[1] + ty * tlm[3] + tlm[5]]; tm = tlm.slice(); }
      function show(text) {
        var d = mul(tm, ctm), f = fmap[font] || { name: font || '?', two: false };
        runs.push({ x: d[4], y: d[5], fam: family(f.name), font: f.name, text: f.two ? null : text });
        if (runs.length > 20000) i = n;
      }
      while (i < n && guard++ < 2000000) {
        var c = S[i];
        if (WS.indexOf(c) >= 0) { i++; continue; }
        if (c === '%') { while (i < n && S[i] !== '\n' && S[i] !== '\r') i++; continue; }
        if (c === '(') { var depth = 1, s = ''; i++; while (i < n && depth) { var ch = S[i]; if (ch === '\\') { var nx = S[i + 1]; s += nx === 'n' ? '\n' : nx === 'r' ? '' : nx === 't' ? ' ' : /[0-7]/.test(nx) ? String.fromCharCode(parseInt(S.substr(i + 1, 3).match(/^[0-7]{1,3}/)[0], 8)) : nx; i += /[0-7]/.test(nx) ? 1 + S.substr(i + 1, 3).match(/^[0-7]{1,3}/)[0].length : 2; continue; } if (ch === '(') depth++; else if (ch === ')') { depth--; if (!depth) { i++; break; } } s += ch; i++; } st.push({ s: s }); continue; }
        if (c === '<') { if (S[i + 1] === '<') { i += 2; continue; } var e = S.indexOf('>', i); if (e < 0) break; st.push({ s: null }); i = e + 1; continue; }
        if (c === '>' && S[i + 1] === '>') { i += 2; continue; }
        if (c === '[') { st.push('['); i++; continue; }
        if (c === ']') { var arr = [], k = st.length - 1; while (k >= 0 && st[k] !== '[') k--; arr = st.splice(k < 0 ? 0 : k); arr.shift(); st.push({ a: arr }); i++; continue; }
        if (c === '{' || c === '}' || c === ')') { i++; continue; }
        var j = i + 1; if (c === '/') { while (j < n && isReg(S[j])) j++; st.push(S.slice(i, j)); i = j; continue; }
        while (j < n && isReg(S[j])) j++;
        var w = S.slice(i, j); i = j;
        if (/^[-+.\d]/.test(w)) { st.push(+w); continue; }
        var a = st; st = [];
        var num = function (k) { var v = a[a.length - k]; return typeof v === 'number' ? v : 0; };
        switch (w) {
          case 'q': gs.push(ctm.slice()); break;
          case 'Q': if (gs.length) ctm = gs.pop(); break;
          case 'cm': ctm = mul([num(6), num(5), num(4), num(3), num(2), num(1)], ctm); break;
          case 'BT': tm = [1, 0, 0, 1, 0, 0]; tlm = tm.slice(); break;
          case 'Tf': font = typeof a[a.length - 2] === 'string' ? a[a.length - 2].slice(1).replace(/#([0-9a-fA-F]{2})/g, function (_, h) { return String.fromCharCode(parseInt(h, 16)); }) : font; break;
          case 'Tm': tm = [num(6), num(5), num(4), num(3), num(2), num(1)]; tlm = tm.slice(); break;
          case 'Td': td(num(2), num(1)); break;
          case 'TD': lead = -num(1); td(num(2), num(1)); break;
          case 'TL': lead = num(1); break;
          case 'T*': td(0, -lead); break;
          case 'Tj': show(a.length && a[a.length - 1] && a[a.length - 1].s !== undefined ? a[a.length - 1].s : null); break;
          case "'": td(0, -lead); show(a.length && a[a.length - 1] ? a[a.length - 1].s : null); break;
          case '"': td(0, -lead); show(a.length && a[a.length - 1] ? a[a.length - 1].s : null); break;
          case 'TJ': var A = a.length && a[a.length - 1] && a[a.length - 1].a; show(A ? A.map(function (x) { return x && x.s != null ? x.s : (typeof x === 'number' && x < -200 ? ' ' : ''); }).join('') : null); break;
          case 'ID': var ei = S.slice(i).search(/[\0\t\n\f\r ]EI(?![^\0\t\n\f\r ()<>\[\]{}\/%])/); i = ei < 0 ? n : i + ei + 3; break;
        }
      }
      return runs;
    }
    rep.mixedLines = []; rep.lineScan = { pages: 0, lines: 0, approx: false };
    var famLines = new Map(), allLines = [];
    for (var pj = 0; pj < pages.length && pj < 400; pj++) {
      var pgx = pages[pj], R = get(pgx.res), F2 = R && isDict(R) ? get(R.Font) : null, fmap = {};
      if (isDict(F2)) Object.keys(F2).forEach(function (k) { var fd = get(F2[k]); if (isDict(fd)) fmap[k] = { name: nm(get(fd.BaseFont)) || nm(fd.Name) || k, two: nm(fd.Subtype) === 'Type0' }; });
      var ops = await opsOf(pgx.contents); if (ops == null) { rep.lineScan.approx = true; continue; }
      var runs; try { runs = lineScan(ops, fmap); } catch (e) { rep.lineScan.approx = true; continue; }
      rep.lineScan.pages++;
      runs = runs.filter(function (r) { return !SYM.test(r.font) && (r.text == null || /\S/.test(r.text)); }).sort(function (p, q) { return q.y - p.y || p.x - q.x; });
      var lines = [];
      runs.forEach(function (r) { var l = lines[lines.length - 1]; if (l && Math.abs(l.y - r.y) <= 1.5) l.runs.push(r); else lines.push({ y: r.y, runs: [r] }); });
      lines.forEach(function (l) {
        l.runs.sort(function (p, q) { return p.x - q.x; });
        var fams = []; l.runs.forEach(function (r) { if (fams.indexOf(r.fam) < 0) fams.push(r.fam); });
        fams.forEach(function (f) { famLines.set(f, (famLines.get(f) || 0) + 1); });
        rep.lineScan.lines++;
        if (fams.length > 1) allLines.push({ page: pgx.n, fams: fams, text: l.runs.every(function (r) { return r.text != null; }) ? l.runs.map(function (r) { return r.text; }).join('').replace(/\s+/g, ' ').trim().slice(0, 140) : null,
          parts: l.runs.map(function (r) { return { fam: r.fam, text: r.text == null ? null : r.text.slice(0, 60) }; }).slice(0, 12) });
      });
    }
    allLines.forEach(function (l) { l.rare = l.fams.filter(function (f) { return (famLines.get(f) || 0) <= 3; }); });
    rep.mixedLinesTotal = allLines.length;
    rep.mixedLines = allLines.sort(function (p, q) { return (q.rare.length ? 1 : 0) - (p.rare.length ? 1 : 0) || p.page - q.page; }).slice(0, 40);
    rep.familyLines = Array.from(famLines.entries()).map(function (e) { return { family: e[0], lines: e[1] }; }).sort(function (p, q) { return q.lines - p.lines; }).slice(0, 30);

    // 8. describe an object for the revision lists
    function describe(o) {
      var d = o.val, t = isDict(d) ? nm(d.Type) : null, st = isDict(d) ? nm(d.Subtype) : null, pg = pageOfObj.get(o.num);
      if (isDict(d) && d.ByteRange) return { k: 'signature', t: 'Signature value' };
      if (t === 'Catalog') return { k: 'catalog', t: 'Document catalog (top-level object)' };
      if (t === 'Pages') return { k: 'struct', t: 'Page list' };
      if (t === 'Page') return { k: 'page', t: 'Page ' + (pg || '?') + ' (page object)', page: pg };
      if (t === 'Annot' || (isDict(d) && d.Rect && st && /^(Text|FreeText|Link|Widget|Stamp|Ink|Square|Circle|Line|Highlight|Underline|StrikeOut|Redact|FileAttachment|Popup|Polygon|PolyLine|Caret)$/.test(st)))
        return { k: st === 'Widget' ? 'field' : 'annot', t: (st === 'Widget' ? 'Form field' : st + ' annotation') + (pg ? ' on page ' + pg : ''), page: pg, sub: st };
      if (t === 'Font' || (isDict(d) && d.BaseFont)) return { k: 'font', t: 'Font ' + (nm(d.BaseFont) || '').replace(/^[A-Z]{6}\+/, '') };
      if (t === 'FontDescriptor') return { k: 'fontdata', t: 'Font descriptor ' + (nm(d.FontName) || '').replace(/^[A-Z]{6}\+/, '') };
      if (isDict(d) && (d.Producer || d.ModDate || d.CreationDate || d.Creator) && !t) return { k: 'info', t: 'Document information (producer and dates)' };
      if (t === 'Metadata') return { k: 'xmp', t: 'XMP metadata' };
      if (t === 'Sig') return { k: 'signature', t: 'Signature value' };
      if (t === 'XObject' || st === 'Image' || st === 'Form') {
        var xp = pageXObj.get(o.num);
        if (xp) return { k: 'image', t: (st === 'Image' ? 'Image' : 'Drawing group') + ' placed on page ' + xp, page: xp };
        return { k: 'xobj', t: st === 'Image' ? 'Image (not placed directly on a page)' : 'Appearance or drawing group (not placed directly on a page)' };
      }
      if (contentPage.has(o.num) && contentPage.get(o.num)) return { k: 'content', t: (Array.isArray(d) ? 'Content list of page ' : 'Text and drawing of page ') + contentPage.get(o.num), page: contentPage.get(o.num) };
      if (isDict(d) && !t && (d.Font || d.XObject || d.ProcSet || d.ExtGState)) return { k: 'res', t: 'Resources (fonts and images a page can use)' };
      if (fontLists.has(o.num)) return { k: 'res', t: 'Font list' };
      if (t === 'AcroForm' || (isDict(d) && d.Fields)) return { k: 'form', t: 'Form definition' };
      if (t === 'Filespec' || t === 'EmbeddedFile') return { k: 'attachment', t: 'Attached file' };
      if (isDict(d) && (d.JS || nm(d.S) === 'JavaScript')) return { k: 'js', t: 'JavaScript action' };
      if (isDict(d) && (d.FontFile || d.FontFile2 || d.FontFile3)) return { k: 'fontdata', t: 'Font data' };
      if (o.ss >= 0 && isDict(d) && (d.Length1 || d.Subtype && /Type1C|CIDFontType0C|OpenType/.test(nm(d.Subtype) || ''))) return { k: 'fontdata', t: 'Embedded font program' };
      if (t === 'OCG' || t === 'OCProperties') return { k: 'struct', t: 'Layer definition' };
      if (o.ss >= 0) return { k: 'stream', t: 'Data stream' };
      return { k: 'other', t: t ? t + ' object' : Array.isArray(d) ? 'Array' : 'Object' };
    }

    // 9. info per revision (Info objects changed in later saves)
    function infoOf(d) {
      d = get(d); if (!isDict(d)) return null;
      var r = {}; ['Producer', 'Creator', 'Author', 'Title', 'Subject'].forEach(function (k) { if (d[k] != null) r[k] = textOf(get(d[k])); });
      ['CreationDate', 'ModDate'].forEach(function (k) { if (d[k] != null) r[k] = pdfDate(get(d[k])); });
      return r;
    }
    rep.info = infoOf(infoDict);

    segs.forEach(function (s, si) {
      var r = { n: si + 1, start: s.start, end: s.end, bytes: s.end - s.start, added: [], changed: [], info: null, trailerXref: null };
      s.added.forEach(function (o) { var d = describe(o); d.obj = o.num; r.added.push(d); });
      s.changed.forEach(function (o) { var d = describe(o); d.obj = o.num; r.changed.push(d); });
      s.objs.forEach(function (o) { if (isDict(o.val) && (o.val.Producer || o.val.ModDate) && !o.val.Type) r.info = infoOf(o.val); });
      var all = r.added.concat(r.changed), cp = new Set(), pt = new Set(), sm = { fonts: 0, images: 0, annots: [], fields: 0, sigs: 0, info: false, xmp: false, other: 0 };
      all.forEach(function (x) {
        if (x.k === 'content' && x.page) cp.add(x.page);
        else if (x.k === 'page' && x.page) pt.add(x.page);
        else if (x.k === 'font' || x.k === 'fontdata') sm.fonts += x.k === 'font' ? 1 : 0;
        else if (x.k === 'image') { sm.images++; if (x.page) cp.add(x.page); }
        else if (x.k === 'annot') sm.annots.push(x.t);
        else if (x.k === 'field' || x.k === 'form') sm.fields++;
        else if (x.k === 'signature') sm.sigs++;
        else if (x.k === 'info') sm.info = true;
        else if (x.k === 'xmp') sm.xmp = true;
        else sm.other++;
      });
      sm.contentPages = Array.from(cp).sort(function (a, b) { return a - b; });
      sm.pagesTouched = Array.from(pt).filter(function (p) { return !cp.has(p); }).sort(function (a, b) { return a - b; });
      sm.kind = sm.contentPages.length || sm.images ? 'content' : sm.annots.length ? 'annotation' : sm.sigs ? 'signing' : sm.fields ? 'form' : (sm.info || sm.xmp) && !sm.fonts && !sm.pagesTouched.length ? 'metadata' : 'other';
      r.summary = sm;
      rep.revisions.push(r);
    });

    // 10. XMP metadata
    var md = root ? objOf(root.Metadata) : null;
    if (md && md.ss >= 0) {
      try {
        var xb = await streamData(md);
        if (xb) {
          var X = new TextDecoder('utf-8').decode(xb);
          var pick = function (tag) {
            var a = new RegExp(tag + '\\s*=\\s*"([^"]*)"').exec(X) || new RegExp('<' + tag + '(?:\\s[^>]*)?>\\s*(?:<rdf:Alt>\\s*<rdf:li[^>]*>)?([^<]*)<').exec(X);
            return a ? a[1].trim() : null;
          };
          rep.xmp = { CreateDate: isoDate(pick('xmp:CreateDate')), ModifyDate: isoDate(pick('xmp:ModifyDate')), MetadataDate: isoDate(pick('xmp:MetadataDate')),
            CreatorTool: pick('xmp:CreatorTool'), Producer: pick('pdf:Producer'), DocumentID: pick('xmpMM:DocumentID'), InstanceID: pick('xmpMM:InstanceID'), history: [] };
          var hre = /<rdf:li[^>]*?(?:stEvt:action="([^"]*)")?[^>]*?>([\s\S]*?)<\/rdf:li>|<rdf:li[^>]*stEvt:action="([^"]*)"[^>]*\/>/g, hm2, seenH = 0;
          var hblock = /<xmpMM:History>([\s\S]*?)<\/xmpMM:History>/.exec(X);
          if (hblock) {
            var items = hblock[1].split(/<rdf:li/).slice(1);
            items.forEach(function (it) {
              var g = function (k) { var a = new RegExp('stEvt:' + k + '\\s*=\\s*"([^"]*)"').exec(it) || new RegExp('<stEvt:' + k + '>([^<]*)<').exec(it); return a ? a[1] : null; };
              if (seenH++ < 30) rep.xmp.history.push({ action: g('action'), when: g('when'), agent: g('softwareAgent') });
            });
          }
          void hre; void hm2;
        } else rep.warnings.push('The XMP metadata stream uses an encoding this tool does not decode.');
      } catch (e) { rep.warnings.push('The XMP metadata could not be read.'); }
    }

    // 11. active content, forms, attachments, links
    var act = { js: 0, jsWhere: [], openAction: null, aa: 0, launch: 0, submit: 0, importData: 0, gotoR: 0, uris: [], files: [], richMedia: 0, xfa: false, fields: 0, annots: {} };
    latest.forEach(function (o) {
      var d = o.val; if (!isDict(d)) return;
      if (d.JS !== undefined || nm(d.S) === 'JavaScript') { act.js++; if (act.jsWhere.length < 5) act.jsWhere.push(pageOfObj.get(o.num) ? 'page ' + pageOfObj.get(o.num) : 'document level'); }
      if (d.AA !== undefined) act.aa++;
      var s = nm(d.S);
      if (s === 'Launch') act.launch++; if (s === 'SubmitForm') act.submit++; if (s === 'ImportData') act.importData++; if (s === 'GoToR' || s === 'GoToE') act.gotoR++;
      if (s === 'URI' && d.URI) { var u = textOf(get(d.URI)); if (u && act.uris.length < 200) act.uris.push(u); }
      if (nm(d.Type) === 'Filespec' || (d.EF && (d.F || d.UF))) { var fnm = textOf(get(d.UF || d.F)); if (fnm && act.files.indexOf(fnm) < 0) act.files.push(fnm); }
      if (nm(d.Subtype) === 'RichMedia') act.richMedia++;
      var st = nm(d.Subtype); if (d.Rect && st) act.annots[st] = (act.annots[st] || 0) + 1;
    });
    if (root) {
      var oa = get(root.OpenAction);
      if (isDict(oa)) act.openAction = nm(oa.S) || 'action'; else if (Array.isArray(oa)) act.openAction = 'go to a page';
      var af = get(root.AcroForm);
      if (isDict(af)) { var fl = get(af.Fields); act.fields = Array.isArray(fl) ? fl.length : 0; act.xfa = !!af.XFA; act.sigFlags = af.SigFlags | 0; }
      var names = get(root.Names);
      if (isDict(names) && names.JavaScript) act.jsNames = true;
      if (isDict(names) && names.EmbeddedFiles) act.embeddedTree = true;
      act.perms = isDict(get(root.Perms)) ? Object.keys(get(root.Perms)) : [];
    }
    rep.active = act;

    // 12. signatures
    rep.signatures = [];
    var sigObjs = [];
    expanded.forEach(function (o) { var d = o.val; if (isDict(d) && Array.isArray(d.ByteRange) && d.ByteRange.length >= 4 && d.Contents instanceof Str) sigObjs.push(o); });
    var docmdp = null;
    if (root && isDict(get(root.Perms)) && get(root.Perms).DocMDP) {
      var dm = get(get(root.Perms).DocMDP), refs = dm && get(dm.Reference);
      if (Array.isArray(refs)) refs.forEach(function (rf) { rf = get(rf); var tp = rf && get(rf.TransformParams); if (tp && tp.P) docmdp = tp.P | 0; });
      if (!docmdp) docmdp = 2;
    }
    for (var si2 = 0; si2 < sigObjs.length; si2++) {
      var so = sigObjs[si2], d = so.val, br = d.ByteRange.map(function (x) { return +get(x) || 0; });
      var a = br[0], b = br[1], c = br[2], l = br[3];
      var sig = { obj: so.num, rev: so.seg + 1, byteRange: br, coversWhole: a === 0 && c + l === N, signedEnd: c + l, after: N - (c + l),
        name: d.Name ? textOf(get(d.Name)) : null, when: d.M ? pdfDate(get(d.M)) : null, reason: d.Reason ? textOf(get(d.Reason)) : null,
        location: d.Location ? textOf(get(d.Location)) : null, subFilter: nm(d.SubFilter), filter: nm(d.Filter), type: nm(d.Type) };
      sig.gapOk = a === 0 && b > 0 && c > b && c + l <= N && S[b] === '<' && S[c - 1] === '>';
      sig.inRange = a === 0 && b >= 0 && c >= b && c + l <= N;
      var cont = Uint8Array.from(d.Contents.s, function (ch) { return ch.charCodeAt(0); });
      var ci = cmsInfo(cont); sig.cmsNames = ci.names.slice(0, 6); sig.cmsSigningTime = ci.signingTime;
      if (ci.digests.length && sig.inRange && G.crypto && G.crypto.subtle) {
        var buf = new Uint8Array(b + l); buf.set(u8.subarray(0, b), 0); buf.set(u8.subarray(c, c + l), b);
        var ALG = { 20: 'SHA-1', 32: 'SHA-256', 48: 'SHA-384', 64: 'SHA-512' }, done = {};
        sig.digestMatch = false;
        for (var di = 0; di < ci.digests.length; di++) {
          var dg = ci.digests[di], alg = ALG[dg.v.length]; if (!alg) continue;
          if (!done[alg]) done[alg] = hex(new Uint8Array(await G.crypto.subtle.digest(alg, buf)));
          if (!sig.digestAlg) sig.digestAlg = alg;
          if (done[alg] === hex(dg.v)) { sig.digestMatch = true; sig.digestAlg = alg; sig.digestKind = dg.kind; break; }
        }
        if (!sig.digestAlg) sig.digestMatch = null;
      } else if (sig.subFilter === 'adbe.x509.rsa_sha1') sig.digestNote = 'This older signature format keeps the hash inside an RSA block; it is not checked here.';
      // revisions written after the signed range
      sig.laterRevisions = rep.revisions.filter(function (r) { return r.start >= c + l - 2 && r.n > so.seg + 1; }).map(function (r) { return r.n; });
      rep.signatures.push(sig);
    }
    rep.docmdp = docmdp;

    // 13. counts for the summary
    rep.updates = Math.max(0, rep.revisions.length - 1);
    rep.eofCount = eofs.length; rep.xrefTables = xrefTables; rep.xrefStreams = trailers.filter(function (t) { return t.xrefStream; }).length; rep.startxrefs = startxrefs;
    return rep;
  }
  G.PDFX = { analyze: analyze, _parser: Parser, _cms: cmsInfo };
})(typeof window !== 'undefined' ? window : globalThis);
