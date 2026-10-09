"use client";
import {useEffect,useRef,useState} from "react";
import type {Profile} from "@/lib/profile";
import {weekdayNames} from "@/lib/profile";
import type {DayPlan} from "@/lib/training";
import type {MealDay} from "@/lib/meal-plan";
import type {CardioPlan} from "@/lib/cardio";
import {onboardingRequest} from "@/lib/onboarding-request";
import {asDraft,type WizardAnswers} from "./PersonalizationSteps";

type Plan={id:string;summary:string;sessions:DayPlan[];meals:MealDay[];cardio:CardioPlan[];injuryAdvice:string[];progression:string;evidenceAvailable:boolean;sources:{pmid:string;title:string;url:string}[]};
type Receipt={id:string;status:"awaiting_review";message:string};
type Config={enabled:boolean;reason:string|null;mode:"coach-review"|"generate-and-confirm"};
type StatusResponse={configuration:Config;status:string;result:Plan|Receipt|null};
function hasPlan(value:unknown):value is Plan {
 return !!value && typeof value==="object" && "sessions" in value && Array.isArray((value as Plan).sessions);
}
export default function GeneratedPlanReview({profile,answers,expectedVersion,startConfirmed}:{profile:Profile;answers:WizardAnswers;onChange:(a:WizardAnswers)=>void;expectedVersion:number;startConfirmed:boolean}){
 const[configuration,setConfiguration]=useState<Config|null>(null);
 const[status,setStatus]=useState("none");
 const[plan,setPlan]=useState<Plan|null>(null);
 const[receipt,setReceipt]=useState<Receipt|null>(null);
 const[busy,setBusy]=useState(false),[applying,setApplying]=useState(false),[error,setError]=useState("");
 const signature=JSON.stringify({profile,answers}),version=useRef(signature);version.current=signature;
 useEffect(()=>{setPlan(null);setReceipt(null);setStatus("none");setError("");},[signature]);
 async function refresh(){
  const response=await onboardingRequest<StatusResponse>("/api/ai/plan",{cache:"no-store"});
  setConfiguration(response.configuration);
  setStatus(response.status);
  setPlan(response.configuration.mode==="generate-and-confirm"&&hasPlan(response.result)?response.result:null);
  setReceipt(response.configuration.mode==="coach-review"&&response.result&&!hasPlan(response.result)?response.result as Receipt:null);
 }
 useEffect(()=>{let active=true;
  onboardingRequest<StatusResponse>("/api/ai/plan",{cache:"no-store"}).then(d=>{
   if(!active)return;
   setConfiguration(d.configuration);setStatus(d.status);
   if(d.configuration.mode==="generate-and-confirm"&&hasPlan(d.result))setPlan(d.result);
   if(d.configuration.mode==="coach-review"&&d.result&&!hasPlan(d.result))setReceipt(d.result as Receipt);
  }).catch(()=>{if(active)setError("Kunne ikke hente planstatus. Opdatér siden og prøv igen.");});
  return()=>{active=false};
 },[]);
 async function generate(){
  const current=version.current;setBusy(true);setError("");
  try{
   if(!answers.planConsent)throw Error("Gå tilbage til Dit mål og godkend databehandlingen, før planen laves.");
   if(!startConfirmed)throw Error("Bekræft din startdato for at fortsætte.");
   const response=await onboardingRequest<Plan|Receipt>("/api/ai/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"generate",profile,answers:asDraft(answers,true),expectedVersion})},{attempts:1});
   if(current!==version.current)throw Error("Du ændrede dine valg under beregningen. Lav planen igen.");
   if(configuration?.mode==="generate-and-confirm"){
    if(!hasPlan(response))throw Error("Planforslaget er ikke klar endnu. Tryk Prøv igen eller opdatér siden.");
    setPlan(response);setStatus("ready");
   }else{
    setReceipt(response as Receipt);setStatus("awaiting_review");
   }
  }catch(e){setError(e instanceof Error?e.message:"Planen kunne ikke laves. Dine valg er bevaret.");}
  finally{setBusy(false);}
 }
 async function apply(){
  if(!plan||busy||applying)return;
  setApplying(true);setError("");
  try{
   await onboardingRequest("/api/ai/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"apply",id:plan.id})},{attempts:1});
   window.location.assign("/app");
  }catch(e){setError(e instanceof Error?e.message:"Planen kunne ikke gemmes. Dine tidligere registreringer er bevaret.");setApplying(false);}
 }
 const coachMode=configuration ? configuration.mode!=="generate-and-confirm" : false;
 return <section className="generated-plan coach-client-flow" aria-label="Din personlige trænings- og madplan">
  <h2>Din personlige plan</h2>
  <p>{coachMode?"Dine valg sendes til Shaz, som gennemgår planen, før den udleveres.":"Din træning og madplan bliver tilpasset dine mål, træningsdage, udstyr, kostvalg og eventuelle skader. Du får planen vist, inden du vælger at bruge den."}</p>
  {configuration&&!configuration.enabled&&<p role="status" className="p-notice">{configuration.reason}</p>}
  {coachMode?(
   <>
    {status==="awaiting_review"||receipt?<div role="status" className="p-notice"><h3>Afventer Shaz’ gennemgang</h3><p>Dine valg er modtaget. Den nuværende plan og historik er uændret.</p><button type="button" className="p-secondary" disabled={busy} onClick={()=>void refresh().catch(()=>setError("Status kunne ikke opdateres."))}>Opdatér status</button></div>:status==="committed"?<div role="status" className="p-notice"><h3>Din plan er klar</h3><a href="/app" className="p-button">Åbn mit forløb</a><button type="button" className="p-secondary" onClick={()=>{setStatus("none");setReceipt(null);}}>Send nye valg</button></div>:<button type="button" className="p-button" disabled={busy||!configuration?.enabled||!startConfirmed} onClick={generate}>{busy?"Sender dine valg…":"Send til godkendelse"}</button>}
    {busy&&<p className="p-note" role="status">Dine valg behandles. Planen udleveres efter gennemgang.</p>}
   </>
  ):(
   <>
    {status==="committed"&&!plan?<div className="p-notice" role="status"><h3>Din plan er klar</h3><p>Den er gemt og kan bruges i dit forløb.</p><a href="/app" className="p-button">Åbn mit forløb</a><button type="button" className="p-secondary" onClick={()=>setStatus("none")}>Lav en ny plan</button></div>:null}
    {!plan&&status!=="committed"&&<button type="button" className="p-button" disabled={busy||!configuration?.enabled||!startConfirmed} onClick={generate}>{busy?"Vi sammensætter din plan…":"Lav min trænings- og madplan"}</button>}
    {busy&&<p className="p-note" role="status">Vi tilpasser øvelser, træningsmængde og måltider til dine valg. Lad siden være åben, mens planen laves.</p>}
    {plan&&<div className="generated-result">
      <h3>Din plan er klar til gennemgang</h3>
      <p>{plan.summary}</p>
      <details open>
       <summary>Træningsplan · {plan.sessions.length} styrkepas om ugen</summary>
       {plan.sessions.map(d=><section className="p-card" key={d.day}>
        <h3>{weekdayNames[new Date(d.date+"T12:00:00Z").getUTCDay()]} · {d.title}</h3>
        <p>{d.locationName} · {d.minutes} min.</p>
        {d.exercises.map(e=><div className="p-list-row" key={e.id}><span>{e.name}</span><strong>{e.sets} × {e.min}–{e.max}</strong></div>)}
       </section>)}
      </details>
      {plan.cardio.length>0&&<details><summary>Cardio · {plan.cardio.length} pas om ugen</summary>{plan.cardio.map(d=><p key={d.day}>{weekdayNames[new Date(d.date+"T12:00:00Z").getUTCDay()]}: {d.selected.title} · {d.selected.minutes} min.</p>)}</details>}
      <details open><summary>Madplan · 7 dages rotation</summary>{plan.meals.map((d,i)=><details key={d.date} open={i===0}><summary>Dag {i+1} · {d.target?d.target+" kcal":"Portionsvejledning"}</summary>{d.slots.map(slot=><div className="p-list-row" key={slot.id}><span>{slot.name}<strong>{slot.selected?.recipe.name||"Vælg opskrift"}</strong></span><span>{Math.round(slot.selected?.totals.kcal||0)} kcal</span></div>)}</details>)}</details>
      {plan.injuryAdvice.length>0&&<section className="p-notice"><h3>Hensyn til dine skader</h3>{plan.injuryAdvice.map((note,i)=><p key={i}>{note}</p>)}</section>}
      <details><summary>Progression og baggrund</summary><p>{plan.progression}</p>{plan.sources.map(source=><p key={source.pmid}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></p>)}{!plan.evidenceAvailable&&<p>Der kunne ikke verificeres eksterne kilder ved denne beregning.</p>}</details>
      <p className="p-note">Planen omfatter dine 100 dage. Tidligere registrerede pas og måltider bevares. Øvelser kan skiftes til egnede alternativer i træningsvisningen.</p>
      <button type="button" className="p-button" disabled={busy||applying||!startConfirmed} onClick={apply}>{applying?"Gemmer din plan…":"Brug min trænings- og madplan"}</button>
     </div>}
   </>
  )}
  {error&&<p className="p-error" role="alert">{error}</p>}
  <p className="p-note"><a href="/privacy" target="_blank" rel="noopener noreferrer">Sådan behandles dine oplysninger</a>. Din plan er ikke en diagnose eller garanti for genoptræning.</p>
 </section>;
}
