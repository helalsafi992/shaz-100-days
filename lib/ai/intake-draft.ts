import { z } from "zod";
import type { Profile } from "../profile";
import { intakeSchema, intakeVersion, wishesSchema, safetySchema } from "./intake";

/** Encrypted, account-scoped onboarding answers. None of these fields leave the server for PubMed searches. */
export const intakeDraftSchema = z.object({
  version: z.literal(intakeVersion),
  adult: z.literal(true),
  wishes: wishesSchema,
  safety: safetySchema.optional(),
  processingConsent: z.literal(true),
  aiConsent: z.boolean().default(false)
}).strict();
export type IntakeDraft = z.infer<typeof intakeDraftSchema>;

export function fullIntake(p: Profile, draft: IntakeDraft) {
  if (!draft.safety) throw Error("SAFETY_ANSWERS_REQUIRED");
  return intakeSchema.parse({
    ...draft,
    profile: p,
    dietPattern: p.diet === "halal" ? "all" : p.diet
  });
}
