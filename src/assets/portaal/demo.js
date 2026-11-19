/* Demodata voor de preview. Alle namen en nummers zijn verzonnen. */
(function () {
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  var DAY = 864e5, now = Date.now();
  function iso(d) { return new Date(d).toISOString(); }
  function dateOnly(d) { return new Date(d).toISOString().slice(0, 10); }

  var orgs = [
    { id: 'org-walsem', name: 'Van Walsem Kachelspecialist' },
    { id: 'org-yd', name: 'YoungDedicated' }
  ];
  var vacancies = [
    { id: 'vac-walsem', organization_id: 'org-walsem', title: 'Montagemonteur kachels', location: 'Rhenen', status: 'live', plan: 'doorlopend',
      start_date: dateOnly(now - 23 * DAY), end_date: null, page_url: 'https://www.youngdedicated.nl/vacatures/', target_qualified: 5 },
    { id: 'vac-yd', organization_id: 'org-yd', title: 'Sales recruiter', location: 'Bunnik', status: 'live', plan: '30dagen',
      start_date: dateOnly(now - 12 * DAY), end_date: dateOnly(now + 18 * DAY), page_url: 'https://www.youngdedicated.nl/vacatures/', target_qualified: 3 }
  ];
  var budget = [
    { id: 'b1', organization_id: 'org-walsem', vacancy_id: 'vac-walsem', amount_cents: 60000, type: 'toegekend', status: 'actief', created_at: iso(now - 23 * DAY) },
    { id: 'b2', organization_id: 'org-walsem', vacancy_id: 'vac-walsem', amount_cents: 25000, type: 'bijgekocht', status: 'actief', created_at: iso(now - 6 * DAY) },
    { id: 'b3', organization_id: 'org-yd', vacancy_id: 'vac-yd', amount_cents: 30000, type: 'toegekend', status: 'actief', created_at: iso(now - 12 * DAY) }
  ];

  var stats = [];
  vacancies.forEach(function (v) {
    var days = Math.round((now - new Date(v.start_date)) / DAY);
    for (var i = days; i >= 0; i--) {
      var spend = Math.round((v.id === 'vac-walsem' ? 2600 : 1900) * (0.75 + rnd() * 0.5));
      var imp = Math.round(spend * (0.9 + rnd() * 0.4));
      stats.push({ organization_id: v.organization_id, vacancy_id: v.id, date: dateOnly(now - i * DAY), channel: 'meta',
        impressions: imp, reach: Math.round(imp * 0.62), clicks: Math.round(imp * (0.012 + rnd() * 0.01)), spend_cents: spend, leads: 0 });
    }
  });

  var first = ['Daan', 'Sem', 'Lotte', 'Milan', 'Noah', 'Sara', 'Bram', 'Yara', 'Luuk', 'Fenna', 'Jesse', 'Iris', 'Thijs', 'Noor', 'Ruben', 'Lisa', 'Mehmet', 'Anouk', 'Kevin', 'Sanne', 'Youssef', 'Eva', 'Tim', 'Femke'];
  var last = ['de Vries', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Dijk', 'Kaya', 'Dekker'];
  var cities = ['Rhenen', 'Veenendaal', 'Wageningen', 'Ede', 'Utrecht', 'Amersfoort', 'Bunnik', 'Zeist', 'Houten'];
  var sources = ['Meta instant form', 'Website youngdedicated.nl', 'Meta instant form', 'Website youngdedicated.nl', 'Google for Jobs'];
  var apps = [], events = [];
  var plan = { 'vac-walsem': [['nieuw', 4], ['gebeld', 5], ['gesprek', 3], ['aangenomen', 1], ['afgewezen', 7]],
               'vac-yd': [['nieuw', 3], ['gebeld', 2], ['gesprek', 2], ['afgewezen', 3]] };
  var n = 0;
  vacancies.forEach(function (v) {
    var span = Math.round((now - new Date(v.start_date)) / DAY);
    plan[v.id].forEach(function (p) {
      for (var k = 0; k < p[1]; k++) {
        n++;
        var stage = p[0];
        var ageH = stage === 'nieuw' ? Math.round(2 + rnd() * 40) : Math.round(48 + rnd() * (span * 24 - 48));
        var created = now - ageH * 36e5;
        var fn = pick(first), ln = pick(last);
        var q = stage === 'gesprek' || stage === 'aangenomen' ? true : stage === 'gebeld' ? (rnd() > 0.4 ? true : null) : stage === 'afgewezen' ? false : null;
        var a = {
          id: 'app-' + n, organization_id: v.organization_id, vacancy_id: v.id, stage: stage, qualified: q, rating: null,
          source: pick(sources), created_at: iso(created), stage_changed_at: iso(created + (stage === 'nieuw' ? 0 : 20 * 36e5)),
          first_contact_at: stage === 'nieuw' ? null : iso(created + 5 * 36e5),
          answers: v.id === 'vac-walsem'
            ? { 'Ervaring met montage': pick(['Ja, meer dan 3 jaar', 'Ja, 1 tot 3 jaar', 'Een beetje', 'Nee, wel handig']), 'Rijbewijs B': pick(['Ja', 'Ja', 'Nee']), 'Wanneer kun je starten': pick(['Direct', 'Binnen een maand', 'Na opzegtermijn']) }
            : { 'Ervaring in sales': pick(['Ja, meer dan 2 jaar', 'Ja, bijbaan', 'Nee']), 'Uren per week': pick(['32 tot 40', '24 tot 32', '40']), 'Wanneer kun je starten': pick(['Direct', 'Binnen een maand']) },
          candidate: { first_name: fn, last_name: ln, email: (fn + '.' + ln.replace(/ /g, '')).toLowerCase() + '@voorbeeld.nl',
            phone: '0612' + String(100000 + Math.floor(rnd() * 899999)), city: pick(cities), cv_path: rnd() > 0.35 ? 'demo.pdf' : null }
        };
        apps.push(a);
        events.push({ application_id: a.id, type: 'systeem', body: 'Gesolliciteerd via ' + a.source, created_at: a.created_at, actor_name: 'Systeem' });
        if (stage !== 'nieuw') events.push({ application_id: a.id, type: 'fase', from_stage: 'nieuw', to_stage: stage === 'afgewezen' ? 'afgewezen' : 'gebeld', created_at: a.first_contact_at, actor_name: v.id === 'vac-walsem' ? 'Erik van Walsem' : 'Ransder' });
        if (stage === 'gesprek' || stage === 'aangenomen') events.push({ application_id: a.id, type: 'notitie', body: pick(['Goed gesprek, enthousiast, kan snel starten.', 'Sterke ervaring. Uitgenodigd voor proefdag.', 'Klikte direct. Vraagt naar bus van de zaak.']), created_at: a.stage_changed_at, actor_name: v.id === 'vac-walsem' ? 'Erik van Walsem' : 'Ransder' });
      }
    });
  });
  // leads per day from applications
  apps.forEach(function (a) {
    var d = a.created_at.slice(0, 10);
    var s = stats.find(function (x) { return x.vacancy_id === a.vacancy_id && x.date === d; });
    if (s) s.leads++;
  });

  // verspreiding per vacature
  vacancies.forEach(function (v) {
    v.selection_by_yd = false;
    v.channels = [
      { key: 'meta', name: 'Instagram en Facebook', kind: 'Betaald', status: 'live', clicks: 0 },
      { key: 'google', name: 'Google for Jobs', kind: 'Gratis', status: 'live', clicks: Math.round(20 + rnd() * 40) },
      { key: 'werknl', name: 'werk.nl', kind: 'Gratis', status: 'live', clicks: Math.round(5 + rnd() * 20) },
      { key: 'adzuna', name: 'Adzuna', kind: 'Gratis', status: 'live', clicks: Math.round(4 + rnd() * 15) },
      { key: 'jooble', name: 'Jooble', kind: 'Gratis', status: 'live', clicks: Math.round(3 + rnd() * 12) },
      { key: 'careerjet', name: 'Careerjet', kind: 'Gratis', status: 'live', clicks: Math.round(2 + rnd() * 10) },
      { key: 'indeed', name: 'Indeed', kind: 'Gratis', status: 'in test', clicks: 0 }
    ];
    v.channels[0].clicks = stats.filter(function (s) { return s.vacancy_id === v.id; }).reduce(function (t, s) { return t + s.clicks; }, 0);
    v.milestones = [
      { label: 'Aanvraag', done: true }, { label: 'Kick-off', done: true }, { label: 'Betaald', done: true },
      { label: 'Live', done: true }, { label: 'Vervuld', done: false }
    ];
  });
  // toestemming netwerk bij een deel van de afgewezen kandidaten
  apps.forEach(function (a) {
    a.candidate.consent_network = a.stage === 'afgewezen' && rnd() > 0.35;
    a.network_status = null;
  });
  function fitOf(r) { return /bediening|kok/i.test(r) ? 'Horeca' : /sales|recruiter/i.test(r) ? 'Sales' : 'Techniek'; }
  var wf = ['Servicemonteur', 'Allround monteur', 'Medewerker bediening', 'Binnendienst sales', 'Installateur', 'Chauffeur', 'Kok', 'Magazijnmedewerker'];
  var pool = apps.filter(function (a) { return a.candidate.consent_network; }).map(function (a) {
    return { id: 'pool-' + a.id, app_id: a.id, initials: a.candidate.first_name.charAt(0) + '. ' + a.candidate.last_name.charAt(0) + '.',
      role: vacancies.find(function (v) { return v.id === a.vacancy_id; }).title, region: a.candidate.city, experience: pick(['1 tot 3 jaar', '3 tot 5 jaar', 'Starter', '5+ jaar']),
      available: pick(['Direct', 'Binnen een maand']), fit: null, status: 'beschikbaar', from_org: a.organization_id };
  });
  for (var x = 0; x < 9; x++) pool.push({ id: 'pool-x' + x, initials: pick(first).charAt(0) + '. ' + pick(last).charAt(0) + '.', role: pick(wf), region: pick(cities),
    experience: pick(['1 tot 3 jaar', '3 tot 5 jaar', 'Starter', '5+ jaar']), available: pick(['Direct', 'Binnen een maand']), fit: null, status: 'beschikbaar', from_org: 'org-other' });
  pool.forEach(function (p) { p.fit = fitOf(p.role); });
  var placements = [
    { id: 'pl1', org: 'org-walsem', initials: 'R. d. W.', role: 'Montagemonteur kachels', placed_at: iso(now - 9 * DAY), recruiter: 'Demo Techniek Recruitment', fee_cents: 300000, status: 'geplaatst' }
  ];
  var cockpit = {
    clients: [
      { name: 'Van Walsem Kachelspecialist', plan: 'Doorlopend', mrr: 99500, vacancies: 1, cpq: 8200, speed_h: 6, health: 'op koers' },
      { name: 'YoungDedicated (eigen)', plan: '30 dagen', mrr: 0, vacancies: 1, cpq: 9100, speed_h: 9, health: 'op koers' },
      { name: 'Demo Installatietechniek', plan: 'Doorlopend', mrr: 199000, vacancies: 2, cpq: 7400, speed_h: 4, health: 'op koers' },
      { name: 'Demo Horeca Groep', plan: 'Doorlopend', mrr: 82900, vacancies: 1, cpq: 5100, speed_h: 31, health: 'let op: belt traag' },
      { name: 'Demo Servicebedrijf', plan: '30 dagen', mrr: 0, vacancies: 1, cpq: 12600, speed_h: 12, health: 'let op: weinig geschikt' }
    ],
    mrr_trend: [99500, 99500, 182400, 182400, 281900, 381400],
    months: ['jun', 'jul', 'aug', 'sep', 'okt', 'nov'],
    once_month_cents: 165000 * 2 + 49500,
    media_fee_month_cents: 41250,
    network_month_cents: 150000,
    nrr: 112
  };

  window.YD_DEMO = { orgs: orgs, vacancies: vacancies, budget: budget, stats: stats, apps: apps, events: events, pool: pool, placements: placements, cockpit: cockpit,
    profile: { full_name: 'Ransder', role: 'yd_admin', organization_id: null } };
})();
