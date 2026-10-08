# Verifikation på Railway

## Miljøer

- Produktion: https://shaz-production.up.railway.app/
- Isoleret testlogin: https://shaz-test-staging.up.railway.app/login
- Personlig testkonto: `test@shaz.example`. Adgangskoden udleveres kun gennem den private eksisterende loginfil, aldrig i repository eller logs.
- Samme app og kundeområde i begge miljøer. Separate PostgreSQL-databaser; ingen produktionsdata flyttet til test.
- Produktion tager ikke imod opkrævninger. Ingen real-money-test er gennemført.

## Første masterdeployment verificeret 8.–9. oktober 2026

Commit `11d8ade2bf70b993cfc95dafa133aa692cfc5fa5`:

- Railway produktion `db4a1a2d-cc7d-4e39-bcd9-098dbd38fad6`: SUCCESS.
- Railway test `f03a575d-8083-410e-ba7a-4eb22e44a309`: SUCCESS; `/api/health` svarede HTTP 200 med committen.
- Ny password-session: login HTTP 200, `/api/platform/state` HTTP 200, `/api/plan/state` HTTP 200. Forløbet har 100 dage, startdato 2026-10-08 og syv eksisterende gemte maddage. Logout af denne session gav afvist adgang efterfølgende.
- Faktisk cloud-browser: eksisterende indlogget ejersession åbnede det nye dashboard, madplan og træning. Profilen blev ikke nulstillet eller ændret. Måltidsvalg B blev kun forhåndsvist og annulleret; refresh bevarede oprindeligt valg og total.
- Offentlig forside og `/checkout` genindlæst efter deployment: ny overskrift, synligt login, korrekt 399 kr. engangspris, ingen demo-destination. Betaling er tydeligt lukket.

## Evidensgrænser

De deployede skærmbilleder i `docs/evidence` er desktop fra faktisk indlogget Railway-app. Filer mærket `local-mobile` er emuleret mobil i Chromium mod den lokalt byggede app med isoleret database; de er ikke fysisk iPhone/Android eller en deployet mobil-browser.

Den friske password-session ovenfor er testet gennem den almindelige HTTP-authentificering; browserkontrollen brugte den eksisterende autoriserede session. Disse er to forskellige observationer, ikke påstand om en ny browser-loginindtastning i Railway.

MFA og batch-/restefunktionerne tilføjes efter den første masterdeployment. Deres slutcommit/deployment kontrolleres særskilt ved aflevering; denne første verifikation er ikke i sig selv bevis for de efterfølgende ændringer.

Se `MASTER-ACCEPTANCE.md` for alle 41 krav med faktisk status og `master-test-results.json` for den fulde lokale kørsel. Ikke alle 41 er bestået. Stripe-testkøb, faktisk mailmodtagelse, faglig/juridisk godkendelse, fuld enhedstest og de dokumenterede udviklingshuller mangler fortsat.
