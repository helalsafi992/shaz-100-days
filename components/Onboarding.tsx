"use client";
import { useEffect, useState } from "react";
import {
  defaults,
  labels,
  energy,
  type Profile,
  localDate,
} from "@/lib/profile";
import { exercises } from "@/lib/training";
import { ingredients } from "@/lib/recipes";
import TrainingSettings from "./TrainingSettings";
import ActivitySettings from "./ActivitySettings";
import { activitySettings } from "@/lib/activity-settings";
import { deficitLevels } from "@/lib/nutrition";
import { intakeVersion } from "@/lib/ai/intake";
import type { IntakeDraft } from "@/lib/ai/intake-draft";
import { GoalQuestions, SafetyQuestions, FoodPreferenceQuestions, PreferredExerciseQuestions, ReviewAIQuestion, newAnswers, restoreAnswers, asDraft, stageError, type WizardAnswers } from "./PersonalizationSteps";
const titles = [
  "Mål og udgangspunkt.",
  "Din træning og dine dage.",
  "Sikkerhed og begrænsninger.",
  "Din madplan.",
  "Klar til dine 100 dage.",
];
const storedSteps = [0, 1, 1, 4, 7];
export default function Onboarding({
  initial,
  initialStep = 0,
  initialVersion = 1,
  editing = false,
}: {
  initial: Profile;
  initialStep?: number;
  initialVersion?: number;
  editing?: boolean;
}) {
  const [p, setP] = useState<Profile>({
      ...defaults,
      ...initial,
      ...activitySettings(initial),
      personalizationVersion: intakeVersion,
    }),
    [step, setStep] = useState(
      initialStep >= 7 ? 4 : initialStep >= 4 ? 3 : initialStep >= 1 ? 1 : 0,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [planPreview, setPlanPreview] = useState<any>(null),
    [startConfirmed, setStartConfirmed] = useState(editing);
  const [answers, setAnswers] = useState<WizardAnswers>(() => newAnswers(initial));
  const [intakeLoaded, setIntakeLoaded] = useState(false);
  const [aiInfo,setAiInfo] = useState<{configured:boolean;questionsApproved:boolean;privacyApproved:boolean}|null>(null);
  const [aiBusy,setAiBusy] = useState(false);
  const [aiReview,setAiReview] = useState<{proposal?:{summary:string;limitations:string[];choices:{slotId:string;selectedId:string;reason:string;pmids:string[]}[]}}|null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/ai/intake", { cache: "no-store" })
      .then(async r => { if (!r.ok) throw Error("Tidligere svar kunne ikke hentes."); return r.json(); })
      .then((d: { draft: IntakeDraft | null }) => { if (active && d.draft) setAnswers(a => restoreAnswers(a, d.draft!)); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Svarene kunne ikke hentes."); })
      .finally(() => { if (active) setIntakeLoaded(true); });
    fetch("/api/ai/personalize",{cache:"no-store"}).then(r=>r.ok?r.json():null)
      .then(d=>{if(active&&d?.configuration)setAiInfo(d.configuration);}).catch(()=>{});
    return () => { active = false; };
  }, []);
  async function persistIntake(includeSafety: boolean) {
    const r = await fetch("/api/ai/intake", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asDraft(answers, includeSafety)) });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Dine svar kunne ikke gemmes.");
  }
  async function requestAIReview() {
    if(!aiInfo?.configured || !aiInfo?.privacyApproved || !aiInfo?.questionsApproved) return;
    setAiBusy(true);setError("");
    try {
      if(!answers.aiConsent)throw Error("Vælg frivillig AI-vurdering først.");
      const draft=asDraft(answers,true);
      await persistIntake(true);
      const intake={...draft,profile:p,dietPattern:p.diet==="halal"?"all":p.diet};
      const r=await fetch("/api/ai/personalize",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({intake,expectedProfileVersion:initialVersion})});
      const d=await r.json();if(!r.ok)throw Error(d.error || "AI-vurdering kunne ikke hentes.");
      setAiReview(d);
    }catch(e){setError(e instanceof Error?e.message:"AI-vurdering kunne ikke hentes.");}
    finally{setAiBusy(false);}
  }
  const calculation = energy(p);
  function field<K extends keyof Profile>(k: K, v: Profile[K]) {
    setPlanPreview(null);
    setP((x) => ({
      ...x,
      ...(k === "nutrition" && v === "calculated"
        ? {
            ...activitySettings(x),
          }
        : {}),
      [k]: v,
    }));
  }
  async function save(next: number, activate = false) {
    setBusy(true);
    setError("");
    try {
      if (!intakeLoaded) throw Error("Vent mens dine svar indlæses.");
      const problem = stageError(step, answers);
      if (problem) throw Error(problem);
      if (step >= 3 && stageError(2, answers)) throw Error(stageError(2, answers)!);
      if ([0,2,3,4].includes(step)) await persistIntake(step >= 2);
      if (editing && !activate) { setStep(next); return; }
      if (editing && activate) {
        const r = await fetch(
          "/api/plan/" +
            (planPreview ? "training-confirm" : "training-preview"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: p,
              expectedVersion: planPreview?.version,
              fingerprint: planPreview?.fingerprint,
            }),
          },
        );
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!planPreview) {
          setPlanPreview(d);
          return;
        }
        location.href = "/app";
        return;
      }
      const r = await fetch("/api/platform/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: p, step: storedSteps[next] }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (activate) {
        if (!editing) {
          const a = await fetch("/api/platform/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmStart: true }),
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
          <span>{step === 4 ? "OPSUMMERING" : `DEL ${step + 1} AF 4`}</span>
        </div>
        <div className="p-track">
          <i style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
        <h1>{titles[step]}</h1>
        <p className="p-muted">
          {editing
            ? "Ændringer gælder fremtidige, ikke påbegyndte træninger. Din historik bevares."
            : "Dine valg gemmes på din konto, når du fortsætter. Du kan vende tilbage på en anden enhed."}
        </p>
        {step === 0 && <GoalQuestions value={answers} onChange={setAnswers}
          onProfileGoal={(goal,level)=>setP(x=>({...x,goal,...(level?{level}:{})}))}/>}
        {step === 1 && (<>
          <TrainingSettings
            value={p}
            onChange={(v) => {
              setP(v);
              setPlanPreview(null);
            }}
          />
          <PreferredExerciseQuestions value={answers} onChange={setAnswers}/>
        </>)}
        {step === 2 && <SafetyQuestions value={answers} onChange={setAnswers}/>}
        {step === 3 && (
          <>
            <FoodPreferenceQuestions value={answers} onChange={setAnswers}/>
            <h2>Kostpræferencer</h2>
            {choices("diet", ["all", "vegetarian", "vegan", "pescatarian"])}
            <label className="p-check">
              <input
                type="checkbox"
                checked={p.halal || p.diet === "halal"}
                onChange={(e) => field("halal", e.target.checked)}
              />
              Halal-egnede ingredienstyper (kan kombineres med vegetarisk)
            </label>
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
        {step === 3 && (
          <>
            <h2>Din beregning</h2>
            {choices("nutrition", ["portions", "calculated"])}
            <label>
              Måltider pr. dag
              <select
                value={p.mealCount || 4}
                onChange={(e) =>
                  setP({
                    ...p,
                    mealCount: Number(e.target.value),
                    mealNames: undefined,
                    mealTimes: undefined,
                  })
                }
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <p className="p-note">
              Samme dagsmål fordeles på dit valgte antal måltider. Du kan
              navngive dem og ændre tidspunkterne i madplanen.
            </p>
            {p.goal === "fat-loss" && p.nutrition === "calculated" && (
              <label>
                Ønsket underskud
                <select
                  value={p.deficitLevel || "moderate"}
                  onChange={(e) =>
                    field(
                      "deficitLevel",
                      e.target.value as Profile["deficitLevel"],
                    )
                  }
                >
                  {deficitLevels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} · {l.percent}%
                    </option>
                  ))}
                </select>
                <small>
                  Produktindstillinger til faglig gennemgang. Uegnede valg
                  blokeres. Aggressivt kræver løbende evaluering og gives aldrig
                  for alle 100 dage.
                </small>
              </label>
            )}
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
        {step === 3 &&
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
              <ActivitySettings
                value={p}
                onChange={(next) => {
                  setP((x) => ({ ...x, ...next }));
                  setPlanPreview(null);
                }}
              />
              <p className="p-note">
                Mifflin–St Jeor og én aktivitetsfaktor for hverdag plus træning.
                Vi lægger ikke træningens forbrænding oveni igen.
              </p>
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
              {calculation && (
                <p className="p-notice">
                  {calculation.available
                    ? `Estimeret ligevægt: ${calculation.maintenance} kcal → underskud ${calculation.percent}% / ${calculation.deficit} kcal → mål ${calculation.kcal} kcal. Madplanens faktiske total vises efter aktivering.`
                    : calculation.explanation}
                </p>
              )}
            </>
          ))}
        {step === 1 && (
          <details>
            <summary>Øvelser jeg foretrækker at undgå</summary>
            <p className="p-note">
              Valgene ændrer fremtidige pas. Hvis en funktion ikke kan dækkes
              med dit udstyr, beder vi dig justere valgene.
            </p>
            {exercises.map((e) => (
              <label className="p-check" key={e.id}>
                <input
                  type="checkbox"
                  checked={(p.exerciseAvoid || []).includes(e.id)}
                  onChange={(ev) =>
                    field(
                      "exerciseAvoid",
                      ev.target.checked
                        ? [...(p.exerciseAvoid || []), e.id]
                        : (p.exerciseAvoid || []).filter((x) => x !== e.id),
                    )
                  }
                />
                {e.name}
              </label>
            ))}
          </details>
        )}
        {step === 4 && (
          <>
            <ReviewAIQuestion value={answers} onChange={setAnswers} disabledReason="AI-vurdering er frivillig og kræver godkendt databehandling. Standardplanen fungerer uden AI." />
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
                  <dt>Styrke / cardio</dt>
                  <dd>
                    {p.days} styrkepas á {p.minutes} min. ·{" "}
                    {p.cardio?.days || 0} cardiopas
                  </dd>
                </div>
                <div>
                  <dt>Kost</dt>
                  <dd>
                    {labels[p.diet]} · {p.mealCount || 4} måltider ·{" "}
                    {labels[p.nutrition]}
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
            {!editing && (
              <label className="p-check">
                <input
                  type="checkbox"
                  checked={startConfirmed}
                  onChange={(e) => setStartConfirmed(e.target.checked)}
                />
                Jeg vælger {p.startDate} som dag 1 i mit 100-dages forløb.
              </label>
            )}
            <p className="p-note">
              Dit køb og din startdato er adskilt. Du har 100 aktive
              kalenderdage fra startdatoen. Dag 101 får du et afsluttende
              overblik; der sker ingen ny betaling.
            </p>
          </>
        )}
        {planPreview && (
          <section className="p-card">
            <h2>Forhåndsvisning</h2>
            <p>{planPreview.explanation}</p>
            <p>
              {planPreview.changes.length} fremtidige pas ændres. Eksisterende
              sæt bevares.
            </p>
            <details>
              <summary>Se berørte datoer og øvelser</summary>
              {planPreview.changes.map((c: any) => (
                <div key={c.id}>
                  <h3>{c.date}</h3>
                  <p>
                    {c.before.title} · {c.before.minutes} min. → {c.after.title}{" "}
                    · {c.after.locationName} · {c.after.minutes} min.
                  </p>
                  <p>{c.after.exercises.map((e: any) => e.name).join(" · ")}</p>
                </div>
              ))}
            </details>
          </section>
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
            disabled={busy || (step === 4 && !startConfirmed)}
            onClick={() => save(Math.min(4, step + 1), step === 4)}
          >
            {busy
              ? "Gemmer…"
              : step === 4
                ? editing
                  ? planPreview
                    ? "Bekræft ændringer"
                    : "Se ændringer før du gemmer"
                  : "Start mit 100-dages forløb"
                : "Gem og fortsæt →"}
          </button>
        </div>
      </section>
    </main>
  );
}
