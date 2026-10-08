# Produktionskrav før lancering

**Status: salg lukket.** Der må ikke åbnes rigtige betalinger eller sendes en lanceringskampagne uden ejerens udtrykkelige godkendelse. Den gamle beta er på `/demo`. Den giver ingen kundeadgang.

## Miljøvariabler

Indtastes på Railway → eksisterende SHAZ-appservice → production → Variables. Alle secrets skal blive dér, ikke i GitHub, browserkode eller chat.

| Navn | Formål |
| --- | --- |
| APP_URL | Den kanoniske HTTPS-adresse; allerede konfigureret |
| DATABASE_URL | Eksisterende Railway PostgreSQL-reference; allerede konfigureret |
| BETTER_AUTH_SECRET | Tilfældigt sessions- og mailkrypteringssecret; genereret og sat i Railway |
| STRIPE_MODE | `test` før godkendt lancering; derefter `live` sammen med korrekte nøgler |
| STRIPE_SECRET_KEY | Stripe servernøgle fra det valgte miljø |
| STRIPE_WEBHOOK_SECRET | Signeringssecret for `/api/stripe/webhook` |
| STRIPE_PRICE_ID | Aktiv engangspris: præcis 39900 øre, DKK; ingen eksklusiv moms oveni |
| RESEND_API_KEY | Begrænset sendetilladelse for SHAZ' godkendte afsenderdomæne |
| RESEND_WEBHOOK_SECRET | Signeringssecret for `/api/mail/webhook` |
| EMAIL_FROM | Verificeret SHAZ-afsender, navn og e-mail |
| SUPPORT_EMAIL | En bemandet kontaktadresse |
| SELLER_NAME | Faktisk juridisk virksomhedsnavn |
| SELLER_CVR | Faktisk CVR-nummer |
| SELLER_ADDRESS | Faktisk geografisk adresse |
| OWNER_EMAIL | Ejerens godkendte e-mail til sikker første invitation |
| VIDEO_STORAGE_PATH | Konfigureret til `/data/videos` på separat 5 GB Railway-volume |
| LEGAL_APPROVED | Først `true` efter gennemgang nedenfor |
| CONTENT_APPROVED | Først `true` efter reel faglig gennemgang og publicering |
| DELIVERY_VERIFIED | Først `true` efter test af faktisk mailmodtagelse og levering |
| SALES_ENABLED | Forbliver `false`, indtil ejeren udtrykkeligt godkender salg |

`APP_ENV=test` og `MAIL_TRANSPORT=test` anvendes kun af den isolerede lokale testproces. Mailopsamling er kun mulig med localhost som APP_URL. Der er ingen HTTP-testlogin, kode eller knap, som omgår køb eller e-mailverifikation i produktion.

## Eksterne integrationer

- Der var ingen Stripe-nøgler knyttet til appen ved udviklingens start. Signerede fixtures er testet lokalt; faktisk Stripe-testbetaling skal gennemføres efter konfiguration.
- Den tilsluttede Resend-konto havde et andet projekts verificerede domæne. Det er ikke genbrugt som SHAZ-afsender. Ejeren skal tilføje eller godkende et SHAZ-domæne og opsætte SPF/DKIM/DMARC efter udbyderens værdier.
- Test en reel leveret loginmail, udløb/genudsendelse og ordrebekræftelse. Undersøg inbox/spam samt Resend-webhook. Et succesfuldt sendekald er ikke bevis for modtagelse.
- Stripe events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`. Gem ingen kortdata selv.
- Resend events: delivered, bounced, complained, failed. Separate testkonti/projekter/databaser; ingen rigtige kundekort.

## Ejer og faglig gennemgang

- Gennemgå alle 12 programvarianter, alternativer, progression, begrænsninger og de 15 ugefokus. Alle seed-versioner står `review`.
- Gennemgå de 30 opskrifter, fødevaresikkerhed, rå/drænede vægte, portioner, vegetariske valg og halal-formulering. Datakilder er dokumenteret, men den individuelle egnethed er ikke fagligt godkendt.
- Gennemgå energimetodens målgruppe, sikkerhedsgrænser og den udtrykkelige samtykketekst. Portionsvejledning er standard.
- Tilføj Shaz' egne videoer; manglende videoer omtales ikke som færdige.
- Godkend endelig kundekommunikation, start-/adgangsperiode og hjælpetekster.

## Jura og privatliv

Arbejdshypotesen er en tidsbegrænset digital tjeneste med digitalt indhold. Dette er ikke en endelig juridisk klassifikation. Løsningen giver kunden 14 dages fortrydelsesret fra aftalen, også ved øjeblikkelig start; der er ingen generel checkbox, der fjerner rettigheden. Gennemgå klassifikation, refundering, mangelsbeføjelser, momsstatus, fakturakrav, klagevejledning og standardfortrydelsesformular med faktiske sælgeroplysninger.

Kilder gennemset: [Forbrugeraftaleloven, LBK 1184/2025](https://www.retsinformation.dk/eli/lta/2025/1184), [forbrug.dk om digitalt indhold](https://forbrug.dk/emner/nethandel-og-digitale-tjenester/koeb-og-levering-af-digitalt-indhold), [Forbrugerombudsmanden om fortrydelse](https://forbrugerombudsmanden.dk/alle-emner/forbrugeraftaler/fortrydelse).

Den eksisterende app/database er i Railway `us-west2`. Ingen flytning er foretaget. Ejer skal dokumentere dataansvarlig, formål/behandlingsgrundlag, databehandleraftaler, underleverandører, overførselsgrundlag/TIA hvor relevant, sikkerhedsvurdering af kropsdata og konkrete slette-/backupfrister. Der må ikke ske kundeinvitation før dette er afklaret. Se [Datatilsynets vejledning om rettigheder](https://www.datatilsynet.dk/borger/hvad-er-dine-rettigheder).

De offentlige vilkår og privatlivstekster viser tydeligt uafklarede oplysninger. Der er ingen opdigtet virksomhed, CVR, kontaktadresse, faglig certificering, anmeldelse eller før/efter-resultat.
