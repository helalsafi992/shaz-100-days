import { z } from "zod";
import { estimate } from "./nutrition";
export const profileFields = z.object({
  goal: z.enum(["fat-loss", "muscle", "fitness", "maintain"]),
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
  age: z.number().int().min(13).max(100).optional(),
  height: z.number().min(130).max(220).optional(),
  weight: z.number().min(40).max(250).optional(),
  sex: z.enum(["female", "male"]).optional(),
  activity: z.enum(["low", "moderate", "high"]).optional(),
  calculationSuitable: z.boolean().optional(),
  dataConsent: z.boolean().optional(),
  mealCount: z.number().int().min(2).max(6).optional(),
  mealNames: z.array(z.string().min(1).max(40)).min(2).max(6).optional(),
  mealTimes: z
    .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/))
    .min(2)
    .max(6)
    .optional(),
  deficitLevel: z.enum(["moderate", "high", "higher", "aggressive"]).optional(),
  everydayActivity: z.enum(["seated", "moving", "physical"]).optional(),
  trainingActivity: z.enum(["light", "regular", "heavy"]).optional(),
  pregnantOrBreastfeeding: z.boolean().optional(),
  medicalNutrition: z.boolean().optional(),
  eatingDisorderHistory: z.boolean().optional(),
  deficitReviewUntil: z.string().optional(),
  aggressiveDaysUsed: z.number().int().min(0).max(14).optional(),
  exerciseAvoid: z.array(z.string().max(100)).max(30).optional(),
  cardio: z
    .object({
      days: z.number().int().min(0).max(4),
      weekdays: z.array(z.number().int().min(0).max(6)).max(4),
      minutes: z.number().int().min(10).max(60),
      forms: z
        .array(z.enum(["walk", "cycle", "walk-run", "elliptical"]))
        .min(1)
        .max(4),
      equipment: z
        .array(z.enum(["outdoors", "bike", "treadmill", "elliptical"]))
        .min(1)
        .max(4),
      level: z.enum(["beginner", "intermediate"]),
      intensity: z.enum(["easy", "moderate"]),
    })
    .optional(),
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
  maintain: "Vedligeholdelse",
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
  if (p.nutrition !== "calculated") return null;
  const e = estimate(p);
  if (!e.available)
    return { ...e, kcal: undefined, adjustment: undefined, resting: undefined };
  return { ...e, kcal: e.target, adjustment: e.surplus - e.deficit };
}
