// Tastaturfokus skal være synligt: de første fire Tab-tryk på konfigurationens tastaturSide skal ramme et element med fokusmarkering.
const { test, expect } = require('../lib/fixtur');
const K = require('../lib/konfig');
const { aabn } = require('../lib/fejl');

test('tastaturfokus er synligt', async ({ page }, info) => {
  test.skip(/mobil|tablet/.test(info.project.name), 'ingen tastatur på mobil');
  await aabn(page, K.tastaturSide);
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  const f = await page.evaluate(() => { const e = document.activeElement, s = getComputedStyle(e); return { tag: e.tagName, outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, ring: s.boxShadow !== 'none' }; });
  expect(f.tag, 'noget har fokus').not.toBe('BODY');
  expect(f.outline || f.ring, `synlig fokusmarkering på ${f.tag}`).toBe(true);
});
