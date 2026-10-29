# Cloudflare-funktionerne bag tingsvad.dk

*English version: [../CLOUDFLARE-FEATURES.md](../CLOUDFLARE-FEATURES.md)*

tingsvad.dk er en fiktiv lokalhistorie om et ting ved et vadested, og samtidig en åben, fungerende demonstration af Cloudflares udviklerplatform. Denne side lister de funktioner, sitet bruger, hvad de bruges til her, og en kort vejledning, så du selv kan sætte dem op.

**Sådan læser du siden**
- **Bruges til** – hvad funktionen gør på tingsvad.dk, og hvor koden ligger.
- **Sådan** – de vigtigste trin. Kommandoer køres i mappen `worker/` (maskin-Workeren) eller `site-worker/` (site-Workeren), medmindre andet står.
- **Plan** – *Free* betyder Cloudflares gratis plan, *Paid* betyder Workers Paid (5 USD om måneden plus forbrug), *Enterprise* betyder en særskilt aftale.
- **Pas på** – det, der drillede, da vi byggede det.

Planer og priser ændrer sig. Tjek altid [Cloudflares dokumentation](https://developers.cloudflare.com/) for det aktuelle.

**Tre regler gennem hele projektet**
1. Hemmeligheder (API-nøgler, tokens) sættes med `npx wrangler secret put NAVN` og står aldrig i repoet eller i en chat.
2. ID'er i `wrangler.toml` (databaser, KV, buckets) er adresser, ikke hemmeligheder. De virker kun med en konto, der ejer dem.
3. Al AI-tekst er mærket som fiktion, valideres mod et skema og afgør aldrig kosagen.

**Indhold:** [Fundamentet](#1-fundamentet) · [Lagring](#2-lagring) · [AI](#3-kunstig-intelligens) · [Baggrundsarbejde](#4-baggrundsarbejde-og-tid) · [Medier og browser](#5-medier-browser-og-realtid) · [Sikkerhed](#6-sikkerhed-og-adgang) · [Måling](#7-måling-og-observabilitet) · [Agenter og SEO](#8-agenter-søgemaskiner-og-ai-crawlere) · [Datalokation](#9-datalokation) · [Økonomi](#10-økonomi-og-nødbremser)

---

## 1. Fundamentet

### Workers med Static Assets
- **Bruges til:** Hele sitet er én Worker, `tingsvad-site`. HTML, billeder og scripts er statiske filer, og kun HTML-sider, `/api/*`, `/admin/*` og `/sag/*` går gennem Worker-koden (`site-worker/`).
- **Sådan:** I `site-worker/wrangler.toml`:
  ```toml
  [assets]
  directory = ".."
  binding = "ASSETS"
  html_handling = "auto-trailing-slash"
  run_worker_first = ["/*", "!/assets/*"]
  ```
  Filer, der ikke må udgives (kode, tests, `*.md`), står i `.assetsignore`.
- **Plan:** Free. Statiske filer er gratis og tæller ikke som requests.
- **Pas på:** `_headers` gælder kun svar direkte fra de statiske filer. Svar fra Worker-koden skal selv sætte sikkerhedsheadere (se `functions/_lib/headers.js`).

### Workers Builds og Worker Previews
- **Bruges til:** Hver push til `main` deployer site-Workeren automatisk. Hver anden gren får sin egen preview-adresse (`runde-9-tingsvad-site.<konto>.workers.dev`), som kvalitetstestene kører mod.
- **Sådan:** Workers & Pages → Create → Import a repository → vælg repoet, sæt *Root directory* til `site-worker`, deploy-kommando `npx wrangler deploy`.
- **Plan:** Free.
- **Pas på:** Fejler en bygning med "internal error", så tryk *Retry build* under Deployments. Det var Cloudflare, ikke koden.

### Service bindings
- **Bruges til:** Site-Workeren kalder maskin-Workeren `tingsvad-ting-ai` direkte i samme datacenter uden om internettet (`functions/api/ting-ai/[[path]].js`).
- **Sådan:**
  ```toml
  [[services]]
  binding = "TING_AI"
  service = "tingsvad-ting-ai"
  ```
  I koden: `env.TING_AI.fetch(request)`.
- **Plan:** Free.

### HTMLRewriter
- **Bruges til:** Fælles topbjælke, navigation og footer sættes ind i hver side, mens den streames. Ingen byggetrin (`functions/_lib/side.js`).
- **Sådan:** `new HTMLRewriter().on('[data-tv-del="footer"]', { element(el) { el.replace(html, { html: true }); } }).transform(res)`.
- **Plan:** Free.

### request.cf
- **Bruges til:** Hvilket datacenter, protokol og TLS-version der svarede gæsten (`/api/kant`, Infrastrukturkortet).
- **Sådan:** `request.cf.colo`, `request.cf.httpProtocol`, `request.cf.tlsVersion`. Ingen opsætning.
- **Plan:** Free.

### Custom domain, DNS, DNSSEC og HSTS
- **Bruges til:** tingsvad.dk peger direkte på site-Workeren.
- **Sådan:** `routes = [{ pattern = "tingsvad.dk", custom_domain = true }]` i `wrangler.toml`. DNSSEC: DNS → Settings → Enable DNSSEC, og læg DS-posten hos registraren.
- **Plan:** Free.
- **Pas på:** Rør ikke eksisterende MX-poster, hvis domænet også bruges til mail.

---

## 2. Lagring

### Workers KV
- **Bruges til:** Gæstebogens sager, færdige oversigter til Værnet, Crawlerne, Hastigheden og Danmark lige nu.
- **Sådan:** `npx wrangler kv namespace create tingsvad-sager`, og læg id'et i `wrangler.toml`:
  ```toml
  [[kv_namespaces]]
  binding = "SAGER"
  id = "<id>"
  ```
- **Plan:** Free (100.000 læsninger og 1.000 skrivninger om dagen).
- **Pas på:** KV er "eventually consistent". En ændring kan tage op til et minut om at nå alle datacentre.

### D1 (SQLite)
- **Bruges til:** Kvoter, retssalens runder, avisudgaver, Værnets døgnrækker.
- **Sådan:** `npx wrangler d1 create tingsvad-ting-ai`, id i `wrangler.toml`, migrationer med `npx wrangler d1 migrations apply tingsvad-ting-ai --remote`.
- **Plan:** Free.
- **Pas på:** Jurisdiktion og placering kan kun sættes ved oprettelsen (se [Datalokation](#9-datalokation)).

### R2
- **Bruges til:** Radioens lydfiler, genererede billeder, PDF-bilag.
- **Sådan:** `npx wrangler r2 bucket create tingsvad-ting-ai-media`, og `[[r2_buckets]] binding = "MEDIA"`.
- **Plan:** Free op til 10 GB. Ingen betaling for udtræk.

### Durable Objects (WebSocket Hibernation og SQLite)
- **Bruges til:** Den fælles afstemning og den fælles stol (alle gæster i ét objekt over WebSocket), live-radioen og arkivskabet. Stolen og afstemningen fører dagbog i objektets eget SQLite-lager.
- **Sådan:**
  ```toml
  [[durable_objects.bindings]]
  name = "CHAIR_ROOM"
  class_name = "ChairRoom"

  [[migrations]]
  tag = "v2"
  new_sqlite_classes = ["ChairRoom"]
  ```
  Klassen eksporteres fra Workerens hovedfil. Brug `this.ctx.acceptWebSocket(ws)` for hibernation og `this.ctx.storage.sql.exec(...)` for SQL.
- **Plan:** Free (SQLite-baserede objekter).
- **Pas på:** Et objekt bor dér, hvor det første gang blev brugt. Det kan man se på [arkivskabet](https://tingsvad.dk/maskinrummet/arkivskabet/).

### Vectorize
- **Bruges til:** Mímirs arkiv og hittegodskontoret: semantisk søgning med bge-m3-embeddings.
- **Sådan:** `npx wrangler vectorize create tingsvad-kanon --dimensions=1024 --metric=cosine`, og `[[vectorize]] binding = "VECTORS"`.
- **Plan:** Free (begrænset antal vektorer og forespørgsler).

### AI Search
- **Bruges til:** "Spørg arkivet": Workeren lægger sitets Markdown i AI Search og svarer med kildelinks.
- **Sådan:** `[[ai_search_namespaces]] binding = "AI_SEARCH"`, `namespace = "default"`. Se `worker/src/features/arkiv.js`.
- **Plan:** Free (med forbrugsgrænser).

---

## 3. Kunstig intelligens

### Workers AI
- **Bruges til:** Tekst (Llama 3.3 70B i JSON-mode), billedbeskrivelse (Llama 3.2 Vision), billedgenerering (FLUX.1 schnell), embeddings (bge-m3), oplæsning på engelsk (Deepgram Aura-2) og tale til tekst i retssalen (Whisper large v3 turbo).
- **Sådan:** `[ai] binding = "AI"` og `await env.AI.run(model, input)`. Modelnavne står som vars, så de kan skiftes uden ny kode.
- **Plan:** Free (10.000 "neurons" om dagen), derefter Paid.
- **Pas på:** Llama 3.2 Vision kræver, at man første gang accepterer Metas licens (se `worker/README.md`). Validér altid modellens svar mod et skema.

### AI Gateway
- **Bruges til:** Alle AI-kald går gennem gatewayen `tingsvad`: logs, cache, rate limit (150 kald i timen) og omkostningsoverblik.
- **Sådan:** AI → AI Gateway → Create gateway. I koden: `env.AI.run(model, input, { gateway: { id: 'tingsvad' } })`.
- **Plan:** Free.

### Web Search API
- **Bruges til:** Kolonnen "Udefra" i Tingsvad Tidende henter rigtige, positive nyhedsoverskrifter, og modellen skriver en Tingsvad-kommentar til dem (`worker/src/features/udland.js`).
- **Sådan:** Kræver AI Gateway og kredit på gatewayen. I koden: `env.AI.websearch(...)` via gatewayen.
- **Plan:** Betales med AI Gateway-kredit.

### Web Crypto ML-DSA-65 (kvantesikker signatur)
- **Bruges til:** Fremmødebeviset i Runeværkstedet underskrives med ML-DSA-65 (FIPS 204), og alle kan tjekke det (`worker/src/features/bevis.js`).
- **Sådan:** `compatibility_flags = ["webcrypto_modern_algorithms"]` og `crypto.subtle.generateKey({ name: 'ML-DSA-65' }, true, ['sign', 'verify'])`.
- **Plan:** Free.

---

## 4. Baggrundsarbejde og tid

### Cron Triggers
- **Bruges til:** Hver time: dagens avis, radio, Gudruns revision og indsamlingen til statistiksiderne.
- **Sådan:** `[triggers] crons = ["17 * * * *"]` og en `scheduled(event, env, ctx)`-funktion.
- **Plan:** Free.
- **Pas på:** Cron kører i UTC.

### Workflows
- **Bruges til:** Stolansøgninger, der behandles over flere dage, ravnecentralens PDF-bilag og den daglige revision.
- **Sådan:**
  ```toml
  [[workflows]]
  name = "tingsvad-chair-cases"
  binding = "CHAIR_CASES"
  class_name = "ChairCaseWorkflow"
  ```
  Klassen udvider `WorkflowEntrypoint` og bruger `step.do()` og `step.sleep()`.
- **Plan:** Free.

### Queues
- **Bruges til:** Ravnecentralen: bestillinger lægges i kø og behandles af en Workflow (`worker/src/features/ravn.js`).
- **Sådan:** `npx wrangler queues create tingsvad-ravn`, og `[[queues.producers]]` plus `[[queues.consumers]]` i `wrangler.toml`.
- **Plan:** Free (siden februar 2026).

### Workers Cache
- **Bruges til:** Avisen, radioen og statistikken trykkes én gang og serveres fra kantens cache med cache-tags, der tømmes, når der er nyt.
- **Sådan:** `[cache] enabled = true`, svar med `Cache-Control: public` og `Cache-Tag`, og `ctx.cache.invalidate({ tags })` (se `worker/src/lib/kantcache.js`).
- **Plan:** Free.

---

## 5. Medier, browser og realtid

### Browser Run
- **Bruges til:** og-billeder pr. sag, protokollen som PDF og Gudruns daglige browsertjek af hver side.
- **Sådan:** `[browser] binding = "BROWSER"` og Quick Actions (skærmbillede, PDF) uden Puppeteer.
- **Plan:** Free (begrænset), Paid for mere.

### Images
- **Bruges til:** Uploadede billeder i "Fremlæg dit bevis" normaliseres (orientering, metadata, nedskalering).
- **Sådan:** `[images] binding = "IMAGES"` og `env.IMAGES.input(bytes).transform({ width: 1024 }).output({ format: 'image/jpeg' })`.
- **Plan:** Free op til 5.000 unikke transformationer om måneden.

### Realtime SFU
- **Bruges til:** Live-radioen: et Durable Object streamer dagens udsendelse, og gæster lytter over WebRTC.
- **Sådan:** Realtime → Serverless SFU → opret en app. App-id som var `REALTIME_SFU_APP_ID`, token med `npx wrangler secret put REALTIME_SFU_TOKEN`.
- **Plan:** Free op til en kvote, derefter forbrug.

### Cloudflare Fonts
- **Bruges til:** Google-skrifterne serveres fra sitets eget domæne, så ingen tredjepart ser gæsten.
- **Sådan:** Speed → Optimization → Cloudflare Fonts → On.
- **Plan:** Free.

---

## 6. Sikkerhed og adgang

### DDoS-beskyttelse og WAF
- **Bruges til:** Kendte angreb (fx React RCE og WordPress-sårbarheder) stoppes, før de når Workerne. Se [Værnet](https://tingsvad.dk/maskinrummet/vaernet/).
- **Sådan:** Tændt som standard. Security → WAF → Managed rules.
- **Plan:** Free (Cloudflares gratis regelsæt), mere med betalte planer.

### Rate limiting-binding
- **Bruges til:** Højst et vist antal kald pr. gæst og minut til AI-maskinerne.
- **Sådan:**
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
- **Bruges til:** Gæstebogen og ravneposten beskyttes mod robotter uden billedgåder.
- **Sådan:** Turnstile → Add widget. Sitekey i `wrangler.toml`, hemmelighed med `npx wrangler secret put TURNSTILE_SECRET`.
- **Plan:** Free.

### Cloudflare Access
- **Bruges til:** `/admin/*` kan kun åbnes af familien efter login.
- **Sådan:** Zero Trust → Access → Applications → Self-hosted, sti `tingsvad.dk/admin`. Workeren tjekker JWT'en (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`).
- **Plan:** Free op til 50 brugere.

### Secrets Store
- **Bruges til:** GitHub-token, Realtime-token og bevisnøglen kan ligge i kontoens fælles skab i stedet for på hver Worker (`worker/src/lib/hemmelighed.js`).
- **Sådan:** `npx wrangler secrets-store secret create <STORE_ID> --name GITHUB_TOKEN --scopes workers --remote` og en `[[secrets_store_secrets]]`-binding.
- **Plan:** Free.

### Sikkerhedsheadere (CSP, HSTS, Permissions-Policy)
- **Bruges til:** Streng CSP uden tredjeparter. Mikrofonen er kun tilladt på retssalens side.
- **Sådan:** `_headers` for statiske filer og `functions/_lib/headers.js` for Worker-svar.
- **Pas på:** Begge steder skal rettes, når CSP'en ændres.

### Email Workers
- **Bruges til:** "Ravnepost": breve til en adresse på et andet domæne modtages af en Worker, der kun gemmer emne, uddrag og tid.
- **Sådan:** Email → Email Routing på domænet → Routes → Send to a Worker.
- **Pas på:** Email Routing overtager domænets MX-poster. Brug et domæne, der ikke allerede bruges til mail.

---

## 7. Måling og observabilitet

### Workers Analytics Engine og Analytics SQL
- **Bruges til:** Tingets eget tælleværk: sidevisninger og maskinkald uden IP eller cookies.
- **Sådan:** `[[analytics_engine_datasets]] binding = "TAEL"` og `env.TAEL.writeDataPoint({...})`. Læses med `[analytics] binding = "ANALYTICS_SQL"`.
- **Plan:** Free.

### Web Analytics
- **Bruges til:** Besøg og Core Web Vitals fra rigtige gæster uden cookies. Se [Hastigheden](https://tingsvad.dk/maskinrummet/hastigheden/).
- **Sådan:** Analytics → Web analytics → Add a site → vælg domænet → *Enable with JS Snippet installation*, og læg tokenet i `WEB_ANALYTICS_TOKEN`.
- **Plan:** Free.
- **Pas på:** Sitet skal være oprettet for det domæne, beaconen sendes fra. Ellers afviser Cloudflare den (CORS), og intet tælles.

### GraphQL Analytics API
- **Bruges til:** Værnet (firewall-hændelser), Crawlerne (verificerede bots) og Hastigheden (RUM) henter Cloudflares egne tal hver time (`worker/src/features/vagt.js`, `maaling.js`).
- **Sådan:** Opret et API-token med **Zone → Analytics → Read** for zonen og **Account → Account Analytics → Read**. Læg det ind med `npx wrangler secret put CF_ANALYTICS_TOKEN`. Kald `https://api.cloudflare.com/client/v4/graphql`.
- **Plan:** Free (30 dages data).
- **Pas på:** Lange perioder samples. Hent ét døgn ad gangen.

### Cloudflare Radar API
- **Bruges til:** [Danmark lige nu](https://tingsvad.dk/maskinrummet/danmark/): bots, AI-crawlere, angreb, kvantesikre forbindelser og hastighed i Danmark.
- **Sådan:** Samme token med **Account → Radar → Read**. Fx `GET /client/v4/radar/http/summary/bot_class?location=DK&dateRange=7d`.
- **Plan:** Free. Data er CC BY-NC 4.0.

### Workers Logs, Issues og Traces
- **Bruges til:** Fejl grupperes og sendes som én GitHub-issue om dagen via en webhook. Hvert kald kan følges som et spor.
- **Sådan:** `[observability] enabled = true`, `[observability.issues] enabled = true`, `[observability.traces] enabled = true`.
- **Plan:** Free (med grænser).

---

## 8. Agenter, søgemaskiner og AI-crawlere

### Markdown til agenter
- **Bruges til:** Hver side kan hentes som Markdown med `Accept: text/markdown` eller ved at tilføje `index.md` til adressen.
- **Sådan:** Content negotiation i site-Workeren (`functions/_lib/side.js`).

### MCP-server
- **Bruges til:** `mcp.tingsvad.dk/mcp` lader AI-assistenter slå op i protokollen, søge i hittegods og rejse en sag.
- **Sådan:** En separat Worker i `mcp/` med eget custom domain.

### robots.txt med Content Signals, llms.txt og Crawler Hints
- **Bruges til:** At fortælle søgemaskiner og AI-crawlere, hvad de må (`search=yes, ai-input=yes, ai-train=yes`), og give sprogmodeller en introduktion (`llms.txt`). Crawler Hints giver søgemaskinerne besked, når noget ændres.
- **Sådan:** Filerne ligger i roden. Crawler Hints: Caching → Configuration → Crawler Hints → On.
- **Plan:** Free.

### /.well-known/api-catalog og MCP-serverkort
- **Bruges til:** Agenter kan finde API'et og MCP-serveren automatisk.

---

## 9. Datalokation

### Jurisdiktioner (D1, KV, R2, Durable Objects, Workflows)
- **Bruges til:** [Det europæiske arkivskab](https://tingsvad.dk/maskinrummet/arkivskabet/): fire lagre låst til EU og et ulåst Durable Object til sammenligning.
- **Sådan:**
  ```sh
  npx wrangler d1 create mit-eu-lager --jurisdiction=eu
  npx wrangler kv namespace create mit-eu-lager --jurisdiction=eu
  npx wrangler r2 bucket create mit-eu-lager --jurisdiction=eu
  ```
  R2-bindingen skal have `jurisdiction = "eu"`. Durable Objects: `env.MIT_OBJEKT.jurisdiction("eu").getByName("navn")`.
- **Plan:** Free.
- **Pas på:** Jurisdiktionen kan kun sættes ved oprettelsen. Regional Services, Customer Metadata Boundary og Geo Key Manager kræver Enterprise.

---

## 10. Økonomi og nødbremser

### Workers Paid, CPU-loft og budgetalarm
- **Bruges til:** Paid-planen fjerner "too many subrequests" og giver højere grænser. Til gengæld stopper Cloudflare ikke ved de inkluderede grænser, så sitet har sine egne nødbremser.
- **Sådan:**
  - `[limits] cpu_ms = 10000` i `wrangler.toml`.
  - Døgnlofter for Browser Run, embeddings og tale i `worker/src/lib/budget.js`.
  - Kvoter pr. funktion i `worker/src/lib/quota.js`.
  - Billing → Budget alerts i dashboardet.
- **Plan:** Paid.

---

Vil du bygge din egen side på samme fundament? Se [BYG-DIN-EGEN.md](BYG-DIN-EGEN.md).
