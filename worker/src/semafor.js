// Semafor (runde 13, AP9): et lille Durable Object, der tæller samtidige pladser med udløb – ét objekt pr. navn
// ('browser' for Browser Run, 'live' for live-radioens lyttere). Pladser, der ikke slippes (nedbrud, lyttere der bare
// lukker fanen), udløber af sig selv. Logikken er ren (semaforLogik) og testes uden runtime.
import { DurableObject } from 'cloudflare:workers';

import { semaforLogik } from './lib/semaforlogik.js';
export { semaforLogik };

export class Semafor extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.ctx = ctx; }
  async laes() { return (await this.ctx.storage.get('l')) || {}; }
  /** Returnerer et token, eller null hvis der ikke er plads. ttlMs: hvor længe pladsen højst holdes. */
  async tag(maks, ttlMs) {
    const l = await this.laes(), t = semaforLogik.tag(l, maks, ttlMs, Date.now(), crypto.randomUUID());
    await this.ctx.storage.put('l', l);
    return t;
  }
  async slip(token) { const l = await this.laes(); semaforLogik.slip(l, token); await this.ctx.storage.put('l', l); }
  async antal() { const l = await this.laes(); const n = semaforLogik.antal(l, Date.now()); await this.ctx.storage.put('l', l); return n; }
}
