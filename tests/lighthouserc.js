// Lighthouse CI: hastighed, tilgængelighed, god praksis og SEO (mobilprofil). Adresse og sider kommer fra site.config.js.
// Rapporterne gemmes som filer (vedhæftes kørslen i GitHub Actions), ikke i en offentlig Lighthouse-tjeneste.
const K = require('./specs/lib/konfig');
const BASE = K.baseUrl.replace(/\/$/, '');
// Previews sender ofte bevidst »noindex«; SEO vurderes derfor kun på produktionsadressen.
const PROD = !!K.produktion && BASE === K.produktion.replace(/\/$/, '');

module.exports = {
  ci: {
    collect: {
      url: K.lighthouseSider.map(s => BASE + s),
      numberOfRuns: 1,
      // Runde 13: analytics-beaconen blokeres som i Playwright (K.bloker), så testkørsler ikke tæller som gæster i Web Analytics.
      settings: { chromeFlags: '--no-sandbox --headless=new', blockedUrlPatterns: ['*cloudflareinsights.com*'] },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': PROD ? ['error', { minScore: 0.9 }] : 'off',
        'is-crawlable': PROD ? ['error', { minScore: 1 }] : 'off',
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // Runde 13: et budget, ikke en advarsel. Mobilprofilen måler i dag 0,66–0,79 (LCP 4–6 s), så gulvet er 0,6 indtil
        // AP7 (JS-bundling, fonte, mindre forside) har løftet tallene – derefter hæves gulvet til 0,8.
        'categories:performance': ['error', { minScore: 0.6 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'total-byte-weight': ['warn', { maxNumericValue: 1500000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-rapport' },
  },
};
