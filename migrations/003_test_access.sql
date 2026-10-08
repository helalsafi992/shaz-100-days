CREATE TABLE shaz_test_access (
  user_id text PRIMARY KEY REFERENCES shaz_user(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
