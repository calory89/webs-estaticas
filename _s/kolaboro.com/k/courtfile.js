/* Kolaboro evidence bundle ("court-ready case file"), built entirely in the browser.
 * KBCourt.project(id, opts)          bundle for a public project id, from the signed open API, the public log and open data files
 * KBCourt.caseFile(c, x, token, o)   bundle for a buyer's case in the client portal (files are re-hashed here; nothing personal is sent anywhere)
 * Both return { pdf: Uint8Array, pdfSha, manifest, manifestText, manifestSha, results } and download nothing by themselves.
 * Only the SHA-256 of the finished PDF leaves the device: registered like the case-file PDFs, and timestamped with OpenTimestamps.
 * Offline check: kolaboro.com/court-file/check-bundle.mjs with kolaboro-verify.js from github.com/calory89/kolaboro-open.
 */
(function () {
  var FORMAT = 'kolaboro-bundle-v1', GEN = 'https://kolaboro.com/k/courtfile.js';
  var KVSRC = '/open/kolaboro-verify.js?v=5c8f2ef50f';
  var SRI = { 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js': 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js': 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU' };
  function load(s) { return new Promise(function (res, rej) { var ex = document.querySelector('script[src="' + s + '"]'); if (ex) { if (ex.dataset.ok || (s === KVSRC && window.KV) || (/jspdf/.test(s) && window.jspdf) || (/qrcode/.test(s) && window.QRCode)) return res(); ex.addEventListener('load', function () { res(); }); ex.addEventListener('error', rej); return; } var e = document.createElement('script'); e.src = s; if (SRI[s]) { e.integrity = SRI[s]; e.crossOrigin = 'anonymous'; } e.onload = function () { e.dataset.ok = '1'; res(); }; e.onerror = function () { rej(new Error('could not load ' + s)); }; document.head.appendChild(e); }); }
  function libs() { return Promise.all([load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'), load('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'), load(KVSRC)]); }
  var te = new TextEncoder();
  function hex(b) { return [].map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(x) { return crypto.subtle.digest('SHA-256', typeof x === 'string' ? te.encode(x) : x).then(hex); }
  function b64bytes(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function now() { return new Date().toISOString(); }
  function iso(t) { return t ? new Date(t).toISOString().slice(0, 19) + 'Z' : ''; }
  function utc(t) { return t ? new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '-'; }
  function short(h) { return h ? h.slice(0, 12) + '...' + h.slice(-6) : '-'; }

  // fetch a public address and keep the exact bytes, the time and the signature headers
  function grab(path) {
    var at = now();
    return fetch(path, { cache: 'no-store' }).then(function (r) {
      return r.text().then(function (t) { return { path: path, url: 'https://kolaboro.com' + path, status: r.status, text: t, at: at, sig: r.headers.get('x-kolaboro-signature'), kid: r.headers.get('x-kolaboro-key-id'), dsha: r.headers.get('x-kolaboro-dataset-sha256'), type: (r.headers.get('content-type') || '').split(';')[0] }; });
    });
  }
  function stampOf(h) {
    return fetch('/api/kb/stamp?hash=' + h, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { return d && d.found ? d.stamp : null; }).catch(function () { return null; })
      .then(function (st) {
        if (!st) return null;
        var o = { created_at: st.created_at, calendars: st.calendars || [], bitcoin_block: st.bitcoin_block || null, ots_b64: st.ots || null, attestations: [] };
        if (!st.ots || !window.KV) return o;
        return KV.otsBitcoin(b64bytes(st.ots), h).then(function (a) { o.attestations = a; return o; }).catch(function () { return o; });
      });
  }
  function otsText(o) {
    if (!o) return 'not timestamped individually';
    var a = (o.attestations || []).map(function (x) { return x.height; });
    return 'OpenTimestamps ' + utc(o.created_at) + (a.length ? ', in Bitcoin block ' + a.join(', ') : o.bitcoin_block ? ', Bitcoin block ' + o.bitcoin_block : ', Bitcoin confirmation pending');
  }
  function keyOf() {
    return fetch('/.well-known/kolaboro-keys.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (k) {
      var a = (k.keys || []).filter(function (x) { return x.status === 'active'; })[0] || (k.keys || [])[0]; return { kid: a.kid, alg: a.alg, raw_b64: a.public_key_raw_b64, source: 'https://kolaboro.com/.well-known/kolaboro-keys.json' };
    });
  }
  function sigOk(g, key) { return g.sig ? KV.verifySignature(g.text, g.sig, key.raw_b64) : Promise.resolve(false); }

  // the public log: every head recomputes and links, the checkpoint is signed, one head is proven inside the checkpoint tree
  function logPart(key, pick, step) {
    step('Reading the public log and its signed checkpoint');
    return Promise.all([grab('/api/open/log'), grab('/api/open/checkpoint')]).then(function (r) {
      var lg = r[0], cp = r[1], heads = (JSON.parse(lg.text).heads || []).slice().sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      return Promise.all([sigOk(lg, key), KV.verifyLog(heads), KV.verifyCheckpoint(cp.text, key.raw_b64)]).then(function (v) {
        var head = pick(heads) || null, out = { log: lg, checkpoint: cp, heads: heads, log_sig_ok: v[0], chain: v[1], cp: v[2], head: head };
        if (!head) return out;
        step('Proving the ' + head.day + ' log line is inside the checkpoint tree');
        return grab('/api/open/log-proof?day=' + head.day).then(function (lp) {
          var p = JSON.parse(lp.text); out.proof = lp; out.proofJson = p;
          return Promise.all([sigOk(lp, key), KV.verifyInclusion(p.leaf, p.leaf_index, p.tree_size, p.path, p.root_hash), KV.headHash(head), stampOf(head.head)]).then(function (w) {
            out.proof_sig_ok = w[0]; out.inclusion_ok = w[1] && p.leaf === head.day + ' ' + head.head && p.root_hash === out.cp.root && p.tree_size === out.cp.size;
            out.head_recomputes = w[2] === head.head; out.head_stamp = w[3]; return out;
          });
        });
      });
    });
  }

  // ------------------------------------------------------------------ public project
  function project(id, opts) {
    opts = opts || {}; var step = opts.onStep || function () {};
    id = String(id || '').trim().toUpperCase();
    if (!/^[A-Z0-9 -]{3,20}$/.test(id)) return Promise.reject(new Error('That is not a project id (for example BALI-048).'));
    var key, ex = [], R = {};
    step('Loading the PDF library and the open verifier');
    return libs().then(keyOf).then(function (k) {
      key = k; step('Fetching the signed project record');
      return grab('/api/open/projects/' + encodeURIComponent(id));
    }).then(function (g) {
      if (g.status !== 200) throw new Error('No tracked project with id ' + id + '.');
      var pj = JSON.parse(g.text), p = pj.project || {}; id = p.id || id;
      return Promise.all([sha(g.text), sigOk(g, key), stampOf_(g)]).then(function (v) {
        ex.push({ ref: 'record', title: 'Project record ' + id + ' (open data API)', kind: 'signed API answer', g: g, sha256: v[0], sig_ok: v[1], ots: v[2], dataset_sha256: g.dsha,
          origin: 'Kolaboro open data API, computed from the dataset named in x-kolaboro-dataset-sha256',
          summary: [p.market + ', ' + (p.country || '') + '. Stage: ' + (p.stage || 'not stated') + '. Promised completion: ' + (p.done || 'not stated') + '.',
            'Public checks: ' + p.score + ' of ' + (p.max || 6) + '. Confirmed by a register or independent source: ' + (p.vscore == null ? 'not rated' : p.vscore + ' of 6') + '. Tier: ' + (p.tier || '-') + '.',
            'Developer claims tested: ' + ((p.claims || {}).verified || 0) + ' verified, ' + ((p.claims || {}).unverified || 0) + ' unverified, ' + ((p.claims || {}).contradicted || 0) + ' contradicted. Public problems recorded: ' + (p.flags || 0) + '.' + (p.delay ? ' Delay: ' + p.delay + ' months.' : ''),
            'Verification level per check: ' + Object.keys(p.verification || {}).map(function (k2) { return k2 + ' ' + p.verification[k2]; }).join(', ') + '.'] });
        step('Fetching the page fingerprint and its Merkle proof');
        return grab('/api/open/proof/' + encodeURIComponent(id));
      });
    }).then(function (g) {
      if (g.status !== 200) { R.no_fingerprint = true; return; }
      var pr = JSON.parse(g.text);
      return Promise.all([sha(g.text), sigOk(g, key), KV.verifyProof(pr), stampOf_(g)]).then(function (v) {
        ex.push({ ref: 'proof', title: 'Developer page fingerprint and Merkle proof', kind: 'signed API answer', g: g, sha256: v[0], sig_ok: v[1], proof_ok: v[2], ots: v[3], projects_root: pr.projects_root,
          origin: 'Kolaboro crawler: SHA-256 of the developer page text it read on ' + (pr.page_fingerprint_date || 'the date shown'),
          summary: ['Page fingerprint ' + pr.line.split(' ')[1] + ' read ' + (pr.page_fingerprint_date || '-') + '.', 'Leaf ' + (pr.index + 1) + ' of ' + pr.leaves + '; ' + pr.path.length + ' hashes lead to root ' + pr.projects_root + '. Recomputed in this browser: ' + (v[2] ? 'matches' : 'DOES NOT MATCH') + '.'] });
      });
    }).then(function () {
      step('Fetching the change history');
      return grab('/api/open/changes?since=2000-01-01');
    }).then(function (g) {
      var all = JSON.parse(g.text).changes || [], mine = all.filter(function (x) { return x.project === id; });
      return Promise.all([sha(g.text), sigOk(g, key), stampOf_(g)]).then(function (v) {
        ex.push({ ref: 'changes', title: 'Recorded changes to the developer page', kind: 'signed API answer', g: g, sha256: v[0], sig_ok: v[1], ots: v[2], dataset_sha256: g.dsha,
          origin: 'Kolaboro open data API: every change to a project field, all projects (' + all.length + ' lines, ' + mine.length + ' for ' + id + ')',
          summary: mine.length ? mine.slice(0, 25).map(function (x) { return x.date + ': ' + x.field + ' changed from ' + JSON.stringify(x.from) + ' to ' + JSON.stringify(x.to); }).concat(mine.length > 25 ? ['and ' + (mine.length - 25) + ' more in the answer'] : []) : ['No change recorded for ' + id + '.'] });
        step('Hashing the full open dataset file');
        return grab('/data/bali-cases.json');
      });
    }).then(function (g) {
      return sha(g.text).then(function (h) {
        return stampOf(h).then(function (st) {
          ex.push({ ref: 'dataset', title: 'Open dataset file the record was computed from', kind: 'data file', g: g, sha256: h, ots: st, keep_body: false, dataset_sha256: h,
            origin: 'Kolaboro open dataset, CC BY 4.0, published daily', summary: ['SHA-256 of the file as downloaded: ' + h + '.', 'The signed record names dataset ' + (ex[0].dataset_sha256 || '-') + ': ' + (ex[0].dataset_sha256 === h ? 'the same file.' : 'a different version (the data was updated between the two downloads).'), 'The file is ' + g.text.length.toLocaleString('en') + ' bytes and is not copied into the manifest; the log line names it.'] });
        });
      });
    }).then(function () {
      step('Reading natural hazards for the project area');
      return grab('/data/hazards.json');
    }).then(function (g) {
      var hz = null; try { hz = JSON.parse(g.text); } catch (e) {}
      var e = hz && hz.projects ? hz.projects[id] : null;
      return sha(g.text).then(function (h) {
        return stampOf(h).then(function (st) {
          ex.push({ ref: 'hazards', title: 'Natural hazards near the project (open data file)', kind: 'data file', g: g, sha256: h, ots: st, keep_body: false,
            origin: 'Kolaboro hazards file built from Copernicus DEM, WRI Aqueduct, USGS, NOAA NCEI, Smithsonian GVP and OpenStreetMap (updated ' + (hz && hz.updated || '-') + ')',
            summary: e ? ['Height about ' + e.elev_m + ' m. 100-year flood depth: river ' + e.flood_river_m + ' m, coast ' + e.flood_coast_m + ' m.', 'Earthquakes M5+ within 100 km since 1900: ' + ((e.quakes || {}).m5) + ' (M6+: ' + ((e.quakes || {}).m6) + '). Tsunami run-ups within 50 km: ' + ((e.tsunami || {}).runups) + '. Coast: ' + e.coast + '.', 'Figures are rounded so they cannot pinpoint the plot. This file is not signed and not in the public log: it is a copy of a public file on the capture date.'] : ['No coordinates for ' + id + ' in the hazards file, so no hazard figures. This file is not signed and not in the public log.'], hz_entry: e });
        });
      });
    }).then(function () {
      var dsha = ex[0].dataset_sha256, proot = (ex.filter(function (x) { return x.ref === 'proof'; })[0] || {}).projects_root;
      return logPart(key, function (heads) {
        var m = heads.filter(function (h) { return h.dataset_sha256 === dsha || h.projects_root === proot; }); return m[m.length - 1] || heads[heads.length - 1];
      }, step);
    }).then(function (L) {
      ex.forEach(function (x) { x.in_log = !!(L.head && ((x.dataset_sha256 && x.dataset_sha256 === L.head.dataset_sha256) || (x.projects_root && x.projects_root === L.head.projects_root))); });
      var ua = navigator.userAgent.slice(0, 110);
      var custody = ex.map(function (x, i) { return { no: i + 1, exhibit: x.title, produced_by: x.origin, captured_by: 'this browser (' + ua + ')', captured_at: x.g.at, source: x.g.url, signed: x.g.sig ? (x.sig_ok ? 'yes, key ' + x.g.kid + ', verified' : 'signature does not verify') : 'no' }; });
      return finish({ type: 'project', id: id, title: 'Project ' + id, key: key, ex: ex, L: L, custody: custody, step: step, R: R });
    });
  }
  function stampOf_(g) { return sha(g.text).then(stampOf); }

  // ------------------------------------------------------------------ buyer's case
  function caseFile(c, x, token, opts) {
    opts = opts || {}; var step = opts.onStep || function () {};
    var key, ev = (x.evidence || []).slice(), items = [];
    step('Loading the PDF library and the open verifier');
    return libs().then(keyOf).then(function (k) {
      key = k; step('Re-checking the evidence chain');
      var prev = null, bad = [], i = 0;
      function link() {
        if (i >= ev.length) return Promise.resolve();
        var e = ev[i];
        return sha((prev || 'genesis:' + c.id) + '|' + e.sha256 + '|' + e.kind + '|' + iso(e.taken_at)).then(function (h) { e._link = h === e.chain && (e.prev || null) === prev; if (!e._link) bad.push(e.id); prev = e.chain; i++; return link(); });
      }
      return link().then(function () { items.chain_ok = !bad.length; items.head = prev; });
    }).then(function () {
      var n = 0, j = 0;
      function each() {
        if (j >= ev.length) return Promise.resolve();
        var e = ev[j++]; n++; step('Exhibit ' + n + ' of ' + ev.length + ': fingerprint, receipt and timestamp');
        var file = e.file && n <= 40 ? KB.rpc('kolaboro_case', { p_token: token, p_action: 'file', p_payload: { case_id: c.id, id: e.id } }).then(function (d) {
          if (!d || !d.url || d.url.indexOf(',') < 0) return null; var u = b64bytes(d.url.split(',')[1]); return sha(u).then(function (h) { return { sha: h, bytes: u.length, type: d.url.slice(5, d.url.indexOf(';')) }; });
        }).catch(function () { return null; }) : Promise.resolve(null);
        return Promise.all([file, grab('/api/open/receipt/' + e.id).catch(function () { return null; }), stampOf(e.sha256)]).then(function (v) {
          var rc = v[1] && v[1].status === 200 ? v[1] : null, rj = null; try { rj = rc ? JSON.parse(rc.text) : null; } catch (er) {}
          return Promise.all([rc ? sigOk(rc, key) : false, rj && rj.passkey ? KV.verifyPhotoSignature(rj) : Promise.resolve(null), rc ? sha(rc.text) : null]).then(function (w) {
            items.push({ e: e, file: v[0], receipt: rc, receipt_json: rj, receipt_sig_ok: w[0], passkey: w[1], receipt_sha: w[2], ots: v[2] });
            return each();
          });
        });
      }
      return each();
    }).then(function () {
      if (!items.head) return null;
      step('Timestamping the case fingerprint (OpenTimestamps)');
      return fetch('/api/kb/stamp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hash: items.head, source: 'court-file' }) }).then(function (r) { return r.json(); }).catch(function () { return null; }).then(function () { return stampOf(items.head); });
    }).then(function (headStamp) {
      items.head_stamp = headStamp;
      var acc = ev.filter(function (e) { return e.status === 'accepted'; }).slice().sort(function (a, b) { return a.id - b.id; });
      var lines = acc.map(function (e) { return e.id + ' ' + e.sha256; });
      return logPart(key, function (heads) { return heads[heads.length - 1]; }, step).then(function (L) {
        step('Looking for this case\'s evidence in the daily log roots');
        var m = Promise.resolve(null), hs = L.heads.filter(function (h) { return h.evidence_root; }).reverse();
        hs.forEach(function (h) { m = m.then(function (f) { return f || KV.verifyEvidenceLines(lines, h.evidence_root).then(function (ok) { return ok ? h : null; }); }); });
        return m.then(function (h) { L.evidence_head = h; L.evidence_lines = lines; return L; });
      });
    }).then(function (L) {
      var ex = items.map(function (it, i) {
        var e = it.e, K = { photo: 'Site photo', document: 'Document', note: 'Agent note', satellite: 'Satellite image', plot: 'Plot map', report: 'Report', video: 'Site video' }, m = e.meta || {}, s = [];
        if (m.result && m.result.summary) s.push(String(m.result.summary));
        if (m.text) s.push('"' + m.text + '"');
        if (e.kind === 'satellite' && m.summary) s.push(String(m.summary));
        if (e.status !== 'accepted') s.push('Status: ' + e.status + (e.reason ? ' (' + e.reason + ')' : ''));
        s.push(it.file ? 'File re-hashed in this browser: ' + (it.file.sha === e.sha256 ? 'matches the stored SHA-256' : 'DOES NOT MATCH (' + it.file.sha + ')') + ' (' + it.file.bytes.toLocaleString('en') + ' bytes, ' + it.file.type + ').' : e.file ? 'File not re-hashed in this bundle.' : 'No file: the fingerprint covers the recorded data.');
        if (it.receipt) s.push('Signed receipt /api/open/receipt/' + e.id + ': signature ' + (it.receipt_sig_ok ? 'verified' : 'does not verify') + '; recorded ' + utc(it.receipt_json && it.receipt_json.recorded_at) + '.');
        if (it.passkey) s.push('Capture signed with the agent\'s passkey: ' + (it.passkey.ok ? 'verified' : 'not verified (' + it.passkey.why + ')') + '.');
        return { ref: 'evidence-' + e.id, title: (K[e.kind] || e.kind) + ': ' + (e.title || ''), kind: e.kind, g: it.receipt || { at: now(), url: 'https://kolaboro.com/portal', text: '' }, sha256: e.sha256, ots: it.ots, sig_ok: it.receipt_sig_ok, captured_at_original: e.taken_at,
          origin: e.by === 'agent' ? 'Kolaboro field agent' : e.by === 'buyer' ? 'the buyer' : e.by === 'satellite' ? 'Kolaboro satellite watch (Sentinel-2)' : (e.by || '-'), summary: s, item: e, file: it.file, receipt_sha: it.receipt_sha, passkey: it.passkey };
      });
      var custody = items.map(function (it, i) { var e = it.e, m = e.meta || {};
        return { no: i + 1, item: e.id, added_by: e.by || '-', recorded_at: e.at, taken_at: e.taken_at, device: m.device || 'not recorded', gps: e.lat ? (+e.lat).toFixed(5) + ', ' + (+e.lng).toFixed(5) + (e.acc ? ' +/-' + Math.round(e.acc) + ' m' : '') : '-', passkey: it.passkey ? (it.passkey.ok ? 'signed, verified' : 'not verified') : 'not signed', chain_link: e._link ? 'OK' : 'BROKEN', status: e.status }; });
      return finish({ type: 'case', id: c.code, caseId: c.id, title: 'Case ' + c.code, subtitle: (c.project_name || '') + (c.location ? ', ' + c.location : ''), key: key, ex: ex, L: L, custody: custody, step: step, items: items, token: token, c: c, ev: ev });
    });
  }

  // ------------------------------------------------------------------ manifest, PDF, registration
  function finish(B) {
    var step = B.step, L = B.L, created = now();
    step('Writing the manifest');
    var man = { format: FORMAT, created_at: created, generator: GEN, subject: { type: B.type, id: B.id }, public_key: B.key,
      exhibits: B.ex.map(function (x, i) { var o = { no: i + 1, ref: x.ref, title: x.title, kind: x.kind, produced_by: x.origin, source: x.g.url, captured_at: x.g.at, sha256: x.sha256,
        signature: x.g.sig || null, key_id: x.g.kid || null, signature_ok: x.g.sig ? !!x.sig_ok : null, dataset_sha256: x.dataset_sha256 || null, in_log_day: x.in_log && L.head ? L.head.day : null,
        timestamp: x.ots || null, summary: x.summary };
        if (B.type === 'project' && x.keep_body !== false) o.body = x.g.text;
        if (x.ref === 'proof') o.proof_ok = !!x.proof_ok;
        if (x.ref === 'hazards') o.entry = x.hz_entry || null;
        if (B.type === 'case') { var e = x.item; o.item = { id: e.id, kind: e.kind, sha256: e.sha256, prev: e.prev, chain: e.chain, taken_at: e.taken_at, recorded_at: e.at, by: e.by, lat: e.lat, lng: e.lng, acc: e.acc, status: e.status }; o.file_rehash = x.file || null; o.captured_at = e.taken_at; o.receipt = x.g.text ? { body: x.g.text, sha256: x.receipt_sha, signature: x.g.sig, key_id: x.g.kid, fetched_at: x.g.at } : null; o.passkey = x.passkey || null; delete o.signature; delete o.key_id; o.signature_ok = x.g.sig ? !!x.sig_ok : null; }
        return o; }),
      custody: B.custody,
      log: { source: 'https://kolaboro.com/api/open/log', body: L.log.text, signature: L.log.sig, key_id: L.log.kid, fetched_at: L.log.at, signature_ok: L.log_sig_ok, chain: L.chain,
        checkpoint: { text: L.checkpoint.text, fetched_at: L.checkpoint.at, ok: !!L.cp.ok, size: L.cp.size, root: L.cp.root },
        head: L.head || null, head_recomputes: !!L.head_recomputes, head_timestamp: L.head_stamp || null,
        inclusion: L.proof ? { source: L.proof.url, body: L.proof.text, signature: L.proof.sig, key_id: L.proof.kid, signature_ok: !!L.proof_sig_ok, ok: !!L.inclusion_ok } : null } };
    if (B.type === 'case') {
      man.chain = { formula: "chain = sha256((prev or 'genesis:' + case_id) + '|' + sha256 + '|' + kind + '|' + taken_at as YYYY-MM-DDTHH:MM:SSZ)", case_id: B.caseId, ok: !!B.items.chain_ok, head: B.items.head || null, head_timestamp: B.items.head_stamp || null,
        items: B.ev.map(function (e) { return { id: e.id, kind: e.kind, sha256: e.sha256, prev: e.prev || null, chain: e.chain, taken_at: e.taken_at, status: e.status }; }),
        evidence_lines: L.evidence_lines, evidence_root_day: L.evidence_head ? L.evidence_head.day : null };
    }
    var res = { signatures: B.ex.filter(function (x) { return x.g.sig; }).every(function (x) { return x.sig_ok; }) && L.log_sig_ok, log_chain: L.chain.ok, checkpoint: !!L.cp.ok, inclusion: !!L.inclusion_ok, head_recomputes: !!L.head_recomputes,
      proof: B.ex.filter(function (x) { return x.ref === 'proof'; }).every(function (x) { return x.proof_ok; }), chain: B.type === 'case' ? !!B.items.chain_ok : null,
      files: B.type === 'case' ? B.ex.filter(function (x) { return x.file; }).every(function (x) { return x.file.sha === x.sha256; }) : null, in_log: B.ex.filter(function (x) { return x.in_log; }).length };
    man.results = res;
    var text = JSON.stringify(man, null, 1);
    return sha(text).then(function (msha) {
      step('Building the PDF');
      var pdf = render(B, man, msha, res);
      return sha(pdf).then(function (psha) {
        step('Registering the PDF fingerprint');
        var reg = B.type === 'case' ? KB.rpc('kolaboro_pdf_register', { p_token: B.token, p_case_id: B.c.id, p_sha256: psha, p_head: B.items.head || '' }).catch(function () { return null; }) : Promise.resolve(null);
        var st = fetch('/api/kb/stamp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hash: psha, source: 'evidence-bundle' }) }).then(function (r) { return r.json(); }).catch(function () { return null; });
        return Promise.all([reg, st]).then(function (v) {
          return { pdf: pdf, pdfSha: psha, manifest: man, manifestText: text, manifestSha: msha, results: res, registered: !!(v[0] && !v[0].error), stamped: !!(v[1] && v[1].stamp), name: 'kolaboro-bundle-' + String(B.id).replace(/[^A-Za-z0-9-]+/g, '-') };
        });
      });
    });
  }

  function render(B, man, msha, res) {
    var J = window.jspdf.jsPDF, d = new J({ unit: 'mm', format: 'a4', compress: true }), y = 18, L = 15, W = 180, page = 1, L2 = B.L;
    d.setProperties({ title: 'Kolaboro evidence bundle: ' + B.title, subject: 'Evidence bundle (' + FORMAT + '): exhibits, SHA-256 fingerprints, timestamps, chain of custody, public log proof', author: 'Kolaboro (kolaboro.com)', keywords: 'kolaboro, evidence, sha-256, opentimestamps, merkle, ' + B.id, creator: GEN });
    try { d.setLanguage('en-GB'); } catch (e) {}
    function foot() { d.setFont('helvetica', 'normal'); d.setFontSize(7); d.setTextColor('#5E6872'); d.text('Kolaboro evidence bundle ' + B.title + ' | manifest ' + msha.slice(0, 16) + '... | page ' + page, L, 290); }
    function np() { foot(); d.addPage(); page++; y = 18; }
    function need(h) { if (y + h > 280) np(); }
    function txt(t, size, bold, color, font) { size = size || 9.5; d.setFont(font || 'helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size || 9.5); d.setTextColor(color || '#17212B'); var ls = d.splitTextToSize(clean(t), W); ls.forEach(function (s) { need(size * 0.45 + 1.3); d.text(s, L, y); y += (size || 9.5) * 0.45 + 1.2; }); }
    function h1(t) { need(16); y += 3; txt(t, 14, true); y += 1; }
    function h2(t) { need(12); y += 2; txt(t, 11, true); }
    function mono(t) { txt(t, 7.2, false, '#41505C', 'courier'); }
    function table(cols, rows) {
      d.setFontSize(6.8);
      function row(cells, bold) {
        d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(6.8);
        var wrapped = cells.map(function (c, i) { return d.splitTextToSize(clean(c), cols[i].w - 1.5); }), h = Math.max.apply(null, wrapped.map(function (w) { return w.length; })) * 2.9 + 1.8;
        if (y + h > 280) { np(); if (!bold) row(cols.map(function (c) { return c.t; }), true); }
        var x = L; d.setTextColor(bold ? '#17212B' : '#2B3640'); if (bold) { d.setFillColor('#EFEEE9'); d.rect(L, y - 3, W, h, 'F'); }
        wrapped.forEach(function (w, i) { d.text(w, x + 0.5, y); x += cols[i].w; });
        y += h; d.setDrawColor('#D8D6CE'); d.line(L, y - 2.6, L + W, y - 2.6);
      }
      row(cols.map(function (c) { return c.t; }), true); rows.forEach(function (r) { row(r); }); y += 2;
    }
    function yes(b) { return b ? 'OK' : 'FAILED'; }
    // cover
    d.setFillColor('#FF5B14'); d.circle(L + 2, y - 1.5, 2, 'F'); d.setFont('helvetica', 'bold'); d.setFontSize(15); d.setTextColor('#17212B'); d.text('kolaboro', L + 6, y); y += 14;
    txt('Evidence bundle', 22, true); txt(B.title + (B.subtitle ? ': ' + B.subtitle : ''), 13, true); y += 2;
    txt('Created ' + utc(man.created_at) + ' in the browser of the person who downloaded it. Format ' + FORMAT + '.', 9, false, '#41505C');
    txt('Manifest SHA-256: ' + msha, 8.5, false, '#41505C', 'courier'); y += 4;
    h2('What this bundle is designed to make easy');
    txt('It lists every exhibit with its SHA-256 fingerprint, where and when it was captured, its OpenTimestamps (Bitcoin) status and who recorded it, and links each exhibit to Kolaboro\'s public append-only log. Every check printed here was computed in the browser that built the bundle and can be repeated offline by an independent expert with the open-source verifiers (last page). Nothing in it depends on trusting Kolaboro\'s servers on the day of a hearing.', 9.5);
    txt('What it is not: a legal opinion, a certified translation, or a statement that any court will admit it. Admissibility depends on the court and its rules. The layout follows PDF/A habits (no scripts, no external content, metadata set), but it is not a validated PDF/A file: the standard fonts are not embedded.', 9.5, false, '#41505C');
    h2('Checks run while building it');
    var rows = [['Signatures on every signed answer (Ed25519, key ' + B.key.kid + ')', yes(res.signatures)], ['Public log: every daily head recomputes and links to the previous one', yes(res.log_chain) + ' (' + L2.chain.checked + ' heads)'], ['Signed checkpoint of the log (C2SP note)', yes(res.checkpoint)], ['Inclusion proof of the ' + (L2.head ? L2.head.day : '-') + ' log line in the checkpoint tree', yes(res.inclusion)]];
    if (B.type === 'project') rows.push(['Merkle proof of the developer page fingerprint', B.R.no_fingerprint ? 'no fingerprint for this project' : yes(res.proof)], ['Exhibits whose data is named in that log line', res.in_log + ' of ' + B.ex.length]);
    else rows.push(['Case fingerprint chain recomputed item by item', yes(res.chain)], ['Files re-hashed in this browser match their stored SHA-256', yes(res.files)], ['This case\'s evidence lines reproduce a daily evidence root', L2.evidence_head ? 'yes, ' + L2.evidence_head.day : 'not alone (see the log page)']);
    table([{ t: 'Check', w: 130 }, { t: 'Result', w: 50 }], rows);
    var q = document.createElement('div'); new QRCode(q, { text: 'https://kolaboro.com/court-file/#check', width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M }); var cv = q.querySelector('canvas');
    if (cv) { need(40); d.addImage(cv.toDataURL('image/png'), 'PNG', L, y, 30, 30); d.setFontSize(8); d.setTextColor('#41505C'); d.text(d.splitTextToSize('To check that this PDF is exactly the one that was built, open kolaboro.com/court-file/#check and drop the file: your browser computes its SHA-256 and looks it up. ' + (B.type === 'case' ? 'Case bundles are also checked at kolaboro.com/verify#pdf.' : ''), 140), L + 35, y + 5); y += 34; }
    // index
    np(); h1('Index of exhibits');
    table([{ t: 'No.', w: 9 }, { t: 'Exhibit', w: 55 }, { t: 'SHA-256', w: 34 }, { t: 'Timestamp', w: 34 }, { t: 'Captured', w: 24 }, { t: 'Source', w: 24 }],
      B.ex.map(function (x, i) { return [String(i + 1), x.title, x.sha256, otsText(x.ots) + (x.in_log && L2.head ? '; named in log line ' + L2.head.day : ''), utc(B.type === 'case' ? x.item.taken_at : x.g.at), B.type === 'case' ? 'case item ' + x.item.id : x.g.url.replace('https://', '')]; }));
    // exhibits
    B.ex.forEach(function (x, i) {
      need(40); y += 3; txt('Exhibit ' + (i + 1) + '. ' + x.title, 11, true);
      txt('Produced by: ' + x.origin, 8.5, false, '#41505C');
      txt('Source: ' + x.g.url + (B.type === 'case' ? '' : ' | fetched ' + utc(x.g.at)), 8.5, false, '#41505C');
      if (B.type === 'case') txt('Taken ' + utc(x.item.taken_at) + ' | recorded ' + utc(x.item.at) + ' | added by ' + (x.item.by || '-'), 8.5, false, '#41505C');
      txt('SHA-256: ' + x.sha256, 8, false, '#17212B', 'courier');
      if (B.type === 'case') txt('Chain: ' + x.item.chain, 8, false, '#41505C', 'courier');
      if (x.g.sig) txt('Signed by Kolaboro, key ' + x.g.kid + ': ' + (x.sig_ok ? 'verified' : 'DOES NOT VERIFY') + '. Signature ' + x.g.sig, 7.5, false, '#41505C', 'courier');
      txt('Timestamp: ' + otsText(x.ots) + (x.in_log && L2.head ? '. Its data is named in the public log line of ' + L2.head.day + '.' : '.'), 8.5, false, '#41505C');
      (x.summary || []).forEach(function (s) { txt(s, 9); });
    });
    // custody
    np(); h1('Chain of custody');
    if (B.type === 'case') {
      txt('As recorded by Kolaboro when each item was added. "Device" is the browser description the agent\'s phone sent with the upload, when it was stored; "Passkey" is a signature by the agent\'s phone over the photo fingerprint (WebAuthn), checked here.', 8.5, false, '#41505C');
      table([{ t: 'No.', w: 8 }, { t: 'Item', w: 10 }, { t: 'Added by', w: 15 }, { t: 'Taken', w: 22 }, { t: 'Recorded', w: 22 }, { t: 'Device', w: 33 }, { t: 'GPS', w: 26 }, { t: 'Passkey', w: 20 }, { t: 'Chain', w: 12 }, { t: 'Status', w: 12 }],
        B.custody.map(function (r) { return [String(r.no), String(r.item), r.added_by, utc(r.taken_at), utc(r.recorded_at), r.device, r.gps, r.passkey, r.chain_link, r.status === 'accepted' ? 'ok' : r.status]; }));
      txt('Chain formula: ' + man.chain.formula + '. Case fingerprint (last chain value): ' + (man.chain.head || '-') + '. ' + otsText(man.chain.head_timestamp) + '.', 8.5);
    } else {
      txt('A public project has no private custody: every exhibit was published by Kolaboro and fetched by this browser. The table records who produced each exhibit, when it was captured for this bundle and whether Kolaboro signed it.', 8.5, false, '#41505C');
      table([{ t: 'No.', w: 8 }, { t: 'Exhibit', w: 40 }, { t: 'Produced by', w: 52 }, { t: 'Captured', w: 22 }, { t: 'Captured by', w: 34 }, { t: 'Signed', w: 24 }],
        B.custody.map(function (r) { return [String(r.no), r.exhibit, r.produced_by, utc(r.captured_at), r.captured_by, r.signed]; }));
    }
    // log
    np(); h1('Public log inclusion proof');
    txt('Kolaboro writes one line a day to an append-only public log (kolaboro.com/log). Each line (head) fixes that day\'s dataset SHA-256, the Merkle root of all developer page fingerprints and the root of all evidence fingerprints, and links to the previous line. Lines are leaves of a Merkle tree whose signed checkpoint is published; each head is also timestamped in Bitcoin with OpenTimestamps and recorded in Sigstore Rekor.', 9);
    var H = L2.head;
    if (H) {
      h2('Log line of ' + H.day);
      mono('head = SHA-256("kolaboro-log-v1|day|dataset_sha256|projects_root|projects_count|evidence_root|evidence_items|audit_head|audit_count|prev")');
      [['day', H.day], ['head', H.head + (L2.head_recomputes ? '  (recomputes)' : '  (DOES NOT RECOMPUTE)')], ['dataset_sha256', H.dataset_sha256], ['projects_root', H.projects_root + ' (' + H.projects_count + ' pages)'], ['evidence_root', (H.evidence_root || '-') + ' (' + (H.evidence_items || 0) + ' items)'], ['audit_head', (H.audit_head || '-') + ' (' + (H.audit_count || 0) + ')'], ['prev', H.prev || 'genesis'], ['Bitcoin', otsText(L2.head_stamp)], ['Sigstore Rekor', H.rekor_uuid ? 'entry ' + H.rekor_index + ', uuid ' + H.rekor_uuid : 'pending']].forEach(function (r) { mono(r[0] + ': ' + r[1]); });
      var P = L2.proofJson;
      if (P) { h2('Inclusion of that line in the checkpoint tree'); mono('leaf "' + P.leaf + '" index ' + P.leaf_index + ' of ' + P.tree_size); (P.path || []).forEach(function (s, i) { mono('path ' + (i + 1) + ' ' + s.side + ' ' + s.hash); }); mono('root ' + P.root_hash + ' -> ' + (L2.inclusion_ok ? 'matches the signed checkpoint' : 'DOES NOT MATCH')); }
      h2('Signed checkpoint'); L2.checkpoint.text.split('\n').forEach(function (l) { if (l) mono(l.replace(/\u2014/g, '-')); });
      mono('(the dash that starts the signature line is printed as "-" here; the manifest holds the exact text)'); mono('signature with key ' + B.key.kid + ' (' + B.key.raw_b64 + '): ' + (L2.cp.ok ? 'verified' : 'DOES NOT VERIFY'));
    } else txt('The log has no line yet.', 9);
    if (B.type === 'case') {
      h2('This case in the evidence roots');
      txt(L2.evidence_head ? 'The accepted items of this case, as lines "id sha256", hash exactly to the evidence root of ' + L2.evidence_head.day + ': every one of them was in the log that day.' : 'Each daily evidence root covers the evidence of every case. The other cases\' lines are private, so inclusion of this case\'s items cannot be shown from public data alone; Kolaboro can produce the full list for the day to an appointed expert. What this bundle proves on its own is the case fingerprint chain and its Bitcoin timestamp.', 9);
    }
    // offline
    np(); h1('How an expert can check everything offline');
    txt('Everything below runs without contacting Kolaboro. You need this PDF, the manifest file downloaded with it (' + 'manifest SHA-256 ' + msha + '), Node.js 18 or later and the open verifiers.', 9.5);
    ['1. Get the verifiers: github.com/calory89/kolaboro-open (MIT licence). open/kolaboro-verify.js is a byte-for-byte copy of kolaboro.com/open/kolaboro-verify.js; the repository\'s CI checks that every day. Python and Go versions in the same repository give the same answers.',
      '2. Get the checker: kolaboro.com/court-file/check-bundle.mjs. Put it next to kolaboro-verify.js and the manifest. It is short; read it before running it.',
      '3. Check the manifest is the one this PDF names: sha256sum the manifest file and compare with the SHA-256 on the cover.',
      '4. Run: node check-bundle.mjs ' + 'kolaboro-bundle-' + String(B.id).replace(/[^A-Za-z0-9-]+/g, '-') + '.json --ots ./ots' + (B.type === 'case' ? ' --files ./originals' : '') + '. It recomputes every SHA-256, verifies every Ed25519 signature with the public key in the manifest, recomputes ' + (B.type === 'case' ? 'the case fingerprint chain' : 'the Merkle proof of the page fingerprint') + ', every log head and its link to the previous one, the signed checkpoint and the inclusion proof, and prints PASS or FAIL for each.',
      B.type === 'case' ? '5. Originals: put the original files of the case (photos, documents, as downloaded from the portal) in ./originals. The checker hashes each one and names the exhibit it matches. A file that matches no exhibit is reported.' : '5. The open dataset and hazards files are not copied into the manifest (they are large). Their SHA-256 is printed in the exhibits; Kolaboro serves past versions of a project record at /api/open/projects/{id}/at/{day}.',
      '6. Key: compare the public key in the manifest (' + B.key.raw_b64 + ', id ' + B.key.kid + ') with kolaboro.com/.well-known/kolaboro-keys.json and the key printed in the kolaboro-open repository. Old keys stay listed after a rotation.',
      '7. Bitcoin: --ots writes one .ots file per timestamp. "ots verify" from opentimestamps.org checks each against your own Bitcoin node; the checker also prints the block height and Merkle root each proof commits to, to compare with any copy of the Bitcoin block headers.',
      '8. Sigstore: each log head is also in Sigstore Rekor (entry number above). That is an independent public record of the head\'s existence and time.'].forEach(function (s) { txt(s, 9); y += 0.6; });
    h2('Public key');
    mono('Ed25519 ' + B.key.kid + ' raw ' + B.key.raw_b64);
    mono('message signed = "kolaboro-sig-v1\\n" + SHA-256 hex of the exact body');
    y += 3; txt('Kolaboro checks off-plan property for people buying abroad. This bundle records evidence and how to check it; it is not legal advice. kolaboro.com, hello@kolaboro.com', 7.5, false, '#5E6872');
    foot();
    return new Uint8Array(d.output('arraybuffer'));
  }
  function clean(t) { return String(t == null ? '' : t).replace(/[\u2013\u2014]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/\u2026/g, '...').replace(/\u00b1/g, '+/-').replace(/\u2192/g, '->').replace(/[^\x09\x0A\x0D\x20-\x7E\u00a0-\u00ff]/g, '?'); }

  function save(r) {
    function dl(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); }
    dl(new Blob([r.pdf], { type: 'application/pdf' }), r.name + '.pdf');
    setTimeout(function () { dl(new Blob([r.manifestText], { type: 'application/json' }), r.name + '.json'); }, 600);
  }
  window.KBCourt = { project: project, caseFile: caseFile, save: save, version: FORMAT };
})();
