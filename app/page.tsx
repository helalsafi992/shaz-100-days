const faqs = [
  [
    "Kan jeg være med som begynder?",
    "Ja. Forløbet er lavet til begyndere og let øvede. Du vælger dit niveau efter køb.",
  ],
  [
    "Hjemme eller i fitnesscenter?",
    "Begge dele. Vælg det, der passer til din hverdag.",
  ],
  [
    "Er kosten fleksibel?",
    "Ja. Vælg blandt andet vegetarisk eller halal. Opskrifterne giver dig konkrete måltider at tage udgangspunkt i.",
  ],
  ["Er det et abonnement?", "Nej. 399 kr. én gang. Ingen løbende betaling."],
  [
    "Er det personlig coaching?",
    "Nej. Et digitalt, selvstyret forløb med tilpasning efter dine valg. Ingen 1:1-coaching eller resultatgaranti.",
  ],
];
export default function Home() {
  return (
    <>
      <header className="header">
        <a className="logo" href="/">
          SHAZ<span>100 DAY SYSTEM</span>
        </a>
        <nav>
          <a href="#indhold">DET FÅR DU</a>
          <a href="#forloeb">DE 100 DAGE</a>
          <a href="#faq">SPØRGSMÅL</a>
        </nav>
        <a className="navcta" href="/checkout">
          KØB — 399 KR.
        </a>
      </header>
      <main>
        <section className="hero conversionhero">
          <div className="herogrid">
            <div>
              <span className="eyebrow">ET SYSTEM. 100 DAGE. DIN HVERDAG.</span>
              <h1>
                100 DAGE.
                <br />
                DIN TRÆNING.
                <br />
                DIN KOST.
                <br />
                <span>DIN TRANSFORMATION.</span>
              </h1>
              <p className="herodesc">
                En plan, du kan følge. Mad, du har lyst til. Struktur, der
                passer til dig.
              </p>
              <div className="hero-price">
                399 kr. <span>Én gang. Intet abonnement.</span>
              </div>
              <div className="hero-actions">
                <a className="button accent" href="/checkout">
                  KØB FORLØBET
                </a>
                <a className="secondary" href="#indhold">
                  SE HVAD DU FÅR
                </a>
              </div>
              <p className="launch-note">
                Under klargøring · Rigtige køb er endnu ikke åbnet.{" "}
                <a href="/demo">Prøv demoen</a>
              </p>
              <div className="herochecks">
                <span>Hjemme eller fitness</span>
                <span>Tilpasset dit niveau</span>
                <span>Kost & træning samlet</span>
              </div>
            </div>
            <div className="productdevice">
              <div className="devicebar">
                <b>SHAZ / DIT FORLØB</b>
                <span>KUNDEPLATFORM</span>
              </div>
              <a className="real-product-preview" href="/preview">
                <img
                  src="/platform-preview.jpg"
                  width="390"
                  height="844"
                  alt="SHAZ-kundeområdet vist fra en fiktiv testkonto"
                />
              </a>
              <p className="preview-caption">
                Faktisk produktvisning · Fiktiv testkonto{" "}
                <a href="/preview">Se platformen →</a>
              </p>
            </div>
          </div>
        </section>
        <section className="benefitbar">
          <div>
            <strong>100</strong>
            <span>DAGE MED STRUKTUR</span>
          </div>
          <div>
            <strong>Din plan</strong>
            <span>DIT MÅL & NIVEAU</span>
          </div>
          <div>
            <strong>Træning + kost</strong>
            <span>SAMLET ÉT STED</span>
          </div>
          <div>
            <strong>399 kr.</strong>
            <span>ÉN ENGANGSBETALING</span>
          </div>
        </section>
        <section className="section compact" id="indhold">
          <span className="eyebrow">DET FÅR DU</span>
          <h2>
            ALT DET VIGTIGE.
            <br />
            INTET OVERFLØDIGT.
          </h2>
          <div className="producttiles">
            {[
              [
                "01",
                "EN PLAN FOR DIN TRÆNING",
                "Programmer til hjemmet og fitness. Øvelsesforklaringer og progression.",
              ],
              [
                "02",
                "MAD, DER PASSER TIL DIG",
                "Opskrifter, portionsvalg og indkøbslister. Med plads til dine præferencer.",
              ],
              [
                "03",
                "STYR PÅ DIN FREMGANG",
                "Dagens træning, ugens fokus og overblik over det, du har gennemført.",
              ],
            ].map(([n, h, p]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section simplehow">
          <div>
            <span className="eyebrow">FRA BESLUTNING TIL DAG ÉT</span>
            <h2>
              KØB. TILPAS.
              <br />
              KOM I GANG.
            </h2>
            <p>
              Du svarer på spørgsmålene efter køb.
              <br />
              Så passer planen til dit udgangspunkt.
            </p>
            <a className="button accent" href="/checkout">
              START DIN TRANSFORMATION
            </a>
          </div>
          <div className="journey">
            {[
              ["01", "Køb adgang", "399 kr. Én gang."],
              ["02", "Fortæl om dig", "Dit mål, niveau, hverdag og kost."],
              ["03", "Følg din plan", "100 dage med retning og overblik."],
            ].map(([n, h, p]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="section compact" id="forloeb">
          <span className="eyebrow">DINE 100 DAGE</span>
          <h2>
            FRA FØRSTE SKRIDT
            <br />
            TIL EN NY RUTINE.
          </h2>
          <div className="phasegrid">
            {[
              ["01–14", "Fundament"],
              ["15–35", "Opbygning"],
              ["36–65", "Progression"],
              ["66–85", "Konsistens"],
              ["86–100", "Næste kapitel"],
            ].map(([d, t]) => (
              <div key={d}>
                <span>DAG {d}</span>
                <h3>{t}</h3>
              </div>
            ))}
          </div>
        </section>
        <section className="section offer">
          <div>
            <span className="eyebrow">INVESTÉR I DINE NÆSTE 100 DAGE</span>
            <h2>
              ÉN BESLUTNING.
              <br />
              EN STÆRKERE
              <br />
              HVERDAG.
            </h2>
            <p className="muted">
              Begynder eller let øvet.
              <br />
              Du starter, hvor du er.
            </p>
          </div>
          <div className="offercard">
            <span className="eyebrow">SHAZ / 100 DAY TRANSFORMATION</span>
            <div className="price">
              399<span>KR.</span>
            </div>
            <p>Én engangsbetaling. Intet abonnement.</p>
            <ul>
              <li>100 dages struktureret træning</li>
              <li>Hjemme- eller fitnessprogram</li>
              <li>Kostinspiration & opskrifter</li>
              <li>Indkøbslister & ugentlige mål</li>
              <li>Dit personlige overblik</li>
            </ul>
            <a className="button" href="/checkout">
              KØB FORLØBET
            </a>
            <small>
              Salg er lukket under klargøring. Se demoen uden betaling.
            </small>
          </div>
        </section>
        <section className="faq section compact" id="faq">
          <div>
            <span className="eyebrow">GODT AT VIDE</span>
            <h2>KORT FORTALT.</h2>
          </div>
          <div>
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <a className="logo" href="/">
          SHAZ
        </a>
        <span>100 DAY TRANSFORMATION</span>
        <div>
          <a href="/login">Log ind</a>
          <a href="/preview">Se platformen</a>
          <a href="/privacy">Privatliv</a>
          <a href="/terms">Vilkår</a>
        </div>
        <span>KUNDEPLATFORM · SALG UNDER KLARGØRING</span>
      </footer>
      <div className="mobilebuy">
        <div>
          <b>399 kr.</b>
          <span>Én gang. 100 dage.</span>
        </div>
        <a className="button accent" href="/checkout">
          KØB FORLØBET
        </a>
      </div>
    </>
  );
}
