# SHAZ — 100 DAY TRANSFORMATION

Existing Next.js 16 / TypeScript / Tailwind application on Railway with PostgreSQL. Price: one payment of **399 DKK total**. Production sales remain disabled until the owner approves launch and all server-side readiness gates pass.

- `/`: SHAZ landing page and actual product screenshots from fictitious test accounts.
- `/preview`: public screenshots of the implemented customer platform.
- `/demo`: the original, clearly labelled in-memory presentation beta; no purchase or account.
- `/checkout`: real Stripe Checkout only when configured and approved; otherwise a clear closed-sales state.
- `/login` → `/onboarding` → `/app`: verified-email customer journey, persisted onboarding, explicit activation and 100 days.
- `/app/training`, `/app/food`, `/app/progress`, `/app/profile`: server-authorized customer tools.
- `/admin`: verified, invited administrators; versioned content, orders and operational status.

## Architecture

Better Auth magic links and PostgreSQL sessions; Stripe signature-checked, idempotent order fulfillment; encrypted transactional mail queue and signed Resend delivery events. Additive, checksummed SQL migrations preserve the existing database. Recipe nutrition is calculated from an imported, documented USDA dataset. Training adaptation is deterministic and documented, not AI personalization.

## Verification

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run test:integration
```

Integration tests start their own isolated PostgreSQL WASM instance over the PostgreSQL wire protocol, a production Next.js process, and Chromium. They never connect to the Railway production database. Payment events and e-mail delivery are local fixtures; actual Stripe test-account and mailbox verification remain separate release gates.

For local development, set variables from `.env.example` in a private environment file. Never commit secrets. `npm run db:migrate` applies new additive migrations. Production health checks also apply migrations under a lock before reporting readiness.

## Handover

- [Daily administration](docs/ADMIN.md)
- [Launch gates and exact environment variable names](docs/LAUNCH.md)
- [Content rules and nutrient source calculations](docs/CONTENT.md)
- [Operations, backups and restore scope](docs/OPERATIONS.md)
- [Test evidence and remaining external checks](docs/TEST-REPORT.md)

No fake reviews, invented business details, automatic admin assignment, production login bypass or real customer test-card charges are included.
