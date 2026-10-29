// /admin/* (delt af Pages Functions og site-Workeren) – alt her kræver en gyldig Cloudflare Access-login (se functions/_lib/access.js).
// Access står foran på Cloudflares kant; denne kontrol sikrer, at intet slipper igennem, hvis Access-applikationen
// mangler eller er sat forkert op (fx på en preview-adresse).
import { verificerAccess } from './access.js';

/** ctx = { request, env, data, next } – Pages' ctx eller site-Workerens egen. */
export async function adminVagt(ctx) {
  const hvem = await verificerAccess(ctx.request, ctx.env);
  if (!hvem) {
    const api = new URL(ctx.request.url).pathname.startsWith('/admin/api/');
    return new Response(api ? JSON.stringify({ ok: false, code: 'forbidden', message: 'Kun for tingets administrator.' }) : 'Kun for tingets administrator. Log ind via Cloudflare Access.', {
      status: 403, headers: { 'content-type': api ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
    });
  }
  ctx.data.admin = hvem;
  const res = await ctx.next();
  const r = new Response(res.body, res);
  r.headers.set('cache-control', 'no-store');
  r.headers.set('x-robots-tag', 'noindex, nofollow');
  return r;
}
