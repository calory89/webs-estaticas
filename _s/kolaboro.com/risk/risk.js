(function(){
  if (!document.getElementById('rRoot')) return;
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function set(id, v){ var e = document.getElementById(id); if (e) e.textContent = v; }
  var TAG = { unusual: 'u', 'somewhat unusual': 's', typical: 't' };
  var D, LBL = {};
  function rawv(k, v){ if (k === 'contradicted_claims_share') return Math.round(v * 100) + '%'; if (/_months$/.test(k)) return v + ' mo'; if (k === 'advertised_yield_pct' || k === 'front_loaded_payment_plan') return v + '%'; return /^(no_|guaranteed|permit_contr|register_|satellite_)/.test(k) ? 'yes' : String(v); }
  function explain(id, p){
    var h = '<div class="h-card"><h3><a href="/p/?id=' + encodeURIComponent(id) + '">' + esc(id) + '</a> <span class="h-tag ' + TAG[p.lvl] + '">' + esc(p.lvl) + '</span></h3>' +
      '<p class="h-src">' + esc(p.m) + '. Score ' + p.s + (p.r >= 99.95 ? ' (the highest of all tracked projects)' : ' (higher than ' + Math.floor(p.r) + '% of tracked projects)') + '. Isolation forest: ' + (p['if'] >= 99.95 ? 'the most isolated project.' : 'more isolated than ' + Math.floor(p['if']) + '%.') + '</p>';
    if (!p.c.length) return h + '<p>No warning sign in the model applies to this project.</p></div>';
    var mx = 8;
    h += p.c.map(function(c){ return '<div class="h-ctb"><span>' + esc(LBL[c[0]] || c[0]) + ' <span class="h-note">(' + esc(rawv(c[0], c[2])) + ')</span></span><span class="h-cbar"><i style="width:' + (100 * c[1] / mx).toFixed(1) + '%"></i></span><span class="n">+' + c[1].toFixed(1) + '</span></div>'; }).join('');
    return h + '<p class="h-note" style="margin-top:10px">Each bar is one feature\'s robust z-score versus all tracked projects; they add up to the score. Unusual is not the same as fraudulent.</p></div>';
  }
  function look(){
    var v = (document.getElementById('rId').value || '').trim().toUpperCase(), o = document.getElementById('rOut');
    if (!v) { o.innerHTML = ''; return; }
    var p = D.projects[v];
    o.innerHTML = p ? explain(v, p) : '<p class="h-note">No tracked project with the id ' + esc(v) + '. Ids look like DXB-001 or BALI-014.</p>';
    try { history.replaceState(null, '', '?id=' + encodeURIComponent(v)); } catch (e) {}
  }
  fetch('/data/risk.json?t=' + Math.floor(Date.now() / 6e5)).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
    D = d; var mc = d.model_card; mc.features.forEach(function(f){ LBL[f.feature] = f.label; });
    set('r-u', d.summary.unusual); set('r-s', d.summary.somewhat_unusual); set('r-t', d.summary.typical); set('r-rho', mc.agreement.spearman_rank_correlation.toFixed(2));
    set('r-ver', mc.version); set('r-upd', d.updated); set('r-sha', mc.data.sha256); set('r-n', mc.data.projects); set('r-date', mc.data.dataset_date);
    set('r-both', mc.agreement.top5_both_methods + ' of ' + mc.agreement.top5_size); set('r-th1', mc.thresholds.unusual_score_from); set('r-th2', mc.thresholds.somewhat_unusual_from);
    set('r-purpose', mc.purpose); set('r-notfor', mc.not_for);
    document.getElementById('rFeat').innerHTML = mc.features.map(function(f){
      var w = f.kind === 'binary' ? 'when present: +' + f.z_when_present.toFixed(2) : (f.kind === 'number' || f.kind === 'number, where known') ? '(x - ' + f.median + ') / ' + f.scale + (f.known_projects ? ', among ' + f.known_projects + ' projects with a value' : '') : 'any: +' + f.z_when_present.toFixed(2) + ', plus size vs median ' + f.median_when_present + ' (scale ' + f.scale_when_present + ')';
      return '<tr><td>' + esc(f.label) + '<div class="h-code">' + esc(f.feature) + '</div></td><td>' + esc(f.kind) + '</td><td class="n">' + (f.prevalence_pct != null ? f.prevalence_pct : f.present_pct) + '%</td><td>' + esc(w) + '</td></tr>'; }).join('');
    document.getElementById('rNA').innerHTML = mc.features_not_available.map(function(f){ return '<li><b>' + esc(f.feature.replace(/_/g, ' ')) + '</b>: ' + esc(f.why) + '</li>'; }).join('');
    document.getElementById('rMethod').innerHTML = mc.method.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    document.getElementById('rLimits').innerHTML = mc.limits.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('');
    document.getElementById('rTop').innerHTML = d.top.slice(0, 12).map(function(id){ return explain(id, d.projects[id]); }).join('');
    document.getElementById('rMk').innerHTML = d.markets.map(function(m){ return '<tr><td>' + esc(m.market) + '</td><td class="n">' + m.projects + '</td><td class="n">' + m.unusual + '</td><td class="n">' + m.median_score.toFixed(2) + '</td></tr>'; }).join('');
    var q = null; try { q = new URLSearchParams(location.search).get('id'); } catch (e) {}
    if (q) { document.getElementById('rId').value = q; look(); }
  }).catch(function(){ document.getElementById('rTop').innerHTML = '<p class="h-claim h-none">The model output could not be loaded. Read <a href="/data/risk.json">/data/risk.json</a> directly.</p>'; });
  document.getElementById('rForm').addEventListener('submit', function(e){ e.preventDefault(); if (D) look(); });
})();
