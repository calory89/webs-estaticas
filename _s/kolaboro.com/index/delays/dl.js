/* /index/delays/: renders /data/delay-index.json and /data/on-time.json, and recomputes both from /data/bali-cases.json on request. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  // n40 L8: the strings this script writes follow the page language (<html lang>), from /index/delays/dl-tx.js (loaded only on the
  // translated pages); English by default. Market names keep their English value in data attributes and are shown with pl().
  var LG = String(document.documentElement.lang || 'en').slice(0, 2).toLowerCase(), S = null, LOC = null;
  function t(k, en, o) { var v = S && S[k] != null ? S[k] : en; return o ? v.replace(/\{(\w+)\}/g, function (z, x) { return o[x] != null ? o[x] : z; }) : v; }
  function pl(m) { return S && S.pl && S.pl[m] ? S.pl[m] : m; }
  function ot(x) { if (!S || !S.ot || x == null) return x; var nums = [], k = String(x).replace(/\d+(?:\.\d+)?/g, function (d) { nums.push(d); return '#'; }), v = S.ot[k]; if (v == null) return x; var i = 0; return v.replace(/#/g, function () { var d = nums[i++]; return d.length === 4 ? d : Number(d).toLocaleString(LOC, { maximumFractionDigits: 3 }); }); }
  function dt(s, o) { try { var p = s.split('-'); return new Intl.DateTimeFormat(LOC, o).format(new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] || 1, 12))); } catch (e) { return s; } }
  function ym(s) { if (!s) return ''; var p = s.split('-'); if (S) return dt(s, { month: 'short', year: 'numeric', timeZone: 'UTC' }); return MON[+p[1] - 1] + ' ' + p[0]; }
  function ymL(s) { if (!s) return ''; var p = s.split('-'); if (S) return dt(s, { month: 'long', year: 'numeric', timeZone: 'UTC' }); return MONL[+p[1] - 1] + ' ' + p[0]; }
  function dL(s) { return S && s && /^\d{4}-\d\d-\d\d$/.test(s) ? dt(s, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : s; }
  function n(x) { return (x || 0).toLocaleString(S ? LOC : 'en-US'); }
  function fx(x) { return S && x != null && isFinite(x) ? Number(x).toLocaleString(LOC, { maximumFractionDigits: 3 }) : x; }
  function f1(x) { return x == null ? null : S ? fx(Math.round(x * 10) / 10) : (Math.round(x * 10) / 10).toString(); }
  function pc(x) { return x == null ? x : S ? fx(x) + (LG === 'fr' || LG === 'de' ? '\u00a0%' : '%') : x + '%'; }
  var TOO;
  var DI, OT, cur = '', rt;

  // ---- the same rules as tools/kolaboro-v/delay_index.py ----
  var WINDOW = 6, MIN_MARKET = 5, MIN_ODDS = 10, Z = 1.959963984540054;
  function mi(y, m) { return y * 12 + m; }
  function ymOf(i) { var y = Math.floor((i - 1) / 12), m = (i - 1) % 12 + 1; return y + '-' + (m < 10 ? '0' : '') + m; }
  function q7(xs, p) { xs = xs.slice().sort(function (a, b) { return a - b; }); if (!xs.length) return null; var h = (xs.length - 1) * p, lo = Math.floor(h), hi = Math.min(lo + 1, xs.length - 1); return xs[lo] + (h - lo) * (xs[hi] - xs[lo]); }
  function wilson(k, N) { if (!N) return [null, null]; var p = k / N, den = 1 + Z * Z / N, c = (p + Z * Z / (2 * N)) / den, h = Z * Math.sqrt(p * (1 - p) / N + Z * Z / (4 * N * N)) / den; return [Math.max(0, c - h) * 100, Math.min(1, c + h) * 100]; }
  function num(v) { return typeof v === 'number' && isFinite(v) && v > 0 ? Math.round(v) : 0; }
  function derive(c, NOW) {
    var st = c.stage, done = Number.isInteger(c.done) ? c.done : null, od = num(c.overdue), d = num(c.delay), completed = st === 'completed', cu = null;
    // n40 k27: with no watcher reading, the current month comes from the dated handover record named in /data/on-time.json (hs promise or record, read on hr), as the builder does
    var o = OT && OT.projects && OT.projects[c.id], hc = o && (o.hs === 'promise' || o.hs === 'record') && o.cur ? o.cur.split('-') : null;
    if (od) cu = NOW - od; else if (hc) { cu = mi(+hc[0], +hc[1]); if (!completed && cu < NOW) od = NOW - cu; } else if (done) cu = mi(done, 12);
    var r = { id: c.id, market: c.market, country: c.country, completed: completed, cur: cu, d: d, od: od, first: null, status: null, late: null };
    if (cu == null) { r.status = completed ? 'completed_no_date' : 'no_date'; return r; }
    if (!completed && !od && cu < NOW) { r.status = 'inconsistent'; return r; }
    r.first = cu - d;
    if (completed) r.status = d <= WINDOW ? 'done_on_time' : 'done_late';
    else { var late = NOW - r.first; r.late = late > 0 ? late : 0; r.status = late > WINDOW ? 'missed' : (cu - r.first > WINDOW ? 'moved' : 'open'); }
    return r;
  }
  function resolved(r, NOW) { if (r.first == null || NOW - r.first <= WINDOW) return null; return r.completed && r.d <= WINDOW ? 1 : 0; }
  function marketRow(name, rows) {
    var dated = rows.filter(function (r) { return !r.completed && r.first != null; });
    var late = dated.filter(function (r) { return r.late > 0; }).map(function (r) { return r.late; }).sort(function (a, b) { return a - b; });
    var pc = dated.filter(function (r) { return r.od > 0; }).length;
    return { market: name, tracked: rows.length, with_date: dated.length, past_first: late.length, past_current: pc,
      share_past_first: dated.length >= MIN_MARKET ? 100 * late.length / dated.length : null, share_past_current: dated.length >= MIN_MARKET ? 100 * pc / dated.length : null,
      median_late: late.length >= MIN_MARKET ? q7(late, 0.5) : null, p90_late: late.length >= MIN_MARKET ? q7(late, 0.9) : null };
  }
  function oddsGroup(pool, r) {
    var lv = [['market', 'market'], ['country', 'country']];
    for (var i = 0; i < lv.length; i++) { var g = pool.filter(function (x) { return x[0][lv[i][1]] === r[lv[i][1]]; }); if (g.length >= MIN_ODDS) return [lv[i][0] + ':' + r[lv[i][1]], g]; }
    return ['all:all markets', pool];
  }
  function recompute(raw) {
    var u = raw.updated.slice(0, 10).split('-'), NOW = mi(+u[0], +u[1]);
    // n40 k22: the published index covers the markets it lists; cases of any market it leaves out are left out here too
    var keep = {}; DI.markets.forEach(function (m) { keep[m.market] = 1; });
    var rows = raw.cases.filter(function (c) { return keep[c.market]; }).map(function (c) { return derive(c, NOW); });
    var by = {}; rows.forEach(function (r) { (by[r.market] = by[r.market] || []).push(r); });
    var mk = {}; Object.keys(by).forEach(function (m) { mk[m] = marketRow(m, by[m]); });
    var pool = []; rows.forEach(function (r) { var y = resolved(r, NOW); if (y != null) pool.push([r, y]); });
    var st = {}, grp = {};
    rows.forEach(function (r) { st[r.id] = r.status; if (r.status === 'open') { var g = oddsGroup(pool, r); grp[r.id] = g[0]; } });
    var k = pool.filter(function (x) { return x[1]; }).length;
    return { month: ymOf(NOW), all: marketRow('All markets', rows), markets: mk, status: st, group: grp, pooled: { n: pool.length, k: k, p: pool.length ? 100 * k / pool.length : null, ci: wilson(k, pool.length) } };
  }
  function close(a, b) { return a == null && b == null || a != null && b != null && Math.abs(a - b) < 0.051; }

  // ---- rendering ----
  function bars() {
    var M = DI.markets.filter(function (m) { return m.share_past_first != null; }).sort(function (a, b) { return b.share_past_first - a.share_past_first || b.with_date - a.with_date; });
    $('dlBarsN').textContent = t('mk', '{n} markets', { n: M.length });
    var Z0 = M.filter(function (m) { return !m.share_past_first; }); M = M.filter(function (m) { return m.share_past_first > 0; });
    $('dlBars').innerHTML = M.map(function (m) {
      return '<button type="button" class="dl-bar" data-m="' + esc(m.market) + '" aria-label="' + esc(t('baraf', '{m} {p} of {n} projects past the first promised handover', { m: pl(m.market), p: pc(m.share_past_first), n: m.with_date })) + '"><span class="l">' + esc(pl(m.market)) + '</span><span class="t">' + (m.share_past_first > 0 ? '<i style="width:' + m.share_past_first + '%"></i>' : '') + '</span><span class="v">' + t('barv', '<b>{p}</b> of {n}', { p: pc(m.share_past_first), n: n(m.with_date) }) + '</span></button>';
    }).join('') + (Z0.length ? '<p class="pi-sub">' + t('zero', '{z} past the first date ({n} markets): {l}.', { z: pc(0), n: Z0.length, l: Z0.map(function (m) { return esc(pl(m.market)) + ' (' + m.with_date + ')'; }).join(t('sep', ', ')) }) + '</p>' : '');
  }
  function strip(vals, med, p90) {
    var el = $('dlStrip');
    if (!vals.length) { el.innerHTML = '<p class="pi-sub">' + t('nolate', 'No project in this view is past its first promised handover.') + '</p>'; return; }
    var cnt = {}, top = 1; vals.forEach(function (v) { cnt[v] = (cnt[v] || 0) + 1; top = Math.max(top, cnt[v]); });
    var W = Math.max(300, Math.round(el.clientWidth || 760)), L = 16, R = 16, T = 44, B = 36, H = T + 16 + top * 9 + B;
    var mx = Math.max(12, vals[vals.length - 1]), x = function (v) { return L + (W - L - R) * v / mx; };
    var h = '<svg class="dl-strip" viewBox="0 0 ' + W + ' ' + H + '">', step = mx > 60 ? 12 : mx > 24 ? 6 : 3;
    for (var g = 0; g <= mx; g += step) h += '<line class="g" x1="' + x(g).toFixed(1) + '" x2="' + x(g).toFixed(1) + '" y1="' + T + '" y2="' + (H - B) + '"/><text x="' + x(g).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + g + '</text>';
    h += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc(t('axis', 'months past the first promised handover')) + '</text>';
    [[med, esc(t('medv', 'median {v}', { v: f1(med) })), 14], [p90, esc(t('p90v', '90th percentile {v}', { v: f1(p90) })), 32]].forEach(function (q) {
      if (q[0] == null) return;
      var xx = x(q[0]), right = xx > W / 2;
      h += '<line class="mq" x1="' + xx.toFixed(1) + '" x2="' + xx.toFixed(1) + '" y1="' + (q[2] + 4) + '" y2="' + (H - B) + '"/><text class="lab" x="' + (xx + (right ? -6 : 6)).toFixed(1) + '" y="' + q[2] + '" text-anchor="' + (right ? 'end' : 'start') + '">' + q[1] + '</text>';
    });
    var seen = {};
    vals.forEach(function (v) { var k = seen[v] = (seen[v] || 0) + 1; h += '<circle class="dt" r="5" cx="' + x(v).toFixed(1) + '" cy="' + (H - B - 7 - (k - 1) * 9) + '"><title>' + esc(t('mos', '{n} months', { n: fx(v) })) + '</title></circle>'; });
    el.innerHTML = h + '</svg>';
    el.setAttribute('aria-label', t('strara', '{n} projects past the first promised handover, from {a} to {b} months', { n: vals.length, a: fx(vals[0]), b: fx(vals[vals.length - 1]) }));
  }
  function market(m) {
    cur = m || '';
    var o = cur ? DI.markets.filter(function (x) { return x.market === cur; })[0] : DI.all_markets;
    if (!o) { cur = ''; o = DI.all_markets; }
    $('dlMT').textContent = cur ? pl(cur) : t('all', 'All markets');
    $('dlSel').value = cur;
    $('dlMS').innerHTML = esc(t('ms', '{t} tracked, {d} not completed with a usable handover date, {p} past the first date on record, {c} past the date advertised today.', { t: n(o.tracked), d: n(o.with_date), p: n(o.past_first), c: n(o.past_current) })) +
      (o.with_date < MIN_MARKET ? ' <b>' + t('toofewm', 'Too few projects for a market figure.') + '</b>' : ' ' + t('sharep', 'Share past the first date: <b>{p}</b>.', { p: pc(o.share_past_first) })) +
      (o.median_late != null ? ' ' + t('medl', 'Median <b>{m}</b> months late, 90th percentile <b>{q}</b>.', { m: fx(o.median_late), q: fx(o.p90_late) }) : o.past_first ? ' ' + t('medfew', 'Median and 90th percentile: too few late projects (under 5).') : '');
    strip(o.late_months || [], o.median_late, o.p90_late);
    $('dlMN').textContent = t('dot', 'Each dot is one project, anonymous. ') + (o.completed ? (o.completed === 1 ? t('comp1', '{n} completed project is not counted. ', { n: 1 }) : t('comp', '{n} completed projects are not counted. ', { n: n(o.completed) })) : '') + (o.no_date ? t('nodate', '{n} without a usable date. ', { n: n(o.no_date) }) : '') + (o.inconsistent ? t('incon', '{n} left out: past year without an overdue reading.', { n: n(o.inconsistent) }) : '');
    Array.prototype.forEach.call(document.querySelectorAll('.dl-bar'), function (b) { b.classList.toggle('on', b.getAttribute('data-m') === cur); });
    Array.prototype.forEach.call(document.querySelectorAll('#dlTab tbody tr'), function (tr) { tr.classList.toggle('on', tr.getAttribute('data-m') === cur); });
  }
  var showAll = false;
  function table() {
    $('dlTab').querySelector('tbody').innerHTML = DI.markets.filter(function (m) { return showAll || m.with_date >= MIN_MARKET; }).map(function (m) {
      return '<tr data-m="' + esc(m.market) + '"><td><button type="button">' + esc(pl(m.market)) + '</button></td><td class="n">' + n(m.tracked) + '</td><td class="n">' + n(m.with_date) + '</td><td class="n">' + n(m.past_first) + '</td><td class="n">' + (m.share_past_first != null ? pc(m.share_past_first) : TOO) + '</td><td class="n">' + n(m.past_current) + '</td><td class="n">' + (m.median_late != null ? fx(m.median_late) : (m.past_first ? TOO : '–')) + '</td><td class="n">' + (m.p90_late != null ? fx(m.p90_late) : (m.past_first ? TOO : '–')) + '</td></tr>';
    }).join('');
    var shown = DI.markets.filter(function (m) { return m.share_past_first != null; }).length, med = DI.markets.filter(function (m) { return m.median_late != null; }).length;
    $('dlTabN').innerHTML = esc(t('tabn', '{a} markets tracked. {b} have enough dated projects for a share; {c} have enough late projects (5 or more) for a median and 90th percentile. ', { a: DI.markets.length, b: shown, c: med })) +
      '<button type="button" class="btn btn-sm" id="dlAll">' + esc(showAll ? t('only', 'Show only markets with a figure') : t('showall', 'Show all {n} markets', { n: DI.markets.length })) + '</button>';
    $('dlAll').addEventListener('click', function () { showAll = !showAll; table(); market(cur); });
  }
  function hist() {
    $('dlHT').querySelector('tbody').innerHTML = DI.history.map(function (h) {
      return '<tr><td>' + esc(ymL(h.month)) + '</td><td>' + esc(dL(h.taken)) + '</td><td class="n">' + n(h.all.with_date) + '</td><td class="n">' + n(h.all.past_first) + '</td><td class="n">' + pc(h.all.share_past_first) + '</td><td class="n">' + fx(h.all.median_late) + '</td><td class="n">' + fx(h.all.p90_late) + '</td></tr>';
    }).join('');
    $('dlHist').textContent = DI.history.length === 1 ? t('hist1', 'One snapshot is frozen on the first run of each month, so this index becomes a time series. It starts in {m} with {n} snapshot. Nothing before it is estimated or back-filled.', { m: ymL(DI.history_starts), n: 1 }) : t('hist', 'One snapshot is frozen on the first run of each month, so this index becomes a time series. It starts in {m} with {n} snapshots. Nothing before it is estimated or back-filled.', { m: ymL(DI.history_starts), n: DI.history.length });
  }
  var SL = { open: 'Estimated', missed: 'Already more than 6 months past the first date', moved: 'Seller\'s own date already more than 6 months after the first', done_on_time: 'Completed, within 6 months of the first date', done_late: 'Completed, more than 6 months after the first date', no_date: 'No handover date in the open data', completed_no_date: 'Completed, no date in the open data', inconsistent: 'Left out: past year without an overdue reading' };
  function sl(k) { return S && S.sl && S.sl[k] ? S.sl[k] : SL[k]; }
  function lookup(id) {
    id = String(id || '').trim().toUpperCase();
    var box = $('dlAns'); box.hidden = false;
    var p = OT.projects[id];
    if (!p) { box.innerHTML = '<h3>' + esc(id || t('noid', 'No id')) + '</h3><p>' + t('notrk', 'No tracked project has this id. Ids look like BALI-014 or DXB-001 and are listed in <a href="/cases">live cases</a>.') + '</p>'; return; }
    var h = '<h3>' + esc(id) + ' <small class="muted">' + esc(pl(p.m)) + '</small></h3>';
    if (p.s === 'open') {
      var g = OT.groups[p.g];
      if (g.level === 'all') h += '<p class="big">' + t('nec', 'Not enough comparable projects') + '</p><p>' + t('fewer', 'Fewer than {min} projects in {m} (or its country) have a closed window. For context only, across all markets {k} of {n} closed projects handed over in time: <b>{p}</b> (95% interval {lo} to {hi}). That pooled figure mixes markets and is not an estimate for this project.', { min: MIN_ODDS, m: esc(pl(p.m)), k: g.k, n: g.n, p: pc(g.p), lo: pc(g.lo), hi: pc(g.hi) }) + '</p>';
      else h += '<p class="big">' + pc(g.p) + ' <small class="muted">' + t('rng', '({lo} to {hi})', { lo: pc(g.lo), hi: pc(g.hi) }) + '</small></p><p>' + t('grp', '{k} of {n} closed projects in {g} handed over within 6 months of their first date.', { k: g.k, n: g.n, g: esc(pl(g.name)) }) + '</p>';
    } else h += '<p class="big">' + esc(sl(p.s) || p.s) + '</p><p>' + esc(ot(OT.rules.status[p.s] || '')) + '</p>';
    h += '<dl>' + (p.first ? '<dt>' + t('first', 'First handover on record') + '</dt><dd>' + esc(ym(p.first)) + '</dd>' : '') + (p.cur ? '<dt>' + t('adv', 'Advertised today') + '</dt><dd>' + esc(ym(p.cur)) + (p.overdue ? esc(t('ago', ', {n} months ago', { n: p.overdue })) : '') + '</dd>' : '') + '<dt>' + t('moves', 'Recorded date moves') + '</dt><dd>' + esc(p.moved ? t('mos', '{n} months', { n: p.moved }) : t('none', 'none recorded')) + '</dd>' + (p.to_first != null ? '<dt>' + t('tofirst', 'Months to first date') + '</dt><dd>' + p.to_first + '</dd>' : '') + '</dl>';
    h += '<p class="pi-fine"><a href="/p/?id=' + encodeURIComponent(id) + '">' + t('open', 'Open this project\'s page') + '</a> &middot; <a href="/api/x/v/on-time?id=' + encodeURIComponent(id) + '">' + t('json', 'as JSON') + '</a></p>';
    box.innerHTML = h;
    try { history.replaceState(null, '', '?id=' + encodeURIComponent(id) + '#odds'); } catch (e) {}
  }
  function odds() {
    var P = OT.pooled, V = OT.validation;
    $('dlO1').textContent = n(P.n); $('dlO2').textContent = n(P.k); $('dlO3').textContent = t('o3', '{p} ({lo} to {hi})', { p: pc(P.p), lo: fx(P.lo), hi: fx(P.hi) });
    var gs = Object.keys(OT.groups).map(function (k) { return OT.groups[k]; }), real = gs.filter(function (g) { return g.level !== 'all'; });
    $('dlOddsWhy').textContent = t('why', 'A project is estimated only if it is not completed, its first date is less than 6 months ago or still ahead, and its advertised date has not already moved more than 6 months. {n} projects qualify. ', { n: n(OT.counts.open || 0) }) +
      (real.length ? t('why2', '{n} market or country groups have 10 or more closed projects.', { n: real.length }) : t('why0', 'Today no market and no country has 10 closed projects, so every estimate reads "not enough comparable projects" and only the pooled figure is shown, as context.'));
    $('dlBias').textContent = ot(OT.bias);
    $('dlStage').textContent = ot(OT.why_not_stage);
    var cal = V.calibration.map(function (b) { return '<tr><td>' + t('calr', '{a} to {b}', { a: pc(b.predicted_from), b: pc(b.predicted_to) }) + '</td><td class="n">' + b.n + '</td><td class="n">' + pc(b.mean_predicted) + '</td><td class="n">' + pc(b.observed) + '</td></tr>'; }).join('');
    $('dlBT').innerHTML = '<p>' + esc(ot(V.method)) + esc(t('closed', ' Closed projects: {n}, on time: {k}.', { n: V.n, k: V.on_time })) + '</p><div class="pi-tw"><table class="pi-t"><thead><tr><th>' + t('pred', 'Predicted') + '</th><th class="n">' + t('prj', 'Projects') + '</th><th class="n">' + t('meanp', 'Mean predicted') + '</th><th class="n">' + t('obs', 'Observed') + '</th></tr></thead><tbody>' + cal + '</tbody></table></div>' +
      '<p>' + t('brier', 'Brier score (lower is better): <b>{b}</b>, against {c} for always saying 50% and {d} for the in-sample average. ', { b: fx(V.brier), c: fx(V.brier_constant_50), d: fx(V.brier_constant_base_in_sample) }) + esc(ot(V.verdict)) + '</p>';
    $('dlSt').querySelector('tbody').innerHTML = Object.keys(SL).map(function (k) { return '<tr><td>' + esc(sl(k)) + '</td><td class="n">' + n(OT.counts[k] || 0) + '</td><td style="white-space:normal">' + esc(ot(OT.rules.status[k] || '')) + '</td></tr>'; }).join('');
    $('dlIds').innerHTML = Object.keys(OT.projects).slice(0, 2000).map(function (k) { return '<option value="' + esc(k) + '">'; }).join('');
  }
  function sha256(buf) { return crypto.subtle.digest('SHA-256', buf).then(function (h) { return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }); }
  function runCheck() {
    var out = $('dlReOut'), btn = $('dlRe'); btn.disabled = true; out.textContent = t('dlg', 'Downloading /data/bali-cases.json…');
    var buf;
    fetch('/data/bali-cases.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(function (b) { buf = b; return sha256(b); }).then(function (h) {
      var raw = JSON.parse(new TextDecoder().decode(buf)), R = recompute(raw), ok = 0, tot = 0, bad = [];
      var same = h === DI.inputs[0].sha256;
      function cmp(lbl, a, b) { tot++; if (close(a, b)) ok++; else if (bad.length < 6) bad.push(t('pubrec', '{l}: published {a}, recomputed {b}', { l: lbl, a: fx(a), b: b == null ? b : f1(b) })); }
      var keys = ['with_date', 'past_first', 'past_current', 'share_past_first', 'share_past_current', 'median_late', 'p90_late'];
      DI.markets.concat([DI.all_markets]).forEach(function (m) { var r = m.market === 'All markets' ? R.all : R.markets[m.market]; keys.forEach(function (k) { cmp(pl(m.market) + ' ' + k, m[k], r ? r[k] : null); }); });
      var sOk = 0, sTot = 0; Object.keys(OT.projects).forEach(function (id) { sTot++; var p = OT.projects[id]; if (R.status[id] === p.s && (p.s !== 'open' || R.group[id] === p.g)) sOk++; else if (bad.length < 6) bad.push(t('idst', '{id} status', { id: id })); });
      cmp('pooled n', OT.pooled.n, R.pooled.n); cmp('pooled k', OT.pooled.k, R.pooled.k); cmp('pooled rate', OT.pooled.p, R.pooled.p); cmp('interval low', OT.pooled.lo, R.pooled.ci[0]); cmp('interval high', OT.pooled.hi, R.pooled.ci[1]);
      out.innerHTML = '<b>' + (same ? t('same', 'Same input file') : t('changed', 'The open file has changed since the index was built')) + '</b> (SHA-256 ' + esc(h.slice(0, 16)) + '…' + (same ? '' : esc(t('used', ', the index used {x}…; small differences are then expected until the next daily rebuild', { x: DI.inputs[0].sha256.slice(0, 16) }))) + '). ' +
        '<span class="' + (ok === tot ? 'pi-ok' : 'pi-no') + '">' + t('match', '{ok} of {tot} published figures match', { ok: ok, tot: tot }) + '</span>' + t('recomp', ' your browser\'s recomputation (to 0.05), and ') + '<span class="' + (sOk === sTot ? 'pi-ok' : 'pi-no') + '">' + t('stmatch', '{a} of {b} project statuses', { a: sOk, b: sTot }) + '</span>' + t('m2', ' match.') + (bad.length ? esc(t('diffs', ' First differences: {l}.', { l: bad.join('; ') })) : '');
    }).catch(function (e) { out.textContent = t('cnr', 'Could not recompute: {e}', { e: e.message }); }).then(function () { btn.disabled = false; });
  }
  function boot() {
    var m = DI.as_of_month;
    $('dlK1').textContent = pc(DI.all_markets.share_past_first);
    $('dlK2').textContent = fx(DI.all_markets.median_late);
    $('dlK3').textContent = fx(DI.all_markets.p90_late);
    $('dlK4').textContent = n(DI.all_markets.with_date);
    $('dlNow').textContent = ymL(m); $('dlM1').textContent = ymL(m);
    $('dlSha').textContent = DI.inputs[0].sha256.slice(0, 16) + '…';
    $('dlWarn').textContent = t('warn', 'History for this index starts in {m}. The projects are the ones being marketed now, so finished projects are under-represented. Dates are what sellers advertise, read from their pages; where only a year is public we assume December, which can only understate lateness. Built {g}.', { m: ymL(DI.history_starts), g: dL(DI.generated) });
    $('dlSel').innerHTML = '<option value="">' + esc(t('all', 'All markets')) + '</option>' + DI.markets.slice().sort(function (a, b) { return S ? pl(a.market).localeCompare(pl(b.market), LOC) : a.market < b.market ? -1 : 1; }).map(function (x) { return '<option value="' + esc(x.market) + '">' + esc(pl(x.market)) + '</option>'; }).join('');
    bars(); table(); hist(); market('');
    $('dlBars').addEventListener('click', function (e) { var b = e.target.closest('.dl-bar'); if (b) { market(b.getAttribute('data-m')); $('dlMarket').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    $('dlTab').addEventListener('click', function (e) { var tr = e.target.closest('tr[data-m]'); if (tr) { market(tr.getAttribute('data-m')); $('dlMarket').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    $('dlSel').addEventListener('change', function () { market(this.value); });
    $('dlRe').addEventListener('click', runCheck);
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { market(cur); }, 150); });
  }
  function bootOdds() {
    odds();
    $('dlQ').addEventListener('submit', function (e) { e.preventDefault(); lookup($('dlId').value); });
    var q = new URLSearchParams(location.search).get('id');
    if (q) { $('dlId').value = q.toUpperCase(); lookup(q); }
  }
  var BUST = '?d=' + new Date().toISOString().slice(0, 10);   // a stale edge 404 from before the first build must not stick
  function start() {
  S = (window.KDL_TX || {})[LG] || null; LOC = S ? S.loc : null;
  TOO = '<span class="muted">' + t('too', 'too few') + '</span>';
  fetch('/data/delay-index.json' + BUST).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { DI = j; boot(); })
    .catch(function () { $('dlWarn').textContent = t('err1', 'The index file is not published yet: the first build is running. Please reload in a few minutes.'); });
  fetch('/data/on-time.json' + BUST).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { OT = j; bootOdds(); })
    .catch(function () { $('dlOddsWhy').textContent = t('err2', 'The odds file is not published yet: the first build is running.'); });
  }
  if (LG !== 'en' && /^(es|fr|de|nl|ru|zh|ar)$/.test(LG) && !window.KDL_TX) { var sc = document.createElement('script'); sc.src = '/index/delays/dl-tx.js?v=l8b'; sc.onload = sc.onerror = start; document.head.appendChild(sc); }
  else start();
})();
