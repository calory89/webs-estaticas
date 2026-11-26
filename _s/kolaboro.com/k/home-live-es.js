/* live system activity: real events from existing records, pushed by server-sent events (signed snapshots, checked in this browser) */
document.addEventListener('DOMContentLoaded', function () {
  var L = document.getElementById('lv-l'), ST = document.getElementById('lv-st'), DOT = document.getElementById('lv-dot'), KB = document.querySelector('[data-kvb="live"]');
  if (!L || !ST) return;
  var evs = [], known = null, mode = 'connecting', lastSnap = 0, es = null, errs = 0, pollT = null, kbEl = KB, upt = null;
  var KIND = { finding: 'Hallazgo, comprobado por código', checkrun: 'Revisión horaria', selftest: 'Autoprueba', eval: 'Control de calidad', log: 'Registro público', uptime: 'Disponibilidad', incident: 'Incidencia' };
  // the feed is written in English from fixed templates: each one has its Spanish version here, anything else is shown as received
  var NUM = function (x) { return (+x).toLocaleString('es-ES'); };
  var TX = [
    [/^(\d+) uptime probes? recorded from outside Cloudflare, all up \((\d+) of (\d+) up today\)$/, function (m) { return m[1] + (m[1] === '1' ? ' sonda de disponibilidad registrada' : ' sondas de disponibilidad registradas') + ' desde fuera de Cloudflare, todo en marcha (' + NUM(m[2]) + ' de ' + NUM(m[3]) + ' correctas hoy)'; }],
    [/^(\d+) uptime probes? recorded from outside Cloudflare, (\d+) not up \((\d+) of (\d+) up today\)$/, function (m) { return m[1] + ' sondas de disponibilidad registradas desde fuera de Cloudflare, ' + m[2] + ' con fallo (' + NUM(m[3]) + ' de ' + NUM(m[4]) + ' correctas hoy)'; }],
    [/^Hourly check read (\d+) developer pages: (\d+) findings?, (\d+) facts unchanged, (\d+) facts rejected by the quote check, ([\d.]+) USD$/, function (m) { return 'La revisión horaria leyó ' + NUM(m[1]) + ' páginas de promotores: ' + NUM(m[2]) + ' hallazgos, ' + NUM(m[3]) + ' datos sin cambios, ' + NUM(m[4]) + ' datos descartados por la comprobación de citas, ' + (+m[5]).toLocaleString('es-ES', { minimumFractionDigits: 3 }) + ' USD'; }],
    [/^End-to-end self-test passed, (\d+) of (\d+) steps$/, function (m) { return 'Autoprueba completa superada, ' + m[1] + ' de ' + m[2] + ' pasos'; }],
    [/^End-to-end self-test failed (\d+) of (\d+) steps$/, function (m) { return 'Autoprueba completa fallida en ' + m[1] + ' de ' + m[2] + ' pasos'; }],
    [/^desk review evaluation: (\d+) of (\d+) fixed test cases passed(?:, second model agreed on (\d+) of (\d+) fields)?$/, function (m) { return 'Control de calidad de la revisión: ' + m[1] + ' de ' + m[2] + ' casos de prueba fijos superados' + (m[3] ? ', una segunda lectura coincidió en ' + m[3] + ' de ' + m[4] + ' campos' : ''); }],
    [/^Public log line for (\d{1,2}) ([A-Z][a-z]{2}) witnessed in Sigstore Rekor \(entry (\d+), (\d+) project fingerprints\)$/, function (m) { var mo = { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sept', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[m[2]] || m[2]; return 'Línea del registro público del ' + m[1] + ' ' + mo + ' atestiguada en Sigstore Rekor (entrada ' + m[3] + ', ' + NUM(m[4]) + ' huellas de proyectos)'; }],
    [/^Uptime incident recorded(?: on (.+))?$/, function (m) { return 'Incidencia de disponibilidad registrada' + (m[1] ? ' en ' + m[1] : ''); }],
    [/^([A-Z]{2,5}-\d{3,4}) · (.+)$/, function (m) { var r = FX(m[2]); return r == null ? null : m[1] + ' · ' + r; }]
  ];
  var band = function (b) { return b.replace(/^the /, '').replace(/^under (\$[\d.,]+[km]?) band$/, 'por debajo de $1').replace(/^(\$[\d.,]+[km]?) to (\$[\d.,]+[km]?) band$/, 'entre $1 y $2').replace(/^(\$[\d.,]+[km]?) and up band$/, 'desde $1'); };
  var MES = { January: 'enero', February: 'febrero', March: 'marzo', April: 'abril', May: 'mayo', June: 'junio', July: 'julio', August: 'agosto', September: 'septiembre', October: 'octubre', November: 'noviembre', December: 'diciembre' };
  function FX(t) {
    var m;
    if ((m = t.match(/^payment plan stated: (\d+%) due on booking$/))) return 'plan de pagos publicado: ' + m[1] + ' al reservar';
    if ((m = t.match(/^developer page claims (\d+) units? left, a sales claim we cannot verify$/))) return 'la web del promotor dice que quedan ' + m[1] + (m[1] === '1' ? ' unidad' : ' unidades') + ', un reclamo de venta que no podemos verificar';
    if ((m = t.match(/^developer page states construction at (\d+%),? a claim to compare with photos or satellite$/))) return 'la web del promotor dice que la obra va al ' + m[1] + ', un dato a contrastar con fotos o satélite';
    if ((m = t.match(/^developer page says permits are obtained but publishes no permit number \(checked (\d\d:\d\d) UTC\)$/))) return 'la web del promotor dice que tiene los permisos pero no publica ningún número de permiso (comprobado a las ' + m[1] + ' UTC)';
    if ((m = t.match(/^developer page promises handover in (.+) \(first reading by the (?:hourly|daily) check\)$/))) return 'la web del promotor promete la entrega en ' + m[1].replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/, function (x) { return MES[x]; }) + ' (primera lectura de la revisión horaria)';
    if (/^permit or licence number published on the developer page/.test(t)) return 'número de permiso o licencia publicado en la web del promotor (no lo mostramos aquí: identificaría el proyecto)';
    if ((m = t.match(/^starting price stated: (the .+ band)$/))) return 'precio de partida publicado: ' + band(m[1]);
    if ((m = t.match(/^starting price stated: a price in ([A-Z]{3})$/))) return 'precio de partida publicado: un precio en ' + m[1];
    if ((m = t.match(/^starting price stated in ([A-Z]{3}) \(no band shown: currency not in our conversion table\)$/))) return 'precio de partida publicado en ' + m[1] + ' (sin franja: moneda fuera de nuestra tabla de conversión)';
    if ((m = t.match(/^advertised rental yield stated: ([\d.]+%), advertised, not verified$/))) return 'rentabilidad de alquiler anunciada: ' + m[1].replace('.', ',') + ', anunciada, no verificada';
    if ((m = t.match(/^advertised rental yield now ([\d.]+%) \(was ([\d.]+%) on (\d+) Nov\), advertised, not verified$/))) return 'rentabilidad de alquiler anunciada ahora del ' + m[1].replace('.', ',') + ' (era ' + m[2].replace('.', ',') + ' el ' + m[3] + ' nov), anunciada, no verificada';
    if ((m = t.match(/^legal structure stated: (.+)$/))) return 'estructura legal publicada: ' + ({ 'another structure': 'otra estructura', 'strata title': 'propiedad horizontal (strata title)', freehold: 'plena propiedad (freehold)', leasehold: 'arrendamiento a largo plazo (leasehold)', 'bank trust (fideicomiso)': 'fideicomiso bancario' }[m[1]] || m[1]);
    if ((m = t.match(/^price from up ([\d.]+%) since we read it on (\d+) Nov \(now in (the .+ band)\)$/))) return 'precio de partida un ' + m[1].replace('.', ',') + ' más alto desde nuestra lectura del ' + m[2] + ' nov (ahora ' + band(m[3]) + ')';
    return null;
  }
  function tev(t) { t = String(t || ''); for (var i = 0; i < TX.length; i++) { var m = t.match(TX[i][0]); if (m) { var r = TX[i][1](m); if (r != null) return r; } } return null; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rel(ms) { var m = Math.floor(ms / 60000); if (m < 1) return 'ahora mismo'; if (m < 60) return 'hace ' + m + ' min'; var h = Math.floor(m / 60); if (h < 24) return 'hace ' + h + ' h ' + (m % 60) + ' min'; var d = Math.floor(h / 24); return 'hace ' + d + (d > 1 ? ' días' : ' día'); }
  function hm(iso) { try { return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso.slice(11, 16); } }
  function day(iso) { var d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString() ? '' : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ', '; }
  function render(fresh) {
    if (!evs.length) { L.innerHTML = '<li class="lv-none">Todavía no hay eventos del sistema registrados hoy. Esta franja solo muestra eventos reales.</li>'; return; }
    L.innerHTML = evs.slice(0, 8).map(function (e) {
      return '<li' + (fresh[e.id] ? ' class="new"' : '') + '><a href="' + esc(e.href || '/status') + '"><span class="lv-t"><i class="lv-k' + (e.ok === false ? ' bad' : '') + '" aria-label="' + (e.ok === false ? 'problema' : 'correcto') + '"></i><b><time datetime="' + esc(e.at) + '">' + esc(day(e.at) + hm(e.at)) + '</time></b><span data-ago="' + esc(e.at) + '">' + rel(Date.now() - Date.parse(e.at)) + '</span><em>' + esc(KIND[e.kind] || e.kind) + (e.seen ? ', observado' : '') + '</em></span><p' + (tev(e.text) == null ? ' lang="en"' : '') + '>' + esc(tev(e.text) || e.text) + '</p></a></li>';
    }).join('');
    if (Object.keys(fresh).length) setTimeout(function () { L.querySelectorAll('li.new').forEach(function (x) { x.classList.remove('new'); }); }, 6000);
  }
  function status() {
    var last = evs[0], t = last ? 'Último evento ' + rel(Date.now() - Date.parse(last.at)) : 'Aún no hay eventos registrados';
    var m = mode === 'stream' ? 'en directo' : mode === 'poll' ? 'comprobando cada 30 s' : mode === 'paused' ? 'en pausa mientras esta pestaña está oculta' : mode === 'down' ? 'sin conexión con el directo, reintentando' : 'conectando';
    var u = upt && upt.probes ? ' · sondas de disponibilidad hoy: ' + NUM(upt.up) + ' de ' + NUM(upt.probes) + ' correctas' : '';
    ST.textContent = t + ' · ' + m + (lastSnap ? ', actualizado a las ' + new Date(lastSnap).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '') + u;
    if (DOT) DOT.className = 'lv-dot' + (mode === 'stream' || mode === 'poll' ? ' on' : mode === 'down' ? ' off' : '');
    L.querySelectorAll('[data-ago]').forEach(function (x) { x.textContent = rel(Date.now() - Date.parse(x.getAttribute('data-ago'))); });
  }
  function apply(text, sig, kid) {
    var j; try { j = JSON.parse(text); } catch (e) { return; }
    var fresh = {}; (j.events || []).forEach(function (e) { if (known && !known[e.id]) fresh[e.id] = 1; });
    known = known || {}; (j.events || []).forEach(function (e) { known[e.id] = 1; });
    evs = j.events || []; upt = j.uptime || null; lastSnap = Date.now(); render(fresh); status();
    if (kbEl && window.kbVerifyLoad) window.kbVerifyLoad().then(function (KV) { kbEl = KV.badge(kbEl, KV.verifyText(text, sig, kid), { what: 'este flujo de actividad (/api/x/a/live)' }); }).catch(function () {});
  }
  function poll() {
    mode = 'poll'; clearTimeout(pollT);
    fetch('/api/x/a/events', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; var s = r.headers.get('x-kolaboro-signature'), k = r.headers.get('x-kolaboro-key-id'); return r.text().then(function (t) { apply(t, s, k); }); })
      .catch(function () { mode = 'down'; status(); }).then(function () { if (!document.hidden) pollT = setTimeout(poll, 30000); });
  }
  function connect() {
    if (es || document.hidden) return;
    if (!window.EventSource || errs > 3) { poll(); return; }
    es = new EventSource('/api/x/a/live');
    es.addEventListener('snap', function (e) { var d; try { d = JSON.parse(e.data); } catch (x) { return; } errs = 0; mode = 'stream'; apply(d.b, d.s, d.k); });
    es.addEventListener('bye', function () { /* the server ends each stream after about 100 s; EventSource reconnects by itself */ });
    es.onopen = function () { if (mode !== 'stream') { mode = 'stream'; status(); } };
    es.onerror = function () { errs++; if (errs > 3) { es.close(); es = null; poll(); } else { mode = evs.length ? 'stream' : 'connecting'; status(); } };
  }
  function stop() { if (es) { es.close(); es = null; } clearTimeout(pollT); mode = 'paused'; status(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else { mode = 'connecting'; if (errs > 3) poll(); else connect(); } });
  addEventListener('pagehide', stop); addEventListener('pageshow', function (e) { if (e.persisted && !document.hidden) { mode = 'connecting'; connect(); } });
  setInterval(status, 30000);
  (window.kbWhenActive || function (f) { f(); })(connect);
});
