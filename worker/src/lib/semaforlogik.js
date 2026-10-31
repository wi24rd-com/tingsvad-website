// Semaforens rene logik (runde 13, AP9) – testes uden runtime; selve Durable Object'et ligger i ../semafor.js.
export const semaforLogik = {
  /** Fjerner udløbne pladser. */
  ryd(l, now) { for (const k of Object.keys(l)) if (!(l[k] > now)) delete l[k]; return l; },
  /** Tager en plads: nyt token eller null når alle maks pladser er optaget. */
  tag(l, maks, ttlMs, now, token) { semaforLogik.ryd(l, now); if (Object.keys(l).length >= maks) return null; l[token] = now + ttlMs; return token; },
  slip(l, token) { delete l[token]; return l; },
  antal(l, now) { return Object.keys(semaforLogik.ryd(l, now)).length; },
};

