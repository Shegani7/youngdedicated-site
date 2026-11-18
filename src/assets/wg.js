/* Werkgeverspagina's: reveal, marquee en sticky knop */
(function () {
  var d = document.documentElement;
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var m = document.querySelector('.wg-marquee');
  if (m) { var c = m.querySelector('ul').cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('img').forEach(function (i) { i.alt = ''; }); m.appendChild(c); }
  var els = document.querySelectorAll('.wg-reveal');
  if (els.length && 'IntersectionObserver' in window && !rm) {
    d.classList.add('wg-js');
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
  var s = document.getElementById('wg-sticky'), h = document.querySelector('.wg-hero2'), f = document.querySelector('.wg-final');
  if (s && h) {
    var tick = function () {
      var past = h.getBoundingClientRect().bottom < 0;
      var atEnd = f && f.getBoundingClientRect().top < window.innerHeight;
      s.classList.toggle('is-on', past && !atEnd);
    };
    window.addEventListener('scroll', tick, { passive: true }); tick();
  }
})();
