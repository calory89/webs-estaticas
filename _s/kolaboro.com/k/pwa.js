/* Kolaboro offline app (17 Nov 2026, n30b). Loaded by k/site.js when the browser is idle.
   1) Makes the site installable: manifest link and theme colour.
   2) Registers /sw.js and sends it the pages to keep on this device: the projects in My projects (localStorage kb_watch),
      the last 3 comparisons opened (localStorage kb-pwa-cmp), the home page and the offline page in the page language.
      The lists stay in this browser; nothing is sent to Kolaboro beyond the normal page requests.
   3) Offline banner in 8 languages, with the date the copy on screen was stored. */
(function () {
  var D = document, W = window, H = D.documentElement;
  if (W.__kbpwa) return; W.__kbpwa = 1;
  var lang = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(location.pathname) || [0, 'en'])[1], pre = lang === 'en' ? '' : '/' + lang;
  var S = {
    en: ['You are offline.', 'This copy was stored on this device on {d}; facts may have changed since.', 'Pages that are not kept on this device will not open until the connection is back.', 'Back online.', 'Pages kept offline'],
    es: ['Estás sin conexión.', 'Esta copia se guardó en este dispositivo el {d}; los datos pueden haber cambiado desde entonces.', 'Las páginas que no están guardadas en este dispositivo no se abrirán hasta que vuelva la conexión.', 'Conexión recuperada.', 'Páginas guardadas sin conexión'],
    de: ['Sie sind offline.', 'Diese Kopie wurde am {d} auf diesem Gerät gespeichert; die Fakten können sich seitdem geändert haben.', 'Seiten, die nicht auf diesem Gerät gespeichert sind, öffnen sich erst wieder mit Verbindung.', 'Wieder online.', 'Offline gespeicherte Seiten'],
    fr: ['Vous êtes hors ligne.', 'Cette copie a été gardée sur cet appareil le {d} ; les faits ont pu changer depuis.', 'Les pages qui ne sont pas gardées sur cet appareil ne s’ouvriront qu’au retour de la connexion.', 'De nouveau en ligne.', 'Pages gardées hors ligne'],
    nl: ['Je bent offline.', 'Deze kopie is op {d} op dit apparaat bewaard; de feiten kunnen sindsdien veranderd zijn.', 'Pagina\'s die niet op dit apparaat staan, openen pas weer als de verbinding terug is.', 'Weer online.', 'Offline bewaarde pagina\'s'],
    ru: ['Вы не в сети.', 'Эта копия сохранена на устройстве {d}; с тех пор факты могли измениться.', 'Страницы, не сохранённые на этом устройстве, откроются после восстановления связи.', 'Связь восстановлена.', 'Страницы, доступные без сети'],
    zh: ['您已离线。', '此副本于 {d} 保存在本设备上；此后事实可能已有变化。', '未保存在本设备上的页面要等网络恢复后才能打开。', '已恢复联网。', '可离线查看的页面'],
    ar: ['أنت غير متصل.', 'حُفظت هذه النسخة على هذا الجهاز في {d}؛ وقد تكون الحقائق تغيّرت منذ ذلك الحين.', 'لن تُفتح الصفحات غير المحفوظة على هذا الجهاز حتى يعود الاتصال.', 'عاد الاتصال.', 'الصفحات المحفوظة دون اتصال']
  }[lang];
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  // 1) installable
  if (!D.querySelector('link[rel="manifest"]')) { var l = D.createElement('link'); l.rel = 'manifest'; l.href = '/manifest.webmanifest'; D.head.appendChild(l); }
  if (!D.querySelector('meta[name="theme-color"]')) { var m = D.createElement('meta'); m.name = 'theme-color'; m.content = '#17212B'; D.head.appendChild(m); }
  // 3) offline banner
  var bar = null;
  function fmt(iso) { try { return new Date(iso).toLocaleDateString(H.lang || lang, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(iso).slice(0, 10); } }
  function savedAt() {
    if (!('caches' in W)) return Promise.resolve(null);
    var p = location.pathname + location.search;
    return Promise.all(['kb-my-v1', 'kb-saved-v1'].map(function (n) { return caches.open(n).then(function (c) { return c.match(p); }).catch(function () { return null; }); }))
      .then(function (a) { var r = a[0] || a[1]; return r ? (r.headers.get('x-kb-saved') || r.headers.get('date')) : null; });
  }
  function show() {
    var old = D.querySelector('.kx-offbar'); if (old) old.remove();   // the older English bar of k/site.js
    if (bar) return;
    bar = D.createElement('div'); bar.className = 'kb-offbar'; bar.setAttribute('role', 'status'); bar.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    bar.style.cssText = 'position:sticky;top:0;z-index:1000;padding:10px 16px;background:#8A5A00;color:#fff;font:600 15px/1.4 system-ui,sans-serif;text-align:center';
    bar.textContent = S[0] + ' ' + S[2];
    D.body.insertBefore(bar, D.body.firstChild);
    savedAt().then(function (d) { if (d && bar) bar.textContent = S[0] + ' ' + S[1].replace('{d}', fmt(d)); });
  }
  function hide() { if (!bar) return; bar.textContent = S[3]; bar.style.background = '#1F6B45'; var b = bar; bar = null; setTimeout(function () { b.remove(); }, 2500); }
  W.addEventListener('offline', show); W.addEventListener('online', hide);
  if (navigator.onLine === false) show();
  // 2) service worker and the list of pages to keep
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  var cm = /^\/(?:[a-z]{2}\/)?compare\/$/.test(location.pathname) && /[?&]p=/.test(location.search);
  if (cm) { var L0 = []; try { L0 = JSON.parse(ls('kb-pwa-cmp') || '[]') || []; } catch (e) {} var here = location.pathname + location.search; L0 = [here].concat(L0.filter(function (x) { return x !== here; })).slice(0, 3); ls('kb-pwa-cmp', JSON.stringify(L0)); }
  function ids() {   // id -> slug map of named projects, kept a day
    var c = null; try { c = JSON.parse(ls('kb-pwa-ids') || 'null'); } catch (e) {}
    if (c && c.t && Date.now() - c.t < 864e5 && c.ids) return Promise.resolve(c.ids);
    return fetch('/api/v1/search-index?f=ids').then(function (r) { return r.json(); }).then(function (j) { ls('kb-pwa-ids', JSON.stringify({ t: Date.now(), ids: j.ids || {} })); return j.ids || {}; });
  }
  function urls() {
    var W0 = []; try { W0 = JSON.parse(ls('kb_watch') || '[]') || []; } catch (e) {}
    var C0 = []; try { C0 = JSON.parse(ls('kb-pwa-cmp') || '[]') || []; } catch (e) {}
    var base = [pre + '/', pre + '/offline/', '/offline/'].concat(C0).filter(function (x, i, A) { return A.indexOf(x) === i; });
    if (!W0.length) return Promise.resolve(base);
    return ids().then(function (M) {
      var P = []; W0.slice(0, 25).forEach(function (x) { var s = x && M[String(x.id || '').toUpperCase()]; if (s) P.push(pre + '/projects/' + s + '/', '/api/v1/projects/' + s); });
      return base.concat(P);
    }).catch(function () { return base; });
  }
  function sync(reg) {
    return urls().then(function (U) {
      var key = U.join('|'), last = null; try { last = JSON.parse(ls('kb-pwa-sync') || 'null'); } catch (e) {}
      if (last && last.k === key && Date.now() - last.t < 432e5) return;   // same list, synced in the last 12 hours
      var sw = reg.active || navigator.serviceWorker.controller; if (!sw) return;
      sw.postMessage({ t: 'kb-sync', urls: U, lang: lang });
      ls('kb-pwa-sync', JSON.stringify({ k: key, t: Date.now() }));
    });
  }
  navigator.serviceWorker.addEventListener('message', function (e) { var d = e.data || {}; if (d.t === 'kb-synced') { try { W.dispatchEvent(new CustomEvent('kb-offline-kept', { detail: d })); } catch (x) {} } });
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function () { return navigator.serviceWorker.ready; }).then(sync).catch(function () {});
  W.addEventListener('storage', function (e) { if (e.key === 'kb_watch') navigator.serviceWorker.ready.then(sync).catch(function () {}); });
})();
