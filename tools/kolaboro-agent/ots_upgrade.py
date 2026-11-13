#!/usr/bin/env python3
"""Upgrade pending OpenTimestamps proofs once Bitcoin has confirmed them; record the block height. Env KB_STAMP_UPGRADE_KEY."""
import os, json, base64, subprocess, tempfile, re, urllib.request
RPC = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/'
ANON = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'
def rpc(fn, args):
    r = urllib.request.Request(RPC + fn, json.dumps(args).encode(), {'apikey': ANON, 'authorization': 'Bearer ' + ANON, 'content-type': 'application/json'})
    return json.load(urllib.request.urlopen(r, timeout=60))
key = os.environ['KB_STAMP_UPGRADE_KEY']
pend = rpc('kolaboro_stamp_pending', {'p_key': key}) or []
print('pending', len(pend)); done = 0
for p in pend:
    with tempfile.TemporaryDirectory() as d:
        f = os.path.join(d, p['hash'] + '.ots'); open(f, 'wb').write(base64.b64decode(p['ots']))
        subprocess.run(['ots', '--no-bitcoin', 'upgrade', f], capture_output=True, text=True, timeout=120)
        info = subprocess.run(['ots', 'info', f], capture_output=True, text=True, timeout=60).stdout
        blocks = [int(x) for x in re.findall(r'BitcoinBlockHeaderAttestation\((\d+)\)', info)]
        if blocks:
            ok = rpc('kolaboro_stamp_upgrade', {'p_key': key, 'p_hash': p['hash'], 'p_ots': base64.b64encode(open(f, 'rb').read()).decode(), 'p_block': min(blocks)})
            done += 1; print('confirmed', p['hash'][:12], min(blocks), ok)
        else: print('still pending', p['hash'][:12])
print('upgraded', done)
