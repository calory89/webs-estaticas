/* kolaboro.com /data/ask/ (n35a, batch 35): ask the open dataset in 8 languages without any AI service. A question is matched against fixed
   word lists (below) and turned into one SQL query, shown before it runs; DuckDB-WASM (pinned, jsDelivr) runs it in the browser on the same
   Parquet files as /data/sql/, checked against the SHA-256 in the data card. Nothing typed here is sent anywhere.
   The parser is also exported as KBASK.parse for the test file /open/n35a-ask-tests.json (30 question patterns in 8 languages). */
(function (G) {
  'use strict';
  var Y = function (s, f) { return new RegExp(s, 'i' + (f || '')); };
  // word lists per concept and language (matched on lower-cased text without accents)
  var W = {
    overdue: { en: 'past (?:their |the |its )?(?:handover|completion)|overdue|handover (?:date )?(?:has )?passed', es: 'pasad[oa]s? de (?:su |la )?fecha de entrega|con la entrega vencida|entrega vencida|vencid[oa]s?', fr: 'en retard|date de livraison (?:est )?depassee|ont depasse (?:leur )?date de livraison|depasse (?:leur |la )?date de livraison', de: 'uberfallig|ubergabetermin (?:ist )?uberschritten|ubergabetermin verpasst|uber dem ubergabetermin', nl: 'over (?:hun |de )?opleverdatum|opleverdatum (?:is )?verstreken|te laat', ru: 'просрочен|срок сдачи (?:уже )?прош[её]л|с прошедшим сроком сдачи', zh: '逾期|已过交付日期|过了交付日期|超过交付日期', ar: 'تجاوزت? موعد التسليم|فات موعد تسليمها|فات موعد التسليم|متأخرة? عن موعد التسليم' },
    moved: { en: 'handover moved|moved later|postponed|date moved|delayed', es: 'aplazad|pospuest|entrega retrasada|retrasad', fr: 'reporte|repousse|retarde', de: 'verschoben|verzogert', nl: 'uitgesteld|verschoven|vertraagd', ru: 'перенес[её]н|перенесли|отложен|задерж', zh: '推迟|延期', ar: 'تأجيل|تأجل|مؤجل|تأخر' },
    permno: { en: 'without (?:a )?permit|no permit|permit not published', es: 'sin (?:permiso|licencia)', fr: 'sans permis', de: 'ohne (?:bau)?genehmigung', nl: 'zonder vergunning', ru: 'без разрешения', zh: '没有许可|无许可', ar: 'بدون (?:تصريح|ترخيص)|بلا (?:تصريح|ترخيص)' },
    permyes: { en: 'with (?:a )?permit|have a permit|has a permit|permit number', es: 'con (?:permiso|licencia)|tienen (?:permiso|licencia)', fr: 'avec (?:un )?permis|ont un permis', de: 'mit (?:bau)?genehmigung|haben eine genehmigung', nl: 'met (?:een )?vergunning|hebben een vergunning', ru: 'с разрешением|есть разрешение|имеют разрешение', zh: '有许可', ar: 'لديها (?:تصريح|ترخيص)|مع (?:تصريح|ترخيص)|بتصريح|بترخيص' },
    op: { en: 'off-plan|off plan', es: 'sobre plano', fr: 'sur plan', de: 'off-plan|in planung', nl: 'op plan|off-plan', ru: 'на этапе котлована|котлован|off-plan', zh: '期房', ar: 'على الخارطة' },
    uc: { en: 'under construction|being built', es: 'en construccion', fr: 'en construction|en chantier', de: 'im bau|in bau', nl: 'in aanbouw', ru: 'строящ|в стадии строительства', zh: '在建|施工中', ar: 'قيد الإنشاء|تحت الإنشاء' },
    done: { en: 'completed|finished', es: 'terminad|completad', fr: 'termine|acheve|livres?\\b', de: 'fertiggestellt|fertige', nl: 'opgeleverd|voltooid|afgerond', ru: 'завершенн|сданн', zh: '已完工|已竣工|已交付', ar: 'المكتملة|مكتمل|المنجزة' },
    contra: { en: 'contradicted|contradiction', es: 'contradich|contradic', fr: 'contredit|contradiction', de: 'widerlegt|widerspr', nl: 'weerlegd|tegengesproken|tegenstrijdig', ru: 'опроверг|противореч', zh: '被反驳|矛盾', ar: 'متناقض|تناقض|مدحوض|تدحض' },
    count: { en: 'how many|number of|count of', es: 'cuant[oa]s|numero de', fr: 'combien|nombre de', de: 'wie viele|anzahl', nl: 'hoeveel|aantal', ru: 'сколько|число|количество', zh: '多少|几个|数量', ar: 'كم|عدد' },
    ppm: { en: 'price per m2|price per sqm|price per square met|per m²', es: 'precio por m2|precio por metro', fr: 'prix (?:au|par) m2|prix au metre', de: 'preis pro m2|quadratmeterpreis|preis pro quadratmeter', nl: 'prijs per m2|vierkantemeterprijs', ru: 'цен[аы] за (?:м2|квадратный)', zh: '每平米|每平方米|单价', ar: 'سعر المتر|السعر (?:لكل|للمتر)' },
    pct: { en: '% built|percent built|construction progress', es: '% construido|porcentaje construido|avance de obra', fr: '% construit|avancement', de: '% gebaut|baufortschritt|prozent gebaut', nl: '% gebouwd|bouwvoortgang', ru: '% готовности|процент готовности|готовност|построен[оа]? на', zh: '施工进度|完成度|建成', ar: 'نسبة الإنجاز|نسبة البناء|منجزة بنسبة|بنسبة' },
    gdev: { en: 'by developer|per developer|which developers|developers with|top \\d+ developers|developers? (?:in|with)', es: 'por promotor|que promotores|promotores (?:con|en)', fr: 'par promoteur|quels promoteurs|promoteurs (?:avec|a|ayant)', de: 'nach bautrager|pro bautrager|welche bautrager|bautrager mit|bautrager in', nl: 'per ontwikkelaar|welke ontwikkelaars|ontwikkelaars (?:met|in)', ru: 'по застройщик|какие застройщики|застройщик(?:и|ов) (?:с|в)', zh: '按开发商|哪些开发商|各开发商|开发商', ar: 'حسب المطور|أي المطورين|المطورون|المطورين' },
    gmk: { en: 'by market|per market|which markets|by city', es: 'por mercado|que mercados|por ciudad', fr: 'par marche|quels marches|par ville', de: 'nach markt|pro markt|welche markte|nach stadt', nl: 'per markt|welke markten|per stad', ru: 'по рынк|какие рынки|по город', zh: '按市场|各市场|哪些市场|按城市', ar: 'حسب السوق|لكل سوق|أي الأسواق|حسب المدينة' },
    gco: { en: 'by country|per country', es: 'por pais', fr: 'par pays', de: 'nach land|pro land', nl: 'per land', ru: 'по стран', zh: '按国家|各国', ar: 'حسب الدولة|حسب البلد' },
    gyr: { en: 'by (?:handover )?year|per year', es: 'por ano', fr: 'par annee|par an\\b', de: 'nach jahr|pro jahr', nl: 'per jaar', ru: 'по годам', zh: '按年|按交付年份', ar: 'حسب السنة|حسب سنة' },
    gst: { en: 'by stage', es: 'por (?:etapa|fase)', fr: 'par (?:etape|stade)', de: 'nach (?:bau)?phase', nl: 'per fase', ru: 'по стади', zh: '按阶段', ar: 'حسب المرحلة' },
    ho: { en: 'handover|completion|delivery', es: 'entrega', fr: 'livraison', de: 'ubergabe|fertigstellung', nl: 'oplevering', ru: 'сдач|сдают|сдаются', zh: '交付|交房', ar: 'تسليم|التسليم' },
    before: { en: 'before', es: 'antes de', fr: 'avant', de: 'vor', nl: 'voor', ru: 'до', zh: '之前|以前', ar: 'قبل' },
    after: { en: 'after', es: 'despues de', fr: 'apres', de: 'nach', nl: 'na', ru: 'после', zh: '之后|以后', ar: 'بعد' },
    under: { en: 'under|below|less than|cheaper than', es: 'menos de|por debajo de', fr: 'moins de|en dessous de', de: 'unter|weniger als', nl: 'onder|minder dan', ru: 'до|меньше|дешевле', zh: '低于|以下|不到', ar: 'أقل من|تحت' },
    over: { en: 'more than|over|above', es: 'mas de|por encima de', fr: 'plus de|au-dessus de', de: 'uber|mehr als', nl: 'meer dan|boven', ru: 'больше|более|свыше', zh: '超过|以上|高于', ar: 'أكثر من|فوق' },
    top: { en: 'top (\\d+)', es: '(?:los )?(\\d+) (?:mayores|principales)|top (\\d+)', fr: '(?:les )?(\\d+) (?:plus grands|premiers)|top (\\d+)', de: 'top (\\d+)|(?:die )?(\\d+) gro', nl: 'top (\\d+)', ru: 'топ[- ]?(\\d+)', zh: '前(\\d+)', ar: 'أكبر (\\d+)|أعلى (\\d+)' }
  };
  var CUR = [['USD', '\\$|usd|dollar|долл|美元|دولار'], ['AED', 'aed|dirham|дирхам|迪拉姆|درهم'], ['EUR', '€|eur|евро|欧元|يورو'], ['GBP', '£|gbp|pound|фунт|英镑|جنيه'], ['THB', 'thb|baht|бат|泰铢|بات']];
  var MULT = '(k|m|mil|million|millones|millions|millionen|miljoen|млн|тыс\\.?|тысяч|万|百万|مليون|ألف)?';
  function plain(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е').replace(/[ً-ْ]/g, '').replace(/[ىي]/g, 'ي').replace(/\s+/g, ' ').trim(); }
  Object.keys(W).forEach(function (c) { Object.keys(W[c]).forEach(function (l) { W[c][l] = plain(W[c][l]); }); });
  CUR.forEach(function (c) { c[1] = plain(c[1]); }); MULT = plain(MULT);
  var MK1 = new RegExp('^(?:k|' + plain('тыс|тысяч|ألف') + ')'), MK6 = new RegExp('^(?:m|mil|' + plain('млн|مليون|百万') + ')');
  var LEGAL = /\b(l\.?l\.?c|pjsc|pcl|plc|bhd|berhad|sdn|s\.?a|s\.?l|ltd|limited|inc|corp|gmbh|group|holding|holdings|developments?|developers?|properties|property|real estate|development|investments?|homes)\b/g;
  var V = null;   // vocabulary: markets in 8 languages and developer names (/data/n35a/ask-vocab.json)
  function cyr(s) { if (!V) return s; var o = ''; for (var i = 0; i < s.length; i++) { var k = V.cyr.indexOf(s[i]); o += k >= 0 ? V.cyr_lat[k] : s[i]; } return o; }
  function key(s) { return cyr(plain(s)).replace(/&/g, ' and ').replace(LEGAL, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim(); }
  function has(c, l, x) { var a = W[c][l], b = W[c].en; return Y((l === 'zh' ? '' : '(?:^|[^\\p{L}])') + '(?:' + a + ')', 'u').test(x) || (l !== 'en' && Y('(?:^|[^a-z])(?:' + b + ')').test(x)); }
  function re(c, l) { return W[c][l] + (l !== 'en' ? '|' + W[c].en : ''); }
  function q(s) { return "'" + String(s).replace(/'/g, "''") + "'"; }
  function parse(text, l, vocab) {
    if (vocab) V = vocab;
    l = W.count[l] ? l : 'en';
    var x = plain(text), c = { f: [] }, where = [];
    if (!x) return null;
    // market (longest name first, in the page language and English)
    var mk = null, xm = x.replace(/-/g, ' ');
    if (V) V.markets.slice().sort(function (a, b) { return b[0].length - a[0].length; }).some(function (m) {
      var names = [m[0]].concat(Object.keys(m[2] || {}).map(function (k) { return m[2][k]; })).map(function (n) { return plain(n).replace(/-/g, ' '); }).filter(function (n) { return n.length >= 2; });
      names = names.concat(names.filter(function (n) { return /[\u0400-\u04ff]$/.test(n) && n.length >= 5; }).map(function (n) { return n.slice(0, -1); }));
      return names.some(function (n) { var i = xm.indexOf(n); if (i < 0) return false; var a = xm[i - 1], b = xm[i + n.length]; if ((a && /[a-z0-9]/.test(a)) || (b && /[a-z0-9]/.test(b) && !/^[一-鿿]/.test(n))) return false; mk = m[0]; return true; });
    });
    if (mk) { where.push('market = ' + q(mk)); c.f.push(['mk', mk]); }
    // developer (full name key, or a distinctive first word)
    if (V) {
      var kx = ' ' + key(text) + ' ', dv = null;
      V.developers.some(function (d) { var k = key(d[0]); if (k.length >= 4 && kx.indexOf(' ' + k + ' ') >= 0 && (!mk || plain(mk) !== k)) { dv = d[0]; return true; } return false; });
      if (!dv) Object.keys(V.dev_short).some(function (w) { if (kx.indexOf(' ' + w + ' ') >= 0) { dv = V.dev_short[w]; return true; } return false; });
      if (dv) { where.push('developer = ' + q(dv)); c.f.push(['dv', dv]); }
    }
    if (has('overdue', l, x)) { where.push("handover_month < strftime(current_date, '%Y-%m') AND coalesce(stage, '') <> 'completed'"); c.f.push(['overdue']); }
    else if (has('moved', l, x)) { where.push('delay_months > 0'); c.f.push(['moved']); }
    if (has('permno', l, x)) { where.push('permit_number IS NULL'); c.f.push(['permno']); }
    else if (has('permyes', l, x)) { where.push('permit_number IS NOT NULL'); c.f.push(['permyes']); }
    if (has('uc', l, x)) { where.push("stage = 'under construction'"); c.f.push(['uc']); }
    else if (has('op', l, x)) { where.push("stage = 'off-plan'"); c.f.push(['op']); }
    else if (has('done', l, x) && !c.f.some(function (f) { return f[0] === 'overdue'; })) { where.push("stage = 'completed'"); c.f.push(['done']); }
    if (has('contra', l, x)) { where.push('claims_contradicted > 0'); c.f.push(['contra']); }
    var isPct = has('pct', l, x), isPpm = has('ppm', l, x);
    // a percentage with "less/more than": % built threshold
    var pm = new RegExp('(?:(' + re('under', l) + ')|(' + re('over', l) + '))\\s*(\\d{1,3})\\s*%|(\\d{1,3})\\s*%\\s*(?:' + re('under', l) + '|(' + re('over', l) + '))', 'i').exec(x);
    if (pm) { var n = +(pm[3] || pm[4]), gt = !!(pm[2] || pm[5]); if (n > 0 && n < 100) { where.push('dld_percent_built ' + (gt ? '>' : '<') + ' ' + n); c.f.push([gt ? 'pctgt' : 'pctlt', n]); isPct = false; } }
    // year of handover, with before / after
    var ym = /(?:^|[^\d])(20[2-4]\d)(?!\d)/.exec(x);
    if (ym) {
      var yr = ym[1], i0 = ym.index, ctx0 = x.slice(Math.max(0, i0 - 14), i0 + 1), ctx1 = x.slice(i0 + 5, i0 + 12);
      if (Y('(?:' + re('before', l) + ')\\s*$').test(ctx0) || (l === 'zh' && /^年?(?:之前|以前)/.test(ctx1))) { where.push('handover_month < ' + q(yr)); c.f.push(['before', yr]); }
      else if (Y('(?:' + re('after', l) + ')\\s*$').test(ctx0) || (l === 'zh' && /^年?(?:之后|以后)/.test(ctx1))) { where.push('handover_month > ' + q(yr + '-12')); c.f.push(['after', yr]); }
      else { where.push('handover_month LIKE ' + q(yr + '-%')); c.f.push(['year', yr]); }
    }
    // price under / over an amount
    var am = new RegExp('(' + re('under', l) + '|' + re('over', l) + ')\\s*(?:\\$|€|£)?\\s*(\\d+(?:[.,]\\d+)?)\\s*' + MULT, 'i').exec(x);
    if (am && !(ym && am[2] === ym[1]) && !pm) {
      var v = parseFloat(am[2].replace(',', '.')), mu = (am[3] || '').toLowerCase();
      if (MK1.test(mu)) v *= 1e3; else if (MK6.test(mu)) v *= 1e6; else if (mu === '万') v *= 1e4;
      var cur = 'USD'; CUR.some(function (cc) { if (Y(cc[1]).test(x)) { cur = cc[0]; return true; } return false; });
      if (v >= 1000) { var lt = Y('^(?:' + re('under', l) + ')$').test(am[1]); where.push('currency = ' + q(cur) + ' AND price_min ' + (lt ? '<' : '>') + ' ' + Math.round(v)); c.f.push([lt ? 'plt' : 'pgt', Math.round(v), cur]); }
    }
    var g = has('gdev', l, x) ? 'developer' : has('gmk', l, x) ? 'market' : has('gco', l, x) ? 'country' : has('gyr', l, x) ? 'year' : has('gst', l, x) ? 'stage' : null;
    if (g === 'developer' && c.f.some(function (f) { return f[0] === 'dv'; })) g = null;
    var tm = new RegExp(W.top[l] + '|' + W.top.en, 'i').exec(x), top = tm ? +(tm.slice(1).filter(Boolean)[0]) : null;
    var count = has('count', l, x);
    if (!c.f.length && !g && !isPct && !isPpm && !count) return null;
    var W2 = where.length ? '\nWHERE ' + where.join('\n  AND ') : '', sql, gcol = g === 'year' ? "substr(handover_month, 1, 4) AS handover_year" : g;
    var gname = g === 'year' ? 'handover_year' : g;
    if (isPpm) {
      var g2 = gname || 'market', gc2 = gcol || 'market';
      sql = 'SELECT ' + gc2 + ', currency, count(*) AS projects,\n       round(median(price_per_m2_min)) AS median_price_per_m2\nFROM projects' + (W2 ? W2 + '\n  AND price_per_m2_min IS NOT NULL' : '\nWHERE price_per_m2_min IS NOT NULL') + '\nGROUP BY ' + g2 + ', currency HAVING count(*) >= 3\nORDER BY projects DESC\nLIMIT ' + (top || 25) + ';';
      c.m = 'ppm'; c.g = g2;
    } else if (isPct) {
      var g3 = gname || 'developer', gc3 = gcol || 'developer';
      sql = 'SELECT ' + gc3 + ', count(*) AS projects,\n       round(median(dld_percent_built), 1) AS median_percent_built\nFROM projects' + (W2 ? W2 + '\n  AND dld_percent_built IS NOT NULL' : '\nWHERE dld_percent_built IS NOT NULL') + '\nGROUP BY ' + g3 + ' HAVING count(*) >= 2\nORDER BY projects DESC\nLIMIT ' + (top || 25) + ';';
      c.m = 'pct'; c.g = g3;
    } else if (g) {
      sql = 'SELECT ' + gcol + ', count(*) AS projects\nFROM projects' + W2 + (g === 'developer' ? (W2 ? '\n  AND' : '\nWHERE') + " developer <> ''" : '') + '\nGROUP BY ' + gname + '\nORDER BY projects DESC' + (g === 'year' ? ', ' + gname : '') + '\nLIMIT ' + (top || 25) + ';';
      c.m = 'count'; c.g = gname;
    } else if (count) {
      sql = 'SELECT count(*) AS projects\nFROM projects' + W2 + ';'; c.m = 'count';
    } else {
      var extra = c.f.some(function (f) { return /^p[lg]t$/.test(f[0]); }) ? 'price_min, currency, ' : c.f.some(function (f) { return /^pct/.test(f[0]); }) ? 'dld_percent_built, dld_inspection_date, ' : c.f.some(function (f) { return f[0] === 'permyes'; }) ? 'permit_number, ' : '';
      sql = 'SELECT name, developer, market, stage, handover_on_record, ' + extra + 'page\nFROM projects' + W2 + '\nORDER BY handover_month NULLS LAST, name\nLIMIT ' + (top || 100) + ';'; c.m = 'list';
    }
    if (top) c.top = top;
    c.sql = sql;
    return c;
  }
  G.KBASK = { parse: parse, W: W };
  if (typeof document === 'undefined') return;
  // ---------------------------------------------------------------------------------------------- page app
  var A = document.getElementById('n35-qa'); if (!A) return;
  var M = JSON.parse(document.getElementById('n35-qat').textContent), L = M._loc || 'en-GB', LG = M._l || 'en';
  var DUCKDB = '1.32.0', ESM = 'https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@' + DUCKDB + '/+esm';
  var $ = function (id) { return document.getElementById(id); }, st = $('n35-qas'), out = $('n35-qao'), inp = $('n35-qaq'), conn = null, starting = null;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
  var fill = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); };
  var nf = function (n) { try { return new Intl.NumberFormat(L, { numberingSystem: 'latn', maximumFractionDigits: 1 }).format(n); } catch (e) { return String(n); } };
  var vocabP = fetch('/data/n35a/ask-vocab.json').then(function (r) { return r.json(); }).then(function (v) { V = v; return v; });
  function hex(buf) { return crypto.subtle.digest('SHA-256', buf).then(function (d) { return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }); }
  function start() {
    if (starting) return starting;
    var bufs = {}, card, mod, db;
    starting = fetch('/data/sql/datacard.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (c) {
      card = c; var f = c.files.filter(function (x) { return x.table === 'projects'; })[0];
      return fetch(f.parquet.path).then(function (r) { return r.arrayBuffer(); }).then(function (b) { bufs.projects = new Uint8Array(b); return hex(b); }).then(function (h) { if (h !== f.parquet.sha256) throw new Error(M.q_hash); });
    }).then(function () { return import(ESM); }).then(function (x) { mod = x; return mod.selectBundle(mod.getJsDelivrBundles()); }).then(function (bundle) {
      var wu = URL.createObjectURL(new Blob(['importScripts("' + bundle.mainWorker + '");'], { type: 'text/javascript' }));
      db = new mod.AsyncDuckDB(new mod.VoidLogger(), new Worker(wu));
      return db.instantiate(bundle.mainModule, bundle.pthreadWorker).then(function () { URL.revokeObjectURL(wu); });
    }).then(function () { return db.registerFileBuffer('projects.parquet', bufs.projects); }).then(function () { return db.connect(); }).then(function (c) {
      conn = c; return conn.query("CREATE OR REPLACE VIEW projects AS SELECT * FROM read_parquet('projects.parquet')");
    }).catch(function (e) { starting = null; throw e; });
    return starting;
  }
  function cell(v) { if (v === null || v === undefined) return ''; if (typeof v === 'bigint') return Number(v); if (v instanceof Date) return v.toISOString().slice(0, 10); return v; }
  function ask(text) {
    vocabP.then(function () {
      var c = parse(text, LG);
      if (!c) { out.innerHTML = ''; st.textContent = M.q_none; return; }
      var chips = c.f.map(function (f) { return '<li><span class="kpill">' + esc(fill((M.q_c || {})[f[0]] || f[0], { v: f[1] != null ? f[1] : '', c: f[2] || '' })) + '</span></li>'; }).join('');
      out.innerHTML = (chips ? '<p class="k-xs">' + esc(M.q_parsed) + '</p><ul class="n35-rel">' + chips + '</ul>' : '') + '<p class="k-xs">' + esc(M.q_sql) + '</p><pre dir="ltr"><code>' + esc(c.sql) + '</code></pre><p><a href="/data/sql/#q=' + btoa(unescape(encodeURIComponent(c.sql))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '">' + esc(M.q_open) + '</a></p><div id="n35-qar"></div>';
      st.textContent = M.q_load; var t0 = performance.now();
      start().then(function () { return conn.query(c.sql); }).then(function (tb) {
        var cols = tb.schema.fields.map(function (f) { return f.name; }), rows = [];
        for (var i = 0; i < Math.min(tb.numRows, 200); i++) { var r = tb.get(i); rows.push(cols.map(function (k) { return cell(r[k]); })); }
        $('n35-qar').innerHTML = '<div class="n35-tw" tabindex="0"><table dir="ltr"><thead><tr>' + cols.map(function (k) { return '<th scope="col">' + esc(k) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (v) { var s = String(v); if (/^https:\/\/kolaboro\.com\/projects\/[a-z0-9-]+\/$/.test(s)) return '<td><a href="' + esc(s.replace('https://kolaboro.com', '')) + '">' + esc(s.split('/')[4]) + '</a></td>'; return '<td' + (typeof v === 'number' ? ' class="n"' : '') + '>' + esc(typeof v === 'number' ? nf(v) : s) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
        st.textContent = fill(M.q_rows, { n: nf(tb.numRows), ms: nf(Math.round(performance.now() - t0)) });
      }).catch(function (e) { st.textContent = M.q_err + ': ' + String(e && e.message || e).slice(0, 300); });
      try { history.replaceState(null, '', location.pathname + '#q=' + encodeURIComponent(text)); } catch (e) {}
    });
  }
  A.addEventListener('submit', function (e) { e.preventDefault(); ask(inp.value); });
  A.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; if (b.hasAttribute('data-q')) { inp.value = b.getAttribute('data-q'); ask(inp.value); } else if (b.id === 'n35-qag') ask(inp.value); });
  var h = /[#&]q=([^&]+)/.exec(location.hash); if (h) { try { inp.value = decodeURIComponent(h[1]); ask(inp.value); } catch (e) {} }
})(typeof window !== 'undefined' ? window : globalThis);
