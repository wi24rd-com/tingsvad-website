// Tingsvad-specifik adfærd: gamle forside-ankre sender videre til undersiderne, sprogskiftet peger på samme side, tema-knappen skifter.
const { test, expect } = require('../lib/fixtur');
const SIDER = require('./sider');

const reEsc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

test('gamle ankre på forsiden sender videre til undersiden', async ({ page }) => {
  test.setTimeout(120_000); // ti navigationer i træk
  for (const [anker, mål] of [['/#gaestebog', '/oplevelser/gaestebog/'], ['/#undersoeg', '/oplevelser/undersoegelsen/'], ['/#maskinrummet', '/maskinrummet/'], ['/en/#paafund-radio', '/en/experiences/machine-park/'],
    // runde 10: indhold flyttet ud af Oplevelser og forsiden
    ['/oplevelser/#afgoer', '/oplevelser/undersoegelsen/#afgoer'], ['/oplevelser/#cert-form', '/oplevelser/runevaerkstedet/'], ['/#forkl', '/historien/#forkl'],
    ['/maskinrummet/#net-wrap', '/historien/#net-wrap'], ['/oplevelser/sagsmappen/#ravnepost', '/oplevelser/gaestebog/'], ['/en/#slaegt', '/en/history/#slaegt']]) {
    await page.goto(anker, { waitUntil: 'domcontentloaded' });
    await expect(page, `${anker} → ${mål}`).toHaveURL(new RegExp(reEsc(mål)), { timeout: 8000 });
  }
});

// Sprogskiftets links indsættes af middlewaren på serveren, så HTML'en hentes direkte (30 sider på få sekunder, ingen ventetid på tredjeparts-iframes).
test('sprogskift peger på samme side på det andet sprog', async ({ request }) => {
  const href = (html, lang) => { const m = html.match(new RegExp('<a class="flag" href="([^"]+)" hreflang="' + lang + '"')); return m && m[1]; };
  for (const side of SIDER) {
    expect(href(await (await request.get(side.da)).text(), 'en'), `sprogskift på ${side.da}`).toBe(side.en);
    expect(href(await (await request.get(side.en)).text(), 'da'), `sprogskift på ${side.en}`).toBe(side.da);
  }
});

test('tema-knappen skifter mellem lyst og mørkt', async ({ page }) => {
  await page.goto('/historien/', { waitUntil: 'domcontentloaded' });
  const før = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.click('#tema');
  const efter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(efter).not.toBe(før);
  expect(['light', 'dark']).toContain(efter);
});

test('den gamle protokoludskrift sender videre til Arkivet (301)', async ({ request }) => {
  for (const [fra, til] of [['/protokol/', '/arkivet/#protokol'], ['/en/protokol/', '/en/archive/#protokol']]) {
    const r = await request.get(fra, { maxRedirects: 0 });
    expect(r.status(), fra).toBe(301);
    expect(r.headers()['location'], fra).toMatch(new RegExp(reEsc(til) + '$'));
  }
});
