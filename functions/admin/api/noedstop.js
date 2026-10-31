// Admin: nødstoppet (runde 13, AP9). KV-nøglen NOEDSTOP i SAGER (samme namespace som ting-ai læser) slukker alle maskiner
// bag /api/ting-ai/* undtagen health og intern/*, og stopper cron. KV er eventuelt konsistent: op til et minut før alle
// datacentre ser det. GET → { aktiv } · POST { aktiv: true|false } → { aktiv }. Access-tjekket ligger i adminVagt.
import { ok, fail } from '../../../shared/svar.js';

export async function onRequestGet({ env }) {
  if (!env.SAGER) return fail('not_configured', 'KV mangler.', 503);
  return ok({ aktiv: !!(await env.SAGER.get('NOEDSTOP')) });
}

export async function onRequestPost({ request, env, data }) {
  if (!env.SAGER) return fail('not_configured', 'KV mangler.', 503);
  let b; try { b = await request.json(); } catch { return fail('bad_request', 'json', 400); }
  if (b.aktiv) await env.SAGER.put('NOEDSTOP', JSON.stringify({ af: (data && data.admin && data.admin.email) || '', naar: new Date().toISOString() }));
  else await env.SAGER.delete('NOEDSTOP');
  return ok({ aktiv: !!b.aktiv });
}
