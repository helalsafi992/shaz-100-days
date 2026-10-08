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

## MFA og rester — verificeret deployment

Commit `f2da4be8d592d638b94189cc9b9f216e52083205`:

- Produktion `92fcf19b-a5d1-4fb9-ae6a-fc8910bbaad1`: SUCCESS.
- Test `47c6a79c-9881-4daa-ab88-98162ede1e7c`: SUCCESS; health HTTP 200 med commit.
- Frisk almindelig password-session: login 200, platform-state 200, plan-state 200. Admin-API kræver separat MFA (428 uden godkendelse). Logout afviser derefter beskyttet state (401).
- Faktisk indlogget Railway-browser: fælles madlavning viser portioner for to datoer, summerede ingredienser én gang og særskilt personlig energi. Forhåndsvisningen blev annulleret; ejerprofilen blev ikke ændret. Indkøb vises i varegrupper med rå/drænet vægtgrundlag. Screenshot `deployed-desktop-batch-preview-f2da4be.jpg`.
- Offentlig forside kontrolleret: synligt login, korrekt pris, eksisterende adresse og lukkede salgsfunktioner.

## Efterfølgende pauseleverance

Migration 009 er additiv. Ingen tabeller eller kundedata slettes ved deployment. Pause og rolig genstart bruger en separat kundeejet periode, serverkontrol og stabile pas-ID'er. Afslutning er stadig præcis dag 100. De 19 domænegrupper og 32 integrationstestgrupper består; de nye `local-mobile-pause`, `local-mobile-batch-preview` og `local-mobile-shopping-groups` er fra samme byggede app i den isolerede lokale browser. Railway-slutcommit og deployment-ID oplyses særskilt ved aflevering efter kontrollen.

## Drift og svartid

Testappens region er `europe-west4-drams3a`, mens testdatabasen er `us-west2`. Der er ikke foretaget flytning af database eller video-volumes. Railway HTTP-proxy viste under f2da-kontrollen blandt andet ca. 2,0 sekunder for platform-state og 5,3 sekunder for den serverrenderede madside; dette er ikke en Core Web Vitals-måling. Pauseleverancen samler flere uafhængige dashboardlæsninger parallelt. En egentlig flytning kræver en konkret migrations-/backupplan; målet om produktionsperformance er ikke dokumenteret bestået.

Se `MASTER-ACCEPTANCE.md` for alle 41 krav med faktisk status og `master-test-results.json` for den fulde lokale kørsel. Ikke alle 41 er bestået. Stripe-testkøb, faktisk mailmodtagelse, faglig/juridisk godkendelse, fuld enhedstest og de dokumenterede udviklingshuller mangler fortsat.
