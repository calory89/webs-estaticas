// Feature module u for kolaboro.com (see kbx.js): land and climate: climate scenarios, protected land, night lights, stalled sites.
// Owned by block U (batch 4, 4 Nov 2026). Endpoints live under /api/x/u/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/u(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'u' }, 404);
}
