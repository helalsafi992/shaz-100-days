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

## Pauseleverance verificeret

Commit `8f038c68bdf62a3ddd48ed7f235ac8b4dc1c1527`:

- Produktion `eaafa2c5-e620-4dc2-905b-79a6bcd1a4b1`: SUCCESS; offentlig health HTTP 200 med commit.
- Test `1aea7bc6-376b-432c-8c53-fb4bded6ab08`: SUCCESS; health 200, frisk password-login 200, kundestate 200, 100 dage og pausepreview 200. Den efterfølgende logout lykkedes.
- Faktisk indlogget Railway-browser viste pause 9.–12. oktober med to styrkepas, ingen cardio og uændret slutdato 15. januar 2027. Preview blev annulleret uden at ændre ejerprofilen. Screenshot: `deployed-desktop-pause-preview-8f038c6.jpg`.

## Portioner og fejltolerance

- 20 domænetestgrupper og 34 integrationstestgrupper består, inklusive 9.801 måltidskombinationer efter praktisk ingrediensafrunding.
- Gamle måltids-snapshots bevares ved fjern/fortryd og valg af allerede gemte alternativer. Nye portionsændringer bruger `practical-grams-v1` med beregnede totaler.
- Offline træningskladde overlever lukning, refresh, genforbindelse og øvelsesbytte. Et forsinket svar fra en lukket editor kan ikke overskrive en nyere lokal ændring.
- Lokal databaseforbindelse blev faktisk afbrudt og genetableret. Appen returnerede 503 på health og 500 på signeret webhook under fejlen; samme webhook kunne genbehandles to gange med én lagret hændelse og én korrekt ordreændring. Kundens øvrige data var bevaret. Dette er lokal fejlindsprøjtning, ikke en afbrydelse af Railway-databasen.
- Den nye leverances Railway-commit og deploy-status skal verificeres efter udrulningen; ovenstående versionsnumre gælder tidligere verificerede deployments.

## f42eea3 i testmiljøet

- Testdeployment `ef9ddc07-6616-4756-90d9-ac41f2671969`: SUCCESS. Health viste `f42eea3cbacb323d530f554e5ce02031d1b3485d`.
- Frisk password-login, 100 dage, anonym afvisning, logout og ny session afprøvet. Ejerprofil og eksisterende maddage var uændrede.
- Serverpreview for 2/3/4/5/6 måltider bevarede målet 2635 kcal. Planernes beregnede totaler var 2639/2632/2635/2658/2640 kcal, med tre forskellige forslag pr. plads og praktisk afrunding.
- Browserkontrollen fandt en ældre UI-fejl: beregnerens standardfelter erstattede den gemte faktor 1,6 med 1,55. Ingen ændring blev bekræftet på ejertestkontoen. Derfor blev f42eea3 ikke fremført til produktion alene.
- Rettelsen genbruger aktivitetsindstillingerne, indtil kunden aktivt vælger en ny vurdering. Den samme komponent bruges i onboarding og madberegneren. De efterfølgende 21 domænegrupper og 35 integrationstestgrupper består, inklusive alle fem måltidsantal gennem browseren, bevaret mål efter bekræftelse og den præcise 160/102/0-proteinvisning.
