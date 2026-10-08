# SHAZ master — acceptkontrol

Denne rapport erstatter ikke masterkravene. Status er **ikke samlet 41/41 bestået**. Lokale tests er ikke bevis for et gennemført Stripe-testkøb, faktisk mailmodtagelse eller fysiske telefoner. Produktionsbetaling forbliver lukket.

## Reproducerbar evidens

- `npm run typecheck`, `npm test`, `npm run build`, `npm run test:integration`.
- `tests/domain.test.ts`, `tests/master.test.ts`, `tests/activity.test.ts`: 18 testgrupper; herunder 9.801 måltidskombinationer, indkøbsgrupper og batchallokering.
- `scripts/integration.mts`: isoleret PostgreSQL/PGlite, almindelig Better Auth, serverejerskab, signerede betalingsfixtures, samtidige ændringer, fysisk database-snapshot/restore, appgenstart og Chromium-browser.
- Browserbredder: 320, 390, 430, 768 og 1440 CSS-px. Mobil er emuleret Chromium, ikke fysisk Safari/Android.
- `docs/master-test-results.json`: tidsstemplet maskinresultat fra seneste fulde kørsel.
- Railway-commit og deployet browserkontrol dokumenteres særskilt i `docs/MASTER-DEPLOYMENT.md`.
- Ejerens eksisterende testprofil er ikke nulstillet eller ændret af accepttestene. Alle muterende automatiske tests bruger kortlivede isolerede profiler.

## 41 testpunkter

“Lokalt bestået” gælder alene den beskrevne evidens. “Delvis” og “blokeret” tæller ikke som en fuldt bestået accepttest.

| ID | Kode / evidens | Faktisk resultat før ekstern slutkontrol |
|---|---|---|
| A01 | `app/page.tsx`, browserruter | Lokale bredder består uden sideoverflow. Offentligt anonymt login kontrolleres også i deployment. Salg er tydeligt lukket. |
| A02 | `Buy`, `/checkout`, redirecttests | Én checkout; `/demo` og `/preview` går til `/`. Aktive salgslinks kræver serverens releasekontrol. |
| A03 | Better Auth, checkoutbinding, signerede fixtures | Delvis: den lokale sammenhæng består. Rigtigt Stripe-testkøb og indbakke er blokeret af manglende opsætning. |
| A04 | `createCheckout`, integration | Lokalt bestået: afbrudt svar/genforsøg genbruger samme idempotensnøgle og ordre. Stripe-netværket ikke afprøvet. |
| A05 | `validatePaidSession`, webhook, integration | Lokalt bestået: beløb, valuta, pris, miljø, signatur, reference og konto kontrolleres. |
| A06 | `shaz_payment_state`, integration | Lokalt bestået: samtidige hændelser og refund før paid efterlader én refunderet ordre uden genåbnet adgang. |
| A07 | Better Auth og mailkø | Delvis: verifikation/reset/engangslinks og gamle konti testet lokalt. Faktisk modtagelse mangler. |
| A08 | `access`, ejerskab, admin, origin | Lokalt bestået: konto uden køb, ubekræftet konto, uvedkommende bruger og ikke-admin afvises. |
| T01 | profil/lokationer, `master.test.ts` | Lokalt bestået: vægtstang og rack hjemme accepteres; intet homegym-forbud. |
| T02 | `sessionProfile`, generator, mastertest | Lokalt bestået: mandag/fredag center 45 min., onsdag hjemme 25 min., søndag let cykling 30 min. med passende erfaring. |
| T03 | `trainingChange`, integration | Lokalt bestået: én fremtidig session ændres til 20 minutter/anden lokation med færre øvelser; øvrige sessioner uændrede. |
| T04 | profilvalidering, skabelonkatalog | 0–4 pas og alle niveauer/varigheder afprøvet. 5–6 afvises med konkret forklaring, indtil gennemgåede højfrekvensskabeloner findes. Ikke frigivet som understøttet program. |
| T05 | over-/underkropsfordeling, mastertest | Lokalt bestået: valgte dage i træk og søndag/mandag respekteres uden tavs flytning. Faglig godkendelse af splitregler mangler. |
| T06 | session-ID, swap/restore, integration | Delvis: øvelsesbytte og historik bevares; alle kombinationer af flyt/bytte med kladde er endnu ikke browserafprøvet. |
| T07 | fælles `activityForDate` / `activityCounts` | Lokalt bestået: cardio er ikke hvile; styrke og cardio tælles separat; anden sport vises særskilt. |
| T08 | `useWorkoutDraft`, `saveDraft`, integration | Lokalt bestået: offline → luk → refresh → online; serverrevisioner afviser konflikt. Fysisk anden telefon mangler. |
| T09 | absolut timer-sluttid, arkiverede øvelser | Delvis: timer og sets lagres; øvelsesskift bevarer faktisk øvelse. Baggrundsforløb på fysiske enheder mangler. |
| T10 | workout-API, integration | Lokalt bestået: tom afslutning og fremtidig gennemførelse afvises. |
| N01 | `targetFromMaintenance`, domænetest | Lokalt bestået: 2400 → 2160 / 2040 / 1920 / 1800. |
| N02 | `estimate`, serverguard, integration | Lokalt bestået for testpolitikken: uegnede profiler og udløbet aggressiv periode afvises. Faglig godkendelse mangler. |
| N03 | aktivitetsmodel, cardiologtest | Lokalt bestået: cardio-log ændrer ikke energimål eller tilføjer forbrænding. |
| M01 | `makeMealDay`, preview/confirm | Lokalt bestået: 2–6 måltider omfordeler samme dagsmål. |
| M02 | 9.801 kombinationer | Delvis: testprofilernes energi/protein/fedt/fibre består. Mikronæringsstoffer er ukendte og ikke godkendt som fuld tilstrækkelighed. |
| M03 | `suitable`, master- og API-tests | Lokalt bestået: vegetarisk + halal + fravalg; serveren afviser uegnede retter. |
| M04 | `editMeal`, integration/browser | Lokalt bestået: fjern, tom plads, fortryd, portioner, totaler og indkøb. Målet sænkes ikke. |
| M05 | eksplicit byttebekræftelse, browser | Lokalt testet: valg B efterfulgt af Escape må ikke ændre gemte måltider. GET opretter ikke madplaner. |
| M06 | låste slots, versionsbundet ernæringspreview | Lokalt bestået: spiste snapshots bevares; stale preview giver konflikt. |
| M07 | separate labels i `FoodPlanner` | Implementeret: planlagt/minimum/spist er adskilt; planlagt protein over minimum er ikke fejl. Numerisk specifik 160/102/0-browserfixture mangler. |
| M08 | `householdSize`, `mealShopping`, `mealBatch`, mastertest | Delvis: to personer fordobler indkøb, ikke personlig energi. To sammenkædede måltider tilberedes én gang og indkøbes på madlavningsdatoen. Preview er versionsbundet, spist historik låses; fremtidige rester kan frigøres uden at omskrive historik. Ingrediensspecifik afrunding og fuld batch-browseraccept mangler. |
| M09 | opskriftsfiltre/portionsgrænser | Delvis: utilstrækkelige muligheder og totalafvigelse vises; ingen dubletter/allergibrud. Ingrediensspecifikke portions- og stykgrænser mangler gennemgang. |
| M10 | indkøbsinterval, varegrupper og `checked_grams` | Implementeret: 1–14 dage, grupperede varer og øget behov ophæver visuel afkrydsning. Gram/kg omregnes præcist, ikke via antagede styk-/ml-vægte. Interval- og merbehovsflow mangler fuld browseraccepttest. |
| S01 | fingerprint + række-/profilversion | Lokalt bestået: to samtidige bekræftelser giver 200 og 409; ændret input afviser gammelt preview. |
| S02 | appgenstart + databasepersistens | Lokalt bestået: konti, sessions, planer, ordrer og logs bevares. Deploymentkontrol rapporteres særskilt. |
| S03 | Copenhagen kalender, mastertest | Lokalt bestået: 0/1/100/101, måned/årsskifte, skuddag og sommertid; 101 afviser nye registreringer. |
| S04 | `/withdraw`, databasekvittering, admin | Delvis: uden login gemmes fortrydelse idempotent med tidspunkt/sagsnr.; Stripe-refundering og faktisk mail kræver eksterne nøgler. |
| S05 | eksport/sletning/admin, Better Auth MFA, integration | Lokalt bestået for implementerede flows: egne data og separat ordreopbevaring; MFA-enrollment, forkerte koder, engangs-gendannelse, sessionsbinding og 30-minutters udløb af admin-godkendelse. E-maillink omgår ikke admin-MFA. Almindelige kundesessions bevares. Fysisk authenticator-enrollment hos ejer ikke udført. |
| U01 | fem Chromium-bredder | Delvis: ingen sideoverflow/clientfejl i de afprøvede ruter. 200 % zoom og alle soft-keyboardtilfælde ikke fuldt afprøvet. |
| U02 | `DialogAccessibility`, browser | Delvis: fokus, Tab og Escape afprøvet; ingen fuld skærmlæser-/WCAG AA-audit. |
| U03 | fysisk iPhone og Android | Blokeret: ingen fysiske enheder stillet til rådighed. Emulering erstatter ikke testen. |
| O01 | mailworker, webhookidempotens, leveringsstatus | Delvis: fixture-genforsøg/webhooks afprøvet. Rigtig udbyderfejl, alarmering og samlet DB-outageøvelse mangler. |
| O02 | faktisk isoleret PostgreSQL-snapshot/restore | Lokalt bestået: ordre/adgang/profil/plan/log sammenlignes. Produktionsbackup, RPO/RTO og Railway-restore er ikke verificeret. |

## Kendte implementeringshuller

Sygdoms-/rejseperiode med genstartsvalg, ingrediensspecifikke portioneringsregler, komplet mikronærings-/ugevariationskontrol og alle før/efter-skærmbilleder er ikke færdige. Disse er udviklingsopgaver, ikke noget der skyldes manglende Stripe-nøgler. Batch/rester er implementeret til madlavning og næste dag, ikke automatisk optimeret meal-prep for hele uger.

Opskriftsillustrationerne er ikke færdige opskriftsfotos. Egne Shaz-videoer og brugsberettiget fotoindhold mangler. Regler/skabeloner er versionerede og står i review, ikke fagligt godkendt. Der er ingen påstand om fuld ernæringsmæssig tilstrækkelighed.
