/* King of Streets — configuración
   La clave de Google NO se guarda en el repositorio ni se le pide a nadie para
   poder jugar. Sin clave el juego arranca en vista Plano, que funciona entera.
   La clave solo hace falta para la vista fotorrealista de Google, y se guarda
   únicamente en el navegador de quien la pone.
   Si quieres fijarla para todos los visitantes, pon la cadena en FIJA_AQUI. */
(function(){
  var FIJA_AQUI = "";

  function saved(){ try { return localStorage.getItem('sk_gkey') || ''; } catch(e){ return ''; } }

  window.SK_CONFIG = { googleMapsKey: FIJA_AQUI || saved(), screenSpaceError: 12 };

  window.SK_setKey = function(k){
    try { localStorage.setItem('sk_gkey', (k || '').trim()); } catch(e){}
    location.reload();
  };
  window.SK_clearKey = function(){
    try { localStorage.removeItem('sk_gkey'); } catch(e){}
    location.reload();
  };

  var open = false;
  window.SK_askKey = function(){
    if (open) return;
    open = true;
    var w = document.createElement('div');
    w.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(6,9,13,.88);color:#E8EFF5;' +
      'display:flex;align-items:center;justify-content:center;padding:24px;font-family:Barlow,system-ui,sans-serif';
    w.innerHTML = '<div style="max-width:520px;width:100%;background:#0E141B;border:1px solid #24323F;border-radius:8px;padding:26px 24px">'
      + '<div style="font-family:\'Barlow Condensed\',Arial Narrow,sans-serif;font-size:26px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;line-height:1">Vista Google 3D</div>'
      + '<p style="color:#8296A8;font-size:14px;line-height:1.55;margin:12px 0 4px">El juego ya funciona sin esto en la vista <b>Plano</b>. Para conducir sobre la imagen fotorrealista de Google, pega una clave de <b>Google Maps Platform</b> con la <b>Map Tiles API</b> activada. Se guarda solo en este navegador.</p>'
      + '<div style="display:flex;gap:8px;margin-top:14px">'
      + '<input id="skkeyin" type="password" autocomplete="off" spellcheck="false" placeholder="AIza…" style="flex:1;background:#131C25;border:1px solid #24323F;color:#E8EFF5;border-radius:4px;padding:11px 12px;font-size:14px;font-family:inherit">'
      + '<button id="skkeygo" style="background:#FF5B3D;border:0;border-radius:4px;color:#180703;font-family:\'Barlow Condensed\',Arial Narrow,sans-serif;font-weight:700;font-size:15px;letter-spacing:.1em;text-transform:uppercase;padding:11px 20px;cursor:pointer">Activar</button>'
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;gap:14px">'
      + '<p style="color:#5A6D7E;font-size:11.5px;line-height:1.6;margin:0">Restringe la clave por referente HTTP a tu dominio y limítala a la Map Tiles API. Google cobra por sesión, no por tile: 1.000 sesiones gratis al mes y unos 0,006 $ después. Para borrarla, <code style="color:#8296A8">SK_clearKey()</code> en la consola.</p>'
      + '<button id="skkeyno" style="flex:none;background:none;border:1px solid #24323F;border-radius:4px;color:#8296A8;font-family:\'Barlow Condensed\',Arial Narrow,sans-serif;font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:9px 14px;cursor:pointer">Ahora no</button>'
      + '</div></div>';
    document.body.appendChild(w);

    var i = w.querySelector('#skkeyin');
    function close(){ open = false; if (w.parentNode) w.parentNode.removeChild(w); document.removeEventListener('keydown', esc); }
    function esc(e){ if (e.key === 'Escape') close(); }
    function go(){ if (i.value.trim()) SK_setKey(i.value); }
    w.querySelector('#skkeygo').onclick = go;
    w.querySelector('#skkeyno').onclick = close;
    w.addEventListener('click', function(e){ if (e.target === w) close(); });
    document.addEventListener('keydown', esc);
    i.addEventListener('keydown', function(e){ if (e.key === 'Enter') go(); });
    i.focus();
  };
})();
