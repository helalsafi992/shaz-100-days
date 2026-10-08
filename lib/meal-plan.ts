import { ingredients, nutrients, suitable, type Recipe } from "./recipes";
import type { Profile } from "./profile";
import { estimate, nutritionRule, type NutritionPolicy } from "./nutrition";
export type Totals = ReturnType<typeof nutrients>;
export type MealOption = {
  recipe: Recipe;
  servings: number;
  totals: Totals;
  grams: number;
};
export type MealSlot = {
  id: string;
  name: string;
  time: string;
  target: number;
  options: MealOption[];
  selected: MealOption | null;
  previous?: MealOption | null;
  status: "planned" | "eaten" | "skipped";
  issue: string;
};
export type MealDay = {
  date: string;
  target: number | null;
  proteinTarget: number | null;
  energy: ReturnType<typeof estimate>;
  slots: MealSlot[];
  issues: string[];
  ruleVersion: string;
  policy?: NutritionPolicy;
};
export function totalOptions(options: (MealOption | null)[]): Totals {
  const result = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const o of options)
    if (o)
      for (const k of Object.keys(result) as (keyof Totals)[])
        result[k] += o.totals[k];
  for (const k of Object.keys(result) as (keyof Totals)[])
    result[k] = Math.round(result[k] * 10) / 10;
  return result;
}
export function portion(recipe: Recipe, servings: number): MealOption {
  const scaled = {
    ...recipe,
    servings: 1,
    ingredients: recipe.ingredients.map((i) => ({
      id: i.id,
      grams: Math.max(1, Math.round((i.grams / recipe.servings) * servings)),
    })),
  };
  return {
    recipe: scaled,
    servings: Math.round(servings * 100) / 100,
    totals: nutrients(scaled),
    grams: scaled.ingredients.reduce((n, i) => n + i.grams, 0),
  };
}
export function portionBounds(r: Recipe) {
  return {
    min: r.portionMin ?? 0.5,
    max: r.portionMax ?? 2.5,
    maxGrams: r.maxGrams ?? 1000,
  };
}
export function optionFor(r: Recipe, target: number) {
  const s = Math.round((target / nutrients(r).kcal) * 100) / 100,
    b = portionBounds(r);
  if (s < b.min || s > b.max) return null;
  const o = portion(r, s);
  return o.grams <= b.maxGrams &&
    Math.abs(o.totals.kcal - target) <= target * 0.04
    ? o
    : null;
}
export function eligibleOptions(
  p: Profile,
  target: number,
  library: Recipe[],
  protein = 0,
  fiber = 0,
  rule: NutritionPolicy = nutritionRule,
) {
  return library
    .filter((r) => suitable(r, p.diet, p.avoid, p.cookTime))
    .map((r) => optionFor(r, target))
    .filter((o): o is MealOption => Boolean(o))
    .filter(
      (o) =>
        o.totals.protein >= protein * 0.95 &&
        o.totals.fiber >= fiber * 0.95 &&
        (o.totals.fat * 9) / o.totals.kcal >= (rule.minFatPercent - 2) / 100 &&
        (o.totals.fat * 9) / o.totals.kcal <= (rule.maxFatPercent + 2) / 100,
    );
}
export function makeMealDay(
  p: Profile,
  date: string,
  library: Recipe[],
  previous?: MealDay,
  rule: NutritionPolicy = nutritionRule,
): MealDay {
  const e = estimate(p, date, rule),
    count = p.mealCount || 4;
  const target = e.available && e.allowed ? e.target : null;
  const locked = (previous?.slots || []).filter((s) => s.status !== "planned");
  const totalLocked = totalOptions(
    locked.filter((s) => s.status === "eaten").map((s) => s.selected),
  );
  const openCount = Math.max(0, count - locked.length),
    remaining = target
      ? Math.max(
          0,
          target -
            totalLocked.kcal -
            locked
              .filter((s) => s.status === "skipped")
              .reduce((n, s) => n + s.target, 0),
        )
      : 0;
  const names = p.mealNames || [],
    times = p.mealTimes || [];
  const issues: string[] = [];
  if (e.available && !e.allowed) issues.push(e.reason);
  if (p.nutrition === "calculated" && !e.available) issues.push(e.explanation);
  if (locked.length > count)
    issues.push(
      "Dagens allerede registrerede måltider bevares. Det nye måltidsantal gælder fuldt fra i morgen.",
    );
  const slots: MealSlot[] = [...locked];
  const pool = library.filter((r) => suitable(r, p.diet, p.avoid, p.cookTime));
  for (let i = 0; i < openCount; i++) {
    let number = i + 1;
    while (slots.some((s) => s.id === `meal-${number}`)) number++;
    const id = "meal-" + number,
      slotTarget = target
        ? previous?.target === target &&
          previous.slots.length === count &&
          locked.some((s) => s.status === "skipped")
          ? target / count
          : remaining / openCount
        : 0;
    const protein = e.available
      ? Math.max(0, e.protein - totalLocked.protein) / Math.max(1, openCount)
      : 0;
    const fiber = e.available
      ? Math.max(0, e.fiber - totalLocked.fiber) / Math.max(1, openCount)
      : 0;
    let candidates = target
      ? eligibleOptions(p, slotTarget, library, protein, fiber, rule)
      : pool.map((r) => portion(r, 1));
    const previousSlot = previous?.slots.find(
      (s) => s.id === id && s.status === "planned",
    );
    const preferred = previousSlot?.selected?.recipe.id;
    const used = slots.flatMap((s) =>
      s.selected ? [s.selected.recipe.id] : [],
    );
    candidates = candidates.sort(
      (a, b) =>
        Number(b.recipe.id === preferred) - Number(a.recipe.id === preferred) ||
        Number(used.includes(a.recipe.id)) -
          Number(used.includes(b.recipe.id)) ||
        (a.recipe.category === "snack" ? 1 : 0) -
          (b.recipe.category === "snack" ? 1 : 0) ||
        a.recipe.name.localeCompare(b.recipe.name, "da"),
    );
    const offset =
      (Number(date.slice(-2)) + i) % Math.max(1, candidates.length);
    if (!preferred && candidates.length > 3)
      candidates = [
        ...candidates.slice(offset),
        ...candidates.slice(0, offset),
      ];
    const options = candidates.slice(0, 3);
    slots.push({
      id,
      name: names[locked.length + i] || `Måltid ${locked.length + i + 1}`,
      time:
        times[locked.length + i] ||
        `${String(10 + Math.round(((locked.length + i) * 10) / Math.max(1, count - 1))).padStart(2, "0")}:00`,
      target: Math.round(slotTarget),
      options,
      selected: options[0] || null,
      status: "planned",
      issue:
        options.length < 3
          ? `Kun ${options.length} passende muligheder med dine filtre og realistiske portioner. Vælg flere måltider, længere tilberedningstid eller gennemgå frivillige udelukkelser. Allergier ændres aldrig automatisk.`
          : "",
    });
  }
  if (
    !openCount &&
    target &&
    Math.abs(totalLocked.kcal - target) > target * 0.05
  )
    issues.push(
      "Dagens registreringer er låst og afviger fra det nye mål. Nye portioner gælder fra i morgen.",
    );
  return {
    date,
    target,
    proteinTarget: e.available ? e.protein : null,
    energy: e,
    slots,
    issues,
    ruleVersion: rule.id + ":" + rule.version,
    policy: rule,
  };
}
export function mealQuality(day: MealDay) {
  const rule = day.policy || nutritionRule;
  const total = totalOptions(
    day.slots.filter((s) => s.status !== "skipped").map((s) => s.selected),
  );
  const actual = totalOptions(
    day.slots.filter((s) => s.status === "eaten").map((s) => s.selected),
  );
  const issues = [
    ...day.issues,
    ...day.slots.map((s) => s.issue).filter(Boolean),
  ];
  if (day.slots.some((s) => !s.selected))
    issues.push("Planen har tomme måltidspladser.");
  if (day.target && Math.abs(total.kcal - day.target) > day.target * 0.05)
    issues.push(
      `Planen afviger ${Math.round((Math.abs(total.kcal - day.target) / day.target) * 100)} % fra dit mål. Målet er uændret.`,
    );
  if (
    day.target &&
    day.proteinTarget &&
    total.protein < day.proteinTarget * 0.95
  )
    issues.push("Den valgte plan når ikke proteinmålet.");
  if (day.target && total.fiber < rule.fiber * 0.95)
    issues.push("Den valgte plan når ikke fibermålet på 25 g.");
  if (
    day.target &&
    ((total.fat * 9) / total.kcal < (rule.minFatPercent - 2) / 100 ||
      (total.fat * 9) / total.kcal > (rule.maxFatPercent + 2) / 100)
  )
    issues.push("Fedtfordelingen ligger uden for testpolitikkens interval.");
  return {
    total,
    actual,
    issues: [...new Set(issues)],
    complete: issues.length === 0,
  };
}
export function mealShopping(days: MealDay[]) {
  const map = new Map<string, number>();
  for (const day of days)
    for (const s of day.slots)
      if (s.selected && s.status !== "skipped")
        for (const i of s.selected.recipe.ingredients)
          map.set(i.id, (map.get(i.id) || 0) + i.grams);
  return [...map]
    .map(([id, grams]) => ({
      ...ingredients.find((i) => i.id === id)!,
      grams: Math.round(grams),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "da"));
}
