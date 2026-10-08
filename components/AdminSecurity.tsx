"use client";
import { useState } from "react";
import SecondFactor from "./SecondFactor";
export default function AdminSecurity({
  enabled,
  hasPassword,
}: {
  enabled: boolean;
  hasPassword: boolean;
}) {
  const [password, setPassword] = useState(""),
    [setup, setSetup] = useState<{
      totpURI: string;
      backupCodes: string[];
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">ADMINISTRATORSIKKERHED</span>
        <h1>
          {enabled ? "Bekræft, at det er dig." : "Beskyt administrationen."}
        </h1>
        <p>
          Administration kræver en ekstra kode. Bekræftelsen gælder kun denne
          session i 30 minutter. Dit almindelige kundeområde er uændret.
        </p>
        {!enabled && !setup && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const r = await fetch("/api/auth/two-factor/enable", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(hasPassword ? { password } : {}),
                });
                const d = await r.json();
                if (!r.ok)
                  throw Error(
                    "Opsætningen kunne ikke startes. Kontrollér adgangskoden, eller log ind igen.",
                  );
                setSetup(d);
                setPassword("");
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Forbindelsen blev afbrudt.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {hasPassword && (
              <label>
                Din nuværende adgangskode
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {!hasPassword && (
              <p>
                Din eksisterende e-maillink-konto bevares. Tilføj nu
                godkendelsesappen som ekstra faktor.
              </p>
            )}
            <button className="p-button" disabled={busy}>
              {busy ? "Klargør…" : "Opsæt godkendelsesapp"}
            </button>
          </form>
        )}
        {setup && (
          <>
            <p>
              Tilføj en tidsbaseret konto i din godkendelsesapp med navnet SHAZ
              og denne nøgle. Nøglen bliver kun vist her — del den ikke.
            </p>
            <label>
              Manuel opsætningsnøgle
              <input
                readOnly
                autoComplete="off"
                value={new URL(setup.totpURI).searchParams.get("secret") || ""}
              />
            </label>
            <details>
              <summary>Gem dine gendannelseskoder sikkert</summary>
              <p>
                Hver kode kan bruges én gang. Gem dem i din
                adgangskodeadministrator, inden du fortsætter.
              </p>
              <ul>
                {setup.backupCodes.map((c) => (
                  <li key={c}>
                    <code>{c}</code>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
        {(enabled || setup) && <SecondFactor next="/admin" />}
        {error && (
          <p className="p-error" role="alert">
            {error}
          </p>
        )}
        <a href="/app/profile">Tilbage til min konto</a>
      </section>
    </main>
  );
}
