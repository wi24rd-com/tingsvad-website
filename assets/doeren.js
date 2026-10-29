/* tingsvad.dk — Tingets dør (runde 12): hvor mange gange /admin/ blev prøvet, og hvad kanten svarede.
   Tallene kommer fra /api/ting-ai/doeren (Workeren henter dem hver time fra Cloudflares GraphQL Analytics API).
   Kun antal pr. udfald pr. døgn: ingen IP-adresser, ingen navne. Uden tal viser blokken en ærlig besked i stedet. */
(function () {
  'use strict';
  const rod = document.querySelector('[data-doeren]');
  if (!rod) return;
  const da = document.documentElement.lang !== 'en', loc = da ? 'da-DK' : 'en-GB';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tal = n => Number(n || 0).toLocaleString(loc);
  const datoLang = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(loc, { day: 'numeric', month: 'long', timeZone: 'UTC' }); } catch (e) { return d; } };
  const datoKort = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' }); } catch (e) { return d; } };
  const T = da ? {
    henter: 'Tæller forsøg på døren …', opdateret: 'Talt kl. {t}', ingen: 'Døren har ikke fået sine tal endnu. De kommer, når tingets Worker har kørt sin time.',
    idag: 'forsøg i dag', d7: 'forsøg de seneste 7 døgn', login: 'sendt til login', inde: 'kom ind', afvist: 'afvist af tingets egen kode',
    loginSub: 'Access sagde nej og viste login-siden', indeSub: 'administratoren selv', afvistSub: 'den anden lås (sjældent)',
    grafTitel: 'Forsøg på døren de seneste 30 døgn, delt på udfald', leg: { login: 'Sendt til login', inde: 'Kom ind', afvist: 'Afvist af koden', andet: 'Andet' },
    mk: { titel: 'Vis maskineriet', kald: 'Seneste kald', ingen: 'Ingen kald endnu.', browser: 'målt i browseren', total: 'i alt i Workeren', kode: 'Kildekoden på GitHub', tid: 'kl.' },
  } : {
    henter: 'Counting knocks on the door …', opdateret: 'Counted at {t}', ingen: 'The door has not got its numbers yet. They arrive once the thing’s Worker has run its hour.',
    idag: 'knocks today', d7: 'knocks in the last 7 days', login: 'sent to login', inde: 'got in', afvist: 'refused by the thing’s own code',
    loginSub: 'Access said no and showed the login page', indeSub: 'the administrator himself', afvistSub: 'the second lock (rare)',
    grafTitel: 'Knocks on the door in the last 30 days, by outcome', leg: { login: 'Sent to login', inde: 'Got in', afvist: 'Refused by the code', andet: 'Other' },
    mk: { titel: 'Show the machinery', kald: 'Latest calls', ingen: 'No calls yet.', browser: 'measured in the browser', total: 'in total in the Worker', kode: 'Source code on GitHub', tid: 'at' },
  };
  const FARVE = { login: '#c9973a', inde: '#4f9a66', afvist: '#b04a36', andet: '#8a99a3' };
  /* ── Vis maskineriet (samme komponent og klasser som maskinparken og revisionen) ── */
  const GH = 'https://github.com/wi24rd-com/tingsvad-website/blob/main/';
  const SPEC = { p: ['Cloudflare Access', 'GraphQL Analytics API', da ? 'Cron hver time' : 'Cron every hour', 'D1', 'Workers KV', 'Workers Cache'], f: ['functions/_lib/access.js', 'functions/_lib/admin.js', 'worker/src/features/vagt.js', 'assets/doeren.js'] };
  function maskineri(host) {
    if (!host) return { log() {} };
    const M = T.mk, kald = [];
    host.innerHTML = `<details class="r6-maskineri"><summary>${esc(M.titel)}</summary><div class="r6-mk-kaede"></div>
      <p><b>${esc(M.kald)}</b></p><ul class="r6-mk-kald" aria-live="polite"><li class="note">${esc(M.ingen)}</li></ul>
      <p class="r6-mk-kode"><b>${esc(M.kode)}:</b> ${SPEC.f.map(x => `<a href="${GH}${x}" rel="noopener">${esc(x)}</a>`).join(' · ')}</p></details>`;
    const ul = host.querySelector('.r6-mk-kald'), kaede = host.querySelector('.r6-mk-kaede');
    const tegnKaede = k => { if (window.tvKaede) window.tvKaede.tegn(kaede, SPEC, k || null); };
    tegnKaede(null);
    const ms = x => (x < 10 ? x.toFixed(1) : Math.round(x)) + ' ms';
    const tot = h => { const m = String(h || '').match(/(?:^|,)\s*total;[^,]*dur=([\d.]+)/); return m ? +m[1] : null; };
    return { log(k) {
      kald.unshift(k); kald.splice(5); tegnKaede(k);
      ul.innerHTML = kald.map(k => { const t = tot(k.timing); return `<li><code>${esc(k.method)} ${esc(k.path)}</code> <span class="r6-mk-status">${esc(k.status)}</span>${k.kantcache ? ` <span class="r6-kilde r6-kilde-kant">Workers Cache · ${esc(k.kantcache)}</span>` : ''}
        <div class="r6-mk-tal"><b>${esc(ms(k.ms))}</b> ${esc(M.browser)}${t != null ? ` · <b>${esc(ms(t))}</b> ${esc(M.total)}` : ''} · ${esc(M.tid)} ${esc(new Date(k.at).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}</div></li>`; }).join('');
    } };
  }
  const mk = maskineri(document.getElementById('doeren-maskineri'));
  async function hentMaalt(sti) {
    const t0 = performance.now(), r = await fetch(sti, { credentials: 'same-origin' });
    mk.log({ method: 'GET', path: sti, status: r.status, ms: performance.now() - t0, timing: r.headers.get('server-timing'), kantcache: r.headers.get('x-tingsvad-kantcache'), at: new Date().toISOString() });
    return r;
  }

  const flise = (n, t, sub, cls = '') => `<div class="vg-flise ${cls}"><b>${esc(n)}</b><span>${esc(t)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;

  function graf(dage) {
    const W = 1000, H = 200, top = 16, bund = 28, n = dage.length, bw = (W - 16) / n;
    const maks = Math.max(1, ...dage.map(d => d.forsoeg));
    const y = v => top + (H - top - bund) * (1 - v / maks);
    const p = [`<line class="vg-akse" x1="8" x2="${W - 8}" y1="${y(maks).toFixed(1)}" y2="${y(maks).toFixed(1)}"/><text class="vg-akse-t" x="${W - 8}" y="${(y(maks) - 4).toFixed(1)}" text-anchor="end">${tal(maks)}</text>`];
    dage.forEach((d, i) => {
      const x = 8 + i * bw + bw * 0.15, w = bw * 0.7; let acc = 0;
      const dele = ['login', 'inde', 'afvist', 'andet'].map(k => { const v = d[k] || 0; if (!v) return ''; const y0 = y(acc), y1 = y(acc + v); acc += v; return `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0.6, y0 - y1).toFixed(1)}" fill="${FARVE[k]}"/>`; }).join('');
      p.push(`<g><title>${esc(`${datoLang(d.dag)}: ${tal(d.forsoeg)}`)}</title>${dele}</g>`);
      if (i % 7 === (n - 1) % 7) p.push(`<text class="vg-akse-t" x="${(x + w / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(datoKort(d.dag))}</text>`);
    });
    p.push(`<line class="vg-akse vg-nul" x1="8" x2="${W - 8}" y1="${y(0)}" y2="${y(0)}"/>`);
    return `<div class="vg-tavle vg-tavle-pad"><div class="vg-soejler-rul" tabindex="0" role="region" aria-label="${esc(T.grafTitel)}"><svg class="vg-soejler" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.grafTitel)}">${p.join('')}</svg></div>
      <ul class="vg-legende dr-legende">${Object.entries(T.leg).map(([k, t]) => `<li><i style="background:${FARVE[k]}"></i>${esc(t)}</li>`).join('')}</ul></div>`;
  }

  async function start() {
    rod.setAttribute('aria-busy', 'true'); rod.innerHTML = `<p class="vg-status">${esc(T.henter)}</p>`;
    let d = null;
    try {
      const h = await fetch('/api/ting-ai/health', { credentials: 'same-origin' }).then(r => r.json()).catch(() => null);
      if (h && h.ok && h.data && h.data.configured && h.data.configured.vagt) { const r = await hentMaalt('/api/ting-ai/doeren'); const j = r.ok ? await r.json() : null; d = j && j.ok ? j.data : null; }
    } catch (e) { d = null; }
    rod.removeAttribute('aria-busy');
    if (!d || !Array.isArray(d.dage)) { rod.innerHTML = `<p class="note">${esc(T.ingen)}</p>`; return; }
    const kl = d.opdateret ? new Date(d.opdateret).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }) : '';
    rod.innerHTML = `<div class="vg-bjaelke"><p class="vg-status">${esc(T.opdateret.replace('{t}', kl))}</p></div>
      <div class="vg-fliser">${flise(tal(d.iDag.forsoeg), T.idag, '', 'vg-hoved')}${flise(tal(d.d7.forsoeg), T.d7)}${flise(tal(d.d7.login), T.login, T.loginSub)}${flise(tal(d.d7.inde), T.inde, T.indeSub, 'vg-graa')}</div>
      ${d.d7.afvist ? `<p class="note">${esc(tal(d.d7.afvist) + ' ' + T.afvist + ' · ' + T.afvistSub)}</p>` : ''}
      ${graf(d.dage)}`;
    const rul = rod.querySelector('.vg-soejler-rul'); if (rul) rul.scrollLeft = rul.scrollWidth; // på smalle skærme: åbn ved de nyeste døgn
    dispatchEvent(new Event('tv:indhold'));
  }
  start();
})();
