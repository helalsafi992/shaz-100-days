# Sammenhængende testplatform — 8. oktober 2026

## Testadgang

https://shaz-test-staging.up.railway.app/login — konto `test@shaz.example`.
Adgangskoden findes kun i Railway-projektet **SHAZ test**, service **shaz-test**, variablen `TEST_ACCOUNT_PASSWORD`. Ingen hemmeligheder i dette dokument, GitHub eller klientkoden.

Testmiljøet har sin egen PostgreSQL-database `shaz_test`, eget sessionssecret og separat videovolumen. Den almindelige Better Auth password/session-løsning anvendes. Seed-scriptet kan kun give testadgang med korrekt projekt-ID, staging-origin, testflag, ikke-live Stripe-mode og verificeret databasenavn. Produktionsprojektets ID accepteres ikke. Rettigheden er brugerbundet og udløber efter 180 dage. Seed er idempotent og nulstiller aldrig eksisterende brugerdata eller adgangskode ved deployment.

Under Profil kan den autoriserede testkonto nulstille til en fiktiv udfyldt plan eller til onboarding. Nulstilling kræver bekræftelse og sletter kun denne testkontos egne forløbsdata. Kontoen får testmiljøets adminrolle, aldrig en produktionsrolle. Testoplysninger er fiktive og må ændres.

## Kunderejsen

Opret konto → e-mailbekræftelse → verificeret engangskøb 399 DKK → behov → aktivering → 100 kalenderdage. Gamle magic-link-konti og ordrebaseret adgang bevares. Password-reset bruger Better Auth og tilbagekalder gamle sessions. Verifikationsmail kølægges efter signup-transaktionen, så der ikke opstår en indlejret ventetilstand i databasepoolen. Ingen livebetaling er åbnet.

`/demo` viderestiller til forhåndsvisningen af den faktiske platform. Login og køb fører ikke til Beta.tsx. Dagens skærm viser handling, måltider, mål, uge og registreringer. En planlagt ret er ikke spist. Navigation: I dag / Træning / Mad / Fremgang.

## Beregninger og mad

- Mifflin–St Jeor og én samlet aktivitetsfaktor. Faktorændring kræver kundens accept. Ingen cardioforbrænding lægges oveni.
- 10/15/20/25 % underskud, vedligeholdelse og separat lille overskud ved muskelmål.
- 2–6 navngivne måltidspladser. Kaloriemålet ændres ikke med antal. Preview og eksplicit accept før profilændring.
- 38 opskrifter med dokumenterede USDA-ingredienser, rå/tør/drænet vægtgrundlag, gramafrunding, portions- og massegrænser. Datagrundlag og produktantagelser: `NUTRITION-POLICY.md`.
- Tre forskellige relevante, portionsberegnede forslag pr. plads, når filtrene gør det muligt. Ellers vises det reelle antal og begrænsningen. Ingen dubletter eller tilsidesatte allergifiltre.
- Kun valgt mulighed tæller. Byt, portion, fjern, tom plads, fortryd, spist/sprunget over. Eaten/skipped snapshots og tidligere dage bevares. Ingen automatisk kompensation for sprunget mad.
- Indkøb summerer kun valgte retters aktuelle ingrediensgram. Illustrationsbillederne er tydeligt mærkede ingrediensillustrationer, ikke madfotografier.
- Planen viser mål og faktisk beregnet sum særskilt samt fejl ved uopfyldte krav. Manuellerstatninger kan afvige; afvigelsen skjules ikke.

## Styrke, cardio og persistens

2/3/4-dages styrkeskabeloner til hjemme/center og begynder/let øvet; udstyr og fravalg indgår. Alternativer matcher bevægelsesfunktion. Færre end to forsvarlige alternativer vises ærligt. Fjernelse efterlader en tom plads og forklarer ubalancen. Sæt for tidligere øvelser arkiveres og bevares ved bytte.

0–4 cardiopas, dage, udstyr, form, intensitet og varighed styrer konkrete pas. Gang/cykling/løb-gang/crosstrainer har egnede variationer, opvarmning og afslutning. Tid/intensitet er ikke ligestillet med en præcis energiforbrænding. Restitution og samlet belastning kontrolleres. Styrke + cardio samme dag begrænses til let, kort cardio. Missede pas fordobles ikke. Ændret træning giver et aktivitetsforslag, ikke et skjult nyt kaloriemål.

PostgreSQL gemmer profil, måltidsvalg, cardioplan/-log og træningskladder. Optimistiske revisioner beskytter samtidige sessions. Kladden gemmes desuden lokalt pr. konto/pas ved netværksfejl; denne cache giver ingen adgang. Ved reel konflikt vælger kunden, hvilken kladde der skal bevares. Enhedsoverskridende persistens kræver, at netværkssynkronisering er lykkedes.

Admin vedligeholder versionsopdelt indhold, portioner, øvelser/alternativer, skabeloner, cardio- og ernæringsregler samt video. Reglerne er `review`; en eksplicit indholdsbekræftelse fra en autoriseret admin er påkrævet ved publicering. Denne tekniske handling udgør ikke i sig selv faglig godkendelse.

## Bevidst adskillelse fra kundelancering

Den fulde funktionelle afprøvning foregår på staging. Fagligt uafklarede beregningsregler er ikke frigivet til kunder: serveren kræver publiceret ernæringsregel og CONTENT_APPROVED uden for det isolerede testmiljø. Se LAUNCH.md for betaling, mail, virksomhed/jura, videoer, faglig review, databeskyttelse og produktionsbackup. Ingen eksisterende produktionsdata er nulstillet eller migreret destruktivt.
