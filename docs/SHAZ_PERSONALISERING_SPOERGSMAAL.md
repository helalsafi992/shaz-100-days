# SHAZ — spørgsmål til godkendelse før lancering
Version: shaz-questionnaire-review-v1 · 9. oktober 2026

**Status: til ejerens gennemgang.** Ingen nye kundespørgsmål aktiveres automatisk. Den eksisterende onboarding fungerer videre, mens AI er lukket bag separate serverflag.

## Grundprincipper
- Én sammenhængende onboarding efter køb og login, ikke et separat demo-forløb.
- **Først mål → træning → sikkerhed → kost → oversigt.**
- Kunden ser kun uddybende spørgsmål, når et tidligere svar gør dem relevante. Gem undervejs.
- Ingen diagnose- eller journaldetaljer som fritekst. Ingen CVR, CPR, medicinlister eller kliniske dokumenter.
- **Selvstyret træning og madplan for voksne.** Ingen automatisk genoptræning efter skade eller operation.
- Normal gennemgang har cirka 20 korte, direkte valg samt valg af ugedage/udstyr. Ved skader, kompleks kost eller kalorieestimering bliver der flere spørgsmål.

## A — Mål og udgangspunkt

**01. Hvad vil du først og fremmest opnå?** (obligatorisk, ét valg)
- Tabe fedt; bygge muskler; blive stærkere; få bedre kondition; blive bedre til min sport; holde den form jeg har.

**02. Hvad vil du prioritere?** (frivilligt, højst to)
- Hele kroppen; baller; ben; ryg; bryst; skuldre; core. *Dette er prioritering, ikke garanti om lokalt fedttab.*

**03. Har du et målbart mål inden for 100 dage?** (frivilligt)
- Nej; kropsvægt; vægt/reps i en bestemt øvelse; en løbedistance; antal sammenhængende træningsuger.
- **Kun ved ja:** nuværende niveau, ønsket niveau og ønsket tidshorisont. Enheden og om målet er realistisk vises. Fagligt uforsvarlige forventninger skal forklares, ikke loves.

**04. Hvordan vil du beskrive din styrketræningserfaring?**
- Helt ny; under 3 måneder; 3–12 måneder; over 1 år.

**05. Har du holdt længere pause fra træning for nylig?**
- Nej; mindre end 4 uger; 4 uger eller mere. *Anvendes til forsigtig opstart.*

## B — Træning og cardio

**06. Hvor vil du træne?**
- Hjemme; fitnesscenter; **begge**.

**07. Hvilket udstyr har du adgang til?** (vises én gang pr. valgt sted)
- Kun kropsvægt; måtte/stol; elastikker; håndvægte; kettlebell; bænk; pull-up-stang; vægtstang; rack; kabel; maskiner.
- **Hjemme og center gemmes separat.** Homegym må have rack/vægtstang.

**08. Hvor mange styrkepas vil du træne om ugen?**
- 0; 1; 2; 3; 4. *Flere end fire vises ikke som et automatisk standardprogram før passende skabeloner er godkendt.*

**09. Hvilke dage kan du træne styrke?** (ved 1–4 pas)
- Mandag, tirsdag, onsdag, torsdag, fredag, lørdag, søndag. Antallet skal stemme med forrige svar.

**10. Hvor og hvor længe træner du på hver valgt dag?** (ved mindst ét pas)
- Sted: hjemme/fitness efter 06. Tid inklusive opvarmning: 20, 25, 30, 40, 45, 55, 60 eller 75 minutter.
- Eksempel: mandag fitness 45 min, onsdag hjemme 25 min, fredag fitness 60 min.

**11. Vil du have cardio ud over styrketræningen?**
- 0, 1, 2, 3, 4 eller flere relevante pas. Hvis 0, spring over cardiouddybning.

**12. Hvilken cardioform foretrækker du?** (hvis cardio er valgt)
- Gang; cykling; løb/gang; løb; crosstrainer; romaskine. Vis kun former, som udstyr og erfaring understøtter.

**13. Hvilke dage, varighed og intensitet passer?** (hvis cardio er valgt)
- Ugedage, 10–60 minutter pr. pas; let eller moderat. Planmotoren viser konflikt med hårde styrkedage og restitution.

**14. Dyrker du anden sport?** (frivilligt)
- Nej / ja. **Hvis ja:** sportsgren, ugedage, varighed, og om aktiviteten normalt er hård.

**15. Er der øvelser, du godt kan lide eller helst vil undgå?** (frivilligt)
- Vælg fra godkendt katalog. Skeln udtrykkeligt mellem **personlig præference** og **smerte/begrænsning**. Ingen fri AI-opfundne øvelser.

## C — Sikkerhed og begrænsninger

Sikkerhed kommer før AI. **Ja** eller **usikker** ved relevante advarselstegn fører til passende stop eller manuel/faglig vurdering; en LLM må ikke godkende personen.

**16. Har du lige nu alvorlige, pludselige eller uforklarede symptomer?**
- Ja / nej / usikker. Eksempler: brystsmerter, besvimelse, alvorlig åndenød, pludselig kraftnedsættelse.
- Ved akut alvorlig situation: søg akut hjælp, ring 112. Ingen automatisk plan.

**17. Har du uforklarede symptomer ved fysisk aktivitet?**
- Ja / nej / usikker. Eksempler: trykken for brystet, besvimelse eller usædvanlig åndenød.

**18. Har en læge eller fysioterapeut begrænset din træning?**
- Ja / nej / usikker.

**19. Har du en skade, operation eller vedvarende smerter, der påvirker træning?**
- Nej; tidligere, nu overstået; aktuelle gener; opereret / i genoptræning.

**20. Hvor sidder generne, og på hvilken side?** (kun ved 19 ≠ nej)
- Nakke, skulder, albue, håndled, ryg, hofte/lyske, knæ, ankel/fod, andet; venstre/højre/begge.

**21. Hvordan påvirker generne dig?** (kun ved 19 ≠ nej)
- Varighed, smerte 0–10, om det forværres, om hverdagsfunktion påvirkes, og om symptomerne er værre dagen efter belastning.

**22. Hvilke bevægelser eller aktiviteter provokerer generne?** (kun ved 19 ≠ nej)
- Squat/dybe knæbøjninger; hoftebøjning/hinge; pres; træk; arm over hovedet; løb; hop; andet.
- Har du fået konkrete restriktioner som *ingen hop, ingen løb, ingen tunge løft*?

**23. Er du blevet undersøgt eller er du i behandling/genoptræning?** (kun ved 19 ≠ nej)
- Nej; tidligere vurderet; aktuelt i forløb. **AI må ikke fortolke en operationsdiagnose som en tilladelse til bestemte øvelser.**

## D — Madplan

**24. Hvordan spiser du?**
- Ingen særlige præferencer; vegetarisk; **vegansk**; **pescetarisk**.

**25. Skal opskrifter være halal-egnede?**
- Ja / nej. Kombineres med eksempelvis vegetarisk. Ikke en påstand om produktcertificering.

**26. Har du fødevareallergier eller intolerancer?**
- Ingen; mælk, glutenholdige råvarer, æg, soja, nødder, jordnødder, fisk, andet.
- **Allergi og personlig fravalg er forskellige ting.** Alvorlig allergi kræver særskilt vurdering; opskriftsfiltre garanterer ikke mod krydskontaminering.

**27. Er der fødevarer, du ikke ønsker i din mad?** (frivilligt)
- Vælg fra ingrediensliste eller kategorier; fravalg skal respekteres ved alle tre alternativer.

**28. Hvor mange måltider vil du spise om dagen?**
- 2, 3, 4, 5 eller 6. Navne og tidspunkter kan tilpasses senere.

**29. Hvor lang tid må madlavning typisk tage?**
- Op til 15, 30 eller 60 minutter.

**30. Hvor varieret vil du spise?**
- Gerne de samme retter; en god blanding; så meget variation som muligt.

**31. Vil du lave mad til flere dage / personer?**
- Ja / nej. Antal personer (1–8) hvis relevant. Kun kundens *egen* portion tæller i kalorier.

**32. Hvilket madbudget passer bedst?** (frivilligt)
- Lavt; almindeligt; fleksibelt. Bruger estimater, ikke falske verificerede priser.

**33. Hvordan ønsker du at styre kosten?**
- Portionsvejledning uden kropsmål; beregnet kaloriemål.

**34. Beregnet kaloriemål: nødvendige data** (kun ved valgt kaloriemål)
- Alder, højde, vægt, beregningskategori, hverdagsaktivitet og træningsaktivitet. Vis metode, usikkerhed og separat databehandlingssamtykke.

**35. Hvis du ønsker fedttab, hvilket underskud foretrækker du?** (kun ved fedttab og beregnet kaloriemål)
- Moderat, meget, rigtig meget, aggressivt. **Serverens sikkerhedsregler har altid forrang**; aggressivt er aldrig standard og ikke automatisk tilgængeligt.

**36. Er der forhold, der gør individuel kostvurdering nødvendig?**
- Graviditet/nylig fødsel; medicinsk diæt; tidligere/alvorlige problemer med spisning eller kalorietælling; alvorlig allergi.
- Ja / nej / usikker for relevante felter. Svarene bruges til at begrænse automatiske planer, ikke til at diagnosticere.

## E — Afslutning

**37. Hvad gør det sværest at følge en plan?** (frivilligt, højst tre)
- Tid, uforudsigelige dage, træthed, motivation, madlavning, intet særligt.

**38. Hvornår ønsker du at begynde?**
- Dato. Vis en konkret opsummering af træningsdage, steder, varighed, cardio, madplan og eventuelle begrænsninger **før** aktivering.

**39. Må SHAZ bruge AI til en frivillig, supplerende vurdering?**
- Ja / nej. **Separat og frivilligt samtykke** med præcis information om leverandør, kategorier af data, retention og fravalg. Ingen markedsføringssamtykke kobles på.

## Regler fra svar til plan

1. Planmotoren opretter først en **regelbaseret** 100-dages styrke/cardio/rekreationsplan ud fra ugedage, udstyr pr. lokation, niveau og faktisk sessionstid.
2. Opskriftsmotoren opretter mad ud fra kosttype, halal, allergier/fravalg, tid, måltidsantal og **beregnede portioner**. Tre egnede muligheder pr. måltidsplads, hvor biblioteket understøtter det. Ingen usikre erstatninger for at nå tallet tre.
3. AI får kun dataminimerede mål/præferencer og **forhåndsgodkendte ID'er**. Den må rangere muligheder og skrive begrundelser, ikke opfinde kalorier eller træningsbelastning.
4. PubMed-opslag foretages server-side på faste generiske emner; returner kontrollerede PMID-links, kildeår og en begrænsningsnote. Abstracts er ikke klinisk clearance eller et komplet evidensreview.
5. **Aktuelle smerter, restriktioner, nylig operation eller relevante symptomer** kræver en separat vurderingsvej. Ingen automatisk rehabiliteringsprotokol eller medicinsk sikkerhedsgodkendelse fra modellen.
6. Kunden skal godkende alle foreslåede ændringer. **Allerede gennemførte træninger, spiste måltider og historik bevares.**
7. Hvis AI er nede, slukket eller fravalgt, fungerer den regelbaserede plan stadig.
8. Kosttype **vegansk og pescetarisk** skal virke i den *rigtige* madplan, ikke kun i AI-forslag.
9. Aktivér ikke spørgsmål eller AI for rigtige kunder før ejerens accept, faglig indholdskontrol og databeskyttelsesgodkendelse.

## API — eksisterende klargøring på funktionsgren

- GET/POST/DELETE `/api/ai/personalize`: autoriseret, krypteret, versionsstyret, servervalideret, foreløbig **kun forslag til gennemgang**.
- OpenAI Responses API: stramt JSON Schema, `store:false`, én forespørgsel pr. reelt nyt forslag; bruger/global rate limit; modelnavn og secrets kun i Railway.
- PubMed: NCBI ESearch/ESummary/EFetch, faste emner, valideret PMID/abstract, cache og pacing.
- Featureflags `AI_PERSONALIZATION_ENABLED`, `AI_QUESTIONS_APPROVED`, `AI_PRIVACY_APPROVED`, `AI_CONTENT_APPROVED` = false indtil godkendt.
- Modeløkonomi: sammenlign `gpt-5.4-mini` og `gpt-5.4` ved strukturerede forslag i evals, ikke ved anekdoter.
- Ingen API-nøgler i kode, logs eller denne rapport.
- Bemærk: `store:false` betyder ikke automatisk nul ekstern logretention.

### Ejerbeslutning der afventes

Godkend eller korrigér spørgsmål 01–39, særligt sikkerhedsscreeningen (16–23), kosttyper (24–27) og de fire underskudsniveauer (35). Først derefter kobles det nye spørgeskema ind i det offentlige onboardingflow.
