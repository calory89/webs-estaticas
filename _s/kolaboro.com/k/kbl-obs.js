// n40 k16: shared script of the translated pages (place names, dates and numbers in the page language), was inline on every translated page
(function(){
  var M = KBL.obs || {}, NF = new Intl.NumberFormat(KBL.num), has = Object.prototype.hasOwnProperty, LP = KBL.lp || '', PG = KBL.lpages || [];
  function num(el){ var raw = el.textContent.replace(/\D/g, ''); if (!raw) return; var f = NF.format(+raw); if (f !== el.textContent) el.textContent = f; }
  var RX = (KBL.rx || []).map(function(r){ return [new RegExp(r[0]), r[1]]; }), TK = (KBL.tk || []).map(function(r){ return [new RegExp(r[0], 'g'), r[1]]; });
  var PL = KBL.pl || {}, DN = window.WeakMap ? new WeakMap() : null, NUM = !/^(en|zh)/.test(KBL.num || 'en'), DL = /^en/.test(KBL.loc || 'en') ? document.documentElement.lang : KBL.loc, MO = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  // place names, dates and numbers written by scripts in English get the page language too
  function pl1(x){ var m; if (has.call(PL, x)) return PL[x]; if ((m = x.match(/^(.+?) \((\d+)\)$/)) && has.call(PL, m[1])) return PL[m[1]] + ' (' + m[2] + ')'; return null; }
  function dt1(x){ var dm = String(x).match(/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})(?: (\d\d:\d\d))?$/); if (!dm) return null; try { return new Date(Date.UTC(+dm[3], MO[dm[2]], +dm[1])).toLocaleDateString(DL, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }) + (dm[4] ? ' ' + dm[4] : ''); } catch (e) { return null; } }
  function lz(s, n){ var e = n && n.parentNode, r; if (e && e.closest && e.closest('code,pre,kbd,samp,.mono,#lat,#lv-l,#lv-st,.kvb,.kxp,#pipe-live,[data-nolz]')) return s;
    r = pl1(s); if (r) return r;
    if (s.indexOf('· ') === 0 && (r = pl1(s.slice(2)))) return '· ' + r;
    if (s.indexOf(' · ') > 0) { var ch = 0, ps = s.split(' · ').map(function(x){ var y = pl1(x); if (y) { ch = 1; return y; } return x; }); if (ch) s = ps.join(' · '); }
    var dm = s.match(/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/); if (dm) { try { return new Date(Date.UTC(+dm[3], MO[dm[2]], +dm[1])).toLocaleDateString(DL, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }); } catch (x) {} }
    if (NUM) { s = s.replace(/(^|[^\d.,])(\d{1,3}(?:,\d{3})+)(?![\d,]|\.\d)/g, function(_, a, b){ return a + NF.format(+b.replace(/,/g, '')); });
      if (e && e.closest && e.closest('#dbt')) s = s.replace(/^(\d+)\.(\d+)$/, function(_, a, b){ return new Intl.NumberFormat(KBL.num, { minimumFractionDigits: b.length }).format(+(a + '.' + b)); }); }
    return s; }
  function tx(n){ var t = n.nodeValue, k = t.trim(); if (!k) return; if (DN && DN.get(n) === t) return; if (has.call(M, k)) { if (M[k] !== k) n.nodeValue = t.replace(k, M[k]); if (DN) DN.set(n, n.nodeValue); return; } for (var i = 0; i < RX.length; i++) if (RX[i][0].test(k)) { var mm = k.match(RX[i][0]), w = t.replace(k, lz(RX[i][1].replace(/\$(\d)/g, function(_, d){ var g = mm[+d] == null ? '' : mm[+d]; return pl1(g) || dt1(g) || g; }), n)); if (w !== t) n.nodeValue = w; if (DN) DN.set(n, n.nodeValue); return; }
    var p = n.parentNode; if (TK.length && p && p.closest && p.closest('.cmeta,.k100,.kvs,#kst')) { var v = t; TK.forEach(function(r){ v = v.replace(r[0], r[1]); }); if (v !== t) { n.nodeValue = v; t = v; k = t.trim(); } }
    var z = lz(k, n); if (z !== k) n.nodeValue = t.replace(k, z); if (DN) DN.set(n, n.nodeValue); }
  function at(el){ if (!el.getAttribute) return; ['placeholder','aria-label','title'].forEach(function(a){ var v = el.getAttribute(a); if (!v) return; if (has.call(M, v)) { if (M[v] !== v) el.setAttribute(a, M[v]); return; } for (var i = 0; i < RX.length; i++) if (RX[i][0].test(v)) { var w = v.replace(RX[i][0], RX[i][1]); if (w !== v) el.setAttribute(a, w); return; } });
    if (LP && el.tagName === 'A' && !el.hasAttribute('hreflang')) { var h = el.getAttribute('href') || '', m = h.match(/^\/([a-z-]+)\/?([?#].*)?$/); if (m && PG.indexOf(m[1]) >= 0) el.setAttribute('href', LP + '/' + m[1] + '/' + (m[2] || '')); } }
  function sh(n){ var e = n.nodeType === 1 ? n : n.parentNode; return !!(e && e.closest && e.closest('.ship')); }
  function walk(r){
    if (r.nodeType === 3) { if (!sh(r)) tx(r); return; }
    if (r.nodeType !== 1) return;
    var s = sh(r); at(r); var w = document.createTreeWalker(r, 5), n; while ((n = w.nextNode())) { if (n.nodeType !== 3) at(n); else if (!s && !sh(n)) tx(n); }
  }
  new MutationObserver(function(ms){ ms.forEach(function(m){
    var t = m.target;
    if (m.type === 'attributes') { at(t); return; }
    if (m.type === 'characterData') { if (!sh(t)) tx(t); return; }
    var db = t.closest && t.closest('[data-db]'); if (db) { num(db); return; }
    m.addedNodes.forEach(walk);
  }); }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder','aria-label','title'] });
  function all(){ walk(document.body); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  window.addEventListener('load', all);
})();
