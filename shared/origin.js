// Sitets adresse ét sted (runde 13, AP7): SITE_ORIGIN når den er sat (ting-ai's preview-miljø sætter den som secret),
// ellers forespørgslens egen origin uden for produktion (Worker Previews), ellers tingsvad.dk.
export const PRODUKTION = 'https://tingsvad.dk';
export function siteOrigin(env, request) {
  if (env && typeof env.SITE_ORIGIN === 'string' && /^https?:\/\//.test(env.SITE_ORIGIN)) return env.SITE_ORIGIN.replace(/\/$/, '');
  if (env && env.MILJOE && env.MILJOE !== 'production' && request) { try { return new URL(request.url).origin; } catch { } }
  return PRODUKTION;
}
