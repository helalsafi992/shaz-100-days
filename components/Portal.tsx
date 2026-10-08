"use client";
import { useState, useEffect } from "react";
import { labels, energy, addDays, type Profile } from "@/lib/profile";
import {
  nutrients,
  ingredients,
  suitable,
  shoppingList,
  type Recipe,
} from "@/lib/recipes";
import {
  alternatives,
  progression,
  type DayPlan,
  type Exercise,
} from "@/lib/training";
type SetLog = {
  exercise: string;
  set: number;
  reps: number;
  kg: number;
  effort: number;
};
type Day = {
  id: string;
  day: number;
  scheduled_date: string;
  plan: DayPlan;
  status: string;
  log: { sets?: SetLog[] };
};
type Meal = {
  id: string;
  date: string;
  slot: string;
  recipe_id: string;
  servings: number;
  recipe: Recipe;
};
export type PlatformState = {
  help?: { id: string; text: string }[];
  profile: { data: Profile; start_date: string };
  day: number;
  today: string;
  days: Day[];
  meals: Meal[];
  recipes: Recipe[];
  exercises: Exercise[];
  favorites: string[];
  shopping: { week: string; ingredient_id: string; checked: boolean }[];
  checkins: {
    week: number;
    data: { energy: string; recovery: string; fit: string; suggestion: string };
    accepted_at: string | null;
  }[];
  weights: { date: string; kg: string }[];
  reviewMode: boolean;
};
const category: Record<string, string> = {
  breakfast: "Morgenmad",
  lunch: "Frokost",
  dinner: "Aftensmad",
  snack: "Snacks",
};
const fmt = (date: string) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
export default function Portal({
  initial,
  view = "today",
}: {
  initial: PlatformState;
  view?: string;
}) {
  const [state, setState] = useState(initial),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<Day | null>(null),
    [weekStart, setWeekStart] = useState(initial.today);
  const p = state.profile.data;
  const complete = state.days.filter((d) => d.status === "completed");
  const today = state.days.find((d) => d.scheduled_date === state.today);
  const ended = state.day > 100;
  const future = state.day < 1;
  const weekMeals = state.meals.filter(
    (m) => m.date >= weekStart && m.date <= addDays(weekStart, 6),
  );
  async function action(path: string, data: unknown) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const r = await fetch("/api/platform/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const rr = await fetch("/api/platform/state", { cache: "no-store" });
      if (!rr.ok)
        throw new Error(
          "Handlingen blev behandlet, men overblikket kunne ikke hentes. Genindlæs siden.",
        );
      const next = await rr.json();
      setState(next);
      if (selected)
        setSelected(next.days.find((x: Day) => x.id === selected.id) || null);
      setMessage(d.message || "Gemt på din konto.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke gemme. Prøv igen.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const navigation = [
    ["today", "I dag", "◉"],
    ["training", "Træning", "↗"],
    ["food", "Mad", "◒"],
    ["progress", "Fremgang", "▥"],
  ];
  return (
    <div className="portal">
      <header className="p-header">
        <a className="logo" href="/app">
          SHAZ<span>DIT 100-DAGES FORLØB</span>
        </a>
        <nav>
          {navigation.map(([v, label]) => (
            <a
              key={v}
              href={"/app/" + (v === "today" ? "" : v)}
              className={view === v ? "current" : ""}
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          className="profile-link"
          href="/app/profile"
          aria-label="Profil og indstillinger"
        >
          Profil ↗
        </a>
      </header>
      <main className="p-main">
        {state.reviewMode && (
          <div className="review-banner">
            TESTMILJØ · Indhold til gennemgang · Ingen faglig godkendelse
            registreret
          </div>
        )}
        {message && (
          <div className="p-toast" role="status">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="p-error" role="alert">
            {error}
          </div>
        )}
        {view === "today" && (
          <>
            <div className="p-page-heading">
              <div>
                <span className="p-eyebrow">
                  {future
                    ? "DIN STARTDATO · " + fmt(state.profile.start_date)
                    : ended
                      ? "DIT FORLØB ER AFSLUTTET"
                      : `DAG ${state.day} AF 100 · ${today?.plan.phase || ""}`}
                </span>
                <h1>
                  {future
                    ? "Din plan venter på dig."
                    : ended || state.day === 100
                      ? "100 dage. Og videre."
                      : "Én god dag ad gangen."}
                </h1>
                <p>
                  {ended
                    ? "Se tilbage på det, du har registreret. Ingen ny betaling. Intet nyt forløb starter automatisk."
                    : future
                      ? "Dag 1 starter på den dato, du har valgt. Indtil da kan du lære planen at kende."
                      : today?.plan.focus}
                </p>
              </div>
              <div className="day-orbit">
                <b>{Math.min(100, Math.max(0, state.day))}</b>
                <span>AF 100 DAGE</span>
              </div>
            </div>
            <div className="p-grid">
              <section className="p-card primary-card">
                <span className="p-eyebrow">
                  {today?.plan.kind === "workout"
                    ? "DAGENS TRÆNING"
                    : ended
                      ? "DIN OPSUMMERING"
                      : "DAGENS FOKUS"}
                </span>
                <h2>
                  {ended
                    ? `${complete.length} gennemførte træninger.`
                    : today?.plan.title || "Gør plads til din nye rytme."}
                </h2>
                {today?.plan.kind === "workout" ? (
                  <>
                    <div className="p-pills">
                      <span>{today.plan.minutes} min.</span>
                      <span>{today.plan.exercises.length} øvelser</span>
                      <span>{labels[p.place]}</span>
                    </div>
                    <p>
                      Varm op. Følg rækkefølgen. Registrér det, du faktisk
                      gennemfører.
                    </p>
                    <button
                      className="p-button"
                      onClick={() => setSelected(today)}
                    >
                      {today.status === "completed"
                        ? "Se og ret registrering"
                        : "Åbn dagens træning →"}
                    </button>
                  </>
                ) : (
                  <>
                    <p>
                      {ended || state.day === 100
                        ? "Vælg to vaner, du vil fortsætte med. Sammenlign dine første og seneste registreringer i Fremgang. Du behøver ikke sætte en personlig rekord for at afslutte godt."
                        : "En hviledag er en del af planen. Tag eventuelt en behagelig gåtur og giv kroppen tid til at komme sig. Du skal ikke indhente et pas i dag."}
                    </p>
                    <a
                      className="p-button"
                      href={ended ? "/app/progress" : "/app/training"}
                    >
                      {ended ? "Se din registrerede fremgang" : "Se din uge →"}
                    </a>
                  </>
                )}
              </section>
              <section className="p-card">
                <span className="p-eyebrow">MAD I DIN HVERDAG</span>
                <h2>En plan til køleskabet.</h2>
                <p>
                  {state.meals.filter((m) => m.date === state.today).length
                    ? "Dagens valgte måltider:"
                    : "Vælg måltider, du kan lide. Madplanen er inspiration, ikke en automatisk kaloriefordelt diæt."}
                </p>
                {state.meals
                  .filter((m) => m.date === state.today)
                  .map((m) => (
                    <div className="p-list-row" key={m.id}>
                      <span>{category[m.slot]}</span>
                      <b>{m.recipe.name}</b>
                    </div>
                  ))}
                <a className="p-secondary" href="/app/food">
                  Åbn madplan & opskrifter →
                </a>
              </section>
            </div>
            <div className="p-metrics">
              <div>
                <span>GENNEMFØRT</span>
                <b>
                  {complete.length}
                  <small>træninger</small>
                </b>
              </div>
              <div>
                <span>DIN RYTME</span>
                <b>
                  {p.days}
                  <small>dage om ugen</small>
                </b>
              </div>
              <div>
                <span>DIT UDGANGSPUNKT</span>
                <b className="text-metric">{labels[p.level]}</b>
              </div>
            </div>
            <section className="p-card week-card">
              <div>
                <span className="p-eyebrow">DIN NÆSTE UGE</span>
                <h2>Plads til både indsats og ro.</h2>
              </div>
              <div className="p-week">
                {state.days
                  .filter((d) => d.scheduled_date >= state.today)
                  .sort((a, b) =>
                    a.scheduled_date.localeCompare(b.scheduled_date),
                  )
                  .slice(0, 7)
                  .map((d) => (
                    <button
                      disabled={d.plan.kind !== "workout"}
                      onClick={() => setSelected(d)}
                      key={d.id}
                      className={
                        d.status === "completed"
                          ? "done"
                          : d.plan.kind === "workout"
                            ? "training"
                            : ""
                      }
                    >
                      <span>{fmt(d.scheduled_date)}</span>
                      <b>
                        {d.status === "completed"
                          ? "✓"
                          : d.plan.kind === "workout"
                            ? "Træning"
                            : d.plan.kind === "finish"
                              ? "Status"
                              : "Hvile"}
                      </b>
                      <small>Dag {d.day}</small>
                    </button>
                  ))}
              </div>
            </section>
          </>
        )}
        {view === "training" && (
          <>
            <PageHeading
              eyebrow="DIN TRÆNING"
              title="Følg planen. Find din rytme."
              text="Hvert pas har en rækkefølge og en grund. Hviledage tæller med i de 100 dage."
            />
            <div className="p-pills">
              <span>{labels[p.place]}</span>
              <span>{labels[p.level]}</span>
              <span>{p.days} dage / uge</span>
              <span>{p.minutes} min. / pas</span>
            </div>
            <div className="training-weeks">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((week) => (
                <details
                  key={week}
                  open={
                    week === Math.max(1, Math.min(15, Math.ceil(state.day / 7)))
                  }
                >
                  <summary>
                    <span>UGE {String(week).padStart(2, "0")}</span>
                    <b>
                      {state.days.find((d) => d.plan.week === week)?.plan.phase}
                    </b>
                    <span>+</span>
                  </summary>
                  {state.days
                    .filter((d) => d.plan.week === week)
                    .map((d) => (
                      <div className="training-day" key={d.id}>
                        <span>
                          {fmt(d.scheduled_date)}
                          <small>Dag {d.day}</small>
                        </span>
                        <div>
                          <b>{d.plan.title}</b>
                          <small>
                            {d.plan.kind === "workout"
                              ? `${d.plan.minutes} min. · ${d.plan.exercises.length} øvelser`
                              : "Restitution og gode vaner"}
                          </small>
                        </div>
                        <span className={"status " + d.status}>
                          {d.status === "completed"
                            ? "Gennemført"
                            : d.status === "skipped"
                              ? "Sprunget over"
                              : d.plan.kind === "workout"
                                ? "Planlagt"
                                : "Hvile"}
                        </span>
                        {d.plan.kind === "workout" && (
                          <button
                            className="p-secondary"
                            onClick={() => setSelected(d)}
                          >
                            Se pas
                          </button>
                        )}
                      </div>
                    ))}
                </details>
              ))}
            </div>
            <p className="p-note">
              Belastningen øges ikke automatisk. Dine registrerede sæt og
              oplevede anstrengelse bruges til et forslag, du selv vurderer.
            </p>
          </>
        )}
        {view === "food" && (
          <>
            <PageHeading
              eyebrow="MAD & PLANLÆGNING"
              title="God mad. Mindre gætteri."
              text="Opskrifter til almindelige dage. Vælg, byt og saml indkøbet ét sted."
            />
            <div className="p-card nutrition-note">
              <h2>
                {p.nutrition === "portions"
                  ? "Din tilgang: portioner"
                  : energy(p)?.available
                    ? `Dit energiskøn: ca. ${energy(p)?.kcal} kcal/dag`
                    : "Portionsvejledning"}
              </h2>
              <p>
                {p.nutrition === "calculated"
                  ? energy(p)?.explanation
                  : "Sæt et hovedmåltid sammen af grøntsager, en proteinkilde, kartofler/fuldkorn og lidt fedt. Brug portionerne som udgangspunkt og justér efter sult og mæthed."}
              </p>
              <small>
                Madplanen fordeler ikke automatisk dette energiskøn.
                Næringsværdier er beregnede estimater; opskrifter er ikke en
                individuel diæt.
              </small>
            </div>
            <section className="p-card">
              <div className="p-section-head">
                <div>
                  <span className="p-eyebrow">DIN UGENTLIGE MADPLAN</span>
                  <h2>Gør hverdagen nemmere.</h2>
                </div>
                <label>
                  Ugen starter
                  <input
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                  />
                </label>
              </div>
              <button
                className="p-secondary"
                disabled={busy || ended || future}
                onClick={() => action("meal-week", { start: weekStart })}
              >
                Fyld ledige måltider med passende opskrifter
              </button>
              <p className="p-note">
                Eksisterende valg bevares. Ved stramme filtre kan nogle måltider
                stå tomme.
              </p>
              <div className="meal-week">
                {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(
                  (date) => (
                    <div key={date}>
                      <h3>{fmt(date)}</h3>
                      {Object.keys(category).map((slot) => (
                        <MealPicker
                          key={slot}
                          date={date}
                          slot={slot}
                          meal={weekMeals.find(
                            (m) => m.date === date && m.slot === slot,
                          )}
                          options={state.recipes.filter(
                            (r) =>
                              r.category === slot &&
                              suitable(r, p.diet, p.avoid, p.cookTime),
                          )}
                          disabled={
                            busy || date < state.today || ended || future
                          }
                          action={action}
                        />
                      ))}
                    </div>
                  ),
                )}
              </div>
            </section>
            <FoodLibrary
              state={state}
              action={action}
              busy={busy || ended || future}
            />
            <section className="p-card">
              <span className="p-eyebrow">FRA DIN VALGTE UGE</span>
              <h2>Indkøbslisten.</h2>
              <p>
                Samlet efter råvare. Mængderne følger opskrifternes rå/drænede
                vægt; emballager kan kræve større køb.
              </p>
              {weekMeals.length === 0 ? (
                <p className="p-empty">
                  Vælg måltider ovenfor, så kommer listen her.
                </p>
              ) : (
                <div className="shopping-grid">
                  {shoppingList(weekMeals).map((i) => {
                    const checked = state.shopping.some(
                      (s) =>
                        s.week === weekStart &&
                        s.ingredient_id === i.id &&
                        s.checked,
                    );
                    return (
                      <label
                        className={
                          "shopping-item " + (checked ? "checked" : "")
                        }
                        key={i.id}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={busy || ended}
                          onChange={(e) =>
                            action("shopping", {
                              week: weekStart,
                              id: i.id,
                              on: e.target.checked,
                            })
                          }
                        />
                        <span>
                          <b>{i.name}</b>
                          <small>{i.basis}</small>
                        </span>
                        <strong>
                          {i.grams >= 1000
                            ? `${(i.grams / 1000).toFixed(2)} kg`
                            : `${i.grams} g`}
                        </strong>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="p-note">
                Sæt flueben ved det, du allerede har hjemme. Dit valg gemmes på
                kontoen.
              </p>
            </section>
          </>
        )}
        {view === "progress" && (
          <>
            <PageHeading
              eyebrow="DIN FREMGANG"
              title="Det, du faktisk har gjort."
              text="Ingen opdigtede tal. Her ser du dine egne registreringer, også når fremskridtet er at møde op igen."
            />
            <div className="p-metrics">
              <div>
                <span>GENNEMFØRT</span>
                <b>
                  {complete.length}
                  <small>træninger</small>
                </b>
              </div>
              <div>
                <span>REGISTREREDE SÆT</span>
                <b>
                  {complete.reduce(
                    (n, d) =>
                      n + (d.log.sets?.filter((s) => s.reps > 0).length || 0),
                    0,
                  )}
                  <small>sæt</small>
                </b>
              </div>
              <div>
                <span>PROGRAMDAG</span>
                <b>
                  {Math.min(100, Math.max(0, state.day))}
                  <small>af 100</small>
                </b>
              </div>
            </div>
            <div className="p-grid">
              <section className="p-card">
                <h2>Ugens check-in.</h2>
                <Checkin
                  state={state}
                  busy={busy || ended || future}
                  action={action}
                />
              </section>
              <section className="p-card">
                <h2>Vægt er valgfrit.</h2>
                <p>
                  Du kan følge styrke og gennemførelse uden at veje dig. En
                  enkelt måling ændrer aldrig planen.
                </p>
                <Weight
                  state={state}
                  busy={busy || ended || future}
                  action={action}
                />
              </section>
            </div>
            <section className="p-card">
              <h2>Din styrkehistorik.</h2>
              {complete.length === 0 ? (
                <p className="p-empty">
                  Dine første registrerede sæt kommer her. Start med en
                  belastning, du kan kontrollere.
                </p>
              ) : (
                complete.map((d) => (
                  <details key={d.id}>
                    <summary>
                      {fmt(d.scheduled_date)} · {d.plan.title}
                    </summary>
                    {d.log.sets
                      ?.filter((s) => s.reps > 0)
                      .map((s) => (
                        <div className="p-list-row" key={s.exercise + s.set}>
                          <span>
                            {
                              d.plan.exercises.find((e) => e.id === s.exercise)
                                ?.name
                            }{" "}
                            · sæt {s.set}
                          </span>
                          <b>
                            {s.reps} × {s.kg} kg · RPE {s.effort}
                          </b>
                        </div>
                      ))}
                    <button
                      className="p-secondary"
                      disabled={ended}
                      onClick={() => setSelected(d)}
                    >
                      Se / ret registrering
                    </button>
                  </details>
                ))
              )}
            </section>
            <section className="p-card">
              <h2>100 dage, én oversigt.</h2>
              <div className="hundred-grid">
                {state.days.map((d) => (
                  <span
                    title={`Dag ${d.day}: ${d.plan.title} · ${d.status}`}
                    className={d.status}
                    key={d.id}
                  >
                    {d.day}
                  </span>
                ))}
              </div>
              <p className="p-note">
                Grøn: gennemført. Lys: restitution. Mørk kant: træningsdag. Dag
                100 er din afsluttende status.
              </p>
            </section>
          </>
        )}
      </main>
      <nav className="p-mobile-nav">
        {navigation.map(([v, label, icon]) => (
          <a
            href={"/app/" + (v === "today" ? "" : v)}
            className={view === v ? "current" : ""}
            key={v}
          >
            <span aria-hidden>{icon}</span>
            {label}
          </a>
        ))}
      </nav>
      {selected && (
        <Workout
          day={selected}
          state={state}
          busy={busy}
          action={action}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}
function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="p-page-heading">
      <div>
        <span className="p-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
type Action = (path: string, data: unknown) => Promise<boolean>;
function MealPicker({
  date,
  slot,
  meal,
  options,
  disabled,
  action,
}: {
  date: string;
  slot: string;
  meal?: Meal;
  options: Recipe[];
  disabled: boolean;
  action: Action;
}) {
  const [servings, setServings] = useState(Number(meal?.servings || 1));
  return (
    <div className="meal-picker">
      <label>
        {category[slot]}
        <select
          disabled={disabled}
          value={meal?.recipe_id || ""}
          onChange={(e) =>
            e.target.value &&
            action("meal", { date, slot, recipe: e.target.value, servings })
          }
        >
          <option value="">
            {options.length ? "Vælg måltid" : "Ingen match — tilpas filtre"}
          </option>
          {options.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label className="servings">
        Portioner
        <input
          aria-label={category[slot] + " portioner " + date}
          type="number"
          min="0.5"
          max="12"
          step="0.5"
          value={servings}
          disabled={disabled}
          onChange={(e) => setServings(Number(e.target.value))}
          onBlur={() =>
            meal &&
            action("meal", { date, slot, recipe: meal.recipe_id, servings })
          }
        />
      </label>
    </div>
  );
}
function FoodLibrary({
  state,
  action,
  busy,
}: {
  state: PlatformState;
  action: Action;
  busy: boolean;
}) {
  const [q, setQ] = useState(""),
    [cat, setCat] = useState("all"),
    [fav, setFav] = useState(false),
    [diet, setDiet] = useState(state.profile.data.diet),
    [recipe, setRecipe] = useState<Recipe | null>(null),
    [portions, setPortions] = useState(1);
  const p = state.profile.data;
  const list = state.recipes.filter(
    (r) =>
      r.name.toLocaleLowerCase("da").includes(q.toLocaleLowerCase("da")) &&
      (cat === "all" || r.category === cat) &&
      (!fav || state.favorites.includes(r.id)) &&
      suitable(r, p.diet, p.avoid, p.cookTime) &&
      suitable(r, diet, [], 60),
  );
  return (
    <section className="food-library">
      <div className="p-section-head">
        <div>
          <span className="p-eyebrow">OPSKRIFTSBIBLIOTEK</span>
          <h2>Find noget, du glæder dig til.</h2>
        </div>
        <span>{list.length} opskrifter matcher</span>
      </div>
      <div className="food-filters">
        <input
          type="search"
          placeholder="Søg efter en opskrift…"
          aria-label="Søg opskrifter"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          aria-label="Kategori"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="all">Alle måltider</option>
          {Object.entries(category).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          aria-label="Kostfilter"
          value={diet}
          onChange={(e) => setDiet(e.target.value as Profile["diet"])}
        >
          <option value="all">Alle egnede</option>
          <option value="vegetarian">Vegetarisk</option>
          <option value="halal">Halal-egnet</option>
        </select>
        <button
          className={"p-secondary " + (fav ? "chosen" : "")}
          onClick={() => setFav(!fav)}
        >
          ♡ Favoritter
        </button>
      </div>
      {!list.length && (
        <p className="p-empty">
          Ingen opskrifter matcher alle dine valg. Prøv et andet søgeord, eller
          tilpas dine kostpræferencer i Profil.
        </p>
      )}
      <div className="recipe-grid">
        {list.map((r) => {
          const n = nutrients(r);
          return (
            <article className={"recipe-card " + r.category} key={r.id}>
              <div className="recipe-cover">
                <span>{category[r.category]}</span>
                <span>{r.minutes} MIN.</span>
                <h3>{r.name}</h3>
                <span className="recipe-number">
                  {String(state.recipes.indexOf(r) + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="recipe-meta">
                <span>≈ {Math.round(n.kcal)} kcal</span>
                <span>{Math.round(n.protein)} g protein</span>
              </div>
              <div className="p-actions">
                <button
                  className="p-secondary"
                  onClick={() => {
                    setRecipe(r);
                    setPortions(1);
                  }}
                >
                  Se opskrift →
                </button>
                <button
                  className="favorite"
                  aria-label={
                    state.favorites.includes(r.id)
                      ? "Fjern favorit"
                      : "Gem favorit"
                  }
                  disabled={busy}
                  onClick={() =>
                    action("favorite", {
                      id: r.id,
                      on: !state.favorites.includes(r.id),
                    })
                  }
                >
                  {state.favorites.includes(r.id) ? "♥" : "♡"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {recipe && (
        <div
          className="p-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={recipe.name}
        >
          <div className="p-dialog">
            <button
              className="dialog-close"
              onClick={() => setRecipe(null)}
              aria-label="Luk opskrift"
            >
              ✕
            </button>
            <span className="p-eyebrow">
              {category[recipe.category]} · {recipe.minutes} MIN.
            </span>
            <h2>{recipe.name}</h2>
            <label>
              Vis mængder til antal portioner
              <input
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={portions}
                onChange={(e) =>
                  setPortions(
                    Math.max(0.5, Math.min(12, Number(e.target.value))),
                  )
                }
              />
            </label>
            <div className="recipe-nutrition">
              {Object.entries(nutrients(recipe, portions)).map(([k, n]) => (
                <div key={k}>
                  <b>{Math.round(n)}</b>
                  <span>
                    {
                      (
                        {
                          kcal: "kcal",
                          protein: "g protein",
                          carbs: "g kulhydrat*",
                          fat: "g fedt",
                          fiber: "g fibre",
                        } as Record<string, string>
                      )[k]
                    }
                  </span>
                </div>
              ))}
            </div>
            <p className="p-note">
              Beregnede estimater for {portions} portion(er). *USDA angiver
              total kulhydrat inklusive fibre. Råvarernes mærke og tilberedning
              påvirker resultatet.
            </p>
            <h3>Ingredienser</h3>
            {recipe.ingredients.map((i) => {
              const f = ingredients.find((x) => x.id === i.id)!;
              return (
                <div className="p-list-row" key={i.id}>
                  <span>
                    {f.name}
                    <small>{f.basis}</small>
                  </span>
                  <b>{Math.round((i.grams / recipe.servings) * portions)} g</b>
                </div>
              );
            })}
            <h3>Sådan gør du</h3>
            <ol className="recipe-steps">
              {recipe.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <p className="p-note">
              Grundopskriften giver {recipe.servings} portion(er). Ved ændret
              mængde kan pande-/ovnstørrelse og tilberedningstid variere. Salt
              og krydderier er ikke inkluderet; tilføjer du energiholdige
              ingredienser, ændres estimatet.
            </p>
            <details>
              <summary>Datakilder og beregning</summary>
              <p>
                USDA FoodData Central, SR Legacy, april 2018. Sum af gram ×
                næringsværdi pr. 100 g / 100, divideret med grundopskriftens
                portioner. Vand til tilberedning bidrager ikke med energi. Der
                beregnes ikke specifikke tilberedningstab.
              </p>
              {recipe.ingredients.map((i) => {
                const f = ingredients.find((x) => x.id === i.id)!;
                return (
                  <p key={i.id}>
                    <a href={f.sourceUrl} target="_blank" rel="noreferrer">
                      {f.name} · FDC {f.sourceId}
                    </a>{" "}
                    — {f.sourceDescription}
                  </p>
                );
              })}
            </details>
            <p className="p-note">
              Halal-egnet ud fra ingredienstyper, ikke produktcertificering. Læs
              altid emballagen ved allergi.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
function Workout({
  day,
  state,
  busy,
  action,
  close,
}: {
  day: Day;
  state: PlatformState;
  busy: boolean;
  action: Action;
  close: () => void;
}) {
  const [sets, setSets] = useState<SetLog[]>(
      day.log.sets ||
        day.plan.exercises.flatMap((e) =>
          Array.from({ length: e.sets }, (_, i) => ({
            exercise: e.id,
            set: i + 1,
            reps: 0,
            kg: 0,
            effort: 7,
          })),
        ),
    ),
    [end, setEnd] = useState(0),
    [remaining, setRemaining] = useState(0),
    [move, setMove] = useState("");
  const readonly =
    state.day > 100 || day.scheduled_date > state.today || state.day < 1;
  useEffect(() => {
    const t = setInterval(
      () => setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000))),
      250,
    );
    return () => clearInterval(t);
  }, [end]);
  function change(i: number, k: "reps" | "kg" | "effort", n: number) {
    setSets((s) => s.map((x, j) => (j === i ? { ...x, [k]: n } : x)));
  }
  return (
    <div
      className="p-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Træningspas"
    >
      <div className="p-dialog workout-dialog">
        <button
          className="dialog-close"
          aria-label="Luk træning"
          onClick={close}
        >
          ✕
        </button>
        <span className="p-eyebrow">
          DAG {day.day} · {fmt(day.scheduled_date)} · {day.plan.minutes} MIN.
        </span>
        <h2>{day.plan.title}</h2>
        <p>{day.plan.focus}</p>
        <p className="p-note">
          {state.help?.find((h) => h.id === "safety")?.text}
        </p>
        <div className="warmup">
          <h3>Start med opvarmning</h3>
          <ol>
            {day.plan.warmup.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ol>
        </div>
        {day.plan.exercises.map((e, index) => {
          const history = state.days
            .filter(
              (d) =>
                d.status === "completed" &&
                d.id !== day.id &&
                d.scheduled_date < day.scheduled_date,
            )
            .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
            .map(
              (d) =>
                d.log.sets?.filter((s) => s.exercise === e.id && s.reps > 0) ||
                [],
            )
            .filter((x) => x.length);
          const options = alternatives(e, state.profile.data, state.exercises);
          return (
            <section className="exercise-block" key={e.id}>
              <div className="p-section-head">
                <div>
                  <span className="p-eyebrow">ØVELSE {index + 1}</span>
                  <h3>{e.name}</h3>
                </div>
                <span>
                  {e.sets} × {e.min}–{e.max}
                </span>
              </div>
              <p>{e.intensity}</p>
              <details>
                <summary>Teknik & forklaring</summary>
                <ol>
                  {e.instructions.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
                <p>{e.cue}</p>
                {e.videoId ? (
                  <video
                    controls
                    preload="none"
                    src={"/api/video/" + e.videoId}
                  />
                ) : (
                  <p className="p-note">
                    Følg tekstforklaringen. Der er endnu ingen video til denne
                    øvelse.
                  </p>
                )}
              </details>
              <p className="progression-tip">{progression(history, e.max)}</p>
              {history.length > 0 && (
                <p className="p-note">
                  Seneste pas:{" "}
                  {history
                    .at(-1)!
                    .map((s) => `${s.reps} × ${s.kg} kg`)
                    .join(" · ")}
                </p>
              )}
              <div className="set-labels">
                <span>Sæt</span>
                <span>Gentagelser</span>
                <span>Kg*</span>
                <span>RPE**</span>
              </div>
              {sets.map(
                (s, i) =>
                  s.exercise === e.id && (
                    <div className="set-row" key={s.set}>
                      <b>{s.set}</b>
                      <input
                        type="number"
                        aria-label={e.name + " sæt " + s.set + " gentagelser"}
                        min="0"
                        max="100"
                        value={s.reps || ""}
                        disabled={readonly}
                        onChange={(event) =>
                          change(i, "reps", Number(event.target.value))
                        }
                      />
                      <input
                        type="number"
                        aria-label={e.name + " sæt " + s.set + " kilo"}
                        min="0"
                        max="500"
                        step="0.5"
                        value={s.kg}
                        disabled={readonly}
                        onChange={(event) =>
                          change(i, "kg", Number(event.target.value))
                        }
                      />
                      <input
                        type="number"
                        aria-label={e.name + " sæt " + s.set + " anstrengelse"}
                        min="1"
                        max="10"
                        value={s.effort}
                        disabled={readonly}
                        onChange={(event) =>
                          change(i, "effort", Number(event.target.value))
                        }
                      />
                    </div>
                  ),
              )}
              <div className="p-actions">
                <button
                  className="p-secondary"
                  onClick={() => setEnd(Date.now() + e.rest * 1000)}
                >
                  Pause · {e.rest} sek.
                </button>
                {options.length > 0 &&
                  day.status !== "completed" &&
                  !day.log.sets && (
                    <select
                      aria-label={"Byt " + e.name}
                      value=""
                      disabled={
                        busy ||
                        state.day > 100 ||
                        day.scheduled_date < state.today
                      }
                      onChange={async (ev) => {
                        if (
                          ev.target.value &&
                          (await action("swap-exercise", {
                            id: day.id,
                            exercise: e.id,
                            replacement: ev.target.value,
                          }))
                        )
                          close();
                      }}
                    >
                      <option value="">Byt øvelse…</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  )}
              </div>
            </section>
          );
        })}
        <p className="p-note">
          *Registrér vægten pr. håndvægt ved to håndvægte, maskinens viste kg
          ved maskiner, 0 ved kropsvægt/elastik. **RPE: oplevet anstrengelse fra
          1 (meget let) til 10 (maksimalt). Sigt efter ca. 7–8. Stop ved smerte
          eller usædvanligt ubehag.
        </p>
        {end > 0 && (
          <div className="rest-timer" role="timer">
            <span>
              {remaining > 0
                ? `Pause ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                : "Pausen er slut"}
            </span>
            <button
              onClick={() => {
                setEnd(0);
                setRemaining(0);
              }}
            >
              Stop
            </button>
          </div>
        )}
        <div className="p-actions">
          <button
            className="p-secondary"
            disabled={busy || readonly}
            onClick={() =>
              action("workout", { id: day.id, sets, complete: false })
            }
          >
            Gem sæt
          </button>
          <button
            className="p-button"
            disabled={busy || readonly}
            onClick={async () => {
              if (await action("workout", { id: day.id, sets, complete: true }))
                close();
            }}
          >
            {busy
              ? "Gemmer…"
              : day.status === "completed"
                ? "Gem rettelse"
                : "Afslut træning ✓"}
          </button>
        </div>
        {!readonly && day.status === "planned" && (
          <details>
            <summary>Flyt eller spring passet over</summary>
            <p>Et misset pas bliver ikke lagt oven i en anden hård dag.</p>
            <label>
              Ny dato
              <input
                type="date"
                min={addDays(state.today, 1)}
                max={addDays(state.profile.start_date, 98)}
                value={move}
                onChange={(e) => setMove(e.target.value)}
              />
            </label>
            <div className="p-actions">
              <button
                className="p-secondary"
                disabled={busy || !move}
                onClick={async () => {
                  if (await action("reschedule", { id: day.id, date: move }))
                    close();
                }}
              >
                Flyt til restitutionsdag
              </button>
              <button
                className="p-secondary"
                disabled={busy}
                onClick={async () => {
                  if (await action("skip", { id: day.id })) close();
                }}
              >
                Spring passet over
              </button>
            </div>
          </details>
        )}
        {readonly && (
          <p className="p-notice">
            Du kan læse passet. Registrering er åben på træningsdatoen og resten
            af den aktive adgangsperiode.
          </p>
        )}
      </div>
    </div>
  );
}
function Checkin({
  state,
  busy,
  action,
}: {
  state: PlatformState;
  busy: boolean;
  action: Action;
}) {
  const [energy, setEnergy] = useState("ok"),
    [recovery, setRecovery] = useState("ok"),
    [fit, setFit] = useState("fits");
  const week = Math.min(15, Math.max(1, Math.ceil(state.day / 7))),
    previous = state.checkins.find((c) => c.week === week);
  return (
    <>
      <p>Uge {week}: Hvordan passer planen til hverdagen?</p>
      <label>
        Din energi
        <select value={energy} onChange={(e) => setEnergy(e.target.value)}>
          <option value="low">Lav</option>
          <option value="ok">Passende</option>
          <option value="high">Godt overskud</option>
        </select>
      </label>
      <label>
        Restitution
        <select value={recovery} onChange={(e) => setRecovery(e.target.value)}>
          <option value="ok">Jeg føler mig klar mellem passene</option>
          <option value="tired">Jeg føler mig stadig træt</option>
        </select>
      </label>
      <label>
        Planen i hverdagen
        <select value={fit} onChange={(e) => setFit(e.target.value)}>
          <option value="fits">Den passer</option>
          <option value="too-much">Den fylder for meget</option>
          <option value="more">Jeg har mere overskud</option>
        </select>
      </label>
      <button
        className="p-button"
        disabled={busy}
        onClick={() => action("checkin", { energy, recovery, fit })}
      >
        Gem ugens check-in
      </button>
      {previous?.data.suggestion === "reduce" && !previous.accepted_at && (
        <div className="p-notice">
          <p>
            Dit check-in peger på behov for mindre belastning. Forslag: ét sæt
            færre pr. øvelse de næste 7 dage, mindst ét. Historik og dagens pas
            bevares.
          </p>
          <button
            className="p-secondary"
            disabled={busy}
            onClick={() => action("accept-checkin", { week })}
          >
            Acceptér forslaget
          </button>
        </div>
      )}
      {previous?.accepted_at && <p>✓ Dit forslag er anvendt.</p>}
    </>
  );
}
function Weight({
  state,
  busy,
  action,
}: {
  state: PlatformState;
  busy: boolean;
  action: Action;
}) {
  const [kg, setKg] = useState(""),
    [consent, setConsent] = useState(false);
  return (
    <>
      <label>
        Vægt i kg
        <input
          type="number"
          min="30"
          max="350"
          step="0.1"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
        />
      </label>
      <label className="p-check">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        Jeg giver udtrykkeligt samtykke til at gemme mine frivillige
        vægtregistreringer.
      </label>
      <button
        className="p-secondary"
        disabled={busy || !kg || !consent}
        onClick={() =>
          action("weight", { date: state.today, kg: Number(kg), consent: true })
        }
      >
        Gem dagens vægt
      </button>
      {state.weights.map((w) => (
        <div className="p-list-row" key={w.date}>
          <span>{fmt(w.date)}</span>
          <b>{w.kg} kg</b>
        </div>
      ))}
    </>
  );
}
