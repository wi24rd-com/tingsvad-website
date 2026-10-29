// Nødøvelser (runde 9): tydeligt mærkede simulationer. Hver øvelse kører den RIGTIGE kode (timeout-indpakningen, kø-forbrugeren,
// afstemningens logik) mod falske tjenester i hukommelsen. Ingen bindings bruges, intet i produktionen påvirkes, og intet flag kan
// få et rigtigt endpoint til at fejle. Svaret mærkes source:"simulation".
import { ok, ApiError, readJson, langOf } from '../lib/http.js';
import { rateLimitEnv } from '../lib/quota.js';
import { withTimeout } from '../lib/ai.js';
import { ravnQueue } from './ravn.js';
import * as L from '../lib/roomlogic.js';

const TXT = {
  da: {
    timeout: { titel: 'Maskinen svarer ikke', mål: 'En falsk sprogmodel er sat til at bruge 2,5 sekunder; Workerens grænse er her 1 sekund.', start: 'Spørgsmålet sendes til den falske model.', grænse: 'Grænsen nås. Kaldet afbrydes med koden {code} efter {ms} ms.', fallback: 'Svaret bliver det mærkede redaktionelle eksempel, og gæsten får 503 med retryAfter – aldrig 502.', konk: 'Ingen hænger i en evig ventetilstand. Tinget udsætter, som det plejer, men med en årsag.' },
    dublet: { titel: 'Ravnen leveres to gange', mål: 'Køen leverer mindst én gang. Her leveres den samme besked to gange til den rigtige kø-forbruger, og Workflows er en falsk tæller.', lev: 'Levering {n}: Workflow-instans {id} – {res}.', oprettet: 'oprettet', findes: 'findes allerede, beskeden kvitteres', konk: 'To leveringer, én instans, to kvitteringer. Det faste navn ravn-<job>-<forsøg> gør dobbeltleveringen ufarlig.' },
    reconnect: { titel: 'Forbindelsen ryger midt i afstemningen', mål: 'Den rigtige afstemningslogik køres i hukommelsen: en gæst tager plads 3, stemmer, mister forbindelsen og kommer tilbage.', join: 'Gæsten tager plads 3.', stem: 'Gæsten stemmer »{v}«. Stemmer i alt: {n}.', tabt: 'Forbindelsen ryger. Pladsen holdes; stemmen bliver stående.', igen: 'Gæsten forbinder igen og beder om en plads: {res}.', stem2: 'Gæsten forsøger at stemme igen: {res}.', konk: 'Samme gæst, samme plads, én stemme. Reconnect giver ikke en ekstra stemme.' },
  },
  en: {
    timeout: { titel: 'The machine does not answer', mål: 'A fake language model is set to take 2.5 seconds; the Worker’s limit here is 1 second.', start: 'The question is sent to the fake model.', grænse: 'The limit is reached. The call is aborted with code {code} after {ms} ms.', fallback: 'The answer becomes the labelled editorial example, and the guest gets 503 with retryAfter – never 502.', konk: 'Nobody is left waiting forever. The thing adjourns, as usual, but with a reason.' },
    dublet: { titel: 'The raven is delivered twice', mål: 'The queue delivers at least once. Here the same message is delivered twice to the real queue consumer, and Workflows is a fake counter.', lev: 'Delivery {n}: Workflow instance {id} – {res}.', oprettet: 'created', findes: 'already exists, message acknowledged', konk: 'Two deliveries, one instance, two acknowledgements. The fixed name ravn-<job>-<attempt> makes the duplicate harmless.' },
    reconnect: { titel: 'The connection drops in the middle of the vote', mål: 'The real voting logic runs in memory: a guest takes seat 3, votes, loses the connection and comes back.', join: 'The guest takes seat 3.', stem: 'The guest votes “{v}”. Votes in total: {n}.', tabt: 'The connection drops. The seat is kept; the vote stands.', igen: 'The guest reconnects and asks for a seat: {res}.', stem2: 'The guest tries to vote again: {res}.', konk: 'Same guest, same seat, one vote. A reconnect does not give an extra vote.' },
  },
};
const f = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));

export async function koerOevelse(kind, lang) {
  const t = TXT[lang][kind], trin = [], t0 = Date.now(), log = (tekst, status = 'ok') => trin.push({ ms: Date.now() - t0, tekst, status });
  if (!t) throw new ApiError('bad_request', 'unknown drill', 400);
  log(t.mål, 'info');
  if (kind === 'timeout') {
    const falskModel = new Promise(res => setTimeout(() => res({ response: 'for sent' }), 2500));
    log(t.start);
    try { await withTimeout(falskModel, 1000); log('?', 'fejl'); }
    catch (e) { log(f(t.grænse, { code: e.code || 'timeout', ms: Date.now() - t0 }), 'advarsel'); log(t.fallback); }
  } else if (kind === 'dublet') {
    const lavet = new Set();
    const env = { RAVN: { async create({ id }) { if (lavet.has(id)) throw new Error('instance already exists'); lavet.add(id); } } };
    const id = 'R-20261026-D0B1E7', besked = n => ({ body: { id, attempt: 0 }, attempts: n, ack() { this.acked = true; }, retry() { this.retried = true; } });
    for (const n of [1, 2]) {
      const m = besked(n), før = lavet.size;
      await ravnQueue({ messages: [m] }, env, () => {});
      log(f(t.lev, { n, id: `ravn-${id}-0`, res: lavet.size > før ? t.oprettet : t.findes }), m.acked ? 'ok' : 'fejl');
    }
  } else if (kind === 'reconnect') {
    const st = L.freshState(1), now = Date.now(), owner = 'f'.repeat(32);
    L.join(st, owner, 3, now, 30_000); log(t.join);
    L.vote(st, owner, 'eventuelt', now + 500); log(f(t.stem, { v: lang === 'da' ? 'Eventuelt' : 'Any other business', n: st.votes.ja + st.votes.nej + st.votes.eventuelt }));
    L.leave(st, owner); log(t.tabt, 'advarsel');
    const r = L.join(st, owner, 5, now + 2000, 30_000); log(f(t.igen, { res: r.ok ? (lang === 'da' ? `plads ${r.slot}` : `seat ${r.slot}`) + (r.already ? (lang === 'da' ? ' (den samme)' : ' (the same)') : '') : r.code }));
    const v = L.vote(st, owner, 'ja', now + 2500); log(f(t.stem2, { res: v.ok ? 'ok' : v.code }), v.ok ? 'fejl' : 'ok');
  }
  log(t.konk, 'konklusion');
  return { kind, titel: t.titel, trin };
}

/** POST oevelse {kind, lang} */
export async function oevelse(request, env, ctx) {
  const body = await readJson(request, 512), lang = langOf(body.lang);
  if (!['timeout', 'dublet', 'reconnect'].includes(body.kind)) throw new ApiError('bad_request', 'unknown drill', 400);
  await rateLimitEnv(env, 'oevelse', ctx.session.ownerHash, 6, lang);
  return ok(await koerOevelse(body.kind, lang), 'simulation');
}
