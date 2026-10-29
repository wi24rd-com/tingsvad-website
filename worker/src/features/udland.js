// Udlandsrubrikken i Tingsvad Tidende (runde 12): én gang i døgnet, når Cron trykker avisen, henter Workeren et par
// rigtige overskrifter med Web Search API (env.AI.websearch via AI Gateway) og lader tekstmodellen omskrive tre af dem
// til Tingsvad-sprog. Kilden og linket kommer fra søgningen, aldrig fra modellen. Kun glædelige nyheder: søgningen beder
// om gode nyheder, en ordliste sorterer alvorlige emner fra, før modellen ser noget, og modellen skal markere hver nyhed
// som rent positiv; alt andet kasseres (også hvis omskrivningen selv rammer ordlisten). Slået til med var WEBSEARCH_ENABLED = "true" (kræver AI Gateway-kredit).
import { runJson } from '../lib/ai.js';
import { withQuota } from '../lib/quota.js';

export const websearchEnabled = env => env.WEBSEARCH_ENABLED === 'true' && !!env.AI && typeof env.AI.websearch === 'function' && !!(env.AI_GATEWAY_ID || '').trim();
const ALVOR = /\b(d(ø|o)d|dræb|dræbt|krig|angreb|terror|ulykke|skud|skyd|voldtægt|overgreb|misbrug|selvmord|katastrofe|syg|sygdom|kræft|virus|epidemi|pandemi|brand|oversvøm|storm|orkan|jordskælv|tørke|sult|fattig|krise|konkurs|fyre|fyring|strejke|protest|anholdt|sigtet|dømt|retssag|politi|svindel|tyveri|stjål|savnet|såret|hospital|indlagt|valg|regering|minister|præsident|parti|inflation|dead|death|died|dies|dying|kill|killed|war\b|wars\b|attack|terror|shooting|shot|crash|murder|abuse|suicide|disaster|victim|hostage|bomb|ill\b|illness|disease|cancer|virus|outbreak|pandemic|fire\b|wildfire|flood|storm|hurricane|earthquake|drought|famine|poverty|crisis|bankrupt|layoff|laid off|strike\b|protest|arrest|charged|convicted|trial\b|court\b|police|fraud|theft|stolen|missing|injur|hospital|election|government|minister|president|senator|congress|parliament|tariff|inflation|lawsuit|sued|scandal)/i;
export const SPOERGSMAAL = { da: 'gode nyheder i dag glædelige historier dyr natur opfindelser rekord Danmark', en: 'good news today uplifting heartwarming stories animals nature discoveries kindness' };

/** Sorterer søgeresultater: kun https-links, ingen alvorlige emner, højst ét pr. domæne, højst tre. Ren funktion (testes). */
export function vaelgEmner(items) {
  const set = new Set(), ud = [];
  for (const it of Array.isArray(items) ? items : []) {
    const titel = String(it && it.title || '').trim(), url = String(it && it.url || '');
    if (!titel || titel.length < 12 || !/^https:\/\/[^\s]+$/.test(url) || ALVOR.test(titel + ' ' + (it.description || ''))) continue;
    let dom; try { dom = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { continue; }
    if (set.has(dom)) continue; set.add(dom);
    ud.push({ titel: titel.slice(0, 140), url, kilde: dom });
    if (ud.length === 3) break;
  }
  return ud;
}
/** Kun emner, som modellen har vurderet som rent positive, og som findes i søgeresultatet. Ren funktion (testes). */
export const vaelgPositive = (items, emner) => (Array.isArray(items) ? items : []).filter(x => x && x.positiv === true && emner[x.i] && !ALVOR.test(String(x.titel || '') + ' ' + String(x.kommentar || '')));
const SCHEMA = { type: 'object', required: ['items'], properties: { items: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', required: ['i', 'positiv', 'titel', 'kommentar'], properties: { i: { type: 'integer', minimum: 0, maximum: 2 }, positiv: { type: 'boolean' }, titel: { type: 'string', minLength: 5, maxLength: 90 }, kommentar: { type: 'string', minLength: 10, maxLength: 170 } } } } } };

/** Returnerer [{titel, kommentar, kilde, url}] eller null. Fejler aldrig avisen. */
export async function udlandsrubrik(env, lang, dateKey, log) {
  if (!websearchEnabled(env)) return null;
  try {
    return await withQuota(env.DB, 'websearch', dateKey, 2, lang, async () => {
      const r = await env.AI.websearch({ gatewayId: env.AI_GATEWAY_ID.trim(), query: SPOERGSMAAL[lang], limit: 8 });
      const j = await r.json();
      const emner = vaelgEmner(j && j.items);
      if (!emner.length) return null;
      const system = lang === 'da'
        ? 'Du er udlandsredaktør på Tingsvad Tidende, en dagsavis ved et vadested, hvor tinget har udsat sagen om koen siden 980. Du får rigtige overskrifter fra omverdenen. Omskriv hver til en kort Tingsvad-overskrift og én tør kommentar om, hvordan tinget ser på sagen (fx at den er udsat, sendt til Mímir eller noteret af Gudrun). Rubrikken bringer kun glædelige nyheder: sæt positiv til true, kun hvis nyheden er rent god og opmuntrende (fx dyr, natur, opfindelser, rekorder, venlighed), og til false ved alt, der handler om sygdom, ulykker, konflikt, kriminalitet, politik, penge eller nogen, der har det svært. Gør aldrig nyheden til noget andet, end den er, opfind ingen tal eller fakta, og gør aldrig grin med mennesker. Svar kun med JSON: {"items":[{"i":0,"positiv":true,"titel":"...","kommentar":"..."}]}'
        : 'You are the foreign editor of Tingsvad Tidende, a daily paper by a ford where the thing has adjourned the cow case since 980. You get real headlines from the outside world. Rewrite each as a short Tingsvad headline and one dry comment on how the thing sees it (e.g. adjourned, sent to Mímir, noted by Gudrun). The column only carries happy news: set positiv to true only if the story is purely good and uplifting (e.g. animals, nature, inventions, records, kindness), and false for anything about illness, accidents, conflict, crime, politics, money or anyone having a hard time. Never change what the news is, invent no numbers or facts, and never mock people. Answer only with JSON: {"items":[{"i":0,"positiv":true,"titel":"...","kommentar":"..."}]}';
      const user = emner.map((e, i) => `${i}: ${e.titel} (${e.kilde})`).join('\n');
      const out = await runJson(env, { system, user, schema: SCHEMA, lang, maxTokens: 500, log });
      const brugt = new Set();
      const ud = vaelgPositive(out.data.items, emner).filter(x => !brugt.has(x.i) && brugt.add(x.i)).map(x => ({ titel: x.titel, kommentar: x.kommentar, kilde: emner[x.i].kilde, url: emner[x.i].url }));
      log && log({ event: 'udland_ok', lang, dateKey, n: ud.length });
      return ud.length ? ud : null;
    });
  } catch (e) { log && log({ event: 'udland_failed', lang, dateKey, error: String(e && e.message).slice(0, 120) }); return null; }
}
