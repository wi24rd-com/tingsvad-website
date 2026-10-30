// Admin: gæstebogen. GET → alle gæstesager (grundsagerne kan ikke slettes og vises ikke her) + de seneste sletninger.
// DELETE ?nr=980-0004 → sagens tekst fjernes i D1; nr, tidspunkt og hvem bliver stående (runde 13, AP7 – før KV).
import { fail } from '../../../shared/svar.js';
import { NR } from '../../../shared/gaestebog.js';
import { internSvar } from '../../_lib/ting.js';

export async function onRequestGet({ env }) {
  return internSvar(env, 'gaestebog/admin');
}

export async function onRequestDelete({ request, env, data }) {
  const nr = new URL(request.url).searchParams.get('nr') || '';
  if (!NR.test(nr)) return fail('bad_request', 'Ugyldigt sagsnummer.', 400);
  return internSvar(env, 'gaestebog?nr=' + nr, { method: 'DELETE', headers: { 'x-tingsvad-admin': (data && data.admin && data.admin.email) || '' } });
}
