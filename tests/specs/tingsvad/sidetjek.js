// Tingsvad-specifikt tjek, der køres på hver side fra specs/generelt/layout.spec.js (siden er allerede åben):
// den fælles topbar og det markerede menupunkt fra middlewaren, brødkrummen i skabelonen fra runde 12 og toppens billede
// (et fritlagt motiv eller, siden hero-serien, et maleri i fuld bredde).
const SIDER = require('./sider');
const motivSider = new Set(SIDER.filter(s => s.motiv).flatMap(s => [s.da, s.en]));

module.exports = async function tingsvadSidetjek({ page, side, expect }) {
  const m = await page.evaluate(() => {
    const motiv = document.querySelector('.r12s-hero-motiv img, .r12s-hero-bg img');
    const r = motiv ? motiv.getBoundingClientRect() : null;
    return {
      topbar: !!document.querySelector('.topbar'),
      krummer: [...document.querySelectorAll('.r12s-krumme li')].map(li => li.querySelector('a') ? li.querySelector('a').getAttribute('href') : 'her'),
      nav: !!document.querySelector('[aria-current="page"], [aria-current="true"]'),
      motivVist: motiv ? getComputedStyle(motiv).display !== 'none' && r.width > 50 && r.left >= -1 && r.right <= innerWidth + 1 : null,
      bredde: innerWidth,
    };
  });
  expect(m.topbar, 'fælles topbar (middleware)').toBe(true);
  expect(m.nav, 'markeret menupunkt').toBe(true);
  // Brødkrummen (runde 12) står på alle sider undtagen forsiden: forside › (hovedside ›) denne side
  const dybde = side.sti.replace(/^\/en\//, '/').split('/').filter(Boolean).length;
  if (dybde === 0) expect(m.krummer.length, 'ingen brødkrumme på forsiden').toBe(0);
  else {
    expect(m.krummer.length, 'brødkrummer').toBe(dybde + 1);
    expect(m.krummer[0], 'første krumme er forsiden').toBe(side.sti.startsWith('/en/') ? '/en/' : '/');
    expect(m.krummer[m.krummer.length - 1], 'sidste krumme er siden selv').toBe('her');
  }
  // Sider med billede i toppen (motiv eller maleri) viser det på alle bredder, helt inden for skærmen
  if (motivSider.has(side.sti)) expect(m.motivVist, `topbillede vist ved ${m.bredde}px`).toBe(true);
};
