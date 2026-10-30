/* tingsvad.dk — Tallene (runde 13): Værnet, Crawlerne, Hastigheden og Danmark lige nu som fire faner på én side.
   Fanen følger adressen (#vaernet …), så et link til en tavle virker som før, og maleriet i toppen skifter med tavlen.
   Uden JavaScript står alle fire tavler under hinanden; tallene selv tegnes af vagt.js og maaling.js. */
(function () {
  'use strict';
  const faner = [...document.querySelectorAll('.tal-faner [role="tab"]')], tavler = [...document.querySelectorAll('.tal-tavle')];
  if (!faner.length || faner.length !== tavler.length) return;
  const hero = document.querySelector('[data-tal-hero]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noegle = h => { const id = decodeURIComponent((h || '').replace(/^#/, '')); if (!id) return tavler[0].id; const t = tavler.find(x => x.id === id) || tavler.find(x => x.querySelector('#' + CSS.escape(id))); return t ? t.id : tavler[0].id; };
  function vis(id, fokus) {
    tavler.forEach(t => { t.hidden = t.id !== id; });
    faner.forEach(f => { const akt = f.getAttribute('aria-controls') === id; f.setAttribute('aria-selected', akt ? 'true' : 'false'); f.tabIndex = akt ? 0 : -1; if (akt && fokus) f.focus(); });
    const t = tavler.find(x => x.id === id);
    if (hero && t && t.dataset.hero && hero.getAttribute('src') !== t.dataset.hero) {
      hero.setAttribute('src', t.dataset.hero); hero.setAttribute('srcset', t.dataset.heroSrcset || ''); hero.setAttribute('alt', t.dataset.heroAlt || '');
    }
    dispatchEvent(new Event('tv:indhold'));
  }
  faner.forEach((f, i) => {
    f.addEventListener('click', e => { e.preventDefault(); const id = f.getAttribute('aria-controls'); history.replaceState(null, '', '#' + id); vis(id); if (!reduce && scrollY > f.getBoundingClientRect().top + scrollY - 8) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    f.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -i : e.key === 'End' ? faner.length - 1 - i : 0; if (!d) return;
      e.preventDefault(); const n = faner[(i + d + faner.length) % faner.length]; history.replaceState(null, '', '#' + n.getAttribute('aria-controls')); vis(n.getAttribute('aria-controls'), true);
    });
  });
  addEventListener('hashchange', () => vis(noegle(location.hash)));
  vis(noegle(location.hash));
})();
