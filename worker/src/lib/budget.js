// Nødbremser (runde 12, Workers Paid): på betalingsplanen stopper Cloudflare ikke ved de inkluderede grænser; alt
// ud over faktureres. AI-kaldene har allerede døgnkvoter pr. funktion (quota.js). Her får de sidste to slags kald,
// der kun var begrænset pr. gæst, et samlet døgnloft for hele sitet: Browser Run (bilag, og-billeder, protokol-PDF,
// revisionen) og embeddings (hittegods og arkivet). Tallene er vars, så de kan skrues uden ny kode.
import { withQuota } from './quota.js';
import { cphDateKey } from './dates.js';

export const LOFT = { browser: ['BROWSER_PER_DAY', 120], embed: ['EMBED_PER_DAY', 400], tale: ['SPEECH_PER_DAY', 150] };
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
/** Browser Run quickAction under døgnloftet. */
export const browserAction = (env, type, opts) => medLoft(env, 'browser', () => env.BROWSER.quickAction(type, opts));
