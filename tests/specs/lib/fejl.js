// Samler side- og konsolfejl samt HTTP-fejl fra sitets egne filer. Tredjepartsfejl i »ignorerFejl« tæller ikke.
const K = require('./konfig');
const ignoreret = t => K.ignorerFejl.some(r => r.test(t));

function lytEfterFejl(page) {
  const fejl = [];
  page.on('pageerror', e => { const t = e.message + ' ' + (e.stack || ''); if (!ignoreret(t)) fejl.push('pageerror: ' + e.message); });
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const url = (m.location() && m.location().url) || '', t = m.text();
    if (ignoreret(url + ' ' + t)) return;
    if (/Content Security Policy|Refused to/.test(t) && !K.egneFiler.test(url)) return;
    fejl.push('console: ' + t.slice(0, 200) + (url ? ' @ ' + url : ''));
  });
  page.on('response', r => { const u = r.url(); if (r.status() >= 400 && K.egneFiler.test(u) && !/\/api\//.test(u)) fejl.push(`HTTP ${r.status()} ${u}`); });
  return fejl;
}

/** Åbner en side uden at vente på tredjeparts-iframes (fx en captcha), og giver sidens egne scripts et øjeblik. */
async function aabn(page, sti) {
  const svar = await page.goto(sti, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(600);
  return svar;
}
module.exports = { lytEfterFejl, aabn };
