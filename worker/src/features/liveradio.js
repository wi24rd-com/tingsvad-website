// Live-radio (runde 12): ruterne for lytterne. Workeren holder Realtime SFU-hemmeligheden; browseren får kun en
// SFU-offer og sender sit svar tilbage. Lytterne behøver ingen mikrofon (sitets Permissions-Policy blokerer den).
//   GET  radio/live        → {aktiv, start, slut, konfigureret}
//   POST radio/live/lyt    → starter udsendelsen om nødvendigt og abonnerer: {sessionId, sessionDescription (offer), start, slut}
//   POST radio/live/svar   → {sessionId, sessionDescription (answer)} → SFU renegotiate
//   GET  radio/live/kilde  → WebSocket fra SFU-adapteren til Durable Objecten (engangsnøgle i URL'en)
import { ok, fail, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { harHemmelighed, hemmelighed } from '../lib/hemmelighed.js';
import { rateLimitEnv } from '../lib/quota.js';
import { sfu, gyldigSessionId } from '../lib/sfu.js';

export const liveEnabled = env => !!((env.REALTIME_SFU_APP_ID || '').trim() && harHemmelighed(env, 'REALTIME_SFU_TOKEN') && env.RADIO_STATION && env.MEDIA && env.AI && (env.TTS_PROVIDER || 'none') === 'workers-ai');
const station = env => env.RADIO_STATION.get(env.RADIO_STATION.idFromName('en'));

export async function liveStatus(request, env) {
  if (!liveEnabled(env)) return ok({ aktiv: false, konfigureret: false }, 'server');
  return ok({ ...(await station(env).status()), konfigureret: true }, 'server');
}

export async function liveLyt(request, env, c) {
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  if (!liveEnabled(env)) return fail('not_configured', msg(lang, 'notconf'), 503);
  await rateLimitEnv(env, 'live', c.session.ownerHash, 4, lang, { strict: true });
  let st;
  try { st = await station(env).start(); }
  catch (e) { c.log({ event: 'live_start_failed', error: String(e && e.message).slice(0, 160) }); throw new ApiError('provider_error', msg(lang, 'provider'), 503, 60); }
  if (!st || !st.aktiv) throw new ApiError('provider_error', msg(lang, 'provider'), 503, 30);
  const appId = env.REALTIME_SFU_APP_ID.trim(), token = (await hemmelighed(env, 'REALTIME_SFU_TOKEN')).v;
  try {
    const s = await sfu(appId, token, 'POST', '/sessions/new');
    if (!gyldigSessionId(s.sessionId)) throw new Error('no session');
    const t = await sfu(appId, token, 'POST', `/sessions/${s.sessionId}/tracks/new`, { tracks: [{ location: 'remote', sessionId: st.sessionId, trackName: st.trackName }] });
    const spor = (t.tracks || [])[0] || {};
    if (spor.errorCode || !t.sessionDescription) throw new Error('track ' + (spor.errorCode || 'no offer'));
    if (env.SAGER) await env.SAGER.put('live:lytter:' + s.sessionId, c.session.ownerHash, { expirationTtl: 900 });
    return ok({ sessionId: s.sessionId, sessionDescription: t.sessionDescription, mid: spor.mid || null, start: st.start, slut: st.slut, server: st.server }, 'server');
  } catch (e) { c.log({ event: 'live_subscribe_failed', error: String(e && e.message).slice(0, 160) }); throw new ApiError('provider_error', msg(lang, 'provider'), 503, 30); }
}

export async function liveSvar(request, env, c) {
  const body = await readJson(request, 16384);
  const lang = langOf(body.lang);
  if (!liveEnabled(env)) return fail('not_configured', msg(lang, 'notconf'), 503);
  const sid = body.sessionId, sd = body.sessionDescription;
  if (!gyldigSessionId(sid) || !sd || sd.type !== 'answer' || typeof sd.sdp !== 'string' || sd.sdp.length > 12000) throw new ApiError('bad_request', msg(lang, 'bad'), 400);
  if (env.SAGER && (await env.SAGER.get('live:lytter:' + sid)) !== c.session.ownerHash) throw new ApiError('forbidden', msg(lang, 'forbidden'), 403);
  try { await sfu(env.REALTIME_SFU_APP_ID.trim(), (await hemmelighed(env, 'REALTIME_SFU_TOKEN')).v, 'PUT', `/sessions/${sid}/renegotiate`, { sessionDescription: { type: 'answer', sdp: sd.sdp } }); }
  catch (e) { c.log({ event: 'live_answer_failed', error: String(e && e.message).slice(0, 160) }); throw new ApiError('provider_error', msg(lang, 'provider'), 503, 30); }
  return ok({ modtaget: true }, 'server');
}

export async function liveKilde(request, env) {
  if (!env.RADIO_STATION) return new Response('no', { status: 404 });
  if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
  return station(env).fetch(request);
}
