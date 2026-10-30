# Byg din egen hjemmeside på tingsvad.dk's fundament

*English version: [../BUILD-YOUR-OWN.md](../BUILD-YOUR-OWN.md)*

I stedet for at købe et CMS eller en færdig hjemmeside kan du bygge din egen med Claude, en GitHub-konto og en Cloudflare-konto. tingsvad.dk er bygget præcis sådan. Al koden ligger åbent i dette repo under MIT-licensen, og du må bruge den, rette i den og bygge videre.

Denne vejledning tager dig fra ingenting til din egen side på nettet. Claude gør det tunge arbejde: læser koden, ombygger den til din side, skriver tekster og laver billedprompts til ChatGPT, som laver grafikken.

---

## Hvad du får, og hvad du ikke får

**Det, du får**
- **Ingen server at holde ved lige.** Sitet er statiske filer og små Workers på Cloudflares net. Der er intet webhotel, ingen PHP, ingen plugins og ingen database, der står åben på nettet. Det er netop de ting, der typisk bliver hacket på et WordPress-site.
- **Hurtigt overalt.** Siderne serveres fra Cloudflares datacenter tættest på gæsten.
- **Lav pris.** En lille side kører på Cloudflares gratis plan. Du betaler for dit domæne og dit Claude-abonnement, og eventuelt 5 USD om måneden for Workers Paid, hvis du vil bruge de tunge funktioner.
- **Du ejer det hele.** Koden ligger i din egen GitHub, og hver ændring kan rulles tilbage.

**Det, du ikke får**
- **Det er ikke uhackbart.** Angrebsfladen er langt mindre, men den er der stadig. Den vigtigste sikkerhed er nu dine konti: slå **tofaktorgodkendelse** til på GitHub og Cloudflare, del aldrig tokens i en chat, og lad Claude bruge `wrangler secret put` til hemmeligheder.
- **Ingen redigeringsknap i browseren.** Du retter siden ved at bede Claude om det. Det er hurtigt, når man er vant til det, men det er en anden arbejdsgang end et CMS.
- **Du har selv ansvaret.** Persondata, cookies og GDPR på din side er dit ansvar, ligesom med et CMS. tingsvad.dk bruger ingen cookies til sporing, og det er et godt udgangspunkt.

**Start småt.** tingsvad.dk er en stor demonstration med over 40 Cloudflare-funktioner. Din første side behøver kun det første kapitel: statiske sider og én Worker. Resten kan du tilføje én ting ad gangen. Se [CLOUDFLARE-FUNKTIONER.md](CLOUDFLARE-FUNKTIONER.md).

---

## Trin 1: Det, du skal have

1. **Claude-appen på din computer** (Mac eller Windows) med et betalt abonnement, så Claude kan arbejde med filerne i en mappe på din computer. Udviklere kan også bruge Claude Code i terminalen.
2. **En GitHub-konto** på github.com, med tofaktorgodkendelse slået til.
3. **En Cloudflare-konto** på dash.cloudflare.com, med tofaktorgodkendelse slået til. Den gratis plan er nok til at starte.
4. **Node.js** (LTS-versionen) fra nodejs.org. Det giver kommandoen `npx`, som Cloudflares værktøj `wrangler` kører med.
5. **Git eller GitHub Desktop.** GitHub Desktop er lettest, hvis du ikke har brugt git før.
6. **Et domæne** (valgfrit i starten). Du kan begynde på en gratis `*.workers.dev`-adresse og flytte til dit eget domæne senere.
7. **ChatGPT** til grafikken. Den laver de bedste billeder til dette projekt lige nu. Gemini virker også.

---

## Trin 2: Hent projektet

1. Gå til `github.com/wi24rd-com/tingsvad-website`, og tryk **Fork**. Så får du din egen kopi.
2. Hent din kopi ned på computeren: i GitHub Desktop **File → Clone repository** (eller `git clone https://github.com/<dit-navn>/tingsvad-website`).
3. Omdøb gerne mappen til navnet på din egen side.
4. Åbn Claude-appen, og giv den adgang til mappen.

---

## Trin 3: Startprompten til Claude

Kopiér hele prompten herunder ind i en ny samtale i Claude, med mappen tilknyttet. Ret de tre linjer under **OM MIG** først.

```
Du skal hjælpe mig med at bygge min egen hjemmeside ud fra projektet Tingsvad Website, som ligger i den mappe, du har adgang til. Koden er MIT-licenseret, teksterne og universet CC BY 4.0. Jeg vil bruge fundamentet (Cloudflare Workers med Static Assets, ingen byggetrin) og bygge min egen side ovenpå.

OM MIG
- Min side handler om: [skriv fx "mit lille bryggeri på Fyn" eller "min konsulentvirksomhed"]
- Sprog: [fx dansk, eventuelt også engelsk]
- Mit niveau: [fx "jeg har aldrig programmeret" eller "jeg kender lidt HTML"]

SÅDAN VIL JEG HAVE, AT DU ARBEJDER
1. Læs projektet grundigt, før du ændrer noget: README.md, docs/da/CLOUDFLARE-FUNKTIONER.md, site-worker/wrangler.toml, worker/wrangler.toml, functions/_lib/side.js, assets/site.css, assets/site.js, partials/ og et par af siderne (index.html, historien/index.html, maskinrummet/index.html). Fortæl mig derefter med dine egne ord, hvordan sitet er bygget, og hvilke dele jeg har brug for til min side.
2. Foreslå en plan i små trin. Start med det mindste, der kan komme på nettet: forsiden, et par undersider, den fælles topbjælke og footer, og site-Workeren. Lad alt det Tingsvad-specifikke ligge (kosagen, AI-maskinerne, radioen, statistiksiderne), indtil jeg beder om det.
3. Lav en ny gren i git til mit arbejde, og commit efter hvert trin med en kort, forståelig besked.
4. Fjern Tingsvads indhold, navne, billeder og domæner fra de dele, vi beholder, og erstat dem med mit. Behold kreditering af tingsvad.dk, hvor licensen kræver det (CC BY 4.0 for tekster vi genbruger).
5. Hemmeligheder (API-nøgler og tokens) må aldrig stå i filer eller i chatten. Når der skal bruges en, giver du mig kommandoen `npx wrangler secret put NAVN`, og jeg indtaster værdien selv.
6. Når noget skal oprettes i Cloudflare (Worker, KV, D1, domæne), forklarer du hvert klik eller hver kommando, og venter på, at jeg har gjort det. Du ændrer aldrig mine DNS- eller mailindstillinger uden at spørge.
7. Test siden lokalt (fx med `npx wrangler dev` i site-worker/), og vis mig, hvordan den ser ud på computer og mobil, før vi lægger den ud.
8. Når vi har brug for billeder, skriver du prompts til ChatGPT efter opskriften i .claude/skills/image-prompts/SKILL.md, med format og filnavn. Jeg laver billederne og lægger dem i mappen, og du konverterer dem til webp i de rigtige størrelser og sætter dem ind.
9. Forklar undervejs i almindeligt sprog, hvad du gør og hvorfor. Jeg vil gerne forstå min egen side.

Start med punkt 1.
```

Repoet har også tre **skills** i mappen `.claude/skills/`, som giver Claude faste opskrifter: `build-your-own-site` (selve ombygningen), `image-prompts` (billedprompts til ChatGPT) og `cloudflare-setup` (sikker opsætning af funktionerne). De er skrevet på engelsk, men Claude svarer på dit sprog. Claude Code finder dem selv. I Claude-appen kan du uploade hver skill-mappe som en zip-fil under skills i appens indstillinger, eller bare bede Claude læse filerne i mappen.

---

## Trin 4: Grafik med ChatGPT

tingsvad.dk's billeder er lavet med ChatGPT ud fra prompts, som Claude har skrevet. Arbejdsgangen:

1. Bed Claude om en billedprompt, fx: *"Lav en ChatGPT-prompt til et hero-maleri til min forside i 2048 × 768."*
2. Kopiér prompten over i ChatGPT. Bed om flere bud, hvis det første ikke rammer.
3. Download billedet som PNG, og læg det i projektmappen.
4. Sig til Claude: *"Billedet ligger i mappen."* Claude konverterer det til webp i tre størrelser (900, 1400 og 2048 pixel), skriver en beskrivelse til skærmlæsere og sætter det ind.

**Gode råd til billedprompts**
- Beskriv stilen ens hver gang (lys, materialer, malestil), så billederne hænger sammen.
- Angiv format og hvor teksten skal stå: *"venstre tredjedel roligere og mørkere, fordi titlen står der"*.
- Skriv *"ingen tekst, bogstaver, logoer eller vandmærker"*. Billedmodeller staver dårligt.
- Til figurer, der skal stå frit (fx over footeren), bed om gennemsigtig baggrund (PNG).

---

## Trin 5: Læg siden på nettet

1. Claude hjælper dig med at oprette site-Workeren: **Workers & Pages → Create → Import a repository**, vælg dit repo, sæt *Root directory* til `site-worker`, og deploy-kommandoen til `npx wrangler deploy`.
2. Hver gang du pusher til `main`, kommer siden automatisk ud. Andre grene får deres egen preview-adresse, så du kan se ændringer, før de går live.
3. Dit eget domæne: flyt domænets navneservere til Cloudflare (Cloudflare viser hvordan), og sæt `routes = [{ pattern = "ditdomæne.dk", custom_domain = true }]` i `site-worker/wrangler.toml`.
4. Slå DNSSEC til under **DNS → Settings**, og opret et Web Analytics-site for domænet, hvis du vil tælle besøg uden cookies.

---

## Trin 6: Byg videre

Når den første side kører, kan du tilføje én funktion ad gangen. Fx:
- **En kontaktformular** med Turnstile og D1 (se gæstebogen i `functions/api/sager.js` og `worker/src/lib/gaestebog.js`).
- **En AI-assistent**, der svarer ud fra dine egne sider, med AI Search (se "Spørg arkivet").
- **Statistik over angreb og bots** som Værnet og Crawlerne.
- **Data, der kun gemmes i EU**, som arkivskabet.

Bed Claude om det med samme ord: *"Jeg vil gerne have en kontaktformular som gæstebogen på tingsvad.dk. Læs, hvordan den er bygget, og byg en enklere version til min side."*

---

## Licens og kreditering

- **Koden** er MIT: brug den frit, også kommercielt. Behold licensfilen.
- **Tekster, universet og malerierne** er CC BY 4.0: du må genbruge dem, hvis du krediterer tingsvad.dk. Det er dog meningen, at du laver dit eget indhold.
- Se [LICENSING.md](../../LICENSING.md).
