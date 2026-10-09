import { questionnaire, questionnaireContractIssues, visibleQuestions } from '../lib/ai/questionnaire';
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../lib/profile';
import { intakeSchema,intakeVersion,screenIntake,modelContext } from '../lib/ai/intake';
import { pubmedQuery,fetchEvidence,boundedText,type Evidence } from '../lib/ai/evidence';
import { validateProposal,openAIProposal,type CandidateSlot } from '../lib/ai/planner';
import { matchesDiet } from '../lib/dietary';
const raw={version:intakeVersion,adult:true,profile:{...defaults,startDate:'2026-10-12'},dietPattern:'all',wishes:{priority:'hypertrophy',focus:['whole-body'],target:{metric:'none',value:null,weeks:null},ageBand:'18-39',recentTraining:'3-12-months',interruption:'none',sleep:'6-8',barriers:['time'],foodBudget:'medium',foodVariety:'balanced',batchCooking:true},safety:{urgentSymptoms:'no',exertionalSymptoms:'no',medicalExerciseRestriction:'no',pregnancyOrPostpartum:'no',medicalDietNeeded:'no',calorieTrackingConcern:'no',severeFoodAllergy:'no',injury:{status:'none',areas:[],side:'not-applicable',pain:0,duration:'none',worsening:'no',dailyLimitation:'no',professionalAssessment:'none',triggers:[],afterReaction:'none',restrictions:[]}},processingConsent:true,aiConsent:true};
const sample=()=>intakeSchema.parse(structuredClone(raw));
const slots:CandidateSlot[]=[{slotId:'exercise-0',kind:'exercise',context:'home, push',options:[{id:'wall-push',name:'Armbøjning mod væg'}]}];
const sources:Evidence[]=[{pmid:'123456',title:'Example study',year:'2025',journal:'Test journal',url:'https://pubmed.ncbi.nlm.nih.gov/123456/',recordText:'Resistance exercise improved strength in healthy adults. This does not establish the safety of specific movements after injury.',coverage:'citation-and-abstract',retrievedAt:'2026-10-09',reviewStatus:'unreviewed'}];
const proposal=()=>({summary:'Forslag til gennemgang.',choices:[{slotId:'exercise-0',selectedId:'wall-push',reason:'Passer til det tilgængelige udstyr.',pmids:['123456']}],evidenceNotes:[{pmid:'123456',quote:'Resistance exercise improved strength in healthy adults.',interpretation:'Generel støtte til styrketræning, ikke bevis for at denne øvelse er bedst.',applicability:'general-adults'}],limitations:['Abstract, ikke læst fuldtekst.']});
test('AI intake requires affirmative consent, full safety answers and adult scope',()=>{assert.equal(screenIntake(sample()).status,'eligible');assert.throws(()=>intakeSchema.parse({...raw,processingConsent:false}));assert.throws(()=>intakeSchema.parse({...raw,adult:false}));assert.throws(()=>intakeSchema.parse({...raw,profile:{...raw.profile,age:16}}));assert.throws(()=>intakeSchema.parse({...raw,extraUserId:'another-customer'}));});
test('current pain, surgery, worsening, uncertainty and restrictions never receive automated clearance',()=>{for(const field of ['urgentSymptoms','exertionalSymptoms','medicalExerciseRestriction','pregnancyOrPostpartum','medicalDietNeeded','calorieTrackingConcern','severeFoodAllergy'] as const){const v=sample();v.safety[field]='unsure';assert.equal(screenIntake(v).automaticPlanAllowed,false);}const v=sample();v.safety.injury={...v.safety.injury,status:'current',areas:['hip-groin'],pain:4,duration:'over-12-weeks',professionalAssessment:'assessed'};assert.equal(screenIntake(v).status,'needs_professional_review');v.safety.urgentSymptoms='yes';assert.equal(screenIntake(v).status,'stop');});
test('unknown and animal ingredients do not silently pass the vegan filter',()=>{for(const id of ['milk','egg','yogurt','salmon','tuna','chicken','unknown','bread'])assert.equal(matchesDiet(id,true,'vegan'),false);assert.equal(matchesDiet('tofu',true,'vegan'),true);assert.equal(matchesDiet('salmon',false,'pescatarian'),true);assert.equal(matchesDiet('chicken',false,'pescatarian'),false);});
test('provider context excludes identifiers, exact anthropometry and target weight',()=>{const v=sample();v.profile.age=31;v.profile.weight=70;v.profile.height=180;const s=JSON.stringify(modelContext(v));for(const key of ['height','weight','email','userId','name','injury'])assert.equal(s.includes('"'+key+'"'),false);});
test('proposal covers every slot once with known exercise IDs and supported citations',()=>{assert.ok(validateProposal(proposal(),slots,sources));const p=proposal();p.choices[0].selectedId='invented';assert.throws(()=>validateProposal(p,slots,sources));const q=proposal();q.choices[0].pmids=['999'];assert.throws(()=>validateProposal(q,slots,sources));const r=proposal();r.evidenceNotes[0].quote='This quote was invented by the model.';assert.throws(()=>validateProposal(r,slots,sources));const t=proposal();t.choices=[];assert.throws(()=>validateProposal(t,slots,sources));});
test('PubMed uses allowlisted non-personal queries and excludes retraction tags',()=>{assert.match(pubmedQuery('hip-fai'),/femoroacetabular/);assert.match(pubmedQuery('strength'),/retracted publication/);assert.throws(()=>pubmedQuery('test@example.com' as never));});
test('PubMed maps PMID metadata to abstracts without a full-text claim',async()=>{const calls:string[]=[];const mock=async(input:URL|RequestInfo)=>{const url=String(input);calls.push(url);if(url.includes('esearch'))return Response.json({esearchresult:{idlist:['123456']}});if(url.includes('esummary'))return Response.json({result:{'123456':{uid:'123456',title:'Example study',pubdate:'2025',source:'Journal'}}});return new Response('1. Journal 2025. Example study.\n\n'+sources[0].recordText);};const e=await fetchEvidence('strength',{fetcher:mock as typeof fetch});assert.equal(e.length,1);assert.equal(e[0].coverage,'citation-and-abstract');assert.equal(e[0].pmid,'123456');assert.equal(calls.length,3);});
test('evidence errors are not misreported as no studies; response size is bounded',async()=>{await assert.rejects(fetchEvidence('strength',{fetcher:(async()=>Response.json({error:'rate limit'})) as typeof fetch}));await assert.rejects(boundedText(new Response('123456'),3));});
test('OpenAI request is structured, stateless, bounded and has no browsing/write tools',async()=>{let payload:any;const fake=(async(_url:unknown,init:RequestInit)=>{payload=JSON.parse(String(init.body));return Response.json({status:'completed',model:'test-model',usage:{input_tokens:100,output_tokens:100},output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(proposal())}]}]});}) as typeof fetch;const v=sample();await openAIProposal(v,slots,sources,{apiKey:'fixture-not-a-real-key',model:'test-model',fetcher:fake});assert.equal(payload.store,false);assert.equal(payload.tools,undefined);assert.equal(payload.text.format.strict,true);assert.equal(payload.max_output_tokens,3500);v.aiConsent=false;await assert.rejects(openAIProposal(v,slots,sources,{apiKey:'fixture',model:'fixture',fetcher:fake}));});
test('provider refusal and truncation never become a valid plan',async()=>{const fake=(async()=>Response.json({status:'incomplete',output:[]})) as typeof fetch;await assert.rejects(openAIProposal(sample(),slots,sources,{apiKey:'fixture',model:'fixture',fetcher:fake}));});


test('Owner-review questionnaire is unique, ordered, and never displayed as an approved customer questionnaire',()=>{
 assert.equal(questionnaire.status,'owner-review');
 assert.deepEqual(questionnaireContractIssues(),[]);
 const all=questionnaire.groups.flatMap(g=>g.items);
 assert.ok(all.length>=38);
 for(const id of ['goal_main','training_place','equipment_home','equipment_gym','strength_days','strength_weekdays','session_schedule','injury_status','injury_triggers','diet_pattern','nutrition_method','deficit','ai_consent']) assert.ok(all.some(q=>q.id===id),id);
 const initial=visibleQuestions({});
 for(const id of ['equipment_home','equipment_gym','session_schedule','injury_area','deficit']) assert.ok(!initial.some(q=>q.id===id),id);
});

test('Conditional questions disclose exactly the relevant exercise, injury and calorie options',()=>{
 const ids=(answers:Parameters<typeof visibleQuestions>[0])=>visibleQuestions(answers).map(q=>q.id);
 assert.ok(ids({training_place:'home'}).includes('equipment_home'));
 assert.ok(!ids({training_place:'home'}).includes('equipment_gym'));
 assert.ok(ids({training_place:'both'}).includes('equipment_home'));
 assert.ok(ids({training_place:'both'}).includes('equipment_gym'));
 assert.ok(ids({strength_days:3}).includes('session_schedule'));
 assert.ok(!ids({strength_days:0}).includes('session_schedule'));
 assert.ok(ids({injury_status:'current'}).includes('injury_triggers'));
 assert.ok(!ids({injury_status:'none'}).includes('injury_triggers'));
 assert.ok(ids({nutrition_method:'calculated',goal_main:'fat-loss'}).includes('deficit'));
 assert.ok(!ids({nutrition_method:'portions',goal_main:'fat-loss'}).includes('deficit'));
 assert.ok(!ids({nutrition_method:'calculated',goal_main:'hypertrophy'}).includes('deficit'));
});
