// Delbar sag: /sag/980-0007 → HTML med sagens tekst i og:title/og:description, der sender videre til gæstebogen.
// Link-previews i Messenger/Slack/LinkedIn viser dermed selve sagen.
import { onRequestGet as hentSager } from '../api/sager.js';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export async function onRequestGet(ctx) {
  const nr = ctx.params.nr;
  let sag = null;
  try { const r = await hentSager(ctx); const liste = await r.json(); sag = liste.find(s => s.nr === nr) || null; } catch (e) {}
  const titel = sag ? `Sag ${sag.nr} · ${sag.navn} · Udsat` : `Sag ${nr} · Tingsvad`;
  const besk = sag ? sag.sag : 'Sagen findes ikke i protokollen. Den er muligvis udsat.';
  const url = `https://tingsvad.dk/oplevelser/gaestebog/#sag-${encodeURIComponent(nr)}`; // gæstebogen er en underside fra runde 9
  const html = `<!doctype html><html lang="da"><head><meta charset="utf-8"><title>${esc(titel)}</title>
<meta name="robots" content="noindex"><meta property="og:type" content="article"><meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(besk)}">
<meta property="og:image" content="${ctx.env.TING_AI && /^980-\d{4}$/.test(nr) ? `https://tingsvad.dk/api/ting-ai/og/sag/${esc(nr)}.png` : 'https://tingsvad.dk/assets/vadestedet-og.jpg'}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:url" content="${esc(url)}"><meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${esc(url)}"><link rel="canonical" href="https://tingsvad.dk/oplevelser/gaestebog/"></head>
<body style="font-family:serif;background:#111417;color:#d6d9d4;padding:2rem"><p><a href="${esc(url)}" style="color:#d9a441">${esc(titel)}</a> — ${esc(besk)}</p></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
