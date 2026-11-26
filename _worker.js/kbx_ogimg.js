// n40 k50 (R03-49): share images k/og/<name>.png answered as k/og/<name>.avif or .webp when the Accept header lists image/avif or image/webp.
// Link-preview and search crawlers, and every other client, keep the PNG (default path). Variants are private to the browser (Vary: Accept), never edge cached.
const ORIGIN = 'https://kolaboro.com', SOC = /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|pinterest|skypeuripreview|vkshare|redditbot|embedly|iframely|applebot|googlebot|bingbot|yandex|baidu|duckduck|bot\b|crawl|spider/i;
export async function serve(req, u, env) {
  if (req.method !== 'GET' || req.headers.get('range') || u.search) return null;
  const m = /^\/k\/og\/([a-z0-9-]{1,60})\.png$/.exec(u.pathname), a = req.headers.get('accept') || ''; if (!m || SOC.test(req.headers.get('user-agent') || '')) return null;
  const f = /image\/avif/.test(a) ? 'avif' : /image\/webp/.test(a) ? 'webp' : null; if (!f) return null;
  const b = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/k/og/' + m[1] + '.' + f)); if (!b.ok) { try { await b.body.cancel(); } catch (e) {} return null; }
  const h = { 'content-type': 'image/' + f, vary: 'Accept', 'cache-control': 'private, max-age=2592000', 'cdn-cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*', 'x-kolaboro-og': f };
  const t = b.headers.get('etag'); if (t) h.etag = t;
  return new Response(b.body, { status: 200, headers: h });
}
