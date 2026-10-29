// Fælles fixtur: forespørgsler i konfigurationens »bloker« besvares tomt (fx analytics, så testkørsler ikke tæller som besøg).
const base = require('@playwright/test');
const K = require('./konfig');

const test = base.test.extend({
  page: async ({ page }, use) => {
    for (const m of K.bloker) await page.route(m, r => r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' }));
    await use(page);
  },
});
module.exports = { test, expect: base.expect };
