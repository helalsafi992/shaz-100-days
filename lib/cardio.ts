import type { Profile } from "./profile";
import { addDays } from "./profile";
export const cardioRule = {
  id: "cardio-v1",
  version: 1,
  status: "review",
  weeklyIncrease: 0.05,
  beginnerStart: 20,
  maxCombinedEasyMinutes: 20,
  maxActiveDays: 6,
};
export type CardioPolicy = {
  id: string;
  version: number;
  status: string;
  weeklyIncrease: number;
  beginnerStart: number;
  maxCombinedEasyMinutes: number;
  maxActiveDays: number;
};
export type CardioOption = {
  id: string;
  form: string;
  title: string;
  minutes: number;
  intensity: string;
  warmup: string;
  main: string;
  cooldown: string;
  purpose: string;
  ruleVersion: string;
};
export type CardioPlan = {
  day: number;
  date: string;
  week: number;
  options: CardioOption[];
  selected: CardioOption;
  ruleVersion: string;
  issue: string;
};
export function weekProblems(p: Profile, rule: CardioPolicy = cardioRule) {
  const c = p.cardio;
  if (!c || c.days === 0) return [];
  const issues: string[] = [];
  if (new Set(c.weekdays).size !== c.days)
    issues.push("Vælg det samme antal cardiougedage som cardiopas.");
  if (new Set([...p.weekdays, ...c.weekdays]).size > rule.maxActiveDays)
    issues.push("Bevar mindst én dag uden planlagte styrke- og cardiopas.");
  if (
    c.weekdays.some((d) => p.weekdays.includes(d)) &&
    (c.intensity !== "easy" || c.minutes > rule.maxCombinedEasyMinutes)
  )
    issues.push(
      "På styrkedage kan der højst ligge 20 minutters let cardio. Vælg en anden dag eller kortere, let cardio.",
    );
  if (c.forms.includes("cycle") && !c.equipment.includes("bike"))
    issues.push("Cykling kræver adgang til cykel eller motionscykel.");
  if (c.forms.includes("elliptical") && !c.equipment.includes("elliptical"))
    issues.push("Crosstrainer kræver en crosstrainer.");
  if (
    c.forms.some((f) => ["walk", "walk-run"].includes(f)) &&
    !c.equipment.some((e) => ["outdoors", "treadmill"].includes(e))
  )
    issues.push("Gang og løb/gang kræver udendørs mulighed eller løbebånd.");
  return issues;
}
export function cardioOptions(
  p: Profile,
  week: number,
  rule: CardioPolicy = cardioRule,
): CardioOption[] {
  const c = p.cardio;
  if (!c || !c.days) return [];
  const minutes =
    c.level === "beginner"
      ? Math.min(
          c.minutes,
          Math.round(
            Math.min(c.minutes, rule.beginnerStart) *
              (1 + rule.weeklyIncrease * (week - 1)),
          ),
        )
      : c.minutes;
  const intensity =
    c.intensity === "easy"
      ? "Let: RPE 2–3 af 10. Du kan tale i hele sætninger uden besvær."
      : "Moderat: RPE 4–5 af 10. Du kan tale i sætninger, men mærker tydeligt din vejrtrækning.";
  const names = {
    walk: "Gang",
    cycle: "Cykling",
    "walk-run": "Løb/gang",
    elliptical: "Crosstrainer",
  };
  const out: CardioOption[] = [];
  for (const f of c.forms)
    for (let i = 0; i < 3; i++) {
      const adjusted = f === "walk-run" ? Math.max(10, minutes - 5) : minutes;
      out.push({
        id: f + "-" + i,
        form: f,
        title:
          names[f] + [" i roligt flow", " i to blokke", " med korte pauser"][i],
        minutes: adjusted,
        intensity,
        warmup: "Start med 3 minutter meget roligt, og øg gradvist.",
        main:
          f === "walk-run"
            ? `Skift mellem ${c.level === "beginner" ? "30 sekunders let jog og 2 minutters gang" : "1 minuts let jog og 2 minutters gang"}. Hold samme lette oplevede anstrengelse. Gå hele passet, hvis løb ikke føles godt.`
            : i === 0
              ? "Hold et jævnt, behageligt tempo i hoveddelen."
              : i === 1
                ? "Del hoveddelen i to lige blokke med 2 minutters meget roligt tempo mellem. Pausen er med i tiden."
                : "Del hoveddelen i 3-minutters blokke med 1 minut meget roligt tempo mellem. Pauserne er med i tiden.",
        cooldown:
          "Afslut med 2 minutter meget roligt. Stop tidligere ved smerte, svimmelhed eller usædvanligt ubehag.",
        purpose:
          "Rolig kondition og en holdbar rytme. Tiden er en tilpasning af belastning, ikke et løfte om samme kalorieforbrug.",
        ruleVersion: rule.id + ":" + rule.version,
      });
    }
  // Offer different forms before different structures of one form.
  return out.sort((a, b) => Number(a.id.slice(-1)) - Number(b.id.slice(-1)));
}
export function generateCardio(
  p: Profile,
  rule: CardioPolicy = cardioRule,
): CardioPlan[] {
  if (weekProblems(p, rule).length)
    throw new Error(weekProblems(p, rule).join(" "));
  if (!p.cardio?.days) return [];
  return Array.from({ length: 99 }, (_, i) => {
    const date = addDays(p.startDate, i),
      week = Math.floor(i / 7) + 1,
      options = cardioOptions(p, week, rule).slice(0, 3);
    return {
      day: i + 1,
      date,
      week,
      options,
      selected: options[0],
      ruleVersion: rule.id + ":" + rule.version,
      issue:
        options.length < 3
          ? "Kun disse egnede alternativer findes til dit valg."
          : "",
    };
  }).filter((d) =>
    p.cardio!.weekdays.includes(new Date(d.date + "T12:00:00Z").getUTCDay()),
  );
}
