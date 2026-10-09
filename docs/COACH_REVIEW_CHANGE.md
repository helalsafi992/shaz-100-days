# Coach-controlled plans, flexible cardio and bounded exercise replacement

- No automatic 20-minute ceiling on strength days or for beginners. The selected duration is preserved across forms. Up to seven daily slots; 1–1440 minutes are representational validation, not an exercise recommendation. Equipment/invalid input and explicit injury constraints remain.
- Three distinct replacements in the same movement/muscle group, with matching reps/time units and the session's actual equipment. Approved plans store bounded replacement groups. No fabricated third choice when equipment cannot support it.
- Existing set logs/drafts and completed sessions are retained when substituting; no copying the old exercise's performance into new sets.
- Customers submit preferences, receive an awaiting-review receipt, and cannot receive unpublished generated sessions via the client endpoint or self-publish a proposal.
- `/admin/plans` and `/api/admin/plan-reviews` require the existing owner role and verified MFA. The coach sees the full version, may swap exercises, then explicitly approves publication. The exact review revision, coach identity, timestamp, compiled hash and audit entry are written transactionally with publication.
- Stale views, changed intake/catalog, revoked access and client approval bypasses are rejected. Existing histories remain unchanged.
- Client screens use neutral product language. Privacy information still names OpenAI, its purpose, affected data and retention; removing a marketing field does not conceal a processor.
- No new admin account, production configuration, payment setting or real customer plan is changed by installation.

Verification requires typecheck, unit tests, isolated database/browser integration and user→pending→MFA coach→substitution→publication tests. These are technical checks with synthetic model responses, not clinical approval or a new live-provider evaluation.
