/* live system activity: real events from existing records, pushed by server-sent events (signed snapshots, checked in this browser) */
document.addEventListener('DOMContentLoaded', function () {
  var L = document.getElementById('lv-l'), ST = document.getElementById('lv-st'), DOT = document.getElementById('lv-dot'), KB = document.querySelector('[data-kvb="live"]');
  if (!L || !ST) return;
  var evs = [], known = null, mode = 'connecting', lastSnap = 0, es = null, errs = 0, pollT = null, kbEl = KB, upt = null;
  var KIND = { finding: 'Finding, checked by code', checkrun: 'Hourly check', selftest: 'Self-test', eval: 'Quality check', log: 'Public log', uptime: 'Uptime', incident: 'Incident' };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rel(ms) { var m = Math.floor(ms / 60000); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; var h = Math.floor(m / 60); if (h < 24) return h + ' h ' + (m % 60) + ' min ago'; var d = Math.floor(h / 24); return d + ' day' + (d > 1 ? 's' : '') + ' ago'; }
  function hm(iso) { try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso.slice(11, 16); } }
  function day(iso) { var d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString() ? '' : d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ', '; }
  function render(fresh) {
    if (!evs.length) { L.innerHTML = '<li class="lv-none">No system events in the records yet today. This strip only shows real ones.</li>'; return; }
    L.innerHTML = evs.slice(0, 8).map(function (e) {
      return '<li' + (fresh[e.id] ? ' class="new"' : '') + '><a href="' + esc(e.href || '/status') + '"><span class="lv-t"><i class="lv-k' + (e.ok === false ? ' bad' : '') + '" aria-label="' + (e.ok === false ? 'problem' : 'ok') + '"></i><b><time datetime="' + esc(e.at) + '">' + esc(day(e.at) + hm(e.at)) + '</time></b><span data-ago="' + esc(e.at) + '">' + rel(Date.now() - Date.parse(e.at)) + '</span><em>' + esc(KIND[e.kind] || e.kind) + (e.seen ? ', seen' : '') + '</em></span><p>' + esc(e.text) + '</p></a></li>';
    }).join('');
    if (Object.keys(fresh).length) setTimeout(function () { L.querySelectorAll('li.new').forEach(function (x) { x.classList.remove('new'); }); }, 6000);
  }
  function status() {
    var last = evs[0], t = last ? 'Last event ' + rel(Date.now() - Date.parse(last.at)) : 'No events recorded yet';
    var m = mode === 'stream' ? 'streaming' : mode === 'poll' ? 'checking every 30 s' : mode === 'paused' ? 'paused while this tab is hidden' : mode === 'down' ? 'feed unreachable, retrying' : 'connecting';
    var u = upt && upt.probes ? ' · uptime probes today: ' + upt.up + ' of ' + upt.probes + ' up' : '';
    ST.textContent = t + ' · ' + m + (lastSnap ? ', updated ' + new Date(lastSnap).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '') + u;
    if (DOT) DOT.className = 'lv-dot' + (mode === 'stream' || mode === 'poll' ? ' on' : mode === 'down' ? ' off' : '');
    L.querySelectorAll('[data-ago]').forEach(function (x) { x.textContent = rel(Date.now() - Date.parse(x.getAttribute('data-ago'))); });
  }
  function apply(text, sig, kid) {
    var j; try { j = JSON.parse(text); } catch (e) { return; }
    var fresh = {}; (j.events || []).forEach(function (e) { if (known && !known[e.id]) fresh[e.id] = 1; });
    known = known || {}; (j.events || []).forEach(function (e) { known[e.id] = 1; });
    evs = j.events || []; upt = j.uptime || null; lastSnap = Date.now(); render(fresh); status();
    if (kbEl && window.kbVerifyLoad) window.kbVerifyLoad().then(function (KV) { kbEl = KV.badge(kbEl, KV.verifyText(text, sig, kid), { what: 'this activity feed (/api/x/a/live)' }); }).catch(function () {});
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
