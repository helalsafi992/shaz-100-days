import {hasEquipment, type Exercise, type DayPlan} from './training';
import type {Profile} from './profile';
export const muscleLabels: Record<string,string>={push:'Bryst og triceps',pull:'Ryg og biceps',shoulder:'Skuldre',squat:'Lår og baller',hinge:'Baglår og baller',single:'Lår og baller',calf:'Læg',core:'Mave og kropsstabilitet','knee-flexion':'Baglår'};
/** Same group and dose unit; current session equipment, exclusions and approved groups win. */
export function replacementOptions(old:Exercise,p:Profile,catalog:Exercise[],day?:Pick<DayPlan,'exercises'|'equipment'|'swapGroups'|'excludedPatterns'>):Exercise[]{
 if(day?.excludedPatterns?.includes(old.pattern))return [];
 const allowed=day?.swapGroups?.[old.id],occupied=new Set(day?.exercises.filter(e=>e.id!==old.id).map(e=>e.id)||[]);
 const local={...p,equipment:day?.equipment||p.equipment};
 return catalog.filter(e=>e.id!==old.id&&e.pattern===old.pattern&&(e.unit||'reps')===(old.unit||'reps')&&!occupied.has(e.id)&&!(p.exerciseAvoid||[]).includes(e.id)&&hasEquipment(e,local)&&(!allowed||allowed.includes(e.id)))
 .sort((a,b)=>Number(b.equipment.some(e=>e!=='bodyweight'))-Number(a.equipment.some(e=>e!=='bodyweight'))||a.name.localeCompare(b.name,'da')).slice(0,3);
}
export function withSwapGroups(day:DayPlan,p:Profile,catalog:Exercise[]):DayPlan{
 return {...day,swapGroups:Object.fromEntries(day.exercises.map(e=>[e.id,[e.id,...replacementOptions(e,p,catalog,{...day,swapGroups:undefined}).map(o=>o.id)]]))};
}
