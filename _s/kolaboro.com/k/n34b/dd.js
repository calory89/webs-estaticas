/* Kolaboro due-diligence builder (n34b, 21 Nov 2026): fills the project picker with every public project from the static index
   (/data/n34b-search.json) the first time the field gets focus. The form itself works without JavaScript. */
(function () {
  var i = document.querySelector('.n34 input[name=p]'), dl = document.getElementById('n34-dl'), done = false;
  if (!i || !dl) return;
  i.addEventListener('focus', function () {
    if (done) return; done = true;
    fetch('/data/n34b-search.json').then(function (r) { return r.json(); }).then(function (d) {
      var f = document.createDocumentFragment();
      d.p.forEach(function (r) { if (/eco\s*beach|\bequinox\b|\bsumba\b/i.test(r[1] + ' ' + r[3] + ' ' + r[5] + ' ' + r[7])) return; var o = document.createElement('option'); o.value = r[1] + ' (' + r[2] + ')'; o.label = [r[3], r[5]].filter(Boolean).join(' · '); f.appendChild(o); });
      dl.appendChild(f);
    }).catch(function () { done = false; });
  });
})();
