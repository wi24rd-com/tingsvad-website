// Spørg arkivet (runde 10, trin 4b): formularen på /arkivet/ og /en/archive/. Kalder POST /api/ting-ai/arkiv/spoerg.
// Svaret er Mímirs (Workers AI) ud fra AI Search-uddrag; kilderne linker til sitets egne sider. Ingen lagring i browseren.
(function () {
  'use strict';
  const rod = document.getElementById('arkiv-spoerg');
  if (!rod) return;
  const da = (document.documentElement.lang || 'da').slice(0, 2) !== 'en', lang = da ? 'da' : 'en';
  const T = da ? {
    spoerger: 'Mímir leder i arkivet …', kort: 'Skriv mindst tre tegn.', ai: 'AI · Mímir', server: 'Kun uddrag', kilder: 'Kilder', brugt: 'brugt i svaret',
    tavs: 'Mímir svarede ikke i dag, men her er de sider, han fandt.', ingen: 'Arkivet fandt intet om det. Mímir trækker på skuldrene.',
    sml: 'Det gamle kartotek fandt', smlIngen: 'Det gamle kartotek fandt intet, der lignede.', tid: 'AI Search {a} ms · model {m} ms · Vectorize {v} ms',
    fejl: { quota: 'Dagens spørgsmål er brugt. Arkivet åbner igen ved midnat (UTC).', rate_limited: 'Ét spørgsmål ad gangen. Vent et øjeblik.', busy: 'Arkivet er ved at blive sat på hylderne. Prøv igen senere.', not_configured: 'Arkivet er ikke tilsluttet endnu.' }, net: 'Nettet svarede ikke. Prøv igen.'
  } : {
    spoerger: 'Mímir is searching the archive …', kort: 'Write at least three characters.', ai: 'AI · Mímir', server: 'Excerpts only', kilder: 'Sources', brugt: 'used in the answer',
    tavs: 'Mímir did not answer today, but here are the pages he found.', ingen: 'The archive found nothing about that. Mímir shrugs.',
    sml: 'The old card index found', smlIngen: 'The old card index found nothing similar.', tid: 'AI Search {a} ms · model {m} ms · Vectorize {v} ms',
    fejl: { quota: 'Today’s questions are used up. The archive opens again at midnight (UTC).', rate_limited: 'One question at a time. Wait a moment.', busy: 'The archive is being shelved. Try again later.', not_configured: 'The archive is not connected yet.' }, net: 'The network did not answer. Try again.'
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
  const sikkerUrl = u => /^https:\/\/tingsvad\.dk\/[a-z0-9/_-]*$/i.test(u || '') ? u : 'https://tingsvad.dk/';
  const form = rod.querySelector('#arkiv-form'), q = rod.querySelector('#arkiv-q'), sml = rod.querySelector('#arkiv-sml'), st = rod.querySelector('#arkiv-status'), ud = rod.querySelector('#arkiv-svar');
  form.hidden = false; const ns = rod.querySelector('.arkiv-nojs'); if (ns) ns.hidden = true;
  rod.querySelectorAll('[data-eksempel]').forEach(b => b.addEventListener('click', () => { q.value = b.textContent; spoerg(); }));
  form.addEventListener('submit', e => { e.preventDefault(); spoerg(); });
  let optaget = false;
  async function spoerg() {
    const tekst = q.value.trim();
    if (tekst.length < 3) { st.className = 'r6-status fejl'; st.textContent = T.kort; return; }
    if (optaget) return; optaget = true;
    st.className = 'r6-status venter'; st.textContent = T.spoerger; ud.innerHTML = '';
    let j = null;
    try {
      const r = await fetch('/api/ting-ai/arkiv/spoerg', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: tekst, lang, sammenlign: !!(sml && sml.checked) }) });
      j = await r.json();
    } catch (e) { j = null; }
    optaget = false;
    if (!j || !j.ok) { st.className = 'r6-status fejl'; st.textContent = (j && T.fejl[j.code]) || (j && j.message) || T.net; return; }
    const d = j.data; st.className = 'r6-status'; st.textContent = '';
    const kilder = d.kilder || [];
    const svar = d.svar ? `<p class="r6-kildelinje"><span class="r6-kilde r6-kilde-ai">${esc(T.ai)}</span></p><blockquote class="arkiv-brian">${esc(d.svar)}</blockquote>`
      : `<p class="r6-kildelinje"><span class="r6-kilde r6-kilde-server">${esc(T.server)}</span></p><p>${esc(kilder.length ? T.tavs : T.ingen)}</p>`;
    const liste = kilder.length ? `<h3>${esc(T.kilder)}</h3><ol class="arkiv-kilder">${kilder.map(k => `<li${k.brugt ? ' class="brugt"' : ''}><a href="${esc(sikkerUrl(k.url))}">${esc(k.titel)}</a> <span class="r9-score-tal">${esc(Math.round((k.score || 0) * 100))} %${k.brugt ? ' · ' + esc(T.brugt) : ''}</span><p>${esc(k.uddrag)}</p></li>`).join('')}</ol>` : '';
    const h = Array.isArray(d.haandbygget) ? `<h3>${esc(T.sml)}</h3>${d.haandbygget.length ? `<ol class="arkiv-kilder arkiv-vectorize">${d.haandbygget.map(k => `<li><b>${esc(k.kilde)}</b> <span class="r9-score-tal">${esc(Math.round((k.score || 0) * 100))} %</span><p>${esc(k.uddrag)}</p></li>`).join('')}</ol>` : `<p class="note">${esc(T.smlIngen)}</p>`}` : '';
    const tid = d.ms ? `<p class="note">${esc(fmt(T.tid, { a: Math.round(d.ms.aiSearch || 0), m: Math.round(d.ms.model || 0), v: Math.round(d.ms.vectorize || 0) }))} · <code>${esc(d.instans || '')}</code></p>` : '';
    ud.innerHTML = svar + liste + h + (rod.closest('.r12s') ? '' : tid);
  }
})();
