# SHAZ — evidence-assisted personalization

Implemented: authenticated GET/POST/DELETE /api/ai/personalize; versioned intake; conditional safety routing; existing deterministic training/nutrition generators; explicit vegan/pescatarian recipe filtering in the proposal; PubMed ESearch/ESummary/EFetch; OpenAI Responses strict structured output; source-ID and excerpt validation; user-isolated encrypted proposals; rate limits, token limits, deduplication leases, profile version checks, and generic evidence caching.

MODE: PREVIEW ONLY. Existing active plans, checkout, logs and public onboarding are not changed. The owner requested the questions for approval before the new questionnaire is installed. These APIs do not yet apply AI proposals to a live plan. No claim of a clinically validated injury rehabilitation system. Current pain, surgery, uncertainty or restrictions require professional review, not an LLM clearance. All retrieved research is unreviewed citation/abstract material, not full text. Mechanical citation checks cannot establish relevance or clinical suitability.

POST body: {intake, expectedProfileVersion}. Intake follows lib/ai/intake.ts. Explicit processingConsent and separate aiConsent. Unknown fields rejected. Names, email, user IDs, precise anthropometry and clinical free text are not sent to the model. External searches use only fixed topic queries. The model can only select IDs from prefiltered options; no tool may modify plans, macros, load, days or allergens. Replies always include activePlanChanged:false. DELETE removes only the caller's proposal history; account deletion cascades. Proposals expire after 7 days; physical cleanup is opportunistic, not a verified maximum retention period.

Required server config: OPENAI_API_KEY (enter securely in Railway), OPENAI_MODEL (initial evaluation: gpt-5.4-2026-03-05), AI_PERSONALIZATION_ENABLED=false, AI_QUESTIONS_APPROVED=false, AI_PRIVACY_APPROVED=false, AI_CONTENT_APPROVED=false, AI_MAX_DAILY_CALLS=100. Optional NCBI_API_KEY and NCBI_TOOL_EMAIL (operator contact, not customer's address). Default disabled. Setting a key does not override privacy/release gates. No keys are committed or logged. Do not silently switch vendors. store:false is not itself Zero Data Retention.

One bounded model call per new proposal, no calls on page refresh or ordinary meal swaps. Per-customer and global limits; per-user fingerprint includes normalized inputs, profile/catalog/prompt/model/date versions. Generic PubMed results cached for one day. Shared DB pacing below NCBI anonymous quota. Expired leases may be retried; no endless retry loop. On timeout/refusal/invalid JSON/source mismatch the active plan is unchanged.

Tests: tests/ai-personalization.test.ts uses synthetic providers, not live OpenAI responses. Existing integration suite also runs. Live model quality, live PubMed service behavior, clinical constraints, end-to-end questionnaire UX and automatic application remain separate acceptance gates. Do not mark these passed because a build passes.

The intended clinical purpose must be assessed before releasing injury treatment or rehabilitation recommendations. A disclaimer does not remove medical-device obligations. Privacy/DPA/retention/data-transfer assessment is required before sending real health data.

Official references checked 2026-10-09:
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/your-data
- https://developers.openai.com/api/docs/models/gpt-5.4
- https://www.nlm.nih.gov/dataguide/eutilities/utilities.html
- https://acsm.org/resistance-training-guidelines-update-2026/
- https://eparmedx.com/how-to-cite/
- https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/the-vegan-diet/
- https://laegemiddelstyrelsen.dk/da/udstyr/new-tech-nye-teknologiske-muligheder/faq-om-ai-i-medicinsk-udstyr/
