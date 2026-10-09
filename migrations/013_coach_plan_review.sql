-- Every new client plan requires explicit, audited coach release.
ALTER TABLE shaz_generated_plans ADD COLUMN IF NOT EXISTS review_revision integer NOT NULL DEFAULT 1;
ALTER TABLE shaz_generated_plans ADD COLUMN IF NOT EXISTS reviewed_by text REFERENCES shaz_user(id);
ALTER TABLE shaz_generated_plans ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE shaz_generated_plans ADD COLUMN IF NOT EXISTS reviewed_digest text;
ALTER TABLE shaz_generated_plans ADD COLUMN IF NOT EXISTS review_note text;
ALTER TABLE shaz_generated_plans ALTER COLUMN expires_at SET DEFAULT now()+interval '7 days';
CREATE INDEX IF NOT EXISTS shaz_generated_review_queue ON shaz_generated_plans(status,created_at);
