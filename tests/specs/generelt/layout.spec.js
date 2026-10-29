// Generelt layout på hver side i hver browser og skærmbredde: HTTP 200, <html lang>, ingen vandret scroll, én h1 der ikke er beskåret,
// ingen ødelagte billeder og ingen fejl fra sitets egne filer. Konfigurationens sideTjek køres på den åbne side. Skærmbillede vedhæftes.
const { test, expect } = require('../lib/fixtur');
const K = require('../lib/konfig');
const { lytEfterFejl, aabn } = require('../lib/fejl');

for (const side of K.sider) {
  test(`layout ${side.sti}`, async ({ page }, info) => {
    const fejl = lytEfterFejl(page);
    const svar = await aabn(page, side.sti);
    expect(svar.status(), 'HTTP-status').toBe(200);

    const m = await page.evaluate(() => {
      const de = document.documentElement, h1 = [...document.querySelectorAll('h1')];
      return {
        lang: de.lang,
        vandret: de.scrollWidth - de.clientWidth,
        h1: h1.length,
        h1Beskaaret: h1[0] ? h1[0].scrollWidth - h1[0].clientWidth : 0,
        oedelagteBilleder: [...document.images].filter(i => i.complete && i.loading !== 'lazy' && i.naturalWidth === 0 && i.getAttribute('src')).map(i => i.getAttribute('src')),
      };
    });
    if (side.lang) expect(m.lang, 'html lang').toBe(side.lang);
    expect(m.vandret, 'vandret scroll (px)').toBeLessThanOrEqual(1);
    expect(m.h1, 'antal h1').toBe(1);
    expect(m.h1Beskaaret, 'h1 bredere end sin boks (px)').toBeLessThanOrEqual(2);
    expect(m.oedelagteBilleder, 'billeder der ikke kunne hentes').toEqual([]);

    for (const tjek of K.sideTjek) await tjek({ page, side, expect, info });

    await info.attach(side.sti.replace(/\//g, '_') + '.png', { body: await page.screenshot({ fullPage: false }), contentType: 'image/png' });
    expect(fejl, 'sidefejl fra sitets egne filer').toEqual([]);
  });
}
