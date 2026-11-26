/* Personal off-plan checklist: items from /standard/ (six core checks), /registers/ (window.KREG) and the buyer's choices. Saved only in localStorage. */
(function(){
  var LG0 = String(document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
  function start(){
  var KT = window.KT, R = window.KREG, $ = function(i){ return document.getElementById(i); }, esc = KT.esc;
  // n40 L10: the strings this script writes follow the page language (<html lang>), from /tools/my-checklist/mc-tx.js (loaded only on
  // the translated pages: English source strings in KMC_TX.k, each language index-aligned); English by default, unchanged.
  var LG = String(document.documentElement.lang || 'en').slice(0, 2).toLowerCase(), X = window.KMC_TX, S = null, LOC = 'en';
  if (LG !== 'en' && X && X[LG]) { S = {}; X.k.forEach(function(k, i){ var v = X[LG][i]; if (v) S[k] = v; }); LOC = { zh: 'zh-CN', ar: 'ar-u-nu-latn' }[LG] || LG; }
  function _(en, o){ var v = S && S[en] != null ? S[en] : en; return o ? v.replace(/\{(\w+)\}/g, function(z, x){ return o[x] != null ? o[x] : z; }) : v; }
  function pl(m){ return S && X.pl && X.pl[LG] && X.pl[LG][m] ? X.pl[LG][m] : m; }
  function nf(x){ return S ? Number(x || 0).toLocaleString(LOC) : KT.fmt(x); }
  function nr(x){ return S ? nf(x) : String(x); }
  function dL(s){ if (!S || !/^\d{4}-\d\d-\d\d/.test(s)) return s; try { var p = s.split('-'); return new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+p[0], +p[1] - 1, parseInt(p[2], 10), 12))); } catch (e) { return s; } }
  function relabel(sel){ if (!S) return; Array.prototype.forEach.call(sel.querySelectorAll('optgroup'), function(g){ g.label = pl(g.label); });
    Array.prototype.forEach.call(sel.options, function(op){ var v = op.value, m = /\((\d+)\)$/.exec(op.textContent), c = m ? ' (' + nf(+m[1]) + ')' : '', gp = op.parentNode && op.parentNode.nodeName === 'OPTGROUP' ? op.parentNode.label : '';
      if (v.slice(0, 2) === 'c:') op.textContent = _('All of {c}', { c: pl(v.slice(2)) }) + c; else if (v.slice(0, 2) === 'm:') { var mk = pl(v.slice(2)); op.textContent = mk + (mk === gp ? '' : (LG === 'zh' ? '，' : LG === 'ar' ? '، ' : ', ') + gp) + c; } }); }
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

  function share(list, k){ var n = list.filter(function(c){ return KT.ok(c, k); }).length; return _('{a} of {b}', { a: nr(n), b: nr(list.length) }); }

  function build(o){
    var I = [], s = KT.parse(o.market), sub = s ? KT.subset(C, s) : [], an = s ? KT.anchors(C, s) : [], where = s ? s.name : '', wh = pl(where);
    var a0 = an[0] || '', fl = s && (KT.isFlorida(s) || s.type === 'country');
    function add(id, g, t, d, tag, links){ I.push({ id: id, g: g, t: t, d: d, tag: tag || '', links: links || [] }); }
    function dat(k){ return sub.length ? _(' In {w}, {s} tracked projects publish this.', { w: wh, s: share(sub, k) }) : ''; }
    var std = function(a){ return ['/standard/#' + a, _('Standard {a}', { a: a.toUpperCase() })]; };

    /* Before you sign: the six core checks */
    add('d1', 'sign', _('Get the permit or licence number and look it up yourself'),
      _('Ask for the number exactly as issued, the issuing authority, the date, the plot it covers and the number of units approved. Open the official register yourself, not a link the seller sent, and check that project name, developer company, plot, phase and unit count all match.') + dat('permit'), 'D1', [std('d1')]);
    if (o.stage === 'off-plan') add('st-op', 'sign', _('Make sure the permit exists before any money changes hands'),
      _('Nothing is built yet, so the permit, the land title and the deposit protection are your only evidence. "Permits in process" is not a permit.'), _('Off-plan'));
    add('d2', 'sign', _('Find out exactly how your payments are protected'),
      _('Who holds the money (the bank and the account holder), whether the account is in the name of the project or an escrow agent, on what milestone money is released, and what happens if the project stops. The account should be named in the signed contract, never only in an email or chat.') + dat('escrow'), 'D2',
      [std('d2'), ['/tools/deposit-protection/' + (s ? '?' + (s.type === 'country' ? 'country=' : 'market=') + encodeURIComponent(s.name) : ''), _('Deposit protection finder')]]);
    add('d4', 'sign', _('Get the plans and specification attached to the contract'),
      o.type === 'land' ? _('A site plan showing your plot with its area and boundaries, and the plan of shared roads and services, as an annex of the sales contract.') + dat('plans')
        : _('A site plan, floor plans with areas and how they are measured, and a specification of materials, finishes and fittings, as an annex of the sales contract.') + dat('plans'), 'D4', [std('d4')]);
    add('d5', 'sign', _('Check the company you are signing with'),
      _('Get the legal name of the selling company, its registration number and the registry it is in, and a list of delivered projects with addresses and completion years. Visit one or ask owners there.') + dat('record'), 'D5', [std('d5')]);
    add('d6', 'sign', _('Treat any return figure as an estimate'),
      _('A guarantee counts only if it is written, enforceable and given by a named party with its terms published. Any rental projection should be labelled an estimate and show its assumptions.') + dat('returns_ok'), 'D6', [std('d6')]);
    add('r1', 'sign', _('Find out who holds the land'),
      _('The land title number and type, the registered owner (the developer, or a landowner under a named agreement) and any mortgage on the land, with how it will be released at handover.'), _('Land'), [std('r1')]);
    add('r6', 'sign', _('Read the full sales contract before paying any reservation fee'),
      _('In a language you read, with the governing law and dispute venue, and reviewed by your own independent lawyer, not one introduced by the seller.'), _('Contract'), [std('r6')]);
    if (o.type !== 'land') add('r3', 'sign', _('Get the completion date and delay penalty into the contract'),
      _('The contractual completion date, any grace period, a penalty per month of delay, and the right to cancel with a refund after a long delay.'), _('Delay'), [std('r3')]);
    add('r4', 'sign', _('Tie every payment to a milestone you can check'),
      o.type === 'land' ? _('Ideally the balance is paid when the title or lease is registered in your name, not on calendar dates.') : _('Foundations, structure, roof and handover, each certified, not only calendar dates. Avoid large discounts for paying everything up front.'), _('Payments'), [std('r4')]);
    if (o.type !== 'land') add('r5', 'sign', _('Get the service charges in writing'),
      (o.rental === 'yes' || o.type === 'hotel' ? _('Expected yearly charges per unit or per m2, what they cover, who sets them and how they can change, plus any rental pool or management fees.') : _('Expected yearly charges per unit or per m2, what they cover, who sets them and how they can change.')), _('Costs'), [std('r5')]);

    /* Stage */
    if (o.stage === 'under construction') add('st-uc', 'sign', _('Compare the site with the original schedule'),
      _('Ask for a dated progress percentage, or dated photos from the same viewpoints, and compare them with the timeline you were first given. Ask whether the completion date was ever extended and why.'), _('Under construction'), [std('d3'), ['/satellite/', _('Satellite watch')]]);

    /* Property type */
    if (o.type === 'apartment') {
      add('ty-ap', 'sign', _('Check the building, not only your unit'),
        _('The number of units approved on the permit should match the building being sold. Ask whether the condominium or strata regime is recorded, or when it will be, and how the floor area of your unit is measured.'), _('Apartment'));
      if (an.indexOf('thailand') >= 0) add('ty-th', 'sign', _('Ask how much of the foreign quota is left'),
        _('Foreigners cannot own land in Thailand, but can own condo units within the building’s 49% foreign quota.'), _('Thailand'), [['/registers/#thailand', _('Registers: Thailand')]]);
    }
    if (o.type === 'villa') add('ty-vi', 'sign', _('Check your own plot'),
      _('The boundaries and land title of your plot, not only of the whole site, road access, and who owns and maintains shared roads, pools and gardens.'), _('Villa'));
    if (o.type === 'hotel') {
      add('ty-op', 'sign', _('Read the operator agreement'),
        _('Who operates the hotel, for how long, how the agreement can end, and what happens to your unit and its income if the operator or the brand leaves.'), _('Hotel residence'));
      add('ty-rp', 'sign', _('Read the rental pool terms'),
        _('Whether you must join the pool, how income is split, which fees come off before your share, how often you are paid and how many nights you can use the unit yourself.'), _('Hotel residence'));
      add('ty-tl', 'sign', _('Check the tourism licence or classification'),
        _('Where the hotel part needs one, check it on the official tourism register, and that it covers this project and not an earlier phase.'), _('Hotel residence'));
    }
    if (o.type === 'land') add('ty-la', 'sign', _('Check what you are allowed to build'),
      _('Zoning and permitted use, a survey of the boundaries, road access, water and power connections, and whether an environmental approval is needed. Buying a plot gives you no building permit.'), _('Land plot'));

    /* Title */
    if (o.title === 'freehold') {
      add('ti-fh', 'sign', _('Confirm you can hold freehold here, in your own name'),
        _('Ask an independent lawyer whether a foreign buyer may own this property outright, and check the title type in the land registry. "Freehold through a trusted local partner" is a nominee arrangement, not ownership.'), _('Freehold'), [std('r2')]);
      if (an.indexOf('indonesia') >= 0) add('ti-id', 'sign', _('Indonesia: foreigners cannot hold Hak Milik'),
        _('Foreigners cannot hold freehold (Hak Milik) land. Offers of "freehold" to foreigners usually rely on a nominee, which is not legal protection.'), _('Indonesia'), [['/registers/#indonesia', _('Registers: Indonesia')]]);
    }
    if (o.title === 'leasehold') {
      add('ti-lr', 'sign', _('Check the lease will be registered, and its real term'),
        _('The lease should be registered in your own name, with the base term and start date you were told. Ask whether the term runs from today or from completion.'), _('Leasehold'), [std('r2')]);
      add('ti-lx', 'sign', _('Read the extension clause'),
        _('An extension should be a binding clause with a fixed price or formula, not only a promise. Ask what happens to the lease on resale and on inheritance.'), _('Leasehold'));
    }
    if (o.title === 'company') add('ti-co', 'sign', _('Check the company that will hold the property'),
      _('Who owns the shares and in whose name, that the company is in the official company registry, the yearly running costs and filings, and that no nominee shareholder or director holds your interest.'), _('Company'));
    if (an.indexOf('mexico') >= 0 && o.title !== 'leasehold') add('ti-mx', 'sign', _('Mexico: fideicomiso or Mexican company'),
      _('Foreigners buying in the coastal or border restricted zone hold property through a bank trust (fideicomiso) or a Mexican company. Ask which one, and which bank is the trustee.'), _('Mexico'), [['/registers/#mexico', _('Registers: Mexico')]]);

    /* Mortgage and rental */
    if (o.mortgage === 'yes') {
      add('mo-dev', 'sign', _('Check your lender will lend on this project'),
        _('Many lenders approve the developer and the project before lending on off-plan property. Get the lender’s approval of the developer and an approval in principle for yourself before you sign.'), _('Mortgage'));
      add('mo-cl', 'sign', _('Ask for a finance clause'),
        _('What happens to your deposit if the mortgage is refused or the valuation comes in lower than the price.'), _('Mortgage'));
    }
    if (o.rental === 'yes') {
      add('re-ok', 'sign', _('Check you are allowed to rent it out'),
        _('Short-term rental rules and licences where the property is, and any building or owners’ association rules on letting.'), _('Rental'));
      add('re-num', 'sign', _('Test the rental numbers yourself'),
        _('Ask for the assumptions behind any projection: occupancy, nightly rate, management fees, service charges and tax. Compare them with real figures from owners in delivered projects.'), _('Rental'), [['/tools/yield-check/', _('Yield check')]]);
    }
    add('r7', 'sign', _('Ask how complaints are handled'),
      _('A named contact, the response time, and the regulator, ombudsman or court you can go to if you are not satisfied.'), _('Complaints'), [std('r7')]);

    /* Market registers */
    if (s && !an.length) add('mk-none', 'sign', _('Find the official registers yourself'),
      _('Our registers guide does not cover {w} yet. Ask the developer which authority issued each permit and licence, then look it up on that authority’s own website.', { w: wh }), wh, [['/registers/', _('Registers guide')]]);
    an.forEach(function(a){
      var c = R.get(a), d = R.DEP[a]; if (!c) return;
      c.regs.forEach(function(r, i){
        if (a === 'usa' && /Florida/.test(r.name) && !fl) return;
        if (o.type !== 'hotel' && /Tourism|CONFOTUR/.test(r.name) && r.checks.length === 1) return;
        var g = /after you sign/i.test(r.how) ? 'pay' : 'sign';
        add('rg-' + a + '-' + i, g, _('Check it on {r}', { r: _(r.name) }),
          _('{h} What it proves: {p}', { h: _(r.how), p: _(r.proves) }), _(c.name) + ': ' + r.checks.map(function(k){ return _(CKN[k]); }).join(LG === 'zh' ? '、' : LG === 'ar' ? '، ' : ', '),
          (r.url ? [[r.url, _('Official site')]] : []).concat([['/registers/#' + a, _('Registers: {c}', { c: _(c.name) })]]));
      });
      if (d && /law|list|state/.test(d.kind)) add('rg-' + a + '-pay', 'pay', _('Confirm the protected account before paying ({c})', { c: _(c.name) }), _(d.where), _(c.name) + ': ' + _('deposit protection'), [['/registers/#' + a, _('Registers: {c}', { c: _(c.name) })]]);
    });

    /* Before each payment */
    add('p-ms', 'pay', _('Confirm the milestone is really reached'),
      _('Ask for dated progress certified by an independent engineer or taken from the regulator, and compare it with the site. Do not pay for work that is not done.') + dat('progress'), 'D3', [std('d3')]);
    add('p-acc', 'pay', _('Pay only into the account named in your contract'),
      _('Never to a person, a sales agent or a new account sent by email or chat. If you are told the bank details changed, confirm it with the bank or developer using contact details you already had.'), 'D2', [std('d2')]);
    add('p-rec', 'pay', _('Get a receipt in your name for every payment'),
      an.indexOf('spain') >= 0 ? _('In Spain, also an individual bank guarantee or insurance certificate in your name for each payment, confirmed with the issuing bank or insurer.') : _('Keep the receipt with the payment confirmation and the progress evidence you were shown.'), _('Records'));
    add('p-reg', 'pay', _('Check the permit or licence is still valid'),
      _('Look at the register again: permits and licences expire, and projects can be listed as delayed or placed under orders that stop sales.'), 'D1');
    add('p-news', 'pay', _('Check news, courts and regulator notices'),
      _('Search for the developer and the project since your last payment. Stop paying until anything new is explained in writing.'), _('Public record'), s && s.type === 'market' ? [['/m/?market=' + encodeURIComponent(s.name), _('Market file: {m}', { m: pl(s.name) })]] : []);
    if (o.mortgage === 'yes') add('p-mo', 'pay', _('Line each payment up with your lender'),
      _('Which payments the lender will fund and when, and whether it inspects the site before releasing money.'), _('Mortgage'));

    /* Before handover */
    add('h-occ', 'hand', _('Get the completion or occupancy certificate'),
      (OCC[a0] ? _('The official certificate that the building is finished and fit for use: {c}.', { c: _(OCC[a0]) }) : _('The official certificate that the building is finished and fit for use.')) + (o.type === 'land' ? _(' For a plot, get the final survey with marked boundaries instead.') : ''), _('Completion'));
    if (o.type !== 'land') add('h-ins', 'hand', _('Inspect the unit against the plans and specification'),
      _('Measure the area the way the contract defines it, and list every defect in writing before you accept the keys.'), 'D4');
    add('h-title', 'hand', o.title === 'leasehold' ? _('Get the lease registered in your name') : o.title === 'company' ? _('Get the property registered to your company') : _('Get the title registered in your name'),
      (o.title === 'leasehold' ? _('Check the registered term and start date match the contract, and that the extension clause is in the registered lease. ') : '') + _('Check that the developer’s mortgage on the land has been released for your unit.'), _('Title'));
    if (o.type !== 'land') add('h-delay', 'hand', _('Claim any delay penalty you are owed'), _('Compare the handover date with the contractual date and grace period, and claim the penalty in writing.'), _('Delay'), [std('r3')]);
    if (o.type !== 'land') add('h-oa', 'hand', _('Get the service charge budget and the owners’ association details'), _('Who manages the building or estate, the first year’s budget, and how owners vote.'), _('Costs'));
    if (o.type === 'hotel') add('h-op', 'hand', _('Get the signed operator agreement and the pool start date'), _('And the first statement date, and who to contact about your unit.'), _('Hotel residence'));
    if (o.rental === 'yes') add('h-re', 'hand', _('Set up the rental before you take the keys'), _('Sign the management agreement, get any rental licence, and check your insurance covers letting.'), _('Rental'));
    if (o.mortgage === 'yes') add('h-mo', 'hand', _('Book the lender’s final valuation and sign-off'), _('So the last payment and the registration of the mortgage happen together.'), _('Mortgage'));
    add('h-last', 'hand', _('Pay the final amount only when all of the above is done'), _('Hold back the last payment until the certificate, the inspection and the registration are in hand.'), _('Payments'));
    return I;
  }

  function summary(o){
    var s = KT.parse(o.market);
    return [s ? pl(s.name) : _('any market'), _(TYPE[o.type]), _(TITLE[o.title]), _(o.stage), o.mortgage === 'yes' ? _('with a mortgage') : _('no mortgage'), o.rental === 'yes' ? _('to rent out') : _('not renting out')].join(' · ');
  }

  function render(){
    var o = inputs(); last = build(o);
    var n = 0, h = '';
    G.forEach(function(g){
      var items = last.filter(function(x){ return x.g === g[0]; }); if (!items.length) return;
      h += '<section class="mc-grp" aria-labelledby="mcg-' + g[0] + '"><h3 id="mcg-' + g[0] + '">' + esc(_(g[1])) + ' <span class="tq-small">(' + items.length + ')</span></h3><ol class="mc-list" start="' + (n + 1) + '">';
      items.forEach(function(x){ n++; x.n = n;
        h += '<li class="mc-it' + (ticks[x.id] ? ' is-done' : '') + '"><input type="checkbox" id="mci-' + x.id + '" data-id="' + x.id + '"' + (ticks[x.id] ? ' checked' : '') + '>' +
          '<label for="mci-' + x.id + '"><span class="mc-n" aria-hidden="true">' + n + '</span><span class="mc-tx"><b>' + esc(x.t) + '</b>' + (x.tag ? ' <span class="tq-tag is-mid">' + esc(x.tag) + '</span>' : '') + '<span class="mc-d">' + esc(x.d) + '</span></span></label>' +
          (x.links.length ? '<p class="mc-ln">' + x.links.map(function(l){ var ext = /^https?:/.test(l[0]); return '<a href="' + esc(l[0]) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l[1]) + (ext ? '<span class="sr-only"> (' + esc(_('opens in a new tab')) + ')</span>' : '') + '</a>'; }).join('') + '</p>' : '') + '</li>';
      });
      h += '</ol></section>';
    });
    $('mcList').innerHTML = h;
    var done = last.filter(function(x){ return ticks[x.id]; }).length;
    $('mcTitle').textContent = _('{n}-point checklist', { n: nr(n) });
    $('mcSum').textContent = summary(o) + ' · ' + _('{a} of {b} done', { a: nr(done), b: nr(n) });
  }

  function text(){
    var o = inputs(), out = [_('Your off-plan checklist'), summary(o), ''];
    G.forEach(function(g){
      var items = last.filter(function(x){ return x.g === g[0]; }); if (!items.length) return;
      out.push(_(g[1]).toUpperCase());
      items.forEach(function(x){ out.push((ticks[x.id] ? '[x] ' : '[ ] ') + x.n + '. ' + x.t + ': ' + x.d + (x.links.length ? ' (' + x.links.map(function(l){ return /^https?:/.test(l[0]) ? l[0] : 'https://kolaboro.com' + l[0]; }).join(', ') + ')' : '')); });
      out.push('');
    });
    out.push(_('Built with {u} . Information, not legal advice.', { u: 'https://kolaboro.com' + (S ? '/' + LG : '') + '/tools/my-checklist/' }));
    return out.join('\n');
  }
  function msg(t){ $('mcMsg').textContent = t; }
  function save(manual){ var ok = writeSaved({ v: 1, inputs: inputs(), ticks: ticks, at: new Date().toISOString() }); if (manual) msg(ok ? _('Saved in this browser. It will be here when you come back on this device.') : _('This browser does not allow saving. Copy the text or print it instead.')); return ok; }
  function copy(){
    var t = text();
    function done(){ msg(_('Copied as text. Paste it into a note or an email.')); }
    function fallback(){ var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { msg(_('Copy did not work here. Use print instead.')); } document.body.removeChild(a); }
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback); else fallback(); } catch (e) { fallback(); }
  }

  $('mcForm').addEventListener('change', function(){ render(); save(false); });
  $('mcList').addEventListener('change', function(e){ var id = e.target.getAttribute('data-id'); if (!id) return; if (e.target.checked) ticks[id] = 1; else delete ticks[id]; var li = e.target.closest('.mc-it'); if (li) li.classList.toggle('is-done', e.target.checked); var done = last.filter(function(x){ return ticks[x.id]; }).length; $('mcSum').textContent = summary(inputs()) + ' · ' + _('{a} of {b} done', { a: nr(done), b: nr(last.length) }); save(false); });
  $('mcPrint').addEventListener('click', function(){ window.print(); });
  $('mcCopy').addEventListener('click', copy);
  $('mcSave').addEventListener('click', function(){ save(true); });
  $('mcClear').addEventListener('click', function(){ ticks = {}; render(); save(false); msg(_('Ticks cleared.')); });

  var saved = readSaved();
  if (saved && saved.inputs) { ['type', 'title', 'stage', 'mortgage', 'rental'].forEach(function(k){ if (saved.inputs[k]) setVal(k, saved.inputs[k]); }); ticks = saved.ticks || {}; }
  render();
  KT.load().then(function(d){
    C = d.cases || [];
    var sel = $('mcMarket'); KT.fillSelect(sel, C, { placeholder: _('No market chosen') }); relabel(sel); sel.disabled = false;
    var p = {}; try { var u = new URLSearchParams(location.search); p.m = u.get('market'); p.c = u.get('country'); } catch (e) {}
    var want = (p.m || p.c) ? KT.value(KT.find(C, p.m || p.c)) : (saved && saved.inputs && saved.inputs.market) || '';
    if (want && Array.prototype.some.call(sel.options, function(x){ return x.value === want; })) sel.value = want;
    $('mcUpd').textContent = _('Live data updated {d}: {n} projects in {c} countries.', { d: dL(d.updated || ''), n: nf(C.length), c: nf(KT.groups(C).length) });
    render();
  }).catch(function(){
    var sel = $('mcMarket'); sel.innerHTML = '<option value="">' + esc(_('Markets unavailable right now')) + '</option>';
    $('mcUpd').textContent = _('Live data unavailable right now: the checklist works without market links.');
  });
  }
  if (LG0 !== 'en' && /^(es|fr|de|nl|ru|zh|ar)$/.test(LG0) && !window.KMC_TX) { var sc = document.createElement('script'); sc.src = '/tools/my-checklist/mc-tx.js?v=l10b'; sc.onload = sc.onerror = start; document.head.appendChild(sc); }
  else start();
})();
