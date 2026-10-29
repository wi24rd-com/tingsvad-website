---
name: build-your-own-site
description: Use when someone wants to build their own website from the Tingsvad Website project (Cloudflare Workers with Static Assets, no build step) – read the project, plan in small steps, rebuild it with the user's content and put it on the web.
---

# Build your own site on Tingsvad Website

The project is a working demonstration of Cloudflare's developer platform. The code is MIT; the texts and the universe are CC BY 4.0. The goal is to help a person, often without programming experience, get their own site on the web without a CMS or a web host. Answer in the user's language.

## 1. Understand the project first
Read before changing anything:
- `README.md` and `docs/CLOUDFLARE-FEATURES.md` – what the site consists of (Danish: `docs/da/`).
- `site-worker/wrangler.toml` and `site-worker/index.js` – the site Worker, Static Assets and `run_worker_first`.
- `functions/_lib/side.js` and `functions/_lib/headers.js` – middleware: shared parts via HTMLRewriter, security headers, Markdown for agents.
- `partials/` – top bar, navigation and footer (Danish and English).
- `assets/site.css`, `assets/site.js`, `assets/undersider.css` – shared style and script.
- A few pages: `index.html`, `en/index.html`, `en/machine-room/index.html`.
- `worker/` is the machine Worker with AI, D1, Durable Objects and so on. It is **optional** for a new site.

Then explain in plain language how the site fits together and which parts the user needs.

## 2. Plan in small steps
1. The smallest site that can go live: front page, 2–3 sub-pages, shared top bar and footer, the site Worker. No machine Worker.
2. The user's own content and images (see skill `image-prompts`).
3. Own domain, DNSSEC, Web Analytics.
4. One feature at a time from `docs/CLOUDFLARE-FEATURES.md`, when the user asks for it (see skill `cloudflare-setup`).

## 3. The rebuild
- Work on a new git branch. Commit after each step with a short, understandable message.
- Remove Tingsvad-specific content from what is kept: names, the cow case, references to `assets/kanon.json`, domains (`tingsvad.dk`, `mcp.tingsvad.dk`), the Web Analytics token, the Turnstile site key, the Access domain, `routes` in `wrangler.toml`.
- Update `sitemap.xml`, `robots.txt`, `llms.txt`, `manifest.webmanifest`, `<title>`, meta descriptions and JSON-LD for the user's site.
- Run `sh bump.sh` after changes to shared CSS/JS, so `?v=` is updated on every page.
- Keep `.assetsignore`, so code, tests and `*.md` are not published as part of the site.
- Keep the credit to tingsvad.dk where CC BY texts are reused.

## 4. Security (always)
- Secrets are only set with `npx wrangler secret put NAME`, and the user enters the value themselves. Never write them in files, commits or the chat.
- Never touch the user's existing DNS or MX records without explicit permission. Email Routing takes over MX.
- Recommend two-factor authentication on GitHub and Cloudflare.
- Payments, subscriptions and account settings are the user's own clicks.

## 5. Test and publish
- Locally: `cd site-worker && npx wrangler dev`. Show the site on desktop and mobile (for example with Playwright screenshots), and check there is no sideways scrolling.
- Publish: Workers & Pages → Create → Import a repository → *Root directory* `site-worker`, deploy command `npx wrangler deploy`. A push to `main` deploys; other branches get preview addresses.
- If a Workers Build fails with "internal error", try *Retry build*.

## 6. Communication
Explain each step briefly and without jargon. Show results (screenshots) rather than describing them. Only ask when a choice is the user's: language, content, domain, or anything that costs money.
