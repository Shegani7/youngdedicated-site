(function(){
  var b=document.body; if(!b.classList.contains('vac2')) return;
  var form=document.querySelector('.content-row--form');
  var href=form&&form.id?('#'+form.id):'#';
  var h1=document.querySelector('.jumbotron--vacancy h1');
  var co=document.querySelector('.jumbotron--vacancy .company_name');
  // Kerninfo uit "In het kort" en "Wat krijg je?"
  var facts=[].slice.call(document.querySelectorAll('.vacancy-facts li')).map(function(l){return l.textContent.replace(/\s+/g,' ').trim()});
  var chips=[];
  var sal=facts.filter(function(t){return /€/.test(t)})[0];
  if(sal){var m=sal.match(/€\s?[\d.,]+(\s*(en|tot|-|–)\s*€\s?[\d.,]+)?/);if(m)chips.push(m[0].replace(/\s+en\s+/,' – ')+(/uur/i.test(sal)?'':' p/m'));}
  var hrs=null;facts.some(function(t){var m=t.match(/\(?(\d{2}\s*[–-]\s*)?\d{2}\s*uur\)?/i);if(m){hrs=m[0].replace(/[()]/g,'');return true}});
  if(hrs)chips.unshift(hrs);
  var loc=document.querySelector('.jumbotron--vacancy .company_location');
  if(loc)chips.push(loc.textContent.trim());
  var host=h1&&h1.parentNode;
  if(host){
    var w=document.createElement('div');w.className='vac-hero-extra';
    w.innerHTML='<ul class="vac-chips">'+chips.map(function(c){return '<li>'+c+'</li>'}).join('')+'</ul>'+
      '<a class="vac-apply" href="'+href+'" data-cta="vac-hero-solliciteer">Solliciteer direct</a>'+
      '<p class="vac-apply-note">Duurt 1 minuut. Je hoort snel van ons.</p>';
    host.appendChild(w);
    if(loc)loc.style.display='none';
  }
  // Grafiek: taart wordt bewegende balken
  document.querySelectorAll('.pie-legend').forEach(function(pl){
    var items=[].slice.call(pl.querySelectorAll('li')).map(function(li){
      var v=(li.querySelector('#legend-value,[id^=legend-value]')||{}).textContent||'';
      var l=(li.querySelector('#legend-label,[id^=legend-label]')||{}).textContent||'';
      return {v:parseFloat(v)||0,t:v.trim(),l:l.trim()};
    }).filter(function(x){return x.v>0});
    if(!items.length)return;
    var max=Math.max.apply(null,items.map(function(x){return x.v}));
    var box=document.createElement('div');box.className='vac-bars';
    box.innerHTML=items.map(function(x,i){return '<div class="vac-bar" style="--w:'+(x.v/max*100)+'%;--d:'+(i*120)+'ms"><div class="vac-bar__top"><span>'+x.l+'</span><b>'+x.t+'</b></div><div class="vac-bar__track"><i></i></div></div>'}).join('');
    var row=pl.closest('.row')||pl.parentNode;
    row.parentNode.insertBefore(box,row);row.style.display='none';
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(e){e.forEach(function(en){if(en.isIntersecting){box.classList.add('is-in');io.disconnect()}})},{threshold:.3});io.observe(box)}else box.classList.add('is-in');
  });
  // Sticky solliciteerbalk
  if(form){
    var s=document.createElement('div');s.className='vac-sticky';
    s.innerHTML='<div class="vac-sticky__txt"><b>'+(h1?h1.textContent.trim():'')+'</b><span>'+(co?co.textContent.trim():'')+'</span></div><a class="vac-apply vac-apply--sm" href="'+href+'" data-cta="vac-sticky-solliciteer">Solliciteer direct</a>';
    b.appendChild(s);
    var hero=document.querySelector('.jumbotron--vacancy');
    var tick=function(){var y=window.scrollY,hb=hero?hero.offsetTop+hero.offsetHeight:400,ft=form.getBoundingClientRect().top;s.classList.toggle('is-on',y>hb-80&&ft>window.innerHeight*.6)};
    window.addEventListener('scroll',tick,{passive:true});tick();
  }
  // Header-knop naar het formulier
  document.querySelectorAll('a[href="#solliciteer"]').forEach(function(a){a.setAttribute('href',href)});
  // Geen uitgaande links: alles blijft op deze pagina
  document.querySelectorAll('main a[href]').forEach(function(a){
    var h=a.getAttribute('href')||'';
    if(/^(#|tel:|mailto:|whatsapp:|https:\/\/wa\.me)/.test(h)||a.closest('.content-row--form,.modal-wrapper')||a.classList.contains('vac-apply'))return;
    if(a.classList.contains('button')){a.setAttribute('href',href);return}
    var sp=document.createElement('span');sp.className='vac-plain';sp.innerHTML=a.innerHTML;a.replaceWith(sp);
  });
  // CTA-knoppen in de pagina
  document.querySelectorAll('.content-row--call-to-action .button').forEach(function(a){a.textContent='Solliciteer direct'});
  var fh=form&&form.querySelector('h2');if(fh)fh.textContent='Solliciteer direct';

  // ===== Ronde 8: persoonlijker en moderner =====
  var q=function(sel,root){return (root||document).querySelector(sel)},qa=function(sel,root){return [].slice.call((root||document).querySelectorAll(sel))};
  var txt=function(el){return el?el.textContent.replace(/\s+/g,' ').trim():''};
  // Tekstkleur op de accentkleur: donker bij lichte merkkleuren
  (function(){var c=getComputedStyle(b).getPropertyValue('--brand2').trim().replace('#','');if(c.length===3)c=c.split('').map(function(x){return x+x}).join('');
    var r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),bl=parseInt(c.substr(4,2),16);var l=(0.299*r+0.587*g+0.114*bl)/255;b.style.setProperty('--on2',l>0.62?'#111':'#fff');})();
  var eyebrow=function(t){return '<span class="vac-eyebrow">'+t+'</span>'};
  var applyBtn=function(t,id){return '<a class="vac-apply" href="'+href+'" data-cta="'+id+'">'+(t||'Solliciteer direct')+'</a>'};

  // 1. Contactpersoon: één persoonlijke, gecentreerde kaart samen met de oproep
  var cp=q('.content-row--contactperson'),ex=q('.content-row--expert'),cta=q('.content-row--call-to-action');
  var person=null;
  if(cp){
    var bg=q('.member-image-backgrnd',cp),m=bg&&(bg.getAttribute('style')||'').match(/url\((['"]?)(.*?)\1\)/);
    var name=txt(q('.member-text-info strong',cp)),phone='',role='';
    qa('.member-text-info p.title',cp).forEach(function(pp){var t=txt(pp);if(/^[\d\s+()\-]{8,}$/.test(t))phone=t;else if(t&&!role)role=t});
    var mail=q('a[href^="mailto:"]',cp),wa=ex&&q('a[href*="wa.me"]',ex);
    person={img:m?m[2]:'',name:name,role:role,phone:phone,mail:mail?mail.getAttribute('href'):'',wa:wa?wa.getAttribute('href'):''};
    cp.style.display='none';
  }
  if(ex)ex.style.display='none';
  if(cta){
    var share=q('.share-button',cta),ct=q('.container',cta);
    var first=person&&person.name?person.name.split(' ')[0]:'';
    var ph='';
    if(person&&person.name){
      var acts=[];
      if(person.phone)acts.push('<a class="vac-chipbtn" href="tel:'+person.phone.replace(/[^\d+]/g,'')+'">Bel '+first+'</a>');
      if(person.wa)acts.push('<a class="vac-chipbtn" href="'+person.wa+'" target="_blank" rel="noopener">WhatsApp</a>');
      if(person.mail)acts.push('<a class="vac-chipbtn" href="'+person.mail+'">Mail</a>');
      ph='<div class="vac-person">'+(person.img?'<img class="vac-person__img" src="'+person.img+'" alt="'+person.name+'" loading="lazy">':'')+
        '<div class="vac-person__txt"><span>Vragen? '+first+' helpt je graag.</span><b>'+person.name+'</b>'+(person.role?'<em>'+person.role+'</em>':'')+'</div>'+
        (acts.length?'<div class="vac-person__acts">'+acts.join('')+'</div>':'')+'</div>';
    }
    var card=document.createElement('div');card.className='vac-cta';
    card.innerHTML=eyebrow('Klaar voor iets nieuws?')+'<h2>Geïnteresseerd?</h2><p class="vac-cta__sub">Solliciteren duurt 1 minuut. Je hoort snel van ons.</p>'+applyBtn('Solliciteer direct','vac-cta-solliciteer')+'<div class="vac-cta__share"></div>'+ph;
    if(share){share.className='vac-share';share.innerHTML='Ken je iemand voor deze baan? <u>Deel de vacature</u>';q('.vac-cta__share',card).appendChild(share)}
    ct.innerHTML='';ct.appendChild(card);
  }

  // 2. Wel of niet: interactieve match-check in plaats van smileys
  qa('.content-row--pros-cons').forEach(function(sec){
    var rs=qa('.container-pros-cons',sec).map(function(c){return {yes:txt(q('.pros p',c)),no:txt(q('.cons p',c))}}).filter(function(r){return r.yes});
    if(!rs.length)return;
    var n=rs.length;
    var html='<div class="container"><div class="vac-fit">'+eyebrow('Snelle check')+'<h2>Past deze baan bij jou?</h2><p class="vac-fit__sub">Tik aan wat bij jou past.</p><div class="vac-fit__grid">'+
      rs.map(function(r,i){return '<button type="button" class="vac-fit__item" aria-pressed="false"><span class="vac-fit__n">0'+(i+1)+'</span><span class="vac-fit__tick" aria-hidden="true"></span><span class="vac-fit__yes">'+r.yes+'</span>'+(r.no?'<span class="vac-fit__no"><i>Niks voor jou als:</i> '+r.no.charAt(0).toLowerCase()+r.no.slice(1)+'</span>':'')+'</button>'}).join('')+
      '</div><div class="vac-fit__meter"><div class="vac-fit__track"><i></i></div><b class="vac-fit__score">0 van '+n+'</b></div><p class="vac-fit__msg">Hoe meer je aantikt, hoe beter de match.</p><div class="vac-fit__cta">'+applyBtn('Ja, dit ben ik. Solliciteer','vac-fit-solliciteer')+'</div></div></div>';
    sec.innerHTML=html;
    var msgs=['Hoe meer je aantikt, hoe beter de match.','Goed begin. Lees verder.','Je komt dichtbij. Dit klinkt als jou.','Perfecte match. Dit is jouw baan.'];
    qa('.vac-fit__item',sec).forEach(function(it){it.addEventListener('click',function(){
      it.setAttribute('aria-pressed',it.getAttribute('aria-pressed')==='true'?'false':'true');
      var k=qa('.vac-fit__item[aria-pressed=true]',sec).length;
      q('.vac-fit__track i',sec).style.width=(k/n*100)+'%';
      q('.vac-fit__score',sec).textContent=k+' van '+n;
      q('.vac-fit__msg',sec).textContent=k>=n?msgs[3]:msgs[Math.min(k,2)];
      q('.vac-fit',sec).classList.toggle('is-match',k>=n);
    })});
  });

  // 3. Sollicitatieroute als genummerde stappen
  qa('.content-row--procedure').forEach(function(sec){
    var st=qa('.point p',sec).map(txt).filter(Boolean);if(!st.length)return;
    var h=txt(q('h2',sec))||'De route naar je nieuwe baan';
    sec.innerHTML='<div class="container">'+eyebrow('Zo simpel is het')+'<h2>'+h+'</h2><ol class="vac-steps" style="--n:'+st.length+'">'+st.map(function(t,i){return '<li><span>'+(i+1)+'</span><p>'+t+'</p></li>'}).join('')+'</ol></div>';
  });

  // 4. Carrièrepad als groeilijn
  qa('.content-row--grow-path').forEach(function(sec){
    var st=qa('.point',sec).map(txt).filter(Boolean);if(!st.length)return;
    sec.innerHTML='<div class="container">'+eyebrow('Jouw groei')+'<h2>Hier kun je naartoe groeien</h2><div class="vac-path"><div class="vac-path__item vac-path__item--now"><small>Start</small><b>Jij in deze baan</b></div>'+
      st.map(function(t,i){return '<div class="vac-path__item"><small>Stap '+(i+1)+'</small><b>'+t.charAt(0).toUpperCase()+t.slice(1)+'</b></div>'}).join('')+'</div></div>';
  });

  // 5. Kopjes krijgen een klein label erboven
  [['.content-row--text-image-icons','Maak kennis'],['.content-row--colleagues:not(.content-row--workday)','Je nieuwe collega’s'],['.content-row--workday','Een dag uit je leven'],['.content-row--text','Over de baan']].forEach(function(x){
    qa(x[0]).forEach(function(sec){var h=q('h2',sec);if(h&&!h.previousElementSibling||h&&!h.previousElementSibling.classList.contains('vac-eyebrow')){h.insertAdjacentHTML('beforebegin',eyebrow(x[1]))}});
  });

  // 6. Formulier: Nederlandse placeholder en duidelijke knop
  if(form){qa('input[type=tel]',form).forEach(function(i){i.setAttribute('placeholder','06 12345678')});
    qa('[type=submit],.gform_footer .button',form).forEach(function(bt){if(bt.tagName==='INPUT')bt.value='Verstuur mijn sollicitatie';else bt.textContent='Verstuur mijn sollicitatie'});}

  // 7. Video's in de hero: klikbare kaarten met eigen speler (werkt altijd, ook op mobiel)
  qa('.jumbotron--shorts').forEach(function(j){
    var fr=qa('iframe',j).map(function(f,k){var sl=f.closest('.swiper-slide'),ix=sl&&sl.getAttribute('data-swiper-slide-index');return {k:ix!==null&&ix!==undefined&&ix!==''?+ix:k,f:f}}).sort(function(a,c){return a.k-c.k});var seen={};var ids=fr.map(function(o){var m=(o.f.getAttribute('src')||'').match(/embed\/([\w-]{6,})/);return m&&m[1]}).filter(function(id){if(!id||seen[id])return false;seen[id]=1;return true});
    var sw=q('.slider-wrapper',j);if(!ids.length||!sw)return;
    var box=document.createElement('div');box.className='vac-shorts';
    box.innerHTML=ids.map(function(id,i){return '<button type="button" class="vac-short" data-id="'+id+'" aria-label="Speel video '+(i+1)+' af"><img src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt="" onerror="this.style.display=\'none\'" loading="'+(i?'lazy':'eager')+'"><span class="vac-short__play" aria-hidden="true"></span></button>'}).join('');
    sw.parentNode.replaceChild(box,sw);j.classList.add('has-shorts');
    var modal=document.createElement('div');modal.className='vac-vmodal';modal.hidden=true;
    modal.innerHTML='<div class="vac-vmodal__in"><button type="button" class="vac-vmodal__x" aria-label="Sluiten">&times;</button><div class="vac-vmodal__frame"></div><a class="vac-vmodal__yt" target="_blank" rel="noopener">Speelt de video niet? Bekijk hem op YouTube</a></div>';
    b.appendChild(modal);
    var close=function(){modal.hidden=true;q('.vac-vmodal__frame',modal).innerHTML='';b.style.overflow=''};
    modal.addEventListener('click',function(e){if(e.target===modal||e.target.classList.contains('vac-vmodal__x'))close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden)close()});
    qa('.vac-short',box).forEach(function(btn){btn.addEventListener('click',function(){
      var id=btn.getAttribute('data-id');var f=document.createElement('iframe');
      f.setAttribute('data-cookieconsent','ignore');f.setAttribute('allow','autoplay; encrypted-media; picture-in-picture; fullscreen');f.setAttribute('allowfullscreen','');
      f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&playsinline=1&modestbranding=1';
      q('.vac-vmodal__frame',modal).appendChild(f);q('.vac-vmodal__yt',modal).href='https://www.youtube.com/shorts/'+id;
      modal.hidden=false;b.style.overflow='hidden';
    })});
  });
})();
