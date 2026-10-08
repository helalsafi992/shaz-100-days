import { headers } from "next/headers";
import { access } from "@/lib/auth";
import { salesOpen } from "@/lib/payments";
export const dynamic = "force-dynamic";
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
export default async function Home() {
  const entitled = await access(await headers())
    .then(() => true)
    .catch(() => false);
  const open = salesOpen();
  function Buy({ className = "button accent" }: { className?: string }) {
    return entitled ? (
      <a className={className} href="/app">
        Mit forløb
      </a>
    ) : open ? (
      <a className={className} href="/checkout">
        Køb forløbet – 399 kr.
      </a>
    ) : (
      <button
        className={className}
        disabled
        aria-label="Køb forløbet – 399 kr. Salg er ikke åbnet"
      >
        Køb forløbet – 399 kr.
      </button>
    );
  }
  return (
    <>
      <header className="header">
        <a className="logo" href="/">
          SHAZ<span>100 DAY SYSTEM</span>
        </a>
        <nav>
          <a href="#indhold">Det får du</a>
        </nav>
        <div className="sales-header-actions">
          <a className="sales-login" href={entitled ? "/app" : "/login"}>
            {entitled ? "Mit forløb" : "Log ind"}
          </a>
          <Buy className="navcta" />
        </div>
      </header>
      <main>
        <section className="hero conversionhero">
          <div className="herogrid">
            <div>
              <span className="eyebrow">ET SYSTEM. 100 DAGE. DIN HVERDAG.</span>
              <h1>
                Din træning.
                <br />
                Din madplan.
                <br />
                <span>Dine næste 100 dage.</span>
              </h1>
              <p className="herodesc">
                Træning, cardio og måltider samlet i ét forløb, tilpasset dine
                valg.
              </p>
              <div className="hero-price">
                399 kr. <span>Én gang. Intet abonnement.</span>
              </div>
              <div className="hero-actions">
                <Buy />
                <a className="secondary" href="#indhold">
                  SE HVAD DU FÅR
                </a>
              </div>
              {!open && !entitled && (
                <p className="launch-note" role="status">
                  Salg er ikke åbnet endnu. Har du adgang?{" "}
                  <a href="/login">Log ind på dit forløb</a>.
                </p>
              )}
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
              <div className="real-product-preview">
                <img
                  src="/platform-preview.jpg"
                  width="390"
                  height="844"
                  alt="SHAZ-kundeområdet vist fra en fiktiv testkonto"
                />
              </div>
              <p className="preview-caption">
                Faktisk produktvisning · Fiktiv testkonto{" "}
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
                "Styrke til hjemmet eller fitness, valgfri cardio og én samlet ugeplan.",
              ],
              [
                "02",
                "MAD, DER PASSER TIL DIG",
                "Kalorieberegning, 2–6 måltider, tre egnede valg og en indkøbsliste, der følger din plan.",
              ],
              [
                "03",
                "STYR PÅ DIN FREMGANG",
                "Registrér sæt, vægt og cardio. Se din faktiske udvikling og tilpas kommende uger.",
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
            <Buy />
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
              <li>100 dage med træning og restitution</li>
              <li>Styrkeprogram og valgfri cardio</li>
              <li>Kalorieberegning, madplan & opskrifter</li>
              <li>Indkøbslister & ugentlige mål</li>
              <li>Dit personlige overblik</li>
            </ul>
            <Buy className="button" />
            <small>
              {open
                ? "Samlet kundepris. Ingen skjulte gebyrer."
                : "Salg er ikke åbnet. Eksisterende kunder kan logge ind."}
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
          {process.env.SUPPORT_EMAIL && (
            <a href={"mailto:" + process.env.SUPPORT_EMAIL}>Kontakt</a>
          )}
          <a href="/privacy">Privatliv</a>
          <a href="/terms">Vilkår</a>
        </div>
        <span>
          {process.env.SELLER_NAME
            ? `${process.env.SELLER_NAME} · CVR ${process.env.SELLER_CVR} · ${process.env.SELLER_ADDRESS}`
            : "Sælger- og kontaktoplysninger offentliggøres, før salg åbner."}
        </span>
      </footer>
      <div className="mobilebuy">
        <div>
          <b>399 kr.</b>
          <span>Én gang. 100 dage.</span>
        </div>
        <Buy />
      </div>
    </>
  );
}
