// Det europæiske arkivskab (runde 12): én Durable Object-klasse, brugt to gange. Den ene instans ligger i et navnerum,
// der er låst til EU (env.EU_SKAB.jurisdiction('eu')), den anden i det almindelige navnerum uden lås. Begge fortæller selv,
// hvilken jurisdiktion de hører til (ctx.id.jurisdiction) og hvilket datacenter de kører i (Cloudflares trace for deres
// eget udgående kald), og fører et lille segl-regnskab i deres eget SQLite-lager. Der gemmes kun tid og datacenter.
import { DurableObject } from 'cloudflare:workers';
import { egetColo } from './features/topologi.js';

const DAG = t => new Date(t).toISOString().slice(0, 10);
export class EuSkab extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env); this.ctx = ctx; this.env = env;
    ctx.blockConcurrencyWhile(async () => { this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS segl (t INTEGER NOT NULL, dag TEXT NOT NULL, colo TEXT)'); });
  }
  async hvor() {
    const gemt = await this.ctx.storage.get('colo');
    if (gemt && Date.now() - gemt.t < 3600e3) return gemt.colo;
    let colo = null; try { colo = await egetColo(); } catch (e) { }
    if (colo) await this.ctx.storage.put('colo', { colo, t: Date.now() });
    return colo;
  }
  async status(nu = Date.now()) {
    const sql = this.ctx.storage.sql;
    const n = sql.exec('SELECT COUNT(*) AS n FROM segl').one().n, idag = sql.exec('SELECT COUNT(*) AS n FROM segl WHERE dag = ?', DAG(nu)).one().n;
    return { jurisdiktion: this.ctx.id.jurisdiction || null, colo: await this.hvor(), segl: n, idag };
  }
  /** Ét segl: tid og det datacenter, gæsten blev besvaret i. Ryddes efter 90 dage. */
  async segl(gaestColo, nu = Date.now()) {
    const sql = this.ctx.storage.sql;
    sql.exec('INSERT INTO segl (t, dag, colo) VALUES (?, ?, ?)', nu, DAG(nu), /^[A-Z]{3}$/.test(gaestColo || '') ? gaestColo : null);
    sql.exec('DELETE FROM segl WHERE t < ?', nu - 90 * 86400e3);
    return this.status(nu);
  }
}
