// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const $q = TB.kbx_ogt__q;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
export const OG_KINDS = ['rankings', 'guides', 'reports', 'countries', 'markets', 'compare'];
export function ogKind(path) {
const p = String(path || '').replace(/^https:\/\/kolaboro\.com/, '').replace(/^\/(es|de|fr|nl|ru|zh|ar)(?=\/)/, '');
if (/^\/countries\/[^/]+\/(how-to-check|is-it-safe|buyer-protection-law|delayed-handover)\//.test(p) || /^\/guides\//.test(p)) return $q.a;
if (/^\/countries\//.test(p)) return $q.b;
if (/^\/(rankings|new|embed\/widgets)\//.test(p)) return $q.c;
if (/^\/(press|stories|weekly|progress|numbers|handover|index\/delays)\//.test(p)) return $q.d;
if (/^\/(m|areas)\//.test(p)) return $q.e;
if (/^\/(vs|compare)\//.test(p)) return $q.f;
return null;
}
export const ogImg = path => { const k = ogKind(path); return $q.g + (k ? $q.h + k + '.png' : $q.i); };
