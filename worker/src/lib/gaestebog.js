// Gæstebogen i D1 (runde 13, AP7): sagsnumre tildeles af databasen (INSERT … RETURNING), så to samtidige gæster aldrig
// får samme nummer. Bruges af site-Workeren gennem service bindingen (intern/gaestebog) og af MCP-serveren direkte.
// Første kald importerer den gamle KV-liste (nøglerne 'liste' og 'taeller') én gang; derefter læses KV ikke.
import { GRUNDSAGER, nummer, idAf } from '../../../shared/gaestebog.js';
import { cphDateKey } from './dates.js';

const raekke = r => ({ nr: nummer(r.id), navn: r.navn, sag: r.sag, dato: r.dato, ...(r.kilde ? { kilde: r.kilde } : {}) });

/** Engangsimport fra KV. Idempotent: kører kun når tabellen er tom, og INSERT OR IGNORE tåler et kapløb mellem to første skrivere. */
export async function importerFraKv(env) {
  if (!env.SAGER) return 0;
  const tom = await env.DB.prepare('SELECT count(*) AS n FROM gaestebog').first();
  if (tom && tom.n > 0) return 0;
  const liste = (await env.SAGER.get('liste', 'json').catch(() => null)) || [];
  const taeller = (await env.SAGER.get('taeller', 'text').catch(() => null)) | 0;
  const rows = liste.map(s => ({ id: idAf(s.nr), s })).filter(x => x.id);
  if (rows.length) {
    await env.DB.batch(rows.map(({ id, s }) => env.DB.prepare('INSERT OR IGNORE INTO gaestebog (id, navn, sag, dato, kilde) VALUES (?, ?, ?, ?, ?)').bind(id, String(s.navn || ''), String(s.sag || ''), String(s.dato || ''), s.kilde || null)));
  }
  // Slettede sager efterlod huller i KV-tælleren; næste nummer skal fortsætte efter den, ikke genbruge et slettet nummer.
  if (taeller > 0) await env.DB.prepare("INSERT INTO sqlite_sequence (name, seq) SELECT 'gaestebog', ? WHERE NOT EXISTS (SELECT 1 FROM sqlite_sequence WHERE name = 'gaestebog')").bind(taeller).run().catch(() => {});
  if (taeller > 0) await env.DB.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'gaestebog' AND seq < ?").bind(taeller, taeller).run().catch(() => {});
  return rows.length;
}

/** Gæstesager alene (nyeste først), højst n, evt. efter cursor (sagsnummer). Grundsagerne er ikke med. */
export async function laesGaester(env, n = 50, cursor = null) {
  await importerFraKv(env);
  const fra = cursor ? idAf(cursor) : null;
  if (cursor && !fra) return [];
  const q = fra ? env.DB.prepare('SELECT id, navn, sag, dato, kilde FROM gaestebog WHERE slettet IS NULL AND id < ? ORDER BY id DESC LIMIT ?').bind(fra, n)
    : env.DB.prepare('SELECT id, navn, sag, dato, kilde FROM gaestebog WHERE slettet IS NULL ORDER BY id DESC LIMIT ?').bind(n);
  const { results } = await q.all();
  return (results || []).map(raekke);
}

/** Grundsagerne efter et cursor-nummer (alle tre uden cursor). */
export const grundsagerEfter = cursor => GRUNDSAGER.filter(g => !cursor || g.nr < cursor);

/** Gæstebogen som sitet viser den: de seneste max gæstesager + grundsagerne til sidst. */
export async function laesSager(env, max = 50) {
  return [...(await laesGaester(env, Math.max(1, Math.min(500, max | 0)))), ...GRUNDSAGER];
}

/** Skriver en ny sag og returnerer den med det nummer, databasen gav. navn/sag skal være renset og valideret af kalderen. */
export async function skrivSag(env, { navn, sag, kilde }) {
  await importerFraKv(env);
  const dato = cphDateKey();
  const r = await env.DB.prepare('INSERT INTO gaestebog (navn, sag, dato, kilde) VALUES (?, ?, ?, ?) RETURNING id, navn, sag, dato, kilde').bind(navn, sag, dato, kilde || null).first();
  return raekke(r);
}

/** Admin: fjerner teksten og mærker rækken slettet (nr, tidspunkt og hvem bliver stående). false når nummeret ikke findes. */
export async function sletSag(env, nr, af) {
  const id = idAf(nr);
  if (!id) return false;
  const r = await env.DB.prepare('UPDATE gaestebog SET navn = ?, sag = ?, slettet = ?, slettet_af = ? WHERE id = ? AND slettet IS NULL').bind('', '', new Date().toISOString(), String(af || ''), id).run();
  return !!(r.meta && r.meta.changes);
}

/** Admin: alle gæstesager (uden grundsager) og de seneste sletninger. */
export async function adminListe(env) {
  await importerFraKv(env);
  const a = await env.DB.prepare('SELECT id, navn, sag, dato, kilde FROM gaestebog WHERE slettet IS NULL ORDER BY id DESC LIMIT 500').all();
  const b = await env.DB.prepare('SELECT id, slettet, slettet_af FROM gaestebog WHERE slettet IS NOT NULL ORDER BY slettet DESC LIMIT 20').all();
  return { sager: (a.results || []).map(raekke), slettet: (b.results || []).map(r => ({ nr: nummer(r.id), slettet: r.slettet, af: r.slettet_af })) };
}

/** Tællere (afgørelsesknappen m.fl.): atomisk +1, eller aflæsning. Første gang hentes den gamle KV-stand (nøglen med samme navn) med over. */
export async function taeller(env, navn, laegTil = 0) {
  const r0 = await env.DB.prepare('SELECT n FROM taellere WHERE navn = ?').bind(navn).first();
  if (!r0 && env.SAGER) { const gammel = (await env.SAGER.get(navn, 'text').catch(() => null)) | 0; await env.DB.prepare('INSERT OR IGNORE INTO taellere (navn, n) VALUES (?, ?)').bind(navn, gammel).run(); }
  if (laegTil > 0) {
    const r = await env.DB.prepare('INSERT INTO taellere (navn, n) VALUES (?, ?) ON CONFLICT (navn) DO UPDATE SET n = n + excluded.n RETURNING n').bind(navn, laegTil).first();
    return r ? r.n : 0;
  }
  const r = await env.DB.prepare('SELECT n FROM taellere WHERE navn = ?').bind(navn).first();
  return r ? r.n : 0;
}

/** Dagens besøgende: ét hash pr. gæst pr. dag (hashen laves af kalderen, uden IP i klartekst). Returnerer dagens antal. */
export async function besoeg(env, dag, h = null) {
  if (h) await env.DB.prepare('INSERT OR IGNORE INTO besoeg (dag, h) VALUES (?, ?)').bind(dag, h).run();
  const r = await env.DB.prepare('SELECT count(*) AS n FROM besoeg WHERE dag = ?').bind(dag).first();
  return r ? r.n : 0;
}

/** Oprydning (cron): besøgshashes ældre end to døgn. */
export async function rydBesoeg(env, foerDag) {
  await env.DB.prepare('DELETE FROM besoeg WHERE dag < ?').bind(foerDag).run();
}
