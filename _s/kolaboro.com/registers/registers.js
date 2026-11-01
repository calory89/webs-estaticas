(function(){
  var cards = [].slice.call(document.querySelectorAll('#rgCards .rgc'));
  if (!cards.length) return;
  var jump = [].slice.call(document.querySelectorAll('#rgJump a'));
  var count = document.getElementById('rgCount'), empty = document.getElementById('rgEmpty');
  var LABEL = {}; [].forEach.call(document.querySelectorAll('.fchip[data-check]'), function(b){ if (b.dataset.check) LABEL[b.dataset.check] = b.textContent.toLowerCase(); });
  var state = { region: '', check: '' };
  try { var q = new URLSearchParams(location.search); state.region = q.get('region') || ''; state.check = q.get('check') || ''; } catch (e) {}

  function apply(push){
    var shown = 0;
    cards.forEach(function(c){
      var okR = !state.region || c.dataset.r === state.region;
      var regs = [].slice.call(c.querySelectorAll('.rg')), any = false;
      regs.forEach(function(r){ var m = !state.check || (' ' + r.dataset.c + ' ').indexOf(' ' + state.check + ' ') >= 0; r.hidden = !m; if (m) any = true; });
      var vis = okR && any; c.hidden = !vis; if (vis) shown++;
    });
    jump.forEach(function(a){ var c = document.getElementById(a.getAttribute('href').slice(1)); a.parentNode.hidden = !c || c.hidden; });
    [].forEach.call(document.querySelectorAll('.fchip'), function(b){
      var k = b.hasAttribute('data-region') ? 'region' : 'check'; b.setAttribute('aria-pressed', String((b.getAttribute('data-' + k) || '') === state[k]));
    });
    var txt = shown === cards.length && !state.check ? 'Showing all ' + cards.length + ' markets.' :
      'Showing ' + shown + ' of ' + cards.length + ' markets' + (state.check ? ' with a source for ' + LABEL[state.check] : '') + '.';
    count.textContent = txt; empty.hidden = shown > 0;
    if (push) { try { var p = new URLSearchParams(); if (state.region) p.set('region', state.region); if (state.check) p.set('check', state.check); var s = p.toString(); history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (e) {} }
  }
  document.querySelector('.rg-filters').addEventListener('click', function(e){
    var b = e.target.closest('.fchip'); if (!b) return;
    var k = b.hasAttribute('data-region') ? 'region' : 'check'; state[k] = b.getAttribute('data-' + k) || ''; apply(true);
  });
  // a country anchor must always be visible, even with filters set
  function reveal(){
    var id = location.hash.slice(1); if (!id) return; var c = document.getElementById(id);
    if (!c || !c.classList.contains('rgc')) return; if (c.hidden) { state.region = ''; state.check = ''; apply(true); }
    var go = function(){ c.scrollIntoView(); }; setTimeout(go, 0); if (document.readyState !== 'complete') addEventListener('load', function(){ setTimeout(go, 50); }, { once: true });
  }
  apply(false); reveal();
  addEventListener('hashchange', reveal);
})();
