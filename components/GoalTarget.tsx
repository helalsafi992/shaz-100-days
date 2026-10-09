"use client";

import { useEffect, useRef, useState } from "react";
import { exercises } from "@/lib/training";
import {
  goalUnits, goalUnit, goalValueLabel, parseGoalNumber, toCanonical,
  type GoalMetric, type GoalUnit,
} from "@/lib/goal-units";
import type { Intake } from "@/lib/ai/intake";

type Target = Intake["wishes"]["target"];
const metricChoices: { id: Exclude<GoalMetric, "none">; label: string }[] = [
  { id: "weight-kg", label: "Kropsvægt" },
  { id: "run-km", label: "Løb eller gåtur" },
  { id: "exercise-kg", label: "Styrke" },
  { id: "consistent-weeks", label: "Følge min træningsplan" },
];

function NumberField({
  label, value, unit, onChange,
}: {
  label: string;
  value: number | null | undefined;
  unit: GoalUnit;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(goalValueLabel(value, unit));
  const [error, setError] = useState("");
  const focused = useRef(false);
  const previousUnit = useRef(unit);

  useEffect(() => {
    if (!focused.current || previousUnit.current !== unit) {
      setText(goalValueLabel(value, unit));
      setError("");
    }
    previousUnit.current = unit;
  }, [value, unit]);

  return (
    <label className="goal-number">
      <span>{label} <small>({unit === "weeks" ? "uger" : unit})</small></span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        aria-invalid={Boolean(error)}
        onFocus={() => { focused.current = true; }}
        onBlur={() => {
          focused.current = false;
          if (!error) setText(goalValueLabel(value, unit));
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          try {
            // A temporary decimal comma is allowed while the user is typing.
            const parsed = parseGoalNumber(raw.replace(/[.,]$/, ""));
            setError("");
            onChange(parsed === null ? null : toCanonical(parsed, unit));
          } catch {
            setError("Skriv et tal, fx 72,5.");
            onChange(null);
          }
        }}
      />
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

export default function GoalTarget({
  target, onChange, currentWeight, priority,
}: {
  target: Target;
  onChange: (target: Target) => void;
  currentWeight?: number;
  priority?: Intake["wishes"]["priority"];
}) {
  const [wantsGoal, setWantsGoal] = useState(target.metric !== "none");
  const unit = goalUnit(target.metric, target.displayUnit);
  const defaults: Record<string, Exclude<GoalMetric, "none">> = {
    "fat-loss": "weight-kg",
    "hypertrophy": "exercise-kg",
    "strength": "exercise-kg",
    "fitness": "run-km",
    "sport": "run-km",
    "maintenance": "consistent-weeks",
  };

  function choose(metric: GoalMetric) {
    if (metric === "none") {
      setWantsGoal(false);
      onChange({ metric: "none", value: null, baseline: null, weeks: null, exerciseId: null, measurementVersion: 2 });
      return;
    }
    setWantsGoal(true);
    onChange({
      metric,
      value: null,
      baseline: metric === "weight-kg" ? currentWeight ?? null : null,
      weeks: 14,
      exerciseId: null,
      reps: metric === "exercise-kg" ? 8 : null,
      displayUnit: goalUnit(metric),
      measurementVersion: 2,
    });
  }

  function edit(patch: Partial<Target>) {
    onChange({
      ...target,
      baseline: target.baseline ?? (target.metric === "weight-kg" ? currentWeight ?? null : null),
      ...patch,
      measurementVersion: 2,
    });
  }

  return (
    <fieldset className="shaz-question goal-target">
      <legend>Vil du sætte et konkret mål? <span className="optional-label">Valgfrit</span></legend>
      <div className="goal-yes-no" role="group" aria-label="Konkret mål">
        <button type="button" className={!wantsGoal ? "chosen" : ""} aria-pressed={!wantsGoal} onClick={() => choose("none")}>Nej, ikke lige nu</button>
        <button type="button" className={wantsGoal ? "chosen" : ""} aria-pressed={wantsGoal} onClick={() => {
          if (wantsGoal) return;
          choose(defaults[priority || "maintenance"] || "consistent-weeks");
        }}>Ja, jeg har et mål</button>
      </div>
      {wantsGoal && target.metric !== "none" && (
        <div className="goal-extra">
          <p className="goal-small-title">Hvad vil du måle?</p>
          <div className="goal-metric-grid" role="group" aria-label="Vælg måltype">
            {metricChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                aria-pressed={target.metric === choice.id}
                className={target.metric === choice.id ? "chosen" : ""}
                onClick={() => {
                  if (target.metric !== choice.id) choose(choice.id);
                }}
              >{choice.label}</button>
            ))}
          </div>

          <div className="goal-fields">
            {target.metric === "exercise-kg" && (
              <label className="goal-full">Hvilken øvelse?
                <select value={target.exerciseId ?? ""} onChange={(event) => edit({ exerciseId: event.target.value || null })}>
                  <option value="">Vælg øvelse</option>
                  {exercises.filter((exercise) => exercise.equipment.some((eq) => eq !== "bodyweight")).map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                  ))}
                </select>
              </label>
            )}

            {goalUnits(target.metric).length > 1 && (
              <div className="goal-full goal-unit-section">
                <p className="goal-small-title">Vælg enhed</p>
                <div className="goal-unit-choices" role="group" aria-label="Enhed for dit mål">
                  {goalUnits(target.metric).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={unit === choice ? "chosen" : ""}
                      aria-pressed={unit === choice}
                      onClick={() => edit({ displayUnit: choice })}
                    >{choice === "lbs" ? "lbs (pund)" : choice}</button>
                  ))}
                </div>
              </div>
            )}

            {target.metric !== "consistent-weeks" && (
              <NumberField
                key={target.metric + "-baseline"}
                label={target.metric === "weight-kg" ? "Din vægt nu" : target.metric === "run-km" ? "Så langt kan du gå eller løbe nu" : "Vægt du løfter nu"}
                value={target.baseline ?? (target.metric === "weight-kg" ? currentWeight : null)}
                unit={unit}
                onChange={(baseline) => edit({ baseline })}
              />
            )}
            <NumberField
              key={target.metric + "-goal"}
              label={target.metric === "weight-kg" ? "Din ønskede vægt" : target.metric === "run-km" ? "Den distance du vil kunne klare" : target.metric === "exercise-kg" ? "Vægt du vil kunne løfte" : "Uger i træk med din plan"}
              value={target.value}
              unit={unit}
              onChange={(value) => edit({ value })}
            />
            {target.metric === "exercise-kg" && (
              <label>Antal gentagelser
                <input type="number" min={1} max={50} value={target.reps ?? ""} onChange={(event) => edit({ reps: event.target.value ? Number(event.target.value) : null })} />
                <small>Samme gentagelser ved nuværende og ønsket vægt.</small>
              </label>
            )}
            <details className="goal-full">
              <summary>Tidshorisont: {target.weeks || 14} uger</summary>
              <label>Inden for hvor mange uger?
                <input type="number" min={1} max={52} value={target.weeks ?? 14} onChange={(event) => edit({ weeks: event.target.value ? Number(event.target.value) : null })} />
              </label>
            </details>
            <p className="p-note goal-full">Målet hjælper dig med at følge din udvikling. Det er ikke en resultatgaranti.{(target.weeks || 14) > 15 ? " Målet ligger efter dine 100 dage og vises som et langsigtet mål." : ""}</p>
          </div>
        </div>
      )}
    </fieldset>
  );
}
