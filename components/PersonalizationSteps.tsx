"use client";
import { type ReactNode } from "react";
import type { Profile } from "@/lib/profile";
import { exercises } from "@/lib/training";
import { intakeVersion, type Intake, wishesSchema, safetySchema } from "@/lib/ai/intake";
import type { IntakeDraft } from "@/lib/ai/intake-draft";

export type WizardAnswers = {
  adult: boolean;
  processingConsent: boolean;
  aiConsent: boolean;
  wishes: IntakeDraft["wishes"];
  safety: NonNullable<IntakeDraft["safety"]>;
  answered: string[];
};
type Answer = "yes" | "no" | "unsure";
const yesNo: {value:Answer;label:string}[] = [{value:"no",label:"Nej"},{value:"yes",label:"Ja"},{value:"unsure",label:"Ved ikke"}];
const baseInjury: WizardAnswers["safety"]["injury"] = {
 status:"none", areas:[],side:"not-applicable",pain:0,duration:"none",worsening:"no",
 dailyLimitation:"no",professionalAssessment:"none",triggers:[],afterReaction:"none",restrictions:[]
};
export function newAnswers(p: Profile): WizardAnswers {
  const priority = p.goal==="muscle"?"hypertrophy":p.goal==="maintain"?"maintenance":p.goal;
  return {
    adult:false,processingConsent:false,aiConsent:false,answered:[],
    wishes:{priority,focus:["whole-body"],target:{metric:"none",value:null,weeks:null},preferredExercises:[],
     ageBand:"18-39",recentTraining:"none",interruption:"none",sleep:"variable",
     barriers:[],foodBudget:"medium",foodVariety:"balanced",batchCooking:false},
    safety:{urgentSymptoms:"no",exertionalSymptoms:"no",medicalExerciseRestriction:"no",
      pregnancyOrPostpartum:"no",medicalDietNeeded:"no",calorieTrackingConcern:"no",
      severeFoodAllergy:"no",injury:{...baseInjury}},
  };
}
const safetyFields = ["urgentSymptoms","exertionalSymptoms","medicalExerciseRestriction",
  "pregnancyOrPostpartum","medicalDietNeeded","calorieTrackingConcern","severeFoodAllergy","injury.status"];
export function stageError(step: number, a: WizardAnswers): string | null {
  if(step===0){
    if(!a.adult || !a.processingConsent) return "Bekræft at du er voksen, og giv særskilt samtykke til at gemme dine personlige planoplysninger.";
    if(!["ageBand","recentTraining","interruption","sleep"].every(k=>a.answered.includes(k))) return "Svar på alder, træningserfaring, pause og søvn for at fortsætte.";
    if(!wishesSchema.safeParse(a.wishes).success) return "Kontrollér dit personlige mål og de supplerende oplysninger.";
  }
  if(step===2){
    if(!safetyFields.every(k=>a.answered.includes(k))) return "Svar på alle sikkerhedsspørgsmål. Et ubesvaret spørgsmål er ikke det samme som Nej.";
    if(a.safety.injury.status!=="none"){
      if(!a.safety.injury.areas.length) return "Vælg hvor generne sidder.";
      if(!["injury.duration","injury.pain","injury.worsening","injury.dailyLimitation","injury.afterReaction","injury.professionalAssessment"].every(k=>a.answered.includes(k))) return "Udfyld varighed, smerte, efterreaktion og faglig vurdering af generne.";
    }
    if(!safetySchema.safeParse(a.safety).success) return "Kontrollér sikkerhedsoplysningerne.";
  }
  return null;
}
export function asDraft(a:WizardAnswers, includeSafety:boolean): IntakeDraft {
 return { version:intakeVersion, adult:true, processingConsent:true,
    aiConsent:a.aiConsent,wishes:wishesSchema.parse(a.wishes),
    ...(includeSafety ? {safety:safetySchema.parse(a.safety)} : {}) };
}
export function restoreAnswers(current:WizardAnswers, saved:IntakeDraft):WizardAnswers {
 return {...current,adult:true,processingConsent:true,aiConsent:saved.aiConsent,
   wishes:saved.wishes,safety:saved.safety || current.safety,
   answered:[...new Set([...current.answered,"ageBand","recentTraining","interruption","sleep",
     ...(saved.safety?safetyFields:[]),
     ...(saved.safety?.injury.status!=="none" && saved.safety ? 
      ["injury.duration","injury.pain","injury.worsening","injury.dailyLimitation","injury.afterReaction","injury.professionalAssessment"] : [])])] };
}
type Shared={ value:WizardAnswers; onChange:(value:WizardAnswers)=>void };
function mark(value:WizardAnswers,key:string):string[] {return [...new Set([...value.answered,key])];}
function Pick<T extends string | number | boolean>({name,title,value,options,onPick,hint}:
 {name:string;title:string;value:T | null;options:readonly {value:T;label:string}[];onPick:(v:T)=>void;hint?:string}) {
 return <fieldset className="shaz-question"><legend>{title}</legend>
 <div className="shaz-choice-row">{options.map(o=><button key={String(o.value)} type="button"
  aria-pressed={value===o.value} className={value===o.value?"chosen":""}
  onClick={()=>onPick(o.value)}>{o.label}</button>)}</div>
 {hint && <p className="p-note">{hint}</p>}</fieldset>;
}
function Multi<T extends string>({title,selected,options,onChange,max,hint}:
 {title:string;selected:T[];options:readonly {value:T;label:string}[];onChange:(s:T[])=>void;max:number;hint?:string}) {
 return <fieldset className="shaz-question"><legend>{title}</legend><div className="shaz-checkbox-grid">
 {options.map(o=><label key={o.value} className="p-check"><input type="checkbox" checked={selected.includes(o.value)}
  disabled={!selected.includes(o.value)&&selected.length>=max}
  onChange={e=>onChange(e.target.checked?[...selected,o.value]:selected.filter(s=>s!==o.value))}/>{o.label}</label>)}</div>
 {hint&&<p className="p-note">{hint}</p>}</fieldset>;
}
const areas = [["neck","Nakke"],["shoulder","Skulder"],["elbow","Albue"],["wrist","Håndled"],["back","Ryg"],["hip-groin","Hofte/lyske"],["knee","Knæ"],["ankle-foot","Ankel/fod"],["other","Andet"]] as const;
const triggers = [["squat","Squat"],["hinge","Hoftebøjning/hinge"],["push","Pres"],["pull","Træk"],["overhead","Over hovedet"],["run","Løb"],["jump","Hop"],["other","Andet"]] as const;
const restrictions = [["no-running","Ingen løb"],["no-jumping","Ingen hop"],["no-overhead","Intet over hovedet"],["no-deep-squat","Ingen dybe squats"],["no-heavy-lifting","Ingen tunge løft"],["other","Andet"]] as const;
const focusChoices = [["whole-body","Hele kroppen"],["glutes","Baller"],["legs","Ben"],["back","Ryg"],["chest","Bryst"],["shoulders","Skuldre"],["core","Core"]] as const;
const goals = [["fat-loss","Fedttab","fat-loss"],["hypertrophy","Muskelopbygning","muscle"],["strength","Blive stærkere","muscle"],["fitness","Bedre kondition og form","fitness"],["sport","Bedre til min sport","fitness"],["maintenance","Holde formen","maintain"]] as const;
export function GoalQuestions({value,onChange,onProfileGoal}:Shared & {onProfileGoal:(p:Profile["goal"],level?:Profile["level"])=>void}){
 const set=(w:Partial<WizardAnswers["wishes"]>,key?:string)=>onChange({...value,wishes:{...value.wishes,...w},answered:key?mark(value,key):value.answered});
 return <section className="shaz-personalize">
 <h2>Det vigtigste for dig</h2>
 <Pick name="goal" title="Hvad vil du først og fremmest opnå?" value={value.wishes.priority} options={goals.map(x=>({value:x[0],label:x[1]}))}
  onPick={x=>{set({priority:x,target:{metric:"none",value:null,weeks:null}},"priority");onProfileGoal(goals.find(y=>y[0]===x)![2] as Profile["goal"]);}}/>
 <Multi title="Vil du prioritere bestemte områder?" selected={value.wishes.focus} max={2}
  options={focusChoices.map(x=>({value:x[0],label:x[1]}))} onChange={list=>set({focus:list.length?list:["whole-body"]},"focus")}
  hint="Vælg højst to. Det giver ikke mulighed for lokalt fedttab."/>
 <Pick name="target" title="Har du et målbart mål?" value={value.wishes.target.metric} options={[
  {value:"none",label:"Ikke nødvendigt"},{value:"weight-kg",label:"Kropsvægt"},
  {value:"run-km",label:"Løbedistance"},{value:"exercise-kg",label:"Styrkepræstation"},
  {value:"consistent-weeks",label:"Træningsuger"}] as const}
  onPick={metric=>set({target:{metric,value:null,weeks:null}}, "target")}/>
 {value.wishes.target.metric!=="none" && <div className="p-fields">
 <label>Ønsket resultat i relevant enhed<input type="number" min="0.1" max="500" step="0.1"
  value={value.wishes.target.value??""} onChange={e=>set({target:{...value.wishes.target,value:e.target.value?Number(e.target.value):null}})}/></label>
 <label>Inden for hvor mange uger?<input type="number" min="1" max="52"
  value={value.wishes.target.weeks??""} onChange={e=>set({target:{...value.wishes.target,weeks:e.target.value?Number(e.target.value):null}})}/></label>
 {value.wishes.target.metric==="exercise-kg" && <label>Øvelse<select value={value.wishes.target.exerciseId??""}
  onChange={e=>set({target:{...value.wishes.target,exerciseId:e.target.value||null}})}><option value="">Vælg øvelse</option>
  {exercises.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}
 {value.wishes.target.metric==="weight-kg" && <p className="p-note">Et vægtmål kræver også et udgangspunkt. Du kan vælge et andet succeskriterium, hvis du ikke ønsker at oplyse vægt.</p>}
 </div>}
 <Pick name="ageband" title="Hvilken aldersgruppe er du i?" value={value.answered.includes("ageBand")?value.wishes.ageBand:null}
  options={[{value:"18-39",label:"18–39 år"},{value:"40-64",label:"40–64 år"},{value:"65-plus",label:"65+"}] as const}
  onPick={x=>set({ageBand:x},"ageBand")}/>
 <Pick name="experience" title="Hvor længe har du trænet styrke?" value={value.answered.includes("recentTraining")?value.wishes.recentTraining:null}
  options={[{value:"none",label:"Helt ny"},{value:"under-3-months",label:"Under 3 mdr."},{value:"3-12-months",label:"3–12 mdr."},{value:"over-1-year",label:"Over et år"}] as const}
  onPick={x=>{set({recentTraining:x},"recentTraining");onProfileGoal(goals.find(g=>g[0]===value.wishes.priority)![2] as Profile["goal"],x==="over-1-year"?"experienced":x==="3-12-months"?"intermediate":"beginner");}}/>
 <Pick name="pause" title="Har du haft en længere pause fra træning?" value={value.answered.includes("interruption")?value.wishes.interruption:null}
  options={[{value:"none",label:"Nej"},{value:"under-4-weeks",label:"Under 4 uger"},{value:"over-4-weeks",label:"4 uger eller mere"}] as const}
  onPick={x=>set({interruption:x},"interruption")}/>
 <Pick name="sleep" title="Hvor meget sover du typisk?" value={value.answered.includes("sleep")?value.wishes.sleep:null}
  options={[{value:"under-6",label:"Under 6 timer"},{value:"6-8",label:"6–8 timer"},{value:"over-8",label:"Over 8 timer"},{value:"variable",label:"Varierer meget"}] as const}
  onPick={x=>set({sleep:x},"sleep")}/>
 <div className="p-card"><p>Vi gemmer dine personlige valg krypteret på din konto. Helbredssvar bruges til at vurdere, om automatiske træningsforslag er egnede, og sendes ikke til AI-modellen. Se <a href="/privacy" target="_blank" rel="noopener noreferrer">privatlivsinformation</a>.</p>
 <label className="p-check"><input type="checkbox" checked={value.adult} onChange={e=>onChange({...value,adult:e.target.checked})}/>Jeg er mindst 18 år.</label>
 <label className="p-check"><input type="checkbox" checked={value.processingConsent} onChange={e=>onChange({...value,processingConsent:e.target.checked})}/>Jeg giver udtrykkeligt samtykke til, at mine oplysninger om træningsbegrænsninger og helbred bruges og opbevares til at vurdere min plan. Jeg kan trække det tilbage.</label>
 </div></section>;
}
export function PreferredExerciseQuestions({value,onChange}:Shared){
 const set=(selected:string[])=>onChange({...value,wishes:{...value.wishes,preferredExercises:selected}});
 return <details className="shaz-exercise-preferences"><summary>Øvelser jeg gerne vil have med (valgfrit)</summary>
 <Multi title="Dine favoritter" selected={value.wishes.preferredExercises} onChange={set} max={8}
 options={exercises.map(e=>({value:e.id,label:e.name}))} hint="Vælg højst otte. Smerter og begrænsninger håndteres i næste trin."/></details>;
}
export function SafetyQuestions({value,onChange}:Shared){
 const s=value.safety,inj=s.injury;
 const update=(next:Partial<typeof s>,key?:string)=>onChange({...value,safety:{...s,...next},answered:key?mark(value,key):value.answered});
 const injury=(next:Partial<typeof inj>,key?:string)=>update({injury:{...inj,...next}},key);
 const statusOpts=[{value:"none",label:"Ingen gener"},{value:"resolved",label:"Tidligere, overstået"},
 {value:"current",label:"Aktuelle gener"},{value:"postoperative",label:"Opereret/i genoptræning"}] as const;
 const questions:{key:Exclude<keyof typeof s,"injury">;title:string}[]=[
 {key:"urgentSymptoms",title:"Har du alvorlige, pludselige eller uforklarede symptomer lige nu?"},
 {key:"exertionalSymptoms",title:"Har du uforklarede symptomer ved fysisk aktivitet?"},
 {key:"medicalExerciseRestriction",title:"Har en læge eller fysioterapeut begrænset din træning?"},
 {key:"pregnancyOrPostpartum",title:"Er graviditet, nylig fødsel eller amning relevant?"},
 {key:"medicalDietNeeded",title:"Har du behov for en individuelt medicinsk tilpasset kost?"},
 {key:"calorieTrackingConcern",title:"Kan kalorietælling eller vægttab være uhensigtsmæssigt for dig?"},
 {key:"severeFoodAllergy",title:"Har du en alvorlig allergi, hvor spor kan give problemer?"}
 ];
 return <section className="shaz-personalize"><h2>Helbred og begrænsninger</h2>
 <p className="p-muted">Vi spørger for ikke at lave en uhensigtsmæssig automatisk plan. Svar ja eller ved ikke, når du er i tvivl. AI kan ikke stille diagnoser eller godkende genoptræning.</p>
 {questions.map(item=><Pick key={item.key} name={item.key} title={item.title}
   value={value.answered.includes(item.key)?s[item.key]:null} options={yesNo}
   onPick={x=>update({[item.key]:x},item.key)} />)}
 <Pick name="injurystatus" title="Har du en skade, operation eller smerter, som påvirker træning?"
  value={value.answered.includes("injury.status")?inj.status:null} options={statusOpts}
  onPick={x=>injury(x==="none"?{...baseInjury}:{...baseInjury,status:x},"injury.status")}/>
 {inj.status!=="none" && value.answered.includes("injury.status") && <div className="shaz-injury-details">
 <Multi title="Hvor sidder generne?" selected={inj.areas} options={areas.map(([value,label])=>({value,label}))}
  onChange={list=>injury({areas:list})} max={5}/>
 <Pick name="side" title="Hvilken side?" value={inj.side}
  options={[{value:"left",label:"Venstre"},{value:"right",label:"Højre"},{value:"both",label:"Begge"},{value:"not-applicable",label:"Ikke relevant"}]}
  onPick={x=>injury({side:x},"injury.side")}/>
 <div className="p-fields"><label>Smerte fra 0 til 10<input type="number" min="0" max="10" value={value.answered.includes("injury.pain")?inj.pain:""} onChange={e=>injury({pain:Number(e.target.value)},"injury.pain")}/></label></div>
 <Pick name="duration" title="Hvor længe har det stået på?" value={value.answered.includes("injury.duration")?inj.duration:null}
 options={[{value:"none",label:"Ingen aktive gener"},{value:"under-2-weeks",label:"Under 2 uger"},{value:"2-12-weeks",label:"2–12 uger"},{value:"over-12-weeks",label:"Over 12 uger"}]}
 onPick={x=>injury({duration:x},"injury.duration")}/>
 <Pick name="worsening" title="Bliver det værre?" value={value.answered.includes("injury.worsening")?inj.worsening:null} options={yesNo} onPick={x=>injury({worsening:x},"injury.worsening")}/>
 <Pick name="daily" title="Påvirker det din hverdag?" value={value.answered.includes("injury.dailyLimitation")?inj.dailyLimitation:null} options={yesNo} onPick={x=>injury({dailyLimitation:x},"injury.dailyLimitation")}/>
 <Multi title="Hvilke bevægelser provokerer?" selected={inj.triggers} options={triggers.map(([value,label])=>({value,label}))} onChange={list=>injury({triggers:list})} max={8}/>
 <Pick name="reaction" title="Hvordan reagerer du efter aktivitet?" value={value.answered.includes("injury.afterReaction")?inj.afterReaction:null}
  options={[{value:"none",label:"Ingen reaktion"},{value:"settles",label:"Falder til ro"},{value:"worse-next-day",label:"Værre dagen efter"},{value:"unsure",label:"Usikker"}]}
  onPick={x=>injury({afterReaction:x},"injury.afterReaction")}/>
 <Pick name="professional" title="Er du blevet fagligt vurderet?" value={value.answered.includes("injury.professionalAssessment")?inj.professionalAssessment:null}
 options={[{value:"none",label:"Nej"},{value:"assessed",label:"Tidligere"},{value:"under-care",label:"I behandling/genoptræning"}]}
 onPick={x=>injury({professionalAssessment:x},"injury.professionalAssessment")}/>
 <Multi title="Hvilke restriktioner har du fået?" selected={inj.restrictions}
 options={restrictions.map(([value,label])=>({value,label}))} onChange={list=>injury({restrictions:list})} max={6}/>
 </div>}
 {s.urgentSymptoms==="yes"&&value.answered.includes("urgentSymptoms")&&
 <p className="p-error" role="alert">Ved alvorlige akutte symptomer skal du søge akut hjælp; ring 112 ved en akut alvorlig situation. Systemet kan ikke starte et træningsprogram for dig.</p>}
 <p className="p-note">Hvis du svarer ja eller usikker på relevante helbredsspørgsmål, viser vi et behov for faglig vurdering. AI vælges ikke som genoptræningsbehandler.</p>
 </section>;
}
export function FoodPreferenceQuestions({value,onChange}:Shared){
 const update=(next:Partial<WizardAnswers["wishes"]>)=>onChange({...value,wishes:{...value.wishes,...next}});
 return <section className="shaz-personalize"><h2>Din mad i hverdagen</h2>
 <Pick name="budget" title="Hvordan er dit madbudget?" value={value.wishes.foodBudget}
 options={[{value:"low",label:"Lavt"},{value:"medium",label:"Almindeligt"},{value:"flexible",label:"Fleksibelt"}]}
 onPick={x=>update({foodBudget:x})} hint="Vi lover ikke præcise priser uden aktuelle butikstal."/>
 <Pick name="variety" title="Hvor meget variation vil du have?" value={value.wishes.foodVariety}
 options={[{value:"repeat-ok",label:"Gentagelser er fine"},{value:"balanced",label:"En god blanding"},{value:"high-variety",label:"Meget variation"}]}
 onPick={x=>update({foodVariety:x})}/>
 <Pick name="batch" title="Vil du lave mad til flere dage?" value={value.wishes.batchCooking}
 options={[{value:false,label:"Nej"},{value:true,label:"Ja"}]} onPick={x=>update({batchCooking:x})}/>
 <Multi title="Hvad gør det sværere for dig at følge en plan?" selected={value.wishes.barriers}
 options={[{value:"time",label:"Tid"},{value:"fatigue",label:"Træthed"},{value:"motivation",label:"Motivation"},{value:"cooking",label:"Madlavning"},{value:"irregular-week",label:"Uregelmæssig uge"},{value:"none",label:"Intet særligt"}]}
 max={3} onChange={list=>update({barriers:list.includes("none")?["none"]:list})}/>
 </section>;
}
export function ReviewAIQuestion({value,onChange,disabledReason}:{value:WizardAnswers;onChange:(a:WizardAnswers)=>void;disabledReason?:string|null}){
 return <section className="p-card shaz-review-ai"><h2>Vil du have et AI-assisteret forslag?</h2>
 <p>Dit styrke-, cardio- og kostprogram laves med faste regler og dine valg. Hvis du frivilligt vælger AI, kan den kun foreslå egnede øvelser og opskrifter fra vores katalog med referencer til generel forskning. Forslaget ændrer ikke din plan uden godkendelse.</p>
 <p className="p-note">Til OpenAI sendes mål og træningspræferencer uden navn, e-mail, eksakte kropsmål eller dine detaljerede helbredssvar. Du kan sige nej og stadig bruge hele forløbet.</p>
 <Pick name="aiconsent" title="Vil du bruge AI til en supplerende vurdering?" value={value.aiConsent}
  options={[{value:false,label:"Nej tak"},{value:true,label:"Ja, frivilligt"}]}
  onPick={x=>onChange({...value,aiConsent:x})}/>
 {disabledReason&&<p className="p-notice" role="status">{disabledReason}</p>}
 </section>;
}
