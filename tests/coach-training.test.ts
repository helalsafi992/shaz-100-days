import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,profileSchema} from '../lib/profile';
import {generateCardio,weekProblems,cardioAdvice} from '../lib/cardio';
import {exercises,generatePlan} from '../lib/training';
import {replacementOptions,withSwapGroups} from '../lib/exercise-replacements';
const profile=profileSchema.parse({...defaults,startDate:'2026-10-12',cardio:{days:3,weekdays:[1,3,5],minutes:90,forms:['cycle'],equipment:['bike'],level:'beginner',intensity:'moderate'}});
test('Selected ninety-minute cardio is allowed on strength days without an invisible beginner clamp',()=>{
 assert.deepEqual(weekProblems(profile),[]);
 assert.ok(generateCardio(profile).every(d=>d.options.every(o=>o.minutes===90)));
 assert.ok(cardioAdvice(profile).length>0);
 const seven=profileSchema.parse({...profile,cardio:{...profile.cardio,days:7,weekdays:[0,1,2,3,4,5,6]}});
 assert.deepEqual(weekProblems(seven),[]);
});
test('Technical input errors and unavailable equipment are still rejected',()=>{
 assert.throws(()=>profileSchema.parse({...profile,cardio:{...profile.cardio,minutes:0}}));
 assert.ok(weekProblems({...profile,cardio:{...profile.cardio!,equipment:['outdoors']}}).length);
});
test('Three replacements are distinct, same group/unit and available on the current location',()=>{
 const p=profileSchema.parse({...defaults,startDate:'2026-10-12',place:'gym',equipment:['bodyweight','dumbbells','bench','cable','machines','barbell','rack']});
 for(const id of ['floor-press','wall-slide','goblet-squat','barbell-rdl','calf']){
  const old=exercises.find(e=>e.id===id);assert.ok(old,id);
  const options=replacementOptions(old,p,exercises);
  assert.equal(options.length,3,id);
  assert.equal(new Set(options.map(e=>e.id)).size,3);
  assert.ok(options.every(e=>e.id!==old.id&&e.pattern===old.pattern&&(e.unit||'reps')===(old.unit||'reps')));
 }
 const old=exercises.find(e=>e.id==='floor-press')!;
 assert.ok(!replacementOptions(old,{...p,equipment:['bodyweight']},exercises).some(e=>e.equipment.includes('cable')));
 assert.deepEqual(replacementOptions(old,p,exercises,{exercises:[],excludedPatterns:['push']}),[]);
});
test('Coach-reviewed replacement groups constrain subsequent swaps and exclude duplicates',()=>{
 const p=profileSchema.parse({...defaults,startDate:'2026-10-12',place:'gym',equipment:['bodyweight','dumbbells','bench','cable','machines','barbell','rack']});
 const day=withSwapGroups(generatePlan(p).find(d=>d.kind==='workout')!,p,exercises),old=day.exercises[0];
 const opts=replacementOptions(old,p,exercises,day);
 assert.ok(opts.every(o=>day.swapGroups![old.id].includes(o.id)));
 const occupied={...day,exercises:[...day.exercises,{...old,...opts[0]}]};
 assert.ok(!replacementOptions(old,p,exercises,occupied).some(o=>o.id===opts[0].id));
});
