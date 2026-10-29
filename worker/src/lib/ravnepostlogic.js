// Ravnepost (runde 9): ren logik uden afhængigheder (testes i Node). Fjerner citater, links og adresser fra uddraget.
const OFFENTLIG = /^\s*\[(offentlig|public)\]\s*/i;

/** Ren funktion: gør et parset brev til det, der må gemmes. */
export function tilBrev({ to, subject, text, html }) {
  const local = String(to || '').toLowerCase().split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 32) || 'ukendt';
  const rå = String(subject || '').replace(/[\u0000-\u001f]/g, ' ').trim();
  const offentlig = OFFENTLIG.test(rå);
  const emne = rå.replace(OFFENTLIG, '').slice(0, 120) || '(uden emne)';
  const brødtekst = (text || String(html || '').replace(/<style\b[\s\S]*?<\/style[^>]*>|<script\b[\s\S]*?<\/script[^>]*>/gi, ' ').replace(/<[^>]*>?/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'))
    .split(/\r?\n/).filter(l => !/^\s*>/.test(l)).join(' ').replace(/https?:\/\/\S+/g, '[link]').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[adresse]').replace(/\s+/g, ' ').trim();
  return { local, emne, uddrag: brødtekst.slice(0, 400), offentlig };
}

