-- Additive: recommendations only. Existing active plans are never overwritten.
CREATE TABLE IF NOT EXISTS shaz_ai_proposals (
 user_id text NOT NULL REFERENCES shaz_user(id) ON DELETE CASCADE,
 fingerprint text NOT NULL, profile_version integer NOT NULL,
 status text NOT NULL CHECK(status IN ('running','ready','failed')),
 lease_id text NOT NULL, lease_until timestamptz NOT NULL,
 encrypted_result text, expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,fingerprint)
);
CREATE TABLE IF NOT EXISTS shaz_evidence_cache (topic text PRIMARY KEY,data jsonb NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS shaz_external_pacing (service text PRIMARY KEY,next_at timestamptz NOT NULL);
