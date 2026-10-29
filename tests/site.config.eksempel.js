// Mindste konfiguration til et andet site: kopiér filen til site.config.js, ret adressen og siderne, og slet mappen specs/tingsvad.
// Afprøvet mod https://playwright.dev:  SITE_CONFIG=./site.config.eksempel.js npx playwright test --project=desktop-chromium
module.exports = {
  baseUrl: 'https://playwright.dev',
  sider: [{ sti: '/', lang: 'en' }],
  egneFiler: /playwright\.dev/,
  tastaturSide: '/',
};
