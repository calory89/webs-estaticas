/* State of Off-Plan, live edition. Every number on the page is computed here, in your browser, from Kolaboro's public data.
   Nothing is typed by hand: the charts are drawn from the rows this script downloads, and the code under each chart is the
   exact function that produced it (shown with Function.prototype.toString). Each chart also has the same query in SQL (DuckDB). */
(function (G) {
  'use strict';

  /* Countries grouped into regions for this report (a classification, not data). Countries not listed are shown as "Not grouped". */
  var REGION = {
    'Southeast Asia': ['Cambodia', 'Indonesia', 'Laos', 'Malaysia', 'Philippines', 'Thailand', 'Vietnam'],
    'Gulf': ['Bahrain', 'Oman', 'Qatar', 'Saudi Arabia', 'UAE'],
    'Europe': ['Albania', 'Bulgaria', 'Croatia', 'Cyprus', 'France', 'Georgia', 'Greece', 'Ireland', 'Italy', 'Malta', 'Montenegro', 'Northern Cyprus', 'Portugal', 'Serbia', 'Spain', 'Turkey', 'United Kingdom'],
    'Americas': ['Antigua and Barbuda', 'Argentina', 'Aruba', 'Bahamas', 'Barbados', 'Belize', 'Brazil', 'Cayman Islands', 'Colombia', 'Costa Rica', 'Curacao', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Grenada', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama', 'Puerto Rico', 'Puerto Rico (USA)', 'Saint Lucia', 'St Kitts and Nevis', 'St Lucia', 'Turks and Caicos Islands', 'USA', 'Uruguay'],
    'Africa and Indian Ocean': ['Cape Verde', 'Egypt', 'Ghana', 'India', 'Kenya', 'Maldives', 'Mauritius', 'Morocco', 'Namibia', 'Rwanda', 'Senegal', 'Seychelles', 'South Africa', 'Sri Lanka', 'Tanzania'],
    'Oceania': ['Australia', 'Fiji', 'New Zealand', 'Vanuatu'],
    'East Asia': ['Japan']
  };
  var REGION_OF = {};
  Object.keys(REGION).forEach(function (r) { REGION[r].forEach(function (c) { REGION_OF[c] = r; }); });
  function regionOf(country) { return REGION_OF[country] || 'Not grouped'; }

  /* SQL for the region mapping, generated from the same list so the two cannot drift apart */
  function regionSql() {
    var v = [];
    Object.keys(REGION).forEach(function (r) { REGION[r].forEach(function (c) { v.push("('" + c.replace(/'/g, "''") + "', '" + r + "')"); }); });
    return 'region_map(country, region) AS (VALUES\n  ' + v.join(',\n  ') + ')';
  }
  var FROM = "read_parquet('https://kolaboro.com/data/kolaboro.parquet')";

  /* -------- The charts. run(R) receives every row of the dataset (one row per project) and returns what is drawn. -------- */
  var CHARTS = [
    {
      id: 'kpi', section: 'top', title: 'The dataset today',
      run: function (R) {
        var markets = {}, countries = {}, claims = 0, contradicted = 0, allSix = 0;
        R.forEach(function (p) {
          markets[p.market] = 1; countries[p.country] = 1;
          claims += p.claims_verified + p.claims_unverified + p.claims_contradicted;
          contradicted += p.claims_contradicted;
          if (p.all_six_public === true) allSix++;
        });
        return { projects: R.length, markets: Object.keys(markets).length, countries: Object.keys(countries).length,
          claims: claims, contradicted: contradicted, all_six_public: allSix };
      },
      sql: 'SELECT count(*) AS projects, count(DISTINCT market) AS markets, count(DISTINCT country) AS countries,\n' +
        '  sum(claims_verified + claims_unverified + claims_contradicted) AS claims, sum(claims_contradicted) AS contradicted,\n' +
        '  count(*) FILTER (WHERE all_six_public) AS all_six_public\nFROM ' + FROM + ';'
    },
    {
      id: 'publish', section: 'gap', kind: 'bars', title: 'Share of projects that publish each check',
      run: function (R) {
        var checks = [['permit_public', 'Permit or licence number'], ['deposit_protection', 'Deposit protection'],
          ['progress_public', 'Construction progress'], ['plans_public', 'Floor or site plans'],
          ['track_record_public', 'Developer track record'], ['no_guaranteed_returns', 'No guaranteed returns']];
        return checks.map(function (c) {
          var n = R.filter(function (p) { return p[c[0]] === true; }).length;
          return { label: c[1], n: n, of: R.length, share: n / R.length };
        });
      },
      sql: 'SELECT count(*) AS of,\n  count(*) FILTER (WHERE permit_public) AS permit_public, count(*) FILTER (WHERE deposit_protection) AS deposit_protection,\n' +
        '  count(*) FILTER (WHERE progress_public) AS progress_public, count(*) FILTER (WHERE plans_public) AS plans_public,\n' +
        '  count(*) FILTER (WHERE track_record_public) AS track_record_public, count(*) FILTER (WHERE no_guaranteed_returns) AS no_guaranteed_returns\nFROM ' + FROM + ';  -- share = column / of'
    },
    {
      id: 'consistency', section: 'gap', kind: 'note', title: 'Consistency check: do the six columns add up to the score?',
      run: function (R) {
        var cols = ['permit_public', 'deposit_protection', 'progress_public', 'plans_public', 'track_record_public', 'no_guaranteed_returns'];
        var bad = R.filter(function (p) {
          var n = cols.filter(function (c) { return p[c] === true; }).length;
          return n !== p.checks_public;
        });
        return { checked: R.length, mismatched: bad.length, ids: bad.map(function (p) { return p.id; }) };
      },
      sql: 'SELECT count(*) AS checked, count(*) FILTER (WHERE (coalesce(permit_public, false)::int + coalesce(deposit_protection, false)::int\n' +
        '  + coalesce(progress_public, false)::int + coalesce(plans_public, false)::int + coalesce(track_record_public, false)::int\n' +
        '  + coalesce(no_guaranteed_returns, false)::int) <> checks_public) AS mismatched\nFROM ' + FROM + ';'
    },
    {
      id: 'dist', section: 'gap', kind: 'bars', title: 'How many of the six checks each project publishes',
      run: function (R) {
        var out = [];
        for (var k = 0; k <= 6; k++) {
          var n = R.filter(function (p) { return p.checks_public === k; }).length;
          out.push({ label: k + ' of 6', n: n, of: R.length, share: n / R.length });
        }
        return out;
      },
      sql: 'SELECT k AS checks_public, count(p.id) AS n\nFROM range(0, 7) t(k) LEFT JOIN ' + FROM + ' p ON p.checks_public = k\nGROUP BY k ORDER BY k;'
    },
    {
      id: 'region', section: 'gap', kind: 'bars', scale: 6, title: 'Average number of the six checks published, by region',
      run: function (R) {
        var g = {};
        R.forEach(function (p) {
          var r = regionOf(p.country);
          g[r] = g[r] || { label: r, n: 0, sum: 0 };
          g[r].n++; g[r].sum += p.checks_public;
        });
        return Object.keys(g).map(function (k) { return { label: k, n: g[k].n, avg: g[k].sum / g[k].n }; })
          .sort(function (a, b) { return b.n - a.n || (a.label < b.label ? -1 : 1); });
      },
      sql: function () { return 'WITH ' + regionSql() + '\nSELECT coalesce(m.region, \'Not grouped\') AS region, count(*) AS n, avg(p.checks_public) AS avg\nFROM ' + FROM + ' p LEFT JOIN region_map m USING (country)\nGROUP BY 1 ORDER BY n DESC, region;'; }
    },
    {
      id: 'levels', section: 'holds', kind: 'stack', title: 'Verification level of every check result (projects × 6 checks)',
      run: function (R) {
        var cols = [['level_permit', 'Permit or licence number'], ['level_escrow', 'Deposit protection'], ['level_progress', 'Construction progress'],
          ['level_plans', 'Floor or site plans'], ['level_record', 'Developer track record'], ['level_returns_ok', 'No guaranteed returns']];
        var levels = ['registry', 'independent', 'developer', 'contradicted', 'none'];
        function count(rows, colList) {
          var c = { registry: 0, independent: 0, developer: 0, contradicted: 0, none: 0 }, total = 0;
          rows.forEach(function (p) { colList.forEach(function (col) { var l = levels.indexOf(p[col]) >= 0 ? p[col] : 'none'; c[l]++; total++; }); });
          return { counts: c, total: total };
        }
        var all = count(R, cols.map(function (c) { return c[0]; }));
        var rows = [{ label: 'All check results', counts: all.counts, total: all.total }];
        cols.forEach(function (c) { var x = count(R, [c[0]]); rows.push({ label: c[1], counts: x.counts, total: x.total }); });
        return { levels: levels, rows: rows };
      },
      sql: "SELECT check_name, level, count(*) AS n\nFROM (UNPIVOT (SELECT level_permit, level_escrow, level_progress, level_plans, level_record, level_returns_ok FROM " + FROM + ")\n" +
        "      ON COLUMNS(*) INTO NAME check_name VALUE level)\nGROUP BY ALL ORDER BY check_name, level;"
    },
    {
      id: 'claims', section: 'holds', kind: 'stack', title: 'Outcome of every developer claim tested',
      run: function (R) {
        var c = { verified: 0, unverified: 0, contradicted: 0 };
        R.forEach(function (p) { c.verified += p.claims_verified; c.unverified += p.claims_unverified; c.contradicted += p.claims_contradicted; });
        return { levels: ['verified', 'unverified', 'contradicted'], rows: [{ label: 'All claims', counts: c, total: c.verified + c.unverified + c.contradicted }] };
      },
      sql: 'SELECT sum(claims_verified) AS verified, sum(claims_unverified) AS unverified, sum(claims_contradicted) AS contradicted\nFROM ' + FROM + ';'
    },
    {
      id: 'stage', section: 'stage', kind: 'stack', title: 'Stage of every project',
      run: function (R) {
        var c = { 'off-plan': 0, 'under construction': 0, completed: 0, 'not stated': 0 };
        R.forEach(function (p) { var s = p.stage in c ? p.stage : 'not stated'; c[s]++; });
        return { levels: ['off-plan', 'under construction', 'completed', 'not stated'], rows: [{ label: 'All projects', counts: c, total: R.length }] };
      },
      sql: "SELECT CASE WHEN stage IN ('off-plan', 'under construction', 'completed') THEN stage ELSE 'not stated' END AS stage, count(*) AS n\nFROM " + FROM + '\nGROUP BY 1 ORDER BY n DESC;'
    },
    {
      id: 'delay', section: 'stage', kind: 'bars', title: 'Reported delay, for projects with a delay figure',
      run: function (R) {
        var d = R.map(function (p) { return p.delay_months; }).filter(function (x) { return typeof x === 'number'; }).sort(function (a, b) { return a - b; });
        var buckets = [['0 months or early', -Infinity, 0], ['1 to 6 months', 0, 6], ['7 to 12 months', 6, 12], ['13 to 24 months', 12, 24], ['25 to 48 months', 24, 48], ['More than 48 months', 48, Infinity]];
        var bars = buckets.map(function (b) {
          var n = d.filter(function (x) { return x > b[1] && x <= b[2]; }).length;
          return { label: b[0], n: n, of: d.length, share: d.length ? n / d.length : 0 };
        });
        var h = d.length >> 1, median = d.length ? (d.length % 2 ? d[h] : (d[h - 1] + d[h]) / 2) : null;
        return { bars: bars, with_figure: d.length, of: R.length, late: d.filter(function (x) { return x > 0; }).length, median: median, max: d.length ? d[d.length - 1] : null };
      },
      sql: "SELECT count(delay_months) AS with_figure, count(*) AS of, count(*) FILTER (WHERE delay_months > 0) AS late,\n" +
        "  quantile_cont(delay_months, 0.5) AS median, max(delay_months) AS max,\n" +
        "  count(*) FILTER (WHERE delay_months <= 0) AS \"0 months or early\", count(*) FILTER (WHERE delay_months > 0 AND delay_months <= 6) AS \"1 to 6\",\n" +
        "  count(*) FILTER (WHERE delay_months > 6 AND delay_months <= 12) AS \"7 to 12\", count(*) FILTER (WHERE delay_months > 12 AND delay_months <= 24) AS \"13 to 24\",\n" +
        "  count(*) FILTER (WHERE delay_months > 24 AND delay_months <= 48) AS \"25 to 48\", count(*) FILTER (WHERE delay_months > 48) AS \"more than 48\"\nFROM " + FROM + ';'
    },
    {
      id: 'markets', section: 'markets', kind: 'table', title: 'Markets with at least 5 projects, ranked by checks published, then by results confirmed',
      run: function (R) {
        var g = {};
        R.forEach(function (p) {
          var m = g[p.market] = g[p.market] || { market: p.market, country: p.country, n: 0, checks: 0, confirmed: 0, permit: 0, deposit: 0 };
          m.n++; m.checks += p.checks_public; m.confirmed += p.checks_confirmed;
          if (p.permit_public === true) m.permit++;
          if (p.deposit_protection === true) m.deposit++;
        });
        var rows = Object.keys(g).map(function (k) { return g[k]; }).filter(function (m) { return m.n >= 5; }).map(function (m) {
          return { market: m.market, country: m.country, projects: m.n, avg_checks: m.checks / m.n, permit: m.permit / m.n,
            deposit: m.deposit / m.n, confirmed: m.confirmed / (6 * m.n) };
        });
        rows.sort(function (a, b) { return b.avg_checks - a.avg_checks || b.confirmed - a.confirmed || (a.market < b.market ? -1 : 1); });
        return { markets: rows.length, most: rows.slice(0, 10), least: rows.slice(-10).reverse() };
      },
      sql: 'SELECT market, any_value(country) AS country, count(*) AS projects, avg(checks_public) AS avg_checks,\n' +
        '  count(*) FILTER (WHERE permit_public) / count(*) AS permit, count(*) FILTER (WHERE deposit_protection) / count(*) AS deposit,\n' +
        '  sum(checks_confirmed) / (6 * count(*)) AS confirmed\nFROM ' + FROM + '\nGROUP BY market HAVING count(*) >= 5\nORDER BY avg_checks DESC, confirmed DESC, market;  -- first 10 rows = most, last 10 = least'
    }
  ];

  /* -------- Optional source: the live JSON database, mapped to the same columns as the Parquet file -------- */
  function fromJson(d, level) {
    return (d.cases || []).map(function (c) {
      var k = c.checks || {}, v = c.verified || {}, cl = c.claims || {}, flags = (c.flags || []).length;
      return {
        id: c.id, market: c.market, country: c.country, stage: c.stage || null,
        checks_public: c.score, checks_confirmed: c.vscore || 0,
        permit_public: k.permit === 2, deposit_protection: k.escrow === undefined ? null : k.escrow,
        progress_public: k.progress === null || k.progress === undefined ? null : true, plans_public: !!k.plans,
        track_record_public: !!k.record, no_guaranteed_returns: !!k.returns_ok,
        level_permit: level(v.permit), level_escrow: level(v.escrow), level_progress: level(v.progress),
        level_plans: level(v.plans), level_record: level(v.record), level_returns_ok: level(v.returns_ok),
        claims_verified: cl.verified || 0, claims_unverified: cl.unverified || 0, claims_contradicted: cl.contradicted || 0,
        flags: flags, all_six_public: c.score === 6 && !flags, delay_months: typeof c.delay === 'number' ? c.delay : null
      };
    });
  }
  function levelOf(t) { t = String(t == null ? 'none' : t).toLowerCase(); var L = ['registry', 'independent', 'developer', 'contradicted', 'none']; for (var i = 0; i < L.length; i++) if (t.indexOf(L[i]) >= 0) return L[i]; return 'none'; }

  var API = { CHARTS: CHARTS, REGION: REGION, regionOf: regionOf, fromJson: function (d) { return fromJson(d, levelOf); } };
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; return; }
  G.SOPLive = API;

  /* ================= Browser: load, verify, compute, draw ================= */
  var $ = function (i) { return document.getElementById(i); };
  var fmt = function (n) { return Number(n).toLocaleString('en'); };
  var pct = function (x) { return Math.round(x * 100) + '%'; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var COLORS = { registry: '#17212B', independent: '#1E8A5A', developer: '#B9B4A8', contradicted: '#C9461A', none: '#E7E4DC',
    verified: '#1E8A5A', unverified: '#B9B4A8', 'off-plan': '#FF5B14', 'under construction': '#17212B', completed: '#1E8A5A', 'not stated': '#E7E4DC' };
  var NAMES = { registry: 'Registry', independent: 'Independent', developer: 'Developer only', contradicted: 'Contradicted', none: 'No source recorded',
    verified: 'Verified', unverified: 'Unverified', 'off-plan': 'Off-plan', 'under construction': 'Under construction', completed: 'Completed', 'not stated': 'Not stated' };
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function bar(share, color) {
    var w = Math.max(0, Math.min(100, share * 100)).toFixed(2);
    return '<svg class="sb" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="100" height="10" fill="#E7E4DC"/><rect width="' + w + '" height="10" fill="' + (color || '#17212B') + '"/></svg>';
  }
  function stackBar(counts, levels, total) {
    var x = 0, s = '<svg class="sb sk" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false"><rect width="100" height="10" fill="#E7E4DC"/>';
    levels.forEach(function (l) { var w = total ? 100 * counts[l] / total : 0; s += '<rect x="' + x.toFixed(3) + '" width="' + w.toFixed(3) + '" height="10" fill="' + COLORS[l] + '"/>'; x += w; });
    return s + '</svg>';
  }
  function legend(levels) { return '<ul class="lg" aria-hidden="true">' + levels.map(function (l) { return '<li><i style="background:' + COLORS[l] + '"></i>' + NAMES[l] + '</li>'; }).join('') + '</ul>'; }
  function codeBlock(ch) {
    var sql = typeof ch.sql === 'function' ? ch.sql() : ch.sql;
    return '<details class="lv-code"><summary>Code that drew this chart</summary>' +
      '<p class="lv-cl">JavaScript, run in your browser just now on every row of the dataset (<code>R</code>):</p><pre><code>' + esc('run = ' + ch.run.toString()) + '</code></pre>' +
      '<p class="lv-cl">The same query in SQL, for <a href="https://duckdb.org/docs/installation/">DuckDB</a> or any Parquet reader:</p><pre><code>' + esc(sql) + '</code></pre></details>';
  }
  function draw(ch, out, R) {
    var h = '<figure class="ch" id="ch-' + ch.id + '"><figcaption>' + esc(ch.title) + '</figcaption>';
    if (ch.kind === 'note') {
      h = '<div class="lv-note' + (out.mismatched ? ' bad' : '') + '" id="ch-' + ch.id + '"><p><b>' + esc(ch.title) + '</b> ' + (out.mismatched ?
        'In ' + fmt(out.mismatched) + ' of ' + fmt(out.checked) + ' projects the six published-check columns do not add up to the number of checks published (' + esc(out.ids.slice(0, 8).join(', ')) + (out.ids.length > 8 ? ', \u2026' : '') + '). The chart above uses the columns as published, so it may differ slightly from the scores; this has been reported to the data team and the note disappears once the file is corrected.' :
        'Yes: in all ' + fmt(out.checked) + ' projects the six columns add up to the number of checks published.') + '</p>' + codeBlock(ch) + '</div>';
      return h;
    }
    if (ch.kind === 'bars' && ch.id !== 'delay' && ch.id !== 'region') {
      h += '<div class="ch-rows">' + out.map(function (r) { return '<div class="ch-r"><span class="ch-l">' + esc(r.label) + '</span>' + bar(r.share, ch.id === 'publish' ? '#FF5B14' : '#17212B') + '<span class="ch-v"><b>' + pct(r.share) + '</b><small>' + fmt(r.n) + ' of ' + fmt(r.of) + '</small></span></div>'; }).join('') + '</div>';
    } else if (ch.id === 'region') {
      h += '<div class="ch-rows">' + out.map(function (r) { return '<div class="ch-r"><span class="ch-l">' + esc(r.label) + '</span>' + bar(r.avg / 6) + '<span class="ch-v"><b>' + r.avg.toFixed(1) + '</b><small>' + fmt(r.n) + ' projects</small></span></div>'; }).join('') + '</div>';
      var ng = R.filter(function (p) { return regionOf(p.country) === 'Not grouped'; }).map(function (p) { return p.country; });
      h += '<p class="ch-n">' + (ng.length ? 'Not grouped: ' + esc(Array.from(new Set(ng)).sort().join(', ')) + '. ' : 'Every country in the data is grouped. ') + 'Region groups are listed in the code below.</p>';
    } else if (ch.id === 'delay') {
      h += '<div class="ch-rows">' + out.bars.map(function (r) { return '<div class="ch-r"><span class="ch-l">' + esc(r.label) + '</span>' + bar(r.share) + '<span class="ch-v"><b>' + fmt(r.n) + '</b><small>projects</small></span></div>'; }).join('') + '</div>';
    } else if (ch.kind === 'stack') {
      h += legend(out.levels) + '<div class="ch-rows">' + out.rows.map(function (r) {
        return '<div class="ch-r ch-s"><span class="ch-l">' + esc(r.label) + ' <small>(' + fmt(r.total) + ')</small></span>' + stackBar(r.counts, out.levels, r.total) +
          '<span class="ch-t">' + out.levels.map(function (l) { return NAMES[l] + ' ' + (r.total ? pct(r.counts[l] / r.total) : '0%') + ' (' + fmt(r.counts[l]) + ')'; }).join(' · ') + '</span></div>';
      }).join('') + '</div>';
    } else if (ch.kind === 'table') {
      var t = function (rows, cap, id) {
        return '<p class="tcap" id="' + id + '">' + cap + '</p><div class="tw" tabindex="0" role="region" aria-labelledby="' + id + '"><table class="tb"><thead><tr><th scope="col">Market</th><th scope="col" class="tl">Country</th><th scope="col">Projects</th><th scope="col">Checks published (of 6)</th><th scope="col">Permit no.</th><th scope="col">Deposit protection</th><th scope="col">Results confirmed</th></tr></thead><tbody>' +
          rows.map(function (m) { return '<tr><th scope="row">' + esc(m.market) + '</th><td class="tl">' + esc(m.country) + '</td><td>' + fmt(m.projects) + '</td><td>' + m.avg_checks.toFixed(1) + '</td><td>' + pct(m.permit) + '</td><td>' + pct(m.deposit) + '</td><td>' + pct(m.confirmed) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      };
      h = '<div class="lv-tbl" id="ch-' + ch.id + '"><p class="lead">' + fmt(out.markets) + ' markets have at least 5 projects.</p>' +
        t(out.most, 'The ' + Math.min(10, out.most.length) + ' markets with the most public information', 't-most') +
        t(out.least, 'The ' + Math.min(10, out.least.length) + ' markets with the least public information', 't-least') +
        '<p class="fn">"Results confirmed" is the share of all six check results in the market confirmed by a registry or an independent source.</p>' + codeBlock(ch) + '</div>';
      return h;
    }
    return h + codeBlock(ch) + '</figure>';
  }

  function sentence(id, o) {
    if (id === 'kpi') return fmt(o.projects) + ' projects in ' + fmt(o.markets) + ' markets and ' + fmt(o.countries) + ' countries. ' + fmt(o.claims) + ' developer claims tested, ' + fmt(o.contradicted) + ' contradicted by another source. ' + fmt(o.all_six_public) + ' projects publish all six checks with no reported problem.';
    if (id === 'publish') { var s = o.slice().sort(function (a, b) { return a.share - b.share; }); return 'The least published checks are ' + s[0].label.toLowerCase() + ' (' + pct(s[0].share) + ') and ' + s[1].label.toLowerCase() + ' (' + pct(s[1].share) + '). The most published is ' + s[5].label.toLowerCase() + ' (' + pct(s[5].share) + ').'; }
    if (id === 'levels') { var a = o.rows[0], c = a.counts; return pct((c.registry + c.independent) / a.total) + ' of all ' + fmt(a.total) + ' check results are confirmed by a registry or an independent source. ' + pct(c.developer / a.total) + ' rest on the developer’s word alone and ' + pct(c.contradicted / a.total) + ' are contradicted.'; }
    if (id === 'claims') { var r = o.rows[0]; return fmt(r.total) + ' claims tested: ' + fmt(r.counts.verified) + ' verified, ' + fmt(r.counts.unverified) + ' could not be verified and ' + fmt(r.counts.contradicted) + ' were contradicted.'; }
    if (id === 'stage') { var q = o.rows[0].counts; return fmt(q['under construction']) + ' projects are under construction, ' + fmt(q['off-plan']) + ' are off-plan, ' + fmt(q.completed) + ' are completed but still selling and ' + fmt(q['not stated']) + ' do not state a stage.'; }
    if (id === 'delay') return o.with_figure ? fmt(o.with_figure) + ' of ' + fmt(o.of) + ' projects (' + pct(o.with_figure / o.of) + ') have a reported delay figure; ' + fmt(o.late) + ' of them are late. The median delay is ' + o.median + ' months and the longest is ' + o.max + ' months.' : 'No project has a reported delay figure yet.';
    return '';
  }

  var SRC = {
    parquet: { label: 'Parquet', url: '/data/kolaboro.parquet', manifest: '/data/kolaboro.parquet.json', signed: '/api/x/e/parquet-manifest' },
    json: { label: 'JSON', url: '/data/bali-cases.json' }
  };

  function load(kind) {
    var t0 = performance.now(), s = SRC[kind];
    return fetch(s.url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(s.url + ': HTTP ' + r.status); return r.arrayBuffer(); }).then(function (buf) {
      return crypto.subtle.digest('SHA-256', buf).then(function (d) {
        var meta = { kind: kind, url: s.url, bytes: buf.byteLength, sha256: hex(d), fetched: new Date() };
        if (kind === 'json') {
          var j = JSON.parse(new TextDecoder().decode(buf));
          meta.updated = j.updated || (j.db && j.db.updated) || '';
          return { rows: API.fromJson(j), meta: meta, ms: performance.now() - t0 };
        }
        return import('./pq.js?v=' + 'daf4917b6a').then(function (pq) {
          return pq.parquetReadObjects({ file: buf, compressors: pq.compressors });
        }).then(function (rows) {
          rows.forEach(function (r) { ['claims_verified', 'claims_unverified', 'claims_contradicted', 'checks_public', 'checks_confirmed', 'flags'].forEach(function (k) { if (typeof r[k] === 'bigint') r[k] = Number(r[k]); }); });
          return { rows: rows, meta: meta, ms: performance.now() - t0 };
        });
      });
    });
  }

  function provenance(res) {
    var m = res.meta, box = $('lvProv');
    var h = '<dl class="lv-dl"><div><dt>Source</dt><dd><a href="' + m.url + '">' + m.url + '</a> (' + fmt(m.bytes) + ' bytes, ' + fmt(res.rows.length) + ' rows)</dd></div>' +
      '<div><dt>SHA-256 computed in your browser</dt><dd><code>' + m.sha256 + '</code></dd></div>' +
      '<div><dt>Downloaded</dt><dd>' + m.fetched.toISOString().replace('T', ' ').slice(0, 19) + ' UTC, computed in ' + Math.round(res.ms) + ' ms</dd></div>';
    box.innerHTML = h + '<div id="lvMan"><dt>Checks</dt><dd>Checking the published manifest…</dd></div></dl>';
    $('lvStamp').textContent = 'Computed from ' + m.url + ' (SHA-256 ' + m.sha256.slice(0, 12) + '…) at ' + m.fetched.toISOString().slice(11, 16) + ' UTC.';
    if (m.kind === 'json') {
      fetch('/api/open/summary').then(function (r) {
        var want = r.headers.get('x-kolaboro-dataset-sha256');
        $('lvMan').innerHTML = '<dt>Checks</dt><dd>' + (want ? (want === m.sha256 ? '<b class="lv-ok">Matches</b> the dataset fingerprint in the signed open summary.' : '<b class="lv-bad">Differs</b> from the fingerprint in the open summary (' + esc(want.slice(0, 12)) + '…); the file may have been updated since.') : 'Database updated ' + esc(m.updated) + '.') + '</dd>';
      }).catch(function () { $('lvMan').innerHTML = '<dt>Checks</dt><dd>Open summary not reachable right now.</dd>'; });
      return;
    }
    var man = fetch(SRC.parquet.manifest, { cache: 'no-cache' }).then(function (r) { return r.json(); });
    var signed = fetch(SRC.parquet.signed).then(function (r) { return r.text().then(function (t) { return { body: t, sig: r.headers.get('x-kolaboro-signature') }; }); }).catch(function () { return null; });
    Promise.all([man, signed]).then(function (a) {
      var M = a[0], f = (M.files || []).filter(function (x) { return x.path === SRC.parquet.url; })[0] || {}, parts = [];
      parts.push(f.sha256 === m.sha256 ? '<b class="lv-ok">Matches</b> the SHA-256 in the <a href="' + SRC.parquet.manifest + '">manifest</a>' : '<b class="lv-bad">Does not match</b> the manifest (' + esc(String(f.sha256 || '').slice(0, 12)) + '…). The file may be mid-update; reload in a minute.');
      parts.push('built ' + esc(String(M.generated || '').replace('T', ' ').replace('Z', ' UTC')) + ' from <a href="' + esc(M.source && M.source.url) + '">bali-cases.json</a> (' + fmt(M.source && M.source.projects) + ' projects, updated ' + esc(M.source && M.source.updated) + ')');
      var done = function (sigOk) {
        if (sigOk === true) parts.push('the server re-hashed the file and <b class="lv-ok">signed the same SHA-256</b> (Ed25519, checked here with <a href="/open/kolaboro-verify.js">kolaboro-verify.js</a>)');
        else if (sigOk === false) parts.push('the manifest signature <b class="lv-bad">could not be confirmed</b> in this browser');
        $('lvMan').innerHTML = '<dt>Checks</dt><dd>' + parts.join('; ') + '.</dd>';
      };
      if (!a[1] || !a[1].sig || !G.KV) return done(null);
      G.KV.verifySignature(a[1].body, a[1].sig, 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=').then(function (ok) {
        var j = null; try { j = JSON.parse(a[1].body); } catch (e) {}
        var same = j && (j.files || []).some(function (x) { return x.path === SRC.parquet.url && (x.sha256_served || x.sha256) === m.sha256; });
        done(ok && same ? true : (ok ? null : false));
      }, function () { done(false); });
    }).catch(function () { $('lvMan').innerHTML = '<dt>Checks</dt><dd>Manifest not reachable right now; the SHA-256 above is still what you downloaded.</dd>'; });
  }

  function render(res) {
    var R = res.rows;
    CHARTS.forEach(function (ch) {
      var out = ch.run(R), slot = $('lv-' + ch.id);
      if (ch.id === 'kpi') {
        $('lvKn').innerHTML = [['Projects', out.projects], ['Markets · countries', fmt(out.markets) + ' · ' + fmt(out.countries)], ['Claims tested', out.claims], ['Publish all six', out.all_six_public]]
          .map(function (k) { return '<div><dt>' + k[0] + '</dt><dd>' + (typeof k[1] === 'number' ? fmt(k[1]) : k[1]) + '</dd></div>'; }).join('');
        $('lvLead').textContent = sentence('kpi', out);
        $('lv-kpi').innerHTML = codeBlock(ch);
        return;
      }
      var s = sentence(ch.id, out), p = $('lvs-' + ch.id);
      if (p) p.textContent = s;
      if (slot) slot.innerHTML = draw(ch, out, R);
    });
    provenance(res);
    document.body.setAttribute('data-lv', 'ready');
  }

  function start() {
    var q = new URLSearchParams(location.search), kind = q.get('source') === 'json' ? 'json' : 'parquet';
    document.querySelectorAll('[data-src]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-src') === kind));
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-src'), u = new URL(location.href);
        if (k === 'json') u.searchParams.set('source', 'json'); else u.searchParams.delete('source');
        history.replaceState(null, '', u); document.querySelectorAll('[data-src]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        go(k);
      });
    });
    go(kind);
  }
  function go(kind) {
    $('lvState').textContent = 'Downloading and computing from the ' + SRC[kind].label + ' file…';
    load(kind).then(function (res) {
      $('lvState').textContent = 'Source: ' + SRC[kind].label + ' file. ' + (kind === 'parquet' ? 'Switch to JSON to compute the same charts from the live database file instead.' : 'Computed from the live JSON database, mapped to the Parquet columns by fromJson() in live.js.');
      render(res);
    }).catch(function (e) {
      if (kind === 'parquet') { $('lvState').textContent = 'The Parquet file could not be read (' + e.message + '). Falling back to the JSON database.'; return load('json').then(render); }
      $('lvState').textContent = 'The data could not be loaded right now (' + e.message + '). Nothing is shown rather than old numbers. Please reload.';
    }).catch(function (e) { $('lvState').textContent = 'The data could not be loaded right now (' + e.message + '). Please reload.'; });
    loadTests();
  }

  /* Property-based tests of the scoring rules: results published by the test run itself */
  var testsLoaded = false;
  function loadTests() {
    if (testsLoaded || !$('lvTests')) return; testsLoaded = true;
    fetch('/data/property-tests.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (t) {
      var props = t.properties || [], pass = props.filter(function (p) { return p.passed; }).length, mu = t.mutation || {};
      $('lvTk').innerHTML = [['Random cases run', fmt(t.cases_total)], ['Properties holding', pass + ' of ' + props.length], ['Injected bugs caught', fmt(mu.caught) + ' of ' + fmt(mu.total)], ['Last run', String(t.generated || '').slice(0, 10)]]
        .map(function (k) { return '<div><dt>' + k[0] + '</dt><dd>' + k[1] + '</dd></div>'; }).join('');
      $('lvTests').innerHTML = '<div class="tw"><table class="tb lv-pt"><thead><tr><th scope="col">Property</th><th scope="col">Suite</th><th scope="col">Cases</th><th scope="col">Result</th></tr></thead><tbody>' +
        props.map(function (p) { return '<tr><th scope="row" class="tl">' + esc(p.property) + '</th><td>' + (p.suite === 'python' ? 'Python' : 'JavaScript') + '</td><td>' + fmt(p.cases) + '</td><td>' + (p.passed ? '<b class="lv-ok">holds</b>' : (p.known_issue ? '<b class="lv-bad">known issue</b>' : '<b class="lv-bad">fails</b>')) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (t.known_issues && t.known_issues.length ? '<p class="fn">Known issue, reported for a fix: the market transparency index computed in the browser and by the open Python rules can differ by 0.1 point (' + fmt((props.filter(function (p) { return p.known_issue; })[0] || {}).mismatches || 0) + ' of ' + fmt((props.filter(function (p) { return p.known_issue; })[0] || {}).cases || 0) + ' random markets), because the two languages round differently. The test keeps running and this note disappears when the fix ships.</p>' : '') +
        '<p class="fn">Engines: ' + esc((t.engines || []).join('; ')) + '. Files tested (SHA-256): ' + Object.keys(t.files_tested || {}).map(function (k) { return '<code>' + esc(k) + '</code> ' + esc(t.files_tested[k].slice(0, 12)) + '…'; }).join(', ') + '. Raw results: <a href="/data/property-tests.json">property-tests.json</a>.</p>';
    }).catch(function () { $('lvTests').innerHTML = '<p class="fn">Test results are not published yet.</p>'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
