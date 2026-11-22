/* Pakketkeuze en bestelflow. Prijzen excl. btw, per vacature per maand. */
(function () {
  var PK = {
    gezien:   { naam: 'Gezien',           m: 99,   j: 89 },
    basis:    { naam: 'Kandidaten',       m: 499,  j: 449 },
    versneld: { naam: 'Voorgeselecteerd', m: 999,  j: 899 },
    moeilijk: { naam: 'Ontzorgd',         m: 1500, j: null }
  };
  var BEELD = 3000;
  function eur(v) { return '€' + v.toLocaleString('nl-NL'); }

  window.ydPrijs = function (k) {
    var n = Math.max(1, Math.min(20, parseInt(k.aantal, 10) || 1));
    var pk = PK[k.pakket] || PK.versneld;
    var jaar = k.betaling === 'jaar' && pk.j;
    var pm = jaar ? pk.j : pk.m;
    var lines = [], once = 0, month = n * pm;
    lines.push([n + (n > 1 ? ' vacatures' : ' vacature') + ', ' + pk.naam + ' à ' + eur(pm), eur(n * pm) + ' p/m']);
    lines.push(['Bereik', 'inbegrepen']);
    lines.push(['Werkgeverspagina, tekst en advertenties', 'inbegrepen']);
    if (k.pakket !== 'gezien') lines.push(['De afspraak', 'inbegrepen']);
    if (k.pakket === 'versneld' || k.pakket === 'moeilijk') lines.push(['Voorselectie via WhatsApp, gesprek in je agenda', 'inbegrepen']);
    if (k.pakket === 'moeilijk') lines.push(['Begeleiding tot de handtekening', 'inbegrepen']);
    if (k.beeld === 'wij') { once += BEELD; lines.push(['Beeld op locatie', eur(BEELD)]); }
    else lines.push(['Eigen beeld: jouw foto\'s en video\'s', 'inbegrepen']);
    lines.push(['Aannemen zoveel je wilt', 'geen extra kosten']);
    if (k.ontvangst === 'eigen-systeem') lines.push(['Koppeling met je eigen systeem', 'niet inbegrepen']);
    else lines.push([k.ontvangst === 'mailbox' ? 'Sollicitanten in je mailbox' : 'Portaal met eigen inlog', 'inbegrepen']);
    return { n: n, jaar: !!jaar, pk: pk, lines: lines, once: once, month: month, eur: eur };
  };

  window.ydRender = function (r, linesEl, totalsEl) {
    linesEl.innerHTML = r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('');
    var t = '<p><span>Per maand</span><strong>' + r.eur(r.month) + '</strong></p>';
    if (r.once) t += '<p><span>Eenmalig</span><strong>' + r.eur(r.once) + '</strong></p>';
    t += '<p class="wg-summary__note">' + (r.jaar ? 'Per jaar: 12 maanden, ' + r.eur(r.month * 12) + ' in totaal.' : 'Eerste 2 maanden vast, daarna maandelijks opzegbaar.') + '</p>';
    totalsEl.innerHTML = t;
  };

  function read(form) {
    var get = function (n) { var el = form.querySelector('[name="' + n + '"]:checked'); return el ? el.value : ''; };
    return { pakket: get('pakket'), betaling: get('betaling'), aantal: form.querySelector('[name="aantal"]').value, beeld: get('beeld'), ontvangst: get('ontvangst') };
  }
  function sync(form) {
    var k = read(form);
    var jo = form.querySelector('#jaar-optie');
    if (jo) {
      var kan = k.pakket !== 'moeilijk';
      jo.hidden = !kan;
      if (!kan && k.betaling === 'jaar') { form.querySelector('[name="betaling"][value="maand"]').checked = true; k.betaling = 'maand'; }
    }
    form.querySelectorAll('[data-p]').forEach(function (el) {
      var p = PK[el.dataset.p], j = k.betaling === 'jaar' && p.j;
      el.textContent = eur(j ? p.j : p.m) + ' p/m';
    });
    form.querySelectorAll('.wg-option').forEach(function (o) { o.classList.toggle('is-on', o.querySelector('input').checked); });
    return k;
  }
  function wireQty(root, cb) {
    root.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = root.querySelector('[name="aantal"]');
        i.value = Math.max(1, Math.min(20, (parseInt(i.value, 10) || 1) + parseInt(b.dataset.step, 10)));
        cb();
      });
    });
  }

  /* Bestelflow */
  var form = document.getElementById('bestelling');
  if (form) {
    var qs = new URLSearchParams(location.search);
    ['pakket', 'betaling', 'beeld', 'ontvangst'].forEach(function (n) {
      var v = qs.get(n); if (!v) return;
      var el = form.querySelector('[name="' + n + '"][value="' + v + '"]'); if (el) el.checked = true;
    });
    if (qs.get('aantal')) form.querySelector('[name="aantal"]').value = qs.get('aantal');
    var upd = function () {
      var k = sync(form), r = window.ydPrijs(k);
      window.ydRender(r, document.getElementById('lines'), document.getElementById('totals'));
      var sum = 'Pakket: ' + r.pk.naam + ' | Betalen: ' + (r.jaar ? 'per jaar' : 'per maand') + ' | ' + r.lines.map(function (l) { return l[0] + ': ' + l[1]; }).join(' | ');
      sum += ' | Per maand: ' + r.eur(r.month);
      if (r.once) sum += ' | Eenmalig: ' + r.eur(r.once);
      form.querySelector('[name="samenvatting"]').value = sum;
      var up = form.querySelector('#upload-wrap'); if (up) up.hidden = k.beeld !== 'eigen';
      var sys = form.querySelector('#systeem-wrap'); if (sys) sys.hidden = k.ontvangst !== 'eigen-systeem';
    };
    form.addEventListener('change', upd); form.addEventListener('input', upd); wireQty(form, upd); upd();

    form.addEventListener('submit', function () {
      var k = read(form), fd = new FormData(form);
      var o = { pakket: k.pakket, betaling: k.betaling, aantal: k.aantal, beeld: k.beeld,
        bedrijf: fd.get('bedrijf'), kvk: fd.get('kvk'), naam: fd.get('naam'), email: fd.get('email'), functie: fd.get('functie') };
      try { sessionStorage.setItem('ydOrder', JSON.stringify(o)); } catch (e) {}
    });
  }

  /* Prijspagina: per maand of per jaar doorgeven aan de knoppen */
  var tg = document.querySelector('.pk-toggle');
  if (tg) tg.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('a[href^="/plaats-je-vacature/?pakket="]').forEach(function (a) {
      var u = new URL(a.href, location.href);
      if (b.dataset.per === 'j' && u.searchParams.get('pakket') !== 'moeilijk') u.searchParams.set('betaling', 'jaar'); else u.searchParams.delete('betaling');
      a.href = u.pathname + u.search;
    });
  });
})();
