import { access } from "@/lib/auth";
import { sameOrigin, rate, failure, HttpError } from "@/lib/security";
import { isolatedTest } from "@/lib/test-environment";
import { defaults, localDate } from "@/lib/profile";
import { intakeSchema, intakeVersion } from "@/lib/ai/intake";
import { fetchEvidence } from "@/lib/ai/evidence";
import { openAIProposal } from "@/lib/ai/planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** One isolated synthetic end-to-end provider check. No customer data is sent. */
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    if (!isolatedTest()) throw new HttpError(404, "Ikke tilgængelig.");
    const session = await access(req.headers);
    await rate("ai-synthetic-smoke:" + session.user.id, 2, 1440);
    const key = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL;
    if (!key || !model) throw new HttpError(503, "OpenAI-nøgle og model er ikke konfigureret.");
    const profile = { ...defaults, startDate: localDate() };
    const sample = intakeSchema.parse({
      version: intakeVersion, adult: true, profile, dietPattern: "all",
      wishes: {
        priority: "strength", focus: ["whole-body"],
        target: { metric: "none", value: null, weeks: null },
        preferredExercises: [], ageBand: "18-39",
        recentTraining: "3-12-months", interruption: "none", sleep: "6-8",
        barriers: ["time"], foodBudget: "medium", foodVariety: "balanced", batchCooking: false
      },
      safety: {
        urgentSymptoms: "no", exertionalSymptoms: "no", medicalExerciseRestriction: "no",
        pregnancyOrPostpartum: "no", medicalDietNeeded: "no",
        calorieTrackingConcern: "no", severeFoodAllergy: "no",
        injury: { status: "none", areas: [], side: "not-applicable", pain: 0,
          duration: "none", worsening: "no", dailyLimitation: "no", professionalAssessment: "none",
          triggers: [], afterReaction: "none", restrictions: [] }
      },
      processingConsent: true, aiConsent: true
    });
    const source = await fetchEvidence("strength", {
      limit: 1, email: process.env.NCBI_TOOL_EMAIL,
      pace: () => new Promise(resolve => setTimeout(resolve, 500))
    });
    if (!source.length) throw new HttpError(503, "Ingen PubMed-abstract blev hentet i denne test.");
    const slots = [{ slotId: "synthetic-push", kind: "exercise" as const,
      context: "Generelt styrkepas for en fiktiv rask voksen med kropsvægt",
      options: [{ id: "wall-push", name: "Armbøjninger mod væg" }] }];
    const answer = await openAIProposal(sample, slots, source, { apiKey: key, model });
    return Response.json({
      status: "passed", synthetic: true, activePlanChanged: false,
      model: answer.model, pmids: source.map(x => x.pmid),
      selectedId: answer.proposal.choices[0].selectedId,
      citationValidated: true, usage: answer.usage
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return failure(e); }
}
