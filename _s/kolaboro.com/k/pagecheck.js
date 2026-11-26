/*! Kolaboro "Verify this page": checks, in this browser, that the HTML of a page and every same-origin script and stylesheet
 *  it loads are byte for byte the files we published, using the signed site manifest at /api/x/n/manifest.
 *  The manifest (path -> SHA-256) is made by a GitHub Actions job from the git commit the live site serves, and signed with
 *  the same Ed25519 key as the open API (checked here with KBVerify from /k/verify-badge.js).
 *  HTML normalization, exactly (the only changes made between our files and your browser, all reversed before hashing):
 *   1. nonce="..." removed from <script> tags (the worker stamps a fresh CSP nonce on each response);
 *   2. Cloudflare email obfuscation reversed: /cdn-cgi/l/email-protection#<hex> back to mailto:<address>, the
 *      <span class="__cf_email__"> placeholder back to the address, and the injected email-decode.min.js script removed;
 *   3. scripts appended by the worker with src under /__k/ removed (only on /admin and one campaign landing);
 *   4. only if the hash does not match yet: the Google Analytics snippet right before </head> and the Microsoft Clarity
 *      snippet right before </body> are removed, because the deploy adds them to the few pages whose source has none.
 *  n40: the page and each file are compared as published SOURCE, read unchanged from the deploy at /api/x/n/src?path= (no-store).
 *  The worker then decorates HTML per response (nonces, an early script, font preloads, the shared stylesheet, hreflang links,
 *  prefetch rules, a transition style, current ?v= versions, the live ticker, the footer, some sections); those are listed, not hashed.
 *  The served copy of some files carries the public successor of the retired Supabase anon key; the row says so (put back only after a mismatch).
 *  What it proves: the files we serve match what we published. It does not prove our code is correct or safe.
 *  KBPageCheck.run(path, el)  KBPageCheck.dialog(openerEl)  KBPageCheck.normalize(html) -> { html, steps }
 */
(function () {
  if (window.KBPageCheck) return;
  var te = new TextEncoder(), VB = '/k/verify-badge.js?v=6b61413c9f', MAN = '/api/x/n/manifest';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function sha(bytes) { return crypto.subtle.digest('SHA-256', bytes).then(hex); }
  function verifier() {
    if (window.KBVerify) return Promise.resolve(window.KBVerify);
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = VB; s.onload = function () { ok(window.KBVerify); }; s.onerror = no; document.head.appendChild(s); });
  }
  function cfDecode(h) { var k = parseInt(h.substr(0, 2), 16), b = []; for (var i = 2; i < h.length; i += 2) b.push(parseInt(h.substr(i, 2), 16) ^ k); return new TextDecoder().decode(new Uint8Array(b)); }
  var SRC = '/api/x/n/src?path=', PUB = 'sb_publishable_' + 'WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X', JWT = ['ey' + 'JhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'ey' + 'Jpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0', 'n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw'].join('.');
  var LANG = (/^(es|fr|de|ru|zh|ar|nl)/.exec(document.documentElement.lang || '') || [0, 'en'])[1];
  var TX = {
    en: ['Checked: the published source file, as stored in the deploy, against the signed manifest. The server then decorates the page on its way to you, so the copy you received is not byte for byte the same; the additions are listed and are not covered by the hash.', 'Added by the server', 'Served exactly as published.', 'The copy served carries the public successor key in place of the retired Supabase anon key; with that one string put back it is byte for byte the source.', ['CSP nonces on scripts', 'an early script at the top of the head', 'font preloads', 'the shared design stylesheet link', 'language alternate links (hreflang)', 'prefetch rules (speculationrules)', 'a page transition style', 'current ?v= versions on CSS and JS links', 'the live updates ticker', 'the current footer', 'other sections the server renders for this page']],
    es: ['Comprobado: el archivo fuente publicado, tal como está guardado en el despliegue, frente al manifiesto firmado. Después el servidor decora la página antes de enviártela, así que la copia que recibes no es idéntica byte a byte; las adiciones se enumeran y no entran en el hash.', 'Añadido por el servidor', 'Servido exactamente como se publicó.', 'La copia servida lleva la clave pública sucesora en lugar de la clave anónima retirada de Supabase; con esa única cadena restituida es idéntica byte a byte a la fuente.', ['nonces CSP en los scripts', 'un script temprano al inicio del head', 'precargas de fuentes', 'el enlace a la hoja de estilos de diseño común', 'enlaces a otros idiomas (hreflang)', 'reglas de precarga (speculationrules)', 'un estilo de transición entre páginas', 'versiones ?v= actuales en enlaces CSS y JS', 'el ticker de novedades en directo', 'el pie de página actual', 'otras secciones que el servidor genera para esta página']],
    fr: ['Vérifié : le fichier source publié, tel qu\'il est stocké dans le déploiement, comparé au manifeste signé. Le serveur décore ensuite la page avant de vous l\'envoyer, donc la copie reçue n\'est pas identique octet pour octet ; les ajouts sont listés et ne sont pas couverts par le hachage.', 'Ajouté par le serveur', 'Servi exactement tel que publié.', 'La copie servie porte la clé publique de remplacement à la place de la clé anonyme Supabase retirée ; une fois cette seule chaîne rétablie, elle est identique octet pour octet à la source.', ['nonces CSP sur les scripts', 'un script précoce en haut du head', 'préchargements de polices', 'le lien vers la feuille de style commune', 'liens vers les autres langues (hreflang)', 'règles de préchargement (speculationrules)', 'un style de transition entre pages', 'versions ?v= actuelles sur les liens CSS et JS', 'le bandeau des nouveautés en direct', 'le pied de page actuel', 'd\'autres sections générées par le serveur pour cette page']],
    de: ['Geprüft: die veröffentlichte Quelldatei, wie sie im Deployment gespeichert ist, gegen das signierte Manifest. Der Server ergänzt die Seite danach auf dem Weg zu Ihnen, daher ist die empfangene Kopie nicht Byte für Byte gleich; die Ergänzungen sind aufgeführt und nicht vom Hash abgedeckt.', 'Vom Server ergänzt', 'Genau so ausgeliefert wie veröffentlicht.', 'Die ausgelieferte Kopie enthält statt des ausgemusterten anonymen Supabase-Schlüssels seinen öffentlichen Nachfolger; mit genau dieser Zeichenfolge zurückgesetzt ist sie Byte für Byte die Quelle.', ['CSP-Nonces an Skripten', 'ein frühes Skript am Anfang des Head', 'Font-Preloads', 'der Link zum gemeinsamen Design-Stylesheet', 'Links zu anderen Sprachen (hreflang)', 'Prefetch-Regeln (speculationrules)', 'ein Stil für Seitenübergänge', 'aktuelle ?v=-Versionen an CSS- und JS-Links', 'der Live-Ticker mit Neuigkeiten', 'die aktuelle Fußzeile', 'weitere Abschnitte, die der Server für diese Seite erzeugt']],
    ru: ['Проверено: опубликованный исходный файл в том виде, в каком он хранится в развёртывании, сверен с подписанным манифестом. Затем сервер дополняет страницу по пути к вам, поэтому полученная копия не совпадает байт в байт; дополнения перечислены и хешем не покрываются.', 'Добавлено сервером', 'Отдано в точности как опубликовано.', 'В отданной копии вместо устаревшего анонимного ключа Supabase стоит его публичный преемник; если вернуть эту одну строку, копия совпадает с исходником байт в байт.', ['CSP nonce у скриптов', 'ранний скрипт в начале head', 'предзагрузка шрифтов', 'ссылка на общий файл стилей', 'ссылки на другие языки (hreflang)', 'правила предзагрузки (speculationrules)', 'стиль перехода между страницами', 'текущие версии ?v= у ссылок CSS и JS', 'лента новостей в реальном времени', 'текущий подвал', 'другие разделы, которые сервер формирует для этой страницы']],
    zh: ['已核对：部署中存储的已发布源文件与签名清单一致。服务器随后在发送页面时会添加内容，因此您收到的副本并非逐字节相同；添加的内容列在下方，不在哈希范围内。', '服务器添加', '按发布原样提供。', '提供的副本用公开的新密钥替换了已停用的 Supabase 匿名密钥；把这一个字符串还原后，与源文件逐字节相同。', ['脚本上的 CSP nonce', 'head 开头的早期脚本', '字体预加载', '通用设计样式表链接', '其他语言链接 (hreflang)', '预取规则 (speculationrules)', '页面过渡样式', 'CSS 和 JS 链接上的当前 ?v= 版本', '实时更新滚动条', '当前页脚', '服务器为此页面生成的其他部分']],
    ar: ['تم التحقق: ملف المصدر المنشور كما هو مخزن في النشر، مقارنة بالبيان الموقّع. ثم يضيف الخادم عناصر إلى الصفحة في طريقها إليك، لذلك لا تطابق النسخة التي تلقيتها الملف بايتًا ببايت؛ الإضافات مذكورة ولا تشملها بصمة التجزئة.', 'أضافه الخادم', 'قُدّم تمامًا كما نُشر.', 'تحمل النسخة المقدَّمة المفتاح العام البديل مكان مفتاح Supabase المجهول المتقاعد؛ وبعد إعادة هذه السلسلة الوحيدة تطابق المصدر بايتًا ببايت.', ['رموز nonce لسياسة CSP على السكربتات', 'سكربت مبكر في بداية head', 'تحميل مسبق للخطوط', 'رابط ورقة الأنماط المشتركة', 'روابط اللغات الأخرى (hreflang)', 'قواعد الجلب المسبق (speculationrules)', 'نمط انتقال بين الصفحات', 'إصدارات ?v= الحالية في روابط CSS وJS', 'شريط التحديثات المباشرة', 'التذييل الحالي', 'أقسام أخرى ينشئها الخادم لهذه الصفحة']],
    nl: ['Gecontroleerd: het gepubliceerde bronbestand, zoals opgeslagen in de deploy, tegen het ondertekende manifest. Daarna voegt de server onderweg naar jou onderdelen aan de pagina toe, dus de ontvangen kopie is niet byte voor byte gelijk; de toevoegingen staan vermeld en vallen niet onder de hash.', 'Toegevoegd door de server', 'Precies zo geleverd als gepubliceerd.', 'De geleverde kopie bevat de openbare opvolger in plaats van de ingetrokken anonieme Supabase-sleutel; met alleen die tekenreeks teruggezet is ze byte voor byte de bron.', ['CSP-nonces op scripts', 'een vroeg script bovenaan de head', 'font-preloads', 'de link naar het gedeelde ontwerp-stylesheet', 'links naar andere talen (hreflang)', 'prefetchregels (speculationrules)', 'een stijl voor paginaovergangen', 'actuele ?v=-versies op CSS- en JS-links', 'de live nieuwsticker', 'de huidige footer', 'andere onderdelen die de server voor deze pagina maakt']]
  }[LANG];
  function cnt(h, rx) { return (h.match(rx) || []).length; }
  // what the server added to this HTML compared with its published source (shown, never hashed)
  function added(srcH, got) {
    var D = [/ nonce="/g, null, /<link rel="preload"[^>]*as="font"/g, /\/k\/ds-site\.css/g, /hreflang="/g, /type="speculationrules"/g, /id="kb-vt"/g, null, null, null], o = [];
    D.forEach(function (rx, i) { if (rx && cnt(got, rx) > cnt(srcH, rx)) o.push(TX[4][i]); });
    var E = /<head>\s*<script[^>]*>\(function\(w,d\)\{var q=\[\]/; if (E.test(got) && !E.test(srcH)) o.splice(o.length && o[0] === TX[4][0] ? 1 : 0, 0, TX[4][1]);
    var v0 = (srcH.match(/\?v=[\w-]+/g) || []).join(), v1 = (got.match(/\?v=[\w-]+/g) || []).join(); if (v0 !== v1) o.push(TX[4][7]);
    function part(h, a, b) { var i = h.indexOf(a), j = i < 0 ? -1 : h.indexOf(b, i); return i < 0 || j < 0 ? '' : h.slice(i, j); }
    if (part(srcH, 'class="ship-v', '</div></div>') !== part(got, 'class="ship-v', '</div></div>')) o.push(TX[4][8]);
    if (part(srcH, '<footer', '</footer>') !== part(got, '<footer', '</footer>')) o.push(TX[4][9]);
    o.push(TX[4][10]);
    return o;
  }
  function keyBack(t) { return t.indexOf(PUB) < 0 ? null : t.split(PUB).join(JWT); }
  // the source as deployed: the analytics snippets the deploy adds and the swapped key, each tried only after a mismatch
  function srcAlt(t) { var o = [], k = keyBack(t); if (k != null) o.push({ html: k, step: TX[3] }); variants(t).forEach(function (v) { o.push(v); var kv = keyBack(v.html); if (kv != null) o.push({ html: kv, step: v.step + '; ' + TX[3] }); }); return o; }
  function srcFetch(file) { return fetch(SRC + encodeURIComponent(file), { cache: 'no-store', credentials: 'omit' }).then(function (r) { if (r.status !== 200) throw new Error('src ' + r.status); return r.arrayBuffer(); }); }
  function normalize(html) {
    var steps = [], n;
    n = 0; html = html.replace(/(<script\b[^>]*?) nonce="[A-Za-z0-9+\/=]*"/g, function (_, a) { n++; return a; }); if (n) steps.push(n + ' script nonce attribute' + (n === 1 ? '' : 's') + ' removed');
    n = 0; html = html.replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g, function (_, h) { n++; return cfDecode(h); });
    html = html.replace(/href="\/cdn-cgi\/l\/email-protection#([0-9a-f]+)"/g, function (_, h) { n++; return 'href="mailto:' + cfDecode(h) + '"'; });
    html = html.replace(/<span class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/span>/g, function (_, h) { n++; return cfDecode(h); });
    if (n) steps.push(n + ' Cloudflare email obfuscation' + (n === 1 ? '' : 's') + ' reversed');
    n = 0; html = html.replace(/<script data-cfasync="false" src="\/cdn-cgi\/scripts\/[0-9a-f]+\/cloudflare-static\/email-decode\.min\.js"><\/script>/g, function () { n++; return ''; }); if (n) steps.push('Cloudflare email-decode script removed');
    n = 0; html = html.replace(/<script\b[^>]*\ssrc="\/__k\/[^"]*"[^>]*><\/script>/g, function () { n++; return ''; }); if (n) steps.push(n + ' worker-appended /__k/ script' + (n === 1 ? '' : 's') + ' removed');
    return { html: html, steps: steps };
  }
  var GA = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V"></script><script>window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};gtag(\'js\',new Date());gtag(\'config\',\'G-FJKJE77K4V\');</script>';
  var CL = '<script>if(!window.clarity)(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","z4eqcmaic7");</script>';
  // step 4: the variants without the analytics snippets the deploy adds to pages that have none, tried only after a mismatch
  function variants(html) {
    var out = [], g = html.indexOf(GA + '</head>') >= 0, c = html.lastIndexOf(CL + '</body>') >= 0;
    function noG(h) { return h.replace(GA + '</head>', '</head>'); }
    function noC(h) { var i = h.lastIndexOf(CL + '</body>'); return h.slice(0, i) + h.slice(i + CL.length); }
    if (g) out.push({ html: noG(html), step: 'Google Analytics snippet added at deploy removed' });
    if (c) out.push({ html: noC(html), step: 'Clarity snippet added at deploy removed' });
    if (g && c) out.push({ html: noC(noG(html)), step: 'Google Analytics and Clarity snippets added at deploy removed' });
    return out;
  }
  function fileFor(path, files) {
    var p = path.split('?')[0].split('#')[0]; try { p = decodeURIComponent(p); } catch (e) {}
    if (!p || p === '/') return '/index.html';
    if (/\/$/.test(p)) return p + 'index.html';
    if (files[p]) return p;
    if (files[p + '.html']) return p + '.html';
    return p + '/index.html';
  }
  var SSR = /^\/(p\/[A-Za-z0-9-]{3,20}|m\/[^/.]{2,60})\/?$/;
  function assets(html, base, here) {
    var doc = new DOMParser().parseFromString(html, 'text/html'), out = {}, skipped = {};
    function add(u, kind) {
      var x; try { x = new URL(u, base); } catch (e) { return; }
      if (x.origin !== location.origin) return;
      if (/^\/(cdn-cgi|__k|api)\//.test(x.pathname)) { skipped[x.pathname] = /^\/cdn-cgi\//.test(x.pathname) ? 'added by Cloudflare, not part of our files' : 'added by the worker on this response'; return; }
      if (!out[x.pathname]) out[x.pathname] = { url: x.pathname + x.search, kind: kind };
    }
    doc.querySelectorAll('script[src]').forEach(function (s) { add(s.getAttribute('src'), 'script'); });
    doc.querySelectorAll('link[href]').forEach(function (l) { var r = (l.getAttribute('rel') || '').toLowerCase(), as = (l.getAttribute('as') || '').toLowerCase(); if (/\bstylesheet\b/.test(r) || (/\bpreload\b/.test(r) && /^(style|script)$/.test(as)) || /\bmodulepreload\b/.test(r)) add(l.getAttribute('href'), /style/.test(r + as) ? 'style' : 'script'); });
    if (here && window.performance && performance.getEntriesByType) performance.getEntriesByType('resource').forEach(function (r) {
      if (/\.(m?js|css)(\?|$)/.test(r.name) || r.initiatorType === 'script' || r.initiatorType === 'css') { var x; try { x = new URL(r.name); } catch (e) { return; } if (/\.(m?js|css)$/.test(x.pathname)) add(r.name, /\.css$/.test(x.pathname) ? 'style' : 'script (loaded later)'); }
    });
    return { list: out, skipped: skipped };
  }
  function run(path, el, opts) {
    opts = opts || {};
    var here = path === location.pathname, t0 = performance.now();
    el.innerHTML = '<p class="kpc-s" aria-live="polite">Fetching the signed manifest…</p>';
    var st = el.querySelector('.kpc-s');
    return verifier().catch(function () { return null; }).then(function (V) {
      if (!V) throw new Error('The signature checker (/k/verify-badge.js) did not load.');
      return Promise.all([V.fetchSigned(MAN, { cache: 'no-store', credentials: 'omit' }), fetch('/api/open/build', { cache: 'no-store' }).then(function (r) { return r.json(); }).catch(function () { return {}; }), V]);
    }).then(function (a) {
      var M = a[0], live = a[1], V = a[2];
      if (!M.ok || !M.json || !M.json.files) {
        el.innerHTML = '<p class="kpc-bad"><b>The signed manifest is not published yet</b> (' + esc(M.status) + '). The job that writes it runs once a week. Nothing was checked, so nothing is shown as verified.</p>';
        return null;
      }
      var man = M.json, files = man.files;
      st.textContent = 'Fetching this page and its files again, without cache…';
      var url = path + (opts.search || ''), file = fileFor(path, files), ssr = SSR.test(path);
      return fetch(url, { cache: 'no-store', credentials: 'same-origin', redirect: 'follow' }).then(function (r) {
        return r.arrayBuffer().then(function (buf) { return { r: r, buf: buf }; });
      }).then(function (x) {
        var raw = new TextDecoder('utf-8', { ignoreBOM: true }).decode(x.buf), ct = x.r.headers.get('content-type') || '';
        if (!/html/.test(ct)) throw new Error(path + ' did not answer with an HTML page (' + (x.r.status) + ').');
        var N = normalize(raw), A = assets(raw, x.r.url, here), rows = [];
        var keys = Object.keys(A.list);
        return Promise.all([ssr || files[file] == null ? null : srcFetch(file).catch(function () { return null; })].concat(keys.map(function (k) {
          // each script and style: the published source (unchanged, no-store) is hashed; the served copy is compared with it
          return Promise.all([fetch(A.list[k].url, { cache: 'no-store', credentials: 'omit' }).then(function (r) { return r.arrayBuffer(); }).catch(function () { return null; }), files[k] == null ? null : srcFetch(k).catch(function () { return null; })]).then(function (ab) {
            var b = ab[1] || ab[0]; if (!b) return { path: k, kind: A.list[k].kind, bytes: null, want: files[k], err: 'could not be fetched' };
            var t = new TextDecoder().decode(b), kb = keyBack(t), same = ab[0] && ab[1] && new TextDecoder().decode(ab[0]) === t;
            return { path: k, kind: A.list[k].kind, bytes: b, want: files[k], alt: kb == null ? [] : [{ html: kb, step: TX[3] }], steps: [], note: ab[1] ? (same ? TX[2] : ab[0] ? (keyBack(new TextDecoder().decode(ab[0])) === t ? TX[3] : 'The copy served here differs from the published source.') : null) : null };
          });
        }))).then(function (more) {
          var sb = more.shift(), st0 = sb ? new TextDecoder('utf-8', { ignoreBOM: true }).decode(sb) : null, ad = st0 == null ? [] : added(st0, raw);
          rows.push({ path: file, kind: ssr ? 'page (server-rendered)' : 'page', bytes: st0 != null ? sb : te.encode(N.html), alt: ssr ? [] : st0 != null ? srcAlt(st0) : variants(N.html), steps: st0 != null ? [] : N.steps, want: ssr ? null : files[file], src: st0 != null,
            note: ssr ? 'This page is assembled per request from ' + file + ' and live data, so its HTML cannot match a published file. Its scripts and styles are checked below.' : st0 != null ? TX[0] + ' ' + TX[1] + ': ' + ad.join('; ') + '.' : N.steps.length ? 'Normalized before hashing: ' + N.steps.join('; ') + '.' : 'No normalization needed.' });
          rows = rows.concat(more);
          return Promise.all(rows.map(function (rw) {
            if (!rw.bytes) return rw;
            return sha(rw.bytes).then(function (h) {
              rw.got = h;
              if (h === rw.want || !rw.alt || !rw.alt.length) return rw;
              return Promise.all(rw.alt.map(function (v) { return sha(te.encode(v.html)); })).then(function (hs) {
                var i = hs.indexOf(rw.want); if (i < 0) return rw;
                rw.got = hs[i]; rw.note = (rw.src || !rw.steps.length ? (rw.note ? rw.note + ' ' : '') + rw.alt[i].step : 'Normalized before hashing: ' + rw.steps.concat([rw.alt[i].step]).join('; ') + '.'); return rw;
              });
            });
          }));
        }).then(function (rows) {
          var ok = 0, bad = 0, none = 0;
          rows.forEach(function (rw) { rw.state = rw.err ? 'err' : rw.want == null ? 'none' : rw.got === rw.want ? 'ok' : 'bad'; if (rw.state === 'ok') ok++; else if (rw.state === 'bad') bad++; else none++; });
          var ms = Math.round(performance.now() - t0), stale = live.commit && man.commit && live.commit !== man.commit;
          el.innerHTML =
            '<div class="kpc-sum ' + (bad && !stale ? 'kpc-bad' : ok && !bad ? 'kpc-ok' : '') + '"><b>' + (bad ? bad + ' of ' + (ok + bad) + (stale ? ' files differ from' : ' files do not match') : ok ? 'All ' + ok + ' checked files match' : 'Nothing could be matched') + '</b> the manifest' + (bad && stale ? ' of ' + esc(String(man.generated_at).slice(0, 10)) + ', and the site has been updated since then' : '') + (none ? ', ' + none + ' not covered' : '') + '. Checked in ' + ms + ' ms in this browser.</div>' +
            '<p class="kpc-m">Manifest: ' + man.count + ' files at commit <code>' + esc(String(man.commit).slice(0, 12)) + '</code>, made ' + esc(String(man.generated_at).replace('T', ' ').replace('Z', ' UTC')) + '. Live site: commit <code>' + esc(String(live.commit || 'unknown').slice(0, 12)) + '</code>. <span class="kpc-sig"></span></p>' +
            (stale ? '<p class="kpc-m">The live commit is newer than the manifest. That is normal: data publishes create commits too, and the manifest only changes when a published file outside /data/ changes. ' + (bad ? 'The manifest is rebuilt once a week (Monday morning, UTC). A file changed in a deploy after that shows as a mismatch until the next manifest, so a mismatch here does not by itself mean the page was altered on the way to you. Check again after the next manifest.' : '') + '</p>' : '') +
            '<div class="kpc-tw"><table class="kpc-t"><thead><tr><th>File</th><th>Result</th><th>SHA-256 you received</th></tr></thead><tbody>' + rows.map(function (rw) {
              var lab = rw.state === 'ok' ? '<span class="kpc-y">Match</span>' : rw.state === 'bad' ? '<span class="kpc-n">Mismatch</span>' : rw.state === 'err' ? '<span class="kpc-n">Not fetched</span>' : '<span class="kpc-u">Not in manifest</span>';
              return '<tr><td><code>' + esc(rw.path) + '</code><br><small>' + esc(rw.kind) + (rw.note ? ': ' + esc(rw.note) : '') + '</small></td><td>' + lab + (rw.state === 'bad' ? '<br><small>expected <code>' + esc(String(rw.want).slice(0, 16)) + '…</code></small>' : '') + '</td><td><code>' + esc(rw.got ? rw.got.slice(0, 16) + '…' : '') + '</code></td></tr>';
            }).join('') + Object.keys(A.skipped).map(function (k) { return '<tr><td><code>' + esc(k) + '</code></td><td><span class="kpc-u">Not ours</span></td><td><small>' + esc(A.skipped[k]) + '</small></td></tr>'; }).join('') + '</tbody></table></div>' +
            '<p class="kpc-m"><b>What this proves:</b> the files we serve are the files we published at that commit; for HTML pages the server adds the parts listed per row on the way to you. <b>What it does not prove:</b> that our code is correct or safe, or anything about third-party scripts (analytics) and data loaded later from /data/ or the API, which are signed and logged separately. Signed manifest: <a href="' + MAN + '">' + MAN + '</a>.</p>';
          V.badge(el.querySelector('.kpc-sig'), M.check, { what: 'the site manifest' });
          return { ok: ok, bad: bad, none: none, rows: rows, manifest: man.commit, live: live.commit };
        });
      });
    }).catch(function (e) { el.innerHTML = '<p class="kpc-bad"><b>The check could not run.</b> ' + esc((e && e.message) || 'network error') + ' Nothing is shown as verified.</p>'; return null; });
  }
  var CSS = '.kpc-sum{padding:10px 12px;border-radius:10px;background:#EEF0F2;margin:0 0 8px}.kpc-sum.kpc-ok{background:#DDEFE7;color:#075E41}.kpc-sum.kpc-bad,p.kpc-bad{background:#FDE6DC;color:#8F2D04;padding:10px 12px;border-radius:10px}' +
    '.kpc-m{font-size:.82rem;color:#4A5661;margin:8px 0}.kpc-m code,.kpc-t code{font:500 .74rem/1.4 ui-monospace,Menlo,monospace;overflow-wrap:anywhere}.kpc-tw{overflow-x:auto;max-width:100%}' +
    '.kpc-t{width:100%;border-collapse:collapse;font-size:.8rem}.kpc-t th,.kpc-t td{text-align:left;vertical-align:top;padding:6px 8px;border-bottom:1px solid rgba(23,33,43,.1)}.kpc-t small{color:#4A5661}' +
    '.kpc-y{color:#075E41;font-weight:700}.kpc-n{color:#8F2D04;font-weight:700}.kpc-u{color:#4A5661;font-weight:700}' +
    '.kpc-dlg{position:fixed;inset:0;z-index:70;background:rgba(23,33,43,.45);display:flex;align-items:flex-start;justify-content:center;padding:6vh 12px}' +
    '.kpc-box{position:relative;width:min(760px,100%);max-height:88vh;overflow:auto;background:#fff;color:#17212B;border-radius:16px;padding:20px 20px 16px;box-shadow:0 24px 60px rgba(23,33,43,.3);font:500 .9rem/1.5 Archivo,system-ui,sans-serif}' +
    '.kpc-box h2{font:800 1.15rem/1.25 Archivo,system-ui,sans-serif;margin:0 36px 10px 0}.kpc-box:focus{outline:none}.kpc-x{position:absolute;top:10px;right:10px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;font:700 1.3rem/1 system-ui;cursor:pointer;color:#4A5661}.kpc-x:hover{background:#F2F3F1}.kpc-x:focus-visible{outline:3px solid #FF5B14}' +
    '@media (max-width:520px){.kpc-t th:nth-child(3),.kpc-t td:nth-child(3){display:none}}';
  function css() { if (document.getElementById('kpc-css')) return; var s = document.createElement('style'); s.id = 'kpc-css'; s.textContent = CSS; document.head.appendChild(s); }
  function dialog(opener) {
    css();
    var d = document.createElement('div'); d.className = 'kpc-dlg';
    d.innerHTML = '<div class="kpc-box" role="dialog" aria-modal="true" aria-labelledby="kpc-h" tabindex="-1"><button type="button" class="kpc-x" aria-label="Close">×</button><h2 id="kpc-h">Verify this page</h2><div class="kpc-out"></div><p class="kpc-m"><a href="/verify?page=' + encodeURIComponent(location.pathname) + '#page">Open on the verify page</a>, which explains each step.</p></div>';
    document.body.appendChild(d);
    var box = d.firstChild, prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    function close() { d.remove(); document.documentElement.style.overflow = prevOverflow; document.removeEventListener('keydown', key, true); if (opener) opener.focus(); }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } else if (e.key === 'Tab') { var f = box.querySelectorAll('a,button,[tabindex="0"],summary'); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } }
    document.addEventListener('keydown', key, true);
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    box.querySelector('.kpc-x').addEventListener('click', close);
    box.focus();
    return run(location.pathname, box.querySelector('.kpc-out'), { search: location.search });
  }
  window.KBPageCheck = { version: '1.1.0', run: run, dialog: dialog, normalize: normalize, variants: variants, fileFor: fileFor, css: css };
})();
