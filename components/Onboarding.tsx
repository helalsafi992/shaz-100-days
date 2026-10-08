"use client";
import { useState } from "react";
import {
  defaults,
  labels,
  energy,
  type Profile,
  localDate,
} from "@/lib/profile";
import { ingredients } from "@/lib/recipes";
const titles = [
  "Dit mål. Dit udgangspunkt.",
  "Et sted, der passer dig.",
  "Find din ugerytme.",
  "Hvor meget tid har du?",
  "Mad, du har lyst til.",
  "Vælg din tilgang.",
  "Kun det nødvendige.",
  "Din plan er klar til start.",
];
export default function Onboarding({
  initial,
  initialStep = 0,
  editing = false,
}: {
  initial: Profile;
  initialStep?: number;
  editing?: boolean;
}) {
  const [p, setP] = useState<Profile>({ ...defaults, ...initial }),
    [step, setStep] = useState(Math.min(initialStep, 7)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function field<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((x) => ({ ...x, [k]: v }));
  }
  async function save(next: number, activate = false) {
    if (editing && !activate) {
      setStep(next);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/platform/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: p, step: next }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (activate) {
        if (!editing) {
          const a = await fetch("/api/platform/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          const b = await a.json();
          if (!a.ok) throw new Error(b.error);
        }
        location.href = "/app";
      } else setStep(next);
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
  function choices<K extends keyof Profile>(
    key: K,
    options: Profile[K][],
    names?: string[],
  ) {
    return (
      <div className="p-choices">
        {options.map((v, i) => (
          <button
            key={String(v)}
            className={p[key] === v ? "chosen" : ""}
            onClick={() => field(key, v)}
          >
            {names?.[i] || labels[String(v)] || String(v)}
          </button>
        ))}
      </div>
    );
  }
  return (
    <main className="portal onboarding">
      <header className="p-top">
        <a className="logo" href="/">
          SHAZ
        </a>
        <a href="/app">Min konto</a>
      </header>
      <section className="onboard-shell">
        <div className="onboard-progress">
          <span>{editing ? "TILPAS DIN PLAN" : "DIT UDGANGSPUNKT"}</span>
          <span>{step + 1} / 8</span>
        </div>
        <div className="p-track">
          <i style={{ width: `${((step + 1) / 8) * 100}%` }} />
        </div>
        <h1>{titles[step]}</h1>
        <p className="p-muted">
          {editing
            ? "Ændringer gælder fremtidige, ikke påbegyndte træninger. Din historik bevares."
            : "Dine valg gemmes på din konto, når du fortsætter. Du kan vende tilbage på en anden enhed."}
        </p>
        {step === 0 && (
          <>
            <h2>Hvad vil du arbejde mod?</h2>
            {choices("goal", ["fat-loss", "muscle", "fitness"])}
            <h2>Din træningserfaring</h2>
            {choices("level", ["beginner", "intermediate"])}
            <p className="p-note">
              Et selvstyret forløb for voksne. Ved skader, sygdom, graviditet
              eller andre særlige behov skal en relevant fagperson vurdere, om
              træningen passer til dig. Skriv ikke diagnoser her.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="p-choices">
              {(["home", "gym"] as const).map((v) => (
                <button
                  key={v}
                  className={p.place === v ? "chosen" : ""}
                  onClick={() =>
                    setP({
                      ...p,
                      place: v,
                      equipment:
                        v === "home"
                          ? ["bodyweight"]
                          : ["bodyweight", "machines", "dumbbells"],
                    })
                  }
                >
                  {labels[v]}
                </button>
              ))}
            </div>
            <h2>Hvilket udstyr har du?</h2>
            {[
              "bodyweight",
              "dumbbells",
              "band",
              ...(p.place === "gym" ? ["machines", "barbell"] : []),
            ].map((v) => (
              <label className="p-check" key={v}>
                <input
                  type="checkbox"
                  checked={p.equipment.includes(
                    v as Profile["equipment"][number],
                  )}
                  disabled={v === "bodyweight"}
                  onChange={(e) =>
                    field(
                      "equipment",
                      e.target.checked
                        ? [...p.equipment, v as Profile["equipment"][number]]
                        : p.equipment.filter((x) => x !== v),
                    )
                  }
                />
                {labels[v]}
              </label>
            ))}
            <p className="p-note">
              Uden elastik eller vægte bliver trækøvelser lettere øvelser for
              ryg og skulderkontrol. Belastet roning kræver egnet udstyr.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <div className="p-choices">
              {([2, 3, 4] as const).map((d) => (
                <button
                  key={d}
                  className={p.days === d ? "chosen" : ""}
                  onClick={() =>
                    setP({
                      ...p,
                      days: d,
                      weekdays:
                        d === 2 ? [1, 4] : d === 3 ? [1, 3, 5] : [1, 2, 4, 5],
                    })
                  }
                >
                  {d} dage
                </button>
              ))}
            </div>
            <h2>Dine foretrukne dage</h2>
            <div className="weekday-picker">
              {["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"].map((d, i) => (
                <button
                  key={i}
                  className={p.weekdays.includes(i) ? "chosen" : ""}
                  onClick={() =>
                    field(
                      "weekdays",
                      p.weekdays.includes(i)
                        ? p.weekdays.filter((x) => x !== i)
                        : [...p.weekdays, i].sort(),
                    )
                  }
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="p-note">
              Vælg {p.days} dage. Ved 2–3 dage træner du helkrop. Ved 4 dage
              skifter du mellem over- og underkrop.
            </p>
          </>
        )}
        {step === 3 && (
          <>
            {choices(
              "minutes",
              [25, 40, 55],
              ["25 minutter", "40 minutter", "55 minutter"],
            )}
            <p className="p-note">
              Tiden inkluderer opvarmning og pauser. Kortere pas indeholder
              færre øvelser, så planen kan passe til din hverdag.
            </p>
          </>
        )}
        {step === 4 && (
          <>
            {choices("diet", ["all", "vegetarian", "halal"])}
            <h2>Madlavningstid</h2>
            {choices(
              "cookTime",
              [15, 30, 60],
              ["Op til 15 min.", "Op til 30 min.", "Op til 60 min."],
            )}
            <h2>Det vil du undgå</h2>
            <div className="avoid-grid">
              {[
                ["milk", "Mælk"],
                ["gluten", "Glutenholdige råvarer"],
                ["nuts", "Mandler/nødder"],
                ["peanut", "Peanuts"],
                ["egg", "Æg"],
                ["soy", "Soja"],
                ["fish", "Fisk"],
                ...ingredients
                  .filter((x) => !["oil"].includes(x.id))
                  .map((i) => [i.id, i.name]),
              ].map(([v, n]) => (
                <label className="p-check" key={v}>
                  <input
                    type="checkbox"
                    checked={p.avoid.includes(v)}
                    onChange={(e) =>
                      field(
                        "avoid",
                        e.target.checked
                          ? [...p.avoid, v]
                          : p.avoid.filter((x) => x !== v),
                      )
                    }
                  />
                  {n}
                </label>
              ))}
            </div>
            <p className="p-note">
              Filtre følger opskriftens råvarer og garanterer ikke fravær af
              allergener eller krydskontaminering. Ved halal: vælg selv passende
              certificerede produkter, især kød.
            </p>
          </>
        )}
        {step === 5 && (
          <>
            {choices("nutrition", ["portions", "calculated"])}
            <div className="p-card">
              <h2>Portioner er et godt udgangspunkt.</h2>
              <p>
                Byg hovedmåltider med grøntsager, en proteinkilde,
                kartofler/fuldkorn og lidt fedt. Brug opskrifterne som
                inspiration og tilpas efter sult og mæthed. Ingen
                vægtregistrering er nødvendig.
              </p>
            </div>
            <p className="p-note">
              Energiberegning er valgfri og et usikkert skøn. Den er ikke til
              gravide, ammende, personer med spiseforstyrrelser eller til
              medicinske diæter.
            </p>
          </>
        )}
        {step === 6 &&
          (p.nutrition === "portions" ? (
            <div className="p-card">
              <span className="p-eyebrow">INGEN TAL PÅ KROPPEN KRÆVET</span>
              <h2>Du har valgt portioner.</h2>
              <p>
                Din vægt, højde, alder og beregningskategori behøves ikke. Du
                får opskrifter, madplan og indkøbsliste uden kalorimål.
              </p>
            </div>
          ) : (
            <>
              <div className="p-fields">
                {(["age", "height", "weight"] as const).map((k, i) => (
                  <label key={k}>
                    {["Alder i år", "Højde i cm", "Vægt i kg"][i]}
                    <input
                      type="number"
                      step={k === "weight" ? "0.1" : "1"}
                      value={p[k] || ""}
                      onChange={(e) => field(k, Number(e.target.value))}
                    />
                  </label>
                ))}
              </div>
              <label>
                Beregningskategori
                <select
                  value={p.sex || ""}
                  onChange={(e) =>
                    field("sex", e.target.value as Profile["sex"])
                  }
                >
                  <option value="">Vælg</option>
                  <option value="female">Kvindelig koefficient</option>
                  <option value="male">Mandlig koefficient</option>
                </select>
              </label>
              <p className="p-note">
                Den oprindelige Mifflin–St Jeor-formel bruger to biologiske
                kategorier. Vælg portioner, hvis den ikke passer til dig.
              </p>
              <label>
                Din samlede daglige aktivitet
                <select
                  value={p.activity || ""}
                  onChange={(e) =>
                    field("activity", e.target.value as Profile["activity"])
                  }
                >
                  <option value="">Vælg</option>
                  <option value="low">Mest siddende, lidt aktivitet</option>
                  <option value="moderate">
                    En del gang og regelmæssig træning
                  </option>
                  <option value="high">Fysisk aktiv hverdag og træning</option>
                </select>
              </label>
              <label className="p-check">
                <input
                  type="checkbox"
                  checked={p.calculationSuitable || false}
                  onChange={(e) =>
                    field("calculationSuitable", e.target.checked)
                  }
                />
                Jeg er 18–64 år, ikke gravid/ammende og har ikke behov for en
                medicinsk diæt eller behandling af spiseforstyrrelse.
              </label>
              <label className="p-check">
                <input
                  type="checkbox"
                  checked={p.dataConsent || false}
                  onChange={(e) => field("dataConsent", e.target.checked)}
                />
                Jeg giver udtrykkeligt samtykke til at gemme disse valg til
                energiberegningen. Jeg kan vælge portioner og fjerne
                oplysningerne igen.
              </label>
              {energy(p) && (
                <p className="p-notice">
                  {energy(p)?.available
                    ? `Skøn: ca. ${energy(p)?.kcal} kcal/dag.`
                    : energy(p)?.explanation}
                </p>
              )}
            </>
          ))}
        {step === 7 && (
          <>
            <div className="p-card summary-card">
              <span className="p-eyebrow">DET HER ER DIN PLAN</span>
              <h2>
                {p.days} dage om ugen.
                <br />
                {labels[p.place]}. Dit tempo.
              </h2>
              <dl>
                <div>
                  <dt>Udgangspunkt</dt>
                  <dd>{labels[p.level]}</dd>
                </div>
                <div>
                  <dt>Mål</dt>
                  <dd>{labels[p.goal]}</dd>
                </div>
                <div>
                  <dt>Træningstid</dt>
                  <dd>{p.minutes} min.</dd>
                </div>
                <div>
                  <dt>Kost</dt>
                  <dd>
                    {labels[p.diet]} · {labels[p.nutrition]}
                  </dd>
                </div>
              </dl>
            </div>
            {!editing && (
              <label>
                Hvornår skal dag 1 begynde?
                <input
                  type="date"
                  min={localDate()}
                  value={p.startDate}
                  onChange={(e) => field("startDate", e.target.value)}
                />
              </label>
            )}
            <p className="p-note">
              Dit køb og din startdato er adskilt. Du har 100 aktive
              kalenderdage fra startdatoen. Dag 101 får du et afsluttende
              overblik; der sker ingen ny betaling.
            </p>
          </>
        )}
        {error && (
          <p className="p-error" role="alert">
            {error}
          </p>
        )}
        <div className="p-actions">
          {step > 0 && (
            <button
              className="p-secondary"
              disabled={busy}
              onClick={() => setStep(step - 1)}
            >
              Tilbage
            </button>
          )}
          <button
            className="p-button"
            disabled={busy}
            onClick={() => save(Math.min(7, step + 1), step === 7)}
          >
            {busy
              ? "Gemmer…"
              : step === 7
                ? editing
                  ? "Gem fremtidige ændringer"
                  : "Aktivér mit forløb"
                : "Gem og fortsæt →"}
          </button>
        </div>
      </section>
    </main>
  );
}
