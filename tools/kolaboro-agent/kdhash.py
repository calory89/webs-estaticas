"""kdh1: the perceptual hash shared by render_reuse.py (index) and kolaboro.com/tools/image-check/ (browser).

Defined so that Python and JavaScript compute the same bits from the same decoded pixels, with no resampling library involved:
  1. decode to 8-bit RGBA at full resolution, EXIF orientation applied, no colour management;
  2. per pixel an exact integer luma composited over white: (299 R + 587 G + 114 B) * A + 255000 * (255 - A);
  3. split the region into a 9 x 8 grid with integer edges x_i = x0 + floor(i * W / 9), y_j = y0 + floor(j * H / 8);
     each cell value is (sum over the cell) / (pixel count) as a float64 (the sums are exact integers below 2^53);
  4. bit = 1 when a cell is darker than its right-hand neighbour (8 comparisons per row, 8 rows), row by row, most
     significant bit first, written as 16 hex characters.
'h' hashes the whole image, 'c' the central 70 % (15 % cut from each side), which helps when one copy is cropped.
The browser mirror is _s/kolaboro.com/tools/image-check/kdh.js; tools/kolaboro-agent/kdhash_crosscheck.py checks they agree.
"""
import io
import numpy as np
from PIL import Image, ImageOps

MAX_PIXELS = 50_000_000


def _edges(a, n, parts):
    return [a + (i * n) // parts for i in range(parts + 1)]


def _grid_opaque(Y, x0, x1, y0, y1):
    """Fast path when A = 255 everywhere: the per-pixel value is 255 * Y, so cell sums are 255 * sum(Y), exactly."""
    xs, ys = _edges(x0, x1 - x0, 9), _edges(y0, y1 - y0, 8)
    rows = np.add.reduceat(Y[y0:y1, x0:x1], [y - y0 for y in ys[:-1]], axis=0, dtype=np.int64)
    cells = np.add.reduceat(rows, [x - x0 for x in xs[:-1]], axis=1, dtype=np.int64) * 255
    cnt = np.outer(np.diff(ys), np.diff(xs)).astype(np.float64)
    return cells.astype(np.float64) / cnt


def _grid(px, x0, x1, y0, y1):
    xs, ys = _edges(x0, x1 - x0, 9), _edges(y0, y1 - y0, 8)
    cells = np.zeros((8, 9), dtype=np.int64)
    for r in range(8):   # one band of rows at a time keeps memory small on large images
        a = px[ys[r]:ys[r + 1], x0:x1].astype(np.int64)
        Y = (a[:, :, 0] * 299 + a[:, :, 1] * 587 + a[:, :, 2] * 114) * a[:, :, 3] + 255000 * (255 - a[:, :, 3])
        cells[r] = np.add.reduceat(Y.sum(axis=0), [x - x0 for x in xs[:-1]])
    cnt = np.outer(np.diff(ys), np.diff(xs)).astype(np.float64)
    return cells.astype(np.float64) / cnt


def _bits(m):
    v = 0
    for r in range(8):
        for c in range(8):
            v = (v << 1) | (1 if m[r, c] < m[r, c + 1] else 0)
    return '%016x' % v


def kdh_rgba(px):
    """px: H x W x 4 uint8. Returns (h, c), or None if the image is too small to hash."""
    H, W = px.shape[:2]
    if W < 9 or H < 8:
        return None
    h = _bits(_grid(px, 0, W, 0, H))
    cx, cy = (W * 15) // 100, (H * 15) // 100
    c = _bits(_grid(px, cx, W - cx, cy, H - cy)) if W - 2 * cx >= 9 and H - 2 * cy >= 8 else h
    return h, c


def kdh_bytes(b):
    im = Image.open(io.BytesIO(b))
    if im.size[0] * im.size[1] > MAX_PIXELS:
        return None
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA', 'PA', 'RGBa', 'La') or 'transparency' in im.info:
        return kdh_rgba(np.asarray(im.convert('RGBA')))
    px = np.asarray(im.convert('RGB'))
    H, W = px.shape[:2]
    if W < 9 or H < 8:
        return None
    Y = px[:, :, 0].astype(np.int32) * 299
    Y += px[:, :, 1].astype(np.int32) * 587
    Y += px[:, :, 2].astype(np.int32) * 114
    h = _bits(_grid_opaque(Y, 0, W, 0, H))
    cx, cy = (W * 15) // 100, (H * 15) // 100
    c = _bits(_grid_opaque(Y, cx, W - cx, cy, H - cy)) if W - 2 * cx >= 9 and H - 2 * cy >= 8 else h
    return h, c


def hamming(a, b):
    return bin(int(a, 16) ^ int(b, 16)).count('1')


if __name__ == '__main__':
    import sys, json
    print(json.dumps({p: kdh_bytes(open(p, 'rb').read()) for p in sys.argv[1:]}, indent=1))
