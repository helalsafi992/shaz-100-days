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
  test = false,
  isAdmin = false,
  support,
}: {
  email: string;
  isAdmin?: boolean;
  support?: string;
  test?: boolean;
  orders: Order[];
}) {
  const [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState("");
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
          <h1>Profil og indstillinger.</h1>
          <p>{email}</p>
        </div>
      </div>
      {message && (
        <p className="p-notice" role="status">
          {message}
        </p>
      )}
      {test && (
        <details className="p-card">
          <summary>Testværktøjer · kun dette isolerede miljø</summary>
          <span className="p-eyebrow">DIN TESTPROFIL</span>
          <h2>Prøv hele forløbet.</h2>
          <p>
            Nulstilling sletter kun dine fiktive planer og registreringer her.
            Din konto og adgangskode bevares.
          </p>
          <div className="p-actions">
            {[false, true].map((populated) => (
              <button
                className="p-secondary"
                key={String(populated)}
                disabled={busy}
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Nulstil din testprofil og dens registreringer?",
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    const r = await fetch("/api/test/profile", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ populated }),
                    });
                    if (!r.ok) throw new Error();
                    location.href = populated ? "/app" : "/onboarding";
                  } catch {
                    setMessage("Nulstillingen kunne ikke gennemføres.");
                    setBusy(false);
                  }
                }}
              >
                {populated
                  ? "Gendan udfyldt testprofil"
                  : "Nulstil og prøv onboarding"}
              </button>
            ))}
          </div>
          {isAdmin && <a href="/admin">Åbn testadministration</a>}
        </details>
      )}
      <div className="p-grid">
        <section className="p-card">
          <h2>Hjælp og dine rettigheder.</h2>
          <div className="p-actions">
            <a className="p-secondary" href="/help">
              Kontakt support
            </a>
            <a className="p-secondary" href="/withdraw">
              Fortryd aftale
            </a>
          </div>
        </section>
        <section className="p-card">
          <h2>Tilpas dit forløb.</h2>
          <p>
            Skift mål, niveau, udstyr eller kostpræferencer. Gennemførte
            træninger bevares.
          </p>
          <a className="p-button" href="/onboarding?edit=1">
            Tilpas min plan
          </a>
          <p>
            <a className="p-secondary" href="/app/training#pause">
              Pause ved sygdom eller rejse
            </a>
          </p>
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
          <h2>Adgangskode.</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const r = await fetch("/api/auth/change-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    revokeOtherSessions: true,
                  }),
                });
                const d = await r.json();
                if (!r.ok)
                  throw Error(d.message || "Adgangskoden kunne ikke ændres.");
                setCurrentPassword("");
                setNewPassword("");
                setMessage(
                  "Adgangskoden er ændret. Andre enheder er logget ud.",
                );
              } catch (e) {
                setMessage(e instanceof Error ? e.message : "Prøv igen.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Nuværende adgangskode
              <input
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label>
              Ny adgangskode
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <button className="p-secondary" disabled={busy}>
              Gem ny adgangskode
            </button>
          </form>
          <p className="p-note">
            Har du hidtil brugt e-maillink? Brug{" "}
            <a href="/login?action=forgot">Glemt adgangskode</a> til at oprette
            din første adgangskode.
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
          {isAdmin && <a href="/admin">Administration</a>}
          {support && (
            <p>
              <a href={"mailto:" + support}>Kontakt support</a>
            </p>
          )}
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
