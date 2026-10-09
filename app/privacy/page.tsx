import Link from "next/link";
export const dynamic = "force-dynamic";
export default function Privacy() {
  return (
    <main className="portal p-main">
      <Link href="/">SHAZ / Tilbage</Link>
      <article className="p-card">
        <span className="p-eyebrow">PRIVATLIV · VERSION 2026-10-1</span>
        <h1>Dine oplysninger. Et tydeligt formål.</h1>
        <p className="p-notice">
          Kundeplatformen er under klargøring. Dataansvarlig, leverandøraftaler,
          opbevaringsfrister og overførselsgrundlag skal færdiggøres før rigtige
          kunder inviteres.
        </p>
        <h2>Hvem er ansvarlig?</h2>
        <p>
          {process.env.SELLER_NAME
            ? `${process.env.SELLER_NAME}, CVR ${process.env.SELLER_CVR}. Kontakt: ${process.env.SUPPORT_EMAIL}.`
            : "Virksomhedens juridiske navn, CVR og kontaktadresse er endnu ikke oplyst. Salg forbliver lukket, indtil disse oplysninger er på plads."}
        </p>
        <h2>Oplysninger og formål</h2>
        <p>
          Ved køb bruges e-mail, betalingsreference, ordrebeløb, betalingsstatus
          og accepterede vilkår til levering, adgang og dokumentation. Stripe
          håndterer kortdata. Din e-mail verificeres med et engangslink.
        </p>
        <p>
          Onboarding gemmer mål, erfaring, udstyr, træningsrytme, kostvalg og
          startdato, så programmet kan tilpasses med faste regler. Træningssæt,
          madplan, favoritter og check-ins gemmes, når du selv registrerer dem.
          OpenAI kan lave et forslag til trænings- og madplan. Forslaget aktiveres først, når du selv bekræfter det.
        </p>
        <p>
          Portionsvejledning kræver ingen kropsoplysninger. Ved frivillig
          energiberegning gemmes nødvendige tal efter udtrykkeligt samtykke.
          Frivillige vægtregistreringer kræver særskilt samtykke. Vælg portioner
          eller slet vægtregistreringer under Profil for at trække dette
          tilbage. Der kan angives en kort beskrivelse af skader. Undlad CPR, kontaktoplysninger, journaler og unødvendig sygehistorie.
        </p>
        <h2>OpenAI-planlægning</h2>
        <p>Efter særskilt accept sendes mål, træningserfaring, målbare mål, kostvalg, planens beregnede rammer og en eventuel kort beskrivelse af skader til OpenAI. Navn og e-mail sendes ikke. Skadebeskrivelsen kan indeholde helbredsoplysninger. PubMed får kun generelle emnesøgninger, ikke dine personlige svar.</p>
        <p>API-kald bruger store:false, men det garanterer ikke nul opbevaring i leverandørens sikkerhedslogs. Ikke-aktiverede forslag opbevares krypteret med en gyldighed på 24 timer. Dette er fortsat testmiljø; leverandøraftaler og endelige opbevaringsregler skal være på plads før kunder lanceres.</p>
        <h2>Behandlingsgrundlag</h2>
        <p>
          Levering af køb og konto baseres på aftalen; nødvendig
          regnskabsdokumentation på retlige forpligtelser. Sikkerhed og
          forebyggelse af misbrug baseres på en dokumenteret interesseafvejning.
          Frivillige kropsoplysninger, der kan udgøre helbredsoplysninger,
          behandles kun efter udtrykkeligt samtykke og skal indgå i den endelige
          risikovurdering.
        </p>
        <h2>Leverandører og geografisk placering</h2>
        <p>
          Railway hoster app og PostgreSQL. Den eksisterende database er
          placeret i USA (us-west2) og er ikke flyttet ved denne opdatering.
          Stripe bruges til betaling og Resend til transaktionsmail, når de er
          konfigureret. Der skal foreligge relevante databehandleraftaler,
          dokumentation for underleverandører og et gyldigt overførselsgrundlag,
          før persondata fra rigtige kunder behandles.
        </p>
        <h2>Opbevaring og sletning</h2>
        <p>
          Profil- og forløbsdata gemmes, mens kontoen har et sagligt formål. Den
          endelige automatiske opbevaringsperiode skal godkendes før lancering.
          Du kan eksportere data og slette kontoen under Profil. Konto,
          sessionsdata, træningsplaner, måltider og vægtregistreringer slettes
          ved kontosletning. Nødvendige ordrebilag og refusionsoplysninger
          holdes særskilt og opbevares i den lovpligtige periode, som
          virksomheden skal fastlægge.
        </p>
        <p>
          Loginlinks gemmes som hash i autentificeringen. Mailkøen krypteres og
          ryddes for indhold, når mailudbyderen har accepteret afsendelsen.
          Leveringsstatus vises uden loginlinks. Adgang til administrative data
          begrænses efter rolle.
        </p>
        <h2>Cookies og tekniske oplysninger</h2>
        <p>
          Der bruges nødvendige sessionscookies til login og en midlertidig
          reference til betalingsforløbet. Der bruges ikke markedsførings- eller
          analysecookies. Hosting og sikkerhedsfunktioner kan behandle tekniske
          driftsoplysninger. Loginlinks lægges ikke i serverens URL-log.
        </p>
        <p>
          Træningskladder gemmes midlertidigt på denne enhed, så en
          forbindelsesfejl ikke sletter dine sæt. De er knyttet til din konto og
          dit pas, men giver ikke adgang til platformen. Brug en privat enhed,
          og ryd webstedets lokale data, hvis du deler eller afleverer den.
          Synkroniserede registreringer gemmes i din konto.
        </p>
        <h2>Dine rettigheder</h2>
        <p>
          Du kan få indsigt, rette data, bede om sletning eller begrænsning og i
          relevante tilfælde få data udleveret eller gøre indsigelse. Samtykke
          kan trækkes tilbage uden at ændre lovligheden af tidligere behandling.
          Du kan klage til{" "}
          <a href="https://www.datatilsynet.dk/borger/hvad-er-dine-rettigheder">
            Datatilsynet
          </a>
          . Kontaktoplysninger til den dataansvarlige skal være tilgængelige før
          lancering.
        </p>
        <h2>Demo</h2>
        <p>
          /demo er en tydeligt mærket præsentation. Dens valg gemmes kun i den
          åbne side. Brug fiktive oplysninger; demoen er ikke en kundekonto.
        </p>
      </article>
    </main>
  );
}
