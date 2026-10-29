/* tingsvad.dk — undersidernes skabelon (runde 12): »På denne side« markerer det afsnit, gæsten læser.
   Ingen lagring. Uden JavaScript virker menuen som almindelige ankerlinks. */
(function () {
  /* Maskinparken: produktfilteret vises kun, når man kommer fra Maskinrummet med ?produkt= */
  try { if (new URLSearchParams(location.search).get('produkt')) document.body.classList.add('r12s-produkt'); } catch (e) { }
  /* Toppens overskrift: et enkelt langt ord (fx »Hittegodskontoret«) kan ikke ombrydes; så skrumper skriften lige nok til at passe */
  const h1 = document.querySelector('.r12s-hero h1');
  if (h1) {
    const tilpas = () => { h1.style.fontSize = ''; if (h1.scrollWidth > h1.clientWidth + 1) { const f = parseFloat(getComputedStyle(h1).fontSize); h1.style.fontSize = Math.floor(f * h1.clientWidth / h1.scrollWidth * 0.98) + 'px'; } };
    tilpas(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(tilpas);
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(tilpas, 120); });
  }
  const links = [...document.querySelectorAll('.r12s-menu a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const par = links.map(a => [a, document.getElementById(a.getAttribute('href').slice(1))]).filter(p => p[1]);
  const synlig = new Map();
  function marker() {
    let valgt = null;
    for (const [a, el] of par) if (synlig.get(el)) { valgt = a; break; }
    if (!valgt) return;
    for (const [a] of par) {
      if (a === valgt) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
    // På smalle skærme er menuen en vandret række: hold det valgte punkt i syne
    const ul = valgt.closest('ul');
    if (ul && ul.scrollWidth > ul.clientWidth) {
      const l = valgt.offsetLeft - ul.offsetLeft, r = l + valgt.offsetWidth;
      if (l < ul.scrollLeft || r > ul.scrollLeft + ul.clientWidth) ul.scrollTo({ left: Math.max(0, l - 16), behavior: 'auto' });
    }
  }
  const io = new IntersectionObserver(es => { es.forEach(e => synlig.set(e.target, e.isIntersecting)); marker(); }, { rootMargin: '-20% 0px -60% 0px' });
  par.forEach(([, el]) => io.observe(el));
})();
