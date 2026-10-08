-- Additive migration. Existing account, entitlement and history rows remain intact.
ALTER TABLE shaz_days ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE shaz_cardio ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE shaz_shopping ADD COLUMN IF NOT EXISTS checked_grams numeric;
CREATE TABLE IF NOT EXISTS shaz_requests (
 id uuid PRIMARY KEY, user_id text REFERENCES shaz_user(id) ON DELETE SET NULL,
 kind text NOT NULL CHECK(kind IN ('support','withdrawal')), email text NOT NULL,
 order_reference text, message text NOT NULL, status text NOT NULL DEFAULT 'received',
 idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
-- Canonical convention is unchanged: 0=Sunday. Migration never shifts dates.
UPDATE shaz_profile SET data=data || jsonb_build_object(
 'weekdayConvention','sunday-zero-v1',
 'locations',jsonb_build_array(jsonb_build_object('id','legacy-'||(data->>'place'),'name',CASE WHEN data->>'place'='gym' THEN 'Fitnesscenter' ELSE 'Hjemme' END,'kind',data->>'place','equipment',data->'equipment')),
 'schedule',(SELECT COALESCE(jsonb_agg(jsonb_build_object('weekday',d,'locationId','legacy-'||(data->>'place'),'minutes',data->'minutes')),'[]'::jsonb) FROM jsonb_array_elements(data->'weekdays') d)
) WHERE NOT (data ? 'locations') AND data->>'place' IN ('home','gym');
