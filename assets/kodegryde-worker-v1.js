/* tingsvad.dk — Kodegryden (runde 9): kører gæstens kode i en Web Worker i gæstens egen browser. Intet sendes til en server.
   Filen har sin egen CSP i _headers: default-src 'none' (intet netværk, ingen importScripts) og script-src 'self' 'unsafe-eval'
   (kun her, så new Function virker). Hovedsiden afbryder workeren efter 2 sekunder. Ændres filen: nyt navn (-v2). */
'use strict';
for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel']) { try { self[k] = undefined; } catch (e) { } }
self.onmessage = e => {
  const { kode, tests } = e.data || {};
  if (typeof kode !== 'string' || kode.length > 4000 || !Array.isArray(tests)) { postMessage({ fejl: 'bad input' }); return; }
  let fn;
  try { fn = new Function('input', '"use strict";\n' + kode + '\n;if (typeof løs !== "function") throw new Error("løs?"); return løs(input);'); }
  catch (err) { postMessage({ compile: String(err && err.message || err).slice(0, 300) }); return; }
  const res = [];
  for (const t of tests.slice(0, 10)) {
    const t0 = performance.now();
    try {
      const ud = fn(JSON.parse(JSON.stringify(t.input)));
      let txt; try { txt = JSON.stringify(ud); } catch (x) { txt = String(ud); }
      res.push({ ok: txt === JSON.stringify(t.forventet), ud: String(txt).slice(0, 300), ms: performance.now() - t0 });
    } catch (err) { res.push({ ok: false, fejl: String(err && err.message || err).slice(0, 300), ms: performance.now() - t0 }); }
  }
  postMessage({ res });
};
