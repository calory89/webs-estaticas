/* Kolaboro /pricing/ (n31a, 18 Nov 2026, item 31): the euro prices also in the visitor's currency, as an estimate.
   Country from /api/geo (the Cloudflare location of this request, nothing stored), rate from /api/x/x/fx (European Central Bank
   reference rates; AED from the fixed US dollar peg). Prices stay charged in euros. Euro countries and currencies without an ECB
   rate see nothing extra. ?cur=USD forces a currency. Nothing is sent anywhere and nothing is kept in the browser. */
(function () {
  var D = document, tpl = D.querySelector('.n31-curd'), els = D.querySelectorAll('.n31-cur[data-eur]');
  if (!tpl || !els.length || !window.fetch) return;
  var C = { US: 'USD', GB: 'GBP', CH: 'CHF', AE: 'AED', AU: 'AUD', CA: 'CAD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', HK: 'HKD', SG: 'SGD', IN: 'INR', MY: 'MYR', TH: 'THB', ID: 'IDR', PH: 'PHP', KR: 'KRW', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', TR: 'TRY', ZA: 'ZAR', BR: 'BRL', MX: 'MXN', IL: 'ILS', IS: 'ISK' };
  var LG = (D.documentElement.lang || 'en').slice(0, 2), LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[LG] || 'en-GB';
  var force = (new URLSearchParams(location.search).get('cur') || '').toUpperCase();
  function go(cur) {
    if (!cur || cur === 'EUR') return;
    var from = new Date(Date.now() - 12 * 864e5).toISOString().slice(0, 10);
    fetch('/api/x/x/fx?c=' + cur + '&from=' + from).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var a = j && j.rates && j.rates[cur], d = j && j.dates && j.dates[j.dates.length - 1];
      if (!a || !a.length || !d) return;
      var rate = a[a.length - 1]; if (!(rate > 0)) return;
      var fd = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + 'T12:00:00Z'));
      els.forEach(function (e) {
        var v = +e.getAttribute('data-eur') * rate, x;
        try { x = new Intl.NumberFormat(LOC, { style: 'currency', currency: cur, maximumFractionDigits: 0, numberingSystem: 'latn' }).format(Math.round(v)); } catch (z) { x = Math.round(v) + ' ' + cur; }
        e.textContent = tpl.getAttribute('data-t').replace('{x}', x).replace('{d}', fd);
        e.hidden = false;
      });
    }).catch(function () {});
  }
  if (/^[A-Z]{3}$/.test(force)) { go(force); return; }
  fetch('/api/geo').then(function (r) { return r.ok ? r.json() : null; }).then(function (g) { if (g && g.country) go(C[g.country]); }).catch(function () {});
})();
