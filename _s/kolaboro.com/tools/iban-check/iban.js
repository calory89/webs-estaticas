/* Payment destination check. Everything runs in this page: no account number is stored or sent anywhere.
   IBAN: ISO 13616 mod-97 checksum, country, length per country (SWIFT IBAN registry), character pattern, bank/branch code
   positions where the registry defines them. SWIFT/BIC: ISO 9362 format. Also CLABE (Mexico) and ABA routing (USA) checksums. */
(function (G) {
  'use strict';
  // country: [IBAN length, BBAN pattern, bank code start, bank code length, branch start, branch length] (positions in the BBAN, 0-based)
  var R = {
    AD: [24, '4n4n12c', 0, 4, 4, 4], AE: [23, '3n16n', 0, 3], AL: [28, '8n16c', 0, 3, 3, 4], AT: [20, '5n11n', 0, 5], AZ: [28, '4a20c', 0, 4],
    BA: [20, '3n3n8n2n', 0, 3, 3, 3], BE: [16, '3n7n2n', 0, 3], BG: [22, '4a4n2n8c', 0, 4, 4, 4], BH: [22, '4a14c', 0, 4], BI: [27, '5n5n11n2n', 0, 5, 5, 5],
    BR: [29, '8n5n10n1a1c', 0, 8, 8, 5], BY: [28, '4c4n16c', 0, 4], CH: [21, '5n12c', 0, 5], CR: [22, '4n14n', 0, 4], CY: [28, '3n5n16c', 0, 3, 3, 5],
    CZ: [24, '4n6n10n', 0, 4], DE: [22, '8n10n', 0, 8], DJ: [27, '5n5n11n2n', 0, 5, 5, 5], DK: [18, '4n9n1n', 0, 4], DO: [28, '4c20n', 0, 4],
    EE: [20, '2n2n11n1n', 0, 2], EG: [29, '4n4n17n', 0, 4, 4, 4], ES: [24, '4n4n1n1n10n', 0, 4, 4, 4], FI: [18, '3n11n', 0, 3], FK: [18, '2a12n', 0, 2],
    FO: [18, '4n9n1n', 0, 4], FR: [27, '5n5n11c2n', 0, 5, 5, 5], GB: [22, '4a6n8n', 0, 4, 4, 6], GE: [22, '2a16n', 0, 2], GI: [23, '4a15c', 0, 4],
    GL: [18, '4n9n1n', 0, 4], GR: [27, '3n4n16c', 0, 3, 3, 4], GT: [28, '4c20c', 0, 4], HN: [28, '4a20n', 0, 4], HR: [21, '7n10n', 0, 7],
    HU: [28, '3n4n1n15n1n', 0, 3, 3, 4], IE: [22, '4a6n8n', 0, 4, 4, 6], IL: [23, '3n3n13n', 0, 3, 3, 3], IQ: [23, '4a3n12n', 0, 4, 4, 3], IS: [26, '4n2n6n10n', 0, 4],
    IT: [27, '1a5n5n12c', 1, 5, 6, 5], JO: [30, '4a4n18c', 0, 4, 4, 4], KW: [30, '4a22c', 0, 4], KZ: [20, '3n13c', 0, 3], LB: [28, '4n20c', 0, 4],
    LC: [32, '4a24c', 0, 4], LI: [21, '5n12c', 0, 5], LT: [20, '5n11n', 0, 5], LU: [20, '3n13c', 0, 3], LV: [21, '4a13c', 0, 4], LY: [25, '3n3n15n', 0, 3, 3, 3],
    MC: [27, '5n5n11c2n', 0, 5, 5, 5], MD: [24, '2c18c', 0, 2], ME: [22, '3n13n2n', 0, 3], MK: [19, '3n10c2n', 0, 3], MN: [20, '4n12n', 0, 4],
    MR: [27, '5n5n11n2n', 0, 5, 5, 5], MT: [31, '4a5n18c', 0, 4, 4, 5], MU: [30, '4a2n2n12n3n3a', 0, 6, 6, 2], NI: [28, '4a20n', 0, 4], NL: [18, '4a10n', 0, 4],
    NO: [15, '4n6n1n', 0, 4], OM: [23, '3n16c', 0, 3], PK: [24, '4a16c', 0, 4], PL: [28, '8n16n', 0, 3, 3, 4], PS: [29, '4a21c', 0, 4], PT: [25, '4n4n11n2n', 0, 4, 4, 4],
    QA: [29, '4a21c', 0, 4], RO: [24, '4a16c', 0, 4], RS: [22, '3n13n2n', 0, 3], RU: [33, '9n5n15c', 0, 9, 9, 5], SA: [24, '2n18c', 0, 2], SC: [31, '4a2n2n16n3a', 0, 6, 6, 2],
    SD: [18, '2n12n', 0, 2], SE: [24, '3n16n1n', 0, 3], SI: [19, '5n8n2n', 0, 2, 2, 3], SK: [24, '4n6n10n', 0, 4], SM: [27, '1a5n5n12c', 1, 5, 6, 5],
    SO: [23, '4n3n12n', 0, 4, 4, 3], ST: [25, '4n4n11n2n', 0, 4, 4, 4], SV: [28, '4a20n', 0, 4], TL: [23, '3n14n2n', 0, 3], TN: [24, '2n3n13n2n', 0, 2, 2, 3],
    TR: [26, '5n1n16c', 0, 5], UA: [29, '6n19c', 0, 6], VA: [22, '3n15n', 0, 3], VG: [24, '4a16n', 0, 4], XK: [20, '4n10n2n', 0, 2, 2, 2], YE: [30, '4a4n18c', 0, 4, 4, 4]
  };
  var DN = null; try { DN = new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) {}
  function cname(cc) { var n = null; try { n = DN && DN.of(cc); } catch (e) {} return n && n !== cc && !/Unknown/.test(n) ? n : null; }
  function patRe(p) { var re = '', m, rx = /(\d+)([nac])/g; while ((m = rx.exec(p))) re += (m[2] === 'n' ? '[0-9]' : m[2] === 'a' ? '[A-Z]' : '[A-Z0-9]') + '{' + m[1] + '}'; return new RegExp('^' + re + '$'); }
  function mod97(s) { var r = 0; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i), v = c >= 65 ? String(c - 55) : s[i]; for (var k = 0; k < v.length; k++) r = (r * 10 + (v.charCodeAt(k) - 48)) % 97; } return r; }
  function iban(raw) {
    var s = raw.toUpperCase().replace(/^IBAN[:\s]*/, '').replace(/[\s\-.]/g, ''), o = { kind: 'IBAN', value: s, issues: [], cc: s.slice(0, 2) };
    if (!/^[A-Z0-9]+$/.test(s)) { o.issues.push('contains characters an IBAN cannot have'); return o; }
    var reg = R[o.cc]; o.country = cname(o.cc); o.known = !!reg;
    if (!o.country) o.issues.push('"' + o.cc + '" is not a country code');
    else if (!reg) o.issues.push(o.country + ' does not use IBANs in the SWIFT registry (or this tool does not know its format)');
    if (!/^[0-9]{2}$/.test(s.slice(2, 4))) o.issues.push('characters 3 and 4 must be the two check digits');
    if (reg && s.length !== reg[0]) o.issues.push(o.country + ' IBANs have ' + reg[0] + ' characters; this one has ' + s.length);
    o.checksumOk = s.length >= 5 && /^[0-9]{2}$/.test(s.slice(2, 4)) && mod97(s.slice(4) + s.slice(0, 4)) === 1;
    if (!o.checksumOk) o.issues.push('the check digits do not match (mod-97 checksum fails): at least one character is wrong');
    if (reg && s.length === reg[0]) {
      var bban = s.slice(4); o.bban = bban;
      o.patternOk = patRe(reg[1]).test(bban); if (!o.patternOk) o.issues.push('letters and digits are not in the places ' + o.country + ' uses');
      o.bank = bban.substr(reg[2], reg[3]); o.bankAt = [4 + reg[2], reg[3]];
      if (reg[4] != null) { o.branch = bban.substr(reg[4], reg[5]); o.branchAt = [4 + reg[4], reg[5]]; }
    }
    o.valid = !o.issues.length;
    return o;
  }
  function bic(raw) {
    var s = raw.toUpperCase().replace(/[\s\-.]/g, ''), o = { kind: 'BIC', value: s, issues: [] };
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) { o.issues.push('a SWIFT/BIC code is 8 or 11 characters: 4 letters for the bank, 2 for the country, 2 for the location, then an optional 3-character branch'); o.valid = false; return o; }
    o.bank = s.slice(0, 4); o.cc = s.slice(4, 6); o.loc = s.slice(6, 8); o.branch = s.slice(8) || null; o.country = cname(o.cc);
    if (!o.country) o.issues.push('"' + o.cc + '" is not a country code');
    if (o.loc[1] === '0') o.issues.push('a location code ending in 0 is reserved for test codes, not live payments');
    o.valid = !o.issues.length; return o;
  }
  function clabe(s) {
    var w = [3, 7, 1], sum = 0; for (var i = 0; i < 17; i++) sum += (+s[i] * w[i % 3]) % 10;
    var ok = (10 - sum % 10) % 10 === +s[17];
    return { kind: 'CLABE', value: s, cc: 'MX', country: 'Mexico', bank: s.slice(0, 3), bankAt: [0, 3], branch: s.slice(3, 6), branchAt: [3, 3], checksumOk: ok, valid: ok, issues: ok ? [] : ['the CLABE check digit (last digit) does not match: at least one digit is wrong'] };
  }
  function aba(s) {
    var d = s.split('').map(Number), ok = (3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])) % 10 === 0;
    return { kind: 'ABA', value: s, cc: 'US', country: 'United States', checksumOk: ok, valid: ok, issues: ok ? [] : ['the routing number checksum fails: at least one digit is wrong'] };
  }
  function account(raw) {
    var s = raw.toUpperCase().replace(/[\s\-.]/g, '').replace(/^IBAN:?/, '');
    if (!s) return null;
    if (/^[A-Z]{2}[0-9]{2}/.test(s)) return iban(raw);
    if (/^[0-9]{18}$/.test(s)) return clabe(s);
    if (/^[0-9]{9}$/.test(s)) return aba(s);
    return { kind: 'other', value: s, issues: [], valid: null };
  }
  G.KIBAN = { iban: iban, bic: bic, account: account, registry: R, cname: cname, mod97: mod97 };

  if (typeof document === 'undefined') return;
  var $ = function (id) { return document.getElementById(id); };
  var fA = $('ibA'), fB = $('ibB'), fC = $('ibC'), fP = $('ibP'), out = $('ibOut'), pst = $('ibPst');
  if (!fA) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // countries: the markets we track first (from the public case list), then every country
  var norm = function (n) { return (n || '').toLowerCase().replace(/&/g, 'and').replace(/^the /, '').replace(/[^a-z]/g, ''); };
  var byName = {}, all = [];
  for (var a = 65; a <= 90; a++) for (var b = 65; b <= 90; b++) { var cc = String.fromCharCode(a, b), n = cname(cc); if (n && !/Unknown/.test(n)) { all.push([cc, n]); byName[norm(n)] = cc; } }
  var ALIAS = { uae: 'AE', usa: 'US', unitedkingdom: 'GB', turkey: 'TR', capeverde: 'CV', stkittsandnevis: 'KN', turksandcaicosislands: 'TC', antiguaandbarbuda: 'AG', czechrepublic: 'CZ', ivorycoast: 'CI' };
  function ccOf(name) { var k = norm(name); return ALIAS[k] || byName[k] || null; }
  all.sort(function (x, y) { return x[1].localeCompare(y[1]); });
  var cases = null;
  function fillCountries(tracked) {
    var h = '<option value="">Select the country</option>';
    if (tracked && tracked.length) h += '<optgroup label="Countries with tracked projects">' + tracked.map(function (t) { return '<option value="' + t[0] + '">' + esc(t[1]) + ' (' + t[2] + ')</option>'; }).join('') + '</optgroup>';
    h += '<optgroup label="All countries">' + all.map(function (c) { return '<option value="' + c[0] + '">' + esc(c[1]) + '</option>'; }).join('') + '</optgroup>';
    var v = fC.value; fC.innerHTML = h; fC.value = v;
  }
  fillCountries(null);
  fetch('/data/bali-cases.json').then(function (r) { return r.json(); }).then(function (j) {
    cases = {}; var cnt = {};
    j.cases.forEach(function (c) { cases[c.id] = c; cnt[c.country] = (cnt[c.country] || 0) + 1; });
    var tr = Object.keys(cnt).map(function (n) { return [ccOf(n), n, cnt[n]]; }).filter(function (t) { return t[0]; }).sort(function (x, y) { return y[2] - x[2]; });
    fillCountries(tr); run();
  }).catch(function () {});

  function hl(o) {
    var s = o.value, marks = [];
    if (o.bankAt) marks.push([o.bankAt[0], o.bankAt[1], 'i']); if (o.branchAt) marks.push([o.branchAt[0], o.branchAt[1], 'u']);
    var h = '', i = 0;
    marks.sort(function (x, y) { return x[0] - y[0]; }).forEach(function (m) { if (m[0] < i) return; h += esc(s.slice(i, m[0])) + '<' + m[2] + '>' + esc(s.substr(m[0], m[1])) + '</' + m[2] + '>'; i = m[0] + m[1]; });
    h += esc(s.slice(i));
    return h;
  }
  function card(level, title, body) { var tag = { look: 'Warning', note: 'Check', ok: 'Looks right', info: 'Info' }[level]; return '<article class="ft-f ' + level + '"><h3><span class="ft-tag ' + level + '">' + tag + '</span>' + esc(title) + '</h3>' + body + '</article>'; }
  function run() {
    var A = account(fA.value || ''), B = (fB.value || '').trim() ? bic(fB.value) : null, dev = fC.value || null, devName = dev ? cname(dev) : null, h = '';
    var pid = (fP.value || '').trim().toUpperCase();
    if (pid && cases) {
      var c = cases[pid];
      if (c) { var pcc = ccOf(c.country); pst.textContent = 'Project ' + pid + ': ' + c.market + ', ' + c.country + (pcc ? '' : ' (no country code to compare)'); if (pcc && fC.value !== pcc) { fC.value = pcc; dev = pcc; devName = cname(pcc); } }
      else pst.textContent = 'No tracked project with id ' + pid + '.';
    } else pst.textContent = '';
    if (!A && !B) { out.innerHTML = ''; return; }
    if (A) {
      if (A.kind === 'other') h += card('note', 'Not recognised as an IBAN, CLABE or US routing number', '<p>Account numbers in countries without IBAN (for example Indonesia or Thailand) have no public checksum, so only the SWIFT/BIC code and the bank name can be checked. Confirm them with the developer by phone, using a number you found yourself.</p>');
      else {
        var lbl = { IBAN: 'IBAN', CLABE: 'CLABE (Mexico)', ABA: 'US routing number' }[A.kind];
        var det = '<p class="ft-iban">' + hl(A) + '</p><ul>' +
          (A.country ? '<li>Account country: <b>' + esc(A.country) + '</b> (' + esc(A.cc) + ')</li>' : '') +
          (A.kind === 'IBAN' && KIBAN.registry[A.cc] ? '<li>Length: ' + A.value.length + ' of ' + KIBAN.registry[A.cc][0] + ' characters</li>' : '') +
          (A.checksumOk != null ? '<li>Checksum: ' + (A.checksumOk ? 'correct' : '<b>wrong</b>') + '</li>' : '') +
          (A.bank ? '<li>Bank code: <b>' + esc(A.bank) + '</b> (highlighted)' + (A.branch ? ', branch or sort code: <b>' + esc(A.branch) + '</b>' : '') + '. Ask your own bank which bank this code belongs to and compare it with the bank the developer named.</li>' : '') + '</ul>';
        h += A.valid ? card('ok', lbl + ' is well formed', det + '<div class="ft-mean"><div><b>What it means</b>The number has no typing errors that the checksum can detect, and its shape matches what ' + esc(A.country || 'that country') + ' uses.</div><div><b>What it does not prove</b>That the account exists, or who owns it. A fraudster\'s account passes this check too.</div></div>')
          : card('look', lbl + ' has errors', det + '<ul>' + A.issues.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p>Do not send money to this number. Ask for it again, in writing, and compare it with the contract.</p>');
      }
    }
    if (B) {
      h += B.valid ? card('ok', 'SWIFT/BIC ' + B.value + ' is well formed', '<ul><li>Bank: ' + esc(B.bank) + ', country: <b>' + esc(B.country) + '</b> (' + B.cc + '), location ' + esc(B.loc) + (B.branch ? ', branch ' + esc(B.branch) : ', head office') + '</li></ul><p class="ft-file">The format is right; whether the code is assigned to a real bank is not checked here.</p>')
        : card('look', 'SWIFT/BIC ' + B.value + ' has errors', '<ul>' + B.issues.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    }
    // country comparisons
    var accCC = A && A.cc && A.kind !== 'other' ? A.cc : null, bicCC = B && B.valid ? B.cc : null;
    if (accCC && bicCC && accCC !== bicCC) h += card('look', 'The account and the SWIFT code are in different countries', '<p>The account is in ' + esc(cname(accCC)) + ' but the SWIFT/BIC code is for ' + esc(cname(bicCC)) + '. Payment instructions for one account normally use one country.</p>');
    if (dev) {
      var dests = [accCC, bicCC].filter(Boolean);
      var foreign = dests.filter(function (x) { return x !== dev; });
      if (!dests.length) h += card('info', 'Developer in ' + devName, '<p>Enter the IBAN or SWIFT code to compare countries.</p>');
      else if (foreign.length) h += card('look', 'Account in a different country than the developer', '<p>The developer or project is in <b>' + esc(devName) + '</b>, but the money would go to <b>' + esc(cname(foreign[0])) + '</b>.</p>' +
        (!KIBAN.registry[dev] && accCC ? '<p>' + esc(devName) + ' does not use IBANs, so a developer there normally gives a local account number and a SWIFT code from a bank in ' + esc(devName) + '. An IBAN means the account is held elsewhere.</p>' : '') +
        '<div class="ft-mean"><div><b>What it means</b>Your deposit would leave the developer\'s country. Ask why, and ask for the name of the account holder. It should be the company on your contract.</div><div><b>What it does not prove</b>Fraud. Some developers use a sales company, a payment app or an escrow agent abroad. Get the reason in writing and confirm the details by phone on a number you found yourself.</div></div>');
      else h += card('ok', 'Account country matches the developer (' + devName + ')', '<p class="ft-file">This does not confirm who owns the account. Check that the account holder name is the company on your contract.</p>');
    }
    out.innerHTML = h;
  }
  [fA, fB, fP].forEach(function (f) { f.addEventListener('input', run); });
  fC.addEventListener('change', run);
  document.querySelectorAll('[data-ex]').forEach(function (b) { b.addEventListener('click', function () { var x = b.getAttribute('data-ex').split('|'); fA.value = x[0]; fB.value = x[1] || ''; fC.value = x[2] || ''; fP.value = ''; run(); }); });
})(typeof window !== 'undefined' ? window : globalThis);
