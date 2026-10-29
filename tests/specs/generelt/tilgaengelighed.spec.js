// Tilgængelighed med axe-core på hver side. Fejler på de alvorlighedsgrader, konfigurationen nævner; resten står i rapporten.
const { test, expect } = require('../lib/fixtur');
const AxeBuilder = require('@axe-core/playwright').default;
const K = require('../lib/konfig');
const { aabn } = require('../lib/fejl');
const A = K.tilgaengelighed;

for (const side of K.sider) {
  test(`a11y ${side.sti}`, async ({ page }, info) => {
    test.skip(!A.projekter.test(info.project.name), 'axe køres kun i de projekter, konfigurationen nævner');
    await aabn(page, side.sti);
    let b = new AxeBuilder({ page }).withTags(A.tags);
    for (const sel of A.udelad) b = b.exclude(sel);
    const r = await b.analyze();
    const kort = r.violations.map(v => ({ id: v.id, impact: v.impact, antal: v.nodes.length, eksempel: v.nodes[0] && v.nodes[0].target.join(' ') }));
    await info.attach('axe.json', { body: JSON.stringify(kort, null, 2), contentType: 'application/json' });
    expect(kort.filter(v => A.fejlVed.includes(v.impact)), 'alvorlige tilgængelighedsfejl').toEqual([]);
  });
}
