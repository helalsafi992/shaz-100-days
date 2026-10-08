# SHAZ — samlet byggeinstruks til Work

**Dette dokument erstatter tidligere, modstridende byggeprompts. Det er en implementeringsopgave, ikke en researchopgave eller en roadmap.**

Du skal færdiggøre, teste og deploye det eksisterende SHAZ-produkt. Alle krav nedenfor er omfattet, medmindre en konkret ekstern afhængighed forhindrer dem. Manglende betalingsnøgler må eksempelvis ikke blokere hybridtræning, madplan eller design.

Produkt: **SHAZ — 100 dages forløb. 399 kr. i samlet kundepris. Engangsbetaling. Intet abonnement.** Selvstyret træning, cardio og kost; ikke 1:1-coaching eller behandling. Kundens hovedspørgsmål er altid: **Hvad skal jeg gøre i dag?**

## 1. Fortsæt i det eksisterende projekt

Repository: `helalsafi992/shaz-100-days`.
Produktion: `https://shaz-production.up.railway.app/`.
Testlogin: `https://shaz-test-staging.up.railway.app/login`.
Eksisterende testkonto: `test@shaz.example`. Genbrug den; udskriv ikke adgangskoden.

Railway produktion: projekt `5e76002a-fecf-400c-84ba-86f64bae34c3`, service `fae2bae1-4351-4455-b2e6-643ca9e921a8`, miljø `ec0a9e9a-98c7-49d4-a577-841ffbc49c48`.
Railway test: projekt `6a019412-cb8a-4ac1-a8ae-a1c315f7b211`, service `0853fd47-76d5-40d8-915e-505a77df4353`, miljø `de3bb432-9940-4411-b02b-7b4863644e50`.

Kontrollér aktuelle branches, commits, deployment og eventuelle igangværende ændringer. Sammenlign `main` og `feat/integrated-plans`; brug den mest komplette kompatible kode. Ingen nulstilling, force-push eller tilbageførsel til en gammel beta. Undersøg eksisterende staged Railway-ændringer før accept; godkend ikke ukendte ændringer samlet.

Genbrug Next.js, TypeScript, PostgreSQL, Better Auth og Stripe. Opret ikke nyt repo, nyt kundeprodukt eller nyt Railway-projekt. Test og produktion skal bruge samme implementering, men separate data, secrets og betalingsmiljøer. Et testmiljø er ikke en parallel demoversion.

Læs især `lib/profile.ts`, `lib/nutrition.ts`, planlægningsmodulerne, `Portal.tsx`, `Onboarding.tsx`, `FoodPlanner.tsx`, cardio-, konto- og checkoutkomponenterne. Den inspicerede profilmodel havde kun `home/gym`, 2/3/4 styrkepas, én udstyrsliste og et forbud mod vægtstang ved hjemmetræning. Ret dette hele vejen gennem validering, database, generator og brugerflade.

Opret `docs/SHAZ-MASTER.md` ud fra dette dokument og en kravmatrix: krav-ID → kode → test → resultat → deployment. Arbejd derefter direkte med implementeringen. Et krav må ikke markeres færdigt, fordi der findes en knap.

## 2. Én kunderejse og tydelige adgangstilstande

Rejsen er: **Forside → checkout med kontooprettelse → betaling → kort opsætning → I dag.** Ved genbesøg: **Log ind → eget forløb.**

Brug eksisterende routes, hvor muligt. Bevar disse destinationer eller kompatible redirects: `/`, `/checkout`, `/checkout/success`, `/login`, `/onboarding`, `/app`, `/app/training`, `/app/food`, `/app/progress`, `/app/profile`, `/admin`. Tilføj en tydelig hjælpeside og digital fortrydelsesfunktion. Gamle `/demo` og `/preview` må ikke indgå i kunderejsen eller skabe redirect-loops.

Serveren skal skelne mellem: anonym; konto uden køb; betaling afventer; betalt uden færdig opsætning; planlagt start; aktivt forløb; afsluttet forløb; refunderet/tilbagekaldt adgang. E-mailverifikation er en separat kontotilstand. Frontend må ikke selv opfinde adgang.

En konto uden køb ser “Fortsæt dit køb”, ikke et gratis dashboard. En betalt kunde uden opsætning fortsætter, hvor vedkommende slap. En aktiv kunde lander på I dag. Efter dag 100 vises afslutning og egen historik efter den oplyste opbevaringspolitik; ingen ny betaling eller automatisk genstart. Ordre, hjælp, fortrydelse og egne data skal fortsat kunne tilgås ved tilbagekaldt produktadgang.

## 3. Salgssiden skal være færdig, ikke en indgang til demoer

Header: **SHAZ · Det får du · Spørgsmål · Log ind · Køb forløbet — 399 kr.** Login er direkte synligt også på mobil. Kunder med adgang ser “Mit forløb”.

Hero: **“Din træning. Din madplan. Dine næste 100 dage.”** Undertekst: “Et samlet forløb med træning, cardio og måltider tilpasset din hverdag.” Vis 399 kr., én betaling og intet abonnement. Brug godkendt materiale med Shaz; opfind ikke citater, erfaring, anmeldelser eller resultater.

Vis i denne rækkefølge: konkret produktværdi; billeder fra det rigtige kundeområde; Hjemme/Fitness/Begge; kaloritilpasset mad med tre valg; Sådan fungerer det; hvad der sker gennem de 100 dage; korte spørgsmål; pris og køb; kontakt og handelsoplysninger. Forklar hvem forløbet passer til og de væsentlige begrænsninger før betaling. Ingen lovning om individuelt bestemt vægttab.

Alle købsknapper fører direkte til samme checkout. Ingen mellemliggende salgsside, “prøv købsflowet” eller præsentationskonto. Vis kun betalingsmetoder, som faktisk er aktiveret. Offentlig salgsstatus skal komme fra serverens reelle releasekontrol, ikke hårdkodet tekst eller en frontendvariabel.

Når salg er lukket, skal siden sige det entydigt uden aktive købsknapper, der ender blindt. Det korrekte købsflow skal stadig kunne testes i det eksisterende isolerede miljø.

## 4. Design: brug den leverede designreference som komponentgrundlag

Brug pakkens `design/` eller den tidligere `SHAZ_designpakke.zip`, herunder `DESIGN-HANDOFF.md`, `design-tokens.json`, HTML og screenshots. Denne masterinstruks har forrang for ældre handoff-tekster: både præsentation og nødvendige domænemodeller skal nu færdiggøres. Det er en visuel reference, ikke kode til autentificering, kostberegning eller serverlagring. Kopiér ikke fiktive data og lokale loginfunktioner ind i produktet. Hvis pakken ikke er tilgængelig, implementér specifikationerne her; stop ikke arbejdet.

Kundeområdet har lys baggrund `#F5F6F2`, hvide kort, kant `#E5E9E1`, primær tekst `#17201B`, sekundær tekst `#667168`, SHAZ-accent `#D9F66F`, styrke/succes `#32664B` og cardio `#567C9E`. Lime er til hovedhandlinger, ikke hele måltider eller træningsprogrammer. Farve ledsages altid af tekst eller ikon.

Brug systemskrifttype eller eksisterende licenseret font. Hovedoverskrift 25–28 px mobil og 30–32 px desktop; kortoverskrift 18–20 px; brødtekst/input mindst 16 px; metadata normalt 14 px. Brug 4/8/12/16/24/32 px afstandsskala, 16 px mobilmargin, cirka 20 px kortpadding og 15–18 px afrunding. Kontrollér reelle kontraster; vigtig tekst må ikke gøres ulæselig for at ramme et screenshot.

Mobil til 760 px: én kolonne, kompakt logo/profil øverst, fire bundfaner: **I dag / Træning / Mad / Fremgang**. Tablet: én hovedkolonne og navigation uden sammenpresset ekstra kolonne. Desktop: cirka 222 px sidebar og højst cirka 1.180 px indhold; I dag kan have aktivitet til venstre og mad til højre.

Én tydelig primær handling pr. opgave. Avancerede indstillinger under “Tilpas plan”; sekundære måltidshandlinger i en menu. Ingen menuer inde i menuer for almindelige ændringer. Dialoger er bundpanel på mobil og sidepanel/dialog på desktop med navngivet overskrift, fokusstyring, Escape og synlig bekræftelse.

Trykflader mindst 44 × 44 CSS-px som produktkrav. Følg WCAG 2.2 AA: tastatur, fokus, tekstalternativer, kontrast, fejlbeskeder og forstørrelse. Ingen vandret sideoverflow ved 320 px; kontrollér 200 % tekst/zoom, safe areas, skærmtastatur og reduced-motion. En testmarkering må være kompakt, men må ikke skjules for at maskere test eller manglende faglig gennemgang. Tilgængelighedsgrundlag: K3; størrelserne her er derudover konkrete produktvalg.

Alle skærme skal have designede tilstande for indlæsning, tomme data, succes, fejl, offline og adgangsudløb. Ingen evige spinnere, falske “Gemt”-beskeder eller ubeskrevne deaktiverede knapper.

## 5. Konto, betaling, e-mail og testadgang

Checkout viser produkt, totalpris, navn, e-mail og adgangskode; eksisterende bruger kan logge ind på samme skærm. Tillad passwordmanager, indsæt og vis/skjul adgangskode. Genbrug e-mailen; intet obligatorisk telefonnummer. Bevar eksisterende konti og eventuelle maillinks under migrationen.

Brug almindelig Better Auth-konto og sikker session. Konto oprettes før betaling og forbindes med ordren gennem serverbestemt bruger-ID. En ubekræftet konto kan have en begrænset checkoutsession, men ikke læse beskyttede forløbsdata. Send e-mailbekræftelse automatisk. Betaling må ikke i sig selv markere en vilkårlig e-mail som verificeret. Brug K2 og den installerede versions API.

Efter betaling bevares sessionen. Er e-mailen allerede verificeret, fortsæt direkte til opsætning. Ellers vis ét tydeligt bekræftelsestrin med genudsendelse og automatisk fortsættelse efter verifikation. Kunden skriver ikke e-mail eller adgangskode igen unødvendigt. Et link åbnet på en anden enhed må ikke logge en uvedkommende konto ind eller sammenflette konti.

Stripe: `mode=payment`, DKK, 39.900 øre, ét produkt, antal 1. Ingen skjult moms oveni; vis korrekt momsbehandling ud fra faktiske sælgeroplysninger. Ingen rigtige kortdata på egen server.

Én idempotent fulfillment-funktion skal verificere betaling, forventet produkt/pris/valuta/miljø og ordretilknytning. Kald den fra signaturverificerede webhooks og om nødvendigt efter serverhentning af Checkout Session ved retur. Success-URL'en er aldrig betalingsbevis eller login. Håndtér samtidige kald, gentagelser, forsinkede hændelser og hændelser i forkert rækkefølge. Fulfillment-grundlag: K1.

Genoptag et uafsluttet køb uden dubletter. Bind ejerskab til konto/ordre, ikke til et redigerbart billing-emailfelt. En gammel betalingshændelse må ikke genåbne et refunderet køb. Håndtér afvist betaling, afbrudt checkout, fuld/delvis refundering og indsigelse efter dokumenterede regler.

Send verifikation, kvittering, reset og nødvendige servicemails gennem en holdbar kø med retry, leveringsstatus og fejlalarmer. Skeln mellem accepteret af mailudbyder, afleveret til modtagerserver og faktisk kontrolleret modtagelse. Ingen succesbesked om afsendelse, hvis en kendt konfigurationsfejl forhindrer den. Ukendte e-mails får neutral besked uden kontolæk.

Genbrug testkontoen med serverbundet testadgang, kun i det eksisterende testprojekt. Den må ikke blokere på post til `.example`. Første konkrete kontrol er et faktisk login i deployet browser og adgang til hele produktet. Ingen delte produktionsadgangskoder, offentlige testlogin-endpoints eller credentials i dokumentation.

## 6. Opsætning: fulde valg uden én lang formular

Tre overskuelige grupper: **Dit mål / Din træningsuge / Din mad**. Brug korte underskærme med gemt fremgang; vis kun relevante spørgsmål. Valg kan ændres senere via “Tilpas plan” uden at genstarte onboarding.

Mål: fedttab, muskelopbygning, vedligeholdelse eller bedre form. Niveau: begynder, let øvet, erfaren. Målgruppe er voksne; oplys begrænsninger før køb. Kropsdata er kun nødvendige ved beregnet kost. Tilbyd portionsvejledning uden vægtregistrering. Ingen diagnoseformular som standard.

Træningsvalg skal omfatte:
- **Hjemme / Fitnesscenter / Begge** og navngivne lokationer.
- Udstyr og belastningsmuligheder pr. lokation, inklusive eget homegym.
- Antal styrkepas, konkrete ugedage og varighed pr. pas.
- Placering hjemme/center for hver træningsdag ved Begge.
- Øvelser man ikke ønsker, behov for alternativer og anden sport i ugeplanen.
- Cardioantal, dage, form, udstyr, niveau, tid og intensitet.

Understøt valg af 0–6 styrkepas og 0–6 cardiopas. 0 styrke er en reel kost/cardio-profil. 1 styrkepas er et begrænset start-/vedligeholdelsesvalg, ikke markedsført som identisk med 3. Standardforslag er 2–4 styrkepas. 5–6 kræver egnet erfaring og en godkendt skabelon; de må ikke blot kopiere helkropsprogrammet seks gange. Afvis uegnede kombinationer med forklaring og alternativer.

Adskil antal pas fra antal aktive dage. Styrke og let cardio samme dag er to pas på én dag. Bevar mindst én dag uden planlagt hård træning i standardpolitikken, og kontrollér samlet belastning inklusive kundens anden sport. Reglerne er produktpolitik til faglig gennemgang, ikke universelle fysiologiske love.

Tilbyd 20/30/45/60/75 minutter samt bevar eksisterende 25/40/55-minutters profiler uden tavs afrunding. Hverdage vises mandag–søndag; lagring har én eksplicit ugedagskonvention med migration af gamle værdier.

Kostvalg: beregning/portioner, 2–6 måltider, navne og tider, kostmønster, halal-egnethed som separat valg, allergener, fravalg, madlavningstid og ønske om rester/gentagelser. Vegetarisk og halal skal kunne kombineres. Tilbyd kun kostmønstre, hvor kataloget reelt dækker planen; medicinske diæter er ikke med.

Afslut med en redigerbar uge: dag, aktivitet, sted og tid; måltidsantal og kostmål; valgt startdato. “Start mit forløb” aktiverer én gang. Før start må kunden planlægge mad, indkøb og fremtidige pas.

## 7. Hybridtræning og planlægningsmotor — ikke blot en ny knap

Migrér fra ét `place` til lokationsprofiler og valg pr. pas. En øvelse kræver konkret udstyr, ikke bare ordet “fitness”. Vægtstang/rack er tilladt hjemme, når kunden faktisk har det. “Fitnesscenter” beviser ikke, at alle maskiner findes.

Planmotorens input er mål, niveau, dato, tilgængelige/låste dage, tid, lokation, udstyr, fravalg, eksisterende pas og belastningshistorik. Output er en versioneret 100-dages plan med begrundelser og konkrete konflikter.

Prioritet: bevar udført arbejde → overhold sikkerhedsregler → respekter låste dage/steder/tider → match træningsformål og niveau → fordel belastning → vælg udstyrsegnede øvelser → tilføj valgfri cardio → præsentér resultat.

Dage i træk må ikke automatisk afvises alene, fordi den gamle helkropsskabelon ikke passer. Prøv en egnet godkendt fordeling med anden belastning/split. Findes ingen forsvarlig plan, vis konflikten og to konkrete løsningsforslag. Flyt ikke kundens valgte dage uden accept.

**Obligatorisk referenceprofil:** mandag 45 min i center, onsdag 25 min hjemme med håndvægte/elastik, fredag 45 min i center, søndag 30 min let cykling. Onsdag må ikke indeholde kabelmaskine eller benpres. Lokation, tid, øvelser og udstyr skal stemme overens i kalender, pas og indstillinger.

Tilføj “Jeg træner et andet sted i dag” og “Jeg har mindre tid i dag”. Vis et beregnet alternativ og hvad der ændres. Kunden vælger denne træning, denne uge eller fremtidige uger. Bevar allerede udførte sæt; reducer ikke et 60-minutters pas til 20 ved kun at ændre tidslabel.

Vis altid ændringspreview: før/efter, berørte datoer, øvelser og konflikter. Bekræftelse gemmer atomisk med versionskontrol. Et gammelt preview afvises efter en anden sessions ændring. Genindlæsning genererer ikke tilfældigt en ny plan.

Flytning bevarer passets identitet. Tilbyd ledig dag eller kontrolleret bytte, ikke to pas oven i hinanden. Sygdom/rejse kan markeres for en periode med et genstartsvalg; ingen automatisk indhentning. Det ændrer ikke stiltiende de 100 kalenderdages adgang.

## 8. I dag, ugeplan og selve træningen

I dag viser først dag/uge og dagens næste handling. Ved 390 × 844 skal aktivitetens navn, sted, varighed og startknap kunne ses uden indholdsscroll. Derefter samlet uge, dagens mad og relevant check-in. Restitution er en planlagt aktivitet, ikke en fejltilstand.

Én fælles kalenderfunktion klassificerer Styrke, Cardio, Styrke + cardio og Restitution. Den bruges af dashboard, træningsside og fremgang. Vis en valgt uge; de øvrige 100 dage kan åbnes uden at fylde skærmen fra start. Tæl gennemførte styrke- og cardiopas separat.

Et pas har opvarmning, øvelsesrækkefølge, sæt, gentagelser eller sekunder, pause, belastningsvejledning, forklaring og passende alternativer. Øvelser til hver side og tidsbaserede øvelser må ikke presses ind i et generisk gentagelsesfelt.

“Start træning” åbner fokustilstand med én øvelse ad gangen, lille pasoversigt, sidste sammenlignelige registrering, teknik/video, sætlog og pausetimer. Kunden kan gå tilbage eller åbne oversigten uden datatab. Næste øvelse/afslut er fast synlig; almindelig bundnavigation skjules kun under fokustilstand.

Øvelsesbytte viser op til tre fagligt relevante muligheder. Match bevægelsesfunktion, udstyr, niveau og fravalg. Manglende alternativer forklares. Tidligere sæt arkiveres med den faktiske øvelse; flyt aldrig squatdata over på benpres som samme præstation.

Gem kladde efter ændring med kort debounce samt ved fokusskift. Vis “Gemmer”, “Gemt” eller “Offline — gemt på denne enhed”. Synkronisér idempotent ved forbindelse; håndtér konflikter mellem enheder. Afslutningsknappen tæller først passet, når serveren har accepteret afslutningen. Tomt pas kan ikke blive gennemført ved et tilfældigt klik.

Timeren beregnes fra sluttidspunkt og tåler baggrund/forgrund. Lyd er frivillig. Progression skal bygge på relevante gennemførte sæt og kontrolleret præstation, ikke kalenderens ugenummer alene. Vis anbefaling før ændring; faglige parametre ligger i godkendte policies.

## 9. Cardio som integreret aktivitet

Understøt relevante skabeloner for gang, cykling, løb/gang, løb, crosstrainer og roning, når niveau og udstyr passer. Hvert pas har form, mål, opvarmning, arbejdsdel, intensitetsforklaring, nedkøling og log.

Brug forståelig anstrengelse/taletest; puls er valgfri og kræver et ordentligt beregningsgrundlag. Tilbyd tre egnede alternativer, hvor de findes, men påstå ikke identisk forbrænding ved samme antal minutter.

Kunden kan ændre, flytte, fravælge og registrere tid, distance og anstrengelse. Ved 0 cardio vises en rolig tomtilstand og “Tilføj cardio”, ikke et halvt tomt hoveddashboard. Tilpas intensitet til samlet styrkebelastning, erfaring og restitution.

Aktivitetsændringer kan give forslag om at revidere ligevægtsestimatet, men må ikke automatisk “spise træningen tilbage”. Ingen motion som straf for et måltid og ingen automatisk cardioforøgelse ved aggressivt underskud.

## 10. Ligevægtsindtag, underskud og ernæringspolitik

Brug dokumenteret hvilestofskifteberegning, eksempelvis Mifflin–St Jeor: `10 × kg + 6,25 × cm − 5 × alder + koefficient`, med +5/−161 efter valgt beregningsparameter. Den estimerer hvileforbrug; én forklaret aktivitetsmodel giver samlet ligevægt. Træning må ikke tælles to gange. Formlens grundlag er K4; aktivitetsfaktorer og underskud er særskilte produktantagelser.

Vis separat: estimeret ligevægt; valgt underskud/overskud; mål; planlagt energi; registreret spist. Vis procent og kcal; ingen falsk præcision eller automatisk korrektion fra én vejning.

Bevar de aftalte produktvalg: Moderat 10 %, Meget 15 %, Rigtig meget 20 %, Aggressivt 25 %. Vedligeholdelse er 0; muskelopbygning har særskilt kontrolleret overskud. En formeltest ved 2.400 kcal skal give 2.160/2.040/1.920/1.800 kcal. Det er en regnetest, ikke bevis for individuel egnethed.

Den eksisterende `nutritionRule` står i review. Få minimumsindtag, maksimalt absolut underskud, kropsvægt, træningsbelastning, makroer og varighed gennemgået. Lemp ikke eksisterende beskyttelse blot for at få tests til at blive grønne. Aggressivt er ikke standard og må ikke løbe ukontrolleret gennem alle 100 dage.

Håndhæv både beregningens `available` og valgets `allowed` på serveren. En matematisk gyldig værdi er ikke automatisk tilladt. Kontrollen gælder også direkte API-kald, ændret træning, nye dage og udløbet evalueringsperiode. Brug én serverbestemt dato, ikke klientens ur til at omgå perioden.

Ingen automatiske vægttabsplaner til mindreårige eller uegnede profiler, eksempelvis graviditet/amning, relevant sygdom eller spiseforstyrrelsesproblematik. Vis generel information og relevant individuel hjælp, ikke en alternativ skjult restriktionsplan. Meget lave energiindtag er ikke en selvbetjent SHAZ-funktion; se det faglige skel i K5. De valgte 10/15/20/25 % er ikke anbefalinger fra NICE. De nødvendige sikkerhedsoplysninger indsamles dataminimeret med korrekt behandlingsgrundlag.

Definér kildebelagte, versionerede ernæringskrav pr. understøttet profil. Kontrollér også fedt, fibre, variation og relevante mikronæringsstoffer; manglende data er “ukendt”, ikke nul. En kalorietest er ikke ernæringsfaglig godkendelse. Godkendte standarduger og grænser kræver reel faglig gennemgang; brugerens frie ændringer må ikke markedsføres som automatisk fuldt validerede.

**Ret proteinvisningen:** skriv eksempelvis “Planlagt: 160 g · Minimumsmål: 102 g · Spist: 0 g”. Planlagt protein over et minimum er ikke i sig selv et underskud eller en fejl. Skeln mellem minimum, målinterval og registreret indtag.

## 11. Madplansmotor: 2–6 måltider og tre reelle valg

2–6 navngivne måltidspladser med valgfri tid; morgenmad er ikke obligatorisk. Antallet ændrer energifordelingen, ikke dagsmålet. Vis portionstypen som tydeligt særskilt, hvis kunden ikke bruger kalorier.

Generatoren skal: læse mål og restriktioner; afsætte passende energi/næringskrav pr. plads; filtrere godkendte retter; beregne praktiske portioner; finde tre forskellige muligheder; kontrollere valgt dag og ugekvalitet; gemme stabile valgte retter og alternativer.

Vælg præcis én mulighed pr. plads. Ved hvert standardforslag skal portionsberegningen passe til pladsen; ved komplette standarddage sigtes efter højst ±5 % af målet. Kontrollér alle `3^N` kombinationer for de godkendte testprofiler, ikke kun første forslag i hver plads. Hvis låste måltider umuliggør målet, vis konflikt i stedet for tavst at ændre dem.

Tre forslag betyder forskellige reelle retter, ikke samme ret med andet navn. Understøttede almindelige kostprofiler skal have den nødvendige katalogdækning. Stramme kombinationer kan give færre muligheder; vis antal og begrundelse uden dubletter eller allergibrud. Udvid biblioteket efter dækning, ikke blot et dekorativt antal opskrifter.

Portionsgrænser gælder både ret og ingredienser. Undgå et kilo skyr, absurde salatmængder, 0,13 æg og ændret ret gennem vilkårlig opskalering. Ingredienskomponenter som protein, stivelse og sauce kan skaleres efter opskriftens gennemgåede regler. Alle viste gram og næringssummer beregnes fra samme data efter afrunding.

Bevar favoritter og valgte retter ved ændringer, hvor de stadig passer. Regenerering skal kræve accept og have anvendelsesområde: dette måltid, denne dag eller fremtidige dage. Spist historik og afsluttede dage er snapshots. Et nyt kostfilter gælder fremadrettet uden at omskrive, hvad kunden allerede spiste.

## 12. Madskærme, opskrifter og indkøb

Min madplan viser én valgt dag, kompakt energi/proteinoversigt og måltidskort. Kortet har tid/navn/status, foto, ret, tid/portion, kcal/protein samt “Se opskrift” og “Byt · 3 valg”. Portion, fjernelse og øvrige indstillinger ligger i én menu. Markering som spist skal være tydeligt navngivet.

Byttepanel: tre egnede valg, ét valgt ad gangen, portion/næringsindhold, ændringen i dagens total og “Bekræft bytte”. “Se flere retter” åbner filtreret bibliotek. Lukning annullerer, bekræftelse gemmer atomisk og opdaterer indkøb. Andre retter ændres ikke uden særskilt accept.

Fjernelse efterlader tom plads med “Vælg opskrift” og “Fortryd”. Dagsmålet er uændret. “Jeg sprang måltidet over” registrerer faktisk hændelse og er en anden handling. Ingen automatisk kompensationsmotion eller ændring af dagens mål.

Hver opskrift har ingredienser, mængder, rå/tilberedt/drænet vægtgrundlag, grundportioner, trin, tid, opbevaring/rester, næringskilde og allergensammensætning. Brug DTU/Frida eller andre dokumenterede kilder med version, fødevare-ID og tilladt anvendelse (K6). Bevar eksisterende kildegrundlag i historik; skriv ikke “Frida”, hvis data faktisk er USDA. Bland ikke ukritisk USDA-total-kulhydrat og EU-deklarationskulhydrat.

Brug relevante brugsberettigede billeder af retterne. Neutrale pladsholdere må eksistere under arbejdet, men må ikke præsenteres som færdige opskriftsfotos. Ingen opfundne Shaz-videoer eller erklæringer om certificeret halal. Kostvalget betyder egnede ingredienstyper; kunden skal fortsat kontrollere konkrete produkter ved allergi/certificering.

Indkøb har valgt datointerval, grupperede varer, sammenlagte mængder og gemte afkrydsninger. Kun valgte retter tæller. Skeln mellem kundens personlige portion og antal personer, der laves mad til: mad til to fordobler indkøb, ikke kundens kalorier. Rester/batchmåltider må ikke bestilles to gange. Gram, kg, ml og styk må kun omregnes med kendt omregningsgrundlag.

Hvis en afkrydset vares mængde vokser efter et bytte, skal merbehovet fremhæves eller afkrydsningen genovervejes. Vis hvilken uge listen gælder, så gårsdagens afkrydsninger ikke skjuler nye indkøb.

## 13. Fremgang, profil, hjælp og afslutning

Fremgang viser udført styrke, udført cardio, gennemførelse mod den faktiske plan og udvikling i sammenlignelige øvelser. Valgfri vægt vises med datoer og trend, ikke garanti eller diagnose. En tom historik får forklaring og første relevante handling, ikke opdigtede grafer eller rekorder.

Ugentligt check-in er kort: gennemførelse, energi/restitution, om planen passer, og valgfri sult/mæthed. Forslag viser begrundelse, konsekvens og godkendelse. Ingen tavs ændring af kalorier eller belastning. “Jeg har kun 20 minutter” og “Jeg er et andet sted” skal kunne løses fra dagens aktivitet, ikke gennem hele onboarding.

Profil har separat redigering af Træningssteder/udstyr, Ugedage/pas, Cardio, Kost/måltider, Konto/sikkerhed, Køb, Hjælp og Data. Gemmesvar opdaterer alle berørte skærme. Kundens kontoside må ikke ligne et testadminpanel; testværktøjer ligger under en afgrænset sektion og findes aldrig for produktionskunder.

Support viser faktisk kontaktvej, relevante hjælpesvar og en gemt henvendelse med sagsnummer. Lov ikke øjeblikkelig coaching. Transaktions- og markedsføringsmails holdes adskilt. Frivillige påmindelser har fravalg og må ikke udsendes til testdata eller fiktive adresser.

Dag 1 er kundens valgte startdato. Dag 100 er den sidste kalenderdag inklusive restitution; dag 101 viser opsummering og næste skridt uden ekstra betaling. Gem købsdato, start, slut, rettighed og opbevaringsfrister særskilt. Rejser, sommertid og tidszoner må ikke tælle en dag dobbelt. Ingen stiltiende løfte om livstidsadgang eller gratis forlængelse.

## 14. Datamodel, API og sikker migrering

Udvid eksisterende tabeller frem for at skabe konkurrerende systemer. Følgende begreber skal være repræsenteret:

`Location`: id, ejer, navn, home/gym/andet, konkret udstyr/belastninger.
`ScheduleSlot`: ugedag, tidspunkt valgfrit, aktivitetstype, minutter, locationId.
`PlanVersion`: profil-/policyversion, start/effektiv dato, revisionsnummer.
`Session`: stabilt id, programdag, planlagt dato, type, sted, indholdssnapshot, status.
`ExerciseLog`: session, faktisk øvelse, sæt, reps/sekunder, kg, enhedskonvention, revision.
`MealSlot`: dato, navn/tid, energiandel, tre muligheder, ét valg, spist/sprunget over, version.
`MealSelection`: opskriftversion, præcise ingrediensmængder, næringssnapshot, personlig portion/batch.
`Order/Entitlement`: kontobundet køb, betalingsreference/miljø, status, adgang og tilbagekaldelse.
`Policy/Review/Audit`: regler, kilder, godkender, tidspunkt og ændringsspor.

En gammel profil med `place=home` får en hjemmelokation med samme udstyr og ugedage. Nye lokationsvalg må ikke konvertere allerede loggede pas. Historisk styrkedag og faktisk udført dato skal kunne være forskellige efter flytning.

Genbrug `/api/platform/...` og `/api/plan/...`, hvor de passer. Dokumentér de faktiske endpoints, ikke illustrative navne som om de allerede findes. Hver skrivning kræver autentificering, autorisation, inputkontrol og relevante revisionsnumre.

Planændring: valider input → beregn preview uden skrivning → vis ændring → bekræft med forventet revision → transaktion → returnér de gemte versioner. Samtidig ændring giver konflikt, ikke tavs overskrivning. Relevante POST-kald har idempotens; GET må ikke nulstille eller regenerere brugerens valg.

Klient og server bruger samme beregningskode/policyversion; serveren er autoritativ. Ingen generativ AI i adgangskontrol, kaloriematematik, allergifiltre eller betalingsbeslutninger. Kundens data/cache er brugerafgrænset og rydder ved logout; offlinekladden er ikke en adgangsbillet.

Brug sikre cookies, CSRF/origin-kontrol, rate limiting, parameteriseret SQL og begrænset adminadgang. Beskyt filer/videoer som data. Redigér eller migrér aldrig rigtige kundeoplysninger for at afprøve en test. Gem ingen secrets, helbredsdata eller loginlinks i almindelige logs/analytics.

## 15. Administration, fortrydelse og drift

Admin skal kunne vedligeholde lokations-/udstyrstyper, styrkeskabeloner, cardio, øvelsesalternativer, opskrifter, billeder/video, portionsregler og ernæringspolicies. Brug kladde/gennemgang/publiceret med version. En admincheckbox er ikke i sig selv faglig godkendelse.

Vis kunder, ordrer, adgang, support, mailfejl og refunderinger med mindste nødvendige data. Testordrer må ikke tælle som omsætning. Udførte handlinger auditeres; admin-MFA og sikker første ejerinvitation. Ingen automatisk adminrolle til første tilmeldte.

Byg “Fortryd aftale” → identificér ordre → “Bekræft fortrydelse” → gem indhold/tidspunkt → kvittering. Gør funktionen fremtrædende og tilgængelig i fristen, også hvis kunden ikke kan logge ind; undgå at afsløre andres ordredata. Skeln mellem modtaget fortrydelse og gennemført tilbagebetaling. Den må ikke kun være et skjult supportlink. Kontrollér gennemførelsen mod § 20 a og gældende regler (K7).

Færdiggør sælgernavn, CVR, adresse, support, pris/moms, adgangsperiode, leveringsvilkår, fortrydelse og klagevejledning med faktiske oplysninger og aktuel juridisk gennemgang. Afklar digital tjeneste/indhold; ingen generel afkrydsning, der vilkårligt fjerner rettigheder.

Dokumentér GDPR-behandlingsgrundlag, dataminimering, eventuelle særlige kategorier, databehandleraftaler, overførsler, slettefrister og risikovurdering. Kostpræferencer må ikke omsættes til antagelser om religion. Behandlingsgrundlaget skal vurderes konkret (K8). Ingen tvungen samtykkeblanding med markedsføring. Egen eksport/sletning og nødvendig særskilt ordreopbevaring skal fungere.

Hold app og database hensigtsmæssigt placeret, men flyt ikke produktionsdata uden godkendt migrations-/backupplan. Tilføj overvågning af login, ordrelevering, kø, planfejl og lagring. Implementér backup og afprøvet restore, med dokumenteret datatabsvindue og gendannelsestid. Bevar brugbare betalings- og mailgenforsøg efter genstart.

## 16. Obligatoriske accepttests — automatisk og i deployet browser

Hver test får faktisk resultat og evidens. “Implementeret” og “lokalt bestået” er ikke “verificeret i deployment”. Brug isolerede testprofiler; ændr ikke ejerens udfyldte testkonto uden accept.

| ID | Test | Bestået når |
|---|---|---|
| A01 | Åbn forside på 390 px | Login er synligt; pris og køb er entydige; ingen demo-link. |
| A02 | Alle købsknapper | Samme checkout; aldrig en ny salgsside eller beta. |
| A03 | Ny konto → Stripe-testkøb → verifikation → opsætning | Én konto/ordre; korrekt adgang og bevaret session; ingen gentagen e-mailindtastning. |
| A04 | Afbrudt betaling og dobbeltklik | Købet kan genoptages; ingen dobbelt opkrævning eller ordredublet. |
| A05 | Forkert beløb, valuta, miljø, pris, signatur, bruger-ID | Afvises uden adgang eller datalæk. |
| A06 | Gentagne/samtidige webhooks, refund før forsinket paid | Én konsistent ordre; tilbagekaldt adgang genåbnes ikke fejlagtigt. |
| A07 | Verifikations-/resetmail, udløb og genbrug | Faktisk mailmodtagelse testet; udløb/genbrug håndteres; eksisterende konti bevares. |
| A08 | Konto uden køb, bruger A mod bruger B, almindelig mod admin | Alle beskyttede læsninger/skrivninger afvises korrekt. |
| T01 | Hjemmeprofil med vægtstang/rack | Udstyret accepteres; planen matcher; intet blanketforbud mod homegym. |
| T02 | Hybrid-referenceugen i afsnit 7 | Hver dag har korrekt sted, varighed og lokationens udstyr. |
| T03 | Skift kun onsdag til 20 min på anden lokation | Kun aftalt omfang ændres; øvelser/volumen tilpasses; historik bevares. |
| T04 | 0/1/2/3/4/5/6 styrkepas og niveauer | Gyldige profiler får reelle skabeloner; uegnede kombinationer forklares. |
| T05 | Valgte dage i træk, inklusive søndag/mandag | Motoren prøver egnet fordeling eller giver konkret konflikt; ingen tavs flytning. |
| T06 | Flyt/bytte/udelad pas med eksisterende kladde | Ingen dubletter; session-ID og udførte øvelsesdata bevares. |
| T07 | Styrke+cardio, kun cardio, 0 cardio | Kalender, næste aktivitet og tællere er enige på alle skærme. |
| T08 | Offline sæt → luk → genåbn → online → anden enhed | Kladde bevares og synkroniseres; reel konflikt vises. |
| T09 | Timer i baggrunden og øvelsesbytte | Timer er korrekt; sæt bliver ved deres faktiske øvelse. |
| T10 | Fremtidigt pas og tom afslutning | Ingen utilsigtet gennemførelse eller opdigtet fremgang. |
| N01 | Ren matematik ved ligevægt 2400 | 2160/2040/1920/1800; sikkerhed vurderes separat. |
| N02 | Høj belastning, minimumsgrænse, uegnet profil, udløbet aggressiv periode | Blokeres også ved direkte API, ny dato og profilændring. |
| N03 | Aktivitet tælles allerede i ligevægt → cardio logges | Ingen dobbelt forbrænding eller automatisk kaloriekompensation. |
| M01 | 2/3/4/5/6 måltider | Dagsmålet er konstant; fordeling/portioner følger antallet. |
| M02 | Alle 3^N alternativer for seeded egnede profiler | Tre forskellige egnede retter; komplette standarddage består energi- og relevante næringskrav. |
| M03 | Vegetarisk + halal + fravalg/allergen | Alle valg, erstatninger og serverkald overholder filtrene. |
| M04 | Fjern → tom plads → fortryd/erstat | Mål uændret; plan- og indkøbstotaler følger faktisk valg. |
| M05 | Byttepanel lukkes uden bekræftelse | Ingen gemt ændring eller ændret indkøb. |
| M06 | Spist måltid og ændret dagsmål/antal | Historik låst; resterende ændring vises som preview eller konflikt. |
| M07 | Planlagt protein 160, minimum 102, spist 0 | Labels viser dette korrekt; systemet opfinder ikke proteinunderskud. |
| M08 | To personer, rester og portionsafrunding | Indkøb er korrekt; personlig energi fordobles ikke; ingen dobbelttælling. |
| M09 | Stramme filtre eller umulig portionsmængde | Forklaring, ikke dubletter, absurd portion eller forkert “alt opfyldt”. |
| M10 | Skift plan efter afkrydset indkøb | Nye/øgede behov kan ses; listen matcher datointervallet. |
| S01 | To sessioner bekræfter samme gamle planpreview | Versionskonflikt uden tab eller tavs overskrivning. |
| S02 | Restart/redeploy → login igen | Konti, valg, kladder, historik og ordrer er bevaret. |
| S03 | Dag 0/1/100/101, månedsskifte, skuddag, sommertid | Samme programdag overalt; korrekt start/slut; ingen ekstrabetaling. |
| S04 | Fortrydelse med udløbet login og refundering | Erklæring gemmes, kvitteres og behandles uden unødvendig adgangsbarriere. |
| S05 | Eksport/sletning og adminroller | Egne data korrekte; nødvendig ordreopbevaring adskilt; auditspor uden secrets. |
| U01 | 320/390/430/768/1440 px, zoom og tastatur | Ingen skjult tekst/handling, overlap eller vandret sideoverflow. |
| U02 | Tastatur, skærmlæser, fokus, Escape, kontrast | Centrale flows gennemføres uden mus og uden utilgængelige dialoger. |
| U03 | Fysisk iPhone/Safari og Android/Chrome | Login, checkout, onboarding, paslog, bytte og indkøb fungerer. Emulering mærkes separat. |
| O01 | Mailfejl, databasefejl og webhookretry | Ingen falsk succes eller tabt ordre; fejl kan genbehandles. |
| O02 | Restore til isoleret miljø | Ordre/adgang/plan/log sammenlignes; gendannelsesprocedure er bevist. |

Bevar regressionstests og tilføj kombinationstests på tværs af steder, niveau, dage, tid, kost og måltidsantal. Test også umulige kombinationer; målet er korrekt forklaring, ikke at acceptere alt.

Visuelle tests skal bruge samme profil, dato, valgte retter og viewport som referencen. Aflever før/efter for forside, checkout, login, opsætning, I dag, ugeplan, aktivt pas, madplan, byttepanel, indkøb, fremgang og profil. Screenshots skal være fra den deployede app, ikke den statiske designfil.

Mål performance på en dokumenteret profil: navigation skal reagere synligt straks; registrering må ikke genindlæse hele siden. Brug LCP ≤2,5 s, CLS ≤0,1 og INP ≤200 ms som mål, ikke opdigtede målte resultater. Før trafik findes, rapportér laboratorietest særskilt; senere feltmålinger er ikke samme evidens.

## 17. Hvornår er opgaven færdig?

Færdig betyder, at kunden kan købe, komme ind, vælge sin reelle hverdag, få sammenhængende planer, ændre dem og bevare sine data — i det aftalte design.

Alle obligatoriske tests skal have status. Ingen åbne kritiske fejl i betaling, adgang, beregning, allergifiltre eller datalagring. Ingen døde knapper, tomme løftefunktioner, offentlige testværktøjer, falske resultater eller “kommer snart” på solgte kernefunktioner.

Deploy den gennemtestede version med migrationskontrol og rollbackplan først i eksisterende testmiljø og derefter på eksisterende produktionsadresse. Kontrollér faktisk commit og browserresultat begge steder. Én kodeversion må ikke forveksles med ens data/adgang i to miljøer.

Eksterne blokeringer skal stå i `OWNER-ACTIONS.md`: præcis variabel/aktiv, miljø, formål, sikker placering, hvem der handler, og hvilken test den blokerer. Typisk Stripe-nøgler/pris/webhooks, verificeret mailafsender, virksomhedsoplysninger, faktisk indhold og faglig/juridisk review. Genbrug eksisterende konfiguration; opfind eller overskriv ikke secrets.

Manglende sådanne oplysninger stopper kun den berørte sluttest. Færdiggør resten. Sæt ikke godkendelsesflag til true for at skjule en blokering. “Teknisk testbar” er ikke “klar til betalende kunder”. Åbn ikke rigtige opkrævninger eller udsend lancering uden ejerens udtrykkelige godkendelse.

Aflever testlogin, produktionsadresse, commit, kravmatrix, testresultater, deployede screenshots, driftsvejledning og eventuelle konkrete ejerhandlinger. Bevar den eksisterende testkontos adgang. Rapportér kun handlinger, du faktisk har udført; arbejde fortsætter ikke i baggrunden uden en reel aktiv opgave.

**Begynd i det eksisterende projekt. Implementér denne specifikation; svar ikke med endnu en generel roadmap eller en ny prototype.**

---

## Kildegrundlag til implementeringen

Dette er en byggeinstruks med konkrete produktvalg, ikke en erklæring om, at eksisterende kost-/træningsregler er fagligt godkendte. Læs aktuelle primærkilder og dokumentér de anvendte versioner.

- Eksisterende kode: `helalsafi992/shaz-100-days`, især `lib/profile.ts` og `lib/nutrition.ts`, kontrolleret 8. oktober 2026. Design: den vedhæftede eksisterende SHAZ-designpakke; ingen nye påståede kundedata.
- K1: Stripe, fulfillment og fælles idempotent serverfunktion: https://docs.stripe.com/checkout/fulfillment.md?payment-ui=stripe-hosted
- K2: Better Auth, konti, e-mail/password og verifikation: https://better-auth.com/docs/1.6/authentication/email-password — brug dokumentationen for den installerede version.
- K3: W3C, WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- K4: Mifflin–St Jeor, oprindelig artikel: https://pubmed.ncbi.nlm.nih.gov/2305711/
- K5: NICE NG246, energiindtag og fagligt understøttede lavenergiforløb: https://www.nice.org.uk/guidance/ng246/chapter/Physical-activity-and-diet
- K6: DTU, fødevaredatabase: https://www.food.dtu.dk/om-foedevareinstituttet/faciliteter-og-infrastruktur/naeringsstofdatabase
- K7: Dansk lov nr. 723 af 20. juni 2025, herunder § 20 a om digital fortrydelsesfunktion: https://www.retsinformation.dk/eli/lta/2025/723/pdf — kontrollér også gældende konsolideret lov ved implementering.
- K8: Datatilsynet, behandlingsgrundlag: https://www.datatilsynet.dk/regler-og-vejledning/grundlaeggende-begreber/hvornaar-maa-du-behandle-personoplysninger

