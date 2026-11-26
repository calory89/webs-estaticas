// n40 k12: "use this project" for the buyer tools. Reads ?project=<slug>, loads the public record
// (/projects/<slug>/record.json) and fills the price, currency, promised handover date and market of the tool form.
// With data-url="1" it also keeps every field of the form in the address, so a shared link restores the result.
// Config: <script src="/tools/use-project.js" data-form="dcF" data-p="dcP" data-c="dcC" data-d="dcD1" data-m="lhM" data-mk="lh|rx" data-url="1" defer>
(function(){
  'use strict';
  var me = document.currentScript; if (!me) return;
  var cfg = me.dataset, F = document.getElementById(cfg.form); if (!F) return;
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: ['Filled from the public record of', 'handover date on record', 'taken as', 'starting price', 'Check every figure against your own contract.', 'The record of this project did not load, so nothing was filled in.'],
    es: ['Rellenado con el registro público de', 'fecha de entrega registrada', 'tomada como', 'precio inicial', 'Compruebe cada cifra con su propio contrato.', 'El registro de este proyecto no se cargó, así que no se rellenó nada.'],
    fr: ['Rempli à partir de la fiche publique de', 'date de livraison au dossier', 'prise comme', 'prix de départ', 'Vérifiez chaque chiffre avec votre propre contrat.', 'La fiche de ce projet ne s’est pas chargée, rien n’a été rempli.'],
    de: ['Ausgefüllt aus dem öffentlichen Datensatz von', 'Übergabetermin laut Datensatz', 'angenommen als', 'Einstiegspreis', 'Prüfen Sie jede Zahl anhand Ihres eigenen Vertrags.', 'Der Datensatz dieses Projekts wurde nicht geladen, daher wurde nichts ausgefüllt.'],
    nl: ['Ingevuld vanuit het openbare dossier van', 'opleverdatum in het dossier', 'genomen als', 'vanafprijs', 'Controleer elk cijfer met uw eigen contract.', 'Het dossier van dit project is niet geladen, dus er is niets ingevuld.'],
    ru: ['Заполнено по открытой записи проекта', 'срок сдачи в записи', 'принят как', 'начальная цена', 'Сверьте каждую цифру со своим договором.', 'Запись этого проекта не загрузилась, поэтому ничего не заполнено.'],
    zh: ['已根据以下项目的公开记录填写：', '记录中的交付日期', '按', '起价', '请用您自己的合同核对每个数字。', '该项目的记录未能加载，因此没有填写任何内容。'],
    ar: ['تمت التعبئة من السجل العام لمشروع', 'موعد التسليم في السجل', 'محسوب على أنه', 'السعر الابتدائي', 'تحقق من كل رقم مقابل عقدك.', 'لم يُحمَّل سجل هذا المشروع، لذلك لم تتم تعبئة أي شيء.']
  }[lang] || null;
  var S = T || ['Filled from the public record of', 'handover date on record', 'taken as', 'starting price', 'Check every figure against your own contract.', 'The record of this project did not load, so nothing was filled in.'];
  var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var slug = String(q.get('project') || ''); if (!/^[a-z0-9-]{1,120}$/.test(slug)) slug = '';
  var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };
  var $ = function(i){ return i ? (document.getElementById(i) || (F.elements[i] && F.elements[i].tagName ? F.elements[i] : null)) : null; };
  function fire(){ try { if (cfg.fire === 'each') { [cfg.p, cfg.d, cfg.c].forEach(function(i){ var e = $(i); if (e) e.dispatchEvent(new Event('input', { bubbles: true })); }); return; } F.dispatchEvent(new Event('input', { bubbles: true })); F.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }   // n40 k14: data-fire="each" for tools that listen on each field (payment risk)
  function setSel(el, v){ if (el && Array.prototype.some.call(el.options, function(o){ return o.value === v; })) { el.value = v; return true; } return false; }
  // a handover written as 2029-05 or 2025-Q3 is taken as the last day of that month or quarter
  function hoDate(v){
    var m = /^(\d{4})-(\d{2})$/.exec(v), y, mo;
    if (m) { y = +m[1]; mo = +m[2]; }
    else if ((m = /^(\d{4})-Q([1-4])$/.exec(v))) { y = +m[1]; mo = +m[2] * 3; }
    else if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v))) return v;
    else if ((m = /^(\d{4})$/.exec(v))) { y = +m[1]; mo = 12; }
    else return null;
    var d = new Date(Date.UTC(y, mo, 0)); return d.toISOString().slice(0, 10);
  }
  function mkCode(kind, co, mk){
    if (kind === 'rx') return mk === 'Dubai' ? 'dubai' : 'other';
    if (/emirates|uae/i.test(co) && mk === 'Dubai') return 'AE-DU';
    return { Spain: 'ES', Portugal: 'PT', Indonesia: 'ID', Thailand: 'TH' }[co] || 'OTHER';
  }
  // ---- address state (only for tools that do not keep it themselves)
  var keep = cfg.url === '1', tm;
  function fields(){ return Array.prototype.filter.call(F.elements, function(e){ return (e.id || e.name) && e.type !== 'button' && e.type !== 'submit'; }); }
  function write(){
    clearTimeout(tm); tm = setTimeout(function(){
      try {
        var u = new URLSearchParams(); if (slug) u.set('project', slug);
        fields().forEach(function(e){
          if (e.type === 'radio') { if (e.checked) u.set(e.name, e.value); }
          else if (e.type === 'checkbox') u.set(e.id || e.name, e.checked ? '1' : '0');
          else if ((e.id || e.name) && e.value !== '') u.set(e.id || e.name, e.value);
        });
        history.replaceState(null, '', location.pathname + '?' + u.toString() + location.hash);
      } catch (e) {}
    }, 250);
  }
  function read(){
    var n = 0;
    fields().forEach(function(e){
      if (e.type === 'radio') { var v = q.get(e.name); if (v != null) { e.checked = e.value === v; n++; } }
      else if (e.type === 'checkbox') { var c = q.get(e.id || e.name); if (c != null) { e.checked = c === '1'; n++; } }
      else if (q.has(e.id || e.name)) { var w = String(q.get(e.id || e.name)).slice(0, 200); if (e.tagName === 'SELECT') setSel(e, w); else e.value = w; n++; }
    });
    return n;
  }
  function note(html, bad){
    var p = document.createElement('p'); p.className = 'ki kup-note'; p.setAttribute('role', 'status');
    p.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#D8DEDB);background:var(--bg-2,#F4F7F5)' + (bad ? ';border-color:#B3261E' : '');
    p.innerHTML = html; F.parentNode.insertBefore(p, F);
  }
  function fill(r){
    var facts = {}; (r.facts || []).forEach(function(f){ facts[f.field] = f; });
    var bits = [], pr = facts.pr && String(facts.pr.value || ''), ho = facts.ho && String(facts.ho.value || '');
    var pm = pr && /^([A-Z]{3})\s*([\d.,]+)/.exec(pr);
    if (pm) {
      var amt = parseFloat(pm[2].replace(/,/g, ''));
      if (cfg.c ? setSel($(cfg.c), pm[1]) : true) { if ($(cfg.p) && amt > 0) $(cfg.p).value = /,/.test($(cfg.p).value) ? amt.toLocaleString('en') : String(amt); }
      bits.push(S[3] + ' <bdi dir="ltr">' + esc(pr) + '</bdi>');
    }
    var d = ho && hoDate(ho);
    if (d && $(cfg.d)) { $(cfg.d).value = d; bits.push(S[1] + ' <bdi dir="ltr">' + esc(ho) + '</bdi>' + (d !== ho ? ' (' + S[2] + ' <bdi dir="ltr">' + d + '</bdi>)' : '')); }
    else if (ho) bits.push(S[1] + ' <bdi dir="ltr">' + esc(ho) + '</bdi>');
    if (cfg.m) setSel($(cfg.m), mkCode(cfg.mk, q.get('co') || '', r.market || ''));
    var pre = lang === 'en' ? '' : '/' + lang;
    note(S[0] + ' <a href="' + pre + '/projects/' + esc(slug) + '/">' + esc(r.name || slug) + '</a> (' + esc(r.market || '') + ')' + (bits.length ? ': ' + bits.join(lang === 'ar' ? '؛ ' : lang === 'zh' ? '；' : '; ') : '') + '. ' + S[4]);
    fire();
  }
  function start(){
    var restored = keep ? read() : 0;
    if (restored) fire();
    if (keep) { F.addEventListener('input', write); F.addEventListener('change', write); }
    if (!slug) return;
    if (restored && cfg.p && q.has(cfg.p)) { note(S[0] + ' <a href="' + (lang === 'en' ? '' : '/' + lang) + '/projects/' + esc(slug) + '/">' + esc(slug) + '</a>. ' + S[4]); return; }
    fetch('/projects/' + slug + '/record.json').then(function(x){ if (!x.ok) throw 0; return x.json(); }).then(fill).catch(function(){ note(esc(S[5]), true); });
  }
  // wait until the tool has built its own selects (late handover loads its data first)
  // this script runs before the tool's own script (it must read the address before the tool rewrites it), so it starts
  // once every deferred script has run, and for late handover once its data has built the selects
  var tries = 0;
  function wait(){ var ready = !cfg.wait || ($(cfg.wait) && $(cfg.wait).options.length > 0); if (ready || tries++ > 80) start(); else setTimeout(wait, 100); }
  // deferred scripts run while readyState is already 'interactive', before DOMContentLoaded, so wait for that event
  if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', function(){ setTimeout(wait, 0); }); else setTimeout(wait, 0);
})();
