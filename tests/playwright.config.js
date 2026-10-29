// Playwright-opsætning: browsere, enheder og tidsgrænser. Hvad der testes, og hvor, står i site.config.js.
// Kører mod en udgivet adresse, så alt det, serveren gør (headers, middleware, omdirigeringer), er med.
// Kun læsende: ingen test sender formularer.
const { defineConfig, devices } = require('@playwright/test');

const BASE_URL = require('./specs/lib/konfig').baseUrl;
const CI = !!process.env.CI;

module.exports = defineConfig({
  testDir: './specs',
  timeout: 45_000,
  globalTimeout: CI ? 15 * 60_000 : 0, // en hængende browser må aldrig holde hele kørslen fanget
  maxFailures: CI ? 40 : 0,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: CI ? 4 : 2,
  retries: CI ? 1 : 0, // ét genforsøg mod netværksstøj; en fejl, der gentager sig, er en fejl
  reporter: CI ? [['html', { open: 'never' }], ['github'], ['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'da-DK',
    timezoneId: 'Europe/Copenhagen',
    reducedMotion: 'reduce', // ens skærmbilleder: ingen blade, ingen indtoning
    serviceWorkers: 'block', // test altid det, serveren leverer nu, ikke en cache fra en tidligere kørsel
    navigationTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-webkit', use: { ...devices['iPad (gen 7)'] } },
    { name: 'mobil-safari', use: { ...devices['iPhone 13'] } },
    { name: 'mobil-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'lyst-tema', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, colorScheme: 'light' } },
  ],
});
