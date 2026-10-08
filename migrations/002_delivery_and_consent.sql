ALTER TABLE shaz_checkout ADD COLUMN terms_version text NOT NULL DEFAULT '2026-10-platform-1';
ALTER TABLE shaz_checkout ADD COLUMN receipt jsonb NOT NULL DEFAULT '{}';
ALTER TABLE shaz_mail ADD COLUMN attempted_at timestamptz;
ALTER TABLE shaz_orders ADD COLUMN last_dispute_at bigint NOT NULL DEFAULT 0;
