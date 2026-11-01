/* Personal off-plan checklist: items from /standard/ (six core checks), /registers/ (window.KREG) and the buyer's choices. Saved only in localStorage. */
(function(){
  var KT = window.KT, R = window.KREG, $ = function(i){ return document.getElementById(i); }, esc = KT.esc;
  var KEY = 'kb-my-checklist-v1', C = [], ticks = {}, last = [];
  var G = [['sign', 'Before you sign'], ['pay', 'Before each payment'], ['hand', 'Before handover']];
  var TYPE = { apartment: 'apartment', villa: 'villa', hotel: 'hotel or branded residence', land: 'land plot' };
  var TITLE = { freehold: 'freehold', leasehold: 'leasehold', company: 'through a company' };
  /* completion certificate names, from /registers/ */
  var OCC = { indonesia: 'the SLF (Sertifikat Laik Fungsi) issued through SIMBG', turkey: 'the occupancy permit (iskan)', spain: 'the first occupation licence (or equivalent) from the town hall', portugal: 'the licence of use from the municipality', usa: 'the certificate of occupancy from the city or county building department' };
  var CKN = { permit: 'permit', escrow: 'deposit protection', title: 'land title', company: 'developer company', env: 'environmental approval' };

  function store(){ try { return window.localStorage; } catch (e) { return null; } }
  function readSaved(){ try { var s = store(); var v = s && s.getItem(KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeSaved(o){ try { var s = store(); if (!s) return false; s.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; } }

  function val(name){ var el = document.querySelector('#mcForm input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function setVal(name, v){ var el = document.querySelector('#mcForm input[name="' + name + '"][value="' + v + '"]'); if (el) el.checked = true; }
  function inputs(){ return { market: $('mcMarket').value, type: val('type'), title: val('title'), stage: val('stage'), mortgage: val('mortgage'), rental: val('rental') }; }

  function share(list, k){ var n = list.filter(function(c){ return KT.ok(c, k); }).length; return n + ' of ' + list.length; }

  function build(o){
    var I = [], s = KT.parse(o.market), sub = s ? KT.subset(C, s) : [], an = s ? KT.anchors(C, s) : [], where = s ? s.name : '';
    var a0 = an[0] || '', fl = s && (KT.isFlorida(s) || s.type === 'country');
    function add(id, g, t, d, tag, links){ I.push({ id: id, g: g, t: t, d: d, tag: tag || '', links: links || [] }); }
    function dat(k){ return sub.length ? ' In ' + where + ', ' + share(sub, k) + ' tracked projects publish this.' : ''; }
    var std = function(a){ return ['/standard/#' + a, 'Standard ' + a.toUpperCase()]; };

    /* Before you sign: the six core checks */
    add('d1', 'sign', 'Get the permit or licence number and look it up yourself',
      'Ask for the number exactly as issued, the issuing authority, the date, the plot it covers and the number of units approved. Open the official register yourself, not a link the seller sent, and check that project name, developer company, plot, phase and unit count all match.' + dat('permit'), 'D1', [std('d1')]);
    if (o.stage === 'off-plan') add('st-op', 'sign', 'Make sure the permit exists before any money changes hands',
      'Nothing is built yet, so the permit, the land title and the deposit protection are your only evidence. "Permits in process" is not a permit.', 'Off-plan');
    add('d2', 'sign', 'Find out exactly how your payments are protected',
      'Who holds the money (the bank and the account holder), whether the account is in the name of the project or an escrow agent, on what milestone money is released, and what happens if the project stops. The account should be named in the signed contract, never only in an email or chat.' + dat('escrow'), 'D2',
      [std('d2'), ['/tools/deposit-protection/' + (s ? '?' + (s.type === 'country' ? 'country=' : 'market=') + encodeURIComponent(s.name) : ''), 'Deposit protection finder']]);
    add('d4', 'sign', 'Get the plans and specification attached to the contract',
      o.type === 'land' ? 'A site plan showing your plot with its area and boundaries, and the plan of shared roads and services, as an annex of the sales contract.' + dat('plans')
        : 'A site plan, floor plans with areas and how they are measured, and a specification of materials, finishes and fittings, as an annex of the sales contract.' + dat('plans'), 'D4', [std('d4')]);
    add('d5', 'sign', 'Check the company you are signing with',
      'Get the legal name of the selling company, its registration number and the registry it is in, and a list of delivered projects with addresses and completion years. Visit one or ask owners there.' + dat('record'), 'D5', [std('d5')]);
    add('d6', 'sign', 'Treat any return figure as an estimate',
      'A guarantee counts only if it is written, enforceable and given by a named party with its terms published. Any rental projection should be labelled an estimate and show its assumptions.' + dat('returns_ok'), 'D6', [std('d6')]);
    add('r1', 'sign', 'Find out who holds the land',
      'The land title number and type, the registered owner (the developer, or a landowner under a named agreement) and any mortgage on the land, with how it will be released at handover.', 'Land', [std('r1')]);
    add('r6', 'sign', 'Read the full sales contract before paying any reservation fee',
      'In a language you read, with the governing law and dispute venue, and reviewed by your own independent lawyer, not one introduced by the seller.', 'Contract', [std('r6')]);
    if (o.type !== 'land') add('r3', 'sign', 'Get the completion date and delay penalty into the contract',
      'The contractual completion date, any grace period, a penalty per month of delay, and the right to cancel with a refund after a long delay.', 'Delay', [std('r3')]);
    add('r4', 'sign', 'Tie every payment to a milestone you can check',
      o.type === 'land' ? 'Ideally the balance is paid when the title or lease is registered in your name, not on calendar dates.' : 'Foundations, structure, roof and handover, each certified, not only calendar dates. Avoid large discounts for paying everything up front.', 'Payments', [std('r4')]);
    if (o.type !== 'land') add('r5', 'sign', 'Get the service charges in writing',
      'Expected yearly charges per unit or per m2, what they cover, who sets them and how they can change' + (o.rental === 'yes' || o.type === 'hotel' ? ', plus any rental pool or management fees.' : '.'), 'Costs', [std('r5')]);

    /* Stage */
    if (o.stage === 'under construction') add('st-uc', 'sign', 'Compare the site with the original schedule',
      'Ask for a dated progress percentage, or dated photos from the same viewpoints, and compare them with the timeline you were first given. Ask whether the completion date was ever extended and why.', 'Under construction', [std('d3'), ['/satellite/', 'Satellite watch']]);

    /* Property type */
    if (o.type === 'apartment') {
      add('ty-ap', 'sign', 'Check the building, not only your unit',
        'The number of units approved on the permit should match the building being sold. Ask whether the condominium or strata regime is recorded, or when it will be, and how the floor area of your unit is measured.', 'Apartment');
      if (an.indexOf('thailand') >= 0) add('ty-th', 'sign', 'Ask how much of the foreign quota is left',
        'Foreigners cannot own land in Thailand, but can own condo units within the building’s 49% foreign quota.', 'Thailand', [['/registers/#thailand', 'Registers: Thailand']]);
    }
    if (o.type === 'villa') add('ty-vi', 'sign', 'Check your own plot',
      'The boundaries and land title of your plot, not only of the whole site, road access, and who owns and maintains shared roads, pools and gardens.', 'Villa');
    if (o.type === 'hotel') {
      add('ty-op', 'sign', 'Read the operator agreement',
        'Who operates the hotel, for how long, how the agreement can end, and what happens to your unit and its income if the operator or the brand leaves.', 'Hotel residence');
      add('ty-rp', 'sign', 'Read the rental pool terms',
        'Whether you must join the pool, how income is split, which fees come off before your share, how often you are paid and how many nights you can use the unit yourself.', 'Hotel residence');
      add('ty-tl', 'sign', 'Check the tourism licence or classification',
        'Where the hotel part needs one, check it on the official tourism register, and that it covers this project and not an earlier phase.', 'Hotel residence');
    }
    if (o.type === 'land') add('ty-la', 'sign', 'Check what you are allowed to build',
      'Zoning and permitted use, a survey of the boundaries, road access, water and power connections, and whether an environmental approval is needed. Buying a plot gives you no building permit.', 'Land plot');

    /* Title */
    if (o.title === 'freehold') {
      add('ti-fh', 'sign', 'Confirm you can hold freehold here, in your own name',
        'Ask an independent lawyer whether a foreign buyer may own this property outright, and check the title type in the land registry. "Freehold through a trusted local partner" is a nominee arrangement, not ownership.', 'Freehold', [std('r2')]);
      if (an.indexOf('indonesia') >= 0) add('ti-id', 'sign', 'Indonesia: foreigners cannot hold Hak Milik',
        'Foreigners cannot hold freehold (Hak Milik) land. Offers of "freehold" to foreigners usually rely on a nominee, which is not legal protection.', 'Indonesia', [['/registers/#indonesia', 'Registers: Indonesia']]);
    }
    if (o.title === 'leasehold') {
      add('ti-lr', 'sign', 'Check the lease will be registered, and its real term',
        'The lease should be registered in your own name, with the base term and start date you were told. Ask whether the term runs from today or from completion.', 'Leasehold', [std('r2')]);
      add('ti-lx', 'sign', 'Read the extension clause',
        'An extension should be a binding clause with a fixed price or formula, not only a promise. Ask what happens to the lease on resale and on inheritance.', 'Leasehold');
    }
    if (o.title === 'company') add('ti-co', 'sign', 'Check the company that will hold the property',
      'Who owns the shares and in whose name, that the company is in the official company registry, the yearly running costs and filings, and that no nominee shareholder or director holds your interest.', 'Company');
    if (an.indexOf('mexico') >= 0 && o.title !== 'leasehold') add('ti-mx', 'sign', 'Mexico: fideicomiso or Mexican company',
      'Foreigners buying in the coastal or border restricted zone hold property through a bank trust (fideicomiso) or a Mexican company. Ask which one, and which bank is the trustee.', 'Mexico', [['/registers/#mexico', 'Registers: Mexico']]);

    /* Mortgage and rental */
    if (o.mortgage === 'yes') {
      add('mo-dev', 'sign', 'Check your lender will lend on this project',
        'Many lenders approve the developer and the project before lending on off-plan property. Get the lender’s approval of the developer and an approval in principle for yourself before you sign.', 'Mortgage');
      add('mo-cl', 'sign', 'Ask for a finance clause',
        'What happens to your deposit if the mortgage is refused or the valuation comes in lower than the price.', 'Mortgage');
    }
    if (o.rental === 'yes') {
      add('re-ok', 'sign', 'Check you are allowed to rent it out',
        'Short-term rental rules and licences where the property is, and any building or owners’ association rules on letting.', 'Rental');
      add('re-num', 'sign', 'Test the rental numbers yourself',
        'Ask for the assumptions behind any projection: occupancy, nightly rate, management fees, service charges and tax. Compare them with real figures from owners in delivered projects.', 'Rental', [['/tools/yield-check/', 'Yield check']]);
    }
    add('r7', 'sign', 'Ask how complaints are handled',
      'A named contact, the response time, and the regulator, ombudsman or court you can go to if you are not satisfied.', 'Complaints', [std('r7')]);

    /* Market registers */
    if (s && !an.length) add('mk-none', 'sign', 'Find the official registers yourself',
      'Our registers guide does not cover ' + where + ' yet. Ask the developer which authority issued each permit and licence, then look it up on that authority’s own website.', where, [['/registers/', 'Registers guide']]);
    an.forEach(function(a){
      var c = R.get(a), d = R.DEP[a]; if (!c) return;
      c.regs.forEach(function(r, i){
        if (a === 'usa' && /Florida/.test(r.name) && !fl) return;
        if (o.type !== 'hotel' && /Tourism|CONFOTUR/.test(r.name) && r.checks.length === 1) return;
        var g = /after you sign/i.test(r.how) ? 'pay' : 'sign';
        add('rg-' + a + '-' + i, g, 'Check it on ' + r.name,
          r.how + ' What it proves: ' + r.proves, c.name + ': ' + r.checks.map(function(k){ return CKN[k]; }).join(', '),
          (r.url ? [[r.url, 'Official site']] : []).concat([['/registers/#' + a, 'Registers: ' + c.name]]));
      });
      if (d && /law|list|state/.test(d.kind)) add('rg-' + a + '-pay', 'pay', 'Confirm the protected account before paying (' + c.name + ')', d.where, c.name + ': deposit protection', [['/registers/#' + a, 'Registers: ' + c.name]]);
    });

    /* Before each payment */
    add('p-ms', 'pay', 'Confirm the milestone is really reached',
      'Ask for dated progress certified by an independent engineer or taken from the regulator, and compare it with the site. Do not pay for work that is not done.' + dat('progress'), 'D3', [std('d3')]);
    add('p-acc', 'pay', 'Pay only into the account named in your contract',
      'Never to a person, a sales agent or a new account sent by email or chat. If you are told the bank details changed, confirm it with the bank or developer using contact details you already had.', 'D2', [std('d2')]);
    add('p-rec', 'pay', 'Get a receipt in your name for every payment',
      an.indexOf('spain') >= 0 ? 'In Spain, also an individual bank guarantee or insurance certificate in your name for each payment, confirmed with the issuing bank or insurer.' : 'Keep the receipt with the payment confirmation and the progress evidence you were shown.', 'Records');
    add('p-reg', 'pay', 'Check the permit or licence is still valid',
      'Look at the register again: permits and licences expire, and projects can be listed as delayed or placed under orders that stop sales.', 'D1');
    add('p-news', 'pay', 'Check news, courts and regulator notices',
      'Search for the developer and the project since your last payment. Stop paying until anything new is explained in writing.', 'Public record', s && s.type === 'market' ? [['/m/?market=' + encodeURIComponent(s.name), 'Market file: ' + s.name]] : []);
    if (o.mortgage === 'yes') add('p-mo', 'pay', 'Line each payment up with your lender',
      'Which payments the lender will fund and when, and whether it inspects the site before releasing money.', 'Mortgage');

    /* Before handover */
    add('h-occ', 'hand', 'Get the completion or occupancy certificate',
      'The official certificate that the building is finished and fit for use' + (OCC[a0] ? ': ' + OCC[a0] + '.' : '.') + (o.type === 'land' ? ' For a plot, get the final survey with marked boundaries instead.' : ''), 'Completion');
    if (o.type !== 'land') add('h-ins', 'hand', 'Inspect the unit against the plans and specification',
      'Measure the area the way the contract defines it, and list every defect in writing before you accept the keys.', 'D4');
    add('h-title', 'hand', o.title === 'leasehold' ? 'Get the lease registered in your name' : o.title === 'company' ? 'Get the property registered to your company' : 'Get the title registered in your name',
      (o.title === 'leasehold' ? 'Check the registered term and start date match the contract, and that the extension clause is in the registered lease. ' : '') + 'Check that the developer’s mortgage on the land has been released for your unit.', 'Title');
    if (o.type !== 'land') add('h-delay', 'hand', 'Claim any delay penalty you are owed', 'Compare the handover date with the contractual date and grace period, and claim the penalty in writing.', 'Delay', [std('r3')]);
    if (o.type !== 'land') add('h-oa', 'hand', 'Get the service charge budget and the owners’ association details', 'Who manages the building or estate, the first year’s budget, and how owners vote.', 'Costs');
    if (o.type === 'hotel') add('h-op', 'hand', 'Get the signed operator agreement and the pool start date', 'And the first statement date, and who to contact about your unit.', 'Hotel residence');
    if (o.rental === 'yes') add('h-re', 'hand', 'Set up the rental before you take the keys', 'Sign the management agreement, get any rental licence, and check your insurance covers letting.', 'Rental');
    if (o.mortgage === 'yes') add('h-mo', 'hand', 'Book the lender’s final valuation and sign-off', 'So the last payment and the registration of the mortgage happen together.', 'Mortgage');
    add('h-last', 'hand', 'Pay the final amount only when all of the above is done', 'Hold back the last payment until the certificate, the inspection and the registration are in hand.', 'Payments');
    return I;
  }

  function summary(o){
    var s = KT.parse(o.market);
    return [s ? s.name : 'any market', TYPE[o.type], TITLE[o.title], o.stage, o.mortgage === 'yes' ? 'with a mortgage' : 'no mortgage', o.rental === 'yes' ? 'to rent out' : 'not renting out'].join(' · ');
  }

  function render(){
    var o = inputs(); last = build(o);
    var n = 0, h = '';
    G.forEach(function(g){
      var items = last.filter(function(x){ return x.g === g[0]; }); if (!items.length) return;
      h += '<section class="mc-grp" aria-labelledby="mcg-' + g[0] + '"><h3 id="mcg-' + g[0] + '">' + g[1] + ' <span class="tq-small">(' + items.length + ')</span></h3><ol class="mc-list" start="' + (n + 1) + '">';
      items.forEach(function(x){ n++; x.n = n;
        h += '<li class="mc-it' + (ticks[x.id] ? ' is-done' : '') + '"><input type="checkbox" id="mci-' + x.id + '" data-id="' + x.id + '"' + (ticks[x.id] ? ' checked' : '') + '>' +
          '<label for="mci-' + x.id + '"><span class="mc-n" aria-hidden="true">' + n + '</span><span class="mc-tx"><b>' + esc(x.t) + '</b>' + (x.tag ? ' <span class="tq-tag is-mid">' + esc(x.tag) + '</span>' : '') + '<span class="mc-d">' + esc(x.d) + '</span></span></label>' +
          (x.links.length ? '<p class="mc-ln">' + x.links.map(function(l){ var ext = /^https?:/.test(l[0]); return '<a href="' + esc(l[0]) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l[1]) + (ext ? '<span class="sr-only"> (opens in a new tab)</span>' : '') + '</a>'; }).join('') + '</p>' : '') + '</li>';
      });
      h += '</ol></section>';
    });
    $('mcList').innerHTML = h;
    var done = last.filter(function(x){ return ticks[x.id]; }).length;
    $('mcTitle').textContent = n + '-point checklist';
    $('mcSum').textContent = summary(o) + ' · ' + done + ' of ' + n + ' done';
  }

  function text(){
    var o = inputs(), out = ['Your off-plan checklist', summary(o), ''];
    G.forEach(function(g){
      var items = last.filter(function(x){ return x.g === g[0]; }); if (!items.length) return;
      out.push(g[1].toUpperCase());
      items.forEach(function(x){ out.push((ticks[x.id] ? '[x] ' : '[ ] ') + x.n + '. ' + x.t + ': ' + x.d + (x.links.length ? ' (' + x.links.map(function(l){ return /^https?:/.test(l[0]) ? l[0] : 'https://kolaboro.com' + l[0]; }).join(', ') + ')' : '')); });
      out.push('');
    });
    out.push('Built with https://kolaboro.com/tools/my-checklist/ . Information, not legal advice.');
    return out.join('\n');
  }
  function msg(t){ $('mcMsg').textContent = t; }
  function save(manual){ var ok = writeSaved({ v: 1, inputs: inputs(), ticks: ticks, at: new Date().toISOString() }); if (manual) msg(ok ? 'Saved in this browser. It will be here when you come back on this device.' : 'This browser does not allow saving. Copy the text or print it instead.'); return ok; }
  function copy(){
    var t = text();
    function done(){ msg('Copied as text. Paste it into a note or an email.'); }
    function fallback(){ var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { msg('Copy did not work here. Use print instead.'); } document.body.removeChild(a); }
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback); else fallback(); } catch (e) { fallback(); }
  }

  $('mcForm').addEventListener('change', function(){ render(); save(false); });
  $('mcList').addEventListener('change', function(e){ var id = e.target.getAttribute('data-id'); if (!id) return; if (e.target.checked) ticks[id] = 1; else delete ticks[id]; var li = e.target.closest('.mc-it'); if (li) li.classList.toggle('is-done', e.target.checked); var done = last.filter(function(x){ return ticks[x.id]; }).length; $('mcSum').textContent = summary(inputs()) + ' · ' + done + ' of ' + last.length + ' done'; save(false); });
  $('mcPrint').addEventListener('click', function(){ window.print(); });
  $('mcCopy').addEventListener('click', copy);
  $('mcSave').addEventListener('click', function(){ save(true); });
  $('mcClear').addEventListener('click', function(){ ticks = {}; render(); save(false); msg('Ticks cleared.'); });

  var saved = readSaved();
  if (saved && saved.inputs) { ['type', 'title', 'stage', 'mortgage', 'rental'].forEach(function(k){ if (saved.inputs[k]) setVal(k, saved.inputs[k]); }); ticks = saved.ticks || {}; }
  render();
  KT.load().then(function(d){
    C = d.cases || [];
    var sel = $('mcMarket'); KT.fillSelect(sel, C, { placeholder: 'No market chosen' }); sel.disabled = false;
    var p = {}; try { var u = new URLSearchParams(location.search); p.m = u.get('market'); p.c = u.get('country'); } catch (e) {}
    var want = (p.m || p.c) ? KT.value(KT.find(C, p.m || p.c)) : (saved && saved.inputs && saved.inputs.market) || '';
    if (want && Array.prototype.some.call(sel.options, function(x){ return x.value === want; })) sel.value = want;
    $('mcUpd').textContent = 'Live data updated ' + (d.updated || '') + ': ' + KT.fmt(C.length) + ' projects in ' + KT.fmt(KT.groups(C).length) + ' countries.';
    render();
  }).catch(function(){
    var sel = $('mcMarket'); sel.innerHTML = '<option value="">Markets unavailable right now</option>';
    $('mcUpd').textContent = 'Live data unavailable right now: the checklist works without market links.';
  });
})();
