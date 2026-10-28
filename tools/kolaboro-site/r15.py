# Round 15: client accounts. After PayPal -> /thanks creates an account -> /portal (real client panel).
# /login, password change, admin "Clients" tab (cases, stages, chat, view as client).
import re as _re15

APP_CSS = r'''
@font-face{font-family:Archivo;src:url(/k/fonts/archivo-latin.woff2) format("woff2");font-weight:100 900;font-display:swap}
:root{--ink:#17212B;--ink2:#2A3541;--paper:#F6F6F3;--card:#fff;--line:#E3E2DD;--muted:#5E6872;--hi:#FF5B14;--hi-ink:#B83A05;--ok:#0B7A55;--ok-bg:#DDEFE7;--warn:#9A6400;--warn-bg:#FFF0C7;--bad:#B42318;--bad-bg:#FDE2D6;--r:18px}
*{box-sizing:border-box}html,body{margin:0}body{background:var(--paper);color:var(--ink);font:15.5px/1.5 Archivo,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:inherit}button,input,select,textarea{font:inherit;color:inherit}
.ap-top{background:var(--ink);color:#fff;position:sticky;top:0;z-index:20}
.ap-top-in{max-width:1240px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:14px}
.ap-brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:1.15rem;text-decoration:none;color:#fff}.ap-brand svg{width:26px;height:26px}
.ap-sp{flex:1}.ap-chip{background:#2B3743;border:0;border-radius:999px;padding:8px 14px;color:#fff;cursor:pointer;text-decoration:none;font-size:.9rem}
.ap-chip:hover{background:#384756}
.ap-main{max-width:1240px;margin:0 auto;padding:22px 20px 80px}
.ap-banner{border-radius:14px;padding:12px 16px;margin-bottom:16px;font-weight:600;display:flex;gap:10px;align-items:flex-start}
.ap-banner.warn{background:var(--warn-bg);color:#5C3B00}.ap-banner.admin{background:#E3E8FF;color:#1D2B6B}.ap-banner.ok{background:var(--ok-bg);color:#064A33}
.ap-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:18px;align-items:start}
.ap-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:20px;box-shadow:0 1px 0 rgba(0,0,0,.02)}
.ap-card+.ap-card{margin-top:18px}.ap-col>.ap-card+.ap-card{margin-top:18px}
.ap-card h2{margin:0 0 4px;font-size:1.15rem;letter-spacing:-.01em}.ap-card h3{margin:16px 0 6px;font-size:1rem}
.ap-k{font-size:.74rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.ap-muted{color:var(--muted)}.ap-small{font-size:.86rem}
.ap-hero{background:var(--ink);color:#fff;border:0;position:relative;overflow:hidden}
.ap-hero::after{content:"";position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(255,91,20,.35),transparent 70%)}
.ap-hero .ap-k{color:#9FB0BF}.ap-hero h1{margin:6px 0 4px;font-size:clamp(1.5rem,3vw,2.2rem);letter-spacing:-.02em;line-height:1.1}
.ap-hero a{color:#FFB596}
.ap-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;position:relative;z-index:1}
.ap-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 12px;font-weight:700;font-size:.82rem;background:#2B3743;color:#fff}
.ap-badge.pending{background:#3A4652}.ap-badge.safe{background:#0B7A55}.ap-badge.hold{background:#B7791F}.ap-badge.stop{background:#B42318}
.ap-steps{list-style:none;padding:0;margin:22px 0 4px;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;position:relative;z-index:1}
.ap-steps li{position:relative;padding-top:30px;font-size:.8rem;color:#9FB0BF;line-height:1.25}
.ap-steps li::before{content:"";position:absolute;top:8px;left:0;right:-6px;height:4px;border-radius:4px;background:#2E3B48}
.ap-steps li::after{content:"";position:absolute;top:2px;left:0;width:16px;height:16px;border-radius:50%;background:#2E3B48;border:3px solid var(--ink)}
.ap-steps li.done{color:#fff}.ap-steps li.done::before{background:#2FB27E}.ap-steps li.done::after{background:#2FB27E}
.ap-steps li.now{color:#fff;font-weight:700}.ap-steps li.now::before{background:linear-gradient(90deg,var(--hi) 50%,#2E3B48 50%)}.ap-steps li.now::after{background:var(--hi);box-shadow:0 0 0 6px rgba(255,91,20,.25);animation:appulse 1.8s infinite}
.ap-steps small{display:block;color:#7E8D9A;font-weight:400;margin-top:2px}
@keyframes appulse{0%,100%{box-shadow:0 0 0 4px rgba(255,91,20,.35)}50%{box-shadow:0 0 0 9px rgba(255,91,20,.08)}}
.ap-now{margin-top:14px;background:#22303C;border-radius:14px;padding:12px 14px;position:relative;z-index:1}
.ap-facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px}
.ap-facts div{background:#F2F1EC;border-radius:12px;padding:9px 11px}.ap-facts span{display:block;font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.ap-facts b{font-size:.95rem;word-break:break-word}
.ap-att{display:inline-block;border-radius:999px;padding:3px 10px;font-weight:800;font-size:.8rem}.ap-att.low{background:var(--ok-bg);color:var(--ok)}.ap-att.medium{background:var(--warn-bg);color:var(--warn)}.ap-att.high{background:var(--bad-bg);color:var(--bad)}
.ap-list{margin:8px 0 0 1.1em;padding:0;display:grid;gap:6px}
.ap-chk{list-style:none;padding:0;margin:10px 0 0;display:grid;gap:8px}.ap-chk li{display:flex;gap:10px;align-items:flex-start}
.ap-chk i{flex:0 0 22px;height:22px;border-radius:50%;border:2px solid #C9C7BF;display:grid;place-items:center;font-style:normal;font-size:.75rem;font-weight:900}.ap-chk li.y i{background:var(--ok);border-color:var(--ok);color:#fff}
.ap-chat{display:flex;flex-direction:column;gap:10px;max-height:420px;overflow:auto;padding:4px 2px;margin-top:10px}
.ap-msg{max-width:86%;padding:10px 13px;border-radius:16px;white-space:pre-wrap;word-wrap:break-word;font-size:.95rem}
.ap-msg.them{background:#F2F1EC;align-self:flex-start;border-bottom-left-radius:4px}.ap-msg.me{background:var(--ink);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.ap-msg small{display:block;font-size:.72rem;opacity:.65;margin-top:4px}
.ap-send{display:flex;gap:8px;margin-top:12px}.ap-send textarea{flex:1;min-height:46px;max-height:160px;resize:vertical;border:1px solid var(--line);border-radius:14px;padding:10px 12px}
.ap-btn{background:var(--hi);color:#111;border:0;border-radius:12px;padding:11px 18px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;justify-content:center}
.ap-btn:hover{filter:brightness(1.05)}.ap-btn[disabled]{opacity:.55;cursor:wait}
.ap-btn2{background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:12px;padding:10px 16px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.ap-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ap-form label{display:block;font-weight:700;font-size:.85rem}
.ap-form input,.ap-form textarea,.ap-form select{display:block;width:100%;margin-top:4px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fff}
.ap-form .full{grid-column:1/-1}
.ap-tl{list-style:none;padding:0;margin:10px 0 0;border-left:2px solid var(--line);display:grid;gap:12px}.ap-tl li{position:relative;padding-left:16px}.ap-tl li::before{content:"";position:absolute;left:-6px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--hi)}
.ap-money{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.ap-money b{font-size:1.6rem}
.ap-report{display:flex;gap:14px;align-items:center;background:#F2F1EC;border-radius:14px;padding:14px;margin-top:10px}
.ap-report svg{flex:0 0 40px}
.ap-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px}.ap-tabs button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 14px;cursor:pointer;font-weight:600}.ap-tabs button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ap-auth{min-height:100vh;display:grid;grid-template-columns:1fr 1fr}
.ap-auth-l{background:var(--ink);color:#fff;padding:48px clamp(24px,5vw,72px);display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.ap-auth-l::after{content:"";position:absolute;right:-120px;bottom:-120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(255,91,20,.35),transparent 70%)}
.ap-auth-l h1{font-size:clamp(1.8rem,3.2vw,2.8rem);line-height:1.08;letter-spacing:-.02em;margin:0 0 14px}
.ap-auth-l li{margin:8px 0;color:#C9D0D6}.ap-auth-l li b{color:#fff}
.ap-auth-r{display:flex;align-items:center;justify-content:center;padding:40px 20px}
.ap-auth-box{width:100%;max-width:440px}
.ap-auth-box h2{font-size:1.7rem;margin:0 0 6px;letter-spacing:-.01em}
.ap-auth-box label{display:block;font-weight:700;font-size:.88rem;margin-top:14px}
.ap-auth-box input{display:block;width:100%;margin-top:6px;border:2px solid var(--line);border-radius:14px;padding:12px 14px;min-height:50px;background:#fff}
.ap-auth-box input:focus{outline:none;border-color:var(--ink)}
.ap-pw{position:relative}.ap-pw button{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:none;cursor:pointer;color:var(--muted);font-weight:700;font-size:.8rem;margin-top:3px}
.ap-err{color:var(--bad);font-weight:700;min-height:1.3em;margin-top:10px}
.ap-meter{height:5px;border-radius:5px;background:var(--line);margin-top:6px;overflow:hidden}.ap-meter i{display:block;height:100%;width:0;background:var(--bad);transition:all .3s}
.ap-hide{display:none!important}
.ap-empty{border:2px dashed var(--line);border-radius:14px;padding:16px;color:var(--muted);text-align:center}
.ap-cases{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.ap-cases button{border:1px solid var(--line);background:#fff;border-radius:12px;padding:8px 12px;cursor:pointer;text-align:left}.ap-cases button.on{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
.ap-cases button small{display:block;color:var(--muted)}
.ap-skel{background:linear-gradient(90deg,#ECEBE6,#F6F5F1,#ECEBE6);background-size:200% 100%;animation:apsk 1.2s infinite;border-radius:10px;height:14px;margin:8px 0}
@keyframes apsk{to{background-position:-200% 0}}
.ap-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:12px;font-weight:700;z-index:50;opacity:0;transition:opacity .3s}.ap-toast.on{opacity:1}
@media (max-width:640px){#who{display:none}.ap-top-in{gap:6px;padding:10px 12px}.ap-chip{padding:7px 10px;font-size:.8rem}.ap-brand{font-size:1rem}}
@media (max-width:900px){.ap-grid{grid-template-columns:1fr}.ap-auth{grid-template-columns:1fr}.ap-auth-l{padding:28px 20px}.ap-auth-l .ap-auth-hide{display:none}.ap-steps{grid-template-columns:repeat(3,1fr);row-gap:16px}.ap-form{grid-template-columns:1fr}}
'''

LOGO_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8 4v24M8 16 23 6.5M8 16l15 9.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="6" r="3.4" fill="currentColor"/><circle cx="24" cy="26" r="3.4" fill="currentColor"/><circle cx="8" cy="16" r="4.2" fill="#FF5B14"/></svg>'

def _app_head(title):
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/k/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#17212B">
<link rel="preload" href="/k/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/k/app.css?v=15">
<script>if(!window.clarity)(function(c,l,a,r,i,t,y){{c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);}})(window,document,"clarity","script","z4eqcmaic7");</script>
</head><body>'''

COMMON_JS = r'''
var KB = (function(){
  var SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/', K = '__ANON__';
  function rpc(fn, body){ return fetch(SB + fn, { method:'POST', headers:{ apikey:K, Authorization:'Bearer '+K, 'Content-Type':'application/json' }, body: JSON.stringify(body) }).then(function(r){ return r.json(); }); }
  function get(k){ try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch(e){ return null; } }
  function set(k, v, session){ try { (session ? sessionStorage : localStorage).setItem(k, v); } catch(e){} }
  function del(k){ try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function toast(t){ var d = document.createElement('div'); d.className = 'ap-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function(){ d.classList.add('on'); }, 10); setTimeout(function(){ d.classList.remove('on'); setTimeout(function(){ d.remove(); }, 400); }, 2600); }
  function pwToggle(root){ (root || document).querySelectorAll('.ap-pw button').forEach(function(b){ b.onclick = function(){ var i = b.previousElementSibling; i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Show' : 'Hide'; }; }); }
  function meter(inp, bar){ inp.addEventListener('input', function(){ var v = inp.value, s = 0; if (v.length >= 8) s++; if (v.length >= 12) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^\w]/.test(v)) s++; bar.style.width = (s * 20) + '%'; bar.style.background = s < 2 ? '#B42318' : s < 4 ? '#B7791F' : '#0B7A55'; }); }
  return { rpc:rpc, get:get, set:set, del:del, esc:esc, toast:toast, pwToggle:pwToggle, meter:meter };
})();
'''

AUTH_LEFT = '''<div class="ap-auth-l"><a class="ap-brand" href="/">''' + LOGO_SVG + '''kolaboro</a>
<div style="position:relative;z-index:1"><h1>__H__</h1><ul style="padding-left:1.1em">
<li><b>Live case file.</b> Every step your local agent takes, with dates.</li>
<li><b>Direct chat</b> with the Kolaboro team about your project.</li>
<li class="ap-auth-hide"><b>Your money.</b> We tell you when it's safe to pay the next instalment.</li>
<li class="ap-auth-hide"><b>Your report</b> to download the day it's ready. Refund in full if we can't take your case.</li></ul></div>
<p class="ap-auth-hide" style="color:#7E8D9A;font-size:.85rem;position:relative;z-index:1">Kolaboro is operated by Equinox Investment Group LLC. Your data is used only for your case.</p></div>'''

SIGNUP_HTML = _app_head('Create your account | Kolaboro') + '<div class="ap-auth">' + AUTH_LEFT.replace('__H__', 'Payment received. Let&rsquo;s open your case.') + '''
<div class="ap-auth-r"><div class="ap-auth-box">
  <p class="ap-k" style="color:var(--ok)">✓ Step 1 of 2 done: payment</p>
  <h2>Create your account</h2><p class="ap-muted" style="margin:0">Your case file, your agent's updates and your report live here.</p>
  <form id="sf" novalidate>
    <label>Full name<input name="name" autocomplete="name" required></label>
    <label>Email (the one you used in PayPal)<input name="email" type="email" autocomplete="email" required></label>
    <label>Password<span class="ap-pw"><input name="password" type="password" autocomplete="new-password" minlength="8" required><button type="button">Show</button></span></label>
    <div class="ap-meter"><i id="pm"></i></div><p class="ap-small ap-muted" style="margin:4px 0 0">At least 8 characters.</p>
    <label>Project website or listing <span class="ap-muted" style="font-weight:400">(optional)</span><input name="url" inputmode="url" placeholder="The developer's page for the property"></label>
    <label>PayPal transaction ID <span class="ap-muted" style="font-weight:400">(optional, speeds up confirmation)</span><input name="ref" autocomplete="off"></label>
    <label class="hp" aria-hidden="true" style="position:absolute;left:-5000px">Company<input name="company" tabindex="-1" autocomplete="off"></label>
    <button class="ap-btn" style="width:100%;margin-top:18px;min-height:52px">Create account and open my case</button>
    <p class="ap-err" id="se" role="alert"></p>
    <p class="ap-small ap-muted">Already have an account? <a href="/login">Log in</a>. By continuing you accept our <a href="/legal/terms">terms</a> and <a href="/legal/privacy">privacy policy</a>.</p>
  </form>
</div></div></div>
<script>''' + COMMON_JS + r'''
(function(){
  var f = document.getElementById('sf'), e = document.getElementById('se');
  KB.pwToggle(f); KB.meter(f.password, document.getElementById('pm'));
  var q = new URLSearchParams(location.search);
  try { var du = localStorage.getItem('kb-desk-url'); if (du) f.url.value = du; var de = localStorage.getItem('kb-desk-email'); if (de) f.email.value = de; } catch(x){}
  if (q.get('tx')) f.ref.value = q.get('tx');
  try { if (/paid=check/.test(location.search) && window.gtag) gtag('event','purchase',{currency:'EUR',value:490,items:[{item_name:'Pre-purchase check'}]}); } catch(x){}
  try { if (!sessionStorage.getItem('kb-pr')) { sessionStorage.setItem('kb-pr','1'); KB.rpc('kolaboro_event', { p_kind:'paypal_return', p_ref: location.search.slice(0,200), p_page: location.pathname }); } } catch(x){}
  f.addEventListener('submit', function(ev){
    ev.preventDefault(); e.textContent = '';
    if (f.company.value) return;
    var b = f.querySelector('.ap-btn'); b.disabled = true; b.textContent = 'Opening your case…';
    KB.rpc('kolaboro_signup', { p_email: f.email.value, p_password: f.password.value, p_name: f.name.value, p_project_url: f.url.value || null, p_paypal_ref: f.ref.value || null, p_country: null }).then(function(d){
      if (d.token) { KB.set('kb-token', d.token); location.href = '/portal?welcome=1'; return; }
      b.disabled = false; b.textContent = 'Create account and open my case';
      e.innerHTML = { email:'Add a valid email address.', password:'Use at least 8 characters for your password.', name:'Add your name.', exists:'You already have an account with this email. <a href="/login">Log in</a>.', busy:'Too many sign-ups right now. Try again in a few minutes.' }[d.error] || 'Something went wrong. Try again, or email carlos@equinoxinvestmentgroup.com.';
    }).catch(function(){ b.disabled = false; b.textContent = 'Create account and open my case'; e.textContent = 'Network error. Try again.'; });
  });
})();
</script></body></html>'''

LOGIN_HTML = _app_head('Log in | Kolaboro') + '<div class="ap-auth">' + AUTH_LEFT.replace('__H__', 'Your case file, live.') + '''
<div class="ap-auth-r"><div class="ap-auth-box">
  <h2>Log in</h2><p class="ap-muted" style="margin:0">See your case, your agent's updates and your report.</p>
  <form id="lf" novalidate>
    <label>Email<input name="email" type="email" autocomplete="email" required></label>
    <label>Password<span class="ap-pw"><input name="password" type="password" autocomplete="current-password" required><button type="button">Show</button></span></label>
    <button class="ap-btn" style="width:100%;margin-top:18px;min-height:52px">Log in</button>
    <p class="ap-err" id="le" role="alert"></p>
    <p class="ap-small ap-muted">Forgot your password? <a href="mailto:carlos@equinoxinvestmentgroup.com?subject=Kolaboro%20password%20reset">Email us</a> and we reset it the same day.<br>No account yet? <a href="/check#analyze">Start with a free desk review</a>.</p>
  </form>
</div></div></div>
<script>''' + COMMON_JS + r'''
(function(){
  var f = document.getElementById('lf'), e = document.getElementById('le'); KB.pwToggle(f);
  if (KB.get('kb-token')) KB.rpc('kolaboro_portal', { p_token: KB.get('kb-token') }).then(function(d){ if (d.user) location.href = '/portal'; });
  f.addEventListener('submit', function(ev){
    ev.preventDefault(); e.textContent = ''; var b = f.querySelector('.ap-btn'); b.disabled = true;
    KB.rpc('kolaboro_login', { p_email: f.email.value, p_password: f.password.value }).then(function(d){
      b.disabled = false;
      if (d.token) { KB.set('kb-token', d.token); location.href = '/portal'; return; }
      e.textContent = d.error === 'locked' ? 'Too many attempts. Try again in an hour, or email us.' : 'Wrong email or password.';
    }).catch(function(){ b.disabled = false; e.textContent = 'Network error. Try again.'; });
  });
})();
</script></body></html>'''

PORTAL_HTML = _app_head('Your case | Kolaboro') + '''
<header class="ap-top"><div class="ap-top-in"><a class="ap-brand" href="/portal">''' + LOGO_SVG + '''kolaboro</a><span class="ap-muted" style="color:#9FB0BF" id="who"></span><span class="ap-sp"></span>
<button class="ap-chip" id="newc">+ Project</button><button class="ap-chip" id="pwb">Password</button><button class="ap-chip" id="out">Log out</button></div></header>
<main class="ap-main" id="app"><div class="ap-card"><div class="ap-skel" style="width:40%"></div><div class="ap-skel"></div><div class="ap-skel" style="width:70%"></div></div></main>
<script>''' + COMMON_JS + r'''
(function(){
  var PAY = 'https://www.paypal.com/ncp/payment/32ENX4QK833GE';
  var STAGES = ['Case opened','Documents','Land & title','Building permit','Site visit','Report'];
  var STAGE_HELP = ['We confirm your payment and the project details.','We collect the contract, brochure and what you were promised.','Your agent checks the land certificate at the land office.','We confirm the building permit (PBG) in the official system.','Your agent visits the site: GPS-stamped photos and video.','Your written report with a clear verdict.'];
  var VERD = { pending:['In progress','pending'], safe:['Safe to pay','safe'], hold:['Hold payments','hold'], stop:['Stop paying','stop'] };
  var q = new URLSearchParams(location.search);
  if (q.get('as')) { KB.set('kb-token-as', q.get('as'), true); history.replaceState(null, '', '/portal'); }
  var TOKEN = KB.get('kb-token-as') || KB.get('kb-token'), D = null, CUR = null, deskBusy = {};
  if (!TOKEN) { location.href = '/login'; return; }
  var $ = function(i){ return document.getElementById(i); }, esc = KB.esc;
  function call(action, payload){ return KB.rpc('kolaboro_portal', { p_token: TOKEN, p_action: action || 'me', p_payload: payload || {} }).then(function(d){ if (d.error === 'auth') { KB.del('kb-token'); KB.del('kb-token-as'); location.href = '/login'; } return d; }); }
  function fmt(t, withTime){ if (!t) return ''; var d = new Date(t); return d.toLocaleDateString(undefined, { day:'numeric', month:'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) + (withTime ? ' · ' + d.toTimeString().slice(0,5) : ''); }
  function days(t){ return Math.ceil((new Date(t) - new Date()) / 864e5); }
  function load(action, payload){ return call(action, payload).then(function(d){ if (d.error) { KB.toast('Could not save: ' + d.error); return; } D = d; if (!CUR || !D.cases.some(function(c){ return c.id === CUR; })) CUR = D.cases[0] && D.cases[0].id; render(); }); }
  function stageDate(c, i){ var l = c.log.filter(function(x){ return x.stage === i; })[0]; return l ? fmt(l.at) : ''; }
  function render(){
    var u = D.user, c = D.cases.filter(function(x){ return x.id === CUR; })[0];
    $('who').textContent = u.name + ' · ' + u.email;
    var h = '';
    if (u.admin_view) h += '<div class="ap-banner admin">👁 Admin view: you are seeing exactly what ' + esc(u.email) + ' sees. Messages you send here appear as the Kolaboro team.</div>';
    if (q.get('welcome')) h += '<div class="ap-banner ok">✓ Your account is ready and your case is open. Add your project details below so your agent can start.</div>';
    if (u.status !== 'active') h += '<div class="ap-banner warn">⏳ We are confirming your PayPal payment. It usually takes a few hours. You can already add your project details and write to us.</div>';
    if (D.cases.length > 1) h += '<div class="ap-cases">' + D.cases.map(function(x){ return '<button data-c="' + x.id + '" class="' + (x.id === CUR ? 'on' : '') + '"><b>' + esc(x.project_name || x.code) + '</b><small>' + esc(x.code) + ' · ' + (x.paid ? STAGES[x.stage] : 'Not paid yet') + '</small></button>'; }).join('') + '</div>';
    if (!c) { $('app').innerHTML = h + '<div class="ap-card ap-empty">No cases yet. <button class="ap-btn" id="nc2">Check a project</button></div>'; return; }
    var v = VERD[c.verdict] || VERD.pending, st = c.stage, firstCase = D.cases[D.cases.length - 1].id === c.id;
    var unread = c.messages.filter(function(m){ return m.admin && !m.read; }).length;
    var steps = STAGES.map(function(s, i){ var cls = (i < st || (i === st && st === 5 && c.report_url)) ? 'done' : (i === st ? 'now' : ''); return '<li class="' + cls + '">' + s + '<small>' + (stageDate(c, i) || (i === 5 && c.eta ? 'due ' + fmt(c.eta) : '')) + '</small></li>'; }).join('');
    h += '<div class="ap-grid"><div class="ap-col">';
    h += '<section class="ap-card ap-hero"><p class="ap-k">Case ' + esc(c.code) + ' · opened ' + fmt(c.created_at) + '</p><h1>' + esc(c.project_name || (c.project_url ? c.project_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : 'Your project')) + '</h1>' +
      '<p style="margin:0;color:#C9D0D6;position:relative;z-index:1">' + esc([c.developer, c.location, c.price_text].filter(Boolean).join(' · ') || 'Add the project details so your agent knows exactly what to check.') + (c.project_url ? ' · <a href="' + esc(c.project_url) + '" target="_blank" rel="noopener">website ↗</a>' : '') + '</p>' +
      '<div class="ap-badges"><span class="ap-badge ' + v[1] + '">' + (c.verdict === 'pending' ? '● ' : '') + v[0] + '</span>' + (c.paid ? '' : '<span class="ap-badge hold">' + (firstCase && u.status !== 'active' ? 'Confirming payment' : 'Not paid yet') + '</span>') + (c.eta && st < 5 ? '<span class="ap-badge">Report due ' + fmt(c.eta) + (days(c.eta) >= 0 ? ' · ' + days(c.eta) + ' days' : '') + '</span>' : '') + '</div>' +
      '<ol class="ap-steps">' + steps + '</ol>' +
      '<div class="ap-now"><span class="ap-k">Now</span><div style="margin-top:4px">' + esc(c.stage_note || STAGE_HELP[st]) + '</div></div></section>';
    if (!c.paid && (u.status === 'active' || !firstCase)) h += '<section class="ap-card" style="border-color:var(--hi)"><h2>Start this check</h2><p class="ap-muted">Pay €490 to start the full check of this project. Full refund if we can\'t take the case.</p><a class="ap-btn" href="' + PAY + '" rel="noopener">Pay €490 with PayPal</a></section>';
    // report
    h += '<section class="ap-card"><h2>Your report</h2>' + (c.report_url ? '<div class="ap-report"><svg viewBox="0 0 40 40"><rect x="6" y="3" width="28" height="34" rx="4" fill="#17212B"/><path d="M12 13h16M12 19h16M12 25h10" stroke="#FF5B14" stroke-width="2.5" stroke-linecap="round"/></svg><div style="flex:1"><b>Report ready</b><div class="ap-small ap-muted">Verdict: ' + v[0] + '</div></div><a class="ap-btn" href="' + esc(c.report_url) + '" target="_blank" rel="noopener">Download</a></div>'
      : '<div class="ap-empty">Your written report appears here the day it\'s ready' + (c.eta ? ' (due ' + fmt(c.eta) + ')' : '') + '. <a href="/cases/files/kolaboro-report-example-safe-to-pay.pdf" target="_blank" rel="noopener">See an example report</a>.</div>') + '</section>';
    // desk review
    h += '<section class="ap-card" id="desk"><h2>Desk review of the developer\'s website</h2>' + deskHtml(c) + '</section>';
    // details form
    h += '<section class="ap-card"><h2>Project details</h2><p class="ap-muted ap-small" style="margin-top:0">The more you tell us, the faster your agent works. Only you and the Kolaboro team see this.</p><form id="df" class="ap-form">' +
      fld('project_name','Project name',c.project_name) + fld('developer','Developer',c.developer) + fld('location','Location (village, area)',c.location) + fld('price_text','Price you were quoted',c.price_text) +
      fld('next_payment_date','Your next payment date',c.next_payment_date,'date') + fld('next_payment_amount','Next payment amount',c.next_payment_amount) +
      fld('project_url','Project website or listing',c.project_url,'url','full') + fld('contract_url','Link to your contract (Google Drive, Dropbox…)',c.contract_url,'url','full') +
      '<label class="full">What were you promised? Anything worrying you?<textarea name="user_notes" rows="4">' + esc(c.user_notes) + '</textarea></label>' +
      '<div class="full"><button class="ap-btn" type="submit">Save details</button></div></form></section>';
    h += '</div><div class="ap-col">';
    // money
    if (c.next_payment_date) { var dd = days(c.next_payment_date), before = c.eta && new Date(c.next_payment_date) < new Date(c.eta) && !c.report_url;
      h += '<section class="ap-card"><p class="ap-k">Your next payment</p><div class="ap-money"><b>' + esc(c.next_payment_amount || '—') + '</b><span class="ap-muted">' + fmt(c.next_payment_date) + (dd >= 0 ? ' · in ' + dd + ' days' : ' · overdue') + '</span></div>' +
      (before ? '<div class="ap-banner warn" style="margin:12px 0 0">This payment is due before our report. Ask the developer for a few extra days, or tell us in the chat and we prioritise your case.</div>' : (c.verdict === 'safe' ? '<div class="ap-banner ok" style="margin:12px 0 0">Our verdict: safe to pay this instalment.</div>' : '<p class="ap-small ap-muted" style="margin-bottom:0">We\'ll tell you here if it\'s safe to pay.</p>')) + '</section>'; }
    // chat
    h += '<section class="ap-card"><h2>Messages' + (unread ? ' <span class="ap-att high">' + unread + ' new</span>' : '') + '</h2><p class="ap-small ap-muted" style="margin:0">With the Kolaboro team and your local agent. We reply within one working day.</p><div class="ap-chat" id="chat">' +
      c.messages.map(function(m){ var mine = u.admin_view ? m.admin : !m.admin; return '<div class="ap-msg ' + (mine ? 'me' : 'them') + '">' + esc(m.body) + '<small>' + (m.admin ? 'Kolaboro' : (u.admin_view ? esc(u.name) : 'You')) + ' · ' + fmt(m.at, true) + '</small></div>'; }).join('') +
      '</div><form class="ap-send" id="mf"><textarea name="body" placeholder="Write a message…" required></textarea><button class="ap-btn" type="submit">Send</button></form></section>';
    // checklist
    var chk = [['Payment confirmed', c.paid], ['Project website', !!c.project_url], ['Developer and location', !!(c.developer && c.location)], ['Your next payment date', !!c.next_payment_date], ['Contract shared', !!c.contract_url]];
    h += '<section class="ap-card"><h2>What we need from you</h2><ul class="ap-chk">' + chk.map(function(x){ return '<li class="' + (x[1] ? 'y' : '') + '"><i>' + (x[1] ? '✓' : '') + '</i>' + x[0] + '</li>'; }).join('') + '</ul></section>';
    // timeline
    h += '<section class="ap-card"><h2>Case timeline</h2><ul class="ap-tl">' + c.log.slice().reverse().map(function(l){ return '<li><b>' + STAGES[l.stage] + '</b><div class="ap-small ap-muted">' + fmt(l.at, true) + '</div>' + (l.note ? '<div>' + esc(l.note) + '</div>' : '') + '</li>'; }).join('') + '</ul></section>';
    h += '</div></div>';
    $('app').innerHTML = h;
    var ch = $('chat'); if (ch) ch.scrollTop = ch.scrollHeight;
    document.querySelectorAll('[data-c]').forEach(function(b){ b.onclick = function(){ CUR = b.dataset.c; render(); }; });
    $('df').addEventListener('submit', function(e){ e.preventDefault(); var o = { case_id: c.id }; new FormData(e.target).forEach(function(v, k){ o[k] = v; }); load('update_case', o).then(function(){ KB.toast('Saved'); }); });
    $('mf').addEventListener('submit', function(e){ e.preventDefault(); var t = e.target.body.value.trim(); if (!t) return; e.target.querySelector('button').disabled = true; load('message', { case_id: c.id, body: t }); });
    $('mf').body.addEventListener('keydown', function(e){ if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) $('mf').requestSubmit(); });
    if (unread && !u.admin_view) call('read', { case_id: c.id });
    if (!c.desk && c.project_url && !deskBusy[c.id]) runDesk(c);
  }
  function fld(n, l, v, t, cls){ return '<label class="' + (cls || '') + '">' + l + '<input name="' + n + '" type="' + (t || 'text') + '" value="' + esc(v) + '"></label>'; }
  function deskHtml(c){
    if (!c.project_url) return '<div class="ap-empty">Add the project website in Project details and our research agent reads it in about a minute.</div>';
    if (!c.desk) return '<p class="ap-muted">Our research agent is reading ' + esc(c.project_url.replace(/^https?:\/\/(www\.)?/, '')) + '…</p><div class="ap-skel"></div><div class="ap-skel" style="width:80%"></div><div class="ap-skel" style="width:60%"></div>';
    if (c.desk.error) return '<p class="ap-muted">The website could not be read automatically. Your agent reviews it by hand.</p>';
    var r = c.desk.report || {}, att = (r.attention || 'medium');
    var facts = [['Price from', r.price_from], ['Title', r.title_type], ['Lease', r.lease_years], ['Completion', r.completion], ['Return advertised', r.advertised_return], ['Permit claim', r.permit_claim]].filter(function(f){ return f[1]; });
    return '<p><span class="ap-att ' + esc(att) + '">' + esc(att.charAt(0).toUpperCase() + att.slice(1)) + ' attention</span></p><p>' + esc(r.summary) + '</p>' +
      (facts.length ? '<div class="ap-facts">' + facts.map(function(f){ return '<div><span>' + f[0] + '</span><b>' + esc(f[1]) + '</b></div>'; }).join('') + '</div>' : '') +
      '<h3>Questions your agent will get answered</h3><ol class="ap-list">' + (r.questions || []).map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      ((r.missing || []).length ? '<h3>Not stated on the website</h3><ul class="ap-list">' + r.missing.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="ap-small ap-muted">Read on ' + fmt(c.desk.analysed) + '. Advertised claims, not verified facts. Your agent verifies them on the ground.</p>';
  }
  function runDesk(c){
    deskBusy[c.id] = 1;
    fetch('/api/kb/analyze', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ url: c.project_url, email: D.user.email }) })
      .then(function(r){ return r.json(); }).then(function(d){ var desk = d.report ? { report: d.report, analysed: d.analysed, url: d.url } : { error: d.error || 'failed' }; return load('save_desk', { case_id: c.id, desk: desk }); })
      .catch(function(){});
  }
  $('out').onclick = function(){ call('logout').then(function(){ KB.del('kb-token'); KB.del('kb-token-as'); location.href = '/login'; }); };
  $('pwb').onclick = function(){ var o = prompt('Current password'); if (!o) return; var n = prompt('New password (at least 8 characters)'); if (!n) return; call('password', { old: o, 'new': n }).then(function(d){ KB.toast(d.error ? (d.error === 'wrong' ? 'Current password is wrong' : 'Use at least 8 characters') : 'Password changed'); }); };
  function newCase(){ var u = prompt('Website of the project you want us to check'); if (!u) return; load('new_case', { project_url: u }).then(function(){ CUR = D.cases[0].id; render(); KB.toast('New case opened'); }); }
  $('newc').onclick = newCase; document.addEventListener('click', function(e){ if (e.target.id === 'nc2') newCase(); });
  load('me');
  setInterval(function(){ if (!document.hidden && !document.activeElement.closest('form')) load('me'); }, 45000);
})();
</script></body></html>'''

# ---- admin: Clients tab ----
ADMIN_CLIENTS_TAB = '<button data-t="clients">Clients <span id="unr" class="pill" style="background:#FF5B14;color:#111;display:none"></span></button>'
ADMIN_CLIENTS_SEC = '''<section id="t-clients" class="hide">
  <div class="kpis" id="ck"></div>
  <div class="cl-wrap"><div class="card cl-list"><div class="row"><input id="cq" placeholder="Search clients…" style="flex:1"></div><div id="clist"></div></div>
  <div class="card cl-detail" id="cdet"><p class="muted">Select a case.</p></div></div>
</section>'''
ADMIN_CLIENTS_CSS = '''
.cl-wrap{display:grid;grid-template-columns:340px 1fr;gap:14px;align-items:start}.cl-wrap .card{margin-top:14px}
.cl-item{display:block;width:100%;text-align:left;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 12px;margin-top:8px;cursor:pointer}.cl-item.on{border-color:var(--ink);box-shadow:inset 0 0 0 1px var(--ink)}
.cl-item small{color:var(--muted)}.cl-steps{display:flex;gap:3px;margin-top:6px}.cl-steps i{flex:1;height:4px;border-radius:3px;background:#E6E4DD}.cl-steps i.d{background:#1E9E6A}.cl-steps i.n{background:#FF5B14}
.cl-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cl-grid label{font-size:.8rem;font-weight:700;display:block}.cl-grid input,.cl-grid select,.cl-grid textarea{width:100%;margin-top:3px}
.chat{max-height:320px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin:10px 0}.chat div{padding:8px 11px;border-radius:12px;max-width:85%;white-space:pre-wrap;font-size:.9rem}.chat .a{background:#17212B;color:#fff;align-self:flex-end}.chat .u{background:#F2F1EC;align-self:flex-start}.chat small{display:block;opacity:.6;font-size:.7rem}
@media (max-width:900px){.cl-wrap{grid-template-columns:1fr}.cl-grid{grid-template-columns:1fr}}
'''
ADMIN_CLIENTS_JS = r'''
var STG=['Case opened','Documents','Land & title','Building permit','Site visit','Report'], CSEL=null;
function clients(){ var U=D.users||[], all=[]; U.forEach(function(u){ u.cases.forEach(function(c){ all.push({u:u,c:c}); }); });
  var unread=all.reduce(function(a,x){ return a+x.c.messages.filter(function(m){ return !m.admin&&!m.read; }).length; },0);
  $('unr').style.display=unread?'inline-block':'none'; $('unr').textContent=unread;
  $('ck').innerHTML=[['Clients',U.length],['Active (paid)',U.filter(function(u){return u.status==='active'}).length],['Cases in progress',all.filter(function(x){return x.c.paid&&!x.c.report_url}).length],['Reports delivered',all.filter(function(x){return x.c.report_url}).length],['Unread messages',unread],['Due in 3 days',all.filter(function(x){return x.c.eta&&!x.c.report_url&&(new Date(x.c.eta)-Date.now())<3*864e5}).length]].map(function(k){return '<div class="kpi"><span>'+k[0]+'</span><b>'+k[1]+'</b></div>'}).join('');
  var q=($('cq').value||'').toLowerCase();
  $('clist').innerHTML=all.filter(function(x){ return !q||JSON.stringify([x.u.email,x.u.name,x.c.code,x.c.project_name,x.c.project_url]).toLowerCase().indexOf(q)>=0; }).map(function(x){ var c=x.c,un=c.messages.filter(function(m){return !m.admin&&!m.read}).length;
    return '<button class="cl-item'+(CSEL===c.id?' on':'')+'" data-cs="'+c.id+'"><b>'+esc(c.project_name||c.code)+'</b> '+(un?'<span class="pill" style="background:#FF5B14">'+un+'</span>':'')+(c.paid?'':' <span class="pill" style="background:#FFF0C7">unpaid</span>')+'<br><small>'+esc(x.u.name)+' · '+esc(x.u.email)+' · '+esc(c.code)+'</small><div class="cl-steps">'+STG.map(function(s,i){return '<i class="'+(i<c.stage?'d':i===c.stage?'n':'')+'"></i>'}).join('')+'</div></button>'; }).join('')||'<p class="muted">No clients yet. They appear here after paying and creating an account on /thanks.</p>';
  $('clist').querySelectorAll('[data-cs]').forEach(function(b){ b.onclick=function(){ CSEL=b.dataset.cs; clients(); }; });
  var sel=all.filter(function(x){return x.c.id===CSEL})[0]; if(sel) detail(sel.u,sel.c);
}
function detail(u,c){ var r=(c.desk&&c.desk.report)||null;
  $('cdet').innerHTML='<div class="row"><div style="flex:1"><span class="muted">'+esc(c.code)+' · opened '+when(c.created_at)+'</span><h2 style="margin:2px 0">'+esc(c.project_name||c.project_url||c.code)+'</h2><span class="muted">'+esc(u.name)+' · <a href="mailto:'+esc(u.email)+'">'+esc(u.email)+'</a> · account '+esc(u.status)+(u.paypal_ref?' · PayPal '+esc(u.paypal_ref):'')+'</span></div><button class="btn2" id="asu">View as client ↗</button></div>'+
  '<div class="cl-grid" style="margin-top:12px"><div><b>Project</b><p class="muted" style="margin:4px 0">'+esc([c.developer,c.location,c.price_text].filter(Boolean).join(' · ')||'No details yet')+'</p>'+(c.project_url?'<a href="'+esc(c.project_url)+'" target="_blank">'+esc(c.project_url)+'</a><br>':'')+(c.contract_url?'<a href="'+esc(c.contract_url)+'" target="_blank">Contract ↗</a><br>':'')+(c.next_payment_date?'Next payment: <b>'+esc(c.next_payment_amount||'')+'</b> on '+esc(c.next_payment_date):'')+(c.user_notes?'<p style="background:#F2F1EC;border-radius:10px;padding:8px">'+esc(c.user_notes)+'</p>':'')+
  (r?'<p><b>Desk review</b> · '+esc(r.attention)+' attention<br><span class="muted">'+esc(r.summary)+'</span></p>':'')+'</div>'+
  '<form id="cf" class="cl-grid" style="grid-template-columns:1fr 1fr;align-content:start"><label>Stage<select name="stage">'+STG.map(function(s,i){return '<option value="'+i+'"'+(i===c.stage?' selected':'')+'>'+i+'. '+s+'</option>'}).join('')+'</select></label><label>Verdict<select name="verdict">'+[['pending','In progress'],['safe','Safe to pay'],['hold','Hold payments'],['stop','Stop paying']].map(function(v){return '<option value="'+v[0]+'"'+(v[0]===c.verdict?' selected':'')+'>'+v[1]+'</option>'}).join('')+'</select></label>'+
  '<label>Report due<input type="date" name="eta" value="'+esc(c.eta||'')+'"></label><label>Paid<select name="paid"><option value="true"'+(c.paid?' selected':'')+'>Yes</option><option value="false"'+(c.paid?'':' selected')+'>No</option></select></label>'+
  '<label style="grid-column:1/-1">"Now" note the client sees<textarea name="stage_note" rows="2">'+esc(c.stage_note||'')+'</textarea></label><label style="grid-column:1/-1">Report URL (PDF)<input name="report_url" value="'+esc(c.report_url||'')+'" placeholder="https://kolaboro.com/…pdf"></label><label style="grid-column:1/-1">Timeline entry (optional)<input name="log_note" placeholder="e.g. Land certificate checked at BPN Badung"></label><div style="grid-column:1/-1"><button class="btn">Save case</button></div></form></div>'+
  '<h3 style="margin:16px 0 0">Messages</h3><div class="chat" id="cchat">'+c.messages.map(function(m){return '<div class="'+(m.admin?'a':'u')+'">'+esc(m.body)+'<small>'+(m.admin?'Kolaboro':esc(u.name))+' · '+when(m.at)+'</small></div>'}).join('')+'</div>'+
  '<form id="cmf" class="row"><textarea name="body" rows="2" style="flex:1" placeholder="Reply to '+esc(u.name)+'…"></textarea><button class="btn">Send</button></form>'+
  '<details style="margin-top:14px"><summary>Timeline ('+c.log.length+') and account actions</summary><ul>'+c.log.map(function(l){return '<li>'+when(l.at)+' · '+STG[l.stage]+(l.note?' · '+esc(l.note):'')+'</li>'}).join('')+'</ul><div class="row"><button class="btn2" id="uact">'+(u.status==='active'?'Mark account pending':'Mark account active (paid)')+'</button><button class="btn2" id="urp">Set new password</button><button class="btn2" id="udel" style="color:#C9341A">Delete client</button></div></details>';
  var ch=$('cchat'); ch.scrollTop=ch.scrollHeight;
  if (c.messages.some(function(m){return !m.admin&&!m.read})) rpc('kolaboro_admin',{p_key:PW,p_action:'mark_read',p_payload:{case_id:c.id}});
  $('cf').onsubmit=function(e){e.preventDefault();var o={id:c.id};new FormData(e.target).forEach(function(v,k){o[k]=v});if(+o.stage===c.stage&&!o.log_note)delete o.stage;rpc('kolaboro_admin',{p_key:PW,p_action:'case_update',p_payload:o}).then(load)};
  $('cmf').onsubmit=function(e){e.preventDefault();var t=e.target.body.value.trim();if(!t)return;rpc('kolaboro_admin',{p_key:PW,p_action:'admin_message',p_payload:{case_id:c.id,body:t}}).then(load)};
  $('asu').onclick=function(){rpc('kolaboro_admin',{p_key:PW,p_action:'impersonate',p_payload:{user_id:u.id}}).then(function(d){if(d.token)window.open('/portal?as='+d.token,'_blank')})};
  $('uact').onclick=function(){rpc('kolaboro_admin',{p_key:PW,p_action:'set_user',p_payload:{id:u.id,status:u.status==='active'?'pending':'active'}}).then(load)};
  $('urp').onclick=function(){var p=prompt('New password for '+u.email+' (min 8). Send it to them by email.');if(p)rpc('kolaboro_admin',{p_key:PW,p_action:'reset_password',p_payload:{user_id:u.id,password:p}}).then(function(d){alert(d.error?'Too short':'Password changed')})};
  $('udel').onclick=function(){if(confirm('Delete '+u.email+' and all their cases? This cannot be undone.'))rpc('kolaboro_admin',{p_key:PW,p_action:'delete_user',p_payload:{user_id:u.id}}).then(function(){CSEL=null;load()})};
}
$('cq').addEventListener('input',clients);
'''

def r15_inject():
    anon = _re15.search(r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[\w.-]+", ANALYZE_JS).group(0)
    open(os.path.join(OUT, 'k', 'app.css'), 'w').write(APP_CSS)
    for path, html in (('thanks', SIGNUP_HTML), ('login', LOGIN_HTML), ('portal', PORTAL_HTML)):
        os.makedirs(os.path.join(OUT, path), exist_ok=True)
        open(os.path.join(OUT, path, 'index.html'), 'w').write(html.replace('__ANON__', anon))
    # GA purchase event on /thanks needs gtag: add the GA tag there
    fp = os.path.join(OUT, 'thanks', 'index.html'); s = open(fp).read()
    s = s.replace('</head>', '<script async src="https://www.googletagmanager.com/gtag/js?id=G-FJKJE77K4V"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-FJKJE77K4V");</script>\n</head>', 1)
    open(fp, 'w').write(s)
    # remember the desk-review URL + email for the signup form
    fp = os.path.join(OUT, 'check', 'index.html'); s = open(fp).read()
    s = s.replace("url = v; $('az-e1').textContent = '';", "url = v; try { localStorage.setItem('kb-desk-url', v); } catch(x){} $('az-e1').textContent = '';", 1)
    s = s.replace("$('az-e2').textContent = ''; show(3);", "$('az-e2').textContent = ''; try { localStorage.setItem('kb-desk-email', email); } catch(x){} show(3);", 1)
    open(fp, 'w').write(s)
    # admin: clients tab
    fp = os.path.join(OUT, 'admin', 'index.html'); s = open(fp).read()
    s = s.replace('<button data-t="leads">', ADMIN_CLIENTS_TAB + '<button data-t="leads">', 1)
    s = s.replace('<section id="t-leads"', ADMIN_CLIENTS_SEC + '\n<section id="t-leads"', 1)
    s = s.replace("['ov','leads','pay','tests','tools']", "['ov','clients','leads','pay','tests','tools']")
    s = s.replace('</style>', ADMIN_CLIENTS_CSS + '</style>', 1)
    s = s.replace('  leads(); pays();\n}', '  leads(); pays(); clients();\n}', 1)
    s = s.replace("$('run').onclick=runTests;", "$('run').onclick=runTests;\n" + ADMIN_CLIENTS_JS, 1)
    s = s.replace('<header><b>Kolaboro admin</b>', '<header><a href="/" style="background:none;padding:0;display:flex;align-items:center;gap:8px;font-weight:800;font-size:1.1rem">' + LOGO_SVG.replace('<svg ', '<svg width="24" height="24" ') + 'Kolaboro admin</a>', 1)
    s = s.replace("'/thanks',", "'/thanks','/login','/portal',")
    open(fp, 'w').write(s)
    # login link in the site footer + nav for clients
    for root, _, files in os.walk(OUT):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(root, fn); t = open(p).read()
            if '<li><a href="/legal/privacy">Privacy</a></li>' in t and '/login' not in t:
                t = t.replace('<li><a href="/legal/privacy">Privacy</a></li>', '<li><a href="/login">Client login</a></li>\n        <li><a href="/legal/privacy">Privacy</a></li>', 1)
                open(p, 'w').write(t)
    rb = os.path.join(OUT, 'robots.txt'); t = open(rb).read()
    if '/portal' not in t: open(rb, 'w').write(t.replace('Disallow: /admin', 'Disallow: /admin\nDisallow: /portal\nDisallow: /login\nDisallow: /thanks', 1))

def r15_sitemap():
    fp = os.path.join(OUT, 'sitemap.xml'); s = open(fp).read()
    s = s.replace('<url><loc>https://kolaboro.com/thanks/</loc><lastmod>2026-10-27</lastmod></url>', '')
    s = _re15.sub(r'<url><loc>https://kolaboro.com/thanks/</loc><lastmod>[^<]*</lastmod></url>', '', s)
    open(fp, 'w').write(s)

PRODUCT_SEC = '''
<section class="sec prod" id="product"><div class="wrap">
  <div class="prod-head"><p class="eyebrow">The product</p><h2>Not a landing page. Software your buyer logs into.</h2>
  <p class="lead">Paste a project's website and our research agent reads it in about a minute. Pay for the full check and you get a live case file: every step your local agent takes, a direct chat, a warning before you pay an instalment too early, and the report the day it's ready.</p></div>
  <div class="prod-grid">
    <figure class="prod-shot"><div class="prod-bar"><i></i><i></i><i></i><span>kolaboro.com/portal</span></div>
      <img src="/k/portal-shot.webp" width="1600" height="1000" loading="lazy" alt="Kolaboro client portal: case KB-1001 with six verification stages, the next payment and a chat with the Kolaboro team">
      <figcaption>The real client portal, shown with a demo account.</figcaption></figure>
    <ul class="prod-list">
      <li><b>1 · Free desk review in about 60 seconds</b><span>Our agent reads the developer's own website and lists what must be proven with a document or a visit.</span></li>
      <li><b>2 · Six stages, each with a date</b><span>Case opened, documents, land &amp; title, building permit, site visit, report. Nothing is "almost done".</span></li>
      <li><b>3 · "Don't pay yet" alerts</b><span>Add your next instalment date. If it lands before our report, the portal tells you to hold.</span></li>
      <li><b>4 · Evidence you can check</b><span>Site photos are GPS- and time-stamped with a SHA-256 fingerprint in our field app.</span></li>
    </ul>
  </div>
  <div class="prod-cta"><a class="btn btn-hi" href="/check#analyze" data-ev="prod_desk">Try the free desk review</a><a class="btn btn-line" href="/portal/demo" data-ev="prod_demo">Open the buyer portal demo</a><a class="btn btn-line" href="/login">Client login</a></div>
  <div class="prod-stack">
    <div><b>60 s</b><span>desk review of any project website</span></div>
    <div><b>24</b><span>Bali projects our agent re-reads every week</span></div>
    <div><b>7 days</b><span>from confirmation to written report</span></div>
    <div><b>100%</b><span>refund if we can't take your case</span></div>
  </div>
</div></section>
'''
PRODUCT_CSS = '''
.prod{background:var(--paper)}.prod-head{max-width:860px}.prod-head h2{font-size:clamp(2rem,4.4vw,3.6rem);line-height:1.02;letter-spacing:-.02em;margin:8px 0 14px}
.prod .eyebrow{font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:.8rem;color:var(--hivis-ink)}
.prod-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:clamp(20px,3vw,44px);margin-top:36px;align-items:center}
.prod-shot{margin:0;border-radius:18px;overflow:hidden;background:#17212B;box-shadow:0 40px 80px -40px rgba(23,33,43,.55),0 0 0 1px rgba(23,33,43,.12);transform:perspective(1600px) rotateY(-4deg) rotateX(2deg);transition:transform .6s}
.prod-shot:hover{transform:none}.prod-shot img{display:block;width:100%;height:auto}
.prod-bar{display:flex;align-items:center;gap:6px;padding:10px 14px;background:#0F171F}.prod-bar i{width:10px;height:10px;border-radius:50%;background:#3A4652}.prod-bar i:first-child{background:#FF5B14}
.prod-bar span{margin-left:10px;background:#1F2A35;color:#9FB0BF;border-radius:8px;padding:3px 12px;font-size:.78rem}
.prod-shot figcaption{background:#0F171F;color:#7E8D9A;font-size:.78rem;padding:8px 14px}
.prod-list{list-style:none;padding:0;margin:0;display:grid;gap:18px}.prod-list b{display:block;font-size:1.08rem}.prod-list span{color:var(--muted)}
.prod-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:34px}
.prod-stack{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-top:40px}
.prod-stack div{background:#fff;padding:20px}.prod-stack b{display:block;font-size:2rem;letter-spacing:-.02em}.prod-stack span{color:var(--muted);font-size:.92rem}
@media (max-width:900px){.prod-grid{grid-template-columns:1fr}.prod-shot{transform:none}.prod-stack{grid-template-columns:1fr 1fr}}
'''

def r15_home():
    shutil.copy(os.path.join(HERE, 'portal-shot.webp'), os.path.join(OUT, 'k', 'portal-shot.webp'))
    open(os.path.join(OUT, 'k', 'site.css'), 'a').write(PRODUCT_CSS)
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    s = s.replace("<p>Type a project or developer. If we've verified it, you'll see its Trust Score. If not, we'll check it for you.</p>",
                  "<p>Paste the project's website: our research agent reads it in about a minute and tells you what to verify before you pay. Free.</p>", 1)
    s = s.replace('<button class="btn btn-hi" type="submit">Check project</button></form>\n  </div>\n</section>',
                  '<button class="btn btn-hi" type="submit">Analyse free</button></form>\n  </div>\n</section>', 1)
    if 'id="product"' not in s:
        i = s.index('<section class="sec risk" id="risk"')
        s = s[:i] + PRODUCT_SEC + '\n' + s[i:]
    open(fp, 'w').write(s)
