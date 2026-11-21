# -*- coding: utf-8 -*-
"""Reader feedback and measurement without cookies (18 Nov 2026). Everything goes to the Worker's own day record (/api/ev), nothing to third parties:
  - "Was this useful?" yes/no at the end of guides and place pages (helpful_html)
  - views and clicks per page block marked with data-block (click-through rate per module)
  - "Most read this week" on the front page, filled from /api/top (most_read_html)
  - "New since your last visit" marks on the front page (localStorage only, never sent)
  - Speculation Rules: the browser prefetches internal links on hover (spec_rules)
No page of its own: build.py calls the helpers. js(l) is appended to the shared footer script."""
S = {"en": {"q": "Was this page useful?", "y": "Yes", "n": "No", "ty": "Thank you. It helps us decide what to improve.", "tn": "Thank you. Tell us what was missing:", "mr": "Most read this week", "new": "New"},
     "es": {"q": "¿Te ha servido esta página?", "y": "Sí", "n": "No", "ty": "Gracias. Nos ayuda a decidir qué mejorar.", "tn": "Gracias. Cuéntanos qué faltaba:", "mr": "Lo más leído esta semana", "new": "Nuevo"},
     "id": {"q": "Apakah halaman ini membantu?", "y": "Ya", "n": "Tidak", "ty": "Terima kasih. Ini membantu kami menentukan apa yang perlu diperbaiki.", "tn": "Terima kasih. Beri tahu kami apa yang kurang:", "mr": "Paling banyak dibaca pekan ini", "new": "Baru"}}
CSS = """
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
nav.s a,footer .links a,footer p a,.bar a,.crumbs a,.tags a,.allg a,.k a,.src li a,.hd a,.ctx a{display:inline-block;min-height:24px;line-height:24px}footer .links{row-gap:2px}
.hlp{margin:22px 0 0;padding:12px 14px;border:1px solid var(--line);border-radius:6px;font:15px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center}.hlp button{font:inherit;padding:6px 16px;border:1px solid var(--ink);background:none;color:var(--ink);border-radius:4px;cursor:pointer}.hlp button:hover{background:var(--ink);color:var(--bg)}
.mr ol{margin:0;padding-left:1.2em;font:15.5px/1.35 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.mr li{margin:0 0 8px}.mr a{text-decoration:none;color:inherit}.mr a:hover{text-decoration:underline}
.nw{display:inline-block;font:700 10.5px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff;background:var(--accent);border-radius:3px;padding:1px 5px;margin-right:6px;vertical-align:middle}
"""
def helpful_html(l, contact):
    t = S[l]
    return f'<div class="hlp" data-block="helpful" data-ty="{t["ty"]}" data-tn="{t["tn"]}" data-mail="{contact}"><span>{t["q"]}</span><button type="button" data-v="1">{t["y"]}</button><button type="button" data-v="0">{t["n"]}</button></div>'
def most_read_html(l): return f'<section class="desk mr" id="mr" data-block="mostread" hidden><h2 class="rh">{S[l]["mr"]}</h2><ol></ol></section>'
def spec_rules(): return '<script type="speculationrules">{"prefetch":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/api/*"}},{"not":{"href_matches":"/*.pdf"}},{"not":{"href_matches":"/data/*"}}]},"eagerness":"moderate"}]}</script>'
def js(l):
    t = S[l]
    return ("<script>(function(){function ev(o){try{var b=JSON.stringify(o);if(navigator.sendBeacon)navigator.sendBeacon('/api/ev',b);else fetch('/api/ev',{method:'POST',body:b,keepalive:true})}catch(e){}}window.stEv=ev;"
            # clicks inside a marked block
            "document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a,button');if(!a)return;var b=a.closest('[data-block]');if(!b)return;"
            "if(b.classList.contains('hlp')&&a.dataset.v!=null){ev({k:'h',p:location.pathname,v:+a.dataset.v});var s=b.querySelector('span');b.querySelectorAll('button').forEach(function(x){x.remove()});"
            "if(a.dataset.v==='1')s.textContent=b.dataset.ty;else{s.textContent=b.dataset.tn+' ';var m=document.createElement('a');m.href='mailto:'+b.dataset.mail+'?subject='+encodeURIComponent(document.title);m.textContent=b.dataset.mail;s.appendChild(m)}return}"
            "ev({k:'b',b:b.dataset.block})});"
            # block views: once per page view when a marked block enters the screen
            "if('IntersectionObserver' in window){var seen={},io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){var n=x.target.dataset.block;io.unobserve(x.target);if(!seen[n]){seen[n]=1;ev({k:'v',b:n})}}})},{threshold:.4});"
            "document.querySelectorAll('[data-block]').forEach(function(x){io.observe(x)})}"
            # front page: most read + new since last visit
            "var mr=document.getElementById('mr');if(mr){fetch('/api/top?l=" + l + "').then(function(r){return r.json()}).then(function(j){if(!j||j.length<3)return;var ol=mr.querySelector('ol');j.forEach(function(x){var li=document.createElement('li'),a=document.createElement('a');a.href=x.u;a.textContent=x.t;li.appendChild(a);ol.appendChild(li)});mr.hidden=false;if(window.stBal)stBal()}).catch(function(){});"
            "try{var last=+localStorage.getItem('st_seen')||0;if(last){document.querySelectorAll('.brf .bi time[datetime],.strip time[datetime],.lead time[datetime]').forEach(function(tm){if(Date.parse(tm.getAttribute('datetime'))>last){var n=document.createElement('span');n.className='nw';n.textContent='" + t["new"] + "';tm.parentNode.insertBefore(n,tm)}})}"
            "localStorage.setItem('st_seen',String(Date.now()))}catch(e){}}"
            "})()</script>")
