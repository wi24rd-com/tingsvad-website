// Dagbogen (runde 12): Durable Objects med SQLite-lager fører historik med SQL (ctx.storage.sql), ved siden af den
// nøgle-værdi-tilstand de allerede gemmer. Én tabel pr. objekt; hver række er en hændelse med dansk ugedag og time
// (Europe/Copenhagen) beregnet ved indsættelse, så statistikken kan grupperes uden tidszoner i SQL. Ingen personer:
// kun tidspunkt, art og en kort værdi (fx 'ja' eller en retning). Rækker ældre end 180 dage ryddes løbende.
const DAGE_MS = 180 * 86400_000;
const FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Copenhagen', weekday: 'short', hour: '2-digit', hourCycle: 'h23' });
const UGEDAG = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
export function cphDagTime(t) {
  const p = Object.fromEntries(FMT.formatToParts(new Date(t)).map(x => [x.type, x.value]));
  return { dag: UGEDAG[p.weekday] ?? 0, time: +p.hour % 24 };
}
export const SQL = {
  opret: 'CREATE TABLE IF NOT EXISTS dagbog (t INTEGER NOT NULL, art TEXT NOT NULL, vaerdi TEXT, dag INTEGER NOT NULL, time INTEGER NOT NULL)',
  indeks: 'CREATE INDEX IF NOT EXISTS dagbog_t ON dagbog (t)',
  skriv: 'INSERT INTO dagbog (t, art, vaerdi, dag, time) VALUES (?, ?, ?, ?, ?)',
  ryd: 'DELETE FROM dagbog WHERE t < ?',
  iAlt: 'SELECT art, vaerdi, COUNT(*) AS n FROM dagbog GROUP BY art, vaerdi',
  doegn: 'SELECT COUNT(*) AS n FROM dagbog WHERE art = ? AND t >= ?',
  dag: 'SELECT dag, COUNT(*) AS n FROM dagbog WHERE art = ? GROUP BY dag ORDER BY n DESC, dag LIMIT 1',
  time: 'SELECT time, COUNT(*) AS n FROM dagbog WHERE art = ? GROUP BY time ORDER BY n DESC, time LIMIT 1',
  senest: 'SELECT MAX(t) AS t FROM dagbog WHERE art = ?',
  foerst: 'SELECT MIN(t) AS t FROM dagbog',
};
export class Dagbog {
  constructor(storage) { this.sql = storage && storage.sql; this.klar = false; this.n = 0; }
  init() { if (this.klar || !this.sql) return !!this.sql; this.sql.exec(SQL.opret); this.sql.exec(SQL.indeks); this.klar = true; return true; }
  skriv(art, vaerdi = null, t = Date.now()) {
    try {
      if (!this.init()) return false;
      const { dag, time } = cphDagTime(t);
      this.sql.exec(SQL.skriv, t, art, vaerdi == null ? null : String(vaerdi).slice(0, 24), dag, time);
      if (++this.n % 200 === 0) this.sql.exec(SQL.ryd, t - DAGE_MS);
      return true;
    } catch (e) { return false; } // dagbogen må aldrig vælte stolen eller afstemningen
  }
  /** Statistik for én art (fx 'flyt' eller 'stemme'). */
  statistik(art, now = Date.now()) {
    if (!this.init()) return null;
    const en = (q, ...a) => { const r = this.sql.exec(q, ...a).toArray(); return r[0] || null; };
    const fordeling = {}; let iAlt = 0;
    for (const r of this.sql.exec(SQL.iAlt).toArray()) if (r.art === art) { fordeling[r.vaerdi ?? ''] = r.n; iAlt += r.n; }
    const runder = this.sql.exec(SQL.iAlt).toArray().filter(r => r.art === 'runde').reduce((a, r) => a + r.n, 0);
    const d = en(SQL.dag, art), h = en(SQL.time, art), s = en(SQL.senest, art), f = en(SQL.foerst);
    return { iAlt, doegn: (en(SQL.doegn, art, now - 86400_000) || {}).n || 0, fordeling, runder,
      travlesteDag: d ? d.dag : null, travlesteTime: h ? h.time : null, senest: s && s.t ? new Date(s.t).toISOString() : null,
      siden: f && f.t ? new Date(f.t).toISOString() : null,
      sql: [SQL.doegn.replace('?', `'${art}'`).replace('?', ':i_går'), SQL.dag.replace('?', `'${art}'`)] };
  }
}
