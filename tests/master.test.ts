import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  profileSchema,
  normalizeProfile,
  sessionProfile,
  dayNumber,
  addDays,
  type Profile,
} from "../lib/profile";
import { generatePlan, hasEquipment, alternatives } from "../lib/training";
import { generateCardio } from "../lib/cardio";
import { makeMealDay, mealShopping, mealQuality } from "../lib/meal-plan";
import { recipes, suitable } from "../lib/recipes";
import { activityForDate, activityCounts } from "../lib/activity";
import { shoppingGroups, displayMass } from "../lib/shopping";
import { batchPlan } from "../lib/meal-batch";
import { nutritionRule } from "../lib/nutrition";

export const hybrid: Profile = {
  ...defaults,
  startDate: "2026-10-12",
  place: "both",
  level: "intermediate",
  minutes: 45,
  locations: [
    {
      id: "home",
      name: "Mit homegym",
      kind: "home",
      equipment: ["bodyweight", "dumbbells", "band"],
    },
    {
      id: "gym",
      name: "Mit center",
      kind: "gym",
      equipment: [
        "bodyweight",
        "dumbbells",
        "cable",
        "leg-press",
        "chest-press",
      ],
    },
  ],
  schedule: [
    { weekday: 1, locationId: "gym", minutes: 45 },
    { weekday: 3, locationId: "home", minutes: 25 },
    { weekday: 5, locationId: "gym", minutes: 45 },
  ],
  cardio: {
    days: 1,
    weekdays: [0],
    forms: ["cycle"],
    equipment: ["bike"],
    minutes: 30,
    intensity: "easy",
    level: "intermediate",
  },
};
test("T01/T02 hybrid reference, home barbell, concrete equipment and legacy normalization", () => {
  const p = profileSchema.parse(hybrid),
    plan = generatePlan(p);
  for (const [weekday, location, minutes] of [
    [1, "gym", 45],
    [3, "home", 25],
    [5, "gym", 45],
  ] as const) {
    const d = plan.find((d) => new Date(d.date).getUTCDay() === weekday)!;
    assert.equal(d.locationId, location);
    assert.equal(d.minutes, minutes);
    for (const e of d.exercises) {
      assert.ok(hasEquipment(e, sessionProfile(p, weekday)));
      for (const a of alternatives(e, sessionProfile(p, weekday)))
        assert.ok(hasEquipment(a, sessionProfile(p, weekday)));
    }
  }
  const cardio = generateCardio(p);
  assert.equal(new Date(cardio[0].date).getUTCDay(), 0);
  assert.equal(cardio[0].selected.minutes, 30);
  const home = profileSchema.parse({
    ...defaults,
    startDate: hybrid.startDate,
    equipment: ["bodyweight", "barbell", "rack"],
  });
  assert.ok(
    generatePlan(home).some((d) =>
      d.exercises.some((e) => e.id === "barbell-squat"),
    ),
  );
  const normalized = normalizeProfile(home);
  assert.deepEqual(normalized.locations![0].equipment, home.equipment);
  assert.deepEqual(
    normalized.schedule!.map((s) => s.weekday),
    home.weekdays,
  );
});
test("T03 shorter hybrid session changes volume, not just a time label", () => {
  const before = generatePlan(hybrid),
    p = structuredClone(hybrid);
  p.schedule![1] = { weekday: 3, locationId: "gym", minutes: 20 };
  const after = generatePlan(p);
  assert.equal(before[2].exercises.length, 4);
  assert.equal(after[2].exercises.length, 3);
  assert.equal(after[2].locationId, "gym");
  assert.deepEqual(before[0], after[0]);
  assert.deepEqual(before[4], after[4]);
});
test("T04/T05 all frequencies and levels, consecutive days and legacy durations", () => {
  for (const level of ["beginner", "intermediate", "experienced"] as const)
    for (let days = 0; days <= 6; days++)
      for (const minutes of [20, 25, 30, 40, 45, 55, 60, 75]) {
        const input = {
          ...defaults,
          startDate: hybrid.startDate,
          days,
          weekdays: [1, 2, 3, 4, 5, 6].slice(0, days),
          level,
          minutes,
        };
        const parsed = profileSchema.safeParse(input);
        if (days >= 5) {
          assert.equal(parsed.success, false);
          continue;
        }
        assert.ok(parsed.success);
        const plan = generatePlan(parsed.data);
        assert.equal(plan.length, 100);
        assert.equal(
          plan.slice(0, 7).filter((d) => d.kind === "workout").length,
          days,
        );
        assert.equal(plan[99].kind, "finish");
      }
  const p = profileSchema.parse({
    ...defaults,
    startDate: "2026-10-11",
    days: 2,
    weekdays: [0, 1],
  });
  const plans = generatePlan(p);
  assert.equal(plans[0].split, "upper");
  assert.equal(plans[1].split, "lower");
});
test("M03/M08 vegetarian plus halal exclusions; household quantity never changes personal nutrition", () => {
  const p: Profile = {
    ...defaults,
    startDate: hybrid.startDate,
    diet: "vegetarian",
    halal: true,
    avoid: ["milk"],
    cookTime: 60,
    mealCount: 3,
  };
  const one = makeMealDay(p, p.startDate, recipes),
    two = makeMealDay({ ...p, householdSize: 2 }, p.startDate, recipes);
  assert.deepEqual(mealQuality(one).total, mealQuality(two).total);
  for (const s of two.slots)
    for (const o of s.options)
      assert.ok(suitable(o.recipe, "vegetarian", ["milk"], 60, true));
  const a = mealShopping([one]),
    b = mealShopping([two]);
  assert.ok(a.length);
  for (const item of a)
    assert.equal(b.find((i) => i.id === item.id)!.grams, item.grams * 2);
});
test("S03 program dates cover day 0,1,100,101, leap day and DST", () => {
  assert.equal(dayNumber("2028-02-28", new Date("2028-02-27T12:00:00Z")), 0);
  assert.equal(dayNumber("2028-02-28", new Date("2028-02-28T12:00:00Z")), 1);
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2028-02-28", 2), "2028-03-01");
  for (const start of [
    "2028-02-28",
    "2026-03-28",
    "2026-10-24",
    "2026-12-31",
  ]) {
    assert.equal(
      dayNumber(start, new Date(addDays(start, 99) + "T12:00:00Z")),
      100,
    );
    assert.equal(
      dayNumber(start, new Date(addDays(start, 100) + "T12:00:00Z")),
      101,
    );
  }
});
test("M10 grouped shopping preserves every selected ingredient once, quantity and weight basis", () => {
  const p = { ...defaults, startDate: hybrid.startDate, householdSize: 2 };
  const days = Array.from({ length: 14 }, (_, i) =>
    makeMealDay(p, addDays(p.startDate, i), recipes),
  );
  const grouped = shoppingGroups(days)
    .flatMap((g) => g.items)
    .sort((a, b) => a.id.localeCompare(b.id));
  const flat = mealShopping(days).sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(grouped, flat);
  assert.equal(new Set(grouped.map((i) => i.id)).size, grouped.length);
  assert.equal(displayMass(1250), "1,25 kg");
  assert.equal(displayMass(999), "999 g");
});
test("M08 batch allocation buys once on cooking day and never doubles personal nutrition", () => {
  const p = { ...defaults, householdSize: 2, startDate: hybrid.startDate };
  const first = makeMealDay(p, p.startDate, recipes),
    second = makeMealDay(p, addDays(p.startDate, 1), recipes);
  const b = batchPlan(
    p,
    first,
    second,
    first.slots[0].id,
    second.slots[0].id,
    recipes,
    nutritionRule,
    "fixture",
  );
  assert.deepEqual(mealQuality(b.first).total, mealQuality(first).total);
  const unlinked = [structuredClone(b.first), structuredClone(b.second)];
  for (const d of unlinked) for (const s of d.slots) delete s.batch;
  assert.deepEqual(mealShopping([b.first, b.second]), mealShopping(unlinked));
  const leftover = structuredClone(b.second);
  leftover.slots[0].selected = null;
  delete leftover.slots[0].batch;
  assert.deepEqual(mealShopping([b.second]), mealShopping([leftover]));
  for (const i of b.batch.ingredients)
    assert.equal(
      i.grams,
      ((b.first.slots[0].selected!.recipe.ingredients.find((v) => v.id === i.id)
        ?.grams || 0) +
        (b.second.slots[0].selected!.recipe.ingredients.find(
          (v) => v.id === i.id,
        )?.grams || 0)) *
        2,
    );
  assert.throws(
    () => makeMealDay(p, b.first.date, recipes, b.first),
    /MEAL_BATCH_LOCKED/,
  );
  assert.throws(() =>
    batchPlan(
      {
        ...p,
        avoid: [
          "milk",
          "gluten",
          "egg",
          "chickpeas",
          "beans",
          "tofu",
          "rice",
          "lentils",
        ],
      },
      first,
      second,
      first.slots[0].id,
      second.slots[0].id,
      recipes,
      nutritionRule,
      "fixture",
    ),
  );
});

test("T06 pause/restart preserves completed history and day 100, reduces actual volume without catch-up", async () => {
  const { scheduledStrength, scheduledCardio, easyRestartOn } =
    await import("../lib/schedule-breaks");
  const plans = generatePlan(hybrid),
    raw = plans.map((plan) => ({
      id: String(plan.day),
      scheduled_date: plan.date,
      status: plan.kind === "workout" ? "planned" : "rest",
      plan,
    }));
  const breaks = [
    {
      id: "pause",
      from_date: hybrid.startDate!,
      to_date: addDays(hybrid.startDate!, 3),
      restart: "easy" as const,
    },
  ];
  const before = JSON.stringify(raw),
    projected = raw.map((d) => scheduledStrength(d, breaks));
  assert.equal(projected.length, 100);
  assert.equal(projected[99].plan.kind, "finish");
  assert.equal(projected[0].status, "paused");
  assert.equal(projected[0].id, raw[0].id);
  const easy = projected.find((d) => d.plan.easyRestart)!;
  const original = raw.find((d) => d.id === easy.id)!;
  assert.ok(
    easy.plan.exercises.every(
      (e, i) => e.sets === Math.max(1, original.plan.exercises[i].sets - 1),
    ),
  );
  const completed = { ...raw[0], status: "completed" };
  assert.deepEqual(scheduledStrength(completed, breaks), completed);
  assert.equal(JSON.stringify(raw), before);
  assert.equal(easyRestartOn(addDays(breaks[0].to_date, 8), breaks), false);
  const stopped = [
    { ...breaks[0], restart_until: addDays(breaks[0].to_date, 2) },
  ];
  assert.equal(easyRestartOn(addDays(breaks[0].to_date, 3), stopped), false);
  assert.equal(easyRestartOn(addDays(breaks[0].to_date, 1), stopped), true);
  const cardio = generateCardio(hybrid).map((plan) => ({
    scheduled_date: plan.date,
    status: "planned",
    plan,
  }));
  const c = cardio.find((c) => easyRestartOn(c.scheduled_date, breaks))!;
  assert.ok(scheduledCardio(c, breaks).plan.selected.minutes <= 20);
  assert.ok(
    scheduledCardio(c, breaks).plan.options.every((o) => o.minutes <= 20),
  );
  const calendar = activityForDate(
    raw[0].scheduled_date,
    projected,
    [],
    [
      {
        weekday: new Date(raw[0].scheduled_date).getUTCDay(),
        name: "Sport",
        minutes: 45,
        hard: true,
      },
    ],
    breaks,
  );
  assert.equal(calendar.label, "Planlagt pause");
  assert.equal(calendar.hasActivity, false);
});

test("M08/M09 practical ingredient increments keep exact nutrients, whole-egg reference and frozen snapshots", async () => {
  const { portion, optionFor } = await import("../lib/meal-plan"),
    { nutrients } = await import("../lib/recipes"),
    { portionStep, portionMeasure } = await import("../lib/portion-policy");
  const recipe = recipes.find((r) =>
      r.ingredients.some((i) => i.id === "egg"),
    )!,
    before = JSON.stringify(recipe),
    o = portion(recipe, 1.37);
  for (const i of o.recipe.ingredients)
    assert.equal(i.grams % portionStep(i.id), 0);
  assert.deepEqual(o.totals, nutrients(o.recipe));
  assert.equal(JSON.stringify(recipe), before);
  assert.ok(portionMeasure("egg", 150)?.includes("3"));
  assert.equal(portionMeasure("bread", 150), null);
  assert.equal(optionFor(recipe, 20), null);
  assert.equal(optionFor(recipe, 20000), null);
  const snapshot = structuredClone(o);
  portion(recipe, 2);
  assert.deepEqual(snapshot, o);
  const custom = {
    ...recipe,
    ingredients: recipe.ingredients.map((i) => ({ ...i, stepGrams: 10 })),
  };
  assert.ok(
    portion(custom, 1.37).recipe.ingredients.every((i) => i.grams % 10 === 0),
  );
});
