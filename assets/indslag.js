/* tingsvad.dk — indslag.js: samlet af tools/bundt.mjs fra assets/kilde/ (indslag-tekst.js, indslag.js, kaede.js). Ret kilderne, ikke denne fil. */
/* ═══ indslag-tekst.js (assets/kilde/indslag-tekst.js) ═══ */
/* tingsvad.dk — runde 5: tekstdata (da/en) til de 15 indslag og faktasporet.
   Ren data. Ingen logik. indslag.js slår op i window.TV5[lang]. */
window.TV5 = {
  da: {
    faner: [
      ['undersoeg', 'Undersøg sagen', 'Aktindsigt, skjoldets bagside, udgravningen og den forsvundne side 2.'],
      ['livet', 'Livet ved vadestedet', 'Opslagstavlen, køen, tågekameraet, museet og årstiderne.'],
      ['kontorer', 'Tingets kontorer', 'Stolekonfigurator, ekspertpanel, beredskab, målinger og søgning.'],
    ],
    status: { side2: 'Side 2', af: 'af', fragmenter: 'fragmenter', samlet: 'Side 2 er samlet. Sagen er ikke.' },
    nulstil: { knap: 'Nulstil oplevelsen', note: 'Rydder kun dine fund, kønummer og sæsonvalg på denne enhed. Gæstebog, lyd og tema rører den ikke.', ok: 'Oplevelsen er nulstillet. Mímir har ført det til protokols: udsat.' },
    ikonTekst: 'Illustration af et fiktivt univers – ikke dokumentation.',

    /* F01 */
    kotolk: {
      knap: 'Afhør vidnet', titel: 'Afhøring af vidnet', luk: 'Luk afhøringen',
      intro: 'Vidnet siger det samme hver gang. Tolken er det, der varierer. Vælg en tolk.',
      tolk: 'Tolk', muh: 'Muh.', under: 'Undertekst',
      tolke: [
        ['Ulf', 'Hun siger tydeligt, at hun er min.'],
        ['Gudrun', 'Hun efterspørger bilag.'],
        ['Mímir', 'Vidnet ønsker frokost.'],
        ['Ragnhild', 'Hun vil over på den anden mark. Flyt jer.'],
      ],
      afhoer: 'Afhør', afhoerer: 'Afhører…', note: 'Afhøringen er lydløs. Vidnet har ikke godkendt optagelse. Ejerskabet ændres ikke af tolkningen.',
    },

    /* F02 */
    akt: {
      titel: 'Aktindsigt', under: 'Et dokument fra arkivet. Fire overstregninger. Tryk på dem.',
      hoved: 'TINGSVAD TING · AFGØRELSE · SIDE 1 AF 2',
      linjer: [
        'Tinget sat ved vadestedet omkring år 980 i tæt tåge.',
        'Sagen: ejendomsretten til én (1) ko, rødbroget, med gås.',
        'Fremmødt: syv stemmeberettigede, én ulv, én gås (siddende på koen).',
        'Vidneforklaring afgivet af koen: se ovenfor.',
        'Afgørelse: udsat. Begrundelse: ',
      ],
      skjult: [
        ['Ingen ved, hvorfor dette er overstreget.', 'Overstregning 1'],
        ['Frokost.', 'Overstregning 2'],
        ['Mímir har spist originalen. Dette er en rekonstruktion.', 'Overstregning 3'],
        ['Ejeren af koen er … se side 2.', 'Overstregning 4'],
      ],
      afsloer: 'Afslør', afsloeret: 'Afsløret:',
      saml: 'Saml fragment', samlet: 'Fragment samlet', fund: 'Et stykke af side 2 lå i folden. Du har samlet det.',
      fod: 'Overstregningerne er en leg; dokumenterne er opdigtede.',
    },

    /* F12 */
    skjold: {
      titel: 'Vend skjoldet', under: 'Asgeir har aldrig vist bagsiden. Den er, ifølge ham, endnu mindre relevant.',
      vend: 'Vend skjoldet', vendTilbage: 'Vend til forsiden', forside: 'Forsiden', bagside: 'Bagsiden',
      rem: 'Undersøg remmen', remHint: 'Der sidder en seddel under læderremmen.',
      seddel: 'Første udkast til afgørelse. Se side 2.', asgeir: 'Asgeir: Bagsiden er endnu mindre relevant end forsiden.',
      saml: 'Saml fragment', samlet: 'Fragment samlet',
      alt: 'Maleri: bagsiden af et rundt træskjold med læderrem. Under remmen stikker en gammel seddel frem. Nederst er en lille ko ridset ind i træet.',
    },

    /* F04 */
    grav: {
      titel: 'Arkæologisk udgravning', under: 'Et felt ved den fjerde sten. Børst jorden væk, eller undersøg felterne et ad gangen.',
      hint: 'Træk fingeren eller musen over feltet for at børste. Fundene er illustrationer af fiktive fund.',
      felt: 'Undersøg felt', felter: ['A', 'B', 'C'],
      fund: {
        kam: ['Kam', 'Har ordnet flere problemer end tinget.'],
        moent: ['Mønt', 'Indbetalt som gebyr. Beløbet kunne ikke læses.'],
        runepind: ['Runepind', 'Husk at spørge koen.'],
      },
      fundet: 'Fundet', fundliste: 'Fund', ingen: 'Ingen fund endnu. Jorden er stadig jord.',
      alle: 'Alle tre fund er registreret. Under det sidste lå et stykke af side 2.',
      saml: 'Saml fragment', samlet: 'Fragment samlet', nulstil: 'Grav igen',
      alt: 'Udgravningsfelt: mørk, fugtig jord set ovenfra.',
    },

    /* F03 */
    side2: {
      titel: 'Den forsvundne side 2', under: 'Afgørelsens anden side gik i tre stykker. Ingen ved hvornår. Mímir var til stede.',
      findesteder: { archive: ['Aktindsigten', 'Overstregning 4 i dokumentet.'], shield: ['Skjoldets bagside', 'Under læderremmen.'], excavation: ['Udgravningen', 'Under det tredje fund.'] },
      fundet: 'Fundet', mangler: 'Mangler',
      brik: ['Stykke A', 'Stykke B', 'Stykke C'],
      tekst: { archive: 'Ejeren af koen er', shield: 'endnu ikke identificeret.', excavation: 'Fortsæt på side 3.' },
      tom: '…',
      afsloer: 'Ejeren af koen er endnu ikke identificeret. Fortsæt på side 3.',
      brian: 'Mímir tilføjer: Godt arbejde. Sagen er nu blevet længere.',
      venter: 'Find alle tre stykker. Rækkefølgen er ligegyldig. Det er sagen også.',
      segl: 'Tingets segl. Tildelt for at have samlet noget.',
      alt: 'Et ældgammelt, revnet pergament i tre stykker med lakstempel i hjørnet.',
    },

    /* F11 */
    tavle: {
      titel: 'Opslagstavlen', under: 'Seks opslag om dagen. Skiftes ved midnat, dansk tid, af nogen.',
      flere: 'Vis flere opslag', faerre: 'Vis kun dagens', alt: 'Maleri: en gammel opslagstavle af træ ved åen med seks tomme sedler fastgjort med søm og snor.',
      opslag: [
        'Bortkommet: én gås. Fundet: én gås. Sammenhæng undersøges.',
        'Ønskes: sekundær protokolfører. Skal kunne skrive ét ord.',
        'Den, der har flyttet stolen fire centimeter, bedes flytte den tilbage.',
        'Fælles arbejdsdag ved den løse sten. Medbring en undskyldning.',
        'Frokostudvalget mangler en beslutning om frokost.',
        'Hittegods: en hånd, der blev rakt op i 1799. Ejeren bedes melde sig.',
        'Sælges: ét skjold. Ikke relevant. Henvendelse: ikke til Asgeir.',
        'Tågen holder åbent hus. Alle dage. Ingen tilmelding.',
        'Ko efterlyses ikke. Den står ved den fjerde sten. Som altid.',
        'Kursus: "Sådan udsætter du". Fuldt booket siden 980.',
        'Byttes: én afgørelse mod to forbehold. Kontakt Gamle Ravn.',
        'Mødet i morgen er udsat. Mødet om udsættelsen er også udsat.',
        'Tabt: tråden. Sidst set i 1241.',
        'Gudrun søger hjælp til et spørgsmålstegn. Henvendelse skriftligt.',
        'Halvdan tilbyder sin stemme til eventuelt. Uprøvet.',
        'Bjørn Pelsværk har noget at sige. Han venter på det rette øjeblik. Siden 980.',
        'Vedtægtsændring foreslået: § 2 ændres til § 2. Behandles under eventuelt.',
        'Nettet er nede. Det er også oppe. Mímir undersøger.',
      ],
    },

    /* F08 */
    koe: {
      titel: 'Køsedlen', under: 'Træk et nummer. Tinget betjener i den rækkefølge, sager er indkommet. Der er én sag foran dig.',
      traek: 'Træk et nummer', dit: 'Dit nummer', betjener: 'Vi betjener', foerste: 'K-0980-0001',
      vent: ['Forventet ventetid: efter frokost.', 'Forventet ventetid: to dynastier.', 'Forventet ventetid: koens levetid plus ekspedition.'],
      igen: 'Mímir: Du står her allerede.', tilbage: 'Mímir har lagt mærke til, at du stadig venter.',
      note: 'Nummeret er lokalt for din browser. Der er ikke noget globalt køtal. Der er heller ikke nogen kø.',
      alt: 'Maleri: en gammel nummerautomat af træ og messing med skifertavle og papirstrimmel, stående på en sten ved åen.',
      ingen: 'Intet nummer endnu.',
    },

    /* F09 */
    kamera: {
      titel: 'Tågekamera', under: 'Simuleret udsigt fra vadestedet. Ikke et webcam. Ikke et optagelsestidspunkt. Tåge.',
      maerke: 'SIMULERET UDSIGT', start: 'Start overvågning', pause: 'Pause', nu: 'Vis en observation nu', koerer: 'Overvåger…',
      obs: 'Observation: en gås glider gennem forgrunden. Senere afkræftet.', stille: 'Ingen observationer. Tågen er stabil.',
      arkiv: 'Arkiv', arkivT: [['14. april', 'En kontur. Senere afkræftet.'], ['3. juni', 'Mulig sommer. Varede ikke ved.'], ['8. september', 'Ko uden yderligere kommentarer.']],
      alt: 'Maleri: tæt tåge over åen ved vadestedet med en række sten i forgrunden og en bleg sol bag disen.',
      reduce: 'Bevægelse er slået fra på din enhed. Observationer vises som stillbillede.',
    },

    /* F14 */
    museum: {
      titel: 'Museet for det, der næsten skete', under: 'Tre montrer. Alle tomme. Den tredje er tildækket, hvilket er mere end de andre.',
      montrer: ['Hammeren, der næsten faldt', 'Dokumentet, der næsten blev underskrevet', 'Punktet eventuelt'],
      beskr: ['Hævet i 1572. Ikke sænket. Står stadig i luften, et sted.', 'Fjerpennen nåede papiret. Papiret nåede åen.', 'Tildækket. Punktet er ikke nået, og udstillingen heller ikke.'],
      loeft: 'Løft klædet', loeftet: 'Udstillingen åbner efter koen.', igen: 'Du har nu set eventuelt. Det er mere, end tinget har.', laeg: 'Læg klædet på igen',
      tom: 'Montren er tom.',
      alt: 'Maleri: en lys museumssal med tre tomme glasmontrer på egetræssokler og udsigt til åen gennem en åben port.',
      hjelm: {
        titel: 'Udlånt montre: Hjelmen', tekst: 'Kunstnerisk rekonstruktion af en vikingetidshjelm. Uden horn. Udlånt fra tingets fantasi; ikke et fund.',
        ting: 'Tingets kommentar: Koen har horn. Derfor blev den fejlregistreret som kriger.',
        fakta: 'Den næsten komplette hjelm fra Gjermundbu i Norge er den bedst bevarede fra vikingetiden – og den har ingen horn. Hornede hjelme på vikinger er en opfindelse fra 1800-tallets kunst og teater. Hjelmen her er en illustration, ikke et fotografi af et fund.',
        kilde: 'Nationalmuseet: Hjelme', url: 'https://natmus.dk/historisk-viden/danmark/oldtid-indtil-aar-1050/vikingetiden-800-1050/vaaben/hjelme/',
        alt: 'Illustration: en rustrød vikingetidshjelm med næseværn, uden horn.',
      },
    },

    /* F15 */
    saeson: {
      titel: 'Årstider ved vadestedet', under: 'Vadestedet følger kalenderen i København. Du kan prøve en anden årstid uden at flytte din computer.',
      vaelg: 'Årstid', auto: 'Automatisk', navne: { vinter: 'Vinter', foraar: 'Forår', sommer: 'Sommer', efteraar: 'Efterår' },
      besked: { vinter: 'Den fjerde sten er midlertidigt stabil.', foraar: 'Åen er steget. Bevismaterialet flyder.', sommer: 'Arbejdsforholdene er blevet synlige.', efteraar: 'Bladene falder. Sagen gør ikke.' },
      morten: 'Gudrun svarer automatisk: Træffes ikke. Oplyser ikke hvor.',
      nu: 'Lige nu ved vadestedet',
    },

    /* F05 */
    stol: {
      titel: 'Tokes stolekonfigurator', under: 'Toke har en stol bevilget. Den kan tilpasses. Hver tilpasning har en konsekvens.',
      valg: [
        ['ryg', 'Ryglæn', 'Ryglæn kræver vedtægtsændring.'],
        ['arm', 'Armlæn', 'Armlæn kan opfattes som magtovertagelse.'],
        ['hjul', 'Hjul', 'Hjul betragtes som udrejse.'],
        ['polster', 'Polstring', 'Polstring afventer fåret.'],
        ['bred', 'Levering til bredden', 'Levering sker til bredden. Aldrig til stenen.'],
      ],
      oversigt: 'Bestillingsoversigt', ingen: 'Ingen tilvalg. En skammel.', send: 'Fremsend til overvejelse', sendt: 'Fremsendt',
      resultat: 'En almindelig skammel.', forbehold: '19 forbehold.',
      fem: ['Forbehold 1: Skamlen må ikke belastes, før sagen om at sidde ned er afgjort.', 'Forbehold 2: Skamlen bliver på bredden.', 'Forbehold 3: Tilvalg er noteret, ikke bevilget.', 'Forbehold 4: Toke bekræfter, at han ikke sætter sig.', 'Forbehold 5: Leveringen er sket. Det er ikke det samme som modtaget.'],
      resten: 'Yderligere 14 forbehold foreligger mundtligt.',
      note: 'Tegningen er stemningsgrafik, ikke en byggeplan. Der bestilles ikke noget.',
      alt: 'Tegning på pergament: en trebenet skammel i midten, en stol med ryglæn til venstre og en skammel på hjul til højre.',
    },

    /* F06 */
    panel: {
      titel: 'Ekspertpanelet', under: 'Fem eksperter er indkaldt. Ingen af dem er mødt op, men deres ting står på bordet.',
      eksperter: [
        ['arkaeolog', 'Arkæolog', 'Lad koen ligge urørt, til laget er registreret.', 13, 66],
        ['it', 'IT-arkitekt', 'Vi migrerer ejerskabet efter en prøveperiode.', 35, 58],
        ['revisor', 'Revisor', 'Er koen et aktiv eller en løbende udgift?', 63, 46],
        ['filosof', 'Filosof', 'Kan nogen eje en, der selv går sin vej?', 65, 63],
        ['landmand', 'Landmand', 'Jeg har åbnet lågen.', 92, 26],
      ],
      vaelg: 'Vælg en ekspert.', laage: 'Lågen er åben. Koen bliver stående. Den har ikke fået besked.',
      note: 'Svarene er manuskript. Ingen rigtige eksperter er blevet spurgt, og ingen maskine har svaret.',
      alt: 'Maleri: et bord ved åen med en arkæologs pensel og potteskår, en bærbar af sten, en kugleramme, en opslået bog med fjerpen og en høtyv.',
    },

    /* F07 */
    beredskab: {
      titel: 'Beredskabsplan', under: 'Seks rum. Seks situationer, der aldrig er indtruffet. Planen er klar.',
      rum: [
        ['Tågen letter', 'Undgå øjenkontakt. Nogen kan foreslå en afgørelse.', 30, 46],
        ['Koen får en kalv', 'Opret undersag.', 50, 46],
        ['Ragnhild nærmer sig', 'Find en procedure.', 70, 46],
        ['Mímir siger ja', 'Kontrollér, at det er Mímir.', 30, 78],
        ['Stolen er varm', 'Afspær området.', 50, 78],
        ['Nettet sender andet end udsat', 'Frakobl tovet og tilkald Gudrun.', 70, 78],
      ],
      instruks: 'Instruks', luk: 'Luk', rumNr: 'Rum',
      alt: 'Maleri: et åbent træskab med seks rum, hvori ligger en rulle, et tov, strømper, en spand, et brev og en klokke.',
    },

    /* F13 */
    maal: {
      titel: 'Kontoret for upræcise målinger', under: 'Tinget måler i enheder, der ikke findes. Måleenhederne er opdigtede.',
      regler: ['Ét møde = ' + tvAar('da') + ' år, når koen er på dagsordenen.', 'Én tør sok = længden af en fod, som Mímir ikke har målt.', 'Én runesten = plads til ét ord, når ordet er udsat.'],
      omr: [
        ['tid', 'Varighed i møder', 'År', [['aar', 'år'], ['mdr', 'måneder'], ['dage', 'dage']]],
        ['afstand', 'Afstand i tørre sokker', 'Afstand', [['m', 'meter'], ['km', 'kilometer'], ['skridt', 'skridt']]],
        ['data', 'Datamængde i runesten', 'Mængde', [['ord', 'ord'], ['kb', 'KB'], ['gb', 'GB']]],
      ],
      beregn: 'Omregn', vaerdi: 'Værdi', enhed: 'Enhed',
      svarTid: { neg: 'Gamle Ravn husker det som i morgen.', nul: 'Mødet er ikke begyndt. Det er det aldrig.', lille: 'Mindre end en indledende bemærkning.', et: 'Ét møde.', flere: '{n} møder. Koen er på dagsordenen til dem alle.' },
      svarAfstand: { neg: 'Du er gået baglæns. Det har Toke også.', nul: 'Ingen afstand. Du står på stenen.', lille: 'Færre sokker, end Mímir har. Han har ingen.', mellem: 'Et pænt antal tørre sokker. Ingen af dem er Mímirs.', stor: 'Flere sokker, end tågen kan tørre. Afstanden er udsat.' },
      svarData: { neg: 'Negativ data. Nettet har modtaget den. Det modtager ellers aldrig noget.', nul: 'Ingen sten nødvendig. Ordet er allerede udsat.', et: 'Én runesten. Ordet er: udsat.', faa: 'Et par sten. Nettet har seks. Det rækker.', mange: 'Kræver flere sten. Antallet behandles efter koen.' },
      ugyldig: 'Indtast et tal. Tinget accepterer ikke tåge som værdi.',
      alt: 'Maleri: et bord ved åen med et timeglas, en balancevægt med en sok og en sten, en rebrulle, en træmålestok og en bog.',
    },

    /* F10 */
    soeg: {
      titel: 'Søg i tågen', under: 'Søg i sagsakternes overskrifter og tekster. Resultaterne er rigtige. Kommentaren er tingets.',
      label: 'Søgeord', placeholder: 'fx ko, stol, afgørelse …', knap: 'Søg', ryd: 'Ryd',
      ingen: 'Ingen fund i tågen. Prøv et andet ord, eller følg åen.', antal: '{n} steder på siden',
      saer: { 'afgørelse': 'Ingen endelige svar. Her er de relevante sagsakter.', 'ko': 'Ét vidne. Det flytter sig.', 'stol': 'Du har ikke rettigheder til at sidde på resultatet.', 'eventuelt': 'Hele tinget føler sig kaldet.' },
      alm: 'Fundet i tågen. Tinget har ikke læst det.',
      gaa: 'Gå til',
    },

    /* H01–H03 */
    pind: {
      titel: 'Send en pind', under: 'Runerne ovenfor kan også skæres i en pind og sendes nedstrøms. Beskeden vises her som runeleg oven på pinden.',
      send: 'Send nedstrøms', sendt: 'Pinden er sendt nedstrøms. Den ankommer om mellem tre dage og fire hundrede år.',
      hoevl: 'Høvl beskeden væk', hoevlet: 'Beskeden er slettet. Pinden er nu smallere.', tom: 'Pinden er tom. Skriv noget i feltet ovenfor.',
      pindAlt: 'Illustration: en runepind af lyst træ med en snor i den ene ende.', knivAlt: 'Illustration: en lille snittekniv med træskaft.',
      modern: 'Moderne tekst',
      fakta1: 'Runer blev ikke kun hugget i sten. I middelalderen skrev man også breve og beskeder på små træpinde – Historisk Museum i Oslo viser blandt andet en bestilling på spydspidser. Det er middelaldermateriale, ikke dokumentation for præcis samme praksis ved et dansk ting i 980.',
      fakta2: 'Samme samling rummer et frierbrev fra Lom stavkirke, hvor nogen senere har forsøgt at skære navnene væk med en kniv. Også det er middelalder. Kniven her sletter kun din egen leg.',
      kilde: 'Historisk Museum, Oslo: Runic letters', url: 'https://www.historiskmuseum.no/english/exhibitions/exhibitions-archive/kiss-me-the-world-of-runes/runic-letters-and-class-exercises/',
    },
    graatand: {
      titel: 'Gråtand', under: 'Tingets udgave af Blåtand. Farven skyldes tågen. Forbindelsen oprettes, når begge parter er enige. Det er ikke sket endnu.',
      par: 'Par enhederne', status1: 'Koen er ikke synlig for andre enheder.', status2: 'Enhederne afventer samtykke fra Halvdan.',
      runer: 'ᚼ + ᛒ', runerForkl: 'Haralds initialer i yngre futhark: hagall (H) og bjarkan (B).',
      fakta: 'Bluetooth-logoet er en bindrune af ᚼ (hagall, H) og ᛒ (bjarkan, B) – initialerne på Harald Blåtand, der samlede Danmark og Norge, som standarden samler enheder. Knappen her rører ikke din egen Bluetooth og beder ikke om tilladelser.',
      kilde: 'bluetooth.com: Bluetooth origin', url: 'https://www.bluetooth.com/about-us/bluetooth-origin/',
    },
    fakta: 'Det ved vi faktisk',
  },

  en: {
    faner: [
      ['undersoeg', 'Investigate the case', 'The file, the back of the shield, the dig and the missing page 2.'],
      ['livet', 'Life at the ford', 'The notice board, the queue, the fog camera, the museum and the seasons.'],
      ['kontorer', 'The thing\'s offices', 'Stool configurator, expert panel, contingency plan, measurements and search.'],
    ],
    status: { side2: 'Page 2', af: 'of', fragmenter: 'fragments', samlet: 'Page 2 is assembled. The case is not.' },
    nulstil: { knap: 'Reset the experience', note: 'Clears only your finds, queue number and season choice on this device. Guestbook, sound and theme are untouched.', ok: 'The experience has been reset. Mímir has entered it into the minutes: adjourned.' },
    ikonTekst: 'Illustration of a fictional universe – not documentation.',

    kotolk: {
      knap: 'Question the witness', titel: 'Examination of the witness', luk: 'Close the examination',
      intro: 'The witness says the same thing every time. The interpreter is what varies. Choose an interpreter.',
      tolk: 'Interpreter', muh: 'Moo.', under: 'Subtitle',
      tolke: [
        ['Ulf', 'She says clearly that she is mine.'],
        ['Gudrun', 'She is requesting supporting documents.'],
        ['Mímir', 'The witness would like lunch.'],
        ['Ragnhild', 'She wants to go to the other field. Move.'],
      ],
      afhoer: 'Question', afhoerer: 'Questioning…', note: 'The examination is silent. The witness has not consented to recording. Ownership is not changed by interpretation.',
    },

    akt: {
      titel: 'Freedom of information', under: 'A document from the archive. Four redactions. Press them.',
      hoved: 'TINGSVAD THING · DECISION · PAGE 1 OF 2',
      linjer: [
        'The thing convened at the ford around the year 980 in dense fog.',
        'The case: ownership of one (1) cow, red and white, with goose.',
        'Present: seven voting members, one wolf, one goose (sitting on the cow).',
        'Testimony given by the cow: see above.',
        'Decision: adjourned. Grounds: ',
      ],
      skjult: [
        ['Nobody knows why this was redacted.', 'Redaction 1'],
        ['Lunch.', 'Redaction 2'],
        ['Mímir has eaten the original. This is a reconstruction.', 'Redaction 3'],
        ['The owner of the cow is … see page 2.', 'Redaction 4'],
      ],
      afsloer: 'Reveal', afsloeret: 'Revealed:',
      saml: 'Collect fragment', samlet: 'Fragment collected', fund: 'A piece of page 2 was in the fold. You have collected it.',
      fod: 'The redactions are a game; the documents are invented.',
    },

    skjold: {
      titel: 'Turn the shield', under: 'Asgeir has never shown the back. It is, according to him, even less relevant.',
      vend: 'Turn the shield', vendTilbage: 'Turn to the front', forside: 'The front', bagside: 'The back',
      rem: 'Examine the strap', remHint: 'There is a note under the leather strap.',
      seddel: 'First draft of a decision. See page 2.', asgeir: 'Asgeir: The back is even less relevant than the front.',
      saml: 'Collect fragment', samlet: 'Fragment collected',
      alt: 'Painting: the back of a round wooden shield with a leather strap. An old note sticks out from under the strap. A small cow is scratched into the wood at the bottom.',
    },

    grav: {
      titel: 'Archaeological dig', under: 'A trench by the fourth stone. Brush the soil away, or examine the squares one at a time.',
      hint: 'Drag your finger or mouse across the trench to brush. The finds are illustrations of fictional objects.',
      felt: 'Examine square', felter: ['A', 'B', 'C'],
      fund: {
        kam: ['Comb', 'Has sorted out more problems than the thing.'],
        moent: ['Coin', 'Paid as a fee. The amount could not be read.'],
        runepind: ['Rune stick', 'Remember to ask the cow.'],
      },
      fundet: 'Found', fundliste: 'Finds', ingen: 'No finds yet. The soil is still soil.',
      alle: 'All three finds are recorded. Under the last one lay a piece of page 2.',
      saml: 'Collect fragment', samlet: 'Fragment collected', nulstil: 'Dig again',
      alt: 'Excavation trench: dark, damp soil seen from above.',
    },

    side2: {
      titel: 'The missing page 2', under: 'The second page of the decision broke into three pieces. Nobody knows when. Mímir was present.',
      findesteder: { archive: ['The file', 'Redaction 4 in the document.'], shield: ['The back of the shield', 'Under the leather strap.'], excavation: ['The dig', 'Under the third find.'] },
      fundet: 'Found', mangler: 'Missing',
      brik: ['Piece A', 'Piece B', 'Piece C'],
      tekst: { archive: 'The owner of the cow has', shield: 'not yet been identified.', excavation: 'Continued on page 3.' },
      tom: '…',
      afsloer: 'The owner of the cow has not yet been identified. Continued on page 3.',
      brian: 'Mímir adds: Good work. The case is now longer.',
      venter: 'Find all three pieces. The order does not matter. Neither does the case.',
      segl: 'The thing\'s seal. Awarded for having assembled something.',
      alt: 'An ancient, cracked parchment in three pieces with a wax seal in the corner.',
    },

    tavle: {
      titel: 'The notice board', under: 'Six notices a day. Changed at midnight, Danish time, by someone.',
      flere: 'Show more notices', faerre: 'Show only today\'s', alt: 'Painting: an old wooden notice board by the river with six blank notes fixed with nails and string.',
      opslag: [
        'Lost: one goose. Found: one goose. Connection under investigation.',
        'Wanted: deputy keeper of the minutes. Must be able to write one word.',
        'Whoever moved the stool four centimetres is asked to move it back.',
        'Communal work day at the loose stone. Bring an apology.',
        'The lunch committee lacks a decision on lunch.',
        'Lost property: a hand raised in 1799. Owner please come forward.',
        'For sale: one shield. Not relevant. Enquiries: not to Asgeir.',
        'The fog holds an open house. Every day. No registration.',
        'Cow not missing. It is standing at the fourth stone. As always.',
        'Course: "How to adjourn". Fully booked since 980.',
        'Swap: one decision for two reservations. Contact Old Ravn.',
        'Tomorrow\'s meeting is adjourned. The meeting about the adjournment is also adjourned.',
        'Lost: the thread. Last seen in 1241.',
        'Gudrun seeks help with a question mark. Apply in writing.',
        'Halvdan offers his vote for any other business. Untested.',
        'Bjørn Furcoat has something to say. He is waiting for the right moment. Since 980.',
        'Proposed amendment: § 2 to be changed to § 2. To be dealt with under any other business.',
        'The network is down. It is also up. Mímir is investigating.',
      ],
    },

    koe: {
      titel: 'The queue ticket', under: 'Take a number. The thing serves cases in the order they arrived. There is one case ahead of you.',
      traek: 'Take a number', dit: 'Your number', betjener: 'Now serving', foerste: 'K-0980-0001',
      vent: ['Estimated wait: after lunch.', 'Estimated wait: two dynasties.', 'Estimated wait: the lifetime of the cow plus processing.'],
      igen: 'Mímir: You are already standing here.', tilbage: 'Mímir has noticed that you are still waiting.',
      note: 'The number is local to your browser. There is no global queue count. There is no queue either.',
      alt: 'Painting: an old ticket dispenser of wood and brass with a slate and a paper strip, standing on a stone by the river.',
      ingen: 'No number yet.',
    },

    kamera: {
      titel: 'Fog camera', under: 'Simulated view from the ford. Not a webcam. Not a timestamp. Fog.',
      maerke: 'SIMULATED VIEW', start: 'Start surveillance', pause: 'Pause', nu: 'Show an observation now', koerer: 'Watching…',
      obs: 'Observation: a goose glides through the foreground. Later refuted.', stille: 'No observations. The fog is stable.',
      arkiv: 'Archive', arkivT: [['14 April', 'An outline. Later refuted.'], ['3 June', 'Possible summer. Did not last.'], ['8 September', 'Cow, no further comment.']],
      alt: 'Painting: dense fog over the river at the ford with a row of stones in the foreground and a pale sun behind the haze.',
      reduce: 'Motion is turned off on your device. Observations are shown as a still image.',
    },

    museum: {
      titel: 'The museum of what nearly happened', under: 'Three display cases. All empty. The third is covered, which is more than the others.',
      montrer: ['The hammer that nearly fell', 'The document that was nearly signed', 'The item: any other business'],
      beskr: ['Raised in 1572. Not lowered. Still in the air, somewhere.', 'The quill reached the paper. The paper reached the river.', 'Covered. The item has not been reached, and neither has the exhibition.'],
      loeft: 'Lift the cloth', loeftet: 'The exhibition opens after the cow.', igen: 'You have now seen any other business. That is more than the thing has.', laeg: 'Put the cloth back',
      tom: 'The case is empty.',
      alt: 'Painting: a bright museum hall with three empty glass cases on oak plinths and a view of the river through an open gate.',
      hjelm: {
        titel: 'On loan: The helmet', tekst: 'Artistic reconstruction of a Viking Age helmet. No horns. On loan from the thing\'s imagination; not a find.',
        ting: 'The thing\'s comment: The cow has horns. That is why it was misregistered as a warrior.',
        fakta: 'The nearly complete helmet from Gjermundbu in Norway is the best-preserved from the Viking Age – and it has no horns. Horned helmets on Vikings are an invention of 19th-century art and theatre. The helmet here is an illustration, not a photograph of a find.',
        kilde: 'National Museum of Denmark: Helmets', url: 'https://natmus.dk/historisk-viden/danmark/oldtid-indtil-aar-1050/vikingetiden-800-1050/vaaben/hjelme/',
        alt: 'Illustration: a rust-red Viking Age helmet with a nose guard, without horns.',
      },
    },

    saeson: {
      titel: 'Seasons at the ford', under: 'The ford follows the calendar in Copenhagen. You can try another season without moving your computer.',
      vaelg: 'Season', auto: 'Automatic', navne: { vinter: 'Winter', foraar: 'Spring', sommer: 'Summer', efteraar: 'Autumn' },
      besked: { vinter: 'The fourth stone is temporarily stable.', foraar: 'The river has risen. The evidence is floating.', sommer: 'Working conditions have become visible.', efteraar: 'The leaves are falling. The case is not.' },
      morten: 'Gudrun replies automatically: Not available. Does not say where.',
      nu: 'Right now at the ford',
    },

    stol: {
      titel: 'Toke\'s stool configurator', under: 'Toke has been granted a stool. It can be customised. Every customisation has a consequence.',
      valg: [
        ['ryg', 'Backrest', 'A backrest requires an amendment to the bylaws.'],
        ['arm', 'Armrests', 'Armrests may be perceived as a seizure of power.'],
        ['hjul', 'Wheels', 'Wheels are considered emigration.'],
        ['polster', 'Upholstery', 'Upholstery awaits the sheep.'],
        ['bred', 'Delivery to the bank', 'Delivery is to the bank. Never to the stone.'],
      ],
      oversigt: 'Order summary', ingen: 'No options. A stool.', send: 'Submit for consideration', sendt: 'Submitted',
      resultat: 'An ordinary stool.', forbehold: '19 reservations.',
      fem: ['Reservation 1: The stool may not be loaded until the case on sitting down is decided.', 'Reservation 2: The stool stays on the bank.', 'Reservation 3: Options are noted, not granted.', 'Reservation 4: Toke confirms that he will not sit down.', 'Reservation 5: Delivery has taken place. That is not the same as received.'],
      resten: 'A further 14 reservations are available verbally.',
      note: 'The drawing is atmosphere, not a building plan. Nothing is ordered.',
      alt: 'Drawing on parchment: a three-legged stool in the middle, a chair with a backrest on the left and a stool on wheels on the right.',
    },

    panel: {
      titel: 'The expert panel', under: 'Five experts have been summoned. None of them turned up, but their things are on the table.',
      eksperter: [
        ['arkaeolog', 'Archaeologist', 'Leave the cow undisturbed until the layer has been recorded.', 13, 66],
        ['it', 'IT architect', 'We migrate ownership after a trial period.', 35, 58],
        ['revisor', 'Accountant', 'Is the cow an asset or an ongoing expense?', 63, 46],
        ['filosof', 'Philosopher', 'Can anyone own one who walks away on her own?', 65, 63],
        ['landmand', 'Farmer', 'I have opened the gate.', 92, 26],
      ],
      vaelg: 'Choose an expert.', laage: 'The gate is open. The cow stays put. Nobody told her.',
      note: 'The answers are script. No real experts were asked, and no machine replied.',
      alt: 'Painting: a table by the river with an archaeologist\'s brush and potsherds, a stone laptop, an abacus, an open book with a quill and a pitchfork.',
    },

    beredskab: {
      titel: 'Contingency plan', under: 'Six compartments. Six situations that have never occurred. The plan is ready.',
      rum: [
        ['The fog lifts', 'Avoid eye contact. Someone might propose a decision.', 30, 46],
        ['The cow has a calf', 'Open a sub-case.', 50, 46],
        ['Ragnhild approaches', 'Find a procedure.', 70, 46],
        ['Mímir says yes', 'Check that it is Mímir.', 30, 78],
        ['The stool is warm', 'Cordon off the area.', 50, 78],
        ['The network sends something other than adjourned', 'Disconnect the rope and call Gudrun.', 70, 78],
      ],
      instruks: 'Instruction', luk: 'Close', rumNr: 'Compartment',
      alt: 'Painting: an open wooden cabinet with six compartments containing a scroll, a rope, socks, a bucket, a letter and a bell.',
    },

    maal: {
      titel: 'The office of imprecise measurement', under: 'The thing measures in units that do not exist. The units are made up.',
      regler: ['One meeting = ' + tvAar('en') + ' years, when the cow is on the agenda.', 'One dry sock = the length of a foot Mímir has not measured.', 'One runestone = room for one word, when the word is adjourned.'],
      omr: [
        ['tid', 'Duration in meetings', 'Years', [['aar', 'years'], ['mdr', 'months'], ['dage', 'days']]],
        ['afstand', 'Distance in dry socks', 'Distance', [['m', 'metres'], ['km', 'kilometres'], ['skridt', 'steps']]],
        ['data', 'Data in runestones', 'Amount', [['ord', 'words'], ['kb', 'KB'], ['gb', 'GB']]],
      ],
      beregn: 'Convert', vaerdi: 'Value', enhed: 'Unit',
      svarTid: { neg: 'Old Ravn remembers it as tomorrow.', nul: 'The meeting has not begun. It never has.', lille: 'Less than an opening remark.', et: 'One meeting.', flere: '{n} meetings. The cow is on the agenda for all of them.' },
      svarAfstand: { neg: 'You have walked backwards. So has Toke.', nul: 'No distance. You are standing on the stone.', lille: 'Fewer socks than Mímir has. He has none.', mellem: 'A fair number of dry socks. None of them Mímir\'s.', stor: 'More socks than the fog can dry. The distance is adjourned.' },
      svarData: { neg: 'Negative data. The network has received it. It never receives anything otherwise.', nul: 'No stone needed. The word is already adjourned.', et: 'One runestone. The word is: adjourned.', faa: 'A couple of stones. The network has six. That will do.', mange: 'Requires several stones. The number will be dealt with after the cow.' },
      ugyldig: 'Enter a number. The thing does not accept fog as a value.',
      alt: 'Painting: a table by the river with an hourglass, a balance scale holding a sock and a stone, a coil of rope, a wooden ruler and a book.',
    },

    soeg: {
      titel: 'Search the fog', under: 'Search the headings and texts of the case files. The results are real. The comment is the thing\'s.',
      label: 'Search term', placeholder: 'e.g. cow, stool, decision …', knap: 'Search', ryd: 'Clear',
      ingen: 'Nothing found in the fog. Try another word, or follow the river.', antal: '{n} places on the page',
      saer: { 'decision': 'No final answers. Here are the relevant case files.', 'cow': 'One witness. It keeps moving.', 'stool': 'You do not have permission to sit on the result.', 'any other business': 'The whole thing feels called upon.', 'aob': 'The whole thing feels called upon.' },
      alm: 'Found in the fog. The thing has not read it.',
      gaa: 'Go to',
    },

    pind: {
      titel: 'Send a stick', under: 'The runes above can also be carved into a stick and sent downstream. The message is shown here as rune play on top of the stick.',
      send: 'Send downstream', sendt: 'The stick has been sent downstream. It will arrive in between three days and four hundred years.',
      hoevl: 'Plane the message away', hoevlet: 'The message is deleted. The stick is now narrower.', tom: 'The stick is empty. Write something in the field above.',
      pindAlt: 'Illustration: a rune stick of pale wood with a string at one end.', knivAlt: 'Illustration: a small whittling knife with a wooden handle.',
      modern: 'Modern text',
      fakta1: 'Runes were not only carved in stone. In the Middle Ages people also wrote letters and messages on small wooden sticks – the Museum of Cultural History in Oslo shows, among other things, an order for spearheads. That is medieval material, not evidence of exactly the same practice at a Danish thing in 980.',
      fakta2: 'The same collection holds a love letter from Lom stave church, where someone later tried to cut the names away with a knife. That too is medieval. The knife here only deletes your own game.',
      kilde: 'Museum of Cultural History, Oslo: Runic letters', url: 'https://www.historiskmuseum.no/english/exhibitions/exhibitions-archive/kiss-me-the-world-of-runes/runic-letters-and-class-exercises/',
    },
    graatand: {
      titel: 'Greytooth', under: 'The thing\'s edition of Bluetooth. The colour is the fog\'s doing. The connection is established when both parties agree. That has not happened yet.',
      par: 'Pair the devices', status1: 'The cow is not visible to other devices.', status2: 'The devices are awaiting consent from Halvdan.',
      runer: 'ᚼ + ᛒ', runerForkl: 'Harald\'s initials in the younger futhark: hagall (H) and bjarkan (B).',
      fakta: 'The Bluetooth logo is a bind rune of ᚼ (hagall, H) and ᛒ (bjarkan, B) – the initials of Harald Bluetooth, who united Denmark and Norway as the standard unites devices. The button here does not touch your own Bluetooth and asks for no permissions.',
      kilde: 'bluetooth.com: Bluetooth origin', url: 'https://www.bluetooth.com/about-us/bluetooth-origin/',
    },
    fakta: 'What we actually know',
  },
};
;
/* ═══ indslag.js (assets/kilde/indslag.js) ═══ */
/* tingsvad.dk — runde 5: det levende tingsted.
   15 indslag (F01–F15) + faktaspor (H01–H03). Tekster i indslag-tekst.js, stil i site.css.
   Alt kører lokalt i browseren. Intet sendes, intet oprettes, intet afgøres. */
(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'da', da = lang === 'da';
  const T = window.TV5 && window.TV5[lang]; if (!T) return;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)'); const reduce = () => reduceMQ.matches;
  const smal = () => matchMedia('(max-width: 700px)').matches;
  const base = ($('link[rel="stylesheet"][href*="site.css"]').getAttribute('href').split('site.css')[0]);
  const NY = base + 'pak/nye/', PAK = base + 'pak/';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const portræt = window.tingsvadPortraet || (() => '');
  const img = (src, alt, w, h, cls, extra) => `<img src="${src}" alt="${esc(alt || '')}" width="${w}" height="${h}" loading="lazy" decoding="async"${cls ? ` class="${cls}"` : ''}${alt ? '' : ' aria-hidden="true"'}${extra || ''}>`;
  const nf = n => n.toLocaleString(da ? 'da-DK' : 'en-GB');

  /* ── Fælles dato (Europe/Copenhagen), sæson og dagligt seed ── */
  function cph(d) {
    const p = {}; new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Copenhagen', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d || new Date()).forEach(x => p[x.type] = x.value);
    const y = +p.year, m = +p.month, dd = +p.day; return { y, m, d: dd, iso: `${p.year}-${p.month}-${p.day}`, nr: y * 372 + m * 31 + dd };
  }
  const idag = cph();
  const seed = n => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const sæsonAf = m => m === 12 || m <= 2 ? 'vinter' : m <= 5 ? 'foraar' : m <= 8 ? 'sommer' : 'efteraar';
  const erMorten = (m, d) => m === 11 && d >= 9 && d <= 11;

  /* ── Lokal hukommelse: ét versionsstyret objekt, tilbagefald til hukommelsen ── */
  const KEY = 'tingsvad.experience.v1';
  const defaults = () => ({ schemaVersion: 1, fragments: [], foundObjects: [], queueTicket: null, shieldBackSeen: false, museumVisited: false, lastSeenLocalDate: null, seasonOverride: null });
  function load() {
    try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); if (o && o.schemaVersion === 1 && Array.isArray(o.fragments) && Array.isArray(o.foundObjects)) return Object.assign(defaults(), o); } } catch (e) { }
    return defaults();
  }
  let S = load();
  const sidsteBesøg = S.lastSeenLocalDate;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  const lyt = [];
  function emit() { lyt.forEach(f => { try { f(); } catch (e) { } }); }
  function addFragment(id) { if (S.fragments.includes(id)) return false; S.fragments.push(id); save(); emit(); return true; }
  function addFound(id) { if (S.foundObjects.includes(id)) return false; S.foundObjects.push(id); save(); emit(); return true; }
  S.lastSeenLocalDate = idag.iso; save();

  /* ── Status: Side 2 – n af 3 ── */
  function statusHtml() { const n = S.fragments.length; return `${T.status.side2} – <b>${n} ${T.status.af} 3</b> ${T.status.fragmenter}`; }
  function opdaterStatus() { $$('.r5-status, #r5-hero-status').forEach(el => { el.innerHTML = statusHtml(); el.classList.toggle('faerdig', S.fragments.length === 3); }); }
  lyt.push(opdaterStatus);

  /* ── Opryddere ved nulstilling ── */
  let cleanup = [];
  const onCleanup = f => cleanup.push(f);

  /* ── Hjælpere til paneler ── */
  function panel(id, titel, under, indhold, open) { return `<details class="r5-fold" id="r5-${id}"${open ? ' open' : ''}><summary><span class="r5-fold-titel">${esc(titel)}</span><span class="r5-fold-under">${esc(under)}</span></summary><div class="r5-fold-ind">${indhold}</div></details>`; }
  const vidfakta = (tekst, kilde, url) => `<aside class="vidfakta"><img class="sten-ik" src="${PAK}grafik/loes-sten.webp" alt="" width="512" height="512" loading="lazy"><b>${esc(T.fakta)}</b><p>${esc(tekst)}</p><cite><a href="${esc(url)}" rel="noopener">${esc(kilde)}</a></cite></aside>`;
  const samlKnap = (id, cls) => `<button type="button" class="knap r5-saml${cls ? ' ' + cls : ''}" data-fragment="${id}"${S.fragments.includes(id) ? ' disabled' : ''}>${S.fragments.includes(id) ? esc(T.akt.samlet) : esc(T.akt.saml)}</button>`;
  function bindSaml(root) { $$('.r5-saml', root).forEach(b => b.addEventListener('click', () => { if (addFragment(b.dataset.fragment)) { b.disabled = true; b.textContent = T.akt.samlet; } })); }
  lyt.push(() => $$('.r5-saml').forEach(b => { if (S.fragments.includes(b.dataset.fragment)) { b.disabled = true; b.textContent = T.akt.samlet; } }));

  /* ═══════════════ GRUPPE 1: UNDERSØG SAGEN ═══════════════ */

  /* F02 – Aktindsigt */
  function mountAkt(el) {
    const A = T.akt;
    const linjer = A.linjer.map((l, i) => i < 4 ? `<p>${esc(l)}</p>` : '').join('');
    const strege = A.skjult.map((s, i) => `<span class="akt-linje"><button type="button" class="akt-streg" aria-expanded="false" aria-controls="akt-s${i}" aria-label="${esc(s[1])}"></button><span class="akt-afsl" id="akt-s${i}" hidden>${esc(s[0])}</span></span>`).join('');
    el.innerHTML = `<div class="akt"><div class="akt-dok">${img(NY + 'arkivdokument.webp', '', 800, 1200).replace('loading="lazy"', 'loading="eager"')}<div class="akt-tekst"><div class="akt-hoved">${esc(A.hoved)}</div>${linjer}<p>${esc(A.linjer[4])}${strege}</p><div class="akt-saml" id="akt-saml" hidden>${samlKnap('archive')}<span class="note">${esc(A.fund)}</span></div></div></div><p class="note">${esc(A.fod)}</p></div>`;
    $$('.akt-streg', el).forEach((b, i) => b.addEventListener('click', () => {
      const åben = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', String(!åben)); const t = $('#' + b.getAttribute('aria-controls'), el); t.hidden = åben; b.classList.toggle('aaben', !åben);
      if (i === 3 && !åben) { $('#akt-saml', el).hidden = false; }
    }));
    bindSaml(el);
  }

  /* F12 – Vend skjoldet */
  function mountSkjold(el) {
    const K = T.skjold;
    el.innerHTML = `<div class="skjold"><div class="skjold-ramme" data-side="for">${img(PAK + 'web/skjold.webp', K.forside, 1200, 675, 'skjold-for')}${img(NY + 'skjold-bagside.webp', K.alt, 768, 768, 'skjold-bag')}<button type="button" class="skjold-rem" hidden aria-label="${esc(K.rem)}" title="${esc(K.remHint)}"></button></div>
      <div class="skjold-ui"><button type="button" class="knap" id="skjold-vend" aria-pressed="false">${esc(K.vend)}</button><button type="button" class="knap sek" id="skjold-rem2" hidden>${esc(K.rem)}</button><span class="note" id="skjold-side">${esc(K.forside)}</span></div>
      <div class="skjold-seddel" id="skjold-seddel" hidden><p class="skjold-seddel-t">${esc(K.seddel)}</p>${samlKnap('shield')}<p class="note">${esc(K.asgeir)}</p></div></div>`;
    const ramme = $('.skjold-ramme', el), vend = $('#skjold-vend', el), rem = $('.skjold-rem', el), rem2 = $('#skjold-rem2', el), side = $('#skjold-side', el), seddel = $('#skjold-seddel', el);
    vend.addEventListener('click', () => {
      const bag = ramme.dataset.side !== 'bag'; ramme.dataset.side = bag ? 'bag' : 'for'; ramme.classList.toggle('uden-anim', reduce());
      vend.textContent = bag ? K.vendTilbage : K.vend; vend.setAttribute('aria-pressed', String(bag)); side.textContent = bag ? K.bagside : K.forside; rem.hidden = !bag; rem2.hidden = !bag;
      if (bag && !S.shieldBackSeen) { S.shieldBackSeen = true; save(); }
      if (!bag) seddel.hidden = true;
    });
    const åbn = () => { seddel.hidden = false; seddel.querySelector('.r5-saml, p').focus?.(); };
    rem.addEventListener('click', åbn); rem2.addEventListener('click', åbn); bindSaml(el);
  }

  /* F04 – Arkæologisk udgravning */
  function mountGrav(el) {
    const G = T.grav;
    const fund = [['kam', 'kam.webp', .22, .22, .30, .30], ['moent', 'moent.webp', .62, .14, .26, .26], ['runepind', 'runepind.webp', .20, .60, .62, .41]]; // id, fil, x, y, w, h (normaliseret)
    el.innerHTML = `<div class="grav"><div class="grav-felt" id="grav-felt">${img(NY + 'udgravning.webp', G.alt, 768, 768, 'grav-jord')}
      ${fund.map(f => `<img class="grav-fund" data-id="${f[0]}" src="${NY + f[1]}" alt="${esc(G.fund[f[0]][0])}" width="768" height="${f[0] === 'runepind' ? 512 : 768}" loading="lazy" style="left:${f[2] * 100}%;top:${f[3] * 100}%;width:${f[4] * 100}%;height:${f[5] * 100}%">`).join('')}
      <canvas class="grav-daek" id="grav-daek" width="768" height="768" aria-hidden="true"></canvas></div>
      <div class="grav-ui"><p class="note">${esc(G.hint)}</p><div class="grav-knapper">${fund.map((f, i) => `<button type="button" class="knap sek" data-felt="${f[0]}">${esc(G.felt)} ${G.felter[i]}</button>`).join('')}<button type="button" class="knap sek" id="grav-igen">${esc(G.nulstil)}</button></div>
      <ul class="grav-liste" id="grav-liste" aria-live="polite"></ul><div class="grav-saml" id="grav-saml" hidden><p>${esc(G.alle)}</p>${samlKnap('excavation')}</div></div></div>`;
    const felt = $('#grav-felt', el), cv = $('#grav-daek', el), ctx = cv.getContext('2d'), liste = $('#grav-liste', el), saml = $('#grav-saml', el);
    const jord = new Image(); jord.src = NY + 'udgravning.webp';
    const tegnDæk = () => { ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, 768, 768); if (jord.complete && jord.naturalWidth) ctx.drawImage(jord, 0, 0, 768, 768); else { ctx.fillStyle = '#3b2e22'; ctx.fillRect(0, 0, 768, 768); } ctx.fillStyle = 'rgba(40,30,20,.35)'; ctx.fillRect(0, 0, 768, 768); };
    jord.onload = () => { if (!S.foundObjects.length) tegnDæk(); else { tegnDæk(); fund.forEach(f => { if (S.foundObjects.includes(f[0])) afdæk(f, true); }); } };
    tegnDæk();
    // prøvepunkter pr. fund: 5 punkter, afdækket når 4 er børstet
    const prøver = {}; fund.forEach(f => { const cx = f[2] + f[4] / 2, cy = f[3] + f[5] / 2; prøver[f[0]] = [[cx, cy], [cx - f[4] * .3, cy], [cx + f[4] * .3, cy], [cx, cy - f[5] * .3], [cx, cy + f[5] * .3]].map(p => ({ x: p[0], y: p[1], ok: false })); });
    const R = 0.075; let kø = [], raf = 0;
    function flush() { raf = 0; ctx.globalCompositeOperation = 'destination-out'; kø.forEach(p => { ctx.beginPath(); ctx.arc(p.x * 768, p.y * 768, R * 768, 0, 7); ctx.fill(); }); kø = []; ctx.globalCompositeOperation = 'source-over'; tjek(); }
    function børst(x, y) { kø.push({ x, y }); for (const id in prøver) prøver[id].forEach(p => { if (!p.ok && Math.hypot(p.x - x, p.y - y) < R * 1.1) p.ok = true; }); if (!raf) raf = requestAnimationFrame(flush); }
    function afdæk(f, stille) { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.ellipse((f[2] + f[4] / 2) * 768, (f[3] + f[5] / 2) * 768, f[4] * 768 * .62, f[5] * 768 * .62, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; prøver[f[0]].forEach(p => p.ok = true); if (!stille) addFound(f[0]); visListe(); }
    function tjek() { fund.forEach(f => { if (!S.foundObjects.includes(f[0]) && prøver[f[0]].filter(p => p.ok).length >= 4) afdæk(f); }); }
    function visListe() {
      liste.innerHTML = S.foundObjects.length ? fund.filter(f => S.foundObjects.includes(f[0])).map(f => `<li><b>${esc(G.fund[f[0]][0])}</b><span>${esc(G.fund[f[0]][1])}</span></li>`).join('') : `<li class="sager-tom">${esc(G.ingen)}</li>`;
      saml.hidden = !fund.every(f => S.foundObjects.includes(f[0]));
      $$('.grav-fund', el).forEach(i => i.classList.toggle('fundet', S.foundObjects.includes(i.dataset.id)));
    }
    visListe();
    let aktiv = false;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', e => { aktiv = true; cv.setPointerCapture?.(e.pointerId); const [x, y] = pos(e); børst(x, y); });
    cv.addEventListener('pointermove', e => { if (!aktiv) return; const [x, y] = pos(e); if (x >= 0 && x <= 1 && y >= 0 && y <= 1) børst(x, y); });
    const slip = () => { aktiv = false; }; cv.addEventListener('pointerup', slip); cv.addEventListener('pointercancel', slip); cv.addEventListener('pointerleave', slip);
    $$('[data-felt]', el).forEach(b => b.addEventListener('click', () => { const f = fund.find(x => x[0] === b.dataset.felt); afdæk(f); b.setAttribute('aria-pressed', 'true'); }));
    $('#grav-igen', el).addEventListener('click', () => { tegnDæk(); for (const id in prøver) prøver[id].forEach(p => p.ok = false); fund.forEach(f => { if (S.foundObjects.includes(f[0])) afdæk(f, true); }); });
    bindSaml(el);
  }

  /* F03 – Den forsvundne side 2 */
  function mountSide2(el) {
    const P = T.side2;
    const brikker = [['archive', '0 0,33% 0,33% 5%,40% 25%,47% 36%,52% 44%,30% 50%,20% 52%,0 52%', '12% 70% 58% 6%'], ['shield', '33% 0,100% 0,100% 52%,80% 50%,68% 48%,52% 44%,47% 36%,40% 25%,33% 5%', '10% 6% 60% 52%'], ['excavation', '0 52%,20% 52%,30% 50%,52% 44%,68% 48%,80% 50%,100% 52%,100% 100%,0 100%', '60% 12% 22% 12%']];
    const alle = S.fragments.length === 3;
    el.innerHTML = `<div class="side2"><div class="side2-ark" role="img" aria-label="${esc(P.alt)}">${brikker.map((b, i) => `<div class="side2-brik${S.fragments.includes(b[0]) ? ' fundet' : ''}" data-id="${b[0]}" style="clip-path:polygon(${b[1]})"><img src="${NY}side-to.webp" alt="" width="800" height="1200" loading="lazy" aria-hidden="true"><span class="side2-tekst" style="inset:${b[2]}">${esc(S.fragments.includes(b[0]) ? P.tekst[b[0]] : P.tom)}</span></div>`).join('')}</div>
      <div class="side2-ui"><ol class="side2-liste">${brikker.map((b, i) => { const f = S.fragments.includes(b[0]); return `<li class="${f ? 'ok' : ''}"><span class="ik">${f ? '✓' : '○'}</span><b>${esc(P.brik[i])} · ${esc(P.findesteder[b[0]][0])}</b><span>${f ? esc(P.fundet) : esc(P.mangler) + ' – ' + esc(P.findesteder[b[0]][1])}</span></li>`; }).join('')}</ol>
      <div class="side2-resultat" aria-live="polite">${alle ? `<p class="side2-afsl">${esc(P.afsloer)}</p><p class="side2-brian">${portræt('Mímir', true)}${esc(P.brian)}</p><div class="side2-segl">${img(PAK + 'grafik/segl.webp', P.segl, 512, 512)}<span class="note">${esc(P.segl)}</span></div>` : `<p class="note">${esc(P.venter)}</p>`}</div></div></div>`;
  }

  /* ═══════════════ GRUPPE 2: LIVET VED VADESTEDET ═══════════════ */

  /* F11 – Opslagstavlen */
  function mountTavle(el) {
    const O = T.tavle; const boxes = [[23, 19, 14, 27], [24, 48, 10, 19], [40, 18, 22, 52], [66, 19, 14, 26], [65, 49, 15, 19], [81, 44, 7, 25]];
    const n = O.opslag.length, dagens = []; let s = idag.nr; while (dagens.length < 6) { const i = Math.floor(seed(s++) * n); if (!dagens.includes(i)) dagens.push(i); }
    const rest = O.opslag.map((_, i) => i).filter(i => !dagens.includes(i));
    // længste tekster på de største sedler
    const efterStr = [...dagens].sort((a, b) => O.opslag[b].length - O.opslag[a].length), efterAreal = boxes.map((b, k) => k).sort((a, b) => boxes[b][2] * boxes[b][3] - boxes[a][2] * boxes[a][3]);
    el.innerHTML = `<div class="tavle"><div class="tavle-wrap" aria-hidden="true">${img(NY + 'opslagstavle.webp', '', 1440, 960)}${efterStr.map((i, n) => { const bx = boxes[efterAreal[n]]; return `<div class="tavle-seddel" style="left:${bx[0]}%;top:${bx[1]}%;width:${bx[2]}%;height:${bx[3]}%">${esc(O.opslag[i])}</div>`; }).join('')}</div>
      <ul class="tavle-liste" id="tavle-liste">${dagens.map(i => `<li>${esc(O.opslag[i])}</li>`).join('')}</ul>
      <button type="button" class="knap sek" id="tavle-flere" aria-expanded="false">${esc(O.flere)}</button><ul class="tavle-liste tavle-ekstra" id="tavle-ekstra" hidden>${rest.map(i => `<li>${esc(O.opslag[i])}</li>`).join('')}</ul></div>`;
    const k = $('#tavle-flere', el), ex = $('#tavle-ekstra', el);
    k.addEventListener('click', () => { const åben = !ex.hidden; ex.hidden = åben; k.setAttribute('aria-expanded', String(!åben)); k.textContent = åben ? O.flere : O.faerre; });
  }

  /* F08 – Køsedlen */
  function mountKø(el) {
    const K = T.koe;
    const vis = (besked) => {
      const t = S.queueTicket;
      $('#koe-slate', el).innerHTML = t ? `<small>${esc(K.betjener)}</small><b>${esc(K.foerste)}</b>` : `<small>${esc(K.betjener)}</small><b>${esc(K.foerste)}</b>`;
      $('#koe-strip', el).textContent = t ? t.nr : '';
      $('#koe-tekst', el).innerHTML = t ? `<p><b>${esc(K.dit)}:</b> <code>${esc(t.nr)}</code> · ${esc(K.betjener)} <code>${esc(K.foerste)}</code></p><p>${esc(K.vent[t.v])}</p>${besked ? `<p class="koe-brian">${portræt('Mímir', true)}${esc(besked)}</p>` : ''}` : `<p class="note">${esc(K.ingen)}</p>`;
    };
    el.innerHTML = `<div class="koe"><div class="koe-wrap">${img(NY + 'koeautomat.webp', K.alt, 1200, 675)}<div class="koe-slate" id="koe-slate" aria-hidden="true"></div><div class="koe-strip" id="koe-strip" aria-hidden="true"></div></div>
      <div class="koe-ui"><button type="button" class="knap" id="koe-traek">${esc(K.traek)}</button><div class="koe-tekst" id="koe-tekst" aria-live="polite"></div><p class="note">${esc(K.note)}</p></div></div>`;
    vis(S.queueTicket && sidsteBesøg && sidsteBesøg !== idag.iso ? K.tilbage : '');
    $('#koe-traek', el).addEventListener('click', () => {
      if (S.queueTicket) { vis(K.igen); return; }
      const nr = 2 + Math.floor(Math.random() * 9000); S.queueTicket = { nr: `K-0980-${String(nr).padStart(4, '0')}`, v: Math.floor(Math.random() * K.vent.length), d: idag.iso }; save(); vis('');
    });
  }

  /* F09 – Tågekamera */
  function mountKamera(el) {
    const C = T.kamera; let timer = 0, kører = false, synlig = true, gåsTimer = 0;
    el.innerHTML = `<div class="kamera"><div class="kamera-ramme" id="kamera-ramme">${img(NY + 'taagekamera.webp', C.alt, 1200, 675, 'kamera-bg')}<div class="kamera-taage" aria-hidden="true"></div><img class="kamera-gaas" id="kamera-gaas" src="${NY}gudrun-fritlagt.webp" alt="" width="768" height="768" aria-hidden="true" loading="lazy"><span class="kamera-maerke">${esc(C.maerke)}</span><span class="kamera-rec" id="kamera-rec" hidden>● ${esc(C.koerer)}</span></div>
      <div class="kamera-ui"><button type="button" class="knap" id="kamera-start" aria-pressed="false">${esc(C.start)}</button><button type="button" class="knap sek" id="kamera-nu">${esc(C.nu)}</button><p class="kamera-obs" id="kamera-obs" aria-live="polite">${esc(reduce() ? C.reduce : C.stille)}</p></div>
      <div class="kamera-arkiv"><b class="kicker" style="margin:0">${esc(C.arkiv)}</b><ul>${C.arkivT.map(a => `<li><time>${esc(a[0])}</time>${esc(a[1])}</li>`).join('')}</ul></div></div>`;
    const ramme = $('#kamera-ramme', el), gås = $('#kamera-gaas', el), start = $('#kamera-start', el), obs = $('#kamera-obs', el), rec = $('#kamera-rec', el);
    function observation() { obs.textContent = C.obs; if (reduce()) { gås.classList.add('stille'); clearTimeout(gåsTimer); gåsTimer = setTimeout(() => gås.classList.remove('stille'), 6000); return; } gås.classList.remove('glider'); void gås.offsetWidth; gås.classList.add('glider'); }
    gås.addEventListener('animationend', () => gås.classList.remove('glider'));
    function plan() { clearTimeout(timer); if (!kører || !synlig || document.hidden) return; timer = setTimeout(() => { observation(); plan(); }, 8000 + Math.random() * 7000); }
    function sæt(on) { kører = on; ramme.classList.toggle('koerer', on && !reduce()); rec.hidden = !on; start.textContent = on ? C.pause : C.start; start.setAttribute('aria-pressed', String(on)); if (on) plan(); else { clearTimeout(timer); gås.classList.remove('glider'); } }
    start.addEventListener('click', () => sæt(!kører));
    $('#kamera-nu', el).addEventListener('click', observation);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => { synlig = es[0].isIntersecting; if (synlig) plan(); else clearTimeout(timer); }) : null; io?.observe(ramme);
    const vh = () => { if (document.hidden) clearTimeout(timer); else plan(); }; document.addEventListener('visibilitychange', vh);
    onCleanup(() => { clearTimeout(timer); clearTimeout(gåsTimer); io?.disconnect(); document.removeEventListener('visibilitychange', vh); });
  }

  /* F14 – Museet for det, der næsten skete */
  function mountMuseum(el) {
    const M = T.museum; let klik = 0;
    el.innerHTML = `<div class="museum"><div class="museum-wrap">${img(NY + 'museum.webp', M.alt, 1200, 675)}${M.montrer.map((m, i) => `<span class="museum-plade" aria-hidden="true" style="left:${[20, 50, 80][i]}%;top:57%">${esc(m)}</span>`).join('')}<img class="museum-klaede" id="museum-klaede" src="${NY}museumsklaede.webp" alt="" width="800" height="1200" aria-hidden="true" loading="lazy"></div>
      <ul class="museum-liste">${M.montrer.map((m, i) => `<li><b>${esc(m)}</b><span>${esc(M.beskr[i])}</span></li>`).join('')}</ul>
      <div class="museum-ui"><button type="button" class="knap" id="museum-loeft" aria-pressed="false">${esc(M.loeft)}</button><p class="museum-svar" id="museum-svar" aria-live="polite"></p></div>
      <div class="museum-hjelm"><div class="museum-hjelm-ind">${img(NY + 'hjelm.webp', M.hjelm.alt, 768, 768)}<div><b class="kicker" style="margin:0 0 .4rem">${esc(M.hjelm.titel)}</b><p>${esc(M.hjelm.tekst)}</p><p class="note">${esc(M.hjelm.ting)}</p></div></div>${vidfakta(M.hjelm.fakta, M.hjelm.kilde, M.hjelm.url)}</div></div>`;
    const kl = $('#museum-klaede', el), b = $('#museum-loeft', el), svar = $('#museum-svar', el);
    b.addEventListener('click', () => { const løftet = kl.classList.toggle('loeftet'); b.setAttribute('aria-pressed', String(løftet)); if (løftet) { klik++; svar.textContent = klik === 1 ? M.loeftet : M.igen; b.textContent = M.laeg; if (!S.museumVisited) { S.museumVisited = true; save(); } } else { b.textContent = M.loeft; svar.textContent = M.tom; } });
  }

  /* F15 – Årstider */
  let sæsonLag = null;
  function aktuelSæson() { return S.seasonOverride || sæsonAf(idag.m); }
  function anvendSæson() {
    const s = aktuelSæson(); document.body.classList.remove('aarstid-vinter', 'aarstid-foraar', 'aarstid-sommer', 'aarstid-efteraar'); document.body.classList.add('aarstid-' + s);
    if (sæsonLag) { sæsonLag.remove(); sæsonLag = null; }
    if (!reduce() && (s === 'efteraar' || s === 'vinter')) {
      sæsonLag = document.createElement('div'); sæsonLag.className = 'aarstid-lag aarstid-lag-' + s; sæsonLag.setAttribute('aria-hidden', 'true');
      if (s === 'efteraar') { const blade = [[3, 2, 40, 42], [59, 2, 33, 35], [35, 30, 30, 40], [72, 36, 27, 24], [5, 52, 30, 44]]; sæsonLag.innerHTML = Array.from({ length: 10 }, (_, i) => { const b = blade[(i * 3) % 5], t = 14 + ((i * 7) % 11); return `<i class="${i % 2 ? 'blad-h' : 'blad-v'}" style="--bx:${b[0]};--by:${b[1]};--bw:${b[2]};--bh:${b[3]};--bl:${(4 + i * 37) % 92}%;--bd:${-((i * 5) % t)}s;--bt:${t}s;--bs:${(.7 + ((i * 3) % 6) / 10).toFixed(1)};background-image:url('${NY}efteraarsblade-512.webp')"></i>`; }).join(''); } // runde 12: ti blade i toppen, i gang fra start
      ($('.r12-hero') || $('.r12s-hero') || (s === 'efteraar' && ($('.hero-lag') || $('.side-hoved'))) || document.body).appendChild(sæsonLag); // blade og frost kun i toppen (runde 12: i maleriet), aldrig hen over tekst og formularer
    }
    let linje = $('#aarstid-linje'); const bar = $('.hero-bar'); if (!bar) return;
    if (!linje) { linje = document.createElement('div'); linje.id = 'aarstid-linje'; linje.className = 'aarstid-linje'; bar.appendChild(linje); }
    linje.innerHTML = `<b>${esc(T.saeson.nu)}</b>${esc(T.saeson.navne[s])}: ${esc(T.saeson.besked[s])}${erMorten(idag.m, idag.d) ? ` · ${esc(T.saeson.morten)}` : ''}`;
  }
  function mountSæson(el) {
    const Z = T.saeson;
    el.innerHTML = `<div class="saeson"><label class="saeson-vaelg">${esc(Z.vaelg)} <select id="saeson-select"><option value="">${esc(Z.auto)} (${esc(Z.navne[sæsonAf(idag.m)])})</option>${['vinter', 'foraar', 'sommer', 'efteraar'].map(k => `<option value="${k}"${S.seasonOverride === k ? ' selected' : ''}>${esc(Z.navne[k])}</option>`).join('')}</select></label><p class="saeson-besked" id="saeson-besked" aria-live="polite"></p></div>`;
    const sel = $('#saeson-select', el), bes = $('#saeson-besked', el);
    const vis = () => { const s = aktuelSæson(); bes.textContent = `${Z.navne[s]}: ${Z.besked[s]}`; };
    sel.addEventListener('change', () => { S.seasonOverride = sel.value || null; save(); anvendSæson(); vis(); }); vis();
  }
  reduceMQ.addEventListener?.('change', anvendSæson);

  /* ═══════════════ GRUPPE 3: TINGETS KONTORER ═══════════════ */

  /* F05 – Tokes stolekonfigurator */
  function mountStol(el) {
    const ST = T.stol;
    el.innerHTML = `<div class="stol"><figure class="stol-fig">${img(NY + 'stol-tegning.webp', ST.alt, 1440, 960)}</figure><form class="stol-form" id="stol-form"><fieldset><legend class="kicker" style="margin-bottom:.6rem">${esc(ST.oversigt)}</legend>${ST.valg.map(v => `<label class="stol-valg"><input type="checkbox" name="${v[0]}" value="${v[0]}"><span>${esc(v[1])}</span><em>${esc(v[2])}</em></label>`).join('')}</fieldset>
      <div class="stol-oversigt" id="stol-oversigt" aria-live="polite"><p class="note">${esc(ST.ingen)}</p></div><button type="submit" class="knap" id="stol-send">${esc(ST.send)}</button><p class="note">${esc(ST.note)}</p></form>
      <div class="stol-resultat" id="stol-resultat" hidden></div></div>`;
    const form = $('#stol-form', el), ov = $('#stol-oversigt', el), res = $('#stol-resultat', el);
    const opd = () => { const v = $$('input:checked', form).map(i => ST.valg.find(x => x[0] === i.value)); ov.innerHTML = v.length ? `<ul>${v.map(x => `<li><b>${esc(x[1])}</b><span>${esc(x[2])}</span></li>`).join('')}</ul>` : `<p class="note">${esc(ST.ingen)}</p>`; };
    form.addEventListener('change', opd);
    form.addEventListener('submit', e => { e.preventDefault(); res.hidden = false; res.innerHTML = `${img(PAK + 'web/stol.webp', '', 1200, 675)}<div><p class="stol-udfald">${esc(ST.resultat)} <b>${esc(ST.forbehold)}</b></p><ol>${ST.fem.map(f => `<li>${esc(f)}</li>`).join('')}</ol><p class="note">${esc(ST.resten)}</p></div>`; $('#stol-send', el).textContent = ST.sendt; document.dispatchEvent(new CustomEvent('tingsvad:stol-ansoegt', { detail: { valg: $$('input:checked', form).map(i => i.value) } })); res.scrollIntoView?.({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' }); });
  }

  /* F06 – Ekspertpanelet */
  function mountPanel(el) {
    const E = T.panel;
    el.innerHTML = `<div class="panel"><div class="panel-wrap">${img(NY + 'ekspertbord.webp', E.alt, 1200, 675)}${E.eksperter.map(x => `<i class="panel-mark" data-id="${x[0]}" style="left:${x[3]}%;top:${x[4]}%" aria-hidden="true"></i>`).join('')}<div class="panel-laage" id="panel-laage" aria-hidden="true"><span></span></div></div>
      <div class="panel-knapper" role="group" aria-label="${esc(E.titel)}">${E.eksperter.map(x => `<button type="button" data-id="${x[0]}" aria-pressed="false">${esc(x[1])}</button>`).join('')}</div>
      <blockquote class="forkl-svar panel-svar" id="panel-svar" aria-live="polite"><span class="forkl-hvem" id="panel-hvem"></span><span id="panel-tekst">${esc(E.vaelg)}</span></blockquote><p class="note">${esc(E.note)}</p></div>`;
    $$('.panel-knapper button', el).forEach(b => b.addEventListener('click', () => {
      const x = E.eksperter.find(e => e[0] === b.dataset.id); $$('.panel-knapper button', el).forEach(k => k.setAttribute('aria-pressed', String(k === b))); $$('.panel-mark', el).forEach(m => m.classList.toggle('aktiv', m.dataset.id === x[0]));
      $('#panel-hvem', el).textContent = x[1] + ':'; const laage = $('#panel-laage', el); const åben = x[0] === 'landmand'; laage.classList.toggle('aaben', åben); $('#panel-tekst', el).textContent = x[2] + (åben ? ' ' + E.laage : '');
    }));
  }

  /* F07 – Beredskabsplan */
  function mountBeredskab(el) {
    const B = T.beredskab; let sidst = null;
    const knap = (r, i, cls) => `<button type="button" class="${cls}" data-i="${i}" aria-expanded="false" aria-controls="bered-instruks"${cls === 'bered-knap' ? ` style="left:${r[2]}%;top:${r[3]}%"` : ''}><small>${esc(B.rumNr)} ${i + 1}</small>${esc(r[0])}</button>`;
    el.innerHTML = `<div class="bered"><div class="bered-wrap">${img(NY + 'beredskabsskab.webp', B.alt, 1440, 960)}<div class="bered-overlag">${B.rum.map((r, i) => knap(r, i, 'bered-knap')).join('')}</div></div>
      <div class="bered-liste">${B.rum.map((r, i) => knap(r, i, 'bered-li')).join('')}</div>
      <div class="bered-instruks" id="bered-instruks" hidden tabindex="-1" role="region" aria-live="polite"><b class="kicker" id="bered-titel" style="margin:0"></b><p id="bered-tekst"></p><button type="button" class="knap sek" id="bered-luk">${esc(B.luk)}</button></div></div>`;
    const ins = $('#bered-instruks', el);
    const luk = () => { ins.hidden = true; $$('[aria-controls="bered-instruks"]', el).forEach(b => b.setAttribute('aria-expanded', 'false')); sidst?.focus(); };
    $$('[data-i]', el).forEach(b => b.addEventListener('click', () => { const r = B.rum[+b.dataset.i]; sidst = b; $$('[aria-controls="bered-instruks"]', el).forEach(k => k.setAttribute('aria-expanded', String(k.dataset.i === b.dataset.i))); $('#bered-titel', el).textContent = `${B.instruks} · ${B.rumNr} ${+b.dataset.i + 1}: ${r[0]}`; $('#bered-tekst', el).textContent = r[1]; ins.hidden = false; ins.focus({ preventScroll: true }); }));
    $('#bered-luk', el).addEventListener('click', luk);
    ins.addEventListener('keydown', e => { if (e.key === 'Escape') luk(); });
  }

  /* F13 – Kontoret for upræcise målinger */
  function mountMål(el) {
    const M = T.maal;
    el.innerHTML = `<div class="maal"><figure class="maal-fig">${img(NY + 'maalekontor.webp', M.alt, 1200, 675)}</figure><ul class="maal-regler">${M.regler.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <div class="maal-grid">${M.omr.map(o => `<form class="maal-form" data-type="${o[0]}"><b class="kicker" style="margin:0">${esc(o[1])}</b><div class="maal-rk"><label>${esc(M.vaerdi)} <input type="number" step="any" inputmode="decimal" name="v" required></label><label>${esc(M.enhed)} <select name="e">${o[3].map(u => `<option value="${u[0]}">${esc(u[1])}</option>`).join('')}</select></label><button type="submit" class="knap sek">${esc(M.beregn)}</button></div><p class="maal-svar" aria-live="polite"></p></form>`).join('')}</div><p class="note">${esc(M.under)}</p></div>`;
    $$('.maal-form', el).forEach(f => f.addEventListener('submit', e => {
      e.preventDefault(); const v = parseFloat(f.v.value.replace(',', '.')), en = f.e.value, ud = $('.maal-svar', f); if (!isFinite(v)) { ud.textContent = M.ugyldig; return; }
      let s;
      if (f.dataset.type === 'tid') { const år = en === 'aar' ? v : en === 'mdr' ? v / 12 : v / 365.25; const m = år / tvAar(); s = v < 0 ? M.svarTid.neg : v === 0 ? M.svarTid.nul : m < .5 ? M.svarTid.lille : m < 1.5 ? M.svarTid.et : M.svarTid.flere.replace('{n}', nf(Math.round(m))); }
      else if (f.dataset.type === 'afstand') { const m = en === 'm' ? v : en === 'km' ? v * 1000 : v * .75; s = v < 0 ? M.svarAfstand.neg : v === 0 ? M.svarAfstand.nul : m < 10 ? M.svarAfstand.lille : m < 10000 ? M.svarAfstand.mellem : M.svarAfstand.stor; }
      else { const ord = en === 'ord' ? v : en === 'kb' ? v * 170 : v * 170e6; s = v < 0 ? M.svarData.neg : v === 0 ? M.svarData.nul : ord <= 1 ? M.svarData.et : ord <= 6 ? M.svarData.faa : M.svarData.mange; }
      ud.textContent = s;
    }));
  }

  /* F10 – Søg i tågen */
  function mountSøg(el) {
    const Q = T.soeg;
    const norm = s => s.toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
    const slug = s => norm(s).replace(/[^a-z0-9æøå]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    let indeks = null;
    function byg() {
      indeks = [];
      $$('main section, main .band').forEach((sec, i) => {
        const h = $('h2, h3, .band-titel', sec); if (!h) return;
        if (!sec.id) sec.id = 's-' + (slug(h.textContent) || i);
        const kicker = $('.kicker', sec)?.textContent || '';
        const tekst = $$('p, li, dd, dt, summary, figcaption, td, q, .r5-fold-titel', sec).map(x => x.textContent).join(' ');
        indeks.push({ id: sec.id, titel: h.textContent.trim(), kicker: kicker.trim(), h: norm(h.textContent + ' ' + $$('h3, .r5-fold-titel', sec).map(x => x.textContent).join(' ')), t: norm(tekst) });
        $$('.r5-fold', sec).forEach(f => { const ft = $('.r5-fold-titel', f); if (!ft) return; indeks.push({ id: f.id, titel: ft.textContent.trim(), kicker: h.textContent.trim(), h: norm(ft.textContent), t: norm(f.textContent) }); });
      });
    }
    el.innerHTML = `<form class="soeg" id="soeg-form" role="search"><label for="soeg-ind">${esc(Q.label)}</label><div class="soeg-rk"><input type="search" id="soeg-ind" maxlength="60" placeholder="${esc(Q.placeholder)}" autocomplete="off"><button type="submit" class="knap">${esc(Q.knap)}</button><button type="button" class="knap sek" id="soeg-ryd">${esc(Q.ryd)}</button></div><p class="soeg-kommentar" id="soeg-kommentar" aria-live="polite"></p><ol class="soeg-res" id="soeg-res"></ol></form>`;
    const ind = $('#soeg-ind', el), res = $('#soeg-res', el), kom = $('#soeg-kommentar', el);
    function søg() {
      const q = norm(ind.value); res.innerHTML = ''; if (!q) { kom.textContent = ''; return; } if (!indeks) byg();
      // Relevans: hele ord i titel vægter mest, hele ord i tekst dernæst, delord (»ko« i »kontorer«) mindst
      const ordRe = new RegExp('(^|[^a-z0-9æøå])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^a-z0-9æøå])', 'g');
      const score = x => { const hh = (x.h.match(ordRe) || []).length, th = (x.t.match(ordRe) || []).length; return hh * 40 + Math.min(th, 10) * 6 + (x.h.includes(q) ? 4 : 0) + (x.t.includes(q) ? 1 : 0); };
      const hits = indeks.filter(x => x.h.includes(q) || x.t.includes(q)).map(x => ({ x, s: score(x) })).sort((a, b) => b.s - a.s).map(o => o.x);
      const sær = Q.saer[q]; kom.textContent = hits.length ? `${sær || Q.alm} · ${Q.antal.replace('{n}', hits.length)}` : Q.ingen;
      res.innerHTML = hits.slice(0, 12).map(x => { const i = x.t.indexOf(q), ud = i < 0 ? '' : '…' + x.t.slice(Math.max(0, i - 40), i + 60).replace(/^\S*\s/, '') + '…'; return `<li><a href="#${esc(x.id)}">${esc(x.titel)}</a><small>${esc(x.kicker)}</small>${ud ? `<span>${esc(ud)}</span>` : ''}</li>`; }).join('');
    }
    $('#soeg-form', el).addEventListener('submit', e => { e.preventDefault(); søg(); });
    $('#soeg-ryd', el).addEventListener('click', () => { ind.value = ''; søg(); ind.focus(); });
    res.addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; const m = $(a.getAttribute('href')); if (m) { const f = m.closest('.fold'); if (f) f.classList.add('aaben'); if (m.tagName === 'DETAILS') m.open = true; const p = m.closest('.r5-gruppe'); if (p && p.hidden) visFane(p.id.replace('r5-g-', '')); } });
  }

  /* ═══════════════ FAKTASPOR ═══════════════ */

  /* H01+H02 – Send en pind / Høvl beskeden væk */
  function mountPind() {
    const el = $('#r5-runepind'), ri = $('#rune-ind'), ru = $('#rune-ud'); if (!el || !ri || !ru) return;
    const P = T.pind; let sendt = 0;
    el.innerHTML = `<div class="pind"><b class="kicker" style="margin:0">${esc(P.titel)}</b><p class="note">${esc(P.under)}</p><div class="pind-scene" id="pind-scene"><div class="pind-pinde" id="pind-pinde"></div><img class="pind-kniv" id="pind-kniv" src="${NY}snittekniv.webp" alt="${esc(P.knivAlt)}" width="768" height="768" loading="lazy"></div>
      <p class="pind-moderne" id="pind-moderne"><b>${esc(P.modern)}:</b> <span id="pind-moderne-t"></span></p>
      <div class="rune-knapper"><button type="button" class="knap" id="pind-send">${esc(P.send)}</button><button type="button" class="knap sek" id="pind-hoevl">${esc(P.hoevl)}</button></div><p class="pind-status" id="pind-status" aria-live="polite"></p>
      ${$('#runer-fakta') ? '' : vidfakta(P.fakta1 + ' ' + P.fakta2, P.kilde, P.url)}</div>`;
    const faktaRk = $('#runer-fakta'); if (faktaRk) { faktaRk.querySelector('.pind-fakta')?.remove(); faktaRk.insertAdjacentHTML('afterbegin', vidfakta(P.fakta1 + ' ' + P.fakta2, P.kilde, P.url).replace('class="vidfakta"', 'class="vidfakta pind-fakta"')); } // de to faktabokse side om side; mountPind kan køre igen (nulstil/sprog), så den gamle fjernes først
    const pinde = $('#pind-pinde', el), kniv = $('#pind-kniv', el), status = $('#pind-status', el), mod = $('#pind-moderne-t', el);
    function tegn() {
      const runer = ru.textContent === '…' ? '' : ru.textContent; mod.textContent = ri.value; const PR = 22, dele = []; for (let i = 0; i < Math.max(1, runer.length); i += PR) dele.push(runer.slice(i, i + PR));
      pinde.innerHTML = dele.map(d => `<div class="pind-en"><img src="${NY}runepind.webp" alt="${esc(P.pindAlt)}" width="1440" height="960" loading="lazy"><span class="pind-runer" aria-hidden="true" style="font-size:${d.length > 16 ? 'clamp(.8rem,2.6vw,1.5rem)' : 'clamp(1rem,3.4vw,2rem)'}">${esc(d)}</span></div>`).join('');
    }
    ri.addEventListener('input', () => { tegn(); status.textContent = ''; pinde.classList.remove('smal'); }); tegn();
    $('#pind-send', el).addEventListener('click', () => { if (!ri.value.trim()) { status.textContent = P.tom; return; } pinde.classList.remove('sendes'); void pinde.offsetWidth; if (!reduce()) pinde.classList.add('sendes'); status.textContent = P.sendt; sendt++; });
    pinde.addEventListener('animationend', () => pinde.classList.remove('sendes'));
    $('#pind-hoevl', el).addEventListener('click', () => { if (!ri.value.trim()) { status.textContent = P.tom; return; } const gør = () => { ri.value = ''; ri.dispatchEvent(new Event('input')); pinde.classList.add('smal'); status.textContent = P.hoevlet; }; if (reduce()) { gør(); return; } kniv.classList.remove('hoevler'); void kniv.offsetWidth; kniv.classList.add('hoevler'); setTimeout(gør, 650); });
    kniv.addEventListener('animationend', () => kniv.classList.remove('hoevler'));
  }

  /* H03 – Gråtand */
  function mountGråtand() {
    const el = $('#r5-graatand'); if (!el) return; const G = T.graatand; let on = false;
    el.innerHTML = `<div class="graatand"><div class="graatand-rune" aria-label="${esc(G.runerForkl)}" role="img"><span>ᚼ</span><span>ᛒ</span></div><div><b class="kicker" style="margin:0">${esc(G.titel)}</b><p class="note">${esc(G.under)}</p><button type="button" class="knap sek" id="graatand-par" aria-pressed="false">${esc(G.par)}</button><p class="graatand-status" id="graatand-status" aria-live="polite">${esc(G.status1)}</p></div>${vidfakta(G.fakta, G.kilde, G.url)}</div>`;
    $('#graatand-par', el).addEventListener('click', e => { on = !on; e.currentTarget.setAttribute('aria-pressed', String(on)); $('#graatand-status', el).textContent = on ? G.status2 : G.status1; });
  }

  /* F01 – Koens egen forklaring (i beviskortet) */
  function mountKotolk() {
    const el = $('#r5-kotolk'); if (!el) return; const K = T.kotolk; let timer = 0;
    el.innerHTML = `<button type="button" class="knap sek" id="kotolk-knap" aria-expanded="false" aria-controls="kotolk-dialog">${esc(K.knap)}</button>
      <div class="kotolk" id="kotolk-dialog" hidden tabindex="-1"><div class="kotolk-hoved"><b class="kicker" style="margin:0">${esc(K.titel)}</b><button type="button" class="knap sek" id="kotolk-luk">${esc(K.luk)}</button></div>
      <div class="kotolk-scene">${img(PAK + 'web/ko.webp', '', 1200, 675, 'kotolk-ko')}<svg class="kotolk-kurve" viewBox="0 0 200 40" aria-hidden="true"><path d="M0 20 Q10 20 20 20 T40 20 T60 20 T80 20 T100 20 T120 20 T140 20 T160 20 T180 20 T200 20"/></svg><div class="kotolk-under" aria-live="polite"><b id="kotolk-hvem">${esc(K.under)}</b><span id="kotolk-tekst">${esc(K.intro)}</span></div></div>
      <div class="kotolk-ui"><div class="forkl-knapper" role="group" aria-label="${esc(K.tolk)}">${K.tolke.map((t, i) => `<button type="button" data-i="${i}" aria-pressed="false">${portræt(t[0], true)}${esc(t[0])}</button>`).join('')}</div><button type="button" class="knap" id="kotolk-afhoer">${esc(K.afhoer)}</button></div><p class="note">${esc(K.note)}</p></div>`;
    const d = $('#kotolk-dialog', el), åbn = $('#kotolk-knap', el), kurve = $('.kotolk-kurve', el), hvem = $('#kotolk-hvem', el), tekst = $('#kotolk-tekst', el), af = $('#kotolk-afhoer', el); let valgt = null;
    const vis = o => { d.hidden = !o; åbn.setAttribute('aria-expanded', String(o)); if (o) d.focus({ preventScroll: true }); else åbn.focus(); };
    åbn.addEventListener('click', () => vis(d.hidden)); $('#kotolk-luk', el).addEventListener('click', () => vis(false)); d.addEventListener('keydown', e => { if (e.key === 'Escape') vis(false); });
    $$('.forkl-knapper button', el).forEach(b => b.addEventListener('click', () => { valgt = +b.dataset.i; $$('.forkl-knapper button', el).forEach(k => k.setAttribute('aria-pressed', String(k === b))); hvem.textContent = `${K.tolk}: ${K.tolke[valgt][0]}`; tekst.textContent = K.muh; }));
    af.addEventListener('click', () => { if (valgt === null) { valgt = 0; $$('.forkl-knapper button', el)[0].setAttribute('aria-pressed', 'true'); } clearTimeout(timer); af.disabled = true; af.textContent = K.afhoerer; kurve.classList.toggle('taler', !reduce()); hvem.textContent = `${K.tolk}: ${K.tolke[valgt][0]}`; tekst.textContent = K.muh; timer = setTimeout(() => { kurve.classList.remove('taler'); tekst.textContent = `${K.muh} – ${K.tolke[valgt][1]}`; af.disabled = false; af.textContent = K.afhoer; }, reduce() ? 0 : 1600); });
    onCleanup(() => clearTimeout(timer));
  }

  /* ═══════════════ SEKTIONEN: faner, grupper, nulstil ═══════════════ */
  const sek = $('#undersoeg');
  function visFane(id) { $$('.r5-fane', sek).forEach(b => { const on = b.dataset.g === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }); $$('.r5-gruppe', sek).forEach(g => g.hidden = g.id !== 'r5-g-' + id); }
  function byg() {
    cleanup.forEach(f => { try { f(); } catch (e) { } }); cleanup = [];
    const valgt = $('.r5-fane[aria-selected="true"]', sek)?.dataset.g || 'undersoeg';
    $('#r5-faner', sek).innerHTML = T.faner.map(f => `<button type="button" role="tab" class="r5-fane" id="r5-fane-${f[0]}" data-g="${f[0]}" aria-selected="false" aria-controls="r5-g-${f[0]}" tabindex="-1"><b>${esc(f[1])}</b><span>${esc(f[2])}</span></button>`).join('');
    const G = $('#r5-grupper', sek);
    G.innerHTML = `<div class="r5-gruppe" id="r5-g-undersoeg" role="tabpanel" aria-labelledby="r5-fane-undersoeg" hidden>${panel('akt', T.akt.titel, T.akt.under, '', true)}${panel('skjold', T.skjold.titel, T.skjold.under, '')}${panel('grav', T.grav.titel, T.grav.under, '')}${panel('side2', T.side2.titel, T.side2.under, '')}</div>
      <div class="r5-gruppe" id="r5-g-livet" role="tabpanel" aria-labelledby="r5-fane-livet" hidden>${panel('tavle', T.tavle.titel, T.tavle.under, '', true)}${panel('koe', T.koe.titel, T.koe.under, '')}${panel('kamera', T.kamera.titel, T.kamera.under, '')}${panel('museum', T.museum.titel, T.museum.under, '')}${panel('saeson', T.saeson.titel, T.saeson.under, '')}</div>
      <div class="r5-gruppe" id="r5-g-kontorer" role="tabpanel" aria-labelledby="r5-fane-kontorer" hidden>${panel('stol', T.stol.titel, T.stol.under, '', true)}${panel('panel', T.panel.titel, T.panel.under, '')}${panel('beredskab', T.beredskab.titel, T.beredskab.under, '')}${panel('maal', T.maal.titel, T.maal.under, '')}${panel('soeg', T.soeg.titel, T.soeg.under, '')}</div>`;
    const m = { akt: mountAkt, skjold: mountSkjold, grav: mountGrav, side2: mountSide2, tavle: mountTavle, koe: mountKø, kamera: mountKamera, museum: mountMuseum, saeson: mountSæson, stol: mountStol, panel: mountPanel, beredskab: mountBeredskab, maal: mountMål, soeg: mountSøg };
    for (const id in m) { const el = $(`#r5-${id} .r5-fold-ind`, sek); if (el) m[id](el); }
    $$('.r5-fane', sek).forEach(b => { b.addEventListener('click', () => visFane(b.dataset.g)); b.addEventListener('keydown', e => { const alle = $$('.r5-fane', sek), i = alle.indexOf(b); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = alle[(i + (e.key === 'ArrowRight' ? 1 : alle.length - 1)) % alle.length]; visFane(n.dataset.g); n.focus(); } }); });
    visFane(valgt);
    mountKotolk(); mountPind(); mountGråtand(); opdaterStatus();
  }
  // side 2 gentegnes ved nye fund
  lyt.push(() => { const el = $('#r5-side2 .r5-fold-ind', sek); if (el) mountSide2(el); });

  if (sek) {
    byg(); anvendSæson();
    const n = $('#r5-nulstil'); if (n) n.addEventListener('click', () => { S = defaults(); S.lastSeenLocalDate = idag.iso; save(); byg(); anvendSæson(); emit(); const st = $('#r5-nulstil-status'); if (st) st.textContent = T.nulstil.ok; });
    // ankerlink ind i en fane: åbn den rigtige gruppe
    if (location.hash) { const m = $(location.hash.replace(/[^#\w-]/g, '')); const p = m && m.closest('.r5-gruppe'); if (p) { visFane(p.id.replace('r5-g-', '')); if (m.tagName === 'DETAILS') m.open = true; } }
  } else { anvendSæson(); }
})();
;
/* ═══ kaede.js (assets/kilde/kaede.js) ═══ */
/* tingsvad.dk — kæden i »Vis maskineriet« (runde 12): samme tegning som infrastrukturkortet, men kun med de led,
   den enkelte maskine faktisk bruger. Efter hvert kald lyser de bindinger, kaldet rørte (læst fra Workerens
   Server-Timing: d1, ai, r2, kv, vectorize, browser), med målte millisekunder. Andet end tjenester (idempotens,
   WebSocket, CSP …) vises som små mærker under tegningen. Bruges af maskinpark.js og sagsmappe.js. */
(function () {
  'use strict';
  const da = document.documentElement.lang !== 'en';
  const T = da ? {
    browser: 'Din browser', kanten: 'Kanten', site: 'tingsvad-site', ai: 'tingsvad-ting-ai', sb: 'service binding', ws: 'WebSocket', cron: 'hver morgen',
    venter: 'venter på kald', ikkeSidst: 'ikke i sidste kald', bruges: 'bruges', kald: n => n + ' kald', lokal: 'Web Worker', lokalSub: 'i din browser', ingenServer: 'ingen server',
    teknik: 'Teknikker', titel: 'Kæden for netop denne maskine', iAlt: 'i alt', fraCache: 'svar fra kantens cache', cacheIkke: 'ikke i cachen',
  } : {
    browser: 'Your browser', kanten: 'The edge', site: 'tingsvad-site', ai: 'tingsvad-ting-ai', sb: 'service binding', ws: 'WebSocket', cron: 'every morning',
    venter: 'waiting for a call', ikkeSidst: 'not in last call', bruges: 'in use', kald: n => n + (n === 1 ? ' call' : ' calls'), lokal: 'Web Worker', lokalSub: 'in your browser', ingenServer: 'no server',
    teknik: 'Techniques', titel: 'The chain for this machine', iAlt: 'total', fraCache: 'answered from the edge cache', cacheIkke: 'not in cache',
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // produkt → led. t = navnet i Server-Timing, hvis Workeren måler det
  const LED = [
    [/^Workers AI/i, 'Workers AI', 'ai'], [/^AI Gateway/i, 'AI Gateway'], [/^AI Search/i, 'AI Search'], [/^D1/i, 'D1', 'd1'], [/^R2/i, 'R2', 'r2'],
    [/^(Workers )?KV/i, 'Workers KV', 'kv'], [/^Vectorize/i, 'Vectorize', 'vectorize'], [/^Durable Objects/i, 'Durable Objects'], [/^Workflows/i, 'Workflows'],
    [/^Queues/i, 'Queues'], [/^Images/i, 'Images'], [/^Browser Run/i, 'Browser Run', 'browser'], [/^Turnstile/i, 'Turnstile'], [/^Rate Limiting/i, 'Rate Limiting'],
    [/^Cron Triggers/i, 'Cron Triggers', null, 'cron'], [/^Analytics Engine/i, 'Analytics Engine'], [/^GitHub/i, 'GitHub', null, 'ekstern'],
    // runde 12
    [/^Workers Cache/i, 'Workers Cache', null, 'cache'], [/^Realtime SFU/i, 'Realtime SFU'], [/^Web Search( API)?/i, 'Web Search API'], [/^Secrets Store/i, 'Secrets Store'],
  ];
  const SKJUL = /^(Workers|Site-Worker → Service Binding)$/i; // står allerede i kæden
  function del(p) {
    const s = String(p);
    for (const [re, navn, t, art] of LED) if (re.test(s)) {
      const rest = s.replace(re, '').replace(/^\s*[·(]\s*/, '').replace(/\)\s*$/, '').trim();
      return { navn, t: t || null, art: art || '', sub: rest };
    }
    return null;
  }
  const timing = h => String(h || '').split(',').map(x => x.trim()).filter(Boolean).map(x => { const [n, ...r] = x.split(';'); const o = { n: n.trim() }; r.forEach(q => { const [k, v] = q.split('='); if (k && v) o[k.trim()] = v.trim().replace(/^"|"$/g, ''); }); return o; });
  const ms = x => (x < 10 ? (+x).toFixed(1) : Math.round(x)) + ' ms';

  let kant = null, kantP = null; // /api/kant hentes én gang pr. side: hvilket datacenter svarede
  function hentKant(cb) {
    if (kant) return cb(kant);
    if (!kantP) kantP = fetch('/api/kant', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json()).then(j => (kant = j && j.ok ? j.data : {})).catch(() => (kant = {}));
    kantP.then(cb);
  }
  function css() {
    if (document.querySelector('link[href*="/assets/infrakort.css"]')) return;
    const v = (document.querySelector('link[href*="/assets/site.css"]') || {}).href || '';
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/infrakort.css' + ((v.match(/\?v=[0-9a-z]+/) || [''])[0]);
    document.head.appendChild(l);
  }

  function svg(spec, k, kd) {
    const alle = (spec.p || []).map(p => ({ p, d: del(p) }));
    const led = alle.filter(x => x.d).map(x => x.d);
    const lokal = (spec.p || []).some(p => /^(Ingen server|No server)$/i.test(p));
    const st = k ? timing(k.timing) : [];
    const tot = st.find(x => x.n === 'total');
    const fejl = k && (k.code === 'network' || k.status >= 400);
    const node = (x, y, w, h, titel, linjer, s) => `<g class="ik-node ik-${s}" transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="10"/><circle class="ik-lys" cx="${w - 13}" cy="13" r="4.5"/>`
      + `<text class="ik-nt" x="11" y="20">${esc(titel)}</text>${linjer.filter(Boolean).map((l, i) => `<text class="ik-nl" x="11" y="${37 + i * 15}">${esc(l)}</text>`).join('')}</g>`;
    const kurve = (x1, y1, x2, y2, s) => { const m = (x1 + x2) / 2; return `<path class="ik-led ik-led-${s}" d="M${x1} ${y1} C${m} ${y1} ${m} ${y2} ${x2} ${y2}"/>`; };
    if (lokal) {
      const W = 1000, H = 104, y = 17, h = 70;
      return `<svg class="ik-kaede ik-kaede-mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.titel)}">${kurve(180, y + h / 2, 300, y + h / 2, k ? 'live' : 'konf')}`
        + node(8, y, 172, h, T.browser, [T.ingenServer], 'live') + node(300, y, 210, h, T.lokal, [T.lokalSub, k && Number.isFinite(k.ms) ? ms(k.ms) : ''], k ? 'live' : 'konf') + '</svg>';
    }
    const n = Math.max(1, led.length), bh = 30, gap = 6, top = 16, H = Math.max(120, top * 2 + n * (bh + gap) - gap), mid = H / 2, W = 1000;
    const c1 = { x: 8, w: 122, h: 62 }, c2 = { x: 152, w: 142, h: 62 }, c3 = { x: 318, w: 146, h: 62 }, c4 = { x: 524, w: 158, h: 62 }, bx = 716, bw = 278;
    const sv = fejl ? 'fejl' : k ? 'live' : 'konf';
    const p = [];
    const nodeSt = d => {
      if (d.art === 'cache') { const c = k && k.kantcache; return c ? { s: /HIT|STALE|REVALIDATED|UPDATING/i.test(c) ? 'live' : 'konf', tekst: c.toUpperCase() } : { s: 'konf', tekst: k ? T.cacheIkke : T.venter }; }
      if (k && /^(HIT|STALE)$/i.test(k.kantcache || '') && d.t) return { s: 'konf', tekst: T.fraCache }; // Workeren kørte ikke: tallene er fra dengang svaret blev lavet
      if (d.art === 'cron') return { s: 'konf', tekst: [d.sub, T.cron].filter(Boolean).join(' · ') };
      if (d.art === 'ekstern') { const e = spec.ekstern && spec.ekstern[d.navn]; return e ? { s: e.s, tekst: e.tekst } : { s: 'konf', tekst: d.sub || T.bruges }; } // uden for Cloudflare: tilstanden sættes af siden selv
      const m = d.t && st.find(x => x.n === d.t);
      if (m && m.dur != null) return { s: 'live', tekst: [d.sub && d.sub.length < 12 ? d.sub : '', ms(+m.dur), parseInt(m.desc, 10) ? T.kald(parseInt(m.desc, 10)) : ''].filter(Boolean).join(' · ') };
      return { s: 'konf', tekst: d.sub && d.sub.length < 22 ? d.sub : (k ? (d.t ? T.ikkeSidst : T.bruges) : T.venter) };
    };
    led.forEach((d, i) => { const y = top + i * (bh + gap); const ns = nodeSt(d); p.push(kurve(c4.x + c4.w, mid, bx, y + bh / 2, ns.s)); d._ns = ns; });
    p.push(kurve(c1.x + c1.w, mid, c2.x, mid, 'live'), kurve(c2.x + c2.w, mid, c3.x, mid, sv), kurve(c3.x + c3.w, mid, c4.x, mid, sv));
    const ws = spec.ws || (spec.p || []).some(x => /WebSocket/i.test(x));
    p.push((ws ? T.ws : T.sb).split(' ').map((o, i, a) => `<text class="ik-ll" x="${(c3.x + c3.w + c4.x) / 2}" y="${mid - 8 - (a.length - 1 - i) * 12}" text-anchor="middle">${esc(o)}</text>`).join(''));
    p.push(node(c1.x, mid - c1.h / 2, c1.w, c1.h, T.browser, [k && Number.isFinite(k.ms) ? ms(k.ms) : ''], 'live'));
    p.push(node(c2.x, mid - c2.h / 2, c2.w, c2.h, T.kanten, [kd && kd.colo ? kd.colo + (kd.by ? ' · ' + (da ? kd.by.da : kd.by.en) : '') : ''], kd && kd.colo ? 'live' : 'konf'));
    p.push(node(c3.x, mid - c3.h / 2, c3.w, c3.h, T.site, ['Assets · Router'], sv));
    p.push(node(c4.x, mid - c4.h / 2, c4.w, c4.h, T.ai, [tot ? `${ms(+tot.dur)} ${T.iAlt}` : (k ? String(k.status || '') : '')], sv));
    led.forEach((d, i) => {
      const y = top + i * (bh + gap), ns = d._ns;
      p.push(`<g class="ik-node ik-${ns.s}" transform="translate(${bx} ${y})"><rect width="${bw}" height="${bh}" rx="8"/><circle class="ik-lys" cx="13" cy="${bh / 2}" r="4.5"/><text class="ik-nt" x="26" y="${bh / 2 + 4.5}">${esc(d.navn)}</text><text class="ik-nl" x="${bw - 9}" y="${bh / 2 + 4}" text-anchor="end">${esc(ns.tekst)}</text></g>`);
    });
    return `<svg class="ik-kaede ik-kaede-mini" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(T.titel)}">${p.join('')}</svg>`;
  }
  function teknikker(spec) {
    const t = (spec.p || []).filter(p => !del(p) && !SKJUL.test(p) && !/^(Ingen server|No server|Web Worker)/i.test(p));
    return t.length ? `<p class="ik-teknik"><b>${esc(T.teknik)}:</b> ${t.map(x => `<span>${esc(x)}</span>`).join('')}</p>` : '';
  }
  /** Tegner kæden i host (et tomt element inde i »Vis maskineriet«). spec: {p: [produkter], ws?}. kald: seneste kald eller null. */
  function tegn(host, spec, kald) {
    if (!host) return;
    css();
    const lav = kd => { host.innerHTML = `<div class="ik ik-mini"><div class="ik-kaede-rul" tabindex="0" role="region" aria-label="${esc(T.titel)}">${svg(spec, kald, kd)}</div>${teknikker(spec)}</div>`; };
    lav(kant); if (!kant) hentKant(lav);
  }
  /* Dagbogen (runde 12): statistik fra et Durable Objects SQLite-lager, hentet med ét GET-kald. Vises kun, når den svarer. */
  const UGEDAG = da ? ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const D = da ? { titel: 'Dagbogen', under: 'SQL i Durable Objecten selv: hver hændelse er en række, tallene er en GROUP BY.', iAlt: 'i alt', doegn: 'seneste døgn', dag: 'travleste ugedag', time: 'travleste time', siden: 'ført siden', runder: 'afsluttede runder', svar: 'svar på', cache: 'fra kantens cache' }
    : { titel: 'The diary', under: 'SQL inside the Durable Object itself: every event is a row, the numbers are a GROUP BY.', iAlt: 'total', doegn: 'last 24 hours', dag: 'busiest weekday', time: 'busiest hour', siden: 'kept since', runder: 'closed rounds', svar: 'answered in', cache: 'from the edge cache' };
  function dagbog(host, sti, navne) {
    if (!host) return;
    let t0 = 0;
    // kun når Workeren melder, at dagbogen findes (ældre eller lokale Workers har den ikke: så intet kald og ingen 404)
    fetch('/api/ting-ai/health', { credentials: 'same-origin' }).then(r => r.json()).then(h => {
      if (!h || !h.ok || !h.data || !h.data.configured || !h.data.configured.dagbog) throw 0;
      t0 = performance.now();
      return fetch('/api/ting-ai/' + sti, { credentials: 'same-origin' });
    }).then(r => r.json().then(j => ({ j, c: r.headers.get('x-tingsvad-kantcache') }))).then(({ j, c }) => {
      const d = j && j.ok && j.data; if (!d || !d.iAlt) return;
      const maks = Math.max(1, ...Object.values(d.fordeling || {}));
      const tal = (n, l) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`;
      host.innerHTML = `<div class="ik-dagbog"><img class="ik-dagbog-bog" src="/assets/pak/cloudflare/dagbog-256.webp" width="96" height="85" alt="" loading="lazy"><p class="ik-dagbog-h"><b>${esc(D.titel)}</b> · <code>${esc(d.objekt)}('${esc(d.navn)}')</code></p><p class="note">${esc(D.under)}</p>
        <div class="ik-dagbog-tal">${tal(d.iAlt.toLocaleString(da ? 'da-DK' : 'en-GB'), D.iAlt)}${tal(d.doegn, D.doegn)}${d.travlesteDag != null ? tal(UGEDAG[d.travlesteDag], D.dag) : ''}${d.travlesteTime != null ? tal(String(d.travlesteTime).padStart(2, '0') + ':00', D.time) : ''}${d.runder ? tal(d.runder, D.runder) : ''}</div>
        <ul class="ik-dagbog-ford">${Object.entries(d.fordeling || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<li><span>${esc((navne && navne[k]) || k)}</span><i style="width:${Math.round(n / maks * 100)}%"></i><b>${esc(n)}</b></li>`).join('')}</ul>
        <pre class="ik-dagbog-sql"><code>${esc((d.sql || []).join(';\n') + ';')}</code></pre>
        <p class="note">${d.siden ? esc(D.siden) + ' ' + esc(new Date(d.siden).toLocaleDateString(da ? 'da-DK' : 'en-GB')) + ' · ' : ''}${esc(D.svar)} ${esc(ms(performance.now() - t0))}${/HIT|STALE/i.test(c || '') ? ' · ' + esc(D.cache) : (Number.isFinite(d.ms) ? ' · SQL ' + esc(ms(d.ms)) : '')}</p></div>`;
      host.hidden = false;
    }).catch(() => { });
  }
  window.tvKaede = { tegn, dagbog };
})();
;
