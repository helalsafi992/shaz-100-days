-- Additive: generated drafts are explicit proposals; confirmation alone writes active plans.
CREATE TABLE IF NOT EXISTS shaz_generated_plans (
 id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES shaz_user(id) ON DELETE CASCADE,
 fingerprint text NOT NULL, base_hash text NOT NULL, intake_hash text NOT NULL,
 status text NOT NULL CHECK(status IN ('running','ready','committed','failed')),
 encrypted_result text, created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',
 committed_at timestamptz, UNIQUE(user_id,fingerprint)
);
CREATE INDEX IF NOT EXISTS shaz_generated_plans_user ON shaz_generated_plans(user_id,created_at DESC);
