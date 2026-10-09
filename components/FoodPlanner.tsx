"use client";
import { Icon, MoreActions } from "./customer/SimpleExperience";
import { numberLabel } from "@/lib/experience-summary";
import { portionMeasure } from "@/lib/portion-policy";
import { useEffect, useState, type ReactNode } from "react";
import { ingredients, nutrients, suitable, type Recipe } from "@/lib/recipes";
import {
  mealQuality,
  mealShopping,
  optionFor,
  portion,
  portionBounds,
  type MealDay,
  type MealOption,
  type MealSlot,
} from "@/lib/meal-plan";
import { estimate, deficitLevels } from "@/lib/nutrition";
import { addDays, type Profile } from "@/lib/profile";
import { shoppingGroups, displayMass } from "@/lib/shopping";
import BatchMeal from "./BatchMeal";
import ActivitySettings from "./ActivitySettings";
import { activitySettings } from "@/lib/activity-settings";
type Row = { date: string; data: MealDay; version: number };
type State = {
  profile: { data: Profile; version: number; start_date: string };
  days: Row[];
  energy: ReturnType<typeof estimate>;
};
const pretty = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
export function FoodSummary({ today }: { today: string }) {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/plan/prepare-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: today }),
    })
      .then(async (r) => {
        if (!r.ok) throw Error((await r.json()).error);
        return fetch("/api/plan/state?start=" + today);
      })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        return d;
      })
      .then(setState)
      .catch((e) =>
        setError(
          e.message || "Madplanen kunne ikke indlæses. Prøv igen på Mad.",
        ),
      );
  }, [today]);
  const day = state?.days.find((d) => d.date === today)?.data,
    q = day ? mealQuality(day) : null;
  return (
    <section className="s-food-summary">
      <div className="s-section-header">
        <h2>Dagens mad</h2>
        <a href="/app/food" className="s-inline-link">
          Åbn madplan <Icon name="arrow" size={16} />
        </a>
      </div>
      {error ? (
        <p role="alert" className="p-error">
          {error}
        </p>
      ) : !day ? (
        <p className="s-food-meta" role="status">
          Henter din madplan…
        </p>
      ) : (
        <>
          <p className="s-food-meta">
            {day.slots.length} måltider · {numberLabel(q!.total.kcal)} kcal
            planlagt{day.target ? " · mål " + numberLabel(day.target) : ""}
          </p>
          <div className="s-food-list">
            {day.slots.map((s, i) => (
              <a href="/app/food" key={s.id}>
                <span className="s-meal-no">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>
                    {s.selected?.recipe.name || "Vælg en opskrift"}
                  </strong>
                  <small>
                    {s.time} · {s.name}
                    {s.status === "eaten"
                      ? " · Spist"
                      : s.status === "skipped"
                        ? " · Sprunget over"
                        : ""}
                  </small>
                </span>
                {s.status === "eaten" ? (
                  <Icon name="check" size={16} />
                ) : (
                  <Icon name="arrow" size={14} />
                )}
              </a>
            ))}
          </div>
          <p className="s-food-progress">
            <strong>
              {day.slots.filter((s) => s.status === "eaten").length} af{" "}
              {day.slots.length}
            </strong>{" "}
            registreret som spist · {numberLabel(q!.actual.kcal)} kcal
          </p>
        </>
      )}
    </section>
  );
}
export default function FoodPlanner({
  today,
  recipes,
  library,
  shopping,
  action,
  onChange,
}: {
  onChange: () => Promise<void>;
  today: string;
  recipes: Recipe[];
  library: ReactNode;
  shopping: {
    week: string;
    ingredient_id: string;
    checked: boolean;
    checked_grams?: number | string;
  }[];
  action: (path: string, data: unknown) => Promise<boolean>;
}) {
  const [state, setState] = useState<State | null>(null),
    [date, setDate] = useState(today),
    [shoppingDays, setShoppingDays] = useState(7),
    [tab, setTab] = useState("plan"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState(false),
    [form, setForm] = useState<Profile | null>(null),
    [preview, setPreview] = useState<any>(null),
    [review, setReview] = useState(false),
    [modal, setModal] = useState<{ slot: MealSlot; mode: string } | null>(null),
    [recipe, setRecipe] = useState<MealOption | null>(null),
    [q, setQ] = useState(""),
    [amount, setAmount] = useState(1);
  const [pendingChoice, setPendingChoice] = useState<MealOption | null>(null),
    [showMore, setShowMore] = useState(false);
  const [pendingShopping, setPendingShopping] = useState<
    Record<string, boolean>
  >({});
  const [batchSlot, setBatchSlot] = useState<MealSlot | null>(null);
  useEffect(() => {
    setPendingChoice(null);
    setShowMore(false);
  }, [modal]);
  async function load(start = date) {
    const prepared = await fetch("/api/plan/prepare-meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, count: shoppingDays }),
    });
    if (!prepared.ok) {
      const d = await prepared.json();
      throw Error(d.error || "Madplanen kunne ikke indlæses.");
    }
    const r = await fetch(
      "/api/plan/state?start=" + start + "&count=" + shoppingDays,
      {
        cache: "no-store",
      },
    );
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setState(d);
    setError("");
    if (start < d.profile.start_date) setDate(d.profile.start_date);
    return d as State;
  }
  useEffect(() => {
    load(date).catch((e) => setError(e.message));
  }, [date, shoppingDays]);
  async function request(path: string, data: unknown) {
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
  const row = state?.days.find((d) => d.date === date),
    day = row?.data,
    quality = day ? mealQuality(day) : null,
    p = state?.profile.data;
  async function meal(slot: MealSlot, type: string, extra = {}) {
    if (!row) return;
    const r = await request("meal", {
      date,
      slot: slot.id,
      action: type,
      expectedVersion: row.version,
      ...extra,
    });
    if (r) {
      try {
        await load();
        setModal(null);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Handlingen er gemt, men overblikket kunne ikke opdateres. Genindlæs siden.",
        );
      }
    }
  }
  function openSettings() {
    if (!p) return;
    setForm({
      ...p,
      ...activitySettings(p),
      mealCount: p.mealCount || 4,
      mealNames:
        p.mealNames ||
        Array.from({ length: p.mealCount || 4 }, (_, i) => "Måltid " + (i + 1)),
      mealTimes:
        p.mealTimes ||
        Array.from(
          { length: p.mealCount || 4 },
          (_, i) =>
            `${String(10 + Math.round((i * 10) / Math.max(1, (p.mealCount || 4) - 1))).padStart(2, "0")}:00`,
        ),
    });
    setPreview(null);
    setReview(false);
    setEdit(true);
  }
  function field(key: keyof Profile, value: unknown) {
    setForm((f) => ({ ...f!, [key]: value }));
    setPreview(null);
  }
  const e = form ? estimate(form) : null;
  return (
    <div className="food-planner">
      <div className="p-section-head">
        <div>
          <span className="p-eyebrow">MAD TIL DIN HVERDAG</span>
          <h1>Mad</h1>
        </div>
        <button className="p-secondary" onClick={openSettings} disabled={!p}>
          Tilpas madplan
        </button>
      </div>
      <div className="food-tabs" role="tablist" aria-label="Mad">
        {[
          ["plan", "Min madplan"],
          ["recipes", "Opskrifter"],
          ["shopping", "Indkøb"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            aria-controls="food-tab-panel"
            onKeyDown={(event) => {
              const ids = ["plan", "recipes", "shopping"],
                i = ids.indexOf(id);
              const next =
                event.key === "ArrowRight"
                  ? (i + 1) % 3
                  : event.key === "ArrowLeft"
                    ? (i + 2) % 3
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? 2
                        : -1;
              if (next < 0) return;
              event.preventDefault();
              setTab(ids[next]);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('button[role="tab"]')
                [next]?.focus();
            }}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="p-error" role="alert">
          {error}
        </p>
      )}
      <div
        id="food-tab-panel"
        role="tabpanel"
        aria-label={
          tab === "plan"
            ? "Min madplan"
            : tab === "recipes"
              ? "Opskrifter"
              : "Indkøb"
        }
      >
        {tab === "recipes" ? (
          library
        ) : (
          <>
            <div className="day-selector">
              <button
                className="p-secondary"
                aria-label="Forrige dag"
                onClick={() => setDate(addDays(date, -1))}
                disabled={!state || date <= state.profile.start_date}
              >
                ←
              </button>
              <label>
                {tab === "shopping" ? "Indkøb fra" : "Vælg dag"}
                <input
                  type="date"
                  value={date}
                  min={state?.profile.start_date}
                  max={
                    state ? addDays(state.profile.start_date, 99) : undefined
                  }
                  onChange={(ev) => ev.target.value && setDate(ev.target.value)}
                />
              </label>
              <button
                className="p-secondary"
                aria-label="Næste dag"
                onClick={() => setDate(addDays(date, 1))}
                disabled={
                  !state || date >= addDays(state.profile.start_date, 99)
                }
              >
                →
              </button>
            </div>
            {!state ? (
              <p className="p-card">Henter dine gemte valg…</p>
            ) : tab === "shopping" ? (
              <section className="p-card">
                <h2>Kun det, du har valgt.</h2>
                <label>
                  Antal dage i indkøbet
                  <select
                    value={shoppingDays}
                    onChange={(e) => setShoppingDays(Number(e.target.value))}
                  >
                    {Array.from({ length: 14 }, (_, i) => (
                      <option value={i + 1} key={i + 1}>
                        {i + 1} {i ? "dage" : "dag"}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Fra {pretty(date)} og de næste {state.days.length} dage. A-,
                  B- og C-alternativer tæller ikke med.
                </p>
                {state.days.some((d) =>
                  d.data.slots.some((s) => s.batch && s.batch.cookDate < date),
                ) && (
                  <p className="p-notice">
                    Intervallet indeholder rester fra en tidligere
                    madlavningsdag. Deres ingredienser står på den dag og bliver
                    ikke købt igen her.
                  </p>
                )}
                {shoppingGroups(state.days.map((d) => d.data)).map((group) => (
                  <section key={group.name} aria-label={group.name}>
                    <h3>{group.name}</h3>
                    <div className="shopping-grid">
                      {group.items.map((i) => (
                        <label className="shopping-item" key={i.id}>
                          <input
                            type="checkbox"
                            disabled={Object.hasOwn(
                              pendingShopping,
                              `${date}:${shoppingDays}:${i.id}`,
                            )}
                            aria-busy={Object.hasOwn(
                              pendingShopping,
                              `${date}:${shoppingDays}:${i.id}`,
                            )}
                            checked={
                              pendingShopping[
                                `${date}:${shoppingDays}:${i.id}`
                              ] ??
                              shopping.some(
                                (s) =>
                                  s.week === date &&
                                  s.ingredient_id === i.id &&
                                  s.checked &&
                                  Number(s.checked_grams || 0) >= i.grams,
                              )
                            }
                            onChange={async (ev) => {
                              const key = `${date}:${shoppingDays}:${i.id}`,
                                on = ev.target.checked;
                              setPendingShopping((s) => ({ ...s, [key]: on }));
                              try {
                                await action("shopping", {
                                  week: date,
                                  id: i.id,
                                  on,
                                  count: shoppingDays,
                                });
                              } finally {
                                setPendingShopping((s) => {
                                  const next = { ...s };
                                  delete next[key];
                                  return next;
                                });
                              }
                            }}
                          />
                          <span>
                            {i.name}
                            <small>{i.basis}</small>
                            {shopping.some(
                              (s) =>
                                s.week === date &&
                                s.ingredient_id === i.id &&
                                s.checked &&
                                Number(s.checked_grams || 0) < i.grams,
                            ) && (
                              <small>
                                Øget behov — kontrollér mængden igen
                              </small>
                            )}
                          </span>
                          <b>{displayMass(i.grams)}</b>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </section>
            ) : day && quality ? (
              <>
                <section
                  className="p-card daily-nutrition"
                  aria-label="Dagens energi og protein"
                >
                  <div className="s-nutrition-header">
                    <div>
                      <span>Planlagt i dag</span>
                      <strong>
                        {numberLabel(quality.total.kcal)} <small>kcal</small>
                      </strong>
                    </div>
                    <div>
                      <span>Dit daglige mål</span>
                      <strong>
                        {day.target ? numberLabel(day.target) : "Uden mål"}{" "}
                        <small>{day.target ? "kcal" : ""}</small>
                      </strong>
                    </div>
                  </div>
                  <p className="s-nutrition-secondary">
                    <b>{numberLabel(quality.total.protein)} g protein</b>{" "}
                    planlagt
                    {day.proteinTarget
                      ? " · minimumsmål " + day.proteinTarget + " g"
                      : ""}
                  </p>
                  <p className="s-nutrition-secondary">
                    Registreret som spist:{" "}
                    <b>{numberLabel(quality.actual.kcal)} kcal</b> ·{" "}
                    {numberLabel(quality.actual.protein)} g protein
                  </p>
                  {quality.issues.length > 0 && (
                    <details className="plan-issues" open>
                      <summary>Planen kræver din opmærksomhed</summary>
                      {quality.issues.map((x) => (
                        <p key={x}>{x}</p>
                      ))}
                    </details>
                  )}
                  <details className="s-nutrition-details">
                    <summary>Om beregning og mål</summary>
                    <p>
                      Energi og næringsindhold er beregnede estimater fra
                      råvarerne. Planlagt er ikke det samme som spist. Komplette
                      automatiske planer sigter efter højst 5 % afvigelse fra
                      målet.
                    </p>
                    <p>
                      Proteinvisningen viser den valgte plan og et separat
                      minimumsmål – ikke et maksimum. Beregningen kontrollerer
                      ikke alle vitaminer og mineraler. Faglig godkendelse af
                      testreglerne afventer.
                    </p>
                  </details>
                </section>
                <div className="meal-cards">
                  {day.slots.map((s) => (
                    <section className="p-card meal-card" key={s.id}>
                      <div className="s-meal-top">
                        <span className="p-eyebrow">
                          {s.time} · {s.name}
                        </span>
                        <span className={"status " + s.status}>
                          {s.status === "eaten"
                            ? "Spist"
                            : s.status === "skipped"
                              ? "Sprunget over"
                              : "Planlagt"}
                        </span>
                        <MoreActions label={"Flere muligheder for " + s.name}>
                          {s.status === "planned" && !s.batch && s.selected && (
                            <>
                              <button
                                disabled={busy}
                                onClick={() => {
                                  setAmount(s.selected!.servings);
                                  setModal({ slot: s, mode: "portion" });
                                }}
                              >
                                Tilpas portion
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => meal(s, "remove")}
                              >
                                Fjern måltid
                              </button>
                              {date >= today &&
                                date <
                                  addDays(state!.profile.start_date, 99) && (
                                  <button
                                    disabled={busy}
                                    onClick={() => setBatchSlot(s)}
                                  >
                                    Lav også til i morgen
                                  </button>
                                )}
                            </>
                          )}
                          {date <= today &&
                            (s.status === "planned" ? (
                              <button
                                disabled={busy}
                                onClick={() => meal(s, "skipped")}
                              >
                                Jeg sprang måltidet over
                              </button>
                            ) : (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  window.confirm(
                                    "Ophæv registreringen, så du kan rette måltidet?",
                                  ) && meal(s, "reopen")
                                }
                              >
                                Ret registrering
                              </button>
                            ))}
                          {s.status === "planned" && s.batch && (
                            <span className="s-menu-note">
                              Fælles madlavning ændres under sammenkædningen
                              nedenfor.
                            </span>
                          )}
                        </MoreActions>
                      </div>
                      {s.selected ? (
                        <>
                          <div className="s-meal-title">
                            <span className="s-meal-symbol">
                              <Icon name="food" />
                            </span>
                            <div>
                              <h2>{s.selected.recipe.name}</h2>
                              <p className="s-meal-facts">
                                {numberLabel(s.selected.totals.kcal)} kcal ·{" "}
                                {numberLabel(s.selected.totals.protein)} g
                                protein · {s.selected.recipe.minutes} min.
                              </p>
                            </div>
                          </div>
                          <div className="s-meal-actions">
                            <button onClick={() => setRecipe(s.selected)}>
                              Se opskrift
                            </button>
                            {s.status === "planned" && !s.batch && (
                              <button
                                disabled={busy}
                                onClick={() => {
                                  setModal({ slot: s, mode: "swap" });
                                  setQ("");
                                }}
                              >
                                Byt · {s.options.length} valg
                              </button>
                            )}
                            {date <= today && s.status === "planned" && (
                              <button
                                className="s-eaten"
                                disabled={busy}
                                onClick={() => meal(s, "eaten")}
                              >
                                <Icon name="check" size={14} />
                                Spist
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="empty-meal">
                          <h2>Vælg et nyt måltid</h2>
                          <p>
                            Kaloriemålet er uændret. Vælg blandt dine egnede
                            opskrifter.
                          </p>
                          <button
                            className="p-secondary"
                            onClick={() => {
                              setModal({ slot: s, mode: "swap" });
                              setQ("");
                            }}
                          >
                            Vælg en anden opskrift
                          </button>
                          {s.previous && (
                            <button
                              className="s-text-action"
                              disabled={busy}
                              onClick={() => meal(s, "undo")}
                            >
                              Fortryd fjernelse
                            </button>
                          )}
                        </div>
                      )}
                      {s.batch && (
                        <div className="p-notice">
                          <b>
                            {s.batch.cookDate === date &&
                            s.batch.cookSlot === s.id
                              ? "Fælles madlavning"
                              : "Rester fra " + pretty(s.batch.cookDate)}
                          </b>
                          <p>
                            Din energi ovenfor gælder kun din portion. Hele
                            madlavningens ingredienser står i indkøbet på{" "}
                            {pretty(s.batch.cookDate)}.
                          </p>
                          {s.batch.cookDate === date && (
                            <details>
                              <summary>Mængder til hele madlavningen</summary>
                              <ul>
                                {s.batch.ingredients.map((i) => (
                                  <li key={i.id}>
                                    {
                                      ingredients.find((v) => v.id === i.id)
                                        ?.name
                                    }
                                    : {i.grams} g
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                          {s.status === "planned" && (
                            <button
                              className="p-secondary"
                              disabled={busy}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    "Opløs fælles madlavning? Er alt stadig planlagt, beholdes retterne som separate tilberedninger. Er noget allerede registreret eller historisk, bevares det, mens fremtidige rester bliver til tomme måltidspladser, som du kan erstatte. Kaloriemålet ændres ikke.",
                                  )
                                )
                                  return;
                                const r = await request("batch-unlink", {
                                  id: s.batch!.id,
                                });
                                if (r) await load();
                              }}
                            >
                              Opløs sammenkædning
                            </button>
                          )}
                        </div>
                      )}
                      {s.issue && <p className="p-notice">{s.issue}</p>}
                    </section>
                  ))}
                </div>
              </>
            ) : (
              <p>Vælg en dag inden for dit forløb.</p>
            )}
          </>
        )}
      </div>
      {batchSlot && (
        <BatchMeal
          date={date}
          slot={batchSlot}
          next={state?.days.find((d) => d.date === addDays(date, 1))?.data}
          close={() => setBatchSlot(null)}
          saved={async () => {
            await load();
          }}
        />
      )}
      {edit && form && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Beregn og tilpas madplan"
        >
          <div className="p-dialog">
            <button
              className="dialog-close"
              aria-label="Luk beregner"
              onClick={() => setEdit(false)}
            >
              ×
            </button>
            <span className="p-eyebrow">DIT MÅL · DINE PORTIONER</span>
            <h2>Beregn og tilpas.</h2>
            {error && (
              <p className="p-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-grid">
              <label>
                Tilgang
                <select
                  value={form.nutrition}
                  onChange={(ev) => field("nutrition", ev.target.value)}
                >
                  <option value="calculated">Beregnet kaloriemål</option>
                  <option value="portions">Portionsvejledning</option>
                </select>
              </label>
              <label>
                Mål
                <select
                  value={form.goal}
                  onChange={(ev) => field("goal", ev.target.value)}
                >
                  <option value="fat-loss">Fedttab</option>
                  <option value="maintain">Vedligeholdelse</option>
                  <option value="muscle">Muskelopbygning</option>
                  <option value="fitness">Bedre form / vedligeholdelse</option>
                </select>
              </label>
            </div>
            {form.nutrition === "calculated" && (
              <>
                <div className="form-grid">
                  {[
                    ["age", "Alder"],
                    ["height", "Højde (cm)"],
                    ["weight", "Vægt (kg)"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        inputMode="decimal"
                        value={Number(form[key as keyof Profile]) || ""}
                        onChange={(ev) =>
                          field(key as keyof Profile, Number(ev.target.value))
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Beregningsparameter
                    <select
                      value={form.sex || ""}
                      onChange={(ev) => field("sex", ev.target.value)}
                    >
                      <option value="">Vælg</option>
                      <option value="male">Mandlig koefficient</option>
                      <option value="female">Kvindelig koefficient</option>
                    </select>
                  </label>
                </div>
                <ActivitySettings
                  value={form}
                  onChange={(next) => {
                    setForm((f) => ({ ...f!, ...next }));
                    setPreview(null);
                  }}
                />
                <label className="p-check">
                  <input
                    type="checkbox"
                    checked={Boolean(form.calculationSuitable)}
                    onChange={(ev) =>
                      field("calculationSuitable", ev.target.checked)
                    }
                  />
                  Jeg er 18–64 år, ikke gravid/ammende og har ikke relevante
                  medicinske ernæringsbehov eller spiseforstyrrelsesproblematik.
                </label>
                <label className="p-check">
                  <input
                    type="checkbox"
                    checked={Boolean(form.dataConsent)}
                    onChange={(ev) => field("dataConsent", ev.target.checked)}
                  />
                  Jeg samtykker udtrykkeligt til at gemme oplysningerne til
                  beregningen. Jeg kan fjerne dem ved at vælge
                  portionsvejledning.
                </label>
                {form.goal === "fat-loss" && (
                  <fieldset>
                    <legend>Vælg underskud</legend>
                    <div className="deficit-options">
                      {deficitLevels.map((l) => {
                        const o = e?.available
                          ? e.options.find((x) => x.id === l.id)
                          : null;
                        return (
                          <button
                            key={l.id}
                            className={
                              form.deficitLevel === l.id ||
                              (!form.deficitLevel && l.id === "moderate")
                                ? "selected"
                                : ""
                            }
                            onClick={() => field("deficitLevel", l.id)}
                          >
                            <b>
                              {l.name} · {l.percent} %
                            </b>
                            <span>
                              {o
                                ? `${o.deficit} kcal under · mål ${o.target} kcal`
                                : "Udfyld beregningen"}
                            </span>
                            {o && !o.allowed && <small>{o.reason}</small>}
                          </button>
                        );
                      })}
                    </div>
                    {form.deficitLevel === "aggressive" && (
                      <label className="p-check">
                        <input
                          type="checkbox"
                          checked={review}
                          onChange={(ev) => {
                            setReview(ev.target.checked);
                            setPreview(null);
                          }}
                        />
                        Jeg vil afprøve højst 7 dage og evaluere energi og
                        restitution. Aggressivt er ikke standard eller et bedre
                        valg.
                      </label>
                    )}
                  </fieldset>
                )}
                {e?.available ? (
                  <div className="nutrition-strip">
                    <span>
                      Estimeret ligevægt<b>{e.maintenance} kcal</b>
                    </span>
                    <span>
                      {e.surplus ? "Overskud" : "Underskud"}
                      <b>{e.surplus || e.deficit} kcal</b>
                    </span>
                    <span>
                      Kaloriemål<b>{e.target} kcal</b>
                    </span>
                  </div>
                ) : (
                  e && <p className="p-notice">{e.explanation}</p>
                )}
                <details>
                  <summary>Sådan beregner vi</summary>
                  <p>
                    Mifflin–St Jeor: 10 × kg + 6,25 × cm − 5 × alder, plus 5
                    eller minus 161. Hvilestofskiftet ganges med én samlet
                    aktivitetsfaktor: hverdagsaktivitet 1,20 / 1,35 / 1,50 plus
                    træningsaktivitet 0,10 / 0,20 / 0,30. Det er foreløbige
                    produktantagelser. Ældre gemte samlede faktorer på 1,4 / 1,6
                    / 1,8 bevares indtil et aktivt ændringsvalg. Ingen ekstra
                    kalorier lægges til efter cardio.
                  </p>
                </details>
              </>
            )}
            <div className="form-grid">
              <label>
                Måltider om dagen
                <select
                  value={form.mealCount || 4}
                  onChange={(ev) => {
                    const n = Number(ev.target.value);
                    field("mealCount", n);
                    field(
                      "mealNames",
                      Array.from(
                        { length: n },
                        (_, i) => form.mealNames?.[i] || "Måltid " + (i + 1),
                      ),
                    );
                    field(
                      "mealTimes",
                      Array.from(
                        { length: n },
                        (_, i) =>
                          form.mealTimes?.[i] ||
                          `${String(10 + Math.round((i * 10) / (n - 1))).padStart(2, "0")}:00`,
                      ),
                    );
                  }}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} måltider
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Personer til indkøb
                <select
                  value={form.householdSize || 1}
                  onChange={(ev) =>
                    field("householdSize", Number(ev.target.value))
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "person" : "personer"}
                    </option>
                  ))}
                </select>
                <small>
                  Indkøb skaleres. Dit personlige kaloriemål og din portion
                  ændres ikke.
                </small>
              </label>
              <label>
                Kostpræference
                <select
                  value={form.diet}
                  onChange={(ev) => field("diet", ev.target.value)}
                >
                  <option value="all">Spiser det meste</option>
                  <option value="vegetarian">Vegetarisk</option>
                  {form.diet === "halal" && (
                    <option value="halal">
                      Halal-egnet (eksisterende valg)
                    </option>
                  )}
                </select>
              </label>
              <label className="p-check">
                <input
                  type="checkbox"
                  checked={form.halal || form.diet === "halal"}
                  onChange={(ev) => field("halal", ev.target.checked)}
                />
                Halal-egnede ingredienstyper
              </label>
              <label>
                Tilberedningstid
                <select
                  value={form.cookTime}
                  onChange={(ev) => field("cookTime", Number(ev.target.value))}
                >
                  {[15, 30, 60].map((n) => (
                    <option key={n} value={n}>
                      Op til {n} min.
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <details>
              <summary>Navne og tidspunkter på måltider</summary>
              {Array.from({ length: form.mealCount || 4 }, (_, i) => (
                <div className="form-grid" key={i}>
                  <label>
                    Navn {i + 1}
                    <input
                      value={form.mealNames?.[i] || "Måltid " + (i + 1)}
                      maxLength={40}
                      onChange={(ev) =>
                        field(
                          "mealNames",
                          Array.from({ length: form.mealCount || 4 }, (_, j) =>
                            j === i
                              ? ev.target.value
                              : form.mealNames?.[j] || "Måltid " + (j + 1),
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Tid {i + 1}
                    <input
                      type="time"
                      value={form.mealTimes?.[i] || "12:00"}
                      onChange={(ev) =>
                        field(
                          "mealTimes",
                          Array.from({ length: form.mealCount || 4 }, (_, j) =>
                            j === i
                              ? ev.target.value
                              : form.mealTimes?.[j] || "12:00",
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </details>
            <details>
              <summary>Fødevarer og allergener du undgår</summary>
              <div className="avoid-grid">
                {[...new Set(ingredients.flatMap((i) => i.allergens))].map(
                  (a) => (
                    <label className="p-check" key={a}>
                      <input
                        type="checkbox"
                        checked={form.avoid.includes(a)}
                        onChange={(ev) =>
                          field(
                            "avoid",
                            ev.target.checked
                              ? [...form.avoid, a]
                              : form.avoid.filter((x) => x !== a),
                          )
                        }
                      />
                      {{
                        milk: "Mælk",
                        gluten: "Gluten",
                        egg: "Æg",
                        soy: "Soja",
                        fish: "Fisk",
                        nuts: "Nødder",
                        peanut: "Peanut",
                      }[a] || a}
                    </label>
                  ),
                )}
                {ingredients.map((i) => (
                  <label className="p-check" key={i.id}>
                    <input
                      type="checkbox"
                      checked={form.avoid.includes(i.id)}
                      onChange={(ev) =>
                        field(
                          "avoid",
                          ev.target.checked
                            ? [...form.avoid, i.id]
                            : form.avoid.filter((x) => x !== i.id),
                        )
                      }
                    />
                    {i.name}
                  </label>
                ))}
              </div>
            </details>
            <p className="p-note">
              Måltidsantal ændrer fordelingen, ikke dit kaloriemål. Allerede
              spiste måltider og tidligere dage bevares.
            </p>
            <button
              className="p-button"
              disabled={busy}
              onClick={async () => {
                const d = await request("nutrition-preview", {
                  settings: form,
                  reviewAggressive: review,
                });
                if (d) setPreview(d);
              }}
            >
              Se nye portioner
            </button>
            {preview && (
              <section className="preview-card">
                <h3>Din forhåndsvisning</h3>
                <p>
                  Mål: {preview.day.target ?? "portioner"} · Beregnet total:{" "}
                  {Math.round(preview.quality.total.kcal)} kcal ·{" "}
                  {Math.round(preview.quality.total.protein)} g protein
                </p>
                {preview.day.slots.map((s: MealSlot) => (
                  <div className="p-list-row" key={s.id}>
                    <span>
                      {s.name}
                      <small>
                        {s.status === "planned"
                          ? "Ny plan"
                          : "Registrering bevaret"}
                      </small>
                    </span>
                    <b>
                      {s.selected?.recipe.name || "Ingen egnet ret"}
                      <small>
                        {s.selected?.servings ?? 0} portion ·{" "}
                        {Math.round(s.selected?.totals.kcal || 0)} kcal
                      </small>
                    </b>
                  </div>
                ))}
                {preview.quality.issues.map((i: string) => (
                  <p className="p-notice" key={i}>
                    {i}
                  </p>
                ))}
                <button
                  className="p-button"
                  disabled={busy}
                  onClick={async () => {
                    const d = await request("nutrition-confirm", {
                      settings: form,
                      reviewAggressive: review,
                      expectedVersion: preview.version,
                      fingerprint: preview.fingerprint,
                    });
                    if (d) {
                      await load();
                      await onChange();
                      setEdit(false);
                    }
                  }}
                >
                  Bekræft og gem ændringen
                </button>
              </section>
            )}
          </div>
        </div>
      )}
      {modal && p && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={
            modal.mode === "portion" ? "Tilpas portion" : "Byt måltid"
          }
        >
          <div className="p-dialog">
            <button
              className="dialog-close"
              aria-label="Luk måltidsvalg"
              onClick={() => setModal(null)}
            >
              ×
            </button>
            <h2>
              {modal.mode === "portion"
                ? "Tilpas portionen."
                : "Hvad har du lyst til?"}
            </h2>
            {error && (
              <p className="p-error" role="alert">
                {error}
              </p>
            )}
            {modal.mode === "portion" ? (
              <>
                <label>
                  Antal grundportioner
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={amount}
                    onChange={(ev) => setAmount(Number(ev.target.value))}
                  />
                </label>
                <p>
                  Kaloriemålet ændres ikke. En afvigelse vises på dagens plan.
                </p>
                <button
                  className="p-button"
                  disabled={busy}
                  onClick={() =>
                    meal(modal.slot, "portion", { servings: amount })
                  }
                >
                  Gem portion
                </button>
              </>
            ) : (
              <>
                <p>
                  Vælg én mulighed til {modal.slot.name}. Kun den valgte ret
                  tæller med.
                </p>
                <div className="meal-alternatives">
                  {modal.slot.options.map((o, i) => (
                    <article key={o.recipe.id}>
                      <img
                        src={"/api/recipe-illustration/" + o.recipe.id}
                        alt={"Ingrediensillustration: " + o.recipe.name}
                      />
                      <span className="p-eyebrow">MULIGHED {"ABC"[i]}</span>
                      <h3>{o.recipe.name}</h3>
                      <p>
                        {o.recipe.minutes} min. · {o.servings} portion
                        <br />
                        {Math.round(o.totals.kcal)} kcal ·{" "}
                        {Math.round(o.totals.protein)} g protein
                      </p>
                      <button
                        className="p-button"
                        disabled={busy}
                        aria-pressed={pendingChoice?.recipe.id === o.recipe.id}
                        onClick={() => setPendingChoice(o)}
                      >
                        {pendingChoice?.recipe.id === o.recipe.id
                          ? "Valgt"
                          : "Vælg " + "ABC"[i]}
                      </button>
                    </article>
                  ))}
                </div>
                {modal.slot.issue && (
                  <p className="p-notice">{modal.slot.issue}</p>
                )}
                <button
                  className="p-secondary"
                  onClick={() => setShowMore((v) => !v)}
                >
                  {showMore ? "Skjul øvrige retter" : "Se flere retter"}
                </button>
                {showMore && (
                  <>
                    <h3>Andre egnede opskrifter</h3>
                    <input
                      aria-label="Søg andre opskrifter"
                      placeholder="Søg efter en ret"
                      value={q}
                      onChange={(ev) => setQ(ev.target.value)}
                    />
                    {recipes
                      .filter(
                        (r) =>
                          suitable(r, p.diet, p.avoid, p.cookTime, p.halal) &&
                          r.name.toLowerCase().includes(q.toLowerCase()),
                      )
                      .map((r) => {
                        const o = modal.slot.target
                          ? optionFor(r, modal.slot.target)
                          : portion(r, 1);
                        return (
                          <div className="p-list-row" key={r.id}>
                            <span>
                              {r.name}
                              <small>
                                {o
                                  ? `${o.servings} portion · ${Math.round(o.totals.kcal)} kcal · ${Math.round(o.totals.protein)} g protein`
                                  : "Passer ikke med realistisk portion til denne måltidsplads"}
                              </small>
                            </span>
                            <button
                              className="p-secondary"
                              disabled={!o || busy}
                              onClick={() => o && setPendingChoice(o)}
                            >
                              Vælg
                            </button>
                          </div>
                        );
                      })}
                  </>
                )}
                <div className="swap-confirm">
                  <p>
                    {pendingChoice
                      ? `Ny dagstotal: ${Math.round((quality?.total.kcal || 0) - (modal.slot.selected?.totals.kcal || 0) + pendingChoice.totals.kcal)} kcal · Kaloriemål: ${day?.target ?? "portioner"}`
                      : "Vælg en ret. Intet ændres, før du bekræfter."}
                  </p>
                  <button
                    className="p-button"
                    disabled={busy || !pendingChoice}
                    onClick={() =>
                      pendingChoice &&
                      meal(modal.slot, "choose", {
                        recipe: pendingChoice.recipe.id,
                        servings: pendingChoice.servings,
                        portionPolicy: pendingChoice.portionPolicy,
                        recipeVersion: pendingChoice.recipe.version,
                      })
                    }
                  >
                    Bekræft bytte
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {recipe && <RecipeDialog option={recipe} close={() => setRecipe(null)} />}
    </div>
  );
}
export function RecipeDialog({
  option,
  close,
}: {
  option: MealOption;
  close: () => void;
}) {
  const r = option.recipe;
  return (
    <div
      className="p-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={r.name}
    >
      <div className="p-dialog">
        <button
          className="dialog-close"
          aria-label="Luk opskrift"
          onClick={close}
        >
          ×
        </button>
        <img
          className="meal-image"
          src={"/api/recipe-illustration/" + r.id}
          alt={"Ingrediensillustration: " + r.name}
        />
        <h2>{r.name}</h2>
        <p>
          {r.minutes} minutter · Ca. {option.servings} grundportioner. Brug de
          viste ingrediensmængder.
        </p>
        <div className="nutrition-strip">
          <span>
            Energi<b>{Math.round(option.totals.kcal)} kcal</b>
          </span>
          <span>
            Protein<b>{Math.round(option.totals.protein)} g</b>
          </span>
          <span>
            Kulhydrat / fedt
            <b>
              {Math.round(option.totals.carbs)} /{" "}
              {Math.round(option.totals.fat)} g
            </b>
          </span>
        </div>
        <h3>Det skal du bruge</h3>
        {r.ingredients.map((i) => {
          const f = ingredients.find((x) => x.id === i.id)!;
          return (
            <div className="p-list-row" key={i.id}>
              <span>
                {f.name}
                <small>{f.basis}</small>
              </span>
              <b>
                {i.grams} g{" "}
                {portionMeasure(i.id, i.grams) && (
                  <small>{portionMeasure(i.id, i.grams)}</small>
                )}
              </b>
            </div>
          );
        })}
        <h3>Sådan gør du</h3>
        <ol className="recipe-steps">
          {r.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="p-note">
          Beregnet fra USDA FoodData Central SR Legacy, april 2018. Gram ×
          næringsværdi pr. 100 g. Kulhydrat inkluderer fiber i USDA-data. Mærke
          og tilberedning ændrer resultatet. Læs emballagen ved allergi.
        </p>
      </div>
    </div>
  );
}
