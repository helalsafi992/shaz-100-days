-- Additive Better Auth two-factor schema. Existing users/sessions stay valid.
ALTER TABLE shaz_user ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean DEFAULT false;
CREATE TABLE IF NOT EXISTS shaz_two_factor (
  id text PRIMARY KEY,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  "userId" text NOT NULL UNIQUE REFERENCES shaz_user(id) ON DELETE CASCADE,
  verified boolean NOT NULL DEFAULT true,
  "failedVerificationCount" integer NOT NULL DEFAULT 0,
  "lockedUntil" timestamptz
);
CREATE TABLE IF NOT EXISTS shaz_admin_mfa (
  session_id text PRIMARY KEY REFERENCES shaz_session(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES shaz_user(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
