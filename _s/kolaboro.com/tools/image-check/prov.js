/* Image check, provenance part (block R): Content Credentials (C2PA) and metadata signals of generative tools.
   Everything runs in the browser. The image is never uploaded. Requests made: the C2PA library glue (this site),
   its WebAssembly binary (jsDelivr, checked against a pinned SHA-256 before use) and the C2PA trust lists (this site),
   and only when the file carries Content Credentials or the visitor asks for the full check.
   This is NOT an AI detector: it reads what the file says about itself. Absence of credentials proves nothing. */
(function () {
  'use strict';
  var C2PA_JS = '/tools/image-check/c2pa/c2pa-web-0.15.3.js?v=0f3be0a33c';
  var WASM_URL = 'https://cdn.jsdelivr.net/npm/@contentauth/c2pa-web@0.15.3/dist/resources/c2pa_bg.wasm';
  var WASM_SHA256 = '29e981f3c6c96e5500b476b5ba8970e631f7520b684b8f5610a356fd0238fa92';
  var TRUST = '/tools/image-check/c2pa/trust/';

  // ---------- byte helpers ----------
  function latin1(u8, a, b) { var s = '', i, end = Math.min(b, u8.length); for (i = a; i < end; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(end, i + 8192))); return s; }
  function utf8(u8) { try { return new TextDecoder('utf-8').decode(u8); } catch (e) { return latin1(u8, 0, u8.length); } }
  function u16(u8, o, le) { return le ? u8[o] | (u8[o + 1] << 8) : (u8[o] << 8) | u8[o + 1]; }
  function u32(u8, o, le) { return le ? (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) >>> 0 : ((u8[o] << 24) | (u8[o + 1] << 16) | (u8[o + 2] << 8) | u8[o + 3]) >>> 0; }

  // ---------- EXIF (TIFF) ----------
  var TAGS = { 0x010E: 'ImageDescription', 0x010F: 'Make', 0x0110: 'Model', 0x0131: 'Software', 0x013B: 'Artist', 0x8298: 'Copyright', 0x9003: 'DateTimeOriginal', 0xA430: 'CameraOwnerName', 0xA433: 'LensMake', 0xA434: 'LensModel' };
  function tiff(u8, base, out) {
    if (base + 8 > u8.length) return;
    var le = u8[base] === 0x49; if (!le && u8[base] !== 0x4D) return;
    function ifd(off, depth) {
      var p = base + off; if (depth > 2 || p + 2 > u8.length) return;
      var n = u16(u8, p, le); if (n > 500) return;
      for (var i = 0; i < n; i++) {
        var e = p + 2 + i * 12; if (e + 12 > u8.length) return;
        var tag = u16(u8, e, le), type = u16(u8, e + 2, le), cnt = u32(u8, e + 4, le);
        if (tag === 0x8769) { ifd(u32(u8, e + 8, le), depth + 1); continue; }
        if (TAGS[tag] && type === 2 && cnt > 0 && cnt < 4096) {
          var vo = cnt <= 4 ? e + 8 : base + u32(u8, e + 8, le);
          if (vo + cnt <= u8.length) { var s = utf8(u8.subarray(vo, vo + cnt)).replace(/\0+$/, '').trim(); if (s) out[TAGS[tag]] = s; }
        }
      }
    }
    ifd(u32(u8, base + 4, le), 0);
  }

  // ---------- container walk ----------
  function scan(u8) {
    var r = { format: 'unknown', exif: {}, xmp: [], texts: [], c2paBox: false };
    if (u8[0] === 0xFF && u8[1] === 0xD8) {
      r.format = 'JPEG';
      var p = 2;
      while (p + 4 <= u8.length && u8[p] === 0xFF) {
        var m = u8[p + 1]; if (m === 0xD9 || m === 0xDA) break;
        if (m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { p += 2; continue; }
        var len = u16(u8, p + 2, false), d = p + 4, end = p + 2 + len;
        if (m === 0xE1) {
          if (latin1(u8, d, d + 6) === 'Exif\0\0') tiff(u8, d + 6, r.exif);
          else if (latin1(u8, d, d + 29) === 'http://ns.adobe.com/xap/1.0/\0') r.xmp.push(utf8(u8.subarray(d + 29, end)));
          else if (latin1(u8, d, d + 35) === 'http://ns.adobe.com/xmp/extension/\0') r.xmp.push(utf8(u8.subarray(d + 75, end)));
        } else if (m === 0xEB) { if (latin1(u8, d, end).indexOf('jumb') >= 0 && latin1(u8, d, end).indexOf('c2pa') >= 0) r.c2paBox = true; }
        else if (m === 0xFE) r.texts.push({ k: 'JPEG comment', v: utf8(u8.subarray(d, end)) });
        p = end;
      }
    } else if (u8[0] === 0x89 && latin1(u8, 1, 4) === 'PNG') {
      r.format = 'PNG';
      var q = 8;
      while (q + 12 <= u8.length) {
        var n = u32(u8, q, false), t = latin1(u8, q + 4, q + 8), s0 = q + 8, s1 = s0 + n;
        if (s1 > u8.length) break;
        if (t === 'tEXt' || t === 'iTXt' || t === 'zTXt') {
          var z = s0; while (z < s1 && u8[z]) z++;
          var key = latin1(u8, s0, z), val = '';
          if (t === 'tEXt') val = latin1(u8, z + 1, s1);
          else if (t === 'iTXt' && u8[z + 1] === 0) { var a = z + 3; while (a < s1 && u8[a]) a++; a++; while (a < s1 && u8[a]) a++; val = utf8(u8.subarray(a + 1, s1)); }
          else val = '(compressed text)';
          if (key === 'XML:com.adobe.xmp') r.xmp.push(val); else r.texts.push({ k: key, v: val });
        } else if (t === 'eXIf') tiff(u8, s0, r.exif);
        else if (t === 'caBX') r.c2paBox = true;
        else if (t === 'IEND') break;
        q = s1 + 4;
      }
    } else if (latin1(u8, 0, 4) === 'RIFF' && latin1(u8, 8, 12) === 'WEBP') {
      r.format = 'WebP';
      var w = 12;
      while (w + 8 <= u8.length) {
        var id = latin1(u8, w, w + 4), sz = u32(u8, w + 4, true), b0 = w + 8;
        if (id === 'EXIF') tiff(u8, b0 + (latin1(u8, b0, b0 + 6) === 'Exif\0\0' ? 6 : 0), r.exif);
        else if (id === 'XMP ') r.xmp.push(utf8(u8.subarray(b0, b0 + sz)));
        else if (id === 'C2PA') r.c2paBox = true;
        w = b0 + sz + (sz & 1);
      }
    } else if (latin1(u8, 4, 8) === 'ftyp') { r.format = /avif|avis/.test(latin1(u8, 8, 12)) ? 'AVIF' : 'HEIF'; }
    else if (latin1(u8, 0, 6) === 'GIF89a' || latin1(u8, 0, 6) === 'GIF87a') r.format = 'GIF';
    // fallback for formats walked loosely (HEIF/AVIF/GIF, unusual JPEGs): find an XMP packet and JUMBF labels anywhere
    if (!r.xmp.length || !r.c2paBox) {
      var L = latin1(u8, 0, u8.length);
      if (!r.xmp.length) { var i0 = L.indexOf('<x:xmpmeta'); if (i0 >= 0) { var i1 = L.indexOf('</x:xmpmeta>', i0); if (i1 > 0) r.xmp.push(utf8(u8.subarray(i0, i1 + 12))); } }
      if (!r.c2paBox && /jumb[\s\S]{0,64}c2pa/.test(L)) r.c2paBox = true;
    }
    return r;
  }

  // ---------- signals ----------
  var DST = {
    trainedAlgorithmicMedia: ['ai', 'Created by a generative AI model'],
    compositeWithTrainedAlgorithmicMedia: ['ai', 'Composite that includes generative AI elements'],
    algorithmicallyEnhanced: ['edit', 'Algorithmically enhanced (for example AI upscaling or denoising)'],
    algorithmicMedia: ['ai', 'Made by an algorithm without a captured scene (not necessarily a trained model)'],
    compositeSynthetic: ['ai', 'Composite that includes synthetic elements'],
    dataDrivenMedia: ['ai', 'Generated from data'],
    digitalArt: ['info', 'Digital art made by a person'],
    virtualRecording: ['info', 'Recording of a virtual scene'],
    digitalCapture: ['camera', 'Captured by a digital camera'],
    computationalCapture: ['camera', 'Camera capture with computational processing'],
    negativeFilm: ['camera', 'Scanned from a film negative'], positiveFilm: ['camera', 'Scanned from film'], print: ['camera', 'Scanned from a print'],
    screenCapture: ['info', 'Screenshot'], minorHumanEdits: ['edit', 'Capture with minor human edits'], humanEdits: ['edit', 'Edited by a person'],
    compositeCapture: ['edit', 'Composite of several captures'], composite: ['edit', 'Composite']
  };
  function dst(v) { var k = String(v || '').replace(/^.*\//, ''); return DST[k] ? { code: k, level: DST[k][0], text: DST[k][1] } : (k ? { code: k, level: 'info', text: k } : null); }
  var AI_TOOLS = [
    [/adobe\s*firefly/i, 'Adobe Firefly'], [/generative\s*(fill|expand)/i, 'Photoshop Generative Fill or Expand'], [/dall[·\-\s.]?e/i, 'DALL-E'],
    [/\bopenai\b/i, 'OpenAI'], [/chatgpt|gpt-4o|gpt-image/i, 'ChatGPT image generation'], [/midjourney/i, 'Midjourney'],
    [/stable\s*diffusion|stability\.ai|\bsdxl\b/i, 'Stable Diffusion'], [/comfyui/i, 'ComfyUI'], [/invokeai/i, 'InvokeAI'], [/novelai/i, 'NovelAI'],
    [/\bimagen\b/i, 'Google Imagen'], [/\bgemini\b/i, 'Google Gemini'], [/ideogram/i, 'Ideogram'], [/leonardo\.?\s?ai/i, 'Leonardo.Ai'],
    [/\bFLUX(\.1)?\b|black\s*forest\s*labs/, 'FLUX'], [/bing\s*image\s*creator|image\s*creator\s*from\s*microsoft|microsoft\s*designer/i, 'Microsoft image generator'],
    [/runway\s?ml|\brunway\b/i, 'Runway'], [/\bkrea\b/i, 'Krea'], [/playground\s?ai/i, 'Playground AI'], [/recraft/i, 'Recraft'], [/imagine\s+with\s+meta|meta\s+ai/i, 'Meta AI'],
    [/canva\s*(magic|ai|dream)/i, 'Canva AI']
  ];
  var EDITORS = /photoshop|lightroom|gimp|affinity|pixelmator|capture one|snapseed|picsart|canva|luminar|darktable|rawtherapee|photopea|figma|sketch/i;
  var RENDER = /lumion|enscape|v-?ray|corona|twinmotion|unreal|blender|3ds\s*max|sketchup|d5\s*render|keyshot|chaos/i;
  function toolHits(s) { var out = []; AI_TOOLS.forEach(function (t) { if (t[0].test(s) && out.indexOf(t[1]) < 0) out.push(t[1]); }); return out; }
  function xmpVals(x, name) { var out = [], re = new RegExp(name + '\\s*=\\s*"([^"]*)"|<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>', 'g'), m; while ((m = re.exec(x))) { var v = (m[1] != null ? m[1] : m[2]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); if (v) out.push(v); } return out; }

  function signals(r) {
    var S = [];
    function add(level, what, where, value) { S.push({ level: level, what: what, where: where, value: value }); }
    var e = r.exif;
    if (e.Software) { var th = toolHits(e.Software); if (th.length) add('ai', 'Names a generative AI tool: ' + th.join(', '), 'EXIF Software', e.Software); else if (RENDER.test(e.Software)) add('info', '3D rendering software', 'EXIF Software', e.Software); else if (EDITORS.test(e.Software)) add('edit', 'Saved by an image editor', 'EXIF Software', e.Software); else add('info', 'Software that last saved the file', 'EXIF Software', e.Software); }
    ['ImageDescription', 'Artist', 'Copyright'].forEach(function (k) { if (e[k]) { var th = toolHits(e[k]); if (th.length) add('ai', 'Names a generative AI tool: ' + th.join(', '), 'EXIF ' + k, e[k]); } });
    if (e.Make || e.Model) add('camera', 'Camera make and model recorded', 'EXIF', [e.Make, e.Model].filter(Boolean).join(' ') + (e.DateTimeOriginal ? ', taken ' + e.DateTimeOriginal : ''));
    r.xmp.forEach(function (x) {
      xmpVals(x, 'Iptc4xmpExt:DigitalSourceType').concat(xmpVals(x, 'Iptc4xmpCore:DigitalSourceType')).forEach(function (v) { var d = dst(v); if (d) add(d.level, d.text, 'XMP IPTC digital source type', d.code); });
      xmpVals(x, 'xmp:CreatorTool').forEach(function (v) { var th = toolHits(v); add(th.length ? 'ai' : RENDER.test(v) ? 'info' : EDITORS.test(v) ? 'edit' : 'info', th.length ? 'Names a generative AI tool: ' + th.join(', ') : 'Creator tool', 'XMP CreatorTool', v); });
      xmpVals(x, 'stEvt:softwareAgent').forEach(function (v) { var th = toolHits(v); if (th.length) add('ai', 'Edit history names a generative AI tool: ' + th.join(', '), 'XMP edit history', v); });
      xmpVals(x, 'dcterms:provenance').forEach(function (v) { add('info', 'Points to Content Credentials stored online (not fetched by this page)', 'XMP dcterms:provenance', v); });
      var rest = toolHits(x.replace(/xmp:CreatorTool[^>]*>|stEvt:softwareAgent[^>]*>/g, ''));
      var named = S.map(function (s) { return s.what; }).join(' ');
      rest.forEach(function (t) { if (named.indexOf(t) < 0) add('ai', 'Mentions a generative AI tool: ' + t, 'XMP metadata', t); });
    });
    r.texts.forEach(function (t) {
      var k = t.k, v = t.v || '';
      if (k === 'parameters' && /Steps:\s*\d+/.test(v)) add('ai', 'Stable Diffusion generation parameters (prompt, sampler, steps)', 'PNG text "parameters"', v.slice(0, 160));
      else if ((k === 'prompt' || k === 'workflow') && /class_type|"nodes"/.test(v)) add('ai', 'ComfyUI workflow embedded', 'PNG text "' + k + '"', v.slice(0, 120));
      else if (/^(invokeai_metadata|sd-metadata|Dream|NovelAI)$/i.test(k)) add('ai', 'Generator metadata embedded', 'PNG text "' + k + '"', v.slice(0, 120));
      else { var th = toolHits(k + ' ' + v); if (th.length) add('ai', 'Names a generative AI tool: ' + th.join(', '), (r.format === 'PNG' ? 'PNG text "' : '') + k + (r.format === 'PNG' ? '"' : ''), v.slice(0, 160)); }
    });
    return S;
  }

  // ---------- C2PA (official library) ----------
  var c2paP = null;
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function loadC2pa() {
    if (!c2paP) c2paP = Promise.all([import(C2PA_JS), fetch(WASM_URL, { mode: 'cors', cache: 'force-cache' }).then(function (r) { if (!r.ok) throw new Error('wasm ' + r.status); return r.arrayBuffer(); })])
      .then(function (a) {
        var lib = a[0], buf = a[1];
        return crypto.subtle.digest('SHA-256', buf).then(function (h) {
          if (hex(h) !== WASM_SHA256) throw new Error('integrity');
          return WebAssembly.compile(buf);
        }).then(function (mod) { return lib.createC2pa({ wasmSrc: mod }); })
          .then(function (c2pa) {
            var o = location.origin;
            var ctx = new lib.Context({ verify: { verifyTrust: true, remoteManifestFetch: false, ocspFetch: false }, trust: { trustAnchors: o + TRUST + 'c2pa-trust-list.pem', userAnchors: o + TRUST + 'cc-interim-anchors.pem', trustConfig: o + TRUST + 'store.cfg' } });
            return { lib: lib, c2pa: c2pa, ctx: ctx };
          });
      }).catch(function (e) { c2paP = null; throw e; });
    return c2paP;
  }
  function readC2pa(file) {
    return loadC2pa().then(function (L) {
      return L.lib.Reader.fromBlob(L.c2pa, file.type || undefined, file, L.ctx).then(function (rd) {
        if (!rd) return null;
        return rd.manifestStore().then(function (st) {
          var am = st.active_manifest && st.manifests[st.active_manifest], thumbP = Promise.resolve(null);
          if (am && am.thumbnail && am.thumbnail.identifier) thumbP = rd.resourceToBytes(am.thumbnail.identifier).then(function (b) { return URL.createObjectURL(new Blob([b], { type: am.thumbnail.format || 'image/jpeg' })); }).catch(function () { return null; });
          return thumbP.then(function (t) { rd.free(); return { store: st, thumb: t }; });
        });
      });
    });
  }
  var ACT = { 'c2pa.created': 'created', 'c2pa.opened': 'opened an existing file', 'c2pa.edited': 'edited', 'c2pa.color_adjustments': 'colour adjusted', 'c2pa.cropped': 'cropped',
    'c2pa.resized': 'resized', 'c2pa.placed': 'placed another image into it', 'c2pa.converted': 'converted to another format', 'c2pa.filtered': 'filter applied', 'c2pa.drawing': 'drawn on',
    'c2pa.published': 'published', 'c2pa.transcoded': 'transcoded', 'c2pa.repackaged': 'repackaged', 'c2pa.removed': 'something removed', 'c2pa.orientation': 'rotated or flipped',
    'c2pa.edited.metadata': 'metadata edited', 'c2pa.watermarked': 'watermarked', 'c2pa.redacted': 'redacted', 'c2pa.translated': 'translated' };
  var FAIL = { 'assertion.dataHash.mismatch': 'The pixels changed after the credentials were signed.', 'assertion.bmffHash.mismatch': 'The file changed after the credentials were signed.',
    'assertion.boxesHash.mismatch': 'The file changed after the credentials were signed.', 'claimSignature.mismatch': 'The signature does not match the credentials: they were altered.',
    'signingCredential.untrusted': 'The signer\'s certificate is not on the trust lists this page loads, so we cannot say who really signed.',
    'signingCredential.expired': 'The signing certificate had expired.', 'signingCredential.revoked': 'The signing certificate was revoked.', 'signingCredential.invalid': 'The signing certificate is not valid for signing.',
    'claimSignature.outsideValidity': 'The signature was made outside the certificate\'s validity period.', 'assertion.hashedURI.mismatch': 'Part of the credentials was changed after signing.',
    'assertion.missing': 'A part of the credentials that the signature covers is missing.', 'manifest.inaccessible': 'The credentials could not be read.' };
  function summarize(st) {
    var am = st.manifests[st.active_manifest] || {}, si = am.signature_info || {}, vr = (st.validation_results || {}).activeManifest || {};
    var acts = [], srcs = [], agents = [];
    (am.assertions || []).forEach(function (a) {
      if (!/^c2pa\.actions/.test(a.label || '')) return;
      ((a.data || {}).actions || []).forEach(function (x) {
        acts.push(ACT[x.action] || x.action);
        if (x.digitalSourceType) { var d = dst(x.digitalSourceType); if (d) srcs.push(d); }
        var sa = x.softwareAgent; if (sa) { var nm = typeof sa === 'string' ? sa : [sa.name, sa.version].filter(Boolean).join(' '); if (nm && agents.indexOf(nm) < 0) agents.push(nm); }
      });
    });
    var gen = (am.claim_generator_info || []).map(function (g) { return [g.name, g.version].filter(Boolean).join(' '); }).filter(Boolean);
    if (!gen.length && am.claim_generator) gen = [am.claim_generator];
    var trusted = (vr.success || []).filter(function (x) { return x.code === 'signingCredential.trusted'; })[0];
    var failures = (vr.failure || []).map(function (x) { return { code: x.code, text: FAIL[x.code] || x.explanation || x.code }; });
    var state = st.validation_state || (failures.length ? 'Invalid' : 'Valid');
    return { state: state, issuer: si.issuer, cn: si.common_name, time: si.time, alg: si.alg, gen: gen, title: am.title, acts: acts, srcs: srcs, agents: agents,
      ingredients: (am.ingredients || []).length, manifests: Object.keys(st.manifests || {}).length,
      trustedBy: trusted ? (/user/i.test(trusted.explanation || '') ? 'the Content Credentials interim trust list' : 'the official C2PA Trust List') : null,
      failures: failures, untrustedOnly: failures.length === 1 && failures[0].code === 'signingCredential.untrusted' };
  }

  // ---------- UI ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var $ = function (id) { return document.getElementById(id); };
  var out = $('icProv'), cur = 0;
  function tag(level) { return level === 'ai' ? '<span class="ft-tag look">Generative AI</span>' : level === 'edit' ? '<span class="ft-tag note">Edited</span>' : level === 'camera' ? '<span class="ft-tag ok">Camera</span>' : '<span class="ft-tag info">Info</span>'; }
  function c2paHtml(res) {
    if (!res) return '<article class="ft-f"><h3><span class="ft-tag info">None found</span>No Content Credentials in this file</h3><p>The official C2PA library read the file and found no manifest. That is the normal case: most cameras, phones and websites do not add credentials yet, and re-saving, screenshots and most uploads remove them.</p></article>';
    var s = summarize(res.store), bad = s.failures.filter(function (f) { return f.code !== 'signingCredential.untrusted'; });
    var cls = bad.length ? 'look' : s.trustedBy ? 'ok' : 'note';
    var head = bad.length ? '<span class="ft-tag look">Failed</span>Content Credentials present, but they do not verify' : s.trustedBy ? '<span class="ft-tag ok">Verified</span>Content Credentials verified, signer on ' + esc(s.trustedBy) : '<span class="ft-tag note">Signed, signer unknown</span>Content Credentials intact, but the signer is not on a trust list we load';
    var h = '<article class="ft-f ' + cls + '"><h3>' + head + '</h3>';
    if (res.thumb) h += '<img class="ft-thumb" style="max-width:160px;margin-top:8px" alt="Thumbnail stored inside the credentials" src="' + res.thumb + '">';
    h += '<ul>';
    h += '<li><b>Signed by:</b> ' + esc(s.issuer || 'not stated') + (s.cn ? ' (certificate name: ' + esc(s.cn) + ')' : '') + (s.time ? ', signed ' + esc(String(s.time).slice(0, 10)) : '') + '</li>';
    if (s.gen.length) h += '<li><b>Tool that wrote the credentials:</b> ' + esc(s.gen.join(', ')) + '</li>';
    if (s.agents.length) h += '<li><b>Software named in the edit history:</b> ' + esc(s.agents.join(', ')) + '</li>';
    if (s.srcs.length) h += '<li><b>Declared source:</b> ' + s.srcs.map(function (d) { return tag(d.level) + ' ' + esc(d.text); }).join('; ') + '</li>';
    if (s.acts.length) h += '<li><b>Recorded actions:</b> ' + esc(s.acts.filter(function (a, i, A) { return A.indexOf(a) === i; }).join(', ')) + '</li>';
    h += '<li><b>History:</b> ' + s.manifests + ' signed step' + (s.manifests === 1 ? '' : 's') + ', ' + s.ingredients + ' ingredient' + (s.ingredients === 1 ? '' : 's') + ' (earlier files it was made from)</li>';
    h += '</ul>';
    if (s.failures.length) h += '<p><b>Validation:</b></p><ul>' + s.failures.map(function (f) { return '<li><code>' + esc(f.code) + '</code>: ' + esc(f.text) + '</li>'; }).join('') + '</ul>';
    else h += '<p><b>Validation:</b> signature, certificate chain and content hashes all check out (' + esc(s.state) + ').</p>';
    h += '<div class="ft-mean"><div><b>What it means</b>' + (bad.length ? 'The file says it has a signed history, but the check failed: the image or its credentials were changed after signing. Treat the history as unreliable.' : 'A signed record of where this file came from and what was done to it. ' + (s.srcs.some(function (d) { return d.level === 'ai'; }) ? 'It declares generative AI as a source.' : 'It does not declare generative AI as a source.')) + '</div>' +
      '<div><b>What it does not prove</b>That the scene is real or that the statements are true: credentials record what the signing tool was told and did. A trusted signer means we know who signed, not that the content is honest.</div></div></article>';
    return h;
  }
  function metaHtml(r, S) {
    var ai = S.filter(function (s) { return s.level === 'ai'; });
    var h = '<article class="ft-f ' + (ai.length ? 'look' : 'note') + '"><h3>' + (ai.length ? '<span class="ft-tag look">Signal</span>The file\'s metadata names a generative AI tool or source' : '<span class="ft-tag info">No AI signal</span>No generative-AI signal in the metadata') + '</h3>';
    if (S.length) h += '<ul>' + S.map(function (s) { return '<li>' + tag(s.level) + ' ' + esc(s.what) + ' <span class="ft-file">(' + esc(s.where) + ': ' + esc(String(s.value).slice(0, 200)) + ')</span></li>'; }).join('') + '</ul>';
    else h += '<p>No EXIF, XMP or text fields that describe how the file was made. ' + esc(r.format) + ' file.</p>';
    h += '<div class="ft-mean"><div><b>What it means</b>' + (ai.length ? 'Whoever or whatever saved this file wrote the name of a generative tool or an AI source type into it. That is a strong reason to ask how the picture was made.' : 'Nothing in the file says it was generated. ') + '</div>' +
      '<div><b>What it does not prove</b>' + (ai.length ? 'Metadata is not signed: anyone can add or edit it. ' : 'That the image is genuine. Most generators and almost every website strip metadata, and a screenshot or re-save removes it. ') + 'This page does not guess from the pixels: we do not run an AI detector, because none we know of is reliable enough to publish an accuracy for.</div></div></article>';
    return h;
  }
  function render(file, r, S, c2) {
    var h = '<h2 class="ft-h">Where did this image come from?</h2><p class="ft-file">' + esc(file.name || 'image') + ' &middot; ' + esc(r.format) + ' &middot; read in your browser</p><div class="ft-out" style="margin-top:12px">';
    h += c2 + metaHtml(r, S) + '</div>';
    out.innerHTML = h; out.hidden = false;
  }
  function run(file, force) {
    if (!file || !out) return;
    var my = ++cur;
    file.arrayBuffer().then(function (ab) {
      var u8 = new Uint8Array(ab), r = scan(u8), S = signals(r);
      if (!r.c2paBox && !force) {
        render(file, r, S, '<article class="ft-f"><h3><span class="ft-tag info">None found</span>No embedded Content Credentials</h3><p>The file has no C2PA manifest box. That is the normal case: most cameras, phones and websites do not add credentials yet, and re-saving or uploading usually removes them. Absence proves nothing either way.</p><p><button type="button" class="btn btn-line btn-sm" id="icProvForce">Run the official C2PA reader anyway</button> <span class="ft-file">(downloads the 2.7 MB C2PA library once)</span></p></article>');
        var b = $('icProvForce'); if (b) b.addEventListener('click', function () { run(file, true); });
        return;
      }
      render(file, r, S, '<article class="ft-f"><h3><span class="ft-tag info">Checking</span>Content Credentials found: verifying with the official C2PA library...</h3><p class="ft-file">First use downloads the library (2.7 MB) and checks its SHA-256 before running it.</p></article>');
      readC2pa(file).then(function (res) { if (my === cur) render(file, r, S, c2paHtml(res)); })
        .catch(function (e) {
          if (my !== cur) return;
          var em = String(e && e.message || e), ru = em.match(/RemoteManifestUrl\("([^"]+)"\)/);
          if (ru) { render(file, r, S, '<article class="ft-f note"><h3><span class="ft-tag note">Stored online</span>The file points to Content Credentials stored online</h3><p>The credentials are not inside the file but on a server: <span class="ft-file">' + esc(ru[1].slice(0, 200)) + '</span>. This page does not fetch them, because that request would tell the server you have this image. You can verify the file at contentcredentials.org/verify.</p></article>'); return; }
          var msg = em === 'integrity' ? 'The downloaded C2PA library did not match its pinned SHA-256, so it was not run.' : 'The C2PA library could not run in this browser (' + esc(String(e && e.message || e).slice(0, 120)) + ').';
          render(file, r, S, '<article class="ft-f note"><h3><span class="ft-tag note">Not verified</span>Credentials are present but could not be verified here</h3><p>' + msg + ' You can verify the file at contentcredentials.org/verify.</p></article>');
        });
    }).catch(function () {});
  }
  var inp = $('icFile'), drop = $('icDrop');
  if (inp) inp.addEventListener('change', function () { run(inp.files[0]); });
  if (drop) drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f && /^image\//.test(f.type || 'image/')) run(f); });
  window.KPROV = { scan: scan, signals: signals, summarize: summarize };
})();
