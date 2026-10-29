// Workers Cache (runde 12): offentlige, ens svar (dagens avis, radio, revision, dagbøger …) caches foran Workeren.
// Cloudflare svarer fra kantens cache uden at køre Workeren, så længe Cache-Control tillader det; derefter genvalideres
// med ETag (If-None-Match → 304), og ctx.cache.invalidate({tags}) markerer svar som forældede, når Cron har trykt nyt.
// Svar med Set-Cookie (en ny gæsts første kald) springes automatisk over af cachen. Kræver [cache] enabled = true.
import { sha256Hex } from './crypto.js';

export const TAGS = { avis: 'avis', radio: 'radio', revision: 'revision', dagbog: 'dagbog', topologi: 'topologi', taelle: 'taelle', bevis: 'bevis', vagt: 'vagt' };

/** Gør et JSON-svar cachebart: public max-age/stale-while-revalidate, Cache-Tag og en ETag ud fra indholdet. */
export async function cachebar(request, res, { maxAge = 60, swr = 300, tags = [] } = {}) {
  if (!res || res.status !== 200) return res;
  const tekst = await res.text();
  // requestId skifter ved hvert kald; uden den i hashen giver samme indhold samme ETag, så 304 faktisk kan ske.
  const etag = '"' + (await sha256Hex(tekst.replace(/"requestId":"[^"]*",?/, ''))).slice(0, 20) + '"';
  const headers = new Headers(res.headers);
  headers.set('cache-control', `public, max-age=${maxAge}, stale-while-revalidate=${swr}`);
  if (tags.length) headers.set('cache-tag', tags.join(','));
  headers.set('etag', etag);
  headers.set('x-tingsvad-genereret', new Date().toISOString());
  const inm = request.headers.get('if-none-match');
  if (inm && inm.split(',').map(x => x.trim().replace(/^W\//, '')).includes(etag)) return new Response(null, { status: 304, headers });
  return new Response(tekst, { status: 200, headers });
}

/** Markerer cachede svar med de givne tags som forældede (ctx.cache.invalidate). Stille, hvis runtime ikke har det. */
export async function invalider(ctx, tags, log) {
  try {
    if (ctx && ctx.cache && typeof ctx.cache.invalidate === 'function') { await ctx.cache.invalidate({ tags }); log && log({ event: 'cache_invalidated', tags }); return true; }
  } catch (e) { log && log({ event: 'cache_invalidate_failed', tags, error: String(e && e.message).slice(0, 120) }); }
  return false;
}

/** Er svaret beregnet til kantens cache? (bruges til ikke at sætte sessionscookie på det) */
export const erOffentlig = res => /^public\b/.test((res && res.headers.get('cache-control')) || '');
