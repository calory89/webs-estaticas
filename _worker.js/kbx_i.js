// Feature module i for kolaboro.com (see kbx.js). Helpers: import { json, rpc, ... } from './kolaboro.js'.
export const PATHS = /^\/api\/x\/i\//;
export async function handle(req, u, env, ctx) {
  return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
}
