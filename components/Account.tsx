"use client";
import { useState } from "react";
type Order = {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  livemode: boolean;
  receipt: { termsText?: string };
};
export default function Account({
  email,
  orders,
}: {
  email: string;
  orders: Order[];
}) {
  const [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(path: string, data: unknown) {
    setBusy(true);
    try {
      const r = await fetch("/api/platform/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      setMessage(d.message || d.error);
      if (r.ok && path === "delete") location.href = "/login";
    } catch {
      setMessage("Forbindelsen blev afbrudt. Prøv igen.");
    }
    setBusy(false);
  }
  return (
    <main className="portal p-main">
      <header className="p-top">
        <a className="logo" href="/app">
          SHAZ
        </a>
        <a href="/app">← Til dit forløb</a>
      </header>
      <div className="p-page-heading">
        <div>
          <span className="p-eyebrow">PROFIL & INDSTILLINGER</span>
          <h1>Din konto. Dine valg.</h1>
          <p>{email}</p>
        </div>
      </div>
      {message && (
        <p className="p-notice" role="status">
          {message}
        </p>
      )}
      <div className="p-grid">
        <section className="p-card">
          <h2>Tilpas dit forløb.</h2>
          <p>
            Skift mål, niveau, udstyr eller kostpræferencer. Gennemførte
            træninger bevares.
          </p>
          <a className="p-button" href="/onboarding?edit=1">
            Tilpas min plan
          </a>
          <p className="p-note">
            Vælg portionsvejledning for at fjerne kropsoplysninger fra
            energiberegningen.
          </p>
          <button
            className="p-secondary"
            disabled={busy}
            onClick={() => action("clear-weights", {})}
          >
            Slet frivillige vægtregistreringer
          </button>
        </section>
        <section className="p-card">
          <h2>Mit køb.</h2>
          {!orders.length && <p>Der er ingen ordrer på kontoen.</p>}
          {orders.map((o) => (
            <div key={o.id}>
              <span className="p-eyebrow">
                {o.livemode ? "ORDRE" : "TESTORDRE"}
              </span>
              <h3>SHAZ — 100 dage · 399 kr.</h3>
              <p>
                Status:{" "}
                {(
                  {
                    paid: "Betalt",
                    refunded: "Refunderet",
                    disputed: "Indsigelse",
                    pending: "Afventer",
                    failed: "Mislykket",
                  } as Record<string, string>
                )[o.status] || o.status}
              </p>
              <p className="p-note">
                {o.id}
                <br />
                {new Date(o.created_at).toLocaleDateString("da-DK")}
              </p>
              <details>
                <summary>Ordrevilkår</summary>
                <p>{o.receipt.termsText}</p>
              </details>
              <button
                className="p-secondary"
                disabled={busy || o.status === "refunded"}
                onClick={() =>
                  action("refund", { orderId: o.id, reason: "withdrawal" })
                }
              >
                Fortryd køb / anmod om refundering
              </button>
            </div>
          ))}
          <p className="p-note">
            Anmodningen gemmes med tidspunkt. Den er ikke en automatisk
            refundering. En administrator behandler den og følger op.
          </p>
        </section>
        <section className="p-card">
          <h2>Dine oplysninger.</h2>
          <a className="p-secondary" href="/api/platform/export">
            Download mine data
          </a>
          <details>
            <summary>Slet min konto</summary>
            <p>
              Din profil, planer, træninger, madplan og vægtdata slettes.
              Nødvendige købsoplysninger opbevares særskilt efter lovkrav. Bed
              om refundering først, hvis du ønsker at fortryde.
            </p>
            <label>
              Skriv SLET MIN KONTO
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <button
              className="p-danger"
              disabled={busy || confirm !== "SLET MIN KONTO"}
              onClick={() => action("delete", { confirmation: confirm })}
            >
              Slet konto og forløbsdata
            </button>
          </details>
        </section>
        <section className="p-card">
          <h2>Hjælp & adgang.</h2>
          <a href="/terms">Handelsvilkår</a>
          <br />
          <a href="/privacy">Privatlivspolitik</a>
          <br />
          <a href="/admin">Administration</a>
          <button
            className="p-secondary"
            onClick={async () => {
              const r = await fetch("/api/auth/sign-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
              });
              if (r.ok) location.href = "/login";
              else setMessage("Kunne ikke logge ud. Prøv igen.");
            }}
          >
            Log ud
          </button>
        </section>
      </div>
    </main>
  );
}
