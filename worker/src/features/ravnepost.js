// Ravnepost (runde 9): Email Worker for brev@sitesite.dk. Familiens MX på tingsvad.dk (one.com) røres aldrig. Email Routing er
// zone-bredt, så ravneposten bor på det gamle, ellers ubrugte domæne sitesite.dk (regel brev@ → denne Worker). Ingen videresendelse, intet autosvar, ingen afsenderadresse gemt.
import PostalMime from 'postal-mime';
import { ok, langOf, ApiError, readJson } from '../lib/http.js';
import { verificerAccess } from '../../../functions/_lib/access.js';
import { sha256Hex, randomId } from '../lib/crypto.js';
import { tilBrev } from '../lib/ravnepostlogic.js';

export const RAVNEPOST_DOMÆNE = 'sitesite.dk';
const MAX_BYTES = 256 * 1024, PR_TIME = 5;
/** export default { email } i index.js kalder denne. */
export async function modtagBrev(message, env, ctx) {
  const to = String(message.to || '').toLowerCase();
  if (!to.endsWith('@' + RAVNEPOST_DOMÆNE)) { message.setReject('Ravnen kender ikke den adresse.'); return; }
  if (message.rawSize > MAX_BYTES) { message.setReject('Brevet er for tungt til ravnen (højst 256 KB).'); return; }
  if (!env.DB) { message.setReject('Ravnepost er ikke tilsluttet.'); return; }
  const afsender = await sha256Hex('ravnepost:' + String(message.from || '').toLowerCase() + ':' + (env.SESSION_SECRET || ''));
  const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM ravn_post WHERE sender_hash = ? AND received_at >= ?').bind(afsender, new Date(Date.now() - 3_600_000).toISOString()).first();
  if (n && n.n >= PR_TIME) { message.setReject('Ravnen har fløjet nok for dig i denne time.'); return; }
  let parsed = {};
  try { parsed = await PostalMime.parse(message.raw); } catch (e) { parsed = { subject: message.headers.get('subject') || '' }; }
  const b = tilBrev({ to, subject: parsed.subject, text: parsed.text, html: parsed.html });
  await env.DB.prepare('INSERT INTO ravn_post (id, received_at, to_local, subject, uddrag, public_request, approved, sender_hash, size) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)')
    .bind('P-' + randomId(6).toUpperCase(), new Date().toISOString(), b.local, b.emne, b.uddrag, b.offentlig ? 1 : 0, afsender, message.rawSize | 0).run();
  console.log(JSON.stringify({ event: 'ravnepost_received', to: b.local, offentlig: b.offentlig, bytes: message.rawSize }));
}

/** GET ravnepost?lang= → godkendte offentlige breve (emne, uddrag, tid) og tællere. Aldrig afsendere. */
export async function getRavnepost(request, env, ctx) {
  const lang = langOf(new URL(request.url).searchParams.get('lang'));
  const breve = (await env.DB.prepare('SELECT subject, uddrag, received_at FROM ravn_post WHERE approved = 1 AND public_request = 1 ORDER BY received_at DESC LIMIT 10').all()).results || [];
  const tal = await env.DB.prepare('SELECT COUNT(*) AS i_alt, SUM(public_request = 1 AND approved = 0) AS venter FROM ravn_post').first();
  return ok({ aktiv: env.RAVNEPOST_AKTIV === 'true', adresse: `brev@${RAVNEPOST_DOMÆNE}`, breve: breve.map(b => ({ emne: b.subject, uddrag: b.uddrag, modtaget: b.received_at })), iAlt: (tal && tal.i_alt) || 0, venter: (tal && tal.venter) || 0, lang }, 'server');
}

/** Admin (kun med gyldig Cloudflare Access-login): GET → de seneste 100 breve; POST {id, handling} → godkend/afvis/slet.
 *  Afsenderen findes ikke i databasen (kun som hash) og vises derfor heller ikke her. */
export async function adminRavnepost(request, env, ctx) {
  const hvem = await verificerAccess(request, env);
  if (!hvem) throw new ApiError('forbidden', 'Kun for tingets administrator.', 403);
  if (request.method === 'GET') {
    const breve = (await env.DB.prepare('SELECT id, received_at, to_local, subject, uddrag, public_request, approved, size FROM ravn_post ORDER BY received_at DESC LIMIT 100').all()).results || [];
    return ok({ breve, admin: hvem.email }, 'server');
  }
  const body = await readJson(request, 1024);
  const id = String(body.id || '');
  if (!/^P-[A-F0-9]{6,16}$/.test(id)) throw new ApiError('bad_request', 'Ugyldigt brev-id.', 400);
  const handling = body.handling;
  let r;
  if (handling === 'godkend') r = await env.DB.prepare('UPDATE ravn_post SET approved = 1 WHERE id = ?').bind(id).run();
  else if (handling === 'afvis') r = await env.DB.prepare('UPDATE ravn_post SET approved = -1 WHERE id = ?').bind(id).run();
  else if (handling === 'slet') r = await env.DB.prepare('DELETE FROM ravn_post WHERE id = ?').bind(id).run();
  else throw new ApiError('bad_request', 'Ukendt handling.', 400);
  if (!r.meta || !r.meta.changes) throw new ApiError('not_found', 'Brevet findes ikke.', 404);
  ctx.log({ event: 'ravnepost_admin', id, handling, admin: hvem.email });
  return ok({ id, handling }, 'server');
}
