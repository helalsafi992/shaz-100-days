"use client";
import { useState } from "react";
export default function Confirmation({
  email,
  paid,
}: {
  email: string;
  paid: boolean;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">DIT NÆSTE SKRIDT</span>
        <h1>{paid ? "Tjek din indbakke." : "Vi afventer bekræftelsen."}</h1>
        <p>
          {paid
            ? `Dit køb er bekræftet. Vi sender et sikkert loginlink til ${email}. Åbn linket for at bekræfte e-mailen og tilpasse din plan.`
            : "Adgang åbnes først, når Stripe har bekræftet betalingen. Du kan genindlæse om lidt. Ved afbrudt eller afvist betaling oprettes ingen adgang."}
        </p>
        {paid ? (
          <button
            disabled={busy}
            className="p-button"
            onClick={async () => {
              setBusy(true);
              try {
                const r = await fetch("/api/login/request", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const d = await r.json();
                setMessage(d.message || d.error);
              } catch {
                setMessage("Prøv igen om lidt.");
              }
              setBusy(false);
            }}
          >
            {busy ? "Sender…" : "Send et nyt loginlink"}
          </button>
        ) : (
          <a className="p-button" href="/checkout/success">
            Kontrollér igen
          </a>
        )}
        {message && <p role="status">{message}</p>}
        <a href="/checkout">Tilbage</a>
      </section>
    </main>
  );
}
