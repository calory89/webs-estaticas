#!/usr/bin/env python3
"""Build the mangrove index served at kolaboro.com/data/mangroves/<lon>_<lat>.bin (block U, batch 4). Run once per GMW release.

Input: gmw_v3_2020_gtiff.zip from Global Mangrove Watch v3.0 (Bunting et al. 2022, Zenodo record 6894273, CC BY 4.0), unzipped:
1x1 degree GeoTIFFs of 4500 x 4500 pixels (0.8 arc-seconds, about 25 m), 1 = mangrove.
Output: one file per 45 x 45 degree block that has any mangrove. A cell of 0.002 degrees (9 x 9 source pixels, about 220 m) is set
when any of its pixels is mangrove. Format: 'GMW1', uint16 cells per degree (500), uint16 tile count; per tile int16 top latitude,
int16 west longitude, uint32 cell count, uint32 byte offset, uint32 byte length; then per tile the sorted cell indexes
(row * 500 + col, rows from the top) as LEB128 varints of the gaps. Read by _worker.js/kbx_u.js mangroveGrid().
Usage: gmw_index.py <dir with GMW_*_2020_v3.tif> <out dir>   (needs rasterio, numpy)"""
import glob, math, os, struct, sys
import numpy as np, rasterio

N, S = 500, 45


def varint(x):
    out = bytearray()
    while True:
        b = x & 0x7f; x >>= 7
        if x: out.append(b | 0x80)
        else: out.append(b); return bytes(out)


def main(src, out):
    blocks = {}
    for f in sorted(glob.glob(os.path.join(src, '*.tif'))):
        with rasterio.open(f) as d:
            t = d.transform
            assert d.width == 4500 and abs(t.a - 1 / 4500) < 1e-9, f
            a = d.read(1)
        idx = np.flatnonzero(a.reshape(N, 9, N, 9).max(axis=(1, 3)) > 0)
        if not len(idx): continue
        la, lo = round(t.f), round(t.c)
        ch, prev = bytearray(), -1
        for v in idx.tolist(): ch += varint(v - prev - 1); prev = v
        blocks.setdefault((math.floor((la - 1) / S) * S, math.floor(lo / S) * S), []).append((la, lo, len(idx), bytes(ch)))
    os.makedirs(out, exist_ok=True)
    for (bl, bo), ts in sorted(blocks.items()):
        hdr, body = bytearray(b'GMW1') + struct.pack('<HH', N, len(ts)), bytearray()
        for la, lo, cnt, ch in ts: hdr += struct.pack('<hhIII', la, lo, cnt, len(body), len(ch)); body += ch
        open(os.path.join(out, '%d_%d.bin' % (bo, bl)), 'wb').write(bytes(hdr) + bytes(body))
        print(bo, bl, len(ts), len(hdr) + len(body))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
