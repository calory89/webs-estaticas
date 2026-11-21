/* Kolaboro structured correction preview (n34b, 21 Nov 2026), on /corrections/ (8 languages) and /developers/reply/.
   Pick the project, type the correct value next to any recorded fact, and see a word-by-word diff of what you propose against what we
   hold and its source. Nothing is stored or sent by this script: on /corrections/ the result opens in your own email program (the
   existing correction flow, hello@kolaboro.com); on /developers/reply/ it is added to the reply text of the existing reply form. */
(function () {
  var d = document, LG = (d.documentElement.lang || 'en').slice(0, 2), REPLY = /\/developers\/reply\/$/.test(location.pathname);
  var S = {
    en: { h: 'Propose a correction, field by field', lead: 'Type the correct value next to the fact we hold. You see exactly what changes before anything leaves your computer.', id: 'Project id or name', load: 'Show the recorded facts', field: 'Fact', rec: 'On record', src: 'Source', yours: 'Correct value', ev: 'Evidence (link or document name)', diff: 'Your proposal against the record', nodiff: 'Type a correct value in at least one field to see the difference.', mail: 'Open my email with these corrections', add: 'Add to my reply', added: 'Added to your reply below. Check it, then send it for review.', full: 'The reply is full (3,000 characters). Shorten it first.', nf: 'No project with this id or name.', np: 'not published', subj: 'Correction request {id}', note: 'Nothing is stored or sent by this preview. The email opens in your own program, addressed to hello@kolaboro.com; we answer within 10 working days.', noter: 'Nothing is stored by this preview: it only writes into the reply text, which is sent when you press Send for review.', f: { permit: 'Permit or licence number', handover: 'Handover date', stage: 'Stage', price: 'Price from', plan: 'Payment plan', company: 'Developer legal name', area: 'Location', web: 'Project website' } },
    es: { h: 'Proponer una corrección, dato a dato', lead: 'Escribe el valor correcto junto al dato que tenemos. Ves exactamente qué cambia antes de que nada salga de tu ordenador.', id: 'Id o nombre del proyecto', load: 'Ver los datos registrados', field: 'Dato', rec: 'Registrado', src: 'Fuente', yours: 'Valor correcto', ev: 'Prueba (enlace o nombre del documento)', diff: 'Tu propuesta frente al registro', nodiff: 'Escribe un valor correcto en al menos un campo para ver la diferencia.', mail: 'Abrir mi email con estas correcciones', add: 'Añadir a mi respuesta', added: 'Añadido a tu respuesta abajo. Revísala y envíala.', full: 'La respuesta está llena (3.000 caracteres). Acórtala primero.', nf: 'Ningún proyecto con ese id o nombre.', np: 'no publicado', subj: 'Solicitud de corrección {id}', note: 'Esta vista previa no guarda ni envía nada. El email se abre en tu programa, dirigido a hello@kolaboro.com; respondemos en 10 días laborables.', noter: 'Esta vista previa no guarda nada: solo escribe en el texto de la respuesta, que se envía al pulsar enviar.', f: { permit: 'Número de licencia o permiso', handover: 'Fecha de entrega', stage: 'Fase', price: 'Precio desde', plan: 'Plan de pagos', company: 'Nombre legal del promotor', area: 'Ubicación', web: 'Web del proyecto' } },
    fr: { h: 'Proposer une correction, champ par champ', lead: 'Saisissez la valeur exacte à côté du fait enregistré. Vous voyez exactement ce qui change avant que rien ne quitte votre ordinateur.', id: 'Identifiant ou nom du projet', load: 'Afficher les faits enregistrés', field: 'Fait', rec: 'Enregistré', src: 'Source', yours: 'Valeur exacte', ev: 'Preuve (lien ou nom du document)', diff: 'Votre proposition face au dossier', nodiff: 'Saisissez une valeur exacte dans au moins un champ pour voir la différence.', mail: 'Ouvrir ma messagerie avec ces corrections', add: 'Ajouter à ma réponse', added: 'Ajouté à votre réponse ci-dessous. Relisez-la puis envoyez-la.', full: 'La réponse est pleine (3 000 caractères). Raccourcissez-la d\'abord.', nf: 'Aucun projet avec cet identifiant ou ce nom.', np: 'non publié', subj: 'Demande de correction {id}', note: 'Cet aperçu n\'enregistre et n\'envoie rien. L\'e-mail s\'ouvre dans votre logiciel, adressé à hello@kolaboro.com ; nous répondons sous 10 jours ouvrés.', noter: 'Cet aperçu n\'enregistre rien : il écrit seulement dans le texte de la réponse, envoyé quand vous validez.', f: { permit: 'Numéro de permis ou de licence', handover: 'Date de livraison', stage: 'Stade', price: 'Prix à partir de', plan: 'Échéancier', company: 'Raison sociale du promoteur', area: 'Emplacement', web: 'Site du projet' } },
    de: { h: 'Korrektur vorschlagen, Feld für Feld', lead: 'Tragen Sie neben der erfassten Angabe den richtigen Wert ein. Sie sehen genau, was sich ändert, bevor etwas Ihren Computer verlässt.', id: 'Projekt-ID oder Name', load: 'Erfasste Angaben zeigen', field: 'Angabe', rec: 'Erfasst', src: 'Quelle', yours: 'Richtiger Wert', ev: 'Beleg (Link oder Dokumentname)', diff: 'Ihr Vorschlag gegenüber dem Datensatz', nodiff: 'Tragen Sie in mindestens einem Feld einen richtigen Wert ein, um den Unterschied zu sehen.', mail: 'E-Mail mit diesen Korrekturen öffnen', add: 'Zu meiner Antwort hinzufügen', added: 'Unten zu Ihrer Antwort hinzugefügt. Prüfen und dann absenden.', full: 'Die Antwort ist voll (3.000 Zeichen). Bitte zuerst kürzen.', nf: 'Kein Projekt mit dieser ID oder diesem Namen.', np: 'nicht veröffentlicht', subj: 'Korrekturanfrage {id}', note: 'Diese Vorschau speichert und sendet nichts. Die E-Mail öffnet sich in Ihrem Programm, an hello@kolaboro.com; wir antworten innerhalb von 10 Werktagen.', noter: 'Diese Vorschau speichert nichts: Sie schreibt nur in den Antworttext, der beim Absenden übermittelt wird.', f: { permit: 'Genehmigungs- oder Lizenznummer', handover: 'Übergabetermin', stage: 'Stand', price: 'Preis ab', plan: 'Zahlungsplan', company: 'Rechtlicher Name des Bauträgers', area: 'Lage', web: 'Projekt-Website' } },
    nl: { h: 'Een correctie voorstellen, veld voor veld', lead: 'Typ de juiste waarde naast het gegeven dat wij hebben. U ziet precies wat er verandert voordat er iets uw computer verlaat.', id: 'Project-id of naam', load: 'Vastgelegde gegevens tonen', field: 'Gegeven', rec: 'Vastgelegd', src: 'Bron', yours: 'Juiste waarde', ev: 'Bewijs (link of documentnaam)', diff: 'Uw voorstel tegenover het dossier', nodiff: 'Typ in minstens één veld een juiste waarde om het verschil te zien.', mail: 'Mijn e-mail openen met deze correcties', add: 'Toevoegen aan mijn reactie', added: 'Hieronder aan uw reactie toegevoegd. Controleer en verstuur.', full: 'De reactie is vol (3.000 tekens). Maak haar eerst korter.', nf: 'Geen project met deze id of naam.', np: 'niet gepubliceerd', subj: 'Correctieverzoek {id}', note: 'Deze voorvertoning bewaart en verstuurt niets. De e-mail opent in uw eigen programma, aan hello@kolaboro.com; we antwoorden binnen 10 werkdagen.', noter: 'Deze voorvertoning bewaart niets: ze schrijft alleen in de reactietekst, die wordt verstuurd als u op versturen drukt.', f: { permit: 'Vergunnings- of licentienummer', handover: 'Opleverdatum', stage: 'Fase', price: 'Prijs vanaf', plan: 'Betalingsschema', company: 'Juridische naam ontwikkelaar', area: 'Locatie', web: 'Projectwebsite' } },
    ru: { h: 'Предложить исправление по полям', lead: 'Введите верное значение рядом с записанным фактом. Вы увидите, что именно меняется, до того как что-либо покинет ваш компьютер.', id: 'ID или название проекта', load: 'Показать записанные факты', field: 'Факт', rec: 'В записи', src: 'Источник', yours: 'Верное значение', ev: 'Подтверждение (ссылка или название документа)', diff: 'Ваше предложение против записи', nodiff: 'Введите верное значение хотя бы в одно поле, чтобы увидеть разницу.', mail: 'Открыть почту с этими исправлениями', add: 'Добавить в мой ответ', added: 'Добавлено в ваш ответ ниже. Проверьте и отправьте.', full: 'Ответ заполнен (3000 символов). Сначала сократите его.', nf: 'Нет проекта с таким ID или названием.', np: 'не опубликовано', subj: 'Запрос на исправление {id}', note: 'Этот предпросмотр ничего не хранит и не отправляет. Письмо откроется в вашей программе на адрес hello@kolaboro.com; мы отвечаем в течение 10 рабочих дней.', noter: 'Предпросмотр ничего не хранит: он только пишет в текст ответа, который отправляется при нажатии кнопки.', f: { permit: 'Номер разрешения или лицензии', handover: 'Дата сдачи', stage: 'Этап', price: 'Цена от', plan: 'График платежей', company: 'Юридическое название застройщика', area: 'Расположение', web: 'Сайт проекта' } },
    zh: { h: '逐项提出更正', lead: '在我们记录的事实旁输入正确的值。在任何内容离开您的电脑之前，您可以准确看到哪些地方改变。', id: '项目编号或名称', load: '显示记录的事实', field: '事实', rec: '记录值', src: '来源', yours: '正确值', ev: '证据（链接或文件名）', diff: '您的提议与记录的对比', nodiff: '至少在一个字段中输入正确值即可看到差异。', mail: '用这些更正打开我的邮箱', add: '添加到我的回复', added: '已添加到下方的回复中。请检查后提交。', full: '回复已满（3,000 字符）。请先缩短。', nf: '没有该编号或名称的项目。', np: '未公布', subj: '更正请求 {id}', note: '此预览不存储也不发送任何内容。邮件在您自己的邮件程序中打开，收件人为 hello@kolaboro.com；我们在 10 个工作日内回复。', noter: '此预览不存储任何内容：它只写入回复文本，您点击提交时才会发送。', f: { permit: '许可证或执照编号', handover: '交房日期', stage: '阶段', price: '起价', plan: '付款计划', company: '开发商法定名称', area: '位置', web: '项目网站' } },
    ar: { h: 'اقترح تصحيحًا حقلًا بحقل', lead: 'اكتب القيمة الصحيحة بجانب المعلومة المسجّلة لدينا. ترى بالضبط ما يتغيّر قبل أن يغادر أي شيء جهازك.', id: 'رقم المشروع أو اسمه', load: 'عرض المعلومات المسجّلة', field: 'المعلومة', rec: 'المسجّل', src: 'المصدر', yours: 'القيمة الصحيحة', ev: 'الدليل (رابط أو اسم المستند)', diff: 'اقتراحك مقابل السجل', nodiff: 'اكتب قيمة صحيحة في حقل واحد على الأقل لترى الفرق.', mail: 'افتح بريدي بهذه التصحيحات', add: 'أضف إلى ردّي', added: 'أُضيف إلى ردّك أدناه. راجعه ثم أرسله.', full: 'الرد ممتلئ (3000 حرف). اختصره أولًا.', nf: 'لا مشروع بهذا الرقم أو الاسم.', np: 'غير منشور', subj: 'طلب تصحيح {id}', note: 'هذه المعاينة لا تحفظ ولا ترسل شيئًا. يُفتح البريد في برنامجك موجّهًا إلى hello@kolaboro.com؛ نردّ خلال 10 أيام عمل.', noter: 'هذه المعاينة لا تحفظ شيئًا: تكتب فقط في نص الرد الذي يُرسل عند الضغط على الإرسال.', f: { permit: 'رقم الترخيص أو الرخصة', handover: 'موعد التسليم', stage: 'المرحلة', price: 'السعر ابتداءً من', plan: 'خطة الدفع', company: 'الاسم القانوني للمطوّر', area: 'الموقع', web: 'موقع المشروع' } }
  };
  var T = S[LG] || S.en;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var anchor = REPLY ? (d.querySelector('#drf .dr-step:nth-of-type(3)') || d.getElementById('drf')) : d.getElementById('request');
  if (!anchor) return;
  var box = d.createElement('section'); box.className = 'kfix'; box.setAttribute('aria-labelledby', 'kfix-h'); if (LG === 'ar') box.dir = 'rtl';
  box.style.cssText = 'border:1px solid var(--k-line,#d5d3cc);border-radius:14px;padding:14px 16px;margin:18px 0;max-width:980px';
  box.innerHTML = '<style>.kfix table{width:100%;border-collapse:collapse;font-size:.92rem}.kfix th,.kfix td{padding:6px 8px;border-bottom:1px solid var(--k-line,#d5d3cc);text-align:start;vertical-align:top}.kfix input{font:inherit;min-height:44px;width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid var(--k-line,#c9c6bd);border-radius:8px;background:var(--k-surface,#fff);color:inherit}.kfix del{background:rgba(180,35,24,.14);text-decoration:line-through}.kfix ins{background:rgba(11,122,85,.16);text-decoration:none}.kfix .tw{overflow-x:auto}.kfix button{min-height:44px}.kfix td.v{overflow-wrap:anywhere;max-width:260px}@media(max-width:700px){.kfix thead{display:none}.kfix tr{display:block;border-bottom:1px solid var(--k-line,#d5d3cc);padding:6px 0}.kfix td,.kfix th{display:block;border:0;padding:3px 0}.kfix td.v{max-width:none}}</style>' +
    '<h2 id="kfix-h" style="margin:0 0 6px">' + esc(T.h) + '</h2><p style="margin:0 0 10px">' + esc(T.lead) + '</p>' +
    (REPLY ? '' : '<p style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;margin:0 0 10px"><label style="display:flex;flex-direction:column;gap:4px;flex:1 1 260px">' + esc(T.id) + '<input id="kfix-id" autocomplete="off" placeholder="BALI-049"></label><button type="button" class="btn btn-line" id="kfix-go">' + esc(T.load) + '</button></p>') +
    '<p id="kfix-st" role="status" aria-live="polite" style="margin:0 0 8px"></p><div id="kfix-t" class="tw"></div><h3 style="margin:14px 0 6px;font-size:1rem">' + esc(T.diff) + '</h3><div id="kfix-d" aria-live="polite"><p class="muted">' + esc(T.nodiff) + '</p></div>' +
    '<p style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px"><button type="button" class="btn btn-hi" id="kfix-out" disabled>' + esc(REPLY ? T.add : T.mail) + '</button></p><p class="muted" style="font-size:.86rem;margin:0">' + esc(REPLY ? T.noter : T.note) + '</p>';
  anchor.parentNode.insertBefore(box, anchor);
  var st = d.getElementById('kfix-st'), tb = d.getElementById('kfix-t'), df = d.getElementById('kfix-d'), out = d.getElementById('kfix-out'), REC = null, IX = null;
  function index() { return IX ? Promise.resolve(IX) : fetch('/data/n34b-search.json').then(function (r) { return r.json(); }).then(function (j) { IX = j.p; return IX; }); }
  function find(q) {
    q = String(q || '').trim(); if (!q) return Promise.resolve(null);
    return index().then(function (P) {
      var up = q.toUpperCase(), lo = q.toLowerCase(), m = /\b([A-Za-z]{2,5}-\d{3,4})\b/.exec(q);
      return P.find(function (r) { return r[2] === up || (m && r[2] === m[1].toUpperCase()); }) || P.find(function (r) { return r[0] === lo; }) || P.find(function (r) { return r[1].toLowerCase() === lo; }) || P.find(function (r) { return r[1].toLowerCase().indexOf(lo) >= 0; }) || null;
    });
  }
  function words(s) { return String(s || '').split(/(\s+)/).filter(function (x) { return x !== ''; }); }
  function diff(a, b) {   // word LCS; returns html with <del> and <ins>
    var A = words(a), B = words(b), n = A.length, m = B.length, L = [], i, j;
    if (n * m > 40000) return '<del>' + esc(a) + '</del> <ins>' + esc(b) + '</ins>';
    for (i = 0; i <= n; i++) { L[i] = []; for (j = 0; j <= m; j++) L[i][j] = 0; }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var o = ''; i = 0; j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { o += esc(A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) { o += '<del>' + esc(A[i]) + '</del>'; i++; } else { o += '<ins>' + esc(B[j]) + '</ins>'; j++; } }
    while (i < n) o += '<del>' + esc(A[i++]) + '</del>'; while (j < m) o += '<ins>' + esc(B[j++]) + '</ins>';
    return o;
  }
  function fields(p) {
    var f = p.published_facts || {}, pg = (p.published_page && p.published_page.url) || p.facts_source || null;
    var price = f.price_min != null ? (f.currency ? f.currency + ' ' : '') + Number(f.price_min).toLocaleString('en-GB') + (f.price_max != null && f.price_max !== f.price_min ? ' - ' + Number(f.price_max).toLocaleString('en-GB') : '') : '';
    return [['permit', p.permit && p.permit.number, (p.permit && p.permit.source) || null], ['handover', p.handover && p.handover.date, (p.handover && p.handover.source) || null], ['stage', p.stage, pg], ['price', price, pg],
      ['plan', f.payment_plan || '', pg], ['company', f.developer_company || (p.developer && p.developer.name) || '', pg], ['area', p.location ? [p.location.area, p.location.market, p.location.country].filter(Boolean).join(', ') : '', pg], ['web', pg || '', pg]];
  }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } }
  function show(p) {
    REC = { id: p.id, slug: p.slug, name: p.name, F: fields(p) };
    tb.innerHTML = '<table><thead><tr><th scope="col">' + esc(T.field) + '</th><th scope="col">' + esc(T.rec) + '</th><th scope="col">' + esc(T.yours) + '</th><th scope="col">' + esc(T.ev) + '</th></tr></thead><tbody>' +
      REC.F.map(function (f, i) { return '<tr><th scope="row">' + esc(T.f[f[0]]) + '</th><td class="v">' + (f[1] ? '<bdi>' + esc(f[1]) + '</bdi>' : '<span class="muted">' + esc(T.np) + '</span>') + (f[2] ? ' <a class="k-src" href="' + esc(f[2]) + '" rel="nofollow noopener" target="_blank">' + esc(host(f[2]) || T.src) + '</a>' : '') + '</td><td><input data-i="' + i + '" data-k="v" aria-label="' + esc(T.f[f[0]] + ': ' + T.yours) + '" maxlength="300"></td><td><input data-i="' + i + '" data-k="e" aria-label="' + esc(T.f[f[0]] + ': ' + T.ev) + '" maxlength="300"></td></tr>'; }).join('') + '</tbody></table>';
    st.innerHTML = '<b><bdi>' + esc(p.name) + '</bdi></b> <span class="muted" dir="ltr">' + esc(p.id) + '</span> · <a href="/projects/' + esc(p.slug) + '/">kolaboro.com/projects/' + esc(p.slug) + '/</a>';
    render();
  }
  function changes() {
    if (!REC) return [];
    var V = {}, E = {}; tb.querySelectorAll('input').forEach(function (x) { (x.getAttribute('data-k') === 'v' ? V : E)[x.getAttribute('data-i')] = x.value.trim(); });
    return REC.F.map(function (f, i) { return { k: f[0], old: f[1] || '', src: f[2], nv: V[i] || '', ev: E[i] || '' }; }).filter(function (c) { return c.nv && c.nv !== c.old; });
  }
  function text(C) {
    return (REC.name + ' (' + REC.id + ')\nhttps://kolaboro.com/projects/' + REC.slug + '/\n\n') + C.map(function (c) { return '- ' + S.en.f[c.k] + ': on record "' + (c.old || 'not published') + '"' + (c.src ? ' (source ' + c.src + ')' : '') + ' -> proposed "' + c.nv + '"' + (c.ev ? '; evidence: ' + c.ev : ''); }).join('\n');
  }
  function render() {
    var C = changes(); out.disabled = !C.length;
    df.innerHTML = C.length ? '<ul style="margin:0;padding-inline-start:18px">' + C.map(function (c) { return '<li><b>' + esc(T.f[c.k]) + '</b>: <bdi>' + diff(c.old || '', c.nv) + '</bdi>' + (c.ev ? ' <span class="muted">(' + esc(T.ev) + ': ' + esc(c.ev) + ')</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted">' + esc(T.nodiff) + '</p>';
  }
  tb.addEventListener('input', render);
  out.addEventListener('click', function () {
    var C = changes(); if (!C.length) return; var tx = text(C);
    if (!REPLY) { location.href = 'mailto:hello@kolaboro.com?subject=' + encodeURIComponent(T.subj.replace('{id}', REC.id)) + '&body=' + encodeURIComponent(tx.slice(0, 1800)); return; }
    var ta = d.querySelector('#drf textarea[name=reply]'); if (!ta) return;
    var add = (ta.value ? ta.value.replace(/\s+$/, '') + '\n\n' : '') + 'Proposed corrections:\n' + tx;
    if (add.length > 3000) { st.textContent = T.full; return; }
    ta.value = add; ta.dispatchEvent(new Event('input', { bubbles: true }));
    var sel = d.querySelector('#drf select[name=topic]'), only = C.length === 1 ? C[0].k : null, want = only === 'permit' ? 'Permit or licence number' : only === 'handover' ? 'Completion date or delay' : 'Something else';
    if (sel) [].forEach.call(sel.options, function (o) { if (o.textContent === want) sel.value = o.value || o.textContent; });
    st.textContent = T.added; ta.focus();
  });
  function load(q) {
    find(q).then(function (r) {
      if (!r) { st.textContent = T.nf; tb.innerHTML = ''; REC = null; render(); return; }
      return fetch('/api/v1/projects/' + encodeURIComponent(r[0])).then(function (x) { return x.json(); }).then(function (p) { p.slug = p.slug || r[0]; p.name = p.name || r[1]; p.id = p.id || r[2]; show(p); });
    }).catch(function () { st.textContent = T.nf; });
  }
  if (REPLY) {
    var idI = d.getElementById('dr-id'); if (!idI) return;
    var go = function () { if (/^\s*[A-Za-z]{2,5}-\d{3,4}\s*$/.test(idI.value) && (!REC || REC.id !== idI.value.trim().toUpperCase())) load(idI.value); };
    idI.addEventListener("change", go); idI.addEventListener("blur", go); go(); setTimeout(go, 900);
  } else {
    var I = d.getElementById('kfix-id'), q = new URLSearchParams(location.search).get('id') || '';
    if (q) { I.value = q; load(q); }
    d.getElementById('kfix-go').addEventListener('click', function () { load(I.value); });
    I.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); load(I.value); } });
  }
})();
