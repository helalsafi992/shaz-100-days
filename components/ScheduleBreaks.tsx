"use client";
import { useState } from "react";
import { addDays } from "@/lib/profile";
import type { ScheduleBreak } from "@/lib/schedule-breaks";
type Preview = {
  fingerprint: string;
  strength: number;
  cardio: number;
  programEnds: string;
  restart: string;
};
export default function ScheduleBreaks({
  breaks,
  today,
  start,
  refresh,
}: {
  breaks: ScheduleBreak[];
  today: string;
  start: string;
  refresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [from, setFrom] = useState(today < start ? start : today),
    [to, setTo] = useState(today < start ? start : today),
    [restart, setRestart] = useState<"normal" | "easy">("easy"),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const end = addDays(start, 98);
  async function send(path: string, data: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/plan/" + path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
        d = await r.json();
      if (!r.ok) throw Error(d.error);
      return d;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Kunne ikke gemme. Dine valg er bevaret.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="p-card" id="pause">
      <div className="p-section-head">
        <div>
          <span className="p-eyebrow">PLADS TIL HVERDAGEN</span>
          <h2>Pause og genstart.</h2>
        </div>
        <button
          className="p-secondary"
          disabled={today > end}
          onClick={() => {
            setPreview(null);
            setError("");
            setOpen(true);
          }}
        >
          Planlæg pause
        </button>
      </div>
      <p>
        Sygdom eller rejse? Sæt træningen på pause i en periode. Dine
        registreringer bliver, og missede pas indhentes ikke automatisk.
      </p>
      {breaks
        .filter(
          (b) =>
            (b.restart_until ||
              addDays(b.to_date, b.restart === "easy" ? 7 : 0)) >= today,
        )
        .map((b) => (
          <div className="p-notice" key={b.id}>
            <b>
              {b.from_date} – {b.to_date}
            </b>
            <p>
              {b.restart === "easy"
                ? "Rolig genstart i syv dage derefter."
                : "Fortsæt den normale plan derefter."}
            </p>
            <button
              className="p-secondary"
              disabled={busy}
              onClick={async () => {
                if (
                  window.confirm(
                    "Afslut pausen eller den rolige genstart fra i dag? Tidligere pausedage og registreringer bevares.",
                  )
                ) {
                  if (await send("break-cancel", { id: b.id })) await refresh();
                }
              }}
            >
              Afslut pause/genstart
            </button>
          </div>
        ))}
      {error && !open && (
        <p className="p-error" role="alert">
          {error}
        </p>
      )}
      {open && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Planlæg pause"
        >
          <form
            className="p-dialog"
            onSubmit={async (e) => {
              e.preventDefault();
              const d = await send(
                preview ? "break-confirm" : "break-preview",
                { from, to, restart, fingerprint: preview?.fingerprint },
              );
              if (d) {
                if (preview) {
                  await refresh();
                  setOpen(false);
                } else setPreview(d);
              }
            }}
          >
            <button
              type="button"
              className="dialog-close"
              aria-label="Luk pause"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <h2>En pause, der passer.</h2>
            <label>
              Første pausedag
              <input
                type="date"
                min={today < start ? start : today}
                max={end}
                value={from}
                required
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
            <label>
              Sidste pausedag
              <input
                type="date"
                min={from}
                max={end}
                value={to}
                required
                onChange={(e) => {
                  setTo(e.target.value);
                  setPreview(null);
                }}
              />
            </label>
            <label>
              Efter pausen
              <select
                value={restart}
                onChange={(e) => {
                  setRestart(e.target.value as "normal" | "easy");
                  setPreview(null);
                }}
              >
                <option value="easy">Rolig genstart i syv kalenderdage</option>
                <option value="normal">Fortsæt min normale plan</option>
              </select>
            </label>
            <p className="p-note">
              Rolig genstart giver ét sæt mindre pr. øvelse og let cardio på
              højst 20 minutter i syv kalenderdage. Tilbagevenden efter sygdom
              kræver, at du er klar til at træne; planen vurderer ikke din
              helbredstilstand.
            </p>
            {preview && (
              <div className="p-notice" role="status">
                <b>
                  {preview.strength} styrkepas og {preview.cardio} cardiopas
                  sættes på pause.
                </b>
                <p>
                  Gennemførte pas og kladder bevares. Anden planlagt sport
                  markeres også som pause. Madplan og kaloriemål ændres ikke.
                </p>
                <p>
                  Dag 100 er fortsat {preview.programEnds}. Ingen automatisk
                  forlængelse eller indhentning.
                </p>
              </div>
            )}
            {error && (
              <p className="p-error" role="alert">
                {error}
              </p>
            )}
            <div className="p-actions">
              <button className="p-button" disabled={busy}>
                {busy
                  ? "Arbejder…"
                  : preview
                    ? "Bekræft pause"
                    : "Se ændringer"}
              </button>
              <button
                type="button"
                className="p-secondary"
                onClick={() => setOpen(false)}
              >
                Annuller
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
