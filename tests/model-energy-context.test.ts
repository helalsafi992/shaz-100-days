import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, profileSchema } from '../lib/profile';
import { modelEnergyContext } from '../lib/ai/plan-builder';
test('portion guidance is intentional and does not send calculator errors or product review flags to the model',()=>{
 const c=modelEnergyContext({...defaults,nutrition:'portions'});
 assert.equal(c.mode,'portion-guidance');
 assert.equal(c.calorieTarget,null);
 assert.ok(!JSON.stringify(c).includes('reviewRequired'));
 assert.ok(!JSON.stringify(c).includes('available'));
});
test('calorie context sends only permitted computed targets, not internal eligibility flags',()=>{
 const p=profileSchema.parse({...defaults,startDate:'2026-10-12',age:24,height:178,weight:65,sex:'male',activity:'moderate',everydayActivity:'seated',nutrition:'calculated',calculationSuitable:true,dataConsent:true,goal:'muscle',energyMethod:'weekly-v3',surplusKcal:250});
 const c=modelEnergyContext(p);
 assert.equal(c.mode,'calorie-target');
 assert.ok(typeof c.calorieTarget==='number'&&c.calorieTarget>1800);
 assert.ok(!JSON.stringify(c).includes('reviewRequired'));
 assert.throws(()=>modelEnergyContext({...p,dataConsent:false}));
});
