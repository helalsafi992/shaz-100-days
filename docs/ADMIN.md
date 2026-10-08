# SHAZ — daglig administration

## Adgang

Åbn `/admin` og log ind via `/login` med den verificerede e-mail fra din invitation. Ingen første bruger bliver automatisk administrator. Den første ejer inviteres fra et autoriseret driftsmiljø med `npm run owner:invite`, når `OWNER_EMAIL`, `EMAIL_FROM`, `RESEND_API_KEY`, `APP_URL`, `DATABASE_URL` og `BETTER_AUTH_SECRET` er sat. Scriptet sender invitationen; det udskriver aldrig token eller nøgle. Ejerinvitationen gælder i 24 timer og kræver e-mailverifikation før brug. Indholdsredaktører inviteres af ejeren i admin.

## Dagligt

1. Se **Overblik**: betalende liveordrer, testordrer og fortrydelsesanmodninger skal holdes adskilt. Salg er fortsat lukket ved første deployment.
2. Se **Levering**: `sent` betyder accepteret af mailudbyderen; kun en signaturverificeret leveringshændelse giver `delivered`. Bounces/klager skal undersøges. Genudsend login fra kundens række i **Kunder**.
3. Se **Kunder**: startdato, onboardingtrin og antal gennemførte træninger. Kropsoplysninger og detaljerede logs vises ikke som standard.
4. Behandl **Fortrydelse** inden fristen. Refundér den relevante betaling i Stripe, ikke via et nyt køb. Webhook bekræfter refusionen og lukker adgang ved fuld refundering. Admin kan først markere en anmodning afsluttet, når ordren er registreret refunderet. Delvise refunderinger bevarer adgang og reducerer nettoomsætningen.

## Indhold

Åbn **Indhold**, vælg en opskrift/øvelse/programskabelon/ugefokus/hjælpetekst, og redigér de navngivne strukturerede felter. Serveren validerer opskriftsingredienser mod den dokumenterede fødevareliste. Makroer beregnes fra råvaremængder; skriv ikke egne makrotal ind.

Gem som **kladde** eller **til gennemgang**. Publicering kræver ejerrolle og en eksplicit bekræftelse af faktisk gennemgang. Bruger-ID, version og tidspunkt registreres. Systemet kalder ikke materialet “fagligt godkendt”. En trænings- og ernæringsfagperson skal gennemgå startindholdet før salg.

Alle ændringer opretter en ny indholdsversion. Aktiverede træningspas og allerede valgte måltider har en kopi af deres version. Fremtidige programændringer sker ved kundens aktive valg og bevarer historiske registreringer. Udgivelse omskriver ikke automatisk eksisterende forløb.

Upload kun videoer, SHAZ har rettigheder til. MP4/WebM, højst 25 MB pr. fil. Upload gemmes i vedvarende lager; gem derefter øvelsesversionen med videoens ID. En øvelse uden video viser en tekstforklaring. Sikkerhedskopiér både database og videolager.

## Kundehenvendelser

Bed om ordrenummer og kort fejlbeskrivelse. Bed ikke om diagnoser eller detaljeret sygehistorie. Kunden kan eksportere sine data, slette frivillige vægtregistreringer og slette kontoen under Profil. Kontoens sletning beholder nødvendige købsbilag særskilt; håndtér opbevaringsfristen og eventuelle indsigelser efter virksomhedens godkendte politik.

Se [LAUNCH.md](LAUNCH.md), [CONTENT.md](CONTENT.md), [OPERATIONS.md](OPERATIONS.md) og [TEST-REPORT.md](TEST-REPORT.md) før første kundeinvitation.
