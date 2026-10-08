/** One calendar vocabulary used by Today, Training and Progress. */
export function activityForDate(
  date: string,
  days: { scheduled_date: string; status: string; plan: { kind: string } }[],
  cardio: { scheduled_date: string; status: string }[],
  sport: {
    weekday: number;
    name: string;
    minutes: number;
    hard: boolean;
  }[] = [],
) {
  const strength = days.find(
    (d) => d.scheduled_date === date && d.plan.kind === "workout",
  );
  const conditioning = cardio.filter(
    (c) => c.scheduled_date === date && c.status !== "removed",
  );
  const activeStrength = !!strength && strength.status !== "skipped";
  const activeCardio = conditioning.some((c) => c.status !== "skipped");
  const otherSport = sport.filter(
    (s) => s.weekday === new Date(date + "T12:00:00Z").getUTCDay(),
  );
  return {
    strength,
    cardio: conditioning,
    otherSport,
    label:
      activeStrength && activeCardio
        ? "Styrke + cardio"
        : activeStrength
          ? "Styrke"
          : activeCardio
            ? "Cardio"
            : otherSport.length
              ? "Anden sport"
              : strength || conditioning.length
                ? "Pas sprunget over"
                : "Restitution",
    hasActivity: activeStrength || activeCardio || otherSport.length > 0,
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
