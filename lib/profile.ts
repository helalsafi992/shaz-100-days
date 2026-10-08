import { z } from "zod";
export const profileFields = z.object({
  goal: z.enum(["fat-loss", "muscle", "fitness"]),
  level: z.enum(["beginner", "intermediate"]),
  place: z.enum(["home", "gym"]),
  equipment: z
    .array(z.enum(["bodyweight", "dumbbells", "band", "machines", "barbell"]))
    .min(1)
    .max(5),
  days: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  weekdays: z.array(z.number().int().min(0).max(6)).min(2).max(4),
  minutes: z.union([z.literal(25), z.literal(40), z.literal(55)]),
  diet: z.enum(["all", "vegetarian", "halal"]),
  avoid: z.array(z.string().max(40)).max(40),
  cookTime: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  nutrition: z.enum(["portions", "calculated"]),
  age: z.number().int().min(18).max(100).optional(),
  height: z.number().min(130).max(220).optional(),
  weight: z.number().min(40).max(250).optional(),
  sex: z.enum(["female", "male"]).optional(),
  activity: z.enum(["low", "moderate", "high"]).optional(),
  calculationSuitable: z.boolean().optional(),
  dataConsent: z.boolean().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((v) => {
      const d = new Date(v + "T12:00:00Z");
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
    }),
});
export const profileSchema = profileFields.superRefine((p, c) => {
  if (new Set(p.weekdays).size !== p.days)
    c.addIssue({
      code: "custom",
      path: ["weekdays"],
      message: "Vælg det samme antal ugedage som træningsdage.",
    });
  if (p.days <= 3 && p.weekdays.some((d) => p.weekdays.includes((d + 1) % 7)))
    c.addIssue({
      code: "custom",
      path: ["weekdays"],
      message: "Læg mindst én hviledag mellem helkropspassene.",
    });
  if (
    p.days === 4 &&
    p.weekdays.some(
      (d) =>
        p.weekdays.includes((d + 1) % 7) && p.weekdays.includes((d + 2) % 7),
    )
  )
    c.addIssue({
      code: "custom",
      path: ["weekdays"],
      message: "Vælg højst to træningsdage i træk.",
    });
  if (
    p.place === "home" &&
    p.equipment.some((e) => ["machines", "barbell"].includes(e))
  )
    c.addIssue({
      code: "custom",
      path: ["equipment"],
      message: "Vælg udstyr til hjemmet.",
    });
  if (
    p.nutrition === "calculated" &&
    (!p.age ||
      !p.height ||
      !p.weight ||
      !p.sex ||
      !p.activity ||
      !p.calculationSuitable ||
      !p.dataConsent)
  )
    c.addIssue({
      code: "custom",
      path: ["nutrition"],
      message: "Udfyld de nødvendige oplysninger eller vælg portioner.",
    });
});
export type Profile = z.infer<typeof profileSchema>;
export const defaults: Profile = {
  goal: "fitness",
  level: "beginner",
  place: "home",
  equipment: ["bodyweight"],
  days: 3,
  weekdays: [1, 3, 5],
  minutes: 40,
  diet: "all",
  avoid: [],
  cookTime: 30,
  nutrition: "portions",
  startDate: "",
};
export const labels: Record<string, string> = {
  "fat-loss": "Fedttab",
  muscle: "Muskelopbygning",
  fitness: "Bedre form",
  beginner: "Begynder",
  intermediate: "Let øvet",
  home: "Hjemme",
  gym: "Fitnesscenter",
  all: "Spiser det meste",
  vegetarian: "Vegetarisk",
  halal: "Halal-egnet",
  bodyweight: "Kropsvægt",
  dumbbells: "Håndvægte",
  band: "Træningselastik",
  machines: "Maskiner og kabel",
  barbell: "Vægtstang",
  portions: "Portionsvejledning",
  calculated: "Beregnet energiindtag",
};
export function localDate(at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}
export function addDays(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function dayNumber(start: string, at = new Date()) {
  return (
    Math.floor(
      (Date.parse(localDate(at) + "T12:00:00Z") -
        Date.parse(start + "T12:00:00Z")) /
        86400000,
    ) + 1
  );
}
export function energy(p: Profile) {
  if (
    p.nutrition !== "calculated" ||
    !p.weight ||
    !p.height ||
    !p.age ||
    !p.sex ||
    !p.activity
  )
    return null;
  const bmi = p.weight / (p.height / 100) ** 2;
  if (p.age > 64 || bmi < 18.5 || bmi > 35 || !p.calculationSuitable)
    return {
      available: false,
      explanation:
        "Vælg portionsvejledning. En individuel vurdering er mere relevant end denne generelle beregning.",
    };
  const resting =
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const factor = { low: 1.4, moderate: 1.6, high: 1.8 }[p.activity];
  const maintenance = resting * factor;
  const adjustment =
    p.goal === "fat-loss"
      ? -Math.min(maintenance * 0.1, 300)
      : p.goal === "muscle"
        ? Math.min(maintenance * 0.05, 150)
        : 0;
  return {
    available: true,
    kcal: Math.round((maintenance + adjustment) / 50) * 50,
    resting: Math.round(resting),
    factor,
    adjustment: Math.round(adjustment),
    explanation:
      "Mifflin–St Jeor × valgt aktivitetsfaktor. Et skøn, ikke en måling. Ved fedttab højst 10 %/300 kcal under skønnet vedligehold; muskelmål højst 5 %/150 kcal over. Justeres ikke ud fra én vejning.",
  };
}
