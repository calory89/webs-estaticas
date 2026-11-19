// Page chrome and sentence templates for the named project and developer pages (kbx_named.js), in the site's 8 languages.
// Only templates are translated. Facts quoted from sources (claims, evidence, what the developer publishes) stay in the
// wording of the source and are marked lang="en". Placeholders: {n} project, {dev} developer, {place}, {h} date, etc.
// Legal rule: no opinion words and no verdicts in any language (checked by the scan in kbx_named.js, see OPINION_RX).
export const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const LOCALE = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
// n32w (19 Nov 2026): the string tables moved out of the worker (Cloudflare Pages limit of 25 MiB for _worker.js) into
// /_s/kolaboro.com/data/i18n/kbx_named_i18n.json, filled once per isolate by kbx_strings.js before any kolaboro.com request is handled.
// Edit the strings there (JSON, same keys); never read them at module top level.
export const T = {};
