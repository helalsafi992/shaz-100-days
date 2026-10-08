import Link from "next/link";
import { TERMS_VERSION, termsText, salesOpen } from "@/lib/payments";
export const dynamic = "force-dynamic";
export default function Terms() {
  return (
    <main className="portal p-main">
      <Link href="/">SHAZ / Tilbage</Link>
      <article className="p-card">
        <span className="p-eyebrow">HANDELSVILKÅR · {TERMS_VERSION}</span>
        <h1>Klare rammer for dit forløb.</h1>
        {!salesOpen() && (
          <p className="p-notice">
            Salg er lukket. Vilkårene er et udkast til kundeplatformen og skal
            færdiggøres med virksomhedens oplysninger og juridiske gennemgang
            før køb åbnes. Der tages ikke betaling, mens salget er lukket.
          </p>
        )}
        <h2>Produkt og pris</h2>
        <p>{termsText}</p>
        <p>
          Produktet omfatter regelbaserede træningsvarianter,
          øvelsesforklaringer, opskrifter, madplan, indkøbsliste og registrering
          af egne træninger. Video vises kun ved øvelser, hvor en video faktisk
          er tilføjet. Det er ikke personlig coaching, behandling af skader
          eller en medicinsk diæt. Individuelle resultater varierer.
        </p>
        <h2>Sælger og kontakt</h2>
        {process.env.SELLER_NAME ? (
          <p>
            {process.env.SELLER_NAME}
            <br />
            CVR: {process.env.SELLER_CVR}
            <br />
            {process.env.SELLER_ADDRESS}
            <br />
            Support: {process.env.SUPPORT_EMAIL}
          </p>
        ) : (
          <p>
            Juridisk virksomhedsnavn, CVR, fysisk adresse og supportadresse er
            endnu ikke oplyst. Derfor kan der ikke indgås købsaftaler på siden.
          </p>
        )}
        <h2>Betaling og levering</h2>
        <p>
          Den samlede kundepris er 399 DKK inklusive eventuel gældende moms. Der
          tilføjes ikke betalingsgebyr. Stripe behandler betalingen. Vi
          opbevarer ikke kortoplysninger. Adgang oprettes først efter bekræftet
          betaling og bekræftelse af køberens e-mail.
        </p>
        <p>
          Ordrebekræftelse og e-mailverifikation sendes til din konto-e-mail.
          Dit login med e-mail og adgangskode bevares under betalingen.
          Ved forsinket bekræftelse vises en
          ventetilstand; betal ikke igen uden først at kontrollere ordren.
        </p>
        <h2>Start og adgangsperiode</h2>
        <p>
          Du vælger selv startdatoen ved aktivering efter onboarding, fra
          aktiveringsdagen og op til 90 dage frem. Der er 100 kalenderdages
          aktiv adgang fra denne dato, regnet i tidszonen Europe/Copenhagen.
          Betalingsdato og startdato er forskellige. Efter dag 100 ophører nye
          registreringer; et afsluttende overblik og dataeksport forbliver
          tilgængelige i kontoens opbevaringsperiode. Der loves ikke
          livstidsadgang.
        </p>
        <h2>Fortrydelse og refundering</h2>
        <p><a className="p-button" href="/withdraw">Fortryd aftale</a></p>
        <p>
          Den planlagte løsning behandles som en tidsbegrænset digital tjeneste
          med tilknyttet digitalt indhold. Den endelige klassifikation skal
          gennemgås før salg. Vi kræver ikke afkald på fortrydelsesretten ved
          start: du beholder 14 dages fortrydelsesret fra aftalens indgåelse,
          også hvis du tager tjenesten i brug straks.
        </p>
        <p>
          Du kan give en tydelig meddelelse under Profil → Mit køb → Fortryd
          køb, eller kontakte support med ordrenummeret. Begrundelse er ikke
          nødvendig. Du kan også skrive: “Jeg meddeler herved, at jeg ønsker at
          fortryde mit køb af SHAZ — 100 DAY TRANSFORMATION, købt [dato], ordre
          [nummer], navn og e-mail [oplysninger].”
        </p>
        <p>
          En rettidig fortrydelse behandles uden unødig forsinkelse, og
          tilbagebetaling sker senest 14 dage efter meddelelsen til det
          oprindelige betalingsmiddel. Adgang lukkes ved fuld refundering. En
          gemt anmodning er ikke i sig selv en udført tilbagebetaling.
        </p>
        <h2>Fejl og reklamation</h2>
        <p>
          Kontakt support ved adgangsfejl eller mangler. Oplys ordrenummer og en
          kort beskrivelse uden følsomme helbredsoplysninger. Dine ufravigelige
          rettigheder efter dansk forbrugerret begrænses ikke af disse vilkår.
          Klagevejledning og relevant klageinstans fastlægges med sælgerens
          virksomhedsoplysninger før lancering.
        </p>
        <h2>Tekniske krav og personlig brug</h2>
        <p>
          Platformen kræver internet, en opdateret browser, JavaScript og adgang
          til den anvendte e-mail. Den virker på mobil og computer. Adgangen er
          personlig; loginlinks må ikke deles. Driftsafbrydelser og vedligehold
          kan forekomme. Ved længerevarende mangler kontaktes support.
        </p>
        <p className="p-note">
          Grundlag gennemgået:{" "}
          <a href="https://forbrugerombudsmanden.dk/alle-emner/forbrugeraftaler/fortrydelse">
            Forbrugerombudsmandens vejledning
          </a>{" "}
          og{" "}
          <a href="https://forbrug.dk/emner/nethandel-og-digitale-tjenester/koeb-og-levering-af-digitalt-indhold">
            forbrug.dk om digitale ydelser
          </a>
          . En vejledende vurdering erstatter ikke ejerens endelige juridiske
          gennemgang.
        </p>
      </article>
    </main>
  );
}
