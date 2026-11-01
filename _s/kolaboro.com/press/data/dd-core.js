/* Kolaboro data desk: shared compute + SVG renderers (used by /press/data/ and /press/data/embed/) */
(function(){
  var INK = '#17212B', MUTED = '#59626B', TRACK = '#E8E7E2', OK = '#0B7A55', RUST = '#C9461A', HI = '#FF5B14', GREY = '#B9B4A8';
  var FONT = "Archivo, 'Helvetica Neue', Arial, sans-serif";
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmt(n){ return (n || 0).toLocaleString('en'); }
  function pct(n, d, dp){ if (!d) return 0; var p = n / d * 100, f = Math.pow(10, dp || 0); return Math.round(p * f) / f; }
  function fmtDate(s, long){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return s || ''; return (+m[3]) + ' ' + (long ? MONL : MON)[+m[2] - 1] + ' ' + m[1]; }
  function trunc(s, n){ s = String(s); return s.length > n ? s.slice(0, n - 1) + '.' : s; }

  var CK = [['permit','a permit or licence number'],['escrow','deposit protection'],['progress','construction progress'],['plans','floor or site plans'],['record','a developer track record'],['returns_ok','no guaranteed returns']];
  var CKL = { permit:'Permit or licence number', escrow:'Deposit protection', progress:'Construction progress', plans:'Floor or site plans', record:'Developer track record', returns_ok:'No guaranteed returns' };
  function ok(c, k){ var x = c.checks || {}; return k === 'permit' ? x.permit === 2 : k === 'escrow' ? x.escrow === true : k === 'progress' ? x.progress != null : !!x[k]; }
  var LV = [['registry','Official registry',INK],['independent','Independent source',OK],['developer','Developer only',GREY],['contradicted','Contradicted',RUST],['none','Not published','#E2DED4']];

  /* ---------- renderers: each returns {h, body} for a given width ---------- */
  // rows: [{label, v, max?, text, color, tip}] or {heading}
  function hbar(rows, W, o){
    o = o || {}; var narrow = W < 520, out = [], y = 0, fs = 13;
    var lw = narrow ? 0 : Math.min(230, Math.round(W * 0.34)), vw = narrow ? 0 : 92, bx = narrow ? 0 : lw + 10, bw = Math.max(40, W - bx - (narrow ? 0 : vw + 8));
    var max = o.max || Math.max.apply(null, rows.filter(function(r){ return !r.heading; }).map(function(r){ return r.v; }).concat([1]));
    rows.forEach(function(r){
      if (r.heading){ y += (y ? 14 : 0); out.push('<text x="0" y="' + (y + 14) + '" font-size="12" font-weight="800" letter-spacing=".06em" fill="' + MUTED + '">' + esc(r.heading.toUpperCase()) + '</text>'); y += 26; return; }
      var w = Math.max(r.v > 0 ? 3 : 0, r.v / max * bw), c = r.color || INK, tip = esc(r.tip || (r.label + ': ' + r.text));
      if (narrow){
        out.push('<g data-tip="' + tip + '"><rect x="0" y="' + y + '" width="' + W + '" height="38" fill="transparent"/>' +
          '<text x="0" y="' + (y + 13) + '" font-size="' + fs + '" fill="' + INK + '">' + esc(trunc(r.label, 34)) + '</text>' +
          '<text x="' + W + '" y="' + (y + 13) + '" font-size="' + fs + '" font-weight="700" text-anchor="end" fill="' + INK + '">' + esc(r.text) + '</text>' +
          '<rect x="0" y="' + (y + 20) + '" width="' + W + '" height="10" rx="5" fill="' + TRACK + '"/>' +
          (w ? '<rect x="0" y="' + (y + 20) + '" width="' + w.toFixed(1) + '" height="10" rx="5" fill="' + c + '"/>' : '') + '</g>');
        y += 40;
      } else {
        out.push('<g data-tip="' + tip + '"><rect x="0" y="' + y + '" width="' + W + '" height="28" fill="transparent"/>' +
          '<text x="' + lw + '" y="' + (y + 18) + '" font-size="' + fs + '" text-anchor="end" fill="' + INK + '">' + esc(trunc(r.label, 30)) + '</text>' +
          '<rect x="' + bx + '" y="' + (y + 7) + '" width="' + bw + '" height="14" rx="4" fill="' + TRACK + '"/>' +
          (w ? '<rect x="' + bx + '" y="' + (y + 7) + '" width="' + w.toFixed(1) + '" height="14" rx="4" fill="' + c + '"/>' : '') +
          '<text x="' + (bx + bw + 8) + '" y="' + (y + 18) + '" font-size="' + fs + '" font-weight="700" fill="' + INK + '">' + esc(r.text) + '</text></g>');
        y += 30;
      }
    });
    return { h: y + 4, body: out.join('') };
  }
  // segs: [{label, v, color, text}] 100% stacked bar + legend
  function stack(segs, W){
    var tot = segs.reduce(function(a, s){ return a + s.v; }, 0) || 1, x = 0, out = [], H = 46;
    segs.forEach(function(s, i){
      var w = s.v / tot * W; if (w <= 0) return;
      var gap = i < segs.length - 1 ? 2 : 0;
      out.push('<g data-tip="' + esc(s.label + ': ' + s.text) + '"><rect x="' + x.toFixed(1) + '" y="0" width="' + Math.max(1, w - gap).toFixed(1) + '" height="' + H + '" fill="' + s.color + '"' + (i === 0 ? ' rx="4"' : '') + '/></g>');
      x += w;
    });
    // legend, wrapping
    var lx = 0, ly = H + 26, colW = W < 520 ? W : Math.min(300, W / Math.min(3, segs.length));
    segs.forEach(function(s){
      if (lx + colW > W + 1){ lx = 0; ly += 24; }
      out.push('<g data-tip="' + esc(s.label + ': ' + s.text) + '"><rect x="' + lx + '" y="' + (ly - 11) + '" width="12" height="12" rx="3" fill="' + s.color + '" stroke="rgba(23,33,43,.25)" stroke-width=".5"/>' +
        '<text x="' + (lx + 18) + '" y="' + ly + '" font-size="13" fill="' + INK + '">' + esc(s.label) + ' <tspan font-weight="700">' + esc(s.text) + '</tspan></text></g>');
      lx += colW;
    });
    return { h: ly + 10, body: out.join('') };
  }
  // grouped vertical bars: cats [labels], series [{label,color,vals}]
  function vgroup(cats, series, W){
    var top = 18, ch = 170, base = top + ch, out = [], n = cats.length, gw = W / n, ns = series.length;
    var bw = Math.min(34, (gw - 16) / ns), max = 1;
    series.forEach(function(s){ s.vals.forEach(function(v){ if (v > max) max = v; }); });
    out.push('<line x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '" stroke="rgba(23,33,43,.35)" stroke-width="1"/>');
    cats.forEach(function(c, i){
      var cx = gw * i + gw / 2, x0 = cx - bw * ns / 2 - (ns - 1);
      series.forEach(function(s, j){
        var v = s.vals[i], h = v / max * ch, x = x0 + j * (bw + 2);
        out.push('<g data-tip="' + esc(s.label + ', ' + c + ': ' + v + ' projects') + '"><rect x="' + x.toFixed(1) + '" y="' + top + '" width="' + bw.toFixed(1) + '" height="' + ch + '" fill="transparent"/>' +
          (h ? '<rect x="' + x.toFixed(1) + '" y="' + (base - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + s.color + '"/>' : '') +
          '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (base - h - 5).toFixed(1) + '" font-size="12" font-weight="700" text-anchor="middle" fill="' + INK + '">' + v + '</text></g>');
      });
      out.push('<text x="' + cx.toFixed(1) + '" y="' + (base + 18) + '" font-size="12" text-anchor="middle" fill="' + MUTED + '">' + esc(c) + '</text>');
    });
    var ly = base + 46, lx = 0;
    series.forEach(function(s){ out.push('<rect x="' + lx + '" y="' + (ly - 11) + '" width="12" height="12" rx="3" fill="' + s.color + '"/><text x="' + (lx + 18) + '" y="' + ly + '" font-size="13" fill="' + INK + '">' + esc(s.label) + '</text>'); lx += W < 520 ? 0 : 290; if (W < 520) ly += 22; });
    return { h: ly + 8, body: out.join('') };
  }
  function svg(r, W, title, desc, id){
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + r.h + '" viewBox="0 0 ' + W + ' ' + r.h + '" role="img" aria-labelledby="' + id + '-t ' + id + '-d" font-family="' + esc(FONT) + '">' +
      '<title id="' + id + '-t">' + esc(title) + '</title><desc id="' + id + '-d">' + esc(desc) + '</desc>' + r.body + '</svg>';
  }

  /* ---------- market rows: from /api/open/markets, or computed from cases if the endpoint fails ---------- */
  function marketsFromCases(C){
    var M = {};
    C.forEach(function(c){ var m = M[c.market] = M[c.market] || { market: c.market, country: c.country, projects: 0, s: 0, v: 0, nf: 0 }; m.projects++; m.s += c.score || 0; m.v += c.vscore || 0; if (!(c.flags || []).length) m.nf++; });
    return Object.keys(M).map(function(k){ var m = M[k]; return { market: m.market, country: m.country, projects: m.projects, transparency_index: Math.round(60 * m.s / m.projects / 6 + 30 * m.v / m.projects / 6 + 10 * m.nf / m.projects) }; });
  }

  /* ---------- compute everything ---------- */
  function compute(d, mk){
    var C = d.cases || [], N = C.length, date = d.updated || (mk && mk.updated) || '';
    var markets = (mk && mk.markets && mk.markets.length) ? mk.markets : marketsFromCases(C);
    var countries = {}; C.forEach(function(c){ countries[c.country] = (countries[c.country] || 0) + 1; });
    var nCountries = Object.keys(countries).length, nMarkets = {}; C.forEach(function(c){ nMarkets[c.market] = 1; }); nMarkets = Object.keys(nMarkets).length;
    var charts = [];

    // 1 what developers publish
    var pub = CK.map(function(k){ var n = C.filter(function(c){ return ok(c, k[0]); }).length; return { k: k[0], label: CKL[k[0]], lower: k[1], n: n, p: pct(n, N, 1) }; });
    var srt = pub.slice().sort(function(a, b){ return a.p - b.p; }), lo = srt[0], hi = srt[srt.length - 1];
    charts.push({ id: 'publish', n: 1, title: 'What developers publish',
      sub: 'Share of all ' + fmt(N) + ' tracked projects that publish each of the six things a careful buyer needs.',
      headline: 'Only ' + Math.round(lo.p) + '% of off-plan projects publish ' + lo.lower + ' and only ' + Math.round(srt[1].p) + '% publish ' + srt[1].lower + '.',
      cols: ['Check', 'Projects publishing', 'Share of projects (%)'], rows: pub.map(function(r){ return [r.label, r.n, r.p]; }),
      render: function(W){ return hbar(pub.map(function(r){ return { label: r.label, v: r.p, text: r.p + '%', tip: r.label + ': ' + fmt(r.n) + ' of ' + fmt(N) + ' projects (' + r.p + '%)' }; }), W, { max: 100 }); } });

    // 2 claims
    var cl = { verified: 0, unverified: 0, contradicted: 0 }; C.forEach(function(c){ var x = c.claims || {}; for (var k in cl) cl[k] += x[k] || 0; });
    var ct = cl.verified + cl.unverified + cl.contradicted;
    var clr = [['verified','Verified',OK],['unverified','Unverified',GREY],['contradicted','Contradicted',RUST]].map(function(x){ return { label: x[1], v: cl[x[0]], p: pct(cl[x[0]], ct, 1), color: x[2] }; });
    charts.push({ id: 'claims', n: 2, title: 'Developer claims: verified, unverified, contradicted',
      sub: 'Every factual claim a developer makes in its own materials, tested against registries, regulators, courts and the press.',
      headline: Math.round(clr[2].p) + '% of the ' + fmt(ct) + ' developer claims we tested were contradicted by another source, and only ' + Math.round(clr[0].p) + '% could be verified.',
      cols: ['Outcome', 'Claims', 'Share of claims (%)'], rows: clr.map(function(r){ return [r.label, r.v, r.p]; }).concat([['Total', ct, 100]]),
      render: function(W){ return stack(clr.map(function(r){ return { label: r.label, v: r.v, color: r.color, text: fmt(r.v) + ' (' + r.p + '%)' }; }), W); } });

    // 3 verification levels
    var lv = {}; LV.forEach(function(l){ lv[l[0]] = 0; }); C.forEach(function(c){ var v = c.verified || {}; for (var k in v) if (lv[v[k]] != null) lv[v[k]]++; });
    var lt = LV.reduce(function(a, l){ return a + lv[l[0]]; }, 0);
    var lvr = LV.map(function(l){ return { label: l[1], v: lv[l[0]], p: pct(lv[l[0]], lt, 1), color: l[2] }; });
    var conf = lv.registry + lv.independent;
    charts.push({ id: 'levels', n: 3, title: 'How each check is verified',
      sub: 'All ' + fmt(lt) + ' checks rated across the six points, by the strongest source found for each.',
      headline: 'Just ' + Math.round(pct(conf, lt, 1)) + '% of the ' + fmt(lt) + ' checks we rated are confirmed by an official registry or an independent source; ' + Math.round(lvr[4].p) + '% are not published at all.',
      cols: ['Verification level', 'Checks', 'Share of checks (%)'], rows: lvr.map(function(r){ return [r.label, r.v, r.p]; }).concat([['Total', lt, 100]]),
      render: function(W){ return stack(lvr.map(function(r){ return { label: r.label, v: r.v, color: r.color, text: r.p + '%' }; }), W); } });

    // 4 transparency index top/bottom 10
    var el = markets.filter(function(m){ return m.projects >= 5 && m.transparency_index != null; }).sort(function(a, b){ return b.transparency_index - a.transparency_index || b.projects - a.projects; });
    el.forEach(function(m, i){ m._rank = i + 1; });
    var top = el.slice(0, 10), bot = el.slice(Math.max(10, el.length - 10)).reverse();
    var t1 = top[0], b1 = bot[0];
    charts.push({ id: 'ti', n: 4, title: 'Transparency index: top and bottom 10 markets',
      sub: 'Markets with at least 5 tracked projects (' + el.length + ' markets). Index 0 to 100: 60% public disclosure, 30% independent confirmation, 10% no public problems.',
      headline: t1 && b1 ? t1.market + ' leads the transparency index at ' + t1.transparency_index + ' of 100 and ' + b1.market + ' is last at ' + b1.transparency_index + ', among ' + el.length + ' markets with at least 5 projects.' : 'Not enough markets with at least 5 projects yet.',
      cols: ['Rank', 'Market', 'Country', 'Projects', 'Index'],
      rows: top.map(function(m){ return [m._rank, m.market, m.country, m.projects, m.transparency_index]; }).concat(bot.map(function(m){ return [m._rank, m.market, m.country, m.projects, m.transparency_index]; })),
      markets: el.map(function(m){ return m.market; }),
      render: function(W){
        var lab = function(m){ return m.market + (m.country && m.country !== m.market && W >= 420 ? ', ' + m.country : ''); };
        var r = [{ heading: 'Most transparent' }].concat(top.map(function(m){ return { label: m._rank + '. ' + lab(m), v: m.transparency_index, text: String(m.transparency_index), tip: m.market + ' (' + m.country + '): index ' + m.transparency_index + ', ' + m.projects + ' projects, rank ' + m._rank + ' of ' + el.length }; }))
          .concat(bot.length ? [{ heading: 'Least transparent' }] : []).concat(bot.map(function(m){ return { label: m._rank + '. ' + lab(m), v: m.transparency_index, color: '#B83A05', text: String(m.transparency_index), tip: m.market + ' (' + m.country + '): index ' + m.transparency_index + ', ' + m.projects + ' projects, rank ' + m._rank + ' of ' + el.length }; }));
        return hbar(r, W, { max: 100 }); } });

    // 5 deposit protection by country
    var dc = {}; C.forEach(function(c){ var x = dc[c.country] = dc[c.country] || { country: c.country, n: 0, e: 0 }; x.n++; if (ok(c, 'escrow')) x.e++; });
    var dcr = Object.keys(dc).map(function(k){ var x = dc[k]; x.p = pct(x.e, x.n, 1); return x; }).filter(function(x){ return x.n >= 5; }).sort(function(a, b){ return b.p - a.p || b.n - a.n; });
    var zero = dcr.filter(function(x){ return x.e === 0; }).length, d1 = dcr[0];
    charts.push({ id: 'deposit', n: 5, title: 'Deposit protection by country',
      sub: 'Share of tracked projects that publish an escrow, trust or deposit-protection arrangement. Countries with at least 5 projects (' + dcr.length + ').',
      headline: d1 ? 'In ' + zero + ' of ' + dcr.length + ' countries with at least 5 projects, no tracked project publishes deposit protection; ' + d1.country + ' leads at ' + Math.round(d1.p) + '%.' : '',
      cols: ['Country', 'Projects', 'With deposit protection', 'Share (%)'], rows: dcr.map(function(x){ return [x.country, x.n, x.e, x.p]; }),
      render: function(W){ return hbar(dcr.map(function(x){ return { label: x.country, v: x.p, text: Math.round(x.p) + '%', tip: x.country + ': ' + x.e + ' of ' + x.n + ' projects (' + x.p + '%)' }; }), W, { max: 100 }); } });

    // 6 overdue and months late
    var BK = [['1 to 5', 1, 5], ['6 to 11', 6, 11], ['12 to 23', 12, 23], ['24 to 35', 24, 35], ['36+', 36, 1e9]];
    var od = C.filter(function(c){ return c.overdue > 0; }), dl = C.filter(function(c){ return c.delay > 0; });
    var odAvg = od.length ? Math.round(od.reduce(function(a, c){ return a + c.overdue; }, 0) / od.length * 10) / 10 : 0;
    var dlAvg = dl.length ? Math.round(dl.reduce(function(a, c){ return a + c.delay; }, 0) / dl.length * 10) / 10 : 0;
    var inB = function(v, b){ return v >= b[1] && v <= b[2]; };
    var odB = BK.map(function(b){ return od.filter(function(c){ return inB(c.overdue, b); }).length; });
    var dlB = BK.map(function(b){ return dl.filter(function(c){ return inB(c.delay, b); }).length; });
    charts.push({ id: 'overdue', n: 6, title: 'Projects overdue, and how many months late',
      sub: 'Overdue: past the completion date the developer advertised. Delayed: any reported delay, in months. Of ' + fmt(N) + ' tracked projects.',
      headline: od.length + ' projects are past their advertised completion date, by ' + odAvg + ' months on average, and ' + dl.length + ' show a delay averaging ' + dlAvg + ' months.',
      cols: ['Months late', 'Overdue projects', 'Delayed projects'], rows: BK.map(function(b, i){ return [b[0], odB[i], dlB[i]]; }).concat([['Total', od.length, dl.length], ['Average months', odAvg, dlAvg]]),
      render: function(W){ return vgroup(BK.map(function(b){ return b[0] + (W < 520 ? '' : ' mo'); }), [{ label: 'Overdue (past advertised date)', color: HI, vals: odB }, { label: 'Delayed (any reported delay)', color: INK, vals: dlB }], W); } });

    // 7 stage mix
    var STG = [['off-plan','Off-plan'],['under construction','Under construction'],['completed','Completed'],[null,'Not stated']];
    var sg = STG.map(function(s){ var n = C.filter(function(c){ return s[0] ? c.stage === s[0] : ['off-plan','under construction','completed'].indexOf(c.stage) < 0; }).length; return { label: s[1], n: n, p: pct(n, N, 1) }; }).filter(function(s){ return s.n || s.label !== 'Not stated'; });
    charts.push({ id: 'stage', n: 7, title: 'Stage mix',
      sub: 'Construction stage of every tracked project at the last check.',
      headline: Math.round(sg[1].p) + '% of tracked projects are under construction and ' + Math.round(sg[0].p) + '% are still off-plan; only ' + sg[2].n + ' (' + sg[2].p + '%) are completed.',
      cols: ['Stage', 'Projects', 'Share (%)'], rows: sg.map(function(s){ return [s.label, s.n, s.p]; }).concat([['Total', N, 100]]),
      render: function(W){ return hbar(sg.map(function(s){ return { label: s.label, v: s.p, text: fmt(s.n) + ' (' + Math.round(s.p) + '%)', color: s.label === 'Not stated' ? GREY : INK }; }), W, { max: 100 }); } });

    // 8 countries covered
    var cr = Object.keys(countries).map(function(k){ return { c: k, n: countries[k] }; }).sort(function(a, b){ return b.n - a.n || (a.c < b.c ? -1 : 1); });
    var c15 = cr.slice(0, 15), restN = cr.slice(15).reduce(function(a, x){ return a + x.n; }, 0);
    charts.push({ id: 'countries', n: 8, title: 'Countries covered',
      sub: 'Tracked projects by country, top 15 of ' + nCountries + ' countries.',
      headline: 'The database covers ' + fmt(N) + ' projects in ' + nCountries + ' countries; ' + c15[0].c + ' (' + c15[0].n + ') and ' + c15[1].c + ' (' + c15[1].n + ') have the most.',
      cols: ['Country', 'Projects', 'Share of database (%)'], rows: c15.map(function(x){ return [x.c, x.n, pct(x.n, N, 1)]; }).concat([['Other ' + (cr.length - 15) + ' countries', restN, pct(restN, N, 1)], ['Total', N, 100]]),
      render: function(W){ return hbar(c15.map(function(x){ return { label: x.c, v: x.n, text: String(x.n), tip: x.c + ': ' + x.n + ' projects (' + pct(x.n, N, 1) + '% of the database)' }; }), W); } });

    // quotable facts
    var six = C.filter(function(c){ return c.score === 6 && c.max === 6 && !(c.flags || []).length; }).length;
    var permit = pub.filter(function(r){ return r.k === 'permit'; })[0], esc_ = pub.filter(function(r){ return r.k === 'escrow'; })[0];
    var facts = [
      'Of ' + fmt(N) + ' off-plan projects tracked in ' + nCountries + ' countries, only ' + six + ' (' + pct(six, N, 1) + '%) publish all six things a careful buyer needs and have no problems in news, courts or regulator notices.',
      'Only ' + permit.p + '% of off-plan projects tracked worldwide publish a building permit or licence number.',
      'Only ' + esc_.p + '% of off-plan projects tracked worldwide publish an escrow, trust or other deposit-protection arrangement.',
      'Of ' + fmt(ct) + ' developer claims Kolaboro tested, ' + fmt(cl.contradicted) + ' (' + clr[2].p + '%) were contradicted by an official register, court, regulator or the press.',
      od.length + ' tracked off-plan projects are past their advertised completion date, by an average of ' + odAvg + ' months.',
      t1 && b1 ? 'Among ' + el.length + ' markets with at least 5 tracked projects, ' + t1.market + ' scores highest on the Kolaboro transparency index (' + t1.transparency_index + ' of 100) and ' + b1.market + ' lowest (' + b1.transparency_index + ').' : ''
    ].filter(Boolean);

    return { date: date, dateLong: fmtDate(date, true), dateShort: fmtDate(date), N: N, nCountries: nCountries, nMarkets: nMarkets, claims: ct, charts: charts, facts: facts, license: (mk && mk.license) || 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' };
  }

  function dataUrl(){ return '/data/bali-cases.json?t=' + Math.floor(Date.now() / 6e5); }
  function load(){
    var a = fetch(dataUrl()).then(function(r){ if (!r.ok) throw new Error('data'); return r.json(); });
    var b = fetch('/api/open/markets').then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
    return Promise.all([a, b]).then(function(x){ return compute(x[0], x[1]); });
  }
  window.KDD = { load: load, compute: compute, svg: svg, esc: esc, fmt: fmt, fmtDate: fmtDate, FONT: FONT };
})();
