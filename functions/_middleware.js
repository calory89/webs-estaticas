// El código del generador (/_hlc/) está en la rama publicada pero no debe servirse.
// /panel/ es interno: no se sirve en público (sus datos estaban abiertos a cualquiera).
export async function onRequest(ctx) {
  const p = new URL(ctx.request.url).pathname;
  if (p === '/_hlc' || p.startsWith('/_hlc/') || p === '/panel' || p.startsWith('/panel/')) {
    const nf = await ctx.env.ASSETS.fetch(new URL('/404.html', ctx.request.url));
    return new Response(nf.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
  }
  return ctx.next();
}
