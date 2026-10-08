import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  addDays,
  dayNumber,
  profileSchema,
  type Profile,
} from "../lib/profile";
import {
  estimate,
  targetFromMaintenance,
  nutritionRule,
} from "../lib/nutrition";
import {
  makeMealDay,
  mealQuality,
  mealShopping,
  portion,
  totalOptions,
} from "../lib/meal-plan";
import { recipes, suitable, nutrients } from "../lib/recipes";
import { generateCardio, weekProblems } from "../lib/cardio";
import { generatePlan, alternatives, exercises } from "../lib/training";
import { isolatedTest } from "../lib/test-environment";
const p: Profile = {
  ...defaults,
  age: 31,
  height: 168,
  weight: 60,
  sex: "male",
  activity: "moderate",
  goal: "fat-loss",
  nutrition: "calculated",
  dataConsent: true,
  calculationSuitable: true,
  startDate: "2026-10-08",
  cookTime: 60,
  deficitReviewUntil: "2026-10-14",
  aggressiveDaysUsed: 7,
};
test("B: four exact deficit levels and server policy blocks inappropriate profiles", () => {
  for (const [percent, target] of [
    [10, 2160],
    [15, 2040],
    [20, 1920],
    [25, 1800],
  ])
    assert.deepEqual(targetFromMaintenance(2400, percent), {
      maintenance: 2400,
      deficit: 2400 - target,
      target,
      percent,
    });
  for (const [deficitLevel, target] of [
    ["moderate", 2160],
    ["high", 2040],
    ["higher", 1920],
    ["aggressive", 1800],
  ] as const) {
    const e = estimate({ ...p, deficitLevel }, "2026-10-08");
    assert.ok(e.available && e.allowed);
    assert.equal(e.target, target);
  }
  for (const bad of [
    { age: 17 },
    { pregnantOrBreastfeeding: true },
    { medicalNutrition: true },
    { eatingDisorderHistory: true },
    { weight: 45 },
  ])
    assert.equal(estimate({ ...p, ...bad }, "2026-10-08").available, false);
  const high = estimate(
    { ...p, deficitLevel: "aggressive", trainingActivity: "heavy" },
    "2026-10-08",
  );
  assert.ok(high.available && !high.allowed);
  const expired = estimate({ ...p, deficitLevel: "aggressive" }, "2026-10-15");
  assert.ok(expired.available && !expired.allowed);
  const maintenance = estimate({ ...p, goal: "maintain" }, "2026-10-08");
  assert.ok(maintenance.available);
  assert.equal(maintenance.target, 2400);
  const muscle = estimate({ ...p, goal: "muscle" }, "2026-10-08");
  assert.ok(muscle.available && muscle.target > muscle.maintenance);
  const strict = estimate(p, "2026-10-08", { ...nutritionRule, minMale: 2300 });
  assert.ok(
    strict.available && !strict.allowed,
    "a reviewed policy change actually changes eligibility",
  );
});
test("C/D/F/G: all 3^N meal combinations across meal counts, diets and calorie levels respect totals and filters", () => {
  let combinations = 0;
  for (const diet of ["all", "vegetarian", "halal"] as const)
    for (const mealCount of [2, 3, 4, 5, 6])
      for (const target of [1800, 2200, 2600]) {
        const factor = target === 2600 ? 1.8 : 1.4;
        const weight = (target / factor - 6.25 * 165 + 5 * 40 + 161) / 10;
        const profile = {
          ...p,
          age: 40,
          height: 165,
          sex: "female" as const,
          activity: target === 2600 ? ("high" as const) : ("low" as const),
          weight,
          goal: "maintain" as const,
          diet,
          mealCount,
        };
        const day = makeMealDay(profile, "2026-10-08", recipes);
        assert.equal(day.target, target);
        assert.ok(day.target);
        assert.equal(day.slots.length, mealCount);
        for (const slot of day.slots) {
          assert.equal(
            slot.options.length,
            3,
            `${diet}/${mealCount}/${target}: ${slot.issue}`,
          );
          assert.equal(new Set(slot.options.map((o) => o.recipe.id)).size, 3);
          for (const o of slot.options)
            assert.ok(suitable(o.recipe, diet, [], 60));
        }
        function visit(
          i: number,
          selected: (typeof day.slots)[number]["options"],
        ) {
          if (i === day.slots.length) {
            const total = totalOptions(selected);
            assert.ok(Math.abs(total.kcal - day.target!) <= day.target! * 0.05);
            assert.ok(total.protein >= day.proteinTarget! * 0.95);
            assert.ok(total.fiber >= 25 * 0.95);
            combinations++;
            return;
          }
          for (const option of day.slots[i].options)
            visit(i + 1, [...selected, option]);
        }
        visit(0, []);
      }
  assert.ok(combinations > 9000);
  console.log("Meal combinations checked:", combinations);
  for (const avoid of [
    ["milk"],
    ["gluten"],
    ["egg", "fish"],
    ["soy"],
    ["peanut", "nuts"],
  ]) {
    const day = makeMealDay(
      { ...p, avoid, mealCount: 4 },
      "2026-10-08",
      recipes,
    );
    for (const s of day.slots)
      for (const o of s.options)
        assert.ok(suitable(o.recipe, p.diet, avoid, 60));
  }
  const impossible = makeMealDay(
    {
      ...p,
      avoid: [
        "oats",
        "yogurt",
        "tofu",
        "bread",
        "rice",
        "pasta",
        "egg",
        "beans",
        "chickpeas",
        "lentils",
        "chicken",
        "salmon",
        "tuna",
        "milk",
      ],
      mealCount: 6,
    },
    "2026-10-08",
    recipes,
  );
  assert.ok(impossible.slots.some((s) => s.options.length < 3 && s.issue));
});
test("E: selected meals alone determine food/shopping; removed, eaten and skipped records are distinct", () => {
  const d = makeMealDay({ ...p, mealCount: 3 }, "2026-10-08", recipes),
    q = mealQuality(d);
  assert.ok(q.complete);
  assert.equal(q.actual.kcal, 0);
  const before = q.total.kcal,
    option = d.slots[0].selected!;
  d.slots[0].previous = option;
  d.slots[0].selected = null;
  assert.ok(
    Math.abs(mealQuality(d).total.kcal - (before - option.totals.kcal)) < 0.2,
  );
  assert.equal(d.target, 2160);
  assert.ok(!mealQuality(d).complete);
  assert.equal(
    mealShopping([d]).reduce((s, x) => s + x.grams, 0),
    d.slots
      .slice(1)
      .reduce(
        (n, s) =>
          n + s.selected!.recipe.ingredients.reduce((a, i) => a + i.grams, 0),
        0,
      ),
  );
  d.slots[0].selected = option;
  d.slots[0].status = "eaten";
  assert.equal(mealQuality(d).actual.kcal, option.totals.kcal);
  const next = makeMealDay({ ...p, mealCount: 6 }, "2026-10-08", recipes, d);
  assert.deepEqual(
    next.slots.find((s) => s.id === d.slots[0].id),
    d.slots[0],
  );
  assert.equal(next.target, d.target);
  d.slots[1].status = "skipped";
  const skipped = makeMealDay({ ...p, mealCount: 3 }, "2026-10-08", recipes, d);
  assert.ok(
    skipped.slots.find((s) => s.status === "planned")!.target <=
      Math.round(d.target! / 3) + 1,
    "skipping does not compensate",
  );
  for (const r of recipes) {
    const o = portion(r, 1.37);
    assert.deepEqual(o.totals, nutrients(o.recipe));
  }
});
test("H/M: cardio respects equipment, selected weekdays, progression, rest and exact 100-day boundary", () => {
  const profile = {
    ...p,
    cardio: {
      days: 2,
      weekdays: [2, 4],
      minutes: 30,
      forms: ["walk", "cycle"] as ("walk" | "cycle")[],
      equipment: ["outdoors", "bike"] as ("outdoors" | "bike")[],
      level: "beginner" as const,
      intensity: "easy" as const,
    },
  };
  assert.deepEqual(weekProblems(profile), []);
  const cardio = generateCardio(profile);
  assert.ok(cardio.length > 20);
  assert.ok(cardio.every((c) => c.day < 100 && c.options.length === 3));
  assert.equal(cardio[0].selected.minutes, 20);
  assert.equal(generatePlan(profile).length, 100);
  const goals = generateCardio({ ...profile, deficitLevel: "aggressive" });
  assert.deepEqual(cardio, goals, "calorie deficit never increases cardio");
  assert.ok(
    weekProblems({
      ...profile,
      cardio: { ...profile.cardio, weekdays: [1, 3], intensity: "moderate" },
    }).length,
  );
  assert.ok(
    weekProblems({
      ...profile,
      cardio: { ...profile.cardio, equipment: ["outdoors"] },
    }).length,
  );
  assert.equal(
    generateCardio({
      ...profile,
      cardio: { ...profile.cardio, days: 0, weekdays: [] },
    }).length,
    0,
  );
  assert.equal(dayNumber("2026-10-08", new Date("2027-01-15T12:00:00Z")), 100);
  assert.equal(dayNumber("2026-10-08", new Date("2027-01-16T12:00:00Z")), 101);
});
test("L: test flags cannot enable entitlements in the production project or on a different origin", () => {
  const old = { ...process.env };
  Object.assign(process.env, {
    APP_ENV: "staging",
    TEST_ACCESS_ENABLED: "true",
    RAILWAY_PROJECT_ID: "5e76002a-fecf-400c-84ba-86f64bae34c3",
    APP_URL: "https://shaz-production.up.railway.app",
    STRIPE_MODE: "test",
  });
  assert.equal(isolatedTest(), false);
  Object.assign(process.env, {
    RAILWAY_PROJECT_ID: "6a019412-cb8a-4ac1-a8ae-a1c315f7b211",
    APP_URL: "https://shaz-test-staging.up.railway.app",
  });
  assert.equal(isolatedTest(), true);
  process.env.STRIPE_MODE = "live";
  assert.equal(isolatedTest(), false);
  for (const k of Object.keys(process.env))
    if (!(k in old)) delete process.env[k];
  Object.assign(process.env, old);
});
