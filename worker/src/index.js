// tingsvad-ting-ai — Worker bag /api/ting-ai/*. Tingets maskinpark (C01–C08) i Tingsvads univers.
// Router + session + fejlkontrakt. Features ligger i ./features, fælles lag i ./lib.
import { ok, fail, ApiError, msg, requestId } from './lib/http.js';
import { getSession, withCookie } from './lib/session.js';
import { rumNavn } from './lib/rum.js';
import { court } from './features/court.js';
import { vision } from './features/vision.js';
import { guide } from './features/guide.js';
import { getNews, getNewsArkiv, publishEdition, adminAviser } from './features/news.js';
import { forge, forgeStatus, forgeImage } from './features/forge.js';
import { createJob, getJob } from './features/jobs.js';
import { getRadio, getRadioAudio, publishRadio } from './features/radio.js';
import { ogSag, pdfProtokol, renderEnabled } from './features/render.js';
import { forgeQueue } from './features/forge.js';
import { archiveEnabled } from './lib/archive.js';
import { turnstileEnabled } from './lib/turnstile.js';
import { cphDateKey, cphHour } from './lib/dates.js';
import { sweep as sweepQuota } from './lib/quota.js';
import { sweep as sweepIdem } from './lib/idempotency.js';
import { timer, instrument, medTiming } from './lib/timing.js';
export { TingRoom } from './room.js';
export { ChairRoom } from './chair.js';
export { RadioStation } from './radiostation.js';
export { EuSkab } from './euskab.js';
export { TingMcp } from './mcp-entry.js';
import { soeg as hittegodsSoeg, hittegodsEnabled } from './features/hittegods.js';
import { oevelse } from './features/oevelse.js';
import { modtagBrev, getRavnepost, adminRavnepost } from './features/ravnepost.js';
export { ChairCaseWorkflow, RavnWorkflow, RevisionWorkflow } from './workflow.js';
import { bestil as ravnBestil, status as ravnStatus, fil as ravnFil, igen as ravnIgen, ravnQueue, ravnEnabled } from './features/ravn.js';
import { getRevision, revisionBillede, startRevision, revisionEnabled } from './features/revision.js';
import { githubEnabled, issueWebhook } from './features/gudrun-github.js';
import { arkivEnabled, spoergArkivet, arkivStatus, cronArkiv } from './features/arkiv.js';
import { getTaelle } from './features/taelle.js';
import { getTopologi } from './features/topologi.js';
import { signerBevis, tjekBevis, bevisNoegle, bevisEnabled } from './features/bevis.js';
import { liveStatus, liveLyt, liveSvar, liveKilde, liveEnabled } from './features/liveradio.js';
import { websearchEnabled } from './features/udland.js';
import { tael, apiNavn, statusKlasse } from '../../shared/tael.js';
import { cachebar, invalider, erOffentlig, TAGS } from './lib/kantcache.js';
import { opdaterVagt, getVaern, getCrawlere, getDoer, vagtEnabled } from './features/vagt.js';
import { opdaterHastighed, opdaterRadar, getHastighed, getDanmark, hastighedEnabled, radarEnabled } from './features/maaling.js';
import { tale } from './features/tale.js';
import { getSkab, postSegl, euEnabled } from './features/euskab.js';
import { intern as internRuter } from './features/gaestebog.js';
import { rydBesoeg } from './lib/gaestebog.js';
import { release } from '../../shared/release.js';

const PREFIX = '/api/ting-ai/';

export function configured(env) {
  const tts = (env.TTS_PROVIDER || 'none');
  return {
    ai: !!env.AI, db: !!env.DB, media: !!env.MEDIA, room: !!env.TING_ROOM, cases: !!(env.CHAIR_CASES && env.DB),
    forge: !!(env.AI && env.MEDIA && env.DB), vision_upload: env.VISION_UPLOAD_ENABLED === 'true' && !!env.AI,
    tts: tts === 'external' ? !!(env.TTS_API_KEY && env.TTS_ENDPOINT) : tts === 'workers-ai' ? !!env.AI : false, tts_danish: tts === 'external' && !!(env.TTS_API_KEY && env.TTS_ENDPOINT),
    session_secret: !!env.SESSION_SECRET, gateway: !!(env.AI_GATEWAY_ID || '').trim(), ratelimit: !!env.RL, images: !!env.IMAGES,
    archive: archiveEnabled(env), render: renderEnabled(env), queue: !!env.FORGE_QUEUE, turnstile: turnstileEnabled(env),
    ravn: ravnEnabled(env), ravn_queue: !!env.RAVN_QUEUE, revision: revisionEnabled(env), chair_room: !!env.CHAIR_ROOM, hittegods: hittegodsEnabled(env),
    taelle: !!env.TAEL, taelle_laes: !!(env.TAEL && env.ANALYTICS_SQL), github_issues: githubEnabled(env), arkiv: arkivEnabled(env),
    bevis: bevisEnabled(env), live_radio: liveEnabled(env), websearch: websearchEnabled(env), kantcache: true, vagt: vagtEnabled(env), hastighed: hastighedEnabled(env), radar: radarEnabled(env), tale: !!env.AI, eu: euEnabled(env), eu_lagre: { d1: !!env.EU_DB, kv: !!env.EU_KV, r2: !!env.EU_R2 }, dagbog: !!(env.CHAIR_ROOM || env.TING_ROOM),
  };
}

export default {
  async fetch(request, rawEnv, ctx) {
    const t = timer(), env = instrument(rawEnv, t), t0 = performance.now(); // Server-Timing til »Vis maskineriet«
    const res = await handle(request, env, ctx);
    try { // tælleværket (Analytics Engine): ét datapunkt pr. kald, uden IP eller session
      const url = new URL(request.url);
      tael(rawEnv, 'api', apiNavn(url.pathname.slice(PREFIX.length)), { lang: url.searchParams.get('lang') === 'en' ? 'en' : 'da', colo: (request.cf && request.cf.colo) || request.headers.get('x-tingsvad-colo') || '', detalje: statusKlasse(res.status), ms: performance.now() - t0 });
    } catch (e) { }
    return medTiming(res, t);
  },

  // Queues-consumer (kun når FORGE_QUEUE er konfigureret)
  async queue(batch, env, ctx) { const log = o => console.log(JSON.stringify({ queue: batch.queue, ...o })); if (batch.queue.startsWith('tingsvad-ravn')) return ravnQueue(batch, env, log); await forgeQueue(batch, env, log); },

  // Ravnepost (runde 9): Email Routing for brev@sitesite.dk sender brevene hertil.
  async email(message, env, ctx) { return modtagBrev(message, env, ctx); },

  // Cron (UTC). Dato-guard i Europe/Copenhagen; én udgave pr. dato og sprog uanset antal triggers.
  async scheduled(event, env, ctx) { return scheduled(event, env, ctx); },
};

async function handle(request, env, ctx) {
  {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIX)) return fail('not_found', 'no', 404);
    const path = url.pathname.slice(PREFIX.length).replace(/\/+$/, '');
    const rid = requestId();
    const log = o => console.log(JSON.stringify({ requestId: rid, path, ...o }));
    const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'da';
    let session;
    try {
      session = await getSession(request, env); // health sætter også sessionscookien, så WebSocket-forbindelsen har en ejer
      if (path === 'health') return withCookie(ok({ configured: configured(env), date: cphDateKey(), miljoe: env.MILJOE || 'production', release: release(env) }, 'server'), session);
      if (!env.DB) return withCookie(fail('not_configured', msg(lang, 'notconf'), 503), session);
      const c = { session, log, waitUntil: p => ctx.waitUntil(p.catch(e => log({ event: 'background_error', error: String(e && e.message).slice(0, 120) }))) };
      const m = request.method;
      let res;
      if (path.startsWith('intern/')) res = await internRuter(request, env, c, path, lang); // runde 13: gæstebog/tællere i D1, kun via service binding
      else if (path === 'court' && m === 'POST') res = await court(request, env, c);
      else if (path === 'vision' && m === 'POST') res = await vision(request, env, c);
      else if (path === 'guide' && m === 'POST') res = await guide(request, env, c);
      else if (path === 'news' && m === 'GET') res = await cachebar(request, await getNews(request, env, c), { maxAge: 300, swr: 3600, tags: [TAGS.avis, `${TAGS.avis}-${lang}`] });
      else if (path === 'news/arkiv' && m === 'GET') res = await cachebar(request, await getNewsArkiv(request, env, c), { maxAge: 300, swr: 3600, tags: [TAGS.avis, `${TAGS.avis}-${lang}`] });
      else if (path === 'forge' && m === 'POST') res = await forge(request, env, c);
      else if (path.startsWith('forge/image/') && m === 'GET') res = await forgeImage(request, env, c, path.slice(12));
      else if (path.startsWith('forge/') && m === 'GET') res = await forgeStatus(request, env, c, path.slice(6));
      else if (path === 'jobs' && m === 'POST') res = await createJob(request, env, c);
      else if (path.startsWith('jobs/') && m === 'GET') res = await getJob(request, env, c, path.slice(5));
      else if (path === 'radio' && m === 'GET') res = await cachebar(request, await getRadio(request, env, c), { maxAge: 300, swr: 3600, tags: [TAGS.radio, `${TAGS.radio}-${lang}`] });
      else if (path === 'radio/live' && m === 'GET') res = await liveStatus(request, env, c);
      else if (path === 'radio/live/lyt' && m === 'POST') res = await liveLyt(request, env, c);
      else if (path === 'radio/live/svar' && m === 'POST') res = await liveSvar(request, env, c);
      else if (path === 'radio/live/kilde' && m === 'GET') res = await liveKilde(request, env, c);
      else if (path.startsWith('radio/audio/') && m === 'GET') { const [d, l] = path.slice(12).split('/'); res = await getRadioAudio(request, env, c, d, l); }
      else if (path === 'room/ws' && m === 'GET') res = await roomWs(request, env, session, lang);
      else if (path === 'stol/ws' && m === 'GET') res = await stolWs(request, env, session, lang);
      else if (path === 'vaern' && m === 'GET') res = await cachebar(request, await getVaern(request, env, lang), { maxAge: 600, swr: 3600, tags: [TAGS.vagt] });
      else if (path === 'crawlere' && m === 'GET') res = await cachebar(request, await getCrawlere(request, env, lang), { maxAge: 600, swr: 3600, tags: [TAGS.vagt] });
      else if (path === 'doeren' && m === 'GET') res = await cachebar(request, await getDoer(request, env, lang), { maxAge: 600, swr: 3600, tags: [TAGS.vagt] });
      else if (path === 'hastighed' && m === 'GET') res = await cachebar(request, await getHastighed(request, env, lang), { maxAge: 600, swr: 3600, tags: [TAGS.vagt] });
      else if (path === 'danmark' && m === 'GET') res = await cachebar(request, await getDanmark(request, env, lang), { maxAge: 600, swr: 3600, tags: [TAGS.vagt] });
      else if (path === 'court/tale' && m === 'POST') res = await tale(request, env, c);
      else if (path === 'eu/skab' && m === 'GET') res = await getSkab(request, env, c);
      else if (path === 'eu/segl' && m === 'POST') res = await postSegl(request, env, c);
      else if (path === 'stol/dagbog' && m === 'GET') res = await cachebar(request, await dagbog(env, 'stol', lang), { maxAge: 60, swr: 300, tags: [TAGS.dagbog] });
      else if (path === 'room/dagbog' && m === 'GET') { const rum = rumNavn(url.searchParams.get('room')); res = rum ? await cachebar(request, await dagbog(env, 'room', lang, rum), { maxAge: 60, swr: 300, tags: [TAGS.dagbog] }) : fail('not_found', 'no such room', 404); }
      else if (path === 'hittegods' && m === 'POST') res = await hittegodsSoeg(request, env, c);
      else if (path === 'oevelse' && m === 'POST') res = await oevelse(request, env, c);
      else if (path === 'ravnepost' && m === 'GET') res = await getRavnepost(request, env, c);
      else if (path === 'admin/ravnepost' && (m === 'GET' || m === 'POST')) res = await adminRavnepost(request, env, c);
      else if (path === 'admin/aviser' && (m === 'GET' || m === 'POST')) res = await adminAviser(request, env, c, ctx);
      else if (path.startsWith('og/sag/') && m === 'GET') res = await ogSag(request, env, c, path.slice(7));
      else if (path === 'pdf/protokol' && m === 'GET') res = await pdfProtokol(request, env, c);
      else if (path === 'ravn' && m === 'POST') res = await ravnBestil(request, env, c);
      else if (/^ravn\/R-[0-9]{8}-[A-F0-9]{6}$/.test(path) && m === 'GET') res = await ravnStatus(request, env, c, path.slice(5));
      else if (/^ravn\/R-[0-9]{8}-[A-F0-9]{6}\/fil$/.test(path) && m === 'GET') res = await ravnFil(request, env, c, path.slice(5, -4));
      else if (/^ravn\/R-[0-9]{8}-[A-F0-9]{6}\/igen$/.test(path) && m === 'POST') res = await ravnIgen(request, env, c, path.slice(5, -5));
      else if (path === 'revision' && m === 'GET') res = await cachebar(request, await getRevision(request, env, c), { maxAge: 120, swr: 600, tags: [TAGS.revision] });
      else if (path === 'taelle' && m === 'GET') res = await getTaelle(request, env, c);
      else if (path === 'topologi' && m === 'GET') res = await getTopologi(request, env, c); // altid målt nu: ingen kantcache
      else if (path === 'gudrun/issues' && m === 'POST') res = await issueWebhook(request, env, c, cphDateKey());
      else if (path === 'bevis' && m === 'POST') res = await signerBevis(request, env, c);
      else if (path === 'bevis/tjek' && m === 'POST') res = await tjekBevis(request, env, c);
      else if (path === 'bevis/noegle' && m === 'GET') res = await cachebar(request, await bevisNoegle(request, env, c), { maxAge: 3600, swr: 86400, tags: [TAGS.bevis] });
      else if (path === 'arkiv' && m === 'GET') res = await arkivStatus(request, env, c);
      else if (path === 'arkiv/spoerg' && m === 'POST') res = await spoergArkivet(request, env, c);
      else if (path.startsWith('revision/billede/') && m === 'GET') { const [d, sd] = path.slice(17).split('/'); res = await revisionBillede(request, env, c, d, sd); }
      else res = fail('not_found', msg(lang, 'notfound'), 404);
      if (Math.random() < 0.01) c.waitUntil(Promise.all([sweepQuota(env.DB), sweepIdem(env.DB)]));
      return res.status === 101 || erOffentlig(res) ? res : withCookie(res, session); // offentlige svar til kantens cache får aldrig en sessionscookie
    } catch (e) {
      if (e instanceof ApiError) { log({ event: 'api_error', code: e.code, status: e.status, ...(e.detail ? { detail: e.detail } : {}) }); return withCookie(fail(e.code, e.message, e.status, { retryAfter: e.retryAfter }), session); }
      log({ event: 'unhandled', error: String(e && e.stack || e).slice(0, 400) });
      return withCookie(fail('internal', msg(lang, 'provider'), 500), session);
    }
  }
}

async function scheduled(event, env, ctx) {
    const log = o => console.log(JSON.stringify({ cron: event.cron, ...o }));
    // Værnet og Crawlerne (runde 12): hver time, også om natten
    if (env.DB) {
      let ny = false;
      try { ny = (await opdaterVagt(env, log)) === 'ok'; } catch (e) { log({ event: 'vagt_failed', error: String(e && e.message).slice(0, 160) }); }
      // Hastigheden og Danmark lige nu: samme time, samme token, hver for sig (en fejl i den ene stopper ikke den anden)
      for (const [navn, fn] of [['hastighed', opdaterHastighed], ['radar', opdaterRadar]]) { try { if ((await fn(env, log)) === 'ok') ny = true; } catch (e) { log({ event: navn + '_failed', error: String(e && e.message).slice(0, 160) }); } }
      if (ny) await invalider(ctx, [TAGS.vagt], log);
    }
    if (!env.DB || env.NEWS_CRON_ENABLED === 'false') return;
    const dateKey = cphDateKey(); const hour = cphHour();
    if (hour < 5) { log({ event: 'cron_skip', reason: 'before 05:00 local', dateKey }); return; } // avisen trykkes først om morgenen
    try { const rv = await startRevision(env, log, dateKey, hour); if (rv !== 'skipped') log({ event: 'cron_revision', dateKey, result: rv }); } catch (e) { log({ event: 'cron_revision_failed', error: String(e && e.message).slice(0, 160) }); }
    try { const ar = await cronArkiv(env, log, dateKey, hour); if (ar && ar.status) log({ event: 'cron_arkiv', ...ar, fejl: (ar.fejl || []).length }); } catch (e) { log({ event: 'cron_arkiv_failed', error: String(e && e.message).slice(0, 160) }); }
    for (const lang of ['da', 'en']) {
      const r = await publishEdition(env, lang, dateKey, log);
      log({ event: 'cron_news', lang, dateKey, result: r });
      if (r === 'published' || r === 'exists') { const rr = await publishRadio(env, lang, dateKey, log); log({ event: 'cron_radio', lang, dateKey, result: rr }); if (r === 'published' || rr === 'audio' || rr === 'text') await invalider(ctx, [`${TAGS.avis}-${lang}`, `${TAGS.radio}-${lang}`], log); }
    }
    ctx.waitUntil(Promise.all([sweepQuota(env.DB), sweepIdem(env.DB), env.DB.prepare('DELETE FROM court_rounds WHERE expires_at < ?').bind(Date.now()).run(),
      rydBesoeg(env, cphDateKey(new Date(Date.now() - 2 * 86400000))).catch(() => {}), // runde 13: besøgshashes lever to døgn, som i KV
      env.DB.prepare("DELETE FROM revision_sider WHERE date_key < date('now', '-90 days')").run().catch(() => {})])); // runde 13: Revisionens rækker gemmes 90 dage
}

// Dagbogen (runde 12): SQL-statistik fra stolens og afstemningens Durable Objects. Offentlig og ens for alle, så den caches på kanten et minut (se routeren).
async function dagbog(env, hvem, lang, rum) {
  const ns = hvem === 'stol' ? env.CHAIR_ROOM : env.TING_ROOM;
  if (!ns) return fail('not_configured', msg(lang, 'notconf'), 503);
  const navn = hvem === 'stol' ? 'vadestedet' : ((rum || 'vadestedet').replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'vadestedet');
  const stub = ns.get(ns.idFromName(navn));
  const t0 = performance.now(); const data = await stub.dagbogStatistik(); const ms = performance.now() - t0;
  return ok({ ...(data || {}), objekt: hvem === 'stol' ? 'ChairRoom' : 'TingRoom', navn, ms: Math.round(ms * 10) / 10 }, 'server');
}

async function roomWs(request, env, session, lang) {
  if (!env.TING_ROOM) return fail('not_configured', msg(lang, 'notconf'), 503);
  if (request.headers.get('upgrade') !== 'websocket') return fail('bad_request', 'websocket expected', 426);
  if (session.setCookie) return fail('forbidden', 'no session; call /health first', 403); // ingen anonym ejer: samme cookie = samme plads ved reconnect
  const room = rumNavn(new URL(request.url).searchParams.get('room'));
  if (!room) return fail('not_found', msg(lang, 'notfound'), 404); // runde 13 (M4): kun kendte rum – ellers kunne enhver oprette DO'er i det uendelige
  const id = env.TING_ROOM.idFromName(room);
  const h = new Headers(request.headers); h.set('x-owner', session.ownerHash); h.set('x-lang', lang); h.delete('cookie');
  return env.TING_ROOM.get(id).fetch(new Request(request.url, { method: 'GET', headers: h }));
}

// Den fælles stol (runde 9): én global stol; kræver sessionscookie som afstemningen, så rate limiting gælder pr. gæst.
async function stolWs(request, env, session, lang) {
  if (!env.CHAIR_ROOM) return fail('not_configured', msg(lang, 'notconf'), 503);
  if (request.headers.get('upgrade') !== 'websocket') return fail('bad_request', 'websocket expected', 426);
  if (session.setCookie) return fail('forbidden', 'no session; call /health first', 403);
  const h = new Headers(request.headers); h.set('x-owner', session.ownerHash); h.delete('cookie');
  return env.CHAIR_ROOM.get(env.CHAIR_ROOM.idFromName('vadestedet')).fetch(new Request(request.url, { method: 'GET', headers: h }));
}
