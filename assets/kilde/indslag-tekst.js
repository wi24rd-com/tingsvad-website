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
