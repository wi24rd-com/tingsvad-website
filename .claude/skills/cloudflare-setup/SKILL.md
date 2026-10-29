---
name: cloudflare-setup
description: Use when a Cloudflare feature from Tingsvad Website (KV, D1, R2, Durable Objects, Workers AI, Turnstile, Web Analytics, jurisdictions and more) is to be set up on the user's own account – safely, step by step, with the user in control.
---

# Set up a Cloudflare feature safely

The recipe for each feature is in `docs/CLOUDFLARE-FEATURES.md` (Danish: `docs/da/CLOUDFLARE-FUNKTIONER.md`). This skill describes how to guide the user through it. Answer in the user's language.

## Approach
1. **Find the recipe** in `docs/CLOUDFLARE-FEATURES.md` and the code the feature uses in the project (the file is named under "Used for"). Read the code before copying it.
2. **Say what it costs.** Free, Paid (Workers Paid, USD 5/month + usage) or Enterprise. Ask before anything requires payment. Payment and subscriptions are the user's own clicks.
3. **Create the resource** with a `wrangler` command the user runs (for example `npx wrangler d1 create my-store`), or with precise clicks in the dashboard. Ask for the output: IDs are not secret and may be put into `wrangler.toml`.
4. **Bind the resource** in `wrangler.toml` and adapt the code. Keep names and bindings descriptive.
5. **Secrets** (API keys, tokens, webhook secrets): give the user `npx wrangler secret put NAME`, and let the user enter the value. Never ask for the value in the chat, and never write it in files. Prefer adding permissions to an existing token over creating many.
6. **API tokens** for GraphQL and Radar: least privilege. Zone → Analytics → Read for one zone, Account → Account Analytics → Read, Account → Radar → Read. All read-only.
7. **Test** locally (`npx wrangler dev`) and with unit tests (`node --test test/*.test.js` in `worker/`) before the user deploys.
8. **Deploy:** the user runs `npx wrangler deploy` for Workers without Git integration, or pushes to `main` for the site Worker.
9. **Check afterwards** that the feature answers (for example the Worker's `/health`), and explain what is now running.

## Pitfalls from tingsvad.dk
- **Jurisdiction** (EU) can only be set when D1, KV, R2 or Workflows are created. The R2 binding itself needs `jurisdiction = "eu"`.
- **The Web Analytics site** must be created for the domain the beacon is sent from, or Cloudflare rejects it (CORS).
- **Durable Objects** live where they are first used. Use `.jurisdiction("eu")` if the location has to be promised.
- **The Paid plan** does not stop at limits: set `[limits] cpu_ms`, daily caps in the code and a budget alert.
- **Email Routing** takes over the domain's MX. Never use a domain that is already used for email.
- **Older preview Workers** do not know new routes. Check the Worker's health before the page calls a new route.
- **GraphQL Analytics** samples long periods. Fetch one day at a time.
