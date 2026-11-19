// kolaboro.com batch 27 (agent n27t, 13 Nov 2026): strings of /corrections/, /buyer-cases/, /cite/, /contact/, /transparency-badge/,
// the funding and conflict-of-interest sections of /team/, the buyer-report and moderation lines of project pages, the CSV links of
// the transparency rankings and the footer links. 8 languages. {x} = placeholder (values are inserted already escaped).
export const T27 = {} /* n32w (19 Nov 2026): moved to /data/i18n/kbx_t27_i18n.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
export const t27 = (lang, k) => (T27[lang] && T27[lang][k] != null) ? T27[lang][k] : T27.en[k];
