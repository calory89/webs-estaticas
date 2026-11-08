// Kolaboro X-ray for Gmail web (mail.google.com): when the open email mentions a payment or bank details, a small panel shows the
// same checks as https://kolaboro.com/tools/payment-email-check/ on what Gmail shows on screen: sender address against the developer
// websites in Kolaboro's records (lookalike, other ending, free email), Reply-To / mailed-by / signed-by when the details are open,
// wording used in payment-diversion emails, and the sender domain's registration date and DMARC. The email's text never leaves
// the browser: the background worker fetches only the public list of developer domains and, for the sender domain alone, its
// public DNS and registration date from kolaboro.com. The checks below (KPEC) are a copy of the library part of
// /tools/payment-email-check/pec.js on kolaboro.com (test/ext.test.mjs checks they stay identical).
var KPEC = (function (G) {
  'use strict';
  var SLD = { co: 1, com: 1, net: 1, org: 1, or: 1, ac: 1, go: 1, web: 1, my: 1, biz: 1, gov: 1, edu: 1, ne: 1, 'in': 1, sch: 1, ltd: 1, plc: 1, gen: 1, firm: 1, gr: 1, me: 1 };
  function regDomain(h) { var p = String(h || '').toLowerCase().replace(/^www\./, '').replace(/\.$/, '').split('.'); if (p.length <= 2) return p.join('.'); return (SLD[p[p.length - 2]] && p[p.length - 1].length === 2 ? p.slice(-3) : p.slice(-2)).join('.'); }
  function labelOf(d) { return String(d).split('.')[0]; }
  function suffixOf(d) { return String(d).split('.').slice(1).join('.'); }
  var FREE = 'gmail.com googlemail.com outlook.com hotmail.com live.com msn.com yahoo.com ymail.com aol.com icloud.com me.com mac.com proton.me protonmail.com gmx.com gmx.de gmx.net web.de mail.ru bk.ru inbox.ru list.ru yandex.ru yandex.com qq.com 163.com 126.com sina.com yeah.net zoho.com tutanota.com tuta.io hey.com mail.com rediffmail.com'.split(' ');
  // punycode (RFC 3492) decode, for internationalised domains (xn--)
  function puny(s) {
    var b = 36, tmin = 1, tmax = 26, n = 128, i = 0, bias = 72, out = [], d = s.lastIndexOf('-'), k, w, t, dig, oi;
    function adapt(delta, num, first) { delta = first ? Math.floor(delta / 700) : delta >> 1; delta += Math.floor(delta / num); for (k = 0; delta > 455; k += b) delta = Math.floor(delta / 35); return k + Math.floor(36 * delta / (delta + 38)); }
    if (d > 0) for (var j = 0; j < d; j++) out.push(s.charCodeAt(j));
    for (var p = d > 0 ? d + 1 : 0; p < s.length;) {
      oi = i; w = 1;
      for (k = b; ; k += b) { var c = s.charCodeAt(p++); if (isNaN(c)) return null; dig = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : b; if (dig >= b) return null; i += dig * w; t = k <= bias ? tmin : k >= bias + tmax ? tmax : k - bias; if (dig < t) break; w *= b - t; }
      bias = adapt(i - oi, out.length + 1, oi === 0); n += Math.floor(i / (out.length + 1)); i %= out.length + 1; out.splice(i++, 0, n);
    }
    return String.fromCodePoint.apply(null, out);
  }
  function uniHost(h) { return String(h).split('.').map(function (l) { return /^xn--/i.test(l) ? (puny(l.slice(4).toLowerCase()) || l) : l; }).join('.'); }
  // letters that look alike: Cyrillic and Greek lookalikes, digits for letters, letter pairs
  var CF = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ɡ': 'g', 'һ': 'h', 'ӏ': 'l', 'ո': 'n', 'ս': 'u', 'α': 'a', 'ο': 'o', 'ν': 'v', 'ρ': 'p', 'τ': 't', 'κ': 'k', 'ι': 'i', 'ε': 'e', 'ı': 'i', 'ł': 'l' };
  function skel(s) {
    s = String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    var o = ''; for (var i = 0; i < s.length; i++) o += CF[s[i]] || s[i];
    return o.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/cl/g, 'd').replace(/0/g, 'o').replace(/[1|!i]/g, 'l').replace(/5/g, 's').replace(/3/g, 'e').replace(/@/g, 'a').replace(/-/g, '');
  }
  function osa(a, b) {   // edit distance with swaps of neighbouring letters
    var m = a.length, n = b.length, d = [], i, j;
    if (Math.abs(m - n) > 2) return 9;
    for (i = 0; i <= m; i++) { d[i] = [i]; } for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      var c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  // compare one host with the developer websites in our records. L = {domains:[{d,dv,url,m}], shared:[..]}
  function compare(hostRaw, L) {
    var host = uniHost(String(hostRaw || '').toLowerCase().replace(/\.$/, '')), d = regDomain(host), sl = labelOf(d), r = { host: host, d: d, idn: /(^|\.)xn--/i.test(hostRaw || '') || /[^\x00-\x7f]/.test(host), free: FREE.indexOf(d) >= 0, exact: null, shared: false, look: [] };
    if (!L) return r;
    var by = L._by || (L._by = {}); if (!L._idx) { L.domains.forEach(function (x) { by[x.d] = x; }); L._idx = 1; L._sh = {}; (L.shared || []).forEach(function (s) { L._sh[s] = 1; }); }
    if (by[d]) { r.exact = by[d]; return r; }
    if (L._sh[d]) { r.shared = true; return r; }
    if (r.free) return r;
    var ss = skel(sl), labs = host.split('.').slice(0, -1).join('.');
    L.domains.forEach(function (x) {
      var ol = labelOf(x.d), why = null, dist = 0;
      if (ol.length < 4) return;
      if (ol === sl && suffixOf(x.d) !== suffixOf(d)) why = 'tld';
      else if (skel(ol) === ss) why = 'glyph';
      else if (ol.length >= 5 && (dist = osa(sl, ol)) <= (ol.length >= 9 ? 2 : 1)) why = 'typo';
      else if (ol.length >= 5 && sl.indexOf(ol) >= 0) why = 'contains';
      else if (ol.length >= 5 && new RegExp('(^|[.-])' + ol.replace(/[^a-z0-9]/g, '') + '([.-]|$)').test(labs.slice(0, labs.length - sl.length))) why = 'sub';
      if (why) r.look.push({ o: x, why: why, dist: dist });
    });
    var rank = { glyph: 0, tld: 1, word: 2, typo: 3, sub: 4, contains: 5 };   // word: the name as a whole word (emaar-properties)
    var rk = function (l) { return l.why === 'contains' && new RegExp('(^|-)' + labelOf(l.o.d) + '(-|$)').test(sl) ? rank.word : rank[l.why]; };
    r.look.sort(function (a, b) { return (rk(a) - rk(b)) || (b.o.m - a.o.m) || (b.o.p - a.o.p); });
    r.look = r.look.slice(0, 3);
    return r;
  }
  // wording that payment-diversion emails use (all languages are checked whatever the page language)
  var WD = {
    change: [/\bnew (?:bank |banking )?(?:account|iban|beneficiary)\b/i, /\b(?:bank|banking|account|payment|beneficiary) (?:details|information|instructions) (?:have |has )?(?:been )?(?:changed|updated|amended)\b/i, /\bchange (?:of|in|to) (?:our )?(?:bank|banking|account|payment)/i, /\bupdated? (?:our )?(?:bank|banking|account|payment|remittance) (?:details|information|instructions)\b/i,
      /\bnueva cuenta\b/i, /\bcambio de (?:cuenta|banco|datos bancarios)/i, /\b(?:hemos )?cambiado (?:de )?(?:cuenta|banco)\b/i, /\bdatos bancarios (?:nuevos|actualizados)\b/i,
      /\bnouveau(?:x)? (?:compte|rib|coordonn[ée]es bancaires)/i, /\bchangement (?:de|des) (?:compte|rib|coordonn[ée]es bancaires)/i,
      /\bneue[ns]? (?:bankverbindung|kontonummer|konto|iban)\b/i, /\b(?:ge[äa]nderte|neue) bankdaten\b/i, /[äa]nderung (?:der|unserer) bankverbindung/i,
      /\bnieuw(?:e)? (?:rekeningnummer|bankrekening|rekening|iban)\b/i, /\bgewijzigde bankgegevens\b/i, /\bwijziging (?:van )?(?:de |onze )?(?:rekening|bankgegevens)/i,
      /нов(?:ый|ые|ого|ому|ым|ая|ую) (?:сч[её]т|реквизит|банк)/i, /изменени[еяй] (?:банковских )?реквизит/i, /(?:сменили|изменили) (?:сч[её]т|реквизиты|банк)/i,
      /新(?:的)?(?:银行)?(?:账户|账号|帐户|收款账户)/, /(?:更改|变更|更新)(?:了)?(?:银行|账户|账号|收款)/, /银行(?:信息|资料)(?:已)?(?:变更|更新)/,
      /حساب (?:بنكي |مصرفي )?جديد/, /تغيير (?:الحساب|رقم الحساب|البيانات المصرفية|البنك)/, /تحديث (?:بيانات|تفاصيل) (?:الحساب|البنك|الدفع)/,
      /\brekening baru\b/i, /\b(?:perubahan|ganti|pergantian) (?:nomor )?rekening\b/i],
    old: [/\b(?:do not|don't|please do not|stop) (?:use|pay(?: in)?to|send (?:money |payments? )?to) (?:the |our )?(?:old|previous|former|usual) (?:account|bank|details)/i, /\b(?:old|previous) account (?:is|has been) (?:closed|frozen|blocked|suspended|under)/i, /\b(?:account|bank) (?:is |was )?(?:under (?:audit|review|investigation)|frozen|blocked|suspended)\b/i, /\b(?:due to|because of) (?:an? )?(?:audit|tax (?:audit|review|issues?)|regulatory review)\b/i,
      /\bcuenta (?:anterior|antigua)\b/i, /\bauditor[ií]a\b/i, /\bancien compte\b/i, /\baudit (?:fiscal|en cours)\b/i, /\baltes? konto\b/i, /\b(?:steuer)?pr[üu]fung\b/i, /\boude rekening\b/i, /\b(?:старый|прежний) сч[её]т/i, /аудит/i, /旧(?:的)?(?:账户|账号)/, /审计/, /الحساب القديم/, /تدقيق/, /\brekening lama\b/i],
    urgent: [/\burgent(?:ly)?\b/i, /\bimmediately\b/i, /\bwithin (?:24|48) hours\b/i, /\b(?:today|by end of (?:the )?day)\b.{0,40}\b(?:pay|transfer|wire|payment)/i, /\b(?:last|final) (?:reminder|notice|chance)\b/i, /\bunit (?:will be|may be) (?:released|cancelled|offered)/i,
      /\burgente\b/i, /\binmediatamente\b/i, /\bhoy mismo\b/i, /\bimm[ée]diatement\b/i, /\bdringend\b/i, /\bsofort\b/i, /\bonmiddellijk\b/i, /срочно/i, /немедленно/i, /紧急|立即|马上/, /عاجل|فورا|فوراً/, /\bsegera\b/i],
    secret: [/\b(?:keep (?:this|it) (?:confidential|private|between us)|do not (?:call|contact|discuss)|don't call|by email only|i am in a meeting|cannot take calls)\b/i, /\bconfidencial\b/i, /\bno llame\b/i, /\bconfidentiel\b/i, /\bvertraulich\b/i, /\bvertrouwelijk\b/i, /конфиденциально/i, /не звоните/i, /保密|不要打电话/, /سري|لا تتصل/, /\brahasia\b/i],
    pay: [/\b(?:wire|bank|telegraphic) transfer\b/i, /\b(?:payment|instal+ment|deposit|booking fee|down ?payment|balance) (?:is )?(?:due|now|of)\b/i, /\bremit(?:tance)?\b/i, /\bswift\b/i, /\biban\b/i, /\b(?:pay|transfer) (?:the |your )?(?:deposit|instal+ment|balance|amount)\b/i,
      /\btransferencia\b/i, /\bpago\b/i, /\bvirement\b/i, /\bpaiement\b/i, /[üu]berweisung/i, /\bzahlung\b/i, /\boverboeking\b/i, /\bbetaling\b/i, /перевод/i, /оплат/i, /汇款|转账|付款/, /تحويل|دفع|الدفعة/, /\btransfer\b/i, /\bpembayaran\b/i]
  };
  function wording(text) {
    var o = { hits: {}, any: false }, t = String(text || '').slice(0, 200000).replace(/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{2,4}){2,8}\b/g, '[account number]');   // never quote an account number
    Object.keys(WD).forEach(function (k) {
      WD[k].forEach(function (rx) {
        var m = t.match(rx); if (!m) return;
        var at = t.indexOf(m[0]), st = Math.max(0, at - 40), en = Math.min(t.length, at + m[0].length + 40), sp;
        if (st > 0 && (sp = t.indexOf(' ', st)) > 0 && sp < at) st = sp + 1;   // whole words only
        if (en < t.length && (sp = t.lastIndexOf(' ', en)) > at + m[0].length) en = sp;
        var snip = t.slice(st, en).replace(/\s+/g, ' ').trim();
        snip = snip.replace(/\b[A-Z]{2}\d{2}[A-Z0-9 ]{10,32}\b/g, '[account number]').replace(/\d[\d ]{6,}\d/g, '[number]');
        (o.hits[k] = o.hits[k] || []).push(snip);
      });
      if (o.hits[k]) { o.hits[k] = o.hits[k].filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, 3); o.any = true; }
    });
    return o;
  }
  return { regDomain: regDomain, compare: compare, wording: wording, skel: skel, uniHost: uniHost, FREE: FREE };
})(typeof window !== 'undefined' ? window : globalThis);
