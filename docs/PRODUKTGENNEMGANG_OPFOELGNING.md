# SHAZ — opfølgning på alle 22 punkter

Grundlag: ejerens vedhæftede `SHAZ_produktgennemgang_2026-10-09.md`, gennemlæst i sin helhed. Kildegennemgangen undersøger revision 1f25ff329a og skelner mellem browserobservationer, kodefund og ændringsforslag. Den er ikke klinisk validering. Denne fil er implementeringsstatus, ikke en påstand om at alle 22 krav er færdige eller alle tests allerede er bestået.

## P0 — sammenhæng og sikkerhed

| Nr. | Punkt fra analysen | Ændring i denne revision / udestående |
|---|---|---|
| 01 | Fælles sikkerhedskontrol | Ny fælles serverkontrol ved aktivering, samlet planændring og tilpasning via trainingChange. Intake indgår i fingerprint, kontrolleres igen under brugerens transaktionslås, og kan ikke fjernes fra indsendt profil for at opnå legacy-undtagelse. Identisk intake-save er no-op; delvis kladde gemmer ikke tidligere sikkerhedssvar væk. Separat regression tester direkte API, forældet preview og tilbagetrukket samtykke. Øvrige isolerede cardio-/kostændringer kræver fortsat en samlet audit. Det er fortsat eksisterende konservativ regelpolitik, ikke klinisk godkendelse. |
| 02 | AI-forslag til aktiv plan | **Ikke implementeret som anvendelse.** AI er stadig review-only. Brugerfladen siger nu direkte, at Bekræft ændringer ikke anvender AI-forslaget. En reel diff/accept/aktiv-plan-transaktion med alle katalog-/sikkerhedsregler er fortsat en åben opgave. |
| 03 | Manglende profilversion | Serverkomponenten sender nu faktisk profile.version. Relevante svarændringer rydder UI-preview/AI-forslag, og gamle async svar afvises. Regression kontrollerer en profil med version større end 1. |
| 04 | Hvert svar har en funktion | Søvn, pause, fokusområder, budget, variation og batchønsker fjernes fra den indledende synlige spørgerunde, fordi deres effekt på den aktive plan ikke er dokumenteret. Gamle svar slettes ikke. Uindsamlede standarder sendes ikke længere til AI som brugerpræferencer. Feltkontrakten nedenfor angiver begrænsninger, især at målbart mål ikke automatisk optimerer træningen. |

## P1 — onboarding

| Nr. | Punkt | Ændring / udestående |
|---|---|---|
| 05 | Fem områder, mindre kompleksitet | Bevarer Dit mål / Din uge / Dine hensyn / Din mad / Din plan. Færre basisvalg, konkret mål er valgfrit, avancerede præferencer og AI ligger sekundært. Helbred vises som tre klart beskrevne grupper; Ja/usikker åbner de samme underliggende spørgsmål. Ingen ubesvarede felter bliver til Nej. Samtykker er fortsat synlige. |
| 06 | Mål og enheder | Vægt/øvelsesvægt: kg eller lbs. Løb: km eller miles. Aktuelt niveau, ønsket niveau, konkret øvelse og reps ved styrke. SI-værdier gemmes; skift af visningsenhed ændrer ikke målet. Dansk decimal-komma understøttes. Langsigtede mål er mærket; sports-specifik programmering og særskilte 100-dages milepæle er ikke færdige. |
| 07 | Ingen umulige aktive valg | Styrkevælger viser 0–4. Serverens eksisterende afvisning af 5–6 er bevaret; der opfindes ikke skabeloner. |
| 08 | Udstyr og hybriduge | Bevarer pr-sted udstyr og pr-dag tid. Tilføjer aktivt valgte udgangspunktspakker: kropsvægt, håndvægte/elastik, fitnesscenter. Kunden skal kontrollere listen. Stedsnavn er valgfri detalje; ubrugt maksimal-belastning-spørgsmål fjernet, gamle data bevaret. |
| 09 | Faktisk ugeopsummering | Viser hver dag, lokation og sessionstid samt separat kondition og samlet tidsforbrug. Ikke p.days gange en global p.minutes. |
| 10 | Allergi vs smag | Adskilte visninger: allergener/intolerancer og søgbare råvarefravalg. Eksisterende fravalg bevares, og begge respekteres ved bytte. Den underliggende avoid-liste er fortsat fælles og konservativ; dette er ikke en fuld klinisk allergimodel. |

## P1 — brugen af produktet

| Nr. | Punkt | Ændring / udestående |
|---|---|---|
| 11 | Øvelsesinstruktion og medier | Eksisterende logning, pauser og instruktioner bevares. Nye gennemgåede videoer er **ikke leveret**. Manglende originale medier/faglig gennemgang er stadig lanceringskrav. |
| 12 | Erstatningens formål | Uændret ud over fælles sikkerhedskontrol ved samlet planændring. Tilsvarende/lettere/smerterelateret erstatning kræver fortsat katalogmetadata og faglige regler. |
| 13 | Praktiske portionsmængder | Eksisterende beregnings-/afrundingspolitik bevares. Nye dokumenterede æg/stk, mælk/ml og pakningsomregninger er ikke implementeret her. |
| 14 | Dagens madrytme | Navne/tider og eksisterende batchfunktion bevares. Budget/variation/batch spørges ikke længere som om deres svar påvirkede automatisk plan. Differentieret energi pr. måltid er stadig åben. |
| 15 | Virkelige madbilleder | Ikke løst. Ingen misvisende nye billeder eller påstand om prøvelavede opskrifter. |
| 16 | Dagens handlingsside | Eksisterende kompakte dashboard og hviledagsbesked bevares. Ingen totalombygning i denne revision. |
| 17 | Check-in med beslutning | Eksisterende check-in bevares. Målrelevant feedback og rapportering af nye gener uden fuld onboarding er stadig åben. |
| 18 | Aktiv profil først | Ikke ombygget her. Onboardingens indledning skelner nu klart mellem kladdesvar og den aktive plan. Samlet aktivt profilresume kræver fortsat arbejde. |
| 19 | Retur efter login | Password-login bevarer valideret intern /app- eller /onboarding-destination. Eksterne, protokolrelative, kontroltegn og kodede omveje afvises. Eksisterende checkout/MFA/magic-link-flow bevares; ny browsertest verificerer password-dyblink. |
| 20 | AI i kundesprog | Katalognavne erstatter selectedId. Kilder ligger under forklaring med titel og år, kun fra validerede brugte PMIDs. Preview-only-forholdet er eksplicit. |

## P2 — kvalitet

| Nr. | Punkt | Ændring / udestående |
|---|---|---|
| 21 | Designsammenhæng | Bevarer identitet. Mål og dets felter samles i samme kort, health-grupper er enkeltkolonne, detaljer åbnes efter behov. Nye browsertests ved 320, 390 og 1440 supplerer eksisterende suite. Fysisk Safari og reel brugertest er ikke erstattet af Chromium-tests. |
| 22 | Resultater og gennemførelse | Ikke målt med rigtige kunder. Den nye automatiserede novice-test er en teknisk test med fiktiv profil, ikke en 18-årigs brugerinterview eller et pilotresultat. |

## Feltkontrakt: hvad svarene faktisk gør

- Primært mål og erfaring: eksisterende programkategori, niveau, kostmål og ekstra AI-kontekst. 'Styrke' og 'muskelopbygning' deler stadig dele af motoren; ikke individuelt optimeret styrkeperiodisering.
- Målbare tal: et tydeligt registreret succeskriterium og AI-kontekst, ikke et løfte om at træningsmotoren når tallet. Enheder er visning; kanoniske kg/km anvendes internt.
- Sted, bekræftet udstyr, dage, tid: bestemmer den faktiske programgenerering og hvad der kan byttes til.
- Kondition/anden sport: kalender og eksisterende belastningskontrol.
- Dine hensyn: serverens konservative routing før ny aktivering/planændring, ikke diagnose eller automatisk genoptræning.
- Kosttype, halal, allergen-/råvareudelukkelser: reelle filtre i madgenerator og byttefunktioner.
- Måltidsantal og madlavningstid: antal slots/portionsfordeling og opskriftsfilter.
- Valg af kalorieberegning og nødvendige data: eksisterende energiberegning og sikkerhedsbegrænsninger. Portionsvalg kræver ikke disse kropsdata.
- Startdato og bekræftelse: aktiverer præcis eksisterende 100-dages forløb. Historik og igangværende pas overskrives ikke ved senere samlet ændring.

## Dokumentation og afgrænsning

Kørsel: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:integration`, `node --import tsx scripts/intake-regression.mts`. Resultater knyttes til den præcise commit i GitHub Actions; denne tekst tæller ikke som testbevis. Nye screenshots ligger i `test-artifacts/clear-*.png`, når den konkrete browserkørsel har gennemført.

Enhedskonstanter: NIST SP 811 Appendix B.8, international lb=0.45359237 kg og international mile=1.609344 km. Bevar eksakt intern værdi og afrund kun visningen. Egen symptomgruppering er ikke PAR-Q+ eller et valideret screeninginstrument.

Produktion, rigtige betalinger, AI-releaseflag og databehandlingsgodkendelser ændres ikke af denne revision.
