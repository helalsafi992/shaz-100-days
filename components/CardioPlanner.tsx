"use client";
import { useState } from "react";
import type { Profile } from "@/lib/profile";
import type { CardioPlan } from "@/lib/cardio";
export type CardioRow = {
  id: string;
  day: number;
  scheduled_date: string;
  plan: CardioPlan;
  status: string;
  log: { minutes?: number; distance?: number; effort?: number };
};
export default function CardioPlanner({
  profile,
  rows,
  today,
  refresh,
}: {
  profile: Profile;
  rows: CardioRow[];
  today: string;
  refresh: () => Promise<void>;
}) {
  const [edit, setEdit] = useState(false),
    [form, setForm] = useState<NonNullable<Profile["cardio"]>>(
      profile.cardio || {
        days: 0,
        weekdays: [],
        minutes: 20,
        forms: ["walk"],
        equipment: ["outdoors"],
        level: "beginner",
        intensity: "easy",
      },
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<any>(null),
    [selected, setSelected] = useState<CardioRow | null>(null),
    [minutes, setMinutes] = useState(20),
    [distance, setDistance] = useState(""),
    [effort, setEffort] = useState(3),
    [move, setMove] = useState("");
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
      setError(e instanceof Error ? e.message : "Kunne ikke gemme.");
      return null;
    } finally {
      setBusy(false);
    }
  }
  function field<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm({ ...form, [k]: v });
    setPreview(null);
  }
  async function action(type: string, extra = {}) {
    if (!selected) return;
    const d = await send("cardio", { id: selected.id, action: type, ...extra });
    if (d) {
      await refresh();
      setSelected(null);
    }
  }
  const list = rows
    .filter((r) => r.status !== "removed" && r.scheduled_date >= today)
    .slice(0, 6);
  return (
    <section className="p-card cardio-planner" id="cardio">
      <div className="p-section-head">
        <div>
          <span className="p-eyebrow">KONDITION & RESTITUTION</span>
          <h2>Din cardio.</h2>
        </div>
        <button
          className="p-secondary"
          onClick={() => {
            setForm(profile.cardio || form);
            setPreview(null);
            setEdit(true);
          }}
        >
          Tilpas cardio
        </button>
      </div>
      {error && !selected && !edit && (
        <p className="p-error" role="alert">
          {error}
        </p>
      )}
      {!profile.cardio?.days ? (
        <p>
          Ingen ekstra cardio er valgt. Du kan tilføje rolige pas, som passer
          ind omkring din styrketræning.
        </p>
      ) : (
        <p>
          {profile.cardio.days} pas om ugen. Ingen kalorier fra cardio lægges
          oven i dit madmål.
        </p>
      )}
      {list.map((r) => (
        <div className="training-day" key={r.id}>
          <span>
            {new Date(r.scheduled_date + "T12:00:00Z").toLocaleDateString(
              "da-DK",
              { weekday: "short", day: "numeric", month: "short" },
            )}
            <small>Dag {r.day}</small>
          </span>
          <div>
            <b>{r.plan.selected.title}</b>
            <small>
              {r.plan.selected.minutes} min. inkl. opvarmning og afslutning
            </small>
          </div>
          <span className="status">
            {r.status === "completed"
              ? "✓ Gennemført"
              : r.status === "skipped"
                ? "Sprunget over"
                : "Planlagt"}
          </span>
          <button
            className="p-secondary"
            onClick={() => {
              setSelected(r);
              setMinutes(r.log.minutes || r.plan.selected.minutes);
              setDistance(r.log.distance?.toString() || "");
              setEffort(r.log.effort || 3);
              setMove("");
            }}
          >
            Se pas
          </button>
        </div>
      ))}
      {edit && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tilpas cardio"
        >
          <div className="p-dialog">
            <button
              className="dialog-close"
              aria-label="Luk cardioindstillinger"
              onClick={() => setEdit(false)}
            >
              ×
            </button>
            <h2>Cardio, der passer ind.</h2>
            {error && (
              <p className="p-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-grid">
              <label>
                Cardiopas om ugen
                <select
                  value={form.days}
                  onChange={(ev) => {
                    field("days", Number(ev.target.value));
                    setForm((f) => ({
                      ...f,
                      days: Number(ev.target.value),
                      weekdays: f.weekdays.slice(0, Number(ev.target.value)),
                    }));
                  }}
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label>
                Ønsket varighed (min.)
                <input
                  type="number"
                  min={10}
                  max={60}
                  step={5}
                  value={form.minutes}
                  onChange={(ev) => field("minutes", Number(ev.target.value))}
                />
              </label>
              <label>
                Erfaring
                <select
                  value={form.level}
                  onChange={(ev) =>
                    field("level", ev.target.value as typeof form.level)
                  }
                >
                  <option value="beginner">Begynder</option>
                  <option value="intermediate">Let øvet</option>
                </select>
              </label>
              <label>
                Belastning
                <select
                  value={form.intensity}
                  onChange={(ev) =>
                    field("intensity", ev.target.value as typeof form.intensity)
                  }
                >
                  <option value="easy">Let · hele sætninger uden besvær</option>
                  <option value="moderate">
                    Moderat · taletempo med tydelig vejrtrækning
                  </option>
                </select>
              </label>
            </div>
            <fieldset>
              <legend>Foretrukne dage</legend>
              <div className="weekday-choices">
                {["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"].map(
                  (name, i) => (
                    <label className="p-check" key={name}>
                      <input
                        type="checkbox"
                        checked={form.weekdays.includes(i)}
                        onChange={(ev) =>
                          field(
                            "weekdays",
                            ev.target.checked
                              ? [...form.weekdays, i]
                              : form.weekdays.filter((d) => d !== i),
                          )
                        }
                      />
                      {name}
                      {profile.weekdays.includes(i) ? " · styrke" : ""}
                    </label>
                  ),
                )}
              </div>
            </fieldset>
            <fieldset>
              <legend>Træningsformer</legend>
              <div className="form-grid">
                {[
                  ["walk", "Gang"],
                  ["cycle", "Cykling"],
                  ["walk-run", "Løb/gang"],
                  ["elliptical", "Crosstrainer"],
                ].map(([v, l]) => (
                  <label className="p-check" key={v}>
                    <input
                      type="checkbox"
                      checked={form.forms.includes(v as any)}
                      onChange={(ev) =>
                        field(
                          "forms",
                          (ev.target.checked
                            ? [...form.forms, v]
                            : form.forms.filter(
                                (f) => f !== v,
                              )) as typeof form.forms,
                        )
                      }
                    />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Det har du adgang til</legend>
              <div className="form-grid">
                {[
                  ["outdoors", "Udendørs"],
                  ["bike", "Cykel / motionscykel"],
                  ["treadmill", "Løbebånd"],
                  ["elliptical", "Crosstrainer"],
                ].map(([v, l]) => (
                  <label className="p-check" key={v}>
                    <input
                      type="checkbox"
                      checked={form.equipment.includes(v as any)}
                      onChange={(ev) =>
                        field(
                          "equipment",
                          (ev.target.checked
                            ? [...form.equipment, v]
                            : form.equipment.filter(
                                (f) => f !== v,
                              )) as typeof form.equipment,
                        )
                      }
                    />
                    {l}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="p-note">
              Begyndere starter højst med 20 minutter og øger planlagt varighed
              gradvist op mod den valgte tid. Mindst én dag uden planlagte pas
              bevares. Ingen ekstra cardio ved større underskud.
            </p>
            <button
              className="p-button"
              disabled={busy}
              onClick={async () => {
                const d = await send("cardio-preview", { cardio: form });
                if (d) setPreview(d);
              }}
            >
              Se ny ugeplan
            </button>
            {preview && (
              <div className="preview-card">
                <h3>Det bliver din nye rytme</h3>
                {preview.plan.length ? (
                  preview.plan.map((r: CardioPlan) => (
                    <p key={r.day}>
                      Dag {r.day}: {r.selected.title} · {r.selected.minutes}{" "}
                      min.
                    </p>
                  ))
                ) : (
                  <p>Ingen fremtidig, uregistreret cardio planlægges.</p>
                )}
                <p>{preview.explanation}</p>
                <p>
                  Forslag til samlet træningsaktivitet:{" "}
                  {
                    { light: "Let", regular: "Regelmæssig", heavy: "Høj" }[
                      preview.activitySuggestion as string
                    ]
                  }
                  .
                </p>
                <button
                  className="p-button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await send("cardio-confirm", {
                        cardio: form,
                        expectedVersion: preview.version,
                      })
                    ) {
                      await refresh();
                      setEdit(false);
                    }
                  }}
                >
                  Bekræft ny cardioplan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {selected && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Cardiopas"
        >
          <div className="p-dialog">
            <button
              className="dialog-close"
              aria-label="Luk cardiopas"
              onClick={() => setSelected(null)}
            >
              ×
            </button>
            <span className="p-eyebrow">DAG {selected.day} · CARDIO</span>
            <h2>{selected.plan.selected.title}</h2>
            <p>
              <b>{selected.plan.selected.minutes} minutter</b> ·{" "}
              {selected.plan.selected.intensity}
            </p>
            {error && (
              <p className="p-error" role="alert">
                {error}
              </p>
            )}
            <ol className="recipe-steps">
              <li>{selected.plan.selected.warmup}</li>
              <li>{selected.plan.selected.main}</li>
              <li>{selected.plan.selected.cooldown}</li>
            </ol>
            <p className="p-note">{selected.plan.selected.purpose}</p>
            {selected.status !== "completed" && (
              <>
                <h3>Vælg et egnet alternativ</h3>
                <div className="cardio-options">
                  {selected.plan.options.map((o, i) => (
                    <button
                      className="p-secondary"
                      key={o.id}
                      disabled={busy || o.id === selected.plan.selected.id}
                      onClick={() => action("swap", { option: o.id })}
                    >
                      {"ABC"[i]} · {o.title}
                      <small>
                        {o.minutes} min. · {o.intensity}
                      </small>
                    </button>
                  ))}
                </div>
                {selected.plan.issue && <p>{selected.plan.issue}</p>}
              </>
            )}
            {selected.scheduled_date <= today && (
              <>
                <h3>Det gennemførte du</h3>
                <div className="form-grid">
                  <label>
                    Faktiske minutter
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={minutes}
                      onChange={(ev) => setMinutes(Number(ev.target.value))}
                    />
                  </label>
                  <label>
                    Distance (km, frivilligt)
                    <input
                      type="number"
                      min={0}
                      max={200}
                      step="0.1"
                      value={distance}
                      onChange={(ev) => setDistance(ev.target.value)}
                    />
                  </label>
                  <label>
                    Oplevet anstrengelse (1–10)
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={effort}
                      onChange={(ev) => setEffort(Number(ev.target.value))}
                    />
                  </label>
                </div>
                <button
                  className="p-button"
                  disabled={busy}
                  onClick={() =>
                    action("log", {
                      minutes,
                      effort,
                      distance: distance ? Number(distance) : undefined,
                    })
                  }
                >
                  Gem gennemført cardio
                </button>
              </>
            )}
            {selected.status === "planned" && (
              <details>
                <summary>Flyt, fjern eller spring over</summary>
                <label>
                  Ny dato
                  <input
                    type="date"
                    min={today}
                    value={move}
                    onChange={(ev) => setMove(ev.target.value)}
                  />
                </label>
                <div className="meal-actions">
                  <button
                    disabled={!move || busy}
                    onClick={() => action("move", { date: move })}
                  >
                    Flyt pas
                  </button>
                  <button disabled={busy} onClick={() => action("remove")}>
                    Fjern fra planen
                  </button>
                  <button disabled={busy} onClick={() => action("skip")}>
                    Registrér som sprunget over
                  </button>
                </div>
                <p className="p-note">
                  Et sprunget pas ændrer hverken dit madmål eller belastningen
                  på næste dag.
                </p>
              </details>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
