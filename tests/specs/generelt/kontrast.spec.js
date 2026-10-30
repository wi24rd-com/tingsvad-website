// Kontrast på knapper (runde 13): alle synlige .knap-varianter og fold-knapper skal have mindst 4,5:1 i det tema, projektet kører med.
// axe tjekker tekst generelt; denne test fanger specifikt den fejl, hvor en knap arvede mørk tekst på mørk flade (fold-knapperne i mørkt tema).
const { test, expect } = require('../lib/fixtur');
const K = require('../lib/konfig');
const { aabn } = require('../lib/fejl');

const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

for (const side of (K.kontrastSider || [K.tastaturSide])) {
  test(`knapkontrast ${side}`, async ({ page }) => {
    await aabn(page, side);
    const knapper = await page.evaluate(() => {
      const rgb = s => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 4).map(Number);
      const bag = el => { let e = el; while (e) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.9)) return c.slice(0, 3); e = e.parentElement; } return [17, 20, 23]; };
      return [...document.querySelectorAll('.knap, .fold-knap, .r12-knap, .r11-knap, .r12s-tilbage')].filter(e => e.offsetParent && e.textContent.trim()).map(e => {
        const s = getComputedStyle(e);
        const bg = s.backgroundImage !== 'none' ? null : rgb(s.backgroundColor);
        return { tekst: e.textContent.trim().slice(0, 30), fg: rgb(s.color).slice(0, 3), bg: bg && bg.length >= 3 && (bg[3] === undefined || bg[3] > 0.9) ? bg.slice(0, 3) : (s.backgroundImage !== 'none' ? 'gradient' : bag(e)) };
      });
    });
    const daarlige = knapper.filter(k => k.bg !== 'gradient' && ratio(k.fg, k.bg) < 4.5).map(k => `${k.tekst}: ${ratio(k.fg, k.bg).toFixed(2)}:1`);
    expect(daarlige, 'knapper under 4,5:1 (guld-gradienter er dokumenteret ≈ 8:1 og springes over)').toEqual([]);
  });
}
