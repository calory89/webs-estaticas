// kolaboro.com batch 26 (n26s): strings of kbx_facets.js in 8 languages. Counts are written as "label: number" where a plural
// form would change with the number (ru, ar), so every number reads correctly. No em dashes.
// n32w (19 Nov 2026): the string tables moved out of the worker (Cloudflare Pages limit of 25 MiB for _worker.js) into
// /_s/kolaboro.com/data/i18n/kbx_facets_i18n.json, filled once per isolate by kbx_strings.js before any kolaboro.com request is handled.
// Edit the strings there (JSON, same keys); never read them at module top level. The batch overrides (OVR) are merged into the file.
export const FS = {};
