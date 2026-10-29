// Secrets Store (runde 12): en hemmelighed kan ligge i kontoens fælles Secrets Store (binding <NAVN>_STORE, læses med
// `await env.<NAVN>_STORE.get()`) eller som almindelig Worker-secret (env.<NAVN>). Secrets Store vinder; svarer den ikke,
// bruges Worker-secret'en, så en ufærdig opsætning aldrig vælter noget. Værdien logges aldrig; kun hvor den kom fra.
export function harHemmelighed(env, navn) {
  const b = env[navn + '_STORE'];
  return !!((b && typeof b.get === 'function') || env[navn]);
}
export async function hemmelighed(env, navn) {
  const b = env[navn + '_STORE'];
  if (b && typeof b.get === 'function') {
    try { const v = await b.get(); if (v) return { v: String(v), kilde: 'secrets-store' }; } catch (e) { }
  }
  return env[navn] ? { v: String(env[navn]), kilde: 'worker-secret' } : { v: null, kilde: null };
}
