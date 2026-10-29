// Tal din sag (runde 12): gæsten indtaler sit argument til AI-retssalen, Workers AI (Whisper large v3 turbo) skriver det
// ned, og teksten sættes ind i feltet, så gæsten kan rette den, før retten hører den. Lyden gemmes ingen steder: den
// læses, sendes til modellen og glemmes i samme kald. Højst ca. et minut; et døgnloft for hele sitet (SPEECH_PER_DAY).
import { ok, ApiError, langOf, msg } from '../lib/http.js';
import { rateLimitSession, rateLimitEnv } from '../lib/quota.js';
import { gw, withTimeout, bytesToBase64 } from '../lib/ai.js';
import { medLoft } from '../lib/budget.js';

export const MAX_LYD = 1_500_000; // ca. 60 s opus/webm
const TYPER = /^audio\/(webm|ogg|mp4|mpeg|mp3|wav|x-wav|aac|m4a|x-m4a)\b/;
const MODEL = '@cf/openai/whisper-large-v3-turbo';

/** Kender lyden på de første bytes (WebM/Matroska, Ogg, MP4/M4A, MP3/ID3, WAV). */
export function sniffLyd(b) {
  if (!b || b.length < 12) return null;
  const s = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'webm';
  if (s(0, 4) === 'OggS') return 'ogg';
  if (s(4, 4) === 'ftyp') return 'mp4';
  if (s(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return 'mp3';
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WAVE') return 'wav';
  return null;
}
/** Renser transskriptionen: ingen styretegn, sammenpressede mellemrum, højst 500 tegn (samme som argumentfeltet). */
export const renTekst = t => String(t || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);

export async function tale(request, env, ctx) {
  const url = new URL(request.url), lang = langOf(url.searchParams.get('lang'));
  if (!env.AI) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (!TYPER.test(ct)) throw new ApiError('bad_request', lang === 'da' ? 'Tinget forstår kun lyd.' : 'The thing only understands audio.', 415);
  if (+(request.headers.get('content-length') || 0) > MAX_LYD) throw new ApiError('too_long', lang === 'da' ? 'Højst et minut.' : 'At most a minute.', 413);
  await rateLimitSession(env, 'tale', ctx.session, 4, lang, { strict: true });
  const b = new Uint8Array(await request.arrayBuffer());
  if (b.length > MAX_LYD) throw new ApiError('too_long', lang === 'da' ? 'Højst et minut.' : 'At most a minute.', 413);
  if (!sniffLyd(b)) throw new ApiError('bad_request', msg(lang, 'bad'), 415);
  const t0 = Date.now();
  const out = await medLoft(env, 'tale', () => withTimeout(env.AI.run(MODEL, { audio: bytesToBase64(b), task: 'transcribe', language: lang }, gw(env, { feature: 'tale' })), 30_000), lang);
  const tekst = renTekst(out && (out.text || (out.transcription_info && out.text)));
  ctx.log({ event: 'tale', bytes: b.length, ms: Date.now() - t0, tegn: tekst.length }); // aldrig selve teksten i loggen
  if (!tekst) throw new ApiError('invalid_output', lang === 'da' ? 'Retten hørte ikke noget. Prøv igen, lidt tættere på.' : 'The court heard nothing. Try again, a little closer.', 422);
  return ok({ tekst, model: MODEL }, 'ai');
}
