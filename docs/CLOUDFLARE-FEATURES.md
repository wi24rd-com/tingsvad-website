# The Cloudflare features behind tingsvad.dk

tingsvad.dk is a fictional local history of a Viking-age *thing* (assembly) at a river ford, and at the same time an open, working demonstration of Cloudflare's developer platform. This page lists the features the site uses, what they do here, and a short guide so you can set them up yourself.

*Dansk udgave: [da/CLOUDFLARE-FUNKTIONER.md](da/CLOUDFLARE-FUNKTIONER.md)*

**How to read this page**
- **Used for** – what the feature does on tingsvad.dk, and where the code lives.
- **How** – the key steps. Commands are run in `worker/` (the machine Worker) or `site-worker/` (the site Worker) unless stated otherwise.
- **Plan** – *Free* is Cloudflare's free plan, *Paid* is Workers Paid (USD 5 a month plus usage), *Enterprise* is a separate agreement.
- **Watch out** – what tripped us up while building it.

Plans and prices change. Always check [Cloudflare's documentation](https://developers.cloudflare.com/) for the current details.

**Three rules throughout the project**
1. Secrets (API keys, tokens) are set with `npx wrangler secret put NAME` and never live in the repo or in a chat.
2. IDs in `wrangler.toml` (databases, KV, buckets) are addresses, not secrets. They only work with an account that owns them. Keep your account id, zone id and admin e-mail addresses out of the repo anyway – set them as secrets.
3. All AI text is labelled as fiction, validated against a schema, and never decides the cow case.

**Contents:** [Foundation](#1-the-foundation) · [Storage](#2-storage) · [AI](#3-artificial-intelligence) · [Background work](#4-background-work-and-time) · [Media and browser](#5-media-browser-and-real-time) · [Security](#6-security-and-access) · [Measurement](#7-measurement-and-observability) · [Agents and SEO](#8-agents-search-engines-and-ai-crawlers) · [Data location](#9-data-location) · [Costs](#10-costs-and-emergency-brakes)

---

## 1. The foundation

### Workers with Static Assets
- **Used for:** The whole site is one Worker, `tingsvad-site`. HTML, images and scripts are static files, and only HTML pages, `/api/*`, `/admin/*` and `/sag/*` go through the Worker code (`site-worker/`).
- **How:** In `site-worker/wrangler.toml`:
  ```toml
  [assets]
  directory = ".."
  binding = "ASSETS"
  html_handling = "auto-trailing-slash"
  run_worker_first = ["/*", "!/assets/*"]
  ```
  Files that must not be published (code, tests, `*.md`) are listed in `.assetsignore`.
- **Plan:** Free. Static files are free and do not count as requests.
- **Watch out:** `_headers` only applies to responses served straight from the static files. Responses from Worker code must set security headers themselves (see `functions/_lib/headers.js`).

### Workers Builds and Worker Previews
- **Used for:** Every push to `main` deploys the site Worker automatically. Every other branch gets its own preview address (`<branch>-tingsvad-site.<account>.workers.dev`), which the quality tests run against.
- **How:** Workers & Pages → Create → Import a repository → pick the repo, set *Root directory* to `site-worker`, deploy command `npx wrangler deploy`.
- **Plan:** Free.
- **Watch out:** If a build fails with "internal error", press *Retry build* under Deployments. That was Cloudflare, not the code.

### Service bindings
- **Used for:** The site Worker calls the machine Worker `tingsvad-ting-ai` directly in the same data centre, without going over the internet (`functions/api/ting-ai/[[path]].js`).
- **How:**
  ```toml
  [[services]]
  binding = "TING_AI"
  service = "tingsvad-ting-ai"
  ```
  In code: `env.TING_AI.fetch(request)`.
- **Plan:** Free.

### HTMLRewriter
- **Used for:** The shared top bar, navigation and footer are inserted into every page while it streams. No build step (`functions/_lib/side.js`).
- **How:** `new HTMLRewriter().on('[data-tv-del="footer"]', { element(el) { el.replace(html, { html: true }); } }).transform(res)`.
- **Plan:** Free.

### request.cf
- **Used for:** Which data centre, protocol and TLS version answered the visitor (`/api/kant`, the infrastructure map).
- **How:** `request.cf.colo`, `request.cf.httpProtocol`, `request.cf.tlsVersion`. No setup.
- **Plan:** Free.

### Custom domain, DNS, DNSSEC and HSTS
- **Used for:** tingsvad.dk points straight at the site Worker.
- **How:** `routes = [{ pattern = "tingsvad.dk", custom_domain = true }]` in `wrangler.toml`. DNSSEC: DNS → Settings → Enable DNSSEC, and add the DS record at your registrar.
- **Plan:** Free.
- **Watch out:** Do not touch existing MX records if the domain is also used for email.

---

## 2. Storage

### Workers KV
- **Used for:** Pacing keys that expire by themselves (one guestbook case per IP per two minutes, one press per minute on the decide button), and the finished overviews for the defences, the crawlers, the speed and Denmark right now. The guestbook's cases moved to D1 in round 13 (two guests at once could get the same number with KV's read-modify-write).
- **How:** `npx wrangler kv namespace create tingsvad-sager`, and put the id in `wrangler.toml`:
  ```toml
  [[kv_namespaces]]
  binding = "SAGER"
  id = "<id>"
  ```
- **Plan:** Free (100,000 reads and 1,000 writes a day).
- **Watch out:** KV is eventually consistent. A change can take up to a minute to reach every data centre.

### D1 (SQLite)
- **Used for:** The guestbook (case numbers from `INSERT … RETURNING`), the decide counter and today's visitors, quotas, courtroom rounds, newspaper editions, the defences' daily rows.
- **How:** `npx wrangler d1 create tingsvad-ting-ai`, id in `wrangler.toml`, migrations with `npx wrangler d1 migrations apply tingsvad-ting-ai --remote`.
- **Plan:** Free.
- **Watch out:** Jurisdiction and location can only be set at creation (see [Data location](#9-data-location)).

### R2
- **Used for:** The radio's audio files, generated images, PDF attachments.
- **How:** `npx wrangler r2 bucket create tingsvad-ting-ai-media`, and `[[r2_buckets]] binding = "MEDIA"`.
- **Plan:** Free up to 10 GB. No egress fees.

### Durable Objects (WebSocket Hibernation and SQLite)
- **Used for:** The shared vote and the shared stool (every guest in one object over WebSocket), the live radio and the archive cabinet. The stool and the vote keep a diary in the object's own SQLite storage.
- **How:**
  ```toml
  [[durable_objects.bindings]]
  name = "CHAIR_ROOM"
  class_name = "ChairRoom"

  [[migrations]]
  tag = "v2"
  new_sqlite_classes = ["ChairRoom"]
  ```
  The class is exported from the Worker's main file. Use `this.ctx.acceptWebSocket(ws)` for hibernation and `this.ctx.storage.sql.exec(...)` for SQL.
- **Plan:** Free (SQLite-backed objects).
- **Watch out:** An object lives where it was first used. You can see this on [the archive cabinet](https://tingsvad.dk/en/machine-room/archive-cabinet/).

### Vectorize
- **Used for:** Mímir's archive and the lost property office: semantic search with bge-m3 embeddings.
- **How:** `npx wrangler vectorize create tingsvad-kanon --dimensions=1024 --metric=cosine`, and `[[vectorize]] binding = "VECTORS"`.
- **Plan:** Free (limited number of vectors and queries).

### AI Search
- **Used for:** "Ask the archive": the Worker puts the site's Markdown into AI Search and answers with source links.
- **How:** `[[ai_search_namespaces]] binding = "AI_SEARCH"`, `namespace = "default"`. See `worker/src/features/arkiv.js`.
- **Plan:** Free (with usage limits).

---

## 3. Artificial intelligence

### Workers AI
- **Used for:** Text (Llama 3.3 70B in JSON mode), image description (Llama 3.2 Vision), image generation (FLUX.1 schnell), embeddings (bge-m3), English narration (Deepgram Aura-2) and speech to text in the courtroom (Whisper large v3 turbo).
- **How:** `[ai] binding = "AI"` and `await env.AI.run(model, input)`. Model names are vars, so they can be swapped without new code.
- **Plan:** Free (10,000 neurons a day), then Paid.
- **Watch out:** Llama 3.2 Vision requires accepting Meta's licence on first use (see `worker/README.md`). Always validate the model's answer against a schema.

### AI Gateway
- **Used for:** Every AI call goes through the gateway `tingsvad`: logs, cache, rate limit (150 calls an hour) and cost overview.
- **How:** AI → AI Gateway → Create gateway. In code: `env.AI.run(model, input, { gateway: { id: 'tingsvad' } })`.
- **Plan:** Free.

### Web Search API
- **Used for:** The "From abroad" column in Tingsvad Tidende fetches real, positive headlines, and the model writes a Tingsvad comment on them (`worker/src/features/udland.js`).
- **How:** Requires AI Gateway and credit on the gateway. In code: `env.AI.websearch(...)` through the gateway.
- **Plan:** Paid with AI Gateway credit.

### Web Crypto ML-DSA-65 (quantum-safe signature)
- **Used for:** The certificate of attendance in the rune workshop is signed with ML-DSA-65 (FIPS 204), and anyone can verify it (`worker/src/features/bevis.js`).
- **How:** `compatibility_flags = ["webcrypto_modern_algorithms"]` and `crypto.subtle.generateKey({ name: 'ML-DSA-65' }, true, ['sign', 'verify'])`.
- **Plan:** Free.

---

## 4. Background work and time

### Cron Triggers
- **Used for:** Every hour: the day's newspaper, radio, Gudrun's audit and the collection for the statistics pages.
- **How:** `[triggers] crons = ["17 * * * *"]` and a `scheduled(event, env, ctx)` function.
- **Plan:** Free.
- **Watch out:** Cron runs in UTC.

### Workflows
- **Used for:** Stool applications processed over several days, the raven exchange's PDF attachments and the daily audit.
- **How:**
  ```toml
  [[workflows]]
  name = "tingsvad-chair-cases"
  binding = "CHAIR_CASES"
  class_name = "ChairCaseWorkflow"
  ```
  The class extends `WorkflowEntrypoint` and uses `step.do()` and `step.sleep()`.
- **Plan:** Free.

### Queues
- **Used for:** The raven exchange: orders are queued and handled by a Workflow (`worker/src/features/ravn.js`).
- **How:** `npx wrangler queues create tingsvad-ravn`, and `[[queues.producers]]` plus `[[queues.consumers]]` in `wrangler.toml`.
- **Plan:** Free (since February 2026).

### Workers Cache
- **Used for:** The newspaper, the radio and the statistics are printed once and served from the edge cache with cache tags, which are purged when there is something new.
- **How:** `[cache] enabled = true`, responses with `Cache-Control: public` and `Cache-Tag`, and `ctx.cache.invalidate({ tags })` (see `worker/src/lib/kantcache.js`).
- **Plan:** Free.

---

## 5. Media, browser and real time

### Browser Run
- **Used for:** og-images per case, the minutes as PDF and Gudrun's daily browser check of every page.
- **How:** `[browser] binding = "BROWSER"` and Quick Actions (screenshot, PDF) without Puppeteer.
- **Plan:** Free (limited), Paid for more.

### Images
- **Used for:** Uploaded images in "Present your evidence" are normalised (orientation, metadata, downscaling).
- **How:** `[images] binding = "IMAGES"` and `env.IMAGES.input(bytes).transform({ width: 1024 }).output({ format: 'image/jpeg' })`.
- **Plan:** Free up to 5,000 unique transformations a month.

### Realtime SFU
- **Used for:** The live radio: a Durable Object streams the day's broadcast, and guests listen over WebRTC.
- **How:** Realtime → Serverless SFU → create an app. App id as the var `REALTIME_SFU_APP_ID`, token with `npx wrangler secret put REALTIME_SFU_TOKEN`.
- **Plan:** Free up to a quota, then usage.

### Cloudflare Fonts
- **Used for:** The Google fonts are served from the site's own domain, so no third party sees the visitor.
- **How:** Speed → Optimization → Cloudflare Fonts → On.
- **Plan:** Free.

---

## 6. Security and access

### DDoS protection and WAF
- **Used for:** Known attacks (for example React RCE and WordPress vulnerabilities) are stopped before they reach the Workers. See [the defences](https://tingsvad.dk/en/machine-room/defences/).
- **How:** On by default. Security → WAF → Managed rules.
- **Plan:** Free (Cloudflare's free ruleset), more with paid plans.

### Rate limiting binding
- **Used for:** At most a set number of calls per guest per minute to the AI machines.
- **How:**
  ```toml
  [[ratelimits]]
  name = "RL"
  namespace_id = "1001"
    [ratelimits.simple]
    limit = 8
    period = 60
  ```
  `const { success } = await env.RL.limit({ key })`.
- **Plan:** Free.

### Turnstile
- **Used for:** The guestbook and the raven post are protected against robots without picture puzzles.
- **How:** Turnstile → Add widget. Site key in `wrangler.toml`, secret with `npx wrangler secret put TURNSTILE_SECRET`.
- **Plan:** Free.

### Cloudflare Access
- **Used for:** `/admin/*` can only be opened by the family after logging in.
- **How:** Zero Trust → Access → Applications → Self-hosted, path `tingsvad.dk/admin`. The Worker checks the JWT (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`).
- **Plan:** Free up to 50 users.

### Secrets Store
- **Used for:** The GitHub token, the Realtime token and the certificate key can live in the account's shared store instead of on each Worker (`worker/src/lib/hemmelighed.js`).
- **How:** `npx wrangler secrets-store secret create <STORE_ID> --name GITHUB_TOKEN --scopes workers --remote` and a `[[secrets_store_secrets]]` binding.
- **Plan:** Free.

### Security headers (CSP, HSTS, Permissions-Policy)
- **Used for:** A strict CSP with only Cloudflare’s own beacon and Turnstile as third parties. The microphone is only allowed on the courtroom page.
- **How:** `_headers` for static files and `functions/_lib/headers.js` for Worker responses.
- **Watch out:** Both places must be updated when the CSP changes.

### Email Workers
- **Used for:** "Raven post": letters to an address on another domain are received by a Worker that stores only the subject, an excerpt and the time.
- **How:** Email → Email Routing on the domain → Routes → Send to a Worker.
- **Watch out:** Email Routing takes over the domain's MX records. Use a domain that is not already used for email.

---

## 7. Measurement and observability

### Workers Analytics Engine and Analytics SQL
- **Used for:** The thing's own counting works: page views and machine calls without IP addresses or cookies.
- **How:** `[[analytics_engine_datasets]] binding = "TAEL"` and `env.TAEL.writeDataPoint({...})`. Read with `[analytics] binding = "ANALYTICS_SQL"`.
- **Plan:** Free.

### Web Analytics
- **Used for:** Visits and Core Web Vitals from real guests without cookies. See [the speed](https://tingsvad.dk/en/machine-room/speed/).
- **How:** Analytics → Web analytics → Add a site → pick the domain → *Enable with JS Snippet installation*, and put the token in `WEB_ANALYTICS_TOKEN`.
- **Plan:** Free.
- **Watch out:** The site must be created for the domain the beacon is sent from. Otherwise Cloudflare rejects it (CORS), and nothing is counted.

### GraphQL Analytics API
- **Used for:** The defences (firewall events), the crawlers (verified bots) and the speed (RUM) fetch Cloudflare's own figures every hour (`worker/src/features/vagt.js`, `maaling.js`).
- **How:** Create an API token with **Zone → Analytics → Read** for the zone and **Account → Account Analytics → Read**. Set it with `npx wrangler secret put CF_ANALYTICS_TOKEN`. Call `https://api.cloudflare.com/client/v4/graphql`.
- **Plan:** Free (30 days of data).
- **Watch out:** Long periods are sampled. Fetch one day at a time.

### Cloudflare Radar API
- **Used for:** [Denmark right now](https://tingsvad.dk/en/machine-room/denmark/): bots, AI crawlers, attacks, quantum-safe connections and speed in Denmark.
- **How:** The same token with **Account → Radar → Read**. For example `GET /client/v4/radar/http/summary/bot_class?location=DK&dateRange=7d`.
- **Plan:** Free. Data is CC BY-NC 4.0.

### Workers Logs, Issues and Traces
- **Used for:** Errors are grouped and sent as one GitHub issue a day via a webhook. Every call can be followed as a trace.
- **How:** `[observability] enabled = true`, `[observability.issues] enabled = true`, `[observability.traces] enabled = true`.
- **Plan:** Free (with limits).

---

## 8. Agents, search engines and AI crawlers

### Markdown for agents
- **Used for:** Every page can be fetched as Markdown with `Accept: text/markdown` or by adding `index.md` to the address.
- **How:** Content negotiation in the site Worker (`functions/_lib/side.js`).

### MCP server
- **Used for:** `mcp.tingsvad.dk/mcp` lets AI assistants look things up in the minutes, search lost property and raise a case.
- **How:** A separate Worker in `mcp/` with its own custom domain.

### robots.txt with Content Signals, llms.txt and Crawler Hints
- **Used for:** Telling search engines and AI crawlers what they may do (`search=yes, ai-input=yes, ai-train=yes`), and giving language models an introduction (`llms.txt`). Crawler Hints notifies search engines when something changes.
- **How:** The files are in the root. Crawler Hints: Caching → Configuration → Crawler Hints → On.
- **Plan:** Free.

### /.well-known/api-catalog and the MCP server card
- **Used for:** Agents can find the API and the MCP server automatically.

---

## 9. Data location

### Jurisdictions (D1, KV, R2, Durable Objects, Workflows)
- **Used for:** [The European archive cabinet](https://tingsvad.dk/en/machine-room/archive-cabinet/): four stores locked to the EU and an unlocked Durable Object for comparison.
- **How:**
  ```sh
  npx wrangler d1 create my-eu-store --jurisdiction=eu
  npx wrangler kv namespace create my-eu-store --jurisdiction=eu
  npx wrangler r2 bucket create my-eu-store --jurisdiction=eu
  ```
  The R2 binding must include `jurisdiction = "eu"`. Durable Objects: `env.MY_OBJECT.jurisdiction("eu").getByName("name")`.
- **Plan:** Free.
- **Watch out:** The jurisdiction can only be set at creation. Regional Services, Customer Metadata Boundary and Geo Key Manager require Enterprise.

---

## 10. Costs and emergency brakes

### Workers Paid, CPU limit and budget alert
- **Used for:** The Paid plan removes "too many subrequests" and gives higher limits. In return, Cloudflare does not stop at the included limits, so the site has its own emergency brakes.
- **How:**
  - `[limits] cpu_ms = 10000` in `wrangler.toml`.
  - Daily caps for Browser Run, embeddings and speech in `worker/src/lib/budget.js`.
  - Per-feature quotas in `worker/src/lib/quota.js`.
  - Billing → Budget alerts in the dashboard.
- **Plan:** Paid.

---

Want to build your own site on the same foundation? See [BUILD-YOUR-OWN.md](BUILD-YOUR-OWN.md).
