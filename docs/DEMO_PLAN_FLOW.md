# Direct plan flow for the Shaz demonstration

The owner clarified that the current staging demonstration must behave as before: generate, show the full training/meal plan, then use it immediately. No OpenAI field or send-for-approval step is shown in the demo onboarding.

Direct delivery defaults only to the existing isolated, non-live staging environment. PLAN_DELIVERY_MODE=coach-review opts that environment back into review. The explicit direct-preview value can also be used by loopback-only APP_ENV=test tests without a Railway project. Production/live environments cannot use that switch to bypass review.

Coach submission, owner/MFA review and transactional approval remain available for the later launch; they are not part of the demonstration. Demo activation leaves all review identity/timestamp fields null and creates a separate audit action. Privacy information still identifies the actual processor, and previous affirmative consent is preserved; no consent is invented.

Unrestricted cardio, equivalent exercise choices, future-session substitution and recorded history are unchanged. No payment settings, roles, real approvals or production access are enabled.
