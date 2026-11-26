// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const $q = TB.kbx_m__q;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
export const PATHS = /^\/api\/x\/m\//;
export async function handle(req, u, env, ctx) {
return new Response(JSON.stringify({ error: $q.a }), { status: 404, headers: { 'content-type': $q.b } });
}
