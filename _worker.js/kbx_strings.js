// kolaboro.com n32w (19 Nov 2026): string tables kept as static JSON instead of worker code.
// Cloudflare Pages refuses every build when the _worker.js directory passes 25 MiB (18 Nov 2026), so the large string tables of the
// kbx_*_i18n.js modules (and the rule notes of kbx_buy_notes.js / kbx_buy_c29.js; NT29 is merged into NT, BS29 into BS, the overrides of kbx_facets_i18n into FS) live in /_s/kolaboro.com/data/i18n/<module>.json.
// Each module keeps its export as an empty object; ready(env) fetches every file once per isolate (env.ASSETS, in parallel) and copies
// the tables into those same objects, so code that imported them reads the full strings. index.js awaits ready() at the start of every
// kolaboro.com request, before any module that uses the strings runs. Rule for new code: never read these tables at module top level;
// put new string tables in a JSON file here (or in /data/<x>-i18n.json loaded by the module itself), not in the worker.
// Size guard: /_s/kolaboro.com/open/worker-size-guard.sh (run by open/pre-push.sh, fails above 24.6 MiB), documented on /engineering/.
import { T as named } from './kbx_named_i18n.js';
import { H } from './kbx_h29_i18n.js';
import { FS } from './kbx_facets_i18n.js';
import { E29 } from './kbx_e29_i18n.js';
import { TS } from './kbx_trust_i18n.js';
import { TRS } from './kbx_tr_i18n.js';
import { T27 } from './kbx_t27_i18n.js';
import { S as n30aS } from './kbx_n30a_i18n.js';
import { S as n30cS } from './kbx_n30c_i18n.js';
import { FT } from './kbx_fc_i18n.js';
import { T as n30bT } from './kbx_n30b_i18n.js';
import { BS } from './kbx_buy_i18n.js';
import { S as citeS } from './kbx_cite_i18n.js';
import { BS29, GL29, NT29, TCS } from './kbx_buy_c29.js';
import { NT } from './kbx_buy_notes.js';
import { CS } from './kbx_cohort_i18n.js';
import { C as n31dC, S as n31dS } from './kbx_n31d_i18n.js';
import { E } from './kbx_e27_i18n.js';
import { C as kbx_n30a_i18n_C } from './kbx_n30a_i18n.js';

// module-level tables of code modules (n32w step 2): each module reads TB.<module>_<name>, filled here
export const TB = { kbx_stage_S: {}, kbx_n29i_T: {}, kbx_n29i_BT: {}, kbx_plot_T: {}, kbx_land_S: {}, kbx_pp_S: {}, kbx_around_S: {},
  kbx_bulkix_T: {}, kbx_web_S: {}, kbx_money_S: {}, kbx_watch_S: {}, kbx_net_T: {}, kbx_paper_T: {}, kbx_paper_N: {}, kbx_rules_S: {}, kbx_n33a_S: {}, kbx_n33c_S: {} };
export const FILES = {
  kbx_named_i18n: { T: named }, kbx_h29_i18n: { H }, kbx_facets_i18n: { FS }, kbx_e29_i18n: { E29 }, kbx_trust_i18n: { TS },
  kbx_tr_i18n: { TRS }, kbx_t27_i18n: { T27 }, kbx_n30a_i18n: { S: n30aS }, kbx_n30c_i18n: { S: n30cS }, kbx_fc_i18n: { FT },
  kbx_n30b_i18n: { T: n30bT }, kbx_buy_i18n: { BS }, kbx_cite_i18n: { S: citeS }, kbx_buy_c29: { BS29, GL29, NT29, TCS },
  kbx_buy_notes: { NT }, kbx_cohort_i18n: { CS }, kbx_n31d_i18n: { C: n31dC, S: n31dS }, kbx_e27_i18n: { E },
  kbx_stage: { S: TB.kbx_stage_S }, kbx_n29i: { T: TB.kbx_n29i_T, BT: TB.kbx_n29i_BT }, kbx_plot: { T: TB.kbx_plot_T }, kbx_land: { S: TB.kbx_land_S },
  kbx_pp: { S: TB.kbx_pp_S }, kbx_around: { S: TB.kbx_around_S },
  kbx_bulkix: { T: TB.kbx_bulkix_T }, kbx_web: { S: TB.kbx_web_S }, kbx_money: { S: TB.kbx_money_S }, kbx_watch: { S: TB.kbx_watch_S },
  kbx_net: { T: TB.kbx_net_T }, kbx_paper: { T: TB.kbx_paper_T, N: TB.kbx_paper_N }, kbx_rules: { S: TB.kbx_rules_S },
  kbx_n33a: { S: TB.kbx_n33a_S },   // n33a (batch 33): /delays/, report byline, hub feed titles
  kbx_n33c: { S: TB.kbx_n33c_S },   // n33c (20 Nov 2026): search titles and descriptions from the page data
};
// n40 k5 (26 Nov 2026): more tables of code modules moved to /data/i18n/<module>.json (worker size limit)
TB.kbx_j_map_MAP = {}; (FILES.kbx_j_map || (FILES.kbx_j_map = {}))["MAP"] = TB.kbx_j_map_MAP;
TB.kbx_u27_S = {}; (FILES.kbx_u27 || (FILES.kbx_u27 = {}))["S"] = TB.kbx_u27_S;
TB.kbx_named_qa_S = {}; (FILES.kbx_named_qa || (FILES.kbx_named_qa = {}))["S"] = TB.kbx_named_qa_S;
TB.kbx_g27_TOP_EMB = []; (FILES.kbx_g27 || (FILES.kbx_g27 = {}))["TOP_EMB"] = TB.kbx_g27_TOP_EMB;
TB.kbx_u26_S = {}; (FILES.kbx_u26 || (FILES.kbx_u26 = {}))["S"] = TB.kbx_u26_S;
TB.kbx_named_diff_TT = {}; (FILES.kbx_named_diff || (FILES.kbx_named_diff = {}))["TT"] = TB.kbx_named_diff_TT;
TB.kbx_gaz_S = {}; (FILES.kbx_gaz || (FILES.kbx_gaz = {}))["S"] = TB.kbx_gaz_S;
TB.kbx_p29_S = {}; (FILES.kbx_p29 || (FILES.kbx_p29 = {}))["S"] = TB.kbx_p29_S;
TB.kbx_net_LT = {}; (FILES.kbx_net || (FILES.kbx_net = {}))["LT"] = TB.kbx_net_LT;
(FILES.kbx_n30a_i18n || (FILES.kbx_n30a_i18n = {}))["C"] = kbx_n30a_i18n_C;
TB.kbx_numbers_T = {}; (FILES.kbx_numbers || (FILES.kbx_numbers = {}))["T"] = TB.kbx_numbers_T;
TB.kbx_cal_T = {}; (FILES.kbx_cal || (FILES.kbx_cal = {}))["T"] = TB.kbx_cal_T;
TB.kbx_n27a_D = {}; (FILES.kbx_n27a || (FILES.kbx_n27a = {}))["D"] = TB.kbx_n27a_D;
TB.kbx_filings_S = {}; (FILES.kbx_filings || (FILES.kbx_filings = {}))["S"] = TB.kbx_filings_S;
TB.kbx_paper_EXTRA = {}; (FILES.kbx_paper || (FILES.kbx_paper = {}))["EXTRA"] = TB.kbx_paper_EXTRA;
TB.kbx_xray_XP = {}; (FILES.kbx_xray || (FILES.kbx_xray = {}))["XP"] = TB.kbx_xray_XP;
TB.kbx_n27lead_T = {}; (FILES.kbx_n27lead || (FILES.kbx_n27lead = {}))["T"] = TB.kbx_n27lead_T;
TB.kbx_named_plus_FT = {}; (FILES.kbx_named_plus || (FILES.kbx_named_plus = {}))["FT"] = TB.kbx_named_plus_FT;
TB.kbx_fc_FT2 = {}; (FILES.kbx_fc || (FILES.kbx_fc = {}))["FT2"] = TB.kbx_fc_FT2;
TB.kbx_n31b_cap_CAP = {}; (FILES.kbx_n31b_cap || (FILES.kbx_n31b_cap = {}))["CAP"] = TB.kbx_n31b_cap_CAP;
TB.kolaboro_OPEN_DOC = {}; (FILES.kolaboro || (FILES.kolaboro = {}))["OPEN_DOC"] = TB.kolaboro_OPEN_DOC;
TB.kolaboro_DESK_T = {}; (FILES.kolaboro || (FILES.kolaboro = {}))["DESK_T"] = TB.kolaboro_DESK_T;
TB.index_K = {}; FILES.index = { K: TB.index_K };   // /__k/kcheck.js and /__k/ktraffic.js (index.js kScript)
// n40 k5 end
const done = new Set();
let pend = null;
export const stat = { loaded: 0, files: Object.keys(FILES).length, ms: 0, errors: 0, at: null };

async function one(env, name) {
  // r3u (batch 37): one more try per file; a failed read left the tables empty for that request, and pages then threw (seen as rare 500/503)
  let j = null, err = null;
  for (let i = 0; i < 2 && !j; i++) { try { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/i18n/' + name + '.json')); if (!r.ok) throw new Error(name + ' ' + r.status); j = await r.json(); } catch (e) { err = e; } }
  // r4u (batch 37): still about 1 request in 20 threw on 'live_wait' (kbx_named_i18n empty) after a deploy; last try: the public copy through the edge cache
  if (!j) { try { const r = await fetch('https://kolaboro.com/data/i18n/' + name + '.json', { cf: { cacheTtl: 600 } }); if (r.ok) j = await r.json(); } catch (e) { err = e; } }
  if (!j) throw err || new Error(name);
  for (const [k, obj] of Object.entries(FILES[name])) { if (j[k] && typeof j[k] === 'object') Object.assign(obj, j[k]); else throw new Error(name + '.' + k + ' missing'); }
  done.add(name);
}
// Resolves when every table is filled; a file that failed is tried again on the next request (never caches a failure).
export function ready(env) {
  if (done.size === stat.files) return Promise.resolve(true);
  if (!pend) {
    const t0 = Date.now();
    pend = (async () => {
      if (!env || !env.ASSETS) return false;
      const rs = await Promise.allSettled(Object.keys(FILES).filter(n => !done.has(n)).map(n => one(env, n)));
      stat.errors += rs.filter(x => x.status === 'rejected').length;
      stat.loaded = done.size; stat.ms = Date.now() - t0; stat.at = new Date().toISOString();
      return done.size === stat.files;
    })().finally(() => { pend = null; });
  }
  return pend;
}
export const isReady = () => done.size === stat.files;
