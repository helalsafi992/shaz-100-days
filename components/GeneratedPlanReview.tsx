"use client";
import CoachPlanSubmission from './CoachPlanSubmission';
import {useEffect,useRef,useState} from 'react';
import type {Profile} from '@/lib/profile';
import {weekdayNames} from '@/lib/profile';
import type {DayPlan} from '@/lib/training';
import type {MealDay} from '@/lib/meal-plan';
import type {CardioPlan} from '@/lib/cardio';
import {onboardingRequest} from '@/lib/onboarding-request';
import {asDraft,type WizardAnswers} from './PersonalizationSteps';
type Configuration={enabled:boolean;reason:string|null;mode?:'generate-and-confirm'|'coach-review'};
type Plan={id:string;summary:string;sessions:DayPlan[];meals:MealDay[];cardio:CardioPlan[];injuryAdvice:string[];progression:string;evidenceAvailable:boolean;sources:{pmid:string;title:string;url:string}[]};
export default function GeneratedPlanReview({profile,answers,onChange,expectedVersion,startConfirmed}:{profile:Profile;answers:WizardAnswers;onChange:(a:WizardAnswers)=>void;expectedVersion:number;startConfirmed:boolean}){
 const[configuration,setConfiguration]=useState<Configuration|null>(null),[plan,setPlan]=useState<Plan|null>(null),[busy,setBusy]=useState(false),[applying,setApplying]=useState(false),[error,setError]=useState('');
 const signature=JSON.stringify({profile,answers}),version=useRef(signature);version.current=signature;
 useEffect(()=>{setPlan(null);setError('');},[signature]);
 useEffect(()=>{let active=true;onboardingRequest<{configuration:Configuration}>('/api/ai/plan').then(d=>{if(active)setConfiguration(d.configuration);}).catch(()=>{if(active)setConfiguration({enabled:false,reason:'Forbindelsen til planlægningen kunne ikke hentes. Genindlæs siden.'});});return()=>{active=false;};},[]);
 async function generate(){const current=version.current;setBusy(true);setError('');try{if(!answers.planConsent)throw Error('Gå tilbage til Dit mål, og acceptér databehandlingen, før din plan laves.');const result=await onboardingRequest<Plan>('/api/ai/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate',profile,answers:asDraft(answers,true),expectedVersion})},{attempts:1});if(version.current!==current)throw Error('Dine valg ændrede sig under beregningen. Lav planen igen.');if(!Array.isArray(result.sessions)||!Array.isArray(result.meals))throw Error('Planens status er ændret. Genindlæs siden.');setPlan(result);}catch(e){setError(e instanceof Error?e.message:'Planen kunne ikke laves. Prøv igen.');}finally{setBusy(false);}}
 async function apply(){if(!plan)return;setApplying(true);setError('');try{await onboardingRequest('/api/ai/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'apply',id:plan.id})},{attempts:1});window.location.assign('/app');}catch(e){setError(e instanceof Error?e.message:'Kunne ikke gemme planen. Dine gamle registreringer er bevaret.');setApplying(false);}}
 if(configuration?.mode==='coach-review'||(configuration&&configuration.mode===undefined))return <CoachPlanSubmission profile={profile} answers={answers} onChange={onChange} expectedVersion={expectedVersion} startConfirmed={startConfirmed}/>;
 return <section className="generated-plan"><h2>Din personlige plan</h2><p>Få en trænings- og madplan, der tager udgangspunkt i dine mål, din uge, dine kostvalg og eventuelle skader.</p>
 {configuration&&!configuration.enabled&&<p className="p-notice" role="status">{configuration.reason}</p>}
 {!plan&&<button type="button" className="p-button" disabled={busy||!configuration?.enabled||!startConfirmed} onClick={generate}>{busy?'Laver din plan…':'Lav min trænings- og madplan'}</button>}
 {busy&&<p className="p-note" role="status">Du ser planen først og vælger derefter, om du vil bruge den. Lad siden blive åben.</p>}
 {error&&<p className="p-error" role="alert">{error}</p>}
 {plan&&<div className="generated-result"><h3>Dit samlede forslag</h3><p>{plan.summary}</p>
 <details open><summary>Træningsplan · {plan.sessions.length} styrkepas om ugen</summary>{plan.sessions.map(d=><section key={d.day} className="p-card"><h3>{weekdayNames[new Date(d.date+'T12:00:00Z').getUTCDay()]} · {d.title}</h3><p>{d.locationName} · {d.minutes} min.</p>{d.exercises.map(e=><div className="p-list-row" key={e.id}><span>{e.name}</span><strong>{e.sets} × {e.min}–{e.max}</strong></div>)}</section>)}</details>
 {plan.cardio.length>0&&<details><summary>Kondition · {plan.cardio.length} pas om ugen</summary>{plan.cardio.map(d=><p key={d.day}>{weekdayNames[new Date(d.date+'T12:00:00Z').getUTCDay()]}: {d.selected.title} · {d.selected.minutes} min.</p>)}</details>}
 <details open><summary>Madplan · 7 dages rotation med tre valg pr. måltid</summary>{plan.meals.map((d,i)=><details key={d.date} open={i===0}><summary>Dag {i+1} · {d.target?`${d.target} kcal`:'Portionsvejledning'}</summary>{d.slots.map(s=><div className="p-list-row" key={s.id}><span>{s.name}<strong>{s.selected?.recipe.name}</strong></span><span>{Math.round(s.selected?.totals.kcal||0)} kcal</span></div>)}</details>)}</details>
 {plan.injuryAdvice.length>0&&<section className="p-notice"><h3>Hensyn til dine skader</h3>{plan.injuryAdvice.map((s,i)=><p key={i}>{s}</p>)}</section>}
 <details><summary>Progression og kilder</summary><p>{plan.progression}</p>{plan.sources.map(s=><p key={s.pmid}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a></p>)}{!plan.evidenceAvailable&&<p>Der kunne ikke hentes eksterne kilder i denne kørsel. Forslaget er derfor ikke kildeverificeret.</p>}</details>
 <p className="p-note">Planen gælder dine 100 dage. Allerede registrerede pas, spiste måltider og sammenkædet madlavning overskrives ikke.</p>
 <button type="button" className="p-button" disabled={busy||applying||!startConfirmed} onClick={apply}>{applying?'Gemmer din plan…':'Brug denne trænings- og madplan'}</button>
 </div>}</section>;
}
