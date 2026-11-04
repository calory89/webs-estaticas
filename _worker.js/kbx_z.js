// Feature module z for kolaboro.com (see kbx.js): evidence and partners: court-ready case file, Internet Archive copies, risk feed for banks and insurers.
// Owned by block Z (batch 4, 4 Nov 2026). Endpoints live under /api/x/z/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/z(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'z' }, 404);
}
