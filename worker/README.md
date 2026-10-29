# tingsvad-ting-ai — operations guide

The Worker behind `/api/ting-ai/*` on tingsvad.dk: the thing’s machine park (C01–C08). The site Worker `tingsvad-site` (`site-worker/`, round 11; before that the Pages project) calls this Worker through the service binding `TING_AI` (`functions/api/ting-ai/[[path]].js`). Without the binding, the site answers `{ok:false, code:"not_configured"}` and the frontend shows labelled editorial examples.

## Bindings (wrangler.toml)

| Binding | Type | Resource | Status |
|---|---|---|---|
| `AI` | Workers AI | — | requires Workers AI enabled on the account |
| `DB` | D1 | `tingsvad-ting-ai` (WEUR) | create with `npx wrangler d1 create`, put the id in wrangler.toml, apply migrations |
| `MEDIA` | R2 | `tingsvad-ting-ai-media` | `npx wrangler r2 bucket create tingsvad-ting-ai-media` |
| `TING_ROOM` | Durable Object | class `TingRoom` (SQLite-backed, migration v1) | created on first deploy |
| `CHAIR_CASES` | Workflow | `tingsvad-chair-cases` → `ChairCaseWorkflow` | created on first deploy |
| Cron | `17 * * * *` (UTC) | daily paper + radio with a date guard in Europe/Copenhagen | — |
| `RL`, `RL_STRICT` | Rate limiting | namespace 1001 (8/min) and 1002 (3/min) | no setup; D1 counter as fallback |
| `IMAGES` | Images | — | enable Transformations for the zone (free up to 5,000/month); without it uploads pass through unchanged |
| `BROWSER` | Browser Run | — | og-images (`og/sag/:nr.png`) and PDF (`pdf/protokol`); falls back to a static image/page on error |
| `VECTORS` | Vectorize | `tingsvad-kanon` (1024 dims, cosine) | **create before deploy:** `npx wrangler vectorize create tingsvad-kanon --dimensions=1024 --metric=cosine` |
| `SAGER` | KV | `tingsvad-sager` | read for og-images |
| `FORGE_QUEUE` | Queues (optional; on Workers Free since Feb 2026, 10,000 operations/day) | `tingsvad-forge` | `npx wrangler queues create tingsvad-forge`, then uncomment in wrangler.toml |
| `RAVN_QUEUE` | Queues (round 9) | `tingsvad-ravn` (+ dead-letter `tingsvad-ravn-dlq`) | **create before deploy:** `npx wrangler queues create tingsvad-ravn && npx wrangler queues create tingsvad-ravn-dlq` |
| `RAVN` | Workflow (round 9) | `tingsvad-ravn` → `RavnWorkflow` | created on deploy; one instance per (job, attempt) |
| `REVISION` | Workflow (round 9) | `tingsvad-revision` → `RevisionWorkflow` | created on deploy; started by Cron once a day from 06:00 Europe/Copenhagen |
| `CHAIR_ROOM` | Durable Object (round 9) | class `ChairRoom` (SQLite-backed, migration v2) | created on deploy; the shared stool |
| `email()` handler | Email Workers (round 9) | `brev@sitesite.dk` | **setup:** `npm i` (installs `postal-mime`); Email Routing on the separate zone `sitesite.dk` (never on `tingsvad.dk` – Email Routing is zone-wide and would take the family's MX), rule `brev@sitesite.dk` → this Worker; `RAVNEPOST_AKTIV = "true"` |
| `TAEL` | Workers Analytics Engine (round 10) | dataset `tingsvad_taelle` (`TAELLE_DATASET`; preview `tingsvad_taelle_preview`) | none: created by the first write. The site Worker writes page views to the same dataset |
| `ANALYTICS_SQL` | Analytics SQL binding (round 10) | `[analytics]` in wrangler.toml | **Wrangler ≥ 4.145**; no API token. Reads the counting works for `GET taelle` (cached five minutes per isolate) |
| AI Gateway | var `AI_GATEWAY_ID = "tingsvad"` | — | create the gateway `tingsvad` under AI → AI Gateway (logs off recommended; the binding authenticates automatically); empty string = direct calls |
| Turnstile | secret `TURNSTILE_SECRET` + var `TURNSTILE_HOSTNAMES` | widget (Managed) | create the widget under Turnstile; put the site key in `site-worker/wrangler.toml` as `TURNSTILE_SITEKEY`; set the secret on the site Worker (`cd site-worker && npx wrangler secret put TURNSTILE_SECRET`, and `npx wrangler preview base-config secret put TURNSTILE_SECRET` for its previews) and here |

## Secrets (names only, never values in the repo)

- `SESSION_SECRET` — HMAC key for the session cookie (`tv_sid`). **Required in production**; without it unsigned cookies are accepted (local development only).
- `TTS_API_KEY`, `TTS_ENDPOINT` — only when `TTS_PROVIDER = "external"` (Danish narration via an external provider).
- `TURNSTILE_SECRET` — Turnstile secret key. Without it the check is skipped (forms work, but without bot protection).

```sh
cd worker
npx wrangler secret put SESSION_SECRET      # e.g. openssl rand -hex 32
```

## First deploy

```sh
cd worker
npm install
npx wrangler login
npx wrangler d1 migrations apply tingsvad-ting-ai --remote   # idempotent
npx wrangler deploy
```

The site Worker binds it in `site-worker/wrangler.toml` (`[[services]]` → `tingsvad-ting-ai`, and `[[previews.services]]` → `tingsvad-ting-ai-preview`, since a Worker Preview's service binding always calls the bound Worker's production deployment). Redeploy the site Worker (or push). The preview Worker's `SITE_ORIGIN` points at the site Worker's branch preview (`https://runde-9-tingsvad-site.jan-9ea.workers.dev`).

`GET https://tingsvad.dk/api/ting-ai/health` shows which parts are connected (`configured.ai`, `db`, `media`, `room`, `cases`, `forge`, `vision_upload`, `tts`, `tts_danish`, `session_secret`, `gateway`, `ratelimit`, `images`, `archive`, `render`, `queue`, `turnstile`).

## Vars (wrangler.toml)

Models: `TEXT_MODEL`, `VISION_MODEL`, `IMAGE_MODEL`, `TTS_MODEL`, `TTS_VOICE`, `EMBED_MODEL`. Daily quotas for the whole site: `QUOTA_TEXT_PER_DAY` (50), `QUOTA_IMAGE_PER_DAY` (5), `QUOTA_AUDIO_PER_DAY` (2), `QUOTA_EDITION_TEXT_PER_DAY` (6, reserved for the paper). `RATE_PER_MINUTE` (8 per session per endpoint). `CASE_DELAYS_SECONDS` (60,7200,86400). `ROUND_SECONDS` (30). `VISION_UPLOAD_ENABLED` (false → sample tray only). `TTS_PROVIDER` (`none` | `workers-ai` | `external`; `workers-ai` is English only). The numbers are operating examples; check actual usage in the Workers AI dashboard after a small live test.

## API contract

Success `{ok:true, source:"ai"|"editorial"|"server", requestId, data}`; error `{ok:false, code, message, retryAfter?}`. Codes: `bad_request`, `too_long`, `quota`, `rate_limited`, `provider_error`, `invalid_output`, `not_found`, `forbidden`, `conflict`, `in_progress`, `not_configured`.

| Endpoint | Function |
|---|---|
| `GET taelle?lang=` | the counting works: last 24 h totals by kind, hourly page views/calls, data centres, busiest endpoints, 7-day events (`source: server` / `cached`; `tilstand: skriver` when only writing) |
| `POST court` `{argument,lang}` / `{roundRef,reply,lang}` | C01 — three statements + minutes; one reply per round (20 min) |
| `POST vision` JSON `{galleryId}` or multipart `file` | C04 — description + Gudrun's fictional assessment (separate calls) |
| `POST guide` `{question,spoilerLevel,knownFragments,lang}` | C07 — the server picks the hint before the model call; archive excerpts from Vectorize |
| `GET news?lang=` | C03 — latest published edition; never generates |
| `POST forge` `{object,site,condition,lang}` + `Idempotency-Key` | C05 — cache on (choices, language, prompt version, model); 202 when queued |
| `GET forge/:ref`, `GET forge/image/:key` | status / image from R2 |
| `POST jobs` `{wishes,lang,turnstile}` + `Idempotency-Key` | C06 — creates a case + Workflow; replies with a private `token` |
| `GET jobs/:id?token=` | status; requires the token (the case number alone gives 403) |
| `GET room/ws?room=vadestedet` | C02 — WebSocket; messages `hello`, `join{slot}`, `vote{vote}`, `leave`; replies `snapshot`/`error` |
| `POST ravn` `{kind:'sagsmappe',data,lang,turnstile}` | Raven exchange — same owner + same input returns the same job (`x-tingsvad-cache: hit`); replies with a private `token` |
| `GET ravn/:id?token=`, `GET ravn/:id/fil?token=`, `POST ravn/:id/igen?token=` | status / PDF from R2 / controlled restart of a failed job (max 3 attempts) |
| `GET revision?lang=`, `GET revision/billede/:date/:page` | Gudrun's latest audit of all 18 pages / screenshot from R2 |
| `GET stol/ws` | the shared stool — WebSocket; messages `hello`, `move{dx,dy}`; replies `snapshot`/`error` |
| `POST hittegods` `{q,lang}` | lost property — Vectorize search in a fixed catalogue (namespaces `hittegods-da/-en`) |
| `POST oevelse` `{kind:'timeout'|'dublet'|'reconnect',lang}` | emergency drills — simulations against fake services, `source:"simulation"` |
| `GET ravnepost?lang=` | approved public raven post (subject, excerpt, time; never the sender) |
| `GET radio?lang=`, `GET radio/audio/:date/:lang` | C08 — script (+ audio file from R2 with Range) |
| `GET og/sag/:nr.png` | Browser Run: 1200×630 og-image for a shared case, cached in R2 |
| `GET pdf/protokol?lang=` | Browser Run: the minutes as PDF, once per day per language |

Sessions: cookie `tv_sid` (HttpOnly, SameSite=Lax, Path=/api/ting-ai). `/health` sets it; the WebSocket requires it, so a reconnect gives the same seat and no extra vote.

## Local development

```sh
cd worker && npm install
npm test                                   # node --test: quotas, idempotency, room logic, dates, case flow, cron lock
npx wrangler d1 migrations apply tingsvad-ting-ai --local
npx wrangler dev --port 8787               # Browser Run quickAction needs --remote; AI needs a logged-in account
```

Cron locally: `curl -X POST 'http://localhost:8787/cdn-cgi/local/explorer/api/local/scheduled?worker=tingsvad-ting-ai' -H 'content-type: application/json' -d '{"cron":"17 * * * *"}'`. Set `CASE_DELAYS_SECONDS = "5,5,5"` and `ROUND_SECONDS = "8"` in a local copy of wrangler.toml for fast runs.

## Security and data

- All AI text is validated against a schema (`lib/validate.js: conform`) and escaped in the browser; AI output never becomes HTML, SQL or tool calls.
- The canon and system instructions are kept apart from guest input (guest text is quoted as content in the scene).
- Quotas are reserved before the provider call with a 90 s lease; a provider timeout triggers no new generation.
- Uploads (C04): signature and dimensions are checked server-side; SVG and remote URLs are rejected; the file is not stored.
- Courtroom rounds are deleted after 20 min; idempotency keys after 24 h; no complete conversations are stored.
- Logs: requestId, endpoint, model, duration, error code. No raw guest text or uploads. AI Gateway logging is off for the same reason.

## Mímir's archive (Vectorize)

The corpus lives in `src/lib/corpus.js` (da/en, with a source per excerpt). On the first call after a new `CORPUS_VERSION` it is indexed automatically (job lock in D1), about 40 embeddings with `@cf/baai/bge-m3`. Questions are embedded and looked up in the language's namespace; the 3 best excerpts (score ≥ 0.45) are given to the model as the only permitted source of facts. Puzzle hints are still chosen by the server (`lib/canon.js`), and the solutions are not in the corpus. Edit the text → bump `CORPUS_VERSION` → deploy. New vectors become queryable after a minute or two.

Alternative: Cloudflare AI Search (managed RAG over R2). Not chosen here because the corpus is small and curated.

## Known limitations

- There is no Danish TTS in Workers AI. `TTS_PROVIDER=workers-ai` (`aura-2-en`, speaker `TTS_VOICE`) gives the English broadcast audio; the Danish one is script-only with a pointer to /en/, until `TTS_PROVIDER=external` is configured and quality-tested.
- The image model (`flux-1-schnell`) does not necessarily hit the pack's painterly style; test with a few examples and adjust the prompt in `features/forge.js`.
- Llama 3.2 Vision requires accepting Meta's license (first call with `prompt: "agree"`), otherwise C04 fails with `provider_error` and falls back to editorial examples for the sample tray. A throwaway config for this: `.wrangler/agree/` (gitignored), run with `npx wrangler dev --remote -c .wrangler/agree/wrangler.toml`.
