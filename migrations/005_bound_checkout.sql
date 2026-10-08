-- Additive: legacy checkouts remain usable by the verified legacy webhook path.
ALTER TABLE shaz_checkout ADD COLUMN user_id text REFERENCES shaz_user(id) ON DELETE SET NULL;
ALTER TABLE shaz_checkout ADD COLUMN state text NOT NULL DEFAULT 'legacy' CHECK(state IN ('legacy','active','complete','expired'));
CREATE UNIQUE INDEX shaz_checkout_one_active_user ON shaz_checkout(user_id) WHERE state='active';
CREATE INDEX shaz_checkout_account ON shaz_checkout(user_id,created_at DESC);
