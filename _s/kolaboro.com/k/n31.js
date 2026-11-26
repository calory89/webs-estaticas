/* Kolaboro project pages, batch 31 (n31a, 18 Nov 2026). Loaded with defer by the sticky "Check this project" button.
   1) "What was missing?" one question at the end of the page (and once per session when the pointer leaves the window on wide
      screens): the answer is counted as one number per answer and day at the edge (/api/open/fn), nothing else is sent or kept.
   2) "Saved by at least N visitors": read from /api/open/sv, shown only from 3. Saves are counted by /k/site.js once per browser.
   Storage: sessionStorage/localStorage only to avoid asking twice, every access in try/catch. */
(function () {
  if (window.KBN31) return; window.KBN31 = 1;
  var D = document, LG = (D.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: ['What was missing on this page?', ['permit', 'Permit or licence'], ['date', 'A reliable handover date'], ['price', 'Prices'], ['dev', 'The developer\'s track record'], ['site', 'Recent photos of the site'], ['nothing', 'Nothing, it answered my question'], 'Thank you. Answers are counted, nothing else is stored.', 'Close', 'Saved by at least {n} visitors since 18 Nov 2026 (counted without cookies).', 'Ask us to add a project'],
    es: ['¿Qué te faltó en esta página?', ['permit', 'Permiso o licencia'], ['date', 'Una fecha de entrega fiable'], ['price', 'Precios'], ['dev', 'El historial del promotor'], ['site', 'Fotos recientes de la obra'], ['nothing', 'Nada, respondió a mi pregunta'], 'Gracias. Solo se cuentan las respuestas; no se guarda nada más.', 'Cerrar', 'Guardado por al menos {n} visitantes desde el 18 nov 2026 (contado sin cookies).', 'Pídenos un proyecto'],
    de: ['Was hat auf dieser Seite gefehlt?', ['permit', 'Genehmigung oder Lizenz'], ['date', 'Ein verlässlicher Übergabetermin'], ['price', 'Preise'], ['dev', 'Die Bilanz des Bauträgers'], ['site', 'Aktuelle Fotos der Baustelle'], ['nothing', 'Nichts, meine Frage ist beantwortet'], 'Danke. Nur die Antworten werden gezählt, sonst wird nichts gespeichert.', 'Schließen', 'Von mindestens {n} Besuchern gespeichert seit 18. Nov. 2026 (ohne Cookies gezählt).', 'Projekt hinzufügen lassen'],
    fr: ['Qu’est-ce qui manquait sur cette page ?', ['permit', 'Permis ou licence'], ['date', 'Une date de livraison fiable'], ['price', 'Les prix'], ['dev', 'Les antécédents du promoteur'], ['site', 'Des photos récentes du chantier'], ['nothing', 'Rien, j’ai ma réponse'], 'Merci. Seules les réponses sont comptées, rien d’autre n’est enregistré.', 'Fermer', 'Enregistré par au moins {n} visiteurs depuis le 18 nov. 2026 (compté sans cookies).', 'Demandez-nous un projet'],
    nl: ['Wat ontbrak er op deze pagina?', ['permit', 'Vergunning of licentie'], ['date', 'Een betrouwbare opleverdatum'], ['price', 'Prijzen'], ['dev', 'Het trackrecord van de ontwikkelaar'], ['site', 'Recente foto’s van de bouwplaats'], ['nothing', 'Niets, mijn vraag is beantwoord'], 'Dank u. Alleen de antwoorden worden geteld, verder wordt niets opgeslagen.', 'Sluiten', 'Bewaard door minstens {n} bezoekers sinds 18 nov 2026 (geteld zonder cookies).', 'Vraag ons een project toe te voegen'],
    ru: ['Чего не хватило на этой странице?', ['permit', 'Разрешения или лицензии'], ['date', 'Надёжного срока сдачи'], ['price', 'Цен'], ['dev', 'Истории застройщика'], ['site', 'Свежих фото стройки'], ['nothing', 'Ничего, я получил ответ'], 'Спасибо. Считаются только ответы, больше ничего не сохраняется.', 'Закрыть', 'Сохранили не менее {n} посетителей с 18 нояб. 2026 (подсчёт без cookie).', 'Попросите нас добавить проект'],
    zh: ['这个页面缺了什么？', ['permit', '许可证或执照'], ['date', '可靠的交付日期'], ['price', '价格'], ['dev', '开发商的过往记录'], ['site', '工地近期照片'], ['nothing', '没有，问题已解答'], '谢谢。只统计回答，不保存其他任何内容。', '关闭', '自 2026 年 11 月 18 日起至少有 {n} 位访客保存（不使用 Cookie 统计）。', '请我们添加项目'],
    ar: ['ما الذي كان ناقصًا في هذه الصفحة؟', ['permit', 'التصريح أو الترخيص'], ['date', 'موعد تسليم موثوق'], ['price', 'الأسعار'], ['dev', 'سجل المطوّر'], ['site', 'صور حديثة للموقع'], ['nothing', 'لا شيء، وجدت إجابتي'], 'شكرًا. تُحتسب الإجابات فقط، ولا يُحفظ أي شيء آخر.', 'إغلاق', 'حفظه {n} زائرين على الأقل منذ 18 نوفمبر 2026 (عُدّ دون ملفات تعريف الارتباط).', 'اطلب منا إضافة مشروع']
  }, L = T[LG] || T.en, P = LG === 'en' ? '' : '/' + LG;
  var m = /^\/(?:[a-z]{2}\/)?projects\/([a-z0-9-]+)\/$/.exec(location.pathname); if (!m) return;
  var slug = m[1], key = 'kb-n31-miss-' + slug;
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function beacon(u) { try { if (navigator.sendBeacon && navigator.sendBeacon(u)) return; } catch (e) {} try { fetch(u, { method: 'POST', keepalive: true }); } catch (e) {} }
  var css = D.createElement('style');
  css.textContent = '.kn31q{margin:24px 0;padding:14px 16px;border:1px solid var(--k-line,#DDE3E0);border-radius:14px;background:var(--k-surface,#fff)}.kn31q p{margin:0 0 10px;font-weight:600}.kn31q .o{display:flex;flex-wrap:wrap;gap:8px}.kn31q button.a{min-height:44px;padding:8px 14px;border:1px solid var(--k-line-2,#C9D1CE);border-radius:999px;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:start}.kn31q button.a:hover{border-color:currentColor}.kn31q .ty{font-weight:500}' +
    '.kn31t{position:fixed;z-index:31;bottom:20px;left:20px;max-width:420px;margin:0;box-shadow:0 18px 40px -16px rgba(23,33,43,.45)}[dir=rtl] .kn31t{left:auto;right:20px}.kn31q .x{float:right;min-width:44px;min-height:44px;margin:-10px -10px 0 0;border:0;background:none;color:inherit;font-size:1.4rem;cursor:pointer}[dir=rtl] .kn31q .x{float:left;margin:-10px 0 0 -10px}.kn31s{font-size:.86rem;color:var(--k-muted,#56635D);margin:6px 0 0}@media print{.kn31q,.kn31s{display:none}}';
  D.head.appendChild(css);
  function box(toast) {
    var b = D.createElement('section'); b.className = 'kn31q' + (toast ? ' kn31t' : ''); b.setAttribute('aria-label', L[0]);
    var h = (toast ? '<button type="button" class="x" aria-label="' + L[8] + '">×</button>' : '') + '<p>' + L[0] + '</p><div class="o">';
    for (var i = 1; i <= 6; i++) h += '<button type="button" class="a" data-k="' + L[i][0] + '">' + L[i][1] + '</button>';
    b.innerHTML = h + '</div>';
    b.addEventListener('click', function (e) {
      var x = e.target.closest('button'); if (!x) return;
      if (x.classList.contains('x')) { b.remove(); return; }
      var k = x.getAttribute('data-k'); if (!k || ss(key)) return; ss(key, k);
      beacon('/api/open/fn?s=miss_' + k);
      D.querySelectorAll('.kn31q').forEach(function (q) { q.innerHTML = '<p class="ty" role="status">' + L[7] + '</p>'; if (q.classList.contains('kn31t')) setTimeout(function () { q.remove(); }, 2600); });
    });
    return b;
  }
  if (!ss(key)) {
    var foot = D.querySelector('main .kfoot') || D.querySelector('main');
    if (foot) { var q = box(false); if (foot.classList.contains('kfoot')) foot.parentNode.insertBefore(q, foot); else foot.appendChild(q); }
    if (matchMedia('(min-width: 900px) and (pointer: fine)').matches && !ss('kb-n31-exit')) {
      var armed = false; setTimeout(function () { armed = true; }, 15000);
      D.addEventListener('mouseout', function onOut(e) {
        if (!armed || e.relatedTarget || e.clientY > 0 || ss(key) || ss('kb-n31-exit')) return;
        ss('kb-n31-exit', '1'); D.removeEventListener('mouseout', onOut); D.body.appendChild(box(true));
      });
    }
  }
  // saves: shown only when at least 3 were counted
  var kw = D.querySelector('[data-kw]'), id = null;
  try { id = kw && JSON.parse(kw.getAttribute('data-kw')).id; } catch (e) {}
  var sv = D.querySelector('[data-kw-save]');
  if (id && sv && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      fetch('/api/open/sv?id=' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.shown) return;
        var p = D.createElement('p'); p.className = 'kn31s'; p.textContent = L[9].replace('{n}', j.saves_at_least.toLocaleString(LG === 'ar' || LG === 'zh' ? 'en' : LG));
        sv.parentNode.insertBefore(p, sv.nextSibling);
      }).catch(function () {});
    });
    io.observe(sv);
  }
})();
/* n40 k1 (26 Nov 2026, R01-42): "Copy as a message" under "Questions to ask the developer": copies the questions shown on the page,
   in the page language, as a short message to the developer. Nothing is sent or stored. */
(function () { try {
  var ol = document.querySelector('#ask ol'); if (!ol || document.getElementById('k40cq')) return;
  var T = { en: ['Copy as a message', 'Copied', 'Hello, I am interested in {n}. Before I decide, could you please answer these questions?', 'Thank you.'],
    es: ['Copiar como mensaje', 'Copiado', 'Hola, me interesa {n}. Antes de decidir, ¿podrían responder a estas preguntas?', 'Gracias.'],
    fr: ['Copier comme message', 'Copié', 'Bonjour, {n} m’intéresse. Avant de décider, pourriez-vous répondre à ces questions ?', 'Merci.'],
    de: ['Als Nachricht kopieren', 'Kopiert', 'Guten Tag, ich interessiere mich für {n}. Bevor ich entscheide, könnten Sie bitte diese Fragen beantworten?', 'Vielen Dank.'],
    nl: ['Kopiëren als bericht', 'Gekopieerd', 'Hallo, ik ben geïnteresseerd in {n}. Kunt u, voordat ik beslis, deze vragen beantwoorden?', 'Dank u.'],
    ru: ['Скопировать как сообщение', 'Скопировано', 'Здравствуйте, меня интересует {n}. Прежде чем принять решение, не могли бы вы ответить на эти вопросы?', 'Спасибо.'],
    zh: ['复制为消息', '已复制', '您好，我对{n}感兴趣。在做决定之前，能否请您回答以下问题？', '谢谢。'],
    ar: ['انسخ كرسالة', 'تم النسخ', 'مرحبًا، أنا مهتم بـ {n}. قبل أن أقرر، هل يمكنكم الإجابة عن هذه الأسئلة؟', 'شكرًا لكم.'] };
  var L = T[(document.documentElement.lang || 'en').slice(0, 2)] || T.en, h1 = document.querySelector('h1'), n = h1 ? h1.textContent.trim() : '';
  var b = document.createElement('button'); b.type = 'button'; b.id = 'k40cq'; b.className = 'btn btn-line kbtn'; b.textContent = L[0];
  var st = document.createElement('span'); st.setAttribute('role', 'status'); st.className = 'ksmall'; st.style.marginInlineStart = '8px';
  var p = document.createElement('p'); p.appendChild(b); p.appendChild(st); ol.parentNode.insertBefore(p, ol.nextSibling);
  b.addEventListener('click', function () {
    var q = [].map.call(ol.querySelectorAll('li'), function (li, i) { return (i + 1) + '. ' + li.textContent.trim(); });
    var s = L[2].replace('{n}', n) + '\n\n' + q.join('\n') + '\n\n' + L[3];
    var ok = function () { st.textContent = L[1]; setTimeout(function () { st.textContent = ''; }, 3000); };
    var fb = function () { var ta = document.createElement('textarea'); ta.value = s; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, fb); else fb();
  });
} catch (e) {} })();
