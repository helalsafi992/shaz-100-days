import { goalUnit, goalValueLabel, type GoalUnit } from "./goal-units";
import type { Intake } from "./ai/intake";
import { exercises } from "./training";

export type MeasurableGoal = Intake["wishes"]["target"];
export type SetMeasurement = { exercise: string; reps: number; kg: number };

export type GoalSummary = {
  title: string;
  detail: string;
  observation: string | null;
  completion: number | null;
};

/** Present actual user observations separately from targets; never claim an unlogged result. */
export function summarizeGoal(
  target: MeasurableGoal | null | undefined,
  observations: { weights?: { date: string; kg: string }[]; sets?: SetMeasurement[] } = {},
): GoalSummary | null {
  if (!target || target.metric === "none" || target.value == null) return null;
  const unit = goalUnit(target.metric, target.displayUnit);
  const display = (n: number) => goalValueLabel(n, unit);
  const start = target.baseline;
  const time = target.weeks ? " · " + target.weeks + " uger" : "";
  const completion = (latest: number | null) =>
    latest === null || start === null || start === undefined || target.value === start
      ? null
      : Math.round(Math.max(0, Math.min(100, ((latest - start) / (target.value! - start)) * 100)));

  if (target.metric === "weight-kg") {
    const latest = [...(observations.weights || [])].sort((a,b) => b.date.localeCompare(a.date))[0];
    const number = latest ? Number(latest.kg) : null;
    const valid = number !== null && Number.isFinite(number) && number > 0 ? number : null;
    return {
      title: "Dit vægtmål",
      detail: (start ? display(start) + " → " : "") + display(target.value) + " " + unit + time,
      observation: valid === null ? "Ingen vægt er registreret endnu." : "Seneste frivillige vejning: " + display(valid) + " " + unit,
      completion: completion(valid),
    };
  }

  if (target.metric === "run-km") {
    return {
      title: "Dit distancemål",
      detail: (start !== null && start !== undefined ? display(start) + " → " : "") + display(target.value) + " " + unit + time,
      observation: "SHAZ måler endnu ikke din distance automatisk. Registreret cardiotid er ikke det samme som km.",
      completion: null,
    };
  }

  if (target.metric === "exercise-kg") {
    const exerciseName = exercises.find((e) => e.id === target.exerciseId)?.name || "Valgt øvelse";
    const records = (observations.sets || []).filter((s) =>
      s.exercise === target.exerciseId && s.reps >= (target.reps || 1) && Number.isFinite(s.kg) && s.kg >= 0,
    );
    const best = records.length ? Math.max(...records.map((s) => s.kg)) : null;
    return {
      title: "Dit styrkemål",
      detail: exerciseName + ": " + (start !== null && start !== undefined ? display(start) + " → " : "") + display(target.value) + " " + unit + " × " + (target.reps || 1) + time,
      observation: best === null ? "Ingen relevante sæt registreret endnu." : "Bedste registrerede sæt: " + display(best) + " " + unit + " ved mindst " + (target.reps || 1) + " gentagelser",
      completion: completion(best),
    };
  }

  return {
    title: "Dit rutinemål",
    detail: Math.round(target.value) + " træningsuger i træk" + time,
    observation: "Dit mål følges gennem dine registrerede pas. Hviledage er ikke fejl.",
    completion: null,
  };
}
