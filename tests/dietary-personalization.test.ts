import test from "node:test";
import assert from "node:assert/strict";
import { defaults, profileSchema } from "../lib/profile";
import { recipes, suitable } from "../lib/recipes";
import { makeMealDay, mealQuality } from "../lib/meal-plan";
const date="2026-10-12";
const calc={
  ...defaults,startDate:date,
  nutrition:"calculated" as const,
  age:30,height:180,weight:75,sex:"male" as const,
  activity:"moderate" as const,everydayActivity:"moving" as const,
  trainingActivity:"regular" as const,
  calculationSuitable:true,dataConsent:true,
  goal:"maintain" as const,
};
test("vegan and pescatarian diets persist as actual valid customer profiles",()=>{
 for(const diet of ["vegan","pescatarian"] as const){
  const profile=profileSchema.parse({...defaults,diet,startDate:date});
  assert.equal(profile.diet,diet);
 }
 assert.equal(suitable(recipes.find(r=>r.id==="egg-toast")!,"vegan",[],60),false);
 assert.equal(suitable(recipes.find(r=>r.id==="vegan-berry-tofu-bowl")!,"vegan",[],60),true);
 assert.equal(suitable(recipes.find(r=>r.id==="salmon-potato") || recipes.find(r=>r.ingredients.some(i=>i.id==="salmon"))!,"pescatarian",[],60),true);
});
test("vegan and pescatarian portion plans provide 3 real choices at each meal count",()=>{
 for(const diet of ["vegan","pescatarian"] as const){
  for(const mealCount of [2,3,4,5,6]){
   const p=profileSchema.parse({...defaults,startDate:date,diet,mealCount,nutrition:"portions"});
   const day=makeMealDay(p,date,recipes);
   assert.equal(day.slots.length,mealCount);
   for(const slot of day.slots){
    assert.equal(slot.options.length,3,`${diet} ${mealCount} meals needs 3 suitable options: ${slot.issue}`);
    assert.ok(slot.options.every(o=>suitable(o.recipe,diet,p.avoid,p.cookTime,!!p.halal)));
   }
  }
 }
});
test("calculated energy plans retain honest totals and flag unsatisfied vegan choices",()=>{
 for(const diet of ["vegan","pescatarian"] as const){
  for(const mealCount of [3,4,5]){
   const p=profileSchema.parse({...calc,diet,mealCount});
   const day=makeMealDay(p,date,recipes),quality=mealQuality(day);
   assert.equal(day.slots.length,mealCount);
   assert.ok(day.target && day.target>1500);
   assert.ok(day.slots.every(s=>s.options.length===3),`${diet} ${mealCount} meals missing options: ${day.slots.map(s=>s.issue).filter(Boolean).join("; ")}`);
   assert.ok(Math.abs(quality.total.kcal-day.target)/day.target<0.05,`${diet} day energy differs from selected target`);
   assert.ok(day.slots.every(s=>s.selected && suitable(s.selected.recipe,diet,[],60)));
  }
 }
});