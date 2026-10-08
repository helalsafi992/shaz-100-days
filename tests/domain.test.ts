import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  profileSchema,
  dayNumber,
  addDays,
  energy,
} from "../lib/profile";
import {
  generatePlan,
  alternatives,
  exercises,
  phase,
  progression,
  hasEquipment,
} from "../lib/training";
import {
  recipes,
  ingredients,
  nutrients,
  suitable,
  shoppingList,
} from "../lib/recipes";
test("12 program variants contain exactly 100 meaningful days and equipment-safe alternatives", () => {
  const fingerprints = new Set<string>();
  for (const place of ["home", "gym"] as const)
    for (const level of ["beginner", "intermediate"] as const)
      for (const days of [2, 3, 4] as const) {
        const p = profileSchema.parse({
          ...defaults,
          place,
          level,
          days,
          equipment:
            place === "gym"
              ? ["bodyweight", "machines", "dumbbells"]
              : ["bodyweight"],
          weekdays: days === 2 ? [1, 4] : days === 3 ? [1, 3, 5] : [1, 2, 4, 5],
          startDate: "2026-10-12",
        });
        const plan = generatePlan(p);
        assert.equal(plan.length, 100);
        assert.equal(plan[99].kind, "finish");
        assert.ok(plan.every((d) => d.focus.length > 10));
        assert.equal(
          plan.filter((d) => d.kind === "workout").length,
          days * 14 + (days === 2 || days === 3 || days === 4 ? 1 : 0),
        );
        assert.ok(plan.some((d) => d.kind === "rest"));
        for (const d of plan)
          for (const e of d.exercises) {
            assert.ok(hasEquipment(e, p));
            assert.ok(e.instructions.length >= 3);
            for (const a of alternatives(e, p)) assert.ok(hasEquipment(a, p));
          }
        fingerprints.add(
          JSON.stringify(
            plan.map((d) => [d.kind, d.exercises.map((e) => [e.id, e.sets])]),
          ),
        );
      }
  assert.equal(fingerprints.size, 12);
});
test("calendar days respect Copenhagen dates across DST and day 101", () => {
  assert.equal(dayNumber("2026-03-28", new Date("2026-03-29T22:30:00Z")), 3);
  assert.equal(dayNumber("2026-10-24", new Date("2026-10-25T23:30:00Z")), 3);
  assert.equal(dayNumber("2026-01-01", new Date("2026-04-11T12:00:00Z")), 101);
  assert.equal(addDays("2026-01-01", 99), "2026-04-10");
  assert.equal(phase(14), "Fundament");
  assert.equal(phase(15), "Opbygning");
  assert.equal(phase(36), "Progression");
  assert.equal(phase(66), "Konsistens");
  assert.equal(phase(86), "Status & næste skridt");
});
test("38 recipes, documented nutrition, scaling and exclusions", () => {
  assert.equal(recipes.length, 38);
  for (const cat of ["breakfast", "lunch", "dinner", "snack"])
    assert.ok(recipes.filter((r) => r.category === cat).length >= 6);
  for (const r of recipes) {
    assert.ok(r.steps.length >= 3);
    assert.ok(nutrients(r).kcal > 0);
    const double = nutrients(r, 2);
    assert.ok(Math.abs(double.kcal - nutrients(r).kcal * 2) < 0.11);
    for (const i of r.ingredients)
      assert.ok(ingredients.find((f) => f.id === i.id)?.sourceId);
  }
  const p = ingredients.find((i) => i.id === "banana")!;
  assert.equal(p.per100g.kcal, 89);
  assert.equal(p.per100g.protein, 1.09);
  const vegetarian = recipes.filter((r) =>
    suitable(r, "vegetarian", ["milk"], 60),
  );
  assert.ok(vegetarian.length >= 5);
  assert.ok(
    vegetarian.every((r) =>
      r.ingredients.every(
        (i) =>
          ingredients.find((f) => f.id === i.id)!.vegetarian &&
          !ingredients.find((f) => f.id === i.id)!.allergens.includes("milk"),
      ),
    ),
  );
  const list = shoppingList([
    { recipe: recipes[0], servings: 2 },
    { recipe: recipes[0], servings: 1 },
  ]);
  assert.equal(list.find((i) => i.id === "oats")?.grams, 150);
  assert.equal(list.length, recipes[0].ingredients.length);
});
test("calculation is bounded, optional and not changed by one weight", () => {
  assert.equal(energy(defaults), null);
  const p = {
    ...defaults,
    nutrition: "calculated" as const,
    age: 30,
    height: 180,
    weight: 80,
    sex: "male" as const,
    activity: "moderate" as const,
    calculationSuitable: true,
    dataConsent: true,
  };
  const e = energy(p)!;
  assert.equal(e.resting, 1780);
  assert.equal(e.kcal, 2848);
  assert.equal(energy({ ...p, age: 70 })?.available, false);
  assert.equal(energy({ ...p, weight: 45 })?.available, false);
  assert.ok(Math.abs(energy({ ...p, goal: "fat-loss" })!.adjustment!) <= 300);
});
test("progression requires two successful sessions; consecutive chosen days use a split", () => {
  assert.ok(
    progression([[{ reps: 12, kg: 10, effort: 7 }]]).includes("mindst to"),
  );
  assert.ok(
    progression([
      [{ reps: 12, kg: 10, effort: 7 }],
      [{ reps: 12, kg: 10, effort: 7 }],
    ]).includes("mindste"),
  );
  assert.ok(
    progression([
      [{ reps: 12, kg: 10, effort: 7 }],
      [{ reps: 8, kg: 10, effort: 9 }],
    ]).includes("Behold"),
  );
  const consecutive = profileSchema.parse({
    ...defaults,
    weekdays: [1, 2, 3],
    startDate: "2026-10-12",
  });
  assert.deepEqual(
    generatePlan(consecutive)
      .filter((d) => d.kind === "workout")
      .slice(0, 3)
      .map((d) => d.split),
    ["upper", "lower", "upper"],
  );
});
