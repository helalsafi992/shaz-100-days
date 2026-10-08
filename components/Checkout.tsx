"use client";
import { useState } from "react";
export default function Checkout({
  open,
  email,
  cancelled = false,
}: {
  open: boolean;
  email?: string;
  cancelled?: boolean;
}) {
  const [adult, setAdult] = useState(false),
    [terms, setTerms] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function buy() {
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adult, terms }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      location.href = d.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prøv igen.");
      setBusy(false);
    }
  }
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">100 DAY TRANSFORMATION</span>
        {cancelled && (
          <p className="p-notice" role="status">
            Betalingsforløbet blev afbrudt. Der er ikke givet adgang. Hvis du
            mener, at betalingen er gennemført, så kontrollér din e-mail og
            ordre, før du prøver igen.
          </p>
        )}
        <h1>
          Én beslutning.
          <br />
          100 dage med retning.
        </h1>
        <div className="checkout-price">
          399 <span>kr. i alt</span>
        </div>
        <p>
          Én betaling. Intet abonnement. Træning, kostinspiration og
          registrering af din fremgang.
        </p>
        <ul>
          <li>100 aktive kalenderdage fra din valgte startdato</li>
          <li>Hjemme eller fitness · begynder eller let øvet</li>
          <li>Opskrifter, madplan og indkøbsliste</li>
          <li>14 dages fortrydelsesret fra købet</li>
        </ul>
        <p className="p-note">
          Til voksne uden behov for et medicinsk tilpasset forløb. Selvstyret
          træning og generel kostinspiration. Ingen 1:1-coaching eller garanti
          for resultater.
        </p>
        {open && !email ? (
          <>
            <p>Opret en konto og bekræft din e-mail, før du køber adgang.</p>
            <a className="p-button" href="/login?action=signup">
              Opret konto
            </a>
            <a className="p-secondary" href="/login">
              Jeg har allerede en konto
            </a>
          </>
        ) : open ? (
          <>
            <label className="p-check">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
              />
              Jeg er mindst 18 år og har læst målgruppe og begrænsninger.
            </label>
            <label className="p-check">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              Jeg accepterer <a href="/terms">handelsvilkårene</a> og har læst{" "}
              <a href="/privacy">privatlivspolitikken</a>.
            </label>
            <button
              className="p-button"
              disabled={!adult || !terms || busy}
              onClick={buy}
            >
              {busy
                ? "Åbner sikker betaling…"
                : "Køb med betalingspligt — 399 kr."}
            </button>
            <p className="p-note">
              Din konto-e-mail ({email}) genbruges hos Stripe. Vi modtager
              aldrig dit kortnummer.
            </p>
          </>
        ) : (
          <>
            <p className="p-notice">
              SHAZ er under færdiggørelse. Rigtige køb er endnu ikke åbnet.
            </p>
            <a className="p-button" href="/preview">
              Se præsentationsdemoen →
            </a>
            <a className="p-secondary" href="/login">
              Har du allerede adgang? Log ind
            </a>
          </>
        )}
        {error && <p className="p-error">{error}</p>}
      </section>
    </main>
  );
}
