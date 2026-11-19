// kolaboro.com batch 29 (agent n29e, 14 Nov 2026): texts of kbx_e29.js in 8 languages (en es fr de nl ru zh ar). No em dashes.
// Keys: c_* common, ep_* /editorial-policy/, hw_* /how-we-work/, so_* /sources/, bp_* /buyer-protection-law/, fb_* /countries/foreign-buyers/,
// ab_* the entity box on /about/, mv_* the method line on rankings and guides, ci_* the "Cite" buttons (/k/cite29.js reads data-* attributes).
// n32w (19 Nov 2026): the string tables moved out of the worker (Cloudflare Pages limit of 25 MiB for _worker.js) into
// /_s/kolaboro.com/data/i18n/kbx_e29_i18n.json, filled once per isolate by kbx_strings.js before any kolaboro.com request is handled.
// Edit the strings there (JSON, same keys); never read them at module top level.
export const E29 = {};
export const e29t = (lang, k) => { const en = E29.en || {}, L = E29[lang] || en; return L[k] != null ? L[k] : en[k]; };
