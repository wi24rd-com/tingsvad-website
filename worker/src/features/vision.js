// C04 — Fremlæg dit bevis. Prøvebakke (galleryId) eller upload (kun når VISION_UPLOAD_ENABLED).
// Upload: signatur + dimensioner kontrolleres server-side; ingen permanent lagring; valgfri IMAGES-binding til normalisering.
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { oneOf } from '../lib/validate.js';
import { runVision, runJson } from '../lib/ai.js';
import { withQuota, quotaLimit, rateLimitEnv } from '../lib/quota.js';
import { systemBase, persona, EDITORIAL } from '../lib/canon.js';
import { cphDateKey } from '../lib/dates.js';

const GALLERY = { ko: 'assets/pak/web/ko.webp', skjold: 'assets/pak/web/skjold.webp', stol: 'assets/pak/web/stol.webp', spyd: 'assets/pak/web/spyd.webp' };
const MAX_BYTES = 2 * 1024 * 1024, MAX_PIXELS = 16_000_000;
const VERDICT_SCHEMA = { type: 'object', required: ['description', 'observations', 'fictionalVerdict'], properties: { description: { type: 'string', minLength: 10, maxLength: 400 }, observations: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'string', maxLength: 140 } }, fictionalVerdict: { type: 'string', minLength: 10, maxLength: 320 } } };

export async function vision(request, env, ctx) {
  const ct = request.headers.get('content-type') || '';
  let lang = 'da', galleryId = null, file = null;
  // Prøvebakken ankommer som multipart fra Pages-proxyen med x-gallery-id (proxyen fjerner headeren fra indkommende requests).
  const viaProxy = request.headers.get('x-gallery-id');
  if (ct.startsWith('multipart/form-data')) {
    if (viaProxy) { galleryId = oneOf(viaProxy, Object.keys(GALLERY), 'galleryId'); }
    else if (env.VISION_UPLOAD_ENABLED !== 'true') throw new ApiError('not_configured', 'upload disabled', 503);
    if (+(request.headers.get('content-length') || 0) > MAX_BYTES + 4096) throw new ApiError('too_long', 'file too large', 413);
    const fd = await request.formData(); lang = langOf(fd.get('lang')); file = fd.get('file');
    if (!file || typeof file === 'string') throw new ApiError('bad_request', msg(lang, 'bad'), 400);
  } else {
    const body = await readJson(request, 2048); lang = langOf(body.lang); galleryId = oneOf(body.galleryId, Object.keys(GALLERY), 'galleryId');
  }
  await rateLimitEnv(env, 'vision', ctx.session.ownerHash, +env.RATE_PER_MINUTE || 8, lang);

  let bytes, contentType;
  if (file && galleryId) { bytes = new Uint8Array(await file.arrayBuffer()); contentType = 'image/webp'; }
  else if (file) {
    if (file.size > MAX_BYTES) throw new ApiError('too_long', lang === 'da' ? 'Højst 2 MB.' : 'At most 2 MB.', 413);
    bytes = new Uint8Array(await file.arrayBuffer());
    const info = sniffImage(bytes);
    if (!info) throw new ApiError('bad_request', lang === 'da' ? 'Kun JPEG, PNG eller WebP.' : 'JPEG, PNG or WebP only.', 415);
    if (info.width * info.height > MAX_PIXELS) throw new ApiError('bad_request', lang === 'da' ? 'Billedet har for mange pixels.' : 'Too many pixels.', 413);
    contentType = info.type;
    if (env.IMAGES && env.IMAGES.input) { // valgfri normalisering: fjern metadata, ret orientering, nedskalér
      try { const r = await env.IMAGES.input(bytes).transform({ width: 1024, height: 1024, fit: 'scale-down' }).output({ format: 'image/jpeg', quality: 85 }); bytes = new Uint8Array(await r.response().arrayBuffer()); contentType = 'image/jpeg'; }
      catch (e) { ctx.log({ event: 'images_binding_error', error: String(e.message).slice(0, 120) }); }
    }
  } else {
    // JSON med galleryId uden proxy (fx lokal udvikling uden Pages): ingen subrequest til egen zone; brug redaktionelt eksempel
    return ok(EDITORIAL[lang].vision[galleryId], 'editorial');
  }

  if (!env.AI) {
    if (galleryId) return ok(EDITORIAL[lang].vision[galleryId], 'editorial');
    throw new ApiError('not_configured', msg(lang, 'notconf'), 503); // vi lader ikke som om, vi har set filen
  }
  // 1) Nøgtern beskrivelse (billedmodel). 2) Separat tekstkald: Gudruns fiktive vurdering ud fra beskrivelsen, aldrig ud fra filen.
  let description;
  try {
    const v = await withQuota(env.DB, 'text', cphDateKey(), quotaLimit(env, 'text'), lang, () => runVision(env, { imageBytes: bytes, contentType, lang, log: ctx.log, prompt: 'Describe briefly and soberly what is seen in the picture, in English. At most three sentences. Objects, animals, setting, light. No guesses about people’s identity, no interpretation.' })); // altid engelsk: billedmodellens dansk er svagt; tekstmodellen oversætter
    description = v.text;
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'quota' || e.code === 'rate_limited')) throw e;
    if (galleryId && e instanceof ApiError) { ctx.log({ event: 'editorial_fallback', feature: 'vision', code: e.code }); return ok(EDITORIAL[lang].vision[galleryId], 'editorial'); }
    throw e;
  }
  // 2) Ét tekstkald: (a) oversæt/gengiv beskrivelsen nøgternt på gæstens sprog, (b) Gudruns tørre, fiktive vurdering. De to felter holdes adskilt.
  let verdict;
  try {
    const system = systemBase(lang) + '\n' + persona('gudrun', lang) + (lang === 'da'
      ? '\nTo opgaver. (1) "description": gengiv den engelske billedbeskrivelse nøgternt og korrekt på dansk, højst tre sætninger, uden at tilføje noget. (2) Som Gudrun, revisor og hvid gås: "observations" er 1–3 tørre, konkrete iagttagelser om, hvad der mangler af bilag, stempler eller dokumentation i billedet; "fictionalVerdict" er din vurdering af bevisets betydning i kosagen i 1–2 korte sætninger, i stilen «Bilaget beviser, at der findes et bilag.» Tør, bureaukratisk, let absurd. Aldrig "interessant", aldrig "kontekst", ingen procenter, ingen afgørelse. Svar kun med JSON: {"description":"...","observations":["..."],"fictionalVerdict":"..."}'
      : '\nTwo tasks. (1) "description": render the image description soberly and accurately in English, at most three sentences, adding nothing. (2) As Gudrun, auditor and white goose: "observations" are 1–3 dry, concrete remarks on which documents, stamps or paperwork are missing from the picture; "fictionalVerdict" is your assessment of the evidence’s meaning in the cow case in 1–2 short sentences, in the style “The document proves that a document exists.” Dry, bureaucratic, gently absurd. Never "interesting", never "context", no percentages, no ruling. Answer only with JSON: {"description":"...","observations":["..."],"fictionalVerdict":"..."}');
    const r = await withQuota(env.DB, 'text', cphDateKey(), quotaLimit(env, 'text'), lang, () => runJson(env, { system, user: 'Image description (English, from the vision model): «' + description + '»', schema: VERDICT_SCHEMA, lang, maxTokens: 400, log: ctx.log }));
    verdict = r.data;
  } catch (e) {
    verdict = { description, observations: [], fictionalVerdict: lang === 'da' ? 'Gudrun har set beskrivelsen og bedt om bilag. Vurderingen er udsat.' : 'Gudrun has seen the description and asked for documents. The assessment is adjourned.' };
  }
  return ok({ description: verdict.description, observations: verdict.observations, fictionalVerdict: verdict.fictionalVerdict }, 'ai');
}

/** Filsignatur + dimensioner for JPEG/PNG/WebP. Returnerer null, hvis filen ikke er et understøttet billede. */
export function sniffImage(b) {
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[12] === 0x49 && b[13] === 0x48 && b[14] === 0x44 && b[15] === 0x52) {
    return { type: 'image/png', width: rd32(b, 16), height: rd32(b, 20) };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1]; if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { i += 2; continue; }
      const len = (b[i + 2] << 8) | b[i + 3];
      if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) || (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) return { type: 'image/jpeg', height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
      if (len < 2) return null; i += 2 + len;
    }
    return null;
  }
  if (b.length > 30 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    const tag = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (tag === 'VP8 ') return { type: 'image/webp', width: ((b[26] | (b[27] << 8)) & 0x3fff), height: ((b[28] | (b[29] << 8)) & 0x3fff) };
    if (tag === 'VP8L') { const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { type: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }; }
    if (tag === 'VP8X') return { type: 'image/webp', width: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1, height: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1 };
  }
  return null;
}
const rd32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
