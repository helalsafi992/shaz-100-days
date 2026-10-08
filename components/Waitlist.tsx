"use client";
import { useState } from "react";
export default function Waitlist() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setStatus("");
        const f = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: f.get("email"),
              consent: f.get("consent") === "on",
              website: f.get("website"),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || "Prøv igen om lidt.");
          setDone(true);
          setStatus(
            "Du er på listen. Vi giver dig besked, når forløbet åbner.",
          );
        } catch (e) {
          setStatus(
            e instanceof Error ? e.message : "Forbindelsen fejlede. Prøv igen.",
          );
        } finally {
          setBusy(false);
        }
      }}
      className="waitlist"
    >
      {!done && (
        <>
          <label htmlFor="email">Din e-mail</label>
          <div className="emailrow">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="dig@eksempel.dk"
            />
            <button className="button accent" disabled={busy}>
              {busy ? "GEMMER…" : "SKRIV MIG OP"}
            </button>
          </div>
          <input
            className="honeypot"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
          <label className="consent">
            <input name="consent" type="checkbox" required />{" "}
            <span>
              Ja tak, SHAZ må sende mig en e-mail, når forløbet åbner. Jeg kan
              altid trække mit samtykke tilbage.{" "}
              <a href="/privacy">Læs privatlivspolitikken</a>.
            </span>
          </label>
        </>
      )}
      <p role="status" className={done ? "success" : "formstatus"}>
        {status}
      </p>
      {done && (
        <button
          type="button"
          className="textbutton"
          onClick={async () => {
            const r = await fetch("/api/waitlist", { method: "DELETE" });
            if (r.ok) {
              setDone(false);
              setStatus("Din tilmelding er slettet.");
            }
          }}
        >
          Fortryd tilmelding
        </button>
      )}
    </form>
  );
}
