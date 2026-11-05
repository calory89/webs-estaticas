// Feature module 'data' for kolaboro.com (see kbx.js): open data platform: catalog, data contracts, freshness, OpenAPI explorer.
// Batch 6 (5 Nov 2026). Endpoints live under /api/x/data/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/data(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'data' }, 404);
}
