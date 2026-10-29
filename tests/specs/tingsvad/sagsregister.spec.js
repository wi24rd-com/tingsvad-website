// Sagsregistret (runde 10): hver sagsakt i assets/kanon.json står på den side, registret angiver, i en <section> med ankerets id,
// og registersiden linker til dem alle. Læser serverens HTML direkte (ingen browser), så testen er hurtig og kører i ét projekt.
const fs = require('fs');
const path = require('path');
const { test, expect } = require('../lib/fixtur');
const kanon = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../assets/kanon.json'), 'utf8'));
const ORD = { da: ['Sagsakt', { tillaeg: 'Tillæg', bilag: 'Bilag' }], en: ['Case file', { tillaeg: 'Supplement', bilag: 'Exhibit' }] };
const esc = s => s.replace(/&/g, '&amp;');

test('sagsregistret stemmer med siderne', async ({ request }, info) => {
  test.skip(!/chromium/.test(info.project.name), 'kun ét projekt: testen bruger ikke browseren');
  const cache = {};
  const html = async sti => (cache[sti] ??= await (await request.get(sti)).text());
  for (const lang of ['da', 'en']) {
    const reg = await html(kanon.sider.sagsregister[lang]);
    for (const a of kanon.sagsakter) {
      const sti = kanon.sider[a.side][lang];
      const [ord, typ] = ORD[lang];
      const kicker = `${ord} ${a.nr}${a.type ? ' · ' + typ[a.type] : ''} · ${a[lang]}`;
      const side = await html(sti);
      const i = side.indexOf(`<div class="kicker">${esc(kicker)}</div>`);
      expect(i, `${sti}: »${kicker}«`).toBeGreaterThan(-1);
      const s = side.lastIndexOf('<section', i), e = side.indexOf('</section>', i), j = side.indexOf(` id="${a.anker}"`);
      expect(j > s && j < e, `${sti}: #${a.anker} omkring »${kicker}«`).toBe(true);
      expect(reg, `registret linker til ${sti}#${a.anker}`).toContain(`href="${sti}#${a.anker}"`);
    }
  }
});
