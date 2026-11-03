/* Kolaboro "what would change this score": the open scoring rules (/open/scoring.py, version 2026-11-01) ported line by line
   to JavaScript, plus deterministic counterfactuals. No AI, no server: every number is computed here from the public record.
   Tested against every published project (p/whatif.test.js): score, vscore and tier must match 100%. MIT licence. */
(function (g) {
  var CONFIRMED = ['registry', 'independent'], LEVELS = ['registry', 'independent', 'developer', 'contradicted', 'none'];
  var CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];

  /* scoring.score(ck): one point per public check */
  function score(ck) {
    ck = ck || {};
    return (ck.permit === 2 ? 1 : 0) + (ck.escrow === true ? 1 : 0) + (ck.progress !== null && ck.progress !== undefined ? 1 : 0) +
      (ck.plans ? 1 : 0) + (ck.record ? 1 : 0) + (ck.returns_ok ? 1 : 0);
  }
  /* scoring.level(text) */
  function level(t) {
    t = String(t == null ? 'none' : t).toLowerCase();
    for (var i = 0; i < LEVELS.length; i++) if (t.indexOf(LEVELS[i]) >= 0) return LEVELS[i];
    return 'none';
  }
  /* scoring.confirmed_score(verification) */
  function vscore(v) {
    var n = 0; v = v || {};
    Object.keys(v).forEach(function (k) { if (CONFIRMED.indexOf(level(v[k])) >= 0) n++; });
    return n;
  }
  /* scoring.tier(s, flags, researched) */
  function tier(s, flags, researched) {
    if ((flags && flags.length) || s <= 1) return 'caution';
    return s >= (researched === 3 ? 3 : 4) ? 'clear' : 'mixed';
  }
  function researchedOf(c) { var r = (c.checks || {}).researched; return r && r.length ? r.length : 6; }
  /* Everything the public record says, recomputed */
  function evaluate(c) {
    var s = score(c.checks);
    return { score: s, vscore: vscore(c.verified), tier: tier(s, c.flags, researchedOf(c)) };
  }

  var MET = {
    permit: function (ck) { return ck.permit === 2; },
    escrow: function (ck) { return ck.escrow === true; },
    progress: function (ck) { return ck.progress !== null && ck.progress !== undefined; },
    plans: function (ck) { return !!ck.plans; },
    record: function (ck) { return !!ck.record; },
    returns_ok: function (ck) { return !!ck.returns_ok; }
  };
  var SET = { permit: 2, escrow: true, progress: 'updates', plans: true, record: true, returns_ok: true };
  var IF_PUB = {
    permit: 'the permit or licence number were published',
    escrow: 'deposit protection (escrow, bank guarantee or trust account) were published',
    progress: 'construction progress (a percentage or dated updates) were published',
    plans: 'site or floor plans were published',
    record: 'a track record of delivered projects were published',
    returns_ok: 'the "guaranteed return" language were removed'
  };
  var IF_CONF = {
    permit: 'the permit were confirmed on an official register',
    escrow: 'deposit protection were confirmed by a registry or independent source',
    progress: 'construction progress were confirmed independently',
    plans: 'the plans were confirmed by a registry or independent source',
    record: 'the track record were confirmed independently',
    returns_ok: 'the absence of guaranteed returns were confirmed independently'
  };

  function clone(c) { return JSON.parse(JSON.stringify(c)); }
  function indexOf(rows, market) { for (var i = 0; i < rows.length; i++) if (rows[i].market === market) return rows[i]; return null; }

  /* Counterfactuals: change one input, rerun the same rules, report what moves. cases + KTI are optional (market index). */
  function whatIf(c, cases, KTI) {
    var base = evaluate(c), ck = c.checks || {}, V = c.verified || {}, out = [];
    var tiBase = null, idx = -1;
    if (cases && KTI) {
      for (var i = 0; i < cases.length; i++) if (cases[i].id === c.id) { idx = i; break; }
      if (idx >= 0) tiBase = indexOf(KTI.compute({ cases: cases }).rows, c.market);
    }
    function market(mod) {
      if (!tiBase) return null;
      var C = cases.slice(); C[idx] = mod;
      var r = indexOf(KTI.compute({ cases: C }).rows, c.market);
      return r ? { from: tiBase.index, to: r.index, rankFrom: tiBase.rank, rankTo: r.rank } : null;
    }
    function apply(kind, key, mutate, text) {
      var m = clone(c); mutate(m);
      var e = evaluate(m); m.score = e.score; m.vscore = e.vscore; m.tier = e.tier;
      out.push({ kind: kind, key: key, text: text, score: [base.score, e.score], vscore: [base.vscore, e.vscore], tier: [base.tier, e.tier], market: market(m) });
    }
    CHECKS.forEach(function (k) {
      if (!MET[k](ck)) apply('publish', k, function (m) { m.checks = m.checks || {}; m.checks[k] = SET[k]; }, IF_PUB[k]);
    });
    CHECKS.forEach(function (k) {
      if (CONFIRMED.indexOf(level(V[k])) < 0) apply('confirm', k, function (m) { m.verified = m.verified || {}; m.verified[k] = 'registry'; }, IF_CONF[k]);
    });
    if ((c.flags || []).length) apply('flags', 'flags', function (m) { m.flags = []; }, 'the problems in public reports were resolved and no longer reported');
    var miss = CHECKS.filter(function (k) { return !MET[k](ck); });
    if (miss.length > 1) apply('all', 'all', function (m) { miss.forEach(function (k) { m.checks[k] = SET[k]; }); }, 'all ' + miss.length + ' missing checks were published');
    return { base: base, items: out, market: tiBase ? { index: tiBase.index, rank: tiBase.rank, of: null } : null };
  }

  g.KBScore = { version: '2026-11-01', score: score, level: level, vscore: vscore, tier: tier, evaluate: evaluate, whatIf: whatIf, CHECKS: CHECKS };
  if (typeof module !== 'undefined' && module.exports) module.exports = g.KBScore;
})(typeof window !== 'undefined' ? window : globalThis);
