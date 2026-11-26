// Verify a Kolaboro webhook delivery. Works in Node 20+, Deno, Bun, Cloudflare Workers and browsers (WebCrypto Ed25519).
// Pass the RAW request body (the exact bytes as text, before any JSON parsing) and the request headers.
// Docs: https://kolaboro.com/docs/webhooks/
const KEYS_URL = 'https://kolaboro.com/.well-known/kolaboro-keys.json';
let KEYS = null;
const te = new TextEncoder();
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');

export async function verifyKolaboroWebhook(rawBody, headers, opts = {}) {
  const h = k => (typeof headers.get === 'function' ? headers.get(k) : headers[k]) || '';
  const sig = h('x-kolaboro-signature'), kid = h('x-kolaboro-key-id');
  if (!sig || !kid) throw new Error('missing signature headers');
  if (!opts.keys && !KEYS) KEYS = (await (await fetch(KEYS_URL)).json()).keys;
  const k = (opts.keys || KEYS).find(x => x.kid === kid);
  if (!k) throw new Error('unknown key id ' + kid);
  const key = await crypto.subtle.importKey('raw', b64(k.public_key_raw_b64), { name: 'Ed25519' }, false, ['verify']);
  // 1. signature: Ed25519 over "kolaboro-sig-v1\n" + SHA-256 hex of the exact body (the same scheme as the open API)
  const digest = hex(await crypto.subtle.digest('SHA-256', te.encode(rawBody)));
  if (!(await crypto.subtle.verify({ name: 'Ed25519' }, key, b64(sig), te.encode('kolaboro-sig-v1\n' + digest)))) throw new Error('bad signature');
  const evt = JSON.parse(rawBody);
  // 2. freshness: the timestamp is inside the signed body; reject anything older or newer than 5 minutes
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  if (!Number.isInteger(evt.timestamp) || Math.abs(now - evt.timestamp) > (opts.toleranceSeconds ?? 300)) throw new Error('stale or future timestamp');
  // 3. addressed to you: the webhook id you got when you registered (stops a delivery to someone else being replayed to you)
  if (opts.webhookId != null && evt.webhook_id !== opts.webhookId) throw new Error('event is for another webhook');
  // 4. once only: remember event ids for at least 10 minutes; retries of the same event reuse its id
  if (opts.seen) { if (await opts.seen.has(evt.id)) throw new Error('replay: event already processed'); await opts.seen.add(evt.id); }
  return evt;
}
