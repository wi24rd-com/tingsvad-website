# Build your own website on tingsvad.dk's foundation

Instead of buying a CMS or a ready-made website, you can build your own with Claude, a GitHub account and a Cloudflare account. tingsvad.dk was built exactly like that. All the code is open in this repository under the MIT licence, and you may use it, change it and build on it.

This guide takes you from nothing to your own site on the web. Claude does the heavy lifting: it reads the code, rebuilds it into your site, writes the texts and creates image prompts for ChatGPT, which makes the graphics.

*Dansk udgave: [da/BYG-DIN-EGEN.md](da/BYG-DIN-EGEN.md)*

---

## What you get, and what you don't

**What you get**
- **No server to maintain.** The site is static files and small Workers on Cloudflare's network. There is no web host, no PHP, no plugins and no database open to the internet. Those are exactly the things that typically get hacked on a WordPress site.
- **Fast everywhere.** Pages are served from the Cloudflare data centre nearest the visitor.
- **Low cost.** A small site runs on Cloudflare's free plan. You pay for your domain and your Claude subscription, and possibly USD 5 a month for Workers Paid if you want the heavier features.
- **You own all of it.** The code lives in your own GitHub, and every change can be rolled back.

**What you don't get**
- **It is not unhackable.** The attack surface is much smaller, but it is still there. Your most important security is now your accounts: turn on **two-factor authentication** on GitHub and Cloudflare, never share tokens in a chat, and let Claude use `wrangler secret put` for secrets.
- **No edit button in the browser.** You change the site by asking Claude. It is quick once you are used to it, but it is a different way of working than a CMS.
- **You are responsible.** Personal data, cookies and the GDPR on your site are your responsibility, just as with a CMS. tingsvad.dk uses no tracking cookies, which is a good starting point.

**Start small.** tingsvad.dk is a large demonstration with more than 40 Cloudflare features. Your first site only needs the first chapter: static pages and one Worker. You can add the rest one thing at a time. See [CLOUDFLARE-FEATURES.md](CLOUDFLARE-FEATURES.md).

---

## Step 1: What you need

1. **The Claude app on your computer** (Mac or Windows) with a paid subscription, so Claude can work with the files in a folder on your computer. Developers can also use Claude Code in the terminal.
2. **A GitHub account** at github.com, with two-factor authentication turned on.
3. **A Cloudflare account** at dash.cloudflare.com, with two-factor authentication turned on. The free plan is enough to start.
4. **Node.js** (the LTS version) from nodejs.org. It provides the `npx` command that Cloudflare's tool `wrangler` runs with.
5. **Git or GitHub Desktop.** GitHub Desktop is easiest if you have not used git before.
6. **A domain** (optional at first). You can start on a free `*.workers.dev` address and move to your own domain later.
7. **ChatGPT** for the graphics. It makes the best images for this kind of project right now. Gemini works too.

---

## Step 2: Get the project

1. Go to `github.com/wi24rd-com/tingsvad-website` and press **Fork**. That gives you your own copy.
2. Download your copy to your computer: in GitHub Desktop **File → Clone repository** (or `git clone https://github.com/<your-name>/tingsvad-website`).
3. Rename the folder to the name of your own site if you like.
4. Open the Claude app and give it access to the folder.

---

## Step 3: The start prompt for Claude

Copy the whole prompt below into a new conversation in Claude, with the folder attached. Fill in the three lines under **ABOUT ME** first.

```
Help me build my own website from the Tingsvad Website project in the folder you have access to. The code is MIT licensed; the texts and the universe are CC BY 4.0. I want to use the foundation (Cloudflare Workers with Static Assets, no build step) and build my own site on top of it.

ABOUT ME
- My site is about: [for example "my small brewery in the countryside" or "my consulting business"]
- Language(s): [for example English, possibly also another language]
- My level: [for example "I have never programmed" or "I know a little HTML"]

HOW I WANT YOU TO WORK
1. Read the project thoroughly before changing anything: README.md, docs/CLOUDFLARE-FEATURES.md, site-worker/wrangler.toml, worker/wrangler.toml, functions/_lib/side.js, assets/site.css, assets/site.js, partials/ and a few of the pages (index.html, en/index.html, en/machine-room/index.html). Then tell me in your own words how the site is built, and which parts I need for my site.
2. Propose a plan in small steps. Start with the smallest thing that can go live: the front page, a few sub-pages, the shared top bar and footer, and the site Worker. Leave everything Tingsvad-specific (the cow case, the AI machines, the radio, the statistics pages) until I ask for it.
3. Create a new git branch for my work, and commit after each step with a short, understandable message.
4. Remove Tingsvad's content, names, images and domains from the parts we keep, and replace them with mine. Keep the credit to tingsvad.dk where the licence requires it (CC BY 4.0 for texts we reuse).
5. Secrets (API keys and tokens) must never be in files or in the chat. When one is needed, give me the command `npx wrangler secret put NAME`, and I will enter the value myself.
6. When something has to be created in Cloudflare (Worker, KV, D1, domain), explain every click or command, and wait until I have done it. Never change my DNS or email settings without asking.
7. Test the site locally (for example with `npx wrangler dev` in site-worker/), and show me how it looks on desktop and mobile before we publish it.
8. When we need images, write prompts for ChatGPT following .claude/skills/image-prompts/SKILL.md, with format and file name. I will make the images and put them in the folder, and you convert them to webp in the right sizes and put them in.
9. Explain along the way, in plain language, what you are doing and why. I want to understand my own site.

Start with step 1.
```

The repository also has three **skills** in `.claude/skills/` that give Claude fixed recipes: `build-your-own-site` (the rebuild itself), `image-prompts` (image prompts for ChatGPT) and `cloudflare-setup` (safe setup of the features). Claude Code finds them by itself. In the Claude app, you can upload each skill folder as a zip file under skills in the app's settings, or simply ask Claude to read the files in the folder.

---

## Step 4: Graphics with ChatGPT

tingsvad.dk's images were made with ChatGPT from prompts written by Claude. The workflow:

1. Ask Claude for an image prompt, for example: *"Write a ChatGPT prompt for a hero painting for my front page at 2048 × 768."*
2. Paste the prompt into ChatGPT. Ask for more versions if the first one misses.
3. Download the image as PNG and put it in the project folder.
4. Tell Claude: *"The image is in the folder."* Claude converts it to webp in three sizes (900, 1400 and 2048 pixels), writes a description for screen readers and puts it in.

**Tips for image prompts**
- Describe the style the same way every time (light, materials, painting style), so the images belong together.
- State the format and where the text goes: *"left third calmer and darker, because the title goes there"*.
- Write *"no text, letters, logos or watermarks"*. Image models spell badly.
- For figures that stand on their own (for example above the footer), ask for a transparent background (PNG).

---

## Step 5: Put the site on the web

1. Claude helps you create the site Worker: **Workers & Pages → Create → Import a repository**, pick your repository, set *Root directory* to `site-worker`, and the deploy command to `npx wrangler deploy`.
2. Every time you push to `main`, the site goes live automatically. Other branches get their own preview address, so you can see changes before they go live.
3. Your own domain: move the domain's name servers to Cloudflare (Cloudflare shows you how), and set `routes = [{ pattern = "yourdomain.com", custom_domain = true }]` in `site-worker/wrangler.toml`.
4. Turn on DNSSEC under **DNS → Settings**, and create a Web Analytics site for the domain if you want to count visits without cookies.

---

## Step 6: Build on it

Once the first site is running, you can add one feature at a time. For example:
- **A contact form** with Turnstile and D1 (see the guestbook in `functions/api/sager.js` and `worker/src/lib/gaestebog.js`).
- **An AI assistant** that answers from your own pages, with AI Search (see "Ask the archive").
- **Statistics on attacks and bots** like the defences and the crawlers.
- **Data stored only in the EU**, like the archive cabinet.

Ask Claude in the same words: *"I would like a contact form like the guestbook on tingsvad.dk. Read how it is built, and build a simpler version for my site."*

---

## Licence and credit

- **The code** is MIT: use it freely, also commercially. Keep the licence file.
- **Texts, the universe and the paintings** are CC BY 4.0: you may reuse them if you credit tingsvad.dk. The idea, though, is that you make your own content.
- See [LICENSING.md](../LICENSING.md).
