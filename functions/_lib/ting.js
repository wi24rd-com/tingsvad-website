// Interne kald til ting-ai (runde 13, AP7): gæstebog, tællere og besøgende bor i D1 bag service bindingen TING_AI.
// Ruterne intern/* nås aldrig gennem den offentlige proxy (functions/api/ting-ai/[[path]].js svarer 404 og fjerner headeren).
import { fail, videre } from '../../shared/svar.js';

export const INTERN_HEADER = 'x-tingsvad-intern';
export const tilsluttet = env => !!(env.TING_AI && typeof env.TING_AI.fetch === 'function');

/** Kalder ting-ai's intern/<sti> og returnerer Response'en. init.json sendes som JSON-krop. */
export async function intern(env, sti, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set(INTERN_HEADER, '1');
  let body = init.body;
  if (init.json !== undefined) { headers.set('content-type', 'application/json'); body = JSON.stringify(init.json); }
  return env.TING_AI.fetch(new Request('https://ting-ai/api/ting-ai/intern/' + sti, { method: init.method || 'GET', headers, body }));
}

/** Som intern(), men svaret pakkes til gæsten: ting-ai's krop og status, sitets headers; 503 i kontrakt hvis bindingen mangler eller fejler. */
export async function internSvar(env, sti, init = {}, lang = 'da') {
  if (!tilsluttet(env)) return fail('not_configured', lang === 'en' ? 'This part of the thing is not connected.' : 'Denne del af tinget er ikke tilsluttet.', 503);
  try { return await videre(await intern(env, sti, init)); }
  catch (e) { return fail('upstream', lang === 'en' ? 'The machines did not answer.' : 'Nettet svarede ikke.', 503, { retryAfter: 30 }); }
}

/** Læser et JSON-svar fra intern(); null ved fejl. */
export async function internJson(env, sti, init = {}) {
  if (!tilsluttet(env)) return null;
  try { const r = await intern(env, sti, init); const j = await r.json(); return j && j.ok ? j.data : null; } catch (e) { return null; }
}
