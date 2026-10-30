// C03 — Tingsvad Tidende. Én udgave pr. dato (Europe/Copenhagen) og sprog, skrevet af Cron, læst af GET.
// Sidevisninger genererer aldrig en avis. Dagens tal er aggregerede serverevents fra i går, aldrig rå requests eller gæstetekst.
import { ok, ApiError, langOf, readJson } from '../lib/http.js';
import { runJson } from '../lib/ai.js';
import { withQuota, quotaLimit } from '../lib/quota.js';
import { systemBase, EDITORIAL } from '../lib/canon.js';
import { cphDateKey, prevDateKey } from '../lib/dates.js';
import { randomId } from '../lib/crypto.js';
import { faktaTekst, tilladteTal, rensTal, aarSiden } from '../lib/kanon.js';
import { udlandsrubrik } from './udland.js';
import { verificerAccess } from '../../../shared/access.js';
import { invalider, TAGS } from '../lib/kantcache.js';

const SCHEMA = {
  type: 'object', required: ['lead', 'notice', 'ad'],
  properties: {
    lead: { type: 'object', required: ['title', 'body'], properties: { title: { type: 'string', minLength: 5, maxLength: 90 }, body: { type: 'string', minLength: 40, maxLength: 600 } } },
    notice: { type: 'object', required: ['title', 'body'], properties: { title: { type: 'string', minLength: 5, maxLength: 90 }, body: { type: 'string', minLength: 30, maxLength: 480 } } },
    ad: { type: 'object', required: ['title', 'body'], properties: { title: { type: 'string', minLength: 3, maxLength: 60 }, body: { type: 'string', minLength: 20, maxLength: 280 } } },
  },
};
const LEASE_MS = 5 * 60_000;
export const EVENT_LABELS = { da: { vote_round_closed: 'Gennemførte afstemningsrunder', chair_application: 'Modtagne stolansøgninger' }, en: { vote_round_closed: 'Completed voting rounds', chair_application: 'Stool applications received' } };

const DATO = /^\d{4}-\d{2}-\d{2}$/;
const IKKE_FUNDET = { da: 'Der findes ingen udgave fra den dato i arkivet.', en: 'There is no edition from that date in the archive.' };
/** Forrige og næste udgave på samme sprog, så avisen kan bladres i. */
async function naboer(env, lang, d) {
  const r = await env.DB.prepare(`SELECT (SELECT MAX(date_key) FROM daily_editions WHERE language = ?1 AND status = 'published' AND date_key < ?2) AS prev,
    (SELECT MIN(date_key) FROM daily_editions WHERE language = ?1 AND status = 'published' AND date_key > ?2) AS next`).bind(lang, d).first();
  return { prev: (r && r.prev) || null, next: (r && r.next) || null };
}

/** GET news?lang=[&date=YYYY-MM-DD] → dagens (seneste) udgave eller en bestemt udgave fra arkivet. Læser kun; trykker aldrig. */
export async function getNews(request, env, ctx) {
  const q = new URL(request.url).searchParams, lang = langOf(q.get('lang')), dato = q.get('date');
  const today = cphDateKey();
  if (dato != null && !DATO.test(dato)) throw new ApiError('bad_request', IKKE_FUNDET[lang], 400);
  const row = dato
    ? await env.DB.prepare('SELECT date_key, body_json, source, published_at FROM daily_editions WHERE language = ? AND status = ? AND date_key = ?').bind(lang, 'published', dato).first()
    : await env.DB.prepare('SELECT date_key, body_json, source, published_at FROM daily_editions WHERE language = ? AND status = ? ORDER BY date_key DESC LIMIT 1').bind(lang, 'published').first();
  if (row) {
    const body = JSON.parse(row.body_json), nab = await naboer(env, lang, row.date_key);
    return ok({ date: row.date_key, isLatest: row.date_key === today, arkiv: !!nab.next, ...nab, publishedAt: row.published_at, ...body }, row.source, 200, { 'x-tingsvad-cache': 'hit' }); // gemt udgave fra Cron
  }
  if (dato) throw new ApiError('not_found', IKKE_FUNDET[lang], 404);
  return ok({ date: null, isLatest: false, status: 'special', ...EDITORIAL[lang].news, numbers: null }, 'editorial');
}

/** GET news/arkiv?lang= → alle trykte udgaver på sproget (dato + hovedhistoriens overskrift), nyeste først. */
export async function getNewsArkiv(request, env, ctx) {
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  const r = await env.DB.prepare("SELECT date_key AS date, json_extract(body_json, '$.lead.title') AS title FROM daily_editions WHERE language = ? AND status = 'published' ORDER BY date_key DESC LIMIT 400").bind(lang).all();
  const udgaver = (r.results || []).map(x => ({ date: x.date, title: typeof x.title === 'string' ? x.title.slice(0, 120) : '' }));
  return ok({ udgaver }, 'server');
}

export async function publishEdition(env, lang, dateKey, log) {
  const exists = await env.DB.prepare('SELECT 1 FROM daily_editions WHERE date_key = ? AND language = ? AND status = ?').bind(dateKey, lang, 'published').first();
  if (exists) return 'exists';
  const cacheKey = `news:${dateKey}:${lang}`, now = Date.now(), jobId = randomId(8);
  const lock = await env.DB.prepare(`INSERT INTO generation_jobs (id, kind, cache_key, owner_hash, state, lease_until, created_at) VALUES (?, 'news', ?, NULL, 'running', ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET id = excluded.id, state = 'running', lease_until = excluded.lease_until WHERE generation_jobs.state != 'running' OR generation_jobs.lease_until < ?`).bind(jobId, cacheKey, now + LEASE_MS, new Date(now).toISOString(), now).run();
  if (!lock.meta || lock.meta.changes !== 1) return 'locked';
  try {
    const yday = prevDateKey(dateKey);
    const rows = (await env.DB.prepare('SELECT event_type, count FROM event_totals WHERE day_key = ?').bind(yday).all()).results || [];
    const numbers = {}; for (const r of rows) if (EVENT_LABELS[lang][r.event_type]) numbers[EVENT_LABELS[lang][r.event_type]] = r.count;
    const stille = !rows.length;
    const system = systemBase(lang) + '\n' + (lang === 'da'
      ? 'Du er redaktionen på Tingsvad Tidende, en dagsavis der er uafhængig af begivenheder siden 980. Skriv dagens udgave: en hovedhistorie, et bureaukratisk notat og en rubrikannonce. Brug figurerne (Mímir, Gudrun, Ulf, Ragnhild, Høvdingen, Toke, Asgeir, Gamle Ravn). Tør, kort, absurd. Ingen afgørelse i kosagen. TAL: brug kun de tal, årstal og varigheder, der står i FAKTA; opfind aldrig egne tal, klokkeslæt eller beregninger (skriv hellere »længe« eller »igen«). Hver artikel slutter med én tør Tingsvad-pointe. Annoncen er fra tinget selv og ender med en bureaukratisk detalje (fx »Stillingen har været ledig siden 1236«). Korrekt dansk retskrivning i overskrifterne. Svar kun med JSON: {"lead":{"title":"...","body":"..."},"notice":{"title":"...","body":"..."},"ad":{"title":"...","body":"..."}}'
      : 'You are the editors of Tingsvad Tidende, a daily paper independent of events since 980. Write today’s edition: a lead story, a bureaucratic notice and a classified ad. Use the characters (Mímir, Gudrun, Ulf, Ragnhild, the Chieftain, Toke, Asgeir, Old Ravn). Dry, brief, absurd. No ruling in the cow case. NUMBERS: use only the figures, years and durations given under FACTS; never invent your own numbers, times or calculations (write »for a long time« or »again« instead). Every piece ends with one dry Tingsvad punchline. The ad is placed by the thing itself and ends with a bureaucratic detail (e.g. »The position has been vacant since 1236«). Correct spelling in headlines. Answer only with JSON: {"lead":{"title":"...","body":"..."},"notice":{"title":"...","body":"..."},"ad":{"title":"...","body":"..."}}');
    // Faste tal leveres af koden (assets/kanon.json via lib/kanon.js), så modellen ikke regner selv.
    const fakta = faktaTekst(lang, dateKey) + (lang === 'da' ? ' Tal fra i går ved vadestedet: ' : ' Yesterday’s figures at the ford: ');
    const user = fakta + (stille ? (lang === 'da' ? 'ingen hændelser. Stilheden er historien.' : 'no events. The silence is the story.') : Object.entries(numbers).map(([k, v]) => `${k}: ${v}`).join(', ')) + '.';
    const r = await withQuota(env.DB, 'edition', dateKey, quotaLimit(env, 'edition'), lang, () => runJson(env, { system, user, schema: SCHEMA, lang, maxTokens: 900, log }));
    // Talvagt: sætninger med tal, der ikke står i FAKTA, fjernes. Bliver en artikel tom, forkastes udgaven (Cron prøver igen næste time).
    const tilladt = tilladteTal(user, '1236'), siden = aarSiden(dateKey);
    let fjernet = 0;
    const rens = p => { const t = rensTal(p.title, tilladt, siden), b = rensTal(p.body, tilladt, siden); fjernet += t.fjernet + b.fjernet; return { title: t.tekst, body: b.tekst }; };
    const lead = rens(r.data.lead), notice = rens(r.data.notice), ad = rens(r.data.ad);
    if (!lead.title || lead.body.length < 20 || !notice.title || notice.body.length < 15 || !ad.title || ad.body.length < 10) throw new ApiError('invalid_numbers', 'edition used numbers outside FACTS', 503, 3600);
    if (fjernet) log({ event: 'edition_numbers_removed', lang, dateKey, sentences: fjernet });
    const udland = await udlandsrubrik(env, lang, dateKey, log); // runde 12: Web Search API, kun når den er slået til
    const body = { lead, notice, ad, numbers: stille ? null : numbers, ...(udland ? { udland } : {}) };
    await env.DB.batch([
      env.DB.prepare('INSERT OR REPLACE INTO daily_editions (date_key, language, status, body_json, source, published_at) VALUES (?, ?, ?, ?, ?, ?)').bind(dateKey, lang, 'published', JSON.stringify(body), 'ai', new Date().toISOString()),
      env.DB.prepare('UPDATE generation_jobs SET state = ?, lease_until = 0 WHERE cache_key = ?').bind('done', cacheKey),
    ]);
    log({ event: 'edition_published', lang, dateKey, model: r.model, ms: r.ms });
    return 'published';
  } catch (e) {
    await env.DB.prepare('UPDATE generation_jobs SET state = ?, error_code = ?, lease_until = 0 WHERE cache_key = ?').bind('failed', (e && e.code) || 'error', cacheKey).run();
    log({ event: 'edition_failed', lang, dateKey, code: e && e.code, error: String(e && e.message).slice(0, 160) });
    return 'failed';
  }
}
export async function bumpEvent(db, type, dateKey = cphDateKey()) {
  await db.prepare('INSERT INTO event_totals (day_key, event_type, count) VALUES (?, ?, 1) ON CONFLICT(day_key, event_type) DO UPDATE SET count = count + 1').bind(dateKey, type).run();
}

/** Admin (kun med gyldig Cloudflare Access-login): GET → alle trykte udgaver på begge sprog; POST {date, lang, handling: 'slet'}
 *  → sletter én udgave og rydder avisens cache. Slettes dagens udgave, trykker Cron en ny ved næste kørsel. */
export async function adminAviser(request, env, ctx, rå) {
  const hvem = await verificerAccess(request, env);
  if (!hvem) throw new ApiError('forbidden', 'Kun for tingets administrator.', 403);
  if (request.method === 'GET') {
    const r = await env.DB.prepare("SELECT date_key AS date, language AS lang, json_extract(body_json, '$.lead.title') AS title, source, published_at FROM daily_editions WHERE status = 'published' ORDER BY date_key DESC, language LIMIT 400").all();
    return ok({ udgaver: r.results || [], idag: cphDateKey(), admin: hvem.email }, 'server');
  }
  const body = await readJson(request, 512);
  const dato = String(body.date || ''), lang = body.lang === 'en' ? 'en' : body.lang === 'da' ? 'da' : null;
  if (!DATO.test(dato) || !lang) throw new ApiError('bad_request', 'Ugyldig dato eller sprog.', 400);
  if (body.handling !== 'slet') throw new ApiError('bad_request', 'Ukendt handling.', 400);
  const r = await env.DB.prepare('DELETE FROM daily_editions WHERE date_key = ? AND language = ?').bind(dato, lang).run();
  if (!r.meta || !r.meta.changes) throw new ApiError('not_found', 'Udgaven findes ikke.', 404);
  ctx.log({ event: 'avis_admin', date: dato, lang, handling: 'slet', admin: hvem.email });
  await invalider(rå, [`${TAGS.avis}-${lang}`], ctx.log);
  return ok({ date: dato, lang, handling: 'slet', genoptrykkes: dato === cphDateKey() }, 'server');
}
