import {
  eligibleOptions,
  mealQuality,
  type MealDay,
  type MealSlot,
} from "./meal-plan";
import { suitable, type Recipe } from "./recipes";
import { estimate, type NutritionPolicy } from "./nutrition";
import { addDays, type Profile } from "./profile";
import { HttpError } from "./errors";
export const batchStorage =
  "Fordel den nylavede mad i mindre beholdere, og køl den hurtigt ned. Opbevar ved højst 5 °C og følg råvarernes holdbarhed og opskriftens anvisninger. Gem kun til næste dag i dette flow; det er en planlægningsgrænse, ikke en garanti for holdbarhed.";
export const batchStorageSource =
  "https://foedevarestyrelsen.dk/kost-og-foedevarer/alt-om-mad/god-koekkenhygiejne/fem-raad-til-god-koekkenhygiejne/koel-mad-hurtigt-ned";

export function batchPlan(
  p: Profile,
  source: MealDay,
  target: MealDay,
  sourceId: string,
  targetId: string,
  library: Recipe[],
  rule: NutritionPolicy,
  id: string,
) {
  if (target.date !== addDays(source.date, 1))
    throw new HttpError(400, "Vælg et måltid den følgende dag.");
  const first = structuredClone(source),
    second = structuredClone(target),
    a = first.slots.find((s) => s.id === sourceId),
    b = second.slots.find((s) => s.id === targetId);
  if (!a?.selected || !b)
    throw new HttpError(
      400,
      "Vælg to eksisterende måltidspladser og en ret til madlavningen.",
    );
  if (a.batch || b.batch || a.status !== "planned" || b.status !== "planned")
    throw new HttpError(
      409,
      "Registrerede eller allerede sammenkædede måltider ændres ikke.",
    );
  const r = library.find((r) => r.id === a.selected!.recipe.id);
  if (
    !r ||
    r.version !== a.selected.recipe.version ||
    !suitable(r, p.diet, p.avoid, p.cookTime, p.halal)
  )
    throw new HttpError(
      409,
      "Retten er ændret eller passer ikke længere til dine filtre. Vælg den på ny.",
    );
  const energy = estimate(p, target.date, rule);
  if (p.nutrition === "calculated" && (!energy.available || !energy.allowed))
    throw new HttpError(
      409,
      energy.available ? energy.reason : energy.explanation,
    );
  const options = b.target
    ? eligibleOptions(
        p,
        b.target,
        [r],
        (second.proteinTarget || 0) / second.slots.length,
        rule.fiber / second.slots.length,
        rule,
      )
    : [structuredClone(a.selected)];
  if (!options.length)
    throw new HttpError(
      400,
      "Denne ret kan ikke fordeles forsvarligt til morgendagens måltid med dets mål og portionsgrænser. Vælg en anden ret eller måltidsplads.",
    );
  b.selected = options[0];
  const quantities = new Map<string, number>();
  for (const [d, s] of [
    [first, a],
    [second, b],
  ] as const)
    for (const i of s.selected!.recipe.ingredients)
      quantities.set(
        i.id,
        (quantities.get(i.id) || 0) + i.grams * (d.householdSize || 1),
      );
  const batch: NonNullable<MealSlot["batch"]> = {
    id,
    cookDate: first.date,
    cookSlot: a.id,
    portions: [
      {
        date: first.date,
        slot: a.id,
        personalServings: a.selected.servings,
        people: first.householdSize || 1,
      },
      {
        date: second.date,
        slot: b.id,
        personalServings: b.selected.servings,
        people: second.householdSize || 1,
      },
    ],
    ingredients: [...quantities].map(([id, grams]) => ({ id, grams })),
  };
  a.batch = batch;
  b.batch = batch;
  return {
    first,
    second,
    batch,
    quality: mealQuality(second),
    storage: batchStorage,
  };
}
