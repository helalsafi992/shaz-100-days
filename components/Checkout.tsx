"use client";
import { useState } from "react";
export default function Checkout({
  open,
  email,
  verified = false,
  cancelled = false,
}: {
  open: boolean;
  email?: string;
  verified?: boolean;
  cancelled?: boolean;
}) {
  const [account, setAccount] = useState(email || ""),
    [mode, setMode] = useState<"signup" | "login">("signup"),
    [name, setName] = useState(""),
    [address, setAddress] = useState(""),
    [password, setPassword] = useState(""),
    [adult, setAdult] = useState(false),
    [terms, setTerms] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmed, setConfirmed] = useState(verified);
  async function post(path: string, data: unknown) {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok)
      throw new Error(
        d.error?.message ||
          (typeof d.error === "string" ? d.error : d.message) ||
          "Kontrollér oplysningerne og prøv igen.",
      );
    return d;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!account) {
        const d = await post(
          "/api/auth/" +
            (mode === "signup" ? "sign-up/email" : "sign-in/email"),
          { name, email: address, password, callbackURL: "/checkout" },
        );
        setAccount(d.user.email);
        setConfirmed(d.user.emailVerified);
        setPassword("");
      }
      const status = await fetch("/api/checkout/status", { cache: "no-store" });
      const state = await status.json();
      if (state.granted) {
        location.assign("/app");
        return;
      }
      const d = await post("/api/checkout", { adult, terms });
      location.assign(d.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke åbne betaling.");
      setBusy(false);
    }
  }
  return (
    <main className="portal auth-page">
      <header className="p-top">
        <a className="logo" href="/">
          SHAZ
        </a>
        <a href="/login">Log ind</a>
      </header>
      <div className="checkout-layout">
        <section className="p-card checkout-summary">
          <span className="p-eyebrow">SHAZ · 100 DAGES FORLØB</span>
          <h1>Dine næste 100 dage.</h1>
          <div className="checkout-price">
            399 <span>kr. i alt</span>
          </div>
          <p>Én gang. Intet abonnement.</p>
          <ul>
            <li>Styrke og valgfri cardio</li>
            <li>Kalorieberegning og fleksibel madplan</li>
            <li>Opskrifter og din egen indkøbsliste</li>
            <li>Registrering af træning og fremgang</li>
          </ul>
          <p className="p-note">
            100 kalenderdage inklusive restitution fra den startdato, du selv
            vælger. Selvstyret forløb til voksne, uden 1:1-coaching eller
            resultatgaranti. Du beholder 14 dages fortrydelsesret.
          </p>
          <a href="/terms">Handelsvilkår</a> · <a href="/privacy">Privatliv</a>
        </section>
        <section className="p-card">
          {cancelled && (
            <p className="p-notice" role="status">
              Betalingen blev afbrudt. Din konto er bevaret. Fortsæt for at
              genåbne den samme, uafsluttede betaling.
            </p>
          )}
          {!open ? (
            <>
              <h2>Salget er ikke åbnet.</h2>
              <p>
                Betaling bliver først tilgængelig, når forløbet og
                betalingsopsætningen er godkendt.
              </p>
              <button className="p-button" disabled>
                Betal 399 kr.
              </button>
              <p>
                <a href="/login">Har du allerede adgang? Log ind</a>
              </p>
            </>
          ) : (
            <form onSubmit={submit}>
              <h2>{account ? "Klar til betaling" : "Konto og betaling"}</h2>
              {!account ? (
                <>
                  <div className="checkout-tabs">
                    <button
                      type="button"
                      className="p-secondary"
                      aria-pressed={mode === "signup"}
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                    >
                      Opret konto
                    </button>
                    <button
                      type="button"
                      className="p-secondary"
                      aria-pressed={mode === "login"}
                      onClick={() => {
                        setMode("login");
                        setError("");
                      }}
                    >
                      Jeg har en konto
                    </button>
                  </div>
                  {mode === "signup" && (
                    <label>
                      Navn
                      <input
                        autoComplete="name"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                  )}
                  <label>
                    E-mail
                    <input
                      type="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </label>
                  <label>
                    Adgangskode
                    <input
                      type="password"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      minLength={mode === "signup" ? 12 : 1}
                      maxLength={128}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {mode === "signup" && <small>Mindst 12 tegn.</small>}
                  </label>
                  {mode === "login" && (
                    <a href="/login?action=forgot">Glemt adgangskode?</a>
                  )}
                </>
              ) : (
                <p>
                  Din konto: <b>{account}</b>
                  {!confirmed && (
                    <small>
                      {" "}
                      · Bekræftelsesmailen er sendt. Bekræft din e-mail for at
                      åbne produktet efter betaling.
                    </small>
                  )}
                </p>
              )}
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
                <span>
                  Jeg accepterer{" "}
                  <a href="/terms" target="_blank" rel="noreferrer">
                    handelsvilkårene
                  </a>{" "}
                  og har læst{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer">
                    privatlivspolitikken
                  </a>
                  .
                </span>
              </label>
              <button className="p-button" disabled={busy || !adult || !terms}>
                {busy ? "Åbner sikker betaling…" : "Betal 399 kr."}
              </button>
              <p className="p-note">
                Betal sikkert hos Stripe. Vi gemmer aldrig dine kortoplysninger.
                Kvittering og e-mailbekræftelse sendes automatisk til kontoens
                e-mail.
              </p>
            </form>
          )}
          {error && (
            <p className="p-error" role="alert">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
