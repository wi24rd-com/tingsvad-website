// ─────────────────────────────────────────────────────────────────────────────
// Det eneste sted, du skal rette for at bruge testsuiten på dit eget site.
// Alle generelle tests (specs/generelt) læser herfra. Det Tingsvad-specifikke ligger i specs/tingsvad og kan slettes;
// fjern så også linjerne mærket »Tingsvad« herunder.
// En anden konfiguration kan vælges med SITE_CONFIG=./min.config.js, og adressen kan altid overstyres med BASE_URL.
// ─────────────────────────────────────────────────────────────────────────────
const TINGSVAD = require('./specs/tingsvad/sider'); // Tingsvad

module.exports = {
  // Adressen der testes, når BASE_URL ikke er sat, og produktionsadressen (kun dér vurderer Lighthouse SEO).
  baseUrl: process.env.BASE_URL || 'https://tingsvad.dk',
  produktion: 'https://tingsvad.dk',

  // Siderne der testes. lang er valgfri; når den er sat, tjekkes <html lang>.
  sider: TINGSVAD.flatMap(s => [{ sti: s.da, lang: 'da' }, { sti: s.en, lang: 'en' }]), // Tingsvad
  // sider: [{ sti: '/' }, { sti: '/om/' }],

  // Hvilke filer der er »sitets egne«: fejl og 404'er fra dem får testen til at fejle. Alt andet regnes som tredjepart.
  egneFiler: /\/assets\/|\/functions\/|tingsvad/,

  // Konsol- og sidefejl fra tredjepart, der ikke skal tælle (de dukker op i nogle browsere uden at være sitets fejl).
  ignorerFejl: [
    /challenges\.cloudflare\.com/,                        // Turnstile i sin egen iframe (WebKit)
    /cloudflareinsights/,                                  // Web Analytics
    /downloadable font(?![\s\S]*(Bricolage|Spectral|JetBrains))/, // Firefox' egne systemskrifter på Linux (sitets skrifter tælles stadig)
  ],

  // Forespørgsler der besvares tomt i testene, så testkørsler ikke tælles som besøg.
  bloker: [/static\.cloudflareinsights\.com\//, /cloudflareinsights\.com\/cdn-cgi\/rum/],

  // Sider til Lighthouse (hver side tager ca. 15 sekunder; vælg et udsnit).
  lighthouseSider: ['/', '/historien/', '/oplevelser/', '/oplevelser/maskinparken/', '/oplevelser/hittegods/', '/arkivet/', '/maskinrummet/', '/en/'], // Tingsvad

  // Tilgængelighed (axe-core): standarder, hvilke fund der får testen til at fejle, og i hvilke projekter den køres.
  tilgaengelighed: { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'], fejlVed: ['critical', 'serious'], projekter: /chromium|lyst-tema|mobil-chrome/, udelad: ['iframe'] },

  // Siden hvor tastaturfokus prøves (de første fire Tab-tryk skal give en synlig fokusmarkering).
  tastaturSide: '/oplevelser/', // Tingsvad
  // tastaturSide: '/',

  // Ekstra tjek der køres på hver side, mens den alligevel er åben (så siden ikke hentes to gange). Valgfri.
  sideTjek: [require('./specs/tingsvad/sidetjek')], // Tingsvad
};
