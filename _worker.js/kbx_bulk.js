// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
export const PATHS = /^\/bulk-check\/?$|^\/api\/kb\/bulk\/?$/;
const MAX_BATCH = 5, MAX_ROWS = 200;
function out(o, s, extra) { return new Response(JSON.stringify(o), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'x-api-key, content-type', 'access-control-allow-methods': 'POST, OPTIONS' }, extra || {}) }); }
const TYPE = { es_refcat: 'Spanish cadastral reference', nyc_bis_job: 'NYC DOB job number', nyc_dobnow_job: 'NYC DOB NOW job', miami_dade_permit: 'Miami-Dade permit', uk_company_number: 'UK company number' };
function flat(f, n) {
const o = [];
for (const [k, v] of Object.entries(f || {})) {
if (v == null || v === '' || k === 'identifiers_found') continue;
if (Array.isArray(v)) { if (v.length) o.push(k + ': ' + v.length + (typeof v[0] === 'object' ? ' items' : ' (' + v.slice(0, 3).join(', ') + ')')); continue; }
if (typeof v === 'object') continue;
o.push(k + ': ' + String(v).slice(0, 80));
}
return o.join('; ').slice(0, n || 400);
}
function row(q, d, status) {
  if (!d || !d.checks) return { q, status, error: d && d.error || status };
  const ids = (d.detected && d.detected.identifiers) || [], types = [...new Set(ids.map(x => TYPE[x.type] || x.type))];
  const checks = d.checks.map(c => ({ id: c.id, source: c.source, status: c.status, note: c.note ? String(c.note).slice(0, 200) : null, source_url: c.source_url || null, facts: c.status === 'found' ? flat(c.fields) : '', manual_check: c.manual_check || null }));
  const kind = types.length ? types.join(', ') : checks.some(c => /^us_nyc_address/.test(c.id)) ? 'NYC address' : checks.some(c => /^us_miami/.test(c.id)) ? 'Miami-Dade address' : checks.some(c => /gleif/.test(c.id)) ? 'Company name' : 'Not recognised';
  return { q, status: 'done', kind, countries: (d.detected && d.detected.countries) || [], summary: d.summary, checks, cached: !!d.cached, result_url: d.seal ? d.seal.result_url : null, root_sha256: d.seal ? d.seal.root_sha256 : null, at: d.finished_at || d.started_at || null };
}
async function bulk(req, env, ctx, lookupHandle) {
let b; try { b = await req.json(); } catch (e) { return out({ error: 'bad_request', need: '{"rows":[{"q":"..."}]}' }, 400); }
const rows = (b && Array.isArray(b.rows) ? b.rows : []).slice(0, MAX_BATCH + 1);
if (!rows.length) return out({ error: 'empty', need: TB.kbx_bulk__t.k0, max_rows_per_call: MAX_BATCH }, 400);
if (rows.length > MAX_BATCH) return out({ error: 'too_many', max_rows_per_call: MAX_BATCH, note: 'Send up to ' + MAX_ROWS + ' rows in batches of ' + MAX_BATCH + TB.kbx_bulk__t.k1 }, 400);
const key = req.headers.get('x-api-key') || '', ip = req.headers.get('cf-connecting-ip') || 'x';
if (key && !/^kb_pilot_[0-9a-f]{40}$/.test(key)) return out({ error: 'invalid_key', how: 'https://kolaboro.com/api-pilot' }, 401);
const results = [], t0 = Date.now(); let stop = null;
for (const r of rows) {
const q = String((r && (r.q || r.ref)) || '').replace(/\s+/g, ' ').trim().slice(0, 300), country = String((r && r.country) || '').trim().toUpperCase().slice(0, 2);
if (!q) { results.push({ q, status: 'skipped', error: 'empty row' }); continue; }
if (/https?:\/\/|www\./i.test(q)) { results.push({ q, status: 'skipped', error: TB.kbx_bulk__t.k2 }); continue; }
if (stop) { results.push({ q, status: stop }); continue; }
const p = new URLSearchParams({ q, ai: '0' }); if (/^[A-Z]{2}$/.test(country)) p.set('country', country);
const path = key ? '/api/v1/lookup' : '/api/kb/lookup', h = { accept: 'application/json', 'cf-connecting-ip': ip, 'user-agent': 'kolaboro-bulk' }; if (key) h['x-api-key'] = key;
const sub = new Request('https://kolaboro.com' + path + '?' + p, { method: 'GET', headers: h });
let res, d; try { res = await lookupHandle(sub, new URL(sub.url), env, ctx); d = await res.json(); } catch (e) { results.push({ q, status: 'error', error: 'lookup failed' }); continue; }
if (res.status === 429) { stop = 'rate_limited'; results.push({ q, status: 'rate_limited', error: d && (d.limit || d.error) }); continue; }
if (res.status === 401) { results.push({ q, status: 'key_error', error: d && d.error }); stop = 'key_error'; continue; }
results.push(row(q, d, res.ok ? 'done' : 'error'));
}
return out({ version: 'kolaboro-bulk-1', mode: key ? 'api_key' : 'public', limit: key ? 'metered on your API key' : TB.kbx_bulk__t.k3, rows: results, ms: Date.now() - t0,
disclaimer: TB.kbx_bulk__s.k0 });
}
const CSS = '<style id="kbulk-css">.kb-wrap{padding:8px 0 48px}.kb-box{border:2px solid var(--ink);border-radius:18px;padding:16px 18px;margin:18px 0;background:var(--card,var(--paper))}.kb-box h2{margin:0 0 8px;font-size:1.25rem}.kb-box textarea{width:100%;min-height:150px;font:14px/1.45 ui-monospace,monospace;padding:10px;border:1px solid var(--field-line,var(--line));border-radius:10px;background:var(--paper);color:var(--ink);box-sizing:border-box}' +
'.kb-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:12px}.kb-row label{font-weight:600}.kb-row input[type=password],.kb-row input[type=text]{min-height:44px;padding:0 12px;border:1px solid var(--field-line,var(--line));border-radius:10px;background:var(--paper);color:var(--ink);font-size:15px;min-width:0;flex:1 1 220px}.kb-file{min-height:44px}' +
'.kb-row .btn{min-height:44px;width:auto}.kb-note{color:var(--muted);font-size:.9rem;margin:8px 0 0;max-width:80ch}.kb-bar{height:10px;border-radius:99px;background:var(--line);overflow:hidden;margin:10px 0}.kb-bar i{display:block;height:100%;width:0;background:var(--hivis,#FF5B14);transition:width .3s}' +
'.kb-tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:12px 0}.kb-tw table{width:100%;border-collapse:collapse;font-size:.9rem;min-width:640px}.kb-tw th,.kb-tw td{text-align:start;vertical-align:top;padding:8px;border-bottom:1px solid var(--line);overflow-wrap:anywhere}.kb-tw thead th{font-size:.76rem;text-transform:uppercase;color:var(--muted)}' +
'.kb-pill{display:inline-block;font-size:.76rem;font-weight:700;padding:1px 8px;border-radius:99px;border:1px solid var(--line);margin:0 4px 4px 0;white-space:nowrap}.kb-found{background:var(--ok-bg,#DDEFE7);color:var(--ok,#0B7A55)}.kb-warn{background:var(--warn-bg,#FFF0C7);color:var(--warn,#9A6400)}.kb-msg{font-weight:600;min-height:1.4em}@media(max-width:640px){.kb-tw table{min-width:0}.kb-tw thead{display:none}.kb-tw tr{display:block;border-bottom:1px solid var(--line);padding:10px 0}.kb-tw td{display:block;border:0;padding:3px 0}.kb-tw td:first-child{font-weight:700;color:var(--muted)}.kb-tw td:nth-child(2){font-weight:700}.kb-pill{white-space:normal;max-width:100%}}.kb-ex{font:13px ui-monospace,monospace;background:var(--paper);border:1px dashed var(--line);border-radius:10px;padding:8px 10px;white-space:pre-wrap;overflow-wrap:anywhere}</style>';
const BODY = '<section class="phero"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / <a href="/registers/">Registers</a></p><h1>Bulk register check</h1>' +
'<p class="lead">For agencies and lenders: check up to 200 properties, permits or companies at once against the official registers we query live, and download the results as CSV. Register lookups only, fixed rules, each result sealed with a hash.</p></div></section>' +
'<div class="wrap kb-wrap"><div class="kb-box"><h2>1. Your list</h2><p class="kb-note">One item per line, or a CSV file with one item per row. A last column holding a two-letter country code (ES, US, GB) is used as the country; other columns are read as part of the item, so keep one item per row. A header row is skipped. Accepted: Spanish cadastral references (14 or 20 characters), NYC street addresses with the borough, NYC DOB or DOB NOW job numbers, Miami-Dade permit numbers, UK company numbers, company names (searched in GLEIF). Website links are not checked in bulk. Have project names, developer names or website links instead? Use the <a href="/tools/bulk-check/">bulk check against our index</a>.</p>' +
'<label for="kb-in" class="kb-note">Paste here</label><textarea id="kb-in" spellcheck="false" placeholder="9872023VH5797S0001WX\n350 5th Ave, Manhattan, New York\nM01332356-I1\nMetrovacesa SA"></textarea>' +
'<div class="kb-row"><label for="kb-file">or upload a .csv</label><input id="kb-file" class="kb-file" type="file" accept=".csv,.txt,text/csv,text/plain"></div><p class="kb-note" id="kb-count" aria-live="polite"></p></div>' +
'<div class="kb-box"><h2>2. Limits</h2><p class="kb-note">Without a key: 20 lookups an hour per visitor, the same limit as the single lookup (an item checked in the last 10 minutes comes from cache and does not count). The check pauses when the limit is reached and you can resume later. With a partner API key every row is metered on your key instead. <a href="/api-pilot/">Ask for a key</a>. The key stays in this page and is sent only to kolaboro.com.</p>' +
'<div class="kb-row"><label for="kb-key">API key (optional)</label><input id="kb-key" type="password" autocomplete="off" placeholder="kb_pilot_..."></div></div>' +
'<div class="kb-box"><h2>3. Results</h2><div class="kb-row"><button type="button" class="btn btn-hi" id="kb-go">Check the list</button><button type="button" class="btn btn-line" id="kb-stop" hidden>Pause</button><button type="button" class="btn btn-line" id="kb-csv" disabled>Download CSV</button></div>' +
'<div class="kb-bar" aria-hidden="true"><i id="kb-bar"></i></div><p class="kb-msg" id="kb-msg" role="status" aria-live="polite"></p><div class="kb-tw"><table><thead><tr><th>#</th><th>Item</th><th>Recognised as</th><th>Register results</th><th>Sealed result</th></tr></thead><tbody id="kb-out"></tbody></table></div>' +
'<p class="kb-note">Each result is what the named official register returned at that moment, kept byte for byte and sealed. Not found or not published is not proof of a problem; found is not proof a project is sound. For one project with its website, use the <a href="/check/">free check</a>.</p></div>' +
'<div class="kb-box"><h2>API</h2><p class="kb-note">Same thing without the page: POST up to 5 rows per call.</p><div class="kb-ex">curl -s https://kolaboro.com/api/kb/bulk -H "content-type: application/json" \\\n  -H "x-api-key: kb_pilot_..." -d \'{"rows":[{"q":"9872023VH5797S0001WX"},{"q":"350 5th Ave, Manhattan, New York"}]}\'</div></div></div>';
const JS = "(function(){var $=function(i){return document.getElementById(i);},inp=$('kb-in'),file=$('kb-file'),cnt=$('kb-count'),go=$('kb-go'),stopB=$('kb-stop'),csvB=$('kb-csv'),bar=$('kb-bar'),msg=$('kb-msg'),tb=$('kb-out'),key=$('kb-key');var rows=[],res=[],running=false,paused=false,MAX=200;" +
"function parseCSV(t){var out=[],row=[],f='',q=false;for(var i=0;i<t.length;i++){var c=t[i];if(q){if(c=='\"'){if(t[i+1]=='\"'){f+='\"';i++;}else q=false;}else f+=c;}else if(c=='\"')q=true;else if(c==','||c==';'||c=='\\t'){row.push(f);f='';}else if(c=='\\n'||c=='\\r'){if(c=='\\r'&&t[i+1]=='\\n')i++;row.push(f);out.push(row);row=[];f='';}else f+=c;}row.push(f);out.push(row);return out;}" +
"function load(){var t=inp.value||'',L=parseCSV(t).map(function(r){r=r.map(function(x){return String(x||'').trim();}).filter(Boolean);var c='';if(r.length>1&&/^[A-Za-z]{2}$/.test(r[r.length-1]))c=r.pop().toUpperCase();return{q:r.join(', '),country:c};}).filter(function(r){return r.q;});" +
"if(L.length&&/^(ref|reference|item|address|query|q|id|input|cadastral|permit|company)/i.test(L[0].q))L.shift();var n=L.length;rows=L.slice(0,MAX);cnt.textContent=n?(n+' item'+(n==1?'':'s')+(n>MAX?', only the first '+MAX+' will be checked':'')+'.'):'';return rows;}" +
"inp.addEventListener('input',load);file.addEventListener('change',function(){var f=file.files&&file.files[0];if(!f)return;if(f.size>2e6){cnt.textContent='The file is larger than 2 MB.';return;}var r=new FileReader();r.onload=function(){inp.value=String(r.result||'');load();};r.readAsText(f);});" +
"function esc(s){var d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML;}" +
"function pill(c){var cls=c.status=='found'?'kb-found':(c.status=='not_found'||c.status=='not_published')?'':'kb-warn';var lab={found:'found',not_found:'not found',not_published:'not published',unavailable:'unavailable',needs_key:'needs key'}[c.status]||c.status;return '<span class=\"kb-pill '+cls+'\" title=\"'+esc(c.note||c.facts||'')+'\">'+esc((c.source||c.id).replace(/ \\(.*$/,''))+': '+esc(lab)+'</span>';}" +
"function render(i){var r=res[i],tr=tb.querySelector('tr[data-i=\"'+i+'\"]');if(!tr){tr=document.createElement('tr');tr.setAttribute('data-i',i);tb.appendChild(tr);}var cells='<td>'+(i+1)+'</td><td>'+esc(r.q)+'</td>';" +
"if(r.status=='done')cells+='<td>'+esc(r.kind)+'</td><td>'+(r.checks||[]).map(pill).join('')+(r.cached?' <small>(cached)</small>':'')+'</td><td>'+(r.result_url?'<a href=\"'+esc(r.result_url)+'\" target=\"_blank\" rel=\"noopener\">'+esc(String(r.root_sha256).slice(0,12))+'...</a>':'-')+'</td>';" +
"else cells+='<td colspan=\"3\">'+esc(r.status=='pending'?'waiting':r.status=='rate_limited'?'paused: hourly limit reached':r.status=='skipped'?'skipped: '+(r.error||''):r.status=='key_error'?'API key not accepted':'error: '+(r.error||''))+'</td>';tr.innerHTML=cells;}" +
"function progress(){var d=res.filter(function(r){return r.status!='pending'&&r.status!='rate_limited';}).length;bar.style.width=(res.length?Math.round(d/res.length*100):0)+'%';csvB.disabled=!res.some(function(r){return r.status=='done';});return d;}" +
"async function run(){if(running)return;if(!res.length||!paused){load();if(!rows.length){msg.textContent='Add at least one item.';return;}res=rows.map(function(r){return{q:r.q,country:r.country,status:'pending'};});tb.innerHTML='';res.forEach(function(_,i){render(i);});}" +
"running=true;paused=false;go.disabled=true;stopB.hidden=false;msg.textContent='Checking...';var k=(key.value||'').trim();" +
"while(running){var idx=[];for(var i=0;i<res.length&&idx.length<5;i++)if(res[i].status=='pending'||res[i].status=='rate_limited')idx.push(i);if(!idx.length)break;" +
"var h={'content-type':'application/json'};if(k)h['x-api-key']=k;var d;try{var rr=await fetch('/api/kb/bulk',{method:'POST',headers:h,body:JSON.stringify({rows:idx.map(function(i){return{q:res[i].q,country:res[i].country};})})});d=await rr.json();if(!rr.ok&&!d.rows){msg.textContent=d.error=='invalid_key'?'That API key is not valid.':'The check failed ('+(d.error||rr.status)+').';break;}}catch(e){msg.textContent='Network error. Press Resume to try again.';paused=true;break;}" +
"var lim=false;(d.rows||[]).forEach(function(r,j){res[idx[j]]=Object.assign({country:res[idx[j]].country},r);if(r.status=='rate_limited')lim=true;render(idx[j]);});var n=progress();msg.textContent=n+' of '+res.length+' checked.';" +
"if(lim){paused=true;msg.textContent=n+' of '+res.length+' checked. The hourly limit of 20 lookups without a key is reached: press Resume later, or add an API key.';break;}if((d.rows||[]).some(function(r){return r.status=='key_error';})){msg.textContent='The API key was not accepted.';break;}}" +
"running=false;go.disabled=false;stopB.hidden=true;var left=res.filter(function(r){return r.status=='pending'||r.status=='rate_limited';}).length;if(left){paused=true;go.textContent='Resume';}else{paused=false;go.textContent='Check the list';if(res.length)msg.textContent='Done: '+res.length+' checked. Download the CSV for your file.';}}" +
"go.addEventListener('click',run);stopB.addEventListener('click',function(){running=false;paused=true;msg.textContent='Pausing after this batch...';});inp.addEventListener('input',function(){if(!running){paused=false;go.textContent='Check the list';}});" +
"function cq(v){v=v==null?'':String(v);return /[\",\\n;]/.test(v)?'\"'+v.replace(/\"/g,'\"\"')+'\"':v;}" +
"csvB.addEventListener('click',function(){var H=['row','item','country','recognised_as','status','found','not_found','not_published','unavailable','needs_key','register_results','facts_found','sealed_result_url','root_sha256','checked_at'];var L=[H.join(',')];" +
"res.forEach(function(r,i){var s=r.summary||{},ch=r.checks||[];L.push([i+1,r.q,r.country||'',r.kind||'',r.status,s.found||0,s.not_found||0,s.not_published||0,s.unavailable||0,s.needs_key||0,ch.map(function(c){return c.source+': '+c.status;}).join(' | '),ch.filter(function(c){return c.facts;}).map(function(c){return c.source+' = '+c.facts;}).join(' | '),r.result_url||'',r.root_sha256||'',r.at||''].map(cq).join(','));});" +
"var b=new Blob(['\\ufeff'+L.join('\\r\\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kolaboro-bulk-check-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);});" +
"var qs=new URLSearchParams(location.search).get('items');if(qs){inp.value=qs.split('|').join('\\n');load();}})();";
async function page(shell) {
  const sh = await shell('/how-we-score/');
  const title = 'Bulk register check for agencies and lenders | Kolaboro', desc = 'Check up to 200 cadastral references, NYC addresses, permit or company numbers against official registers and download a CSV. Register lookups only, sealed results.';
  const tags = '<title>' + title + '</title><meta name="description" content="' + desc + '"><link rel="canonical" href="https://kolaboro.com/bulk-check/"><meta property="og:title" content="' + title + '"><meta property="og:description" content="' + desc + '"><meta property="og:url" content="https://kolaboro.com/bulk-check/"><meta property="og:type" content="website"><meta name="robots" content="index, follow">' + CSS;
  const html = await new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],link[rel="canonical"],link[rel="alternate"][hreflang],script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(BODY + '<script>' + JS + '</script>', { html: true }); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } })).text();
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
export async function handle(req, u, env, ctx, shell, lookupHandle) {
const p = u.pathname.replace(/\/+$/, '');
if (p === '/api/kb/bulk') {
if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'x-api-key, content-type', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-max-age': '86400' } });
if (req.method !== 'POST') return out({ error: 'method', use: 'POST {"rows":[{"q":"..."}]} (up to ' + MAX_BATCH + ' rows per call)', page: 'https://kolaboro.com/bulk-check/' }, 405);
return bulk(req, env, ctx, lookupHandle);
}
if (p === '/bulk-check' && (req.method === 'GET' || req.method === 'HEAD')) {
if (!u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: '/bulk-check/' + u.search } });
return page(shell);
}
return null;
}
