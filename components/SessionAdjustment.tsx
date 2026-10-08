"use client";
import { useState } from "react";
import { normalizeProfile, durationValues, type Profile } from "@/lib/profile";
export default function SessionAdjustment({
  id,
  profile,
  close,
  onSaved,
}: {
  id: string;
  profile: Profile;
  close: () => void;
  onSaved: () => Promise<void>;
}) {
  const p = normalizeProfile(profile);
  const [locationId, setLocation] = useState(p.locations![0].id),
    [minutes, setMinutes] = useState(20),
    [scope, setScope] = useState("session"),
    [preview, setPreview] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(confirm: boolean) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/plan/training-" + (confirm ? "confirm" : "preview"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            locationId,
            minutes,
            scope,
            expectedVersion: preview?.version,
            fingerprint: preview?.fingerprint,
          }),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (confirm) {
        await onSaved();
        close();
      } else setPreview(d);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Kunne ikke gemme. Dine valg er bevaret.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="p-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Tilpas dagens træning"
    >
      <div className="p-dialog">
        <button
          className="dialog-close"
          aria-label="Luk tilpasning"
          onClick={close}
        >
          ×
        </button>
        <h2>Din træning, i dag.</h2>
        <p>Et andet sted eller mindre tid? Se ændringerne før du gemmer.</p>
        <label>
          Sted
          <select
            value={locationId}
            onChange={(e) => {
              setLocation(e.target.value);
              setPreview(null);
            }}
          >
            {p.locations!.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tid
          <select
            value={minutes}
            onChange={(e) => {
              setMinutes(Number(e.target.value));
              setPreview(null);
            }}
          >
            {durationValues.map((m) => (
              <option key={m} value={m}>
                {m} minutter
              </option>
            ))}
          </select>
        </label>
        <label>
          Anvend på
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setPreview(null);
            }}
          >
            <option value="session">Kun dette pas</option>
            <option value="week">Denne uges kommende styrkepas</option>
            <option value="future">
              Alle fremtidige styrkepas i dette forløb
            </option>
          </select>
        </label>
        {error && (
          <p className="p-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="p-button"
          disabled={busy}
          onClick={() => send(false)}
        >
          Se ændringer
        </button>
        {preview && (
          <section className="preview-card">
            <h3>{preview.changes.length} pas ændres</h3>
            <p>{preview.explanation}</p>
            {preview.changes.slice(0, 7).map((c: any) => (
              <div key={c.id}>
                <h3>
                  {c.date} · {c.after.locationName}
                </h3>
                <p>
                  {c.before.minutes} → {c.after.minutes} minutter ·{" "}
                  {c.before.exercises.length} → {c.after.exercises.length}{" "}
                  øvelser
                </p>
                <p>{c.after.exercises.map((e: any) => e.name).join(" · ")}</p>
              </div>
            ))}
            <button
              className="p-button"
              disabled={busy}
              onClick={() => send(true)}
            >
              Bekræft ændringer
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
