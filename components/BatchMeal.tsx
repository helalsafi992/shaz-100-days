"use client";
import { useState } from "react";
import { addDays } from "@/lib/profile";
import { ingredients } from "@/lib/recipes";
import {
  batchStorage,
  batchStorageSource,
  type batchPlan,
} from "@/lib/meal-batch";
import type { MealDay, MealSlot } from "@/lib/meal-plan";
type Preview = ReturnType<typeof batchPlan> & { fingerprint: string };
export default function BatchMeal({
  date,
  slot,
  next,
  close,
  saved,
}: {
  date: string;
  slot: MealSlot;
  next?: MealDay;
  close: () => void;
  saved: () => Promise<void>;
}) {
  const [target, setTarget] = useState(
      next?.slots.find((s) => s.id === slot.id)?.id || next?.slots[0]?.id || "",
    ),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function request(confirm: boolean) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(
        "/api/plan/batch-" + (confirm ? "confirm" : "preview"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            slot: slot.id,
            targetSlot: target,
            fingerprint: confirm ? preview?.fingerprint : undefined,
          }),
        },
      );
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Kunne ikke gemme madlavningen.");
      if (confirm) {
        await saved();
        close();
      } else setPreview(d);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Forbindelsen blev afbrudt. Dine valg er bevaret.",
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
      aria-label="Planlæg rester"
    >
      <div className="p-dialog">
        <button
          className="dialog-close"
          aria-label="Luk rester"
          onClick={close}
        >
          ×
        </button>
        <h2>Lav én gang. Spis to gange.</h2>
        <p>
          Lav {slot.selected?.recipe.name} til dette måltid og en plads den{" "}
          {addDays(date, 1)}. Din personlige portion er adskilt fra hele
          madlavningen.
        </p>
        <label>
          Rester til måltid
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setPreview(null);
            }}
          >
            {next?.slots.map((s) => (
              <option
                value={s.id}
                key={s.id}
                disabled={s.status !== "planned" || !!s.batch}
              >
                {s.name} · {s.time}
              </option>
            ))}
          </select>
        </label>
        {!next && (
          <p className="p-notice">
            Åbn først morgendagens madplan, så den er klar til at blive
            tilpasset.
          </p>
        )}
        <p className="p-note">
          {batchStorage}{" "}
          <a href={batchStorageSource} target="_blank" rel="noreferrer">
            Læs rådene om nedkøling
          </a>
        </p>
        {error && (
          <p className="p-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="p-secondary"
          disabled={busy || !target}
          onClick={() => request(false)}
        >
          Se portioner og indkøb
        </button>
        {preview && (
          <section className="preview-card">
            <h3>Det bliver lavet sammen</h3>
            {preview.batch.portions.map((p) => (
              <p key={p.date + p.slot}>
                {p.date}: Din portion {p.personalServings} · mad til {p.people}{" "}
                {p.people === 1 ? "person" : "personer"}
              </p>
            ))}
            <p>
              Morgendagens mål: {preview.second.target ?? "portionsvejledning"}{" "}
              · valgte retter: {Math.round(preview.quality.total.kcal)} kcal og{" "}
              {Math.round(preview.quality.total.protein)} g protein.
            </p>
            <ul>
              {preview.batch.ingredients.map((i) => (
                <li key={i.id}>
                  {ingredients.find((v) => v.id === i.id)?.name}: {i.grams} g
                </li>
              ))}
            </ul>
            {preview.quality.issues.map((i) => (
              <p className="p-notice" key={i}>
                {i}
              </p>
            ))}
            <p>
              Indkøbet står én gang på madlavningsdagen. Retten til næste dag
              erstattes først, når du bekræfter. Ingen måltider registreres som
              spist.
            </p>
            <button
              className="p-button"
              disabled={busy}
              onClick={() => request(true)}
            >
              Bekræft fælles madlavning
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
