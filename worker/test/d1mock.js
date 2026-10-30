// Minimal D1-lignende skal over node:sqlite til tests (prepare/bind/run/first/all/batch).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export function makeDb() {
  const db = new DatabaseSync(':memory:');
  // Alle migrationer i rækkefølge (runde 13: før kun 0001), så tests ser samme skema som produktionen.
  const mappe = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
  for (const f of readdirSync(mappe).filter(f => f.endsWith('.sql')).sort()) db.exec(readFileSync(join(mappe, f), 'utf8'));
  const wrap = (sqlText, params = []) => ({
    bind: (...p) => wrap(sqlText, p),
    run: async () => { const st = db.prepare(sqlText); const r = /RETURNING/i.test(sqlText) ? (st.all(...params), { changes: 1 }) : st.run(...params); return { success: true, meta: { changes: Number(r.changes) } }; },
    first: async () => db.prepare(sqlText).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sqlText).all(...params) }),
  });
  return { prepare: s => wrap(s), batch: async stmts => { db.exec('BEGIN'); try { const out = []; for (const s of stmts) out.push(await s.run()); db.exec('COMMIT'); return out; } catch (e) { db.exec('ROLLBACK'); throw e; } }, raw: db };
}
