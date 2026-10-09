# SHAZ — task-first UI

Implemented directly on the existing app. Domain models, auth, payments, safety policies, storage, and existing editors are preserved.

- Daily primary action is chosen from real pending sessions; rest/completed/future/end are different states.
- Compact meal list, explicit planned/target/eaten figures, contextual actions and unchanged replacement/batch flows.
- One calendar for strength/cardio/other sport, correct selected dates, settings below the schedule.
- Same navigation on Today, Training, Food, Progress and Profile.
- Focused workout retains draft syncing, timers, exercise replacements and revision conflict handling.
- Public site is restyled without changing checkout or sales gates.

Validation is recorded in the GitHub Actions run. Live staging validation is separate and must not be inferred from local screenshots. No payments were opened.
