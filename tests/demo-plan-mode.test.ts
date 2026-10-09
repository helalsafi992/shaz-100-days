import test from 'node:test';
import assert from 'node:assert/strict';
import {directPlanPreview} from '../lib/plan-release-mode';
import {newAnswers,restoreAnswers,asDraft} from '../components/PersonalizationSteps';
import {defaults} from '../lib/profile';
function environment(values:Record<string,string|undefined>,check:()=>void){
 const keys=['APP_ENV','APP_URL','STRIPE_MODE','RAILWAY_PROJECT_ID','TEST_ACCESS_ENABLED','PLAN_DELIVERY_MODE'];
 const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{for(const k of keys){delete process.env[k];if(values[k]!==undefined)process.env[k]=values[k];}check();}
 finally{for(const k of keys){delete process.env[k];if(before[k]!==undefined)process.env[k]=before[k];}}
}
const staging={APP_ENV:'staging',APP_URL:'https://shaz-test-staging.up.railway.app',RAILWAY_PROJECT_ID:'6a019412-cb8a-4ac1-a8ae-a1c315f7b211',TEST_ACCESS_ENABLED:'true',STRIPE_MODE:'test'};
test('Existing isolated staging defaults to direct preview; review is a later explicit setting',()=>{
 environment(staging,()=>assert.equal(directPlanPreview(),true));
 environment({...staging,PLAN_DELIVERY_MODE:'coach-review'},()=>assert.equal(directPlanPreview(),false));
});
test('A demo setting never enables direct plan release on live payments or another project/origin',()=>{
 for(const changes of [{APP_ENV:'production'},{STRIPE_MODE:'live'},{RAILWAY_PROJECT_ID:'another-project'},{APP_URL:'https://shaz-production.up.railway.app'},{TEST_ACCESS_ENABLED:'false'}])
  environment({...staging,PLAN_DELIVERY_MODE:'direct-preview',...changes},()=>assert.equal(directPlanPreview(),false));
});
test('Local direct-delivery regression requires explicit test mode, loopback and no deployed project',()=>{
 const local={APP_ENV:'test',APP_URL:'http://localhost:3108',STRIPE_MODE:'test',PLAN_DELIVERY_MODE:'direct-preview'};
 environment(local,()=>assert.equal(directPlanPreview(),true));
 environment({...local,PLAN_DELIVERY_MODE:undefined},()=>assert.equal(directPlanPreview(),false));
 environment({...local,APP_URL:'https://example.com'},()=>assert.equal(directPlanPreview(),false));
 environment({...local,RAILWAY_PROJECT_ID:'anything'},()=>assert.equal(directPlanPreview(),false));
});
test('Prior explicit plan consent remains usable without showing the removed provider field',()=>{
 const a={...newAnswers(defaults),adult:true,processingConsent:true,aiConsent:true,planConsent:true};
 for(const version of ['coach-plan-v3','openai-plan-v2']as const){
  const saved={...asDraft(a,true),planConsentVersion:version};
  assert.equal(restoreAnswers(newAnswers(defaults),saved).planConsent,true);
  assert.equal(restoreAnswers(newAnswers(defaults),{...saved,aiConsent:false}).planConsent,false);
 }
 assert.equal(restoreAnswers(newAnswers(defaults),asDraft(newAnswers(defaults),true)).planConsent,false);
});
