# Round 9: a more real, understandable hero inspection film (loops, story in 4 beats).

INSP_HTML = '''<figure class="insp v2" id="insp" aria-label="Illustrative example of a Kolaboro site inspection: a local agent films each construction milestone with GPS proof, and the buyer is told the next payment is safe">
        <div class="insp-top">
          <span class="rec"><b aria-hidden="true"></b>Live site inspection</span>
          <span class="agent" id="agent">Agent on site · example plot</span>
          <span id="clock">--:--:--</span>
        </div>
        <div class="view" id="view">
          <svg class="site2" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FA6C4"/><stop offset=".55" stop-color="#E9D9BE"/><stop offset="1" stop-color="#F3C99A"/></linearGradient>
              <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4D6"/><stop offset=".35" stop-color="#FFE2A8" stop-opacity=".9"/><stop offset="1" stop-color="#FFD08A" stop-opacity="0"/></radialGradient>
              <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C8463"/><stop offset="1" stop-color="#6E5A42"/></linearGradient>
              <linearGradient id="wl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E9E4DA"/><stop offset="1" stop-color="#F7F3EA"/></linearGradient>
              <linearGradient id="wr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CFC7B8"/><stop offset="1" stop-color="#BDB4A3"/></linearGradient>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2D4152"/><stop offset="1" stop-color="#5D7B90"/></linearGradient>
            </defs>
            <rect width="400" height="300" fill="url(#sky)"/>
            <circle cx="318" cy="92" r="60" fill="url(#sun)"/>
            <path d="M0 168 C60 140 110 150 160 138 C210 126 250 146 300 134 C340 125 370 138 400 132 V190 H0Z" fill="#7E9B8A" opacity=".55"/>
            <path d="M0 182 C80 166 140 176 210 166 C280 156 340 172 400 164 V200 H0Z" fill="#5F7F63" opacity=".8"/>
            <rect y="186" width="400" height="114" fill="url(#soil)"/>
            <g stroke="#5A4935" stroke-width="1" opacity=".35"><path d="M0 215 L400 205 M0 240 L400 232 M0 268 L400 262"/></g>
            <g class="palm" fill="#24372C">
              <path d="M38 190 C40 160 44 130 50 104 L54 104 C49 132 46 160 45 190Z"/>
              <path d="M52 104 C36 92 18 96 6 108 C22 98 38 100 52 108Z M52 104 C64 88 84 86 96 96 C82 92 66 96 54 108Z M52 104 C46 84 34 74 22 74 C36 80 44 92 50 108Z M52 104 C62 82 74 76 88 80 C74 82 64 92 55 107Z"/>
              <path d="M368 192 C366 168 362 146 356 126 L360 125 C366 146 370 168 373 192Z"/>
              <path d="M358 126 C346 114 330 116 320 126 C334 120 346 122 358 130Z M358 126 C368 112 384 112 394 120 C382 118 370 122 360 130Z M358 126 C354 110 344 102 334 102 C346 108 352 116 357 130Z"/>
            </g>
            <!-- stage 1: foundation slab -->
            <g class="st st1">
              <path d="M88 222 L200 256 L312 222 L200 190Z" fill="#B8B4AB"/>
              <path d="M88 222 L200 256 L200 264 L88 230Z" fill="#8F8B83"/>
              <path d="M200 256 L312 222 L312 230 L200 264Z" fill="#A29E95"/>
              <g fill="#6B6760"><circle cx="120" cy="222" r="1.6"/><circle cx="150" cy="231" r="1.6"/><circle cx="180" cy="240" r="1.6"/><circle cx="220" cy="240" r="1.6"/><circle cx="250" cy="231" r="1.6"/><circle cx="280" cy="222" r="1.6"/><circle cx="200" cy="205" r="1.6"/><circle cx="160" cy="214" r="1.6"/><circle cx="240" cy="214" r="1.6"/></g>
            </g>
            <!-- stage 2: walls -->
            <g class="st st2">
              <path d="M92 221 L200 254 L200 178 L92 146Z" fill="url(#wl)"/>
              <path d="M200 254 L308 221 L308 146 L200 178Z" fill="url(#wr)"/>
              <path d="M112 186 L150 197 L150 168 L112 157Z" fill="url(#glass)"/>
              <path d="M160 222 L188 230 L188 190 L160 182Z" fill="url(#glass)"/>
              <path d="M218 214 L290 192 L290 164 L218 186Z" fill="url(#glass)"/>
              <path d="M200 254 V178" stroke="#A39B8C" stroke-width="1"/>
              <g class="scaf" stroke="#7B5B3A" stroke-width="2"><path d="M316 224 V136 M330 219 V131 M316 196 L330 191 M316 166 L330 161 M316 140 L330 135"/></g>
            </g>
            <!-- stage 3: roof -->
            <g class="st st3">
              <path class="rfill" d="M80 149 L200 185 L200 96Z" fill="#3B2F28"/>
              <path class="rfill" d="M200 185 L320 149 L200 96Z" fill="#54443A"/>
              <g class="rafters" fill="none" stroke="#C98A4B" stroke-width="2.4" stroke-linecap="round">
                <path pathLength="1" d="M80 149 L200 96 L320 149"/>
                <path pathLength="1" d="M200 96 V185"/>
                <path pathLength="1" d="M110 158 L200 120 M140 167 L200 140 M290 158 L200 120 M260 167 L200 140"/>
              </g>
              <path class="rfill" d="M80 149 L200 185 L320 149" fill="none" stroke="#2A211C" stroke-width="2"/>
            </g>
          </svg>
          <span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span>
          <span class="focus" id="focus"></span>
          <span class="tag" id="tag"></span>
          <span class="flash" id="flash"></span>
          <span class="shots" id="shots">0 photos · 0 videos</span>
          <span class="stamp" id="stamp">Verified on site</span>
          <div class="gps"><span id="lat">-8.64781, 115.13852</span><span id="gpsok">GPS ±3 m</span></div>
        </div>
        <ol class="steps" id="steps">
          <li><span class="tick"><svg viewBox="0 0 12 12"><path d="M2 6.5 5 9l5-6" fill="none" stroke="#06261A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Foundations<small>Milestone 1</small></li>
          <li><span class="tick"><svg viewBox="0 0 12 12"><path d="M2 6.5 5 9l5-6" fill="none" stroke="#06261A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Structure and walls<small>Milestone 2</small></li>
          <li><span class="tick"><svg viewBox="0 0 12 12"><path d="M2 6.5 5 9l5-6" fill="none" stroke="#06261A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span id="m3">Roof structure</span><small>Milestone 3</small></li>
        </ol>
        <div class="pay">
          <div><span>Your payment 3 of 6</span><strong>€48,000</strong></div>
          <span class="pill" id="pill">On hold</span>
        </div>
        <div class="toast" id="toast" role="status"><b>To the buyer, in Austin, Texas</b><span>Milestone 3 verified with 14 photos and 2 videos. Safe to pay.</span></div>
      </figure>
      <ol class="insp-legend" aria-label="How it works">
        <li><b>1</b>A local agent visits the site</li>
        <li><b>2</b>Every milestone filmed with GPS proof</li>
        <li><b>3</b>You pay only when it's done</li>
      </ol>'''

INSP_CSS = '''
.insp.v2 .insp-top{gap:10px}
.insp.v2 .agent{font-size:.78rem;color:#8FA0AE;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;text-align:center}
.insp.v2 .view{background:#7FA6C4}
.site2{position:absolute;inset:0;width:100%;height:100%}
.site2 .st{transform-box:fill-box;transform-origin:50% 100%;transition:opacity .5s,transform .9s cubic-bezier(.2,.9,.25,1)}
.site2 .st1{opacity:0;transform:translateY(10px)}
.site2 .st2{opacity:0;transform:scaleY(.05)}
.site2 .st3 .rfill{opacity:0;transition:opacity .7s .9s}
.site2 .st3 .rafters path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1s ease-out}
.site2 .scaf{transition:opacity .5s}
.insp.s1 .st1,.insp.s2 .st1,.insp.s3 .st1{opacity:1;transform:none}
.insp.s2 .st2,.insp.s3 .st2{opacity:1;transform:none}
.insp.s3 .st3 .rafters path{stroke-dashoffset:0}
.insp.s3 .st3 .rfill{opacity:1}
.insp.end .scaf{opacity:0}
.focus{position:absolute;border:2px solid #FFD54A;border-radius:8px;box-shadow:0 0 0 2000px rgba(10,16,22,.18);opacity:0;transition:all .7s cubic-bezier(.3,.9,.3,1);pointer-events:none}
.focus.on{opacity:1}
.tag{position:absolute;background:rgba(14,22,30,.86);color:#fff;font-size:.74rem;font-weight:700;padding:5px 9px;border-radius:8px;white-space:nowrap;opacity:0;transform:translateY(4px);transition:opacity .3s,transform .3s,left .7s,top .7s}
.tag.on{opacity:1;transform:none}
.tag i{color:#7FE0B6;font-style:normal;margin-right:4px}
.flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.flash.go{animation:flash .45s ease-out}
@keyframes flash{0%{opacity:.85}100%{opacity:0}}
.shots{position:absolute;left:14px;top:12px;font-size:.72rem;font-weight:700;color:#fff;background:rgba(14,22,30,.6);padding:4px 8px;border-radius:999px;font-variant-numeric:tabular-nums;margin-left:30px}
.insp.v2 .stamp{top:auto;bottom:48px;right:22px}
#gpsok.lock::before{content:"✓ ";color:#7FE0B6}
.insp.v2 .steps li{transition:color .3s}
.toast{position:absolute;left:26px;right:26px;top:58px;background:#F6F6F3;color:#17212B;border-radius:14px;padding:10px 14px;box-shadow:0 18px 40px -12px rgba(0,0,0,.45);font-size:.84rem;line-height:1.35;opacity:0;transform:translateY(-10px) scale(.98);transition:opacity .4s,transform .45s cubic-bezier(.2,1.4,.4,1);pointer-events:none;z-index:3}
.toast b{display:block;font-size:.72rem;color:#59626B;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.toast.on{opacity:1;transform:none}
.insp-legend{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0 0;padding:0}
.insp-legend li{font-size:.86rem;line-height:1.3;color:var(--ink-2);display:flex;gap:8px;align-items:flex-start}
.insp-legend b{flex:0 0 22px;height:22px;border-radius:50%;background:var(--ink);color:var(--paper);display:grid;place-items:center;font-size:.75rem}
@media (max-width:560px){.insp.v2 .agent{display:none}.insp-legend{grid-template-columns:1fr;gap:8px;margin-top:12px}}
@media (prefers-reduced-motion:reduce){.site2 .st,.site2 .st3 .rfill,.site2 .st3 .rafters path,.focus,.tag,.toast{transition:none}}
'''

INSP_JS = '''<script>
(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };
  var card = $('insp'), clock = $('clock'), lis = document.querySelectorAll('#steps li'), pill = $('pill'), stamp = $('stamp'),
      lat = $('lat'), m3 = $('m3'), focus = $('focus'), tag = $('tag'), flash = $('flash'), shots = $('shots'), toast = $('toast'), gpsok = $('gpsok');
  if (!card) return;
  function tick(){ clock.textContent = new Date().toTimeString().slice(0,8); }
  tick(); setInterval(tick, 1000);
  var fLat = -8.64781, fLon = 115.13852, P = 0, V = 0;
  var FOCUS = [[20,60,60,30],[22,40,57,45],[18,30,64,36]];
  var TAGS = [['Slab 12 × 8 m, as in the plans',30,58],['Walls and openings match drawings',26,40],['Roof frame complete',34,30]];
  function setShots(){ shots.textContent = P + (P === 1 ? ' photo · ' : ' photos · ') + V + (V === 1 ? ' video' : ' videos'); }
  function show(i){ var f = FOCUS[i]; focus.style.left = f[0]+'%'; focus.style.top = f[1]+'%'; focus.style.width = f[2]+'%'; focus.style.height = f[3]+'%'; focus.classList.add('on');
    tag.innerHTML = '<i>✓</i>' + TAGS[i][0]; tag.style.left = TAGS[i][1]+'%'; tag.style.top = 'calc(' + TAGS[i][2] + '% - 30px)'; }
  function snap(n, v){ flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go'); P += n; V += v; setShots(); tag.classList.add('on'); }
  function reset(){ card.className = 'insp v2'; lis.forEach(function(l){ l.classList.remove('done','busy'); }); pill.textContent = 'On hold'; pill.classList.remove('safe');
    stamp.classList.remove('on'); toast.classList.remove('on'); focus.classList.remove('on'); tag.classList.remove('on'); gpsok.classList.remove('lock'); m3.textContent = 'Roof structure'; P = 0; V = 0; setShots(); }
  function final(){ card.className = 'insp v2 s3 end'; lis.forEach(function(l){ l.classList.add('done'); }); pill.textContent = 'Safe to pay'; pill.classList.add('safe');
    stamp.classList.add('on'); gpsok.classList.add('lock'); P = 14; V = 2; setShots(); lat.textContent = fLat.toFixed(5) + ', ' + fLon.toFixed(5); }
  if (reduce) { final(); toast.classList.add('on'); return; }
  var timers = [], running = false;
  function at(ms, fn){ timers.push(setTimeout(fn, ms)); }
  function run(){
    running = true; reset();
    var t0 = performance.now();
    (function jitter(now){ var k = Math.min(1,(now-t0)/1500), j = (1-k)*0.02;
      lat.textContent = (fLat + (Math.random()-.5)*j).toFixed(5) + ', ' + (fLon + (Math.random()-.5)*j).toFixed(5);
      if (k < 1) requestAnimationFrame(jitter); else gpsok.classList.add('lock'); })(t0);
    at(700,  function(){ card.classList.add('s1'); lis[0].classList.add('busy'); });
    at(1500, function(){ show(0); });
    at(2300, function(){ snap(4,1); lis[0].classList.remove('busy'); lis[0].classList.add('done'); });
    at(3300, function(){ tag.classList.remove('on'); card.classList.add('s2'); lis[1].classList.add('busy'); });
    at(4300, function(){ show(1); });
    at(5100, function(){ snap(6,0); lis[1].classList.remove('busy'); lis[1].classList.add('done'); });
    at(6100, function(){ tag.classList.remove('on'); card.classList.add('s3'); lis[2].classList.add('busy'); m3.textContent = 'Roof structure, checking'; pill.textContent = 'Checking…'; });
    at(7400, function(){ show(2); });
    at(8200, function(){ snap(4,1); lis[2].classList.remove('busy'); lis[2].classList.add('done'); m3.textContent = 'Roof structure'; });
    at(9000, function(){ focus.classList.remove('on'); tag.classList.remove('on'); card.classList.add('end'); stamp.classList.add('on'); pill.textContent = 'Safe to pay'; pill.classList.add('safe'); });
    at(9700, function(){ toast.classList.add('on'); });
    at(15500, function(){ timers = []; running = false; if (visible) run(); });
  }
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function(e){ visible = e[0].isIntersecting; if (visible && !running) run(); }, { threshold: .3 }).observe(card);
  } else run();
})();
</script>'''

def r9_hero():
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    a = s.index('<figure class="insp"'); b = s.index('</figure>', a) + len('</figure>')
    s = s[:a] + INSP_HTML + s[b:]
    a = s.index('<script>\n(function(){\n  var reduce'); b = s.index('</script>', a) + len('</script>')
    s = s[:a] + INSP_JS + s[b:]
    a = s.index('<p class="example">', a0) if False else s.index('<p class="example">'); b = s.index('</p>', a) + 4
    ex = s[a:b].replace('<p class="example">', '<p class="example" style="position:static;text-align:right;margin-top:10px">'); s = s[:a] + s[b:]
    s = s.replace('</figure>\n      <ol class="insp-legend"', '</figure>\n      ' + ex + '\n      <ol class="insp-legend"', 1)
    open(fp, 'w').write(s)
    css = os.path.join(OUT, 'k', 'site.css'); open(css, 'a').write(INSP_CSS)

BAND_JS = '''<script>
(function(){
  var box = document.getElementById('hband'); if (!box || !window.fetch) return;
  fetch('/data/bali-claims.json', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(d){
    var s = box.querySelectorAll('.stat');
    s[0].innerHTML = '<b>' + d.projects + '</b><span>Bali projects tracked weekly</span>';
    var y = d.yield && d.yield.known ? '<b>' + d.yield.median + '%</b><span>median rental yield developers advertise</span>' : '<b>' + d.lease.median + ' yrs</b><span>median lease advertised</span>';
    s[1].innerHTML = y;
  }).catch(function(){});
})();
</script>'''

def r9_band():
    fp = os.path.join(OUT, 'index.html'); s = open(fp).read()
    if 'id="hband"' in s and BAND_JS not in s:
        s = s.replace('</body>', BAND_JS + '\n</body>', 1); open(fp, 'w').write(s)
