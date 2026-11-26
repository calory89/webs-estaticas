// comments: _notes/kolaboro-worker-comments.txt
let FONT = null, LOGO = { w: 0, h: 0, bg: [227, 226, 221], data: '' }, OGENV = null;
async function fontData() {
if (FONT) return;
let d = null;
try { if (OGENV && OGENV.ASSETS) { const r = await OGENV.ASSETS.fetch(new Request(TB.kbx_og__t.k0)); if (r.ok) d = await r.json(); } } catch (e) {}
if (!d) { try { const r = await fetch(TB.kbx_og__t.k1, { cf: { cacheTtl: 3600 } }); if (r.ok) d = await r.json(); } catch (e) {} }
if (!d || !d.FONT) throw new Error('og font unavailable');
FONT = d.FONT; LOGO = d.LOGO;
}
import { data, handoverOf, reviewed, fd, tr, lastmod } from './kbx_named.js';
import { light6 } from './kbx_u27.js';
import { OG_KINDS } from './kbx_ogt.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/og\/(projects|developers|type)\/([a-z0-9-]{1,90})\.png$/;
const W = 1200, H = 630, V = 'og-v2';
const BG = [227, 226, 221], INK = [23, 33, 43], INK2 = [42, 53, 65], MUTED = [94, 104, 114], HI = [255, 91, 20], CARD = [246, 246, 243], LINE = [200, 198, 190];
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function inflate(bytes) { const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')); return new Uint8Array(await new Response(s).arrayBuffer()); }
let FACES = null, LOGOPX = null;
async function faces() {
if (FACES) return FACES;
await fontData();
const o = {};
for (const k of Object.keys(FONT)) { const f = FONT[k]; o[k] = { size: f.size, asc: f.asc, desc: f.desc, g: f.g, px: await inflate(b64(f.data)) }; }
LOGOPX = await inflate(b64(LOGO.data));
FACES = o; return o;
}
const SPACE_FIX = { 0x00A0: 32, 0x2009: 32, 0x202F: 32 };
function normText(face, s) {
let out = '';
for (const ch of String(s || '').replace(/\s+/g, ' ').trim()) {
let cp = ch.codePointAt(0); if (SPACE_FIX[cp]) cp = SPACE_FIX[cp];
if (face.g[cp]) { out += String.fromCodePoint(cp); continue; }
const base = ch.normalize('NFKD').replace(/[̀-ͯ]/g, '');
for (const b of base) if (face.g[b.codePointAt(0)]) out += b;
}
return out;
}
function canvas() { const p = new Uint8Array(W * H * 3); for (let i = 0; i < W * H; i++) { p[i * 3] = BG[0]; p[i * 3 + 1] = BG[1]; p[i * 3 + 2] = BG[2]; } return p; }
function blend(p, x, y, c, a) {
if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
const i = (y * W + x) * 3; if (a >= 1) { p[i] = c[0]; p[i + 1] = c[1]; p[i + 2] = c[2]; return; }
p[i] = p[i] + (c[0] - p[i]) * a; p[i + 1] = p[i + 1] + (c[1] - p[i + 1]) * a; p[i + 2] = p[i + 2] + (c[2] - p[i + 2]) * a;
}
function rect(p, x, y, w, h, c, r) {   // filled rounded rectangle, anti-aliased corners
  r = r || 0; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx++) {
    let a = 1;
    if (r) {
      const cx = xx < x + r ? x + r : xx >= x + w - r ? x + w - r - 1 : null, cy = yy < y + r ? y + r : yy >= y + h - r ? y + h - r - 1 : null;
      if (cx != null && cy != null) { const d = Math.hypot(xx - cx, yy - cy); a = Math.max(0, Math.min(1, r - d + 0.5)); }
    }
    blend(p, xx, yy, c, a);
  }
}
function frame(p, x, y, w, h, c, r, t) { rect(p, x, y, w, h, c, r); rect(p, x + t, y + t, w - 2 * t, h - 2 * t, CARD, Math.max(0, r - t)); }
function dot(p, cx, cy, r, c) { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) blend(p, x, y, c, Math.max(0, Math.min(1, r - Math.hypot(x - cx, y - cy) + 0.5))); }
function mask(face, g, mx, my) {
if (mx < 0 || my < 0 || mx >= g[0] || my >= g[1]) return 0;
const n = my * g[0] + mx, b = face.px[g[5] + (n >> 1)];
return ((n & 1) ? (b & 15) : (b >> 4)) / 15;
}
function measure(face, s, px) { const k = px / face.size; let w = 0; for (const ch of s) { const g = face.g[ch.codePointAt(0)]; if (g) w += g[4] * k; } return w; }
function text(p, face, s, x, baseY, px, c) {   // draw s with its baseline at baseY; px = font size; bilinear sampling when scaled
  const k = px / face.size; let pen = x;
  for (const ch of s) {
    const g = face.g[ch.codePointAt(0)]; if (!g) continue;
    if (g[0]) {
      const ox = pen + g[2] * k, oy = baseY + g[3] * k, w = Math.ceil(g[0] * k) + 1, h = Math.ceil(g[1] * k) + 1;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const X = Math.floor(ox) + xx, Y = Math.floor(oy) + yy, sx = (X + 0.5 - ox) / k - 0.5, sy = (Y + 0.5 - oy) / k - 0.5;
        let a;
        if (k === 1) a = mask(face, g, Math.round(sx), Math.round(sy));
        else { const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0; a = mask(face, g, x0, y0) * (1 - fx) * (1 - fy) + mask(face, g, x0 + 1, y0) * fx * (1 - fy) + mask(face, g, x0, y0 + 1) * (1 - fx) * fy + mask(face, g, x0 + 1, y0 + 1) * fx * fy; }
        if (a > 0.01) blend(p, X, Y, c, a);
      }
    }
    pen += g[4] * k;
  }
  return pen - x;
}
function fit(face, s, px, maxW) {
if (measure(face, s, px) <= maxW) return s;
let t = s; while (t.length > 1 && measure(face, t + '...', px) > maxW) t = t.slice(0, -1);
return t.replace(/[\s,.;:-]+$/, '') + '...';
}
function wrap(face, s, px, maxW, lines) {
const words = s.split(' '), out = []; let cur = '';
for (let i = 0; i < words.length; i++) {
const t = cur ? cur + ' ' + words[i] : words[i];
if (measure(face, t, px) <= maxW || !cur) cur = t;
else { out.push(cur); cur = words[i]; if (out.length === lines - 1) { cur = words.slice(i).join(' '); break; } }
}
if (cur) out.push(cur);
return out.slice(0, lines).map((l, i) => i === lines - 1 ? fit(face, l, px, maxW) : l);
}
function logo(p, x, y) { for (let yy = 0; yy < LOGO.h; yy++) for (let xx = 0; xx < LOGO.w; xx++) { const i = (yy * LOGO.w + xx) * 3, o = ((y + yy) * W + x + xx) * 3; p[o] = LOGOPX[i]; p[o + 1] = LOGOPX[i + 1]; p[o + 2] = LOGOPX[i + 2]; } }
let CRC = null;
function crc32(buf) { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, body) { const out = new Uint8Array(12 + body.length), dv = new DataView(out.buffer); dv.setUint32(0, body.length); for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i); out.set(body, 8); dv.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length))); return out; }
async function png(p) {
const raw = new Uint8Array(H * (W * 3 + 1));
for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; raw.set(p.subarray(y * W * 3, (y + 1) * W * 3), y * (W * 3 + 1) + 1); }
const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer); dv.setUint32(0, W); dv.setUint32(4, H); ihdr[8] = 8; ihdr[9] = 2;
const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', z), chunk('IEND', new Uint8Array(0))];
const out = new Uint8Array(parts.reduce((a, b) => a + b.length, 0)); let o = 0; for (const x of parts) { out.set(x, o); o += x.length; } return out;
}
async function draw(card) {
const F = await faces(), p = canvas(), T = F.t, B = F.b, M = F.m, X = 72, MAXW = W - 2 * X;
logo(p, X - 4, 58);
const kind = normText(M, card.kind), kw = measure(M, kind, 24);
rect(p, W - X - kw - 36, 58, kw + 36, 44, INK, 22); text(p, M, kind, W - X - kw - 18, 88, 24, CARD);
const name = normText(T, card.name); let px = 76, lines;
for (; px >= 46; px -= 2) { lines = wrap(T, name, px, MAXW, 2); if (lines.length === 1 || measure(T, lines[1], px) <= MAXW && !/\.\.\.$/.test(lines[1])) break; }
px = Math.max(px, 46); lines = wrap(T, name, px, MAXW, 2);
let y = 150 + Math.round(px * 0.95);
for (const l of lines) { text(p, T, l, X, y, px, INK); y += Math.round(px * 1.08); }
y += -Math.round(px * 1.08) + 46;
text(p, B, fit(B, normText(B, card.sub), 30, MAXW), X, y, 30, INK2);
const nF = Math.min(4, card.facts.length), ck = card.checks, top = ck ? 372 : 392, gap = 18, bw = Math.floor((MAXW - (nF - 1) * gap) / nF), bh = ck ? 108 : 128;
card.facts.slice(0, nF).forEach(([l, v], i) => {
const bx = X + i * (bw + gap);
frame(p, bx, top, bw, bh, LINE, 16, 2);
const lp = nF > 3 ? 18 : 21; text(p, B, fit(B, normText(B, l).toUpperCase(), lp, bw - 40), bx + 20, top + 40, lp, MUTED);
const vv = wrap(M, normText(M, v), 31, bw - 40, 2);
vv.forEach((t, j) => text(p, M, t, bx + 20, top + (ck ? 74 : 82) + j * 32, vv.length > 1 ? 27 : 31, INK));
});
if (ck) {
const cw = Math.floor((MAXW - 5 * 10) / 6), cy = 500;
ck.forEach(([lbl, s], i) => { const cx = X + i * (cw + 10), col = CK[s] || MUTED;
frame(p, cx, cy, cw, 44, LINE, 22, 2); const dx = cx + 24, dy = cy + 22;
dot(p, dx, dy, 9, col);
if (s === 'nc' || s === 'part') dot(p, dx, dy, 6.5, CARD);
if (s === 'part') for (let yy = dy - 7; yy <= dy + 7; yy++) for (let xx = dx - 7; xx <= dx; xx++) blend(p, xx, yy, col, Math.max(0, Math.min(1, 6.5 - Math.hypot(xx - dx, yy - dy))));
if (s === 'no') rect(p, dx - 5, dy - 1, 11, 3, CARD, 0);
text(p, B, fit(B, normText(B, lbl), 20, cw - 48), cx + 40, cy + 29, 20, INK); });
}
const fy = ck ? 596 : 580;
if (card.badge) { const bt = normText(M, card.badge), bwid = measure(M, bt, 22); rect(p, X, fy - 30, bwid + 32, 42, [255, 240, 199], 21); text(p, M, bt, X + 16, fy - 1, 22, [122, 75, 0]); }
else text(p, B, TB.kbx_og__t.k2, X, fy, 24, MUTED);
const url = normText(B, 'kolaboro.com' + card.path), uw = measure(B, url, 24), ux = W - X - Math.min(uw, 560);
dot(p, ux - 18, fy - 8, 7, HI); text(p, B, fit(B, url, 24, 560), ux, fy, 24, INK2);
return png(p);
}
function projectCard(ix, x) {
const c = ix.caseBy.get(x.id) || {}, ho = handoverOf(ix, x), place = [x.ar && x.ar.length <= 40 ? x.ar : null, x.mk, x.co !== x.mk ? x.co : null].filter(Boolean);
const st = c.stage || x.st, stage = st === 'off-plan' ? 'Off-plan' : st === 'under construction' ? 'Under construction' : st === 'completed' ? 'Completed' : 'Not stated';
return { kind: 'Project record', name: x.n, sub: (x.dv ? 'By ' + x.dv + ' · ' : '') + [...new Set(place)].join(', '),
facts: [['Handover promised', ho ? fd(ho.d, 'en') : 'Not published'], ['Permit number', x.pn ? 'Published' : 'Not published'], ['Stage', stage]],
badge: reviewed(c) ? null : 'Not yet reviewed by Kolaboro', path: '/projects/' + x.s + '/' };
}
const CK = { ok: [28, 124, 74], part: [178, 106, 0], no: [179, 38, 30], nc: [110, 120, 128] }, CKL = { permit: 'Permit', company: 'Company', date: 'Handover', build: 'Build', web: 'Website', lists: 'Lists' };
async function projectCard2(env, ix, x) {
const k = projectCard(ix, x), c = ix.caseBy.get(x.id) || {}, ho = handoverOf(ix, x);
let tp = null; try { const T = await import('./kbx_tr.js'); tp = await T.trProject(env, x.id, 'en'); } catch (e) { tp = null; }
const L = light6({ tp, c, pn: x.pn, ho, ev: x.ev, ids: [] });
k.sub = k.sub + ' · ' + k.facts[2][1]; k.facts[1][1] = L[0][2][1] === 'p_reg' ? 'Confirmed in register' : k.facts[1][1];
k.facts[2] = ['Last checked', fd(lastmod(ix, x), 'en')]; k.checks = L.map(([key, , st]) => [CKL[key], st[0]]); return k;
}
function typeCard(ix, kind) {
const C = [...ix.caseBy.values()], mk = new Set(C.map(c => c.market)).size, co = new Set(C.map(c => c.country)).size, T = TB.kbx_og__t.o_TYPE_CARD[kind];
return { kind: T[0], name: T[1], sub: T[2], facts: [['Projects tracked', C.length.toLocaleString('en-US')], ['Markets and countries', mk + ' in ' + co], ['Data of', fd(String(ix.updated || '').slice(0, 10), 'en')]], badge: null, path: '/' };
}
function devCard(ix, dv) {
const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), mks = [...new Set(L.map(x => x.mk))], pn = L.filter(x => x.pn).length, P = L.flatMap(x => ix.prom[x.id] || []), mv = P.filter(p => p.mv).length;
return { kind: 'Developer record', name: dv.n, sub: 'Projects tracked in ' + (mks.length > 4 ? mks.slice(0, 4).join(', ') + ' and ' + (mks.length - 4) + ' more' : mks.join(', ')),
facts: [['Projects tracked', String(L.length)], ['Permit numbers published', pn + ' of ' + L.length], ['Dated promises tracked', P.length ? P.length + (mv ? ' (' + mv + ' moved)' : '') : 'None yet']],
badge: null, path: '/developers/' + dv.s + '/' };
}
let CC = null;
async function devCard2(env, ix, dv) {
const k = devCard(ix, dv), L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean), mv = L.filter(x => (ix.prom[x.id] || []).some(p => p.mv)).length;
if (!CC) { try { const r = await env.ASSETS.fetch(new Request(TB.kbx_og__t.k3)); CC = r.ok ? (await r.json()).cases || [] : null; } catch (e) { CC = null; } }
const sl = new Set(L.map(x => x.s)), nc = (CC || []).filter(c => c.dev === dv.s || (c.project && sl.has(c.project))).length;
k.facts = [['Projects', k.facts[0][1]], ['Permits published', k.facts[1][1]], ['Dates moved', mv + ' of ' + L.length], ['Court cases', CC ? String(nc) : 'Not checked']]; return k;
}
export async function handle(req, u, env, ctx) {
OGENV = env;
const m = u.pathname.match(PATHS); if (!m) return null;
let ix; try { ix = await data(env); } catch (e) { return new Response('data unavailable', { status: 503, headers: { 'cache-control': 'no-store' } }); }
const ent = m[1] === 'type' ? (OG_KINDS.includes(m[2]) ? m[2] : null) : m[1] === 'projects' ? ix.bySlug.get(m[2]) : ix.devs.get(m[2]);
if (!ent) return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'public, max-age=3600' } });
const key = new Request('https://kolaboro.com/__og/' + V + '/' + encodeURIComponent(ix.updated + '|' + (ix.named.updated || '')) + u.pathname);
const hdr = { 'content-type': 'image/png', 'cache-control': TB.kbx_og__t.k4, 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
try { const hit = await caches.default.match(key); if (hit) return new Response(hit.body, { headers: Object.assign({ 'x-og-cache': 'hit' }, hdr) }); } catch (e) {}
const bytes = await draw(m[1] === 'type' ? typeCard(ix, ent) : m[1] === 'projects' ? await projectCard2(env, ix, ent) : await devCard2(env, ix, ent));
let perr = '';
try { await caches.default.put(key, new Response(bytes.slice(0), { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800' } })); } catch (e) { perr = String(e && e.message || e).slice(0, 120); }
return new Response(req.method === 'HEAD' ? null : bytes, { headers: Object.assign({ 'x-og-cache': perr ? 'miss; put failed: ' + perr.replace(/[^\x20-\x7e]/g, '') : 'miss', 'content-length': String(bytes.length) }, hdr) });
}
export { draw, projectCard, devCard, projectCard2, devCard2 };
