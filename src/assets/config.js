/* Prijsconfigurator en bestelflow. Prijzen excl. btw. */
(function () {
  var P = { dertig: 1750, media: 750, jaar: 1200, jaarMedia: 600, beeld: 3000, termijn: 250, selectie: 495 };
  function perMaand(n) { return P.jaar; }
  function eur(v) { return '€' + v.toLocaleString('nl-NL'); }

  window.ydPrijs = function (k) {
    var n = Math.max(1, Math.min(20, parseInt(k.aantal, 10) || 1));
    var door = k.looptijd === 'doorlopend';
    var lines = [], once = 0, month = 0;
    if (door) {
      var pm = perMaand(n);
      lines.push([n + (n > 1 ? ' doorlopende vacatures' : ' doorlopende vacature') + ', jaarmodel à ' + eur(pm), eur(n * pm) + ' p/m']);
      lines.push(['Waarvan mediabudget, 1 op 1 naar je advertenties', eur(n * P.jaarMedia) + ' p/m']);
      month += n * pm;
    } else {
      once += n * P.dertig;
      lines.push([n + (n > 1 ? ' vacatures' : ' vacature') + ', 30 dagen', eur(n * P.dertig)]);
      lines.push(['Waarvan mediabudget, 1 op 1 naar je advertenties', eur(n * P.media)]);
    }
    lines.push(['Vacaturepagina, tekst en advertenties', 'inbegrepen']);
    lines.push(['Campagne op Instagram en Facebook', 'inbegrepen']);
    lines.push(['Tracking, monitoring en bijsturen', 'inbegrepen']);
    lines.push(['Kandidatensysteem en automatische opvolging', 'inbegrepen']);
    if (k.beeld === 'wij') {
      if (door && k.termijnen) { month += P.termijn; lines.push(['Beeld op locatie, 12 termijnen', eur(P.termijn) + ' p/m']); }
      else { once += P.beeld; lines.push(['Beeld op locatie', eur(P.beeld)]); }
    } else { lines.push(['Eigen beeld: jouw foto\'s en video\'s', 'inbegrepen']); }
    if (k.selectie === 'wij') {
      if (door) { month += n * P.selectie; lines.push(['Selectie door ons', eur(n * P.selectie) + ' p/m']); }
      else { once += n * P.selectie; lines.push(['Selectie door ons', eur(n * P.selectie)]); }
    }
    lines.push(['Aannemen zoveel je wilt', 'geen extra kosten']);
    if (k.ontvangst === 'eigen-systeem') lines.push(['Koppeling met je eigen systeem', 'niet inbegrepen']);
    else lines.push(['Sollicitanten ' + (k.ontvangst === 'ons-systeem' ? 'in ons systeem' : 'in je mailbox'), 'inbegrepen']);
    return { n: n, door: door, jaar: door, lines: lines, once: once, month: month, eur: eur };
  };

  window.ydRender = function (r, linesEl, totalsEl) {
    linesEl.innerHTML = r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('');
    var t = '';
    if (r.month) t += '<p><span>Per maand</span><strong>' + r.eur(r.month) + '</strong></p>';
    if (r.once) t += '<p><span>' + (r.month ? 'Eenmalig' : 'Totaal') + '</span><strong>' + r.eur(r.once) + '</strong></p>';
    if (r.door) t += '<p class="wg-summary__note">' + r.eur(r.n * 14400) + ' per jaar, je bespaart ' + r.eur(r.n * 6600) + '.</p>';
    else t += '<p class="wg-summary__note">Geen resultaat? 30 dagen gratis extra, anders €500 terug.</p>';
    totalsEl.innerHTML = t;
  };

  function read(form) {
    var get = function (n) { var el = form.querySelector('[name="' + n + '"]:checked'); return el ? el.value : ''; };
    var t = form.querySelector('[name="termijnen"]');
    return { looptijd: get('looptijd'), aantal: form.querySelector('[name="aantal"]').value, beeld: get('beeld'), termijnen: t && t.checked, selectie: get('selectie'), ontvangst: get('ontvangst'), contract: '12' };
  }
  function sync(form) {
    var k = read(form), door = k.looptijd === 'doorlopend';
    var cw = form.querySelector('#contract-wrap'); if (cw) cw.hidden = !door;
    var tw = form.querySelector('#termijnen-wrap'); if (tw) tw.hidden = !(door && k.beeld === 'wij');
    var sp = form.querySelector('#selectie-prijs'); if (sp) sp.textContent = door ? '€495 per vacature per maand' : '€495 per vacature';
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

  /* Prijspagina */
  var conf = document.getElementById('config');
  if (conf) {
    var upd = function () {
      var k = sync(conf), r = window.ydPrijs(k);
      window.ydRender(r, document.getElementById('lines'), document.getElementById('totals'));
      var q = new URLSearchParams({ looptijd: k.looptijd, aantal: r.n, beeld: k.beeld, termijnen: k.termijnen ? 'ja' : 'nee', selectie: k.selectie, ontvangst: k.ontvangst, contract: k.contract });
      document.getElementById('cta').href = '/plaats-je-vacature/?' + q.toString();
    };
    conf.addEventListener('change', upd); conf.addEventListener('input', upd); wireQty(conf, upd); upd();
  }

  /* Bestelflow */
  var form = document.getElementById('bestelling');
  if (form) {
    var qs = new URLSearchParams(location.search);
    ['looptijd', 'beeld', 'selectie', 'ontvangst', 'contract'].forEach(function (n) {
      var v = qs.get(n); if (!v) return;
      var el = form.querySelector('[name="' + n + '"][value="' + v + '"]'); if (el) el.checked = true;
    });
    if (qs.get('aantal')) form.querySelector('[name="aantal"]').value = qs.get('aantal');
    if (qs.get('termijnen') === 'ja') { var t = form.querySelector('[name="termijnen"]'); if (t) t.checked = true; }
    var upd2 = function () {
      var k = sync(form), r = window.ydPrijs(k);
      window.ydRender(r, document.getElementById('lines'), document.getElementById('totals'));
      var sum = r.lines.map(function (l) { return l[0] + ': ' + l[1]; }).join(' | ');
      if (r.month) sum += ' | Per maand: ' + r.eur(r.month);
      if (r.once) sum += ' | Eenmalig: ' + r.eur(r.once);
      form.querySelector('[name="samenvatting"]').value = sum;
      var up = form.querySelector('#upload-wrap'); if (up) up.hidden = k.beeld !== 'eigen';
      var sys = form.querySelector('#systeem-wrap'); if (sys) sys.hidden = k.ontvangst !== 'eigen-systeem';
    };
    form.addEventListener('change', upd2); form.addEventListener('input', upd2); wireQty(form, upd2); upd2();

    /* Keuzes bewaren voor de voorrangsoptie op de bedankpagina. */
    form.addEventListener('submit', function () {
      var k = read(form), fd = new FormData(form);
      var o = { looptijd: k.looptijd, aantal: k.aantal, beeld: k.beeld, termijnen: k.termijnen ? 'ja' : 'nee', selectie: k.selectie, contract: k.contract,
        bedrijf: fd.get('bedrijf'), kvk: fd.get('kvk'), naam: fd.get('naam'), email: fd.get('email'), functie: fd.get('functie') };
      try { sessionStorage.setItem('ydOrder', JSON.stringify(o)); } catch (e) {}
    });
  }
})();
