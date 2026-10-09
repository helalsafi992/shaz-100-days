import {z} from 'zod';
import {access} from '@/lib/auth';
import {requireTestDatabase,testGrant} from '@/lib/test-environment';
import {sameOrigin,body,rate,failure,HttpError} from '@/lib/security';
import {defaults,profileSchema,localDate} from '@/lib/profile';
import {recipes} from '@/lib/recipes';
import {exercises} from '@/lib/training';
import {wishesSchema,safetySchema,intakeVersion} from '@/lib/ai/intake';
import {intakeDraftSchema} from '@/lib/ai/intake-draft';
import {fetchEvidence} from '@/lib/ai/evidence';
import {buildCandidates,requestGenerated,compilePlan} from '@/lib/ai/plan-builder';
import {generatedConfiguration} from '@/lib/ai/generated-plan-store';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=120;
/** Synthetic upstream smoke test. No customer's profile, intake or active plan is read or modified. */
export async function POST(req:Request){try{
 sameOrigin(req);await requireTestDatabase();const s=await access(req.headers);if(!await testGrant(s.user.id))throw new HttpError(404,'Findes ikke.');
 z.object({confirm:z.literal(true)}).strict().parse(await body(req));if(!generatedConfiguration().enabled)throw new HttpError(503,'AI-plan er ikke aktiveret.');
 await rate('ai-probe:'+s.user.id,2,60);
 const p=profileSchema.parse({...defaults,startDate:localDate(),goal:'muscle',level:'beginner',days:2,weekdays:[1,4],minutes:40});
 const a=intakeDraftSchema.parse({version:intakeVersion,adult:true,processingConsent:true,aiConsent:true,conciseMode:true,planConsentVersion:'openai-plan-v2',injuryNote:'',wishes:{priority:'hypertrophy',focus:['whole-body'],target:{metric:'none',value:null,weeks:null},preferredExercises:[],ageBand:'18-39',recentTraining:'none',interruption:'none',sleep:'variable',barriers:[],foodBudget:'medium',foodVariety:'balanced',batchCooking:false},safety:{urgentSymptoms:'no',exertionalSymptoms:'no',medicalExerciseRestriction:'no',pregnancyOrPostpartum:'no',medicalDietNeeded:'no',calorieTrackingConcern:'no',severeFoodAllergy:'no',injury:{status:'none',areas:[],side:'not-applicable',pain:0,duration:'none',worsening:'no',dailyLimitation:'no',professionalAssessment:'none',triggers:[],afterReaction:'none',restrictions:[]}}});
 let sources:Awaited<ReturnType<typeof fetchEvidence>>=[];try{sources=await fetchEvidence('hypertrophy',{limit:2,pace:async()=>{await new Promise(r=>setTimeout(r,600));}});}catch{}
 const candidates=buildCandidates(p,a,exercises,recipes),result=await requestGenerated(candidates,a,sources,{apiKey:process.env.OPENAI_API_KEY!,model:process.env.OPENAI_MODEL!}),compiled=compilePlan(candidates,result.plan);
 return Response.json({ok:true,testOnly:true,realProviderCall:true,personalDataSent:false,activePlanChanged:false,model:result.model,usage:result.usage,summary:result.plan.summary,sessionCount:result.plan.sessions.length,mealChoices:result.plan.meals.length,programDays:compiled.strength.length,mealDays:compiled.meals.length,evidenceAvailable:!!sources.length,pmids:sources.map(s=>s.pmid)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error(JSON.stringify({event:'ai_probe_failed',category:e instanceof HttpError?'APP_'+e.status:e instanceof Error&&/^AI_|UPSTREAM_HTTP_/.test(e.message)?e.message:'VALIDATION_OR_NETWORK'}));return failure(e instanceof HttpError?e:new HttpError(503,'Den syntetiske AI-test fejlede. Ingen kundedata blev ændret.'));}}
