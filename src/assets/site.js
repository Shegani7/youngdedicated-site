/* Houd de zwarte diagonaal van de vacature-header onder de kop van het eerstvolgende CTA-blok. */
(function(){
  function fit(){
    var j=document.querySelector('.jumbotron--vacancy');
    var cta=document.querySelector('.content-row--call-to-action');
    if(!j||!cta) return;
    j.style.paddingBottom='';j.style.marginBottom='';
    var cs=getComputedStyle(j), pb=parseFloat(cs.paddingBottom), mb=parseFloat(cs.marginBottom);
    var h2=cta.querySelector('h2'); if(!h2) return;
    var W=j.offsetWidth, jTop=j.getBoundingClientRect().top;
    var r=document.createRange(); r.selectNodeContents(h2);
    var x=Math.max(0,r.getBoundingClientRect().left-40);
    var y=cta.getBoundingClientRect().top-jTop+parseFloat(getComputedStyle(cta).paddingTop)-15;
    var mobile=window.matchMedia('(max-width: 991.98px)').matches;
    // onderrand van de diagonaal: top 8% + (1 - k*x/W) * hoogte
    var k=mobile?0.2:0.5, frac=0.08+1-k*x/W;
    var H=j.offsetHeight, maxH=y/frac;
    if(H>maxH){var d=Math.ceil(H-maxH); j.style.paddingBottom=(pb-d)+'px'; j.style.marginBottom=(mb+d)+'px';}
  }
  window.addEventListener('load',fit);
  window.addEventListener('resize',fit);
})();

/* Taartgrafiek op vacaturepagina's: tekent een donut uit de legenda, zonder externe bibliotheek */
(function () {
  var c = document.getElementById('pie-chart'); if (!c || !c.getContext) return;
  var items = [].slice.call(document.querySelectorAll('.pie-legend .label-list li')).map(function (li) {
    var v = parseFloat((li.querySelector('#legend-value') || {}).textContent) || 0;
    var col = (li.querySelector('#legend-color') || {}).style; return { v: v, c: (col && col.backgroundColor) || '#ccc' };
  }).filter(function (i) { return i.v > 0; });
  if (!items.length) return;
  var total = items.reduce(function (a, i) { return a + i.v; }, 0);
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(p) {
    var size = c.parentNode.clientWidth || 300, dpr = window.devicePixelRatio || 1;
    c.style.width = size + 'px'; c.style.height = size + 'px'; c.width = size * dpr; c.height = size * dpr;
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var r = size / 2, a = -Math.PI / 2;
    items.forEach(function (i) {
      var s = (i.v / total) * Math.PI * 2 * p;
      x.beginPath(); x.moveTo(r, r); x.arc(r, r, r - 2, a, a + s); x.closePath(); x.fillStyle = i.c; x.fill();
      x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); a += s;
    });
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(r, r, r * 0.5, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'source-over';
  }
  function run() {
    if (rm) return draw(1);
    var t0 = null; (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900); draw(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); run(); } }); io.observe(c); } else run();
  window.addEventListener('resize', function () { draw(1); });
})();
