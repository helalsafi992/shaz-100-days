import { createHash, randomUUID } from 'node:crypto';
import { db } from '../db';
import { profile } from '../platform';
import { catalog } from '../content';
import { normalizeProfile,sessionProfile,localDate } from '../profile';
import { generatePlan,alternatives,type Exercise } from '../training';
import { makeMealDay,type MealDay } from '../meal-plan';
import { ingredients,type Recipe } from '../recipes';
import { matchesDiet } from '../dietary';
import { estimate } from '../nutrition';
import { weekProblems } from '../cardio';
import { HttpError,rate,seal,unseal } from '../security';
import { isolatedTest } from '../test-environment';
import { intakeSchema,intakeVersion,screenIntake,type Intake } from './intake';
import { fetchEvidence,evidenceVersion,type Evidence,type Topic } from './evidence';
import { openAIProposal,promptVersion,type CandidateSlot } from './planner';
export function aiConfiguration(){
  const ready=process.env.AI_PERSONALIZATION_ENABLED==='true' && !!process.env.OPENAI_API_KEY && !!process.env.OPENAI_MODEL;
  return {provider:'openai',configured:ready,mode:'preview-only',questionnaireVersion:intakeVersion,questionsApproved:process.env.AI_QUESTIONS_APPROVED==='true',privacyApproved:process.env.AI_PRIVACY_APPROVED==='true',clinicalApproval:false};
}
export function candidateBlueprint(v:Intake,exercises:Exercise[],recipes:Recipe[]) {
  const p=normalizeProfile(v.profile), plan=generatePlan(p,exercises), slots:CandidateSlot[]=[],seen=new Set<string>();
  for(const d of plan.slice(0,7).filter(d=>d.kind==='workout')){
    const weekday=new Date(d.date+'T12:00:00Z').getUTCDay(),local=sessionProfile(p,weekday);
    for(const e of d.exercises){const key=d.locationId+':'+e.pattern;if(seen.has(key))continue;seen.add(key);slots.push({slotId:'exercise-'+slots.length,kind:'exercise',context:`${local.place}; ${e.pattern}; ${d.minutes} minutes; ${e.sets} sets; ${e.min}-${e.max} reps`,options:[e,...alternatives(e,local,exercises)].filter((x,i,a)=>a.findIndex(o=>o.id===x.id)===i).map(o=>({id:o.id,name:o.name}))});}
  }
  const filteredRecipes=recipes.filter(r=>r.ingredients.every(i=>{const ingredient=ingredients.find(f=>f.id===i.id);return ingredient && matchesDiet(i.id,ingredient.vegetarian,v.dietPattern);}));
  const meal=makeMealDay(p,p.startDate,filteredRecipes);
  if(meal.issues.length || meal.slots.some(s=>s.options.length<3))throw new HttpError(409,'Madbiblioteket kan ikke levere tre egnede valg til alle måltider med disse indstillinger. AI må ikke tilsidesætte dine filtre.');
  for(const s of meal.slots)slots.push({slotId:s.id,kind:'meal',context:`Meal target ${s.target} kcal. All options have ingredient-calculated portions.`,options:s.options.map(o=>({id:o.recipe.id,name:o.recipe.name}))});
  if(slots.length>32)throw new HttpError(409,'Denne kombination kræver en mindre, afgrænset tilpasning.');return {slots,meal,plan};
}
function stable(v:unknown):string {if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+stable(x)).join(',')+'}';return JSON.stringify(v);}
const digest=(v:unknown)=>createHash('sha256').update(stable(v)).digest('hex');
async function pace(){
  const r=await db().query(`INSERT INTO shaz_external_pacing(service,next_at) VALUES('ncbi',clock_timestamp()+interval '550 milliseconds') ON CONFLICT(service) DO UPDATE SET next_at=GREATEST(shaz_external_pacing.next_at,clock_timestamp())+interval '550 milliseconds' RETURNING EXTRACT(epoch FROM (next_at-clock_timestamp()))*1000 AS wait`);
  const ms=Number(r.rows[0].wait);if(ms>6000)throw Error('EVIDENCE_BUSY');await new Promise(r=>setTimeout(r,Math.max(0,ms)));
}
async function evidence(topic:Topic){
  const hit=await db().query('SELECT data FROM shaz_evidence_cache WHERE topic=$1 AND expires_at>now()',[evidenceVersion+':'+topic]);if(hit.rowCount)return hit.rows[0].data as Evidence[];
  const records=await fetchEvidence(topic,{pace,key:process.env.NCBI_API_KEY,email:process.env.NCBI_TOOL_EMAIL});if(!records.length)throw Error('EVIDENCE_EMPTY');
  await db().query(`INSERT INTO shaz_evidence_cache(topic,data,expires_at) VALUES($1,$2,now()+interval '1 day') ON CONFLICT(topic) DO UPDATE SET data=excluded.data,expires_at=excluded.expires_at`,[evidenceVersion+':'+topic,JSON.stringify(records)]);return records;
}
export async function personalize(user:string,input:unknown,expectedProfileVersion:number){
  const v=intakeSchema.parse(input), screening=screenIntake(v),current=await profile(user);
  if(current.version!==expectedProfileVersion)throw new HttpError(409,'Din profil er ændret. Genindlæs svarene før du laver et nyt forslag.');
  if(!screening.automaticPlanAllowed)return {status:screening.status,screening,activePlanChanged:false,aiUsed:false};
  if(v.profile.pregnantOrBreastfeeding || v.profile.medicalNutrition || v.profile.eatingDisorderHistory)throw new HttpError(409,'Helbredsoplysningerne kræver en særskilt vurdering.');
  const config=aiConfiguration();if(!v.aiConsent)return {status:'ai_not_requested',aiUsed:false,activePlanChanged:false};
  if(!config.configured)throw new HttpError(503,'AI-integrationen er installeret, men er ikke aktiveret med en API-nøgle og model. Ingen ekstern forespørgsel er sendt.');
  if(!config.privacyApproved)throw new HttpError(503,'Databehandling hos AI-leverandøren er endnu ikke godkendt. Ingen personoplysninger sendes.');
  if(!isolatedTest() && (!config.questionsApproved || process.env.AI_CONTENT_APPROVED!=='true'))throw new HttpError(503,'Spørgsmål og AI-planregler er endnu ikke frigivet til kunder.');
  const calc=estimate(v.profile);if(v.profile.nutrition==='calculated' && (!calc.available || !calc.allowed))throw new HttpError(409,calc.available?calc.reason:calc.explanation);
  if(weekProblems(v.profile).length)throw new HttpError(409,'Træning og cardio passer ikke sikkert sammen med de valgte dage. Ret ugeplanen.');
  const ex=await catalog('exercise') as Exercise[],rs=await catalog('recipe') as Recipe[],blueprint=candidateBlueprint(v,ex,rs);
  const fingerprint=digest({v,profileVersion:current.version,promptVersion,evidenceVersion,model:process.env.OPENAI_MODEL,slots:blueprint.slots,exerciseVersions:ex.map(x=>[x.id,x.version]),recipeVersions:rs.map(x=>[x.id,x.version]),day:localDate()});
  await db().query('DELETE FROM shaz_ai_proposals WHERE user_id=$1 AND expires_at<now()',[user]);
  const existing=await db().query('SELECT status,encrypted_result FROM shaz_ai_proposals WHERE user_id=$1 AND fingerprint=$2 AND expires_at>now()',[user,fingerprint]);if(existing.rows[0]?.status==='ready')return {...JSON.parse(unseal(existing.rows[0].encrypted_result)),cached:true};
  const lease=randomUUID();
  const claimed=await db().query(`INSERT INTO shaz_ai_proposals(user_id,fingerprint,profile_version,status,lease_id,lease_until) VALUES($1,$2,$3,'running',$4,now()+interval '3 minutes') ON CONFLICT(user_id,fingerprint) DO UPDATE SET status='running',lease_id=excluded.lease_id,lease_until=excluded.lease_until WHERE shaz_ai_proposals.status='failed' OR shaz_ai_proposals.lease_until<now() AND shaz_ai_proposals.status='running' RETURNING fingerprint`,[user,fingerprint,current.version,lease]);
  if(!claimed.rowCount)throw new HttpError(409,'Et forslag med disse svar er allerede under behandling. Vent på det første svar.');
  try {
    await rate('ai:user:'+user,3,60);await rate('ai:global:'+localDate(),Math.max(1,Math.min(1000,Number.parseInt(process.env.AI_MAX_DAILY_CALLS||'100',10)||100)),1440);
    const topic:Topic=v.wishes.priority;const sources=await evidence(topic);
    const result=await openAIProposal(v,blueprint.slots,sources,{apiKey:process.env.OPENAI_API_KEY!,model:process.env.OPENAI_MODEL!});
    if((await profile(user)).version!==current.version)throw new HttpError(409,'Profilen blev ændret under beregningen. Forslaget er ikke gældende.');
    const chosenMeals:MealDay={...blueprint.meal,slots:blueprint.meal.slots.map(s=>({...s,selected:s.options.find(o=>o.recipe.id===result.proposal.choices.find(c=>c.slotId===s.id)?.selectedId)||s.selected}))};
    const out={status:'ready_for_review',aiUsed:true,activePlanChanged:false,cached:false,fingerprint,profileVersion:current.version,promptVersion,questionnaireVersion:intakeVersion,proposal:result.proposal,model:result.model,usage:result.usage,mealPreview:chosenMeals,sources:sources.map(({recordText,...meta})=>meta),clinicalApproval:false};
    const saved=await db().query(`UPDATE shaz_ai_proposals SET status='ready',encrypted_result=$1 WHERE user_id=$2 AND fingerprint=$3 AND lease_id=$4`,[seal(JSON.stringify(out)),user,fingerprint,lease]);
    if(!saved.rowCount)throw new HttpError(409,'Forslaget blev annulleret. Det er ikke gemt eller aktiveret.');return out;
  }catch(e){await db().query(`UPDATE shaz_ai_proposals SET status='failed',encrypted_result=NULL WHERE user_id=$1 AND fingerprint=$2 AND lease_id=$3`,[user,fingerprint,lease]);if(e instanceof HttpError)throw e;throw new HttpError(503,'AI- eller kildesøgningen kunne ikke valideres. Din eksisterende plan er uændret. Prøv senere.');}
}
