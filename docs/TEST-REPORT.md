# Verificeret testleverance — 8. oktober 2026

11 domænegrupper og 24 integrationsgrupper består. `npm run typecheck`, `npm test`, `npm run build` og `npm run test:integration` er kørt. Maskinlæsbare resultater: [integrated-test-results.json](integrated-test-results.json).

| Accepttest | Resultat og konkret afprøvning |
| --- | --- |
| A | Almindelig Better Auth-konto på isoleret Railway-staging; API-login og100programdage verificeret. Lokal faktisk browser tester password-login og hele det samme kundeområde. |
| B | 2400→2160/2040/1920/1800; server afviser alder, graviditet, medicinske behov, spiseforstyrrelsesproblematik, lav vægt, for lavt indtag, for stort underskud og høj belastning. Aggressiv periode og reglernes version indgår. |
| C | Preview+confirm skifter2/3/4/5/6måltider uden utilsigtet ændring af mål. Kostendpoint kan ikke ændre træningsdage. |
| D | Tre forskellige forslag pr. understøttet plads; kun valgtret medregnes. Stramme filtre viser en konkret begrænsning. |
| E | Byt, portion, fjern, tomplads og fortryd afprøvet mod database og i mobilbrowser. Indkøbsgram/energi/protein følger valget. Spist historik låses og bevares ved ny fordeling. |
| F | 9.801 komplette kombinationer fra3kostprofiler ×5måltidsantal ×3energiniveauer samt alle3^Nvalg. Automatisk energi indenfor5 % og ingrediensberegnede makroer. |
| G | Kostudelukkelser kontrolleres i generator og serverbytte; vegetar afviser fisk/kylling. Ingen filterbrud for at opnå tre retter. |
| H | 12styrkevarianter, udstyr/niveau/fravalg,cardiodage og alternativer, restitutionskontrol, ingen kaloriekompensation. Forkert samlet belastning afvises. |
| I | Serverkladde med revision; konflikt409. Øvelsesbytte bevarer sæt. Faktisk mobilbrowser: offlineændring→luk→online→refresh→gem→bytte→refresh; reps13bevaret. |
| J | Mobil password-login→kostændring→logout→nyt browsercontext→login; gemteplaner identiske. Appprocesgenstart bevarer konti, ordrer, session og logs. |
| K | Chromium390×844 med touch-emulering og1440desktop; ingen vandret overflow eller klientundtagelser. Formularer, inputfokus, Tab/Escape/dialogfokus, måltidsvalg, navigation og træningseditor afprøvet. Ikke en fysisk iPhone/Safari-test. |
| L | Konto udenkøb afvises; CSRF, andre kunde-ID'er, adminrolle, forkerttestprojekt/origin/liveflag afvises. Ingen klientsideadgangsbypass. |
| M | Aktiveringsdato styrer dag1;100dage og CopenhagenDST; dag101viser opsummering og afviser writes. Ingen automatisk abonnementsbetaling. |

Derudover: password-signup/e-mailbekræftelse/reset og tilbagekaldte sessioner; bevarede magic links; signeret Stripe- og Resend-kontrakt/idempotens; refund/dispute-adgang; admininvitation og versionsgodkendelse; fysisk restore af isoleretPostgreSQL; dataeksport og slettecascade.

## Afgrænsning

Automatiske mobilbilleder kommer fra en lokalt kørt production-build med fiktive konti. Supplerende cloud-browserbilleder kommer fra faktisk almindeligt password-login på Railway-staging. De to testmiljøer er angivet særskilt. Testbetalinger og mails er signerede/opsamlede fixtures, ikke faktisk StripeCheckout eller inboxlevering. Lokal backuprestore er ikke Railway-produktionsrestore. Faglige regler er endnu review; alle mikronæringsstoffer er ikke valideret. Se [LAUNCH.md](LAUNCH.md) og [NUTRITION-POLICY.md](NUTRITION-POLICY.md).

Reproducer: `npm ci && npm run typecheck && npm test && npm run build && npm run test:integration`. Scriptet opretter sin egen database og fiktive konti; ingen Railway-kundedata ændres.

## Offentlig Railway-verifikation

[railway-verification.json](railway-verification.json) dokumenterer den konkrete deployede featureversion: ordinary password-login, anonym afvisning,100dage/38opskrifter, alle beskyttede siderHTTP200, allefire2400kcal-eksempler, mindreårig afvist, logout401og identiske madplaner efter nyt login. Testprofilens faktiske mål2635kcal blev bevaret ved2–6måltider; planerne beregnede2628–2638kcal med tre muligheder pr.plads. Profilen blev ikke ændret.

En efterfølgende performanceændring samler katalogseed og ugens madplan i få databasekald; de23integrationsgrupper er kørt igen og består. Den ændrer ikke opskrifter, kalorier eller gemte valg.


## Samlet kundeoplevelse – supplerende test
- Almindeligt e-mail/password-login er manuelt verificeret i den offentligt deployede Railway-stagingbrowser, inklusive synligt personligt dashboard og madplan. Screenshot fra faktisk cloud-browser er afleveret særskilt.
- Den deployede madplan er byttet fra Kikærtegryde (661 kcal) til Kikærtesalat (662 kcal); dagens beregnede total ændrede sig fra 2638 til 2639 kcal og protein fra 160 til 157 g. Målet forblev 2635 kcal.
- Nye isolerede betalingskontrakttests beviser genbrug efter tvetydig netværksfejl, genoptagelse af samme session, serverejerskab, afvisning af forfalsket konto-ID, ændret billing-email uden overdragelse og webhook-idempotens. Der er ikke foretaget et rigtigt Stripe-testkøb.
- Samlet kalender klassificerer en dag med cardio som cardio, ikke ren hvile, og tæller gennemført styrke/cardio særskilt.
- Aktivering kræver nu en udtrykkelig startbekræftelse.
- Cloud-browseren er verificeret på desktop. De automatiske 390×844-touchtests er på den lokale identiske production-build, ikke en fysisk telefon.
