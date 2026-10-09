import {z} from 'zod';
import {profileSchema} from '../profile';
import {measurableGoalError} from '../goal-units';
export const intakeVersion='shaz-intake-2026-10-09-v1';
const answer=z.enum(['no','yes','unsure']);
export const wishesSchema=z.object({
 priority:z.enum(['fat-loss','hypertrophy','strength','fitness','sport','maintenance']),
 focus:z.array(z.enum(['whole-body','glutes','legs','back','chest','shoulders','core'])).min(1).max(2),
 target:z.object({metric:z.enum(['none','weight-kg','run-km','exercise-kg','consistent-weeks']),value:z.number().positive().max(500).nullable(),weeks:z.number().int().min(1).max(52).nullable(),baseline:z.number().min(0).max(500).nullable().optional(),exerciseId:z.string().min(1).max(80).nullable().optional(),displayUnit:z.enum(['kg','lbs','km','miles','weeks']).optional(),reps:z.number().int().min(1).max(50).nullable().optional(),measurementVersion:z.literal(2).optional()}).strict(),
 preferredExercises:z.array(z.string().min(1).max(80)).max(8).default([]),ageBand:z.enum(['18-39','40-64','65-plus']),recentTraining:z.enum(['none','under-3-months','3-12-months','over-1-year']),
 interruption:z.enum(['none','under-4-weeks','over-4-weeks']),sleep:z.enum(['under-6','6-8','over-8','variable']),barriers:z.array(z.enum(['time','fatigue','motivation','cooking','irregular-week','none'])).max(3),foodBudget:z.enum(['low','medium','flexible']),foodVariety:z.enum(['repeat-ok','balanced','high-variety']),batchCooking:z.boolean()
}).strict();
export const safetySchema=z.object({urgentSymptoms:answer,exertionalSymptoms:answer,medicalExerciseRestriction:answer,pregnancyOrPostpartum:answer,medicalDietNeeded:answer,calorieTrackingConcern:answer,severeFoodAllergy:answer,injury:z.object({status:z.enum(['none','resolved','current','postoperative']),areas:z.array(z.enum(['neck','shoulder','elbow','wrist','back','hip-groin','knee','ankle-foot','other'])).max(5),side:z.enum(['left','right','both','not-applicable']),pain:z.number().int().min(0).max(10),duration:z.enum(['none','under-2-weeks','2-12-weeks','over-12-weeks']),worsening:answer,dailyLimitation:answer,professionalAssessment:z.enum(['none','assessed','under-care']),triggers:z.array(z.enum(['squat','hinge','push','pull','overhead','run','jump','other'])).max(8),afterReaction:z.enum(['none','settles','worse-next-day','unsure']),restrictions:z.array(z.enum(['no-running','no-jumping','no-overhead','no-deep-squat','no-heavy-lifting','other'])).max(6)}).strict()}).strict();
export const intakeSchema=z.object({version:z.literal(intakeVersion),adult:z.literal(true),profile:profileSchema,dietPattern:z.enum(['all','vegetarian','vegan','pescatarian']),wishes:wishesSchema,safety:safetySchema,processingConsent:z.literal(true),aiConsent:z.boolean()}).strict().superRefine((v,c)=>{
 const fail=(message:string)=>c.addIssue({code:'custom',message}),i=v.safety.injury;
 if(i.status==='none'&&(i.pain>0||i.areas.length||i.restrictions.length||i.triggers.length||i.afterReaction!=='none'||i.duration!=='none'||i.worsening!=='no'||i.dailyLimitation!=='no'))fail('Svarene om skader er modstridende. Kontrollér dem før planen laves.');
 if(i.status!=='none'&&!i.areas.length)fail('Vælg området for din skade eller gene.');
 if(v.profile.age&&v.profile.age<18)fail('Dette forløb er til voksne.');
 const actualDiet=v.profile.diet==='halal'?'all':v.profile.diet;if(v.dietPattern!==actualDiet)fail('Kosttype og profilens faktiske opskriftsfilter stemmer ikke overens. Ret valgene før AI-planen beregnes.');
 if(v.profile.age){const band=v.profile.age<40?'18-39':v.profile.age<65?'40-64':'65-plus';if(v.wishes.ageBand!==band)fail('Alder og aldersgruppe stemmer ikke overens.');}
 if(v.wishes.target.metric!=='none'&&(v.wishes.target.value===null||v.wishes.target.weeks===null))fail('Angiv dit ønskede mål og tidshorisont, eller vælg intet talmål.');
 if(v.wishes.target.measurementVersion===2){const problem=measurableGoalError(v.wishes.target);if(problem)fail(problem);}
 if(v.wishes.target.metric==='weight-kg'&&!v.profile.weight&&!v.wishes.target.baseline)fail('Et vægtmål kræver et udgangspunkt, ellers vælg et andet succeskriterium.');
 if(v.wishes.target.metric==='exercise-kg'&&!v.wishes.target.exerciseId)fail('Vælg den øvelse, dit styrkemål handler om.');
});
export type Intake=z.infer<typeof intakeSchema>;
export type SafetyDecision={status:'eligible'|'needs_professional_review'|'stop';reasons:string[];automaticPlanAllowed:boolean};
/** Existing conservative routing policy; not diagnosis or a validated clearance instrument. */
export function screenIntake(v:Intake):SafetyDecision{
 const s=v.safety,reasons:string[]=[];
 if(s.urgentSymptoms==='yes')return{status:'stop',automaticPlanAllowed:false,reasons:['Start ikke et nyt træningspas ved aktuelle alvorlige symptomer. Søg akut hjælp; ring 112 ved en akut alvorlig situation.']};
 const labels:Record<string,string>={urgentSymptoms:'Uafklarede akutte symptomer',exertionalSymptoms:'Symptomer ved fysisk anstrengelse',medicalExerciseRestriction:'Lægelige begrænsninger for træning',pregnancyOrPostpartum:'Graviditet eller nylig fødsel kræver særskilt vurdering',medicalDietNeeded:'Behov for individuelt medicinsk tilpasset kost',calorieTrackingConcern:'Kalorietælling eller vægttab er muligvis ikke egnet',severeFoodAllergy:'Alvorlig fødevareallergi kræver kontrol ud over ingrediensfiltre'};
 for(const key of Object.keys(labels))if((s as unknown as Record<string,unknown>)[key]!=='no')reasons.push(labels[key]);
 const i=s.injury;if(i.status==='current'||i.status==='postoperative'||i.pain>0||i.worsening!=='no'||i.dailyLimitation!=='no'||i.restrictions.length||i.triggers.length||i.afterReaction==='worse-next-day'||i.afterReaction==='unsure')reasons.push('Skade, smerte eller restriktion: en fagperson skal vurdere relevante bevægelser og belastning. AI må ikke selv godkende genoptræning.');
 if(v.wishes.ageBand==='65-plus')reasons.push('Denne første automatiske planlægningspolitik er ikke godkendt til 65+.');
 return{status:reasons.length?'needs_professional_review':'eligible',automaticPlanAllowed:reasons.length===0,reasons};
}
/** No identity, clinical free text, exact body measurements or uncollected budget/sleep defaults sent to the model. */
export function modelContext(v:Intake){return{priority:v.wishes.priority,ageBand:v.wishes.ageBand,recentTraining:v.wishes.recentTraining,diet:v.dietPattern,halal:!!v.profile.halal||v.profile.diet==='halal',weeklyStrength:v.profile.days,weeklyCardio:v.profile.cardio?.days||0,performanceGoal:v.wishes.target.metric==='weight-kg'?{metric:'body-mass-change-percent',value:(v.wishes.target.baseline||v.profile.weight)&&v.wishes.target.value?Math.round((v.wishes.target.value/(v.wishes.target.baseline||v.profile.weight!)-1)*1000)/10:null,weeks:v.wishes.target.weeks}:v.wishes.target,preferredExerciseIds:v.wishes.preferredExercises};}
export const questions=[
 {section:'Dit mål',items:['Dit primære mål, træningserfaring og aldersgruppe.','Valgfrit målbart mål med udgangspunkt og kg/lbs, km/miles eller øvelse og gentagelser.']},
 {section:'Din uge',items:['Hjemme, center eller begge, udstyr, understøttet antal pas og konkrete dage.','Sted og tid inklusive opvarmning for hver dag.','Valgfri kondition og anden sport.']},
 {section:'Dine hensyn',items:['Tre synlige områder: helbred ved træning, skade/genoptræning og hensyn til kosten.','Nej gælder kun efter et aktivt valg, som udtrykkeligt omfatter de angivne forhold.','Ja eller usikker åbner de relevante opfølgende spørgsmål; kliniske regler er uændrede.']},
 {section:'Din mad',items:['Kosttype, halal, måltidsantal, tid til madlavning, allergier og søgbare råvarefravalg.','Portioner eller et beregnet kaloriemål med de nødvendige data og samtykke.']},
 {section:'Din plan',items:['Faktiske dage, steder og varigheder; startdato og bekræftelse.','Valgfri AI-vurdering er stadig kun et forslag til gennemgang, ikke en automatisk aktiv plan.']}
]as const;
