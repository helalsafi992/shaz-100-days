export default function Preview() {
  return (
    <main className="portal p-main">
      <header className="p-top">
        <a className="logo" href="/">
          SHAZ
        </a>
        <a href="/demo">Prøv præsentationsdemoen →</a>
      </header>
      <div className="p-page-heading">
        <div>
          <span className="p-eyebrow">INDE I DIT 100-DAGES FORLØB</span>
          <h1>
            Din hverdag.
            <br />
            Samlet ét sted.
          </h1>
          <p>
            Faktiske skærmbilleder fra den implementerede kundeplatform.
            Oplysninger og registreringer kommer fra fiktive testkonti og er
            ikke kunders resultater. Salg og kundeinvitationer er under
            klargøring.
          </p>
        </div>
      </div>
      <section className="p-card product-tour">
        <span className="p-eyebrow">01 / I DAG</span>
        <h2>Næste skridt er tydeligt.</h2>
        <p>Dagens pas, ugens fokus og din egen registrerede fremgang.</p>
        <img
          loading="lazy"
          src="/platform-desktop.jpg"
          alt="Det implementerede SHAZ-dashboard fra en fiktiv testkonto"
          width="1440"
          height="1400"
        />
      </section>
      <section className="p-card product-tour">
        <span className="p-eyebrow">02 / MAD</span>
        <h2>Opskrifter, du kan vælge imellem.</h2>
        <p>
          Søgning, kostfiltre, favoritter og portionsberegning. Råvarernes
          datakilder er tilgængelige i hver opskrift.
        </p>
        <img
          loading="lazy"
          src="/recipe-library.jpg"
          alt="Opskriftsbiblioteket i SHAZ med søgning og kostfiltre"
          width="1200"
          height="1200"
        />
      </section>
      <div className="p-actions">
        <a className="p-button" href="/checkout">
          Se forløbet — 399 kr.
        </a>
        <a className="p-secondary" href="/login">
          Log ind
        </a>
      </div>
    </main>
  );
}
