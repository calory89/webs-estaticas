// Feature module 'ship' for kolaboro.com (see kbx.js): shipping: daily ship log, streak, engineering metrics, roadmap sync, feeds.
// Batch 6 (5 Nov 2026). Endpoints live under /api/x/ship/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/ship(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'ship' }, 404);
}
