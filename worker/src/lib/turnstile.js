// Turnstile: server-side validering mod siteverify. Uden TURNSTILE_SECRET er kontrollen slået fra (returnerer true), så sitet virker før opsætning.
import { ApiError } from './http.js';

export function turnstileEnabled(env) { return !!(env.TURNSTILE_SECRET && (env.TURNSTILE_HOSTNAMES || '').trim()); }

/** Kaster ApiError('forbidden') ved ugyldigt token. action skal matche widgetens data-action. */
export async function requireTurnstile(env, { token, ip, action, lang = 'da' }) {
  if (!turnstileEnabled(env)) return { skipped: true };
  const hosts = new Set(String(env.TURNSTILE_HOSTNAMES).split(',').map(s => s.trim()).filter(Boolean));
  const fejl = () => new ApiError('forbidden', lang === 'da' ? 'Tinget kunne ikke se, at du er et menneske. Prøv igen.' : 'The thing could not see that you are human. Try again.', 403);
  if (typeof token !== 'string' || !token || token.length > 2048) { const e = fejl(); e.detail = { codes: ['missing-input-response'], expected: action }; throw e; }
  let result;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip || '' }),
    });
    if (!r.ok) throw new Error('siteverify ' + r.status + ' ' + (await r.text().catch(() => '')).slice(0, 200));
    result = await r.json();
  } catch (e) { const f = fejl(); f.detail = { siteverify: String(e && e.message || e).slice(0, 240), expected: action, tokenLen: token.length, secretLen: String(env.TURNSTILE_SECRET || '').length }; throw f; }
  if (!result.success || (action && result.action !== action) || !hosts.has(result.hostname)) {
    const e = fejl(); e.detail = { codes: (result['error-codes'] || []).slice(0, 4), action: result.action || null, expected: action, hostname: result.hostname || null, tokenLen: token.length }; throw e; // til wrangler tail; aldrig til gæsten
  }
  return { skipped: false };
}
