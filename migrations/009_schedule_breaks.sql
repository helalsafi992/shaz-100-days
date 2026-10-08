CREATE TABLE IF NOT EXISTS shaz_schedule_breaks (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES shaz_user(id) ON DELETE CASCADE,
  from_date date NOT NULL,
  to_date date NOT NULL CHECK(to_date>=from_date),
  restart text NOT NULL CHECK(restart IN ('normal','easy')),
  restart_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz
);
CREATE INDEX IF NOT EXISTS shaz_schedule_breaks_user_idx ON shaz_schedule_breaks(user_id,from_date,to_date);
