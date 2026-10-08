# Drift, sikkerhed og gendannelse

## Arkitektur

Eksisterende Next.js/TypeScript/Tailwind-app på Railway, eksisterende PostgreSQL og GitHub-deployment. Better Auth håndterer korte, engangs e-maillinks og databasebaserede sessions. Linkets token ligger i URL-fragmentet i mailen og sendes i POST ved aktiv bekræftelse; det havner ikke i HTTP-URL-logs. Auth-token gemmes hashed. Mailkøen krypteres med AES-256-GCM afledt af BETTER_AUTH_SECRET. Secret-rotation kræver planlagt håndtering af aktive sessions og krypteret kø.

HTTP-handlinger kontrollerer origin, verificeret session, aktivt køb og ejerskab på serveren. Admin kræver særskilt rolle; første konto får ingen privilegier. SQL er parameteriseret. Rate limits gemmes i PostgreSQL. Der er ingen kundeadgang via success-URL, localStorage eller frontend-state. Der indsamles ikke diagnoser/fritekst-sygehistorie.

`/api/health` anvender databasen og additive migrationschecks; returnerer 503 ved fejl. Railway bruger endpointet før trafikskift. Migrationsfiler har SHA-256-checksum og advisory transaction lock. Anvendte migrationsfiler ændres ikke; nye skemaændringer tilføjes som næste fil. Ingen eksisterende waitlist-/legacytabeller slettes.

## Deployment og rollback

Kør typecheck, unit tests, build og integrationstest på feature-branch. Opret PR og merge først efter relevante checks. Railway bygger main automatisk. Kontrollér deploymentens Git SHA, SUCCESS og HTTP-health før levering. Et app-rollback fjerner ikke databasen. Additive migrationer er kompatible med gammel landing. Rul ikke DB tilbage ved at nulstille den.

## Sikkerhedskopi af produktion

Før kundelancering skal ejeren konfigurere Railway-volume-backups for både PostgreSQL og video samt adgangsbegrænset, krypteret logisk backup. Driftens planlagte frekvens/RPO/RTO, retention og ansvarlig skal godkendes. Denne leverance har ikke påstået at konfigurere en skjult automatisk produktionsbackup.

På en autoriseret driftsmaskine med PostgreSQL-klient og miljøvariablen DATABASE_URL:

```sh
umask 077
pg_dump --format=custom --no-owner --file=shaz-backup.dump "$DATABASE_URL"
pg_restore --list shaz-backup.dump
# RESTORE_DATABASE_URL SKAL være en ny, isoleret database, aldrig produktion.
pg_restore --no-owner --no-acl --exit-on-error --dbname="$RESTORE_DATABASE_URL" shaz-backup.dump
```

Gem ikke dumpet i GitHub eller en offentlig mappe. Krypter det med virksomhedens nøglestyring og kopiér kun til godkendt lager. Kopiér videovolumen og kontrollér filhashes mod videometadata. Efter restore: kontrollér migration checksums, ordre-/profiltal, 100-dagesplaner, logs, sessionsstrategi og filadgang i et isoleret miljø. Send aldrig mails fra den gendannede testkopi.

## Afprøvet restore i denne leverance

Integrationstesten tager et faktisk fysisk snapshot af den isolerede PGlite PostgreSQL-database og indlæser det i en ny uafhængig PostgreSQL-instans. Den sammenligner 300 planrækker og ordrer. Dette dokumenterer databasens test-restore; det er **ikke** en afprøvet Railway-produktionsbackup eller pg_dump/pg_restore mod Railway. Den separate produktionsøvelse forbliver en lanceringsgate.

## Datafrister og hændelser

Kontoeksport findes under Profil. Kontosletning fjerner kundeprofil, sessions, programmer, træningslogs, måltider, favoritter, indkøb og check-ins via foreign-key cascade. Ordrebilag bevares separat. Frivillige kropsdata fjernes ved at vælge portioner; frivillige vægtmålinger kan slettes separat. Juridisk bogføringsperiode, ophør af læseadgang og automatisk oprydning skal godkendes før lancering. Administrative auditspor opbevares med dokumenteret sikkerhedsformål.

Fejllogs indeholder generiske fejlkoder/event-ID, ikke loginlinks, kortdata eller kropsoplysninger. Undgå at udvide logging til fulde request bodies. Mailstatus `failed`, `bounced` eller `complained` kræver opfølgning. Ved mistænkt brud: begræns adgang, bevar nødvendigt revisionsspor, identificér berørte data og følg virksomhedens godkendte beredskab.
