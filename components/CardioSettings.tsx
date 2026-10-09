"use client";
import NumberInput from "./forms/NumberInput";
import type { Profile } from "@/lib/profile";
import { weekdays, weekdayNames } from "@/lib/profile";
export const noCardio: NonNullable<Profile["cardio"]> = {
  days: 0,
  weekdays: [],
  minutes: 20,
  forms: ["walk"],
  equipment: ["outdoors"],
  level: "beginner",
  intensity: "easy",
};
export default function CardioSettings({
  value,
  onChange,
}: {
  value: NonNullable<Profile["cardio"]>;
  onChange: (v: NonNullable<Profile["cardio"]>) => void;
}) {
  const field = <K extends keyof typeof value>(k: K, v: (typeof value)[K]) =>
    onChange({ ...value, [k]: v });
  return (
    <fieldset className="cardio-settings">
      <legend>Valgfri ekstra cardio</legend>
      <div className="form-grid">
        <label>
          Cardiopas om ugen
          <select
            value={value.days}
            onChange={(e) =>
              onChange({
                ...value,
                days: Number(e.target.value),
                weekdays: value.weekdays.slice(0, Number(e.target.value)),
              })
            }
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "Ingen ekstra cardio" : n}
              </option>
            ))}
          </select>
        </label>
        {value.days > 0 && (
          <>
            <label>
              Ønsket varighed (min.)
              <NumberInput min={1} max={1440} value={value.minutes} onValue={minutes=>field("minutes",minutes as number)}/>
            </label>
            <label>
              Cardioerfaring
              <select
                value={value.level}
                onChange={(e) =>
                  field("level", e.target.value as typeof value.level)
                }
              >
                <option value="beginner">Begynder</option>
                <option value="intermediate">Let øvet</option>
                <option value="experienced">Erfaren</option>
              </select>
            </label>
            <label>
              Belastning
              <select
                value={value.intensity}
                onChange={(e) =>
                  field("intensity", e.target.value as typeof value.intensity)
                }
              >
                <option value="easy">Let · tal ubesværet</option>
                <option value="moderate">Moderat · tydelig vejrtrækning</option>
              </select>
            </label>
          </>
        )}
      </div>
      {value.days > 0 && (
        <>
          <p>
            Vælg {value.days} dage. Du kan vælge de samme dage som styrketræning.
          </p>
          <div className="weekday-choices">
            {weekdays.map((i) => (
              <label key={i} className="p-check">
                <input
                  type="checkbox"
                  checked={value.weekdays.includes(i)}
                  onChange={(e) =>
                    field(
                      "weekdays",
                      e.target.checked
                        ? [...value.weekdays, i]
                        : value.weekdays.filter((d) => d !== i),
                    )
                  }
                />
                {weekdayNames[i].slice(0, 3)}
              </label>
            ))}
          </div>
          <h3>Træningsformer</h3>
          <div className="form-grid">
            {(
              [
                ["walk", "Gang"],
                ["cycle", "Cykling"],
                ["walk-run", "Løb/gang"],
                ["elliptical", "Crosstrainer"],
                ["run", "Løb (løbeerfaring)"],
                ["row", "Roning"],
              ] as const
            ).map(([v, l]) => (
              <label className="p-check" key={v}>
                <input
                  type="checkbox"
                  checked={value.forms.includes(v)}
                  onChange={(e) =>
                    field(
                      "forms",
                      e.target.checked
                        ? [...value.forms, v]
                        : value.forms.filter((x) => x !== v),
                    )
                  }
                />
                {l}
              </label>
            ))}
          </div>
          <h3>Tilgængeligt cardioudstyr</h3>
          <div className="form-grid">
            {(
              [
                ["outdoors", "Udendørs"],
                ["bike", "Cykel / motionscykel"],
                ["treadmill", "Løbebånd"],
                ["elliptical", "Crosstrainer"],
                ["rower", "Romaskine"],
              ] as const
            ).map(([v, l]) => (
              <label className="p-check" key={v}>
                <input
                  type="checkbox"
                  checked={value.equipment.includes(v)}
                  onChange={(e) =>
                    field(
                      "equipment",
                      e.target.checked
                        ? [...value.equipment, v]
                        : value.equipment.filter((x) => x !== v),
                    )
                  }
                />
                {l}
              </label>
            ))}
          </div>
          <p className="p-note">
            Du vælger selv varigheden. Tilpas belastningen til din hverdag, og begynd roligt, hvis du ikke er vant til lange pas.
          </p>
        </>
      )}
    </fieldset>
  );
}
