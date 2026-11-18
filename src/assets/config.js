/* Prijsconfigurator en bestelflow. Prijzen excl. btw. */
(function () {
  var P = { dertig: 1650, beeld: 3000, termijn: 250, selectie: 495 };
  function perMaand(n) { return 995; }
  function eur(v) { return '€' + v.toLocaleString('nl-NL'); }

  window.ydPrijs = function (k) {
    var n = Math.max(1, Math.min(20, parseInt(k.aantal, 10) || 1));
    var door = k.looptijd === 'doorlopend';
    var lines = [], once = 0, month = 0;
    if (door) {
      var pm = perMaand(n), jaar = k.contract === '12';
      lines.push([n + (n > 1 ? ' doorlopende vacatures' : ' doorlopende vacature') + ' à ' + eur(pm), eur(n * pm) + ' p/m']);
      if (jaar) { var korting = Math.round(n * pm * 2 / 12); pm = pm - Math.round(pm * 2 / 12); lines.push(['Jaarcontract: 2 maanden gratis', '−' + eur(korting) + ' p/m']); }
      month += n * pm;
    } else {
      once += n * P.dertig;
      lines.push([n + (n > 1 ? ' vacatures' : ' vacature') + ', 30 dagen', eur(n * P.dertig)]);
    }
    lines.push(['Vacaturepagina, tekst en advertenties', 'inbegrepen']);
    lines.push(['Campagne en mediabudget', 'inbegrepen']);
    lines.push(['Tracking, monitoring en bijsturen', 'inbegrepen']);
    lines.push(['Kandidatensysteem en automatische opvolging', 'inbegrepen']);
    if (k.beeld === 'wij') {
      if (door && k.termijnen) { month += P.termijn; lines.push(['Beeld op locatie, 12 termijnen', eur(P.termijn) + ' p/m']); }
      else { once += P.beeld; lines.push(['Beeld op locatie', eur(P.beeld)]); }
    } else { lines.push(['Eigen beeld', 'inbegrepen']); }
    if (k.selectie === 'wij') {
      if (door) { month += n * P.selectie; lines.push(['Selectie door ons', eur(n * P.selectie) + ' p/m']); }
      else { once += n * P.selectie; lines.push(['Selectie door ons', eur(n * P.selectie)]); }
    }
    lines.push(['Aannemen zoveel je wilt', 'geen extra kosten']);
    var labels = { mailbox: 'in je mailbox', 'eigen-systeem': 'in je eigen systeem', 'ons-systeem': 'in ons systeem' };
    lines.push(['Sollicitanten ' + (labels[k.ontvangst] || 'in je mailbox'), 'inbegrepen']);
    return { n: n, door: door, jaar: door && k.contract === '12', lines: lines, once: once, month: month, eur: eur };
  };

  window.ydRender = function (r, linesEl, totalsEl) {
    linesEl.innerHTML = r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + l[1] + '</span></li>'; }).join('');
    var t = '';
    if (r.month) t += '<p><span>Per maand</span><strong>' + r.eur(r.month) + '</strong></p>';
    if (r.once) t += '<p><span>' + (r.month ? 'Eenmalig' : 'Totaal') + '</span><strong>' + r.eur(r.once) + '</strong></p>';
    if (r.jaar) t += '<p class="wg-summary__note">Jaarcontract van 12 maanden. Je betaalt 10 maanden.</p>';
    else if (r.door) t += '<p class="wg-summary__note">Eerste 6 maanden vast, daarna per maand opzegbaar.</p>';
    else t += '<p class="wg-summary__note">Met garantie: 30 dagen extra gratis, daarna €500 terug.</p>';
    totalsEl.innerHTML = t;
  };

  function read(form) {
    var get = function (n) { var el = form.querySelector('[name="' + n + '"]:checked'); return el ? el.value : ''; };
    var t = form.querySelector('[name="termijnen"]');
    return { looptijd: get('looptijd'), aantal: form.querySelector('[name="aantal"]').value, beeld: get('beeld'), termijnen: t && t.checked, selectie: get('selectie'), ontvangst: get('ontvangst'), contract: get('contract') || '4' };
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

    /* iDEAL via Mollie: eerst de bestelling opslaan in Netlify Forms, dan naar de betaalpagina. */
    var btn = form.querySelector('.wg-summary__cta');
    var label = function () {
      var ideal = (form.querySelector('[name="betaling"]:checked') || {}).value === 'ideal';
      var r = window.ydPrijs(read(form));
      var incl = Math.round((r.once + r.month) * 1.21 * 100) / 100;
      btn.textContent = ideal ? 'Afrekenen met iDEAL · €' + incl.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' incl. btw' : 'Plaats je vacature';
    };
    form.addEventListener('change', label); form.addEventListener('input', label); wireQty(form, label); label();

    form.addEventListener('submit', function (e) {
      var ideal = (form.querySelector('[name="betaling"]:checked') || {}).value === 'ideal';
      if (!ideal || !window.fetch || form.dataset.busy) return;
      e.preventDefault();
      form.dataset.busy = '1'; btn.disabled = true; btn.textContent = 'Even geduld…';
      var fd = new FormData(form), k = read(form);
      var body = { looptijd: k.looptijd, aantal: k.aantal, beeld: k.beeld, termijnen: k.termijnen ? 'ja' : 'nee', selectie: k.selectie, contract: k.contract,
        bedrijf: fd.get('bedrijf'), kvk: fd.get('kvk'), naam: fd.get('naam'), email: fd.get('email'), functie: fd.get('functie') };
      var klaar = function () { location.href = '/bedankt-bestelling/?betaling=later'; };
      fetch('/', { method: 'POST', body: fd })
        .then(function (r) { if (!r.ok) throw new Error('form'); })
        .then(function () {
          return fetch('/api/betaling', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (d) {
              if (d && d.checkoutUrl) { try { sessionStorage.setItem('ydBetaling', d.id); } catch (x) {} location.href = d.checkoutUrl; }
              else klaar();
            }, klaar);
        })
        .catch(function () { delete form.dataset.busy; btn.disabled = false; label(); form.submit(); });
    });
  }
})();
