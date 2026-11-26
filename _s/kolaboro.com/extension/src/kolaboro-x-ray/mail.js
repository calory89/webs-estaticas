// Kolaboro X-ray on Gmail web: the payment email panel (uses KPEC from mailcheck.js and KX.CSS / KX.uiLang from kx.js).
// It reads only what Gmail shows for the open email (sender name and address, the body text, and the Reply-To, mailed-by and
// signed-by rows when the person opens the details arrow). It acts only when the email mentions a payment or bank details.
// Nothing from the email is stored or sent: the background worker fetches the public developer-domain list and, for the sender
// domain alone, its public DNS and registration date.
(function () {
  if (window.__kolaboroMail) return; window.__kolaboroMail = true;
  var MT = {
    en: { title: 'Payment email check', why: 'This email mentions a payment or bank details.', call_t: 'Before you pay, call the developer', call_p: 'Use a number from its official website or your contract, not from this email. Ask them to read you the account number and the account holder name.', from: 'From', ex: '{d} is the website we hold for {dv}.', lk: '{d} looks like {o}, the website we hold for {dv}.', free: 'Sent from a free email account ({d}). Developers normally send payment instructions from their own domain.', nr: '{d} is not among the developer websites in our records.', sh: '{d} is a portal, agency or news site in our sources, not a developer.', idn: '{d} uses non-Latin letters that can imitate familiar names.', rt: 'Replies go to {b}, a different domain from the sender.', mb: 'Mailed-by {m}, not the sender domain.', sb: 'Signed-by {s}, not the sender domain.', w_change: 'Says the bank details changed', w_old: 'Says the old account is blocked or under audit', w_urgent: 'Pressure to pay quickly', w_secret: 'Asks not to call or to keep it private', age_new: 'Domain registered {age} ago ({date}).', age: 'Domain registered {date}.', nodm: 'No DMARC protection on {d}: fake emails from this domain are not blocked.', dn: 'Details hidden: open the small arrow under the sender to include Reply-To, mailed-by and signed-by.', full: 'Full check with all headers', full_p: 'In Gmail: More (three dots) > Show original > Copy to clipboard, then paste it on the page.', priv: 'The email stays in your browser. Only the sender domain is sent to kolaboro.com, for its public DNS and registration date.', close: 'Close', min: 'Minimise', pill: 'Payment email check', d: '{n} days', m: '{n} months', y: '{n} years' },
    es: { title: 'Comprobar correo de pago', why: 'Este correo menciona un pago o datos bancarios.', call_t: 'Antes de pagar, llame a la promotora', call_p: 'Use un número de su web oficial o de su contrato, no de este correo. Pida que le lean el número de cuenta y el titular.', from: 'De', ex: '{d} es la web que tenemos de {dv}.', lk: '{d} se parece a {o}, la web que tenemos de {dv}.', free: 'Enviado desde una cuenta gratuita ({d}). Las promotoras suelen enviar instrucciones de pago desde su propio dominio.', nr: '{d} no está entre las webs de promotoras de nuestros registros.', sh: '{d} es un portal, agencia o medio de nuestras fuentes, no una promotora.', idn: '{d} usa letras no latinas que pueden imitar nombres conocidos.', rt: 'Las respuestas van a {b}, otro dominio distinto del remitente.', mb: 'Enviado por {m}, no el dominio del remitente.', sb: 'Firmado por {s}, no el dominio del remitente.', w_change: 'Dice que cambiaron los datos bancarios', w_old: 'Dice que la cuenta anterior está bloqueada o en auditoría', w_urgent: 'Presión para pagar rápido', w_secret: 'Pide no llamar o mantenerlo en privado', age_new: 'Dominio registrado hace {age} ({date}).', age: 'Dominio registrado el {date}.', nodm: 'Sin protección DMARC en {d}: no se bloquean correos falsos de este dominio.', dn: 'Detalles ocultos: abra la flecha bajo el remitente para incluir Responder a, enviado por y firmado por.', full: 'Comprobación completa con todos los encabezados', full_p: 'En Gmail: Más (tres puntos) > Mostrar original > Copiar al portapapeles, y péguelo en la página.', priv: 'El correo se queda en su navegador. Solo se envía a kolaboro.com el dominio del remitente, para su DNS público y fecha de registro.', close: 'Cerrar', min: 'Minimizar', pill: 'Comprobar correo de pago', d: '{n} días', m: '{n} meses', y: '{n} años' },
    de: { title: 'Zahlungs-E-Mail prüfen', why: 'Diese E-Mail erwähnt eine Zahlung oder Bankdaten.', call_t: 'Vor dem Bezahlen den Bauträger anrufen', call_p: 'Nutzen Sie eine Nummer von der offiziellen Website oder aus Ihrem Vertrag, nicht aus dieser E-Mail. Lassen Sie sich Kontonummer und Kontoinhaber vorlesen.', from: 'Von', ex: '{d} ist die Website, die wir für {dv} führen.', lk: '{d} ähnelt {o}, der Website, die wir für {dv} führen.', free: 'Von einem kostenlosen E-Mail-Konto gesendet ({d}). Bauträger senden Zahlungsanweisungen normalerweise von der eigenen Domain.', nr: '{d} ist keine Bauträger-Website in unseren Daten.', sh: '{d} ist ein Portal, Makler oder Medium aus unseren Quellen, kein Bauträger.', idn: '{d} nutzt nicht-lateinische Buchstaben, die bekannte Namen nachahmen können.', rt: 'Antworten gehen an {b}, eine andere Domain als der Absender.', mb: 'Gesendet über {m}, nicht die Absenderdomain.', sb: 'Signiert von {s}, nicht die Absenderdomain.', w_change: 'Sagt, die Bankverbindung habe sich geändert', w_old: 'Sagt, das alte Konto sei gesperrt oder in Prüfung', w_urgent: 'Druck, schnell zu zahlen', w_secret: 'Bittet, nicht anzurufen oder es vertraulich zu halten', age_new: 'Domain vor {age} registriert ({date}).', age: 'Domain registriert am {date}.', nodm: 'Kein DMARC-Schutz für {d}: gefälschte E-Mails dieser Domain werden nicht blockiert.', dn: 'Details verborgen: Öffnen Sie den kleinen Pfeil unter dem Absender, um Antwort an, gesendet über und signiert von einzubeziehen.', full: 'Vollständige Prüfung mit allen Kopfzeilen', full_p: 'In Gmail: Mehr (drei Punkte) > Original anzeigen > In Zwischenablage kopieren, dann auf der Seite einfügen.', priv: 'Die E-Mail bleibt in Ihrem Browser. Nur die Absenderdomain geht an kolaboro.com, für öffentliches DNS und Registrierungsdatum.', close: 'Schließen', min: 'Minimieren', pill: 'Zahlungs-E-Mail prüfen', d: '{n} Tagen', m: '{n} Monaten', y: '{n} Jahren' },
    fr: { title: 'Vérifier un e-mail de paiement', why: 'Cet e-mail parle d\'un paiement ou de coordonnées bancaires.', call_t: 'Avant de payer, appelez le promoteur', call_p: 'Utilisez un numéro de son site officiel ou de votre contrat, pas de cet e-mail. Demandez-lui de vous lire le numéro de compte et le titulaire.', from: 'De', ex: '{d} est le site que nous avons pour {dv}.', lk: '{d} ressemble à {o}, le site que nous avons pour {dv}.', free: 'Envoyé depuis une messagerie gratuite ({d}). Les promoteurs envoient normalement les instructions de paiement depuis leur propre domaine.', nr: '{d} ne fait pas partie des sites de promoteurs de nos données.', sh: '{d} est un portail, une agence ou un média de nos sources, pas un promoteur.', idn: '{d} utilise des lettres non latines qui peuvent imiter des noms connus.', rt: 'Les réponses vont à {b}, un autre domaine que l\'expéditeur.', mb: 'Envoyé par {m}, pas le domaine de l\'expéditeur.', sb: 'Signé par {s}, pas le domaine de l\'expéditeur.', w_change: 'Dit que les coordonnées bancaires ont changé', w_old: 'Dit que l\'ancien compte est bloqué ou en audit', w_urgent: 'Pression pour payer vite', w_secret: 'Demande de ne pas appeler ou de rester discret', age_new: 'Domaine enregistré il y a {age} ({date}).', age: 'Domaine enregistré le {date}.', nodm: 'Pas de protection DMARC sur {d} : les faux e-mails de ce domaine ne sont pas bloqués.', dn: 'Détails masqués : ouvrez la petite flèche sous l\'expéditeur pour inclure Répondre à, envoyé par et signé par.', full: 'Vérification complète avec tous les en-têtes', full_p: 'Dans Gmail : Plus (trois points) > Afficher l\'original > Copier dans le presse-papiers, puis collez-le sur la page.', priv: 'L\'e-mail reste dans votre navigateur. Seul le domaine de l\'expéditeur est envoyé à kolaboro.com, pour son DNS public et sa date d\'enregistrement.', close: 'Fermer', min: 'Réduire', pill: 'Vérifier un e-mail de paiement', d: '{n} jours', m: '{n} mois', y: '{n} ans' },
    nl: { title: 'Betaalmail controleren', why: 'Deze e-mail noemt een betaling of bankgegevens.', call_t: 'Bel de ontwikkelaar voor u betaalt', call_p: 'Gebruik een nummer van de officiële website of uit uw contract, niet uit deze e-mail. Laat het rekeningnummer en de rekeninghouder voorlezen.', from: 'Van', ex: '{d} is de website die we voor {dv} hebben.', lk: '{d} lijkt op {o}, de website die we voor {dv} hebben.', free: 'Verstuurd vanaf een gratis e-mailaccount ({d}). Ontwikkelaars sturen betaalinstructies normaal vanaf hun eigen domein.', nr: '{d} staat niet tussen de ontwikkelaarswebsites in onze gegevens.', sh: '{d} is een portaal, makelaar of nieuwssite uit onze bronnen, geen ontwikkelaar.', idn: '{d} gebruikt niet-Latijnse letters die bekende namen kunnen nabootsen.', rt: 'Antwoorden gaan naar {b}, een ander domein dan de afzender.', mb: 'Verzonden via {m}, niet het afzenderdomein.', sb: 'Ondertekend door {s}, niet het afzenderdomein.', w_change: 'Zegt dat de bankgegevens zijn gewijzigd', w_old: 'Zegt dat de oude rekening geblokkeerd of in controle is', w_urgent: 'Druk om snel te betalen', w_secret: 'Vraagt niet te bellen of het geheim te houden', age_new: 'Domein {age} geleden geregistreerd ({date}).', age: 'Domein geregistreerd op {date}.', nodm: 'Geen DMARC-bescherming op {d}: valse e-mails van dit domein worden niet tegengehouden.', dn: 'Details verborgen: open het pijltje onder de afzender om Antwoord naar, verzonden via en ondertekend door mee te nemen.', full: 'Volledige controle met alle koppen', full_p: 'In Gmail: Meer (drie puntjes) > Origineel weergeven > Kopiëren naar klembord, en plak het op de pagina.', priv: 'De e-mail blijft in uw browser. Alleen het afzenderdomein gaat naar kolaboro.com, voor openbare DNS en registratiedatum.', close: 'Sluiten', min: 'Minimaliseren', pill: 'Betaalmail controleren', d: '{n} dagen', m: '{n} maanden', y: '{n} jaar' },
    ru: { title: 'Проверка платёжного письма', why: 'В письме говорится об оплате или банковских реквизитах.', call_t: 'Перед оплатой позвоните застройщику', call_p: 'Номер берите с официального сайта или из договора, не из этого письма. Попросите продиктовать номер счёта и владельца.', from: 'От', ex: '{d} это сайт, указанный у нас для {dv}.', lk: '{d} похож на {o}, сайт, указанный у нас для {dv}.', free: 'Отправлено с бесплатной почты ({d}). Застройщики обычно присылают платёжные инструкции со своего домена.', nr: '{d} нет среди сайтов застройщиков в наших данных.', sh: '{d} это портал, агентство или СМИ из наших источников, а не застройщик.', idn: '{d} содержит нелатинские буквы, которые могут имитировать знакомые названия.', rt: 'Ответы уходят на {b}, другой домен, чем у отправителя.', mb: 'Отправлено через {m}, не домен отправителя.', sb: 'Подписано {s}, не домен отправителя.', w_change: 'Сообщает о смене реквизитов', w_old: 'Сообщает, что старый счёт заблокирован или на проверке', w_urgent: 'Давление заплатить быстро', w_secret: 'Просит не звонить или держать в тайне', age_new: 'Домен зарегистрирован {age} назад ({date}).', age: 'Домен зарегистрирован {date}.', nodm: 'У {d} нет защиты DMARC: поддельные письма с этого домена не блокируются.', dn: 'Детали скрыты: откройте стрелку под отправителем, чтобы учесть Reply-To, «отправлено через» и «подписано».', full: 'Полная проверка со всеми заголовками', full_p: 'В Gmail: Ещё (три точки) > Показать оригинал > Копировать в буфер обмена, затем вставьте на странице.', priv: 'Письмо остаётся в вашем браузере. На kolaboro.com уходит только домен отправителя, для публичного DNS и даты регистрации.', close: 'Закрыть', min: 'Свернуть', pill: 'Проверка платёжного письма', d: '{n} дн.', m: '{n} мес.', y: '{n} г.' },
    zh: { title: '付款邮件检查', why: '这封邮件提到付款或银行信息。', call_t: '付款前，先给开发商打电话', call_p: '使用其官网或合同上的号码，不要用这封邮件里的。请对方念出账号和账户名。', from: '发件人', ex: '{d} 是我们记录的 {dv} 网站。', lk: '{d} 与 {o} 相似，后者是我们记录的 {dv} 网站。', free: '来自免费邮箱（{d}）。开发商通常用自己的域名发送付款指示。', nr: '{d} 不在我们记录的开发商网站中。', sh: '{d} 是我们来源中的门户、中介或新闻网站，不是开发商。', idn: '{d} 使用了可模仿熟悉名称的非拉丁字母。', rt: '回复会发到 {b}，与发件人域名不同。', mb: '邮件由 {m} 发送，不是发件人域名。', sb: '由 {s} 签名，不是发件人域名。', w_change: '称银行信息已变更', w_old: '称旧账户被冻结或审计中', w_urgent: '催促尽快付款', w_secret: '要求不要打电话或保密', age_new: '域名注册于 {age}前（{date}）。', age: '域名注册于 {date}。', nodm: '{d} 没有 DMARC 保护：伪造此域名的邮件不会被拦截。', dn: '详细信息已隐藏：点开发件人下方的小箭头，可加入回复地址、发送方和签名方。', full: '用全部邮件头完整检查', full_p: '在 Gmail 中：更多（三个点）> 显示原始邮件 > 复制到剪贴板，然后粘贴到页面上。', priv: '邮件留在您的浏览器中。只有发件人域名会发送到 kolaboro.com，用于查询公共 DNS 和注册日期。', close: '关闭', min: '最小化', pill: '付款邮件检查', d: '{n} 天', m: '{n} 个月', y: '{n} 年' },
    ar: { title: 'فحص رسالة الدفع', why: 'تذكر هذه الرسالة دفعة أو بيانات مصرفية.', call_t: 'قبل الدفع، اتصل بالمطوّر', call_p: 'استخدم رقماً من موقعه الرسمي أو من عقدك، لا من هذه الرسالة. اطلب أن يقرأ لك رقم الحساب واسم صاحبه.', from: 'من', ex: '{d} هو الموقع المسجل لدينا لـ {dv}.', lk: '{d} يشبه {o}، الموقع المسجل لدينا لـ {dv}.', free: 'أُرسلت من بريد مجاني ({d}). يرسل المطوّرون تعليمات الدفع عادة من نطاقهم الخاص.', nr: '{d} ليس من مواقع المطوّرين في سجلاتنا.', sh: '{d} بوابة أو وكالة أو موقع أخبار من مصادرنا، وليس مطوّراً.', idn: '{d} يستخدم حروفاً غير لاتينية قد تقلّد أسماء مألوفة.', rt: 'الردود تذهب إلى {b}، وهو نطاق مختلف عن المرسل.', mb: 'أُرسلت عبر {m}، وليس نطاق المرسل.', sb: 'موقّعة من {s}، وليس نطاق المرسل.', w_change: 'تقول إن البيانات المصرفية تغيّرت', w_old: 'تقول إن الحساب القديم مجمّد أو قيد التدقيق', w_urgent: 'ضغط للدفع بسرعة', w_secret: 'تطلب عدم الاتصال أو إبقاء الأمر سراً', age_new: 'سُجّل النطاق قبل {age} ({date}).', age: 'سُجّل النطاق في {date}.', nodm: 'لا حماية DMARC على {d}: الرسائل المزيفة من هذا النطاق لا تُحجب.', dn: 'التفاصيل مخفية: افتح السهم الصغير تحت المرسل لتضمين الرد إلى والمرسَل عبر والموقّع من.', full: 'فحص كامل بكل الرؤوس', full_p: 'في Gmail: المزيد (النقاط الثلاث) > عرض الرسالة الأصلية > نسخ إلى الحافظة، ثم الصقها في الصفحة.', priv: 'تبقى الرسالة في متصفحك. يُرسل نطاق المرسل وحده إلى kolaboro.com لقراءة DNS العام وتاريخ التسجيل.', close: 'إغلاق', min: 'تصغير', pill: 'فحص رسالة الدفع', d: '{n} يوماً', m: '{n} شهراً', y: '{n} سنة' }
  };
  var lang = KX.uiLang(), LOC = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[lang] || 'en-GB';
  function t(k, v) { var s = (MT[lang] && MT[lang][k]) || MT.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s; }
  var CSS = KX.CSS + '.ml{display:grid;gap:8px;list-style:none}.ml li{display:grid;grid-template-columns:auto 1fr;gap:8px;font-size:14px;align-items:start}' +
    '.dot{width:10px;height:10px;border-radius:50%;margin-top:6px;background:var(--muted)}.dot.w{background:#C27C0E}.dot.o{background:var(--ok)}' +
    '.call{background:var(--warnbg);color:var(--ink);border-radius:10px;padding:10px 12px;font-size:14px}.call b{display:block;margin-bottom:2px;font-weight:700;color:var(--ink)}' +
    '.who{font-size:14px;color:var(--ink);overflow-wrap:anywhere}.who small{display:block;color:var(--muted);font-size:13px}';
  var hostEl = null, shadow = null, slot = null, LIST = null, DOMS = {}, last = '', hidden = {}, mini = {}, cur = null;

  function bg(m) { return new Promise(function (ok) { try { chrome.runtime.sendMessage(m, function (r) { ok(chrome.runtime.lastError ? null : r); }); } catch (e) { ok(null); } }); }
  function list() { if (LIST) return Promise.resolve(LIST); return bg({ t: 'kx-ml' }).then(function (r) { if (r && r.domains) LIST = r; return LIST; }); }
  function domFacts(h) { if (DOMS[h]) return Promise.resolve(DOMS[h]); return bg({ t: 'kx-md', d: h }).then(function (r) { if (r && !r.error) DOMS[h] = r; return r; }); }
  function age(days) { return days < 62 ? t('d', { n: days }) : days < 730 ? t('m', { n: Math.round(days / 30.4) }) : t('y', { n: Math.floor(days / 365.25) }); }
  function fdate(s) { try { return new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(s)); } catch (e) { return String(s).slice(0, 10); } }

  // ------------------------------------------------------------------ read the open email from Gmail's page
  function visible(e) { return !!(e && (e.offsetWidth || e.offsetHeight || e.getClientRects().length)); }
  function openMail() {
    var bodies = [].filter.call(document.querySelectorAll('div.a3s'), visible);
    if (!bodies.length) return null;
    var body = bodies[bodies.length - 1], box = body.closest('div.adn') || body.closest('[role="listitem"]') || document;
    var s = box.querySelector('span.gD[email]') || box.querySelector('span[email]');
    if (!s) return null;
    var o = { name: (s.getAttribute('name') || s.textContent || '').trim(), email: (s.getAttribute('email') || '').trim().toLowerCase(), text: (body.innerText || '').slice(0, 60000), rows: {}, links: [] };
    [].forEach.call(body.querySelectorAll('a[href]'), function (a) { o.links.push(a.getAttribute('href')); });
    [].forEach.call(document.querySelectorAll('tr'), function (tr) {   // the details table under the sender (only when opened)
      var c = tr.cells; if (!c || c.length < 2) return;
      var k = (c[0].textContent || '').trim().toLowerCase().replace(/:$/, '');
      if (/^(reply-to|reply to|mailed-by|signed-by)$/.test(k)) o.rows[k.replace(' ', '-')] = (c[1].textContent || '').trim();
    });
    return o;
  }
  function hostOf(s) { var m = String(s || '').match(/@([a-z0-9.-]+\.[a-z0-9-]{2,63})/i) || String(s || '').match(/^([a-z0-9.-]+\.[a-z0-9-]{2,63})$/i); return m ? m[1].toLowerCase() : null; }

  // ------------------------------------------------------------------ panel
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function mount() {
    if (hostEl && document.documentElement.contains(hostEl)) return;
    hostEl = document.createElement('div'); hostEl.id = 'kolaboro-mail';
    hostEl.style.cssText = 'all:initial;position:fixed;inset-inline-end:16px;bottom:16px;z-index:2147483646;';
    shadow = hostEl.attachShadow({ mode: 'closed' });
    var css = document.createElement('style'); css.textContent = CSS; shadow.appendChild(css);
    slot = document.createElement('div'); shadow.appendChild(slot);
    document.documentElement.appendChild(hostEl);
  }
  function unmount() { if (hostEl) { hostEl.remove(); hostEl = null; } }
  function draw() {
    if (!cur || hidden[cur.key]) { unmount(); return; }
    mount(); while (slot.firstChild) slot.removeChild(slot.firstChild);
    var root = el('div', 'kx'); root.setAttribute('role', 'complementary'); root.setAttribute('aria-label', t('title')); root.lang = lang; if (lang === 'ar') root.dir = 'rtl';
    if (mini[cur.key]) {
      root.style.cssText = 'all:unset';
      var p = el('button', 'pill', t('pill') + (cur.warn ? ' (' + cur.warn + ')' : '')); p.type = 'button';
      p.addEventListener('click', function () { mini[cur.key] = false; draw(); });
      root.appendChild(p); slot.appendChild(root); return;
    }
    var hd = el('div', 'hd'); hd.appendChild(el('span', 'bn', t('title')));
    var ib = el('div', 'ib'), bm = el('button', null, '–'), bc = el('button', null, '×');
    bm.type = bc.type = 'button'; bm.setAttribute('aria-label', t('min')); bc.setAttribute('aria-label', t('close'));
    bm.addEventListener('click', function () { mini[cur.key] = true; draw(); }); bc.addEventListener('click', function () { hidden[cur.key] = true; unmount(); });
    ib.appendChild(bm); ib.appendChild(bc); hd.appendChild(ib); root.appendChild(hd);
    var bd = el('div', 'bd');
    bd.appendChild(el('p', 'how', t('why')));
    var call = el('div', 'call'); call.appendChild(el('b', null, t('call_t'))); call.appendChild(document.createTextNode(t('call_p'))); bd.appendChild(call);
    var who = el('p', 'who'); who.appendChild(el('small', null, t('from'))); who.appendChild(document.createTextNode((cur.name ? cur.name + ' ' : '') + '<' + cur.email + '>')); bd.appendChild(who);
    var ul = el('ul', 'ml');
    cur.items.forEach(function (it) { var li = el('li'); li.appendChild(el('span', 'dot ' + (it[0] === 'w' ? 'w' : it[0] === 'o' ? 'o' : ''))); li.appendChild(el('span', null, it[1])); ul.appendChild(li); });
    bd.appendChild(ul);
    var lk = el('div', 'xr');
    var a = el('a', 'sec2', t('full')); a.href = KX.ORIGIN + '/tools/payment-email-check/' + (lang !== 'en' ? '?lang=' + lang : ''); a.target = '_blank'; a.rel = 'noopener';
    lk.appendChild(a); lk.appendChild(el('p', 'note', t('full_p'))); lk.appendChild(el('p', 'note', t('priv')));
    bd.appendChild(lk); root.appendChild(bd); slot.appendChild(root);
  }
  function analyse(m, L) {
    var items = [], C = KPEC.compare(hostOf(m.email), L), d = C.d;
    if (C.idn) items.push(['w', t('idn', { d: C.host })]);
    if (C.exact) items.push(['o', t('ex', { d: d, dv: C.exact.dv || C.exact.pn || d })]);
    else if (C.look.length) C.look.forEach(function (l) { items.push(['w', t('lk', { d: d, o: l.o.d, dv: l.o.dv || l.o.pn || l.o.d })]); });
    else if (C.free) items.push(['w', t('free', { d: d })]);
    else if (C.shared) items.push(['i', t('sh', { d: d })]);
    else if (L) items.push(['i', t('nr', { d: d })]);
    var rt = hostOf(m.rows['reply-to']), mb = hostOf(m.rows['mailed-by']), sb = hostOf(m.rows['signed-by']);
    if (rt && KPEC.regDomain(rt) !== d) items.push(['w', t('rt', { b: KPEC.regDomain(rt) })]);
    if (mb && KPEC.regDomain(mb) !== d) items.push(['i', t('mb', { m: mb })]);
    if (sb && KPEC.regDomain(sb) !== d) items.push(['w', t('sb', { s: sb })]);
    (m.links || []).forEach(function (h) { var x = String(h).match(/^https?:\/\/([^\/:?#]+)/i); if (!x) return; var c = KPEC.compare(x[1], L); if (!c.exact && c.look.length && c.d !== d && items.length < 9) items.push(['w', t('lk', { d: c.d, o: c.look[0].o.d, dv: c.look[0].o.dv || c.look[0].o.d })]); });
    var W = KPEC.wording(m.text);
    ['change', 'old', 'urgent', 'secret'].forEach(function (k) { if (W.hits[k]) items.push(['w', t('w_' + k) + ': "' + W.hits[k][0] + '"']); });
    if (!m.rows['mailed-by'] && !m.rows['signed-by'] && !m.rows['reply-to']) items.push(['i', t('dn')]);
    return { items: items, C: C, W: W };
  }
  function asksPayment(text) { var W = KPEC.wording(text); return !!(W.hits.change || W.hits.old || W.hits.pay) || /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}/.test(text); }
  function tick() {
    if (document.visibilityState !== 'visible') return;
    var m = openMail();
    if (!m || !m.email) { if (cur) { cur = null; draw(); } last = ''; return; }
    var key = m.email + '|' + m.text.length + '|' + m.text.slice(0, 120) + '|' + Object.keys(m.rows).join(',') + (m.rows['reply-to'] || '');
    if (key === last) return; last = key;
    if (!asksPayment(m.text)) { cur = null; draw(); return; }
    var mk = m.email + '|' + m.text.slice(0, 120);
    list().then(function (L) {
      var r = analyse(m, L);
      cur = { key: mk, name: m.name, email: m.email, items: r.items, warn: r.items.filter(function (x) { return x[0] === 'w'; }).length };
      if (mini[mk] == null && !r.items.some(function (x) { return x[0] === 'w'; })) mini[mk] = true;   // nothing stands out: a small button only
      draw();
      var h = hostOf(m.email);
      if (h && !r.C.free) domFacts(h).then(function (j) {
        if (!j || !cur || cur.key !== mk) return;
        var rd = j.rdap || {};
        if (rd.found && rd.registered) cur.items.push([rd.age_days < 365 ? 'w' : 'i', rd.age_days < 365 ? t('age_new', { age: age(rd.age_days), date: fdate(rd.registered) }) : t('age', { date: fdate(rd.registered) })]);
        if (j.dmarc && j.dmarc.lookup === 'ok' && (!j.dmarc.record || j.dmarc.p === 'none' || !j.dmarc.p)) cur.items.push(['i', t('nodm', { d: j.org || h })]);
        cur.warn = cur.items.filter(function (x) { return x[0] === 'w'; }).length;
        draw();
      });
    });
  }
  setInterval(tick, 1500); tick();
})();
