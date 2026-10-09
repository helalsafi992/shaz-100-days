"use client";
import { useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import type { PlatformState } from "../Portal";
import { activityForDate } from "@/lib/activity";
import { labels, addDays } from "@/lib/profile";
import {
  pendingActivity,
  visibleActivity,
  safeWeek,
  weekStats,
} from "@/lib/experience-summary";

type Day = PlatformState["days"][number];
const dateLabel = (date: string, short = false) =>
  new Date(date + "T12:00:00Z").toLocaleDateString(
    "da-DK",
    short
      ? { weekday: "short" }
      : { weekday: "long", day: "numeric", month: "long" },
  );
const navItems = [
  ["today", "I dag", "/app", "sun"],
  ["training", "Træning", "/app/training", "training"],
  ["food", "Mad", "/app/food", "food"],
  ["progress", "Fremgang", "/app/progress", "chart"],
] as const;
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5" />
      </>
    ),
    training: (
      <>
        <path d="m6 5 13 13M3 8l5-5m8 18 5-5M2 5l3-3m14 20 3-3M5 11l6-6m2 14 6-6" />
      </>
    ),
    food: (
      <>
        <path d="M5 3v5a3 3 0 0 0 6 0V3M8 3v18M18 3c-3 2-3 7 0 9v9M18 3v9" />
      </>
    ),
    chart: (
      <>
        <path d="M4 4v16h17M8 16v-4m5 4V8m5 8V5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    leaf: (
      <>
        <path d="M20 3C8 2 2 10 6 17c7 4 15-2 14-14Z" />
        <path d="m4 21 11-11" />
      </>
    ),
    settings: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="8" cy="6" r="2" fill="currentColor" />
        <circle cx="16" cy="12" r="2" fill="currentColor" />
        <circle cx="10" cy="18" r="2" fill="currentColor" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    cycle: (
      <>
        <circle cx="5" cy="16" r="4" />
        <circle cx="19" cy="16" r="4" />
        <path d="m5 16 5-9 5 9H5m5-9h5l4 9M8 4h4m3 3 2-3h3" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
export function SimpleNavigation({ view }: { view: string }) {
  const links = navItems.map(([id, label, href, icon]) => (
    <Link
      href={href}
      key={id}
      className={view === id ? "is-current" : ""}
      aria-current={view === id ? "page" : undefined}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </Link>
  ));
  return (
    <>
      <a href="#customer-content" className="s-skip">
        Spring til indhold
      </a>
      <header className="s-mobile-header">
        <Link href="/app" className="s-logo" aria-label="SHAZ – I dag">
          SHAZ<span>DIT FORLØB</span>
        </Link>
        <div className="s-header-actions">
          <Link
            href="/onboarding?edit=1"
            className="s-edit-plan"
            aria-label="Tilpas min trænings- og madplan"
          >
            <Icon name="settings" size={16} />
            <span>Tilpas plan</span>
          </Link>
          <Link
            href="/app/profile"
            className="s-profile"
            aria-label="Profil og indstillinger"
          >
            <Icon name="user" />
          </Link>
        </div>
      </header>
      <aside className="s-sidebar">
        <Link href="/app" className="s-logo">
          SHAZ<span>100 DAGE. DIN HVERDAG.</span>
        </Link>
        <nav aria-label="Hovednavigation">{links}</nav>
        <div className="s-sidebar-quick">
          <Link href="/onboarding?edit=1" className="s-edit-plan">
            <Icon name="settings" size={18} />
            <span>Tilpas plan</span>
            <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="s-sidebar-bottom">
          <Link href="/app/profile">
            <Icon name="settings" />
            <span>Profil & indstillinger</span>
          </Link>
          <Link href="/help">
            Hjælp og kontakt <Icon name="arrow" size={16} />
          </Link>
        </div>
      </aside>
      <nav className="s-bottom-nav" aria-label="Mobilnavigation">
        {links}
      </nav>
    </>
  );
}
export function MoreActions({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        ref.current.open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <details ref={ref} className="s-more">
      <summary aria-label={label}>
        <Icon name="more" />
      </summary>
      <div
        className="s-more-panel"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button,a") && ref.current)
            ref.current.open = false;
        }}
      >
        {children}
      </div>
    </details>
  );
}
export function SimpleToday({
  state,
  onWorkout,
  onAdjust,
  food,
}: {
  state: PlatformState;
  onWorkout: (d: Day) => void;
  onAdjust: (id: string) => void;
  food: ReactNode;
}) {
  const p = state.profile.data,
    ended = state.day > 100,
    future = state.day < 1;
  const todayStrength = state.days.find(
    (d) =>
      d.scheduled_date === state.today &&
      d.plan.kind === "workout" &&
      pendingActivity(d),
  );
  const todayCardio = (state.cardio || []).find(
    (c) => c.scheduled_date === state.today && pendingActivity(c),
  );
  const calendar = activityForDate(
    state.today,
    state.days,
    state.cardio || [],
    p.otherSport || [],
    state.breaks || [],
  );
  const week = safeWeek(state.day),
    from = addDays(state.profile.start_date, (week - 1) * 7),
    to = addDays(state.profile.start_date, Math.min(99, week * 7 - 1));
  const stats = weekStats(state.days, state.cardio || [], from, to);
  const next = state.days
    .filter(
      (d) =>
        d.scheduled_date > state.today &&
        d.plan.kind === "workout" &&
        pendingActivity(d),
    )
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
  const doneToday = [
    ...state.days.filter((d) => d.plan.kind === "workout"),
    ...(state.cardio || []),
  ].filter(
    (a) => a.scheduled_date === state.today && a.status === "completed",
  ).length;
  const title = ended
    ? "Dit forløb er afsluttet."
    : future
      ? "Din plan er klar."
      : todayStrength?.plan.title ||
        todayCardio?.plan.selected.title ||
        (calendar.otherSport.length
          ? calendar.otherSport.map((s) => s.name).join(" + ")
          : doneToday
            ? "Dagens pas er klaret."
            : "Hviledag");
  const isWorkout = !!todayStrength && !future && !ended;
  return (
    <div className="s-today">
      <div className="s-page-head">
        <div>
          <p className="s-overline">
            {ended
              ? "AFSLUTNING"
              : future
                ? "KLAR TIL START"
                : `DAG ${state.day} AF 100 · UGE ${week}`}
          </p>
          <h1>I dag</h1>
          <p className="s-subtitle">{dateLabel(state.today)}</p>
        </div>
        <Link href="/onboarding?edit=1" className="s-settings-link">
          <Icon name="settings" />
          Tilpas plan
        </Link>
      </div>
      <div className="s-today-grid">
        <div className="s-day-primary">
          <section
            className={
              "s-focus-card " + (isWorkout ? "is-training" : "is-rest")
            }
            aria-label="Dagens aktivitet"
          >
            <div className="s-focus-top">
              <span className="s-type">
                <Icon
                  name={
                    isWorkout
                      ? "training"
                      : todayCardio
                        ? "cycle"
                        : doneToday
                          ? "check"
                          : "leaf"
                  }
                />
                {ended
                  ? "Dit resultat"
                  : future
                    ? "Din start"
                    : isWorkout
                      ? "Dagens træning"
                      : todayCardio
                        ? "Dagens cardio"
                        : doneToday
                          ? "Gennemført"
                          : "Dagens plan"}
              </span>
            </div>
            <h2>{title}</h2>
            {isWorkout ? (
              <>
                <p className="s-focus-meta">
                  {todayStrength!.plan.minutes} min. <span>·</span>{" "}
                  {todayStrength!.plan.exercises.length} øvelser <span>·</span>{" "}
                  {todayStrength!.plan.locationName || labels[p.place]}
                </p>
                <button
                  className="s-primary"
                  onClick={() => onWorkout(todayStrength!)}
                >
                  Start træning <Icon name="arrow" />
                </button>
                <button
                  className="s-text-action"
                  onClick={() => onAdjust(todayStrength!.id)}
                >
                  Andet sted eller mindre tid i dag
                </button>
              </>
            ) : (
              <>
                <p className="s-focus-description">
                  {ended
                    ? "Se din historik, og vælg hvad du vil fortsætte med. Ingen automatisk genstart eller ny betaling."
                    : future
                      ? `Forløbet starter ${dateLabel(state.profile.start_date)}. Se din plan her.`
                      : todayCardio
                        ? `${todayCardio.plan.selected.minutes} min. · ${todayCardio.plan.selected.intensity}`
                        : calendar.otherSport.length
                          ? "Din sport er med i planen. Der er ikke lagt et ekstra styrkepas oveni."
                          : doneToday
                            ? "Dine registreringer er gemt. Resten af dagen er din."
                            : "Ingen planlagt træning i dag. Du skal ikke indhente noget."}
                </p>
                {!ended && !future && !todayCardio && next && (
                  <p className="s-next">
                    Næste styrkepas{" "}
                    <strong>
                      {dateLabel(next.scheduled_date, true)} · {next.plan.title}
                    </strong>
                  </p>
                )}
                <Link
                  className="s-primary"
                  href={
                    ended
                      ? "/app/progress"
                      : todayCardio && !future
                        ? `/app/training?cardio=${encodeURIComponent(todayCardio.id)}`
                        : "/app/training"
                  }
                >
                  {ended
                    ? "Se din fremgang"
                    : todayCardio && !future
                      ? "Åbn cardiopas"
                      : "Se ugeplan"}
                  <Icon name="arrow" />
                </Link>
              </>
            )}
            {isWorkout && todayCardio && (
              <Link
                href={`/app/training?cardio=${encodeURIComponent(todayCardio.id)}`}
                className="s-extra-activity"
              >
                <Icon name="cycle" />
                <span>
                  Også i dag: {todayCardio.plan.selected.title}
                  <small>{todayCardio.plan.selected.minutes} min.</small>
                </span>
                <Icon name="arrow" size={16} />
              </Link>
            )}
          </section>
          <section className="s-week-mini" aria-label="Ugens overblik">
            <div>
              <h2>Denne uge</h2>
              <span>
                {stats.completed} af {stats.planned} pas
              </span>
            </div>
            <div className="s-week-dots">
              {Array.from(
                { length: Math.min(7, 100 - (week - 1) * 7) },
                (_, i) => {
                  const date = addDays(from, i),
                    day = activityForDate(
                      date,
                      state.days,
                      state.cardio || [],
                      p.otherSport || [],
                      state.breaks || [],
                    );
                  const all = [
                    ...state.days.filter((d) => d.plan.kind === "workout"),
                    ...(state.cardio || []),
                  ].filter(
                    (a) => a.scheduled_date === date && visibleActivity(a),
                  );
                  const done =
                    all.length > 0 &&
                    all.every((a) => a.status === "completed");
                  return (
                    <Link
                      href={`/app/training?week=${week}`}
                      key={date}
                      className={
                        (date === state.today ? "is-today " : "") +
                        (done ? "is-done" : day.hasActivity ? "is-planned" : "")
                      }
                      aria-label={`${dateLabel(date)}: ${day.label}${done ? ", gennemført" : ""}`}
                    >
                      <span>{dateLabel(date, true).replace(".", "")}</span>
                      <b>
                        {done ? (
                          <Icon name="check" size={16} />
                        ) : (
                          new Date(date + "T12:00:00Z").getUTCDate()
                        )}
                      </b>
                      <i aria-hidden="true" />
                    </Link>
                  );
                },
              )}
            </div>
            <Link href={`/app/training?week=${week}`} className="s-inline-link">
              Se hele ugen <Icon name="arrow" size={16} />
            </Link>
          </section>
        </div>
        <div className="s-day-food">
          {!ended ? (
            food
          ) : (
            <section className="s-panel">
              <h2>Tag dine vaner med videre</h2>
              <p>
                Din historik findes under Fremgang. Konto, kvittering og hjælp
                ligger under Profil.
              </p>
              <Link href="/app/profile" className="s-inline-link">
                Åbn min profil <Icon name="arrow" />
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
export function SimpleTraining({
  state,
  week,
  setWeek,
  onWorkout,
  onCardio,
  onAdjust,
  configuration,
}: {
  state: PlatformState;
  week: number;
  setWeek: (week: number) => void;
  onWorkout: (day: Day) => void;
  onCardio: (id: string) => void;
  onAdjust: (id: string) => void;
  configuration: ReactNode;
}) {
  const p = state.profile.data,
    start = addDays(state.profile.start_date, (week - 1) * 7),
    end = addDays(state.profile.start_date, Math.min(99, week * 7 - 1));
  const stats = weekStats(state.days, state.cardio || [], start, end);
  return (
    <>
      <div className="s-page-head">
        <div>
          <p className="s-overline">DIN PLAN</p>
          <h1>Træning</h1>
          <p className="s-subtitle">
            {p.days} styrkepas · {p.cardio?.days || 0} cardio ·{" "}
            {labels[p.place]}
          </p>
        </div>
        <Link href="/onboarding?edit=1" className="s-settings-link">
          <Icon name="settings" />
          Tilpas plan
        </Link>
      </div>
      <section className="s-calendar" aria-label="Samlet ugeplan">
        <div className="s-week-control">
          <button
            onClick={() => setWeek(week - 1)}
            disabled={week <= 1}
            aria-label="Forrige uge"
          >
            ‹
          </button>
          <label>
            <span className="s-sr-only">Vælg uge</span>
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
            >
              {Array.from({ length: 15 }, (_, i) => (
                <option value={i + 1} key={i}>
                  Uge {i + 1} · Dag {i * 7 + 1}–{Math.min(100, (i + 1) * 7)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setWeek(week + 1)}
            disabled={week >= 15}
            aria-label="Næste uge"
          >
            ›
          </button>
        </div>
        <div className="s-calendar-caption">
          <span>
            {state.days.find((d) => d.plan.week === week)?.plan.phase ||
              "Din uge"}
          </span>
          <span>
            {stats.completed}/{stats.planned} pas gennemført
          </span>
        </div>
        {Array.from({ length: Math.min(7, 100 - (week - 1) * 7) }, (_, i) => {
          const date = addDays(start, i),
            calendar = activityForDate(
              date,
              state.days,
              state.cardio || [],
              p.otherSport || [],
              state.breaks || [],
            );
          const strength = state.days.filter(
            (d) =>
              d.scheduled_date === date &&
              d.plan.kind === "workout" &&
              !d.plan.paused &&
              d.status !== "removed",
          );
          const cardio = (state.cardio || []).filter(
            (c) =>
              c.scheduled_date === date &&
              c.status !== "removed" &&
              c.status !== "paused",
          );
          return (
            <div
              key={date}
              className={
                "s-calendar-row " + (date === state.today ? "is-today" : "")
              }
            >
              <div className="s-date">
                <span>{dateLabel(date, true).replace(".", "")}</span>
                <b>{new Date(date + "T12:00:00Z").getUTCDate()}</b>
                {date === state.today && <small>I dag</small>}
              </div>
              <div className="s-activities">
                {strength.map((d) => (
                  <div className="s-activity-wrap" key={d.id}>
                    <button className="s-activity" onClick={() => onWorkout(d)}>
                      <span className="s-activity-icon">
                        <Icon name="training" />
                      </span>
                      <span>
                        <strong>{d.plan.title}</strong>
                        <small>
                          {d.plan.minutes} min. ·{" "}
                          {d.plan.locationName || labels[p.place]}
                        </small>
                        <em>
                          {d.status === "completed"
                            ? "Gennemført"
                            : d.status === "skipped"
                              ? "Sprunget over"
                              : `${d.plan.exercises.length} øvelser`}
                        </em>
                      </span>
                      <Icon
                        name={d.status === "completed" ? "check" : "arrow"}
                        size={18}
                      />
                    </button>
                    {d.status !== "completed" && date >= state.today && (
                      <MoreActions
                        label={`Tilpas ${d.plan.title} ${dateLabel(date)}`}
                      >
                        <button onClick={() => onAdjust(d.id)}>
                          Andet sted eller mindre tid
                        </button>
                        <button onClick={() => onWorkout(d)}>
                          Åbn pas og øvrige valg
                        </button>
                      </MoreActions>
                    )}
                  </div>
                ))}
                {cardio.map((c) => (
                  <button
                    className="s-activity cardio"
                    key={c.id}
                    onClick={() => onCardio(c.id)}
                  >
                    <span className="s-activity-icon">
                      <Icon name="cycle" />
                    </span>
                    <span>
                      <strong>{c.plan.selected.title}</strong>
                      <small>{c.plan.selected.minutes} min. · Cardio</small>
                      <em>
                        {c.status === "completed"
                          ? "Gennemført"
                          : c.status === "skipped"
                            ? "Sprunget over"
                            : "Planlagt"}
                      </em>
                    </span>
                    <Icon
                      name={c.status === "completed" ? "check" : "arrow"}
                      size={18}
                    />
                  </button>
                ))}
                {calendar.otherSport.map((s, i) => (
                  <div className="s-sport" key={i}>
                    <strong>{s.name}</strong>
                    <small>{s.minutes} min. · Din anden sport</small>
                  </div>
                ))}
                {!calendar.hasActivity &&
                  !strength.length &&
                  !cardio.length && (
                    <div className="s-rest-row">
                      <Icon name="leaf" size={18} />
                      <span>
                        {state.days.find((d) => d.scheduled_date === date)?.plan
                          .paused
                          ? "Planlagt pause"
                          : date === addDays(state.profile.start_date, 99)
                            ? "Afslutning · Dag 100"
                            : "Hviledag"}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </section>
      <div className="s-plan-options">
        <h2>Tilpas din uge</h2>
        <p>Ændr din plan, ikke dine tidligere registreringer.</p>
        {configuration}
      </div>
    </>
  );
}
