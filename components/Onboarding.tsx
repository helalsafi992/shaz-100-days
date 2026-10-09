"use client";
import {useEffect,useState} from 'react';
import NumberInput from './forms/NumberInput';
import GeneratedPlanReview from './GeneratedPlanReview';
import {defaults,labels,energy,type Profile,localDate,normalizeProfile,weekdayNames} from '@/lib/profile';
import {exercises} from '@/lib/training';
import {activitySettings} from '@/lib/activity-settings';
import {deficitLevels} from '@/lib/nutrition';
import {intakeVersion} from '@/lib/ai/intake';
import {onboardingRequest} from '@/lib/onboarding-request';
import type {IntakeDraft} from '@/lib/ai/intake-draft';
import TrainingSettings from './TrainingSettings';
import FoodExclusions from './FoodExclusions';
import {GoalQuestions,SafetyQuestions,PreferredExerciseQuestions,newAnswers,restoreAnswers,asDraft,stageError,type WizardAnswers} from './PersonalizationSteps';
const titles=['Dit mål','Din uge','Skader','Din mad','Din plan'],storedSteps=[0,1,1,4,7];
export default function Onboarding({initial,initialStep=0,initialVersion=1,editing=false}:{initial:Profile;initialStep?:number;initialVersion?:number;editing?:boolean}){
 const[p,setP]=useState<Profile>({...defaults,...initial,...activitySettings(initial),energyMethod:'weekly-v3',surplusKcal:initial.surplusKcal||250,everydayActivity:initial.everydayActivity,personalizationVersion:intakeVersion});
 const[step,setStep]=useState(initialStep>=7?4:initialStep>=4?3:initialStep>=1?1:0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[startConfirmed,setStartConfirmed]=useState(editing);
 const[answers,setAnswers]=useState<WizardAnswers>(()=>newAnswers(initial)),[intakeLoaded,setIntakeLoaded]=useState(false),[intakeLoading,setIntakeLoading]=useState(false),[intakeLoadError,setIntakeLoadError]=useState('');
 useEffect(()=>{setError('');},[p,answers]);
 useEffect(()=>{document.querySelector('.onboard-shell')?.scrollIntoView({block:'start'});},[step]);
 async function loadSavedIntake(active:()=>boolean=()=>true){setIntakeLoading(true);setIntakeLoadError('');try{const d=await onboardingRequest<{draft:IntakeDraft|null}>('/api/ai/intake',{cache:'no-store'});if(!active())return;if(d.draft)setAnswers(a=>restoreAnswers(a,d.draft!));setIntakeLoaded(true);}catch{if(active())setIntakeLoadError('Kunne ikke hente dine gemte svar. Kontrollér forbindelsen, og prøv igen. Vi har ikke ændret din plan.');}finally{if(active())setIntakeLoading(false);}}
 useEffect(()=>{let alive=true;void loadSavedIntake(()=>alive);return()=>{alive=false;};},[]);
 useEffect(()=>{if(intakeLoaded||intakeLoading||!intakeLoadError)return;const recover=()=>{void loadSavedIntake();};window.addEventListener('online',recover);return()=>window.removeEventListener('online',recover);},[intakeLoaded,intakeLoading,intakeLoadError]);
 async function persistIntake(includeSafety:boolean){await onboardingRequest<{ok:boolean}>('/api/ai/intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(asDraft(answers,includeSafety))});}
 function field<K extends keyof Profile>(k:K,v:Profile[K]){setP(x=>({...x,...(k==='nutrition'&&v==='calculated'?{activity:x.activity||'moderate',energyMethod:'weekly-v3' as const}:{}),[k]:v}));}
 async function save(next:number){
  const invalid=Array.from(document.querySelectorAll<HTMLInputElement>('main.onboarding input')).find(el=>!el.checkValidity());if(invalid){invalid.reportValidity();invalid.focus();return;}
  if(step===3&&p.nutrition==='calculated'&&!p.everydayActivity){setError('Vælg hvor aktiv du er i hverdagen.');return;}
  setBusy(true);setError('');try{if(!intakeLoaded)throw Error('Vent mens dine svar indlæses.');const problem=stageError(step,answers)||(step>=3?stageError(2,answers):null);if(problem)throw Error(problem);
   if([0,2,3].includes(step))await persistIntake(step>=2);
   if(!editing)await onboardingRequest('/api/platform/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:p,step:storedSteps[next]})});
   setStep(next);
  }catch(e){setError(e instanceof Error?e.message:'Kunne ikke gemme. Dine valg er bevaret.');}finally{setBusy(false);}
 }
 function choices<K extends keyof Profile>(key:K,options:Profile[K][],names?:string[]){return <div className="p-choices">{options.map((v,i)=><button type="button" key={String(v)} aria-pressed={p[key]===v} className={p[key]===v?'chosen':''} onClick={()=>field(key,v)}>{names?.[i]||labels[String(v)]||String(v)}</button>)}</div>;}
 const calculation=energy(p),normal=normalizeProfile(p);
 return <main className="portal onboarding" data-profile-version={initialVersion} data-intake-loaded={intakeLoaded}>
 <header className="p-top onboard-topbar"><a className="logo" href="/">SHAZ</a><strong className="onboard-header-title">{editing?'Tilpas plan':'Opret din plan'}</strong><a className="onboard-back-link" href="/app">Til mit forløb</a></header>
 <section className="onboard-shell"><div className="onboard-progress"><span>{editing?'TILPAS DIN PLAN':'DIT UDGANGSPUNKT'}</span><span>{step===4?'OPSUMMERING':`DEL ${step+1} AF 4`}</span></div><div className="p-track"><i style={{width:`${((step+1)/5)*100}%`}}/></div><h1>{editing?'Tilpas din plan':titles[step]}</h1>{editing&&<h2 className="onboard-step-heading">{titles[step]}</h2>}<p className="p-muted">{editing?'Vi gemmer dine svar som kladde. Den aktive plan ændres først, når du bekræfter. Din historik bevares.':'Svarene gemmes, når du fortsætter. Du kan ændre dine valg senere.'}</p>
 {!intakeLoaded&&<section className="p-card onboard-loading" role="status"><p>{intakeLoadError||'Henter dine gemte svar…'}</p>{intakeLoadError&&<button type="button" className="p-secondary" disabled={intakeLoading} onClick={()=>void loadSavedIntake()}>Prøv igen</button>}</section>}
 {intakeLoaded&&<>
 {step===0&&<GoalQuestions currentWeight={p.weight} value={answers} onChange={setAnswers} onProfileGoal={(goal,level)=>setP(x=>({...x,goal,...(level?{level}:{})}))}/>}
 {step===1&&<><TrainingSettings value={p} onChange={setP}/><PreferredExerciseQuestions value={answers} onChange={setAnswers}/><details className="onboard-disclosure"><summary>Øvelser jeg helst vil undgå ({p.exerciseAvoid?.length||0} valgt)</summary><p className="p-note">Smerter og skader kommer i næste trin. Her vælger du kun efter præference.</p>{exercises.map(e=><label key={e.id} className="p-check"><input type="checkbox" checked={(p.exerciseAvoid||[]).includes(e.id)} onChange={ev=>field('exerciseAvoid',ev.target.checked?[...(p.exerciseAvoid||[]),e.id]:(p.exerciseAvoid||[]).filter(x=>x!==e.id))}/>{e.name}</label>)}</details></>}
 {step===2&&<SafetyQuestions value={answers} onChange={setAnswers}/>}
 {step===3&&<><h2>Hvordan spiser du?</h2>{choices('diet',['all','vegetarian','vegan','pescatarian'])}<label className="p-check"><input type="checkbox" checked={p.halal||p.diet==='halal'} onChange={e=>field('halal',e.target.checked)}/>Halal-egnede ingredienser</label>
 <div className="p-fields"><label>Måltider pr. dag<select value={p.mealCount||4} onChange={e=>setP(x=>({...x,mealCount:Number(e.target.value),mealNames:undefined,mealTimes:undefined}))}>{[2,3,4,5,6].map(n=><option key={n} value={n}>{n} måltider</option>)}</select></label><label>Tid til madlavning<select value={p.cookTime} onChange={e=>field('cookTime',Number(e.target.value)as Profile['cookTime'])}>{[15,30,60].map(n=><option key={n} value={n}>Op til {n} minutter</option>)}</select></label></div>
 <FoodExclusions value={p.avoid} onChange={avoid=>field('avoid',avoid)}/><h2>Hvordan vil du følge kosten?</h2>{choices('nutrition',['portions','calculated'],['Portioner – uden at tælle kalorier','Et beregnet kaloriemål'])}
 {p.nutrition==='portions'?<p className="p-note">Du får opskrifter, portionsforslag og indkøbsliste. Du behøver ikke oplyse vægt eller tælle kalorier.</p>:<><div className="p-fields">{(['age','height','weight']as const).map((k,i)=><label key={k}>{['Alder (år)','Højde (cm)','Vægt (kg)'][i]}<NumberInput min={k==='age'?18:k==='height'?130:40} max={k==='age'?64:k==='height'?220:250} step={k==='weight'?0.1:1} value={p[k]} onValue={value=>field(k,value)}/></label>)}</div>
 <label>Køn til kalorieberegningen<select value={p.sex||''} onChange={e=>field('sex',e.target.value as Profile['sex'])}><option value="">Vælg</option><option value="female">Kvinde</option><option value="male">Mand</option></select></label><p className="p-note">Formlen bruger disse to kategorier. Vælg portioner, hvis beregningen ikke passer til dig.</p>
 <label>Hvor aktiv er du uden for træningen?<select value={p.everydayActivity||''} onChange={e=>setP(x=>({...x,everydayActivity:e.target.value as Profile['everydayActivity'],activity:'moderate',calculationSuitable:true,energyMethod:'weekly-v3'}))}><option value="">Vælg din hverdag</option><option value="seated">Mest siddende · studie eller kontor</option><option value="moving">En del på benene · stående/gående arbejde</option><option value="physical">Fysisk krævende arbejde</option></select></label><p className="p-note">Din valgte træningsuge lægges til separat. Et gammelt samlet aktivitetstal genbruges ikke.</p>
 <label className="p-check"><input type="checkbox" checked={p.dataConsent||false} onChange={e=>field('dataConsent',e.target.checked)}/>Jeg giver samtykke til at gemme oplysningerne til kalorieberegningen. Jeg kan vælge portioner i stedet.</label>
 {p.goal==='fat-loss'&&<label>Ønsket kalorieunderskud<select value={p.deficitLevel||'moderate'} onChange={e=>field('deficitLevel',e.target.value as Profile['deficitLevel'])}>{deficitLevels.map(l=><option key={l.id} value={l.id}>{l.name} · {l.percent}%</option>)}</select><small>Uegnede valg blokeres. Aggressivt er ikke standard og gives aldrig for alle 100 dage.</small></label>}
 {p.goal==='muscle'&&<label>Kalorieoverskud til muskelopbygning<select value={p.surplusKcal||250} onChange={e=>field('surplusKcal',Number(e.target.value)as 150|250|350)}><option value={150}>Forsigtigt · +150 kcal</option><option value={250}>Udgangspunkt · +250 kcal</option><option value={350}>Større · +350 kcal</option></select><small>Startpunkt, ikke et krav for alle. Justér efter vægttrend og træningsudvikling.</small></label>}
 {calculation&&<p className="p-notice">{calculation.available?`Estimeret ligevægt: ca. ${calculation.maintenance} kcal. Dit mål: ${calculation.kcal} kcal. Det er et startestimat, som bør vurderes efter 2–3 ugers registreringer.`:calculation.explanation}</p>}</>}
 </>}
 {step===4&&<><section className="p-card summary-card"><span className="p-eyebrow">DET BYGGER DIN PLAN PÅ</span><h2>{labels[p.goal]}</h2><p>{labels[p.level]} · {labels[p.diet]} · {p.mealCount||4} måltider om dagen</p><p className="p-note">{labels[p.nutrition]} · {p.days} styrkepas og {p.cardio?.days||0} konditionspas om ugen.</p></section>
 <section className="p-card schedule-summary"><h2>Din uge</h2>{normal.schedule!.map(slot=><div className="p-list-row" key={slot.weekday}><span>{weekdayNames[slot.weekday]}</span><strong>{normal.locations!.find(l=>l.id===slot.locationId)?.name||labels[p.place]} · {slot.minutes} min.</strong></div>)}{(p.cardio?.weekdays||[]).map(d=><div className="p-list-row" key={'cardio'+d}><span>{weekdayNames[d]} · Kondition</span><strong>{p.cardio!.minutes} min.</strong></div>)}<p className="p-note">I alt {normal.schedule!.reduce((n,s)=>n+s.minutes,0)+(p.cardio?.days||0)*(p.cardio?.minutes||0)} minutter styrke og kondition om ugen. Anden sport tælles separat.</p></section>
 {!editing&&<><label>Hvornår skal dag 1 begynde?<input type="date" min={localDate()} value={p.startDate} onChange={e=>field('startDate',e.target.value)}/></label><label className="p-check"><input type="checkbox" checked={startConfirmed} onChange={e=>setStartConfirmed(e.target.checked)}/>Jeg vælger {p.startDate} som dag 1 i mit 100-dages forløb.</label></>}
 <GeneratedPlanReview profile={p} answers={answers} onChange={setAnswers} expectedVersion={initialVersion} startConfirmed={startConfirmed}/></>}
 {error&&<p className="p-error" role="alert">{error}</p>}
 <div className="p-actions">{step>0&&<button type="button" className="p-secondary" disabled={busy} onClick={()=>setStep(step-1)}>Tilbage</button>}{step<4&&<button type="button" className="p-button" disabled={busy||!intakeLoaded} onClick={()=>save(Math.min(4,step+1))}>{busy?'Gemmer…':'Gem og fortsæt →'}</button>}</div></>}
 </section></main>;
}
