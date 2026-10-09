import { z } from "zod";
import { estimate } from "./nutrition";
// Stored weekdays retain the original JS convention: Sunday=0, Monday=1.
// UI ordering is explicitly Monday–Sunday; no historical dates are reinterpreted.
export const weekdays = [1, 2, 3, 4, 5, 6, 0] as const;
export const weekdayNames = [
  "Søndag",
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
];
export const equipmentValues = [
  "bodyweight",
  "dumbbells",
  "band",
  "machines",
  "barbell",
  "rack",
  "bench",
  "cable",
  "leg-press",
  "chest-press",
  "leg-curl",
  "lat-pull",
  "pullup",
] as const;
export const durationValues = [20, 25, 30, 40, 45, 55, 60, 75] as const;
const equipmentSchema = z.array(z.enum(equipmentValues)).min(1).max(14);
const durationSchema = z
  .number()
  .refine(
    (n) => (durationValues as readonly number[]).includes(n),
    "Vælg en understøttet varighed.",
  );
export const locationSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(60),
  kind: z.enum(["home", "gym", "other"]),
  equipment: equipmentSchema,
  maxLoadKg: z.number().min(0).max(500).optional(),
});
export const scheduleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  locationId: z.string().min(1).max(80),
  minutes: durationSchema,
});
export const profileFields = z.object({
  goal: z.enum(["fat-loss", "muscle", "fitness", "maintain"]),
  personalizationVersion: z.literal("shaz-intake-2026-10-09-v1").optional(),
  level: z.enum(["beginner", "intermediate", "experienced"]),
  place: z.enum(["home", "gym", "both"]),
  equipment: equipmentSchema,
  locations: z.array(locationSchema).min(1).max(5).optional(),
  schedule: z.array(scheduleSchema).max(6).optional(),
  weekdayConvention: z.literal("sunday-zero-v1").optional(),
  otherSport: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        weekday: z.number().int().min(0).max(6),
        minutes: z.number().int().min(10).max(240),
        hard: z.boolean(),
      }),
    )
    .max(14)
    .optional(),
  days: z.number().int().min(0).max(6),
  weekdays: z.array(z.number().int().min(0).max(6)).max(6),
  minutes: durationSchema,
  diet: z.enum(["all", "vegetarian", "vegan", "pescatarian", "halal"]),
  halal: z.boolean().optional(),
  householdSize: z.number().int().min(1).max(8).optional(),
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
  exercisePreferred: z.array(z.string().max(100)).max(8).optional(),
  cardio: z
    .object({
      days: z.number().int().min(0).max(6),
      weekdays: z.array(z.number().int().min(0).max(6)).max(6),
      minutes: z.number().int().min(10).max(60),
      forms: z
        .array(
          z.enum(["walk", "cycle", "walk-run", "run", "elliptical", "row"]),
        )
        .min(1)
        .max(6),
      equipment: z
        .array(z.enum(["outdoors", "bike", "treadmill", "elliptical", "rower"]))
        .min(1)
        .max(5),
      level: z.enum(["beginner", "intermediate", "experienced"]),
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
  if (p.weekdays.length !== p.days)
    c.addIssue({
      code: "custom",
      path: ["weekdays"],
      message: "Ugedage må ikke gentages.",
    });
  if (p.days >= 5)
    c.addIssue({
      code: "custom",
      path: ["days"],
      message:
        p.level !== "experienced"
          ? "5–6 styrkepas kræver erfaren træning og en fagligt godkendt split-skabelon. Vælg 2–4 pas eller ændr rytmen."
          : "5–6-pas-skabeloner afventer faglig godkendelse. Vælg 4 pas eller færre; vi kopierer ikke helkrop seks gange.",
    });
  if (p.place === "both" && (!p.locations || !p.schedule))
    c.addIssue({
      code: "custom",
      path: ["locations"],
      message: "Ved Begge skal du vælge sted og tid for hver træningsdag.",
    });
  if (p.locations) {
    if (new Set(p.locations.map((l) => l.id)).size !== p.locations.length)
      c.addIssue({
        code: "custom",
        path: ["locations"],
        message: "Lokationer skal have forskellige id'er.",
      });
    if (
      p.schedule &&
      (p.schedule.length !== p.days ||
        new Set(p.schedule.map((s) => s.weekday)).size !== p.days ||
        p.schedule.some(
          (s) =>
            !p.weekdays.includes(s.weekday) ||
            !p.locations!.some((l) => l.id === s.locationId),
        ))
    )
      c.addIssue({
        code: "custom",
        path: ["schedule"],
        message: "Vælg én gyldig lokation og varighed for hver styrkedag.",
      });
  }
  const hardDays = new Set([
    ...p.weekdays,
    ...(p.otherSport || []).filter((s) => s.hard).map((s) => s.weekday),
    ...(p.cardio?.intensity === "moderate" ? p.cardio.weekdays : []),
  ]);
  if (hardDays.size > 6)
    c.addIssue({
      code: "custom",
      path: ["weekdays"],
      message:
        "Bevar mindst én dag uden hård træning. Reducér et hårdt pas eller flyt det til en anden aktiv dag.",
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
  experienced: "Erfaren",
  home: "Hjemme",
  gym: "Fitnesscenter",
  both: "Hjemme + fitness",
  rack: "Squat-rack med sikkerhedsstøtter",
  bench: "Træningsbænk",
  cable: "Kabelstation",
  "leg-press": "Benpresmaskine",
  "chest-press": "Brystpresmaskine",
  "leg-curl": "Lårcurlmaskine",
  "lat-pull": "Nedtræksmaskine",
  pullup: "Pull-up-stang",
  all: "Spiser det meste",
  vegetarian: "Vegetarisk",
  vegan: "Vegansk",
  pescatarian: "Pescetarisk",
  halal: "Halal-egnet",
  bodyweight: "Kropsvægt",
  dumbbells: "Håndvægte",
  band: "Træningselastik",
  machines: "Maskiner og kabel",
  barbell: "Vægtstang",
  portions: "Portionsvejledning",
  calculated: "Beregnet energiindtag",
};
export type Location = z.infer<typeof locationSchema>;
export function normalizeProfile(p: Profile): Profile {
  const locations = p.locations?.length
    ? p.locations
    : [
        {
          id: "legacy-" + p.place,
          name: labels[p.place] || "Min træning",
          kind: p.place === "gym" ? ("gym" as const) : ("home" as const),
          equipment: p.equipment,
        },
      ];
  const schedule =
    p.schedule ??
    p.weekdays.map((weekday) => ({
      weekday,
      locationId: locations[0].id,
      minutes: p.minutes,
    }));
  return {
    ...p,
    locations,
    schedule,
    weekdayConvention: "sunday-zero-v1",
    halal: p.halal ?? p.diet === "halal",
  };
}
export function sessionProfile(
  p: Profile,
  weekday: number,
  override?: { locationId?: string; minutes?: number },
): Profile {
  const n = normalizeProfile(p),
    slot = n.schedule!.find((s) => s.weekday === weekday),
    location =
      n.locations!.find(
        (l) => l.id === (override?.locationId || slot?.locationId),
      ) || n.locations![0];
  return {
    ...n,
    equipment: location.equipment,
    minutes: override?.minutes || slot?.minutes || p.minutes,
    place: location.kind === "gym" ? "gym" : "home",
  };
}
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
