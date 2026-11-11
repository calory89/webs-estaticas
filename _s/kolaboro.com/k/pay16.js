/* Kolaboro portal: "Payments vs progress" (pay16, 7 Nov 2026).
   A logged-in buyer enters the payment schedule of a saved project. We chart it against the project's monthly Sentinel-2 change index
   (/api/x/pay/series/<ID>, same numbers as the named page's "from space" section) and the developer's promised dates, and mark
   instalments that fall due while the images show no change beyond normal variation (±15 points). Facts only: it never says whether to pay.
   Storage: kolaboro_pay_schedules through the session-checked RPC kolaboro_pay_schedule (own rows only). English and Spanish. */
(function () {
  'use strict';
  var L = window.KB_LANG === 'es' ? 'es' : 'en', LOC = L === 'es' ? 'es-ES' : 'en-GB';
  var T = {
    en: {
      h: 'Payments vs progress',
      intro: 'Copy the payment schedule from your contract for a saved project. We put it on one timeline with monthly satellite images of the site and the developer\'s promised dates, and mark instalments that fall due while the images show no change beyond normal variation.',
      none_saved: 'Save a project from the database first', none_saved_p: 'Your payment schedule is kept per saved project.', browse: 'Browse the database',
      project: 'Project', unsaved: 'no longer saved', loading: 'Loading…',
      ch_h: 'Timeline', lg_ix: 'Change index of the site (points, not % built)', lg_band: 'Normal variation (±15)', lg_ms: 'Developer\'s promised date', lg_old: 'Earlier promised date', lg_paid: 'Paid by this date (% of price, your schedule)', lg_inst: 'Instalment', lg_flag: 'Instalment with no change beyond normal variation',
      aria: 'Change index of the site from {a} to {b}, with your instalments and the developer\'s promised dates',
      later: 'Promised after the chart ends: {x}.',
      no_series: 'No satellite series for this project. Its location in our records is not precise enough for a plot-level reading, so only your instalments and the developer\'s dates are shown.',
      no_named: 'We have no public record for this project, so there is no satellite series or promised date to compare with.',
      few_series: 'Clouds hid this site too often for a satellite series.',
      th: ['#', 'Instalment', 'Due', 'Share', 'Satellite, since the previous instalment', 'Reminder', ''],
      s_flat: 'No change beyond normal variation', s_moved: 'Change observed', s_few: 'Not enough clear months', s_later: 'No satellite months yet', s_before: 'Before the satellite series', s_none: 'No satellite series',
      d_x: '{a} to {b}: {x} points', d_up: 'Latest clear month {m}.', d_few: '{c} clear months between {a} and {b}.', d_later: 'Latest clear month {m}.', d_before: 'The series starts in {m}.',
      flags1: '{n} instalment falls due while the images show no change beyond normal variation since the previous one.', flagsN: '{n} instalments fall due while the images show no change beyond normal variation since the previous one.',
      flags0: 'No instalment falls due without change beyond normal variation in the images.',
      next: 'Next instalment: {l}, due {d} ({n}).', today: 'today', tomorrow: 'tomorrow', indays: 'in {n} days', ago: '{n} days ago',
      ask: 'Before an instalment that is marked, ask the developer for dated site photos of the same period.',
      rem: 'Email me 7 days before', rem_sent: 'Reminder sent {d}', rem_past: 'Past', rem_unver: 'Confirm your email to receive reminders. Reminders are sent only to a confirmed address.',
      edit: 'Edit', del: 'Delete', del_q: 'Delete this instalment?', empty_rows: 'No instalments yet for this project. Add the first one below.',
      f_h: 'Add an instalment', f_eh: 'Edit instalment', f_label: 'Instalment', f_label_ph: 'e.g. 2nd instalment', f_due: 'Due date', f_kind: 'Share or amount', f_pct: '% of price', f_amt: 'Amount', f_val: 'Value', f_cur: 'Currency',
      f_add: 'Add instalment', f_save: 'Save changes', f_cancel: 'Cancel', added: 'Added to the schedule', saved: 'Saved', deleted: 'Deleted', rem_on: 'Reminder on', rem_off: 'Reminder off',
      lim: 'Sentinel-2 pixels are 10 m. They show cleared ground, slabs, roofs and large cranes, not floors, interiors or quality of work. Clouds, season and haze also move the index. This is a prompt to ask the developer for dated site photos, not proof of progress or of a stop. We do not advise whether to pay.',
      private: 'Your schedule is private to your account. It is not shown to developers or on public pages.',
      src: 'Contains modified Copernicus Sentinel data, processed by Kolaboro', meth: 'Method and data', upd: 'satellite series updated {d}', page: 'Project page, from space',
      e_label: 'Give the instalment a name.', e_due: 'Enter a valid due date.', e_pct: 'Enter a percentage between 0 and 100 (up to 2 decimals).', e_amount: 'Enter an amount (numbers only, up to 2 decimals).', e_currency: 'Choose a currency.',
      e_value: 'Enter a percentage or an amount.', e_pct_total: 'The percentages for this project would add up to more than 100% ({n}% left).', e_not_saved: 'Save this project first.', e_limit: 'Limit reached for this project.',
      e_demo: 'This is the demo account: nothing is saved.', e_admin_view: 'Admin view: read only.', e_auth: 'Your session ended. Log in again.', e_network: 'Could not reach the server. Try again.', e_other: 'Could not save ({e}). Try again.',
      cal_btn: 'Add these dates to your calendar (.ics)', cal_note: 'The file is made in your browser from the schedule above. Nothing new is stored or sent.', cal_name: '{n}: my payments and promised dates', cal_inst: '{n}: instalment due, {l}', cal_inst_d: 'Instalment {i} of {t} in your schedule. {s}', cal_ms: '{n}: {k}, the developer\'s date ({p})', cal_ms_d: 'Date published by the developer: {p}. A period is placed on its last day. This is the developer\'s date, not a confirmation by Kolaboro.', cal_rem: 'Instalment due in 7 days: {l}', cal_src: 'Sources: {u}', cal_done: 'Calendar file saved', cal_proj: 'Project',
      ro: 'Read only.', k: { handover: 'Handover', construction_start: 'Start', structure: 'Topping out', milestone: 'Milestone', permit: 'Permit', rental: 'Rental start' }
    },
    es: {
      h: 'Pagos frente a avance',
      intro: 'Copia el calendario de pagos de tu contrato para un proyecto guardado. Lo ponemos en una misma línea de tiempo con las imágenes mensuales del satélite sobre la obra y las fechas que promete el promotor, y marcamos las cuotas que vencen mientras las imágenes no muestran cambio por encima de la variación normal.',
      none_saved: 'Primero guarda un proyecto de la base de datos', none_saved_p: 'Tu calendario de pagos se guarda por proyecto guardado.', browse: 'Ver la base de datos',
      project: 'Proyecto', unsaved: 'ya no guardado', loading: 'Cargando…',
      ch_h: 'Línea de tiempo', lg_ix: 'Índice de cambio de la obra (puntos, no % construido)', lg_band: 'Variación normal (±15)', lg_ms: 'Fecha prometida por el promotor', lg_old: 'Fecha prometida anterior', lg_paid: 'Pagado a esa fecha (% del precio, tu calendario)', lg_inst: 'Cuota', lg_flag: 'Cuota sin cambio por encima de la variación normal',
      aria: 'Índice de cambio de la obra de {a} a {b}, con tus cuotas y las fechas prometidas por el promotor',
      later: 'Prometido después del final del gráfico: {x}.',
      no_series: 'No hay serie de satélite para este proyecto. Su ubicación en nuestros registros no es lo bastante precisa para leer la parcela, así que solo se muestran tus cuotas y las fechas del promotor.',
      no_named: 'No tenemos ficha pública de este proyecto, así que no hay serie de satélite ni fechas prometidas con las que comparar.',
      few_series: 'Las nubes taparon esta obra demasiadas veces para tener una serie de satélite.',
      th: ['#', 'Cuota', 'Vence', 'Importe', 'Satélite, desde la cuota anterior', 'Recordatorio', ''],
      s_flat: 'Sin cambio por encima de la variación normal', s_moved: 'Cambio observado', s_few: 'Pocos meses despejados', s_later: 'Aún no hay meses de satélite', s_before: 'Antes de la serie de satélite', s_none: 'Sin serie de satélite',
      d_x: '{a} a {b}: {x} puntos', d_up: 'Último mes despejado: {m}.', d_few: '{c} meses despejados entre {a} y {b}.', d_later: 'Último mes despejado: {m}.', d_before: 'La serie empieza en {m}.',
      flags1: '{n} cuota vence mientras las imágenes no muestran cambio por encima de la variación normal desde la anterior.', flagsN: '{n} cuotas vencen mientras las imágenes no muestran cambio por encima de la variación normal desde la anterior.',
      flags0: 'Ninguna cuota vence sin cambio por encima de la variación normal en las imágenes.',
      next: 'Próxima cuota: {l}, vence el {d} ({n}).', today: 'hoy', tomorrow: 'mañana', indays: 'en {n} días', ago: 'hace {n} días',
      ask: 'Antes de una cuota marcada, pide al promotor fotos de obra con fecha del mismo periodo.',
      rem: 'Avísame por email 7 días antes', rem_sent: 'Recordatorio enviado el {d}', rem_past: 'Pasada', rem_unver: 'Confirma tu email para recibir recordatorios. Solo se envían a una dirección confirmada.',
      edit: 'Editar', del: 'Borrar', del_q: '¿Borrar esta cuota?', empty_rows: 'Aún no hay cuotas para este proyecto. Añade la primera abajo.',
      f_h: 'Añadir una cuota', f_eh: 'Editar cuota', f_label: 'Cuota', f_label_ph: 'p. ej. 2.ª cuota', f_due: 'Fecha de vencimiento', f_kind: 'Porcentaje o importe', f_pct: '% del precio', f_amt: 'Importe', f_val: 'Valor', f_cur: 'Moneda',
      f_add: 'Añadir cuota', f_save: 'Guardar cambios', f_cancel: 'Cancelar', added: 'Añadida al calendario', saved: 'Guardado', deleted: 'Borrada', rem_on: 'Recordatorio activado', rem_off: 'Recordatorio desactivado',
      lim: 'Los píxeles de Sentinel-2 miden 10 m. Muestran terreno despejado, losas, tejados y grúas grandes, no plantas, interiores ni calidad de obra. Las nubes, la estación y la bruma también mueven el índice. Es una señal para pedir al promotor fotos de obra con fecha, no una prueba de avance ni de parada. No te aconsejamos si pagar o no.',
      private: 'Tu calendario es privado de tu cuenta. No se muestra a los promotores ni en páginas públicas.',
      src: 'Contiene datos modificados de Copernicus Sentinel, procesados por Kolaboro', meth: 'Método y datos', upd: 'serie de satélite actualizada el {d}', page: 'Ficha del proyecto, desde el espacio',
      e_label: 'Ponle un nombre a la cuota.', e_due: 'Introduce una fecha válida.', e_pct: 'Introduce un porcentaje entre 0 y 100 (hasta 2 decimales).', e_amount: 'Introduce un importe (solo números, hasta 2 decimales).', e_currency: 'Elige una moneda.',
      e_value: 'Introduce un porcentaje o un importe.', e_pct_total: 'Los porcentajes de este proyecto sumarían más del 100 % (quedan {n} %).', e_not_saved: 'Primero guarda este proyecto.', e_limit: 'Has llegado al límite para este proyecto.',
      e_demo: 'Es la cuenta de demostración: no se guarda nada.', e_admin_view: 'Vista de administrador: solo lectura.', e_auth: 'Tu sesión ha terminado. Vuelve a entrar.', e_network: 'No se pudo conectar con el servidor. Inténtalo de nuevo.', e_other: 'No se pudo guardar ({e}). Inténtalo de nuevo.',
      cal_btn: 'Añadir estas fechas a tu calendario (.ics)', cal_note: 'El archivo se crea en tu navegador a partir del calendario de arriba. No se guarda ni se envía nada nuevo.', cal_name: '{n}: mis pagos y fechas prometidas', cal_inst: '{n}: vence el plazo, {l}', cal_inst_d: 'Plazo {i} de {t} de tu calendario. {s}', cal_ms: '{n}: {k}, fecha del promotor ({p})', cal_ms_d: 'Fecha publicada por el promotor: {p}. Un periodo se coloca en su último día. Es la fecha del promotor, no una confirmación de Kolaboro.', cal_rem: 'Plazo que vence en 7 días: {l}', cal_src: 'Fuentes: {u}', cal_done: 'Archivo de calendario guardado', cal_proj: 'Proyecto',
      ro: 'Solo lectura.', k: { handover: 'Entrega', construction_start: 'Inicio', structure: 'Estructura', milestone: 'Hito', permit: 'Licencia', rental: 'Alquiler' }
    }
  };
  function t(k, v) { var s = T[L][k] != null ? T[L][k] : T.en[k]; if (s == null) return k; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var BAND = 15, CUR = ['EUR', 'USD', 'GBP', 'AED', 'IDR', 'THB', 'MYR', 'SGD', 'AUD', 'CHF', 'SAR', 'QAR', 'TRY', 'MXN', 'CAD', 'CNY', 'RUB', 'JPY', 'INR', 'PHP', 'VND', 'XCD', 'BRL', 'ZAR'];

  // ---- months and dates (month index = year * 12 + month - 1)
  function mi(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; }
  function ym(i) { return Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0'); }
  var FM = new Intl.DateTimeFormat(LOC, { month: 'short', year: 'numeric', timeZone: 'UTC' }), FD = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  function fm(i) { return FM.format(new Date(Date.UTC(Math.floor(i / 12), i % 12, 1))); }
  function fd(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? FD.format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))) : ''; }
  function fdp(s) {   // a promised date or period as written in our data (2028, 2028-Q2, 2028-H1, 2028-05)
    var x = String(s || ''), m;
    if ((m = x.match(/^(\d{4})-([QH][1-4])$/i))) return m[2].toUpperCase() + ' ' + m[1];
    if ((m = x.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/))) return m[3] ? fd(x) : fm(+m[1] * 12 + (+m[2] - 1));
    return x;
  }
  function span(d) {
    var s = String(d || '').trim(), m;
    if ((m = s.match(/^(\d{4})-Q([1-4])$/i))) { var a = +m[1] * 12 + (+m[2] - 1) * 3; return [a, a + 2]; }
    if ((m = s.match(/^(\d{4})-H([12])$/i))) { var b = +m[1] * 12 + (+m[2] - 1) * 6; return [b, b + 5]; }
    if ((m = s.match(/^(\d{4})-(\d{2})/))) { var c = +m[1] * 12 + (+m[2] - 1); return [c, c]; }
    if ((m = s.match(/^(\d{4})$/))) return [+m[1] * 12, +m[1] * 12 + 11];
    return null;
  }
  function today() { var d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
  function daysTo(s) { var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - today()) / 864e5) : null; }
  function median(a) { var v = a.slice().sort(function (x, y) { return x - y; }), h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; }
  function num(v, max) { return new Intl.NumberFormat(LOC, { maximumFractionDigits: max == null ? 2 : max }).format(+v); }
  function money(v, c) { try { return new Intl.NumberFormat(LOC, { style: 'currency', currency: c, maximumFractionDigits: 2, minimumFractionDigits: +v % 1 ? 2 : 0 }).format(+v); } catch (e) { return num(v) + ' ' + c; } }
  function share(p) { return [p.pct != null ? num(p.pct) + '%' : '', p.amount != null ? money(p.amount, p.currency) : ''].filter(Boolean).join(' · '); }

  // ---- the comparison. For instalment k: from the previous instalment (or the series baseline, the first 3 clear months) to this one,
  // the change index at the end (median of the last up to 3 clear months inside the window) minus the index at the start (median of the
  // last up to 3 clear months on or before the previous instalment; 0 for the baseline). Under ±15 points = no change beyond normal variation.
  function compare(rows, S) {
    var ser = S && S.series, y = ser && ser.y;
    if (!y) return rows.map(function () { return { s: 'none' }; });
    var m0 = mi(ser.m0), clear = [];
    for (var i = 0; i < y.length; i++) if (y[i] != null) clear.push(m0 + i);
    var val = function (m) { return y[m - m0]; }, first = clear[0], baseEnd = clear[2], lastC = clear[clear.length - 1];
    return rows.map(function (p, k) {
      var D = mi(p.due), A = k ? mi(rows[k - 1].due) : null, out = { m: lastC };
      if (D < first) return Object.assign(out, { s: 'before' });
      var fromBase = A == null || A < baseEnd, a = fromBase ? first : A, start = fromBase ? baseEnd : A;
      var la = fromBase ? 0 : median(clear.filter(function (m) { return m <= A; }).slice(-3).map(val));
      var E = Math.min(D, lastC), win = clear.filter(function (m) { return m > start && m <= E; });
      Object.assign(out, { a: a, b: E, up: D > lastC });
      if (start >= lastC) return { s: 'later', m: lastC };
      if (win.length < 2) return Object.assign(out, { s: 'few', c: win.length });
      var x = Math.round(median(win.slice(-3).map(val)) - la);
      return Object.assign(out, { s: Math.abs(x) < BAND ? 'flat' : 'moved', x: x });
    });
  }

  // ---- state
  var ST = { items: null, verified: true, ro: false, ref: null, series: {}, edit: null, kind: null, ctx: null, el: null, scrolled: false, obsSent: {} };
  try { ST.kind = localStorage.getItem('kb-pay-kind'); } catch (e) {}
  function api(action, payload) {
    var c = ST.ctx;
    return c.rpc('kolaboro_pay_schedule', { p_token: c.token, p_action: action, p_payload: payload || {} }).catch(function () { return { error: 'network' }; });
  }
  function series(ref) {
    if (!ST.series[ref]) ST.series[ref] = fetch('/api/x/pay/series/' + encodeURIComponent(ref)).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return ST.series[ref];
  }
  function errText(d) {
    var e = (d && d.error) || 'other';
    if (e === 'pct_total') return t('e_pct_total', { n: num(d.pct_left || 0) });
    return T[L]['e_' + e] ? t('e_' + e) : t('e_other', { e: e });
  }
  function toast(s, kind) { if (window.kDS && kDS.toast) kDS.toast(s, kind || 'info'); else if (ST.ctx && ST.ctx.toast) ST.ctx.toast(s); }
  function refs() {
    var saved = (ST.ctx.refs || []).map(function (r) { return String(r).toUpperCase(); });
    var orphan = (ST.items || []).filter(function (p) { return !p.saved; }).map(function (p) { return p.ref; });
    return { saved: saved, all: saved.concat(orphan.filter(function (r, i, a) { return saved.indexOf(r) < 0 && a.indexOf(r) === i; })) };
  }

  // ---- chart (inline SVG, sized to the card)
  function chart(rows, cmp, S) {
    var ser = S && S.series, y = ser && ser.y, el = ST.el;
    var W = Math.max(300, Math.min(780, ((el && el.clientWidth) || 700) - 2)), narrow = W < 520;
    var ms = ((S && S.milestones) || []).map(function (o) { var sp = span(o.d); return sp ? { k: o.k, d: o.d, old: o.old, a: sp[0], b: sp[1] } : null; }).filter(Boolean);
    var due = rows.map(function (p) { return mi(p.due); });
    var m0 = y ? mi(ser.m0) : null, mEnd = y ? m0 + ser.n - 1 : null;
    var lo = Math.min.apply(null, (y ? [m0] : []).concat(due.length ? [Math.min.apply(null, due)] : []).concat(!y && !due.length ? ms.filter(function (o) { return !o.old; }).map(function (o) { return o.a; }) : []));
    var hiBase = Math.max.apply(null, (y ? [mEnd] : []).concat(due).concat([mi(new Date().toISOString())]));
    var fut = ms.filter(function (o) { return !o.old && o.a > hiBase; }).map(function (o) { return o.b; });
    var hi = Math.min(Math.max.apply(null, [hiBase].concat(fut)) + 2, hiBase + 48);
    if (!isFinite(lo) || !isFinite(hi)) return '';
    lo -= 1; if (hi - lo < 12) hi = lo + 12;
    var lim = 30;
    if (y) { var mx = 0; y.forEach(function (v) { if (v != null) mx = Math.max(mx, Math.abs(v)); }); lim = Math.max(30, Math.min(100, Math.ceil(mx / 10) * 10 + 10)); }
    var pctRows = rows.filter(function (p) { return p.pct != null; }), hasPaid = pctRows.length > 0;
    var Lp = 36, Rp = hasPaid ? 40 : 10, Tp = 36, ih = narrow ? 170 : 180, Bp = 50, H = Tp + ih + Bp, iw = W - Lp - Rp;
    var X = function (i) { return Lp + (i - lo) / (hi - lo) * iw; }, Y = function (v) { return Tp + ih / 2 - v / lim * ih / 2; }, YP = function (v) { return Tp + ih - v / 100 * ih; };
    var g = '';
    if (y) {
      g += '<rect class="bd" x="' + Lp + '" y="' + Y(BAND) + '" width="' + iw + '" height="' + (Y(-BAND) - Y(BAND)) + '"/>';
      [-lim, -lim / 2, 0, lim / 2, lim].forEach(function (v) { g += '<line class="' + (v ? 'gl' : 'ax') + '" x1="' + Lp + '" x2="' + (W - Rp) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text x="' + (Lp - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + (v > 0 ? '+' : '') + v + '</text>'; });
    } else g += '<line class="ax" x1="' + Lp + '" x2="' + (W - Rp) + '" y1="' + (Tp + ih) + '" y2="' + (Tp + ih) + '"/>';
    if (hasPaid) [0, 50, 100].forEach(function (v) { g += '<text class="rp" x="' + (W - Rp + 6) + '" y="' + (YP(v) + 4) + '">' + v + '%</text>'; });
    var y0 = Math.floor(lo / 12), y1 = Math.floor(hi / 12), step = y1 - y0 > (narrow ? 4 : 7) ? 2 : 1;
    for (var yr = y0 + 1; yr <= y1; yr += step) { var xx = X(yr * 12); if (xx > Lp && xx < W - Rp) g += '<line class="gl" x1="' + xx + '" x2="' + xx + '" y1="' + Tp + '" y2="' + (Tp + ih) + '"/><text x="' + xx + '" y="' + (H - 6) + '" text-anchor="middle">' + yr + '</text>'; }
    // developer's promised dates (labels in two rows; a label that fits neither row is left out, the line keeps its tooltip)
    var rowsL = [[], []], cw = 6.2;
    ms.filter(function (o) { return o.b >= lo && o.a <= hi; }).sort(function (a, b) { return a.a - b.a; }).forEach(function (o) {
      var xa = X(Math.max(o.a, lo)), xb = X(Math.min(o.b + 1, hi)), tip = esc((t('k')[o.k] || o.k) + ': ' + fdp(o.d));
      if (o.b > o.a && !o.old) g += '<rect class="ms" x="' + xa.toFixed(1) + '" y="' + Tp + '" width="' + Math.max(2, xb - xa).toFixed(1) + '" height="' + ih + '"><title>' + tip + '</title></rect>';
      g += '<line class="' + (o.old ? 'mo' : 'ml') + '" x1="' + xa.toFixed(1) + '" x2="' + xa.toFixed(1) + '" y1="' + (Tp - 4) + '" y2="' + (Tp + ih) + '"><title>' + tip + '</title></line>';
      if (o.old) return;
      var txt = (t('k')[o.k] || o.k) + ' ' + fdp(o.d), tw = txt.length * cw, end = xa + 4 + tw > W - Rp, x0 = end ? xa - 4 - tw : xa + 4, x1 = x0 + tw;
      var r = rowsL.findIndex(function (rw) { return rw.every(function (q) { return x1 + 6 < q[0] || x0 > q[1] + 6; }); });
      if (r < 0) return; rowsL[r].push([x0, x1]);
      g += '<text class="mt" x="' + (end ? xa - 4 : xa + 4).toFixed(1) + '" y="' + (Tp - 8 - r * 13) + '" text-anchor="' + (end ? 'end' : 'start') + '">' + esc(txt) + '</text>';
    });
    // cumulative share paid (from instalments entered as % of price)
    if (hasPaid) {
      var cum = 0, d = 'M' + X(lo).toFixed(1) + ' ' + YP(0).toFixed(1);
      pctRows.forEach(function (p) { var xm = X(mi(p.due) + 0.5); d += 'H' + xm.toFixed(1); cum = Math.min(100, cum + +p.pct); d += 'V' + YP(cum).toFixed(1); });
      d += 'H' + X(hi).toFixed(1);
      g += '<path class="pd" d="' + d + '"/>';
    }
    // change index: the line joins clear months across cloudy ones; each dot is a real month
    if (y) {
      var pts = []; y.forEach(function (v, i) { if (v != null) pts.push([X(m0 + i + 0.5), Y(v), i]); });
      if (pts.length) g += '<path class="lx" d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + '"/>';
      pts.forEach(function (p) { g += '<circle class="px" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.4"><title>' + esc(fm(m0 + p[2]) + ': ' + (y[p[2]] > 0 ? '+' : '') + y[p[2]]) + '</title></circle>'; });
    }
    // instalments: numbered markers under the plot; marked ones get a warning shape and the word in the table
    var yi = Tp + ih + 18;
    rows.forEach(function (p, k) {
      var xm = X(mi(p.due) + 0.5), f = cmp[k].s === 'flat', tip = esc((k + 1) + '. ' + p.label + ', ' + fd(p.due) + (share(p) ? ', ' + share(p) : '') + (f ? ': ' + t('s_flat') : ''));
      g += '<line class="il' + (f ? ' f' : '') + '" x1="' + xm.toFixed(1) + '" x2="' + xm.toFixed(1) + '" y1="' + Tp + '" y2="' + (yi - 9) + '"/>';
      g += '<g class="im' + (f ? ' f' : '') + '"><title>' + tip + '</title>' + (f ? '<path d="M' + xm.toFixed(1) + ' ' + (yi - 9) + 'l9 16h-18z"/>' : '<circle cx="' + xm.toFixed(1) + '" cy="' + yi + '" r="8"/>') +
        '<text x="' + xm.toFixed(1) + '" y="' + (yi + (f ? 6 : 4)) + '" text-anchor="middle">' + (k + 1) + '</text></g>';
    });
    var after = ms.filter(function (o) { return !o.old && o.a > hi; });
    var lg = '<ul class="kpay-lg">' + (y ? '<li><i class="lx"></i>' + esc(t('lg_ix')) + '</li><li><i class="bd"></i>' + esc(t('lg_band')) + '</li>' : '') + (ms.some(function (o) { return !o.old; }) ? '<li><i class="ml"></i>' + esc(t('lg_ms')) + '</li>' : '') + (ms.some(function (o) { return o.old; }) ? '<li><i class="mo"></i>' + esc(t('lg_old')) + '</li>' : '') +
      (hasPaid ? '<li><i class="pd"></i>' + esc(t('lg_paid')) + '</li>' : '') + (rows.length ? '<li><i class="im"></i>' + esc(t('lg_inst')) + '</li>' : '') + (cmp.some(function (c) { return c.s === 'flat'; }) ? '<li><i class="im f"></i>' + esc(t('lg_flag')) + '</li>' : '') + '</ul>';
    return '<figure class="kpay-ch"><div dir="ltr"><svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(t('aria', { a: fm(lo + 1), b: fm(hi) })) + '">' + g + '</svg></div>' + lg +
      (after.length ? '<figcaption>' + esc(t('later', { x: after.map(function (o) { return (t('k')[o.k] || o.k) + ' ' + fdp(o.d); }).join('; ') })) + '</figcaption>' : '') + '</figure>';
  }

  function statusCell(c) {
    var cls = { flat: 'warn', moved: 'info', few: 'plain', later: 'plain', before: 'plain', none: 'plain' }[c.s], det = '';
    if (c.s === 'flat' || c.s === 'moved') det = t('d_x', { a: fm(c.a), b: fm(c.b), x: (c.x > 0 ? '+' : '') + c.x }) + (c.up ? ' ' + t('d_up', { m: fm(c.m) }) : '');
    else if (c.s === 'few') det = t('d_few', { c: c.c, a: fm(c.a), b: fm(c.b) });
    else if (c.s === 'later') det = t('d_later', { m: fm(c.m) });
    else if (c.s === 'before') det = t('d_before', { m: fm(c.m) });
    return '<span class="k-badge k-badge--' + cls + '">' + esc(t('s_' + c.s)) + '</span>' + (det ? '<small>' + esc(det) + '</small>' : '');
  }

  function formHtml(ref, e) {
    var kind = e ? (e.pct != null ? 'pct' : 'amt') : (ST.kind === 'amt' ? 'amt' : 'pct'), cur = (e && e.currency) || (function () { try { return localStorage.getItem('kb-pay-cur'); } catch (x) { return null; } })() || 'EUR';
    var v = e ? (kind === 'pct' ? e.pct : e.amount) : '';
    return '<form class="kpay-f" id="kpay-f" novalidate><h3>' + esc(t(e ? 'f_eh' : 'f_h')) + '</h3><div class="kpay-fg">' +
      '<div class="k-field kpay-wl"><label class="k-label" for="kpay-l">' + esc(t('f_label')) + '</label><input class="k-input" id="kpay-l" name="label" required maxlength="120" placeholder="' + esc(t('f_label_ph')) + '" value="' + esc(e ? e.label : '') + '"></div>' +
      '<div class="k-field"><label class="k-label" for="kpay-d">' + esc(t('f_due')) + '</label><input class="k-input" id="kpay-d" name="due" type="date" required min="2000-01-01" max="2100-12-31" value="' + esc(e ? e.due : '') + '"></div>' +
      '<div class="k-field"><span class="k-label" id="kpay-kl">' + esc(t('f_kind')) + '</span><div class="k-seg" role="group" aria-labelledby="kpay-kl"><button type="button" data-kind="pct" aria-pressed="' + (kind === 'pct') + '">' + esc(t('f_pct')) + '</button><button type="button" data-kind="amt" aria-pressed="' + (kind === 'amt') + '">' + esc(t('f_amt')) + '</button></div></div>' +
      '<div class="k-field"><label class="k-label" for="kpay-v">' + esc(t(kind === 'pct' ? 'f_pct' : 'f_amt')) + '</label><input class="k-input" id="kpay-v" name="value" required inputmode="decimal" maxlength="16" value="' + esc(v == null ? '' : v) + '"></div>' +
      (kind === 'amt' ? '<div class="k-field"><label class="k-label" for="kpay-c">' + esc(t('f_cur')) + '</label><select class="k-select" id="kpay-c" name="currency">' + CUR.concat(CUR.indexOf(cur) < 0 ? [cur] : []).map(function (c) { return '<option' + (c === cur ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' : '') +
      '</div>' + (e ? '' : '<label class="kpay-ck"><input type="checkbox" name="remind"> ' + esc(t('rem')) + '</label>') +
      '<p class="k-err" id="kpay-err" role="alert" hidden></p><div class="kpay-fa"><button class="k-btn" type="submit">' + esc(t(e ? 'f_save' : 'f_add')) + '</button>' + (e ? '<button class="k-btn k-btn--ghost" type="button" data-act="cancel">' + esc(t('f_cancel')) + '</button>' : '') + '</div></form>';
  }

  function render() {
    var el = ST.el; if (!el || !el.isConnected) return;
    var R = refs();
    var h = '<h2>' + esc(t('h')) + '</h2><p class="ap-small ap-muted kpay-in">' + esc(t('intro')) + '</p>';
    if (!R.all.length) { el.innerHTML = h + '<div class="k-empty"><strong>' + esc(t('none_saved')) + '</strong><p>' + esc(t('none_saved_p')) + '</p><a class="k-btn" href="/database/">' + esc(t('browse')) + '</a></div>'; return; }
    if (!ST.ref || R.all.indexOf(ST.ref) < 0) ST.ref = R.all[0];
    var ref = ST.ref;
    h += '<div class="k-field kpay-sel"><label class="k-label" for="kpay-p">' + esc(t('project')) + '</label><select class="k-select" id="kpay-p">' + R.all.map(function (r) {
      var s = ST.series[r] && ST.series[r].v, nm = s && s.name ? s.name + ' (' + r + ')' : r;
      return '<option value="' + esc(r) + '"' + (r === ref ? ' selected' : '') + '>' + esc(nm + (R.saved.indexOf(r) < 0 ? ', ' + t('unsaved') : '')) + '</option>'; }).join('') + '</select></div>';
    if (ST.items === null || !ST.series[ref] || !ST.series[ref].done) { el.innerHTML = h + '<div aria-busy="true"><div class="k-skel k-skel--block" style="height:180px"></div><p class="ap-small ap-muted">' + esc(t('loading')) + '</p></div>'; bind(); return; }
    var S = ST.series[ref].v, rows = ST.items.filter(function (p) { return p.ref === ref; }).sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : a.id - b.id; });
    var cmp = compare(rows, S);
    if (ST.ro) h += '<p class="ap-small ap-muted">' + esc(t('ro')) + '</p>';
    // facts summary
    var sum = [], nf = cmp.filter(function (c) { return c.s === 'flat'; }).length, nxt = rows.filter(function (p) { return daysTo(p.due) >= 0; })[0];
    if (nxt) { var dd = daysTo(nxt.due); sum.push(esc(t('next', { l: nxt.label, d: fd(nxt.due), n: dd === 0 ? t('today') : dd === 1 ? t('tomorrow') : t('indays', { n: dd }) }))); }
    if (rows.length && S && S.series && S.series.y) sum.push('<b>' + esc(nf ? t(nf === 1 ? 'flags1' : 'flagsN', { n: nf }) : t('flags0')) + '</b>' + (nf ? ' ' + esc(t('ask')) : ''));
    if (!S || !S.named) sum.push(esc(t('no_named'))); else if (!S.series) sum.push(esc(t('no_series'))); else if (!S.series.y) sum.push(esc(t('few_series')));
    if (sum.length) h += '<ul class="kpay-sum">' + sum.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    h += chart(rows, cmp, S);
    if (!ST.verified && rows.some(function (p) { return p.remind && !p.reminded_at; })) h += '<div class="k-alert k-alert--warn" role="status"><span>' + esc(t('rem_unver')) + '</span></div>';
    if (rows.length) {
      var th = t('th');
      h += '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack kpay-t"><thead><tr>' + th.map(function (x, i) { return '<th' + (i === 0 ? ' class="k-n"' : '') + '>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (p, k) {
        var dd = daysTo(p.due), rem = p.reminded_at ? '<small>' + esc(t('rem_sent', { d: fd(p.reminded_at) })) + '</small>' : dd != null && dd < 1 ? '<small>' + esc(t('rem_past')) + '</small>' :
          '<label class="kpay-ck"><input type="checkbox" data-rem="' + p.id + '"' + (p.remind ? ' checked' : '') + (ST.ro ? ' disabled' : '') + '> ' + esc(t('rem')) + '</label>';
        return '<tr class="' + (cmp[k].s === 'flat' ? 'is-f' : '') + '"><td class="k-n" data-label="' + esc(th[0]) + '">' + (k + 1) + '</td><td data-label="' + esc(th[1]) + '">' + esc(p.label) + '</td><td data-label="' + esc(th[2]) + '">' + esc(fd(p.due)) + '</td><td class="k-n" data-label="' + esc(th[3]) + '">' + esc(share(p)) + '</td>' +
          '<td data-label="' + esc(th[4]) + '" class="kpay-s">' + statusCell(cmp[k]) + '</td><td data-label="' + esc(th[5]) + '">' + rem + '</td><td class="kpay-a">' + (ST.ro ? '' : '<button type="button" class="k-btn k-btn--ghost k-btn--sm" data-edit="' + p.id + '">' + esc(t('edit')) + '</button><button type="button" class="k-btn k-btn--ghost k-btn--sm" data-del="' + p.id + '">' + esc(t('del')) + '</button>') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    } else h += '<p class="ap-small ap-muted">' + esc(t('empty_rows')) + '</p>';
    // n21d: the buyer's own schedule and the developer's promised dates as a calendar file, made in the browser (nothing new stored or sent)
    if (rows.length || ((S && S.milestones) || []).some(function (o) { return !o.old && span(o.d); })) h += '<p class="kpay-cal"><button type="button" class="k-btn k-btn--sm" data-act="ics">' + esc(t('cal_btn')) + '</button> <span class="ap-small ap-muted">' + esc(t('cal_note')) + '</span></p>';
    if (!ST.ro && R.saved.indexOf(ref) >= 0) h += formHtml(ref, ST.edit && rows.filter(function (p) { return p.id === ST.edit; })[0]);
    var src = S && S.source;
    h += '<p class="kpay-lim">' + esc(t('lim')) + '</p><p class="ap-small ap-muted kpay-src">' + esc(t('private')) + (src ? ' ' + esc(t('src')) + '. <a class="k-src" href="' + esc(src.url) + '" rel="noopener" target="_blank">Copernicus Sentinel-2 L2A</a> <a class="k-src" href="' + esc(src.method) + '">' + esc(t('meth')) + ', ' + esc(t('upd', { d: fd(S.updated) })) + '</a>' : '') +
      (S && S.page_section ? ' <a class="k-src" href="' + esc(S.page_section) + '">' + esc(t('page')) + '</a>' : '') + '</p>';
    el.classList.toggle('is-narrow', el.clientWidth < 720); el.innerHTML = h; bind();
    syncObs(rows, cmp);
    if (!ST.scrolled && location.hash === '#kpay') { ST.scrolled = true; el.scrollIntoView(); }
  }

  // n21d: iCalendar (RFC 5545) built on the device from the rows on screen: one all-day entry per instalment (with a reminder 7 days
  // before) and one per current promised date of the developer (a period goes on its last day)
  function icsText(rows, S, ref) {
    var X = function (v) { return String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); };
    var fold = function (line) { var out = [], cur = '', n = 0, enc = new TextEncoder(); Array.from(line).forEach(function (ch) { var b = enc.encode(ch).length; if (n + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; n = 0; } cur += ch; n += b; }); out.push(cur); return out.join('\r\n '); };
    var p2 = function (n) { return String(n).padStart(2, '0'); }, ymd = function (d) { return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()); };
    var now = new Date(), stamp = ymd(now) + 'T' + p2(now.getUTCHours()) + p2(now.getUTCMinutes()) + p2(now.getUTCSeconds()) + 'Z';
    var name = (S && S.name) || ref, page = S && S.url ? 'https://kolaboro.com' + S.url + '#delivery' : '', portal = 'https://kolaboro.com/portal/#kpay=' + ref;
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kolaboro//Payments and promised dates 1.0//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + X(t('cal_name', { n: name }))];
    var ev = function (uid, day, sum, desc, url, alarm) {
      var d = new Date(day), e = new Date(day + 864e5);
      L.push('BEGIN:VEVENT', 'UID:' + uid + '@kolaboro.com', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + ymd(d), 'DTEND;VALUE=DATE:' + ymd(e), 'SUMMARY:' + X(sum), 'DESCRIPTION:' + X(desc));
      if (url) L.push('URL:' + url);
      L.push('TRANSP:TRANSPARENT');
      if (alarm) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + X(alarm), 'TRIGGER:-P7D', 'END:VALARM');
      L.push('END:VEVENT');
    };
    rows.forEach(function (p, k) {
      var m = String(p.due).match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return;
      ev('pay-' + ref + '-' + p.id, Date.UTC(+m[1], +m[2] - 1, +m[3]), t('cal_inst', { n: name, l: p.label }), t('cal_inst_d', { i: k + 1, t: rows.length, s: share(p) }) + '\n' + portal, portal, t('cal_rem', { l: p.label }));
    });
    var seen = {};
    ((S && S.milestones) || []).forEach(function (o) {
      var sp = span(o.d); if (o.old || !sp || seen[o.k + o.d]) return; seen[o.k + o.d] = 1;
      var dm = String(o.d).match(/^(\d{4})-(\d{2})-(\d{2})$/), day = dm ? Date.UTC(+dm[1], +dm[2] - 1, +dm[3]) : Date.UTC(Math.floor(sp[1] / 12), sp[1] % 12 + 1, 0);
      ev('promise-' + ref + '-' + o.k + '-' + String(o.d).replace(/[^0-9A-Za-z]/g, ''), day, t('cal_ms', { n: name, k: t('k')[o.k] || o.k, p: fdp(o.d) }), t('cal_ms_d', { p: fdp(o.d) }) + (page ? '\n' + t('cal_src', { u: page }) : ''), page, null);
    });
    L.push('END:VCALENDAR');
    return L.map(fold).join('\r\n') + '\r\n';
  }
  function icsSave() {
    var ref = ST.ref, S = ST.series[ref] && ST.series[ref].v, rows = (ST.items || []).filter(function (p) { return p.ref === ref; }).sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : a.id - b.id; });
    var blob = new Blob([icsText(rows, S, ref)], { type: 'text/calendar;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'kolaboro-' + String(ref).toLowerCase() + '-payments.ics'; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast(t('cal_done'), 'ok');
  }

  // store what the chart showed, so an opt-in reminder can quote it with its month (structured fields only; the database validates them)
  function syncObs(rows, cmp) {
    if (ST.ro) return;
    var ch = [];
    rows.forEach(function (p, k) {
      var c = cmp[k], o = { id: p.id, s: c.s };
      if (c.a != null) o.a = ym(c.a); if (c.b != null) o.b = ym(c.b); if (c.m != null) o.m = ym(c.m); if (c.x != null) o.x = String(c.x);
      var old = p.obs || {}, same = old.s === o.s && old.a === o.a && old.b === o.b && old.m === o.m && (old.x == null ? null : String(old.x)) === (o.x == null ? null : o.x);
      var key = JSON.stringify(o);
      if (!same && ST.obsSent[p.id] !== key) { ST.obsSent[p.id] = key; ch.push(o); }
    });
    if (ch.length) api('obs', { items: ch });
  }

  function apply(d, okMsg) {
    if (!d || d.error) { if (d && d.error === 'auth') { location.href = '/login/?next=' + encodeURIComponent('/portal/#kpay'); return false; } return d || { error: 'other' }; }
    ST.items = d.items || []; ST.verified = d.verified !== false; ST.ro = !!d.read_only;
    if (okMsg) toast(okMsg, 'ok');
    render(); return true;
  }

  function bind() {
    var el = ST.el;
    var sel = el.querySelector('#kpay-p');
    if (sel) sel.onchange = function () { ST.ref = sel.value; ST.edit = null; try { localStorage.setItem('kb-pay-ref', ST.ref); } catch (e) {} load(); };
    el.querySelectorAll('[data-kind]').forEach(function (b) { b.onclick = function () { ST.kind = b.dataset.kind; try { localStorage.setItem('kb-pay-kind', ST.kind); } catch (e) {} var f = el.querySelector('#kpay-f'), keep = f ? { l: f.label.value, d: f.due.value } : null; render(); var g = el.querySelector('#kpay-f'); if (g && keep) { g.label.value = keep.l; g.due.value = keep.d; } var v = el.querySelector('#kpay-v'); if (v) v.focus(); }; });
    el.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { if (!confirm(t('del_q'))) return; b.disabled = true; api('delete', { id: +b.dataset.del }).then(function (d) { var r = apply(d, t('deleted')); if (r !== true && r) toast(errText(r), 'bad'); }); }; });
    el.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { ST.edit = +b.dataset.edit; var p = ST.items.filter(function (x) { return x.id === ST.edit; })[0]; if (p) ST.kind = p.pct != null ? 'pct' : 'amt'; render(); var f = el.querySelector('#kpay-l'); if (f) { f.focus(); f.scrollIntoView({ block: 'center' }); } }; });
    el.querySelectorAll('[data-rem]').forEach(function (c) { c.onchange = function () { c.disabled = true; api('remind', { id: +c.dataset.rem, on: c.checked, lang: L }).then(function (d) { var r = apply(d, t(c.checked ? 'rem_on' : 'rem_off')); if (r !== true && r) { toast(errText(r), 'bad'); c.checked = !c.checked; c.disabled = false; } }); }; });
    var cn = el.querySelector('[data-act="cancel"]'); if (cn) cn.onclick = function () { ST.edit = null; render(); };
    var ic = el.querySelector('[data-act="ics"]'); if (ic) ic.onclick = icsSave;
    var f = el.querySelector('#kpay-f');
    if (f) f.onsubmit = function (e) {
      e.preventDefault();
      var err = el.querySelector('#kpay-err'), kind = ST.edit ? null : null, isPct = !!el.querySelector('[data-kind="pct"][aria-pressed="true"]');
      var raw = String(f.value.value || '').trim().replace(/\s/g, ''), v;
      // accept 25,5 or 1.250.000,50 or 1,250,000.50: the last separator followed by 1-2 digits is the decimal mark
      var m = raw.match(/^(.*?)[.,](\d{1,2})$/); v = m ? m[1].replace(/[.,']/g, '') + '.' + m[2] : raw.replace(/[.,']/g, '');
      var p = { ref: ST.ref, label: f.label.value.trim(), due: f.due.value, lang: L };
      if (isPct) p.pct = v; else { p.amount = v; p.currency = f.currency ? f.currency.value : 'EUR'; try { localStorage.setItem('kb-pay-cur', p.currency); } catch (x) {} }
      var bad = !p.label ? 'label' : !/^\d{4}-\d{2}-\d{2}$/.test(p.due) ? 'due' : !v ? 'value' : isPct && !(/^\d{1,3}(\.\d{1,2})?$/.test(v) && +v > 0 && +v <= 100) ? 'pct' : !isPct && !(/^\d{1,12}(\.\d{1,2})?$/.test(v) && +v > 0) ? 'amount' : null;
      var show = function (d) { err.textContent = errText(d); err.hidden = false; var fld = { label: 'kpay-l', due: 'kpay-d', pct: 'kpay-v', amount: 'kpay-v', value: 'kpay-v', pct_total: 'kpay-v', currency: 'kpay-c' }[d.error]; f.querySelectorAll('[aria-invalid]').forEach(function (x) { x.removeAttribute('aria-invalid'); }); var i = fld && el.querySelector('#' + fld); if (i) { i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', 'kpay-err'); i.focus(); } };
      if (bad) { show({ error: bad }); return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true; btn.insertAdjacentHTML('afterbegin', '<span class="k-spin"></span> ');
      var editing = ST.edit, keep = { l: p.label, d: p.due, v: f.value.value };
      if (editing) p.id = editing; else p.remind = !!(f.remind && f.remind.checked);
      api(editing ? 'update' : 'add', p).then(function (d) {
        if (d && !d.error) { ST.edit = null; apply(d, t(editing ? 'saved' : 'added')); var nf = el.querySelector('#kpay-l'); if (nf && !editing) nf.focus(); return; }
        if (d && d.error === 'auth') { apply(d); return; }
        btn.disabled = false; var sp = btn.querySelector('.k-spin'); if (sp) sp.remove(); show(d || { error: 'network' });
        f.label.value = keep.l; f.due.value = keep.d; f.value.value = keep.v;
      });
    };
  }

  function load() {
    render();
    var ref = ST.ref;   // n20f: read after render(), which picks the first saved project when none is chosen yet; read before, the chart of a first-time visitor stayed on "Loading…" until the next refresh
    var a = ST.items === null ? api('list', {}) : Promise.resolve(null);
    var b = ref ? series(ref) : Promise.resolve(null);
    return Promise.all([a, b]).then(function (r) {
      if (r[0]) { if (r[0].error) { if (r[0].error === 'auth') return apply(r[0]); ST.items = []; ST.err = r[0].error; } else { ST.items = r[0].items || []; ST.verified = r[0].verified !== false; ST.ro = !!r[0].read_only; } }
      if (ref) ST.series[ref] = Object.assign(ST.series[ref], { done: true, v: r[1] });
      if (!ST.ref) { var R = refs(); ST.ref = R.all[0] || null; if (ST.ref) return load(); }
      render();
      // names for the project picker (cached by the CDN for 10 minutes)
      refs().all.slice(0, 15).forEach(function (x) { if (!ST.series[x]) { series(x).then(function (v) { var was = ST.series[x].done; ST.series[x].done = true; ST.series[x].v = v; if (!was && x === ST.ref && ST.edit == null && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('#kpay-f'))) { render(); return; } var o = ST.el && ST.el.querySelector('#kpay-p option[value="' + x + '"]'); if (o && v && v.name) o.textContent = v.name + ' (' + x + ')' + (refs().saved.indexOf(x) < 0 ? ', ' + t('unsaved') : ''); }); } });
    });
  }

  var rz = null;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (ST.items && ST.ref && ST.series[ST.ref] && ST.series[ST.ref].done) render(); }, 200); });

  window.KBPay = {
    icsText: icsText,
    // ctx: { token, rpc(fn, body) -> Promise<json>, refs: [saved project refs], toast(text) }
    mount: function (el, ctx) {
      if (!el) return;
      ST.el = el; ST.ctx = ctx;
      if (!ST.ref) { try { ST.ref = (location.hash.match(/^#kpay=([A-Za-z0-9-]{3,20})$/) || [])[1] || localStorage.getItem('kb-pay-ref'); } catch (e) {} if (ST.ref) ST.ref = ST.ref.toUpperCase(); }
      load();
    },
    exportRows: function (ctx) { return (ctx || ST.ctx).rpc('kolaboro_pay_schedule', { p_token: (ctx || ST.ctx).token, p_action: 'export', p_payload: {} }).then(function (d) { return d && d.items ? d.items : null; }).catch(function () { return null; }); },
    _compare: compare
  };

  var css = document.createElement('style'); css.id = 'kpay-css';
  css.textContent = '#kpay .kpay-cal{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:var(--k-3) 0}#kpay .k-badge{white-space:normal;text-align:start;line-height:1.35}#kpay .kpay-in{margin-top:0}#kpay .kpay-sel{max-width:420px;margin:0 0 var(--k-3)}#kpay .kpay-sum{list-style:none;margin:0 0 var(--k-3);padding:0}#kpay .kpay-sum li{border-top:1px solid var(--k-line);padding:var(--k-2) 0;line-height:1.5;font-size:var(--k-fs-sm);color:var(--k-ink-2)}' +
    '#kpay .kpay-ch{margin:0 0 var(--k-4);padding:var(--k-3) 0 0;border-top:1px solid var(--k-line)}#kpay .kpay-ch>div{overflow-x:auto}#kpay svg{display:block;max-width:100%;height:auto;overflow:visible}#kpay svg text{fill:var(--k-muted);font-size:11px;font-variant-numeric:tabular-nums}' +
    '#kpay .ax{stroke:var(--k-line-2);stroke-width:1}#kpay .gl{stroke:var(--k-line);stroke-width:1;stroke-dasharray:2 4}#kpay .bd{fill:color-mix(in srgb,var(--k-sea) 9%,transparent)}#kpay .lx{fill:none;stroke:var(--k-sea);stroke-width:2.2;stroke-linejoin:round}#kpay .px{fill:var(--k-sea)}' +
    '#kpay .ms{fill:color-mix(in srgb,var(--k-ink) 7%,transparent)}#kpay .ml{stroke:var(--k-ink);stroke-width:1.5}#kpay .mo{stroke:var(--k-muted);stroke-width:1;stroke-dasharray:3 3}#kpay svg .mt{fill:var(--k-ink);font-weight:600}#kpay svg .rp{fill:var(--k-ink-2)}' +
    '#kpay .pd{fill:none;stroke:var(--k-ink-2);stroke-width:1.6;stroke-dasharray:6 3}#kpay .il{stroke:var(--k-line-2);stroke-width:1;stroke-dasharray:1 3}#kpay .il.f{stroke:var(--k-warn);stroke-dasharray:none;stroke-width:1.4}' +
    '#kpay .im circle{fill:var(--k-surface);stroke:var(--k-ink);stroke-width:1.4}#kpay svg .im text{fill:var(--k-ink);font-weight:700;font-size:10px}#kpay .im.f path{fill:var(--k-warn-bg);stroke:var(--k-warn);stroke-width:1.6;stroke-linejoin:round}#kpay svg .im.f text{fill:var(--k-warn)}' +
    '#kpay .kpay-lg{display:flex;flex-wrap:wrap;gap:6px 16px;list-style:none;margin:var(--k-2) 0 0;padding:0;font-size:var(--k-fs-xs);color:var(--k-muted)}#kpay .kpay-lg li{display:flex;align-items:center;gap:6px}#kpay .kpay-lg i{display:inline-block;width:18px;height:10px;flex:none}' +
    '#kpay .kpay-lg i.lx{border-top:2.2px solid var(--k-sea);height:0}#kpay .kpay-lg i.bd{background:color-mix(in srgb,var(--k-sea) 14%,transparent)}#kpay .kpay-lg i.ml{width:0;height:12px;border-inline-start:1.5px solid var(--k-ink)}#kpay .kpay-lg i.mo{width:0;height:12px;border-inline-start:1px dashed var(--k-muted)}' +
    '#kpay .kpay-lg i.pd{border-top:1.6px dashed var(--k-ink-2);height:0}#kpay .kpay-lg i.im{width:12px;height:12px;border-radius:50%;border:1.4px solid var(--k-ink)}#kpay .kpay-lg i.im.f{border:0;border-radius:0;background:var(--k-warn);clip-path:polygon(50% 0,100% 100%,0 100%)}' +
    '#kpay figcaption{font-size:var(--k-fs-xs);color:var(--k-muted);margin-top:var(--k-2)}#kpay .kpay-t td{vertical-align:top}#kpay .kpay-t .kpay-s small,#kpay .kpay-t td>small{display:block;color:var(--k-muted);font-size:var(--k-fs-xs);margin-top:4px;line-height:1.4}' +
    '#kpay .kpay-t tr.is-f{box-shadow:inset 3px 0 0 var(--k-warn)}#kpay .kpay-a{white-space:nowrap;text-align:end}#kpay .kpay-a .k-btn{min-height:36px}#kpay .kpay-ck{display:inline-flex;align-items:center;gap:8px;min-height:44px;cursor:pointer;font-size:var(--k-fs-sm)}#kpay .kpay-ck input{width:18px;height:18px;accent-color:var(--k-sea)}' +
    '#kpay .kpay-f{margin:var(--k-5) 0 0;padding:var(--k-4);border:1px solid var(--k-line);border-radius:var(--k-r-md);background:var(--k-sunken)}#kpay .kpay-f h3{margin:0 0 var(--k-3);font-size:var(--k-fs-md)}#kpay .kpay-fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:var(--k-3)}#kpay .kpay-wl{grid-column:1/-1}' +
    '#kpay .kpay-f .k-field{margin:0}#kpay .kpay-f .k-input,#kpay .kpay-f .k-select{width:100%;min-height:44px}#kpay .k-seg>*{min-height:38px}#kpay .kpay-fa{display:flex;gap:var(--k-2);flex-wrap:wrap;margin-top:var(--k-3)}#kpay .k-err[hidden]{display:none}' +
    '#kpay .kpay-lim{font-size:var(--k-fs-sm);color:var(--k-ink-2);line-height:1.55;margin:var(--k-4) 0 var(--k-2);max-width:72ch}#kpay .kpay-src{margin:0;line-height:1.6}#kpay .kpay-src .k-src{margin-inline-start:4px}#kpay .k-alert{margin:0 0 var(--k-3)}' +
    '#kpay.is-narrow{}#kpay.is-narrow .kpay-t thead{display:none}#kpay.is-narrow .kpay-t,#kpay.is-narrow .kpay-t tbody{display:block}#kpay.is-narrow .kpay-t tr{display:block;padding:10px 14px;border-bottom:1px solid var(--k-line)}#kpay.is-narrow .kpay-t td{display:flex;justify-content:space-between;gap:16px;padding:4px 0;border:0;text-align:end}' +
    '#kpay.is-narrow .kpay-t td::before{content:attr(data-label);color:var(--k-muted);text-align:start;font-weight:500;flex:none;max-width:45%}#kpay.is-narrow .kpay-t td:first-child{font-weight:700}#kpay.is-narrow .kpay-t td:first-child::before{content:none}' +
    '#kpay.is-narrow .kpay-t td.kpay-s{display:block;text-align:start}#kpay.is-narrow .kpay-t td.kpay-s::before{display:block;max-width:none;margin-bottom:4px}#kpay.is-narrow .kpay-t td.kpay-a{justify-content:flex-end}#kpay.is-narrow .kpay-t td.kpay-a::before{content:none}#kpay.is-narrow .kpay-t .kpay-ck{justify-content:flex-end}';
  (document.head || document.documentElement).appendChild(css);
})();
