// Spørg arkivet (runde 10, trin 4b): Mímir svarer ud fra hele sitet med kildelinks – Cloudflare AI Search med indbygget lager.
// Indhold: sitets egne Markdown-udgaver (/<sti>/index.md fra Pages-middlewaren), én instans pr. sprog (<ARKIV_INSTANS>-da/-en),
// én fil pr. side (nøgle = revisionens side-id, fx historien-da.md). Ingen crawl og ingen gåde-løsninger: de står kun i Workeren.
// Synk: én gang i døgnet fra Cron (efter kl. 07); kun sider, hvis SHA-256 har ændret sig, uploades (sparer ingestion-tokens).
// Forespørgsler: AI Search fakturerer fra 1. november 2026 med 1.000 semantiske forespørgsler om måneden inkluderet →
// hård døgnkvote (ARKIV_PER_DAY, standard 25) i D1 og rate limit pr. gæst. Mímir formulerer svaret med tekstmodellen (egen kvote).
import { ok, ApiError, readJson, langOf, msg } from '../lib/http.js';
import { str } from '../lib/validate.js';
import { runJson } from '../lib/ai.js';
import { withQuota, quotaLimit, rateLimitEnv, reserve, commit, release, rateLimitSession } from '../lib/quota.js';
import { systemBase, persona } from '../lib/canon.js';
import { cphDateKey, cphHour } from '../lib/dates.js';
import { sha256Hex } from '../lib/crypto.js';
import { search as vectorizeSoeg, archiveEnabled } from '../lib/archive.js';
import { revisionsliste } from './revision.js';
import { tael } from '../lib/tael.js';

export const arkivEnabled = env => !!(env.AI_SEARCH && typeof env.AI_SEARCH.get === 'function');
export const instansNavn = (env, lang) => `${env.ARKIV_INSTANS || 'tingsvad-arkiv'}-${lang === 'en' ? 'en' : 'da'}`;
const KV_NOEGLE = 'arkiv:filer:v1';
const UDELAD = env => new Set(String(env.ARKIV_UDELAD || '').split(',').map(s => s.trim()).filter(Boolean));
const perDag = env => { const n = parseInt(env.ARKIV_PER_DAY || '25', 10); return Number.isFinite(n) && n >= 0 ? n : 25; };

/** Siderne i arkivet: revisionens sideliste (begge sprog), minus ARKIV_UDELAD. */
export function arkivSider(env) {
  const ud = UDELAD(env);
  return revisionsliste().filter(p => !ud.has(p.side)).map(p => ({ side: p.side, path: p.path, lang: p.side.endsWith('-en') ? 'en' : 'da', noegle: `${p.side}.md` }));
}
/** Titlen fra Markdown-udgavens frontmatter (uden » · Tingsvad«). */
export function mdTitel(md) { const m = String(md).match(/^title:\s*"([^"]*)"/m); return m ? m[1].replace(/\s*·\s*Tingsvad\s*$/, '') : ''; }

async function sikrInstans(env, lang) {
  const id = instansNavn(env, lang);
  try { await env.AI_SEARCH.create({ id }); } catch (e) { if (!/exist|already|409|conflict/i.test(String(e && e.message))) throw e; }
  return env.AI_SEARCH.get(id);
}

/** Synkroniserer arkivet. Returnerer {uploadet, uaendret, fejl}. Kaldes fra Cron; max ARKIV_SYNK_MAX uploads pr. kørsel. */
export async function synkArkiv(env, log, { tving = false } = {}) {
  if (!arkivEnabled(env) || !env.SAGER) return { status: 'off' };
  const origin = env.SITE_ORIGIN || 'https://tingsvad.dk';
  const kort = (await env.SAGER.get(KV_NOEGLE, 'json')) || {};
  const instanser = {};
  let uploadet = 0, uaendret = 0; const fejl = [];
  const max = parseInt(env.ARKIV_SYNK_MAX || '40', 10) || 40;
  for (const s of arkivSider(env)) {
    if (uploadet >= max) break;
    try {
      const r = await fetch(`${origin}${s.path}index.md`, { headers: { accept: 'text/markdown', 'user-agent': 'tingsvad-arkivet/1 (Mímir)' } });
      if (!r.ok || !(r.headers.get('content-type') || '').includes('markdown')) { await r.body?.cancel(); fejl.push(`${s.side}:${r.status}`); continue; }
      const md = await r.text(), hash = await sha256Hex(md);
      const før = kort[s.noegle];
      if (!tving && før && før.hash === hash) { uaendret++; continue; }
      const inst = instanser[s.lang] || (instanser[s.lang] = await sikrInstans(env, s.lang));
      if (før && før.id) { try { await inst.items.delete(før.id); } catch (e) { } } // samme nøgle igen: den gamle udgave fjernes først
      const item = await inst.items.upload(s.noegle, md);
      kort[s.noegle] = { hash, id: item && item.id, titel: mdTitel(md), path: s.path, t: new Date().toISOString() };
      uploadet++;
    } catch (e) { fejl.push(`${s.side}:${String(e && e.message).slice(0, 60)}`); }
  }
  await env.SAGER.put(KV_NOEGLE, JSON.stringify(kort));
  log && log({ event: 'arkiv_synk', uploadet, uaendret, fejl: fejl.length });
  if (uploadet) tael(env, 'haendelse', 'arkiv-synk', { antal: uploadet });
  return { status: 'ok', uploadet, uaendret, fejl };
}

/** Kaldes af Cron hver time; synker én gang pr. dato fra kl. 07 lokal tid. */
export async function cronArkiv(env, log, dateKey = cphDateKey(), hour = cphHour()) {
  if (!arkivEnabled(env) || !env.SAGER || hour < 7) return 'skipped';
  const k = 'arkiv:synk:' + dateKey;
  if (await env.SAGER.get(k)) return 'done';
  await env.SAGER.put(k, '1', { expirationTtl: 3 * 86400 });
  return synkArkiv(env, log);
}

/** Rens en chunk: frontmatter og Markdown-støj væk, mellemrum samlet. */
export const renChunk = t => String(t || '').replace(/^---[\s\S]*?---\s*/, '').replace(/[#*_|>`]+/g, ' ').replace(/\s+/g, ' ').trim();
/** Udsnit omkring det første spørgeord (≥ 4 tegn), der findes i teksten; ellers begyndelsen. */
export function udsnit(tekst, q, n = 320) {
  const t = String(tekst || ''); if (t.length <= n) return t;
  const ord = String(q || '').toLowerCase().match(/[\p{L}\d]{4,}/gu) || [];
  const lav = t.toLowerCase(); let i = -1;
  for (const o of ord) { const j = lav.indexOf(o.slice(0, Math.max(4, o.length - 2))); if (j >= 0 && (i < 0 || j < i)) i = j; }
  if (i < 0) return t.slice(0, n).replace(/\s\S*$/, '') + ' …';
  const a = Math.max(0, i - Math.floor(n / 3)), b = Math.min(t.length, a + n);
  return (a > 0 ? '… ' : '') + t.slice(a, b).replace(/^\S*\s/, a > 0 ? '' : '$&').replace(/\s\S*$/, b < t.length ? '' : '$&') + (b < t.length ? ' …' : '');
}

const SCHEMA = { type: 'object', required: ['svar', 'kilder'], properties: { svar: { type: 'string', minLength: 10, maxLength: 600 }, kilder: { type: 'array', maxItems: 5, items: { type: 'integer', minimum: 1, maximum: 5 } } } };

/** Kernen: søg i AI Search (+ evt. det håndbyggede Vectorize-arkiv til sammenligning), lad Mímir svare. Bruges af API og MCP. */
export async function spoergKerne(env, q, lang, { sammenlign = false, log } = {}) {
  if (!arkivEnabled(env)) throw new ApiError('not_configured', msg(lang, 'notconf'), 503);
  const kort = (env.SAGER && (await env.SAGER.get(KV_NOEGLE, 'json'))) || {};
  const t0 = Date.now();
  const res = await reserve(env.DB, 'arkiv', cphDateKey(), perDag(env), lang);
  let r;
  try { r = await env.AI_SEARCH.get(instansNavn(env, lang)).search({ query: q, ai_search_options: { retrieval: { max_num_results: 5 } } }); await commit(env.DB, res); }
  catch (e) {
    await release(env.DB, res).catch(() => { });
    log && log({ event: 'arkiv_search_failed', error: String(e && e.message).slice(0, 160) });
    throw new ApiError('busy', lang === 'da' ? 'Arkivet er ved at blive sat på hylderne. Prøv igen senere.' : 'The archive is being shelved. Try again later.', 503, 600);
  }
  const msSoeg = Date.now() - t0;
  const kilder = (r && r.chunks || []).map(c => {
    const noegle = c.item && c.item.key || '', k = kort[noegle] || {};
    const fuld = renChunk(c.text);
    return { titel: k.titel || noegle.replace(/\.md$/, ''), url: 'https://tingsvad.dk' + (k.path || '/'), fuld, uddrag: udsnit(fuld, q), score: Math.round((c.score || 0) * 100) / 100 };
  }).filter(k => k.fuld).slice(0, 5);
  let svar = null, model = null, msModel = 0;
  if (kilder.length && env.AI && env.DB) {
    const system = systemBase(lang) + '\n' + persona('brian', lang) + '\n' + (lang === 'da'
      ? 'Du er Mímir, arkivaren. Svar på gæstens spørgsmål i 2–4 korte sætninger UDELUKKENDE ud fra de nummererede uddrag. Står svaret ikke i uddragene, så sig det tørt. Opfind ingen fakta, tal eller navne. Angiv numrene på de uddrag, du brugte. Svar kun med JSON: {"svar":"...","kilder":[1]}'
      : 'You are Mímir, the archivist. Answer the guest’s question in 2–4 short sentences ONLY from the numbered excerpts. If the answer is not in them, say so dryly. Invent no facts, numbers or names. Give the numbers of the excerpts you used. Answer only with JSON: {"svar":"...","kilder":[1]}');
    const user = `${lang === 'da' ? 'Spørgsmål' : 'Question'}: ${q}\n\n` + kilder.map((k, i) => `[${i + 1}] ${k.titel}: ${k.fuld.slice(0, 1800)}`).join('\n\n');
    try {
      const out = await withQuota(env.DB, 'text', cphDateKey(), quotaLimit(env, 'text'), lang, () => runJson(env, { system, user, schema: SCHEMA, maxTokens: 320, lang, log }));
      svar = out.data.svar; model = out.model; msModel = out.ms;
      const brugt = new Set(out.data.kilder || []); kilder.forEach((k, i) => { k.brugt = brugt.has(i + 1); });
    } catch (e) { log && log({ event: 'arkiv_brian_tavs', error: String(e && e.message).slice(0, 120) }); }
  }
  let haandbygget = null, msVectorize = 0;
  if (sammenlign && archiveEnabled(env)) { const t1 = Date.now(); haandbygget = (await vectorizeSoeg(env, q, lang, log, 4)).map(u => ({ kilde: u.source, uddrag: u.text.slice(0, 300), score: u.score })); msVectorize = Date.now() - t1; }
  tael(env, 'haendelse', 'arkiv-spoergsmaal', { lang });
  kilder.forEach(k => { delete k.fuld; });
  return { q, svar, kilder, haandbygget, model, ms: { aiSearch: msSoeg, model: msModel, vectorize: msVectorize }, instans: instansNavn(env, lang) };
}

/** POST arkiv/spoerg {q, lang, sammenlign} */
export async function spoergArkivet(request, env, ctx) {
  const body = await readJson(request, 2048);
  const lang = langOf(body.lang);
  const q = str(body.q, { min: 3, max: 200, name: 'q', lang });
  await rateLimitSession(env, 'arkiv', ctx.session, 4, lang, { strict: true });
  const d = await spoergKerne(env, q, lang, { sammenlign: !!body.sammenlign, log: ctx.log });
  return ok(d, d.svar ? 'ai' : 'server');
}

/** GET arkiv → status: hvor mange sider er indekseret, hvornår. */
export async function arkivStatus(request, env, ctx) {
  const kort = (env.SAGER && (await env.SAGER.get(KV_NOEGLE, 'json'))) || {};
  const v = Object.values(kort);
  return ok({ aktiv: arkivEnabled(env), sider: v.length, senest: v.map(x => x.t).sort().pop() || null, perDag: perDag(env) }, 'server');
}
