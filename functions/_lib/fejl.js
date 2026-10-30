// Tingets fejltavle (runde 10): fejl svarer i tone til mennesker og struktureret til maskiner.
// Samme forhandling som Cloudflares egne fejlsider: Accept: application/problem+json → RFC 9457, application/json → JSON,
// text/markdown → Markdown med frontmatter, alt andet → HTML (404.html gennem middlewaren). /api/* svarer altid JSON.
import { naegl } from './markdown.js';
import { siteOrigin } from '../../shared/origin.js';
export const FEJL = {
  404: { code: 'not_found', retryable: false,
    da: { titel: 'Udsat', tekst: 'Siden er ført til protokols, men ikke fundet. Mímir husker ikke hvor. Sagen er udsat.', goer: 'Gå til en af tingets fem sider herunder, eller søg i arkivet.' },
    en: { titel: 'Adjourned', tekst: 'The page has been entered in the minutes, but not found. Mímir does not remember where. The matter is adjourned.', goer: 'Go to one of the thing’s five pages below, or look in the archive.' } },
  503: { code: 'unavailable', retryable: true, retryAfter: 30,
    da: { titel: 'Tinget holder pause', tekst: 'Maskinerne svarede ikke. Det er ikke din skyld; tågen er tættere end sædvanlig.', goer: 'Prøv igen om lidt. Siderne selv er statiske og virker stadig.' },
    en: { titel: 'The thing is taking a break', tekst: 'The machines did not answer. It is not your fault; the fog is thicker than usual.', goer: 'Try again in a moment. The pages themselves are static and still work.' } },
  500: { code: 'internal', retryable: true, retryAfter: 30,
    da: { titel: 'Noget gik i stykker', tekst: 'Et tandhjul i maskinrummet faldt af. Gudrun har noteret det.', goer: 'Prøv igen om lidt.' },
    en: { titel: 'Something broke', tekst: 'A cog in the machine room fell off. Gudrun has made a note.', goer: 'Try again in a moment.' } },
};
export const FORSLAG = {
  da: [['Vadestedet', '/'], ['Historien', '/historien/'], ['Oplevelser', '/oplevelser/'], ['Arkivet', '/arkivet/'], ['Maskinrummet', '/maskinrummet/']],
  en: [['The ford', '/en/'], ['History', '/en/history/'], ['Experiences', '/en/experiences/'], ['Archive', '/en/archive/'], ['Machine room', '/en/machine-room/']],
};

/** 'html' | 'markdown' | 'json' | 'problem' ud fra Accept (og /api/* → aldrig html). */
export function fejlFormat(request, sti) {
  const t = naegl(request.headers.get('accept'), ['text/html', 'text/markdown', 'application/problem+json', 'application/json']);
  const api = sti.startsWith('/api/');
  if (t === 'application/problem+json') return 'problem';
  if (t === 'application/json' || (api && t === 'text/html')) return 'json';
  if (t === 'text/markdown') return 'markdown';
  return 'html';
}

export function fejlData(status, sti, lang, extra = {}, ORIGIN = siteOrigin()) {
  const f = FEJL[status] || FEJL[status >= 500 ? 500 : 404];
  const t = f[lang];
  return {
    type: `${ORIGIN}/maskinrummet/#fejltavle`, title: t.titel, status, detail: t.tekst, instance: sti.slice(0, 200),
    code: f.code, retryable: f.retryable, ...(f.retryAfter ? { retry_after: f.retryAfter } : {}), lang,
    what_to_do: t.goer, suggestions: FORSLAG[lang].map(([title, p]) => ({ title, url: ORIGIN + p })), ...extra,
  };
}

/** Struktureret fejlsvar, eller null når formatet er html (så middlewaren selv tegner 404-siden). */
export function struktureretFejl(request, status, extra = {}, env = null) {
  const url = new URL(request.url);
  const lang = url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'da';
  const fmt = fejlFormat(request, url.pathname);
  const d = fejlData(status, url.pathname, lang, extra, siteOrigin(env, request));
  const h = { 'cache-control': 'no-store', vary: 'Accept', 'x-content-type-options': 'nosniff' };
  if (d.retry_after) h['retry-after'] = String(d.retry_after);
  if (fmt === 'problem') return new Response(JSON.stringify(d), { status, headers: { ...h, 'content-type': 'application/problem+json; charset=utf-8' } });
  if (fmt === 'json') {
    // Sitets egen fejlkontrakt ({ok:false, code, message, retryAfter?}) plus problem-felterne.
    const j = { ok: false, code: d.code, message: d.detail, ...(d.retry_after ? { retryAfter: d.retry_after } : {}), ...d };
    return new Response(JSON.stringify(j), { status, headers: { ...h, 'content-type': 'application/json; charset=utf-8' } });
  }
  if (fmt === 'markdown') {
    const fm = ['---', `http_status: ${status}`, `error_code: ${d.code}`, `error_category: ${status >= 500 ? 'site' : 'request'}`, `retryable: ${d.retryable}`];
    if (d.retry_after) fm.push(`retry_after: ${d.retry_after}`);
    fm.push(`instance: ${JSON.stringify(d.instance)}`, `lang: ${lang}`, `timestamp: ${new Date().toISOString()}`, '---', '');
    const hv = lang === 'en' ? ['What happened', 'What you can do'] : ['Hvad skete der', 'Hvad du kan gøre'];
    const md = fm.join('\n') + `\n# ${d.title}\n\n## ${hv[0]}\n\n${d.detail}\n\n## ${hv[1]}\n\n${d.what_to_do}\n\n` + d.suggestions.map(s => `- [${s.title}](${s.url})`).join('\n') + '\n';
    return new Response(md, { status, headers: { ...h, 'content-type': 'text/markdown; charset=utf-8', 'x-markdown-tokens': String(Math.ceil(md.length / 4)) } });
  }
  return null;
}

/** Nødside, når selv 404.html ikke kan hentes (fx et nedbrud i Pages). Ingen eksterne filer. */
export function noedside(status, lang) {
  const d = fejlData(status, '/', lang);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(d.title)} · Tingsvad</title><meta name="robots" content="noindex"><style>body{margin:0;min-height:100vh;display:grid;place-content:center;text-align:center;background:#111417;color:#e8e9e3;font:1.1rem/1.6 Georgia,serif;padding:2rem}h1{color:#d9a441;font-size:3rem;margin:.2em 0}a{color:#ffd98a}</style></head><body><main><p>${status}</p><h1>${esc(d.title)}</h1><p>${esc(d.detail)}</p><p>${esc(d.what_to_do)}</p><p>${d.suggestions.map(s => `<a href="${esc(s.url)}">${esc(s.title)}</a>`).join(' · ')}</p></main></body></html>`;
}
