// Gæstebog for tingsvad.dk — Cloudflare Pages Function.
// Kræver et KV-namespace bundet som SAGER (Pages → Settings → Bindings).
// GET  /api/sager  → de seneste 50 sager, nyeste først
// POST /api/sager  → { navn, sag, hp } → { nr }

import { ren, laesSager, skrivSag } from '../_lib/sagsliste.js';

const MAX = 50;
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

export async function onRequestGet({ env }) {
  if (!env.SAGER) return json({ error: 'KV-binding SAGER mangler' }, 500);
  return json(await laesSager(env.SAGER, MAX));
}

export async function onRequestPost({ request, env }) {
  if (!env.SAGER) return json({ error: 'KV-binding SAGER mangler' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'ugyldig' }, 400); }
  if (body.hp) return json({ nr: '980-0000' }); // honeypot: lad botten tro den vandt
  // Turnstile (når TURNSTILE_SECRET er sat som secret – Pages eller site-Workeren `tingsvad-site` og dens previews): tokenet valideres mod siteverify; tokens er engangs.
  if (env.TURNSTILE_SECRET) {
    const token = typeof body.turnstile === 'string' ? body.turnstile.slice(0, 2048) : '';
    let ok = false;
    try {
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get('cf-connecting-ip') || '' }) });
      const v = r.ok ? await r.json() : null; ok = !!(v && v.success && v.action === 'gaestebog' && /(^|\.)tingsvad\.dk$|\.tingsvad-website\.pages\.dev$|-tingsvad-site\.[a-z0-9-]+\.workers\.dev$/.test(v.hostname || ''));
    } catch (e) { ok = false; }
    if (!ok) return json({ error: 'turnstile' }, 403);
  }

  // Parentesen er nødvendig: uden den blev »navn || sprog ? A : B« læst som »(navn || sprog) ? A : B«, og alle hed »Unknown party«.
  const navn = ren(body.navn).slice(0, 60) || ((request.headers.get('accept-language') || '').startsWith('en') ? 'Unknown party' : 'Ukendt part');
  const sag = ren(body.sag).slice(0, 400);
  if (sag.length < 4) return json({ error: 'for kort' }, 400);

  // Simpel rate limit: én sag pr. IP pr. 2 minutter
  const ip = request.headers.get('cf-connecting-ip') || 'x';
  const nøgle = 'rl:' + ip;
  if (await env.SAGER.get(nøgle)) return json({ error: 'vent' }, 429);
  await env.SAGER.put(nøgle, '1', { expirationTtl: 120 });

  const ny = await skrivSag(env.SAGER, { navn, sag });
  return json(ny, 201);
}
