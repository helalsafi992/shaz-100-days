"use client";
import { useEffect, useState } from "react";
type Mode = "login" | "signup" | "forgot" | "magic" | "verify" | "reset";
export default function Login({ test = false }: { test?: boolean }) {
  const [mode, setMode] = useState<Mode>("login"),
    [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get("token")) {
      setToken(h.get("token")!);
      setMode("magic");
    }
    if (h.get("verify")) {
      setToken(h.get("verify")!);
      setMode("verify");
    }
    if (h.get("reset")) {
      setToken(h.get("reset")!);
      setMode("reset");
    }
    if (location.hash) history.replaceState(null, "", "/login");
    const action = new URLSearchParams(location.search).get("action");
    if (action === "signup") location.replace("/checkout");
    if (action === "forgot") setMode("forgot");
  }, []);
  function switchMode(m: Mode) {
    setMode(m);
    setMessage("");
    setToken("");
    setPassword("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const endpoint =
      mode === "magic"
        ? "/api/login/" + (token ? "verify" : "request")
        : mode === "verify"
          ? "/api/login/confirm-email"
          : "/api/auth/" +
            (
              {
                login: "sign-in/email",
                signup: "sign-up/email",
                forgot: "request-password-reset",
                reset: "reset-password",
              } as Record<string, string>
            )[mode];
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "verify" || (mode === "magic" && token)
            ? { token }
            : mode === "reset"
              ? { token, newPassword: password }
              : {
                  email,
                  password,
                  name,
                  callbackURL: "/app",
                  redirectTo: "/login",
                },
        ),
      });
      const d = await r.json();
      if (!r.ok) {
        setMessage(
          d.error?.message ||
            (typeof d.error === "string" ? d.error : d.message) ||
            "Kontrollér din e-mail og adgangskode.",
        );
        return;
      }
      if (
        mode === "login" ||
        mode === "verify" ||
        (mode === "magic" && token)
      ) {
        location.href =
          mode === "verify" ||
          new URLSearchParams(location.search).get("next") === "checkout" ||
          d.user?.emailVerified === false
            ? "/checkout/success"
            : "/app";
        return;
      }
      if (mode === "reset") {
        setMode("login");
        setPassword("");
        setToken("");
        setMessage(
          "Din adgangskode er ændret. Log ind med den nye adgangskode.",
        );
        return;
      }
      setMessage(
        mode === "signup"
          ? "Tjek din indbakke og bekræft din e-mail. Derefter kan du købe adgang."
          : "Hvis kontoen findes, modtager du en e-mail med næste trin.",
      );
    } catch {
      setMessage(
        "Forbindelsen blev afbrudt. Dine felter er bevaret. Prøv igen.",
      );
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    login: "Velkommen tilbage.",
    signup: "Dit forløb starter her.",
    forgot: "Glemt adgangskoden?",
    magic: token ? "Bekræft dit login." : "Log ind med et link.",
    verify: "Bekræft din e-mail.",
    reset: "Vælg en ny adgangskode.",
  };
  return (
    <main className="portal auth-page">
      <a className="logo" href="/">
        SHAZ
      </a>
      <section className="p-card auth-card">
        <span className="p-eyebrow">
          {test ? "ISOLERET TESTMILJØ" : "DIT 100-DAGES FORLØB"}
        </span>
        <h1>{titles[mode]}</h1>
        <p>
          {test
            ? "Brug din personlige testkonto. Alle data her er adskilt fra det rigtige produkt."
            : mode === "signup"
              ? "Opret din konto. Bekræft e-mailen. Køb adgang for 399 kr. én gang."
              : "Dine planer og registreringer venter på dig."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Navn
              <input
                value={name}
                autoComplete="name"
                required
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          )}
          {!["verify", "reset"].includes(mode) && !token && (
            <label>
              E-mail
              <input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {["login", "signup", "reset"].includes(mode) && (
            <label>
              Adgangskode
              <input
                type="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode !== "login" && (
                <small>
                  Mindst 12 tegn. En lang, unik sætning er et godt valg.
                </small>
              )}
            </label>
          )}
          <button className="p-button" disabled={busy}>
            {busy
              ? "Et øjeblik…"
              : {
                  login: "Log ind",
                  signup: "Opret konto",
                  forgot: "Send nulstillingslink",
                  magic: token ? "Bekræft og log ind" : "Send loginlink",
                  verify: "Bekræft e-mail",
                  reset: "Gem ny adgangskode",
                }[mode]}
          </button>
        </form>
        {message && (
          <p className="p-notice" role="status">
            {message}
          </p>
        )}
        <div className="auth-links">
          {mode !== "login" && (
            <button onClick={() => switchMode("login")}>
              Tilbage til login
            </button>
          )}
          {mode === "login" && (
            <>
              <button onClick={() => switchMode("forgot")}>
                Glemt adgangskode?
              </button>
              <a href="/checkout">Opret konto</a>
              <button onClick={() => switchMode("magic")}>
                Brug et e-maillink
              </button>
            </>
          )}
        </div>
        {!test && (
          <p className="p-note">
            En konto giver først produktadgang efter et verificeret køb.{" "}
            <a href="/privacy">Privatliv</a>
          </p>
        )}
      </section>
    </main>
  );
}
