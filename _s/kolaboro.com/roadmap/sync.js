/* Roadmap sync: items with data-live link to the page that delivers them. Every night GitHub Actions (tools/kolaboro-ship)
   fetches each linked page and writes /data/roadmap-sync.json. An item is shown as shipped only when that check passed:
   HTTP 200, the canonical link is the linked page, and the page contains the item's data-mark text. */
(function () {
  'use strict';
  fetch('/data/roadmap-sync.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (R) {
    var by = {}; (R.items || []).forEach(function (i) { by[i.n] = i; });
    var when = String(R.generated_at || '').slice(0, 10);
    [].forEach.call(document.querySelectorAll('.rm-i[data-live]'), function (li) {
      var num = li.querySelector('.rm-n'); var i = num && by[+num.textContent]; if (!i) return;
      var em = li.querySelector('em'); var box = li.querySelector('div');
      var note = document.createElement('p'); note.className = 'rm-live';
      note.style.cssText = 'font-size:.8rem;margin-top:4px';
      if (i.shipped) {
        li.className = 'rm-i st-shipped'; li.dataset.s = 'shipped';
        if (em) { em.className = 'rm-shipped'; em.textContent = 'Shipped'; }
        note.innerHTML = 'Live: <a href="' + i.page.replace(/"/g, '') + '">' + i.page.replace(/</g, '&lt;') + '</a>, checked ' + when;
      } else {
        note.textContent = 'Linked page ' + i.page + ' failed the live check on ' + when + ' (HTTP ' + i.http + (i.marker_found ? '' : ', marker missing') + ')';
      }
      if (box) box.appendChild(note);
    });
    // recount progress, theme and filter numbers from the items as now shown
    var all = document.querySelectorAll('.rm-i'), c = { shipped: 0, building: 0, next: 0 };
    [].forEach.call(all, function (li) { c[li.dataset.s] = (c[li.dataset.s] || 0) + 1; });
    var t = all.length || 1;
    var bar = document.querySelector('.rm-bar');
    if (bar) { var s = bar.querySelector('.s'), b = bar.querySelector('.b'); if (s) s.style.width = Math.round(100 * c.shipped / t) + '%'; if (b) b.style.width = Math.round(100 * c.building / t) + '%'; }
    var p = document.querySelector('.rm-prog p');
    if (p) p.innerHTML = '<b>' + c.shipped + ' shipped</b> &middot; ' + c.building + ' building &middot; ' + c.next + ' next &middot; ' + (R.verified_live || 0) + ' of ' + (R.linked || 0) + ' linked items checked live on ' + when + ' (<a href="/shipping/#roadmap">how</a>)';
    [].forEach.call(document.querySelectorAll('.rm-fil button'), function (bt) {
      var k = bt.dataset.s; var lab = { '': 'All', shipped: 'Shipped', building: 'Building', next: 'Next' }[k];
      if (lab) bt.textContent = k ? lab + ' (' + (c[k] || 0) + ')' : 'All ' + all.length;
    });
    [].forEach.call(document.querySelectorAll('.rm-th'), function (th) {
      var sm = th.querySelector('h2 small'); if (!sm) return;
      var its = th.querySelectorAll('.rm-i'), k = th.querySelectorAll('.rm-i.st-shipped').length;
      sm.textContent = k + ' of ' + its.length + ' shipped';
    });
  }).catch(function () {});
})();
