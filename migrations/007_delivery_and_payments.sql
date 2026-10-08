ALTER TABLE shaz_mail ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE IF NOT EXISTS shaz_payment_state(payment_id text PRIMARY KEY,refunded_amount integer NOT NULL DEFAULT 0,disputed boolean NOT NULL DEFAULT false,dispute_at bigint NOT NULL DEFAULT 0);
