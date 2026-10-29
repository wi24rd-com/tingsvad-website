// GET /api/ting-ai/taelle — Tingets tælleværk (runde 10).
// Læser Analytics Engine-datasættet `tingsvad_taelle` med Analytics SQL-bindingen (ingen API-token; kontoens scope sættes af bindingen).
// Resultatet gemmes fem minutter i isolatet, så en travl side ikke bliver til mange SQL-forespørgsler.
import { ok, fail, msg } from '../lib/http.js';

const CACHE_MS = 5 * 60 * 1000;
let gemt = null; // { t, data }

const dsNavn = env => 'events.analyticsEngine.' + (/^[a-z_]{1,48}$/.test(env.TAELLE_DATASET || '') ? env.TAELLE_DATASET : 'tingsvad_taelle');
export const sql = DS => ({
  totaler: `SELECT index1 AS art, SUM(double1) AS n FROM ${DS} WHERE timestamp >= NOW() - INTERVAL '1' DAY GROUP BY index1`,
  timer: `SELECT toStartOfHour(timestamp) AS t, index1 AS art, SUM(double1) AS n FROM ${DS} WHERE timestamp >= NOW() - INTERVAL '1' DAY AND index1 IN ('side', 'md', 'api') GROUP BY t, art ORDER BY t`,
  haendelser: `SELECT blob1 AS navn, SUM(double1) AS n FROM ${DS} WHERE timestamp >= NOW() - INTERVAL '7' DAY AND index1 = 'haendelse' GROUP BY blob1 ORDER BY n DESC LIMIT 20`,
  colos: `SELECT blob3 AS colo, SUM(double1) AS n FROM ${DS} WHERE timestamp >= NOW() - INTERVAL '1' DAY AND index1 IN ('side', 'md') AND blob3 != '' GROUP BY blob3 ORDER BY n DESC LIMIT 8`,
  api: `SELECT blob1 AS navn, SUM(double1) AS n, AVG(double2) AS ms FROM ${DS} WHERE timestamp >= NOW() - INTERVAL '1' DAY AND index1 = 'api' GROUP BY blob1 ORDER BY n DESC LIMIT 8`,
});

const heltal = v => Math.max(0, Math.round(Number(v) || 0));

/** Omformer de fem svar til det, siden tegner. Ren funktion (testes uden binding). */
export function formTaelle(svar) {
  const rk = k => (svar[k] && Array.isArray(svar[k].data) ? svar[k].data : []);
  const totaler = { side: 0, md: 0, fejl: 0, api: 0, haendelse: 0 };
  for (const r of rk('totaler')) if (r.art in totaler) totaler[r.art] = heltal(r.n);
  const pr = new Map();
  for (const r of rk('timer')) {
    const t = new Date(String(r.t).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(r.t)) ? '' : 'Z')).toISOString();
    const x = pr.get(t) || { t, side: 0, md: 0, api: 0 };
    if (r.art in x) x[r.art] = heltal(r.n);
    pr.set(t, x);
  }
  const timer = [...pr.values()].sort((a, b) => (a.t < b.t ? -1 : 1));
  const haendelser = rk('haendelser').map(r => ({ navn: String(r.navn || '').slice(0, 64), n: heltal(r.n) })).filter(r => r.navn && r.n);
  const colos = rk('colos').map(r => ({ colo: String(r.colo || '').slice(0, 4).toUpperCase(), n: heltal(r.n) })).filter(r => /^[A-Z]{3}$/.test(r.colo) && r.n);
  const api = rk('api').map(r => ({ navn: String(r.navn || '').slice(0, 32), n: heltal(r.n), ms: heltal(r.ms) })).filter(r => r.navn && r.n);
  const rows_read = Object.values(svar).reduce((a, s) => a + (s && s.statistics ? +s.statistics.rows_read || 0 : 0), 0);
  const elapsed_ms = Object.values(svar).reduce((a, s) => a + (s && s.statistics ? +s.statistics.elapsed_ms || 0 : 0), 0);
  return { totaler, timer, haendelser, colos, api, statistik: { rows_read, elapsed_ms, forespoergsler: Object.keys(svar).length } };
}

export async function getTaelle(request, env, c) {
  const lang = new URL(request.url).searchParams.get('lang') === 'en' ? 'en' : 'da';
  if (!env.TAEL) return fail('not_configured', msg(lang, 'notconf'), 503);
  if (!env.ANALYTICS_SQL || typeof env.ANALYTICS_SQL.query !== 'function') {
    // Tælleværket skriver, men kan ikke læses fra Workeren (Wrangler < 4.145 eller binding ikke sat).
    return ok({ tilstand: 'skriver', hentet: new Date().toISOString() }, 'server');
  }
  if (gemt && Date.now() - gemt.t < CACHE_MS) return ok({ ...gemt.data, gemt: true }, 'cached');
  const svar = {}, fejl = [], SQL = sql(dsNavn(env));
  await Promise.all(Object.entries(SQL).map(async ([k, query]) => {
    try { svar[k] = await env.ANALYTICS_SQL.query({ query }); }
    catch (e) { fejl.push(k); c.log({ event: 'taelle_sql_fejl', del: k, retryable: !!(e && e.retryable), error: String(e && e.message).slice(0, 160) }); }
  }));
  if (fejl.length === Object.keys(SQL).length) {
    if (gemt) return ok({ ...gemt.data, gemt: true, foraeldet: true }, 'cached');
    return fail('upstream', lang === 'en' ? 'The counting works did not answer.' : 'Tælleværket svarede ikke.', 503, { retryAfter: 60 });
  }
  const data = { tilstand: 'live', ...formTaelle(svar), mangler: fejl, hentet: new Date().toISOString() };
  gemt = { t: Date.now(), data };
  return ok(data, 'server');
}
