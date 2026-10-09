"use client";
import {useEffect,useState} from 'react';
import ExerciseSwapButton from './ExerciseSwapButton';
import type {DayPlan,Exercise} from '@/lib/training';
import type {Profile} from '@/lib/profile';
import type {MealDay} from '@/lib/meal-plan';
import type {CardioPlan} from '@/lib/cardio';
import {weekdayNames} from '@/lib/profile';
import {cardioAdvice} from '@/lib/cardio';
type QueueItem={id:string;name:string;email:string;created_at:string;review_revision:number};
type Review={id:string;revision:number;profile:Profile;summary:string;injuryNote?:string;progression:string;injuryAdvice:string[];sessions:(Omit<DayPlan,'exercises'>&{exercises:(DayPlan['exercises'][number]&{alternatives:Exercise[]})[]})[];meals:MealDay[];cardio:CardioPlan[]};
export default function CoachPlanReviews(){
 const[queue,setQueue]=useState<QueueItem[]>([]),[plan,setPlan]=useState<Review|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[checked,setChecked]=useState(false),[notice,setNotice]=useState('');
 async function request(url:string,body?:unknown){const r=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});const d=await r.json();if(r.status===428){location.assign('/admin/security');throw Error('Bekræft tofaktorgodkendelse.');}if(!r.ok)throw Error(d.error||'Handlingen mislykkedes.');return d;}
 async function load(){const d=await request('/api/admin/plan-reviews');setQueue(d.queue);}
 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
 async function open(id:string){setBusy(true);setError('');setChecked(false);try{setPlan(await request('/api/admin/plan-reviews?id='+encodeURIComponent(id)));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function publish(){if(!plan||!checked)return;setBusy(true);setError('');try{await request('/api/admin/plan-reviews',{action:'publish',id:plan.id,revision:plan.revision,confirmed:true});setPlan(null);setChecked(false);setNotice('Planen er godkendt og lagt i kundens forløb.');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <main className="portal p-main coach-review-page"><header className="p-top"><a className="logo" href="/admin">SHAZ · COACH</a><a href="/app">Mit forløb</a></header><h1>Planer til godkendelse</h1><p>Gennemgå mål, skadehensyn, træning og kost. En kundes plan ændres først, når du godkender og udleverer den.</p>
 {notice&&<p className="p-notice" role="status">{notice}</p>}{error&&<p className="p-error" role="alert">{error}</p>}
 {!plan?<section>{!queue.length?<p>Ingen planer afventer gennemgang.</p>:queue.map(q=><article className="p-card" key={q.id}><h2>{q.name||q.email}</h2><p>{q.email} · {new Date(q.created_at).toLocaleString('da-DK')}</p><button className="p-button" disabled={busy} onClick={()=>void open(q.id)}>Gennemgå plan</button></article>)}</section>:<section>
 <button className="p-secondary" onClick={()=>{setPlan(null);setChecked(false);}}>Tilbage til køen</button><h2>Samlet plan · version {plan.revision}</h2><p>{plan.summary}</p>
 {plan.injuryNote&&<div className="p-notice"><h3>Kundens beskrivelse af skader</h3><p>{plan.injuryNote}</p></div>}
 {cardioAdvice(plan.profile).map(s=><p className="p-notice" key={s}>{s}</p>)}
 {plan.sessions.map(d=><section className="p-card" key={d.day}><h3>{weekdayNames[new Date(d.date+'T12:00:00Z').getUTCDay()]} · {d.title}</h3><p>{d.locationName} · {d.minutes} minutter</p>{d.exercises.map(e=><div className="coach-exercise" key={e.id}><div className="p-list-row"><strong>{e.name}</strong><span>{e.sets} × {e.min}–{e.max} · {e.rest} sek. pause</span></div><p className="p-note">{e.reason}</p><ExerciseSwapButton exercise={e} options={e.alternatives} disabled={busy} onSwap={async replacement=>{const next=await request('/api/admin/plan-reviews',{action:'swap',id:plan.id,revision:plan.revision,weekday:new Date(d.date+'T12:00:00Z').getUTCDay(),exercise:e.id,replacement});setPlan(next);setChecked(false);}}/></div>)}</section>)}
 <section className="p-card"><h2>Cardio</h2>{plan.cardio.map(d=><p key={d.day}>{weekdayNames[new Date(d.date+'T12:00:00Z').getUTCDay()]}: {d.selected.title} · {d.selected.minutes} minutter</p>)}</section>
 <section className="p-card"><h2>Madplan · syvdages rotation</h2>{plan.meals.map((d,i)=><details key={d.date} open={i===0}><summary>Dag {i+1} · {d.target?d.target+' kcal':'Portioner'}</summary>{d.slots.map(s=><p key={s.id}>{s.name}: <strong>{s.selected?.recipe.name}</strong> · {Math.round(s.selected?.totals.kcal||0)} kcal</p>)}</details>)}</section>
 <section className="p-card"><h2>Progression og hensyn</h2><p>{plan.progression}</p>{plan.injuryAdvice.map((s,i)=><p key={i}>{s}</p>)}</section>
 <label className="p-check"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>Jeg har gennemgået denne version, kundens hensyn og de tilladte øvelsesalternativer. Jeg godkender, at planen udleveres.</label>
 <button className="p-button" disabled={!checked||busy} onClick={publish}>{busy?'Gemmer godkendelse…':'Godkend og send planen'}</button></section>}
 </main>;
}
