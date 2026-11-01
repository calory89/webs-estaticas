/* Kolaboro watchlist helper. Saved projects live only in this browser (localStorage 'kb_watch').
   window.KBWatch = { has(id), toggle(id, case), list(), remove(id), snap(case), save(list), on(fn) } */
(function(){
  var KEY = 'kb_watch', subs = [];
  function norm(id){ return String(id == null ? '' : id).trim().toUpperCase().slice(0, 40); }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function snap(c){
    c = c || {}; var cl = c.claims || {};
    return {
      score: c.score || 0, vscore: c.vscore || 0, stage: c.stage || null, overdue: c.overdue || 0,
      claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0 },
      history: (c.history || []).length, flags: (c.flags || []).length, date: today()
    };
  }
  function clean(x){
    if (!x || typeof x !== 'object') return null;
    var id = norm(x.id); if (!id || !/^[A-Z0-9 _-]+$/.test(id)) return null;
    var s = x.snap && typeof x.snap === 'object' ? x.snap : null;
    return { id: id, snap: s, added: typeof x.added === 'string' ? x.added.slice(0, 10) : (s && s.date) || today() };
  }
  function list(){
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { raw = []; }
    if (!Array.isArray(raw)) return [];
    var seen = {}, out = [];
    raw.forEach(function(x){ var y = clean(x); if (y && !seen[y.id]) { seen[y.id] = 1; out.push(y); } });
    return out;
  }
  function save(L){
    var ok = true;
    try { localStorage.setItem(KEY, JSON.stringify(L.map(clean).filter(Boolean).slice(0, 200))); } catch (e) { ok = false; }
    subs.forEach(function(f){ try { f(); } catch (e) {} });
    return ok;
  }
  function has(id){ id = norm(id); return list().some(function(x){ return x.id === id; }); }
  function remove(id){ id = norm(id); return save(list().filter(function(x){ return x.id !== id; })); }
  function toggle(id, c){
    id = norm(id); if (!id) return false;
    var L = list();
    if (L.some(function(x){ return x.id === id; })) { save(L.filter(function(x){ return x.id !== id; })); return false; }
    L.unshift({ id: id, snap: snap(c), added: today() });
    return save(L) ? true : false;
  }
  window.KBWatch = { has: has, toggle: toggle, list: list, remove: remove, snap: snap, save: save, on: function(f){ subs.push(f); } };
})();
