"use client";
import {useEffect,useRef,useState} from 'react';
import type {Profile} from '@/lib/profile';
import {onboardingRequest} from '@/lib/onboarding-request';
import {asDraft,type WizardAnswers} from './PersonalizationSteps';
type Receipt={id:string;status:'awaiting_review';message:string};
export default function GeneratedPlanReview({profile,answers,expectedVersion,startConfirmed}:{profile:Profile;answers:WizardAnswers;onChange:(a:WizardAnswers)=>void;expectedVersion:number;startConfirmed:boolean}){
 const[configuration,setConfiguration]=useState<{enabled:boolean;reason:string|null}|null>(null),[status,setStatus]=useState('none'),[receipt,setReceipt]=useState<Receipt|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const signature=JSON.stringify({profile,answers}),version=useRef(signature);version.current=signature;
 useEffect(()=>{setReceipt(null);setStatus('none');setError('');},[signature]);
 async function refresh(restore=true){const d=await onboardingRequest<{configuration:{enabled:boolean;reason:string|null};status:string;result:Receipt|null}>('/api/ai/plan');setConfiguration(d.configuration);if(restore){setStatus(d.status);setReceipt(d.result);}}
 useEffect(()=>{void refresh(false).catch(()=>setError('Status kunne ikke hentes. Prøv igen.'));},[]);
 async function submit(){const current=version.current;setBusy(true);setError('');try{
  if(!answers.planConsent)throw Error('Gå tilbage til Dit mål og acceptér databehandlingen, før du sender dine valg.');
  const r=await onboardingRequest<Receipt>('/api/ai/plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate',profile,answers:asDraft(answers,true),expectedVersion})},{attempts:1});
  if(version.current!==current)throw Error('Du ændrede dine valg imens. Gennemgå dem før du sender igen.');setReceipt(r);setStatus(r.status);
 }catch(e){setError(e instanceof Error?e.message:'Dine valg kunne ikke sendes. Prøv igen.');}finally{setBusy(false);}}
 return <section className="generated-plan coach-client-flow"><h2>Din personlige plan</h2><p>Send dine valg til Shaz. Han gennemgår træningen og madplanen, før de bliver lagt ind i dit forløb.</p>
 {configuration&&!configuration.enabled&&<p role="status" className="p-notice">{configuration.reason}</p>}
 {status==='awaiting_review'||receipt?<section className="p-notice" role="status"><h3>Afventer Shaz’ gennemgang</h3><p>Dine valg er modtaget. Din nuværende plan og registreringer er ikke ændret.</p><button type="button" className="p-secondary" onClick={()=>void refresh().catch(()=>setError('Status kunne ikke opdateres.'))}>Opdatér status</button></section>:status==='committed'?<section className="p-notice" role="status"><h3>Din plan er klar</h3><a className="p-button" href="/app">Åbn mit forløb</a><button type="button" className="p-secondary" onClick={()=>{setStatus('none');setReceipt(null);}}>Send nye valg</button></section>:<button type="button" className="p-button" disabled={busy||!configuration?.enabled||!startConfirmed} onClick={submit}>{busy?'Sender dine valg…':'Send til godkendelse'}</button>}
 {busy&&<p role="status" className="p-note">Dine valg behandles. Planen udleveres først efter coachens godkendelse.</p>}
 {error&&<p className="p-error" role="alert">{error}</p>}
 <p className="p-note"><a href="/privacy" target="_blank" rel="noopener noreferrer">Sådan behandles dine oplysninger</a>. Ingen diagnose eller behandlingsgaranti.</p></section>;
}
