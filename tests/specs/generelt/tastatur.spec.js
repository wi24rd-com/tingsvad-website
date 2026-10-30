// Tastatur (runde 13): det første Tab-tryk rammer skip-linket, som fører til <main id="indhold">; de næste ti Tab-tryk
// rammer hver især et element med synlig fokusmarkering (ikke kun det fjerde, som før).
const { test, expect } = require('../lib/fixtur');
const K = require('../lib/konfig');
const { aabn } = require('../lib/fejl');

const fokus = page => page.evaluate(() => {
  const e = document.activeElement, s = getComputedStyle(e);
  const ring = /rgba?\(/.test(s.boxShadow) && s.boxShadow !== 'none';
  return { tag: e.tagName, cls: e.className || '', outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, ring, tekst: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 40) };
});

test('skip-link er det første, tastaturet rammer, og det fører til indholdet', async ({ page }, info) => {
  test.skip(/mobil|tablet/.test(info.project.name), 'ingen tastatur på mobil');
  await aabn(page, K.tastaturSide);
  await page.keyboard.press('Tab');
  const f = await fokus(page);
  expect(f.cls, 'første Tab rammer skip-linket').toContain('spring-til');
  expect(f.outline || f.ring, 'skip-linket har synligt fokus').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#indhold$/);
});

test('ti Tab-tryk giver ti synlige fokusmarkeringer', async ({ page }, info) => {
  test.skip(/mobil|tablet/.test(info.project.name), 'ingen tastatur på mobil');
  await aabn(page, K.tastaturSide);
  const set = [];
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const f = await fokus(page);
    expect(f.tag, `tab ${i + 1}: noget har fokus`).not.toBe('BODY');
    expect(f.outline || f.ring, `tab ${i + 1}: synlig fokusmarkering på ${f.tag} »${f.tekst}«`).toBe(true);
    set.push(f.tag + ':' + f.tekst);
  }
  expect(new Set(set).size, 'fokus bevæger sig fremad, ikke i ring').toBeGreaterThan(5);
});
