// Sikkerheds- og cacheheaders til HTML, der går gennem functions/_middleware.js.
// _headers gælder kun statiske filer, ikke svar fra Pages Functions; derfor står de samme værdier også her.
// Ændres CSP'en, skal den rettes begge steder (_headers, /* og denne fil).
export const SIKKERHED = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' https://static.cloudflareinsights.com https://challenges.cloudflare.com; connect-src 'self' https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
};
// Tal din sag (runde 12): AI-retssalen må bede om mikrofonen (altid efter gæstens eget klik); alle andre sider må ikke.
export const MIKROFON = /^\/(oplevelser\/maskinparken\/retssalen|en\/experiences\/machine-park\/courtroom)\/(index\.html)?$/;
