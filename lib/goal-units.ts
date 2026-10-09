/** Canonical values stay in kg/km. Exact international conversions: NIST SP 811 B.8. */
export type GoalMetric = 'none' | 'weight-kg' | 'run-km' | 'exercise-kg' | 'consistent-weeks';
export type GoalUnit = 'kg' | 'lbs' | 'km' | 'miles' | 'weeks';
export const KG_PER_LB = 0.45359237;
export const KM_PER_MILE = 1.609344;
export function goalUnits(metric: GoalMetric): GoalUnit[] {
 if (metric === 'weight-kg' || metric === 'exercise-kg') return ['kg','lbs'];
 if (metric === 'run-km') return ['km','miles'];
 return metric === 'consistent-weeks' ? ['weeks'] : [];
}
export function goalUnit(metric:GoalMetric,unit?:GoalUnit):GoalUnit {const allowed=goalUnits(metric);return unit&&allowed.includes(unit)?unit:allowed[0]||'weeks';}
export function toCanonical(value:number,unit:GoalUnit):number {if(!Number.isFinite(value))throw Error('GOAL_VALUE_INVALID');return value*(unit==='lbs'?KG_PER_LB:unit==='miles'?KM_PER_MILE:1);}
export function fromCanonical(value:number,unit:GoalUnit):number {if(!Number.isFinite(value))throw Error('GOAL_VALUE_INVALID');return value/(unit==='lbs'?KG_PER_LB:unit==='miles'?KM_PER_MILE:1);}
export function parseGoalNumber(text:string):number|null {if(!text.trim())return null;if(!/^\d+(?:[.,]\d+)?$/.test(text.trim()))throw Error('Brug et tal, fx 72,5.');const value=Number(text.trim().replace(',','.'));if(!Number.isFinite(value)||value<0)throw Error('Brug et positivt tal.');return value;}
export function goalValueLabel(value:number|null|undefined,unit:GoalUnit):string {return value==null?'':new Intl.NumberFormat('da-DK',{maximumFractionDigits:2,useGrouping:false}).format(fromCanonical(value,unit));}
export function measurableGoalError(t:{metric:GoalMetric;value:number|null;weeks:number|null;baseline?:number|null;exerciseId?:string|null;displayUnit?:GoalUnit;reps?:number|null},requireBaseline=true):string|null {
 if(t.metric==='none')return null;
 if(t.displayUnit&&!goalUnits(t.metric).includes(t.displayUnit))return 'Enheden passer ikke til det valgte mål.';
 if(t.value==null||!Number.isFinite(t.value)||t.value<=0||t.value>500)return 'Skriv det resultat, du vil arbejde hen imod.';
 if(!t.weeks||!Number.isInteger(t.weeks)||t.weeks<1||t.weeks>52)return 'Vælg en tidshorisont mellem 1 og 52 uger.';
 if(requireBaseline&&t.metric!=='consistent-weeks'&&(t.baseline==null||!Number.isFinite(t.baseline)||t.baseline<0))return 'Skriv også dit udgangspunkt, så målet giver mening.';
 if(t.metric==='weight-kg'&&((t.baseline!=null&&t.baseline<=0)||t.value<=0))return 'Kropsvægt skal være større end nul.';
 if(t.metric==='exercise-kg'&&!t.exerciseId)return 'Vælg den øvelse, styrkemålet gælder.';
 if(requireBaseline&&t.metric==='exercise-kg'&&(!t.reps||!Number.isInteger(t.reps)||t.reps<1||t.reps>50))return 'Angiv, hvor mange gentagelser styrkemålet gælder for.';
 if(t.metric==='consistent-weeks'&&(!Number.isInteger(t.value)||t.value>t.weeks))return 'Antal træningsuger skal være et helt tal inden for din tidshorisont.';
 return null;
}
