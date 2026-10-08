"use client";
import { useEffect, useState } from "react";
export default function Confirmation({
  email,
  verified,
}: {
  email: string;
  verified: boolean;
}) {
  const [state, setState] = useState({ status: "pending", verified }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let stopped = false,
      t: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const r = await fetch("/api/checkout/status", { cache: "no-store" });
        if (stopped) return;
        if (r.status === 401) {
          location.replace("/login?next=checkout");
          return;
        }
        if (!r.ok) throw Error();
        const d = await r.json();
        if (d.granted) {
          location.replace("/app");
          return;
        }
        setState(d);
      } catch {
        if (!stopped)
          setMessage("Forbindelsen er afbrudt. Vi forsøger igen automatisk.");
      }
      if (!stopped) t = setTimeout(poll, 4000);
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(t);
    };
  }, []);
  async function resend() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL: "/checkout/success" }),
      });
      setMessage(
        r.ok
          ? "En ny bekræftelsesmail er sendt."
          : "Mailen kunne ikke sendes. Prøv igen om lidt.",
      );
    } catch {
      setMessage("Kontrollér forbindelsen og prøv igen.");
    }
    setBusy(false);
  }
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">DIN ADGANG</span>
        <h1>
          {state.status === "paid"
            ? "Dit køb er bekræftet."
            : state.status === "none"
              ? "Din konto er klar."
              : "Vi afventer betalingen."}
        </h1>
        <p>
          {state.status === "paid"
            ? "Du går automatisk videre, når din e-mail er bekræftet."
            : state.status === "none"
              ? "Kontoen giver ikke produktadgang, før et køb er verificeret."
              : "Vi kontrollerer automatisk Stripes betalingsbekræftelse. Det giver ikke adgang at åbne denne adresse."}
        </p>
        {!state.verified && (
          <>
            <p>
              Bekræftelsesmailen er sendt til <b>{email}</b>. Åbn den for at
              bekræfte din konto. Du skal ikke skrive e-mailen igen.
            </p>
            <button className="p-secondary" disabled={busy} onClick={resend}>
              Send bekræftelsen igen
            </button>
          </>
        )}
        <p role="status">{message}</p>
        <a className="p-secondary" href="/checkout">
          Til checkout / genoptag betaling
        </a>
        <p className="p-note">
          Har Stripe trukket beløbet, skal du ikke starte en ny betaling.
          Kontrollér igen senere eller kontakt support via handelsvilkårene.
        </p>
      </section>
    </main>
  );
}
