/* YoungDedicated portaal: kandidaten, opvolging en resultaten in één scherm. */
(function () {
  'use strict';
  var SB_URL = 'https://spcnezlzxaqnjexuzeck.supabase.co';
  var SB_KEY = 'sb_publishable_1-tmttt2Tgvn59t8i6ZSJw_0tPoK8iF';
  var LOGO = '/assets/email/youngdedicated-logo.png';
  var STAGES = [
    { key: 'nieuw', label: 'Nieuw' }, { key: 'gebeld', label: 'Gebeld' }, { key: 'gesprek', label: 'Gesprek' },
    { key: 'aangenomen', label: 'Aangenomen' }, { key: 'afgewezen', label: 'Afgewezen' }
  ];
  var STAGE_LABEL = {}; STAGES.forEach(function (s) { STAGE_LABEL[s.key] = s.label; });
  var PACKS = [25000, 50000, 100000];

  var demo = /[?&]demo\b/.test(location.search) || sessionStorage.getItem('yd-demo') === '1';
  var sb = !demo && window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null;
  var S = { seenAt: Date.now() - 864e5, tour: null, profile: null, orgs: [], orgId: null, vacancies: [], apps: [], stats: [], budget: [], vacFilter: 'all', mStage: 'nieuw', open: null, events: [], as: 'klant', wiz: null, poolFit: 'all', claim: null, tKind: 'all', tOpen: null, tTab: 'profiel', tSlot: 0, picked: {}, chats: {}, noPack: false };
  var PRICE = { vacature: 175000, jaar: 120000, budgetVac: 75000, budgetJaar: 60000, selectie: 49500, beeld: 300000 };
  var app = document.getElementById('app');

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function eur(c, dec) { var v = (c || 0) / 100; return '€' + v.toLocaleString('nl-NL', { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 }); }
  function num(v) { return (v || 0).toLocaleString('nl-NL'); }
  function hoursSince(iso) { return (Date.now() - new Date(iso)) / 36e5; }
  function ago(iso) {
    var h = hoursSince(iso);
    if (h < 1) return 'net binnen';
    if (h < 24) return Math.floor(h) + ' uur geleden';
    var d = Math.floor(h / 24); return d === 1 ? 'gisteren' : d + ' dagen geleden';
  }
  function fdate(iso) { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + ', ' + new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }); }
  function name(a) { return ((a.candidate.first_name || '') + ' ' + (a.candidate.last_name || '')).trim() || 'Onbekend'; }
  function ini(a) { return ((a.candidate.first_name || '?')[0] + (a.candidate.last_name || '').replace(/^(van|de|der|den)\s+/g, '').charAt(0)).toUpperCase(); }
  function vac(id) { return S.vacancies.find(function (v) { return v.id === id; }) || {}; }
  function match(a) {
    var must = vac(a.vacancy_id).must || [];
    var items = must.map(function (m) { var ans = (a.answers || {})[m.q]; return { label: m.label, ok: ans != null && new RegExp(m.ok, 'i').test(ans) }; });
    return { n: items.filter(function (i) { return i.ok; }).length, of: items.length, items: items };
  }
  function matchBadge(a) { var m = match(a); if (!m.of) return ''; return '<span class="match' + (m.n === m.of ? ' match--full' : m.n === 0 ? ' match--none' : '') + '" title="Harde eisen">' + m.n + '/' + m.of + '</span>'; }
  function intlPhone(p) { p = String(p || '').replace(/\D/g, ''); return p.charAt(0) === '0' ? '31' + p.slice(1) : p; }
  function toast(msg) { document.querySelectorAll('.toast').forEach(function (x) { x.remove(); }); var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
  var I = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.8-1.1-4.6-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2 1.1 1 2 1.3 2.3 1.4.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></svg>',
    brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>'
  };

  /* ---------- data layer ---------- */
  var api = demo ? {
    session: function () { return Promise.resolve(window.YD_DEMO.profile); },
    orgs: function () { return Promise.resolve(window.YD_DEMO.orgs); },
    load: function (org) {
      var D = window.YD_DEMO; function f(x) { return x.organization_id === org; }
      return Promise.resolve({ vacancies: D.vacancies.filter(f), apps: D.apps.filter(f), stats: D.stats.filter(f), budget: D.budget.filter(f) });
    },
    events: function (a) { return Promise.resolve(window.YD_DEMO.events.filter(function (e) { return e.application_id === a.id; })); },
    setStage: function (a, stage) {
      var D = window.YD_DEMO;
      D.events.push({ application_id: a.id, type: 'fase', from_stage: a.stage, to_stage: stage, created_at: new Date().toISOString(), actor_name: S.profile.full_name });
      a.stage = stage; a.stage_changed_at = new Date().toISOString();
      if (!a.first_contact_at) a.first_contact_at = a.stage_changed_at;
      if (stage === 'aangenomen') a.qualified = true;
      return Promise.resolve();
    },
    setFields: function (a, f) { Object.assign(a, f); return Promise.resolve(); },
    addEvent: function (a, type, body) { window.YD_DEMO.events.push({ application_id: a.id, type: type, body: body, created_at: new Date().toISOString(), actor_name: S.profile.full_name }); return Promise.resolve(); },
    buy: function (vacId, cents) { var t = { id: 'b' + Date.now(), organization_id: S.orgId, vacancy_id: vacId, amount_cents: cents, type: 'bijgekocht', status: 'open', created_at: new Date().toISOString() }; window.YD_DEMO.budget.push(t); S.budget.push(t); return Promise.resolve(); },
    cv: function () { toast('Demo: hier opent het cv.'); return Promise.resolve(null); },
    talent: function () { return Promise.resolve({ list: window.YD_DEMO.talent || [], picks: { t3: 'zelf' } }); },
    contact: function (t) { return Promise.resolve({ phone: t.phone, email: t.email }); },
    pick: function (id, on) { return Promise.resolve(); },
    messages: function (id) { return Promise.resolve(S.chats[id] || []); },
    send: function (id, text) { var m = { from: 'wg', text: text, at: new Date().toISOString() }; (S.chats[id] = S.chats[id] || []).push(m); return Promise.resolve(m); },
    interview: function (id, when) { return Promise.resolve(); },
    pakketStop: function (v, undo) { var st = undo ? null : stopDate(v); v.opgezegd_per = st && st.toISOString(); return Promise.resolve(v.opgezegd_per); },
    pakketSet: function (v, p) { v.pakket_next = p; return Promise.resolve(); },
    signOut: function () { sessionStorage.removeItem('yd-demo'); location.href = '/portaal/'; }
  } : {
    session: function () {
      return sb.auth.getSession().then(function (r) {
        var u = r.data.session && r.data.session.user; if (!u) return null;
        return sb.from('profiles').select('*').eq('id', u.id).single().then(function (p) { return p.data; });
      });
    },
    orgs: function () { return sb.from('organizations').select('id,name').order('name').then(function (r) { return r.data || []; }); },
    load: function (org) {
      return Promise.all([
        sb.from('vacancies').select('*').eq('organization_id', org).order('created_at'),
        sb.from('applications').select('*, candidate:candidates(first_name,last_name,email,phone,city,cv_path)').eq('organization_id', org).order('created_at', { ascending: false }),
        sb.from('campaign_stats_daily').select('*').eq('organization_id', org).order('date'),
        sb.from('budget_transactions').select('*').eq('organization_id', org)
      ]).then(function (r) { (r[0].data || []).forEach(function (v) { v.opgezegd_per = v.pakket_stop; if (v.pakket_start) v.start_date = v.pakket_start; }); return { vacancies: r[0].data || [], apps: r[1].data || [], stats: r[2].data || [], budget: r[3].data || [] }; });
    },
    events: function (a) { return sb.from('application_events').select('*').eq('application_id', a.id).order('created_at').then(function (r) { return r.data || []; }); },
    setStage: function (a, stage) {
      var f = { stage: stage }; if (!a.first_contact_at) f.first_contact_at = new Date().toISOString();
      return sb.from('applications').update(f).eq('id', a.id).select().single().then(function (r) { if (r.error) throw r.error; Object.assign(a, r.data); });
    },
    setFields: function (a, f) { return sb.from('applications').update(f).eq('id', a.id).then(function (r) { if (r.error) throw r.error; Object.assign(a, f); }); },
    addEvent: function (a, type, body) {
      return sb.auth.getUser().then(function (u) {
        return sb.from('application_events').insert({ organization_id: a.organization_id, application_id: a.id, type: type, body: body, actor_id: u.data.user.id, actor_name: S.profile.full_name });
      }).then(function (r) { if (r.error) throw r.error; });
    },
    buy: function (vacId, cents) {
      return sb.auth.getUser().then(function (u) {
        return sb.from('budget_transactions').insert({ organization_id: S.orgId, vacancy_id: vacId, amount_cents: cents, type: 'bijgekocht', status: 'open', created_by: u.data.user.id }).select().single();
      }).then(function (r) { if (r.error) throw r.error; S.budget.push(r.data); });
    },
    talent: function () {
      return Promise.all([sb.rpc('talent_list'), sb.from('badges').select('*'), sb.from('talent_picks').select('talent_id,status,initiated_by').eq('organization_id', S.orgId)]).then(function (r) {
        var B = {}; (r[1].data || []).forEach(function (b) { B[b.key] = b; });
        var picks = {}; (r[2].data || []).forEach(function (x) { picks[x.talent_id] = x.initiated_by === 'monteur' && x.status === 'ja' ? 'zelf' : (x.status || 'uitgenodigd'); });
        var list = (r[0].data || []).map(function (t) {
          return { id: t.id, first_name: t.first_name, last_initial: t.last_initial || '', city: t.city || '', km: null, role: t.role, kind: t.kind, years: t.years_experience || 0,
            available: t.available || 'In overleg', quote: t.quote || '', video_sec: t.video_seconds || 30, created_at: t.created_at,
            badges: (t.badges || []).filter(function (k) { return B[k]; }).map(function (k) { return { key: k, name: B[k].name, text: B[k].description }; }) };
        });
        return { list: list, picks: picks };
      });
    },
    contact: function (t) { return sb.rpc('talent_contact', { tid: t.id }).then(function (r) { return (r.data && r.data[0]) || null; }); },
    pick: function (id, on) {
      return sb.auth.getUser().then(function (u) {
        return on ? sb.from('talent_picks').insert({ organization_id: S.orgId, talent_id: id, picked_by: u.data.user.id }) : sb.from('talent_picks').delete().eq('organization_id', S.orgId).eq('talent_id', id);
      }).then(function (r) { if (r.error) throw r.error; });
    },
    messages: function (id) {
      return sb.from('talent_messages').select('*').eq('organization_id', S.orgId).eq('talent_id', id).order('created_at').then(function (r) {
        return (r.data || []).map(function (m) { return { from: m.from_side === 'werkgever' ? 'wg' : 'm', text: m.body, at: m.created_at }; });
      });
    },
    send: function (id, text) {
      return sb.auth.getUser().then(function (u) { return sb.from('talent_messages').insert({ organization_id: S.orgId, talent_id: id, from_side: 'werkgever', body: text, sender_id: u.data.user.id }); })
        .then(function (r) { if (r.error) throw r.error; var m = { from: 'wg', text: text, at: new Date().toISOString() }; (S.chats[id] = S.chats[id] || []).push(m); return m; });
    },
    interview: function (id, when) {
      return sb.auth.getUser().then(function (u) { return sb.from('talent_interviews').insert({ organization_id: S.orgId, talent_id: id, starts_at: when.toISOString(), created_by: u.data.user.id }); })
        .then(function (r) { if (r.error) throw r.error; });
    },
    pakketStop: function (v, undo) { return sb.rpc('pakket_opzeggen', { vid: v.id, undo: !!undo }).then(function (r) { if (r.error) throw r.error; v.pakket_stop = r.data; v.opgezegd_per = r.data; return r.data; }); },
    pakketSet: function (v, p) { return sb.rpc('pakket_wijzigen', { vid: v.id, p: p }).then(function (r) { if (r.error) throw r.error; v.pakket_next = p; }); },
    cv: function (path) { return sb.storage.from('cvs').createSignedUrl(path, 120).then(function (r) { return r.data && r.data.signedUrl; }); },
    signOut: function () { sb.auth.signOut().then(function () { location.href = '/portaal/'; }); }
  };

  /* ---------- metrics ---------- */
  function scope(list) { return S.vacFilter === 'all' ? list : list.filter(function (x) { return x.vacancy_id === S.vacFilter; }); }
  function metrics(vacId) {
    function f(x) { return !vacId || vacId === 'all' || x.vacancy_id === vacId; }
    var st = S.stats.filter(f), ap = S.apps.filter(f), bu = S.budget.filter(f);
    var m = { spend: 0, imp: 0, reach: 0, clicks: 0, budget: 0, pending: 0 };
    st.forEach(function (s) { m.spend += s.spend_cents; m.imp += s.impressions; m.reach += s.reach; m.clicks += s.clicks; });
    bu.forEach(function (b) { if (b.status === 'actief' || b.status === 'betaald') m.budget += b.amount_cents; else if (b.status === 'open') m.pending += b.amount_cents; });
    m.apps = ap.length;
    m.qual = ap.filter(function (a) { return a.qualified; }).length;
    m.hired = ap.filter(function (a) { return a.stage === 'aangenomen'; }).length;
    m.cpa = m.apps ? Math.round(m.spend / m.apps) : 0;
    m.cpq = m.qual ? Math.round(m.spend / m.qual) : 0;
    m.days = st.length;
    return m;
  }

  /* ---------- shell ---------- */
  function routeParts() { return (location.hash.replace('#/', '') || '').split('/'); }
  function route() { return routeParts()[0] || (S.as === 'recruiter' ? 'pool' : 'vandaag'); }
  var NAV_KLANT = [['vandaag', 'Vandaag', I.home], ['monteurs', 'Monteurs', I.spark], ['kandidaten', 'Kandidaten', I.people], ['resultaten', 'Resultaten', I.chart], ['vacatures', 'Vacatures', I.brief]];
  function navItems() {
    if (S.as === 'recruiter') return [['pool', 'Kandidatenpool', I.people], ['plaatsingen', 'Mijn plaatsingen', I.brief]];
    if (S.as === 'yd') return [['cockpit', 'Cockpit', I.chart]].concat(NAV_KLANT.slice(0, 4));
    return NAV_KLANT;
  }
  function shell(inner) {
    var r = route(), NAV = navItems();
    var roleSel = demo ? '<select class="org-select role-select" data-action="role" aria-label="Bekijk als">' + [['klant', 'Bekijk als klant'], ['yd', 'Bekijk als YoungDedicated'], ['recruiter', 'Bekijk als recruiter']].map(function (o) { return '<option value="' + o[0] + '"' + (S.as === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' : '';
    var orgSel = S.as === 'recruiter' ? '<span class="hint">Demo Techniek Recruitment</span>' : demo && S.as === 'klant' ? '<select class="org-select" data-action="org" aria-label="Kies demoklant">' + S.orgs.filter(function (o) { return o.id !== 'org-yd'; }).map(function (o) { var v0 = window.YD_DEMO.vacancies.find(function (v) { return v.organization_id === o.id; }) || {}; return '<option value="' + o.id + '"' + (o.id === S.orgId ? ' selected' : '') + '>' + esc((v0.branch ? v0.branch + ' · ' : '') + o.name) + '</option>'; }).join('') + '</select>' : (S.profile.role === 'yd_admin' && S.as !== 'klant' || !demo && S.profile.role === 'yd_admin') && S.orgs.length > 1
      ? '<select class="org-select" data-action="org" aria-label="Kies klant">' + S.orgs.map(function (o) { return '<option value="' + o.id + '"' + (o.id === S.orgId ? ' selected' : '') + '>' + esc(o.name) + '</option>'; }).join('') + '</select>'
      : '<span class="hint">' + esc((S.orgs.find(function (o) { return o.id === S.orgId; }) || {}).name || '') + '</span>';
    return '<header class="top"><div class="top__in"><a href="#/vandaag"><img class="top__logo" src="' + LOGO + '" alt="YoungDedicated"></a>' +
      '<nav class="nav">' + NAV.map(function (n) { return '<a href="#/' + n[0] + '"' + (r === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>'; }).join('') + '</nav>' +
      '<div class="top__right">' + (demo ? '<button class="demo-flag" data-action="tour" title="Rondleiding">Demo</button>' : '') + roleSel + orgSel + bellBtn() +
      '<button class="avatar" data-action="logout" title="Uitloggen">' + esc((S.profile.full_name || '?').charAt(0).toUpperCase()) + '</button></div></div>' + (route() !== 'cockpit' ? kpiBar() : '') + '</header>' +
      '<main>' + inner + '</main>' + (demo && S.as !== 'recruiter' && route() !== 'rapport' ? '<div class="demo-live no-print"><button class="btn btn--sm" data-action="sim">+ Nieuwe sollicitant</button><button class="btn btn--ghost btn--sm" data-action="tour">Rondleiding</button></div>' : '') +
      '<nav class="tabs" style="grid-template-columns:repeat(' + NAV.length + ',1fr)">' + NAV.map(function (n) { return '<a href="#/' + n[0] + '"' + (r === n[0] ? ' aria-current="page"' : '') + '>' + n[2] + n[1] + '</a>'; }).join('') + '</nav>';
  }
  function vacChips(withAll) {
    if (S.vacancies.length < 2 && !withAll) return '';
    var list = (withAll ? [{ id: 'all', title: 'Alle vacatures' }] : []).concat(S.vacancies);
    return '<div class="chips" role="group" aria-label="Vacature">' + list.map(function (v) {
      return '<button class="chip" data-action="vac" data-id="' + v.id + '" aria-pressed="' + (S.vacFilter === v.id) + '">' + esc(v.title) + '</button>';
    }).join('') + '</div>';
  }
  function timer(a) {
    var h = hoursSince(a.created_at), cls = h > 24 ? 'timer--late' : h > 12 ? 'timer--warn' : '';
    return '<span class="timer ' + cls + '">' + (h > 24 ? 'Wacht ' + Math.floor(h / 24) + 'd' : 'Nog ' + Math.max(1, Math.ceil(24 - h)) + ' uur') + '</span>';
  }
  function personRow(a, withTimer) {
    var v = vac(a.vacancy_id);
    return '<div class="person" role="button" tabindex="0" data-action="open" data-id="' + a.id + '">' +
      '<span class="person__ini">' + esc(ini(a)) + '</span>' +
      '<span class="person__main"><p class="person__name">' + esc(name(a)) + '</p><p class="person__meta">' + esc(v.title || '') + ' · ' + esc(a.candidate.city || '') + ' · ' + ago(a.created_at) + '</p></span>' +
      matchBadge(a) + (withTimer ? timer(a) : '') +
      '<span class="person__act">' + (a.candidate.phone ? '<a class="icon-btn icon-btn--green" href="tel:' + esc(a.candidate.phone) + '" data-action="called" data-id="' + a.id + '" aria-label="Bel ' + esc(name(a)) + '">' + I.phone + '</a>' : '') + '</span></div>';
  }

  /* ---------- views ---------- */
  function viewToday() {
    var hour = new Date().getHours(), greet = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
    var fresh = S.apps.filter(function (a) { return a.stage === 'nieuw'; }).sort(function (a, b) { return (match(b).n - match(a).n) || (new Date(a.created_at) - new Date(b.created_at)); });
    var late = fresh.filter(function (a) { return hoursSince(a.created_at) > 24; });
    var talks = S.apps.filter(function (a) { return a.stage === 'gesprek'; });
    var selYD = S.vacancies.some(function (v) { return v.selection_by_yd; });
    var cr = credit();
    var m = metrics('all');
    var target = S.vacancies.reduce(function (t, v) { return t + (v.target_qualified || 0); }, 0) || 1;
    var v30 = S.vacancies.find(function (v) { return v.plan === 'vacature' && v.start_date; });
    var day = v30 ? Math.min(60, Math.max(1, Math.ceil((Date.now() - new Date(v30.start_date)) / 864e5))) : null;
    var pct = m.budget ? Math.min(100, Math.round(m.spend / m.budget * 100)) : 0;
    var first = (S.profile.full_name || '').split(' ')[0];
    var h = '<h1>' + greet + (first ? ', ' + esc(first) : '') + '.</h1>' +
      '<p class="sub">' + (fresh.length ? '<span class="mark">' + fresh.length + (fresh.length === 1 ? ' persoon wacht' : ' mensen wachten') + ' op je belletje.</span>' : 'Iedereen is opgevolgd. Zo hoort het.') + '</p>' +
      '<div class="grid grid-3">' +
        '<div class="card card--dark"><p class="card__label">Bel vandaag</p><p class="big">' + fresh.length + ' <small>nieuw</small></p>' +
          (selYD ? '<p class="muted">Selectie uitbesteed. YoungDedicated belt iedereen binnen 24 uur en zet geschikte mensen klaar voor jou.</p>' : '<p class="muted">Bel binnen 24 uur. Dan is de sollicitant nog warm.</p>') +
          (late.length && !selYD ? '<p style="margin-top:14px"><a class="btn btn--gold btn--sm" href="mailto:team@youngdedicated.nl?subject=' + encodeURIComponent('Selectie uitbesteden: wil YoungDedicated onze sollicitanten bellen?') + '">Geen tijd? Wij doen de selectie</a></p>' : '') + '</div>' +
        '<div class="card"><p class="card__label">Campagne</p><p class="big">' + eur(m.cpa) + ' <small>per sollicitant</small></p>' +
          '<div class="bar-legend"><span>Bereik inbegrepen</span><span>' + m.apps + ' sollicitanten</span></div></div>' +
        '<div class="card"><p class="card__label">Garantie</p><p class="big">' + m.qual + ' <small>van ' + target + ' geschikt</small></p>' +
          '<div class="bar bar--green"><span style="width:' + Math.min(100, Math.round(m.qual / target * 100)) + '%"></span></div>' +
          '<div class="bar-legend"><span>' + (m.qual >= target ? 'Doel gehaald' : 'Nog ' + (target - m.qual) + ' te gaan') + '</span><span>' + (day ? (day <= 30 ? 'Garantiecheck dag 30, nu dag ' + day : 'Dag ' + day + ' van 60') : 'Jaarmodel') + '</span></div></div>' +
      '</div>';
    if (cr.credit) h += '<div class="card section cashback"><div><p class="card__label">Cashback</p><b>' + eur(cr.credit) + ' tegoed</b><p class="hint">Een kandidaat die niet bij jou paste, is via ons netwerk elders aangenomen. Je tegoed gaat automatisch van je volgende vacature af.</p></div></div>';
    h += '<div class="section"><h2>' + (selYD ? 'Deze mensen bellen wij' : 'Bel deze mensen') + '</h2>' + (fresh.length ? '<div class="list">' + fresh.map(function (a) { return personRow(a, true); }).join('') + '</div>' : '<div class="card empty"><strong>Lekker bezig.</strong>Nieuwe sollicitanten verschijnen hier direct.</div>') + '</div>';
    if (talks.length) h += '<div class="section"><h2>Neem een besluit</h2><p class="hint" style="margin:-6px 0 12px">Gesprek gehad. Aannemen of niet?</p><p><button class="btn btn--gold" data-action="decide-start">Beslis nu, één voor één</button></p><div class="list">' + talks.map(function (a) { return personRow(a, false); }).join('') + '</div></div>';
    return h;
  }

  function viewCandidates() {
    var list = scope(S.apps);
    var h = '<h1>Kandidaten</h1><p class="sub">Sleep een kaart naar de volgende stap, of tik erop.</p>' + vacChips(true);
    h += '<div class="board">' + STAGES.map(function (s) {
      var c = list.filter(function (a) { return a.stage === s.key; });
      return '<div class="col" data-stage="' + s.key + '"><h3>' + s.label + ' <span>' + c.length + '</span></h3>' + c.map(function (a) {
        return '<button class="kcard" draggable="true" data-action="open" data-id="' + a.id + '"><b>' + esc(name(a)) + '</b> ' + matchBadge(a) + '<small>' + esc(vac(a.vacancy_id).title || '') + ' · ' + ago(a.created_at) + '</small>' +
          (a.qualified ? '<br><span class="badge">Geschikt</span>' : '') + (s.key === 'nieuw' && hoursSince(a.created_at) > 24 ? '<br><span class="badge badge--gold">Wacht &gt; 24 uur</span>' : '') + '</button>';
      }).join('') + '</div>';
    }).join('') + '</div>';
    var ms = list.filter(function (a) { return a.stage === S.mStage; });
    h += '<div class="mobile-stages"><div class="chips">' + STAGES.map(function (s) {
      return '<button class="chip" data-action="mstage" data-id="' + s.key + '" aria-pressed="' + (S.mStage === s.key) + '">' + s.label + '<span class="n">' + list.filter(function (a) { return a.stage === s.key; }).length + '</span></button>';
    }).join('') + '</div>' + (ms.length ? '<div class="list">' + ms.map(function (a) { return personRow(a, S.mStage === 'nieuw'); }).join('') + '</div>' : '<div class="card empty">Niemand in deze stap.</div>') + '</div>';
    return h;
  }

  function chart(vacId) {
    var st = S.stats.filter(function (s) { return vacId === 'all' || s.vacancy_id === vacId; });
    var by = {}; st.forEach(function (s) { var d = by[s.date] || (by[s.date] = { spend: 0, leads: 0 }); d.spend += s.spend_cents; d.leads += s.leads; });
    var days = Object.keys(by).sort().slice(-30);
    if (!days.length) return '<div class="empty">Nog geen campagnedata. Die verschijnt zodra de campagne draait.</div>';
    var W = 720, H = 220, P = { l: 44, r: 36, t: 12, b: 26 }, iw = W - P.l - P.r, ih = H - P.t - P.b;
    var maxS = Math.max.apply(null, days.map(function (d) { return by[d].spend; })) || 1;
    var maxL = Math.max(3, Math.max.apply(null, days.map(function (d) { return by[d].leads; })));
    var bw = iw / days.length;
    var bars = days.map(function (d, i) { var hgt = by[d].spend / maxS * ih; return '<rect x="' + (P.l + i * bw + bw * 0.18).toFixed(1) + '" y="' + (P.t + ih - hgt).toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + hgt.toFixed(1) + '" rx="3" fill="#d1b75c"><title>' + d + ': ' + eur(by[d].spend) + ', ' + by[d].leads + ' sollicitanten</title></rect>'; }).join('');
    var pts = days.map(function (d, i) { return (P.l + i * bw + bw / 2).toFixed(1) + ',' + (P.t + ih - by[d].leads / maxL * ih).toFixed(1); });
    var dots = days.map(function (d, i) { return by[d].leads ? '<circle cx="' + (P.l + i * bw + bw / 2).toFixed(1) + '" cy="' + (P.t + ih - by[d].leads / maxL * ih).toFixed(1) + '" r="3.5" fill="#00a882"/>' : ''; }).join('');
    var lbl = days.map(function (d, i) { return i % Math.ceil(days.length / 6) === 0 ? '<text x="' + (P.l + i * bw + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) + '</text>' : ''; }).join('');
    var grid = [0, 0.5, 1].map(function (f) { var y = P.t + ih - f * ih; return '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '" stroke="#ece9df"/><text x="' + (P.l - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + eur(maxS * f) + '</text><text x="' + (W - P.r + 6) + '" y="' + (y + 4) + '">' + (f === 0.5 ? '' : Math.round(maxL * f)) + '</text>'; }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Besteding en sollicitanten per dag">' + grid + bars +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#00a882" stroke-width="2.5" stroke-linejoin="round"/>' + dots + lbl + '</svg>' +
      '<div class="legend"><span><i style="background:#d1b75c"></i>Besteed per dag (links)</span><span><i style="background:#00a882"></i>Sollicitanten per dag (rechts)</span></div>';
  }

  function viewResults() {
    if (S.vacFilter === 'all' && S.vacancies.length === 1) S.vacFilter = S.vacancies[0].id;
    var m = metrics(S.vacFilter);
    var left = Math.max(0, m.budget - m.spend);
    var perDay = m.days ? Math.round(m.spend / m.days) : 0;
    var h = '<div class="row" style="justify-content:space-between;align-items:flex-start"><div><h1>Resultaten</h1><p class="sub">Live. Waar je geld heen gaat en wat het oplevert.</p></div><a class="btn btn--ghost" href="#/rapport">Maandrapport (pdf)</a></div>' + vacChips(S.vacancies.length > 1);
    h += '<div class="kpis">' +
      '<div class="kpi"><span>Besteed</span><b>' + eur(m.spend) + '</b></div>' +
      '<div class="kpi"><span>Sollicitanten</span><b>' + m.apps + '</b></div>' +
      '<div class="kpi"><span>Per sollicitant</span><b>' + eur(m.cpa) + '</b></div>' +
      '<div class="kpi"><span>Geschikt</span><b>' + m.qual + '</b></div>' +
      '<div class="kpi kpi--hl"><span>Per geschikte kandidaat</span><b>' + (m.qual ? eur(m.cpq) : '–') + '</b></div></div>';
    h += '<div class="grid grid-2">' +
      '<div class="card"><p class="card__label">Waar gaat je geld heen</p>' +
        (S.vacancies.some(function (v) { return v.plan === 'jaar'; }) ?
          '<div class="money-row"><span>Jaarmodel per vacature</span><b>' + eur(PRICE.jaar) + ' p/m</b></div>' +
          '' : '') +
        (S.vacancies.some(function (v) { return v.plan === 'vacature'; }) ?
          '<div class="money-row"><span>Vacature, eenmalig</span><b>' + eur(PRICE.vacature) + '</b></div>' +
          '' : '') +
        '<div class="money-row"><span>Bereik</span><b>inbegrepen</b></div>' +
        '<div class="money-row"><span>Ingezet in advertenties (Facebook en Instagram)</span><b>' + eur(m.spend) + '</b></div>' +
        (m.pending ? '<div class="money-row"><span>Extra budget, wacht op betaling</span><b>' + eur(m.pending) + '</b></div>' : '') +
        '<p style="margin-top:16px"><button class="btn btn--gold btn--block" data-action="buy">Meer reacties? Verhoog je budget</button></p></div>' +
      '<div class="card"><p class="card__label">Van bereik naar aanname</p><div class="funnel">' + funnelRows(m) + '</div>' +
        '<p class="hint" style="margin-top:12px">Een klik betekent: iemand opende je vacaturepagina of formulier.</p></div>' +
      '</div>';
    var cr = credit();
    if (demo) h += '<div class="card section"><p class="card__label">Cashback uit het netwerk</p><div class="row" style="justify-content:space-between"><div><b class="big" style="font-size:32px">' + eur(cr.credit) + '</b><p class="hint">Tegoed voor je volgende vacature</p></div><div class="hint" style="max-width:420px">Wijs je een geschikte kandidaat af die toestemming gaf, dan bieden wij hem aan in ons recruitersnetwerk. Wordt hij elders aangenomen, dan krijg jij een deel van de fee terug.</div></div>' +
      cr.list.map(function (p) { return '<div class="money-row"><span>' + esc(p.initials) + ' · ' + esc(p.role) + ', geplaatst via ' + esc(p.recruiter) + '</span><b>+ ' + eur(Math.round(p.fee_cents * 0.2)) + '</b></div>'; }).join('') + '</div>';
    h += '<div class="card section"><p class="card__label">Laatste 30 dagen</p>' + chart(S.vacFilter) + '</div>';
    var src = {}; scope(S.apps).forEach(function (a) { src[a.source || 'Onbekend'] = (src[a.source || 'Onbekend'] || 0) + 1; });
    h += '<div class="card section"><p class="card__label">Waar komen je sollicitanten vandaan</p>' + Object.keys(src).sort(function (a, b) { return src[b] - src[a]; }).map(function (k) { return '<div class="money-row"><span>' + esc(k) + '</span><b>' + src[k] + '</b></div>'; }).join('') + '</div>';
    return h;
  }
  function funnelRows(m) {
    var rows = [['Bereik', m.reach], ['Klikken', m.clicks], ['Sollicitanten', m.apps], ['Geschikt', m.qual], ['Aangenomen', m.hired]];
    var max = Math.log10((rows[0][1] || 1) + 1);
    return rows.map(function (r) { var w = r[1] ? Math.max(3, Math.log10(r[1] + 1) / max * 100) : 0; return '<div class="funnel__row"><span>' + r[0] + '</span><div class="funnel__bar" style="width:' + w + '%"></div><b>' + num(r[1]) + '</b></div>'; }).join('');
  }

  function vacDay(v) { return v.plan === 'vacature' && v.start_date ? Math.min(60, Math.max(1, Math.ceil((Date.now() - new Date(v.start_date)) / 864e5))) : null; }
  function viewVacancies() {
    var h = '<div class="row" style="justify-content:space-between;align-items:flex-start"><div><h1>Vacatures</h1><p class="sub">Alles wat nu voor je werft.</p></div>' +
      (demo ? '<button class="btn btn--gold" data-action="newvac">+ Nieuwe vacature</button>' : '<a class="btn btn--gold" href="/plaats-je-vacature/">+ Nieuwe vacature</a>') + '</div><div class="list">';
    h += S.vacancies.map(function (v) {
      var m = metrics(v.id), day = vacDay(v);
      return '<a class="card vac vac--link" href="#/vacatures/' + v.id + '"><div class="vac__main"><span class="pill pill--' + v.status + '">' + esc(v.status) + '</span>' +
        '<p class="vac__title" style="margin-top:8px">' + esc(v.title) + '</p><p class="hint" style="margin:2px 0 0">' + esc(v.location || '') + ' · ' + (v.status === 'concept' ? 'Aanvraag ingediend' : pakketOf(v) ? 'Pakket ' + pakketOf(v).name + (v.opgezegd_per ? ', opgezegd' : '') : day ? 'Dag ' + day + ' van 60' : 'Jaarmodel') + (v.selection_by_yd ? ' · Selectie door ons' : '') + '</p></div>' +
        '<div class="row"><div class="kpi"><span>Sollicitanten</span><b>' + m.apps + '</b></div><div class="kpi"><span>Geschikt</span><b>' + m.qual + '</b></div><div class="kpi"><span>Besteed</span><b>' + eur(m.spend) + '</b></div></div>' +
        '<span class="vac__go" aria-hidden="true">&rsaquo;</span></a>';
    }).join('');
    return h + '</div>';
  }
  function viewVacancy(id) {
    var v = vac(id); if (!v.id) return viewVacancies();
    var m = metrics(id), day = vacDay(v);
    var steps = v.milestones || [{ label: 'Aanvraag', done: true }, { label: 'Kick-off', done: v.status !== 'concept' }, { label: 'Betaald', done: v.status !== 'concept' }, { label: 'Live', done: v.status === 'live' || v.status === 'vervuld' }, { label: 'Vervuld', done: v.status === 'vervuld' }];
    var h = '<p><a class="hint" href="#/vacatures">&lsaquo; Alle vacatures</a></p><h1>' + esc(v.title) + '</h1><p class="sub">' + esc(v.location || '') + ' · ' + (pakketOf(v) ? 'Pakket ' + pakketOf(v).name + ', ' + eur(pakketOf(v).price) + ' per maand' : day ? 'Dag ' + day + ' van 60, garantiecheck op dag 30' : v.plan === 'jaar' ? 'Jaarmodel, doorlopend' : '') + '</p>';
    h += '<div class="card"><ol class="stepper">' + steps.map(function (st, i) { var cur = !st.done && (i === 0 || steps[i - 1].done); return '<li class="' + (st.done ? 'done' : cur ? 'cur' : '') + '"><span>' + (st.done ? '&#10003;' : i + 1) + '</span>' + st.label + '</li>'; }).join('') + '</ol>' +
      journeyHint(v, steps) + '</div>' + (pakketOf(v) ? pakketCard(v) + afspraakCard(v) : v.status === 'live' ? guarantee(v, m, day) : '');
    h += '<div class="kpis section"><div class="kpi"><span>Sollicitanten</span><b>' + m.apps + '</b></div><div class="kpi"><span>Geschikt</span><b>' + m.qual + '</b></div><div class="kpi"><span>Aangenomen</span><b>' + m.hired + '</b></div><div class="kpi"><span>Besteed</span><b>' + eur(m.spend) + '</b></div><div class="kpi kpi--hl"><span>Per geschikte kandidaat</span><b>' + (m.qual ? eur(m.cpq) : '–') + '</b></div></div>';
    var ch = v.channels || [];
    if (ch.length) {
      var tot = ch.reduce(function (t, c) { return t + c.clicks; }, 0) || 1;
      h += '<div class="card section"><p class="card__label">Waar staat je vacature</p><p class="hint" style="margin:-4px 0 12px">Betaald op Instagram en Facebook, en gratis op vacaturesites en Google. Eén vacature, overal tegelijk.</p><table class="tbl"><thead><tr><th>Kanaal</th><th>Soort</th><th>Status</th><th class="r">Bezoekers</th></tr></thead><tbody>' +
        ch.map(function (c) { return '<tr><td><b>' + esc(c.name) + '</b><div class="minibar"><span style="width:' + Math.round(c.clicks / tot * 100) + '%"></span></div></td><td>' + c.kind + '</td><td><span class="pill pill--' + (c.status === 'live' ? 'live' : 'gepauzeerd') + '">' + c.status + '</span></td><td class="r">' + num(c.clicks) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    h += '<div class="grid grid-2 section"><div class="card"><p class="card__label">Selectie</p>' +
      (v.selection_by_yd ? '<p><b>YoungDedicated doet de selectie.</b> Wij bellen elke sollicitant binnen 24 uur en zetten alleen geschikte mensen bij jou klaar.</p>' : '<p><b>Jij doet de selectie.</b> Geen tijd? Wij bellen elke sollicitant binnen 24 uur en zetten alleen geschikte mensen klaar.</p>') +
      (demo ? '<p><button class="btn ' + (v.selection_by_yd ? 'btn--ghost' : 'btn--gold') + ' btn--sm" data-action="togglesel" data-id="' + v.id + '">' + (v.selection_by_yd ? 'Zelf selecteren' : 'Selectie uitbesteden, €495') + '</button></p>' : '') + '</div>' +
      '<div class="card"><p class="card__label">Snel naar</p><div class="row"><button class="btn btn--sm" data-action="tovac" data-id="' + v.id + '">Kandidaten</button><button class="btn btn--ghost btn--sm" data-action="tores" data-id="' + v.id + '">Resultaten</button>' + (v.page_url ? '<a class="btn btn--ghost btn--sm" href="' + esc(v.page_url) + '" target="_blank" rel="noopener">Vacaturepagina</a>' : '') + '</div></div></div>';
    return h;
  }
  var JOURNEY = {
    'Kick-off': ['Kick-off gedaan', 'Opdrachtbevestiging en factuur zijn verstuurd.'],
    'Betaald': ['Betaald', 'We bouwen je pagina en advertenties. Voorbeeld binnen 3 werkdagen.'],
    'Live': ['Live', 'Je vacature staat op Instagram, Facebook en 6 vacaturesites.'],
    'Vervuld': ['Vervuld', 'Gefeliciteerd. De campagne stopt en je rapport staat klaar.']
  };
  function journeyHint(v, steps) {
    var nx = steps.find(function (x) { return !x.done; });
    var txt = v.status === 'concept' ? 'We bellen je binnen 1 werkdag voor de kick-off.' : !nx ? 'Klaar. Deze vacature is vervuld.' : nx.label === 'Live' ? 'We bouwen je pagina en advertenties.' : '';
    return (txt ? '<p class="hint" style="margin-top:12px">' + txt + '</p>' : '') + (demo && nx ? '<p><button class="btn btn--gold btn--sm" data-action="advance" data-id="' + v.id + '">Demo: ' + esc(nx.label) + ' &rsaquo;</button></p>' : '');
  }
  function guarantee(v, m, day) {
    var tgt = v.target_qualified || 5, q = Math.min(m.qual, tgt), pq = Math.round(q / tgt * 100);
    if (v.plan !== 'vacature') return '<div class="card section"><p class="card__label">Doel</p><p class="big">' + m.qual + ' <small>van ' + tgt + ' geschikt</small></p><div class="bar bar--green"><span style="width:' + pq + '%"></span></div><p class="hint" style="margin-top:8px">Jaarmodel: we sturen elke maand bij op dit doel.</p></div>';
    var d = day || 1, status = m.qual >= tgt ? ['ok', 'Doel gehaald. Garantie niet nodig.'] : d <= 30 ? ['run', 'Op koers. Check op dag 30, nog ' + (30 - d) + ' dagen.'] : d <= 60 ? ['act', 'Garantie actief: 30 dagen gratis extra.'] : ['end', 'Niet gehaald: je krijgt €500 terug.'];
    return '<div class="card section gmeter gmeter--' + status[0] + '"><p class="card__label">Garantiemeter</p><div class="gm"><div><span>Geschikt</span><b>' + m.qual + ' / ' + tgt + '</b><div class="bar bar--green"><span style="width:' + pq + '%"></span></div></div>' +
      '<div><span>Dag</span><b>' + d + ' / ' + (d > 30 ? 60 : 30) + '</b><div class="bar"><span style="width:' + Math.min(100, Math.round(d / (d > 30 ? 60 : 30) * 100)) + '%"></span></div></div></div><p class="gm__status">' + status[1] + '</p></div>';
  }
  /* ---------- meldingen ---------- */
  function notes() {
    var out = [];
    S.apps.forEach(function (a) {
      var h = hoursSince(a.created_at), mm = match(a);
      if (a.stage === 'nieuw' && h <= 24) out.push({ at: a.created_at, id: a.id, t: 'Nieuwe sollicitant: ' + name(a), s: (mm.of ? mm.n + '/' + mm.of + ' match · ' : '') + ago(a.created_at), k: 'new' });
      else if (a.stage === 'nieuw') out.push({ at: new Date(new Date(a.created_at).getTime() + 864e5).toISOString(), id: a.id, t: name(a) + ' wacht op je belletje', s: 'Langer dan 24 uur', k: 'late' });
    });
    S.vacancies.forEach(function (v) {
      var m = metrics(v.id), d = vacDay(v);
      if (m.budget && m.spend / m.budget >= 0.8) out.push({ at: new Date(Date.now() - 3 * 36e5).toISOString(), act: 'buy', t: 'Budget bijna op: ' + v.title, s: Math.round(m.spend / m.budget * 100) + '% besteed', k: 'budget' });
      if (d && d >= 20 && d <= 30 && m.qual < (v.target_qualified || 5)) out.push({ at: new Date(Date.now() - 5 * 36e5).toISOString(), href: '#/vacatures/' + v.id, t: 'Garantiecheck over ' + (30 - d) + ' dagen', s: v.title, k: 'guar' });
    });
    return out.sort(function (a, b) { return new Date(b.at) - new Date(a.at); }).slice(0, 12);
  }
  function bellBtn() {
    if (S.as === 'recruiter') return '';
    var n = notes().filter(function (x) { return new Date(x.at) > S.seenAt; }).length;
    return '<button class="bell" data-action="notif" aria-label="Meldingen">' + I.bell + (n ? '<span class="bell__n">' + n + '</span>' : '') + '</button>';
  }
  function panelNotif() {
    var l = notes();
    return '<div class="scrim scrim--clear" data-action="close"></div><div class="notif" role="dialog" aria-label="Meldingen"><p class="card__label">Meldingen</p>' +
      (l.length ? l.map(function (x) {
        var attr = x.id ? 'data-action="open" data-id="' + x.id + '"' : x.act ? 'data-action="' + x.act + '"' : 'data-action="go" data-href="' + x.href + '"';
        return '<button class="notif__i notif__i--' + x.k + '" ' + attr + '><b>' + esc(x.t) + '</b><small>' + esc(x.s) + '</small></button>';
      }).join('') : '<p class="hint">Niets nieuws. Lekker rustig.</p>') + '</div>';
  }
  /* ---------- maandrapport ---------- */
  function viewReport() {
    var m = metrics('all'), org = (S.orgs.find(function (o) { return o.id === S.orgId; }) || {}).name || '';
    var month = new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    var late = S.apps.filter(function (a) { return a.stage === 'nieuw' && hoursSince(a.created_at) > 24; }).length;
    var hires = S.apps.filter(function (a) { return a.stage === 'aangenomen'; });
    var src = {}; S.apps.forEach(function (a) { src[a.source || 'Onbekend'] = (src[a.source || 'Onbekend'] || 0) + 1; });
    var next = ['Budget naar de advertentie die nu de meeste geschikte mensen oplevert.'];
    if (late) next.unshift('Sneller bellen: ' + late + (late === 1 ? ' persoon wacht' : ' mensen wachten') + ' langer dan 24 uur.');
    if (m.qual < S.vacancies.reduce(function (t, v) { return t + (v.target_qualified || 0); }, 0)) next.push('Twee nieuwe advertenties testen met echte beelden van de werkvloer.');
    else next.push('Doel gehaald. We houden de instroom op peil.');
    return '<div class="report"><div class="report__bar no-print"><a class="hint" href="#/resultaten">&lsaquo; Resultaten</a><button class="btn btn--gold" data-action="print">Download als pdf</button></div>' +
      '<div class="report__head"><img src="' + LOGO + '" alt="YoungDedicated"><div><p class="card__label">Maandrapport</p><h1>' + esc(org) + '</h1><p class="sub">' + month + ' · ' + S.vacancies.map(function (v) { return esc(v.title); }).join(', ') + '</p></div></div>' +
      '<div class="kpis"><div class="kpi"><span>Sollicitanten</span><b>' + m.apps + '</b></div><div class="kpi"><span>Geschikt</span><b>' + m.qual + '</b></div><div class="kpi"><span>Aangenomen</span><b>' + m.hired + '</b></div><div class="kpi"><span>Besteed</span><b>' + eur(m.spend) + '</b></div><div class="kpi kpi--hl"><span>Per geschikte</span><b>' + (m.qual ? eur(m.cpq) : '–') + '</b></div></div>' +
      '<div class="card section"><p class="card__label">In het kort</p><p>' + m.apps + ' mensen solliciteerden, ' + m.qual + ' zijn geschikt en ' + m.hired + (m.hired === 1 ? ' is' : ' zijn') + ' aangenomen. Elke geschikte kandidaat kostte ' + (m.qual ? eur(m.cpq) : '–') + ' aan media.</p></div>' +
      '<div class="card section"><p class="card__label">Per dag</p>' + chart('all') + '</div>' +
      '<div class="grid grid-2 section"><div class="card"><p class="card__label">Van bereik naar aanname</p><div class="funnel">' + funnelRows(m) + '</div></div>' +
      '<div class="card"><p class="card__label">Bronnen</p>' + Object.keys(src).sort(function (a, b) { return src[b] - src[a]; }).map(function (k) { return '<div class="money-row"><span>' + esc(k) + '</span><b>' + src[k] + '</b></div>'; }).join('') +
      '<div class="money-row"><span>Bereik</span><b>inbegrepen</b></div><div class="money-row"><span>Besteed</span><b>' + eur(m.spend) + '</b></div></div></div>' +
      (hires.length ? '<div class="card section"><p class="card__label">Aangenomen</p>' + hires.map(function (a) { return '<div class="money-row"><span>' + esc(name(a)) + '</span><b>' + esc(vac(a.vacancy_id).title || '') + '</b></div>'; }).join('') + '</div>' : '') +
      '<div class="card card--dark section"><p class="card__label">Volgende maand</p><ul class="must must--dark">' + next.map(function (x) { return '<li class="ok">' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<p class="hint section">YoungDedicated · team@youngdedicated.nl · Cijfers uit Meta en het kandidatensysteem.</p></div>';
  }
  /* ---------- rondleiding ---------- */
  var TOUR = [
    ['vandaag', 'Welkom.', 'Je werving op één scherm. Elke ochtend zie je wie je moet bellen. Beste match bovenaan.'],
    ['kandidaten', 'Iedereen op één bord.', 'Tik of sleep. Bevestiging, herinnering en afwijzing gaan automatisch.'],
    ['vandaag', 'Beslissen in één minuut.', 'Na het gesprek: Niet, Later of Aannemen. Meta leert welk profiel werkt.'],
    ['resultaten', 'Elke euro zichtbaar.', 'Live cijfers, meer reacties met één klik en elke maand een rapport als pdf.'],
    ['vacatures', 'Nieuwe vacature in 3 stappen.', 'Probeer ook "+ Nieuwe sollicitant" rechtsonder. Zo voelt het als het live is.']
  ];
  function tourCard() {
    var i = S.tour, t = TOUR[i];
    return '<div class="tour" role="dialog" aria-label="Rondleiding"><p class="card__label">' + (i + 1) + ' van ' + TOUR.length + '</p><h2>' + t[1] + '</h2><p>' + t[2] + '</p>' +
      '<div class="row"><button class="btn btn--ghost btn--sm" data-action="tour-end">Overslaan</button><button class="btn btn--gold btn--sm" data-action="tour-next">' + (i === TOUR.length - 1 ? 'Aan de slag' : 'Volgende') + '</button></div></div>';
  }
  var PLANS = [
    { key: 'basis', name: 'Kandidaten', price: 49900, unit: 'p/m', note: 'Reacties met video, jij kiest en belt. Met de afspraak' },
    { key: 'versneld', name: 'Voorgeselecteerd', price: 99900, unit: 'p/m', note: 'Voorselectie via WhatsApp, wij bellen binnen 5 minuten, gesprek in je agenda' },
    { key: 'moeilijk', name: 'Ontzorgd', price: 150000, unit: 'p/m', note: 'Wij doen alles tot de handtekening onder het contract' }
  ];
  function planOf(key) { return PLANS.find(function (x) { return x.key === key; }) || PLANS[0]; }
  function modalWizard() {
    var w = S.wiz, step = w.step;
    var h = '<div class="scrim" data-action="close"></div><div class="modal modal--wide" role="dialog" aria-modal="true" aria-label="Nieuwe vacature"><p class="card__label">Stap ' + step + ' van 3</p>';
    if (step === 1) h += '<h2>Wie zoek je?</h2><label for="w-title">Functie</label><input id="w-title" type="text" value="' + esc(w.title) + '" placeholder="Bijvoorbeeld: servicemonteur"><label for="w-loc">Plaats</label><input id="w-loc" type="text" value="' + esc(w.location) + '" placeholder="Bijvoorbeeld: Utrecht">';
    if (step === 2) h += '<h2>Welk pakket past bij de functie?</h2><div class="packs">' +
      PLANS.map(function (pl) { return '<button class="pack" data-action="wset" data-k="plan" data-v="' + pl.key + '" aria-pressed="' + (w.plan === pl.key) + '"><span><b>' + pl.name + '</b><small>' + pl.note + '</small></span><span>' + eur(pl.price) + ' ' + pl.unit + '</span></button>'; }).join('') + '</div>' +
      '<div class="money-row"><span>Pagina, campagnes, vacaturesites, systeem, opvolging, dashboard</span><b>inbegrepen</b></div><div class="money-row"><span>Bereik</span><b>inbegrepen</b></div>' +
      '<p class="hint">Per maand: eerste 2 maanden vast, daarna maandelijks opzegbaar. Per jaar: 10% korting. Ontzorgd loopt per maand en stopt bij de handtekening. Met de afspraak.</p>';
    if (step === 3) {
      var once = (w.selection ? PRICE.selectie : 0) + (w.beeld ? PRICE.beeld : 0);
      h += '<h2>Wat mogen wij nog doen?</h2><div class="packs">' +
        '<button class="pack" data-action="wset" data-k="selection" aria-pressed="' + !!w.selection + '"><span><b>Selectie door ons</b><small>Wij bellen iedereen binnen 24 uur</small></span><span>+ ' + eur(PRICE.selectie) + '</span></button>' +
        '<button class="pack" data-action="wset" data-k="beeld" aria-pressed="' + !!w.beeld + '"><span><b>Foto en video door ons</b><small>Anders gebruiken we jullie eigen beeld</small></span><span>+ ' + eur(PRICE.beeld) + '</span></button></div>' +
        '<div class="money-row"><span>' + 'Per maand, per vacature' + '</span><b>' + eur(planOf(w.plan).price) + '</b></div>' + (once ? '<div class="money-row"><span>Eenmalig</span><b>' + eur(once) + '</b></div>' : '') +
        '<p class="hint">Inclusief vacaturepagina, campagnes, portaal, opvolging en koppeling met vacaturesites. Bedragen excl. btw. Je betaalt pas na de kick-off.</p>';
    }
    h += '<div class="row" style="margin-top:16px">' + (step > 1 ? '<button class="btn btn--ghost" data-action="wback">Terug</button>' : '') +
      '<button class="btn ' + (step === 3 ? 'btn--gold' : '') + '" data-action="wnext">' + (step === 3 ? 'Aanvraag versturen' : 'Volgende') + '</button></div></div>';
    return h;
  }

  /* ---------- cashback, netwerk, cockpit, recruiter (demo) ---------- */
  function credit() {
    if (!demo) return { credit: 0, list: [] };
    var list = window.YD_DEMO.placements.filter(function (p) { return p.org === S.orgId && p.status === 'geplaatst'; });
    return { credit: list.reduce(function (t, p) { return t + Math.round(p.fee_cents * 0.2); }, 0), list: list };
  }
  function split(fee) { return { recruiter: Math.round(fee / 2), yd: Math.round(fee / 2), client: Math.round(fee * 0.2), ydNet: Math.round(fee * 0.3) }; }
  function viewCockpit() {
    var C = window.YD_DEMO.cockpit, mrr = C.mrr_trend[C.mrr_trend.length - 1];
    var act = C.clients.reduce(function (t, c) { return t + c.vacancies; }, 0);
    var speed = C.clients.map(function (c) { return c.speed_h; }).sort(function (a, b) { return a - b; })[Math.floor(C.clients.length / 2)];
    var cpq = Math.round(C.clients.reduce(function (t, c) { return t + c.cpq; }, 0) / C.clients.length);
    var mix = [['Jaarmodel', mrr, '#111'], ['Vacatures en selectie', C.once_month_cents, '#d1b75c'], ['Fee op extra budget', C.media_fee_month_cents, '#9c8740'], ['Recruitersnetwerk', C.network_month_cents, '#02daac']];
    var tot = mix.reduce(function (t, x) { return t + x[1]; }, 0);
    var maxT = Math.max.apply(null, C.mrr_trend);
    var h = '<h1>Cockpit</h1><p class="sub">De cijfers waar een koper naar kijkt. Demo met verzonnen klanten.</p>';
    h += '<div class="kpis"><div class="kpi kpi--hl"><span>MRR</span><b>' + eur(mrr) + '</b></div><div class="kpi"><span>ARR</span><b>' + eur(mrr * 12) + '</b></div><div class="kpi"><span>Netto-omzetretentie</span><b>' + C.nrr + '%</b></div><div class="kpi"><span>Mediaan belsnelheid</span><b>' + speed + ' uur</b></div><div class="kpi"><span>Per geschikte kandidaat</span><b>' + eur(cpq) + '</b></div></div>';
    h += '<div class="grid grid-2"><div class="card"><p class="card__label">Terugkerende omzet per maand</p><div class="mrr">' + C.mrr_trend.map(function (v, i) { return '<div><span style="height:' + Math.max(4, Math.round(v / maxT * 140)) + 'px"></span><b>' + eur(v) + '</b><small>' + C.months[i] + '</small></div>'; }).join('') + '</div></div>' +
      '<div class="card"><p class="card__label">Omzetmix deze maand</p><div class="stack">' + mix.map(function (x) { return '<span style="width:' + (x[1] / tot * 100).toFixed(1) + '%;background:' + x[2] + '"></span>'; }).join('') + '</div>' +
      mix.map(function (x) { return '<div class="money-row"><span><i class="dot" style="background:' + x[2] + '"></i>' + x[0] + '</span><b>' + eur(x[1]) + '</b></div>'; }).join('') + '</div></div>';
    h += '<div class="card section"><p class="card__label">Klanten (' + C.clients.length + ', ' + act + ' vacatures)</p><table class="tbl"><thead><tr><th>Klant</th><th>Model</th><th class="r">MRR</th><th class="r">Per geschikte</th><th class="r">Belsnelheid</th><th>Status</th></tr></thead><tbody>' +
      C.clients.map(function (c) { return '<tr><td><b>' + esc(c.name) + '</b></td><td>' + c.plan + '</td><td class="r">' + (c.mrr ? eur(c.mrr) : '–') + '</td><td class="r">' + eur(c.cpq) + '</td><td class="r">' + c.speed_h + ' uur</td><td><span class="pill pill--' + (c.health === 'op koers' ? 'live' : 'gepauzeerd') + '">' + esc(c.health) + '</span></td></tr>'; }).join('') + '</tbody></table>' +
      '<p class="hint">Belsnelheid = mediaan tijd tussen sollicitatie en eerste contact. Traag bellen is de grootste oorzaak van uitval. De cockpit laat zien bij wie je moet bijsturen.</p></div>';
    return h;
  }
  function viewPool() {
    var D = window.YD_DEMO, fits = ['all', 'Techniek', 'Sales'];
    var list = D.pool.filter(function (p) { return p.status === 'beschikbaar' && (S.poolFit === 'all' || p.fit === S.poolFit); });
    var h = '<h1>Kandidatenpool</h1><p class="sub">Gescreende kandidaten die toestemming gaven om gedeeld te worden. Je betaalt alleen bij een plaatsing.</p>';
    h += '<div class="card card--dark" style="margin-bottom:16px"><p class="card__label">Zo werkt het</p><div class="how"><div><b>1</b>Claim een kandidaat. Je krijgt direct de contactgegevens.</div><div><b>2</b>Plaats hem bij jouw opdrachtgever, tegen jouw eigen fee.</div><div><b>3</b>Je deelt 50% van de fee met YoungDedicated. Meer niet.</div></div></div>';
    h += '<div class="chips">' + fits.map(function (f) { return '<button class="chip" data-action="fit" data-id="' + f + '" aria-pressed="' + (S.poolFit === f) + '">' + (f === 'all' ? 'Alles' : f) + '<span class="n">' + D.pool.filter(function (p) { return p.status === 'beschikbaar' && (f === 'all' || p.fit === f); }).length + '</span></button>'; }).join('') + '</div>';
    h += '<div class="pool">' + list.map(function (p) {
      return '<div class="card poolcard"><div class="row" style="justify-content:space-between"><span class="person__ini">' + esc(p.initials.replace(/[ .]/g, '').slice(0, 2).toUpperCase()) + '</span><span class="pill pill--live">' + esc(p.fit) + '</span></div>' +
        '<p class="vac__title" style="margin-top:10px">' + esc(p.role) + '</p><p class="hint" style="margin:2px 0 10px">' + esc(p.region) + ' · ' + esc(p.experience) + ' ervaring · start ' + esc(p.available.toLowerCase()) + '</p>' +
        '<button class="btn btn--sm btn--block" data-action="claim" data-id="' + p.id + '">Claim kandidaat</button></div>';
    }).join('') + '</div>';
    if (!list.length) h += '<div class="card empty">Geen kandidaten in deze categorie.</div>';
    return h;
  }
  function viewPlacements() {
    var D = window.YD_DEMO, mine = D.pool.filter(function (p) { return p.status !== 'beschikbaar'; });
    var h = '<h1>Mijn plaatsingen</h1><p class="sub">Geclaimde kandidaten en wat je eraan verdient.</p>';
    if (!mine.length) return h + '<div class="card empty"><strong>Nog niets geclaimd.</strong>Kies een kandidaat in de pool.</div>';
    return h + '<div class="list">' + mine.map(function (p) {
      var sp = split(p.fee_cents || 300000);
      return '<div class="card vac"><div class="vac__main"><span class="pill pill--' + (p.status === 'geplaatst' ? 'live' : 'gepauzeerd') + '">' + p.status + '</span><p class="vac__title" style="margin-top:8px">' + esc(p.contact || p.initials) + ' · ' + esc(p.role) + '</p><p class="hint" style="margin:2px 0 0">' + esc(p.region) + (p.contact ? ' · ' + esc(p.phone) : '') + '</p></div>' +
        '<div class="row"><div class="kpi"><span>Jouw fee</span><b>' + eur(p.fee_cents || 300000) + '</b></div><div class="kpi"><span>Jij houdt</span><b>' + eur(sp.recruiter) + '</b></div></div>' +
        (p.status !== 'geplaatst' ? '<button class="btn btn--green btn--sm" data-action="placed" data-id="' + p.id + '">Geplaatst</button>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function modalClaim() {
    var p = window.YD_DEMO.pool.find(function (x) { return x.id === S.claim; }), fee = 300000, sp = split(fee);
    return '<div class="scrim" data-action="close"></div><div class="modal" role="dialog" aria-modal="true" aria-label="Kandidaat claimen"><h2>' + esc(p.role) + ' claimen</h2>' +
      '<p class="hint">' + esc(p.region) + ' · ' + esc(p.experience) + ' ervaring. Toestemming voor delen gegeven bij sollicitatie.</p>' +
      '<label for="c-fee">Jouw verwachte plaatsingsfee</label><input id="c-fee" type="number" min="500" step="250" value="' + fee / 100 + '" data-action="fee">' +
      '<div id="c-split">' + splitHtml(sp) + '</div>' +
      '<div class="row" style="margin-top:16px"><button class="btn btn--gold" data-action="confirm-claim">Claim en toon contactgegevens</button><button class="btn btn--ghost" data-action="close">Annuleren</button></div>' +
      '<p class="hint">Je betaalt alleen als de kandidaat via jou ergens begint. Afspraken liggen vast in de netwerkovereenkomst.</p></div>';
  }
  function splitHtml(sp) {
    return '<div class="money-row"><span>Jij houdt</span><b>' + eur(sp.recruiter) + '</b></div><div class="money-row"><span>YoungDedicated</span><b>' + eur(sp.yd) + '</b></div>' +
      '<p class="hint">Van het deel van YoungDedicated gaat ' + eur(sp.client) + ' als tegoed naar de werkgever waar de kandidaat eerst solliciteerde.</p>';
  }

  /* ---------- drawer ---------- */
  function drawer() {
    var a = S.apps.find(function (x) { return x.id === S.open; }); if (!a) return '';
    var v = vac(a.vacancy_id), idx = STAGES.findIndex(function (s) { return s.key === a.stage; });
    var bar = STAGES.slice(0, 4).map(function (s, i) { var cls = a.stage === 'afgewezen' ? 'rej' : a.stage === 'aangenomen' ? 'hired' : i <= idx ? 'on' : ''; return '<span class="' + cls + '"></span>'; }).join('');
    var next = { nieuw: ['gebeld', 'Gebeld, past goed'], gebeld: ['invite', 'Uitnodigen'], gesprek: ['aangenomen', 'Aannemen'] }[a.stage];
    var decide = next
      ? '<div class="decide"><button class="btn ' + (next[0] === 'aangenomen' ? 'btn--green' : '') + '" data-action="' + (next[0] === 'invite' ? 'invite' : 'stage') + '" data-stage="' + next[0] + '">' + next[1] + '</button><button class="btn btn--red" data-action="stage" data-stage="afgewezen">Afwijzen</button></div>'
      : '<div class="card" style="text-align:center"><b>' + (a.stage === 'aangenomen' ? 'Aangenomen. Gefeliciteerd!' : 'Afgewezen') + '</b><p><button class="btn btn--ghost btn--sm" data-action="stage" data-stage="gebeld">Terugzetten</button></p></div>';
    var qa = Object.keys(a.answers || {}).map(function (k) { return '<dt>' + esc(k) + '</dt><dd>' + esc(a.answers[k]) + '</dd>'; }).join('');
    var tl = S.events.slice().reverse().map(function (e) {
      var txt = e.type === 'fase' ? 'Van ' + (STAGE_LABEL[e.from_stage] || e.from_stage) + ' naar <b>' + (STAGE_LABEL[e.to_stage] || e.to_stage) + '</b>' : esc(e.body || '');
      return '<li>' + txt + '<small>' + esc(e.actor_name || '') + ' · ' + fdate(e.created_at) + '</small></li>';
    }).join('');
    var c = a.candidate;
    return '<div class="scrim" data-action="close"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(name(a)) + '">' +
      '<div class="drawer__head"><button class="icon-btn drawer__close" data-action="close" aria-label="Sluiten">' + I.close + '</button>' +
      '<h2>' + esc(name(a)) + '</h2><p>' + esc(v.title || '') + ' · ' + esc(c.city || '') + ' · ' + ago(a.created_at) + '</p><div class="stagebar">' + bar + '</div></div>' +
      '<div class="drawer__body">' +
        '<div class="row">' + (c.phone ? '<a class="btn btn--green" href="tel:' + esc(c.phone) + '" data-action="called" data-id="' + a.id + '">' + I.phone + 'Bel</a><a class="btn" style="background:#25d366" href="https://wa.me/' + intlPhone(c.phone) + '" target="_blank" rel="noopener" data-action="called" data-id="' + a.id + '">' + I.wa + 'WhatsApp</a>' : '') +
          (c.email ? '<a class="btn btn--ghost" href="mailto:' + esc(c.email) + '">' + I.mail + 'Mail</a>' : '') + '</div>' +
        decide + (S.inviting ? invitePicker(a) : '') +
        (match(a).of ? '<div class="card"><p class="card__label">Harde eisen</p><ul class="must">' + match(a).items.map(function (i) { return '<li class="' + (i.ok ? 'ok' : 'no') + '">' + esc(i.label) + '</li>'; }).join('') + '</ul></div>' : '') +
        autoCard(a) +
        '<div class="card"><p class="card__label">Geschikte kandidaat?</p><div class="row"><button class="chip" data-action="qual" data-v="true" aria-pressed="' + (a.qualified === true) + '">Ja, geschikt</button><button class="chip" data-action="qual" data-v="false" aria-pressed="' + (a.qualified === false) + '">Nee</button></div><p class="hint">Telt mee voor je garantie en leert de campagne wie je zoekt.</p></div>' +
        (a.stage === 'afgewezen' && demo ? '<div class="card"><p class="card__label">Netwerk</p>' + (a.candidate.consent_network
            ? (a.network_status ? '<p><b>Aangeboden aan het recruitersnetwerk.</b> Wordt deze kandidaat elders aangenomen, dan krijg jij cashback als tegoed.</p>' : '<p>Past niet bij jou, maar misschien wel ergens anders. De kandidaat gaf toestemming om gedeeld te worden.</p><p><button class="btn btn--gold btn--sm" data-action="network">Doorplaatsen via netwerk</button></p>')
            : '<p class="hint">Geen toestemming om te delen. Deze kandidaat wordt na 4 weken verwijderd.</p>') + '</div>' : '') +
        '<div class="card"><p class="card__label">Antwoorden</p><dl class="qa" style="margin:0">' + (qa || '<dd class="muted">Geen extra vragen.</dd>') + '</dl>' +
          (c.cv_path ? '<p><button class="btn btn--ghost btn--sm" data-action="cv">Bekijk cv</button></p>' : '') + '</div>' +
        '<div class="card"><p class="card__label">Notitie</p><textarea id="note" placeholder="Wat viel op in het gesprek?"></textarea><p><button class="btn btn--sm" data-action="note">Opslaan</button></p></div>' +
        '<div class="card"><p class="card__label">Tijdlijn</p><ul class="timeline">' + (tl || '<li>Nog niets gebeurd.</li>') + '</ul></div>' +
      '</div></aside>';
  }
  var SLOTS = (function () {
    var out = [], d = new Date(); var days = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
    while (out.length < 3) { d = new Date(d.getTime() + 864e5); if (d.getDay() === 0 || d.getDay() === 6) continue; out.push(days[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1) + ' ' + (out.length === 1 ? '14:00' : '10:00')); }
    return out;
  })();
  function invitePicker(a) {
    return '<div class="card"><p class="card__label">Kies een moment</p><div class="row">' + SLOTS.map(function (sl, i) { return '<button class="chip" data-action="slot" data-v="' + i + '" aria-pressed="' + (S.slot === i) + '">' + sl + '</button>'; }).join('') + '</div>' +
      '<p><button class="btn btn--green" data-action="send-invite">Stuur uitnodiging</button></p><p class="hint">Kandidaat bevestigt met één tik. Herinnering gaat automatisch.</p></div>';
  }
  function autoCard(a) {
    var l = [['Bevestiging gestuurd', 1]];
    if (a.stage === 'nieuw') l.push(hoursSince(a.created_at) > 48 ? ['Herinnering aan jou gestuurd', 1] : ['Herinnering aan jou na 48 uur', 0]);
    if (a.stage === 'gesprek') l.push(['Herinnering gesprek, dag van tevoren', 0]);
    if (a.stage === 'afgewezen') l.push(['Nette afwijzing verstuurd', 1]);
    if (a.stage === 'aangenomen') l.push(['Meta leert: dit profiel werkt', 1]);
    return '<div class="card"><p class="card__label">Automatisch</p><ul class="must">' + l.map(function (x) { return '<li class="' + (x[1] ? 'ok' : 'wait') + '">' + x[0] + '</li>'; }).join('') + '</ul></div>';
  }
  function modalDecide() {
    var q = S.dq || [], a = S.apps.find(function (x) { return x.id === q[S.di]; });
    var h = '<div class="scrim" data-action="dclose"></div><div class="modal decide-modal" role="dialog" aria-modal="true" aria-label="Beslissen">';
    if (!a) return h + '<h2>Klaar.</h2><p class="sub">' + (S.dhired ? S.dhired + ' aangenomen. Meta leert welk profiel werkt.' : 'Alles beslist.') + '</p><button class="btn" data-action="dclose">Sluiten</button></div>';
    var m = match(a), note = (S.devents || []).filter(function (e) { return e.type === 'notitie'; }).pop();
    return h + '<p class="card__label">' + (S.di + 1) + ' van ' + q.length + '</p>' +
      '<div class="dcard"><span class="person__ini">' + esc(ini(a)) + '</span><h2>' + esc(name(a)) + '</h2><p class="hint">' + esc(vac(a.vacancy_id).title || '') + ' · ' + esc(a.candidate.city || '') + '</p>' +
      (m.of ? '<ul class="must must--inline">' + m.items.map(function (i) { return '<li class="' + (i.ok ? 'ok' : 'no') + '">' + esc(i.label) + '</li>'; }).join('') + '</ul>' : '') +
      (note ? '<p class="dnote">&ldquo;' + esc(note.body) + '&rdquo;</p>' : '') + '</div>' +
      '<div class="decide decide--3"><button class="btn btn--red" data-action="dpick" data-v="afgewezen">Niet</button><button class="btn btn--ghost" data-action="dpick" data-v="later">Later</button><button class="btn btn--green" data-action="dpick" data-v="aangenomen">Aannemen</button></div></div>';
  }
  function loadDecide() { var a = S.apps.find(function (x) { return x.id === (S.dq || [])[S.di]; }); S.devents = []; if (a) api.events(a).then(function (e) { S.devents = e; if (modal === 'decide') render(); }); }
  function kpiBar() {
    if (S.as === 'recruiter') return '';
    var m = metrics('all');
    return '<a class="kpibar" href="#/resultaten"><span><b>' + m.apps + '</b> sollicitanten</span><span><b>' + m.qual + '</b> geschikt</span><span><b>' + m.hired + '</b> aangenomen</span><span><b>' + (m.qual ? eur(m.cpq) : '–') + '</b> per geschikte</span><span><b>' + eur(m.spend) + '</b> ingezet</span></a>';
  }
  function modalBuy() {
    var vacId = S.vacFilter === 'all' ? (S.vacancies[0] || {}).id : S.vacFilter;
    var m = metrics(vacId);
    return '<div class="scrim" data-action="close"></div><div class="modal" role="dialog" aria-modal="true" aria-label="Meer reacties">' +
      '<h2>Meer reacties voor ' + esc(vac(vacId).title || '') + '</h2><p class="hint">Kies een extra budget. Wij zetten het in op de advertenties die nu het best werken.</p>' +
      '<div class="packs">' + PACKS.map(function (p, i) {
        var est = m.cpa ? Math.round(p / m.cpa) : null, eq = est && m.apps ? Math.round(est * m.qual / m.apps) : null;
        return '<button class="pack" data-action="pack" data-v="' + p + '" aria-pressed="' + (i === 1) + '"><span><b>' + eur(p) + '</b><small>' + (est ? '≈ ' + est + ' sollicitanten' + (eq ? ', ≈ ' + eq + ' geschikt' : '') : 'Extra bereik') + '</small></span><span>' + (i === 1 ? 'Meest gekozen' : '') + '</span></button>';
      }).join('') + '</div>' +
      (m.cpa ? '<p class="hint">Schatting op basis van je huidige ' + eur(m.cpa) + ' per sollicitant. Geen garantie op aantallen.</p>' : '') +
      '<div class="row" style="margin-top:12px"><button class="btn btn--gold" data-action="confirm-buy" data-vac="' + vacId + '">Bestellen</button><button class="btn btn--ghost" data-action="close">Annuleren</button></div>' +
      '<p class="hint">Je krijgt een betaallink per mail. Na betaling staat het budget binnen 1 werkdag live. Bedragen excl. btw.</p></div>';
  }

  /* ---------- demo: live en klantreis ---------- */
  function simulate() {
    var D = window.YD_DEMO, N = D.names;
    var v = (S.vacFilter !== 'all' && vac(S.vacFilter).status === 'live') ? vac(S.vacFilter) : S.vacancies.filter(function (x) { return x.status === 'live'; }).pop();
    if (!v) { toast('Zet eerst een vacature live.'); return; }
    function pk(a) { return a[Math.floor(Math.random() * a.length)]; }
    var ans = {}; Object.keys(v.qa || {}).forEach(function (k) { ans[k] = Math.random() < 0.7 ? v.qa[k][0] : pk(v.qa[k]); });
    var fn = pk(N.first), ln = pk(N.last), now = new Date().toISOString();
    var a = { id: 'app-live-' + Date.now(), organization_id: v.organization_id, vacancy_id: v.id, stage: 'nieuw', qualified: null, source: pk(N.sources), created_at: now, stage_changed_at: now, first_contact_at: null, answers: ans,
      candidate: { first_name: fn, last_name: ln, email: (fn + '.' + ln.replace(/ /g, '')).toLowerCase() + '@voorbeeld.nl', phone: '0612' + String(100000 + Math.floor(Math.random() * 899999)), city: pk(N.cities), cv_path: 'demo.pdf', consent_network: false } };
    D.apps.unshift(a); S.apps.unshift(a);
    D.events.push({ application_id: a.id, type: 'systeem', body: 'Gesolliciteerd via ' + a.source + '. Bevestiging verstuurd.', created_at: now, actor_name: 'Systeem' });
    var today = now.slice(0, 10), st = S.stats.find(function (x) { return x.vacancy_id === v.id && x.date === today; });
    if (st) st.leads++;
    var mm = match(a); toast('Nieuwe sollicitant: ' + name(a) + (mm.of ? ' · ' + mm.n + '/' + mm.of : ''));
    render();
  }
  function advance(v) {
    var D = window.YD_DEMO;
    if (!v.milestones) v.milestones = [{ label: 'Aanvraag', done: true }, { label: 'Kick-off', done: true }, { label: 'Betaald', done: true }, { label: 'Live', done: v.status === 'live' }, { label: 'Vervuld', done: false }];
    var nx = v.milestones.find(function (x) { return !x.done; }); if (!nx) return;
    nx.done = true;
    if (nx.label === 'Kick-off') v.status = 'concept';
    if (nx.label === 'Live') {
      v.status = 'live'; v.start_date = new Date().toISOString().slice(0, 10);
      var b = { id: 'b' + Date.now(), organization_id: v.organization_id, vacancy_id: v.id, amount_cents: v.plan === 'jaar' ? PRICE.budgetJaar : PRICE.budgetVac, type: 'toegekend', status: 'actief', created_at: new Date().toISOString() };
      D.budget.push(b); S.budget.push(b);
      var st = { organization_id: v.organization_id, vacancy_id: v.id, date: v.start_date, channel: 'meta', impressions: 1800, reach: 1150, clicks: 31, spend_cents: 2400, leads: 0 };
      D.stats.push(st); S.stats.push(st);
      v.channels = [['Instagram en Facebook', 'Betaald'], ['Google for Jobs', 'Gratis'], ['werk.nl', 'Gratis'], ['Adzuna', 'Gratis'], ['Jooble', 'Gratis'], ['Careerjet', 'Gratis'], ['Indeed', 'Gratis']].map(function (c, i) { return { key: 'c' + i, name: c[0], kind: c[1], status: i === 6 ? 'in test' : 'live', clicks: i ? Math.round(2 + Math.random() * 8) : 31 }; });
    }
    if (nx.label === 'Vervuld') v.status = 'vervuld';
    toast(JOURNEY[nx.label][0] + '. ' + JOURNEY[nx.label][1]);
    render();
  }


  /* ---------- monteurs: pakketten en kandidatenbak (fase 1 blauwdruk) ---------- */
  var PAKKETTEN = {
    basis: { key: 'basis', name: 'Kandidaten', price: 49900, note: 'Reacties met video, jij kiest', early: false },
    versneld: { key: 'versneld', name: 'Voorgeselecteerd', price: 99900, note: 'Wij selecteren voor en plannen het gesprek', early: true },
    moeilijk: { key: 'moeilijk', name: 'Ontzorgd', price: 150000, note: 'Wij doen alles tot de handtekening', early: true }
  };
  var EARLY_H = 48;
  function pakketOf(v) { return v && v.pakket ? PAKKETTEN[v.pakket] : null; }
  function activePakket() {
    if (S.noPack) return null;
    var best = null;
    S.vacancies.forEach(function (v) { var p = pakketOf(v); if (p && v.status === 'live' && !v.opgezegd_per && (!best || p.price > best.price)) best = p; });
    return best;
  }
  function stopDate(v) { var minTo = addMonths(v.start_date || new Date().toISOString(), 2), n = new Date(), eom = new Date(n.getFullYear(), n.getMonth() + 1, 0); return minTo > eom ? minTo : eom; }
  function addMonths(iso, n) { var d = new Date(iso); d.setMonth(d.getMonth() + n); return d; }
  function dday(d) { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' }); }
  function tStat(t) { return S.picked[t.id] || null; }
  function tYes(t) { var st = tStat(t); return st === 'ja' || st === 'zelf'; }
  function tPill(t) { var st = tStat(t); return st === 'zelf' ? '<span class="pill pill--live">Solliciteerde bij jou</span>' : st === 'ja' ? '<span class="pill pill--live">Zegt ja</span>' : st === 'uitgenodigd' ? '<span class="pill">Wacht op antwoord</span>' : st === 'nee' ? '<span class="pill">Past niet</span>' : ''; }
  function tName(t) { return t.first_name + ' ' + t.last_initial + '.'; }
  function tHours(t) { return hoursSince(t.created_at); }
  function tVisible(t, pk) { return tHours(t) >= EARLY_H || (pk && pk.early); }
  function videoTile(t, big) {
    return '<div class="tvid' + (big ? ' tvid--big' : '') + '" role="img" aria-label="Video van ' + esc(tName(t)) + '"><span class="tvid__ini">' + esc(t.first_name.charAt(0) + t.last_initial) + '</span>' +
      '<span class="tvid__play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span><span class="tvid__len">0:' + t.video_sec + '</span></div>';
  }
  function openTalent(id) {
    S.tOpen = id; S.tTab = 'profiel'; S.tSlot = 0; modal = 'talent'; S.tContact = S.tContact || {};
    var t = (S.talent || []).find(function (x) { return x.id === id; });
    render();
    if (!t || !activePakket() || !tStat(t)) return;
    if (tYes(t)) api.contact(t).then(function (c) { S.tContact[id] = c || {}; if (modal === 'talent' && S.tOpen === id) render(); });
    if (!demo) api.messages(id).then(function (m) { S.chats[id] = m; if (modal === 'talent' && S.tOpen === id) render(); });
  }
  function slotDate(i) {
    var d = new Date(), n = 0;
    while (true) { d = new Date(d.getTime() + 864e5); if (d.getDay() === 0 || d.getDay() === 6) continue; if (n === i) break; n++; }
    d.setHours(i === 1 ? 14 : 10, 0, 0, 0); return d;
  }
  function viewTalent() {
    var pk = activePakket(), kinds = ['all', 'Installatie', 'Elektro', 'Montage'];
    var all = (S.talent || []).slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    var list = all.filter(function (t) { return S.tKind === 'all' ? true : S.tKind === 'gekozen' ? S.picked[t.id] : t.kind === S.tKind; });
    var nPicked = Object.keys(S.picked).filter(function (k) { return S.picked[k]; }).length;
    var h = '<div class="row" style="justify-content:space-between;align-items:flex-start"><div><h1>Monteurs</h1><p class="sub">Hier kiest de monteur. Jij solliciteert, de monteur zegt ja of nee.</p></div>' +
      (demo ? '<label class="hint tswitch"><input type="checkbox" data-action="nopack"' + (S.noPack ? ' checked' : '') + '> Bekijk zonder pakket</label>' : '') + '</div>';
    h += pk
      ? '<div class="card card--dark tband"><div><p class="card__label">Pakket ' + pk.name + ' loopt</p><p>Solliciteer bij monteurs die je aanspreken. Zegt de monteur ja, dan zie je het nummer en plan je een gesprek.' + (pk.early ? ' Nieuwe monteurs zie je ' + EARLY_H + ' uur eerder dan bij Kandidaten.' : '') + '</p></div></div>'
      : '<div class="card tband tband--lock"><div><p class="card__label">Geen pakket actief</p><p>' + (all.length ? all.length + ' monteurs zoeken nu werk. ' : 'Monteurs zoeken nu werk. ') + 'Hun profielen en video\'s zie je vanaf Gezien (&euro;99 p/m). Dan kunnen monteurs ook bij jou solliciteren. Zelf monteurs benaderen kan vanaf Kandidaten.</p></div><a class="btn btn--gold btn--sm" href="#/vacatures">Start een pakket</a></div>';
    if (!pk) return h + '<div class="tgrid">' + [0, 1, 2].map(function () { return '<div class="card tcard tcard--wait"><div class="tvid"><span class="tvid__ini">?</span></div><p class="vac__title">Monteur</p><p class="hint">Zichtbaar met een pakket.</p></div>'; }).join('') + '</div>';
    h += '<div class="chips">' + kinds.map(function (k) { return '<button class="chip" data-action="tkind" data-id="' + k + '" aria-pressed="' + (S.tKind === k) + '">' + (k === 'all' ? 'Alle monteurs' : k) + '<span class="n">' + all.filter(function (t) { return k === 'all' || t.kind === k; }).length + '</span></button>'; }).join('') +
      '<button class="chip" data-action="tkind" data-id="gekozen" aria-pressed="' + (S.tKind === 'gekozen') + '">Gesolliciteerd<span class="n">' + nPicked + '</span></button></div>';
    h += '<div class="tgrid">' + list.map(function (t) {
      var fresh = tHours(t) < EARLY_H, vis = tVisible(t, pk);
      if (!vis) return '<div class="card tcard tcard--wait"><div class="tvid"><span class="tvid__ini">?</span></div><p class="vac__title">' + esc(t.role) + '</p><p class="hint">' + esc(t.city) + '. Nieuw profiel, zichtbaar over ' + Math.ceil(EARLY_H - tHours(t)) + ' uur.</p><p class="hint"><b>Voorgeselecteerd en Ontzorgd zien dit nu al.</b></p></div>';
      return '<div class="card tcard" role="button" tabindex="0" data-action="topen" data-id="' + t.id + '">' + videoTile(t) +
        '<div class="row tcard__top"><p class="vac__title">' + esc(tName(t)) + '</p>' + (tStat(t) ? tPill(t) : fresh ? '<span class="pill tpill--new">Nieuw</span>' : '') + '</div>' +
        '<p class="hint tcard__role">' + esc(t.role) + '</p><p class="hint">' + esc(t.city) + ' · ' + t.km + ' km · ' + t.years + ' jaar ervaring · ' + esc(t.available.toLowerCase()) + '</p>' +
        '<div class="tbadges">' + t.badges.map(function (b) { return '<span class="tbadge" title="' + esc(b.text) + '">' + esc(b.name) + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
    if (!list.length) h += '<div class="card empty">' + (S.tKind === 'gekozen' ? '<strong>Nog bij niemand gesolliciteerd.</strong>Open een profiel en tik op Solliciteer.' : 'Geen monteurs in deze categorie.') + '</div>';
    return h;
  }
  function modalTalent() {
    var t = (S.talent || []).find(function (x) { return x.id === S.tOpen; }); if (!t) return '';
    var pk = activePakket(), chat = S.chats[t.id] || [], tab = S.tTab;
    var ct = S.tContact && S.tContact[t.id];
    var st = tStat(t);
    var contact = pk && tYes(t)
      ? (ct ? '<div class="row">' + (ct.phone ? '<a class="btn btn--green btn--sm" href="tel:' + esc(ct.phone) + '">' + I.phone + esc(ct.phone) + '</a><a class="btn btn--sm" style="background:#25d366" href="https://wa.me/' + intlPhone(ct.phone) + '" target="_blank" rel="noopener">' + I.wa + 'WhatsApp</a>' : '') + (ct.email ? '<a class="btn btn--ghost btn--sm" href="mailto:' + esc(ct.email) + '">' + I.mail + 'Mail</a>' : '') + '</div>' : '<p class="hint">Contactgegevens laden...</p>')
      : '<div class="tlock"><span>06 •• •• •• ••</span><span>••••••@••••••.nl</span>' + (pk ? '<p class="hint">Je ziet het nummer zodra ' + esc(t.first_name) + ' ja zegt.</p>' : '<a class="btn btn--gold btn--sm" href="#/vacatures">Start een pakket om contact te zien</a>') + '</div>';
    var h = '<div class="scrim" data-action="close"></div><div class="modal modal--wide tmodal" role="dialog" aria-modal="true" aria-label="' + esc(tName(t)) + '">' +
      '<button class="icon-btn drawer__close" data-action="close" aria-label="Sluiten">' + I.close + '</button>' + videoTile(t, true) +
      '<h2 style="margin-top:16px">' + esc(tName(t)) + '</h2><p class="hint">' + esc(t.role) + ' · ' + esc(t.city) + ' · ' + t.km + ' km · ' + t.years + ' jaar ervaring · start ' + esc(t.available.toLowerCase()) + '</p>' +
      '<blockquote class="tquote">"' + esc(t.quote) + '"</blockquote>' +
      '<div class="row tacts">' + (st ? tPill(t) : !pk ? '<a class="btn btn--gold" href="#/vacatures">Start een pakket om te solliciteren</a>' : '<button class="btn btn--gold" data-action="tpick" data-id="' + t.id + '">Solliciteer bij ' + esc(t.first_name) + '</button>') +
      '<button class="chip" data-action="ttab" data-id="profiel" aria-pressed="' + (tab === 'profiel') + '">Profiel</button><button class="chip" data-action="ttab" data-id="chat" aria-pressed="' + (tab === 'chat') + '">Chat' + (chat.length ? '<span class="n">' + chat.length + '</span>' : '') + '</button><button class="chip" data-action="ttab" data-id="plan" aria-pressed="' + (tab === 'plan') + '">Plan gesprek</button></div>';
    if (tab === 'profiel') {
      h += '<div class="card tsub"><p class="card__label">Trainingsbadges</p><ul class="tblist">' + t.badges.map(function (b) { return '<li><b>' + esc(b.name) + '</b><span>' + esc(b.text) + '</span></li>'; }).join('') + '</ul></div>' +
        '<div class="card tsub"><p class="card__label">Contact</p>' + contact + '</div>';
    } else if (!pk) {
      h += '<div class="card tsub tlock"><p><b>Chat en agenda openen met een pakket.</b> Zo weet de monteur dat er een echte werkgever aan de andere kant zit.</p><a class="btn btn--gold btn--sm" href="#/vacatures">Start een pakket</a></div>';
    } else if (!st || st === 'nee') {
      h += '<div class="card tsub tlock"><p><b>' + (st === 'nee' ? esc(t.first_name) + ' heeft bedankt.' : 'Solliciteer eerst bij ' + esc(t.first_name) + '.') + '</b> ' + (st === 'nee' ? 'Er zijn er meer. Kijk verder in de lijst.' : 'Daarna kun je berichten sturen. Zegt ' + esc(t.first_name) + ' ja, dan zie je het nummer en plan je een gesprek.') + '</p></div>';
    } else if (tab === 'plan' && !tYes(t)) {
      h += '<div class="card tsub tlock"><p><b>Wacht op ' + esc(t.first_name) + '.</b> Een gesprek plannen kan zodra ' + esc(t.first_name) + ' ja zegt. Stuur gerust alvast een bericht.</p></div>';
    } else if (tab === 'chat') {
      h += '<div class="card tsub"><div class="tchat">' + (chat.length ? chat.map(function (m) { return '<p class="tmsg tmsg--' + m.from + '">' + esc(m.text) + '<small>' + esc(/T/.test(m.at) ? fdate(m.at) : m.at) + '</small></p>'; }).join('') : '<p class="hint">Stuur ' + esc(t.first_name) + ' een eerste bericht. Kort en eerlijk werkt het best.</p>') + '</div>' +
        '<div class="row tchat__in"><input id="tmsg" type="text" placeholder="Hoi ' + esc(t.first_name) + ', ik zag je video..." autocomplete="off"><button class="btn btn--sm" data-action="tsend" data-id="' + t.id + '">Stuur</button></div></div>';
    } else {
      h += '<div class="card tsub"><p class="card__label">Kies een moment</p><div class="row">' + SLOTS.map(function (sl, i) { return '<button class="chip" data-action="tslot" data-v="' + i + '" aria-pressed="' + (S.tSlot === i) + '">' + sl + '</button>'; }).join('') + '</div>' +
        '<p><button class="btn btn--green" data-action="tinvite" data-id="' + t.id + '">Stuur uitnodiging</button></p><p class="hint">' + esc(t.first_name) + ' bevestigt met één tik. Herinnering gaat automatisch, de dag ervoor en een uur van tevoren.</p></div>';
    }
    return h + '</div>';
  }
  function afspraakCard(v) {
    if (!v || !v.pakket || v.pakket === 'gezien') return '';
    var start = new Date(v.start_date || v.created_at || Date.now()), m1 = addMonths(start, 1), apps = S.apps.filter(function (a) { return a.vacancy_id === v.id; });
    var fit = apps.filter(function (a) { return ['geschikt', 'gesprek', 'aanbod', 'aangenomen'].indexOf(a.stage) > -1; }).length;
    var rt = demo ? 3 : null, ok = function (b) { return b ? '<b style="color:var(--green-d,#0a8f6a)">&#10003;</b>' : '<b style="color:var(--gold-d,#8a7430)">&bull;</b>'; };
    var row = function (txt, val, good) { return '<div class="money-row"><span>' + ok(good) + ' ' + txt + '</span><b>' + val + '</b></div>'; };
    return '<div class="card section"><p class="card__label">De afspraak</p><p class="hint" style="margin-top:0">We doen dit samen. Zo staan we ervoor.</p>' +
      '<p class="hint" style="margin:10px 0 4px"><b>Wij</b></p>' + row('Live binnen 5 werkdagen', dday(start), true) + row('Geschikte monteur gesproken in maand 1 (tot ' + dday(m1) + ')', fit ? fit + ' geschikt' : 'nog niet', fit > 0) +
      '<p class="hint" style="margin:10px 0 4px"><b>Jij</b></p>' + row('Reageren binnen 1 werkdag', rt != null ? 'gemiddeld ' + rt + ' uur' : 'wordt gemeten', rt == null || rt <= 24) + row('Salaris past bij de markt', 'vastgelegd', true) + row('Beeld en info aangeleverd', 'binnen 5 werkdagen', true) + row('Eisen zoals afgesproken', 'ja', true) +
      '<p class="hint">Doen we allebei wat we afspraken en spreek je in maand 1 geen geschikte monteur? Dan betaal je maand 2 niet. Wij gaan gewoon door.</p></div>';
  }
  function pakketCard(v) {
    var pk = pakketOf(v); if (!pk) return '';
    var start = v.start_date || new Date().toISOString(), minTo = addMonths(start, 2), canStop = Date.now() >= minTo.getTime();
    var stopAt = stopDate(v);
    var h = '<div class="card section"><div class="row" style="justify-content:space-between"><p class="card__label" style="margin:0">Pakket</p>' + (v.opgezegd_per ? '<span class="pill pill--gepauzeerd">Opgezegd</span>' : '<span class="pill pill--live">Loopt</span>') + '</div>' +
      '<p class="big" style="margin-top:8px">' + pk.name + ' <small>' + eur(pk.price) + ' per maand, alles inbegrepen</small></p>' +
      '<div class="money-row"><span>Gestart</span><b>' + dday(start) + '</b></div><div class="money-row"><span>Minimaal tot</span><b>' + dday(minTo) + '</b></div>' +
      (v.opgezegd_per ? '<div class="money-row"><span>Stopt op</span><b>' + dday(v.opgezegd_per) + '</b></div><p><button class="btn btn--ghost btn--sm" data-action="pkundo" data-id="' + v.id + '">Toch doorgaan</button></p>'
        : ('<p class="hint">Wijzig je pakket per volgende maand' + (v.pakket_next && v.pakket_next !== v.pakket ? ' (gepland: ' + PAKKETTEN[v.pakket_next].name + ')' : '') + ':</p><div class="row">' + Object.keys(PAKKETTEN).map(function (k) { return '<button class="chip" data-action="pkset" data-id="' + v.id + '" data-v="' + k + '" aria-pressed="' + ((v.pakket_next || v.pakket) === k) + '">' + PAKKETTEN[k].name + ' · ' + eur(PAKKETTEN[k].price) + '</button>'; }).join('') + '</div>') +
          '<p class="hint">Stoel gevuld? Zeg op met één knop. ' + (canStop ? 'Je pakket stopt dan op ' + dday(stopAt) + '.' : 'Dat kan per ' + dday(minTo) + ', na de eerste 2 maanden.') + '</p><p><button class="btn btn--red btn--sm" data-action="pkstop" data-id="' + v.id + '">Opzeggen</button></p>') +
      '</div>';
    return h;
  }

  /* ---------- render ---------- */
  var modal = null;
  function render() {
    if (!S.profile) return;
    var r = route(), parts = routeParts();
    if (S.as === 'recruiter' && r !== 'pool' && r !== 'plaatsingen') r = 'pool';
    if (S.as !== 'recruiter' && (r === 'pool' || r === 'plaatsingen')) r = 'vandaag';
    if (r === 'cockpit' && !(demo && S.as === 'yd')) r = 'vandaag';
    if (S.as === 'recruiter') S.tour = null;
    var body = r === 'rapport' ? viewReport() : r === 'kandidaten' ? viewCandidates() : r === 'resultaten' ? viewResults() : r === 'vacatures' ? (parts[1] ? viewVacancy(parts[1]) : viewVacancies()) :
      r === 'cockpit' ? viewCockpit() : r === 'monteurs' ? viewTalent() : r === 'pool' ? viewPool() : r === 'plaatsingen' ? viewPlacements() : viewToday();
    app.innerHTML = shell(body) + (S.open ? drawer() : '') + (modal === 'buy' ? modalBuy() : modal === 'wiz' ? modalWizard() : modal === 'claim' ? modalClaim() : modal === 'decide' ? modalDecide() : modal === 'notif' ? panelNotif() : modal === 'talent' ? modalTalent() : '') + (S.tour != null ? tourCard() : '');
    document.body.classList.toggle('is-report', r === 'rapport');
    bindDnD();
  }
  function openApp(id) {
    S.open = id; S.events = []; S.inviting = false; S.slot = 0;
    var a = S.apps.find(function (x) { return x.id === id; });
    render();
    api.events(a).then(function (e) { S.events = e; if (S.open === id) render(); });
  }
  function bindDnD() {
    app.querySelectorAll('.kcard').forEach(function (k) { k.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', k.dataset.id); }); });
    app.querySelectorAll('.col').forEach(function (c) {
      c.addEventListener('dragover', function (e) { e.preventDefault(); c.classList.add('drop'); });
      c.addEventListener('dragleave', function () { c.classList.remove('drop'); });
      c.addEventListener('drop', function (e) {
        e.preventDefault(); c.classList.remove('drop');
        var a = S.apps.find(function (x) { return x.id === e.dataTransfer.getData('text/plain'); });
        if (a && a.stage !== c.dataset.stage) changeStage(a, c.dataset.stage);
      });
    });
  }
  function changeStage(a, stage) {
    api.setStage(a, stage).then(function () {
      toast(name(a) + ': ' + STAGE_LABEL[stage]);
      if (S.open === a.id) return api.events(a).then(function (e) { S.events = e; render(); });
      render();
    }).catch(function () { toast('Opslaan mislukt. Probeer het opnieuw.'); });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action]'); if (!t) return;
    var act = t.dataset.action;
    var a = S.apps.find(function (x) { return x.id === S.open; });
    if (act === 'called') {
      e.stopPropagation();
      var ca = S.apps.find(function (x) { return x.id === t.dataset.id; });
      if (ca) api.addEvent(ca, 'contact', t.href.indexOf('wa.me') > -1 ? 'WhatsApp gestuurd' : 'Gebeld').catch(function () {});
      return;
    }
    if (act === 'open') { modal = null; return openApp(t.dataset.id); }
    if (act === 'notif') { modal = modal === 'notif' ? null : 'notif'; S.seenAt = Date.now(); return render(); }
    if (act === 'go') { modal = null; location.hash = t.dataset.href; return; }
    if (act === 'print') return window.print();
    if (act === 'tour') { S.tour = 0; modal = null; S.open = null; location.hash = '#/' + TOUR[0][0]; return render(); }
    if (act === 'tour-next') { if (S.tour >= TOUR.length - 1) { S.tour = null; tourDone(); return render(); } S.tour++; location.hash = '#/' + TOUR[S.tour][0]; return render(); }
    if (act === 'tour-end') { S.tour = null; tourDone(); return render(); }
    if (act === 'sim') return simulate();
    if (act === 'advance') return advance(vac(t.dataset.id));
    if (act === 'close') { S.open = null; modal = null; return render(); }
    if (act === 'vac') { S.vacFilter = t.dataset.id; return render(); }
    if (act === 'mstage') { S.mStage = t.dataset.id; return render(); }
    if (act === 'tovac') { S.vacFilter = t.dataset.id; location.hash = '#/kandidaten'; return; }
    if (act === 'stage' && a) return changeStage(a, t.dataset.stage);
    if (act === 'invite' && a) { S.inviting = !S.inviting; return render(); }
    if (act === 'slot') { S.slot = +t.dataset.v; return render(); }
    if (act === 'send-invite' && a) {
      var sl = SLOTS[S.slot || 0], msg = 'Hoi ' + (a.candidate.first_name || '') + ', leuk dat je gesolliciteerd hebt als ' + (vac(a.vacancy_id).title || '') + '. Kun je ' + sl + ' langskomen voor een kennismaking?';
      if (!demo && a.candidate.phone) window.open('https://wa.me/' + intlPhone(a.candidate.phone) + '?text=' + encodeURIComponent(msg), '_blank');
      S.inviting = false;
      return api.addEvent(a, 'contact', 'Uitgenodigd voor ' + sl).then(function () { changeStage(a, 'gesprek'); toast('Uitnodiging verstuurd: ' + sl); });
    }
    if (act === 'decide-start') { S.dq = S.apps.filter(function (x) { return x.stage === 'gesprek'; }).map(function (x) { return x.id; }); S.di = 0; S.dhired = 0; modal = 'decide'; loadDecide(); return render(); }
    if (act === 'dclose') { modal = null; return render(); }
    if (act === 'dpick') {
      var da = S.apps.find(function (x) { return x.id === S.dq[S.di]; }), dv = t.dataset.v;
      var go = function () { S.di++; loadDecide(); render(); };
      if (!da || dv === 'later') return go();
      if (dv === 'aangenomen') S.dhired++;
      return api.setStage(da, dv).then(go).catch(function () { toast('Opslaan mislukt.'); });
    }
    if (act === 'qual' && a) { var q = t.dataset.v === 'true'; return api.setFields(a, { qualified: a.qualified === q ? null : q }).then(render).catch(function () { toast('Opslaan mislukt.'); }); }
    if (act === 'note' && a) {
      var txt = (document.getElementById('note').value || '').trim(); if (!txt) return;
      return api.addEvent(a, 'notitie', txt).then(function () { return api.events(a); }).then(function (ev) { S.events = ev; toast('Notitie opgeslagen'); render(); }).catch(function () { toast('Opslaan mislukt.'); });
    }
    if (act === 'cv' && a) { var w = demo ? null : window.open('', '_blank'); return api.cv(a.candidate.cv_path).then(function (u) { if (u && w) w.location = u; else if (w) w.close(); }); }
    if (act === 'buy') { modal = 'buy'; S.open = null; return render(); }
    if (act === 'pack') { app.querySelectorAll('.pack').forEach(function (p) { p.setAttribute('aria-pressed', p === t); }); return; }
    if (act === 'confirm-buy') {
      var sel = app.querySelector('.pack[aria-pressed=true]'); var cents = +sel.dataset.v;
      return api.buy(t.dataset.vac, cents).then(function () { modal = null; render(); toast('Besteld: ' + eur(cents) + '. De betaallink komt per mail.'); }).catch(function () { toast('Bestellen mislukt. Mail team@youngdedicated.nl.'); });
    }
    if (act === 'tores') { S.vacFilter = t.dataset.id; location.hash = '#/resultaten'; return; }
    if (act === 'newvac') { S.wiz = { step: 1, title: '', location: '', plan: 'basis', selection: false, beeld: false }; modal = 'wiz'; return render(); }
    if (act === 'wset') { if (t.dataset.v) S.wiz[t.dataset.k] = t.dataset.v; else S.wiz[t.dataset.k] = !S.wiz[t.dataset.k]; return render(); }
    if (act === 'wback') { S.wiz.step--; return render(); }
    if (act === 'wnext') {
      if (S.wiz.step === 1) { S.wiz.title = document.getElementById('w-title').value.trim(); S.wiz.location = document.getElementById('w-loc').value.trim(); if (!S.wiz.title) { toast('Vul een functie in.'); return; } }
      if (S.wiz.step < 3) { S.wiz.step++; return render(); }
      var nv = { id: 'vac-' + Date.now(), organization_id: S.orgId, title: S.wiz.title, location: S.wiz.location, status: 'concept', plan: S.wiz.plan, pakket: S.wiz.plan, selection_by_yd: S.wiz.selection, target_qualified: 5, channels: [], branch: (S.vacancies[0] || {}).branch,
        milestones: [{ label: 'Aanvraag', done: true }, { label: 'Kick-off', done: false }, { label: 'Betaald', done: false }, { label: 'Live', done: false }, { label: 'Vervuld', done: false }],
        qa: { 'Relevante ervaring': ['Ja, meer dan 2 jaar', 'Ja, 1 tot 2 jaar', 'Nee'], 'Wanneer kun je starten': ['Direct', 'Binnen een maand', 'Na opzegtermijn'], 'Uren per week': ['32 tot 40', '24 tot 32', '12 tot 24'] },
        must: [{ label: 'Relevante ervaring', q: 'Relevante ervaring', ok: '^Ja' }, { label: 'Start binnen een maand', q: 'Wanneer kun je starten', ok: 'Direct|Binnen' }, { label: 'Minimaal 24 uur', q: 'Uren per week', ok: '^24|^32' }] };
      window.YD_DEMO.vacancies.push(nv); S.vacancies.push(nv); modal = null; S.wiz = null;
      toast('Aanvraag verstuurd. We bellen je binnen 1 werkdag.'); location.hash = '#/vacatures/' + nv.id; return render();
    }
    if (act === 'togglesel') { var tv = vac(t.dataset.id); tv.selection_by_yd = !tv.selection_by_yd; toast(tv.selection_by_yd ? 'Selectie uitbesteed. Wij bellen binnen 24 uur.' : 'Je selecteert weer zelf.'); return render(); }
    if (act === 'network' && a) {
      a.network_status = 'aangeboden';
      window.YD_DEMO.pool.unshift({ id: 'pool-' + a.id, app_id: a.id, initials: a.candidate.first_name.charAt(0) + '. ' + a.candidate.last_name.charAt(0) + '.', role: vac(a.vacancy_id).title, region: a.candidate.city, experience: '1 tot 3 jaar', available: 'Direct', fit: vac(a.vacancy_id).branch || 'Techniek', status: 'beschikbaar', from_org: a.organization_id });
      api.addEvent(a, 'notitie', 'Aangeboden aan het recruitersnetwerk').then(function () { return api.events(a); }).then(function (ev) { S.events = ev; render(); });
      toast('Aangeboden aan het netwerk'); return;
    }
    if (act === 'fit') { S.poolFit = t.dataset.id; return render(); }
    if (act === 'claim') { S.claim = t.dataset.id; modal = 'claim'; return render(); }
    if (act === 'confirm-claim') {
      var cp = window.YD_DEMO.pool.find(function (x) { return x.id === S.claim; }), fee = Math.round((+document.getElementById('c-fee').value || 3000) * 100);
      var src = cp.app_id && window.YD_DEMO.apps.find(function (x) { return x.id === cp.app_id; });
      cp.status = 'geclaimd'; cp.fee_cents = fee; cp.contact = src ? name(src) : cp.initials; cp.phone = src ? src.candidate.phone : '06 12 34 56 78';
      modal = null; S.claim = null; toast('Geclaimd. Contactgegevens staan in Mijn plaatsingen.'); location.hash = '#/plaatsingen'; return render();
    }
    if (act === 'placed') {
      var pp = window.YD_DEMO.pool.find(function (x) { return x.id === t.dataset.id; }); pp.status = 'geplaatst';
      window.YD_DEMO.placements.push({ id: 'pl' + Date.now(), org: pp.from_org, initials: pp.initials, role: pp.role, placed_at: new Date().toISOString(), recruiter: 'Demo Techniek Recruitment', fee_cents: pp.fee_cents, status: 'geplaatst' });
      toast('Gefeliciteerd. De werkgever krijgt ' + eur(Math.round(pp.fee_cents * 0.2)) + ' tegoed.'); return render();
    }
    if (act === 'tkind') { S.tKind = t.dataset.id; return render(); }
    if (act === 'topen') return openTalent(t.dataset.id);
    if (act === 'ttab') { S.tTab = t.dataset.id; return render(); }
    if (act === 'tpick') {
      if (!activePakket()) { toast('Solliciteren kan met een lopend pakket.'); return; }
      var pid = t.dataset.id, pt = (S.talent || []).find(function (x) { return x.id === pid; });
      return api.pick(pid, true).then(function () {
        S.picked[pid] = 'uitgenodigd'; toast('Je sollicitatie staat bij ' + pt.first_name + '. Je hoort het zodra er antwoord is.'); render();
        if (demo) setTimeout(function () { S.picked[pid] = 'ja'; api.contact(pt).then(function (c) { S.tContact[pid] = c; toast(pt.first_name + ' zegt ja. Je ziet nu het nummer.'); render(); }); }, 2500);
      }).catch(function () { toast('Opslaan mislukt.'); });
    }
    if (act === 'tslot') { S.tSlot = +t.dataset.v; return render(); }
    if (act === 'tsend' || act === 'tinvite') {
      var tt = (S.talent || []).find(function (x) { return x.id === t.dataset.id; }); if (!tt) return;
      var slot = SLOTS[S.tSlot || 0], txt = act === 'tinvite' ? 'Uitnodiging voor een kennismaking: ' + slot + '.' : ((document.getElementById('tmsg') || {}).value || '').trim();
      if (!txt) return;
      var done = function () {
        if (act === 'tinvite') { S.tTab = 'chat'; toast('Uitnodiging verstuurd aan ' + tt.first_name); }
        render();
        if (demo) setTimeout(function () { (S.chats[tt.id] = S.chats[tt.id] || []).push({ from: 'm', text: act === 'tinvite' ? 'Bevestigd. Tot dan!' : 'Hoi, dank voor je bericht. Ik bel je vanavond even, past dat?', at: new Date().toISOString() }); if (modal === 'talent') render(); }, 1400);
      };
      var pr = act === 'tinvite' ? api.interview(tt.id, slotDate(S.tSlot || 0)).then(function () { return api.send(tt.id, txt); }) : api.send(tt.id, txt);
      return pr.then(done).catch(function () { toast('Versturen mislukt. Probeer het opnieuw.'); });
    }
    if (act === 'pkset') { var pv = vac(t.dataset.id), np = t.dataset.v; return api.pakketSet(pv, np).then(function () { toast('Pakket ' + PAKKETTEN[np].name + ' gaat in per volgende maand.'); render(); }).catch(function () { toast('Wijzigen mislukt. Mail team@youngdedicated.nl.'); }); }
    if (act === 'pkstop') { var sv = vac(t.dataset.id); return api.pakketStop(sv, false).then(function () { toast('Opgezegd. Je pakket stopt op ' + dday(sv.opgezegd_per) + '.'); render(); }).catch(function () { toast('Opzeggen mislukt. Mail team@youngdedicated.nl.'); }); }
    if (act === 'pkundo') { var uv = vac(t.dataset.id); return api.pakketStop(uv, true).then(function () { uv.opgezegd_per = null; toast('Je pakket loopt door.'); render(); }).catch(function () { toast('Opslaan mislukt.'); }); }
    if (act === 'logout') return api.signOut();
    if (act === 'demo') { sessionStorage.setItem('yd-demo', '1'); location.reload(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.dataset.action === 'nopack') { S.noPack = e.target.checked; return render(); }
    if (e.target.dataset.action === 'org') { S.orgId = e.target.value; S.vacFilter = 'all'; loadOrg(); }
    if (e.target.dataset.action === 'role') { S.as = e.target.value; S.open = null; modal = null; if (S.as === 'klant' && S.orgId === 'org-yd') { S.orgId = 'org-walsem'; S.vacFilter = 'all'; loadOrg(); } location.hash = S.as === 'recruiter' ? '#/pool' : S.as === 'yd' ? '#/cockpit' : '#/vandaag'; render(); }
  });
  document.addEventListener('input', function (e) { if (e.target.dataset.action === 'fee') { var el = document.getElementById('c-split'); if (el) el.innerHTML = splitHtml(split(Math.round((+e.target.value || 0) * 100))); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (S.open || modal)) { S.open = null; modal = null; render(); }
    if (e.key === 'Enter' && e.target.matches('.person')) openApp(e.target.dataset.id);
    if (e.key === 'Enter' && e.target.matches('.tcard[data-id]')) openTalent(e.target.dataset.id);
    if (e.key === 'Enter' && e.target.id === 'tmsg') { var sb2 = app.querySelector('[data-action=tsend]'); if (sb2) sb2.click(); }
  });
  window.addEventListener('hashchange', function () { S.open = null; modal = null; render(); window.scrollTo(0, 0); });
  function tourDone() { try { localStorage.setItem('yd-tour-v1', '1'); } catch (e) {} }

  /* ---------- login ---------- */
  function viewLogin(sent) {
    app.innerHTML = '<div class="login"><div class="login__art"><h2>Personeel dat blijft.<br>Zonder gedoe.</h2><p>Jouw sollicitanten, je resultaten en je budget. Altijd live, op één plek.</p></div>' +
      '<form class="login__form" id="login"><img src="' + LOGO + '" alt="YoungDedicated">' +
      (sent ? '<h1>Check je mail.</h1><p class="sub">We stuurden een inloglink naar ' + esc(sent) + '. Tik erop en je bent binnen.</p>'
        : '<h1>Inloggen</h1><p class="sub">Geen wachtwoord nodig. Je krijgt een link per mail.</p><label for="email">E-mailadres</label><input id="email" type="email" required autocomplete="email" placeholder="naam@bedrijf.nl"><p style="margin-top:16px"><button class="btn btn--block" type="submit">Stuur mijn inloglink</button></p>') +
      '<p style="margin-top:8px"><button class="btn btn--ghost btn--block" type="button" data-action="demo">Bekijk de demo</button></p>' +
      '<div class="note">Nog geen account? Je krijgt toegang zodra je vacature bij ons live gaat.</div></form></div>';
    var f = document.getElementById('login');
    f.addEventListener('submit', function (e) {
      e.preventDefault(); var em = document.getElementById('email').value.trim();
      sb.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.origin + '/portaal/', shouldCreateUser: true } }).then(function (r) {
        if (r.error) toast('Versturen lukte niet. Probeer het over een minuut opnieuw.'); else viewLogin(em);
      });
    });
  }

  /* ---------- boot ---------- */
  function loadOrg() {
    return api.load(S.orgId).then(function (d) {
      Object.assign(S, d);
      api.talent().then(function (t) { S.talent = t.list; if (!demo || !Object.keys(S.picked).length) S.picked = t.picks; if (route() === 'monteurs') render(); }).catch(function () { S.talent = []; });
      if (demo && S.tour == null && !S.tourChecked) { S.tourChecked = true; var seen = '1'; try { seen = localStorage.getItem('yd-tour-v1'); } catch (e) {} if (!seen) { S.tour = 0; location.hash = '#/vandaag'; } }
      render();
    });
  }
  function boot() {
    api.session().then(function (p) {
      if (!p) return viewLogin();
      S.profile = p;
      return api.orgs().then(function (o) {
        S.orgs = o;
        S.orgId = p.organization_id || (o[0] && o[0].id);
        if (!S.orgId) { app.innerHTML = '<div class="login__form"><img src="' + LOGO + '" alt=""><h1>Bijna klaar.</h1><p class="sub">Je account wordt nog gekoppeld aan je bedrijf. We laten het je weten.</p></div>'; return; }
        return loadOrg();
      });
    }).catch(function () { app.innerHTML = '<div class="login__form"><h1>Even geen verbinding.</h1><p class="sub">Ververs de pagina.</p></div>'; });
  }
  if (sb) sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_IN' && !S.profile) boot(); });
  boot();
})();
