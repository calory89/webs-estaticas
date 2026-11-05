// Feature module 'ins' for kolaboro.com (see kbx.js): insight: weekly market digest, market page figures, score explainer, project-scoped questions, change heatmap.
// Batch 6 (5 Nov 2026). Endpoints live under /api/x/ins/.
import * as KB from './kolaboro.js';
const { json } = KB;
export const PATHS = /^\/api\/x\/ins(\/|$)/;
export async function handle(req, u, env, ctx) {
  return json({ error: 'not found', module: 'ins' }, 404);
}
