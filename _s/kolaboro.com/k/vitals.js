/* Kolaboro real-user web vitals. No library, no cookie, no id: four numbers and a page type, sent once when the tab is hidden.
   LCP, CLS and INP follow the definitions used by Chrome's web-vitals library (CLS session windows of 1 s gap / 5 s max,
   INP as the worst interaction after dropping one per 50). Loaded lazily after the load event, so it never slows the page. */
(function () {
  if (window.__kbVitals || !('PerformanceObserver' in window) || !navigator.sendBeacon) return;
  window.__kbVitals = 1;
  var supported = PerformanceObserver.supportedEntryTypes || [];
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var navType = nav ? nav.type : 'navigate';
  if (navType === 'back_forward' || navType === 'prerender' || document.prerendering) return;
  var hiddenAtStart = document.visibilityState === 'hidden';
  var V = {};

  function obs(type, cb, opts) {
    if (supported.indexOf(type) < 0) return null;
    try { var o = new PerformanceObserver(function (l) { cb(l.getEntries()); }); o.observe(Object.assign({ type: type, buffered: true }, opts || {})); return o; } catch (e) { return null; }
  }

  // TTFB: time from navigation start to the first byte of the HTML
  if (nav && nav.responseStart > 0) V.TTFB = Math.max(0, nav.responseStart - (nav.activationStart || 0));

  // LCP: last candidate before the first input or hide; ignored if the page started hidden
  var lcpObs = obs('largest-contentful-paint', function (es) { es.forEach(function (e) { if (!hiddenAtStart) V.LCP = Math.max(0, e.startTime - (nav && nav.activationStart || 0)); }); });
  function stopLcp() { if (lcpObs) { try { lcpObs.takeRecords().forEach(function (e) { if (!hiddenAtStart) V.LCP = Math.max(0, e.startTime - (nav && nav.activationStart || 0)); }); lcpObs.disconnect(); } catch (e) {} lcpObs = null; } }
  ['keydown', 'click', 'pointerdown'].forEach(function (t) { addEventListener(t, stopLcp, { once: true, capture: true }); });

  // CLS: largest session window of layout shifts not caused by recent input
  var cls = 0, win = 0, winStart = 0, winLast = 0;
  obs('layout-shift', function (es) {
    es.forEach(function (e) {
      if (e.hadRecentInput) return;
      if (win && e.startTime - winLast < 1000 && e.startTime - winStart < 5000) { win += e.value; winLast = e.startTime; }
      else { win = e.value; winStart = winLast = e.startTime; }
      if (win > cls) cls = win;
    });
    V.CLS = cls;
  });
  if (supported.indexOf('layout-shift') >= 0) V.CLS = 0;

  // INP: longest interactions grouped by interactionId; p98 approximation as in web-vitals
  var inter = {}, count = 0;
  function onEvents(es) {
    es.forEach(function (e) {
      if (!e.interactionId) return;
      var cur = inter[e.interactionId];
      if (!cur) { count++; inter[e.interactionId] = e.duration; } else if (e.duration > cur) inter[e.interactionId] = e.duration;
    });
    var d = Object.keys(inter).map(function (k) { return inter[k]; }).sort(function (a, b) { return b - a; });
    if (d.length) V.INP = d[Math.min(d.length - 1, Math.floor(count / 50))];
  }
  obs('event', onEvents, { durationThreshold: 40 });
  obs('first-input', onEvents);

  function pageType() {
    var p = location.pathname.replace(/^\/(es|de|fr|ru|nl|ar|zh|id)(\/|$)/, '/');
    if (p === '/' || p === '') return 'home';
    if (/^\/p(\/|$)/.test(p)) return 'project';
    if (/^\/(database|m)(\/|$)/.test(p)) return 'database';
    if (/^\/cases(\/|$)/.test(p)) return 'cases';
    if (/^\/check(\/|$)/.test(p)) return 'check';
    if (/^\/tools(\/|$)/.test(p)) return 'tools';
    if (/^\/(verify|log)(\/|$)/.test(p)) return 'verify';
    if (/^\/(status|metrics|engineering)(\/|$)/.test(p)) return 'status';
    if (/^\/(docs|sql|developers\/api)(\/|$)/.test(p)) return 'docs';
    if (/^\/(guides|academy|glossary|research|report|how-we-score|standard)(\/|$)/.test(p)) return 'content';
    return 'other';
  }
  var sent = false;
  function send() {
    if (sent) return; stopLcp();
    var v = {}; Object.keys(V).forEach(function (k) { if (typeof V[k] === 'number' && isFinite(V[k])) v[k] = k === 'CLS' ? Math.round(V[k] * 1e4) / 1e4 : Math.round(V[k]); });
    if (!Object.keys(v).length) return;
    sent = true;
    var mobile = (navigator.userAgentData && navigator.userAgentData.mobile) || matchMedia('(max-width: 760px)').matches;
    try { navigator.sendBeacon('/api/x/f/vitals', JSON.stringify({ p: pageType(), d: mobile ? 'm' : 'd', n: navType === 'reload' ? 'reload' : 'navigate', v: v })); } catch (e) {}
  }
  addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') send(); }, true);
  addEventListener('pagehide', send, true);
})();
