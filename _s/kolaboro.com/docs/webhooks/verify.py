# Verify a Kolaboro webhook delivery (Python 3.8+, pip install cryptography). Docs: https://kolaboro.com/docs/webhooks/
# Pass the RAW request body as bytes (before JSON parsing) and the request headers.
import base64, hashlib, json, time, urllib.request
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEYS_URL = 'https://kolaboro.com/.well-known/kolaboro-keys.json'
_keys = None

def verify_kolaboro_webhook(raw_body: bytes, headers, webhook_id=None, seen=None, keys=None, tolerance_seconds=300, now=None):
    global _keys
    get = lambda k: headers.get(k) or headers.get(k.title()) or ''
    sig, kid = get('x-kolaboro-signature'), get('x-kolaboro-key-id')
    if not sig or not kid:
        raise ValueError('missing signature headers')
    if keys is None:
        if _keys is None:
            _keys = json.load(urllib.request.urlopen(urllib.request.Request(KEYS_URL, headers={'user-agent': 'kolaboro-webhook-verify/1.0'}), timeout=10))['keys']
        keys = _keys
    k = next((x for x in keys if x['kid'] == kid), None)
    if k is None:
        raise ValueError('unknown key id ' + kid)
    # 1. signature: Ed25519 over "kolaboro-sig-v1\n" + SHA-256 hex of the exact body (raises InvalidSignature if wrong)
    msg = b'kolaboro-sig-v1\n' + hashlib.sha256(raw_body).hexdigest().encode()
    Ed25519PublicKey.from_public_bytes(base64.b64decode(k['public_key_raw_b64'])).verify(base64.b64decode(sig), msg)
    evt = json.loads(raw_body)
    # 2. freshness: the timestamp is inside the signed body
    if not isinstance(evt.get('timestamp'), int) or abs((now or int(time.time())) - evt['timestamp']) > tolerance_seconds:
        raise ValueError('stale or future timestamp')
    # 3. addressed to you
    if webhook_id is not None and evt.get('webhook_id') != webhook_id:
        raise ValueError('event is for another webhook')
    # 4. once only (use a store shared by your workers, e.g. Redis SET with a 10 minute expiry)
    if seen is not None:
        if evt['id'] in seen:
            raise ValueError('replay: event already processed')
        seen.add(evt['id'])
    return evt
