"use client";
import { useEffect, useState } from "react";
export default function Login() {
  const [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = new URLSearchParams(location.hash.slice(1)).get("token");
    if (t) {
      setToken(t);
      history.replaceState(null, "", "/login");
    }
    if (new URLSearchParams(location.search).has("error"))
      setMessage("Linket er udløbet eller allerede brugt. Bed om et nyt link.");
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/login/" + (token ? "verify" : "request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(token ? { token } : { email }),
      });
      const d = await r.json();
      if (!r.ok) {
        setMessage(d.error);
        if (token) setToken("");
      } else if (token) location.href = "/app";
      else setMessage(d.message);
    } catch {
      setMessage("Forbindelsen blev afbrudt. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">DIT 100-DAGES FORLØB</span>
        <h1>{token ? "Velkommen tilbage." : "Én mail. Så er du inde."}</h1>
        <p>
          Dit sikre engangslink gælder i 15 minutter. Ingen adgangskode at
          huske.
        </p>
        <form onSubmit={submit}>
          {!token && (
            <label>
              E-mailen fra dit køb
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          <button className="p-button" disabled={busy}>
            {busy
              ? "Et øjeblik…"
              : token
                ? "Bekræft og log ind"
                : "Send loginlink"}
          </button>
        </form>
        {message && (
          <p className="p-notice" role="status">
            {message}
          </p>
        )}
        <p className="p-muted">
          Login kræver et verificeret køb eller en administratorinvitation.
        </p>
        <a href="/demo">Se præsentationsdemoen</a>
      </section>
    </main>
  );
}
