/* Kolaboro watchlist change alerts (n34b, 21 Nov 2026). Reads the projects saved in this browser (localStorage 'kb_watch', see
   /watchlist/wl.js) and asks the public change feed (/api/v1/changes, the same records as /changes/live/) what changed for them since
   the last check. Runs only in this browser: no account, no email, nothing about the list is sent (per-project requests carry only
   the public project id). Browser notifications are asked for only when the visitor presses the button, and show only while this
   page or the installed app is open. The last result is kept in localStorage, so the page shows it offline (the PWA keeps the page). */
(function () {
  var host = document.getElementById('wllist'); if (!host || !window.fetch) return;
  var LG = (document.documentElement.lang || 'en').slice(0, 2);
  var S = {
    en: { h: 'Change alerts', chk: 'Check for changes now', on: 'Turn on browser notifications', onok: 'Notifications are on for this browser.', ondeny: 'Notifications are blocked in this browser settings.', none: 'Nothing new for your projects since {d}.', n: '{k} new changes for your projects since {d}.', last: 'Last check: {t}.', off: 'You are offline: showing what the last check found ({t}).', err: 'The change feed did not answer. Try again in a minute.', empty: 'Save a project to get alerts here.', note: 'Checked in this browser from the public change feed every 15 minutes while this page or the installed app is open. No email and no account.', notif: '{k} changes on your Kolaboro watchlist', src: 'source', feed: 'Change feed' },
    es: { h: 'Avisos de cambios', chk: 'Buscar cambios ahora', on: 'Activar notificaciones del navegador', onok: 'Las notificaciones están activadas en este navegador.', ondeny: 'Las notificaciones están bloqueadas en la configuración del navegador.', none: 'Nada nuevo en tus proyectos desde el {d}.', n: '{k} cambios nuevos en tus proyectos desde el {d}.', last: 'Última comprobación: {t}.', off: 'Sin conexión: se muestra lo que encontró la última comprobación ({t}).', err: 'El registro de cambios no respondió. Inténtalo en un minuto.', empty: 'Guarda un proyecto para recibir avisos aquí.', note: 'Se comprueba en este navegador con el registro público de cambios cada 15 minutos mientras esta página o la app instalada estén abiertas. Sin email y sin cuenta.', notif: '{k} cambios en tu lista de Kolaboro', src: 'fuente', feed: 'Registro de cambios' },
    fr: { h: 'Alertes de changement', chk: 'Vérifier maintenant', on: 'Activer les notifications du navigateur', onok: 'Les notifications sont activées dans ce navigateur.', ondeny: 'Les notifications sont bloquées dans les réglages du navigateur.', none: 'Rien de nouveau pour vos projets depuis le {d}.', n: '{k} nouveaux changements pour vos projets depuis le {d}.', last: 'Dernière vérification : {t}.', off: 'Hors ligne : résultat de la dernière vérification ({t}).', err: 'Le flux des changements n\'a pas répondu. Réessayez dans une minute.', empty: 'Enregistrez un projet pour recevoir des alertes ici.', note: 'Vérifié dans ce navigateur depuis le flux public des changements toutes les 15 minutes tant que cette page ou l\'application installée est ouverte. Sans e-mail ni compte.', notif: '{k} changements sur votre liste Kolaboro', src: 'source', feed: 'Flux des changements' },
    de: { h: 'Änderungshinweise', chk: 'Jetzt auf Änderungen prüfen', on: 'Browser-Benachrichtigungen einschalten', onok: 'Benachrichtigungen sind in diesem Browser an.', ondeny: 'Benachrichtigungen sind in den Browser-Einstellungen blockiert.', none: 'Nichts Neues zu Ihren Projekten seit {d}.', n: '{k} neue Änderungen zu Ihren Projekten seit {d}.', last: 'Letzte Prüfung: {t}.', off: 'Offline: Ergebnis der letzten Prüfung ({t}).', err: 'Der Änderungs-Feed hat nicht geantwortet. Bitte in einer Minute erneut versuchen.', empty: 'Speichern Sie ein Projekt, um hier Hinweise zu erhalten.', note: 'In diesem Browser alle 15 Minuten aus dem öffentlichen Änderungs-Feed geprüft, solange diese Seite oder die installierte App offen ist. Ohne E-Mail und ohne Konto.', notif: '{k} Änderungen auf Ihrer Kolaboro-Merkliste', src: 'Quelle', feed: 'Änderungs-Feed' },
    nl: { h: 'Wijzigingsmeldingen', chk: 'Nu op wijzigingen controleren', on: 'Browsermeldingen aanzetten', onok: 'Meldingen staan aan in deze browser.', ondeny: 'Meldingen zijn geblokkeerd in de browserinstellingen.', none: 'Niets nieuws voor uw projecten sinds {d}.', n: '{k} nieuwe wijzigingen voor uw projecten sinds {d}.', last: 'Laatste controle: {t}.', off: 'Offline: resultaat van de laatste controle ({t}).', err: 'De wijzigingsfeed antwoordde niet. Probeer het over een minuut opnieuw.', empty: 'Bewaar een project om hier meldingen te krijgen.', note: 'Elke 15 minuten in deze browser gecontroleerd via de openbare wijzigingsfeed zolang deze pagina of de geïnstalleerde app open is. Zonder e-mail en zonder account.', notif: '{k} wijzigingen op uw Kolaboro-volglijst', src: 'bron', feed: 'Wijzigingsfeed' },
    ru: { h: 'Уведомления об изменениях', chk: 'Проверить изменения сейчас', on: 'Включить уведомления браузера', onok: 'Уведомления включены в этом браузере.', ondeny: 'Уведомления заблокированы в настройках браузера.', none: 'С {d} по вашим проектам ничего нового.', n: '{k} новых изменений по вашим проектам с {d}.', last: 'Последняя проверка: {t}.', off: 'Нет сети: показан результат последней проверки ({t}).', err: 'Лента изменений не ответила. Попробуйте через минуту.', empty: 'Сохраните проект, чтобы получать здесь уведомления.', note: 'Проверяется в этом браузере по открытой ленте изменений каждые 15 минут, пока открыта эта страница или установленное приложение. Без email и без аккаунта.', notif: '{k} изменений в вашем списке Kolaboro', src: 'источник', feed: 'Лента изменений' },
    zh: { h: '变更提醒', chk: '立即检查变更', on: '开启浏览器通知', onok: '此浏览器已开启通知。', ondeny: '浏览器设置已阻止通知。', none: '自 {d} 以来您的项目没有新变化。', n: '自 {d} 以来您的项目有 {k} 项新变化。', last: '上次检查：{t}。', off: '当前离线：显示上次检查的结果（{t}）。', err: '变更源没有响应，请一分钟后再试。', empty: '保存项目后即可在此收到提醒。', note: '在本页面或已安装的应用打开时，浏览器每 15 分钟从公开变更源检查一次。无需邮箱和账户。', notif: '您的 Kolaboro 关注列表有 {k} 项变化', src: '来源', feed: '变更源' },
    ar: { h: 'تنبيهات التغيير', chk: 'تحقّق من التغييرات الآن', on: 'تفعيل إشعارات المتصفح', onok: 'الإشعارات مفعّلة في هذا المتصفح.', ondeny: 'الإشعارات محظورة في إعدادات المتصفح.', none: 'لا جديد في مشاريعك منذ {d}.', n: '{k} تغييرات جديدة في مشاريعك منذ {d}.', last: 'آخر فحص: {t}.', off: 'أنت غير متصل: نعرض ما وجده آخر فحص ({t}).', err: 'لم يستجب سجل التغييرات. حاول بعد دقيقة.', empty: 'احفظ مشروعًا لتصلك التنبيهات هنا.', note: 'يُفحص في هذا المتصفح من سجل التغييرات العام كل 15 دقيقة ما دامت هذه الصفحة أو التطبيق المثبّت مفتوحًا. دون بريد ودون حساب.', notif: '{k} تغييرات في قائمة متابعتك على Kolaboro', src: 'المصدر', feed: 'سجل التغييرات' }
  };
  var T = S[LG] || S.en, K = 'kb-n34-alerts', LOC = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[LG] || 'en-GB';
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fd = function (d) { try { return new Date(d).toLocaleString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return String(d).slice(0, 10); } };
  var ft = function (d) { try { return new Date(d).toLocaleString(LOC, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(d); } };
  function get() { try { return JSON.parse(localStorage.getItem(K) || 'null') || {}; } catch (e) { return {}; } }
  function put(o) { try { localStorage.setItem(K, JSON.stringify(o)); } catch (e) {} }
  function ids() { try { return (window.KBWatch ? KBWatch.list() : JSON.parse(localStorage.getItem('kb_watch') || '[]')).map(function (x) { return { id: String(x.id || '').toUpperCase(), added: x.added || (x.snap && x.snap.date) || '' }; }).filter(function (x) { return /^[A-Z0-9-]{3,20}$/.test(x.id); }); } catch (e) { return []; } }
  var box = document.createElement('section'); box.className = 'wl-alerts'; box.setAttribute('aria-labelledby', 'wl-al-h');
  box.style.cssText = 'border:1px solid var(--line,#d5d3cc);border-radius:14px;padding:14px 16px;margin:14px 0 20px';
  box.innerHTML = '<h2 id="wl-al-h" style="margin:0 0 6px;font-size:1.15rem">' + esc(T.h) + '</h2><p id="wl-al-s" role="status" aria-live="polite" style="margin:0 0 8px"></p><ul id="wl-al-l" style="margin:0 0 10px;padding-inline-start:18px"></ul>' +
    '<p style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px"><button type="button" class="btn btn-line btn-sm" id="wl-al-c" style="min-height:44px">' + esc(T.chk) + '</button><button type="button" class="btn btn-line btn-sm" id="wl-al-n" style="min-height:44px" hidden>' + esc(T.on) + '</button></p>' +
    '<p class="muted" style="font-size:.86rem;margin:0">' + esc(T.note) + ' <a href="/changes/live/">' + esc(T.feed) + '</a></p>';
  host.parentNode.insertBefore(box, host);
  var st = document.getElementById('wl-al-s'), ul = document.getElementById('wl-al-l'), bc = document.getElementById('wl-al-c'), bn = document.getElementById('wl-al-n');
  function render(o, offline) {
    var L = ids(); if (!L.length) { st.textContent = T.empty; ul.innerHTML = ''; return; }
    var items = (o.items || []).filter(function (c) { return L.some(function (x) { return x.id === c.p; }); });
    var since = o.since || (L.map(function (x) { return x.added; }).sort()[0]) || '';
    st.textContent = (offline ? fill(T.off, { t: ft(o.checked) }) + ' ' : '') + (items.length ? fill(T.n, { k: items.length, d: fd(since) }) : fill(T.none, { d: fd(since) })) + (o.checked && !offline ? ' ' + fill(T.last, { t: ft(o.checked) }) : '');
    ul.innerHTML = items.slice(0, 30).map(function (c) { return '<li style="margin:4px 0"><small>' + esc(fd(c.at)) + '</small> <a href="' + esc(c.url || '#') + '"><b>' + esc(c.n) + '</b></a>: ' + esc(c.t) + (c.src ? ' <a href="' + esc(c.src) + '" rel="nofollow noopener" target="_blank">' + esc(T.src) + '</a>' : '') + '</li>'; }).join('');
    if (items.length) document.title = document.title.replace(/^\(\d+\) /, '').replace(/^/, '(' + items.length + ') '); else document.title = document.title.replace(/^\(\d+\) /, '');
  }
  function fetchJ(u) { return fetch(u, { headers: { accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  var running = false;
  function check(user) {
    if (running) return; var L = ids(), o = get(); if (!L.length) { render(o); return; }
    if (navigator.onLine === false) { render(o, true); return; }
    running = true; bc.disabled = true;
    var oldest = L.map(function (x) { return x.added; }).filter(Boolean).sort()[0] || new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    var since = o.cursor || oldest, seen = {}; (o.items || []).forEach(function (c) { seen[c.id] = 1; });
    var jobs = L.length <= 12 ? L.map(function (x) { return fetchJ('/api/v1/changes?project=' + encodeURIComponent(x.id) + '&since=' + encodeURIComponent(since)); })
      : [fetchJ('/api/v1/changes?since=' + encodeURIComponent(since) + '&limit=500')];
    Promise.all(jobs).then(function (rs) {
      var want = {}, fresh = [];
      L.forEach(function (x) { want[x.id] = x.added; });
      rs.forEach(function (r) { (r.changes || []).forEach(function (c) { var p = c.project && c.project.id; if (!p || !(p in want) || seen[c.id]) return; if (want[p] && String(c.at).slice(0, 10) < want[p]) return; seen[c.id] = 1; fresh.push({ id: c.id, at: c.at, p: p, n: (c.project && c.project.name) || p, t: c.text || c.title || '', src: c.source || null, url: c.url || null }); }); });
      var items = fresh.concat(o.items || []).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }).slice(0, 100);
      // records can carry an earlier date than the day they were published: ask again from 3 days back and drop ids already seen
      var back = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10), n = { since: o.since || oldest, cursor: back > oldest ? back : oldest, checked: new Date().toISOString(), items: items };
      put(n); render(n);
      if (fresh.length && document.visibilityState !== 'visible' && window.Notification && Notification.permission === 'granted') { try { new Notification(fill(T.notif, { k: fresh.length }), { body: fresh.slice(0, 3).map(function (c) { return c.n + ': ' + c.t; }).join('\n').slice(0, 240), icon: '/k/icon-192.png', tag: 'kb-watch' }); } catch (e) {} }
    }).catch(function () { render(get(), navigator.onLine === false); if (user) st.textContent = T.err; }).then(function () { running = false; bc.disabled = false; });
  }
  bc.addEventListener('click', function () { check(true); });
  if (window.Notification && Notification.permission !== 'granted') {
    bn.hidden = false;
    bn.addEventListener('click', function () { try { Notification.requestPermission().then(function (p) { bn.hidden = p === 'granted'; st.textContent = p === 'granted' ? T.onok : T.ondeny; }); } catch (e) {} });
  }
  render(get(), navigator.onLine === false);
  setTimeout(function () { check(false); }, 400);
  setInterval(function () { check(false); }, 15 * 60 * 1000);
  window.addEventListener('online', function () { check(false); });
  try { if (window.KBWatch && KBWatch.on) KBWatch.on(function () { render(get()); }); } catch (e) {}
})();
