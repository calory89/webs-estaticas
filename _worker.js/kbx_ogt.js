// comments: _notes/kolaboro-worker-comments.txt
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
export const ogImg = path => { const k = ogKind(path); return 'https://kolaboro.com' + (k ? '/og/type/' + k + '.png' : '/k/og.png'); };
