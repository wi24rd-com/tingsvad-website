// Sikkerhedsheaders (CSP m.fl.) – ét sted (runde 13, AP7). Side-middlewaren (functions/_lib/side.js) sætter dem på
// alle svar fra Worker-koden, og tools/headers.mjs skriver de samme værdier ind i _headers, som gælder for de statiske
// filer. Ret her, kør `npm run prep` (eller `node tools/headers.mjs`); routertesten fejler, hvis _headers er bagud.
export const SIKKERHED = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com; connect-src 'self' https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
};
// Tal din sag (runde 12): AI-retssalen må bede om mikrofonen (altid efter gæstens eget klik); alle andre sider må ikke.
export const MIKROFON_SIDER = ['/oplevelser/maskinparken/retssalen/', '/en/experiences/machine-park/courtroom/'];
export const MIKROFON = new RegExp('^(' + MIKROFON_SIDER.map(p => p.replace(/\//g, '\\/')).join('|') + ')(index\\.html)?$');
export const MIKROFON_POLITIK = 'camera=(), microphone=(self), geolocation=()';
