"use client";
import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'type'|'min'|'max'|'step'> & {value:number|null|undefined;onValue:(value:number|undefined)=>void;min?:number;max?:number;step?:number;};
/** Clearing the editing buffer never becomes Number('') = 0. */
export default function NumberInput({value,onValue,min,max,step=1,required=true,onBlur,...props}:Props){
 const format=(n:number|null|undefined)=>n==null?'':String(n).replace('.',',');
 const [text,setText]=useState(format(value));const own=useRef(value),ref=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(value!==own.current){own.current=value;setText(format(value));}},[value]);
 function validation(raw:string){if(!raw.trim())return required?'Udfyld feltet.':'';if(!/^\d+(?:[.,]\d*)?$/.test(raw))return 'Skriv et tal.';const n=Number(raw.replace(',','.'));if(!Number.isFinite(n))return 'Skriv et tal.';if(min!==undefined&&n<min)return `Vælg mindst ${min}.`;if(max!==undefined&&n>max)return `Vælg højst ${max}.`;if(step===1&&!Number.isInteger(n))return 'Brug et helt tal.';return '';}
 return <input {...props} ref={ref} type="text" inputMode={step===1?'numeric':'decimal'} required={required} value={text} onChange={e=>{const raw=e.target.value;setText(raw);e.currentTarget.setCustomValidity(validation(raw));if(raw.trim()===''){own.current=undefined;onValue(undefined);return;}if(/^\d+(?:[.,]\d*)?$/.test(raw)){const n=Number(raw.replace(',','.'));own.current=n;onValue(n);}}} onBlur={e=>{const problem=validation(text);e.currentTarget.setCustomValidity(problem);if(!problem&&text.trim())setText(format(Number(text.replace(',','.'))));onBlur?.(e);}}/>;
}
