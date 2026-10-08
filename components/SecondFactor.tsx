"use client";
import { useState } from "react";
export default function SecondFactor({
  next = "/app",
}: {
  next?: "/app" | "/admin" | "/checkout";
}) {
  const [code, setCode] = useState(""),
    [backup, setBackup] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await fetch(
            "/api/auth/two-factor/" +
              (backup ? "verify-backup-code" : "verify-totp"),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: code.trim(), trustDevice: false }),
            },
          );
          if (!r.ok)
            throw Error(
              "Koden blev ikke godkendt. Kontrollér koden, eller log ind igen hvis forsøget er udløbet.",
            );
          setCode("");
          location.assign(next);
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Forbindelsen blev afbrudt.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {backup ? "Gendannelseskode" : "Kode fra din godkendelsesapp"}
        <input
          autoFocus
          required
          autoComplete="one-time-code"
          inputMode={backup ? "text" : "numeric"}
          maxLength={backup ? 64 : 6}
          pattern={backup ? undefined : "[0-9]{6}"}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      <button className="p-button" disabled={busy}>
        {busy ? "Kontrollerer…" : "Bekræft kode"}
      </button>
      <button
        className="p-secondary"
        type="button"
        onClick={() => {
          setBackup(!backup);
          setCode("");
          setError("");
        }}
      >
        {backup ? "Brug godkendelsesapp" : "Brug en gendannelseskode"}
      </button>
      {error && (
        <p role="alert" className="p-error">
          {error}
        </p>
      )}
    </form>
  );
}
