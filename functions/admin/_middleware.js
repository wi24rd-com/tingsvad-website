// /admin/* på Pages (tilbagefald under runde 11's overgang). Logikken bor i ../_lib/admin.js og deles med site-Workeren.
import { adminVagt } from '../_lib/admin.js';
export const onRequest = ctx => adminVagt(ctx);
