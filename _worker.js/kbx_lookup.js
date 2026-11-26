// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_lookup__q, $s = TB.kbx_lookup__s, $t = TB.kbx_lookup__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { api as kbApi, fetchPage, okUrl, pageParts, rpc, sha, logApi, WKEY, PILOT_401 } from './kolaboro.js';
import { handle as hHandle } from './kbx_h.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/(kb|v1)\/lookup(\/|$)/;
const VERSION = 'kolaboro-lookup-1';
const PER_IP_HOUR = 20;
const RAW_MAX = 600000;
const hexOf = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256Bytes = async buf => hexOf(await crypto.subtle.digest($q.b, buf));
function out(o, s = 200, extra) {
  const h = { 'content-type': $q.c, 'cache-control': $q.d, 'access-control-allow-origin': '*', 'access-control-allow-headers': $q.e, 'access-control-allow-methods': $q.f };
  return new Response(JSON.stringify(o), { status: s, headers: Object.assign(h, extra || {}) });
}
const RAWKEY = s => new Request($q.g + s);
const RESKEY = s => new Request($q.h + s);
const INKEY = s => new Request($q.i + s);
const clip = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n || 200);
const COMPANY_RX = /\b(LLC|LLP|INC|CORP|CORPORATION|LTD|LIMITED|LP|SL|SLU|SA|PT|CV|GMBH|BV|PLC|TRUST|COMPANY|CO|HOLDINGS?|DEVELOPMENTS?|DEVELOPERS?|REALTY|PROPERTIES|GROUP|ASSOCIATES|PARTNERS|BUILDERS|CONSTRUCTION|MANAGEMENT|AUTHORITY|CITY|DEPARTMENT)\b/;
const COMPANY_RE = { test: n => COMPANY_RX.test(String(n || '').toUpperCase().replace(/[.,]/g, '')) };
const companyOnly = n => n && COMPANY_RE.test(n) ? clip(n, 120) : (n ? $q.j : null);
async function getRaw(url, opts) {
const t0 = Date.now(), at = new Date().toISOString();
let r, buf;
try {
r = await fetch(url, Object.assign({ headers: { 'user-agent': $t.UA, accept: (opts && opts.accept) || $t.k0 }, redirect: $q.k, signal: AbortSignal.timeout((opts && opts.ms) || 12000) }, opts && opts.init || {}));
buf = await r.arrayBuffer();
} catch (e) {
if (!(opts && opts.retried) && Date.now() - t0 < 5000) return getRaw(url, Object.assign({}, opts, { retried: true, ms: 8000 }));
return { ok: false, error: e && e.name === $q.l ? $q.m : $q.n, at, ms: Date.now() - t0 };
}
if (r.status >= 500 && !(opts && opts.retried) && Date.now() - t0 < 4000) return getRaw(url, Object.assign({}, opts, { retried: true, ms: 8000 }));
if (buf.byteLength > RAW_MAX) buf = buf.slice(0, RAW_MAX);
const s = await sha256Bytes(buf), text = new TextDecoder().decode(buf);
return { ok: r.ok, status: r.status, at, ms: Date.now() - t0, sha256: s, bytes: buf.byteLength, buf, text, ctype: (r.headers.get($q.o) || '').split(';')[0] };
}
function snap(raw, ctx) {
if (!raw || !raw.sha256) return null;
ctx.waitUntil(caches.default.put(RAWKEY(raw.sha256), new Response(raw.buf, { headers: { 'cache-control': $q.p, 'content-type': $q.q } })).catch(() => {}));
return { sha256: raw.sha256, bytes: raw.bytes, content_type: raw.ctype, http_status: raw.status, fetched_at: raw.at, raw_url: $t.k1 + raw.sha256 };
}
function check(id, source, sourceUrl, country, query) { return { id, source, source_url: sourceUrl, country, query, status: $q.r, fields: {}, note: null, snapshot: null, ms: 0 }; }
function jparse(t) { try { return JSON.parse(t); } catch (e) { return null; } }
function literal(text, key) {
const m = String(text || '').match(new RegExp('"' + key + $t.k2));
return m ? m[0] : null;
}
const RC20 = /\b(\d{7}[A-Z]{2}\d{4}[A-Z]\d{4}[A-Z]{2}|\d{5}[A-Z]\d{8}\d{4}[A-Z]{2})\b/g;
const RC14 = /\b(\d{7}[A-Z]{2}\d{4}[A-Z]|\d{5}[A-Z]\d{8})\b/g;
const DOBNOW = /\b([BMQSXR]\d{8}-[A-Z]\d{1,2})\b/g;
const BIS_JOB = /\b(?:job|permit|application|alteration|NB|A1|A2|DOB)[^\d\n]{0,25}\b([1-5]\d{8})\b/gi;
const MD_PERMIT = /\b(?:permit|process)[^\d\n]{0,25}\b(20\d{8})\b/gi;
const UK_CO = /\b(?:company (?:number|no\.?|registration)|registered in england[^.]{0,40}?no\.?|crn)[^\w\n]{0,6}([A-Z]{2}\d{6}|\d{8})\b/gi;
function allMatches(re, s) { const o = []; let m; re.lastIndex = 0; while ((m = re.exec(s))) { o.push({ v: m[1], i: m.index, len: m[0].length }); if (o.length > 8) break; } return o; }
function around(s, i, len, pad) { pad = pad || 70; const a = Math.max(0, i - pad), b = Math.min(s.length, i + len + pad); return (a ? '...' : '') + s.slice(a, b).replace(/\s+/g, ' ').trim() + (b < s.length ? '...' : ''); }
function idsFrom(text, from) {
const s = String(text || ''), up = s.toUpperCase(), ids = [];
const add = (type, v, i, len) => { if (!ids.some(x => x.type === type && x.value === v)) ids.push({ type, value: v, from, text: around(s, i, len) }); };
allMatches(RC20, up).forEach(m => add($q.s, m.v, m.i, m.len));
allMatches(RC14, up).forEach(m => { if (!ids.some(x => x.type === $q.s && x.value.startsWith(m.v))) add($q.s, m.v, m.i, m.len); });
allMatches(DOBNOW, up).forEach(m => add($q.t, m.v, m.i, m.len));
allMatches(BIS_JOB, s).forEach(m => add($q.u, m.v, m.i, m.len));
allMatches(MD_PERMIT, s).forEach(m => add($q.v, m.v, m.i, m.len));
allMatches(UK_CO, s).forEach(m => add($q.w, m.v.toUpperCase().padStart(8, '0'), m.i, m.len));
return ids;
}
const NYC_HINT = /\b(manhattan|brooklyn|queens|bronx|staten island|new york,? ny|nyc|ny 1[01]\d{3})\b/i;
const MIAMI_HINT = /\b(miami(-dade)?|hialeah|homestead|doral|kendall|fl 33\d{3}|florida 33\d{3})\b/i;
const COUNTRY_HINTS = [
['ES', /\b(spain|españa|espana|madrid|barcelona|marbella|malaga|málaga|alicante|valencia|mallorca|ibiza|tenerife|costa del sol|costa blanca|murcia|sevilla)\b/i],
['US', /\b(usa|united states|new york|nyc|manhattan|brooklyn|miami|florida)\b/i],
['AE', /\b(dubai|uae|united arab emirates|abu dhabi)\b/i],
['ID', /\b(bali|indonesia|lombok|canggu|uluwatu|seminyak|ubud|jakarta)\b/i],
['GB', /\b(united kingdom|england|london|uk)\b/i]
];
function countriesFrom(...texts) { const s = texts.filter(Boolean).join(' '), o = []; COUNTRY_HINTS.forEach(([c, re]) => { if (re.test(s)) o.push(c); }); return o; }
function addressFrom(text) {
const s = String(text || '');
const m = s.match(/\b(\d{1,6}(?:-\d{1,4})?)\s+((?:[NSEW]{1,2}\s+)?[A-Za-z0-9][A-Za-z0-9 .'-]{2,40}?\b(?:street|st|avenue|ave|av|road|rd|boulevard|blvd|place|pl|drive|dr|lane|ln|court|ct|terrace|ter|way|parkway|pkwy|broadway|highway|hwy|circle|cir))\b\.?(?:\s*,?\s*(?:apt|unit|#)\s*\w+)?(?:\s*,\s*([A-Za-z .-]{3,30}))?/i);
if (!m) return null;
return { number: m[1], street: m[2], city: m[3] ? m[3].trim() : null, full: m[0] };
}
function brochureFigures(text, from, url) {
const s = String(text || ''), f = [];
const push = (field, value, unit, i, len) => { if (f.filter(x => x.field === field).length < 4) f.push({ field, value, unit, text: around(s, i, len, 50), from, source_url: url || null }); };
let m, re = /(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(m2|m²|sqm|sq\.?\s?m\b|square met(?:er|re)s|metros cuadrados)/gi;
while ((m = re.exec(s))) push('area', num(m[1]), 'm2', m.index, m[0].length);
re = /(\d{1,3}(?:,\d{3})+|\d+)\s*(sq\.?\s?ft|sqft|square feet|sf\b)/gi;
while ((m = re.exec(s))) push('area', Math.round(num(m[1]) * 0.092903), $q.x + m[1] + $q.y, m.index, m[0].length);
re = /\b(\d{1,3})[\s-]*(?:storey|story|stories|storeys|floors?|plantas|pisos|levels?)\b/gi;
while ((m = re.exec(s))) { const v = +m[1]; if (v > 0 && v < 200) push($q.z, v, $q.z, m.index, m[0].length); }
re = /\b(?:built in|completed in|year built|construid[oa] en|completion(?: date)?:?|handover:?|delivery:?|ready in)\s*(?:q[1-4]\s*)?((?:19|20)\d\d)\b/gi;
while ((m = re.exec(s))) push('year', +m[1], 'year', m.index, m[0].length);
re = /\b(residential|apartments?|condominiums?|condos?|villas?|hotel|commercial|office|retail|vivienda|residencial|townhouses?|single[- ]family)\b/gi;
while ((m = re.exec(s))) push('use', m[1].toLowerCase(), 'use', m.index, m[0].length);
return f;
}
function num(x) { x = String(x); if (/^\d{1,3}([.,]\d{3})+$/.test(x)) return +x.replace(/[.,]/g, ''); return +x.replace(',', '.'); }
const USE_GROUP = s => { s = String(s || '').toLowerCase();
if (/hotel|hotel|hospedaje|lodging/.test(s)) return 'hotel';
if (/resid|vivienda|apartment|condo|villa|town ?house|single[- ]family|dwelling|family|walk-up|elevator/.test(s)) return $q.A;
if (/office|oficina|commercial|comercial|retail|store|almac|warehouse|industrial|public|p[uú]blic/.test(s)) return $q.B;
return null; };
async function catastroRef(rc, ctx) {
const url = $t.CAT + $t.k3 + encodeURIComponent(rc);
const c = check($q.C, $t.k4, $q.D, 'ES', { by: $q.E, value: rc, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
if (!raw.sha256) { c.note = $q.F + raw.error + ').'; return c; }
const j = jparse(raw.text), r = j && j.consulta_dnprcResult;
if (!r) { c.note = $q.G + raw.status + $q.H; return c; }
if (r.lerr) { c.status = $q.I; c.note = clip(r.lerr.map(e => e.des).join('; '), 200); return c; }
const bico = r.bico;
if (bico) {
const bi = bico.bi || {}, de = bi.debi || {}, fi = bico.finca || {};
c.status = 'found';
c.fields = { reference: rc, address: bi.ldt || fi.ldt || null, use: de.luso || null, built_area_m2: de.sfc ? +de.sfc : null, plot_area_m2: fi.dff && fi.dff.ss ? +fi.dff.ss : null,
year_built: de.ant ? +de.ant : null, property_kind: fi.ltp || null, map: fi.infgraf && fi.infgraf.igraf || null,
units: (bico.lcons || []).slice(0, 12).map(x => ({ use: x.lcd, floor: x.dt && x.dt.lourb && x.dt.lourb.loint && x.dt.lourb.loint.pt, area_m2: x.dfcons && +x.dfcons.stl })) };
c.literal = { use: literal(raw.text, 'luso'), built_area_m2: literal(raw.text, 'sfc'), plot_area_m2: literal(raw.text, 'ss'), year_built: literal(raw.text, 'ant') };
c.official_page = $t.k5 + encodeURIComponent(rc);
return c;
}
const list = r.lrcdnp && r.lrcdnp.rcdnp;
if (list) {
c.status = 'found';
c.fields = { reference: rc, units_on_parcel: (r.control && r.control.cudnp) || list.length,
units: list.slice(0, 20).map(x => { const k = x.rc || {}; return { reference: [k.pc1, k.pc2, k.car, k.cc1, k.cc2].join(''), address: x.dt && x.dt.locs && x.dt.locs.lous && x.dt.locs.lous.lourb && x.dt.locs.lous.lourb.dir ? [x.dt.locs.lous.lourb.dir.tv, x.dt.locs.lous.lourb.dir.nv, x.dt.locs.lous.lourb.dir.pnp].filter(Boolean).join(' ') : null }; }) };
c.note = $s.k0;
return c;
}
c.status = $q.I; return c;
}
async function catastroCoords(lat, lng, ctx) {
const url = $t.CAT + $t.k6 + lng + $q.J + lat + $q.K;
const c = check($q.L, $t.k7, $q.D, 'ES', { by: $q.M, value: lat + ',' + lng, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
if (!raw.sha256) { c.note = $q.F + raw.error + ').'; return { c }; }
const j = jparse(raw.text), r = j && j.Consulta_RCCOOR_DistanciaResult;
if (!r) { c.note = raw.ok ? $q.N : $q.O + raw.status + $t.k8; return { c }; }
if (r.lerr) { c.status = $q.I; c.note = clip(r.lerr.map(e => e.des).join('; ')); return { c }; }
const p = (((r.coordenadas_distancias || {}).coordd || [])[0] || {}).lpcd || [];
if (!p.length) { c.status = $q.I; return { c }; }
const pc = p[0].pc || {}, ref = (pc.pc1 || '') + (pc.pc2 || '');
c.status = 'found'; c.fields = { parcel_reference: ref, address: p[0].ldt || null, distance_m: p[0].dis ? +p[0].dis : null };
return { c, ref };
}
async function nycAddress(addr, ctx) {
const url = $t.k9 + encodeURIComponent(addr);
const c = check($q.P, $t.k10, $q.Q, 'US', { by: $q.R, value: addr, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
if (!raw.sha256 || !raw.ok) { c.note = $q.S; return { c }; }
const j = jparse(raw.text), f = j && j.features && j.features[0];
const pad = f && f.properties && f.properties.addendum && f.properties.addendum.pad;
const n = (addr.match(/^\s*(\d[\d-]*)/) || [])[1];
if (!pad || !pad.bbl || (n && f.properties.housenumber && f.properties.housenumber !== n)) { c.status = $q.I; c.note = $q.T; return { c }; }
c.status = 'found'; c.fields = { address: f.properties.label, borough: f.properties.borough || null, bbl: pad.bbl, bin: pad.bin || null };
return { c, bbl: pad.bbl, bin: pad.bin };
}
const NYC_BOX = (lat, lng) => lat > 40.476 && lat < 40.918 && lng > -74.26 && lng < -73.70;
async function nycCoords(lat, lng, ctx) {
const url = $t.k11 + lat + $q.U + lng + $q.V;
const c = check($q.W, $t.k12, $q.Q, 'US', { by: $q.M, value: lat + ',' + lng, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
if (!raw.sha256 || !raw.ok) { c.note = $q.S; return { c }; }
const j = jparse(raw.text), fs = (j && j.features || []).filter(f => f.properties && f.properties.addendum && f.properties.addendum.pad && f.properties.addendum.pad.bbl);
const f = fs[0];
if (!f) { c.status = $q.I; c.note = $t.k13; return { c }; }
const km = +f.properties.distance || 0, pad = f.properties.addendum.pad;
if (km > 0.15) { c.status = $q.I; c.fields = { nearest_address: f.properties.label, distance_m: Math.round(km * 1000) }; c.note = $q.X + Math.round(km * 1000) + $t.k14; return { c }; }
const real = b => b && !/^[1-5]000000$/.test(b);
const binF = fs.find(x => x.properties.addendum.pad.bbl === pad.bbl && real(x.properties.addendum.pad.bin));
const bin = binF ? binF.properties.addendum.pad.bin : null;
c.status = 'found'; c.fields = { address: f.properties.label, borough: f.properties.borough || null, bbl: pad.bbl, bin, distance_m: Math.round(km * 1000) };
if (!bin) c.note = $t.k15;
return { c, bbl: pad.bbl, bin };
}
async function nycPluto(bbl, ctx) {
const url = $t.SOC + $q.Y + encodeURIComponent(bbl);
const c = check($q.Z, $t.k16, $t.k17, 'US', { by: 'BBL', value: bbl, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
const j = raw.ok ? jparse(raw.text) : null;
if (!Array.isArray(j)) { c.note = raw.sha256 ? $q.aa + raw.status + '.' : $q.ab; return c; }
if (!j.length) { c.status = $q.I; return c; }
const p = j[0], lu = p.landuse ? String(p.landuse).padStart(2, '0') : null;
c.status = 'found';
c.fields = { address: p.address || null, owner: companyOnly(p.ownername), building_class: p.bldgclass || null, land_use: lu ? $t.o_LANDUSE[lu] || lu : null,
building_area_sqft: p.bldgarea ? +p.bldgarea : null, building_area_m2: p.bldgarea ? Math.round(+p.bldgarea * 0.092903) : null, lot_area_sqft: p.lotarea ? +p.lotarea : null,
floors: p.numfloors ? Math.round(+p.numfloors) : null, units_total: p.unitstotal ? +p.unitstotal : null, units_residential: p.unitsres ? +p.unitsres : null,
year_built: p.yearbuilt && +p.yearbuilt ? +p.yearbuilt : null, zoning: p.zonedist1 || null, landmark: p.landmark || null, dataset_version: p.version || null };
c.literal = { building_area_m2: literal(raw.text, $q.ac), floors: literal(raw.text, $q.ad), year_built: literal(raw.text, $q.ae), use: literal(raw.text, $q.af) + (lu && $t.o_LANDUSE[lu] ? ' (' + $t.o_LANDUSE[lu] + ')' : '') };
c.official_page = $q.ag + bbl.slice(0, 1) + '/' + +bbl.slice(1, 6) + '/' + +bbl.slice(6);
return c;
}
const isoD = d => { d = String(d || ''); const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3] + '-' + m[1] + '-' + m[2] : d.slice(0, 10) || null; };
function dobRow(p) {
return { job: p.job__ || p.job_filing_number || null, job_type: p.job_type || p.filing_reason || null, work_type: p.work_type || null, permit_status: p.permit_status || p.filing_status || null,
filed: isoD(p.filing_date), issued: isoD(p.issuance_date || p.issued_date || p.first_permit_date), expires: isoD(p.expiration_date),
owner: companyOnly(p.owner_s_business_name || p.owner_business_name), permittee_business: p.permittee_s_business_name || p.applicant_business_name || null,
description: p.job_description ? clip(p.job_description, 160) : null };
}
async function nycDob(by, value, ctx) {
const q1 = by === 'bin' ? $q.ah + encodeURIComponent(value) : by === 'job' ? $q.ai + encodeURIComponent(value) : null;
const q2 = by === 'bin' ? 'bin=' + encodeURIComponent(value) : by === $q.aj ? $q.ak + encodeURIComponent(value) : null;
const res = [];
if (q1) {
const url = $t.SOC + $t.k18 + q1;
const c = check($q.al, $t.k19, $t.k20, 'US', { by: by === 'bin' ? 'BIN' : $q.am, value, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
const j = raw.ok ? jparse(raw.text) : null;
if (!Array.isArray(j)) c.note = raw.sha256 ? $q.an + raw.status + '.' : $q.ao;
else if (!j.length) c.status = $q.I;
else { c.status = 'found'; c.fields = { permits_returned: j.length, latest: j.slice(0, 8).map(dobRow) }; c._rows = j; }
c.official_page = $q.ap;
res.push(c);
}
if (q2) {
const url = $t.SOC + $t.k21 + q2;
const c = check($q.aq, $t.k22, $t.k23, 'US', { by: by === 'bin' ? 'BIN' : $q.ar, value, url });
let raw = await getRaw(url);
if (raw.status === 400) raw = await getRaw(url.replace($q.as, ''));
c.ms = raw.ms; c.snapshot = snap(raw, ctx);
const j = raw.ok ? jparse(raw.text) : null;
if (!Array.isArray(j)) c.note = raw.sha256 ? $q.an + raw.status + '.' : $q.ao;
else if (!j.length) c.status = $q.I;
else { c.status = 'found'; c.fields = { permits_returned: j.length, latest: j.slice(0, 8).map(dobRow) }; c._rows = j; }
c.official_page = $t.k24;
res.push(c);
}
return res;
}
const ABBR = [[/\bSTREET\b/g, 'ST'], [/\bAVENUE\b/g, 'AVE'], [/\bAV\b/g, 'AVE'], [/\bROAD\b/g, 'RD'], [/\bBOULEVARD\b/g, 'BLVD'], [/\bPLACE\b/g, 'PL'], [/\bDRIVE\b/g, 'DR'], [/\bLANE\b/g, 'LN'], [/\bCOURT\b/g, 'CT'], [/\bTERRACE\b/g, 'TER'], [/\bPARKWAY\b/g, 'PKWY'], [/\bHIGHWAY\b/g, 'HWY'], [/\bCIRCLE\b/g, 'CIR'], [/\bNORTH ?WEST\b/g, 'NW'], [/\bNORTH ?EAST\b/g, 'NE'], [/\bSOUTH ?WEST\b/g, 'SW'], [/\bSOUTH ?EAST\b/g, 'SE'], [/\b(\d+)(ST|ND|RD|TH)\b/g, '$1']];
function mdAddr(a) { let s = (a.number + ' ' + a.street).toUpperCase().replace(/[.,']/g, ' ').replace(/\s+/g, ' ').trim(); ABBR.forEach(([re, r]) => { s = s.replace(re, r); }); return s; }
async function miamiDade(by, value, ctx) {
const where = by === $q.at ? $q.au + value.replace(/\D/g, '') + $q.av + value.replace(/\D/g, '') + "'" : $q.aw + value.replace(/'/g, "''") + "%'";
const url = $s.MD + $q.ax + encodeURIComponent(where) + $s.k1;
const c = check($q.ay, $t.k25, $q.az, 'US', { by: by === $q.at ? $q.aA : $q.R, value, url });
const raw = await getRaw(url); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
const j = raw.ok ? jparse(raw.text) : null;
if (!j || j.error || !Array.isArray(j.features)) { c.note = raw.sha256 ? $t.k26 + (j && j.error ? ' (' + clip(j.error.message, 80) + ')' : '') + '.' : $q.aB; return c; }
if (!j.features.length) { c.status = $q.I; c.note = $s.k2; return c; }
const rows = j.features.map(f => f.attributes);
c.status = 'found';
c.fields = { permits_returned: rows.length, latest: rows.slice(0, 8).map(a => ({ permit: a.PermitNumber, issued: a.PermitIssuedDate || null, type: a.PermitType, use: a.ProposedUseDescription || null, application: a.ApplicationTypeDescription || null,
address: a.PropertyAddress, city: a.City, owner: companyOnly(a.OwnerName), contractor: a.ContractorName || null, square_feet: a.SquareFootage && +a.SquareFootage ? +a.SquareFootage : null,
floors: a.StructureFloors || null, units: a.StructureUnits || null, co_cc_date: a.CoCcDate || null, description: a.DetailDescriptionComments ? clip(a.DetailDescriptionComments, 160) : null })) };
c._rows = rows;
c.official_page = $t.k27;
return c;
}
async function rdap(host, ctx) {
const dom = host.split('.').slice(-2).join('.').length > 4 && !/\.(co|com|org|net|ac|gov)\.[a-z]{2}$/.test(host) ? host.split('.').slice(-2).join('.') : host.split('.').slice(-3).join('.');
const url = $q.aC + encodeURIComponent(dom);
const c = check($q.aD, $t.k28, $q.aE, null, { by: $q.aF, value: dom, url });
const raw = await getRaw(url, { accept: $t.k29 }); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
if (!raw.sha256) { c.note = $q.aG + raw.error + ').'; return c; }
if (raw.status === 404) { c.status = $q.I; c.note = $t.k30; return c; }
const j = jparse(raw.text); if (!j || !raw.ok) { c.note = $q.aH + raw.status + '.'; return c; }
const ev = k => ((j.events || []).find(e => e.eventAction === k) || {}).eventDate || null;
const reg = (j.entities || []).find(e => (e.roles || []).includes($q.aI));
const fn = reg && reg.vcardArray && (reg.vcardArray[1] || []).find(v => v[0] === 'fn');
const created = ev($q.aJ);
c.status = 'found';
c.fields = { domain: j.ldhName ? j.ldhName.toLowerCase() : dom, registered: created, expires: ev($q.aK), last_changed: ev($q.aL), registrar: fn ? fn[3] : null,
age_days: created ? Math.floor((Date.now() - Date.parse(created)) / 864e5) : null, status: j.status || [] };
c.literal = { registered: created ? $t.k31 + created + '"' : null };
return c;
}
async function gleif(name, ctx) {
const url = $t.k32 + encodeURIComponent(name);
const c = check($q.aM, $t.k33, $q.aN, null, { by: $q.aO, value: name, url });
const raw = await getRaw(url, { accept: $q.aP }); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
const j = raw.ok ? jparse(raw.text) : null;
if (!j || !Array.isArray(j.data)) { c.note = raw.sha256 ? $q.aQ + raw.status + '.' : $q.aR; return c; }
if (!j.data.length) { c.status = $q.I; c.note = $s.k3; return c; }
c.status = 'found';
c.fields = { matches: j.data.slice(0, 5).map(d => { const e = d.attributes.entity || {}; return { lei: d.attributes.lei, legal_name: e.legalName && e.legalName.name, status: e.status, jurisdiction: e.jurisdiction, legal_form: e.legalForm && e.legalForm.id,
registered_at: d.attributes.registration && d.attributes.registration.initialRegistrationDate, city: e.legalAddress && e.legalAddress.city, country: e.legalAddress && e.legalAddress.country, page: $q.aS + d.attributes.lei }; }) };
return c;
}
async function ukCompany(num, ip, env, ctx) {
const c = check($q.aT, $t.k34, $t.k35, 'GB', { by: $q.aU, value: num, url: $t.k36 + num });
const t0 = Date.now();
try {
const r = await hHandle(new Request($t.k37 + encodeURIComponent(num), { headers: { 'cf-connecting-ip': ip } }), new URL($t.k38 + encodeURIComponent(num)), env, ctx);
const d = await r.json(); c.ms = Date.now() - t0;
if (d.sha256) c.snapshot = { sha256: d.sha256, bytes: d.bytes, content_type: d.content_type, http_status: d.http_status, fetched_at: d.fetched_at, raw_url: $q.aV + d.sha256 + $q.aW };
const res = d.result || {};
if (res.found) { c.status = 'found'; c.fields = { name: res.name, status: res.status, type: res.type, incorporated: res.incorporated, sic: res.sic }; }
else if (res.found === false) c.status = $q.I;
else c.note = d.error || $t.k39;
} catch (e) { c.note = $q.aX; }
return c;
}
async function dubai(q, env, ctx) {
const c = check($q.aY, $t.k40, $t.k41, 'AE', { by: $q.aZ, value: q || null, url: $t.k42 });
c.manual_check = $t.k43;
const k = env.DUBAI_PULSE_KEY || env.DUBAI_PULSE, s = env.DUBAI_PULSE_SECRET || (String(env.DUBAI_PULSE || '').split(':')[1]);
if (!k || !s) { c.status = $q.ba; c.note = $s.k4; return c; }
try {
const t = await fetch($t.k44, { method: 'POST', headers: { 'content-type': $q.bb }, body: $q.bc + encodeURIComponent(String(k).split(':')[0]) + $q.bd + encodeURIComponent(s), signal: AbortSignal.timeout(10000) });
const tok = (await t.json()).access_token; if (!tok) { c.note = $q.be; return c; }
const url = c.query.url + $q.bf + encodeURIComponent($q.bg + String(q || '').replace(/'/g, '') + "%'") + $q.bh;
const raw = await getRaw(url, { init: { headers: { authorization: $q.bi + tok, 'user-agent': $t.UA } } }); c.ms = raw.ms; c.snapshot = snap(raw, ctx);
const j = raw.ok ? jparse(raw.text) : null, rows = j && (j.result || j.results || j.data || j);
if (!Array.isArray(rows)) { c.note = $q.bj + raw.status + '.'; return c; }
if (!rows.length) { c.status = $q.I; return c; }
c.status = 'found'; c.fields = { matches: rows.slice(0, 5) };
} catch (e) { c.note = $q.bk; }
return c;
}
function indonesia() {
const a = check($q.bl, $t.k45, $q.bm, 'ID', { by: $q.bn, value: null, url: null });
a.status = $q.bo; a.manual_check = $q.bm;
a.note = $s.k5;
const b = check($q.bp, $t.k46, $t.k47, 'ID', { by: $q.bn, value: null, url: null });
b.status = $q.bo; b.manual_check = $t.k48;
b.note = $s.k6;
return [a, b];
}
function spainCompany() {
const c = check($q.bq, $t.k49, $q.br, 'ES', { by: $q.bn, value: null, url: null });
c.status = $q.bo; c.manual_check = $q.br;
c.note = $s.k7;
return c;
}
let IMG = null;
async function imageIndex(env) {
if (IMG && Date.now() - IMG.t < 600000) return IMG.v;
let v = null;
try { const r = env.ASSETS ? await env.ASSETS.fetch(new Request($t.k50)) : await fetch($t.k51); if (r.ok) v = await r.json(); } catch (e) {}
IMG = { t: Date.now(), v }; return v;
}
function ham(a, b) { let d = 0; for (let i = 0; i < 16; i += 8) { let x = parseInt(a.substr(i, 8), 16) ^ parseInt(b.substr(i, 8), 16); while (x) { x &= x - 1; d++; } } return d; }
async function imageReuse(hashes, env) {
const c = check($q.bs, $t.k52, $t.k53, null, { by: $q.bt, value: hashes.length + $q.bu, url: $t.k54 });
const idx = await imageIndex(env);
if (!idx || !Array.isArray(idx.items)) { c.note = $t.k55; return c; }
const hits = [];
hashes.forEach((h, n) => { idx.items.forEach(it => { const d = Math.min(ham(h, it[2]), it[3] ? ham(h, it[3]) : 64); if (d <= 5) hits.push({ image: n, case_id: it[0], distance_bits: d }); }); });
const cases = [...new Set(hits.map(x => x.case_id))];
c.status = hits.length ? 'found' : $q.I;
c.fields = { images_checked: hashes.length, index_images: idx.images, index_generated: idx.generated, near_identical_matches: hits.slice(0, 20), other_projects: cases.length };
c.note = hits.length ? $s.k8 : $q.bv + idx.images + $q.bw;
return c;
}
function compare(brochure, checks) {
const reg = [];
checks.forEach(c => {
if (c.status !== 'found') return;
const f = c.fields || {}, L = c.literal || {};
if (c.id === $q.C) { if (f.built_area_m2) reg.push({ field: 'area', value: f.built_area_m2, text: L.built_area_m2, source: c.source, check: c.id, unit: $q.bx }); if (f.year_built) reg.push({ field: 'year', value: f.year_built, text: L.year_built, source: c.source, check: c.id }); if (f.use) reg.push({ field: 'use', value: f.use, text: L.use, source: c.source, check: c.id }); }
if (c.id === $q.Z) { if (f.building_area_m2) reg.push({ field: 'area', value: f.building_area_m2, text: L.building_area_m2 + $q.by, source: c.source, check: c.id, unit: $q.bz }); if (f.floors) reg.push({ field: $q.z, value: f.floors, text: L.floors, source: c.source, check: c.id }); if (f.year_built) reg.push({ field: 'year', value: f.year_built, text: L.year_built, source: c.source, check: c.id }); if (f.land_use) reg.push({ field: 'use', value: f.land_use, text: L.use, source: c.source, check: c.id }); }
if (c.id === $q.ay && c._rows) { const a = c._rows.find(x => +x.SquareFootage > 0 || x.StructureFloors > 1) || c._rows[0];
if (+a.SquareFootage > 0) reg.push({ field: 'area', value: Math.round(+a.SquareFootage * 0.092903), text: $q.bA + a.SquareFootage + $q.bB + a.PermitNumber + ')', source: c.source, check: c.id, unit: $q.bC });
if (a.StructureFloors) reg.push({ field: $q.z, value: a.StructureFloors, text: $q.bD + a.StructureFloors + $q.bE + a.PermitNumber + ')', source: c.source, check: c.id });
if (a.ProposedUseDescription) reg.push({ field: 'use', value: a.ProposedUseDescription, text: $q.bF + a.ProposedUseDescription + '"', source: c.source, check: c.id }); }
});
const diffs = [];
['area', $q.z, 'year', 'use'].forEach(field => {
const b = brochure.filter(x => x.field === field), r = reg.filter(x => x.field === field);
if (!b.length || !r.length) return;
const rr = r[0];
let best = null;
b.forEach(x => {
let agree, note = null;
if (field === 'use') { const g1 = USE_GROUP(x.value), g2 = USE_GROUP(rr.value); agree = g1 && g2 ? g1 === g2 : null; }
else if (field === 'area') { agree = Math.abs(x.value - rr.value) <= Math.max(5, rr.value * 0.1); if (!agree) note = $t.k56 + (rr.unit || $q.bG) + '.'; }
else if (field === 'year') { agree = x.value === rr.value; if (!agree) note = $s.k9; }
else agree = x.value === rr.value;
const d = { field, agree, brochure: { value: x.value, unit: x.unit, text: x.text, from: x.from, source_url: x.source_url }, register: { value: rr.value, text: rr.text, source: rr.source, check: rr.check }, note };
if (!best || (agree && !best.agree)) best = d;
});
if (best) diffs.push(best);
});
return diffs;
}
function normCo(s) { return String(s || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9 ]/g, ' ').replace(/\b(LLC|L L C|INC|CORP|CORPORATION|LTD|LIMITED|LP|SL|SLU|SA|PT|CV|GMBH|BV|PLC|CO|COMPANY|THE|GROUP|HOLDINGS?)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function holderMatch(siteName, from, checks) {
if (!siteName) return null;
const names = [];
checks.forEach(c => {
if (c.status !== 'found') return;
if (c._rows) c._rows.slice(0, 25).forEach(r => { [r.owner_s_business_name, r.owner_business_name, r.permittee_s_business_name, r.applicant_business_name, r.OwnerName, r.ContractorName].forEach(n => { if (n && COMPANY_RE.test(n)) names.push({ name: n, check: c.id, source: c.source }); }); });
if (c.id === $q.Z && c.fields.owner && COMPANY_RE.test(c.fields.owner)) names.push({ name: c.fields.owner, check: c.id, source: c.source });
if (c.id === $q.aT && c.fields.name) names.push({ name: c.fields.name, check: c.id, source: c.source });
});
if (!names.length) return null;
const a = normCo(siteName), at = new Set(a.split(' ').filter(w => w.length > 2));
let best = null;
names.forEach(n => { const b = normCo(n.name), bt = b.split(' ').filter(w => w.length > 2); const common = bt.filter(w => at.has(w)).length; const score = bt.length ? common / Math.max(bt.length, at.size) : 0; if (!best || score > best.score) best = Object.assign({ score }, n); });
return { field: $q.bH, agree: best.score >= 0.6 ? true : best.score === 0 ? false : null, brochure: { value: siteName, text: siteName, from }, register: { value: best.name, text: best.name, source: best.source, check: best.check },
note: best.score >= 0.6 ? $t.k57 : best.score === 0 ? $s.k10 : $t.k58 };
}
function inputFrom(b) {
const g = k => b[k] == null ? '' : String(b[k]).trim();
const hashes = (Array.isArray(b.image_hashes) ? b.image_hashes : String(b.image_hashes || '').split(',')).map(x => String(x).trim().toLowerCase()).filter(x => /^[0-9a-f]{16}$/.test(x)).slice(0, 32);
const lat = parseFloat(b.lat), lng = parseFloat(b.lng);
return { url: g('url').slice(0, 500), q: g('q').slice(0, 1500), country: g($q.bI).toUpperCase().slice(0, 2), refcat: g($q.bJ).toUpperCase().replace(/\s+/g, '').slice(0, 20), address: g($q.R).slice(0, 200),
permit: g($q.at).toUpperCase().slice(0, 40), company: g($q.bH).slice(0, 120), lat: isFinite(lat) && Math.abs(lat) <= 90 ? lat : null, lng: isFinite(lng) && Math.abs(lng) <= 180 ? lng : null, image_hashes: hashes, ai: g('ai') };
}
async function deskReview(url, ip, env, ctx) {
  try {
    const r = await kbApi(new Request($q.bK, { method: 'POST', headers: { origin: $q.bL, 'content-type': $q.bM, 'cf-connecting-ip': ip }, body: JSON.stringify({ url }) }), new URL($q.bK), env, ctx);
    return { status: r.status, d: await r.json() };
  } catch (e) { return { status: 500, d: { error: $q.bN } }; }
}
async function run(inp, req, env, ctx, opts) {
const t0 = Date.now(), started = new Date().toISOString(), ip = req.headers.get($q.bO) || 'x';
const checks = [], ids = [], brochure = [];
let pageText = '', host = null, pageUrl = null, review = null;
const tasks = [];
if (inp.url) {
const u = okUrl(inp.url);
if (!u) return { error: 'url' };
host = u.hostname.replace(/^www\./, ''); pageUrl = u.toString();
const c = check($q.bP, $t.k59, pageUrl, null, { by: 'url', value: pageUrl, url: pageUrl });
tasks.push((async () => {
const t = Date.now(), pg = await fetchPage(u);
c.ms = Date.now() - t;
if (pg.error) { c.status = $q.r; c.note = pg.error === $q.bQ ? $t.k60 + (pg.status || '?') + ').' : $q.bR + (pg.status ? $q.bS + pg.status + ')' : '') + '.'; return; }
const buf = new TextEncoder().encode(pg.html), s = await sha256Bytes(buf);
c.snapshot = snap({ sha256: s, bytes: buf.byteLength, buf, ctype: $q.bT, status: pg.status, at: new Date().toISOString() }, ctx);
pageText = pageParts(pg.html).visible.slice(0, 200000);
c.status = 'found';
})());
tasks.push(rdap(u.hostname.toLowerCase(), ctx).then(x => checks.push(x)));
const aiOk = opts.partner || inp.ai === '1' || (inp.ai !== '0' && opts.ownOrigin);
if (aiOk) tasks.push(deskReview(pageUrl, opts.partner ? $q.bU + opts.partner : ip, env, ctx).then(r => { review = r; }));
else review = { skipped: true };
checks.push(c);
}
await Promise.all(tasks);
if (inp.refcat) ids.push({ type: $q.s, value: inp.refcat, from: 'input', text: inp.refcat });
if (inp.permit) { const p = inp.permit; ids.push({ type: DOBNOW.test(p) ? $q.t : /^[1-5]\d{8}$/.test(p) ? $q.u : /^20\d{8}$/.test(p) ? $q.v : $q.at, value: p, from: 'input', text: p }); DOBNOW.lastIndex = 0; }
idsFrom(inp.q, 'input').forEach(x => ids.push(x));
const site = checks.find(c => c.id === $q.bP);
if (pageText) idsFrom(pageText, $q.bP).forEach(x => { if (!ids.some(y => y.type === x.type && y.value === x.value)) ids.push(x); });
const rep = review && review.d && review.d.report;
if (site) {
if (rep) {
const fq = (rep.citations && rep.citations.fields) || {};
site.fields = { developer: rep.developer, project: rep.project, location: rep.location, country: rep.country, property_type: rep.property_type, completion: rep.completion, permit_claim: rep.permit_claim, title_type: rep.title_type, price_from: rep.price_from };
site.desk_review = { analysed: review.d.analysed, cached: !!review.d.cached, prompt_sha256: review.d.prompt_sha256 || null, quotes: fq };
if (rep.permit_claim) idsFrom(rep.permit_claim, $q.bN).forEach(x => { if (!ids.some(y => y.type === x.type && y.value === x.value)) ids.push(x); });
} else if (review && review.skipped) site.desk_review = { status: $q.bV, note: $s.k11 };
else if (review) site.desk_review = { status: $q.r, error: review.d && review.d.error || 'error', note: review.d && review.d.error === 'rate' ? $t.k61 : $t.k62 };
site.fields = Object.assign(site.fields || {}, { identifiers_found: ids.filter(x => x.from !== 'input').map(x => ({ type: x.type, value: x.value, text: x.text })) });
}
if (pageText) brochureFigures(pageText, $q.bP, pageUrl).forEach(x => brochure.push(x));
if (inp.q) brochureFigures(inp.q, 'input', null).forEach(x => brochure.push(x));
const cs = new Set();
if (inp.country) cs.add(inp.country === 'UK' ? 'GB' : inp.country);
if (rep && rep.country) { const k = $t.o_COUNTRY_NAMES[String(rep.country).toLowerCase()]; if (k) cs.add(k); else countriesFrom(rep.country).forEach(x => cs.add(x)); }
countriesFrom(inp.q, inp.address, rep && rep.location).forEach(x => cs.add(x));
if (host && /\.es$/.test(host)) cs.add('ES'); if (host && /\.id$/.test(host)) cs.add('ID'); if (host && /\.ae$/.test(host)) cs.add('AE'); if (host && /\.uk$/.test(host)) cs.add('GB');
if (ids.some(x => x.type === $q.s)) cs.add('ES');
if (ids.some(x => /^nyc_|^miami/.test(x.type))) cs.add('US');
if (inp.lat != null && inp.lng != null && inp.lat > 27.5 && inp.lat < 44 && inp.lng > -18.5 && inp.lng < 4.5) cs.add('ES');
const nycPt = inp.lat != null && inp.lng != null && NYC_BOX(inp.lat, inp.lng); if (nycPt) cs.add('US');
if (!cs.size && pageText) countriesFrom(pageText.slice(0, 20000)).slice(0, 1).forEach(x => cs.add(x));
const reg = [];
ids.filter(x => x.type === $q.s).slice(0, 2).forEach(x => reg.push(catastroRef(x.value, ctx)));
if (inp.lat != null && inp.lng != null && cs.has('ES') && !ids.some(x => x.type === $q.s)) reg.push(catastroCoords(inp.lat, inp.lng, ctx).then(async r => r.ref ? [r.c, await catastroRef(r.ref, ctx)] : [r.c]));
const addrText = inp.address || inp.q;
const addr = addressFrom(addrText);
if (addr && (NYC_HINT.test(addrText) || inp.country === 'US' && !MIAMI_HINT.test(addrText)) && !MIAMI_HINT.test(addrText)) {
reg.push(nycAddress(addr.full + (NYC_HINT.test(addr.full) ? '' : ' ' + (addrText.match(NYC_HINT) || [''])[0]), ctx).then(async r => {
if (!r.bbl) return [r.c];
const [p, d] = await Promise.all([nycPluto(r.bbl, ctx), r.bin && !/^[1-5]000000$/.test(r.bin) ? nycDob('bin', r.bin, ctx) : Promise.resolve([])]);
return [r.c, p].concat(d);
}));
}
if (nycPt && !addr && !ids.some(x => /^nyc_/.test(x.type))) reg.push(nycCoords(inp.lat, inp.lng, ctx).then(async r => {
if (!r.bbl) return [r.c];
const [p, d] = await Promise.all([nycPluto(r.bbl, ctx), r.bin ? nycDob('bin', r.bin, ctx) : Promise.resolve([])]);
return [r.c, p].concat(d);
}));
ids.filter(x => x.type === $q.u).slice(0, 2).forEach(x => reg.push(nycDob('job', x.value, ctx).then(a => a)));
ids.filter(x => x.type === $q.t).slice(0, 2).forEach(x => reg.push(nycDob($q.aj, x.value, ctx).then(a => a)));
if (addr && MIAMI_HINT.test(addrText)) reg.push(miamiDade($q.R, mdAddr(addr), ctx));
ids.filter(x => x.type === $q.v).slice(0, 2).forEach(x => reg.push(miamiDade($q.at, x.value, ctx)));
const qName = (!pageUrl && inp.q && !ids.length && !addr && /[A-Za-z\u00C0-\u024F]{3}/.test(inp.q) && inp.q.trim().length <= 80 && !/https?:|www\./i.test(inp.q)) ? inp.q.trim() : null;
const company = inp.company || (rep && rep.developer) || qName || null;
if (company && company.length >= 3) reg.push(gleif(company, ctx));
ids.filter(x => x.type === $q.w).slice(0, 1).forEach(x => reg.push(ukCompany(x.value, ip, env, ctx)));
if (cs.has('GB') && company && !ids.some(x => x.type === $q.w)) { const c = check($q.aT, $q.bW, $t.k63, 'GB', { by: $q.aO, value: company, url: null }); c.status = $q.ba; c.note = $s.k12; c.manual_check = $t.k64 + encodeURIComponent(company); reg.push(Promise.resolve(c)); }
if (cs.has('ES')) reg.push(Promise.resolve(spainCompany()));
if (cs.has('AE')) reg.push(dubai((rep && rep.project) || inp.q || null, env, ctx));
if (cs.has('ID')) reg.push(Promise.resolve(indonesia()));
if (inp.image_hashes.length) reg.push(imageReuse(inp.image_hashes, env));
(await Promise.all(reg)).forEach(x => (Array.isArray(x) ? x : [x]).forEach(c => checks.push(c)));
const comparison = compare(brochure, checks);
const hm = holderMatch(company, inp.company ? 'input' : $q.bN, checks); if (hm) comparison.push(hm);
checks.forEach(c => { delete c._rows; });
const lines = checks.filter(c => c.snapshot).map(c => c.snapshot.sha256 + ' ' + c.snapshot.fetched_at + ' ' + c.id).sort();
const summary = { found: 0, not_found: 0, not_published: 0, unavailable: 0, needs_key: 0 };
checks.forEach(c => { summary[c.status] = (summary[c.status] || 0) + 1; });
const result = { version: VERSION, started_at: started, input: { url: pageUrl, q: inp.q || null, country: inp.country || null, refcat: inp.refcat || null, address: inp.address || null, permit: inp.permit || null, company: inp.company || null, lat: inp.lat, lng: inp.lng, image_hashes: inp.image_hashes.length },
detected: { countries: [...cs], identifiers: ids.map(x => ({ type: x.type, value: x.value, from: x.from, text: x.text })) }, summary, checks, comparison, seal: null, finished_at: null, ms: 0,
disclaimer: $s.k13 };
if (lines.length) {
const root = await sha(lines.join('\n'));
let stamp = null, stampStatus = $q.bX;
try {
const r = await kbApi(new Request($q.bY, { method: 'POST', headers: { 'content-type': $q.bM, 'cf-connecting-ip': ip }, body: JSON.stringify({ hash: root, source: $q.bZ }) }), new URL($q.bY), env, ctx);
const d = await r.json();
if (d.stamp) { stamp = { created_at: d.stamp.created_at, calendars: d.stamp.calendars, bitcoin_block: d.stamp.bitcoin_block || null, stored: d.stored !== false }; stampStatus = $q.ca; }
else stampStatus = d.error === 'rate' ? $q.cb : $q.cc;
} catch (e) { stampStatus = 'error'; }
result.seal = { root_sha256: root, method: $s.k14, lines,
opentimestamps: stamp, stamp_status: stampStatus, verify: $t.k65 + root, result_url: $q.cd + root };
}
result.finished_at = new Date().toISOString(); result.ms = Date.now() - t0;
if (result.seal) ctx.waitUntil(caches.default.put(RESKEY(result.seal.root_sha256), new Response(JSON.stringify(result), { headers: { 'content-type': $q.bM, 'cache-control': $q.p } })).catch(() => {}));
return result;
}
async function rateOk(req, ctx) {
const ip0 = req.headers.get($q.bO) || 'x', ip = ip0.includes(':') ? ip0.split(':').slice(0, 4).join(':') + '::/64' : ip0, hour = new Date().toISOString().slice(0, 13);
const k = new Request($q.ce + encodeURIComponent(ip) + '/' + hour);
const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
if (n >= PER_IP_HOUR) return false;
ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.cf } })));
return true;
}
async function readInput(req, u) {
if (req.method === 'POST') { let b; try { b = await req.json(); } catch (e) { return null; } return b && typeof b === $q.cg ? b : null; }
const o = {}; for (const [k, v] of u.searchParams) o[k] = k === $q.ch ? v.split(',') : v; return o;
}
async function lookup(req, u, env, ctx, partner) {
const b = await readInput(req, u);
if (!b) return out({ error: $q.ci }, 400);
const inp = inputFrom(b);
if (!inp.url && !inp.q && !inp.refcat && !inp.address && !inp.permit && !inp.company && inp.lat == null && !inp.image_hashes.length) return out({ error: 'empty', need: $t.k66, docs: $q.cj }, 400);
const o = req.headers.get($q.ck) || '', sfs = req.headers.get($q.cl) || '';
const ownOrigin = o === $q.bL || o === $q.cm || (!o && sfs === $q.cn);
const ik = await sha(VERSION + JSON.stringify(inp) + (ownOrigin || partner ? 'ai' : ''));
const hit = await caches.default.match(INKEY(ik));
if (hit) { const d = await hit.json(); return out(Object.assign(d, { cached: true })); }
if (!partner && !(await rateOk(req, ctx))) return out({ error: 'rate', limit: PER_IP_HOUR + $q.co }, 429);
const t0 = Date.now();
let res;
try { res = await run(inp, req, env, ctx, { ownOrigin, partner }); }
catch (e) { ctx.waitUntil(logApi($q.bZ, false, false, Date.now() - t0)); return out({ error: $q.cp, detail: String(e && e.message || e).slice(0, 160) }, 500); }
if (res.error) return out(res, 400);
ctx.waitUntil(logApi($q.bZ, true, false, Date.now() - t0));
if (!(res.summary && res.summary.unavailable)) ctx.waitUntil(caches.default.put(INKEY(ik), new Response(JSON.stringify(res), { headers: { 'content-type': $q.bM, 'cache-control': $q.cq } })).catch(() => {}));
return out(Object.assign(res, { cached: false }));
}
async function v1(req, u, env, ctx) {
  const key = req.headers.get($q.cr) || '';
  if (!/^kb_pilot_[0-9a-f]{40}$/.test(key)) return out(PILOT_401(key), 401);
  if (await sha(key) === $q.a) { ctx.waitUntil(rpc($q.cs, { p_wkey: WKEY, p_kind: $q.ct, p_hint: (req.headers.get($q.cu) || '?') + $q.cv }).catch(() => {})); return out({ error: $q.cw }, 401); }
  let a; try { a = await rpc($q.cx, { p_key: key, p_endpoint: req.method + $q.cv }); } catch (e) { return out({ error: 'db' }, 503); }
  if (a && a.error) return out(a, a.error === $q.cb ? 429 : 401);
  const r = await lookup(req, u, env, ctx, key.slice(9, 17));
  if (a && a.remaining != null) r.headers.set($q.cy, String(a.remaining));
  return r;
}
let COV = null;
async function coverage(env) {
if (COV && Date.now() - COV.t < 300000) return COV.v;
let v = null;
try { const r = env.ASSETS ? await env.ASSETS.fetch(new Request($t.k67)) : await fetch($t.k68); if (r.ok) v = await r.json(); } catch (e) {}
COV = { t: Date.now(), v }; return v;
}
async function stats(ctx) {
  try {
    const d = await rpc($q.cz, {});
    const on = !!(d.runs && $q.bZ in d.runs);
    if (!on) return out({ counting: false, lookups: null, note: $q.cA }, 200, { 'cache-control': $q.cB });
    return out({ counting: true, lookups: (d.runs && d.runs.lookup) || 0, lookups_7d: (d.runs_7d && d.runs_7d.lookup) || 0, p50_ms_7d: (d.p50_ms_7d && d.p50_ms_7d.lookup) || null, source: $q.cC, generated_at: d.generated_at }, 200, { 'cache-control': $q.cB });
  } catch (e) { return out({ error: 'db' }, 503); }
}
let PTS = null;
async function points(env) {
if (PTS && Date.now() - PTS.t < 600000) return out(PTS.v, 200, { 'cache-control': $q.cD });
try {
const nm = await import('./kbx_named.js');
const [ix, simR] = await Promise.all([nm.data(env), env.ASSETS ? env.ASSETS.fetch(new Request($t.k69)) : fetch($t.k70)]);
const sim = simR.ok ? await simR.json() : {}, mp = (sim.market_points && sim.market_points.markets) || {}, markets = {};
const projects = ix.P.filter(x => x.s && x.n && x.mk && mp[x.mk]).map(x => [x.s, x.n, x.mk]).sort((a, b) => a[1].localeCompare(b[1]));
Object.keys(mp).forEach(k => { if (k.toLowerCase() !== 'sumba') markets[k] = { lat: mp[k].lat, lng: mp[k].lng, place: mp[k].place || k, src: mp[k].src || null }; });
const v = { version: $q.cE, generated: new Date().toISOString(), what: $s.k15, method_url: $t.k71, markets, projects };
PTS = { t: Date.now(), v };
return out(v, 200, { 'cache-control': $q.cD });
} catch (e) { return out({ error: $q.cF }, 503); }
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.cG) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': $q.e, 'access-control-allow-methods': $q.f, 'access-control-max-age': '86400' } });
if (p === $q.cH) return (req.method === 'GET' || req.method === 'POST') ? v1(req, u, env, ctx) : out({ error: $q.cI }, 405);
if (p === $q.cJ) return (req.method === 'GET' || req.method === 'POST') ? lookup(req, u, env, ctx, null) : out({ error: $q.cI }, 405);
if (req.method !== 'GET') return out({ error: $q.cI }, 405);
if (p === $q.cK) { const v = await coverage(env); return v ? out(v, 200, { 'cache-control': $q.cL }) : out({ error: $q.cM }, 503); }
if (p === $q.cN) return stats(ctx);
if (p === $q.cO) return points(env);
let m = p.match(/^\/api\/kb\/lookup\/raw\/([0-9a-f]{64})$/);
if (m) { const r = await caches.default.match(RAWKEY(m[1])); if (!r) return out({ error: $q.cP, note: $t.k72 }, 404);
return new Response(r.body, { headers: { 'content-type': $q.cQ, 'x-content-type-options': $q.cR, 'content-security-policy': $q.cS, 'access-control-allow-origin': '*', 'cache-control': $q.cT } }); }
m = p.match(/^\/api\/kb\/lookup\/r\/([0-9a-f]{64})$/);
if (m) { const r = await caches.default.match(RESKEY(m[1])); return r ? out(await r.json(), 200, { 'cache-control': $q.cU }) : out({ error: $q.cP, note: $s.k16 }, 404); }
if (p === $q.cV) return out({ docs: $q.cj, version: VERSION });
return out({ error: $q.I }, 404);
}
