// Nødbremser (runde 12, Workers Paid): på betalingsplanen stopper Cloudflare ikke ved de inkluderede grænser; alt
// ud over faktureres. AI-kaldene har allerede døgnkvoter pr. funktion (quota.js). Her får de sidste to slags kald,
// der kun var begrænset pr. gæst, et samlet døgnloft for hele sitet: Browser Run (bilag, og-billeder, protokol-PDF,
// revisionen) og embeddings (hittegods og arkivet). Tallene er vars, så de kan skrues uden ny kode.
import { withQuota } from './quota.js';
import { ApiError } from './http.js';
import { cphDateKey } from './dates.js';

export const LOFT = { browser: ['BROWSER_PER_DAY', 120], embed: ['EMBED_PER_DAY', 400], tale: ['SPEECH_PER_DAY', 150],
  // Runde 13 (H1): de tre kald der kostede pr. kald uden døgnloft – EU-seglet (5 skrivninger), live-radioens SFU-sessioner og ML-DSA-signeringen.
  segl: ['EU_SEGL_PER_DAY', 300], live: ['LIVE_LYT_PER_DAY', 200], bevis: ['BEVIS_PER_DAY', 300] };
export function loft(env, art) {
  const [navn, std] = LOFT[art];
  const n = parseInt(env && env[navn], 10);
  return Number.isFinite(n) && n >= 0 ? n : std;
}
/** Kører fn under døgnloftet for art. Uden D1 (fx enhedstests) køres fn direkte. */
export async function medLoft(env, art, fn, lang = 'da') {
  if (!env || !env.DB) return fn();
  return withQuota(env.DB, 'loft-' + art, cphDateKey(), loft(env, art), lang, fn);
}
/** Samtidige pladser (runde 13, AP9) via Semafor-objektet: null når bindingen mangler (fx enhedstests). */
export async function tagPlads(env, navn, maks, ttlMs) {
  if (!env || !env.SEMAFOR) return null;
  const stub = env.SEMAFOR.get(env.SEMAFOR.idFromName(navn));
  const token = await stub.tag(maks, ttlMs);
  if (!token) throw new ApiError('busy', navn === 'browser' ? 'Alle tingets browsere er optaget. Prøv om lidt.' : 'Fuldt hus. Prøv om lidt.', 503, 10);
  return { slip: () => stub.slip(token).catch(() => {}) };
}
export const BROWSER_SAMTIDIG = env => Math.max(1, parseInt(env && env.BROWSER_SAMTIDIG, 10) || 4);
/** Browser Run quickAction under døgnloftet og med højst BROWSER_SAMTIDIG (4) samtidige browsere. */
export async function browserAction(env, type, opts) {
  const plads = await tagPlads(env, 'browser', BROWSER_SAMTIDIG(env), 90_000);
  try { return await medLoft(env, 'browser', () => env.BROWSER.quickAction(type, opts)); }
  finally { if (plads) await plads.slip(); }
}
