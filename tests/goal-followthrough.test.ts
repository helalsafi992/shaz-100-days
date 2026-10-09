import test from "node:test";
import assert from "node:assert/strict";
import { defaults, profileSchema } from "../lib/profile";
import { generatePlan } from "../lib/training";
import { summarizeGoal } from "../lib/goal-summary";
import { toCanonical, fromCanonical, goalUnits, measurableGoalError } from "../lib/goal-units";

test("kg/lbs and km/miles inputs use immutable canonical values", () => {
  assert.deepEqual(goalUnits("weight-kg"), ["kg", "lbs"]);
  assert.deepEqual(goalUnits("run-km"), ["km", "miles"]);
  assert.ok(Math.abs(toCanonical(220.462262, "lbs") - 100) < 0.001);
  assert.ok(Math.abs(fromCanonical(100, "lbs") - 220.462262) < 0.001);
  assert.ok(Math.abs(toCanonical(5, "miles") - 8.04672) < 0.000001);
  assert.ok(Math.abs(fromCanonical(8.04672, "miles") - 5) < 0.000001);
  assert.equal(measurableGoalError({ metric:"weight-kg",value:70,weeks:14,baseline:80,displayUnit:"km" }), "Enheden passer ikke til det valgte mål.");
  assert.equal(measurableGoalError({ metric:"weight-kg",value:70,weeks:14,baseline:80,displayUnit:"lbs" }), null);
});
test("weight goal uses real weigh-ins, not assumed goal completion", () => {
  const target = {metric:"weight-kg" as const,baseline:80,value:70,weeks:14,displayUnit:"kg" as const};
  assert.equal(summarizeGoal(target)?.completion, null);
  const result = summarizeGoal(target,{weights:[{date:"2026-10-01",kg:"79"},{date:"2026-10-09",kg:"75"}]});
  assert.equal(result?.completion, 50);
  assert.match(result!.observation!,/75 kg/);
  const pounds = summarizeGoal({...target,displayUnit:"lbs"},{weights:[{date:"2026-10-09",kg:"75"}]});
  assert.ok(pounds?.detail.includes("lbs"));
  assert.ok(pounds?.observation?.includes("lbs"));
});
test("strength goal uses only the chosen exercise with enough reps", () => {
  const target={metric:"exercise-kg" as const,value:30,baseline:20,weeks:14,exerciseId:"db-row",displayUnit:"kg" as const,reps:8};
  const result=summarizeGoal(target,{sets:[
    {exercise:"db-row",reps:4,kg:40},
    {exercise:"floor-press",reps:9,kg:50},
    {exercise:"db-row",reps:8,kg:25},
  ]});
  assert.equal(result?.completion, 50);
  assert.match(result!.observation!,/25 kg/);
});
test("run distance is never inferred from cardio duration", () => {
  const value=summarizeGoal({metric:"run-km",value:10,baseline:2,weeks:14,displayUnit:"miles"});
  assert.equal(value?.completion,null);
  assert.match(value!.observation!,/registrerer|ikke/);
});
test("preferred exercises are actually chosen when eligible, but never beat equipment/avoid rules", () => {
  const p=profileSchema.parse({...defaults,goal:"muscle",startDate:"2026-10-12",level:"beginner",exercisePreferred:["chair-squat","wall-push"],equipment:["bodyweight"],place:"home"});
  const sessions=generatePlan(p).filter(day=>day.kind==="workout");
  const ids=sessions.flatMap(day=>day.exercises.map(ex=>ex.id));
  assert.ok(ids.includes("chair-squat"));
  assert.ok(ids.includes("wall-push"));
  assert.ok(!ids.includes("goblet-squat"));
  const changed=profileSchema.parse({...p,exerciseAvoid:["chair-squat"],exercisePreferred:["chair-squat","wall-push"]});
  assert.ok(!generatePlan(changed).some(day=>day.exercises.some(ex=>ex.id==="chair-squat")));
  const wrongEquipment=profileSchema.parse({...p,exercisePreferred:["goblet-squat"],equipment:["bodyweight"]});
  assert.ok(!generatePlan(wrongEquipment).some(day=>day.exercises.some(ex=>ex.id==="goblet-squat")));
});
