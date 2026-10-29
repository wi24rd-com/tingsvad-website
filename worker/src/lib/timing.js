// Server-Timing for »Vis maskineriet« (runde 9).
// Udvalgte bindings pakkes ind i en Proxy, der måler hvert asynkront kald (D1, Workers AI, R2, KV, Vectorize, Browser Run).
// Svaret får headeren `Server-Timing: d1;dur=4.1;desc="3 calls", ai;dur=812.0;desc="1 call", total;dur=830.2`.
// Bemærk: Workers' ur flytter sig kun ved I/O (beskyttelse mod tidsangreb), så tallene måler ventetid på tjenesterne, ikke CPU.
const KATEGORI = { DB: 'd1', AI: 'ai', MEDIA: 'r2', SAGER: 'kv', VECTORS: 'vectorize', BROWSER: 'browser' };
const RAW = new WeakMap(); // proxy → ægte objekt (native metoder som D1.batch kræver de ægte statements)
const ægte = a => (Array.isArray(a) ? a.map(ægte) : (a && typeof a === 'object' && RAW.get(a)) || a);

export function timer() {
  const t0 = performance.now(), m = {};
  return {
    add(cat, ms) { const x = (m[cat] ||= { dur: 0, n: 0 }); x.dur += ms; x.n += 1; },
    header() {
      const dele = Object.entries(m).map(([k, v]) => `${k};dur=${v.dur.toFixed(1)};desc="${v.n} ${v.n === 1 ? 'call' : 'calls'}"`);
      dele.push(`total;dur=${(performance.now() - t0).toFixed(1)}`);
      return dele.join(', ');
    },
  };
}

function wrap(obj, cat, t) {
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return obj;
  const p = new Proxy(obj, {
    get(target, prop) {
      const v = Reflect.get(target, prop, target);
      if (typeof v !== 'function') return v;
      return (...args) => {
        const start = performance.now();
        const out = v.apply(target, ægte(args));
        if (out && typeof out.then === 'function') return out.then(r => { t.add(cat, performance.now() - start); return r; }, e => { t.add(cat, performance.now() - start); throw e; });
        // D1: prepare()/bind() giver et statement, hvis first()/all()/run() også skal måles
        if (cat === 'd1' && out && typeof out === 'object' && typeof out.bind === 'function') return wrap(out, cat, t);
        return out;
      };
    },
  });
  RAW.set(p, obj);
  return p;
}

/** Et env, hvor de målbare bindings er pakket ind. Alt andet (Durable Objects, Workflows, vars, secrets) er uændret. */
export function instrument(env, t) {
  const cache = {};
  return new Proxy(env, {
    get(target, prop) {
      const v = target[prop];
      if (!KATEGORI[prop] || !v) return v;
      return (cache[prop] ||= wrap(v, KATEGORI[prop], t));
    },
  });
}

/** Sætter Server-Timing (og lader 101/WebSocket være i fred). */
export function medTiming(res, t) {
  if (!res || res.status === 101 || res.webSocket) return res;
  const r = new Response(res.body, res);
  r.headers.set('server-timing', t.header());
  return r;
}
