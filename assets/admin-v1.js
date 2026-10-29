/* tingsvad.dk — administration (bag Cloudflare Access): slet gæstebogssager, godkend/afvis/slet ravnebreve, slet avisudgaver.
   Alle kald går til /admin/api/*, som selv verificerer Access-login; denne fil indeholder ingen hemmeligheder. */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dato = s => { const d = new Date(s); return isNaN(d) ? esc(s) : d.toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Copenhagen' }); };
  async function kald(sti, o = {}) {
    try {
      const r = await fetch(sti, { credentials: 'same-origin', headers: { 'content-type': 'application/json' }, ...o });
      const b = await r.json().catch(() => null);
      if (!r.ok || !b || b.ok === false) return { ok: false, status: r.status, message: (b && b.message) || ('HTTP ' + r.status) };
      return { ok: true, data: b.data };
    } catch (e) { return { ok: false, message: 'Nettet svarede ikke.' }; }
  }
  const status = (el, tekst, fejl) => { el.textContent = tekst; el.className = 'r6-status' + (fejl ? ' fejl' : ''); };

  /* ── Gæstebogen ── */
  const gb = $('#adm-gb'), gbSt = $('#adm-gb-status'), gbSl = $('#adm-gb-slettet');
  async function hentGb() {
    const r = await kald('/admin/api/sager');
    if (!r.ok) { status(gbSt, r.status === 403 ? 'Ikke logget ind som administrator.' : r.message, true); return; }
    const { sager, slettet } = r.data;
    status(gbSt, sager.length ? `${sager.length} sag${sager.length === 1 ? '' : 'er'} fra gæster.` : 'Ingen sager fra gæster endnu.');
    gb.innerHTML = sager.map(s => `<li><div><b>${esc(s.navn)}</b> <span class="note">· <code>${esc(s.nr)}</code> · ${esc(s.dato)}</span><p>${esc(s.sag)}</p></div><button type="button" class="knap sek adm-slet" data-nr="${esc(s.nr)}">Slet</button></li>`).join('');
    gbSl.innerHTML = slettet.length ? slettet.map(s => `<li><code>${esc(s.nr)}</code> · ${dato(s.slettet)} · ${esc(s.af)}</li>`).join('') : '<li class="note">Intet slettet endnu.</li>';
  }
  gb.addEventListener('click', async e => {
    const b = e.target.closest('.adm-slet'); if (!b) return;
    const nr = b.dataset.nr;
    if (b.dataset.sikker !== '1') { b.dataset.sikker = '1'; b.textContent = 'Slet ' + nr + '?'; b.classList.add('adm-fare'); setTimeout(() => { if (b.isConnected) { b.dataset.sikker = ''; b.textContent = 'Slet'; b.classList.remove('adm-fare'); } }, 4000); return; } // to tryk, ingen browser-dialog
    b.disabled = true;
    const r = await kald('/admin/api/sager?nr=' + encodeURIComponent(nr), { method: 'DELETE' });
    if (!r.ok) { status(gbSt, r.message, true); b.disabled = false; return; }
    status(gbSt, `Sag ${nr} er slettet.`); hentGb();
  });

  /* ── Ravneposten ── */
  const rp = $('#adm-rp'), rpSt = $('#adm-rp-status');
  const tilstand = b => b.approved === 1 ? (b.public_request ? 'Godkendt · vises' : 'Godkendt · privat (ikke bedt om offentliggørelse)') : b.approved === -1 ? 'Afvist' : (b.public_request ? 'Venter · beder om at blive vist' : 'Privat');
  async function hentRp() {
    const r = await kald('/admin/api/ravnepost');
    if (!r.ok) { status(rpSt, r.status === 403 ? 'Ikke logget ind som administrator.' : r.message, true); return; }
    const { breve, admin } = r.data;
    if (admin) $('#adm-hvem').textContent = 'Logget ind som ' + admin + ' via Cloudflare Access.';
    status(rpSt, breve.length ? `${breve.length} brev${breve.length === 1 ? '' : 'e'}.` : 'Ingen breve endnu.');
    rp.innerHTML = breve.map(b => `<li data-id="${esc(b.id)}"><div><b>${esc(b.subject)}</b> <span class="note">· ${esc(b.to_local)}@ · ${dato(b.received_at)} · ${esc(tilstand(b))}</span><p>${esc(b.uddrag)}</p></div><div class="adm-knapper">${b.approved !== 1 ? '<button type="button" class="knap sek" data-h="godkend">Godkend</button>' : ''}${b.approved !== -1 ? '<button type="button" class="knap sek" data-h="afvis">Afvis</button>' : ''}<button type="button" class="knap sek" data-h="slet">Slet</button></div></li>`).join('');
  }
  rp.addEventListener('click', async e => {
    const b = e.target.closest('button[data-h]'); if (!b) return;
    const id = b.closest('li').dataset.id, h = b.dataset.h;
    if (h === 'slet' && b.dataset.sikker !== '1') { b.dataset.sikker = '1'; b.textContent = 'Slet helt?'; b.classList.add('adm-fare'); setTimeout(() => { if (b.isConnected) { b.dataset.sikker = ''; b.textContent = 'Slet'; b.classList.remove('adm-fare'); } }, 4000); return; }
    b.disabled = true;
    const r = await kald('/admin/api/ravnepost', { method: 'POST', body: JSON.stringify({ id, handling: h }) });
    if (!r.ok) { status(rpSt, r.message, true); b.disabled = false; return; }
    status(rpSt, `Brev ${id}: ${h === 'godkend' ? 'godkendt' : h === 'afvis' ? 'afvist' : 'slettet'}.`); hentRp();
  });

  /* ── Tingsvad Tidende ── */
  const av = $('#adm-av'), avSt = $('#adm-av-status');
  const datoKort = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Copenhagen' }); } catch (e) { return d; } };
  async function hentAv(besked) {
    const r = await kald('/admin/api/aviser');
    if (!r.ok) { status(avSt, r.status === 403 ? 'Ikke logget ind som administrator.' : r.message, true); return; }
    const { udgaver, idag } = r.data;
    status(avSt, (besked ? besked + ' ' : '') + (udgaver.length ? `${udgaver.length} udgave${udgaver.length === 1 ? '' : 'r'} tilbage.` : 'Ingen udgaver trykt endnu.'));
    av.innerHTML = udgaver.map(u => `<li data-date="${esc(u.date)}" data-lang="${esc(u.lang)}"><div><b>${esc(u.title || '(uden overskrift)')}</b> <span class="note">· ${esc(datoKort(u.date))}${u.date === idag ? ' (i dag)' : ''} · ${u.lang === 'en' ? 'engelsk' : 'dansk'} · <a href="/${u.lang === 'en' ? 'en/experiences/machine-park/the-paper' : 'oplevelser/maskinparken/tidende'}/?dato=${esc(u.date)}" target="_blank" rel="noopener">læs</a></span></div><button type="button" class="knap sek adm-slet-avis">Slet</button></li>`).join('');
  }
  av.addEventListener('click', async e => {
    const b = e.target.closest('.adm-slet-avis'); if (!b) return;
    const li = b.closest('li'), date = li.dataset.date, lang = li.dataset.lang;
    if (b.dataset.sikker !== '1') { b.dataset.sikker = '1'; b.textContent = 'Slet udgaven?'; b.classList.add('adm-fare'); setTimeout(() => { if (b.isConnected) { b.dataset.sikker = ''; b.textContent = 'Slet'; b.classList.remove('adm-fare'); } }, 4000); return; } // to tryk, ingen browser-dialog
    b.disabled = true;
    const r = await kald('/admin/api/aviser', { method: 'POST', body: JSON.stringify({ date, lang, handling: 'slet' }) });
    if (!r.ok) { status(avSt, r.message, true); b.disabled = false; return; }
    hentAv(`Udgaven fra ${datoKort(date)} (${lang === 'en' ? 'engelsk' : 'dansk'}) er slettet.` + (r.data && r.data.genoptrykkes ? ' Cron trykker en ny ved næste kørsel.' : ''));
  });

  hentGb(); hentRp(); hentAv();
})();
