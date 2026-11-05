// Feature module 'qa' for kolaboro.com (see kbx.js): quality engineering: visual regression, page weight, SBOM, real-user vitals, accessibility.
// Batch 6 (5 Nov 2026). Endpoints live under /api/x/qa/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/qa(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'qa' }, 404);
}
