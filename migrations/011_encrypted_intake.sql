-- Additive: separate encrypted, revocable answers. No change to existing users or paid plans.
CREATE TABLE IF NOT EXISTS shaz_ai_intake (
  user_id text PRIMARY KEY REFERENCES shaz_user(id) ON DELETE CASCADE,
  encrypted_answers text NOT NULL,
  schema_version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
