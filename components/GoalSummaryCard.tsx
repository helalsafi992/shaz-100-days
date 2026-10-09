import Link from "next/link";
import {
  summarizeGoal, type MeasurableGoal, type SetMeasurement,
} from "@/lib/goal-summary";

export default function GoalSummaryCard({
  goal, weights = [], sets = [], isDraft = false, compact = false,
}: {
  goal?: MeasurableGoal | null;
  weights?: { date: string; kg: string }[];
  sets?: SetMeasurement[];
  isDraft?: boolean;
  compact?: boolean;
}) {
  const summary = summarizeGoal(goal, { weights, sets });
  if (!summary) return null;
  return (
    <section className={"p-card shaz-goal-summary " + (compact ? "is-compact" : "")}>
      <div className="shaz-goal-header">
        <div>
          <span className="p-eyebrow">{isDraft ? "DIT VALGTE MÅL · IKKE AKTIVERET" : "DIT KONKRETE MÅL"}</span>
          <h2>{summary.title}</h2>
        </div>
        <Link className="p-secondary" href="/onboarding?edit=1">Rediger mål</Link>
      </div>
      <p className="shaz-goal-target">{summary.detail}</p>
      {summary.observation && <p className="p-note">{summary.observation}</p>}
      {summary.completion !== null && !isDraft && (
        <div className="shaz-goal-track" role="group" aria-label="Udvikling mod dit mål">
          <div className="shaz-goal-bar"><span style={{ width: summary.completion + "%" }} /></div>
          <p className="p-note">{summary.completion}% af den målte vej fra dit udgangspunkt. Ikke en prognose.</p>
        </div>
      )}
      <p className="p-note">Målet hjælper med opfølgning; din træning og kost følger stadig de gældende sikkerhedsregler.</p>
    </section>
  );
}
