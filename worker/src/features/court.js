// C01 — AI-retssalen. Ét modelkald, stramt skema, faste characterId'er, én replik pr. runde.
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { str } from '../lib/validate.js';
import { runJson } from '../lib/ai.js';
import { withQuota, quotaLimit, rateLimitEnv, rateLimitSession } from '../lib/quota.js';
import { systemBase, persona, EDITORIAL } from '../lib/canon.js';
import { randomId } from '../lib/crypto.js';
import { cphDateKey } from '../lib/dates.js';

const SCHEMA = {
  type: 'object', required: ['speeches', 'minutes'],
  properties: {
    speeches: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', required: ['characterId', 'text'], properties: { characterId: { type: 'string', enum: ['ulf', 'gudrun', 'ragnhild'] }, text: { type: 'string', minLength: 10, maxLength: 320 } } } },
    minutes: { type: 'string', minLength: 5, maxLength: 160 },
  },
};
const ROUND_TTL_MS = 20 * 60_000;

export async function court(request, env, ctx) {
  const body = await readJson(request, 4096);
  const lang = langOf(body.lang);
  const sess = ctx.session;
  if (!env.AI) return ok({ ...EDITORIAL[lang].court, roundRef: null }, 'editorial'); // ingen maskine: mærket redaktionelt indlæg, ingen replik
  await rateLimitSession(env, 'court', sess, +env.RATE_PER_MINUTE || 8, lang);
  let argument, prior = null, roundRef = null;
  if (body.roundRef) {
    const ref = str(body.roundRef, { max: 40, name: 'roundRef' });
    const row = await env.DB.prepare('SELECT argument, speeches_json, replied FROM court_rounds WHERE ref = ? AND owner_hash = ? AND language = ? AND expires_at > ?').bind(ref, sess.ownerHash, lang, Date.now()).first();
    if (!row) throw new ApiError('not_found', msg(lang, 'notfound'), 404);
    if (row.replied) throw new ApiError('conflict', lang === 'da' ? 'Replikken er allerede brugt.' : 'The reply has already been used.', 409);
    argument = str(body.reply, { max: 200, min: 1, name: 'reply', lang });
    prior = { argument: row.argument, speeches: JSON.parse(row.speeches_json) };
    await env.DB.prepare('UPDATE court_rounds SET replied = 1 WHERE ref = ?').bind(ref).run();
  } else {
    argument = str(body.argument, { max: 500, min: 2, name: 'argument', lang });
  }

  const roles = ['ulf', 'gudrun', 'ragnhild'];
  const system = systemBase(lang) + '\n' + (lang === 'da'
    ? `Scene: AI-retssalen. Tre figurer svarer kort på gæstens argument i kosagen, i rækkefølgen ulf, gudrun, ragnhild. Figurerne er uenige med hinanden og med gæsten, morsomt men uden at afgøre sagen. Mímir afslutter med et referat på én sætning. Figurer:\n- ${roles.map(r => persona(r, lang)).join('\n- ')}\n- ${persona('brian', lang)}\nSvar kun med JSON: {"speeches":[{"characterId":"ulf","text":"..."},{"characterId":"gudrun","text":"..."},{"characterId":"ragnhild","text":"..."}],"minutes":"..."}. Hvert indlæg 2–3 sætninger, højst 300 tegn; figuren reagerer konkret på gæstens ord, ikke generelt.`
    : `Scene: the AI courtroom. Three characters reply briefly to the guest’s argument in the cow case, in the order ulf, gudrun, ragnhild. They disagree with each other and with the guest, amusingly but without deciding the case. Mímir closes with one-sentence minutes. Characters:\n- ${roles.map(r => persona(r, lang)).join('\n- ')}\n- ${persona('brian', lang)}\nAnswer only with JSON: {"speeches":[{"characterId":"ulf","text":"..."},{"characterId":"gudrun","text":"..."},{"characterId":"ragnhild","text":"..."}],"minutes":"..."}. Each speech 2–3 sentences, at most 300 characters; the character reacts concretely to the guest’s words, not in general.`);
  const user = prior
    ? (lang === 'da' ? `Tidligere argument fra gæsten: «${prior.argument}»\nTidligere indlæg: ${prior.speeches.map(s => `${s.characterId}: «${s.text}»`).join(' | ')}\nGæstens replik: «${argument}»` : `Earlier argument from the guest: «${prior.argument}»\nEarlier speeches: ${prior.speeches.map(s => `${s.characterId}: «${s.text}»`).join(' | ')}\nThe guest’s reply: «${argument}»`)
    : (lang === 'da' ? `Gæstens argument: «${argument}»` : `The guest’s argument: «${argument}»`);

  let data, source = 'ai';
  try {
    const r = await withQuota(env.DB, 'text', cphDateKey(), quotaLimit(env, 'text'), lang, () => runJson(env, { system, user, schema: SCHEMA, lang, log: ctx.log }));
    data = r.data;
    // fast rækkefølge og ingen dubletter af roller
    const byId = Object.fromEntries(data.speeches.map(s => [s.characterId, s]));
    if (!roles.every(r => byId[r])) throw new ApiError('invalid_output', msg(lang, 'invalid'), 503, 30);
    data.speeches = roles.map(r => byId[r]);
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'quota' || e.code === 'rate_limited' || e.code === 'not_configured')) throw e;
    if (!(e instanceof ApiError)) throw e;
    data = EDITORIAL[lang].court; source = 'editorial'; ctx.log({ event: 'editorial_fallback', feature: 'court', code: e.code });
  }
  if (!prior && source === 'ai') {
    roundRef = randomId(12);
    await env.DB.prepare('INSERT INTO court_rounds (ref, owner_hash, language, argument, speeches_json, replied, expires_at) VALUES (?, ?, ?, ?, ?, 0, ?)').bind(roundRef, sess.ownerHash, lang, argument, JSON.stringify(data.speeches), Date.now() + ROUND_TTL_MS).run();
    ctx.waitUntil(env.DB.prepare('DELETE FROM court_rounds WHERE expires_at < ?').bind(Date.now()).run());
  }
  return ok({ speeches: data.speeches, minutes: data.minutes, roundRef }, source);
}
