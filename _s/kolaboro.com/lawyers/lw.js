/* Lawyer and notary partner applications: same kolaboro_apply RPC the site newsletter uses (k/site.js) */
(function () {
  var URL_ = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_apply';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
  var f = document.getElementById('lwF'); if (!f) return;
  var m = document.getElementById('lwM'), busy = false;
  function v(n) { return (f.elements[n].value || '').trim(); }
  function say(t, cls) { m.textContent = t; m.className = 'bz-msg' + (cls ? ' ' + cls : ''); }
  f.addEventListener('submit', function (e) {
    e.preventDefault(); if (busy) return;
    if (v('website')) { say('Thank you. Your application was sent.', 'bz-good'); f.reset(); return; }
    var need = [['name', 'your name'], ['firm', 'your firm'], ['country', 'the country you practise in']];
    for (var i = 0; i < need.length; i++) if (!v(need[i][0])) { say('Please add ' + need[i][1] + '.', 'bz-err'); f.elements[need[i][0]].focus(); return; }
    var em = v('email');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { say('Please enter a valid email address.', 'bz-err'); f.elements.email.focus(); return; }
    var country = v('country').slice(0, 80);
    var bring = ['Firm: ' + v('firm'), 'Languages: ' + (v('languages') || 'not given'), 'Practice areas: ' + (v('areas') || 'not given'), v('msg') ? 'Notes: ' + v('msg') : ''].filter(Boolean).join('\n');
    busy = true; say('Sending your application');
    var btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    fetch(URL_, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_name: v('name').slice(0, 120), p_email: em, p_country: country, p_phone: '', p_who: 'lawyer-partner | ' + country,
        p_bring: bring.slice(0, 4000), p_learn: v('firm').slice(0, 300), p_week: '', p_lang: 'en', p_source: 'lawyer-partner', p_plan: 'lawyer-partner' }) })
      .then(function (r) { return r.json(); }).then(function (d) {
        if (d === 'ok' || d === 'too_many') { f.reset(); say('Thank you. Your application was sent. We will reply by email to ' + em + '.', 'bz-good'); if (window.kbEvent) kbEvent('lawyer_partner_apply'); return; }
        throw 0;
      }).catch(function () { say('Could not send. Please try again in a moment.', 'bz-err'); })
      .then(function () { busy = false; btn.disabled = false; });
  });
})();
