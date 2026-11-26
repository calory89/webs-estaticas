/* /embed/charts/ snippet builder (n34c, 21 Nov 2026): updates the two snippets and the preview from the form. */
(function () {
  var f = document.getElementById('ec-f'); if (!f) return;
  var m = document.getElementById('ec-m'), k = document.getElementById('ec-k'), d = document.getElementById('ec-d'), s1 = document.getElementById('ec-s1'), s2 = document.getElementById('ec-s2'), pv = document.getElementById('ec-prev');
  var v = f.getAttribute('data-v'), l = f.getAttribute('data-l');
  function go() {
    var q = 'kind=' + k.value + (l !== 'en' ? '&lang=' + l : '') + (d.checked ? '&theme=dark' : ''), name = m.options[m.selectedIndex].text;
    s1.textContent = '<iframe src="https://kolaboro.com/embed/chart/' + m.value + '/?' + q + '" width="380" height="' + (k.value === 'delays' ? 250 : 230) + '" loading="lazy" title="Kolaboro: ' + name + '" style="border:0"></iframe>';
    s2.textContent = '<script type="module" src="https://kolaboro.com/k/n34c/chart.js?v=' + v + '"></script>\n<kolaboro-chart market="' + m.value + '" kind="' + k.value + '"' + (l !== 'en' ? ' lang="' + l + '"' : '') + (d.checked ? ' theme="dark"' : '') + '></kolaboro-chart>';
    pv.textContent = ''; var i = document.createElement('iframe'); i.src = '/embed/chart/' + m.value + '/?' + q; i.width = 380; i.height = k.value === 'delays' ? 250 : 230; i.loading = 'lazy'; i.title = name; pv.appendChild(i);
  }
  [m, k, d].forEach(function (e) { e.addEventListener('change', go); });
})();
