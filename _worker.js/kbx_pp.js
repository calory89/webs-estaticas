// kolaboro.com batch 17 (agent n17d, 8 Nov 2026): permit photo reader.
//   GET /tools/permit-photo/   /<lang>/tools/permit-photo/   (en es de fr nl ru zh ar; Arabic right to left)
// The buyer photographs a permit, licence or company certificate. Text recognition runs in the browser (tesseract.js 5.1.1, WASM,
// pinned on cdn.jsdelivr.net; language data loaded on demand). Candidate register numbers are found with per-market patterns
// (and check digits where the format has one). One tap sends ONLY the chosen number to the existing register lookup
// (/api/kb/lookup in kbx_lookup.js, or /api/x/h/lookup for the Australian ABN). The image and the recognised text never leave the
// device; nothing is stored. No paid AI anywhere: every word on the page is a template below.
// Page shell: /<lang>/how-we-score/ (header, footer, language switcher), the same pattern as kbx_net.js.
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/permit-photo\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const PATH = '/tools/permit-photo/';
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
const TJS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

// ------------------------------------------------------------------------------------------------ strings
const S = TB.kbx_pp_S /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_pp.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const tr = l => { const o = Object.assign({}, S.en, S[l] || {}); o.m = Object.assign({}, S.en.m, (S[l] || {}).m); o.p = Object.assign({}, S.en.p, (S[l] || {}).p); return o; };

// one row per recognised number: market, how one tap works (lookup kind or link), register name and URL (facts, not translated)
const ROWS = [
  ['es_refcat', 'ES', 'live', 'Sede Electrónica del Catastro', 'https://www.sedecatastro.gob.es/'],
  ['es_lic', 'ES', 'ask', null, null],
  ['es_cif', 'ES', 'man', 'BORME (Boletín Oficial del Registro Mercantil)', 'https://www.boe.es/diario_borme/'],
  ['gb_co', 'GB', 'live', 'Companies House', 'https://find-and-update.company-information.service.gov.uk/'],
  ['us_dobnow', 'NYC', 'live', 'NYC Department of Buildings (NYC Open Data)', 'https://opendata.cityofnewyork.us/'],
  ['us_bis', 'NYC', 'live', 'NYC Department of Buildings (NYC Open Data)', 'https://opendata.cityofnewyork.us/'],
  ['us_md', 'MD', 'live', 'Miami-Dade County building permits (open data)', 'https://gis-mdc.opendata.arcgis.com/'],
  ['ae_proj', 'AE', 'key', 'Dubai Land Department, project status', 'https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/'],
  ['ae_oqood', 'AE', 'man', 'Dubai Land Department', 'https://dubailand.gov.ae/en/'],
  ['ae_permit', 'AE', 'man', 'Kolaboro permit QR check (Madmoun QR)', '/tools/permit-check/'],
  ['ae_brn', 'AE', 'man', 'Kolaboro agent licence check (DLD register)', '/tools/agent-check/'],
  ['id_nib', 'ID', 'man', 'OSS (Online Single Submission)', 'https://oss.go.id/'],
  ['id_pbg', 'ID', 'man', 'SIMBG, Ministry of Public Works', 'https://simbg.pu.go.id/'],
  ['id_title', 'ID', 'man', 'BHUMI, ATR/BPN', 'https://bhumi.atrbpn.go.id/'],
  ['th_eia', 'TH', 'man', 'ONEP EIA database', 'https://eia.onep.go.th/'],
  ['th_condo', 'TH', 'man', 'Department of Lands', 'https://www.dol.go.th/'],
  ['au_abn', 'AU', 'live', 'ABN Lookup, Australian Business Register', 'https://abr.business.gov.au/'],
  ['lei', 'WW', 'man', 'GLEIF LEI search', 'https://search.gleif.org/']
];

/* CSS: n40 k17, in /data/i18n/k17s.json */

function body(lang) {
  const t = tr(lang), p = pre(lang);
  const client = { lang, read: t.read, st_load: t.st_load, st_lang: t.st_lang, st_read: t.st_read, st_done: t.st_done, st_none: t.st_none, st_err: t.st_err, st_img: t.st_img, lookup: t.lookup, open: t.open, manual: t.manual, ask: t.ask,
    ck_ok: t.ck_ok, ck_bad: t.ck_bad, fmt: t.fmt, looking: t.looking, r_found: t.r_found, r_not_found: t.r_not_found, r_not_published: t.r_not_published, r_needs_key: t.r_needs_key, r_unavailable: t.r_unavailable,
    raw: t.raw, sealed: t.sealed, rate: t.rate, lk_err: t.lk_err, nf_note: t.nf_note, sent: t.sent, who_town: t.who_town, who_notary: t.who_notary, m: t.m, p: t.p, rows: ROWS };
  const langOpts = [['eng', 'English'], ['spa', 'Español'], ['ara', 'العربية'], ['ind', 'Bahasa Indonesia'], ['tha', 'ไทย'], ['chi_sim', '简体中文'], ['rus', 'Русский'], ['fra', 'Français'], ['deu', 'Deutsch'], ['nld', 'Nederlands']];
  const def = { en: 'eng', es: 'spa', ar: 'ara', zh: 'chi_sim', ru: 'rus', fr: 'fra', de: 'deu', nl: 'nld' }[lang] || 'eng';
  const rows = ROWS.map(r => {
    const act = r[2] === 'live' ? t.act_live.replace('{reg}', r[3]) : r[2] === 'key' ? t.act_key : r[2] === 'ask' ? t.act_ask : t.act_man.replace('{reg}', r[3]);
    return '<tr><td data-label="' + esc(t.th_mk) + '">' + esc(t.m[r[1]]) + '</td><td data-label="' + esc(t.th_no) + '">' + esc(t.p[r[0]]) + '</td><td data-label="' + esc(t.th_do) + '">' + esc(act) + (r[4] ? ' <a class="k-src" href="' + esc(r[4]) + '" rel="noopener">' + esc(r[4].startsWith('/') ? 'kolaboro.com' + r[4] : new URL(r[4]).hostname.replace(/^www\./, '')) + '</a>' : '') + '</td></tr>';
  }).join('');
  return '<div class="kpp" data-kpp data-t="' + esc(JSON.stringify(client)) + '"><div class="k-wrap">' +
    '<header class="k-phead"><nav class="k-crumb" aria-label="Breadcrumb"><a href="' + p + '/">Kolaboro</a> / <a href="/tools/">' + esc(t.crumb_tools) + '</a> / <span aria-current="page">' + esc(t.title) + '</span></nav>' +
    '<h1>' + esc(t.h1) + '</h1><p class="lead">' + esc(t.lead) + '</p>' +
    '<p class="kpp-priv"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span><b>' + esc(t.priv_b) + '</b> ' + esc(t.priv) + '</span></p></header>' +
    '<div class="kpp-grid"><div class="k-stack" style="--k-gap:var(--k-4,16px)">' +
      '<figure class="kpp-fig" id="ppFig"><div class="kpp-empty" id="ppEmpty"><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 18h14M12 24h20M12 30h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg><b>' + esc(t.drop) + '</b><span class="k-small">' + esc(t.drop_help) + '</span></div><canvas id="ppCv" hidden role="img" aria-label="' + esc(t.title) + '"></canvas></figure>' +
      '<div class="kpp-txt k-field" id="ppTxtWrap" hidden><label class="k-label" for="ppTxt">' + esc(t.text_h) + '</label><textarea class="k-textarea" id="ppTxt" spellcheck="false" autocomplete="off"></textarea><p class="k-help">' + esc(t.text_help) + '</p><div><button type="button" class="k-btn k-btn--sm" id="ppAgain">' + esc(t.again) + '</button></div></div>' +
    '</div><div class="kpp-side">' +
      '<div class="kpp-pick"><label class="k-btn">' + esc(t.pick) + '<input type="file" id="ppFile" accept="image/*"></label><label class="k-btn">' + esc(t.cam) + '<input type="file" id="ppCam" accept="image/*" capture="environment"></label></div>' +
      '<div class="k-field"><label class="k-label" for="ppLang">' + esc(t.lang_l) + '</label><select class="k-select" id="ppLang">' + langOpts.map(o => '<option value="' + o[0] + '"' + (o[0] === def ? ' selected' : '') + ' lang="' + ({ eng: 'en', spa: 'es', ara: 'ar', ind: 'id', tha: 'th', chi_sim: 'zh', rus: 'ru', fra: 'fr', deu: 'de', nld: 'nl' })[o[0]] + '">' + esc(o[1]) + '</option>').join('') + '</select><p class="k-help">' + esc(t.lang_help) + '</p></div>' +
      '<div><button type="button" class="k-btn k-btn--primary k-btn--block" id="ppRead" disabled>' + esc(t.read) + '</button></div>' +
      '<div class="k-progress" id="ppProg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden><i style="--v:0%"></i></div>' +
      '<p class="kpp-status" id="ppStatus" aria-live="polite"></p>' +
      '<div class="kpp-samples"><span>' + esc(t.samples) + '</span><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="es">' + esc(t.s_es) + '</button><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="uk">' + esc(t.s_uk) + '</button><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="au">' + esc(t.s_au) + '</button><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="id">' + esc(t.s_id) + '</button><p class="k-xs k-muted" style="margin:0">' + esc(t.sample_note) + '</p></div>' +
      '<section id="ppFound" hidden aria-labelledby="ppFoundH"><h2 id="ppFoundH" style="font-size:var(--k-fs-xl);margin:0 0 4px">' + esc(t.found_h) + '</h2><p class="k-small k-muted" style="margin:0 0 var(--k-3,12px)">' + esc(t.found_help) + '</p><ol class="kpp-list" id="ppList"></ol></section>' +
    '</div></div></div>' +
    '<section class="k-sec--tint kpp-how"><div class="k-wrap"><h2>' + esc(t.how_h) + '</h2>' +
      '<div class="k-table-wrap"><table class="k-table k-table--stack"><thead><tr><th scope="col">' + esc(t.th_mk) + '</th><th scope="col">' + esc(t.th_no) + '</th><th scope="col">' + esc(t.th_do) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="kpp-two"><div><h3>' + esc(t.lim_h) + '</h3><ul><li>' + esc(t.lim1) + '</li><li>' + esc(t.lim2) + '</li><li>' + esc(t.lim3) + '</li><li>' + esc(t.lim4) + '</li><li>' + esc(t.nf_note) + '</li></ul></div>' +
      '<div><h3>' + esc(t.cr_h) + '</h3><p>' + esc(t.cr) + ' <a class="k-src" href="https://github.com/naptha/tesseract.js" rel="noopener">github.com/naptha/tesseract.js</a> <a class="k-src" href="https://github.com/tesseract-ocr/tessdata" rel="noopener">github.com/tesseract-ocr/tessdata</a></p>' +
      '<h3>' + esc(t.rel) + '</h3><div class="kpp-rel"><a class="k-btn k-btn--sm" href="/tools/permit-check/">' + esc(t.rel_qr) + '</a><a class="k-btn k-btn--sm" href="/tools/agent-check/">' + esc(t.rel_agent) + '</a><a class="k-btn k-btn--sm" href="/registers/">' + esc(t.rel_reg) + '</a></div></div></div>' +
    '</div></section></div>';
}

// ------------------------------------------------------------------------------------------------ client (no backticks inside)
const JS = String.raw`(function(){
var R=document.querySelector('[data-kpp]');if(!R)return;var T=JSON.parse(R.getAttribute('data-t'));
var $=function(id){return document.getElementById(id)};
var fig=$('ppFig'),cv=$('ppCv'),cx=cv.getContext('2d'),empty=$('ppEmpty'),btn=$('ppRead'),st=$('ppStatus'),prog=$('ppProg'),list=$('ppList'),found=$('ppFound'),txt=$('ppTxt'),txtW=$('ppTxtWrap'),sel=$('ppLang');
var img=null,words=[],cands=[],worker=null,wlang=null,busy=false;
var ROW={};T.rows.forEach(function(r){ROW[r[0]]=r});
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(s){st.textContent=s||''}
function setProg(v){if(v==null){prog.hidden=true;return}prog.hidden=false;var p=Math.round(v*100);prog.setAttribute('aria-valuenow',p);prog.firstChild.style.setProperty('--v',p+'%')}
function css(n,f){var v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||f}
// ---------- image in ----------
function show(c){img=c;cv.width=c.width;cv.height=c.height;draw();cv.hidden=false;empty.hidden=true;fig.classList.add('has');btn.disabled=false;found.hidden=true;list.innerHTML='';txtW.hidden=true;words=[];cands=[];say('')}
function draw(on){cx.drawImage(img,0,0);if(!cands.length)return;var sea=css('--k-sea','#155C75'),k=Math.max(2,Math.round(img.width/500));
 cands.forEach(function(c,i){if(!c.box)return;var b=c.box,pad=k*2;cx.lineWidth=(on===i?2:1)*k*1.5;cx.strokeStyle=sea;cx.strokeRect(b.x0-pad,b.y0-pad,b.x1-b.x0+pad*2,b.y1-b.y0+pad*2);
  var s=Math.min(64,Math.max(26,Math.round((b.y1-b.y0)*1.1))),lx=b.x0-pad,ly=Math.max(0,b.y0-pad-s);cx.fillStyle=sea;cx.fillRect(lx,ly,s,s);cx.fillStyle='#fff';cx.font='700 '+Math.round(s*.7)+'px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(String(i+1),lx+s/2,ly+s/2+1)})}
function load(file){if(!file)return;if(!/^image\//.test(file.type||'image/')){say(T.st_img);return}
 var done=function(src){var M=2400,w=src.width,h=src.height,s=Math.min(1,M/Math.max(w,h));var c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);c.getContext('2d').drawImage(src,0,0,c.width,c.height);show(c);run()};
 if(window.createImageBitmap){createImageBitmap(file,{imageOrientation:'from-image'}).then(done).catch(function(){viaImg(file,done)})}else viaImg(file,done)}
function viaImg(file,done){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){done(im);URL.revokeObjectURL(u)};im.onerror=function(){say(T.st_img);URL.revokeObjectURL(u)};im.src=u}
['ppFile','ppCam'].forEach(function(id){$(id).addEventListener('change',function(e){load(e.target.files[0]);e.target.value=''})});
fig.addEventListener('dragover',function(e){e.preventDefault();fig.classList.add('over')});fig.addEventListener('dragleave',function(){fig.classList.remove('over')});
fig.addEventListener('drop',function(e){e.preventDefault();fig.classList.remove('over');if(e.dataTransfer.files[0])load(e.dataTransfer.files[0])});
btn.addEventListener('click',function(){run()});
// ---------- samples drawn here (no files, no real people) ----------
var SAMPLES={
 es:['MUESTRA PARA PROBAR - NO ES UN DOCUMENTO REAL','Ayuntamiento de Ejemplo','Licencia de obras n.º 2024/0157','Referencia catastral: 9872023VH5797S0001WX','Uso: residencial'],
 uk:['SAMPLE FOR TESTING - NOT A REAL DOCUMENT','Developer letter footer','Registered in England and Wales','Company number 00445790','Registered office: see Companies House'],
 au:['SAMPLE FOR TESTING - NOT A REAL DOCUMENT','Australian body named on a contract','ABN 51 824 753 556','Public body: Australian Taxation Office'],
 id:['CONTOH UNTUK UJI - BUKAN DOKUMEN ASLI','Nomor Induk Berusaha (NIB) 9120001234567','Nomor PBG: SK-PBG-510301-12032024-001','Sertifikat SHM No. 01234 (contoh)']};
document.querySelectorAll('[data-pp-sample]').forEach(function(b){b.addEventListener('click',function(){var L=SAMPLES[b.getAttribute('data-pp-sample')];
 var c=document.createElement('canvas');c.width=1500;c.height=180+L.length*110;var g=c.getContext('2d');g.fillStyle='#fbfbf7';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#9aa4ab';g.lineWidth=6;g.strokeRect(30,30,c.width-60,c.height-60);
 g.fillStyle='#1b2833';g.textBaseline='top';L.forEach(function(s,i){g.font=(i===0?'600 34px':'500 52px')+' Arial, Helvetica, sans-serif';g.fillStyle=i===0?'#8a2a10':'#1b2833';g.fillText(s,80,90+i*110)});
 show(c);sel.value=b.getAttribute('data-pp-sample')==='es'?'spa':b.getAttribute('data-pp-sample')==='id'?'ind':'eng';run()})});
// ---------- OCR (tesseract.js 5.1.1 from jsDelivr, loaded on first use) ----------
var TJS='${TJS}';
function lib(){return new Promise(function(ok,no){if(window.Tesseract)return ok(window.Tesseract);var s=document.createElement('script');s.src=TJS;s.integrity='sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F';s.crossOrigin='anonymous';s.onload=function(){ok(window.Tesseract)};s.onerror=function(){no(new Error('script'))};document.head.appendChild(s)})}
function langs(){var l=sel.value;return l==='eng'?'eng':'eng+'+l}
function getWorker(){var L=langs();if(worker&&wlang===L)return Promise.resolve(worker);
 var old=worker;worker=null;if(old)old.terminate();say(T.st_load);setProg(0);
 return lib().then(function(Ts){return Ts.createWorker(L.split('+'),1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
  logger:function(m){if(!m)return;if(/loading tesseract core|initializ/i.test(m.status||''))say(T.st_load);else if(/language/i.test(m.status||''))say(T.st_lang);else if(/recogniz/i.test(m.status||''))say(T.st_read);if(typeof m.progress==='number')setProg(m.progress)}})}).then(function(w){worker=w;wlang=L;return w})}
function gray(){var c=document.createElement('canvas');c.width=img.width;c.height=img.height;var g=c.getContext('2d');g.drawImage(img,0,0);var d=g.getImageData(0,0,c.width,c.height),a=d.data;
 for(var i=0;i<a.length;i+=4){var y=a[i]*.299+a[i+1]*.587+a[i+2]*.114;a[i]=a[i+1]=a[i+2]=y}g.putImageData(d,0,0);return c}
function run(){if(!img||busy)return;busy=true;btn.disabled=true;btn.setAttribute('aria-busy','true');
 getWorker().then(function(w){say(T.st_read);return w.recognize(gray())}).then(function(r){var d=r.data||{};words=(d.words||[]).map(function(x){return{t:x.text,b:x.bbox}});txt.value=d.text||'';txtW.hidden=false;find();
 }).catch(function(e){say(T.st_err.replace('{e}',String(e&&e.message||e).slice(0,80)));txtW.hidden=false}).then(function(){busy=false;btn.disabled=false;btn.removeAttribute('aria-busy');setProg(null)})}
$('ppAgain').addEventListener('click',function(){find()});
// ---------- patterns ----------
function digits(s){return s.replace(/[٠-٩]/g,function(c){return c.charCodeAt(0)-1632}).replace(/[۰-۹]/g,function(c){return c.charCodeAt(0)-1776}).replace(/[๐-๙]/g,function(c){return c.charCodeAt(0)-3664})}
function abnOk(s){if(!/^\d{11}$/.test(s))return false;var w=[10,1,3,5,7,9,11,13,15,17,19],t=0;for(var i=0;i<11;i++)t+=((i?+s[i]:+s[i]-1))*w[i];return t%89===0}
function mod97(s){var r=0;for(var i=0;i<s.length;i++){var c=s[i],v=/\d/.test(c)?c:String(c.charCodeAt(0)-55);for(var j=0;j<v.length;j++)r=(r*10+ +v[j])%97}return r}
function leiOk(s){return /^[0-9A-Z]{18}\d{2}$/.test(s)&&mod97(s)===1}
function cifOk(s){var m=/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(s);if(!m)return false;var d=m[2],a=0,b=0;for(var i=0;i<7;i++){var n=+d[i];if(i%2===0){n*=2;a+=Math.floor(n/10)+n%10}else b+=n}
 var c=(10-(a+b)%10)%10,L='JABCDEFGHI'[c];if(/[ABEH]/.test(m[1]))return m[3]===String(c);if(/[KPQSNW]/.test(m[1]))return m[3]===L;return m[3]===String(c)||m[3]===L}
var P=[
 ['es_refcat',/\b(\d{7})\s?([A-Z]{2}\d{4}[A-Z])\s?(\d{4})\s?([A-Z]{2})\b/g,function(m){return m[1]+m[2]+m[3]+m[4]}],
 ['es_refcat',/\b(\d{7}[A-Z]{2}\d{4}[A-Z])\b(?!\s?\d{4}\s?[A-Z]{2})/g,function(m){return m[1]}],
 ['es_lic',/licencia(?:\s+de\s+obras?|\s+urban[ií]stica|\s+municipal)?[^\n]{0,14}?\b(\d[\dA-Z\/.\-]{2,24})/gi,function(m){var v=m[1].replace(/[.\-\/]+$/,'');return (v.match(/\d/g)||[]).length>=3?v:null}],
 ['es_cif',/\b(?:C\.?I\.?F\.?|N\.?I\.?F\.?)\s*[:.]?\s*([A-HJNP-SUVW])[\s\-]?(\d{7})([0-9A-J])\b/gi,function(m){return (m[1]+m[2]+m[3]).toUpperCase()},cifOk],
 ['gb_co',/(?:company\s+(?:registration\s+)?(?:number|no\.?)|registered\s+number|registration\s+number|companies\s+house(?:\s+number)?|\bcrn\b)\s*[:.#]?\s*((?:SC|NI|OC|SO|NC|LP|SL|NL|FC|SF|R0)\d{6}|\d{6,8})\b/gi,function(m){var v=m[1].toUpperCase();return /^\d+$/.test(v)?('00000000'+v).slice(-8):v}],
 ['us_dobnow',/\b([BMQSXR]\d{8}-[A-Z]\d{1,2})\b/g,function(m){return m[1]}],
 ['us_bis',/(?:\bjob|\bDOB|\bNB|\bA1|\bA2)\b[^\d\n]{0,20}\b([1-5]\d{8})\b/gi,function(m){return m[1]}],
 ['us_md',/(?:permit|process)[^\d\n]{0,20}\b(20\d{8})\b/gi,function(m){return m[1]}],
 ['ae_proj',/(?:(?:rera|dld)\s+)?project\s*(?:no|number|id|registration(?:\s+no)?)\.?\s*[:#.]?\s*(\d{3,5})\b|رقم\s*المشروع\s*[:.]?\s*(\d{3,5})/gi,function(m){return m[1]||m[2]}],
 ['ae_oqood',/(?:oqood|interim\s+(?:real\s+estate\s+)?registration|أوقود|اوقود)[^A-Z0-9\n]{0,20}([A-Z0-9][A-Z0-9\-\/]{3,20})/gi,function(m){return /\d/.test(m[1])?m[1]:null}],
 ['ae_permit',/(?:trakheesi|madmoun|advertis(?:ing|ement)\s+permit|ترخيصي)[^\d\n]{0,20}(\d{6,12})\b/gi,function(m){return m[1]}],
 ['ae_brn',/\b(BRN|ORN)\s*[:.#]?\s*(\d{3,6})\b/g,function(m){return m[1]+' '+m[2]}],
 ['id_nib',/\bNIB\b[^\d\n]{0,25}(\d{13})\b/gi,function(m){return m[1]}],
 ['id_pbg',/\b((?:SK[\-\s]?)?PBG[\-\s]\d[\dA-Z\-\.\/]{8,40})/gi,function(m){return m[1].toUpperCase().replace(/\s/g,'-').replace(/[\-.\/]+$/,'')}],
 ['id_title',/\b(SHM|SHGB|HGB|HGU|SHP|Hak\s+Pakai)\b[^\d\n]{0,15}(\d[\d.\/\-]{1,20})/gi,function(m){return m[1].toUpperCase()+' '+m[2].replace(/[.\-\/]+$/,'')}],
 ['th_eia',/(ทส\s?\d{4}(?:\.\d{1,2})*\s?\/\s?\d{1,6})/g,function(m){return m[1].replace(/\s/g,'')}],
 ['th_condo',/(?:ทะเบียนอาคารชุด(?:\s*เลขที่)?|condominium\s+registration\s+(?:no\.?|number))\s*[:.]?\s*(\d{1,4}\/\d{4})/gi,function(m){return m[1]}],
 ['au_abn',/\bABN\b\s*[:.#]?\s*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/g,function(m){return m[1].replace(/\s/g,'')},abnOk],
 ['lei',/\bLEI\b[^0-9A-Z\n]{0,12}([0-9A-Z]{18}\d{2})\b/g,function(m){return m[1]},leiOk]];
function find(){var s=digits(txt.value||'');cands=[];var seen={};
 P.forEach(function(p){var re=p[1],m;re.lastIndex=0;while((m=re.exec(s))){var v=p[2](m);if(!v)continue;var k=p[0]+'|'+v;if(seen[k])continue;
  if(p[0]==='es_refcat'&&cands.some(function(c){return c.type==='es_refcat'&&c.v.indexOf(v)===0}))continue;seen[k]=1;
  var ck=p[3]?(p[3](v)?'ok':'bad'):null;cands.push({type:p[0],v:v,ck:ck,box:box(v)});if(cands.length>=12)break}});
 render();draw();var n=cands.length;say(n?T.st_done.replace('{n}',n):T.st_none);found.hidden=!n}
function norm(s){return digits(String(s||'')).toUpperCase().replace(/[^0-9A-Z฀-๿]/g,'')}
function box(v){var nv=norm(v);if(nv.length<3)return null;var W=words.map(function(w){return{n:norm(w.t),b:w.b}}),U=function(a,x){return a?{x0:Math.min(a.x0,x.x0),y0:Math.min(a.y0,x.y0),x1:Math.max(a.x1,x.x1),y1:Math.max(a.y1,x.y1)}:{x0:x.x0,y0:x.y0,x1:x.x1,y1:x.y1}};
 for(var i=0;i<W.length;i++){if(!W[i].n)continue;if(W[i].n.length>=4&&W[i].n.indexOf(nv)>=0)return U(null,W[i].b);var c='',b=null;for(var j=i;j<W.length&&j<i+6;j++){c+=W[j].n;b=U(b,W[j].b);if(c===nv)return b;if(nv.indexOf(c)!==0)break}}return null}
// ---------- list + one-tap lookup ----------
function link(u){return u.charAt(0)==='/'?u:u}
function render(){list.innerHTML=cands.map(function(c,i){var r=ROW[c.type],live=r[2]==='live'||r[2]==='key';
 var meta='<span class="k-badge k-badge--plain">'+esc(T.m[r[1]])+'</span>'+(c.ck==='ok'?'<span class="k-badge k-badge--ok">'+esc(T.ck_ok)+'</span>':c.ck==='bad'?'<span class="k-badge k-badge--warn">'+esc(T.ck_bad)+'</span>':'<span class="k-badge k-badge--plain">'+esc(T.fmt)+'</span>');
 var act='';if(live)act+='<button type="button" class="k-btn k-btn--sm" data-lk="'+i+'"'+(c.ck==='bad'?' aria-describedby="ppck'+i+'"':'')+'>'+esc(T.lookup)+'</button>';
 if(r[2]==='ask')act+='<p class="k-small" style="margin:0">'+esc(T.ask.replace('{who}',T.who_town))+'</p>';
 else if(!live){var u=r[4];if(c.type==='lei')u='https://search.gleif.org/#/record/'+encodeURIComponent(c.v);act+='<p class="k-small" style="margin:0;width:100%">'+esc(T.manual)+'</p><a class="k-btn k-btn--sm k-btn--ghost" href="'+esc(link(u))+'" rel="noopener"'+(u.charAt(0)==='/'?'':' target="_blank"')+'>'+esc(r[3])+'</a>';if(c.type==='id_title')act+='<p class="k-small" style="margin:0;width:100%">'+esc(T.ask.replace('{who}',T.who_notary))+'</p>'}
 else act+='<a class="k-btn k-btn--sm k-btn--ghost" href="'+esc(r[4])+'" target="_blank" rel="noopener">'+esc(T.open)+'</a>';
 return '<li class="kpp-item" data-i="'+i+'"><div class="kpp-ih"><span class="kpp-n" aria-hidden="true">'+(i+1)+'</span><div><span class="kpp-k">'+esc(T.p[c.type])+'</span><span class="kpp-v" dir="ltr">'+esc(c.v)+'</span><div class="kpp-meta" id="ppck'+i+'">'+meta+'</div></div></div><div class="kpp-act">'+act+'</div><div class="kpp-res" aria-live="polite"></div></li>'}).join('');
 list.querySelectorAll('.kpp-item').forEach(function(li){var i=+li.getAttribute('data-i');li.addEventListener('mouseenter',function(){mark(i)});li.addEventListener('focusin',function(){mark(i)})});
 list.querySelectorAll('[data-lk]').forEach(function(b){b.addEventListener('click',function(){lookup(+b.getAttribute('data-lk'),b)})})}
function mark(i){list.querySelectorAll('.kpp-item').forEach(function(li){li.classList.toggle('on',+li.getAttribute('data-i')===i)});if(img)draw(i)}
function req(c){if(c.type==='au_abn')return{h:'/api/x/h/lookup?register=au-abn&q='+encodeURIComponent(c.v)};
 var b={};if(c.type==='es_refcat')b.refcat=c.v;else if(c.type==='gb_co'){b.q='company number '+c.v;b.country='GB'}else if(c.type==='ae_proj'){b.permit=c.v;b.country='AE'}else b.permit=c.v;return{lk:b}}
var SB={found:'ok',not_found:'plain',not_published:'plain',needs_key:'info',unavailable:'warn'};
function badge(s){return '<span class="k-badge k-badge--'+(SB[s]||'plain')+'">'+esc(T['r_'+s]||s)+'</span>'}
function host(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u}}
function fields(f){var o='';Object.keys(f||{}).forEach(function(k){var v=f[k];if(k==='found'||v==null||v===''||typeof v==='object'&&!Array.isArray(v))return;if(Array.isArray(v)){if(!v.length||typeof v[0]==='object')return;v=v.join(', ')}
 o+='<dt>'+esc(k.replace(/_/g,' ').replace(/^./,function(c){return c.toUpperCase()}))+'</dt><dd>'+esc(String(v).slice(0,200))+'</dd>'});return o?'<dl class="k-ledger">'+o+'</dl>':''}
function chk(c){var links='';if(c.source_url)links+='<a class="k-src" href="'+esc(c.official_page||c.source_url)+'" target="_blank" rel="noopener">'+esc(host(c.official_page||c.source_url))+'</a> ';if(c.manual_check)links+='<a class="k-src" href="'+esc(c.manual_check)+'" target="_blank" rel="noopener">'+esc(host(c.manual_check))+'</a> ';
 if(c.snapshot&&c.snapshot.raw_url)links+='<a class="k-src" href="'+esc(c.snapshot.raw_url)+'" target="_blank" rel="noopener">'+esc(T.raw)+'</a>';
 return '<div class="kpp-chk"><h4>'+badge(c.status)+'<span>'+esc(c.source)+'</span></h4>'+fields(c.fields)+(c.note?'<p>'+esc(c.note)+'</p>':'')+'<p>'+links+'</p></div>'}
function lookup(i,b){var c=cands[i],li=b.closest('.kpp-item'),out=li.querySelector('.kpp-res'),q=req(c);b.disabled=true;b.innerHTML='<span class="k-spin"></span> '+esc(T.looking);
 var p=q.h?fetch(q.h,{headers:{accept:'application/json'}}):fetch('/api/kb/lookup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(q.lk)});
 p.then(function(r){if(r.status===429)throw new Error('rate');return r.json()}).then(function(d){var h='';
  if(q.h){var res=d.result||{},s=res.found?'found':res.found===false?'not_found':'unavailable';
   h=chk({status:s,source:d.register_name||'ABN Lookup',source_url:d.url,fields:res.found?res:{},note:d.error||null,snapshot:d.sha256?{raw_url:'/api/x/h/archive/'+d.sha256+'?raw=1'}:null})}
  else{(d.checks||[]).forEach(function(x){h+=chk(x)});if(d.seal&&d.seal.result_url)h+='<p class="k-small"><a class="k-src" href="'+esc(d.seal.result_url)+'" target="_blank" rel="noopener">'+esc(T.sealed)+'</a> <span class="k-hash"><code>sha256:'+esc(d.seal.root_sha256.slice(0,16))+'…</code></span></p>';if(!h)h='<p>'+esc(T.lk_err)+'</p>'}
  out.innerHTML='<div class="k-card k-card--sunken" style="padding:var(--k-3,12px)">'+h+'<p class="k-xs k-muted" style="margin:8px 0 0">'+esc(T.sent)+' '+esc(T.nf_note)+'</p></div>';b.remove()
 }).catch(function(e){out.innerHTML='<div class="k-alert k-alert--warn" role="status"><span>'+esc(e&&e.message==='rate'?T.rate:T.lk_err)+'</span></div>';b.disabled=false;b.textContent=T.lookup})}
})();`;

async function assemble(shellRes, lang) {
  const t = tr(lang), path = PATH, url = ORIGIN + pre(lang) + path;
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', name: 'Kolaboro ' + t.title, url, description: t.desc, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@type': 'BreadcrumbList', itemListElement: [['Kolaboro', ORIGIN + pre(lang) + '/'], [t.crumb_tools, ORIGIN + '/tools/'], [t.title, url]].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) }] };
  const tags = '<title>' + esc(t.title) + ' | Kolaboro</title><meta name="description" content="' + esc(t.desc) + '"><link rel="canonical" href="' + url + '">' + alts +
    TB.kbx_pp__s.k0 + esc(t.title) + ' | Kolaboro"><meta property="og:description" content="' + esc(t.desc) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + TB.kbx_pp__s.CSS;
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on(TB.kbx_pp__s.k1, { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setAttribute('data-clarity-mask', 'True'); e.setInnerContent(body(lang) + '<script>' + JS + '</script>', { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}

export async function handle(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/permit-photo(\/?)$/); if (!m) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  const sh = await shell(pre(lang) + '/how-we-score/');
  if (!sh || sh.status !== 200) return null;
  return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
