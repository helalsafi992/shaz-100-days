import { addDays } from "./profile";
import type { DayPlan } from "./training";
import type { CardioPlan } from "./cardio";
export type ScheduleBreak = {
  id: string;
  from_date: string;
  to_date: string;
  restart: "normal" | "easy";
  restart_until?: string | null;
};
export function breakOn(date: string, breaks: ScheduleBreak[]) {
  return breaks.find((b) => date >= b.from_date && date <= b.to_date);
}
export function easyRestartOn(date: string, breaks: ScheduleBreak[]) {
  return breaks.some(
    (b) =>
      b.restart === "easy" &&
      date > b.to_date &&
      date <= addDays(b.to_date, 7) &&
      (!b.restart_until || date <= b.restart_until),
  );
}
export function scheduledStrength<
  T extends { scheduled_date: string; status: string; plan: DayPlan },
>(row: T, breaks: ScheduleBreak[]): T {
  if (row.status === "completed" || row.plan.kind === "finish") return row;
  if (breakOn(row.scheduled_date, breaks))
    return {
      ...row,
      status: "paused",
      plan: {
        ...row.plan,
        kind: "rest",
        title: "Planlagt pause",
        minutes: 0,
        warmup: [],
        exercises: [],
        paused: true,
        explanations: [
          "Dine kladder og tidligere registreringer er bevaret. Ingen pas indhentes automatisk.",
        ],
      },
    };
  if (row.plan.kind === "workout" && easyRestartOn(row.scheduled_date, breaks))
    return {
      ...row,
      plan: {
        ...row.plan,
        easyRestart: true,
        title: row.plan.title + " · rolig genstart",
        archivedExercises: [
          ...(row.plan.archivedExercises || []),
          ...row.plan.exercises.filter(
            (e) =>
              !(row.plan.archivedExercises || []).some((a) => a.id === e.id),
          ),
        ],
        exercises: row.plan.exercises.map((e) => ({
          ...e,
          sets: Math.max(1, e.sets - 1),
          intensity:
            "Let belastning og mindst 3 gentagelser i reserve. Stop ved smerte eller usædvanligt ubehag.",
        })),
        explanations: [
          ...(row.plan.explanations || []),
          "Du valgte rolig genstart: ét sæt mindre pr. øvelse i syv kalenderdage. Ingen automatisk stigning i vægt.",
        ],
      },
    };
  return row;
}
export function scheduledCardio<
  T extends { scheduled_date: string; status: string; plan: CardioPlan },
>(row: T, breaks: ScheduleBreak[]): T {
  if (["completed", "removed"].includes(row.status)) return row;
  if (breakOn(row.scheduled_date, breaks)) return { ...row, status: "paused" };
  if (easyRestartOn(row.scheduled_date, breaks)) {
    const ease = (o: CardioPlan["selected"]) => ({
      ...o,
      minutes: Math.min(o.minutes, 20),
      intensity:
        "Let: RPE 2–3 af 10. Du kan tale i hele sætninger uden besvær.",
      main: "Hold et roligt, jævnt tempo. Stop ved smerte, svimmelhed eller usædvanligt ubehag.",
    });
    return {
      ...row,
      plan: {
        ...row.plan,
        selected: ease(row.plan.selected),
        options: row.plan.options.map(ease),
        issue:
          "Rolig genstart: let intensitet og højst 20 minutter i syv kalenderdage efter pausen.",
      },
    };
  }
  return row;
}
