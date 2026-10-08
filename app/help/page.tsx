import HelpRequest from "@/components/HelpRequest";
export default function Help() {
  return (
    <main className="portal p-main">
      <header className="p-top">
        <a className="logo" href="/">
          SHAZ
        </a>
        <a href="/app/profile">Min konto</a>
      </header>
      <h1>Hjælp til dit forløb.</h1>
      <section className="p-card">
        <h2>De hurtige svar</h2>
        <details>
          <summary>Jeg kan ikke logge ind</summary>
          <p>
            Brug din konto-e-mail og adgangskode. På login-siden kan du bede om
            en ny adgangskode. Et køb eller ordrenummer er ikke et login.
          </p>
          <a href="/login">Gå til login</a>
        </details>
        <details>
          <summary>Min betaling afventer</summary>
          <p>
            Betal ikke igen. Åbn betalingsstatus med samme konto; adgang gives
            først efter serverens betalingskontrol.
          </p>
          <a href="/checkout/success">Kontrollér min betaling</a>
        </details>
        <details>
          <summary>Hvordan ændrer jeg min plan?</summary>
          <p>
            Under Profil → Tilpas min plan kan du ændre steder, dage og mad. Du
            ser ændringerne før du bekræfter. Gennemførte registreringer
            bevares.
          </p>
        </details>
        <p>
          <a className="p-secondary" href="/withdraw">
            Fortryd aftale
          </a>
        </p>
        {process.env.SUPPORT_EMAIL && (
          <p>
            Kontakt:{" "}
            <a href={`mailto:${process.env.SUPPORT_EMAIL}`}>
              {process.env.SUPPORT_EMAIL}
            </a>
          </p>
        )}
      </section>
      <HelpRequest />
    </main>
  );
}
