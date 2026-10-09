import { z } from "zod";
import type { Profile } from "../profile";
import { intakeSchema, intakeVersion, wishesSchema, safetySchema } from "./intake";
/** Encrypted, account-scoped answers. PubMed never receives personal search strings. */
export const intakeDraftSchema = z.object({
 version:z.literal(intakeVersion),adult:z.literal(true),wishes:wishesSchema,safety:safetySchema.optional(),processingConsent:z.literal(true),aiConsent:z.boolean().default(false),injuryNote:z.string().max(700).optional(),conciseMode:z.literal(true).optional(),planConsentVersion:z.literal("openai-plan-v2").optional()
}).strict();
export type IntakeDraft=z.infer<typeof intakeDraftSchema>;
export function fullIntake(p:Profile,draft:IntakeDraft){
 if(!draft.safety)throw Error("SAFETY_ANSWERS_REQUIRED");
 return intakeSchema.parse({version:draft.version,adult:draft.adult,wishes:draft.wishes,safety:draft.safety,processingConsent:draft.processingConsent,aiConsent:draft.aiConsent,profile:p,dietPattern:p.diet==='halal'?'all':p.diet});
}
