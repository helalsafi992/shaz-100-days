import type { Profile } from "./profile";
import { addDays } from "./profile";
export const cardioRule = {
  id: "cardio-flexible-v2",
  version: 2,
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
  if (c.forms.includes("cycle") && !c.equipment.includes("bike"))
    issues.push("Cykling kræver adgang til cykel eller motionscykel.");
  if (c.forms.includes("elliptical") && !c.equipment.includes("elliptical"))
    issues.push("Crosstrainer kræver en crosstrainer.");
  if (c.forms.includes("row") && !c.equipment.includes("rower"))
    issues.push("Roning kræver en romaskine.");
  if (c.forms.includes("run") && c.level === "beginner")
    issues.push(
      "Sammenhængende løb kræver løbeerfaring. Vælg løb/gang eller gang som begyndervalg.",
    );
  if (
    c.forms.some((f) => ["walk", "walk-run", "run"].includes(f)) &&
    !c.equipment.some((e) => ["outdoors", "treadmill"].includes(e))
  )
    issues.push("Gang og løb/gang kræver udendørs mulighed eller løbebånd.");
  return issues;
}
/** Advice is visible to the coach, never a hidden cap or a block on the selected time. */
export function cardioAdvice(p: Profile) {
  const c = p.cardio;
  if (!c?.days) return [];
  const notes: string[] = [];
  if (c.weekdays.some(d => p.weekdays.includes(d))) notes.push("Styrke og cardio samme dag: prioritér dit vigtigste mål først og tilpas efter restitution.");
  if (new Set([...p.weekdays, ...c.weekdays]).size === 7) notes.push("Aktivitet alle ugens dage: variér belastningen og planlæg lette dage efter behov.");
  if (c.level === "beginner" && c.minutes > 30) notes.push("Du har valgt et længere pas som begynder. Coachen gennemgår belastningen; varigheden er ikke ændret.");
  return notes;
}
export function cardioOptions(
  p: Profile,
  week: number,
  rule: CardioPolicy = cardioRule,
): CardioOption[] {
  const c = p.cardio;
  if (!c || !c.days) return [];
  // Calendar time alone is not evidence of adaptation. A new duration requires acceptance.
  const minutes = c.minutes;
  const intensity =
    c.intensity === "easy"
      ? "Let: RPE 2–3 af 10. Du kan tale i hele sætninger uden besvær."
      : "Moderat: RPE 4–5 af 10. Du kan tale i sætninger, men mærker tydeligt din vejrtrækning.";
  const names = {
    walk: "Gang",
    cycle: "Cykling",
    "walk-run": "Løb/gang",
    elliptical: "Crosstrainer",
    run: "Løb",
    row: "Roning",
  };
  const out: CardioOption[] = [];
  for (const f of c.forms)
    for (let i = 0; i < 3; i++) {
      const adjusted = minutes;
      out.push({
        id: f + "-" + i,
        form: f,
        title:
          names[f] + [" i roligt flow", " i to blokke", " med korte pauser"][i],
        minutes: adjusted,
        intensity,
        warmup: `Start med ${Math.min(3, Math.max(1, Math.floor(minutes / 5)))} minut meget roligt. Opvarmning og pauser er med i din valgte tid.`,
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
