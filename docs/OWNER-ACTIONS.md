# Konkrete lanceringsafklaringer

Rigtige opkrævninger er ikke åbnet. Testkontoen bruger samme kundeområde, egen database og almindeligt password-login; adgangskoden er ikke i repository.

## Oplysninger og godkendelser fra ejer

1. Konfigurér Stripe **test**-secret, webhook-signering og godkendt engangspris 39900 øre/DKK i Railway. Ingen live-aktivering uden udtrykkelig godkendelse.
2. Godkend SHAZ-afsenderdomæne og bemandet supportadresse. Konfigurér `RESEND_API_KEY`, `EMAIL_FROM`, `RESEND_WEBHOOK_SECRET`; verificér DNS og faktisk modtagelse. Et andet projekts domæne er ikke genbrugt.
3. Faktisk sælgernavn, CVR, adresse og momsstatus samt juridisk gennemgang af vilkår, fortrydelse, klagevejledning og databeskyttelse.
4. Faglig gennemgang og dokumenteret godkendelse af ernærings- og træningspolitikker, portioner, aktivitetsfaktorer, højfrekvensskabeloner og indhold. Ingen checkbox er bevis for denne gennemgang.
5. Godkendt materiale med Shaz, øvelsesvideoer og licenserede opskriftsfotos.
6. Fysisk iPhone/Safari og Android/Chrome til den afsluttende enhedstest.
7. Godkend driftsejer, backupfrekvens/retention, RPO/RTO og databehandler-/overførselsgrundlag. Testens app/DB holdes adskilt fra produktion; ingen dataflytning er udført.

## Udvikleransvar — må ikke flyttes over på ejer

Se de udestående implementerings- og testpunkter i `MASTER-ACCEPTANCE.md`. Især sygdom/rejse, komplette nærings-/portionsregler, udvidet batch-browserkontrol og fuld tilgængelighedstest er ikke dækket af at modtage nøgler. Masterleverancen kan derfor ikke erklæres fuldført endnu.

Administratorer tilføjer selv deres godkendelsesapp på `/admin/security`. TOTP og gendannelseskoder håndteres af Better Auth; ingen delt MFA-nøgle udleveres eller seedes. Almindeligt kundelogin kræver ikke opsætning af MFA. Eksisterende password- og e-maillink-konti bevares.

## Kilder til kontrol, ikke autorisationsstempler

- https://www.better-auth.com/docs/authentication/email-password — installeret Better Auth, eksisterende konti bevares.
- https://docs.stripe.com/checkout/fulfillment — serververificeret, idempotent adgang.
- https://pubmed.ncbi.nlm.nih.gov/2305711/ — Mifflin–St Jeor, hvilestofskifte, ikke fuld individuel kostordination.
- https://www.nice.org.uk/guidance/ng246/chapter/Physical-activity-and-diet — sikkerhedsramme; SHAZ-procentniveauer er egne produktvalg.
- https://www.w3.org/WAI/WCAG22/quickref/ — tilgængelighedskrav.
- https://www.retsinformation.dk/eli/lta/2025/723 — digital fortrydelsesfunktion; endelig juridisk kontrol skal omfatte gældende konsoliderede regler.
- Fødevaredata: USDA FoodData Central / SR Legacy med fødevare-ID og vægtgrundlag i `lib/data/ingredients.json`. Ikke mislabeled som Frida.
