// Pages Functions-indgang (tilbagefald under runde 11's overgang). Selve logikken bor i _lib/side.js og deles med
// site-Workeren (site-worker/index.js), så Pages og Workers Static Assets svarer ens.
import { sideMiddleware } from './_lib/side.js';
export { kaede } from './_lib/side.js';
export const onRequest = ctx => sideMiddleware(ctx);
