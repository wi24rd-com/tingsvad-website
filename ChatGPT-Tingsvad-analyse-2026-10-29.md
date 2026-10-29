# Tingsvad.dk – uafhængig analyse

Dato: 29. oktober 2026. Website: https://tingsvad.dk/  
Repository: https://github.com/wi24rd-com/tingsvad-website  
Analyseret kode: `c1a612db6005179663c31fb6760417a1060d3c5b` på `main`.

## Samlet vurdering

Tingsvad har en usædvanligt stærk identitet: den fastlåste ko-sag, Mímir, Gudrun og det varme maleriske landskab passer sammen. Forsiden forklarer præmissen hurtigt, og grafikken giver stedet en genkendelig karakter. Projektet er samtidig væsentligt mere gennemarbejdet teknisk end en almindelig personlig hjemmeside: service bindings, validering, kvoter, automatiske tests og driftsindsigt er faktiske implementeringer.

Den største udfordring er nu at styre omfanget. Der er nok funktioner. Næste runde bør gøre de bedste oplevelser lettere at finde, rette nogle konkrete robusthedsproblemer og gøre dokumentationens løfter mere præcise. Jeg ville bevare designretningen og undgå endnu en total ombygning.

Vurderingen tager udgangspunkt i to mål: Et varmt, humoristisk univers for almindelige besøgende og en seriøs teknisk demonstration i Maskinrummet. Projektet lykkes bedst, når de to mål har hver deres tydelige plads.

## Grundlag og begrænsninger

Jeg har visuelt gennemgået forsiden, kortet, Arkivet, Oplevelser og Maskinparken samt Maskinrummets top. Jeg har læst de aktuelle sider Undersøgelsen, Hastigheden, Revisionen, den engelske forside og den engelske Historien. Jeg har afprøvet Arkivets eksempelspørgsmål og afgørelsesknappen. Browsergennemgangen var på desktop; jeg har ikke selv gennemført en manuel test på en fysisk telefon eller med skærmlæser.

Koden er klonet og læst lokalt. Jeg har gennemgået centrale sikkerhedsgrænser, sessionshåndtering, gæstebog, KV, service worker, MCP, CI, testkonfiguration, dokumentation og projektets tre Claude-skills. Der er ikke gennemført fuld penetrationstest, belastningstest, afhængighedsaudit eller revision af Cloudflare-kontoens faktiske regler og adgangspolitikker. Jeg har ikke ændret eller deployet projektet, oprettet issues eller skrevet i gæstebogen.

Følgende evidensklasser bruges:

- **Observeret:** set på live-sitet eller hentet fra GitHub API.
- **Reproduceret lokalt:** kodeadfærd demonstreret i et isoleret testmiljø.
- **Kodefund:** verificeret i den angivne commit; ikke nødvendigvis udløst i produktion.
- **Vurdering:** designmæssig eller redaktionel anbefaling.

Den aktuelle produktionsversion kan afvige fra den hentede commit. En grøn frontendkørsel identificerer heller ikke automatisk versionen af den separat deployede AI-worker eller MCP-worker.

## Det stærkeste ved projektet

### Identitet og visuel retning

Forsidens første skærmbillede kommunikerer en konkret konflikt: syv mænd kan ikke blive enige om en ko. Den sætning er både introduktion og vittighed. Det virker bedre end en generel velkomsttekst eller en forklaring af Cloudflare.

Skovgrøn, pergament og guld fungerer sammen med træ, sten og det varme lys. Arkivets ulv og skuffeskab er et særligt godt eksempel på grafik, der forklarer sidens funktion. Teksten står i rolige mørke områder, og knapperne har et tydeligt visuelt hierarki.

Kortet er en stærk hovedindgang, fordi navigationen opleves som et sted. Den traditionelle navigation og listen over steder er vigtige supplementer. Bevar begge.

### Sprog og figurer

Mange af de korte formuleringer er vellykkede. Mímirs modvillighed, Gudruns selvbestaltede myndighed og Tokes stol gør universet mere holdbart end ko-vittigheden alene. Den familiehistoriske baggrund giver projektet en personlig forankring.

### Teknisk håndværk

- Frontend kan læses som almindelig HTML/CSS/JavaScript uden et tungt framework.
- Den centrale site-router genbruger eksisterende handlers frem for at have to helt separate implementeringer.
- Adminadgang kontrolleres i koden med signatur, algoritme, issuer, audience, udløb og administratorliste. Det er en reel ekstra kontrol bag Cloudflare Access.
- Proxyen afviser adminruter og fjerner udvalgte klientleverede interne headers.
- Kvoter i D1 reserveres før providerkald. Det er bedre end en løs tæller efter kaldet.
- AI-svar har skemavalidering, og Arkivets rendering escaper tekst og begrænser kildelinks.
- Public cache-svar håndteres særskilt fra sessionscookies i AI-workerens router.
- Der er tests for blandt andet adgang, idempotens, ejerskab, køer og fejltilstande.
- Kode, indhold og AI-billeder er behandlet særskilt i licensdokumentet. Det er en god dokumentationsstruktur; dette er ikke en juridisk vurdering.

## Brugeroplevelse og indhold

### 1. Giv førstegangsbesøgende en kort anbefalet tur

Kortet har 14 markører. Oplevelser introducerer otte steder. Maskinparken introducerer seksten maskiner og yderligere tekniske indgange. Der er meget at vælge imellem, før gæsten ved, hvad der giver den bedste oplevelse.

Bevar den frie udforskning, men tilføj tre anbefalede begyndelser: en kort oplevelse, en lille gåde og en figur at møde. Eksempelvis Hittegods, den forsvundne side 2 og Mímir. Giv dem hver en konkret forventning om, hvad gæsten skal gøre og får tilbage. Undgå tidsangivelser, før de er afprøvet med rigtige personer.

Acceptkriterium: En ny gæst kan vælge sin første handling uden at kende ordene Maskinpark, Sagsmappe eller Arkiv.

### 2. Hold den tekniske præsentation i Maskinrummet

På Oplevelser står der allerede om et kvantesikkert underskrevet bevis. Maskinparken omtaler serverens ejerskab til stolens position, MCP og sammenligning med et håndbygget arkiv. Arkivet har både en sammenligningsfunktion og numeriske søgescorer.

Det er relevant stof for teknikinteresserede, men det strider mod målet om, at resten af sitet skal opleves som underholdning. Præsenter resultatet først: et stemplet fremmødebevis, en stol alle kan flytte, et modvilligt svar. Bevar forklaringerne bag et valgfrit link til Maskinrummet.

Maskinpark og Maskinrum ligger desuden tæt sprogligt. Bevar eventuelt navnene, men forklar konsekvent forskellen: Maskinparken er til at prøve; Maskinrummet er til at forstå.

### 3. Arkivets svar er mindre end apparatet omkring det

Ved spørgsmålet om koens ejer svarede Mímir: “Det er netop spørgsmålet.” Det passer til figuren. Under svaret kom fire kilder med uddrag og scorer på 100, 93, 92 og 91 procent, herunder flere links til samme side.

En søgescore er ikke dokumenteret som en kalibreret sandsynlighed for, at et svar er korrekt. Procentscorerne risikerer at blive læst sådan. Vis et kort svar og et eller to forståelige kildelinks; saml resten under “Se, hvor Mímir fandt det”. Brug ord som relevans, hvis en score overhovedet skal vises.

De 25 spørgsmål pr. døgn deles af alle gæster. Det er en fornuftig udgiftsbremse, men en lav kapacitet for en fremtrædende hovedfunktion. Lad de faste eksempelspørgsmål have redaktionelle eller versionscachede svar, og sørg for en nyttig almindelig søgning, når AI-kvoten er brugt.

### 4. Arkivet har stadig for mange redaktionelle opgaver

Søgning, sagsregister, protokol, vedtægter, ordbog, ændringshistorik, tal, FAQ, vejbeskrivelse og regnskab bor samme sted. Sideindholdsfortegnelsen og fold-ud-funktionerne hjælper, men gør ikke indholdet til én sammenhængende besøgsoplevelse.

Jeg ville fremhæve søgning, et udvalg af sager og tre gode protokolnedslag. Resten må gerne være et dybt arkiv. Ændringshistorikkens Git-vittigheder kan ligge som et frivilligt bilag. Der er ikke behov for at slette alt det lange indhold; det skal bare ikke have samme vægt som det vigtigste.

### 5. Variér belønningen

Sagen skal fortsat være udsat. Men gæstens handling må gerne føre til noget lokalt: et fund, en ny bemærkning fra Gudrun, et bilag eller en afsluttet delopgave. Hvis alle klik blot ender med samme udsættelse, falder nysgerrigheden.

Et godt princip er: Tinget må gerne stå stille; gæsten skal kunne gøre fremskridt. Projektets fragmenter, stol og sagsmappe giver allerede et fundament for det.

### 6. Grafik og typografi: redigér, udvid ikke

De maleriske toppe fungerer. Jeg ville nu fokusere på forskelle i scenografi og størrelse: ikke alle undersider behøver en stor ny introduktion, når besøget handler om at trykke på én knap. Genkendelige personer og miljøer er vigtigere end stadig flere motiver.

Repoet indlæser flere fontfamilier, herunder Bricolage Grotesque, Alegreya Sans, Cormorant Garamond, Cormorant Unicase og JetBrains Mono. Begræns hver sides behov og dokumentér rollerne: overskrift, brødtekst og teknik. Skift ikke hele fontsystemet igen uden at måle, hvad den eksisterende opsætning koster.

### 7. Den engelske udgave er omfattende, men behøver redaktion

Det er positivt, at sprogskiftet fører til den tilsvarende underside. “The thing” er sprogligt begrundet, men almindelige engelske læsere kan læse det som “tingen”. Historien forklarer betydningen, mens forsiden bruger den tidligere. Introducér kort “the Viking assembly” første gang.

I `assets/round3.js` står den engelske tællertekst som om sagen er blevet afgjort et antal gange. Det danske indhold tæller forsøg. Det er en konkret betydningsforskel, som bør rettes i en sproglig QA-runde.

## Prioriterede tekniske fund

### T1 – Adminsvar falder ind i service workerens cache

**Prioritet: høj. Evidens: kode og lokal reproduktion.**

`sw.js:6–11` undtager `/api/` og `/sag/`, men ikke `/admin/`. Alle øvrige succesfulde GET-svar sendes til Cache Storage. `functions/_lib/admin.js` sætter `Cache-Control: no-store`, men service workerens kode undersøger ikke headeren.

Jeg kørte den faktiske service worker-kode i en isoleret JavaScript-kontekst med et kunstigt succesfuldt svar på `/admin/api/aviser`, mærket `no-store`. Resultatet var et cache-skrivekald til netop den adresse.

Konsekvensen er risiko for lokale kopier af administrative svar og genbrug ved netværksfejl. Det er ikke et påvist offentligt datalæk eller et bypass af serverens JWT-kontrol. Ingen rigtige administrationsdata blev hentet.

**Retning:** Brug en positiv liste over offentlige cacheegnede ressourcer; undtag hele `/admin`-området; respekter `no-store` og `private`; migrér eller ryd den gamle app-cache.

**Acceptkriterium:** Test viser, at både admin-HTML og admin-API aldrig skrives i Cache Storage, og at en offlineforespørgsel efter en tidligere session ikke får gammelt adminindhold.

### T2 – Gæstebogen kan miste samtidige indlæg

**Prioritet: høj for dataintegritet. Evidens: lokal reproduktion.**

`functions/_lib/sagsliste.js:16–22` læser en fælles liste og tæller fra KV, beregner næste nummer og skriver begge tilbage. Jeg kaldte funktionen to gange samtidigt mod et hukommelseslager. Begge fik `980-0004`; kun ét indlæg var tilbage i listen.

Det demonstrerer en read-modify-write-race selv uden KV's globale replikering. Cloudflare dokumenterer desuden, at samtidige writes kan overskrive hinanden, og at KV har en grænse på én write pr. sekund til samme nøgle.

**Retning:** Flyt indlæg og sagsnumre til D1 med atomisk tildeling eller serialisér writes gennem et Durable Object. Brug eventuelt KV som læsecache. Web og MCP skal skrive gennem samme autoritative vej.

**Acceptkriterium:** 20 samtidige accepterede oprettelser giver 20 forskellige numre og 20 gemte indlæg. Afviste forsøg får et tydeligt svar.

### T3 – Ugyldig KV-udløbstid i afgørelsestælleren

**Prioritet: mellem. Evidens: kodefund og kontrakttest.**

`functions/api/afgoer.js:12` bruger `expirationTtl: 5`. Cloudflare KV understøtter ikke udløb under 60 sekunder. Den faktiske handler fejlede i min lokale test med en KV-stub, der håndhæver denne regel. MCP-varianten bruger allerede 60 sekunder.

Frontend har en lokal fallback i `assets/round3.js`. Derfor kan selve vittigheden fungere, selv om fællestælleren fejler. Min almindelige browserafprøvning er ikke bevis for, at produktionens write blev gennemført.

**Retning:** Brug mindst 60 sekunder, hvis det passer til hensigten, eller en rate-limit-mekanisme, der reelt understøtter fem sekunder. Gør lokale fallbacktal tydelige, hvis tallet præsenteres som fælles.

**Acceptkriterium:** En integrationstest med platformens KV-kontrakt dækker POST, og grænsetilfældet under 60 sekunder opdages af testen.

### T4 – CI tester ikke backendændringer som en selvstændig port

**Prioritet: høj. Evidens: workflow-kode og GitHub API.**

`.github/workflows/kvalitet.yml:10–11` kører på push til `main` og `runde-9`, men ignorerer ændringer, der kun vedrører `worker/**`, `mcp/**` og Markdown. Der er ingen `pull_request`-trigger i filen. De tre lokale enhedstestsuiter køres heller ikke som jobs i denne workflow.

Den eksisterende browsermatrix er god. Seneste kvalitetskørsel for den analyserede commit var grøn, inklusive alle syv profiler og Lighthouse. En tidligere kørsel på samme commit fejlede i mobil-Safari, hvorefter en senere bestod. Årsagen til forskellen er ikke fastslået.

**Retning:** Tilføj en hurtig PR-/push-workflow med worker-, router- og MCP-tests. Bevar browsermatrix på preview. En eventuel branch protection-regel kan ikke verificeres fra den læste kode alene.

**Acceptkriterium:** En ændring kun i `worker/` starter tests og kan stoppes før merge. Alle tre suiters resultater er synlige.

### T5 – Deployventetesten beviser ikke den aktuelle commit

**Prioritet: mellem. Evidens: kodefund.**

CI venter på, at `site.css?v=...` på Historien matcher repoet. Det er et assetmærke, ikke et entydigt deploy-id. Ved en ren HTML- eller middlewareændring kan mærket være uændret, og testen kan starte mod en tidligere deploy. AI-worker og MCP deployes desuden manuelt ifølge README.

**Retning:** Eksponér et ikke-følsomt release-/commit-id pr. deploybar del, og brug det i testens ventebetingelse. Dokumentér kompatibilitet og rollback for site, AI-worker, MCP og databasemigrationer.

### T6 – Sikkerhed kan svækkes ved manglende konfiguration

**Prioritet: mellem. Evidens: kodefund, ikke påvist produktionsfejl.**

`worker/src/lib/session.js:13` accepterer usignerede sessions-id'er, hvis `SESSION_SECRET` mangler. Gæstebogen springer Turnstile over, hvis `TURNSTILE_SECRET` mangler. README beskriver sessionshemmeligheden som obligatorisk i produktion, men kravet håndhæves ikke her.

**Retning:** Tillad disse udviklingsgenveje kun ved eksplicit lokal udviklingskonfiguration. Produktionsopstart eller beskyttede endpoints bør afvise manglende nødvendige secrets. Jeg har ikke konstateret, at secrets mangler på det kørende site.

### T7 – Afhængigheder og MCP-semantik kan strammes

**Prioritet: lav til mellem. Evidens: kodefund.**

`worker/package-lock.json` er eksplicit ignoreret, mens andre delprojekter har lockfiles. Det giver mindre reproducerbare installationer. Commit en lockfil for workerens værktøjer og afhængigheder, og test med den samme Node-hovedversion som CI.

MCP-værktøjet `afgoer_sagen` er markeret `idempotentHint: true`, men kan øge en fællestæller ved senere gentagelser. Vurder annotationen mod den faktiske sideeffekt, eller implementér reel idempotens. Det er en kontraktpræcision, ikke et påvist sikkerhedsbrud.

## Performance og målekvalitet

Hastighedssiden viste ved gennemgangen følgende egne RUM-tal, opdateret 29. oktober kl. 20.17:

| Måling | Vist værdi |
|---|---:|
| LCP, samlet 75-percentil | 5,3 s |
| Forsiden, LCP | 6 s |
| Arkivet, LCP | 5,5 s |
| Første byte, 75-percentil | 160 ms |
| Samlet CLS | 0 |
| INP | Ingen værdi |
| Sidevisninger i det viste 7-døgnsvindue | 141 |

Det er sitets egne tal, ikke min uafhængige Lighthouse-måling. Fordelingen var meget skæv: 135 af 141 visninger var fra USA, og 115 var ChromeMobile. Flere af de samme sider havde 14–16 visninger. Det kan være rigtige gæster, automatiserede besøg eller en blanding; det er ikke afklaret. Playwright-konfigurationen blokerer analytics, mens Lighthouse-konfigurationen ikke viser en tilsvarende blokering. Undersøg derfor testtrafik, før tallene bruges som repræsentative for gæsterne.

Siden viste cirka 4,5 sekunder for billedets opdagelsesforsinkelse og cirka 70 ms for selve hentningen i sin LCP-opdeling. Det peger på, at man bør undersøge discovery, visning og rendering før man alene komprimerer billeder. Separat beregnede percentiler kan ikke uden videre lægges sammen til én brugers forløb.

Positive forhold: hero-preload findes, mange billeder er lazy-loadede, og samtlige img-elementer i de fire udvalgte hovedsiders kilde havde bredde og højde. Frontendens statiske grundlag er en fordel.

Anbefalet måleforløb:

1. Adskil testtrafik fra gæster og vis antal målinger pr. metrik, ikke kun sidevisninger.
2. Mål forside og Arkiv med fast mobilprofil på den samme release.
3. Identificér det konkrete LCP-element i et trace; undersøg fontindlæsning, CSS, billedprioritering og animationer.
4. Forsiden indlæser 10 eksterne scriptfiler og Arkivet 11. Opdel efter funktion, så almindelige sider ikke indlæser alle gamle featurepakker.
5. Indfør performancebudgetter. Lighthouse-performance er i dag kun en advarsel ved score under 0,6; en grøn workflow er derfor ikke ensbetydende med hurtige sider.

## Testdækning og revisionens troværdighed

### Udførte lokale tests

| Suite | Resultat |
|---|---:|
| worker/test | 111 bestået |
| site-worker/test | 14 bestået |
| mcp/test efter npm ci | 3 bestået |
| I alt | 128 bestået |

Kørt med Node 24.22.1. CI er konfigureret til Node 22. MCP-testen kunne først ikke starte, fordi afhængigheder ikke var installeret; efter `npm ci --ignore-scripts` bestod den. Dette var ikke en produktfejl.

En statisk gennemgang af 72 HTML-filer fandt ingen manglende fragment-id'er blandt links, hvis lokale målside kunne opløses. Det er ikke en fuld crawltest af HTTP-status, redirects eller dynamiske links.

### Det, der stadig mangler

- Daglig revision har en fast liste på 32 sprogsider. Browsermatrixen har 22 sidepar, altså 44 ruter. Blandt andet de individuelle maskinrum under Maskinparken indgår ikke i denne liste. “Alle sider” er derfor for bredt formuleret.
- Tastaturtesten trykker Tab fire gange og kontrollerer kun det sidste fokus. Den dokumenterer ikke, at alle kontroller kan betjenes, eller at de første fire hver især har korrekt fokus.
- DOM-tilstedeværelse og HTTP 200 dækker ikke en komplet gæsterejse eller et backend-write.
- Der bør være målrettede testforløb for map-popovers, tastatur, modalernes fokus, fejl ved kvoteudløb, offlineadfærd og samtidige writes.

Live Revisionen viste stadig morgenens resultat: 0 bestået, 32 fejlet. GitHub issue #2 beskriver manglende navigation og andre selectors, selv om alle de listede sider havde HTTP 200. Den aktuelle kode har nye `.r12-nav`-selectors og en test, der adresserer redesignets markup. Det taler for, at rapporten kan være forældet i forhold til den nye frontend; det beviser ikke, at en frisk produktionsrevision nu vil bestå.

Vis derfor tidspunkt, dækkede ruter og release-id sammen med revisionsstatus. Genkør revision efter ændringer, der påvirker dens kontrakt. Adskil “testdefinition matcher ikke” fra “siden kunne ikke vises”. En rød offentlig rapport må ikke bare skjules, men den skal beskrive den rigtige tilstand.

## Dokumentation, fakta og vedligeholdelse

README, byggeguide, Cloudflare-featureoversigt, licensfil og SECURITY.md er gode åbne indgange. De tre repo-skills beskriver et fornuftigt forløb i små skridt og en sammenhængende billedstil. De er bygge- og opsætningsskills, ikke dokumentation for en udført sikkerhedsrevision.

Projektet har dog stadig spor af sin udviklingshistorie i produktets struktur: `round3.js`, `round6.js`, `round9.js`, gamle Pages-fallbacks, flere sideregistre og manuel cachebusting. Det gør det sværere at finde ejeren af en funktion og lettere at glemme en ny side i tests eller revision.

Jeg ville indføre ét sideregister med sti, sprogpartner, titel og testkrav, som kan bruges til sitemap, testlister og revision. Dernæst gradvist flytte kode til funktionsnavne frem for rundetal. Det kræver ikke React, Next.js eller en total omskrivning.

Præcisér desuden dokumentationens udsagn:

- En tilstedeværende binding er ikke bevis for, at en tjeneste fungerer. Vis konfiguration, seneste vellykkede kald og seneste fejl særskilt.
- “Ingen tredjeparter” er for bredt i en løsning med Cloudflare, fontlevering og eksterne integrationsmuligheder. Beskriv de konkrete dataveje.
- En hash af en IP-adresse er ikke det samme som, at der aldrig er behandlet en IP-adresse. Beskriv formål og opbevaring konkret uden absolutte anonymitetsløfter.
- Skemavalidering af et AI-svar garanterer format, ikke faktuel korrekthed eller immunitet mod prompt injection. De faktiske begrænsninger er værd at forklare.
- README's afsnit om en forside med 24 sagsakter afspejler en ældre informationsarkitektur. Tests/README omtaler også Pages i deployforløbet. Opdatér beskrivelserne til den nuværende drift.
- Supplér med en kort driftsvejledning om backup, restore, omkostningsalarmer, rollback og afhængighedsopdateringer. Serverless fjerner serveradministration, men ikke driftsansvar.

Faktaboksene fortjener en separat kilderunde. I Arkivet kaldes ENIAC verdens første elektroniske computer uden kvalifikation. Penn beskriver mere præcist en programmerbar elektronisk general-purpose-computer og dens offentlige lancering i 1946. Året 1945 kan vedrøre tidligere drift; præcisér hændelsen frem for blot at skifte årstal. Historien henviser desuden flere steder til institutioners forsider, som ikke dokumenterer den konkrete påstand. Bevar humoren, men giv faktuelle påstande præcise kilder og mindre absolutte garantier.

## Foreslået næste iteration

| Rækkefølge | Leverance | Færdig når |
|---|---|---|
| 1 | Cachegrænse og KV-rettelser | Admin kan ikke caches; gæstebog består samtidighedstest; afgørelsestæller består KV-kontrakttest |
| 2 | Backend-CI og releaseidentitet | Worker-only PR starter tests; hver deploybar del kan identificeres |
| 3 | Troværdig revision | Ny kørsel vises med release og dækningsliste; historiske fejl fremstår som historiske |
| 4 | Enkel begyndelse for gæsten | Tre anbefalede oplevelser er afprøvet på førstegangsbesøgende |
| 5 | Ryddet Arkiv og teknisk formidling | AI-svar er korte; kilder kan foldes ud; teknikken er frivillig |
| 6 | Performance | Kontrolleret baseline og trace forklarer LCP; ændringen forbedrer samme måling |
| 7 | Dokumentation og fælles sideregister | Lister, beskrivelser og driftsvejledning matcher implementationen |

Jeg ville udsætte nye Cloudflare-features, indtil disse punkter er gennemført. Projektet har allerede stof nok til både en god oplevelse og en stærk teknisk præsentation.

## Kilder og efterprøvning

- Live: https://tingsvad.dk/ · https://tingsvad.dk/arkivet/ · https://tingsvad.dk/oplevelser/ · https://tingsvad.dk/oplevelser/maskinparken/ · https://tingsvad.dk/maskinrummet/hastigheden/ · https://tingsvad.dk/maskinrummet/revisionen/
- Fast koderevision: https://github.com/wi24rd-com/tingsvad-website/tree/c1a612db6005179663c31fb6760417a1060d3c5b
- Grøn kvalitetskørsel: https://github.com/wi24rd-com/tingsvad-website/actions/runs/40942358719
- Tidligere kørsel med mobil-Safari-fejl: https://github.com/wi24rd-com/tingsvad-website/actions/runs/40942349458
- Daglig revision: https://github.com/wi24rd-com/tingsvad-website/issues/2
- Kørselsfejl: https://github.com/wi24rd-com/tingsvad-website/issues/3 — en registreret “Network connection lost”; ikke bevis for vedvarende nedbrud.
- KV-regler: https://developers.cloudflare.com/kv/api/write-key-value-pairs/
- ENIAC: https://penntoday.upenn.edu/news/penns-eniac-worlds-first-electronic-computer-turns-80

Ved sammenligning med Claudes analyse bør hvert teknisk fund matches på commit, kodeplacering, konkret reproduktion og konsekvens. Designuenighed kan være nyttig; tekniske påstande skal kunne efterprøves. Sammenlign især admincache, gæstebogens samtidighed, femsekunders-KV-reglen, CI-dækning og forskellen mellem den grønne kvalitetskørsel og den gamle røde revision.
