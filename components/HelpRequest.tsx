"use client";
import { useState, useRef } from "react";
export default function HelpRequest({
  withdrawal = false,
}: {
  withdrawal?: boolean;
}) {
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [order, setOrder] = useState(""),
    [message, setMessage] = useState(""),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState<any>(null);
  const key = useRef<string | null>(null);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      key.current ??= crypto.randomUUID();
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: withdrawal ? "withdrawal" : "support",
          name,
          email,
          orderReference: order,
          message,
          idempotencyKey: key.current,
          confirmed: !withdrawal || confirm,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setReceipt(d);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Henvendelsen kunne ikke gemmes. Prøv igen med de samme oplysninger.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <section className="p-card" role="status">
        <h2>
          {withdrawal
            ? "Din fortrydelse er modtaget"
            : "Din henvendelse er gemt"}
        </h2>
        <p>
          Sagsnummer: <strong>{receipt.id}</strong>
        </p>
        <p>Modtaget: {new Date(receipt.createdAt).toLocaleString("da-DK")}</p>
        <p>
          {withdrawal
            ? "Erklæringen er registreret med tidspunktet ovenfor. Den er ikke i sig selv en gennemført tilbagebetaling. Vi kontrollerer købet og behandler henvendelsen."
            : "Din besked afventer behandling. Dette er support til produktet, ikke personlig coaching."}
        </p>
        <p>
          {receipt.mailConfigured
            ? "Kvitteringen er lagt i mailkø. Levering til din indbakke er endnu ikke bekræftet."
            : "E-mail er ikke tilsluttet. Gem denne kvittering med sagsnummer og tidspunkt."}
        </p>
        <button className="p-secondary" onClick={() => window.print()}>
          Gem eller udskriv kvittering
        </button>
      </section>
    );
  return (
    <form
      className="p-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (withdrawal && !confirm) {
          setConfirm(true);
          return;
        }
        void submit();
      }}
    >
      <h2>
        {withdrawal
          ? confirm
            ? "Bekræft fortrydelse"
            : "Fortryd aftale"
          : "Skriv til SHAZ"}
      </h2>
      <p>
        {withdrawal
          ? "Du behøver ikke logge ind. Oplys nok til, at vi kan identificere aftalen. En begrundelse er ikke nødvendig."
          : "Undlad diagnoser, kortoplysninger og adgangskoder."}
      </p>
      <label>
        Navn
        <input
          required
          value={name}
          autoComplete="name"
          maxLength={100}
          onChange={(e) => {
            setName(e.target.value);
            setConfirm(false);
          }}
        />
      </label>
      <label>
        E-mail til kvittering
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setConfirm(false);
          }}
        />
      </label>
      <label>
        Ordrenummer eller købsdato{!withdrawal && " (valgfrit)"}
        <input
          required={withdrawal}
          value={order}
          maxLength={100}
          onChange={(e) => {
            setOrder(e.target.value);
            setConfirm(false);
          }}
        />
      </label>
      {!withdrawal && (
        <label>
          Din besked
          <textarea
            required
            value={message}
            maxLength={3000}
            rows={5}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      )}
      {confirm && (
        <p className="p-notice">
          Jeg, {name}, meddeler herved, at jeg ønsker at fortryde aftalen om
          SHAZ — 100 dages forløb, identificeret ved {order}. Kvittering ønskes
          til {email}.
        </p>
      )}
      {error && (
        <p role="alert" className="p-error">
          {error}
        </p>
      )}
      <button className="p-button" disabled={busy}>
        {busy
          ? "Gemmer…"
          : withdrawal
            ? confirm
              ? "Bekræft fortrydelse"
              : "Fortsæt til bekræftelse"
            : "Send henvendelse"}
      </button>
    </form>
  );
}
