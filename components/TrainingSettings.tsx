"use client";
import {
  normalizeProfile,
  weekdays,
  weekdayNames,
  durationValues,
  equipmentValues,
  labels,
  type Profile,
  type Location,
} from "@/lib/profile";
import CardioSettings, { noCardio } from "./CardioSettings";
export default function TrainingSettings({
  value,
  onChange,
}: {
  value: Profile;
  onChange: (p: Profile) => void;
}) {
  const p = normalizeProfile(value);
  const update = (v: Partial<Profile>) => onChange({ ...p, ...v });
  function place(kind: Profile["place"]) {
    const old = p.locations!;
    const types = kind === "both" ? ["home", "gym"] : [kind];
    const locations = types.map(
      (k) =>
        old.find((l) => l.kind === k) || {
          id: k,
          name: k === "home" ? "Hjemme" : "Fitnesscenter",
          kind: k as "home" | "gym",
          equipment: ["bodyweight"] as Location["equipment"],
        },
    );
    update({
      place: kind,
      locations,
      schedule: p.weekdays.map((weekday) => {
        const prev = p.schedule!.find((s) => s.weekday === weekday);
        return {
          weekday,
          locationId: locations.some((l) => l.id === prev?.locationId)
            ? prev!.locationId
            : locations[0].id,
          minutes: prev?.minutes || p.minutes,
        };
      }),
    });
  }
  function days(n: number) {
    const selected = p.weekdays.slice(0, n);
    for (const d of [1, 3, 5, 2, 4, 6])
      if (selected.length < n && !selected.includes(d)) selected.push(d);
    update({
      days: n,
      weekdays: selected,
      schedule: selected.map(
        (weekday) =>
          p.schedule!.find((s) => s.weekday === weekday) || {
            weekday,
            locationId: p.locations![0].id,
            minutes: p.minutes,
          },
      ),
    });
  }
  function toggle(day: number) {
    const selected = p.weekdays.includes(day)
      ? p.weekdays.filter((d) => d !== day)
      : [...p.weekdays, day];
    update({
      weekdays: selected,
      schedule: selected.map(
        (weekday) =>
          p.schedule!.find((s) => s.weekday === weekday) || {
            weekday,
            locationId: p.locations![0].id,
            minutes: p.minutes,
          },
      ),
    });
  }
  return (
    <div className="training-settings">
      <h2>Hvor træner du?</h2>
      <div className="p-choices">
        {(["home", "gym", "both"] as const).map((v) => (
          <button
            type="button"
            key={v}
            aria-pressed={p.place === v}
            className={p.place === v ? "chosen" : ""}
            onClick={() => place(v)}
          >
            {labels[v]}
          </button>
        ))}
      </div>
      {p.locations!.map((l) => (
        <details
          key={l.id}
          className="location-settings"
          open={p.locations!.length === 1}
        >
          <summary>{l.name} · udstyr</summary>
          <label>
            Lokationens navn
            <input
              value={l.name}
              maxLength={60}
              onChange={(e) =>
                update({
                  locations: p.locations!.map((x) =>
                    x.id === l.id ? { ...x, name: e.target.value } : x,
                  ),
                })
              }
            />
          </label>
          <div className="equipment-grid">
            {equipmentValues
              .filter(
                (e) => e !== "machines" || l.equipment.includes("machines"),
              )
              .map((eq) => (
                <label className="p-check" key={eq}>
                  <input
                    type="checkbox"
                    checked={l.equipment.includes(eq)}
                    disabled={eq === "bodyweight"}
                    onChange={(e) =>
                      update({
                        locations: p.locations!.map((x) =>
                          x.id === l.id
                            ? {
                                ...x,
                                equipment: e.target.checked
                                  ? [...x.equipment, eq]
                                  : x.equipment.filter((v) => v !== eq),
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  {labels[eq]}
                </label>
              ))}
          </div>
          <label>
            Højeste tilgængelige belastning, kg (valgfrit)
            <input
              type="number"
              min={0}
              max={500}
              value={l.maxLoadKg ?? ""}
              onChange={(e) =>
                update({
                  locations: p.locations!.map((x) =>
                    x.id === l.id
                      ? {
                          ...x,
                          maxLoadKg: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }
                      : x,
                  ),
                })
              }
            />
          </label>
          <p className="p-note">
            Markér kun udstyr, du faktisk har. Et homegym må gerne have
            vægtstang og rack. Belastningen vælges inden for dit udstyr; der
            foreslås ikke automatisk en vægt.
          </p>
        </details>
      ))}
      <h2>Din styrkeuge</h2>
      <label>
        Styrkepas om ugen
        <select value={p.days} onChange={(e) => days(Number(e.target.value))}>
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} pas
              {n === 0
                ? " · kun kost/cardio"
                : n === 1
                  ? " · begrænset start/vedligeholdelse"
                  : n >= 5
                    ? " · afventer godkendt skabelon"
                    : ""}
            </option>
          ))}
        </select>
      </label>
      {p.days >= 5 && (
        <p className="p-notice">
          5–6 pas kræver erfaring og en fagligt godkendt split-skabelon. Denne
          skabelon er ikke frigivet. Vælg højst 4 pas for at gemme.
        </p>
      )}
      {p.days > 0 && (
        <>
          <p>Vælg {p.days} konkrete dage. Ingen dage flyttes uden dit valg.</p>
          <div className="weekday-picker">
            {weekdays.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={p.weekdays.includes(d)}
                className={p.weekdays.includes(d) ? "chosen" : ""}
                onClick={() => toggle(d)}
              >
                {weekdayNames[d].slice(0, 3)}
              </button>
            ))}
          </div>
          {weekdays
            .filter((d) => p.weekdays.includes(d))
            .map((d) => {
              const s = p.schedule!.find((s) => s.weekday === d)!;
              return (
                <div className="schedule-slot" key={d}>
                  <h3>{weekdayNames[d]}</h3>
                  <label>
                    Sted
                    <select
                      value={s.locationId}
                      onChange={(e) =>
                        update({
                          schedule: p.schedule!.map((x) =>
                            x.weekday === d
                              ? { ...x, locationId: e.target.value }
                              : x,
                          ),
                        })
                      }
                    >
                      {p.locations!.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tid inkl. opvarmning
                    <select
                      value={s.minutes}
                      onChange={(e) =>
                        update({
                          schedule: p.schedule!.map((x) =>
                            x.weekday === d
                              ? { ...x, minutes: Number(e.target.value) }
                              : x,
                          ),
                        })
                      }
                    >
                      {durationValues.map((m) => (
                        <option key={m} value={m}>
                          {m} minutter
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
        </>
      )}
      <details>
        <summary>Anden sport i min uge</summary>
        <p className="p-note">
          Medregnes i belastningskontrollen; ændrer ikke dit kaloriemål
          automatisk.
        </p>
        {(p.otherSport || []).map((s, i) => (
          <div className="schedule-slot" key={i}>
            <label>
              Aktivitet
              <input
                value={s.name}
                maxLength={60}
                onChange={(e) =>
                  update({
                    otherSport: p.otherSport!.map((x, j) =>
                      i === j ? { ...x, name: e.target.value } : x,
                    ),
                  })
                }
              />
            </label>
            <label>
              Dag
              <select
                value={s.weekday}
                onChange={(e) =>
                  update({
                    otherSport: p.otherSport!.map((x, j) =>
                      i === j ? { ...x, weekday: Number(e.target.value) } : x,
                    ),
                  })
                }
              >
                {weekdays.map((d) => (
                  <option key={d} value={d}>
                    {weekdayNames[d]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Minutter
              <input
                type="number"
                min={10}
                max={240}
                value={s.minutes}
                onChange={(e) =>
                  update({
                    otherSport: p.otherSport!.map((x, j) =>
                      i === j ? { ...x, minutes: Number(e.target.value) } : x,
                    ),
                  })
                }
              />
            </label>
            <label className="p-check">
              <input
                type="checkbox"
                checked={s.hard}
                onChange={(e) =>
                  update({
                    otherSport: p.otherSport!.map((x, j) =>
                      i === j ? { ...x, hard: e.target.checked } : x,
                    ),
                  })
                }
              />
              Hård belastning
            </label>
            <button
              className="p-secondary"
              onClick={() =>
                update({ otherSport: p.otherSport!.filter((_, j) => i !== j) })
              }
            >
              Fjern aktivitet
            </button>
          </div>
        ))}
        <button
          className="p-secondary"
          type="button"
          onClick={() =>
            update({
              otherSport: [
                ...(p.otherSport || []),
                { name: "Anden sport", weekday: 6, minutes: 45, hard: false },
              ],
            })
          }
        >
          Tilføj anden sport
        </button>
      </details>
      <CardioSettings
        value={p.cardio || noCardio}
        onChange={(cardio) => update({ cardio })}
      />
    </div>
  );
}
