# Testleverance — 8. oktober 2026

## Afprøvet

- TypeScript typecheck og optimeret Next.js production build.
- 5 automatiserede domænetests: alle 12 varianter, præcis 100 dage, udstyrsmatch, faser, sommertid/vintertid, dag 101, 30 opskrifter, dokumenterede næringsværdier, portionsskalering, indkøbsaggregering, kostudelukkelser, energiskøn og præstationsbaserede forslag.
- 17 integrationsgrupper mod en isoleret PostgreSQL-database og en faktisk Next.js production-proces. Det maskinlæsbare resultat findes i [test-results.json](test-results.json).

| Område | Verifikation |
| --- | --- |
| Tre kunderejser | Hjemme/begynder, center/let øvet og vegetarisk. Betalingsfixture → automatisk mailopsamling → Better Auth-verifikation → gemt onboarding → aktivering → logget træning |
| Stripe-kontrakt | Signatur, beløb, valuta, produkt/price, paid-status og miljø; afviste/ubetalte sessioner giver ingen ordre; gentagne hændelser giver én ordre og én første loginmail |
| Login | Engangsbrug, udløb, genudsendelse, anden session/enhed og faktisk browser-login |
| Adgang | Afvisning uden session/køb, andet kunde-ID, forkert Origin og manglende adminrolle |
| Kost | Vegetariske filtre, afvist uegnet bytte, portionsændring, ugentlig plan, favoritter og gemt indkøbsafkrydsning |
| Planændringer | Historiske pas bevares; check-in-forslag kræver accept; gentagen accept afvises |
| Betalingsstatus | Refundering og indsigelse lukker produktadgang; ordreoplysninger forbliver tilgængelige; vundet indsigelse kan genåbne |
| Administration | Invitation til den rigtige verificerede e-mail, ejerrolle, versionering, eksplicit publiceringsbekræftelse og auditspor |
| Backup/restore | Fysisk snapshot af isoleret PostgreSQL indlæst i en separat instans; 300 programdage og ordredata sammenlignet |
| Browser | 390 px mobil og 1440 px desktop; landing, checkout, login, demo, dashboard, træning, mad, fremgang og profil uden vandret overflow eller klientundtagelser |
| Interaktion | Træningseditor, pausetimer, rettelse af registrering, opskriftsdialog, portionsvalg, adminindhold og offentlige previewbilleder |
| Persistens | Refresh, logout, anden session samt stop/genstart af Next.js-processen bevarer serverdata |
| Adgangsudløb | Dag 101 viser opsummering, giver ingen automatisk betaling og afviser nye registreringer |
| Mail-webhook | Signerede Resend-fixtures, ugyldig signatur, idempotent leveringstid og bevaret bounce-suppression |
| Datarettigheder | Egen dataeksport, kontosletning/cascade og særskilt bevaret ordredokumentation |

## Afgrænsning — dette er ikke påstået gennemført

1. **Faktisk Stripe-testkonto:** Ingen Stripe-nøgler var tilgængelige. Tests bruger signerede lokale event-fixtures og en injiceret sessionhentning, ikke en rigtig Checkout-betaling. Ingen rigtige betalingskort er brugt. Test faktisk succes, afvist kort, afbrudt Checkout, forsinket betaling og refundering efter opsætning.
2. **Faktisk mailmodtagelse:** Mail er opsamlet krypteret i den isolerede testdatabase. Verificeret SHAZ-afsender, Resend-nøgle og rigtig modtagelse/inbox/spam skal kontrolleres. Et andet projekts domæne er ikke genbrugt.
3. **Railway-produktionsrestore:** Det isolerede restore er gennemført. Backupplan og restore af den konkrete Railway-database/videovolumen skal afprøves separat. Ingen eksisterende database er flyttet eller nulstillet.
4. **Rigtige ejer-/kundekonti:** Der er ikke udstedt en offentlig gratis adgang eller oprettet en administrator ud fra den første tilmelding. Ejerens adresse og fungerende afsender skal være klar før invitation.
5. **Faglig/juridisk review:** Startindholdet er markeret `review`. Ingen klinisk validering eller professionel godkendelse er opfundet. Virksomhedsdata, DPA/overførsler, retention og handelsvilkår er lanceringsgates.
6. **Shaz-videoer:** Upload og beskyttet afspilning er implementeret og vedvarende lager er oprettet. Originale videoer er ikke leveret; tekstforklaringer bruges. Faktiske videofiler/codec-afspilning skal kontrolleres ved første upload.

## Gentagelse

`npm ci && npm run typecheck && npm test && npm run build && npm run test:integration`

Integrationstest opretter sin egen database og egne fiktive konti i processen. Den overskriver ikke Railway-variabler eller kundedata og har ingen produktionslogin-bypass. Chromium til lokal UI-verifikation er en dev dependency. Offentlige produktbilleder er faktiske skærmbilleder fra disse fiktive testkonti, tydeligt markeret som sådanne.
