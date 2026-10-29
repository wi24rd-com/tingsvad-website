// C07 — Mímir, modvillig guide. Serveren vælger det tilladte hint FØR modelkald; modellen får aldrig løsningen på lave niveauer.
// Browserens fragmentliste personaliserer kun; den ændrer aldrig canonical state.
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { str, oneOf, strList } from '../lib/validate.js';
import { runJson } from '../lib/ai.js';
import { withQuota, quotaLimit, rateLimitEnv, rateLimitSession } from '../lib/quota.js';
import { systemBase, persona, selectHint, HINTS, SOURCES, EDITORIAL } from '../lib/canon.js';
import { cphDateKey } from '../lib/dates.js';
import { search as archiveSearch, archiveEnabled } from '../lib/archive.js';

const SCHEMA = { type: 'object', required: ['answer'], properties: { answer: { type: 'string', minLength: 10, maxLength: 480 } } };

export async function guide(request, env, ctx) {
  const body = await readJson(request, 4096);
  const lang = langOf(body.lang);
  const question = str(body.question, { max: 500, min: 1, name: 'question', lang });
  const level = oneOf(body.spoilerLevel || 'hint', ['hint', 'clearer', 'solution'], 'spoilerLevel');
  const known = strList(body.knownFragments).filter(f => ['archive', 'shield', 'excavation'].includes(f));
  await rateLimitSession(env, 'guide', ctx.session, +env.RATE_PER_MINUTE || 8, lang);

  const hint = selectHint(lang, question, level, known);
  const faktuelt = /hvornår|when|år|year|historisk|historic|virkelig|real|sand|true|jelling|vikinge|viking/i.test(question);
  const unknown = HINTS[lang].unknown;
  if (!env.AI) return ok({ answer: EDITORIAL[lang].guide + '\n\n' + hint.text, sources: [hint.source], level }, 'editorial');

  // Arkivopslag (Vectorize): relevante, redaktionelle uddrag med kilde. Aldrig gådeløsninger – de findes ikke i korpusset.
  const uddrag = archiveEnabled(env) ? await archiveSearch(env, question, lang, ctx.log) : [];
  const arkivTekst = uddrag.length ? (lang === 'da' ? '\nArkivuddrag (må citeres, angiv ikke andre fakta end disse):\n' : '\nArchive excerpts (may be quoted; state no facts beyond these):\n') + uddrag.map(u => `- [${u.source}] ${u.text}`).join('\n') : '';
  const system = systemBase(lang) + '\n' + persona('brian', lang) + '\n' + (lang === 'da'
    ? `Du er Mímir. Gæsten stiller et spørgsmål. Du svarer kort og modvilligt (2–4 sætninger). Det ENESTE, du må røbe om gåden, er den vedlagte arkivtekst; gengiv dens indhold loyalt, uden at tilføje nye hints eller løsninger. Spørger gæsten om virkelige historiske fakta, som arkivteksten ikke dækker, svarer du: «${unknown}» og tilføjer højst en tør bemærkning. Du uddeler ingen fund eller præmier. Svar kun med JSON: {"answer":"..."}`
    : `You are Mímir. The guest asks a question. You answer briefly and reluctantly (2–4 sentences). The ONLY thing you may reveal about the puzzle is the attached archive text; render its content faithfully, without adding new hints or solutions. If the guest asks about real historical facts the archive text does not cover, answer: «${unknown}» plus at most one dry remark. You hand out no finds or prizes. Answer only with JSON: {"answer":"..."}`);
  const gaadeSpm = /side 2|page 2|stykke|piece|fragment|gåde|puzzle|hint|vink|ledetråd|clue|løsning|solution/i.test(question) || hint.topic !== 'general';
  const user = (lang === 'da' ? `Spørgsmål: «${question}»\nNiveau: ${level}\nGæsten har fundet ${known.length} af 3 stykker.` + (gaadeSpm || !uddrag.length ? `\nArkivtekst om gåden (må gengives): «${hint.text}»` : '\nSpørgsmålet handler ikke om gåden; svar ud fra arkivuddragene og nævn kun gåden, hvis det er relevant.') : `Question: «${question}»\nLevel: ${level}\nThe guest has found ${known.length} of 3 pieces.` + (gaadeSpm || !uddrag.length ? `\nArchive text about the puzzle (may be rendered): «${hint.text}»` : '\nThe question is not about the puzzle; answer from the archive excerpts and mention the puzzle only if relevant.'))
    + (faktuelt && hint.topic === 'general' && !uddrag.length ? (lang === 'da' ? '\nBemærk: spørgsmålet kan handle om virkelige fakta; arkivet dækker kun universet.' : '\nNote: the question may concern real facts; the archive covers only the universe.') : '') + arkivTekst;
  try {
    const r = await withQuota(env.DB, 'text', cphDateKey(), quotaLimit(env, 'text'), lang, () => runJson(env, { system, user, schema: SCHEMA, lang, maxTokens: 320, log: ctx.log }));
    // Sikkerhedsnet: på lave niveauer må svaret ikke indeholde løsningsteksten
    const leak = level !== 'solution' && Object.values(HINTS[lang]).some(h => h && typeof h === 'object' && h.solution && r.data.answer.includes(h.solution.slice(0, 40)));
    const answer = leak ? hint.text : r.data.answer;
    const sources = [...new Set([hint.source, ...uddrag.map(u => u.source), SOURCES[lang].canon])];
    return ok({ answer, sources, level, archive: uddrag.length }, 'ai');
  } catch (e) {
    if (e instanceof ApiError && (e.code === 'quota' || e.code === 'rate_limited')) throw e;
    if (e instanceof ApiError) { ctx.log({ event: 'editorial_fallback', feature: 'guide', code: e.code }); return ok({ answer: EDITORIAL[lang].guide + '\n\n' + hint.text, sources: [hint.source], level }, 'editorial'); }
    throw e;
  }
}
