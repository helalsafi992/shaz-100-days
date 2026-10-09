"use client";
import {useRef,useState,useEffect} from 'react';
import type {Exercise} from '@/lib/training';
import {muscleLabels} from '@/lib/exercise-replacements';
const equipment:Record<string,string>={bodyweight:'Kropsvægt',dumbbells:'Håndvægte',barbell:'Vægtstang',rack:'Stativ',bench:'Bænk',machines:'Maskine',cable:'Kabel',band:'Elastik'};
export default function ExerciseSwapButton({exercise,options,disabled,onSwap}:{exercise:Exercise;options:Exercise[];disabled?:boolean;onSwap:(id:string)=>Promise<void>}){
 const[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const button=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(open)panel.current?.querySelector('button')?.focus();},[open]);
 return <div className="exercise-swap"><button ref={button} type="button" className="p-secondary" disabled={disabled||busy} aria-expanded={open} onClick={()=>{setOpen(!open);setError('');}}>Skift øvelse</button>
 {open&&<div ref={panel} className="exercise-swap-options" role="group" aria-label={'Alternativer til '+exercise.name} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);button.current?.focus();}}}>
 <strong>Vælg en anden øvelse</strong><p className="p-note">Samme muskelgruppe: {muscleLabels[exercise.pattern]||exercise.pattern}. Dine registrerede sæt bevares.</p>
 {options.slice(0,3).map(o=><button type="button" className="exercise-option" key={o.id} disabled={disabled||busy} onClick={async()=>{setBusy(true);try{await onSwap(o.id);setOpen(false);button.current?.focus();}catch(e){setError(e instanceof Error?e.message:'Kunne ikke skifte øvelse.');}finally{setBusy(false);}}}><strong>{o.name}</strong><span>{muscleLabels[o.pattern]||o.pattern}</span><small>{o.equipment.map(x=>equipment[x]||x).join(' · ')}</small></button>)}
 {options.length<3&&<p className="p-note">{options.length===0?'Ingen passende alternativer med dine nuværende valg.':`Der findes ${options.length} passende alternativer med dit udstyr og dine hensyn.`}</p>}
 <button type="button" className="p-secondary" onClick={()=>{setOpen(false);button.current?.focus();}}>Annuller</button>{error&&<p role="alert" className="p-error">{error}</p>}
 </div>}</div>;
}
