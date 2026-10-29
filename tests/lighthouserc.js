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
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': PROD ? ['error', { minScore: 0.9 }] : 'off',
        'is-crawlable': PROD ? ['error', { minScore: 1 }] : 'off',
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.6 }], // svinger med netværk og dynamisk indhold; advarsel, ikke stop
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-rapport' },
  },
};
