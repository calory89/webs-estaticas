/* Kolaboro live from the site: phone camera with GPS and time burned into the picture, sent over WebRTC (with a picture relay when the network blocks it), recorded and fingerprinted on the phone */
(function(){
  var ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
  function pad(n){ return ('0' + n).slice(-2); }
  function stamp(d){ var o = -d.getTimezoneOffset(), s = o >= 0 ? '+' : '-'; o = Math.abs(o); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' UTC' + s + pad(Math.floor(o / 60)) + ':' + pad(o % 60); }
  function gathered(pc){ return new Promise(function(res){ if (pc.iceGatheringState === 'complete') return res(); var t = setTimeout(res, 3500); pc.addEventListener('icegatheringstatechange', function(){ if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); }); }
  function hex(b){ return [].map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }

  // opts: { stage: element, label: 'CODE', send: function(action, payload) -> Promise, status: function(text, kind) }
  function caster(opts){
    var st = opts.status || function(){}, video = document.createElement('video'), cv = document.createElement('canvas'), small = document.createElement('canvas');
    var POS = null, track = [], stream, out, pc, rec, chunks = [], started = Date.now(), alive = true, connected = false, timers = [], watch = null, mime = '';
    video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
    cv.width = 960; cv.height = 540; small.width = 480; small.height = 270; cv.className = 'lv-cv';
    opts.stage.innerHTML = ''; opts.stage.appendChild(cv);
    if (navigator.geolocation) watch = navigator.geolocation.watchPosition(function(p){ POS = p; track.push([+p.coords.latitude.toFixed(6), +p.coords.longitude.toFixed(6), Math.round(p.coords.accuracy), Math.round((Date.now() - started) / 1000)]); if (track.length > 400) track.splice(1, 1); }, function(){}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    function gps(){ return POS ? { lat: +POS.coords.latitude.toFixed(6), lng: +POS.coords.longitude.toFixed(6), acc: Math.round(POS.coords.accuracy) } : null; }
    function draw(){
      if (!alive) return;
      var x = cv.getContext('2d'), vw = video.videoWidth || 16, vh = video.videoHeight || 9, s = Math.max(cv.width / vw, cv.height / vh);
      x.fillStyle = '#000'; x.fillRect(0, 0, cv.width, cv.height);
      if (vw > 16) x.drawImage(video, (cv.width - vw * s) / 2, (cv.height - vh * s) / 2, vw * s, vh * s);
      var g = gps(), now = new Date();
      x.fillStyle = 'rgba(0,0,0,.62)'; x.fillRect(0, cv.height - 58, cv.width, 58);
      x.fillStyle = '#FF5B14'; x.beginPath(); x.arc(22, cv.height - 29, 7, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 19px system-ui, sans-serif'; x.fillText('KOLABORO LIVE · ' + stamp(now), 38, cv.height - 34);
      x.font = '16px system-ui, sans-serif'; x.fillText(g ? 'GPS ' + g.lat.toFixed(5) + ', ' + g.lng.toFixed(5) + ' ±' + g.acc + ' m' : 'GPS: waiting for a fix', 38, cv.height - 12);
      x.textAlign = 'right'; x.fillText(opts.label || '', cv.width - 16, cv.height - 12); x.textAlign = 'left';
      requestAnimationFrame(draw);
    }
    function relay(){ if (!alive) return; if (!connected) { small.getContext('2d').drawImage(cv, 0, 0, 480, 270); opts.send('frame', { frame: small.toDataURL('image/jpeg', .55), gps: gps() }).catch(function(){}); } }
    function poll(){
      if (!alive || connected) return;
      opts.send('get', { want_answer: true }).then(function(d){
        if (d && d.answer && pc && !pc.currentRemoteDescription) { try { pc.setRemoteDescription(JSON.parse(d.answer)).catch(function(){}); } catch (e) {} }
        if (d && d.viewer_seen_at && Date.now() - new Date(d.viewer_seen_at).getTime() < 8000) st(connected ? 'Live: the viewer sees you' : 'The viewer is watching (picture relay)', 'ok');
      }).catch(function(){});
    }
    var api = {
      gps: gps,
      stop: function(){
        if (!alive) return api.done;
        alive = false; timers.forEach(clearInterval); timers.forEach(clearTimeout);
        if (watch != null) navigator.geolocation.clearWatch(watch);
        api.done = new Promise(function(res){
          function fin(){
            try { pc && pc.close(); } catch (e) {}
            if (stream) stream.getTracks().forEach(function(t){ t.stop(); });
            opts.send('end', {}).catch(function(){});
            var blob = new Blob(chunks, { type: (mime || 'video/webm').split(';')[0] });
            blob.arrayBuffer().then(function(b){ return crypto.subtle.digest('SHA-256', b); }).then(function(h){ res({ blob: blob, sha256: hex(h), duration: Math.round((Date.now() - started) / 1000), gps: gps(), track: track, mime: blob.type, started_at: new Date(started).toISOString() }); });
          }
          if (rec && rec.state !== 'inactive') { rec.onstop = fin; rec.stop(); } else fin();
        });
        return api.done;
      }
    };
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true }).catch(function(){ return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }).then(function(s){
      stream = s; video.srcObject = s; return video.play();
    }).then(function(){
      draw();
      out = cv.captureStream(15); stream.getAudioTracks().forEach(function(t){ out.addTrack(t); });
      ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].some(function(m){ if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) { mime = m; return true; } });
      if (window.MediaRecorder) { rec = new MediaRecorder(out, mime ? { mimeType: mime, videoBitsPerSecond: 700000 } : { videoBitsPerSecond: 700000 }); rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); }; rec.start(1000); }
      pc = new RTCPeerConnection(ICE);
      out.getTracks().forEach(function(t){ pc.addTrack(t, out); });
      pc.onconnectionstatechange = function(){ connected = pc.connectionState === 'connected'; if (connected) st('Live: the viewer sees you', 'ok'); };
      return pc.createOffer().then(function(o){ return pc.setLocalDescription(o); }).then(function(){ return gathered(pc); }).then(function(){ return opts.send('offer', { sdp: JSON.stringify(pc.localDescription), gps: gps() }); });
    }).then(function(){
      st('Waiting for the viewer…');
      timers.push(setInterval(poll, 1500), setInterval(relay, 1300));
      timers.push(setTimeout(function(){ if (alive) api.stop(); }, 300000));
      return api;
    });
    return api;
  }

  // opts: { stage: element, get: function(payload) -> Promise, answer: function(sdp) -> Promise, status: fn }
  function viewer(opts){
    var st = opts.status || function(){}, pc = null, since = null, alive = true, playing = false, img = document.createElement('img'), video = document.createElement('video'), info = document.createElement('div'), lastFrame = 0;
    video.autoplay = true; video.playsInline = true; video.controls = false; video.className = 'lv-v'; img.className = 'lv-v'; img.alt = 'Live picture from the site'; info.className = 'lv-info';
    opts.stage.innerHTML = ''; opts.stage.appendChild(img); opts.stage.appendChild(video); opts.stage.appendChild(info); video.style.display = 'none'; img.style.display = 'none';
    function tick(){
      if (!alive) return;
      opts.get({ want_offer: !pc, since: since, viewer: true }).then(function(d){
        if (!d || d.error) { st(d && d.error === 'room' ? 'This live session has ended or does not exist.' : 'Connecting…'); return; }
        if (d.live === false) { st('No live visit right now.'); return; }
        if (d.status === 'ended') { st('The live session ended.', 'end'); alive = false; return; }
        if (d.gps) info.textContent = 'GPS ' + (+d.gps.lat).toFixed(5) + ', ' + (+d.gps.lng).toFixed(5) + (d.gps.acc ? ' ±' + d.gps.acc + ' m' : '');
        if (d.frame && !playing) { img.src = d.frame; img.style.display = ''; since = d.frame_at; lastFrame = Date.now(); st('Live (picture relay, about one frame a second)', 'ok'); }
        if (d.offer && !pc) {
          pc = new RTCPeerConnection(ICE);
          pc.ontrack = function(e){ video.srcObject = e.streams[0]; video.play().catch(function(){ video.muted = true; video.play(); }); };
          pc.onconnectionstatechange = function(){ if (pc.connectionState === 'connected') { playing = true; video.style.display = ''; img.style.display = 'none'; st('Live video', 'ok'); } if (pc.connectionState === 'failed') { playing = false; video.style.display = 'none'; } };
          pc.setRemoteDescription(JSON.parse(d.offer)).then(function(){ return pc.createAnswer(); }).then(function(a){ return pc.setLocalDescription(a); }).then(function(){ return gathered(pc); }).then(function(){ return opts.answer(JSON.stringify(pc.localDescription)); }).catch(function(){ pc = null; });
        }
        if (!d.frame && !playing && !lastFrame) st('Waiting for the camera…');
      }).catch(function(){}).then(function(){ if (alive) setTimeout(tick, playing ? 4000 : 1300); });
    }
    tick();
    return { stop: function(){ alive = false; try { pc && pc.close(); } catch (e) {} } };
  }
  window.KBLive = { caster: caster, viewer: viewer, stamp: stamp };
})();
