/** One calendar vocabulary used by Today, Training and Progress. */
export function activityForDate(
  date: string,
  days: { scheduled_date: string; status: string; plan: { kind: string } }[],
  cardio: { scheduled_date: string; status: string }[],
) {
  const strength = days.find(
    (d) => d.scheduled_date === date && d.plan.kind === "workout",
  );
  const conditioning = cardio.filter(
    (c) => c.scheduled_date === date && c.status !== "removed",
  );
  const activeStrength = !!strength && strength.status !== "skipped";
  const activeCardio = conditioning.some((c) => c.status !== "skipped");
  return {
    strength,
    cardio: conditioning,
    label:
      activeStrength && activeCardio
        ? "Styrke + cardio"
        : activeStrength
          ? "Styrke"
          : activeCardio
            ? "Cardio"
            : strength || conditioning.length
              ? "Pas sprunget over"
              : "Restitution",
    hasActivity: activeStrength || activeCardio,
  };
}
export function activityCounts(
  days: { status: string; plan: { kind: string } }[],
  cardio: { status: string }[],
) {
  const strength = days.filter(
    (d) => d.plan.kind === "workout" && d.status === "completed",
  ).length;
  const conditioning = cardio.filter((c) => c.status === "completed").length;
  return { strength, cardio: conditioning, total: strength + conditioning };
}
