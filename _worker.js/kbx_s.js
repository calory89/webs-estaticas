// comments: _notes/kolaboro-worker-comments.txt
export const PATHS = /^\/api\/x\/s\//;
export async function handle(req, u, env, ctx) {
return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
}
