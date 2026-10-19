/* Ory - interacciones del tema.
   Vanilla, sin dependencias, ~2 KB. Nada bloquea el renderizado. */
(function () {
  'use strict';

  /* --- Menu movil --- */
  var burger = document.getElementById('ory-burger');
  var nav = document.getElementById('ory-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Barra de progreso, solo en articulos --- */
  var bar = document.getElementById('ory-progress');
  var article = document.querySelector('.is-article .entry');
  if (bar && article) {
    var tick = function () {
      var box = article.getBoundingClientRect();
      var total = box.height - window.innerHeight;
      var done = total > 0 ? (-box.top / total) : 0;
      bar.style.width = Math.min(100, Math.max(0, done * 100)) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick, { passive: true });
    tick();
  }

  /* --- Cabecera que se esconde al bajar --- */
  var head = document.getElementById('ory-head');
  var last = 0;
  if (head) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > last && y > 400) {
        head.classList.add('hide');
      } else {
        head.classList.remove('hide');
      }
      last = y;
    }, { passive: true });
  }

  /* --- Barra fija de suscripcion ---
     Aparece al 45% de la pagina. Si la cierras, no vuelve en toda la sesion. */
  var sbar = document.getElementById('ory-bar');
  if (sbar) {
    var dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem('oryBar') === '1';
    } catch (e) { /* modo privado: seguimos sin recordar */ }

    var x = document.getElementById('ory-bar-x');
    if (x) {
      x.addEventListener('click', function () {
        sbar.classList.remove('on');
        dismissed = true;
        try { window.sessionStorage.setItem('oryBar', '1'); } catch (e) {}
      });
    }
    window.addEventListener('scroll', function () {
      if (dismissed) { return; }
      var h = document.body.scrollHeight - window.innerHeight;
      sbar.classList.toggle('on', h > 0 && (window.scrollY / h) > 0.45);
    }, { passive: true });
  }

  /* --- Copiar enlace --- */
  var copy = document.getElementById('ory-copy');
  if (copy && navigator.clipboard) {
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(copy.dataset.url).then(function () {
        var old = copy.textContent;
        copy.textContent = 'Copiado';
        setTimeout(function () { copy.textContent = old; }, 1600);
      });
    });
  }
})();
