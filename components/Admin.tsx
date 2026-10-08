"use client";
import { useEffect, useState } from "react";
type Entry = {
  kind: string;
  id: string;
  version: number;
  status: string;
  data: Record<string, unknown>;
  reviewed_at?: string;
  reviewer_id?: string;
};
type AdminState = {
  role: "owner" | "editor";
  totals: { revenue: number; test_orders: number; activated: number };
  customers: {
    id: string;
    email: string;
    step: number;
    start_date: string;
    completed: number;
  }[];
  orders: {
    id: string;
    email: string;
    status: string;
    amount: number;
    refunded_amount: number;
    livemode: boolean;
  }[];
  mail: {
    id: string;
    kind: string;
    status: string;
    attempts: number;
    error_code: string;
    delivered_at: string;
  }[];
  content: Entry[];
  audit: { id: string; action: string; target: string; created_at: string }[];
  refunds: { id: string; order_id: string; status: string; reason: string }[];
  missing: string[];
  salesOpen: boolean;
};
export default function Admin() {
  const [data, setData] = useState<AdminState | null>(null),
    [tab, setTab] = useState("overview"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [entry, setEntry] = useState<Entry | null>(null),
    [json, setJson] = useState(""),
    [status, setStatus] = useState("draft"),
    [approval, setApproval] = useState(false),
    [query, setQuery] = useState(""),
    [email, setEmail] = useState("");
  async function refresh() {
    const r = await fetch("/api/platform/admin", { cache: "no-store" });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setData(d);
    if (d.role === "editor") setTab("content");
  }
  useEffect(() => {
    const invite = new URLSearchParams(location.hash.slice(1)).get("invite");
    if (invite) {
      history.replaceState(null, "", "/admin");
      fetch("/api/platform/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invite }),
      })
        .then((r) => r.json())
        .then((d) => {
          setMessage(d.error || "Invitation accepteret.");
          return refresh();
        })
        .catch(() => setMessage("Kunne ikke åbne invitation."));
    } else refresh().catch((e) => setMessage(e.message));
  }, []);
  async function action(path: string, input: unknown) {
    setBusy(true);
    try {
      const r = await fetch("/api/platform/admin/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage("Gemt. Handlingen er registreret i auditloggen.");
      await refresh();
      setEntry(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Kunne ikke gemme.");
    } finally {
      setBusy(false);
    }
  }
  const paid =
    data?.orders.filter((o) => o.livemode && o.status === "paid") || [];
  return (
    <main className="portal admin-main">
      <header className="p-top">
        <a className="logo" href="/">
          SHAZ<span>ADMINISTRATION</span>
        </a>
        <a href="/app/profile">Min konto ↗</a>
      </header>
      <div className="p-page-heading">
        <div>
          <span className="p-eyebrow">DRIFT & INDHOLD</span>
          <h1>Et klart overblik.</h1>
          <p>Roller, publicering og ændringer kontrolleres på serveren.</p>
        </div>
        <span className="p-badge">
          {data?.salesOpen ? "SALG ÅBENT" : "SALG LUKKET"}
        </span>
      </div>
      {message && (
        <p className="p-notice" role="status">
          {message}
        </p>
      )}
      <nav className="admin-tabs">
        {[
          ["overview", "Overblik"],
          ["customers", "Kunder"],
          ["content", "Indhold"],
          ["delivery", "Levering"],
          ["audit", "Auditlog"],
        ]
          .filter(([v]) => data?.role !== "editor" || v === "content")
          .map(([v, l]) => (
            <button
              className={tab === v ? "chosen" : ""}
              key={v}
              onClick={() => setTab(v)}
            >
              {l}
            </button>
          ))}
      </nav>
      {!data ? (
        <p className="p-empty">
          Henter administration… Du skal være logget ind med en verificeret,
          inviteret ejerkonto.
        </p>
      ) : (
        <>
          {tab === "overview" && (
            <>
              <div className="p-metrics">
                <div>
                  <span>FAKTISK BETALT, LIVE</span>
                  <b>
                    {(data.totals.revenue / 100).toLocaleString("da-DK")}
                    <small>kr. efter refunderinger</small>
                  </b>
                </div>
                <div>
                  <span>TESTORDRER</span>
                  <b>{data.totals.test_orders}</b>
                </div>
                <div>
                  <span>AKTIVEREDE FORLØB</span>
                  <b>{data.totals.activated}</b>
                </div>
              </div>
              <div className="p-grid">
                <section className="p-card">
                  <h2>Før salg kan åbnes.</h2>
                  <p>
                    Ejeren skal godkende lancering særskilt. Miljøvariablen
                    alene åbner ikke betaling.
                  </p>
                  <ul>
                    {data.missing.map((k) => (
                      <li key={k}>
                        <code>{k}</code> mangler
                      </li>
                    ))}
                  </ul>
                  <p>
                    Derudover kræves dokumenteret levering, juridisk gennemgang
                    og gennemgået, publiceret indhold. Se projektets{" "}
                    <a href="https://github.com/helalsafi992/shaz-100-days/blob/main/docs/ADMIN.md">
                      adminvejledning
                    </a>
                    .
                  </p>
                </section>
                <section className="p-card">
                  <h2>Fortrydelse & refundering.</h2>
                  {data.refunds.length === 0 ? (
                    <p>Ingen anmodninger.</p>
                  ) : (
                    data.refunds.map((r) => (
                      <div className="refund-row" key={r.id}>
                        <b>
                          {r.reason} · {r.status}
                        </b>
                        <small>Ordre {r.order_id}</small>
                        <p>
                          Refundér i Stripe efter vurdering. Webhook opdaterer
                          adgangen. Ingen betaling udløses her.
                        </p>
                        <div className="p-actions">
                          <button
                            disabled={busy}
                            className="p-secondary"
                            onClick={() =>
                              action("refund-status", {
                                id: r.id,
                                status: "reviewing",
                              })
                            }
                          >
                            Under behandling
                          </button>
                          <button
                            disabled={busy}
                            className="p-secondary"
                            onClick={() =>
                              action("refund-status", {
                                id: r.id,
                                status: "processed",
                              })
                            }
                          >
                            Kontrollér refusion & afslut
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </section>
              </div>
              <section className="p-card">
                <h2>Invitér administrator.</h2>
                <label>
                  Verificerbar e-mail
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button
                  className="p-secondary"
                  disabled={busy || !email}
                  onClick={() => action("invite", { email, role: "editor" })}
                >
                  Send invitation som indholdsredaktør
                </button>
                <p className="p-note">
                  Ejerrettigheder gives aldrig automatisk til den første bruger.
                </p>
              </section>
            </>
          )}
          {tab === "customers" && (
            <section className="p-card">
              <h2>Kunder & ordrer.</h2>
              <p className="p-note">
                Kropsoplysninger og private træningsregistreringer vises ikke
                her.
              </p>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Søg e-mail"
                aria-label="Søg kunde"
              />
              {data.customers
                .filter((c) => c.email.includes(query))
                .map((c) => (
                  <article className="admin-customer" key={c.id}>
                    <div>
                      <h3>{c.email}</h3>
                      <p>
                        {c.start_date
                          ? "Start: " + String(c.start_date).slice(0, 10)
                          : "Onboarding: trin " + (c.step + 1)}{" "}
                        · {c.completed} gennemført
                      </p>
                      {data.orders
                        .filter((o) => o.email === c.email)
                        .map((o) => (
                          <p className="p-note" key={o.id}>
                            {o.livemode ? "LIVE" : "TEST"} · {o.status} · 399
                            kr. · {o.id}
                          </p>
                        ))}
                    </div>
                    <button
                      className="p-secondary"
                      disabled={busy}
                      onClick={() => action("resend", { userId: c.id })}
                    >
                      Send nyt loginlink
                    </button>
                  </article>
                ))}
              {!data.customers.length && (
                <p className="p-empty">Ingen kunder endnu.</p>
              )}
            </section>
          )}
          {tab === "content" && (
            <section className="p-card">
              <div className="p-section-head">
                <h2>Versioneret indhold.</h2>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Søg navn, type eller ID"
                  aria-label="Søg indhold"
                />
              </div>
              <p>
                Alle starttekster er til gennemgang. Publicering registrerer den
                faktiske bruger og tidspunkt; den er ikke i sig selv en faglig
                certificering.
              </p>
              <div className="content-list">
                {data.content
                  .filter((e) =>
                    (e.kind + e.id + String(e.data.name || e.data.text || ""))
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map((e) => (
                    <button
                      key={e.kind + e.id}
                      onClick={() => {
                        setEntry(e);
                        setJson(JSON.stringify(e.data, null, 2));
                        setStatus(e.status);
                        setApproval(false);
                      }}
                    >
                      <span>
                        {e.kind} · v{e.version}
                      </span>
                      <b>
                        {String(e.data.name || e.data.text || e.id).slice(
                          0,
                          100,
                        )}
                      </b>
                      <small>
                        {e.status === "published"
                          ? "Publiceret"
                          : e.status === "review"
                            ? "Til gennemgang"
                            : "Kladde"}
                      </small>
                    </button>
                  ))}
              </div>
            </section>
          )}
          {tab === "delivery" && (
            <section className="p-card">
              <h2>Transaktionsmails.</h2>
              <p>
                “Sendt” er ikke det samme som “leveret”. Levering registreres
                fra en verificeret Resend-webhook.
              </p>
              {data.mail.map((m) => (
                <div className="admin-customer" key={m.id}>
                  <div>
                    <b>
                      {m.kind} · {m.status}
                    </b>
                    <p>
                      {m.attempts} forsøg {m.error_code && "· " + m.error_code}
                    </p>
                    {m.delivered_at && (
                      <small>
                        Leveret{" "}
                        {new Date(m.delivered_at).toLocaleString("da-DK")}
                      </small>
                    )}
                  </div>
                  {m.status === "failed" && (
                    <button
                      disabled={busy}
                      className="p-secondary"
                      onClick={() => action("retry-mail", { id: m.id })}
                    >
                      Prøv levering igen
                    </button>
                  )}
                </div>
              ))}
              {!data.mail.length && (
                <p className="p-empty">Ingen mailhændelser endnu.</p>
              )}
            </section>
          )}
          {tab === "audit" && (
            <section className="p-card">
              <h2>Auditlog.</h2>
              {data.audit.map((a) => (
                <div className="audit-row" key={a.id}>
                  <span>{new Date(a.created_at).toLocaleString("da-DK")}</span>
                  <b>{a.action}</b>
                  <small>{a.target}</small>
                </div>
              ))}
            </section>
          )}
        </>
      )}
      {entry && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Rediger indhold"
        >
          <div className="p-dialog">
            <button
              className="dialog-close"
              onClick={() => setEntry(null)}
              aria-label="Luk editor"
            >
              ✕
            </button>
            <span className="p-eyebrow">
              {entry.kind} / {entry.id} / VERSION {entry.version}
            </span>
            <h2>Redigér næste version.</h2>
            <p>
              Ændringer opretter en ny version. Kunders tidligere pas og valgte
              måltider beholder deres kopi.
            </p>
            <label>
              Indhold med strukturerede felter
              <textarea
                className="json-editor"
                value={json}
                onChange={(e) => setJson(e.target.value)}
                spellCheck={false}
              />
            </label>
            {entry.kind === "exercise" && (
              <label>
                Upload egen øvelsesvideo (MP4/WebM, maks. 25 MB)
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    try {
                      const fd = new FormData();
                      fd.set("file", file);
                      const r = await fetch("/api/video/upload", {
                        method: "POST",
                        body: fd,
                      });
                      const d = await r.json();
                      if (!r.ok) throw new Error(d.error);
                      setJson(
                        JSON.stringify(
                          { ...JSON.parse(json), videoId: d.id },
                          null,
                          2,
                        ),
                      );
                      setMessage(
                        "Video uploadet. Gem indholdsversionen for at knytte den til øvelsen.",
                      );
                    } catch (err) {
                      setMessage(
                        err instanceof Error
                          ? err.message
                          : "Upload mislykkedes.",
                      );
                    }
                    setBusy(false);
                  }}
                />
              </label>
            )}
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Kladde</option>
                <option value="review">Til gennemgang</option>
                <option value="published">Publiceret (ejer)</option>
              </select>
            </label>
            {status === "published" && (
              <label className="p-check">
                <input
                  type="checkbox"
                  checked={approval}
                  onChange={(e) => setApproval(e.target.checked)}
                />
                Jeg bekræfter, at indholdet faktisk er gennemgået og klar til
                publicering. Min konto registreres som godkender.
              </label>
            )}
            <button
              className="p-button"
              disabled={busy || (status === "published" && !approval)}
              onClick={() => {
                try {
                  action("content", {
                    kind: entry.kind,
                    id: entry.id,
                    expectedVersion: entry.version,
                    data: JSON.parse(json),
                    status,
                    approval,
                  });
                } catch {
                  setMessage(
                    "Indholdet er ikke gyldig JSON. Dine ændringer er bevaret.",
                  );
                }
              }}
            >
              Gem som version {entry.version + 1}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
