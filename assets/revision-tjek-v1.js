/* tingsvad.dk — Revisionens tæller (runde 9). Indlæses KUN af Gudruns Browser Run-snapshot via addScriptTag (url), fordi sitets CSP
   med god grund blokerer inline-scripts. Selektorerne står i scriptets egen query (?s=…). Resultatet skrives i <html data-tv-revision>,
   som Workeren læser ud af det serialiserede HTML. Ændres filen, skal den have et nyt navn (-v2): /assets/* caches i et år. */
(function () {
  const src = (document.currentScript && document.currentScript.src) || '', r = {};
  let S = {}; try { S = JSON.parse(decodeURIComponent((src.split('?s=')[1] || '%7B%7D'))); } catch (e) { }
  for (const k in S) { try { r[k] = document.querySelectorAll(S[k]).length; } catch (e) { r[k] = -1; } }
  document.documentElement.setAttribute('data-tv-revision', JSON.stringify({ sel: r, fejl: (window.__tvFejl || []).slice(0, 5), titel: document.title }));
})();
