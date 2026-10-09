import {randomUUID} from 'node:crypto';
import {db,schema,transaction,audit} from '../db';
import {hash,seal,unseal,HttpError,rate} from '../security';
import {profile as savedProfile} from '../platform';
import {profileSchema,normalizeProfile,localDate,addDays,type Profile} from '../profile';
import {estimate} from '../nutrition';
import {weekProblems} from '../cardio';
import {catalog} from '../content';
import type {Exercise} from '../training';
import type {Recipe} from '../recipes';
import {isolatedTest} from '../test-environment';
import {storedIntake,storeIntake} from './intake-store';
import {intakeDraftSchema,type IntakeDraft} from './intake-draft';
import {fetchEvidence,type Evidence} from './evidence';
import {buildCandidates,requestGenerated,compilePlan,planVersion,injuryPolicy,type AIPlan} from './plan-builder';

export function generatedConfiguration(){
 const enabled=process.env.AI_PLAN_ENABLED==='true'&&!!process.env.OPENAI_API_KEY&&!!process.env.OPENAI_MODEL;
 const release=isolatedTest()||(process.env.AI_PRIVACY_APPROVED==='true'&&process.env.AI_CONTENT_APPROVED==='true'&&process.env.AI_QUESTIONS_APPROVED==='true');
 return {enabled:enabled&&release,mode:'generate-and-confirm',provider:'OpenAI',reason:!enabled?'OpenAI-planlægning er ikke aktiveret i dette miljø.':!release?'Denne funktion er ikke frigivet til kunder.':null};
}
function canonical(v:unknown):string {if(Array.isArray(v))return'['+v.map(canonical).join(',')+']';if(v&&typeof v==='object')return'{'+Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>JSON.stringify(k)+':'+canonical(x)).join(',')+'}';return JSON.stringify(v);}
const digest=(v:unknown)=>hash(canonical(v));
const profileHash=(p:{version:number;start_date:string|null;data:Profile})=>digest({version:p.version,start:p.start_date,data:p.data});
async function evidence(topic:Parameters<typeof fetchEvidence>[0]){
 const key=planVersion+':'+topic;
 const old=await db().query('SELECT data FROM shaz_evidence_cache WHERE topic=$1 AND expires_at>now()',[key]);
 if(old.rowCount)return old.rows[0].data as Evidence[];
 const records=await fetchEvidence(topic,{limit:2,key:process.env.NCBI_API_KEY,pace:async()=>{
  const r=await db().query(`INSERT INTO shaz_external_pacing(service,next_at) VALUES('ncbi',clock_timestamp()+interval '550 milliseconds') ON CONFLICT(service) DO UPDATE SET next_at=GREATEST(shaz_external_pacing.next_at,clock_timestamp())+interval '550 milliseconds' RETURNING EXTRACT(epoch FROM(next_at-clock_timestamp()))*1000 AS wait`);
  const wait=Number(r.rows[0].wait);if(wait>8000)throw Error('EVIDENCE_BUSY');await new Promise(resolve=>setTimeout(resolve,Math.max(0,wait)));
 }});
 if(records.length)await db().query(`INSERT INTO shaz_evidence_cache(topic,data,expires_at) VALUES($1,$2,now()+interval '1 day') ON CONFLICT(topic) DO UPDATE SET data=excluded.data,expires_at=excluded.expires_at`,[key,JSON.stringify(records)]);
 return records;
}
export type GeneratedResult={id:string;profile:Profile;answers:IntakeDraft;contentVersions:string;baseHash:string;intakeHash:string;model:string;usage:{input:number;output:number};plan:AIPlan;sources:Omit<Evidence,'recordText'>[];evidenceAvailable:boolean;compiled:ReturnType<typeof compilePlan>};
const publicResult=(r:GeneratedResult)=>({id:r.id,summary:r.plan.summary,model:r.model,energy:estimate(r.profile),injuryAdvice:r.plan.injuryAdvice,progression:r.plan.progression,
 sources:r.sources,evidenceAvailable:r.evidenceAvailable,sessions:r.compiled.strength.filter(d=>d.kind==='workout').slice(0,r.profile.days),meals:r.compiled.meals.slice(0,7),cardio:r.compiled.cardio.filter(d=>d.day<=7),generatedBy:'OpenAI',activePlanChanged:false});

export async function createGeneratedPlan(user:string,rawProfile:unknown,rawAnswers:unknown,expectedVersion:number,deps?:{sources?:Evidence[];generator?:typeof requestGenerated}){
 await schema();await db().query("DELETE FROM shaz_generated_plans WHERE expires_at<now() AND status<>'committed'");if(!deps&&!generatedConfiguration().enabled)throw new HttpError(503,generatedConfiguration().reason||'AI er ikke aktiveret.');
 const answers=intakeDraftSchema.parse(rawAnswers);
 if(!answers.adult||!answers.processingConsent||!answers.aiConsent||answers.planConsentVersion!=='openai-plan-v2')throw new HttpError(400,'Accepter behandlingen hos OpenAI før modellen kontaktes.');
 if(!answers.conciseMode||!answers.safety)throw new HttpError(400,'Besvar spørgsmålet om skader først.');
 const old=await savedProfile(user),p=normalizeProfile(profileSchema.parse(rawProfile));
 if(old.version!==expectedVersion)throw new HttpError(409,'Profilen er ændret på en anden enhed. Genindlæs før du laver planen.');
 p.startDate=old.start_date||p.startDate;delete p.aiPlanId;
 if(localDate()>addDays(p.startDate,99)||(!old.start_date&&p.startDate<localDate()))throw new HttpError(409,'Vælg en gyldig startdato.');
 const earlier=await storedIntake(user);
 const important=['urgentSymptoms','exertionalSymptoms','medicalExerciseRestriction','pregnancyOrPostpartum','medicalDietNeeded','calorieTrackingConcern','severeFoodAllergy']as const;
 if(earlier?.safety)for(const key of important)if(earlier.safety[key]!=='no')answers.safety[key]=earlier.safety[key];
 for(const key of ['pregnantOrBreastfeeding','medicalNutrition','eatingDisorderHistory']as const)if(old.data[key])p[key]=true;
 injuryPolicy(answers,p);
 const energy=estimate(p);if(p.nutrition==='calculated'&&(!energy.available||!energy.allowed))throw new HttpError(400,energy.available?energy.reason:energy.explanation);
 const problems=weekProblems(p);if(problems.length)throw new HttpError(400,problems.join(' '));
 const xs=await catalog('exercise')as Exercise[],rs=await catalog('recipe')as Recipe[];
 const candidates=buildCandidates(p,answers,xs,rs),contentVersions=digest({xs,rs});
 const stored=await storeIntake(user,answers),intakeHash=digest(stored),baseHash=profileHash(old);
 const fingerprint=digest({p,answers,baseHash,contentVersions,planVersion,model:process.env.OPENAI_MODEL});
 const id=randomUUID();
 const existing=await db().query('SELECT * FROM shaz_generated_plans WHERE user_id=$1 AND fingerprint=$2',[user,fingerprint]);
 if(existing.rows[0]?.status==='ready'&&new Date(existing.rows[0].expires_at)>new Date())return publicResult(JSON.parse(unseal(existing.rows[0].encrypted_result)));
 if(existing.rows[0]?.status==='running'&&Date.now()-new Date(existing.rows[0].created_at).getTime()<150000)throw new HttpError(409,'OpenAI arbejder allerede på disse svar. Vent og tryk Hent seneste forslag.');
 await rate('generated:user:'+user,5,60);await rate('generated:day:'+localDate(),Number(process.env.AI_MAX_DAILY_CALLS||100),1440);
 const claimed=await db().query(`INSERT INTO shaz_generated_plans(id,user_id,fingerprint,base_hash,intake_hash,status) VALUES($1,$2,$3,$4,$5,'running') ON CONFLICT(user_id,fingerprint) DO UPDATE SET id=$1,status='running',encrypted_result=NULL,created_at=now(),expires_at=now()+interval '24 hours' WHERE shaz_generated_plans.status='failed' OR shaz_generated_plans.expires_at<now() OR shaz_generated_plans.status='running' AND shaz_generated_plans.created_at<now()-interval '150 seconds' RETURNING id`,[id,user,fingerprint,baseHash,intakeHash]);
 if(!claimed.rowCount)throw new HttpError(409,'Der findes allerede en plan for disse svar.');
 try{
  let sources:Evidence[]=deps?.sources||[];
  if(!deps?.sources)try{sources=await evidence(answers.wishes.priority);}catch{ /* Missing sources are surfaced, not fabricated. */ }
  const result=await(deps?.generator||requestGenerated)(candidates,answers,sources,{apiKey:process.env.OPENAI_API_KEY!,model:process.env.OPENAI_MODEL!});
  const compiled=compilePlan(candidates,result.plan);
  if(profileHash(await savedProfile(user))!==baseHash||digest(await storedIntake(user))!==intakeHash)throw new HttpError(409,'Svarene ændrede sig under beregningen. Din aktive plan er uændret.');
  const record:GeneratedResult={id,profile:p,answers,baseHash,intakeHash,contentVersions,compiled,...result,sources:sources.map(({recordText,...s})=>s),evidenceAvailable:!!sources.length};
  await db().query("UPDATE shaz_generated_plans SET status='ready',encrypted_result=$1 WHERE id=$2 AND user_id=$3 AND status='running'",[seal(JSON.stringify(record)),id,user]);
  return publicResult(record);
 }catch(e){await db().query("UPDATE shaz_generated_plans SET status='failed',encrypted_result=NULL WHERE id=$1 AND user_id=$2",[id,user]);if(e instanceof HttpError)throw e;
  console.error(JSON.stringify({event:'ai_plan_generation_failed',category:e instanceof Error?/^AI_|UPSTREAM_HTTP_/.test(e.message)?e.message.slice(0,80):'VALIDATION_OR_NETWORK':'UNKNOWN'}));
  throw new HttpError(503,'OpenAI-planen kunne ikke valideres. Der er ikke ændret noget. Prøv igen eller kontrollér AI-forbindelsen.');}
}
export async function latestGenerated(user:string){await schema();const row=(await db().query("SELECT status,encrypted_result FROM shaz_generated_plans WHERE user_id=$1 AND expires_at>now() ORDER BY created_at DESC LIMIT 1",[user])).rows[0];return{configuration:generatedConfiguration(),status:row?.status||'none',result:row?.status==='ready'?publicResult(JSON.parse(unseal(row.encrypted_result))):null};}

export async function applyGeneratedPlan(user:string,id:string){
 await schema();if(!generatedConfiguration().enabled&&process.env.APP_ENV!=='test')throw new HttpError(503,'Planaktivering er ikke frigivet i dette miljø.');
 const catalogVersion=digest({xs:await catalog('exercise'),rs:await catalog('recipe')});
 const result=await transaction(async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[user]);
  const row=(await c.query('SELECT * FROM shaz_generated_plans WHERE user_id=$1 AND id=$2 FOR UPDATE',[user,id])).rows[0];
  if(!row)throw new HttpError(404,'Planen findes ikke.');
  if(row.status==='committed')return{ok:true,alreadyApplied:true};
  if(row.status!=='ready'||new Date(row.expires_at)<new Date())throw new HttpError(409,'Planforslaget er udløbet eller ikke klar. Lav det igen.');
  const r=JSON.parse(unseal(row.encrypted_result))as GeneratedResult;
  const current=(await c.query('SELECT *,start_date::text FROM shaz_profile WHERE user_id=$1 FOR UPDATE',[user])).rows[0];
  if(!current||profileHash({...current,data:normalizeProfile(current.data)})!==r.baseHash)throw new HttpError(409,'Profilen er ændret. Lav et nyt forslag.');
  const intake=(await c.query('SELECT encrypted_answers FROM shaz_ai_intake WHERE user_id=$1 FOR UPDATE',[user])).rows[0];
  if(!intake||digest(JSON.parse(unseal(intake.encrypted_answers)))!==r.intakeHash||catalogVersion!==r.contentVersions)throw new HttpError(409,'Svar eller indhold er ændret. Lav et nyt forslag.');
  injuryPolicy(r.answers,r.profile);
  const today=localDate(),p={...r.profile,aiPlanId:id};
  const strength=r.compiled.strength.filter(d=>d.date>=today).map(d=>({id:randomUUID(),day:d.day,date:d.date,plan:{...d,aiPlanId:id},status:d.kind==='rest'?'rest':'planned'}));
  await c.query(`INSERT INTO shaz_days(id,user_id,day,scheduled_date,plan,status)
   SELECT x.id,$1,x.day,x.date,x.plan,x.status FROM jsonb_to_recordset($2::jsonb) AS x(id text,day integer,date date,plan jsonb,status text)
   ON CONFLICT(user_id,day) DO UPDATE SET plan=excluded.plan,status=excluded.status,revision=shaz_days.revision+1,updated_at=now()
   WHERE shaz_days.status IN ('planned','rest') AND shaz_days.log='{}'::jsonb AND shaz_days.scheduled_date=excluded.scheduled_date
   AND NOT EXISTS(SELECT 1 FROM shaz_workout_drafts w WHERE w.day_id=shaz_days.id AND EXISTS(SELECT 1 FROM jsonb_array_elements(w.data->'sets') s WHERE (s->>'reps')::numeric>0))`,[user,JSON.stringify(strength)]);
  await c.query("UPDATE shaz_cardio SET status='removed',revision=revision+1 WHERE user_id=$1 AND scheduled_date>=$2 AND status='planned' AND log='{}'::jsonb",[user,today]);
  const cardio=r.compiled.cardio.filter(d=>d.date>=today).map(d=>({id:randomUUID(),day:d.day,date:d.date,plan:{...d,aiPlanId:id}}));
  if(cardio.length)await c.query(`INSERT INTO shaz_cardio(id,user_id,day,scheduled_date,plan)
   SELECT x.id,$1,x.day,x.date,x.plan FROM jsonb_to_recordset($2::jsonb) AS x(id text,day integer,date date,plan jsonb)
   ON CONFLICT(user_id,day) DO UPDATE SET plan=excluded.plan,status='planned',revision=shaz_cardio.revision+1
   WHERE shaz_cardio.status IN ('planned','removed') AND shaz_cardio.log='{}'::jsonb AND shaz_cardio.scheduled_date=excluded.scheduled_date`,[user,JSON.stringify(cardio)]);
  const meals=r.compiled.meals.filter(d=>d.date>=today).map(d=>({date:d.date,data:{...d,aiPlanId:id}}));
  await c.query(`INSERT INTO shaz_meal_days(user_id,date,data)
   SELECT $1,x.date,x.data FROM jsonb_to_recordset($2::jsonb) AS x(date date,data jsonb)
   ON CONFLICT(user_id,date) DO UPDATE SET data=excluded.data,version=shaz_meal_days.version+1
   WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(shaz_meal_days.data->'slots') s WHERE s->>'status'<>'planned' OR s ? 'batch')`,[user,JSON.stringify(meals)]);
  await c.query('UPDATE shaz_profile SET data=$2,start_date=COALESCE(start_date,$3),step=7,version=version+1,updated_at=now() WHERE user_id=$1',[user,JSON.stringify(p),p.startDate]);
  await c.query("UPDATE shaz_generated_plans SET status='committed',committed_at=now(),encrypted_result=NULL WHERE user_id=$1 AND id=$2",[user,id]);
  return{ok:true,alreadyApplied:false};
 });
 await audit(user,'ai_plan_applied',id,{alreadyApplied:result.alreadyApplied});return result;
}
