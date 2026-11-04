// Feature module w for kolaboro.com (see kbx.js): registers: global company graph (GLEIF), insolvency watch, agent licence check.
// Owned by block W (batch 4, 4 Nov 2026). Endpoints live under /api/x/w/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/w(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'w' }, 404);
}
