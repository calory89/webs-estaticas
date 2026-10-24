// Ciudad aproximada del visitante (la da Cloudflare) para preseleccionar su aeropuerto. No se guarda nada.
export function onRequest({ request }) {
  const cf = request.cf || {};
  const body = { city: cf.city || '', country: cf.country || '', lat: cf.latitude ? +cf.latitude : null, lon: cf.longitude ? +cf.longitude : null };
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store' } });
}
