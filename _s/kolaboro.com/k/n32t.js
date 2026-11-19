/* kolaboro.com n32t (19 Nov 2026): translates what the tool scripts write after load (results, messages, labels) on the translated
   tool pages, with the same dictionary the server used for the page (/data/n32t/<lang>/<page>.json). Same rules as kbx_n32t.js:
   exact fragment, then patterns with {placeholders}, then dates. Nothing is sent anywhere; nothing is stored. */
(function () {
  'use strict';
  var me = document.currentScript, L = document.documentElement.lang, K = me && me.getAttribute('data-k');
  if (!K || !/^(es|de|fr|nl|ru|zh|ar)$/.test(L)) return;
  var LOC = { es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar-u-nu-latn' }[L];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DRX = /^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? (\d{4})$/, YRX = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})$/;
  var SEP = /^[\s\/·|›>]+/, S = {}, P = [], CC = {}, DN = null, CU = {}, DC = null, done = typeof WeakMap === 'function' ? new WeakMap() : null;
  function get(u) { return fetch(u, { credentials: 'omit' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }); }
  function compile(list) {
    (list || []).forEach(function (e) {
      var names = [], src = e[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, function (m, n) { names.push(n); return '(.+?)'; });
      P.push([new RegExp('^' + src + '$'), e[1], names]);
    });
  }
  function dt(d, o) { try { return new Intl.DateTimeFormat(LOC, o).format(d); } catch (e) { return null; } }
  function auto(s) {
    var m = DRX.exec(s); if (m) return dt(new Date(Date.UTC(+m[3], MON.indexOf(m[2]), +m[1], 12)), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    m = YRX.exec(s); if (m) return dt(new Date(Date.UTC(+m[2], MON.indexOf(m[1]), 15, 12)), { month: 'long', year: 'numeric', timeZone: 'UTC' });
    if (CC[s] && DN) { try { return DN.of(CC[s]) || null; } catch (e) { return null; } }
    if (CU[s] && DC) { try { return DC.of(CU[s]) || null; } catch (e) { return null; } }
    return null;
  }
  function T(s) {
    if (Object.prototype.hasOwnProperty.call(S, s)) return S[s];
    for (var i = 0; i < P.length; i++) {
      var m = P[i][0].exec(s); if (!m) continue;
      var names = P[i][2];
      return P[i][1].replace(/\{(\w+)\}/g, function (z, k) { var j = names.indexOf(k); if (j < 0) return z; var v = m[j + 1]; return Object.prototype.hasOwnProperty.call(S, v) ? S[v] : (auto(v) || v); });
    }
    return auto(s);
  }
  function text(n) {
    var raw = n.nodeValue; if (!raw || !/[A-Za-z]{2}/.test(raw)) return;
    if (done && done.get(n) === raw) return;
    var core = raw.replace(/\s+/g, ' ').trim(), sp = (SEP.exec(core) || [''])[0]; core = core.slice(sp.length).trim();
    var t = core ? T(core) : null;
    if (t != null && t !== core) { var lead = /^\s*/.exec(raw)[0], trail = /\s*$/.exec(raw)[0]; n.nodeValue = lead + sp + t + trail; }
    if (done) done.set(n, n.nodeValue);
  }
  var AT = ['placeholder', 'aria-label', 'title', 'alt'];
  function attrs(el) {
    for (var i = 0; i < AT.length; i++) { var v = el.getAttribute(AT[i]); if (!v || !/[A-Za-z]{2}/.test(v)) continue; var t = T(v.replace(/\s+/g, ' ').trim()); if (t != null && t !== v) el.setAttribute(AT[i], t); }
  }
  function walk(root) {
    if (root.nodeType === 3) { var p = root.parentNode; if (p && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) text(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.nodeName)) return;
    attrs(root);
    var w = document.createTreeWalker(root, 5, null), n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 1) { if (/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.nodeName)) continue; attrs(n); }
      else if (n.parentNode && !/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName)) text(n);
    }
  }
  var main = document.querySelector('main') || document.body;
  Promise.all([get('/data/n32t/' + L + '/_common.json'), get('/data/n32t/' + L + '/' + K + '.json')]).then(function (a) {
    if (a[0] && a[0].cu) { CU = a[0].cu; try { DC = new Intl.DisplayNames([LOC], { type: 'currency' }); } catch (e) { DC = null; } }
    if (a[0] && a[0].cc) { CC = a[0].cc; try { DN = new Intl.DisplayNames([LOC], { type: 'region', fallback: 'none' }); } catch (e) { DN = null; } }
    [a[0], a[1]].forEach(function (d) { if (d && d.s) for (var k in d.s) if (Object.prototype.hasOwnProperty.call(d.s, k)) S[k] = d.s[k]; compile(d && d.p); });
    walk(main);
    var q = [], busy = false;
    function flush() { busy = false; var l = q; q = []; for (var i = 0; i < l.length; i++) walk(l[i]); }
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') q.push(m.target);
        else if (m.type === 'attributes') q.push(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) q.push(m.addedNodes[j]);
      }
      if (!busy && q.length) { busy = true; (window.queueMicrotask || setTimeout)(flush); }
    }).observe(main, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: AT });
  });
})();
