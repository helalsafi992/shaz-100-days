/** Presentation-only selectors. They never generate, move or modify a plan. */
type Activity = { scheduled_date: string; status: string; plan?: { kind?: string; paused?: boolean } };
export const visibleActivity = (a: Activity) => !["removed", "paused", "skipped"].includes(a.status) && !a.plan?.paused;
export const pendingActivity = (a: Activity) => visibleActivity(a) && a.status !== "completed";
export function weekStats(strength: Activity[], cardio: Activity[], start: string, end: string) {
  const within = (a: Activity) => a.scheduled_date >= start && a.scheduled_date <= end && visibleActivity(a);
  const s = strength.filter(a => a.plan?.kind === "workout" && within(a));
  const c = cardio.filter(within);
  return { planned: s.length + c.length, completed: [...s, ...c].filter(a => a.status === "completed").length,
    strength: s.filter(a => a.status === "completed").length, cardio: c.filter(a => a.status === "completed").length };
}
export function safeWeek(day: number) { return Math.max(1, Math.min(15, Math.ceil(day / 7))); }
export function numberLabel(n: number) { return new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(n); }
export function safeProgress(value: number, target: number | null | undefined) {
  return target && target > 0 && Number.isFinite(value) ? Math.max(0, Math.min(100, value / target * 100)) : 0;
}
