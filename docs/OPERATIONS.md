# Operations: running tingsvad.dk

What to do when something breaks, how to get the data back, and what costs money. Written for the one person who runs the site, but it applies to any copy of it (see [BUILD-YOUR-OWN.md](BUILD-YOUR-OWN.md)). Commands run from the repository root unless a directory is given; `npx wrangler` needs a login (`npx wrangler login`) or `CLOUDFLARE_API_TOKEN`.

## The moving parts

| Worker | Directory | Deployed by | Data it owns |
|---|---|---|---|
| `tingsvad-site` | `site-worker/` | Workers Builds on push to `main` (previews for other branches) | nothing durable – KV `SAGER` holds only pacing keys |
| `tingsvad-ting-ai` | `worker/` | `npm run deploy` by hand, after D1 migrations | D1 `tingsvad-ting-ai`, R2 `tingsvad-ting-ai-media`, KV `SAGER` (shared), Vectorize `tingsvad-kanon`, four Durable Object classes, Workflows |
| `tingsvad-ting-ai-preview` | `worker/` with `--env preview` | by hand | its own D1/KV/R2/Vectorize, so previews never touch production data |
| `tingsvad-mcp` | `mcp/` | by hand | nothing – it calls ting-ai over a service binding |
| EU cabinet | inside ting-ai | – | D1 `tingsvad-eu-skab`, KV `EU_KV`, R2 `tingsvad-eu-skab`, all created with `--jurisdiction eu` |

Every deployed version answers with its commit in `/api/kant` (the site) and `/api/ting-ai/health` (ting-ai) under `release`, so you can always see what is running.

## Backup

Nothing here is irreplaceable except the guestbook and the raven post; everything else is regenerated (newspaper editions, audit rows, statistics) or lives in git. Still:

- **D1** (the one that matters): `cd worker && npx wrangler d1 export tingsvad-ting-ai --remote --output ../backup/ting-ai-$(date +%F).sql`. The EU database the same way with `tingsvad-eu-skab`. A full export is a few megabytes; keep the last few outside the repository (`backup/` is git-ignored – add it if you create it).
- **KV**: nothing in `SAGER` needs backing up since round 13 (the guestbook moved to D1); the finished overviews for the numbers page are rebuilt every hour. If you want a copy anyway: `npx wrangler kv key list --namespace-id <id> --remote` and `kv key get` per key.
- **R2** `tingsvad-ting-ai-media`: newspaper audio, raven documents, audit screenshots (90-day lifecycle rule) and the EU seals' files. Copy with `npx wrangler r2 object get <bucket>/<key>` per object, or use rclone against the S3 API with an R2 token. Losing it costs you old audio and old documents; the site keeps working.
- **Durable Objects** (the vote room, the stool, the radio station, the EU cabinet) hold small state in their own SQLite. There is no export; the stool's position and the vote's seats are not worth one.
- **Secrets** are not exportable. Keep the list below in a password manager so a fresh Worker can be configured again.

## Restore

- **A page or a script**: `git revert` or `git checkout <commit> -- <path>`, `npm run prep`, push. Workers Builds deploys `main`.
- **A Worker version**: `cd site-worker && npx wrangler rollback` (or `cd worker && npx wrangler rollback`) lists recent versions and rolls back to one in seconds; bindings and secrets are unchanged by a rollback. For ting-ai, roll the D1 migration back by hand if the version you return to predates it (migrations are forward-only; see below).
- **D1 from an export**: `npx wrangler d1 execute tingsvad-ting-ai --remote --file backup/ting-ai-<date>.sql` into an empty database (create a new one, point `database_id` at it, deploy). Do not import on top of a live database.
- **The guestbook alone**: the table `gaestebog` keeps deleted cases as rows without text, so a wrongly deleted case can be put back by an `UPDATE … SET slettet = NULL` with the text from the export.

## Migrations

D1 migrations live in `worker/migrations/` and are applied once, in order, tracked in the database's `d1_migrations` table. Before every ting-ai deploy that adds one:

```
cd worker
npx wrangler d1 migrations apply tingsvad-ting-ai-preview --remote --env preview
npx wrangler d1 migrations apply tingsvad-ting-ai --remote
```

Preview first, production second. A migration that fails halfway leaves D1 in the state before it (each file runs as one transaction). Never edit an applied migration; add a new one. The unit tests run every migration against an in-memory SQLite, so a broken file fails `npm test` before it reaches D1.

## When a secret is missing

Every feature checks its bindings and secrets in `health` and **fails closed**: it answers »not connected« in the site's voice instead of half-working. What each one does without its secret:

| Secret (Worker) | Without it |
|---|---|
| `SESSION_SECRET` (ting-ai) | production refuses to start a session; the AI machines, the vote and the stool answer 503 |
| `TURNSTILE_SECRET` (site Worker and ting-ai) | the guestbook answers 503 `not_configured` in production (previews may run without) |
| `ADMIN_EMAILS` (site Worker and ting-ai) | `/admin/` refuses everyone, even with a valid Access login |
| `GITHUB_TOKEN` (ting-ai) | Gudrun's audit runs but opens no GitHub issues |
| `CF_ANALYTICS_TOKEN`, `CF_ZONE_ID`, `CF_ACCOUNT_ID`, `RUM_SITE_TAG` (ting-ai) | the numbers page shows the marked snapshot instead of live figures |
| `REALTIME_SFU_TOKEN` (ting-ai) | the live radio block does not appear; the MP3 still plays |
| `GUDRUN_WEBHOOK_SECRET` (ting-ai) | the Workers Issues webhook is refused |
| `BEVIS_NOEGLE` (ting-ai, optional) | a signing key is generated on first use and kept in KV |
| `MCP_SALT` (mcp, optional) | MCP client ids are a plain hash of IP and date instead of an HMAC |
| `SITE_ORIGIN`, `TURNSTILE_HOSTNAMES` (preview ting-ai) | the preview audits tingsvad.dk instead of itself, and refuses preview Turnstile tokens |

Set one with `npx wrangler secret put NAME` in the Worker's directory (`--env preview` for the preview ting-ai; `npx wrangler preview base-config secret put NAME` for the site Worker's previews). Secrets survive deploys and rollbacks.

## Emergency stop

If a feature runs away (a quota bug, an abusive client, a provider charging unexpectedly), the fastest brake is the KV key `NOEDSTOP` in the `SAGER` namespace: `npx wrangler kv key put NOEDSTOP 1 --namespace-id <id> --remote`. While it exists, ting-ai answers every `/api/ting-ai/*` call except `health` with 503 in tone (»The thing is taking a break«), the cron does nothing, and the site's static pages keep working. The administration page has a button for it. Delete the key to resume. Daily caps per feature live in `worker/src/lib/budget.js`; lower a number there and deploy for a softer brake.

## Costs and what to watch

| Item | Where it shows | What keeps it in check |
|---|---|---|
| Workers requests and CPU | Workers & Pages → the Worker → Metrics | `[limits] cpu_ms` in both wrangler.toml files; rate limits in two layers |
| Workers AI | AI → Workers AI → usage | daily caps in `budget.js`, per-session and per-IP rate limits, MCP per-client allowance |
| AI Search (the archive) | AI → AI Search → the instances | the archive's daily cap; the sync uploads at most 40 pages per run |
| Browser Run (audit, documents, share images) | Browser Run → usage | unchanged pages are not re-opened (hash reuse), full runs only on Mondays, a concurrency cap of four |
| D1 reads/writes | Storage & databases → D1 | small; the audit's rows are kept 90 days |
| R2 storage | R2 → the bucket | lifecycle rule: `revision/` objects expire after 90 days |
| Observability (logs, traces) | Observability → usage | head sampling 5 % (site) / 20 % (ting-ai); invocation logs off when not debugging |
| AI Gateway / Web Search | AI → AI Gateway | the »abroad« column's own daily cap |

Set a **billing notification** under Billing → Notifications for the account. Look at the usage pages on the first of the month; the two scheduled reminders in the project (AI Search on 1 November, Observability on 1 December) exist because those two are the ones whose pricing changed most recently.

## Dependencies

Dependabot opens pull requests for `wrangler`, `postal-mime`, the Playwright suite and the GitHub Actions (all actions are pinned to a commit SHA). Merge them when the quality run is green; a wrangler bump is worth a local `npx wrangler deploy --dry-run` in each Worker directory first. `package-lock.json` is committed in every directory, and CI installs with `npm ci`.

## The weekly glance

1. The audit page: green, with today's date and the right release id.
2. Workers & Pages → tingsvad-site → Deployments: the last build green.
3. GitHub → Actions: the last quality run green on `main`.
4. The numbers page: the four boards updated within the hour.
5. Billing → usage: nothing surprising.
