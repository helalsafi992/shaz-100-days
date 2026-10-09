"use client";
import { useEffect,useRef,useState } from 'react';
import { exercises } from '@/lib/training';
import { goalUnits,goalUnit,goalValueLabel,parseGoalNumber,toCanonical,type GoalUnit } from '@/lib/goal-units';
import type { Intake } from '@/lib/ai/intake';
type Target=Intake['wishes']['target'];
function NumberField({label,value,unit,onChange}:{label:string;value:number|null|undefined;unit:GoalUnit;onChange:(v:number|null)=>void}){
 const[text,setText]=useState(goalValueLabel(value,unit)),[error,setError]=useState('');const focused=useRef(false),previousUnit=useRef(unit);
 useEffect(()=>{if(!focused.current||previousUnit.current!==unit){setText(goalValueLabel(value,unit));setError('');}previousUnit.current=unit;},[value,unit]);
 return <label>{label} ({unit==='weeks'?'uger':unit})<input type="text" inputMode="decimal" value={text} aria-invalid={!!error} onFocus={()=>{focused.current=true;}} onBlur={()=>{focused.current=false;if(!error)setText(goalValueLabel(value,unit));}} onChange={e=>{const v=e.target.value;setText(v);try{const n=parseGoalNumber(v.replace(/[.,]$/,''));setError('');onChange(n===null?null:toCanonical(n,unit));}catch{setError('Skriv et tal, fx 72,5.');onChange(null);setText(v);}}}/>{error&&<small role="alert">{error}</small>}</label>;
}
export default function GoalTarget({target,onChange,currentWeight}:{target:Target;onChange:(t:Target)=>void;currentWeight?:number}){
 const unit=goalUnit(target.metric,target.displayUnit);const names:Record<Target['metric'],string>={none:'Intet talmål','weight-kg':'Vægt','run-km':'Løbedistance','exercise-kg':'Styrke','consistent-weeks':'Fast træningsrutine'};
 function choose(metric:Target['metric']){onChange({metric,value:null,baseline:metric==='weight-kg'?currentWeight??null:null,weeks:14,exerciseId:null,reps:metric==='exercise-kg'?8:null,displayUnit:goalUnit(metric),measurementVersion:2});}
 const edit=(patch:Partial<Target>)=>onChange({...target,baseline:target.baseline??(target.metric==='weight-kg'?currentWeight??null:null),...patch,measurementVersion:2});
 return <fieldset className="shaz-question goal-target"><legend>Vil du sætte et konkret mål? <span className="optional-label">Valgfrit</span></legend>
 <div className="shaz-choice-row">{(Object.keys(names)as Target['metric'][]).map(metric=><button type="button" key={metric} aria-pressed={target.metric===metric} className={target.metric===metric?'chosen':''} onClick={()=>choose(metric)}>{names[metric]}</button>)}</div>
 {target.metric!=='none'&&<div className="goal-fields">
 {target.metric==='exercise-kg'&&<label className="goal-full">Hvilken øvelse?<select value={target.exerciseId??''} onChange={e=>edit({exerciseId:e.target.value||null})}><option value="">Vælg øvelse</option>{exercises.filter(e=>e.equipment.some(x=>x!=='bodyweight')).map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}
 {goalUnits(target.metric).length>1&&<label className="goal-full">Enhed<select aria-label="Enhed for dit mål" value={unit} onChange={e=>edit({displayUnit:e.target.value as GoalUnit})}>{goalUnits(target.metric).map(u=><option key={u} value={u}>{u==='lbs'?'lbs (pund)':u}</option>)}</select><small>Du kan skifte enhed uden at ændre selve målet.</small></label>}
 {target.metric!=='consistent-weeks'&&<NumberField key={target.metric+'-baseline'} label={target.metric==='weight-kg'?'Din vægt nu':target.metric==='run-km'?'Så langt kan du løbe nu':'Vægt du kan løfte nu'} value={target.baseline??(target.metric==='weight-kg'?currentWeight:null)} unit={unit} onChange={baseline=>edit({baseline})}/>}
 <NumberField key={target.metric+'-goal'} label={target.metric==='weight-kg'?'Din ønskede vægt':target.metric==='run-km'?'Så langt vil du kunne løbe':target.metric==='exercise-kg'?'Vægt du vil kunne løfte':'Uger i træk, du vil følge planen'} value={target.value} unit={unit} onChange={value=>edit({value})}/>
 {target.metric==='exercise-kg'&&<label>Antal gentagelser<input type="number" min={1} max={50} value={target.reps??''} onChange={e=>edit({reps:e.target.value?Number(e.target.value):null})}/><small>Samme antal gentagelser for nuværende og ønsket vægt.</small></label>}
 <details className="goal-full"><summary>Tidshorisont: {target.weeks||14} uger</summary><label>Inden for hvor mange uger?<input type="number" min={1} max={52} value={target.weeks??14} onChange={e=>edit({weeks:e.target.value?Number(e.target.value):null})}/></label></details>
 <p className="p-note goal-full">Målet hjælper dig med at følge din udvikling. Det er ikke et løfte om et bestemt resultat.{(target.weeks||14)>15?' Dit mål ligger efter forløbets 100 dage; det vises som et langsigtet mål, ikke et lovet 100-dages resultat.':''}</p>
 </div>}</fieldset>;
}
