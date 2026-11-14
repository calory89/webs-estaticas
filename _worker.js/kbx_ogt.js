// kolaboro.com n29t (batch 29, item 43): one share image per page type instead of the generic /og.png on every hub, ranking, guide and
// report. The images are drawn at the edge by kbx_og.js (/og/type/<kind>.png) with live counts from the open data; this file only maps
// a page path to its kind, so modules can name the image without loading the drawing code.
export const OG_KINDS = ['rankings', 'guides', 'reports', 'countries', 'markets', 'compare'];
export function ogKind(path) {
  const p = String(path || '').replace(/^https:\/\/kolaboro\.com/, '').replace(/^\/(es|de|fr|nl|ru|zh|ar)(?=\/)/, '');
  if (/^\/countries\/[^/]+\/(how-to-check|is-it-safe|buyer-protection-law)\//.test(p) || /^\/guides\//.test(p)) return 'guides';
  if (/^\/countries\//.test(p)) return 'countries';
  if (/^\/(rankings|new|embed\/widgets)\//.test(p)) return 'rankings';
  if (/^\/(press|stories|weekly|progress|numbers|handover|index\/delays)\//.test(p)) return 'reports';
  if (/^\/(m|areas)\//.test(p)) return 'markets';
  if (/^\/(vs|compare)\//.test(p)) return 'compare';
  return null;
}
// absolute URL of the share image for a page path; the generic image when the page has no kind
export const ogImg = path => { const k = ogKind(path); return 'https://kolaboro.com' + (k ? '/og/type/' + k + '.png' : '/og.png'); };
