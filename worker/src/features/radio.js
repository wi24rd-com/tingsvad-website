// C08 — Radio med stemme. Manuskript bygges deterministisk fra dagens godkendte avis; lyd laves én gang pr. (dato, sprog, manuskripthash, stemme).
// Ingen dansk TTS i Workers AI: dansk lyd kræver TTS_PROVIDER=external med serversecret. Uden lyd vises en mærket tekstudgave.
import { ok, ApiError, langOf } from '../lib/http.js';
import { runTts } from '../lib/ai.js';
import { withQuota, quotaLimit } from '../lib/quota.js';
import { cphDateKey } from '../lib/dates.js';
import { sha256Hex } from '../lib/crypto.js';
import { EDITORIAL } from '../lib/canon.js';

export function buildScript(lang, edition) {
  const da = lang === 'da';
  // Hele sætninger op til n tegn (aldrig en halv sætning eller »..«); »Tingsvad-pointe:« hører til avisen, ikke radioen.
  const kort = (s, n) => {
    const saetn = String(s || '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+/).filter(x => x && !/^(Tingsvad-pointe|Tingsvad point)\b/i.test(x));
    let ud = '';
    for (const x of saetn) { if (ud && (ud + ' ' + x).length > n) break; ud = ud ? ud + ' ' + x : x; }
    if (ud.length > n) ud = ud.slice(0, n).replace(/\s\S*$/, '');
    return /[.!?]$/.test(ud) ? ud : ud + '.';
  };
  const titel = t => { t = String(t || '').trim(); return /[.!?]$/.test(t) ? t : t + '.'; };
  return [
    da ? 'Godmorgen fra vadestedet. Det er Tingsvad Radio. Tågen ligger, hvor den plejer.' : 'Good morning from the ford. This is Tingsvad Radio. The fog lies where it usually does.',
    (da ? 'Første nyhed: ' : 'First item: ') + titel(edition.lead.title) + ' ' + kort(edition.lead.body, 320),
    (da ? 'Anden nyhed: ' : 'Second item: ') + titel(edition.notice.title) + ' ' + kort(edition.notice.body, 240),
    da ? 'Det var alt. Sagen om koen er udsat. Vi sender igen i morgen, hvis der er nogen.' : 'That was all. The cow case is adjourned. We broadcast again tomorrow, if there is anyone.',
  ].join('\n\n');
}

export async function getRadio(request, env, ctx) {
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  const row = await env.DB.prepare('SELECT date_key, script, audio_key, voice, status FROM radio_editions WHERE language = ? AND status IN (?, ?) ORDER BY date_key DESC LIMIT 1').bind(lang, 'audio', 'text').first();
  if (row) return ok({ date: row.date_key, script: row.script, audioUrl: row.audio_key ? `/api/ting-ai/radio/audio/${row.date_key}/${lang}` : null, voice: row.voice, status: row.status, isLatest: row.date_key === cphDateKey() }, 'ai', 200, { 'x-tingsvad-cache': 'hit' });
  return ok({ date: null, script: EDITORIAL[lang].radio, audioUrl: null, voice: null, status: 'special' }, 'editorial');
}

export async function getRadioAudio(request, env, ctx, dateKey, lang) {
  lang = langOf(lang);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new ApiError('not_found', 'no', 404);
  const row = await env.DB.prepare('SELECT audio_key FROM radio_editions WHERE date_key = ? AND language = ? AND audio_key IS NOT NULL').bind(dateKey, lang).first();
  if (!row || !env.MEDIA) throw new ApiError('not_found', 'no audio', 404);
  const range = request.headers.get('range');
  const obj = await env.MEDIA.get(row.audio_key, { range: range ? request.headers : undefined });
  if (!obj) throw new ApiError('not_found', 'no audio', 404);
  const headers = new Headers({ 'content-type': obj.httpMetadata?.contentType || 'audio/mpeg', 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable', etag: obj.httpEtag, 'x-content-type-options': 'nosniff' });
  if (obj.range) { const { offset, length } = obj.range; headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${obj.size}`); headers.set('content-length', String(length)); return new Response(obj.body, { status: 206, headers }); }
  headers.set('content-length', String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}

/** Kaldes af Cron efter avisen. 'exists' | 'text' | 'audio' | 'skipped'. */
export async function publishRadio(env, lang, dateKey, log) {
  const ed = await env.DB.prepare('SELECT body_json FROM daily_editions WHERE date_key = ? AND language = ? AND status = ?').bind(dateKey, lang, 'published').first();
  if (!ed) return 'skipped';
  const script = buildScript(lang, JSON.parse(ed.body_json));
  const hash = (await sha256Hex(script)).slice(0, 16);
  const voice = `${env.TTS_PROVIDER || 'none'}:${env.TTS_VOICE || ''}:${env.TTS_MODEL || ''}`;
  const existing = await env.DB.prepare('SELECT script_hash, audio_key, voice FROM radio_editions WHERE date_key = ? AND language = ?').bind(dateKey, lang).first();
  if (existing && existing.script_hash === hash && (existing.audio_key || (env.TTS_PROVIDER || 'none') === 'none')) return 'exists';
  await env.DB.prepare('INSERT OR REPLACE INTO radio_editions (date_key, language, script, script_hash, audio_key, voice, status, created_at) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)').bind(dateKey, lang, script, hash, 'text', new Date().toISOString()).run();
  if ((env.TTS_PROVIDER || 'none') === 'none' || !env.MEDIA) return 'text';
  try {
    const audio = await withQuota(env.DB, 'audio', dateKey, quotaLimit(env, 'audio'), lang, () => runTts(env, { text: script, lang, log }));
    if (!audio) { log({ event: 'radio_no_audio', lang, dateKey, reason: 'provider returned null (no Danish TTS or misconfigured)' }); return 'text'; }
    const key = `radio/${dateKey}/${lang}/${hash}-${(await sha256Hex(voice)).slice(0, 8)}.${audio.contentType === 'audio/wav' ? 'wav' : 'mp3'}`;
    await env.MEDIA.put(key, audio.bytes, { httpMetadata: { contentType: audio.contentType, cacheControl: 'public, max-age=31536000, immutable' } });
    await env.DB.prepare('UPDATE radio_editions SET audio_key = ?, voice = ?, status = ? WHERE date_key = ? AND language = ?').bind(key, audio.voice, 'audio', dateKey, lang).run();
    log({ event: 'radio_published', lang, dateKey, bytes: audio.bytes.length });
    return 'audio';
  } catch (e) { log({ event: 'radio_failed', lang, dateKey, code: e && e.code, error: String(e && e.message).slice(0, 160) }); return 'text'; }
}
