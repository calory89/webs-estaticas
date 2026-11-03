// Runs the JavaScript verifier (as published on kolaboro.com) against the test vectors and the live site; prints JSON like the Python and Go versions.
const KV = require(process.argv[2]); const V = require(process.argv[3]);
const UA = { 'user-agent': 'kolaboro-verify-js/1.2' };
const get = async p => { const r = await fetch('https://kolaboro.com' + p, { headers: UA }); return { body: await r.text(), h: r.headers }; };
(async () => {
  const out = {}, P = V.checkpoint.public_key_raw_b64;
  if (process.argv[4] === 'vectors') {
    const heads = V.log_heads.slice().sort((a, b) => a.day < b.day ? -1 : 1);
    out.proof = await KV.verifyProof(Object.assign({ projects_root: heads[0].projects_root }, V.proof));
    out.log = (await KV.verifyLog(V.log_heads)).ok;
    out.signature = await KV.verifySignature(V.signature.body, V.signature.signature, P);
    out.tamper_rejected = !(await KV.verifySignature(V.signature.body + ' ', V.signature.signature, P));
    out.checkpoint = (await KV.verifyCheckpoint(V.checkpoint.note, P)).ok;
    const L = V.log_inclusion; out.inclusion = await KV.verifyInclusion(L.leaf, L.leaf_index, L.tree_size, L.path, L.root_hash);
    const C = V.log_consistency; out.consistency = await KV.verifyConsistency(C.first, C.second, C.first_root, C.second_root, C.proof);
  } else {
    let r = await get('/api/open/summary'); out.summary_signed = await KV.verifySignature(r.body, r.h.get('x-kolaboro-signature'), P);
    r = await get('/api/open/log'); out.log_signed = await KV.verifySignature(r.body, r.h.get('x-kolaboro-signature'), P);
    const heads = JSON.parse(r.body).heads; out.log_chain = (await KV.verifyLog(heads)).ok;
    const cp = await KV.verifyCheckpoint((await get('/api/open/checkpoint')).body, P); out.checkpoint_signed = cp.ok; out.checkpoint_size_matches_log = cp.size === heads.length;
    let inc = true, cons = true;
    for (const x of heads) { const L = JSON.parse((await get('/api/open/log-proof?day=' + x.day)).body); inc = inc && L.root_hash === cp.root && await KV.verifyInclusion(L.leaf, L.leaf_index, L.tree_size, L.path, cp.root); }
    for (let m = 1; m <= cp.size; m++) { const C = JSON.parse((await get('/api/open/log-consistency?first=' + m + '&second=' + cp.size)).body); cons = cons && C.second_root === cp.root && await KV.verifyConsistency(m, cp.size, C.first_root, C.second_root, C.proof); }
    out.every_day_included = inc; out.append_only = cons;
  }
  console.log(JSON.stringify(out, null, 1)); process.exit(Object.values(out).every(Boolean) ? 0 : 1);
})();
